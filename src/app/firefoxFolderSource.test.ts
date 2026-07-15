// @vitest-environment jsdom
// Task 4.1 (unit) — the Firefox ADAPTERS' pure tree-shaping + walk reuse. The engine-bound
// READ (File.text() over a real snapshot) is proven real-engine in firefoxFallback.browser
// .test.ts; here we prove the jsdom-testable half: that both input shapes fold into the SAME
// abstract tree and funnel through the SHARED walkPolicy (markdown-filter, skip-list, cap) —
// re-implementing no filtering — and land as a `persistable:false`, handle-less snapshot.
//
// The FileList path uses real `File` objects with a fabricated `webkitRelativePath` (the one
// bit a real chooser sets; the fold logic over it is ours and pure). The drag path uses fake
// Entries whose `file()` yields a `{ text }` stand-in, so the adapter's recurse + readEntries
// loop + reader wiring are exercised without depending on jsdom's Blob internals.

import { describe, it, expect } from 'vitest';
import {
  rootFromFileList,
  folderSourceFromFileList,
  folderSourceFromDataTransfer,
} from './firefoxFolderSource';

/** A real File carrying a fabricated `webkitRelativePath` (what a directory input sets). */
function relFile(rel: string, text = `# ${rel}`): File {
  const name = rel.split('/').pop() ?? rel;
  const file = new File([text], name, { type: 'text/markdown' });
  Object.defineProperty(file, 'webkitRelativePath', { value: rel, configurable: true });
  return file;
}

describe('rootFromFileList (pure fold: strips root name, builds the tree)', () => {
  it('names the folder from the shared leading segment and makes paths relative to it', () => {
    const { name, root } = rootFromFileList([
      relFile('my-repo/a.md'),
      relFile('my-repo/docs/b.md'),
    ]);
    expect(name).toBe('my-repo');
    expect(root.kind).toBe('directory');
  });

  it('falls back to a placeholder name when no relative path is present', () => {
    const bare = new File(['# x'], 'a.md');
    const { name } = rootFromFileList([bare]);
    expect(name).toBe('Selected folder');
  });
});

describe('folderSourceFromFileList (reuses walkPolicy; read-only snapshot)', () => {
  it('applies the markdown-filter + skip-list via the shared walk, with correct relative paths', async () => {
    const source = await folderSourceFromFileList([
      relFile('repo/index.md'),
      relFile('repo/guide.md'),
      relFile('repo/photo.png'), // non-markdown → filtered by the walk
      relFile('repo/docs/intro.md'),
      relFile('repo/docs/deep/nested.md'),
      relFile('repo/node_modules/ignored.md'), // skip-list → never collected
    ]);

    const paths = source.files.map((f) => f.path).sort();
    expect(paths).toEqual(['docs/deep/nested.md', 'docs/intro.md', 'guide.md', 'index.md']);
    expect(paths.some((p) => p.includes('node_modules'))).toBe(false);
    expect(paths.some((p) => p.endsWith('.png'))).toBe(false);
    expect(source.name).toBe('repo');
  });

  it('is a read-only snapshot: persistable:false and NO handle', async () => {
    const source = await folderSourceFromFileList([relFile('repo/a.md')]);
    expect(source.persistable).toBe(false);
    expect(source.handle).toBeUndefined();
  });

  it('honors the cap and reports truncated (bounded — a huge folder never hangs)', async () => {
    const files = Array.from({ length: 8 }, (_, i) => relFile(`repo/f${i}.md`));
    const source = await folderSourceFromFileList(files, { limits: { maxFiles: 3, maxDepth: 32 } });
    expect(source.files.length).toBe(3);
    expect(source.truncated).toBe(true);
  });

  it('an all-non-markdown folder yields the designed empty (zero files, not a crash)', async () => {
    const source = await folderSourceFromFileList([
      relFile('repo/a.png'),
      relFile('repo/b.txt'),
    ]);
    expect(source.files).toEqual([]);
    expect(source.truncated).toBe(false);
  });
});

// --- the folder-DROP Entries API adapter (recurse + readEntries loop + reader wiring) ------

/** A fake Entries-API file entry whose `file()` yields a `{ text }` stand-in. */
function fileEntry(name: string, text: string): FileSystemFileEntry {
  return {
    isFile: true,
    isDirectory: false,
    name,
    file: (ok: (f: File) => void) => ok({ text: async () => text } as unknown as File),
  } as unknown as FileSystemFileEntry;
}

/** A fake directory entry. `batches` is the sequence `readEntries()` returns (then []). */
function dirEntry(name: string, batches: FileSystemEntry[][]): FileSystemDirectoryEntry {
  return {
    isFile: false,
    isDirectory: true,
    name,
    createReader: () => {
      let i = 0;
      return {
        readEntries: (ok: (e: FileSystemEntry[]) => void) => ok(i < batches.length ? batches[i++] : []),
      };
    },
  } as unknown as FileSystemDirectoryEntry;
}

/** Wrap an entry as a dropped `DataTransferItem`. */
function dropItem(entry: FileSystemEntry): DataTransferItem {
  return { webkitGetAsEntry: () => entry } as unknown as DataTransferItem;
}

describe('folderSourceFromDataTransfer (drag → webkitGetAsEntry → recurse via shared walk)', () => {
  it('recurses the entry tree, applies the walk policy, and wires a working reader', async () => {
    const tree = dirEntry('repo', [
      [
        fileEntry('a.md', '# A body'),
        dirEntry('docs', [[fileEntry('b.md', '# B body')]]),
        fileEntry('c.png', 'x'), // non-markdown → filtered
        dirEntry('node_modules', [[fileEntry('x.md', '# skipped')]]), // skip-list
      ],
    ]);

    const source = await folderSourceFromDataTransfer([dropItem(tree)]);

    expect(source.name).toBe('repo');
    expect(source.persistable).toBe(false);
    expect(source.handle).toBeUndefined();
    const paths = source.files.map((f) => f.path).sort();
    expect(paths).toEqual(['a.md', 'docs/b.md']);

    // The reader is really wired to the entry's file() → text().
    const a = source.files.find((f) => f.name === 'a.md')!;
    expect(await a.read()).toBe('# A body');
  });

  it('loops readEntries across multiple non-empty batches (the 100/call cap)', async () => {
    // Two non-empty batches then the implicit empty terminator — both must be collected.
    const tree = dirEntry('repo', [
      [fileEntry('one.md', '1'), fileEntry('two.md', '2')],
      [fileEntry('three.md', '3')],
    ]);

    const source = await folderSourceFromDataTransfer([dropItem(tree)]);
    expect(source.files.map((f) => f.path).sort()).toEqual(['one.md', 'three.md', 'two.md']);
  });
});

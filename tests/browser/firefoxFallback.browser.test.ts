// Task 4.1 — the REAL-ENGINE Firefox read-only fallback proof: FileList → walk → tree →
// render, `persistable:false`, NO handle stored, zero network. [§9 feature-detect→fallback+
// note; §9 Firefox fallback] · plan.md §Sequencing item 5.
//
// This fallback exists BECAUSE of a Firefox platform limit (no `showDirectoryPicker`), so it
// is proven IN a real engine. The directory `<input>`'s OS chooser cannot be driven headlessly
// (Task 0, same as the Chromium native picker), so — exactly as Task 0 prescribes — the chooser
// is stubbed by NOT calling it, and the grant stand-in is a REAL `File[]` whose one fabricated
// bit is `webkitRelativePath` (the single value a real chooser sets; the fold over it is our
// pure code). Everything downstream is the real engine path: the real `File.text()` read, the
// real skip-list/markdown-filter/bounded walk (walkPolicy driving the fold), and the real M1
// `mount()` render. The webkitdirectory FileList path is engine-agnostic (webkitRelativePath +
// File.text() exist in both engines), so this runs REAL on BOTH instances — a stronger proof
// than a Firefox-only skip, and it confirms the fallback would work even on a picker-disabled
// Chromium (Brave / flag-gated), which is the SAME code path (no engine special-casing).
//
// NON-VACUOUS / RED-FIRST: the render assertions read ACTUAL File bytes and assert the rendered
// DOM contains text from those bytes — if the read path were short-circuited (read() → '') the
// heading would not appear and the test FAILS. Verified red by stubbing the file's read to
// return '' (recorded in progress.md). The BOUNDED behaviour is proven too: a low cap over the
// real File set yields `truncated:true` and a bounded file count. And the store proof asserts
// `persistable:false` (the cause) THEN a handle-less stored row (the effect) — a Firefox row
// that silently persisted a handle would fail it.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
// 5.8: read the zero only after a later request has landed (helpers/diagramWindow.ts).
import { isSentinel, wireSettled } from './helpers/diagramWindow';
import {
  folderSourceFromFileList,
  READ_ONLY_SNAPSHOT_NOTE,
} from '../../src/app/firefoxFolderSource';
import { mount } from '../../src/render/mount';
import { mountAppShell, type AppStore } from '../../src/app/appShell';
import type { FolderSource } from '../../src/app/folderSource';
import {
  putFolder,
  getFolders,
  describeStored,
  wipeAll,
  __resetConnectionForTest,
} from '../../src/app/store';

let seq = 0;
const nextId = () => `ff${(seq += 1)}-${Math.trunc(performance.now())}`;

/** A real File carrying a fabricated `webkitRelativePath` — the one bit a directory chooser
 *  sets. The File and its `.text()` read are entirely real (the engine-bound part). */
function relFile(rel: string, text = `# ${rel}`): File {
  const name = rel.split('/').pop() ?? rel;
  const file = new File([text], name, { type: 'text/markdown' });
  Object.defineProperty(file, 'webkitRelativePath', { value: rel, configurable: true });
  return file;
}

/** Poll until `fn()` is truthy — a fire-and-forget click's async chain (read + mount) can
 *  take more than one macrotask in a real engine (mirrors folderGrant.browser.test.ts). */
async function waitFor<T>(fn: () => T | null | undefined, tries = 100): Promise<T> {
  for (let i = 0; i < tries; i += 1) {
    const v = fn();
    if (v) return v;
    await new Promise<void>((r) => setTimeout(r, 20));
  }
  throw new Error('waitFor timed out');
}

/** A macrotask + rAF + settle — long enough for any fired request to reach Resource Timing. */
function flush(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => requestAnimationFrame(() => setTimeout(resolve, 60)), 120);
  });
}
function networkedUrls(): string[] {
  return performance
    .getEntriesByType('resource')
    .map((e) => e.name)
    .filter((name) => /^https?:/i.test(name) && !isSentinel(name));
}

/** A capturing store so the appShell integration needs no IndexedDB assertions in that slice. */
function fakeStore(): AppStore {
  return {
    putFolder: async () => undefined,
    deleteFolder: async () => undefined,
    putRecent: async () => undefined,
  };
}

describe('Firefox read-only fallback — real FileList → walk → tree → render', () => {
  it('folds a real File[] snapshot through the shared walk: filtered, skip-listed, correct paths', async () => {
    const source = await folderSourceFromFileList([
      relFile('my-repo/index.md', '# Index'),
      relFile('my-repo/guide.md', '# Guide'),
      relFile('my-repo/photo.png', 'not markdown'),
      relFile('my-repo/docs/intro.md', '# Intro'),
      relFile('my-repo/docs/deep/nested.md', '# Nested'),
      relFile('my-repo/node_modules/ignored.md', '# skipped'),
    ]);

    const paths = source.files.map((f) => f.path).sort();
    expect(paths).toEqual(['docs/deep/nested.md', 'docs/intro.md', 'guide.md', 'index.md']);
    expect(paths.some((p) => p.includes('node_modules'))).toBe(false);
    expect(paths.some((p) => p.endsWith('.png'))).toBe(false);
    // The read-only-snapshot honesty is carried in the SHARED interface.
    expect(source.name).toBe('my-repo');
    expect(source.persistable).toBe(false);
    expect(source.handle).toBeUndefined();
    expect(source.truncated).toBe(false);
  });

  it('reads a real File through the snapshot and renders it via the unchanged M1 mount()', async () => {
    const source = await folderSourceFromFileList([
      relFile('repo/doc.md', '# Real heading\n\nBody text from a **snapshot**.'),
    ]);
    const file = source.files.find((f) => f.name === 'doc.md')!;
    expect(file).toBeDefined();

    // Read the REAL bytes (non-vacuous: this is the path that FAILS if read() were stubbed).
    const text = await file.read();
    expect(text).toContain('Real heading');

    const host = document.createElement('peekover-root');
    document.body.appendChild(host);
    try {
      mount(text, host);
      expect(host.shadowRoot?.querySelector('h1')?.textContent).toContain('Real heading');
      expect(host.shadowRoot?.querySelector('strong')?.textContent).toContain('snapshot');
    } finally {
      host.remove();
    }
  });

  it('drives the FULL app-page flow on a snapshot: chip → read-only note → tree → reader render', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    try {
      const source = await folderSourceFromFileList([
        relFile('notes/hello.md', '# Notes render\n\nfrom the Firefox snapshot'),
      ]);
      // Inject an opener returning the REAL snapshot source — the stand-in for the chooser,
      // whose downstream (walk/read/render) is entirely real.
      const opener = async (): Promise<{ ok: true; source: FolderSource }> => ({ ok: true, source });
      const app = mountAppShell(container, { openFolder: opener, store: fakeStore() });

      await app.openFolder();

      // Chip shows the granted folder…
      expect(container.querySelector('.peekover-app__chip')?.textContent).toContain('granted:');
      // …the read-only-snapshot honesty note is shown (the exact copy the impl exports)…
      const note = container.querySelector('[data-state="read-only-snapshot"]');
      expect(note?.textContent).toBe(READ_ONLY_SNAPSHOT_NOTE);
      // HUMAN RULING 2026-11-10 (picker-route wording): files read fresh, so the note no longer calls the missing
      // Watch a platform limitation; it names the route that watches.
      expect(note?.textContent).not.toMatch(/platform limitation/i);
      expect(note?.textContent).toMatch(/drag the folder in instead/i);
      // …and the walked file appears as a file treeitem.
      const fileBtn = container.querySelector<HTMLButtonElement>('[role="treeitem"][data-kind="file"]');
      expect(fileBtn?.textContent).toBe('hello.md');

      // Select it → the reader renders the file's real content through mount().
      fileBtn!.click();
      const h1 = await waitFor(() =>
        container.querySelector('.peekover-app__reader__host')?.shadowRoot?.querySelector('h1'),
      );
      expect(h1.textContent).toContain('Notes render');
    } finally {
      container.remove();
    }
  });

  it('a pathological (over-cap) snapshot does NOT hang or blank — it reports truncated, bounded', async () => {
    const files = Array.from({ length: 8 }, (_, i) => relFile(`repo/f${i}.md`, `# ${i}`));
    const source = await folderSourceFromFileList(files, { limits: { maxFiles: 3, maxDepth: 32 } });
    expect(source.files.length).toBe(3);
    expect(source.truncated).toBe(true);
  });

  it('an empty snapshot (no markdown) yields zero files (designed empty, not a crash)', async () => {
    const source = await folderSourceFromFileList([
      relFile('repo/a.png', 'x'),
      relFile('repo/b.txt', 'y'),
    ]);
    expect(source.files).toEqual([]);
    expect(source.truncated).toBe(false);
  });
});

describe('Firefox fallback — stores NO handle (snapshot is not persistable)', () => {
  beforeEach(async () => {
    await wipeAll();
  });
  afterEach(() => {
    __resetConnectionForTest();
  });

  it('a snapshot folder persists as a metadata-only row: persistable:false → no stored handle', async () => {
    const source = await folderSourceFromFileList([relFile('repo/a.md', '# A')]);

    // Cause: the snapshot is not persistable.
    expect(source.persistable).toBe(false);

    // Effect: appShell's store-write rule stores a handle ONLY when persistable — so a Firefox
    // snapshot writes a handle-less row (this mirrors appShell.runOpenFolder verbatim).
    const folderId = nextId();
    await putFolder({
      id: folderId,
      name: source.name,
      handle: source.persistable ? source.handle : undefined,
      addedAt: performance.now(),
      lastOpenedAt: performance.now(),
    });

    const row = (await getFolders()).find((f) => f.id === folderId)!;
    expect(row).toBeDefined();
    expect(row.name).toBe('repo');
    // Real IndexedDB read-back: NO handle was persisted for the snapshot.
    expect(row.handle).toBeUndefined();
    // …and the transparency view reports it honestly as metadata-only (not persisted).
    const summary = await describeStored();
    expect(summary.folders.find((f) => f.id === folderId)?.persisted).toBe(false);
  });
});

describe('Firefox fallback — zero network (bytes on the wire)', () => {
  let host: HTMLElement;
  beforeEach(() => {
    performance.clearResourceTimings();
    host = document.createElement('peekover-root');
    document.body.appendChild(host);
  });
  afterEach(() => {
    host.remove();
  });

  it('open (FileList) + walk + read + render fire ZERO network requests', async () => {
    performance.clearResourceTimings();

    const source = await folderSourceFromFileList([
      relFile('repo/index.md', '# Index heading\n\nLocal body.'),
      relFile('repo/docs/guide.md', '# Guide heading\n\nMore local text.'),
    ]);
    expect(source.files.length).toBe(2);

    const file = source.files.find((f) => f.name === 'index.md')!;
    mount(await file.read(), host);
    expect(host.shadowRoot?.querySelector('h1')?.textContent).toContain('Index heading');

    await wireSettled();

    // GROUND TRUTH: not one http(s) request hit the wire across the whole snapshot path
    // (FileList + File.text() are on-device; there is no fetch anywhere).
    expect(networkedUrls()).toEqual([]);

    // NON-VACUOUS control: a same-origin fetch DOES land in the buffer — the observer works.
    const probe = new URL(`/__peekover_ff_probe__/${nextId()}.txt`, location.origin).href;
    await fetch(probe).catch(() => undefined);
    await flush();
    expect(networkedUrls()).toContain(probe);
  });
});

// Task 3.3 — the PURE tree model. No engine, no DOM: buildTree folds a flat MarkdownFile[]
// into a nested directory model, and filterTree narrows it by name. These are the
// structure decisions the treeView renders but never re-derives, so they are unit-tested
// here in isolation (the M1 pure/DOM split).

import { describe, it, expect } from 'vitest';
import { buildTree, filterTree, countFiles, type TreeDirNode } from './tree';
import type { MarkdownFile } from './folderSource';

function mdFile(path: string): MarkdownFile {
  return { path, name: path.split('/').pop() ?? path, read: async () => `# ${path}` };
}

/** Names of a directory's immediate children, in order. */
function childNames(dir: TreeDirNode): string[] {
  return dir.children.map((c) => c.name);
}

describe('buildTree', () => {
  it('places top-level files directly under the root', () => {
    const tree = buildTree([mdFile('a.md'), mdFile('b.md')]);
    expect(tree.kind).toBe('directory');
    expect(tree.path).toBe('');
    expect(childNames(tree)).toEqual(['a.md', 'b.md']);
    expect(tree.children.every((c) => c.kind === 'file')).toBe(true);
  });

  it('nests files under their directory chain, sharing intermediate dirs', () => {
    const tree = buildTree([mdFile('docs/intro.md'), mdFile('docs/guide.md'), mdFile('docs/deep/x.md')]);
    // One shared `docs` dir at the root.
    expect(childNames(tree)).toEqual(['docs']);
    const docs = tree.children[0] as TreeDirNode;
    expect(docs.kind).toBe('directory');
    expect(docs.path).toBe('docs');
    // docs holds the `deep` dir (dirs first) then the two files, alpha.
    expect(childNames(docs)).toEqual(['deep', 'guide.md', 'intro.md']);
    const deep = docs.children[0] as TreeDirNode;
    expect(deep.path).toBe('docs/deep');
    expect(childNames(deep)).toEqual(['x.md']);
  });

  it('orders directories before files, each alphabetical (case-insensitive)', () => {
    const tree = buildTree([mdFile('Zeta.md'), mdFile('alpha.md'), mdFile('sub/a.md'), mdFile('Beta/b.md')]);
    // Dirs first (Beta, sub), then files (alpha.md, Zeta.md) — case-insensitive.
    expect(childNames(tree)).toEqual(['Beta', 'sub', 'alpha.md', 'Zeta.md']);
  });

  it('carries the underlying MarkdownFile on each leaf', async () => {
    const tree = buildTree([mdFile('docs/intro.md')]);
    const docs = tree.children[0] as TreeDirNode;
    const leaf = docs.children[0];
    expect(leaf.kind).toBe('file');
    if (leaf.kind === 'file') {
      expect(leaf.path).toBe('docs/intro.md');
      expect(await leaf.file.read()).toContain('docs/intro.md');
    }
  });

  it('an empty file list builds an empty root', () => {
    const tree = buildTree([]);
    expect(tree.children).toEqual([]);
    expect(countFiles(tree)).toBe(0);
  });

  it('does not mutate its input', () => {
    const files = [mdFile('a.md')];
    const snapshot = files.map((f) => f.path);
    buildTree(files);
    expect(files.map((f) => f.path)).toEqual(snapshot);
  });
});

describe('filterTree — narrows by name', () => {
  const base = () =>
    buildTree([
      mdFile('readme.md'),
      mdFile('docs/intro.md'),
      mdFile('docs/guide.md'),
      mdFile('docs/deep/setup.md'),
      mdFile('src/notes.md'),
    ]);

  it('an empty query returns the tree unchanged', () => {
    const tree = base();
    expect(filterTree(tree, '')).toBe(tree);
    expect(filterTree(tree, '   ')).toBe(tree);
  });

  it('a filename query narrows to matching files, keeping only their ancestor dirs', () => {
    const filtered = filterTree(base(), 'intro');
    // Only docs/ survives, holding only intro.md.
    expect(childNames(filtered)).toEqual(['docs']);
    const docs = filtered.children[0] as TreeDirNode;
    expect(childNames(docs)).toEqual(['intro.md']);
    expect(countFiles(filtered)).toBe(1);
  });

  it('is case-insensitive', () => {
    expect(countFiles(filterTree(base(), 'INTRO'))).toBe(1);
  });

  it('a folder-name query narrows to that folder\'s files', () => {
    const filtered = filterTree(base(), 'docs');
    expect(childNames(filtered)).toEqual(['docs']);
    // All three docs files (intro, guide, deep/setup) match on the `docs/` path prefix.
    expect(countFiles(filtered)).toBe(3);
  });

  it('a no-match query yields an empty tree (the view shows a no-matches state)', () => {
    const filtered = filterTree(base(), 'zzzznope');
    expect(filtered.children).toEqual([]);
    expect(countFiles(filtered)).toBe(0);
  });

  it('does not mutate the input tree', () => {
    const tree = base();
    const before = countFiles(tree);
    filterTree(tree, 'intro');
    expect(countFiles(tree)).toBe(before);
  });
});

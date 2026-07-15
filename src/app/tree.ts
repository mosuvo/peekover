// tree — PURE tree model over a flat `MarkdownFile[]`. No DOM, no engine. Spec 002 §3.3.
//
// The walk (walkPolicy → folderSource) hands up a FLAT list of markdown files, each with a
// slash-separated `path`. This module folds that flat list into the nested directory model
// the tree view renders, and narrows it by a name query. Both operations are pure
// functions returning fresh values — so the "build tree from files" and "filter narrows by
// name" behaviours are unit-tested in isolation (tree.test.ts), the same pure/DOM split M1
// used for `classifyReaderOutcome`. `treeView` renders what this computes; it re-derives
// none of the structure.

import type { MarkdownFile } from './folderSource';

/** A file leaf in the tree — wraps the `MarkdownFile` with its display name + path. */
export interface TreeFileNode {
  kind: 'file';
  /** The file's own name, e.g. `intro.md`. */
  name: string;
  /** Slash-separated path from the folder root, e.g. `docs/intro.md`. */
  path: string;
  /** The underlying file, handed to the reader on select. */
  file: MarkdownFile;
}

/** A directory node — a named group of child nodes (dirs first, then files). */
export interface TreeDirNode {
  kind: 'directory';
  /** The directory's own name; `''` for the synthetic root. */
  name: string;
  /** Slash-separated path of this directory (`''` for the root). */
  path: string;
  /** Child nodes, ordered directories-first then files, each alphabetical. */
  children: TreeNode[];
}

export type TreeNode = TreeFileNode | TreeDirNode;

/** Order: directories before files, then case-insensitive by name (stable + predictable). */
function compareNodes(a: TreeNode, b: TreeNode): number {
  if (a.kind !== b.kind) return a.kind === 'directory' ? -1 : 1;
  return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
}

/** Recursively sort a directory's children (dirs first, then alpha), in place-free style. */
function sortDir(dir: TreeDirNode): TreeDirNode {
  const children = dir.children.map((c) => (c.kind === 'directory' ? sortDir(c) : c));
  children.sort(compareNodes);
  return { ...dir, children };
}

/**
 * PURE: build a nested tree from a flat `MarkdownFile[]`. Each file's `path` is split on
 * `/`; intermediate directories are created as needed and shared, and the file lands as a
 * leaf under its parent. The result is a synthetic root `TreeDirNode` (name `''`) whose
 * children are the top-level entries, sorted directories-first then alphabetical. A file
 * whose path has no `/` sits directly under the root. Input is never mutated.
 */
export function buildTree(files: readonly MarkdownFile[]): TreeDirNode {
  const root: TreeDirNode = { kind: 'directory', name: '', path: '', children: [] };

  for (const file of files) {
    const segments = file.path.split('/').filter((s) => s.length > 0);
    if (segments.length === 0) continue; // defensive: a pathless entry has no place in a tree
    const fileName = segments[segments.length - 1];
    const dirSegments = segments.slice(0, -1);

    // Descend/create the directory chain.
    let dir = root;
    let prefix = '';
    for (const seg of dirSegments) {
      prefix = prefix ? `${prefix}/${seg}` : seg;
      let next = dir.children.find(
        (c): c is TreeDirNode => c.kind === 'directory' && c.name === seg,
      );
      if (!next) {
        next = { kind: 'directory', name: seg, path: prefix, children: [] };
        dir.children.push(next);
      }
      dir = next;
    }
    dir.children.push({ kind: 'file', name: fileName, path: file.path, file });
  }

  return sortDir(root);
}

/**
 * PURE: narrow a tree by a name query. A file is kept iff its PATH contains `query`
 * (case-insensitive), so typing a filename narrows to that file and typing a folder name
 * narrows to that folder's contents. A directory is kept iff it has any surviving
 * descendant. An empty/whitespace query returns the tree unchanged. Returns a fresh tree;
 * the input is never mutated.
 */
export function filterTree(tree: TreeDirNode, query: string): TreeDirNode {
  const q = query.trim().toLowerCase();
  if (q === '') return tree;

  function filterDir(dir: TreeDirNode): TreeDirNode {
    const children: TreeNode[] = [];
    for (const child of dir.children) {
      if (child.kind === 'file') {
        if (child.path.toLowerCase().includes(q)) children.push(child);
      } else {
        const sub = filterDir(child);
        if (sub.children.length > 0) children.push(sub);
      }
    }
    return { ...dir, children };
  }

  return filterDir(tree);
}

/** Count the file leaves in a tree (for "N files" / empty-state decisions in the view). */
export function countFiles(tree: TreeDirNode): number {
  let n = 0;
  for (const child of tree.children) {
    n += child.kind === 'file' ? 1 : countFiles(child);
  }
  return n;
}

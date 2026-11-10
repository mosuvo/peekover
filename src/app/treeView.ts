// treeView — the DOM view over the pure `tree` model: a searchable, keyboard-operable file
// tree that surfaces the folder's markdown files and the 3.2 "folder too large" state.
// Spec 002 §3.3. DOM-only glue; every structure/filter DECISION lives in the pure `tree`
// module (buildTree / filterTree), which this renders but never re-derives.
//
// a11y: an ARIA tree (`role=tree` → `role=treeitem` → `role=group`) with roving tabindex
// and full keyboard nav (Up/Down/Home/End to move, Left/Right to collapse/expand a folder,
// Enter/Space to open a file). The search box is a labelled `type=search` input that
// re-filters live. Never blank: an empty folder, a no-match query, and the too-large walk
// each render a designed state (AGENTS.md #5).
//
// Self-contained styling (mirrors readerPane): an own `<style>` reading the shell's design
// tokens by inheritance with plain fallbacks, so it also renders sensibly in a focused test.

import type { MarkdownFile } from './folderSource';
import { buildTree, filterTree, countFiles, type TreeDirNode, type TreeNode } from './tree';

/** Options for a tree view: the walked files, whether the walk was capped, and a select cb. */
export interface TreeViewOptions {
  files: readonly MarkdownFile[];
  /** True iff the walk hit the cap — surfaces the "folder too large" designed state. */
  truncated?: boolean;
  /** Called when a file treeitem is activated (Enter/Space/click). */
  onSelect(file: MarkdownFile): void;
}

export interface TreeViewController {
  /** The view root — the caller slots this into the folder pane. */
  readonly element: HTMLElement;
  /** Mark the file open in the reader (`aria-current="page"`), or none; kept across search repaints. */
  setCurrent(path: string | null): void;
}

const TREE_CLASS = 'peekover-tree';

const TREE_CSS = /* css */ `
.${TREE_CLASS}{display:flex; flex-direction:column; gap:.6rem; min-width:0}
.${TREE_CLASS}__search{
  font:inherit; font-size:13px; width:100%; color:var(--ink); background:var(--panel);
  border:1px solid var(--line); border-radius:8px; padding:7px 10px; appearance:none;
}
.${TREE_CLASS}__search::placeholder{color:var(--muted); opacity:1}
.${TREE_CLASS}__list{display:flex; flex-direction:column; gap:1px; min-width:0}
.${TREE_CLASS}__children{display:flex; flex-direction:column; gap:1px; margin-left:18px; border-left:1px dashed var(--line); padding-left:6px}
.${TREE_CLASS}__item{
  font:inherit; font-size:13px; text-align:left; width:100%; color:var(--muted); background:transparent;
  border:0; border-radius:7px; padding:6px 8px; cursor:pointer; transition:background-color .15s,color .15s;
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:flex; gap:8px; align-items:center;
}
.${TREE_CLASS}__item:hover{background:var(--panel); color:var(--ink)}
.${TREE_CLASS}__item[aria-current="page"]{background:var(--accent-soft); color:var(--accent); font-weight:600}
.${TREE_CLASS}__twist{font-family:var(--mono); font-size:11px; color:var(--faint,#8F91A0); width:14px; text-align:center; flex:0 0 auto}
`;

/** Build the persistent style element. */
function buildStyle(doc: Document): HTMLStyleElement {
  const style = doc.createElement('style');
  style.textContent = TREE_CSS;
  return style;
}

/**
 * Create a tree view. Owns a search input + a repainted body; typing re-filters via the
 * pure `filterTree`, and selecting a file calls `onSelect`. Directories start expanded so
 * the whole set (and any search match) is visible; Left/Right collapse/expand them.
 */
export function createTreeView(doc: Document, opts: TreeViewOptions): TreeViewController {
  const { files, truncated, onSelect } = opts;

  const element = doc.createElement('div');
  element.className = TREE_CLASS;

  // Search box (persistent — never re-created, so typing keeps focus).
  const search = doc.createElement('input');
  search.type = 'search';
  search.className = `${TREE_CLASS}__search`;
  search.setAttribute('aria-label', 'Search files');
  search.placeholder = 'Search files…';

  // The too-large notice (persistent; the walk result doesn't change while open).
  const notice =
    truncated
      ? (() => {
          const p = doc.createElement('p');
          p.className = `${TREE_CLASS}__notice`;
          p.setAttribute('data-state', 'too-large');
          p.textContent =
            'This folder is very large — the list shows the files scanned before the limit. Open a more specific folder to see everything.';
          return p;
        })()
      : null;

  // The repainted body (the tree, or a designed empty/no-match state).
  const body = doc.createElement('div');
  body.className = `${TREE_CLASS}__body`;

  const fullTree = buildTree(files);
  // The file open in the reader — drawn as the open row, and re-marked on every repaint.
  let current: string | null = null;
  // Element → node map, rebuilt each render, so key handlers can resolve a treeitem.
  let nodeOf = new Map<HTMLElement, TreeNode>();

  element.append(buildStyle(doc), search);
  if (notice) element.append(notice);
  element.append(body);

  /** Set the roving-tabindex focus to `el` (all others -1) and focus it. */
  function setActive(el: HTMLElement): void {
    for (const it of body.querySelectorAll<HTMLElement>('[role="treeitem"]')) {
      it.tabIndex = -1;
    }
    el.tabIndex = 0;
    el.focus();
  }

  /** Is a treeitem currently visible (no collapsed [role=group] ancestor within the body)? */
  function isVisible(el: HTMLElement): boolean {
    let p = el.parentElement;
    while (p && p !== body) {
      if (p.getAttribute('role') === 'group' && p.hasAttribute('hidden')) return false;
      p = p.parentElement;
    }
    return true;
  }

  /** The visible treeitems in DOM (document) order — the arrow-key navigation ring. */
  function visibleItems(): HTMLElement[] {
    return [...body.querySelectorAll<HTMLElement>('[role="treeitem"]')].filter(isVisible);
  }

  /** Expand/collapse a directory treeitem (its sibling group is shown/hidden). */
  function setExpanded(dirItem: HTMLElement, expanded: boolean): void {
    dirItem.setAttribute('aria-expanded', String(expanded));
    const twist = dirItem.querySelector(`.${TREE_CLASS}__twist`);
    if (twist) twist.textContent = expanded ? '▾' : '▸';
    const group = dirItem.nextElementSibling;
    if (group && group.getAttribute('role') === 'group') {
      if (expanded) group.removeAttribute('hidden');
      else group.setAttribute('hidden', '');
    }
  }

  /** Activate a treeitem: open a file, or toggle a directory. */
  function activate(el: HTMLElement): void {
    const node = nodeOf.get(el);
    if (!node) return;
    if (node.kind === 'file') {
      onSelect(node.file);
    } else {
      setExpanded(el, el.getAttribute('aria-expanded') !== 'true');
    }
  }

  /** Render one node into `parent` (a11y roles; a folder's children nest in its group, which indents them). */
  function renderNode(node: TreeNode, parent: HTMLElement): void {
    const item = doc.createElement('button');
    item.type = 'button';
    item.className = `${TREE_CLASS}__item ${node.kind === 'directory' ? `${TREE_CLASS}__dir` : ''}`.trim();
    item.setAttribute('role', 'treeitem');
    item.tabIndex = -1;
    item.dataset.path = node.path;
    nodeOf.set(item, node);

    if (node.kind === 'directory') {
      item.setAttribute('aria-expanded', 'true');
      const twist = doc.createElement('span');
      twist.className = `${TREE_CLASS}__twist`;
      twist.textContent = '▾';
      twist.setAttribute('aria-hidden', 'true');
      const label = doc.createElement('span');
      label.textContent = node.name;
      item.append(twist, label);
      item.addEventListener('click', () => activate(item));
      parent.append(item);

      const group = doc.createElement('div');
      group.setAttribute('role', 'group');
      group.className = `${TREE_CLASS}__children`;
      for (const child of node.children) renderNode(child, group);
      parent.append(group);
    } else {
      item.dataset.kind = 'file';
      if (node.path === current) item.setAttribute('aria-current', 'page');
      const label = doc.createElement('span');
      label.textContent = node.name;
      item.append(label);
      item.addEventListener('click', () => activate(item));
      parent.append(item);
    }
  }

  /** Paint the body for the current query: the tree, or a designed empty/no-match state. */
  function paint(query: string): void {
    nodeOf = new Map();

    if (files.length === 0) {
      const p = doc.createElement('p');
      p.className = `${TREE_CLASS}__empty`;
      p.setAttribute('data-state', 'empty-folder');
      p.textContent = 'No markdown files in this folder.';
      body.replaceChildren(p);
      return;
    }

    const view: TreeDirNode = filterTree(fullTree, query);
    if (countFiles(view) === 0) {
      const p = doc.createElement('p');
      p.className = `${TREE_CLASS}__empty`;
      p.setAttribute('data-state', 'no-matches');
      p.textContent = `No files match “${query.trim()}”.`;
      body.replaceChildren(p);
      return;
    }

    const list = doc.createElement('div');
    list.setAttribute('role', 'tree');
    list.setAttribute('aria-label', 'Files');
    list.className = `${TREE_CLASS}__list`;
    for (const child of view.children) renderNode(child, list);
    body.replaceChildren(list);

    // Roving tabindex: the first visible treeitem is the single tab stop.
    const first = visibleItems()[0];
    if (first) first.tabIndex = 0;
  }

  // Keyboard nav on the tree (delegated).
  body.addEventListener('keydown', (event: KeyboardEvent) => {
    const target = (event.target as HTMLElement | null)?.closest<HTMLElement>('[role="treeitem"]');
    if (!target) return;
    const list = visibleItems();
    const idx = list.indexOf(target);

    switch (event.key) {
      case 'ArrowDown':
        if (idx >= 0 && idx < list.length - 1) setActive(list[idx + 1]);
        event.preventDefault();
        break;
      case 'ArrowUp':
        if (idx > 0) setActive(list[idx - 1]);
        event.preventDefault();
        break;
      case 'Home':
        if (list[0]) setActive(list[0]);
        event.preventDefault();
        break;
      case 'End':
        if (list.length) setActive(list[list.length - 1]);
        event.preventDefault();
        break;
      case 'Enter':
      case ' ':
        activate(target);
        event.preventDefault();
        break;
      case 'ArrowRight':
        if (nodeOf.get(target)?.kind === 'directory') {
          if (target.getAttribute('aria-expanded') !== 'true') setExpanded(target, true);
          else {
            const next = list[idx + 1];
            if (next) setActive(next);
          }
        }
        event.preventDefault();
        break;
      case 'ArrowLeft':
        if (nodeOf.get(target)?.kind === 'directory' && target.getAttribute('aria-expanded') === 'true') {
          setExpanded(target, false);
        }
        event.preventDefault();
        break;
      default:
        return;
    }
  });

  search.addEventListener('input', () => paint(search.value));

  paint('');

  function setCurrent(path: string | null): void {
    current = path;
    for (const it of body.querySelectorAll<HTMLElement>('[role="treeitem"][data-kind="file"]')) {
      if (it.dataset.path === path) it.setAttribute('aria-current', 'page');
      else it.removeAttribute('aria-current');
    }
  }

  return { element, setCurrent };
}

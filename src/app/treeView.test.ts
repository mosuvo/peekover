// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { createTreeView } from './treeView';
import type { MarkdownFile } from './folderSource';

// Task 3.3 [§9 tree filter narrows by name]. DOM-shape + keyboard behaviour of the tree
// view over the pure `tree` model: renders an ARIA tree + search box, the search narrows
// live, keyboard nav moves a roving tabindex and expands/collapses folders, selecting a
// file fires onSelect, and the empty / no-match / too-large states each render (never blank).

function mdFile(path: string): MarkdownFile {
  return { path, name: path.split('/').pop() ?? path, read: async () => `# ${path}` };
}

/** Dispatch a bubbling keydown from an element (so the delegated body handler sees it). */
function key(el: Element, k: string): void {
  el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
}

/** Visible (not inside a hidden group) file+dir treeitems, in DOM order. */
function visibleItems(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>('[role="treeitem"]')].filter((el) => {
    let p = el.parentElement;
    while (p && p !== root) {
      if (p.getAttribute('role') === 'group' && p.hasAttribute('hidden')) return false;
      p = p.parentElement;
    }
    return true;
  });
}

describe('treeView — render + a11y', () => {
  let host: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    host = document.body;
  });

  it('renders a labelled search box and an ARIA tree with the files', () => {
    const view = createTreeView(document, {
      files: [mdFile('a.md'), mdFile('docs/b.md')],
      onSelect: () => {},
    });
    host.append(view.element);

    const search = view.element.querySelector<HTMLInputElement>('input[type="search"]');
    expect(search).not.toBeNull();
    expect(search!.getAttribute('aria-label')).toMatch(/search/i);

    const tree = view.element.querySelector('[role="tree"]');
    expect(tree).not.toBeNull();
    // A directory node (docs) and file leaves (a.md, b.md) as treeitems.
    expect(view.element.querySelector('[role="group"]')).not.toBeNull();
    const fileItems = [...view.element.querySelectorAll('[data-kind="file"]')].map((e) => e.textContent);
    expect(fileItems.sort()).toEqual(['a.md', 'b.md']);
  });

  it('the first visible treeitem is the single tab stop (roving tabindex)', () => {
    const view = createTreeView(document, { files: [mdFile('a.md'), mdFile('b.md')], onSelect: () => {} });
    host.append(view.element);
    const items = visibleItems(view.element);
    expect(items[0].tabIndex).toBe(0);
    expect(items.slice(1).every((it) => it.tabIndex === -1)).toBe(true);
  });

  it('shows the designed empty-folder state when there are no files (never blank)', () => {
    const view = createTreeView(document, { files: [], onSelect: () => {} });
    host.append(view.element);
    const empty = view.element.querySelector('[data-state="empty-folder"]');
    expect(empty).not.toBeNull();
    expect(empty!.textContent).toMatch(/no markdown/i);
  });

  it('surfaces the "folder too large" state when truncated', () => {
    const view = createTreeView(document, { files: [mdFile('a.md')], truncated: true, onSelect: () => {} });
    host.append(view.element);
    const notice = view.element.querySelector('[data-state="too-large"]');
    expect(notice).not.toBeNull();
    expect(notice!.textContent).toMatch(/large/i);
  });
});

describe('treeView — search narrows by name', () => {
  let view: ReturnType<typeof createTreeView>;

  beforeEach(() => {
    document.body.innerHTML = '';
    view = createTreeView(document, {
      files: [mdFile('readme.md'), mdFile('docs/intro.md'), mdFile('docs/guide.md')],
      onSelect: () => {},
    });
    document.body.append(view.element);
  });

  function search(q: string): void {
    const input = view.element.querySelector<HTMLInputElement>('input[type="search"]')!;
    input.value = q;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  it('narrows to the matching file as the query is typed', () => {
    expect(view.element.querySelectorAll('[data-kind="file"]')).toHaveLength(3);
    search('intro');
    const files = [...view.element.querySelectorAll('[data-kind="file"]')].map((e) => e.textContent);
    expect(files).toEqual(['intro.md']);
  });

  it('shows a designed no-matches state for a query that matches nothing', () => {
    search('zzznope');
    const none = view.element.querySelector('[data-state="no-matches"]');
    expect(none).not.toBeNull();
    expect(none!.textContent).toMatch(/no files match/i);
  });

  it('restores the full tree when the query is cleared', () => {
    search('intro');
    expect(view.element.querySelectorAll('[data-kind="file"]')).toHaveLength(1);
    search('');
    expect(view.element.querySelectorAll('[data-kind="file"]')).toHaveLength(3);
  });
});

describe('treeView — keyboard nav', () => {
  let view: ReturnType<typeof createTreeView>;
  let selected: string[];

  beforeEach(() => {
    document.body.innerHTML = '';
    selected = [];
    view = createTreeView(document, {
      files: [mdFile('docs/b.md'), mdFile('docs/c.md'), mdFile('a.md')],
      onSelect: (f) => selected.push(f.path),
    });
    document.body.append(view.element);
  });

  it('ArrowDown / ArrowUp move the roving focus through visible items', () => {
    const items = visibleItems(view.element); // [docs, b.md, c.md, a.md]
    items[0].focus();
    key(items[0], 'ArrowDown');
    expect(document.activeElement).toBe(items[1]);
    expect(items[1].tabIndex).toBe(0);
    key(items[1], 'ArrowUp');
    expect(document.activeElement).toBe(items[0]);
  });

  it('Home / End jump to the first / last visible item', () => {
    const items = visibleItems(view.element);
    items[0].focus();
    key(items[0], 'End');
    expect(document.activeElement).toBe(items[items.length - 1]);
    key(document.activeElement!, 'Home');
    expect(document.activeElement).toBe(items[0]);
  });

  it('ArrowLeft collapses a folder (its files leave the visible ring); ArrowRight re-expands', () => {
    const docsDir = view.element.querySelector<HTMLElement>('.peekover-tree__dir')!;
    expect(docsDir.getAttribute('aria-expanded')).toBe('true');
    expect(visibleItems(view.element)).toHaveLength(4); // docs, b, c, a

    key(docsDir, 'ArrowLeft');
    expect(docsDir.getAttribute('aria-expanded')).toBe('false');
    // b.md and c.md are now inside a hidden group → gone from the visible ring (only the
    // docs dir itself and the root-level a.md remain).
    const visible = visibleItems(view.element);
    expect(visible).toHaveLength(2);
    const visibleFiles = visible.filter((e) => e.dataset.kind === 'file').map((e) => e.textContent);
    expect(visibleFiles).toEqual(['a.md']);

    key(docsDir, 'ArrowRight');
    expect(docsDir.getAttribute('aria-expanded')).toBe('true');
    expect(visibleItems(view.element)).toHaveLength(4);
  });

  it('Enter on a file activates onSelect with that file', () => {
    const fileItem = view.element.querySelector<HTMLElement>('[data-kind="file"]')!;
    fileItem.focus();
    key(fileItem, 'Enter');
    expect(selected).toHaveLength(1);
    // The first file treeitem is b.md (docs expanded, dirs first, alpha).
    expect(selected[0]).toBe('docs/b.md');
  });

  it('clicking a file also activates onSelect', () => {
    const fileItem = view.element.querySelector<HTMLButtonElement>('[data-kind="file"]')!;
    fileItem.click();
    expect(selected).toHaveLength(1);
  });
});

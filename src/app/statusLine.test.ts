// @vitest-environment jsdom
// statusLine — the unit half of 013 task 4.7 (D-9). Each statement false-then-true:
//   1. the open file: A then B shows B; no file clears it — through every route the shell has (the tree,
//      a recent, a pin, the `selectFile` seam, a fresh folder, revoke), since all of them end in one place;
//   2. the network's indicator arm (the Resource Timing arm is a real-engine property — statusLine.browser);
//   3. the version: the line shows the version it is given, and package.json's version is what the build
//      writes into the manifest the entrypoint reads (the built manifests themselves: statusLine.browser).
// Nothing else is on the line.
import { describe, it, expect, beforeEach } from 'vitest';
import pkg from '../../package.json';
import {
  createStatusLine,
  isOffOriginRequest,
  NETWORK_USED_TEXT,
  NO_NETWORK_TEXT,
  STATUS_LINE_CLASS,
} from './statusLine';
import { mountAppShell, type AppStore } from './appShell';
import type { FolderSource, MarkdownFile } from './folderSource';
import type { FolderRecord, PinRecord, RecentRecord } from './store';

const flush = () => new Promise<void>((r) => setTimeout(r, 0));
const texts = (el: Element): string[] => [...el.children].map((c) => c.textContent ?? '').filter((t) => t !== '');

describe('the status line on its own', () => {
  it('says three things and nothing else: the file, the network, the version', () => {
    const line = createStatusLine(document, { version: '9.8.7' });
    line.setFile('notes.md');
    expect(line.element.getAttribute('role')).toBe('status');
    expect(texts(line.element)).toEqual(['notes.md', NO_NETWORK_TEXT, 'Peekover 9.8.7']);
  });

  it('A then B shows B; no file clears it', () => {
    const line = createStatusLine(document);
    const file = () => line.element.querySelector(`.${STATUS_LINE_CLASS}__file`)!.textContent;
    line.setFile('a.md');
    expect(file()).toBe('a.md');
    line.setFile('b.md');
    expect(file()).toBe('b.md');
    line.setFile(null);
    expect(file()).toBe('');
  });

  it('with no version given it states none (never a guessed one)', () => {
    const line = createStatusLine(document);
    expect(line.element.textContent).not.toMatch(/Peekover/);
  });

  it('the version it is given is package.json\'s in the real build — WXT writes package.json\'s into the manifest', () => {
    expect(pkg.version).toMatch(/^\d+\.\d+\.\d+$/);
    const line = createStatusLine(document, { version: pkg.version });
    expect(line.element.textContent).toContain(`Peekover ${pkg.version}`);
  });

  it('the network: "No network calls" until a reader host lights the indicator, then "Network used" — and it stays', async () => {
    const root = document.createElement('div');
    const host = document.createElement('div');
    root.append(host);
    document.body.append(root);
    const line = createStatusLine(document);
    line.watch(root);
    await flush();
    expect(line.element.textContent).toContain(NO_NETWORK_TEXT);
    host.setAttribute('data-network', 'active');
    await flush();
    expect(line.element.textContent).toContain(NETWORK_USED_TEXT);
    expect(line.element.textContent).not.toContain(NO_NETWORK_TEXT);
    host.remove(); // a file switch replaces the host; the page has still used the network
    await flush();
    expect(line.element.textContent).toContain(NETWORK_USED_TEXT);
    root.remove();
  });

  it('what counts as off-origin: http(s) to another origin only', () => {
    const origin = 'chrome-extension://abcdef';
    expect(isOffOriginRequest('https://example.com/a.png', origin)).toBe(true);
    expect(isOffOriginRequest('http://127.0.0.1:5173/a.png', 'http://localhost:5173')).toBe(true);
    expect(isOffOriginRequest('http://localhost:5173/chunk.js', 'http://localhost:5173')).toBe(false);
    expect(isOffOriginRequest('chrome-extension://abcdef/chunks/app.js', origin)).toBe(false);
    expect(isOffOriginRequest('moz-extension://abcdef/fonts/x.woff2', 'moz-extension://abcdef')).toBe(false);
    expect(isOffOriginRequest('data:image/png;base64,AAAA', origin)).toBe(false);
    expect(isOffOriginRequest('blob:chrome-extension://abcdef/1', origin)).toBe(false);
  });
});

// ── Every route that changes the open file ends in the shell's `selectFile` ─────────────────────

function mdFile(path: string, text = `# ${path}`): MarkdownFile {
  return { path, name: path.split('/').pop() ?? path, read: async () => text };
}
function sourceOf(name: string, files: MarkdownFile[]): FolderSource {
  return { name, files, truncated: false, persistable: true, handle: undefined };
}
function memStore(seed: { folders?: FolderRecord[]; recents?: RecentRecord[]; pins?: PinRecord[] } = {}): AppStore {
  const folders = [...(seed.folders ?? [])];
  const recents = [...(seed.recents ?? [])];
  const pins = [...(seed.pins ?? [])];
  return {
    putFolder: async (r) => {
      const i = folders.findIndex((f) => f.id === r.id);
      if (i >= 0) folders[i] = r;
      else folders.push(r);
    },
    deleteFolder: async (id) => {
      const i = folders.findIndex((f) => f.id === id);
      if (i >= 0) folders.splice(i, 1);
    },
    putRecent: async (r) => void recents.push(r),
    getFolders: async () => [...folders],
    getRecents: async () => [...recents],
    getPins: async () => [...pins],
    putPin: async (r) => void pins.push(r),
    deleteRecent: async () => undefined,
    deletePin: async () => undefined,
  };
}
const folderRow = (handle: FileSystemDirectoryHandle): FolderRecord => ({ id: 'F1', name: 'notes', handle, addedAt: 1, lastOpenedAt: 1 });

describe('the file statement follows every route', () => {
  let container: HTMLElement;
  const fileShown = () => container.querySelector(`.${STATUS_LINE_CLASS}__file`)!.textContent;
  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  it('the tree: A then B shows B; a fresh folder clears it; revoke clears it', async () => {
    const source = sourceOf('notes', [mdFile('a.md'), mdFile('b.md')]);
    const app = mountAppShell(container, { store: memStore(), openFolder: async () => ({ ok: true, source }) });
    await app.openFolder();
    expect(fileShown(), 'a fresh folder: no file yet').toBe('');
    const item = (name: string) => [...container.querySelectorAll<HTMLButtonElement>('[role="treeitem"][data-kind="file"]')].find((b) => b.textContent?.includes(name))!;
    item('a.md').click();
    await flush();
    await flush();
    expect(fileShown()).toBe('a.md');
    item('b.md').click();
    await flush();
    await flush();
    expect(fileShown()).toBe('b.md');
    await app.openFolder(); // the same folder again: back to no selection
    expect(fileShown()).toBe('');
    item('a.md').click();
    await flush();
    await flush();
    expect(fileShown()).toBe('a.md');
    container.querySelector<HTMLButtonElement>('.peekover-app__chip button, .peekover-app__revoke')!.click();
    await flush();
    await flush();
    expect(fileShown(), 'revoke').toBe('');
  });

  it('a recent', async () => {
    const handle = {} as FileSystemDirectoryHandle;
    const store = memStore({ folders: [folderRow(handle)], recents: [{ id: 'r1', folderId: 'F1', path: 'intro.md', name: 'intro.md', openedAt: 100 }] });
    const app = mountAppShell(container, { store, reopenFromHandle: async () => ({ ok: true, source: sourceOf('notes', [mdFile('intro.md')]) }) });
    await app.refresh();
    expect(fileShown()).toBe('');
    container.querySelector<HTMLButtonElement>('.peekover-recents__entry')!.click();
    await flush();
    await flush();
    expect(fileShown()).toBe('intro.md');
  });

  it('a pin', async () => {
    const handle = {} as FileSystemDirectoryHandle;
    const store = memStore({ folders: [folderRow(handle)], pins: [{ id: 'p1', kind: 'file', folderId: 'F1', path: 'guide.md', name: 'guide.md', pinnedAt: 50 }] });
    const app = mountAppShell(container, { store, reopenFromHandle: async () => ({ ok: true, source: sourceOf('notes', [mdFile('guide.md')]) }) });
    await app.refresh();
    container.querySelector<HTMLButtonElement>('.peekover-recents__entry')!.click();
    await flush();
    await flush();
    expect(fileShown()).toBe('guide.md');
  });

  it('the selectFile seam, and null', async () => {
    const app = mountAppShell(container);
    await app.selectFile({ name: 'fed.md', read: async () => '# Fed' });
    expect(fileShown()).toBe('fed.md');
    await app.selectFile({ name: 'gone.md', read: async () => Promise.reject(new Error('revoked')) });
    expect(fileShown(), 'the pane names an unreadable file, so the line does').toBe('gone.md');
    await app.selectFile(null);
    expect(fileShown()).toBe('');
  });

  it('the shell passes its version through, and the line sits last in the shell', () => {
    mountAppShell(container, { version: '1.2.3' });
    const shell = container.firstElementChild!;
    expect(shell.lastElementChild!.classList.contains(STATUS_LINE_CLASS)).toBe(true);
    expect(shell.lastElementChild!.textContent).toContain('Peekover 1.2.3');
  });
});

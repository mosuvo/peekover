// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { mountAppShell, type AppStore } from './appShell';
import type { ReaderFile } from './readerPane';
import type { FolderSource, MarkdownFile, OpenFolderOutcome } from './folderSource';
import type { FolderRecord, RecentRecord } from './store';

// Task 1.1: the app-page surface EXISTS and renders its skeleton + affordance.
// Task 1.2: the shell wires selection → the reader pane (unchanged M1 mount()).
// Task 3.2: the "Open a folder" CTA is now LIVE — the grant flow (plain line → picker →
// chip → folder body) with a DESIGNED never-blank state for every non-grant outcome
// (cancelled / unsupported / error / empty / too-large). The native picker itself is the
// human gate (6.3); the real handle→walk→read path is the OPFS browser test. Here we drive
// the flow through an INJECTED opener (jsdom has no native picker) and an injected store
// (jsdom has no IndexedDB) to prove the DOM-shape wiring: chip, states, reader, recents.

describe('appShell (task 1.1 skeleton)', () => {
  let container: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  it('renders header, folder pane, reader pane', () => {
    mountAppShell(container);
    expect(container.querySelector('.peekover-app__header')).not.toBeNull();
    expect(container.querySelector('.peekover-app__folders')).not.toBeNull();
    expect(container.querySelector('.peekover-app__reader')).not.toBeNull();
  });

  it('shows the "Open a folder" CTA with the plain-language line shown BEFORE the picker', () => {
    mountAppShell(container);
    expect(container.textContent).toContain('Open a folder to begin');
    const cta = container.querySelector<HTMLButtonElement>('.peekover-app__cta');
    expect(cta).not.toBeNull();
    // The CTA is LIVE now (group 3 wired it) — no longer marked inert.
    expect(cta!.getAttribute('data-peekover-inert')).toBeNull();
    // The plain-language trust line is present up-front (before any picker opens).
    const line = container.querySelector('.peekover-app__line');
    expect(line).not.toBeNull();
    expect(line!.textContent).toMatch(/on this device only|no network/i);
  });

  it('is idempotent — a second mount replaces, never duplicates', () => {
    mountAppShell(container);
    mountAppShell(container);
    expect(container.querySelectorAll('.peekover-app').length).toBe(1);
  });
});

describe('appShell (task 1.2 reader wiring + designed states)', () => {
  let container: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  function fileWith(text: string, name = 'doc.md'): ReaderFile {
    return { name, read: async () => text };
  }

  it('starts with the reader pane in the designed no-selection state (never blank)', () => {
    mountAppShell(container);
    const reader = container.querySelector('.peekover-app__reader');
    expect(reader).not.toBeNull();
    expect(reader!.querySelector('[data-state="no-selection"]')).not.toBeNull();
    expect(reader!.textContent?.trim()).not.toBe('');
  });

  it('selectFile() renders a fed file through the unchanged M1 mount() pipeline', async () => {
    const app = mountAppShell(container);
    await app.selectFile(fileWith('# Fed heading\n\nbody'));

    const host = container.querySelector<HTMLElement>('.peekover-app__reader__host');
    expect(host).not.toBeNull();
    expect(host!.shadowRoot?.querySelector('h1')?.textContent).toContain('Fed heading');
  });

  it('selectFile() with an empty file shows the designed empty state', async () => {
    const app = mountAppShell(container);
    await app.selectFile(fileWith('', 'blank.md'));

    const state = container.querySelector('.peekover-app__reader [data-state="empty-file"]');
    expect(state).not.toBeNull();
    expect(state!.textContent).toContain('blank.md');
    expect(container.querySelector('.peekover-app__reader__host')).toBeNull();
  });

  it('selectFile() with an unreadable file shows the designed error state (never blank)', async () => {
    const app = mountAppShell(container);
    await app.selectFile({
      name: 'gone.md',
      read: async () => {
        throw new Error('revoked');
      },
    });

    const state = container.querySelector('.peekover-app__reader [data-state="unreadable"]');
    expect(state).not.toBeNull();
    expect(state!.textContent).toContain('gone.md');
    expect(container.querySelector('.peekover-app__reader__host')).toBeNull();
  });
});

// --- task 3.2: the folder grant flow (DOM-shape, injected opener + store) --------

/** A capturing fake store so the grant flow needs no real IndexedDB in jsdom. */
function fakeStore(): AppStore & {
  folders: FolderRecord[];
  recents: RecentRecord[];
  deleted: string[];
} {
  const folders: FolderRecord[] = [];
  const recents: RecentRecord[] = [];
  const deleted: string[] = [];
  return {
    folders,
    recents,
    deleted,
    putFolder: async (r) => void folders.push(r),
    deleteFolder: async (id) => void deleted.push(id),
    putRecent: async (r) => void recents.push(r),
  };
}

function mdFile(path: string, text = `# ${path}`): MarkdownFile {
  return { path, name: path.split('/').pop() ?? path, read: async () => text };
}

/** Flush pending microtasks + one macrotask — enough for a fire-and-forget click handler
 *  (button clicks can't be awaited directly) to settle its async chain. */
const flush = () => new Promise<void>((r) => setTimeout(r, 0));

function sourceOf(
  name: string,
  files: MarkdownFile[],
  over: Partial<FolderSource> = {},
): FolderSource {
  return { name, files, truncated: false, persistable: true, handle: undefined, ...over };
}

function openerReturning(outcome: OpenFolderOutcome) {
  return async () => outcome;
}

describe('appShell (task 3.2 folder grant flow)', () => {
  let container: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  it('grant success shows the "granted: <name> — revoke" chip and the folder body', async () => {
    const store = fakeStore();
    const source = sourceOf('my-notes', [mdFile('a.md'), mdFile('docs/b.md')]);
    const app = mountAppShell(container, { openFolder: openerReturning({ ok: true, source }), store });

    await app.openFolder();

    const chip = container.querySelector('.peekover-app__chip');
    expect(chip).not.toBeNull();
    expect(chip!.textContent).toContain('granted:');
    expect(chip!.textContent).toContain('my-notes');
    expect(chip!.querySelector('.peekover-app__chip-revoke')).not.toBeNull();

    // The folder body lists the walked files (real, clickable presentation).
    const files = container.querySelectorAll('.peekover-app__file');
    expect([...files].map((f) => f.textContent)).toEqual(['a.md', 'docs/b.md']);

    // The folder was remembered (best-effort store write happened).
    expect(store.folders.map((f) => f.name)).toEqual(['my-notes']);
  });

  it('clicking a folder file renders it in the reader AND records a recent', async () => {
    const store = fakeStore();
    const source = sourceOf('notes', [mdFile('intro.md', '# Intro heading\n\ntext')]);
    const app = mountAppShell(container, { openFolder: openerReturning({ ok: true, source }), store });
    await app.openFolder();

    const fileBtn = container.querySelector<HTMLButtonElement>('.peekover-app__file');
    fileBtn!.click();
    await flush();

    const host = container.querySelector<HTMLElement>('.peekover-app__reader__host');
    expect(host).not.toBeNull();
    expect(host!.shadowRoot?.querySelector('h1')?.textContent).toContain('Intro heading');

    // A recent was recorded, linked to the remembered folder.
    expect(store.recents).toHaveLength(1);
    expect(store.recents[0].path).toBe('intro.md');
    expect(store.recents[0].folderId).toBe(store.folders[0].id);
  });

  it('a TRUNCATED (too-large) folder shows the designed "folder too large" state, never blank', async () => {
    const store = fakeStore();
    const source = sourceOf('huge', [mdFile('one.md')], { truncated: true });
    const app = mountAppShell(container, { openFolder: openerReturning({ ok: true, source }), store });

    await app.openFolder();

    const tooLarge = container.querySelector('[data-state="too-large"]');
    expect(tooLarge).not.toBeNull();
    expect(tooLarge!.textContent).toMatch(/very large|too large/i);
    // Still functional: the files it DID scan are listed (never a dead end).
    expect(container.querySelector('.peekover-app__file')).not.toBeNull();
  });

  it('an EMPTY folder (no markdown) shows the designed empty-folder state, never blank', async () => {
    const store = fakeStore();
    const app = mountAppShell(container, {
      openFolder: openerReturning({ ok: true, source: sourceOf('empty', []) }),
      store,
    });

    await app.openFolder();

    const empty = container.querySelector('[data-state="empty-folder"]');
    expect(empty).not.toBeNull();
    expect(empty!.textContent).toMatch(/no markdown/i);
    // The chip still shows (a folder IS open, it just has nothing to read).
    expect(container.querySelector('.peekover-app__chip')).not.toBeNull();
  });

  it('a CANCELLED picker returns to the affordance with a designed notice (never blank)', async () => {
    const app = mountAppShell(container, {
      openFolder: openerReturning({ ok: false, reason: 'cancelled', message: 'No folder was opened.' }),
      store: fakeStore(),
    });

    await app.openFolder();

    expect(container.querySelector('.peekover-app__notice')?.textContent).toContain('No folder was opened.');
    // The CTA is back so the user can retry — not a dead end.
    expect(container.querySelector('.peekover-app__cta')).not.toBeNull();
    expect(container.querySelector('.peekover-app__chip')).toBeNull();
  });

  it('an UNSUPPORTED engine (real openFolder in jsdom — no picker) shows an honest state', async () => {
    // No injected opener → the real openFolder runs; jsdom has no showDirectoryPicker, so
    // it returns { unsupported } — proving the real feature-detect branch, never a blank.
    const app = mountAppShell(container, { store: fakeStore() });

    await app.openFolder();

    const notice = container.querySelector('.peekover-app__notice');
    expect(notice).not.toBeNull();
    expect(notice!.textContent).toMatch(/cannot open a live folder|Firefox/i);
    expect(container.querySelector('.peekover-app__cta')).not.toBeNull();
  });

  it('REVOKE drops the record and returns to the affordance, clearing the reader', async () => {
    const store = fakeStore();
    const source = sourceOf('notes', [mdFile('a.md')]);
    const app = mountAppShell(container, { openFolder: openerReturning({ ok: true, source }), store });
    await app.openFolder();

    // Open a file first so the reader has content to clear.
    container.querySelector<HTMLButtonElement>('.peekover-app__file')!.click();
    await flush();

    const revokeBtn = container.querySelector<HTMLButtonElement>('.peekover-app__chip-revoke');
    revokeBtn!.click();
    await flush();

    // Chip gone, affordance back, folder record deleted, reader cleared to no-selection.
    expect(container.querySelector('.peekover-app__chip')).toBeNull();
    expect(container.querySelector('.peekover-app__cta')).not.toBeNull();
    expect(store.deleted).toEqual([store.folders[0].id]);
    expect(container.querySelector('.peekover-app__reader [data-state="no-selection"]')).not.toBeNull();
  });
});

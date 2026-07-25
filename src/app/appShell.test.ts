// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { mountAppShell, type AppStore } from './appShell';
import type { ReaderFile } from './readerPane';
import type { FolderSource, MarkdownFile, OpenFolderOutcome } from './folderSource';
import type { FolderRecord, RecentRecord, PinRecord, StoredSummary } from './store';

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
  snapDeleted: string[];
  callLog: string[];
} {
  const folders: FolderRecord[] = [];
  const recents: RecentRecord[] = [];
  const deleted: string[] = [];
  const snapDeleted: string[] = []; // folderIds passed to deleteSnapshotsForFolder (D-10, task 1.4)
  const callLog: string[] = []; // ordering witness: 'snap:<id>' / 'folder:<id>'
  return {
    folders,
    recents,
    deleted,
    snapDeleted,
    callLog,
    putFolder: async (r) => void folders.push(r),
    deleteFolder: async (id) => {
      callLog.push(`folder:${id}`);
      deleted.push(id);
    },
    deleteSnapshotsForFolder: async (id) => {
      callLog.push(`snap:${id}`);
      snapDeleted.push(id);
    },
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

    // The folder body is the searchable tree; the walked files appear as file treeitems.
    const files = container.querySelectorAll('[role="treeitem"][data-kind="file"]');
    expect([...files].map((f) => f.textContent).sort()).toEqual(['a.md', 'b.md']);
    // …with their containing directory shown as a tree node.
    expect(container.querySelector('[role="tree"]')).not.toBeNull();
    expect(container.querySelector('.peekover-tree__dir')?.textContent).toContain('docs');

    // The folder was remembered (best-effort store write happened).
    expect(store.folders.map((f) => f.name)).toEqual(['my-notes']);
  });

  it('clicking a folder file renders it in the reader AND records a recent', async () => {
    const store = fakeStore();
    const source = sourceOf('notes', [mdFile('intro.md', '# Intro heading\n\ntext')]);
    const app = mountAppShell(container, { openFolder: openerReturning({ ok: true, source }), store });
    await app.openFolder();

    const fileBtn = container.querySelector<HTMLButtonElement>('[role="treeitem"][data-kind="file"]');
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
    expect(container.querySelector('[role="treeitem"][data-kind="file"]')).not.toBeNull();
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

  // Task 4.1: a read-only SNAPSHOT source (Firefox / picker-disabled) carries its honesty as
  // DATA (`persistable:false`), and the shell renders the platform-limitation note off that
  // bit — never by sniffing the engine. (The real feature-detect ROUTING is unit-tested in
  // folderSource.test.ts; the real read path in firefoxFallback.browser.test.ts.)
  it('a read-only SNAPSHOT source (persistable:false) shows the honest Firefox note + stores NO handle', async () => {
    const store = fakeStore();
    const source = sourceOf('snap', [mdFile('a.md')], { persistable: false, handle: undefined });
    const app = mountAppShell(container, { openFolder: openerReturning({ ok: true, source }), store });

    await app.openFolder();

    const note = container.querySelector('[data-state="read-only-snapshot"]');
    expect(note).not.toBeNull();
    expect(note!.textContent).toMatch(/read-only|snapshot|Firefox platform limitation/i);
    // The chip + tree still render (a folder IS open, just not persistable).
    expect(container.querySelector('.peekover-app__chip')).not.toBeNull();
    expect(container.querySelector('[role="treeitem"][data-kind="file"]')).not.toBeNull();
    // Snapshot → the stored folder row carries NO handle (metadata-only).
    expect(store.folders).toHaveLength(1);
    expect(store.folders[0].handle).toBeUndefined();
  });

  it('a persistable (Chromium) source shows NO read-only note', async () => {
    const store = fakeStore();
    const source = sourceOf('live', [mdFile('a.md')]); // persistable:true by default
    const app = mountAppShell(container, { openFolder: openerReturning({ ok: true, source }), store });

    await app.openFolder();

    expect(container.querySelector('[data-state="read-only-snapshot"]')).toBeNull();
  });

  it('an injected UNSUPPORTED outcome still degrades to an honest state (defensive, never blank)', async () => {
    const app = mountAppShell(container, {
      openFolder: openerReturning({
        ok: false,
        reason: 'unsupported',
        message: 'This browser cannot open a live folder.',
      }),
      store: fakeStore(),
    });

    await app.openFolder();

    const notice = container.querySelector('.peekover-app__notice');
    expect(notice).not.toBeNull();
    expect(notice!.textContent).toContain('cannot open a live folder');
    expect(container.querySelector('.peekover-app__cta')).not.toBeNull();
  });

  it('REVOKE drops the record and returns to the affordance, clearing the reader', async () => {
    const store = fakeStore();
    const source = sourceOf('notes', [mdFile('a.md')]);
    const app = mountAppShell(container, { openFolder: openerReturning({ ok: true, source }), store });
    await app.openFolder();

    // Open a file first so the reader has content to clear.
    container.querySelector<HTMLButtonElement>('[role="treeitem"][data-kind="file"]')!.click();
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

  // D-10 / task 1.4 — the PRODUCTION revoke path erases the folder's snapshots, and does so BEFORE
  // deleting the folder row (so a partial failure leaves the handle removable on retry). This drives
  // the real `revokeAccess` closure through the chip click (the M5 seam rule: a test per seam drives
  // the production entry path); the delimiter-boundary correctness itself is the real-engine
  // snapshotRevoke.browser.test.ts's job.
  it('REVOKE erases the folder’s snapshots through the production path, before the folder row', async () => {
    const store = fakeStore();
    const source = sourceOf('notes', [mdFile('a.md')]);
    const app = mountAppShell(container, { openFolder: openerReturning({ ok: true, source }), store });
    await app.openFolder();
    container.querySelector<HTMLButtonElement>('[role="treeitem"][data-kind="file"]')!.click();
    await flush();

    const folderId = store.folders[0].id;
    container.querySelector<HTMLButtonElement>('.peekover-app__chip-revoke')!.click();
    await flush();

    // The revoked folder's snapshots were erased, keyed by its folderId...
    expect(store.snapDeleted).toEqual([folderId]);
    // ...and BEFORE the folder row was dropped (ordering is load-bearing, not incidental).
    expect(store.callLog).toEqual([`snap:${folderId}`, `folder:${folderId}`]);
  });
});

// --- group-4 follow-up: the drag-and-drop folder target (DOM-shape, injected drop seam) ----
//
// A folder dropped on the app page must open IN Peekover, not fall through to the browser's
// default navigate-to-folder action (the Firefox manual-gate bug). That needs preventDefault on
// BOTH dragover (so a `drop` fires at all) and drop (so the browser does not navigate). Here we
// prove the DOM wiring in jsdom: the handlers claim the events (defaultPrevented), the injected
// drop seam is invoked, and a success funnels through the EXACT same grant branch as the CTA
// (chip + tree). jsdom cannot prove a real browser's navigation was suppressed — a synthetic
// event never triggers a default action in ANY engine — so that property is asserted on real
// DragEvents in folderDrop.browser.test.ts and confirmed live at the human gate.

describe('appShell (group-4 drag-and-drop folder target)', () => {
  let container: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  function shellOf(): HTMLElement {
    return container.querySelector<HTMLElement>('.peekover-app')!;
  }

  it('dragover is preventDefault\'d — REQUIRED, or no drop event ever fires', () => {
    mountAppShell(container, {
      dropToOutcome: async () => ({ ok: true, source: sourceOf('x', []) }),
      store: fakeStore(),
    });

    const dragover = new Event('dragover', { bubbles: true, cancelable: true });
    shellOf().dispatchEvent(dragover);

    expect(dragover.defaultPrevented).toBe(true);
  });

  it('a folder DROP is claimed (defaultPrevented), routed through the injected seam, and funnels to the chip + tree', async () => {
    const store = fakeStore();
    const source = sourceOf('dropped-notes', [mdFile('a.md'), mdFile('docs/b.md')]);
    let calls = 0;
    const app = mountAppShell(container, {
      dropToOutcome: async () => {
        calls += 1;
        return { ok: true, source };
      },
      store,
    });
    void app;

    const drop = new Event('drop', { bubbles: true, cancelable: true });
    shellOf().dispatchEvent(drop);
    await flush();

    // The handler CLAIMED the event — the browser will not navigate to the dropped folder.
    expect(drop.defaultPrevented).toBe(true);
    // …the injected drop seam ran once…
    expect(calls).toBe(1);
    // …and success went through the SAME grant branch: chip + searchable tree + remembered.
    const chip = container.querySelector('.peekover-app__chip');
    expect(chip?.textContent).toContain('granted:');
    expect(chip?.textContent).toContain('dropped-notes');
    const files = container.querySelectorAll('[role="treeitem"][data-kind="file"]');
    expect([...files].map((f) => f.textContent).sort()).toEqual(['a.md', 'b.md']);
    expect(store.folders.map((f) => f.name)).toEqual(['dropped-notes']);
  });

  it('an EMPTY / invalid drop still claims the event and shows a designed notice (never blank)', async () => {
    mountAppShell(container, {
      dropToOutcome: async () => ({ ok: false, reason: 'cancelled', message: 'Drop a folder to open it.' }),
      store: fakeStore(),
    });

    const drop = new Event('drop', { bubbles: true, cancelable: true });
    shellOf().dispatchEvent(drop);
    await flush();

    expect(drop.defaultPrevented).toBe(true);
    expect(container.querySelector('.peekover-app__notice')?.textContent).toContain('Drop a folder');
    // The affordance is back — not a dead end.
    expect(container.querySelector('.peekover-app__cta')).not.toBeNull();
    expect(container.querySelector('.peekover-app__chip')).toBeNull();
  });

  it('a dropped SNAPSHOT source (Firefox, persistable:false) shows the read-only note via the same branch', async () => {
    const store = fakeStore();
    const source = sourceOf('snap-drop', [mdFile('a.md')], { persistable: false, handle: undefined });
    mountAppShell(container, { dropToOutcome: async () => ({ ok: true, source }), store });

    shellOf().dispatchEvent(new Event('drop', { bubbles: true, cancelable: true }));
    await flush();

    expect(container.querySelector('[data-state="read-only-snapshot"]')).not.toBeNull();
    expect(store.folders[0].handle).toBeUndefined();
  });
});

// --- task 5.2: the recents/pins reopen hub + per-engine reopen (DOM-shape) -----------------
//
// The persisted recents/pins are SURFACED as a reopen hub, and re-opening a remembered folder
// is ONE gesture that funnels through the SAME applyOutcome/paintGranted the CTA uses (reuse,
// not duplication). Chromium (folder row carries a handle): the click drives the injected
// reopenFromHandle (the real query→request→gate is proven in reopen.test.ts /
// handlePersist.browser.test.ts). Firefox (no handle): the click re-opens the picker
// ("pick this folder again"). Here we prove the DOM wiring with injected seams + a full
// in-memory store (jsdom has no IndexedDB); the list ORDER is the pure recents module's job
// (recents.test.ts).

/** A full in-memory store (all read/write/pin methods) so the hub reflects real state. */
function memStore(seed: {
  folders?: FolderRecord[];
  recents?: RecentRecord[];
  pins?: PinRecord[];
} = {}): AppStore & {
  folders: FolderRecord[];
  recents: RecentRecord[];
  pins: PinRecord[];
} {
  const folders = [...(seed.folders ?? [])];
  const recents = [...(seed.recents ?? [])];
  const pins = [...(seed.pins ?? [])];
  return {
    folders,
    recents,
    pins,
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
    deleteRecent: async (id) => {
      const i = recents.findIndex((r) => r.id === id);
      if (i >= 0) recents.splice(i, 1);
    },
    deletePin: async (id) => {
      const i = pins.findIndex((p) => p.id === id);
      if (i >= 0) pins.splice(i, 1);
    },
  };
}

function folderRow(over: Partial<FolderRecord> = {}): FolderRecord {
  return { id: 'F1', name: 'notes', addedAt: 1, lastOpenedAt: 1, ...over };
}

describe('appShell (task 5.2 recents/pins reopen hub)', () => {
  let container: HTMLElement;
  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  it('surfaces persisted recents + pins as a hub on the landing screen', async () => {
    const store = memStore({
      folders: [folderRow({ id: 'F1', name: 'notes', handle: {} as FileSystemDirectoryHandle })],
      recents: [{ id: 'r1', folderId: 'F1', path: 'a.md', name: 'a.md', openedAt: 100 }],
      pins: [{ id: 'p1', kind: 'folder', folderId: 'F1', path: '', name: 'notes', pinnedAt: 50 }],
    });
    const app = mountAppShell(container, { store });
    await app.refresh();

    const hub = container.querySelector('.peekover-recents');
    expect(hub).not.toBeNull();
    expect(hub!.textContent).toContain('Recent');
    expect(hub!.textContent).toContain('Pinned');
    // The recent file and the pinned folder both surface as reopen entries.
    const entries = [...container.querySelectorAll('.peekover-recents__entry')].map((e) => e.textContent);
    expect(entries.join(' ')).toContain('a.md');
    expect(entries.join(' ')).toContain('notes');
  });

  it('clicking a Chromium recent (folder has a handle) drives reopenFromHandle → chip + tree + selects the file', async () => {
    const handle = {} as FileSystemDirectoryHandle;
    const store = memStore({
      folders: [folderRow({ id: 'F1', name: 'notes', handle })],
      recents: [{ id: 'r1', folderId: 'F1', path: 'intro.md', name: 'intro.md', openedAt: 100 }],
    });
    let reopenedWith: FileSystemDirectoryHandle | null = null;
    const source = sourceOf('notes', [mdFile('intro.md', '# Reopened heading\n\nbody')]);
    const app = mountAppShell(container, {
      store,
      reopenFromHandle: async (h) => {
        reopenedWith = h;
        return { ok: true, source };
      },
    });
    await app.refresh();

    container.querySelector<HTMLButtonElement>('.peekover-recents__entry')!.click();
    await flush();
    await flush();

    // The one-gesture re-grant ran with the rehydrated handle …
    expect(reopenedWith).toBe(handle);
    // … reusing the SAME grant branch: chip + tree appear.
    expect(container.querySelector('.peekover-app__chip')?.textContent).toContain('granted:');
    expect(container.querySelector('[role="treeitem"][data-kind="file"]')).not.toBeNull();
    // … and the recent's file opened straight into the reader.
    const host = container.querySelector<HTMLElement>('.peekover-app__reader__host');
    expect(host?.shadowRoot?.querySelector('h1')?.textContent).toContain('Reopened heading');
    // Reopen reused the folder record (no duplicate row minted).
    expect(store.folders.filter((f) => f.id === 'F1')).toHaveLength(1);
  });

  it('clicking a Firefox recent (folder has NO handle) re-opens the picker, not reopenFromHandle', async () => {
    const store = memStore({
      folders: [folderRow({ id: 'F1', name: 'snap', handle: undefined })],
      recents: [{ id: 'r1', folderId: 'F1', path: 'a.md', name: 'a.md', openedAt: 100 }],
    });
    let reopenCalls = 0;
    let pickerCalls = 0;
    const app = mountAppShell(container, {
      store,
      reopenFromHandle: async () => {
        reopenCalls += 1;
        return { ok: false, reason: 'error', message: 'x' };
      },
      openFolder: async () => {
        pickerCalls += 1;
        return { ok: true, source: sourceOf('snap', [mdFile('a.md')], { persistable: false }) };
      },
    });
    await app.refresh();

    // The entry shows the honest re-pick affordance (not greyed out).
    const entry = container.querySelector<HTMLButtonElement>('.peekover-recents__entry')!;
    expect(entry.dataset.reopen).toBe('repick');
    entry.click();
    await flush();

    expect(reopenCalls).toBe(0); // no silent rehydrate attempt for a handle-less folder
    expect(pickerCalls).toBe(1); // one gesture → the picker (pick this folder again)
    expect(container.querySelector('.peekover-app__chip')?.textContent).toContain('granted:');
  });

  it('pinning the open folder stores a pin and surfaces it in the hub; unpin removes it', async () => {
    const store = memStore();
    const source = sourceOf('my-notes', [mdFile('a.md')]);
    const app = mountAppShell(container, { store, openFolder: openerReturning({ ok: true, source }) });
    await app.openFolder();

    // Pin the open folder.
    const pinBtn = container.querySelector<HTMLButtonElement>('.peekover-app__pin[data-pin="folder"]');
    expect(pinBtn?.textContent).toContain('Pin this folder');
    pinBtn!.click();
    await flush();

    expect(store.pins).toHaveLength(1);
    expect(store.pins[0].kind).toBe('folder');
    expect(store.pins[0].name).toBe('my-notes');
    // The pin bar now reflects the pinned state (idempotent — disabled).
    expect(container.querySelector<HTMLButtonElement>('.peekover-app__pin[data-pin="folder"]')?.disabled).toBe(true);
    // The hub (shown in the granted view too) surfaces the new pin.
    expect(container.querySelector('.peekover-recents')?.textContent).toContain('my-notes');

    // Unpin from the hub removes it.
    container.querySelector<HTMLButtonElement>('.peekover-recents__unpin')!.click();
    await flush();
    expect(store.pins).toHaveLength(0);
  });

  it('selecting a file offers a "Pin <file>" affordance that stores a file pin', async () => {
    const store = memStore();
    const source = sourceOf('notes', [mdFile('guide.md', '# Guide')]);
    const app = mountAppShell(container, { store, openFolder: openerReturning({ ok: true, source }) });
    await app.openFolder();

    container.querySelector<HTMLButtonElement>('[role="treeitem"][data-kind="file"]')!.click();
    await flush();

    const filePin = container.querySelector<HTMLButtonElement>('.peekover-app__pin[data-pin="file"]');
    expect(filePin?.textContent).toContain('Pin guide.md');
    filePin!.click();
    await flush();

    expect(store.pins).toHaveLength(1);
    expect(store.pins[0].kind).toBe('file');
    expect(store.pins[0].path).toBe('guide.md');
  });

  it('a reopen that is DENIED degrades to a designed notice (never blank), affordance back', async () => {
    const store = memStore({
      folders: [folderRow({ id: 'F1', name: 'notes', handle: {} as FileSystemDirectoryHandle })],
      recents: [{ id: 'r1', folderId: 'F1', path: 'a.md', name: 'a.md', openedAt: 100 }],
    });
    const app = mountAppShell(container, {
      store,
      reopenFromHandle: async () => ({ ok: false, reason: 'denied', message: 'Access to this folder wasn’t granted. Click it again to re-allow it.' }),
    });
    await app.refresh();

    container.querySelector<HTMLButtonElement>('.peekover-recents__entry')!.click();
    await flush();

    expect(container.querySelector('.peekover-app__notice')?.textContent).toContain('wasn’t granted');
    expect(container.querySelector('.peekover-app__cta')).not.toBeNull();
    expect(container.querySelector('.peekover-app__chip')).toBeNull();
  });
});

// --- task 6.0: the "what's stored" transparency panel + "wipe all data" control (DOM-shape) ---
//
// The group-5 manual gate confirmed a real gap: describeStored()/wipeAll() existed and were
// real-engine-tested (wipe.browser.test.ts, group 2) but had NO visible surface — the app page
// stored folders/recents/pins with no user-visible way to SEE or CLEAR them. This wires the
// transparency + erase controls in (spec §6.17 / the trust story). The REAL erase is already
// real-engine-proven in group 2's wipe.browser.test.ts; this is the UI over it, so jsdom
// DOM-shape coverage is right — we do NOT duplicate the browser wipe proof here. The controls
// go through the SAME injectable store seam (describeStored/wipeAll added to AppStore as
// optional), so the flow needs no real IndexedDB.

/** Build a StoredSummary from raw records the way store.describeStored() does — so an injected
 *  store can report the honest picture (folders as persisted-boolean, recents, pins, lines). */
function summarize(
  folders: FolderRecord[],
  recents: RecentRecord[],
  pins: PinRecord[],
): StoredSummary {
  const folderInfos = folders.map((f) => ({
    id: f.id,
    name: f.name,
    persisted: f.handle !== undefined,
    addedAt: f.addedAt,
    lastOpenedAt: f.lastOpenedAt,
  }));
  const total = folderInfos.length + recents.length + pins.length;
  const lines: string[] = [];
  if (folderInfos.length) lines.push(`${folderInfos.length} remembered folder — names only.`);
  if (recents.length) lines.push(`${recents.length} recently opened file — path + name, so the list can reopen them.`);
  if (pins.length) lines.push(`${pins.length} pinned item — path + name for quick access.`);
  if (total === 0) lines.push('Nothing stored — Peekover is holding no folders, recents, or pins on this device.');
  return {
    folders: folderInfos,
    recents,
    pins,
    settings: null,
    snapshots: { count: 0, docs: 0, bytes: 0 },
    captureFlag: null,
    total,
    lines,
  };
}

describe('appShell (task 6.0 what’s-stored + wipe controls)', () => {
  let container: HTMLElement;
  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  function openPanel(): void {
    container.querySelector<HTMLButtonElement>('.peekover-app__storage-toggle')!.click();
  }

  it('the "Stored data" control is discoverable in the header before any folder is opened', () => {
    mountAppShell(container, { store: memStore() });
    const toggle = container.querySelector<HTMLButtonElement>('.peekover-app__storage-toggle');
    expect(toggle).not.toBeNull();
    expect(toggle!.textContent).toContain('Stored data');
    // No folder open, no panel yet — but the affordance is present.
    expect(container.querySelector('.peekover-storage')).toBeNull();
  });

  it('opening the panel renders the injected summary: folders as persisted-boolean, recents, pins, lines', async () => {
    const store: AppStore = {
      putFolder: async () => undefined,
      deleteFolder: async () => undefined,
      putRecent: async () => undefined,
      describeStored: async (): Promise<StoredSummary> => ({
        folders: [
          { id: 'F1', name: 'live-notes', persisted: true, addedAt: 1, lastOpenedAt: 1 },
          { id: 'F2', name: 'snap-notes', persisted: false, addedAt: 1, lastOpenedAt: 1 },
        ],
        recents: [{ id: 'r1', folderId: 'F1', path: 'docs/a.md', name: 'a.md', openedAt: 2 }],
        pins: [{ id: 'p1', kind: 'folder', folderId: 'F1', path: '', name: 'live-notes', pinnedAt: 3 }],
        settings: null,
        snapshots: { count: 0, docs: 0, bytes: 0 },
        captureFlag: null,
        total: 4,
        lines: ['1 remembered folder — names only.'],
      }),
    };
    mountAppShell(container, { store });

    openPanel();
    await flush();

    const panel = container.querySelector('.peekover-storage');
    expect(panel).not.toBeNull();
    // Folders appear by NAME with a persisted/name-only tag — never the handle object itself.
    expect(panel!.textContent).toContain('live-notes');
    expect(panel!.textContent).toContain('folder access remembered'); // persisted:true tag
    expect(panel!.textContent).toContain('snap-notes');
    expect(panel!.textContent).toContain('name only'); // persisted:false tag
    // Recents + pins are surfaced.
    expect(panel!.textContent).toContain('a.md');
    // The re-scoped plain-language folder line + the standing storage disclosure are both shown.
    // (006 task 1.4: the folder line is "names only" and the disclosure names what IS stored —
    // on-device snapshots that are never uploaded. The DOM hook stays `contents-never-stored`, a
    // stable selector, not a claim; only the text-match updates.)
    expect(panel!.textContent).toContain('names only');
    expect(panel!.querySelector('[data-note="contents-never-stored"]')?.textContent).toMatch(
      /never uploaded/i,
    );
    expect(panel!.getAttribute('data-state')).toBe('has-data');
  });

  it('an EMPTY store shows the designed "Nothing stored" state (never blank) and disables wipe', async () => {
    mountAppShell(container, { store: memStore() }); // no describeStored → empty-summary fallback

    openPanel();
    await flush();

    const panel = container.querySelector('.peekover-storage');
    expect(panel).not.toBeNull();
    expect(panel!.getAttribute('data-state')).toBe('nothing-stored');
    expect(panel!.textContent).toContain('Nothing stored');
    // Nothing to erase → the wipe start button is present but disabled.
    const start = panel!.querySelector<HTMLButtonElement>('[data-wipe="start"]');
    expect(start).not.toBeNull();
    expect(start!.disabled).toBe(true);
    // The contents-never-stored promise is shown even when empty.
    expect(panel!.querySelector('[data-note="contents-never-stored"]')).not.toBeNull();
  });

  it('wipe takes an inline confirm (not a browser confirm), then wipeAll() clears the panel + hub', async () => {
    let wipeCalls = 0;
    const folders = [folderRow({ id: 'F1', name: 'notes', handle: {} as FileSystemDirectoryHandle })];
    const recents = [{ id: 'r1', folderId: 'F1', path: 'a.md', name: 'a.md', openedAt: 100 }];
    const pins: PinRecord[] = [];
    const store: AppStore = {
      putFolder: async () => undefined,
      deleteFolder: async () => undefined,
      putRecent: async () => undefined,
      getFolders: async () => [...folders],
      getRecents: async () => [...recents],
      getPins: async () => [...pins],
      describeStored: async () => summarize(folders, recents, pins),
      wipeAll: async () => {
        wipeCalls += 1;
        folders.length = 0;
        recents.length = 0;
        pins.length = 0;
      },
    };
    const app = mountAppShell(container, { store });
    await app.refresh();

    // The hub shows the seeded recent up-front.
    expect(container.querySelector('.peekover-recents')?.textContent).toContain('a.md');

    openPanel();
    await flush();

    // First click on "Wipe all data" only ARMS the inline confirm — it does NOT wipe.
    const panel = () => container.querySelector('.peekover-storage')!;
    panel().querySelector<HTMLButtonElement>('[data-wipe="start"]')!.click();
    expect(wipeCalls).toBe(0);
    const confirm = panel().querySelector<HTMLButtonElement>('[data-wipe="confirm"]');
    expect(confirm).not.toBeNull();
    expect(panel().querySelector('[data-wipe="cancel"]')).not.toBeNull();

    // Confirm → wipeAll() runs, and the panel + hub refresh to the emptied state.
    confirm!.click();
    await flush();

    expect(wipeCalls).toBe(1);
    // Panel repainted to "Nothing stored".
    expect(container.querySelector('.peekover-storage')?.getAttribute('data-state')).toBe('nothing-stored');
    expect(container.querySelector('.peekover-storage')?.textContent).toContain('Nothing stored');
    // The reopen hub cleared too (no more recents/pins to surface).
    expect(container.querySelector('.peekover-recents')).toBeNull();
  });

  it('the wipe confirmation copy names the six-store erase AND the snapshot-capture reset (task 1.5, Piece 7)', async () => {
    // A store with SOMETHING to erase, so the wipe-start button is enabled (it disables at total 0).
    const store: AppStore = {
      putFolder: async () => undefined,
      deleteFolder: async () => undefined,
      putRecent: async () => undefined,
      describeStored: async () => summarize([folderRow({ id: 'F1', name: 'notes' })], [], []),
      wipeAll: async () => undefined,
    };
    mountAppShell(container, { store });
    openPanel();
    await flush();

    const panel = () => container.querySelector('.peekover-storage')!;
    // Arm the inline confirm (the confirmation copy only shows in the confirming state).
    panel().querySelector<HTMLButtonElement>('[data-wipe="start"]')!.click();
    const prompt = panel().querySelector('.peekover-storage__wipe-prompt');
    expect(prompt).not.toBeNull();
    // (a) it names the snapshot-capture reset, and (b) the reset-to-default fact — the two things
    // Piece 7 requires stated plainly (the six-store erase is the "everything" clause beside them).
    expect(prompt!.textContent).toMatch(/snapshot capture/i);
    expect(prompt!.textContent).toMatch(/default/i);
    expect(prompt!.textContent).toMatch(/snapshot/i);
  });

  it('cancelling the inline confirm leaves the data intact (no wipeAll call)', async () => {
    let wipeCalls = 0;
    const folders = [folderRow({ id: 'F1', name: 'notes', handle: {} as FileSystemDirectoryHandle })];
    const store: AppStore = {
      putFolder: async () => undefined,
      deleteFolder: async () => undefined,
      putRecent: async () => undefined,
      getFolders: async () => [...folders],
      getRecents: async () => [],
      getPins: async () => [],
      describeStored: async () => summarize(folders, [], []),
      wipeAll: async () => void (wipeCalls += 1),
    };
    mountAppShell(container, { store });

    openPanel();
    await flush();

    const panel = () => container.querySelector('.peekover-storage')!;
    panel().querySelector<HTMLButtonElement>('[data-wipe="start"]')!.click();
    panel().querySelector<HTMLButtonElement>('[data-wipe="cancel"]')!.click();

    expect(wipeCalls).toBe(0);
    // Back to the un-armed control; data still described.
    expect(panel().querySelector('[data-wipe="start"]')).not.toBeNull();
    expect(panel().querySelector('[data-wipe="confirm"]')).toBeNull();
    expect(panel().textContent).toContain('notes');
  });
});

// --- task 1.6 (D-13): the global "erase snapshots" control (DOM-shape) ---------------------------
//
// A sibling of the wipe control that clears ONLY the snapshot stores. The REAL erase is
// real-engine-proven through the production UI click in tests/browser/eraseSnapshots.browser.test.ts
// (the M5 seam rule); this is the jsdom DOM-shape coverage of the control itself — idle/disabled,
// arm, confirm, cancel, and the confirm copy naming what erases AND what survives. It goes through
// the SAME injectable store seam (eraseSnapshots added to AppStore as optional), so no real IDB.

/** A StoredSummary carrying `snapshotCount` snapshots (and nothing else stored), enough to drive
 *  the erase control's enabled/disabled state and the panel's snapshot line. */
function snapSummary(snapshotCount: number): StoredSummary {
  const snapshots = snapshotCount > 0
    ? { count: snapshotCount, docs: 1, bytes: snapshotCount * 100 }
    : { count: 0, docs: 0, bytes: 0 };
  const total = snapshots.count;
  const lines: string[] = [];
  if (snapshots.count > 0) {
    lines.push(`${snapshots.count} snapshot of 1 watched document — kept on this device only, never uploaded.`);
  } else {
    lines.push('Nothing stored — Peekover is holding no folders, recents, or pins on this device.');
  }
  return { folders: [], recents: [], pins: [], settings: null, snapshots, captureFlag: null, total, lines };
}

describe('appShell (task 1.6 — the "erase snapshots" control)', () => {
  let container: HTMLElement;
  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  function openPanel(): void {
    container.querySelector<HTMLButtonElement>('.peekover-app__storage-toggle')!.click();
  }

  it('the erase-snapshots start button is DISABLED when no snapshots are stored (count 0)', async () => {
    const store: AppStore = {
      putFolder: async () => undefined,
      deleteFolder: async () => undefined,
      putRecent: async () => undefined,
      describeStored: async () => snapSummary(0),
    };
    mountAppShell(container, { store });
    openPanel();
    await flush();

    const start = container.querySelector<HTMLButtonElement>('[data-erase-snapshots="start"]');
    expect(start).not.toBeNull();
    expect(start!.disabled).toBe(true);
  });

  it('the erase-snapshots start button is ENABLED when snapshots exist (count > 0)', async () => {
    const store: AppStore = {
      putFolder: async () => undefined,
      deleteFolder: async () => undefined,
      putRecent: async () => undefined,
      describeStored: async () => snapSummary(3),
    };
    mountAppShell(container, { store });
    openPanel();
    await flush();

    const start = container.querySelector<HTMLButtonElement>('[data-erase-snapshots="start"]');
    expect(start).not.toBeNull();
    expect(start!.disabled).toBe(false);
  });

  it('the first click only ARMS the inline confirm — it does NOT erase', async () => {
    let eraseCalls = 0;
    const store: AppStore = {
      putFolder: async () => undefined,
      deleteFolder: async () => undefined,
      putRecent: async () => undefined,
      describeStored: async () => snapSummary(2),
      eraseSnapshots: async () => void (eraseCalls += 1),
    };
    mountAppShell(container, { store });
    openPanel();
    await flush();

    const panel = () => container.querySelector('.peekover-storage')!;
    panel().querySelector<HTMLButtonElement>('[data-erase-snapshots="start"]')!.click();

    // Confirm + cancel appear; the erase handler has NOT run yet.
    expect(panel().querySelector('[data-erase-snapshots="confirm"]')).not.toBeNull();
    expect(panel().querySelector('[data-erase-snapshots="cancel"]')).not.toBeNull();
    expect(eraseCalls).toBe(0);
  });

  it('confirm → eraseSnapshots() runs and the panel refreshes to the emptied snapshot state', async () => {
    let eraseCalls = 0;
    let snapshotCount = 2;
    const store: AppStore = {
      putFolder: async () => undefined,
      deleteFolder: async () => undefined,
      putRecent: async () => undefined,
      describeStored: async () => snapSummary(snapshotCount),
      eraseSnapshots: async () => {
        eraseCalls += 1;
        snapshotCount = 0; // the erase clears the snapshot stores
      },
    };
    mountAppShell(container, { store });
    openPanel();
    await flush();

    const panel = () => container.querySelector('.peekover-storage')!;
    // Pre-erase the snapshot line is present (non-vacuity for the DOM refresh assertion below).
    expect(panel().textContent).toContain('snapshot');
    expect(panel().getAttribute('data-state')).toBe('has-data');

    panel().querySelector<HTMLButtonElement>('[data-erase-snapshots="start"]')!.click();
    panel().querySelector<HTMLButtonElement>('[data-erase-snapshots="confirm"]')!.click();
    await flush();

    expect(eraseCalls).toBe(1);
    // The panel repainted from a fresh summary — the snapshot line is gone, the control disabled.
    expect(panel().getAttribute('data-state')).toBe('nothing-stored');
    expect(panel().querySelector<HTMLButtonElement>('[data-erase-snapshots="start"]')!.disabled).toBe(true);
  });

  it('cancelling the inline confirm returns to idle and does NOT erase', async () => {
    let eraseCalls = 0;
    const store: AppStore = {
      putFolder: async () => undefined,
      deleteFolder: async () => undefined,
      putRecent: async () => undefined,
      describeStored: async () => snapSummary(2),
      eraseSnapshots: async () => void (eraseCalls += 1),
    };
    mountAppShell(container, { store });
    openPanel();
    await flush();

    const panel = () => container.querySelector('.peekover-storage')!;
    panel().querySelector<HTMLButtonElement>('[data-erase-snapshots="start"]')!.click();
    panel().querySelector<HTMLButtonElement>('[data-erase-snapshots="cancel"]')!.click();

    expect(eraseCalls).toBe(0);
    // Back to the un-armed control; confirm gone.
    expect(panel().querySelector('[data-erase-snapshots="start"]')).not.toBeNull();
    expect(panel().querySelector('[data-erase-snapshots="confirm"]')).toBeNull();
  });

  it('the confirm copy names what ERASES (saved document snapshots) AND what SURVIVES', async () => {
    const store: AppStore = {
      putFolder: async () => undefined,
      deleteFolder: async () => undefined,
      putRecent: async () => undefined,
      describeStored: async () => snapSummary(2),
      eraseSnapshots: async () => undefined,
    };
    mountAppShell(container, { store });
    openPanel();
    await flush();

    const panel = () => container.querySelector('.peekover-storage')!;
    panel().querySelector<HTMLButtonElement>('[data-erase-snapshots="start"]')!.click();
    const prompt = panel().querySelector('.peekover-storage__erase-prompt');
    expect(prompt).not.toBeNull();
    // (a) what erases: saved document snapshots.
    expect(prompt!.textContent).toMatch(/snapshot/i);
    // (b) what survives: folders/recents/pins/reader settings/snapshot-capture preference.
    expect(prompt!.textContent).toMatch(/folders/i);
    expect(prompt!.textContent).toMatch(/recents/i);
    expect(prompt!.textContent).toMatch(/pins/i);
    expect(prompt!.textContent).toMatch(/settings/i);
    expect(prompt!.textContent).toMatch(/capture/i);
    expect(prompt!.textContent).toMatch(/kept/i);
  });
});

// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { mountAppShell, type AppStore } from './appShell';
import type { ReaderFile } from './readerPane';
import type { FolderSource, MarkdownFile, OpenFolderOutcome } from './folderSource';
import type { FolderRecord, RecentRecord, PinRecord, StoredSummary } from './store';
import { getDocIdentity, resetDocIdentityForTest } from '../render/docIdentity';
import { getDiffContext, resetDiffRegistryForTest } from '../render/diffRegistry';
import { TABLE_TOOLBAR_CLASS, TABLE_STATE_ATTR } from '../render/tableEnhancer';

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
    diagrams: { count: 0, bytes: 0 },
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

  // C012: UNCHANGED at 013 task 4.4 — the census expected this helper to move; it did not break. The
  // Stored data toggle is still in the header (now inside the toolbar), and jsdom has no layout, so a
  // click reaches it at any width. Where it sits at ≤ 863 px is toolbar.browser.test.ts's.
  function openPanel(): void {
    container.querySelector<HTMLButtonElement>('.peekover-app__storage-toggle')!.click();
  }

  it('the "Stored data" control is discoverable in the header before any folder is opened', () => {
    mountAppShell(container, { store: memStore() });
    const toggle = container.querySelector<HTMLButtonElement>('.peekover-app__storage-toggle');
    expect(toggle).not.toBeNull();
    expect(toggle!.textContent).toContain('Stored data');
    // KEEPS: discoverable before any folder is opened (C014). RE-SPELLED at 4.4: it is the toolbar's
    // app control now — at ≤ 863 px behind "⋯", which a real engine shows (toolbar.browser.test.ts).
    expect(toggle!.closest('.peekover-toolbar__app')).not.toBeNull();
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
        diagrams: { count: 0, bytes: 0 },
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
  return { folders: [], recents: [], pins: [], settings: null, snapshots, captureFlag: null, diagrams: { count: 0, bytes: 0 }, total, lines };
}

describe('appShell (task 1.6 — the "erase snapshots" control)', () => {
  let container: HTMLElement;
  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  // C008: UNCHANGED at 013 task 4.4 — the census expected this helper to move; it did not break. The
  // Stored data toggle is still in the header (now inside the toolbar), and jsdom has no layout, so a
  // click reaches it at any width. Where it sits at ≤ 863 px is toolbar.browser.test.ts's.
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

// --- task 4.3 (D-5): the "Clear diagram cache" control (DOM-shape) --------------------------------
//
// The panel's THIRD erase control, and the one gate-2 sub-decision (a) specified as matching the
// snapshot pair's shape. The real clear is real-engine-proven in tests/browser/wipe.browser.test.ts
// (every survivor asserted by name); this is the jsdom DOM-shape coverage of the control — the
// disabled-at-zero state, arm, confirm, cancel — through the SAME injectable store seam, no real IDB.
//
// ★ The button's LABEL is asserted verbatim, not by regex. It is the second half of the banked panel
// line `Diagrams cached: N rendered (~size) — Clear diagram cache` (cab93c7 (a)); a re-worded button
// would still match /clear/i, which is exactly the drift a verbatim decision exists to prevent.

/** A StoredSummary carrying `n` cached diagrams and nothing else — enough to drive the control's
 *  enabled/disabled state and the panel's diagram line. */
function diagramSummary(n: number): StoredSummary {
  const diagrams = n > 0 ? { count: n, bytes: n * 1024 } : { count: 0, bytes: 0 };
  const lines = diagrams.count > 0
    ? [`Diagrams cached: ${diagrams.count} rendered (~${(diagrams.bytes / 1024).toFixed(1)} KB)`]
    : ['Nothing stored — Peekover is holding no folders, recents, or pins on this device.'];
  return {
    folders: [],
    recents: [],
    pins: [],
    settings: null,
    snapshots: { count: 0, docs: 0, bytes: 0 },
    captureFlag: null,
    diagrams,
    total: diagrams.count,
    lines,
  };
}

describe('appShell (task 4.3 — the "Clear diagram cache" control)', () => {
  let container: HTMLElement;
  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  // C010: UNCHANGED at 013 task 4.4 — the census expected this helper to move; it did not break. The
  // Stored data toggle is still in the header (now inside the toolbar), and jsdom has no layout, so a
  // click reaches it at any width. Where it sits at ≤ 863 px is toolbar.browser.test.ts's.
  function openPanel(): void {
    container.querySelector<HTMLButtonElement>('.peekover-app__storage-toggle')!.click();
  }

  const baseStore = (over: Partial<AppStore>): AppStore => ({
    putFolder: async () => undefined,
    deleteFolder: async () => undefined,
    putRecent: async () => undefined,
    ...over,
  });

  it('renders the button under cab93c7 (a)\'s exact label, and the panel\'s diagram line beside it', async () => {
    mountAppShell(container, { store: baseStore({ describeStored: async () => diagramSummary(3) }) });
    openPanel();
    await flush();

    const start = container.querySelector<HTMLButtonElement>('[data-clear-diagrams="start"]');
    expect(start).not.toBeNull();
    // VERBATIM — the control half of the banked line, character-for-character.
    expect(start!.textContent).toBe('Clear diagram cache');
    // ...and the disclosure half is in the panel, one line, as `buildStoredLines` produced it.
    expect(container.querySelector('.peekover-storage')!.textContent).toContain(
      'Diagrams cached: 3 rendered (~3.0 KB)',
    );
  });

  it('the start button is DISABLED when nothing is cached, and ENABLED when something is', async () => {
    mountAppShell(container, { store: baseStore({ describeStored: async () => diagramSummary(0) }) });
    openPanel();
    await flush();
    expect(container.querySelector<HTMLButtonElement>('[data-clear-diagrams="start"]')!.disabled).toBe(true);

    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
    mountAppShell(container, { store: baseStore({ describeStored: async () => diagramSummary(2) }) });
    openPanel();
    await flush();
    expect(container.querySelector<HTMLButtonElement>('[data-clear-diagrams="start"]')!.disabled).toBe(false);
  });

  it('arms an inline confirm — the FIRST click never clears (no browser confirm(), one surface)', async () => {
    let calls = 0;
    mountAppShell(container, {
      store: baseStore({
        describeStored: async () => diagramSummary(2),
        clearDiagramCache: async () => void (calls += 1),
      }),
    });
    openPanel();
    await flush();

    const panel = () => container.querySelector('.peekover-storage')!;
    panel().querySelector<HTMLButtonElement>('[data-clear-diagrams="start"]')!.click();

    expect(calls, 'arming is not clearing — the first click must only reveal the confirm').toBe(0);
    expect(panel().querySelector('[data-clear-diagrams="confirm"]')).not.toBeNull();
    expect(panel().querySelector('[data-clear-diagrams="cancel"]')).not.toBeNull();
  });

  it('confirm → clearDiagramCache() runs and the panel refreshes to the emptied state', async () => {
    let calls = 0;
    let cached = 4;
    mountAppShell(container, {
      store: baseStore({
        describeStored: async () => diagramSummary(cached),
        clearDiagramCache: async () => {
          calls += 1;
          cached = 0;
        },
      }),
    });
    openPanel();
    await flush();

    const panel = () => container.querySelector('.peekover-storage')!;
    panel().querySelector<HTMLButtonElement>('[data-clear-diagrams="start"]')!.click();
    panel().querySelector<HTMLButtonElement>('[data-clear-diagrams="confirm"]')!.click();
    await flush();

    expect(calls).toBe(1);
    // The panel repainted from a fresh read: the diagram line is gone and the control is disabled.
    expect(panel().textContent).not.toContain('Diagrams cached');
    expect(panel().querySelector<HTMLButtonElement>('[data-clear-diagrams="start"]')!.disabled).toBe(true);
  });

  it('cancel disarms without clearing', async () => {
    let calls = 0;
    mountAppShell(container, {
      store: baseStore({
        describeStored: async () => diagramSummary(2),
        clearDiagramCache: async () => void (calls += 1),
      }),
    });
    openPanel();
    await flush();

    const panel = () => container.querySelector('.peekover-storage')!;
    panel().querySelector<HTMLButtonElement>('[data-clear-diagrams="start"]')!.click();
    panel().querySelector<HTMLButtonElement>('[data-clear-diagrams="cancel"]')!.click();

    expect(calls).toBe(0);
    expect(panel().querySelector('[data-clear-diagrams="start"]')).not.toBeNull();
    expect(panel().querySelector('[data-clear-diagrams="confirm"]')).toBeNull();
  });

  it('the confirm copy names what clears AND that nothing is permanently lost', async () => {
    mountAppShell(container, {
      store: baseStore({
        describeStored: async () => diagramSummary(2),
        clearDiagramCache: async () => undefined,
      }),
    });
    openPanel();
    await flush();

    const panel = () => container.querySelector('.peekover-storage')!;
    panel().querySelector<HTMLButtonElement>('[data-clear-diagrams="start"]')!.click();
    const prompt = panel().querySelector('.peekover-storage__erase-prompt');
    expect(prompt!.textContent).toMatch(/diagram/i);
    // The honest part: a cleared cache costs nothing but a re-render (D-4's regenerable store).
    expect(prompt!.textContent).toMatch(/drawn again/i);
  });
});

// --- 008 task 1.4: the APP-PAGE registration site (D-1) --------------------------
//
// What is asserted HERE and what is deliberately NOT. The BADGE — its presence on both surfaces,
// its absence on an unrecognized name, its survival across a re-render — is
// `tests/browser/agentBadge.browser.test.ts`'s, in a real engine. What jsdom can see, and what
// this block is for, is the WIRING: that the production select path registers the name at all,
// and that the registration inherits NEITHER of the two gates that sit below it in
// `installWatchForFile`. Those two gates are the whole of D-1's "silent drop" argument, and each
// is asserted with the branch it guards shown FIRING in the same test — an absence assertion over
// a branch that never ran would be worth nothing.

describe('appShell (008 task 1.4 — the app-page identity registration, D-1)', () => {
  let container: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
    resetDocIdentityForTest();
  });

  /** Open a folder and click its first file — the ONLY route by which a file reaches the reader
   *  on this surface, and therefore the only honest way to observe the registration. Never calls
   *  `registerDocIdentity` by hand: a hand-registered fixture would pass against a production path
   *  wired to nothing, which is the M5 defect this milestone's seam rule exists to prevent. */
  async function openFirstFile(source: FolderSource): Promise<HTMLElement> {
    const app = mountAppShell(container, {
      openFolder: openerReturning({ ok: true, source }),
      store: fakeStore(),
    });
    await app.openFolder();
    container.querySelector<HTMLButtonElement>('[role="treeitem"][data-kind="file"]')!.click();
    await flush();
    return container.querySelector<HTMLElement>('.peekover-app__reader__host')!;
  }

  const badgeIn = (host: HTMLElement) =>
    host.shadowRoot!.querySelector<HTMLElement>('.peekover-agent-badge');

  it('the FIRST file of a session is named BEFORE it mounts — 4.7’s defect, re-run on new chrome', async () => {
    // The ordering, and the only assertion that can see it. `installWatchForFile` runs before
    // `await selectFile(file)`, and `selectFile` is what mounts; `buildAgentBadge` reads the
    // registry at BUILD time. So if the registration were moved after the select — the shape 005
    // task 4.7 found and fixed for the watch control — the name would be right and THE FIRST
    // RENDER WOULD STILL CARRY NO BADGE. Asserting the registry alone would not catch that;
    // asserting the badge on the first-ever mount of a session does.
    const host = await openFirstFile(sourceOf('notes', [mdFile('CLAUDE.md', '# Rules')]));

    expect(getDocIdentity()).toBe('CLAUDE.md');
    expect(badgeIn(host)).not.toBeNull();
    expect(badgeIn(host)!.textContent).toBe('Agent file · CLAUDE.md');
  });

  it('an unrecognized name is registered just the same — the registry names, the predicate judges', async () => {
    // NON-VACUOUS CONTROL for the case above: the same path, one thing different (the name), and
    // the registration still happens. This is what separates "the badge is gated on the name"
    // from "the badge is gated on something about this file that also happens to correlate".
    const host = await openFirstFile(sourceOf('notes', [mdFile('intro.md', '# Intro')]));

    expect(getDocIdentity()).toBe('intro.md');
    expect(badgeIn(host)).toBeNull();
    // ...and no explanatory note anywhere in the chrome either (D-14, §3.8: absence is the
    // resting state). Checked over the shadow root's non-column children, so a note appended
    // beside the reader could not hide from it.
    const chromeText = [...host.shadowRoot!.children]
      .filter((el) => !el.classList.contains('peekover-reader') && el.tagName !== 'STYLE')
      .map((el) => el.textContent ?? '')
      .join(' ');
    expect(chromeText).not.toMatch(/agent file/i);
  });

  it('★ registration survives the NOT-WATCHABLE early return — the reachable silent drop', async () => {
    // THE GATE RED-FIRST, in the form that is actually reachable. `installWatchForFile` returns
    // early when `watchCapability` says the source cannot be watched (`persistable:false` on the
    // picker route — Firefox's real, everyday case). That early return sits ABOVE the diff
    // context's `docId != null` guard, so a registration placed beside `registerDiffContext` —
    // the site plan D-1's table names — would never run here, and EVERY agent file opened through
    // a Firefox picker would go un-badged. Registering first is what makes this pass; moving the
    // call below the early return turns it red, with the badge simply absent.
    const host = await openFirstFile(
      sourceOf('notes', [mdFile('AGENTS.md', '# Rules')], { persistable: false }),
    );

    // THE CONTROL THAT FIRES: the early-return branch really was taken. Its designed note is on
    // screen and no watch toggle exists — so the assertion below is about a registration that
    // outlived a return, not about a branch the fixture failed to reach.
    expect(host.shadowRoot!.querySelector('.peekover-watch')).toBeNull();
    expect(host.shadowRoot!.querySelector('.peekover-watch-note')).not.toBeNull();

    expect(getDocIdentity()).toBe('AGENTS.md');
    expect(badgeIn(host)!.textContent).toBe('Agent file · AGENTS.md');
  });

  it('switching documents re-registers — the registry holds the CURRENT name, never the previous', async () => {
    // Row 14's registry half. The stranding this rules out is proven end to end (a stale badge on
    // the new document) in the browser suite; what this pins is the input to it — that the seam is
    // written on EVERY open rather than once per session.
    const app = mountAppShell(container, {
      openFolder: openerReturning({
        ok: true,
        source: sourceOf('notes', [mdFile('CLAUDE.md', '# Rules'), mdFile('intro.md', '# Intro')]),
      }),
      store: fakeStore(),
    });
    await app.openFolder();
    const files = [...container.querySelectorAll<HTMLButtonElement>('[role="treeitem"][data-kind="file"]')];
    const byName = (n: string) => files.find((f) => f.textContent === n)!;

    byName('CLAUDE.md').click();
    await flush();
    expect(getDocIdentity()).toBe('CLAUDE.md');

    byName('intro.md').click();
    await flush();
    expect(getDocIdentity()).toBe('intro.md'); // ← not 'CLAUDE.md'

    byName('CLAUDE.md').click();
    await flush();
    expect(getDocIdentity()).toBe('CLAUDE.md'); // ...and back, so this is not a one-way latch
  });
});

// --- 008 task 2.2: the D-3 capability pair, PROVISIONED (app page only) ----------
//
// 2.1 declared `fetchFiles?` / `fetchFileText?` as optional members and shipped zero bytes. This
// block is about the CLOSURES that fill them, and about the two properties that are the whole of
// their correctness — the ones a plausible-looking provisioning gets wrong:
//
//   (1) `fetchFiles` OMITS THE OPEN DOCUMENT. A document diffed against itself is always empty, so
//       listing it is a dead option. Asserted with the folder holding OTHER files in the same run,
//       so "the open file is absent" cannot pass because the list is empty for some other reason.
//   (2) `fetchFileText` READS FRESH. The fixture's text is MUTATED between provisioning and the
//       call, and the closure must return the NEW text — which a copy stored at install cannot
//       produce. That mutation IS the control: without it a cached provisioning passes every
//       assertion here.
//
// Everything is observed through `getDiffContext()` after driving the SAME production route the
// 1.4 block uses (open a folder, click a file). Never by hand-calling `registerDiffContext` — the
// M5 seam rule: a hand-registered fixture proves nothing about what production registers. The pair
// reaching the registry THROUGH `createDiffContext` is pinned separately and structurally by
// `diffRegistry.test.ts`'s `assertRegistrationsUseFactory` over this file's call sites.
//
// NOT here, deliberately: the row discriminant (`dataset.targetKind`, 2.3), the picker's two
// groups (2.3), the empty-state copy (2.4) and the caption (2.5). 2.2 provisions; nothing yet
// calls these closures in production.

describe('appShell (008 task 2.2 — the D-3 pair provisioned, app page)', () => {
  let container: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
    resetDocIdentityForTest();
    resetDiffRegistryForTest();
  });

  /** A file whose text is READ FROM A BOX at call time, so a test can change what the file says
   *  AFTER it has been opened. `mdFile`'s `read` closes over a constant and cannot express the
   *  freshness control. */
  function mutableFile(path: string, box: { text: string }): MarkdownFile {
    return { path, name: path.split('/').pop() ?? path, read: async () => box.text };
  }

  /** A file whose read REJECTS — the permission/IO case `MarkdownFile.read`'s contract allows. */
  function unreadableFile(path: string): MarkdownFile {
    return {
      path,
      name: path.split('/').pop() ?? path,
      read: async () => {
        throw new Error('EACCES');
      },
    };
  }

  /** Open `source` and click the file named `name` — the production route, and the only honest
   *  way to reach the provisioning site. Returns the registered context. */
  async function openAndGetContext(source: FolderSource, name: string) {
    const app = mountAppShell(container, {
      openFolder: openerReturning({ ok: true, source }),
      store: fakeStore(),
    });
    await app.openFolder();
    const items = [
      ...container.querySelectorAll<HTMLButtonElement>('[role="treeitem"][data-kind="file"]'),
    ];
    items.find((f) => f.textContent === name)!.click();
    await flush();
    const ctx = getDiffContext();
    expect(ctx, 'production must have registered a diff context for this open').not.toBeNull();
    return ctx!;
  }

  it('the pair is PRESENT on a context the app page registered — 2.1 left both absent', async () => {
    // The registration half, stated before either property: 2.1's optional members are absent by
    // default and the whole of 2.2 is that this site now fills them. If this reds, every assertion
    // below would be about a closure that does not exist.
    const ctx = await openAndGetContext(
      sourceOf('notes', [mdFile('CLAUDE.md'), mdFile('intro.md')]),
      'CLAUDE.md',
    );
    expect(typeof ctx.fetchFiles).toBe('function');
    expect(typeof ctx.fetchFileText).toBe('function');
  });

  it('★ fetchFiles OMITS the open document — "another file", never one that diffs to nothing', async () => {
    // PROPERTY (1), red-first: drop the `f.path !== openPath` filter and this reds naming
    // 'CLAUDE.md' in the list — the signature being the open file offered as its own comparison
    // target, which is exactly the dead option the exclusion exists to prevent.
    const ctx = await openAndGetContext(
      sourceOf('notes', [mdFile('CLAUDE.md'), mdFile('intro.md'), mdFile('docs/b.md')]),
      'CLAUDE.md',
    );

    const paths = (await ctx.fetchFiles!()).map((f) => f.path);
    // NON-VACUITY, in the same call: the other two ARE offered, so the absence below is an
    // exclusion and not an empty list produced by a fixture that never loaded.
    expect(paths).toEqual(['intro.md', 'docs/b.md']);
    expect(paths).not.toContain('CLAUDE.md');
  });

  it('the exclusion FOLLOWS the selection — it is the open document, not a fixed name', async () => {
    // The control that separates "excludes the open document" from "excludes the first file" or
    // "excludes a name that happens to be CLAUDE.md". Same folder, a different document open, and
    // the excluded entry moves with it — which is only true if `file.path` is what is captured.
    const files = [mdFile('CLAUDE.md'), mdFile('intro.md'), mdFile('docs/b.md')];
    const app = mountAppShell(container, {
      openFolder: openerReturning({ ok: true, source: sourceOf('notes', files) }),
      store: fakeStore(),
    });
    await app.openFolder();
    const items = [
      ...container.querySelectorAll<HTMLButtonElement>('[role="treeitem"][data-kind="file"]'),
    ];
    const byName = (n: string) => items.find((f) => f.textContent === n)!;

    byName('CLAUDE.md').click();
    await flush();
    expect((await getDiffContext()!.fetchFiles!()).map((f) => f.path)).toEqual([
      'intro.md',
      'docs/b.md',
    ]);

    byName('intro.md').click();
    await flush();
    expect((await getDiffContext()!.fetchFiles!()).map((f) => f.path)).toEqual([
      'CLAUDE.md',
      'docs/b.md',
    ]);
  });

  it('a folder holding ONLY the open document offers an EMPTY list, never null', async () => {
    // The designed state 2.4 turns into "no other markdown file in this folder" on the status line.
    // Empty array, not null and not a throw — the picker must be able to say so (AGENTS.md #5).
    const ctx = await openAndGetContext(sourceOf('notes', [mdFile('solo.md')]), 'solo.md');
    await expect(ctx.fetchFiles!()).resolves.toEqual([]);
  });

  it('★ fetchFileText reads FRESH — the file is MUTATED after opening and the NEW text comes back', async () => {
    // PROPERTY (2), and the control is the mutation itself. `other.md` says "v1" when the folder is
    // opened and this document is selected; it says "v2" by the time the closure is called. A
    // provisioning that read the text at install (or memoised the first read) returns "v1" here and
    // this reds with the STALE text named — the defect being a comparison against what the other
    // file said when this one was opened, not what it says now.
    const box = { text: '# v1\n\nfirst' };
    const ctx = await openAndGetContext(
      sourceOf('notes', [mdFile('CLAUDE.md'), mutableFile('other.md', box)]),
      'CLAUDE.md',
    );

    box.text = '# v2\n\nsecond';
    await expect(ctx.fetchFileText!('other.md')).resolves.toBe('# v2\n\nsecond');

    // ...and it is not a one-shot: a SECOND call after a SECOND mutation reads fresh again, so this
    // cannot pass by caching on the first call instead of at install.
    box.text = '# v3\n\nthird';
    await expect(ctx.fetchFileText!('other.md')).resolves.toBe('# v3\n\nthird');
  });

  it('fetchFileText resolves THAT entry — a path selects its own file, never the folder’s first', async () => {
    // The routing half of the same closure. Freshness alone would be satisfied by a closure that
    // re-read the WRONG entry every time; this pins that the `path` argument selects.
    const ctx = await openAndGetContext(
      sourceOf('notes', [
        mdFile('CLAUDE.md'),
        mdFile('intro.md', '# Intro'),
        mdFile('docs/b.md', '# Bee'),
      ]),
      'CLAUDE.md',
    );
    await expect(ctx.fetchFileText!('docs/b.md')).resolves.toBe('# Bee');
    await expect(ctx.fetchFileText!('intro.md')).resolves.toBe('# Intro');
  });

  it('an UNREADABLE file and an UNKNOWN path both yield undefined — the designed fallback', async () => {
    // `MarkdownFile.read` may reject (permission/IO), and the open document is not an offered
    // target. Both land where a missing snapshot lands: `undefined`, so 2.5's caller keeps the
    // document on screen and never enters the diff. Neither may throw out of the closure.
    const ctx = await openAndGetContext(
      sourceOf('notes', [mdFile('CLAUDE.md'), unreadableFile('locked.md'), mdFile('intro.md')]),
      'CLAUDE.md',
    );
    await expect(ctx.fetchFileText!('locked.md')).resolves.toBeUndefined();
    await expect(ctx.fetchFileText!('nope.md')).resolves.toBeUndefined();
    // The open document is not resolvable either — the same list serves both closures, so a path
    // `fetchFiles` never offered is not one `fetchFileText` will read.
    await expect(ctx.fetchFileText!('CLAUDE.md')).resolves.toBeUndefined();
    // NON-VACUITY: a readable, offered path in the SAME context really does come back.
    await expect(ctx.fetchFileText!('intro.md')).resolves.toBe('# intro.md');
  });

  it('the four EXISTING members are untouched by the provisioning (additive, not a reshape)', async () => {
    // 2.1's additive property, re-stated where the closures are actually built: adding the pair
    // must not have disturbed what 6.2 and 1.4 provisioned beside it.
    const ctx = await openAndGetContext(
      sourceOf('notes', [mdFile('CLAUDE.md'), mdFile('intro.md')]),
      'CLAUDE.md',
    );
    expect(ctx.docId).toMatch(/CLAUDE\.md$/);
    expect(typeof ctx.getCurrentSource).toBe('function');
    expect(typeof ctx.fetchMeta).toBe('function');
    expect(typeof ctx.fetchText).toBe('function');
    expect(typeof ctx.showDiff).toBe('function');
    expect(typeof ctx.hideDiff).toBe('function');
    // SHAPE only, and deliberately not a call: `fetchMeta`/`fetchText` close over the snapshot
    // store, which is real IndexedDB (`./snapshots`, not the injected `AppStore`) and does not
    // exist in jsdom. Their behaviour is 1.4's and 6.2's, asserted where an engine can run them.
  });
});

// --- 008 task 3.4: the app page's D-6 call sites, structural half -------------------------
//
// ══ WHAT THIS BLOCK IS FOR, AND WHAT IT DELIBERATELY CANNOT SEE ═══════════════════════════
//
// 3.2 unit-tested `enhanceTables` against a host it built itself. That suite passes, unchanged,
// against a build in which NOTHING CALLS IT — which is exactly what shipped at 3.2 and 3.3: the
// class was styled and matched no element in any rendered document. So nothing below calls the
// enhancer; the toolbar arrives through the shell's own click chain or it does not arrive.
//
// This is the STRUCTURE — parentage, sibling order, the gate, the count. Every assertion here is
// green against a toolbar painted invisibly on top of its table, because jsdom applies no cascade
// and returns all-zero rects. The RESOLVED geometry (row 6's `max-width` against
// `--reader-measure`, row 5's containment at both widths) is task 3.5's rect probe, and the
// real-engine version of these same rows — over BOTH call sites, which jsdom cannot drive because
// site 2 needs a real poll — is `tests/browser/tableTools.browser.test.ts`.

describe('appShell (008 task 3.4 — the table toolbar reaches the app page, D-6 sites 1-2)', () => {
  let container: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
    resetDocIdentityForTest();
    resetDiffRegistryForTest();
  });

  /** A GFM table — a real `<thead><tr><th>`, which is what markdown-it's `table` rule emits and
   *  therefore what the header gate sees on the overwhelming majority of documents. */
  const TABLE_DOC = ['# Report', '', '| col | n |', '| --- | --- |', '| a | 1 |', ''].join('\n');

  /** A hand-written HTML table with NO `<thead>`. `parse.ts` runs with `html: true` and
   *  `sanitize.ts:36` allows the table elements, so this really does reach the reading column —
   *  the gate's non-hypothetical input, not a fixture invented to have something to decline. */
  const HEADLESS_DOC = [
    '# Report',
    '',
    '<table><tbody><tr><td>a</td><td>1</td></tr></tbody></table>',
    '',
  ].join('\n');

  /** Both in ONE document, so the gate's two answers are read off the same render. */
  const MIXED_DOC = `${TABLE_DOC}\n${HEADLESS_DOC}\n`;

  const NO_TABLE_DOC = '# Report\n\nProse only, and a list:\n\n- one\n- two\n';

  async function openFile(file: MarkdownFile): Promise<HTMLElement> {
    const app = mountAppShell(container, {
      openFolder: openerReturning({ ok: true, source: sourceOf('notes', [file]) }),
      store: fakeStore(),
    });
    await app.openFolder();
    container.querySelector<HTMLButtonElement>('[role="treeitem"][data-kind="file"]')!.click();
    await flush();
    return container.querySelector<HTMLElement>('.peekover-app__reader__host')!;
  }

  const columnOf = (host: HTMLElement) =>
    host.shadowRoot!.querySelector<HTMLElement>('.peekover-reader')!;
  const toolbarsIn = (host: HTMLElement) => [
    ...host.shadowRoot!.querySelectorAll<HTMLElement>(`.${TABLE_TOOLBAR_CLASS}`),
  ];

  it('row 1 — site 1: the app page’s INITIAL select grows the toolbar, through production only', async () => {
    const host = await openFile(mdFile('report.md', TABLE_DOC));

    // THE CONTROL THAT FIRES FIRST: the document really rendered and really has a table. Without
    // it, "one toolbar" and "no toolbar" would be indistinguishable from a mount that produced
    // nothing at all.
    const tables = columnOf(host).querySelectorAll('table');
    expect(tables, 'the fixture must actually render a table').toHaveLength(1);

    expect(toolbarsIn(host)).toHaveLength(1); // one per table, not one per render
    expect(tables[0].getAttribute(TABLE_STATE_ATTR)).toBe('enhanced');
  });

  it('★ row 4 INVERTS — the toolbar is INSIDE the column, immediately BEFORE its table', async () => {
    // Every other piece of chrome in this codebase is asserted OUTSIDE `.peekover-reader`
    // (`watchControl:205`, `diffChrome:312`, `mount.ts:154-203`) and four sibling suites say so.
    // Transcribing that row unexamined produces a WRONG test here: the toolbar belongs to a block
    // in document flow, so it is a child of the column and the table's PRECEDING sibling.
    const host = await openFile(mdFile('report.md', TABLE_DOC));

    const column = columnOf(host);
    const table = column.querySelector('table')!;
    const toolbar = toolbarsIn(host)[0];

    expect(column.contains(toolbar)).toBe(true); // INSIDE — the inversion, stated as such
    expect(toolbar.parentElement).toBe(table.parentElement); // siblings, no wrapper element
    expect(table.previousElementSibling).toBe(toolbar); // IMMEDIATELY before
    // ...and the table was not moved to achieve it: it is still a direct child of the column,
    // which is what a wrap-and-restore would quietly change while passing the checks above.
    expect(table.parentElement).toBe(column);
  });

  it('★ row 3 — the gate is the HEADER: a headerless table in the SAME document gets nothing', async () => {
    // The gate red-first, with its own firing control in the fixture: if the condition were
    // ungated, BOTH tables would carry a toolbar and the count below reads 2. If the enhancer
    // never ran at all, it reads 0. Only "the gate is the header row" reads 1.
    const host = await openFile(mdFile('report.md', MIXED_DOC));

    const tables = [...columnOf(host).querySelectorAll('table')];
    expect(tables, 'the fixture must render BOTH tables').toHaveLength(2);
    expect(tables[0].tHead, 'fixture: the first table is the header one').not.toBeNull();
    expect(tables[1].tHead, 'fixture: the second table is the headerless one').toBeNull();

    expect(toolbarsIn(host)).toHaveLength(1);
    expect(tables[0].getAttribute(TABLE_STATE_ATTR)).toBe('enhanced');
    expect(tables[1].hasAttribute(TABLE_STATE_ATTR)).toBe(false);
    expect(tables[1].previousElementSibling?.className).not.toBe(TABLE_TOOLBAR_CLASS);
  });

  it('row 2 — a table-free document grows NO toolbar and is left exactly as rendered', async () => {
    const host = await openFile(mdFile('prose.md', NO_TABLE_DOC));

    expect(columnOf(host).querySelector('h1')).not.toBeNull(); // it really rendered
    expect(toolbarsIn(host)).toHaveLength(0);
    // Nothing anywhere in the shadow root — not a toolbar beside the column, not a state
    // attribute on some other element. The absence is total, which is what "no chrome where the
    // capability is absent" means.
    expect(host.shadowRoot!.querySelectorAll(`[${TABLE_STATE_ATTR}]`)).toHaveLength(0);
    // The listener half of row 2 is INERT AT 3.4 and is named rather than asserted vacuously:
    // the host is empty and the enhancer binds nothing, so "no listener" is true of EVERY
    // document today and would discriminate nothing. It becomes a real assertion at 3.6-3.8,
    // where the controls that could bind one first exist.
  });

  it('switching documents re-derives the toolbar — one per render, never accumulated', async () => {
    // `readerPane` reuses ONE host for every file (`paint`), so an enhancer that appended without
    // the column being rebuilt would stack toolbars across selects. The count is the assertion;
    // node identity is the control that proves a second render actually happened.
    const app = mountAppShell(container, {
      openFolder: openerReturning({
        ok: true,
        source: sourceOf('notes', [mdFile('a.md', TABLE_DOC), mdFile('b.md', TABLE_DOC)]),
      }),
      store: fakeStore(),
    });
    await app.openFolder();
    const items = [
      ...container.querySelectorAll<HTMLButtonElement>('[role="treeitem"][data-kind="file"]'),
    ];
    items[0].click();
    await flush();
    const host = container.querySelector<HTMLElement>('.peekover-app__reader__host')!;
    const first = toolbarsIn(host)[0];
    expect(first).toBeDefined();

    items[1].click();
    await flush();

    expect(first.isConnected).toBe(false); // the re-render really destroyed the previous chrome
    expect(toolbarsIn(host)).toHaveLength(1);
    expect(toolbarsIn(host)[0]).not.toBe(first);
  });
});

// ── 012 task 6.1 — the unsaved-changes guard: which triggers ask, and when the action runs ─────
//
// The decision and its timing, with a REAL edit session (the engine loads in jsdom): with unsaved
// changes each trigger shows the dialog and its action has not begun; without them the action
// simply runs. Focus containment, `inert` and a real Escape are the real-engine suite's
// (tests/browser/editorUnsaved.browser.test.ts), and the dialog's own contract is
// `unsavedGuard.test.ts`'s.
describe('appShell (012 task 6.1 — the unsaved-changes guard)', () => {
  let container: HTMLElement;
  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  const DIALOG = '.peekover-unsaved';
  const dialog = (): HTMLElement | null => container.querySelector<HTMLElement>(DIALOG);
  const hostOf = (): HTMLElement => container.querySelector<HTMLElement>('.peekover-app__reader__host')!;
  // 013 task 4.3 (D-6): Edit is the toolbar's segment; Read and Raw leave edit (ruling E).
  const segment = (mode: 'reading' | 'edit' | 'raw'): HTMLButtonElement =>
    container.querySelector<HTMLButtonElement>(`.peekover-toolbar__seg [data-mode="${mode}"]`)!;
  const dropNow = (): boolean =>
    container.querySelector('.peekover-app')!.dispatchEvent(new Event('drop', { bubbles: true, cancelable: true }));

  async function until(fn: () => unknown, what: string): Promise<void> {
    const end = Date.now() + 15000;
    while (!fn()) {
      if (Date.now() > end) throw new Error(`timed out: ${what}`);
      await new Promise<void>((r) => setTimeout(r, 10));
    }
  }

  /** `docs` open with a.md on screen and IN EDIT; `dirty` types into it. */
  async function editing(dirty: boolean) {
    const calls = { picker: 0, regrant: 0, drop: 0, readsOfB: 0 };
    const b: MarkdownFile = {
      path: 'b.md',
      name: 'b.md',
      read: async () => {
        calls.readsOfB += 1;
        return '# B';
      },
    };
    let pickerOutcome: OpenFolderOutcome = { ok: true, source: sourceOf('docs', [mdFile('a.md', '# A\n\nbody'), b]) };
    const store = memStore({
      folders: [folderRow({ id: 'H', name: 'kept-handle', handle: {} as FileSystemDirectoryHandle })],
      pins: [{ id: 'p', kind: 'folder', folderId: 'H', path: '', name: 'kept-handle', pinnedAt: 1 }],
    });
    const app = mountAppShell(container, {
      store,
      openFolder: async () => {
        calls.picker += 1;
        return pickerOutcome;
      },
      reopenFromHandle: async () => {
        calls.regrant += 1;
        return { ok: true, source: sourceOf('kept-handle', []) };
      },
      dropToOutcome: async () => {
        calls.drop += 1;
        return { ok: true, source: sourceOf('dropped', []) };
      },
    });
    await app.openFolder();
    calls.picker = 0;
    pickerOutcome = { ok: true, source: sourceOf('picked', []) };
    container.querySelector<HTMLButtonElement>('[role="treeitem"][data-kind="file"]')!.click();
    // KEEPS: the fixture enters a real edit session (C017–C019). RE-SPELLED at 4.3: through the
    // toolbar's Edit segment — the shadow-root control is gone.
    await until(() => segment('edit') && !segment('edit').disabled, 'the Edit segment');
    segment('edit').click();
    await until(() => hostOf().getAttribute('data-mode') === 'edit', 'edit mode');
    const { editorSessionFor } = await import('../render/editorView');
    const session = editorSessionFor(hostOf())!;
    if (dirty) session.view.dispatch({ changes: { from: 0, insert: 'typed ' } });
    return { app, calls, buffer: () => editorSessionFor(hostOf())?.view.state.doc.toString() };
  }

  type Rig = Awaited<ReturnType<typeof editing>>;
  // KEEPS: every exit is a trigger — asks when dirty (C017), asks nothing when clean (C001).
  // RE-SPELLED at 4.3: the edit control's exit is now Read and Raw in the toolbar (ruling E).
  const TRIGGERS: [string, (rig: Rig) => void][] = [
    ['Read in the toolbar', () => segment('reading').click()],
    ['Raw in the toolbar', () => segment('raw').click()],
    ['a tree selection', () => container.querySelectorAll<HTMLElement>('[role="treeitem"][data-kind="file"]')[1].click()],
    ['Revoke', () => container.querySelector<HTMLElement>('.peekover-app__chip-revoke')!.click()],
    ['openFolder()', ({ app }) => void app.openFolder()],
    ['a reopen-hub entry', () => container.querySelector<HTMLElement>('.peekover-recents__entry')!.click()],
    ['a drop', () => void dropNow()],
    ['selectFile()', ({ app }) => void app.selectFile({ name: 'seam.md', read: async () => '# seam' })],
  ];

  it.each(TRIGGERS)('★ DIRTY — %s asks, and nothing of the action has begun', async (_name, trigger) => {
    const rig = await editing(true);
    const before = rig.buffer();
    trigger(rig);
    await flush();
    await flush();

    expect(rig.buffer(), 'the typed text is still in a live session').toBe(before);
    expect(dialog(), 'the guard asked').not.toBeNull();
    expect(rig.calls.picker).toBe(0);
    expect(rig.calls.regrant).toBe(0);
    expect(rig.calls.readsOfB).toBe(0);
    expect(container.querySelector('.peekover-app__chip')?.textContent).toContain('docs');

    container.querySelector<HTMLElement>('.peekover-unsaved__keep')!.click();
    await flush();
    expect(dialog()).toBeNull();
    expect(rig.buffer()).toBe(before);
    expect(hostOf().getAttribute('data-mode')).toBe('edit');
    expect(rig.calls.picker + rig.calls.regrant + rig.calls.readsOfB, 'and Keep editing started nothing').toBe(0);
  });

  it.each(TRIGGERS)('CLEAN — %s asks nothing', async (_name, trigger) => {
    const rig = await editing(false);
    trigger(rig);
    expect(dialog(), 'no dialog at the trigger').toBeNull();
    await flush();
    await flush();
    expect(dialog(), 'and none after').toBeNull();
    expect(container.querySelector('.peekover-app__reader__host')?.getAttribute('data-mode') ?? null).not.toBe('edit');
  });

  it('★ Discard edits starts the action INSIDE its own click — where the picker gets its activation', async () => {
    const rig = await editing(true);
    void rig.app.openFolder();
    await flush();
    expect(rig.calls.picker).toBe(0);

    container.querySelector<HTMLElement>('.peekover-unsaved__discard')!.click();
    expect(rig.calls.picker, 'called before the click returned').toBe(1);
    expect(hostOf().getAttribute('data-mode'), 'and the session was ended first').not.toBe('edit');
    await flush();
    await flush();
    expect(container.querySelector('.peekover-app__chip')?.textContent).toContain('picked');
  });

  it('★ a drop is captured DURING its event, then asked about; Keep editing drops it', async () => {
    const rig = await editing(true);
    const before = rig.buffer();
    dropNow();
    expect(rig.calls.drop, 'taken before the event returned').toBe(1);
    await flush();
    await flush();
    expect(dialog()).not.toBeNull();
    expect(container.querySelector('.peekover-app__chip')?.textContent, 'not applied while asking').toContain('docs');

    container.querySelector<HTMLElement>('.peekover-unsaved__keep')!.click();
    await flush();
    await flush();
    expect(container.querySelector('.peekover-app__chip')?.textContent, 'and never applied').toContain('docs');
    expect(rig.buffer()).toBe(before);
  });

  it('while the question is up, another trigger is ignored', async () => {
    const rig = await editing(true);
    // KEEPS: one question at a time (C016). RE-SPELLED at 4.3: the first trigger is Raw in the toolbar.
    segment('raw').click();
    await flush();
    dropNow();
    void rig.app.openFolder();
    await flush();
    expect(container.querySelectorAll(DIALOG)).toHaveLength(1);
    expect(rig.calls.drop).toBe(0);
    expect(rig.calls.picker).toBe(0);
  });
});

// The unsaved-changes guard (012 task 6.1; rulings R6, R16, R23).
//
// A document being edited with unsaved changes is never left without asking. Every way out of an
// edit session is listed below, and each is driven here the way a user reaches it.
//
// ══ THE EXITS (decisions.md, "M12 TASK 6.1 — LANDED") ═══════════════════════════════════════════
//
//   the edit control ("Stop editing") · selecting a file in the tree · Revoke · opening a folder ·
//   a reopen-hub entry (a live handle; a re-pick; a re-pick that is then cancelled) · a drop (a
//   folder; something that is not one) · the shell's store-free `selectFile` seam · and the tab
//   closing or reloading, which is the browser's own `beforeunload` question.
//
// ══ WHAT EACH PATH IS HELD TO ═══════════════════════════════════════════════════════════════════
//
//   STAY     The FIRST assertion is the typed text, read from the live edit session after the
//            trigger. With no guard on a path that is the one that fails — as LOST TEXT — before
//            anything about a dialog is looked at (red-first, recorded in progress.md's 6.1 record).
//            Then: the dialog, "Keep editing", and nothing of the action has happened.
//   DISCARD  The action happens, started INSIDE the "Discard edits" click, and the session is gone.
//   CLEAN    An edit session with no unsaved change: no dialog, and the action simply happens.
//
// ══ WHAT IS REAL AND WHAT IS STOOD IN ═══════════════════════════════════════════════════════════
//
// REAL: the app shell, the tree, the grant chip, the reopen hub, the reader pane, the edit control,
// the CodeMirror view, the dialog, focus, the keyboard, `inert`. STOOD IN: the folder picker, the
// re-grant and the drop's routing, each an injected function that counts its calls and records
// whether it was called during the event that should have reached it. The native picker, a real
// drag from the desktop and the browser's own unload dialog are the human gate's (7.1).
//
// The dialog is found BY LITERAL CLASS, never through an import: this file must load, and fail on
// its claims, against a tree that has no dialog module. `unsavedGuard.test.ts` pins the literals
// to the module's exports. Its two buttons are selected by class alone — a tag in the selector
// would make "it is a button" unfalsifiable.
//
// ══ HARNESS-SHARED-STATE (AGENTS.md) ════════════════════════════════════════════════════════════
//
// Files run serially on one `document` and one `window`. `beforeunload` claims are a DELTA against
// a reading taken before the edit began; file names are unique; the registries are reset around
// each test; every host's edit view is torn down afterwards, which is also what removes a guard
// listener a failing test left on the window.

import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';

import { mountAppShell, type AppController, type AppStore } from '../../src/app/appShell';
import type { FolderSource, MarkdownFile, OpenFolderOutcome } from '../../src/app/folderSource';
import type { FolderRecord, PinRecord, RecentRecord } from '../../src/app/store';
import { wipeAll, __resetConnectionForTest } from '../../src/app/store';
import { resetDiffRegistryForTest } from '../../src/render/diffRegistry';
import { EDIT_CONTROL_CLASS } from '../../src/render/editorEnhancer';
import {
  EDITOR_DIRTY_ATTR,
  EDITOR_SAVE_CLASS,
  EDITOR_SHELL_CLASS,
  EDITOR_STATUS_CLASS,
  editorSessionFor,
  teardownEditorShell,
  type EditorSession,
} from '../../src/render/editorView';
import { readerSourceFor } from '../../src/render/readerMode';
import { resetThemeControlsForTest } from '../../src/theme/themeControl';
import { resetThemeHostsForTest } from '../../src/theme/themeRegistry';
import { resetWatchControlsForTest, WATCH_CONTROL_CLASS } from '../../src/watch/watchControl';
import { CHANGED_IN_EDIT_ATTR } from '../../src/watch/watchController';
import { isWatching, resetWatchRegistryForTest, stopWatch } from '../../src/watch/watchRegistry';

const ENGINE = navigator.userAgent.includes('Firefox') ? 'firefox' : 'chromium';
const CHROMIUM = ENGINE === 'chromium';
const record = (line: string): void => console.log(`[6.1][${ENGINE}] ${line}`);

const NARROW = { width: 414, height: 896 };

// The dialog, by literal (see the header).
const DIALOG = '.peekover-unsaved';
const KEEP = '.peekover-unsaved__keep';
const DISCARD = '.peekover-unsaved__discard';

const TYPED = ' zqxunsaved';
const LOST = '<no live edit session — the buffer is gone>';
const body = (marker: string): string => `# Guard doc\n\nA paragraph.\n\n${marker}\n`;
const TEXT_A = body('File A as opened zua.');
const TEXT_B = body('File B as opened zub.');
const TEXT_SEAM = body('The seam-fed file zus.');
const ON_DISK = body('The line on disk at open zud.');
const OUT_OF_BAND = body('The line somebody else wrote zue.');

// ── Files ─────────────────────────────────────────────────────────────────────────────────────

let seq = 0;

/** A snapshot file: no handle, which is what every Firefox folder route produces — so every path
 *  below runs on both engines. `reads` is how a test knows a file was never read. */
function mem(label: string, text: string): { file: MarkdownFile; reads: () => number } {
  seq += 1;
  const name = `${label}-${seq}-${Math.trunc(performance.now())}.md`;
  let reads = 0;
  return {
    file: {
      path: name,
      name,
      read: async () => {
        reads += 1;
        return text;
      },
    },
    reads: () => reads,
  };
}

let dir: FileSystemDirectoryHandle | null = null;
const made: string[] = [];

beforeAll(async () => {
  if (!CHROMIUM) return;
  const root = await navigator.storage.getDirectory();
  dir = await root.getDirectoryHandle('editor-unsaved-6-1', { create: true });
});

async function writeDisk(fh: FileSystemFileHandle, text: string): Promise<void> {
  const w = await fh.createWritable();
  await w.write(text);
  await w.close();
}

const readDisk = async (fh: FileSystemFileHandle): Promise<string> => (await fh.getFile()).text();

/** A real file in the origin private file system, and the `MarkdownFile` the shell is given. */
async function diskFile(label: string, text: string): Promise<{ fh: FileSystemFileHandle; file: MarkdownFile }> {
  seq += 1;
  const name = `${label}-${seq}-${Math.trunc(performance.now())}.md`;
  const fh = await dir!.getFileHandle(name, { create: true });
  made.push(name);
  await writeDisk(fh, text);
  return { fh, file: { path: name, name, read: () => readDisk(fh), handle: fh } };
}

// ── Harness ───────────────────────────────────────────────────────────────────────────────────

async function waitFor<T>(fn: () => T | null | undefined | false, what: string, ms = 20000): Promise<T> {
  const until = performance.now() + ms;
  for (;;) {
    const value = fn();
    if (value) return value as T;
    if (performance.now() > until) throw new Error(`waitFor timed out: ${what}`);
    await new Promise<void>((r) => setTimeout(r, 20));
  }
}

/** Long enough for an unguarded action to have run to its end: every stood-in step is a resolved
 *  promise, so this is many turns more than any of them needs. */
const settle = (): Promise<void> => new Promise<void>((r) => setTimeout(r, 150));

const HANDLE_FOLDER = 'kept-handle';
const REPICK_FOLDER = 'needs-repick';

/** A store whose reopen hub offers two remembered folders: one with a live handle (one-gesture
 *  re-grant) and one without (the picker again). */
function hubStore(): AppStore {
  const folders: FolderRecord[] = [
    { id: 'F-handle', name: HANDLE_FOLDER, handle: {} as FileSystemDirectoryHandle, addedAt: 1, lastOpenedAt: 1 },
    { id: 'F-repick', name: REPICK_FOLDER, addedAt: 2, lastOpenedAt: 2 },
  ];
  const pins: PinRecord[] = [
    { id: 'P-handle', kind: 'folder', folderId: 'F-handle', path: '', name: HANDLE_FOLDER, pinnedAt: 1 },
    { id: 'P-repick', kind: 'folder', folderId: 'F-repick', path: '', name: REPICK_FOLDER, pinnedAt: 2 },
  ];
  const recents: RecentRecord[] = [];
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
  };
}

/** One stood-in step: what it answers next, how often it ran, and whether its LAST run began
 *  inside the event a test marked with `during()`. */
interface Stub {
  calls: number;
  inEvent: boolean;
  next: OpenFolderOutcome;
}

let eventOpen = false;
/** Run `fn` as "the event": a stub called before it returns was called synchronously inside it. */
function during(fn: () => void): void {
  eventOpen = true;
  try {
    fn();
  } finally {
    eventOpen = false;
  }
}

const containers: HTMLElement[] = [];

interface Rig {
  app: AppController;
  container: HTMLElement;
  host: HTMLElement;
  a: MarkdownFile;
  b: MarkdownFile;
  bReads: () => number;
  picker: Stub;
  regrant: Stub;
  drop: Stub;
}

function source(files: MarkdownFile[], name = 'docs'): FolderSource {
  return { name, truncated: false, persistable: true, files };
}

const OTHER = (name: string): OpenFolderOutcome => ({
  ok: true,
  source: source([mem('other', body('Another folder zuo.')).file], name),
});
const CANCELLED: OpenFolderOutcome = { ok: false, reason: 'cancelled', message: 'No folder was opened.' };
const NOT_A_FOLDER: OpenFolderOutcome = { ok: false, reason: 'cancelled', message: 'Drop a folder to open it.' };

function stub(next: OpenFolderOutcome): { stub: Stub; fn: () => Promise<OpenFolderOutcome> } {
  const s: Stub = { calls: 0, inEvent: false, next };
  return {
    stub: s,
    fn: async () => {
      s.calls += 1;
      s.inEvent = eventOpen;
      return s.next;
    },
  };
}

/** Folder `docs` open with files A and B, A selected and on screen, NOT watched. */
async function opened(files?: { a: MarkdownFile; b: MarkdownFile; bReads?: () => number }): Promise<Rig> {
  const a = files?.a ?? mem('a', TEXT_A).file;
  const madeB = files ? null : mem('b', TEXT_B);
  const b = files?.b ?? madeB!.file;
  const bReads = files?.bReads ?? madeB?.reads ?? (() => 0);

  const container = document.createElement('div');
  document.body.appendChild(container);
  containers.push(container);

  const picker = stub({ ok: true, source: source([a, b]) });
  const regrant = stub(OTHER(HANDLE_FOLDER));
  const drop = stub(OTHER('dropped'));
  const app = mountAppShell(container, {
    openFolder: picker.fn,
    reopenFromHandle: regrant.fn,
    dropToOutcome: drop.fn,
    store: hubStore(),
  });
  await app.openFolder();
  picker.stub.calls = 0;
  picker.stub.next = OTHER('picked');
  const host = await select(container, a);
  expect(isWatching(), 'this fixture is UNWATCHED').toBe(false);
  return { app, container, host, a, b, bReads, picker: picker.stub, regrant: regrant.stub, drop: drop.stub };
}

const treeItem = (container: HTMLElement, file: MarkdownFile): HTMLButtonElement => {
  const item = [...container.querySelectorAll<HTMLButtonElement>('[role="treeitem"][data-kind="file"]')].find(
    (el) => el.textContent === file.name,
  );
  if (!item) throw new Error(`no tree item for ${file.name}`);
  return item;
};

/** Select `file` in the tree and wait until it is the open document. */
async function select(container: HTMLElement, file: MarkdownFile): Promise<HTMLElement> {
  treeItem(container, file).click();
  await waitFor(() => openFile(container).includes(file.name), `${file.name} to be the open file`);
  const host = await waitFor(
    () => container.querySelector<HTMLElement>('.peekover-app__reader__host'),
    'the reader host',
  );
  await waitFor(() => host.shadowRoot?.querySelector(`.${EDIT_CONTROL_CLASS}`), 'the edit control');
  return host;
}

/** The open-file indicator: the pin bar's file button names the selected file. */
const openFile = (container: HTMLElement): string =>
  container.querySelector('[data-pin="file"]')?.textContent ?? '';
const chip = (container: HTMLElement): string => container.querySelector('.peekover-app__chip')?.textContent ?? '';
const idle = (container: HTMLElement): boolean => container.querySelector('.peekover-app__cta') !== null;
const hubEntry = (container: HTMLElement, name: string): HTMLButtonElement => {
  const entry = [...container.querySelectorAll<HTMLButtonElement>('.peekover-recents__entry')].find((el) =>
    el.textContent?.includes(name),
  );
  if (!entry) throw new Error(`no reopen-hub entry for ${name}`);
  return entry;
};

const controlIn = (host: HTMLElement): HTMLElement =>
  host.shadowRoot!.querySelector<HTMLElement>(`.${EDIT_CONTROL_CLASS}`)!;
/** The OUTER reading column — a direct child of the host's shadow root, never the preview's. */
const outerColumn = (host: HTMLElement): HTMLElement =>
  [...host.shadowRoot!.children].find((el) => el.classList.contains('peekover-reader')) as HTMLElement;
const shownText = (container: HTMLElement): string => {
  const host = container.querySelector<HTMLElement>('.peekover-app__reader__host');
  return host?.shadowRoot ? (outerColumn(host)?.textContent ?? '') : '';
};

function countRemounts(host: HTMLElement): { count: () => number; stop: () => void } {
  let remounts = 0;
  const tally = (batch: MutationRecord[]): void => {
    for (const rec of batch) {
      for (const node of rec.removedNodes) {
        if (node instanceof HTMLElement && node.classList.contains('peekover-reader')) remounts += 1;
      }
    }
  };
  const observer = new MutationObserver(tally);
  observer.observe(host.shadowRoot!, { childList: true });
  return {
    count: () => {
      tally(observer.takeRecords());
      return remounts;
    },
    stop: () => observer.disconnect(),
  };
}

async function enterEdit(host: HTMLElement): Promise<EditorSession> {
  controlIn(host).click();
  await waitFor(() => host.getAttribute('data-mode') === 'edit', 'data-mode="edit"');
  const session = editorSessionFor(host);
  if (!session) throw new Error('entering edit left no live edit session');
  return session;
}

/** Append to the buffer — the document-model stand-in for typing. */
function type(session: EditorSession, text: string): void {
  session.view.dispatch({ changes: { from: session.view.state.doc.length, insert: text } });
}

/** Edit, and type: a session with unsaved changes. */
async function dirtyEdit(host: HTMLElement): Promise<EditorSession> {
  const session = await enterEdit(host);
  type(session, TYPED);
  expect(host.hasAttribute(EDITOR_DIRTY_ATTR), 'the fixture is dirty').toBe(true);
  return session;
}

/** THE CLAIM'S UNITS: the text in the host's LIVE edit session, or — once the session has been
 *  torn down or orphaned by a re-mount — the words that say it is gone. */
const liveBuffer = (host: HTMLElement): string => editorSessionFor(host)?.view.state.doc.toString() ?? LOST;

const dialogIn = (container: HTMLElement): HTMLElement | null => container.querySelector<HTMLElement>(DIALOG);
const answer = (container: HTMLElement, which: string): HTMLElement => {
  const button = container.querySelector<HTMLElement>(which);
  if (!button) throw new Error(`the dialog has no ${which}`);
  return button;
};

/** The focused element, followed through shadow roots. */
function deepActive(): Element | null {
  let el: Element | null = document.activeElement;
  while (el?.shadowRoot?.activeElement) el = el.shadowRoot.activeElement;
  return el;
}

beforeEach(async () => {
  resetDiffRegistryForTest();
  resetWatchRegistryForTest();
  resetWatchControlsForTest();
  resetThemeHostsForTest();
  resetThemeControlsForTest();
  await wipeAll();
  document.body.replaceChildren();
});

afterEach(async () => {
  stopWatch();
  for (const c of containers.splice(0)) {
    c.querySelectorAll<HTMLElement>('.peekover-app__reader__host').forEach(teardownEditorShell);
    c.remove();
  }
  for (const name of made.splice(0)) await dir?.removeEntry(name).catch(() => undefined);
  __resetConnectionForTest();
  resetDiffRegistryForTest();
  resetWatchRegistryForTest();
  resetWatchControlsForTest();
  document.body.replaceChildren();
  await page.viewport(NARROW.width, NARROW.height);
});

// ── Every exit ────────────────────────────────────────────────────────────────────────────────

interface ExitPath {
  name: string;
  /** Any change to the rig before the edit begins. */
  arrange?: (rig: Rig) => void;
  /** What the user does. Called inside `during()`. */
  trigger: (rig: Rig) => void;
  /** STAY: no part of the action has happened. (The folder, the open file, the session and the
   *  buffer are asserted for every path; this is the path's own footprint.) */
  untouched: (rig: Rig) => void;
  /** DISCARD and CLEAN: the action happened. `inClick` — it was started inside the event. */
  happened: (rig: Rig, inClick: boolean) => Promise<void>;
}

const dropEvent = (): DragEvent =>
  new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: new DataTransfer() });
const shellOf = (container: HTMLElement): HTMLElement => container.querySelector<HTMLElement>('.peekover-app')!;

const PATHS: ExitPath[] = [
  {
    name: 'the edit control ("Stop editing")',
    trigger: ({ host }) => controlIn(host).click(),
    untouched: ({ host }) => {
      expect(controlIn(host).textContent, 'the control still offers the way out').toBe('Stop editing');
    },
    happened: async ({ host, container }) => {
      expect(host.getAttribute('data-mode'), 'edit is left').not.toBe('edit');
      expect(controlIn(host).textContent).toBe('Edit');
      expect(shownText(container), 'the reading view is the file as opened').toContain('zua');
      expect(shownText(container)).not.toContain(TYPED.trim());
    },
  },
  {
    name: 'selecting another file in the tree',
    trigger: ({ container, b }) => treeItem(container, b).click(),
    untouched: ({ bReads }) => {
      expect(bReads(), 'the other file was never READ — the guard is ahead of the read').toBe(0);
    },
    happened: async ({ container, b, bReads }, inClick) => {
      if (inClick) expect(bReads(), 'the read began inside the click').toBe(1);
      await waitFor(() => shownText(container).includes('zub'), 'file B on screen');
      expect(openFile(container)).toContain(b.name);
    },
  },
  {
    name: 'Revoke',
    trigger: ({ container }) => container.querySelector<HTMLElement>('.peekover-app__chip-revoke')!.click(),
    untouched: () => undefined,
    happened: async ({ container }) => {
      await waitFor(() => idle(container), 'the idle affordance');
      expect(chip(container), 'the grant is gone').toBe('');
    },
  },
  {
    name: 'opening a folder (the picker)',
    trigger: ({ app }) => void app.openFolder(),
    untouched: ({ picker }) => {
      expect(picker.calls, 'the picker was never opened').toBe(0);
    },
    happened: async ({ container, picker }, inClick) => {
      expect(picker.calls).toBe(1);
      if (inClick) expect(picker.inEvent, 'the picker opened INSIDE the click — its activation').toBe(true);
      await waitFor(() => chip(container).includes('picked'), 'the picked folder');
    },
  },
  {
    name: 'a reopen-hub entry with a live handle (one-gesture re-grant)',
    trigger: ({ container }) => hubEntry(container, HANDLE_FOLDER).click(),
    untouched: ({ regrant, picker }) => {
      expect(regrant.calls, 'no re-grant was asked for').toBe(0);
      expect(picker.calls).toBe(0);
    },
    happened: async ({ container, regrant }, inClick) => {
      expect(regrant.calls).toBe(1);
      if (inClick) expect(regrant.inEvent, 'the re-grant began INSIDE the click').toBe(true);
      await waitFor(() => chip(container).includes(HANDLE_FOLDER), 'the reopened folder');
    },
  },
  {
    name: 'a reopen-hub entry that must be RE-PICKED',
    trigger: ({ container }) => hubEntry(container, REPICK_FOLDER).click(),
    untouched: ({ picker, regrant }) => {
      expect(picker.calls, 'the picker was never opened').toBe(0);
      expect(regrant.calls).toBe(0);
    },
    happened: async ({ container, picker }, inClick) => {
      expect(picker.calls).toBe(1);
      if (inClick) expect(picker.inEvent, 'the picker opened INSIDE the click').toBe(true);
      await waitFor(() => chip(container).includes('picked'), 'the re-picked folder');
    },
  },
  {
    name: 'a re-pick from the reopen hub that is then CANCELLED',
    arrange: ({ picker }) => void (picker.next = CANCELLED),
    trigger: ({ container }) => hubEntry(container, REPICK_FOLDER).click(),
    untouched: ({ picker }) => {
      expect(picker.calls, 'the picker was never opened').toBe(0);
    },
    happened: async ({ container, picker }) => {
      expect(picker.calls).toBe(1);
      await waitFor(() => idle(container), 'the idle affordance, after the cancel');
      expect(container.textContent).toContain('No folder was opened.');
    },
  },
  {
    name: 'a dropped folder',
    trigger: ({ container }) => shellOf(container).dispatchEvent(dropEvent()),
    untouched: ({ drop }) => {
      // The one part that MUST happen at once: the drop's handles exist only during its event.
      expect(drop.calls, 'the drop was captured').toBe(1);
      expect(drop.inEvent, 'and captured DURING the drop event').toBe(true);
    },
    happened: async ({ container, drop }) => {
      expect(drop.calls).toBe(1);
      expect(drop.inEvent, 'captured during the drop event').toBe(true);
      await waitFor(() => chip(container).includes('dropped'), 'the dropped folder');
    },
  },
  {
    name: 'a drop that is NOT a folder',
    arrange: ({ drop }) => void (drop.next = NOT_A_FOLDER),
    trigger: ({ container }) => shellOf(container).dispatchEvent(dropEvent()),
    untouched: ({ drop }) => {
      expect(drop.inEvent, 'captured DURING the drop event').toBe(true);
    },
    happened: async ({ container }) => {
      await waitFor(() => idle(container), 'the idle affordance, after the non-folder drop');
      expect(container.textContent).toContain('Drop a folder to open it.');
    },
  },
  {
    name: 'the shell’s store-free selectFile seam',
    trigger: ({ app }) => void app.selectFile({ name: 'seam.md', read: async () => TEXT_SEAM }),
    untouched: ({ container }) => {
      expect(shownText(container)).not.toContain('zus');
    },
    happened: async ({ container }) => {
      await waitFor(() => shownText(container).includes('zus'), 'the seam-fed file on screen');
    },
  },
];

describe.each(PATHS)('012 task 6.1 — the unsaved-changes guard: $name', (path) => {
  it('★ STAY: the typed text survives the trigger; "Keep editing" leaves everything exactly as it was', async () => {
    const rig = await opened();
    path.arrange?.(rig);
    const session = await dirtyEdit(rig.host);
    const before = session.view.state.doc.toString();
    const remounts = countRemounts(rig.host);

    during(() => path.trigger(rig));
    await settle();

    // THE CLAIM, FIRST, in its own units. With no guard on this path this is the line that fails.
    const after = liveBuffer(rig.host);
    record(`STAY · ${path.name}: the buffer after the trigger → ${JSON.stringify(after.slice(-24))}`);
    expect(after, 'the typed text is still in a live edit session').toBe(before);

    const dialog = dialogIn(rig.container);
    expect(dialog, 'and the guard asked').not.toBeNull();
    expect(dialog!.textContent, 'naming the file').toContain(rig.a.name);
    path.untouched(rig);

    answer(rig.container, KEEP).click();
    await settle();

    expect(dialogIn(rig.container), 'the dialog is gone').toBeNull();
    expect(chip(rig.container), 'the folder is still open').toContain('docs');
    expect(openFile(rig.container), 'the open file is unchanged').toContain(rig.a.name);
    expect(rig.container.querySelector('.peekover-app__reader__host'), 'the same reader host').toBe(rig.host);
    expect(rig.host.getAttribute('data-mode')).toBe('edit');
    expect(editorSessionFor(rig.host), 'the SAME session').toBe(session);
    expect(session.view.dom.isConnected).toBe(true);
    expect(liveBuffer(rig.host), 'the buffer is byte-identical').toBe(before);
    expect(rig.host.hasAttribute(EDITOR_DIRTY_ATTR), 'and still unsaved').toBe(true);
    expect(remounts.count(), 'the document was not re-rendered').toBe(0);
    remounts.stop();
    path.untouched(rig);
  });

  it('★ DISCARD: the action happens, begun inside the click, and the session is gone', async () => {
    const rig = await opened();
    path.arrange?.(rig);
    await dirtyEdit(rig.host);

    during(() => path.trigger(rig));
    await settle();
    expect(dialogIn(rig.container), 'the guard asked').not.toBeNull();
    path.untouched(rig);

    during(() => answer(rig.container, DISCARD).click());
    await path.happened(rig, true);
    await settle();

    expect(dialogIn(rig.container), 'the dialog is gone').toBeNull();
    const host = rig.container.querySelector<HTMLElement>('.peekover-app__reader__host');
    expect(host ? editorSessionFor(host) : undefined, 'no edit session').toBeUndefined();
    expect(rig.host.hasAttribute(EDITOR_DIRTY_ATTR)).toBe(false);
    expect(rig.host.getAttribute('data-mode')).not.toBe('edit');
    expect(rig.host.shadowRoot!.querySelector(`.${EDITOR_SHELL_CLASS}`), 'the edit view is gone').toBeNull();
  });

  it('CLEAN: an edit session with nothing unsaved is left without a word', async () => {
    const rig = await opened();
    path.arrange?.(rig);
    await enterEdit(rig.host);
    expect(rig.host.hasAttribute(EDITOR_DIRTY_ATTR), 'the fixture is clean').toBe(false);

    let asked = false;
    const seen = new MutationObserver(() => {
      if (dialogIn(rig.container)) asked = true;
    });
    seen.observe(rig.container, { childList: true, subtree: true });
    during(() => path.trigger(rig));
    await path.happened(rig, true);
    await settle();
    seen.disconnect();

    expect(asked || dialogIn(rig.container) !== null, 'no dialog, at any point').toBe(false);
    expect(rig.host.getAttribute('data-mode')).not.toBe('edit');
  });
});

// ── Dirty is what is asked about — not "an edit happened" ─────────────────────────────────────

describe('012 task 6.1 — what makes it ask', () => {
  it('typed and then put back: the buffer equals the file again, and nothing is asked', async () => {
    const rig = await opened();
    const session = await dirtyEdit(rig.host);
    const length = session.view.state.doc.length;
    session.view.dispatch({ changes: { from: length - TYPED.length, to: length, insert: '' } });
    expect(rig.host.hasAttribute(EDITOR_DIRTY_ATTR)).toBe(false);

    controlIn(rig.host).click();
    await settle();
    expect(dialogIn(rig.container)).toBeNull();
    expect(rig.host.getAttribute('data-mode')).not.toBe('edit');
  });

  it('★ AFTER A DOWNLOAD the edit is still unsaved in the folder — every exit still asks', async () => {
    const rig = await opened();
    const session = await dirtyEdit(rig.host);
    const before = session.view.state.doc.toString();

    // Swallow the download's anchor click: nothing is really downloaded.
    const clicks = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    try {
      const status = rig.host.shadowRoot!.querySelector<HTMLElement>(`.${EDITOR_STATUS_CLASS}`)!;
      rig.host.shadowRoot!.querySelector<HTMLElement>(`.${EDITOR_SAVE_CLASS}`)!.click();
      await waitFor(() => !status.hidden, 'the save to report');
      expect(status.textContent, 'the fixture really took the download route').toMatch(/^Saved as a download: /);
      expect(clicks.mock.calls.length, 'one download').toBe(1);
      expect(rig.host.hasAttribute(EDITOR_DIRTY_ATTR), 'a download leaves the edit unsaved').toBe(true);

      for (const trigger of [
        () => controlIn(rig.host).click(),
        () => treeItem(rig.container, rig.b).click(),
      ]) {
        trigger();
        await settle();
        expect(liveBuffer(rig.host), 'the text survives').toBe(before);
        expect(dialogIn(rig.container), 'and the guard asks').not.toBeNull();
        answer(rig.container, KEEP).click();
        await settle();
      }
      expect(clicks.mock.calls.length, 'and nothing more was downloaded').toBe(1);
    } finally {
      clicks.mockRestore();
    }
  });

  it('a second trigger while the question is up is ignored — one dialog, and "Keep editing" still keeps everything', async () => {
    const rig = await opened();
    const session = await dirtyEdit(rig.host);
    const before = session.view.state.doc.toString();

    controlIn(rig.host).click();
    await settle();
    expect(liveBuffer(rig.host)).toBe(before);
    const first = dialogIn(rig.container);
    expect(first).not.toBeNull();

    shellOf(rig.container).dispatchEvent(dropEvent());
    void rig.app.openFolder();
    await settle();
    expect(rig.container.querySelectorAll(DIALOG).length, 'still one dialog').toBe(1);
    expect(dialogIn(rig.container), 'the same one').toBe(first);
    expect(rig.drop.calls, 'the drop was not taken').toBe(0);
    expect(rig.picker.calls).toBe(0);

    answer(rig.container, KEEP).click();
    await settle();
    expect(liveBuffer(rig.host)).toBe(before);
    expect(chip(rig.container)).toContain('docs');
  });
});

// ── The dialog (ruling R23) ───────────────────────────────────────────────────────────────────

describe('012 task 6.1 — the dialog (R23)', () => {
  async function asking(): Promise<Rig & { session: EditorSession; dialog: HTMLElement }> {
    const rig = await opened();
    const session = await dirtyEdit(rig.host);
    controlIn(rig.host).focus();
    controlIn(rig.host).click();
    await settle();
    expect(liveBuffer(rig.host), 'the typed text survives the trigger').toContain(TYPED);
    const dialog = dialogIn(rig.container);
    if (!dialog) throw new Error('the guard did not ask');
    return { ...rig, session, dialog };
  }

  it('★ is a dialog, labelled and described in text, naming the file, with two real buttons', async () => {
    const { dialog, a, container } = await asking();
    const real = dialog.tagName === 'DIALOG' || dialog.getAttribute('role') === 'dialog';
    expect(real, 'a <dialog> or role="dialog"').toBe(true);
    if (dialog.tagName !== 'DIALOG') expect(dialog.getAttribute('aria-modal')).toBe('true');

    const byIds = (attr: string): string =>
      (dialog.getAttribute(attr) ?? '')
        .split(/\s+/)
        .filter(Boolean)
        .map((id) => dialog.ownerDocument.getElementById(id)?.textContent ?? '')
        .join(' ');
    const title = byIds('aria-labelledby');
    const description = byIds('aria-describedby');
    record(`dialog: title=${JSON.stringify(title)} · body=${JSON.stringify(description)}`);
    expect(title.trim(), 'its name is text').not.toBe('');
    expect(description, 'its description names the file').toContain(a.name);

    // Selected by class alone, so "it is a button" can fail.
    const keep = answer(container, KEEP);
    const discard = answer(container, DISCARD);
    for (const button of [keep, discard]) {
      expect(button.tagName, 'a real <button>').toBe('BUTTON');
      expect((button as HTMLButtonElement).type).toBe('button');
      expect(dialog.contains(button)).toBe(true);
    }
    record(`dialog: buttons=${JSON.stringify([keep.textContent, discard.textContent])}`);
    expect(keep.textContent).toBe('Keep editing');
    expect(discard.textContent).toBe('Discard edits');
  });

  it('★ "Keep editing" has focus as it opens, and Tab / Shift+Tab never leave the dialog', async () => {
    const { dialog, container } = await asking();
    const keep = answer(container, KEEP);
    const discard = answer(container, DISCARD);
    expect(deepActive(), 'the safe answer is the default').toBe(keep);

    const walk: (string | null | undefined)[] = [];
    for (let i = 0; i < 4; i += 1) {
      await userEvent.tab();
      walk.push(deepActive()?.textContent);
      expect(dialog.contains(deepActive()), `Tab ${i + 1} stays inside`).toBe(true);
    }
    for (let i = 0; i < 4; i += 1) {
      await userEvent.tab({ shift: true });
      walk.push(deepActive()?.textContent);
      expect(dialog.contains(deepActive()), `Shift+Tab ${i + 1} stays inside`).toBe(true);
    }
    record(`dialog: the Tab walk → ${JSON.stringify(walk)}`);
    expect(walk, 'and both buttons are reachable').toContain(discard.textContent);
    expect(walk).toContain(keep.textContent);
  });

  it('★ the page behind is inert: nothing there takes focus, and nothing there is under the pointer', async () => {
    const { dialog, container, host, session, b } = await asking();
    const keep = answer(container, KEEP);
    const behind: [string, HTMLElement][] = [
      ['a tree item', treeItem(container, b)],
      ['Revoke', container.querySelector<HTMLElement>('.peekover-app__chip-revoke')!],
      ['the header’s Export control', container.querySelector<HTMLElement>('.peekover-app__export-toggle')!],
      ['the edit control', controlIn(host)],
      ['the editor', session.view.contentDOM],
    ];
    for (const [what, el] of behind) {
      el.focus();
      expect(deepActive(), `${what} cannot take focus`).toBe(keep);
      const box = el.getBoundingClientRect();
      if (box.width > 0 && box.height > 0) {
        const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
        expect(hit !== null && dialog.contains(hit), `${what} is not under the pointer`).toBe(true);
      }
    }
  });

  it('★ Escape is "Keep editing": the dialog closes, nothing happened, and focus is back where it was', async () => {
    const { container, host, session, b } = await asking();
    const before = session.view.state.doc.toString();
    await userEvent.keyboard('{Escape}');
    await settle();

    expect(dialogIn(container), 'closed').toBeNull();
    expect(host.getAttribute('data-mode')).toBe('edit');
    expect(liveBuffer(host)).toBe(before);
    expect(deepActive(), 'focus returns to the control that was used').toBe(controlIn(host));

    // And the page is live again: the control behind can take focus and be reached.
    const item = treeItem(container, b);
    item.focus();
    expect(deepActive(), 'the page behind is no longer inert').toBe(item);
  });
});

// ── Tab close and reload ──────────────────────────────────────────────────────────────────────

describe('012 task 6.1 — beforeunload: asked for only while an unsaved edit exists', () => {
  /** Would the browser ask before unloading now? A cancelable `beforeunload` is offered to the
   *  window's listeners; the answer is whether one of them claimed it. The browser's own dialog
   *  is not raised by a synthetic event — that part is the human gate's (7.1). */
  function unloadClaimed(): boolean {
    const event = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(event);
    return event.defaultPrevented;
  }

  it('★ absent before; present while dirty; still present after "Keep editing"; absent after "Discard edits"', async () => {
    const rig = await opened();
    const base = unloadClaimed();
    const adds = vi.spyOn(window, 'addEventListener');
    const removes = vi.spyOn(window, 'removeEventListener');
    const count = (spy: typeof adds): number => spy.mock.calls.filter(([name]) => name === 'beforeunload').length;
    try {
      const session = await enterEdit(rig.host);
      const cleanInEdit = unloadClaimed();
      type(session, TYPED);
      const whileDirty = unloadClaimed();
      type(session, ' more');
      const added = count(adds);

      controlIn(rig.host).click();
      await settle();
      expect(liveBuffer(rig.host), 'the typed text survives the trigger').toContain(TYPED);
      answer(rig.container, KEEP).click();
      await settle();
      const afterKeep = unloadClaimed();

      controlIn(rig.host).click();
      await settle();
      answer(rig.container, DISCARD).click();
      await settle();
      const afterDiscard = unloadClaimed();

      record(
        `beforeunload: base=${base} cleanInEdit=${cleanInEdit} dirty=${whileDirty} afterKeep=${afterKeep} ` +
          `afterDiscard=${afterDiscard} · listeners added=${added} removed=${count(removes)}`,
      );
      expect(cleanInEdit, 'a clean edit session claims nothing').toBe(base);
      expect(whileDirty, 'an unsaved edit claims the unload').toBe(true);
      expect(added, 'one listener, however much is typed').toBe(1);
      expect(afterKeep, '"Keep editing" keeps the claim').toBe(true);
      expect(afterDiscard, '"Discard edits" releases it').toBe(base);
      expect(count(adds) - count(removes), 'no listener is left on the shared window').toBe(0);
    } finally {
      adds.mockRestore();
      removes.mockRestore();
    }
  });

  it('★ a CLEAN exit leaves nothing behind either: typed, put back, edit left', async () => {
    const rig = await opened();
    const base = unloadClaimed();
    const adds = vi.spyOn(window, 'addEventListener');
    const removes = vi.spyOn(window, 'removeEventListener');
    const count = (spy: typeof adds): number => spy.mock.calls.filter(([name]) => name === 'beforeunload').length;
    try {
      const session = await dirtyEdit(rig.host);
      expect(unloadClaimed(), 'the firing control: dirty claims the unload').toBe(true);
      const length = session.view.state.doc.length;
      session.view.dispatch({ changes: { from: length - TYPED.length, to: length, insert: '' } });
      expect(unloadClaimed(), 'put back: released while still in edit').toBe(base);

      type(session, TYPED);
      session.view.dispatch({ changes: { from: length - TYPED.length, to: length, insert: '' } });
      controlIn(rig.host).click();
      await settle();
      expect(rig.host.getAttribute('data-mode')).not.toBe('edit');
      expect(unloadClaimed()).toBe(base);
      expect(count(adds) - count(removes), 'no listener is left on the shared window').toBe(0);
    } finally {
      adds.mockRestore();
      removes.mockRestore();
    }
  });

  it('a session ended by the shell — the folder closed over a dirty buffer, by "Discard edits" — releases it too', async () => {
    const rig = await opened();
    const base = unloadClaimed();
    await dirtyEdit(rig.host);
    expect(unloadClaimed()).toBe(true);

    rig.container.querySelector<HTMLElement>('.peekover-app__chip-revoke')!.click();
    await settle();
    expect(liveBuffer(rig.host), 'the typed text survives the trigger').toContain(TYPED);
    answer(rig.container, DISCARD).click();
    await waitFor(() => idle(rig.container), 'the idle affordance');
    expect(unloadClaimed()).toBe(base);
  });
});

// ── R6: the dirty-exit asymmetry, on a document the app page itself is watching ───────────────

describe.runIf(CHROMIUM)('012 task 6.1 — R6’s asymmetry on the app page’s own watch (Chromium)', () => {
  /** A is a real file, open and WATCHED through the reader's own watch control — the shell's
   *  controller and detector (4.3's rig). In edit, typed, and then changed by somebody else: the
   *  watch holds that change and raises 4.2's hint. */
  async function heldChange(): Promise<Rig & { session: EditorSession; fh: FileSystemFileHandle }> {
    const disk = await diskFile('r6', ON_DISK);
    const other = mem('b', TEXT_B);
    const rig = await opened({ a: disk.file, b: other.file, bReads: other.reads });
    // `opened()` asserted unwatched; start the app page's own watch now.
    const pill = rig.host.shadowRoot!.querySelector<HTMLElement>(`.${WATCH_CONTROL_CLASS}`);
    expect(pill, 'the app page offers its watch control for this file').not.toBeNull();
    pill!.click();
    await waitFor(() => isWatching(), 'the app page’s own watch to start');

    const session = await dirtyEdit(rig.host);
    await writeDisk(disk.fh, OUT_OF_BAND);
    await waitFor(() => rig.host.hasAttribute(CHANGED_IN_EDIT_ATTR), 'the hint, for the held external change', 8000);
    return { ...rig, session, fh: disk.fh };
  }

  it('★ (i) STAY: still in edit, NO flush — the deferral and the hint persist, the buffer intact', async () => {
    const rig = await heldChange();
    const before = rig.session.view.state.doc.toString();
    const remounts = countRemounts(rig.host);

    for (const [what, trigger] of [
      ['the edit control', () => controlIn(rig.host).click()],
      ['a file selection', () => treeItem(rig.container, rig.b).click()],
    ] as const) {
      trigger();
      await settle();
      expect(liveBuffer(rig.host), `${what}: the typed text survives the exit attempt`).toBe(before);
      expect(dialogIn(rig.container), `${what}: the guard asked`).not.toBeNull();
      answer(rig.container, KEEP).click();
      await settle();

      expect(rig.host.getAttribute('data-mode'), `${what}: still in edit`).toBe('edit');
      expect(rig.host.hasAttribute(CHANGED_IN_EDIT_ATTR), `${what}: the hint persists`).toBe(true);
      expect(remounts.count(), `${what}: nothing was flushed`).toBe(0);
      expect(readerSourceFor(rig.host), `${what}: the document behind is still the text as opened`).toBe(ON_DISK);
      expect(isWatching(), `${what}: the watch is still running`).toBe(true);
      expect(liveBuffer(rig.host)).toBe(before);
    }
    expect(rig.bReads()).toBe(0);
    record(`R6 (i): hint=${rig.host.hasAttribute(CHANGED_IN_EDIT_ATTR)} remounts=${remounts.count()} watching=${isWatching()}`);
    remounts.stop();
  });

  it('★ (ii) DISCARD: dirty clears, the exit completes, the flush shows the on-disk text, the hint clears', async () => {
    const rig = await heldChange();
    const before = rig.session.view.state.doc.toString();
    const remounts = countRemounts(rig.host);

    controlIn(rig.host).click();
    await settle();
    expect(liveBuffer(rig.host), 'the typed text survives the exit attempt').toBe(before);
    expect(dialogIn(rig.container), 'the guard asked').not.toBeNull();
    expect(remounts.count(), 'and nothing is flushed while it asks').toBe(0);

    answer(rig.container, DISCARD).click();
    await waitFor(() => shownText(rig.container).includes('zue'), 'the on-disk text in the reading view', 8000);

    record(`R6 (ii): hint=${rig.host.hasAttribute(CHANGED_IN_EDIT_ATTR)} remounts=${remounts.count()} mode=${rig.host.getAttribute('data-mode')}`);
    expect(rig.host.getAttribute('data-mode')).not.toBe('edit');
    expect(rig.host.hasAttribute(EDITOR_DIRTY_ATTR)).toBe(false);
    expect(rig.host.hasAttribute(CHANGED_IN_EDIT_ATTR), 'the hint clears').toBe(false);
    expect(shownText(rig.container)).not.toContain(TYPED.trim());
    expect(remounts.count(), 'one flush').toBe(1);
    expect(await readDisk(rig.fh), 'and discard wrote nothing').toBe(OUT_OF_BAND);
    remounts.stop();
  });
});

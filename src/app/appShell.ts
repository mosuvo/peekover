// appShell — the M2 active-surface app page shell (DOM-UI + grant/selection wiring).
//
// Spec 002 introduces Peekover's SECOND surface: an extension-owned app page
// (chrome-extension://…/app.html) opened deliberately from the toolbar action. This
// module renders that page's shell — a header, a folder pane, and a reader pane — and, as
// of group 3, drives the AT-USE FOLDER GRANT FLOW: the "Open a folder" CTA (inert through
// groups 1–2) is now LIVE. Clicking it, after a plain-language line, opens the picker via
// the `folderSource` seam, runs the eager bounded markdown walk, shows a persistent
// "granted: <folder> — revoke" chip, and presents the folder's files for reading.
//
// SCOPE across group 3's tasks:
//   - 3.2 (this wiring): CTA → plain line → openFolder() → chip + folder body + designed
//     never-blank states for cancelled / unsupported / error / empty / too-large folders.
//     The folder body here is a flat file list — a real, functional presentation.
//   - 3.3 replaces `presentFolderBody` with the pure `tree` + `treeView` (search + keyboard
//     nav) at the SAME seam, so this file's grant/store/reader wiring is untouched by it.
//
// The seam stays honest: `selectFile()` (the reader seam group 1 built) is store-free and
// unchanged, so its jsdom tests keep passing; recents/folder records are written in the
// grant/select HANDLERS, best-effort (a storage failure never blanks the reader —
// AGENTS.md #5). `openFolder`/`store` are injectable so the grant flow is jsdom-testable
// without the native picker (real picker → human gate; real handle path → OPFS browser test).

import { createReaderPane, type ReaderFile, type ReaderPaneController } from './readerPane';
import {
  openFolder as defaultOpenFolder,
  openFolderFromDrop as defaultOpenFolderFromDrop,
  type FolderSource,
  type MarkdownFile,
  type OpenFolderOptions,
  type OpenFolderOutcome,
} from './folderSource';
import {
  IDLE_GRANT,
  grant,
  buildGrantChip,
  GRANT_PROMPT_LINE,
  type GrantState,
} from './capability';
import { READ_ONLY_SNAPSHOT_NOTE } from './firefoxFolderSource';
import {
  putFolder as defaultPutFolder,
  deleteFolder as defaultDeleteFolder,
  putRecent as defaultPutRecent,
  type FolderRecord,
  type RecentRecord,
} from './store';
import { createTreeView } from './treeView';

/** CSS class on the shell root; scopes every rule so nothing leaks to the document. */
const SHELL_CLASS = 'peekover-app';

/** The subset of `store` the shell writes to. Injectable so grant-flow jsdom tests need no
 *  real IndexedDB; defaults to the real store (writes are best-effort — see below). */
export interface AppStore {
  putFolder(record: FolderRecord): Promise<void>;
  deleteFolder(id: string): Promise<void>;
  putRecent(record: RecentRecord): Promise<void>;
}

/** Injectable dependencies (defaults are the real picker seam + the real store). */
export interface AppDeps {
  openFolder?: (opts?: OpenFolderOptions) => Promise<OpenFolderOutcome>;
  /** Turn a folder dropped on the app page into an `OpenFolderOutcome` (Chromium live handle /
   *  Firefox snapshot). Injectable so the drop path is jsdom-testable without a real drop —
   *  defaults to the real `openFolderFromDrop` seam. */
  dropToOutcome?: (dataTransfer: DataTransfer | null) => Promise<OpenFolderOutcome>;
  store?: AppStore;
}

/** The shell stylesheet: design tokens (light + dark) + minimal layout. */
const APP_CSS = /* css */ `
.${SHELL_CLASS}{
  --paper:#FBFBF8; --panel:#F4F4EF; --ink:#16171F; --muted:#5D6070; --faint:#9A9DAC;
  --line:#E6E6DF; --accent:#16171F; --accent-soft:#ECECE3; --hl-soft:#FFF6BF;
  --r:10px;
  --sans:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
  position:fixed; inset:0; display:flex; flex-direction:column;
  background:var(--paper); color:var(--ink);
  font-family:var(--sans); font-size:15px; line-height:1.55;
  -webkit-text-size-adjust:100%;
}
@media (prefers-color-scheme:dark){
  .${SHELL_CLASS}{
    --paper:#12141C; --panel:#181B26; --ink:#EAEBF3; --muted:#A0A4B8; --faint:#6B6F84;
    --line:#262A38; --accent:#EAEBF3; --accent-soft:#232838; --hl-soft:#3A3413;
  }
}
.${SHELL_CLASS} *,.${SHELL_CLASS} *::before,.${SHELL_CLASS} *::after{box-sizing:border-box}
.${SHELL_CLASS} :focus-visible{outline:2px solid var(--accent);outline-offset:2px;border-radius:4px}

.${SHELL_CLASS}__header{
  flex:0 0 auto; display:flex; align-items:center; gap:.6rem;
  padding:.7rem 1rem; border-bottom:1px solid var(--line); background:var(--panel);
}
.${SHELL_CLASS}__brand{font-weight:650; letter-spacing:-.01em}
.${SHELL_CLASS}__tag{color:var(--muted); font-size:.8rem}

.${SHELL_CLASS}__body{flex:1 1 auto; display:flex; min-height:0}
.${SHELL_CLASS}__folders{
  flex:0 0 clamp(220px,28%,320px); min-width:0; overflow:auto;
  border-right:1px solid var(--line); background:var(--panel); padding:1rem;
}
.${SHELL_CLASS}__reader{flex:1 1 auto; min-width:0; overflow:auto; padding:1.5rem}

.${SHELL_CLASS}__empty{
  display:flex; flex-direction:column; align-items:flex-start;
  gap:.55rem; text-align:left; color:var(--muted);
}
.${SHELL_CLASS}__cta{
  font:inherit; color:var(--ink); background:var(--paper);
  border:1px solid var(--line); border-radius:var(--r);
  padding:.55rem 1rem; cursor:pointer;
}
.${SHELL_CLASS}__cta:hover{background:var(--accent-soft)}
.${SHELL_CLASS}__cta:disabled{opacity:.6; cursor:default}
.${SHELL_CLASS}__line{color:var(--muted); font-size:.82rem; max-width:34ch}
.${SHELL_CLASS}__notice{
  color:var(--muted); font-size:.82rem; border-left:3px solid var(--line);
  padding:.35rem .6rem; background:var(--paper); border-radius:6px; max-width:34ch;
}
.${SHELL_CLASS}__notice[data-tone="warn"]{border-left-color:var(--accent)}

/* Grant chip — "granted: <name> — revoke" (capability.ts). */
.${SHELL_CLASS}__chip{
  display:flex; align-items:center; gap:.5rem; flex-wrap:wrap;
  padding:.35rem .5rem .35rem .6rem; margin-bottom:.7rem;
  border:1px solid var(--line); border-radius:999px; background:var(--paper);
  font-size:.82rem; color:var(--muted);
}
.${SHELL_CLASS}__chip-prefix{color:var(--faint)}
.${SHELL_CLASS}__chip-name{color:var(--ink); font-weight:600; word-break:break-word}
.${SHELL_CLASS}__chip-revoke{
  font:inherit; font-size:.78rem; color:var(--ink); background:transparent;
  border:1px solid var(--line); border-radius:999px; padding:.1rem .55rem; cursor:pointer;
}
.${SHELL_CLASS}__chip-revoke:hover{background:var(--accent-soft)}
`;

/** Build the shell style element. */
function buildStyle(doc: Document): HTMLStyleElement {
  const style = doc.createElement('style');
  style.textContent = APP_CSS;
  return style;
}

/** A best-effort id: `crypto.randomUUID()` where available, else a local unique fallback. */
let idCounter = 0;
function newId(): string {
  const uuid = globalThis.crypto?.randomUUID?.();
  if (uuid) return uuid;
  idCounter += 1;
  return `f-${Date.now()}-${idCounter}`;
}

/** The seam appShell exposes to its caller (main.ts + the grant-flow tests). */
export interface AppController {
  /**
   * Select a file to render in the reader pane, or `null` to clear it. Store-free: it only
   * drives the reader (recents are recorded by the folder file-select handler). Resolves
   * once the pane has settled; never rejects.
   */
  selectFile(file: ReaderFile | null): Promise<void>;
  /**
   * Run the folder grant flow (what the "Open a folder" CTA triggers): open the picker via
   * the seam, and on success show the chip + present the folder; on any non-grant outcome
   * paint the matching designed never-blank state. Resolves once settled; never rejects.
   * Exposed so the flow is awaitable in tests without simulating a real native picker.
   */
  openFolder(): Promise<void>;
}

/**
 * Render the app-page shell into `container` and return its controller. Idempotent: a
 * second call replaces the previous shell rather than appending a duplicate.
 */
export function mountAppShell(container: HTMLElement, deps: AppDeps = {}): AppController {
  const doc = container.ownerDocument;
  const openFolderFn = deps.openFolder ?? defaultOpenFolder;
  const dropToOutcomeFn = deps.dropToOutcome ?? defaultOpenFolderFromDrop;
  const store: AppStore = deps.store ?? {
    putFolder: defaultPutFolder,
    deleteFolder: defaultDeleteFolder,
    putRecent: defaultPutRecent,
  };

  // --- shell scaffolding ---------------------------------------------------
  const shell = doc.createElement('div');
  shell.className = SHELL_CLASS;

  const header = doc.createElement('header');
  header.className = `${SHELL_CLASS}__header`;
  header.setAttribute('role', 'banner');
  const brand = doc.createElement('span');
  brand.className = `${SHELL_CLASS}__brand`;
  brand.textContent = 'Peekover';
  const tag = doc.createElement('span');
  tag.className = `${SHELL_CLASS}__tag`;
  tag.textContent = 'Zero network by default';
  header.append(brand, tag);

  const body = doc.createElement('div');
  body.className = `${SHELL_CLASS}__body`;

  const folders = doc.createElement('nav');
  folders.className = `${SHELL_CLASS}__folders`;
  folders.setAttribute('aria-label', 'Folders');

  // The repainted region of the folder pane (idle affordance ⇄ granted folder view).
  const foldersContent = doc.createElement('div');
  foldersContent.className = `${SHELL_CLASS}__folders-content`;
  folders.append(foldersContent);

  const readerPane: ReaderPaneController = createReaderPane(doc);

  body.append(folders, readerPane.element);
  shell.append(buildStyle(doc), header, body);
  container.replaceChildren(shell);

  // --- drag-and-drop folder target (Chromium live handle / Firefox snapshot) ----------
  //
  // A folder dropped onto the app page must open IN Peekover, not trigger the browser's default
  // "navigate to the dropped folder" action (which showed Firefox's file:// directory index at
  // the manual gate — the drop was never claimed by the page). Claiming the drop needs BOTH:
  //   • dragover.preventDefault() — REQUIRED for any `drop` to fire at all; also the hook for the
  //     copy cursor. Without it the browser refuses the drop and keeps its default.
  //   • drop.preventDefault() FIRST — this is what stops the navigation. It must run before any
  //     async work, so it is the first statement in the handler.
  // The DataTransfer is captured synchronously and handed to `runDrop`; its items are only valid
  // during this dispatch, so nothing engine-bound may be read after an await (see runDrop).
  shell.addEventListener('dragenter', (e) => {
    e.preventDefault(); // establish the shell as a drop zone
  });
  shell.addEventListener('dragover', (e) => {
    e.preventDefault(); // REQUIRED — without this no `drop` event fires
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
  });
  shell.addEventListener('drop', (e) => {
    e.preventDefault(); // FIRST — stop the browser navigating to the dropped folder
    void runDrop(e.dataTransfer);
  });

  // --- grant state + the active folder ------------------------------------
  let grantState: GrantState = IDLE_GRANT;
  // The remembered folder-record id for the open folder, so revoke can delete it and file
  // selections can link recents to it. Held in memory regardless of store success.
  let activeFolderId: string | null = null;
  let busy = false;

  /** Best-effort store write: storage is a convenience, never a gate on rendering. A
   *  failure (no IndexedDB in a test env, quota, etc.) is swallowed — never a blank page. */
  async function tryStore(op: () => Promise<void>): Promise<void> {
    try {
      await op();
    } catch {
      /* best-effort: never let a storage failure break the reader (AGENTS.md #5) */
    }
  }

  // --- reader/select seam (store-free; unchanged from group 1) -------------
  function selectFile(file: ReaderFile | null): Promise<void> {
    return readerPane.select(file);
  }

  /** Select a folder file: render it AND record a recent (best-effort), linked to the
   *  active folder. Recents are written here, not in the reader seam, so `selectFile`
   *  stays store-free. */
  async function selectFolderFile(file: MarkdownFile): Promise<void> {
    await selectFile(file);
    if (activeFolderId) {
      const folderId = activeFolderId;
      await tryStore(() =>
        store.putRecent({
          id: newId(),
          folderId,
          path: file.path,
          name: file.name,
          openedAt: Date.now(),
        }),
      );
    }
  }

  // --- folder-pane painters -----------------------------------------------

  /** Paint the idle affordance: the plain-language line + the live CTA, optionally above a
   *  designed notice (e.g. "No folder was opened." after a cancel). Never blank. */
  function paintIdle(notice?: { text: string; tone?: 'warn' }): void {
    grantState = IDLE_GRANT;
    activeFolderId = null;

    const wrap = doc.createElement('div');
    wrap.className = `${SHELL_CLASS}__empty`;

    if (notice) {
      const n = doc.createElement('p');
      n.className = `${SHELL_CLASS}__notice`;
      if (notice.tone) n.setAttribute('data-tone', notice.tone);
      n.textContent = notice.text;
      wrap.append(n);
    }

    const msg = doc.createElement('p');
    msg.textContent = 'Open a folder to begin';

    // The plain-language line shown BEFORE the picker — the trust moment (capability.ts).
    const line = doc.createElement('p');
    line.className = `${SHELL_CLASS}__line`;
    line.textContent = GRANT_PROMPT_LINE;

    const cta = doc.createElement('button');
    cta.type = 'button';
    cta.className = `${SHELL_CLASS}__cta`;
    cta.textContent = 'Open a folder';
    cta.addEventListener('click', () => void runOpenFolder());

    wrap.append(msg, line, cta);
    foldersContent.replaceChildren(wrap);
  }

  /**
   * Present the granted folder: the "granted: <name> — revoke" chip + the searchable,
   * keyboard-operable file tree (treeView), which itself surfaces the "folder too large"
   * state and the empty-folder / no-match designed states (never blank).
   */
  function paintGranted(source: FolderSource): void {
    grantState = grant(source.name);

    const wrap = doc.createElement('div');
    wrap.className = `${SHELL_CLASS}__folderview`;

    const chip = buildGrantChip(doc, grantState, () => void revokeAccess());
    if (chip) wrap.append(chip);

    // The read-only-snapshot honesty note, driven by the SEAM's `persistable` bit — never by
    // sniffing the engine (plan.md §seam). Chromium sources are `persistable` and show
    // nothing here; a Firefox (or picker-disabled) snapshot is `persistable:false` and gets
    // the plain "point-in-time, re-pick to reopen — a Firefox platform limitation" note.
    if (!source.persistable) {
      const note = doc.createElement('p');
      note.className = `${SHELL_CLASS}__notice`;
      note.setAttribute('data-state', 'read-only-snapshot');
      note.setAttribute('data-tone', 'warn');
      note.textContent = READ_ONLY_SNAPSHOT_NOTE;
      wrap.append(note);
    }

    const treeView = createTreeView(doc, {
      files: source.files,
      truncated: source.truncated,
      onSelect: (file) => void selectFolderFile(file),
    });
    wrap.append(treeView.element);

    foldersContent.replaceChildren(wrap);
  }

  // --- grant flow ----------------------------------------------------------

  /** Apply a settled open outcome (from the CTA picker OR a drop) to the shell: paint the
   *  matching designed never-blank state on any non-grant, else remember the folder + present
   *  it. The ONE place grant success is handled — the drop path reuses it verbatim, never
   *  duplicating the store/reader/present wiring. */
  async function applyOutcome(outcome: OpenFolderOutcome): Promise<void> {
    if (!outcome.ok) {
      // Designed never-blank states for every non-grant outcome. `unsupported` is a
      // firmer message (this engine can't yet); cancel/error return to the affordance.
      if (outcome.reason === 'unsupported') {
        paintIdle({ text: outcome.message, tone: 'warn' });
      } else {
        paintIdle({ text: outcome.message });
      }
      return;
    }

    const source = outcome.source;
    activeFolderId = newId();
    const folderId = activeFolderId;
    // Remember the folder (Chromium: with its handle; a capability ref, never contents).
    await tryStore(() =>
      store.putFolder({
        id: folderId,
        name: source.name,
        handle: source.persistable ? source.handle : undefined,
        addedAt: Date.now(),
        lastOpenedAt: Date.now(),
      }),
    );
    // Fresh folder → reader back to the no-selection designed state until a file is picked.
    await selectFile(null);
    paintGranted(source);
  }

  async function runOpenFolder(): Promise<void> {
    if (busy) return;
    busy = true;
    try {
      await applyOutcome(await openFolderFn());
    } finally {
      busy = false;
    }
  }

  /** Handle a folder dropped on the app page. `dataTransfer` MUST be captured synchronously in
   *  the drop handler (its items are only live during the event); the routing pulls everything
   *  engine-bound from it before its first await (see `openFolderFromDrop`). Funnels through the
   *  SAME `applyOutcome` as the CTA, so chip/tree/snapshot-note/never-blank states come free. */
  async function runDrop(dataTransfer: DataTransfer | null): Promise<void> {
    if (busy) return;
    busy = true;
    try {
      await applyOutcome(await dropToOutcomeFn(dataTransfer));
    } finally {
      busy = false;
    }
  }

  /** Revoke: drop the in-memory handle + delete the stored folder record, then return to
   *  the idle affordance and clear the reader. Real, not cosmetic (spec 002 §3.2). */
  async function revokeAccess(): Promise<void> {
    const folderId = activeFolderId;
    if (folderId) await tryStore(() => store.deleteFolder(folderId));
    await selectFile(null);
    paintIdle();
  }

  // Initial paint: the idle affordance (plain line + live CTA) — never a blank page.
  paintIdle();

  return {
    selectFile,
    openFolder: runOpenFolder,
  };
}

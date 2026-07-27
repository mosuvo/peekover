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
// SCOPE across the groups:
//   - 3.2: CTA → plain line → openFolder() → chip + tree + designed never-blank states.
//   - 5.1/5.2 (this wiring): the persisted recents/pins REOPEN HUB + per-engine reopen.
//     On mount the shell loads what `store` persisted (folders/recents/pins) and renders a
//     recents/pins hub (pure `recents` decides the order — orderRecents/orderPins — the view
//     never re-derives it). Re-opening a remembered folder is ONE gesture: a Chromium entry's
//     click carries the `reopenFromHandle` query→request→gate re-grant (spec §5.1); a Firefox
//     entry that cannot silently rehydrate re-opens the picker ("pick this folder again").
//     BOTH reopen paths funnel through the SAME `applyOutcome`/`paintGranted` the CTA uses —
//     the grant/store/reader/tree wiring is reused, never duplicated.
//
// The seam stays honest: `selectFile()` (the reader seam) is store-free; recents/folder
// records are written in the grant/select HANDLERS, best-effort (a storage failure never
// blanks the reader — AGENTS.md #5). `openFolder`/`reopenFromHandle`/`store` are injectable so
// the flow is jsdom-testable without the native picker or a real re-prompt (real picker +
// disk re-prompt → human gate; real handle path → OPFS browser tests).

import { createReaderPane, type ReaderFile, type ReaderPaneController } from './readerPane';
import {
  openFolder as defaultOpenFolder,
  openFolderFromDrop as defaultOpenFolderFromDrop,
  type FolderSource,
  type MarkdownFile,
  type OpenFolderOptions,
  type OpenFolderOutcome,
} from './folderSource';
import { reopenFromHandle as defaultReopenFromHandle } from './reopen';
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
  getFolders as defaultGetFolders,
  getRecents as defaultGetRecents,
  getPins as defaultGetPins,
  putPin as defaultPutPin,
  deleteRecent as defaultDeleteRecent,
  deletePin as defaultDeletePin,
  describeStored as defaultDescribeStored,
  wipeAll as defaultWipeAll,
  eraseSnapshots as defaultEraseSnapshots,
  type FolderRecord,
  type RecentRecord,
  type PinRecord,
  type StoredSummary,
} from './store';
import { DEFAULT_SETTINGS, type Settings } from '../settings/settings';
import { addRecent, addPin, orderRecents, orderPins, SEP } from './recents';
import {
  deleteSnapshotsForFolder as defaultDeleteSnapshotsForFolder,
  getSnapshotMeta,
  getSnapshotText,
} from './snapshots';
import { readerSourceFor } from '../render/readerMode';
import { registerDiffContext, createDiffContext } from '../render/diffRegistry';
// ★ THE IMPORT FENCE'S ONE GATED DOOR, OPENED HERE AND NOWHERE ELSE (plan §1.4, task 6.2).
// This module is the APP-PAGE graph — `mount.ts` never reaches it — so it is the one production
// file permitted to import the engine (and, with it, the `diff` package) and the view. Both are
// provisioned onto the DiffContext below as closures, which is how the affordance (`diffChrome.ts`,
// which `mount.ts` DOES import) reaches them without importing them. `diffEngine.test.ts`'s
// allowlists pin exactly this: `ALLOWED_ENGINE_IMPORTERS` and `ALLOWED_VIEW_IMPORTERS` are both
// `['src/app/appShell.ts']`. Adding either import to any other production file breaks the fence.
import { computeDiff } from '../render/diffEngine';
import { enterDiff, exitDiff } from '../render/diffView';
import {
  createRecentsView,
  type RecentEntryVM,
  type PinEntryVM,
  type ReopenKind,
} from './recentsView';
import { registerThemeHost } from '../theme/themeRegistry';
import { applyColorScheme, setThemeSetting } from '../theme/reader';
import { buildThemeControl } from '../theme/themeControl';
import { directPort } from '../settings/settingsPort';
import { publishSettings, registerSettingsSink } from '../settings/settingsSeam';
import { getSettings as defaultGetSettings, putSettings as defaultPutSettings } from './store';
import {
  getCaptureEnabled as defaultGetCaptureEnabled,
  setCaptureEnabled as defaultSetCaptureEnabled,
} from './store';
import { getCaptureFlag, setCaptureFlag } from './captureFlag';
import { createTreeView } from './treeView';
import { detectorForFile } from '../watch/detectorForFile';
import { createWatchController, DEAD_READ_NOTE } from '../watch/watchController';
import { watchCapability } from '../watch/watchAvailability';
import {
  registerWatchTarget,
  resetWatchTarget,
  setWatchNote,
  stopWatch,
  type WatchTarget,
} from '../watch/watchRegistry';
import { createStorageView } from './storageControls';

/** CSS class on the shell root; scopes every rule so nothing leaks to the document. */
const SHELL_CLASS = 'peekover-app';

/** The subset of `store` the shell uses. The write methods are required (grant flow, group 3);
 *  the read + pin methods (group 5) are OPTIONAL so a 3-method fake store (existing jsdom /
 *  browser tests) still mounts — an absent reader just yields an empty hub. Injectable so the
 *  flow needs no real IndexedDB; defaults to the real store (all writes best-effort). */
export interface AppStore {
  putFolder(record: FolderRecord): Promise<void>;
  deleteFolder(id: string): Promise<void>;
  putRecent(record: RecentRecord): Promise<void>;
  getFolders?(): Promise<FolderRecord[]>;
  getRecents?(): Promise<RecentRecord[]>;
  getPins?(): Promise<PinRecord[]>;
  putPin?(record: PinRecord): Promise<void>;
  deleteRecent?(id: string): Promise<void>;
  deletePin?(id: string): Promise<void>;
  /** The transparency read (group 2) surfaced by the "what's stored" panel (task 6.0). Optional
   *  so a minimal fake store still mounts — an absent reader just yields the empty summary. */
  describeStored?(): Promise<StoredSummary>;
  /** Erase everything (group 2) behind the "wipe all data" control (task 6.0). Optional for the
   *  same reason; absent → the wipe is a no-op the best-effort wrapper swallows. */
  wipeAll?(): Promise<void>;
  /** Erase ONLY the two snapshot stores behind the "erase snapshots" control (D-13, task 1.6) —
   *  leaves folders/recents/pins/settings AND the capture flag row intact (erasing snapshots is not
   *  erasing settings). Optional like the others; absent → a best-effort no-op the wrapper swallows. */
  eraseSnapshots?(): Promise<void>;
  /** Erase a revoked folder's snapshots (D-10, task 1.4) — every snapshot whose `docId` is inside
   *  `folderId + SEP`. Optional like the other readers; absent → the best-effort wrapper swallows,
   *  so a minimal fake store still revokes (it just has no snapshots to erase). */
  deleteSnapshotsForFolder?(folderId: string): Promise<void>;
  /** The persisted reader settings (task 5.2). Optional like the other group-5 readers so a
   *  minimal fake store still mounts — absent → the header control works and applies, it just
   *  has nothing to load from and nowhere to persist to. */
  getSettings?(): Promise<Settings>;
  putSettings?(patch: Partial<Settings>): Promise<void>;
  /** The snapshot-capture flag (D-12, task 1.5) — its OWN settings row, read/written by key.
   *  Optional like the other group-5/1.4 readers so a minimal fake store still mounts: absent →
   *  the shell keeps the default (on) and the toggle is a best-effort no-op on persistence. */
  getCaptureEnabled?(): Promise<boolean>;
  setCaptureEnabled?(enabled: boolean): Promise<void>;
}

/** Injectable dependencies (defaults are the real picker seam, re-grant, and store). */
export interface AppDeps {
  openFolder?: (opts?: OpenFolderOptions) => Promise<OpenFolderOutcome>;
  /** Turn a folder dropped on the app page into an `OpenFolderOutcome` (Chromium live handle /
   *  Firefox snapshot). Injectable so the drop path is jsdom-testable without a real drop —
   *  defaults to the real `openFolderFromDrop` seam. */
  dropToOutcome?: (dataTransfer: DataTransfer | null) => Promise<OpenFolderOutcome>;
  /** The one-gesture re-grant of a rehydrated handle (spec §5.1). Injectable so the reopen
   *  wiring is jsdom-testable without a native re-prompt; defaults to the real `reopenFromHandle`. */
  reopenFromHandle?: (handle: FileSystemDirectoryHandle, opts?: OpenFolderOptions) => Promise<OpenFolderOutcome>;
  store?: AppStore;
}

// The shell's light and dark token sets, each written ONCE and reused by every rule that needs
// them (base, media default, explicit override). Values are verbatim from design/tokens.css and
// match `readerCss.ts`'s `:host` blocks token-for-token — that identity is what makes shell and
// reader compute the SAME --paper/--ink under one theme (the coherence property, asserted in
// tests/browser/themeRuntime.browser.test.ts). Change one side and you must change both.
const LIGHT_TOKENS = /* css */ `
  --paper:#FBFBF8; --panel:#F4F4EF; --ink:#16171F; --muted:#5D6070; --faint:#9A9DAC;
  --line:#E6E6DF; --accent:#16171F; --accent-soft:#ECECE3; --hl-soft:#FFF6BF;
`;
const DARK_TOKENS = /* css */ `
  --paper:#12141C; --panel:#181B26; --ink:#EAEBF3; --muted:#A0A4B8; --faint:#6B6F84;
  --line:#262A38; --accent:#EAEBF3; --accent-soft:#232838; --hl-soft:#3A3413;
`;

/**
 * The shell stylesheet: design tokens (light + dark) + minimal layout.
 *
 * THEME CASCADE (task 3.3, spec §3.3/§7-3). Three layers, in this order and for these reasons:
 *
 *   1. `.peekover-app`                              — light base.
 *   2. `@media (prefers-color-scheme:dark)`         — the PRE-JS default. The app page is
 *      themed by CSS alone before any script resolves a setting, so it is never unthemed for
 *      a frame (and never a white flash on a dark-OS machine).
 *   3. `.peekover-app[data-theme="light"|"dark"]`   — the explicit override the theme runtime
 *      writes.
 *
 * Layer 3 beats layer 2 by SPECIFICITY, not by source order: an attribute selector on top of
 * the class is (0,2,0) against the media rule's (0,1,0), and `@media` contributes nothing to
 * specificity. That is what makes a MANUAL theme win over the OS in BOTH directions —
 * manual-dark on an OS-light machine and manual-light on an OS-dark one. Before this
 * restructure the shell was themed by the media query ALONE, so no attribute could override it
 * and a manual-dark reader sat in an OS-light shell (the §7-3 desync).
 *
 * Deliberately NOT added here: `scroll-behavior` on `.peekover-app__reader` (spec §6 — the
 * reduced-motion trap; scroll behavior stays governed by the reader's own CSS).
 *
 * THE STORAGE PANEL IS AN OVERLAY, NOT A BAND (M6 9.1 gate finding, recovery Session A defect 1).
 * `__storage-slot` used to be a shell child at `flex:0 0 auto; max-height:45%` — a full-width
 * band between header and body. Opening it pushed the folder navigator DOWN and shrank the
 * reader: two vertically-stacked left columns and a large empty region for as long as the panel
 * was open. That is the wrong shape for a transparency surface reached from a top-right header
 * button, which should drop down NEXT to its button and leave the page under it exactly where it
 * was. The slot now lives INSIDE the header and is absolutely positioned against it. Anchoring to
 * the header (rather than to `.peekover-app`, which is `position:fixed` and would also serve as a
 * containing block) means `top:100%` IS the header's bottom edge — no header-height constant to
 * keep in sync — and `right:1rem` matches the header's own horizontal padding, so the panel's
 * right edge lines up with the toggle that opened it. The `max-height` calc is a SAFETY bound,
 * not an alignment one: if the header ever grows the panel just gets shorter, nothing misaligns.
 * The `:not(:empty)` guard scopes the whole rule to the OPEN state — `toggleStorage` closes by
 * emptying the slot, and an empty absolute box would otherwise paint a stray bordered sliver
 * under the header. `z-index` clears the reader chrome's pills (`z-index:2` in `readerCss.ts`),
 * which share this stacking context through an unpositioned pane host. Pinned by
 * tests/browser/storagePanelOverlay.browser.test.ts.
 *
 * ★ RATIONALE LIVES HERE, NOT IN THE CSS BELOW, AND THAT IS LOAD-BEARING: everything inside the
 * template literal is STRING CONTENT the minifier cannot strip, so a comment written in there
 * ships to every user's browser. Writing this block as CSS cost **+1.5 KB on the app-page chunk**
 * before it was moved up here. Long-form reasoning goes in this doc comment; the CSS keeps only
 * short pointers.
 */
const APP_CSS = /* css */ `
.${SHELL_CLASS}{
  ${LIGHT_TOKENS}
  --r:10px; --shadow:0 10px 30px rgba(22,23,31,.10);
  --sans:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
  position:fixed; inset:0; display:flex; flex-direction:column;
  background:var(--paper); color:var(--ink);
  font-family:var(--sans); font-size:15px; line-height:1.55;
  -webkit-text-size-adjust:100%;
}
@media (prefers-color-scheme:dark){
  .${SHELL_CLASS}{${DARK_TOKENS}}
}
/* Explicit overrides — (0,2,0) beats the media rule's (0,1,0), so manual wins over the OS. */
.${SHELL_CLASS}[data-theme="light"]{${LIGHT_TOKENS}}
.${SHELL_CLASS}[data-theme="dark"]{${DARK_TOKENS}}
.${SHELL_CLASS} *,.${SHELL_CLASS} *::before,.${SHELL_CLASS} *::after{box-sizing:border-box}
.${SHELL_CLASS} :focus-visible{outline:2px solid var(--accent);outline-offset:2px;border-radius:4px}

.${SHELL_CLASS}__header{
  flex:0 0 auto; display:flex; align-items:center; gap:.6rem;
  padding:.7rem 1rem; border-bottom:1px solid var(--line); background:var(--panel);
  position:relative; /* containing block for __storage-slot's overlay — see APP_CSS doc comment */
}
.${SHELL_CLASS}__brand{font-weight:650; letter-spacing:-.01em}
.${SHELL_CLASS}__tag{color:var(--muted); font-size:.8rem}
/* Theme control (task 5.2) — the same element the reader chrome uses, restyled as a header
   pill. It carries the margin-left:auto, so IT is the element that pushes the header's right-hand
   group over; the storage toggle then sits beside it with a plain gap. Tokens only, matching the
   storage toggle's chrome exactly so the two read as one control group. */
.${SHELL_CLASS}__theme-toggle{
  margin-left:auto; font:inherit; font-size:.8rem; color:var(--ink); background:var(--paper);
  border:1px solid var(--line); border-radius:999px; padding:.25rem .7rem; cursor:pointer;
}
.${SHELL_CLASS}__theme-toggle:hover{background:var(--accent-soft)}
.${SHELL_CLASS}__storage-toggle{
  font:inherit; font-size:.8rem; color:var(--ink); background:var(--paper);
  border:1px solid var(--line); border-radius:999px; padding:.25rem .7rem; cursor:pointer;
}
.${SHELL_CLASS}__storage-toggle:hover{background:var(--accent-soft)}
.${SHELL_CLASS}__storage-toggle[aria-expanded="true"]{background:var(--accent-soft)}
/* "Stored data" panel: overlay dropped from the header, not a band in flow — see doc comment. */
.${SHELL_CLASS}__storage-slot:not(:empty){
  position:absolute; top:100%; right:1rem; z-index:5;
  width:min(560px,calc(100vw - 2rem));
  max-height:min(70vh,calc(100vh - 5rem)); overflow:auto;
  background:var(--paper); border:1px solid var(--line);
  border-radius:var(--r); box-shadow:var(--shadow);
}

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

/* Pin bar — "Pin this folder" / "Pin <file>" while a folder is open. */
.${SHELL_CLASS}__pinbar{display:flex; gap:.4rem; flex-wrap:wrap; margin-bottom:.7rem}
.${SHELL_CLASS}__pin{
  font:inherit; font-size:.78rem; color:var(--ink); background:var(--paper);
  border:1px solid var(--line); border-radius:999px; padding:.15rem .6rem; cursor:pointer;
}
.${SHELL_CLASS}__pin:hover{background:var(--accent-soft)}
.${SHELL_CLASS}__pin:disabled{opacity:.6; cursor:default}
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
  /**
   * Load persisted folders/recents/pins into the reopen hub and repaint it. Called once on
   * mount; exposed so tests can await the async load deterministically.
   */
  refresh(): Promise<void>;
}

/**
 * Render the app-page shell into `container` and return its controller. Idempotent: a
 * second call replaces the previous shell rather than appending a duplicate.
 */
export function mountAppShell(container: HTMLElement, deps: AppDeps = {}): AppController {
  const doc = container.ownerDocument;
  const openFolderFn = deps.openFolder ?? defaultOpenFolder;
  const dropToOutcomeFn = deps.dropToOutcome ?? defaultOpenFolderFromDrop;
  const reopenFromHandleFn = deps.reopenFromHandle ?? defaultReopenFromHandle;
  const store: AppStore = deps.store ?? {
    putFolder: defaultPutFolder,
    deleteFolder: defaultDeleteFolder,
    putRecent: defaultPutRecent,
    getFolders: defaultGetFolders,
    getRecents: defaultGetRecents,
    getPins: defaultGetPins,
    putPin: defaultPutPin,
    deleteRecent: defaultDeleteRecent,
    deletePin: defaultDeletePin,
    describeStored: defaultDescribeStored,
    wipeAll: defaultWipeAll,
    eraseSnapshots: defaultEraseSnapshots,
    deleteSnapshotsForFolder: defaultDeleteSnapshotsForFolder,
    getSettings: defaultGetSettings,
    putSettings: defaultPutSettings,
    getCaptureEnabled: defaultGetCaptureEnabled,
    setCaptureEnabled: defaultSetCaptureEnabled,
  };

  // --- shell scaffolding ---------------------------------------------------
  const shell = doc.createElement('div');
  shell.className = SHELL_CLASS;
  // The shell root is a THEMED HOST (task 3.3): registering it puts it in the same set as the
  // reader hosts, so one applyTheme broadcast writes shell + reader together and the screen can
  // never end up half-themed. `applyColorScheme` then writes the currently-resolved theme
  // immediately — the value it writes equals what the pre-JS media rule was already showing, so
  // this is a no-op visually on first paint and only diverges once a manual setting exists.
  registerThemeHost(shell);
  applyColorScheme(shell);

  const header = doc.createElement('header');
  header.className = `${SHELL_CLASS}__header`;
  header.setAttribute('role', 'banner');
  const brand = doc.createElement('span');
  brand.className = `${SHELL_CLASS}__brand`;
  brand.textContent = 'Peekover';
  const tag = doc.createElement('span');
  tag.className = `${SHELL_CLASS}__tag`;
  tag.textContent = 'Zero network by default';

  // The always-visible "what's stored" affordance (task 6.0). It lives in the header so the
  // transparency + erase controls are discoverable BEFORE any folder is opened — storage
  // ships visible, not buried behind a folder view (spec §6.17 / the trust story).
  const storageToggle = doc.createElement('button');
  storageToggle.type = 'button';
  storageToggle.className = `${SHELL_CLASS}__storage-toggle`;
  storageToggle.textContent = 'Stored data';
  storageToggle.setAttribute('aria-expanded', 'false');
  storageToggle.addEventListener('click', () => void toggleStorage());

  // The theme control (task 5.2) — the SAME builder the reader chrome uses, so the two surfaces
  // cannot drift in behaviour, labelling or a11y; only the positioning differs, and that is pure
  // CSS (readerCss.ts styles it fixed inside the shadow root, APP_CSS below styles it as a header
  // pill). It carries an extra shell class for that styling. Clicking it calls the same
  // `setThemeSetting` broadcast as everything else, so the shell root and the contained reader
  // pane re-theme together — no half-themed screen.
  const themeControl = buildThemeControl();
  themeControl.classList.add(`${SHELL_CLASS}__theme-toggle`);

  // The storage panel's slot — an overlay that DROPS FROM the header, anchored under the
  // toggle that opens it. It lives INSIDE the header (not as a shell child beside it) purely
  // so `top:100%` in APP_CSS resolves against the header box; that is what keeps the panel
  // tied to its button without tracking a header-height constant. Empty until the toggle
  // opens it — and empty means out of the layout AND unstyled (`:not(:empty)`), so the
  // folder navigator and reader never move when it opens (M6 9.1 gate finding).
  const storagePanel = doc.createElement('div');
  storagePanel.className = `${SHELL_CLASS}__storage-slot`;
  header.append(brand, tag, themeControl, storageToggle, storagePanel);

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
  // The open folder's source (for pinning) + the last-selected file (for pinning that file).
  let activeSource: FolderSource | null = null;
  let activeFile: MarkdownFile | null = null;
  let busy = false;
  // The hub slot inside the current view (idle or granted). Kept as a reference so the async
  // persisted-load updates JUST the hub, never repainting the affordance or touching grant
  // state — that decoupling is what keeps the mount-time load from racing the grant flow.
  let hubSlotEl: HTMLElement | null = null;

  // The persisted reopen-hub state, loaded from `store` (best-effort). The view renders THIS;
  // ordering is the pure `recents` module's job.
  const persisted: { folders: FolderRecord[]; recents: RecentRecord[]; pins: PinRecord[] } = {
    folders: [],
    recents: [],
    pins: [],
  };

  /** Best-effort store write: storage is a convenience, never a gate on rendering. A
   *  failure (no IndexedDB in a test env, quota, etc.) is swallowed — never a blank page. */
  async function tryStore(op: () => Promise<void>): Promise<void> {
    try {
      await op();
    } catch {
      /* best-effort: never let a storage failure break the reader (AGENTS.md #5) */
    }
  }

  /** Load persisted folders/recents/pins into memory (best-effort). Absent readers (a 3-method
   *  fake store) yield empty lists — the hub simply renders nothing. */
  async function loadPersisted(): Promise<void> {
    try {
      const [f, r, p] = await Promise.all([
        store.getFolders?.() ?? Promise.resolve([]),
        store.getRecents?.() ?? Promise.resolve([]),
        store.getPins?.() ?? Promise.resolve([]),
      ]);
      persisted.folders = f;
      persisted.recents = r;
      persisted.pins = p;
    } catch {
      /* best-effort: a failed read just leaves the hub empty */
    }
  }

  /** Re-render just the reopen hub into its slot in the current view — never repaints the
   *  affordance and never touches grant state, so it is safe to fire from an async load. */
  function renderHub(): void {
    if (!hubSlotEl) return;
    const hub = buildHub();
    hubSlotEl.replaceChildren();
    if (hub) hubSlotEl.append(hub);
  }

  /** Reload persisted state and refresh the hub (a new recent, a pin add/remove, a revoke). */
  async function refreshPersisted(): Promise<void> {
    await loadPersisted();
    renderHub();
  }

  // --- "what's stored" transparency panel + "wipe all data" (task 6.0) -----------------
  //
  // The storage controls describeStored()/wipeAll() have existed (tested, group 2) with no
  // visible surface — this wires them in. The panel toggles from the header; opening it loads
  // the summary, wiping it clears the store then refreshes BOTH the hub and the panel so the
  // emptied state is immediately visible. All reads/writes are best-effort — a storage failure
  // never blanks the page (AGENTS.md #5).

  let storageOpen = false;

  /** The designed empty summary, used when no `describeStored` reader is injected (a minimal
   *  fake store) or a read fails — matches store.describeStored()'s own "Nothing stored" line. */
  const EMPTY_SUMMARY: StoredSummary = {
    folders: [],
    recents: [],
    pins: [],
    settings: null, // nothing stored — the reader falls back to the Auto default (task 5.2)
    snapshots: { count: 0, docs: 0, bytes: 0 }, // no snapshots → no snapshot line (task 1.4)
    captureFlag: null, // no 'capture' row → default (on), nothing stored → no capture line (task 1.5)
    total: 0,
    lines: ['Nothing stored — Peekover is holding no folders, recents, or pins on this device.'],
  };

  /** Read the transparency summary (best-effort); a failed/absent read yields the honest
   *  empty state, never a blank panel. */
  async function readSummary(): Promise<StoredSummary> {
    try {
      return (await store.describeStored?.()) ?? EMPTY_SUMMARY;
    } catch {
      return EMPTY_SUMMARY;
    }
  }

  /** Render the storage panel from a freshly-read summary (best-effort). */
  async function renderStorage(): Promise<void> {
    const summary = await readSummary();
    const view = createStorageView(doc, {
      summary,
      // The checkbox reflects the LIVE cache the watch loop reads (D-12, task 1.5) — read here at
      // render time, so reopening the panel shows the current flag.
      captureEnabled: getCaptureFlag(),
      // Toggling updates the live cache SYNCHRONOUSLY (so the next watched render honours it) and
      // persists the new value best-effort. No panel re-render: the checkbox already holds its own
      // visual state, and re-rendering would drop the inline wipe-confirm mid-flow.
      onToggleCapture: (enabled) => {
        setCaptureFlag(enabled);
        void tryStore(() => store.setCaptureEnabled?.(enabled) ?? Promise.resolve());
      },
      onWipe: () => void wipeAllData(),
      onEraseSnapshots: () => void eraseSnapshotsData(),
      onClose: () => void toggleStorage(),
    });
    storagePanel.replaceChildren(view.element);
  }

  /** Show/hide the storage panel; loads a fresh summary each time it opens. */
  async function toggleStorage(): Promise<void> {
    storageOpen = !storageOpen;
    storageToggle.setAttribute('aria-expanded', String(storageOpen));
    if (storageOpen) await renderStorage();
    else storagePanel.replaceChildren();
  }

  /** Erase everything, then refresh the hub AND the open panel so the cleared state shows. */
  async function wipeAllData(): Promise<void> {
    await tryStore(() => store.wipeAll?.() ?? Promise.resolve());
    await refreshPersisted(); // the reopen hub empties
    if (storageOpen) await renderStorage(); // the panel repaints to "Nothing stored"
  }

  /** Erase ONLY the snapshot stores (D-13, task 1.6), then repaint the open panel so the emptied
   *  snapshot line disappears. The reopen hub is NOT touched — snapshots never fed it (folders/
   *  recents/pins survive the erase), so `refreshPersisted()` would be a no-op. The capture-flag
   *  live cache (`setCaptureFlag`) is deliberately NOT cleared: erasing snapshots is not erasing
   *  settings, and the flag row survives, so the in-memory flag must survive with it. Best-effort
   *  (AGENTS.md #5) — a storage failure never blanks the panel. */
  async function eraseSnapshotsData(): Promise<void> {
    await tryStore(() => store.eraseSnapshots?.() ?? Promise.resolve());
    if (storageOpen) await renderStorage(); // the snapshot line clears; every other line stands
  }

  // --- reopen-hub (recents/pins) view -------------------------------------

  /** Does the remembered folder for `folderId` still carry a live handle (Chromium)? Decides
   *  whether an entry rehydrates in one gesture or must re-pick (Firefox / revoked). */
  function folderReopenKind(folderId: string): ReopenKind {
    const folder = persisted.folders.find((f) => f.id === folderId);
    return folder?.handle ? 'rehydrate' : 'repick';
  }

  /** Build the recents/pins hub element (or null if nothing is stored) from the pure-ordered
   *  records, wiring each entry to the one-gesture reopen + unpin handlers. */
  function buildHub(): HTMLElement | null {
    const recents: RecentEntryVM[] = orderRecents(persisted.recents).map((r) => ({
      id: r.id,
      folderId: r.folderId,
      name: r.name,
      path: r.path,
      reopen: folderReopenKind(r.folderId),
    }));
    const pins: PinEntryVM[] = orderPins(persisted.pins).map((p) => ({
      id: p.id,
      folderId: p.folderId,
      kind: p.kind,
      name: p.name,
      path: p.path,
      reopen: folderReopenKind(p.folderId),
    }));
    return createRecentsView(doc, {
      recents,
      pins,
      onOpenRecent: (e) => void reopenFolder(e.folderId, e.path),
      onOpenPin: (e) => void reopenFolder(e.folderId, e.kind === 'file' ? e.path : undefined),
      onUnpin: (e) => void unpin(e.id),
    }).element;
  }

  // --- reader/select seam (store-free; unchanged from group 1) -------------
  function selectFile(file: ReaderFile | null): Promise<void> {
    return readerPane.select(file);
  }

  /** Select a folder file: render it AND record a recent (best-effort, dedup/capped via the
   *  pure `recents` module so the store never accumulates more than the cap), linked to the
   *  active folder. Also tracks the file so it can be pinned. Recents are written here, not in
   *  the reader seam, so `selectFile` stays store-free. */
  async function selectFolderFile(file: MarkdownFile): Promise<void> {
    activeFile = file;
    // WATCH WIRING FOR THE APP PAGE (tasks 4.3 + 4.4), per SELECTED FILE.
    //
    // Per-file, not per-folder, because a detector re-reads ONE file: the watch belongs to the
    // document on screen.
    //
    // A surface that cannot watch registers NO target and shows the explanation instead, so the
    // reader grows an honest note rather than a button that does nothing (spec §4 Degradation).
    //
    // ── THE ORDER IS LOAD-BEARING IN *BOTH* DIRECTIONS, and it used to be wrong in one ────────
    //
    // (1) The previous file's watch must be STOPPED before this file's target replaces it in the
    //     registry, or the old detector keeps feeding file A's text into the shared host that is
    //     now showing file B — the cross-feed bug 4.3 proved. `readerPane.select()` does that
    //     stop itself, which is why this used to sit *after* the select.
    //
    // (2) But the target must be REGISTERED BEFORE THE MOUNT, and that half was missing.
    //     `buildWatchControl` decides at mount time — `watchAvailable()` false means it returns
    //     null and mount() commits NO pill — and the registry's later `notifyWatchChanged` only
    //     re-labels controls that already exist; it cannot conjure one. So registering after
    //     `select()` (which mounts) meant **the first file opened in a session showed no watch
    //     control at all**, on both engines: it only appeared from the second file onwards,
    //     because by then the previous file's target was still in the slot at mount time.
    //     FOUND BY 4.7's verification, which is the first test ever to drive this function
    //     (`appShell.test.ts` has no watch coverage, and every watch suite registers its own
    //     target before mounting — so nothing could see it).
    //
    // Both are satisfied by stopping EXPLICITLY here and then installing before the select. The
    // `stopWatch()` inside `readerPane.select()` still runs, on a target that is not running —
    // it is idempotent, so it is a no-op rather than a second policy.
    stopWatch();
    installWatchForFile(file);
    await selectFile(file);
    renderPinBar();
    if (activeFolderId) {
      const folderId = activeFolderId;
      await tryStore(async () => {
        const entry: RecentRecord = {
          id: newId(),
          folderId,
          path: file.path,
          name: file.name,
          openedAt: Date.now(),
        };
        const existing = (await store.getRecents?.()) ?? [];
        const next = addRecent(existing, entry);
        await store.putRecent(entry);
        // Evict rows the pure cap dropped, so the store stays bounded (trust posture).
        for (const old of existing) {
          if (!next.some((n) => n.id === old.id)) await store.deleteRecent?.(old.id);
        }
      });
      await refreshPersisted();
    }
  }

  // --- watch (spec 005, tasks 4.3 + 4.4) -----------------------------------
  //
  // HOW THE ROUTE IS KNOWN WITHOUT SNIFFING THE ENGINE, and why it has to be known at all.
  // `folderSourceFromFileList` (picker) and `folderSourceFromDataTransfer` (drag) BOTH return
  // `persistable: false` on Firefox, so the seam alone cannot tell them apart — yet they differ in
  // the one way watch depends on: the DRAG path's `File.text()` reads fresh bytes from disk (task
  // 1.1), the picker path's does not. This module is the only place that knows, because it calls
  // the two routes from two distinct call sites (`runOpenFolder` vs `runDrop`), so it records which
  // one produced the active source and hands that to the pure decision. Teaching `folderSource` a
  // `watchable` bit is the tidier home and is a 006 cleanup — it is outside 005's file fence.

  /** How the ACTIVE folder arrived. Set by the two open paths; read only by the watch decision. */
  let activeRoute: 'drop' | 'picker' = 'picker';

  /** Register (or decline to register) a watch for the file now on screen. */
  function installWatchForFile(file: MarkdownFile): void {
    const decision = watchCapability({
      surface: 'app-page',
      persistable: activeSource?.persistable === true,
      route: activeRoute,
    });
    if (!decision.watchable) {
      // No target at all — `buildWatchChrome` then renders the explanation ALONE, never a toggle.
      resetWatchTarget();
      setWatchNote(decision.note);
      return;
    }
    setWatchNote(null);
    // WHICH detector is `detectorForFile`'s decision, not this module's, and it is made on the
    // CAPABILITY the selected file carries — a live `handle` plus an engine observer gets the
    // event-driven `observerDetector`; everything else gets the polled one, unchanged (task 4.7).
    // Groups 1–4 shipped polling on BOTH engines here because the seam offered only `read()`;
    // `MarkdownFile.handle` now exists on the routes that genuinely have one, which is what makes
    // spec §4's "on Chromium, on the app page, detect changes WITHOUT POLLING" true in shipped
    // code rather than only in a module nothing imported.
    //
    // The controller is deliberately built AFTER the detector and reached through a mutable ref:
    // 1.2's ladder reports a dead observation through `onDead`, and the controller is what must
    // then stop and explain. Without this, an observation that died over an unreadable file would
    // leave the pill reading "Watching" over a watch that had ended — the exact silent-stop the
    // ladder exists to prevent, reintroduced one level up.
    let controller: WatchTarget | null = null;
    const detector = detectorForFile(file, {
      onDead: () => {
        controller?.stop();
        // The SAME copy the polled path's dead-read policy shows (4.3) — one string for one
        // user-facing event, reached by two mechanisms. Set AFTER the stop, which does not
        // clear notes; `start()` clears it if the user chooses to try again.
        setWatchNote(DEAD_READ_NOTE);
      },
      // `onFallback` is deliberately NOT surfaced. A degraded observation is still WATCHING —
      // it polls instead of listening — so there is nothing the user must be told and nothing
      // they could do. Inventing copy for it would be new UI at a wiring task, un-walked at the
      // 7.1 gate. Silence here is honest; silence on `onDead` would not be.
    });
    // The snapshot document identity (§1.1) — `folderId + SEP + path`, built at the install site
    // and passed into the controller, which captures the OUTGOING source on each re-render (task
    // 1.4). `activeFolderId` is set for every app-page file open; the explicit null keeps capture
    // off if it somehow is not (no captured "unknown"). `SEP` is recents' documented separator,
    // reused so `deleteSnapshotsForFolder`'s `folderId + SEP` revoke scan (D-10) stays exact.
    const docId = activeFolderId != null ? activeFolderId + SEP + file.path : null;
    controller = createWatchController({ detector, contained: true, docId });
    registerWatchTarget(controller);

    // THE DIFF CONTEXT (task 2.1) — registered ALONGSIDE the watch target and under the SAME
    // `docId != null` guard as 1.4's capture gate, so the identical architectural rule holds: this
    // is the APP PAGE ONLY (§3.2). The content script never routes through here, and if a future
    // refactor accidentally did, the null guard preserves the registry-empty invariant its surface
    // depends on (D-3 suppression at 3.1, D-14 chrome gate at 6.2 both read `isDiffContextRegistered`).
    //
    // The context is DATA, not liveness: `getCurrentSource` reads the reader pane's live host from
    // the reader-source WeakMap (1.3) — queried from the pane rather than held, because the pane owns
    // and re-attaches that host (readerPane.ts); a detached host during a designed state yields
    // `undefined`, which is the honest "nothing on screen to diff" answer. `fetchMeta`/`fetchText`
    // close over 1.4's meta/text reads, filtered to this `docId`.
    // Last-write-wins (no explicit unregister): a stale context is harmless — `fetchMeta` over a
    // stale `docId` returns [] — exactly as `registerWatchTarget`'s next-mount-overwrites.
    //
    // ★ 6.2 AMENDS 2.1's "no engine, no view, no `diff`": the context now also carries the
    // CAPABILITY, as `showDiff`/`hideDiff` closures. That is what makes THIS file the engine's and
    // the view's first — and only — production importer. The affordance is in `mount.ts`'s graph
    // and so may import neither; it calls these closures instead, and the `diff` bytes stay on the
    // app-page side of the fence (plan §1.4). The closures are created HERE, so nothing on a
    // content-script path can reach them even by accident: that surface registers no context at all.
    if (docId != null) {
      const diffDocId = docId;
      registerDiffContext(createDiffContext({
        docId: diffDocId,
        getCurrentSource: () => {
          // The app page's live reader host — the element `mount()` renders into and keys the
          // reader-source WeakMap on (class from readerPane.ts, the same selector its own
          // real-engine test uses). Null during a designed state → undefined source.
          const host = readerPane.element.querySelector<HTMLElement>('.peekover-app__reader__host');
          return host ? readerSourceFor(host) : undefined;
        },
        fetchMeta: async () => {
          const all = await getSnapshotMeta();
          return all.find((m) => m.docId === diffDocId)?.entries ?? [];
        },
        fetchText: (id) => getSnapshotText(id),
        // Engine → view, in one step, on the app-page side of the fence. `computeDiff` is pure and
        // total (D-5 LF-normalises both sides); `enterDiff` owns the sanitize discipline, the
        // hidden-column rung and the `{ok:false, reason}` fallback — so this closure adds no
        // policy, it only joins the two the affordance is not allowed to import.
        showDiff: (host, before, after) => enterDiff(host, computeDiff(before, after)),
        hideDiff: (host) => exitDiff(host),
      }));
    }
  }

  // --- pinning (task 5.2) --------------------------------------------------

  /** Is a pin of `kind` at `path` in the active folder already stored? */
  function isPinned(kind: 'file' | 'folder', path: string): boolean {
    if (!activeFolderId) return false;
    return persisted.pins.some((p) => p.kind === kind && p.folderId === activeFolderId && p.path === path);
  }

  /** Add a pin (best-effort, idempotent via the pure `recents.addPin`), then refresh the hub. */
  async function pin(kind: 'file' | 'folder', path: string, name: string): Promise<void> {
    if (!activeFolderId) return;
    const folderId = activeFolderId;
    await tryStore(async () => {
      const record: PinRecord = { id: newId(), kind, folderId, path, name, pinnedAt: Date.now() };
      const existing = (await store.getPins?.()) ?? [];
      const next = addPin(existing, record);
      // addPin is idempotent — only persist when it actually added a row.
      if (next.length > existing.length) await store.putPin?.(record);
    });
    await refreshPersisted();
    renderPinBar();
  }

  /** Remove a pin by id (best-effort), then refresh the hub. */
  async function unpin(id: string): Promise<void> {
    await tryStore(() => store.deletePin?.(id) ?? Promise.resolve());
    await refreshPersisted();
    renderPinBar();
  }

  // The pin bar lives in the granted view; kept as a reference so a file selection / pin toggle
  // can re-render it without rebuilding the whole tree.
  let pinBarEl: HTMLElement | null = null;

  /** Render the pin bar for the open folder: "Pin this folder" + (when a file is selected)
   *  "Pin <file>". Already-pinned targets show a disabled "Pinned" state. */
  function renderPinBar(): void {
    if (!pinBarEl || !activeSource) return;
    const source = activeSource;
    const bar = pinBarEl;
    bar.replaceChildren();

    const folderPinned = isPinned('folder', '');
    const folderBtn = doc.createElement('button');
    folderBtn.type = 'button';
    folderBtn.className = `${SHELL_CLASS}__pin`;
    folderBtn.dataset.pin = 'folder';
    folderBtn.textContent = folderPinned ? 'Folder pinned' : 'Pin this folder';
    folderBtn.disabled = folderPinned;
    folderBtn.addEventListener('click', () => void pin('folder', '', source.name));
    bar.append(folderBtn);

    if (activeFile) {
      const file = activeFile;
      const filePinned = isPinned('file', file.path);
      const fileBtn = doc.createElement('button');
      fileBtn.type = 'button';
      fileBtn.className = `${SHELL_CLASS}__pin`;
      fileBtn.dataset.pin = 'file';
      fileBtn.textContent = filePinned ? `${file.name} pinned` : `Pin ${file.name}`;
      fileBtn.disabled = filePinned;
      fileBtn.addEventListener('click', () => void pin('file', file.path, file.name));
      bar.append(fileBtn);
    }
  }

  // --- folder-pane painters -----------------------------------------------

  /** Paint the idle affordance: the plain-language line + the live CTA + the reopen hub,
   *  optionally above a designed notice (e.g. "No folder was opened." after a cancel). Never
   *  blank. */
  function paintIdle(notice?: { text: string; tone?: 'warn' }): void {
    grantState = IDLE_GRANT;
    activeFolderId = null;
    activeSource = null;
    activeFile = null;
    pinBarEl = null;

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

    // The reopen hub (recents/pins) — the landing screen IS the one-gesture reopen surface.
    // It lives in its own slot, filled by renderHub (now, and again when the async load lands).
    hubSlotEl = doc.createElement('div');
    hubSlotEl.className = `${SHELL_CLASS}__hub`;
    wrap.append(hubSlotEl);

    foldersContent.replaceChildren(wrap);
    renderHub();
  }

  /**
   * Present the granted folder: the "granted: <name> — revoke" chip, the pin bar, the
   * searchable/keyboard-operable file tree (treeView), and the reopen hub. The tree itself
   * surfaces the "folder too large" / empty-folder / no-match designed states (never blank).
   */
  function paintGranted(source: FolderSource): void {
    grantState = grant(source.name);
    activeSource = source;

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

    // Pin bar (rebuilt on file select / pin toggle via renderPinBar).
    pinBarEl = doc.createElement('div');
    pinBarEl.className = `${SHELL_CLASS}__pinbar`;
    wrap.append(pinBarEl);

    const treeView = createTreeView(doc, {
      files: source.files,
      truncated: source.truncated,
      onSelect: (file) => void selectFolderFile(file),
    });
    wrap.append(treeView.element);

    // The reopen hub also shows here so pins/recents stay reachable while a folder is open.
    hubSlotEl = doc.createElement('div');
    hubSlotEl.className = `${SHELL_CLASS}__hub`;
    wrap.append(hubSlotEl);

    foldersContent.replaceChildren(wrap);
    renderHub();
    renderPinBar();
  }

  // --- grant flow ----------------------------------------------------------

  /** Apply a settled open outcome (from the CTA picker, a drop, OR a reopen) to the shell:
   *  paint the matching designed never-blank state on any non-grant, else remember the folder +
   *  present it. Returns the granted `FolderSource` (so a reopen can then select a file), or
   *  null on a non-grant. The ONE place grant success is handled — the drop and reopen paths
   *  reuse it verbatim, never duplicating the store/reader/present wiring.
   *
   *  `existingFolderId` reuses a remembered folder's record on reopen (updating lastOpenedAt)
   *  rather than minting a duplicate; the CTA/drop paths omit it and mint a fresh id. */
  async function applyOutcome(
    outcome: OpenFolderOutcome,
    existingFolderId?: string,
  ): Promise<FolderSource | null> {
    if (!outcome.ok) {
      // Designed never-blank states for every non-grant outcome. `unsupported` is a firmer
      // message (this engine can't yet); cancel/error/denied return to the affordance + hub.
      if (outcome.reason === 'unsupported') {
        paintIdle({ text: outcome.message, tone: 'warn' });
      } else {
        paintIdle({ text: outcome.message });
      }
      return null;
    }

    const source = outcome.source;
    activeFolderId = existingFolderId ?? newId();
    const folderId = activeFolderId;
    activeFile = null;
    // Remember the folder (Chromium: with its handle; a capability ref, never contents). On a
    // reopen we reuse the existing id so the folders store keeps ONE row per remembered folder.
    const existing = existingFolderId
      ? persisted.folders.find((f) => f.id === existingFolderId)
      : undefined;
    await tryStore(() =>
      store.putFolder({
        id: folderId,
        name: source.name,
        handle: source.persistable ? source.handle : undefined,
        addedAt: existing?.addedAt ?? Date.now(),
        lastOpenedAt: Date.now(),
      }),
    );
    // Fresh folder → reader back to the no-selection designed state until a file is picked.
    await selectFile(null);
    paintGranted(source);
    await refreshPersisted();
    return source;
  }

  async function runOpenFolder(): Promise<void> {
    if (busy) return;
    busy = true;
    try {
      // The PICKER route (task 4.4): on Firefox this yields a frozen copy of every file, so a
      // watch here would never fire. Recorded before applyOutcome so the watch decision sees it.
      activeRoute = 'picker';
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
      // The DRAG route (task 4.4): even on Firefox, where the seam reports persistable:false and
      // metadata is frozen at drop time, `File.text()` still reads FRESH BYTES — which is why the
      // detector compares content and why this route can watch at all.
      activeRoute = 'drop';
      await applyOutcome(await dropToOutcomeFn(dataTransfer));
    } finally {
      busy = false;
    }
  }

  /**
   * Reopen a remembered folder as ONE gesture (spec §5.1/§5.2). Chromium (the folder row still
   * carries a live handle): the click's gesture drives `reopenFromHandle` (query→request→gate
   * re-grant) → the SAME `applyOutcome`/`paintGranted` path. Firefox / revoked (no handle): a
   * silent rehydrate is impossible, so this re-opens the picker ("pick this folder again") —
   * still one gesture, honest. On success, optionally select `selectPath` (a recent/pinned
   * FILE reopens straight to that file). Every failure is a designed never-blank state.
   */
  async function reopenFolder(folderId: string, selectPath?: string): Promise<void> {
    if (busy) return;
    busy = true;
    try {
      const folder = persisted.folders.find((f) => f.id === folderId);
      let source: FolderSource | null;
      if (folder?.handle) {
        // Chromium: one-gesture re-grant of the rehydrated handle, reusing the folder row.
        source = await applyOutcome(await reopenFromHandleFn(folder.handle), folderId);
      } else {
        // Firefox / revoked: no live handle → re-pick via the picker (one gesture). A fresh
        // record is minted since the picked handle (if any) is new. That is the PICKER route for
        // watch purposes too (task 4.4), whatever route first opened this folder.
        activeRoute = 'picker';
        source = await applyOutcome(await openFolderFn());
      }
      if (source && selectPath) {
        const file = source.files.find((f) => f.path === selectPath);
        if (file) await selectFolderFile(file);
      }
    } finally {
      busy = false;
    }
  }

  /** Revoke: drop the in-memory handle + delete the stored folder record, then return to
   *  the idle affordance and clear the reader. Real, not cosmetic (spec 002 §3.2). */
  async function revokeAccess(): Promise<void> {
    const folderId = activeFolderId;
    if (folderId) {
      // D-10: revoke ERASES the folder's snapshots — contents must not outlive access to their
      // folder (§3.3). This lands BEFORE the folders-row delete so a partial failure leaves the
      // handle removable on retry; both are best-effort (a store failure never blanks the page).
      await tryStore(() => store.deleteSnapshotsForFolder?.(folderId) ?? Promise.resolve());
      await tryStore(() => store.deleteFolder(folderId));
    }
    await selectFile(null);
    paintIdle();
    await refreshPersisted();
  }

  // --- settings port (task 5.2) -------------------------------------------------------
  //
  // The app page is EXTENSION-ORIGIN, so it reads and writes the settings store DIRECTLY —
  // `directPort`, not the content script's `messagingPort` (there is no background round-trip to
  // make). Two wirings, mirroring the content entrypoint exactly:
  //   • register the save sink, so the header control (and the in-reader pill, which is built by
  //     the same mount() seam on this page) persists a pick through this context's own port;
  //   • load the persisted setting and apply it via `setThemeSetting`, whose registry broadcast
  //     themes the shell root AND any open reader pane together.
  // Both are best-effort: `load()` is bounded and falls back to Auto, `save()` swallows
  // persistence failures. Nothing here can blank or stall the shell (AGENTS.md #5).
  const settingsPort = directPort({
    getSettings: () => store.getSettings?.() ?? Promise.resolve({ ...DEFAULT_SETTINGS }),
    putSettings: (patch) => store.putSettings?.(patch) ?? Promise.resolve(),
  });
  // Task 6.1: ONE sink registration now serves every settings consumer on this page — the header
  // control, the in-reader pill, AND the reader pane's TOC rail (decision D-E generalized the
  // group-5 theme-only seam rather than adding a second one beside it). `publishSettings` caches
  // + notifies, which is what carries the remembered TOC open-state/width to a pane mounted
  // before this load resolved.
  registerSettingsSink((patch) => void settingsPort.save(patch));
  void settingsPort.load().then((resolved) => {
    setThemeSetting(resolved.theme);
    publishSettings(resolved);
  });

  // D-12 (task 1.5): load the persisted snapshot-capture flag into the live cache the watch
  // controller reads at render time. Best-effort — an absent reader or a failed read leaves the
  // default (on), the safe value: a controller that renders before this resolves captures rather
  // than silently dropping snapshots. The store's read-with-default is the wipe-reset mechanism, so
  // after a wipe this reloads the default automatically (Piece 4).
  void Promise.resolve(store.getCaptureEnabled?.()).then(
    (enabled) => setCaptureFlag(enabled ?? true),
    () => setCaptureFlag(true),
  );

  // Initial paint: the idle affordance (plain line + live CTA) — never a blank page. The
  // reopen hub fills in once the async load resolves (refresh repaints idle when still idle).
  paintIdle();
  void refreshPersisted();

  return {
    selectFile,
    openFolder: runOpenFolder,
    refresh: refreshPersisted,
  };
}

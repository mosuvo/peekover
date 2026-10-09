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
  clearDiagramCache as defaultClearDiagramCache,
  type FolderRecord,
  type RecentRecord,
  type PinRecord,
  type StoredSummary,
} from './store';
// §4's second storage clause (task 6.2): the cache is the module that discovers an unopenable
// schema, and this is the surface that says so. App-page-only, like everything it imports —
// `diagramImportFence.test.ts` is the structural gate on that edge.
import { isDiagramCacheUnavailable } from './diagramCache';
import { DEFAULT_SETTINGS, type Settings } from '../settings/settings';
import { addRecent, addPin, orderRecents, orderPins, SEP } from './recents';
import {
  deleteSnapshotsForFolder as defaultDeleteSnapshotsForFolder,
  getSnapshotMeta,
  getSnapshotText,
} from './snapshots';
import { exitEditMode, readerSourceFor } from '../render/readerMode';
import { registerDiffContext, createDiffContext } from '../render/diffRegistry';
// The identity seam (008 task 1.4, D-1). Data only, imports nothing — the app page's half of the
// same registry the content script writes from `runReader`.
import { registerDocIdentity } from '../render/docIdentity';
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
import { buildCodeThemeControl } from '../theme/codeThemeControl';
import { directPort } from '../settings/settingsPort';
import {
  currentSettings,
  publishSettings,
  registerSettingsSink,
  saveSettings,
} from '../settings/settingsSeam';
import { getSettings as defaultGetSettings, putSettings as defaultPutSettings } from './store';
import {
  getCaptureEnabled as defaultGetCaptureEnabled,
  setCaptureEnabled as defaultSetCaptureEnabled,
} from './store';
import { getCaptureFlag, setCaptureFlag } from './captureFlag';
import { createTreeView } from './treeView';
import { detectorForFile } from '../watch/detectorForFile';
import { createWatchController, DEAD_READ_NOTE, type RenderFn } from '../watch/watchController';
import { mount } from '../render/mount';
import { enhanceDiagrams } from '../render/diagramEnhancer';
import { enhanceMath } from '../render/mathEnhancer';
import { EDIT_CONTROL_CLASS, enhanceEditor, type EditorSave } from '../render/editorEnhancer';
import {
  hasConflict,
  saveEditorSession,
  teardownEditorShell,
  textForDisk,
  type EditorSaveOutcome,
  type EditorSaveRequest,
} from '../render/editorView';
import { copyAllMathAsLatex, copyAllMathAsMathml } from '../render/mathView';
import { enhanceTables } from '../render/tableEnhancer';
import { enhanceCode } from '../render/codeEnhancer';
import { watchCapability } from '../watch/watchAvailability';
import {
  registerWatchTarget,
  resetWatchTarget,
  setWatchNote,
  stopWatch,
  type WatchTarget,
} from '../watch/watchRegistry';
import { createStorageView } from './storageControls';
import { createExportView, exportPdf, type ExportViewController } from './exportControls';
import { exportHtml, copyAsHtml, copyAsRichText } from '../export/htmlExport';
import { copyAsPlainText } from '../export/copyPlainText';

/** CSS class on the shell root; scopes every rule so nothing leaks to the document. */
const SHELL_CLASS = 'peekover-app';

/**
 * D-12's SECOND call site — the app page's watch re-render.
 *
 * `watchController` re-renders through an injected `render`, defaulting to bare `mount`. Until now
 * every caller took that default; the app page overrides it so a watched document that changes on
 * disk comes back ENHANCED. It has to be here rather than inside `mount()`: §3.3 forbids the branch
 * and `replaceChildren` destroys the rendered diagrams on every re-mount, so re-enhancement is not
 * an optimisation but the only thing that keeps a watched diagram on screen.
 *
 * `contentWatch.ts` passes no `render` and is not touched — that omission is the §3.2 fence, and it
 * is what keeps the enhancer (and the engine behind it) off the content-script graph entirely.
 *
 * Identical body to `readerPane`'s site by construction: the same enhancers in the same order,
 * called after a committed mount, never two divergent copies.
 *
 * ── 008 D-6 SITE 2, AND WHY THE NAME HAD TO GO ────────────────────────────────────────────────
 *
 * `renderWithDiagrams` described the whole body when the body was one enhancer. It now runs two,
 * so the name was a lie the compiler could not catch and the next reader would have believed —
 * D-6's own argument (the call sites stay explicit, so each one must SAY what it does) applied to
 * the const rather than to the graph. The rename is exactly that: no branch moved, no argument
 * changed, and the only behavioural difference is the `enhanceTables` line below.
 *
 * Sites 1 and 2 land TOGETHER and that is not tidiness. This surface re-renders through here on
 * every watch update, so wiring `readerPane`'s site alone would ship a toolbar that vanished the
 * first time an agent rewrote the file on disk — 007 D-12's bug class, one surface over.
 *
 * 009 D-5 SITE 2 — `enhanceCode` appended fourth (after M11's own math enhancer below), same order
 * as `readerPane.ts`'s site: neither enhancer knows about another and a code fence cannot occur
 * inside a mermaid fence, a math fence, or a GFM table, so they cannot collide on a node, but the
 * ordering is an implicit contract stated at both sites rather than assumed at either.
 *
 * M11 D-3-R SITE 2 — `enhanceMath` appended third, immediately after `enhanceDiagrams`, same order
 * as `readerPane.ts`'s site: a math fence and a mermaid fence are mutually exclusive fence shapes
 * (`parse.ts`'s `info` dispatch), so there is nothing for the two enhancers to collide on either.
 *
 * 012 D-3 SITE 2 — `enhanceEditor` listed immediately after `enhanceMath`, as at `readerPane.ts`'s
 * site. It needs the shell's save capability, and that is why this is now a function OF `save`
 * returning the render rather than the render itself (tasks.md F-5): the capability is built
 * inside `mountAppShell`, where the open file lives, and this const is module-level and cannot
 * close over it. The body is otherwise the same list in the same order, and the name still says
 * what it does. `mount()` rebuilds the chrome on every watch re-render, so without this line the
 * edit control would be gone after the first one.
 */
const renderWithEnhancements =
  (save: EditorSave): RenderFn =>
  (text, target, options) => {
    mount(text, target, options);
    enhanceDiagrams(target);
    enhanceMath(target); // M11 D-3-R — same order/site as readerPane.ts's own math call
    enhanceEditor(target, { save }); // 012 D-3 — same order/site as readerPane.ts's own editor call
    enhanceTables(target);
    enhanceCode(target);
  };

/** The file one edit session may write, fixed at edit entry — and dropped (`file` set to null)
 *  when that session is ended from the shell's side: Revoke, a closed folder, a folder switch. */
interface EditBinding {
  file: MarkdownFile | null;
}

/** `requestPermission` is not in the DOM lib's handle type yet (`reopen.ts` types the folder
 *  handle's the same way). Optional: an engine with handles but without it cannot grant a write. */
type WritableFileHandle = FileSystemFileHandle & {
  requestPermission?(descriptor: { mode: 'readwrite' }): Promise<PermissionState>;
};

/**
 * THE WRITE (012 task 5.3; D-6, D-7, ruling A) — the one place Peekover changes a file on disk.
 *
 * In this order, and the order is the design:
 *   1. WRITE ACCESS, asked of the browser on the bound file's OWN handle, first — while the Save
 *      click's activation is fresh. Never on the folder handle, never before the click.
 *   2. THE RE-READ, through the bound file's own `read()`, then `hasConflict` against the session's
 *      baseline. A difference is the SAFE FLOOR: nothing is written.
 *   3. THE WRITE: `textForDisk` chooses the bytes (ruling A), then createWritable → write → close.
 *      The answer carries exactly that string, which the session makes its new baseline.
 *
 * No handle (Firefox; any route without one), write access not granted, or a binding the shell
 * has since dropped → `unavailable`, and nothing is read or written. A throw from the re-read or
 * the write is not caught here: it rejects, the edit view reports "failed", and the half-open
 * writable is aborted so nothing of it is committed. The two steps are not atomic — a change
 * landing between the compare and the write is not caught (the ledger row says so).
 */
async function writeBack(
  binding: EditBinding,
  { text, baseline }: EditorSaveRequest,
): Promise<EditorSaveOutcome> {
  const file = binding.file;
  const handle: WritableFileHandle | undefined = file?.handle;
  if (!file || !handle?.requestPermission) return { kind: 'unavailable' };
  const granted = await handle.requestPermission({ mode: 'readwrite' }).catch(() => 'denied' as const);
  if (granted !== 'granted' || binding.file !== file) return { kind: 'unavailable' };
  if (hasConflict(baseline, await file.read())) return { kind: 'conflict' };
  if (binding.file !== file) return { kind: 'unavailable' }; // dropped while the file was re-read
  const written = textForDisk(text, baseline);
  const writable = await handle.createWritable();
  try {
    await writable.write(written);
    await writable.close();
  } catch (err) {
    await writable.abort().catch(() => undefined);
    throw err;
  }
  return { kind: 'saved', written };
}

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
  /** Erase ONLY the two diagram-cache stores behind the "Clear diagram cache" control (D-5, task
   *  4.3) — leaves folders/recents/pins/settings, the capture flag AND every snapshot intact.
   *  Optional like the others; absent → a best-effort no-op the wrapper swallows. */
  clearDiagramCache?(): Promise<void>;
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
 * THE EXPORT PANEL IS ANCHORED AT ITS OWN TRIGGER, NOT THE HEADER'S RIGHT EDGE (task 3.2, D-2,
 * §3.11 rows 3-5). `__storage-slot`'s `right:1rem` anchor works only because the storage toggle
 * happens to be the header's rightmost control; the export toggle sits to ITS right, so reusing
 * that same header-relative anchor for `__export-slot` would overlap the two panels at the exact
 * same rect whenever both existed. `__export-control` instead carries `position:relative` (the
 * `__code-theme-control` wrapper's own shape) and `__export-slot` is positioned against THAT
 * wrapper (`right:0`, not a header-relative constant) — genuinely anchored at its own trigger,
 * which also makes it independent of whatever else joins the header's right-hand group later.
 *
 * ★ RATIONALE LIVES HERE, NOT IN THE CSS BELOW, AND THAT IS LOAD-BEARING: everything inside the
 * template literal is STRING CONTENT the minifier cannot strip, so a comment written in there
 * ships to every user's browser. Writing this block as CSS cost **+1.5 KB on the app-page chunk**
 * before it was moved up here. Long-form reasoning goes in this doc comment; the CSS keeps only
 * short pointers.
 *
 * THE @page MARGIN-BOX RELOCATION (010 D-7, task 7.1). readerCss.ts's own `@page` rule (same text)
 * is INERT where it lives — CSS Paged Media's page-box configuration is a document-global concept
 * a shadow-scoped stylesheet cannot deliver (measured, task 6.1: Chromium's print pipeline never
 * reads a shadow root's own `@page` rule, regardless of engine support). `APP_CSS` below carries a
 * COPY of that same block — a real document-level sheet, the ONE place in the app-page bundle
 * `exportPdf()`'s `window.print()` can actually reach a page box from. Deliberately a COPY, not a
 * MOVE: readerCss.ts's own copy stays because `htmlExport.ts`'s `extractPageBlocks()` pulls IT
 * (not this one) into every standalone HTML export/Copy-as-HTML document, which is ALSO
 * document-level once serialized (no shadow root in an exported file) and so ALSO renders
 * correctly — an entirely different, already-shipped consumer this task must not silently break by
 * moving the block out from under it. See readerCss.ts's own comment on its copy for the reverse
 * pointer.
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
/* Code-theme control (task 5.2) — the trigger pill matches __theme-toggle's chrome exactly, so
   the two read as one control group; the popover mirrors __storage-slot's "drop from the header"
   positioning, anchored to ITS OWN wrapper (position:relative on .peekover-code-theme-control)
   rather than the header, since it must not shift if other header controls are added later. */
.${SHELL_CLASS}__code-theme-control{position:relative}
.peekover-code-theme-toggle{
  font:inherit; font-size:.8rem; color:var(--ink); background:var(--paper);
  border:1px solid var(--line); border-radius:999px; padding:.25rem .7rem; cursor:pointer;
}
.peekover-code-theme-toggle:hover{background:var(--accent-soft)}
.peekover-code-theme-toggle[aria-expanded="true"]{background:var(--accent-soft)}
.peekover-code-theme-picker{
  position:absolute; top:100%; left:0; z-index:5; margin-top:.3rem;
  width:max-content; max-width:min(280px,calc(100vw - 2rem));
  max-height:min(60vh,calc(100vh - 5rem)); overflow:auto;
  background:var(--paper); border:1px solid var(--line);
  border-radius:var(--r); box-shadow:var(--shadow);
  display:flex; flex-direction:column; padding:.3rem;
}
/* An author display rule beats the UA [hidden] default (readerCss.ts's diffChrome picker hit
   this exact defect first) — without this, picker.hidden = true stays visually flex and keeps
   intercepting clicks on whatever the page renders underneath it. */
.peekover-code-theme-picker[hidden]{display:none}
.peekover-code-theme-picker__item{
  font:inherit; font-size:.85rem; text-align:left; color:var(--ink); background:transparent;
  border:none; border-radius:6px; padding:.4rem .6rem; cursor:pointer;
}
.peekover-code-theme-picker__item:hover{background:var(--accent-soft)}
.peekover-code-theme-picker__item[aria-selected="true"]{background:var(--accent-soft); font-weight:600}
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
/* "Export" toggle + panel (task 3.2) — anchoring rationale is in the doc comment above APP_CSS. */
.${SHELL_CLASS}__export-toggle{
  font:inherit; font-size:.8rem; color:var(--ink); background:var(--paper);
  border:1px solid var(--line); border-radius:999px; padding:.25rem .7rem; cursor:pointer;
}
.${SHELL_CLASS}__export-toggle:hover{background:var(--accent-soft)}
.${SHELL_CLASS}__export-toggle[aria-expanded="true"]{background:var(--accent-soft)}
.${SHELL_CLASS}__export-toggle:disabled{opacity:.6; cursor:default}
.${SHELL_CLASS}__export-control{position:relative}
.${SHELL_CLASS}__export-slot:not(:empty){
  position:absolute; top:100%; right:0; z-index:5;
  width:min(420px,calc(100vw - 2rem));
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

/* Print mode (010 D-7, task 6.1's necessary ripple — rationale: readerCss.ts's own print-mode .ts
   comment, "THE DE-CLIPPING FIX" section). readerCss.ts's shadow-scoped rules cannot reach these
   light-DOM shell elements, so the header/folders chrome-hiding and the fixed-viewport de-clip
   live here instead — the only file that can. */
@media print{
  .${SHELL_CLASS}{position:static; inset:auto; height:auto; overflow:visible; display:block}
  .${SHELL_CLASS}__header,.${SHELL_CLASS}__folders{display:none!important}
  .${SHELL_CLASS}__body{display:block; height:auto}
  .${SHELL_CLASS}__reader{overflow:visible; height:auto; padding:0}
}
/* @page relocation (010 D-7, task 7.1) — a COPY of readerCss.ts's own @page rule; rationale in
   the doc comment above APP_CSS. */
@page{
  margin:2cm 1.5cm 2.2cm;
  @top-center{content:"Peekover"}
  @bottom-center{content:"Page " counter(page) " of " counter(pages)}
}
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
  /**
   * Task 8.1 (D-5): re-run the export/copy that `lastExportFormat` (8.2) names — the SAME
   * dispatch every export panel row already goes through, never a second invocation path.
   * `entrypoints/app/main.ts`'s Ctrl/Cmd+S handler is this method's only caller; the panel's own
   * row clicks reach the identical named functions directly (see `renderExport`'s wiring below).
   * Before any export has ever run, `lastExportFormat` is `'html'` — Ruling M-1's shipped default,
   * so a first-ever Ctrl+S runs the HTML export; only a genuinely unrecognized stored value is a
   * graceful no-op.
   */
  triggerLastExport(): void;
  /**
   * Ruling B (012 task 5.3): if the open document is being edited, run its Save — the same one
   * the edit view's Save button runs — and return `true`; otherwise do nothing and return
   * `false`. `main.ts`'s Ctrl/Cmd+S handler calls this first and exports only on `false`.
   */
  saveEdit(): boolean;
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
    clearDiagramCache: defaultClearDiagramCache,
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

  // The code-theme control (task 5.2, D-9) — app-page only, no shadow-root counterpart (§3.8:
  // code highlighting never reaches the content script, so neither does this). Mounted beside
  // `themeControl`, never sharing its registry or broadcast — see `codeThemeControl.ts`'s own
  // header for why the two stay independent.
  const codeThemeControl = buildCodeThemeControl();
  codeThemeControl.classList.add(`${SHELL_CLASS}__code-theme-control`);

  // The storage panel's slot — an overlay that DROPS FROM the header, anchored under the
  // toggle that opens it. It lives INSIDE the header (not as a shell child beside it) purely
  // so `top:100%` in APP_CSS resolves against the header box; that is what keeps the panel
  // tied to its button without tracking a header-height constant. Empty until the toggle
  // opens it — and empty means out of the layout AND unstyled (`:not(:empty)`), so the
  // folder navigator and reader never move when it opens (M6 9.1 gate finding).
  const storagePanel = doc.createElement('div');
  storagePanel.className = `${SHELL_CLASS}__storage-slot`;

  // The export panel's own trigger + slot (task 3.2, D-2). Q2 (tasks.md's own document-scoped
  // question): every export/copy action targets the CURRENTLY OPEN document, so — unlike
  // `storageToggle`, which is global — this toggle is DISABLED (not hidden) until `activeFile` is
  // set, matching the disabled-not-hidden visual language `__cta`/`__pin` already establish
  // elsewhere in this shell: present so it is discoverable before any document is open, inert
  // until it has something to act on. `setActiveFile` (below) keeps this in sync.
  const exportControl = doc.createElement('div');
  exportControl.className = `${SHELL_CLASS}__export-control`;
  const exportToggle = doc.createElement('button');
  exportToggle.type = 'button';
  exportToggle.className = `${SHELL_CLASS}__export-toggle`;
  exportToggle.textContent = 'Export';
  exportToggle.setAttribute('aria-expanded', 'false');
  exportToggle.disabled = true; // no document open yet
  exportToggle.addEventListener('click', () => toggleExport());
  const exportPanel = doc.createElement('div');
  exportPanel.className = `${SHELL_CLASS}__export-slot`;
  exportControl.append(exportToggle, exportPanel);

  header.append(brand, tag, themeControl, codeThemeControl, storageToggle, storagePanel, exportControl);

  const body = doc.createElement('div');
  body.className = `${SHELL_CLASS}__body`;

  const folders = doc.createElement('nav');
  folders.className = `${SHELL_CLASS}__folders`;
  folders.setAttribute('aria-label', 'Folders');

  // The repainted region of the folder pane (idle affordance ⇄ granted folder view).
  const foldersContent = doc.createElement('div');
  foldersContent.className = `${SHELL_CLASS}__folders-content`;
  folders.append(foldersContent);

  // ── THE EDITOR'S SAVE CAPABILITY (012 D-3; tasks.md F-5) ──────────────────────────────────
  //
  // Built HERE and handed down, never reached for from below: the reader pane and the editor
  // modules receive a function and call it, and none of them holds a handle or names a handle
  // type. This closure is the one place that does — it is declared inside `mountAppShell`, where
  // `activeFile` (and the handle that file may carry) lives.
  //
  // ★ IT BINDS AT EDIT ENTRY (task 5.3, route 2(i)). The edit view calls this once as a session
  // begins, and what it gets back can only ever write the file that was open THEN: `activeFile`
  // is read here, into the binding, and never again. A save reading `activeFile` at the click
  // would write whatever file had since been opened. One binding is live at a time — beginning a
  // session drops the one before it, so a save function kept from an ended session writes nothing.
  let editBinding: EditBinding | null = null;
  const saveActiveDocument: EditorSave = () => {
    if (editBinding) editBinding.file = null;
    const binding: EditBinding = (editBinding = { file: activeFile });
    return (request) => writeBack(binding, request);
  };
  const renderEnhanced = renderWithEnhancements(saveActiveDocument);

  const readerPane: ReaderPaneController = createReaderPane(doc, { save: saveActiveDocument });

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
    // ★ ADDED BECAUSE THE COMPILER DEMANDED IT, WHICH IS THE MECHANISM WORKING (task 4.3). Making
    // `StoredSummary.diagrams` REQUIRED broke the build right here, on this duplicated literal —
    // the intended outcome, not an obstacle: a trust panel that silently reports "no diagrams
    // cached" while a cache is filling is exactly the hidden state D-14 exists to forbid, and this
    // is the compile error that makes forgetting it impossible. Nothing cached → no diagram line.
    diagrams: { count: 0, bytes: 0 },
    total: 0,
    lines: ['Nothing stored — Peekover is holding no folders, recents, or pins on this device.'],
  };

  // ── ★ §4's SECOND STORAGE CLAUSE: SAY IT, DO NOT FAIL SILENTLY (task 6.2) ──────────────
  //
  // *If the storage schema cannot be opened or upgraded, the system shall continue to render
  // documents and diagrams, and shall SAY that caching is unavailable rather than failing
  // silently.* Rendering already survives — the cache swallows its own failures and the enhancer
  // never depended on it (`diagramCache.ts`'s two-clause note). The half that was missing is the
  // SAYING, and this is the whole of it.
  //
  // ★ THE BUG THIS REPLACES IS A LIE, NOT AN OMISSION. A `describeStored` that THREW used to land
  // on `EMPTY_SUMMARY`, whose line reads "Nothing stored — Peekover is holding no folders,
  // recents, or pins on this device." That sentence is a claim about the store, and we just failed
  // to open the store: we do not know whether it is empty, and if it holds anything we have told
  // the user it does not. So the throw path keeps the zeroed counts (there is nothing to list)
  // and REPLACES that line with one that says what actually happened.
  //
  // The absent-reader path is deliberately untouched: a minimal fake store with no `describeStored`
  // is not a failure, and "Nothing stored" is its correct, designed never-blank state.
  //
  // Two independent detectors, one sentence, because they see different halves of the same fact:
  // `describeStored` throwing is the panel's own read failing, and `isDiagramCacheUnavailable()`
  // is the diagram cache reporting that ITS connection failed — true even where a store port was
  // injected whose reads happen to succeed. Neither is set by a read/write rejection against a
  // store that opened; that failure is §4's FIRST clause and stays quiet by design.

  /** §4's second storage clause, in words. Rendered as an ordinary panel line, so it is readable
   *  text rather than a colour or an icon, and it names the consequence rather than the fault. */
  const CACHING_UNAVAILABLE_LINE =
    'Diagram caching is unavailable — storage could not be opened on this device. Diagrams still ' +
    'render, but none of them is being cached, so each one is drawn fresh every time.';

  /** The same summary with {@link CACHING_UNAVAILABLE_LINE} appended once. */
  function sayCachingUnavailable(summary: StoredSummary): StoredSummary {
    if (summary.lines.includes(CACHING_UNAVAILABLE_LINE)) return summary;
    return { ...summary, lines: [...summary.lines, CACHING_UNAVAILABLE_LINE] };
  }

  /** Read the transparency summary (best-effort); an absent read yields the honest empty state and
   *  a FAILED one says so, never a blank panel and never a false "Nothing stored". */
  async function readSummary(): Promise<StoredSummary> {
    let summary: StoredSummary;
    try {
      summary = (await store.describeStored?.()) ?? EMPTY_SUMMARY;
    } catch {
      // The read itself failed: drop the "Nothing stored" claim we cannot make, keep the panel.
      return { ...EMPTY_SUMMARY, lines: [CACHING_UNAVAILABLE_LINE] };
    }
    return isDiagramCacheUnavailable() ? sayCachingUnavailable(summary) : summary;
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
      onClearDiagramCache: () => void clearDiagramCacheData(),
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

  /** Clear ONLY the diagram cache (D-5, task 4.3), then repaint the open panel so the emptied
   *  "Diagrams cached" line disappears. Identical in shape to `eraseSnapshotsData` above, and for
   *  the same reasons: the reopen hub is NOT refreshed (cached diagrams never fed it), and nothing
   *  in-memory is reset — clearing the cache is not clearing settings, snapshots, or the capture
   *  flag. Already-rendered diagrams on screen are left alone: they are painted DOM, not cache
   *  reads, so clearing costs the user nothing visible until the next render. Best-effort
   *  (AGENTS.md #5) — a storage failure never blanks the panel. */
  async function clearDiagramCacheData(): Promise<void> {
    await tryStore(() => store.clearDiagramCache?.() ?? Promise.resolve());
    if (storageOpen) await renderStorage(); // the diagram line clears; every other line stands
  }

  // --- the export panel (task 3.2, D-2, Ruling 2) -------------------------------------
  //
  // `createExportView` mirrors `createStorageView`'s own stateless-builder-plus-slot shape
  // exactly, with one addition: Ruling 2's focus trap. The trap's KEYDOWN HALF (Tab wrap, Escape)
  // is built inside `createExportView` itself (copied inline from `openDiagramLightbox`'s shape —
  // see `exportControls.ts`'s own doc comment for why no shared helper exists). What appShell owns
  // here is the OPEN/CLOSE STATE and the RESTORE half — insert-and-focus on open, empty-and-
  // restore on close — the exact split `toggleStorage`/`renderStorage` already use for the
  // storage panel, plus the one thing that panel never needed: a focus target to restore to.

  let exportOpen = false;
  /** Task 9.1: the currently-open panel's own controller, so the void→then callbacks below (which
   *  live in this closure, not `exportControls.ts`) can report an outcome to the RIGHT row + live
   *  region. `createExportView` is stateless and rebuilt fresh on every open (module doc comment),
   *  so this reference is set in `renderExport` and cleared in `toggleExport`'s close branch —
   *  never stale across an open/close cycle. `null` while closed is a graceful no-op (a promise
   *  that settles after the panel closes has nothing left to update — never an error). */
  let exportView: ExportViewController | null = null;

  /** The exported file's basename (task 3.1's own parameter) — the open document's own name,
   *  minus its extension. `exportToggle` is disabled whenever `activeFile` is null, so the
   *  fallback below is defensive only (never reachable through the shipped UI). */
  function basenameForExport(): string {
    const name = activeFile?.name ?? 'export';
    return name.replace(/\.[^./\\]+$/, '') || 'export';
  }

  // ── THE FIVE EXPORT DISPATCH FUNCTIONS (task 8.1, D-5), PLUS A SIXTH (M11 task 6.2-R) AND A
  // SEVENTH (§8-1(b) FIX) ─────────────────────────────────────────────────────────────────────
  //
  // Lifted out of `renderExport`'s `createExportView` call so there is exactly ONE implementation
  // of each export, reachable from TWO entry points: the panel row's own `onClick` (wired below)
  // and `triggerLastExport()` (the `AppController` method `main.ts`'s Ctrl/Cmd+S handler calls).
  // Never duplicate a `saveSettings({...}); <export>()` pair anywhere else — that would let the
  // panel click and the keyboard shortcut diverge or double-write `lastExportFormat`, exactly the
  // failure task 8.2's own "ONE write path" claim depends on this task not introducing.
  //
  // Task 8.2 (D-6): each of the ORIGINAL FIVE functions below persists ITS OWN key from
  // `exportControls.ts`'s `RowSpec.key` vocabulary ('html' | 'copy-html' | 'copy-plain-text' |
  // 'copy-rich-text' | 'pdf') as `lastExportFormat` the instant its export actually fires. Written
  // only inside each function's own "did the export actually run" guard, never on the defensive
  // no-op branch — a no-op is not a "last used" format. `saveSettings` (settingsSeam.ts) is the
  // same seam the theme/TOC/code-theme controls already persist through — best-effort, never
  // throws on this UI path. The SIXTH function (`runCopyMathMathml`, M11 task 6.2-R) and the
  // SEVENTH (`runCopyMathLatex`, §8-1(b) FIX) deliberately do NOT persist a `lastExportFormat` —
  // see their own doc comments for why.

  function runExportHtml(): void {
    // The app page's live reader host (readerPane.ts's own class, the same selector the diff
    // context above already uses) — absent during a designed non-render state (e.g. an
    // unreadable file), in which case there is nothing to export and this is a silent no-op
    // (AGENTS.md #5: no export UI is reachable without `activeFile`, but the read itself can
    // still fail after selection).
    // Task 9.1: `exportHtml` is synchronous and can throw before any download begins
    // (`serializeReaderDocument`'s own throw when `.peekover-reader` is absent from the host's
    // shadow root — §3.9's named "a serialization throw" mode). A thrown error here has NO native
    // browser signal at all (unlike a completed download), so it is the one failure this row must
    // still state itself — `reportExportFailure`, never `reportCopyOutcome` (ruling: HTML never
    // gets a SUCCESS affordance, only this one-sided failure report).
    const host = readerPane.element.querySelector<HTMLElement>('.peekover-app__reader__host');
    if (host) {
      saveSettings({ lastExportFormat: 'html' });
      try {
        exportHtml(host, basenameForExport());
      } catch {
        exportView?.reportExportFailure('html');
      }
    }
  }

  function runCopyHtml(): void {
    // Same host-lookup, same non-render-state no-op as runExportHtml above. `copyAsHtml`
    // rejects rather than resolving silently on a clipboard-write failure (AGENTS.md #5 — no
    // false success). Task 9.1 (human-ruled, decisions.md): the caller now surfaces that
    // rejection as an explicit UI state — `reportCopyOutcome` — rather than the prior
    // unhandled-rejection-only signal; `.then(onCopied, onFailed)` can only ever run ONE branch,
    // so a false "Copied" on a rejected write is structurally impossible.
    const host = readerPane.element.querySelector<HTMLElement>('.peekover-app__reader__host');
    if (host) {
      saveSettings({ lastExportFormat: 'copy-html' });
      copyAsHtml(host).then(
        () => exportView?.reportCopyOutcome('copy-html', true),
        () => exportView?.reportCopyOutcome('copy-html', false),
      );
    }
  }

  function runCopyPlainText(): void {
    // No host/clone lookup — this reads the SOURCE, via `activeFile.read()` (task 3.4's own
    // Q1), never the rendered clone `runCopyHtml`/`runExportHtml` work from. `exportToggle` is
    // disabled whenever `activeFile` is null, so the guard below is defensive only (never
    // reachable through the shipped UI, matching `basenameForExport`'s own fallback comment).
    // Same `.then(onCopied, onFailed)` shape as `runCopyHtml` (task 9.1): `copyAsPlainText` is
    // async internally (it awaits the read, then the write) and rejects on EITHER failure — a
    // rejected read never reaches the write (AGENTS.md #5, covering both failure points with one
    // reported outcome).
    if (activeFile) {
      saveSettings({ lastExportFormat: 'copy-plain-text' });
      copyAsPlainText(activeFile).then(
        () => exportView?.reportCopyOutcome('copy-plain-text', true),
        () => exportView?.reportCopyOutcome('copy-plain-text', false),
      );
    }
  }

  function runCopyRichText(): void {
    // Same host-lookup, same non-render-state no-op as runCopyHtml above — `copyAsRichText`
    // works off the CLONE (task 4.1's own Q4), never `activeFile.read()`. Same
    // `.then(onCopied, onFailed)` shape as every other copy function here (task 9.1) — never a
    // false "Copied" (AGENTS.md #5).
    const host = readerPane.element.querySelector<HTMLElement>('.peekover-app__reader__host');
    if (host) {
      saveSettings({ lastExportFormat: 'copy-rich-text' });
      copyAsRichText(host).then(
        () => exportView?.reportCopyOutcome('copy-rich-text', true),
        () => exportView?.reportCopyOutcome('copy-rich-text', false),
      );
    }
  }

  function runExportPdf(): void {
    // Same "nothing to export yet" guard as every function above, on the same host lookup — but
    // `exportPdf` itself takes nothing: `window.print()` is document-global, so the guard here
    // exists only to decide WHETHER to print, never what to print (there is no host param to
    // thread through, per `exportPdf`'s own doc comment in exportControls.ts). Task 9.1: NO
    // completion or failure report here, on either count — the browser's own print dialog is the
    // success signal (the ruling's redundancy call, same as HTML's success half), and
    // `window.print()` itself has no promise/throw surface for this call to catch (unlike
    // `exportHtml`, there is no serialization step here to fail).
    const host = readerPane.element.querySelector<HTMLElement>('.peekover-app__reader__host');
    if (host) {
      saveSettings({ lastExportFormat: 'pdf' });
      exportPdf();
    }
  }

  /**
   * M11 task 6.2-R (D-6-R, §8-1(b)): copy every rendered formula in the open document (block AND
   * inline) to the clipboard as MathML — `copyAllMathAsMathml` does the collect+serialize+write,
   * this function only resolves the live host and reports the outcome, same shape as
   * `runCopyHtml`/`runCopyRichText` above. `copyAllMathAsMathml` REJECTS (never resolves) when the
   * document has no rendered formula yet, so `reportCopyOutcome('copy-math-mathml', false)` is the
   * honest result on an empty document — never a false "Copied" (AGENTS.md #5).
   *
   * ★ DELIBERATELY NOT WIRED INTO `lastExportFormat`/`triggerLastExport` (task 8.1/8.2's own
   * Ctrl/Cmd+S "repeat last export" mechanism) — that vocabulary lives in `settings.ts`, outside
   * this task's own sealed Files line, and nothing in 6.2-R's own Verify text asks for a keyboard
   * shortcut path (§8-1's own ruling is explicit that this action gets NEITHER a toolbar button NOR
   * a keyboard shortcut). Extending `lastExportFormat` here would be unrequested ripple into a file
   * this task does not own — left as a stated scope decision, not an oversight.
   */
  function runCopyMathMathml(): void {
    const host = readerPane.element.querySelector<HTMLElement>('.peekover-app__reader__host');
    if (host) {
      copyAllMathAsMathml(host).then(
        () => exportView?.reportCopyOutcome('copy-math-mathml', true),
        () => exportView?.reportCopyOutcome('copy-math-mathml', false),
      );
    }
  }

  /**
   * §8-1(b) FIX: copy every rendered formula's retained LaTeX source (block AND inline) to the
   * clipboard — `copyAllMathAsLatex` does the collect+write, this function only resolves the live
   * host and reports the outcome, the SAME shape `runCopyMathMathml` above uses. Rejects (never
   * resolves) when the document has no rendered formula yet — `reportCopyOutcome('copy-math-latex',
   * false)` is the honest result on an empty document (AGENTS.md #5).
   *
   * ★ Same scope decision as `runCopyMathMathml` above, for the identical reason: NOT wired into
   * `lastExportFormat`/`triggerLastExport` — no keyboard shortcut, no toolbar button (§8-1(b)'s own
   * ruling, unchanged by this fix).
   */
  function runCopyMathLatex(): void {
    const host = readerPane.element.querySelector<HTMLElement>('.peekover-app__reader__host');
    if (host) {
      copyAllMathAsLatex(host).then(
        () => exportView?.reportCopyOutcome('copy-math-latex', true),
        () => exportView?.reportCopyOutcome('copy-math-latex', false),
      );
    }
  }

  /**
   * Task 8.1 (D-5): re-run whatever `lastExportFormat` (8.2) names, through the SAME five
   * functions above — the `AppController` method `main.ts`'s Ctrl/Cmd+S handler calls. A fresh
   * install now defaults to `'html'` (Ruling M-1, `decisions.md` 2026-09-04 · M10 10.4), so a
   * first-ever Ctrl+S runs `runExportHtml()` here, not a no-op. `default: break` stays live as
   * defensive handling for a genuinely unrecognized stored value (a removed format key, corrupted
   * storage) — a case `DEFAULT_SETTINGS` itself can no longer produce. `'copy-math-mathml'` and
   * `'copy-math-latex'` are not (and, per the scope decision above, will not become)
   * `lastExportFormat` values, so neither needs a case here.
   */
  function triggerLastExport(): void {
    switch (currentSettings().lastExportFormat) {
      case 'html':
        runExportHtml();
        break;
      case 'copy-html':
        runCopyHtml();
        break;
      case 'copy-plain-text':
        runCopyPlainText();
        break;
      case 'copy-rich-text':
        runCopyRichText();
        break;
      case 'pdf':
        runExportPdf();
        break;
      default:
        break;
    }
  }

  /** Render the export panel into its slot and move initial focus inside it — never left on the
   *  page behind, the same choice `openDiagramLightbox` makes for its own trap's entry point. */
  function renderExport(): void {
    const view = createExportView(doc, {
      onExportHtml: runExportHtml,
      onCopyHtml: runCopyHtml,
      onCopyPlainText: runCopyPlainText,
      onCopyRichText: runCopyRichText,
      onExportPdf: runExportPdf,
      onCopyMathMathml: runCopyMathMathml,
      onCopyMathLatex: runCopyMathLatex,
      onClose: () => toggleExport(),
    });
    exportView = view; // task 9.1 — the void→then callbacks above report through this reference
    exportPanel.replaceChildren(view.element);
    view.element.querySelector<HTMLElement>('button:not(:disabled)')?.focus();
  }

  /** Show/hide the export panel. Closing restores focus to `exportToggle`, guarded by
   *  `isConnected` exactly as `closeDiagramLightbox` guards its own restore (a detached trigger
   *  must not throw). */
  function toggleExport(): void {
    exportOpen = !exportOpen;
    exportToggle.setAttribute('aria-expanded', String(exportOpen));
    if (exportOpen) {
      renderExport();
    } else {
      exportView = null; // task 9.1 — a promise settling after close is a graceful no-op
      exportPanel.replaceChildren();
      if (exportToggle.isConnected) exportToggle.focus();
    }
  }

  /** Track `activeFile` AND keep `exportToggle`'s document-scoped disabled state (Q2) in sync —
   *  every assignment site below goes through this instead of setting `activeFile` bare. */
  function setActiveFile(file: MarkdownFile | null): void {
    activeFile = file;
    exportToggle.disabled = activeFile == null;
  }

  /** The reader pane's mount host, or null while a designed state is showing. */
  const readerHost = (): HTMLElement | null =>
    readerPane.element.querySelector<HTMLElement>('.peekover-app__reader__host');

  /**
   * END ANY OPEN EDIT SESSION (task 5.3, route 2(ii)) — called where the folder is revoked, closed
   * or switched. The binding goes FIRST, so from this line no save can write, including one whose
   * function was taken earlier; then edit is left the way the user leaves it — the edit control,
   * whose click is exit + teardown and puts its own label back (ruling R3). The direct calls
   * after it are the same two steps, for a host whose control is somehow not there.
   *
   * ★ IT DISCARDS AN UNSAVED BUFFER WITHOUT ASKING. So does every other exit today; the guard is
   * task 6.1's, and 6.1 names closing the tab, selecting another file and leaving edit — not
   * these paths. Reported at 5.3 as a question, not decided here.
   */
  function endEditSession(): void {
    if (editBinding) editBinding.file = null;
    editBinding = null;
    const host = readerHost();
    if (host?.getAttribute('data-mode') !== 'edit') return;
    host.shadowRoot?.querySelector<HTMLElement>(`.${EDIT_CONTROL_CLASS}`)?.click();
    if (host.getAttribute('data-mode') !== 'edit') return;
    exitEditMode(host);
    teardownEditorShell(host);
  }

  function saveEdit(): boolean {
    const host = readerHost();
    if (host?.getAttribute('data-mode') !== 'edit') return false;
    void saveEditorSession(host);
    return true;
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
    setActiveFile(file);
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

  /**
   * Register (or decline to register) a watch for the file now on screen — and, since 008 task
   * 1.4, the document's NAME and the diff context alongside it.
   *
   * ★ NAMING DEBT, RECORDED RATHER THAN TIDIED. This function now registers THREE things and its
   * name describes one. Plan §4-4 says do not refactor it, and the reason is the comment block at
   * `:783-793`: the ordering this site documents — install BEFORE `selectFile` — is load-bearing,
   * paid for by the 005 task 4.7 defect, and a rename that moved or re-scoped the call would put
   * that ordering back in play for a cosmetic gain.
   */
  function installWatchForFile(file: MarkdownFile): void {
    // THE DOCUMENT'S NAME (008 task 1.4, D-1) — the app page's half of the identity seam. The
    // badge reads this registry at BUILD time inside `mount()`, and `selectFile` (`:799`) is what
    // mounts, so registering here — before the select, on the ordering `:783-793` already
    // established for the watch target — is what puts the badge on the FIRST file of a session
    // rather than from the second onwards. That is 4.7's defect re-run against new chrome.
    //
    // ★ FIRST IN THIS FUNCTION, AND THAT IS THE WHOLE OF IT — the badge inherits NONE of the two
    // gates below, because the badge's only condition is the NAME (`agentBadge.ts`: "Not
    // `contained`, not the surface, not whether a watch is running"):
    //   • not the `docId != null` guard at the diff context's site, which exists because a
    //     SNAPSHOT needs a folder identity; a badge needs only a basename, which
    //     `MarkdownFile.name` (`folderSource.ts`) always carries (plan D-1 says this in terms);
    //   • and not the `!decision.watchable` EARLY RETURN a few lines below, which is the same
    //     silent drop one gate earlier and the reachable one: a Firefox picker-route folder is
    //     `{watchable:false}` (`watchAvailability.ts`), so a registration placed beside
    //     `registerDiffContext` would never run there and every agent file opened that way would
    //     go un-badged, on the surface least able to tell you why.
    // Both directions are asserted red-first — `appShell.test.ts` on the gates, and
    // `tests/browser/agentBadge.browser.test.ts` end to end.
    //
    // Total and throw-free: `file.name` is a required `string` on `MarkdownFile` and
    // `registerDocIdentity` is one assignment, so nothing here can throw into a mount path
    // (AGENTS.md #5).
    registerDocIdentity(file.name);

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
    controller = createWatchController({
      detector,
      contained: true,
      docId,
      render: renderEnhanced,
    });
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
        // THE D-3 PAIR (task 2.2) — "another file in this folder", provisioned HERE for the same
        // reason `showDiff`/`hideDiff` are: the affordance holds no folder list and may not import
        // one, so the app page hands the capability across as closures. `mount.ts` never reaches
        // this graph, which is why the content script — which has a `location.href`, not a folder —
        // registers no context and so is offered no file comparison at all (§3.2, plan §1.2).
        //
        // ONE list expression serves BOTH, so the exclusion cannot drift between them: a path
        // `fetchFileText` will resolve is exactly a path `fetchFiles` offered. It is read at CALL
        // time, never captured — `getCurrentSource` above is queried rather than held for the same
        // reason, and here it is what makes a re-walked folder visible to an already-registered
        // context instead of stranding it on the list that existed at install.
        //
        // EXCLUDING `file.path` IS THE POINT, not a tidy-up: a document diffed against itself is
        // always empty, so offering it would be a dead option in the picker — "another file", never
        // "any file including this one". The open document is the one captured here, so the
        // exclusion follows the selection rather than pinning a name.
        fetchFiles: async () => otherFilesInFolder(file.path),
        // A FRESH `read()` of that entry, never a stored copy — §3.2's stated reason for not
        // reaching through storage. The point of comparing two files is the other file AS IT IS
        // NOW; a text captured at install would show what it said when this document was opened.
        // An unreadable file (permission/IO — `MarkdownFile.read` may reject) and an unknown path
        // both yield `undefined`, which lands in the SAME fallback as a missing snapshot: the
        // document stays on screen and the diff is never entered (AGENTS.md #5).
        fetchFileText: async (path) => {
          const entry = otherFilesInFolder(file.path).find((f) => f.path === path);
          if (!entry) return undefined;
          try {
            return await entry.read();
          } catch {
            return undefined;
          }
        },
      }));
    }
  }

  /** The open folder's markdown files EXCEPT `openPath` — the one list both D-3 closures read
   *  (task 2.2). `MarkdownFile` is a structural superset of `DiffFileEntry`, so the filtered array
   *  is assignable with no adapter (diffRegistry.ts's stated design). Empty — never null — before a
   *  folder is open or when it holds no other markdown; the picker says so rather than listing
   *  nothing (D-4, task 2.4). */
  function otherFilesInFolder(openPath: string): MarkdownFile[] {
    return (activeSource?.files ?? []).filter((f) => f.path !== openPath);
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
    endEditSession(); // the folder is closed: no session may outlive it (5.3, route 2(ii))
    grantState = IDLE_GRANT;
    activeFolderId = null;
    activeSource = null;
    setActiveFile(null);
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
    endEditSession(); // a folder switch: the session belonged to the folder being left (5.3)
    activeFolderId = existingFolderId ?? newId();
    const folderId = activeFolderId;
    setActiveFile(null);
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
    // FIRST, before any await below: Revoke drops the file handle with the folder (5.3, route
    // 2(ii); the ledger's edit save-back row), so no save can land while the store is cleared.
    endEditSession();
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
    triggerLastExport,
    saveEdit,
  };
}

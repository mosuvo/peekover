// editorView — the edit view (012 tasks 2.2 and 3.2). Its SHELL (D-4 as re-ruled) is a split pane
// built inside the document host's shadow root, beside the reading column: one half is the slot
// the editor is built into, the other is the live preview. Its EDITOR half (3.2) puts the engine's
// view in that slot and keeps the session that goes with it.
//
// ── WHY THE PREVIEW HAS ITS OWN HOST ───────────────────────────────────────────────────────────
//
// `mount()` owns a host's ENTIRE shadow root: every call ends in `replaceChildren`. Rendering a
// preview into the document's own host would therefore destroy the editor on every keystroke. So
// the preview is `mount()` called on a NESTED host — an element in this shell with a shadow root
// of its own — and this module never calls `mount()` on the outer host. That call is always
//
//     mount(text, previewHost, { contained: true, preserveReading: true, chrome: false })
//
// through `renderPreview` below, the ONE place it is written. It runs once at build, and then
// from the editor's buffer (THE FEED, below). `chrome: false` is load-bearing, not
// cosmetic: the watch target, the diff context and the document identity are module-level
// singletons, so a nested mount that composed chrome would wire a watch control, a diff affordance
// and a TOC rail to the PREVIEW (decisions.md, M12 D-4 RE-RULED). It is the same single
// parse -> sanitize -> inert-template path every other render takes; nothing is duplicated here.
//
// ── THE SCROLL BOX ─────────────────────────────────────────────────────────────────────────────
//
// `preserveReading` restores the reader's place against `resolveScrollContainer(host, true)`,
// which walks `host.parentElement` for the nearest ancestor that scrolls and FALLS BACK to the
// host when there is none. A nested host placed directly in a shadow root has no parent element,
// so it would get the fallback — an element that does not scroll under CONTAINED_CSS — and every
// restore would silently do nothing. The nested host therefore sits INSIDE a wrapper
// (`EDITOR_PREVIEW_CLASS`) that is the pane's scroll box, so the walk finds a real scroller by its
// computed overflow. Chosen over making the nested host itself scroll: that would be reached only
// through the fallback, which is indistinguishable from the failure it stands in for.
//
// ── VISIBILITY, AND WHAT A BYPASS LEAVES BEHIND ────────────────────────────────────────────────
//
// The shell is `display:none` unless the host carries `data-mode="edit"` (EDITOR_CSS). The mode
// pill leaves edit through `toggleReaderMode`, which does not come through `exitEditMode` — so no
// teardown runs on that path. The shell is then still in the DOM, hidden, and a later
// `buildEditorShell` finds and reuses it rather than building a second one.
//
// ── THE SESSION: THE SEED, originalText, AND THE DIRTY ATTRIBUTE (3.2; D-7, F-4) ───────────────
//
// `buildEditor` seeds the view from the host's registered source — the string the file's own
// `read()` returned, which `mount()` registered untouched — and keeps that same string as the
// session's `originalText`. It is kept RAW: the save-time conflict compare (D-7) is against what
// was read off disk, and CodeMirror's document does not hold that. Its document is a sequence of
// lines with no memory of what separated them, so a CRLF file reads back out with LF endings
// before the user has typed anything (measured at 3.1, `editorEngine.test.ts`).
//
// So "has the user changed anything" cannot be `buffer !== originalText` — that marks every CRLF
// file dirty on entry. The dirty attribute compares the buffer against originalText put through
// the SAME line-break rule the editor applies, `normaliseLineBreaks` below. 006 D-5's existing
// normaliser (`normalise`, `app/snapshots.ts`) was not reused: it rewrites CRLF pairs only, and
// the editor also turns a LONE carriage return into a break, so a file with one would still enter
// dirty.
//
// The attribute is `data-edit-dirty="true"` on the OUTER host — the `data-mode` / `data-diff`
// precedent — and is REMOVED, not set to "false", when the buffer matches again. It is a literal
// because the modules that read it (the watch deferral, the unsaved-changes guard) sit on the far
// side of an import fence and may not import this one (tasks.md F-4).
//
// THE TAB-CLOSE GUARD IS WRITTEN WITH IT (6.1). `markDirty` is the one place the attribute is set
// or removed, and it adds or removes this host's `beforeunload` listener in the same call: the
// browser asks before closing or reloading exactly while the attribute is present. Every in-page
// way out is asked about by the app page instead (`app/unsavedGuard.ts`), which reads the attribute.
//
// Nothing here writes a file, asks for a permission or names a handle type. `save` is a function
// the app page hands in; what this module does with it is THE SAVE HALF, below.
//
// ── ONE BASELINE, AND THE CONFLICT PREDICATE (5.2; D-7) ────────────────────────────────────────
//
// `originalText` is not frozen at the seed: it is what the file LAST WAS as far as this session
// knows — the raw read at entry, then, after each successful save, EXACTLY the string written
// (`advanceBaseline`, the seam the write path calls; ruling A's CRLF text included). Otherwise the
// second save of a session would compare against text the first one replaced, and conflict with
// itself. The dirty attribute reads the SAME value, normalised: kept as two copies, the compare and
// the attribute could disagree after a write about whether the buffer matches the file.
//
// The save-time compare is `hasConflict`: strict equality of two strings, nothing else. Not
// normalised (a line-ending-only change on disk is a change), not a length check (a same-length
// rewrite is a change), and no file metadata — content comparison is the shipped mechanism, and
// metadata is not read at all until a measurement promotes it to a pre-check (plan D-7).
//
// ── THE SAVE HALF: THE CONTROL, THE REQUEST AND THE STATUS (5.3; D-6, D-7, rulings A and C) ────
//
// The injected `save` is a BINDER. `buildEditor` calls it ONCE, at edit entry, and keeps what it
// returns — this session's own save, which the app page has bound to the file that was open at
// that moment. So a session can only ever save the file it was opened on, whatever the app page
// goes on to open (tasks.md 5.3, route 2(i)). A session handed no binder gets no control.
//
// The control is a bar across the top of the shell: one real `<button>` and a status region
// (`role="status"`, `hidden` while empty, so it is out of the accessibility tree until it has
// something to say — the convention every status line in the reader follows). The bar belongs to
// the SESSION, not the shell: `buildEditorShell` alone still builds exactly two panes.
//
// One activation — the button, or Ctrl/Cmd+S through `saveEditorSession` — is `run`:
//
//   - the buffer, the baseline and the watch's hint are read AT the activation, before anything
//     is awaited. The hint in particular must be read first: on a watched document the save's own
//     write is a change on disk, and raises the hint once it lands.
//   - the bound save is handed `{ text, baseline }` and answers `saved` (with exactly the string
//     it wrote), `downloaded`, `conflict` or `unavailable`. Asking for write access, re-reading
//     the file, `hasConflict`, the write and the download all happen on the app page's side of
//     that call.
//   - ONLY `saved` moves anything: the baseline advances to what was written and the dirty
//     attribute is recomputed against it. Recomputed, not removed — text typed while the save was
//     in flight is not in the file, and must stay dirty.
//   - `downloaded` (5.4) is where the app page could not write — no file handle, or write access
//     not granted — and handed the text to the browser as a download instead. It MOVES NOTHING:
//     the file in the folder is unchanged, so the baseline is not advanced and dirty is not
//     cleared. The edit is still unsaved as far as the folder goes, and whatever guards an exit
//     must still see it. The status names the file downloaded and says the folder's was not
//     changed; rulings A and C qualify it as they do `saved`.
//   - `unavailable` is what is left for a session the app page has ENDED (Revoke, a closed or
//     switched folder): nothing is written and nothing is downloaded. Its view is gone by then.
//   - a save that REJECTS is the last outcome, "failed", and the catch that makes it one is
//     here and nowhere else. The buffer is not touched on any path.
//
// RULING A — WHAT IS WRITTEN. The buffer is LF. If the baseline was uniformly CRLF (`isUniformCrlf`)
// the save writes CRLF; otherwise it writes LF, and when that drops carriage returns the file had
// (mixed endings, a lone CR) the status says the line endings were normalised. `textForDisk` is
// the one function that decides, called by the app page's write so that the string written and
// the string the baseline advances to are the same string.
//
// RULING C — THE HINT WARNS, THE COMPARE DECIDES. `EDITOR_CHANGED_HINT_ATTR` is the watch's "a
// change is being held behind this edit" attribute, read by literal (the watch is on the far side
// of the same import fence as the dirty attribute). It never refuses a save and never allows one:
// it only adds a sentence to a save that the compare let through.
//
// ── THE FEED: THE BUFFER REACHES THE PREVIEW THROUGH A COOLDOWN (3.3; D-5's mechanism; R26) ────
//
// The update listener that tracks dirtiness also hands the editor's document to a
// `createPreviewCooldown` instance, which decides WHEN `renderPreview` runs. Its shape is the
// watch's cost-proportional cooldown (decisions.md 2026-07-21, spec 005 tasks 5.2 / 5.3), built
// again here as a new instance scoped to one edit session — `watchController.ts` is not imported.
//
// THE RULED BEHAVIOUR (human ruling R26, 2026-10-09 — spec §8-2, applied at task 6.4, on task
// 6.2's measurements). Four things about it are structural, and each breaks quietly:
//
//   - A RENDER NEVER RUNS INSIDE THE KEYSTROKE THAT ASKED FOR IT. One that could run at once —
//     the first of a session, or any after a pause — runs in a 0 ms task instead, so the key's
//     own task ends with the character in the buffer and nothing else done. Keys that arrive
//     before that task runs coalesce into it. Measured at 6.2: with the render inside the key,
//     the next key waited behind it — on an enhancer-heavy 50 KB document in Firefox keys took
//     hundreds of milliseconds; deferred, about a quarter of that, and the preview was no staler.
//   - After each render the next may not START until as long as that render took has passed
//     (the multiplier is 1), measured from when it FINISHED. The render at build is not timed
//     and does not count.
//   - One pending slot, and the newest document takes it. Never a queue.
//   - The timer is NOT re-armed when another change arrives. Pushing the deadline out on every
//     keystroke is a trailing debounce, which shows nothing until the typing stops. `flush`
//     re-checks the clock and re-arms only for a remainder, so the wait is defined by the clock.
//
// `mount()` is synchronous, so a render is never "in flight" — a pending render is one WAITING in
// the cooldown, and keystrokes land in the buffer while it waits.
//
// A PENDING RENDER MUST NOT OUTLIVE ITS SESSION, and two things see to it, each of which the
// other would hide if it were removed: ending a session CANCELS its cooldown, timer and all
// (the exit path); and at fire time the feed renders only while its own session is still the
// host's live one (an outer re-mount drops the view and runs no teardown, so nothing cancelled).
// Without the second, an orphaned session's text lands in the next shell built on that host.
//
// A PREVIEW FAILURE IS NOT AN EDITOR FAILURE. `mount()` degrades its own failures to its banner
// and raw source — in the host it was given, which is the nested one, so that state appears in
// the preview pane and the editor is untouched. Should a throw ever leave `mount()` itself, the
// feed logs it and carries on: unlike the render at build, it never tears the shell down.
//
// ── THE PREVIEW IS ENHANCED LIKE THE READER (3.4; human rulings R7 and R10) ────────────────────
//
// After every preview render — the one at build and each one the feed makes — the reader's four
// enhancers run on the NESTED host, in the order the two app-page call sites run them
// (`readerPane.ts`, `appShell.ts`): diagrams, math, tables, code. `enhanceEditor` sits between
// math and tables there and is NOT called here: a preview has no edit control of its own. So a
// mermaid fence, a formula, a table and a code fence look in the preview as they will in the
// document. Without this the preview held the raw fence, the literal formula and an un-highlighted
// block (finding P-1).
//
// A host that is re-rendered and enhanced again is what the watch already does to the OUTER host
// (`appShell.ts`'s render closure runs the same four after each watch `mount()`): every render
// arrives through `replaceChildren`, so the enhancers always meet fresh, unmarked nodes, and each
// drops a late result for a node that has since left the document.
//
// The enhancers are synchronous to CALL and asynchronous to FINISH — each inserts its placeholder
// and returns, and the lazy engine fills it in later. So the cooldown, which times `renderPreview`,
// measures the mount and the placeholders and NOT the engines' work: that cost is untimed here.
// Task 6.2 measured it (it is what holds keys on a large enhancer-heavy document); R26 leaves it
// untimed, and records that documents around 1 MB stay slow to type in.
//
// A FAILED ENHANCEMENT IS NOT A FAILED RENDER. Each enhancer is called under its own guard: a
// throw is logged and the next one still runs. Unguarded, a throw at build would leave
// `buildEditorShell` through its own catch — tearing the edit view down — and a throw under typing
// would be taken for a failed render and skip every enhancer after it.
//
// App-page only, and not on the content-script graph: nothing the content script imports reaches
// this module. That is what lets it import the enhancers directly — the reader's call sites LIST
// them rather than share a seam precisely so that no module the content script reaches names the
// diagram, math or code enhancer.

import { mount } from './mount';
import { readerSourceFor } from './readerMode';
import { enhanceDiagrams } from './diagramEnhancer';
import { enhanceMath } from './mathEnhancer';
import { enhanceTables } from './tableEnhancer';
import { enhanceCode } from './codeEnhancer';
import type { EditorEngine, EditorViewHandle } from './editorEngine';
import { EDITOR_CSS } from '../theme/readerCss';
import { unregisterThemeHost } from '../theme/themeRegistry';

export const EDITOR_SHELL_CLASS = 'peekover-editor';
export const EDITOR_SOURCE_CLASS = 'peekover-editor__source';
export const EDITOR_PREVIEW_CLASS = 'peekover-editor__preview';
export const EDITOR_PREVIEW_HOST_CLASS = 'peekover-editor__preview-host';

/** On the OUTER host while the buffer differs from the document it was seeded from. Present or
 *  absent — never "false". Read BY LITERAL from modules that may not import this one. */
export const EDITOR_DIRTY_ATTR = 'data-edit-dirty';

/** The save bar, its button and its status region — a session's, not the shell's. */
export const EDITOR_BAR_CLASS = 'peekover-editor__bar';
export const EDITOR_SAVE_CLASS = 'peekover-editor__save';
export const EDITOR_STATUS_CLASS = 'peekover-editor__status';

/** On the OUTER host while the watch holds an external change behind this edit. Written by
 *  `watchController.ts` (its `CHANGED_IN_EDIT_ATTR`), read here BY LITERAL; a test pins the two. */
export const EDITOR_CHANGED_HINT_ATTR = 'data-watch-changed-in-edit';

const ARIA_PREVIEW = 'Live preview';
const SAVE_LABEL = 'Save';
const SAVING_LABEL = 'Saving…';

/** What a save is asked to do: write `text` (the buffer, LF) over a file last known as `baseline`. */
export interface EditorSaveRequest {
  text: string;
  baseline: string;
}

/** What a save answers. `saved` carries EXACTLY the string written; `downloaded` carries the same
 *  for the string handed to the browser, and the name it went under. A rejection is "failed". */
export type EditorSaveOutcome =
  | { kind: 'saved'; written: string }
  | { kind: 'downloaded'; written: string; filename: string }
  | { kind: 'conflict' }
  | { kind: 'unavailable' };

/** One session's save, bound by the app page to the file that session was opened on. */
export type EditorSessionSave = (request: EditorSaveRequest) => Promise<EditorSaveOutcome>;

/** The save capability, injected from the app page: called once, at edit entry, it returns that
 *  session's save. This module calls both and knows nothing else about where the text goes. */
export type EditorSave = () => EditorSessionSave;

/** What the status line is told: an outcome, with ruling A's and ruling C's qualifiers on the two
 *  that handed the text over — `saved` and `downloaded`. */
export type EditorSaveResult =
  | { kind: 'saved'; normalised: boolean; changedWhileEditing: boolean }
  | { kind: 'downloaded'; filename: string; normalised: boolean; changedWhileEditing: boolean }
  | { kind: 'conflict' | 'unavailable' | 'failed' };

const NORMALISED_TEXT = ' Line endings were normalised to LF.';

/** The status line for a save — its outcome in words (see THE SAVE HALF). */
export function saveStatusText(result: EditorSaveResult): string {
  switch (result.kind) {
    case 'saved':
      return (
        'Saved.' +
        (result.normalised ? NORMALISED_TEXT : '') +
        (result.changedWhileEditing
          ? ' The file changed on disk while you were editing, but its content was the same when checked.'
          : '')
      );
    case 'downloaded':
      return (
        `Saved as a download: ${result.filename}. The file in the folder was not changed.` +
        (result.normalised ? NORMALISED_TEXT : '') +
        (result.changedWhileEditing ? ' That file changed on disk while you were editing.' : '')
      );
    case 'conflict':
      return 'Not saved: the file changed on disk. Nothing was written, and your edit is still here.';
    case 'unavailable':
      return 'Not saved: saving is not available here. Nothing was written, and your edit is still here.';
    case 'failed':
      return 'The save failed. Your edit is still here.';
  }
}

/** Ruling A's test: every line break in `text` is a CRLF pair, and there is at least one. */
export function isUniformCrlf(text: string): boolean {
  return text.includes('\r\n') && !/\r(?!\n)|(^|[^\r])\n/.test(text);
}

/** Ruling A: the string a save writes for `buffer`, given the `baseline` it replaces. */
export function textForDisk(buffer: string, baseline: string): string {
  const lf = normaliseLineBreaks(buffer);
  return isUniformCrlf(baseline) ? lf.replace(/\n/g, '\r\n') : lf;
}

/** One edit session: the view, the baseline, and the capability it was handed. */
export interface EditorSession {
  /** The engine's view, built in the shell's source slot. */
  readonly view: EditorViewHandle;
  /** The baseline — what the file last was, RAW: the registered source the view was seeded from,
   *  exactly as read, until a save advances it. Never derived from the editor's document. */
  readonly originalText: string;
  /** After a SUCCESSFUL write only: make `written` — exactly the string written — the baseline. */
  advanceBaseline(written: string): void;
  /** This session's save, bound at edit entry — or `undefined` on a surface that injected none. */
  readonly save: EditorSessionSave | undefined;
}

/** D-7's save-time compare: has the file changed since the baseline? Strict equality — see the
 *  module comment for why nothing weaker. */
export function hasConflict(baseline: string, reread: string): boolean {
  return reread !== baseline;
}

/** What `buildEditor` is handed beside the engine. */
export interface BuildEditorOptions {
  save?: EditorSave;
  /** The clock the preview's cooldown is measured on. Injected for tests, which need to control
   *  what a render costs; production passes nothing and gets `performance.now`. */
  now?: () => number;
}

/** Text for the preview. The editor's document is one, and is only read when it is rendered. */
export interface PreviewText {
  toString(): string;
}

/** One preview's cooldown: `push` the newest text, `cancel` whatever is waiting. */
export interface PreviewCooldown {
  push(text: PreviewText): void;
  cancel(): void;
}

/**
 * The preview's cost-proportional cooldown (the module comment's THE FEED). `render` is called
 * with the newest pushed text — never inside `push` itself: in a 0 ms task when no cooldown is
 * running, otherwise once it has passed. The cooldown equals what the last render took (R26).
 */
export function createPreviewCooldown(
  render: (text: string) => void,
  now: () => number = () => performance.now(),
): PreviewCooldown {
  /** The earliest time the next render may START. 0 = as soon as a task can run. */
  let readyAt = 0;
  /** The one pending text, or null. There is never a second: the newest REPLACES this. */
  let pending: PreviewText | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;

  function renderNow(text: PreviewText): void {
    const started = now();
    render(text.toString());
    // From the END, not the start: measured from the start there would be no gap at all.
    readyAt = now();
    readyAt += readyAt - started;
  }

  function flush(): void {
    timer = null;
    if (pending === null) return;
    // A timer may fire early; then the cooldown has not passed, so wait out the remainder.
    const remaining = readyAt - now();
    if (remaining > 0) {
      timer = setTimeout(flush, remaining);
      return;
    }
    const text = pending;
    pending = null;
    renderNow(text);
  }

  return {
    push(text) {
      // Coalesce, do not queue. The timer already armed is left alone — see THE FEED.
      pending = text;
      // Never rendered HERE (R26): with no cooldown left to wait out, the timer is a 0 ms task.
      if (timer === null) timer = setTimeout(flush, Math.max(0, readyAt - now()));
    },
    cancel() {
      // Both halves: a cleared slot with a live timer would still fire after the session ended.
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      pending = null;
    },
  };
}

/**
 * The editor's own line-break rule, applied to a string: a CRLF pair and a lone CR each become one
 * LF. CodeMirror splits a document on exactly these (`@codemirror/state`'s default separator), so
 * `normaliseLineBreaks(text)` is what a view seeded with `text` reads back.
 */
export function normaliseLineBreaks(text: string): string {
  return text.replace(/\r\n?/g, '\n');
}

/** The parts of a built shell a caller works with. */
export interface EditorShell {
  /** The empty slot the editor's own DOM is built into. */
  source: HTMLElement;
  /** The preview pane — and its scroll box. */
  preview: HTMLElement;
  /** The nested host: the only element this module ever passes to `mount()`. */
  previewHost: HTMLElement;
}

interface BuiltShell {
  shell: EditorShell;
  /** Exactly what build appended to the outer shadow root — and so exactly what teardown removes. */
  added: Element[];
}

/** Per outer host: its built shell. Weak, so a discarded host takes its entry with it. */
const shells = new WeakMap<HTMLElement, BuiltShell>();

/** A host's entry, only while its nodes are still in that host's shadow root — a re-mount of the
 *  outer host drops them with `replaceChildren`, and a stale entry must not be handed back. */
function liveShell(host: HTMLElement): BuiltShell | undefined {
  const built = shells.get(host);
  if (!built) return undefined;
  if (built.added.every((node) => node.parentNode === host.shadowRoot)) return built;
  shells.delete(host);
  return undefined;
}

/** Per outer host: its edit session. */
const sessions = new WeakMap<HTMLElement, EditorSession>();

/** Per session: the cooldown its preview renders go through. */
const previews = new WeakMap<EditorSession, PreviewCooldown>();

/** Per session that was handed a save: its bar, and the one function that runs a save. */
const saveBars = new WeakMap<EditorSession, { bar: HTMLElement; run: () => Promise<void> }>();

/** The host's session, only while its view is still in that host's shell — an outer re-mount
 *  drops the view with the shell, and a stale session must not be handed back. */
export function editorSessionFor(host: HTMLElement): EditorSession | undefined {
  const session = sessions.get(host);
  if (!session) return undefined;
  if (liveShell(host)?.shell.source.contains(session.view.dom)) return session;
  return undefined;
}

/** Per dirty host: its claim on the tab closing or reloading (task 6.1). */
const unloadClaims = new WeakMap<HTMLElement, (event: BeforeUnloadEvent) => void>();

/**
 * Write the dirty attribute — and, WITH it, the `beforeunload` claim: while a host is dirty the
 * browser asks before the tab closes or reloads, and at no other time. The two are written here
 * and nowhere else, so neither can be present without the other; a listener is added once per
 * dirty host and removed the moment that host is clean or its session ends, leaving nothing on
 * the window. The dialog raised is the browser's own — a page can put no words in it.
 */
function markDirty(host: HTMLElement, dirty: boolean): void {
  const claim = unloadClaims.get(host);
  if (dirty) {
    host.setAttribute(EDITOR_DIRTY_ATTR, 'true');
    if (claim) return;
    const ask = (event: BeforeUnloadEvent): void => {
      event.preventDefault();
      event.returnValue = true; // engines that predate preventDefault() here
    };
    unloadClaims.set(host, ask);
    window.addEventListener('beforeunload', ask);
    return;
  }
  host.removeAttribute(EDITOR_DIRTY_ATTR);
  if (!claim) return;
  unloadClaims.delete(host);
  window.removeEventListener('beforeunload', claim);
}

/** End the host's session, live or stale: cancel its pending preview render, destroy the view
 *  and clear the dirty attribute. */
function endEditorSession(host: HTMLElement): void {
  const session = sessions.get(host);
  if (!session) return;
  sessions.delete(host);
  previews.get(session)?.cancel();
  saveBars.get(session)?.bar.remove();
  session.view.destroy();
  markDirty(host, false);
}

/** Run a save on the host's live session, exactly as its Save button does. Resolves once the
 *  outcome is on screen; does nothing for a host with no session, or one with no save. */
export function saveEditorSession(host: HTMLElement): Promise<void> {
  const session = editorSessionFor(host);
  return (session && saveBars.get(session)?.run()) ?? Promise.resolve();
}

/**
 * Build the edit view in `host`: the shell, then the engine's view in its source slot, seeded
 * from the host's registered source. Idempotent while a session is live.
 *
 * Shaped to be `enterEditMode`'s `build` step, under the same contract as `buildEditorShell`: if
 * the view cannot be built, the shell this call added is removed again before the throw leaves.
 */
export function buildEditor(
  engine: EditorEngine,
  host: HTMLElement,
  { save, now }: BuildEditorOptions = {},
): EditorSession {
  const live = editorSessionFor(host);
  if (live) return live;
  endEditorSession(host); // a session an outer re-mount left behind

  const shell = buildEditorShell(host);
  const seed = readerSourceFor(host) ?? '';
  // THE baseline, raw, and the editor's view of it — only ever set together, here and in advance.
  let baseline = seed;
  let normalisedBaseline = normaliseLineBreaks(seed);
  let session: EditorSession | undefined;
  /** The dirty attribute, written from the one baseline. Length first: a different length
   *  settles it without building the string. */
  const syncDirty = (doc: EditorDoc): void => {
    markDirty(host, doc.length !== normalisedBaseline.length || doc.toString() !== normalisedBaseline);
  };
  const preview = createPreviewCooldown((text) => {
    if (!session || editorSessionFor(host) !== session) return; // orphaned by an outer re-mount
    try {
      renderPreview(host, text);
    } catch (err) {
      console.warn('[peekover] preview render failed', err);
    }
  }, now);
  try {
    const view = engine.createView(
      shell.source,
      seed,
      engine.EditorView.updateListener.of((update) => {
        if (!update.docChanged) return;
        const { doc } = update.state;
        syncDirty(doc);
        preview.push(doc);
      }),
    );
    session = {
      view,
      get originalText() {
        return baseline;
      },
      advanceBaseline(written) {
        baseline = written;
        normalisedBaseline = normaliseLineBreaks(written);
      },
      save: save?.(), // BOUND HERE, at edit entry — see THE SAVE HALF
    };
    sessions.set(host, session);
    previews.set(session, preview);
    if (session.save) addSaveBar(host, shell, session, session.save, syncDirty);
    return session;
  } catch (err) {
    teardownEditorShell(host);
    throw err;
  }
}

/** The editor's document, as far as the dirty check reads it. */
interface EditorDoc extends PreviewText {
  readonly length: number;
}

/** Build a session's save bar at the top of its shell, and register the function that saves. */
function addSaveBar(
  host: HTMLElement,
  shell: EditorShell,
  session: EditorSession,
  save: EditorSessionSave,
  syncDirty: (doc: EditorDoc) => void,
): void {
  const bar = document.createElement('div');
  bar.className = EDITOR_BAR_CLASS;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = EDITOR_SAVE_CLASS;
  button.textContent = SAVE_LABEL;
  const status = document.createElement('p');
  status.className = EDITOR_STATUS_CLASS;
  status.setAttribute('role', 'status');
  status.hidden = true;
  const say = (text: string): void => {
    status.textContent = text;
    status.hidden = text === '';
  };
  bar.append(button, status);

  let saving = false;
  async function run(): Promise<void> {
    if (saving) return;
    saving = true;
    // All three are read NOW, before the first await — the hint most of all (THE SAVE HALF).
    const text = session.view.state.doc.toString();
    const before = session.originalText;
    const changedWhileEditing = host.hasAttribute(EDITOR_CHANGED_HINT_ATTR);
    say('');
    button.textContent = SAVING_LABEL;
    button.setAttribute('aria-busy', 'true');
    let result: EditorSaveResult;
    try {
      const outcome = await save({ text, baseline: before });
      if (outcome.kind === 'saved' || outcome.kind === 'downloaded') {
        const normalised = before.includes('\r') && !outcome.written.includes('\r');
        if (outcome.kind === 'saved') {
          session.advanceBaseline(outcome.written);
          // Only while this is still the host's session: the attribute is the host's, and a
          // session that ended mid-save must not write it for whatever came after.
          if (sessions.get(host) === session) syncDirty(session.view.state.doc);
          result = { kind: 'saved', normalised, changedWhileEditing };
        } else {
          // A DOWNLOAD MOVES NOTHING: the file in the folder is as it was, so the baseline and
          // the dirty attribute are too (THE SAVE HALF).
          result = { kind: 'downloaded', filename: outcome.filename, normalised, changedWhileEditing };
        }
      } else {
        result = outcome;
      }
    } catch (err) {
      console.warn('[peekover] save failed', err);
      result = { kind: 'failed' };
    }
    saving = false;
    button.textContent = SAVE_LABEL;
    button.removeAttribute('aria-busy');
    say(saveStatusText(result));
  }
  button.addEventListener('click', () => void run());

  saveBars.set(session, { bar, run });
  shell.source.before(bar);
}

/** End a session that an outer re-mount orphaned — its view is gone from the DOM, but its dirty
 *  attribute is on the host, which survives. A no-op while the session is live, or absent. */
export function dropStaleEditorSession(host: HTMLElement): void {
  if (!editorSessionFor(host)) endEditorSession(host);
}

/** The host's shell, or `undefined` when none is built (or a re-mount has since dropped it). */
export function editorShellFor(host: HTMLElement): EditorShell | undefined {
  return liveShell(host)?.shell;
}

/**
 * Build the shell in `host`'s shadow root and render the document into its preview. Idempotent:
 * a host that already has a live shell gets that one back, with nothing added.
 *
 * Shaped to be `enterEditMode`'s `build` step, whose contract is that a failed build leaves the
 * host's DOM as it found it: a host with no shadow root throws before anything is created, and a
 * throw after the append removes what was appended.
 */
export function buildEditorShell(host: HTMLElement): EditorShell {
  const existing = liveShell(host);
  if (existing) return existing.shell;
  const shadow = host.shadowRoot;
  if (!shadow) throw new Error('editorView: the host has no shadow root to build the edit view in');

  const style = document.createElement('style');
  style.textContent = EDITOR_CSS;

  const root = document.createElement('div');
  root.className = EDITOR_SHELL_CLASS;
  const source = document.createElement('div');
  source.className = EDITOR_SOURCE_CLASS;
  const preview = document.createElement('div');
  preview.className = EDITOR_PREVIEW_CLASS;
  preview.setAttribute('role', 'region');
  preview.setAttribute('aria-label', ARIA_PREVIEW);
  const previewHost = document.createElement('div');
  previewHost.className = EDITOR_PREVIEW_HOST_CLASS;
  preview.append(previewHost);
  root.append(source, preview);

  const shell: EditorShell = { source, preview, previewHost };
  shells.set(host, { shell, added: [style, root] });
  shadow.append(style, root);
  try {
    renderPreview(host, readerSourceFor(host) ?? '');
  } catch (err) {
    teardownEditorShell(host);
    throw err;
  }
  return shell;
}

/** The reader's enhancers, in its call sites' order — see the module comment. */
const PREVIEW_ENHANCERS: ReadonlyArray<(host: HTMLElement) => void> = [
  enhanceDiagrams,
  enhanceMath,
  enhanceTables,
  enhanceCode,
];

/** Render `text` into the host's preview, then enhance it as the reader enhances a document.
 *  Does nothing when the host has no shell. */
export function renderPreview(host: HTMLElement, text: string): void {
  const built = liveShell(host);
  if (!built) return;
  const { previewHost } = built.shell;
  mount(text, previewHost, { contained: true, preserveReading: true, chrome: false });
  for (const enhance of PREVIEW_ENHANCERS) {
    try {
      enhance(previewHost);
    } catch (err) {
      console.warn('[peekover] preview enhancement failed', err);
    }
  }
}

/** Remove exactly what `buildEditorShell` added, ending the edit session built in it first.
 *  Called beside `exitEditMode`; a no-op for a host with no shell and no session. */
export function teardownEditorShell(host: HTMLElement): void {
  endEditorSession(host);
  const built = shells.get(host);
  if (!built) return;
  shells.delete(host);
  for (const node of built.added) node.remove();
  unregisterThemeHost(built.shell.previewHost);
}

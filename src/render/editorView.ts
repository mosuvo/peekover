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
// Nothing here writes a file, asks for a permission or names a handle type. `save` is a function
// the app page hands in; the session carries it and, at 3.2, nothing calls it.
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
// ── THE FEED: THE BUFFER REACHES THE PREVIEW THROUGH A COOLDOWN (3.3; D-5's mechanism) ─────────
//
// The update listener that tracks dirtiness also hands the editor's document to a
// `createPreviewCooldown` instance, which decides WHEN `renderPreview` runs. Its shape is the
// watch's cost-proportional cooldown (decisions.md 2026-07-21, spec 005 tasks 5.2 / 5.3), built
// again here as a new instance scoped to one edit session — `watchController.ts` is not imported.
// Three things about it are structural, and each breaks quietly:
//
//   - The first render is immediate; after each render the next may not START until as long as
//     that render took has passed, measured from when it FINISHED. The render at build is not
//     timed and does not count: the first keystroke renders at once.
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
// measures the mount and the placeholders and NOT the engines' work: that cost is untimed here,
// and is task 6.2's to measure.
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

const ARIA_PREVIEW = 'Live preview';

/** What a save reports back. A refusal carries its reason as text, for a status line to show. */
export type EditorSaveOutcome = { ok: true } | { ok: false; reason: string };

/** The save capability, injected from the app page. This module calls it and knows nothing else
 *  about where the text goes. */
export type EditorSave = (text: string) => Promise<EditorSaveOutcome>;

/** One edit session: the view, the baseline, and the capability it was handed. */
export interface EditorSession {
  /** The engine's view, built in the shell's source slot. */
  readonly view: EditorViewHandle;
  /** The baseline — what the file last was, RAW: the registered source the view was seeded from,
   *  exactly as read, until a save advances it. Never derived from the editor's document. */
  readonly originalText: string;
  /** After a SUCCESSFUL write only: make `written` — exactly the string written — the baseline. */
  advanceBaseline(written: string): void;
  /** The injected save, or `undefined` on a surface that provided none. */
  readonly save: EditorSave | undefined;
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

/**
 * How much idle the preview gets per unit of render cost: 1 — the cooldown equals what the last
 * render took. PROVISIONAL (tasks.md Q4): 6.2 measures, the human rules the interval (spec §8-2),
 * and 6.4 applies that ruling and removes this constant.
 */
export const PREVIEW_COOLDOWN_MULTIPLIER = 1;

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
 * with the newest pushed text: at once when no cooldown is running, otherwise once it has passed.
 */
export function createPreviewCooldown(
  render: (text: string) => void,
  now: () => number = () => performance.now(),
): PreviewCooldown {
  /** The earliest time the next render may START. 0 = render immediately. */
  let readyAt = 0;
  /** The one pending text, or null. There is never a second: the newest REPLACES this. */
  let pending: PreviewText | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;

  function renderNow(text: PreviewText): void {
    const started = now();
    render(text.toString());
    // From the END, not the start: measured from the start there would be no gap at all.
    readyAt = now();
    readyAt += (readyAt - started) * PREVIEW_COOLDOWN_MULTIPLIER;
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
      const wait = readyAt - now();
      if (wait <= 0 && timer === null) {
        renderNow(text);
        return;
      }
      // Coalesce, do not queue. The timer already armed is left alone — see THE FEED.
      pending = text;
      if (timer === null) timer = setTimeout(flush, wait);
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

/** The host's session, only while its view is still in that host's shell — an outer re-mount
 *  drops the view with the shell, and a stale session must not be handed back. */
export function editorSessionFor(host: HTMLElement): EditorSession | undefined {
  const session = sessions.get(host);
  if (!session) return undefined;
  if (liveShell(host)?.shell.source.contains(session.view.dom)) return session;
  return undefined;
}

/** End the host's session, live or stale: cancel its pending preview render, destroy the view
 *  and clear the dirty attribute. */
function endEditorSession(host: HTMLElement): void {
  const session = sessions.get(host);
  if (!session) return;
  sessions.delete(host);
  previews.get(session)?.cancel();
  session.view.destroy();
  host.removeAttribute(EDITOR_DIRTY_ATTR);
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
        // Length first: a different length settles it without building the string.
        const dirty =
          doc.length !== normalisedBaseline.length || doc.toString() !== normalisedBaseline;
        if (dirty) host.setAttribute(EDITOR_DIRTY_ATTR, 'true');
        else host.removeAttribute(EDITOR_DIRTY_ATTR);
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
      save,
    };
    sessions.set(host, session);
    previews.set(session, preview);
    return session;
  } catch (err) {
    teardownEditorShell(host);
    throw err;
  }
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

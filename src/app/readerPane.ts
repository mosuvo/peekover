// readerPane — the app page's reader surface. Given a selected file, it reads the
// file's text and renders it through the UNCHANGED M1 pipeline (`mount(text, host)`);
// every OTHER outcome (no selection, an empty file, an unreadable file) degrades to a
// designed, never-blank state (AGENTS.md #5) instead of a blank pane or a hang.
//
// SCOPE (task 1.2): this is DOM/engine glue only. It does NOT open folders, walk a
// directory, or touch IndexedDB (groups 2–3). The "file" is any object matching the
// minimal `ReaderFile` seam below — fed here by a test today, and by group 3's
// `FolderSource → MarkdownFile[]` walk later. group 3's `MarkdownFile` (which adds
// `path` + capability meta, plan.md §seam) is structurally assignable to `ReaderFile`,
// so wiring it in needs no reshaping of this module.
//
// M1 discipline (mount.ts / mountReader.ts): the pure decision — WHICH state a
// selection resolves to — is `classifyReaderOutcome`, a side-effect-free function that
// is unit-tested directly; the DOM controller only performs the read and paints the
// classified outcome. `mount()` is reused as a library and never modified — the reader
// pane is a new caller, exactly like the content script is.

import { mount } from '../render/mount';
import { enhanceDiagrams } from '../render/diagramEnhancer';
import { enhanceMath } from '../render/mathEnhancer';
import { enhanceEditor, type EditorSave } from '../render/editorEnhancer';
import { enhanceTables } from '../render/tableEnhancer';
import { enhanceCode } from '../render/codeEnhancer';
import { stopWatch } from '../watch/watchRegistry';

/**
 * The minimal file seam the reader pane consumes. Deliberately structural and tiny:
 * a display `name` and an async `read()` that yields the raw markdown text. group 3's
 * richer `MarkdownFile` (with `path` + capability meta) satisfies this shape, so it can
 * be handed straight to `select()` with no adapter.
 */
export interface ReaderFile {
  /** Display name of the file (e.g. `notes.md`). Shown in designed error states. */
  name: string;
  /** Read the file's raw markdown text. May reject (permission/IO) — handled here. */
  read(): Promise<string>;
}

/** The outcome of a read, normalised so the pure classifier never itself throws. */
export type ReadResult =
  | { ok: true; text: string }
  | { ok: false; error: unknown };

/**
 * What the reader pane should show. Every arm is a DESIGNED state (never blank):
 *   - `no-selection` — nothing is selected yet (initial / cleared).
 *   - `empty-file`   — a file was read but has no renderable content (empty/whitespace).
 *   - `unreadable`   — `read()` rejected (permission denied, IO error, revoked handle).
 *   - `render`       — real content to hand to `mount()`.
 */
export type ReaderOutcome =
  | { kind: 'no-selection' }
  | { kind: 'empty-file'; name: string }
  | { kind: 'unreadable'; name: string }
  | { kind: 'render'; text: string };

/**
 * PURE: decide what the pane should show from a selection + its read result. No DOM, no
 * I/O — this is the never-blank decision made testable in isolation (M1 discipline). A
 * null file is `no-selection`; a failed read is `unreadable`; a successful-but-blank
 * read is `empty-file`; anything else renders. Whitespace-only counts as blank because
 * `mount()` would otherwise produce an effectively empty reader with no signal to the
 * user that the file simply had nothing in it.
 */
export function classifyReaderOutcome(file: ReaderFile | null, read: ReadResult): ReaderOutcome {
  if (!file) return { kind: 'no-selection' };
  if (!read.ok) return { kind: 'unreadable', name: file.name };
  if (read.text.trim() === '') return { kind: 'empty-file', name: file.name };
  return { kind: 'render', text: read.text };
}

/** A CSS class that scopes the reader pane's own designed-state styling. */
const PANE_CLASS = 'peekover-app__reader';

/**
 * The reader pane's designed-state stylesheet. Styles only the pane's INTERIOR (the
 * designed states + the mount host); the pane's outer layout (flex sizing, padding) is
 * owned by appShell, which places this element in the shell body. Reads the shell's
 * design tokens (`--muted`/`--faint`, defined by appShell on `.peekover-app`) via
 * inheritance, with plain fallbacks so the pane still reads sensibly if used outside the
 * shell (e.g. a focused unit test). No colors are hardcoded into the brand surface —
 * these mirror the shell tokens, matching how `readerCss.ts` copies from tokens.css.
 */
const PANE_CSS = /* css */ `
.${PANE_CLASS}__state{
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  gap:.4rem; height:100%; min-height:12rem; text-align:center;
  color:var(--muted,#5D6070);
}
.${PANE_CLASS}__state-title{font-weight:600}
.${PANE_CLASS}__state-detail{color:var(--faint,#9A9DAC); font-size:.85rem; max-width:40ch}
.${PANE_CLASS}__host{display:block}
`;

/** Copy for each designed state — a title and a quiet detail line. */
const STATE_COPY: Record<Exclude<ReaderOutcome['kind'], 'render'>, { title: string; detail: string }> = {
  'no-selection': {
    title: 'Select a file to read it here',
    detail: 'Open a folder, then pick a markdown file to render it in the reader.',
  },
  'empty-file': {
    title: 'This file is empty',
    detail: 'There is nothing to render — the file has no content yet.',
  },
  'unreadable': {
    title: "Couldn't read this file",
    detail: 'The file could not be opened. It may have moved, or access was revoked.',
  },
};

/**
 * What the pane is created with (012 D-3). `save` is the editor's save capability: a FUNCTION the
 * app shell builds and hands in, which this module passes on to `enhanceEditor` without calling
 * it or looking inside it. The pane stays capability-free — it holds no handle and names no
 * handle type; whatever the function closes over is the shell's business. Optional, so every
 * caller that predates it (and every test that builds a bare pane) is unchanged.
 */
export interface ReaderPaneOptions {
  save?: EditorSave;
}

/** The public handle appShell (and later group 3) drives the pane through. */
export interface ReaderPaneController {
  /** The pane root element — appShell slots this into the page body. */
  readonly element: HTMLElement;
  /**
   * Select a file (or `null` to clear back to the no-selection state). Reads the file
   * and renders it through `mount()`, or paints the matching designed never-blank
   * state. Resolves once the pane has settled on its final state. Never rejects — a
   * read failure becomes the `unreadable` designed state, not a thrown error.
   */
  select(file: ReaderFile | null): Promise<void>;
}

/** Build a designed-state element for a non-render outcome. Names the file where the
 *  outcome carries one (`empty-file`/`unreadable`), so the state is specific, not vague. */
function buildState(doc: Document, outcome: Exclude<ReaderOutcome, { kind: 'render' }>): HTMLElement {
  const { title, detail } = STATE_COPY[outcome.kind];
  const wrap = doc.createElement('div');
  wrap.className = `${PANE_CLASS}__state`;
  wrap.setAttribute('data-state', outcome.kind);
  const t = doc.createElement('p');
  t.className = `${PANE_CLASS}__state-title`;
  t.textContent = title;
  const d = doc.createElement('p');
  d.className = `${PANE_CLASS}__state-detail`;
  // Prefix the file name when the outcome has one — `notes.md — <detail>`.
  d.textContent = 'name' in outcome ? `${outcome.name} — ${detail}` : detail;
  wrap.append(t, d);
  return wrap;
}

/**
 * Create the reader pane. Owns a `<main>` region (semantic reader landmark) with a
 * persistent stylesheet, a persistent mount host, and a swappable content region.
 *
 * The mount host is created ONCE and reused for the controller's lifetime: `mount()` is
 * idempotent over a host (it reuses the host's shadow root), and a shadow root stays
 * attached to its element even while the element is detached during a designed state —
 * so re-selecting a file re-attaches the same host and re-renders cleanly, with no
 * duplicate roots or leaked listeners (the exact property mount.ts documents).
 */
export function createReaderPane(
  doc: Document,
  { save }: ReaderPaneOptions = {},
): ReaderPaneController {
  const element = doc.createElement('main');
  element.className = PANE_CLASS;
  element.setAttribute('role', 'main');
  element.setAttribute('aria-label', 'Reader');

  const style = doc.createElement('style');
  style.textContent = PANE_CSS;

  // The swappable content region — designed states and the mount host live here so the
  // persistent <style> is never torn out by a state transition.
  const content = doc.createElement('div');
  content.className = `${PANE_CLASS}__content`;

  // The persistent mount host. Reused across renders (mount() is idempotent over it).
  const host = doc.createElement('div');
  host.className = `${PANE_CLASS}__host`;

  element.append(style, content);

  /** Paint a classified outcome. Rendering reuses the single host; every other arm is
   *  a designed never-blank state. Each call fully replaces the content region. */
  function paint(outcome: ReaderOutcome): void {
    if (outcome.kind === 'render') {
      // Ensure the host is the sole content child, then mount into it. Building the
      // host detached and committing last means a mount throw can't blank the pane —
      // mount() itself degrades to a raw <pre> inside the host's shadow root (#5).
      // `contained: true` scopes the reader to this host's box: the M1 reader CSS styles
      // :host as a full-page takeover (right for the content script, which covers the raw
      // document), which would otherwise paint over the shell here. See CONTAINED_CSS.
      content.replaceChildren(host);
      mount(outcome.text, host, { contained: true });
      // D-12's first call site: enhancement runs AFTER the mount has committed and is not a
      // branch inside it (`mount()` stays read-only library, 006 D-15). Synchronous and
      // pre-paint — it leaves D-15's degraded state behind, so a fence whose diagram never
      // arrives is already showing its source rather than transitioning into showing it.
      enhanceDiagrams(host);
      // M11 D-3-R — math enhancement, wired immediately after diagrams (D-3-R's own two call
      // sites); the "listed, never composed" discipline the note below states applies here too.
      enhanceMath(host);
      // 012 D-3 SITE 1 — the edit control, immediately after math (D-3's own two call sites), and
      // LISTED like the rest: `editorEnhancer` reaches the one CodeMirror importer, so a shared
      // seam would carry that edge to the content script exactly as the note below describes for
      // diagrams. It touches no fence and no table — it adds a control beside the mode pill — so
      // it brings no ordering question of its own. `save` is the pane's injected capability,
      // passed through untouched.
      enhanceEditor(host, { save });
      // 008 D-6 SITE 1 — the app page's initial select. The enhancers are LISTED, never composed:
      // a shared `enhance(host)` seam would be the tidy version and would put `diagramEnhancer`
      // (and mermaid's dynamic edge behind it) on the content-script graph the moment sites 3-4
      // called it, taking 007's 8/8 import fence to red. The duplication across the four sites IS
      // §3.2's fence expressed in imports, and the difference between the app page's two sites and
      // the content script's two is the thing the fence can see.
      //
      // ORDER: diagrams first, then tables (plan §4 risk 5). Neither enhancer knows about the
      // other and a table cannot occur inside a mermaid fence, so they cannot collide on a node —
      // but the ordering is an implicit contract and is stated at the site rather than assumed.
      // A math fence is a third, mutually exclusive fence shape (`parse.ts`'s `info` dispatch): it
      // cannot nest a table either, so inserting `enhanceMath` above adds no new collision to reason
      // about.
      //
      // `enhanceTables` is TOTAL (D-7): it cannot throw, so it cannot reach `paint`'s caller and
      // cannot cost the reader a document that already rendered correctly.
      enhanceTables(host);
      // 009 D-5 SITE 1 — fourth in the list, after diagrams, math and tables (D-5's own text: "no
      // ordering reason beyond newest last"; a markdown-it fence and a GFM table are siblings, and
      // neither a mermaid nor a math fence nests a code block). Synchronous, same D-6 degraded-state
      // property as above.
      enhanceCode(host);
      return;
    }
    content.replaceChildren(buildState(doc, outcome));
  }

  // Initial state: nothing selected yet — a designed state, never a blank pane.
  paint({ kind: 'no-selection' });

  async function select(file: ReaderFile | null): Promise<void> {
    // STOP ANY RUNNING WATCH BEFORE SWITCHING DOCUMENTS (spec 005 task 4.3).
    //
    // THIS PREVENTS A REAL BUG, NOT AN EDGE CASE. This pane re-mounts ONE shared host for every
    // file (see `paint`), and the watch controller holds that same host. A watch left running over
    // file A would keep re-rendering A's freshly-read text into the host that is now showing B —
    // so the reader would silently display file A's content under file B's name, with no error and
    // no clue anything was wrong. That is the silent-wrong-answer failure class this milestone has
    // already met twice (003's mis-resolved scroll root, 3.2's clamped scroll).
    //
    // It is stopped FIRST, before the async read below, so there is no window in which the old
    // watch can fire against a pane that is mid-switch. Closing the tab ends a watch by
    // construction (spec §1.2); switching documents does not, so it is explicit here.
    //
    // `stopWatch()` is a no-op in a context with no registered watch (every existing caller, and
    // the content script, which never switches documents), so this is additive for them.
    stopWatch();

    if (!file) {
      paint(classifyReaderOutcome(null, { ok: true, text: '' }));
      return;
    }
    let read: ReadResult;
    try {
      read = { ok: true, text: await file.read() };
    } catch (error) {
      // Never-blank: a rejected read is a designed state, not an unhandled throw.
      read = { ok: false, error };
    }
    paint(classifyReaderOutcome(file, read));
  }

  return {
    element,
    select,
  };
}

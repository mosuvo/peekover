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
export function createReaderPane(doc: Document): ReaderPaneController {
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
      content.replaceChildren(host);
      mount(outcome.text, host);
      return;
    }
    content.replaceChildren(buildState(doc, outcome));
  }

  // Initial state: nothing selected yet — a designed state, never a blank pane.
  paint({ kind: 'no-selection' });

  async function select(file: ReaderFile | null): Promise<void> {
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

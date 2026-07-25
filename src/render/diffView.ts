// diffView — hunks → sanitized markup, and the `data-diff` sibling flip that SHOWS a diff
// without re-rendering the document (plan §1.5, D-15). It takes hunks AS DATA and is
// engine-blind: it imports no `diff` package and no `diffEngine` runtime, so it never drags the
// dependency into whatever bundle reaches it (plan §1.4, the import fence). The affordance (6.2)
// and the app-page side (which owns the engine) are what call it; at 6.1 it is exercised only by
// its browser test.
//
// ── WHY THE HUNK TYPE IS MIRRORED HERE, NOT IMPORTED ──────────────────────────────────────────
//
// The canonical shape is `DiffHunk` in `./diffEngine`. We deliberately do NOT
// `import type { DiffHunk } from './diffEngine'`: the 5.1 import fence (`diffEngine.test.ts`) is a
// SOURCE-TEXT scanner — its `import … from './diffEngine'` regex matches a `import type` line too,
// because a type-only import is erased from the BUNDLE but not from the SOURCE the fence reads. So
// even the zero-runtime type import would flip `diffView.ts` into the fence's engine-importer
// allowlist (which stays `[]` at 6.1). A local structural mirror keeps the view genuinely
// engine-free — plan §1.4's "imports no engine", literally — and the browser test (fence-exempt)
// imports the real `DiffHunk` and passes it in, so structural typing + `tsc --noEmit` catch any
// drift between the two declarations. See this task's report for the empirical fence result.
//
// ── D-15: ENTERING A DIFF IS AN ATTRIBUTE FLIP, NOT A RE-RENDER ────────────────────────────────
//
// `data-diff="active"` on the HOST mirrors `WATCH_HOST_ATTR` (`watchControl.ts:58`): host
// attributes survive `replaceChildren`, children do not. CSS hides `.peekover-reader`
// (`:host([data-diff="active"]) .peekover-reader{display:none}`, readerCss.ts) — the reading
// column's DOM is NEVER touched, so `mount()` stays read-only library. It is a SEPARATE attribute
// from `data-mode` on purpose: `readerMode.ts` guards its Raw shortcut on `data-mode`, so a third
// `data-mode` value would change the shipped Raw toggle's semantic (D-15).
//
// ── §3.8: BOTH SIDES ARE UNTRUSTED ────────────────────────────────────────────────────────────
//
// Every hunk — added, removed AND unchanged — is agent-written markdown, untrusted on every side
// (§3.8, AGENTS.md #3). Each goes through the SAME `parse → sanitize` pipeline `mount()` uses
// (`mount.ts:116`), and then the SAME inert-`<template>` + `applyMediaPolicy` neutralisation
// (`mount.ts:129-132`) so a remote `<img src>` in a diff cannot put a byte on the wire
// (AGENTS.md #1, zero network by default). No shortcut, no new sanitiser, no "the user already saw
// it" exemption — a stored snapshot is not authenticated. Line granularity is applied to SOURCE and
// displayed against blocks (§3.8): each hunk's lines join with `\n` and render as one block carrying
// its kind — no sub-line spans (deferred with a home in §6).
//
// ── THE HIDDEN-COLUMN RUNG (mount.ts:251-257) ─────────────────────────────────────────────────
//
// A `display:none` reading column has all-zero heading rects, so a reading-anchor restore computed
// against them resolves to ~0 — a jump to the top, the failure the anchor exists to prevent. So the
// anchor is captured BEFORE the column is hidden (enter) and restored AFTER it is unhidden (exit),
// exactly the rung `mount.ts:251-257` documents for the Raw-mode column.
//
// ── THE FALLBACK, NAMED AHEAD OF BUILDING (plan §1.5, §7-8) ────────────────────────────────────
//
// If a hunk cannot be produced or rendered, the rendered document stays exactly on screen and the
// failure is surfaced beside it by the caller: `enterDiff` returns `{ok:false, reason}`, NEVER sets
// `data-diff`, and inserts nothing. Same shape as `watchController`'s dead-read policy — explain
// without a re-render, never blank (AGENTS.md #5). This same state absorbs 1.2's meta-first
// dangling-content case (§4's "comparison unavailable").

import { parse } from './parse';
import { sanitize } from './sanitize';
import { applyMediaPolicy } from './mediaPolicy';
import { buildTocModel } from './tocModel';
import { resolveScrollContainer } from './scrollContainer';
import { captureReadingAnchor, restoreReadingAnchor, type ReadingAnchor } from './readingAnchor';

/**
 * One contiguous block of same-classified lines — a STRUCTURAL MIRROR of `DiffHunk` in
 * `./diffEngine` (see the header for why it is mirrored rather than imported). `lines` are the
 * block's contents without newline terminators, in document order.
 */
export interface DiffHunk {
  kind: 'added' | 'removed' | 'unchanged';
  lines: readonly string[];
}

/** The attribute the HOST carries while a diff is shown — mirrors `WATCH_HOST_ATTR` (D-15). */
export const DIFF_HOST_ATTR = 'data-diff';
/** Its only value; matched by `:host([data-diff="active"])` in readerCss.ts. */
export const DIFF_ACTIVE = 'active';
/** The diff sibling container's class — the CSS handle readerCss.ts styles. */
export const DIFF_VIEW_CLASS = 'peekover-diff';

/** Result of `enterDiff`. On failure `reason` is human-readable, for the affordance to surface
 *  beside the untouched document (the fallback, plan §1.5). */
export type DiffEnterResult = { ok: true } | { ok: false; reason: string };

/** The reader-place carried across a diff's lifetime — captured on enter (column visible),
 *  restored on exit (column visible again). Keyed by host in a WeakMap so it is bounded (one per
 *  host) and GC-reclaimed if a host is dropped without an `exitDiff` — no unbounded growth. */
interface CarriedPlace {
  /** The scroll box the anchor was captured from — resolved once, reused for the restore. */
  scroller: HTMLElement;
  /** The captured place. */
  anchor: ReadingAnchor;
}
const carried = new WeakMap<HTMLElement, CarriedPlace>();

/** The reader root inside `host`'s shadow, or null on the raw-fallback surface (no reading column
 *  to diff against). */
function readerRoot(host: HTMLElement): HTMLElement | null {
  return host.shadowRoot?.querySelector<HTMLElement>('.peekover-reader') ?? null;
}

/**
 * The reader's scroll box for `host`, resolved per surface exactly as `mount()` does — never
 * blindly `:host` (`scrollContainer.ts`'s trap). `contained` has no explicit marker on the host, so
 * it is derived from OUR OWN shadow CSS: the full-page takeover styles `:host{position:fixed}`
 * (READER_CSS), the contained pane overrides it to `position:relative` (CONTAINED_CSS). Reading the
 * computed position is deterministic here because it comes from Peekover's stylesheet, not the host
 * page's arbitrary CSS — which is the fragility `scrollContainer.ts` warns against for an
 * overflow-walk heuristic.
 */
function resolveScroller(host: HTMLElement): HTMLElement {
  const contained = getComputedStyle(host).position !== 'fixed';
  return resolveScrollContainer(host, contained);
}

/**
 * Render one hunk's lines into a kind-classed block, through the FULL mount() DOM discipline:
 * parse → sanitize (§3.8) → inert `<template>` → `applyMediaPolicy` (zero network, AGENTS.md #1) →
 * adopt. Building into a detached block means a throw here inserts nothing (the fallback contract).
 */
function renderHunk(hunk: DiffHunk, baseUrl: string): HTMLElement {
  const block = document.createElement('div');
  block.className = `diff-${hunk.kind}`;
  const html = sanitize(parse(hunk.lines.join('\n')));
  const tpl = document.createElement('template');
  tpl.innerHTML = html; // parsed inert: no browsing context → no remote fetch (mount.ts:129-132)
  applyMediaPolicy(tpl.content, baseUrl);
  block.append(tpl.content);
  return block;
}

/**
 * Enter the diff view on `host` (plan §1.5, D-15). Captures the reading anchor BEFORE hiding the
 * column (the hidden-column rung), builds a sanitized `.peekover-diff` sibling from the hunks, and
 * — only once that sibling exists — flips `data-diff="active"` so CSS hides the reading column. On
 * any parse/sanitize failure returns `{ok:false, reason}` WITHOUT setting `data-diff` and WITHOUT
 * inserting anything: the rendered document stays exactly as-is (the fallback, §7-8).
 */
export function enterDiff(host: HTMLElement, hunks: readonly DiffHunk[]): DiffEnterResult {
  const shadow = host.shadowRoot;
  if (!shadow) return { ok: false, reason: 'no reader shadow root to show a diff in' };

  // Capture the place while the reading column is still visible (headings have real rects). The
  // build below is detached, so it does not disturb the live reader's layout before we read it.
  const scroller = resolveScroller(host);
  const root = readerRoot(host);
  const anchor = captureReadingAnchor(scroller, root ? buildTocModel(root) : []);

  const baseUrl = host.ownerDocument?.baseURI || 'about:blank';
  const container = document.createElement('div');
  container.className = DIFF_VIEW_CLASS;
  try {
    for (const hunk of hunks) container.append(renderHunk(hunk, baseUrl));
  } catch (err) {
    // Fallback: nothing inserted, data-diff never set, the document stays on screen (§1.5).
    return { ok: false, reason: err instanceof Error ? err.message : 'diff could not be rendered' };
  }

  // Sibling exists BEFORE the CSS flip hides the reader (order matters).
  shadow.appendChild(container);
  host.setAttribute(DIFF_HOST_ATTR, DIFF_ACTIVE);
  carried.set(host, { scroller, anchor });
  return { ok: true };
}

/**
 * Exit the diff view (plan §1.5, D-15). Removes `data-diff` FIRST so the reading column unhides and
 * its heading rects become valid again, removes the diff sibling, THEN restores the reading anchor
 * (the hidden-column rung, in reverse). Safe to call when not in a diff — a no-op.
 */
export function exitDiff(host: HTMLElement): void {
  host.removeAttribute(DIFF_HOST_ATTR); // reading column unhides via CSS; rects valid again
  host.shadowRoot?.querySelector(`.${DIFF_VIEW_CLASS}`)?.remove();

  const place = carried.get(host);
  if (!place) return;
  const root = readerRoot(host);
  restoreReadingAnchor(place.scroller, root ? buildTocModel(root) : [], place.anchor);
  carried.delete(host);
}

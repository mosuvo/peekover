// readingAnchor — keep the reader's PLACE across a re-render (spec 005 task 3.2, decision D-3).
//
// THE DECISION THIS IMPLEMENTS, restated because it is the whole reason the module exists:
// restoring raw `scrollTop` is correct only when content is APPENDED. An agent rewriting a file
// inserts ABOVE the reading position constantly, and every pixel it inserts pushes the reader's
// place further down — so a pixel restore silently drifts the reader backwards through the
// document on every keystroke. The anchor restores by CONTENT instead: which heading you were
// under, and how far past it you had read.
//
// THE LADDER (capture → restore), in order:
//   1. heading TEXT — stable across re-parses of a mostly-unchanged document, and the case that
//      matters, because insertion above changes a heading's position but not its words;
//   2. heading INDEX — for when the text itself was edited, so the Nth heading is the best
//      remaining guess;
//   3. raw `scrollTop` — when the document has no headings at all, or nothing matched. Never a
//      jump to the top: an imperfect place beats losing it (AGENTS.md #5's posture applied to
//      continuity).
//
// ── THE PURE/DOM SPLIT, AND WHY IT IS NOT DUPLICATION ──────────────────────────────────────
//
// `selectAnchorIndex` and `matchAnchorIndex` are PURE — they take numbers and strings, never a
// node — so the selection and fallback ladder is unit-tested directly in jsdom
// (`readingAnchor.test.ts`). Everything jsdom is BLIND to (where a heading's top actually sits,
// whether the restore lands the reader in the same visual place) is proven in a real engine
// (`tests/browser/watchAnchor.browser.test.ts`). Neither suite could substitute for the other.
//
// `buildTocModel(root)` is REUSED rather than re-deriving the headings: mount() already runs it
// on every render immediately before the commit, so the model exists at exactly the moment both
// capture and restore need it.

import type { TocEntry } from './tocModel';

/** A captured reading position. `text`/`index` identify the heading being read; `delta` is the
 *  pixel gap from that heading's top DOWN to the scroll position (so a positive delta means the
 *  reader had scrolled past the heading). `scrollTop` is the raw position, carried as the
 *  ladder's last rung — it is what a restore falls back to when no heading can be matched. */
export interface ReadingAnchor {
  /** The anchored heading's label, or `''` when no heading was at or above the position. */
  text: string;
  /** The anchored heading's index in document order, or `-1` when there was none. */
  index: number;
  /** Pixels from the anchored heading's top down to the scroll position. */
  delta: number;
  /** The raw scroll position at capture — the fallback rung. */
  scrollTop: number;
}

/** Flatten a nested TOC model into document order — the same pre-order `tocView` renders, so an
 *  index here means the same heading it means there. */
function flattenEntries(model: TocEntry[]): TocEntry[] {
  const out: TocEntry[] = [];
  const walk = (entries: TocEntry[]): void => {
    for (const e of entries) {
      out.push(e);
      walk(e.children);
    }
  };
  walk(model);
  return out;
}

/** An element's top in the scroll box's CONTENT coordinates (independent of where the box is
 *  currently scrolled), so a top captured before a re-render is comparable with one measured
 *  after it. */
function contentTop(el: Element, scroller: HTMLElement): number {
  return (
    el.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop
  );
}

/**
 * PURE: the index of the LAST heading whose top is at or above `scrollPos`, or `-1` when none is
 * (the reader is above the first heading). `tops` is in document order, so tops increase down the
 * page and the scan can stop at the first heading below the position.
 *
 * "At or above" is inclusive on purpose: a reader sitting exactly on a heading's top is reading
 * THAT section, not the one before it.
 */
export function selectAnchorIndex(tops: number[], scrollPos: number): number {
  let found = -1;
  for (let i = 0; i < tops.length; i += 1) {
    if (tops[i] > scrollPos) break;
    found = i;
  }
  return found;
}

/**
 * PURE: resolve a captured anchor against the labels of the NEW document, by the ladder's first
 * two rungs. Returns the matched index, or `null` when neither rung applies (the caller then
 * falls back to raw `scrollTop`).
 *
 * TEXT WINS over index deliberately: insertion above is the common case, and it SHIFTS every
 * index while leaving the words alone. Preferring the index would fail on precisely the case
 * this module exists for.
 */
export function matchAnchorIndex(labels: string[], anchor: ReadingAnchor): number | null {
  if (labels.length === 0 || anchor.index < 0) return null;
  const byText = labels.indexOf(anchor.text);
  if (anchor.text !== '' && byText !== -1) return byText;
  if (anchor.index < labels.length) return anchor.index; // the text is gone — fall to the index
  return null;
}

/**
 * Capture where the reader is reading, from the LIVE pre-change DOM. `model` is the TOC model of
 * the currently-rendered root (mount() has one in hand). An anchor is always returned — a
 * document with no headings, or a reader above the first one, yields the `scrollTop`-only rung
 * rather than null, so callers never need a second code path for "no place to keep".
 */
export function captureReadingAnchor(
  scroller: HTMLElement,
  model: TocEntry[],
): ReadingAnchor {
  const scrollTop = scroller.scrollTop;
  const entries = flattenEntries(model);
  if (entries.length === 0) return { text: '', index: -1, delta: 0, scrollTop };

  const tops = entries.map((e) => contentTop(e.headingRef, scroller));
  const i = selectAnchorIndex(tops, scrollTop);
  if (i < 0) return { text: '', index: -1, delta: 0, scrollTop };

  return { text: entries[i].label, index: i, delta: scrollTop - tops[i], scrollTop };
}

/**
 * Restore a captured place onto the NEWLY rendered document. `model` is the TOC model of the new
 * root. Walks the ladder: text → index → raw `scrollTop`. The restored position puts the matched
 * heading's top back exactly `delta` pixels above the scroll position — the same relationship the
 * reader had, wherever the heading moved to.
 *
 * The write is a plain `scrollTop` assignment, so the scroll box's own CSS `scroll-behavior`
 * governs (smooth on the full-page `:host`, instant in the contained pane) and
 * `prefers-reduced-motion` keeps working through the existing `readerCss.ts` override — no JS
 * behaviour argument, the same discipline 003's click-to-scroll took.
 */
export function restoreReadingAnchor(
  scroller: HTMLElement,
  model: TocEntry[],
  anchor: ReadingAnchor,
): void {
  const entries = flattenEntries(model);
  const i = matchAnchorIndex(
    entries.map((e) => e.label),
    anchor,
  );
  if (i === null) {
    scroller.scrollTop = anchor.scrollTop; // rung 3 — an imperfect place, never a lost one
    return;
  }
  scroller.scrollTop = contentTop(entries[i].headingRef, scroller) + anchor.delta;
}

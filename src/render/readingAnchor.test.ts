// readingAnchor — the PURE selection + fallback ladder (spec 005 task 3.2, D-3).
//
// SCOPE, stated so the split is not mistaken for thin coverage: this file tests only what is
// genuinely pure — which heading is chosen from a set of tops, and which rung of the ladder a
// restore resolves through. jsdom cannot see WHERE a heading's top actually is
// (`getBoundingClientRect` is all-zero) or whether a restore landed the reader in the same
// visual place, so the half that matters visually is proven in a real engine at
// `tests/browser/watchAnchor.browser.test.ts`. Neither suite substitutes for the other.

import { describe, it, expect } from 'vitest';
import {
  selectAnchorIndex,
  matchAnchorIndex,
  captureReadingAnchor,
  restoreReadingAnchor,
  type ReadingAnchor,
} from './readingAnchor';
import type { TocEntry } from './tocModel';

/** A minimal flat TocEntry list — `headingRef` is never dereferenced by the pure paths, and the
 *  DOM paths exercised here deliberately take the no-headings / no-match rungs. */
function entries(...labels: string[]): TocEntry[] {
  return labels.map((label) => ({
    headingRef: { tagName: 'H2' } as unknown as Element,
    level: 2,
    label,
    children: [],
  }));
}

function anchor(patch: Partial<ReadingAnchor> = {}): ReadingAnchor {
  return { text: 'Section 3', index: 2, delta: 40, scrollTop: 1000, ...patch };
}

describe('selectAnchorIndex — the LAST heading at or above the scroll position', () => {
  const TOPS = [0, 500, 1000, 1500];

  it('chooses the last heading whose top is at or ABOVE the position, not the nearest one', () => {
    // At 1200 the reader is between headings 2 (1000) and 3 (1500). The one being READ is 2 —
    // a "nearest" rule would wrongly pick 3, which the reader has not reached yet.
    expect(selectAnchorIndex(TOPS, 1200)).toBe(2);
  });

  it('is INCLUSIVE at a heading top — sitting exactly on a heading reads THAT section', () => {
    expect(selectAnchorIndex(TOPS, 1000)).toBe(2);
    // ...and one pixel short of it is still the previous section.
    expect(selectAnchorIndex(TOPS, 999)).toBe(1);
  });

  it('returns -1 when the reader is ABOVE the first heading (no anchor to take)', () => {
    expect(selectAnchorIndex([100, 500], 40)).toBe(-1);
  });

  it('returns the final heading past the last one, and -1 for an empty document', () => {
    expect(selectAnchorIndex(TOPS, 99999)).toBe(3);
    expect(selectAnchorIndex([], 500)).toBe(-1);
  });
});

describe('matchAnchorIndex — the restore ladder (text → index → null)', () => {
  it('TEXT WINS, even when the heading has MOVED to a different index (insertion above)', () => {
    // The case D-3 exists for: a section was inserted above, so "Section 3" is now index 3.
    // Preferring the index would restore the reader to the wrong section entirely.
    const labels = ['Inserted', 'Section 1', 'Section 2', 'Section 3'];
    expect(matchAnchorIndex(labels, anchor({ text: 'Section 3', index: 2 }))).toBe(3);
  });

  it('falls to the INDEX when the captured text is GONE (the heading was edited)', () => {
    const labels = ['Section 1', 'Section 2', 'Renamed section', 'Section 4'];
    expect(matchAnchorIndex(labels, anchor({ text: 'Section 3', index: 2 }))).toBe(2);
  });

  it('returns null — the scrollTop rung — when the new document has NO headings', () => {
    expect(matchAnchorIndex([], anchor())).toBeNull();
  });

  it('returns null when the text is gone AND the index is out of range (the doc shrank)', () => {
    expect(matchAnchorIndex(['Only one'], anchor({ text: 'Section 3', index: 2 }))).toBeNull();
  });

  it('returns null when the capture itself had no heading (index -1)', () => {
    expect(matchAnchorIndex(['Section 1'], anchor({ text: '', index: -1 }))).toBeNull();
  });
});

describe('capture/restore — the scrollTop rung end to end', () => {
  /** A scroll box stand-in: jsdom has no layout, so only the scrollTop rung is exercised here
   *  (every path that reads a heading's geometry is a real-engine assertion by construction). */
  function fakeScroller(scrollTop: number): HTMLElement {
    return { scrollTop } as HTMLElement;
  }

  it('captures the raw scrollTop rung for a document with NO headings', () => {
    const captured = captureReadingAnchor(fakeScroller(820), []);
    expect(captured).toEqual({ text: '', index: -1, delta: 0, scrollTop: 820 });
  });

  it('restores raw scrollTop when nothing matches — never a jump to the top', () => {
    const scroller = fakeScroller(0);
    restoreReadingAnchor(scroller, [], anchor({ scrollTop: 820 }));
    expect(scroller.scrollTop).toBe(820);
  });

  it('restores raw scrollTop when the text is gone and the index no longer exists', () => {
    const scroller = fakeScroller(0);
    restoreReadingAnchor(scroller, entries('Only one'), anchor({ scrollTop: 640 }));
    expect(scroller.scrollTop).toBe(640);
  });
});

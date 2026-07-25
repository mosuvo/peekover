// diffEngine — the pure line-diff engine, and THE ONLY module in the tree that imports `diff`
// (kpdecker/jsdiff). It turns two document sources into a Peekover-owned list of hunks; it touches
// no DOM, no IndexedDB, no network — a total function of two strings (plan §1.4).
//
// ── WHY THIS IS THE FENCE'S ONE GATED DOOR ────────────────────────────────────────────────────
//
// `diff` must never enter the content-script module graph (plan §1.4, "the import fence, and it is
// load-bearing"). The fence is architectural, not incidental: this file is imported by the app-page
// side that constructs and registers the diff target (`appShell`, via 6.1's `diffView.ts`), and by
// NOTHING `mount.ts` reaches. Entering a diff is an attribute flip on the host, not a re-render, so
// `mount()` never needs the engine and never imports it (D-15 — "entering a diff is an attribute
// flip, not a re-render; mount() stays read-only library"). Because the engine is the sole importer
// of `diff`, keeping the engine off the content-script graph keeps the package's bytes off it too.
// The import-fence pin (diffEngine.test.ts) asserts the allowlist of files that may import `diff` or
// this engine holds; §5's bundle-grep proves no `diff` bytes reached the content script.
//
// ── D-5: THE ENGINE SEES LF-NORMALISED TEXT ───────────────────────────────────────────────────
//
// Both sides pass through {@link normalise} (D-5, task 1.4) before `diffLines` sees them, so a bare
// CRLF→LF rewrite reports NO change instead of an all-lines-changed diff. `normalise` is REUSED from
// `snapshots.ts` (`\r\n` → `\n`, nothing else); it is never re-declared here. This mirrors the
// capture boundary, which normalises the same way — the library only ever sees LF text on both ends.
//
// ── THE MARKUP IS 6.1's; THE HUNK SHAPE IS OURS ───────────────────────────────────────────────
//
// The library returns change objects; the markup is ours (plan §1.4). {@link computeDiff} maps each
// change 1:1 into a {@link DiffHunk} — a stable, Peekover-owned shape that insulates the view (6.1's
// `diffView.ts`) from `diff`'s version churn. No hunk is dropped or merged: identical inputs yield a
// single `unchanged` hunk, so the view (not the engine) decides how "no changes" reads. Line
// granularity is applied to SOURCE and displayed against blocks (§3.8) — no sub-line spans here.
//
// ── FALLBACK, AND WHAT IS NOT THE ENGINE'S JOB ────────────────────────────────────────────────
//
// This is a pure function: it always returns a `DiffHunk[]` and never throws for well-formed string
// input. The FALLBACK named in plan §1.5 (§7-8) — "if the diff cannot be produced or rendered, the
// rendered document stays on screen and the failure is surfaced beside it; `data-diff` is never set,
// never blank" — is the VIEW's contract (6.1), not this file's. No snapshot-size guardrail lives
// here either: the plan's snapshot bounds (task 7.x / D-16) keep inputs small upstream, and a caller
// that passes a huge input pays the CPU cost (6.1's view gates on snapshot byte-count before calling).

import { diffLines } from 'diff';
import { normalise } from '../app/snapshots';

/**
 * One contiguous block of lines the diff classified the same way. `lines` are the block's line
 * CONTENTS without their newline terminators (a blank line is `''`, never dropped); the block's
 * order in the returned array is its order in the document.
 */
export interface DiffHunk {
  kind: 'added' | 'removed' | 'unchanged';
  /** The block's consecutive lines, newline-stripped. Length equals the library change's line
   *  `count`; never empty for a hunk the library emitted. */
  lines: readonly string[];
}

/**
 * Split one `diffLines` change value into its constituent lines. `diffLines` concatenates each
 * line's `\n` into the value, so a non-final block ends in `\n` (`'a\nb\n'` → `['a', 'b']`) while
 * the document's final block does not (`'c'` → `['c']`). We strip a SINGLE trailing `\n` — the
 * block terminator — before splitting, so an interior blank line (`'a\n\nc'` → `['a', '', 'c']`) is
 * preserved and no phantom empty line is appended.
 */
function splitLines(value: string): string[] {
  const body = value.endsWith('\n') ? value.slice(0, -1) : value;
  return body.split('\n');
}

/**
 * Diff two document sources at line granularity, LF-normalising both first (D-5). Returns the hunks
 * in document order; identical inputs (after normalise) yield a single `unchanged` hunk, and two
 * empty inputs yield `[]` (the library reports no lines, so there is nothing to show). A pure
 * CRLF→LF change therefore produces no `added`/`removed` hunk — normalise collapses it before the
 * library sees it. Pure and total: no DOM, no IDB, always returns.
 */
export function computeDiff(before: string, after: string): DiffHunk[] {
  const changes = diffLines(normalise(before), normalise(after));
  return changes.map((change): DiffHunk => ({
    kind: change.added ? 'added' : change.removed ? 'removed' : 'unchanged',
    lines: splitLines(change.value),
  }));
}

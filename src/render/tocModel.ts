// tocModel — PURE heading model over a rendered reader root. No DOM writes, no engine,
// no browser globals. Spec 003 §3, plan §3-#1 / §3-#9.
//
// `buildTocModel(root)` queries the post-sanitize, about-to-be-committed reader root for
// its `h1..h6` in document order, holds the exact element REFERENCE per heading, and folds
// them into a nested `TocEntry[]` by the nearest-strictly-shallower-ancestor stack. Because
// the model is derived from the very nodes `mount()` commits (and `replaceChildren` moves
// those nodes, preserving identity), every entry resolves to a real heading in the rendered
// DOM and no entry exists for a heading absent from it — §3-constraint-4 by construction.
//
// This is the crash-free foundation: it reads the passed-in root only, returns fresh values,
// and never touches `id` (navigation is by element ref, so `sanitize.ts` stays byte-unchanged).
// `tocView` renders what this computes and re-derives none of the structure — the same pure/DOM
// split M1 used for `classifyReaderOutcome` and M2 used for `tree`/`treeView`.

/** One heading in the TOC tree. Carries the exact heading Element, its level, the display
 *  label, and nested children. `headingRef` is the SAME node that lives in the rendered DOM —
 *  the name is load-bearing: `tocView` (2.1) and the scroll handler (3.1) navigate by this
 *  exact ref, so the model and the real scroll target are one node, not two derivations. */
export interface TocEntry {
  /** The exact heading Element in the rendered root (identity preserved through commit). */
  headingRef: Element;
  /** Heading depth 1..6, read from the tag name (`H3` → 3). */
  level: number;
  /** Display text — `heading.textContent.trim()`, or a designed fallback when that is empty. */
  label: string;
  /** Nested deeper headings, in document order. Empty when the entry has no descendants. */
  children: TocEntry[];
}

/** The six heading tags, queried as one selector so document order is the browser's own. */
const HEADING_SELECTOR = 'h1,h2,h3,h4,h5,h6';

/**
 * Display label for a heading. Primary: `textContent.trim()` (constraint §3-c5 — text only,
 * never HTML). When that is empty — a truly empty heading, an image-only heading (an `<img>`
 * or media-policy placeholder contributes no text), or an emoji-rendered-as-image heading —
 * fall back to a DESIGNED, deterministic label so the TOC is never blank and never a crash.
 *
 * The fallback is `Untitled section` (M13 walk fix 8.1k, HUMAN RULING 2026-11-11 — the earlier
 * `(H<level> #<ordinal>)` suffix read as noise in the human's hand test). Several untitled
 * sections share the label and stay apart by position and indent; each entry still targets its
 * own heading element. Real duplicate label TEXTS are kept verbatim (no slug/id/dedup suffix —
 * that is the deferred permalink feature).
 */
function labelFor(heading: Element): string {
  const text = (heading.textContent ?? '').trim();
  if (text) return text;
  return 'Untitled section';
}

/**
 * PURE: build the nested TOC model from a rendered reader `root`. Queries `h1..h6` in document
 * order, holds each element ref, and nests by the nearest-strictly-shallower-ancestor stack:
 * each heading attaches under the nearest preceding heading of a STRICTLY shallower level.
 *
 * - Non-monotonic (h1 → h3) nests the h3 directly under the h1 — NO synthetic h2 node.
 * - A doc that starts at h3 (or any level) normalizes its baseline to the shallowest level
 *   actually present: a heading with no strictly-shallower ancestor on the stack becomes a
 *   top-level row, so the shallowest headings present are the top row regardless of value.
 * - Deterministic and crash-free for any shape (empty root → `[]`).
 *
 * Reads `root` only; performs no DOM writes and no engine work. Input is never mutated.
 */
export function buildTocModel(root: ParentNode): TocEntry[] {
  const headings = Array.from(root.querySelectorAll(HEADING_SELECTOR));

  const roots: TocEntry[] = [];
  // Ancestor chain of currently-open entries, shallowest → deepest by level.
  const stack: TocEntry[] = [];

  headings.forEach((heading) => {
    const entry: TocEntry = {
      headingRef: heading,
      level: Number(heading.tagName.charAt(1)),
      label: labelFor(heading),
      children: [],
    };

    // Pop until the stack top is strictly shallower than this heading (or the stack is empty).
    // Same-or-deeper levels can't be this entry's parent, so they close here.
    while (stack.length > 0 && stack[stack.length - 1].level >= entry.level) {
      stack.pop();
    }

    if (stack.length === 0) {
      roots.push(entry); // no strictly-shallower ancestor → a top-level row (baseline).
    } else {
      stack[stack.length - 1].children.push(entry);
    }

    stack.push(entry);
  });

  return roots;
}

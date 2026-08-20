// codeDetect — M-3's heuristic mechanism (D-12, decisions.md 2026-08-19 · M9 8.5: "heuristic — the
// one paid option that fits" against 8.1's byte headroom). Ported from 8.3's scratch reference
// (`codeDetectHeuristic.ts`, deleted before commit per the standing scratch-file-then-delete
// convention; its methodology is banked in `docs/ai/progress.md`'s 8.3 ledger entry, cited below) to
// this codebase's own conventions.
//
// ── STANDALONE AND UNREACHABLE, BY 8.6's OWN SCOPE ────────────────────────────────────────────
//
// Neither `codeEngine.ts` nor `codeEnhancer.ts` imports this module. tasks.md 8.6's Files list names
// only `settings.ts`, `codeView.ts` and (conditionally) this file — not the engine or the enhancer —
// and its Verify line requires the enhancer's orchestration, the tokenize call and the toolbar
// wiring to stay byte-identical. Wiring an unlabeled fence's guess into the live highlight path
// (feeding {@link detectLanguage}'s result into `codeEngine.ts`'s `LANGUAGE_LOADERS` lookup before
// the loader-load decision) is deferred to a later task, mirroring `codeEngine.ts`'s own task-1.2
// precedent: built here, reachable from nowhere yet, its byte cost measured via a scratch-reference
// ablation rather than a real import edge (this task's own report).
//
// ── THE ALGORITHM: STRUCTURAL DECLINE FIRST, THEN A MARGIN-GATED SIGNATURE MATCH ───────────────
//
// Only the fence's first 10 lines are read — a fence's language is legible from its opening shape,
// and reading further costs more for no accuracy gain (8.3's own finding). Three structural
// non-code detectors run BEFORE any language signature: a bare file list, a directory tree (box-
// drawing characters), and this repository's own "annotated pseudocode" convention (arrow/ellipsis
// glyphs, or two-or-more `word # comment` trailing annotations — Python-style comments over
// JS-shaped call sequences, not real Python). Any one of these firing declines outright — a
// structural non-code shape is not a language-signature contest. Only past that gate do the
// per-language signatures score, and even the top scorer must clear {@link MARGIN} over the
// runner-up before it is returned — a mixed-signal fence declines rather than guesses (8.3's
// "required score-margin" finding, ported verbatim).

/** A guessed language id (an informal string, not necessarily one `codeEngine.ts`'s
 *  `LANGUAGE_LOADERS` resolves — that reconciliation belongs to the future wiring task), or
 *  `undefined` when the fence declines to guess. */
export type DetectedLanguage = string | undefined;

/** How many of the fence's leading lines are read. Matches 8.3's own methodology — reading further
 *  costs latency for no measured accuracy gain on this task's corpus. */
const HEAD_LINES = 10;

/** The minimum point lead the top-scoring language signature must hold over the runner-up before
 *  {@link detectLanguage} returns it rather than declining (8.3's "required score-margin" finding). */
const MARGIN = 2;

/** A bare list of path-like lines (three or more), each carrying no other punctuation a real fence
 *  would — the `recon-006-gate2.md`-shaped case: a change-manifest's file list, not code. */
function isBareFileList(head: string): boolean {
  const lines = head
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 3) return false;
  return lines.every((line) => /^[A-Za-z0-9_][A-Za-z0-9_./-]*$/.test(line));
}

/** Directory-tree box-drawing characters (`WORKFLOW.md`'s own repo-layout fence is exactly this
 *  shape). */
const DIRECTORY_TREE_RE = /[├└│┌┐┘┬┴┼]/;

/** Arrow/flow glyphs (`→`/`←`/`↔`/`⇒`/`▼`/`↓`), a single-character ellipsis (`…`), or a
 *  standalone/space-bounded ASCII ellipsis (`...`) — this repository's own diagram/pseudocode
 *  shorthand throughout `specs/*\/plan.md`. */
const ARROW_OR_ELLIPSIS_RE = /[→←↔⇒▼↓]|…|(^|\s)\.\.\.(\s|$)/m;

/** Two or more lines carrying a `word  # comment` trailing annotation — this repository's own
 *  "house pseudocode convention": Python-style `#` comments over JS-shaped call sequences (8.3's
 *  own bias-sentence naming), never real JS (which comments with `//`) and, absent a genuine
 *  Python signature elsewhere in the fence, not real Python either. A single `#` is not enough
 *  (a real code fence may carry one incidental one) — the REPEATED convention is the signal. */
function isAnnotatedPseudocode(head: string): boolean {
  const matches = head.match(/\S[ \t]+#[ \t]+\S/g);
  return (matches?.length ?? 0) >= 2;
}

interface Signature {
  /** Counted per match (not merely presence), so a heavier concentration of a language's own
   *  shape outweighs a thin one when the margin is checked. */
  readonly re: RegExp;
  readonly weight: number;
}

/** Each candidate language's own shape, first 10 lines only. Every pattern is global so
 *  {@link scoreOf} can count occurrences rather than test presence alone. Ordered by nothing in
 *  particular — {@link detectLanguage} scores every entry and margin-gates the winner, so
 *  declaration order carries no meaning. */
const SIGNATURES: Readonly<Record<string, readonly Signature[]>> = {
  typescript: [
    { re: /\binterface\s+[A-Za-z_]\w*/g, weight: 3 },
    { re: /\btype\s+[A-Za-z_]\w*\s*=/g, weight: 3 },
    { re: /:\s*(['"]?[\w.]+['"]?\s*\|\s*)+['"]?[\w.]+['"]?/g, weight: 2 },
    { re: /\bas const\b/g, weight: 2 },
  ],
  javascript: [
    { re: /\b(?:const|let|var)\s+\w+\s*=/g, weight: 1 },
    { re: /\bfunction\s*\(/g, weight: 1 },
    { re: /=>/g, weight: 1 },
    { re: /\bexport\s+(?:const|function|class|default)\b/g, weight: 2 },
    { re: /\bimport\s*\{[^}]*\}\s*from\s*['"]/g, weight: 2 },
  ],
  python: [
    { re: /^\s*def\s+\w+\(.*\):\s*$/gm, weight: 3 },
    { re: /^\s*import\s+\w+\s*$/gm, weight: 2 },
    { re: /^\s*elif\b/gm, weight: 2 },
    { re: /^\s*class\s+\w+.*:\s*$/gm, weight: 3 },
  ],
  json: [{ re: /^\s*"[^"]+"\s*:\s*\S/gm, weight: 2 }],
  css: [
    { re: /(?:^|\s)\.[a-zA-Z][\w-]*\s*\{/g, weight: 2 },
    { re: /(?:^|\s)#[a-zA-Z][\w-]*\s*\{/g, weight: 2 },
    {
      re: /\b(?:color|background(?:-color)?|margin(?:-\w+)?|padding(?:-\w+)?|display|width|height|font(?:-size|-family|-weight)?|border(?:-radius|-color)?|position|flex(?:-\w+)?|grid(?:-\w+)?|z-index|opacity|transform|transition|overflow(?:-\w+)?|cursor|text-align|line-height|box-shadow)\s*:\s*[^;{}]+;/g,
      weight: 2,
    },
  ],
  html: [
    // A generic-type parameter (`Promise<Settings>`) is excluded — the `<` sits directly against
    // an identifier, which a real opening tag's `<` never does (8.3's named false positive was on
    // a BRACKETED-PLACEHOLDER shape, `<one line>`, preceded by whitespace or punctuation, not an
    // identifier; this exclusion narrows the signature without erasing that finding).
    { re: /(?<![A-Za-z0-9_])<\/?[a-zA-Z][^>]*>/g, weight: 1 },
  ],
  bash: [
    { re: /^#!\/(?:usr\/bin\/env\s+)?(?:ba)?sh/m, weight: 3 },
    { re: /\$\([^)]*\)/g, weight: 1 },
    { re: /\b(?:cd|export|pnpm|npm|git)\b/g, weight: 1 },
  ],
};

function scoreOf(head: string, signatures: readonly Signature[]): number {
  let score = 0;
  for (const { re, weight } of signatures) {
    const matches = head.match(re);
    if (matches) score += matches.length * weight;
  }
  return score;
}

/**
 * M-3's heuristic (decisions.md 2026-08-19 · M9 8.5): guess an unlabeled fence's language from its
 * own shape, or decline. `source` is the fence's raw text (untrusted markdown) — never parsed as
 * markup, only pattern-matched as plain text.
 *
 * Structural non-code shapes (module header) are checked first and decline outright. Past that
 * gate, every {@link SIGNATURES} entry is scored over the first {@link HEAD_LINES} lines; the top
 * scorer is returned only if it clears {@link MARGIN} over the runner-up, and only if it scored at
 * all — a fence with no signal declines exactly like a mixed-signal one.
 */
export function detectLanguage(source: string): DetectedLanguage {
  const head = source.split('\n').slice(0, HEAD_LINES).join('\n');
  if (isBareFileList(head)) return undefined;
  if (isAnnotatedPseudocode(head)) return undefined;
  if (DIRECTORY_TREE_RE.test(head)) return undefined;
  if (ARROW_OR_ELLIPSIS_RE.test(head)) return undefined;

  let top: { lang: string; score: number } | undefined;
  let runnerUp = 0;
  for (const [lang, signatures] of Object.entries(SIGNATURES)) {
    const score = scoreOf(head, signatures);
    if (!top || score > top.score) {
      runnerUp = top?.score ?? 0;
      top = { lang, score };
    } else if (score > runnerUp) {
      runnerUp = score;
    }
  }
  if (!top || top.score === 0) return undefined;
  if (top.score - runnerUp < MARGIN) return undefined;
  return top.lang;
}

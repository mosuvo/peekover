# AGENTS.md — Peekover

<!-- Hand-written. Keep under 150 lines. If a rule stops being true, DELETE it (C2). -->

## What this is

Peekover: free, open-source browser extension that renders raw markdown (incl. AI-agent output)
into beautiful reading. Reader first, editor second, on-device AI third. Zero network calls by
default — this is the brand, not a preference. Full product spec: `docs/product/spec.md`.

## Non-negotiables (violating these is a bug, not a tradeoff)

1. **Zero network by default.** No fetch/XHR/websocket unless the user explicitly triggered it
   (remote file open, BYOK AI, publish). Every user-triggered call must light the network indicator.
2. **No telemetry, no analytics, no remote code, ever.** Not even error reporting.
3. **All parsing is sanitized.** Every HTML string that touches the DOM goes through DOMPurify.
   No `innerHTML` with unsanitized input anywhere, including "trusted" sources.
4. **Permissions are minimal and justified.** Any manifest permission change requires updating
   `docs/trust/PERMISSIONS.md` in the same PR, with a plain-English reason.
5. **Never a blank page.** Rendering failures degrade to the raw text view with an error banner.
6. **Free means free.** No upsell paths, no locked features, no "Pro" scaffolding in the codebase.

## Stack (decided — don't re-litigate, see docs/ai/decisions.md)

- **WXT** (extension framework, MV3, multi-browser) + TypeScript + Vite
- **markdown-it** (+ plugins for GFM/footnotes/etc.) — one parser, options-driven
- **DOMPurify** (sanitize), **Shiki** (code), **KaTeX** (math), **Mermaid** (diagrams, lazy)
- **CodeMirror 6** (editor, Phase-1-late)
- No UI framework for the reader view — vanilla TS + CSS custom properties. Keep it light (≤5MB packed).

## Commands

- `pnpm dev` — WXT dev mode (Chrome) · `pnpm dev:firefox`
- `pnpm build` — production build · `pnpm zip` — store package
- `pnpm test` — vitest · `pnpm lint` — eslint + tsc --noEmit
- All must pass before ending a session (see .claude/commands/end-session.md).

## Style & structure

- `entrypoints/` (WXT convention) · `src/render/` pipeline · `src/ui/` chrome · `src/theme/` tokens
- Design tokens come from `design/tokens.css` — never hardcode colors; the brand is
  paper/ink/one-highlighter (see `design/brand.html`). Logo internals use FIXED ink #16171F.
- Small modules, pure functions in the render pipeline; side effects live in entrypoints.
- Tests colocated: `foo.ts` + `foo.test.ts`. Pipeline stages get golden-file tests in `tests/golden/`.
- Before finalizing a dependency, API, or config choice, verify it against current official docs — training knowledge of fast-moving tools (WXT, DOMPurify, browser/store policy) is often stale.
- Write control/NULL characters as \uXXXX escapes, never literal bytes — especially inside regex character classes.
- A specialized or math font must be subset by its required-glyph-set — including OpenType MATH-table
  constructions (radicals, delimiter extenders, operator size-variants) — never by scanning rendered text for
  codepoints; text-scanning is blind to glyphs the browser draws from font tables rather than emitting as
  characters (M11's font-subset MATH-table blind spot, `docs/ai/retro.md` 2026-09-11).
- When the mechanism that made a value PROVISIONAL becomes real, remove the provisional constant rather than
  updating its comment in place — if a single source of truth already carries the resolved value, a second
  copy is drift risk, not documentation.
- Red-first ablations earn their keep on novel assertions. A test extension that mirrors an already-established
  pattern's shape doesn't need its own per-extension ablation — the pattern's original ablation is standing
  precedent, cite it instead of re-earning it.
- Full-suite Verify is mandatory whenever production code changes. Test-only tasks with an empty production
  diff may use targeted-suite Verify plus a spot-check that adjacent surfaces weren't inadvertently touched,
  instead of the full suite.

## Workflow (the short version — full: WORKFLOW.md)

- Start every session: read `docs/ai/progress.md`, then the active spec in `specs/`.
- Plans before code for anything non-trivial (C13). Update memory files before ending (C14 budget).
- A session kickoff (or any handoff prompt) is a hypothesis, not authority. The tasks / spec / plan file body
  is ground truth. When a kickoff and the file body disagree, follow the body and flag the mismatch — never
  silently follow either.
- A kickoff's WORK section must be checked against tasks.md's own line-item text before drafting — not after.
  If a kickoff's scope exceeds, narrows, or substitutes a resolution for what the task's own line already
  states, that is a drafting-time defect, not just a Step-0 catch.
- Necessary ripple — a file structurally required by the Verify line but absent from the Files list — is not
  scope creep; it must be enumerated explicitly, in the plan or kickoff, with a per-file justification tied to
  the specific Verify clause that requires it. Conversely, a file added beyond what the Verify line requires IS
  scope creep, even if related — route it via AskUserQuestion rather than including it on judgment alone.
- Every task kickoff's standing-invariants block states the current bundle-budget snapshot (bytes used /
  ceiling / headroom), not only at milestone close — a small tax that surfaces a ceiling-breach before it
  lands instead of at measurement time.
- A milestone-close walk or human gate that requires a loaded browser extension (chrome://extensions,
  Firefox about:debugging) has no agent substitute — the automation surface cannot reach those pages. Mark
  such items human-only up front; do not attempt them or fake them with a test-suite run.
- The browser test suite runs files SERIALLY, sharing one real per-engine `document`/`window` (and the OS
  clipboard, the Resource Timing buffer, module-level caches). Any assertion about that shared state must be
  DELTA-based or SPECIFIC-CONTENT-matched — never an absolute count, a non-empty check, or a pristine-state
  assumption. A red that clears on an isolated rerun is the signature of this class (harness-shared-state),
  distinguishable from a real regression, which persists or appears in another file. Worked references:
  `exportShortcut.browser.test.ts`'s `reactionsTo()` delta-spy (document listeners); the specific-content
  clipboard matches in the copy tests.
- Current milestone: **M11 (`specs/011-math-rendering/`) — ALL THREE PLANNING GATES ARE PASSED: gate-1
  APPROVED (2026-09-06, four §9 rulings), gate-2 APPROVED (2026-09-06 — `decisions.md`'s M11 GATE 2 entry),
  and gate-3 APPROVED (2026-09-06 — `decisions.md`'s M11 GATE 3 entry, `specs/011-math-rendering/tasks.md`,
  9 groups / 16 tasks, 18 if group 7 opens, three gate-3 findings ruled). ★ IMPLEMENTATION IS NOW
  AUTHORIZED — task 1.1 (the byte-measurement hard gate settling RULING 1) is the next act, in a FRESH
  SESSION (C14).** The three gate-3 findings: the concrete MathJax package name (`mathjax-full`) is
  APPROVED AS TASK 1.1'S CANDIDATE TO VERIFY, not a pinned choice; the document-level "copy all formulas as
  MathML" action's UI placement (§8-1 ruled (b)) is RULED a PANEL/MENU-ROW action, never a toolbar button
  or keyboard shortcut, with task 6.2's own text corrected to state it; RULING 4's possible mid-task-7.2
  pause is confirmed NO ACTION NEEDED, correctly deferred already. `plan.md`'s
  twelve D-values (D-1…D-12) are SEALED as
  M11's architecture — a new markdown-it passthrough-marker rule (D-1), the single-importer engine
  module(s) (D-2), the two-call-site enhancer wiring reused from 007 (D-3), the KaTeX
  `trust:false`/`throwOnError` config lockdown (D-4), a third named sanitizer profile admitting KaTeX's
  HTML+MathML dual output plus a new `style`-value procedural filter (D-5), the zero-new-dependency
  copy-as-LaTeX/MathML mechanism (D-6), inline math's mutate-in-place INVERSION of 007 D-15's
  sibling-figure shape (D-7), block/fence math's shared reuse of 007's own sibling-figure machinery (D-8),
  a leaned-and-verify no-theme-re-render claim (D-9), the MathJax contingency structured as a purely
  additive drop point (D-10), the settings-field shape if it ships (D-11), and the no-speculative-cache
  measurement obligation (D-12). **RULING 1 (§9-1, the dependency-set fork) is still MEASURED, not
  assumed — task 1.1, `tasks.md`'s first task, is the milestone's own hard gate**, unchanged from gate 1's
  own framing, now ALSO measuring `@mdit/plugin-tex` (D-1's tokenizer, an always-loaded parse-graph
  dependency) alongside `katex`/MathJax per gate 2's own measurement fix. The one genuine spec-level gap
  surfaced at gate 2 is RULED, not left open: §8-1 (inline math's copy-as-LaTeX/MathML reachability, since
  D-7's inversion means block math's control-group mechanism cannot serve inline math unmodified) is ruled
  OPTION (b) — inline copy-as-LaTeX via text-selection, copy-as-MathML via a document-level "copy all
  formulas as MathML" action, no per-formula inline chrome; block math's control group is unchanged. This
  amends spec §4's copy criterion, recorded in `decisions.md`'s gate-2 entry rather than by editing
  `spec.md` (sealed, per the M7–M10 precedent). M10 (`specs/010-local-exports/`) closed 2026-09-06. M11 =
  F2 Math (KaTeX, contingent MathJax fallback, inline/block/fence math, copy-as-LaTeX/MathML). Per the
  M7–M10 precedent, the spec's own status line and §9 text stay unedited post-gate-1, `plan.md`'s own
  status line likewise stays "draft awaiting gate 2" post-gate-2, and `tasks.md`'s own status line stays
  "DRAFT awaiting gate 3" post-gate-3 — `decisions.md`'s 2026-09-06 M11 GATE 1, GATE 2, and GATE 3 entries
  are the approvals of record.

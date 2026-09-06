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
- Current milestone: **M11 (`specs/011-math-rendering/`) — gate-1 APPROVED, 2026-09-06, four §9 rulings
  recorded in `decisions.md`. `plan.md` next (fresh session, C14) — its first move is task 1.1's byte
  measurement (§3.1/§3.4/§8-1/§9-1: KaTeX+MathJax vs. KaTeX-only, measured not assumed).** M10
  (`specs/010-local-exports/`) closed 2026-09-06. M11 = F2 Math (KaTeX, contingent MathJax fallback,
  inline/block/fence math, copy-as-LaTeX/MathML). Per the M7–M10 precedent, the spec's own status line and
  §9 text stay unedited post-gate-1 — `decisions.md`'s 2026-09-06 M11 GATE 1 entry is the approval of
  record.

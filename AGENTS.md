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
- No UI framework for the reader view — vanilla TS + CSS custom properties. Keep it light (≤7MB packed).

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
- Every task's preflight runs `pnpm audit --prod` and the kickoff's invariants block states its exit and
  date. An advisory can land mid-milestone with no code change (M12: katex at 1.3, dompurify and
  markdown-it at 1.4); the earlier it shows, the cheaper the bump (M12 retro, `docs/ai/retro.md`).
- A guard that reads a ZERO (network, leak, collision) is fired by a control that includes a SLOW case, not
  only a fast one, and is read only after something later has settled. Resource Timing records a request
  when it ENDS, so an early zero is blind to a slow leak (M12 retro; `wireSettled()` in
  `tests/browser/helpers/diagramWindow.ts`).
- Author scripts and multi-line files with the file tool, not a shell heredoc (it collapses doubled
  backslashes and rejects an unbalanced apostrophe). After a stopped browser run, check for orphaned node
  and Playwright processes before the next one (M12 retro).
- A milestone-close walk or human gate that requires a loaded browser extension (chrome://extensions,
  Firefox about:debugging) has no agent substitute — the automation surface cannot reach those pages. Mark
  such items human-only up front; do not attempt them or fake them with a test-suite run.
- The browser test suite runs files SERIALLY, sharing one real per-engine `document`/`window` (and the OS
  clipboard, the Resource Timing buffer, IndexedDB, the font and HTTP caches — modules and `document.fonts`
  do NOT carry between files: M12 task 5.8 measured it). Any assertion about that shared state must be
  DELTA-based or SPECIFIC-CONTENT-matched — never an absolute count, a non-empty check, or a pristine-state
  assumption. A red that clears on an isolated rerun is the signature of this class (harness-shared-state),
  distinguishable from a real regression, which persists or appears in another file. Worked references:
  `exportShortcut.browser.test.ts`'s `reactionsTo()` delta-spy (document listeners); the specific-content
  clipboard matches in the copy tests.
- Current milestone: **none in flight — M12 (`specs/012-editor-mode/`) CLOSED 2026-10-30.** Editor Mode's focused
  core shipped on both engines: a dedicated Edit control, CodeMirror 6 (lazy, app-page-only, behind the
  one-importer fence) beside a live preview that is the reader's own `mount()` on a nested host, Save (writes on
  Chromium, downloads elsewhere, refuses and tells on a conflict), the watch/edit collision supported-degraded, and
  the unsaved-changes guard. `permissions: []`; content script 344,195 B with zero `codemirror` bytes; `.output`
  5,830,859 / 5,830,975 B against the 7 MiB ceiling. **Next: not yet scheduled.** `docs/ai/progress.md` § Carried
  items holds the consolidated post-M12 list (the reader-polish task with the left sidebar is the one
  `decisions.md` names); the human schedules. Records: `decisions.md`'s "M12 CLOSED"; the retro is `retro.md`'s
  "M12 retro". Spec, plan and tasks status lines stay sealed/"draft" per the M7–M12 precedent.

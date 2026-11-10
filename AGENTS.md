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
  Authoring text that mentions a NUL escape can still emit the real byte (the test stays green); after writing such
  a file, count NULs two ways (`tr -d -c '\000' < F | wc -c` and python `count(b'\x00')`), each fired on a control.
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

## Verification traps (each one cost a milestone a wrong green)

- A zero-network or remote-media guard runs in `tests/browser/` on Resource Timing — jsdom loads no subresources.
  Neutralize remote media in an inert `<template>`/`DOMParser` document; a "detached" div of the live one fetches.
- Firefox: an inert parse of `@import` (DOMPurify does one) consumes that URL's load, so a fetch control routed
  through the sanitizer reads NO-FETCH. The live-route arm adopts markup no sanitizer has touched.
- A grep over a built bundle proves nothing until it fires on a target that contains the thing — minified
  identifiers match nowhere. Grep strings, classes or `data-` attributes, or ablate and diff the bytes.
- `pnpm build` is Chromium-only; `.output/firefox-mv3` is whatever last built it. Build both engines
  (`pnpm exec wxt build -b firefox`) and see a control move both before trusting a zero delta.
- A perf red: measure the baseline in the same session, interleaved A-B-A, then ablate the suspect line.
  A re-run of the same build only re-measures the machine.
- Byte deltas from two additions that share a helper: ablating each alone leaves the helper in both arms. Use
  S0..S3 plus one arm that re-measures an unknown another way, so the residual is a check, not an identity.
- Tree-shaking: an unused export whose initializer spreads (`[...ARR]`) is retained; `/*#__PURE__*/ ARR.slice()`
  drops. A dynamic import destructured out of `Promise.all` keeps the whole namespace; name exports in a `.then`.
- CSS inside a template literal (`APP_CSS`, `READER_CSS`) is string content: its comments ship. Rationale goes in
  the doc comment above the literal.
- In a multi-assertion helper, the instrument that found the defect runs first — an earlier cheap check
  swallows its red under ablation. Select by class alone (`.x`, not `button.x`) when the test asserts the tag.
- Vitest reads its environment directive out of any comment, prose included — describe it, never spell the
  token, and assert the environment itself where the test depends on it.
- "Needs no permission": headless Chromium reads a browser consent (e.g. `clipboard-write`) as `prompt` where
  real Chrome grants it. Ablate the consent (CDP `Browser.grantPermissions` with the `browserContextId`), not
  the manifest, and pin the off arm.
- Firefox: a CSS-owning CodeMirror extension (`HighlightStyle`, theme) built per host stops applying from the
  second host on. Build it once per page.
- A local green on text that wraps or is measured (`ch`, px) is not a CI green: a design face installed per-user
  here (Bricolage) is absent on the runner, and Chromium on Linux rounds glyph advances to whole pixels. Force the
  face to its fallback in a probe, or wait for CI, before trusting it (M13 4.8 FIX, 5.0 F5, 5.6 FIX; M13 retro).

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
- **Pushing.** Locally, an agent never pushes; the human pushes. In a cloud session (M13 onward) the agent MAY push
  its OWN working branch — never `main` — so the human can review and merge it through a pull request (which runs
  `ci.yml`). Merging to `main` is always the human's. Never force-push. (`decisions.md`, 2026-10-31 HUMAN RULING.)
- Current milestone: **M13 (`specs/013-first-release/`) in flight — a truthful, on-design first release.** 55 tasks
  (40 at gate 3 + 15 discovered); 51 ticked; open, pending the human's end-of-round review
  (`docs/ai/final-review.md`): the 8.1 walk (last, by HUMAN RULING 2026-11-07), 9.2's sign-off, 9.3's pick, the
  Firefox signed-install test — and 9.5's close figures, re-run after any walk fix. Where tasks stand and what is next: `docs/ai/progress.md`. M12 (Editor Mode) CLOSED 2026-10-30 — `decisions.md`'s "M12 CLOSED", `retro.md`'s "M12
  retro". Spec, plan and tasks status lines stay sealed/"draft" per the M7–M12 precedent.

## Windows/Git-Bash local environment (does not apply to a Linux cloud session)

- Stopping a background browser run (TaskStop) leaves the pnpm/vitest node and Playwright Firefox alive: list
  `node.exe`/`firefox.exe` by command line (`Get-CimInstance Win32_Process` in a `.ps1` run with `-File`), then
  `taskkill //F //T //PID <pnpm node>`. Better: wrap probe runs in `timeout 200 …`.
- A refused loopback connection (`127.0.0.1:PORT` against a `localhost` dev server) takes ~2 s to fail here —
  the "slow leak" the zero-network controls rely on. Re-measure it before relying on it elsewhere.
- The Git Bash tool rejects a heredoc whose body has an unbalanced apostrophe, quoted delimiter or not.
- Local dev runs Node 24; CI pins Node 22 (`.nvmrc`).

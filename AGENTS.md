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

## Workflow (the short version — full: WORKFLOW.md)

- Start every session: read `docs/ai/progress.md`, then the active spec in `specs/`.
- Plans before code for anything non-trivial (C13). Update memory files before ending (C14 budget).
- Current milestone: `specs/001-core-rendering/`.

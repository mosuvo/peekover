# Spec 001 — Extension skeleton + core render pipeline
*Gear 3 (spec+plan+tasks). Owner: mosuvo. Status: ready.*

## Goal
A .md file opened via file:// or a raw URL renders as beautiful, themed, sanitized reading in
<150ms, with a Raw toggle — in Chrome and Firefox dev builds. Nothing else.

## In scope
- WXT project init (TS, MV3), pnpm scripts matching AGENTS.md, CI green on lint+test+build
- Content-script detection: file://*.md|.markdown, text/markdown responses, GitHub/GitLab raw URLs
- Pipeline v1: decode → markdown-it (CommonMark+GFM tables/tasklists/strikethrough/autolink)
  → DOMPurify (strict allowlist) → mount in shadow DOM
- Reader shell v1: paper/ink theme from design/tokens.css, Literata via bundled font, 76ch column,
  document title from first h1, Raw/Reading toggle (the hero demo, for real)
- Failure path: any stage throws → raw text + quiet error banner (never blank)
- Golden tests: 10 fixture docs (GFM torture, huge doc, malicious HTML, broken md) → snapshot HTML

## Out of scope (resist)
TOC, folder mode, settings UI, editor, AI, watch/diff, math/diagrams/code highlighting (002+).
Shiki/KaTeX/Mermaid are explicitly NOT in this milestone despite being in the stack.

## Acceptance
- [ ] `pnpm dev` → open fixture file:// doc → themed render, toggle works, no console errors
- [ ] Same in `pnpm dev:firefox`
- [ ] Malicious fixture (script/onerror/javascript: URLs) renders inert — verified by test
- [ ] 1MB fixture first-paint <150ms (measured, noted in progress.md)
- [ ] `pnpm zip` artifact <2MB (leaves budget for later stages)
- [ ] PERMISSIONS.md lists every manifest entry with a reason

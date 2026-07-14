# Spec 001 — Extension skeleton + core render pipeline
*Gear 3 (spec+plan+tasks). Owner: mosuvo. Status: CLOSED — M1 complete, all acceptance green (2026-07-14).*

## Goal
A .md file opened via file:// or a raw URL renders as beautiful, themed, sanitized reading in
<150ms for a typical document (≤50 KB; large docs get an honest bound — see Acceptance), with a
Raw toggle — in Chrome and Firefox dev builds. Nothing else.

## In scope
- WXT project init (TS, MV3), pnpm scripts matching AGENTS.md, CI green on lint+test+build
- Content-script detection: file:// and GitHub/GitLab raw-host URLs, each requiring a markdown extension (.md|.markdown|…) to render — a raw-host URL without a markdown extension does not render
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
- [x] `pnpm dev` → open fixture file:// doc → themed render, toggle works, no console errors
      (manual-verified both engines, current build, 2026-07-14)
- [x] Same in `pnpm dev:firefox` (manual-verified both engines, current build, 2026-07-14)
- [x] Malicious fixture (script/onerror/javascript: URLs) renders inert — verified by test
      (`tests/browser/sanitize.browser.test.ts` real Chromium+Firefox + `src/render/sanitize.test.ts`;
      66 browser + 160 unit green, 2026-07-14)
- [x] Typical doc (≤50 KB) first-paint: nav→paint median <150 ms (measured — 10 KB ~78–82 ms,
      50 KB ~118–122 ms; `scripts/perf-first-paint.ts --size`, noted in progress.md)
- [x] 1 MB fixture: no raw-text flash (manual-verified, Chrome + Firefox) + reader painted within an
      honest bound <1.7 s (measured median ~1187–1310 ms; <150 ms is unreachable on a 1 MB file:// doc
      in the settled design — browser parse floor + complete-source requirement, see decisions.md
      2026-07-14. Chunked/virtualized render is the M2 lever for this number.)
- [x] `pnpm zip` artifact <2MB (leaves budget for later stages) — Chrome 152.99 kB /
      Firefox 153.04 kB (measured `pnpm zip` / `pnpm zip -b firefox`, 2026-07-14)
- [x] PERMISSIONS.md lists every manifest entry with a reason — cross-checked against the
      generated manifest: 13 `content_scripts.matches` + `run_at:document_start` + `permissions:[]`
      + Firefox gecko keys all justified (`docs/trust/PERMISSIONS.md`, 2026-07-14)

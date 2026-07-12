# Architecture — Peekover
*Updated: 2026-07-11 (pre-code; describes intended M1 shape — update as reality diverges)*

## Extension layout (WXT/MV3)
- `entrypoints/content.ts` — detects raw markdown contexts (file://, text/markdown, raw URLs),
  mounts the reader UI in an isolated container (shadow DOM) over the page.
- `entrypoints/background.ts` — minimal: permission requests, file-watch polling (M2), context menus.
- `entrypoints/options/` & `entrypoints/popup/` — later milestones.

## Render pipeline (src/render/) — pure, testable stages
source → decode (charset) → parse (markdown-it + plugin set) → sanitize (DOMPurify, strict config)
→ enhance (Shiki / KaTeX / Mermaid — lazy, post-paint) → mount (morphdom-style patch for re-renders)

Rules: parse+sanitize are synchronous and fast (<150ms for typical docs); heavy enhancers are
async and progressive; a failure at any stage falls back to raw view (non-negotiable #5).

## Theming
CSS custom properties from design/tokens.css injected at the shadow root. Light/dark/sepia via
`data-theme`. Reader typography: Literata default, user-switchable (9 faces bundled/system).

## State
No external storage in M1 beyond `browser.storage.local` for settings. No cloud, no accounts, ever.

## Known unknowns (revisit at M1 retro)
- file:// access UX differences Chrome vs Firefox (WXT abstractions vs manual)
- Shiki bundle size vs 5MB budget → may need language subsetting + dynamic import
- Mermaid in shadow DOM quirks

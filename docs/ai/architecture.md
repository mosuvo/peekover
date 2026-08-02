# Architecture — Peekover

_Updated: 2026-08-02 — **the § Render pipeline section ONLY** was corrected against shipped code at
spec-007 task 9.3 (gate-2 (c)). **Every other section still carries its 2026-07-11 pre-code framing
("describes intended M1 shape — update as reality diverges") and has NOT been re-verified here** — the
correction was scoped to the drift gate 2 named, deliberately, rather than widened into an unreviewed
whole-file audit._

## Extension layouts (WXT/MV3)

- `entrypoints/content.ts` — detects raw markdown contexts (file://, text/markdown, raw URLs),
  mounts the reader UI in an isolated container (shadow DOM) over the page.
- `entrypoints/background.ts` — minimal: permission requests, file-watch polling (M2), context menus.
- `entrypoints/options/` & `entrypoints/popup/` — later milestones.

## Render pipeline (src/render/) — pure, testable stages

source → decode (charset) → parse (markdown-it + plugin set) → sanitize (DOMPurify, strict config)
→ mount (ONE synchronous `replaceChildren` commit — `mount.ts:210`)
→ **post-mount enhancement** (app page only, after the commit — `diagramEnhancer.ts`, called from
`appShell.ts:139` and `readerPane.ts:185`; the engine arrives through a lazy `import('mermaid')`)

Rules: parse+sanitize are synchronous and fast (<150ms for typical docs); enhancement is async and
runs AFTER the commit, never as a stage the commit waits on; a failure at any stage falls back to raw
view (non-negotiable #5).

**★ CORRECTION OF RECORD** — spec-007 task 9.3, gate-2 (c) (`decisions.md`, the **2026-07-27 · M7 GATE 2**
entry, sub-decision (c)).
This line previously read *"→ enhance (Shiki / KaTeX / Mermaid — lazy, post-paint) → mount (morphdom-style
patch for re-renders)"*, i.e. an **`enhance` stage between sanitize and mount**. Gate 2's wording, applied
verbatim: **"007 group 3 landed the actual post-mount enhancement pattern, and the `architecture.md`
'enhance stage' description was pre-code and never matched code shape."** There is no stage between
sanitize and mount — `mount()` commits in one synchronous `replaceChildren` (`mount.ts:210`), and
enhancement runs after it, on the mounted tree. Two adjacent clauses on the same line are falsified by
gate-2 (c)'s **own cited fact** and are corrected with it rather than left standing beside a corrected
neighbour: **(i)** *"morphdom-style patch for re-renders"* — a re-render takes the same whole-subtree
`replaceChildren` (`mount.ts:210`, and the fallback path at `:313`); no patch/diff commit exists.
**(ii)** *"Shiki / KaTeX"* — **neither is shipped and neither is a dependency.** The five production
dependencies are `markdown-it`, `markdown-it-task-lists`, `dompurify`, `diff`, `mermaid`; KaTeX/math is
on spec §6's IS-NOT fence for M7. **Mermaid is the only enhancer that exists.**

## Theming

CSS custom properties from design/tokens.css injected at the shadow root. Light/dark/sepia via
`data-theme`. Reader typography: Literata default, user-switchable (9 faces bundled/system).

## State

No external storage in M1 beyond `browser.storage.local` for settings. No cloud, no accounts, ever.

## Known unknowns (revisit at M1 retro)

- file:// access UX differences Chrome vs Firefox (WXT abstractions vs manual)
- Shiki bundle size vs 5MB budget → may need language subsetting + dynamic import
- Mermaid in shadow DOM quirks

## Load-bearing weirdness

- Fonts register via the FontFace API, not shadow-tree @font-face. Chromium does not reliably apply @font-face declared inside a shadow root; faces added to document.fonts participate in font matching for shadow trees in both Chrome and Firefox, and don't restyle host-page elements. The reader loads Literata this way (src/theme/fonts.ts). Don't "fix" it back into a shadow @font-face rule. (Dated rationale: decisions.md, 2026-07-14.)

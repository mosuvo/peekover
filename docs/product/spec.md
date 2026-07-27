# Product Specification — Markdown Reader/Editor Browser Extension

### Product name: **Peekover** — _peek over your docs_ (locked July 2026)

**Version:** Draft 2.1 · July 10, 2026 — product named Peekover
**Status:** For build planning
**Research base:** `comp.md` (competitive data verified July 8–9, 2026)

---

## 1. Vision & Goals

**One-line pitch:** The last markdown extension anyone needs to install — every feature from every competitor, plus an editor, plus AI, in the most secure and transparent package in the category. Completely free.

**Business goal (explicit):** This product is NOT a revenue play. It is a **credibility and audience engine**:

- Build reputation and trust in the developer-tools space
- Grow an audience on X, LinkedIn, GitHub through the build and launch
- Create a portfolio flagship that opens doors for future (paid) products

**Product goals that serve that:**

1. Feature superset — objectively checks every box any competitor checks (Section 5)
2. Security leadership — provably the most trustworthy option in the category (Section 6)
3. World-class UI/UX — the extension people screenshot and share (Section 7)
4. Zero infrastructure cost — 100% client-side, no backend, no servers (Section 9)

**Non-goals:** see Out of Scope (Section 12).

---

## 2. Product Principles

1. **Local-first, zero-network by default.** No request leaves the browser unless the user explicitly triggers it (opening a remote URL, calling their own AI key).
2. **Everything is opt-in.** Permissions, origins, AI, network — nothing granted silently. No telemetry, ever.
3. **Open source, auditable, reproducible.** Public repo, tagged releases, reproducible builds, published permission rationale.
4. **Reading first, editing one keystroke away.** The viewer is the product; the editor is a mode, not a separate app.
5. **Fast is a feature.** Instant open, cached diagrams, virtualized long documents.
6. **Free means free.** No paywalls, no "Pro" nags, no funnels, no ads, no data harvesting — this IS the differentiator and the marketing story.
7. **Beautiful by default.** Design quality is a core requirement, not a polish pass (Section 7).

---

## 3. Target Users

| Persona                              | Core job                                             | Killer features for them                                       |
| ------------------------------------ | ---------------------------------------------------- | -------------------------------------------------------------- |
| **AI-tool developer** ("vibe coder") | Read the CLAUDE.md/specs/plans their agents generate | Folder browser, watch mode, diff view, Mermaid/tables          |
| **Developer**                        | Read READMEs/docs locally and on raw Git URLs        | Instant render, GitHub-identical theme, TOC, code highlighting |
| **Technical writer / blogger**       | Draft and polish markdown content                    | Editor mode, visual tables, export, publish, AI rewrite (BYOK) |
| **Student / researcher**             | Read and write notes with math                       | KaTeX/MathJax, print/PDF, presentation mode, read-aloud        |
| **Security-conscious user**          | A viewer that can't betray them                      | Minimal permissions, open source, zero network                 |

---

## 4. Platforms & Compatibility

- **Browsers:** Chrome, Edge, Brave, Opera, Vivaldi (Chromium/MV3) + Firefox (WebExtension). One codebase, per-store builds.
- **Distribution:** Chrome Web Store, Edge Add-ons, Firefox Add-ons (AMO), + GitHub Releases (for auditors/manual install).
- **Website:** static site on **GitHub Pages** — free hosting, custom domain optional, HTTPS included (docs, live demo, comparison pages, security page, blog).
- **File formats (Phase 1):** `.md .mkd .mdx .markdown .mdown .mkdn .mdwn .mdtxt .mdtext .txt(opt-in)`
- **File formats (Phase 2):** `.json .jsonl .yaml .toml .csv` rendered views ("universal raw-file viewer" expansion).

---

## 5. Functional Specification

Legend: ✅ = exists in at least one competitor (superset requirement) · ⭐ = white space, nobody ships it (differentiator)

### F1. Rendering Engine

- ✅ Full CommonMark + GFM: tables, task lists/checkboxes, strikethrough, autolinks
- ✅ Extended syntax: footnotes, abbreviations, super/subscript, definition lists, emoji shortnames (`:smile:` → 😄), highlight/insert marks, comments/annotations
- ✅ GitHub-style alerts/admonitions (`> [!NOTE]`, `[!WARNING]`, etc.)
- ✅ YAML frontmatter — parsed and rendered as a metadata card (toggleable)
- ⭐ **Frontmatter-driven render options** — a doc can declare its own theme, width, TOC state via frontmatter keys
- ✅ MDX-aware rendering (graceful handling of JSX blocks; no execution)
- ✅ Inline HTML rendering — **always sanitized** (Section 6)
- ✅ Smart typography (quotes/dashes) — toggleable
- ✅ One well-tested parser (`markdown-it` + plugins) with exposed option toggles — deliberately NOT seven parsers like simov: one engine, correct by default, options for edge cases
- ✅ Content-Type detection (`text/markdown`, `text/x-markdown`, `text/plain` opt-in)
- ✅ Configurable URL path-matching pattern per origin
- ✅ Character-encoding override per origin (simov parity)
- ⭐ **Wiki-links** `[[like-this]]` resolve within the opened folder + **backlinks panel** ("what links here") — Obsidian-lite reading, no vault required

### F2. Math & Diagrams

- ✅ KaTeX (default, fast) with MathJax fallback toggle for full LaTeX coverage
- ✅ Inline `$...$` and block `$$...$$` + code-fence math
- ⭐ Right-click any formula → copy as LaTeX / copy as MathML
- ✅ Mermaid: flowcharts, sequence, class, state, ER, Gantt, pie, git graphs — theme auto-syncs with light/dark mode
- ✅ Additional engines (post-v1 stretch): Graphviz DOT (WASM viz.js), Vega/Vega-Lite charts. PlantUML only if a fully client-side path exists — **no silent remote rendering, ever**
- ✅ Diagram → PNG/SVG copy & download per diagram
- ✅ **Smart diagram cache** — hash-keyed, only re-render changed diagrams; <1s reopen on 50-diagram docs; user-visible cache controls (size cap, one-click clear) — docu.md parity
- ✅ **Standalone diagram-file rendering**: open `.mermaid` / `.dot` (+ `.drawio`, `.vega` later) files directly as rendered diagrams — docu.md parity
- ✅ No artificial file-size limit — progressive loading: text paints instantly, diagrams render in the background
- ✅ Diagram zoom/pan lightbox
- ⭐ **Auto dark-mode media adaptation** — diagrams re-themed and images optionally dimmed/inverted intelligently in dark mode

### F3. Code Blocks

- ✅ Syntax highlighting, 190+ languages (Shiki) — beats MarkView's 180+
- ✅ Multiple code themes (≥14), independent of document theme
- ✅ One-click copy button, line numbers (toggle), line highlighting, word wrap toggle
- ✅ Language auto-detection for unlabeled fences (local model, as mdedit.ai does)
- ⭐ Collapsible long code blocks with preview + per-block "open raw" view

### F4. File Sources & Handling

- ✅ Local `file://` rendering (with permission)
- ✅ Remote `http(s)://` markdown URLs
- ✅ **Granular per-origin permissions**: allowlist specific sites, wildcards, subdomains — simov parity with a friendlier UI
- ✅ GitHub / GitLab / Bitbucket raw-file rendering + "open on GitHub" links
- ✅ Drag-and-drop a file onto any tab → render
- ✅ Paste-and-render scratchpad (popup / new-tab page, no setup needed)
- ✅ Render selected markdown text on any page (context menu, opt-in permission)
- ✅ "Local-only mode" master switch — disables all web-page integration entirely
- ⭐ **Web page → Markdown clipper** (context menu: "Copy page/selection as Markdown") — clean markdown for notes or AI agents; fully client-side (Readability + Turndown)
- ⭐ **Copy for AI**: one click copies the doc (or a section) as clean, normalized markdown sized for LLM context windows

### F5. Navigation & Reading UX

- ✅ Auto-generated TOC sidebar: scroll-spy, smooth scroll, collapsible levels, resizable, keyboard toggle
- ✅ **Folder browser sidebar** (File System Access API): open a folder, tree view, name search & filter
- ⭐ **Project mode / local docs site**: relative links between files resolve and navigate in place; breadcrumbs; back/forward history
- ⭐ **Cross-file full-text search** across the opened folder (client-side index)
- ⭐ **In-document search** with heading-context results (better than Ctrl+F: shows which section each hit is in)
- ⭐ **Broken-link checker**: scan the opened folder, list dead relative links and missing images (docs QA in one click)
- ✅ Recent documents & pinned files/folders
- ✅ Scroll-position memory per file
- ✅ Reading progress bar, word count, reading time
- ✅ External-link preview cards (hover metadata) — opt-in (requires network)
- ✅ Image lightbox: full-screen, gallery prev/next, lazy loading, zoom/pan
- ✅ Page zoom 50–400% with shortcuts; 3 content widths (narrow/normal/full)
- ⭐ **Heading permalinks + deep links**: copy a link to any heading; text-fragment links that highlight the exact passage
- ⭐ Footnote & wiki-link **hover preview cards** (peek without jumping)
- ⭐ **Interactive task checkboxes**: click a checkbox in reading view → writes the change back to the file (with write permission; visual-only mode otherwise)
- ⭐ **Table tools in reading view**: click-to-sort columns, quick filter, copy table as CSV/JSON/Markdown
- ✅ **Presentation mode**: `---` = slide breaks, fullscreen, keyboard nav, auto-play
- ⭐ Presentation **export as standalone HTML slide deck** (share the deck as one file)
- ⭐ **Read-aloud (TTS)** via the browser's built-in Web Speech API — sentence highlighting, speed control, zero cost, no network
- ✅ Raw ↔ rendered toggle (keyboard shortcut)
- ✅ Print-optimized mode (chrome hidden, page breaks respected)
- ⭐ Focus/reading mode (typographic reading column) + document **mini-map** for long docs

### F6. Live Updating & AI-Workflow Mode ⭐ (headline differentiators)

- ✅ Auto-reload on file change (configurable interval)
- ⭐ **Watch mode**: follow a file as an AI agent writes it — auto-scroll to newest content, subtle "updated" pulse
- ⭐ **Diff view**: inline or side-by-side diff of current vs. any earlier snapshot (IndexedDB history) — "see what the agent changed"
- ⭐ **Compare any two files** in the folder (spec v1 vs v2)
- ⭐ **Agent-file awareness**: recognized filenames (CLAUDE.md, AGENTS.md, .cursorrules, spec/plan conventions) get a badge + tuned rendering defaults
- ⭐ Session-transcript rendering: chat-style bubbles for markdown transcripts — toggle
- ⭐ (Exploration, post-v1) **Local MCP bridge**: optionally expose the currently open document to local AI agents via Model Context Protocol — read/write with explicit user consent per session

### F7. Theming & Appearance

- ✅ Light/dark/auto (system) + GitHub-identical light & dark themes
- ✅ ≥30 built-in document themes (simov parity), each contrast-checked
- ✅ Custom CSS: global, per-origin, per-document
- ✅ 9+ font choices + custom font stack, size, line height, paragraph spacing; dyslexia-friendly font option
- ✅ Per-file/per-folder theme overrides
- ✅ Settings export/import (JSON) + browser `storage.sync` across devices (free, no backend)

### F8. Editor Mode (reader-first, editor one keystroke away)

- ✅ Toggle: Read ↔ Edit (split pane with scroll sync); inline WYSIWYG-ish editing later
- ✅ **Visual table editor**: create/edit tables via UI; CSV paste/import → markdown table
- ✅ Formatting toolbar + full keyboard shortcuts; smart lists/continuation
- ✅ Find & replace with regex
- ✅ Markdown linting & auto-format (markdownlint rules)
- ✅ Text transforms: heading case conversion, list ↔ checklist, quote, code-fence wrap
- ✅ Image paste → embedded Base64 or saved alongside the file (user choice)
- ✅ Snippets + emoji picker
- ✅ Import: `.html → md`, `.ipynb → md` (client-side converters), plain text
- ✅ Local drafts with autosave + **version snapshots** (IndexedDB); restore or diff any snapshot
- ✅ Document metrics panel (words, chars, headings, links, images)
- Note: in-place saving of local files uses FS Access API write permission (Chromium). Firefox: edit + "Save As" download fallback.

### F9. Export & Publishing (all client-side)

- ✅ **HTML export**: standalone single file, CSS inlined, images Base64-embedded (≥20MB docs)
- ✅ **DOCX export** (docx lib): diagrams → embedded images; math → OMML editable equations (stretch; image fallback) — docu.md parity
- ✅ **PDF export**: print-pipeline with tuned print CSS (page numbers, headers/footers)
- ✅ Copy as: rich text (pastes cleanly into Google Docs/Word), HTML, plain text
- ✅ Publish with the **user's own tokens** (stored locally, direct API calls): GitHub Gist, GitHub repo, Medium, Dev.to (mdedit.ai parity)
- ✅ ZIP export: markdown + local copies of remote images, paths rewritten
- ✅ Export shortcut (Ctrl/Cmd+S → last-used format) with progress indicator for heavy documents

### F10. AI Features (zero infra cost by design)

Two engines, both free to the developer:

1. **On-device AI (default):** Chrome's built-in AI task APIs (Gemini Nano — Summarizer, Translator, Language Detector, Proofreader, Writer/Rewriter where available). No key, no cost, offline, private. Feature-detected; hidden gracefully when unavailable.
2. **BYOK (Bring Your Own Key):** user pastes their own API key (Anthropic, OpenAI, Google, OpenRouter, or any OpenAI-compatible endpoint incl. local Ollama/LM Studio). Key stored locally (WebCrypto-encrypted), calls go directly browser → provider. **We never proxy, never see keys or content.**

Capabilities (each one = a shareable demo):

- ⭐ Summarize document / section (collapsible TL;DR card)
- ⭐ Explain selection ("explain this code / concept") in a side panel
- ⭐ Chat with the document (doc as context)
- ⭐ Rewrite/improve selection with **inline diff preview — accept/reject line by line** (mdedit.ai's best pattern)
- ⭐ Translate document/selection (on-device Translator API first)
- ⭐ Generate: outline from content, table from description, Mermaid diagram from description, alt-text for images
- ⭐ Proofread via on-device Proofreader API
- ⭐ AI-assisted web-clip: page → clean structured markdown
- Guardrails: AI is 100% opt-in behind a one-time explainer ("what leaves your machine and when"); per-action network indicator; no AI call ever happens implicitly.

### F11. Setup, Onboarding & Help

- ✅ Auto-opening interactive setup guide on install; **detects** whether "Allow access to file URLs" is granted and deep-links to the exact toggle — best-in-class answer to the category's #1 friction
- ✅ Zero-config: works on remote `.md` URLs immediately, before any permission
- ✅ Demo document showcasing every feature (doubles as test fixture and marketing screenshot)
- ✅ Command palette (Ctrl/Cmd+K): every action searchable
- ✅ Full keyboard shortcut map (customizable) + cheat-sheet overlay (`?`)
- ✅ Extension-conflict detection: warns if another markdown viewer is active, links to a resolution guide

### F12. Internationalization & Accessibility

- ✅ UI localization: launch EN + ZH + JA + ES + DE + FR + PT + KO; community translations via repo (target ≥27 to beat docu.md over time)
- ✅ RTL document support
- ⭐ WCAG 2.1 AA: full keyboard operability, screen-reader landmarks, contrast-checked themes, reduced-motion support — nobody in the category claims accessibility; cheap to win, meaningful to announce

---

## 6. Security & Privacy Specification (the trust story)

Target: the most verifiably trustworthy extension in the category. "Perfect" in security means every claim is **published, testable, and auditable** — and the architecture removes entire classes of risk instead of mitigating them. Every item below becomes a public claim on the website's `/security` page.

**Architecture (risk removed, not mitigated):**

1. **No server.** There is no backend to breach, no database to leak, no account system to phish. The entire attack surface is the client.
2. **Zero network by default.** The extension itself makes no requests. The only possible outbound calls are: (a) a remote file the user navigated to, (b) AI calls the user configured and triggered, (c) publishing actions the user triggered. A visible network indicator fires on every outbound call.
3. **No telemetry, no analytics, no error beacons — permanently.** Diagnostics are local-only with a "copy debug report" button for GitHub issues.
4. **No remote code, ever.** MV3 enforces it; we additionally ban dynamic imports of anything not in the signed package, verified in CI.

**Extension hardening:** 5. **Manifest V3**, service-worker based; no persistent background page. 6. **Minimal permissions:** no `<all_urls>`, no `webRequest`, activeTab-first. Host access is optional, per-origin, requested at moment of use with a plain-language reason. A published `PERMISSIONS.md` justifies every manifest line. 7. **Permission-diff policy:** an update will never silently add permissions; any permission change ships with a changelog entry and an in-product notice. 8. **Sanitization:** all rendered HTML through DOMPurify with a strict allowlist; SVG sanitized; strict extension CSP (no inline script, no eval); embedded content sandboxed; option to block remote images entirely.

**Supply chain & release integrity:** 9. **Locked, minimal dependencies**; `npm audit` + OSV scanning in CI; no install scripts; Dependabot; SBOM published per release. 10. **Reproducible builds:** documented build produces byte-comparable output to the store artifact; release hashes published; signed tags + GitHub artifact attestations (provenance). 11. **Publisher account security:** store accounts protected with passkeys/2FA and a documented recovery plan (extension hijacks usually start at the account).

**Governance & transparency:** 12. **Open source (MIT or Apache-2.0)** — full source including build scripts. (Direct contrast with md-reader 3.x, whose current source isn't public, and with the JSON Formatter incident.) 13. **Threat model document** published in the repo (what we defend against, what's out of scope) — the mark of a serious project. 14. **`SECURITY.md`** with a private disclosure channel, response-time commitment, and a public hall-of-fame for reporters (zero-budget bug bounty). 15. **Community audit invitation** at launch; third-party extension-scanner reports (e.g., store-analysis services) linked from the security page. 16. **Ownership pledge:** public commitment in README + site — never sold, never ads/affiliate injection, never data collection; any ownership transfer voids trust in the listing and users are told to expect releases only from this repo. This directly weaponizes the category's biggest fear. 17. **Data locality:** settings **and** drafts/snapshots in the extension's own IndexedDB (local to the device), AI keys WebCrypto-encrypted at rest; one-click "wipe all data." *(Corrected 2026-07-27: this item previously read "settings in `storage.sync` (browser-encrypted)", which was never what shipped. Settings have lived in the local `peekover` IndexedDB since spec 004 — a deliberate gate-1 direction taken to keep `permissions: []` rather than spend the `storage` permission on a settings feature; the content-script reader reaches them by messaging the background. `storage.sync` and the cross-device sync it enables stay DEFERRED — see `docs/ai/decisions.md` 2026-07-17, which also names §9 and F7 as carrying the same deferral. Revisit-when: cross-device sync is wanted, at which point the `storage` permission, PERMISSIONS.md and the manifest pin move together as an AGENTS.md #4 event.)*

---

## 7. UI/UX Specification ("out of this world")

Design quality is a launch requirement. The bar: screenshots that make people install, interactions that make people post.

**Design principles:**

1. **A real visual identity, not a template.** Distinctive typography-first design system: a characterful reading serif/sans pairing, deliberate type scale, generous whitespace. Must not look like default Tailwind/Bootstrap or a GitHub clone (except the intentional GitHub-identical themes).
2. **The document is the hero.** Chrome (sidebars, toolbars) stays quiet — low-contrast, collapsible, auto-hiding on scroll; zero visual noise in reading mode.
3. **Motion with meaning.** Micro-interactions everywhere they inform: TOC scroll-spy glide, checkbox spring, diagram lightbox zoom, watch-mode pulse, theme cross-fade. 150–250ms, eased, `prefers-reduced-motion` respected. Never decorative-only.
4. **Instant feel.** Skeleton-free: first paint of real content <150ms; progressive enhancement for heavy blocks (diagrams shimmer in place).
5. **Keyboard-first power, mouse-friendly surface.** Command palette as the spine; every action reachable both ways; shortcut hints on hover.
6. **Dark mode as a first-class art piece,** not inverted colors: tuned syntax palettes, re-themed diagrams, adapted images (F2).
7. **Empty states and errors are designed moments** — the onboarding flow, the "no permission yet" screen, and the render-failure fallback all get full design treatment (these are the screens people screenshot when things go wrong; make even those good).
8. **Details users feel:** custom-designed scrollbars, selection color, focus rings, favicon per state, subtle texture in themes, print output that looks typeset.

**Process requirements:**

- Design tokens defined before build (color, type, spacing, motion) → consistent everywhere including the website
- Every feature ships with its designed state, not "functional now, pretty later"
- The demo document doubles as the visual QA page
- Website and extension share the same design language (the site IS a demo of the product's taste)

---

## 8. Non-Functional Requirements

Kept deliberately short — each one exists because a competitor visibly fails at it or because it protects the product's reputation (which is the whole point of the project).

| Requirement                   | Target                                                           | Why it matters                                                                   |
| ----------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| First render (typical README) | < 150 ms                                                         | "Instant" is the first impression and the review quote                           |
| Large docs                    | 10 MB / 50k lines stays smooth (virtualized rendering)           | AI agents produce huge files; competitors choke                                  |
| Diagram-heavy docs            | 50 Mermaid diagrams: first open ≤ 5 s, cached reopen < 1 s       | Matches docu.md's benchmark, the only published perf bar in the category         |
| Package size                  | ≤ 5 MiB base; heavy engines lazy-loaded as local chunks          | md-reader ships 11.4 MiB; size is a store-listing trust signal                   |
| Reliability                   | Render failure degrades to raw view — never a blank page         | Blank pages are the #1 source of 1-star reviews in this category                 |
| Quality gate                  | E2E suite over the demo doc + golden-image rendering tests in CI | A free-time project stays shippable only if regressions are caught automatically |

---

## 9. Zero-Cost Infrastructure Plan

| Need                                   | Solution                                                  | Cost                                       |
| -------------------------------------- | --------------------------------------------------------- | ------------------------------------------ |
| Code hosting, issues, CI               | GitHub + GitHub Actions (free for public repos)           | $0                                         |
| Website + docs + blog                  | **GitHub Pages** (static, HTTPS, custom domain supported) | $0                                         |
| Extension hosting/updates              | Chrome Web Store / Edge Add-ons / Firefox AMO             | $5 one-time (Chrome); Edge & Firefox free  |
| Settings sync                          | Browser `storage.sync`                                    | $0                                         |
| Drafts/versions                        | IndexedDB (local)                                         | $0                                         |
| AI                                     | On-device Chrome AI + BYOK direct calls                   | $0 to us                                   |
| Diagram/math/export rendering          | All client-side (WASM/JS)                                 | $0                                         |
| Publishing (Gist/GitHub/Medium/Dev.to) | User's own tokens, direct API calls                       | $0                                         |
| Demo video                             | YouTube                                                   | $0                                         |
| Custom domain (optional)               | e.g. a `.dev` domain                                      | ~$10–15/yr (optional; `*.github.io` works) |

**Architecture rule that guarantees $0:** there is no server. Nothing to scale, secure, or pay for — and it doubles as the privacy story (Section 6, item 1).

---

## 10. Tech Stack (verified July 2026)

Every choice below was re-checked against current comparisons. Rule: boring, battle-tested, client-side, actively maintained.

| Layer               | Choice                                                                                                        | Why (verified)                                                                                                                                                                                                                                          |
| ------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Extension framework | **WXT** + TypeScript                                                                                          | The 2026 consensus default: actively maintained, Vite-based, first-class cross-browser builds (Chrome/Firefox/Edge/Safari) from one codebase, proven in 1M+-user production extensions. Plasmo is widely reported to be in maintenance mode — rejected. |
| UI (reader view)    | **None — vanilla TS + CSS custom properties**                                                                 | Smallest runtime → smallest package (NFR); the reader is the hot path and ships zero framework. A tiny framework (e.g. Preact) may be used only for heavier surfaces like the options page if ever needed.                                              |
| Markdown            | **markdown-it** + plugin ecosystem (footnote, deflist, abbr, emoji, task-lists, anchor, front-matter, alerts) | The most battle-tested extensible JS parser; every needed syntax exists as a maintained plugin                                                                                                                                                          |
| Sanitization        | **DOMPurify**                                                                                                 | Industry standard; core to the security claims                                                                                                                                                                                                          |
| Highlighting        | **Shiki** (lazy-loaded)                                                                                       | VS Code-grade accuracy, 190+ langs; heavier than highlight.js, so it loads as a local async chunk — accuracy is worth it                                                                                                                                |
| Math                | **KaTeX** (+ optional MathJax lazy chunk)                                                                     | KaTeX = speed; MathJax toggle = full LaTeX coverage parity                                                                                                                                                                                              |
| Diagrams            | **Mermaid**; viz.js (WASM) later                                                                              | Category table stakes; all client-side                                                                                                                                                                                                                  |
| Editor              | **CodeMirror 6**                                                                                              | The modern standard for in-browser code/markdown editing; modular = small                                                                                                                                                                               |
| Diff                | `diff` + custom renderer                                                                                      | Powers snapshots, watch mode, compare-files                                                                                                                                                                                                             |
| Search              | **MiniSearch**                                                                                                | Tiny client-side full-text index for cross-file search                                                                                                                                                                                                  |
| Clipper/import      | Readability + **Turndown**; custom ipynb→md                                                                   | Proven page→markdown pipeline, fully local                                                                                                                                                                                                              |
| Export              | **docx** (js), JSZip, print pipeline                                                                          | Client-side DOCX/ZIP/PDF with zero services                                                                                                                                                                                                             |
| Tests               | **Vitest** + **Playwright** (loads built extension)                                                           | CI-friendly; Playwright can drive real extension builds                                                                                                                                                                                                 |

All libraries are permissively licensed and bundled locally — no CDN loading at runtime (security requirement, Section 6 item 4).

---

## 11. Roadmap

### Phase 1 — The Complete Product (v1.0: everything in Section 5, F1–F12)

One release train: full reader, folder/project mode, watch + diff, presentation, editor, exports, publishing, AI (on-device + BYOK), onboarding, i18n launch set, accessibility, full security architecture (Section 6), full design system (Section 7).

Suggested internal build order (sequencing only — it all ships as the journey to v1.0):

1. Core rendering + themes + TOC + onboarding + security foundations (items 1–8) — the skeleton everything hangs on
2. Folder browser, project mode, cross-file search, watch mode, diff/snapshots
3. Reading superpowers: presentation, lightbox, tables, checkboxes, permalinks, TTS, mini-map
4. Editor mode + exports + publishing
5. AI layer (on-device first, then BYOK) + web clipper
6. Polish pass: i18n, accessibility audit, perf targets, golden-image tests, security page + reproducible builds
7. Store submissions (Chrome, Edge, Firefox) + website

### Phase 2 — Universal Raw-File Viewer

`.json .jsonl .yaml .toml .csv` rendered views: tree/table/graph views for JSON, table view with sort/filter for CSV, first-class JSONL (AI logs) — extending the trust story to "one trusted viewer for every raw file."

---

## 12. Distribution & Growth Plan

**Coming later — will be planned in detail after the build.** (Headline kept as a placeholder; the product ships first, the growth playbook gets its own document when v1.0 is close.)

---

## 13. Out of Scope (unchanged)

Accounts/login · cloud storage/sync backend · real-time multiplayer editing · hosted AI (we pay) · mobile/desktop apps · WYSIWYG-only mode · paid tiers · ads/sponsorships/affiliates (permanently).

---

## Appendix: Competitor Feature Parity Checklist

Source: Appendix B of `comp.md`. Every ✅ item in Section 5 maps to at least one of: md-reader, Markdown Viewer (simov), Markdown Preview Plus, docu.md, MarkView, Local Markdown Viewer, Markdown Viewer Simple & Secure, mdedit.ai (viewer + editor + AI feature sets). Every ⭐ item was verified absent from all of them as of July 9, 2026.

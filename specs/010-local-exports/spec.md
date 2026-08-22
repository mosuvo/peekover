# Spec 010 — Local exports: HTML/DOCX/PDF/copy/ZIP export + print mode

**Status:** draft (Gear-3 gate 1 — awaiting human approval before `plan.md`)
**Scope:** **010 delivers M10 — the LOCAL half of F9 (Export & Publishing), plus the one F5 item it depends on.** Nine F9 items that produce a file, a clipboard payload, or a print job entirely on-device — HTML export, DOCX export, PDF export, copy as rich text/HTML/plain text, ZIP export, the export shortcut, and a progress indicator for heavy documents — plus F5's print-optimized mode, which `spec-coverage.md` already names as PDF export's own blocker. F9's other four items — publish to GitHub Gist, GitHub repo, Medium, Dev.to — are **deferred to M11 on a routing decision, not a spec-level cut**: they are the product's first deliberate, user-token-bearing outbound network path, and `docs/product/spec.md` §6 principle 2 draws a bright line around that class of call. This spec does not re-argue that routing; it inherits it and states the boundary precisely (§3.2, §6).
**Date:** 2026-08-22
**Milestone:** M10 · builds on 009 (Code blocks: Shiki syntax highlighting + code themes + per-block toolbar + collapsible blocks — CLOSED 2026-08-22 at task 9.3)
**Structure:** follows WORKFLOW.md §5.3 (`spec.md` = the WHAT, no tech). Mirrors 009's section shape, which mirrors 008's and 007's — §3 decided calls, §4 EARS, §6 the IS-NOT fence, §7 plan-stage risks, §8 gate-3 measure-then-choose, §9 gate-1 questions.
**Evidence base:** **no fresh scope-read of `src/` was run for this draft** — unlike 008, whose kickoff asked for one, this session's kickoff scoped M10 directly from `docs/product/spec.md` §5 (F9, F5) and `docs/ai/spec-coverage.md`'s existing F9/F5 audit rows, both quoted verbatim below rather than paraphrased. One targeted read of `src/render/mediaPolicy.ts` was made while drafting §9-3 (below), because a scope question turned on whether user-triggered remote-media fetching already exists in the tree; that citation is a spot check, not a systematic pass. **Every `file:line` cited here must be re-derived by `plan.md` against the actual tree at its own HEAD** — 006 through 009 all make the same demand for the same reason, and this draft has done even less first-hand code reading than 009's did.

---

## 1. Problem & value

`spec-coverage.md` calls it plainly: *"F9 (Export & Publishing) is now the only section at a flat 0%."* Nine milestones have shipped a reader that renders agent output beautifully, watches it live, diffs it against history, and now highlights its code — and none of that work can leave the browser tab in a form anyone else can open. A developer who has just watched an agent write a spec, diffed it against yesterday's version, and read it with syntax-highlighted code blocks still has to select-all, hope the paste survives, or screenshot the page to hand it to someone who does not have Peekover installed.

That is the gap this milestone closes, for the half of F9 that costs nothing in trust: nothing here needs a network call to work, a server to exist, or a permission beyond what the browser already grants a page that generates its own downloads. **Who it serves:** primarily the AI-tool developer (product spec §3) at the natural last step of the workflow the last five milestones built — read, watch, diff, highlight, and now *ship the result somewhere else*. Secondarily every persona, because a document that renders beautifully and cannot leave the tab is an unfinished promise regardless of who is reading it.

**What the product promises** (`docs/product/spec.md` §5, quoted so scope matches the promise, not a paraphrase of it):

- F9: *"**HTML export**: standalone single file, CSS inlined, images Base64-embedded (≥20MB docs)"*
- F9: *"**DOCX export** (docx lib): diagrams → embedded images; math → OMML editable equations (stretch; image fallback) — docu.md parity"*
- F9: *"**PDF export**: print-pipeline with tuned print CSS (page numbers, headers/footers)"*
- F9: *"Copy as: rich text (pastes cleanly into Google Docs/Word), HTML, plain text"*
- F9: *"ZIP export: markdown + local copies of remote images, paths rewritten"*
- F9: *"Export shortcut (Ctrl/Cmd+S → last-used format) with progress indicator for heavy documents"*
- F5: *"Print-optimized mode (chrome hidden, page breaks respected)"*

Not quoted, and explicitly not this milestone's (§3.2, §6): *"Publish with the user's own tokens (stored locally, direct API calls): GitHub Gist, GitHub repo, Medium, Dev.to (mdedit.ai parity)."*

## 2. User stories

- As a developer who just reviewed an agent-written spec, I want to **export it as a standalone HTML file**, so I can hand it to a teammate who does not have this extension.
- As someone who needs to paste a document into a Word-based review process, I want a **DOCX export** that keeps the document's structure, so I am not manually reformatting headings and lists.
- As a reader who wants a document on paper or as a shareable PDF, I want a **print-tuned layout** — no reader chrome, sensible page breaks — so the printed or PDF'd result looks like a document, not a screenshot of an app.
- As someone quoting a paragraph elsewhere, I want to **copy as rich text** and have it paste cleanly into Google Docs or Word, without carrying the reader's own styling along with it.
- As a developer who wants the raw text, I want **copy as plain text** to give me exactly the source, nothing rendered.
- As someone archiving a folder my agent wrote, I want a **ZIP export** that keeps the document readable offline, with images that still resolve.
- As a keyboard-first user, I want **Ctrl/Cmd+S to export**, using whatever format I last used, without a menu every time.
- As someone exporting a very large document, I want to **see that it is working**, not wonder if the tab has frozen.
- As a security-conscious user, I want every one of these to **produce nothing over the network** unless I am told exactly when one does and why (§9-3), and to see that claim hold rather than take it on faith.

## 3. Key scope decisions (decided at this gate — redline as needed)

**3.1 Milestone scope — the nine local F9 items plus F5's print mode. The four publish items are OUT, on a routing decision inherited from the human, not re-litigated here.**

IN: HTML export, DOCX export, PDF export, copy as rich text/HTML/plain text, ZIP export, the export shortcut with last-used-format memory, a progress indicator for heavy exports, and F5's print-optimized mode as PDF export's named prerequisite (`spec-coverage.md`:321,402 — *"Blocks F9's PDF export, which is spec'd as a print-pipeline"*). OUT, each with a home in §6: the four publish paths (§3.2); every other F5/F9 item not named above; every other F-area.

**Ten items, not nine, in the sense that matters for sizing.** The kickoff's own count (9 F9 + 1 F5) is right, but two of the nine are one product-spec bullet each carrying two deliverables (*"Copy as: rich text, HTML, plain text"* is three controls under one bullet; *"Export shortcut… with progress indicator"* is two mechanisms under one bullet). §4 and §8 treat each control separately because each has its own acceptance criteria and, for the copy actions, a different clipboard mechanism (§7-2).

**3.2 010 SHIPS TO THE APP-PAGE READER ONLY. The content-script `file://` / raw-host reader gets no export affordance — DECIDED, and named so it is not silently reversed.**

This is 007 §3.2's and 009 §3.8's own reasoning, applied to a different kind of heavy dependency:

- **`docx` and a ZIP-writer (likely `jszip`, per `spec-coverage.md`:546) are both new lazy-loaded engines**, on the same shape 007 §3.2 and 009 §3.2 already established: a content script cannot load a separate packaged chunk without `web_accessible_resources`, which `tests/manifest.test.ts` forbids outright. Folding either engine into the content-script bundle puts export-library weight on the gated first-paint path of every `file://` document, exports or not.
- **The export surface benefits from being one place.** Ctrl/Cmd+S needs one `last-used format`, one progress affordance, and one set of controls; splitting that across two surfaces (one with the full nine controls, one with a content-script-safe subset) multiplies the chrome for a feature whose whole point is a single, predictable action. 008 §3.7 shipped table tools to both surfaces *because* the reasons that fence other features to the app page (storage, engine bytes) genuinely did not apply to table tools. Here they do apply, to every export path that touches `docx`, a ZIP writer, or the print pipeline — which is all nine controls, including the three copy actions, once the last-used-format shortcut and the shared "what am I exporting" plumbing are accounted for as one feature rather than nine independent ones.
- **The persona argument does not force the opposite conclusion the way it did for table tools or diagrams.** The `file://` reader already renders the document correctly; a user who wants to export it can open the same folder on the app page, which is the surface persona #1's whole workflow (folder → watch → diff → highlight) already lives on.

**A named deferral, not a silence.** No export affordance and no explanatory note ship on the content-script reader in M10 — the same shape 007 and 009 shipped for their own app-page-only features.

*Rejected:* splitting the three dependency-free copy actions (rich text/HTML/plain text) onto both surfaces, on the 008 §3.7 shape — considered, and declined, because the export shortcut (§3.7 below) treats all nine controls as one feature with one last-used-format memory, and a partial content-script presence would need its own, different last-used-format story with no shared shortcut host to hang it from. Revisit if a future milestone wants the content-script surface's export story specifically (§6).

**3.3 THE EXPORT PIPELINE SHARES ONE SERIALIZATION PATH ACROSS FOUR OF THE NINE CONTROLS — DECIDED AT SPEC LEVEL, THE SHAPE (not the code) IS `plan.md`'s TO CONFIRM.**

- **HTML export and Copy-as-HTML produce the same artifact at two different exits.** Both are "the rendered document as a standalone HTML string, styling inlined" — one written to a file, one written to the clipboard. The product spec's own HTML-export bullet (*"CSS inlined, images Base64-embedded"*) is the harder of the two problems; Copy-as-HTML is that same serializer with a clipboard sink instead of a download sink.
- **ZIP export reuses HTML export's image-handling half, not its CSS-inlining half.** ZIP export ships the *markdown source* plus image files, paths rewritten — it does not need CSS inlining at all, but it needs the same "which images does this document reference, and where do their bytes come from" resolution HTML export needs for Base64-embedding. §9-3 below is exactly this resolution's open question for *remote* images.
- **PDF export depends on F5's print mode as a genuine prerequisite, not a soft one.** `spec-coverage.md` (:321, :402) states this as a fact about the current tree — zero `@media print` rules exist — and the product spec's own PDF bullet is *"print-pipeline with tuned print CSS."* §3.8 below decides what that pipeline is.
- **DOCX export shares nothing with the other three.** It is a distinct serializer (markdown/DOM → OOXML) with its own library and its own open question (§9-1).

**3.4 THE BYTE BUDGET — THE FRAMING IS DECIDED HERE; THE NUMBER IS NOT, and the margin is materially thinner than it has been at any prior gate-1.**

009's own close left `.output` at **4,866,741 / 4,866,857 B** against the ≤5 MiB (AGENTS.md) bound — **~367 KiB headroom, ~7% free** — and `pnpm zip` at **1,470,730 / 1,470,788 B** against the <2 MB bound — **~612 KiB headroom**. Both numbers are `progress.md`'s own §8.1/9.3 close figures, re-derived at a clean build, not carried from an earlier reading. Two new production dependencies are anticipated — `docx` and a ZIP writer — against **6** dependencies shipped today (`diff`, `dompurify`, `markdown-it`, `markdown-it-task-lists`, `mermaid`, `shiki`).

**What is decided here:** every byte is measured and accounted, ablation-proven rather than grep-proven — the standing lesson 007/008/009 all restate, and the one 009's own task 4.2 re-learned the hard way when a barrel import of Shiki's full language/theme catalog blew the budget to 13.6 MB before being caught by measurement and reverted. **What is not decided here:** whether `docx` and the ZIP writer fit inside the current headroom at all, whether either needs a subset/lazy-split strategy the way 007's D-10(b) narrowed `mermaid/package.json`, and what PDF export's own cost is if `window.print()` is not sufficient (§3.8). **This is `plan.md`'s first measurement, before either dependency is installed for real** — the 009 precedent (build with the naive import, measure, revert if it blows the budget, then choose the narrow route) is the one to repeat, not skip.

**3.5 DOCX EXPORT'S MATH AND DIAGRAM HANDLING — SCOPED BY WHAT EXISTS, RULED BY GATE 1 (§9-1). Not decided here.**

The product spec's own DOCX bullet already answers half of this: *"diagrams → embedded images; math → OMML editable equations (stretch; image fallback)."* Read against the current tree:

- **Diagrams are feasible today, on the existing mechanism.** 007 shipped copy-as-image for rendered Mermaid diagrams via `canvas.toBlob` (`diagramView.ts`, per this kickoff's own citation, `:298`); DOCX export embedding a diagram as a raster image reuses exactly that capture, not a new rendering path.
- **Math is not feasible at all, because it does not exist.** F2's math half is 0% shipped (`spec-coverage.md`) — no KaTeX, no MathJax, nothing that produces a math render to convert into OMML *or* an image. The product spec's own parenthetical, *"(stretch; image fallback)"*, already concedes OMML is optional — but even the fallback needs a rendered image of the equation to embed, and there is no equation renderer in the tree to produce one.
- **So the real question is narrower than "does DOCX math ship": it is whether DOCX export in M10 (a) omits math entirely, rendering an unlabeled equation source line or a plain-text fallback of the LaTeX/math source, or (b) is blocked on F2 math shipping first.** This spec does not choose between them — §9-1 states both options with their costs and routes the choice to gate 1.

**3.6 PDF EXPORT IS THE BROWSER'S NATIVE PRINT-TO-PDF, DRIVEN THROUGH F5's PRINT MODE — DECIDED, and it is why this milestone adds no PDF-generation dependency.**

The product spec's own words — *"print-pipeline with tuned print CSS (page numbers, headers/footers)"* — describe `window.print()` against a stylesheet, not a JavaScript PDF-generation library. This is stated as a decision because it has a real consequence for §3.4's budget: **PDF export costs zero new dependencies**, provided the print CSS can express page numbers and headers/footers well enough. That is genuinely uncertain — CSS's `@page` margin boxes (`@top-center`, `@bottom-right`, etc.) are the standard mechanism for running headers/footers/page-numbers in print stylesheets, but browser support and fidelity vary, and no probe of this has been run. **§7-4 routes the fidelity question to `plan.md`**, with the fallback path (a PDF library) named and priced rather than silently assumed away, exactly as §3.4 requires for any dependency this milestone might still add.

*Rejected:* a JavaScript PDF-generation library from the start — the product spec's own wording names a print pipeline, and starting from `window.print()` is the only route that could cost zero new dependency; a library is the fallback if the print-CSS route fails production quality, not the default.

**3.7 THE EXPORT SHORTCUT IS ONE Ctrl/Cmd+S BINDING WITH ONE PERSISTED "LAST FORMAT" KEY, APP-PAGE ONLY (§3.2) — DECIDED IN SHAPE; ITS PREVENTDEFAULT SCOPE IS GATE 1's CALL (§9-2).**

- **"Last-used format" is one new key on the existing single global settings row**, the same shape 009 §3.5 used for `codeTheme` — `Settings` gains one more field, not a new settings surface, not a per-document axis. 009 §3.5's own distinction (a global key is the same shape `theme`/`tocOpen`/`tocWidth` already are, not the per-document-class axis 008 §3.5 declined) applies again here without needing to be re-argued.
- **Before any export has happened, there is no "last format" yet.** The default format for a first-ever Ctrl/Cmd+S is a genuine walk-gate pick (§8), not asserted from prose here.
- **The binding itself needs `preventDefault`, because the browser's own Ctrl+S opens a native "Save Page As" dialog.** Where that binding is installed — reader-surface-scoped (safer, leaves `file://` and raw-host content-script surfaces at the browser default) or global — is §9-2, unresolved by this draft on purpose.

**3.8 THE PROGRESS INDICATOR IS A UI AFFORDANCE, NOT A NEW MECHANISM — DECIDED.**

*"Progress indicator for heavy documents"* is a presentation requirement on exports that already take measurable time (DOCX/ZIP serialization, HTML Base64-embedding of large images), not a new export path with its own logic. It is named here only to state the boundary: it must not block the exportable action from being reachable while running (the same "keep the reader interactive" discipline 007/009 both required for their own heavy-engine loads), and it must degrade to *something visible* rather than a frozen-looking tab on a large document — the concrete threshold for "heavy" is §8's to measure, not this spec's to assert.

**3.9 EVERY EXPORT DEGRADES TO "TELL THE USER AND LEAVE THE DOCUMENT ALONE" — DECIDED.**

AGENTS.md #5, stated per item, the 007/008/009 shape:

- **An export that cannot be produced** (a library fails to load, serialization throws, an image cannot be read) states the failure and leaves the rendered document exactly as it was — never a partial file silently offered as complete.
- **A copy action that fails** says so rather than silently copying nothing or copying the wrong format.
- **The print/PDF path** degrades to the browser's own print behavior if the tuned CSS fails to apply — never a blank print preview.

**Never a corrupt file presented as good, never a silent partial export, never a blank page.**

**3.10 `docx` AND A ZIP WRITER ARE GOVERNED DEPENDENCY ACTS — DECIDED, on the same process 007 §3.12 and 009 §3.10 both used.**

- Six production dependencies exist today. `docx` and a ZIP writer would be the seventh and eighth, each individually enumerated, licence-checked as permissive, and appearing in the generated SBOM. `pnpm audit --prod` stays a **blocking** gate at 0 advisories.
- **No install scripts.**
- **Verified against the package itself, not from memory** — AGENTS.md's standing rule, with the same force 009 §3.10 gave it for Shiki's WASM question: a library's API surface and licence are a hypothesis until read from the current package, not training data.
- **The ZIP-writer choice is not committed here.** The kickoff's own working assumption is `jszip` (`spec-coverage.md`:546 names it by example), but this spec does not lock the package name — `plan.md` verifies the current landscape (bundle size, maintenance status, licence) before choosing, the same discipline every dependency choice in this project gets.

## 4. Acceptance criteria (EARS)

**HTML export**

- When the user exports the current document as HTML, the system shall produce a single standalone file with all styling inlined and every locally-resolvable image embedded as Base64.
- If the document references a remote image, then the system's handling shall follow whatever §9-3 rules — inline it, leave it as a remote reference, or omit it — but shall never silently fail the whole export over one unresolvable image.

**DOCX export**

- When the user exports the current document as DOCX, the system shall produce a file that preserves the document's heading structure, lists, tables, and emphasis.
- When the document contains a rendered diagram, the system shall embed it as an image in the DOCX output.
- The system's handling of math content shall follow whichever of §9-1's options gate 1 selects, and shall never silently drop content without indicating that it was omitted.

**PDF export**

- When the user exports the current document as PDF, the system shall produce output through the print-optimized layout (§3.6), with reader chrome hidden.
- If the tuned print CSS cannot achieve the required page-numbering/header/footer fidelity, then the system's fallback shall be named and built per §7-4's resolution, not silently absent.

**Copy actions**

- When the user copies the document as rich text, the system shall write a clipboard payload that pastes as formatted content into a standard word processor, not as plain markdown source.
- When the user copies the document as HTML, the system shall write the same standalone HTML §4's HTML-export criteria describe, to the clipboard rather than to a file.
- When the user copies the document as plain text, the system shall copy the raw source text exactly as authored.
- If any copy action fails, then the system shall say so and shall not report success for a copy that did not occur.

**ZIP export**

- When the user exports the current document as a ZIP, the system shall include the markdown source and every locally-resolvable referenced image, with paths rewritten to match the archive's layout.
- The system's handling of remote images in a ZIP export shall follow §9-3's resolution.

**Export shortcut & progress**

- When the user presses the export shortcut, the system shall export in the most recently used format, or a stated default if no format has been used yet (§8).
- While a heavy export is in progress, the system shall show that it is working and shall keep the reader interactive.
- When an export completes, the system shall indicate completion; when an export fails, the system shall indicate the failure distinctly from success.

**Print mode**

- When print-optimized mode is engaged (by print, PDF export, or the browser's own print command), the system shall hide reader chrome not part of the document content and shall respect page-break boundaries around headings and code blocks where feasible.

**Trust**

- The system shall make no network request for any export or copy action, **except** whatever §9-3 rules for remote-image resolution — and where a request does fire, it shall be user-triggered by the specific export action and shall light the network indicator (AGENTS.md #1).
- The system shall keep the built manifest at `permissions: []` on both engines, with no `web_accessible_resources` and no other forbidden key.
- The system shall add no capability row to `docs/trust/PERMISSIONS.md` beyond whatever §9-3 requires for remote-image fetching, and beyond the one settings key named in §3.7.

**Degradation**

- If any export or copy action fails, then the system shall keep the document readable and never blank the page (AGENTS.md #5).

## 5. Non-functional requirements

- **First paint:** shall not regress the current `<165 ms` typical-doc gate. Export code is not on the render path by construction (it runs only on explicit user action), so this is a **byte-budget** risk (§3.4), not a first-paint risk, and is stated here only to record that the export libraries must not be imported anywhere the render path reaches.
- **Bytes:** `docx` and the ZIP writer are measured and decomposed to a zero residual against the current baselines — `.output` **4,866,741 / 4,866,857 B**, `pnpm zip` **1,470,730 / 1,470,788 B** (`progress.md`, 9.3 close). **This is §3.4's own measurement, repeated here as the binding NFR**, not a separate gate-3 item (009's own correction: a pass/fail budget check belongs in §5/§7, not §8).
- **Dependencies:** up to two additions — `docx` and a ZIP writer (§3.10) — each a governed act. If PDF export's fallback (§3.6, §7-4) needs a third, that is priced explicitly when it is decided, not folded in silently.
- **Manifest pin:** `permissions: []` re-proven on both built manifests; `tests/manifest.test.ts` green. **`web_accessible_resources` remains a forbidden key** — if either export library needs it to lazy-load on the app page the way `mermaid`/`shiki` do, that is expected and unremarkable (007/009's own precedent); if it is needed to reach the *content-script* graph, that contradicts §3.2 and is a hard stop.
- **Golden pin:** `tests/golden/output/` shall stay **byte-identical** — every export and copy action runs on explicit user action against the already-rendered document, never inside the `sanitize(parse(source))` path the suite snapshots.
- **Sanitization (AGENTS.md #3):** exported and copied HTML is built from the already-sanitized rendered DOM, not re-parsed from raw source; whether the export path can compose it as a serialized string of already-trusted nodes or needs its own re-sanitization pass before leaving the page is a `plan.md` call, named as an open risk (§7-1).
- **CSS discipline:** any print-CSS rationale lives in **TypeScript doc comments, never inside a CSS template literal** (M6 retro finding 9 — this would be the fifth such site, after `readerCss.ts`, `appShell.ts`'s `APP_CSS`, 007's and 009's own diagram/code styling). Print rules themselves land in `readerCss.ts` per `spec-coverage.md`'s own citation of where they are currently absent.
- **a11y:** every export/copy control is keyboard-reachable and focus-visible; the progress indicator's state is announced to assistive technology, not conveyed by animation alone; the export shortcut's action is confirmed in a way a screen-reader user can perceive, not only visually.
- **Zero-network (AGENTS.md #1):** proven at the request level on both engines with a positive control that fires under the same conditions the negative claim disclaims (M6 retro finding 1) — the standing lesson that jsdom cannot see bytes on the wire applies with the same force here it did for 007/008/009. **§9-3's resolution, whichever way it goes, gets its own explicit request-level proof — a network claim for export cannot inherit the render-path proof by reference.**

## 6. Out of scope (explicit)

- **Publish → GitHub Gist, GitHub repo, Medium, Dev.to** (§3.1, §3.2) — the product's first deliberate, credential-bearing outbound network path, `docs/product/spec.md` §6 principle 2's own exception territory. Home: M11, a milestone whose own gate-1 can give the security review this class of feature needs the attention 006/007's storage-disclosure and 009's dependency-governance calls got theirs. **This deferral is a routing decision inherited from the human at this session's scoping, not re-argued at spec level** — but see §9-3, which raises a real question about whether M10 is actually first.
- **The content-script `file://` / raw-host reader's export reach** (§3.2) — no export affordance, no explanatory note, ships there in M10. Home: a future milestone that reconsiders that surface's capability set, the same shape 007/009 both left for their own app-page-only features.
- **Any editor-mode export interaction** (F8) — Editor Mode does not exist; exports operate on the reader's current rendered state, never a draft.
- **Any F5 item other than print mode** — table tools, compare-any-two-files, and agent-file awareness already shipped (M8); the remaining F5 ⭐ items (project mode, cross-file search, in-document search, etc.) are untouched by this milestone.
- **A settings surface for export defaults beyond the single "last-used format" key** (§3.7) — no per-format configuration UI, no per-document export preference.
- **OMML math export**, unless gate 1's §9-1 ruling requires it — and even then it is blocked on F2 math shipping first, which this milestone does not do.
- **A JavaScript PDF-generation library**, unless §7-4's print-CSS-fidelity investigation forces the fallback named in §3.6.

## 7. Open risks — for plan.md to resolve (not spec-level)

1. **Whether exported/copied HTML can be composed by serializing the already-sanitized DOM, or needs its own sanitization pass.** §5 names the question; the answer likely differs between "serialize the live shadow-root subtree" (composes trusted nodes, arguably needs nothing new) and any path that re-stringifies and re-parses markdown for the export (would re-enter AGENTS.md #3's territory). Resolve concretely against the actual `mount()` output shape.
2. **The clipboard mechanism for copy-as-rich-text.** Existing clipboard writes in this codebase are single-format (`navigator.clipboard.writeText` for table CSV/Markdown, an image `write` for diagram copy-as-image, per 007/008's own citations) — copy-as-rich-text needs a `ClipboardItem` carrying `text/html` (and likely a `text/plain` fall, per the standard multi-format clipboard pattern) so a paste target can choose the richest representation it understands. **Verify the current Clipboard API surface on both engines before assuming this shape** — AGENTS.md's standing rule, with the same force 008 §7-6 gave the same class of question for copy-as-image.
3. **Ctrl+S's cross-engine `preventDefault` behavior.** Both Chromium and Firefox bind Ctrl+S to a native save dialog; confirm the binding actually suppresses it on both engines and at the scope §9-2 rules, rather than assuming symmetric behavior.
4. **Print-CSS fidelity for page numbers, headers, and footers (§3.6).** `@page` margin-box rules are the standard CSS mechanism; their real support and rendering quality across Chromium's and Firefox's print pipelines is unverified. If fidelity is inadequate, the fallback (a PDF-generation dependency) is priced against §3.4's already-thin budget headroom before being adopted, not adopted reflexively.
5. **Where remote-image resolution for HTML/ZIP export intersects `mediaPolicy.ts`'s existing remote-media blocking and its own user-triggered restore mechanism.** A quick read while drafting this spec found that `mediaPolicy.ts` already implements a **user-triggered restore** path for blocked remote `<img>` elements (its own header: *"the tree is precisely what initiates the (now user-triggered) fetches"*) — meaning a mechanism for opt-in remote-image fetching may already exist in the tree, in some form, ahead of this milestone. **Whether that mechanism is reachable from any shipped UI today, or is plumbing with no control wired to it (the "built and tested and wired to nothing" class of defect M5 named three times), is unconfirmed by this draft** and is `plan.md`'s first move on §9-3, before any new fetch code is written.
6. **The sibling-checklist audit, owed BEFORE the first export-chrome test is written** (M6 retro finding 4, restated at every milestone since — *"the single most valuable mechanical item M6 produced"*). 010 adds export/copy controls and a progress affordance as new chrome; enumerate the property set from every existing sibling suite — `tableEnhancer`, `diagramEnhancer`, `codeEnhancer`, `diffChrome`, `watchControl` — and record each property present/absent/explicitly out-of-scope.
7. **Design translation.** No mockup for export chrome is known to exist at this draft's evidence base (the same gap 009 §7-9 named for code blocks). `plan.md` should confirm whether one exists or needs producing, verify every token against `readerCss.ts` before use, and never substitute a nearby token silently.

## 8. Product decisions routed to gate 3 (measure first, then choose)

*The D-8 pattern: the axes are settled here, the values are chosen by a human at a separate gate, from measurements a measurement task produced and is **forbidden from choosing** from.* Per 009's own correction: byte-cost and first-paint are pass/fail checks against an already-fixed gate and live in §5/§7 above, not here — these are the genuine measure-then-choose axes.

1. **The default export format before any format has ever been used (§3.7).** **Axes:** which format a first-time user is likeliest to want · which format has the fewest failure modes to demonstrate on a first try. **What the plan measures:** nothing quantitative — this is a walk-gate product-feel judgement, the same shape 009 §8-4 used for its own default-theme pick.
2. **The "heavy document" threshold that triggers the progress indicator (§3.8).** **Axes:** document size · image count/bytes to embed · measured wall-clock for each export type at representative sizes. **What the plan measures:** export duration across a size distribution drawn from this repository's own documents and golden fixtures, the same corpus 008's table-threshold and 009's collapse-threshold measurements both used.
3. **Print CSS's specific page-number/header/footer content and layout**, once §7-4 confirms the mechanism can express them at all. **Axes:** what the header/footer actually shows (document title? page X of Y? both?) · margin sizing. **What the plan measures:** a walk against the demo document and a long golden fixture, the same shape 007/008's "design translation" risk used.

## 9. Decisions gate 1 must make

*Things this draft could not settle from the source material, stated as questions rather than smuggled in as defaults.*

1. **DOCX export's math and diagram scope (§3.5).** Diagrams are cheap — the existing copy-as-image mechanism (`diagramView.ts:298`, per this session's kickoff) embeds directly. Math is not shippable at all today: F2 math is 0%, so there is no equation render to embed even as the product spec's own conceded fallback image. **Two live options: (a) DOCX export ships in M10 with math omitted or rendered as plain source text, explicitly labeled as a known gap; or (b) DOCX export's math handling is blocked on F2 shipping first, and M10's DOCX export ships without a "math" acceptance criterion at all (diagrams only).** **No recommendation given** — this is a product-completeness call about whether a visibly-incomplete DOCX export is worse than a diagrams-only one, which this draft has no basis to make alone.

2. **The Ctrl/Cmd+S shortcut's scope (§3.7).** Standard browser Ctrl+S triggers "Save Page As"; Peekover's binding needs `preventDefault`. **Does it fire only within the app-page reader surface (§3.2 already confines exports there, so this would be consistent — and it leaves the browser's native save behavior untouched on `file://` and raw-host content-script surfaces, where no export exists to bind it to anyway), or globally, including on surfaces this milestone gives no export affordance to?** **Recommendation: app-page-only**, on the reasoning in parentheses — a global binding would suppress the browser's native save dialog on a surface where Peekover offers nothing in its place, which reads as a regression on that surface rather than a neutral no-op.

3. **Does ZIP (and HTML) export's "local copies of remote images" fetch the network, and if so, is that M10's actual first deliberate outbound network path — ahead of the M11 publish paths this session's scoping named as "the first exception"?** The product spec's ZIP-export bullet says *"local copies of remote images"* — read literally, that means fetching a remote image and writing its bytes into the archive, which is a network call this milestone's own framing (§3.1, §6) did not anticipate needing. §7-5 found that `mediaPolicy.ts` already has *some* user-triggered remote-fetch mechanism in the tree ahead of this milestone, of unconfirmed reach. **Two live options: (a) M10's ZIP and HTML export embed only already-locally-resolvable images (files already reachable through the opened folder) and leave remote image references unrewritten, with a stated limitation — deferring "fetch and embed remote images" to sit alongside M11's other network-capability work; or (b) M10 implements the fetch, as the product spec's bullet reads literally, making it — not M11's publish paths — this product's first new deliberate outbound network path, and this session's own framing of M11 as "the first exception" is corrected.** **Recommendation: (a).** It keeps M10's own "no network capability, no host permission" framing (§5's Trust criteria as drafted) true as stated, keeps the security-review weight this session already assigned to "the first outbound network path" concentrated in one place (M11) rather than split across two milestones, and the limitation it accepts — a remote image stays a remote link in the ZIP/HTML output rather than a local copy — is a narrower, more honest promise than a half-built fetch mechanism would be.

---

_Gate status: this spec is a **DRAFT awaiting gate 1**. On approval, `plan.md` — the HOW — is the next artifact and the next gate, generated in a **fresh session** (C14), and it resolves the §7 risks above against the **actual code** rather than against this document. `tasks.md` is gate 3. **No implementation code before tasks.md is approved** (WORKFLOW.md §5.3)._

_Standing verification rules this milestone inherits and must not re-derive: every regression test is verified **revert-and-fail**, red with the defect's own signature in the defect's own units (M6 retro finding 5); every empirical claim carries a **positive control that fires** (finding 1); every perf number is **A-B-A with the floor beside the median** (finding 7); the close gate **records its viewport(s)** the way it records its engines, and walks at least one WIDE viewport because this milestone ships new chrome (finding 2); bundle-affecting tasks measure `pnpm build` + `pnpm zip` + `.output` size as a mandatory Verify step, not an optional one (009's own 4.3 finding, after 4.2's barrel-import near-miss)._

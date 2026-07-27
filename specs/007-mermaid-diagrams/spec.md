# Spec 007 — Mermaid diagrams + diagram cache

**Status:** draft (Gear-3 gate 1 — awaiting human approval before `plan.md`)
**Scope:** **007 delivers M7a** — rendering Mermaid diagrams inside the reader, plus F2's hash-keyed diagram cache. Both from the start, not sequentially. Direction and its deferrals are `docs/ai/decisions.md` 2026-07-27 (M7 DIRECTION); this spec is the WHAT, and it does not re-argue the direction.
**Date:** 2026-07-27
**Milestone:** M7 · builds on 006 (snapshots + diff, CLOSED)
**Structure:** follows WORKFLOW.md §5.3 (`spec.md` = the WHAT, no tech). Mirrors 005's and 006's section shape; `specs/_template-spec.md` carries no section this omits. §8 and §9 are additions — the gate-3 candidates and the gate-1 questions, separated so neither is mistaken for a settled call.
**Evidence base:** no new probe. This spec rests on the M7 direction decision, `docs/ai/spec-coverage.md` 2026-07-27 (F2 at 0%; **no milestone has ever touched F2**), `docs/ai/retro.md` 2026-07-27 (M6 — findings 1, 4, 5, 6, 7, 9 shape criteria below and are **cited, not restated**), the current § Baselines table in `docs/ai/progress.md`, and `docs/trust/PERMISSIONS.md` as it stands today. **Every `file:line` cited here must be re-derived by `plan.md` against the actual tree, not inherited** — 006 §Evidence base makes the same demand for the same reason.

---

## 1. Problem & value

Peekover renders the documents AI agents write. Agents write Mermaid diagrams into those documents. Peekover renders them as a grey code fence.

That is not a missing polish item; it is **this product's own value story failing on its own persona**. `spec-coverage.md` puts persona #1 (AI-tool developer) at ~56% and every other persona under 15% — six milestones have landed almost entirely inside persona #1's column — and the single largest remaining hole in that column is **F2 at 0%**, of which Mermaid is the item §3 of the product spec names in the persona's own row ("Folder browser, watch mode, diff view, **Mermaid**/tables").

A user can today open a folder of agent output, follow a spec as it is rewritten, and diff it against what they read a minute ago, all offline. What they cannot do is **see the architecture diagram the agent just drew**. The gap is visible on exactly the documents this product exists to read.

**Who it serves:** the AI-tool developer (product spec §3), at the same task the last three milestones served — reading and reviewing what an agent generated. Secondarily the technical writer and the developer reading a README whose flowchart is currently a wall of `graph TD`.

## 2. User stories

- As a developer reading a spec my agent wrote, I want its Mermaid blocks **rendered as diagrams**, so I can read the design rather than parse the syntax.
- As a reader of a long document, I want the **text to appear immediately** and the diagrams to fill in after — never a document that waits on its heaviest block.
- As someone watching an agent rewrite a document, I want the diagrams that **did not change** to stay put rather than re-render on every keystroke.
- As a reader who switches to dark mode, I want the diagrams to **follow the theme**, not stay a bright white rectangle in a dark page.
- As someone who wants a diagram elsewhere, I want to **copy it as an image or download it**, without a round trip through a screenshot tool.
- As someone reading a dense diagram, I want to **zoom into it**, without leaving the document.
- As a security-conscious user, I want to know that rendering a diagram **puts nothing on the wire**, and that whatever is cached on my device is **visible, bounded and erasable**.
- As a user whose diagram has a syntax error, I want to **see the error and my source**, not a blank rectangle.

## 3. Key scope decisions (decided at this gate — redline as needed)

**3.1 Milestone scope — Mermaid rendering and the diagram cache. Nothing else.** IN: rendering `mermaid` fenced code blocks, the hash-keyed cache with its bounds and clear control, theme sync, graceful failure, the zoom/pan lightbox, and copy/download per diagram. OUT, each with a home in §6: KaTeX/MathJax and all math (F2's other half), Graphviz/Vega/PlantUML (F2's own "post-v1 stretch"), standalone diagram *files* (§3.4), and every M8-deferred item the direction decision names — compare-any-two-files, agent-file awareness, table tools (F6/F5), plus Shiki (F3) and Editor Mode (F8). **None of those is re-opened here.**

**3.2 007 ships to the APP-PAGE READER ONLY. The content-script `file://` / raw-host reader renders no diagrams — DECIDED.**

This is the same surface call 006 §3.2 made, for one shared reason and one new, harder one.

- **The shared reason (storage).** The content script has no storage of its own; it reaches storage only through the background. 006 declined to turn a stateless fetch proxy into a storage proxy, and a persistent diagram cache would need exactly that.
- **The new and decisive reason (bytes and the manifest).** Mermaid is a heavy engine that §10 requires be *"lazy-loaded as a local chunk"*. A content script cannot load a separate packaged chunk without `web_accessible_resources` — a key `tests/manifest.test.ts:31` names a **capability escalation and forbids outright**. The only other outcome is the bundler folding the engine into the content-script bundle itself, which puts the whole engine on the gated first-paint path of every `file://` markdown document, diagrams or not. **Both outcomes are unacceptable, and neither is a tradeoff to be balanced** — one breaks the trust pin, the other breaks the gate.
- **And the surface it keeps serves persona #1 completely.** Persona #1's workflow — folder → watch → diff → snapshots — lives entirely on the app-page reader; the content-script surface serves a different task shape (single-click-and-read of one `file://` document — nearer persona #2's territory). **Closing the Mermaid gap there IS persona-#1 completion**, and the content-script surface's diagram gap is a discoverability item, not a persona-#1 shortfall.
- **This is the `diff` import fence again, one milestone on.** M6 kept `diff` off the content-script graph by reaching the engine only through closures the app page provisions (plan 006 §1.4), and proved it by ablation to a byte-identical content script. 007 inherits that shape: **the enhancer is invoked from the app-page reader path, never from inside `mount()`** — which both surfaces call.

Two consequences, stated so they are not silently reversed:

- **A named deferral, not a silence** (§6), with the revisit-when in §8.
- **The content-script reader grows no affordance and, in this milestone, no explanatory note.** A Mermaid fence there renders exactly as it does today — a code block, correct and readable. There is no control to explain and no regression to apologise for. **This is the one place where 006 §3.2's "the user never saw the feature here" argument is weaker**, because the *same document* now renders differently on two surfaces; it is therefore raised explicitly to gate 1 (§9-2) rather than settled by precedent.

*Rejected:* shipping the engine to both surfaces (above); shipping rendering to the content script with no cache (the byte and manifest problems are about the engine, not the cache, so this fixes nothing).

**3.3 Rendering is a POST-MOUNT enhancement, not a pipeline stage — DECIDED.**

`architecture.md`'s pipeline names `enhance` between sanitize and mount, and `mount()` in fact commits in one synchronous `replaceChildren`. 007 does not change that: **the text is painted first, and diagrams are enhanced into the already-committed DOM afterwards.**

- **Why:** §F2 requires *"text paints instantly, diagrams render in the background"* and §7's design principle 4 requires progressive enhancement for heavy blocks. Any placement upstream of mount puts a lazily-loaded engine on the first-paint path — the exact thing the <165 ms gate exists to prevent.
- **The input seam is the sanitized code fence: `pre > code` carrying the `language-mermaid` class.** markdown-it's default fence renderer emits it, and it survives sanitization unchanged — `pre` and `code` are in `ALLOWED_TAGS` (`sanitize.ts:26,28`) and `class` is in `ALLOWED_ATTR` (`sanitize.ts:62`). The enhancer reads the fence's **text content**, never its markup.
- **`mount()` stays read-only library** (006 D-15). The enhancement runs after `mount()` returns; it does not become a branch inside it.
- **Every re-render re-enhances.** `replaceChildren` destroys the rendered diagrams on each mount, including the ones watch mode causes. That is what makes §3.6's cache load-bearing rather than an optimisation: **on a watched document, unchanged diagrams must come back from cache, not from the engine.**

*Rejected:* rendering during `parse` or `sanitize` (couples a diagram engine to the text pipeline and blocks first paint); a synchronous enhance inside `mount()` before the commit (same, and it would breach the gate on the first diagram-bearing document).

**3.4 Standalone `.mermaid` FILES are OUT of 007 — DECIDED, and routed to gate 1 for overturn.**

§F2 names *"Standalone diagram-file rendering: open `.mermaid` / `.dot` … files directly as rendered diagrams"*. The direction decision does not distinguish it from in-document rendering. This spec decides **out**, on cost rather than on value:

- `MARKDOWN_EXTENSIONS` (`isRenderableContext.ts:20-30`) is the single authoritative gate, and it is **shared** — the folder walk filters on it too (`walkPolicy.ts:183`). Adding `.mermaid` there makes the reader parse a diagram file **as markdown**, which is wrong on both surfaces at once.
- Doing it correctly means a **distinct non-markdown code path** in the detector and the reader, plus (for `file://`) a **new content-script `matches` pattern** — a manifest change, so an AGENTS.md #4 event with a PERMISSIONS.md row, in a milestone that already carries a fifth dependency and a storage addition.
- And per §3.2 the content-script surface cannot host the engine at all, so the `file://` half of the feature is unreachable in 007 regardless.

The persona-#1 story the direction decision names is *the diagrams agents write inside specs and plans* — fenced blocks in markdown. Standalone files are docu.md parity, not the gap. **Gate 1 may overturn this** (§9-1); the cost of overturning is stated above so the choice is priced, not guessed.

*Rejected:* adding `.mermaid` to `MARKDOWN_EXTENSIONS` (renders a diagram file as markdown — wrong by construction); app-page-only standalone rendering (half a parity feature, and it still needs the distinct code path).

**3.5 Mermaid's SVG output goes through a SECOND, SVG-SHAPED SANITIZER PROFILE. The document profile is NOT widened — DECIDED.**

This is the hardest call in the milestone and it is settled here, not in the plan.

`sanitize.ts` today allows **no `svg` at all** — the M6 audit noted this as *"denial rather than sanitization (stronger)"*. Mermaid produces SVG. Three resolutions were available:

- **Widen `ALLOWED_TAGS` in the shared profile — REJECTED.** The document profile governs *untrusted markdown source*. Allowing `svg` there means any agent-written document can inline arbitrary SVG, with everything that carries (`<use>`, `<foreignObject>`, `<animate>`, external references). The stance would be traded away for every document to serve one enhancer.
- **Rely on the shadow root as a boundary — REJECTED, and named so it is not proposed again.** The reader already mounts into a shadow root (`mount.ts:92`); **shadow DOM is a style and query boundary, not a security boundary**, and script inside one runs normally. "It's in the shadow root" is not sanitization and must never be recorded as if it were.
- **A distinct profile applied only to the enhancer's output — CHOSEN.** Mermaid's output is generated by our own bundled engine, and it is sanitized against an **SVG-shaped allow-list expressed as data**, in the same reviewable-in-one-place form `sanitize.ts` already uses for the document profile. The document profile's arrays are **untouched**, so markdown source still cannot produce an `<svg>`.

Requirements on that profile, at spec level:

- **Enumerated as data, not inline literals** — the existing file's own discipline (`sanitize.ts:6-10`), so the diagram allow-list is reviewable as one artifact.
- **No remote or `data:` references survive.** `href` / `xlink:href` / `src` on any element, `<image>`, `<use>`, and `@import` inside any `<style>` are the named routes; §3.7 covers the mechanism.
- **`<foreignObject>` is denied.** It re-admits arbitrary HTML into a subtree the document profile never inspected.
- **A bounded `aria-*` / `role` / `<title>` / `<desc>` set IS permitted**, deliberately diverging from the document profile's `ALLOW_ARIA_ATTR: false` — a diagram with no accessible name is an a11y regression, and this is generated output, not untrusted source.

**3.6 The cache is HASH-KEYED ON SOURCE + THEME + ENGINE VERSION, and it PERSISTS — DECIDED.**

- **All three key components are required.** Source alone serves a stale diagram after a theme flip; source+theme serves a stale diagram after Dependabot bumps Mermaid (minor+patch, `decisions.md` 2026-07-27) and the engine's output changes underneath it. **Any two of the three is a known-wrong key**, so all three are named here rather than left to the plan.
- **It persists in the existing on-device `peekover` IndexedDB**, as a schema addition (`DB_VERSION` 3 → 4, additive-by-name, existing rows preserved — the 006 precedent). **Additive at the schema level:** the upgrade only *adds* the diagram cache's own store(s) by name, alongside `folders`, `recents`, `pins`, `settings`, `snapshotMeta` and `snapshots`; no existing store or row is modified. **Why persistent and not session-memory:** §8's bar is *"cached reopen < 1 s"*, and a cache that dies with the page cannot satisfy a reopen; and §F2's *"size cap, one-click clear"* only means something for bytes that outlive the tab.
- **What is stored is the sanitized rendered SVG** — the artifact that would otherwise be recomputed. It is not the document, but **it contains the diagram's label text verbatim, so it is a derivative of file contents** and is treated as such: see §3.9.
- **This is what makes watch cheap.** §F2's *"only re-render changed diagrams"* is exactly the watch case (§3.3): an agent editing prose around an unchanged diagram must produce a cache hit.

*Rejected:* an in-memory-only cache (cannot satisfy "reopen", and makes "one-click clear" theatre); keying on source alone (§F2 requires theme re-sync; the key must express it).

**3.7 Theme flips RE-RENDER through the cache; they do not retint the SVG — DECIDED.**

§F2 requires diagrams to auto-sync with light/dark. Two mechanisms were available and this picks one.

- **Why re-render:** Mermaid bakes theme into per-node presentation attributes and, for several diagram kinds, into computed layout. Retinting would mean rewriting the engine's output to reference our custom properties — fragile across diagram kinds and across every engine version Dependabot lands.
- **Why it still meets the <1 s bar:** theme is part of the key (§3.6), so the first flip is a miss and **every subsequent flip in either direction is a hit**. The <1 s bar is about reopening a document, not about the first ever flip.
- **A flip must never blank a diagram.** The previously rendered diagram stays on screen until its replacement is ready.

**3.8 Failure degrades to the SOURCE FENCE, always — DECIDED.**

AGENTS.md #5 and §8's Reliability row. Three distinct failures, one shape:

- **Engine fails to load** (chunk unavailable, storage exhaustion): every fence stays a code fence. The document is exactly what it is today.
- **A diagram fails to parse or render:** *that* fence stays a code fence, with an inline marker naming the failure, and every other diagram on the page renders normally. **Mermaid's own injected error graphic is suppressed** — showing the user their source is more useful than showing them a rendered apology.
- **Sanitization rejects the output:** same. The block degrades; the page does not.

**Never a removed block, never an empty box, never a blank page.**

**3.9 The cache is a DISCLOSED, BOUNDED, ERASABLE store — DECIDED, and it is a PERMISSIONS.md event.**

Not an AGENTS.md #4 manifest event — `permissions: []` is untouched — **but treated with the same weight**, exactly as 006 §3.3 treated snapshot capture.

- **A new ledger row in `docs/trust/PERMISSIONS.md`, in the established format**, landing **in the same commit as the first code that caches an SVG** — never a follow-up.
- **The "Stored data" panel discloses it** alongside snapshots: how many cached diagrams and their total bytes, in the same plain language.
- **"Wipe all data" erases it**, and a dedicated **one-click clear** erases it alone, keeping folders/recents/pins/settings/snapshots (`storageControls.ts`'s "Erase snapshots" is the precedent and the shape to follow).
- **Bounded on count, bytes and age, whichever binds first, evicting oldest-first** — the D-16/D-8 axis pattern. **The values are not chosen here** (§8-1).
- **The claims that must remain true:** nothing leaves the device, and everything stored is visible and erasable.

**3.10 Zero network is enforced at BOTH the engine and the sanitizer — DECIDED.**

AGENTS.md #1 is not satisfied by configuration alone. **Both** of the following are required, and neither is sufficient:

- **The engine is configured so it cannot emit remote references** (its own security posture, plus no remote fonts, no external image references).
- **The output profile (§3.5) strips any that appear anyway** — remote and `data:` URLs on every URL-bearing attribute, `<image>`/`<use>` external references, `@import` in embedded `<style>`.

The precedent is `mediaPolicy` + the inert-`<template>` materialization in `mount.ts:119-133`, whose own comment records that a "detached" element still fetches. **The same trap applies here** and is an open risk (§7-3), because Mermaid measures text in a live container by construction.

**3.11 Copy, download and lightbox are IN-READER affordances — no context menu, no new global key — DECIDED.**

- **Copy-as-PNG and download-as-SVG live on a per-diagram control group** revealed on hover **and on keyboard focus**. **Not a right-click context menu:** `contextMenus` is a manifest permission (`spec-coverage.md:103` flags F2's right-click formula items as exactly that), and hijacking the browser's own menu inside a reader is hostile besides. *(Touch input has no hover state, so on a touch device both affordances are keyboard-only — a carried consideration rather than a blocker, since product spec §4 targets desktop browsers; verify at the gate-3 walk if a touch device is available.)*
- **Neither affordance may require a manifest permission.** If either turns out to, that is an AGENTS.md #4 event — **stop and flag** (§7-6).
- **The lightbox opens by activating the diagram** — pointer or keyboard — and closes on Escape. **No new global bare key** (006 D-7's rule; the existing bare keys are `\` and `` ` `` and unifying them is a carried item, not this milestone's).
- **F5's image lightbox is not shipped and is not in scope.** This is the first zoom/pan surface in the product; it should not be built in a way that *prevents* F5 reusing it later, but generalising it now is out.

**3.12 The engine is the FIFTH runtime dependency, and it is a governed act — DECIDED.**

Four production dependencies exist today (`diff`, `dompurify`, `markdown-it`, `markdown-it-task-lists`). `mermaid` is the fifth, added on the M6 process (`decisions.md` 2026-07-25).

- **It is materially unlike `diff`, and pretending otherwise is the risk.** `diff` was chosen partly *because* it has zero runtime dependencies. Mermaid has a substantial transitive tree. **Every new production component must be enumerated, licence-checked as permissive (§10), and appear in the generated SBOM.**
- **`pnpm audit --prod` is a BLOCKING gate** (`decisions.md` 2026-07-27 (a): the production tree is clean at 0, and blocking is what that cleanliness buys). If the addition introduces a production advisory, **that is a blocker to resolve, not a threshold to relax.**
- **No install scripts** (§6-9).
- **Verified against the package itself, not from memory** — AGENTS.md's standing rule; training knowledge of a fast-moving library's API and licence is stale by construction.

## 4. Acceptance criteria (EARS)

**Rendering**

- When a document containing a `mermaid` fenced code block is rendered on the app page, the system shall replace that block with a rendered diagram.
- When a document contains no `mermaid` block, the system shall not load the diagram engine.
- When the diagram engine is loading, the system shall show a placeholder in the block's place, and shall show it instantly and without animation while `prefers-reduced-motion` is set.
- While diagrams are being enhanced, the system shall keep the document's text readable and the reader interactive.
- When a diagram resolves, the system shall not displace the reader's current reading position.
- If a diagram fails to parse, render, or sanitize, then the system shall leave that block as its source code fence with an inline marker, and shall render every other diagram in the document normally.
- If the diagram engine cannot be loaded at all, then the system shall render the document with every diagram block left as a code fence, and shall never blank the page.
- When a document is rendered on the content-script reader, the system shall leave `mermaid` blocks as code fences and shall present no diagram affordance and no explanation there (§3.2).

**Cache**

- When a diagram has been rendered before, with the same source, the same theme and the same engine version, the system shall reuse the stored result rather than re-render it.
- When any of the source, the theme or the engine version differs, the system shall render afresh.
- When a watched document re-renders and a diagram's source is unchanged, the system shall serve that diagram from cache.
- When cached diagrams exceed a default maximum count, age, or total bytes — whichever binds first — the system shall evict oldest-first, and shall leave the store within all three bounds afterwards.
- When the user views stored data, the system shall show how many diagrams are cached and their total on-device bytes, and shall state the retention policy.
- When the user clears the diagram cache, the system shall erase every cached diagram **without** erasing folders, recents, pins, settings or snapshots.
- When the user wipes all data, the system shall erase every cached diagram.
- If the cache cannot be read or written, then the system shall render diagrams normally without caching and shall not present the failure as a blocking error.
- If the storage schema cannot be opened or upgraded, then the system shall continue to render documents and diagrams, and shall say that caching is unavailable rather than failing silently.

**Theme**

- When the effective theme changes, the system shall re-theme every rendered diagram in the document.
- While a diagram is being re-themed, the system shall keep the previously rendered diagram visible until its replacement is ready.

**Diagram actions**

- When a rendered diagram is hovered or focused, the system shall offer copy-as-image and download-as-SVG for that diagram.
- When the user activates a rendered diagram by pointer or by keyboard, the system shall open a zoom/pan view of it, dismissible with Escape.
- The system shall reach every diagram action by keyboard, and shall add no new global single-key shortcut.
- If a diagram action fails, then the system shall say so and shall leave the rendered diagram intact.

**Trust**

- The system shall make **no network request** while loading the engine, rendering, caching, re-theming, or exporting a diagram — proven at the request level on both engines, **non-vacuously** (§5).
- The system shall keep the built manifest at `permissions: []` on both engines, with no `web_accessible_resources` and no other forbidden key.
- When the user opens "Stored data", the system shall disclose cached diagram renderings on-device, distinctly from settings, folders, recents, pins and snapshots.
- The system shall render no diagram content that references a remote resource, whether the reference originates in the diagram source or in the engine's output (§3.10).

**Degradation**

- If any part of diagram support fails, then the system shall keep the document readable and never blank the page (AGENTS.md #5).

## 5. Non-functional requirements

- **First paint, documents WITHOUT diagrams:** shall not regress the **<165 ms** typical-doc gate (`decisions.md` 2026-07-26; measured against the current baseline **133.7 ms**, floor **132.1 ms**). **Measured A-B-A against a same-session HEAD control, with the FLOOR reported beside the median** (retro finding 7). **M7 owes a floor-delta statement before any re-baseline is even discussed** (retro finding 8) — a moved floor is code and the answer is optimisation, not a bigger number.
- **First paint, documents WITH diagrams:** the **same <165 ms text-paint gate applies**, because §3.3 puts the engine after the commit. A diagram-bearing document that misses the text gate means the enhancement is not actually post-paint — a defect, not a budget.
- **Time to rendered diagrams:** §8's diagram-heavy bar is inherited as a hard outer bound — **50 diagrams: first open ≤ 5 s, cached reopen < 1 s** — and shall be verified at that size. **The typical-case (1–3 diagram) target is NOT set here**: it is a gate-3 product decision with measurement behind it (§8-2). No threshold is asserted from prose (M1 standing rule).
- **Content-script bundle:** shall be **byte-identical, both engines** — the fence in §3.2 is total, not small. **Proven by ablation and by a control that fires** (retro finding 1): identifier greps over a minified bundle are retracted as evidence, and the replacement heuristic in § Baselines requires the control be checked first, every time. **Any growth at all is a fence breach and a gate-3 defect, not a shipped cost.**
- **Bytes:** app-page chunk and `pnpm zip` deltas measured against the current baselines (**361,500 B**; **349,744 / 349,803 B**) and **stated**. The binding package bound is **`pnpm zip` < 2 MB per engine**, comfortably inside §8's ≤ 5 MiB base. **Any unexplained delta is decomposed to sub-block accounting and every byte accounted** (retro finding 1's third instrument) — engine, glue, CSS, and anything shipped that should not be.
- **CSS discipline:** any diagram styling rationale lives in **TypeScript doc comments, never inside a CSS template literal** (retro finding 9 — this would be the third site, after `readerCss.ts` and `appShell.ts`'s `APP_CSS`, and the finding's own conclusion is that awareness is not the mechanism). And **no `ch` unit in any layout-blocking property** (`margin`, `padding`, `transform`) in diagram styling; `max-width` is free (retro finding 6).
- **Storage:** the cache shall be bounded (§3.9) and shall **not degrade read or write for the six existing stores**. The schema upgrade shall preserve existing rows.
- **Memory:** rendering many diagrams holds the engine, the SVG results and the cache alongside whatever the reader already retains. The requirement is that a 50-diagram document stays usable; the ceiling is the plan's to establish **by measurement**, and directional-only memory numbers carry their caveats (the M6 § Baselines precedent).
- **Dependencies:** exactly one addition — `mermaid` (§3.12). Nothing else. Its transitive production tree is enumerated, licence-checked, and in the SBOM; `pnpm audit --prod` stays at **0 blocking advisories**.
- **Dynamic import:** the engine's lazy import shall use a **static string-literal specifier**. `scripts/check-dynamic-imports.ts` enforces this and its 15-fixture self-test runs first in CI (`decisions.md` 2026-07-27 (b)(c)); **007 is the first code in the repository to exercise the rule it was written for, and must not break it.**
- **Manifest pin:** `permissions: []` re-proven on both built manifests; `tests/manifest.test.ts` green and **unchanged at 2975 B**. **`web_accessible_resources` is a forbidden key** (`manifest.test.ts:31`) — if diagram support appears to need it, that is an AGENTS.md #4 event and a **hard stop**, not a widening.
- **Golden pin:** existing files under `tests/golden/output/` shall stay **byte-identical** — diagram enhancement happens after `mount()`, downstream of the `sanitize(parse(source))` string the suite snapshots. A **new** diagram fixture may be added; adding it must alter no existing output. **And an empty golden diff proves nothing about the rendered diagram or its placement** — structural assertions are required where placement matters.
- **Sanitization (AGENTS.md #3):** the document profile is unchanged; the engine's output is sanitized through the §3.5 profile before it touches the live DOM.
- **a11y:** every rendered diagram carries an accessible name; every diagram action is keyboard-reachable and focus-visible; the lightbox traps and restores focus; all transitions are instant under `prefers-reduced-motion`; no state is conveyed by colour alone.
- **Zero-network (AGENTS.md #1):** proven at the request level on both engines with a **positive control that fires under the same conditions the negative claim disclaims** (retro finding 1) — a test asserting "no requests" whose infrastructure could not observe a request if one were made is worth nothing. The existing `/^https?:/i` scoping is used verbatim.

## 6. Out of scope (explicit)

- **The content-script `file://` / raw-host reader** — diagrams are app-page-only in 007 (§3.2). Home: §8-3's revisit-when. **No affordance and no explanation ship on that surface in this milestone** (but see §9-2).
- **KaTeX / MathJax and all math rendering** (F2's other half). Home: a math milestone of its own. The direction decision names the *Mermaid* gap as the persona-#1 failure; math serves the student persona.
- **Graphviz DOT, Vega/Vega-Lite, PlantUML** — F2's own "post-v1 stretch" clause. Home: unchanged, post-v1.
- **Standalone `.mermaid` / `.dot` / `.drawio` / `.vega` files** (§3.4). Home: a milestone that opens a non-markdown reader path, or the `.mermaid` half alone if gate 1 overturns §3.4.
- **Diagrams inside the diff view** — a diff renders source lines, and a `mermaid` fence in a diff is source text on both sides. Home: revisit if diffing diagrams visually is ever wanted; it is a different feature.
- **Auto dark-mode adaptation of IMAGES** (F2's ⭐ item, the other half of the dark-mode row) — `mediaPolicy.ts` classifies and blocks remote media, it does not adapt appearance. Home: a media/theming pass.
- **Generating diagrams from a description** (F10 AI) — doubly blocked today and not this milestone's shape.
- **Compare any two files · agent-file awareness · table tools in reading view** — deferred to M8 by the direction decision, with its revisit-whens. Not re-opened.
- **Shiki syntax highlighting** (F3) — persona #2 territory, queued for M8/M9. **A `mermaid` fence is enhanced; every other fence is untouched**, and 007 must not drift into fence styling generally.
- **Editor Mode** (F8) — named the next-large-milestone candidate, not a comparison this milestone makes.
- **User-adjustable cache bounds** — the 006 §3.4 precedent stands: disclosed defaults, not user settings, until the numbers have been observed against real documents.
- **Cross-device sync of the cache** — the `storage.sync` deferral stands (`decisions.md` 2026-07-17, §6-17 as corrected).
- **Generalising the lightbox to F5's image lightbox** (§3.11).
- **The SBOM release-attach trigger fix** — real, recorded in § Blockers, and belongs with whoever cuts the first release.

## 7. Open risks — for plan.md to resolve (not spec-level)

1. **Whether a lazily-imported engine can be chunked at all under this build, and what it costs where.** There are **zero dynamic imports in `src/`/`entrypoints/` today** (`decisions.md` 2026-07-27 (c)), so §10's *"lazy-loaded as a local chunk"* has never actually been exercised. Determine what the app-page build emits, confirm the static-specifier rule holds through it, and **confirm by ablation** that the content-script bundle is byte-identical. If chunking behaves differently than §3.2 assumes, that is a finding for gate 2, not a quiet re-scope.
2. **The engine measures text in a LIVE container.** §3.10 requires the inert-materialization discipline `mount.ts:119-133` records, and the engine's own layout very likely needs a document with a browsing context to measure glyphs in. **These pull in opposite directions.** Resolve it concretely — where the measuring container lives, what can reach the network from it, and how the output is materialized before adoption. **jsdom cannot see this** (the standing lesson: it loads no subresources); a real-engine guard is the only instrument that can.
3. **Whether the cache participates in per-folder revoke.** 006 D-10 erases a revoked folder's snapshots — *contents outlive access to nothing*. A **content-hash key carries no folder identity**, so the same rule has no obvious mechanism here. Decide deliberately: an index, a deliberate exemption with a stated reason, or a different key. **Do not let it be decided by whichever is easier to implement.**
4. **Byte accounting for cached SVG has no precedent shape.** M6 measured snapshot bytes over text it stored verbatim; here the stored artifact is generated, and its size varies by diagram kind rather than by document size. Eviction ordering and the single-oversized-diagram case both need a specified algorithm (the 006 §7-5 precedent).
5. **`idbCore`'s STOP signal, again.** `IdbSchema` is `{name, keyPath}` — no indexes, no compound keys, no cursors — and 006 stayed inside it by splitting metadata from content. **Confirm the same split satisfies §4's bounds criteria here, or escalate deliberately.**
6. **Copy-as-image and download without a permission.** Clipboard image writes and blob downloads are page-context APIs, but AGENTS.md forbids assuming: **verify against current official docs, on both engines.** If either needs a manifest permission, §3.11 says stop and flag — it returns to a human gate.
7. **Firefox's `data_collection_permissions: {required:['none']}` — the 006 §7-11 question, second instance.** 006 resolved that on-device snapshot storage is not "collection". Caching *generated renderings* is very likely the same answer, but the declaration is **shown to the user at install time by Mozilla** and the standing rule is verify, do not inherit. Resolve before any caching code.
8. **The sibling-checklist audit is owed BEFORE the first diagram test is written** (retro finding 4 — *"the single most valuable mechanical item M6 produced"*). 007 adds a new class of visual element and two new chromes (the per-diagram control group, the lightbox). **Enumerate the property set from every existing sibling suite** — `remoteMediaUi` (the closest analogue: a block-level enhancement inside the reading column), `diffChrome`, `themeControl`, `watchControl`, `storagePanelOverlay` — and record each property as **present / absent / explicitly out-of-scope**. Reader-column clearance is the specific assertion M6 lost in transcription; a floating per-diagram control group is exactly the shape that loses it again.
9. **Theme flip cost at the 50-diagram size.** §3.7's first flip is a full miss on every diagram at once. Measure it; if it is bad enough to be a product problem rather than a one-time cost, that is a finding for gate 2.
10. **Design translation.** `design/mockup.html` predates all of this. Carry the design *language*; **re-measure placement with a real rect probe** (005's precedent), verify every token against `readerCss.ts` before use, and **never substitute a nearby token silently** — 004's sepia deferral is what happens when that is skipped. Where mockup and spec disagree, **the spec wins**, and the divergence is recorded in-code.

## 8. Product decisions routed to gate 3 (measure first, then choose)

*The D-8 pattern: the axes are settled here, the values are chosen by a human at a separate gate, from measurements a measurement task produced and is **forbidden from choosing** from.*

1. **Cache bound VALUES.** Axes settled (§3.9): **count**, **total bytes**, **age**, whichever binds first, evicting oldest-first. Values not chosen. **What the plan measures:** rendered-SVG byte size across representative diagram kinds; accumulation over a realistic reading session; the 50-diagram fixture's total footprint; and whether each axis actually binds in practice — an axis that never binds is chosen wrong (the D-8 revisit-when).
2. **The typical-case (1–3 diagram) time-to-rendered target.** §8 fixes only the 50-diagram outer bounds. **Axes:** absolute wall-clock to all-visible-diagrams-resolved · time-to-first-diagram · a per-diagram amortized budget. **What the plan measures:** 1 / 3 / 10 / 50-diagram fixtures, median **and floor**, so the shape between them is observed rather than assumed linear.
3. **The package-size boundary if measurement lands close.** The operative bound is `pnpm zip` **< 2 MB per engine** (§5), against a current **~349 KB**. The direction decision's revisit-when (b) fires if the engine's real cost approaches the budget — at which point a subset build or a stricter lazy-load boundary becomes gate-3 material. **No byte figure is asserted here; the estimate in the direction decision is an estimate.**
4. **Whether the placeholder shimmers or is static.** §7's principle 4 says *"diagrams shimmer in place"*; §4 requires it be instant under reduced motion. Whether the motion earns its keep on a real document is a walk-gate judgement, in the shape of 006's "reads as noise" verdict.

## 9. Decisions gate 1 must make

*Things this draft could not settle from the source material, stated as questions rather than smuggled in as defaults.*

1. **Does §3.4 hold — standalone `.mermaid` files OUT?** §F2 names the feature; the direction decision does not distinguish it. §3.4 prices the overturn (a distinct non-markdown code path, a new manifest `matches` pattern, a PERMISSIONS.md row) and recommends **out**. Gate 1's call.
2. **Does the content-script reader get a plain-language note about diagrams (§3.2)?** 006 §3.2's precedent says no — no control, nothing to explain. But **this asymmetry is new in kind**: the same document renders differently on two surfaces, which snapshots never did. Recommendation: **no note in 007** (inventing chrome at a gate is how unwalked UI ships), carried as a discoverability item alongside the watch pill. Gate 1's call.
3. **Is app-page-only acceptable as the shape of persona-#1 completion?** §3.2's reasons are strong, but the honest statement is that M7 completes the persona's diagram gap **on one of two reader surfaces**. If gate 1 wants both, the milestone changes shape and the manifest question (`web_accessible_resources`) must be answered before planning, not during.
4. **A documentation inconsistency, noted not fixed:** `docs/product/spec.md` §8 and §7's principle 4 both still state **<150 ms** first paint, while the operative gate has been **<165 ms** since `decisions.md` 2026-07-26. Neither was corrected when the gate moved. Correcting the product spec is outside a spec-drafting session's fence; routed here so it is a decision rather than a drift.

---

_Gate status: this spec is a **DRAFT awaiting gate 1**. On approval, `plan.md` — the HOW — is the next artifact and the next gate, generated in a **fresh session** (C14), and it resolves the §7 risks above against the **actual code** rather than against this document. `tasks.md` is gate 3. **No implementation code before tasks.md is approved** (WORKFLOW.md §5.3)._

_Standing verification rules this milestone inherits and must not re-derive: every regression test is verified **revert-and-fail**, red with the defect's own signature in the defect's own units (retro finding 5); every empirical claim carries a **positive control that fires** (finding 1); every perf number is **A-B-A with the floor beside the median** (finding 7); the close gate **records its viewport(s)** the way it records its engines, and walks at least one WIDE viewport because this milestone ships positioned chrome (finding 2)._

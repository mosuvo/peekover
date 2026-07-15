# Spec 003 — TOC / navigation (in-reader table of contents)

*Gear 3 (spec+plan+tasks). Owner: mosuvo. Status: DRAFT — awaiting human approval (spec gate only; no
plan/tasks yet).*
*Research base: live-docs + competitor re-check 2026-07-15 (MDN, WICG/webcomponents, w3c/IntersectionObserver,
github-slugger, markdown-it-anchor, simov/markdown-viewer). Citations in §9.*

## Goal
Give Peekover's **reader** an auto-generated **table of contents**: a sidebar built from the document's
headings that (a) lets the user jump to any section with one click, (b) **scroll-spies** — highlights the
section currently in view as the reader scrolls, (c) supports **collapsible heading levels**, is
**resizable**, and toggles via **keyboard**, all with **smooth scroll that respects
`prefers-reduced-motion`**. It ships as **reader chrome inside the existing shadow root**, so it appears
on **both** reader surfaces — the content-script reader (`file://` + raw-git pages) and the app-page
reader pane — from a single implementation. The document stays the hero (product spec §7): the TOC is
quiet, collapsible, and never blocks reading.

Nothing else. This is *reading navigation within one document.* It deliberately does **not** build
cross-file search, heading permalinks/deep-links, or a mini-map — those are named, deferred, adjacent
build-order items (§Out of scope). It adds **no manifest permission** and makes **no network request**.

---

## User stories

- **As a developer reading a README / docs on a `file://` path or a raw-git URL** (the content-script
  reader surface), **I want** an auto-generated table of contents in the reader **so that** I can grasp a
  long document's structure at a glance and jump straight to the section I need without hand-scrolling the
  whole file. *(This persona — reading on `file://` and raw-git — is the reason **both** reader surfaces
  are in scope; §Surface scope.)*
- **As a reader of a long, many-heading document**, **I want** the TOC to highlight the section I'm
  currently reading (scroll-spy), let me collapse deep levels, resize the sidebar, and toggle it from the
  keyboard, **so that** I keep my place and navigate quickly while the TOC stays quiet and the document
  remains the hero.

---

## Context — where the TOC lives, and why that decides everything

Both of Peekover's reader surfaces render through the **same `mount()` library** into an **open shadow
root** on a host element:

- **Content-script reader** (M1): a **full-page takeover** — `:host { position:fixed; inset:0;
  overflow:auto }` (see `src/theme/readerCss.ts`). The shadow **host is itself the scroll container**;
  the page's own viewport does not scroll, the host does.
- **App-page reader pane** (M2): the same reader mounted with `{ contained:true }` — `:host {
  position:relative; inset:auto }` but it **inherits `overflow:auto`** from the base sheet, so again the
  **host is the scroll container**, this time inside the shell's reader-pane box, not the viewport.

Two facts fall out of this, and they shape the whole spec:

1. **The scroll container is the shadow host in *both* surfaces — never the browser viewport.** So
   scroll-spy must be rooted on that host's scroll box, not on the viewport, on both surfaces.
2. **The headings live *inside* the shadow root.** Per research (§9), **browsers do not follow URL
   fragments (`#hash`) into a shadow tree, and `:target` does not cross the shadow boundary** — this is
   an unresolved Web Components gap in current Chromium **and** Firefox, with no native fix in sight.
   **Consequence:** Peekover must do its own scroll-to-heading. Fortunately it already can: the reader
   holds the heading **elements** directly, so a TOC click calls `element.scrollIntoView()` on the real
   node — **no URL hash, no heading `id` required.** The shadow-DOM fragment gap only bites *URL-hash
   deep-linking to a heading*, which is an explicitly-deferred later feature (§Out of scope).

Because the TOC lives inside the reader's shadow root — exactly like the existing Raw/Reading pill and
network indicator — **one implementation serves both surfaces**, and the reader stays a self-contained
component that leaks no chrome into any host page.

---

## Surface scope — **decided: BOTH reader surfaces** (justified from research + product)

The TOC is authored **once, as reader chrome inside the shadow root**, and therefore renders on **both**
the content-script reader and the app-page reader pane. This is the product-correct call: the developer
persona (product spec §3) reads READMEs/docs **on `file://` and raw-git URLs** — the content-script
surface — and lists TOC as a killer feature there; an app-page-only TOC would gut the feature for its
primary user. §F5 lists the TOC under *Navigation & Reading UX*, a property of the reader, not of one
surface.

**Honest consequence (stated, not hidden — this is the M2-invariant tradeoff the kickoff flagged):**
- The M2 **content-script byte-identity (270,879 B)** was an M2-only invariant ("folder mode changed no
  render code"). 003 is a **reader/render feature**, so touching the reader is legitimate and expected.
  Byte-identity therefore becomes a **deliberate, measured, reported size change**, gated by:
  - **All M1 golden-file and regression suites stay green** (the rendered-document output is unchanged
    for a doc *with the TOC feature accounted for*; golden fixtures are re-baselined only where the TOC's
    presence is the sole, reviewed diff — never to paper over an unintended render change).
  - The new content-script and `pnpm zip` sizes are **re-measured and recorded** in progress.md /
    decisions.md, and stay under budget (≤5 MB packed, <2 MB zip — product spec §8).
- The alternative (app-page-only, preserving byte-identity + re-pin) was **rejected**: it denies the TOC
  to the exact surface the primary persona reads on. It is recorded here so the choice is visible, not
  silent.

*(If the human prefers to stage this — app-page-only first, content-script second — that is a
plan-time sequencing decision; the spec's scope is both, and the acceptance criteria below apply to both
surfaces unless a criterion names one.)*

---

## In scope
- **An in-reader TOC**, built from the rendered document's headings (`h1`–`h6`), living **inside the
  reader shadow root** as quiet, collapsible chrome — present on **both** reader surfaces via the shared
  `mount()` path.
- **Click-to-navigate** — clicking a TOC entry scrolls the reader's scroll container (the shadow host)
  to that heading via a **direct element reference** (`scrollIntoView`), **not** a URL hash (research
  §9: fragments don't enter shadow trees). Scroll is **smooth**, and **`auto` under
  `prefers-reduced-motion: reduce`**.
- **URL untouched** — TOC navigation scrolls **by element reference only** and shall **not modify the page
  URL or push a history entry** (no `#hash`, no `pushState`/`replaceState`). URL-hash / text-fragment
  deep-linking to a heading is the deferred permalink feature (§Out of scope), **not** part of 003.
- **Scroll-spy** — as the reader scrolls, the TOC highlights the entry for the section currently in
  view, using an **`IntersectionObserver` rooted on the shadow-host scroll container** (works for both
  surfaces because the container is the host in both; targets are the headings in the same shadow tree).
- **Collapsible heading levels** — nested levels can be expanded/collapsed within the TOC tree.
- **Resizable** — the TOC sidebar width is user-adjustable (drag), within sensible min/max bounds.
- **Keyboard toggle + operability** — a keyboard shortcut shows/hides the TOC; the TOC tree is fully
  keyboard-navigable with screen-reader landmarks (spec §F12). The shortcut must not collide with the
  existing Raw/Reading `\` shortcut, browser/OS shortcuts, or host-page shortcuts (same scoping
  discipline as `readerMode.ts` — exact key chosen at plan/design time).
- **Designed states for every heading shape** — a document with **no headings**, with **one** heading,
  with **empty / image-only / emoji-only** headings, with **duplicate** heading text, and with
  **non-monotonic** nesting (skips a level, starts at `h3`) each render a correct or gracefully-degraded
  TOC — **never blank, never a crash** (AGENTS.md #5). A no-heading document shows a designed
  "no sections" affordance or omits the TOC cleanly (decided at design time), never a broken sidebar.
- **Per-view TOC state** — open/closed and width are **per view**, not persisted, in 003 (consistent
  with M1's per-view remote-media opt-in and the `permissions:[]` reality on the content script).
  Persisting TOC preferences is spec 004 (settings); a *document-declared* initial state is deferred
  with the frontmatter feature (see below).

## Out of scope (resist — named as *deferred to later specs*, not designed here)
- **URL-hash / text-fragment deep links to headings; heading permalinks ("copy link to this heading")**
  (product spec §F5 ⭐ "Heading permalinks + deep links"). **Deferred** — a later build-order phase. This
  is *why* the shadow-DOM fragment gap (§9) does not block 003: 003 navigates by element reference, not
  by hash. When permalinks land, they will need heading **ids/slugs** in the sanitized DOM — which is a
  **security-reviewed change** (re-allowing `id`, a DOM-clobbering surface deliberately dropped from the
  sanitize allow-list in M1 — decisions.md 2026-07-14). 003 does **not** open that door: it needs no
  `id` on headings (§ acceptance).
- **In-document search with heading-context results** (product spec §F5 ⭐). Adjacent (it also reads the
  heading structure) but a distinct feature. **Deferred.**
- **Document mini-map** for long docs (product spec §F5 ⭐). **Deferred.**
- **Cross-file full-text search / project-mode relative-link navigation / backlinks** (§F5) — folder-
  and project-level navigation, already deferred by spec 002. **Not here.**
- **Frontmatter-driven TOC-state key** (product spec §F1 ⭐ "Frontmatter-driven render options — a doc
  can declare its own theme, width, TOC state"). **Deferred**, because **frontmatter is not parsed at
  all yet** (`src/render/parse.ts` loads no front-matter plugin); wiring a `toc:` key would balloon 003
  into building the whole YAML-frontmatter feature (§F1). 003 decides initial TOC state by a simple
  heuristic + the user toggle; the frontmatter key is named as the *intended future home* for a
  document-declared default, to land with the frontmatter-render-options feature.
- **Settings/theme persistence UI** (spec 004) — persisting TOC open-state / width across views.
- **GFM table-alignment restore** (carried from M1: map alignment to a class, never inline style). **Out
  of 003** — it is a table-rendering-correctness item with no relation to navigation; it stays a carried
  render item to be picked up where table work happens, not bundled into TOC to inflate scope.
- Anything that would add a `permissions` / `host_permissions` manifest entry (a TOC needs none; if a
  scope forces one, it is out of 003 by definition).

---

## 3. Architecture direction (WHAT the design must satisfy — the HOW is plan.md)

Not a design, but the constraints any 003 design must meet, so the plan is bounded:

- **TOC is reader-shadow chrome, built once.** It is composed by the reader (alongside the existing
  mode-toggle / network-indicator chrome) so both surfaces get it from the shared `mount()` path with no
  per-surface duplication — the same "one seam, every branch funnels through it" win M2 recorded.
- **Navigation is by element reference, never by URL hash.** The reader already holds the heading nodes;
  a TOC entry maps to its heading element and scrolls the host container to it. This sidesteps the
  shadow-DOM fragment gap (§9) entirely and needs **no heading `id`** — so the sanitize allow-list is
  **unchanged** (the M1 DOM-clobbering closure on `id` stays shut).
- **Scroll-spy roots on the shadow host.** `IntersectionObserver({ root: <shadow host scroll box> })`
  with heading targets in the same shadow tree. The container is the host on both surfaces, so **one
  code path** serves full-page and contained. `rootMargin` accounts for any top chrome so the "current"
  section is the one actually being read (tuned against a real doc, not guessed).
- **The TOC is consistent with the sanitized, rendered DOM.** Whichever heading-model source the plan
  chooses — post-processing the rendered shadow DOM for heading refs (the recommended direction, §8) or
  deriving from the parse token stream — the TOC **must** agree with the **sanitized, rendered** output:
  **every TOC entry resolves to a real heading node present in the document, and no entry exists for a
  heading absent from the rendered DOM** (e.g. one sanitize removed). The design must satisfy this
  invariant; a token-stream source in particular must be reconciled against post-sanitize output so it
  cannot list a heading the reader never painted.
- **Labels are built via `textContent`, never `innerHTML`.** A TOC entry's text is derived from its
  heading's text content only — no HTML string from heading markup is ever assigned to the DOM (AGENTS.md
  #3). No new unsanitized path is introduced.
- **The reader stays self-contained.** No TOC chrome escapes the shadow root into any host page; on the
  content script the page's own DOM is untouched beyond the existing hide-raw mechanism.

---

## 4. Capability & permission model — **`permissions: []` is preserved** (a hard criterion)

The TOC is pure in-document DOM + layout + `IntersectionObserver` + `scrollIntoView`. It touches **no**
manifest surface:

- **No new `permissions`, `host_permissions`, `webRequest`, `tabs`, `scripting`, or
  `web_accessible_resources`.** `permissions: []` from M1/M2 stays intact, and the
  `tests/manifest.test.ts` trust-pin (both engines) **must stay green** — stated as an acceptance
  criterion, not an assumption.
- **No PERMISSIONS.md capability-ledger change** — 003 adds no capability that can touch anything outside
  the already-rendered document. (If plan.md surfaces any manifest delta, that is a signal the scope has
  drifted out of 003.)

---

## 5. Non-functional requirements
- **Zero network by default (AGENTS.md #1)** — building, rendering, toggling, resizing, and scroll-spying
  the TOC issue **no network request**. This rides on the existing folder-mode / reader zero-network
  guards and is asserted at the request level in a real engine (§6 acceptance). `permissions: []` preserved (above).
- **Never a blank page / never-blank chrome (AGENTS.md #5)** — every heading shape in §In-scope (none,
  one, empty/image/emoji-only, duplicate, non-monotonic nesting, pathologically many, extremely long
  heading text) resolves to a correct or gracefully-degraded TOC and a fully-rendered document — never a
  blank sidebar, an overflowing page, or a crash. Long heading text truncates in the TOC without breaking
  layout.
- **Sanitization unchanged (AGENTS.md #3)** — TOC labels come from heading `textContent`; no new HTML
  string reaches the DOM; the sanitize profile and allow-list are unchanged (no `id` re-added).
- **Accessibility (spec §F12, §7)** — keyboard toggle + full keyboard navigation of the TOC tree;
  screen-reader landmarks/roles; visible focus (reuses the reader's `:focus-visible` ring); **smooth
  scroll gated on `prefers-reduced-motion`** (research §9) — `reduce` → instant scroll, honoring the
  reader's existing reduced-motion block. Designed states, not "functional now, pretty later" (product spec §7).
- **The document stays the hero (product spec §7)** — the TOC is low-contrast, collapsible, and quiet; it must not
  dominate the reading column or add reading-mode noise.
- **Performance — TO BE MEASURED (no un-measured thresholds; M1 retro standing rule).** 003 asserts **no**
  perf/scale number up front. The quantities that need bars — **TOC build+render time** as a function of
  heading count (analogous to the folder `treeView` render concern from 6.2: one DOM node per heading),
  and **scroll-spy overhead** during active scrolling on a large, many-heading document — are marked **to
  be measured** (protocol like `scripts/perf-first-paint.ts` / `scripts/perf-folder-tree.ts`), and any
  gate is set **from the measurement, not before it**. Two carried levers may be *considered* here only
  as measurement-gated candidates, never as guessed bounds:
  - the **chunked/virtualized *reader* render** (M1-carried large-doc first-paint lever) — relevant
    because scroll-spy runs over a large rendered DOM; **decide from a real-browser measurement**, do not
    assume the TOC needs it;
  - a **chunked/virtualized TOC-tree render** for a document with very many headings — the same class as
    the carried folder-tree lever; **decide from a measurement of the TOC render itself**, not asserted.
  Any bar written before its measurement is a bug per the M1 retro.

---

## 6. Acceptance

Per the **M1/M2 retro standing rules**: (a) every behavior **jsdom cannot observe** — real scrolling,
scroll-spy activation, smooth-scroll motion, `IntersectionObserver` firing, layout/resize — has a
**named real-engine test requirement** (real Chromium + Firefox, asserting the observable property, not
DOM shape), red-first and non-vacuous; (b) the **human manual gate is a named, required milestone-close
gate**; (c) **no acceptance threshold ships un-measured.**

*Checkboxes are unchecked — this is a draft spec; acceptance is defined, not met. plan.md assigns each to
concrete test files; jsdom-blind items live in `tests/browser/` per the standing rule.*

**Functional (verifiable in unit/jsdom where the property is DOM-shaped):**
- [ ] When a document with headings is rendered, the system shall build a TOC listing those headings in
      document order, nested by heading level, on both reader surfaces.
- [ ] When the user activates a TOC entry, the system shall scroll the reader's scroll container to that
      heading **via a direct element reference (no URL hash)** — verified structurally (the entry maps to
      the correct heading node); the actual scroll motion is a real-engine criterion below.
- [ ] When the user toggles the TOC via its keyboard shortcut, the system shall show/hide the TOC, and
      the shortcut shall not fire when focus is in an input/textarea/contenteditable, on modifier chords,
      or collide with the Raw/Reading `\` shortcut.
- [ ] When the user collapses/expands a heading level in the TOC, the system shall hide/show that
      subtree's entries.
- [ ] When a document has **no headings**, the system shall render a designed "no sections" state (or
      cleanly omit the TOC) and a fully-rendered document — never a blank sidebar or a crash.
- [ ] When headings are **empty / image-only / emoji-only / duplicated / non-monotonically nested**, the
      system shall produce a correct-or-degraded TOC with a sensible fallback label for a text-less
      heading — never blank, never a crash.
- [ ] TOC labels are derived from heading `textContent` only; no heading HTML is assigned via innerHTML
      (sanitize path unchanged).

**Real-engine (jsdom-blind — MUST be `tests/browser/`, real Chromium + Firefox, red-first, non-vacuous):**
- [ ] **Click-to-scroll** — activating a TOC entry actually moves the reader's shadow-host scroll
      container so the target heading is brought into view, in a real engine (jsdom has no layout/scroll).
      Verified on **both** the full-page (content-script) and contained (app-page) surfaces.
- [ ] **Scroll-spy** — scrolling the reader updates the highlighted TOC entry to the section in view,
      driven by an `IntersectionObserver` **rooted on the shadow-host scroll container**; asserted on both
      surfaces (the container is the host in both — proven, not assumed). Non-vacuous: highlight tracks
      scroll position, and does not stay pinned to the first entry.
- [ ] **Reduced-motion** — with `prefers-reduced-motion: reduce`, TOC-driven navigation scrolls
      **instantly** (no smooth animation); without it, smooth scroll is used. Asserted in a real engine.
- [ ] **Zero-network guard** — building/rendering/toggling/scroll-spying the TOC issues **zero** network
      requests (assert on Resource Timing / request-level, both engines), extending
      `tests/browser/*.network.browser.test.ts` discipline; non-vacuously (a control same-origin fetch
      still registers).
- [ ] **Resize** — dragging the TOC resizer changes its width within bounds and persists for the view
      (real-engine pointer interaction; jsdom can't lay out the drag).

**Trust / manifest:**
- [ ] The built manifest still declares `permissions: []` (no `permissions` / `host_permissions` /
      `webRequest` / `tabs` / `scripting` / `web_accessible_resources` added) — cross-checked against the
      generated manifest, both builds (`tests/manifest.test.ts` stays green).
- [ ] The **content-script byte size and `pnpm zip` size are re-measured and recorded** after the reader
      gains the TOC; both stay under budget (≤5 MB packed / <2 MB zip). All **M1 golden + regression
      suites stay green**; any golden re-baseline is solely the reviewed TOC diff, nothing else. This
      byte-size record is a size check only — it is **not** a first-paint proxy; the M1 first-paint gate is
      **separately re-run** (see Performance).

**Performance:**
- [ ] TOC build/render time (vs heading count) and scroll-spy overhead on a large many-heading document
      are **measured and recorded** (protocol like M1's perf scripts); a gate is set **from** the
      measurement. The chunked/virtualized reader-render and TOC-tree-render levers are decided from a
      **real-browser measurement**, not asserted. **[to be measured — no threshold asserted here]**
- [ ] **First-paint gate RE-RUN (a byte check is not a proxy).** Because the TOC adds work to the shared
      `mount()` path, the **M1 two-part first-paint gate** — as re-scoped in **decisions.md 2026-07-14**:
      **(a) a ≤50 KB nav→paint in <150 ms (measured)** and **(b) a 1 MB doc with no raw-flash on both
      engines + the reader painted in <1.7 s** — is **re-run after the reader gains the TOC** and confirmed
      **still passing**, or honestly re-measured and re-scoped per the no-un-measured-threshold rule (bound
      taken from the 2026-07-14 rescope, not re-guessed). The re-measured content-script + `pnpm zip`
      **byte** sizes (Trust block) are a size check and **do not** substitute for this first-paint **time**
      re-run.

**Milestone-close human gate (named, required — not removable by adding jsdom tests):**
- [ ] Human manual pass, **Chrome + Firefox, current build, Network tab open**, on **both** surfaces
      (a `file://`/raw-git doc via the content script **and** a file opened in the app-page reader pane):
      render a multi-heading doc → TOC appears → **click an entry scrolls to the section** → **scroll and
      watch the active entry track (scroll-spy)** → collapse/expand levels → **resize** the sidebar →
      **toggle via keyboard** → verify **smooth scroll** normally and **instant** under an OS
      reduced-motion setting → open a **no-heading** doc and a **pathological-heading** doc and confirm a
      designed state, never blank. Confirm **zero unexpected network**, no console errors, the document
      stays the hero. This gate has caught 5/5 milestone-shipping defects across M1+M2 in exactly the
      classes jsdom can't see (layout, engine timing, bytes-on-wire, wiring/visibility) — it is
      load-bearing for anything visual/scroll/engine-timing, which the TOC is end to end.

---

## 7. Deliverables of this milestone (for the plan to break down — not designed here)
The in-reader TOC component (shadow chrome) · heading extraction + nested model from the rendered DOM ·
click-to-scroll by element reference (reduced-motion-aware) · scroll-spy via host-rooted
IntersectionObserver · collapsible levels · resizable sidebar · keyboard toggle + a11y landmarks ·
designed states for every heading shape · both-surface integration through the shared `mount()` path ·
the real-engine + perf test suites above · re-measured/recorded content-script + zip sizes with M1
suites green.

---

## 8. Open questions / decisions deferred to plan.md
- **TOC placement per surface:** inside the shadow root on both — but *where* (left/right, over/beside the
  reading column) and how it coexists with the app page's own left folder pane (a second left rail?).
  Decide at design/plan time.
- **Keyboard shortcut choice:** which key toggles the TOC without colliding with `\` (Raw/Reading),
  browser/OS, or host-page shortcuts — decide with the same scoping rules as `readerMode.ts`.
- **Heading model source:** post-process the rendered shadow DOM (`querySelectorAll('h1..h6')` + hold
  refs) vs derive from the parse token stream. The DOM-refs approach needs no `id` and keeps sanitize
  unchanged (recommended direction, §3); confirm at plan time.
- **Initial open/closed heuristic:** always open, open only when the doc has ≥N headings, or open only on
  wide viewports — pick from the "document is the hero" principle; and whether the app-page and
  content-script surfaces default differently.
- **Chunked/virtualized render levers:** decide *from the real-browser measurement* (§5) whether the
  large-doc reader render and/or the TOC-tree render need virtualization — not before it.
- **Non-monotonic nesting policy:** how to nest a doc that skips levels or starts at `h3` (normalize to a
  flat-then-indented tree vs honor raw levels) — a small design call, made explicit at plan time.

---

## 9. Research findings & citations (verified 2026-07-15)

The scope's two load-bearing assumptions were **checked against primary/authoritative sources** and
both are **CONFIRMED**; the competitor scan sharpens the UX bar.

**Shadow-DOM fragment navigation — Peekover must scroll to headings itself (element refs, not `#hash`):**
- **Browsers do not follow a URL fragment (`#id`) into a shadow tree, and `:target` does not cross the
  shadow boundary** — an **open, unresolved** Web Components gap in current Chromium **and** Firefox,
  labeled "needs concrete proposal / needs consensus," with no native fix or PR activity. WICG
  <https://github.com/WICG/webcomponents/issues/924> ("There is no way to navigate to a fragment inside a
  shadow tree", open since 2021, still open 2026) and the original
  <https://github.com/WICG/webcomponents/issues/66>. → **Decision "navigate by element reference, not URL
  hash" CONFIRMED necessary.** Our headings are inside the reader's shadow root, so native hash-scroll
  and `:target` styling are unavailable; the reader holds the heading nodes, so
  `element.scrollIntoView()` is both the workaround and the reason 003 needs **no heading `id`** (keeping
  the M1 sanitize `id`-closure shut). The gap only affects *URL-hash deep-linking* — a deferred feature
  (§Out of scope).

**Scroll-spy with a non-viewport scroll container and shadow-DOM targets:**
- `IntersectionObserver`'s **`root` may be any scrollable element** (not just the viewport); pass the
  scrolling container as `root` and it observes intersection against that container's scrollport; **native
  IO works across shadow boundaries** when the root is a flat-tree ancestor of the targets (the polyfill
  historically did not — we ship no polyfill). MDN
  <https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API>; shadow-DOM polyfill
  caveat w3c <https://github.com/w3c/IntersectionObserver/issues/303>. → Our scroll container **is** the
  shadow host on **both** surfaces (`:host{overflow:auto}` full-page and contained), and the headings are
  flat-tree descendants of that host — so a **single** host-rooted observer serves both surfaces. Real-
  engine tests required (jsdom implements no layout/IntersectionObserver).

**Heading slugs (for the deferred permalink feature, not needed by 003's navigation):**
- GitHub-style slugs (lowercase, spaces→`-`, punctuation stripped, non-Latin kept, emoji dropped,
  duplicate suffixes `-1`/`-2`) are emulated by **github-slugger** —
  <https://github.com/Flet/github-slugger>. **markdown-it-anchor does *not* default to GitHub slugs**; to
  match GitHub you pass a `slugify` that wraps github-slugger, and it also adds `id` + `tabindex="-1"` to
  headings — <https://github.com/valeriangalliat/markdown-it-anchor>. → **Recorded for the future
  permalink/deep-link phase.** 003 does **not** adopt these: it needs no `id`, and adding `id` to the
  sanitized DOM is a **security-reviewed** change (re-opening the DOM-clobbering surface M1 closed —
  decisions.md 2026-07-14), deliberately out of 003.

**Reduced-motion obligation for smooth scroll:**
- Programmatic scroll (anchor/hash nav, `scrollIntoView`, `scrollTo`) is governed by CSS
  `scroll-behavior`; the accessible pattern gates smooth on
  `@media (prefers-reduced-motion: no-preference)` (or checks
  `matchMedia('(prefers-reduced-motion: reduce)').matches` before passing `behavior:'smooth'`), because
  motion can trigger vestibular symptoms. MDN scroll-behavior + CSS-Tricks "Smooth Scrolling and
  Accessibility" <https://css-tricks.com/smooth-scrolling-accessibility/>. → The reader's stylesheet
  already sets `:host{scroll-behavior:smooth}` and forces `scroll-behavior:auto` under
  `prefers-reduced-motion: reduce` (`src/theme/readerCss.ts`); TOC navigation **must** honor this — CSS
  smooth scroll inherits it automatically, and any JS `scrollIntoView` must branch on the media query.

**Competitor scan — how others do TOC (and what to beat):**
- **Markdown Viewer (simov)** ships an **optional** TOC (default **off**; enabled via Advanced Options),
  a sidebar built from headers with scroll and (users note) a scroll-spy-ish behavior; it is **plain and
  unthemed** — there are open requests to make the TOC honor dark mode, i.e. it is **not treated as a
  first-class themed reading surface**. GitHub <https://github.com/simov/markdown-viewer>. → **What to
  MATCH:** headings→sidebar, scroll-spy, jump-to-section. → **What to BEAT:** the TOC must be **on by a
  sensible default heuristic**, **fully themed** (light/dark/sepia, the reader's tokens), **collapsible +
  resizable + keyboard-operable**, and **quiet** (document-as-hero) — a designed reading surface, not a
  bolt-on panel. Peekover also uniquely serves the **content-script** surface (`file://`/raw-git) *and*
  the app page from one implementation.
- **Design-against note:** a TOC that (a) defaults on and steals reading width on a short doc, (b) can't
  be dismissed by keyboard, or (c) drops motion-sensitivity is the failure mode to avoid — the reduced-
  motion + document-as-hero + keyboard-toggle requirements above are the direct countermeasures.

---

## 10. How this maps to product-spec lines (traceability)
- **§F5 "Auto-generated TOC sidebar: scroll-spy, smooth scroll, collapsible levels, resizable, keyboard
  toggle"** → the whole of §In-scope (1:1).
- **§7.3 "Motion with meaning … TOC scroll-spy glide … `prefers-reduced-motion` respected"** → the
  smooth-scroll + reduced-motion criteria.
- **§7.2 "the document is the hero … chrome stays quiet, collapsible"** → the quiet/collapsible NFR.
- **§F12 accessibility** → keyboard operability + landmarks criteria.
- **§F1 ⭐ frontmatter-driven TOC state**, **§F5 ⭐ heading permalinks/deep links / in-doc search / mini-
  map** → named, deferred (§Out of scope), with the shadow-DOM-fragment and sanitize-`id` consequences
  recorded for the phase that picks them up.

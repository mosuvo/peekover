# 003 TOC / navigation — plan (Gear 3: the HOW)
<!-- Written after spec.md was approved at the spec gate (60cd12f · b2ab23f · d4040b0). Human-reviewed before tasks. -->
**Status:** draft — awaiting plan-gate approval  **Date:** 2026-07-15
**Live re-checks (2026-07-15):** MDN `scrollIntoView`/`scroll-behavior`, MDN IntersectionObserver, Docusaurus/MkDocs-Material right-TOC convention. Citations inline + §Sources.

This plan serves the approved WHAT; it does not re-decide it. Where implementation reality pushes back on
the spec, it is **flagged loudly** (§Reality pushback), not silently deviated from (C12).

---

## 0. Ground truth (Task 0)

- `git log -1 --oneline` → **`d4040b0 docs(spec): harden spec 003 — fix refs, add first-paint re-validation + URL/heading-source/user-story criteria (Gear 3 gate 1)`**
- `git status --short` →
  ```
  ?? peekover-src.zip
  ?? peekover.bundle
  ?? tests/fixtures/huge.md
  ?? tests/fixtures/remote-images-test.md
  ```
  (Untracked fixtures/artifacts **not staged** — per instruction.)
- progress.md **"Now"** line (verbatim, first sentence):
  > **M2 FULLY CLOSED (spec 002 — active-source foundation): code-complete AND human-gated.**
  and: *"**Active: `specs/003-toc-navigation/` (TOC / navigation — product spec §11 build-order item 3), Gear 3.**"*

---

## 1. Spec restatement (verbatim) + acceptance→proof map

The plan is diffable against the approved spec only if the spec is quoted, not paraphrased.

### 1a. In scope (verbatim)
- **An in-reader TOC**, built from the rendered document's headings (`h1`–`h6`), living **inside the reader shadow root** as quiet, collapsible chrome — present on **both** reader surfaces via the shared `mount()` path.
- **Click-to-navigate** — clicking a TOC entry scrolls the reader's scroll container (the shadow host) to that heading via a **direct element reference** (`scrollIntoView`), **not** a URL hash. Scroll is **smooth**, and **`auto` under `prefers-reduced-motion: reduce`**.
- **URL untouched** — TOC navigation scrolls **by element reference only** and shall **not modify the page URL or push a history entry** (no `#hash`, no `pushState`/`replaceState`).
- **Scroll-spy** — as the reader scrolls, the TOC highlights the entry for the section currently in view, using an **`IntersectionObserver` rooted on the shadow-host scroll container**.
- **Collapsible heading levels** — nested levels can be expanded/collapsed within the TOC tree.
- **Resizable** — the TOC sidebar width is user-adjustable (drag), within sensible min/max bounds.
- **Keyboard toggle + operability** — a keyboard shortcut shows/hides the TOC; the TOC tree is fully keyboard-navigable with screen-reader landmarks. The shortcut must not collide with the existing Raw/Reading `\` shortcut, browser/OS shortcuts, or host-page shortcuts (same scoping discipline as `readerMode.ts`).
- **Designed states for every heading shape** — no headings / one heading / empty / image-only / emoji-only / duplicate / non-monotonic nesting each render a correct or gracefully-degraded TOC — **never blank, never a crash**. A no-heading document shows a designed "no sections" affordance or omits the TOC cleanly, never a broken sidebar.
- **Per-view TOC state** — open/closed and width are **per view**, not persisted, in 003.

### 1b. §3 Architecture constraints (verbatim, condensed to the load-bearing clause of each)
1. **TOC is reader-shadow chrome, built once** — composed by the reader alongside the mode-toggle/network chrome so both surfaces get it from the shared `mount()` path with no per-surface duplication ("one seam, every branch funnels through it").
2. **Navigation is by element reference, never by URL hash** — needs **no heading `id`**; the sanitize allow-list is **unchanged** (the M1 DOM-clobbering closure on `id` stays shut).
3. **Scroll-spy roots on the shadow host** — `IntersectionObserver({ root: <shadow host scroll box> })`, heading targets in the same shadow tree; one code path for full-page + contained; `rootMargin` accounts for top chrome, tuned against a real doc.
4. **The TOC is consistent with the sanitized, rendered DOM** — **every TOC entry resolves to a real heading node present in the document, and no entry exists for a heading absent from the rendered DOM.**
5. **Labels are built via `textContent`, never `innerHTML`** — no HTML string from heading markup is ever assigned to the DOM. No new unsanitized path.
6. **The reader stays self-contained** — no TOC chrome escapes the shadow root into any host page.

### 1c. §4 Permission criterion (verbatim, condensed)
- **No new `permissions`, `host_permissions`, `webRequest`, `tabs`, `scripting`, or `web_accessible_resources`.** `permissions: []` stays intact and `tests/manifest.test.ts` (both engines) **must stay green** — an acceptance criterion, not an assumption.
- **No PERMISSIONS.md capability-ledger change** — 003 adds no capability that can touch anything outside the already-rendered document. Any manifest delta surfacing in the plan is a signal scope drifted out of 003.

### 1d. §6 acceptance checkboxes → where proven

| # | §6 acceptance (abbrev.) | Proven in | Level |
|---|---|---|---|
| F1 | Doc w/ headings → TOC listing them in doc order, nested by level, **both** surfaces | `tocModel.test.ts` (order+nest) · `tocView.test.ts` (both-surface shape) | jsdom |
| F2 | Activate entry → scroll container to heading via **direct element ref (no hash)** — structural map | `tocView.test.ts` (entry→heading-ref identity; `location.href`/history unchanged) | jsdom |
| F3 | Keyboard toggle shows/hides; **not** in input/CE/modifier chords; no `\` collision | `tocView.test.ts` (shortcut guards) | jsdom |
| F4 | Collapse/expand a level hides/shows that subtree | `tocView.test.ts` (`aria-expanded` + subtree hidden) | jsdom |
| F5 | **No headings** → designed "no sections" / clean omit + full document, never blank/crash | `tocView.test.ts` (0-heading → rail omitted) | jsdom |
| F6 | Empty / image-only / emoji-only / duplicate / non-monotonic → correct-or-degraded, fallback label, never blank/crash | `tocModel.test.ts` (label fallback + nesting policy fixtures) | jsdom |
| F7 | Labels from `textContent` only; no heading HTML via innerHTML (sanitize path unchanged) | `tocModel.test.ts` (label = textContent; `sanitize.ts` untouched — asserted by ALLOWED_ATTR unchanged) | jsdom |
| R1 | **Click-to-scroll** actually moves host scroll box; **both** full-page + contained | `tests/browser/tocScroll.browser.test.ts` | real (Cr+Fx) |
| R2 | **Scroll-spy** updates highlight to section in view; host-rooted IO; non-vacuous (tracks, not pinned to entry 1) | `tests/browser/tocScroll.browser.test.ts` | real (Cr+Fx) |
| R3 | **Reduced-motion** → instant scroll; without → smooth | `tests/browser/tocScroll.browser.test.ts` (emulate reduced-motion) | real (Cr+Fx) |
| R4 | **Zero-network guard** — build/render/toggle/spy = 0 requests; non-vacuous control fetch | `tests/browser/tocNetwork.browser.test.ts` | real (Cr+Fx) |
| R5 | **Resize** drag changes width within bounds, persists for the view | `tests/browser/tocScroll.browser.test.ts` (pointer drag) | real (Cr+Fx) |
| T1 | Built manifest still `permissions: []` (no new manifest surface) | `tests/manifest.test.ts` (unchanged, must stay green) | unit/build |
| T2 | Content-script + `pnpm zip` byte sizes re-measured & recorded, under budget; M1 golden+regression green; golden re-baseline is solely the reviewed TOC diff | close ritual (record in progress.md/decisions.md) · `tests/golden/*` green | measured + gate |
| P1 | TOC build/render time (vs heading count) + scroll-spy overhead **measured**, gate set from measurement; virtualization decided from real-browser measurement | `scripts/perf-toc.ts` (measured, **no threshold asserted**) | measured |
| P2 | **First-paint gate RE-RUN** (M1 two-part, per decisions.md 2026-07-14) still passing after TOC, or honestly re-scoped | `pnpm perf` re-run (existing harness) | measured |
| H1 | **Human manual gate**, Chrome+Firefox, Network tab, **both** surfaces — the named required milestone-close gate | human pass (§Sequencing step 6) | named gate |

Every §6 box maps to a concrete artifact; jsdom-blind boxes (R1–R5) live in `tests/browser/` per the standing rule.

---

## 2. Architecture & data flow

The **M1 render pipeline stays the single entry**: `mount(source, host, options)`. 003 is a **reader/render feature**,
so — unlike M2 — touching the reader is legitimate and expected (spec §Surface-scope). The change is **additive
chrome**: the reading column DOM/CSS (`.peekover-reader`) is left byte-identical, and the TOC is composed as a
sibling of the existing pills, exactly like the mode-toggle and network indicator.

### 2a. The ONE seam TOC composes through
`mount()` assembles a `children: Node[]` array and commits it with `shadow.replaceChildren(...children)`
(`src/render/mount.ts:118–125`). **That array + its single commit is the seam.** The TOC is added by one call
whose output is pushed into that same array — the same way `buildModeToggle(host)` is — **after** the reader
`root` is built (`root.append(tpl.content)`), so it can read the rendered headings from `root`. Because *both*
surfaces (content-script full-page and app-page `{contained:true}`) flow through `mount()` → this one array →
`replaceChildren`, the TOC is **one code path** for both, with zero per-surface branching. This is the M2
"one seam, every branch funnels through it" win, reused verbatim.

```
mount(source, host, {contained?}):
  html = sanitize(parse(source))                 # unchanged
  tpl.content ← html (inert) ; applyMediaPolicy  # unchanged
  root = <div.peekover-reader> ; root.append(tpl.content)   # headings now live in root
  ───────────────────────────────────────────────  NEW, at the seam:
  model = buildTocModel(root)                    # PURE: h1..h6 refs → nested TocEntry[]
  tocView = buildTocView(host, model, {contained})   # DOM: rail + spy + toggle + resize
  children = [ buildReaderStyle(),
               contained? containedStyle : —,
               buildModeToggle(host),
               …remote pills if blocked…,
               tocView?,          ←── omitted when model has < threshold headings
               root ]
  shadow.replaceChildren(...children)            # the seam — one commit, both surfaces
```

Heading refs captured from `root` **before** the commit stay valid **after** it: `replaceChildren` *moves* `root`
(and its heading children, node identity preserved) into the shadow tree. So every entry → a committed node, and
no entry exists for a heading not in `root` (sanitize already ran upstream). **§3 constraint 4 satisfied by
construction** — the model source IS the post-sanitize, about-to-be-committed DOM.

### 2b. Data flow of a TOC interaction
```
click / Enter on entry ─→ entry.headingRef.scrollIntoView({block:'start'})   # no behavior arg → CSS governs
                                                                              # (:host scroll-behavior:smooth,
                                                                              #  reduced-motion→auto — free)
host scrolls ─→ IntersectionObserver(root: host).callback ─→ set aria-current + .is-active on the entry
resize handle pointerdown→move ─→ set --toc-w on :host (clamped) ; pointerup ends   # per-view only
toggle key / rail button ─→ flip data-toc="open|collapsed" on host ; CSS shows/hides the rail
```
No URL mutation anywhere (F2 / In-scope "URL untouched"): navigation is `scrollIntoView` on a held ref — no
`location`, no `history`.

---

## 3. §8 open questions — resolved (decision + one-line rationale)

1. **Heading-model source → rendered-DOM refs (spec §3-recommended).** `buildTocModel(root)` runs
   `root.querySelectorAll('h1,h2,h3,h4,h5,h6')` on the built, post-sanitize `root` *before* commit and holds the
   element references. **Why:** needs no `id`, keeps `sanitize.ts` (`ALLOWED_ATTR`) byte-unchanged (the M1
   DOM-clobbering `id`-closure stays shut), and satisfies §3-constraint-4 by construction — the model is derived
   from the exact nodes that get committed, so a token-stream/post-sanitize reconciliation problem never arises.

2. **Scroll-to-heading → `element.scrollIntoView({block:'start'})` with NO `behavior` arg.** MDN: the default
   `behavior:'auto'` resolves to the **computed CSS `scroll-behavior`** of the scroll container. Our container is
   `:host`, which already sets `scroll-behavior:smooth` and forces `auto` under `prefers-reduced-motion:reduce`
   (`readerCss.ts:71,76–79`). So smooth-normally / instant-under-reduce composes **for free**, on both surfaces,
   with zero JS branching — because `:host` *is* the scroll container in both (full-page `position:fixed;inset:0`
   and contained `position:relative`, both `overflow:auto`). **No manual `scrollTo` offset math.** Vertical
   breathing room under any top chrome is handled by CSS `scroll-margin-top` on headings (container-relative,
   engine-correct), not a JS pixel calc. **Fallback (real-engine-selected):** if R3 shows an engine that does not
   honor `:host scroll-behavior` for `scrollIntoView`, switch to explicit
   `behavior: prefersReducedMotion() ? 'auto' : 'smooth'` (a `matchMedia('(prefers-reduced-motion:reduce)')`
   check, mirroring `reader.ts`'s `prefersDark()`). Primary path = CSS; this fallback is documented and gated by
   the real-engine test, not guessed.

3. **Scroll-spy → one `IntersectionObserver({root: host, rootMargin, threshold:0})`** over the heading refs.
   `rootMargin` uses the **negative-bottom-band** technique — `'0px 0px -70% 0px'` shrinks the detection zone to
   the top band of the scrollport so the "current" section is the one being read, not one scrolled past (MDN +
   established scroll-spy practice). **The `-70%` is a starting value tuned against a real doc** at implementation
   (spec §3/§5), not asserted. Edge handled: the **last/short trailing section** may never cross the top band — the
   observer tracks last-intersected and, at scroll-bottom, promotes the final entry, so the highlight can reach the
   last section. **Non-vacuous test (R2):** scroll the host to section-3's offset → highlight = 3 (not pinned to 1);
   scroll to top → highlight = 1; scroll to bottom → highlight = last. Root is `host` on **both** surfaces (proven,
   not assumed — the container is `:host` in both).

4. **Reduced-motion → resolved by (2):** JS passes no `behavior`, CSS `:host` reduced-motion block flips
   `scroll-behavior` to `auto`. If the (2)-fallback is taken, JS branches on
   `matchMedia('(prefers-reduced-motion:reduce)').matches`. R3 asserts instant-under-reduce and smooth-without in a
   real engine (Playwright `emulateMedia({reducedMotion})`).

5. **Keyboard shortcut → bare `t` (mnemonic: Table of contents), guarded exactly like `\`.** Guards
   (mirroring `installToggleShortcut`): only the bare key, no Ctrl/Cmd/Alt; ignored when focus is in
   input/textarea/select/contenteditable; only fires when a mounted reader **with a TOC present** exists;
   `preventDefault` only after we decide to handle. **Reconciling with `readerMode.ts`'s "no bare letters" note:**
   that note's stated risk is *host-site single-key handlers* (Gmail/GitHub-SPA 'g'-nav). Our content script
   matches **only `file://` and raw-git raw-text pages** — plain `text/plain`/`<pre>` responses with **no host JS
   keyboard handler** — and the app page is **our own surface**. So the specific collision `\` avoided does not
   arise for 003's match set; `t` is safe here and more discoverable. **Alternative offered at the gate:** the
   punctuation-purist choice is a bare backtick `` ` `` (no default browser action; caveat: dead-key on some intl
   layouts). Recommend `t`; this is the one genuine UX micro-call for the human to confirm at the plan gate
   (§For the human). **Host-resolution — see §Reality-pushback #1:** the shortcut resolves the active reader host
   via a small module registry, NOT `document.querySelector('peekover-root')` (which is inert on the app page).

6. **TOC placement → a RIGHT-side rail inside the shadow root, BOTH surfaces (one placement).**
   **Why right, and why it resolves the "second left rail" tension:** the app page already owns a **left folder
   pane** (light-DOM shell, `appShell.ts:__folders`); a left TOC would be a second left rail. Placing the TOC on
   the **right** keeps folder-nav (left, shell) and section-nav (right, reader shadow) visually distinct, and on
   the content-script surface a right "On this page" rail is the **established convention** — Docusaurus
   auto-generates its in-page TOC as a right sidebar; MkDocs-Material and GitHub's file outline do the same
   (competitor check, §Sources). Choosing right for *both* surfaces gives one implementation, no per-surface
   divergence, and dissolves the double-left-rail problem by construction. **Mechanics:** the rail is
   `position:fixed` chrome (content script) flipped to `position:absolute` under `{contained}` — the **exact
   proven pattern** the three existing pills use (`CONTAINED_CSS` fixed→absolute list); this keeps `.peekover-reader`
   column byte-identical (golden-friendly) and reuses the already-solved cross-engine containment. **Initial
   open/closed heuristic (a DESIGN decision, not a perf threshold):** present the rail only when the doc has
   **≥2 headings** (0 → omit entirely, the cleanest "document is the hero"; 1 → omit the rail, a single-entry TOC
   has no navigation value — this is the graceful degradation F5/F6 allow); when presented, **default open on a
   wide reader scrollport, collapsed-to-a-toggle on a narrow one**, measured on the **reader's own `:host` width**
   (not `window`) — which naturally makes the narrower app-page pane start collapsed more often, from one rule.
   The `≥2` count and the width breakpoint are design values tuned at implementation, **not** measured perf gates.

7. **a11y → `nav` landmark + nested list (NOT `role=tree`).** `<nav aria-label="Table of contents">` wrapping a
   nested `<ol>`; each entry is a `<button>`/link that scrolls; a level with children carries a disclosure
   `<button aria-expanded>`; the current section is marked `aria-current="location"`. **Why not `tree`:** a TOC is
   **wayfinding navigation**, which the ARIA APG models as a navigation landmark + list of links; `role=tree` is
   reserved for hierarchical *selection* widgets (that is correctly what the folder `treeView` uses). nav+list is
   the lighter, APG-correct pattern and gives screen-reader users a landmark to jump to. Focus uses the reader's
   existing `:focus-visible` ring.

8. **Chunked/virtualized render (reader render + TOC-tree render) → measurement-gated candidates; NOT built
   pre-measurement.** `scripts/perf-toc.ts` (modeled on `perf-first-paint.ts`/`perf-folder-tree.ts`) measures
   (a) TOC model-build + rail-render time vs heading count and (b) scroll-spy overhead during active scroll on a
   large many-heading doc; **P2 re-runs the M1 first-paint gate**. Any bar is set **from** those numbers, at task
   time. The suspect (per 6.2's analogy) is the rail laying out one DOM node per heading — decided from the
   real-browser number, never asserted now. **No threshold ships un-measured** (M1 retro standing rule).

9. **Non-monotonic nesting → stack-based nearest-shallower-ancestor; no synthetic nodes.** Walk headings in
   document order keeping a stack; each heading attaches under the nearest preceding heading of a **strictly
   shallower** level; a skipped level (h1→h3) does **not** create an empty h2 node — the h3 nests directly under
   the h1. A doc that starts at h3 (or any level) **normalizes its baseline to the shallowest level actually
   present**, so those become the top row. Deterministic, crash-free, sensible indentation for any shape. **Label
   fallback (F6):** `entry.label = heading.textContent.trim()`; if empty (image-only heading whose remote `<img>`
   became a media-policy placeholder, emoji-only stripped to nothing, or a truly empty heading) → a designed
   fallback (`"Untitled section"` / the heading's `Hn` + ordinal), never blank. Duplicate texts are allowed
   verbatim (no slug/`id`, so no dedup suffix needed — that is the deferred permalink feature's concern).

---

## 4. Files / modules to create or touch

**Create** (M1-style pure/DOM split — pure model separable from engine, as `tree.ts`/`treeView.ts` and
`classifyReaderOutcome` were):

| Path | Responsibility | In → Out | Kind |
|---|---|---|---|
| `src/render/tocModel.ts` | **PURE:** `buildTocModel(root: ParentNode): TocEntry[]` — query `h1..h6`, hold refs, build nested model (nearest-ancestor stack), compute label + fallback. No DOM writes, no engine. | rendered root → nested `TocEntry[]` | **pure** |
| `src/render/tocView.ts` | **DOM/engine:** build the right-rail `nav`+list chrome from the model; wire click/keyboard → `scrollIntoView`; host-rooted IO scroll-spy; collapse (`aria-expanded`); resize drag (`--toc-w`); registry-based toggle shortcut. Returns the rail node (or null when omitted). | `(host, model, {contained})` → rail `Node`\|null | DOM |
| `src/render/tocModel.test.ts` | jsdom: order, nesting policy, label fallbacks, every heading shape, consistency-with-root. | — | test (unit) |
| `src/render/tocView.test.ts` | jsdom (DOM-shape): rail present ≥2 / omitted <2, collapse hides subtree, nav/list/`aria-current` shape, shortcut guards, entry→heading-ref identity, no innerHTML, URL unchanged. | — | test (unit) |
| `tests/browser/tocScroll.browser.test.ts` | real Cr+Fx: click-to-scroll (both surfaces), scroll-spy tracking (non-vacuous), reduced-motion instant vs smooth, resize drag. | — | test (browser) |
| `tests/browser/tocNetwork.browser.test.ts` | real Cr+Fx: zero-network guard on build/toggle/spy (Resource Timing), non-vacuous control fetch. | — | test (browser) |
| `scripts/perf-toc.ts` | headless-Chromium perf harness: TOC build+render vs heading count; scroll-spy overhead. Measured, recorded — **no threshold**. | — | script |

**Touch** (minimal, additive):

| Path | Change | Note |
|---|---|---|
| `src/render/mount.ts` | Compose `buildTocView(...)` into the `children[]` at the seam, after `root` is built; `buildTocModel(root)` first. | The ONE seam; ~6 lines. |
| `src/theme/readerCss.ts` | Add TOC rail/list/twist/active/current/resizer rules to `READER_CSS` (tokens only — paper/ink/line/hl, `--muted`/`--faint`); add the rail selector to `CONTAINED_CSS`'s fixed→absolute list; add `scroll-margin-top` on `h1..h6`. | `.peekover-reader` column rules **unchanged** (golden-friendly). |
| `tests/manifest.test.ts` | **No edit** — must stay green (`permissions:[]`). | Listed so T1 is explicit. |
| `tests/golden/*` | Re-baseline **only** where TOC presence is the sole reviewed diff; column output stays byte-identical. | T2. |
| `docs/ai/progress.md`, `docs/ai/decisions.md` | Close-ritual: record re-measured content-script + zip sizes, first-paint re-run result, perf numbers, decisions. | T2/P1/P2. |

**Not touched (by design, and each is a trust signal):** `src/render/sanitize.ts` (no `id`, `ALLOWED_ATTR`
unchanged — §3-c2/F7), `src/render/parse.ts` (no frontmatter plugin — TOC-state key deferred), `wxt.config`/
manifest (no permission — §4), `docs/trust/PERMISSIONS.md` (no capability delta — §4; optionally extend its
zero-network *evidence* line to name TOC build/scroll/spy, but no ledger change). **If any of these needs an edit,
scope has drifted out of 003 — stop and flag.**

---

## 5. Libraries & why
- **No new runtime dependency.** TOC is pure DOM + `IntersectionObserver` + `scrollIntoView` + pointer events —
  all platform APIs already relied on. The M1 locked-minimal-deps posture holds; a dependency add would need
  explicit human approval (WORKFLOW.md §8.2) and is unwarranted here.
- **No slug/anchor library** (`github-slugger`, `markdown-it-anchor`) — those exist for the **deferred**
  permalink/deep-link feature and would re-introduce heading `id`s (a security-reviewed sanitize change, spec §9).
  003 navigates by element ref and needs none.
- **No IntersectionObserver polyfill** — native IO crosses shadow boundaries when the root is a flat-tree ancestor
  of the targets (spec §9, w3c/IntersectionObserver#303: the *polyfill* was the one that didn't). We ship none.
- **Reused unchanged:** `markdown-it`/`DOMPurify` transitively through `mount()`; no new parser/sanitizer surface.

---

## 6. Risks & unknowns (incl. **reality pushback** on the approved spec)

**Reality pushback — flagged, not silently absorbed:**

1. **The existing keyboard-shortcut host-resolution is inert on the app page — the TOC toggle must not copy it.**
   `installToggleShortcut()` resolves its target via `document.querySelector('peekover-root')`
   (`readerMode.ts:128`). The content-script host **is** `<peekover-root>` (`mountReader.ts:83`), but the
   **app-page reader host is a `<div class="peekover-app__reader__host">`** (`readerPane.ts` /
   `createReaderPane`) — so that query returns `null` and the existing `\` shortcut is **already inert on the app
   page today** (a latent 002 gap, not surfaced by 002's gate). Spec §In-scope + the H1 human gate require the TOC
   toggle to work on **both** surfaces. **Resolution:** `tocView.ts` registers each mounted reader host in a
   module-level `Set<HTMLElement>` (added in `mount()`), and one document-level `keydown` listener resolves the
   **active** host = the registered host containing `document.activeElement`, else the sole/last-registered host.
   This makes the TOC toggle work on both surfaces via one listener. **Scope call:** 003 does **not** retrofit
   `\` onto the registry (that touches `readerMode` + its tests for no 003 benefit); the `\`-app-page gap is
   **recorded** for a later settings/hardening pass. Flagged loudly here so the human sees the inconsistency
   (TOC toggle works app-page; `\` still doesn't) is deliberate, not an oversight.

2. **Byte-identity is deliberately spent (spec §Surface-scope already authorizes this).** M2's 270,879 B
   content-script invariant was M2-only. 003 touches the reader, so the content-script + zip sizes **change**;
   they are **re-measured, recorded, and kept under budget** (≤5 MB packed / <2 MB zip), M1 golden+regression stay
   green, and any golden re-baseline is solely the reviewed TOC diff (T2). Not a risk to eliminate — a tradeoff to
   **report honestly**, per the spec.

**Genuine unknowns (verification-gated, not guessed):**

3. **Does `scrollIntoView` honor `:host` `scroll-behavior` in both engines?** MDN says default `behavior:'auto'`
   uses the computed `scroll-behavior`; the container being the *shadow host* is the untested-by-us wrinkle. R3
   verifies; the §3-#2 `matchMedia` fallback is ready if an engine disagrees. **No src decision rides on an
   assumption — the real-engine test picks the path.**

4. **`rootMargin` tuning + trailing-section edge.** The `-70%` band and the last-section promotion (§3-#3) are
   tuned/verified against a real doc in R2; the non-vacuous assertion (tracks 1→3→last, never pinned) is the guard.

5. **Perf on pathological heading counts.** A doc with thousands of headings lays out that many rail nodes — the
   6.2-analogous suspect. `perf-toc.ts` measures it; virtualization is decided from the number, not now
   (§3-#8). Any silent cap (e.g. "collapse levels ≥4 by default") is `log()`-recorded if introduced.

6. **Media-policy interaction.** A blocked remote `<img>` inside a heading becomes an inert placeholder `<span>`
   upstream of `buildTocModel` (media policy runs on `tpl.content` before `root` is queried) — so the model sees
   the placeholder's `textContent` (alt/label or empty→fallback). Handled by F6's label fallback; noted so it is
   not rediscovered as a bug.

---

## 7. Test strategy

Per the M1/M2 retro standing rules: **jsdom-blind behavior lives in `tests/browser/` (real Cr+Fx), red-first,
non-vacuous**; DOM-shaped logic is jsdom/unit; **no threshold ships un-measured**; the **human gate is a named,
required, non-removable milestone-close gate**.

**Split:**
- **jsdom / unit** — anything DOM-shaped: model build + order + nesting policy + label fallbacks + every heading
  shape (`tocModel.test.ts`); rail present/omitted by threshold, collapse subtree, nav/list/`aria-current` shape,
  shortcut guards, entry→heading-ref identity, **no-innerHTML**, **URL/history unchanged** (`tocView.test.ts`).
  jsdom has no layout/scroll/IO, so these assert **structure**, never motion.
- **real-engine `tests/browser/` (both Chromium + Firefox)** — everything jsdom cannot observe:
  - `tocScroll.browser.test.ts`: **R1** click-to-scroll actually moves `:host` scrollTop, on **both** the
    `<peekover-root>` full-page host **and** the `{contained}` app-page host (drive `mountAppShell` with an
    in-memory folder source, exactly as `readerPaneContained.browser.test.ts:memorySource` does — runs on both
    engines, never skips); **R2** scroll-spy tracks (non-vacuous 1→3→last); **R3** reduced-motion instant vs
    smooth via `emulateMedia`; **R5** resize pointer drag changes width within bounds and holds for the view.
  - `tocNetwork.browser.test.ts`: **R4** zero requests on build/toggle/spy via Resource Timing, extending
    `remoteMedia.browser.test.ts`/`folderMode.network.browser.test.ts` discipline; **non-vacuous** — a control
    same-origin `fetch` still registers (proves the assertion can fail).
- **Red-first, non-vacuous** on every browser test (as `remoteMedia` was proven RED with 3 leaked requests):
  the scroll test must FAIL if the entry is wired to the wrong heading; scroll-spy must FAIL if it stays pinned to
  entry 1; the network guard must FAIL if a stray request fires.
- **Golden / size (T2):** M1 golden + regression suites stay green; re-baseline a golden only where the TOC's
  presence is the sole, reviewed diff. Re-measure and record content-script + `pnpm zip` bytes.
- **Perf (P1) — measured, not asserted:** `scripts/perf-toc.ts` (`pnpm perf:toc`), same protocol as
  `perf-first-paint.ts`/`perf-folder-tree.ts` (7 iters, cold discarded, median of warm 6), swept over heading
  counts; numbers recorded, gate set later.
- **First-paint re-run (P2) — named:** re-run the existing `pnpm perf` two-part M1 gate (decisions.md 2026-07-14:
  (a) ≤50 KB nav→paint <150 ms; (b) 1 MB no-raw-flash both engines + reader painted <1.7 s) **after** the reader
  gains the TOC; confirm still passing, or re-measure and re-scope honestly (bound taken from the 2026-07-14
  rescope, not re-guessed). The T2 byte re-measure is a **size** check and does **not** substitute for this
  **time** re-run.
- **Human milestone-close gate (H1) — named, required:** Chrome + Firefox, current build, Network tab, **both**
  surfaces: multi-heading doc → TOC appears → click scrolls → scroll-spy tracks → collapse/expand → resize →
  keyboard toggle → smooth normally / instant under OS reduced-motion → no-heading + pathological-heading docs show
  a designed state, never blank → zero unexpected network, no console errors, document stays the hero. This gate
  has caught 5/5 milestone-shipping defects in exactly the classes jsdom can't see; the TOC is visual/scroll/
  engine-timing end to end, so it is load-bearing.

---

## 8. Sequencing (each step founds the next; the real-engine test lands WITH its capability)

1. **Pure model + shape.** `tocModel.ts` + `tocModel.test.ts` (nesting policy, label fallbacks, every heading
   shape, consistency-with-root). No DOM, no engine — the crash-free foundation.
2. **Rail chrome + compose at the seam.** `tocView.ts` (nav+list, collapse, threshold omit) + `mount.ts` seam +
   `readerCss.ts` styles; `tocView.test.ts` (shape, collapse, aria, no-innerHTML, URL-unchanged, shortcut guards).
   **Lands with it:** `tests/manifest.test.ts` still green (T1 — trust gate first), M1 golden green.
3. **Scroll + scroll-spy + reduced-motion + resize (real engine).** IO wiring + `scrollIntoView` + resize drag;
   `tocScroll.browser.test.ts` on **both** surfaces, red-first. Tune `rootMargin` against a real doc here.
4. **Zero-network guard.** `tocNetwork.browser.test.ts`, red-first (non-vacuous control fetch).
5. **Perf measure + first-paint re-run.** `scripts/perf-toc.ts` run + recorded; `pnpm perf` re-run (P2); decide
   virtualization from the numbers (likely defer). Re-measure content-script + zip bytes (T2).
6. **Close:** record sizes/perf/decisions in memory; the named **human manual gate** (H1), Chrome + Firefox,
   Network tab, both surfaces. Retro.

---

## 9. For the human to confirm at the plan gate (the how-decisions I made)
1. **Keyboard key = bare `t`** (mnemonic; safe for our narrow content-script match set + our own app page), with
   the reconciliation of `readerMode`'s "no bare letters" note (§3-#5). Alternative: backtick `` ` ``. Confirm the
   key — this is the one genuine UX micro-call.
2. **Right-side rail, both surfaces**, resolving the app-page second-left-rail tension (§3-#6, competitor-cited).
   Confirm right-vs-left.
3. **Initial state heuristic** — present at **≥2 headings**; open on wide reader scrollport, collapsed on narrow;
   0→omit, 1→omit-rail (§3-#6). Confirm the design thresholds (they are design values, not perf gates).
4. **Not retrofitting `\` onto the new host registry** (§6-#1) — the TOC toggle works on both surfaces; `\` stays
   content-script-only, gap recorded for later. Confirm this scoping.
5. **Module shape** — 2 new `src/render/*` modules (pure `tocModel` + DOM `tocView`) + 4 tests + 1 perf script,
   `mount.ts`/`readerCss.ts` touched additively. Confirm the decomposition before tasks.md fixes it.

---

## Sources (live-checked 2026-07-15)
- MDN `Element.scrollIntoView()` — default `behavior:'auto'` resolves to computed CSS `scroll-behavior`:
  <https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView>
- MDN Intersection Observer API — `root` may be any scroll container; `rootMargin` grows/shrinks the detection
  zone: <https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API>
- Scroll-spy negative-bottom-band `rootMargin` technique (e.g. `0px 0px -70% 0px`): Maxime Heckel, "Scrollspy
  demystified" <https://blog.maximeheckel.com/posts/scrollspy-demystified/>
- Right-side "On this page" TOC convention (competitor UX): Docusaurus auto-generates the in-page TOC as a right
  sidebar — Sidebar docs <https://docusaurus.io/docs/sidebar> and TOC customization discussion
  <https://github.com/facebook/docusaurus/discussions/8039> (MkDocs-Material / GitHub file outline follow the same
  right-hand pattern). Contrast the spec's cited competitor simov/markdown-viewer (left, unthemed, default-off).
- Carried from spec §9 (already verified there, not re-fetched): WICG/webcomponents#924 (fragments don't enter
  shadow trees → element-ref navigation), w3c/IntersectionObserver#303 (native IO crosses shadow boundaries; the
  polyfill didn't).

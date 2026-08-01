# Progress — Peekover
*The file every session reads first. Keep the "Now" section honest.*
*Updated: 2026-07-27.*

> **Closed-milestone narrative lives in [`progress-archive.md`](progress-archive.md).** This file is the
> working set: what is true today, what is next, what is carried, and the current numbers. If you want the
> step-by-step evidence behind a closed milestone, follow the link from its close summary below.
> **Order is deliberate: what to do (Now · Up next · Blockers) comes before what to know (Closed
> milestones · Baselines).**

## Now (start here)

**M6 (spec 006 — snapshots + diff) closed 2026-07-27. M7 is IN IMPLEMENTATION: all three Gear-3 gates are behind it — `spec.md` PASSED gate 1 (`e09520f`, three revisions, §3.4/§9-2/§9-3 dispositions recorded there), `plan.md` PASSED gate 2 (`c44406a`, approved at `cab93c7` with four sub-decisions — the D-5 ledger copy, version-bump-uses-eviction, the `architecture.md` correction routed to group 9, and the §7-9 flip-cost re-routed to gate 3), and `specs/007-mermaid-diagrams/tasks.md` (28 tasks, nine groups) PASSED gate 3 (banked in `decisions.md`'s M7 GATE 3 entry — `66634fa`; the tasks file's "DRAFT awaiting gate 3" status line stays, by the gate-1/gate-2 precedent). TASK 1.1 IS DONE (`2159e5c`): `mermaid@11.16.0` added as the FIFTH production dependency, with its four supply-chain gates discharged. TASK 1.2 IS DONE (`1391118`): `src/render/diagramEngine.ts` — the ONE module naming `import('mermaid')` (a static string literal the scanner permits), the feature-detect that keeps a fence-free document from ever evaluating it, D-6 step 3's configuration, and `engineVersion()` sourced from a STATIC `mermaid/package.json` import per the D-3/D-13 amendment (`bddd5af`) — mermaid exposes no runtime version. Imported by NOTHING, so both bundles are md5-identical to 1.1's. TASK 1.3 IS DONE (`c7b3004`) — THE ABLATION, and GROUP 1 IS COMPLETE. The content-script bundle is md5-IDENTICAL both engines with `diagramEngine` made reachable by a scratch `appShell.ts` reference — mermaid never enters the gated path — and that null counts for something only because the negative control FIRED in the same run: the app page gained +3,349,685 B. mermaid emits as a SEPARATE LAZY ASYNC CHUNK (`chunks/mermaid.core-D7K4dyvy.js`, 34,946 B) behind a real `import()`, never statically inlined; the app chunk itself moved only +2,379 B (dynamic-import glue 1,971 · `diagramEngine`'s own code 375 · scratch artifact 29 · statement realign 4), decomposed to the byte with no unnamed residual. Both of 1.2's handoff items are discharged: the static `mermaid/package.json` import does inline the WHOLE package.json — 3,847 B, isolated by a second ablation — and the emitted output carries NO bare specifier and NO orphan chunk. These figures are ABLATION / SCRATCH-WIRED and are NOT the production figure (8.1 owned that; **DELIVERED at 8.1** — see § Baselines): `appShell.ts` is restored md5-identical, `diagramEngine` is again imported by nothing, and the committed baselines are UNCHANGED. Full note in § Baselines. TASK 2.1 IS DONE (`4d3df61`) — GROUP 2 IS OPEN. `sanitizeSvg()` is a SECOND NAMED sanitizer (D-1), not a configurable one: `SVG_ALLOWED_TAGS` / `SVG_ALLOWED_ATTR` / `SANITIZE_SVG_CONFIG` + `sanitizeSvg()`, sharing the DOMPurify singleton so the global `uponSanitizeAttribute` hook is INHERITED. Its `ALLOWED_URI_REGEXP` is **design C per the D-1/§2.1 AMENDMENT (`ff8f323`)** — a scheme-free regexp confined by `ADD_URI_SAFE_ATTR` to the reference attributes; §2.1's original literal `/^#/` is unimplementable against DOMPurify's global attribute gating (it would delete every coordinate in the diagram), and design C preserves both of §2.1's security properties exactly. `foreignObject` and `<style>` are denied BY ABSENCE, not by a FORBID list; `ALLOW_ARIA_ATTR: true` is the one deliberate config divergence (a11y, spec §5). Evidence, re-run from clean this session: the hostile corpus is red-first **9 of 9** under an identity passthrough, each red NAMING the surviving node (`<foreignObject width="100" height="100">`, `<use href="http://evil.example/payload.svg#x">`, `<style>@import url("http://evil.example/x.css")…`) — none is jsdom-neutralized-regardless; revert-and-fail (add `foreignObject` to `SVG_ALLOWED_TAGS`) reds **exactly 3** — that corpus case plus the two drift-guards designed to catch it — and no other corpus case. The DOCUMENT profile is BYTE-UNTOUCHED (the whole diff is one additive hunk from `:146`, zero `-` lines), pinned by a source-text assertion PROVEN TO FIRE: a scratch entry in the document `ALLOWED_TAGS` reds it naming the const. So markdown source still cannot produce an `<svg>`. The profile tree-shakes to zero on the content script — 315,671 B md5-identical BOTH engines — and that holds only because of the `/*#__PURE__*/ …slice()` form, ABLATED and re-measured this session: spreads take it to 316,567 B (+896 B). TASK 2.2 IS DONE (`a6d2226`) — ★ GROUP 2 IS COMPLETE. `tests/browser/diagramSanitize.browser.test.ts` proves, in REAL Chromium AND Firefox (5 tests × 2 engines, 10/10), what the §2.2 AMENDMENT (`b19c068`) reframed the task around: the SVG profile's `data:` denial is ALLOW-LIST-DRIVEN and hook-INDEPENDENT. A fresh NO-HOOK DOMPurify instance (`DOMPurify(window)`, asserted a distinct object and asserted hook-free — `removeHook` returns `undefined` on an empty stack) is EQUALLY clean on `SANITIZE_SVG_CONFIG`; `data:` on `xlink:href` does not survive `sanitizeSvg`; the `#dot` fragment on that same attribute DOES survive, so neither result is passing on an empty tree; and the sweep itself is proven to FIRE on the raw payload (2 data: URIs reported). The inherited hook IS registered on the singleton `sanitizeSvg` calls — pinned behaviourally by a temporary observer hook that fires and sees `xlink:href` (plan §4-3's second half, true regardless of how `dompurify` resolved at 1.1) — but it is labelled in the test as an INHERITANCE-BY-CONSTRUCTION pin, NOT a security discriminator: ★ THERE IS NO "remove the hook → `data:` reds" REVERT-AND-FAIL FOR THIS PROFILE, BECAUSE THE HOOK IS A PROVEN NO-OP HERE (`b19c068`: all five `_isValidAttribute` acceptance branches closed). That absence is THE FINDING, not a missing check. The revert-and-fail is the WIDENING BOUNDARY and it has teeth in both engines: adding the single `DATA_URI_TAGS` member `image` to `SVG_ALLOWED_TAGS` reds the no-hook guard naming the survivor — `expected [ '<image href="data:text/html,y">' ] to deeply equal []` — in Chromium AND Firefox, while the HOOKED `sanitizeSvg` still strips it (b19c068's GATE B asymmetry, reproduced live). Under the same widening the unit suite reds **exactly 5**: that mirror guard plus 2.1's two drift-guards (the exact-set and denied-by-absence tests), the `<image href>` corpus case, and the new `image`-denied-by-absence pin — the (c) guard is among them, and `sanitize.ts` was restored FROM THE `cp` COPY, md5-identical. A jsdom mirror lands in `sanitize.test.ts` with the honest in-file note that the BROWSER test is authoritative (jsdom is blind to the real-engine reparse/mXSS cases — decisions.md 2026-07-14). One stale `sanitize.ts` comment that `b19c068` falsified (it claimed the inheritance "is exactly the property a future `removeHook` breaks silently") is re-anchored to the truth; the edit is COMMENT-ONLY and proven BYTE-NEUTRAL — both engines' content script (315,671 B) and app chunk (`app-CEHD9mSZ.js`, 361,500 B) are md5-IDENTICAL before and after. **THE D-6 `secure` HARDENING IS DONE (`3d7c8ed`)** — the config change the D-6 ADDENDUM (`16c7790`) licensed but deliberately did not make; it is the addendum's implementation, NOT a numbered tasks.md task, and it does not move the group-3 pointer. `DIAGRAM_ENGINE_CONFIG` now carries `secure` = mermaid's own six defaults PLUS `themeCSS`, `fontFamily`, `altFontFamily`, `themeVariables`, so a `%%{init}%%` directive can no longer inject fetching CSS into the engine's generated `<style>` before `sanitizeSvg` runs. `securityLevel`/`htmlLabels`/`startOnLoad` are byte-identical — the diff is one added key plus its rationale. Proven RED-FIRST in `tests/browser/diagramSecure.browser.test.ts` (9 tests × 2 engines, 18/18) over BOTH routes the addendum names, each with its own loopback URL and each red against the un-hardened config in the SAME run: **ROUTE 1 `themeCSS`** (an ORDINARY `background-image:url(…)`, NOT `@import` — `@import` is dropped by mermaid's own constructed-stylesheet parse and would have passed VACUOUSLY) and **ROUTE 2 `fontFamily`** (the brace-balanced `:root{--mermaid-font-family}` interpolation `sanitizeCss` does not catch). Pre-change, against the committed config, all three payloads landed in `<style>` AND reached the wire in Chromium AND Firefox — `…/d6-1/evil1.png`, `…/d6-3/evil2.png`, `…/d6-5/evil3.png`; post-change every hardened arm observes ZERO requests. The instrument is proven live by a benign `%%{init:{"theme":"dark"}}%%` control that visibly re-themes in the same run (`#ECECFF` gone), so "no fetch" is a RESULT, not a dead probe. The list GUARDS ITSELF (a `%%{init:{"secure":[]}}%%` re-widening directive does not fetch — `sanitize()` iterates `['secure', ...siteConfig.secure]`), our own `initialize()`-set `themeCSS` STILL APPLIES (the DIRECTIVE route is closed, not the feature), and the ABLATION holds: a config passing mermaid's DEFAULT six explicitly STILL fetches ROUTE 1 (`…/d6-6/evil4.png`), so the four ADDED keys are causal rather than the act of passing an array. `themeVariables` carries the one accepted cost the addendum priced (author-directive themeVariables stop applying; the effective theme is OURS — §3.7/D-7). ★ **BYTE DELTA: ZERO, on BOTH bundles and BOTH engines** — app chunk `app-CEHD9mSZ.js` 361,500 B and content script 315,671 B are md5-IDENTICAL before and after (Chromium `172e88b6…`/`c8251651…`, Firefox `172e88b6…`/`b597b1b4…`). ★ **This is NOT the "app chunk moves" the task anticipated, and the reason matters: `diagramEngine.ts` is still imported by NOTHING, so it is on NEITHER bundle graph and the `secure` array cannot cost bytes yet.** Confirmed with a FIRING CONTROL rather than a bare grep (an identifier grep over a minified bundle reads 0 everywhere): `peekover-remote` hits 8× and `DOMPurify` 1× in the same file where `language-mermaid`, `hasDiagramFence`, `mermaid` and `startOnLoad` all read 0. The real cost lands when 3.1/3.2 wire the enhancer — 8.1 owned the production figure and **has now measured it** (§ Baselines). ★ **STILL OWED — this closes a ROUTE, not the WINDOW: task 3.3's real-engine zero-network guard on D-6's measurement window is UNCHANGED and still outstanding.** A config that provably closes one directive route is not a proof that the render window is clean, which is the entire point of D-6's "not by construction". **THE D-1/D-6 OPTION-B IMPLEMENTATION IS DONE (`367d051`) — ★ `ff8f323`'s FIRST DOWNSTREAM FINDING IS DISCHARGED IN CODE, AND GROUP 3'S `<style>` BLOCKER IS CLOSED.** Like the D-6 hardening it is the ADDENDUM's implementation (`0de27f3`), NOT a numbered tasks.md task, so it does not move the group-3 pointer. `SVG_ALLOWED_TAGS` now admits `style` — reversing 2.1's denial for that element ONLY — and `cleanSvgCss` is the first procedural filter beside the allow-list: it strips any `url(` TOKEN whose target is not a `#`-fragment and any at-rule but `@keyframes`, preserving internal `url(#…)` and the `edge-animation-frame`/`dash` keyframes mermaid emits unconditionally. **Coverage is TOKEN-scoped, not property-scoped** — the reproduced property set already runs to 19 open-ended spellings, so a property allow-list is one CSS release behind by construction. **MECHANISM: an in-repo default-deny scan over a DECODED, comment-free view, NOT the platform `CSSStyleSheet`+`replaceSync`** — the platform parser is browser-only (jsdom has none, so the pass would silently no-op there) and a CSSOM rule-walk must re-serialize, dropping every declaration the host engine does not understand. ★ **The decoded text is NEVER emitted**: cuts are found in view coordinates and excised from the ORIGINAL, because `content:"\3c /style\3e…"` decodes to a literal `</style>` and an HTML-namespaced `<style>` serializes RAW. Escapes that decode to a STRUCTURAL character become a sentinel, so `\28` cannot fabricate a function-open the CSS parser never saw. The pass runs to a FIXPOINT and fails CLOSED. **NO NEW DEPENDENCY** — the addendum's lean held. Proven RED-FIRST in `tests/browser/diagramStyleCss.browser.test.ts` (18 tests × 2 engines, 36/36) with the pass NEUTERED and restored FROM THE `cp` COPY: **every GREEN arm reds in BOTH engines (18/18 failures, exactly the green arms)** while every RED/control arm still passes. Each lane ADOPTS the artifact into the LIVE document and watches the wire — string-stripping is necessary, not sufficient. All four obfuscation lanes reproduce and are closed: ★ the CSS escape `u\72 l(` **(red evidence: `.p-css-2{background-image:u\72 l(http://…/escape.png)}` surviving with a fetch — the lane a naive `/url\(/` MISSES and the one that decides the mechanism)**, case `URL(`, interior whitespace, both quote forms, plus protocol-relative, `data:`, `@import`, and a bare-string `image-set("…")` (BEYOND the reproduction's surface — a fetch with no `url(` token in it at all, denied whole). ★ **THE LIVE CONTROL IS IN EVERY LANE'S OWN STYLESHEET**: a benign `url(#gradA)` and `@keyframes` survive the same `<style>` the payload was in, so "zero requests" is a RESULT and not an over-strip — without it option B would have bought nothing. A REAL mermaid render passes through **byte-identical** (`cleanSvgCss` is the identity on a clean sheet) with both keyframes intact. ★ **A HARNESS FINDING WORTH MORE THAN THE LANE IT CAME FROM: in FIREFOX, parsing `@import url(X)` into ANY inert document — a bare `new DOMParser().parseFromString` is enough — CONSUMES the load for X; no request reaches the wire and a later adoption of that same X is NEVER RETRIED.** Since sanitizing a payload IS such a parse, routing the `@import` positive control through the no-pass sanitizer made it read NO-FETCH in Firefox while the route was wide open — a control that reads empty when the defect is live. Measured with byte-identical strings from two origins (hand-written FETCHES, `DOMPurify.sanitize`-produced does NOT, Firefox only; Chromium fetches both). The `@import` live-route arm therefore adopts markup no sanitizer has touched. ★ **BYTE DELTA: ZERO — content script 315,671 B md5-IDENTICAL both engines** (`c8251651…` / `b597b1b4…`), app chunk `app-CEHD9mSZ.js` 361,500 B, and that null is NOT vacuous: the fence is held by registering the hook INSIDE `sanitizeSvg` and removing it in `finally` rather than at module scope, ABLATED in the same session — a module-scope `addHook` is a side effect the bundler must retain and takes the content script to 318,470 B (**+2,799 B**, with `image-set(` appearing in the bundle). 2.1's four tests are updated: the exact-set gains `style`, the denied-by-absence loop drops it, the `@import` case is RE-AIMED (the ELEMENT now stays, so the RULE must go — it used to pass because the element was dropped, exercising no CSS handling at all), and the corpus sweep gains a SECOND predicate over `<style>` TEXT, because the attribute sweep structurally cannot see CSS and that row would otherwise have passed while the artifact carried a live `@import`. The DOCUMENT profile is untouched and its source-text pin is green. **TASK 3.1 IS DONE (`1e09164`) — ★ GROUP 3 IS OPEN, AND THIS IS THE FIRST CODE IN THE TREE THAT PUTS DIAGRAM STRUCTURE IN THE LIVE DOM.** ★ **SCOPE, DECIDED FROM tasks.md AND STATED BECAUSE THE BYTE ACCOUNTING TURNS ON IT: 3.1 DOES NOT WIRE THE ENGINE.** `diagramEngine.ts` is absent from §3.1's Files list and present in §3.2's; §3.1's verify names no SVG, no adoption and no `sanitizeSvg`; its byte check names ONLY the `READER_CSS` delta, and a ~3.3 MB lazy chunk entering would be the headline byte event of the milestone. Decisive confirmation from the tree rather than from reading: `diagramEngine` is imported by NO production module, so a single import from the enhancer — even for the selector constant alone — would make it reachable from the app-page graph and MATERIALISE mermaid's chunk. It is therefore deliberately NOT imported: `DIAGRAM_FENCE_SELECTOR` is re-declared in `diagramEnhancer.ts` and the duplication is PINNED by a unit test that imports both constants and asserts equality (a test import costs no bundle bytes). `src/render/diagramView.ts` owns D-15's structure and its three states (`pending` / `rendered` / `failed`) and `src/render/diagramEnhancer.ts` owns the SYNCHRONOUS prologue; `markDiagramRendered` takes a NODE, never a string, so 3.2 hands it `mount.ts:131-133`'s adopted `<template>.content` and no innerHTML exists anywhere in either module to reach around the D-1 profile. Wired at BOTH D-12 sites from ONE shared function: `readerPane.ts:179` after its committed `mount`, and — the seam that had no consumer until now — the `render` closure `appShell.ts` passes into `createWatchController` (`watchController.ts:449`), which every caller had taken the `mount` default for. **`contentWatch.ts` still passes no `render` and is byte-untouched — that omission IS the §3.2 fence.** ★ **THE CONTENT-SCRIPT DELTA IS +303 B AND IT IS EXACTLY THE CSS, WITH ZERO CODE** — 315,671 → **315,974 B**, identical on BOTH engines, and 303 B is precisely the byte length of the `READER_CSS` block added (`git diff` of the added lines, counted). The decomposition is proven by a FIRING CONTROL rather than a bare identifier grep: with the enhancer UNGATED into `mount()` — the one function both surfaces share, which is the accident rows 2+3 guard against — the same build reads **316,554 B (+883 B)** and `peekover-diagram` appears **3×**; gated, it appears **2×**, both of them the CSS selectors, and `language-mermaid` reads 0. **No mermaid chunk exists in either output** — `chunks/` holds one file. App chunk `app-CEHD9mSZ.js` 361,500 → `app-BDQ8clk9.js` **362,293 B (+793 B)** = the same 303 B of shared CSS + **490 B** of enhancer, view and two-call-site wiring. Both §3.1 red-firsts were run and both fired: ★ **ROW 4 INVERTS AND THE ABLATION PROVES IT** — placing the `<figure>` OUTSIDE `.peekover-reader` (the direction four sibling suites assert for reader chrome) reds the containment assertion in Chromium AND Firefox, 4 failures, **while the golden diff stays EMPTY and the golden suite stays green (10/10)**, which is exactly why the assertion is written rather than transcribed; **ROWS 2+3** red-first by the ungate above reds the content-surface assertions in both engines while the app-page arm stays green. `diagramView.ts` and `mount.ts` were both restored FROM THE `cp` COPY, md5-identical, and **`mount.ts`'s diff is EMPTY** — 007 still touches it at zero sites. Coverage: 14 unit tests (`src/render/diagramEnhancer.test.ts`, real `mount()` output, not a hand-mocked tree) + 8 browser tests × 2 engines (`tests/browser/diagramRender.browser.test.ts`), including the two assertions jsdom structurally cannot make — the source `<pre>` computes `display:none` after the flip **while staying connected and still holding its source text** (both halves, with a visible-before control), and row 5's no-occlusion check against real paragraph rects at a wide viewport. Row 18's placeholder is `aria-hidden`. The untrusted-source rule is asserted with a payload that WOULD inject if assigned as markup (`<img src=x onerror=…>` plus a `</pre><script>` break-out): it round-trips through `textContent` byte-for-byte and materialises no `img` and no `script`, with a control proving the same string DOES produce an `<img>` when parsed into an inert `<template>`. One seam fact pinned rather than trimmed: markdown-it's fence text carries a TRAILING NEWLINE, so `diagramSourceOf` returns `source + '\n'` — 3.2 hands that to the engine as-is rather than this module silently editing the source it only reads. ★ **STILL OWED, UNCHANGED AND NOT ADDRESSED HERE: task 3.3's real-engine zero-network guard on D-6's measurement WINDOW.** 3.3 inherits this arc's harness lessons and should not re-derive them: the FIREFOX INERT-PARSE GOTCHA (`367d051` — parsing `@import url(X)` into any inert document CONSUMES the load for X and a later adoption is never retried, so a fetch control routed through a sanitizer reads NO-FETCH while the route is wide open; adopt markup no sanitizer has touched) and ADOPT-AND-WATCH-THE-WIRE (string-stripping is necessary, not sufficient — every lane must adopt into the LIVE document and observe requests, with a benign live control in the same stylesheet so "zero requests" is a result and not a dead probe). **TASK 3.2 IS DONE (`763f94d`) — ★ THE MERMAID LAZY CHUNK EXISTS FOR THE FIRST TIME, AND THE CONTENT SCRIPT DID NOT MOVE ONE BYTE.** The enhancer's ASYNC body: the engine is loaded THROUGH `diagramEngine.loadDiagramEngine` (D-13's single `import('mermaid')`, no second one added), each fence is rendered into OUR OWN offscreen container (D-6 step 1 — removed on our own `finally`), the returned STRING goes through `sanitizeSvg` → a `<template>`'s innerHTML → adopt `tpl.content` (`mount.ts:131-133` verbatim), and `markDiagramRendered` flips D-15. **The container is LIVE, in-document AND IN THE LIGHT DOM by necessity** — measurement needs a browsing context, and the engine locates its own temp elements with document-scoped selectors that do not pierce a shadow root. Renders are SEQUENTIAL because the container is shared and mermaid empties it at the top of every call (`svgContainingElement.innerHTML = ''`, `mermaid.core.mjs:1263`). `bindFunctions` is never called. 3.1's duplicated `DIAGRAM_FENCE_SELECTOR` is COLLAPSED — the enhancer now re-exports diagramEngine's, so the drift the equality pin guarded is unrepresentable. Two supporting changes tasks.md §3.2 requires: `suppressErrorRendering: true` joins `DIAGRAM_ENGINE_CONFIG` (§3.8's "mermaid's own injected error graphic is suppressed" as CONFIGURATION — without it a parse failure draws the bomb into the container before throwing, `mermaid.core.mjs:1289,1308`; the key is already in the hardened `secure` list, so a `%%{init}%%` directive cannot turn it back on), and `markDiagramFailed` now REQUIRES a reason and inserts §4's inline marker (`p.peekover-diagram-error`, `textContent`) into the slot the removed placeholder vacated. ★ **THE HEADLINE BYTES.** The content script is **315,974 B and md5-IDENTICAL to 3.1's on BOTH engines** (Chromium `033879be…`, Firefox `1f15a58d…`) — the engine never reached the content-script graph and 3.1's `contentWatch.ts` fence (no `render` passed) held. `chunks/` went from **ONE file to ONE HUNDRED**: mermaid's lazy graph is **99 chunks / 3,347,306 B** behind exactly **one** `import(\`./mermaid.core-DLWca8Az.js\`)` (34,946 B entry), never statically inlined, and the app chunk carries NO static import of any sibling chunk. The app chunk itself moved **362,293 → 370,387 B (+8,094)**, decomposed to the byte by FOUR one-variable ablations with no unnamed residual: **4,096** the SVG sanitizer profile now reachable for the first time (`sanitizeSvg`→identity: 366,291) · **2,049** dynamic-import glue + the 99 chunk descriptors (`import('mermaid')`→rejecting stub: 368,338, and `chunks/` falls back to ONE file — the causal control) · **1,304** the enhancer's async body + statement realign · **373** §3.8's marker (`markDiagramFailed` reverted to its 2-arg form: 370,014) · **272** `diagramEngine`'s own payload, the D-6 config object with its hardened `secure` list and the fence gate (stubbed: 370,115). Sum = 8,094 exactly. **A ladder build confirms the direction: with 3.1's enhancer restored the app chunk is 362,293 B and the same chunk HASH — every one of these bytes is 3.2's.** Confirmed with a FIRING CONTROL rather than a bare grep: `securityLevel` and `suppressErrorRendering` read 2× each, `peekover-diagram-measure` 1×, `htmlLabels` 1× in the app chunk and **0× on the content script**, and mermaid's own `Syntax error in text` lives in `chunks/mermaid.core-…` and reads 0 on the content script — while `data-diagram` reads **1** there (3.1's CSS rule), which is what proves the content-script grep FIRES and the zeros are results. ★ **These are this task's ordinary `pnpm build` figures, NOT the production milestone figure — 8.1 owned the § Baselines re-measure and **has now run it**; that table was UNCHANGED here.** ★ **THE FIRST REAL-ENGINE PROOF OF OPTION B, AND IT PASSES:** driven through the PRODUCTION path with nothing injected (`createReaderPane` → `select()` → `mount()` → `enhanceDiagrams` → the real `import('mermaid')`), the adopted `<style>` arrives **INERT AND STILL STYLING** — `@keyframes edge-animation-frame` and `dash` intact, `style.sheet.cssRules.length > 0`, every surviving `url(` a `#`-fragment, no `@import`, no `@font-face`, no `https?:`. `cleanSvgCss` had until now only met payloads we wrote for it. The adopted subtree carries no `foreignObject` and the source `<pre>` computes `display:none` while still holding its text. **§3.8's failure paths, each with a success control that HIDES the source on the SAME harness:** parse/render (a genuinely unparseable fence — the OTHER diagram in the document renders normally, the marker names it, and no empty figure is left: §4's "every other diagram… normally"), **sanitize rejection — the latest-moment case D-15 is shaped for** (the engine SUCCEEDED, asserted on its raw output, and the artifact then fails the profile: nothing survives, so there is nothing to adopt and the retained `<pre>` is simply still there), and engine-load (loader rejects; both fences visible, nothing stranded). ★ **SCOPE BOUNDARY, TAKEN FROM tasks.md RATHER THAN ASSUMED: §3.2's Verify names parse/render and sanitize rejection; ENGINE-LOAD is group 6's — its heading is "the two failures groups 3–5 cannot reach" and 6.1 owns the full proof** (no stranded placeholder, reader interactive, its own revert-and-fail). 3.2 ships the code path and a modest arm; it does not absorb 6.1. **REVERT-AND-FAIL, and it names the count in the defect's own units:** removing the per-fence catch reds 4 (2 tests × 2 engines) with *"enhancement never completed: 2 unrendered figure(s) and 2 fence(s) left pending, of 2 enhanced fences"* — one bad fence takes the whole document's enhancement down, which is exactly the claim the catch exists to make false; `diagramEnhancer.ts` restored FROM THE `cp` COPY, md5-identical (`508ead9a…`). The container's lifetime is asserted BOTH ways — observed PRESENT mid-render from the DOCUMENT (not from the argument we were handed) and absent afterwards, absent too when the render throws, with no engine temp element orphaned — because an empty tail is not an empty instrument. `bindFunctions` records 0 calls with a control proving the spy would have recorded one. Adoption-not-innerHTML is proven on REAL engine output with a `<script>`+`<img>` payload appended to it: neither materialises and `window.__peekoverAdoptLeak` stays undefined, while the same string in an inert `<template>` DOES produce both. D-12 parity holds on the RENDER path from both call sites. Coverage: **unit 631 → 643**, **browser 709 → 729 passed / 15 skipped** (10 new browser cases × 2 engines). One harness lesson banked for 3.3: the browser suite's `afterEach` now DRAINS in-flight renders, because the measuring container lives in `document.body` by necessity and a previous test's stray one reads as the next test's. `mount.ts` diff EMPTY (007 still touches it at zero sites), `sanitize.ts` and `contentWatch.ts` byte-identical, golden EMPTY, manifest 2,975 B, `permissions: []` both engines, tasks.md still 28 tasks / 9 groups. ★ **3.3's real-engine guard on D-6's measurement WINDOW — OWED AT THIS POINT, DISCHARGED AT THE END OF THIS ENTRY.** 3.2 opened that window for real — the container is live during every render — and closed none of it by construction; it inherits BOTH harness lessons above (the Firefox inert-parse gotcha and adopt-and-watch-the-wire) plus this task's: the window it must measure is the one `renderDiagrams` now owns, and the enhancer's injectable `loader` is the seam that lets a test wrap it. ★ **§4's SOURCE GUARD IS LANDED — `eae7b08` implements `4061398`'s Option 1, and it is NOT a numbered task: the group-3 pointer STAYED AT 3.3, which has since shipped and brought its own file with it.** `diagramEnhancer.ts` gains a pre-scan between `diagramSourceOf(pair.pre)` and `engine.render`: a fence whose SOURCE carries a remote reference never reaches the engine and degrades via `markDiagramFailed` — §3.8's existing path, a new reason string (*"its source references a remote resource"*), no new state and no `diagramView.ts` change. The source is READ once and handed to the engine unchanged, so D-15's read-only-source invariant holds. ★ **THE RED WAS TAKEN ON THE WIRE, NOT ON A STRING**, because a DOM-shape assertion here reads green by construction (the profile denies `image`, so the adopted artifact is clean whether or not the fetch fired — which is exactly how this stayed symptomless). Against the immediately-preceding code, in D-6's live window, **both engines identically**: ROUTE 1 (flowchart `A@{ img: … }`) put `http://localhost:PORT/__peekover_probe__/…/img-route.png` on the wire and then degraded anyway (`decode()` rejects) — a weak guard could pass it by accident; ★ ROUTE 2 (sequence `properties A: {"icon": …}`) put `…/icon-route.png` on the wire **AND RENDERED — one adopted `<svg>`, state `rendered`** — the silent success, and the only arm that distinguishes a guard that works from one that does not. With the guard both read `[]` window-scoped and whole-run, both fences degrade naming the cause, and the mixed document still renders its clean fence (§4's per-fence isolation, on a real engine). **The instrument is proven non-vacuous by a control that FIRES in the same file** — an `<image href>` built `createElementNS`-node-by-node into the LIVE measuring container, immune to the Firefox inert-parse gotcha by construction and to any engine version that removes a source route. Ablating the pre-scan reds 6 (3 arms × 2 engines) **while the control stays green**, which is the signature that says the guard and not the harness is what moved; `diagramEnhancer.ts` restored FROM the `cp` copy. ★ **THE PREDICATE'S BOUNDARY, ENUMERATED RATHER THAN ASSERTED — and it moved once during the build.** `\bhttps?:` + non-space, and `//` at a value position + a host character. Degrades: both fetch routes, `http:h.example/x` (no slashes — the URL parser resolves it), uppercase, and the **ACCEPTED COST** banked in `4061398` — `click A href`, sequence `link`, a URL in a node label, a URL in a `%%` comment. Does NOT degrade: `authtoken`, `A["Use HTTP: the fast one"]` (colon then space), `TCP//IP` / `and//or` / `50//50`, `./local.png`, `data:` URIs (**C4 `$sprite` travels that way and must keep working**), and — the case that made the trailing host-character class non-optional — **mermaid's OWN `--//`, `//--`, `-//`, `//-` sequence arrows**, whose slashes are followed by `-` or whitespace. **The one correction:** `xhttp://h.example/x` was drafted as clean on the reasoning that no browser fetches an unknown scheme; it degrades, because `:` is in the delimiter set — and that is KEPT, not loosened, since dropping `:` would reopen `img://h.example/x.png`, the unspaced spelling of route 1. So the line is: any `scheme://host` degrades (URL-shaped, conservative, version-independent); a non-URL substring must not, and none does. `sanitize.ts:187` corrected in the same commit as `4061398` required — *"`image` — no producer"* was FACTUALLY WRONG (two producers: `imageSquare`'s `append("image")`, `drawImage`'s `<image xlink:href>`); the denial stays and its reason is now "producers exist and are refused", **comment-only, and byte-proven so: an ablation build with `diagramEnhancer.ts` at HEAD and this comment in place returns the app chunk to 370,387 B exactly.** **Content script 315,974 B and md5-IDENTICAL both engines** (the guard is app-page only, as designed); app chunk **370,387 → 370,579 B (+192)**, all of it the guard, no unnamed residual. Coverage: **unit 643 → 673**, **browser 729 → 737 passed / 15 skipped** (the new `tests/browser/diagramSourceGuard.browser.test.ts`, 4 arms × 2 engines). `mount.ts`, `contentWatch.ts` and D-6's config byte-identical, golden EMPTY, manifest 2,975 B, `permissions: []` and no `web_accessible_resources` both engines, no new dependency. ★ **CARRY-FORWARD, AND IT CORRECTS `4061398`'s OWN CLOSING LINE.** That entry hands 3.3 the sequence `properties.icon` route as CONTROL A's successor. It cannot be — **the guard closes BOTH source routes, so neither fires through the production path any more.** 3.3's control must come from a seam the source pre-scan does not sit on: the live-container injection `eae7b08` already uses, or the engine driven directly past `enhanceDiagrams`. (Superseded again: `7a6dc63` then found a strictly better one — see below.) 3.3's file was untracked and UNTOUCHED by `eae7b08` (md5 `b37dfa2c…` before and after); its two CONTROL-A arms fail against the new code **by design**, which is precisely the succession 3.3 has to resolve. The committed tree is green with that file set aside: **86 files / 737 passed / 15 skipped.** **`7a6dc63` BANKED THE D-6 WINDOW FINDING (docs-only; `src/render/*` byte-untouched).** Before 3.3 shipped, a probe through the production path found that a RELATIVE reference — `img: "./x.png"`, `img: "/x.png"`, sequence `properties A: {"icon": "./x.png"}` — PASSES `eae7b08`'s guard BY DESIGN (the predicate is scoped to §4-*remote* references, and a relative reference is not remote), reaches `engine.render`, and **fetches inside D-6's live window**; `properties.icon` even RENDERS while fetching. So the plan's standing claim, *"the window issues no network for guard-passing source"*, was **FALSE as written**. The guard is CORRECT and deliberately NOT widened — in production such a reference resolves inside `chrome-extension://<id>`, package-local and excluded from `/^https?:/i` by scheme — and what changed is the CLAIM: *no OFF-ORIGIN request for guard-passing source*. `plan.md`'s D-6 residual-hole clause and row 22 took their third amendment there. ★ **TASK 3.3 IS DONE (`ace4543`) — THE OFF-ORIGIN GUARD ON D-6's MEASUREMENT WINDOW, and it DISCHARGES the note that clause has owed group 3 since `16c7790`.** `tests/browser/diagramNetwork.browser.test.ts` (untracked since the original 3.3 session) is REWORKED to the sharpened claim and shipped: 6 arms × 2 engines, test-only, no `src/*` change. ★ **THE INSTRUMENT HAS TWO TIERS, and that is the whole construction** — every prior red-first in this arc fired its control on the thing the claim DISCLAIMS, but here the live control fires INSIDE what the claim PERMITS. **TIER 1** (the live control): a real production render of a relative `properties.icon` passes the guard — asserted via `hasRemoteReference(doc) === false`, not asserted in a comment — reaches the engine, and the ENGINE puts `http://localhost:PORT/__peekover_probe__/d33-tier1/icon-rel.png` on the wire INSIDE the bracketed window **while the diagram RENDERS** (state `rendered`, one adopted `<svg>`), from author source no sanitizer has touched — D-6's named residual hole exactly. That is what makes the claim a MEASUREMENT rather than an absence: something really fetched, the observer really saw it, and what it saw was same-origin. **THE CLAIM**: five guard-passing sources — `benign`, `icon-rel`, `img-rel`, `img-dot-rel`, `tab-obfuscated` — each read `[]` off-origin window-scoped AND whole-run, both engines, with four of the five putting real traffic in the window (so the zero is a reading of live traffic, not of silence). **TIER 2** (the floor): an off-origin request injected `createElementNS`-node-by-node into the LIVE measuring container mid-window — `http://127.0.0.1:PORT/__peekover_probe__/d33-tier2/off-origin.png` — is seen on the wire AND in the claim's OWN `offOriginInWindow` list, both engines, while the benign fence still renders. **Without TIER 2 the claim would be unfalsifiable**: an observer blind to off-origin traffic reports the same zero over a wide-open window. An off-origin URL cannot come from author source (the guard degrades it before the window opens), so the floor must come from a seam the guard does not sit on, and that is CONTROL B's seam. ★ **LOOPBACK ONLY, INCLUDING THE OFF-ORIGIN FLOOR.** `127.0.0.1:PORT` against a `localhost:PORT` page is cross-origin by the same-origin rule and answered by the same local process: a REAL off-origin request that physically cannot leave the machine. No non-loopback host is named anywhere. ★ **THE CONTROL SUCCESSION, third replacement, recorded in the file itself.** CONTROL A (D-6's own, and §3.3's written Verify text) → a live §4 defect, closed by `eae7b08` → **SUCCEEDED BY TIER 1**, which keeps the property that mattered (the engine fetches, from untouched author source, in the window) via the relative reference the guard permits. CONTROL B → **TIER 2**, same seam and construction, off-origin href. §3.3's Verify language ("a diagram whose source references a remote image", "zero requests") is **STALE and superseded** — both were written before the guard and before `7a6dc63` — and the supersession is noted in the file; the INTENT (*the control fires under the same conditions the negative claim disclaims, or the negative result is worth nothing*) is met by TIER 1 and TIER 2 together, with nothing relaxed. ★ **THE SEVERITY BOUND IS NOW MEASURED, NOT DERIVED — `7a6dc63` recorded it as a derivation precisely so it would be re-derived.** An author naming a foreign host through a spelling the guard permits (a tab inside the scheme, written `\u0009` per AGENTS.md, never a literal byte) does not reach it: the WHATWG parser strips the tab, `http:host.example/…` matches the base scheme with no authority, and the request lands as `http://localhost:PORT/host.example/__peekover_probe__/d33-bound/tab.png` — **`host.example` demoted to a PATH SEGMENT on our own origin**, observed on the wire, in the window, both engines. ★ **A MEASURED HARNESS REFINEMENT, and it is why the claim MUST be off-origin-scoped rather than "zero".** `warmEngine` warms mermaid's core and the definition of the diagram type it renders ONLY — definitions register LAZILY, so a later `sequenceDiagram` still pulls `deps/sequenceDiagram-*.js`, same-origin harness module traffic, INSIDE the measurement window (observed both engines). A whole-buffer `toEqual([])` would therefore be measuring which diagram type the warm-up happened to use, not whether anything left our origin. **WINDOW vs ARTIFACT vs SOURCE-SCAN**, stated in the file's own words: this file owns the WINDOW (bracketed by the measuring container's lifetime, a deliberate SUPERSET of the true window); `diagramStyleCss` owns the ADOPTED ARTIFACT and is structurally blind here, because a window-phase request precedes any artifact — and one arm proves it by fetching while the render throws and NOTHING is ever adopted; `diagramSourceGuard` owns the PRE-ENGINE SOURCE SCAN. **THE HARNESS FOLD**, which `diagramSourceGuard` itself scheduled for this task (*"folding the two onto a shared helper belongs with 3.3, which is also when the second copy first exists"*): `tests/browser/helpers/diagramWindow.ts` — not a test file, the browser project's include is `**/*.test.ts` — now holds the wire predicate, the window bracket, the production driver and the injected-control construction. **PLUMBING ONLY: no control and no assertion in either file changed**, and `diagramSourceGuard` shrank 383 → 236 lines with its four arms intact. The helper's doc comment guards the one thing that must never be "simplified" — route the injected `<image href>` through a string and Firefox's inert-parse consumption (`367d051`) disarms BOTH files' floors at once. Coverage: **unit 673 unchanged** (test-only, browser-project file); **browser 737 → 749 passed / 15 skipped, 86 → 88 files**. **Content script 315,974 B and md5-IDENTICAL both engines** (`033879be…` / `1f15a58d…`), app chunk **370,579 B byte-identical** (same content-hash name `app-D3_Qug7S.js`) — 3.3 is test-only and the bundles prove it. `mount.ts`, `contentWatch.ts` and D-6's config byte-identical, golden EMPTY, manifest 2,975 B, `permissions: []` both engines, tasks.md still 28 tasks / 9 groups, no new dependency. ★ **THE POINTER ADVANCES: group 3's LAST task is 3.4** — the cooldown constraint and the import fence (the enhancer must schedule and return synchronously in ~nothing, and `mermaid`/`diagramEngine`/`diagramEnhancer` must appear in NO content-script module graph, with the app-page graph as the control). Neither is a wire reading, so 3.3 leaves it untouched; 6.1 (engine-load FAILURE degradation) is likewise a different instrument from 3.3's COLD LOAD arm, which reads the load's TRAFFIC. **TASK 3.4 IS DONE (`522a3fe`) — THE COOLDOWN CONSTRAINT AND THE IMPORT FENCE, AND IT CLOSES GROUP 3.** Test-only: no `src/*` change, and both bundles prove it. ★ **THE IMPORT FENCE IS THE HALF THAT WAS NEVER ASSERTED.** All milestone long "mermaid never reaches the content script" has rested on a BYTE reading — 315,974 B unchanged, `grep -c mermaid` = 0 — which is a COINCIDENCE-DETECTOR: it catches a leak only when the leak moves bytes. **MEASURED at 3.4, and it does not:** a scratch `import { enhanceDiagrams } from './diagramEnhancer'` added to `mountReader.ts` (squarely on the content-script graph) builds to a content script that is **BYTE-IDENTICAL — 315,974 B, md5 `033879be…`, `grep -c mermaid` still 0**. The unused named export tree-shakes and the byte fence calls the architectural violation green. So `src/render/diagramImportFence.test.ts` (NEW, 8 assertions, `diffEngine.test.ts`'s source-text shape) asserts REACHABILITY over the source graph, walking every edge — static, dynamic and type-only — out of each entrypoint. **Clause A**: the content-script graph reaches neither `diagramEnhancer.ts` nor `diagramEngine.ts` and imports no `mermaid` specifier. **Clause B is the CONTROL and the reason A is readable**: the app-page graph, same walker same run, MUST reach both and MUST import `mermaid` — a broken traversal cannot satisfy both verdicts at once. **Clause C — the LAZINESS pin**: exactly one `mermaid` module import in the tree, in `diagramEngine.ts`, and it must be DYNAMIC; `mermaid/package.json` is the one permitted static specifier, named. **Clause D**: both graphs non-trivial with named landmarks, and every local specifier RESOLVED (an unresolved edge is a hole the fence cannot see through, so it fails loudly). ★ **BOTH RED-FIRSTS FIRED, and both left the byte fence green.** (i) the `mountReader.ts` import → clause A red naming `src/render/diagramEnhancer.ts` + `src/render/diagramEngine.ts`, content script 315,974 B unchanged. (ii) `export * as scratchMermaid from 'mermaid'` in `diagramEngine.ts` → clause C red on the STATIC form; content script again 315,974 B unchanged, while the app chunk went 370,579 → 453,816 B (+83,237) and the 34,946 B lazy `mermaid.core` chunk was INLINED — the eager-chunk failure the pin exists for, invisible to every byte fence this milestone actually enforces. Both restored from `cp` copies; pin green. **It is NOT `scripts/check-dynamic-imports.ts` again** — that script enforces SPECIFIER STATICNESS file-by-file with no notion of who reaches whom, and `import('mermaid')` passes it by design; this enforces GRAPH REACHABILITY. Neither subsumes the other and neither was extended. ★ **THE COOLDOWN HALF was already satisfied by 3.1's construction — 3.4 PROVES it, and does not manufacture a change.** `watchController.renderNow` (`:422`) times its whole synchronous block and multiplies the result into the next cooldown, and on the app page that block contains `appShell.ts:132`'s `renderWithDiagrams` = `mount` + `enhanceDiagrams`. Two unit assertions on ONE clock with a fake engine that BURNS a real blocking 40 ms: at the instant the enhancer returns the placeholder is committed, the engine's `render` is un-called, no measuring container exists, and the block cost **0.22 ms**; the same engine driven INLINE — the shape an awaiting enhancer would leave `renderNow` holding — cost **40.43 ms** against the shipped **0.83 ms**. **The control fires**: the inline number reads the burn, so the fast number is a result and not an engine that costs nothing. ★ **THE BROWSER HALF: a watch re-render RE-ENHANCES, driven through `installWatchForFile` and NEVER a hand-built controller** — four sibling watch suites construct `createWatchController` directly and take the DEFAULT bare-`mount` render, so only the shipped app page can prove this. mountAppShell → open folder → click the file → click the pill → change the bytes `read()` returns → wait out a real 1 s poll. **Verified RED by ablating `render: renderWithDiagrams` at `appShell.ts:820`**: both engines time out — the document re-renders with the new text and grows NO figure. Restored from a copy. The control inside the test is `replaceChildren` itself: the pre-change figure's `isConnected` is asserted FALSE, so the figure found afterwards is a new element something had to build. **A HARNESS FINDING worth the note:** `pollingDetector` treats its first read after `start()` as the BASELINE and delivers nothing (`changeDetector.ts:106-108`), so bytes changed between the pill click and that poll are never a CHANGE — the first cut of this test timed out with 11 polls and no re-render, and the fixture now counts reads and waits for the baseline to land. Coverage: **unit 673 → 683** (+8 fence, +2 cooldown), **browser 749 → 751 / 15 skipped**. **Content script 315,974 B, md5-IDENTICAL both engines** (`033879be…` / `1f15a58d…`); **app chunk 370,579 B byte-identical** (same content-hash name `app-D3_Qug7S.js`); the **mermaid chunk is still SEPARATE and LAZY** — 34,946 B, reached only by ``import(`./mermaid.core-CgC7yF9q.js`)``, the fence's own precondition re-verified rather than assumed. `mount.ts` and `contentWatch.ts` byte-identical, golden EMPTY, manifest 2,975 B, `permissions: []` both engines, tasks.md still 28 tasks / 9 groups, no new dependency. ★ **THE POINTER ADVANCES: GROUP 3 IS COMPLETE** (3.1 `1e09164` · 3.2 `763f94d` · 3.3 `ace4543` · 3.4 `522a3fe`), and with it the whole §4 remote-reference sub-arc (`4061398` · `eae7b08` · `7a6dc63`). **NEXT: GROUP 4 — the cache, END-TO-END (D-2 · D-3 · D-4 · D-14)**, explicitly outside 3.4's boundary and the first group whose subject is persistence rather than rendering. **TASK 4.1 IS DONE (`443bdee`) — `src/app/diagramCache.ts`, THE PURE LAYER, AND IT STORES NOTHING.** D-3's key derivation and D-4's eviction PLANNING, WIRED TO NOTHING: no IndexedDB, no `store.ts` change (4.2), no enhancer wiring (4.3). ★ **GROUP 4 IS A DIFFERENT KIND OF TERRAIN AND THE RED-FIRSTS SHIFTED WITH IT — CORRECTNESS, NOT TRUST.** Groups 2–3 proved *nothing leaks*, so their controls FETCHED when they shouldn't; this module has no I/O at all and cannot leak. What it can do is return the WRONG ANSWER, so both controls fail on IDENTITY — a named key, a named row — never on a count, because a count is exactly what a wrong-axis implementation still gets right. **THE KEY (D-3):** `hash + SEP + theme + SEP + engineVersion` as the keyPath VALUE — SHA-256 of the fence text via `crypto.subtle.digest`, hex (greenfield; pinned to the published empty-string and `abc` vectors so "64 hex characters" cannot pass for any hash-shaped string), the **EFFECTIVE** theme (`EffectiveTheme` in the signature, so passing `'auto'` is a COMPILE error rather than a runtime collision between two renderings sharing one row), and the engine version passed in from 1.2's resolved-package read. `SEP` IMPORTED from `recents.ts:52`, never re-declared (grep: it is still the only declaration in `src/`). **★ RED-FIRST 1 — KEY COLLISION:** ablating the key to `hash` alone reds SIX cases, and the load-bearing one reds AT THE ROW LEVEL — *expected […] to have a length of 2 but got 1*: the dark render REPLACES the light one, which is the §3.7 bug the compound-in-keyPath shape exists to prevent (after the first flip, every subsequent flip in either direction must be a HIT, and that needs both renderings to coexist as rows). Restored from a copy. **★ RED-FIRST 2 — EVICTION IDENTITY (D-4's discriminator):** a fixture built so `lastUsed`-ordering and creation-ordering DISAGREE about which row goes — `read-now-old-row` is oldest by creation but most-recently-used, `stale-new-row` the reverse — with only the count bound binding, so exactly ONE row is evicted either way. Ablating the ordering axis to `createdAt` reds naming the WRONG ROWS: *expected ['read-now-old-row'] to deeply equal ['stale-new-row']*, plus *to not include 'read-now-old-row'* and the touch case. **The count is identical in both runs — only the NAME moves**, which is the whole point: `toHaveLength(1)` would have passed against the bug. Restored from a copy, green. `read-now-old-row` is D-4's actual scenario — the light rendering of the diagram being read RIGHT NOW, thrown away because it was first rendered before lunch. Also asserted: all three GLOBAL sweeps (age, count, bytes) each in isolation; MULTI-BOUND SIMULTANEITY (a store violating all three at once is within ALL THREE afterwards **and still contains the incoming row** — a plan that satisfies the bounds by discarding what it was asked to store would pass the three checks and be useless); SINGLE-OVERSIZED refused whole with NO eviction, against a store that WOULD have been swept on all three axes so the claim is not vacuous; keys round-trip through `split(SEP)`; re-writing an existing key REPLACES its row rather than appending (the key is deterministic and the keyPath is `key`, so an append-shaped projection would double-count bytes and evict for no reason). **★ THE BOUND VALUES ARE PROPOSED, NOT CHOSEN, AND NOTHING HERE MAY BE CITED AS A DECISION** — `PROPOSED_DIAGRAM_COUNT` / `_TOTAL_BYTES` / `_MAX_AGE_MS`, each carrying the reasoning for the STARTING POINT (what measurement should push against) rather than a justification of the value; 8.1–8.3 measure, **8.4 is the human gate that chooses**, and 8.5 SET them and removed the PROPOSED framing. Per D-8 **no unit case pins a bound value as an expected number** — every fixture passes small explicit bounds, and the one constants case is STRUCTURAL (`PROPOSED_BOUNDS` is composed of the three named constants), so all of it stays green across 8.5's swap. **BOUNDARIES HELD:** `planDiagramWrite` is a SIBLING of `planSnapshotWrite`, never a generalisation — the header says why in the terms that make the tidy-up read as the behaviour change it is (this cache has no document for a count to be per-), and `snapshots.ts` is byte-identical; `bytesOf` is IMPORTED and re-exported from `snapshots.ts:126-128`, asserted with `expect(bytesOf).toBe(snapshotBytesOf)` so a future re-implementation reds rather than diverging quietly (grep: still the only definition in `src/`). ★ **THE 4.1 FENCE — THE MODULE IS IMPORTED BY NOTHING, AND THE BUNDLES PROVE IT:** content script **315,974 B and md5-IDENTICAL both engines** (`033879be…` / `1f15a58d…`), app chunk byte-identical (same content-hash name `app-D3_Qug7S.js`, `005c6664…`) — a new module that moved either bundle would have reached a graph it has no business on at 4.1. `mount.ts`, `contentWatch.ts` and `store.ts` byte-identical (4.1 touches none of them). Coverage: **unit 683 → 706** (+23), browser untouched (this module has no browser projection — it is arithmetic and hashing). ★ **A NUL FINDING, AND THE TWO-FORM CHECK IS WHY IT WAS CAUGHT:** the test file was authored with a LITERAL U+0000 byte inside `not.toContain(…)` — the assertion still passed, and `grep` reported only *Binary file matches*. `tr -d -c '\000' | wc -c` and the python byte count both read **1**, located it at offset 7390, and it was rewritten to the `\u0000` ESCAPE per AGENTS.md. Both forms now read **ZERO** on both files; the `grep -c` form is vacuous in Git Bash (an empty pattern matches every line) and was not used. Golden EMPTY, manifest 2,975 B, `permissions: []` both engines, tasks.md still 28 tasks / 9 groups, no new dependency. **GROUP 4 IS OPEN, 4.1 DONE.** **TASK 4.2 IS DONE (`01339fd`) — THE SCHEMA BUMP, AND IT STORES NOTHING.** `DB_VERSION` 3 → 4 with `diagramMeta` (keyPath `key`, `{key, bytes, lastUsed}`) and `diagrams` (keyPath `key`, `{key, svg}`) APPENDED to `SCHEMA` — **two stores, not one (D-2)**: `getAll` documents itself for “small bounded stores — no cursor needed” (`idbCore.ts:116-119`) and `describeStored()` materialises whole stores, so an inline SVG would deserialise every cached diagram on every trust-panel open. Additive-by-name, **no migration code**; `idbCore.ts` **byte-identical** (`47f32731…` before and after) and its `:5-9` STOP signal **NOT tripped** — no index, no compound key, no cursor, no new `idbCore` function (D-3's key is a single composite STRING, so one `keyPath` suffices). ★ **THE RED-FIRST IS MIGRATION-SURVIVAL, AND IT REDS ON THE EXISTING ROWS, NOT THE NEW STORES** — 006 §3-4's gap re-closed for this bump, on REAL engines both (versionchange is jsdom-blind): a v3 DB seeded with a row in ALL SIX existing stores, opened at v4 through the production `SCHEMA`, every row surviving byte-identical. Dropping `snapshots` from `SCHEMA` reds *preserves the seeded snapshots row byte-identical across the v3→v4 bump* with `expected null to deeply equal [ { id: 'seed-snap', … } ]` — it NAMES the lost store and the lost row, not “expected true” — while *creates the two 4.2 diagram stores, present and EMPTY* stays GREEN under the same ablation, which is the whole point: the discriminator sits on the DANGEROUS half. The seed's store list is derived FROM `SCHEMA`, so a drop or rename propagates into it. **006's arm was PINNED, not left to drift:** `SCHEMA` is now v4, so the existing v2→v3 case would have silently become a v2→**v4** jump; a derived `schemaAtV3` (store.ts's stores minus the two 4.2 adds, pinned to version 3) keeps 006's SINGLE additive step exactly as 006 specified it, still live-coupled to `SCHEMA`. ★ **A FENCE PREMISE WAS WRONG, AND THE CORRECTION IS THE FINDING:** the task fence read *content script MUST NOT MOVE — store.ts's schema is app-page*, and the content script MOVED **315,974 → 316,087 (+113)** both engines. `store.ts` has been on the CONTENT-SCRIPT graph since **006**, via the capture wiring — `peekover.content.ts:6` → `contentWatch.ts` → `watchController.ts:140` (`storeSnapshot`) → `snapshots.ts:23` `import { connection, STORES } from './store'`, where `connection` drags the memoized `db()` that references `SCHEMA`. Nothing 4.2 did pulled it there: the pre-4.2 bundle ALREADY carried `folders`/`recents`/`pins`/`snapshotMeta`/`snapshots` (the grep FIRED 4/3/3/6/8 — a live control, not a silent zero). The +113 is accounted to the byte by ablation: `DB_VERSION` 3→4 ALONE rebuilds at exactly **315,974** content-script and **370,579** app chunk (md5 shifts only because the literal `3` became `4`, same length), and the two descriptors alone carry the delta — `diagramMeta:"diagramMeta",diagrams:"diagrams",` **46 B** + `{name:e.diagramMeta,keyPath:"key"},{name:e.diagrams,keyPath:"key"},` **67 B** = **113 B, ZERO residual**; app chunk 370,579 → 370,692 (+113), same decomposition. **The fence is CORRECTED for the rest of group 4: “content script must not move” → “content script moves by the ACCOUNTED schema delta.”** Coverage: **unit 706 → 709** (+4 cases for the v4 schema shape, −1 for the now-false “declares version 3”), **browser 751 → 769** (+18 = 9 new cases × Cr+Fx). Golden EMPTY, manifest 2,975 B, `permissions: []` both engines, tasks.md still 28 tasks / 9 groups, no new dependency; `mount.ts`, `contentWatch.ts`, `diagramEnhancer.ts` and `diagramCache.ts` byte-identical. ★ **4.2's carried seam question is ANSWERED, and the answer is ZERO:** the cache reached the enhancer with the content script **byte- AND md5-identical on both engines (316,087 B, `15c96c50…` / `73427eca…`)** — not a permitted delta, none at all. The edge runs ONE WAY by construction: `diagramCache.ts` imports `store.ts`, `store.ts` never imports `diagramCache.ts` (`describeStored` spells the `diagramMeta` row shape INLINE rather than importing it), and the cache's only importer is `diagramEnhancer.ts`, which the content-script entry cannot reach. **3.4's structural import fence is GREEN (8/8) both before and after the wiring** — the gate that matters, since a type-only or tree-shaken edge moves no bytes for the byte fence to see. **TASK 4.3 IS DONE** — ★ THE CACHING COMMIT, and it did NOT split: all six parts in one commit (D-14 / §3.9). (1) `cacheGet`/`storeDiagram` reach the enhancer, `planDiagramWrite` on write, `lastUsed` touched on hit; (2) `StoredSummary.diagrams` REQUIRED; (3) the `buildStoredLines` line through the reused `humanBytes`, `describeStored` reading `diagramMeta` ONLY (D-2), `wipeAll` gaining two `clear()`s, a new narrow `clearDiagramCache()`; (4) `storageControls.ts`'s THIRD control in the erase pair's disabled-at-zero + inline-confirm shape; (5) the panel line and (6) the `PERMISSIONS.md` ledger row, both applied **VERBATIM** from `cab93c7` (a). ★ **THE VERBATIM DIFF IS THE MECHANISM, NOT A PROMISE:** a script re-extracts the five ledger columns + the panel line from `decisions.md` and `difflib`-diffs them against the shipped text (the panel line reassembled from `store.ts`'s template + `storageControls.ts`'s button label, with `N`/`size` substituted back) — **all six diffs EMPTY**. `PERMISSIONS.md:42`'s two stale derived facts are true again (**eight** stores at `DB_VERSION` **4**; “clears **all eight**”), and the heading + parenthetical now enumerate M7's capability. ★ **THE INTENDED BUILD BREAK FIRED, AND IT CAUGHT SIX SITES, NOT ONE.** Making `diagrams` REQUIRED broke `tsc` at `appShell.ts:584`'s duplicated `EMPTY_SUMMARY` exactly as tasks.md predicted — **plus five more forgotten literals** (`appShell.test.ts` ×3, `store.test.ts`'s `lines()` helper, `captureToggle.browser.test.ts`). All fixed; the field was NEVER made optional. The forcing function works, and its reach is wider than the one site the task named. ★ **A REAL DEFECT WAS FOUND BY A SIBLING SUITE — CACHE POISONING.** The write was first placed on the engine's return, BEFORE `sanitizeSvg`. `diagramRender.browser.test.ts`'s sanitize-rejection case went red (`expected 'failed' to be 'rendered'`): a rejected artifact was being CACHED and re-served forever, turning §3.8's transient failure into a permanent, cached, invisible one. The write now lands **after the sanitize check passes and before `markDiagramRendered`** — which also makes “the document settled” mean “and its diagrams are cached” (one observable, no write/re-render race). It still stores the ENGINE's string, never the sanitized one, so every hit re-runs the CURRENT profile. Its own guard is in `diagramCache.browser.test.ts`, verified red against the pre-sanitize write. ★ **RED-FIRSTS, all three restored from a `cp`:** (a) ablating the cache lookup reds the hit assertions in the defect's own units (`expected 1 to be +0` — the extra engine invocation); (b) a `clearDiagramCache` that also clears the settings store reds **exactly ONE** survivor (`the reader settings row must survive: expected 'auto' to be 'dark'`); (c) the poisoning write reds only its own guard. The cache-hit case is non-vacuous **in the same test** — the FIRST render invokes the engine (1), the second does not (0), off one counter — and D-3's three components each get a case: source and theme end-to-end, engine version SEEDED (a row under a bogus version is unreachable; the same seed under the real version hits, same test). ★ **NUL CHECK CAUGHT A LIVE ONE.** `wipe.browser.test.ts` carried **3 literal NUL bytes** written by my own heredoc (0 at HEAD) — and the suite was GREEN with them, which is the whole trap. Replaced with the IMPORTED `SEP`; both forms (`tr -d -c`, python `count(b'\x00')`) now read **0** across all eleven touched files. App chunk **370,692 → 377,847 (+7,155)**, accounted by ablation with **zero residual** at the time of measurement (377,819): **+5,574** = 4.1's pure module becoming REACHABLE for the first time (it was tree-shaken out entirely) plus the enhancer wiring, **+1,055** = the third control, **+498** = `store.ts` + `appShell.ts`'s trust surface. Coverage: **unit 709 → 720** (+11), **browser 769 → 787** (+18 = 9 cases × Cr+Fx), browser ALL GREEN. Golden EMPTY, manifest 2,975 B, `permissions: []` both engines, `idbCore.ts` / `mount.ts` / `contentWatch.ts` byte-identical, no multi-store transaction helper, no `folderIds[]` index, no purge-on-bump logic, no new dependency. ★ **THE POINTER ADVANCED AT 4.3 AND ADVANCES AGAIN HERE.** ★ **TASK 4.4 IS DONE (`f133913`) — THE CACHE UNDER WATCH, THE CASE IT EXISTS FOR, AND GROUP 4 IS COMPLETE.** A TEST-ONLY task: no production file moved, and every bundle fence is byte-identical — content script **316,087 B both engines with both md5s unchanged**, app chunk `app-DATW43gA.js` **377,847 B** with the CONTENT HASH ITSELF unchanged (which is byte-identity stated by the bundler rather than by me). ★ **THE HIT IS PROVEN THROUGH THE PRODUCTION WATCH PATH, NEVER A HAND-BUILT CONTROLLER** — 3.4's harness reused whole (`mountAppShell` → open folder → click the file, whose synchronous head runs `installWatchForFile` → click the shipped pill → mutate the bytes `read()` returns → wait out a real 1 s poll, with the reads-counter that waits for the detector’s BASELINE before editing). `render: renderWithDiagrams` is provisioned at exactly ONE site (`appShell.ts:845`) and a hand-built `createWatchController` takes the DEFAULT bare `mount` — so a hit measured on one would be a hit on a path production does not run (3.4's banked trap, inherited whole). **THE DISCRIMINATOR:** the prose changes and the fence stays byte-identical → the diagram serves FROM CACHE with the engine **NOT invoked (0)**, while the re-render demonstrably HAPPENED — the new prose is in the reader AND the pre-change figure's `isConnected` is FALSE, so `replaceChildren` destroyed it and something had to BUILD the figure found afterwards. **NON-VACUOUS ON BOTH SIDES, same test, same counter:** the FIRST render invokes the engine (**1**, cold cache), and a second edit changing the FENCE ONLY — prose byte-identical — invokes it again (**1**), so the zero is a HIT rather than a re-render that never reached the diagram. Counting through a seam with NO injected loader is done by spying `mermaid.render` (the very object `loadDiagramEngine` returns) with call-through and `mockRestore` — **production grew no test seam**, which was the alternative and would have been the test dictating the shape of the thing it measures. ★ **REVERT-AND-FAIL:** bypassing the cache lookup in `diagramEnhancer.ts` reds the hit assertion on **BOTH** engines in the defect’s own units — `expected 1 to be +0`, the extra engine invocation, named by the assertion message — and reds it **AT** the hit assertion, so the re-render and the rebuild still happened and only the engine count moved. Restored from a `cp`; green both engines. ★ **THE SINGLE-OVERSIZED QUIET PATH — PRESENCE *AND* ABSENCE BOTH ASSERTED**, because an absent error and an absent diagram look identical and a test checking only “no marker” would read green over a fence that never drew. A REAL engine artifact padded past the whole byte bound (padding is `<text>`, which the SVG profile KEEPS, so what is refused is an oversized DIAGRAM and not a sanitize casualty) **renders normally** (figure present with its `<svg>`, state `rendered` — non-vacuous against a control diagram that really drew through the same helper), **surfaces NO marker and no `failed` fence**, is **NOT stored** (asserted against its OWN key, which reads `undefined`), and **EVICTS NOTHING** — the pre-existing row survives by count AND by bytes, and still SERVES (a later render of it hits, so “evicts nothing” is behaviour and not merely a count). The PURE half sharpens the same claim in `diagramCache.test.ts`: **ONE BYTE decides it** against the same populated store (at the bound → stored, evicting `kept`; one over → refused, `kept` surviving — so no make-room-then-fail path can cost a user cached diagrams), the refusal holds against an EMPTY store (it is about SIZE, never headroom), and an oversized write does not displace **the row already at its own key** — the short-circuit runs BEFORE the projection, so a diagram whose SVG outgrew the bound leaves its smaller, valid, still-serving entry untouched. Coverage: **unit 720 → 723** (+3), **browser 787 → 791** (+4 = 2 cases × Cr+Fx), all green — the single unit red is the PRE-EXISTING `pipeline.perf.test.ts` machine-load budget, green in isolation and unrelated. NUL check **0** both forms across both touched files, **with a firing control** (a real-NUL fixture reads 1 on both forms — and the first attempt did NOT fire: bash `$’\x00’` collapses to an EMPTY pattern and `grep -c` returned the LINE COUNT, 661/436, which reads exactly like a huge NUL count; `grep -acP ’\x00’` plus a byte scan is the pair that actually answers). Golden EMPTY, manifest 2,975 B, `permissions: []` both engines, 3.4’s import fence green, `idbCore.ts` / `diagramCache.ts` / `mount.ts` / `contentWatch.ts` byte-identical, no new dependency. ★ **THE POINTER ADVANCES: 4.4 DONE — GROUP 4 (THE CACHE, END-TO-END: D-2 · D-3 · D-4 · D-14) IS COMPLETE. NEXT: 5.1 — GROUP 5, THEME SYNC (D-7)**: the re-theme trigger is a NEW notification at `applyTheme()`, **NOT** `onThemeSettingChange()` — the obvious seam is wrong for the reason its own doc comment gives (`reader.ts:108-112`: an OS flip under `auto` changes what paints but NOT the setting), and the red-first is the defect the decision exists to prevent. One thing group 4 hands it: the cache already partitions on the EFFECTIVE theme (D-3) and `diagramCache.browser.test.ts` proves both renderings COEXIST as rows, so §3.7’s every-subsequent-flip-is-a-hit is a property group 5 INHERITS rather than one it must build. **Task 5.1 (`85d5cbc`) is DONE — GROUP 5 (THEME SYNC, D-7) IS OPEN.** ★ **THE HEADLINE IS THE WRONG-CHANNEL RED-FIRST**, and it is what makes D-7 a decision rather than a preference: a build subscribed to `onThemeSettingChange` leaves EVERY rendered diagram at the old theme on an OS flip under `auto` **while the page around it repaints** — fired on BOTH engines, in the DEFAULT configuration (`DEFAULT_SETTINGS.theme` IS `'auto'`, `settings.ts:39`), and reading as `expected 'light' to be 'dark'` on **`data-diagram-theme`**, the new per-figure attribute that NAMES the stale rendering rather than reporting a bare boolean. The test asserts the host repaint FIRST (`data-theme` → `dark`) so the red cannot be misread as “the flip never happened”, and re-asserts that the SETTING never moved — nothing on the channel D-7 rejected could have carried the change. The fix subscribes at `applyTheme()` (`themeRegistry.ts`’s new `onEffectiveThemeChange`), the ONE broadcast both paths go through: the setting writer (`reader.ts:89`) AND the OS-flip listener (`reader.ts:157`). **ADDITIVE, and the control for it is the four PRE-EXISTING `themeRegistry.test.ts` cases** — unchanged, green at HEAD (`f133913`) before the listener existed and still green with it: the attribute writes are untouched and the notification is strictly AFTER them, so a listener that reads the DOM sees the theme already applied, never the one being replaced. **NEVER BLANK is D-15’s doing, and it is asserted TWO ways.** The mechanism is re-render-and-swap, not mutate-in-place (a themed mermaid SVG differs in fills, strokes, marker defs and its generated `<style>` — there is no set of attributes to patch that is equivalent to what the engine emits at the other theme); the old rendering stays on screen for the WHOLE async re-key/look-up/render, and the swap is one synchronous `replaceChildren` with the replacement ALREADY built. The frame sampler is the weaker half (>5 samples, min = max = 1 — never blank, never two diagrams at once); the **MutationObserver replay is the half that matters**, because it sees the 1 → 0 → 1 an empty-then-fill implementation passes through BETWEEN two mutations in the same task — a blank NO frame can observe. Both halves are non-vacuous: the replay proves a real swap (≥2 mutations) and the original `<svg>` is proven GONE from the figure. **The SECOND flip is a HIT, inherited whole from group 4** — §3.7’s round trip lands on the two coexisting rows 4.3 already proved (engine invocations 0), so group 5 built nothing for it. A failure at the new theme **KEEPS THE PREVIOUS RENDERING** rather than calling `markDiagramFailed`: a correct picture at the old theme beats an error marker, and the staleness it reports is the lesser outcome. ★ **THE CONCURRENCY FIX, itself red-first — and the first attempt at it was WRONG.** `applyTheme` broadcasts on EVERY theme write, so duplicate broadcasts are ordinary rather than pathological (a settings load landing on the theme the OS already resolved to; two surfaces writing the same theme) — in the harness, by the third test in a file ONE flip arrived THREE times and ran the engine three times per diagram. In-flight COALESCING declines a broadcast for a theme a host is already rendering to, and pass SUPERSESSION stops an older pass committing after a newer one (two quick flips would otherwise put the OLDER theme back on screen PERMANENTLY — a stale diagram produced by the very mechanism that exists to prevent one). **3 renders per flip → 1.** The first fix counted supersession PER BROADCAST and had exactly the bug it was meant to fix: every flip cancelled ITSELF and nothing ever re-themed. Only a pass that ACTUALLY STARTS may claim the slot, so a coalesced duplicate cannot supersede the pass it deferred to. **`drawDiagram` is EXTRACTED, not duplicated** — the first render and the re-theme share ONE implementation, because a second copy is where the cache write’s three ordering constraints would drift apart; the theme is a PARAMETER rather than a `currentEffectiveTheme()` read inside, so the key cannot disagree with what the hosts now carry. ★ **THE FENCE IS RE-BASELINED, AND THE OLD WORDING WAS MIS-SPECIFIED.** `themeRegistry.ts` IS on the content-script graph at HEAD (`reader.ts:44` imports it), so `applyTheme` ships in the content script and D-7’s notify loop moves it BY NECESSITY: **316,122 B both engines**, **+35 B**, ablation-accounted to zero residual. “The content script must not move” was never the real constraint; the real one is **“it moves ONLY by the D-7 notify loop, and the ENHANCER stays off the content-script graph”** — banked here so the next theme-touching task does not re-trip it (4.2’s fence-correction precedent). The enhancer’s absence is proved TWICE: 3.4’s **STRUCTURAL** import fence green **8/8** (the reachability walk, not a byte reading — 5.1 is the first task wiring the enhancer to a module that IS on that graph, so this is the check that matters), and `enhanceDiagrams` / `mermaid` / `diagramCacheKey` / `data-diagram-theme` all grep **0** in both bundles **with a firing control taken from the CHANGED FILE ITSELF** — `data-theme` (`themeRegistry.ts`’s own `THEME_ATTR`) reads **7**, so the grep is demonstrably sensitive in exactly the region D-7 touched and `data-diagram-theme`’s 0 is a real absence, not a dead needle. The two engine bundles are NOT md5-equal and never were: they differ by exactly ONE byte at offset 312,846, the pre-existing `backgroundCanReadFileUrls:!0/!1` capability flag, unrelated to 5.1. Coverage: **unit 723 → 728** (+5), **browser 791 → 799 passed / 15 skipped** (+8 = 4 cases × Cr+Fx), ALL GREEN — and 4.4’s PRE-EXISTING `pipeline.perf.test.ts` machine-load red is green in this run too, so the suite is clean end to end. `eslint` + `tsc --noEmit` clean. NUL check **0** both forms. Golden EMPTY, `permissions: []` both engines, `idbCore.ts` / `diagramCache.ts` (pure layer) / `mount.ts` / `contentWatch.ts` byte-identical, no new dependency. ⚠ **MEASURED manifest 654 B (Chrome) / 770 B (Firefox)** — the “manifest 2,975 B” figure repeated by entries 3.1–4.4 matches NO artifact in the tree (no 2,975-byte file exists anywhere in `.output/` or the repo); it is carried, not measured. NOT edited retroactively here — flagged for 8.1, which owns the baseline re-measure. ⚠ **§ Baselines is STALE and is deliberately NOT touched by 5.1 (`85d5cbc`), nor by 5.2**: its table still records the content script at **315,671 B** (row `Content script (content-scripts/peekover.js)`, measured 2026-07-27 at `d470ab2`), against **316,122 B** today. Reconciliation belongs to 8.1 / 9.3 (the staleness routing already recorded there), not to a group-5 task — the figure is flagged, not edited. **TWO FLAGS, both raised, both APPROVED, both recorded**: the fence re-baseline above, and `diagramCache.browser.test.ts`’s new `detachMountedHosts()` — a MECHANISM-FORCED test-premise update, NOT a regression silenced. 4.3’s D-3-component-2 case assumed “a flip only affects the measured pass”; D-7 makes that assumption FALSE BY DESIGN, because every open reader now follows the effective theme, so a host still connected from an earlier pass legitimately re-renders onto that file’s SHARED spy. The re-theme skips detached hosts by its own `isConnected` prune. ★ **THE POINTER ADVANCES: 5.1 DONE — GROUP 5 (THEME SYNC, D-7) IS OPEN. NEXT: 5.2** — the flip-cost measurement, which **PRODUCES NUMBERS AND CHOOSES NOTHING**: gate 2 re-routed §7-9’s flip cost to **gate 3**, so no budget, threshold or optimisation may be decided from it inside group 5. **TASK 5.2 IS DONE — GROUP 5 (THEME SYNC, D-7) IS COMPLETE. IT MEASURES, AND IT CHOOSES NOTHING.** §5.2's Files list is *"measurement notes into the task report + `docs/ai/progress.md` (numbers only, nothing chosen)"* — a **DOC measurement, NOT a committed test**, so **no test file entered the suite and no time-bound assertion exists anywhere**: a committed *"flip cost < N ms"* would both FLAKE on machine load and SMUGGLE IN the threshold 8.4 owns. The harness was a scratch `tests/browser/diagramFlipCost.scratch.browser.test.ts`, run once per engine and **DELETED** — no production file touched, both bundles unchanged. ★ **THE WORST CASE — 50 diagrams, the FIRST flip to a never-rendered theme (a FULL MISS on every one), wall-clock from the `applyTheme` broadcast to the last figure re-themed, 7 repetitions: Chromium floor 522.3 ms / median 538.9 ms · Firefox floor 900.0 ms / median 910.0 ms.** The SECOND flip back is a **FULL HIT — Chromium floor 107.5 / median 114.6 · Firefox floor 202.0 / median 213.0**, roughly a **fifth** of the miss, which is §3.7's round trip on group 4's two rows paying for itself. Per-diagram amortized on the miss flip: **10.8 ms Chromium / 18.2 ms Firefox** (median; floors 10.4 / 18.0). ★ **A-B-A, AND THE BRACKETS AGREE**: the control is a same-session 50-diagram COLD INITIAL RENDER interleaved before and after every flip — **Chromium A-early median 516.0 vs A-late 503.8 (drift −2.4%)**, **Firefox 691.0 vs 688.0 (−0.4%)**. The environment held still, so the middle numbers stand rather than being a guess about a busy machine. (Firefox's B series carries one 1,382 ms outlier against a 900–995 ms body — precisely why the **FLOOR is reported beside the median**: the floor is the run nothing else interfered with.) ★ **NON-VACUITY, ASSERTED NOT ASSUMED**: the miss flip invoked the engine **exactly 50 times in all 7 reps on BOTH engines**, the hit flip **exactly 0**, and the store held **100 rows** (50 sources × 2 themes) — a measurement of the wrong number of renders measures nothing. **DECOMPOSITION — CACHE WRITE-THROUGH DOES NOT DOMINATE; THE ENGINE DOES**: `engine.render` is **77.2%** of the miss flip on Chromium (median 416.2 of 538.9) and **76.4%** on Firefox (695.0 of 910.0); the remaining 22.8% / 23.6% is almost entirely the per-figure path the HIT flip also pays (114.6 / 213.0), leaving IDB write-through at a **directional 8.1 ms (1.5%) Chromium / 2.0 ms (0.2%) Firefox**. **NO FLICKER AT 50 DIAGRAMS**: across the full-miss flip the frame sampler (43 frames Chromium / 85 Firefox) and the MutationObserver replay (52 records both) each read a **constant 50 `<svg>`** — **zero** frames and **zero** replay points below 50, so §4's keep-previous-visible holds at scale exactly as 5.1 proved it at one. ⚠ **A FINDING ROUTED TO 8.4, NOT A DECISION TAKEN HERE: the 50-diagram fixture SATURATES `PROPOSED_DIAGRAM_COUNT` (100) EXACTLY** — 50 sources × 2 themes = 100 rows, and `planDiagramWrite`'s count sweep evicts only on `excess > 0`, so the flip-back is a full hit **by one row**. At 51 diagrams it would not be, and the second flip would stop being free. Reported; **the bound value is 8.4's to choose, not 5.2's.** ★ **NOTHING WAS CHOSEN AND NOTHING WAS BUILT**: no threshold, no bound, no budget, no target; plan §1.3's **progressive visible-first re-render was NOT implemented** (a gate-3 revisit-when, not a re-scope); and **no production change was made to reduce the cost** — that is the optimisation gate-2 **(d)** routes away from 5.2. The measurement seam is entirely TEST-SIDE (a timing wrapper around the injected engine loader, the `counting()` shape 4.3 and 5.1 already use), so no production behaviour moved. Methodology, stated because it bounds the claim: the flip is driven through `setThemeSetting` (`reader.ts:89` → `applyTheme`), the same broadcast 5.1 proved BOTH channels funnel into, so the measured window excludes Playwright's OS-emulation transport — that transport is test scaffolding, not product cost. Coverage **UNCHANGED BY DESIGN — unit 728, browser 799 passed / 15 skipped**, both green, because 5.2 adds no test. `eslint` + `tsc --noEmit` clean. NUL check **0** both forms. Content script **316,122 B both engines**, per-engine md5 stable (`a55ef1e0…` Chrome / `0eb751eb…` Firefox — the one pre-existing capability byte apart, 5.1's correction); app chunk `app-Ca7QdFgV.js` **379,044 B, md5-identical across engines**; 3.4's import fence green (58 shipped files); golden EMPTY; `permissions: []` both. ⚠ The **"manifest 2,975 B"** fence repeated by entries 3.1–5.1 is again confirmed to name NO built artifact — measured **654 B (Chrome) / 770 B (Firefox)**; the 2,975 figure is exactly `wc -c tests/manifest.test.ts`, i.e. a copy-carried number pointing at the wrong file. Still flagged for 8.1 / 9.3, not edited retroactively. ★ **5.2 DONE — GROUP 5 (THEME SYNC, D-7) IS COMPLETE.** **TASK 6.1 IS DONE — GROUP 6 (SYSTEMIC FAILURE AND DEGRADATION) IS NOW OPEN**, and its subject is the failure groups 3–5 cannot reach: the whole ~3.3 MB lazy chunk never arrives, so NO fence in the document ever gets an SVG. **TEST-ONLY** — `tests/browser/diagramDegrade.browser.test.ts` is the only file added. `diagramEnhancer.ts` appears in §6.1's Files as the SUBJECT OF THE REVERT ("remove the load-failure catch"), not as a change: the catch has existed since 3.2 and §6.1 says D-15 "makes this the default state rather than a recovery path; **this task proves it**". The file is byte-identical at HEAD, and both bundles are unmoved — content script **316,122 B both engines** with per-engine md5 stable, app chunk `app-Ca7QdFgV.js` **379,044 B, md5-identical across engines**. ★ **THE DEGRADATION §6.1 SPECIFIES IS PLAIN VISIBLE SOURCE PLUS §3.8's PER-FENCE MARKER — NOT A SYSTEMIC BANNER, AND NOT MARKER SUPPRESSION.** §6.1 names a visible source `<pre>`, readable text, an interactive reader and no stranded placeholder, and it names no banner; §3.8's three failures all end at the same `markDiagramFailed`. So what makes an engine-load failure SYSTEMIC is not a different presentation — it is the COUNT and the UNIFORMITY: one failure, **all N fences in the identical state**, never the partial document a per-fence failure produces (3.2's mixed doc: one fence source, the next rendered). No banner was invented. **THE CLAIMS, over a FOUR-diagram document driven through `appShell.ts:134-135`'s shipped body (`mount(...)` then `enhanceDiagrams(...)`) with the injectable `loader` — the seam that has existed since 3.2 for exactly this — forced to REJECT** (§6.1 names the reject case; **no new production seam was grown**): every fence lands `failed` with computed `display` ≠ `none`, non-`hidden` visibility and a laid-out height > 0; each `<pre>` holds **its own** diagram source VERBATIM (four DISTINCT sources, so "readable" is per fence rather than per document); **zero placeholders left** — none pending AND none left over at all, §6.1's "resolved or removed" read both ways; four markers, one per fence, each naming *"the diagram engine could not be loaded"* and each sitting beside its own fence; the prose at both ends survives and the non-mermaid `ts` fence is untouched (no state attribute, no placeholder, no marker) — the enhancer degraded the FENCES, not the document. **THE READER STAYS INTERACTIVE**, proved through the shipped Raw/Reading control `mount()` commits into every reader: focusable (`shadow.activeElement`), really clicked, `data-mode` flips reading→raw, the LAZILY BUILT raw view holds all four diagram sources, clicked back, and the degraded state survives the round trip. ★ **NON-VACUITY ON TWO AXES, because each claim passes trivially on a dead harness.** (1) "the source stays visible" is TRUE of a fence never enhanced — so the SAME harness and SAME fixture with the loader OMITTED (the production `import('mermaid')`) renders four figures with real `<svg>`, hides all four `<pre>`s at `display:none`, and produces ZERO markers; a fourth arm drives `createReaderPane` end to end with nothing injected at all and agrees. (2) "no placeholder is left stranded" is TRUE of a document that grew none — so each failure arm reads the placeholder count **synchronously**, before the async body can have run, and requires FOUR, then requires zero after. Resolved, not absent. ★ **REVERT-AND-FAIL, TWICE, BOTH ENGINES, RESTORED FROM A `cp`.** (a) Remove the engine-load catch and the rejection escapes a `void`-ed promise — red on Chromium AND Firefox in the defect's own units: *"the engine-load degradation never happened: **4 placeholder figure(s) LEFT STRANDED** and 4 fence(s) still pending, of 4 enhanced fences"*, i.e. the user is left with four EMPTY BOXES rather than four code fences. (b) The sharper one — a catch that clears `pending` but does NOT resolve the placeholder — red as *"figures left over: expected … to have a length of +0 but got 4"* on both engines, which proves the leftover-figure assertion is load-bearing INDEPENDENTLY of the settle barrier (a) trips. ⚠ **STATED HONESTLY: the interactivity clause has no revert of its own.** `enhanceDiagrams` returns synchronously and its async body touches only the fence pairs, so no engine-load defect can wedge the reader's controls; the interactivity arm reds under (a) only because it waits at the same settle barrier, and passes under (b). Its instrument is effect-based (a broken control WOULD red it) and the clause is asserted as §6.1 names it, but it is **not sensitive to this defect** — recorded rather than dressed up. Coverage: **unit 728 unchanged** (the unit project excludes `tests/browser/**` by config, so 6.1 cannot reach it); **browser 799 → 807 passed / 15 skipped**, 92 → 94 files (+8 = 4 cases × Cr+Fx). `eslint` + `tsc --noEmit` clean. NUL check **0 both forms** on every touched file. 3.4's import fence green **8/8** and the scanner green (58 shipped files); golden EMPTY; `permissions: []` both; `mount.ts` / `contentWatch.ts` / `idbCore.ts` / `diagramCache.ts` / `diagramView.ts` byte-identical; no new dependency. ⚠ **One AMBIENT unit red seen once in five runs** (2 of 728) on a run that took **49 s against a 10 s norm** — machine load, not 6.1, which the unit project cannot see. Not reproduced in the four runs around it; the failing file was not captured, so it is recorded UNATTRIBUTED rather than guessed at. ⚠ The **"manifest 2,975 B"** fence §6.1 repeats is the same copy-carried number 5.1 and 5.2 already flagged — it is `wc -c tests/manifest.test.ts`, not a built artifact (measured **654 B Chrome / 770 B Firefox**). Still for **8.1 / 9.3**, not edited retroactively. ★ **THE POINTER ADVANCES: 6.1 DONE — GROUP 6 IS OPEN. 6.1 HANDED OFF TO 6.2 — STORAGE UNAVAILABLE / UPGRADE FAILURE** (discharged at `a222af5`), and it is **NOT** 4.4's oversized-diagram case: 4.4 was the cache quietly REFUSING ONE ROW; 6.2 is IndexedDB itself gone — a schema that cannot be opened or upgraded must **say** caching is unavailable in words, while a rejecting WRITE stays quiet and surfaces nothing blocking. **TASK 6.2 IS DONE — GROUP 6 (SYSTEMIC FAILURE AND DEGRADATION) IS COMPLETE.** 6.1 was the ENGINE gone; 6.2 is STORAGE gone — a different layer and a different degradation, because the engine needs no IndexedDB. Every diagram still DRAWS; it simply never persists, so every render is a cold one and no hit ever lands. ★ **§4 HAS TWO STORAGE CLAUSES AND THEY ARE NOT THE SAME RULE TWICE — that distinction IS the task.** *Cannot be read or written* → render normally, no blocking error: **SWALLOWED**. *Schema cannot be opened or upgraded* → keep rendering and **SAY** caching is unavailable: **SURFACED**. **NOT TEST-ONLY** — §6.2's Files names `src/app/diagramCache.ts` · `src/app/appShell.ts` · `tests/browser/diagramDegrade.browser.test.ts`, and the swallowing half already shipped at 4.3 while the SAYING half did not exist. `diagramCache.ts` gains ONE BIT: `cacheConnection()` wraps `connection()` and records `schemaUnavailable`, set **only** where the connection fails, so a rejected `put` against a healthy store — 4.4's oversized refusal included — never lights it; it has **no test seam** and self-clears on the next connection that succeeds, because a stale `true` would go on claiming caching is off after storage came back. `appShell.ts` gains the words, on the surface §3.9 already made the cache's disclosure surface. ★ **THE BUG THIS REPLACED WAS A LIE, NOT AN OMISSION.** A `describeStored()` that THREW landed on `EMPTY_SUMMARY`, whose line reads *“Nothing stored — Peekover is holding no folders, recents, or pins on this device.”* — a claim about a store we had just failed to open. The absent-reader path (a minimal fake store, legitimately empty) is untouched; only the THROW path changed. ★ **THE SEAM IS A BROWSER GLOBAL, NOT A PRODUCTION HOOK.** `indexedDB.open` is patched to refuse the `peekover` database **by name** (what a corrupt profile, a denied quota or an already-newer version does), and `IDBObjectStore.prototype.put` to reject **only** the two diagram stores (so settings, folders, recents, pins and snapshots still write). Both restored in `afterEach`. **`idbCore.ts` is byte-identical and its `:5-9` STOP signal is untripped** — no index, no compound key, no cursor, no migration, no new function; `store.ts`, `diagramEnhancer.ts`, `storageControls.ts`, `mount.ts`, `contentWatch.ts` and `entrypoints/` are byte-identical too. **FOUR ARMS, Cr+Fx.** (1) **open rejects, real store**, driven through the shipped gesture (`mountAppShell` → grant → click the file → `renderWithDiagrams`): the diagram renders, fence `rendered` and `display:none`, real `<svg>` adopted, ZERO markers, ZERO stranded placeholders, prose at both ends intact, **engine invoked exactly once** (cold — nothing to hit), and the panel line **says** *“Diagram caching is unavailable …”* while no longer claiming *“Nothing stored”*. (2) **open rejects, healthy injected reader** — `describeStored` succeeds and returns an ordinary summary, so the line can only have come from `isDiagramCacheUnavailable()`; the injected reader's own line survives beside it (added to, not replaced). (3) **a WRITE rejects in an OPEN store** — **presence AND absence together**: figure present and `rendered`, engine invoked once, then `readDiagram(key)` `undefined` and `describeStored().diagrams.count` **0** (the write really did reject), no `alert`/`confirm`, no `dialog[open]`, no `[role=alertdialog]`, no marker — **and the panel does NOT say caching is unavailable**. That disagreement with arm 1, same product and same panel, is the surfaced-vs-swallowed proof. (4) **NON-VACUOUS CONTROL, WORKING STORE, SAME HARNESS** — pass 1 invokes the engine **1** and the row really writes (`readDiagram` truthy, `diagrams.count` **1**); pass 2 invokes it **0** with the figure still on screen (a HIT, not a hole); and a healthy store says nothing. ★ **NOT 4.4, AND THE FIXTURE PROVES IT:** 4.4 refused ONE OVERSIZED ROW against a HEALTHY store — a SIZE decision. Nothing here is about size; there is no oversized fixture in the block, the diagrams are ordinary small flowcharts, and the failures are the STORE itself. ★ **REVERT-AND-FAIL × THREE, EACH REDDENING A DIFFERENT CASE, BOTH ENGINES, RESTORED FROM `cp` (md5-verified).** (a) **The load-bearing one** — remove `storeDiagram`'s catch and the rejection escapes into `drawDiagram`'s sanitize try, where `storeDiagram`'s call site sits: arms **1, 2 AND 3** red as *“a diagram that RENDERED was lost to a storage failure — **0 figure(s) survive of 1**, and the marker(s) under the fence read [“Diagram not shown — the drawn diagram was rejected by the sanitizer.”] … expected ['failed'] to deeply equal ['rendered']”* — a storage write failure misreported as a SANITIZER rejection over a diagram mermaid drew perfectly, with arm 4 (working store) staying GREEN so the red is attributable to storage and not to the harness. (b) Revert the `appShell` surfacing — arms **1 and 2** red, and the red PRINTS the lie: *“Its lines were: [“Nothing stored — Peekover is holding no folders…”]”*. (c) Revert the cache's availability bit alone — **arm 2 ONLY**, arm 1 still green, which is what proves the `diagramCache.ts` half load-bearing independently of the `appShell.ts` half. ★ **THE CONTROL CAUGHT A REAL DEFECT IN THE TEST.** Arm 3's `toBeUndefined()` first passed for the WRONG REASON — the key was re-spelled by hand and missed the fence's trailing newline, so `readDiagram` missed a row that was never written anyway. Arm 4 refused to find the row it had just written, and the key is now derived through `diagramSourceOf(…)` off the rendered fence, which is the function the enhancer itself keys on. **BUNDLES:** content script **UNMOVED on both engines** — 316,122 B and per-engine md5 IDENTICAL (`a55ef1e0…` Cr / `0eb751eb…` Fx), which is the fence an app-page-only change must not move. App chunk **379,044 → 379,445 B, +401 B, ACCOUNTED BY ABLATION**: `diagramCache.ts` alone **+60 B** (the bit, the getter, the wrapper), `appShell.ts` **+341 B**, of which **174 B is the user-facing sentence itself** and 167 B the helper, the new `readSummary` body and the import binding; md5-identical across engines. The sentence is proved PRESENT in the shipped chunk against a control string proved ABSENT, and the rationale comments are proved STRIPPED (they are `//` comments, not template-literal CSS). **COVERAGE:** unit **728 unchanged** (the unit project excludes `tests/browser/**`); browser **807 → 815 passed / 15 skipped**, 94 files (+8 = 4 arms × Cr+Fx). `eslint` + `tsc --noEmit` clean. NUL check **0 both forms** (`tr -d -c` AND python) on all three touched files, with a firing control reading **1** in both. Import fence green **8/8**; golden EMPTY; `permissions: []` both; 28 tasks / 9 groups intact; no new dependency. ⚠ **THE AMBIENT UNIT FLAKE IS NAMED THIS TIME**, which 6.1 could only record unattributed: `src/render/diagramEnhancer.test.ts`, **2 of 728**, two 5000 ms timeouts on a **60.9 s** run against a **10.1 s** norm — green in the immediately following run and in every run since. Machine contention, not 6.2, which cannot reach the unit project. ⚠ The **“manifest 2,975 B”** fence §6.2 repeats is the same copy-carried number: re-measured this session, **2,975 B is exactly `wc -c tests/manifest.test.ts`**, while the built artifacts are **654 B Chrome / 770 B Firefox** — confirming 6.1's finding rather than contradicting it. Still for **8.1 / 9.3**, not edited retroactively. **6.2 DONE — GROUP 6 COMPLETE.** **TASK 7.1 IS DONE and GROUP 7 (COPY · DOWNLOAD · LIGHTBOX) IS OPEN** (§3.11, rows 5, 7, 11, 14–17, 20). §7.1's control group is two real `<button>`s built into the figure by `diagramView.ts` and styled in `readerCss.ts`: **copy-as-image** (a PNG on the clipboard) and **download-as-SVG** (a `blob:` anchor named `diagram-N.svg`), revealed on hover AND on `:focus-within`, with a per-figure `role="status"` live region. ★ **EVERY ASSERTION IS ON THE PRODUCT, NEVER ON PRESENCE** — the affordance-mode vacuous pass this task was warned about. The captured `ClipboardItem` is ONE `image/png` whose first eight bytes are the PNG signature and whose **decoded bitmap** matches the on-screen `<svg>`'s box; the captured download Blob is `image/svg+xml`, opens with the XML prolog and carries that diagram's own labels and not the other's. SUCCESS-vs-NOTHING on both: the recorders are empty before the click. ★ **THE PRODUCT IS THE SANITIZED ADOPTED ARTIFACT — PROVEN, NOT ASSERTED.** A marker planted INTO the live `<svg>` *after* adoption comes back in the saved bytes; a re-render, a re-derivation from the source fence, or a copy stashed at build time all miss it. Neither action can reach the engine's raw pre-sanitize string — `diagramView.ts` has no engine and no cache, so the only SVG in scope is the one on screen. **ROW 14 IS THE DESIGN, NOT A HOPE:** the group is **re-inserted** across a theme swap (same button objects, new `<svg>`) and rebuilt by the next mount, and every handler resolves figure → `<svg>` → ordinal at ACTIVATION time. ★ **EIGHT REVERTS, EVERY ONE FIRING, BOTH ENGINES, RESTORED FROM `cp`:** (1) the load-bearing one — capture the artifact when the group is built → after a theme flip the saved bytes carry `ARTIFACT-BEFORE-THE-FLIP`; (2) resolve the FIRST `<svg>` in the tree → diagram 2's copy is a **487 px** raster of diagram 1 instead of **55 px**, named in pixels; (3) drop the selection from the accessible name → row 17 reds naming actual vs expected; (4) state by colour only → `'Copy image'` where `'Copied'` was due; (5) live region not `hidden` while empty → row 20 reds; (6) re-derive a fresh `<svg>` instead of reading the adopted node → the probe marker is absent (the security-shaped revert); (7) CSS `position:fixed` → row 11 reds AND the group fails to track its figure by **120 px** of scroll; (8) CSS without `:focus-within` → the keyboard reveal never happens. ⚠ **THE FIRST RED-FIRST ATTEMPT WAS INERT AND IS RECORDED AS SUCH:** the capture used `instanceof Element`, but the adopted content is a `DocumentFragment`, so it captured `null`, fell through to the live path and left all 44 green. A revert that does not fire is not evidence — it was fixed and re-run before being counted. ⚠ **A REAL REGRESSION, CAUGHT BY A SIBLING SUITE'S OWN CONTROL:** the live region shipped as a `<p>` and was therefore a paragraph OF THE DOCUMENT to every `.peekover-reader p` rule and selector — it reds `diagramRender.browser.test.ts`'s row-5 control, which requires each column paragraph to have a real box (this one is `hidden`). Corrected to a `<div role="status">`: chrome that lives inside the column is not text the document contains. **BYTES, DECOMPOSED BY ABLATION WITH NO UNNAMED RESIDUAL.** Content script **316,122 → 317,337 B (+1,215)** on both engines — **exactly** the byte length of the CSS block added to `READER_CSS`, and a third build with the `diagramView.ts` code reverted and the CSS kept reads the **same 317,337**, so the delta is CSS and nothing else. This is 3.1's precedent (`1e09164`: 315,671 → 315,974, +303 = its own CSS block), not a fence breach: §7.1 names `readerCss.ts` in its Files, `diagramView.ts` is **absent from the content-script graph** (only `diagramEnhancer.ts` imports it), and the rules are `.peekover-reader .peekover-diagram*`-scoped, so they are **inert on the content-script surface — 1,215 B of CSS that surface cannot use** (stated for 8.1/9.x, not hidden). App chunk **379,445 → 384,710 B (+5,265)** both engines = **1,215 CSS + 4,050 code**, of which **721 B is user-facing copy and class names shipped verbatim** (27 strings, each proved present in the chunk). **COVERAGE:** unit **728 unchanged** (the unit project excludes `tests/browser/**`); browser **815 → 859 passed / 15 skipped**, 96 files (+44 = 22 cases × Cr+Fx). `eslint` + `tsc --noEmit` clean. NUL check **0 both forms** (`tr -d -c` AND python) on all three touched files, with a firing control reading **1** in both. Import fence green **8/8**; golden EMPTY; `permissions: []` and no `web_accessible_resources` on **both** built manifests; `tests/manifest.test.ts` green at **2,975 B** (re-measured — 6.2's reading confirmed: 2,975 IS `wc -c` on the source file, the 654/770 figures are the built artifacts); `mount.ts` · `contentWatch.ts` · `diagramEnhancer.ts` · `store.ts` · `idbCore.ts` · `diagramCache.ts` byte-identical; 28 tasks / 9 groups intact; no new dependency; no new production seam — the clipboard and the anchor are browser globals, stubbed from outside. ★ **7.1 DONE.** **TASK 7.2 IS DONE — GROUP 7 IS STILL OPEN** (§3.11, §5 a11y, rows 4b, 8–12, 16, 19, 21). ★ **ROW 21'S BASELINE NOW EXISTS.** The audit recorded that NO element in this codebase traps focus, so there was nothing to transcribe and nothing would have been noticed missing; `tests/browser/diagramLightbox.browser.test.ts` (21 cases × Cr+Fx) is that baseline. ★ **HAND-ROLLED, NOT `<dialog>.showModal()` — AND THAT IS WHY EVERY CLAIM IS LOAD-BEARING.** `showModal()` would have donated the trap, the top layer and Escape, at which point four of these tests would be assertions about the browser and their reverts would introduce no defect. It was rejected on three specific grounds recorded in `diagramView.ts`: the top layer is per-DOCUMENT and would promote the panel out of the shadow root's stylesheet scope; `::backdrop` covers the ENTIRE viewport including the TOC rail, which rows 8+9 forbid; and `<dialog>`'s Escape is a document-level cancel that cannot be scoped, while §3.11 forbids a new global bare key. The listener is on the lightbox ROOT and only ever sees a key because focus is trapped inside it — modal-scoped by construction. ★ **THE KEYBOARD IS REAL, NOT DISPATCHED.** A synthetic `KeyboardEvent` does not move focus (the advance is a default action reserved to trusted events), so a dispatched Tab would make the NO-TRAP build look identical to the trapped one and the revert would leave the suite green. Tab/Shift-Tab/Escape/Enter go through `userEvent` (Playwright's keyboard). Focus is read as `shadow.activeElement`, never `document.activeElement`, which reports the HOST for anything in a shadow tree and cannot tell the close button from the reader behind it. **No production seam was grown for either.** ★ **SEVEN REVERTS, EVERY ONE VERIFIED TO ACTUALLY RED, BOTH ENGINES, RESTORED FROM `cp`:** (1) THE ANCHOR — drop the focus restore → **10 red**, naming `document.activeElement=BODY` instead of the opener; (2) drop the Tab-wrap → **4 red**, Tab landing on `BODY` and Shift-Tab on `button.peekover-diagram-action` — literally §7.2's “focus escapes to the document behind, naming the element it landed on”; (3) drop Escape → **6 red** (it stays open); (4) drop the initial focus → **12 red**, focus stranded on `button.peekover-diagram-open` outside the modal; (5a) read the FIRST figure's `<svg>` → diagram 2's lightbox shows `AlphaBravo`; (5b) show a copy stashed at commit time → the marker planted into the LIVE `<svg>` after adoption is absent; (6) mount INSIDE `.peekover-reader` → row 4b reds. ⚠ **AND ONE REVERT THAT LEFT THE SUITE GREEN — A DEAD CONTROL, FOUND AND REMOVED.** 7.2 first shipped `@media (prefers-reduced-motion:reduce){…__panel{animation-duration:.01ms}}`; deleting it changed no observable, because `READER_CSS`'s sheet-wide `:host *{animation-duration:.001ms!important}` already matches the panel. Per 7.1's finding a revert that reds nothing is a broken control, not a passing one — so the redundant rule was **deleted as dead bytes** rather than counted, and the CSS pin re-measured. Row 19's other half IS ours and DOES red: removing `animation:peekover-diagram-zoom 180ms` reds naming `'none'` vs `'peekover-diagram-zoom'`. The suite still asserts both halves — the behaviour is required whoever provides it — but 7.2 does not claim to be what provides the reduce half. ★ **A REAL DEFECT THE GEOMETRY TESTS CAUGHT.** The lightbox was first added to `CONTAINED_CSS`'s fixed→absolute list with the other chrome. The app page's reader pane is the scroll container (`appShell.ts` `__reader{overflow:auto}`) and the shadow host grows to full document height, so `absolute` anchored the panel 64 px from the top of the DOCUMENT: on any scrollable document the modal opened off-screen and taking focus into it yanked the reader to the top (row 12 red, reader `top` moving 0 → −205). The lightbox is now the ONE piece of contained chrome that stays `position:fixed` — a pill pinned to the window is misplaced, a MODAL pinned to the window is correct by definition. **CONTENT IS THE ADOPTED, PROFILE-PASSED ARTIFACT**, cloned from the figure's live `<svg>` at ACTIVATION time (row 14's property again) — no re-render, no cached string, no path back to the engine's raw pre-sanitize output that would re-admit the `<style>`/`<foreignObject>` §3.5 strips. A CLONE, not a move, so the reader's own figure is never emptied. **NON-VACUITY** throughout: a no-modal/opener-focused → modal/focus-inside → modal-gone/opener-focused control; the panel proved to have a real box before any “clears” or “does not move” assertion; and Escape shown to be a no-op with nothing open **and** to close when open, so the “no global bare key” claim is not a key the harness merely failed to deliver. **BYTES, DECOMPOSED BY ABLATION WITH NO UNNAMED RESIDUAL.** Content script **317,337 → 318,747 B (+1,410)** both engines — **exactly** the CSS block's own growth (1,517 → 2,927 B), and a build with the CSS reverted and the `diagramView.ts` code KEPT reads **317,337, the baseline to the byte**, so the content-script delta is CSS and nothing else and the lightbox CODE is absent from that graph. 7.1's and 3.1's precedent, and those **1,410 B are inert on the content-script surface** (the content-script reader grows no diagram chrome — row 2), stated rather than hidden. Per-engine md5 stable, cross-engine differing in **exactly ONE byte**, at offset **315,470** (5.1's capability byte, moved forward by the CSS insertion). App chunk **384,710 → 387,837 B (+3,127)** = **1,410 CSS + 1,717 code**, the split measured by the same ablation. **COVERAGE:** unit **728 unchanged**; browser **859 → 901 passed / 15 skipped**, 98 files (+42 = 21 cases × Cr+Fx). `eslint` + `tsc --noEmit` clean. NUL **0 both forms** (`tr -d -c` AND python) on all four touched files, control firing at **1** in both. Import fence green **8/8**; golden EMPTY; `permissions: []` and no `web_accessible_resources` on **both** built manifests; `mount.ts` · `contentWatch.ts` · `appShell.ts` · `diagramEnhancer.ts` · `store.ts` · `idbCore.ts` · `diagramCache.ts` byte-identical — `diagramView.ts` imports NOTHING, so the modal cannot reach appShell's overlay machinery; 28 tasks / 9 groups intact; no new dependency. `diagramActions.browser.test.ts` was touched for ONE reason: its shipped-CSS byte pin, re-pinned **1,517 → 2,927 B** exactly as that pin's own failure message instructs on a rule change. ★ **7.2 DONE.** **TASK 7.3 IS DONE — GROUP 7 (COPY · DOWNLOAD · LIGHTBOX) IS COMPLETE** (§3-6, §3.11, §5 manifest pin, AGENTS.md #4). ★ **THE DOC READ IS NOW A BUILD.** 7.1 stubbed `navigator.clipboard.write` and cancelled the anchor because it was testing WHICH BYTES the controls produced; 7.3 is the other half and lands in the same file, as §7.3's Files names — a nested `beforeEach` takes both recorders OFF, and the clicks are Playwright's REAL mouse (a dispatched `click()` carries no user activation, which is exactly the gate under test). Harness sanity first: `navigator.clipboard` carries **no own property** and `write` is **`[native code]`**, with a control showing those same checks DO fire on a recorder — without it every assertion below could have been passing against 7.1's stub and the section would prove the opposite of its name. ★ **THE MEASURED FINDING — THE TWO ENGINES GATE THE CLIPBOARD DIFFERENTLY, AND NEITHER GATE IS A MANIFEST KEY.** **Firefox writes the PNG on the gesture alone**: `clipboard-write` is not even a valid `PermissionName` in Gecko (the query throws `TypeError`), so there is nothing to ask for and nothing to grant — §3-6's claim in its strongest form. **Blink DOES consult the Permissions API**, and a Playwright browser context leaves that consent at `prompt`, so the identical real click reds **`NotAllowedError: Write permission denied`**. Measured `prompt` in the **TOP frame too**, so the locus is the browser CONTEXT, not the test iframe. ★ **SO THE CHROMIUM LEG IS AN A-B ABLATION, AND ITS OFF ARM IS PINNED RATHER THAN CONDITIONAL** (an ablation whose off-arm can quietly not run is no ablation): consent `prompt` → the button settles **`failed`**; grant `clipboardSanitizedWrite` over CDP **at the browser-context level** (`Browser.grantPermissions` needs the `browserContextId` — without it the grant lands elsewhere and the state stays `prompt`, measured) → consent reads `granted` → the same button settles **`done`**. Same build, same button, same bytes, **nothing rebuilt between the arms**. The variable that moves the outcome is a **browser consent**, not a manifest key — which is precisely what §3-6 claims about the write path. ⚠ **WHAT THIS DOES NOT PROVE, STATED SO NOBODY READS MORE INTO A GREEN:** that a focused, headful Chrome auto-grants that consent to a gesture-driven write. A Playwright context cannot exhibit that behaviour, so **that one leg of §3-6 stays a documentation finding rather than a build** — carried to the 9.x human gate, where a real browser is in the loop. It is written into the test's own header, not only here. **THE DOWNLOAD NEEDED NO CONSENT ON EITHER ENGINE.** `<a download>` over a `blob:` URL consults no Permissions API and no manifest key; the observer here is **PASSIVE** (it records and returns — the opposite of 7.1's capturing `preventDefault`), so the engine performs the download for real, and the case reads `diagram-1.svg`, a `blob:` href, **`defaultPrevented === false`** and a `done` settle: the default action really stood. **THE MANIFESTS ARE THE EMITTED ARTIFACTS, NOT THE SOURCE.** Read from `.output/` through a Vite glob — not `wxt.config.ts`, not a fixture: **Chrome 654 B / Firefox 770 B, both `permissions: []`, no `web_accessible_resources`, `manifest_version: 3`**. That absence is only a proof because it is an absence **DESPITE EXERCISE**: both actions reached `done` in the same browser session that then read them. ★ **NON-VACUITY AT TWO LEVELS.** §7.3's named control — deliberately malformed fixtures (`['clipboardWrite']`, `['downloads','tabs']`, a `web_accessible_resources` block, a `host_permissions` block, a missing `permissions` key) through the **SAME** `capabilityViolations()` the real artifacts go through — runs everywhere, including the CI leg. And the stronger one: the **REAL** `.output/chrome-mv3/manifest.json` was ablated to `permissions: ['clipboardWrite']` with a `web_accessible_resources` block, and the case **RED on both engines** naming the path and the injected permission (`expected [ 'clipboardWrite' ] to deeply equal []`), then restored from the `cp`. The reader reads the real file and would catch a real capability. ⚠ **A STATED SKIP, not a silent one.** `ci.yml` runs `pnpm test:browser` **before** `pnpm build` and never builds Firefox at all, so `.output/` is absent there and the built-manifest case skips **by name, in the reporter's skip count**. `tests/manifest.test.ts` (source-derived, **2,975 B**, untouched) is the CI guard and its header already writes that division of labour; the two are complementary — source-drift there, build-drift here. **TEST-ONLY, and the fences say so:** content script **318,747 B** both engines, md5 `c7b33b36…` (Cr) / `67717921…` (Fx) — unmoved; app chunk **`app-BT5Gfp9t.js`, 387,837 B**, md5 `9c161857…` both — unmoved. No production file touched (`git diff` over `src/` empty), `mount.ts` · `contentWatch.ts` at zero sites. **COVERAGE:** unit **728** (see the flake note below); browser **901 → 911 passed / 15 skipped** unchanged, 98 files (**+10 = 5 cases × Cr+Fx**) — the skip count not moving is itself the evidence the built-manifest case RAN rather than skipped. `eslint` + `tsc --noEmit` clean. NUL **0 both forms** (`tr -d -c` AND python), control firing at **1**. Import fence green **8/8**; golden EMPTY; 28 tasks / 9 groups intact; no new dependency. ⚠ **THE UNIT SUITE'S 2/728 IS PRE-EXISTING AND LOAD-DEPENDENT, PROVEN BY CONTROL.** `src/render/pipeline.perf.test.ts` (budget: 103.8 ms vs 100) and `tests/golden/golden.test.ts`'s 1 MB document (5 s timeout) red on a contended full run, are **GREEN when run alone**, and — the control that settles it — **BOTH RED AT HEAD with 7.3 reverted**, on a tree identical but for one browser-project file the unit project explicitly EXCLUDES. Not 7.3's. A different pair of members from the family named at 7.2, same shape. ✓ **THE LABEL CARRIED TO 8.1 IS NOW CLOSED (in this file).** §7.1/§7.2 wrote "manifest green **2975 B**" beside `permissions: []`, which reads as a built-manifest byte count. It is not — it is `wc -c tests/manifest.test.ts`, a **correct measurement with a wrong name**. The **built** manifests are **654 B (Cr) / 770 B (Fx)**, re-confirmed at 8.1. §7.3's own wording ("`tests/manifest.test.ts` green and 2975 B") was already the correct form. **8.1 relabelled it here and re-measured nothing**; the mislabel's source text in `specs/007-mermaid-diagrams/tasks.md` is outside 8.1's Files list and is routed to **9.3**. TASK 8.1 IS DONE (D-10) — **GROUP 8 IS OPEN**. It measured and **chose nothing**. Every § Baselines figure is re-run against the BUILT artifact at `4c580c4`: content script **318,747 B** both engines, app chunk `app-BT5Gfp9t.js` **387,837 B**, background **3,548 B**, built manifests **654 / 770 B**, zips **1,299,871 / 1,299,930 B** (**<2 MB PASS**, but 58% of M6's headroom consumed), packed **4.06 MB** against ≤5 MB. The **+3,076 B** content-script delta §8.1 calls a "0-delta fence" is a **STALE BASELINE, not a breach**: it decomposes across five named commits to a **residual of 0 B**, proven by building at all 21 M7 commits in a detached worktree — and the fence §8.1 actually asserts holds exactly, **the content script byte- and md5-identical on both engines with mermaid ablated away**, while the negative control fired **−3,349,366 B** in the same run. Three ledger corrections: 6.2 moved the app chunk only, and 3.1 (+303) and 4.2 (+113) were unrecorded content-script movers. **The first-paint half returned a NEGATIVE verdict and it is stated as one:** the A-B-A control disagreed with itself by **10.9 ms median / 13.4 ms floor**, more than the entire effect, so **no diagram-bearing first-paint cost is claimed**; the gate passes on all four arms (152.3–163.2 ms, worst-arm headroom 1.8 ms) and the 1 MB discriminator (+9.8%) says the machine, not the code, moved. A non-vacuity probe caught that the diagram-bearing arm renders **zero** diagrams on the content-script surface (`enhanceDiagrams` is app-page-only), so that PASS is **not** evidence the enhancement is post-paint — app-page first paint still has **zero automated coverage**, carried unfixed. The **2,975 B label is corrected here (test file, not manifest — the measurement was always right)**, and the content-script fence wording is corrected to **byte-length-identical + per-engine-md5-stable**, never cross-engine md5 equality: the engines differ by **exactly one byte at 0-based offset 315,470** (`backgroundCanReadFileUrls:!0/!1`), re-confirmed this session. **No production file moved; no bound was chosen.** **TASK 8.2 IS DONE (`80a86b1`) — D-8 + D-9, MEASURED, NOTHING CHOSEN.** Full numbers in § Baselines *THE D-8 / D-9 BOUNDS MEASUREMENT*; the two facts that outlive them: **D-9 is NOT a cap** (it is the typical-case time-to-rendered target — "D-8 and D-9 are the two numeric caps" is the natural and wrong reading), and **the eviction cliff is TOTAL, not graded** — one row over the count bound costs the entire cache's value for that document (51 re-renders at N=51, where the arithmetic predicted 2). Scratch harness deleted, both bundles byte-identical. **TASK 8.3 IS DONE (this commit) — D-11 walk material, and it COMMITS NO TEST.** The pending placeholder is **static** — an empty, zero-height `<figure>`, `animationName: none` on both engines — and **no task in 007 builds motion**, so §8.3's *"placeholders DO animate without `prefers-reduced-motion`"* clause and its revert-and-fail are **STRUCK as premised on an artifact never specified into existence**. Every writable form of the test decides D-11: asserting "animates" is impossible, asserting `animationName === 'none'` pins **static**, and building the shimmer pre-empts the gate — so 8.3 records instead. ★ **The hinge, for the third time (7.2's finding): `readerCss.ts:76-79`'s sheet-wide `:host *{animation-duration:.001ms!important}` owns any placeholder suppression**, proven with an injected stand-in shimmer (1.2 s free → 1e-06 s under `reduce`), so a D-11-specific reduced-motion rule would be a **dead control**. New material: `tests/golden/fixtures/diagrams-10.md` and `diagrams-50.md` (no existing fixture served — none carried a mermaid fence, and 5.2/8.1/8.2's 50-diagram fixture died with their scratch harnesses). ★ **And the walk's question is reframed by CELL 4: at document-open the reader shows a full column of prose and VISIBLE source fences, not a field of placeholders** — the figures are zero-height siblings until each SVG lands. ⚠ **§ Now was itself the pointer-lag case this file warns about: 8.2 advanced § Up next and left this line reading *"NEXT: 8.2"*, so the two sites disagreed until 8.3's sweep caught it.** **8.3 does not feed 8.4 — it feeds 9.1**, whose walk now has its documents. **TASK 8.4 IS DONE (`2bc131f`) — THE HUMAN GATE CHOSE, AND THE SIX VALUES ARE BANKED IN `decisions.md`, ONE ENTRY EACH, EACH NAMING THE § Baselines MEASUREMENT THAT JUSTIFIES IT.** **`count` = 150** (raised from 100 — CELL 3's cliff is TOTAL, so the choice is *where the discontinuity sits*; 150 puts it at N=75, clearing the heavy shape and §8's 50-case, and stays below ~200 where CELL 4d swaps the binding axis onto bytes); **`totalBytes` = 8 MiB, unchanged** (8.2's Reading B taken: a SAFETY VALVE, not a capacity limit — at count 150 the crossover is 55,924 B/row, above CELL 1's all-kinds mean of 42,350, so it binds only on a large-diagram-heavy cache; **never-binding in normal use is the design intent, so D-8's revisit-when is NOT tripped**); **`maxAgeMs` = 30 days, unchanged and recorded AS A POLICY JUDGMENT** — 8.2 proved the axis fires/doesn't-fire and measured **nothing** about the value, and the missing input (a re-read-interval distribution) needs telemetry **AGENTS.md #2 forbids forever**, so it will **not** become measured later; **D-9 = 165 ms median, cold, per-diagram-amortized, Chromium floor as the check** — set on CELL 6's axis (~15–17 ms/diagram; the 50-case first-opens at 840/1099 ms under §8's 5 s), and carrying **three caveats**: it **EXCLUDES the one-off `import('mermaid')`** so it is per-diagram cost and **NOT** user-facing first-open time (which is measured nowhere), it is a **COMMITMENT not a gate** (8.5 carries no timing assertion, so nothing enforces it), and it is recorded as **aspirational** with both statuses explicit; **D-10 = (b) narrow the `mermaid/package.json` inline** (~3,818 B, 8.1's second ablation) because zip headroom is thinning (0.70 MB, **58% of M6's margin consumed**), with **(d) WITHDRAWN as INERT** — a lazy boundary moves bytes *loaded*, which 8.1 already measured at **0** on the content script, so (d) collapses into (c) — and **(c) the subset build DEFERRED** until headroom forces it; and **the flip cost ACCEPTED with §1.3's progressive re-render QUEUED, NOT BUILT** (gate-2 (d) discharged) — at count 150 the flip-back is a full hit up to 75 diagrams, so users see 5.2's **~110 ms** hit-flip, not the ~540/910 ms miss, **★ CONTINGENT: if `count` ever drops below 2×(typical heavy N) the acceptance is VOID and §1.3 is revisited**. ★ **8.4 CHANGED NO PRODUCTION FILE, NO TEST AND NO CONSTANT** — both bundles byte-identical (content script 318,747 B both, per-engine md5 stable; app chunk 387,837 B, md5 identical), the three `PROPOSED_` constants untouched at `diagramCache.ts:95/106/117`, 3.4's import fence green 8/8. **8.5 SET them — see its entry below.** ★ **NEW CARRIED WORK, placed rather than assumed: D-10 (b)'s narrowing is NOT §8.5's** — §8.5's Files are `diagramCache.ts` + its test and "the ALGORITHM does not move — only constants" — so it is banked in **§ Carried items**, not added to `tasks.md` (8.4's Files list is `decisions.md` alone; §9.1 is the milestone's mechanism for adding a task). ★ **TASK 8.5 IS DONE (this commit) — THE SIX BANKED DECISIONS ARE NOW IMPLEMENTED, AND GROUP 8 IS COMPLETE (8.1 · 8.2 · 8.3 · 8.4 · 8.5).** The three constants were transcribed from `decisions.md`'s 2026-08-01 entries and from nowhere else: **`count` 100 → 150** (the ONE real value change), **`totalBytes` 8 MiB** and **`maxAgeMs` 30 days** unchanged in value but recorded either way — and the `PROPOSED_` framing came off all four names (`PROPOSED_DIAGRAM_COUNT` / `_TOTAL_BYTES` / `_MAX_AGE_MS` / `PROPOSED_BOUNDS` → `DIAGRAM_COUNT` / `DIAGRAM_TOTAL_BYTES` / `DIAGRAM_MAX_AGE_MS` / `DIAGRAM_BOUNDS`), reference-preserving with `tsc` as the completeness check. ⚠ **§8.5's Files list is one file short of the rename's reach**: `tests/browser/diagramCache.browser.test.ts` also imports `DIAGRAM_TOTAL_BYTES`, so leaving it would have been a half-done rename and a broken build; it was followed (an identifier-only edit, no expected number touched) and the widening is recorded here rather than done silently. **D-9's 165 ms target, D-10's disposition and the flip acceptance MAP TO NO CONSTANT, and none was created.** ★ **4.1's STRUCTURAL PIN HELD, and that green IS the proof**: the swap needed NO expected number edited anywhere — every fixture still passes small explicit bounds and the one constants case still asserts COMPOSITION — so the diff across both test files is identifier-only. §8.5 asks for no chosen-value pin, so none was added. ★ **THE ALGORITHM DID NOT MOVE, asserted rather than eyeballed**: the `// ── D-4: EVICTION PLANNING` region is md5-IDENTICAL old-vs-new (`c5aec5ac4d61`, 5,511 B), as are the D-3 key block (3,135 B) and the IDB layer (6,710 B); `storeDiagram` differs by exactly the one identifier. ★ **THE BUNDLE FENCE, AND THE FIRING CONTROL THAT MADE THE NULL MEAN SOMETHING.** The content script is **byte-IDENTICAL** on both engines (318,747 B, md5 `c7b33b36…` Cr / `67717921…` Fx) — `diagramCache` is app-page-only — and the whole `.output` tree moved **0 bytes** (4,058,587 → 4,058,587; 104 files; not one file with a size delta), because `100`→`150` is a same-length literal and the identifier names are minified away. A zero-byte delta on a real value change is precisely the case that needs a control, so the tree was decomposed byte-by-byte against an **ABLATED (HEAD-source) build**: 82 files changed content, and in **81 of them every differing byte lies inside an 8-char Vite chunk-name hash token** — a pure hash cascade off the app chunk's own hash — leaving **ONE residual byte in the entire tree**, at app-chunk offset 323,975: `var ru={count:100,…}` → `var ru={count:150,…}`. That single byte IS the proof the swap landed, and `8*1024*1024` / `720*60*60*1e3` sit beside it unchanged, confirming the two no-op-value renames really are no-ops. ★ **§8.5's ACCUMULATION RE-RUN, PREDICTION STATED BEFORE THE HARNESS RAN**, and the harness VALIDATED first against CELL 5 at the old bounds — it reproduces `document 39` (typical) / `document 10` (heavy) / rows pegged 100/100 / COUNT binding / 0 refusals **exactly**, so it is a re-run rather than a model. At the chosen bounds: **`count` STILL BINDS in both shapes**, first eviction moves **doc 39 → 57** (typical) and **doc 10 → 15** (heavy), rows peg **150/150**, and bytes rise to **6.26–6.47 MB = 74.7–77.2% of the 8 MiB cap** — so **`totalBytes` STILL NEVER BINDS**, as predicted and as the 8.4 entry designs it; `maxAgeMs` still fires at `now = cap+1` and does not at `now = 1`. **All five predictions confirmed.** *(The one honest gap: the reconstruction's steady-state byte BAND reads 4.16–4.30 MB where CELL 5 recorded ~4.18–4.45 MB — the four discrete readings reproduce exactly, the continuous band is directional.)* Golden EMPTY (10/10 byte-stable), 3.4's import fence green 8/8, `permissions: []` both, manifests 654 / 770 B, `idbCore.ts` / `snapshots.ts` / `contentWatch.ts` byte-identical, `tasks.md` still 28 tasks / 9 groups, no new dependency. **The named flake family fired, and was PINNED TO THE MACHINE rather than to the change**: `pipeline.perf` (126.1 then 141.8 ms against a 100 ms budget) and `golden-1MB` went red in the full unit run and went **equally red on an ablated HEAD-source tree in the same session**, both green alone; browser **911 passed / 15 skipped**. ★ **THE POINTER ADVANCES: GROUP 8 IS COMPLETE. NEXT: GROUP 9 — 9.1, the milestone-close HUMAN WALK** on real Chromium and real Firefox, with 8.3's 10- and 50-placeholder fixtures and its CELL 4 reframing as material; then 9.2's retro in a fresh session and 9.3's `architecture.md` correction, the "2975" mislabel and the memory reconcile. **D-10 (b)'s inline narrowing STAYS CARRIED** — its trigger (zip headroom below ~0.5 MB) is still unmet, and 8.5 did not touch it. ⚠ **Routed onward, NOT fixed at 8.1:** the `tasks.md` "manifest green 2975 B" mislabel at §7.1/§7.2 and in every §8.x fence line (8.1's Files list does not scope `tasks.md`) → **9.3**; the `architecture.md` `enhance`-stage correction → **9.3** per gate-2 (c); the sources-zip 4.29 → 1.92 MB gap (hypothesis tested and refuted, see § Baselines) → stated, ungated.

**★ BOTH FLAGS RAISED BY TASK 1.1 ARE NOW CLOSED — gate 3's approval banked (below), the SBOM defect
fixed at `1a202fd`. Neither ever blocked 1.2.**
- **CLOSED — Gate 3's approval IS NOW BANKED**, in `decisions.md` (the M7 GATE 3 entry, `66634fa`).
  M6 used a different shape: it landed `0e24f15 docs(tasks): M6 gate 3 — tasks 006 (snapshots + diff)
  approved and landed` **before** its task 1.1 (`a72f27f`), tasks and approval together. M7's tasks had
  already landed separately at `bfa131e` as an explicit draft, so only the written approval was
  outstanding and the bank entry is it. **`specs/007-mermaid-diagrams/tasks.md` still self-labels
  *"DRAFT awaiting gate 3"* at its header and footer, and that is CORRECT, not stale** — the gate-1/gate-2
  precedent puts approval in `decisions.md`, not the artifact's status line (spec 007 still reads "draft"
  post-`e09520f`; plan 007 still reads "draft — awaiting gate 2" post-`cab93c7`). **The decisions entry is
  the approval of record — do not "fix" the status line.**
- **CLOSED — `scripts/generate-sbom.ts` UNDER-REPORTED the production tree** (a latent defect that
  mermaid's depth was the first tree to expose), fixed at `1a202fd`: 90 → 120 components, dedup decoupled
  from descent. See § Blockers for the root cause and the proof.

M6 shipped snapshot capture on the app page, bounded retention (count 15 / 20 MiB / 30 days), a global
erase control, a persistent capture disclosure and an inline line-diff against any stored snapshot —
with **`permissions: []` intact** and the first `dependencies` addition since M1 (`diff@^9.0.0`). The
9.1 human gate PASSED and found three layout defects plus a disclosure gap, all fixed before close.
**The close record, the group summaries, the five recovery sessions, the two formal retractions and the
frozen M6-close pins are in [`progress-archive.md` § M6](progress-archive.md#m6--spec-006--snapshots--diff--closed-2026-07-27);
task-by-task detail is `specs/006-snapshots-diff/tasks.md`. Neither is restated here.**

**Two M6 facts that outlive the milestone — do not re-derive them from its narrative:**
- **The running human-gate score is 10/10**, corrected from the 8/8 written at 9.1 (the score counts
  DEFECTS: 7 before M6, M6 contributes 3). See § Closed milestones.
- **"None escaping" is FALSE for the first time.** Finding A shipped since M3 and was missed at three
  close gates, so nine of ten defects were caught at their own gate and **one escaped three**. The
  mechanical cause is that **no gate record on any milestone states the walk's VIEWPORT** — a gate
  walk now records its viewport the way it records its engines (`retro.md` 2026-07-27, finding 2).

**M7's direction and scope are SETTLED and live in § Up next** — the direction decision was banked at
`87cd026` and all three Gear-3 gates are behind it. No flag is outstanding there.

**The Now-pointer advances PER TASK** (the M1 rule — it once lagged four tasks and the next session
acted on stale state). The rule has four recorded failures and one mechanical remedy: **a pointer walk
as a discrete step in every gate-closing task** (`retro.md` 2026-07-27, finding 3) — grep `is next`,
`at the gate`, `waiting on`, `this commit`, `← NEXT` and the running score before committing. **This
archive pass ran that walk on itself.**


## Up next

### M7 (spec 007) — persona #1 completion via M7a (Mermaid + diagram cache) · IN IMPLEMENTATION, group 9

**Scope is SETTLED and all three gates are behind it** (see § Now). M7a is **Mermaid + a diagram
cache**; the rest of persona-#1 quality-of-life (compare-any-two-files, agent-file awareness, table
tools) is on spec §6's IS-NOT fence and is **not** in this milestone. The argument that selected it:
six milestones landed almost entirely inside persona #1's column,
[`spec-coverage.md`](spec-coverage.md) puts that column at **~56%**, and the largest remaining hole in
it is the one item that needs a dependency Peekover has never installed.

**Implementation runs task-by-task from `specs/007-mermaid-diagrams/tasks.md`, one commit per task,
this pointer advancing in that same commit.** Next: **9.1 — THE MILESTONE-CLOSE HUMAN WALK** — *(★ **GROUP 8 IS
COMPLETE**: 8.1 · 8.2 · 8.3 · **8.4** · **8.5**. 8.4's human gate CHOSE, and the six
values are banked in `decisions.md` (2026-08-01, one entry each, each naming its § Baselines
measurement): **count 150 · totalBytes 8 MiB · maxAgeMs 30 days · D-9 165 ms · D-10 (b) · flip cost
accepted** — and **8.5 has now IMPLEMENTED the three that map to constants**: `DIAGRAM_COUNT` 100 → 150,
`DIAGRAM_TOTAL_BYTES` and `DIAGRAM_MAX_AGE_MS` unchanged in value but recorded, the `PROPOSED_` framing
off all four names, 4.1's structural pin green with no expected number edited, and the eviction
ALGORITHM byte-untouched. **D-9 / D-10 / the flip map to no constant, and none was created.**
**9.1 is now BOTH the next numbered task and the next human gate**, with 8.3's 10- and 50-placeholder
fixtures as its material. **8.3 fed 9.1, not 8.4** — it produced D-11
walk material and chose nothing. This line was corrected by 8.2 after reading `Next: 6.2` at `df256d6`,
four numbered tasks behind § Now; **FIVE pointer sites were re-checked at 8.5** (§ Now, this line,
§ Carried items, § Blockers — and a FIFTH the sweep turned up inside § Baselines' 8.2 record, which
was still asserting *"GROUP 8 REMAINS OPEN: 8.5"*) and all five agree at 9.1 / group 9.)* Groups 1 (1.1 ·
1.2 · 1.3) and 2 (2.1 ·
2.2) are complete, and the two D-1/D-6 ADDENDUM implementations that sit between them and group 3 —
the `secure` hardening (`3d7c8ed`) and the `<style>` CSS pass (`367d051`) — are both landed. Neither
is a numbered task, so neither advanced this pointer; `ff8f323`'s `<style>` blocker is CLOSED.
**GROUP 3 IS COMPLETE: tasks 3.1 (`1e09164`), 3.2 (`763f94d`), 3.3 (`ace4543`) and 3.4 (`522a3fe`) are DONE** — D-15's structure and
the synchronous prologue, then the async render body that loads the engine, sanitizes and adopts.
★ **The ~3.3 MB lazy chunk now EXISTS** (99 chunks / 3,347,306 B behind one `import()`), and the
content script is md5-IDENTICAL through it — the engine is on the app-page graph only, which 3.4 now
asserts STRUCTURALLY rather than leaving to the byte reading. **GROUP 3 IS COMPLETE.** The §4
remote-reference sub-arc is closed with it (`4061398` · `eae7b08` · `7a6dc63`). **GROUP 4 — THE
CACHE, END-TO-END (D-2 · D-3 · D-4 · D-14) — IS NOW OPEN**, and it is the first group whose
subject is persistence rather than rendering; nothing in group 3 pre-decided any of it (3.4's
Verify draws the boundary explicitly: the cache is NOT 3.4). **Task 4.1 (`443bdee`) is DONE** —
the pure layer, wired to nothing. **Task 4.2 (`01339fd`) is DONE** — the schema bump: `DB_VERSION`
3 → 4 with `diagramMeta` + `diagrams` appended to `SCHEMA` (**two stores, not one** — D-2),
additive-by-name with no migration code, `idbCore.ts` byte-identical and its `:5-9` STOP signal not
tripped, and all SIX existing stores' rows proven to SURVIVE the bump on real engines — like 4.1 it
**STORES NOTHING**. It also CORRECTED a fence premise: `store.ts` is content-script-reachable via 006's
capture wiring, so the content script moves by the ACCOUNTED schema delta (+113 B, decomposed with zero
residual) rather than not at all. **Task 4.3 (`a3005db`) is DONE** — THE CACHING COMMIT, and it did
not split: cache→enhancer, the REQUIRED `StoredSummary.diagrams`, the panel line, the third storage
control, `wipeAll` + `clearDiagramCache`, and the whole `PERMISSIONS.md` correction, all in one commit
(D-14). The seam question 4.2 carried is **answered with a ZERO**: content script byte- and
md5-identical both engines, and 3.4's import fence green 8/8 — the cache never touched that graph.
**Task 4.4 (`f133913`) is DONE — and GROUP 4 IS COMPLETE.** The cache under WATCH, proved through
the PRODUCTION path (`installWatchForFile` → `watchController`'s render seam → `renderWithDiagrams`),
never a hand-built controller: prose changes / fence byte-identical → the diagram serves from cache
with the engine NOT invoked, non-vacuous in the same test on both sides (the cold first render
invokes it; a fence-only edit invokes it again). Plus the quiet single-oversized path, asserting
PRESENCE and ABSENCE together — the figure really renders, no marker appears, nothing is stored, and
nothing is evicted. TEST-ONLY: both bundles byte-identical, no production file touched.
**Task 5.1 (`85d5cbc`) is DONE** (see § Now). The re-theme subscribes at
`applyTheme()` via `themeRegistry.ts`’s new `onEffectiveThemeChange`, NOT at `onThemeSettingChange()` —
and that choice is pinned by the defect it avoids, not by a doc comment: the red-first reverts to the
setting channel and an OS flip under `auto` leaves every diagram stale on both engines while the page
repaints. Re-render-and-swap keeps the previous rendering visible throughout (never blank, asserted by
frame sampler AND MutationObserver replay), the second flip is a cache HIT on group 4’s two rows, and
in-flight coalescing + pass supersession cut 3 renders per flip to 1. ★ The fence is RE-BASELINED:
`themeRegistry.ts` is on the content-script graph, so the content script moves by the D-7 notify loop
and only that (**316,122 B both engines, +35 B**, ablation-accounted); the ENHANCER stays OFF that graph,
proved structurally by 3.4’s import fence (8/8) and by greps with a firing control.
**Task 5.2 (`270dc82`) is DONE — and GROUP 5 (THEME SYNC, D-7) IS COMPLETE.** The flip-cost measurement, which
PRODUCED NUMBERS AND CHOSE NOTHING: at 50 diagrams the worst case — the first flip to a
never-rendered theme, a full miss on every one — is **Chromium floor 522.3 ms / median 538.9 ms** and
**Firefox floor 900.0 ms / median 910.0 ms**, A-B-A bracketed against a same-session cold-render
control whose two halves agree to −2.4% / −0.4%. The flip back is a full hit at roughly a fifth of
that. The cost is the ENGINE (≈77% of the window), not the cache write-through (≈1.5% / 0.2%), and
there is **no flicker** at 50. It is a **doc measurement, not a committed test** — §5.2's Files list
names only this file plus the task report, and a committed time bound would both flake and smuggle
in the threshold 8.4 owns. **Nothing chosen, no bound picked, and plan §1.3's progressive
visible-first fallback NOT built** — gate 2 re-routed §7-9's flip cost to **gate 3**, which reads
these numbers at **8.4**. See § Now for the full figures and the `PROPOSED_DIAGRAM_COUNT` saturation
finding.
**Task 6.1 is DONE — and GROUP 6 (SYSTEMIC FAILURE AND DEGRADATION) IS NOW OPEN.** The whole lazy
chunk fails to load, so no fence ever gets an SVG — and the fallback state **IS** the pre-enhancement
state, because D-15 only hides the source on SUCCESS. Four distinct diagrams, driven through
`appShell.ts`’s shipped `mount` → `enhanceDiagrams` body with the injectable loader (present since 3.2)
forced to REJECT: all four fences visible and readable with their OWN source verbatim, zero
placeholders left, four §3.8 markers naming the engine load, prose intact at both ends, the non-mermaid
fence untouched, and the reader still interactive through the shipped Raw/Reading control. **The shape is
plain visible source plus the per-fence marker — no banner was invented**; what makes it SYSTEMIC is the
uniform count, not a different presentation. Two reverts, both engines, restored from a `cp`: removing
the catch reds naming **4 stranded placeholders**, and a catch that clears `pending` without removing
the box reds on **4 figures left over**. The interactivity clause has **no revert of its own** and is
recorded as such. **TEST-ONLY** — both bundles byte-identical, no production file touched.
**Task 6.2 is DONE (`a222af5`) and GROUP 6 IS COMPLETE** — an unopenable/un-upgradable schema SAYS
caching is unavailable, while a merely rejecting write stays quiet (4.3’s case, unchanged).

**GROUP 7 (COPY · DOWNLOAD · LIGHTBOX) IS OPEN; tasks 7.1 AND 7.2 are DONE** — the per-diagram
control group (copy-as-image, download-as-SVG) and the lightbox, all three operating on the artifact on
screen. See § Now for the full record. **Row 21 is discharged: the focus-trap-and-restore baseline now
EXISTS**, hand-rolled rather than borrowed from `<dialog>` precisely so that trap, restore, Escape and
initial focus each have a defect available to them — every one verified to actually red on both engines.
**TASK 7.3 IS DONE and GROUP 7 IS COMPLETE** — the empirical re-proof on
both engines that neither action needs a MANIFEST permission, built rather than read: real trusted clicks
through the engine's own clipboard and the anchor's own default action, then both **built** manifests
re-read from `.output/` (654 B Cr / 770 B Fx, `permissions: []`, no `web_accessible_resources`). The
finding is that the two engines gate the clipboard differently and **neither gate is a manifest key** —
Firefox has no such permission at all, Blink wants a browser CONSENT, proven by an A-B ablation with
nothing rebuilt between the arms. **8.1 IS NOW DONE** (D-10 re-baseline, group 8 open).
**TASK 8.2 IS NOW DONE — D-8 + D-9 MEASURED, AND NOTHING CHOSEN.** *(8.3 has since landed too — D-11
walk material, no test, nothing chosen; and **8.4's human gate has since CHOSEN from these numbers** —
the six values are banked in `decisions.md` 2026-08-01, and the paragraph below records what each one
was, and **8.5 has since SET them — GROUP 8 IS COMPLETE**.)*
What D-8 and D-9 actually bound, resolved from `decisions.md` / plan §0 / spec §8 BEFORE measuring,
because a measurement aimed at the wrong quantity produces confident useless numbers: **D-8 is the
three-axis CACHE BOUND** — `count` (rows, placeholder **100**), `totalBytes` (bytes over stored SVG,
placeholder **8 MiB**), `maxAgeMs` (ms on `lastUsed`, placeholder **30 days**), all global,
oldest-first, whichever binds first (D-4 settled the axes; the values are open). **D-9 is NOT a cap at
all** — it is the **typical-case (1–3 diagram) time-to-rendered TARGET**, in milliseconds, that 8.4
sets from measurement. Both curves are in § Baselines → *THE D-8 / D-9 BOUNDS MEASUREMENT*. Headlines,
none of which is a recommendation: **the count axis binds in every session shape measured and the byte
axis never does** (it settles at ~51% of the 8 MiB cap while `count` sits pegged at 100/100); the
eviction cliff at the placeholder is **TOTAL, not graded** — 50 diagrams × 2 themes = 100 rows is a
FULL flip-back hit, 51 diagrams = 102 rows is a **full flip-back MISS of all 51**, because each
re-render's write evicts the next row the same pass is about to need; and D-9's cold cost is
**~15–17 ms/diagram (Cr) / ~15–22 ms (Fx)**, near-linear, with **time-to-first-diagram flat at
~14–18 ms regardless of N**. A-B-A resolved (drift +3.0% Cr / −0.6% Fx against 4–6× effects).
**Scratch harness deleted; both bundles byte-identical; no value chosen, no threshold committed.**
**8.4 HAS SINCE CHOSEN FROM THESE NUMBERS:** `count` **150** (from 100), `totalBytes` **8 MiB**,
`maxAgeMs` **30 days**, D-9 **165 ms** median cold per-diagram-amortized, D-10 **(b)**, flip cost
**accepted** — banked as six dated entries in `decisions.md`, each naming the cell above that justifies
it, and each carrying its caveats (D-9 excludes the engine import, is un-enforced, and leaves
user-facing first-open unmeasured; D-10's (d) is inert and collapses into (c); the flip acceptance is
void if `count` drops below 2×(typical heavy N); `maxAgeMs` is a policy judgment that will never become
measured; `totalBytes` is a valve by design). **NEXT: 9.1 — the milestone-close walk.** *(8.5 set the constants; ★ GROUP 8 IS COMPLETE.)* *(8.3 landed in between
and was NOT an input here: it produced D-11 walk material for 9.1, committed no test and chose nothing —
its own record is § Baselines → *THE D-11 PLACEHOLDER RECORD*. The half of §8.3 this line used to call
"the reduced-motion half that IS a test" was **struck**: the placeholder is static, nothing in 007
builds motion, and the sheet-wide `:host *` rule already owns any suppression.)*

- **DISCHARGED, recorded so it is not re-raised: the persona-#1 completion decision IS NOW BANKED** in
  `decisions.md` (`87cd026`, the M7 DIRECTION entry). The archive pass's flag is closed.
- **M7 owes a FLOOR-DELTA STATEMENT before any further first-paint re-baseline discussion**
  (`retro.md` 2026-07-27, finding 8), plus the optimisation question `decisions.md` 2026-07-26 routed
  to it — 006's +15.7 KB content-script growth is legitimate but, per the human note at 9.1, not
  sacred.
- **Before the first task of any group, re-read the standing rules that keep costing time when
  skipped:** `docs/ai/decisions.md` (the harness ledger, the dead ends, the both-engines gate
  procedure) and `docs/ai/retro.md` (newest entry first).


### Carried items
*Banked deliberately, each with a recorded home. Do NOT guess at any of them; every one is either
measurement-driven or explicitly deferred.*

- **★ NEW AT 8.4 — NARROW THE `mermaid/package.json` INLINE (D-10 disposition (b)), ~3,818 B. THIS IS
  NEW CARRIED WORK, AND ITS PLACEMENT WAS RESOLVED RATHER THAN ASSUMED.** 8.4's human gate **took the
  disposition**; it did not do the work. **§8.5 did NOT own it, and 8.5 HAS NOW LANDED without touching it — this STAYS CARRIED, its trigger
  still unmet** — §8.5's Files are
  `src/app/diagramCache.ts` · `src/app/diagramCache.test.ts` and its body says *"The ALGORITHM does not
  move — only constants"*, and narrowing the inline is neither of those files nor a constant. It is
  **not** added to `specs/007-mermaid-diagrams/tasks.md` either: 8.4's own Files list is
  `docs/ai/decisions.md` alone, and **§9.1 is this milestone's stated mechanism for adding a task**
  ("a real finding → a task added below this line, not a silent fix"). So it lands here.
  **The work:** a Vite `define` narrowing the static `import pkg from 'mermaid/package.json'` to the one
  field `engineVersion()` reads (the D-3/D-13 amendment, `decisions.md` 2026-07-28). **The number:**
  8.1's second ablation moved the app chunk **387,837 → 384,019 B, −3,818 B**. **Why now-ish and not at
  close:** the `< 2 MB` zip bound is **not breached** (1,299,871 / 1,299,930 B) but the *trend* is —
  **0.70 MB of headroom where M6 had 1.65 MB, 58% of M6's margin consumed by this one milestone**.
  **What is NOT carried with it:** option **(d)** (a stricter lazy-load boundary) is **WITHDRAWN as
  INERT** — it moves bytes *loaded*, which 8.1 measured at **0** on the content script already, so it
  collapses into (c); option **(c)** (a mermaid subset build) recovers more but risks mermaid's lazy
  chunk graph, which §3.2's whole content-script fence depends on, and is **DEFERRED until headroom
  forces it**. **REVISIT WHEN:** zip headroom falls below ~0.5 MB or any further dependency lands —
  **(c) is then forced and (b) is no longer sufficient**. Full reasoning in `decisions.md` 2026-08-01
  (the M7 D-10 entry).
- **★ THE WATCH PILL IS NOT DISCOVERABLE — the 7.1 gate's ONE finding, SHIPPED AS-IS by human decision,
  carried rather than filed as a defect.** Asked whether they would have found it unaided, the human said
  **no**: bottom-left, third in a stack (network → theme → watch), unlabelled until looked at.
  **The placement is correct AND measured, which is why this is not a placement bug** — 4.1's throwaway
  probe ruled out top-right (collides with the TOC handle) and bottom-right (inside the TOC rail's live
  entry list) with real rects, and bottom-left was the only corner clearing everything. **"Right corner"
  and "discoverable" are different properties**, and the geometry offers nowhere better.
  **WHY IT SHIPS: discoverability is an ONBOARDING problem** (product spec F11), and **005 has no
  onboarding surface to hang a hint on**. Inventing chrome at a gate is how you get unwalked UI — the one
  thing this project's whole gate discipline exists to prevent. **REVISIT WHEN:** onboarding lands, or a
  first-run hint becomes cheap on an existing surface. Recorded in `decisions.md` (2026-07-21) with its
  reasoning; kept here so it survives into the next milestone instead of living only in a gate note.
- **A POLISH CANDIDATE, NOT A DEFECT — the anchor's visible correction (seen at 7.1).** When content is
  inserted above the reading position, the view **visibly moves up and then returns**: the browser holds
  `scrollTop` through `replaceChildren`, then the anchor corrects it. That is 5.1's measured **~2738 px**
  correction made visible — **correct behaviour with a slightly visible mechanism.** Any fix belongs with
  006's diff work (which knows *what* changed and could avoid the full replace), not with a scroll hack.
- **Comment-only nit, to ride along with the NEXT `src/render/tocView.ts` touch.** `clampTocWidth`'s doc
  comment claims a non-finite input yields `TOC_MIN_WIDTH` via NaN being "caught by the caller's guard".
  **Wrong twice; the CODE is right.** `Math.max(180, Math.min(480, NaN))` is **`NaN`** (it propagates, it
  is not clamped), and the caller does not "catch" it — `applyStoredTocWidth` guards with
  `Number.isFinite` and **returns early**, so `clampTocWidth` never sees a non-finite value. That guard is
  load-bearing: without it the restore path writes literal `"NaNpx"` and silently kills `--toc-w`.
  **Fix the comment only** — the function is *partial* on non-finite input, guarded by the caller.
- **Sepia stays DEFERRED** (D-1 = A; `design/tokens.css` defines only 4 of ~15 sepia tokens, so completing
  the palette is a brand/design decision, not an implementation fill). A candidate for a later themes pass.
- **Unify the two keyboard shortcuts on ONE host registry.** 003 left `` ` `` (TOC toggle) on a host
  registry while readerMode's `\` still resolves differently and is inert on the app page. The
  inconsistency is deliberate and recorded (decisions.md 2026-07-17) — **revisit at a settings/hardening
  pass, or the next time `readerMode`'s shortcut host-resolution is touched.**
- **Chunked/virtualized *TOC-tree* render** — the many-heading lever (003 §5.1: ~45 ms rail build @1401
  headings, scales ~linearly). **NOT forced for typical docs**; revisit at N-thousand headings
  (decisions.md 2026-07-17).
- **Chunked/virtualized *folder-tree* render** — the large-folder lever. 6.2 measured the pure
  walk+build+filter as **cheap** (~7 ms typical, ~40 ms at the 5000-file cap); the suspect is `treeView`
  laying out one DOM node per file+dir. **Decide from a real-browser tree-render measurement** (the
  deferred half of 6.2), not from a guessed bound.
- **Chunked/virtualized *reader* render** — the M1-carried large-*doc* first-paint lever (decisions.md
  2026-07-14). Same class, different surface; 003's 5.2 and 004's 7.1 both confirmed no first-paint
  regression, so it stays carried rather than forced. **005's 5.1 gives it a second, sharper motivation:
  a 1 MB WATCH re-render blocks the main thread for ~717 ms and cannot be interrupted (`mount()` has no
  scheduling and no abort), and unlike a first paint it happens repeatedly while the user is reading.**
  Still not forced — 5.2/5.3's coalescing is the cheaper lever first — but this is now the strongest
  evidence for it.
- **Restore GFM table alignment safely** (map to a class, never an inline style) — carried from M1;
  spec 003 §Out-of-scope leaves it to table work.
- **A shared browser-test helper module.** `flush()` / `afterFrames()` / `waitFor()` are duplicated
  verbatim across 6+ files (plan §4-7 named it; 005 added more). When it lands, the three instrument rules
  in `decisions.md` 2026-07-21 belong in it — and the stability-polling wait should **replace**
  `waitForScrollable`, not sit beside it.

**Roadmap:** 003 TOC/navigation ✓ · 004 themes+settings ✓ · **005 watch mode ✓** (the differentiator) ·
**006 snapshots + diff ✓** (closed 2026-07-27 — gate 9.1 PASSED, retro banked; running gate score **10/10**, corrected
from the 8/8 recorded at 9.1) · **007 Mermaid + diagram cache (M7a) — IN IMPLEMENTATION, group 9** ·
… full order in `docs/product/spec.md` §Phase-1.

## Blockers / open questions

- **NOTHING IS BLOCKED. M7's three Gear-3 gates have all run AND ARE ALL BANKED IN WRITING** (gate 1
  `e09520f`, gate 2 `cab93c7`, gate 3 in `decisions.md`'s M7 GATE 3 entry — banked at `66634fa`, closing
  the flag task 1.1 raised; `tasks.md`'s "DRAFT awaiting gate 3" status line stays by precedent).
  **M7's cache bound-values / typical-case-target human gate — 8.4 — HAS RUN, is banked, AND ITS THREE
  CONSTANT-BEARING DECISIONS ARE NOW IMPLEMENTED (8.5)**: six
  dated entries in `decisions.md` 2026-08-01 (count **150** · totalBytes **8 MiB** · maxAgeMs **30
  days** · D-9 **165 ms** · D-10 **(b)** · flip cost **accepted**), each naming the § Baselines
  measurement that justifies it. **The next human gate is 9.1**, the milestone-close walk on real
  Chromium and real Firefox — and **8.5 has now landed, so NOTHING NUMBERED stands between here and it**:
  9.1 is the immediately next task as well as the next gate. M6's gates are all closed and recorded (spec gate 1 2026-07-22, plan
  gate 2 + gate-3 product decisions 2026-07-23, D-8's bound-value gate at 7.2 2026-07-26, close gate 9.1
  2026-07-26), alongside M5's three (2.3, 5.2, 7.1). *(This bullet has been corrected SIX times for
  pointer inversion — at 8.2, at 9.1, at the archive pass, at 007 task 1.1, and again at 007 task 8.4,
  which found it still asserting 8.4 as the pending gate in the very commit that discharged it — and a
  SIXTH time at 8.5, which found it still saying "only 8.5 stands between here and 9.1" in the very
  commit that removed 8.5. It is the single
  most inversion-prone line in the file: it states pending human state, which is false by construction
  the next time anything ships.)*
- **RESOLVED, noted once so it is not re-opened: `scripts/generate-sbom.ts` no longer under-reports the
  production tree.** Found by 007 task 1.1 (which correctly did not take it — the file is outside 1.1's
  commit fence), fixed at **`1a202fd`** as its own act. **Root cause: `collect()` conflated DEDUP with
  DESCENT** — one `if (!acc.has(id))` gate both created the component and recursed, so a package was
  walked only on FIRST SIGHT, and `pnpm list --json` emits a repeated package **shallow** at its first
  occurrence in traversal order and **full** at exactly one later one. First sight is therefore precisely
  the childless occurrence. **Fix: the two concerns are now separate sets** — `acc` dedups, a new
  `expanded` set gates descent, so any node that actually carries children is walked. **Counts: 90 → 120
  `name@version` (113 distinct names); 30 recovered**, all of `d3@7.9.0`'s subtree plus `d3-dsv`'s
  children. **Proof, and it is graded against something other than itself:** a red-first unit test
  (`tests/sbomWalk.test.ts`, synthetic shallow-first/full-later fixture, revert-and-fail reproduced, with
  a firing control asserting the OLD walk drops exactly the shallow-first payload and keeps the
  full-first one), plus set-equality — not just count-equality — between the fixed generator and an
  **independent** `pnpm licenses list --prod --json` enumeration (a different pnpm subcommand that never
  reads the nested tree). **It was a pre-existing latent defect, not a mermaid regression:** the
  4-dependency tree had no diamond deep enough to produce a shallow-first pair, so it had never fired.
  CycloneDX version, output format and byte-determinism are unchanged (two runs byte-identical); the
  serial number moved because it digests the component list, which is the point.
- **Spec coverage audit** at [`spec-coverage.md`](spec-coverage.md) — **re-audited 2026-07-27 at HEAD
  `d470ab2`** (targeted: §6-4 and §6-9 only, after the §6 side-quest landed the CI those items named).
  **~17% of Phase 1's F1–F12 is shipped** by weighted item count (**§6 59%** — up from 56% — §7 67%,
  whole spec ~23%); **persona-#1 killer-feature coverage is ~56%** and is unchanged by the re-audit.
  Only 4 of §10's 14 stack layers are provisioned, and **F2/F3/F9/F10/F11 have never been touched by any
  milestone**. **Read before scoping M7.** *(It also half-answers the single-file-drop question below —
  see the audit's uncertain-items §1.)*
- **★ ONE GAP THE RE-AUDIT FOUND AND DID NOT FIX, because `.github/` is outside an archive pass's scope
  fence: the SBOM's release-attach step cannot fire on a tag push.** `supply-chain.yml`'s `on.push` is
  filtered to `branches: [main]` with **no `tags:` key**, so pushing `v0.1.0` triggers no run, and the
  `sbom` job's `if: startsWith(github.ref, 'refs/tags/')` step is reachable only by a manual
  `workflow_dispatch` against a tag ref. `decisions.md` 2026-07-27 says the step *"will fire on the first
  tag"* — **not supported by the trigger block as written.** The fix is one line (`tags: ['v*']`) and
  belongs with whoever cuts the first release, alongside §6-10's hashes and attestations. No tag has ever
  been cut (`git tag -l` is empty), so nothing is broken today.
- **GAPS IN AUTOMATED COVERAGE — closed as *findings*, still open as *coverage*. Plan for these; do not
  assume CI will catch a regression in them.** Per the harness ledger (decisions.md 2026-07-19 + the
  2026-07-21 addenda) there is **no roadmap to any of them**:
  - **The real content→background transport.** No test on any milestone has ever exercised it — the
    harness loads no extension, so `runtime.sendMessage` has no receiving end. **This is where M5's one
    shipping defect lived (4.8).** 4.8 added the closest reachable substitutes (a call-site pin and
    source-text pins on the entrypoint); **neither reaches the transport.**
  - **Firefox first paint and Firefox's watch re-render cost.** Playwright cannot load an extension into
    Firefox (upstream, closed out-of-scope), so both perf harnesses are Chromium-only by construction.
    Firefox's evidence is the human gate and nothing else.
  - **Local-disk `FileSystemObserver` latency.** No automated route to a local-disk handle exists; every
    harness number is an OPFS inference (confirmed once, at 5.1a — see § Watch-mode numbers).
  - **From M4 and still true:** the end-to-end settings/TOC round-trip through the background, and the
    cold-start theme flash.
- **OPEN QUESTION (an M2 finding, NOT an 004 defect — recorded so it is not lost). Dropping a single `.md`
  file onto the app page does nothing; only folders work.** Found by the human during the 8.1 session. 004
  touched no folder/drop code and this did not affect the gate result; it is **spec-002 / M2 territory**.
  **UNVERIFIED — do not assume either way.** The evidence points at folder-only **BY DESIGN** (the
  PERMISSIONS.md ledger describes only folder drop/pick; the architecture is folder-shaped throughout —
  `FolderSource → MarkdownFile[]`, `folderId`-keyed recents/pins, remembered directory handles, and a lone
  file has none of those) — **but that is inference from surrounding artifacts, not verification.**
  **Two checks would settle it:** (1) does `docs/product/spec.md` name "open a single file from the app
  page" as a feature at all? (2) does the drop handler bail **SILENTLY**? `getAsFileSystemHandle()`
  returns handles for files *and* directories, so it very likely checks `kind === 'directory'` — the real
  question is whether the user gets **any** feedback. **Worth flagging regardless of the answer:** a
  reasonable gesture producing total silence is its own small **never-blank (#5)** gap, and a line like
  *"Drop a folder — single files open directly from your file manager"* would close it cheaply.
  *Recorded only — not investigated, not fixed.*
- **RESOLVED, noted once so it is not re-opened: the `remoteMedia` positive-control flake is FIXED.** It
  now awaits the Resource-Timing entries instead of sampling for them (22/22 consecutive runs green, both
  engines; deliberate break goes red). Retro 2026-07-19's watch item is **discharged**; the rule and the
  structural reason only that file was ever at risk are in `decisions.md` 2026-07-21.

## Closed milestones

**M6 · spec 006 — snapshots + diff · CLOSED 2026-07-27.** Snapshot capture on the app page, bounded
retention (**count 15 / 20 MiB / 30 days**, D-8), a global erase control, a **persistent** capture
disclosure, and an inline line-diff against any stored snapshot — with **`permissions: []` still
intact**, the **FIRST `dependencies` addition since M1** (`diff@^9.0.0`, a governed act), `DB_VERSION`
2 → 3, and PERMISSIONS.md's *"file contents are never stored"* claim corrected **in the same commit as
the first stored byte** (1.4). Nine groups, **twenty planned tasks, ZERO discovered tasks** — but
**five unplanned recovery sessions the box list cannot see**, which is its own finding. The 9.1 gate
**PASSED and caught THREE layout defects plus a disclosure gap**, all fixed before close (`e231941`,
`8255380`); the first-paint gate was **re-baselined `<150` → `<165` ms** at the human's call.
**★ THE MILESTONE ALSO AUDITED ITS OWN PRIOR EVIDENCE HARD ENOUGH TO FIND IT HOLLOW — two formal
RETRACTIONS, a metric class M4 and M5 both scored zero on:** the import-fence grep proved nothing
(identifiers, minified bundle — the app chunk greps 0 too), and the coalescer never dropped anything
(a probe sampled once, unfalsifiable while the proposed byte bound clamped the count). Both retracted
claims were **unfalsifiable under the conditions they were measured in** — one defect class, not two.
→ narrative:
[archive § M6](progress-archive.md#m6--spec-006--snapshots--diff--closed-2026-07-27) · tasks:
`specs/006-snapshots-diff/tasks.md` · decisions: `decisions.md` 2026-07-22/23/26 (D-1…D-16, the bound
values, the gate re-baseline) and 2026-07-27 (the §6 side-quest + the §6-17 correction) · lessons:
`retro.md` 2026-07-27 (the two retractions as one class; **every empirical claim needs a positive
control that fires**; the gate-score arithmetic; the broken "none escaping" invariant; the pointer-walk
rule; the sibling-checklist audit).

**M5 · spec 005 — watch mode · CLOSED 2026-07-21.** The Phase-1 differentiator: **watch a chosen local
markdown file and re-render it in place while an agent rewrites it**, both engines, both surfaces, with
**`permissions: []` intact**, **no new dependency** (still three) and **no file contents stored** — so
PERMISSIONS.md's *"file contents are never stored"* claim stayed TRUE throughout. Seven groups **plus five
discovered tasks**. **SPLIT AT THE PLAN GATE (D-1): 005 = watch; 006 = snapshots + diff.** Detection is a
measured **2×2, not a per-engine split**: Chromium's app page is event-driven (`FileSystemObserver` over a
real handle), everything else polls and compares **content**, because on Firefox's drag path
`size`/`lastModified` are frozen at drop time. **Firefox watch is app-page-only** — a background
`fetch("file://…")` throws under Gecko's URI security policy and no permission grants it. Continuity is
**anchor-based, not `scrollTop`-based** (D-3), which is why **`mount()` stopped being the read-only
library four milestones had treated it as** — additive, defaulted-off, both directions red-first proven.
**★ THE FACT TO CARRY: the 7.1 gate caught a shipping defect (4.8) in the first five minutes, on the
first item checked, on the surface the automated stack provably cannot reach** — watch on the
content-script `file://` surface detected every change and rendered **none** of them. **The score moved to
7/7** *(the running total AT M5's CLOSE; it is **10/10** now — see the score paragraph below)*, its first
move since M3, confirming M4's keep-the-gate reasoning **by instance**: the item M4 kept
*because nothing else could observe it* is the item that caught the defect. The gate's other output was a
**product judgement, not a defect** — the pill is not discoverable, shipped as-is and carried.
→ narrative:
[archive § M5](progress-archive.md#m5--spec-005--watch-mode--closed-2026-07-21) · decisions:
`decisions.md` 2026-07-19 (Firefox `file://` · the harness ledger) and 2026-07-21 (the cooldown; the
WXT-entrypoint rule; the 5.1a confirmation; the pill; the instrument rules; `fileParallelism`) · lessons:
`retro.md` 2026-07-21 (the **built-tested-and-wired-to-nothing** defect class; red-first is a count and a
reason; "it's the harness" needs an isolating variable; layout MOVED not ADDED; the `mount()`-boundary
answer).

**M4 · spec 004 — themes + settings · CLOSED 2026-07-19.** Auto/light/dark (sepia deferred, D-1),
persisted in the existing IndexedDB with **`permissions: []` still intact**, applied coherently across the
app shell and **both** reader surfaces through one theme-host registry, plus the 003 TOC rail's state
carried over as a global preference. Eight groups. **The headline result is a NEGATIVE one and it is the
milestone's best work:** group 4 built the paint gate D-2 specified, measured it, found it breached the
<150 ms budget on **every cold typical-doc open** by a cost **insensitive to the deadline** (75 ms →
172.7 ms; 40 ms → 172.9 ms), and **deleted it** — shipping D-2's own recorded fallback. The 8.1 gate
PASSED **with no defects found** — the first milestone whose gate found nothing, which the retro answers
rather than celebrates (verdict: **discipline-dominant**; the boundary moved for *coherence*, not for
*appearance*, so **the gate stays load-bearing**). It also discharged the three items groups 6–7 deferred
into it. → narrative:
[archive § M4](progress-archive.md#m4--spec-004--themes--settings--closed-2026-07-19) · decisions:
`decisions.md` 2026-07-18 (D-2 + its correction of record) and 2026-07-19 (stored-vs-applied split; the
three promoted entries) · lessons: `retro.md` 2026-07-19 (the **vacuous persistence test** defect class;
inference-does-not-survive-configuration; pin scope; the harness-honesty loop; the `git checkout`
process failure).

**M3 · spec 003 — TOC / navigation · CLOSED 2026-07-17.** An in-reader right-side table-of-contents rail
serving **both** reader surfaces from one `mount()`-seam compose: pure `buildTocModel` + `buildTocView`,
click/Enter scroll by element ref, host-rooted scroll-spy, backtick toggle, pointer-drag resize.
`permissions: []` intact, zero network on every TOC action. The 6.2 human gate caught **1 real defect** a
158-test green real-engine stack missed — the rail rendered fully **TRANSPARENT** with the column
reserving no room for it — establishing the **"visual occlusion is gate-only"** defect class that every
milestone since plans around. → narrative:
[archive § task log](progress-archive.md#task--session-log--newest-first--m1--m3-close--the-004-planning-gates)
· decisions: `decisions.md` 2026-07-16/17 · lessons: `retro.md` 2026-07-17.

**M2 · spec 002 — active-source foundation · CLOSED 2026-07-15.** Peekover's second surface — a dedicated
full-tab app page that reads a chosen folder of markdown from disk — shipped **without spending a single
manifest permission** (folder access via user-gesture web APIs; consent is at-use, visible, revocable).
The `FolderSource → MarkdownFile[]` seam is the one engine boundary; everything above it is
engine-agnostic. The 6.3 human gate caught **3** defects the green stack missed (containment ·
drag-navigation · the storage-UI gap). → narrative:
[archive § task log](progress-archive.md#task--session-log--newest-first--m1--m3-close--the-004-planning-gates)
· decisions: `decisions.md` 2026-07-15 · lessons: `retro.md` 2026-07-15.

**M1 · spec 001 — core render pipeline · CLOSED 2026-07-14.** The reader itself: detect → hide-raw →
mount → parse → markdown-it/GFM → DOMPurify → shadow-DOM themed reading → Raw toggle →
block-remote-media → never-blank fallback, on Chrome + Firefox, `permissions: []`, ~270 KB packed. Its
gate caught **2** defects, both invisible to jsdom: a pre-opt-in remote-image **fetch leak** (the
"a detached node doesn't fetch" assumption is FALSE — the safe property is an *inert* document) and the
Firefox mount-timing regression. → narrative:
[archive § task log](progress-archive.md#task--session-log--newest-first--m1--m3-close--the-004-planning-gates)
· decisions: `decisions.md` 2026-07-14 · lessons: `retro.md` 2026-07-14.

**The human-gate score: 10/10** — M1:2 + M2:3 + M3:1 + M4:0 + M5:1 + **M6:3**. The score counts
**DEFECTS, not milestones**, which is what 9.1's own "8/8" got wrong: its landing block says *"M6
contributes THREE"* and then writes 8/8, contradicting itself. **7 + 3 = 10.** (On the stricter
denominator that also counts the Firefox app-page disclosure gap the 9.1 walk closed it is 11/11; prior
milestones did not count copy gaps, so 10/10 is the like-for-like figure — **stating the denominator's
definition is the point**.)

**★ BUT "NONE ESCAPING" IS NO LONGER TRUE, AND THE QUALIFICATION MATTERS MORE THAN THE NUMBER.** For
five milestones this section read *"all N caught by the milestone-close gate, NONE escaping it."*
**M6's finding A — the reader right-aligning against the TOC rail on wide viewports — ships on BOTH
surfaces and has done SINCE M3**, present and missed at **M3's, M4's and M5's close gates**. So: **nine
of ten were caught at their own gate; one escaped three.** M4's clean gate therefore has a known miss —
its retro's *discipline-dominant* verdict still stands **for what M4 built**, but the gate was not clean
about the shipped product. *A clean gate is evidence about the BUILD, not about the GATE* was M4's own
caveat (retro 2026-07-19); **M6 is where it cashed out.** The mechanical cause is fixable and named:
**no gate record on any milestone states the walk's VIEWPORT** — engine and surface are recorded every
time, the dimension that decides whether a layout defect is visible is not. **Standing rule: a gate walk
records its viewport(s) the way it records its engines, and a milestone shipping positioned chrome walks
at least one WIDE viewport deliberately** (`retro.md` 2026-07-27, finding 2).

**Read the ratio precisely either way:** it says every *known* shipping defect was caught at some gate,
not that the gate catches everything — the denominator only counts what someone eventually found.
**M5 remains the sharpest instance FOR the gate:** task 4.8 was found in the **first five minutes, on
the first item checked, on the surface the automated stack provably cannot reach** (no test on any
milestone has ever exercised the real content→background transport).

**Product progress (rough):** M1 opened build-order phase 1-of-7 (product spec §11). Spec-level
milestones are finer than the 7 phases (roadmap after 001: 002 sources · 003 TOC · 004 themes+settings ·
005 watch · 006 snapshots+diff · … ~a dozen to v1.0), so a precise product % is **deferred** — honestly
this is early foundation, **~sixth of ~12+ spec-milestones**. Don't over-read the fraction.
**The sharper number is now measured rather than guessed:** [`spec-coverage.md`](spec-coverage.md) puts
the whole spec at **~23%** and persona #1 at **~56%**. Prefer it to this paragraph when scoping.

## Baselines / pins
*Current measured truth, **re-measured 2026-07-31 at HEAD `4c580c4`** by **007 task 8.1 (D-10)**. This
section is MUTABLE — each milestone's close task overwrites the numbers and moves the previous ones into
the "vs" column. It lives here, not in decisions.md, because decisions.md is dated append-only and a
current-numbers table cannot be corrected there without either lying or duplicating.*
*⚠ **"8.1" IS AMBIGUOUS IN THIS FILE AND THE COLLISION IS REAL.** The M6 table's *"vs 8.1's record"*
column meant **spec-005 task 8.1**. Everything dated 2026-07-31 below is **spec-007 task 8.1**. Where the
distinction matters the milestone is named; a bare "8.1" in the M6 prose belongs to 005.*
*Per-milestone historical pins, and the whole M6-close § Baselines verbatim, are in
[`progress-archive.md` § M6](progress-archive.md#m6--spec-006--snapshots--diff--closed-2026-07-27).*

**★ WHY THIS TABLE WAS RE-MEASURED (007 8.1) AND WHAT "0 DELTA" TURNED OUT TO MEAN.** The table below is
**every figure re-run against the BUILT ARTIFACT at `4c580c4`**, not carried forward and not computed.
The M6 table above it had gone stale in exactly the way `retro.md` 2026-07-27 finding 3 predicted — five
M7 commits moved bytes it still described. **007 §8.1's own text asks for "content-script bytes vs
315,671 B — MUST be 0 delta"; the measured delta is +3,076 B and that clause is a STALE BASELINE, not a
breach.** The distinction is not a convenience: §8.1's fence is *the diagram engine contributes nothing
to the gated path*, and that is tested **by ablation**, which passes exactly (below). The +3,076 B is
five named, previously-recorded content-script features, **decomposed to a residual of 0 B**. Growth that
every task recorded as it landed is accounted growth. See *THE M7 BYTE LEDGER*.

| pin | now (2026-07-31, `4c580c4`) | vs M6 close (`d470ab2`) | bound | verdict |
|---|---|---|---|---|
| First paint, typical doc (50.4 KB) | **152.3 / 157.9 / 163.2 ms** medians, **floor 145.3 ms** (3 arms) | 133.7 ms / floor 132.1 ms | **<165 ms GATE** | **PASS, all 3 arms** |
| First paint, diagram-bearing (51.7 KB, 10 fences) | **157.6 ms** median, **floor 146.7 ms** | *(new pin)* | **<165 ms GATE** | **PASS — but see the vacuity note** |
| First paint, 1 MB / ~1400-entry TOC | **1304.8 ms**, floor 1267.6 ms | 1188.5 ms (**+116.3, +9.8%**) | <1.7 s (informational) | PASS |
| Content script (`content-scripts/peekover.js`) | **318,747 B** both engines | 315,671 B (**+3,076, +0.97%**) | none — **stated, not gated** | — |
| App-page chunk (`chunks/app-BT5Gfp9t.js`) | **387,837 B** both engines | 361,500 B (**+26,337, +7.28%**) | none — **stated, not gated** | — |
| Background (`background.js`) | **3,548 B** both engines | 3,435 B (**+113, +3.29%**) | none — **stated, not gated** | — |
| `pnpm zip` Chrome / Firefox | **1,299,871 / 1,299,930 B** | 349,744 / 349,803 B (**+950,127 each, +272%**) | **<2 MB** | **PASS — headroom 0.70 MB, was 1.65 MB** |
| Packed unzipped (`.output/<engine>`) | **4,058,587 / 4,058,703 B** | *(new pin)* | **≤5 MB** (AGENTS.md) | **PASS — headroom 0.94 MB** |
| Suites | **728 unit** (51 files) · **911 passed / 15 skipped** browser, **98 file-instances** | 549 · 629/15/76 (**+179 unit, +282 browser**) | — | green |

**★ THE M7 BYTE LEDGER — EVERY BYTE ASSIGNED, BY BUILDING AT EVERY COMMIT.** Not reasoned from commit
bodies: a detached worktree at each of the 21 M7 commits, `wxt build` per commit, `wc -c` per artifact.
The instrument was validated first — the worktree at `d470ab2` reproduces **315,671 B / 361,500 B /
`app-CEHD9mSZ.js`** exactly, and at `4c580c4` reproduces the main tree's md5s exactly.

| commit | task | content script | app chunk | background |
|---|---|---|---|---|
| `d470ab2` → `367d051` | 1.1 · 1.2 · 1.3 · 2.1 · 2.2 · D-6 · option B | 315,671 (**0**) | 361,500 (**0**) | 3,435 (**0**) |
| `1e09164` | **3.1** synchronous prologue, D-12's two call sites | 315,974 (**+303**) | 362,293 (**+793**) | — |
| `763f94d` | **3.2** async render body | — | 370,387 (**+8,094**) | — |
| `eae7b08` | §4 source guard (app-page only) | — | 370,579 (**+192**) | — |
| `01339fd` | **4.2** DB_VERSION 4 + two diagram stores | 316,087 (**+113**) | 370,692 (**+113**) | 3,548 (**+113**) |
| `a3005db` | **4.3** cache + trust surface | — | 377,847 (**+7,155**) | — |
| `85d5cbc` | **5.1** D-7 re-theme | 316,122 (**+35**) | 379,044 (**+1,197**) | — |
| `a222af5` | **6.2** storage-unavailable degrade | — | 379,445 (**+401**) | — |
| `2a4884f` | **7.1** per-diagram copy/download | 317,337 (**+1,215**) | 384,710 (**+5,265**) | — |
| `6fa71a0` | **7.2** lightbox | 318,747 (**+1,410**) | 387,837 (**+3,127**) | — |
| `4c580c4` | **7.3** empirical permission re-proof (test-only) | — (**0**) | — (**0**) | — |
| | **TOTAL** | **+3,076** | **+26,337** | **+113** |

**The columns sum EXACTLY: 303+113+35+1,215+1,410 = 3,076 · 793+8,094+192+113+7,155+1,197+401+5,265+3,127
= 26,337. RESIDUAL 0 B in both — no unnamed byte.** Three corrections to the ledger this task inherited:
**(1)** 6.2 moved the **app chunk only** (+401), never the content script — it had been carried as a
content-script mover and is not one. **(2)** Two movers were unrecorded in the carried ledger: **3.1
(+303)** and **4.2 (+113)**. **(3)** `01339fd` is the one commit that moved **all three** artifacts by the
identical **+113 B** — the shared store module, reached from the content script, the app page and the
background alike.

- **★ THE A-B-A RAN AND ITS VERDICT IS NEGATIVE: A DISAGREES WITH A, SO NO DIAGRAM DELTA WAS MEASURED
  HERE.** Same session, contiguous, same build — **A1 median 163.2 ms (floor 158.7) · B 157.6 ms (floor
  146.7) · A2 152.3 ms (floor 145.3)**. The **A-vs-A disagreement is 10.9 ms on the median and 13.4 ms on
  the floor**, which is *larger than the entire A-to-B difference* (A-mean 157.75 vs B 157.6 ≈ **0 ms**).
  §8.1 states the rule and it binds against its own author: **A disagrees with A ⇒ nothing measured here
  means anything.** No diagram-bearing first-paint cost is claimed in either direction. A drifted
  monotonically downward across the session (163.2 → 152.3), the signature of a warming machine, not of
  code.
- **THE GATE PASSES ON EVERY ARM AND THE HEADROOM IS NOW THIN.** 152.3 / 157.6 / 157.9 / 163.2 ms medians
  across four arms, all **< 165 ms**; worst-arm headroom **1.8 ms**. Against M6's 133.7 ms median /
  132.1 ms floor this reads +18.6 to +29.5 ms — **but that comparison is NOT licensed**, see the next
  bullet. **The standing warning is NOT repealed and is now load-bearing:** at ~2 ms of worst-arm
  headroom a passing median on a busy machine is luck, and the next session touching the render path must
  quiesce before believing anything.
- **THE 1 MB DISCRIMINATOR SAYS THE MACHINE IS SLOWER, NOT THAT THE CODE IS.** **1304.8 ms** (floor
  1267.6) against M6's 1188.5 ms — **+9.8%**. That is the protocol's machine-state control, and it moved.
  Scaling M6's 50 KB figures by the same 9.8% predicts ~146.8 ms median / ~145.1 ms floor; the measured
  floor is **145.3 ms**, i.e. **the floor lands on the machine-corrected prediction almost exactly**.
  **So the honest reading is: most and plausibly all of the 50 KB movement is the machine.** Any residual
  is smaller than this instrument's own 13.4 ms A-vs-A disagreement and is **not resolvable here.** The
  harness still prints `-> FAIL` on the 1 MB line because it compares that fixture against the
  *typical-doc* bar — the known false FAIL (plan §4-9), **carried unfixed**. Against its OWN <1.7 s bound:
  PASS.
- **★ THE DIAGRAM-BEARING ARM PASSES THE TEXT-PAINT GATE, AND IT IS **NOT** EVIDENCE THAT THE ENHANCEMENT
  IS POST-PAINT. A non-vacuity probe caught this.** §8.1 asks for the second gate *"because §3.3 puts the
  engine after the commit — a miss there means the enhancement is not actually post-paint."* Measuring it
  on the harness's surface reads **PASS (157.6 ms)** — and a probe of the resolved DOM shows
  **`{svg: 0, figures: 0, mermaidFences: 72}`: ZERO diagrams rendered.** That is correct behaviour, not a
  defect: **`enhanceDiagrams` is imported by `src/app/appShell.ts` and `src/app/readerPane.ts` only**, so
  the content-script surface — which is the ONLY surface `perf-first-paint.ts` can drive — never runs the
  enhancer at all, exactly as the ablation proves by bytes. The 10 fences paint as ordinary code blocks.
  **A "PASS" quoted from this arm as proof of post-paint enhancement would have been vacuous**, which is
  why the probe was written to fail loudly first (it did: `0/10 diagrams resolved`) rather than to
  confirm. **The claim §8.1 actually wants is testable only on the APP PAGE, which has zero automated
  first-paint coverage (plan §4-5) — carried unfixed, and stated as the weaker claim it is, never as
  "within budget".**
- **★ THE CONTENT-SCRIPT FENCE, IN ITS EXACT FORM — AND IT IS NOT CROSS-ENGINE md5 EQUALITY.** Wherever
  this file says *"md5-IDENTICAL both engines"* it means **each engine's md5 is unchanged task-over-task**,
  never that the two engines hash alike. **They do not and never have.** The fence has three parts:
  (i) **byte-LENGTH identical across engines** — 318,747 B both; (ii) **per-engine md5 stable** across a
  task that should move nothing — Chrome `c7b33b36b1a727fdacb77eefe64083e1`, Firefox
  `67717921bdf646c7366176392d0c37d7`; (iii) the two engines' scripts differ by **exactly ONE byte**.
  `cmp -l` this session: **one differing byte, 1-based position 315,471 (0-based offset 315,470)**, octal
  `60` vs `61` — `backgroundCanReadFileUrls:!0` (Chrome, true) vs `:!1` (Firefox, false), a pre-existing
  WXT capability flag. **The offset MOVES as the script grows** (312,846 pre-7.2 → 315,470 after 7.2's
  CSS; unchanged at 7.3, which shipped no production bytes) — so re-confirm it, never carry it.
- **★ THE "2975" IS A TEST-FILE SIZE. THE LABEL WAS WRONG; THE MEASUREMENT WAS NOT.** Carried to 8.1 and
  closed here. `wc -c tests/manifest.test.ts` = **2,975 B** — correct, and byte-unmodified since M2
  (`3b6c575`). The **BUILT** manifests are **654 B (Chrome) / 770 B (Firefox)**, `permissions: []` and no
  `web_accessible_resources` on both. Write it as **"test-file 2,975 B / built manifests 654 + 770 B"**;
  *"manifest green 2975 B"* conflates a test file with a shipped artifact that is **4.5× smaller**.
  **Nothing was re-measured to fix this — a correct number was given a wrong name.** ⚠ **The mislabel's
  SOURCE text is in `specs/007-mermaid-diagrams/tasks.md`** (§7.1/§7.2, and the same shorthand in every
  §8.x fence line). 8.1's Files list does not scope `tasks.md`, **so the source is NOT fixed here** —
  routed to **9.3**, which owns the doc reconcile.
- **Standing pins, all green this session:** `git diff tests/golden/output/` **EMPTY** ·
  `tests/manifest.test.ts` green, **test-file 2,975 B**, byte-unmodified since M2 (`3b6c575`) · **built
  manifests 654 B (Cr) / 770 B (Fx)**, `permissions: []` and no `web_accessible_resources` on both ·
  `diagramImportFence.test.ts` **8/8** · `pnpm lint` EXIT=0 · `vitest.config.ts` and `wxt.config.ts`
  unmodified.
- **★ THE ZIPS QUADRUPLED AND STILL PASS — THIS IS 8.4's HEADLINE, AND 8.1 CHOOSES NOTHING.**
  **1,299,871 B (Cr) / 1,299,930 B (Fx)** against M6's 349,744 / 349,803 — **+950,127 B each, +272%**,
  from mermaid's 99 lazy chunks, which **ship inside the package even though they never load in the
  content script**. Against `< 2 MB`: **PASS**, with **0.70 MB of headroom where M6 had 1.65 MB — 58% of
  the margin consumed by one milestone.** Unzipped the package is **4.06 MB against AGENTS.md's ≤5 MB**.
  **No disposition is taken here** — whether that headroom licenses shipping as-is, a subset build, or a
  stricter lazy-load boundary is **D-10's package-size question and it belongs to the 8.4 human gate**
  (which §8.4 already names). Recorded so 8.4 reads a number rather than an impression.
- **`pnpm zip` emits a THIRD artifact that is NOT the bound:** the Firefox run also writes
  `peekover-0.0.0-sources.zip` — **1,919,941 B this session** (`tests` 636 KB · `specs` 313 KB · `src`
  303 KB · `docs` 291 KB compressed). It is the archive AMO requires for review, not a shipped package;
  the <2 MB bound is on the extension zips. ⚠ **This reads 2.37 MB BELOW M6's recorded 4.29 MB while the
  repo only grew, and the gap is NOT reconciled.** The obvious hypothesis — that a populated `.output/`
  rode into it — was **tested and REFUTED**: re-zipping with a full build present gives the same
  1,919,941 B and **0 entries** under `.output`. What IS established is that the archive's contents vary
  with the checkout's shape (the same commit zipped from a detached worktree yields 1,279,322 B, omitting
  `tests/`), so a provenance difference is the likely class of explanation. **Stated rather than
  silently overwritten; the number is not gated in either direction.**
- **⚠ THE `pnpm zip -- -b firefox` TRAP IS STILL LIVE and was worked around again this session.** Use
  `pnpm exec wxt zip -b firefox`; the `--` form silently rebuilds and rezips **chrome**.

**★ THE IMPORT FENCE — THE GREP IS RETRACTED; THE FENCE HOLDS BY ABLATION.** Do not propagate the old
check. Every recorded *"content-script grep for `diffLines|jsdiff|computeDiff|enterDiff|…` = 0"* proved
**nothing**: those are identifiers, the bundle is minified, and the negative control nobody ran until 8.1
— grep the app-page chunk, which indisputably *does* contain the engine — **also returns 0**. The fence
was carried the whole time by the source-text allowlist in `diffEngine.test.ts`, which remains **the
architectural proof**. It was re-established at 8.1 by **controlled ablation**: removing the engine and
view left the content script **byte-identical (0 B, md5-identical, both engines)** and dropped the app
chunk **−9,481 B** — the diff feature's contribution to the gated path is not "small", it is **nil**.
Full ablation tables: archive § M6.

**Replacement heuristic for future measure-tasks — use literals that survive minification, and ALWAYS run
the negative control.** Re-verified this session against the current build:

| marker set | app chunk (CONTROL — must be >0) | content script (FENCE — must be 0) |
|---|---|---|
| `diff` pkg option props — `newlineIsToken\|stripTrailingCr\|ignoreWhitespace\|oneChangePerToken\|maxEditLength` | **12** ✓ fires | **0** ✓ |
| `diffView` strings — `diff could not be rendered\|no reader shadow root to show a diff in` | **2** ✓ fires | **0** ✓ |

Identical on **both engines**. **This is a heuristic, not a proof** — it depends on the minifier
preserving those literals, and a bundler upgrade could silently blunt it exactly as it blunted the old
one. **It is worth something only while its control fires; check that first, every time.** Note that
`peekover-diff` class names DO appear in the content script — **30 hits** for that literal, on both
engines — and this is **correct, not a breach**: `mount.ts` imports `diffChrome.ts` by design, and that
module reaches the engine only through
the `showDiff`/`hideDiff` closures the app page provisions. A fence grep must target the **engine and the
view**, never the string "diff". *(8.1 recorded **36** here under an unstated pattern; this pass measured
**30** for the literal `peekover-diff`. The gap is not reconciled — it is either the recovery commits'
CSS changes or a different pattern, and **the number is decoration either way**: it is the two marker
rows above, with their firing control, that carry the fence's evidence. Stated rather than silently
overwritten.)*

**★ 007 TASK 8.1 — THE ABLATION RE-RUN AGAINST THE PRODUCTION-WIRED GRAPH (D-10).** 1.3 measured a
*scratch-wired* graph; at `4c580c4` the engine is **really reachable**, so the fence is re-established
against the shipped thing. Method: sever the sole `import('mermaid')` in `src/render/diagramEngine.ts`
(→ `Promise.reject`), rebuild **both engines**, restore from a `cp` copy. Restored file md5
`dd79b2d40868f381930a2f18d6c9ff5d`, worktree clean after.

| arm | content script (FENCE — must not move) | app chunk | emitted chunk files | chunk bytes (CONTROL — must move) |
|---|---|---|---|---|
| HEAD `4c580c4` | **318,747 B** · Cr `c7b33b36…` Fx `67717921…` | 387,837 B | **100** | **3,735,143 B** |
| engine ablated | **318,747 B** · Cr `c7b33b36…` Fx `67717921…` | 385,777 B (−2,060) | **1** | **385,777 B (−3,349,366)** |

- **THE FENCE HOLDS AT FULL STRENGTH: the content script is byte- AND md5-identical on BOTH engines with
  mermaid removed entirely — 0 B of the engine reach the gated path.** *Byte-identical means it was never
  there.* **That null discriminates only because the control fired in the same run: −3,349,366 B and 99
  chunk files vanished.** The 99 chunks account for 3,349,366 − 2,060 = **3,347,306 B — reproducing 1.3's
  engine figure to the byte**, from a differently-wired graph.
- **THE `mermaid/package.json` INLINE IS STILL MATERIAL AND STILL NOT NARROWED.** Second ablation
  (stub the static `import pkg from 'mermaid/package.json'`): app chunk **387,837 → 384,019 B, −3,818 B**,
  confirming 1.3's 3,847 B (the 29 B gap is the stub's own literal). The bundler still inlines the WHOLE
  package object to carry a seven-character version string. **8.1 measures; it does not narrow.** The
  Vite `define` narrowing remains a **D-13/D-16 disposition for a later task.**
- **NOTHING SHIPS THAT SHOULD NOT.** Emitted non-chunk files: `app.html`, `background.js`,
  `content-scripts/peekover.js`, `manifest.json` — **and nothing else**. **Zero `.css` files** (mermaid
  carries its styles as JS strings inside the lazy chunks, already counted) · **zero `.map` files** ·
  **zero `__ablation` markers** in either production bundle.

**★ 007 TASK 1.3 — THE LAZY-CHUNK ABLATION (plan §7-1 RESOLVED). ABLATION / SCRATCH-WIRED FIGURES —
SUPERSEDED AS THE PRODUCTION FIGURE BY 8.1 ABOVE; RETAINED BECAUSE ITS DECOMPOSITION STILL STANDS. THE
M6 TABLE ABOVE WAS UNCHANGED BY THIS NOTE**, and that is a
measured fact rather than an intention: `diagramEngine.ts` is imported by nothing at HEAD, the scratch
`appShell.ts` reference existed only inside the measurement, and the restored file is md5-identical
(`b99512d3b9079b492910b553c21b4c34`) with the rebuild landing back on 315,671 B / 361,500 B
(`app-CEHD9mSZ.js`) on both engines. Chunking had never been exercised in this repo — zero dynamic
imports in `src/` before 1.2 — so it was measured before anything was allowed to depend on it.

- **(a) THE FENCE HOLDS, AND THE CONTROL FIRED IN THE SAME RUN.** With `diagramEngine` reachable from
  the app-page graph, `content-scripts/peekover.js` is **byte-identical: 315,671 B, md5 unchanged on
  both engines** (Chrome `c8251651d0ae3b348053a54c6ba2e4a4`, Firefox `b597b1b472ebb983f40b6d8ee11fd83c`)
  — *byte-identical means it was never there.* **That null is only worth something because the negative
  control moved in the same comparison: the app page gained +3,349,685 B** (5 emitted files → 104). A
  measurement reading 0 on both sides discriminates nothing — this is retraction A's disposition, and
  the fence is now carried by bytes rather than by a grep.
- **(b) EVERY BYTE OF THE APP-PAGE DELTA ASSIGNED.** +3,349,685 B total = **engine 3,347,306 B** (99
  lazy chunks: 591,209 B fetched with the core via the 20-entry `__vite__mapDeps`, 2,756,097 B in 79
  further-deferred per-diagram-type chunks) **+ app-chunk 2,379 B**. The app chunk decomposes exactly:
  **glue 1,971 B** (`__vitePreload` helper 1,192 · `__vite__mapDeps` table 741 · helper re-export 38) ·
  **`diagramEngine`'s own emitted code 375 B** · **scratch artifact 29 B** (`globalThis.__ablation_1_3=`,
  not production) · **residual 4 B, NAMED: a `var ` statement-boundary realign** (plus 22 single-char
  identifier renames, net 0). **CSS = 0 B** — no `.css` file is emitted at all; mermaid carries its
  styles as JS strings inside the lazy chunks, already counted in the engine block.
- **(c) A SEPARATE LAZY ASYNC CHUNK, NAMED AND REACHABLE — §10's guarantee holds.**
  `chunks/mermaid.core-D7K4dyvy.js` (**34,946 B**), reached by a real call site the bundler rewrote from
  the bare specifier: `()=>kd(()=>import("./mermaid.core-D7K4dyvy.js"),__vite__mapDeps([0…19]))`. **Not
  statically inlined** — the app chunk moved 2,379 B while the engine payload sits in 99 separate files,
  and mermaid's own `11.16.0` appears in `mermaid.core-*`, never in the app chunk. No bare specifier and
  no orphan chunk survive into the output, closing 1.2's second handoff item.
- **★ (b)'s NAMED LINE-ITEM — THE `mermaid/package.json` INLINE COSTS 3,847 B, AND IT IS MATERIAL.**
  1.2 handed this forward and it is now measured, isolated by a second ablation (retaining
  `engineVersion` as well moves the app chunk 363,879 → 367,788 B, +3,909 B = **package.json literal
  3,847** · `engineVersion()` accessor 32 · scratch artifact #2 30 · hash churn 0). The bundler inlines
  the WHOLE object — `description`, the `exports` map, `devDependencies`, `scripts` — to carry a
  seven-character version string, ~1.06% of the app chunk's own 361,500 B baseline and larger than the
  entire rest of the app-chunk delta combined. **NOT narrowed here: 1.3 measures, it does not decide.**
  A Vite `define` reading only `version` is the obvious narrowing and is a D-13/D-16 disposition for a
  later task, recorded so it is not lost.
- **(d) SCANNER GREEN WITH ITS SELF-TEST FIRING.** `check-dynamic-imports.ts` **EXIT=0** over 55 shipped
  files, and `--self-test` **EXIT=0** with **7 firing + 8 silent** cases — including the MUST_NOT_FIRE
  fixture *"bare-specifier lazy chunk"* that is exactly the shape 1.2 shipped. Scanner and
  `supply-chain.yml` byte-identical; no threshold asserted anywhere in this task.
- **STALENESS FOUND, ROUTED TO 9.3 RATHER THAN FIXED HERE (baseline reconciliation is 9.3's task):** the
  table above reads **549 unit (46 files)**; the suite is now **563 passed (48 files)** — `+14` cases from
  `diagramEngine.test.ts` (`1391118`) and `tests/sbomWalk.test.ts` (`1a202fd`). Every BYTE pin in the
  table re-measured true this session; only the suite row has drifted.
  **↳ CLOSED at 007 8.1** — the table at the top of this section is re-measured in full (suites now
  **728 unit / 51 files · 911 browser + 15 skipped / 98 file-instances**), so this routing to 9.3 is
  discharged. 9.3 still owns the `architecture.md` correction and the `tasks.md` "2975" mislabel.

**★ THE TWO 006 HARNESSES, RE-RUN THIS SESSION (`--no-build`). Neither emits an exit-code gate, by
design — they choose nothing.**

**`perf:snapshot-capture` — 7.3's chosen bounds still behave as reasoned.** Accumulation over 12
sequential edits through the production controller: **50 KB → 13 snapshots, 659.5 KB** (`2,3,…,13`;
mean 50.7 KB); **1 MB → 13 snapshots, 14.57 MB** (`2,3,…,13`; every snapshot 1.12 MB). **Neither bound
bites** — 13 < 15 and 14.57 MB < 20 MiB — reproducing 8.1 and 7.3 exactly. **`12 of 12 edits rendered`
at BOTH fixtures**, holding 8.1's discriminator fix (the retracted `9 of 12` was a sampled probe).
**Capture cost remains UNRESOLVABLE at both sizes and the harness says so itself:** 50 KB sync delta
**+7.5 ms** against a 24.4 ms within-arm spread; 1 MB **−5.3 ms** against a 199.3 ms spread — **the sign
flips between fixtures, which is the point. No delta here may be quoted as "the capture cost" in either
direction.** Isolated D-5 guard **2.5 µs / 55.0 µs** (a FLOOR on added work, measured hot — retro
finding 2's ~13× warning stands); awaited `storeSnapshot` **0.7 ms / 7.5 ms**, off the synchronous path
by construction. Non-vacuity held every run: ON captured 2 per run, OFF captured 0.
**STILL NOT OBSERVED and still out of this harness's reach: whether the count bound actually STOPS
growth at 15** — `EDIT_SEQUENCE` is 12, so decisions.md's *"~17 snapshots of 1 MB fit in 20 MiB"* remains
**reasoning, not measurement**.

**`perf:diff` — no movement against 8.1.** (a) engine **635.2 ms** (8.1: 587.5) · (b) parse+sanitize
**444.9 ms** (441.5) · (c) DOM **138.1 ms** *derived* (137.8) · (d) **TOTAL enter 1224.8 ms** (1202.2) ·
first scroll frame **388.5 ms**, settling to 73.6 / 54.3 / 59.2 / 52.9 ms. Fixture determinism holds to
the hunk across a third session: **5882 hunks (1961+ / 1961− / 1960=) → 5882 blocks on all 7 runs.**
(a)+(b)+(c) deliberately do **not** reconcile to (d) — (d) also carries two IDB round-trips, event
dispatch and the browser's own layout of the appended subtree, and that gap is left visible. **Memory
stays DIRECTIONAL ONLY** and the caveats are load-bearing (Chromium-only `performance.memory`, **V8 heap
only — DOM nodes are NOT counted**, GC-timing dependent, non-default flag): heap at rest **15.50 MB**;
before→after enter median **+22.68 MB across a −16.40 to +37.18 MB range**; net before→after-exit median
**+7.05 MB across a −41.46 to +37.57 MB range**. **The spread is printed beside every median precisely
because a single confident median here would be a fiction, and the net is NOT evidence of a clean
teardown.**

**⚠ TOOLING TRAP, recorded so the next session does not lose time to it: `pnpm zip -- -b firefox` SILENTLY
BUILDS CHROME.** There is no `zip:firefox` script; pnpm forwards the bare `--` as a literal argument and
wxt's CLI ignores what follows, so the command exits 0 having rebuilt and rezipped **chrome-mv3** — a
green run that produced the wrong artifact. **The correct invocation is `pnpm exec wxt zip -b firefox`**
(likewise `pnpm exec wxt build -b firefox`). The `pnpm perf -- --size 50kb` form is unaffected — `tsx`
ignores the bare `--`, which is why the perf harnesses never exposed this.

- **Measurement protocol (unchanged since M1 — keep it, so numbers stay comparable):** 7 iterations, run
  1 discarded as cold, **median of the warm 6**, min/max as spread. **No threshold is ever asserted from
  a measurement task** (standing M1 retro rule). **Signal-vs-noise is decided on the FLOOR, not the
  middle** — real added cost raises the floor; noise moves only the middle.
- **Every first-paint number here is CHROMIUM.** `perf-first-paint.ts` cannot drive Firefox
  (decisions.md 2026-07-19, harness ledger). Firefox first paint is evidenced only by the human gate.
- **A pin certifies exactly the stage it observes.** "Golden diff EMPTY ⇒ the reading column is
  untouched" is **FALSE** — that suite snapshots `sanitize(parse(source))`, upstream of `mount()`, and
  stayed empty through the 5.1 chrome addition. Before citing a pin as evidence, break the property and
  check it goes red (retro 2026-07-19, finding 3).
- **And a pin can be perfectly scoped and still be BLIND.** That is the other half, and it is M6's
  (retro 2026-07-27, finding 1): **every empirical claim needs a positive control that fires under the
  same conditions the negative claim disclaims.** Green tells you neither.


### THE D-8 / D-9 BOUNDS MEASUREMENT (spec 007 task 8.2, measured 2026-07-31 at HEAD `df256d6`)

*★ **PRODUCES NUMBERS. CHOOSES NOTHING.** Every figure below is input to **8.4**, the human gate that
picks the values; **8.5** implements them. Nothing here is a recommendation, and where the shape of a
curve makes one value look obvious that is **still not the answer until 8.4 says so**. No threshold was
committed — a `bound < N` test would flake AND smuggle in the number 8.4 owns (5.2's rule).*
*Method: 5.2's, unchanged — a **scratch `tests/browser` file, run once per engine and DELETED**;
production untouched; both bundles byte-identical at the commit.*

**WHAT D-8 AND D-9 ACTUALLY BOUND** *(resolved from plan §0 D-8/D-9 + spec §8-1/§8-2 BEFORE measuring —
the premise was checked rather than assumed, and one half of it was wrong)*:

| decision | what it bounds | units | placeholder (`src/app/diagramCache.ts`) |
|---|---|---|---|
| **D-8** `count` | global rows in `diagramMeta`; a row is one (diagram × effective theme) | rows | `PROPOSED_DIAGRAM_COUNT` = **100** |
| **D-8** `totalBytes` | global bytes over stored SVG | bytes | `PROPOSED_DIAGRAM_TOTAL_BYTES` = **8 MiB** (8,388,608) |
| **D-8** `maxAgeMs` | global age on `lastUsed` — the ABANDONMENT valve, not a capacity bound | ms | `PROPOSED_DIAGRAM_MAX_AGE_MS` = **30 days** (2,592,000,000) |
| **D-9** | **NOT A CAP.** The typical-case (1–3 diagram) **time-to-rendered TARGET** 8.4 sets | ms | *none — no constant exists yet* |

**★ D-8 is three caps; D-9 is a performance target.** Recorded explicitly because "D-8 and D-9 are the
two numeric caps" is the natural and WRONG reading, and it aims the measurement at a quantity that does
not exist.

**CELL 1 — D-8a: rendered-SVG bytes, 7 kinds × 2 sizes, read back through the production key**
(`diagramCacheKey` → `readDiagram` → `bytesOf`, theme `light`; control: engine invoked exactly 14/14):

| kind | small (Cr) | large (Cr) | small (Fx) | large (Fx) |
|---|---|---|---|---|
| flowchart | 14,772 | 109,768 | 15,141 | 112,223 |
| sequence | 23,782 | 42,178 | 23,790 | 42,182 |
| class | 18,233 | 75,932 | 18,884 | 80,106 |
| state | 28,030 | 84,590 | 28,221 | 88,533 |
| ER | 10,439 | 135,513 | 10,675 | 129,640 |
| gantt | 11,209 | 24,347 | 11,218 | 24,395 |
| pie | 4,317 | 9,785 | 4,331 | 9,770 |

All 14, Chromium: **min 4,317 · median 24,064 · max 135,513 · mean 42,350** (Fx: 4,331 / 24,092 /
129,640 / 42,794). SMALL median **14,772**; LARGE median **75,932**. **A rendered SVG is far larger than
a "small picture" intuition suggests** — the smallest measured is 4.2 KB and the largest 132 KB, a **31×
span across kinds**, which is why the byte axis cannot be reasoned about from the count axis.

**CELL 2 — D-8b: the 50-diagram fixture's footprint** (the fixture 5.2 and 8.1 used; controls: 50 engine
invocations on each theme pass):

| | rows | bytes | mean/row | vs count 100 | vs bytes 8 MiB |
|---|---|---|---|---|---|
| one theme (Cr) | 50 | 690,908 | 13,818 | 50% | 8.2% |
| **two themes (Cr)** | **100** | **1,382,746** | 13,827 | **100%** | **16.5%** |
| two themes (Fx) | 100 | 1,413,896 | 14,139 | 100% | 16.9% |

**CELL 3 — ★ THE EVICTION CLIFF, MEASURED ACROSS THE PLACEHOLDER, ON THE REAL IDB STORE.** N diagrams
rendered in `light`, flipped to `dark`, flipped BACK; the cell is the engine invocations on the flip
back. **Identical on both engines.**

| N (diagrams) | rows wanted (2N) | pass A | pass B | **flip-back re-renders** | rows after B |
|---|---|---|---|---|---|
| 25 | 50 | 25 | 25 | **0** — full hit | 50 |
| 45 | 90 | 45 | 45 | **0** — full hit | 90 |
| 49 | 98 | 49 | 49 | **0** — full hit | 98 |
| **50** | **100** | 50 | 50 | **0** — full hit, **by one row** | 100 |
| **51** | **102** | 51 | 51 | **51 — FULL MISS** | 100 |
| 55 | 110 | 55 | 55 | **55 — FULL MISS** | 100 |
| 60 | 120 | 60 | 60 | **60 — FULL MISS** | 100 |

**★ THE CLIFF IS TOTAL, NOT GRADED — and this is the single most decision-relevant number here.** The
arithmetic prediction was **2** re-renders at N=51 (102 rows − a 100 cap). The measurement is **51**.
Cause, read off the algorithm: on the flip back the A-theme rows are globally oldest, so the first
miss's write pushes past the cap and evicts **the next A row the same pass is about to ask for**. Every
subsequent read misses for the same reason — a **self-defeating cascade**. One row over the bound does
not cost one re-render; **it costs the entire cache's value for that document.** Stated, not acted on:
choosing where that discontinuity sits is 8.4's.

**CELL 4 — the bound SWEEP, over the production planner.** `planDiagramWrite` is the shipped eviction
algorithm, pure and bounds-parameterised, so replaying a session through it at candidate bounds measures
**the shipped algorithm under other numbers** without touching production. **VALIDATED FIRST** against
CELL 3's real IDB store — same sequence, production bounds — and it reproduces every point **exactly**
(0/0/0/0/51/55/60 at N = 25/45/49/50/51/55/60). An unvalidated projection is a model, not a measurement.

*4b — COUNT bound (down) × N diagrams (across); cell = flip-back re-renders, `0` = full hit:*

| count \ N | 1 | 3 | 10 | 25 | 50 | 75 | 100 | 150 | 200 |
|---|---|---|---|---|---|---|---|---|---|
| 25 | 0 | 0 | 0 | 25 | 50 | 75 | 100 | 150 | 200 |
| 50 | 0 | 0 | 0 | 0 | 50 | 75 | 100 | 150 | 200 |
| 75 | 0 | 0 | 0 | 0 | 50 | 75 | 100 | 150 | 200 |
| **100** *(placeholder)* | 0 | 0 | 0 | 0 | **0** | 75 | 100 | 150 | 200 |
| 125 | 0 | 0 | 0 | 0 | 0 | 75 | 100 | 150 | 200 |
| 150 | 0 | 0 | 0 | 0 | 0 | 0 | 100 | 150 | 200 |
| 200 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 150 | 200 |
| 300 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 200 |
| 400 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

**Every cell is either 0 or N.** The observed rule across the whole grid: **a two-theme flip-back is a
full hit iff `count ≥ 2N`, and otherwise a full miss** — there is no partial-credit region anywhere in
the sweep. Note the count bound buys nothing between 100 and 125, or between 150 and 200: **the curve is
a staircase whose steps are at `2N`, not a smooth trade.**

*4c — BYTES bound (across) × per-row bytes (down), after 50 diagrams × 2 themes; cell = surviving rows /
which axis bound:*

| bytes/row \ cap | 1 MB | 2 MB | 4 MB | 8 MB *(placeholder)* | 16 MB | 32 MB |
|---|---|---|---|---|---|---|
| 4,317 *(pie, small)* | 100 / count | 100 / count | 100 / count | **100 / count** | 100 / count | 100 / count |
| 13,827 *(the 50-fixture)* | 75 / bytes | 100 / count | 100 / count | **100 / count** | 100 / count | 100 / count |
| 24,064 *(all-kinds median)* | 43 / bytes | 87 / bytes | 100 / count | **100 / count** | 100 / count | 100 / count |
| 42,350 *(all-kinds mean)* | 24 / bytes | 49 / bytes | 99 / bytes | **100 / count** | 100 / count | 100 / count |
| 80,106 *(class large, Fx)* | 13 / bytes | 26 / bytes | 52 / bytes | **100 / count** | 100 / count | 100 / count |
| 135,513 *(ER large, Cr — the largest measured)* | 7 / bytes | 15 / bytes | 30 / bytes | **61 / bytes** | 100 / count | 100 / count |

*4d — the crossover is exact arithmetic, so it is stated as a formula rather than a table:* **bytes binds
before count iff mean row bytes > `totalBytes / count`.** At the placeholders that is **83,886 B/row** —
above every measured *small* diagram (4.3–28.0 KB) and above the all-kinds mean (42.4 KB), but **below
three of the seven measured LARGE diagrams** (Chromium: ER 135,513 · flowchart 109,768 · state 84,590;
class 75,932 falls just under, and sequence / gantt / pie are far under). So the byte axis is reachable
only by a cache filled predominantly with the large end of the distribution.

**CELL 5 — D-8's binding-axis question, over a realistic reading session.** Documents opened in
sequence, byte sizes drawn from CELL 1's **measured** distribution (all 7 kinds at both sizes, cycled —
not a single mean, because the byte axis's whole reason for existing is the document carrying a few very
large diagrams); every third document also re-read in a second theme. Identical on both engines.

| session shape | first eviction | binding axis | steady state |
|---|---|---|---|
| typical — 2 diagrams/doc | **document 39** | **COUNT** | rows pegged 100/100; bytes ~4.18–4.45 MB = **~50–53% of the 8 MiB cap** |
| heavy — 8 diagrams/doc | **document 10** | **COUNT** | rows pegged 100/100; bytes ~4.24–4.42 MB = **~51–53%** |

Single-oversized refusals: **0** in both shapes — no measured diagram approaches the 8 MiB whole-write
refusal. **PER-AXIS ANSWER, which is what §8.2 asks for** *(the D-8 revisit-when: an axis that never
binds is chosen wrong)*:
- **`count` — BINDS, always, in every shape measured.** It is the only axis that ever fires here.
- **`totalBytes` — NEVER BINDS at the placeholders.** It saturates at ~51% and stops, because `count`
  caps the row population first. It is reachable only at ~84 KB/row, i.e. a cache filled entirely with
  the *large* end of the measured distribution. **Whether that makes 8 MiB wrong, or correctly a safety
  valve that should rarely fire, is 8.4's call — it is not decided here.**
- **`maxAgeMs` — CANNOT bind inside a session; it is a calendar property.** The axis is shown FIRING and
  NOT FIRING rather than asserted: a row at `lastUsed = 0` planned against `now = cap+1` evicts
  `["old"]`; the same row against `now = 1` evicts `[]`.

**CELL 6 — D-9: the typical-case timing curve.** 7 reps, engine pre-warmed (the one-off
`import('mermaid')` is discarded, or it would land entirely in the N=1 arm). **A-B-A**: a 10-diagram
cold render interleaved before and after every B block. **Origin is `enhanceDiagrams`** unless the row
says *document-open*, which starts before `mount`.

*A-vs-A (the machine-state control):* Cr **A-early median 148.8 / A-late 153.2 → drift +3.0%**; Fx
**164 / 163 → −0.6%**. **The effects below are 4–6×. The bracket holds, so the run is RESOLVED** — not
8.1's not-resolvable case.

| N | engine | cold: time-to-first | cold: all-resolved (floor / median) | cold: ms/diagram | warm: all-resolved (floor / median) | warm: ms/diagram | **cold/warm** |
|---|---|---|---|---|---|---|---|
| 1 | Cr | 14.1 | 14.0 / **14.1** | 14.1 | 2.4 / **3.0** | 3.0 | **4.7×** |
| 1 | Fx | 16 | 14 / **16** | 16.0 | 3 / **4** | 4.0 | **4.0×** |
| 3 | Cr | 15.0 | 39.9 / **47.5** | 15.8 | 5.6 / **8.4** | 2.8 | **5.7×** |
| 3 | Fx | 15 | 40 / **46** | 15.3 | 9 / **10** | 3.3 | **4.6×** |
| 10 | Cr | 16.0 | 141.1 / **156.8** | 15.7 | 22.6 / **29.5** | 3.0 | **5.3×** |
| 10 | Fx | 15 | 146 / **171** | 17.1 | 34 / **39** | 3.9 | **4.4×** |
| 50 | Cr | 16.7 | 824.6 / **839.6** | 16.8 | 122.4 / **130.7** | 2.6 | **6.4×** |
| 50 | Fx | 18 | 997 / **1098** | 22.0 | 210 / **271** | 5.4 | **4.1×** |

Spreads (min–max), cold all-resolved: Cr 14.0–18.3 / 39.9–51.9 / 141.1–193.0 / 824.6–1067.3; Fx
14–18 / 40–52 / 146–224 / 997–1221. Markdown mount (text paint) is **0.2–1.4 ms** at every N on both
engines — the diagram cost is entirely post-paint, as §3.3 requires.

**THE SHAPE BETWEEN THE POINTS, OBSERVED RATHER THAN ASSUMED LINEAR** (plan §7's words):
- **Cold is near-linear** in N. Amortized cost drifts **14.1 → 15.8 → 15.7 → 16.8 ms/diagram** on
  Chromium (+19% across a 50× range) and **16 → 15.3 → 17.1 → 22 ms** on Firefox (+38%, all of it in
  the last leg). **Firefox is ~1.3× Chromium at N=50** — consistent in direction with 5.2's ~1.7× on the
  flip, smaller in size.
- **★ Time-to-first-diagram is FLAT — ~14–18 ms cold and ~2.4–7 ms warm, at N=1 and at N=50 alike.**
  The enhancer is sequential, so the first diagram costs the same whatever follows it. **D-9 has three
  named axes and they do not move together**: the amortized and all-resolved axes scale with N,
  time-to-first-diagram does not.
- **Warm is ~2.6–5.4 ms/diagram**, i.e. the cache is worth **4–6×** on the whole-document axis at every N
  measured.

**§8's 50-diagram OUTER BOUNDS, verified at that size — stated, not asserted as a test:**

| | Chromium (floor / median / max) | Firefox (floor / median / max) | inherited bound |
|---|---|---|---|
| first open, document-open → all 50 resolved | 825.5 / **840.5** / 1068.2 ms | 998 / **1099** / 1223 ms | **≤ 5 s** — met, ~4.5× headroom |
| cached reopen, same | 123.3 / **131.6** / 229.2 ms | 213 / **273** / 313 ms | **< 1 s** — met, ~3.7× headroom |

**★ INSTRUMENT NON-VACUITY, and the defect it caught.** The instrument must be shown to MOVE with the
thing it measures, or a flat reading means nothing. Three ways, all shown: (1) CELL 3's flip-back counter
moves **0 → 51** across the count bound, identically on both engines; (2) CELL 4b's sweep moves the cliff
**with the bound** (`count ≥ 2N`), so the cliff is a property of the bound and not of the harness;
(3) CELL 6's cold/warm ratio reads **4.0–6.4×**, in line with 5.2's ~5×.
**MEASURED HARNESS DEFECT, found by that check and fixed before anything was recorded:** the first
timing run used the existing 25 ms polling settle, which **floors every arm at ≥25 ms** — the N=1 cold
arm and the N=1/N=3 warm arms all came back at ~25.5 ms and **the cold/warm ratio at N=1 read 1.0×**,
which is the poll, not the cache. D-9 is *specifically* the 1–3-diagram case, so the floor sat directly
on the quantity being measured. Replacing it with a `MutationObserver` on the `pending` attribute moved
N=1 from 25.5 → **14.1 ms cold / 3.0 ms warm (1.0× → 4.7×)**. **Every D-9 number above is from the
observer-driven settle.** A polled settle must not be used to time anything at this scale again.

**WHAT 8.2 DID NOT DO:** no bound value chosen, no target chosen, no constant edited, no threshold test
committed, no production file touched. `PROPOSED_DIAGRAM_COUNT` / `_TOTAL_BYTES` / `_MAX_AGE_MS` remain
the placeholders 4.1 set. **8.4 reads this alongside 5.2's flip cost and 8.1's package/first-paint
numbers, and chooses; 8.5 implements.**

### THE D-11 PLACEHOLDER RECORD (spec 007 task 8.3, measured 2026-08-01 at HEAD `80a86b1`)

*★ **PRODUCES MATERIAL. CHOOSES NOTHING, AND — UNUSUALLY — COMMITS NO TEST.** Everything below is input
to the **9.1 gate-3 walk**, which judges D-11. Nothing here is a verdict on whether the placeholder
should shimmer or stay static.*

**★ WHY 8.3 COMMITTED NO TEST, WHICH IS THE OPPOSITE OF WHAT ITS OWN Verify ASKS FOR.** `tasks.md` §8.3
asks for a `tests/browser` case proving placeholders are *"instant with no animation under
`prefers-reduced-motion`"* **and** *"DO animate without it"*, plus a **revert-and-fail** dropping "the
reduced-motion branch". **Those three clauses are STRUCK.** They are premised on a placeholder shimmer
that **does not exist and that no task in 007 builds** — §8.3's own Files list names `tests/browser` +
fixtures, never `readerCss.ts` or `diagramView.ts`, and the only three tasks that touch `readerCss.ts`
(**3.1** tokens + the visibility rule · **7.1** the control group · **7.2** the lightbox) all landed
without motion. So:

- a test asserting *"the placeholder animates"* is **unwritable** — nothing animates;
- a test asserting `animationName === 'none'` **pins "STATIC"**, which is the *other* answer §8-4
  reserves for the walk (*"whether the placeholder shimmers **or is static**"*);
- **building** the shimmer to make the first test writable **pre-empts the gate D-11 created.**

Every available form of the test decides D-11. So 8.3 records and hands over. **★ `tasks.md` is
gate-sealed and was NOT edited — its §8.3 Verify text still describes the struck clauses. A session
reading `tasks.md` alone will find §8.3 checked off against a test that was never written; this
paragraph is the reconciliation, and whether §8.3 earns an in-file note is a HUMAN call carried to
9.1/9.3.**

**CELL 1 — THE PLACEHOLDER IS STATIC, MEASURED.** A real `pending` figure held pending by a
never-resolving loader, through `mount` + `enhanceDiagrams`, computed style read in-engine.
**Identical on Chromium and Firefox:**

| property, `figure.peekover-diagram[data-diagram="pending"]` | no-preference | `prefers-reduced-motion: reduce` |
|---|---|---|
| `animationName` | **`none`** | **`none`** |
| `animationDuration` | `0s` | `1e-06s` (Cr) / `0.000001s` (Fx) |
| `transitionProperty` / `transitionDuration` | `all` / `0s` | `all` / `1e-06s` |
| `opacity` | `1` | — |
| **`height`** | **`0px`** | — |
| **descendant elements** | **0** | — |

The shipped placeholder is an **empty, zero-height `<figure>`** — `margin:28px 0;padding:0;
overflow-x:auto;text-align:center` (`readerCss.ts:626-629`) and nothing else. No animation, no
transition, no min-height, no children to carry motion. **There is no `[data-diagram="pending"]`
selector anywhere in the sheet.**

**CELL 2 — ★ THE HINGE: WHY NO REDUCED-MOTION TEST IS WRITABLE EVEN IF THE SHIMMER EXISTED.** Asked
*before* writing a control rather than after — this is the **third** occurrence of 7.2's dead-control
finding. A stand-in shimmer was injected into the shadow tree **with no reduced-motion rule of its own**:

| injected `.peekover-diagram[data-diagram="pending"]{animation:… 1200ms}` | Cr | Fx |
|---|---|---|
| no-preference: `animationName` / `animationDuration` / `height` | `scratch83-shimmer` / **`1.2s`** / `120px` | same |
| `reduce`: `animationName` | `scratch83-shimmer` — **survives** | same |
| `reduce`: `animationDuration` | **`1e-06s`** | `0.000001s` |

**READER_CSS's sheet-wide `@media (prefers-reduced-motion:reduce){ :host *{animation-duration:.001ms
!important;transition-duration:.001ms!important} }` (`readerCss.ts:76-79`) already owns any placeholder
suppression.** The placeholder is inside the shadow tree and matched by `:host *` like everything else;
there is no escape route (no JS-driven animation, no property outside the two the rule pins, no element
the selector misses). **A D-11-specific reduced-motion rule would therefore be a DEAD control — bytes
that change no observable — exactly as 7.2 found for the lightbox panel (`readerCss.ts:759-766`).** The
property is required whoever provides it; what 8.3 does not do is pretend D-11 provides it.

**INSTRUMENT NON-VACUITY:** the `1.2s` free reading and the `120px` height are the same probe, in the
same run, seeing motion it was given. **"Static" in CELL 1 is a measurement, not a blind read.**

**CELL 3 — THE 10- AND 50-PLACEHOLDER FIXTURES (the walk material).** **No existing fixture served.**
`tests/golden/fixtures/` held nine documents, **none containing a mermaid fence**; the "50-diagram
fixture" 5.2/8.1/8.2 measured lived inside those tasks' **scratch harnesses and was deleted with them**,
so it exists today only as numbers in this file. §8.3's *"only if no existing fixture serves"* condition
is met, and two documents are added:

| file | fences | bytes | kinds |
|---|---|---|---|
| `tests/golden/fixtures/diagrams-10.md` | 10 | 6,305 | flowchart · sequence · class · state · ER · gantt · pie, cycled |
| `tests/golden/fixtures/diagrams-50.md` | 50 | 28,920 | same cycle |

**Every fence is textually UNIQUE** (verified 10/10 and 50/50 distinct) — load-bearing, because the
diagram cache keys on fence source, so a repeated fence would resolve from cache after the first and the
walk would see a document far faster than any real one. Prose sits either side of every fence so the
figure lands in flow between two text blocks.

**These are MATERIAL, not test inputs. Nothing asserts against them** — `golden.test.ts`'s `FIXTURES`
array is hardcoded and does not glob the directory, so **nothing under `tests/golden/output/` is added or
altered** and the golden diff stays EMPTY. Validated once, in a scratch run that was deleted: **both
documents render every fence on both engines — 10/10 and 50/50 reach `rendered`, `failed: 0`,
`pending: 0`, one `<svg>` per figure.** A fixture that silently degraded would have handed 9.1 a walk
over error markers.

**CELL 4 — WHAT THE READER ACTUALLY SHOWS AT DOCUMENT-OPEN** (the frame the walk starts from), measured
on both fixtures, both engines, at the instant the synchronous prologue returns:

| | `diagrams-10` | `diagrams-50` |
|---|---|---|
| placeholder figures present | 10 | 50 |
| **distinct placeholder heights** | **`0px`** (all) | **`0px`** (all) |
| source `<pre>` fences **visible** (`display` ≠ `none`, height > 0) | **10 / 10** | **50 / 50** |

**★ THERE IS NO "FIELD OF PLACEHOLDERS" TO JUDGE.** The reader opens on a full column of prose and
**visible source fences**; the zero-height figures are invisible siblings. Each fence is replaced
individually as its SVG lands. This is §3.3's post-paint enhancement working as designed, and it
**reframes D-11's question**: the walk is not judging shimmer-vs-static over a grid of grey boxes, it is
judging what should happen in the gap between *"a code fence is on screen"* and *"a diagram is on
screen"*.

**CELL 5 — THE DECISION INPUTS 9.1 NEEDS, derived from 8.2's measured timings (no new timing run).**
The enhancer is sequential, so placeholder *k* stays pending for roughly *k* × the amortized per-diagram
cost. Using 8.2's CELL 6 medians:

| | first fence | last fence, `diagrams-10` | last fence, `diagrams-50` |
|---|---|---|---|
| **cold** (Cr) | **~14–17 ms** | **~157 ms** | **~840 ms** |
| **cold** (Fx) | **~15–18 ms** | **~171 ms** | **~1,099 ms** |
| **warm / cached reopen** (Cr) | ~2.4–3 ms | ~30 ms | ~131 ms |
| **warm / cached reopen** (Fx) | ~3–4 ms | ~39 ms | ~271 ms |

- **Time-to-first-diagram is FLAT (~14–18 ms cold) at every N** — 8.2's finding. The *top* of any
  document resolves in well under a perceptual threshold whatever follows it.
- **The wait is a RAMP, not a uniform delay.** It runs from ~15 ms at the top to **~0.84 s (Cr) / ~1.1 s
  (Fx)** at the bottom of a 50-fence document. **Any motion treatment is therefore sub-perceptual where
  the reader is looking first, and clearly perceptible only far below the fold** — which is the crux of
  "progress or noise" and is stated here as arithmetic, not as an opinion about the answer.
- **Text paint is untouched:** markdown mount is **0.2–1.4 ms** at every N on both engines (8.2), so the
  entire diagram cost is post-paint and the reading experience begins before any of it.
- **50 fences is the HEAVY agent-output case, not the typical one.** 8.2's session model puts the
  typical document at **2 diagrams** and the heavy one at **8**. `diagrams-50.md` is deliberately the
  tail, and a verdict read off it alone would be read off the worst case.

**WHAT 8.3 DID NOT DO:** no static-vs-shimmer verdict, no motion test, no reduced-motion test, no
production file touched (`readerCss.ts` / `diagramView.ts` byte-identical), no constant, no threshold,
no `tasks.md` edit. **§ Baselines' pins were NOT re-run** (finding 3's rule — state it rather than let
the table imply it): 8.3 touched no production file, so the byte pins were re-verified rather than
re-measured — content script **318,747 B** both engines at the recorded md5s, app chunk **387,837 B**,
`permissions: []` — and **first paint was not re-measured**, so those rows still carry 8.1's numbers.
**9.1 judges D-11 from CELLs 1, 4 and 5, walking
`diagrams-10.md` and `diagrams-50.md` on real Chromium and real Firefox; a "reads as noise" or "reads as
broken" verdict there is a finding and becomes a task, not a silent fix.**

### Watch-mode numbers (spec 005 task 5.1, measured 2026-07-21 — `pnpm perf:watch`)
*Same machine and protocol as the table above. **NOT a gate**: no threshold is asserted. Re-run twice at
6.1 and the numbers did not move — **`perf-watch.ts` calls `mount()` and `observerDetector` directly and
never drives `watchController`, so it is structurally blind to 5.3's cooldown.** A moved number here would
have needed a different explanation than "the cooldown".*

**(b) RE-RENDER COST — production's own `mount(text, host, {preserveReading:true})`, real headless Chromium,
on the REAL content-script `<peekover-root>` and on the app page's `.peekover-app__reader` pane shape.**

| ms (median of warm 6) | 50 KB full-page | 50 KB contained | 1 MB full-page | 1 MB contained |
|---|---|---|---|---|
| **shipped mount, SYNCHRONOUS** | **34.9** | **35.7** | **717.3** | **713.9** |
| shipped, start → 2nd rAF | 49.8 | 49.7 | 811.5 | 806.3 |
| plain mount, synchronous (control) | 16.8 | 17.0 | 359.9 | 379.3 |
| plain, start → 2nd rAF (control) | 49.9 | 49.8 | 801.6 | 845.4 |
| parse+sanitize only | 12.5 | 12.7 | 266.8 | 261.6 |

- **READ THE TWO ROWS TOGETHER OR YOU WILL DRAW THE WRONG CONCLUSION.** Continuity doubles the SYNCHRONOUS
  block but adds **≈0 ms at 50 KB** and **nothing distinguishable from noise at 1 MB** (+9.9 full-page,
  −39.1 contained, against a plain-path spread of 793–908) to the **whole** unresponsive window.
  `restoreReadingAnchor` reads `getBoundingClientRect` after the commit and forces layout the plain path
  pays a frame later regardless. **Layout MOVED, not ADDED** — reproduced on the 6.1 re-runs, with the two
  surfaces moving in **opposite** directions (+24.1 / −24.8 ms), i.e. noise around zero.
- **Non-vacuity, proven per cell:** with the changed block INSERTED ABOVE, the shipped path moved the scroll
  box **2738 px** to hold the reader's place while the plain control moved it **0 px** — on both surfaces.
- **BOTH SURFACES NOW RE-RENDER, and this corrects what this section said before task 4.8.** The table's
  contained column governs the app page (`appShell.ts`), but the content script is **no longer** the
  never-re-rendering surface the pre-4.8 note described — it registers a real `createWatchController` too.
  Its cost is the full-page column.

**(a) OBSERVER LATENCY — programmatic write → `observerDetector` callback, no human in the loop.**

| | 50 KB | 1 MB |
|---|---|---|
| **close() → detector cb** | **18.7 ms** | **109.5 ms** |
| write (createWritable…close) | 2.2 ms | 4.2 ms |
| per-tick read (`getFile().text()`) | 0.6 ms | 2.4 ms |

- **★ THE INFERENCE IS CONFIRMED — MEASURED ON LOCAL DISK AT THE 7.1 GATE, 2026-07-21 (task 5.1a).** With
  a production build loaded and a real picker-opened folder rewritten from outside the browser: **a small
  file updates INSTANTLY; the 1 MB file updates in A FEW MILLISECONDS.** The OPFS numbers **did NOT
  under-predict local disk**, so 5.2's named revisit trigger did not fire.
- **THE TABLE'S PROVENANCE IS STILL OPFS and the confirmation does not overwrite it.** 18.7 / 109.5 ms
  were measured on **OPFS**, the only handle obtainable without a user gesture (`showDirectoryPicker`
  opens a native dialog Playwright cannot drive — recorded M2 limit); no local-disk number was faked then
  or invented now. **The gate instrument is COARSER than the harness instrument** — a human cannot resolve
  18.7 from 109.5 ms and did not try — so 5.1a confirms a **magnitude class**, not a rival figure. *(Why
  the confirmation was worth a task, and why it is the counter-example to retro finding 2: `decisions.md`
  2026-07-21.)*
- **The task-0 probe's 5127 ms is RETIRED** — it was human reaction time. Never quote it as a latency.
- **The 1 MB latency cell looks unstable and is not:** 5.1 read 109.5 ms, the 6.1 passes 130.4 / 126.4 ms,
  but the second pass's own spread is **100.5–132.7 ms**, a band *containing* 109.5. **50 KB is stable
  across all three passes (18.7 / 19.3 / 18.3)** — the control that makes the 1 MB band read as
  fixture-size variance rather than instrument drift.
- **CHROMIUM ONLY, twice over:** Playwright cannot load an extension into Firefox, and `FileSystemObserver`
  does not exist on Firefox (measured, task 1.2). Firefox's app-page watch (drag-opened folders) IS a
  shipped surface, so **its re-render cost is UNMEASURED** and evidenced only at 7.1.
- **Fidelity residual, stated:** the content script's isolated world exports nothing, so `perf-watch.ts`
  bundles the same SOURCE with esbuild (via `tsx`'s own dependency — no devDependency added) and evaluates
  it in the page. Production source, not the production build artifact; and the bundle's own registry holds
  no watch target, so the measured mount omits the watch pill. No measurement-only code ships.

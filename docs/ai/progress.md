# Progress — Peekover
*The file every session reads first. Keep the "Now" section honest.*
*Updated: 2026-07-27.*

> **Closed-milestone narrative lives in [`progress-archive.md`](progress-archive.md).** This file is the
> working set: what is true today, what is next, what is carried, and the current numbers. If you want the
> step-by-step evidence behind a closed milestone, follow the link from its close summary below.
> **Order is deliberate: what to do (Now · Up next · Blockers) comes before what to know (Closed
> milestones · Baselines).**

## Now (start here)

**M6 (spec 006 — snapshots + diff) closed 2026-07-27. M7 is IN IMPLEMENTATION: all three Gear-3 gates are behind it — `spec.md` PASSED gate 1 (`e09520f`, three revisions, §3.4/§9-2/§9-3 dispositions recorded there), `plan.md` PASSED gate 2 (`c44406a`, approved at `cab93c7` with four sub-decisions — the D-5 ledger copy, version-bump-uses-eviction, the `architecture.md` correction routed to group 9, and the §7-9 flip-cost re-routed to gate 3), and `specs/007-mermaid-diagrams/tasks.md` (28 tasks, nine groups) PASSED gate 3 (banked in `decisions.md`'s M7 GATE 3 entry — `66634fa`; the tasks file's "DRAFT awaiting gate 3" status line stays, by the gate-1/gate-2 precedent). TASK 1.1 IS DONE (`2159e5c`): `mermaid@11.16.0` added as the FIFTH production dependency, with its four supply-chain gates discharged. TASK 1.2 IS DONE (`1391118`): `src/render/diagramEngine.ts` — the ONE module naming `import('mermaid')` (a static string literal the scanner permits), the feature-detect that keeps a fence-free document from ever evaluating it, D-6 step 3's configuration, and `engineVersion()` sourced from a STATIC `mermaid/package.json` import per the D-3/D-13 amendment (`bddd5af`) — mermaid exposes no runtime version. Imported by NOTHING, so both bundles are md5-identical to 1.1's. TASK 1.3 IS DONE (`c7b3004`) — THE ABLATION, and GROUP 1 IS COMPLETE. The content-script bundle is md5-IDENTICAL both engines with `diagramEngine` made reachable by a scratch `appShell.ts` reference — mermaid never enters the gated path — and that null counts for something only because the negative control FIRED in the same run: the app page gained +3,349,685 B. mermaid emits as a SEPARATE LAZY ASYNC CHUNK (`chunks/mermaid.core-D7K4dyvy.js`, 34,946 B) behind a real `import()`, never statically inlined; the app chunk itself moved only +2,379 B (dynamic-import glue 1,971 · `diagramEngine`'s own code 375 · scratch artifact 29 · statement realign 4), decomposed to the byte with no unnamed residual. Both of 1.2's handoff items are discharged: the static `mermaid/package.json` import does inline the WHOLE package.json — 3,847 B, isolated by a second ablation — and the emitted output carries NO bare specifier and NO orphan chunk. These figures are ABLATION / SCRATCH-WIRED and are NOT the production figure (8.1 owns that): `appShell.ts` is restored md5-identical, `diagramEngine` is again imported by nothing, and the committed baselines are UNCHANGED. Full note in § Baselines. TASK 2.1 IS DONE (`4d3df61`) — GROUP 2 IS OPEN. `sanitizeSvg()` is a SECOND NAMED sanitizer (D-1), not a configurable one: `SVG_ALLOWED_TAGS` / `SVG_ALLOWED_ATTR` / `SANITIZE_SVG_CONFIG` + `sanitizeSvg()`, sharing the DOMPurify singleton so the global `uponSanitizeAttribute` hook is INHERITED. Its `ALLOWED_URI_REGEXP` is **design C per the D-1/§2.1 AMENDMENT (`ff8f323`)** — a scheme-free regexp confined by `ADD_URI_SAFE_ATTR` to the reference attributes; §2.1's original literal `/^#/` is unimplementable against DOMPurify's global attribute gating (it would delete every coordinate in the diagram), and design C preserves both of §2.1's security properties exactly. `foreignObject` and `<style>` are denied BY ABSENCE, not by a FORBID list; `ALLOW_ARIA_ATTR: true` is the one deliberate config divergence (a11y, spec §5). Evidence, re-run from clean this session: the hostile corpus is red-first **9 of 9** under an identity passthrough, each red NAMING the surviving node (`<foreignObject width="100" height="100">`, `<use href="http://evil.example/payload.svg#x">`, `<style>@import url("http://evil.example/x.css")…`) — none is jsdom-neutralized-regardless; revert-and-fail (add `foreignObject` to `SVG_ALLOWED_TAGS`) reds **exactly 3** — that corpus case plus the two drift-guards designed to catch it — and no other corpus case. The DOCUMENT profile is BYTE-UNTOUCHED (the whole diff is one additive hunk from `:146`, zero `-` lines), pinned by a source-text assertion PROVEN TO FIRE: a scratch entry in the document `ALLOWED_TAGS` reds it naming the const. So markdown source still cannot produce an `<svg>`. The profile tree-shakes to zero on the content script — 315,671 B md5-identical BOTH engines — and that holds only because of the `/*#__PURE__*/ …slice()` form, ABLATED and re-measured this session: spreads take it to 316,567 B (+896 B). TASK 2.2 IS DONE (`a6d2226`) — ★ GROUP 2 IS COMPLETE. `tests/browser/diagramSanitize.browser.test.ts` proves, in REAL Chromium AND Firefox (5 tests × 2 engines, 10/10), what the §2.2 AMENDMENT (`b19c068`) reframed the task around: the SVG profile's `data:` denial is ALLOW-LIST-DRIVEN and hook-INDEPENDENT. A fresh NO-HOOK DOMPurify instance (`DOMPurify(window)`, asserted a distinct object and asserted hook-free — `removeHook` returns `undefined` on an empty stack) is EQUALLY clean on `SANITIZE_SVG_CONFIG`; `data:` on `xlink:href` does not survive `sanitizeSvg`; the `#dot` fragment on that same attribute DOES survive, so neither result is passing on an empty tree; and the sweep itself is proven to FIRE on the raw payload (2 data: URIs reported). The inherited hook IS registered on the singleton `sanitizeSvg` calls — pinned behaviourally by a temporary observer hook that fires and sees `xlink:href` (plan §4-3's second half, true regardless of how `dompurify` resolved at 1.1) — but it is labelled in the test as an INHERITANCE-BY-CONSTRUCTION pin, NOT a security discriminator: ★ THERE IS NO "remove the hook → `data:` reds" REVERT-AND-FAIL FOR THIS PROFILE, BECAUSE THE HOOK IS A PROVEN NO-OP HERE (`b19c068`: all five `_isValidAttribute` acceptance branches closed). That absence is THE FINDING, not a missing check. The revert-and-fail is the WIDENING BOUNDARY and it has teeth in both engines: adding the single `DATA_URI_TAGS` member `image` to `SVG_ALLOWED_TAGS` reds the no-hook guard naming the survivor — `expected [ '<image href="data:text/html,y">' ] to deeply equal []` — in Chromium AND Firefox, while the HOOKED `sanitizeSvg` still strips it (b19c068's GATE B asymmetry, reproduced live). Under the same widening the unit suite reds **exactly 5**: that mirror guard plus 2.1's two drift-guards (the exact-set and denied-by-absence tests), the `<image href>` corpus case, and the new `image`-denied-by-absence pin — the (c) guard is among them, and `sanitize.ts` was restored FROM THE `cp` COPY, md5-identical. A jsdom mirror lands in `sanitize.test.ts` with the honest in-file note that the BROWSER test is authoritative (jsdom is blind to the real-engine reparse/mXSS cases — decisions.md 2026-07-14). One stale `sanitize.ts` comment that `b19c068` falsified (it claimed the inheritance "is exactly the property a future `removeHook` breaks silently") is re-anchored to the truth; the edit is COMMENT-ONLY and proven BYTE-NEUTRAL — both engines' content script (315,671 B) and app chunk (`app-CEHD9mSZ.js`, 361,500 B) are md5-IDENTICAL before and after. **THE D-6 `secure` HARDENING IS DONE (`3d7c8ed`)** — the config change the D-6 ADDENDUM (`16c7790`) licensed but deliberately did not make; it is the addendum's implementation, NOT a numbered tasks.md task, and it does not move the group-3 pointer. `DIAGRAM_ENGINE_CONFIG` now carries `secure` = mermaid's own six defaults PLUS `themeCSS`, `fontFamily`, `altFontFamily`, `themeVariables`, so a `%%{init}%%` directive can no longer inject fetching CSS into the engine's generated `<style>` before `sanitizeSvg` runs. `securityLevel`/`htmlLabels`/`startOnLoad` are byte-identical — the diff is one added key plus its rationale. Proven RED-FIRST in `tests/browser/diagramSecure.browser.test.ts` (9 tests × 2 engines, 18/18) over BOTH routes the addendum names, each with its own loopback URL and each red against the un-hardened config in the SAME run: **ROUTE 1 `themeCSS`** (an ORDINARY `background-image:url(…)`, NOT `@import` — `@import` is dropped by mermaid's own constructed-stylesheet parse and would have passed VACUOUSLY) and **ROUTE 2 `fontFamily`** (the brace-balanced `:root{--mermaid-font-family}` interpolation `sanitizeCss` does not catch). Pre-change, against the committed config, all three payloads landed in `<style>` AND reached the wire in Chromium AND Firefox — `…/d6-1/evil1.png`, `…/d6-3/evil2.png`, `…/d6-5/evil3.png`; post-change every hardened arm observes ZERO requests. The instrument is proven live by a benign `%%{init:{"theme":"dark"}}%%` control that visibly re-themes in the same run (`#ECECFF` gone), so "no fetch" is a RESULT, not a dead probe. The list GUARDS ITSELF (a `%%{init:{"secure":[]}}%%` re-widening directive does not fetch — `sanitize()` iterates `['secure', ...siteConfig.secure]`), our own `initialize()`-set `themeCSS` STILL APPLIES (the DIRECTIVE route is closed, not the feature), and the ABLATION holds: a config passing mermaid's DEFAULT six explicitly STILL fetches ROUTE 1 (`…/d6-6/evil4.png`), so the four ADDED keys are causal rather than the act of passing an array. `themeVariables` carries the one accepted cost the addendum priced (author-directive themeVariables stop applying; the effective theme is OURS — §3.7/D-7). ★ **BYTE DELTA: ZERO, on BOTH bundles and BOTH engines** — app chunk `app-CEHD9mSZ.js` 361,500 B and content script 315,671 B are md5-IDENTICAL before and after (Chromium `172e88b6…`/`c8251651…`, Firefox `172e88b6…`/`b597b1b4…`). ★ **This is NOT the "app chunk moves" the task anticipated, and the reason matters: `diagramEngine.ts` is still imported by NOTHING, so it is on NEITHER bundle graph and the `secure` array cannot cost bytes yet.** Confirmed with a FIRING CONTROL rather than a bare grep (an identifier grep over a minified bundle reads 0 everywhere): `peekover-remote` hits 8× and `DOMPurify` 1× in the same file where `language-mermaid`, `hasDiagramFence`, `mermaid` and `startOnLoad` all read 0. The real cost lands when 3.1/3.2 wire the enhancer — 8.1 owns the production figure. ★ **STILL OWED — this closes a ROUTE, not the WINDOW: task 3.3's real-engine zero-network guard on D-6's measurement window is UNCHANGED and still outstanding.** A config that provably closes one directive route is not a proof that the render window is clean, which is the entire point of D-6's "not by construction". **THE D-1/D-6 OPTION-B IMPLEMENTATION IS DONE (`367d051`) — ★ `ff8f323`'s FIRST DOWNSTREAM FINDING IS DISCHARGED IN CODE, AND GROUP 3'S `<style>` BLOCKER IS CLOSED.** Like the D-6 hardening it is the ADDENDUM's implementation (`0de27f3`), NOT a numbered tasks.md task, so it does not move the group-3 pointer. `SVG_ALLOWED_TAGS` now admits `style` — reversing 2.1's denial for that element ONLY — and `cleanSvgCss` is the first procedural filter beside the allow-list: it strips any `url(` TOKEN whose target is not a `#`-fragment and any at-rule but `@keyframes`, preserving internal `url(#…)` and the `edge-animation-frame`/`dash` keyframes mermaid emits unconditionally. **Coverage is TOKEN-scoped, not property-scoped** — the reproduced property set already runs to 19 open-ended spellings, so a property allow-list is one CSS release behind by construction. **MECHANISM: an in-repo default-deny scan over a DECODED, comment-free view, NOT the platform `CSSStyleSheet`+`replaceSync`** — the platform parser is browser-only (jsdom has none, so the pass would silently no-op there) and a CSSOM rule-walk must re-serialize, dropping every declaration the host engine does not understand. ★ **The decoded text is NEVER emitted**: cuts are found in view coordinates and excised from the ORIGINAL, because `content:"\3c /style\3e…"` decodes to a literal `</style>` and an HTML-namespaced `<style>` serializes RAW. Escapes that decode to a STRUCTURAL character become a sentinel, so `\28` cannot fabricate a function-open the CSS parser never saw. The pass runs to a FIXPOINT and fails CLOSED. **NO NEW DEPENDENCY** — the addendum's lean held. Proven RED-FIRST in `tests/browser/diagramStyleCss.browser.test.ts` (18 tests × 2 engines, 36/36) with the pass NEUTERED and restored FROM THE `cp` COPY: **every GREEN arm reds in BOTH engines (18/18 failures, exactly the green arms)** while every RED/control arm still passes. Each lane ADOPTS the artifact into the LIVE document and watches the wire — string-stripping is necessary, not sufficient. All four obfuscation lanes reproduce and are closed: ★ the CSS escape `u\72 l(` **(red evidence: `.p-css-2{background-image:u\72 l(http://…/escape.png)}` surviving with a fetch — the lane a naive `/url\(/` MISSES and the one that decides the mechanism)**, case `URL(`, interior whitespace, both quote forms, plus protocol-relative, `data:`, `@import`, and a bare-string `image-set("…")` (BEYOND the reproduction's surface — a fetch with no `url(` token in it at all, denied whole). ★ **THE LIVE CONTROL IS IN EVERY LANE'S OWN STYLESHEET**: a benign `url(#gradA)` and `@keyframes` survive the same `<style>` the payload was in, so "zero requests" is a RESULT and not an over-strip — without it option B would have bought nothing. A REAL mermaid render passes through **byte-identical** (`cleanSvgCss` is the identity on a clean sheet) with both keyframes intact. ★ **A HARNESS FINDING WORTH MORE THAN THE LANE IT CAME FROM: in FIREFOX, parsing `@import url(X)` into ANY inert document — a bare `new DOMParser().parseFromString` is enough — CONSUMES the load for X; no request reaches the wire and a later adoption of that same X is NEVER RETRIED.** Since sanitizing a payload IS such a parse, routing the `@import` positive control through the no-pass sanitizer made it read NO-FETCH in Firefox while the route was wide open — a control that reads empty when the defect is live. Measured with byte-identical strings from two origins (hand-written FETCHES, `DOMPurify.sanitize`-produced does NOT, Firefox only; Chromium fetches both). The `@import` live-route arm therefore adopts markup no sanitizer has touched. ★ **BYTE DELTA: ZERO — content script 315,671 B md5-IDENTICAL both engines** (`c8251651…` / `b597b1b4…`), app chunk `app-CEHD9mSZ.js` 361,500 B, and that null is NOT vacuous: the fence is held by registering the hook INSIDE `sanitizeSvg` and removing it in `finally` rather than at module scope, ABLATED in the same session — a module-scope `addHook` is a side effect the bundler must retain and takes the content script to 318,470 B (**+2,799 B**, with `image-set(` appearing in the bundle). 2.1's four tests are updated: the exact-set gains `style`, the denied-by-absence loop drops it, the `@import` case is RE-AIMED (the ELEMENT now stays, so the RULE must go — it used to pass because the element was dropped, exercising no CSS handling at all), and the corpus sweep gains a SECOND predicate over `<style>` TEXT, because the attribute sweep structurally cannot see CSS and that row would otherwise have passed while the artifact carried a live `@import`. The DOCUMENT profile is untouched and its source-text pin is green. **TASK 3.1 IS DONE (`1e09164`) — ★ GROUP 3 IS OPEN, AND THIS IS THE FIRST CODE IN THE TREE THAT PUTS DIAGRAM STRUCTURE IN THE LIVE DOM.** ★ **SCOPE, DECIDED FROM tasks.md AND STATED BECAUSE THE BYTE ACCOUNTING TURNS ON IT: 3.1 DOES NOT WIRE THE ENGINE.** `diagramEngine.ts` is absent from §3.1's Files list and present in §3.2's; §3.1's verify names no SVG, no adoption and no `sanitizeSvg`; its byte check names ONLY the `READER_CSS` delta, and a ~3.3 MB lazy chunk entering would be the headline byte event of the milestone. Decisive confirmation from the tree rather than from reading: `diagramEngine` is imported by NO production module, so a single import from the enhancer — even for the selector constant alone — would make it reachable from the app-page graph and MATERIALISE mermaid's chunk. It is therefore deliberately NOT imported: `DIAGRAM_FENCE_SELECTOR` is re-declared in `diagramEnhancer.ts` and the duplication is PINNED by a unit test that imports both constants and asserts equality (a test import costs no bundle bytes). `src/render/diagramView.ts` owns D-15's structure and its three states (`pending` / `rendered` / `failed`) and `src/render/diagramEnhancer.ts` owns the SYNCHRONOUS prologue; `markDiagramRendered` takes a NODE, never a string, so 3.2 hands it `mount.ts:131-133`'s adopted `<template>.content` and no innerHTML exists anywhere in either module to reach around the D-1 profile. Wired at BOTH D-12 sites from ONE shared function: `readerPane.ts:179` after its committed `mount`, and — the seam that had no consumer until now — the `render` closure `appShell.ts` passes into `createWatchController` (`watchController.ts:449`), which every caller had taken the `mount` default for. **`contentWatch.ts` still passes no `render` and is byte-untouched — that omission IS the §3.2 fence.** ★ **THE CONTENT-SCRIPT DELTA IS +303 B AND IT IS EXACTLY THE CSS, WITH ZERO CODE** — 315,671 → **315,974 B**, identical on BOTH engines, and 303 B is precisely the byte length of the `READER_CSS` block added (`git diff` of the added lines, counted). The decomposition is proven by a FIRING CONTROL rather than a bare identifier grep: with the enhancer UNGATED into `mount()` — the one function both surfaces share, which is the accident rows 2+3 guard against — the same build reads **316,554 B (+883 B)** and `peekover-diagram` appears **3×**; gated, it appears **2×**, both of them the CSS selectors, and `language-mermaid` reads 0. **No mermaid chunk exists in either output** — `chunks/` holds one file. App chunk `app-CEHD9mSZ.js` 361,500 → `app-BDQ8clk9.js` **362,293 B (+793 B)** = the same 303 B of shared CSS + **490 B** of enhancer, view and two-call-site wiring. Both §3.1 red-firsts were run and both fired: ★ **ROW 4 INVERTS AND THE ABLATION PROVES IT** — placing the `<figure>` OUTSIDE `.peekover-reader` (the direction four sibling suites assert for reader chrome) reds the containment assertion in Chromium AND Firefox, 4 failures, **while the golden diff stays EMPTY and the golden suite stays green (10/10)**, which is exactly why the assertion is written rather than transcribed; **ROWS 2+3** red-first by the ungate above reds the content-surface assertions in both engines while the app-page arm stays green. `diagramView.ts` and `mount.ts` were both restored FROM THE `cp` COPY, md5-identical, and **`mount.ts`'s diff is EMPTY** — 007 still touches it at zero sites. Coverage: 14 unit tests (`src/render/diagramEnhancer.test.ts`, real `mount()` output, not a hand-mocked tree) + 8 browser tests × 2 engines (`tests/browser/diagramRender.browser.test.ts`), including the two assertions jsdom structurally cannot make — the source `<pre>` computes `display:none` after the flip **while staying connected and still holding its source text** (both halves, with a visible-before control), and row 5's no-occlusion check against real paragraph rects at a wide viewport. Row 18's placeholder is `aria-hidden`. The untrusted-source rule is asserted with a payload that WOULD inject if assigned as markup (`<img src=x onerror=…>` plus a `</pre><script>` break-out): it round-trips through `textContent` byte-for-byte and materialises no `img` and no `script`, with a control proving the same string DOES produce an `<img>` when parsed into an inert `<template>`. One seam fact pinned rather than trimmed: markdown-it's fence text carries a TRAILING NEWLINE, so `diagramSourceOf` returns `source + '\n'` — 3.2 hands that to the engine as-is rather than this module silently editing the source it only reads. ★ **STILL OWED, UNCHANGED AND NOT ADDRESSED HERE: task 3.3's real-engine zero-network guard on D-6's measurement WINDOW.** 3.3 inherits this arc's harness lessons and should not re-derive them: the FIREFOX INERT-PARSE GOTCHA (`367d051` — parsing `@import url(X)` into any inert document CONSUMES the load for X and a later adoption is never retried, so a fetch control routed through a sanitizer reads NO-FETCH while the route is wide open; adopt markup no sanitizer has touched) and ADOPT-AND-WATCH-THE-WIRE (string-stripping is necessary, not sufficient — every lane must adopt into the LIVE document and observe requests, with a benign live control in the same stylesheet so "zero requests" is a result and not a dead probe). **TASK 3.2 IS DONE (this commit) — ★ THE MERMAID LAZY CHUNK EXISTS FOR THE FIRST TIME, AND THE CONTENT SCRIPT DID NOT MOVE ONE BYTE.** The enhancer's ASYNC body: the engine is loaded THROUGH `diagramEngine.loadDiagramEngine` (D-13's single `import('mermaid')`, no second one added), each fence is rendered into OUR OWN offscreen container (D-6 step 1 — removed on our own `finally`), the returned STRING goes through `sanitizeSvg` → a `<template>`'s innerHTML → adopt `tpl.content` (`mount.ts:131-133` verbatim), and `markDiagramRendered` flips D-15. **The container is LIVE, in-document AND IN THE LIGHT DOM by necessity** — measurement needs a browsing context, and the engine locates its own temp elements with document-scoped selectors that do not pierce a shadow root. Renders are SEQUENTIAL because the container is shared and mermaid empties it at the top of every call (`svgContainingElement.innerHTML = ''`, `mermaid.core.mjs:1263`). `bindFunctions` is never called. 3.1's duplicated `DIAGRAM_FENCE_SELECTOR` is COLLAPSED — the enhancer now re-exports diagramEngine's, so the drift the equality pin guarded is unrepresentable. Two supporting changes tasks.md §3.2 requires: `suppressErrorRendering: true` joins `DIAGRAM_ENGINE_CONFIG` (§3.8's "mermaid's own injected error graphic is suppressed" as CONFIGURATION — without it a parse failure draws the bomb into the container before throwing, `mermaid.core.mjs:1289,1308`; the key is already in the hardened `secure` list, so a `%%{init}%%` directive cannot turn it back on), and `markDiagramFailed` now REQUIRES a reason and inserts §4's inline marker (`p.peekover-diagram-error`, `textContent`) into the slot the removed placeholder vacated. ★ **THE HEADLINE BYTES.** The content script is **315,974 B and md5-IDENTICAL to 3.1's on BOTH engines** (Chromium `033879be…`, Firefox `1f15a58d…`) — the engine never reached the content-script graph and 3.1's `contentWatch.ts` fence (no `render` passed) held. `chunks/` went from **ONE file to ONE HUNDRED**: mermaid's lazy graph is **99 chunks / 3,347,306 B** behind exactly **one** `import(\`./mermaid.core-DLWca8Az.js\`)` (34,946 B entry), never statically inlined, and the app chunk carries NO static import of any sibling chunk. The app chunk itself moved **362,293 → 370,387 B (+8,094)**, decomposed to the byte by FOUR one-variable ablations with no unnamed residual: **4,096** the SVG sanitizer profile now reachable for the first time (`sanitizeSvg`→identity: 366,291) · **2,049** dynamic-import glue + the 99 chunk descriptors (`import('mermaid')`→rejecting stub: 368,338, and `chunks/` falls back to ONE file — the causal control) · **1,304** the enhancer's async body + statement realign · **373** §3.8's marker (`markDiagramFailed` reverted to its 2-arg form: 370,014) · **272** `diagramEngine`'s own payload, the D-6 config object with its hardened `secure` list and the fence gate (stubbed: 370,115). Sum = 8,094 exactly. **A ladder build confirms the direction: with 3.1's enhancer restored the app chunk is 362,293 B and the same chunk HASH — every one of these bytes is 3.2's.** Confirmed with a FIRING CONTROL rather than a bare grep: `securityLevel` and `suppressErrorRendering` read 2× each, `peekover-diagram-measure` 1×, `htmlLabels` 1× in the app chunk and **0× on the content script**, and mermaid's own `Syntax error in text` lives in `chunks/mermaid.core-…` and reads 0 on the content script — while `data-diagram` reads **1** there (3.1's CSS rule), which is what proves the content-script grep FIRES and the zeros are results. ★ **These are this task's ordinary `pnpm build` figures, NOT the production milestone figure — 8.1 owns the § Baselines re-measure and that table is UNCHANGED here.** ★ **THE FIRST REAL-ENGINE PROOF OF OPTION B, AND IT PASSES:** driven through the PRODUCTION path with nothing injected (`createReaderPane` → `select()` → `mount()` → `enhanceDiagrams` → the real `import('mermaid')`), the adopted `<style>` arrives **INERT AND STILL STYLING** — `@keyframes edge-animation-frame` and `dash` intact, `style.sheet.cssRules.length > 0`, every surviving `url(` a `#`-fragment, no `@import`, no `@font-face`, no `https?:`. `cleanSvgCss` had until now only met payloads we wrote for it. The adopted subtree carries no `foreignObject` and the source `<pre>` computes `display:none` while still holding its text. **§3.8's failure paths, each with a success control that HIDES the source on the SAME harness:** parse/render (a genuinely unparseable fence — the OTHER diagram in the document renders normally, the marker names it, and no empty figure is left: §4's "every other diagram… normally"), **sanitize rejection — the latest-moment case D-15 is shaped for** (the engine SUCCEEDED, asserted on its raw output, and the artifact then fails the profile: nothing survives, so there is nothing to adopt and the retained `<pre>` is simply still there), and engine-load (loader rejects; both fences visible, nothing stranded). ★ **SCOPE BOUNDARY, TAKEN FROM tasks.md RATHER THAN ASSUMED: §3.2's Verify names parse/render and sanitize rejection; ENGINE-LOAD is group 6's — its heading is "the two failures groups 3–5 cannot reach" and 6.1 owns the full proof** (no stranded placeholder, reader interactive, its own revert-and-fail). 3.2 ships the code path and a modest arm; it does not absorb 6.1. **REVERT-AND-FAIL, and it names the count in the defect's own units:** removing the per-fence catch reds 4 (2 tests × 2 engines) with *"enhancement never completed: 2 unrendered figure(s) and 2 fence(s) left pending, of 2 enhanced fences"* — one bad fence takes the whole document's enhancement down, which is exactly the claim the catch exists to make false; `diagramEnhancer.ts` restored FROM THE `cp` COPY, md5-identical (`508ead9a…`). The container's lifetime is asserted BOTH ways — observed PRESENT mid-render from the DOCUMENT (not from the argument we were handed) and absent afterwards, absent too when the render throws, with no engine temp element orphaned — because an empty tail is not an empty instrument. `bindFunctions` records 0 calls with a control proving the spy would have recorded one. Adoption-not-innerHTML is proven on REAL engine output with a `<script>`+`<img>` payload appended to it: neither materialises and `window.__peekoverAdoptLeak` stays undefined, while the same string in an inert `<template>` DOES produce both. D-12 parity holds on the RENDER path from both call sites. Coverage: **unit 631 → 643**, **browser 709 → 729 passed / 15 skipped** (10 new browser cases × 2 engines). One harness lesson banked for 3.3: the browser suite's `afterEach` now DRAINS in-flight renders, because the measuring container lives in `document.body` by necessity and a previous test's stray one reads as the next test's. `mount.ts` diff EMPTY (007 still touches it at zero sites), `sanitize.ts` and `contentWatch.ts` byte-identical, golden EMPTY, manifest 2,975 B, `permissions: []` both engines, tasks.md still 28 tasks / 9 groups. ★ **STILL OWED, AND NOW THE NEXT TASK: 3.3's real-engine zero-network guard on D-6's measurement WINDOW.** 3.2 opened that window for real — the container is live during every render — and closed none of it by construction; it inherits BOTH harness lessons above (the Firefox inert-parse gotcha and adopt-and-watch-the-wire) plus this task's: the window it must measure is the one `renderDiagrams` now owns, and the enhancer's injectable `loader` is the seam that lets a test wrap it.

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

### M7 (spec 007) — persona #1 completion via M7a (Mermaid + diagram cache) · IN IMPLEMENTATION, group 3

**Scope is SETTLED and all three gates are behind it** (see § Now). M7a is **Mermaid + a diagram
cache**; the rest of persona-#1 quality-of-life (compare-any-two-files, agent-file awareness, table
tools) is on spec §6's IS-NOT fence and is **not** in this milestone. The argument that selected it:
six milestones landed almost entirely inside persona #1's column,
[`spec-coverage.md`](spec-coverage.md) puts that column at **~56%**, and the largest remaining hole in
it is the one item that needs a dependency Peekover has never installed.

**Implementation runs task-by-task from `specs/007-mermaid-diagrams/tasks.md`, one commit per task,
this pointer advancing in that same commit.** Next: **3.3** — groups 1 (1.1 · 1.2 · 1.3) and 2 (2.1 ·
2.2) are complete, and the two D-1/D-6 ADDENDUM implementations that sit between them and group 3 —
the `secure` hardening (`3d7c8ed`) and the `<style>` CSS pass (`367d051`) — are both landed. Neither
is a numbered task, so neither advanced this pointer; `ff8f323`'s `<style>` blocker is CLOSED.
**GROUP 3 IS OPEN: tasks 3.1 (`1e09164`) and 3.2 (this commit) are DONE** — D-15's structure and
the synchronous prologue, then the async render body that loads the engine, sanitizes and adopts.
★ **The ~3.3 MB lazy chunk now EXISTS** (99 chunks / 3,347,306 B behind one `import()`), and the
content script is md5-IDENTICAL through it — the engine is on the app-page graph only. Task 3.3's
real-engine zero-network guard on D-6's measurement WINDOW is NEXT, and it inherits this arc's
harness lessons — see § Now.

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
from the 8/8 recorded at 9.1) · **007 Mermaid + diagram cache (M7a) — IN IMPLEMENTATION, group 3** ·
… full order in `docs/product/spec.md` §Phase-1.

## Blockers / open questions

- **NOTHING IS BLOCKED. M7's three Gear-3 gates have all run AND ARE ALL BANKED IN WRITING** (gate 1
  `e09520f`, gate 2 `cab93c7`, gate 3 in `decisions.md`'s M7 GATE 3 entry — banked at `66634fa`, closing
  the flag task 1.1 raised; `tasks.md`'s "DRAFT awaiting gate 3" status line stays by precedent). **The next
  human gate is 8.4**, the cache bound-values / typical-case-target decision gate, and it is a long way
  out — groups 1–7 land first. M6's gates are all closed and recorded (spec gate 1 2026-07-22, plan
  gate 2 + gate-3 product decisions 2026-07-23, D-8's bound-value gate at 7.2 2026-07-26, close gate 9.1
  2026-07-26), alongside M5's three (2.3, 5.2, 7.1). *(This bullet has been corrected four times for
  pointer inversion — at 8.2, at 9.1, at the archive pass, and again at 007 task 1.1. It is the single
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
*Current measured truth, **re-measured 2026-07-27 at HEAD `d470ab2`** by the post-M6 archive pass. This
section is MUTABLE — each milestone's close task overwrites the numbers and moves the previous ones into
the "vs" column. It lives here, not in decisions.md, because decisions.md is dated append-only and a
current-numbers table cannot be corrected there without either lying or duplicating.*
*Per-milestone historical pins, and the whole M6-close § Baselines verbatim, are in
[`progress-archive.md` § M6](progress-archive.md#m6--spec-006--snapshots--diff--closed-2026-07-27).*

**★ WHY THIS TABLE WAS RE-MEASURED RATHER THAN CARRIED FORWARD.** The previous table was written at task
8.1 and **B1 v2 and B2 then shipped production code without re-running it** — it was stale by two
commits while calling itself *"current measured truth"* (`retro.md` 2026-07-27, finding 3). **Every
number below is a harness run in this session, not a figure lifted from a commit body.**

| pin | now (2026-07-27, `d470ab2`) | vs 8.1's record | vs M5 close | bound | verdict |
|---|---|---|---|---|---|
| First paint, typical doc (50.4 KB) | **133.7 ms** (pass 2: **138.3 ms**) | 137.9 ms (**−4.2 ms**) | 138.6 ms (−4.9 ms) | **<165 ms GATE** | **PASS** |
| First paint, 1 MB / ~1400-entry TOC | **1188.5 ms** | 1185.2 ms (+3.3 ms) | 1183.8 ms (+4.7 ms) | <1.7 s (informational) | PASS |
| Content script (`content-scripts/peekover.js`) | **315,671 B** both engines | 315,144 B (**+527**) | 299,411 B (**+16,260, +5.43%**) | none — **stated, not gated** | — |
| App-page chunk (`chunks/app-CEHD9mSZ.js`) | **361,500 B** both engines | 360,423 B (**+1,077**) | 332,895 B (**+28,605, +8.59%**) | none — **stated, not gated** | — |
| Background (`background.js`) | **3,435 B** both engines | 3,435 B (—) | 3,315 B (+120, +3.62%) | none — **stated, not gated** | — |
| `pnpm zip` Chrome / Firefox | **349,744 / 349,803 B** | 349,165 / 349,223 (+579 / +580) | 335.89 / 335.95 kB | <2 MB | **PASS** |
| Suites | **549 unit** (46 files) · **629 passed / 15 skipped** browser, **76 file-instances**, both engines | 605 / 15 / 74 (**+24 cases, +2 files**) | 456 · 499/15/54 | — | green |

**★ READ THE "vs 8.1" COLUMN CORRECTLY: NONE OF IT IS NEW GROWTH.** The +527 / +1,077 / +579 / +580 /
+24-cases deltas are **B1 v2's and B2's**, shipped during the 9.1 recovery and never pinned. This pass
closes that gap; it did not cause it. **Nothing has touched the build since M6 closed** — verified, not
assumed: `git diff a6c7716..d470ab2` over `src/`, `entrypoints/`, `wxt.config.ts`, `package.json` and
`pnpm-lock.yaml` is **empty**, and the §6 side-quest's only code is two standalone `scripts/` tools that
are not in the build graph. **So these bytes are simultaneously the current pins and the true M6-close
pins**, which is why the archive's frozen M6 table carries the same values.

- **THE FIRST-PAINT GATE PASSES ON BOTH PASSES, AND THE FLOOR IS THE HEADLINE.** Pass 1 median
  **133.7 ms** (min 132.4, max 146.5); pass 2 median **138.3 ms** (min 132.1, max 182.2). **Floor across
  both passes: 132.1 ms** — against 8.1's quiesced floor of 133.0 ms (−0.9 ms) and M5-close's 132.0 ms
  (+0.1 ms). On the standing protocol that signal-vs-noise is decided on the FLOOR, **the floor is
  exactly where M5 left it: no regression, and none of 006's +16 KB reaches this path.**
- **ONE WARM ITERATION IN PASS 2 READ 182.2 ms, OVER THE GATE. Recorded, not hidden.** The gated number
  is the median and both medians pass with ~27 ms of headroom; that single max is the same working-day
  machine-state noise 8.1 documented at length (its own passes carried a 166.6 ms max). **The standing
  warning is NOT repealed:** a passing median on a busy machine is luck, not evidence, and any session
  touching the render path should quiesce before believing a number.
- **THE 1 MB FIXTURE IS THE DISCRIMINATOR AND IT CONFIRMS THE MACHINE WAS COMPARABLE.** 1188.5 ms against
  8.1's quiesced 1185.2 ms (+0.3%) — this session's machine is in the same state 8.1's re-runs were
  measured in, which is what licenses comparing the 50 KB numbers against 8.1's at all. The harness line
  still prints `-> FAIL` because it compares the 1 MB fixture against the *typical-doc* bar and
  self-labels the comparison informational (decisions.md 2026-07-14). Against its OWN <1.7 s bound: PASS.
- **Standing pins, all green this session:** `git diff tests/golden/output/` **EMPTY** ·
  `tests/manifest.test.ts` **2975 B, byte-unmodified since M2** (`3b6c575`), `permissions: []` on both
  built manifests · `pnpm lint` EXIT=0 · `vitest.config.ts` and `wxt.config.ts` unmodified.
- **`pnpm zip` emits a THIRD artifact that is NOT the bound:** the Firefox run also writes
  `peekover-0.0.0-sources.zip` (**4.29 MB**, was 3.93 MB at 8.1 — the §6 side-quest's two scripts and the
  `.github/` additions ride in the source archive). It is the archive AMO requires for review, not a
  shipped package. The <2 MB bound is on the extension zips.

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

**★ 007 TASK 1.3 — THE LAZY-CHUNK ABLATION (plan §7-1 RESOLVED). ABLATION / SCRATCH-WIRED FIGURES —
NOT THE PRODUCTION FIGURE, WHICH 8.1 OWNS. THE TABLE ABOVE IS UNCHANGED BY THIS NOTE**, and that is a
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

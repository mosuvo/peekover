# Progress — Peekover
*The file every session reads first. Keep the "Now" section honest.*
*Updated: 2026-07-16.*

## Now (start here)
**M2 FULLY CLOSED (spec 002 — active-source foundation): code-complete AND human-gated.** All six
groups landed and all automated acceptance is green (**lint · 318 unit · 136 in-browser · `pnpm zip`
314.49 kB Chrome / 314.55 kB Firefox < 2 MB**); `permissions:[]` survived (CI-pinned, both engines);
the M1 content script stayed byte-identical (270,879 B) — folder mode is a new *caller* of the
unchanged `mount()`, `src/render/*` untouched all milestone. **The named human milestone-close gate
(task 6.3) PASSED on 2026-07-15, both engines** — the one spec-002 acceptance an agent cannot
self-certify (see Done). Nothing on 002 is outstanding.

**Active: `specs/003-toc-navigation/` (TOC / navigation — product spec §11 build-order item 3) — IMPLEMENTATION underway.**
spec.md + plan.md + tasks.md all approved (Gear 3 gates 1–3). **Task 1.1 DONE:** `src/render/tocModel.ts` — pure
`buildTocModel(root): TocEntry[]` (h1–h6 refs in doc order, nearest-shallower-ancestor nesting, no synthetic nodes,
designed fallback labels, verbatim duplicates) + 9 jsdom unit tests green, lint clean. **Task 2.1 DONE:**
`src/render/tocView.ts` — `buildTocView(host, model, {contained})` builds the right-side `<nav aria-label="Table of
contents">` + nested `<ol>` of entry `<button>`s (disclosure `aria-expanded` collapse toggling subtree `hidden`;
`null` below 2 total headings; labels via `textContent`; each button carries its exact `entry.headingRef` in a
module-level `WeakMap` read via `tocHeadingRef` — the single ref 3.1 will scroll to; initial open/collapsed from a
pure `initialTocOpen(width)` rule reflected as `data-toc` on the host; `contained` threaded as a structural marker,
CSS deferred to 2.2) + 13 jsdom shape tests green, lint clean. **Task 2.2 DONE:** composed the rail through the ONE
`mount.ts` seam — `buildTocView(host, buildTocModel(root), {contained})` pushed into the SAME `children[]` (before
`root`, alongside the pills; omitted when it returns `null`), committed by the existing single `replaceChildren`;
`mountRawFallback`'s second `replaceChildren` left TOC-FREE (banner + raw `<pre>` only — never-blank #5). `readerCss.ts`
grew (ADDITIVELY, tokens only) the `.peekover-toc` rail/list/twist/active-`aria-current`/resizer rules + `--toc-w`
per-view width var + `scroll-margin-top` on `h1..h6`; `.peekover-toc` added to `CONTAINED_CSS`'s fixed→absolute list.
**Golden untouched: `git diff tests/golden/output/` EMPTY, huge-doc `sha256=8bc5094c…e61bbd` unchanged** (rail is a
sibling; `.peekover-reader` column byte-identical), `manifest` still `permissions:[]`. **Task 2.2 HARDENING (visibility
fixes, rail-only — readerCss.ts/tocView.ts/tocView.test.ts):** the rail now has a REACHABLE opener — a labeled,
focusable `.peekover-toc__toggle` handle that heads the nav, survives the collapsed state (which now hides only the
list body, not the whole rail — the ship-dark "collapsed = unreachable" defect) and flips the host `data-toc`
open⇄collapsed with matching `aria-expanded`; and the INITIAL state is fixed — no longer forced-collapsed by the
guaranteed-0 pre-commit/pre-layout width read (a documented default now, corrected to the real width-driven
`initialTocOpen` on the next rAF once layout exists; the pure rule itself unchanged). `pnpm test` 341 green (golden +
`permissions:[]` pins intact), lint clean, both builds succeed (content script 278.69 kB, info-only). Column + raw
fallback + mount() seam untouched. **Hardening #2 (rAF liveness guard, tocView.ts/tocView.test.ts only):** the
initial-state fix's deferred `requestAnimationFrame(decide)` now BAILS if `!host.isConnected || !opener.isConnected`
before writing — a stale frame firing after teardown / after a newer rail replaced this one no-ops instead of writing
data-toc/aria-expanded onto a dead node (the dead-node hazard 2.3's registry prunes, arriving early via the rAF
closure; the synchronous first decide is intentionally exempt). +1 non-vacuous lifecycle test (proven RED with the
guard removed: the post-teardown frame flips data-toc `collapsed`→`open`); `pnpm test` 342 green, golden + pins intact,
lint clean. **Task 2.3 DONE:** the backtick (`` ` ``) keyboard toggle + module-level host registry + de-register on
teardown (`tocView.ts` registry/shortcut · `mount.ts` register/unregister hooks · `tocView.test.ts` guards). ONE
document-level keydown listener mirroring `installToggleShortcut` EXACTLY (bare key, no Ctrl/Cmd/Alt, ignored in
input/textarea/select/contenteditable, `preventDefault` only after deciding to handle, idempotent install) — distinct
from readerMode's `\`, so the two never collide (each returns early on the other's key). Active-host resolution: a
`Set<HTMLElement>` mount() fills when a rail is composed (un-fills on a rail-less re-render AND the raw-fallback path);
the resolver PRUNES any `!host.isConnected` entry first, then returns the registered host containing
`document.activeElement`, else the last-registered live host — so the "last host" fallback can never resolve to a dead
node (same isConnected discipline as the rAF guard). **2.3 HARDENING (resolver requires a LIVE rail, not just a live
host — tocView.ts/tocView.test.ts only):** resolution now also requires the resolved host to CURRENTLY have a rail —
a `hasRail(host)` = `!!host.shadowRoot?.querySelector('button.peekover-toc__toggle')` (the exact node `toggleTocHost`
flips), applied to BOTH the activeElement match and the last-registered fallback; if no registered host has a live rail
the resolver returns `null` (clean pass-through). Closes a multi-host dead-key: a connected-but-rail-less host (its
shadow re-rendered without a rail) could win the fallback, and `toggleTocHost`'s `if (!opener) return` swallowed the
press silently even when ANOTHER registered host had a visible rail — so backtick did nothing. That `if (!opener)`
guard stays as belt-and-suspenders but no longer hides a mis-resolution. +1 non-vacuous multi-host test (host A with a
rail + host B connected-but-rail-less registered last, focus outside both → backtick toggles A, not a no-op on B);
proven RED with the rail-less filter removed (fallback returns B, `toggleTocHost` no-ops, A never toggles → assertion
fails). Toggle flips the resolved host's `data-toc` via the SAME
`setTocOpen` writer the opener uses (data-toc + opener aria-expanded in lockstep); no scroll/URL/history/network. +7
non-vacuous jsdom tests (backtick toggle + aria tracking; Ctrl/Cmd/Alt + editable-field guards; `\`↔backtick
no-collision both ways; two-host activeElement resolution; DEAD-NODE PRUNE proven RED with the prune removed — resolver
returns the dead host and writes to it; no-rail pass-through; idempotent-install single-flip; RAIL-LESS SKIP multi-host
resolution). `pnpm test` **350 green** (manifest `permissions:[]` + golden + huge-doc `sha256=8bc5094c…e61bbd` intact),
`pnpm test tocView tocModel` 32 green, golden diff EMPTY, lint clean, both builds succeed (mv3; content script 279.7 kB,
info-only). readerMode.ts /
sanitize.ts / parse.ts / manifest / readerCss.ts / tocModel.ts / golden fixtures untouched; raw-fallback path stays
TOC-free AND now un-registers. Added a dated `decisions.md` line (Firefox manual-gate loads must come from a FRESH
`wxt build -b firefox` → `.output/firefox-mv3` — a stale/dev load's `localhost` CSP warning is a procedure error, not a
code defect; task-2.2 gate lesson). **Task 3.1 DONE:** click/Enter on a TOC entry scrolls the reader to that entry's
heading via `entry.headingRef.scrollIntoView({block:'start'})` — NO `behavior` arg, so `:host{scroll-behavior}` (2.2)
governs and `scroll-margin-top` handles the chrome offset (no JS pixel math); the handler reads the target back through
`tocHeadingRef(link)` — the SAME WeakMap ref set at build time and guarded by 2.1's identity test, not a re-derived node
(2.1↔3.1 coupling) — and touches no `location`/`history` (URL-untouched, now a REAL guard). Guarded the call
(`typeof target.scrollIntoView === 'function'`) so a click handler never throws in layout-blind jsdom. Real-engine test
`tests/browser/tocScroll.browser.test.ts` (Cr+Fx, +8): observer-sanity control scroll → click-to-scroll on BOTH surfaces
(full-page `:host` scroll box AND contained `.peekover-app__reader` pane), NON-VACUOUS (two entries → further scroll +
prior heading pushed above top) + URL-untouched across every entry. **Red-first PROVEN both engines/both surfaces:**
wiring the handler to the wrong (first) heading left the clicked section ~8082 px below top → `topOffset<100` FAILED.
Both engines landed the heading via the CSS-governed `scrollIntoView` — NEITHER needed the JS `behavior` fallback (the
settle-based measurement is smooth/instant-agnostic; smooth-vs-instant is 3.3's scope). `pnpm test` **350 green** (golden
diff EMPTY, manifest `permissions:[]` + huge-doc `sha256=8bc5094c…e61bbd` intact), `pnpm test:browser` **144 green**
both engines, `pnpm test tocView tocModel` 32 green, lint clean, both builds succeed (content script 279.86 kB,
info-only). readerCss.ts/mount.ts/sanitize.ts/parse.ts/manifest/tocModel.ts/golden untouched. **Task 3.2 DONE:** scroll-spy —
ONE `IntersectionObserver` per rail marks the section being read with `aria-current="location"` + `.is-active`
(the 2.2 CSS hooks). Root is resolved PER SURFACE, not assumed `:host` (tasks.md 3.2's "root: host … :host in both"
predates 3.1's scroll-box discovery; the parenthetical "proven, not assumed" is honored by resolving the real
container): full-page → `:host` (fixed/inset:0/overflow:auto, always scrolls); contained → the nearest ancestor pane
that scrolls (`.peekover-app__reader`; `:host`'s own overflow:auto is the full-page rule and is skipped), resolved by
COMPUTED overflow (layout-timing-robust). rootMargin `0px 0px -70% 0px` (activation line 30% from the scrollport top);
active section DETERMINED from LIVE `getBoundingClientRect` per recompute (the observer + a rAF-coalesced scroll listener
are the TRIGGERS) — NOT from `isIntersecting` snapshots, which go stale on a fast scroll that jumps a heading clear
across the thin band (the first-cut `passed[]` design failed exactly there on both engines; fixed). TRAILING-SHORT-SECTION
edge handled: at scroll-bottom the final entry is promoted (the observer never fires at the absolute bottom), so the
highlight can reach the last section. Observer DISCONNECTED on teardown: `teardownScrollSpy(host)` at the top of every
`buildTocView` supersedes the prior rail's observer + scroll listener + pending frame; the raw-fallback path (which never
calls buildTocView) self-heals via an isConnected liveness check in recompute — same discipline as the rAF guard + host
registry; **mount.ts untouched** (tasks.md 3.2 scopes edits to tocView.ts + the browser test). Zero network (the observer
watches layout). `tests/browser/tocScroll.browser.test.ts` (+3, ×2 engines = +6): observer-sanity/NON-VACUOUS (two
different offsets → two different actives), track section 3 / top / bottom(=last, trailing edge), exactly-one-active, and
composes-with-3.1 (click-to-scroll → the mark lands on the clicked section). **Red-first PROVEN both engines:** pinning the
mark to entry 1 → section-3 assertion RED ("expected +0 to be 2"), and disabling the trailing-edge promotion → bottom RED
("expected 6 to be 7"). `pnpm test` **350 green** (golden diff EMPTY, manifest `permissions:[]` + huge-doc
`sha256=8bc5094c…e61bbd` intact), `pnpm test:browser` **150 green** both engines, `pnpm test tocView tocModel` 32 green
(jsdom-safe: the observer construction is guarded where IntersectionObserver is absent), lint clean, both builds succeed
(content script 281.55 kB, info-only). readerCss.ts/mount.ts/sanitize.ts/parse.ts/manifest/tocModel.ts/golden untouched.
**Task 3.3 DONE (TEST-ONLY — no production/`src` code):** reduced-motion proven in a real engine on BOTH Chromium +
Firefox. 3.1 already routes through `scrollIntoView({block:'start'})` with NO `behavior` arg, so readerCss.ts's
`:host{scroll-behavior:smooth}` (line 71) + `@media(prefers-reduced-motion:reduce){:host{scroll-behavior:auto}}`
(76–79, from 2.2) govern — and the test PROVES that existing CSS path already yields instant-under-reduce /
smooth-without on the full-page `:host` scroll box. **No JS fallback needed** (no engine ignored `:host scroll-behavior`
on `scrollIntoView`; 2.2's CSS is correct — untouched). New TEST-HARNESS capability (human-authorized, out of 3.3's
listed Files): a `browser.commands` entry `emulateReducedMotion` → Playwright `page.emulateMedia` in `vitest.config.ts`
— the ONLY cross-engine way to toggle the media query (vitest's in-page `page` API has no `emulateMedia`; `cdp()` is
Chromium-only). Test (`tocScroll.browser.test.ts`, +1×2 engines) samples scrollTop per animation frame right after a
TOC-click: reduce = at target on frame 1 AND never observed mid-flight; default = NOT landed on frame 1 AND observed
strictly mid-flight (0<s<target) — mutually-exclusive signatures, so vacuity is ruled out by construction; a `matchMedia`
sanity control confirms the emulation reaches the test iframe. **Red-first PROVEN both engines:** emulating
`no-preference` where the test expects `reduce` → the reduce-signature assertion FAILS (`expected 0 to be greater than
~20178`; a smooth scroll is still at 0 on frame 1). **CONTAINED-SURFACE FINDING (carried; out of 3.3 scope):** the
app-page pane scrolls `.peekover-app__reader` (light-DOM, app-shell CSS `appShell.ts:151` — `overflow:auto`, NO
`scroll-behavior`), and `scrollIntoView` resolves behavior from that scroll box, NOT the shadow `:host` — so contained
is INSTANT in BOTH modes (measured immediate===final under reduce AND no-preference, both engines). This is NOT engine
divergence and NOT a defect in 2.2's `:host` CSS (which correctly governs the full-page surface): the reduced-motion
a11y obligation (instant under reduce) HOLDS on contained trivially, while the smooth-without nicety is absent on the
app page. Delivering smooth-on-contained would touch app-shell CSS (`appShell.ts`) or take the JS fallback in the 3.1
handler — both out of 3.3's readerCss-focused scope and NOT triggered by the prompt's engine-divergence rule; flagged
for 6.1 / the plan §3-#2 ("CSS governs in both surfaces" — false for contained) revisit. A contained reduced-motion
assertion would be VACUOUS (both modes instant), so it is deliberately NOT in the committed suite. `pnpm test:browser`
**152 green** both engines, `pnpm test` **350 green** (golden diff EMPTY, manifest `permissions:[]` + huge-doc
`sha256=8bc5094c…e61bbd` intact), `pnpm test tocView tocModel` 32 green, lint clean, both builds succeed (content
script **281.55 kB — byte-identical to 3.2**, confirming no shipped-code change). Only changes: the browser test +
the `vitest.config.ts` harness command; `src/` (tocView.ts/readerCss.ts/mount.ts/…) untouched.
**Task 3.4 DONE (resize drag, real engine, both engines):** a pointer-draggable resize handle
(`.peekover-toc__resizer` — 2.2 shipped only its CSS; 3.4 BUILDS the element in `buildTocView` and
wires the drag, readerCss.ts UNTOUCHED, matching tasks.md 3.4's "resizer rule *if not in 2.2*"
conditional) rewrites the per-view `--toc-w` custom property on the host. Pointer events
(pointerdown/move/up/cancel) + `setPointerCapture` (guarded — it throws for a synthetic pointerId,
so wrapped in try/catch; never lets the handler throw); the rail is anchored to the viewport RIGHT
edge and the handle sits on its INNER (left) edge, so drag LEFT/outward WIDENS, RIGHT/inward
NARROWS (`width = startWidth − (clientX − startX)`). CLAMPED to `[TOC_MIN_WIDTH=180,
TOC_MAX_WIDTH=480]` px — DESIGN values (spec §3-#6 "document stays the hero"), exported so the test
asserts the exact bounds; the rail never collapses to nothing or eats the viewport. PER-VIEW ONLY,
NOT PERSISTED (spec 004 scope): the width is an inline style on the host; NO store.ts/idbCore.ts/idb
path touched (asserted on the contained surface with a spy store — resize adds zero store calls).
NO leak on teardown: ALL listeners live on the resizer element itself (never document/window), so a
rebuild's `replaceChildren` drops the old resizer + its listeners for GC (removing a captured
element also releases capture) + a `!resizer.isConnected` guard bails a drag caught mid-rebuild
(same isConnected discipline as the rAF guard / scroll-spy self-heal / host registry) — unlike the
scroll-spy, the resizer attaches to no PERSISTENT external node, so it needs no `teardownScrollSpy`
seam. No scroll/URL/history/network — one CSS var write. `tests/browser/tocScroll.browser.test.ts`
(+3, ×2 engines = +6): grow/shrink/zero-delta (non-vacuous — an unwired handle leaves every drag at
the default, so the direction assertions reduce to the zero-delta invariant and fail), clamp at
BOTH bounds, and per-view/no-storage on the contained surface. **Red-first PROVEN both engines:**
disabling the drag's `--toc-w` write → grow/contained FAIL `expected 250 to be greater than 250`
and clamp FAILS `expected 250 to be 480` (the property never moved) while the zero-delta invariant
still passes. `pnpm test:browser` **158 green** both engines (152 → +6), `pnpm test` **350 green**
(golden diff EMPTY, manifest `permissions:[]` + huge-doc `sha256=8bc5094c…de61bbd` intact),
`pnpm test tocView tocModel` 32 green (jsdom-safe: the pointer handlers only run on real events,
never dispatched in the shape tests; `getComputedStyle`/`setPointerCapture` live inside those
handlers), lint clean, both builds succeed (content script **282.43 kB**, info-only). readerCss.ts/
mount.ts/sanitize.ts/parse.ts/manifest/tocModel.ts/golden/store.ts/idbCore.ts untouched.
**GROUP 3 IS NOW CODE-COMPLETE** (3.1 click-scroll · 3.2 scroll-spy · 3.3 reduced-motion · 3.4
resize) → next = the batched group-3 human manual gate, then group 4 (zero-network guard). Pointer
advances per task (M1 retro rule).
**GROUP-3 GATE FIX (readerCss.ts only, CSS-string):** the first group-3 human gate found the
`.peekover-toc` rail was TRANSPARENT (the reading column's text bled THROUGH it) AND the centered
column reserved no room for the rail, so an opaque rail would then CLIP the column's right edge
(Firefox full-page confirmed; contained had the same latent defect). Fixed BOTH: (a) the rail now
has an opaque `background:var(--paper)` so it occludes anything behind it; (b) while OPEN the
reading column reserves exactly the rail's width — `:host([data-toc="open"]) .peekover-reader{
width:auto; margin-right:var(--toc-w)}` — so its right edge is pulled clear of the rail and never
underlaps it. Landed on the COLUMN-side `margin-right` (the prompt's recommended mechanism) after
a centered two-sided `min(76ch, 100%−2·--toc-w)` variant OVERSHOT the rail on a narrow scrollport:
the real vitest viewport is **414px** (contained pane just **146px**), where a two-sided
reservation drives the column to its 64px padding floor and, centered, overshoots the rail — a
single rail-width reservation instead lets the column take exactly the space left of the rail and
is correct at every width (the `width:auto` is REQUIRED: a bare margin-right on the base
`width:100%` column drives margin-left negative and shoves the column off-screen left). Reservation
scales with `--toc-w` (a 3.4 resize widens it) and is ZERO when collapsed (rule gated on
`data-toc="open"` → base `margin:0 auto` re-centers beside the handle, no phantom gutter).
Column-side ⇒ identical on BOTH surfaces (full-page fixed rail + contained absolute rail resolve
against the same `:host` right edge); CONTAINED_CSS UNTOUCHED. New real-engine test
(`tocScroll.browser.test.ts`, +2 ×2 engines = +4, now **166** browser green): on BOTH surfaces,
BOTH engines — the rail computes a NON-transparent `background-color` when open (occlusion), the
column's `getBoundingClientRect().right ≤ rail.left` while open (no underlap), and collapsing
RECLAIMS the space (column right edge widens back out — no phantom reservation). Measured
SYNCHRONOUSLY after each attribute write so the mount's one-shot `initialTocOpen` rAF (which at
414px would flip full-page to collapsed) can't clobber the forced `data-toc`. **Red-first PROVEN
both engines/both surfaces:** (a) reservation removed → column right (414 full-page / 390
contained) OVERLAPS rail left (257 / 325), no-underlap assertion FAILS; (b) `background` removed →
rail computes `rgba(0, 0, 0, 0)`, occlusion assertion FAILS. `pnpm test` **350 green** (golden diff
EMPTY — the fix is stylesheet-string CSS, not column HTML; manifest `permissions:[]` + huge-doc
digest intact), `pnpm test:browser` **162 green** both engines, `pnpm test tocView tocModel` 32
green, lint clean, both builds succeed (content script **284.74 kB**, info-only; the CSS strings +
load-bearing comments are the only growth — no shipped JS behavior change). Only file touched:
`src/theme/readerCss.ts` (READER_CSS) + the browser test. Group 3 code-complete AND gate-fix
applied → the human RE-RUNS the group-3 gate on this build before push.

**Product progress (rough):** M1 opens build-order phase 1-of-7 (product spec §11) — specifically its
core-render slice; themes-full, TOC, and onboarding from that same phase are still ahead. Spec-level
milestones are finer than the 7 phases (roadmap after 001: 002 sources · 003 TOC · 004 themes+settings ·
005 watch+diff · … ~a dozen to v1.0), so a precise product % is **deferred** — honestly this is early
foundation, ~first of ~12+ spec-milestones. Don't over-read the fraction.

## Done
- 2026-07-15 — **Task 6.3: human milestone-close gate PASSED, both engines — M2 FULLY CLOSED.** A human
  walked the full spec-002 checklist in **Chrome + Firefox on the current build, Network tab open**:
  toolbar action opens the app page (no console errors) · Chromium folder open (picker **and** drag)
  renders a tree contained in the folder pane and **drag-drop opens rather than navigating** · Firefox
  pick/drop renders the read-only snapshot + honest platform-limitation note · browse tree · search
  narrows by name · open files (unchanged reader) · pin · **reload → recents/pins persist → one-gesture
  reopen → exactly one disk re-prompt after reload → folder re-renders** · the **"Stored data"** panel
  shows remembered folders (name-only)/recents/pins + "contents never stored", and **wipe-all** clears
  hub + panel to "Nothing stored". Confirmed: **zero unexpected network throughout, no console errors,
  every degraded/empty state renders.** This is the single spec-002 acceptance an agent cannot
  self-certify — now met. It caught 3 real M2 defects the green stack missed across the milestone
  (containment · drag-navigation · storage-UI gap), so it stays load-bearing (retro 2026-07-15).
  **M2 (spec 002) is fully closed (code + human gate); next → spec 003 (TOC / navigation).**
- 2026-07-15 — **Task 6.2: folder-tree perf MEASURED (no threshold asserted — retro rule).**
  `scripts/perf-folder-tree.ts` (`pnpm perf:folder [--scale N]`) times the REAL production
  folder-mode hot path — the bounded markdown walk (`walkMarkdown`) + pure tree build
  (`buildTree`) + name filter (`filterTree`) — over a **realistic nested repo** (deep docs/
  guides tree + a mostly-non-markdown src/ tree + node_modules/.git skip-dirs), not a flat list.
  Machine: i7-13700, Windows, tsx/node; 7 iterations, cold run discarded, median of warm 6.
  - **scale 1 (mid-size project — 786 md files, 482 dirs, depth 10; 1773 total files, node_modules
    markdown correctly excluded):** walk **median 2.18 ms** (1.87–2.69), build **median 4.53 ms**
    (3.85–5.79), filter **median 0.12 ms**. truncated=false.
  - **scale 3 (monorepo — 304,122 markdown files EXIST everywhere; walk stops at the 5000-file
    cap, truncated=true, 2063 dirs):** walk **median ~8.5 ms**, build **median ~30 ms**, filter
    ~0.5 ms. The hard cap holds and stays fast even against a pathological tree.
  - **Finding:** the pure walk+build+filter — the "open my project" cost BEFORE any DOM — is
    CHEAP (~7 ms typical, ~40 ms at the hard cap). As the plan flagged, the suspect for the
    **carried-M1 chunked/virtualized-render lever** is `treeView` laying out one DOM node per
    file+dir (~1268 nodes at scale 1, ~7000 at the cap), NOT the pure build — compare M1's
    real-browser evidence (~750 ms to lay out ~1400 reader nodes). **NOT measured here** (Task-0
    automatability limit, no stub-as-proof): the real-browser treeView render/layout to first
    interactive tree + the disk reopen round-trip — the production app page has no
    headless-drivable folder-open seam (native picker). Those are confirmed qualitatively at the
    human gate (6.3); the chunked-render decision is **deferred to a real-browser render
    measurement** (a separate seam from the eager walk), now informed by the measured cheap half.
    **No acceptance threshold asserted** (M1 retro: no un-measured gate).
- 2026-07-15 — **Group-4 follow-up: wired the drag-and-drop folder target.** Investigation found
  the app page had NO drop wiring — `folderSourceFromDataTransfer`/`webkitGetAsEntry` existed and
  was unit-tested but unreachable from any UI path, so a dropped folder fell through to the
  browser's default navigate-to-folder action (the Firefox manual-gate screenshot). Fix: a drop
  target on the shell root (`dragenter`/`dragover`/`drop` all `preventDefault` — dragover so a drop
  fires, drop FIRST so the browser doesn't navigate). New seam `openFolderFromDrop` branches per
  capability: Chromium (`getAsFileSystemHandle` + picker supported) → LIVE handle (`persistable`,
  NOT downgraded to snapshot); Firefox → read-only Entries snapshot. Injected `dropToOutcome` dep;
  drop funnels through the SAME `applyOutcome` as the CTA (chip/tree/snapshot-note/never-blank —
  no duplication). Synchronous-extraction invariant preserved + commented (items only live during
  the drop event). Tests: +9 unit (routing in `folderSource.test.ts`, DOM wiring in
  `appShell.test.ts`), +5 real-engine (`tests/browser/folderDrop.browser.test.ts`, ×2 engines).
  **RED→GREEN (real Chromium + Firefox):** with the drop listeners disabled, the two wiring tests
  (dragover/drop `defaultPrevented`; full read→render) FAILED `expected false to be true` on BOTH
  engines (4 failed / 6 passed — the direct `openFolderFromDrop` routing tests still passed); with
  the listeners restored, 10/10 passed. NOTE: a synthetic `dispatchEvent` never triggers a real
  browser's default navigation in ANY engine, so "the browser really did not navigate" stays a
  human-gate item (manual note); the real engine proves the handler owns the real DragEvent + the
  real Entries/File.text()/mount path. Render path byte-identical (content script 270,879 B),
  `permissions:[]` pin green, lint + 285 unit + 122 browser green.
- 2026-07-14 — **M1 CLOSED (spec 001 — core render pipeline).** Extension skeleton + reader
  pipeline (detect → hide-raw → mount → parse → markdown-it/GFM → DOMPurify → shadow-DOM themed
  reading → Raw toggle → block-remote-media → never-blank fallback) shipping on Chrome + Firefox,
  `permissions:[]`, ~270 KB packed. All 7 acceptance criteria verified green with per-item evidence
  (manual GUI gate both engines + tests + measured perf + zip < 2 MB + PERMISSIONS.md complete);
  lint · 160 unit · 66 browser green. Retro captured (docs/ai/retro.md). Carried to M2: chunked/
  virtualized render (large-doc first-paint lever) + GFM table-alignment restore. Now → M2.
- 2026-07-14 — Fixed a pre-opt-in remote-image FETCH LEAK in the remote-resource policy
  (shipped in the commit below, caught at the human Network-tab gate, NOT by any test). Root
  cause: `mount()` built the reader root with `document.createElement('div')` + `root.innerHTML =
  html` — that div is owned by the live (browsing-context) document, so both Blink and Gecko
  dispatched the remote `<img>` fetches AT the innerHTML line, upstream of `applyMediaPolicy`, and
  synchronous removal can't cancel an in-flight request. The "detached node doesn't fetch"
  assumption was false; the safe property is an INERT document with no browsing context. Fix:
  parse the sanitized HTML into a `<template>` (`.content` is inert), run `applyMediaPolicy` on
  that fragment, then `root.append(tpl.content)` and commit as before — no fetch-capable node ever
  materializes in a fetching document pre-opt-in. **This class of bug (bytes-on-wire) is invisible
  to jsdom** (loads no subresources): the existing NO-LEAK + ORDERING tests stayed green through
  the whole leak because it fires upstream of the DOM-shape checkpoints they inspect. New guard in
  the browser project — `tests/browser/remoteMedia.browser.test.ts` asserts on the Resource Timing
  buffer in real Chromium + Firefox: zero image requests before opt-in, requests DO fire after Load
  (didn't over-correct). Proven RED-first (3 leaked requests both engines) → GREEN post-fix. jsdom
  guards kept but commented down to DOM-shape-only; load-bearing comments in mount.ts + mediaPolicy.ts
  corrected (inert document, not detached subtree). golden `images.html` byte-identical; 160 unit +
  66 browser green, lint clean; content 270.51 → 270.58 kB, zip 152.96 → 152.99 kB; image-free 1 MB
  perf flat (median ~1388 ms, within the noisy ~1187–1449 ms band). Standing rule recorded: remote-
  media/zero-network guards live in the browser project henceforth. See decisions.md 2026-07-14
  (correction of record). Manual re-check still owed by the human (Chrome + Firefox, Network tab).
- 2026-07-14 — Remote-resource policy (last M1 feature). Filled the `applyMediaPolicy` seam with
  the block-by-default policy (AGENTS.md #1 made visible + demoable). New modules:
  `src/render/mediaPolicy.ts` (classify/neutralize/restore) + `src/render/remoteMediaUi.ts` (opt-in
  pill + network indicator); styles in `readerCss.ts` (tokens only). Per `<img>`, classified by the
  scheme it RESOLVES to vs `document.baseURI`: http/https (incl. protocol-relative) → BLOCKED (URL →
  `data-peekover-src`, `<img>` → inert themed placeholder), `file:` on a file page → allowed +
  `loading="lazy"`, `data:`/`blob:` → inert. **The gotcha handled:** neutralization runs on the
  DETACHED reader root (no browsing context → no fetch) BEFORE `replaceChildren()` commits it live —
  a no-leak test commits the real pipeline to a live jsdom DOM and asserts zero fetchable src/srcset;
  proven non-vacuous RED-first (no-op the policy → 3 remote `IMG[src]` leak) then GREEN on restore.
  Opt-in is per PAGE-VIEW (`permissions:[]` = no storage → reload re-blocks): the "N remote images
  blocked · Load" pill restores real `<img loading="lazy">` and lights a persistent
  `data-network="active"` indicator that never shows otherwise. Raw view untouched. images.md golden
  regenerated through the full reader path (src → data-peekover-src + placeholder markup); huge-doc
  digest byte-identical (no images — verified). `pnpm perf` (default 1 MB) flat: (a) median 1242.5 ms,
  within the prior ~1187–1310 ms band (the image-free fixture is unaffected). 159 unit + 62 browser
  green, lint clean; content script 266.85 → 270.51 kB, zip 151.45 → 152.96 kB (well under budget).
  Manual Chrome+Firefox verification (devtools Network tab) is on the human checklist. See
  decisions.md 2026-07-14 (mechanics). tasks.md remote-resource task ticked.
- 2026-07-14 — Rescoped the first-paint gate from a size-sweep (measurement + docs only; ZERO
  `src/`+`entrypoints/` changes). The `<150 ms on the 1 MB fixture` line was written pre-measurement
  and is unreachable in the settled design (browser parse floor on a 1 MB `file://` doc + the
  complete-source-before-mount requirement + ~750 ms to lay out the reader's own ~1400-section DOM —
  see decisions.md 2026-07-14). Parameterized `pnpm perf` with `--size` (`pnpm perf -- --size 50kb`;
  default = the 1400-section 1 MB fixture, byte-identical to the golden digest — proven: golden suite
  green, `sha256=8bc5094c…e61bbd` unchanged). Swept sizes, same protocol (7 runs, cold discarded,
  median of warm 6, two invocations each; 1 MB re-confirmed twice). Machine: i7-13700, Windows,
  headless chromium via Playwright. **(a) navigationStart → reader painted:**

  | fixture (target → actual) | sections | inv 1 median | inv 2 median | <150 ms |
  |---|---|---|---|---|
  | 10 KB → 10.5 KB   | 13   | 81.6 ms   | 78.2 ms   | **PASS** |
  | 50 KB → 50.4 KB   | 62   | 117.8 ms  | 121.8 ms  | **PASS** |
  | 200 KB → 199.9 KB | 245  | 347.4 ms  | 344.8 ms  | FAIL |
  | 1 MB → 1.12 MB    | 1400 | 1310.3 ms | 1187.0 ms | FAIL (~8×) |

  ((b) responseEnd → paint tracked ~1–3 ms under (a) throughout; browser FCP is n/a for file:// text.)
  Gate rewritten (spec 001) as two-part and BOTH parts tick: (i) typical doc (≤50 KB) nav→paint median
  <150 ms — PASS; (ii) 1 MB: no raw-text flash (manual-verified both engines) + reader painted within an
  honest bound <1.7 s (~25–30% headroom over the ~1187–1310 ms median) — PASS. 200 KB (~345 ms) marks
  where a single-shot synchronous render starts to degrade, confirming ≤50 KB as the honest "typical"
  boundary. No threshold was softened to force a pass. Chunked/virtualized render deferred to M2 as the
  large-doc lever. No Now-pointer move — remote-resource policy is still next.
- 2026-07-14 — Fixed the Firefox mount-timing regression (caught by the human manual gate, NOT
  jsdom — it's an engine-timing class of bug the unit env can't see). Root cause: `runReader`
  mounted once at DOMContentLoaded and its `finally` revealed the raw text on EVERY outcome,
  including a "source wasn't ready yet" no-op. On Firefox the `file://` `<pre>` is still empty at
  DCL (readable only by `load`), so that no-op `reveal()` dropped the hide `<style>`, cleared the
  safety timer, and removed the `load` listener — the mount path was torn down and the user was
  stuck on raw text forever, silently. This also corrected the record: the prior session's
  "Firefox platform gap" was a misdiagnosis of this self-inflicted regression (remote and local
  `.md` both failed by the same mechanism; the localhost-workaround research was unnecessary).
  Fix shape: `mountReader` returns a commit boolean (`true` = committed, incl. degraded raw-fallback
  + idempotent re-entry; `false` = the no-source no-op); `runReader.tryMount(final)` attempts at DCL
  (not final → keep hide + backstops, wait) and again at `load` (final → reveal + one warn
  breadcrumb); the safety timer becomes a pure never-blank FLOOR that reveals raw without disarming
  the attempts (a late mount still wins). Test gap closed: a red-first regression test (empty body +
  `readyState=loading` → DCL no-op → seed `<pre>` + `load` → reader mounts, raw hidden) plus both
  timer directions. 139 unit + 62 browser green, lint clean, ~flat perf (a-median 1217 ms; Chromium
  still mounts at DCL). See decisions.md (the Gecko gotcha). No pointer move — next action unchanged.
- 2026-07-08..11 — Research, product spec (v2.1), full design system (design/), landing page
  (site/index.html), name verified+claimed (Peekover), this repo scaffolded.
- 2026-07-14 — Reader shell group (M1), all pushed:
  - 3.3 mount stage: parse→sanitize→shadow DOM, + hardening (restore the page if mount fails —
    never blank).
  - 4.1 design tokens, Literata bundled inline (zero-network), auto light/dark, 76ch column.
  - 4.2 Raw/Reading toggle (pill + bare `\` shortcut) + render-error banner.
  Net: the reader is end-to-end functional (Chrome + Firefox), `permissions:[]`, ~266KB packed,
  111 tests green.
- 2026-07-14 — 5.2 real-browser first-paint measured on the 1.12 MB huge-doc fixture (task 5.2).
  Local gate only (NOT in CI — wall-clock asserts flake on shared runners). `pnpm perf`
  (`scripts/perf-first-paint.ts`) drives the BUILT extension in headless Chromium via Playwright,
  7 iterations, cold run discarded. Metric: reader first-paint = `performance.now()` at the 2nd
  rAF after `<peekover-root>` first has populated open-shadow content (timeOrigin-relative).
  - **(a) navigationStart → reader painted: median ~1245 ms** (two runs: 1254.2 / 1236.6 ms;
    stable). **(b) responseEnd → reader painted: median ~1243 ms** (1252.0 / 1235.0 ms).
  - Machine: 13th Gen Intel Core i7-13700 (24 threads), Windows, dev machine, headless chromium
    via Playwright.
  - **GATE: FAIL vs <150 ms** (~8×). Acceptance box left UNTICKED. This is a measurement task —
    no src/ changes were made to chase the target; the orchestrator decides next steps.
  - Breakdown (why): the cost is NOT the pipeline. Per-run navigation marks show the browser's own
    raw-text render of the 1.12 MB file:// `<pre>` (`load` mark ~0.94–1.13 s) dominates, and the
    content script only runs at `runAt:'document_idle'` AFTER that; the reader's own parse→sanitize→
    mount adds ~200 ms on top. Pure parse+sanitize is well under budget (pipeline.perf.test.ts).
    Browser first-contentful-paint is not reported for file:// text here (printed as n/a).
  - Levers for a future optimization pass (out of scope for 5.2): earlier `runAt`, streaming/chunked
    mount, or not waiting on the browser's full raw-text layout before mounting.
- 2026-07-14 — document_start + hidden-raw first-paint pass (perf group follow-up to 5.2). Two of
  the 5.2 levers landed: the content script now runs at `runAt:'document_start'` and injects a
  `<style>` (under `<html>`, since `<head>`/`<body>` may not exist yet) that sets the raw `<pre>` to
  `display:none` BEFORE the browser can paint it, then mounts at DOMContentLoaded. Never-blank is
  preserved by detect-before-hide + a safety unhide (3s timer + window `load`) + a finally that drops
  the hide style on every mount outcome (`src/render/runReader.ts`). Re-measured with `pnpm perf`
  (same protocol: 7 runs, cold discarded, median of warm 6), same machine as 5.2 (i7-13700, Windows,
  headless chromium via Playwright), on the same 1.12 MB huge-doc fixture, TWO runs:
  - **(a) navigationStart → reader painted: run-1 median 1261.5 ms, run-2 median 1340.7 ms.**
    **(b) responseEnd → reader painted: run-1 median 1259.8 ms, run-2 median 1338.6 ms.**
  - **Before → after: (a) ~1245 ms → ~1261–1341 ms. FLAT — no improvement, within run-to-run noise.**
  - **GATE: still FAIL vs <150 ms (~8–9×). Acceptance box stays UNTICKED** (per plan: if it still
    fails, record honestly and stop — no further optimization in this group).
  - Why flat, verified (not assumed): a Playwright probe sampled the raw `<pre>` at 27 ms — well
    before mount (`readerMountedYet:false`) — and found the hide `<style>` present and the `<pre>`
    computing `display:none`. So the hide genuinely works in Chromium (the `<style>` under `<html>`
    IS honored) and the raw-text flash is gone. But per-run marks show DCL/mount now fire at
    ~470–590 ms (was after `load` ~1050 ms at `document_idle`), while first-paint still lands at
    ~1260–1340 ms — the ~750 ms gap is the browser laying out the reader's OWN ~1400-section rendered
    DOM. That cost, not the raw-`<pre>` layout we eliminated, now dominates first-paint on this
    fixture. Value delivered: the raw-text flash is eliminated for every doc size (qualitative win,
    manual-checked); the <150 ms number is unmoved.
  - Only remaining lever for the number is chunked/virtualized/deferred reader render (don't build
    the whole 1400-section DOM synchronously) — explicitly out of scope for this group.

## Up next
Immediate — **M3 kickoff (spec 003): TOC / navigation** (product spec §11 build-order item 3), now that
the 6.3 gate has passed and M2 is fully closed. Gear 3 in FRESH sessions per WORKFLOW.md 5.3: **draft
spec.md (this session, gate 1) → plan.md → tasks.md**, human approves each gate before any code.

Carried to M3 (measurement-driven / unrelated levers, do NOT guess):
- **Chunked/virtualized *tree* render** — the large-folder lever. 6.2 measured the pure walk+build as
  cheap (~7 ms typical); the suspect is `treeView` laying out one DOM node per file+dir. **Decide from
  a real-browser tree render measurement** (the deferred half of 6.2), not from a guessed bound.
- **Chunked/virtualized reader render** — the M1-carried large-*doc* first-paint lever (decisions.md
  2026-07-14). Same class, different surface.
- Restore GFM table alignment safely (map to class, never inline style) — unrelated to 002.

Roadmap: 003 TOC/navigation · 004 themes+settings · 005 watch mode + diff (the differentiator) · …
full order in docs/product/spec.md §Phase-1.

## Blockers / open questions
- **None open on M2.** The named human milestone-close gate (task 6.3) **PASSED 2026-07-15, both
  engines** — see Done. M2 (spec 002) is fully closed.
- Spec 003 (TOC / navigation) opens with its own open questions; those live in
  `specs/003-toc-navigation/spec.md` (§Open questions), not here, until plan time.

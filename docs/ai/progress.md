# Progress — Peekover
*The file every session reads first. Keep the "Now" section honest.*
*Updated: 2026-07-21.*

> **Closed-milestone narrative lives in [`progress-archive.md`](progress-archive.md).** This file is the
> working set: what is true today, what is next, what is carried, and the current numbers. If you want the
> step-by-step evidence behind a closed milestone, follow the link from its close summary below.

## Now (start here)

**M4 is CLOSED. M5 (spec 005) is IN IMPLEMENTATION: all three Gear-3 artifacts are APPROVED — spec.md
(gate 1), plan.md (gate 2), `specs/005-watch-diff/tasks.md` (gate 3). Group 1 (detection core) is
COMPLETE: **1.1 DONE** (`pollingDetector` — the seam + the polled implementation, content-compare) and
**1.2 DONE** (`observerDetector` + the dead-observation ladder, real-engine via OPFS). **Group 2 is
COMPLETE: 2.1 DONE** (the `WATCH_READ` contract + `createWatchListener` + URL validation), **2.2 DONE**
(the relay wired — background's THIRD listener, content-script `relayRead` → `pollingDetector`,
zero-network guard) and **2.3 DONE** (the human-run both-engines check; answers recorded, spec narrowed).
**GROUP 3 — re-render continuity, THE RISKIEST GROUP — is IN PROGRESS: 3.1 DONE**
(`resolveScrollContainer` extracted to `src/render/scrollContainer.ts` as a pure move; `tocScroll`
green unchanged) and **3.2 DONE** (`readingAnchor` — capture + the text → index → `scrollTop`
restore ladder, D-3) and **3.3 DONE — SHIPPED AS SPECIFIED, the sanctioned fallback was NOT needed**
(`MountOptions.preserveReading`, additive and defaulted-off; `mount.ts:151` now
`setReaderMode(host, carried?.mode ?? 'reading')`). **`mount()` is no longer read-only library** — the
boundary four milestones respected has been crossed, deliberately and with both directions proven red
first. **3.4 DONE — the TOC re-decide interaction is VERIFIED COVERED** (by two independent guards, not
one). **GROUP 3 IS COMPLETE. GROUP 4 — watch UX — IS IN PROGRESS: 4.1 DONE** (the watch pill, its
register-once registry seam, and `data-watch` on the host). The pill sits **bottom-left at 96px**,
third in the stack above the theme pill, chosen by a measured probe rather than taste — top-right
collides with the TOC handle, bottom-right sits inside the rail's live entry list. **The registry
SUBSUMED 2.2's holder** (`watchRelay`'s `registerWatchDetector`/`getWatchDetector` are now delegates
into `src/watch/watchRegistry.ts`, the D-E delegate precedent), so there is ONE piece of watch state,
not two. **4.2 DONE** (the controller — start/stop, the update signal, follow-at-bottom-only). **The spec
beat the mockup on follow**: the mockup scrolls unconditionally, spec §4 forbids moving a reader who
scrolled away, and reinstating the mockup's behaviour yanks the reader **~25,500 px** down the
document on both engines. **The update signal flashes the CONTROL, not the document** — 005 cannot
know which element changed without 006's diff, and a whole-column wash on every keystroke would be
the most intrusive option available. **The toast is SKIPPED and noted for 006** (no toast primitive
exists; the pill flash carries the same information). **4.3 DONE** (lifecycle — a gesture starts it, switching documents stops it, a dead read surfaces a
designed state) and **4.4 DONE** (the Firefox degraded state, on BOTH closed routes). **GROUP 4 IS
COMPLETE.** Discovered task **4.5 DONE** — the browser-suite flake is fixed (`fileParallelism: false`,
chosen over a narrower Firefox-only serial by measurement, 12/12 consecutive green; see the flake bullet
below). **4.6 (the Chrome file-URLs "wrong explanation" concern) is next.** **Next: GROUP 5 — measure then
tune** (5.1 measures observer latency + re-render cost; 5.2 is
a HUMAN decision gate for the debounce window; nothing in group 4 pre-empted it). Group 3 is where `mount()` stops
being the read-only library four milestones have treated it as. The content script builds a stopped
detector at `document_start`; nothing starts it, because watching is a user gesture on group 4's
control.**

- **THE FLAKE IS FIXED (task 4.5, 2026-07-21): `fileParallelism: false` on the `browser` project, and
  `pnpm test:browser` is deterministic again — 12/12 consecutive green, both engines.** The choice was
  measured, not guessed: global serial **62s** vs a narrower Firefox-instance-only serial **57s** (Vitest
  honours per-instance `fileParallelism`) — the ~5s saving did not justify the asymmetric config while the
  whole suite runs under a minute; parallel was 26s but ~40% flaky. NO assertion was weakened. The +36s is
  dev/CI wall-clock only (test runtime is not a shipped metric). **One env caveat:** Vitest's default
  browser API port (63315) can collide with a Windows reserved range (`EACCES`) — the fix is a local-only
  `browser.api.port` override, deliberately NOT committed (orthogonal to parallelism). Root-cause record
  retained below for provenance.
- **[SUPERSEDED by 4.5 above — kept for the root-cause trail] THE FLAKE IS IDENTIFIED, ROOT-CAUSED, AND
  GROUP 4 MADE IT WORSE (2026-07-20, task 4.4).** What was an unidentified 1-in-11 failure with no
  captured name is now understood. **Signature:** ALWAYS Firefox, ALWAYS the FULL-PAGE surface
  (`:host{position:fixed;inset:0}` — the scroll box is sized to the viewport), ALWAYS a scroll/geometry
  assertion, and ALWAYS a *plausible wrong position or no movement*, never an error
  (`expected 0 to be greater than 0`, `expected 8092.6 to be greater than 8092.6`,
  `expected 2816.4 to be less than 12`). Names captured: `tocScroll` "activating an entry scrolls its
  heading into view"; `watchAnchor` "resolves the EXACT element that scrolls" and "restores the SAME
  heading at the SAME offset"; `watchRemount` "keeps its PLACE when content is inserted ABOVE";
  `watchControl` "AT THE BOTTOM, appended content is FOLLOWED".
  **MECHANISM (measured): cross-file CONCURRENCY.** `--no-file-parallelism` → **3/3 green**; with
  parallelism → **~40% of runs fail**. Files share ONE browser window, so a viewport resize or plain
  contention lands under another file measuring viewport-sized scroll geometry.
  **GROUP 4 AGGRAVATED IT — stated plainly.** A git worktree at `5cf9be4` (pre-group-4, `wxt prepare`
  run) measured **5/5 green, 367 passed**; at group-4 HEAD ~40% fail. The suite grew 372 → 458 tests
  and 47 → 50 files. A partial mitigation inside the file fence (moving `watchControl`'s viewport
  resizing out of a global `beforeEach`, ~30 → ~6 resizes) helped only marginally — which is itself
  evidence that concurrency, not resizing alone, is the cause.
  **The fix is OUT OF group 4's file fence and is flagged as discovered task 4.5, not applied:** set
  `fileParallelism: false` on the browser project in `vitest.config.ts`, or isolate the full-page
  geometry suites. **Do NOT weaken any of those assertions** — each is a real, red-first-proven guard
  and the failure is the harness, not the code. **Until it is fixed, run `pnpm test:browser
  --no-file-parallelism` for a trustworthy result.**
- **SUPERSEDED — the original form of the watch item, kept for provenance:** During 3.3's verification a `pnpm test:browser` run reported `1 failed | 366 passed` and the
  failing test's NAME was not captured before the next run. **10 consecutive full runs since were green**
  (367 passed / 5 skipped, both engines), as were targeted re-runs of every group-3 suite. **Recorded as an
  open unknown rather than dismissed**, because this milestone's standing lesson is that the SHAPE of a
  flake matters more than its rate: the `remoteMedia` positive control flaked at a similar rate for two
  milestones before anyone established it was the instrument proving a non-vacuous zero-network assertion.
  **Do NOT assume it was benign, and do not assume it was in a group-3 file** — it is unidentified. If a
  full-suite failure recurs, CAPTURE THE TEST NAME FIRST (`| grep -E "^ FAIL"`) before re-running; a
  re-run that goes green destroys the only evidence.
- **INHERIT THIS BEFORE WRITING ANY GEOMETRY TEST — "the box overflows" is NOT the precondition;
  "the box has STOPPED REFLOWING" is** (measured at 3.2, 2026-07-20, both engines). The long-standing
  `waitForScrollable` helper returns as soon as `scrollHeight > clientHeight`, which is true while the
  reader is still restyling: on the full-page surface `scrollHeight` read **81798 px at first overflow
  and 26069 px once settled — a 3× reflow.** Any heading offset measured in that window is stale by
  tens of thousands of pixels, and the `scrollTop` write that follows **CLAMPS to the new maximum**,
  silently parking the test at the document bottom. It is not a flake — it made 3.2's anchor capture
  pick the LAST heading deterministically, on Chromium and Firefox. `watchAnchor.browser.test.ts` polls
  `scrollHeight` for stability instead; copy that, not the older helper. **Note the failure SHAPE: a
  clamped scroll produces a plausible wrong answer, never an error** — the same silent-wrong-answer
  class as 003's mis-resolved scroll root.
- **INHERIT THIS BEFORE PLANNING GROUP 4 — FIREFOX WATCH IS APP-PAGE-ONLY, measured at 2.3**
  (decisions.md 2026-07-19). A background `fetch("file:///…")` on **Firefox 152 THROWS**: a
  `moz-extension:` document *"may not load or link to `file:`"* — **Gecko's URI security policy, not a
  missing toggle**, and **no permission grants it**. Combined with task-0's finding that the content script
  cannot re-read its own file either, **both halves of the content-script route are closed on Firefox.**
  **Chromium is unaffected** (status 200, fresh bytes) and keeps its two-surface promise. Spec §3.5 was
  narrowed in the same commit (C12); §7-1 and §7-4 are marked RESOLVED; §4 Degradation now covers this
  surface. **Consequence for group 4: 4.4's precondition is SATISFIED and it took the negative branch — it
  ships the designed explanation for the Firefox content-script surface too**, not only the non-drag app
  page, and **not a dead control**.
- **§7-4 is also answered, and it validates the guards rather than changing them:** a `file://` read
  produces **`[]`** in `performance.getEntriesByType('resource')` on **both** engines. The existing
  `/^https?:/i` zero-network scoping is **correct, not merely convenient** — nothing to filter out.
  **Stated plainly so it is not over-read:** those guards prove watch put nothing on the wire and can
  **never** prove the local read happened. Detection tests own that, not the guards.

- **The `remoteMedia` positive-control flake is FIXED** (it had recurred — 1 failure in 10 captured runs,
  Firefox). It now AWAITS the Resource-Timing entries to a 5 s budget instead of sampling the buffer at one
  instant, and returns the buffer so a genuine failure still fails on the caller's own `toContain` with the
  real diff. **Evidence: 22/22 consecutive runs green, both engines**; a deliberate break (await a URL that
  is never fetched) goes red on both with the real message. The zero-check is untouched and stays a genuine
  zero-check — you cannot await something that should never arrive. **The other six guard files do NOT
  share the risk and were deliberately not touched:** their controls are `await fetch(probe)`, so the test
  awaits the fetch promise itself, whereas `remoteMedia`'s requests are engine-initiated `<img>` loads the
  test never awaited. That structural difference is why only that file ever flaked. If one of the six ever
  does flake, promote the awaited helper to a shared test util rather than patching in place.

- **One question the tasks draft ANSWERED by measurement rather than deferring it** (throwaway probe, run
  and deleted 2026-07-19): **the Chromium `FileSystemObserver` path IS real-engine testable in
  `tests/browser`, via OPFS.** `navigator.storage.getDirectory()` yields a real `FileSystemDirectoryHandle`
  with **no user gesture** and no loaded extension, and on **HeadlessChrome/149** `observe()` on an
  OPFS file handle is accepted and a write fires a genuine `["modified"]` record. **Firefox 151 has no
  `FileSystemObserver` at all** (OPFS itself works), so that suite feature-gates off on Firefox — honest,
  not a hole, since Firefox never takes the observer path in production either. **Residual limit, stated in
  task 1.2:** OPFS is not local disk, so this proves the *wiring* and the dead-record branches, not that
  Chromium's observer fires for a local-disk file rewritten by an external agent (task-0 established that;
  the human gate re-walks it).

- **M1 (001), M2 (002), M3 (003), M4 (004) are all fully closed** — code-complete, human-gated, retro'd.
  **Nothing on any of them is outstanding**, and no work of any kind on 001–004 remains to be started.
- **M5 — spec 005, watch mode** (the Phase-1 differentiator; roadmap in `docs/product/spec.md`
  §Phase-1). Done so far: the **task-0 feasibility probe** was built, run on both engines and both
  surfaces, and **torn down** (findings in `decisions.md` 2026-07-19, spec-005 task-0 probe);
  **`specs/005-watch-diff/spec.md` is APPROVED at gate 1**; and **`specs/005-watch-diff/plan.md` is
  APPROVED at gate 2** (both 2026-07-19).
- **THE MILESTONE WAS SPLIT AT THE PLAN GATE — inherit this, it changes what 005 is.**
  **005 = watch mode**, seven task groups (detection core · relay + Firefox verification · re-render
  continuity · watch UX · measure→tune · perf/pins/docs · human gate). **006 = snapshots + diff**, which
  gets its **own Gear-3 cycle** (spec-level WHAT already exists in 005's §3.3/§3.4 and its criteria
  marked *deferred to 006*). Two consequences worth knowing before planning anything: **005 adds NO
  dependency** (`dependencies` stays at three) and **005 stores NO file contents** — so
  PERMISSIONS.md's "file contents are never stored" claim **stays TRUE for all of 005**, and its
  correction lands in 006 alongside the code that forces it.
- **All three Gear-3 gates are PASSED** (spec → plan → tasks). Implementation is under way, task by task,
  each with its own commit, its own red-first evidence and its own pointer move. **The gates that remain
  are the ones budgeted INSIDE tasks.md and they are human work:** **2.3** (does a background
  `fetch("file://…")` work on Firefox at all — no harness can answer it, and it **blocks 4.4**), **5.2**
  (the debounce window, chosen from 5.1's numbers) and **7.1** (the milestone-close gate).
- **Three decisions were SETTLED at the plan gate (`plan.md` §0) — inherit them, do not re-litigate:**
  - **D-1 · SPLIT taken** — 005 ships watch (7 groups, 004's proven size); snapshots + diff become 006.
  - **D-2 · the `diff` dependency is APPROVED but DEFERRED to 006** — it would be the first
    `dependencies` addition since M1, so it is a governed act, and it is not this milestone's.
  - **D-3 · scroll continuity is ANCHOR-based, not `scrollTop`-based** — restoring pixels is right only
    when content is *appended*, and an agent rewriting a file inserts *above* the reading position
    constantly. Heading-anchor restore, `scrollTop` fallback; whether it *feels* right is human-gate-only.
- **Four scope decisions are SETTLED at gate 1 — inherit them, do not re-litigate:**
  1. **Scope is three of F6's six items** — auto-reload on change, watch mode, and diff vs. an earlier
     snapshot. The other three plus the MCP bridge are out, each with a recorded home (spec §6).
     **Since D-1, the first two are 005 and the third is 006** — the feature area is unchanged, the
     milestone boundary moved.
  2. **The engine split is MEASURED, not assumed:** Chromium detects **event-driven**
     (`FileSystemObserver`, no polling); Firefox detects by **polling** and **only via the drag route**,
     comparing **content** — `size`/`lastModified` are frozen at drop time.
  3. **Snapshots store FILE CONTENTS.** So `docs/trust/PERMISSIONS.md`'s "File contents are never
     stored" claim (three places) becomes false and **must be corrected in the same PR as the first code
     that stores a snapshot** — same weight as an AGENTS.md #4 event, though no manifest change.
     **That PR is now in 006, not 005** (D-1). Do not correct the claim early: in 005 it is still true.
  4. **§3.6 — a local-file read is NOT a network call (option A).** Watching does not light the network
     indicator; the zero-network guards stay **http(s)-scoped**. **Verify, do not assume** — spec §7-4.
- **The spec's eight §7 risks are RESOLVED to concrete positions in `plan.md` §3** — read that, not the
  spec's list. **The seven risks the plan still CARRIES into implementation are `plan.md` §4**; they are
  stated there and deliberately not restated here. The two worth knowing before opening any file: the
  plan **crosses the `mount()` boundary** four milestones have treated as read-only library, and the
  **relay is untestable end-to-end** in `tests/browser`, so its round trip is a budgeted human-gate item.
- **Before the first task of any group, re-read the standing rules that keep costing time when skipped:**
  `docs/ai/decisions.md` (the harness ledger, the dead ends, the gate procedure — all three promoted
  2026-07-19) and `docs/ai/retro.md` (newest entry first).

## Closed milestones

**M4 · spec 004 — themes + settings · CLOSED 2026-07-19.** Auto/light/dark with sepia deferred (D-1),
persisted in the existing IndexedDB with **`permissions: []` still intact** — no manifest permission was
spent — applied coherently across the app shell and **both** reader surfaces through one theme-host
registry, plus the 003 TOC rail's open-state and width carried over as a single global preference. Eight
groups: store foundation · `SettingsPort` + messaging seam · theme runtime + host registry · flash
MEASURE-then-mitigate · settings UI on both surfaces · TOC carry-over · re-measure + trust docs · the
human gate. The headline engineering result is a **negative** one, and it is the milestone's best work:
group 4 built the paint gate D-2 specified, measured it, found it breached the <150 ms budget on **every
cold typical-doc open** by a cost that was **insensitive to the deadline** (75 ms → 172.7 ms; 40 ms →
172.9 ms), and **deleted it** — shipping D-2's own recorded fallback (mount Auto + an instant re-theme).
The **8.1 milestone-close human gate PASSED**, both engines, both surfaces, fresh production builds,
Network tab open, **with no defects found** — the first milestone whose gate found nothing, which the
retro answers rather than celebrates (verdict: **discipline-dominant**; the boundary moved for
*coherence* via computed-token assertions and `emulateColorScheme`, **not** for *appearance* — contrast,
legibility and occlusion are exactly as gate-only as in M3, so **the gate stays load-bearing**). The gate
also discharged the three items groups 6–7 deferred into it (Firefox first paint · end-to-end TOC
carry-over through the real messaging→background→IndexedDB path · the narrow-viewport theme-pill
occlusion eyeball) — none of them is open. → narrative:
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

**The human-gate score: 6/6** — six milestone-shipping defects, **all** caught by the milestone-close
gate, across M1+M2+M3. **M4 contributed zero defects and zero misses**, so the ratio is unmoved; the
denominator did not grow because nothing shipped past the gate to move it. *A clean gate is evidence
about the BUILD, not about the GATE* (retro 2026-07-19).

**Product progress (rough):** M1 opened build-order phase 1-of-7 (product spec §11). Spec-level
milestones are finer than the 7 phases (roadmap after 001: 002 sources · 003 TOC · 004 themes+settings ·
005 watch · 006 snapshots+diff · … ~a dozen to v1.0), so a precise product % is **deferred** — honestly this is early
foundation, ~fourth of ~12+ spec-milestones. Don't over-read the fraction.

## Baselines / pins
*Current measured truth, as of the M4 close (7.1, 2026-07-19). This section is MUTABLE — each milestone's
close task overwrites the numbers and moves the previous ones into the "vs" column. It lives here, not in
decisions.md, because decisions.md is dated append-only and a current-numbers table cannot be corrected
there without either lying or duplicating.*

| pin | at M4 close | previous (003) | bound | verdict |
|---|---|---|---|---|
| First paint, typical doc (50.4 KB) | **137.7 ms** | 133.5 ms | <150 ms **GATE** | PASS |
| First paint, 1 MB / ~1400-entry TOC | **1248.6 ms** | 1196.3 ms | <1.7 s (informational) | PASS |
| Content script (`.output/chrome-mv3/`) | **288,654 B** | 284,744 B | none — **stated, not gated** | — |
| `pnpm zip` Chrome / Firefox | **327.61 / 327.66 kB** | 323.63 / 323.69 kB | <2 MB | PASS |
| Suites | 384 unit · 314 browser (both engines) | 350 · 166 | — | green |

- **HEADROOM IS THIN — the number to know before spending margin.** The typical-doc budget now sits
  **~7–12 ms from its ceiling** on this hardware (i7-13700, Windows, headless Chromium). A second
  independent 7-iteration pass read median 140.3 ms with a single warm iteration at **150.9 ms**, over the
  bar. Both medians PASS and the gate is on the median — but the next perf-touching session should know
  this before it assumes room.
- **The +4.2 ms since 003 is NOISE, not regression, and the spread is why:** the **floor did not move**
  (min 132.6 ms, *below* the 4.2-session min of 133.1 ms — real added cost raises the floor, noise raises
  only the middle), and the run-to-run median spread (2.6 ms) is the same magnitude as the delta.
- **Every first-paint number here is CHROMIUM.** `perf-first-paint.ts` cannot drive Firefox
  (decisions.md 2026-07-19, harness ledger). Firefox first paint is evidenced only by the human gate.
- **The 1 MB harness line prints `-> FAIL`** because it compares the 1 MB fixture against the *typical-doc*
  bar and self-labels the comparison informational. That is the known ~8× reading (decisions.md
  2026-07-14), **not** a breach. Do not read it as a regression.
- **Standing pins, all green at close:** `git diff tests/golden/output/` **EMPTY** · `tests/manifest.test.ts`
  **8/8 and byte-unchanged** since M2 (so `permissions: []` is re-proven by an unmodified test) · huge-doc
  `sha256=8bc5094c…e61bbd` intact · `pnpm lint` clean.
- **Measurement protocol (unchanged since M1 — keep it, so numbers stay comparable):** 7 iterations, run 1
  discarded as cold, **median of the warm 6**, min/max as spread. **No threshold is ever asserted from a
  measurement task** (standing M1 retro rule).
- **A pin certifies exactly the stage it observes.** "Golden diff EMPTY ⇒ the reading column is untouched"
  is **FALSE** — that suite snapshots `sanitize(parse(source))`, upstream of `mount()`, and stayed empty
  through the 5.1 chrome addition. Before citing a pin as evidence, break the property and check it goes
  red (retro 2026-07-19, finding 3).

## Up next

**Immediate: the HUMAN REVIEW of `specs/005-watch-diff/tasks.md` — Gear-3 gate 3.** The draft exists:
**seven groups per `plan.md` §6**, 20 tasks, red-first, each carrying its own Files + Verify line with the
golden/manifest pins and the two-surface `describe.each` rule baked in. **It is the last gate before
implementation code**, and nothing else is queued ahead of it. Two items inside it are themselves human
work and are budgeted up front rather than discovered late: **2.3** (does a background `fetch("file://…")`
work on Firefox at all — it needs a loaded extension, so no harness can answer it, and it **blocks 4.4**)
and **5.2** (the debounce window, chosen from 5.1's numbers, deliberately split from the measuring task).

**After 005 closes: spec 006 — snapshots + diff**, starting a fresh Gear-3 cycle at spec level. Its
inputs already exist: 005's §3.3/§3.4 and the criteria marked *deferred to 006*, plus `plan.md` §1.7
(the two-store IndexedDB split that dodges `idbCore`'s STOP signal), §1.8 (diff) and §3-5.

**Carried items — banked deliberately, each with a recorded home. Do NOT guess at any of them; every one
is either measurement-driven or explicitly deferred.**

- **Comment-only nit, to ride along with the NEXT `src/render/tocView.ts` touch.** `clampTocWidth`'s doc
  comment claims a non-finite input yields `TOC_MIN_WIDTH` "via Math.min/Math.max's NaN propagation being
  caught by the caller's guard". **The comment is wrong twice; the CODE is right.**
  `Math.max(180, Math.min(480, NaN))` is **`NaN`** — NaN propagates through both, it is not clamped by
  them — and the caller does not "catch" it: `applyStoredTocWidth` guards with `Number.isFinite` and
  **returns early**, so `clampTocWidth` is never called with a non-finite value at all. The guard is
  correct and load-bearing (without it the restore path writes the literal `"NaNpx"` and silently kills
  the `--toc-w` custom property). **Only the doc comment needs fixing** — describe the function as
  *partial* on non-finite input, guarded by the caller. No behaviour change, no test change.
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
  regression, so it stays carried rather than forced.
- **Restore GFM table alignment safely** (map to a class, never an inline style) — carried from M1;
  spec 003 §Out-of-scope leaves it to table work.

**Roadmap:** 003 TOC/navigation ✓ · 004 themes+settings ✓ · **005 watch mode** (the differentiator) ·
**006 snapshots + diff** · … full order in `docs/product/spec.md` §Phase-1.

## Blockers / open questions

- **No blockers, and nothing waiting on a human.** M1–M4 are all fully closed (code + the named human gate
  + retro). Nothing outstanding on any of them.
- **The gaps that 8.1 closed are closed as *findings*, but remain gaps in AUTOMATED coverage** — Firefox
  first paint, the real end-to-end settings/TOC round-trip through the background, and the cold-start theme
  flash. They were never known defects; the gate walked all three and found nothing. **But a future change
  touching those paths still has no test that can see it** — and per the harness ledger (decisions.md
  2026-07-19) there is **no roadmap to any**. Plan coverage accordingly; do not assume CI will catch a
  regression there.
- **OPEN QUESTION (an M2 finding, NOT an 004 defect — recorded so it is not lost). Dropping a single `.md`
  file onto the app page does nothing; only folders work.** Found by the human during the 8.1 session. 004
  touched no folder/drop code and this did not affect the gate result; it is **spec-002 / M2 territory**.
  **UNVERIFIED — do not assume either way.** The evidence points at folder-only **BY DESIGN**:
  `docs/trust/PERMISSIONS.md`'s ledger describes only folder drop/pick in all three of its rows; M2 is the
  "active-source foundation", where the FOLDER is the source; and the architecture is folder-shaped
  throughout (`FolderSource → MarkdownFile[]`, `folderId`-keyed recents/pins, remembered directory handles
  — a lone file has no `folderId` and no handle worth persisting). **But that is inference from surrounding
  artifacts, not verification.** **Two checks would settle it:** (1) does `docs/product/spec.md` state
  "open a single file from the app page" as a feature at all? If the product answer is "single files open
  via `file://` through the content script; the app page is the FOLDER surface", then folder-only is
  coherent by design. (2) does the drop handler bail **SILENTLY**? `getAsFileSystemHandle()` returns
  handles for files *and* directories, so the code very likely checks `kind === 'directory'` — the real
  question is whether the user gets **any** feedback. **Worth flagging regardless of the answer:** a
  reasonable gesture producing total silence is its own small **never-blank (#5)** gap. Even if
  single-file open is correctly out of scope, a line like *"Drop a folder — single files open directly
  from your file manager"* would close it cheaply. *Recorded only — not investigated, not fixed.*
- **Watch item (not a blocker): the `remoteMedia.browser.test.ts` positive control flaked once on Firefox**
  during 7.1 — *"DOES fire the requests after opt-in"* read `[]`. Green in isolation (4/4, both engines)
  and on full re-run (38/38 · 314/314), and 004 touches nothing in `mediaPolicy.ts`, so: a flake, not a
  regression. **The reason it is watched rather than shrugged off is the SHAPE:** the flaky half is the
  **positive control**, the thing whose job is to prove the zero-leak assertion is non-vacuous — had it
  flaked the other way, the non-negotiable zero-network count would have been certified by an empty
  buffer. **If it recurs, the fix is to AWAIT the request, not sample for it.** (retro 2026-07-19,
  finding 1.)
  - **IT HAS RECURRED — measured at 005 task 1.2, 2026-07-19, and it is the SAME half on the SAME engine.**
    **1 failure in 10 consecutive full `pnpm test:browser` runs** (Firefox; Chromium never failed):
    `AssertionError: expected [ Array(1) ] to include 'http://localhost:PORT/__peekover_pro…'` at
    `remoteMedia.browser.test.ts:115` — the opt-in positive control, the half asserting the request IS on
    the wire. Nothing in 005 touches `mediaPolicy.ts` or that suite, and group 1 wires nothing into the
    render path, so this is the pre-existing flake reproducing, **not** a regression. **The prescribed fix
    is now DUE and is no longer hypothetical:** `fetchedUrls(token)` SAMPLES the Resource-Timing buffer at
    one instant; it must AWAIT the request instead (poll to a deadline, as `waitFor` does elsewhere).
    Left unfixed here deliberately — it is outside group 1's file fence — and flagged for scheduling as its
    own task. **Why it outranks a normal flake: this is the instrument that proves the non-negotiable
    zero-network assertion is non-vacuous.** A sampling control that can read empty when the request DID
    fire can also read empty when it did NOT.

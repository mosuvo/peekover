# Progress archive — Peekover
*Closed-milestone narrative, moved out of `docs/ai/progress.md` on 2026-07-19 (M1–M4) and 2026-07-21
(M5), so that file could go back to being ~150–200 lines a session actually reads before starting work.*

**This is a READ-ON-DEMAND file. Nothing here is required to start a session.** `progress.md` carries a
one-paragraph close summary per milestone and links here for the detail. Come here when you need the
step-by-step evidence behind a closed milestone: what was measured, what was red-first proven, what a
task deliberately did NOT do and why.

**The durable facts were PROMOTED OUT BEFORE this text was moved** (commit *"promote durable 004 facts
ahead of the progress.md archive"*, 2026-07-19). If you are looking for something to act on rather than
something to understand, it is in one of these instead — check them first:
- **`docs/ai/decisions.md`** — the settled decisions, the disproved hypotheses / dead ends, the harness
  capability ledger, and the both-engines gate build+load procedure.
- **`docs/ai/retro.md`** — the lessons that change future behaviour, per milestone.
- **`docs/ai/progress.md` § Baselines / pins** — the current measured numbers and standing pins.

**Historical-record caveat, stated once and applying to everything below:** this text is preserved
**VERBATIM as it stood at each milestone's close**. It therefore contains statements that were true when
written and are not true now — most visibly, the M4 **and M5** group headings read *"IMPLEMENTATION IN
PROGRESS"* / *"GROUP N IS IN PROGRESS"* because they were advanced per-task during implementation and
never retitled at close. **M4 closed 2026-07-19; M5 closed 2026-07-21.** Nothing in this file should be
read as a statement about the present; `progress.md` is the only file that makes those.
**One M5 line is actively FALSE and is left verbatim rather than edited, per this same rule:** the
§ Baselines note claiming *"the content script registers 4.1's thin detector adapter and never
re-renders"* was true when written and was **fixed by task 4.8** — the content script now gets a real
`createWatchController`. The corrected statement is in `progress.md`.

---
## M5 · spec 005 — watch mode · CLOSED 2026-07-21
*Groups 1–7 plus five discovered tasks (4.5, 4.6, 4.7, 4.8, 5.1a). Code-complete, human-gated (7.1
PASSED, both engines, both surfaces — **one defect found, task 4.8**), retro at 7.2. **Verbatim narrative
as it stood at close**, moved here 2026-07-21 after the durable facts were promoted (commit*
*"promote durable 005 facts ahead of the progress.md archive").*

**Read the same caveat as everywhere else in this file: the group headings below say "GROUP N IS IN
PROGRESS" because they were advanced per-task during implementation and never retitled at close. M5
closed 2026-07-21.** The two `[SUPERSEDED]` flake bullets are kept deliberately — they are the
root-cause trail behind task 4.5's fix, and the milestone's own lesson is that the SHAPE of a flake
matters more than its rate.

**What was promoted out of the text below, so you do not have to mine it:**
- **`decisions.md` 2026-07-21** — the three instrument rules (geometry precondition · like-for-like A/B
  control · await-don't-sample), and the `fileParallelism: false` decision with its measured comparison.
- **`decisions.md` 2026-07-19/20/21** — Firefox watch is app-page-only · `file://` is invisible to
  Resource Timing · the WXT-entrypoint rule · the cost-proportional cooldown · the 5.1a confirmation ·
  the watch pill's discoverability decision.
- **`retro.md` 2026-07-21** — the nine M5 findings, including the *built-tested-and-wired-to-nothing*
  defect class and the `mount()`-boundary answer.
- **`progress.md` § Baselines / pins** — every measured number, which stays current rather than archived.

**M4 is CLOSED. M5 (spec 005) has PASSED ITS HUMAN GATE and its code work is closed: all three Gear-3
artifacts are APPROVED — spec.md
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
SUBSUMED 2.2's holder** (`watchRelay`'s `registerWatchDetector`/`getWatchDetector` became delegates
into `src/watch/watchRegistry.ts`, the D-E delegate precedent), so there is ONE piece of watch state,
not two. **Those two delegates were DELETED at 4.8** — the adapter they wrapped is the defect below. **4.2 DONE** (the controller — start/stop, the update signal, follow-at-bottom-only). **The spec
beat the mockup on follow**: the mockup scrolls unconditionally, spec §4 forbids moving a reader who
scrolled away, and reinstating the mockup's behaviour yanks the reader **~25,500 px** down the
document on both engines. **The update signal flashes the CONTROL, not the document** — 005 cannot
know which element changed without 006's diff, and a whole-column wash on every keystroke would be
the most intrusive option available. **The toast is SKIPPED and noted for 006** (no toast primitive
exists; the pill flash carries the same information). **4.3 DONE** (lifecycle — a gesture starts it, switching documents stops it, a dead read surfaces a
designed state) and **4.4 DONE** (the Firefox degraded state, on BOTH closed routes). **GROUP 4 IS
COMPLETE.** Two discovered tasks then closed: **4.5 DONE** — the browser-suite flake is fixed
(`fileParallelism: false`, measured over global-vs-narrower serial, 12/12 green; see the flake bullet
below), and **4.6 INVESTIGATED then RESCOPED + SHIPPED**: the original premise is FALSIFIED (Chrome's single "Allow
access to file URLs" toggle gates BOTH content-script injection on `file://` AND the background read, so a
running content script always has access — `isAllowedFileSchemeAccess` was NOT wired, an unreachable
branch), and the reachable analogue it surfaced is the **real defect and now ships**: the content script
offered a live-looking watch control on the REMOTE `http(s)` raw surfaces (raw.githubusercontent / gist /
gitlab-raw / bitbucket-raw), where the relay refuses every read — a dead control on a surface where spec §6
puts watch out of scope. `watchCapability` now gates the content-script decision on
`isWatchableFileUrl(location.href)` (the relay's own predicate, passed as a boolean to keep the pure
decision engine-free); a remote page gets a plain SCOPE note and **no detector at all**. `file://`
behaviour is byte-identical (Chromium control kept, Firefox note unchanged); the three notes are red-first
proven non-interchangeable (`decisions.md` 2026-07-21). **4.7 DONE — `observerDetector` was BUILT, TESTED,
MEASURED and WIRED INTO NOTHING, so spec §4's *"on Chromium, on the app page, detect changes WITHOUT
POLLING"* was FALSE in shipped code; it is now TRUE.** Discovered while preparing 5.2. The cause was
architectural rather than careless — `observe()` needs a `FileSystemHandle`, M2's seam hands out `read()` —
and the fix is that the Chromium walk **already held a handle and discarded the reference**: it is now
carried, optional and pass-through, `WalkFileNode → FoundFile → MarkdownFile`, and the new
`src/watch/detectorForFile.ts` branches on the **CAPABILITY** (`handle && observer`), never the engine, so
**Firefox reaches the polled fallback by ABSENCE and not one Firefox module changed**. The content script
still polls, correctly (URL only, no URL→handle API) — the 2×2 is made real, not collapsed. Verified by the
MECHANISM: the seam's `read()` count stays flat across a full poll interval while changes still arrive, with
the handle-withheld same-file case as its non-vacuity control; 1.2's dead-observation ladder and spec §7-7's
atomic-save fallback are now asserted **through the real wiring**. **A SECOND DEFECT was found by that
verification and fixed with it: the watch pill did not exist on the FIRST file opened in a session** (the
target was registered after the mount that decides whether to build a control) — invisible on both engines
until a second file was selected. **GROUP 5 IS IN PROGRESS: 5.1 DONE — both numbers are
MEASURED** (`scripts/perf-watch.ts`, `pnpm perf:watch`, not in CI; numbers in the § Baselines / pins block
below). **NO threshold asserted and NO debounce window chosen — 5.2 is untouched and is the human's.**
**5.2 DONE 2026-07-21 — THE HUMAN DECIDED: a COST-PROPORTIONAL COOLDOWN, not a fixed window.** After each
render, refuse the next until roughly as long as that render TOOK has elapsed **since it FINISHED**
(multiplier 1.0); changes inside the cooldown are **COALESCED, not queued** — one pending render, **newest
text wins**; the FIRST render after a start is immediate. ~50 ms at 50 KB (invisible), ~800 ms at 1 MB
(the main thread roughly half free instead of not at all). **Recorded in `docs/ai/decisions.md` BEFORE 5.3
wrote a line**, per 004's D-2 pattern. **5.3 DONE 2026-07-21 — SHIPPED, CONTROLLER-ONLY** (`mount()`, the
detectors and `WATCH_INTERVAL_MS` untouched). `renderNow()` times the synchronous block and sets
`readyAt = end + cost`; `onText` coalesces into ONE pending slot the newest change overwrites, on a timer
aimed at `readyAt` that is deliberately **not re-armed per change** (re-arming is a trailing debounce, which
starves). **The cost-scaling test is the one that proves what shipped** — a fixed 250 ms impostor fails it
`expected 250 to be less than 30`. **The switch-discards property has TWO independent guards** (stop AND
start both cancel), found the same way 3.4 and 4.1 found theirs: the single break stayed green, and only
breaking both exposed `"A: pending -> HOST B"` — 4.3's cross-feed bug one level up. **A flake in the new
browser test was fixed at its cause, not asserted around** (a macrotask-spaced stream measures the
harness's scheduler latency, not the coalescer — 4.5's shape); 3/3 full browser runs green after.
**GROUP 6 IS IN PROGRESS: 6.1 DONE 2026-07-21 — RE-MEASURED AT THE MILESTONE CLOSE, AND THE FIRST-PAINT
GATE HELD.** The milestone's standing perf risk (watch adding chrome to a path with ~7–12 ms of margin)
**did not materialise**: two independent 7-iteration passes read **138.6 ms** and **135.8 ms** against the
**<150 ms** budget, with **no warm iteration over the bar** — where the M4 close's own second pass had one
at 150.9 ms. **Called NOISE on the floor, per the M4 precedent:** the floor across both passes is
**132.0 ms**, at/below M4's recorded min of 132.6 ms, and real added cost raises the floor. Bytes grew and
are **STATED, not gated** (spec §5): content script **+10,757 B**, app chunk **+12,809 B**, background
**+878 B** (the third listener). **The app-chunk baseline did not exist and was measured rather than
guessed** — a throwaway worktree build of `70bb8ef` that reproduced the recorded content-script baseline
**to the byte**. `pnpm zip` **335.89 / 335.95 kB**, far under 2 MB. `perf:watch` re-run twice and did
**not** move — and the reason is recorded: that harness does not drive `watchController`, so it cannot see
5.3's cooldown at all. Full numbers + deltas in § Baselines / pins. **6.2 DONE 2026-07-21 —
`docs/trust/PERMISSIONS.md` now discloses the background's THIRD listener and carries a watch-relay row
in the capability ledger**, in the ledger's own honest framing: **no new manifest permission** (a content
script messaging its own background needs none; `permissions: []` re-proven on both built manifests by an
**unmodified** `manifest.test.ts`), but a real capability worth disclosing — what it can touch (**only**
`file://` markdown URLs matching the content script's own `matches`, refused **before** any read by
`isWatchableFileUrl`), when it fires (only while the user has switched watch on), and that it is
user-visible and stoppable in one click. **§3.6-A is now stated explicitly AND as MEASURED rather than
asserted:** a `file://` read leaves the Resource-Timing buffer **empty on both engines** (task 2.3), so
the http(s)-scoped zero-network guards are **correct, not conveniently scoped**. **The claim *"File
contents are never stored"* was left EXACTLY as it is — that is DELIBERATE, not an oversight:** it is
**true for all of 005** (D-1 — nothing here persists file contents; `DB_VERSION` is untouched at 2), and
its correction belongs to **006**, in the same PR as the first code that stores a snapshot. Correcting
it now would make the document wrong in the other direction. **GROUP 6 IS COMPLETE.**
**4.8 DONE 2026-07-21 — FOUND BY A HUMAN AT THE 7.1 GATE, with 005 believed code-complete and pushed:
watch on the content-script `file://` surface detected changes and rendered NOTHING.** The registered
target was 4.1's placeholder, whose `start(host)` ignored the host and called `detector.start(() => {})`
— an EMPTY callback. 4.1 wrote that it would be replaced at 4.2; **4.2 replaced it in `appShell.ts`
only**, and 4.6 later restated the same mechanism as evidence for a different argument without anyone
connecting it to *"so watch does nothing there"*. The human measured the relay working perfectly around
it: **200, 28623 bytes, 88 background fetches in ~90 s, zero re-renders. THIS IS THE THIRD INSTANCE OF
ONE CLASS IN 005** (`observerDetector` wired to nothing, the pill missing on the first file, this) and
they share one cause: **every watch test registers its own target before mounting**, so nothing ever
asked which target *production* registers — and `peekover.content.ts` cannot be loaded by any test at
all, because a WXT entrypoint imports the virtual `#imports` module. **So the fix is a RELOCATION:**
`src/watch/contentWatch.ts` (`installContentWatch`) now owns the whole decision-and-construction, the
entrypoint keeps only `location.href` / `browser.runtime.sendMessage` / `!import.meta.env.FIREFOX`, and
a real `createWatchController` goes into the slot — which also wires `onError`, so a file deleted while
watched here **stops and explains** instead of failing silently forever. The placeholder was **deleted**,
not kept as a delegate: dead code that looks live is what caused this. **The pin that generalises it**
(`contentWatch.test.ts`, verified red against the pre-4.8 tree): *every production
`registerWatchTarget(...)` call site builds its target with `createWatchController`.* One discovered task was
added below 5.1:
**5.1a**, the local-disk observer latency the harness provably cannot take, folded into 7.1 and explicitly
**non-blocking** for 5.2/5.3. Group 3 is where `mount()` stops
being the read-only library four milestones have treated it as. The content script builds a stopped
detector at `document_start`; nothing starts it, because watching is a user gesture on group 4's
control.**
**7.1 PASSED 2026-07-21 — BOTH ENGINES, BOTH SURFACES, FRESH PRODUCTION BUILDS, NETWORK TAB OPEN. ONE
FINDING, and it is a product judgement rather than a defect (the pill's discoverability — see the carried
items).** The relay round trip, **the single largest gap in the milestone**, now works on the `file://`
surface and was re-walked after 4.8's fix. The anchor (D-3) passed all three cases: **inserted-above**
lands on the same sentence; a **wholesale heading rewrite** (`sed -i 's/^## Section/## Chapter/'`) lands
in the same place via **the index fallback — the ladder's second rung, exercised on real disk for the
first time**; and that same command is an **atomic save**, which **the watch survived** — answering spec
§7-7's fragility concern on real disk rather than on OPFS. **Raw mode holds**, so 3.3's deliberate
`scrollTop`-only asymmetry is now eyeballed rather than assumed. **5.1a is TICKED — the OPFS inference is
CONFIRMED** (see § Baselines). The 5.3 cooldown passed a 20-append burst on the 1 MB file (**no freeze,
landed on `burst 20` — newest wins**) with its limit stated: the burst finished in under a second, so it
proved coalescing, not sustained pressure. **Firefox app-page watch works including 1 MB with no hitch —
the ONLY performance evidence Firefox's watch will ever have**, since both perf harnesses are
Chromium-only by construction. **The "Allow access to file URLs" OFF check confirms 4.6's reasoning by
observation:** the content script does not inject at all — no control, no note, no misdirection. Zero
network while watching; no console errors; a file deleted mid-watch **explains and keeps the last good
render**. **5.1a and all seven carried items are DISCHARGED.**

- **THE 5.1 NUMBERS, AND THE ONE THAT INVERTS THE OBVIOUS READING (2026-07-21).** Full table in
  § Baselines / pins. The headline for whoever walks into 5.2: **`preserveReading` roughly DOUBLES the
  synchronous block (16.8→34.9 ms at 50 KB; 360→717 ms at 1 MB) but adds ≈0 ms to the whole unresponsive
  window (start → 2nd rAF).** The anchor's `getBoundingClientRect` FORCES layout inside `mount()` that a
  plain mount pays one frame later anyway — so that delta is layout **MOVED, not ADDED**, and on this
  evidence **the anchor is not the lever; the render itself is.** Quoting "preserve − plain" as the anchor's
  cost would have been the wrong conclusion from a correct measurement, which is why the like-for-like
  to-2nd-rAF control exists.
- **THE 5127 ms IS RETIRED.** It was human reaction time (decisions.md said so at the time). Clean
  programmatic observer latency: **18.7 ms @ 50 KB · 109.5 ms @ 1 MB** — measured **on OPFS**, because no
  local-disk handle is obtainable without a native dialog Playwright cannot drive, so none was faked.
  **THE INFERENCE IS NOW CONFIRMED (task 5.1a, at the 7.1 gate): on local disk a small file updates
  instantly and 1 MB in a few milliseconds — the OPFS probe did NOT under-predict**, making this the
  counter-example to retro finding 2's ~13× precedent rather than another instance of it. Full detail and
  the stated limit of the confirmation are in § Baselines.
- **INHERIT THIS BEFORE WRITING ANY A/B PERF CONTROL — 5.1's control was VACUOUS TWICE before it measured
  anything, and both failures were silent.** (i) The first draft applied the same-size change to both the
  control and the measured mount, so the two documents had IDENTICAL geometry and the anchor had nothing to
  correct: **0 px drift on every cell**, a control that could never have gone positive (the same shape 3.3's
  red-first pass caught). Fix: both mounts render an identical byte/paragraph/heading count with the block
  merely **MOVED** — below for the control, above for the measured path. (ii) Drift read at the 2nd rAF
  reported **2738 px contained but 2 px full-page**, because `:host` is `scroll-behavior:smooth` and the
  write was still animating while the contained pane (`auto`) had landed. **A plausible wrong answer on
  exactly one surface, never an error** — this milestone's recurring failure class. Read geometry after a
  SETTLE, never on the timing frame.

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
- **THE FIRST-PAINT GATE HELD, and the margin did NOT shrink — this was the milestone's real perf risk and
  it did not materialise.** Watch added chrome to that path all milestone (4.1's pill, 4.3/4.4's note
  element, 4.7's wiring), and the entry warning was ~7–12 ms of headroom. **Two independent 7-iteration
  passes:** median **138.6 ms** (min 136.4, max 144.5) and median **135.8 ms** (min 132.0, max 137.6). The
  second pass reads **BELOW the M4 baseline**. **No warm iteration exceeded the bar in either pass** — max
  144.5 ms, against the M4 close's own second pass which had one warm iteration at **150.9 ms**.
- **VERDICT: NOISE, not regression — and the FLOOR is why, applying the M4 precedent rather than
  re-deriving it.** Real added cost raises the floor; noise moves only the middle. The floor across both
  passes is **132.0 ms**, at/below M4's recorded min of **132.6 ms**. The cross-pass median spread
  (**2.8 ms**) is the same magnitude as the +0.9 ms pass-1 delta and larger than it. **A +10.8 KB content
  script did not cost measurable first paint** — the bytes are parsed once at `document_start` while the
  gate's cost is dominated by parse+sanitize+layout of the document itself.
- **The 1 MB number IMPROVED by 64.8 ms and that is not claimed as an optimisation** — 005 did nothing to
  the first-paint path that would explain it, so it is read as the same run-to-run variation the typical-doc
  spread shows, drawn favourably. **A milestone that adds bytes does not get to book an unexplained speedup.**
- **THE BYTE DELTAS ARE STATED, NOT GATED** (spec §5 — no threshold was invented). +10,757 B on the content
  script and +12,809 B on the app chunk buy: the watch control + its registry, the `role="status"` note
  element, the change detectors, the controller with 5.3's cooldown, `detectorForFile`, `watchAvailability`
  and the relay client. The background's +878 B is the third listener (the watch relay) and nothing else.
- **THE APP-CHUNK BASELINE DID NOT EXIST AND WAS MEASURED, NOT ESTIMATED.** No prior milestone recorded the
  app-page chunk, so "+12,809 B" would have been unsupportable. It was obtained by rebuilding the M4-close
  commit (`70bb8ef`, 004 task 7.1) in a throwaway `git worktree` and reading the artifact. **The method
  validates itself:** that build reproduced the recorded content-script baseline **exactly — 288,654 B, to
  the byte** — so the app-chunk number comes off the same trusted build. The worktree was removed. *(This is
  where 4.7's `observerDetector`, `detectorForFile` and `watchController` first reach a shipped path, so the
  app chunk is the one that should have grown most, and it did.)*
- **RE-RUN AT 6.1 (twice), AFTER 5.3's COOLDOWN SHIPPED — THE NUMBERS DID NOT MOVE, and the reason matters
  more than the numbers.** `perf-watch.ts` **does not drive `watchController` at all** — it calls `mount()`
  and `observerDetector` directly (`watchController` appears in that file only inside a comment). **So this
  harness cannot see 5.3's cooldown, and a moved number here would have needed a different explanation than
  "the cooldown".** Two re-run passes against 5.1's table: shipped-sync 50 KB full-page **32.8 / 33.7** (5.1:
  34.9), 1 MB full-page **702.1 / 695.8** (5.1: 717.3), 1 MB contained **681.3 / 684.6** (5.1: 713.9);
  parse+sanitize **11.7 / 12.4** (5.1: 12.5). Every cell is at or slightly below 5.1's, with no systematic
  direction — **re-measurement noise on an unchanged code path**, which is exactly what it should be.
  **The `preserveReading` finding REPRODUCED**, which is the part worth re-confirming: continuity still
  roughly doubles the synchronous block while the whole start→2nd-rAF window moves **+24.1 ms full-page and
  −24.8 ms contained** — opposite signs, i.e. noise around zero. **Layout MOVED, not ADDED, twice measured.**
  Non-vacuity held per cell (2738 px vs 0 px).
- **The ONE cell that looked like it moved, and the spread that settles it: 1 MB observer latency.** 5.1 read
  **109.5 ms**; the 6.1 passes read **130.4** and **126.4 ms**, which invites a "+19%" story. It is **noise**:
  the second pass's own intra-run spread is **min 100.5 – max 132.7 ms**, a 32 ms band that *contains* 5.1's
  109.5. A 7-sample median over a 32 ms band is not stable to 20 ms. **50 KB latency is stable across all
  three passes — 18.7 / 19.3 / 18.3 ms** (spread 17.8–19.1), which is the control that makes the 1 MB
  band read as fixture-size variance rather than instrument drift. **Still OPFS-measured — but no longer
  an unconfirmed inference: 5.1a walked local disk at the 7.1 gate and the magnitude class held** (small
  file instant, 1 MB a few milliseconds; see the observer-latency bullets below).
- **The contained surface is the one the decision governs:** `watchController` (the only caller that ever
  sets `preserveReading`) is wired ONLY by `appShell.ts`. The content script registers 4.1's thin detector
  adapter and never re-renders (decisions.md 2026-07-21, 4.6 finding (2)).
**Immediate: the progress.md CONDENSE / ARCHIVE pass — 005 is closed and nothing on it is outstanding.**
Move 005's task-by-task narrative into `progress-archive.md` behind an M5 close summary (M1–M4 set the
format), leaving this file the working set it is meant to be. **Then 006's Gear-3 kickoff, in a fresh
session** (C14).

**7.2 IS DONE — the M5 retro is banked** (`docs/ai/retro.md`, newest-first): **nine findings, one
candidate cut on purpose**, and all three of `tasks.md` §7.2's questions answered from evidence.
**The headline is a NEW named defect class — BUILT, TESTED, AND WIRED TO NOTHING**, which hit **three
times** in 005 (4.7's unimported `observerDetector` · the pill absent on the first file opened · 4.8's
empty render callback) with **one cause: every watch test registers its own target before mounting, so no
test ever asked which target PRODUCTION registers.** Its rule and the WXT-entrypoint standing rule
(`#imports` means no Vitest project can load an entrypoint — logic there is untestable by construction)
are the parts 006 must carry. The other findings worth knowing before planning: **red-first is a COUNT and
a REASON, not a colour**; **"it's the harness" must be argued from an isolating variable, never asserted**;
**layout MOVED, not ADDED** (the like-for-like control that stopped 5.2 deciding from a wrong premise);
and **M4 retro finding 2 now has a known exception** (5.1a — the OPFS probe held).

**7.1 IS DONE AND ALL SEVEN CARRIED ITEMS ARE DISCHARGED** (the consolidated list that used to live here
— relay round trip · 5.1a · the anchor's *feel* under heading rewrites incl. 3.3's Raw asymmetry ·
Firefox first paint · Firefox's re-render cost · the degraded-state copy on all three surfaces · 4.6's
five-second toggle-off check). **Every one was walked; the results are in `tasks.md` §7.1**, and the two
that produced durable numbers or decisions are also in § Baselines (5.1a) and the carried items (the
pill's discoverability). **Nothing deferred into the gate is outstanding.**

**After 005 closes: spec 006 — snapshots + diff**, starting a fresh Gear-3 cycle at spec level. Its
inputs already exist: 005's §3.3/§3.4 and the criteria marked *deferred to 006*, plus `plan.md` §1.7
(the two-store IndexedDB split that dodges `idbCore`'s STOP signal), §1.8 (diff) and §3-5.
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

---


## M4 · spec 004 — themes + settings · CLOSED 2026-07-19
*Groups 1–8. Code-complete and human-gated (8.1 PASSED, both engines, both surfaces, no defects found);
retro at 8.2. Verbatim narrative as it stood at close.*

**Spec 004 (themes + settings) IMPLEMENTATION IN PROGRESS — group 1 (store foundation).** Spec/plan/tasks all
APPROVED (gate 1 + Gear-3 gate 2 + gate-3 tasks, 2026-07-17). Sepia DEFERRED (D-1 = A). Group-1 tracker (advance
PER TASK — M1 lesson):
- **1.1 DONE** — `DB_VERSION` 1→2 + additive `settings` store + `getSettings`/`putSettings` in `src/app/store.ts`
  (note: the store layer lives at `src/app/`, not the `src/store/` the tasks/plan text names — benign doc path
  drift, flagged). Real-engine proof `tests/browser/settingsStore.browser.test.ts` (Cr+Fx): round-trip+merge, and
  the v1→v2 additive upgrade PRESERVES folders/recents/pins + adds a working settings store (red-first verified —
  broke onupgradeneeded to drop+recreate → `expected [] to include 'seed-folder'` on BOTH engines → reverted →
  green). Golden EMPTY, `manifest.test.ts` green (`permissions: []`).
- **1.2 DONE** — idbCore `db.onversionchange` close-and-drop by construction (`src/app/idbCore.ts`). On open
  success every connection registers `db.onversionchange = () => { db.close(); onVersionChange?.(); }`; the memo-drop
  lives in `store.ts`'s `db()` (idbCore owns the close, the owner owns its memoization — same seam as
  `__resetConnectionForTest`, rationale in-code). Real-engine proof `tests/browser/idbVersionchange.browser.test.ts`
  (Cr+Fx): a held v1 connection steps aside so a competing v2 open PROCEEDS; a NEGATIVE CONTROL raw (non-stepping)
  v1 BLOCKS the same open (the difference the handler removes). Red-first verified — removed `db.close()` → the
  positive test threw `IndexedDB open blocked …v2` on BOTH engines → reverted → green. Golden EMPTY, 350 unit +
  `manifest.test.ts` green.
- **1.3 DONE** — `wipeAll` clears `settings`; `describeStored` reads the settings row, adds a plain-language line
  ("Theme / display settings — stored on-device, no file contents."), and counts it. Extracted the pure
  `buildStoredLines` helper so the string logic is jsdom-unit-testable (`src/app/store.test.ts`, +4 unit). Real-engine
  proof in `settingsStore.browser.test.ts` (Cr+Fx): describeStored surfaces the settings line, and after `wipeAll`
  `getSettings` falls back to the Auto DEFAULT + describeStored reads cleared. Red-first verified — removed the
  settings `clear` from `wipeAll` → `{theme:'dark'…}` survived vs the Auto default on BOTH engines → reverted →
  green. **Scope note:** `StoredSummary.settings` made OPTIONAL (not required) so the shell's designed
  `EMPTY_SUMMARY` literal in `appShell.ts` stays valid WITHOUT a cross-file edit (scope fence held — group 1 touched
  only `src/app/store.ts` + `src/app/idbCore.ts` + the two new tests + the new unit test).
- **GROUP 1 COMPLETE (1.1/1.2/1.3), NOT pushed** — awaiting human review of the evidence. Suites at group close:
  `pnpm test` **354 unit** · `pnpm test:browser` **176** both engines · golden diff **EMPTY** · `manifest.test.ts`
  green (`permissions: []`). NEXT after review → group 2 (SettingsPort + messaging seam). Do NOT start it yet.
  *Two review follow-ups banked in tasks.md: (a) `src/store/`→`src/app/` Files-path correction
  in tasks.md (tasks 1.1–1.3) and plan.md; (b) group-5 to-do to restore `StoredSummary.settings`
  to required + add `settings: null` to appShell's `EMPTY_SUMMARY`.*

**Group 2 (SettingsPort + messaging seam) IN PROGRESS — advance PER TASK.**
- **2.1 DONE** — new canonical `src/settings/settings.ts` owns the settings VOCABULARY: `Settings`
  + `ThemeSetting`/`EffectiveTheme`, `DEFAULT_SETTINGS`, the pure `resolveTheme(setting, osDark)`
  (auto→OS; manual ignores OS — incl. deferred `sepia`), and the `SettingsPort` interface.
  Dependency-free (no DOM/engine/store/`#imports`). `src/app/store.ts` now IMPORTS + RE-EXPORTS
  `Settings`/`DEFAULT_SETTINGS` (keeps only the persistence-shaped `SettingsRecord`/`SETTINGS_ID`),
  so existing callers importing from the store are unchanged. jsdom-unit proof
  `src/settings/settings.test.ts` (+4): the full setting×OS matrix + the default shape. `pnpm lint`
  clean, `pnpm test` **358 unit**; golden diff **EMPTY**, `manifest.test.ts` green (`permissions: []`).
- **2.2 DONE** — `src/settings/settingsPort.ts` is the surface-agnostic messaging SEAM: the wire
  contract (`GET_SETTINGS`/`SET_SETTINGS` named once), both client ports (`directPort(store)` for
  extension-origin, `messagingPort(send)` for content scripts), AND the background handler builder
  (`createSettingsListener` / pure `handleSettingsMessage`) — all deps INJECTED, no `#imports`/DOM/
  store import. Every port: sync cached `snapshot()` (starts at DEFAULT, never throws) · `load()`
  bounded by `LOAD_TIMEOUT_MS` (**1500 ms** provisional — 4.1 re-tunes from measurement, NOT an
  asserted threshold; chosen < runReader's 3 s never-blank floor, > a cold MV3 SW spin-up + one IDB
  read) resolving to DEFAULT on timeout/failure · `save(patch)` updates cache immediately then
  best-effort persists. jsdom-unit proof `settingsPort.test.ts` (+9) with fake store/messenger:
  round-trip both ports, snapshot-default-before-load, coerce garbled response, save best-effort.
  **RED-FIRST verified** — neutered `withTimeout` to `return promise`: the two THROWING tests
  rejected ("promise rejected … instead of resolving") and the two HANGING tests timed out
  ("Test timed out in 2500ms") → reverted → 9/9 green. `pnpm lint` clean, `pnpm test` **367 unit**;
  golden diff **EMPTY**, `manifest.test.ts` green.
- **2.3 DONE** — `entrypoints/background.ts` gains the SECOND listener:
  `browser.runtime.onMessage.addListener(createSettingsListener({ getSettings, putSettings }))`,
  answering `getSettings`/`setSettings` against store.ts (the background's OWN memoized idbCore
  connection — first non-page consumer, correct across an update via 1.2's versionchange handler),
  action listener intact. **Async-response contract:** WXT's `browser` is the NATIVE
  `chrome.*`/`browser.*` namespace (verified — `@wxt-dev/browser`: `globalThis.browser?.runtime?.id
  ? browser : chrome`), NOT the webextension-polyfill. Native Chrome IGNORES a Promise returned
  from an onMessage listener, so the handler uses **`return true` + async `sendResponse`** (the
  common denominator — Chrome requires it, Firefox honors it); a non-settings message returns
  `false` (declines, no dangling channel). `entrypoints/peekover.content.ts` builds the
  `messagingPort(msg => browser.runtime.sendMessage(msg))` and warms it via `void load()` at
  document_start — **WIRING ONLY**, deliberately NOT threaded into runReader/mount (consuming
  `snapshot()` for first-paint theming + reveal-gating is 4.1/4.2; that touches `src/render/`, a
  fenced later group). Real-engine proof `tests/browser/settingsPort.browser.test.ts` (Cr+Fx, +5
  tests → +10): DIRECT port persists + reads back through the real IndexedDB; MESSAGING port
  round-trips through the SAME `createSettingsListener` + real store (SET read back by BOTH ports —
  one DB behind both); zero-network (Resource-Timing) across save+load both ports + wipe,
  **non-vacuous** (a control fetch registers); RED-FIRST misrouted type → handler declines →
  DEFAULT (asserted ≠ the saved value). RED also proven at source: breaking `GET_SETTINGS` routing
  failed all messaging round-trips on BOTH engines ("expected {theme:'auto'…} to deeply equal
  {theme:'light'…}") → reverted → 10/10 green.
  - **HARNESS LIMITATION (flagged for human gate 8.1):** the Vitest browser-playwright project
    loads NO unpacked extension — no background SW, no content-script injection, `browser.runtime`
    has no receiving end. So the TRUE content→background `runtime.sendMessage` transport is NOT
    exercised; the loopback proves handler + listener response-contract + both ports + the real
    engine's IndexedDB compose, but NOT the message bus itself. The end-to-end path (content-script
    reader → pick theme → reload → persists, Network tab open) is the named 8.1 human-gate item.
  - **PERMISSIONS.md now STALE** ("background = exactly one listener / no other logic"): the update
    is task 7.2 (same-session-as-code discipline lands at group close), NOT edited now. Built
    manifest re-proven `permissions: []` (content→own-background messaging needs no permission).
    Content-script **285,507 B** vs the 284,744 B baseline = **+763 B (+0.27%)** from the
    messagingPort import (formal re-measure is task 7.1).
- **GROUP 2 COMPLETE (2.1/2.2/2.3), NOT pushed** — 3 commits ahead, awaiting human review. Suites at
  group close: `pnpm test` **367 unit** · `pnpm test:browser` **186** both engines · golden diff
  **EMPTY** · `manifest.test.ts` green (`permissions: []`). Group 2 reviewed + **PUSHED**.

**Group 3 (theme runtime + host registry) IN PROGRESS — advance PER TASK.**
- **3.1 DONE** — new `src/theme/themeRegistry.ts`: a module-level `Set<HTMLElement>` of themed hosts +
  `registerThemeHost`/`unregisterThemeHost` + `applyTheme(effective)` broadcast, with an
  `isConnected` **PRUNE before every broadcast** (verbatim mirror of tocView's `tocHosts` — the
  by-construction liveness guard, retro 5×-recurrence rule; deleting during Set iteration is safe).
  Takes an `EffectiveTheme` (never a setting) — `auto` is resolved by the caller, so nothing
  downstream knows about the OS. **OWN module, not inside reader.ts** (tasks.md 3.1 names that path;
  it also lets `appShell.ts` import the registry WITHOUT dragging `READER_CSS` + the font loader
  into the shell bundle). jsdom-unit proof `src/theme/themeRegistry.test.ts` (+4): broadcast reaches
  a `peekover-root` AND a plain div (the tag-name query would have missed the shell root — the §3.4
  bug), register-twice is idempotent, unregister stops writes, and the prune. **RED-FIRST verified** —
  disabled the prune → the DETACHED node received the next write (`expected 'light' to be 'dark'`)
  → restored → 4/4 green. `pnpm lint` clean, `pnpm test` **371 unit**; golden diff **EMPTY**,
  `manifest.test.ts` green. Doc drift fixed in the same commit: tasks.md 3.3/5.2 + plan.md §2 said
  `src/ui/appShell.ts`; the real file is `src/app/appShell.ts` (same class as the group-1
  `src/store/`→`src/app/` fix — paths only, no checkbox/text change).
- **3.2 DONE** — `src/theme/reader.ts` rewritten: the OS-flip listener's
  `querySelectorAll('peekover-root')` broadcast is replaced by the 3.1 registry, and the theme is now
  the SETTING resolved against the OS (`resolveTheme`) rather than the OS alone. Module-level
  `currentSetting` (default `auto`) + the single writer `setThemeSetting()`, which re-resolves and
  broadcasts; the OS listener re-resolves **only under `auto`** (manual pins the theme), reading the
  setting at EVENT time. **No port/store import** — groups 4/5 call the setter (plan-gate decision).
  `initReaderRuntime(host)` **call-compatible (signature unchanged)** → `src/render/mount.ts`
  UNTOUCHED. M1 degradation kept (absent `matchMedia` → no-op, defaults light, never throws).
  +4 jsdom unit in `reader.test.ts` (375 total).
  - **OS-SCHEME EMULATION: AVAILABLE.** Added an `emulateColorScheme` browser command to
    `vitest.config.ts` (Playwright `page.emulateMedia({colorScheme})`) — the exact seam 003 already
    used for `emulateReducedMotion`. **Verified working in BOTH Chromium and Firefox:** `matches`
    flips, a real `change` event fires, and CSS media rules re-evaluate. So the §3.4 staleness
    property is proven against a GENUINE emulated OS flip, not a signal injected at the seam.
  - Real-engine proof `tests/browser/themeRuntime.browser.test.ts` (Cr+Fx, +6 →198 browser): a
    harness-sanity test (flip is genuinely observed — the non-vacuous guard), CONTAINED app-page
    reader re-themes under Auto, full-page reader re-themes (no M1 regression), two hosts from one
    flip, manual ignores the flip, and auto resumes. **TWO RED-FIRSTS, both engines, both clean:**
    (a) restoring the M1 `querySelectorAll` broadcast → the two CONTAINED-host tests fail
    (`expected 'light' to be 'dark'`) — the stale-host bug, isolated; (b) removing the auto-only
    guard → both manual tests fail (`expected 'dark' to be 'light'`) — the gate proven non-vacuous
    (it had passed vacuously under red (a), since M1 never reached a `<div>` at all).
  - **HARNESS QUIRKS DIAGNOSED (not papered over).** Two real flakes were found and root-caused with
    instrumentation rather than sleeps: (i) `matches` and the `change` event are NOT simultaneous
    (Chromium dispatches `change` later), and the control listener lives on a DIFFERENT
    MediaQueryList than the runtime's, whose notification order is unspecified → positive
    assertions now poll the OBSERVABLE OUTCOME (`waitForTheme`), negative ones wait for proven event
    delivery; (ii) a listener installed in one test stops receiving emulated flips in LATER tests →
    new test-only seam `resetThemeWatchForTest()` re-installs per test (same family as
    `__resetConnectionForTest`).
  - **QUIRK (ii) RE-EXAMINED AND RE-SCOPED (follow-up, 2026-07-18).** The original note read as
    "an MQL goes silent after its first flip", which would have implied a REAL product defect: since
    `watchColorScheme()` guards on `let watching = false`, production installs ONE listener per page
    and a user toggling their OS theme twice would see the reader update once then go stale. That
    reading is **WRONG**, and the seam is **TEST ISOLATION, not a workaround for a product
    limitation**. New standing guard `theme runtime — ONE listener, MANY flips` flips the emulated OS
    **twice within a single test against a single install** (no mid-test reset) and requires BOTH to
    land: **GREEN on Chromium AND Firefox**. **Non-vacuous** — mutating the handler to remove itself
    after one fire turns it RED on both engines (`expected 'dark' to be 'light'`, i.e. flip 1 landed
    and flip 2 did not: exactly the defect signature). So one listener handling every flip for the
    page's lifetime is now PROVEN, not assumed.
    The quirk itself is real but **scoped to the TEST BOUNDARY**: measured with the seam disabled,
    earlier-installed listeners fail LATER tests on their FIRST flip (`expected 'light' to be
    'dark'`). Its mechanism is internal to Playwright's `emulateMedia` override lifecycle and is
    **NOT pinned**; two hypotheses probed, **both disproved** — MQL garbage collection (a strong
    reference did not fix it) and the `emulateMedia(null)` teardown in `afterEach` (removing it did
    not fix it). Recorded so neither is re-guessed. Nothing production does resembles it: a real page
    has one media state that changes, never an override swapped out beneath it.
  - **WHAT THIS STILL DOES NOT PROVE:** emulated `prefers-color-scheme` is the BROWSER's media
    state, not a real OS-level theme switch; the OS→browser binding stays an **8.1 human-gate** item.
  `pnpm lint` clean; `pnpm test` **375 unit**; `pnpm test:browser` **198** both engines; golden diff
  **EMPTY**; `manifest.test.ts` green (`permissions: []`).
- **3.3 DONE** — `src/app/appShell.ts` shell token cascade restructured into three layers:
  `.peekover-app` light base · `@media (prefers-color-scheme:dark)` = the **PRE-JS default** (the app
  page is themed by CSS alone, never unthemed for a frame) · `.peekover-app[data-theme="light"|"dark"]`
  explicit overrides. Layer 3 beats layer 2 by **SPECIFICITY** — attribute-on-class (0,2,0) vs the
  media rule's (0,1,0), `@media` adding none — so **MANUAL WINS OVER OS in BOTH directions**. The
  light/dark token sets are extracted to `LIGHT_TOKENS`/`DARK_TOKENS` consts so each value is written
  ONCE across all three layers (and they match `readerCss.ts` token-for-token — that identity IS the
  coherence property). The shell root now `registerThemeHost(shell)` + `applyColorScheme(shell)`, so
  ONE `applyTheme` writes shell + reader together. Per spec §6 **no `scroll-behavior` added** to
  `.peekover-app__reader` (reduced-motion trap); `readerCss.ts` untouched; **no sepia** (D-1=A).
  - Real-engine proof appended to `themeRuntime.browser.test.ts` (Cr+Fx, +5 →208 browser), driving the
    REAL `mountAppShell` → openFolder → select-file path and reading **computed tokens**
    (`getComputedStyle(...).getPropertyValue('--paper')` — jsdom cannot cascade): shell/reader compute
    the SAME `--paper`/`--ink` under manual dark AND manual light; manual-dark-on-OS-light and
    manual-light-on-OS-dark both resolve correctly; and with NO attribute set the media rule still
    themes a bare shell (pre-JS default intact). **RED-FIRST** — removed the two attribute-override
    blocks → coherence + both direction tests failed on BOTH engines (`expected '#FBFBF8' to be
    '#12141C'` and the converse) → restored → 22/22 green.
  - **LOOK IS HUMAN-GATE-ONLY.** Computed tokens and geometry prove the values agree; they cannot see
    contrast, opacity, z-order or occlusion. M3's gate caught a fully TRANSPARENT rail that every
    geometry test measured perfectly (defect #6, "visual occlusion is gate-only"). Whether the themed
    app page actually LOOKS right stays **8.1**.
  `pnpm lint` clean; `pnpm test` **375 unit**; `pnpm test:browser` **208** both engines; golden diff
  **EMPTY**; `manifest.test.ts` green (`permissions: []`).
- **GROUP 3 COMPLETE (3.1/3.2/3.3 + the review follow-up), NOT pushed** — 4 commits ahead, awaiting
  human review. The 4th is the review follow-up above: the one-listener-many-flips guard (+1 test,
  comment/doc corrections only — **no `src/` behavior change**, the runtime was already correct).
  Suites at group close: `pnpm test` **375 unit** · `pnpm test:browser` **210** both engines · golden diff
  **EMPTY** · `manifest.test.ts` green (`permissions: []`). **NOTE: group 3's four commits were still
  UNPUSHED as of the 4.1 session** (`git status` read `ahead 4`) — groups 1–2 are pushed, group 3 is not.
  `src/render/` (incl. `mount.ts`),
  `src/settings/`, `entrypoints/`, sanitize/parse and the manifest were **all untouched** — the only
  non-group-3 file is `vitest.config.ts`, which gained the test-only `emulateColorScheme` browser
  command (the 003 `emulateReducedMotion` precedent). NEXT after review → group 4 (flash MEASUREMENT,
  then the D-2 mitigation). Do NOT start it yet.

**Group 4 (flash: MEASURE → mitigate) IN PROGRESS — advance PER TASK.**
- **4.1 DONE — flash MEASUREMENT harness + numbers. NO threshold asserted (M1 retro rule).** New
  `scripts/perf-theme-flash.ts` (`pnpm perf:flash [-- --sw warm|cold|both] [--no-build]`), modelled on
  `perf-first-paint.ts`. Minimal instrumentation only: the content entrypoint now fires `port.load()` at
  document_start (parallel with `injectHideStyle()`, plan §1.5) and timestamps the resolve;
  `runReader.ts` timestamps the mount commit. **`src/render/mount.ts`, `src/theme/`, `src/settings/`,
  `src/app/` and the manifest were NOT touched** — group 3's `setThemeSetting()` broadcast through the
  theme registry means a setting applied BEFORE mount themes the first paint and one applied AFTER is
  fixed by the broadcast, so group 4 needs no `MountOptions` change (verified by reading `reader.ts`,
  not assumed). Nothing CONSUMES the settings yet; the reveal is not gated. That is 4.2.
  - **HARNESS SCOPE — CHROMIUM ONLY, and this is now a HARD limit, not a gap to close.** Playwright
    cannot load an unpacked extension into Firefox: `--load-extension` is a Chromium flag, and the
    tracking issue (microsoft/playwright#7297) was **CLOSED 2024-12-03 as out-of-scope**, with every
    later request folded into it. `playwright-core@1.61.1` contains no `installAddon`/
    `installTemporaryAddon` (grepped). So there is no roadmap item to wait for. The **Firefox no-flash
    property is routed to the 8.1 human gate**; no Firefox number was faked. (Third-party escapes exist
    — `playwright-webextext`, Selenium/geckodriver `installAddon`, `web-ext` — none adopted here.)
  - **"COLD" IS DEFINED AND ASSERTED, not slept for.** The MV3 worker is terminated via CDP
    `Target.closeTarget` immediately before each cold navigation. **Two mechanisms probed, one works:**
    `ServiceWorker.stopAllWorkers` was accepted without error but the target SURVIVED; `Target.closeTarget`
    returns `{success:true}` and the target disappears from a follow-up `Target.getTargets`. **A trap
    cost a debugging cycle and is recorded so it is not re-hit:** Playwright's `ctx.serviceWorkers()`
    STILL lists a terminated worker (client-side cache, never pruned), so the first liveness check made
    every cold run look like a failure — `Target.getTargets` is the browser's own answer and is now the
    authority. "Cold" therefore means *no running worker process*, not a fresh profile (that would
    cold-start the browser and disk cache too, conflating three variables). That the worker genuinely
    respawns is proven, not assumed: each run asserts the reply carried the seeded `dark`.
  - **The two observable moments:** `resolved` = `port.load()` resolving in the content script;
    `painted` = 2nd rAF after `<peekover-root>` first has populated open-shadow content — the **same
    metric and detector as `pnpm perf`**, so it is directly comparable to the 003 baseline. Marks cross
    the **isolated-world boundary** as `<html>` data-attributes (a content script's `window` is not the
    page's, so a global is invisible to `page.evaluate`; the DOM is shared). Each mark carries
    `Date.now()` beside `performance.now()` so the harness **CHECKS** both worlds share a timeOrigin
    rather than assuming it — measured skew **≤0.9 ms** every run, well inside the 2 ms tolerance.
  - **NUMBERS** (i7-13700, Windows, headless chromium/Playwright; 7 runs per cell, run 1 discarded,
    **median of warm 6**, min/max as spread; persisted theme seeded to a NON-default `dark` and asserted
    to have reached the reader every run — a run resolving to the `auto` default would measure nothing):

    | fixture | SW   | resolved | painted | committed | DELTA (painted−resolved) | theme before paint |
    |---|---|---|---|---|---|---|
    | 50 KB | warm | 21.4 ms (20.6–22.5) | 133.0 ms (131.9–144.1) | 60.4 ms | **+111.8 ms** | 6/6 |
    | 50 KB | cold | 138.9 ms (137.1–142.9) | 139.1 ms (137.3–143.1) | 62.6 ms | **+0.2 ms** | 6/6 |
    | 1 MB | warm | 22.7 ms (21.3–24.1) | 1162.7 ms (1155.6–1180.7) | 457.9 ms | **+1140.4 ms** | 6/6 |
    | 1 MB | cold | 962.3 ms (954.4–983.9) | 1159.8 ms (1150.0–1194.6) | 462.3 ms | **+199.5 ms** | 6/6 |

  - **THE COLD FIGURES ARE CONTAMINATED — quantified, not hand-waved.** Cold `resolved` read 138.9 ms on
    the 50 KB doc but 962.3 ms on the 1 MB doc, for what is the *same* worker wake. A separate isolation
    probe (extension page, no render work) measures the settings round-trip at **0.4 ms warm (0.4–0.6)
    and 5.0 ms cold (4.4–7.5)**. So the background is nearly free; the in-page cold numbers are almost
    entirely a **DELIVERY WAIT** — a content script shares the page main thread, so a reply arriving
    while the reader is parsing/mounting is not dispatched until that thread yields. `resolved` is
    therefore honestly "when the reader could ACT on the settings", **not** the service-worker cost.
  - **The +0.2 ms 50 KB/cold delta is a PHOTO FINISH, not comfort.** It is pinned at +0.1…+0.2 ms across
    all 6 runs while the absolute values move 6 ms — the signature of both stamps being flushed in the
    SAME main-thread turn. Their order *within* that turn is not resolvable by this instrumentation and
    is not guaranteed by anything currently in `src/`. Mechanism: the ~5 ms worker wake pushes the reply
    just past the moment the main thread saturates with parse+mount, so it then waits ~115 ms for the
    next yield. **It is a cliff, not a gradient** — which is exactly why 4.2 must not read "6/6 before
    paint" as "no flash by default".
  - **INSTRUMENTATION COST ~NIL:** 50 KB warm painted **133.0 ms** vs the recorded 003 baseline
    **133.5 ms** (budget <150 ms) = **−0.5 ms**, inside run-to-run noise. The measurement did not move
    the number it measures. Content script 285.96 kB (formal byte re-measure is task 7.1).
  - **THE TWO DEADLINES — DIFFERENT NUMBERS, DIFFERENT JOBS (the plan conflates these; it must not).**
    - **NEVER-BLANK ceiling ≈ <3000 ms.** runReader's `SAFETY_UNHIDE_MS = 3000` floor reveals raw text if
      nothing has mounted; a gate must resolve well inside that or the user sees the raw flash the whole
      design exists to prevent. `LOAD_TIMEOUT_MS = 1500` (group 2, provisional) sits at 50% of the floor —
      **safe, and NOT re-tuned by this measurement**, but it is ~200× the measured worst-case round trip
      (7.5 ms). It is a dead-background backstop, nothing more.
    - **PAINT-GATING deadline ≈ 77 ms from navigation start (~17 ms of slack).** Derived: paint lands
      ~72.6 ms after mount commit (60.4 → 133.0 ms, 50 KB warm); the <150 ms budget therefore allows a
      commit no later than ~77 ms; the natural commit is 60.4 ms, so a gate may delay the mount by at
      most **~17 ms**. Measured true availability is 21.4 ms warm and ~26 ms cold (21.4 + the 5 ms wake),
      leaving ~51 ms of headroom.
    - **These differ by ~20×. 1500 ms must NOT be inherited as the paint gate** — a gate that waits
      `LOAD_TIMEOUT_MS` would blow the typical-doc budget by an order of magnitude.
  - **D-2 RECOMMENDATION (for the human to accept or reject — NOT a decision taken): BLOCK, with a short
    paint-gate deadline of its own (~75 ms), falling through to auto + the transition path.** Rationale:
    the background's real cost is 0.4 ms warm / 5.0 ms cold, and `load()` is fired at document_start
    while mount does not commit until ~60 ms — so gating the mount on it costs **~0 ms in every measured
    cell**, and the 138.9 ms cold `resolved` is an artifact of the mount work itself blocking delivery,
    which gating *before* the mount removes. **The inference to flag:** that "gating before mount makes
    cold ≈26 ms" follows from the isolation probe, it was NOT measured in the gated configuration —
    **4.2 must re-measure post-gating and fall back to transition if it does not hold.** The fallthrough
    is not optional: the paint budget allows only ~17 ms of stall, so the gate needs its own short
    deadline and a transition path behind it. A pure transition design is the safe-but-worse option — it
    accepts a visible light→dark flip on every cold start, which is the exact defect 004 exists to fix.
  - `pnpm lint` clean; `pnpm test` **375 unit**; `pnpm test:browser` **210** both engines; golden diff
    **EMPTY**; `manifest.test.ts` green (`permissions: []`).
- **4.1a DONE (human decision gate) — D-2 SETTLED: BLOCK, with its own short paint-gate deadline,
  falling through to Auto + an INSTANT re-theme.** Recorded in `docs/ai/decisions.md` 2026-07-18 (the
  driving numbers are LINKED to the 4.1 table above, not restated). Two deliberate sub-decisions:
  **(a) no cross-fade** — the late-arrival path swaps instantly, because an instant swap is
  `prefers-reduced-motion`-safe by construction and adds no code, while a cross-fade is a *visual*
  property no test we can write certifies (M3 defect #6, "occlusion/appearance is human-gate-only");
  the plan's "softened by a cross-fade" wording is **superseded**. **(b) block-with-fallthrough
  SUBSUMES transition** — gate resolves in time → no flash; gate expires → mount Auto and re-theme on
  arrival, which IS the transition behaviour. There is no separate transition design to build.
- **4.2 DONE — but NOT as D-2 specified: the gate was built, measured, and REMOVED. The shipped
  mitigation is D-2's own recorded fallback (mount Auto + INSTANT re-theme).** The one src/ change
  that matters is that the persisted theme now actually REACHES the runtime: the content entrypoint
  does `settings.load().then(r => setThemeSetting(r.theme))`, whose registry broadcast (group 3)
  themes the reader. `runReader.ts` ends the task with **no behavioural change at all** — only the
  4.1 instrumentation deleted.
  - **THE GATE WAS IMPLEMENTED AND IT FAILED ITS BUDGET.** Built as specified: a `themeReady` seam on
    `RunReaderOptions`, a `THEME_GATE_MS` deadline of its own (75 ms, derived exactly as 4.1 said),
    deferral-with-remembered-finality so the settings wait composed with the Gecko source-not-ready
    retry, and openGate on settle-or-deadline-or-rejection. It was green: 7 jsdom orchestration tests
    (red-first in two independent mutations) + 4 real-engine never-blank tests on both engines. Then
    it was measured, and the numbers killed it.
  - **THE 4.1 INFERENCE DID NOT HOLD — this is the headline.** 4.1 predicted that gating before the
    mount would make cold settings availability **≈26 ms** (extrapolated from the isolation probe,
    never measured in the gated configuration — 4.1 flagged it as the thing 4.2 must check). Measured
    behind the gate: **~72 ms**. The isolation probe still reproduces (**0.4 ms warm / 5.6 ms cold**),
    so the background really is nearly free; the probe simply **under-predicts the content-script path
    by ~13×** — it measures an idle, already-loaded extension page, while a content script at
    `document_start` competes with an active navigation. **Standing correction: do not infer in-page
    availability from that probe again** (noted in-code at `measureSwWake`).
  - **MEASURED, THREE CONFIGURATIONS, SAME BUILD AND SESSION (50 KB cell, the one carrying the
    <150 ms budget; medians of 6 warm runs, run 1 discarded):**

    | config | 50 KB warm painted | 50 KB cold painted | verdict |
    |---|---|---|---|
    | gate 75 ms | 129.9 ms | **172.7 ms** | cold BREACHES <150 ms |
    | gate 40 ms | 134.1 ms | **172.9 ms** | cold BREACHES — *not* the deadline's fault |
    | **no gate (shipped)** | 135.4 ms | **148.2 ms / 137.7 ms** | inside budget |

    The two gated rows are the decisive pair: **halving the deadline changed cold by 0.2 ms**, so the
    ~25–35 ms cold cost is **not the length of the wait**. The most likely MECHANISM is that deferring
    the mount at all takes it off the DOMContentLoaded turn it otherwise rides — but that was **NOT
    instrumented; it is a hypothesis, not a measurement**. (Marked as such deliberately: 4.2 exists
    because 4.1's un-remeasured inference (~26 ms) did not survive contact, so an un-instrumented
    causal claim in this same record gets labelled rather than inherited.) No deadline both gates warm
    (settings land at
    ~21.5 ms, before the ~60 ms natural commit) and stays free on cold. And the gate bought nothing
    measurable: **warm was already no-flash without it**, because the settings beat the mount anyway.
  - **FINAL SHIPPED NUMBERS (`pnpm perf:flash`, mark-free harness, Chromium):**

    | fixture | SW   | painted | NO FLASH |
    |---|---|---|---|
    | 50 KB | warm | 139.5 ms (133.1–145.6) | **6/6** |
    | 50 KB | cold | 137.7 ms (132.1–148.6) | **6/6** |
    | 1 MB | warm | 1172.5 ms | **6/6** |
    | 1 MB | cold | 1366.7 ms | **6/6** |

    **VERDICT: the shipped design holds the <150 ms budget on both 50 KB cells** (139.5 / 137.7 ms),
    and 1 MB stays under the 003 part-(b) 1.7 s bound. 50 KB warm reads 139.5 ms vs the 003 baseline
    133.5 ms and 4.1's 133.0 ms — **+6 ms, inside the run-to-run band** (this session's ungated control
    measured 135.4 ms and the min was 133.1 ms; the machine is noisier today than at 4.1). No
    regression, but not a clean improvement either — stated as measured.
  - **THE NO-FLASH MEASUREMENT IS NOW DIRECT, not inferred.** 4.1 could only compare two timestamps;
    the harness now reads **`data-theme` on `<peekover-root>` inside the same rAF that stamps the
    paint** — production's own attribute, at the paint moment. **24/24 runs painted the persisted
    `dark` as the FIRST painted state.** A run where the theme never arrives is an ERROR (vacuous),
    not a "flash".
  - **RESIDUAL RISK, STATED PLAINLY (the thing the gate would have removed):** cold start is a race we
    win, not a race we cannot lose. The ungated cold runs show `resolved` and `painted` landing in the
    **same main-thread turn** (deltas of +0.1 ms in half the runs — 4.1's "photo finish" cliff, still
    there). 24/24 is the measurement, not a guarantee, and no engine here can see an actual flash.
    Whether a human EYE ever catches a flip on a cold start is **8.1**.
  - **4.1 INSTRUMENTATION GONE, AND `perf:flash` SURVIVED MARK-FREE.** `SETTINGS_RESOLVED_ATTR` /
    `MOUNT_COMMITTED_ATTR` / `mark()` / `markSettingsResolved` are deleted (grep across `src/`,
    `entrypoints/`, `tests/`: zero hits) — nothing measurement-only writes to the host page's `<html>`
    any more. The harness did NOT become one-shot: `data-theme` is set by production code, so it
    observes the same property better and with no isolated-world boundary (and therefore no
    cross-world timebase check to maintain). **Byte delta, control-built in the same session:**
    4.1 build (marks, no wiring) **285,955 B** → 4.2 build (no marks, wired) **285,737 B** =
    **−218 B**; the removal more than paid for the theme wiring. vs the 003 baseline 284,744 B:
    **+993 B (+0.35%)** (formal re-measure is task 7.1).
  - **TESTS — THE HONEST SPLIT.** Real-engine `tests/browser/themeFlash.browser.test.ts` (Cr+Fx, +3
    →**216 browser**): the late-arriving theme re-themes the ALREADY-MOUNTED reader **synchronously,
    no re-mount** (the shipped fallback mechanism — **RED-FIRST verified on BOTH engines**: disabling
    the registry broadcast in `applyTheme` fails exactly this test, `src/theme/` then restored, diff
    empty); the reader mounts + reveals themed-Auto with the settings never arriving; and the 3 s
    safety floor still reveals raw when nothing can mount. **Unit count is UNCHANGED at 375** and that
    is not an oversight: the gate's 7 orchestration tests were deleted with the gate, and what shipped
    adds no jsdom-testable logic — `runReader` is behaviourally untouched and the entrypoint binds
    `#imports`. **Test 2 above is a REGRESSION PIN, not a proof:** with no coupling between the render
    path and the settings promise, there is nothing to mutate to make it fail. Said so in the file
    rather than dressing a tautology as a red-first.
  - `pnpm lint` clean; `pnpm test` **375 unit**; `pnpm test:browser` **216** both engines; golden diff
    **EMPTY**; `manifest.test.ts` green (`permissions: []`). Fence held: `src/render/mount.ts`,
    `src/theme/`, `src/settings/`, `src/app/`, `entrypoints/background.ts` and the manifest untouched.
  - **FOR THE HUMAN:** 4.2 ships the arm of D-2 the human did NOT pick first, under the escape clause
    D-2 itself recorded ("if the re-measure contradicts the inference and the 50 KB cells breach the
    budget, fall back"). The tradeoff now on the table is a **rare cold-start flip** vs a **~25 ms
    budget breach on every cold typical-doc open**; the evidence above is what it rests on.

**Group 5 (settings UI — auto/light/dark, sepia deferred) IN PROGRESS — advance PER TASK.**
- **5.1 DONE — the in-reader theme control, shipped to BOTH surfaces through the one `mount()` seam.**
  New `src/theme/themeControl.ts`: the pure `nextThemeSetting` cycle (auto→light→dark), the
  `buildThemeControl()` builder, and the **register-once save seam** `registerThemeSaveSink`.
  `mount()` pushes the control into `children[]` as a SIBLING of `.peekover-reader`; the content
  entrypoint registers `messagingPort(...).save`.
  - **D-A — the port reaches the control by MODULE SEAM, not by threading (a corrected tasks.md
    line).** tasks.md 5.1 said "threaded through `MountOptions`"; that threading never existed.
    Group 3 deliberately kept the port in the entrypoint (`reader.ts`'s header says why) and group 4
    kept it there again. Threading would reshape FOUR signatures across TWO call chains
    (`runReader`→`mountReader`→`mount`, `mountAppShell`→`createReaderPane`→`mount`) to deliver one
    callback. The seam mirrors group 3's `setThemeSetting` precedent exactly and keeps the property
    the wording protected: **`mount()` and the control import neither the port nor `store`** — the
    context injects its own sink. tasks.md 5.1 corrected in-place (same class as the earlier
    `src/store/`→`src/app/` path drift).
  - **D-B — the control asks the RUNTIME for the setting; it cannot read `data-theme`.** That
    attribute is the EFFECTIVE theme, so `auto` on a light OS is indistinguishable from a manual
    `light`. Group 3's seam gained the minimum needed (`src/theme/reader.ts`): `currentThemeSetting()`
    promoted from test-only, plus `onThemeSettingChange()`. `setThemeSetting` now notifies after
    broadcasting — so ONE subscription keeps every control in sync whether the change came from the
    async cold-start `load()`, an OS flip, or the other surface's control. Liveness is by
    construction: a module-level Set of controls pruned by `isConnected` before each sync (the
    themeRegistry/tocView pattern), so mount()'s per-render rebuild cannot leak a listener.
  - **CORRECTION OF RECORD — THE GOLDEN PIN CANNOT SEE THIS TASK, AND THAT WAS MEASURED.** The
    standing "golden diff EMPTY ⇒ the column is untouched" reading is **false for chrome**: with the
    control deliberately appended INSIDE `.peekover-reader`, `git diff tests/golden/output/` stayed
    **EMPTY** and `golden.test.ts` still passed **10/10**. `tests/golden/golden.test.ts` snapshots the
    pure `sanitize(parse(source))` string — a stage upstream of `mount()` that never observes chrome.
    So the **DOM sibling assertion is the only guard**, not a belt-and-braces duplicate. Noted in
    mount.ts and in the test so the empty diff is never over-read again.
  - **PLACEMENT WAS MEASURED, NOT CHOSEN.** The obvious spot — stacked under the mode-toggle at the
    top-right — **collides with the TOC rail's handle at BOTH viewports** (narrow 414px: control
    [291,56,398,86] vs handle [280,56,392,102]; wide 1400px: [1277,56,1384,86] vs [1173,56,1292,86]).
    The rail owns the entire right side; top-right is the mode toggle, top-left the remote-load pill.
    The control therefore sits **bottom-left, 56px up** — one pill-height above the network indicator,
    the one corner nothing claims at rest. `CONTAINED_CSS` flips it fixed→absolute with the other
    pills, so the app-page pane positions it correctly (the recurring two-surface gotcha).
  - **TESTS — THE HONEST SPLIT.** jsdom unit (+5 →**380**) covers ONLY `nextThemeSetting` + the label
    map; everything else is DOM/cascade/geometry and is proven in the real engine.
    `tests/browser/themeControl.browser.test.ts` (Cr+Fx, 19 tests → **+38 → 254 browser**): renders on
    both surfaces · sibling-of-column on both · a pick applies instantly (attribute AND computed
    `--paper` `#12141C`) · reaches EVERY registered host · works with no sink registered · the save
    path is called once per pick with the right patch · re-labels on a late-arriving setting · a
    second control stays in sync · auto-vs-manual-light is distinguished · button/no-tabindex/
    accessible-name · geometry vs mode-toggle + TOC handle + TOC list at narrow AND wide on BOTH
    surfaces · clears the column at wide · clears the network indicator + remote-load pill.
    **FOUR RED-FIRSTS, all clean on both engines:** append to `root` → 2 sibling tests fail; drop the
    save call → the save test fails; drop the notification → 3 sync tests fail; move to top-right →
    4 geometry tests fail on the TOC handle.
  - **HARNESS LIMIT, STATED:** the browser project loads no unpacked extension, so the control's REAL
    sink (`messagingPort.save` → background) cannot run. A **fake sink is injected through the
    production `registerThemeSaveSink` seam** and asserted; that proves the control's half of the
    contract, NOT that the message reaches the background. End-to-end pick→reload→persists is **8.1**.
  - **LOOK IS HUMAN-GATE-ONLY (8.1).** Geometry and computed tokens proved a fully TRANSPARENT rail in
    M3 (defect #6). Whether the pill reads as Peekover chrome, holds contrast in both themes, or
    occludes something a human minds is not decidable here.
  - `pnpm lint` clean; `pnpm test` **380 unit**; `pnpm test:browser` **254** both engines; golden diff
    **EMPTY**; `manifest.test.ts` green (`permissions: []`).

- **5.2 DONE — app-page shell header control + the group-1 carry-over closed.** The header gains the
  **SAME `buildThemeControl()`** the reader chrome uses, restyled as a header pill beside the storage
  toggle (it carries the `margin-left:auto`, so it heads the right-hand control group). One builder,
  two surfaces — behaviour, labelling and a11y cannot drift; only the CSS differs, and the two
  stylesheets cannot leak into each other (readerCss lives in the shadow root, APP_CSS is
  `.peekover-app`-scoped).
  - **The app page wires `directPort`, not `messagingPort`** — it is extension-origin, so it reads
    and writes the settings store directly with no background round-trip. Two wirings mirroring the
    content entrypoint: `registerThemeSaveSink(patch => port.save(patch))` and
    `load().then(r => setThemeSetting(r.theme))`. `AppStore` gained OPTIONAL
    `getSettings`/`putSettings` (the group-5 reader convention), so a minimal fake store still mounts
    and the control still applies — it just cannot persist.
  - **CARRY-OVER LANDED (recorded at the group-1 review).** `StoredSummary.settings` is now REQUIRED.
    The tightening immediately caught **three** literals — appShell's `EMPTY_SUMMARY` plus two test
    fixtures in `appShell.test.ts` — each of which had been silently reporting "no settings stored".
    That is exactly the compile-time signal the optional field was suppressing; all three fixed,
    `settings: null` added to `EMPTY_SUMMARY`. Full suites re-run green after the type tightened.
  - **TESTS.** New `tests/browser/themeShell.browser.test.ts` (Cr+Fx, 9 tests → **+18 → 272 browser**;
    unit unchanged at **380** — 5.2 adds no pure logic, it is wiring, and saying so beats inventing a
    jsdom test). Present-and-in-the-header · cycles auto/light/dark with **no sepia** · a header pick
    themes shell AND the contained reader pane coherently on **COMPUTED `--paper`/`--ink`** (the
    group-3 precedent — an attribute-only assertion would have passed on the pre-3.3 shell) ·
    dark and light · the header control and the in-reader pill show the SAME selection in both
    directions · a pick reaches the real IndexedDB · it comes back on RE-MOUNT · empty store falls
    back to Auto · a store with no settings methods still applies the pick.
    **TWO RED-FIRSTS, clean on both engines:** dropping `registerThemeSaveSink` fails the 2
    persistence tests; dropping the mount-time `load()` fails the re-mount test with
    `expected 'Theme: Auto' to be 'Theme: Dark'`.
  - **WHAT "PERSISTS" HONESTLY MEANS HERE.** The harness loads no extension and NEVER NAVIGATES, so a
    re-mount is not a reload: the page, module graph and module-level theme state all survive it. The
    test therefore resets the runtime to `auto` and drops the memoized DB connection BEFORE
    re-mounting, so the value read back demonstrably came off disk — and the red-first above confirms
    it (without the load, the re-mount reads `auto`). The genuine reload is **8.1**.
  - `pnpm lint` clean; `pnpm test` **380 unit**; `pnpm test:browser` **272** both engines; golden diff
    **EMPTY**; `manifest.test.ts` green (`permissions: []`).
  - **FOR THE HUMAN — A UX QUESTION, NOT A DEFECT.** The app page now shows **TWO** theme controls:
    this header one, and 5.1's in-reader pill, which reaches the contained pane through the one
    `mount()` seam. tasks.md 5.1+5.2 specify exactly that, so both shipped and they are proven to stay
    in sync — but whether the in-reader pill is redundant on the app page is a judgement call, left
    to the gate rather than taken unilaterally.

  **GROUP 5 COMPLETE (5.1/5.2), NOT pushed** — 2 commits ahead, awaiting human review. Suites at group
  close: `pnpm test` **380 unit** · `pnpm test:browser` **272** both engines · golden diff **EMPTY** ·
  `manifest.test.ts` green (`permissions: []`). Fence held: `tocView.ts`/`tocModel.ts`, `sanitize.ts`,
  `parse.ts`, the manifest and `wxt.config` all **untouched**. **Group 5 reviewed + PUSHED.**
  NEXT → group 6 (TOC carry-over), below.

**Group 6 (TOC carry-over) IN PROGRESS — advance PER TASK.**
- **6.1 DONE — the 003 rail's open-state and width are now a remembered global preference.** Applied on
  build, restored on late arrival, persisted on change; 003's behaviour is bit-for-bit unchanged when
  nothing is stored.
  - **D-E = (b) — the group-5 save seam was GENERALIZED, not duplicated.** New
    `src/settings/settingsSeam.ts` owns `currentSettings()` / `onSettingsChange()` / `saveSettings()` /
    `registerSettingsSink()`. Justified from the code, not by taste: the group-5 sink's type was ALREADY
    `(patch: Partial<Settings>) => void` — nothing about it was theme-specific, it was only NAMED for its
    first consumer; a second seam would have had both entrypoints register the SAME `port.save` twice into
    two module globals; and the TOC additionally needs a READ half, which is literally a `Settings` value
    and belongs with the settings vocabulary rather than bolted onto a theme module. **PURE MOVE, as
    required:** `themeControl.ts` still exports `registerThemeSaveSink` / `resetThemeSaveSinkForTest` as
    delegates, so **every group-5 test file is byte-unchanged** and the two theme browser suites
    (`themeControl` 19 + `themeShell` 9) stayed green untouched. Entrypoints/appShell moved to the
    canonical `registerSettingsSink` + gained `publishSettings(resolved)` beside their existing
    `setThemeSetting(resolved.theme)`.
    - **WHAT WAS DELIBERATELY *NOT* UNIFIED, and why:** the theme's READ half stays in `reader.ts`
      (`currentThemeSetting` / `onThemeSettingChange`). Those report the theme runtime's **APPLIED** state,
      not the persistence cache, and the two legitimately diverge — an OS flip under `auto` changes what
      paints while the stored setting is untouched. Collapsing them would destroy exactly the distinction
      decision D-B was written to preserve. So: the seam owns STORED settings; reader.ts owns APPLIED theme.
  - **D-F — THE rAF STOMP, AND THE VACUOUS TEST IT NEARLY SHIPPED (the headline of this task).**
    `applyInitialTocState` schedules an rAF that re-runs the width rule post-layout and calls `setTocOpen`,
    so a restored value applied at build is **overwritten one frame later**. Handling: **a persisted
    `tocOpen` wins outright AND the rAF is not scheduled at all** (nothing pending ⇒ nothing to race), plus
    a second guard inside `decide()` that re-reads the seam at DECISION time and stands down if a stored
    value has appeared since — closing the narrow window where a rail built with nothing stored has the
    settings publish before its already-scheduled frame runs. Rationale: the width rule is a GUESS made in
    the absence of knowledge; spec §4 makes the stored value a single GLOBAL preference, so re-deriving it
    per viewport is precisely what "remembered" must not mean.
    - **THE NEAR-MISS, RECORDED BECAUSE IT IS THE REUSABLE LESSON.** The first version of the D-F test
      assumed the harness viewport was WIDE and asserted that a stored `tocOpen:false` survived. **The
      harness viewport is 414×896 — NARROW** — so the width rule already decides `collapsed`, meaning the
      stomp would have written *the same value the test asserted*: it would have passed with the entire D-F
      handling deleted. The harness surfaced this only incidentally (a different hardcoded `'open'`
      expectation failed). Fix: the suite now MEASURES the width-derived default by mounting a probe with
      nothing stored and reading production's own answer, then seeds the **opposite** — adversarial by
      construction on any viewport, plus an explicit `not.toBe(widthDefault)` assertion. **The general
      lesson: a persistence test that hardcodes what the fallback would have decided is vacuous whenever
      the two agree, and nothing about the green run says so.**
  - **D-G — restoring must not write back.** `setTocOpen` remains the single, SAVE-FREE writer of
    `data-toc`/`aria-expanded`, now serving three callers (opener, backtick, restore). Persistence lives in
    a separate `setTocOpenByUser` wrapper that both USER paths call. At the seam the same split is
    structural: `publishSettings` (store → us) notifies, `saveSettings` (us → store) does NOT — so a
    consumer that saves on change and restores on notification cannot loop its own write back one turn
    later, or race a `load()` still in flight. Asserted: after a restore, and after a LATE restore, the
    captured-patch array is `[]`.
  - **D-H — CONFIRMED, the drag persists on `end` only.** `pointermove` rewrites `--toc-w` per pointer
    sample and saves nothing; the shared `pointerup`/`pointercancel` handler saves once, and its existing
    `if (!dragging) return` guard makes that exactly once per gesture (a stray or duplicate release stores
    nothing). The stored width is clamped again on the way out.
  - **LATE ARRIVAL — APPLIED, NOT DEFERRED, and this is the PRIMARY path.** On a cold start the settings
    land after the mount commits (group 4's measurement), so the rail is normally built against
    `DEFAULT_SETTINGS` (both fields `null` → 003's behaviour) and corrected when `publishSettings` fires.
    Deferring to "the next render" was rejected because the content-script surface renders once per
    navigation — the next render may never come, so a collapsed rail would reopen on every single open
    forever, indistinguishable from the feature not working. Cost accepted deliberately: a visible
    correction a frame or two after paint, the same instant-swap trade D-2 settled for the theme, moving
    chrome rather than the column's text — and gating the mount is exactly what 4.2 measured, failed
    against the <150 ms budget, and removed. ONE module-level subscription (never per rail — mount()
    rebuilds chrome every render), reaching hosts through the existing `tocHosts` registry with the same
    `isConnected` prune + rail-less skip the backtick resolver uses.
  - **CLAMP ON RESTORE.** A stored width is untrusted in a way a live drag is not (corrupt row, hand-edited
    DB, or a future build with different bounds), so `clampTocWidth` is applied on the way IN; a non-finite
    stored value is rejected outright rather than clamped, because `clampTocWidth(NaN)` is NaN and would
    write the literal `"NaNpx"`, silently killing the whole custom property.
  - **TESTS — THE HONEST SPLIT.** jsdom unit **+4 → 384**: ONLY `clampTocWidth` (in/below/above range +
    idempotence). That is genuinely all the pure logic 6.1 adds — everything else is rAF, layout, computed
    custom properties and pointer geometry, all jsdom-blind; said so rather than inventing a unit test.
    New `tests/browser/tocPersist.browser.test.ts` (Cr+Fx, 21 tests → **+42 → 314 browser**), every
    open-state assertion made **after 3 frames** so it outlives the stomp, and the whole persistence block
    run on **BOTH surfaces** via `describe.each` (the recurring two-surface gotcha, closed structurally).
    **FIVE RED-FIRSTS, all genuinely red on BOTH engines, all reverted from a `cp` backup:**
    (1) D-F handling removed → the opposing-`tocOpen` test fails `expected 'collapsed' to be 'open'` and
    its mirror, 12 failures; (2) clamp dropped from restore → `expected 5000 to be 480` (a rail that would
    have eaten the reading column); (3) `saveSettings` dropped from the user path → both opener and
    backtick tests fail `expected [] to deeply equal [{tocOpen:false}]`; (4) the save moved into
    `pointermove` → `expected [ {tocWidth:251}, …(39) ] to deeply equal []` — 40 writes for one gesture,
    the exact D-H defect; (5) the late-arrival subscription removed → the cold-start test fails on both
    surfaces.
  - **A REAL INTERACTION THE CONTAINED SURFACE FORCED OUT (not scaffolding).** `mountAppShell` runs its own
    production wiring — it registers ITS port's sink (last registration wins, by design) and publishes
    whatever its store returns. On the app page the shell genuinely owns the port and the rail is a second
    consumer of the same seam, so the test re-registers after the shell's turn and gives the fake store a
    `getSettings` that answers with the seeded value. Worth knowing: **on the app page the shell's `load()`
    is authoritative and will overwrite anything published before it.**
  - **HARNESS LIMIT, STATED:** the browser project loads no unpacked extension, so the REAL save path
    (`messagingPort` → background → IndexedDB) cannot run. The fake sink is injected through the
    PRODUCTION `registerSettingsSink` seam and the persisted value fed in through the PRODUCTION
    `publishSettings` — the exact two functions the entrypoints call. That proves tocView's half of the
    contract; it does NOT prove the message reaches the background or that a real reopen remembers.
    End-to-end collapse→drag→**reload** is now an explicit **8.1** item.
  - **THE 5.1 CARRIED QUESTION — ANSWERED BY MEASUREMENT: (a), the established pattern. Nothing
    restyled.** At **414×896** the reading column spans the FULL width `[0,0,414,5957]` while the theme pill
    is fixed at `[16,810,123,840]` — so it **does** sit over body text at a narrow viewport. That is not an
    unintended overlap: the mode toggle `[341,16,398,46]`, the remote-load pill and the network indicator
    are the same family of fixed corner chrome and overlay the column identically at this viewport. The
    relationship is now asserted, so a future change that breaks the pattern goes red. What no test can
    decide — whether the text UNDER the pill stays legible — is the M3 defect-#6 occlusion class and is
    added as an **8.1** eyeball item.
  - `pnpm lint` clean; `pnpm test` **384 unit**; `pnpm test:browser` **314** both engines; golden diff
    **EMPTY**; `tests/manifest.test.ts` green **8/8** (`permissions: []`). Fence held: `sanitize.ts`,
    `parse.ts`, `readerMode.ts`, the manifest and `wxt.config` all **untouched**.

- **7.1 DONE — re-measured at milestone close. Every gate PASSES; nothing in `src/` was touched to make
  a number.** Measurement only, per the task fence.
  - **Content-script bytes: 288,654 B** (`.output/chrome-mv3/content-scripts/peekover.js`, fresh
    `pnpm build`). vs the **003 baseline 284,744 B → +3,910 B (+1.37%)**. vs the **task-4.2 reading
    285,737 B → +2,917 B**, which is the honest attribution: 4.2 was measured BEFORE group 5
    (themeControl + readerCss rules + entrypoint sink) and group 6 (settingsSeam + tocView carry-over),
    so essentially all of the growth since is those two groups. **Per spec §5 this delta is STATED, NOT
    GATED — there is no byte threshold and none was invented.**
  - **First paint (a) typical doc ≤50 KB — the SPEC-001 GATE, PASSES.** Fixture 50.4 KB / 62 sections,
    7 iterations (run 1 cold, discarded). Harness verdict verbatim:
    `gate [50.4 KB, typical-doc gate]: (a) median 137.7ms vs <150ms -> PASS`
    median **137.7 ms** · min 132.6 · max 146.0. vs baseline **133.5 ms → +4.2 ms**.
    - **CALLED AS NOISE, NOT REGRESSION — with the spread behind the call.** Two things say so.
      (1) The **floor did not move**: our min **132.6 ms** is BELOW the 4.2-session recorded min
      (133.1 ms). A real added cost raises the floor; noise only raises the middle.
      (2) A **second independent 7-iteration pass** read median **140.3 ms** (min 136.1, max 150.9) —
      also `-> PASS`. The run-to-run median spread (137.7 vs 140.3 = **2.6 ms**) is the same magnitude
      as the 4.2 ms delta being attributed to 004, so the delta is not separable from machine noise.
      Same conclusion the 4.2 session reached about this machine.
    - **HEADROOM IS THIN AND WORTH SAYING:** the second pass had a single warm iteration at **150.9 ms**,
      over the 150 ms bar. The gate is on the MEDIAN and both medians pass, but the typical-doc budget
      now sits ~7–12 ms from its ceiling on this hardware. Not a breach; a thing the next perf-touching
      session should know before it spends the margin.
  - **First paint (b) 1 MB / ~1400-entry TOC — informational, PASSES its own bound.** Default fixture
    1.12 MB / 1400 sections, 7 iterations. median **1248.6 ms** · min 1198.5 · max 1273.1. vs baseline
    **1196.3 ms → +52.3 ms**; budget **<1.7 s → PASS** with ~450 ms headroom. Same noise reading as (a)
    (the ±37 ms within-run spread swallows most of the delta). **The harness prints
    `gate [1.12 MB, large-doc (informational vs typical-doc gate)]: (a) median 1248.6ms vs <150ms -> FAIL`
    — that FAIL is the harness comparing the 1 MB fixture against the TYPICAL-doc bar and self-labelling
    the comparison informational. It is the known, recorded ~8x-over reading (decisions.md 2026-07-14),
    NOT a 004 breach.** Recorded verbatim so a future session does not read it as a regression.
  - **SCOPE CAVEAT, RESTATED (do not read this as both engines).** `scripts/perf-first-paint.ts` drives
    **CHROMIUM ONLY by construction** — `chromium.launchPersistentContext` with
    `--load-extension`; Playwright cannot load an extension in Firefox at all. **The Firefox
    first-paint half is UNMEASURED and is human-gate 8.1.** Every first-paint number above is Chromium.
  - **`pnpm zip` — the one real bound, PASSES both engines with vast headroom.** Chrome
    **327.61 kB**, Firefox **327.66 kB**, both **< 2 MB**. vs the 003 close (323.63 / 323.69 kB) →
    **+3.98 kB / +3.97 kB**, tracking the content-script growth. (The Firefox run also emits
    `peekover-0.0.0-sources.zip` at 1.6 MB — that is the AMO source bundle, not the shipped extension;
    noted so it is not mistaken for the artifact under the 2 MB bound.)
  - **The standing pins, all green.** `git diff tests/golden/output/` **EMPTY** (and `git status
    --porcelain` on it empty). `tests/manifest.test.ts` **8/8 green and byte-UNCHANGED** — last touched
    by 3b6c575 back in M2 task 1.1, so `permissions: []` on both built manifests is re-proven by the
    same unmodified test. `pnpm lint` clean (eslint + `tsc --noEmit`). `pnpm test` **384/384, 34 files**.
    `pnpm test:browser` **314/314, 38 files**, both engines.
  - **ONE FLAKE, RECORDED HONESTLY RATHER THAN RE-RUN AWAY.** The FIRST `pnpm test:browser` run failed
    1/314: `remoteMedia.browser.test.ts` on **Firefox** — *"DOES fire the requests after opt-in"*,
    `expected [] to include 'http://localhost:63315/…'`. Established as a flake, not a 004 regression:
    it passed in isolation on both engines (4/4) and the FULL suite then went 38/38 · 314/314 on re-run,
    and 004 touches nothing in `mediaPolicy.ts`. **The important part: the flaky half is the POSITIVE
    CONTROL (the opt-in fetch DOES appear), not the zero-leak assertion — the non-negotiable was never
    the thing that wobbled.** Most likely the opt-in request had not landed in the Resource Timing
    buffer inside the assertion window on a loaded machine. **But note the shape:** a control that
    intermittently reads empty is exactly the failure mode that would make the zero-count VACUOUS if it
    ever flaked in the other direction and nobody looked. Watch item — if it recurs, the fix is to await
    the request rather than sample for it. Not fixed here (7.1 is measurement-only; no `src/`, no tests).

**Group 8 (the human milestone-close gate — the acceptance an agent CANNOT self-certify).**
- **8.1 PASSED — 2026-07-19, both engines (Chrome + Firefox), both surfaces, NO DEFECTS FOUND.** A human
  walked the full 8.1 checklist on **fresh production builds**, with the **Network tab open throughout**, on
  the content-script reader over a `file://` doc **and** a file in the app-page reader pane.
  - **Walked in the gate's risk order:**
    1. **Cold-start theme flash on the content-script surface** — extension freshly loaded / MV3 worker
       asleep, a persisted NON-default theme, watching the FIRST paint, repeated on both engines. This is
       the item `perf:flash`'s 24/24 provably **cannot** see: it stamps `data-theme` two frames after first
       painted content, exactly the window the accepted 4.2 residual risk lives in. **No flip seen.**
    2. **Firefox first paint** — which has **NO automated coverage at all** (`perf-first-paint.ts` and
       `perf-theme-flash.ts` are Chromium-only by construction; Playwright cannot load an extension into
       Firefox — microsoft/playwright#7297, closed out-of-scope). This gate is the ONLY evidence Firefox
       first paint has ever had. **Clean.**
    3. **Shell/reader coherence + the theme-pill occlusion eyeball at ~414 px** — no half-themed screen, and
       the text under the fixed pill stays legible (the M3 defect-#6 "visual occlusion is gate-only" class).
    4. **TOC carry-over end-to-end** — collapse the rail, drag a width, **RELOAD**, both come back, and the
       remembered state is GLOBAL across the two surfaces. This exercises the real
       `messagingPort → background → IndexedDB` path, which **no test has ever run** (the browser project
       loads no unpacked extension; every suite injects a fake sink through the production seam).
    5. **Theme cycle + persistence + the no-flip property** — Auto/Light/Dark apply live, survive a real
       reload, and an OS flip re-themes **only under Auto**.
    6. **The trust surface** — "Stored data" shows the settings row; **wipe** clears it and the reader falls
       back to **Auto**.
    7. **Zero unexpected network throughout; clean console; the document stayed the hero.**
  - **THE GATE STATISTIC, STATED PRECISELY SO IT IS NOT MISREAD.** The running **6/6** figure means **SIX
    milestone-shipping defects, ALL of them caught by this gate**, across **M1 + M2 + M3**. **M4 contributes
    ZERO defects and ZERO misses**, so the ratio still reads **6/6** — the denominator did not move because
    nothing shipped past the gate to move it. **M4 is therefore the FIRST milestone whose gate found
    nothing.** *That is a question FOR THE RETRO, deliberately NOT answered here: did the red-first /
    mutation-proof discipline this milestone genuinely catch these classes earlier, or was M4 a quieter
    surface and this one lucky? The retro decides. Do not read a clean gate as evidence the gate has stopped
    being load-bearing.*
  - **THE THREE ITEMS DEFERRED INTO 8.1 BY GROUPS 6–7 ARE NOW DISCHARGED** — a future session should not
    treat any of them as open: (1) **Firefox first paint** (7.1's Chromium-only scope caveat); (2) the
    **end-to-end TOC carry-over** through the real messaging→background→IndexedDB path (6.1's harness
    limit); (3) the **narrow-viewport theme-pill occlusion eyeball** (6.1's carried 5.1 question). All three
    were walked and all three passed.

Full close details in Done (2026-07-17); the settled TOC architecture + sizes/perf in decisions.md 2026-07-17.

**M2 (spec 002 — active-source foundation) remains fully closed** (code + the named human gate, both engines;
task 6.3 PASSED 2026-07-15 — see Done). Nothing on 002 outstanding.

---

## Task / session log · newest first · M1 → M3 close + the 004 planning gates
*The `## Done` list as it stood at the M4 close, verbatim. Covers M1 (spec 001 — core render pipeline,
closed 2026-07-14), M2 (spec 002 — active-source foundation, closed 2026-07-15), M3 (spec 003 — TOC /
navigation, closed 2026-07-17), and the spec-004 gate-1/gate-2 approvals.*

- 2026-07-17 — **Spec 004 plan APPROVED (Gear-3 gate 2) + tasks DRAFTED (gate-3 artifact).** `plan.md` landed
  (the HOW — the `settings` store schema + `DB_VERSION` 1→2, the `SettingsPort` message seam, the theme-runtime
  + host-registry rewrite with the `isConnected` liveness guard, the MEASURE-then-mitigate flash approach, the
  test strategy); `tasks.md` drafted — **8 dependency-ordered groups**, each task with its own real-engine /
  red-first or measured Verify line + the standing golden-EMPTY / `manifest.test.ts`-green pins, awaiting a
  separate human gate before any implementation code. **D-1 = A: sepia DEFERRED from 004** — `design/tokens.css`
  defines only 4 of ~15 sepia tokens, so completing the palette is a brand/design decision, not an
  implementation fill; 004 ships **auto/light/dark** + persistence + TOC carry-over. Spec §3.5/§4/§6 amended
  (f4e11f5); full detail in decisions.md 2026-07-17 + `specs/004-themes-settings/plan.md` §0 D-1.
- 2026-07-17 — **Spec 004 (themes + settings) gate-1 approved & landed.** Gear-3 gate 1 passed 2026-07-17;
  `specs/004-themes-settings/spec.md` written (the WHAT — no tech). Next → plan.md (the HOW), Gear-3 gate 2, for
  a separate human gate before any implementation code. Persistence-path direction recorded in decisions.md
  2026-07-17 (settings persist WITHOUT a new manifest permission — `permissions:[]` kept; sync deferred).
- 2026-07-17 — **Tasks 6.2 + 6.3: M3 CLOSED (spec 003 — TOC / navigation) — code-complete AND human-gated.**
  The **6.2 milestone-close human gate PASSED, both engines, both surfaces.** A human walked the full spec-003
  checklist in **Chrome + Firefox on the current build, Network tab open**, on the content-script full-page
  `file://` doc AND the app-page reader pane: multi-heading doc → **TOC appears** (≥2 headings) → click an
  entry **scrolls to the section** → scroll → **active entry tracks** (scroll-spy) → **collapse/expand** →
  **resize** the sidebar → **backtick toggle** → **smooth** scroll normally, **instant** under an OS
  reduced-motion setting → a **no-heading** doc and a **pathological-heading** doc each show a designed state,
  **never blank** → the (b) **no-raw-flash on the 1 MB doc** ground truth from 5.2 confirmed. **Zero unexpected
  network throughout, no console errors, the document stayed the hero.** The single 003 acceptance an agent
  cannot self-certify — now met. It caught **1 real defect** the green stack missed: the TOC rail rendered
  TRANSPARENT (text bled through) and the reading column reserved no room for it (underlap) — a **NEW
  "visual occlusion is gate-only" defect class** (geometry/behavior tests measure a transparent element
  perfectly; opacity/z-order is human-eye-only). Fixed pre-close (348eb67: opaque rail + column reservation +
  a real-engine occlusion test that now covers the part an engine CAN read); the root lesson is captured in the
  retro (2026-07-17). Running human-gate score: **6/6** milestone-shipping defects caught across M1+M2+M3.
  **What shipped (one implementation, both surfaces, via the single `mount()` seam):** an in-reader right-side
  TOC rail. Pure `buildTocModel(root)` (h1–h6 refs in doc order, nearest-strictly-shallower-ancestor nesting —
  no synthetic nodes, designed fallback labels, verbatim duplicates) + `buildTocView(host, model, {contained})`
  (`nav` landmark + nested `<ol>`, disclosure-`aria-expanded` collapse, `≥2`-heading threshold-omit,
  `textContent`-only labels, each button carrying its exact `entry.headingRef` via a module-level `WeakMap`).
  Click/Enter scrolls by element ref (`scrollIntoView`, no `behavior` arg → CSS governs); a host-rooted
  scroll-spy (observer + rAF-coalesced scroll, LIVE `getBoundingClientRect`, per-surface root) marks the
  section in view (`aria-current="location"` + `.is-active`); backtick (`` ` ``) toggle via a module host
  registry (distinct from readerMode's `\`, prunes dead nodes, requires a live rail); pointer-drag resize of
  `--toc-w` (per-view). `permissions:[]` intact; zero network on every TOC action. **Measured (group 5):**
  content script **284,744 B** (+13,865 B / +5.12% vs the deliberately-spent M2 270,879 B baseline),
  byte-identical Chromium/Firefox; `pnpm zip` **323.63 kB Chrome / 323.69 kB Firefox, both < 2 MB**. First-paint
  re-run (5.2): **(a) ≤50 KB nav→paint 133.5 ms < 150 ms; (b) 1 MB = the ~1400-entry pathological TOC
  1196.3 ms < 1.7 s** — no regression. `perf:toc` (5.1): rail build ~45 ms @1401 headings, scroll-spy
  ~4.4 ms/frame @1401 — recorded, no threshold asserted (M1 retro rule). **Suites at close:** `pnpm test`
  **350 unit** · `pnpm test:browser` **166** both engines · golden diff **EMPTY** · huge-doc
  `sha256=8bc5094c…e61bbd` intact · `permissions:[]` pinned · lint clean. Carried gaps each have a recorded
  home in decisions.md (contained-surface reduced-motion 2026-07-16 · `\`-app-page inert 2026-07-17 · TOC-tree
  virtualization lever 2026-07-17 — CARRIED, not forced). **M3 (spec 003) is fully closed; next → spec 004
  (themes + settings).**
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

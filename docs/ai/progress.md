# Progress — Peekover
*The file every session reads first. Keep the "Now" section honest.*
*Updated: 2026-07-25.*

> **Closed-milestone narrative lives in [`progress-archive.md`](progress-archive.md).** This file is the
> working set: what is true today, what is next, what is carried, and the current numbers. If you want the
> step-by-step evidence behind a closed milestone, follow the link from its close summary below.
> **Order is deliberate: what to do (Now · Up next · Blockers) comes before what to know (Closed
> milestones · Baselines).**

## Now (start here)

> ### M6 (spec 006 — snapshots + diff) IS OPEN — IMPLEMENTATION UNDERWAY: **groups 1–6 CLOSED; group 7 task 7.1 landed; next action is 7.2 — A HUMAN DECISION GATE.**
> **Nothing is in progress and nothing is blocked. Task 7.1 — MEASURE capture cost + diff render/memory — has landed** (this
> commit). It is the MEASURING task, and it **chose nothing**: no bound, no threshold, no recommendation. Two new harnesses
> (`scripts/perf-snapshot-capture.ts`, `scripts/perf-diff.ts`), two new `perf:*` script entries, numbers below. **No `src/`
> file, no test file and no spec file was touched.** The only gates asserted are the two SHIPPED M1 ones (<150 ms typical
> first paint, <2 MB packaged) — both PASS.
>
> **★ THE HEADLINE IS A MEASUREMENT-RESOLUTION FINDING, NOT A COST.** The like-for-like control (capture OFF vs ON, same
> document, same host, same iteration, differing only in D-12's capture flag) shows the in-situ delta is **BELOW THE NOISE
> FLOOR AT BOTH SIZES** — and that was established, not assumed: **two independent 6-run passes at 1 MB produced deltas of
> OPPOSITE SIGN** (pass 1 −1.7 ms sync / −62.7 ms →2ndRAF; pass 2 +23.8 / +20.3; final pass −3.4 / −15.5). A single 1 MB
> re-render varies 40–90 ms run-to-run, which swamps anything capture adds. **No delta from this cell may be quoted as "the
> capture cost", in either direction.** So the harness gained a cell that measures the component where it IS resolvable: the
> whole synchronous capture guard (`getCaptureFlag()` + two whole-document `normalise()` + compare —
> `watchController.ts:472-480` verbatim) costs **5.0 µs at 50 KB and 47.5 µs at 1 MB**. That is ~4 orders of magnitude below
> the re-render it sits inside, which is *why* the in-situ delta cannot resolve. The 50 KB figure sits at
> `performance.now()`'s own 5 µs granularity floor, so it is an **upper bound**, not a reading. Per retro finding 2 (004's
> isolated probe under-predicted the real path ~13×) the isolated number is reported as a **FLOOR on added work, never as a
> prediction** — both numbers stand, neither replaces the other.
> **The non-vacuity control held on every run:** capture ON stored 2 snapshots per iteration (12 over 6 runs, both sizes);
> capture OFF stored **0**. A cell that failed either check threw rather than reporting.
>
> **CAPTURE'S OTHER TWO COSTS, measured and kept separate from the delta on purpose.** `renderNow` fires
> `void storeSnapshot(...)`, so the IDB write is **off the synchronous path by construction**: awaited directly it is
> **0.6 ms at 50 KB, 10.8 ms at 1 MB**. And a snapshot weighs what the document weighs — capture stores the source, not a
> diff: **50.4 KB and 1.12 MB** respectively.
>
> **★ EVICTION IS ALREADY BINDING AT 1 MB UNDER THE PROPOSED DEFAULTS — recorded as an observation, NOT as a reason to
> change them.** Driving 12 sequential edits through the production controller: at 50 KB the store grew monotonically
> `2,3,4,…,13` (13 snapshots, 659.5 KB, count cap 20 never reached). At 1 MB it grew `2,3,4` and then **stopped at 4 for the
> remaining 9 edits** (4.48 MB) — four 1.12 MB snapshots is 4.48 MB against the proposed 5 MiB global byte bound, so the
> fifth evicts the first. **Whether 4-deep history at 1 MB is the right product answer is exactly 7.2's decision**, and 7.1
> states the observation without a view on it. (The 1 MB run also shows the coalescer working as designed: only 9–10 of 12
> edits rendered, and a render that never happens captures nothing — measured via the reader-source WeakMap, not assumed.)
>
> **THE DIFF AT 1 MB — §1.6's named ceiling, measured through the REAL 6.2 gesture path** (click the real pill → real picker
> over real `snapshotMeta` → click a real item → `fetchText` out of real IndexedDB → `showDiff`; nothing hand-called, the M5
> "wired to nothing" rule applied to a harness). Fixture: every 20th line rewritten — **1961 of 39202 lines (5.0%)**,
> deterministic, producing an identical **5882 hunks (1961 added / 1961 removed / 1960 unchanged) → 5882 blocks on all 7
> runs**. **(a) computeDiff 585.0 ms** (576.2/592.6) · **(b) parse+sanitize over all hunks 433.6 ms** (418.7/515.6) ·
> **(c) DOM construction 122.0 ms — DERIVED** (`enterDiff` with precomputed hunks, 559.7 ms, minus (b); reported as derived
> because 7.1 may not add a mark inside `enterDiff`) · **(d) TOTAL enter, the user-visible number, 1157.4 ms**
> (1129.6/1230.9). (a)+(b)+(c) deliberately do **not** reconcile to (d): (d) also carries two IDB round-trips, event
> dispatch and the browser's own layout of the appended subtree, and that gap is left visible.
> **(e) INTERACTIVE FRAMES — the first scroll after entering a diff costs 442.5 ms** (359.2/528.7), then settles to
> **71.7 / 56.4 / 59.9 / 54.6 ms**. The first frame is where the browser pays deferred layout for the 5882-block subtree.
> Stated, not gated — no threshold exists for it and 7.1 invents none.
> **MEMORY is DIRECTIONAL ONLY** and the caveats are load-bearing: Chromium-only `performance.memory`, **V8 heap only — DOM
> nodes are NOT counted**, GC-timing dependent, and taken with a non-default `--enable-precise-memory-info` flag. Heap at
> rest **14.42 MB**; before→after enter **+35.95 MB median but +8.92/+77.11 MB across runs**; net before→after exit
> **−861.1 KB median (−27.75/+29.17 MB)**. The spread is printed beside every median precisely because a single confident
> median here would be a fiction. A small heap delta is **not** evidence the diff is cheap in memory.
>
> <details><summary>Task 6.3 — D-11, the diff-defer + the "changed again" line (landed previously; CLOSED group 6)</summary>
>
> **THE WATCH LOOP NOW KNOWS A DIFF IS ON SCREEN, AND REFUSES TO RENDER UNDER IT.** `onText` gains one condition —
> the host carries D-15's `data-diff`, so the text takes the coalescer's single pending slot and **no timer is
> armed**. On exit the withheld text renders and the reader is told the document moved: **"This document changed
> again while the comparison was open — the newer version is shown above."** Both halves are the decision; the plan
> says so in as many words (*"a document that changed with no indication is the same dishonesty one layer over"*),
> and the line is gate-3-approved copy (decisions.md 2026-07-23) whose legibility is still a **9.1 human-gate item**.
> **THREE DIVERGENCES FROM THE 6.2 POINTER'S SKETCH, each argued in tasks.md 6.3 and none silent:**
> **(a) THE LINE IS A WATCH NOTE, ON EXIT — not a sentence inside the diff view.** The sketch's placement needs
> `diffView.ts`, which 6.1 sealed and this task's own fences require byte-identical; and a line rendered *inside* the
> comparison would be telling the reader about a document they cannot see yet. `setWatchNote` already carries exactly
> this semantic (4.3's dead read, 4.4's unavailable surface), renders WITHOUT a re-render, and needed no new chrome —
> **D-3's toast rejection stands.** Order is load-bearing: render first, line second, because the line points at the
> document ("shown above").
> **(b) EXIT IS A `MutationObserver` ON `data-diff`, not a call into `flushPending`.** There is more than one way out
> of a diff — the 6.2 pill, `mount.ts`'s two D-15 clears, whatever a later task adds — and an explicit signal threaded
> through each of them would strand the deferred text on the one that got missed. The observer holds no policy: it
> reads the attribute and flushes. **`watchController.ts` imports none of `./diffView`, `./diffEngine`, `diff`** —
> the attribute IS the seam (5.1 fence Clause C), so the name is a literal here and an export there, and a **drift
> check** unit-asserts the two still agree. That check is the whole price of not importing, and it is paid in a test
> file, which the fence exempts.
> **(c) A HOLE THE SKETCH MISSED, FOUND AND CLOSED — `flushPending` needed the guard too.** A cooldown timer armed
> moments *before* the diff opened is still in flight when it does, and it never passes through `onText`; it would
> have replaced the comparison a beat later. It now CONVERTS to a deferred text instead of rendering. Unit-cased.
> **RED-FIRST, BOTH HALVES, BOTH ENGINES (the plan demanded a different case each).** Deleting `onText`'s condition
> reds *"the diff was torn down: expected null to be 'active'"* — the re-render replaced the comparison and `mount`'s
> D-15 clear took the attribute with it (2 browser + 6 unit cases). Neutering the exit flush reds *"the withheld
> change never reached the reader"*, and with that assertion lifted, *"the deferred render did not capture the state
> that was on screen"*. The capture half is non-vacuous: the exit render stored the state the reader LEFT (V2),
> leaving 2 snapshots where the seeded 1 stood — §3.5's per-render invariant intact, nothing lost.
> **BYTES:** content-script 314688 → **315143 B both engines (+455)**; app chunk 359969 → **360422 B (+453)** — an
> observer install/teardown, one condition in each of two functions, one string constant. Content-script grep for
> `diffLines|jsdiff|computeDiff|enterDiff|exitDiff|renderHunk|diffWords|diffChars|structuredPatch`: **0**. The 5.1
> fence pin is **15/15 green with allowlists UNCHANGED** — 6.3 added a consumer of the diff feature that imports
> nothing from it.
> **`permissions: []` stands. `diffEngine.ts`, `diffView.ts`, `diffRegistry.ts`, `diffChrome.ts`, `mount.ts`,
> `appShell.ts`, `watchControl.ts`, `watchRegistry.ts`, `contentWatch.ts`, `diffEngine.test.ts` ALL BYTE-IDENTICAL**
> — the whole task landed inside `watchController.ts`. `Settings`/`getSettings`/`putSettings` byte-identical (thirteen
> tasks now). Unit 540 → **549**; browser 601/15/72 → **605/15/74**. Golden EMPTY. M1–M5 remain fully closed.
>
> <details><summary>Task 6.2 — the diff AFFORDANCE (landed previously)</summary>
> `buildDiffChrome(host)` returns the affordance where a diff context is registered and **`[]` — with NO note branch — where
> none is** (D-14). `mount.ts` gains one import and one `children.push(...)` beside `buildWatchChrome`. The click flow:
> `fetchMeta` → an inline `role="listbox"` picker → `fetchText` + `getCurrentSource` → the diff → `data-diff="active"`.
> Exit is the SAME pill (its label and aria-label move with the state, so the change is never colour-only).
> **★ THE ENGINE ENTERED PRODUCTION — and the fence forced a DIFFERENT provisioning path than the 6.1 pointer predicted.**
> The 6.1 note said the affordance would "call `enterDiff`", i.e. import the VIEW directly. It does **not**, and it must not:
> plan §1.4 fences **three** modules off the content-script graph — `diff`, `diffEngine.ts` **and `diffView.ts`** ("Imported by
> `appShell.ts`, never by `mount.ts` — `mount.ts` importing it would drag the view into the content-script graph and put the
> hole back in the fence"), and tasks.md 6.2's Verify says it outright: *"`mount.ts`'s graph excludes `diff`/`diffEngine`/
> `diffView`"*. Since `mount.ts` imports the affordance, the affordance may import **none** of the three. So the DiffContext
> gained **two coarse closures** — `showDiff(host, before, after)` / `hideDiff(host)` — that `appShell.installWatchForFile`
> provisions; `appShell` is the one production file importing **both** `computeDiff` and `enterDiff`/`exitDiff`. The closures
> are coarse on purpose: a `computeDiff` + `enterDiff` pair would have to carry `DiffHunk` across the fence for no benefit,
> since the affordance only hands hunks straight on. **The hunks never cross.** `DiffOutcome` is a local structural mirror of
> `DiffEnterResult` for the reason 6.1 recorded (the fence is a source-text scanner, so even `import type` reads as an import).
> **FENCE PIN: `ALLOWED_ENGINE_IMPORTERS` `[]` → `['src/app/appShell.ts']`, and a NEW `ALLOWED_VIEW_IMPORTERS` clause C +
> a "diffChrome.ts imports none of the three" clause + two non-vacuity checks (12 → 15 checks).** Clause C is load-bearing,
> not decoration: red-first proven — adding `import { enterDiff } from './diffView'` to `diffChrome.ts` reddens exactly 2,
> and under the pre-6.2 pin that violation would have passed silently.
> **PLACEMENT — top-left, `top:56px;left:16px` (picker at `:94`), measured on the CONTAINED pane.** A first probe measured the
> FULL-PAGE reader (what every other pill in readerCss.ts was measured against), "cleared" top-left, and was **wrong**: D-14
> ships this chrome to the **app page only**, and under CONTAINED_CSS the pills are `position:absolute` inside a
> `:host{position:relative}` box that is the whole DOCUMENT's height. Re-measured there (rail forced open — its width rule
> stomps an early `data-toc` a frame later; 8- and 30-heading docs; both engines): bottom-left `:216`/`:256` land inside the
> 3.1 capture disclosure **and no step fixes it** (its height is text-wrap dependent — 110px at 1280, 182px at 414); top-right
> `:56` hits the TOC handle; top-left `:16` is the remote-load slot; bottom-right sits on the opaque rail and its picker
> expands into the aside stack. Probe **deleted** (the 4.1 rule). Geometry asserted at WIDE, deliberately **not** at 414×896,
> where the app pane leaves the host 146px — narrower than one pill — and the existing stack **already self-overlaps**
> (a pre-existing 3.1-era condition, recorded rather than papered over).
> **BYTES:** content-script 307892 → **314688 B both engines (+6796)**; app chunk 343632 → **359969 B (+16337)**.
> **Fence proven by controlled experiment, not just grep:** rebuilding with `appShell`'s engine+view imports removed drops the
> app chunk to 350470 B (**−9499** = the engine + view + `diff`'s tree-shaken `diffLines`) and leaves the content-script bundle
> **byte-identical at 314688**. Positive discrimination too: diffView's literals (`no reader shadow root to show a diff in`)
> appear in the app chunk (1) and **not** in the content script (0). The shared +6796 is `diffChrome`'s code plus the CSS —
> and note **readerCss.ts comments ship verbatim** (they sit inside a template literal), which cost ~8 KB in a first draft
> until the placement rationale was moved into `diffChrome.ts` where the minifier strips it. Officially re-measured at 8.1.
> **`permissions: []` still stands; `diffEngine.ts` and `diffView.ts` BYTE-IDENTICAL (5.1 and 6.1 sealed — 6.2 only USES
> them); `watchController.ts`, `watchControl.ts`, `watchAvailability.ts` byte-identical; `mount.ts` gains exactly two code
> lines; `appShell.ts` gains two imports and two object fields; `Settings`/`getSettings`/`putSettings` byte-identical;
> `DB_VERSION` is 3.** Unit 519 → **540**; browser 577/15/70 → **601/15/72**. M1–M5 remain fully closed.
> </details>
> </details>
>
> **THE NEXT ACTION IS TASK 7.2 — A HUMAN DECISION GATE. AN AGENT CANNOT DO IT.** 7.2 is where **the human picks D-8's
> bound VALUES** — `SNAPSHOT_COUNT_PER_DOC`, `SNAPSHOT_TOTAL_BYTES`, `SNAPSHOT_MAX_AGE_MS` (`snapshots.ts:61/77/93`,
> currently the PROPOSED 20 / 5 MiB / 30 days, explicitly not chosen). **The AXES are not reopened** — D-16 settled them
> (count per-document, bytes and age global) and 7.2 decides only the numbers. The choice is recorded in
> `docs/ai/decisions.md` **before** 7.3 sets the constants; no code lands on an assumed number.
> **7.1 deliberately offers no recommendation, and the next session must not read one into its numbers.** Do not treat
> "eviction bound at 4 snapshots at 1 MB" as an argument for any particular byte bound — it is an observation about what
> the proposed default does, which is the input to the decision, not the decision. A bound inferred from a measurement
> is exactly the 004 4.1 failure this three-task split exists to prevent, and a soft "seems about right" is the same
> failure arriving a beat later.
> **What 7.2 has to work with** (all above, all Chromium): per-snapshot bytes ≈ the document's own size (50.4 KB / 1.12 MB);
> 13 snapshots from 12 edits at 50 KB with the count cap never reached; 4 snapshots retained at 1 MB with the byte bound
> binding from the 4th edit on; the synchronous capture guard at 5.0 µs / 47.5 µs; the awaited write at 0.6 ms / 10.8 ms;
> and the diff at 1 MB entering in 1157.4 ms with a 442.5 ms first interactive frame.
> **Re-run either harness any time:** `pnpm perf:snapshot-capture -- --no-build`, `pnpm perf:diff -- --no-build`. Neither
> emits an exit-code gate — they are informational by design (only `perf-first-paint.ts` owns a hard gate, because
> <150 ms is a shipped M1 acceptance gate).
> **The Now-pointer advances PER TASK** (the M1 rule — it once lagged four tasks and the next session acted on stale state).

## Up next

### 006 — snapshots + diff · `tasks.md` is the OPERATIVE artifact; the plan is the HOW, the spec the WHY

**What it is:** the second half of the watch feature area. 005 shipped watch; **006 stores snapshots and
diffs against them.** It gets its **own full Gear-3 cycle** — the split (D-1) was taken at 005's plan gate
precisely so this would be planned rather than inherited.

- **★ THE WHAT IS SETTLED — `specs/006-snapshots-diff/spec.md`, approved at gate 1 (2026-07-22). Read it
  first.** It supersedes the spec-level material previously pointed at here: 005's **§3.3 / §3.4** and its
  §4 criteria marked *deferred to 006* carried forward into it, and 005 §3.4 plus one §4 criterion are now
  **struck through and annotated** where 006 amends them (retention limits are disclosed defaults, not
  user-adjustable).
- **★ THE HOW IS SETTLED — `specs/006-snapshots-diff/plan.md` (revision 2), approved at gate 2
  (2026-07-23).** §0 holds sixteen decisions D-1…D-16 (also in `decisions.md`, C5); §0.1's two open
  questions are now settled and logged (gate 3, `decisions.md` 2026-07-23). **`tasks.md` (gate 3) is the
  OPERATIVE artifact now — work its boxes in order; the plan is the HOW and the spec the WHY.** The guidance
  below still applies.
- **Plan-level starting points, written for 006 and standing:** `specs/005-watch-diff/plan.md` **§1.7**
  (the two-store IndexedDB split that dodges `idbCore`'s STOP signal), **§1.8** (the line-diff engine and
  the diff view — diff output goes through the existing sanitize path like any other rendered content),
  and **§3-5** (snapshot bound defaults are proposed with reasoning, **tuneable, not gated**).
- **`DB_VERSION` 2 → 3.** 005 deliberately did not touch it (D-1). The `idbVersionchange` suite is exactly
  the guard for an additive upgrade preserving existing rows.
- **★ THE `diff` DEPENDENCY — APPROVED at the 005 plan gate (D-2) but DEFERRED to here. It is the FIRST
  `dependencies` addition since M1**, so adding it is a governed act, not a convenience. 005 shipped with
  three and every task re-proved it.
- **★ THE PERMISSIONS.md TRUST-CLAIM CORRECTION, which is an AGENTS.md #4-weight event even though no
  manifest permission changes.** *"File contents are never stored"* appears in **three places** in
  `docs/trust/PERMISSIONS.md` and becomes **FALSE** the moment the first snapshot is stored. **It is
  corrected in the SAME PR as that code.** It was left alone through all of 005 deliberately — in 005 the
  claim is TRUE, and correcting it early would have made the document wrong in the other direction.
- **`permissions: []` is expected to survive this milestone too.** `tests/manifest.test.ts` has been
  byte-unmodified since M2 (`3b6c575`); if any 006 capability seems to need a manifest permission, that is
  a **STOP-and-flag**, not a task.
- **The M5 retro findings that bear on 006 directly** (`retro.md` 2026-07-21 — read it, do not rely on
  this summary):
  - **The *built-tested-and-wired-to-nothing* class and its call-site pin.** It hit **three times** in 005
    because every watch test registered its own target before mounting, so no test ever asked which target
    *production* registers. **006 adds more registration seams** (snapshot store, diff view) — at least one
    test per seam must drive the **production entry path**.
  - **The `mount()` boundary answer. 006 touches `mount()` again** for the diff view. 005 crossed it more
    cheaply than plan §4-1 feared, and the reasons are structural and reusable: **additive, defaulted-off,
    read at exactly one site, with the OLD behaviour red-first proven.**
  - **Red-first is a COUNT and a REASON, not a colour.** Twice in 005 a break that stayed green revealed a
    **second independent guard** nobody knew about.
  - **An entrypoint wires; it does not decide or construct** — a WXT entrypoint imports `#imports`, so no
    Vitest project can load one. Logic there is untestable by construction.
- **Before the first task of any group, re-read the standing rules that keep costing time when skipped:**
  `docs/ai/decisions.md` (the harness ledger, the dead ends, the both-engines gate procedure) and
  `docs/ai/retro.md` (newest entry first).

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
**006 snapshots + diff ← NEXT** · … full order in `docs/product/spec.md` §Phase-1.

## Blockers / open questions

- **NOTHING IS BLOCKED AND NOTHING IS WAITING ON A HUMAN.** M5's three human gates (2.3, 5.2, 7.1) all
  ran and are recorded. The next human gate is **006's spec gate 1**, which is the start of the next
  milestone rather than a remainder of this one.
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
    harness number is an OPFS inference (confirmed once, at 5.1a — see § Baselines).
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
7/7**, its first move since M3, confirming M4's keep-the-gate reasoning **by instance**: the item M4 kept
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

**The human-gate score: 7/7** (was 6/6 across M1+M2+M3, with M4 contributing zero defects and zero
misses). **Seven milestone-shipping defects, ALL SEVEN caught by the milestone-close gate, NONE escaping
it.** **M5 contributes the seventh: task 4.8** — watch on the content-script `file://` surface detected
every change and rendered none of them. **The sharpest fact about it: it was found in the FIRST FIVE
MINUTES, on the FIRST item checked, on the surface the automated stack provably cannot reach** (no test on
any milestone has ever exercised the real content→background transport). Read the ratio precisely: it says
every known shipping defect was caught **here**, not that the gate catches everything — the denominator
only counts what someone eventually found. *A clean gate is evidence about the BUILD, not about the GATE*
(retro 2026-07-19); M5 is the inverse case, and it is evidence about the GATE.

**Product progress (rough):** M1 opened build-order phase 1-of-7 (product spec §11). Spec-level
milestones are finer than the 7 phases (roadmap after 001: 002 sources · 003 TOC · 004 themes+settings ·
005 watch · 006 snapshots+diff · … ~a dozen to v1.0), so a precise product % is **deferred** — honestly
this is early foundation, **~fifth of ~12+ spec-milestones**. Don't over-read the fraction.

## Baselines / pins
*Current measured truth, as of the M5 close (task 6.1, 2026-07-21). This section is MUTABLE — each
milestone's close task overwrites the numbers and moves the previous ones into the "vs" column. It lives
here, not in decisions.md, because decisions.md is dated append-only and a current-numbers table cannot be
corrected there without either lying or duplicating.*

| pin | at M5 close (005) | vs M4 close | bound | verdict |
|---|---|---|---|---|
| First paint, typical doc (50.4 KB) | **138.6 ms** (2nd pass **135.8 ms**) | 137.7 ms | <150 ms **GATE** | **PASS** |
| First paint, 1 MB / ~1400-entry TOC | **1183.8 ms** | 1248.6 ms (**−64.8 ms**) | <1.7 s (informational) | PASS |
| Content script (`.output/chrome-mv3/`) | **299,411 B** | 288,654 B (**+10,757 B, +3.73%**) | none — **stated, not gated** | — |
| App-page chunk (`chunks/app-*.js`) | **332,895 B** | 320,086 B (**+12,809 B, +4.00%**) | none — **stated, not gated** | — |
| Background (`background.js`) | **3,315 B** | 2,437 B (**+878 B, +36.0%**) | none — **stated, not gated** | — |
| `pnpm zip` Chrome / Firefox | **335.89 / 335.95 kB** | 327.61 / 327.66 kB (**+8.28 / +8.29 kB**) | <2 MB | PASS |
| Suites | 456 unit · 499 passed / 15 skipped browser, 54 file-instances (both engines) | 384 · 314 | — | green |

**M6-post-7.1 (2026-07-26) — measured fresh at task 7.1, on the 006 tree at `a873b8d` + 7.1.** M6 is still OPEN, so this
is a progress reading, not a close; the M5-close row above stays the pinned baseline until group 8 re-measures
officially. Format is `M6-post-7.1 vs M5-close ; delta`.

| pin | M6-post-7.1 | vs M5 close | bound | verdict |
|---|---|---|---|---|
| First paint, typical doc (50.4 KB) | **144.3 ms** (2nd pass **145.1 ms**) | 138.6 ms (**+5.7 ms**) | <150 ms **GATE** | **PASS** |
| First paint, 1 MB | **1270.4 ms** | 1183.8 ms (**+86.6 ms**) | <1.7 s (informational) | PASS |
| Content script (`.output/*/content-scripts/peekover.js`) | **315,143 B** both engines | 299,411 B (**+15,732 B, +5.25%**) | none — **stated, not gated** | — |
| App-page chunk (`chunks/app-cheLPYz6.js`) | **360,422 B** both engines | 332,895 B (**+27,527 B, +8.27%**) | none — **stated, not gated** | — |
| Background (`background.js`) | **3,435 B** both engines | 3,315 B (**+120 B, +3.62%**) | none — **stated, not gated** | — |
| `pnpm zip` Chrome / Firefox | **349.17 / 349.23 kB** | 335.89 / 335.95 kB (**+13.28 / +13.28 kB**) | <2 MB | **PASS** |
| Suites | 549 unit · 605 passed / 15 skipped browser, 74 file-instances (both engines) | 456 · 499/15/54 | — | green |

- **THE <150 ms GATE HELD ACROSS TWO INDEPENDENT 7-ITERATION PASSES** — medians 144.3 / 145.1 ms, no warm iteration
  over the bar in either (maxima 149.2 / 150.0 ms; the 150.0 is a max, not the gated median). **HEADROOM IS NOW
  ~5 ms AND THE FLOOR MOVED:** floor across both passes is **138.9 ms**, against M5's recorded floor of 132.0 ms —
  **+6.9 ms on the FLOOR**, and the standing protocol says signal-vs-noise is decided on the floor, not the middle.
  Recorded as a fact, **not** interpreted here: 7.1 asserts the gate result and nothing beyond it. **The next
  perf-touching session should assume NO headroom.** (006 is app-page-only, so the diff feature never enters this
  gated content-script path — the growth above is 006's shared chrome/CSS, officially attributed at 8.1.)
- **The 1 MB line still prints `-> FAIL`** for the known reason (it compares the 1 MB fixture against the
  *typical-doc* bar and self-labels the comparison informational — decisions.md 2026-07-14). Against its OWN
  <1.7 s bound the verdict is **PASS**. Not a breach, not a regression.
- **THE IMPORT FENCE HOLDS BY MEASURED BYTES, BOTH ENGINES:** content-script grep for
  `diffLines|jsdiff|computeDiff|enterDiff|exitDiff|renderHunk|diffWords|diffChars|structuredPatch` = **0** in
  `.output/chrome-mv3/` AND `.output/firefox-mv3/`. `permissions: []` on both built manifests.
- **`pnpm zip` still emits the third, non-bound artifact:** the Firefox run also writes
  `peekover-0.0.0-sources.zip` (**3.93 MB**, was 3.39 MB) — the source archive AMO requires for review, not a
  shipped package. The <2 MB bound is on the extension zips (349.17 / 349.23 kB).
- **No port override was needed this session.** `pnpm test:browser` ran clean on the default port; the recorded
  `EACCES ::1:63315` collision (decisions.md 2026-07-21) did not reproduce, and `vitest.config.ts` is
  **byte-unmodified**. Both new perf harnesses host nothing (they drive `file://` and `chrome-extension://`), so
  the collision cannot arise there by construction.
- **`perf:toc` re-run (jsdom, informational, no gate):** rail build 3.796 ms at 1401 headings / 5.740 ms at 2000;
  scroll-spy recompute 4.394 ms and 7.094 ms per frame. Run because 006 adds chrome to the same `mount()`
  composition path and `diffChrome`'s placement was measured against the TOC handle. `perf:folder` and
  `perf:flash` were **not** run — no 006 code reaches the folder-tree or theme-flash paths, and saying which
  harnesses were skipped and why beats an unexplained gap.
- **7.1's own new measurements** (capture cost, the isolated D-5 guard, snapshot sizes/accumulation, the diff at
  1 MB, memory) are in the **Now** section above, with their caveats attached. They are **inputs to 7.2's human
  decision**, and **no bound is chosen or recommended anywhere in them**.

- **THE FIRST-PAINT GATE HELD ACROSS TWO INDEPENDENT 7-ITERATION PASSES, with no warm iteration over the
  bar in either** (max 144.5 ms) — where the M4 close's own second pass had one at **150.9 ms**. Called
  **NOISE, not regression, on the FLOOR**: the floor across both passes is **132.0 ms**, at/below M4's
  recorded min of 132.6 ms. *(Full pass-by-pass evidence: archive § M5, and `tasks.md` 6.1.)*
- **HEADROOM IS STILL THIN and the next perf-touching session should assume none.** The budget sits
  **~11–14 ms from its ceiling** on this hardware (i7-13700, Windows, headless Chromium). That is not
  better than M4's ~7–12 ms by any real amount; it is the same reading with a different noise draw.
- **The M4 app-chunk baseline DID NOT EXIST and was MEASURED, not estimated** — a throwaway `git worktree`
  build of `70bb8ef` (M4 close). **The method validates itself:** that build reproduced the recorded
  content-script baseline **exactly, 288,654 B to the byte**, so the "vs M4" column for the app chunk comes
  off a build proven to be the one the recorded numbers came from.
- **Every first-paint number here is CHROMIUM.** `perf-first-paint.ts` cannot drive Firefox
  (decisions.md 2026-07-19, harness ledger). Firefox first paint is evidenced only by the human gate.
- **The 1 MB harness line prints `-> FAIL`** because it compares the 1 MB fixture against the *typical-doc*
  bar and self-labels the comparison informational. That is the known ~8× reading (decisions.md
  2026-07-14), **not** a breach. Do not read it as a regression. **Re-confirmed verbatim at 6.1:**
  `gate [1.12 MB, large-doc (informational vs typical-doc gate)]: (a) median 1183.8ms vs <150ms -> FAIL`.
  The verdict against the number's OWN bound (<1.7 s) is **PASS**.
- **Standing pins, all green at the M5 close (task 6.1, 2026-07-21):** `git diff tests/golden/output/`
  **EMPTY** · `tests/manifest.test.ts` **8/8 and byte-unmodified since M2** — last touched at `3b6c575`
  (M2 / the app-page commit), so `permissions: []` is re-proven by a test no watch task could have bent ·
  huge-doc `sha256=8bc5094c…e61bbd` intact · `pnpm lint` clean · `pnpm test` **456** ·
  `pnpm test:browser` **499 passed / 15 skipped, 54 file-instances, both engines** (task 4.8 contributed
  +4 unit pins, +9 browser tests × two engines, +1 new browser file × two engines).
- **`pnpm zip` produces a THIRD artifact that is NOT the bound, stated so it is not misread:** the Firefox
  run also emits `peekover-0.0.0-sources.zip` (**3.39 MB**) — the source archive AMO requires for review,
  not a shipped package. The <2 MB bound is on the extension zips (335.89 / 335.95 kB).
- **One environment note, unchanged and still local-only:** `pnpm test:browser` hit the recorded
  `EACCES ::1:63315` Windows reserved-port collision (decisions.md 2026-07-21). The documented
  **local-only** `browser.api.port` override was applied for the run and **stripped before commit** —
  `vitest.config.ts` is unmodified apart from 4.5's `fileParallelism: false`.
- **Measurement protocol (unchanged since M1 — keep it, so numbers stay comparable):** 7 iterations, run 1
  discarded as cold, **median of the warm 6**, min/max as spread. **No threshold is ever asserted from a
  measurement task** (standing M1 retro rule). **Signal-vs-noise is decided on the FLOOR, not the middle**
  — real added cost raises the floor; noise moves only the middle (the M4 precedent, applied again at 6.1).
- **A pin certifies exactly the stage it observes.** "Golden diff EMPTY ⇒ the reading column is untouched"
  is **FALSE** — that suite snapshots `sanitize(parse(source))`, upstream of `mount()`, and stayed empty
  through the 5.1 chrome addition. Before citing a pin as evidence, break the property and check it goes
  red (retro 2026-07-19, finding 3).

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

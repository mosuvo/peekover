# Tasks 006 — Snapshots + diff — check off in order; add discovered tasks BELOW the line they came from
*Gear 3 tasks stage — **APPROVED (Gear-3 gate 3 passed 2026-07-23); implementation NOT YET STARTED — it begins at task 1.1 in a fresh session.** This file is the live go-signal*
*(WORKFLOW.md §5.3). Approved upstream: `spec.md` (gate 1, `528200c`) + `plan.md` revision 2 (gate 2,*
*`6bde96f` — one commit that landed the plan AND two spec amendments AND D-1…D-16 in `decisions.md`). CC*
*commits per task (one commit, `-F` heredoc, `Co-Authored-By: Claude` trailer); the human reviews the pasted*
*evidence and pushes. Each capability gets its OWN real-engine test (`tests/browser/*`, Chromium + Firefox,*
*red-first + non-vacuous) — never a trailing "add tests" task. Layout, rAF, computed style, pointer geometry,*
*bytes-on-wire and cross-context messaging are jsdom-**BLIND**: proven in the real engine, never in jsdom.*

**Standing discipline — carried into every task's Verify line, not restated per line unless it varies:**
- **Golden + manifest pins, EVERY task:** `git diff tests/golden/output/` **EMPTY** AND `tests/manifest.test.ts`
  green and **byte-unchanged** (`permissions: []` on both built manifests). A golden diff, or a needed manifest
  edit, = **STOP and flag** — do NOT re-baseline. **THE 5.1 CORRECTION OF RECORD, and 006 is mostly chrome:
  an empty golden diff proves NOTHING about the diff affordance or its placement.** That suite snapshots the
  pre-mount `sanitize(parse(source))` string, a stage **upstream of `mount()`** that never observes chrome
  (measured at 004's 5.1 and re-proven at 005's 4.1). **Placement/attachment is guarded by a STRUCTURAL DOM
  assertion, and that assertion is the SOLE guard, not a duplicate of the golden pin.**
- **The import fence, EVERY task from group 5 on:** `diff` (and `diffEngine.ts`, `diffView.ts`) appear in **no
  content-script module graph** (§1.4). Asserted **statically** (a graph/import test) AND cross-checked against
  the **measured content-script byte delta** (group 8). If `diff` ever appears in the content-script bundle =
  **STOP and flag** — the fence broke, and §3.2 with it.
- **Real-engine (Chromium + Firefox), red-first + non-vacuous** for anything jsdom cannot see, via `describe.each`
  over both surfaces — **one parameterised suite, never two hand-written ones** (they drift). **RED-FIRST IS A
  COUNT AND A REASON, NOT A COLOUR** (M5 finding 2): name what must go red and **how many things**; a break that
  stays green, or reddens the wrong count, is a finding, not a relief. Every ABSENT/UNCHANGED/RESTORED assertion
  carries a live positive control or measured-fallback probe (the vacuous-persistence test and the `remoteMedia`
  positive-control flake are the same defect class).
- **At least one test per registration seam drives the PRODUCTION entry path** (M5's "built, tested, wired to
  nothing" — three instances). 006 adds a second registry (D-14) and D-2 generalises the pin to call-site
  granularity precisely because the existing one is file-scoped. **An entrypoint wires; it does not decide or
  construct** (a WXT entrypoint imports `#imports`, so no Vitest project can load one).
- **★ Byte-level NUL check on any task that writes the `SEP` literal — and the rule is MECHANICAL, not
  attentional.** This has now bitten TWICE (in `plan.md`, and in this file's own warning bullet), both times
  in a session that had just documented the hazard — same class as `-m` vs `-F` in M5, where five malformed
  subjects survived everyone knowing. **Never write the escape sequence; write the value as words.** `SEP` is the six visible characters
  `backslash-u-0-0-0-0` — the VALUE WRITTEN AS WORDS, never the escape sequence itself and never an
  embedded NUL control byte (`recents.ts:40-42`). AGENTS.md #control-chars
  forbids the byte, and a real NUL is invisible in every normal diff (one was introduced and excised while
  `plan.md` was being edited). The check reads the file's NUL byte count and **must read zero**. State a
  discriminator that could DISPROVE it (`grep -c $'\0'` does NOT count NULs in Git Bash — it collapses to empty
  and matches every line; use `python -c "print(open(p,'rb').read().count(b'\x00'))"` or `tr -cd '\0' | wc -c`).
- **BEFORE ANY red-first mutation, `cp` the target file aside FIRST and restore from that copy.** NEVER
  `git checkout <path>` to undo a deliberate break while uncommitted task work lives in the same file — that
  destroyed group 4's paint gate in M4.
- **Progress.md's Now-pointer advances at EACH task, in the task's own commit** (M1 rule — it once lagged four
  tasks and the next session acted on stale state). Group 9 is its FINAL reconciliation, not its first.
- **Stage explicit paths. NEVER `git add -A` / `git add .`** — `specs/recon-006-gate2.md` is untracked in
  `specs/` and must not be swept in. **Windows reserved-port note:** a local-only `browser.api.port` in
  `vitest.config.ts` dodges the `EACCES ::1:63315` collision; **never committed**. The browser project runs
  **serial** (`fileParallelism: false`) — do not weaken a geometry assertion to buy back runtime.

**Plan-gate decisions locked by the human — encoded here, not re-opened (D-1…D-16, plan §0):**
- **App-page only (§3.2).** `docId = folderId + SEP + path`; the content script has no `folderId`, so it
  constructs no `docId` and captures nothing. The content-script `url` form 005 sketched is NOT built.
- **`dependencies` goes three → four: `diff` is added (D-2, approved at 005's plan gate). Nothing else.** Any
  other dependency, or any manifest permission, = **STOP and flag** (AGENTS.md #4).
- **Zero network** across capture, eviction and diff — reuse the existing `/^https?:/i` predicate **verbatim**,
  never a new one. **Sanitization unchanged** — both sides of every diff go through `parse → sanitize`
  (`mount.ts:116`, AGENTS.md #3). **Never blank** (AGENTS.md #5) — the diff fallback keeps the last render on
  screen.
- **`changeDetector.ts` is NOT touched (D-5).** `idbCore.ts` is NOT touched (§1.2's meta-first ordering removed
  the need). `wxt.config.ts` is NOT touched (D-9). `entrypoints/*` are touched for WIRING only.
- **Two gate-3 product decisions, settled by the human, carried here:** the D-11 *"this document changed again"*
  line **SHIPS** (its legibility is a group-9 human-gate item); a document's snapshots **SURVIVE** its recents
  row being auto-evicted (§9 — history stays, disclosed by bytes in the panel; no task, recorded in
  `decisions.md` with the gate-3 landing commit alongside the gate-2 entry's grouping-precedent correction in the same file).

**Human-run items budgeted UP FRONT (plan §5; enumerated again at 9.1, not discovered late):** whether the
persistent capture disclosure reads as honesty or nagging (load-bearing for D-12) · whether D-11's "changed
again" line reads as useful or noise · whether the inline diff is legible at real document sizes · `--del`'s
second semantic as diff-removed vs the lit network indicator · the diff affordance's discoverability ·
**app-page responsiveness after 006** (§4-3 — no harness covers it) · **Firefox everything** (Playwright cannot
load an extension into Firefox) · zero unexpected network with the Network tab open. **Plus two human decision
gates:** D-8's bound numbers (7.2, after 7.1's measurement; D-16's axis is already decided so only the numbers
go to the gate) and the milestone-close gate (9.1).

---

## 1 — Storage, capture, and the trust correction (honest storage, end-to-end)

*This group is deliberately end-to-end. Its two HARD ordering constraints, both from the spec not convenience:*
*(1) **the trust correction lands in the same commit as the first code that STORES a snapshot** (§3.3, §7-10) —*
*else a pushed commit ships storage while `PERMISSIONS.md` says contents are never stored; (2) **the storing*
*commit is also the commit that makes every trust surface account for the new state** — the panel reports it,*
*`wipeAll` clears it, revoke erases it — else an intermediate pushed commit hides or fails to erase stored*
*contents. 1.1–1.3 store nothing and precede it; 1.4 is the irreducible storing commit; 1.5–1.6 are additive*
*controls.*

- [x] **1.1 Schema — `DB_VERSION` 2 → 3, two stores, and the versionchange-preserves-rows gap (§3-4).**
      Add `snapshotMeta` (keyPath `docId`, `{docId, entries:[{id, ts, bytes}]}`) and `snapshots` (keyPath `id`,
      `{id, text}`) to `STORES`/`SCHEMA`, bump `DB_VERSION` to 3. Additive-by-name, no migration code
      (`idbCore.ts:56-63`); `onversionchange` close-and-drop already covers the bump. **This task STORES
      NOTHING** — the stores are empty, the trust claim is still true, so no correction here.
      **The gap this closes:** the existing `idbVersionchange` suite proves the versionchange choreography on
      throwaway DBs and asserts **nothing** about existing rows surviving an upgrade (§3-4). 006 bumps a version
      that real users' data will cross.
      Files: `src/app/store.ts` · `src/app/store.test.ts` · `tests/browser/idbVersionchange.browser.test.ts`
      Verify: (**unit**) the two stores exist in `SCHEMA` at version 3, correct keyPaths. (**tests/browser** —
      Cr+Fx) seed a v2 DB with rows in the pre-existing stores, open at v3, assert **the existing rows survive**
      and the two new stores are present and empty. **Red-first (1 thing, reason named):** a `SCHEMA` that drops
      or renames an existing store makes the row-survival assertion fail — prove it goes red before the correct
      additive schema makes it green. Golden EMPTY · manifest green + byte-unchanged.

- [x] **1.2 `snapshots.ts` — byte accounting + the eviction algorithm (pure), split from the IDB calls.**
      The bounds/eviction maths is pure arithmetic over `snapshotMeta.entries` so it is jsdom-testable; the IDB
      read/write is a thin separate layer. **Bytes:** `new TextEncoder().encode(text).length` (synchronous,
      exact), written into `entries[].bytes` at capture so eviction never reads content. **Algorithm, as ONE
      specified thing** (§1.2, axes fixed by D-16 — **decided, not chosen here**): before a write, the
      single-oversized case short-circuits (one snapshot over the global byte bound alone is not stored, nothing
      evicted); after a write, evaluate all three bounds against `snapshotMeta` alone and delete **oldest-first**
      until all three hold simultaneously — **count per-document, bytes and age global**. **★ Deletion ordering:
      META FIRST, then content** (§1.2, and the reversal from revision 0 is the point): a meta entry pointing at
      missing content lands in §4's already-required "comparison unavailable" state and is self-reclaiming
      (lazily); the opposite ordering orphans content the byte-accounting can never see, under-reporting usage
      indefinitely, the one direction a trust surface must never fail in.
      **D-8: PROPOSE the bound defaults with reasoning, as named tuneable constants. This task is FORBIDDEN from
      treating them as chosen** — the choosing is 7.2, a human gate, from 7.1's measurements. **Wired to nothing
      yet** — 1.4 is its production caller and drives it through the production path.
      Files: `src/app/snapshots.ts` · `src/app/snapshots.test.ts`
      Verify: (**unit**, red-first) multi-bound eviction leaves the store within **all three** bounds; the
      single-oversized snapshot is refused with **no** eviction; oldest-first ordering is exact; **per-document
      count evicts within its own document while global bytes/age evict across documents** (a fixture with two
      docs proves the axis — a per-doc-only or global-only implementation reddens a different count of cases,
      named). Byte accounting matches `TextEncoder`. **Red-first (name the count):** an implementation that
      evicts on the wrong axis fails the two-doc cases specifically, not the single-doc ones. Golden EMPTY ·
      manifest green.

- [x] **1.3 D-1 — export the reader-source getter; `mountRawFallback` registers too. Red-first BOTH directions.**
      Export a getter from `readerMode.ts` beside the existing setter (`:39-41`) so the capture path (1.4) READS
      the source `mount()` already stashed (`mount.ts:202` → `readerMode.ts:35`) rather than retaining a second
      copy. **The stale-after-failed-render fix, made total not special-cased:** `mountRawFallback`
      (`mount.ts:276-303`) does NOT register today, so after a failed render the WeakMap holds the *previous*
      document's source — capturing that would store text that left the screen two renders ago. Make it register
      (`mount.ts:292` sets `pre.textContent = source`, so the source genuinely is what is displayed): the
      invariant becomes *"the WeakMap holds what is currently on screen,"* no exception. **This STORES NOTHING**
      (it changes what a getter returns, not what IDB holds).
      **★ Direction (b) is the control M5 needed 8× and revision 0 omitted:** the WeakMap's SOLE reader today is
      the Raw view (`readerMode.ts:65`), so registering on the fallback path changes what **Raw** shows after a
      failed render. Pin the OLD behaviour first.
      Files: `src/render/readerMode.ts` · `src/render/mount.ts` · `tests/browser/*` (new suite for D-1's cases)
      Verify: (**tests/browser** — Cr+Fx, both surfaces) **(a)** force a render failure, assert the source the
      getter returns is the **displayed** (fallback) one, not the previous document's — **red-first before the
      `mountRawFallback` fix (1 thing red), with the count checked, not the colour.** **(b)** the Raw toggle on a
      failed render behaves **identically before and after** the change — pin the OLD behaviour red-first, so the
      direction-(b) change is proven not to silently alter shipped Raw semantics. Golden EMPTY · manifest green.

- [x] **1.4 ★ THE STORING COMMIT — capture wiring + the WHOLE trust correction, one commit (HARD constraint).**
      This is the first code that stores a snapshot, so §7-10 binds the trust correction into the SAME commit and
      the same-commit rule binds every trust surface that must now account for the state. It is large by design
      and **does not split** — splitting ships either storage-wired-to-nothing (the M5 defect class) or a false
      published claim. Pieces:
      - **Capture (§1.1):** in `watchController.renderNow` (`:293`), after `readyAt` is computed and OUTSIDE the
        timed synchronous block, `if (captureEnabled && docId != null && outgoing != null &&
        normalise(outgoing) !== normalise(text)) void storeSnapshot(docId, outgoing)` — **fire-and-forget, never
        awaited** (an awaited write inflates the cost-proportional cooldown, `:299-301`). `outgoing` is D-1's
        getter read. `docId != null` is what keeps capture app-page-only. **`captureEnabled` is a defaulted-ON constant AT
        THIS TASK** and becomes the settings-row read at 1.5 — stated so it is not improvised; the symbol has
        no other source until then.
      - **D-5 CRLF:** `normalise` (LF) both sides at the compare; equal-after-normalise ⇒ store nothing. The
        detector is NOT touched.
      - **`SEP` + `docId`:** export the module-private `SEP` from `recents.ts:43` and import it (reuse the
        documented separator, do not re-declare); add the load-bearing comment at the export site (§4-9 — the
        constant now couples two subsystems; a change silently orphans every snapshot). Build
        `docId = folderId + SEP + path`. **★ NUL CHECK (writes `SEP`).**
      - **D-10 revoke-erase:** `revokeAccess` (`appShell.ts:972-980`) gains one call deleting every snapshot whose
        `docId` **`startsWith(folderId + SEP)`** — scanned on the delimiter, NOT the bare id (`f-100-1` prefixes
        `f-100-10`; `SEP` cannot appear inside a `folderId`, making the boundary exact — `recents.ts:38-43`). **★
        NUL CHECK (writes `SEP`).**
      - **The trust correction reaches CODE, not only the doc (§1.3):** rewrite `PERMISSIONS.md`'s claim sentence
        (`:42`, `:45`, `:82-83`), the related phrasings (`:39-50`) and derived facts (*"four stores"*,
        *"`DB_VERSION` 2"*, `:84`, ledger heading `:31`, `:33-35`) — and a new capability-ledger row; rewrite
        `storageControls.ts:26-27` (`CONTENTS_NEVER_STORED_NOTE`, rendered unconditionally `:182`),
        `store.ts:280`, `store.ts:289`; flip the **three** green assertions
        (`tests/browser/wipe.browser.test.ts:119`, `appShell.test.ts:715`, `appShell.test.ts:716-718` — the last
        pins the `data-note` hook and the very string being rewritten) and update the two FIXTURE mirrors
        (`appShell.test.ts:655`, `:697`) that silently diverge otherwise.
      - **The panel accounts for it:** `describeStored()` (`store.ts:306-331`) gains a snapshot count + total bytes
        from `snapshotMeta` only; `buildStoredLines()` gains a line; `StoredSummary` gains the field (a
        compile-time forcing function by prior design, `store.ts:243-247`) and the duplicated `EMPTY_SUMMARY`
        literal at `appShell.ts:487-494` must gain it or the build breaks (intended).
      - **`wipeAll` clears it:** `wipeAll()` (`store.ts:210-216`) gains two `clear()` calls, or a pushed commit's
        "wipe all data" leaves snapshots behind.
      Files: `src/watch/watchController.ts` · `src/app/recents.ts` · `src/app/snapshots.ts` · `src/app/store.ts` ·
      `src/app/appShell.ts` · `src/app/storageControls.ts` · `docs/trust/PERMISSIONS.md` ·
      `tests/browser/wipe.browser.test.ts` · `src/app/appShell.test.ts` · new capture + revoke browser suites
      Verify: (**unit**) `describeStored`/`buildStoredLines` render the snapshot line; the CRLF equal-after-
      normalise case stores nothing. (**tests/browser** — Cr+Fx) a render captures a snapshot on the app page
      (production path, through `installWatchForFile`) and **captures NOTHING on the content-script reader**
      (no `docId`) — **red-first: the absent-on-content-script half is proven by temporarily supplying a
      `docId` there (1 thing red).** `wipeAll` erases snapshots **and** the panel then reports none.
      **D-10 including the delimiter case:** revoking folder X erases X's snapshots and **leaves intact** the
      snapshots of a folder Y whose id is a string prefix of X (the `folderId + SEP` boundary) — red-first by
      scanning on the bare `folderId` (over-deletes Y). The three flipped assertions are now green on the NEW
      copy; a **CRLF fixture built from explicit `\r\n` escapes** (no tree fixture is CRLF, §3-6) drives the
      normalise path. **Zero-network** across capture + eviction with the `/^https?:/i` predicate verbatim and a
      live control `fetch` shown in the same test. **★ Confirm both NUL checks read zero.** Golden EMPTY ·
      manifest green + byte-unchanged.

- [x] **1.5 D-12 — the capture off-switch is its OWN settings ROW, not a field on the shared `Settings` record.**
      A field on `Settings` would be fetched by the content script on every reader start and acted on by nothing;
      worse, `getSettings()` hand-enumerates its fields (`store.ts:185`), so a new `Settings` field would persist
      then **silently vanish on read** — no type error, no test failure (§4-1, the trap D-12 routes around). The
      settings store is keyPath `'id'` with one row today (`SETTINGS_ID='reader'`); the capture flag is a
      **second row in the same store**, read by key, so `getSettings()` is untouched. `describeStored()` must read
      **both** rows or the panel hides a stored record. `wipeAll()` **resets the flag to its default (on)** and
      the wipe-confirmation copy states that wiping restores settings to their defaults **including snapshot
      capture** — a trust-surface product call: a flag that *survived* wipe-all leaves a lingering record the
      instant the user asked for everything erased.
      **★ The wipe-reset's SAFETY depends on D-3's persistence** (3.1): a user who wipes then re-watches must see
      the disclosure again, as a new user would. D-3 ships in group 3; until then this reset is safe because
      capture defaults on and the panel discloses the bytes — but if 3.1 ever makes the disclosure one-shot, this
      decision is void (pinned in D-3). Cross-reference, do not silently couple.
      Files: `src/app/store.ts` · `src/app/store.test.ts` · `src/app/storageControls.ts` · `src/app/appShell.ts` ·
      `tests/browser/*` (settings-row + wipe-reset)
      Verify: (**unit**, red-first) the flag round-trips as a second row while `getSettings()` returns byte-identical
      output for the existing fields (prove `getSettings()` is untouched — a shared-record implementation reddens
      this); `describeStored()` reads both rows. (**tests/browser** — Cr+Fx) toggling the switch off stops capture
      on the next render (assert no new snapshot — **non-vacuous: prove a render WITH it on did capture in the same
      test**); `wipeAll` resets the flag to on and the confirmation copy names snapshot capture. Golden EMPTY ·
      manifest green.

- [x] **1.6 D-13 — one GLOBAL "erase snapshots" control (per-document erase is deferred with a home).**
      §3.4 commits to the global control; it is a sibling of `wipeAll` that clears **only** the two snapshot
      stores, leaving folders/recents/pins/settings **and the capture flag** intact (erasing snapshots is not
      erasing settings). Per-document erase is a reasonable expectation the moment §3.7's picker shows a
      per-document list — recorded as deferred in §6, explicitly not rejected (scope, not principle).
      Files: `src/app/store.ts` · `src/app/storageControls.ts` · `src/app/appShell.ts` · `tests/browser/*`
      Verify: (**tests/browser** — Cr+Fx, red-first + non-vacuous) erase-snapshots leaves folders/recents/pins/
      settings/capture-flag present (assert each is still there AND that a snapshot existed before the erase, so an
      empty tail is not an empty instrument) and clears both snapshot stores. **Red-first (1 thing):** a control
      that also clears a non-snapshot store reddens the corresponding survival assertion. Golden EMPTY · manifest
      green.

## 2 — The diff registry SEAM (pulled early — D-3, D-2 and D-14 all read it)

*★ DECOMPOSITION FINDING, flagged for gate 3. A literal read of plan §6 creates the diff registry with the diff*
*VIEW (group 5). But D-3's disclosure suppression (group 3) and D-2's generalised pin (group 4) both need the*
*registry to already exist — D-2's task is literally "pin the diff registry's equivalent." So the register-once*
*HOLDER and its app-page registration are separable from the engine/view that later USE it, and must precede*
*them. The engine (group 5) and view/affordance (group 6) stay where §6 puts them. If the human prefers instead*
*to gate D-3 on the capture context established in 1.4 (equivalent: both mean "app page"), this group collapses*
*into 1.4 — see the gate-3 note. Recommendation: keep the registry as its own seam, exactly the object the plan*
*specifies as the gate.*

- [x] **2.1 `diffRegistry.ts` — the register-once holder + app-page registration; the content graph registers
      nothing.** A module-level register-once holder (the `watchRegistry.ts:4-16` precedent — the control is
      rebuilt every mount, the target is not; hold no reference in a closure). `appShell.installWatchForFile`
      registers a **diff context** for the host (`docId` + the current-source getter + a snapshot fetch — the DATA
      a diff needs, no engine, no view yet); nothing in the content-script graph registers into it, so it is
      **empty on the content script and non-empty on the app page** — which is exactly the surface signal D-3 and
      D-14 need. **This is a SEAM, so a test must drive the PRODUCTION registration** (`installWatchForFile`), not
      a hand-built one (M5's rule; the diff registry is the second registry D-2 is being generalised for).
      Files: `src/render/diffRegistry.ts` · `src/app/appShell.ts` · `tests/browser/*`
      Verify: (**tests/browser** — Cr+Fx) after `installWatchForFile` on the app page the registry is non-empty for
      that host; on the content-script reader it is **empty** — **red-first + through the production path: a test
      that registered the target itself would prove nothing about which target production registers** (M5's exact
      hole). **Red-first (1 thing):** ungating `installWatchForFile`'s registration guard makes the
      content-script-empty assertion fail. Golden EMPTY · manifest green.

## 3 — The capture disclosure channel (D-3)

*Why this may follow 1.4 when the trust correction may NOT — the distinction is not "how honest is honest*
*enough." **§3.3's same-commit rule prevents a FALSE STATEMENT; this gap is an INCOMPLETE FEATURE.** Between*
*1.4 and 3.1, `PERMISSIONS.md` and the storage panel both correctly say snapshots are stored — nothing asserts*
*otherwise; what is missing is the proactive at-the-moment surface. The alternative principle (no intermediate*
*commit may leave any acceptance criterion unmet) would mean no milestone could ever have more than one*
*commit. No release happens between tasks either — 9.1 precedes any publish — so user exposure is zero.*

- [x] **3.1 D-3 — a SEPARATE disclosure channel, rendered alongside the note, PERSISTENT, correctly gated.**
      The single watch-note slot is the wrong home: its semantic is the opposite of a disclosure
      (*"watching is not happening, and here is why"*), and `start()` clears it (`watchController.ts:358`) at
      exactly the moment §3.6 needs the disclosure. So: a separate slot in `watchRegistry.ts` and a separate
      element rendered by `buildWatchChrome` (`watchControl.ts:256-262`) **alongside** the note. **Arbitration
      rule (stated so it is not invented per-site):** note (failure/limit) renders first and closer to the
      control; disclosure (informational) renders after it; disclosure is **suppressed while `watchAvailable()` is
      false AND while the diff registry (2.1) is empty** — the registry gate is what keeps it off the
      content-script surface that *can* watch (gating on `watchAvailable()` alone ships it there — verified in
      D-14, not assumed). **★ Persistence is load-bearing:** the disclosure is present for as long as capture is
      enabled and watch is available — **not one-shot, not dismissible.** D-12's wipe-reset safety rests entirely
      on this (1.5); a one-shot disclosure voids D-12.
      Files: `src/watch/watchRegistry.ts` · `src/watch/watchControl.ts` · `tests/browser/*` · a unit test for the
      arbitration/suppression predicate
      Verify: (**unit**) the arbitration predicate: note-first ordering, disclosure suppressed when
      `!watchAvailable()` OR the diff registry is empty, shown only when both hold. (**tests/browser** — Cr+Fx) the
      disclosure renders on the app-page watched reader and is **ABSENT on the content-script reader** despite
      `watchAvailable()` being true there — **red-first by dropping the registry half of the gate (1 thing red):
      the disclosure then appears on the content script.** It is present after a re-render (persistence — assert it
      survives `replaceChildren`) and **non-vacuously** (prove a state where it is correctly absent). Golden EMPTY
      · manifest green.

## 4 — D-2's shared seam-pin helper (before the pin is copied with its hole)

- [x] **4.1 D-2 — extract a shared, CALL-SITE-scoped seam-pin helper; re-express the watch pin; cover both
      registries.** The existing pin (`contentWatch.test.ts:101-127`) is **file-scoped**: `:117-119` asks whether
      the file contains `createWatchController(` anywhere, not whether the registration uses it — a file with one
      correct and one hand-built registration passes green, and `appShell.ts` (which will hold BOTH registries'
      registrations) is exactly where that is weakest. Extract a helper that matches the **registration expression
      itself**, re-express the watch pin through it, and apply it to the diff registry (2.1) too. Copying the
      file-scoped matcher into a second place propagates the hole; the test's own header sanctions being argued
      with on purpose (`:31-32`).
      Files: `src/watch/contentWatch.test.ts` · a shared seam-pin helper module + its test · the diff-registry pin
      Verify: (**unit**, red-first) the helper flags a file whose registration is hand-built even when a correct
      `createWatchController(`/diff-register call also appears elsewhere in the same file — **the case the
      file-scoped matcher passes green** (this IS the red-first: the old matcher green, the new one red, on the
      same crafted fixture). Applied to both registries; each still has ≥1 production-path test (1.4/2.1). Golden
      EMPTY · manifest green.

## 5 — The diff engine (the only module that imports `diff`)

- [x] **5.1 `diffEngine.ts` — `normalise` + `diff`'s line API → hunks (pure, no DOM). Add the dependency.**
      The library returns hunks; the markup is ours (6.1). Line granularity is applied to **source** and displayed
      against blocks (§3.8) — no sub-line spans (deferred with a home). Add `diff` to `package.json` (three →
      four), the first dependency since M1 — a governed act, approved at 005's plan gate (D-2); **verify the
      addition against current `diff` docs before pinning the version** (AGENTS.md — training knowledge of the API
      is stale). **This is the ONLY module that imports `diff`** (§1.4); it imports no DOM.
      Files: `package.json` · `src/render/diffEngine.ts` · `src/render/diffEngine.test.ts`
      Verify: (**unit**, red-first) hunks for added/removed/unchanged lines; **CRLF** (both sides normalised ⇒ no
      spurious all-changed), trailing-newline, and empty-input cases; a pure-EOL-flip diff yields **no** hunks
      (D-5 at the engine). **Red-first (name the count):** skipping `normalise` on one side reddens the CRLF and
      EOL-flip cases specifically. `dependencies` is now exactly four (assert it). **Import fence begins here** —
      static graph assertion that `diffEngine.ts` is reachable from `appShell.ts` and from nothing `mount.ts`
      reaches. Golden EMPTY · manifest green.

## 6 — The diff view, affordance, import fence, and D-11 deferral

- [x] **6.1 `diffView.ts` — hunks → sanitized markup; the `data-diff` sibling flip; exit; the fallback.**
      Mechanism per D-15: a lazily-built **sibling** view behind `data-diff="active"` on the **host** (mirroring
      `WATCH_HOST_ATTR` — host attributes survive `replaceChildren`, children do not); `:host([data-diff="active"])
      .peekover-reader{display:none}` in `readerCss.ts`. **NOT a `MountOptions` field** — that would re-parse,
      re-sanitize and re-commit the whole document and collide with `preserveReading` on every entry/exit; `mount()`
      stays read-only library. Both sides go through the unchanged `parse → sanitize` (untrusted on both sides,
      §3.8). **Exit** restores the document (never touched) and the reading place via the existing `readingAnchor`
      pair — taking `mount.ts:251-257`'s rung (a hidden reading column has all-zero heading rects, so capture the
      anchor **before** hiding the column and restore **after** unhiding it, or the restore jumps to top).
      `mount()` clears `data-diff` on both commit paths (`:206`, `:282`) so a diff never crosses a document switch.
      **The FALLBACK, named now (§7-8):** if the diff cannot be produced or rendered, the rendered document stays
      on screen and the failure is surfaced beside it — `data-diff` never set, never blank (AGENTS.md #5); the same
      state absorbs 1.2's meta-first dangling-content case (§4's *"comparison unavailable"*). **Token fill:**
      `--del`/`--del-soft`, `--ok`/`--ok-soft` are already defined in all three themes (verified `readerCss.ts:35-48`
      = `tokens.css`); the mockup is a **modal** (`mockup.html:754`) and a **version browser** (`:681`) — **the spec
      wins on both** (inline, diff-target selector); record the divergence in-code so nobody "fixes" it back.
      **★ `--del`'s second semantic** (already the lit network indicator, `readerCss.ts:366`) is a design judgement
      — flag for the 9.1 gate, do NOT silently substitute a nearby token.
      Files: `src/render/diffView.ts` · `src/render/mount.ts` · `src/theme/readerCss.ts` · `tests/browser/*`
      Verify: (**tests/browser** — Cr+Fx) the diff renders inline in the reading column and hides the rendered
      document; **exit restores the document and the reading place** — pre-006 exit behaviour **red-first (name the
      count)**; content INSERTED ABOVE, restore lands the same place a naive `scrollTop` would get **wrong**
      (non-vacuous: measure the naive landing in the same fixture, assert the anchor lands elsewhere); a **dangling
      meta entry** (content deleted, meta surviving) lands in the "comparison unavailable" state, leaves the
      document reachable, and drops the entry (1.2's lazy self-reclaim); diff status is conveyed by **more than
      colour** (structural assertion, not a screenshot). Both sides sanitized (assert a script in either side does
      not survive). Golden EMPTY · manifest green · **import fence** (`diffView.ts` imported by `appShell.ts`, not
      `mount.ts`).

- [x] **6.2 `diffChrome.ts` — the affordance + the D-14 registry gate; `mount.ts` pushes it; the fence holds.**
      `buildDiffChrome(host)` returns the affordance when the diff registry (2.1) is non-empty and **`[]` — with NO
      note branch — when it is empty**, so the content-script surface grows neither affordance nor explanation
      (§3.2, verbatim: *"there is nothing to be told they are missing. Do not add one."* — the absence of a note
      branch IS the decision). `mount.ts` gains `...buildDiffChrome(host)` in `children[]` beside `:181`. The
      affordance holds no controller reference and asks the registry at click time (the seam). **This is the ONLY
      diff module `mount.ts` imports, and it imports no engine** — so the same seam that keeps the affordance off
      the content-script surface keeps `diff` out of the content-script bundle (C7). This is the defect class that
      reaches the human gate on the one surface no harness covers.
      Files: `src/render/diffChrome.ts` · `src/render/mount.ts` · `src/theme/readerCss.ts` (pill rule, tokens only)
      · `tests/browser/*`
      Verify: (**tests/browser** — Cr+Fx, both surfaces) the affordance renders on the app-page reader and is
      **ABSENT on the content-script reader** (and no explanation appears there) — **red-first by ungating it
      (1 thing red).** **STRUCTURAL DOM assertion — the affordance is a SIBLING of `.peekover-reader`** (the golden
      pin cannot see this; verify it red by appending inside `.peekover-reader` → golden stays EMPTY, structural
      assertion fails). Placement clears the existing bottom-left stack (net 16 · theme 56 · watch 96) — measured
      with a throwaway rect probe (deleted), not chosen. Golden EMPTY · manifest green · **import fence** (static:
      `diffChrome.ts` imports no engine; `mount.ts`'s graph excludes `diff`/`diffEngine`/`diffView`).

- [x] **6.3 D-11 — defer the re-render while a diff is displayed; the "changed again" line; capture on exit.**
      In `watchController.onText` (`:324-342`): `if (diffDisplayed(target)) { pendingText = text; return }` —
      `diffDisplayed` reads the host's `data-diff` (6.1). No timer armed; `cancelPending()` (`:234-240`) already
      drops it on teardown, so a document switch during a displayed diff loses the pending text exactly as a
      cooldown-pending one (the `:224-233` cross-feed bug does not reappear). On diff **exit** the existing
      `flushPending` runs the deferred render, and `renderNow`'s D-1 read still returns C (still on screen), so C
      is captured — nothing is lost, §3.5's per-render invariant intact. **The "changed again" line SHIPS** (human
      decision): inside the diff view — *"this document has changed again since you opened this diff"* — not global
      chrome, not a toast (D-3's rejection stands). Its legibility (useful vs noise) is a 9.1 human-gate item.
      Files: `src/watch/watchController.ts` · `src/render/diffView.ts` · `tests/browser/*`
      Verify: (**tests/browser** — Cr+Fx) a change arriving while a diff is displayed does **not** replace the diff
      (the line appears instead), **AND** the on-screen state is captured when the deferred render runs on exit —
      **both halves, or the decision is only half-proven.** **Red-first (name the count):** removing the
      `diffDisplayed` guard reddens the "diff not replaced" half; removing the exit flush reddens the "captured on
      exit" half — a different case each. Non-vacuous: prove a change with **no** diff displayed captures normally
      (the guard is not swallowing everything). Golden EMPTY · manifest green.
      **LANDED — GROUP 6 CLOSED. Three divergences from the sketch above, each argued, none silent:**
      **(a) THE LINE GOES THROUGH THE NOTE CHANNEL, NOT INSIDE THE DIFF VIEW, AND IT LANDS ON EXIT.** The sketch put
      it *"inside the diff view"* — which is unreachable without editing `diffView.ts`, sealed at 6.1 and required
      byte-identical by this task's own fences, and which would also make the line a sentence the reader sees while
      still looking at the comparison it is about. `setWatchNote` already means exactly *"something you should know
      about the watch you asked for"*, it is the channel 4.3's dead-read and 4.4's unavailable-surface explanations
      both use, and it renders WITHOUT a re-render. Shipped copy: **"This document changed again while the comparison
      was open — the newer version is shown above."** — gate-3's approved sentence, re-tensed for the exit moment and
      given `DEAD_READ_NOTE`'s own "shown above" pointer. Still a 9.1 legibility item. **Not a toast** — D-3's
      rejection stands, and no new chrome was built.
      **(b) EXIT IS DETECTED BY A `MutationObserver` ON `data-diff`, NOT BY CALLING `flushPending`.** There is more
      than one way out of a diff (the 6.2 pill, `mount.ts`'s two D-15 clears, anything a later task adds); an explicit
      signal would have to be threaded through each, and the one that got missed would strand the deferred text
      forever. The observer is installed in `start()`, disconnected in `stop()`, holds no policy, and reads the D-15
      attribute — the seam, so **`watchController.ts` imports neither `./diffView` nor `./diffEngine` nor `diff`**
      (5.1 fence Clause C). The attribute name is the exported literal `DIFF_DISPLAYED_ATTR`; a **drift check**
      unit-asserts it still equals `diffView`'s `DIFF_HOST_ATTR`, because two spellings of one name can drift and the
      failure mode if they did is silent. The exit flush calls `renderNow` directly rather than `flushPending`: the
      cooldown exists to break up bursts, and this is one render released by a gesture after a window in which the
      loop rendered nothing.
      **(c) A HOLE THE SKETCH DID NOT COVER, FOUND AND CLOSED: `flushPending` NEEDED THE GUARD TOO.** A cooldown timer
      armed moments *before* the diff opened is still in flight when it does, and it does not go through `onText` —
      so `onText`'s condition alone would have let it fire and replace the comparison a beat later. `flushPending`
      now CONVERTS such a pending text to a deferred one (the timer is already cleared; the text keeps the single
      slot) rather than rendering it. Unit-cased.
      **Results:** unit 540 → **549** (+9: defer · flush-on-exit · the line · no-line-without-defer · coalesce-during ·
      document-switch-drops · pre-armed-timer-converts · content-script-shape-is-one-code-path · drift check);
      browser 601/15/72 → **605/15/74** (+2 cases × 2 engines, `tests/browser/watchDiffDefer.browser.test.ts`,
      app page only — D-14 leaves the content script no diff to defer against, already proven in
      `diffChrome.browser.test.ts`). **Red-first, both halves, both engines:** deleting `onText`'s condition reds
      *"the diff was torn down: expected null to be 'active'"* (the re-render replaced the comparison, and `mount`'s
      D-15 clear took `data-diff` with it) — 2 browser + 6 unit cases; neutering the exit flush reds *"the withheld
      change never reached the reader"* and, with that assertion lifted, *"the deferred render did not capture the
      state that was on screen"* — the plan's two halves, separately observed. Non-vacuous capture: the exit render
      stored the state the reader LEFT (V2), leaving 2 snapshots where the seeded 1 stood.
      **Bytes:** content-script 314688 → **315143 B both engines (+455)**; app chunk 359969 → **360422 B (+453)** —
      the observer install/teardown, one condition in each of two functions, and one string. Content-script grep for
      `diffLines|jsdiff|computeDiff|enterDiff|exitDiff|renderHunk|diffWords|diffChars|structuredPatch`: **0**. 5.1's
      fence pin **15/15 green, allowlists unchanged**. `diffEngine.ts`, `diffView.ts`, `diffRegistry.ts`,
      `diffChrome.ts`, `mount.ts`, `appShell.ts`, `watchControl.ts`, `watchRegistry.ts`, `contentWatch.ts`,
      `diffEngine.test.ts` **ALL byte-identical**. Golden EMPTY · `permissions: []` · `Settings`/`getSettings`/
      `putSettings` byte-identical.

## 7 — Measure → decide bounds → implement (the measuring task cannot choose)

- [x] **7.1 MEASURE capture cost + diff memory — NO THRESHOLD ASSERTED (D-8, standing M1 rule).**
      Measure, with a **like-for-like control** (005 showed continuity *moved* layout rather than adding it, and
      only the control made that visible): capture cost against the 50 KB ≈ 34.9/35.7 ms and 1 MB ≈ 717.3/713.9 ms
      synchronous re-render baselines (`progress.md`); the diff render's memory/usability at **1 MB** (§1.6 — the
      real ceiling now that capture adds no copy). Record real snapshot sizes/counts the eviction bounds will act
      on. **This task MEASURES and is FORBIDDEN from choosing the bounds** (7.2 is the gate). Protocol unchanged:
      7 iterations, discard run 1, median of warm 6, min/max spread; **every first-paint number is Chromium**
      (Playwright cannot load an extension into Firefox).
      Files: measurement notes into the task report + `docs/ai/progress.md` (numbers only, no bound chosen)
      Verify: numbers recorded with baseline + delta + spread; **no threshold asserted, no bound chosen** (a chosen
      bound here = STOP and flag). This is a measurement task; red-first does not apply (asserts no behaviour) —
      stated plainly, not manufactured.
      **LANDED.** Two harnesses: `scripts/perf-snapshot-capture.ts` (like-for-like control, capture OFF vs ON) and
      `scripts/perf-diff.ts` (1 MB diff through the REAL 6.2 gesture path). Two `perf:*` entries. **NOTHING CHOSEN,
      NOTHING RECOMMENDED** — neither script emits an exit-code gate; only the two shipped M1 gates are asserted.
      **★ THE CONTROL'S RESULT IS THAT THE IN-SITU DELTA IS UNRESOLVABLE, and it was proven so rather than assumed:
      two independent 6-run passes at 1 MB gave deltas of OPPOSITE SIGN** (−1.7/−62.7 ms, then +23.8/+20.3, final
      −3.4/−15.5) because one 1 MB re-render varies 40–90 ms run-to-run. So a cell was added that measures the whole
      synchronous capture guard where it IS resolvable: **5.0 µs at 50 KB (at `performance.now()`'s 5 µs granularity
      floor — an upper bound), 47.5 µs at 1 MB.** Reported as a FLOOR on added work, never a prediction (retro
      finding 2). **Non-vacuity held every run: ON stored 2 snapshots/iteration, OFF stored 0.**
      Awaited `storeSnapshot` (off the sync path by construction): **0.6 ms / 10.8 ms**. Snapshot bytes = document
      bytes: **50.4 KB / 1.12 MB**. **Accumulation over 12 edits: 50 KB grew `2,3,…,13`; 1 MB grew `2,3,4` then
      STOPPED at 4** — the proposed 5 MiB global byte bound binding. Recorded as an observation; **whether that is
      the right number is 7.2's**. Diff at 1 MB (5882 hunks, 5.0% of lines, identical all 7 runs): engine
      **585.0 ms** · pipeline **433.6 ms** · DOM **122.0 ms (DERIVED)** · **TOTAL enter 1157.4 ms** · first scroll
      frame **442.5 ms** then 71.7/56.4/59.9/54.6. Memory directional only (V8 heap, no DOM nodes, GC-dependent):
      +35.95 MB median on enter, spread +8.92/+77.11.
      **Gates:** first paint **144.3 / 145.1 ms** over two passes (<150 ms **PASS**; floor 138.9 ms vs M5's 132.0 —
      **+6.9 ms on the floor**, stated not interpreted); `pnpm zip` **349.17 / 349.23 kB** (<2 MB **PASS**).
      Content-script **315,143 B**, app chunk **360,422 B**, background **3,435 B**, both engines; fence grep **0**
      both engines. **NO `src/`, test or spec file touched.** Golden EMPTY · `permissions: []` · unit **549** ·
      browser **605/15/74** · `Settings`/`getSettings`/`putSettings` byte-identical (fourteen tasks).

- [x] **7.2 DECISION GATE (human) — the bound NUMBERS, chosen from 7.1 (D-8; D-16's axis is already decided).**
      The human picks the count / age / byte bound values from 7.1's measurements. **The axis is NOT reopened**
      (D-16: count per-document, bytes and age global — settled). Recorded in `docs/ai/decisions.md` before the
      code that sets them.
      Files: `docs/ai/decisions.md`
      Verify (**human gate**): the chosen numbers are recorded with the measurement that justifies them, before
      7.3. No code lands on an assumed number.
      **LANDED.** Values chosen (see `decisions.md` 2026-07-26): `SNAPSHOT_COUNT_PER_DOC = 15`,
      `SNAPSHOT_TOTAL_BYTES = 20971520` (20 MiB), `SNAPSHOT_MAX_AGE_MS = 2592000000` (30 days). No code at 7.2;
      7.3 sets the constants and re-runs the accumulation cell of `perf:snapshot-capture` to confirm the new
      bounds bind (or don't) as expected.

- [x] **7.3 Implement the CHOSEN bounds.** Set 1.2's proposed constants to 7.2's chosen values (a no-op edit if
      they matched; recorded either way). If the chosen numbers change eviction behaviour, the 1.2 unit cases move
      with them.
      Files: `src/app/snapshots.ts` · `src/app/snapshots.test.ts`
      Verify: (**unit**) the eviction cases pass against the chosen numbers; the algorithm is unchanged (only
      constants moved). Golden EMPTY · manifest green.
      **LANDED. GROUP 7 CLOSES.** `SNAPSHOT_COUNT_PER_DOC` **20 → 15**; `SNAPSHOT_TOTAL_BYTES` **5 MiB → 20 MiB**;
      `SNAPSHOT_MAX_AGE_MS` **UNCHANGED at 30 days** — 7.2 weighed 7 and 90 and kept 30, so it is a value REVIEWED
      AND CHOSEN, not skipped (**"recorded either way"**, this task's own body). **THE ALGORITHM DID NOT MOVE:** one
      diff hunk, confined to the constants block, whose only two non-comment lines are the two values —
      `planSnapshotWrite`, `bytesOf`, `DEFAULT_BOUNDS`'s body and the entire IDB layer byte-identical. Consumers pick
      the numbers up through `DEFAULT_BOUNDS`, which names all three constants, so choosing a value is a one-line
      edit. The four jsdoc blocks reading **"PROPOSED — NOT chosen (D-8)"** now record them as CHOSEN (7.2,
      `decisions.md` 2026-07-26) with the reasoning attached — a "proposed" comment on a chosen value is a lie about
      the decision state, and the next session would read it as still open.
      **`snapshots.test.ts` NEEDED NO CHANGE — 1.2's design paying off:** every eviction case passes its own small
      explicit bounds (`{ countPerDoc: 2, totalBytes: 100, … }`) and the one `DEFAULT_BOUNDS` case asserts shape +
      positivity only. **No test ever pinned a proposed number** (1.2's rule G), so no literal needed updating.
      **★ RE-MEASUREMENT CONFIRMED THE PREDICTION, WHICH WAS STATED BEFORE THE HARNESS RAN** (a number read first and
      rationalised after is not a verification). Accumulation cell, 12 edits through the production controller:
      **50 KB `2,3,4,…,13` → 13 snapshots, 659.5 KB — identical to 7.1 to the byte** (never reached a cap under the
      old numbers either); **1 MB `2,3,…,13` → 13 snapshots, 14.57 MB — 7.1's PLATEAU AT 4 IS GONE.** That plateau was
      the proposed 5 MiB bound biting at the fourth 1.12 MB snapshot; 14.57 MB < 20 MiB and 13 < 15, so **neither
      bound bites — the designed reordering** (bytes stepped back to a safety cap, count became what would bind
      first). **NOT OBSERVED and out of scope: whether count stops growth at 15** — needs >14 rendered edits,
      `EDIT_SEQUENCE` is 12, harness unmodified; the ~17-snapshot arithmetic in `decisions.md` is reasoning, not
      measurement. **No stale-build trap** (checked, not assumed): `--no-build` reuses `.output/`, but the harness
      re-bundles `snapshots.ts` + `watchController.ts` from SOURCE via esbuild (`perf-snapshot-capture.ts:275-282`),
      so the measured path carried the new constants.
      **★ A FINDING THE RELAXED BOUND EXPOSED — 7.1's "the coalescer dropped 2–3 edits at 1 MB" IS NOT SUPPORTED.**
      The run printed `edits rendered: 9 of 12` while the count incremented on **all 12** edits (2→13 off a 1-snapshot
      seed). A coalesced edit captures nothing, so 13 is reachable only if all 12 rendered — the two numbers
      contradict each other and IndexedDB backs the count. The `renders` discriminator samples
      `readerSourceFor(host) === text` before a 1 MB render re-stashes its source. **7.1 could not have caught it:**
      the 5 MiB bound clamped the count at 4, making `renders` unfalsifiable until the ceiling lifted. `scripts/` is
      fenced here, so the harness was NOT touched — **8.1 owns the fix or the caveat.**
      Other cells same magnitude (constants touch eviction only, never capture cost): guard 5.0 → **0.0 µs** (both at
      or under the 5 µs granularity floor) / 47.5 → **45.0 µs**; awaited write 0.6 → **0.6 ms** / 10.8 → **7.5 ms**;
      mean snapshot 50.7 KB / **1.12 MB**. **The OFF-vs-ON delta is still unresolvable and still flips sign** (−0.4 /
      −5.4 ms sync) — 7.1's headline finding reproduces. **NO threshold asserted.**
      **Pins:** unit **549** unchanged · browser **605/15/74** unchanged · `pnpm lint` **EXIT=0** · Golden **EMPTY** ·
      `permissions: []` stands · `tests/manifest.test.ts` **2975 B**, byte-unmodified since M2 ·
      `Settings`/`getSettings`/`putSettings` byte-identical (**sixteen tasks now**) · `store.ts`, `idbCore.ts`,
      `settings.ts`, `vitest.config.ts`, `wxt.config.ts`, `package.json`, `pnpm-lock.yaml`, `PERMISSIONS.md`, both
      harnesses and **every sealed 006 file** (`diffEngine`, `diffView`, `diffRegistry`, `diffChrome`, `mount`,
      `appShell`, `watchController`, `watchControl`, `watchRegistry`, `diffEngine.test`) **BYTE-IDENTICAL** —
      `snapshots.ts` is the only file in `src/` that changed. NUL count 0.

## 8 — Perf / bytes / pins / docs

- [ ] **8.1 Re-measure bytes + first paint; the import fence by measured bytes; final pins.**
      Content-script size vs **299,411 B** — **`diff` must NOT appear in this number** (the fence, measured, not
      only static); app-page chunk vs **332,895 B** — `diff` is **expected here**, a stated-not-gated line item.
      First paint vs **138.6 ms** — **CONTENT SCRIPT only**; 006 is app-page-only, so `diff` never enters the gated
      path, and **app-page first paint has ZERO automated coverage** (§4-3) — state that as the weaker claim it is,
      never as "within budget." `pnpm zip` vs 335.89 / 335.95 kB (< 2 MB). The carried `perf-first-paint.ts` false
      `FAIL` on the large-doc fixture is **NOT fixed in 006** (§4-8).
      Files: `docs/ai/progress.md` (§ Baselines / pins) · measurement report
      Verify: deltas stated with baseline; **content-script bytes show no `diff`** (the fence's byte cross-check —
      a regression here is STOP and flag); zip under bound both engines. No threshold newly asserted on the app
      page. Golden EMPTY · manifest green.

- [ ] **8.2 Docs + memory reconcile.** `progress.md`: Now-pointer to the milestone-close gate, Baselines/pins
      updated, 006 moved toward Closed on completion. `decisions.md`: revisit-when dates current (D-1…D-16 already
      logged at gate 2; the two gate-3 decisions land with the tasks.md commit). `PERMISSIONS.md` already corrected
      at 1.4 — confirm no stale claim survived. Retro is 9.2, not here.
      Files: `docs/ai/progress.md` · `docs/ai/decisions.md`
      Verify: `pnpm test` + `pnpm test:browser` + `pnpm lint` green; the memory files read true against the shipped
      code. Golden EMPTY · manifest green.

## 9 — Human milestone-close gate + retro (the acceptance an agent CANNOT self-certify — budgeted HERE)

- [ ] **9.1 Milestone-close human gate (NAMED, required — not removable by adding more tests).** The 7/7 gate.
      Walk, on **real Chromium and real Firefox with an extension loaded** (no harness reaches these): whether the
      **persistent capture disclosure** reads as honesty or nagging (load-bearing for D-12 — the wipe-reset's
      safety rests on it re-appearing, not surviving as hidden state); whether **D-11's "changed again" line**
      reads as useful or noise; whether the **inline diff is legible at real document sizes**; **`--del`'s second
      semantic** (diff-removed vs the lit network indicator); the **diff affordance's discoverability**;
      **app-page responsiveness after 006** (§4-3 — nothing else will notice); **Firefox everything**; **zero
      unexpected network with the Network tab open** across capture, eviction and diff.
      Verify (**human gate**): each item is walked and its verdict recorded. A "reads as broken/nagging/illegible"
      verdict is a real finding → a task added below this line, not a silent fix.

- [ ] **9.2 Retro (M6 close).** Run `/retro`: append to `docs/ai/retro.md` — the lessons that change how the next
      milestone runs, newest first, and what the gate caught (its most valuable content).
      Files: `docs/ai/retro.md` · `docs/ai/progress.md`
      Verify: the entry is banked; `progress.md` shows 006 closed and points at what is next.

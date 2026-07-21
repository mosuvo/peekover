# Tasks 005 — Watch mode — check off, add discovered tasks BELOW the line they came from
*Gear 3 tasks stage — **APPROVED (Gear-3 gate 3 passed 2026-07-19); implementation IN PROGRESS.** This*
*file is the live go-signal (WORKFLOW.md §5.3): work the unticked boxes in order. Approved upstream:*
*`spec.md` (b12c310 · amended d115b6e, 5943e0e) + `plan.md` (d115b6e — ONE commit that landed the plan*
*AND those spec amendments, not two artifacts sharing a hash by coincidence). CC commit per task; human*
*reviews + pushes. Each capability*
*its OWN real-engine test (`tests/browser/*`, BOTH Chromium + Firefox, **red-first + non-vacuous**), not a*
*trailing "add tests" task. Layout, rAF, computed style, pointer geometry, bytes-on-wire and cross-context*
*messaging are jsdom-**BLIND**: they are proven in the real engine, never in jsdom.*

**Standing discipline — carried into every task's Verify line, not restated per line unless it varies:**
- **Golden + manifest pins, EVERY task:** `git diff tests/golden/output/` **EMPTY** AND
  `tests/manifest.test.ts` green **UNCHANGED** (`permissions: []`). A golden diff, or a needed manifest
  edit, = **STOP and flag** — do NOT re-baseline. **THE 5.1 CORRECTION OF RECORD, stated because this
  milestone is nearly all chrome: an empty golden diff proves NOTHING about the watch control.** That suite
  snapshots the pre-mount `sanitize(parse(source))` string, a stage **upstream of `mount()`** that never
  observes chrome — measured at 004's 5.1, where a control appended *inside* `.peekover-reader` left the
  diff EMPTY and `golden.test.ts` green 10/10. **Placement is guarded by a STRUCTURAL DOM assertion, and
  that assertion is the sole guard, not a duplicate** (retro 2026-07-19, finding 3).
- **Real-engine (Chromium + Firefox), red-first + non-vacuous** for anything jsdom cannot see. The
  wrong-wiring case must FAIL on BOTH engines; the right one passes. Every assertion that a value is
  ABSENT, UNCHANGED or RESTORED needs a live positive control or a measured-fallback probe — the vacuous
  persistence test and the `remoteMedia` positive-control flake are the same defect class (retro
  2026-07-19, finding 1).
- **Two surfaces via `describe.each`**, the structural close 6.1 used — **one parameterised suite, never
  two hand-written ones**. The content-script full-page reader and the app-page `{contained}` pane reach
  the reader through the one `mount()` seam; a hand-copied second suite is how they drift.
- **Measured-vs-baseline** for perf, **deltas stated**: content script vs **288,654 B**; typical-doc first
  paint vs **137.7 ms** (budget **<150 ms**, and **only ~7–12 ms of margin is left** — progress.md
  § Baselines / pins); `pnpm zip` **< 2 MB** both engines. **No measurement task asserts a threshold**
  (standing M1 retro rule).
- **BEFORE ANY red-first mutation, `cp` the target file aside FIRST and restore from that copy.** Never
  `git checkout <path>` to undo a deliberate break while uncommitted task work lives in the same file —
  that destroyed group 4's paint gate mid-milestone in M4 (retro.md 2026-07-19, PROCESS).
- **Progress.md's Now-pointer advances at EACH task, not batched** (M1 retro rule — the pointer once lagged
  four tasks; it is the one line the next session trusts). Group 6 is its FINAL reconciliation, not its first.

**Plan-gate decisions locked by the human — encoded here, not re-opened:**
- **D-1 · 005 is WATCH ONLY.** No snapshots, no diff, **no `DB_VERSION` bump**, and **no PERMISSIONS.md
  trust-claim change** — 005 stores no file contents, so *"file contents are never stored"* stays **TRUE**
  for the whole milestone. **Any task reaching for storage is out of scope → STOP and flag.**
- **D-2 · NO new dependency.** `dependencies` stays at **three**. `diff` is approved but belongs to 006.
- **D-3 · Scroll continuity is ANCHOR-based** — heading text → index → `scrollTop` fallback (plan §1.4).
  Restoring pixels is right only when content is *appended*; an agent rewriting a file inserts *above* the
  reading position constantly. Whether it *feels* like your place is **human-gate-only** (7.1).

---

## 1 — Detection core (one seam, two implementations; the platform difference lives in the factory)

- [x] **1.1 `ChangeDetector` seam + `pollingDetector` (pure, injected `read`) — compares CONTENT, never
      metadata.** `interface ChangeDetector { start(cb: OnText): void; stop(): void }` with
      `OnText = (text: string) => void`. `pollingDetector(read, intervalMs)` calls the injected
      `read: () => Promise<string>` on an interval and fires `cb` **only when the text differs from the
      last text it saw**. The `read` fn is injected exactly as `settingsPort` injects its transport, so
      one implementation serves Firefox-app-page (`entry.file().text()`) and both content scripts
      (`relayRead(location.href)`).
      **The trap this closes, and it is the expensive one (decisions.md 2026-07-19, TRAP 2):** on Firefox's
      drag path `size` and `lastModified` are **FROZEN AT DROP TIME** and never move — only `.text()` reads
      fresh bytes. The obvious `lastModified`-polling implementation would compile, pass a naive test, and
      **silently never fire**. Comparing content is not a style choice here.
      Files: `src/watch/changeDetector.ts` · `src/watch/changeDetector.test.ts`
      Verify (**jsdom/unit**, red-first): with a fake `read` — a changed text fires `cb` **once** with the
      new text; **identical content fires nothing** (the metadata trap, asserted directly); `stop()` halts
      the loop (no further `read` calls after stop — assert the call count, not just the callback); a
      `read` that **rejects** does not kill the loop or throw unhandled. Red-first: an implementation that
      compares a metadata-ish stand-in instead of the text fails the identical-content and changed-content
      pair. Golden EMPTY + manifest green.

- [x] **1.2 `observerDetector` (Chromium app page) + dead-observation handling — REAL-ENGINE, via OPFS.**
      `observerDetector(fileHandle)` wraps `FileSystemObserver`: on a `modified` record, `getFile().text()`
      → `cb`. **Dead-observation handling is part of THIS task, not a follow-up:** a record of type
      `errored` or `disappeared` means **the observation is DEAD** — re-observe, or fall back to polling,
      and if neither is possible surface the designed dead state (4.3). **Never silently stop.** The probe
      saw only `modified`, on **one machine with one editor** (decisions.md 2026-07-19); the design must
      not depend on that holding, because another agent or editor writing atomically can invalidate the
      observed handle on Windows.
      **The harness question is ANSWERED — measured 2026-07-19, before this draft, with a throwaway probe
      that has been deleted.** The concern was that `tests/browser` loads no extension and has no picker,
      so there is no local-disk handle. **OPFS dissolves it:** `navigator.storage.getDirectory()` returns a
      real `FileSystemDirectoryHandle` **with no user gesture**, in both engines. Measured in the harness:
      **Chromium (HeadlessChrome/149) — `FileSystemObserver` present, `observe(opfsFileHandle)` ACCEPTED,
      and a `createWritable()` write produced a real callback with `records=["modified"]`.** So the
      observer path **is genuinely real-engine testable** — this is not a fake. **Firefox 151 —
      `FileSystemObserver` is `undefined`** (OPFS itself works; the observer does not exist), so the
      `describe.each` engine matrix **feature-gates this suite off on Firefox**, which is honest rather
      than a hole: Firefox never takes the observer path in production either (it has no picker and no
      observer — spec §3.2).
      **State the residual limit in the test file, do not paper it:** OPFS is not local disk. This proves
      the *wiring* (observe → record type → `getFile().text()` → `cb`) and the *dead-record* branches; it
      does **not** prove Chromium's observer fires for a **local-disk** file rewritten by an external
      agent. That was established by the task-0 probe on real disk and is re-walked at the human gate (7.1).
      Files: `src/watch/observerDetector.ts` · `tests/browser/watchDetector.browser.test.ts`
      Verify (**tests/browser** — Chromium real; Firefox feature-gated-skip with the reason asserted, not
      silently absent): an OPFS-backed `observerDetector` fires `cb` with the **new text** after a write;
      `stop()`/`disconnect()` ends delivery (assert no callback after stop — **non-vacuous**: prove a
      write *before* stop did fire, so an empty tail is not an empty instrument); a synthesised `errored`
      / `disappeared` record marks the observation DEAD and takes the re-observe-or-fallback branch rather
      than returning quietly. Red-first: delete the dead-record branch → the death test fails on Chromium.
      Golden EMPTY + manifest green.

## 2 — Relay + THE FIREFOX VERIFICATION (this group gates group 4's Firefox surface promise)

- [x] **2.1 `WATCH_READ` contract + `createWatchListener(read)` + URL validation (pure handler).** A second
      message type on the existing channel: `WATCH_READ = 'peekover:watchRead'`, `{ type, url }` →
      `{ ok: true, text } | { ok: false, error }`. `createWatchListener(read)` returns
      `(message, sender, sendResponse) => boolean`, **copying `createSettingsListener`'s shape verbatim**
      (`src/settings/settingsPort.ts`): `false` for messages that are not ours — so the settings listener
      still receives them and no response channel is left dangling — and `true` + async `sendResponse` for
      ours. **That `return true` is load-bearing and engine-specific:** WXT ships the NATIVE namespace, not
      the polyfill, and native Chrome ignores a returned Promise.
      **URL validation is defence in depth and is not optional:** accept **only** `file://` URLs whose
      extension matches the content script's own `matches` list. The content script can only run on those
      anyway — but the background must never become a general file-read oracle for a compromised page
      context.
      Files: `src/watch/watchRelay.ts` · `src/watch/watchRelay.test.ts`
      Verify (**jsdom/unit**, red-first): a valid `file://` markdown URL round-trips through a fake `read`;
      a **non-`file://`** scheme (`http:`, `https:`, `data:`, `chrome-extension:`) and a `file://` URL with
      a **non-markdown** extension are both **REJECTED without calling `read` at all** (assert the fake was
      never invoked — rejecting after reading is not the same guarantee); a foreign message type returns
      **`false`**, not `true`; a rejecting `read` yields `{ok:false}` rather than a hung channel. Red-first:
      remove the scheme check → the `http:` case reaches `read`. Golden EMPTY + manifest green.

- [x] **2.2 Wire the relay — background listener + content-script `relayRead`, with the zero-network
      guard.** Register `createWatchListener` in `entrypoints/background.ts` **beside** the settings
      listener (the background's second → third listener; both must coexist, which is what 2.1's `false`
      return buys). Content script builds `relayRead(location.href)` and hands it to `pollingDetector` as
      its injected `read`. **The loop lives in the PAGE; the background is a stateless fetch proxy** — this
      is what dissolves spec §7-6 (MV3 teardown): no long-lived background state to lose, and the watch
      dies with the tab that owns it, which is correct.
      **Zero-network, per spec §3.6-A:** a local-file read does **not** light the network indicator and the
      guards stay **http(s)-scoped**. The recon verified all seven guard files already filter `/^https?:/i`
      or narrower, so they cannot trip on the watch loop — **reuse the existing predicate VERBATIM, do not
      write a new one**. Record whether a `file://` fetch appears in the Resource-Timing buffer at all
      (spec §7-4).
      Files: `entrypoints/background.ts` · `entrypoints/peekover.content.ts` ·
      `tests/browser/watchNetwork.browser.test.ts`
      Verify (**tests/browser** — Cr+Fx, **non-vacuous**): across watch start → several ticks → stop,
      **zero** http(s) entries under the existing predicate, **AND a live control `fetch` DOES register in
      the same test** (the M4 `remoteMedia` positive-control flake is exactly why the control is re-proven,
      never assumed — and **if the control flakes, AWAIT the request, do not sample for it**). Record the
      `file://`-in-Resource-Timing answer in progress.md. **HONEST LIMIT, stated in the test file:** the
      harness loads no extension, so `runtime.sendMessage` has no receiving end — the handler is proven as
      a pure function through the **production** seam and the round trip is **7.1's named gate item**, not
      a thing this test covers. Golden EMPTY + manifest green.
      **DONE 2026-07-19 — with TWO CORRECTIONS to this task as written, both applied deliberately:**
      **(i) §7-4 MOVED TO 2.3.** The harness cannot answer *"does a `file://` fetch appear in the
      Resource-Timing buffer?"* — the browser test page runs on an `http://localhost` origin and cannot
      fetch `file://` at all; only the background can, and the harness loads no extension. It is answered
      at 2.3, where a real background console is already open. **Not attempted here; no non-answer was
      recorded as an answer.**
      **(ii) The zero-network test's claim is NARROWER than the line above implies, and the test file
      says so in its header.** With no extension loaded, `runtime.sendMessage` has no receiving end, so
      this cannot exercise the real relay. What it DOES prove: the watch loop, driven through the
      production seam with an injected `read`, issues **zero http(s)** across start → several ticks →
      stop; and **`relayRead` never falls back to fetching its own URL** — red-first proven by injecting
      that exact fallback, which fails the `networkedUrls()` assertion (not merely the rejection one) on
      **both** engines with the leaked URL named. The `/^https?:/i` predicate is reused VERBATIM; the
      live control fetch uses Task B's awaited mechanism, not a sample.
      **One thing built slightly ahead of its task, flagged rather than buried:** `registerWatchDetector`
      / `getWatchDetector` in `watchRelay.ts` is a register-once holder, because 2.2's wiring has to put
      the built detector somewhere reachable. It is the same D-A shape **4.1** needs — **4.1 should
      extend or subsume it, not add a second registry beside it.**

- [x] **2.3 HUMAN CHECK — does a background `fetch("file://…")` work on FIREFOX at all? (spec §7-1).**
      **This is the group's reason for existing and it BLOCKS 4.4.** The task-0 probe measured Chromium's
      background `file://` fetch working (status 200, fresh bytes) and **never tested Firefox's**. Firefox
      has no "Allow access to file URLs" toggle and its background may not fetch `file://` at all. It needs
      a **loaded extension**, so no automated harness can answer it — this is a human-run check, kept
      deliberately short.
      **The exact click-through:** `pnpm exec wxt build -b firefox` → `about:debugging#/runtime/this-firefox`
      → **Load Temporary Add-on** → `.output/firefox-mv3/manifest.json` → click the extension's
      **Inspect** to open the background console → run
      `await (await fetch("file:///<an absolute path to a real .md file>")).text()` → **record whether it
      resolves with the file's bytes, or throws, and the exact error text.**
      **The two outcomes, both acceptable, decided by measurement not hope:** it **works** → Firefox
      content-script watch ships and §3.5 stands as written. It **fails** → **Firefox watch is
      app-page-only**, spec §3.5 narrows **in the same commit as this answer** (spec-anchored, C12), and
      4.4 ships the designed explanation for the content-script surface too, not a dead control.
      Files: `specs/005-watch-diff/spec.md` (§3.5 / §7-1, only if the answer narrows it) ·
      `docs/ai/decisions.md` (record the answer) · `docs/ai/progress.md`
      Verify (**human gate**): the answer is recorded with its error text before 4.4 promises any Firefox
      surface. No code lands on the strength of an assumption here.
      **DONE 2026-07-19 — RUN BY THE HUMAN ON BOTH ENGINES. Both questions answered; full record in
      `docs/ai/decisions.md` (newest entry).**
      **(a) Background `fetch("file:///…")`:** Chromium → `{status: 200, bytes: 845}`, resolves with fresh
      bytes. **Firefox 152 → THREW**, verbatim: `Security Error: Content at
      moz-extension://<id>/_generated_background_page.html may not load or link to file:///…`, then
      `TypeError | NetworkError when attempting to fetch resource.` **This is Gecko's URI security policy,
      not a missing toggle or manifest key** — no permission grants it.
      **(b) §7-4, the question moved here from 2.2:** `performance.getEntriesByType('resource')` → **`[]` on
      BOTH engines.** A `file://` read never enters the Resource-Timing buffer, so the existing
      `/^https?:/i` guards are **correct, not merely conveniently scoped** — nothing to filter out, no
      re-scoping needed. Flip side recorded plainly: the guards prove watch put nothing on the wire and can
      **never** prove the local read happened.
      **CONSEQUENCE — FIREFOX WATCH IS APP-PAGE-ONLY**, taken as the second outcome this task anticipated.
      Both halves of the content-script route are closed (content script cannot re-read its own file per
      task-0; background cannot read `file://` per this check). **Spec narrowed in THIS commit (C12,
      spec-anchored): §3.5 amended, §7-1 and §7-4 marked RESOLVED (kept, not deleted), §4 Degradation
      extended to cover the Firefox content-script surface.** Chromium's two-surface promise is untouched.
      **Also removed: one dead branch in `entrypoints/background.ts`** — the `status !== 0` escape hatch and
      its now-falsified comment (Chromium returns 200; Firefox never reaches the line). Behaviour-preserving
      on the only engine that runs it; `pnpm test` + `pnpm test:browser` green.
      **4.4's PRECONDITION IS NOW SATISFIED** — its answer is recorded in `decisions.md`, and it is the
      negative outcome, so **4.4 covers the content-script surface on Firefox too**, not just the app page.

## 3 — Re-render continuity — THE RISKIEST GROUP (this is where `mount()` stops being read-only library)

- [x] **3.1 Extract `resolveScrollContainer` to a shared module; `tocView` imports it.** It is currently
      **private** at `src/render/tocView.ts:636` and watch is its second consumer. The container genuinely
      differs per surface — `:host` full-page, `.peekover-app__reader` when contained, and the contained
      one is an ancestor **outside the shadow root**. 003 recorded the trap in-code (`tocView.ts:580-593`):
      *"the container must be RESOLVED, never assumed to be `:host`"* — a wrong root silently observes the
      viewport and tracks nothing. Extracting it stops the trap being re-derived a third time. It needs
      `contained` **passed in**: there is no marker on the host recording which surface it is.
      **Pure move — no behaviour change.** If this task changes any observable behaviour, something was
      mis-extracted.
      Files: `src/render/scrollContainer.ts` (new) · `src/render/tocView.ts` ·
      `tests/browser/watchAnchor.browser.test.ts`
      Verify (**tests/browser** — Cr+Fx, `describe.each` over both surfaces): the extracted function
      resolves the **correct** container on each surface (regression pin for 003's trap — assert the
      resolved element identity, not merely that something scrollable came back); the **existing** TOC
      scroll-spy suite (`tocScroll.browser.test.ts`) stays green **unchanged**, which is the real proof the
      move was pure. Golden EMPTY + manifest green.
      **DONE 2026-07-20 — pure move, no behaviour change.** `scrollsVertically` + `resolveScrollContainer`
      now live in `src/render/scrollContainer.ts` with the 003 trap comment carried across; `tocView.ts`
      imports the resolver and its old in-file trap block points at the new home. **Red-first:** replacing
      the body with `return host` (the exact 003 trap — assume `:host`) failed **4 tests across both
      engines** — this suite's contained-surface identity assertion (`expect(resolved).toBe(...)` received
      the host, expected `<main class="peekover-app__reader">`) **and** `tocScroll`'s contained scroll-spy,
      which is the purity proof firing from the other direction. Restored from a `cp` copy, never
      `git checkout`. **`tocScroll.browser.test.ts` passed UNCHANGED** (git status shows `tocView.ts` as the
      only modified file). 44/44 browser files · 335 passed / 5 skipped, both engines; 410 unit; lint clean;
      golden diff EMPTY; manifest green unmodified.

- [x] **3.2 `readingAnchor` — capture + restore (D-3).** Capture: resolve the scroll box (3.1), find the
      **last heading whose top is at or above the scroll position**, record `{ text, index, delta }` where
      `delta` is the pixel gap from that heading's top to the scroll position. Restore: match by **heading
      text** first (stable across re-parses of a mostly-unchanged doc), by **index** if the text is gone,
      and fall back to raw `scrollTop` when the document has no headings or nothing matches.
      **Reuse `buildTocModel(root)`, do not re-derive** — it already runs on every mount immediately before
      the commit (`mount.ts:146`), so the heading model exists at exactly the right moment.
      Files: `src/render/readingAnchor.ts` · `src/render/readingAnchor.test.ts` ·
      `tests/browser/watchAnchor.browser.test.ts`
      Verify (**jsdom/unit** for the pure selection + fallback ladder: last-heading-at-or-above is chosen;
      text match wins; index is used when the text is gone; `scrollTop` when there are no headings).
      (**tests/browser** — Cr+Fx, both surfaces, and this is the half jsdom cannot see): with content
      **INSERTED ABOVE** the reading position, restore puts the **same heading** back at the **same offset**
      — **the case `scrollTop` gets wrong**. Red-first + non-vacuous: assert the naive `scrollTop` restore
      would land somewhere **different** in that same fixture, so the test proves the anchor is doing work
      rather than agreeing with the fallback (the vacuous-persistence-test rule, retro finding 1). Golden
      EMPTY + manifest green.
      **DONE 2026-07-20.** `src/render/readingAnchor.ts` — `{text,index,delta,scrollTop}`, captured off the
      live pre-change DOM, restored text → index → `scrollTop`. The selection and match ladder are PURE
      (`selectAnchorIndex` / `matchAnchorIndex`, numbers + strings, never a node), so jsdom tests it
      honestly (12 unit cases) and the real engine proves only what jsdom is blind to. `buildTocModel` is
      reused, not re-derived.
      **Red-first:** replacing the restore body with the naive `scroller.scrollTop = anchor.scrollTop`
      failed on **both engines AND both surfaces** — the target heading landed **3239.9 px** (full-page,
      Chromium) / **11592.8 px** (contained) from where the reader left it, against a `< 8` bar.
      **The non-vacuity control** measures the naive restore's landing point IN THE SAME FIXTURE and
      asserts the anchor landed >100 px away from it, so the test cannot pass by the anchor merely agreeing
      with the fallback.
      **A REAL HARNESS DEFECT WAS FOUND AND FIXED HERE, and it is worth inheriting:** the usual
      `waitForScrollable` (wait for overflow) returns while the reader is STILL RESTYLING. Measured on the
      full-page surface: `scrollHeight` **81798 px at first overflow → 26069 px once settled**, a 3× reflow.
      A heading offset read in that window is stale by tens of thousands of pixels and the following
      `scrollTop` write CLAMPS to the new maximum — which silently parked the test at the document bottom
      and made the capture pick the LAST heading, deterministically, on both engines. **This suite waits for
      `scrollHeight` to STOP CHANGING, not merely to overflow.** Any future geometry suite in this milestone
      should do the same; overflow is not the precondition, stability is.
      44/44 browser files · 343 passed / 5 skipped both engines; 422 unit; lint clean; golden EMPTY;
      manifest green unmodified.

- [x] **3.3 `MountOptions.preserveReading` + the `mount.ts:151` change — BOTH DIRECTIONS red-first.**
      Add `preserveReading?: boolean` to `MountOptions` (which today has exactly one field, `contained?`,
      and — unlike 004's port — **is already threaded through every caller**, so adding a field is not the
      mistake 004 made). When set, `mount()`: **before** `replaceChildren` captures the reading anchor
      (3.2) and the current `data-mode`; **after** the commit restores the mode **instead of** forcing
      `'reading'`, then restores the anchor.
      **Name the boundary being crossed:** `mount.ts:151` is today an **unconditional**
      `setReaderMode(host, 'reading')`, and `mount()` has been read-only library for four milestones
      (`readerPane.ts:16`). The flag is additive and **defaulted-off**, so existing callers are unchanged —
      but that is a claim to be **proven, not asserted**.
      Files: `src/render/mount.ts` · `tests/browser/watchRemount.browser.test.ts`
      Verify (**tests/browser** — Cr+Fx, both surfaces via `describe.each`, **red-first in BOTH
      directions**): **(a) with the flag** — a reader left in **Raw** mode and scrolled mid-document
      re-mounts still in **Raw**, at the same place (fails before the change: mode resets to `reading`,
      scroll jumps to top). **(b) WITHOUT the flag** — the existing unconditional reset **still happens**,
      because `readerPane`'s routine re-mount depends on it (fails if `:151` is made conditional on the
      wrong thing, or removed outright). Theme survives both paths. **Restore the deliberate break from a
      `cp` copy, never `git checkout src/render/mount.ts`.** Golden EMPTY + manifest green.
      **FALLBACK, sanctioned in advance — do not improvise one.** If `preserveReading` cannot preserve
      Raw/Reading mode without breaking `readerPane`'s reset (direction (b)), **ship ANCHOR-ONLY
      continuity**: scroll place is preserved, mode is not, `mount.ts:151` is left untouched, and mode
      preservation becomes a **spec amendment** (§4's re-render criterion narrows) recorded in
      `decisions.md` with the evidence for why. **This is the 4.2 pattern from M4** — build it, measure it,
      remove it if it fails its bar — and removing it is a SUCCESS, not waste. **Restore from the `cp` copy,
      never `git checkout src/render/mount.ts`.**
      **DONE 2026-07-20 — SHIPPED AS SPECIFIED. The fallback was NOT needed and was NOT taken:** direction
      (b) is satisfiable alongside (a), because the flag is read at exactly one place (whether to CAPTURE at
      all) and every existing caller omits it, reaching `replaceChildren` with nothing read and nothing
      changed. `mount()` gained `preserveReading?: boolean`, a `captureReading` before the commit and a
      `restoreReading` after it; `:151` became `setReaderMode(host, carried?.mode ?? 'reading')`.
      **RED-FIRST, BOTH DIRECTIONS, both engines, both surfaces:**
      **(a)** against the PRISTINE pre-3.3 `mount.ts`: **8 failures** — `expected 'reading' to be 'raw'`
      (mode reset) and `expected 3239.89 to be less than 12` / `expected 11592.78 to be less than 12` (the
      reader's place lost).
      **(b)** making the capture unconditional (ignoring the flag — "conditional on the wrong thing"):
      **8 failures** — `expected 'raw' to be 'reading'`, INCLUDING the test that drives the real
      `readerPane.select()` across two files, which times out waiting for Reading. **That is the app-page
      bug default-off prevents, observed rather than argued.** `readerPane.ts` was NOT modified.
      **RAW-MODE SUBTLETY handled explicitly:** in Raw the reading column is `display:none`, so heading
      rects are all-zero and an anchor restore would resolve to ~0 — a jump to the top. Restore hands
      `restoreReadingAnchor` an EMPTY model in that case, taking its own `scrollTop` rung.
      **A VACUOUS TEST WAS CAUGHT BY THE RED-FIRST PASS ITSELF and is worth inheriting.** The first draft of
      the Reading-mode test APPENDED a section and asserted `scrollTop` was unchanged — and it PASSED
      against a `mount()` with no continuity code at all, because the engine does not reset `scrollTop` when
      `replaceChildren` leaves the box tall enough. The assertion was being satisfied by the browser, not by
      anything this milestone built. It only surfaced because the red run was checked for the RIGHT NUMBER
      of failures rather than merely for "it went red". Rewritten to INSERTED-ABOVE, where holding
      `scrollTop` steady is the wrong answer; it now fails red as it should.
      Restored from `cp` copies throughout; `git checkout` was never used on `mount.ts`.
      46/46 browser files · 367 passed / 5 skipped both engines; 422 unit; lint clean; golden EMPTY;
      manifest green unmodified; `dependencies` still three.

- [x] **3.4 Confirm the TOC re-decide interaction — VERIFY, do not assume (plan §1.3, §4-5).**
      `applyInitialTocState` re-derives `data-toc` from the laid-out width on **every** mount
      (`tocView.ts:498-500`) and could re-open a rail the user just collapsed, on every agent keystroke.
      The recon **believes** 004's persistence already covers this (`setTocOpenByUser` persists on click and
      `saveSettings` updates the snapshot immediately), but *believed covered* is not *tested*.
      Files: `tests/browser/watchRemount.browser.test.ts`
      Verify (**tests/browser** — Cr+Fx): collapse the rail, then re-mount with `preserveReading` → it stays
      **collapsed**, and a stored width survives. **Non-vacuous, per the retro-finding-1 rule — this is
      exactly the shape that produced the vacuous test:** first mount a probe with **nothing stored** and
      read production's own width-derived answer at the harness viewport, then seed the **OPPOSITE** and
      assert `not.toBe(thatFallback)`. If the property turns out NOT to be covered, that is a real finding →
      a task added **below this line**, not a silent fix. Golden EMPTY + manifest green.
      **DONE 2026-07-20 — VERIFIED COVERED. No task is added below this line, and the reason is evidenced,
      not assumed.** The recon's belief was right, and it is covered **more robustly than the recon knew:
      by TWO INDEPENDENT GUARDS, either of which alone is sufficient.** That was discovered BY the red-first
      pass rather than by reading the code — the first deliberate break (disabling
      `applyInitialTocState`'s stored-value early return) left the suite **fully GREEN**, because
      `decide()` carries its own stand-down (`if (currentSettings().tocOpen !== null) return;`, 004's D-F
      guard for the late-publish race) and independently refused to re-derive. Only removing **both** guards
      turned it red: `expected 'collapsed' to be 'open'` on **both engines and both surfaces** — the width
      rule re-opening the rail the user had just collapsed, which is precisely the per-keystroke bug this
      task existed to rule out.
      **The insufficient first break is the finding worth carrying:** a single-break red-first would have
      "passed" while proving only that one of two guards existed. Checking that the break actually went red
      — and investigating when it did not — is what surfaced the real structure.
      **Non-vacuity:** a probe mounts with NOTHING stored and reads production's own width-derived answer at
      this harness viewport (it is **open** here, the opposite of 6.1's narrow-viewport reading — which is
      exactly why it is measured per run and never hardcoded), then the rail is driven to the OPPOSITE
      through the real opener click and asserted `not.toBe` that fallback.
      **A second property is asserted that a "still collapsed" test alone would miss:** the re-mount
      **PERSISTS NOTHING** (`saved` is `[]`). A re-render is not a user gesture — without that, an agent
      typing would issue one settings save, and on the content-script surface one runtime message, **per
      keystroke** for a choice the user never made (D-G).
      Stored width (320 px) survives the rail rebuild. 46/46 browser files · 367 passed / 5 skipped both
      engines; 422 unit; lint clean; golden EMPTY; `manifest.test.ts` 8/8 and byte-unmodified since M2;
      `dependencies` still three.

## 4 — Watch UX (the control is rebuilt every mount; the controller is not — that gap is a seam, not a closure)

- [x] **4.1 The watch control + its registry seam + `data-watch` on the host.** A control in `mount()`'s
      `children[]`, committed as a **sibling of `.peekover-reader`** — never inside the reading column —
      styled from **design tokens only** (never hardcoded colors; the mode toggle / theme pill / remote-load
      pill are the established family). Active state lives on the **host** as `data-watch="active"`, so CSS
      and AT both see it **and — critically — it survives `replaceChildren`**, which matters precisely
      because watch causes the re-render that would otherwise erase it.
      **The seam is the whole point of this task:** the control is rebuilt on every mount, the controller is
      not, so the button reaches start/stop through a **module-level register-once registry** — exactly as
      004's theme control needed `registerThemeSaveSink` (D-A). **A controller reference held in the
      button's closure dies every render.** Do not hold one.
      Files: `src/watch/watchControl.ts` · `src/render/mount.ts` · `src/theme/readerCss.ts` (pill rule,
      tokens only) · `entrypoints/peekover.content.ts` · `src/app/appShell.ts` ·
      `tests/browser/watchControl.browser.test.ts`
      Verify (**tests/browser** — Cr+Fx, both surfaces via `describe.each`): the control renders and toggles
      on the content-script full-page reader AND the app-page `{contained}` pane; **STRUCTURAL assertion —
      the control is a SIBLING of `.peekover-reader`, asserted on the DOM**, because per the standing note
      above **the golden pin cannot see this** and the DOM assertion is the only guard; `data-watch`
      survives a re-mount; the control still works **after** a re-render (the closure-death case — red-first:
      swap the registry for a captured reference → this fails). a11y: watch state is exposed to AT and is
      **never colour-only**. Golden EMPTY + manifest green.
      **DONE 2026-07-20.** `src/watch/watchRegistry.ts` (the ONE holder) + `src/watch/watchControl.ts`
      (the pill) + the `.peekover-watch` rule in `readerCss.ts`; `mount.ts` pushes it into
      `children[]` as a sibling of `.peekover-reader`.
      **THE REGISTRY SUBSUMED 2.2's HOLDER RATHER THAN DUPLICATING IT, using the codebase's own
      precedent:** when 004's group 6 needed the theme-only save seam for the TOC too, it
      generalized into `settingsSeam.ts` and left `registerThemeSaveSink` a one-line DELEGATE (D-E).
      Same move — the single holder now lives in `watchRegistry.ts` and holds a `WatchTarget`
      (`start(host)`/`stop()`/`isWatching()`), while `watchRelay`'s `registerWatchDetector` /
      `getWatchDetector` keep their names, signatures and call sites (`peekover.content.ts`
      **untouched**) and adapt the bare `ChangeDetector` into that shape. ONE piece of module state,
      two names.
      **PLACEMENT — BOTTOM-LEFT, `bottom:96px`, third in the stack (net 16 → theme 56 → watch 96),
      chosen BY MEASUREMENT with a throwaway probe (built, run on both engines, deleted).** The
      rects that ruled the others out, full-page @414×896, TOC open: **top-right** = mode toggle
      `[341,16,398,46]`, and the row beneath it lands at y 56–86 **inside the TOC handle
      `[280,56,392,102]`** — 004's measured collision, reproduced; **top-left** = the remote-load
      pill, which exists only on documents with blocked media; **bottom-right** = inside the TOC
      rail box `[257,0,414,896]` **and its live entry list, which runs to y=988**, past the viewport
      bottom. Bottom-left was the only corner clearing everything.
      **`--ok` / `--ok-soft` ALREADY EXISTED** in `readerCss.ts`, in BOTH themes, copied verbatim
      from `design/tokens.css` — this was NOT a repeat of 004's D-1 sepia trap, and no token was
      added. **One mockup declaration deliberately dropped:** its
      `color-mix(in srgb, var(--ok) 35%, transparent)` border — `color-mix()` appears NOWHERE in
      shipped CSS (grepped), so the pill family's own `var(--line)` border is used rather than
      introducing a CSS feature for one border. The `--ok` semantic is carried by the text and dot.
      **RED-FIRST — AND THE FIRST BREAK WAS INSUFFICIENT, which is the finding worth carrying.**
      Swapping the click-time `getWatchTarget()` for a build-time captured reference left the suite
      **fully GREEN (46/46)**: across a plain re-render the registry holds the SAME OBJECT, so the
      capture still finds it. The "still works after a re-render" test could never have gone red.
      What actually dies is a capture taken before the slot's OCCUPANT changes — which production
      does constantly (4.2 replaces this task's adapter in the same slot; 4.3 re-registers on a
      document switch; the app page registers only once a file is open). A test for THAT was added
      and the same break then failed **4× — both engines, both surfaces**:
      `AssertionError: expected [] to deeply equal [ Array(1) ]` (the click reached the dead target).
      **Second red-first — the sibling pin, and it re-proves the 5.1 correction of record:**
      committing the control into `root` instead of `children` left `git diff tests/golden/output/`
      **EMPTY and golden.test.ts GREEN 10/10**, while the DOM assertion failed on both engines with
      `expected <div class="peekover-reader">…(5)</div> to be ShadowRoot{}`. The DOM assertion is
      the sole guard, exactly as the standing note says.
      **Reduced motion, non-vacuous in ONE run:** the infinite pulse computes
      `animation-name: peekover-watch-pulse`, `duration 2s`, `iteration-count infinite` under
      `no-preference`, and `< 0.01s` under `reduce` — so the reduce assertion cannot be satisfied by
      a dot that never animated.
      **A11y — never colour-only:** three independent carriers (visible text "Watching"/"Watch this
      file", native `aria-pressed`, and an `aria-label` naming state + action); the dot is
      `aria-hidden`. **A context with no registered target grows NO control at all** — never a dead
      button (the shape 4.4 builds its explanation on).
      Restored from `cp` copies throughout; `git checkout` was never used. 48/48 browser files ·
      417 passed / 5 skipped both engines; 422 unit; lint clean; golden EMPTY; manifest green
      unmodified; `dependencies` still three.

- [x] **4.2 `watchController` — start/stop, the update signal, follow-at-bottom-only.** Owns the
      detector→re-render loop: on new text, re-mount with `{ preserveReading: true }` (3.3) and fire a
      **brief, non-intrusive** update signal. **Follow is opt-in-by-position:** at the bottom → follow the
      new content; scrolled **away** → **never move them**. Under `prefers-reduced-motion` any signal or
      follow-scroll is **INSTANT** — test it with the existing `emulateReducedMotion` browser command
      (verified on both engines; no new harness needed). Debounce is deliberately **NOT chosen here** — it
      is group 5's, from measurement.
      Files: `src/watch/watchController.ts` · `src/watch/watchController.test.ts` ·
      `tests/browser/watchControl.browser.test.ts`
      Verify (**jsdom/unit**: the pure at-bottom predicate and the re-render call are made with
      `preserveReading: true`.) (**tests/browser** — Cr+Fx, both surfaces, red-first): scrolled to the
      bottom, appended content **follows**; scrolled to the middle, the same update leaves `scrollTop`
      **unmoved** (red-first: an unconditional follow fails this on both engines); under
      `emulateReducedMotion('reduce')` the follow and the signal are **instant** (no animation frames of
      transition), and **non-vacuously** — assert the un-reduced path differs, or the test proves nothing.
      Golden EMPTY + manifest green.
      **DONE 2026-07-20.** `src/watch/watchController.ts` + `.test.ts` (10 jsdom cases) +
      `tests/browser/watchControl.browser.test.ts`. Registered as a `WatchTarget` into 4.1's
      registry, so it REPLACES that task's thin detector-backed adapter in the same slot.
      **M3 — THE SPEC SHIPPED, NOT THE MOCKUP, AND THE DIVERGENCE IS RECORDED IN-CODE** (a
      `Do not "fix" this to match the mockup` note heads `watchController.ts`). The mockup's
      unconditional `scrollIntoView({block:'center'})` is NOT shipped; follow is opt-in-by-position
      per spec §4. **Red-first:** reinstating the mockup's behaviour failed **4× — both engines,
      both surfaces** — `AssertionError: expected 25546 to be less than 40` (Chromium full-page),
      `25636` (Chromium contained), `25554.7` (Firefox). The reader was yanked **~25,500 px** down
      the document, which is the hijack §4 forbids, measured. Note the AT-THE-BOTTOM test stayed
      GREEN under that break — which is exactly why the PAIR is the test and neither half alone is.
      **THE UPDATE SIGNAL — DECIDED AND JUSTIFIED: it flashes the CONTROL, not the document.**
      005 re-renders the whole document and cannot know WHICH element changed without a diff, and
      the diff is 006 (D-1). Three candidates were weighed in-code: (a) the changed element — needs
      006's diff, and building a diff to obtain a flash inverts the milestone split; (b) the reading
      column / reader root — a full-width background wash across the entire document on **every
      agent keystroke**, the most intrusive option on the list and a breach of "the document stays
      the hero"; (c) the watch pill itself — the chrome whose meaning already IS "this file is
      live". **(c) ships**, reusing the mockup's own `flash` keyframe and its 1.6 s duration. It
      claims only what 005 knows (the file changed), not what it does not (where), and 006's
      per-element flash becomes an ADDITION rather than a rewrite.
      **THE TOAST IS SKIPPED — noted here for 006, not forgotten.** The reader has no toast
      primitive; adding one means a new corner, a new stacking context, a new dismissal contract and
      a new set of geometry assertions against the five pieces of chrome already in the corners. The
      pill flash carries the same information at a fraction of the surface area. 006 has more to SAY
      ("3 lines added") and can build the primitive then.
      **Reduced motion, non-vacuous in one run:** the flash computes `1.6s` under `no-preference`
      and `< 0.01s` under `reduce`; the follow needs no branch in the controller because
      `readerCss.ts` already flips `:host{scroll-behavior}` smooth→auto — asserted as computed
      `'smooth'` vs `'auto'` AND as the follow having LANDED on the first frames under reduce.
      `matchMedia` is checked both ways first, so the suite cannot pass by the emulation being
      unwired.
      **TWO HARNESS DEFECTS FOUND AND FIXED HERE, both worth inheriting.** (i) The contained
      surface was mounting a BARE div, so `resolveScrollContainer` took its documented
      degenerate-mount fallback to the host — which in normal flow grows to its content and **never
      scrolls**, making every follow assertion measure an immovable box. Production always has
      `<main class="peekover-app__reader">` (overflow:auto) around the host; the harness now does
      too. **Task 3.1's trap is real in the harness, not only in production.** (ii) The reading
      column was captured BEFORE the update and asserted on after — but `mount()` had replaced it,
      and `getComputedStyle` on a detached node returns `''`, not `'none'`, so the assertion would
      have passed for the wrong reason. Re-queried after the commit.
      Restored from a `cp` copy; `git checkout` was never used. 48/48 browser files · 431 passed /
      5 skipped both engines; 432 unit; lint clean; golden EMPTY; manifest green unmodified;
      `dependencies` still three.

- [x] **4.3 Lifecycle — a gesture starts it, switching documents STOPS it, a dead read surfaces a designed
      state (plan §1.10).** Nothing watches by default; starting is a **user gesture** on the control (spec
      §4 Trust — and note that criterion is now its own bullet, split from the snapshot half at gate 3).
      **Switching documents stops the previous watch — this is a REAL BUG the design prevents, not an edge
      case:** `readerPane.select()` re-mounts the shared host with a different file
      (`readerPane.ts:177-178`), and a watch left running would feed **the old file's** content into **the
      new document's** reader. Closing the tab ends it by construction (§1.2). A read failure — deleted,
      moved, permission revoked, or 1.2's dead observation — **stops the watch and surfaces a designed
      state**; never retry forever, never fail silently (spec §4, AGENTS.md #5).
      Files: `src/watch/watchController.ts` · `src/app/readerPane.ts` · `src/app/appShell.ts` ·
      `tests/browser/watchLifecycle.browser.test.ts`
      Verify (**tests/browser** — Cr+Fx, red-first): watch document A, `select()` document B → **A's
      detector is stopped** (assert the stop, then assert A's subsequent change produces **no** re-render of
      B — the cross-feed bug, which fails before the stop is wired); a `read` that starts failing stops the
      watch and renders the designed state, **with the last good render still on screen** (never blank);
      nothing watches until the control is clicked (assert no detector starts on plain mount). Golden EMPTY
      + manifest green.
      **DONE 2026-07-20.** `tests/browser/watchLifecycle.browser.test.ts` (14 cases, both engines);
      `readerPane.select()` now calls `stopWatch()` FIRST, before its async read, so there is no
      window in which the old watch can fire against a pane mid-switch.
      **THE CROSS-FEED BUG WAS OBSERVED, NOT ARGUED.** Red-first, removing that one call: 4 failures
      on both engines. The MECHANISM assertion fires first (`expected +0 to be 1` — no stop), so the
      CONSEQUENCE was isolated in a second pass by temporarily dropping the mechanism assertions
      with the break still in — and it fails on its own:
      `AssertionError: expected 'File A
A was edited after the switch…' to contain 'File B'`.
      That is the reader **displaying file A's freshly-read text while the user has file B open**,
      with no error and no clue — the silent-wrong-answer class, caught in the act.
      **THE DEAD-READ PATH needed an error channel group 1 did not have, and it was added along
      group 1's OWN stated boundary rather than across it.** `changeDetector.ts` said in its header
      that it "deliberately owns no dead-read POLICY". So `ChangeDetector.start` gained an OPTIONAL
      second arg `onError` — the detector REPORTS a failed read (still swallowing it, still polling,
      byte-identical for every caller that omits the arg) and the CONTROLLER counts. The policy is
      `DEAD_AFTER_FAILURES = 3` **consecutive** failures: >1 because a file mid-rewrite can briefly
      fail to open and dying on the first blip would be useless against the very workload watch
      exists for; small because §4 forbids retrying forever. A good read clears the streak, and that
      is asserted (2N-2 non-consecutive failures do NOT kill a working watch).
      **The designed state is ONE channel serving 4.3 and 4.4**, because from the user's side they
      are the same case: `.peekover-watch-note`, a `role="status"` polite live region driven by
      `setWatchNote()`. It appears **with NO re-render**, which is precisely what keeps the last
      good render on screen — asserted directly (`columnText` still contains the previous document).
      The toggle STAYS on the dead-read path, because retrying is the user's call; a restart clears
      the stale note, because a "stopped watching" message over a running watch is the same honesty
      failure inverted.
      **A TEST-ISOLATION BUG IN MY OWN RESET HELPERS, found by this suite and worth inheriting:**
      `resetWatchRegistryForTest()` clears the registry's listener SET, but the once-guard
      (`subscribed`) lives in `watchControl.ts`. Clearing one without the other leaves
      `subscribed === true` with NO listener registered, so every control built after the first
      reset silently never syncs — the note that should have appeared stayed hidden, on both
      engines. The two are now reset together, with the reason recorded on the function.
      Restored from `cp` copies; `git checkout` was never used. 14/14 lifecycle; 50 browser files ·
      445 passed / 5 skipped both engines; 432 unit; lint clean; golden EMPTY; manifest green
      unmodified; `dependencies` still three.

- [x] **4.4 Firefox degraded state — a designed explanation at the moment it matters (spec §7-8).**
      **Depends on 2.3's answer.** On Firefox, watch works only for **drag-opened** folders: the
      `<input webkitdirectory>` picker route yields permanently stale reads (measured — ~45 ticks across a
      real on-disk edit, `lastModified`/`size` never moved). A user who used the file input gets no watch
      and today would have no idea why. Ship the **designed explanation in plain language, at the moment it
      matters** — **not a disabled control, not a dead toggle** (spec §4 Degradation; the same honesty
      posture M2 took for Firefox's read-only folder snapshot). **If 2.3 came back negative, this task also
      covers the content-script surface on Firefox** and the spec narrows with it.
      Files: `src/watch/watchControl.ts` · `src/theme/readerCss.ts` · `entrypoints/peekover.content.ts` ·
      `tests/browser/watchLifecycle.browser.test.ts`
      Verify (**tests/browser** — Cr+Fx): **PRECONDITION — do NOT start 4.4 until 2.3's answer is RECORDED
      in `docs/ai/decisions.md`.** If it is not there, STOP and report rather than assuming either outcome.
      The answer determines whether this task covers the Firefox app-page surface only, or the
      content-script surface too.
      Then: on the picker-opened (non-drag) Firefox path the control presents
      the **explanation** state rather than a silently inert button; Chromium is unaffected (assert the
      normal control still renders — a degraded state that leaks into the working engine is the failure mode
      here). Whether the explanation is **discoverable and reads as honest rather than broken** is
      **7.1**, not this test. Golden EMPTY + manifest green.
      **DONE 2026-07-20. PRECONDITION RE-CHECKED FIRST:** 2.3's answer IS recorded in
      `docs/ai/decisions.md` (2026-07-19) and it is the NEGATIVE branch, so this task covers BOTH
      Firefox cases. `src/watch/watchAvailability.ts` (+ 8 jsdom cases) holds the PURE decision;
      `peekover.content.ts` and `appShell.ts` wire it; `tests/browser/watchLifecycle.browser.test.ts`
      proves it on both engines.
      **A REAL FINDING THAT CHANGED THE IMPLEMENTATION — the seam CANNOT distinguish the two
      Firefox app-page routes.** 4.4 as written assumes "watch works only for drag-opened folders",
      which implies the routes are distinguishable. Reading `folderSource.ts` shows they are not:
      `folderSourceFromFileList` (picker) and `folderSourceFromDataTransfer` (drag) BOTH converge on
      `persistable:false` with no handle. They differ only in a capability the seam does not express
      — on the DRAG path `File.text()` reads FRESH BYTES while the picker path is frozen through
      (task 1.1's header vs 4.4's ~45-poll measurement). **`folderSource.ts` is OUTSIDE this
      milestone's file fence**, so a `watchable` bit was NOT added to the seam. Instead `appShell`
      — which IS in fence and calls the two routes from two DISTINCT call sites (`runOpenFolder`
      vs `runDrop`) — records which route produced the active source and passes it to the pure
      decision. **Teaching `folderSource` a `watchable` bit is the tidier home and is flagged as a
      006 cleanup**, not smuggled in here.
      **NOT ENGINE SNIFFING, and the distinction is stated in-code** because `firefoxFolderSource.ts`
      set the opposite precedent ("branch on `persistable`, never on the engine"). Two different
      questions get two different honest signals: the APP PAGE asks about the SOURCE
      (`persistable` + route — so a Chromium build taking a degraded route degrades identically);
      the CONTENT SCRIPT asks about the ENGINE, which is genuinely what varies, via WXT's
      BUILD-TIME `import.meta.env.FIREFOX` — a fixed property of the targeted artifact, measured at
      2.3, not a runtime probe. The pure function takes it as a parameter, so it stays `#imports`-free.
      **This task also completed the app page's watch WIRING** (per selected file, in
      `selectFolderFile`), which is what makes the decision live code rather than a dead branch.
      **RED-FIRST:** keying the decision on `persistable` ALONE (the seam-only heuristic) failed in
      BOTH suites — jsdom `expected { watchable: false, …(1) } to deeply equal { watchable: true,
      note: null }` and `expected false not to be false`; real-engine, both engines,
      `expected null to be truthy` (the working Firefox DRAG route rendered no control at all).
      **Non-vacuity:** the drag case is the SAME `persistable:false` input taking the other branch,
      so the explanation is demonstrably specific to the route that truly cannot re-read rather than
      to non-persistability in general. **Chromium-unaffected is asserted for BOTH its surfaces** —
      a degraded state leaking into the working engine is this task's real failure mode.
      Restored from a `cp` copy; `git checkout` was never used. 8 unit + 22 lifecycle cases;
      440 unit; 453 passed / 5 skipped browser both engines; lint clean; golden EMPTY; manifest
      green unmodified; `dependencies` still three.

- [x] **4.5 (DISCOVERED at 4.4 — the group-3 flake watch item is now IDENTIFIED and ROOT-CAUSED, and
      GROUP 4 AGGRAVATED IT.) Make `pnpm test:browser` deterministic again.**
      **This is a STOP-and-flag, not a silent fix: the change belongs in `vitest.config.ts`, which is
      outside 005 group 4's file fence.** Nothing was edited there.
      **What was an unidentified 1-in-11 failure with no captured name (progress.md, group-3 close)
      now has names, a signature, and a measured mechanism:**
      - **Signature:** ALWAYS Firefox, ALWAYS the FULL-PAGE surface (`:host{position:fixed;inset:0}`,
        i.e. the scroll box is sized to the viewport), ALWAYS a scroll/geometry assertion. Captured
        names across this session: `tocScroll` *"activating an entry scrolls its heading into view"*;
        `watchAnchor` *"resolves the EXACT element that scrolls"* and *"restores the SAME heading at
        the SAME offset…"*; `watchRemount` *"a reader in READING mode keeps its PLACE…"*;
        `watchControl` *"AT THE BOTTOM, appended content is FOLLOWED"*. Messages are of the form
        `expected 0 to be greater than 0`, `expected 8092.6 to be greater than 8092.6`,
        `expected 2816.4 to be less than 12` — **a plausible WRONG position, or no movement at all;
        never an error.** Same silent-wrong-answer class as 003's mis-resolved scroll root.
      - **MECHANISM, measured:** cross-file CONCURRENCY. `pnpm exec vitest run --project browser
        --no-file-parallelism` → **3/3 runs GREEN**. With parallelism → ~40% of runs fail.
        Test files share ONE browser window, so a `page.viewport()` resize (or simply contention)
        lands under another file measuring viewport-sized scroll geometry.
      - **GROUP 4 AGGRAVATED IT, and this is stated plainly rather than shrugged off.** Measured in a
        git worktree at `5cf9be4` (pre-group-4, after `wxt prepare`): **5/5 runs GREEN, 367 passed.**
        At group-4 HEAD: ~40% failing. The suite grew 372 → 458 tests and 47 → 50 files, pushing
        concurrency past the threshold. **A first mitigation was applied inside the fence and was NOT
        sufficient:** `watchControl`'s viewport resizing moved from a global `beforeEach` (~30 resizes
        per run) into the geometry tests only (~6, restored immediately). It helped marginally and did
        not fix it, which is itself evidence that raw concurrency — not resizing alone — is the cause.
      - **Proposed fix (for the human to approve):** set `fileParallelism: false` on the `browser`
        project in `vitest.config.ts`, or isolate the full-page geometry suites into a sequential
        group. Cost is wall-clock only. **Do NOT weaken any assertion to make this green** — every
        one of these tests is a real, red-first-proven guard, and the failures are the harness, not
        the code.
      - **Until it is fixed, `pnpm test:browser` MUST be run with `--no-file-parallelism` for a
        trustworthy result**, and every green claimed at 4.1–4.4 was verified that way or on a clean
        parallel run.
      Files: `vitest.config.ts` (OUT OF FENCE — human decision) · `docs/ai/progress.md`
      Verify: 10 consecutive full `pnpm test:browser` runs green, both engines, under whatever
      configuration is chosen.
      **DONE 2026-07-21 — `fileParallelism: false` on the `browser` project, chosen FROM measurement, not
      taste.**
      **The harness-vs-product argument, stated and confirmed rather than assumed:** the failure shape is
      this milestone's silent-wrong-answer class (a plausible wrong scroll position, never an error), so
      "it's the harness" had to be argued. It holds: `--no-file-parallelism` fixes it **while the same
      test still resizes the same viewport** — the only variable that flips pass→fail is cross-file
      concurrency, not the resize. The mechanism is that the in-browser files share ONE window per engine
      and its VIEWPORT is a window-global property, so one file's `page.viewport()` resize lands under
      another file's geometry measurement. Reproduced this session, exact signature: `|firefox|
      tocScroll.browser.test.ts > full-page host: activating an entry scrolls its heading into view` →
      `AssertionError: expected 0 to be greater than 0`.
      **TWO options measured (medians of 3 full runs each, this machine, headless):**
      - **(a) Global serial** (`fileParallelism: false`, chosen): **62s**, and the flake is gone.
      - **(b) Narrower — Firefox INSTANCE serial only** (`{ browser:'firefox', fileParallelism:false }`,
        Chromium left parallel): **57s**, also green. Vitest accepts per-instance `fileParallelism`
        (`BrowserInstanceOption`), so this was a real option, not a hypothetical.
      - Parallel baseline for scale: **26s**, but **1 of 3 runs failed** (the flake, reproduced).
      **The choice, justified from the numbers:** the narrower option saves only **~5s** (57 vs 62) for an
      **asymmetric, harder-to-explain config** ("why is only Firefox serial?"), because the Firefox
      geometry files ARE the long pole — serializing them is most of the cost either way, and the two
      instances barely overlap. Under the task's own rule (serial in seconds → take it; minutes → earn the
      complexity), the whole suite runs in **under a minute**, so global serial's simplicity wins. The
      +36s over parallel is **dev/CI wall-clock only — `pnpm test:browser` time is not a shipped metric**,
      and group 6 re-measures PRODUCT perf (bytes/first-paint via the `perf-*` scripts), not test runtime.
      **VERIFIED BY REPETITION: 12 / 12 consecutive full `pnpm test:browser` runs GREEN** (453 passed / 5
      skipped, both engines) on the chosen config. **NO assertion was weakened** — every geometry check is
      the same red-first-proven guard; only the config changed. Golden diff EMPTY; `manifest.test.ts`
      green (in the 440-unit run, byte-unmodified); lint clean; `dependencies` still three.
      **One environment note, kept out of the committed config:** Vitest's default browser API port
      (63315) fell inside a Windows reserved range on this machine (`EACCES`), so the measurement runs used
      a temporary `browser.api.port` override. It is orthogonal to parallelism (it only picks which port
      the server binds) and was **removed before commit** — the committed diff is the comment +
      `fileParallelism: false` and nothing else. A future run on a machine with the same reservation may
      need the same local-only override.

- [x] **4.6 (DISCOVERED at 4.5, then RESCOPED. The original Chrome file-URLs premise is FALSIFIED — that
      record is kept in full below, unchanged. The reachable analogue it surfaced was ACCEPTED by the human
      and SHIPPED 2026-07-21 — see the RESCOPE note at the end of this entry.)**
      **What 4.6 assumed:** the Chromium build hard-codes `backgroundCanReadFileUrls: !import.meta.env.FIREFOX`
      (= `true`), but Chromium's background can only read `file://` when the user enabled "Allow access to
      file URLs" (OFF by default). A fresh-install user would then get: reads fail → 3 failures → 4.3's
      dead-read note ("moved, renamed, or deleted"), which misdirects.
      **Why the premise does not hold — TWO independent reasons, verified before building on the API
      (the milestone has been burned by assumed API behaviour twice: 4.1's 26ms, 2.3's Firefox `file://`):**
      - **(1) ONE toggle gates BOTH content-script injection AND the background read.** Chrome exposes a
        single per-extension "Allow access to file URLs" setting — verified: `isAllowedFileSchemeAccess()`
        exists (`Promise<boolean>`, Chrome 99+ MV3, in WXT's `browser.extension`), documented as "the
        user-controlled per-extension 'Allow access to File URLs' setting". That same toggle gates whether a
        `file:///*.md` content script is **injected at all** (Chrome match-patterns docs: `file:///`
        "requires the user to manually grant access") **and** the background's `file://` read (this repo's
        2.3 record got `200` only because 7.1 enables it). So a content script **running** on a `file://`
        page necessarily has access → the background read works. On a fresh install (toggle off) the script
        is never injected — no control, no note, no misdirection. Detecting via `isAllowedFileSchemeAccess()`
        would return `true` on every running file:// surface, making a file-access-denied note an
        **unreachable branch** — which `watchAvailability.ts` explicitly forbids ("Every branch is
        reachable"). **The current hardcoded `true` is CORRECT for the file:// content-script surface.**
      - **(2) The content script has no dead-read policy anyway.** It wires the thin 4.1
        `registerWatchDetector` adapter (`start(){ detector.start(()=>{}) }` — no re-render, no `onError`),
        NOT `createWatchController` (which owns `DEAD_AFTER_FAILURES`); the controller is used ONLY by
        `appShell.ts`. So 4.6's "3 failures → dead-read note" cannot fire on the content script — that note
        is app-page-only.
      **THE REACHABLE ANALOGUE — proposed for a human decision, NOT implemented (it changes 4.6's copy and
      verify criteria):** the content script also offers a watch control on the REMOTE `http(s)` raw
      surfaces (raw.githubusercontent / gist / gitlab-raw / bitbucket-raw), where the relay refuses every
      non-`file://` read and watching remote is explicitly out of 005's scope. The clean, **synchronous**
      fix (no async round-trip, no mount-ordering problem) is to gate the content-script watch on
      `isWatchableFileUrl(location.href)`, so a remote surface shows an explanation (or no control) rather
      than one that cannot work — the same honesty posture 4.4 took for Firefox. **STOP-and-flag per the
      task's own instruction ("say so and propose the alternative rather than shipping a guess").**
      **The one un-automatable confirmation** — that the content script does NOT inject with the toggle off
      — is a 5-second 7.1 check, not a guess to build on. Full record: `docs/ai/decisions.md` 2026-07-21.
      Files (INVESTIGATED, none modified): `entrypoints/peekover.content.ts` · `src/watch/watchAvailability.ts`
      · `src/watch/watchRelay.ts` · `entrypoints/background.ts`. `permissions: []` untouched — and note
      explicitly: file-URL access is a Chrome UI toggle, **not** a manifest permission, so nothing here was
      ever an AGENTS.md #4 event.
      **── RESCOPE — SHIPPED 2026-07-21. The human accepted the reachable analogue; it is the real defect,
      and it is now gated. Same class 4.6 was reaching for, different location: not "Chromium without file
      access" but "a content script on a REMOTE page."**
      **The defect, confirmed:** the content script's `matches` include `raw.githubusercontent.com`,
      `gist.githubusercontent.com`, `gitlab.com/*/-/raw/*`, `bitbucket.org/*/raw/*`. On those pages the old
      `watchCapability({surface:'content-script', …})` returned **watchable** — it never asked what the URL
      was — so `buildWatchChrome` rendered a **live-looking control**. Clicking it sends an `https://` URL to
      the relay, 2.1's `isWatchableFileUrl` correctly refuses it, and `pollingDetector` swallows the
      rejection and keeps polling: **one refused message per second for the life of the tab, nothing rendered,
      nothing explained** — the dead control spec §4 forbids, on a surface where spec §6 says watch is out of
      scope ("http(s) documents are not watched").
      **The gate (pure, SYNCHRONOUS — none of the original 4.6's async/mount-ordering cost):**
      `watchCapability`'s content-script branch now takes `documentIsWatchableFile`, and returns the
      **unavailable** state (note, no toggle) when it is false. The content script computes it with the
      relay's OWN predicate — `isWatchableFileUrl(location.href)` from `watchRelay.ts` — so there is **one
      authority** and nothing to drift. It is **passed as a boolean**, not imported into the pure decision:
      that keeps `watchAvailability` engine/DOM-free and unit-testable with plain values, exactly as
      `backgroundCanReadFileUrls` and the app-page `persistable`/`route` are. Ordering of the branch is
      REMOTE-first (engine-independent — a remote page is remote on both builds), then the file:// access
      check.
      **The note is a SCOPE STATEMENT, not an error** (`REMOTE_DOCUMENT_NOTE`): *"Peekover watches local
      files for changes. This document is loaded over the network, so there is no file on disk to follow —
      you are seeing it as it loaded."* It names no fault and no fix, because there is neither — deliberately
      unlike 4.4's Firefox notes (a platform limit *with* a "do X instead" route) and 4.3's dead-read note (a
      failure the file suffered).
      **The three notes are NOT interchangeable — RED-FIRST proven.** Swapping `REMOTE_DOCUMENT_NOTE` ↔
      `FIREFOX_CONTENT_SCRIPT_NOTE` in the decision failed **3 unit cases** (`watchAvailability.test.ts`: the
      Firefox-local case, the remote case, and "remoteness dominates") **and 6 browser cases** (the (b)
      Firefox, (c) remote, and render-level discrimination tests × both engines) —
      `expected 'Peekover watches local files…' to be 'Watching isn't available…'` and its mirror. Restored
      from a `cp` copy; `git checkout` was never used. The unit properties test also pins REMOTE ≠ the
      dead-read note (it must not match `/could not|error|failed/`) and REMOTE ≠ the Firefox notes (no
      `/Firefox|isn't available|instead/`).
      **`file://` behaviour is BYTE-IDENTICAL, asserted:** Chromium's file:// content script keeps its
      control (the CHROMIUM-UNAFFECTED test, `documentIsWatchableFile:true`), and Firefox's file:// keeps its
      existing note unchanged. **And on a remote page NO detector is registered** — the browser test asserts
      `watchAvailable()` is `false` there, mirroring production, which registers a detector ONLY in the
      `watch.watchable` branch. So no detector, no polling loop, no per-second refused message. (Second
      finding checked and NEGATIVE: no detector is left registered on remote.)
      Files (RESCOPE, modified): `src/watch/watchAvailability.ts` (+ `watchAvailability.test.ts`) ·
      `entrypoints/peekover.content.ts` · `tests/browser/watchLifecycle.browser.test.ts`. **`watchRelay.ts`
      UNCHANGED** — its `isWatchableFileUrl` was already exported and is reused as-is (the authority).
      `permissions: []` untouched; **D-1 no storage · D-2 no dependency** (still three); golden diff EMPTY;
      `manifest.test.ts` green unmodified. `pnpm test` **445** (was 440); `pnpm test:browser` **457 passed /
      5 skipped** both engines (was 453), suite still 50 files, serial per 4.5.

- [ ] **4.7 (DISCOVERED while preparing 5.2. `observerDetector` was BUILT, TESTED, MEASURED — and WIRED
      INTO NOTHING, so a spec §4 acceptance criterion was FALSE in shipped code.)
      Wire `observerDetector` on the Chromium app page.** Filed under group 4 because it is
      `installWatchForFile` wiring; the provenance is 5.2's preparation.
      **THE FINDING.** `grep -rn "observerDetector" src/ entrypoints/` returned its own definition and one
      comment — nothing imported it. Every shipped watch path polled at `WATCH_INTERVAL_MS = 1000`: the app
      page via `pollingDetector(() => file.read(), …)`, the content script via `pollingDetector(relayRead(…))`.
      So spec §4's *"While watching on Chromium on the app page, the system shall detect changes **without
      polling**"* was **false**, and §3.2 / plan §1.1's 2×2 rested on it. **The cause was architectural, not
      careless:** `FileSystemObserver.observe()` needs a `FileSystemHandle`, and M2 deliberately abstracted
      handles away behind `MarkdownFile.read()` — an abstraction that is *correct* and is why Firefox works
      at all. Group 1 built the observer against handles; group 4 found none at the seam and used polling.
      **Nothing failed:** 1.2's suite drove the module directly, 4.3/4.4's suites drove hand-written
      detectors, and the polled path worked — it was simply the wrong mechanism. **`appShell.test.ts` has no
      watch coverage at all, and every watch suite registers its own target before mounting**, so nothing in
      the repo could see it. **The decision was to WIRE IT, not to amend the spec:** polling at 1 Hz is cheap
      (0.6–2.4 ms/tick, 5.1), so this is not performance — event-driven-on-Chromium is the design, it is
      written into the acceptance criteria, and 7.1 would otherwise have failed on it.
      **WHERE THE HANDLE COMES FROM — the walk ALREADY HELD ONE and threw the reference away.**
      `chromiumFolderSource.fileNodeFromHandle(handle)` built `read: async () => (await handle.getFile()).text()`
      — closing over a real `FileSystemFileHandle` and keeping no reference to it. So the fix is *stop
      discarding it*, not *go and get one*: `WalkFileNode.handle` → `FoundFile.handle` → `MarkdownFile.handle`,
      all OPTIONAL and PASS-THROUGH. **Five lines of code across three files** (plus the comments explaining
      why). `walkPolicy` never reads it and no policy decision depends on it — it names a lib.dom type in a
      type position only, stays referentially transparent, and its 270-line suite passes UNCHANGED.
      A WeakMap keyed on the `read` closure was rejected as the alternative that touches no shared file: it
      would break SILENTLY the first time anyone wrapped `read`, degrading to polling with nothing going red
      — which is the exact failure mode this task exists to remove.
      **THE BRANCH IS A CAPABILITY CHECK AND CANNOT BE READ AS AN ENGINE SNIFF.** New module
      `src/watch/detectorForFile.ts`, the factory `changeDetector.ts`'s own header always described and that
      did not exist: `file.handle && ctor → observerDetector`, else `pollingDetector` (byte-identical to
      before). It contains no `import.meta.env`, no UA string, no engine name. **Firefox reaches the fallback
      BY ABSENCE** — its picker yields `File`s and its drag route yields `FileSystemFileEntry` (the OLD
      Entries API, not a `FileSystemHandle`) — **so no Firefox source module was touched**, which is the
      claim, not an aspiration. A picker-disabled Chromium (Brave/flag-gated) degrades identically.
      **Handle-but-no-observer ALSO falls back**, up front, so no doomed `observe()` and no spurious degraded
      report. **The content script still polls and that is correct** (URL only, no URL→handle API) — 4.7
      makes the 2×2 REAL, it does not collapse it.
      **VERIFIED BY THE MECHANISM, NOT BY INSPECTING WHICH FUNCTION WAS CONSTRUCTED.** The instrument is the
      seam's own `read()` counter: only `pollingDetector` can call it, so **detection happens AND `read` was
      called ZERO further times across a full poll interval ⇒ there is no polling loop** — spec §4's sentence
      transcribed. Its non-vacuity control is the SAME file with the handle withheld, where the count grows.
      Plus sub-interval latency (`< WATCH_INTERVAL_MS`; **not a budget — the bound IS the poll interval, and
      a polled detector cannot beat its own interval**; 5.1 measured ~18.7 ms @ 50 KB, ~50× margin).
      **RED-FIRST, run twice.** Removing the handle branch (i.e. the pre-4.7 state) fails **exactly 7
      Chromium tests** — the two factory no-polling tests, all three appShell tests, and all three ladder
      tests — while the polled tests, the handle-but-no-observer test, the harness gate and **all of Firefox
      stay green**. Restored from a `cp` copy; `git checkout <path>` was never used.
      **1.2's DEAD-OBSERVATION LADDER IS NOW ON A REAL PATH, and is asserted THROUGH IT.** `errored` over a
      live file → re-observes and keeps rendering (and recovers onto EVENTS, not into a poll loop: the read
      count is unchanged). **Spec §7-7's atomic-save fragility — ASSERTED, NOT ASSUMED:** an `errored` record
      whose re-observe then REFUSES (the write-temp-then-rename shape that invalidates a handle) **degrades to
      polling and keeps watching** — a later write still reaches the real reader, with `observed === 1` proving
      no second observation was ever established. `disappeared` over a genuinely removed file → the controller
      stops, the pill flips off, and the user is told **in the polled path's exact words** (`DEAD_READ_NOTE`,
      extracted from `watchController.onReadError` so one event has one string), with the last good render
      still on screen (#5). Those two tests wrap the REAL `FileSystemObserver` in the global slot production
      reads — **only the record is fabricated, because only the record is unreachable** (1.2's precedent, one
      level up). `preserveReading` still applies on the observer path (Raw survives an observer-driven update,
      and the raw view carries the new text) — the controller cannot tell which detector it holds.
      **── SECOND DEFECT, FOUND BY THIS TASK'S OWN VERIFICATION AND FIXED HERE ──────────────────────**
      **The watch pill did not exist on the FIRST file opened in a session, on BOTH engines.**
      `selectFolderFile` called `installWatchForFile` AFTER `await selectFile(file)` — but `select()` mounts,
      and `buildWatchControl` decides at mount time (`watchAvailable()` false ⇒ it returns null and no pill is
      committed); the registry's later `notifyWatchChanged` only re-labels controls that already exist, it
      cannot conjure one. So watch was invisible until a *second* file was selected, at which point the
      previous file's target happened to be in the slot at mount time. The first red run surfaced it as six
      `openAndWatch` timeouts — it is **not** caused by 4.7, and it is the same class as 4.7 itself: wiring
      that never reaches the user, with no test able to see it. **Fixed by stopping explicitly and installing
      BEFORE the select** (`stopWatch(); installWatchForFile(file); await selectFile(file);`) — which keeps
      4.3's cross-feed property (the previous watch is stopped before its target is replaced) while adding the
      missing half. `readerPane.select()`'s own `stopWatch()` still runs, idempotent, on a target that is not
      running. Pinned by its own both-engines regression test.
      Files: `src/watch/detectorForFile.ts` (NEW) · `src/watch/watchController.ts` (`DEAD_READ_NOTE`
      extracted) · `src/app/appShell.ts` · `src/app/chromiumFolderSource.ts` · `src/app/folderSource.ts` ·
      `src/app/walkPolicy.ts` · `tests/browser/watchObserverWiring.browser.test.ts` (NEW).
      **`src/app/firefoxFolderSource.ts` UNCHANGED** — the fence held and it is the purity proof, the way
      `tocScroll` was for 3.1. **D-1 no storage · D-2 no dependency** (still three); `permissions: []`
      untouched; golden diff **EMPTY**; `manifest.test.ts` green and **byte-unmodified**. `pnpm lint` clean;
      `pnpm test` **445** (unchanged — every M2 folder/walk/tree suite green UNMODIFIED); `pnpm test:browser`
      **473 passed / 15 skipped** both engines (was 457/5), **52 file-instances** (was 50 — exactly one new
      file × two engines), serial per 4.5.
      **WHAT IS PROVEN vs WHAT REMAINS 7.1's:** OPFS gives real handles and a real `FileSystemObserver` in
      the harness, so the **WIRING** is proven — a `MarkdownFile` carrying a handle reaches `observerDetector`
      through the real `installWatchForFile`, no polling loop is created, the ladder runs, `preserveReading`
      survives. **OPFS IS NOT LOCAL DISK.** This does **NOT** prove a disk-backed observer fires for an
      agent's rewrite of a real file — the harness loads no extension and has no picker, so a local-disk
      handle cannot be obtained here at all. That was established by the task-0 probe on real disk
      (decisions.md 2026-07-19) and is re-walked at **7.1, alongside 5.1a**.
      **One environment note:** the recorded `EACCES ::1:63315` Windows reserved-port collision recurred
      (decisions.md 2026-07-21); the documented **local-only** `browser.api.port` override was used for every
      run above and **stripped before the commit**.

## 5 — MEASURE → tune (the measuring task is separate from the deciding one, on purpose)

- [x] **5.1 MEASURE observer latency + re-render cost — NO THRESHOLD ASSERTED.** Two numbers this milestone
      has been carrying as unknowns since the probe:
      **(a) Observer latency** — mark → **PROGRAMMATIC** write → callback, **with no human in the loop**.
      The probe's single 5127 ms sample was **human reaction time** (click MARK, alt-tab, type a command)
      and must not be quoted as a latency; this replaces it with a clean number.
      **(b) Re-render cost** at **50 KB** and **1 MB**. `mount()` is **synchronous, with no scheduling and
      no abort** (`mount.ts:79-167`) — a 1 MB doc's ~1.25 s render blocks the main thread entirely, during
      which nothing can scroll, fire or cancel. That is why the only available mechanism is *outside*
      `mount()`.
      Follow the standing protocol so the numbers stay comparable: **7 iterations, discard run 1 as cold,
      median of the warm 6, min/max as spread.** Record honestly in progress.md, caveats included.
      Files: `scripts/perf-watch.ts` (+ `package.json` `perf:watch`) · `docs/ai/progress.md`
      Verify (**measured**): `pnpm perf:watch` prints observer-latency and re-render medians per fixture,
      recorded in progress.md. **NO acceptance number is asserted and no debounce value is chosen here**
      (standing M1 retro rule). **If a number is taken in one configuration and the decision will run in
      another, it is an INFERENCE — say so in the record and name the re-measure as 5.3's job** (retro
      2026-07-19, finding 2: the 004 settings probe under-predicted the real path ~13×).
      **DONE 2026-07-21 — `scripts/perf-watch.ts` + `perf:watch`, NOT in CI. Protocol unchanged: 7
      iterations, run 1 discarded, median of the warm 6, min/max as spread. NO threshold asserted and NO
      debounce window chosen — 5.2 is untouched, and this entry carries no recommended number.**
      **(a) OBSERVER LATENCY — median 18.7 ms @ 50 KB · 109.5 ms @ 1 MB** (write cost 2.2 / 4.2 ms stated
      separately; per-tick `getFile().text()` read 0.6 / 2.4 ms). Programmatic write, no human in the loop,
      through production's own `observerDetector` (not a bare `FileSystemObserver`) — so the span is the one
      watch actually waits on: close → `getFile().text()` → content-compare → `cb`. **The probe's 5127 ms is
      now retired as what it always was: human reaction time.**
      **IT IS AN INFERENCE ABOUT LOCAL DISK, NOT A MEASUREMENT OF IT, and this is the task's own warning
      honoured rather than a hedge.** It is measured on **OPFS**, the only handle obtainable without a
      gesture — `showDirectoryPicker` opens a native dialog Playwright cannot drive (recorded M2 limit), so
      **no local-disk number exists and none was faked**. OPFS is browser-managed storage: no filesystem
      watcher, no atomic rename, no OS notification queue. **This is retro finding 2's exact shape** (004's
      isolated probe under-predicted the real path ~13×), which is why the gap gets a named home rather than
      a footnote → **discovered task 5.1a**, below.
      **(b) RE-RENDER COST — the shipped `mount(text, host, {preserveReading:true})`, real headless
      Chromium, on the REAL production `<peekover-root>` after a real `file://` navigation, and on the app
      page's `<main class="peekover-app__reader">` pane shape. Both surfaces, because the decision governs
      the CONTAINED one** (`watchController` is wired only by `appShell.ts`; the content script registers
      4.1's thin adapter and never re-renders — decisions.md 2026-07-21, 4.6 finding (2)).
      | | 50 KB full-page | 50 KB contained | 1 MB full-page | 1 MB contained |
      |---|---|---|---|---|
      | **shipped mount, SYNCHRONOUS** | **34.9 ms** | **35.7 ms** | **717.3 ms** | **713.9 ms** |
      | shipped, start → 2nd rAF | 49.8 ms | 49.7 ms | 811.5 ms | 806.3 ms |
      | plain mount, synchronous | 16.8 ms | 17.0 ms | 359.9 ms | 379.3 ms |
      | plain, start → 2nd rAF | 49.9 ms | 49.8 ms | 801.6 ms | 845.4 ms |
      | parse+sanitize only | 12.5 ms | 12.7 ms | 266.8 ms | 261.6 ms |
      **THE BREAKDOWN WAS TAKEN, AND IT ANSWERS 5.2's REAL QUESTION — "is the anchor the lever, or is
      debounce?" — WITH A RESULT THAT INVERTS THE OBVIOUS READING.** `preserveReading` roughly DOUBLES the
      synchronous block (16.8→34.9 ms; 360→717 ms), because `restoreReadingAnchor` reads
      `getBoundingClientRect` after the commit and so FORCES layout inside `mount()`. But measured
      like-for-like — **start → 2nd rAF, the whole span in which the page cannot respond** — it adds
      **≈0 ms at 50 KB and nothing distinguishable from noise at 1 MB** (+9.9 ms full-page, −39.1 ms
      contained, against a plain-path spread of 793–908 ms). **A plain mount pays that same layout one frame
      later.** So the synchronous-time delta is layout **MOVED, not ADDED**, and on this evidence **the
      anchor is not the lever.** Stated as a measurement, not a recommendation.
      **THE CONTROL IS NON-VACUOUS, and it took two corrections to become so — both worth inheriting.**
      (i) The first draft **appended** the changed block for both mounts and read **0 px drift on every
      cell**: two documents with identical geometry give the anchor nothing to correct, so the control could
      never have gone positive — the same shape 3.3's red-first pass caught. Both mounts now render an
      IDENTICAL byte/paragraph/heading count with the block merely **MOVED** (below for plain, above for
      preserve), so render costs stay comparable while the geometry genuinely shifts. (ii) Drift read at the
      2nd rAF reported **2738 px contained but 2 px full-page** — because `:host` is
      `scroll-behavior:smooth` and the anchor's write was still animating, while the contained pane is
      `auto` and had already landed. **A plausible wrong answer on exactly one surface, never an error.**
      Drift is now read after a settle: **preserve 2738 px vs plain 0 px on BOTH surfaces.**
      **HOW IT REACHES `mount()`, stated because it is the one fidelity compromise:** the content script's
      isolated world exports nothing, so the harness bundles the SAME SOURCE with esbuild (reached through
      `tsx`'s own dependency — **no devDependency added; `dependencies` still three**) and evaluates it in
      the page. Residuals named in the script header and its output: production SOURCE not the production
      BUILD ARTIFACT, and the bundle's own registry holds no watch target so the measured mount omits the
      watch pill. **A test-only export in shipped code was NOT the alternative taken** — no measurement-only
      code ships (established when 4.2 removed 4.1's marks).
      **CHROMIUM ONLY, twice over:** Playwright cannot load an extension into Firefox (harness ledger), and
      `FileSystemObserver` does not exist on Firefox at all (measured at 1.2). Firefox's app-page watch IS a
      shipped surface, so its re-render cost is **UNMEASURED and named as such**, evidenced only at 7.1.
      `pnpm lint` clean; `pnpm test` **445**; `pnpm test:browser` **457 passed / 5 skipped**, 50 files, both
      engines; `git diff tests/golden/output/` **EMPTY**; `manifest.test.ts` green and **byte-unmodified**;
      no `src/` change, no dependency, no storage (D-1, D-2 intact).
      **One environment note:** `pnpm test:browser` hit the recorded `EACCES ::1:63315` Windows
      reserved-port collision (decisions.md 2026-07-21); the documented **local-only** `browser.api.port`
      override was used and **stripped before commit** — `vitest.config.ts` is unmodified.

- [ ] **5.1a (DISCOVERED at 5.1 — the number 5.1 could not take, given a named home rather than a footnote.)
      MEASURE OBSERVER LATENCY ON LOCAL DISK, at the 7.1 human gate. NON-BLOCKING: 5.2 and 5.3 proceed
      without it.**
      **Why it is not automatable, established not assumed:** `FileSystemObserver.observe()` needs a
      `FileSystemHandle`; the only handle obtainable without a user gesture is **OPFS**, and the local-disk
      route (`showDirectoryPicker`) opens a native dialog Playwright cannot drive (recorded M2 limit). 5.1
      measured OPFS and **said so in the script output, in progress.md and in its own record** rather than
      quoting it as a disk number.
      **Why it still matters:** OPFS has no filesystem watcher, no atomic rename, no OS notification queue.
      **Retro finding 2 is the precedent** — 004's isolated probe under-predicted the real path by ~13×, so
      "the same order of magnitude" is a hypothesis here, not a fact.
      **Why it does NOT block 5.2:** the debounce window is chosen from **(b) re-render cost**, which IS
      measured on the shipped path. Observer latency sets how soon a change is *noticed*, not how long the
      render *blocks* — and if it turns out to be large, that ADDS to the coalescing window's headroom
      rather than eating it. If the human wants it before deciding, it is a 5-minute check, not a task.
      Files: `docs/ai/progress.md` (record the number) · `docs/ai/decisions.md` (if it changes the picture)
      Verify (**human gate, folded into 7.1**): with a production build loaded and a real folder opened
      through the picker, have an agent (or `echo >>` in a loop) rewrite a watched file and record the
      wall-clock from write to the reader updating, at both fixture sizes. **Record it even if it matches
      the OPFS number** — a confirmed inference is evidence; an unrecorded one stays a guess.

- [ ] **5.2 DECISION GATE (human) — the debounce window, chosen FROM the numbers.** 5.1's measurements
      exist; the choice is the human's. **This is 004's D-2 shape exactly, and its lesson is why the two
      tasks are separate: 4.1's inference did not survive contact with 4.2's measurement**, and the only
      reason a budget-breaching gate never shipped is that the measuring task was forbidden from choosing.
      The agent brings a **recommendation with its reasoning and its uncertainty**, not a decision.
      Files: — (human decision; record it in `docs/ai/decisions.md`)
      Verify (**human gate**): the debounce window (and whether coalescing is trailing-only) is **recorded
      before 5.3 writes code**.

- [ ] **5.3 Implement the CHOSEN coalescing.** Per 5.2: trailing debounce of the decided N ms, **at most one
      pending render**, intermediate texts **dropped — the newest wins** (this is a viewer, not a log).
      Lives **outside** `mount()`, which cannot be interrupted. **Re-measure in the shipped configuration**
      if 5.1 flagged any number as an inference.
      Files: `src/watch/watchController.ts` · `src/watch/watchController.test.ts` ·
      `tests/browser/watchControl.browser.test.ts`
      Verify (**jsdom/unit**, red-first with fake timers): a burst of N rapid texts produces **ONE** render,
      carrying the **NEWEST** text (fails without coalescing — assert both the count and the content, since
      a coalescer that keeps the *first* text passes a count-only test); a quiet gap produces a render per
      change. (**tests/browser** — Cr+Fx): the reader **stays responsive** under a rapid update stream (the
      spec's actual NFR — responsiveness, not a latency number). Golden EMPTY + manifest green.

## 6 — Perf / bytes / pins / docs

- [ ] **6.1 Re-measure bytes + first paint; final pins.** Content-script size vs **288,654 B** (delta
      stated); typical-doc (≤50 KB) first paint vs **137.7 ms** against the **<150 ms** budget; `pnpm zip`
      **< 2 MB** both engines. **Know before you start: the margin is ~7–12 ms** — a second independent
      7-iteration pass at the M4 close read median 140.3 ms with one warm iteration at **150.9 ms**, over
      the bar. Watch adds chrome and a controller to a path that is nearly out of room. **Every first-paint
      number here is CHROMIUM** — `perf-first-paint.ts` cannot drive Firefox (harness ledger); Firefox first
      paint is evidenced only by 7.1. (Measurement only — no `src/` change to chase a number.)
      Files: `docs/ai/progress.md` (record the numbers + overwrite the Baselines/pins table)
      Verify (**measured**): `pnpm lint` + `pnpm test` + `pnpm test:browser` green both engines; `pnpm zip`
      < 2 MB both; byte + first-paint deltas **stated** in progress.md; `git diff tests/golden/output/`
      **EMPTY**; `manifest.test.ts` green (`permissions: []` re-proven by an **unmodified** test).

- [ ] **6.2 Docs + memory reconcile — and NO PERMISSIONS.md trust-claim change, stated so it does not read
      as an oversight.** PERMISSIONS.md **does** get the §3.6 disclosure — that watching **reads the user's
      own chosen local file from disk and makes NO network request**. The relay lands in 2.2 regardless, so
      PERMISSIONS.md discloses the background's **third listener** (it gained the settings listener in 004;
      this adds the watch relay) — **what 2.3's answer varies is whether the Firefox content-script surface
      is CLAIMED**, which is 4.4's and the spec's business, not this file's.
      **What it does NOT get, deliberately: the "file contents are never stored" claim stays exactly
      as it is, because it is TRUE for all of 005** (D-1 — 005 stores nothing). **A future reader should not
      think this was forgotten:** that correction belongs to **006**, in the same PR as the first code that
      stores a snapshot. **`permissions: []` is unchanged; if any watch capability ever needs a manifest
      permission, that is an AGENTS.md #4 event → STOP and flag.** Confirm the real path with
      `git ls-files '*PERMISSIONS.md*'` and edit **that** file — do not create a stray copy.
      Files: `docs/trust/PERMISSIONS.md` · `docs/ai/progress.md` · `docs/ai/decisions.md`
      Verify (**gate**): PERMISSIONS.md reflects the local-file read and the listener count, and **still
      states "file contents are never stored"**; `manifest.test.ts` green; the Now-pointer reads
      "005 code-complete / human gate next".

## 7 — Human milestone-close gate (the acceptance an agent CANNOT self-certify — budgeted HERE, up front)

- [ ] **7.1 Milestone-close human gate (NAMED, required — not removable by adding more tests).** Follow the
      recorded procedure (decisions.md 2026-07-19, PROCEDURE): **fresh PRODUCTION builds per engine** —
      `pnpm build` → `.output/chrome-mv3/` (Load unpacked, then enable **"Allow access to file URLs"**) and
      `pnpm exec wxt build -b firefox` → `.output/firefox-mv3/manifest.json` (Load Temporary Add-on;
      **does not survive a restart**). **Never gate a dev build** — a stale/dev load shows a `localhost` CSP
      warning and a dead reader, and reads exactly like a code defect. **Both engines · both surfaces ·
      Network tab open throughout · console watched.** Walk in risk order, hardest-to-automate first:
      - **The RELAY ROUND TRIP, end-to-end.** The single largest gap: `tests/browser` loads no extension, so
        `runtime.sendMessage` **has no receiving end** and the real content→background transport **has never
        been exercised by any test, on any milestone**. Watch a `file://` doc through the content script and
        confirm it actually updates.
      - **Does the anchor FEEL like your place** when an agent **rewrites headings**, not just appends? A
        geometry test proves the scroll landed at *a* correct position; whether it is *the reader's* place
        is the **M3 defect-#6 class** and is eye-only.
      - **Is the update signal noticeable but NOT annoying** over several minutes of a real agent writing?
      - **Firefox drag-only discoverability** (4.4) — does the explanation read as honest, or as broken?
      - **Cold start** — extension freshly loaded / MV3 worker asleep, not a warm repeat open.
      - **Zero unexpected network** with the Network tab open, across start/tick/stop, both engines.
      - Standing acceptance regardless of milestone: **no console errors · every degraded/empty state
        renders (never blank) · the document stays the hero.**
      Files: — (human gate; no code)
      Verify (**human gate**): a human walks the full checklist, both engines + both surfaces, and records
      the pass **and any defects** in progress.md.

- [ ] **7.2 Retro (M5 close).** Run `/retro`: append an entry to `docs/ai/retro.md` — lessons that change
      future behaviour, not a chronicle. Link decisions.md rather than restating settled architecture.
      **Questions this milestone owes an answer to:** did crossing the `mount()` boundary cost what §4-1
      feared, or less? Did the anchor survive the gate — and if it did not, is the failure in the *mechanism*
      or in the *judgement that a test could approximate it*? And: the human-gate score is **6/6 across
      M1–M3 with M4 contributing zero** — did M5, the first milestone with a genuinely untestable transport
      at its centre, move that denominator?
      Files: `docs/ai/retro.md` (+ the progress.md Now-pointer reconcile)
      Verify: `docs/ai/retro.md` has the 005 entry with its metrics and an evidenced answer to the
      `mount()`-boundary question.

---

## Deferred / Out of 005 (traceability)

- **Snapshots — DEFERRED to 006** (D-1). Storage of file contents, the two-store IndexedDB split that dodges
  `idbCore`'s STOP signal (`plan.md` §1.7), `DB_VERSION` 2→3, bounds by count/age/bytes, oldest-first
  eviction, byte accounting. Spec-level WHAT already exists in **spec §3.3/§3.4** and the §4 criteria marked
  *deferred to 006*.
- **Diff — DEFERRED to 006** (D-1). The line-diff engine and the diff view (`plan.md` §1.8); diff output goes
  through the existing sanitize path like any other rendered content.
- **The `diff` dependency — APPROVED but DEFERRED to 006** (D-2). It would be the first `dependencies`
  addition since M1, so it is a governed act — and not this milestone's. **005 ships with three.**
- **The PERMISSIONS.md trust-claim correction — DEFERRED to 006, deliberately, not forgotten.**
  *"File contents are never stored"* appears in **three places** and becomes **false** the moment the first
  snapshot is stored. It is corrected **in the same PR as that code** (spec §3.3 — treated with AGENTS.md #4
  weight though it is no manifest change). **In 005 the claim is TRUE; correcting it early would make the
  document wrong in the other direction.**
- **Also out, each with a recorded home in spec §6:** compare-any-two-files · agent-file awareness/badges ·
  session-transcript rendering · the post-v1 MCP bridge · editing/write-back · watching **remote** URLs
  (that would be real network polling and a different trust conversation) · per-file scroll memory *across
  sessions* (within-watch place-keeping IS in scope).

---
*Discovered tasks go BELOW the line they came from (M1/M2 convention). Any need to edit `sanitize.ts` /
`parse.ts` / the built manifest, to add a manifest permission, to add a dependency, or to store file
contents means scope drifted — **STOP and flag** (D-1, D-2, AGENTS.md #4). A `tests/golden/output/` diff
means the reading column changed — STOP, do NOT re-baseline.*

# Tasks 005 — Watch mode — check off, add discovered tasks BELOW the line they came from
*Gear 3 tasks stage — **DRAFT, awaiting the human gate-3 review; NOT a go-signal.** No implementation*
*code until this is approved (WORKFLOW.md §5.3). Approved upstream: `spec.md` (b12c310 · amended d115b6e,*
*5943e0e) + `plan.md` (d115b6e — ONE commit that landed the plan AND those spec amendments, not two*
*artifacts sharing a hash by coincidence). CC commit per task; human reviews + pushes. Each capability*
*task carries*
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

- [ ] **1.1 `ChangeDetector` seam + `pollingDetector` (pure, injected `read`) — compares CONTENT, never
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

- [ ] **1.2 `observerDetector` (Chromium app page) + dead-observation handling — REAL-ENGINE, via OPFS.**
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

- [ ] **2.1 `WATCH_READ` contract + `createWatchListener(read)` + URL validation (pure handler).** A second
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

- [ ] **2.2 Wire the relay — background listener + content-script `relayRead`, with the zero-network
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

- [ ] **2.3 HUMAN CHECK — does a background `fetch("file://…")` work on FIREFOX at all? (spec §7-1).**
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

## 3 — Re-render continuity — THE RISKIEST GROUP (this is where `mount()` stops being read-only library)

- [ ] **3.1 Extract `resolveScrollContainer` to a shared module; `tocView` imports it.** It is currently
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

- [ ] **3.2 `readingAnchor` — capture + restore (D-3).** Capture: resolve the scroll box (3.1), find the
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

- [ ] **3.3 `MountOptions.preserveReading` + the `mount.ts:151` change — BOTH DIRECTIONS red-first.**
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

- [ ] **3.4 Confirm the TOC re-decide interaction — VERIFY, do not assume (plan §1.3, §4-5).**
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

## 4 — Watch UX (the control is rebuilt every mount; the controller is not — that gap is a seam, not a closure)

- [ ] **4.1 The watch control + its registry seam + `data-watch` on the host.** A control in `mount()`'s
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

- [ ] **4.2 `watchController` — start/stop, the update signal, follow-at-bottom-only.** Owns the
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

- [ ] **4.3 Lifecycle — a gesture starts it, switching documents STOPS it, a dead read surfaces a designed
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

- [ ] **4.4 Firefox degraded state — a designed explanation at the moment it matters (spec §7-8).**
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

## 5 — MEASURE → tune (the measuring task is separate from the deciding one, on purpose)

- [ ] **5.1 MEASURE observer latency + re-render cost — NO THRESHOLD ASSERTED.** Two numbers this milestone
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

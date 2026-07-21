# Decisions — Peekover
*Append-only. Newest first. Format: date · decision · why · revisit-when.*

- **2026-07-21 · FINDING (spec 005 task 4.6, INVESTIGATED — premise FALSIFIED, no code shipped) · The
  Chrome content-script "Allow access to file URLs" concern is UNREACHABLE, so `isAllowedFileSchemeAccess`
  was NOT wired.** 4.6 assumed a fresh-install Chromium user (file access OFF by default) would get a
  running content-script watch whose background reads fail → 3 failures → 4.3's dead-read note ("moved,
  renamed, or deleted"), a misdirection. **Two independent facts falsify the premise:**
  - **(1) One toggle gates BOTH injection and the read.** Chrome exposes exactly ONE per-extension "Allow
    access to file URLs" setting (verified: `chrome.extension.isAllowedFileSchemeAccess()` docs — "the
    user-controlled per-extension 'Allow access to File URLs' setting"; return type `Promise<boolean>`,
    Chrome 99+ MV3, present in WXT's `browser.extension` namespace). That same toggle gates whether a
    `file:///*.md` **content script is injected at all** (match-patterns docs: `file:///` "requires the
    user to manually grant access") AND the **background's `file://` read** (this repo's own 2.3 record got
    `status 200` only because the 7.1 procedure enables it). There is no separate toggle. **Therefore a
    content script that is *running* on a `file://` page necessarily has access granted → the background
    read works.** On a fresh install (toggle OFF) the content script is never injected, so it shows no
    control and no note — the misdirection cannot occur. `isAllowedFileSchemeAccess()` would return `true`
    on every file:// surface where the script runs, making a file-access-denied note an UNREACHABLE branch
    (this codebase forbids unreachable branches — `watchAvailability.ts`: "Every branch is reachable").
    **So the current hardcoded `backgroundCanReadFileUrls: !import.meta.env.FIREFOX` is CORRECT for the
    file:// content-script surface.**
  - **(2) The content script has no dead-read policy anyway.** It wires the thin 4.1
    `registerWatchDetector` adapter (`start(){ detector.start(()=>{}) }` — no re-render callback, no
    `onError`), NOT `createWatchController` (which owns `DEAD_AFTER_FAILURES`). `createWatchController` is
    used ONLY by `appShell.ts` (the app page). So 4.6's "3 failures → dead-read note fires on the content
    script" cannot happen — that note is app-page-only.
  - **THE REACHABLE ANALOGUE, proposed for the human, NOT implemented:** the content script offers a watch
    control on the REMOTE `http(s)` raw surfaces too (raw.githubusercontent / gist / gitlab-raw /
    bitbucket-raw), where `isWatchableFileUrl` refuses every relay read (non-`file://`) and watching remote
    is explicitly out of 005's scope. Today, given (2), clicking it silently does nothing. The clean,
    SYNCHRONOUS fix (no async query, no mount-ordering problem) is to gate the content-script watch on
    `isWatchableFileUrl(location.href)`, so remote surfaces get an explanation (or no control) instead of a
    control that cannot work — the same honesty posture 4.4 took for Firefox. Left for a human scoping
    decision; it changes 4.6's copy and verify criteria, so it is not smuggled in.
  - **Verified how far it could be:** the API's existence + contract (docs + WXT types) and the single-
    toggle behaviour (docs + repo 2.3/7.1) are conclusive. The one step needing a loaded extension —
    observing that the content script does NOT inject with the toggle off — is a 5-second 7.1 check, not a
    guess this milestone should build on.
  **Revisit-when:** Chrome ever decouples file-URL content-script injection from file-URL read access
  (would make `isAllowedFileSchemeAccess` load-bearing here), or the human scopes remote-surface watch.

- **2026-07-19 · FINDING (spec 005 task 2.3, HUMAN-RUN with a loaded extension) · Can a background
  `fetch("file://…")` read a local file, and does that read enter the Resource-Timing buffer? MEASURED on
  both engines.** This closes spec §7-1 and §7-4, the two questions no automated harness could answer (the
  browser test page runs on an `http://localhost` origin and the harness loads no extension).
  - **Q1 — does a background `fetch("file:///…")` resolve with the file's bytes?**
    - **CHROMIUM (background service worker, "Allow access to file URLs" ON):** `{ status: 200, bytes: 845 }`
      — **resolves, fresh bytes.** Confirms and re-measures the task-0 result.
    - **FIREFOX 152 (background page, `moz-extension://…/_generated_background_page.html`): THREW.**
      Console, verbatim:
      `Security Error: Content at moz-extension://<id>/_generated_background_page.html may not load or link to file:///D:/Dev/peekover/README.md.`
      then `TypeError | NetworkError when attempting to fetch resource.`
      **This is Gecko's URI security policy, not a missing toggle or manifest key** — a `moz-extension:`
      document may not load `file:`. **No permission fixes it**; Firefox has no "Allow access to file URLs"
      equivalent to grant. Do not "fix" this by requesting permissions or editing the manifest.
  - **Q2 — does the read appear in `performance.getEntriesByType('resource')` from the background context?**
    **`[]` on BOTH engines.** Chromium's successful `file://` read leaves no Resource-Timing entry; Firefox's
    refused one leaves none either.
  - **CONSEQUENCE 1 — FIREFOX WATCH IS APP-PAGE-ONLY.** The content-script surface **cannot** watch on
    Firefox: the content script cannot re-read its own file (task-0: `fetch` → `TypeError`, XHR → `status 0`,
    **even with file-URL access**) **AND** the background cannot read `file://` either. **Both halves of the
    only available route are closed** — there is no third path. **Chromium is unaffected**: its background
    reads `file://` fine, so its content-script relay stands as designed. Spec §3.5 narrowed in the same
    commit as this entry (C12); 4.4 ships the designed explanation for this surface too, not a dead control.
  - **CONSEQUENCE 2 — SPEC §7-4 ANSWERED, BOTH ENGINES: a `file://` read never enters the Resource-Timing
    buffer.** So the existing `/^https?:/i` zero-network guards are **CORRECT, not merely conveniently
    scoped** — there is nothing for them to filter out. **§3.6-A's premise now holds on the measurement, not
    just on the prose.** State the flip side plainly rather than letting a later reader over-read the result:
    the guards can prove watch put **nothing on the wire**, and can **never prove the local read happened**.
    A watch loop that silently stopped reading would pass every zero-network assertion we have.
  - **CONSEQUENCE 3 — one dead branch removed** (`entrypoints/background.ts`, same commit). The read fn
    carried `if (!response.ok && response.status !== 0)` with a comment claiming a `file://` fetch reports
    `status: 0` on a **successful** read in some engines. **That was an unverified assumption and this
    measurement falsifies it:** Chromium returns **200**; Firefox never resolves at all, so the branch cannot
    run there either. The escape hatch was dead code justified by a false comment. Simplified to a plain
    `!response.ok`.
  **Revisit-when:** Firefox changes its extension-page URI security policy, or ships a file-access grant
  (either would reopen the content-script surface on Firefox and un-narrow §3.5).

- **2026-07-19 · FINDING (spec 005 task-0 probe) · Watch-mode feasibility, MEASURED on both engines and
  both surfaces.** The probe was throwaway and is deleted; this entry is the only surviving record.
  - **CHROMIUM 150 — app page.** Feature detect: `showDirectoryPicker` ✓ · `FileSystemObserver` ✓ ·
    `showOpenFilePicker` ✓ · `FileSystemFileHandle`/`DirectoryHandle` ✓ · `DataTransferItem.webkitGetAsEntry` ✓.
    **`FileSystemObserver` WORKS.** `observe(fileHandle)` accepted; callbacks fire with `type:"modified"`,
    `changedHandle {kind:"file", name:"small.md"}`, `relativePathComponents []`, `relativePathMovedFrom null`,
    `root` = the same file handle. Fired for **both** agent-style appends (`echo >>`) **and** editor saves.
    **NO atomic-rename problem observed** — no `disappeared`+`appeared` pair, so the predicted worst case did
    not materialise on this machine. **File-level observation is viable; directory observation was not needed.**
    Survived **10+ minutes idle** and kept firing — no silent death, no service-worker interference (the probe
    page is a full tab). **Watch mode here is EVENT-DRIVEN: no polling loop, no interval tuning, no size-aware
    backoff.**
  - **LATENCY IS UNMEASURED — do not quote a number.** The one sample recorded (5127 ms) is dominated by
    HUMAN time: the MARK button was clicked, then the human alt-tabbed and typed the command. A clean run
    (`mark`, then `sleep 5 && echo >>`) was never performed. Treat observer latency as an open measurement,
    not as "5 seconds".
  - **FIREFOX 152 — app page.** Feature detect: `showDirectoryPicker` ✗ · `showOpenFilePicker` ✗ ·
    `FileSystemObserver` ✗ · `FileSystemFileHandle` ✓ · `FileSystemDirectoryHandle` ✓ · `webkitGetAsEntry` ✓.
  - **TRAP 1 — the handle types EXIST as constructors but there is NO WAY TO OBTAIN ONE** (no picker). That is
    the OPFS half of the API without the local-disk half. **Feature-detect on `showDirectoryPicker`, NEVER on
    the handle constructors** — the obvious detect gives a FALSE POSITIVE on Firefox.
  - **Firefox PICKER path (`<input webkitdirectory>` → cached `File`): PERMANENTLY STALE.** Polled ~45 ticks
    across a real on-disk edit; `lastModified` and `size` never moved and `.text()` never returned new content.
    Not viable.
  - **Firefox DRAG path (`webkitGetAsEntry` → `FileSystemFileEntry`, `entry.file()` called FRESH each tick):
    WORKS.** 3 appends → 3 `TEXT CHANGED (FRESH BYTES)` detections, confirmed against `wc -c` (128 → 161 bytes).
  - **TRAP 2, and the expensive one: on the drag path `size` and `lastModified` are FROZEN AT DROP TIME and
    never update — only `.text()` reads fresh from disk.** Change detection **MUST compare CONTENT**. The
    obvious implementation (poll `lastModified`, re-read when it changes) would compile, pass a naive test,
    and **SILENTLY NEVER FIRE**.
  - **Firefox polling cost, measured:** small file ~0–1 ms read · 1.12 MiB file **~2–8 ms per tick** (open ≈0 ms
    because `entry.file()` is cheap; the cost is `.text()`). A 1 s interval is affordable even at 1.12 MiB —
    but note this reads the **whole file every tick** to detect change.
  - **BOTH ENGINES — content-script surface (`file://` page).** Measured on **Chromium**, with **"Allow access
    to file URLs" GRANTED**. The content script **CANNOT re-read its own file**: `fetch` → `TypeError "Failed
    to fetch"`; XHR → `status 0`. Both plain **and** cache-busted. **The `file://` origin restriction applies to
    the content script regardless of the file-URLs toggle** — it is not a permissions problem, so do not "fix"
    it by requesting more permissions. The **BACKGROUND CAN**: `fetch("file:///D:/…")` returned `status=200`
    with FRESH content (len=161, matching the on-disk byte count at that moment). **XHR is unavailable in the
    MV3 service worker (`ReferenceError`) — fetch only.**
  - **UNCONFIRMED on Firefox, and do NOT assume it transfers:** Firefox has no "Allow access to file URLs"
    toggle and its background may not fetch `file://` at all. If it cannot, **the content-script surface has NO
    watch path on Firefox.**
  - **CONSEQUENCE 1 — SPLIT DESIGN, both halves evidenced:** Chromium event-driven (observer); Firefox polled
    and **DRAG-ONLY**, comparing **content, not metadata**.
  - **CONSEQUENCE 2 — two surfaces, two routes:** the app page uses handles directly; the content script must
    **RELAY through the background** (the same pattern 004 established for settings).
  - **CONSEQUENCE 3 — OPEN QUESTION THE SPEC MUST ANSWER (raised at teardown):** a background
    `fetch("file://…")` is a **real fetch through the same API the zero-network guards watch** (AGENTS.md #1,
    and the Resource-Timing assertions in `tests/browser`). Reading a local file is not a network call in
    spirit, but it **is one mechanically**. Spec 005 needs a deliberate classification — does it light the
    network indicator, is it excluded from the zero-network assertions, and how do the existing guards
    distinguish it — **or the first honest guard we write trips on our own watch loop**.
  - **CONSEQUENCE 4 — Firefox content-script watch: UNKNOWN.** Needs a probe if the spec wants to promise it.
  **Revisit-when:** Firefox ships `showDirectoryPicker` or `FileSystemObserver` (either would collapse the
  split); or Chromium's observer changes behaviour on atomic saves (this machine's editor did not trigger the
  rename path — another might, and the file-level design depends on it not doing so).

- **2026-07-19 · FINDING (promoted at the M4 progress.md archive) · DISPROVED HYPOTHESES AND DEAD ENDS —
  the things we tried that did NOT work. Recorded so no future session re-spends the debugging cycle.**
  These cost real time to establish and none of them is a "decision", which is exactly why they would
  otherwise have been archived with the milestone narrative that produced them.
  - **`ServiceWorker.stopAllWorkers` (CDP) does NOT terminate an extension's MV3 service worker.** It is
    accepted without error and the target SURVIVES. **`Target.closeTarget` DOES** — it returns
    `{success:true}` and the target disappears. This is how `scripts/perf-theme-flash.ts` defines a "cold"
    run (task 4.1). "Cold" therefore means *no running worker process*, deliberately NOT a fresh profile —
    a fresh profile would cold-start the browser and its disk cache too, conflating three variables.
  - **Playwright's `ctx.serviceWorkers()` STILL LISTS A TERMINATED WORKER.** It is a client-side cache that
    is never pruned, so a liveness check written against it reports every successful termination as a
    failure — it cost a full debugging cycle at 4.1. **`Target.getTargets` is the browser's own answer and
    is the authority.** Do not re-check worker liveness through the Playwright object.
  - **The silent-MediaQueryList quirk is NOT garbage collection, and NOT the `emulateMedia(null)` afterEach
    teardown.** Symptom (task 3.2): a listener installed in one browser test stops receiving emulated OS
    flips in LATER tests. **Both hypotheses were probed and BOTH are disproved** — holding a strong
    reference to the MQL did not fix it, and removing the `emulateMedia(null)` teardown did not fix it.
    The mechanism is internal to Playwright's `emulateMedia` override lifecycle and remains **UNPINNED**.
    **It is scoped to the TEST BOUNDARY and is not a product defect:** the standing guard *"theme runtime —
    ONE listener, MANY flips"* flips the emulated OS twice against a single install inside one test and is
    green on both engines (and goes red if the handler removes itself after one fire), so one listener
    serving the page's whole lifetime is proven. `resetThemeWatchForTest()` exists for **test isolation**,
    not as a workaround for a runtime limitation. Nothing production does resembles the quirk: a real page
    has one media state that changes, never an override swapped out beneath it.
  - *(Already recorded elsewhere, listed here only so the category is complete: **"a detached node doesn't
    fetch" is FALSE** in Blink and Gecko — 2026-07-14 below; **the settings isolation probe under-predicts
    the content-script path ~13×** — 2026-07-18 below.)*
  **Revisit-when:** the MQL quirk is worth re-probing only if it starts affecting a test that cannot be
  isolated with `resetThemeWatchForTest()`; the two CDP facts revisit if Playwright/CDP changes under us
  (a `pnpm perf:flash` cold run reporting no worker to kill is the signal).

- **2026-07-19 · FINDING (promoted at the M4 progress.md archive) · WHAT THE TEST + MEASUREMENT HARNESSES
  CAN AND CANNOT DO. Standing capability ledger — check it before planning coverage for a property.**
  - **The vitest `browser` project loads NO unpacked extension.** There is no background service worker, no
    content-script injection, and `browser.runtime` has no receiving end. Consequence, stated once for all
    of `tests/browser/`: the **real content→background `runtime.sendMessage` transport has never been
    exercised by any test**, on any milestone. Suites prove both halves independently by injecting a fake
    through the **production seam** (`registerSettingsSink` / `publishSettings`), which proves our half of
    the contract and nothing about the bus. It also never navigates, so a "re-mount" is not a reload.
  - **`scripts/perf-first-paint.ts` and `scripts/perf-theme-flash.ts` are CHROMIUM-ONLY BY CONSTRUCTION.**
    They use `chromium.launchPersistentContext` + `--load-extension`, a Chromium flag. Playwright cannot
    load an extension into Firefox: **microsoft/playwright#7297 is CLOSED as out-of-scope (2024-12-03)**,
    with later requests folded into it, and `playwright-core@1.61.1` contains no `installAddon` /
    `installTemporaryAddon` (grepped). **This is a HARD limit with no roadmap item to wait for — not a
    pending upstream fix.** Every first-paint and flash number in this repo is Chromium. **Firefox first
    paint has no automated coverage at all** and is evidenced solely by the milestone-close human gate.
    (Unadopted third-party escapes exist: `playwright-webextext`, Selenium/geckodriver `installAddon`,
    `web-ext`.)
  - **THE LEVER THAT MOVES THE GATE-ONLY BOUNDARY: server-side Playwright browser commands.** `vitest.config.ts`
    exposes `emulateReducedMotion` (added 003) and `emulateColorScheme` (added 004, `page.emulateMedia`).
    Both are **verified on Chromium AND Firefox**: `matches` flips, a **real `change` event** fires, and CSS
    media rules re-evaluate. Playwright drives the browser from outside the page, so it can move platform
    state no in-page API can fake. **When a property looks human-gate-only, ask whether a server-side
    command can reach it before accepting it as human-only** (retro 2026-07-19, finding 5).
  - **What stays gate-only regardless:** how the chrome LOOKS — contrast, legibility, opacity, occlusion,
    z-order, "is the document still the hero". Geometry and computed tokens measured a fully TRANSPARENT
    rail perfectly (M3 defect #6). Computed style is the strongest thing an engine can assert; it is not
    an eye.
  - **jsdom cannot see:** bytes on wire (loads no subresources), cascade/computed custom properties, rAF +
    layout ordering, pointer geometry. Zero-network and remote-media guards live in the browser project by
    standing rule (2026-07-14).
  **Revisit-when:** playwright#7297 is reopened or a maintained Firefox-extension driver is adopted (that
  would retire the Firefox-first-paint gate item); or the browser project gains a real extension load, which
  would let the message bus be tested and retire the largest named human-gate item.

- **2026-07-19 · PROCEDURE (promoted at the M4 progress.md archive) · THE MILESTONE-CLOSE HUMAN GATE:
  BUILD AND LOAD, BOTH ENGINES. Every milestone ends with this; it should never be re-derived.**
  Generalizes and supersedes-by-extension the Firefox-only note of 2026-07-16 (which stands, unedited).
  - **Build FRESH PRODUCTION output for each engine — never gate a dev build.**
    `pnpm build` → `.output/chrome-mv3/` · `pnpm exec wxt build -b firefox` → `.output/firefox-mv3/`
    (**mv3**, not mv2 — we target MV3 on Firefox). `pnpm zip` produces the store packages; the Firefox run
    also emits `peekover-<v>-sources.zip` (the AMO source bundle, ~1.6 MB) — that is **not** the shipped
    artifact and must not be measured against the 2 MB bound.
  - **Chrome:** `chrome://extensions` → Developer mode → **Load unpacked** → `.output/chrome-mv3/`. Then
    open the extension's details and enable **"Allow access to file URLs"** — without it the content script
    never injects on `file://` pages and the reader appears simply not to work (see
    `docs/trust/PERMISSIONS.md`).
  - **Firefox:** `about:debugging#/runtime/this-firefox` → **Load Temporary Add-on** →
    `.output/firefox-mv3/manifest.json`. **Temporary add-ons do not survive a browser restart** — reload
    after every rebuild and after every restart.
  - **THE PROCEDURE TRAP, RESTATED BECAUSE IT READS EXACTLY LIKE A CODE DEFECT:** a **stale or dev** load
    shows a `localhost` CSP warning in the console and a **dead reader**. That is a load/procedure error.
    **Rebuild and reload the production output before diagnosing anything.** (Cost a scare at the 003 gate;
    2026-07-16.)
  - **Gate conditions, every time:** both engines · **both surfaces** (content-script full-page `file://`
    doc AND the app-page reader pane) · **Network tab open throughout** · console watched. Walk the spec's
    checklist **in risk order**, hardest-to-automate first. Standing acceptance regardless of milestone:
    **zero unexpected network · no console errors · every degraded/empty state renders (never blank) · the
    document stays the hero.**
  **Revisit-when:** a store/browser changes how unpacked or temporary extensions load, or the browser
  project gains a real extension load (which would move items OFF this checklist — but per retro
  2026-07-19 finding 5, only when something else can *observe* the property, never because the gate has
  been quiet).

- **2026-07-19 · Spec 004 (groups 5–6) · STORED settings and APPLIED theme live in TWO modules, on
  purpose. `src/settings/settingsSeam.ts` owns the stored side; `src/theme/reader.ts` keeps the applied
  side. They are deliberately NOT unified.** The split: the seam exports `currentSettings()` /
  `onSettingsChange()` / `saveSettings()` / `registerSettingsSink()` / `publishSettings()` — the
  persistence vocabulary, the last-written `Settings` value. `reader.ts` keeps `currentThemeSetting()` /
  `onThemeSettingChange()` — the theme runtime's **applied** state, what is actually painting right now.
  **WHY NOT ONE MODULE (the whole point):** those two answers legitimately DIVERGE. Under `theme: 'auto'`
  an OS light/dark flip changes what paints while the stored setting is never touched — the user chose
  "auto" and still has "auto". Collapsing the two would force one value to answer both questions and
  destroy exactly the distinction D-2 was written to preserve; a consumer asking "what is on screen"
  would get "what is in the database" and be wrong every time the OS moves.
  **WHY A SEAM EXISTS AT ALL:** the settings port is never threaded into the render path. Doing so would
  have meant four-to-five signature changes across two call chains (both entrypoints → shell/mount →
  render → tocView) to deliver one value to a leaf, on a path where the content-script surface renders
  once per navigation. A module-level seam that the entrypoints register into, and leaves subscribe to,
  keeps the render functions' signatures unchanged and the side effects in the entrypoints where
  AGENTS.md puts them.
  **WHY IT DID NOT CHURN GROUP 5:** the generalization was a PURE MOVE. `themeControl.ts` still exports
  `registerThemeSaveSink` / `resetThemeSaveSinkForTest` as **delegates** to the seam, so every group-5
  call site and test file stayed byte-unchanged and both theme browser suites stayed green untouched.
  The delegates are kept deliberately, not left behind as debris.
  **REVISIT WHEN:** a second setting develops its own applied-vs-stored divergence (a TOC width the
  layout overrides, say). Then the pattern is a general `applied` layer beside the seam — NOT merging
  the two into one value. Merge only if `auto` ever stops existing, which spec 004 §4 makes unlikely.
  Full narrative: progress.md group-5 and group-6 (6.1 D-E) entries — not restated here.

- **2026-07-18 · Spec 004 D-2 CORRECTION OF RECORD (task 4.2): the paint gate was BUILT, MEASURED and
  REMOVED. The shipped mitigation is D-2's own fallback — mount Auto + an INSTANT re-theme.** This is
  the D-2 entry below firing its OWN revisit-when, not a reversal of the human's call. **WHY:** D-2
  made the block arm conditional on 4.2 re-measuring 4.1's untested inference that gating before the
  mount would make cold settings availability ≈26 ms. Measured in the gated configuration: **~72 ms**.
  The isolation probe still reproduces (0.4 ms warm / 5.6 ms cold), so the background is genuinely
  nearly free — the probe simply **under-predicts the content-script path by ~13×**, because it
  measures an idle, already-loaded extension page while a content script at `document_start` competes
  with an active navigation. **Standing correction: never infer in-page availability from that probe
  again** (recorded in-code at `measureSwWake`). **THE BUDGET DATA (50 KB cell, same build + session):
  gate 75 ms → cold 172.7 ms; gate 40 ms → cold 172.9 ms; NO gate → cold 137.7–148.2 ms**, against the
  <150 ms first-paint budget. Halving the deadline moved cold by **0.2 ms**, which is the decisive
  fact: **the ~25–35 ms cost is not the length of the wait.** The most likely MECHANISM is that
  deferring the mount at all takes it off the DOMContentLoaded turn it otherwise rides — but that was
  **NOT instrumented; it is a hypothesis, not a measurement**, and only the deadline-insensitivity is
  measured. (Labelled deliberately: 4.2 exists precisely because 4.1's un-remeasured inference
  (~26 ms) did not survive contact, so an un-instrumented causal claim in the same record must be
  marked rather than inherited as fact.) So no deadline both gates the warm case
  (settings land ~21.5 ms, before the ~60 ms natural commit) and stays free on the cold one — and the
  gate bought nothing measurable, since warm was already flash-free without it. **CONSEQUENCE:** the
  content entrypoint applies the persisted theme via `setThemeSetting` on `load()` and nothing in the
  render path awaits it, so never-blank is **structural** on this path rather than a tuned timeout;
  `runReader.ts` is behaviourally unchanged by 004. Shipped: 50 KB warm 139.5 ms / cold 137.7 ms, both
  inside budget, **no-flash 24/24** measured directly off production's `data-theme` at the paint rAF.
  **THE RESIDUAL, STATED PLAINLY:** cold start is a race we win, not one we cannot lose — ungated cold
  runs land the theme and the paint in the SAME main-thread turn (+0.1 ms deltas), 4.1's "photo finish"
  cliff. The tradeoff accepted is **a rare cold-start flip** over **a ~25 ms budget breach on every
  cold typical-doc open**. **Revisit-when:** the human gate (8.1) actually SEES a flip on a cold start,
  or the first-paint budget gains enough headroom to afford the ~25 ms deferral cost — at which point
  the gate must be **REBUILT, not restored**. It exists in **NO commit**: the implementation and its
  7 jsdom orchestration tests were discarded mid-task by a `git checkout src/render/runReader.ts
  src/render/runReader.test.ts` BEFORE they were ever committed, and its browser tests were
  overwritten when `themeFlash.browser.test.ts` was rewritten — also never committed. There is
  nothing to `git revert`. Rebuilding is straightforward because the DESIGN is fully described in
  this entry: a `themeReady` seam on `RunReaderOptions`; a `THEME_GATE_MS` deadline of its own;
  deferral with remembered finality, so the settings wait composes with the Gecko
  source-not-ready retry; and `openGate` on settle-or-deadline-or-rejection.
- **2026-07-18 · Spec 004 D-2 (decision gate 4.1a): the theme-flash mitigation is BLOCK-UNTIL-READ,
  with its OWN short paint-gate deadline, falling through to Auto + an INSTANT re-theme.** The
  content-script reader defers its first mount attempt until the persisted theme is in hand, bounded
  by a gate deadline of its own; if the gate expires first, the reader mounts themed-Auto and the
  late-arriving setting re-themes it immediately. **WHY (the numbers, task 4.1 — full table + caveats
  in `docs/ai/progress.md`, group 4; not restated here):** the background's real cost is **0.4 ms warm
  / 5.0 ms cold** (the isolation probe, which is the honest measure — the in-page cold `resolved`
  figures are a main-thread DELIVERY wait, not service-worker cost), `port.load()` fires at
  `document_start`, and the mount does not commit until **~60 ms**. So in every measured cell the
  settings are available BEFORE the natural mount, and gating costs **~0 ms in the common case**. The
  138.9 ms cold `resolved` figure is an artifact of the mount itself blocking delivery — gating
  *before* the mount is exactly what removes it. **THE TWO DEADLINES ARE DIFFERENT NUMBERS DOING
  DIFFERENT JOBS and must not be conflated:** the paint gate is **~75 ms from nav start** (paint lands
  ~72.6 ms after commit; the <150 ms budget therefore allows a commit by ~77 ms; the natural commit is
  60.4 ms → **~17 ms of slack**), while `LOAD_TIMEOUT_MS` (**1500 ms**) is the dead-background backstop
  living under runReader's 3 s never-blank floor. They differ **~20×**; inheriting 1500 ms as the paint
  gate would blow the typical-doc budget by an order of magnitude.
  **SUB-DECISION (a) — NO CROSS-FADE. The late-arrival path does an INSTANT theme swap.** The plan's
  "softened by a `prefers-reduced-motion`-respecting cross-fade" wording is **superseded**. An instant
  swap is trivially reduced-motion-safe and adds no code; a cross-fade is a *visual* property that no
  test we can write is able to certify — M3 defect #6 established that occlusion/appearance is
  **human-gate-only** (a fully transparent rail measured perfectly in every geometry test). We do not
  ship a visual affordance whose only correctness check is a human's eye on a path that, by this
  decision, should almost never run.
  **SUB-DECISION (b) — BLOCK-WITH-FALLTHROUGH SUBSUMES "TRANSITION". There is no separate transition
  design to build.** If the gate resolves in time → no flash. If it expires → mount Auto and re-theme
  on arrival, which *is* the transition behaviour. The plan's block-vs-transition framing described
  one mechanism with two arms, not two mechanisms.
  **CONSEQUENCE:** 4.2 implements one gate in `runReader` + the entrypoint; the instant re-theme needs
  **no new code** — group 3's `setThemeSetting()` already broadcasts through the theme registry to
  every registered host. **Revisit-when:** (i) 4.2's post-gating `pnpm perf:flash` re-measure
  contradicts the inference that gating before the mount makes cold availability ≈26 ms — the ~26 ms
  figure follows from the isolation probe and was **never measured in the gated configuration**; if the
  50 KB cells breach <150 ms, fall back to mount-Auto + instant re-theme (i.e. open the gate at 0 ms);
  or (ii) the first-paint budget itself changes, since the gate's ~17 ms of slack is derived from it.

- **2026-07-17 · Spec 004 D-1: sepia DEFERRED from the themes milestone (plan gate 2).** 004 ships
  **auto/light/dark** + persistence + TOC carry-over; sepia does not activate this milestone. **WHY:**
  `design/tokens.css` — the stated source of truth — defines only **4 of ~15** sepia tokens
  (`--paper`/`--ink`/`--accent`/`--accent-soft`); the rest fall through to light, so a sepia reader would paint
  **light chrome (code/tables/rail/pills) on sepia paper**. Completing the palette is a **brand/design
  decision, not an implementation fill** — the spec §3.5 verify-first escalation firing exactly as written,
  surfaced at the plan gate rather than filled silently. The 004 runtime is built **surface-neutral** to sepia
  (one extra `data-theme` value everywhere), so activation later is additive. **CONSEQUENCE:** spec §3.5
  rewritten to a deferral, the §4 "sepia completeness" acceptance dropped from 004's set, and a §6
  out-of-scope line added (f4e11f5). Full detail: `specs/004-themes-settings/plan.md` §0 D-1; spec §3.5
  (amended). **Revisit-when:** a designed, contrast-checked sepia palette exists in `design/tokens.css` — then
  activate sepia as its own small task (the completed token block + one `data-theme` option + a human-gate LOOK
  check for contrast / the on-highlighter literal-hex trap).
- **2026-07-17 · Spec 004 gate-1 direction: settings persist WITHOUT a new manifest permission
  (`permissions:[]` kept).** Settings live in the existing `peekover` IndexedDB (new `settings` store); the
  content-script reader reaches it via a message to the extension background (its own origin can't see the
  extension DB); the app page reaches it directly. **WHY:** preserves the M2 "`permissions:[]` survived" trust
  headline (spec §6 / PERMISSIONS.md) rather than spending `storage` on a settings feature. **CONSEQUENCE:** no
  cross-device sync this milestone — the product spec's `storage.sync` path (§9 / §6.17 / F7) is deferred as a
  later, deliberate #4 event, scoped on its own when sync value justifies the permission. Full detail:
  `specs/004-themes-settings/spec.md` §3.1. **Revisit-when:** cross-device sync is wanted (then scope the
  `storage` permission + PERMISSIONS.md + manifest-pin change as a #4 event).
- **2026-07-17 · M3 CLOSE (spec 003 — in-reader TOC / navigation): implementation complete, awaiting
  the 6.2 human gate.** The reader gained an auto-generated table-of-contents rail that serves BOTH reader
  surfaces (content-script full-page + app-page contained pane) from ONE implementation. Recorded so a later
  spec builds on it, not around it:
  - **ONE-seam compose.** `buildTocModel(root)` + `buildTocView(host, model, {contained})` are pushed into
    the SAME `children[]` array `mount()` commits with its single `shadow.replaceChildren(...)` — the M2
    "one seam, every branch funnels through it" win reused verbatim, so both surfaces get the TOC with zero
    per-surface branching. The raw-fallback path stays TOC-free (banner + raw `<pre>` — never-blank #5).
  - **Navigation is by element REFERENCE, never a URL hash.** Each entry button carries its exact heading
    node (`entry.headingRef`) in a module-level `WeakMap`; click/Enter calls `scrollIntoView({block:'start'})`
    on that carried ref (the same node 2.1's identity test guards and 3.1 scrolls — one ref, not two
    derivations). **No heading `id` is added → the M1 sanitize `id`-closure (DOM-clobbering surface, dropped
    2026-07-14) stays SHUT**, and the shadow-DOM fragment gap (spec §9) is sidestepped. URL/history untouched.
  - **Scroll-spy roots on the shadow-host scroll box, resolved PER SURFACE** (not assumed `:host`): full-page
    → `:host`; contained → the nearest ancestor pane that actually scrolls (`.peekover-app__reader`), resolved
    by COMPUTED overflow. Active section is read from LIVE `getBoundingClientRect` per recompute (observer +
    rAF-coalesced scroll listener as triggers), NOT from stale `isIntersecting` snapshots; the trailing-short-
    section edge is handled by promoting the final entry at scroll-bottom. Observer disconnected on teardown.
  - **Right-side rail, present at ≥2 headings** (0/1 → omitted — a single-entry TOC has no nav value); initial
    open/collapsed decided from the reader's own `:host` scrollport width (`initialTocOpen`), reflected as
    `data-toc` on the host. Right (not left) keeps the app page's left folder-pane and the section-nav rail
    visually distinct. While open, the reading column reserves exactly the rail's `--toc-w` (opaque
    `background:var(--paper)` + column `margin-right`) so the rail never overlaps or underlaps the text.
  - **Keyboard toggle = backtick `` ` ``** (plan-gate override of the plan's `t`), via a module-level host
    `Set<HTMLElement>` that `mount()` fills/empties; the resolver prunes any `!isConnected` host AND requires
    a live rail before toggling. Guarded EXACTLY like readerMode's `\` (bare key, no Ctrl/Cmd/Alt, ignored in
    input/textarea/select/contenteditable) and distinct from it — the two never collide.
  - **Sizes / perf / first-paint (measured, group 5; the byte-identity M2 invariant is deliberately spent per
    spec §Surface-scope).** Content script **284,744 B** (+13,865 B / +5.12% vs M2 270,879 B — the whole TOC
    feature), byte-identical both engines; `pnpm zip` **323.63 kB Chrome / 323.69 kB Firefox, < 2 MB**.
    First-paint re-run PASSES both parts: **(a) ≤50 KB nav→paint 133.5 ms < 150 ms; (b) 1 MB = the ~1400-entry
    pathological TOC 1196.3 ms < 1.7 s** — no regression (the rail's ~45 ms JS build rides inside the mount
    path, lost in the ~750 ms browser layout of the 1400-section reader). `perf:toc`: rail build ~45 ms @1401
    headings (jsdom upper bound), scroll-spy ~4.4 ms/frame @1401 — **no threshold asserted** (M1 retro rule).
    **The chunked/virtualized TOC-tree render is a measurement-informed LEVER, not a forced change:** the
    ~45 ms/1401 build scales ~linearly and is fine for typical docs; the one-node-per-heading cost at
    pathological counts is the same suspect as the folder tree. **Revisit-when:** a real document reaches
    N-thousand headings (then virtualize the TOC-tree render); OR heading permalinks / deep-links land (they
    need heading `id`/slugs → a security-reviewed re-opening of the sanitize `id`-closure, out of 003); OR the
    frontmatter render-options feature lands (the intended home for a document-declared initial TOC state); OR
    spec 004 settings persists TOC open-state / width (003 is per-view only). The contained-surface reduced-
    motion gap is separately recorded (2026-07-16, plan §3-#2 false for the app-page box); the `\`-app-page
    inert-shortcut gap is recorded immediately below.

- **2026-07-17 · CARRIED HARDENING: the `\` (Raw/Reading) shortcut is inert on the app page — 003 did NOT
  retrofit it.** `installToggleShortcut()` resolves its target via `document.querySelector('peekover-root')`
  (`readerMode.ts`), which is the content-script host but returns `null` for the app-page reader host
  (`<div class="peekover-app__reader__host">`) — so `\` is already inert on the app page (a latent 002 gap,
  not surfaced by 002's gate). 003's TOC backtick toggle works on BOTH surfaces because `tocView.ts` registers
  each mounted host in its own registry; 003 deliberately did **not** retrofit `\` onto that registry, because
  it touches `readerMode` + its tests for no 003 benefit. Recorded here (not only in plan §6-#1 / §9-#4) so the
  inconsistency (TOC toggle works app-page; `\` still doesn't) is visibly deliberate. **Revisit-when:** a
  settings/hardening pass, or the next time `readerMode`'s shortcut host-resolution is touched — unify both
  shortcuts on one host registry.

- **2026-07-16 · FINDING (task 3.3): the app-page (contained) reader is reduced-motion-safe by
  ACCIDENT, not by design — plan §3-#2 is FALSE for the contained surface.** The contained reader
  scrolls `.peekover-app__reader` — a **light-DOM** element whose CSS lives in the app shell
  (`appShell.ts`, `overflow:auto`, **no `scroll-behavior`**), NOT the shadow `:host`. `scrollIntoView`
  reads `scroll-behavior` from that scroll box, so contained is **INSTANT in both modes** (measured,
  both engines, 3.3). **Why it matters:** plan §3-#2's "CSS `:host{scroll-behavior}` governs on BOTH
  surfaces" does not hold here — `readerCss.ts`'s `:host` reduced-motion override (the smooth default
  + `@media(prefers-reduced-motion:reduce)` reset) never reaches that light-DOM box, so the contained
  surface's reduced-motion safety is **incidental (instant-always)**, not enforced. Latent hazard: if
  anyone later adds `scroll-behavior:smooth` to `.peekover-app__reader` for parity, it would be smooth
  in **both** modes and silently violate `prefers-reduced-motion` on the app page, because the override
  isn't co-located with that box. **Revisit-when:** smooth-scroll parity on the app page is wanted, OR
  before any app-shell scroll-CSS change — add a reduced-motion-aware `scroll-behavior` to
  `.peekover-app__reader` (or take the §3-#2 JS `behavior` fallback in the 3.1 handler). Carried to
  6.1 for the plan §3-#2 revisit.

- **2026-07-16 · Firefox manual-gate loads MUST come from a FRESH production build (testing
  procedure, not a code decision).** `wxt build -b firefox` → load `.output/firefox-mv3/manifest.json`
  (note: **mv3**, not mv2 — we target MV3 on Firefox). A stale or dev Firefox load shows a `localhost`
  CSP warning and a dead reader; that is a load/procedure error, not a code defect — rebuild and reload
  the mv3 output before diagnosing. (Lesson from the task-2.2 human gate.)

- **2026-07-15 · M2 CLOSE (spec 002 — active-source foundation): the trust model was
  COMPLETED, not compromised.** M2 gave Peekover its second surface — a dedicated app page
  that reads a chosen folder of markdown from disk — and did it **without spending a single
  manifest permission**. The settled architecture, recorded so 003 builds on it, not around it:
  - **`permissions: []` survived M2 (the headline).** Folder access is reached entirely through
    **user-gesture web APIs** (File System Access `showDirectoryPicker` on Chromium; `<input
    webkitdirectory>` + drag `webkitGetAsEntry` on Firefox/picker-disabled). These add no
    manifest permission and no install-time warning — so consent lives in the **at-use, visible,
    revocable, re-prompted** flow, not an install dialog. The only manifest add is the toolbar
    `action` key (no popup → background `action.onClicked` → `tabs.create` of the extension's own
    `app.html`), which needs no `tabs`/WAR. CI-pinned by `tests/manifest.test.ts` (both engines).
  - **Second surface = a dedicated full-tab extension page** (not a popup, not a new-tab
    override). Task-0-verified: `showDirectoryPicker()`/`requestPermission()` work on a full-tab
    `chrome-extension://` page but the SW can't run them and the popup `AbortError`s. The M1
    render pipeline is reused **unchanged as a library** (`mount(text, host)`); the app page is a
    new caller, `src/render/*` untouched all milestone.
  - **The `FolderSource → MarkdownFile[]` seam** is the one engine boundary: everything above it
    (pure `tree`/`filterTree`, `treeView`, `readerPane`, recents/pins, storage panel) is
    engine-agnostic, and Firefox's read-only-snapshot limits ride as **capability meta**
    (`persistable:false`), never an engine sniff downstream. Designing the seam up front paid off:
    the group-4 drag-and-drop drop-in and the group-5 reopen wiring both funnelled through the
    SAME `applyOutcome`/`paintGranted` with zero duplication.
  - **Storage = a raw-IndexedDB local wrapper (`idbCore`), no `idb` dependency** — three stores
    (`folders`/`recents`/`pins`), the handle persisted as a **structured-cloneable capability ref,
    never file contents**. It shipped WITH its trust controls (`describeStored`/`wipeAll`), and
    group 6 gave those a **visible surface** (the "Stored data" panel + inline-confirm wipe) — the
    gap the group-5 manual gate surfaced. `getAll` is key-order (unordered); display order is the
    pure `recents` module's job.
  - **Eager, bounded, interruptible walk** (`walkPolicy`): markdown-filter + skip-list
    (node_modules/dotdirs) + hard file/depth cap + cancel token. Eager because name-search needs
    the full set; the cap is what makes a pathological tree surface "folder too large" instead of
    hanging (perf-measured: the cap holds at 5000 files against a 304k-file tree, ~40 ms).
  - **The test-honesty split (decision 4, held verbatim):** the automated real-engine test proves
    our **query→request→gate mechanism** via an OPFS/controllable-permission handle; the disk
    `prompt`-after-reload / `NotAllowedError` re-prompt ground truth is **NOT automatable** (OPFS
    always reports `granted`) and is confirmed at the **human gate + platform docs**. No stub
    masqueraded as platform proof — the same discipline gated the 6.2 perf harness (render/layout
    + disk reopen deferred to real-browser/human, not faked in jsdom/node).
  Revisit-when: 003+ adds a capability that needs a real manifest permission (re-open the ledger,
  AGENTS.md #4); the chunked/virtualized-render lever lands (decided from a real-browser tree
  render measurement, the deferred half of 6.2); or multi-folder *project* semantics arrive.

- **2026-07-14 · CORRECTION OF RECORD: "a detached node doesn't fetch" was FALSE in
  Blink AND Gecko; the remote-resource commit shipped a real pre-opt-in fetch leak.** The
  mechanics entry below claimed `mount()` was safe because it built the reader root
  DETACHED (`document.createElement('div')` + `innerHTML`) before neutralizing. That
  premise is wrong: a `createElement('div')` is owned by THIS document, which HAS a
  browsing context, so assigning `root.innerHTML = html` dispatches the remote `<img>`
  fetches AT THAT LINE — upstream of `applyMediaPolicy`, and synchronous removal
  afterward does not cancel the in-flight request. So every remote image in a rendered
  doc leaked one request on first paint, before any opt-in. **The property that actually
  prevents the fetch is an INERT document with no browsing context** — a `<template>`'s
  `.content` or `DOMParser` output, NOT "detached-ness". Probe evidence (throwaway
  real-engine tests, both engines): a same-origin `<img>` mounted via the old path
  produced Resource Timing entries for all three probe URLs in Chromium AND Firefox
  (`http://localhost:PORT/__peekover_probe__/…`); parsing the same HTML into a
  `<template>` produced zero. **Fix:** `mount()` now parses the sanitized HTML into a
  `<template>`, runs `applyMediaPolicy()` on that inert fragment, then adopts the
  already-neutralized nodes into the reader root (`root.append(tpl.content)`) and commits
  as before — a remote `src` never materializes in a fetching document. `applyMediaPolicy`
  already takes any `ParentNode`, so it accepts the `DocumentFragment` unchanged.
  **Why it hid for a whole commit:** the class of bug is BYTES-ON-WIRE, and jsdom loads
  no subresources — the `mount.test.ts` NO-LEAK (final-DOM-shape) and ORDERING
  (neutralize-before-`replaceChildren`) tests both stayed GREEN through the entire leak,
  because the leak fires at `innerHTML`, upstream of the DOM checkpoints they inspect.
  It was caught only at the human Network-tab manual gate. **Standing rule going forward:
  remote-media / zero-network guards MUST live in the browser project** (real Chromium +
  Firefox, asserting on Resource Timing = bytes on wire), not jsdom —
  `tests/browser/remoteMedia.browser.test.ts` is that guard (RED-first proven: 3 leaked
  requests both engines pre-fix; GREEN post-fix; and it also asserts opt-in DOES fetch so
  we did not over-correct). The jsdom NO-LEAK/ORDERING tests are kept but downgraded in
  trust to DOM-shape guards (comments added). golden `images.html` unchanged (identical
  neutralized output); sizes flat (content 270.58 kB, zip 152.99 kB); image-free 1 MB
  perf flat (median ~1388 ms). Revisit-when: any new remote-media surface (audio/video,
  SVG `<use>`, CSS `url()`), or the sanitize/mount seam changes how HTML reaches the DOM.
- **2026-07-14 · Remote-resource policy — implementation mechanics.** (Implements the
  earlier default decision below. NOTE: the "detached subtree has no browsing context"
  claim in this entry is CORRECTED by the entry above — the safe property is an inert
  document, and the original implementation leaked; kept for history.) Filled the
  `applyMediaPolicy` seam
  (`src/render/mediaPolicy.ts`). **Neutralization happens in an INERT context, before
  commit** — the load-bearing rule: inserting an `<img src="http…">` into the LIVE DOM
  fires the fetch immediately, so stripping `src` *after* commit has already leaked the
  request. `mount()` already builds the reader root DETACHED (`createElement` + `innerHTML`
  — a detached subtree has no browsing context and fetches nothing), so we run the policy
  on that root and only then `replaceChildren()` it into the live shadow tree. A `mount()`
  no-leak test commits the real pipeline to a live jsdom DOM and asserts zero fetchable
  `src`/`srcset` anywhere; non-vacuity was proven RED-first by no-oping the policy (3 remote
  `IMG[src]` leaked) then GREEN on restore. **Classification is by the scheme a URL RESOLVES
  to against the page URL** (`document.baseURI`), not string inspection: the SAME `./pic.png`
  is *local* on a `file://` page (→ `loading="lazy"`, no network) but *remote* on a raw-git
  `https://` page (→ blocked). http/https (incl. protocol-relative) → blocked; `file:` on a
  file page → allowed+lazy; `data:`/`blob:`/unresolvable → inert (and `data:` is already
  stripped from `<img src>` by sanitize's own hook). A blocked image's `<img>` is REMOVED and
  replaced by an inert themed placeholder (`<span>`, valid inline; label + alt text); the URL
  rides on `data-peekover-src` (+ `data-peekover-srcset` defensively — `srcset` is not in
  sanitize's ALLOWED_ATTR today, so it does not survive, but the policy stays correct if that
  changes). **Opt-in is per PAGE-VIEW, a direct consequence of `permissions:[]`** — there is no
  storage, so preference cannot be persisted; the "N remote images blocked · Load" pill restores
  the stored URLs as real `<img loading="lazy">` for this view only, and a reload re-blocks (the
  pill's tooltip says so). **Network-indicator semantics:** a `data-network="active"` attribute on
  the host (like `data-theme`/`data-mode`) that CSS keys a persistent corner light off; it is set
  the moment the user opts in and stays for the rest of the view, and is NEVER shown otherwise
  (chrome is added only when >0 images were blocked). Uses `--del` (the one warm accent) as an
  honest "you have left the zero-network default" signal. **UX precedent:** the email-client
  pattern ("images not shown · load images") — familiar, trust-building, and the exact shape users
  already understand; our differentiator is that competing markdown viewers load remote media
  by default. Raw view is untouched (policy applies to the rendered reader only). Revisit-when:
  the load mechanism evolves (e.g. a settings-persisted allow, which needs storage → a permission),
  or non-`<img>` remote media (audio/video/SVG-use) enters the allow-list.
- **2026-07-14 · First-paint gate rescoped from a size-sweep: <150 ms protects the TYPICAL doc, the
  1 MB case gets its own honest bound.** The single `<150 ms on the 1 MB fixture` acceptance line was
  written PRE-measurement; measurement (5.2/5.2b) put it ~8× over and showed why the number is
  unreachable on a 1 MB `file://` doc within the settled design, for two structural reasons: (1) a
  **browser parse floor** — DOMContentLoaded on a 1 MB doc is hundreds of ms of the browser's own
  parse we cannot precede, and we must WAIT for a readable, COMPLETE source before mounting (reading a
  partially-streamed `<pre>` would silently truncate a large doc; the Gecko fix reinforced that source
  readiness is engine-dependent); and (2) the reader's **own layout** — building the ~1400-section
  rendered DOM adds ~750 ms, the cost that now dominates first-paint after the document_start pass
  removed the raw-`<pre>` flash. A size sweep (`scripts/perf-first-paint.ts --size`, same protocol: 7
  runs, cold discarded, median of warm 6, two invocations; i7-13700, Windows, headless chromium)
  measured nav→paint medians: **10 KB → ~78–82 ms, 50 KB → ~118–122 ms (both PASS <150 ms); 200 KB →
  ~345–347 ms; 1 MB → ~1187–1310 ms (FAIL, ~8×).** Decision (human-approved): the gate is now two-part
  — (i) typical doc (≤50 KB): nav→paint median <150 ms [PASS]; (ii) 1 MB: no raw-text flash
  (manual-verified in both engines) + reader painted within an honest bound **<1.7 s** (~25–30%
  headroom over the measured median) [PASS]. This is NOT softening a threshold to force a pass: the
  ≤50 KB tier genuinely meets 150 ms on its own; 200 KB (~345 ms) marks where a single-shot synchronous
  render starts to degrade and informs the ≤50 KB "typical" boundary. **Chunked/virtualized/deferred
  reader render is explicitly DEFERRED to M2 as the lever for large-doc first-paint** — do not build the
  whole section DOM synchronously. Measurement/docs-only change: zero `src/`+`entrypoints/` edits, and the
  golden 1 MB digest is unchanged (the default `pnpm perf` still uses `buildHugeDoc()`'s 1400-section
  fixture byte-for-byte). Revisit-when: M2 chunked render lands, or the fixture/pipeline output changes.
- **2026-07-14 · Mount triggers must be commit-aware; source readability at DOMContentLoaded is
  engine-dependent (the Gecko gotcha).** The `document_start` reader can be asked to mount before the
  raw `<pre>` is readable: on Firefox the `file://` `<pre>` can still be EMPTY at DOMContentLoaded and
  only becomes readable by `load`; Chromium has it by DCL. So a mount attempt that finds no source is
  NOT a failure — it must leave the hide + backstops armed and retry at `load`, never assume-and-tear-
  down. `mountReader` now returns a commit boolean (`true` = a reader host is committed, incl. the
  degraded raw-fallback and the idempotent already-mounted re-entry; `false` = the no-source no-op),
  and `runReader` only reveals-and-disarms on a real commit, an unforeseen throw, or the FINAL attempt
  (which also logs one `console.warn` breadcrumb — the silent give-up is what cost this bug an
  investigation). The safety timer is now a pure never-blank FLOOR: it reveals raw WITHOUT disarming
  the attempts, so a late mount still takes over (accepted returned-flash tradeoff). **Correction of the
  record:** Firefox `file://` content scripts DO work; the prior session's "Firefox platform gap" was a
  MISDIAGNOSIS of this self-inflicted regression — remote (`raw.githubusercontent`) and local `.md` both
  failed by the SAME mechanism (the old `finally { reveal() }` firing on a not-ready-yet DCL no-op),
  and the localhost-workaround research it prompted was unnecessary. The original bug was introduced
  with the document_start + hidden-raw pass (below). Revisit-when: we change the mount trigger timing,
  or move off the DOMContentLoaded/`load` pair.
- **2026-07-14 · Reader mounts at `document_start` behind a hidden raw view.** The content script
  now runs `runAt:'document_start'` (both browsers). Flow (`src/render/runReader.ts`): detect FIRST
  (URL gate; a miss leaves the page completely untouched), then SYNCHRONOUSLY inject a `<style>` that
  sets `body > :not(peekover-root){display:none !important}` — `display:none` (not visibility:hidden,
  which still lays out) so the raw `<pre>` is kept out of layout and never paints. At document_start
  `<head>`/`<body>` may not exist, so the `<style>` is parented to `documentElement` (`<html>`);
  verified in Chromium that a `<style>` there IS honored (probe: raw `<pre>` computes `display:none`
  at 27 ms, before mount). Then WAIT for DOMContentLoaded (a partially-streamed `<pre>` read would
  silently truncate a large doc) and mount. **Never-blank mechanics (AGENTS.md #5, outranks the perf
  target):** detect-before-hide; a safety unhide = a 3 s timer PLUS the window `load` event (whichever
  first) that drops the hide `<style>` if the reader never mounts; and a `finally` that drops the hide
  `<style>` on EVERY mount outcome — success (originals already inline-hidden by mountReader, reader
  up → hand visibility to mount/toggle), failure (originals restored → raw visible), or an unforeseen
  throw. reveal() is idempotent + once-only so the paths never fight the toggle. **Programmatic
  injection (scripting + host_permissions, à la simov/markdown-viewer) was REJECTED** — `permissions:[]`
  is settled ground truth. **Perf-gate metric (as measured by `scripts/perf-first-paint.ts`):** reader
  first-paint = `performance.now()` at the 2nd rAF after `<peekover-root>` first has populated
  open-shadow content, timeOrigin-relative; gate = (a) navigationStart→painted median < 150 ms on the
  1.12 MB fixture. This change eliminates the raw-text FLASH for all sizes but did NOT move that number
  (~1245 ms → ~1261–1341 ms, still FAIL): first-paint is now dominated by laying out the reader's own
  ~1400-section rendered DOM, not the raw-`<pre>` layout we removed. Revisit-when: chunked/virtualized/
  deferred reader render (the only remaining lever), or if the toggle ever needs to reveal the original
  light-DOM nodes (it currently builds Raw inside the shadow root, so the hide/unhide never touches it).
- **2026-07-14 · Raw/Reading toggle: bare `\` shortcut; failure-raw and user-raw are
  distinct; the Raw view is built lazily.** Task 4.2. The reader flips between the rendered
  document ("Reading", default) and the original markdown as escaped text in the themed
  `pre.peekover-raw` ("Raw"), invokable two ways: a focusable pill in the shadow root and a
  keyboard shortcut. **Shortcut = a BARE backslash `\`** (`src/render/readerMode.ts`
  `TOGGLE_KEY`): not a Ctrl/Cmd combo (the browser owns those), and not `/` or `'` (Firefox
  quick-find) or a bare letter (collides with host-site shortcuts); `\` has no default
  browser/OS action. Scoping (must never swallow keys on pages we didn't render): a single
  document `keydown` listener installed once, only on the success path; it no-ops — and does
  NOT preventDefault — unless a mounted host carries `data-mode`, ignores the event when focus
  is in input/textarea/select/contenteditable, and rejects modifier chords. The listener is
  only ever *added* inside our content script, which runs only in matched markdown contexts,
  so it is absent on other pages entirely. **State** = a `data-mode` attribute on the shadow
  host (`reading`|`raw`); CSS in `readerCss.ts` keys view visibility off it, so a toggle is a
  pure attribute flip — parse/sanitize NEVER re-run (reader element identity holds across
  toggles). **Lazy raw view:** the raw `<pre>` is built on first toggle (source as
  `textContent`, no parse) and reused, so a never-toggled doc keeps its untrusted source out
  of the shadow tree (this is also why the existing sanitize test — "no `alert(` in
  innerHTML" — stays green). **Failure-raw vs user-raw are DISTINGUISHABLE:** the render-
  failure fallback shows a quiet left-accent banner ("Couldn't render this document — showing
  raw source.", `role="status"`, mockup `.alert.warn` styling) AND sets NO `data-mode` (there
  is no reading view to toggle to, so the shortcut stays inert); a user-chosen Raw view is a
  `data-mode` with NO banner. No persistence in M1 (mode resets per mount — persisted reading
  prefs are spec 004). No manifest change (all in-content-script UI). Revisit-when: spec 004
  settings UI (persist last mode), or a real toolbar milestone replaces the single pill.
- **2026-07-14 · Fonts: Literata bundled INLINE as base64 `data:` URIs, registered via the
  FontFace API.** The reader ships four Latin-subset Literata woff2 faces (400/700 × normal/italic,
  ~86KB raw, OFL — `assets/fonts/`, license `assets/fonts/OFL.txt`). They are imported with Vite's
  `?inline` suffix (relative paths, so the specifier resolves under both WXT and the vitest runner,
  which has no `@/` alias) → embedded as base64 in the content-script bundle, and registered on
  `document.fonts` via `new FontFace(...)` (`src/theme/fonts.ts`). Why inline over an extension URL:
  zero-network becomes literal (no request at all, not even a chrome-extension:// fetch) AND it needs
  no `web_accessible_resources`, so this styling task adds nothing to the manifest (AGENTS.md #4).
  Why the FontFace API over an `@font-face` rule in the shadow root: Chromium does not reliably apply
  `@font-face` declared inside a shadow tree, but faces on `document.fonts` participate in font
  matching for the whole document incl. shadow trees, in both Chrome and Firefox; adding a face does
  not restyle any host-page element, so it doesn't leak styling into the page. Cost: base64 inflates
  the bundle ~33% over raw (packed zip ≈150KB total — far under the ≤5MB / <2MB-zip budgets).
  Revisit-when: budget pressure, or a full-range (non-Latin) font need — then reconsider an
  extension-URL + WAR delivery.
- **2026-07-14 · Reader theme: light/dark ACTIVE via OS; sepia + manual switching DORMANT.** All
  three themes are DEFINED in the shadow stylesheet (`src/theme/readerCss.ts`) with the exact
  `design/tokens.css` values, keyed off a `data-theme` attribute on the shadow host. In M1 the runtime
  (`src/theme/reader.ts`) only ever sets light or dark, driven by `prefers-color-scheme` (a single
  matchMedia listener re-themes open readers when the OS flips). Sepia and manual/persisted selection
  are intentionally left un-wired until the settings milestone (spec 004). Why define-but-dormant:
  ships the correct token contract now so 004 only adds a selector, not new CSS. The full-bleed reader
  paints via `:host{position:fixed;inset:0}` + `all:initial` (isolates the reader from host-page style
  inheritance without touching the page). Revisit-when: spec 004 wires the theme/settings UI.
- **2026-07-14 · The reader HIDES the page's original nodes (`display:none`), not detach.**
  `mountReader` (src/render/mountReader.ts) sets inline `display:none` on the body's original
  children rather than removing them, so task 4.2's Raw toggle can reveal them again without a
  reload. This MUTATES the host page's DOM (inline display on body children). To keep the
  never-blank invariant (AGENTS.md #5) on the real injection path, mountReader renders into its
  shadow host and confirms non-empty content FIRST, and only THEN hides the originals; on any
  throw — or an empty render — it removes the host and leaves the browser's own rendering exactly
  as it was, so the user is never left with the page hidden AND nothing valid shown. (mount()'s
  own throw→raw fallback can't see this hide step, hence the guard lives in mountReader; the core
  was extracted from the entrypoint so it's unit-testable in jsdom.) Revisit-when: task 4.2 Raw
  toggle implementation, which reads/reverses this `display:none`.
- **2026-07-14 · Remote resources are BLOCKED by default.** Peekover does not load remote
  images or any remote resource a document's HTML would fetch until the user opts in with one
  click, which loads them AND lights the network indicator; permitted/local media is lazy-loaded
  (native `loading="lazy"`, offscreen deferral). Why: makes the "zero network by default" promise
  literally visible and demoable — core positioning, not a preference (AGENTS.md #1). The sanitize
  allow-list is unchanged (it still permits http/https `src`); blocking is a RENDER-LAYER policy
  (mount/shell decides what actually loads), not a sanitize strip. Revisit-when: never for the
  default; the load mechanism may evolve.
- **2026-07-14 · Dropped `id` and `align` from the sanitize allow-list.** The strict
  DOMPurify profile (`src/render/sanitize.ts`) no longer permits `id` or `align`. Why:
  `id` is a DOM-clobbering surface (attacker-controlled ids can shadow named
  `document`/form properties) with **no M1 producer** — markdown-it emits no heading ids;
  `align` is inert — markdown-it emits table alignment as inline `style` (which we strip),
  never as an `align` attribute, so allowing it did nothing. Revisit-when: M2 heading
  anchors, where we generate ids ourselves and re-allow `id` deliberately; and the M2 task
  to restore GFM table alignment by mapping to a class (never inline style).
- **2026-07-14 · Security tests run in jsdom; add an in-browser sanitize check at the
  golden/e2e milestone.** The sanitize suite uses jsdom, whose HTML parser differs from real
  browser engines — notably for mXSS, where namespace/reparsing quirks (SVG/MathML foreign
  content, template/noscript) can diverge, so a payload inert under jsdom is not proof it is
  inert in Chrome/Firefox. Scheduling note (not a code change now): during the golden-fixture
  / e2e milestone (tasks 5.x), run the malicious fixtures through DOMPurify in an actual
  Chrome and Firefox context and assert no script executes. Revisit-when: task 5.1/5.2 lands.

- **2026-07-14 · Target MV3 on Firefox (over WXT's MV2 default).** Set `manifestVersion: 3`
  in wxt.config.ts so the Firefox build is MV3, not WXT's default MV2; chose gecko.id
  `peekover@peekover.dev` (stable, on-brand, we own the domain — required before an MV3 AMO
  submission). Why: consistency with our MV3 / no-persistent-background security claim (spec §6),
  and MV2 is legacy for new extensions. Firefox MV3 uses a non-persistent **event page**
  (`background.scripts`), not a Chrome service worker — WXT emits the right shape from our
  `defineBackground` automatically, so no background code changed. gecko keys are gated on
  `browser === 'firefox'` so they never leak into the Chrome manifest. Revisit-when: AMO changes
  ID rules, or we adopt a real background listener.
- **2026-07-14 · Lowercase-only file:// match patterns.** `isRenderableContext()` is
  case-insensitive, but the manifest `file:///*.<ext>` patterns are lowercase, so a local file with
  an UPPERCASE extension (e.g. `README.MD`) won't trigger browser injection. Why: doubling every
  file:// pattern to cover uppercase is a poor tradeoff for a rare case; raw hosts are host-matched
  and unaffected, and most local files use lowercase extensions. Revisit-when: we next touch match
  patterns (Firefox/manifest task 2.3 or folder-mode), or if a user actually reports it.
- **2026-07-11 · Name: Peekover** (DocPeek withdrawn — live App Store collision). Eight-surface
  verification passed; domain peekover.dev owned+verified. Full record: names.md in design archive.
- **2026-07-11 · Umbrella ship model:** repo under github.com/mosuvo/peekover (personal), org
  `peekover` dormant insurance, one publisher account for all future free tools, hello@peekover.dev
  public contact, no product X handle. Revisit: if a tool needs contributors/governance.
- **2026-07-10 · Brand: monochrome + one highlighter.** No chromatic accent (indigo/orange/red all
  rejected — clashed with yellow). Interactive = ink + highlighter underline. Logo internals fixed-ink.
- **2026-07-09 · Stack: WXT + markdown-it + DOMPurify + Shiki + KaTeX + Mermaid + CM6.** One
  battle-tested parser over hand-rolled; WXT over Plasmo (maintenance, MV3+Firefox story).
  Revisit: only if 5MB budget breaks.
- **2026-07-09 · Zero-network default is architecture, not policy** — no code path may fetch
  without explicit user trigger + indicator. Revisit: never.
- **2026-07-08 · Strategy: markdown wedge → universal raw viewer (Phase 2).** Free forever,
  credibility play, $0 infra.

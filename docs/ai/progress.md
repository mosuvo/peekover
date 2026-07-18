# Progress — Peekover
*The file every session reads first. Keep the "Now" section honest.*
*Updated: 2026-07-17.*

## Now (start here)
**M3 CLOSED (spec 003 — TOC / navigation): code-complete AND human-gated, both engines, both surfaces.**
The **6.2 milestone-close human gate PASSED 2026-07-17** on Chrome + Firefox, both surfaces (content-script
full-page `file://` doc AND the app-page reader pane), Network tab open — TOC appears at ≥2 headings · click
scrolls to the section · scroll-spy tracks the active entry · collapse/expand · drag-resize · backtick toggle ·
**smooth** normally and **instant** under OS reduced-motion · a no-heading doc and a pathological-heading doc
each show a designed state, **never blank** · plus the (b) **no-raw-flash on the 1 MB doc** ground truth
deferred here from 5.2. **Zero unexpected network, no console errors, the document stays the hero.** This is
the one 003 acceptance an agent cannot self-certify — now met. It caught **1 real defect** the green stack
missed (the rail rendered TRANSPARENT + the reading column un-reserved — a NEW **"visual occlusion is
gate-only"** class; retro 2026-07-17), keeping the gate load-bearing (**6/6** milestone-shipping defects caught
across M1+M2+M3). Retro captured (docs/ai/retro.md). Nothing on 003 outstanding.

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
  `parse.ts`, the manifest and `wxt.config` all **untouched**. NEXT after review → group 6 (TOC
  carry-over). Do NOT start it yet.

Full close details in Done (2026-07-17); the settled TOC architecture + sizes/perf in decisions.md 2026-07-17.

**M2 (spec 002 — active-source foundation) remains fully closed** (code + the named human gate, both engines;
task 6.3 PASSED 2026-07-15 — see Done). Nothing on 002 outstanding.

**Product progress (rough):** M1 opens build-order phase 1-of-7 (product spec §11) — specifically its
core-render slice; themes-full, TOC, and onboarding from that same phase are still ahead. Spec-level
milestones are finer than the 7 phases (roadmap after 001: 002 sources · 003 TOC · 004 themes+settings ·
005 watch+diff · … ~a dozen to v1.0), so a precise product % is **deferred** — honestly this is early
foundation, ~first of ~12+ spec-milestones. Don't over-read the fraction.

## Done
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

## Up next
Immediate — **spec 003 (TOC / navigation) is CLOSED (code + the 6.2 human gate + 6.3 retro, 2026-07-17).**
Next milestone: **spec 004 (themes + settings)** — the settings surface that persists reading prefs
(theme/mode, and per §Surface-scope the TOC open-state/width that 003 kept per-view only). **Spec + plan +
tasks all landed: spec APPROVED (gate 1, 2026-07-17), plan APPROVED (Gear-3 gate 2, 2026-07-17 —
`specs/004-themes-settings/plan.md`), tasks.md DRAFTED (the gate-3 artifact) awaiting the human review. The next
action is IMPLEMENTATION group 1 (store foundation) in a FRESH session AFTER tasks approval — no implementation
code before then (WORKFLOW.md §5.3). Sepia DEFERRED from 004 (D-1 = A; palette undefined in `design/tokens.css`).**

Carried beyond 003 (measurement-driven / unrelated levers, do NOT guess):
- **Chunked/virtualized *TOC-tree* render** — the many-heading lever, new from 003's 5.1: ~45 ms rail build
  @1401 headings (jsdom upper bound), scales ~linearly. **NOT forced for typical docs**; the pathological
  one-node-per-heading cost is the same suspect as the folder tree. **Revisit at N-thousand headings**
  (decisions.md 2026-07-17).
- **Chunked/virtualized *tree* render** — the large-folder lever. 6.2 measured the pure walk+build as
  cheap (~7 ms typical); the suspect is `treeView` laying out one DOM node per file+dir. **Decide from
  a real-browser tree render measurement** (the deferred half of 6.2), not from a guessed bound.
- **Chunked/virtualized reader render** — the M1-carried large-*doc* first-paint lever (decisions.md
  2026-07-14). Same class, different surface; 003's 5.2 confirmed no first-paint regression, so still carried.
- Restore GFM table alignment safely (map to class, never inline style) — unrelated to 002/003 (spec 003
  §Out-of-scope leaves it to table work).

Roadmap: 003 TOC/navigation · 004 themes+settings · 005 watch mode + diff (the differentiator) · …
full order in docs/product/spec.md §Phase-1.

## Blockers / open questions
- **None.** M2 (spec 002) fully closed 2026-07-15; **M3 (spec 003) fully closed 2026-07-17** — code + the named
  6.2 human gate (both engines, both surfaces) + 6.3 retro. Nothing outstanding on either. **Spec 004 is scoped
  and approved (gate 1); plan approved (Gear-3 gate 2, 2026-07-17) — the spec §7 risks are resolved in
  `specs/004-themes-settings/plan.md` §3; tasks.md is DRAFTED and awaiting the gate-3 human review before any
  implementation code.**

# Tasks 004 — Themes + Settings — check off, add discovered tasks BELOW the line they came from
*Gear 3 tasks stage — **DRAFT, awaiting the human gate-3 review; NOT a go-signal.** No implementation*
*code until this is approved (WORKFLOW.md §5.3). Approved upstream: `spec.md` (af7401b · amended f4e11f5)*
*+ `plan.md` (89449dc). CC commit per task; human reviews + pushes. Each capability task carries its OWN*
*real-engine test (`tests/browser/*`, BOTH Chromium + Firefox, **red-first + non-vacuous** — M1/M2 retro*
*rule), not a trailing "add tests" task. Storage / messaging / paint / versionchange are jsdom-**BLIND**:*
*they are proven in the real engine, never in jsdom.*

**Standing discipline — baked into every task's Verify (not restated per line unless it varies):**
- **Golden + manifest pins, EVERY task:** `git diff tests/golden/output/` **EMPTY** (themes/settings never
  touch the pre-mount `sanitize(parse(source))` reading column) AND `tests/manifest.test.ts` green
  **UNCHANGED** — built manifest stays `permissions: []`, no `host_permissions`/`storage`/`tabs`/`webRequest`/
  `web_accessible_resources` added. A golden diff, or a needed manifest edit, = **STOP and flag** (the column
  changed or something spent a permission) — do NOT re-baseline.
- **Real-engine, red-first, non-vacuous** for anything jsdom cannot see (bytes-on-wire, IDB upgrade/
  versionchange, cross-context messaging, computed paint tokens). The wrong-wiring case must FAIL on BOTH
  engines; the right one passes.
- **Measured-vs-baseline** for perf/bytes: content-script size delta vs **284,744 B** (003 baseline); typical-doc
  (≤50 KB) first-paint vs the **<150 ms** budget / 003 baseline; `pnpm zip` **< 2 MB** both engines. Deltas
  **stated**, no un-measured threshold shipped (M1 retro).
- **Progress.md Now-pointer advances at EACH task/group boundary during implementation** (M1 retro rule,
  retro.md 2026-07-14 — the pointer once lagged four tasks; it is the one line the next session trusts). Task 7
  is its FINAL reconciliation, **not** its first move.

**Plan-gate decisions locked by the human — encoded here, not re-opened:**
- **D-1 = A: sepia DEFERRED from 004** (plan §0 D-1; spec §3.5 amended, f4e11f5). 004 ships **auto/light/dark**
  only — no sepia-activation / token-completion task; the settings UI offers **auto/light/dark**. Sepia returns
  as its own small task once its palette is designed (one extra `data-theme` value — the runtime is built
  surface-neutral to it). See **Deferred** at the foot.
- **D-2 settled by measurement, not up front:** the theme-flash mitigation (block-until-read vs paint-and-
  transition) is **chosen by task 4's measurement** — no mitigation hard-coded before the number exists
  (plan §0 D-2, §1.5). No un-measured threshold.

---

## 1 — Store foundation (real-engine: IDB upgrade + versionchange are jsdom-blind)

- [ ] **1.1 `DB_VERSION` 1→2 + additive `settings` store + `getSettings`/`putSettings`.** Bump `DB_VERSION`
      to 2; add the `settings` store (keyPath `id`) to `SCHEMA`/`STORES` so `openDb`'s existing
      **missing-store-create-only** `onupgradeneeded` creates it additively (no record-shape migration — that
      is idbCore's documented STOP signal). One global row `{ id:'reader', theme, tocOpen, tocWidth }`;
      `getSettings()` returns the row or the default, `putSettings(patch)` merges + writes.
      Files: `src/store/store.ts` · `tests/browser/settingsStore.browser.test.ts`
      Verify (**tests/browser** — Cr+Fx, red-first): write→read-back round-trips; the 1→2 upgrade **preserves**
      existing folders/recents/pins rows AND the `settings` store now exists. Red-first: a v1 DB opened as v2
      keeps its prior data (fails if the upgrade drops/recreates stores). Golden EMPTY + manifest green.

- [ ] **1.2 idbCore `db.onversionchange` — close-and-drop by construction (spec §7-2).** On `openDb` success
      register `db.onversionchange = () => { db.close(); <drop the memo> }` (optionally `onblocked` → close the
      orphaned open). This is the codebase's FIRST `DB_VERSION` bump, so the handler ships WITH it — the
      by-construction liveness guard, same spirit as the tocView `isConnected` prune.
      Files: `src/store/idbCore.ts` · `tests/browser/idbVersionchange.browser.test.ts`
      Verify (**tests/browser** — Cr+Fx, **red-first**): hold a v1 connection, open v2 → the v1 connection
      **closes** and the v2 open proceeds. Red-first: **without** the handler the second open **blocks/hangs**
      (assert the difference — the test must fail before the handler exists). Golden EMPTY + manifest green.

- [ ] **1.3 `wipeAll` + `describeStored` include `settings`.** Extend the store list both walk: `wipeAll()`
      clears `settings` too; `describeStored()` reads it and adds a plain-language line ("theme / display
      settings — stored on-device, no file contents"), joining folders/recents/pins.
      Files: `src/store/store.ts` · `tests/browser/settingsStore.browser.test.ts` (+ jsdom unit for the
      `describeStored` string)
      Verify: **jsdom** — `describeStored` emits the settings line; **tests/browser** (Cr+Fx) — after
      `putSettings` then `wipeAll`, `getSettings` returns the **default** (theming falls back to Auto).
      Golden EMPTY + manifest green.

## 2 — SettingsPort + messaging seam (surface-agnostic boundary; both ports proven in the real engine)

- [ ] **2.1 `settings.ts` — `Settings` type + default + pure `resolveTheme` + `SettingsPort` interface.**
      `resolveTheme(setting, osDark) → effective` ({auto,light,dark}→concrete; auto keys off `osDark`).
      Default `{ theme:'auto', tocOpen:null, tocWidth:null }`. Pure logic, no DOM/engine, no `store` import.
      Files: `src/settings/settings.ts` · `src/settings/settings.test.ts`
      Verify (**jsdom/unit**): `pnpm test settings` green — `resolveTheme` covers setting × OS (auto→light,
      auto→dark, manual ignores OS); the default shape is asserted. Golden EMPTY + manifest green.

- [ ] **2.2 `settingsPort.ts` — `directPort(store)` + `messagingPort()` with cached snapshot + timeout→default.**
      Both expose `snapshot()` (sync cached, never throws) / `load()` (resolve persisted, update cache) /
      `save(patch)` (best-effort, update cache immediately). `directPort` wraps `get/putSettings`;
      `messagingPort` wraps `browser.runtime.sendMessage` (`peekover:getSettings`/`peekover:setSettings`).
      `load()` is bounded by a short timeout → resolves to the **default** on timeout / message failure / store
      error (never-blank, spec §4).
      Files: `src/settings/settingsPort.ts` · `src/settings/settingsPort.test.ts`
      Verify (**jsdom/unit**, red-first on fallback): with a fake messenger/store — round-trip via the fake;
      `snapshot()` returns the default before `load()` resolves; a **hanging / throwing** fake makes `load()`
      resolve to the **default within the timeout** (fails if the fallback is missing). Golden EMPTY + manifest
      green.

- [ ] **2.3 Background settings handler (the second listener) + real-engine round-trip BOTH ports + zero-net.**
      `entrypoints/background.ts` gains a `runtime.onMessage` handler answering `getSettings`/`setSettings`
      against `store` (background's own memoized idbCore connection — correct across an update *because of* 1.2).
      Content entrypoint builds the `messagingPort`; app page builds the `directPort`.
      Files: `entrypoints/background.ts` · `tests/browser/settingsPort.browser.test.ts`
      Verify (**tests/browser** — Cr+Fx, red-first + **non-vacuous**): a value saved via **each** port reads
      back via the same port (direct = app-origin; messaging = content→background round-trip); zero-network
      (Resource-Timing) across save+load+wipe — **non-vacuous**: a control `fetch` DOES register. Red-first: a
      deliberately-misrouted message fails the round-trip. Golden EMPTY + manifest green.

## 3 — Theme runtime + host registry (paint is jsdom-blind; coherence + staleness proven in the real engine)

- [ ] **3.1 `themeRegistry.ts` — themed-host `Set` + register/unregister/`isConnected` prune + `applyTheme`.**
      A module-level `Set<HTMLElement>`; `applyTheme(effective)` writes `data-theme` on **every registered
      host**, pruning any `!host.isConnected` entry first (a verbatim mirror of tocView's `tocHosts` pattern —
      the by-construction liveness guard, retro 5×-recurrence rule). Keep it **one module**.
      Files: `src/theme/themeRegistry.ts` · `src/theme/themeRegistry.test.ts`
      Verify (**jsdom/unit**): register two hosts → `applyTheme('dark')` sets `data-theme="dark"` on both;
      remove one from the DOM → it is **pruned** and never re-written (the resolver can't touch a dead node).
      Golden EMPTY + manifest green.

- [ ] **3.2 `reader.ts` rewrite — registry broadcast + auto-only OS re-theme, BOTH surfaces (spec §3.4).**
      Replace `watchColorScheme`'s `querySelectorAll('peekover-root')` broadcast with the 3.1 registry;
      `initReaderRuntime` themes from the **resolved** setting (concrete via `resolveTheme`) and registers its
      host. The OS-flip listener re-resolves **only when the setting is `auto`** (manual themes ignore the OS).
      Files: `src/theme/reader.ts` · `tests/browser/themeRuntime.browser.test.ts`
      Verify (**tests/browser** — Cr+Fx, **red-first**): with an app-page reader open, an OS light↔dark flip
      **re-themes** it under Auto (fails before the registry swap — the stale-host bug); under a **manual**
      theme the OS flip is ignored. Golden EMPTY + manifest green.

- [ ] **3.3 Shell `APP_CSS` attribute cascade + register the shell root (spec §3.3, §7-3).** Restructure the
      shell token cascade: `.peekover-app` = light base; `@media (prefers-color-scheme:dark) .peekover-app` =
      dark (pre-JS default, never an unthemed frame); `.peekover-app[data-theme="light"|"dark"]` = explicit
      overrides (attribute specificity beats the media rule → **manual wins over OS**). Register the shell root
      in the theme registry; the runtime writes a concrete `data-theme` on it once settings resolve. **Do NOT**
      add `scroll-behavior` to `.peekover-app__reader` (spec §6 — reduced-motion trap); `readerCss.ts`
      `:host([data-theme])` blocks need no change for light/dark.
      Files: `src/ui/appShell.ts` · `tests/browser/themeRuntime.browser.test.ts`
      Verify (**tests/browser** — Cr+Fx, **red-first**): under a manual theme the shell root and the reader host
      compute the **same** `--paper`/`--ink` (coherence — fails before the cascade restructure); manual-dark-in-
      OS-light and manual-light-in-OS-dark both resolve correctly (attribute beats media). Golden EMPTY +
      manifest green.

## 4 — Flash: MEASURE, then the minimal mitigation (D-2 decided by the number, not up front)

- [ ] **4.1 Flash harness + minimal measurement wiring — MEASUREMENT, no threshold (plan §1.5, §4).** To have
      anything to measure, add the MINIMAL document_start wiring the measurement needs: fire `port.load()` at
      `document_start` and timestamp settings-resolved vs first-paint — measurement-only instrumentation, NOT the
      reveal-gating decision (that is 4.2). Measure on **≤50 KB and 1 MB** fixtures, **warm + cold** service
      worker, **both** engines (Firefox event-page timing too). Record numbers honestly in progress.md. **Assert
      NO threshold** — the numbers decide block-vs-transition; the `load()` timeout value is itself read off this
      measurement. (Scaffolding for the number, not a src/ change to chase one; 4.2 replaces it with the chosen
      mitigation.)
      Files: `scripts/perf-theme-flash.ts` (+ `package.json` `perf:flash`) · `entrypoints/*content*` +
      `src/render/runReader.ts` (minimal load()+timestamp instrumentation only)
      Verify (**measured**): `pnpm perf:flash` prints resolved-vs-paint medians per fixture × warm/cold × engine,
      recorded in progress.md. No acceptance number asserted (M1 retro standing rule).

- [ ] **4.2 Implement the CHOSEN reveal-gating in `runReader` (block OR transition).** Fire `port.load()` at
      `document_start` (parallel with `injectHideStyle()`); mount consumes `port.snapshot()`. Per 4.1: either
      **gate the reveal** on `load()` resolving (block — no flash) OR mount with `auto` and re-apply on resolve
      (transition — bounded flash, softened by a `prefers-reduced-motion`-respecting cross-fade, instant under
      reduce). Reuse `runReader`'s existing hide→reveal machine + never-blank safety floor — do not reinvent.
      Files: `src/render/runReader.ts` · `entrypoints/*content*` · `tests/browser/themeFlash.browser.test.ts`
      Verify (**tests/browser** — Cr+Fx, red-first): a reader opened with a persisted **dark** setting presents
      dark as its **first painted state** (block), OR flips within the measured bound with a reduced-motion-
      instant cross-fade (transition — whichever 4.1 selected). **Never-blank integration (red-first):** with the
      settings path made genuinely unreachable (background non-responding / `load()` rejecting), the reader still
      **mounts themed-Auto** and the safety floor still reveals — proving the async settings read never gates the
      never-blank guarantee (fails if a hung `load()` can stall the reveal). Golden EMPTY + manifest green.

## 5 — Settings UI (auto/light/dark only — sepia deferred, D-1=A)

- [ ] **5.1 Reader theme control — sibling of `.peekover-reader` (golden stays EMPTY).** A minimal control in
      `mount()`'s `children[]`, committed **outside** the reading column (styled like the mode-toggle /
      remote-load pills, tokens only). Selects/cycles **auto/light/dark**, calls `port.save({theme})`, applies
      immediately via `applyTheme`. Threaded through `MountOptions` (snapshot + save callback / the port), not a
      direct `store` import.
      Files: `src/render/mount.ts` · `src/render/readerPane.ts` · `src/theme/readerCss.ts` (pill rule, tokens
      only) · `tests/browser/themeRuntime.browser.test.ts`
      Verify (**tests/browser** — Cr+Fx, BOTH surfaces): the pill renders and works on the content-script full-
      page reader AND the app-page `{contained}` pane (the one-mount() seam ships to both — the recurring two-
      surface gotcha); selecting Dark applies dark + persists (read back next open); the control is a **sibling**
      of `.peekover-reader`, so `git diff tests/golden/output/` is **EMPTY** (asserted). Manifest green.

- [ ] **5.2 App-page shell header theme control.** A matching auto/light/dark control in the shell header
      (beside the storage-toggle), wired to the `directPort`; writes the concrete `data-theme` on the shell root
      via `applyTheme`.
      Files: `src/ui/appShell.ts` · `tests/browser/themeRuntime.browser.test.ts`
      Verify (**tests/browser** — Cr+Fx): header select applies to **both** shell + reader pane (coherent, no
      half-themed screen) and persists across reload. Golden EMPTY + manifest green.

## 6 — TOC carry-over (persisted open-state + width; global, per plan §1.7)

- [ ] **6.1 Apply persisted `tocOpen`/`tocWidth` on build; persist on toggle/resize.** Thread the port into
      `buildTocView` (via `mount()`): on build, if `snapshot().tocOpen`/`tocWidth` are non-null apply them
      instead of the 003 width-derived `initialTocOpen`; else keep 003's behavior. `setTocOpen` (backtick +
      opener) calls `save({tocOpen})`; the resize drag `end` calls `save({tocWidth})` — via an **injected
      callback**, not a direct `store` import (tocView stays surface-agnostic).
      Files: `src/render/tocView.ts` · `src/render/mount.ts` · `tests/browser/tocPersist.browser.test.ts`
      Verify (**tests/browser** — Cr+Fx, red-first): toggle the rail closed + drag a width → **reopen** applies
      the remembered open-state + width (fails if the snapshot isn't consulted / the callback doesn't save);
      `null` fields fall back to 003's default. Golden EMPTY + manifest green.

## 7 — Perf / bytes / pins / docs + close
- [ ] **7.1 Re-measure bytes + first-paint; final pins.** Re-measure the content-script byte size vs
      **284,744 B** (delta stated) and typical-doc (≤50 KB) first-paint vs **<150 ms**; `pnpm zip` **< 2 MB**
      both engines. (Measurement only — no `src/` change to chase a number.)
      Files: `docs/ai/progress.md` (record the numbers)
      Verify (**measured**): `pnpm lint` + `pnpm test` + `pnpm test:browser` green; `pnpm zip` < 2 MB both
      engines; byte + first-paint deltas recorded in progress.md; `git diff tests/golden/output/` **EMPTY** +
      `manifest.test.ts` green (`permissions: []` re-proven).
- [ ] **7.2 PERMISSIONS.md (AGENTS.md #4, SAME session) + memory reconcile.** Update PERMISSIONS.md: the
      background now holds a **second listener** (settings message handler, was exactly one); document the
      settings message channel as a **zero-permission capability** (like the folder ledger) — still
      `permissions: []`. Confirm the real path with `git ls-files '*PERMISSIONS.md*'` and edit THAT file (it
      lives at `docs/trust/PERMISSIONS.md`) — do not create a stray copy. Reconcile memory files + advance the
      progress Now-pointer to "004 code-complete / human gate next".
      Files: `docs/trust/PERMISSIONS.md` · `docs/ai/progress.md` · `docs/ai/decisions.md`
      Verify (**gate**): PERMISSIONS.md reflects the second listener + the zero-permission settings channel;
      `manifest.test.ts` green (`permissions: []`); the Now-pointer reads "code-complete / human gate next".

## 8 — Human milestone-close gate (the acceptance an agent CANNOT self-certify)

- [ ] **8.1 Milestone-close human gate (NAMED, required — not removable by adding jsdom tests).** Fresh
      production build, **Chrome + Firefox**, **both surfaces** (content-script reader on a raw/`file://` doc AND
      a file in the app-page reader pane), **Network tab open**: pick each theme (Auto/Light/Dark) → **applies
      live**; **reload → persists**; the **no-flip** property (or its accepted 4.1 fallback) on the content-
      script reader; an **OS flip re-themes only under Auto**; shell + reader **coherent** (no half-themed
      screen — occlusion eyeball); **TOC open-state/width remembered**; "Stored data" shows **settings** + a
      **wipe** clears them → back to **Auto**; **zero unexpected network**, no console errors; the **document
      stays the hero**. This class (layout / engine timing / bytes-on-wire / wiring-visibility) is exactly what
      jsdom cannot see — **an agent cannot self-certify it.**
      Files: — (human gate; no code)
      Verify (**human gate**): a human walks the full checklist, both engines + both surfaces, and records the
      pass in progress.md.

---

## Deferred / Out of 004 (traceability)

- **Sepia theme — DEFERRED (D-1 = A).** `design/tokens.css` defines only 4 of ~15 sepia tokens, so completing
  the palette is a brand/design decision, not an implementation fill (plan §0 D-1; spec §3.5 amended, f4e11f5).
  Returns as its **own small task** once designed: add the completed sepia token block + one extra `data-theme`
  value in the settings UI + a human-gate LOOK check (contrast, the on-highlighter literal-hex trap). The 004
  runtime is written surface-neutral to it, so activation is additive.

---
*Discovered tasks go BELOW the line they came from (M1/M2 convention). Any need to edit `sanitize.ts` /
`parse.ts` / the built manifest, or to add a manifest permission, means scope drifted — **STOP and flag**
(plan §4, AGENTS.md #4). A `tests/golden/output/` diff means the reading column changed — STOP, do NOT
re-baseline.*

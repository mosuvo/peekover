# Plan 004 — Themes + Settings

**Status:** draft (Gear-3 gate 2 — awaiting human approval before tasks.md)
**Date:** 2026-07-17
**Spec:** `specs/004-themes-settings/spec.md` (approved gate 1). This plan is the HOW; it resolves the five spec §7 risks against the actual code and specifies the test strategy. No implementation until tasks.md is approved (WORKFLOW.md §5.3).
**Libraries:** **no new dependency.** Extends the existing raw `idbCore`; messaging via the existing `browser` (`#imports`). A record-shape migration or cursor/index work would be idbCore's documented STOP signal — not reached here (additive store only).

---

## 0. Decisions due AT THIS GATE (block tasks.md)

**D-1 · Sepia (spec §3.5 escalation fired).** `design/tokens.css` — the stated source of truth — defines sepia as **four tokens only** (`--paper/--ink/--accent/--accent-soft`); ~11 others fall through to light, so a sepia reader paints light chrome (code/tables/rail/pills) on sepia paper. Per §3.5 this is a design decision, escalated here, not filled silently. **Pick one:**

- **A (recommended): defer sepia from 004.** Ship auto/light/dark + persistence + TOC carry-over; amend spec §3.5 to "sepia deferred until its palette is designed" (C12, same-commit). Unblocks the milestone.
- **B: complete the palette first** (design extends `tokens.css` with a full, contrast-checked sepia set), then activate.
- **C: 004 ships a reviewed derived fill** (panel/line/code-bg/etc. as tints), approved in-PR as a design call.

The rest of this plan is written **surface-neutral to D-1**: sepia is one extra `data-theme` value everywhere; choosing A simply drops the sepia UI option + the token-completion task and adds a one-line spec amendment. Nothing else changes.

**D-2 · Flash mitigation is measured, not chosen up front (spec §7-1).** The plan sequences a **measurement task before** committing block-vs-transition (§4, §6 task order). No mitigation is hard-coded here; the measured numbers decide, honoring the M1 "no un-measured threshold" rule.

---

## 1. Architecture & data flow

### 1.1 The settings record (one row, global)

A new `settings` object store in the existing `peekover` DB (keyPath `id`), holding a single row:

```
{ id: 'reader', theme: 'auto' | 'light' | 'dark' | 'sepia',
  tocOpen: boolean | null, tocWidth: number | null }
```

`null` TOC fields = "no stored preference, use the 003 width-derived default." Global (not per-file) — per-file is out (spec §6). `DB_VERSION` 1→2; the store is created additively by `idbCore.openDb`'s existing `onupgradeneeded` (missing-store create only) — existing folders/recents/pins data is untouched (spec §5 store-integrity).

### 1.2 The `SettingsPort` seam (the surface-agnostic boundary)

Both surfaces reach settings through ONE injected interface, mirroring how M2 injects `store` into `appShell` and M3 injects deps into `mount`. mount()/tocView()/the theme runtime never import `store` directly — they get a port, so they stay surface-agnostic and jsdom-testable.

```
interface SettingsPort {
  snapshot(): Settings;             // synchronous, cached current value (never throws)
  load(): Promise<Settings>;        // resolve persisted value; updates the cache
  save(patch: Partial<Settings>): Promise<void>;  // best-effort; updates cache immediately
}
```

- **App page (extension origin):** the port wraps `store` directly (a new `getSettings`/`putSettings` pair in `store.ts`). `load()` = one IDB read; `save()` = one IDB write. No messaging.
- **Content-script reader (host-page origin — cannot see the extension DB):** the port wraps `browser.runtime.sendMessage`. `load()` → `{type:'peekover:getSettings'}` → background reads `store` → responds. `save()` → `{type:'peekover:setSettings', patch}`. Zero permission: content→own-background messaging is always available, no `host_permissions`/`tabs`/`storage`.

**Never-blank / degradation (spec §4):** `load()` is bounded by a short timeout; on timeout, message failure, or a store error it resolves to the **default** `{theme:'auto', tocOpen:null, tocWidth:null}`. The reader always mounts; a settings failure degrades to OS/auto theming, never a hang or blank.

### 1.3 Theme resolution & the host registry (fixes spec §7-3, §3.4 staleness)

The persisted **setting** is one of {auto,light,dark,sepia}; the **effective** `data-theme` is always a concrete value:

- `auto` → `matchMedia('(prefers-color-scheme:dark)')` ? `dark` : `light`
- `light|dark|sepia` → itself.

A single `applyTheme(effective)` writes `data-theme` on every **registered themed host** — reader shadow hosts **and** the app-shell root. A module-level `Set<HTMLElement>` registry with `isConnected` pruning (a verbatim mirror of `tocView.ts`'s `tocHosts` pattern) replaces `reader.ts`'s `querySelectorAll('peekover-root')`, so an OS flip re-themes **both** surfaces (the app-page reader host was the stale one — Finding 2). The OS-flip listener re-resolves **only when the setting is `auto`** (manual themes ignore the OS). This is the §3.4 rewrite; the registry + prune is the by-construction liveness guard (retro 5×-recurrence rule).

### 1.4 Shell attribute-driven theming (fixes spec §7-3 desync)

`appShell.ts` `APP_CSS` currently themes via `@media (prefers-color-scheme:dark)` only — no attribute can override it, so a manual dark reader would sit in an OS-light shell. Restructure the shell token cascade to:

- `.peekover-app` = light base;
- `@media (prefers-color-scheme:dark) .peekover-app` = dark (the **pre-JS/pre-read default**, so the app page is never unthemed for a frame);
- `.peekover-app[data-theme="light"|"dark"|"sepia"]` = explicit overrides (attribute specificity 0,2,0 beats the media rule 0,1,0, so **manual wins over OS** regardless of OS state).

The theme runtime sets a concrete `data-theme` on the shell root (and the contained reader host) once settings resolve. `readerCss.ts`'s `:host([data-theme=…])` blocks are already attribute-driven and need **no change** for light/dark (sepia per D-1). `readerPane.ts` state CSS inherits shell tokens via `var(--…)` and follows automatically once the shell root carries `data-theme`.

### 1.5 Content-script first-paint threading (the flash locus — spec §7-1)

Today `mount()`→`initReaderRuntime`→`applyColorScheme` sets the theme **synchronously** at mount, before paint. The persisted read is **async**, so the question is purely: _is the snapshot available at mount time?_ `runReader` already owns an async hide→retry→reveal machine with a never-blank safety floor — we **reuse it**, not reinvent:

- The entrypoint fires `port.load()` at `document_start`, in parallel with `injectHideStyle()`.
- The mount path consumes `port.snapshot()` (resolved value if `load()` has returned, else the `auto` default).
- **The measured decision (task, §6):** whether to gate the reader **reveal** on `load()` resolving (block — no flash, adds the round-trip only when it hasn't overlapped the browser's own layout) vs. mount with `auto` and re-apply on resolve (transition — a bounded flash, softened by a `prefers-reduced-motion`-respecting cross-fade). On the 1 MB doc the ~1 s browser layout hides the round-trip entirely (free); the typical (≤50 KB) doc is where the number is decided against the <150 ms budget. The safety floor stays the never-blank backstop in both designs.

### 1.6 The settings surface (UI)

- **Reader (both surfaces):** a minimal theme control committed as a **sibling of `.peekover-reader`** in `mount()`'s `children[]` (never inside the reading column → golden stays empty), styled like the existing mode-toggle/remote-load pills (tokens only). Cycles/selects auto/light/dark(/sepia), calls `port.save({theme})`, applies immediately via `applyTheme`.
- **App page:** a matching control in the shell header (beside the storage-toggle).

Full settings panel, fonts, widths, per-origin/doc overrides, export/import = out (spec §6). This milestone ships **theme selection + the persisted TOC state**, nothing wider.

### 1.7 TOC carry-over (spec §4 TOC criterion)

`tocView.ts` currently sets `--toc-w` and `data-toc` per-view. 004 threads the port in (via `mount()` → `buildTocView`):

- **On build:** if `snapshot().tocOpen`/`tocWidth` are non-null, apply them instead of the width-derived default (`initialTocOpen`); else keep 003's behavior.
- **On change:** `setTocOpen` (opener + backtick) calls `port.save({tocOpen})`; the resize drag's `end` calls `port.save({tocWidth})`. Injected callback, not a direct `store` import — tocView stays surface-agnostic.

### 1.8 Trust surface (spec §4)

`store.ts`: `wipeAll()` clears the new `settings` store too; `describeStored()` reads it and adds a plain-language line ("theme/display settings — stored on-device, no file contents"). `settings` joins folders/recents/pins in the "Stored data" panel and the wipe. `describeStored`/`wipeAll` already run concurrently/sequentially over the store list — extend the list.

## 2. Files to create / touch

**Create**

- `src/settings/settings.ts` — the `Settings` type, the default, the pure `resolveTheme(setting, osDark) → effective` function (jsdom-unit-testable), and the `SettingsPort` interface.
- `src/settings/settingsPort.ts` — the two port builders: `messagingPort()` (content script) and `directPort(store)` (app page), each with the cached snapshot + timeout→default fallback.
- `src/theme/themeRegistry.ts` — the themed-host `Set` + register/unregister/prune + `applyTheme(effective)` broadcast (mirrors `tocView.ts` registry). (May instead live inside a rewritten `reader.ts` — decide in tasks; keep it one module.)
- Test files per group (§5).

**Touch**

- `src/store/store.ts` — `DB_VERSION` 1→2; add `settings` store to `SCHEMA`/`STORES`; `getSettings`/`putSettings`; `wipeAll` + `describeStored` include settings.
- `src/store/idbCore.ts` — register `db.onversionchange` (close + let the memo drop) on open success (spec §7-2); optional `onblocked` orphaned-open close.
- `src/theme/reader.ts` — replace `watchColorScheme`'s `querySelectorAll` broadcast with the registry; make `initReaderRuntime` theme from the resolved setting (concrete via `resolveTheme`), register the host; OS-flip re-themes only when setting=auto.
- `src/theme/readerCss.ts` — (D-1 only) complete sepia tokens if B/C.
- `src/ui/appShell.ts` — `APP_CSS` cascade restructure (§1.4); register the shell root in the theme registry; add the header theme control; build/hold the `directPort`; thread it into the reader pane + reader.
- `src/render/readerPane.ts` — pass the port/snapshot through to `mount({contained, settings/port})`.
- `src/render/mount.ts` — `MountOptions` gains the settings snapshot + save-callback (or the port); thread to `initReaderRuntime` (theme) and `buildTocView` (TOC state); add the theme-control sibling.
- `src/render/runReader.ts` — fire `port.load()` at document_start; thread the snapshot into mount; implement the §4-measured reveal-gating decision.
- `src/render/tocView.ts` — read `tocOpen`/`tocWidth` from the snapshot on build; `save` on toggle/resize (injected callback).
- `entrypoints/background.ts` — add the `runtime.onMessage` handler for `getSettings`/`setSettings` (the second listener).
- `entrypoints/*content*` — build the `messagingPort`, fire `load()`, hand it to `runReader`.
- `PERMISSIONS.md` — update the "background = exactly one listener / no other logic" line; document the settings message channel as a zero-permission capability (like the folder ledger). Same PR (AGENTS.md #4).

## 3. Risk resolutions (spec §7 → concrete)

1. **Theme-flash** → §1.5. Fire `load()` at document_start, reuse `runReader`'s hide/reveal machine, **measure** block-vs-transition against <150 ms (task, §6). Honest fallback (transition + reduced-motion cross-fade) if no-flip is infeasible on the typical doc. Human-gate item both engines/surfaces.
2. **idbCore versionchange** → §2. First-ever `DB_VERSION` bump; add `onversionchange`→close by construction; existing data preserved (additive store). Real-engine upgrade + versionchange tests (§5).
3. **Shell/reader desync** → §1.3–1.4. Attribute cascade + one `applyTheme` writing both surfaces from one registry. Coherence proven by computed-token equality (real-engine) **and** human-gate eyeball (occlusion class).
4. **Sepia token completeness** → D-1. Escalated to a gate decision; not silently filled.
5. **First non-page idbCore consumer** → §1.2. Background gets its own memoized connection (store.ts is per-context); correct across an update _because of_ risk-2's handler. Real-engine test opens from the background context.

## 4. Risks & unknowns this plan still carries

- **MV3 service-worker cold start** is the flash variable: a sleeping background adds spin-up latency to the content-script `load()`. The §6 measurement covers **warm and cold** SW; if cold-start blows the typical-doc budget under "block," the transition fallback is taken. (Firefox event-page timing measured too.)
- **`load()` timeout value** is itself a measured choice, not guessed (bounded so a dead background can't delay never-blank).
- **Shell restructure regressions**: the `@media`→attribute cascade must not break the existing app-page auto light/dark. Red-first: assert manual-dark-in-OS-light and manual-light-in-OS-dark both resolve correctly (attribute beats media).

## 5. Test strategy

- **jsdom unit:** `resolveTheme` (setting × OS → effective); snapshot application to a host attribute; the port's cache + timeout→default fallback (with a fake messenger/store); `describeStored` line for settings. Pure logic only.
- **Real-engine (Chromium + Firefox — storage/messaging/paint are jsdom-blind):**
  - settings round-trip (write→read-back) via **both** ports (direct + messaging);
  - `DB_VERSION` 1→2 upgrade **preserves** existing folders/recents/pins; `settings` store exists;
  - **versionchange**: hold a v1 connection, open v2 → the v1 connection closes and v2 proceeds (red-first: without the handler, blocked/hang);
  - **zero-network** (Resource-Timing, non-vacuous): settings read + write + wipe fire zero http(s); a control fetch does appear;
  - theme applies on both surfaces; **coherence**: shell root and reader host compute the **same** `--paper`/`--ink` under a manual theme (red-first: fails before §1.4);
  - **staleness**: OS flip with an app-page reader open re-themes it (red-first: fails before §1.3);
  - manual theme **beats** OS on both surfaces (the §4 cascade assertions).
- **Measurement (not CI):** the **flash harness** — settings-resolved vs first-paint on ≤50 KB and 1 MB fixtures, warm + cold SW, both engines; typical-doc first-paint <150 ms not regressed vs the 003 baseline; content-script byte delta vs 284,744 B; `pnpm zip` < 2 MB.
- **Pins (every task):** `git diff tests/golden/output/` **EMPTY** (theme/settings never touch the reading-column string); `manifest.test.ts` green **unchanged** (no manifest key changes — if it needs editing, STOP: something added a permission).
- **Human milestone-close gate (the one an agent cannot self-certify):** on a fresh production build, both engines, both surfaces, Network tab open — pick each theme → applies live; reload → **persists**; the no-flip property (or its accepted fallback) on the content-script reader; OS flip re-themes only under Auto; shell + reader **coherent** (no half-themed screen — occlusion eyeball); TOC open-state/width remembered; "Stored data" shows settings + **wipe** clears them → back to Auto; sepia LOOKS right (only if D-1 ships it); zero unexpected network; document stays the hero.

## 6. Task order (dependency-sketched; tasks.md formalizes)

1. **Store foundation** — DB_VERSION bump + `settings` store + `get/putSettings` + `onversionchange` (idbCore) + `wipeAll`/`describeStored` include settings. (real-engine store/upgrade/versionchange tests)
2. **Settings port + messaging seam** — background handler; `messagingPort`/`directPort`; timeout→default fallback. (real-engine round-trip both ports; zero-network)
3. **Theme runtime + registry** — `resolveTheme`; theme host registry (both surfaces); `watchColorScheme` fix (auto-only, re-theme all registered); shell `APP_CSS` attribute cascade. (red-first coherence + staleness; cascade assertions)
4. **Flash measurement → mitigation decision** — measure §1.5; adopt block or transition; implement the chosen reveal-gating in `runReader` (+ reduced-motion cross-fade if transition). (measurement, then the minimal runReader change)
5. **Settings UI** — theme control on both surfaces (reader sibling + shell header), wired to the port.
6. **TOC carry-over** — apply persisted `tocOpen`/`tocWidth` on build; persist on toggle/resize.
7. **Sepia** — per D-1: (A) drop + amend spec §3.5; or (B/C) complete/derive palette + activate. Human/design gate; sepia LOOK is human-gate-only.
8. **Perf/bytes/pins/docs + close** — re-measure bytes + typical first-paint; confirm golden EMPTY + manifest pin green every task; PERMISSIONS.md update; memory files.
9. **Human milestone-close gate** (§5) — the acceptance an agent cannot self-certify.

---

_Gate: on approval of this plan, tasks.md (the ORDER) is drafted — numbered, dependency-ordered, each with its own verification line — for a separate human gate before any implementation code (WORKFLOW.md §5.3). D-1 must be settled first; D-2 is settled by task 4's measurement._

# Tasks 002 — check off, add discovered tasks BELOW the line they came from
*Gear 3 tasks stage. Approved plan: `plan.md`. CC commits per task; human reviews + pushes.*
*Each capability task carries its own real-engine test (not a trailing "add tests" task). Real-engine*
*tests are `tests/browser/*`, run on both Chromium + Firefox, **red-first + non-vacuous** (retro rule).*
*Module list + manifest delta approved at the tasks gate (see plan.md §Files/modules, §Task 0).*

## 1 — App-page shell + M1-pipeline reader integration
- [ ] 1.1 Manifest delta + entry wiring (trust gate FIRST). Add `action: { default_title }` (NO
      default_popup) + bundled `entrypoints/app/index.html` + `entrypoints/app/main.ts` bootstrap;
      `entrypoints/background.ts` gains `action.onClicked` → `tabs.create(runtime.getURL('app.html'))`.
      Verify: `manifest.test.ts` asserts the GENERATED manifest (both builds) still `permissions:[]`,
      no `host_permissions`/`web_accessible_resources`/`webRequest`/`tabs`; `action` is the only add.
      (Re-proven at plan time — this task pins it in CI.)  [§9 built-manifest]
- [ ] 1.2 `appShell` + `readerPane`: page layout (header · folder pane · reader pane); a selected
      file's text renders through the **unchanged** `mount(text, host)` (M1 pipeline as a library).
      Designed empty/error/never-blank states (no source, unreadable file, empty folder → designed
      state, never a blank/hang — AGENTS.md #5). Tests: `readerPane.test.ts` (jsdom — selection →
      mount host appears), `appShell.test.ts` (jsdom — empty/error states render).  [§9 select-file-
      renders; §9 cancel/deny/empty designed state (jsdom half; real cancel/deny → 6.3 gate)]

## 2 — IndexedDB layer + trust controls
- [ ] 2.1 `idbCore` + `store` + pure `recents`. DB `peekover` v1, stores `folders`/`recents`/`pins`
      (schema per plan §IndexedDB). `idbCore` = tiny promisified raw wrapper (open/get/getAll/put/
      delete/clear) — NO `idb` dependency; if it sprouts real edge-case complexity, STOP + flag.
      `recents.ts` pure: dedup/cap/order + pin add/remove/order. Test: `recents.test.ts` (unit, pure).
- [ ] 2.2 Trust controls: "wipe all data" (`wipeAll()` clears all three stores) + "what's stored"
      view (`describeStored()` → plain-language list; no hidden state). Real-engine test:
      `tests/browser/wipe.browser.test.ts` (both engines) — populate stores, wipe, read back ZERO
      Peekover records; red-first (FAILS vs a no-op wipe), non-vacuous.  [§9 wipe-all]

## 3 — Chromium folder open + bounded markdown-walk + tree + name-filter + grant
- [ ] 3.1 `walkPolicy` (pure): markdown-extension filter (shared ext set) · skip-list
      (`node_modules`/`.git`/dotdirs) · file-count/depth CAP · cancel/interrupt token. Tests:
      `walkPolicy.test.ts` (unit) — skips non-markdown early, skips the skip-list, honors the cap,
      cancels cleanly. This is the pure seam for the bounded/filtered/interruptible requirement.
- [ ] 3.2 `chromiumFolderSource` + `folderSource` seam + `capability` grant flow. Picker grant (one
      gesture) → **eager, markdown-filtered, bounded, interruptible** walk (via 3.1) → `MarkdownFile[]`
      + handle, converging on the shared `FolderSource` interface. One plain-language line BEFORE the
      picker; persistent "granted: `folder` — revoke" chip; revoke drops handle + record. **Acceptance
      (hard requirements, not afterthoughts):** a pathological folder (huge tree / symlink loop / all
      non-markdown) MUST NOT hang or blank — it hits the cap/cancel path and renders a designed
      **"still scanning… / folder too large"** state (AGENTS.md #5). Real-engine test:
      `tests/browser/folderGrant.browser.test.ts` (Chromium) — grant→handle→walk→tree→render exercised
      against a **real OPFS `FileSystemDirectoryHandle`** populated in-test (native chooser stubbed at
      the engine boundary; only the OS dialog is stubbed, the handle/read path is real); red-first +
      non-vacuous (FAILS if the handle→read path is short-circuited).  [§9 open→line→picker→tree; §9
      picker grant flow]
- [ ] 3.3 `tree` (pure) + `treeView` (DOM). Pure tree build from flat `MarkdownFile[]` + name filter;
      `treeView` renders tree + search box, keyboard-operable, a11y landmarks/roles, and surfaces the
      3.2 scanning/too-large state. Tests: `tree.test.ts` (unit — build + filter narrows by name),
      `treeView.test.ts` (jsdom — render + keyboard nav).  [§9 tree filter narrows by name]
- [ ] 3.4 Zero-network guard (extends `remoteMedia.browser.test.ts` bytes-on-wire discipline) →
      `tests/browser/folderMode.network.browser.test.ts` (both engines): open folder + walk + render a
      local file + `store` put = **zero network requests** (assert on Resource Timing, per the M1
      discipline); remote media inside an opened file stays blocked pre-opt-in. Red-first (FAILS if a
      real `<img>`/fetch fires), non-vacuous.  [§9 zero-network guard]

## 4 — Firefox read-only fallback
- [ ] 4.1 `firefoxFolderSource` + feature-detect. `'showDirectoryPicker' in window` false (Firefox,
      or a picker-disabled Chromium — Brave/flag-gated, SAME path, no special-case) → `<input
      webkitdirectory>` + drag `webkitGetAsEntry()` recurse → `MarkdownFile[]`, `persistable:false`,
      no handle; converge on the shared `FolderSource → MarkdownFile[]` interface. `appShell` renders
      the honest "read-only snapshot — no live handle/persistence/reopen-without-re-pick; a Firefox
      platform limitation, not a Peekover choice" note. Tests: `folderSource.test.ts` (unit — branch
      selection), `tests/browser/firefoxFallback.browser.test.ts` (real Firefox — reads + renders a
      folder's markdown, stores NO handle); red-first + non-vacuous.  [§9 feature-detect→fallback+note;
      §9 Firefox fallback]

## 5 — Recents + pins + handle persistence + re-prompt (one-gesture reopen)
- [ ] 5.1 Persist granted handle + rehydrate + **one-gesture re-grant**. On grant, `store` puts the
      structured-cloneable handle; next session `getAll('folders')` rehydrates; **re-opening a recent/
      pinned folder is ONE click** → `requestPermission()` on that gesture → walk + render. Recents/
      pins laid out so that single click IS the whole interaction (re-ask-on-use is the DEFAULT
      narrative + a trust feature; never request persistence silently, never nudge). Real-engine test:
      `tests/browser/handlePersist.browser.test.ts` (Chromium) — handle written to IndexedDB, page
      reloaded, read back **structured-clone-intact** (`isSameEntry`); + the permission MECHANISM
      (query→request→gate) driven via a controllable/OPFS handle; red-first + non-vacuous.
      **Acceptance carries the test-honesty split VERBATIM (decision 4):** the automated test proves
      our **query→request→gate mechanism** via an OPFS/controllable-permission handle; the actual disk
      **`prompt`-after-reload / `NotAllowedError`** re-prompt ground truth is **NOT automatable** (OPFS
      always reports `granted`) and is verified at the **human gate (6.3) + platform docs** — **no stub
      may masquerade as platform proof.**  [§9 handle persistence across reload; §9 permission re-prompt]
- [ ] 5.2 Recents + pins surfaced on the app page; reopen behavior per engine. Chromium: reopen runs
      the 5.1 one-gesture re-grant. Firefox: a recent/pinned entry that cannot silently rehydrate shows
      a one-gesture **"pick this folder again"** re-pick affordance with a plain reason (metadata stored
      for display only). Tests: covered by `recents.test.ts` (2.1, list logic) + reopen paths under
      5.1/4.1; jsdom for the list/affordance render.  [§9 recents & pins list + reopen]

## 6 — Trust doc + measurement + close
- [ ] 6.1 `docs/trust/PERMISSIONS.md` → capability ledger (same work, AGENTS.md #4). Evolve the
      manifest-line ledger into a capability ledger (spec §7 table: capability · never-silent trigger ·
      what it can touch · storage · revoke). State plainly: folder access is a user-gesture web API →
      appears in no manifest permission list, no install-time warning → which is WHY the at-use/visible/
      revocable/re-prompted flow is the real consent. Extend the zero-network evidence section to
      "opening/walking/persisting a folder issues no network request." Verify: `permissions:[]` line
      re-stated against the built manifest.  [§9 PERMISSIONS.md capability-ledger]
- [ ] 6.2 `scripts/perf-folder-tree.ts` — MEASUREMENT, not a threshold (retro rule: no un-measured
      gate). Drives the built app page over a **realistic nested repo shape** (a real docs folder —
      many dirs, mixed file types, deep nesting; NOT a synthetic flat list, or the number won't predict
      the vibe-coder's "open my project" experience). Measures (a) tree build/render to first
      interactive tree, (b) reopen latency from a persisted handle. Record numbers honestly in
      progress.md; assert NO threshold now — a gate is set from the measurement later. Note whether the
      number argues for the **carried-M1 chunked/virtualized-render lever** (a post-measurement
      decision, separate seam from the eager walk).  [§9 perf measured + recorded]
- [ ] 6.3 Milestone-close human gate (NAMED, required — not removable by adding jsdom tests). Chrome +
      Firefox, current build, **Network tab open**: open app page → open folder (Chromium) / snapshot
      (Firefox) → browse tree → search → open files → pin → reload → reopen via re-prompt → wipe-all.
      Confirm **zero unexpected network**, no console errors, and every degraded/empty state renders.
      This gate caught both M1 shipping bugs; it is load-bearing for capability/storage/engine-timing
      and is where the disk re-prompt ground truth (5.1) is confirmed.  [§9 human manual gate]
- [ ] 6.4 Advance memory (ONLY at tasks-complete boundary, per per-group discipline). progress.md
      Now-pointer → M2 state; append a `decisions.md` entry for any architecture 002 settles (dedicated
      app page + action entry; FolderSource seam; raw-IndexedDB store; eager bounded walk; test-honesty
      split); run /retro. Verify: `pnpm lint` + `pnpm test` + `pnpm test:browser` green; `pnpm zip`
      under the size budget, both engines.

---
*Discovered tasks go BELOW the line they came from (M1 convention). Carried-M1 levers that may surface
here: chunked/virtualized render (large-folder tree — decide from 6.2 measurement); GFM table-alignment
restore (unrelated to 002 — leave to its own work).*

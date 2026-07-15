# 002 Active-source foundation — plan (Gear 3: the HOW)
<!-- Written after spec.md was approved at the spec gate. Human-reviewed before tasks. -->
**Status:** draft — awaiting plan-gate approval  **Date:** 2026-07-15

Two spec-gate nuance rulings are folded in as fixed constraints (do not re-litigate):
- **Re-ask-on-use is the DEFAULT narrative and a trust feature.** Honor the browser's "Allow on
  every visit" if the user picks it; never request persistence silently, never nudge toward it.
  Hard requirement designed for below: **re-opening a recent/pinned folder is ONE gesture.**
- **"Full folder mode is Chromium" means "Chromium with the picker enabled."** The feature-detect
  branch absorbs Brave/flag-gated picker-absent cases into the same read-only path as Firefox. **No
  Brave special-casing.**

---

## Task 0 — platform re-verification (DONE — gating; result drives §5, §6)

Re-verified the spec's load-bearing claim against **current Chromium** with a throwaway bundled
extension page driven by the existing Playwright harness (probe built, run, deleted; tree clean):

| Context | `showDirectoryPicker` | `requestPermission()` | Verdict |
|---|---|---|---|
| **MV3 service worker** | `undefined`, `window` absent | n/a | **Cannot run** — confirmed |
| **Full-tab extension page** | `function`, secure context | live, resolves | **Works** — confirmed |

On the full-tab `chrome-extension://…/probe.html` page, **headed**: a call **without** a gesture
rejected `SecurityError: Must be handling a user gesture` (the real implementation is reached), and a
call **under a trusted click** got past the gesture gate and **the native OS folder dialog actually
opened**. `requestPermission()` (exercised via a real OPFS `FileSystemDirectoryHandle`) ran and
resolved in the page context. **Building manifest proof:** adding the bundled page produced a
611-byte manifest that still declares `permissions: []` — no permission, no `web_accessible_resources`
needed (the extension opens its own page by URL).

**No deviation from the spec's cited claim** (WICG #314 / Chromium #40240444). The
dedicated-full-tab-page decision (spec §3) stands on current reality, not a stale thread.

**Popup rationale — corroborated, not independently re-reproduced (flagged honestly).** The action
popup's `AbortError` comes from the popup window losing focus/closing when the native dialog opens —
a teardown that is not cleanly drivable in Playwright/headless. Live-source re-check (2026-07-15)
confirms current Chrome still `AbortError`s from the popup. So "page not popup" rests on (a) the
proven page-works result, (b) the proven SW-cannot result, and (c) the re-confirmed popup bug — the
one leg we assert from sources rather than our own probe. This does not change the architecture.

**The one consequence Task 0 forces on the plan (§5):** headless engines **cannot render the native
chooser** — `showDirectoryPicker()` always `AbortError`s headlessly, and a real *disk* handle cannot
be obtained or re-prompted headlessly. Real-engine tests therefore use a **real OPFS
`FileSystemDirectoryHandle`** (populated in-test) as the grant stand-in — same engine, real handle,
real read/persist/clone path, only the native chooser stubbed. OPFS handles always report
permission `granted`, so the **disk `prompt`-after-reload / `NotAllowedError`** ground truth is NOT
automatable; it is verified at the **human manual gate** + platform docs, while the automated test
proves our *mechanism* (query→request→gate) via a permission-controllable handle. We do not let a
stub masquerade as platform proof (retro standing rule).

---

## Architecture & data flow

The **M1 render pipeline is reused unchanged as a library.** Its single entry is
`mount(source: string, host: HTMLElement)` (`src/render/mount.ts`) — markdown text in, sanitized
themed reader (media-policy applied, never-blank fallback) into `host`'s shadow root. **Nothing in
`src/render/*`, `src/theme/*`, or the M1 content script changes.** The app page is a new *caller*.

Data flow, top to bottom, engine-agnostic above one seam:

```
toolbar action ─(background onClicked)→ tabs.create(app.html)         [entry]
  app page shell  ── header · folder pane · reader pane               [entrypoints/app]
    openFolder()  ── feature-detect ─┬─ Chromium: showDirectoryPicker → walk
                                     └─ Firefox : <input webkitdirectory> / webkitGetAsEntry
         ▼ both converge on ▼
    FolderSource → MarkdownFile[]     ── { path, name, read():Promise<string>, + capability meta }
    tree(model)  ── pure: build tree + name filter  ─→ treeView (DOM, keyboard, search)
    select file  ── readerPane.read() → mount(text, hostEl)           [M1 pipeline, unchanged]
    store        ── IndexedDB: folders(handle) · recents · pins · wipe · list   [Chromium persists handle;
                                                                                 Firefox stores metadata only]
```

**The seam** is `FolderSource → MarkdownFile[]`. Everything above it (tree, filter, reader pane,
recents/pins UI) is engine-agnostic; the only engine-specific code is the two `FolderSource`
implementations and the IndexedDB handle-persist path (Chromium-only). Firefox's read-only-snapshot
limits (no handle, no persistence, no silent reopen) are represented in the seam's **capability
meta** (`persistable: boolean`), not bolted on downstream.

---

## Files/modules to create or touch

New page entrypoint (WXT bundled page — Task-0-verified to add zero permission):

| Path | Responsibility | Kind |
|---|---|---|
| `entrypoints/app/index.html` | Bundled `app.html` shell markup; `<script type="module" src="./main.ts">` (extension-page CSP forbids inline). | static |
| `entrypoints/app/main.ts` | Bootstrap: bind `mountApp(document)` on load. Side-effects only (mirrors the content entrypoint calling `runReader()`). | DOM/entry |

New source modules (small, M1-style pure/DOM split — pure logic separable from engine, as
`runReader`/`mountReader` were):

| Path | Responsibility | In → Out | Kind |
|---|---|---|---|
| `src/app/appShell.ts` | Build header + folder pane + reader pane; wire selection → reader; own empty/error states (never-blank). | `document` → mounted shell | DOM |
| `src/app/folderSource.ts` | `FolderSource` interface + `openFolder()` feature-detect entry (`'showDirectoryPicker' in window`) selecting an impl; defines `MarkdownFile` + capability meta. | user gesture → `FolderSource` | engine (thin) |
| `src/app/chromiumFolderSource.ts` | `showDirectoryPicker()` grant → recursive markdown walk → `MarkdownFile[]`; carries the persistable handle. | gesture → files+handle | engine |
| `src/app/firefoxFolderSource.ts` | `<input webkitdirectory>` + drag `webkitGetAsEntry()` recurse → `MarkdownFile[]`, `persistable:false`. | input/drop → files | engine |
| `src/app/tree.ts` | **Pure:** build a nested tree model from a flat `MarkdownFile[]`; name search/filter over it. | files, query → tree/filtered | **pure** |
| `src/app/treeView.ts` | Render the tree model + search box; keyboard nav; a11y landmarks/roles. | tree model → DOM | DOM |
| `src/app/readerPane.ts` | Selected file → `read()` → `mount(text, hostEl)`; degrade empty/unreadable to a designed state. | `MarkdownFile` → rendered pane | DOM/engine glue |
| `src/app/capability.ts` | **Pure-ish:** at-use grant state machine (idle → prompt-line → granted:`name` → revoked); revoke drops handle + record. Chip rendering reads this. | events → state | pure state + DOM chip |
| `src/app/store.ts` | IndexedDB layer: put/get/list handles·recents·pins; `wipeAll()`; `describeStored()` for the transparency view. | records ⇄ IndexedDB | engine |
| `src/app/idbCore.ts` | ~40-line promisified raw-IndexedDB helper (open, get, getAll, put, delete, clear). No new dependency. | — | engine |
| `src/app/recents.ts` | **Pure:** bounded recents (dedup, cap, order) + pin add/remove/order over records. `store` persists what this computes. | records, op → records | **pure** |

Docs touched in the same work: `docs/trust/PERMISSIONS.md` (→ capability ledger, §7), and the
end-ritual memory files.

---

## Libraries & why

- **No new runtime dependency.** IndexedDB via a **tiny local raw wrapper** (`idbCore.ts`), not the
  `idb` package. Rationale: the surface we touch (three stores, get/getAll/put/delete/clear) is
  small; ~40 lines of promisified `IDBRequest` covers it; the M1 posture is locked-minimal
  dependencies, and any dependency add needs explicit human approval (WORKFLOW.md §8.2). *Plan-gate
  option:* if the human prefers `idb` (~1.5 KB, ergonomic, well-audited) it is a reasonable approve —
  flagged, not taken unilaterally.
- **No `fake-indexeddb`.** Storage persistence/wipe/handle-clone are jsdom-blind → they run in the
  real-engine browser project against the engine's own IndexedDB. The **pure** list logic
  (`recents.ts`, `tree.ts`) is unit-tested as pure functions with no IndexedDB at all. So no test
  dependency is needed either.
- **Reused:** `markdown-it` / `DOMPurify` etc. only transitively, through the unchanged `mount()`.
  The app page adds no parser/sanitizer surface.

---

## The Chromium-vs-Firefox seam

One feature-detect, `'showDirectoryPicker' in window`, lives in **`folderSource.openFolder()`** and
nowhere else. It returns a `FolderSource` whose shape is identical across engines:

```
interface MarkdownFile { path: string; name: string; read(): Promise<string>; }
interface FolderSource {
  name: string;                     // display name of the opened folder
  files: MarkdownFile[];            // eager markdown walk (see open-question 1)
  persistable: boolean;             // Chromium true (+ handle), Firefox false
  handle?: FileSystemDirectoryHandle;   // present iff persistable
}
```

- **Chromium (`chromiumFolderSource`):** `showDirectoryPicker()` (one gesture) → recurse the
  directory handle, collecting markdown files (M1's extension set) → `MarkdownFile.read()` =
  `getFileHandle → getFile → text()`. `persistable:true`, `handle` set. Brave/flag-gated =
  picker absent → the feature-detect already routes to the Firefox path (no special case).
- **Firefox (`firefoxFolderSource`):** `<input type="file" webkitdirectory>` and/or a folder drop via
  `DataTransferItem.webkitGetAsEntry()` (loop `readEntries()`; the 100/call cap is Chromium's, but we
  loop regardless) → `MarkdownFile.read()` = `File.text()` on the snapshot `File`. `persistable:false`,
  no `handle`.

Because the read-only-snapshot limits are encoded as `persistable:false` at the seam, the tree,
reader, and recents/pins code branch on that boolean honestly rather than sniffing the engine again.
The **honesty note** ("Firefox gives a point-in-time, read-only snapshot — no live handle, no
persistence, no reopen-without-re-pick; a Firefox platform limitation, not a Peekover choice") is
rendered by `appShell` whenever `persistable` is false — mirroring M1's never-blank honesty posture.

---

## IndexedDB layer

One database `peekover`, version 1, three object stores (introduced **with** its trust controls — §5):

| Store | keyPath | Record | Written by |
|---|---|---|---|
| `folders` | `id` (`crypto.randomUUID()`) | `{ id, name, handle: FileSystemDirectoryHandle, addedAt, lastOpenedAt }` | **Chromium only** — the persistable handle (a capability ref, not file contents) |
| `recents` | `id` | `{ id, folderId, path, name, openedAt }` — bounded list | both (Firefox: `folderId` → a metadata-only folder row) |
| `pins` | `id` | `{ id, kind:'file'\|'folder', folderId, path, name, pinnedAt }` | both |

- **Persist + rehydrate + re-prompt (Chromium):** on grant, `put` the structured-cloneable handle.
  Next session, `getAll('folders')` → rehydrated handles report permission `prompt`; **re-opening a
  recent/pinned folder is ONE gesture** → `handle.requestPermission({mode:'read'})` on that click →
  `granted` → walk + render. This is the settled persistence narrative made concrete: the single
  click IS the re-grant; recents/pins are laid out so that click is the whole interaction (no
  intermediate "reconnect" chore). A pre-grant read rejects `NotAllowedError` (spec §4) — surfaced as
  the re-ask affordance, never a dead end.
- **Firefox:** `folders` holds no handle; a recent/pinned entry stores name/metadata for display, and
  selecting it **re-opens the picker/input** ("Pick this folder again to reopen — Firefox can't
  remember folder access") — one gesture, honest (open-question 4).
- **`wipeAll()`** clears all three stores (satisfies spec §6.17 for the data 002 introduces) and drops
  remembered folders. **`describeStored()`** reads all three into the plain-language "what's stored"
  view. No hidden state.
- **Zero-network tie:** a `put` of a handle is structured clone, not a fetch. Asserted by the
  bytes-on-wire guard (§5) — open + walk + persist + render issues zero requests.

---

## Test strategy

Per the M1 retro standing rules: jsdom-blind flows (picker grant, permission, persistence-across-
reload, wipe, Firefox fallback, bytes-on-wire) are **real-engine** (`tests/browser/`, both instances,
red-first, non-vacuous); DOM-shaped logic (tree build/filter, empty/error states, list logic) is
**jsdom/unit**. The shared browser project runs each `tests/browser/*` file on **both** Chromium and
Firefox; engine-specific tests **feature-detect and assert the right branch** (skip/guard) so running
on the "wrong" engine is not a false failure.

**Every spec §9 acceptance item → a planned test file + level:**

| Spec §9 item | Test file | Level | Why here |
|---|---|---|---|
| Open→plain-line→picker→searchable tree | `folderGrant.browser.test.ts` (grant+render) · `tree.test.ts` (tree build) | browser (Chromium) + unit | picker is engine; tree-from-files is pure |
| Tree filter narrows by name | `tree.test.ts` | unit (pure) | DOM-shaped/pure logic |
| Select file → renders via **unchanged M1 mount** | `readerPane.test.ts` | jsdom | DOM shape; `mount()` itself is M1-tested |
| Cancel / deny / empty → designed state (never-blank) | `appShell.test.ts` (state render) · covered live at human gate | jsdom + gate | state rendering is DOM-shaped; real cancel/deny at gate |
| `'showDirectoryPicker' in window` false → Firefox fallback + honest note | `folderSource.test.ts` (branch) · `firefoxFallback.browser.test.ts` | unit + browser (Firefox) | branch selection is pure; real read is engine |
| Recents & pins list + reopen | `recents.test.ts` (list logic) · `handlePersist.browser.test.ts` (reopen) | unit + browser | list logic pure; reopen is engine |
| **Zero-network guard** (open·walk·persist·render = 0 requests; remote media stays blocked) | `folderMode.network.browser.test.ts` | browser (both) | extends `remoteMedia.browser.test.ts` Resource-Timing discipline |
| **Picker grant flow** (grant→handle→read→tree) | `folderGrant.browser.test.ts` | browser (Chromium) | **OPFS handle stand-in**, native chooser stubbed (Task 0) |
| **Handle persistence across reload** (structured-clone-intact) | `handlePersist.browser.test.ts` | browser (Chromium) | real IndexedDB + real handle; `isSameEntry` after reload |
| **Permission re-prompt** (`prompt` state · `NotAllowedError`) | `handlePersist.browser.test.ts` (mechanism) **+ human gate** (disk ground truth) | browser + gate | Task-0 split: OPFS can't show `prompt`; automated proves query→request→gate, gate proves disk re-prompt |
| **Wipe-all** (stores hold zero records after) | `wipe.browser.test.ts` | browser (both) | real IndexedDB read-back |
| **Firefox fallback** (reads+renders markdown, stores no handle) | `firefoxFallback.browser.test.ts` | browser (Firefox) | real Gecko `webkitdirectory`/`webkitGetAsEntry` |
| Built manifest still `permissions: []` (+ no `host_permissions`/`webRequest`/`tabs`) | `manifest.test.ts` (assert generated manifest, both builds) | unit over build output | trust gate, as M1 proved at build |
| `PERMISSIONS.md` → capability ledger (same PR) | doc review at close (AGENTS.md #4) | gate | documentation deliverable |
| Perf numbers measured + recorded | `scripts/perf-folder-tree.ts` (see below) | measured, not asserted | no un-measured threshold (retro) |
| **Human manual gate** (Chrome+Firefox, Network tab: open→browse→search→open→pin→reload→re-prompt→wipe; zero unexpected network, no console errors, every degraded state renders) | milestone-close human pass | **named required gate** | caught both M1 shipping bugs; load-bearing for capability/storage/timing |

**Red-first, non-vacuous** applies to every browser test (as `remoteMedia` was proven RED with 3
leaked requests first): the zero-network guard must be shown to FAIL if a real `<img>` or a stray
fetch fires; the wipe test must FAIL against a no-op wipe; the grant test must FAIL if the handle→read
path is short-circuited.

---

## Performance measurement plan (NOT a threshold)

A harness modeled on `scripts/perf-first-paint.ts` — **`scripts/perf-folder-tree.ts`** — drives the
built extension's app page in headless Chromium over an **OPFS-populated synthetic folder** (so it is
deterministic and headless-safe, per Task 0), sweeping file counts (e.g. 100 / 1k / 5k) and measuring:
(a) **tree build + render** time to first interactive tree; (b) **reopen latency** from a persisted
handle (rehydrate → `requestPermission` (granted via OPFS) → walk → first-file render). Numbers are
**measured, recorded honestly, and a gate is set from the measurement — later, not in this plan** (M1
retro: any bar written before measurement is a bug).

**Flagged lever (decide from measurement, do not assert):** the pure `tree.ts` build is cheap; the
suspect is `treeView` laying out thousands of DOM nodes — the same cost class as M1's ~750 ms to lay
out the reader's own large DOM. The **chunked/virtualized render lever carried from M1** likely
applies to the large-folder tree. Whether 002 needs it is a **measurement-driven decision**, taken at
task time, not a claim made now.

---

## PERMISSIONS.md — capability-ledger rewrite (deliverable in this work, AGENTS.md #4)

The M1 doc evolves from a **manifest-line ledger** into a **capability ledger** (spec §7): a table of
each capability (Chromium folder read · Firefox snapshot), its never-silent trigger, what it can
touch, what it stores, and how to revoke — landing in the **same PR** as the code. It must state
plainly that folder access is a **user-gesture web API, so it appears in no manifest permission list
and shows no install-time warning** — which is *why* the at-use, visible, revocable, re-prompted flow
is the real consent mechanism. The existing zero-network evidence section extends to "opening/walking/
persisting a folder issues no network request." The built-manifest `permissions: []` line is
re-proven, not assumed (Task 0 already showed the bundled page keeps it empty).

---

## Open questions (spec §11) — resolved

1. **Tree data source: eager walk vs lazy expansion → EAGER full-folder markdown walk for 002.**
   Name search/filter over the tree *requires* the full file set (you cannot filter what you have not
   enumerated), and eager keeps the seam a simple `MarkdownFile[]`. The cost on huge folders is
   exactly what the perf harness measures; if measurement says it hurts, the follow-up lever is lazy
   per-directory expansion + virtualized render — a **measurement-driven** change, not guessed now.
   (Decided: eager. Deferred to measurement: render virtualization.)
2. **Single vs multiple remembered folders → a small SET (multi-record `folders` store), minimal UX.**
   Recents/pins inherently span folders, and the settled one-gesture-reopen requirement breaks under a
   single-last-folder model. 002 persists each granted folder as a remembered entry so recents/pins
   can one-click re-grant; it does **not** build multi-folder *project* semantics (deferred).
3. **Toolbar action entry / `tabs` permission → action with NO `default_popup`; background
   `action.onClicked` → `tabs.create({ url: runtime.getURL('app.html') })`. Adds no permission.**
   `action` is a manifest key, not a `permissions` entry; `tabs.create` does not require the `tabs`
   permission (only reading privileged tab fields does); the page needs no `web_accessible_resources`
   (the extension opens its own URL). Re-proven by `manifest.test.ts` (`permissions: []` survives).
4. **Firefox recents semantics → re-pick prompt, not greyed-out.** A recent/pinned entry that cannot
   silently rehydrate shows a one-gesture "pick this folder again" affordance with a plain reason;
   metadata is stored for display only. Honest and single-gesture, consistent with the persistence
   narrative.

*Nothing here required building to resolve. No question is deferred to a task as unresolved.*

---

## Sequencing (each layer founds the next; the real-engine test lands WITH its capability)

1. **App-page shell + M1 pipeline integration.** `entrypoints/app` + `appShell` + `readerPane`;
   background `action.onClicked` opens the tab; prove the seam by rendering a file through unchanged
   `mount()`. **Lands with it:** `manifest.test.ts` (`permissions: []` survives — trust gate first) +
   empty/error state tests (`appShell.test.ts`).
2. **IndexedDB layer + trust controls.** `idbCore` + `store` + pure `recents`; "what's stored" view;
   "wipe all data". **Lands with it:** `wipe.browser.test.ts` + the store side of
   `folderMode.network.browser.test.ts` (persist = zero network), red-first.
3. **Chromium folder open + tree + grant.** `chromiumFolderSource` + pure `tree` + `treeView` +
   `capability` grant/revoke chip. **Lands with it:** `folderGrant.browser.test.ts` (OPFS stand-in) +
   the open/walk/render side of the zero-network guard + `tree.test.ts` (filter).
4. **Handle persistence + re-prompt + recents/pins reopen.** Persist granted handle; rehydrate +
   one-gesture re-grant; recents/pins reopen. **Lands with it:** `handlePersist.browser.test.ts`
   (structured-clone + mechanism); the disk `prompt`/`NotAllowedError` ground truth goes to the human
   gate (Task-0 split).
5. **Firefox fallback.** `firefoxFolderSource` + honest snapshot note + Firefox recents (re-pick).
   **Lands with it:** `firefoxFallback.browser.test.ts` (real Gecko).
6. **Close: PERMISSIONS.md capability ledger + perf measurement + human gate.** Rewrite the doc (same
   work); run `scripts/perf-folder-tree.ts`, record numbers; the named milestone-close human manual
   pass (Chrome + Firefox, Network tab) — the gate that caught both M1 bugs.

---

## For the human to confirm at the plan gate (the how-decisions I made)

1. **Raw IndexedDB + `idbCore` local wrapper** vs adding the `idb` dependency (needs approval).
   Recommend raw (locked-minimal posture); easy to switch.
2. **Eager full-folder walk** as 002's tree data source (render virtualization deferred to
   measurement). Confirm the eager default.
3. **Module shape** — ~11 new `src/app/*` modules with the pure/DOM/engine split above. Confirm the
   decomposition (naming/count) before tasks.md fixes it.
4. **The test-honesty split** — the disk `prompt`/`NotAllowedError` re-prompt is verified at the
   **human gate + platform docs**, while the automated real-engine test proves our query→request→gate
   *mechanism* via an OPFS/permission-controllable handle. Confirm we are explicitly NOT claiming an
   automated proof of the disk re-prompt (this is the retro-honest reading of Task 0).

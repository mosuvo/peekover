# Spec 002 — Active-source foundation (second surface + folder mode)
*Gear 3 (spec+plan+tasks). Owner: mosuvo. Status: DRAFT — awaiting human approval (spec gate only; no plan/tasks yet).*
*Research base: live-docs + competitor re-check 2026-07-15 (MDN, caniuse, Chrome docs, mozilla/standards-positions, MarkView, simov). Citations in §12.*

## Goal
Give Peekover an **active surface** — an extension-owned app page — from which a user can, in one
gesture, **open a local folder** and read the markdown inside it: a tree view with name search/filter,
a recent-documents list, and pinned files/folders. This is the *foundation* every future active
capability (paste scratchpad, editor, watch/diff) will stand on, so it ships tight and correct in
isolation: the capability is opt-in and at-use, everything it stores is transparent and wipeable, and
the whole thing adds **no new manifest permission** (verified — §4). The M1 reader renders each opened
file unchanged. Chromium gets full folder mode; Firefox gets an honest, documented degraded path.

Nothing else. This spec deliberately builds the *precedent* for how capabilities are requested,
stored, revoked, and audited — not the full folder feature set.

---

## Context — two surfaces, and why this one is new

M1 shipped Peekover's **passive surface**: a content script that the browser injects into a page the
user *already navigated to* (a `file://` `.md` or a raw-host URL). It reacts; it never initiates. It
carries no UI chrome of its own beyond the reader, holds no state across page loads, and — critically
— **there is no page for it to attach folder mode to.** `showDirectoryPicker()` needs a document with
a user gesture and a place to render a tree; a content script that only exists on already-opened files
cannot host "open a folder that isn't open yet."

So M2 introduces the **active surface**: an extension-owned app page (a `chrome-extension://…` document
in its own tab) that the user opens deliberately and that *initiates* work — pick a folder, browse it,
reopen recents. This same page is the future home of the paste-scratchpad, the editor, and watch/diff
(F4/F6/F8), so it is the **application shell**, not folder-specific overhead.

**The M1 content script is UNCHANGED by this spec.** The two surfaces never overlap: the passive
content script runs only on matched file/raw-host pages and renders one navigated document; the active
app page runs only when the user opens it and never touches host pages. They share the render pipeline
(`src/render/*`) as a library, nothing more. No `matches` pattern, `run_at`, or entrypoint of the M1
content script changes here.

---

## In scope
- **The active surface** — a dedicated extension app page (bundled `chrome-extension://…/app.html`,
  opened in a full tab), reachable from the toolbar action. The application shell: header, a folder
  pane, and a reader pane that mounts the **existing M1 render pipeline** per selected file.
- **Folder open (Chromium)** — a user-gesture `showDirectoryPicker()` grant → build a **tree view**
  of the folder's markdown files → **name search / filter** over the tree → click a file → render it
  in the reader pane via the M1 pipeline.
- **The at-use capability + trust machinery** — the grant is opt-in, triggered by an explicit click,
  explained in one plain-language line before the picker opens, reflected in a persistent
  "what's granted right now" affordance, and revocable. This is the *precedent* the spec is really
  about; it must be correct before it is convenient.
- **Storage (IndexedDB) — introduced here** — persist the granted directory handle (for reopen),
  the recent-documents list, and pinned files/folders. IndexedDB is introduced *with* its own trust
  controls in the same milestone (see §5): a **"wipe all data"** control and a **"what's stored"**
  transparency view ship alongside the first thing that stores anything.
- **Recent + pinned** — recently opened files/folders, and user-pinned files/folders, surfaced on the
  app page; reopening a persisted handle runs the **re-prompt-on-use** flow (§4) as a feature.
- **Firefox degraded path** — feature-detect (`'showDirectoryPicker' in window`) and branch to a
  documented read-only fallback (`<input webkitdirectory>` and/or drag-a-folder via
  `webkitGetAsEntry`), with the degradation stated honestly in-product, mirroring how F8 already
  handles the write-fallback asymmetry.
- **PERMISSIONS.md evolution** — from "requests no permissions" into a **capability ledger** (§7):
  each capability, its trigger, what it can touch, how to revoke — landing in the same PR as the code.

## Out of scope (resist — and these are named as *deferred to later specs*, not designed here)
- **Project mode / relative-link navigation** (spec §F5 "Project mode") — relative links resolving and
  navigating in place, breadcrumbs, back/forward history. **Deferred** (own spec, post-002).
- **Cross-file full-text search index** (spec §F5, MiniSearch) — indexed content search across the
  folder. **Deferred.** (002 ships only *name* search/filter over the tree, not content search.)
- **Broken-link checker** (spec §F5) — scanning a folder for dead relative links / missing images.
  **Deferred.**
- **Watch mode + diff / snapshots** (spec §F6) — following a file as an agent writes it, snapshot
  history, compare-files. **Already scheduled as spec 005**; explicitly not here (the IndexedDB
  *snapshot* store §17 anticipated is deferred to 005; 002 introduces IndexedDB only for
  handles/recents/pins).
- **Editor, paste-scratchpad, exports, publishing, AI** — future tenants of this same app page; the
  shell is built to host them but none are built now.
- **Settings/theme persistence UI** — spec 004; 002 stores only what folder mode needs and exposes the
  wipe/transparency controls for *that* data.
- **TOC / in-document navigation** — spec 003.
- Anything that would add a `permissions`/`host_permissions` manifest entry (if a scope forces one, it
  is out of 002 by definition — see §4).

---

## 3. Architecture decision — the active surface is a **dedicated extension page**, not a new-tab override

Two candidate hosts for the active surface were evaluated against live docs:

| | **Dedicated extension page** (`app.html` opened in a tab) — RECOMMENDED | **New-tab override** (`chrome_url_overrides.newtab`) |
|---|---|---|
| Manifest cost | None beyond bundling the HTML; opened via the toolbar `action`. | The `chrome_url_overrides` key. |
| `showDirectoryPicker()` works? | Yes — it runs in its own full tab (secure context, real gesture). | Yes (also a full tab). |
| Web Store risk | Low — it is one page among the extension's features. | **Higher** — CWS *single-purpose* policy treats an NTP override as the extension's declared single purpose; NTP overrides draw heavy review (the classic search-hijack vector). |
| User surprise | None — the user opens it deliberately. | **High** — silently replaces every new tab until disabled; not toggleable via manifest. |
| Fit for Peekover | The app page is *one* surface of a markdown reader, not the product's whole identity. | Would mis-declare Peekover as a "new tab" product. |

**Decision: a dedicated bundled extension page, opened in a full tab from the toolbar action.** It
gives the identical working `showDirectoryPicker()` + IndexedDB behavior as a new-tab override with
none of the single-purpose-policy or user-surprise cost. `chrome_url_overrides.newtab` is reserved for
a future decision *only if* a new-tab experience ever becomes the product's single purpose (it is not).

**Load-bearing constraint that forces "full tab" (verified — §12):** `showDirectoryPicker()` and
`requestPermission()` **cannot run in the MV3 service worker** (no `window`) and are **unreliable in the
action popup** (historically throws `AbortError`). They work from a **full-tab extension page**. So the
action's job is only to *open the app tab*; all picker/permission calls happen on that page. This is why
the surface is a page, not a popup.

---

## 4. Capability & permission model — **`permissions: []` survives M2** (verified)

The headline trust property, and it holds:

- **`showDirectoryPicker()` is a user-gesture web API, not a declarable manifest permission.** There is
  no `permissions` string for it; it is available to any secure-context document (a
  `chrome-extension://` page qualifies) on a transient user activation. **Therefore folder mode adds no
  `permissions`, no `host_permissions`, no `webRequest`, no `tabs`** — `permissions: []` from M1 stays
  intact. (Verified against MDN + Chrome docs — §12. This is a *headline* trust property, stated on the
  security page: *the most capable folder mode in the category still requests zero permissions.*)
- The only *possible* manifest deltas in 002 are (a) bundling `app.html` + its script as an extension
  page, and (b) wiring the toolbar `action` to open it. **Neither is a permission.** If the app page is
  opened by a plain link/`action` default-popup-less click, no `tabs` permission is needed either. Any
  design pressure toward a real permission is a signal the scope has drifted out of 002 (§Out of scope).
- **At-use grant flow (the precedent):**
  1. User opens the app page (deliberate) → sees an empty-state "Open a folder" affordance.
  2. Click → **one plain-language line first** ("Peekover will read markdown files in the folder you
     pick. It never uploads them. You can revoke this anytime.") → then the OS folder picker.
  3. Grant is **at the moment of use**, **visible** (a persistent "granted: `folder-name` — revoke"
     chip while active), and **revocable** (revoke drops the handle + its IndexedDB record).
  4. **Re-prompt-on-use is a feature, not friction.** Directory-handle read access is session-scoped;
     after a reload, a persisted handle rehydrates to permission state `prompt`, and regaining access
     needs `requestPermission()` on a fresh user gesture (the first write can throw `NotAllowedError`).
     Peekover frames this as *"nothing is granted silently — Peekover re-asks every session,"* the
     zero-network/opt-in promise made tangible. (Chrome 122+ can *soften* this if the user picks "Allow
     on every visit," but we code against the pessimistic re-prompt path regardless — verified §12.)

---

## 5. Storage model — IndexedDB introduced *with* its trust controls

IndexedDB is the first persistent storage Peekover writes (M1 stored nothing). Its introduction is
itself a trust feature: **the wipe and transparency controls ship in the same milestone as the first
byte stored.**

- **What is stored (and nothing more in 002):**
  - **Directory handle(s)** — `FileSystemHandle` objects are structured-cloneable, so the granted
    handle is persisted to reopen the folder next session (subject to the re-prompt-on-use flow, §4).
    *No file contents are copied into storage — only the handle (a capability reference).*
  - **Recent documents** — a bounded list of recently opened files/folders (path/name + handle ref).
  - **Pinned files/folders** — user-pinned entries.
  - Explicitly **not** stored in 002: file contents, snapshots/version history (→ spec 005), settings
    (→ spec 004), any AI/key material.
- **"What's stored" transparency view** — an in-app panel that lists exactly what IndexedDB holds
  right now (which folders are remembered, the recents/pins), in plain language. No hidden state.
- **"Wipe all data" control** — one click clears all Peekover IndexedDB data (handles, recents, pins)
  and revokes remembered folders. This satisfies spec §6.17 ("one-click wipe all data") for the data
  002 introduces, and sets the pattern every future store (snapshots, drafts, keys) must extend.
- **Storage is local-only** — IndexedDB never leaves the machine; storing a handle triggers **no
  network** (asserted by the zero-network guard, §9). Persisting a handle is not a fetch.

---

## 6. Firefox — Chromium-first folder, honest fallback

Firefox (and Safari) ship **no disk pickers** — only OPFS — and **Mozilla formally declined** the FS
Access disk pickers as a standards position ("harmful"; not expected to change). So parity is
impossible and we will not fake it. Mirroring F8's write-fallback asymmetry:

- **Feature-detect** `'showDirectoryPicker' in window` and branch.
- **Chromium:** full folder mode — native picker, persistable handle, reopen, re-prompt-on-use.
- **Firefox:** a **read-only folder snapshot** via `<input type="file" webkitdirectory>` (Baseline 2025)
  and/or drag-a-folder using `DataTransferItem.webkitGetAsEntry()` → recurse. Both are verified to work
  in current Firefox (§12). The user picks a folder; Peekover reads and renders its markdown.
- **State the degradation honestly in-product** (not hidden): the Firefox path is a **point-in-time,
  read-only snapshot** — no live handle, no persistence, no reopen-without-re-pick, no writeback. An
  in-app note explains this is a Firefox platform limitation, not a Peekover choice — the same honesty
  posture as the M1 "never a blank page" and the write-fallback story. **Firefox is not blocked and
  parity is not claimed.**
- Recents/pins on Firefox degrade accordingly: they can store names/metadata for display, but selecting
  one re-opens the OS picker (no silent rehydration is possible without a handle) — documented as such.
- **Brave caveat (Chromium):** Brave has historically flag-gated/broken the disk pickers; the
  feature-detect branch handles this automatically (a Brave without the picker falls to the read-only
  path), so no Brave-specific code is required — noted so it is not later mistaken for a bug.

---

## 7. PERMISSIONS.md → a capability ledger

M1's `PERMISSIONS.md` opens "Peekover requests **no** permissions" and enumerates content-script
`matches`. Because 002 *still* adds no manifest permission but *does* add a real capability
(disk-folder access via a web API), the document evolves from a **manifest-line ledger** into a
**capability ledger** — in the same PR as the code (AGENTS.md #4). The new section documents, per
capability:

| Capability | Trigger (never silent) | What it can touch | Storage | How to revoke |
|---|---|---|---|---|
| Folder read (Chromium) | User clicks "Open folder" on the app page → OS picker | Only the chosen folder's files, read-only, this session | Handle persisted in IndexedDB (a capability ref, not contents) | Revoke chip · "Wipe all data" · close all tabs (access lost) |
| Folder read (Firefox) | User picks/drops a folder | Read-only snapshot of chosen files, no persistence | Names/metadata only | "Wipe all data" |

It must state plainly: **this capability is a user-gesture web API, so it appears in no manifest
permission list and shows no install-time permission warning** — and that this is *why* the at-use,
visible, revocable, re-prompted flow (§4) is the real consent mechanism, not an install dialog. The
existing zero-network evidence section extends to cover "opening/persisting a folder issues no network
request."

---

## 8. Non-functional requirements
- **Zero network by default (AGENTS.md #1)** — opening a folder, building the tree, storing a handle,
  rendering a local file: **no network request**, ever. Remote resources inside a rendered local file
  remain blocked by the M1 media policy until opt-in. This is a hard gate, tested at the request level
  in a real engine (§9).
- **Never a blank page (AGENTS.md #5)** — a picker cancel, a denied/`NotAllowedError` permission, an
  unreadable file, or an empty folder each degrades to a designed empty/error state on the app page,
  never a blank or a hang.
- **Sanitization unchanged (AGENTS.md #3)** — files opened via folder mode render through the exact M1
  parse→sanitize→mount pipeline; no new path reaches the DOM unsanitized.
- **Accessibility** — the tree, search, recents, and pins are keyboard-operable with screen-reader
  landmarks (spec §F12 posture); designed states, not "functional now, pretty later" (spec §7).
- **Performance — TO BE MEASURED (no un-measured thresholds; M1 retro standing rule).** 002 sets **no**
  perf/scale number yet. The quantities that need bars — tree build/render time on a large folder,
  file-count the tree stays smooth at, reopen latency from a persisted handle — are marked **to be
  measured** and a number is set only after measurement (as M1 did for first-paint). Any bar written
  before measurement is a bug per the retro. (The large-folder tree render may also want the
  chunked/virtualized-render lever carried from M1 — to be decided at plan time, not asserted here.)

---

## 9. Acceptance

Per the **M1 retro standing rules**: (a) every capability/permission/storage flow that **jsdom cannot
observe** — the picker grant, the permission re-prompt, handle persistence across a reload, and any
bytes-on-wire — has a **named real-engine test requirement** (real Chromium + Firefox, asserting on the
observable property, not DOM shape); (b) the **human manual gate** is a named, required
milestone-close gate; (c) **no acceptance threshold ships un-measured**.

*Checkboxes are unchecked — this is a draft spec; acceptance is defined, not yet met. Plan.md assigns
each to concrete test files; the real-engine tests live in `tests/browser/` per the standing rule.*

**Functional (verifiable in unit/jsdom where the property is DOM-shaped):**
- [ ] When the user opens the app page and clicks "Open folder" on Chromium, the system shall show the
      plain-language line, then the picker, then render the folder's markdown files as a searchable tree.
- [ ] When the user types in the tree filter, the system shall narrow the visible files by name.
- [ ] When the user selects a file, the system shall render it via the **unchanged M1 pipeline** in the
      reader pane.
- [ ] When the user cancels the picker / denies permission / opens an empty folder, the system shall
      show a designed empty/error state — never a blank page (AGENTS.md #5).
- [ ] When `'showDirectoryPicker' in window` is false (Firefox), the system shall use the read-only
      fallback and display the honest "read-only snapshot" note.
- [ ] Recents and pins list persisted entries and reopen them (Chromium: via the re-prompt flow).

**Real-engine (jsdom-blind — MUST be `tests/browser/`, real Chromium + Firefox, red-first, non-vacuous):**
- [ ] **Zero-network guard** — opening a folder, building the tree, persisting a handle, and rendering a
      local file issue **zero network requests** (assert on Resource Timing / request-level, both
      engines), extending `tests/browser/remoteMedia.browser.test.ts`'s bytes-on-wire discipline. Remote
      media inside an opened file stays blocked pre-opt-in.
- [ ] **Picker grant flow** — a real folder grant produces a usable directory handle and a rendered tree
      in a real Chromium context (the picker itself is driven/stubbed at the engine level; the grant→
      handle→read path is exercised, not mocked away).
- [ ] **Handle persistence across reload** — a handle written to IndexedDB, then rehydrated after a
      reload, is structured-clone-intact and its permission state is observed to be `prompt` (proving the
      re-prompt-on-use flow is real, not assumed).
- [ ] **Permission re-prompt** — after rehydration, access requires `requestPermission()` on a gesture,
      and a pre-grant read/write is observed to reject (`NotAllowedError`) — the "nothing granted
      silently" property, asserted in a real engine, not trusted by construction (retro rule: "handled
      by construction is a claim to test").
- [ ] **Wipe-all** — after "Wipe all data," IndexedDB holds zero Peekover records (handles/recents/pins),
      verified by reading the store in a real engine.
- [ ] **Firefox fallback** — the `webkitdirectory` / `webkitGetAsEntry` path reads and renders a folder's
      markdown in real Firefox, and stores no handle (snapshot-only), asserted in-engine.

**Trust / manifest:**
- [ ] The built manifest still declares `permissions: []` (no `permissions`/`host_permissions`/
      `webRequest`/`tabs` added) — cross-checked against the generated manifest, both builds.
- [ ] `PERMISSIONS.md` is updated to the capability-ledger form in the same PR, with every capability's
      trigger / scope / storage / revocation documented (AGENTS.md #4).

**Performance:**
- [ ] Tree build/render and reopen-latency numbers are **measured and recorded** (protocol like M1's
      `scripts/perf-first-paint.ts`); a gate is set from the measurement, not before it. **[to be
      measured — no threshold asserted in this spec]**

**Milestone-close human gate (named, required — not removable by adding jsdom tests):**
- [ ] Human manual pass, **Chrome + Firefox, current build, Network tab open**: open the app page →
      open a folder (Chromium) / snapshot (Firefox) → browse tree → search → open files → pin → reload →
      reopen via re-prompt → wipe-all; confirm **zero unexpected network**, no console errors, and each
      degraded/empty state renders. This gate caught both M1 shipping bugs (fetch leak, Firefox timing);
      it is load-bearing for anything touching capability/storage/engine-timing.

---

## 10. Deliverables of this milestone (for the plan to break down — not designed here)
The active app-page shell · Chromium folder open + tree + name filter · reader-pane integration of the
M1 pipeline · IndexedDB store (handles/recents/pins) + "what's stored" view + "wipe all data" ·
recents + pins · Firefox read-only fallback + honesty note · at-use grant flow + revoke chip ·
PERMISSIONS.md capability-ledger rewrite · the real-engine test suite above.

---

## 11. Open questions / decisions deferred to plan.md
- **Tree data source on Chromium:** eager full-folder walk vs lazy per-directory expansion (bears on the
  to-be-measured perf and on very large folders). Decide at plan time with a measurement, not here.
- **Multiple remembered folders vs one:** does 002 persist a single "last folder" or a small set of
  remembered folders? (Recents/pins imply a set; confirm the minimal correct scope at plan time.)
- **Where "open the app page" lives:** toolbar `action` click is the assumed entry; confirm no `action`
  default-popup is needed (a popup that then opens a tab is fine and adds no permission).
- **Firefox recents semantics:** exact UX for a recent entry that cannot silently rehydrate (re-pick
  prompt vs greyed with explanation).

---

## 12. Research findings & citations (verified 2026-07-15) — and where research met the four decisions

All four architectural assumptions the scope was built on were **CONFIRMED** by primary sources. Two
**nuances** (not contradictions) are flagged for the human at the end.

**File System Access API / persistence (extension context):**
- `showDirectoryPicker()` requires **transient user activation + secure context**, and is **not a
  manifest permission** — MDN <https://developer.mozilla.org/en-US/docs/Web/API/Window/showDirectoryPicker>,
  Chrome <https://developer.chrome.com/docs/capabilities/web-apis/file-system-access>. → **Decision
  "`permissions: []` survives" CONFIRMED.**
- Disk pickers are **Chromium-only**; Firefox/Safari ship **OPFS only** — caniuse
  <https://caniuse.com/native-filesystem-api>, MDN File System API
  <https://developer.mozilla.org/en-US/docs/Web/API/File_System_API>. → **"Chromium-first" CONFIRMED.**
- **Mozilla formally declined** the disk pickers, position **`negative`/"harmful"** (cross-site local
  FS access → "no meaningful end-user consent possible"); OPFS-subset only may come —
  <https://github.com/mozilla/standards-positions/issues/154>,
  <https://github.com/mozilla/standards-positions/issues/738>. → **"Mozilla declined, won't change
  soon" CONFIRMED.**
- Read access is **session-scoped**; handles are **structured-cloneable → IndexedDB-persistable**; a
  **rehydrated handle returns `prompt`**, `requestPermission()` needs a **gesture**, and a pre-grant op
  throws **`NotAllowedError`** — MDN queryPermission
  <https://developer.mozilla.org/en-US/docs/Web/API/FileSystemHandle/queryPermission>, Chrome FSA guide
  (above). → **"persistence imperfect by design / re-prompt-on-use" CONFIRMED.**
- **Extension-context nuance (design constraint, informs §3):** the picker/`requestPermission` **cannot
  run in the MV3 service worker** and is **unreliable in the action popup** (`AbortError`); it **works
  from a full-tab extension page** — WICG <https://github.com/WICG/file-system-access/issues/314>,
  Chromium <https://issues.chromium.org/issues/40240444>. This is why the surface is a page, not a popup.
- **New-tab override cost:** CWS single-purpose scrutiny + user-surprise; dedicated page needs no such
  key — MDN <https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/chrome_url_overrides>,
  Chrome policy FAQ <https://developer.chrome.com/docs/webstore/program-policies/quality-guidelines-faq>.
  → informs the **dedicated-page recommendation (§3)**.

**Firefox fallback viability:**
- Drag-a-folder via `DataTransferItem.webkitGetAsEntry()` → `FileSystemDirectoryEntry` recurse **works
  in Firefox**, read-only, non-standard — MDN
  <https://developer.mozilla.org/en-US/docs/Web/API/DataTransferItem/webkitGetAsEntry>. (Chromium caps
  `readEntries()` at 100/call; loop.)
- `<input type="file" webkitdirectory>` **works in Firefox (50+), Baseline 2025** — MDN
  <https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/webkitdirectory>, caniuse
  <https://caniuse.com/input-file-directory>. Both fallbacks are **read-only snapshots** (no handle, no
  persistence, no writeback). → **"Firefox honest fallback" CONFIRMED viable.**

**Competitors:**
- **MarkView** (the direct threat): Chromium-only; ships a **File System Access folder browser with tree
  view, persistent folder bookmarks, and recent-documents-with-search** — author's Show HN comment
  <https://news.ycombinator.com/item?id=46632879>, site <https://getmarkview.com/>. The vibe-coder pain
  point is real and on-persona, verbatim: *"I kept opening VSCode just to read a README, which felt like
  overkill."* **Caveat:** this is the **author's self-description on a low-traction thread (1 pt/1
  comment)**, not independent validation — cite as vendor claim. → **what to MATCH:** tree, pinned,
  recents+search, one-click FSA grant.
- **simov / Markdown Viewer:** **no folder mode**; permissions are a crude **"Site Access" textbox** (type
  an origin, click Add/Remove) + per-origin regex, and permissions **don't sync across devices** —
  README <https://github.com/simov/markdown-viewer/blob/main/README.md>. → **what to BEAT:** a guided,
  plain-language, at-use permission flow instead of a raw origin/regex textbox.
- **Where we beat both:** (1) friendlier at-use permission UI; (2) **trust/transparency as a product
  surface** (zero-network guarantee + visible indicator + "what's stored" view — neither competitor
  exposes this); (3) **Firefox honesty** — a documented read-only fallback where MarkView simply doesn't
  exist on Firefox.

### Flagged for the human — nuances research surfaced (no decision contradicted)
1. **Chrome 122+ persistent permissions** can *soften* the re-prompt-on-use story: a three-way prompt
   ("Allow this time / Allow on every visit / Don't allow") lets a user opt into persistence, and
   installed PWAs skip it — <https://developer.chrome.com/blog/persistent-permissions-for-the-file-system-access-api>.
   This does **not** contradict "persistence imperfect by design" (a gesture + `requestPermission()` is
   still required, and we code against the pessimistic re-prompt path), but the human may want to decide
   whether Peekover *surfaces* "Allow on every visit" as an option or deliberately always re-asks to keep
   the trust story maximal. **Recommend:** honor whatever the user picks in the OS prompt, but never
   request persistence silently; treat re-ask as the default narrative.
2. **Brave** flag-gates/breaks the disk pickers intermittently — the feature-detect branch absorbs this
   (Brave-without-picker → read-only path), so no special-casing is needed, but "full folder mode is
   Chromium" should read "Chromium *with the picker enabled*" to be precise —
   <https://github.com/brave/brave-browser/issues/29411>.

*Neither nuance changes the scope or the four decisions; both are recorded so the plan/human can rule on
presentation, not architecture.*

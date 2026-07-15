# PERMISSIONS.md — the capability ledger

*Rule (AGENTS.md #4): a permission/capability change and its justification land in the same PR.*

Peekover requests **no** `permissions`, `host_permissions`, `webRequest`, or `tabs`. The built
manifest declares **`permissions: []`** on both engines — re-proven every run by
`tests/manifest.test.ts`, which asserts the config-derived manifest for Chrome *and* Firefox keeps
`permissions: []`, adds no `host_permissions` / `web_accessible_resources` / `webRequest`, and never
requests `tabs` / `activeTab` / `scripting`. The only manifest key M2 added is the toolbar `action`
(documented below), which is not a permission.

## Why a manifest ledger became a *capability* ledger

Through M1 this file was a **manifest-line ledger**: it justified every `matches` pattern and every
manifest key, because those were the only ways Peekover could touch anything. M2 (spec 002) adds a
real **capability** — reading a folder of markdown from disk — **without adding any manifest
permission**, because it is reached entirely through **user-gesture web APIs**:

- **File System Access** (`window.showDirectoryPicker()` → a `FileSystemDirectoryHandle`) on Chromium;
- **`<input type="file" webkitdirectory>`** and **drag-and-drop `DataTransferItem.webkitGetAsEntry()`**
  on Firefox (and any picker-disabled Chromium).

These APIs are gated by the browser itself on a **user gesture** and its **own native dialog** — they
appear in **no manifest permission list** and show **no install-time permission warning**. That is
*precisely why* Peekover's consent for folder access cannot live in an install dialog: it lives in the
**at-use, visible, revocable, re-prompted** flow below. The install dialog would say "no special
permissions" (true); the real consent is the OS picker the user clicks, the "granted — revoke" chip
they can see, and the re-prompt on every reopen. This section documents that flow honestly, per
capability, so "no permissions" is never mistaken for "no capability."

## The ledger — every M2 capability

| Capability | Trigger (never silent) | What it can touch | Storage (on-device only) | How the user sees & revokes it |
|---|---|---|---|---|
| **Folder read — picker (Chromium)** | User clicks **"Open a folder"** on the app page (after a plain-language line) → the OS folder picker; one gesture. | Only the **one chosen folder**, **read-only** (`mode: 'read'`), this session. A **bounded, markdown-only** walk (skips `node_modules`/dotdirs, caps file count + depth), so it never trawls the whole disk. | The `FileSystemDirectoryHandle` — a **capability reference, not file contents** — persisted in IndexedDB (`folders` store) so the folder can be reopened in one gesture. | The persistent **"granted: `folder` — revoke"** chip (revoke drops the handle **and** its IndexedDB row); the **"Wipe all data"** control; and access is lost on tab close / reload until re-granted (see re-prompt below). |
| **Folder read — drag (Chromium)** | User **drags a folder onto the app page** and drops it; one gesture. Chromium resolves a **live** handle (`getAsFileSystemHandle`). | Same as picker: the one dropped folder, read-only, bounded markdown walk. | Same as picker — the live handle, a capability ref, never contents. | Same as picker (chip · wipe · lost on close). |
| **Folder read — Firefox read-only snapshot** | User **picks** (`<input webkitdirectory>`) or **drops** a folder; one gesture. Firefox exposes **no persistable handle**. | A **point-in-time, read-only snapshot** of the chosen folder's markdown files. No live handle, **no persistence, no silent reopen** — a Firefox platform limitation, surfaced honestly in the UI. | **Names/metadata only** — the `folders` row carries **no handle**; recents/pins store path + name for display. Never file contents. | **"Wipe all data"** (there is no persisted access to revoke — each open re-picks). |
| **IndexedDB persistence (handles · recents · pins)** | A consequence of opening a folder, opening a file, or pinning — **never a network call, never file contents.** | The on-device **`peekover`** IndexedDB (three stores: `folders`, `recents`, `pins`). Nothing else. | Chromium: the folder handle (capability ref). Both engines: recents (`folderId` + path + name) and pins (kind + path + name). **File contents are never stored.** | The **"Stored data"** panel (`describeStored()`) shows *everything* held — folders as a **persisted-boolean** (the presence of a handle, never the object), recents, pins, in plain language. **"Wipe all data"** (`wipeAll()`) clears all three stores. |
| **Re-prompt on reopen** | User **clicks a remembered recent/pinned folder**; one gesture. | Re-grants **read** access to that **previously-chosen** folder via `handle.requestPermission({ mode: 'read' })`. Touches nothing new. | No new storage — reuses the remembered handle row. | Decline the browser's re-prompt (a pre-grant read rejects `NotAllowedError`, surfaced as a re-ask affordance, never a dead end); or revoke / wipe as above. Re-ask-on-use is the **default** — access is never assumed silently. |

**Read this ledger as the truth of what folder mode can do:** it can read the markdown in folders the
user explicitly hands it, on device, and remember a *handle* (Chromium) so reopening is one click. It
cannot read outside a chosen folder, cannot write, cannot reach the network, and stores no file
contents anywhere.

## `content_scripts.matches`

The content script (M1) still governs which pages Peekover injects into. On any non-matching page it
does literally nothing; the in-script `isRenderableContext()` gate narrows these coarse host matches
to actual markdown resources before any DOM is touched.

| Match pattern | Why | Since |
|---|---|---|
| `file:///*.md` | Render a local markdown file opened from disk. | M1 / task 2.2 (2026-07-14) |
| `file:///*.mkd` | Same, `.mkd` extension. | M1 / task 2.2 (2026-07-14) |
| `file:///*.mdx` | Same, `.mdx` extension. | M1 / task 2.2 (2026-07-14) |
| `file:///*.markdown` | Same, `.markdown` extension. | M1 / task 2.2 (2026-07-14) |
| `file:///*.mdown` | Same, `.mdown` extension. | M1 / task 2.2 (2026-07-14) |
| `file:///*.mkdn` | Same, `.mkdn` extension. | M1 / task 2.2 (2026-07-14) |
| `file:///*.mdwn` | Same, `.mdwn` extension. | M1 / task 2.2 (2026-07-14) |
| `file:///*.mdtxt` | Same, `.mdtxt` extension. | M1 / task 2.2 (2026-07-14) |
| `file:///*.mdtext` | Same, `.mdtext` extension. | M1 / task 2.2 (2026-07-14) |
| `https://raw.githubusercontent.com/*` | Render raw markdown served by GitHub's raw host (exact host). | M1 / task 2.2 (2026-07-14) |
| `https://gist.githubusercontent.com/*` | Render raw markdown served by GitHub Gist's raw host (exact host). | M1 / task 2.2 (2026-07-14) |
| `https://gitlab.com/*/-/raw/*` | Render raw markdown in GitLab's raw file view; path-scoped to `/-/raw/` so Peekover is NOT injected across the rest of gitlab.com. | M1 / task 2.2 (2026-07-14) |
| `https://bitbucket.org/*/raw/*` | Render raw markdown in Bitbucket's raw file view; path-scoped to `/raw/` so Peekover is NOT injected across the rest of bitbucket.org. | M1 / task 2.2 (2026-07-14) |

### `action` — the toolbar button (added M2 / task 1.1)
The manifest declares `action: { default_title: "Open Peekover" }` with **no `default_popup`**. A
click fires `action.onClicked` in the background, which opens Peekover's own bundled app page via
`tabs.create({ url: runtime.getURL('/app.html') })`. **This adds no permission:** `action` is a
manifest key, not a `permissions` entry; `tabs.create` needs no `tabs` permission (only *reading*
privileged tab fields does); and the page needs no `web_accessible_resources` because the extension
opens **its own** URL. The `manifest.test.ts` trust-pin proves `action` is the only new key and
`permissions: []` survives.

### The app page (`app.html`) — a bundled extension page
The second surface M2 introduces is an ordinary bundled extension page (`entrypoints/app/`). It is
served from the extension's own origin, opened by URL (above), and holds the folder/reader/storage
UI. It requests nothing: no host access, no network, no manifest entry of its own beyond being a
bundled asset.

### `content_scripts.run_at` — `document_start`
The content script runs at `run_at: "document_start"` (both builds), not the default
`document_idle`. This is the earliest injection point into a matched page, and we need it to
hide the raw `<pre>` before the browser paints it and mount the reader in its place. The
never-blank guarantees that make early injection safe live in `runReader` (`src/render/runReader.ts`):
detect before hide, plus a safety timer and a `finally` that reveal the raw text on every outcome
if the reader never mounts. `run_at` grants no host access beyond the `matches` list above.

### `manifest_version` 3 & `background`
Both builds are Manifest V3 with a non-persistent background — the least-privilege posture, with
no persistent background page. Each build ships a background context only so MV3 has a valid
background entry, and the shape differs by engine: Chrome uses a service worker
(`background.service_worker` = `background.js`); Firefox uses a non-persistent MV3 **event page**
(`background.scripts` = `["background.js"]`). WXT emits the correct shape per engine (decisions.md,
2026-07-14). As of M2 (task 1.1) the background script registers exactly one listener —
`action.onClicked` → open the app page — and makes no network calls; it holds no other logic.

### Firefox data collection declaration
The Firefox build declares `browser_specific_settings.gecko.data_collection_permissions`
= `{ required: ["none"] }` — **Peekover collects no data** (AGENTS.md #1/#2). Mozilla
requires new extensions to declare their data practices; "none" is the collects-nothing
value, shown to the user at install time. This key is Firefox-only and never appears in
the Chrome manifest.

### Firefox extension id (`gecko.id`)
The Firefox build sets `browser_specific_settings.gecko.id` = `peekover@peekover.dev` — the
stable AMO identity (required before an MV3 AMO submission; we own the domain). It is Firefox-only,
carries no capability implication, and is recorded here for completeness.

### file:// access note
Injecting on `file://` pages requires the user to grant "Allow access to file URLs"
in the browser's extension settings — a binary, user-controlled toggle. Peekover
requests no additional permission for this; it only declares the `file:///*.<ext>`
match patterns above, which take effect once the user grants that access. (This governs the
*content script* on `file://` pages; the app page's folder read is the separate user-gesture
capability documented in the ledger above, and does not use this toggle.)

## Zero-network evidence

`permissions: []` means the manifest requests no network capability — no `host_permissions`,
`webRequest`, or any fetch-granting permission. That is the manifest promise; the proof that Peekover
honors it is **behavioral**, on two surfaces:

- **The reader** blocks remote resources by default: `src/render/mediaPolicy.ts` neutralizes remote
  media before it can load, and `tests/browser/remoteMedia.browser.test.ts` asserts at the request
  level — in real Chromium and Firefox — that opening a document with remote images issues zero image
  requests before the user opts in.
- **Folder mode** issues **no network request for opening, walking, or persisting a folder.** Reading
  a directory handle is a disk operation; storing a handle in IndexedDB is a **structured clone, not a
  fetch**; recents/pins are on-device rows. `tests/browser/wipe.browser.test.ts` and
  `tests/browser/folderMode.network.browser.test.ts` assert on the browser's Resource Timing buffer
  (real Chromium + Firefox) that open + walk + render-a-local-file + `store` put + `describe` + `wipe`
  fire **zero** http(s) requests — and, non-vacuously, that a control same-origin fetch *does* appear
  in the same buffer, so the zero-count is a real observation, not a broken observer.

So the manifest requests no network capability, and both the reader and folder mode are **tested to
make none**.

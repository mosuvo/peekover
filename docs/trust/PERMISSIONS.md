# PERMISSIONS.md — the capability ledger

*Rule (AGENTS.md #4): a permission/capability change and its justification land in the same PR.*

Peekover requests **no** `permissions`, `host_permissions`, `webRequest`, or `tabs`. The built
manifest declares **`permissions: []`** on both engines — re-proven every run by
`tests/manifest.test.ts`, which asserts the config-derived manifest for Chrome *and* Firefox keeps
`permissions: []`, adds no `host_permissions` / `web_accessible_resources` / `webRequest`, and never
requests `tabs` / `activeTab` / `scripting`. The only manifest key M2 added is the toolbar `action`
(documented below), which is not a permission; M13 added the icon keys `icons` and `action.default_icon`
(also below), which are not permissions either.

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

## The ledger — every M2 capability, plus M4's settings channel, M5's watch relay, M6's snapshot capture, M7's diagram cache, and M12's edit save-back

*(M4 / spec 004 added the settings message channel; M5 / spec 005 adds the watch relay; M6 / spec 006
task 1.4 adds on-device snapshot capture; M7 / spec 007 task 4.3 adds the on-device diagram cache;
M12 / spec 012 task 5.3 adds edit save-back — the last five rows. Like folder read, each is a real capability that costs **no manifest permission**
— so they belong here rather than nowhere.)*

| Capability | Trigger (never silent) | What it can touch | Storage (on-device only) | How the user sees & revokes it |
|---|---|---|---|---|
| **Folder read — picker (Chromium)** | User clicks **"Open a folder"** on the app page (after a plain-language line) → the OS folder picker; one gesture. | Only the **one chosen folder**, **read-only** (`mode: 'read'`), this session. (Read-only is the *folder* handle's: one file the user opens for editing can be written at Save, through that file's own handle — the edit save-back row below.) A **bounded, markdown-only** walk (skips `node_modules`/dotdirs, caps file count + depth), so it never trawls the whole disk. | The `FileSystemDirectoryHandle` — a **capability reference, not file contents** — persisted in IndexedDB (`folders` store) so the folder can be reopened in one gesture. | The persistent **"granted: `folder` — revoke"** chip (revoke drops the handle **and** its IndexedDB row); the **"Wipe all data"** control; and access is lost on tab close / reload until re-granted (see re-prompt below). |
| **Folder read — drag (Chromium)** | User **drags a folder onto the app page** and drops it; one gesture. Chromium resolves a **live** handle (`getAsFileSystemHandle`). | Same as picker: the one dropped folder, read-only, bounded markdown walk. | Same as picker — the live handle, a capability ref, never contents. | Same as picker (chip · wipe · lost on close). |
| **Folder read — Firefox read-only snapshot** | User **picks** (`<input webkitdirectory>`) or **drops** a folder; one gesture. Firefox exposes **no persistable handle**. | A **point-in-time, read-only snapshot** of the chosen folder's markdown files. No live handle, **no persistence, no silent reopen** — a Firefox platform limitation, surfaced honestly in the UI. | **Names/metadata only** — the `folders` row carries **no handle**; recents/pins store path + name for display. Never file contents. | **"Wipe all data"** (there is no persisted access to revoke — each open re-picks). |
| **IndexedDB persistence (handles · recents · pins · settings)** | A consequence of opening a folder, opening a file, pinning, or changing a reading preference — **never a network call, never a fetch.** | The on-device **`peekover`** IndexedDB. As of M7 / spec 007 task 4.3 it holds **eight** stores at `DB_VERSION` 4: `folders`, `recents`, `pins`, `settings` (M4 / spec 004, `DB_VERSION` 2), `snapshotMeta` + `snapshots` (M6 — watched-document snapshots, their own capability in the snapshot-capture row below), and `diagramMeta` + `diagrams` (M7 — cached diagram renderings, their own capability in the diagram-cache row below). Nothing else. | Chromium: the folder handle (capability ref). Both engines: recents (`folderId` + path + name), pins (kind + path + name), and the single settings row (theme choice, TOC open-state + width, code-theme choice, last-used export format); the settings store also holds the setup guide's "shown" mark (M13 task 6.2a, below). **These four record classes are names/metadata only — no file contents.** The one stored thing that IS file contents is a watched-document snapshot, disclosed in its own row below. | The **"Stored data"** panel (`describeStored()`) shows everything held except one row, the snapshot notice's dismissal mark — folders as a **persisted-boolean** (the presence of a handle, never the object), recents, pins, a plain-language **"Theme / display settings — stored on-device."** line whenever a settings row exists, and a **snapshot line** naming how many snapshots, across how many documents, and their total on-device bytes, and a line for the setup guide's mark while it is stored. **"Wipe all data"** (`wipeAll()`) clears **all eight stores**, snapshots and cached diagrams included. |
| **Re-prompt on reopen** | User **clicks a remembered recent/pinned folder**; one gesture. | Re-grants **read** access to that **previously-chosen** folder via `handle.requestPermission({ mode: 'read' })`. Touches nothing new. | No new storage — reuses the remembered handle row. | Decline the browser's re-prompt (a pre-grant read rejects `NotAllowedError`, surfaced as a re-ask affordance, never a dead end); or revoke / wipe as above. Re-ask-on-use is the **default** — access is never assumed silently. |
| **Settings message channel (M4 / spec 004)** | The content-script reader messaging **Peekover's own background** — `peekover:getSettings` on reader start, `peekover:setSettings` when the user changes a reading preference (theme, TOC open-state, TOC width). Never on a timer, never for anything else. | **Only the single on-device settings row** — theme choice, TOC open-state, TOC width. It cannot read or write folders, recents, pins, file contents, or page content, and it **never touches the network**. The background answers exactly these two messages and holds no other logic. | The `settings` store in the same on-device **`peekover`** IndexedDB (row above). Nothing leaves the device. | The **"Stored data"** panel lists the settings row in plain language; **"Wipe all data"** erases it with everything else. The effect is also directly visible — it *is* the theme and TOC state the user chose. |
| **Watch relay — re-reading a watched local file (M5 / spec 005)** | The user switches **watch on** for the document they already have open, with a click on the in-reader watch control. **Nothing watches by default**, nothing starts on a timer, and no document is watched until that gesture. While watching, the reader asks the background (`peekover:watchRead`) for the file's current bytes about once a second; it stops on a second click, when the user switches documents, and when the tab closes. | **Only the one `file://` markdown document the user already opened** — the URL must be a `file://` URL whose extension is one of the same nine in the content script's own `matches`, checked by `isWatchableFileUrl` **before** any read happens (`src/watch/watchRelay.ts`). Every other URL is refused unread: `http(s)` (which would make this a network proxy), `data:`, `blob:`, and `chrome-extension:`/`moz-extension:` (which would expose the extension's own packaged files). It reads **only**; it cannot write, cannot reach outside that one file, and **never touches the network**. | **The relay itself stores nothing** — it re-renders the fresh bytes and drops them; it keeps no snapshot, no history, no cache of its own, and **never touches the network**. Persisting a snapshot of the on-screen document is a **separate** capability (the app-page snapshot-capture row below, M6), not something the relay does. | The watch control itself: it is **visible in the reader**, states whether it is on in words as well as colour, and **turns it off with one click**. Watching also ends by itself when the user opens another document or closes the tab. Where watching cannot work — Firefox, or a document loaded over the network — the control **explains why in plain language instead of pretending**. |
| **Snapshot capture — on-device version history of watched documents (M6 / spec 006)** | Only while a folder document opened on the **app page** is being **watched** (the app-page watch gesture above): when a watched re-render replaces the document, Peekover keeps a snapshot of the **outgoing** text, so the two versions can be compared. **Content-script readers capture nothing** — they have no folder identity (`docId`), so the capture path is off there entirely (§3.2). Capture is on by default and off-switchable in the storage panel (spec 006 task 1.5). | **Only the text of documents the user is actively watching on the app page**, keyed `folderId + SEP + path`. It writes to the on-device `snapshotMeta` + `snapshots` stores and nothing else; it never writes outside those stores, never leaves the device, and **never touches the network**. A bounded number of states is kept (per-document count, and global age + byte caps); older states are evicted automatically. | The on-device `snapshotMeta` (per-document index: id, timestamp, byte length) + `snapshots` (the text) stores in the same **`peekover`** IndexedDB. **Nothing leaves the device.** | The **"Stored data"** panel's snapshot line names how many snapshots, across how many documents, and their total bytes. **Revoking a folder erases that folder's snapshots** (D-10). **"Wipe all data"** erases every snapshot. The storage panel's **"Erase snapshots"** control erases every snapshot on its own, keeping folders/recents/pins/settings and the capture preference (spec 006 task 1.6). Per-document erase is deferred (spec 006 §6). |
| **Diagram cache (M7 / spec 007)** | User opens a document containing Mermaid diagrams on the app page → the reader renders each diagram once, then reuses the stored SVG until the diagram source, effective theme or Mermaid engine version changes. | Bounded on count, total bytes and age, whichever binds first, evicting oldest-first on `lastUsed`. | Cached SVGs stored in the extension's own IndexedDB (`peekover`, DB version 4), keyed by hash of the diagram source. | **A content-hash key carries no folder identity, so revoking a folder does not clear cached diagrams that folder's documents may reference — the same Mermaid source in two folders is one cached rendering.** Erased by "Clear diagram cache" in the Stored data panel, or by "Wipe all data". |
| **Edit save-back (M12 / spec 012)** | User opens a document for editing on the app page and clicks **Save**; one click per save. **Nothing saves on a timer and there is no autosave.** On Chromium that click asks the browser for write access to that one file (`handle.requestPermission({ mode: 'readwrite' })`); the browser shows its own prompt whenever it does not already hold that grant. | Only the **one file being edited** — never another file, and never the folder: the folder handle stays read-only (`mode: 'read'`), and write access is asked for on that file's own handle, at the click, not before. Immediately before writing, Peekover re-reads the file and compares it with what it last read or wrote; if the file changed on disk in between, it **writes nothing**, says so in words, and keeps the edit on screen. (The check and the write are two steps: a change landing in the instant between them is not caught.) On Firefox, on any route with no live file handle, and when the write prompt is declined, Save hands the text to the browser as an ordinary **download** instead and changes nothing in the folder. **Never touches the network.** | **No new storage.** The write goes to the user's own file on their own disk. The per-file handle lives in memory for the open tab only and is never written to IndexedDB — the stored handle in the folder-read row is the *folder's*, and stays read-only. | The **Save** button and the status line beside it, which says in words what happened: saved, saved as a download, not saved because the file changed on disk, or failed. Declining the browser's write prompt is always safe — the edit becomes a download. **Revoke** on the folder chip closes the folder and drops the file handle with it, so nothing can be saved until the folder is opened again. The chip shows that a folder is open; it does **not** show whether the browser holds a write grant for a file, and Revoke does not ask the browser to withdraw one — that grant is the browser's, visible and removable in its own site-permission controls. |

**Read this ledger as the truth of what folder mode can do:** it can read the markdown in folders the
user explicitly hands it, on device, and remember a *handle* (Chromium) so reopening is one click.
It cannot read outside a chosen folder, cannot reach the network, and cannot change any file on disk except the one file the user has opened for editing — and that only when they click Save, never on its own.
Folder mode itself stores no file contents; the one thing Peekover stores that IS file contents — watched-document
snapshots — is the app-page snapshot-capture capability in its own row above, on-device and never
uploaded.

**And the same honesty about the settings channel.** A content script messaging its **own** extension's
background requires **no manifest permission at all** — no `storage`, no `tabs`, nothing; it is
same-extension IPC, which is why adding it left `permissions: []` intact (re-proven every run by
`tests/manifest.test.ts` on **both** built manifests). But "needs no permission" is not "worth hiding":
it is a new path between two Peekover contexts, so it is disclosed above with the same three questions
the folder rows answer — what triggers it, what it can touch, and how the user sees and erases it. The
short version: it carries reading preferences to and from one on-device row, it is **never** a network
call, it **never** sees file or page contents, and "Wipe all data" clears it.

**And the same honesty about the watch relay — including the part that costs us nothing to admit.**
Like the settings channel, a content script messaging its **own** background needs **no manifest
permission**, and `permissions: []` is re-proven every run by `tests/manifest.test.ts` on **both**
built manifests. But "needs no permission" is again not "worth hiding": watching adds a path that
**re-reads a file from disk on a timer**, which is a bigger claim than carrying a theme preference,
so it gets the same three answers. What triggers it: **a click, on a file the user already has
open** — never a default, never a timer that starts on its own. What it can touch: **only that one
`file://` markdown document**, enforced by a check that runs before any read and refuses every other
scheme and extension outright. How the user sees and stops it: the control is **in the reader**, says
in words whether it is on, and stops with one click — and watching ends on its own when they open
another document or close the tab.

**Reading a watched local file is NOT a network call** (spec §3.6-A). It does not light the network
indicator, and Peekover's zero-network guards remain scoped to `http(s)` — which is **correct, not
merely convenient**, and that distinction is **measured rather than asserted**: at spec 005 task 2.3
a `file://` read was found to leave `performance.getEntriesByType('resource')` **empty (`[]`) on both
engines**. There is nothing for an http(s)-scoped guard to filter out because a local file read never
enters that buffer at all. Stated plainly in both directions, so the evidence is not over-read: those
guards prove watch puts **nothing on the wire**, and they can **never** prove the local read happened
— that is what the detection tests are for.

**The watch RELAY stores nothing — but the app page now captures snapshots, disclosed in its own row
above.** The relay (the content-script re-read) re-renders the fresh bytes and drops them: it adds no
store, no cache, no history of its own. What changed at M6 is separate: while watching a folder
document **on the app page**, Peekover keeps on-device snapshots of the outgoing text (the
`snapshotMeta` + `snapshots` stores, `DB_VERSION` 3). Those snapshots never leave the device and are
erased on folder revoke (D-10) and on "Wipe all data". They are the reason the earlier blanket *"file
contents are never stored"* no longer holds in general — the ledger above states what IS stored, and
where, instead of repeating a promise M6 made false.

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

### `icons` and `action.default_icon` — the extension icon (added M13 / task 2.6)
The manifest declares `icons` at 16, 32, 48 and 128 px and `action.default_icon` at 16 and 32 px, all PNG files
packaged under `icons/` (rendered from `design/icons.html`'s drawings by `scripts/render-icons.ts`). **This adds no
permission:** both are manifest keys that only name image files inside the extension, read by the browser to draw
the extension's own icon; they reach no page and no network, and need no `web_accessible_resources`.
`tests/manifest.test.ts` pins both keys alongside `permissions: []`; `tests/icons.test.ts` checks that each file
exists at its declared size.

### The app page (`app.html`) — a bundled extension page
The second surface M2 introduces is an ordinary bundled extension page (`entrypoints/app/`). It is
served from the extension's own origin, opened by URL (above), and holds the folder/reader/storage
UI. It requests nothing: no host access, no network, no manifest entry of its own beyond being a
bundled asset.

### The setup guide (`onboarding.html`) — a bundled extension page (added M13 / task 6.1)
A second bundled extension page (`entrypoints/onboarding/`), like the app page: served from the
extension's own origin, reached from the app page's **"Setup guide"** link (a new tab). It adds **no
manifest key and no permission** — both built manifests are byte-identical before and after it
(833 / 949 B, `permissions: []`, re-proven by `tests/manifest.test.ts`). What it uses, and why none of it
needs a permission:
- **`extension.isAllowedFileSchemeAccess()`** (both builds) — reads whether the user has turned on "Allow access to
  file URLs" (Chromium) or "Access local files on your computer" (Firefox 153+) for Peekover, so the page can say
  whether local files will open. It
  only *reads* the user's own toggle; it cannot change it. Chrome's reference lists no permission for
  the `extension` API, and says its utilities can be used by any extension page. Read when the page
  opens and again when it regains focus. `src/app/onboarding.test.ts` checks both engines' bundles; only the
  Chromium one carries the extensions-page link.
- **`permissions.contains({ origins })`** and **`runtime.getManifest()`** (both builds; added M13 / walk fix
  8.1f) — read whether Peekover still holds the sites its content script runs on, so the page does not say
  "on" while the browser withholds them. In Chromium, site access ("Automatically allow access on the
  following sites") can be off while "Allow access to file URLs" stays on; in Firefox each raw site's
  permission can be turned off in about:addons. The patterns are the manifest's own content-script
  matches. Both only *read*; nothing is requested or changed. Measured with `permissions: []` on Chrome
  157, Chromium 149 and Firefox 159 (`docs/ai/decisions.md`, "M13 TASK 8.1f").
- **`tabs.create({ url: 'chrome://extensions/?id=<Peekover's id>' })`** (Chromium build only) — the
  "Open Peekover's details" button, one click, opens Peekover's own Details page so the user can flip
  the toggle themselves. Like the toolbar action above, `tabs.create` reads no tab field and needs no
  `tabs` permission.
- **No network.** Its fonts are the app page's, from the package; `tests/browser/onboarding.browser.test.ts`
  reads zero off-origin requests after the wire settles, with a slow firing control.

- **The saved theme (task 6.2)** — the page reads the user's saved Peekover theme (light / dark / auto)
  from Peekover's own settings store (IndexedDB on the extension's origin), exactly as the app page does.
  Same-origin storage the extension already owns: no `storage` permission, no request.

### `runtime.onInstalled` — open the setup guide once, on install (added M13 / task 6.2)
The background registers a `runtime.onInstalled` listener. When the browser reports the reason
`"install"` — Peekover was just installed — it opens the setup guide in a new tab with
`tabs.create({ url: runtime.getURL('/onboarding.html') })`. For every other reason it does nothing: an
extension update (`"update"`), a browser update (`"chrome_update"` in Chrome, `"browser_update"` in
Firefox) or a shared-module update (`"shared_module_update"`). **This adds no permission:** `onInstalled`
needs none (Chrome's `runtime` reference names a permission only for native messaging), and
`tabs.create` with the extension's **own** URL reads no tab field, like the toolbar action above.
Nothing is fetched. Both built manifests are byte-identical before and after (833 / 949 B,
`permissions: []`); `tests/background.test.ts` runs the real background against a fake browser API
and checks each reason. *Measured on a command-line-loaded Chromium 149 (`--load-extension`): every
browser start reports `"install"` for such an install; a store install is expected to report it once —
the 8.1 walk checks it.*

**At most once (task 6.2a).** So that the guide never opens twice whatever reason the browser reports,
the listener opens it only if Peekover's own storage holds no "guide shown" mark, and stores the mark as
it opens the tab. The mark is one row (`guide`) in the `settings` store of Peekover's on-device
**`peekover`** IndexedDB — the extension origin's own database, which needs **no permission on either
engine** (the `storage` permission is for the separate `browser.storage` API, which Peekover does not
use). The check and the write are one IndexedDB `add`, so two "install" events cannot both open the
guide. If storage cannot be used, no tab opens. The **"Stored data"** panel names the mark (*"The setup
guide was shown — remembered so it opens only once."*). **"Wipe all data"** clears it with everything
else; the wipe opens nothing — it only lets a later real install open the guide again. Nothing is
fetched; manifests unchanged. `tests/background.test.ts` (the listener) and
`tests/browser/guideMark.browser.test.ts` (the mark, on both engines' real IndexedDB).

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
2026-07-14). As of M5 (spec 005, task 2.2) the background script registers **three** listeners and
makes no network calls; it holds no other logic:

1. `action.onClicked` → open the app page (M2 / task 1.1), as described above;
2. `runtime.onMessage` → the **settings message handler** (`peekover:getSettings` /
   `peekover:setSettings`), answered against the background's own IndexedDB connection. The
   content-script reader runs on the *page's* origin and therefore cannot see the extension's
   IndexedDB, so it reaches its own stored settings by messaging this context. See the settings-channel
   row in the ledger above — it adds **no** manifest permission; and
3. `runtime.onMessage` → the **watch relay** (`peekover:watchRead`, added M5 / spec 005 task 2.2).
   A content script runs in the *page's* origin and cannot reliably re-read its own `file://`
   document; this context can. So while the user is watching a local markdown file, the reader asks
   this listener for that file's current bytes and gets one response. **The background holds no watch
   state at all** — no timer, no registry, nothing: the polling loop lives in the page, so the watch
   dies with the tab that owns it and there is nothing to lose when the MV3 worker is evicted. The
   listener **refuses anything that is not a `file://` URL ending in one of the markdown extensions
   in the content script's own `matches`** (`isWatchableFileUrl`, `src/watch/watchRelay.ts`), and it
   refuses **before** reading, so a refused URL is never read at all. That validation — not this
   paragraph — is what stops the relay becoming a general file-read oracle for a compromised page
   context. See the watch-relay row in the ledger above; like the settings channel it adds **no**
   manifest permission.

Both message listeners see every message and each returns `false` for anything that is not its own,
so they coexist without either hijacking the other's response channel.

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
in the browser's extension settings — a binary, user-controlled toggle. In Firefox (153+) the matching setting is
"Access local files on your computer", on Peekover's Permissions and data tab in about:addons. Peekover
requests no additional permission for this; it only declares the `file:///*.<ext>`
match patterns above, which take effect once the user grants that access. (This governs the
*content script* on `file://` pages; the app page's folder read is the separate user-gesture
capability documented in the ledger above, and does not use this toggle.) **That same single
toggle also gates the background's `file://` read**, so the watch relay is reachable exactly when
the content script is running and never otherwise — it grants the relay no access the user has not
already granted the reader. It is a browser UI setting, **not** a manifest permission, so nothing
here changes `permissions: []`.

## Zero-network evidence

`permissions: []` means the manifest requests no network capability — no `host_permissions`,
`webRequest`, or any fetch-granting permission. That is the manifest promise; the proof that Peekover
honors it is **behavioral**, on four surfaces:

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

- **Watch mode** issues **no network request** to start watching, to re-read a watched file, or to
  re-render it. `tests/browser/watchNetwork.browser.test.ts` asserts on the Resource Timing buffer —
  real Chromium and Firefox — that a full watch start → several ticks → stop produces **zero** http(s)
  entries, and, non-vacuously, that a live control fetch **does** register in the same test. It also
  pins the property that matters most on a raw `http(s)` page: the reader **never falls back to
  fetching its own URL** to re-read itself, which would put bytes on the wire from the one context
  with no network indicator. Watching is out of scope on network-loaded documents entirely, and the
  reader says so rather than offering a control that cannot work.

- **The edit save-back path** — opening the editor, the live preview, and Save, including its
  download fallback — makes **no network request** either.
  `tests/browser/editorNetwork.browser.test.ts` checks this in real Chromium and Firefox (the write
  itself on Chromium, the only engine that can write a file), and shows the check can see a request
  by placing a deliberate remote reference in the same view.

So the manifest requests no network capability, and the reader, folder mode, watch mode and edit
save-back are all **tested to make none**.

# PERMISSIONS.md — every manifest line, justified
*Rule (AGENTS.md #4): a permission change and its justification land in the same PR.*

Peekover requests **no** `permissions`, `host_permissions`, `webRequest`, or `tabs`.
All host access comes solely from the content script's `matches` list below. On any
non-matching page the content script does literally nothing. The in-script
`isRenderableContext()` gate narrows these coarse host matches to actual markdown
resources before any DOM is touched.

## `content_scripts.matches`

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
2026-07-14). The script itself (`entrypoints/background.ts`) is an empty scaffold: it registers no
listeners and makes no network calls, and exists purely to satisfy the MV3 background requirement.

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
match patterns above, which take effect once the user grants that access.

### Zero-network evidence
`permissions: []` means the manifest requests no network capability — no `host_permissions`,
`webRequest`, or any fetch-granting permission. That is the manifest promise; the proof that the
reader honors it is behavioral. The reader blocks remote resources by default: `src/render/mediaPolicy.ts`
neutralizes remote media before it can load. And `tests/browser/remoteMedia.browser.test.ts` asserts
at the request level — in real Chromium and Firefox — that opening a document with remote images
issues zero image requests before the user opts in. So the manifest requests no network capability,
and the reader is tested to make none.

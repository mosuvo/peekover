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

### Firefox data collection declaration
The Firefox build declares `browser_specific_settings.gecko.data_collection_permissions`
= `{ required: ["none"] }` — **Peekover collects no data** (AGENTS.md #1/#2). Mozilla
requires new extensions to declare their data practices; "none" is the collects-nothing
value, shown to the user at install time. This key is Firefox-only and never appears in
the Chrome manifest.

### file:// access note
Injecting on `file://` pages requires the user to grant "Allow access to file URLs"
in the browser's extension settings — a binary, user-controlled toggle. Peekover
requests no additional permission for this; it only declares the `file:///*.<ext>`
match patterns above, which take effect once the user grants that access.

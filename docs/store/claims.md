# Claims ledger — Peekover

Every factual sentence Peekover publishes, with its evidence and its status (M13 task 1.2; plan D-12).
Surfaces so far: README.md (README) and docs/trust/SECURITY.md (SECURITY). The site joins at task 1.3,
PRIVACY.md and THREAT-MODEL.md at 7.2, the store text at 7.5. Group 9 (task 9.2) re-checks every row
against the finished build, and a sentence without evidence is cut.

Status is one of: **true now** (evidence is a test, a code path or a record), **live at release** (a
URL or channel that exists once the repository and site are public), **planned** (a task names it), or
**withdrawn** (removed from the surface; kept here as the record). `tests/truthPins.test.ts` checks that
every sentence of each surface has a row here, that every "true now" row has evidence, and that every
path named as evidence exists.

| # | Surface | Sentence | Evidence | Status |
|---|---|---|---|---|
| 1 | README | Peekover is a free, open-source browser extension that shows raw markdown files as formatted pages you can read. | `LICENSE`, `package.json` (license MIT); `src/render/runReader.ts`, `src/render/mount.ts` | true now |
| 2 | README | It works on markdown files opened from your own disk and on raw files from GitHub, GitLab and Bitbucket. | `entrypoints/peekover.content.ts` (matches), `tests/manifest.test.ts` | true now |
| 3 | README | It asks for no browser permissions and makes no network requests unless you ask it to. | `tests/manifest.test.ts` (`permissions: []`); `tests/browser/folderMode.network.browser.test.ts`, `tests/browser/tocNetwork.browser.test.ts`, `tests/browser/tableNetwork.browser.test.ts`, `tests/browser/watchNetwork.browser.test.ts`, `tests/browser/codeNetwork.browser.test.ts`, `tests/browser/diagramNetwork.browser.test.ts`, `tests/browser/mathNetwork.browser.test.ts`, `tests/browser/exportNetwork.browser.test.ts`, `tests/browser/editorNetwork.browser.test.ts`; network only on opt-in: `tests/browser/remoteMedia.browser.test.ts` | true now |
| 4 | README | Peekover is not in any browser store yet. | no store listing exists; listings are task 7.5 in `specs/013-first-release/tasks.md` | true now |
| 5 | README | To try it, build it from source (below). | README "Build from source"; commands run 2026-11-01, M13 task 1.2 (`docs/ai/decisions.md`, "M13 TASK 1.2") | true now |
| 6 | README | Renders markdown with tables, task lists, strikethrough and bare-URL links. | `src/render/parse.ts` (table, strikethrough, linkify, task lists), `tests/golden/golden.test.ts` | true now |
| 7 | README | Cleans every rendered page with DOMPurify before it is shown. | `src/render/sanitize.ts`, `tests/browser/sanitize.browser.test.ts` | true now |
| 8 | README | Takes over markdown files opened from disk (.md and similar extensions) and raw files on raw.githubusercontent.com, gist.githubusercontent.com, GitLab and Bitbucket. | `entrypoints/peekover.content.ts`, `src/detect/isRenderableContext.ts`, `tests/manifest.test.ts` | true now |
| 9 | README | Shows a table of contents for documents with two or more headings. | `src/render/tocView.ts` (no rail below two headings), `tests/browser/tocScroll.browser.test.ts` | true now |
| 10 | README | Lets you sort, filter and copy tables. | `src/render/tableTools.ts`, `tests/browser/tableTools.browser.test.ts`, `tests/browser/tableFilter.browser.test.ts`, `tests/browser/tableCopy.browser.test.ts` | true now |
| 11 | README | Has light and dark themes and follows your system setting by default. | `src/settings/settings.ts` (default Auto), `tests/browser/themeRuntime.browser.test.ts` | true now |
| 12 | README | Blocks remote images until you choose to load them. | `src/render/mediaPolicy.ts`, `tests/browser/remoteMedia.browser.test.ts` | true now |
| 13 | README | Has an app page, opened from the toolbar button, where you open a folder and browse its markdown files. | `entrypoints/background.ts` (toolbar opens the app page), `src/app/appShell.ts`, `tests/browser/folderGrant.browser.test.ts` | true now |
| 14 | README | Can watch a file and update the view when it changes on disk. | `src/watch/watchController.ts`, `tests/browser/watchLifecycle.browser.test.ts` | true now |
| 15 | README | While watching, keeps snapshots of the document on your device, which you can turn off. | `src/app/captureFlag.ts` (default on, a Stored data toggle), `src/app/snapshots.ts`, `tests/browser/snapshotCapture.browser.test.ts` | true now |
| 16 | README | Compares a document with one of its snapshots or with another file in the folder. | `src/render/diffChrome.ts`, `tests/browser/diffChrome.browser.test.ts` | true now |
| 17 | README | On the app page, draws Mermaid diagrams, renders math with Temml, and highlights code in JavaScript, Python, JSON, CSS, HTML and Bash. | `src/render/diagramImportFence.test.ts`, `src/render/mathImportFence.test.ts`, `src/render/codeImportFence.test.ts`; languages: `src/render/codeEngine.ts` (LANGUAGE_LOADERS) | true now |
| 18 | README | Exports a standalone HTML file, prints to PDF, and copies the document as HTML, plain text or rich text. | `src/app/exportControls.ts`, `tests/browser/htmlExport.browser.test.ts`, `tests/browser/pdfExport.browser.test.ts`, `tests/browser/copyAsHtml.browser.test.ts`, `tests/browser/copyAsPlainText.browser.test.ts`, `tests/browser/copyAsRichText.browser.test.ts` | true now |
| 19 | README | Has a basic editor with a live preview and a Save button, and asks before discarding unsaved changes. | `src/render/editorEngine.ts`, `tests/browser/editorSave.browser.test.ts`, `tests/browser/editorUnsaved.browser.test.ts` | true now |
| 20 | README | Diagrams, math and code highlighting work on the app page only, not when a file is opened directly in a tab. | `src/render/diagramImportFence.test.ts`, `src/render/mathImportFence.test.ts`, `src/render/codeImportFence.test.ts` | true now |
| 21 | README | In Chromium-based browsers such as Chrome and Edge, files opened from disk need the extension's "Allow access to file URLs" setting turned on. | `docs/trust/PERMISSIONS.md` ("file:// access note") | true now |
| 22 | README | Save writes the file back in Chromium-based browsers such as Chrome and Edge; in Firefox it downloads a copy instead. | `src/app/appShell.ts` (write, else download), `tests/browser/editorSave.browser.test.ts` | true now |
| 23 | README | In Firefox, watching does not work for a file opened directly from disk. | `src/watch/watchAvailability.ts`, `src/watch/watchAvailability.test.ts` | true now |
| 24 | README | In Firefox, on the app page, watching works for a folder dragged in but not for one chosen with the folder picker. | `src/watch/watchAvailability.ts` (drag reads fresh bytes; the picker is frozen), `src/watch/watchAvailability.test.ts` | true now |
| 25 | README | Opening a markdown file directly from disk in Firefox has not yet been checked on a real install. | `specs/013-first-release/plan.md` (§9 note 6: the Firefox file:// check is walked at 8.1) | true now |
| 26 | README | The extension requests no browser permissions: its manifest says permissions: []. | `tests/manifest.test.ts` | true now |
| 27 | README | It makes no network requests by default. | `tests/browser/folderMode.network.browser.test.ts`, `tests/browser/tocNetwork.browser.test.ts`, `tests/browser/tableNetwork.browser.test.ts`, `tests/browser/watchNetwork.browser.test.ts`, `tests/browser/codeNetwork.browser.test.ts`, `tests/browser/diagramNetwork.browser.test.ts`, `tests/browser/mathNetwork.browser.test.ts`, `tests/browser/exportNetwork.browser.test.ts`, `tests/browser/editorNetwork.browser.test.ts` | true now |
| 28 | README | It has no telemetry and no analytics. | `AGENTS.md` (non-negotiable 2); no request leaves by default: `tests/browser/folderMode.network.browser.test.ts`, `tests/browser/tocNetwork.browser.test.ts`, `tests/browser/tableNetwork.browser.test.ts`, `tests/browser/watchNetwork.browser.test.ts`, `tests/browser/codeNetwork.browser.test.ts`, `tests/browser/diagramNetwork.browser.test.ts`, `tests/browser/mathNetwork.browser.test.ts`, `tests/browser/exportNetwork.browser.test.ts`, `tests/browser/editorNetwork.browser.test.ts` | true now |
| 29 | README | Each capability it uses without a permission, such as reading a folder you pick, is listed in PERMISSIONS.md (docs/trust/PERMISSIONS.md). | `docs/trust/PERMISSIONS.md` | true now |
| 30 | README | How to report a security problem is in SECURITY.md (docs/trust/SECURITY.md). | `docs/trust/SECURITY.md` | true now |
| 31 | README | Listings in the Chrome, Firefox and Edge stores, for the first public release. | task 7.5 in `specs/013-first-release/tasks.md` | planned |
| 32 | README | For the first release: a check in CI that two builds of the same source produce the same files. | task 7.3 in `specs/013-first-release/tasks.md` | planned |
| 33 | README | For the first release: a one-page threat model and attestations on release files. | tasks 7.2 and 7.4 in `specs/013-first-release/tasks.md` | planned |
| 34 | README | For the first release: a privacy policy at https://peekover.dev/privacy/ and a website at https://peekover.dev, neither online yet. | `specs/013-first-release/plan.md` (§9 note 1, G-1); DNS and Pages are go-live steps | live at release |
| 35 | README | Not scheduled: DOCX and ZIP export, on-device and bring-your-own-key AI features, and publishing. | `specs/013-first-release/spec.md` (§6, out of scope for the first release) | true now |
| 36 | README | You need Node 22 (the version in .nvmrc) and pnpm 10.33.0 (the version in package.json's packageManager field; corepack enable provides it). | `.nvmrc`, `package.json` (packageManager) | true now |
| 37 | README | pnpm build writes the Chromium build (for Chrome and Edge) to .output/chrome-mv3, and the Firefox command writes .output/firefox-mv3. | `wxt.config.ts`; both builds run 2026-11-01, M13 task 1.2 | true now |
| 38 | README | To load it in Chrome or Edge, turn on Developer mode on the extensions page and choose "Load unpacked" with .output/chrome-mv3. | the browser's own unpacked-extension flow; walked on a real install by the human at 8.1 (`specs/013-first-release/tasks.md`) | true now |
| 39 | README | To load it in Firefox, open about:debugging, choose "This Firefox", then "Load Temporary Add-on", and pick .output/firefox-mv3/manifest.json. | the browser's own temporary add-on flow; walked on a real install by the human at 8.1 (`specs/013-first-release/tasks.md`) | true now |
| 40 | README | pnpm test runs the unit tests and pnpm lint runs the linter and the type check. | `package.json` (scripts test, lint) | true now |
| 41 | README | Peekover is released under the MIT licence (see LICENSE (LICENSE)). | `LICENSE` | true now |
| 42 | README | It is free: there is no price, no paid tier and no ads. | `AGENTS.md` (non-negotiable 6) | true now |
| 43 | SECURITY | Report security problems through GitHub private vulnerability reporting on this repository. | `specs/013-first-release/plan.md` (§9 note 1, G-1: GitHub private vulnerability reporting, live when the repo is public) | live at release |
| 44 | SECURITY | That channel opens when the repository becomes public at the first release; until then the repository is private. | `docs/ai/decisions.md` ("M13 GATE 1 APPROVED", Q15: the repo goes public at release) | true now |
| 45 | SECURITY | For anything that is not a security problem, open a GitHub issue once the repository is public. | `specs/013-first-release/plan.md` (§9 note 1, G-1: contact via GitHub issues) | live at release |
| 46 | SECURITY | The extension requests no browser permissions and no host permissions, on Chrome and on Firefox. | `tests/manifest.test.ts` (both engines: `permissions: []`, no host_permissions) | true now |
| 47 | SECURITY | Each capability it uses without a permission is listed in PERMISSIONS.md (PERMISSIONS.md). | `docs/trust/PERMISSIONS.md`, `tests/permissionsLedger.test.ts` | true now |
| 48 | SECURITY | It makes no network requests by default; browser tests check this on each surface. | `tests/browser/folderMode.network.browser.test.ts`, `tests/browser/tocNetwork.browser.test.ts`, `tests/browser/tableNetwork.browser.test.ts`, `tests/browser/watchNetwork.browser.test.ts`, `tests/browser/codeNetwork.browser.test.ts`, `tests/browser/diagramNetwork.browser.test.ts`, `tests/browser/mathNetwork.browser.test.ts`, `tests/browser/exportNetwork.browser.test.ts`, `tests/browser/editorNetwork.browser.test.ts` | true now |
| 49 | SECURITY | Remote images stay blocked until you choose to load them. | `src/render/mediaPolicy.ts`, `tests/browser/remoteMedia.browser.test.ts` | true now |
| 50 | SECURITY | Every rendered page is cleaned with DOMPurify before it is shown. | `src/render/sanitize.ts`, `tests/browser/sanitize.browser.test.ts` | true now |
| 51 | SECURITY | CI checks that every code import in the shipped code is fixed at build time, so no code is loaded from outside the extension package. | `scripts/check-dynamic-imports.ts` (static specifiers only), `.github/workflows/supply-chain.yml` (job remote-code) | true now |
| 52 | SECURITY | CI fails on a known advisory in the production dependencies, except one recorded exception in a dependency of the diagram library. | `.github/workflows/supply-chain.yml` (`pnpm audit --prod --audit-level low`), `package.json` (auditConfig, one ignoreGhsas entry), `docs/ai/decisions.md` ("M12 TASK 1.3") | true now |
| 53 | SECURITY | CI generates a software bill of materials. | `scripts/generate-sbom.ts`, `.github/workflows/supply-chain.yml` (job sbom) | true now |
| 54 | SECURITY | A check in CI that two builds of the same source produce the same files, with the steps written down. | task 7.3 in `specs/013-first-release/tasks.md` | planned |
| 55 | SECURITY | A one-page threat model naming the tests behind each defence. | task 7.2 in `specs/013-first-release/tasks.md` | planned |
| 56 | SECURITY | Build attestations on release files. | task 7.4 in `specs/013-first-release/tasks.md` (attestations need a public repository on this plan, G-9) | planned |
| 57 | SECURITY | A privacy policy at https://peekover.dev/privacy/, not online yet. | `specs/013-first-release/plan.md` (§9 note 1, G-1); site/privacy/ is built at 7.2 (not yet) | live at release |
| 58 | README | **Raw in. Reading out.** | a slogan, not a claim; dropped | withdrawn |
| 59 | README | The free, open-source browser extension that turns raw markdown — including the piles of it your AI agents write — into beautiful, instant reading. | "beautiful, instant" has no evidence; replaced by a plain description | withdrawn |
| 60 | README | Zero network calls. | replaced: "makes no network requests by default" (with its tests) | withdrawn |
| 61 | README | No telemetry. | replaced: "no telemetry and no analytics" (with its evidence) | withdrawn |
| 62 | README | Free means free, permanently. | "permanently" is a promise no test can back; replaced by what is true now | withdrawn |
| 63 | README | Status: pre-release, building milestone 1 in the open. | false: twelve milestones have shipped | withdrawn |
| 64 | README | Site: https://peekover.dev | presented the site as live; now under "Planned", marked not online yet | withdrawn |
| 65 | README | No price, no tiers · no ads, no funnels | replaced: "no price, no paid tier and no ads" | withdrawn |
| 66 | README | never sold (an ownership change voids the listing — expect releases only from this repo) | there is no listing; a promise about the future, not a fact | withdrawn |
| 67 | README | yours to inspect (MIT, reproducible builds, annotated permissions) | reproducible builds are not built yet (7.3); MIT and PERMISSIONS kept separately | withdrawn |
| 68 | README | See AGENTS.md (works for humans too). `pnpm dev` once milestone 1 lands. | replaced by working build-from-source steps | withdrawn |
| 69 | README | Note: no relation to a 2021 npm typosquat package that npm removed, nor to any similarly named mobile apps — this project lives here and at peekover.dev, nowhere else. | no evidence on record; peekover.dev is not online yet | withdrawn |
| 70 | SECURITY | Report vulnerabilities: hello@peekover.dev (48h ack target). | the address is not a working channel (G-1); no response-time promise without a channel | withdrawn |
| 71 | SECURITY | Hall of fame below. | no reporting channel is open yet | withdrawn |
| 72 | SECURITY | Architecture promises (no servers, zero network default, no telemetry, no remote code, reproducible builds) are documented in the spec §6 and verified in CI as they land. | reproducible builds are not built (7.3); each true item is now listed with its own evidence | withdrawn |

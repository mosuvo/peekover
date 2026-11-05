# Claims ledger — Peekover

Every factual sentence Peekover publishes, with its evidence and its status (M13 task 1.2; plan D-12).
Surfaces so far: README.md (README), docs/trust/SECURITY.md (SECURITY) and site/index.html (site, task 1.3),
with PRIVACY.md and THREAT-MODEL.md at 7.2 and the store text at 7.5. Group 9 (task 9.2) re-checks every row
against the finished build, and a sentence without evidence is cut.

Status is one of: **true now** (evidence is a test, a code path or a record), **live at release** (a
URL or channel that exists once the repository and site are public), **planned** (a task names it), or
**withdrawn** (removed from the surface; kept here as the record). `tests/truthPins.test.ts` checks that
every sentence of each surface has a row here, that every "true now" row has evidence, and that every
path named as evidence exists.

| # | Surface | Sentence | Evidence | Status |
|---|---|---|---|---|
| 1 | README | Peekover is a free, open-source browser extension that turns raw markdown files into formatted, readable pages. | `LICENSE`, `package.json` (license MIT); `src/render/runReader.ts`, `src/render/mount.ts` | true now |
| 2 | README | It works on markdown files opened from your own disk and on raw files from GitHub, GitLab and Bitbucket. | `entrypoints/peekover.content.ts` (matches), `tests/manifest.test.ts` | true now |
| 3 | README | It asks for no browser permissions and makes no network requests unless you ask it to. | `tests/manifest.test.ts` (`permissions: []`); `tests/browser/folderMode.network.browser.test.ts`, `tests/browser/tocNetwork.browser.test.ts`, `tests/browser/tableNetwork.browser.test.ts`, `tests/browser/watchNetwork.browser.test.ts`, `tests/browser/codeNetwork.browser.test.ts`, `tests/browser/diagramNetwork.browser.test.ts`, `tests/browser/mathNetwork.browser.test.ts`, `tests/browser/exportNetwork.browser.test.ts`, `tests/browser/editorNetwork.browser.test.ts`; network only on opt-in: `tests/browser/remoteMedia.browser.test.ts` | true now |
| 4 | README | Peekover is not in any browser store yet. | no store listing exists; listings are task 7.5 in `specs/013-first-release/tasks.md` | true now |
| 5 | README | To try it, build it from source (below). | README "Build from source"; commands run 2026-11-01, M13 task 1.2 (`docs/ai/decisions.md`, "M13 TASK 1.2") | true now |
| 6 | README | Renders markdown with tables, task lists, strikethrough and bare-URL links. | both surfaces: `src/render/parse.ts` (table, strikethrough, linkify, task lists), `tests/golden/golden.test.ts` | true now |
| 7 | README | Cleans every rendered page with DOMPurify before it is shown. | both surfaces: `src/render/sanitize.ts`, `tests/browser/sanitize.browser.test.ts` | true now |
| 8 | README | Renders markdown files opened from disk (.md and similar extensions) and raw files on raw.githubusercontent.com, gist.githubusercontent.com, GitLab and Bitbucket. | tabs: `entrypoints/peekover.content.ts`, `src/detect/isRenderableContext.ts`, `src/render/mountReader.ts`, `tests/manifest.test.ts` | true now |
| 9 | README | Shows a table of contents for documents with two or more headings. | both surfaces (built in `src/render/mount.ts`): `src/render/tocView.ts` (no rail below two headings), `tests/browser/tocScroll.browser.test.ts` | true now |
| 10 | README | Lets you sort, filter and copy tables. | both surfaces (`src/render/mountReader.ts` and `src/app/readerPane.ts` call the table enhancer): `src/render/tableTools.ts`, `tests/browser/tableTools.browser.test.ts`, `tests/browser/tableFilter.browser.test.ts`, `tests/browser/tableCopy.browser.test.ts` | true now |
| 11 | README | Has light and dark themes and follows your system setting by default. | both surfaces (`src/render/mount.ts` builds the theme control): `src/settings/settings.ts` (default Auto), `tests/browser/themeRuntime.browser.test.ts` | true now |
| 12 | README | Blocks remote images until you choose to load them. | both surfaces: `src/render/mediaPolicy.ts`, `src/render/remoteMediaUi.ts`, `tests/browser/remoteMedia.browser.test.ts` | true now |
| 13 | README | Has an app page, opened from the toolbar button, where you open a folder and browse its markdown files. | app page: `entrypoints/background.ts` (the toolbar opens it), `src/app/appShell.ts`, `tests/browser/folderGrant.browser.test.ts` | true now |
| 14 | README | Can watch a document and update the view when it changes on disk, on the app page and in a tab showing a file opened from disk. | app page: `src/app/appShell.ts`, `tests/browser/watchLifecycle.browser.test.ts`; tabs: `src/watch/contentWatch.ts` with `src/watch/watchRelay.ts` (file:// only), `tests/browser/watchContentWiring.browser.test.ts` | true now |
| 15 | README | On the app page, while watching, keeps snapshots of the document on your device, which you can turn off. | app page only: `src/app/captureFlag.ts` (default on, a Stored data toggle), `tests/browser/snapshotCapture.browser.test.ts`; the tab watcher captures nothing (`src/watch/contentWatch.ts`, docId null) | true now |
| 16 | README | On the app page, compares a document with one of its snapshots or with another file in the folder. | app page only (only `src/app/appShell.ts` registers the diff context): `src/render/diffChrome.ts`, `tests/browser/diffChrome.browser.test.ts` | true now |
| 17 | README | On the app page, draws Mermaid diagrams, renders math with Temml, and highlights code in JavaScript, TypeScript, TSX, Python, JSON, CSS, HTML, Bash, diff, YAML, Markdown, TOML and SQL. | app page only: `src/render/diagramImportFence.test.ts`, `src/render/mathImportFence.test.ts`, `src/render/codeImportFence.test.ts`; languages: `src/render/codeEngine.ts` (LANGUAGE_LOADERS), `tests/browser/codeLanguages.browser.test.ts` | true now |
| 18 | README | On the app page, exports a standalone HTML file, prints to PDF, and copies the document as HTML, plain text or rich text. | app page only (`src/app/exportControls.ts`, used by `src/app/appShell.ts`): `tests/browser/htmlExport.browser.test.ts`, `tests/browser/pdfExport.browser.test.ts`, `tests/browser/copyAsHtml.browser.test.ts`, `tests/browser/copyAsPlainText.browser.test.ts`, `tests/browser/copyAsRichText.browser.test.ts` | true now |
| 19 | README | On the app page, has a basic editor with a live preview and a Save button, and asks before discarding unsaved changes. | app page only (the Edit control is built by `src/app/readerPane.ts` / `src/app/appShell.ts`): `src/render/editorEngine.ts`, `tests/browser/editorSave.browser.test.ts`, `tests/browser/editorUnsaved.browser.test.ts` | true now |
| 20 | README | In a tab, snapshots, comparison, diagrams, math, code highlighting, export and editing are not available; open the document on the app page for those. | the five app-page-only rows above (snapshots, comparison, diagrams / math / code, export, editor); `src/render/diagramImportFence.test.ts`, `src/render/mathImportFence.test.ts`, `src/render/codeImportFence.test.ts` | true now |
| 21 | README | Watching does not work for raw files from GitHub, GitLab or Bitbucket. | `src/watch/watchAvailability.ts` (case c: remote raw hosts), `src/watch/watchRelay.ts` (refuses non-file:// URLs) | true now |
| 22 | README | In Chromium-based browsers such as Chrome and Edge, files opened from disk need the extension's "Allow access to file URLs" setting turned on. | `docs/trust/PERMISSIONS.md` ("file:// access note") | true now |
| 23 | README | Save writes the file back in Chromium-based browsers such as Chrome and Edge; in Firefox it downloads a copy instead. | `src/app/appShell.ts` (write, else download), `tests/browser/editorSave.browser.test.ts` | true now |
| 24 | README | In Firefox, watching does not work for a file opened directly from disk. | `src/watch/watchAvailability.ts`, `src/watch/watchAvailability.test.ts` | true now |
| 25 | README | In Firefox, on the app page, watching works for a folder dragged in but not for one chosen with the folder picker. | `src/watch/watchAvailability.ts` (drag reads fresh bytes; the picker is frozen), `src/watch/watchAvailability.test.ts` | true now |
| 26 | README | Opening a markdown file directly from disk in Firefox has not yet been checked on a real install. | `specs/013-first-release/plan.md` (§9 note 6: the Firefox file:// check is walked at 8.1). REMOVE OR UPDATE AFTER 8.1 | true now |
| 27 | README | The extension requests no browser permissions: its manifest says permissions: []. | `tests/manifest.test.ts` | true now |
| 28 | README | It makes no network requests by default. | `tests/browser/folderMode.network.browser.test.ts`, `tests/browser/tocNetwork.browser.test.ts`, `tests/browser/tableNetwork.browser.test.ts`, `tests/browser/watchNetwork.browser.test.ts`, `tests/browser/codeNetwork.browser.test.ts`, `tests/browser/diagramNetwork.browser.test.ts`, `tests/browser/mathNetwork.browser.test.ts`, `tests/browser/exportNetwork.browser.test.ts`, `tests/browser/editorNetwork.browser.test.ts` | true now |
| 29 | README | It has no telemetry and no analytics. | `AGENTS.md` (non-negotiable 2); no request leaves by default: `tests/browser/folderMode.network.browser.test.ts`, `tests/browser/tocNetwork.browser.test.ts`, `tests/browser/tableNetwork.browser.test.ts`, `tests/browser/watchNetwork.browser.test.ts`, `tests/browser/codeNetwork.browser.test.ts`, `tests/browser/diagramNetwork.browser.test.ts`, `tests/browser/mathNetwork.browser.test.ts`, `tests/browser/exportNetwork.browser.test.ts`, `tests/browser/editorNetwork.browser.test.ts` | true now |
| 30 | README | Each capability it uses without a permission, such as reading a folder you pick, is listed in PERMISSIONS.md (docs/trust/PERMISSIONS.md). | `docs/trust/PERMISSIONS.md` | true now |
| 31 | README | How to report a security problem is in SECURITY.md (docs/trust/SECURITY.md). | `docs/trust/SECURITY.md` | true now |
| 32 | README | For the first public release: | the label of the first-release group; tasks 7.2 to 7.5 in `specs/013-first-release/tasks.md` | planned |
| 33 | README | Listings in the Chrome, Firefox and Edge stores. | task 7.5 in `specs/013-first-release/tasks.md` | planned |
| 34 | README | A check in CI that two builds of the same source produce the same files. | task 7.3 in `specs/013-first-release/tasks.md` | planned |
| 35 | README | A one-page threat model, and attestations on release files. | tasks 7.2 and 7.4 in `specs/013-first-release/tasks.md` | planned |
| 36 | README | A privacy policy at https://peekover.dev/privacy/ and a website at https://peekover.dev, neither online yet. | `specs/013-first-release/plan.md` (§9 note 1, G-1); DNS and Pages are go-live steps | live at release |
| 37 | README | Later, not yet scheduled: | the label of the unscheduled group; out of scope for the first release: `specs/013-first-release/spec.md` (§6) | planned |
| 38 | README | DOCX and ZIP export, AI features, and publishing. | not built, not scheduled: `specs/013-first-release/spec.md` (§6, out of scope for the first release) | planned |
| 39 | README | You need Node 22 (the version in .nvmrc) and pnpm 10.33.0 (the version in package.json's packageManager field; corepack enable provides it). | `.nvmrc`, `package.json` (packageManager) | true now |
| 40 | README | pnpm build writes the Chromium build (for Chrome and Edge) to .output/chrome-mv3, and the Firefox command writes .output/firefox-mv3. | `wxt.config.ts`; both builds run 2026-11-01, M13 task 1.2 | true now |
| 41 | README | To load it in Chrome or Edge, turn on Developer mode on the extensions page and choose "Load unpacked" with .output/chrome-mv3. | the browser's own unpacked-extension flow; walked on a real install by the human at 8.1 (`specs/013-first-release/tasks.md`) | true now |
| 42 | README | To load it in Firefox, open about:debugging, choose "This Firefox", then "Load Temporary Add-on", and pick .output/firefox-mv3/manifest.json. | the browser's own temporary add-on flow; walked on a real install by the human at 8.1 (`specs/013-first-release/tasks.md`) | true now |
| 43 | README | pnpm test runs the unit tests and pnpm lint runs the linter and the type check. | `package.json` (scripts test, lint) | true now |
| 44 | README | Peekover is released under the MIT licence (see LICENSE (LICENSE)). | `LICENSE` | true now |
| 45 | README | It is free: there is no price, no paid tier and no ads. | `AGENTS.md` (non-negotiable 6) | true now |
| 46 | SECURITY | Report security problems through GitHub private vulnerability reporting on this repository. | `specs/013-first-release/plan.md` (§9 note 1, G-1: GitHub private vulnerability reporting, live when the repo is public) | live at release |
| 47 | SECURITY | That channel opens when the repository becomes public at the first release; until then the repository is private. | `docs/ai/decisions.md` ("M13 GATE 1 APPROVED", Q15: the repo goes public at release) | true now |
| 48 | SECURITY | For anything that is not a security problem, open a GitHub issue once the repository is public. | `specs/013-first-release/plan.md` (§9 note 1, G-1: contact via GitHub issues) | live at release |
| 49 | SECURITY | The extension requests no browser permissions and no host permissions, on Chrome and on Firefox. | `tests/manifest.test.ts` (both engines: `permissions: []`, no host_permissions) | true now |
| 50 | SECURITY | Each capability it uses without a permission is listed in PERMISSIONS.md (PERMISSIONS.md). | `docs/trust/PERMISSIONS.md`, `tests/permissionsLedger.test.ts` | true now |
| 51 | SECURITY | It makes no network requests by default; browser tests check this on each surface. | `tests/browser/folderMode.network.browser.test.ts`, `tests/browser/tocNetwork.browser.test.ts`, `tests/browser/tableNetwork.browser.test.ts`, `tests/browser/watchNetwork.browser.test.ts`, `tests/browser/codeNetwork.browser.test.ts`, `tests/browser/diagramNetwork.browser.test.ts`, `tests/browser/mathNetwork.browser.test.ts`, `tests/browser/exportNetwork.browser.test.ts`, `tests/browser/editorNetwork.browser.test.ts` | true now |
| 52 | SECURITY | Remote images stay blocked until you choose to load them. | `src/render/mediaPolicy.ts`, `tests/browser/remoteMedia.browser.test.ts` | true now |
| 53 | SECURITY | Every rendered page is cleaned with DOMPurify before it is shown. | `src/render/sanitize.ts`, `tests/browser/sanitize.browser.test.ts` | true now |
| 54 | SECURITY | CI checks that every code import in the shipped code is fixed at build time, so no code is loaded from outside the extension package. | `scripts/check-dynamic-imports.ts` (static specifiers only), `.github/workflows/supply-chain.yml` (job remote-code) | true now |
| 55 | SECURITY | CI fails on a known advisory in the production dependencies, except one recorded exception in a dependency of the diagram library. | `.github/workflows/supply-chain.yml` (`pnpm audit --prod --audit-level low`), `package.json` (auditConfig, one ignoreGhsas entry), `docs/ai/decisions.md` ("M12 TASK 1.3") | true now |
| 56 | SECURITY | CI generates a software bill of materials. | `scripts/generate-sbom.ts`, `.github/workflows/supply-chain.yml` (job sbom) | true now |
| 57 | SECURITY | A check in CI that two builds of the same source produce the same files, with the steps written down. | task 7.3 in `specs/013-first-release/tasks.md` | planned |
| 58 | SECURITY | A one-page threat model naming the tests behind each defence. | task 7.2 in `specs/013-first-release/tasks.md` | planned |
| 59 | SECURITY | Build attestations on release files. | task 7.4 in `specs/013-first-release/tasks.md` (attestations need a public repository on this plan, G-9) | planned |
| 60 | SECURITY | A privacy policy at https://peekover.dev/privacy/, not online yet. | `specs/013-first-release/plan.md` (§9 note 1, G-1); site/privacy/ is built at 7.2 (not yet) | live at release |
| 61 | site | Peekover | a label (heading, navigation or category name); the card or section under it carries the claim | true now |
| 62 | site | Agent output Reading Editor Security Planned | a label (heading, navigation or category name); the card or section under it carries the claim | true now |
| 63 | site | GitHub (https://github.com/mosuvo/peekover) Not in stores yet — build from source | the repository is private until the first release (`docs/ai/decisions.md`, "M13 GATE 1 APPROVED", Q15); repo links per F-3 (`specs/013-first-release/tasks.md`). UPDATE AT GO-LIVE (replace with the real store links; a go-live step, `docs/ai/progress.md`, carried for 7.6). | live at release |
| 64 | site | Agent output Reading Editor Security Planned GitHub (https://github.com/mosuvo/peekover) | the repository is private until the first release (`docs/ai/decisions.md`, "M13 GATE 1 APPROVED", Q15); repo links per F-3 (`specs/013-first-release/tasks.md`) | live at release |
| 65 | site | PEEK OVER YOUR DOCS | the product's name read as a phrase; a section label; the sentences under it carry the claims | true now |
| 66 | site | Raw in. | a label (heading, navigation or category name); the card or section under it carries the claim | true now |
| 67 | site | Reading out. | a label (heading, navigation or category name); the card or section under it carries the claim | true now |
| 68 | site | Peekover is a free, open-source browser extension that turns raw markdown files into formatted, readable pages, including the ones your AI agents write. | `LICENSE`, `src/render/runReader.ts`, `src/render/mount.ts`; the README's first sentence (`README.md`) | true now |
| 69 | site | It asks for no browser permissions and makes no network requests unless you ask it to. | `tests/manifest.test.ts`; `tests/browser/folderMode.network.browser.test.ts`, `tests/browser/tocNetwork.browser.test.ts`, `tests/browser/tableNetwork.browser.test.ts`, `tests/browser/watchNetwork.browser.test.ts`, `tests/browser/exportNetwork.browser.test.ts`, `tests/browser/editorNetwork.browser.test.ts`; opt-in only: `tests/browser/remoteMedia.browser.test.ts` | true now |
| 70 | site | Not in stores yet — build from source Build it from the repository (https://github.com/mosuvo/peekover#build-from-source) See everything ↓ | no listing exists (task 7.5, `specs/013-first-release/tasks.md`); README "Build from source" (`README.md`); the repository is private until the first release (`docs/ai/decisions.md`, "M13 GATE 1 APPROVED", Q15); repo links per F-3 (`specs/013-first-release/tasks.md`). UPDATE AT GO-LIVE (replace with the real store links; a go-live step, `docs/ai/progress.md`, carried for 7.6). | live at release |
| 71 | site | open source · MIT no servers no telemetry no permissions Chrome · Edge · Firefox | `LICENSE`; no backend exists; `AGENTS.md` (non-negotiable 2); `tests/manifest.test.ts`; Chromium and Firefox builds (`wxt.config.ts`), Edge takes the Chromium build (`docs/ai/decisions.md`, gate 1 Q20) | true now |
| 72 | site | ← live demo · flips itself, or use the toggle | the page's own behaviour: `site/index.html` (its script) (setDemo) | true now |
| 73 | site | MARKDOWN → READING ✦ WATCH MODE ✦ NO NETWORK BY DEFAULT ✦ FREE ✦ OPEN SOURCE ✦ NO PERMISSIONS ✦ MARKDOWN → READING ✦ WATCH MODE ✦ NO NETWORK BY DEFAULT ✦ FREE ✦ OPEN SOURCE ✦ NO PERMISSIONS ✦ | `src/watch/watchController.ts`; `tests/browser/folderMode.network.browser.test.ts`, `tests/browser/tocNetwork.browser.test.ts`, `tests/browser/tableNetwork.browser.test.ts`, `tests/browser/watchNetwork.browser.test.ts`, `tests/browser/exportNetwork.browser.test.ts`, `tests/browser/editorNetwork.browser.test.ts`; `AGENTS.md` (non-negotiable 6); `LICENSE`; `tests/manifest.test.ts` | true now |
| 74 | site | FOR AGENT OUTPUT | a section label; the sentences under it carry the claims | true now |
| 75 | site | Your agents write markdown all night. | a label (heading, navigation or category name); the card or section under it carries the claim | true now |
| 76 | site | This is where you read it. | a label (heading, navigation or category name); the card or section under it carries the claim | true now |
| 77 | site | Coding agents write CLAUDE.md files, specs, plans and changelogs faster than anyone can read them raw. | the problem the product addresses, not a product claim (`docs/product/spec.md`, §3 personas) | true now |
| 78 | site | Peekover renders them, and on the app page it can watch them and show what changed. | `src/render/mount.ts`; app page: `src/app/appShell.ts`, `tests/browser/watchLifecycle.browser.test.ts`, `tests/browser/diffChrome.browser.test.ts` | true now |
| 79 | site | Watch mode | a label (heading, navigation or category name); the card or section under it carries the claim | true now |
| 80 | site | Leave a document open and it re-renders when the file changes on disk, keeping your reading position. | `src/watch/watchController.ts`, `src/render/readingAnchor.ts`, `tests/browser/watchAnchor.browser.test.ts` | true now |
| 81 | site | It works on the app page, and in Chromium-based browsers also in a tab showing a file opened from disk. | `src/watch/contentWatch.ts`, `src/watch/watchRelay.ts` (file:// only), `tests/browser/watchContentWiring.browser.test.ts` | true now |
| 82 | site | Firefox has some limits; the README lists them. | `src/watch/watchAvailability.ts` (the Firefox cases); `README.md` ("Limits") | true now |
| 83 | site | What changed | a label (heading, navigation or category name); the card or section under it carries the claim | true now |
| 84 | site | On the app page, Peekover keeps snapshots on your device while it watches a document, and shows what changed since one of them. | app page only: `src/app/captureFlag.ts`, `tests/browser/snapshotCapture.browser.test.ts`, `src/render/diffChrome.ts`, `tests/browser/diffChrome.browser.test.ts` | true now |
| 85 | site | Compare two files | a label (heading, navigation or category name); the card or section under it carries the claim | true now |
| 86 | site | On the app page, pick another markdown file in the folder and read the difference. | app page only (`src/app/appShell.ts` registers the diff context): `tests/browser/diffChrome.browser.test.ts` | true now |
| 87 | site | Agent-file badge | a label (heading, navigation or category name); the card or section under it carries the claim | true now |
| 88 | site | CLAUDE.md, AGENTS.md, spec.md, plan.md and tasks.md get a badge saying what kind of file they are. | `src/render/agentFile.ts` (AGENT_FILE_NAMES), `src/render/agentBadge.test.ts`, `tests/browser/agentBadge.browser.test.ts` | true now |
| 89 | site | READING | a section label; the sentences under it carry the claims | true now |
| 90 | site | Raw markdown in. | a label (heading, navigation or category name); the card or section under it carries the claim | true now |
| 91 | site | A page out. | a label (heading, navigation or category name); the card or section under it carries the claim | true now |
| 92 | site | CommonMark with the GitHub additions for tables, task lists, strikethrough and bare links, cleaned before it reaches the page. | `src/render/parse.ts`, `src/render/sanitize.ts`, `tests/browser/sanitize.browser.test.ts` | true now |
| 93 | site | The syntax | a label (heading, navigation or category name); the card or section under it carries the claim | true now |
| 94 | site | Tables, task lists, strikethrough, bare-URL links and inline HTML, all cleaned with DOMPurify before they are shown. | `src/render/parse.ts` (html: true), `src/render/sanitize.ts`, `tests/browser/sanitize.browser.test.ts` | true now |
| 95 | site | Math & diagrams | a label (heading, navigation or category name); the card or section under it carries the claim | true now |
| 96 | site | On the app page: math rendered with Temml, Mermaid diagrams with a zoom view, and buttons to copy a formula as LaTeX or MathML and to copy or download a diagram. | app page only: `src/render/diagramImportFence.test.ts`, `src/render/mathImportFence.test.ts`, `src/render/codeImportFence.test.ts`; `tests/browser/diagramLightbox.browser.test.ts`, `tests/browser/mathActions.browser.test.ts`, `tests/browser/diagramActions.browser.test.ts` | true now |
| 97 | site | Code | a label (heading, navigation or category name); the card or section under it carries the claim | true now |
| 98 | site | On the app page: highlighting for JavaScript, TypeScript, TSX, Python, JSON, CSS, HTML, Bash, diff, YAML, Markdown, TOML and SQL, a choice of code themes, and copy, line numbers and wrap on each block. | app page only: `src/render/codeImportFence.test.ts`; `src/render/codeEngine.ts` (LANGUAGE_LOADERS, THEME_LOADERS); `tests/browser/codeToolbar.browser.test.ts`, `tests/browser/codeThemeControl.browser.test.ts`, `tests/browser/codeLanguages.browser.test.ts` | true now |
| 99 | site | Folders | a label (heading, navigation or category name); the card or section under it carries the claim | true now |
| 100 | site | On the app page, opened from the toolbar button: open a folder, browse its markdown files, pin files and reopen recent ones. | `entrypoints/background.ts`, `src/app/appShell.ts`, `src/app/recents.ts`, `src/app/recentsView.test.ts`, `tests/browser/folderGrant.browser.test.ts` | true now |
| 101 | site | Contents | a label (heading, navigation or category name); the card or section under it carries the claim | true now |
| 102 | site | A table of contents rail for documents with two or more headings. | `src/render/tocView.ts`, `tests/browser/tocScroll.browser.test.ts` | true now |
| 103 | site | Select a heading to jump to it. | `tests/browser/tocScroll.browser.test.ts` | true now |
| 104 | site | Tables | a label (heading, navigation or category name); the card or section under it carries the claim | true now |
| 105 | site | Sort, filter and copy any table. | both surfaces: `src/render/tableTools.ts`, `tests/browser/tableTools.browser.test.ts`, `tests/browser/tableFilter.browser.test.ts`, `tests/browser/tableCopy.browser.test.ts` | true now |
| 106 | site | Reading, your way | a label (heading, navigation or category name); the card or section under it carries the claim | true now |
| 107 | site | Light and dark themes that follow your system by default, a raw view, and the Literata reading face. | `src/settings/settings.ts` (default Auto), `tests/browser/themeRuntime.browser.test.ts`; `src/render/readerMode.ts`, `src/render/readerMode.test.ts`; `src/theme/fonts.ts` | true now |
| 108 | site | Never a blank page | a label (heading, navigation or category name); the card or section under it carries the claim | true now |
| 109 | site | If rendering fails, you get the raw text with an error banner. | `AGENTS.md` (non-negotiable 5), `src/render/mount.fallback.test.ts` | true now |
| 110 | site | The whole extension is under 7 MB. | `.output` 5,831,081 B (Chromium) / 5,831,197 B (Firefox), measured 2026-11-01 (`docs/ai/decisions.md`, "M13 TASK 1.4") | true now |
| 111 | site | Sources | a label (heading, navigation or category name); the card or section under it carries the claim | true now |
| 112 | site | Markdown files opened from disk, and raw files on GitHub, GitLab and Bitbucket. | `entrypoints/peekover.content.ts` (matches), `tests/manifest.test.ts` | true now |
| 113 | site | Remote images stay blocked until you choose to load them. | `src/render/mediaPolicy.ts`, `tests/browser/remoteMedia.browser.test.ts` | true now |
| 114 | site | ON THE APP PAGE | the #editor section's label: every card under it is app page only (`docs/ai/decisions.md`, "M13 TASK 1.2", addendum) | true now |
| 115 | site | A reader first. | a label (heading, navigation or category name); the card or section under it carries the claim | true now |
| 116 | site | An editor when you need it. | a label (heading, navigation or category name); the card or section under it carries the claim | true now |
| 117 | site | On the app page, Edit opens the markdown beside a live preview. | app page only: `src/app/readerPane.ts`, `src/render/editorEngine.ts`, `tests/browser/editorPreview.browser.test.ts` | true now |
| 118 | site | Editor | a label (heading, navigation or category name); the card or section under it carries the claim | true now |
| 119 | site | A plain markdown editor beside a live preview. | `src/render/editorEngine.ts`, `tests/browser/editorPreview.browser.test.ts` | true now |
| 120 | site | It asks before discarding unsaved changes. | `src/app/unsavedGuard.ts`, `tests/browser/editorUnsaved.browser.test.ts` | true now |
| 121 | site | Save | a label (heading, navigation or category name); the card or section under it carries the claim | true now |
| 122 | site | Save writes the file back in Chromium-based browsers such as Chrome and Edge; in Firefox it downloads a copy. | `src/app/appShell.ts` (write, else download), `tests/browser/editorSave.browser.test.ts` | true now |
| 123 | site | If the file changed on disk meanwhile, Save stops and tells you. | `tests/browser/editorSave.browser.test.ts` (the conflict case); `docs/ai/decisions.md` (R21) | true now |
| 124 | site | Snapshots | a label (heading, navigation or category name); the card or section under it carries the claim | true now |
| 125 | site | Kept on your device while a document is watched. | `src/app/snapshots.ts`, `tests/browser/snapshotCapture.browser.test.ts` | true now |
| 126 | site | Turn them off or erase them under Stored data. | `src/app/storageControls.ts`, `src/app/captureFlag.ts`, `tests/browser/eraseSnapshots.browser.test.ts` | true now |
| 127 | site | Export | a label (heading, navigation or category name); the card or section under it carries the claim | true now |
| 128 | site | A standalone HTML file, print to PDF, and copy as HTML, plain text or rich text. | `src/app/exportControls.ts`, `tests/browser/htmlExport.browser.test.ts`, `tests/browser/pdfExport.browser.test.ts`, `tests/browser/copyAsHtml.browser.test.ts`, `tests/browser/copyAsPlainText.browser.test.ts`, `tests/browser/copyAsRichText.browser.test.ts` | true now |
| 129 | site | PLANNED | the planned section's label; tasks 7.2 to 7.5 in `specs/013-first-release/tasks.md` | planned |
| 130 | site | Not built yet. | a label (heading, navigation or category name); the card or section under it carries the claim | planned |
| 131 | site | For the first public release: listings in the Chrome, Firefox and Edge stores; a check in CI that two builds of the same source produce the same files; a one-page threat model; attestations on release files; a privacy policy at https://peekover.dev/privacy/ and this website at https://peekover.dev, neither online yet. | tasks 7.2, 7.3, 7.4, 7.5 in `specs/013-first-release/tasks.md`; the URLs: `specs/013-first-release/plan.md` (§9 note 1, G-1) | live at release |
| 132 | site | Later, not yet scheduled: on-device and bring-your-own-key AI features, DOCX and ZIP export, publishing, presentation mode, read-aloud, and other raw file types such as JSON, YAML, TOML and CSV. | out of scope for the first release: `specs/013-first-release/spec.md` (§6) | planned |
| 133 | site | IN PLAIN SIGHT | a section label; the sentences under it carry the claims | true now |
| 134 | site | Don’t take our word for it. | a label (heading, navigation or category name); the card or section under it carries the claim | true now |
| 135 | site | Read the receipt. | the receipt beside it; each of its lines has a row | true now |
| 136 | site | Peekover has no server of its own and asks for no browser permissions. | no backend exists in the repository; `tests/manifest.test.ts` | true now |
| 137 | site | No servers. | no backend exists in the repository (`docs/product/spec.md`, §1 zero infrastructure) | true now |
| 138 | site | There is no backend, no database and no account. | no backend exists in the repository (`docs/product/spec.md`, §1 zero infrastructure) | true now |
| 139 | site | No network by default. | `tests/browser/folderMode.network.browser.test.ts`, `tests/browser/tocNetwork.browser.test.ts`, `tests/browser/tableNetwork.browser.test.ts`, `tests/browser/watchNetwork.browser.test.ts`, `tests/browser/exportNetwork.browser.test.ts`, `tests/browser/editorNetwork.browser.test.ts` | true now |
| 140 | site | The only requests are ones you trigger, such as loading remote images, and the page shows an indicator when that happens. | `src/render/remoteMediaUi.ts` (lightNetworkIndicator), `tests/browser/remoteMedia.browser.test.ts` | true now |
| 141 | site | No permissions. | `tests/manifest.test.ts` | true now |
| 142 | site | The manifest requests none; PERMISSIONS.md lists each capability used without one. | `tests/manifest.test.ts`, `docs/trust/PERMISSIONS.md` | true now |
| 143 | site | Open source (MIT). | `LICENSE` | true now |
| 144 | site | CI checks that no code is loaded from outside the package, audits the production dependencies, and generates a software bill of materials. | `scripts/check-dynamic-imports.ts`, `scripts/generate-sbom.ts`, `.github/workflows/supply-chain.yml` | true now |
| 145 | site | No ads, no paid tier, no telemetry. | `AGENTS.md` (non-negotiables 2 and 6) | true now |
| 146 | site | The code has none, and the tests check that the extension makes no network requests by default. | `tests/browser/folderMode.network.browser.test.ts`, `tests/browser/tocNetwork.browser.test.ts`, `tests/browser/tableNetwork.browser.test.ts`, `tests/browser/watchNetwork.browser.test.ts`, `tests/browser/exportNetwork.browser.test.ts`, `tests/browser/editorNetwork.browser.test.ts`; `scripts/check-dynamic-imports.ts` (no remote code); `AGENTS.md` (non-negotiables 2 and 6) | true now |
| 147 | site | PEEKOVER ★ RECEIPT | a label (heading, navigation or category name); the card or section under it carries the claim | true now |
| 148 | site | — what the extension collects — | the receipt's caption; its lines carry the claims | true now |
| 149 | site | OPEN SOURCE | `LICENSE` | true now |
| 150 | site | Your files uploaded 0 | `tests/browser/folderMode.network.browser.test.ts`, `tests/browser/tocNetwork.browser.test.ts`, `tests/browser/tableNetwork.browser.test.ts`, `tests/browser/watchNetwork.browser.test.ts`, `tests/browser/exportNetwork.browser.test.ts`, `tests/browser/editorNetwork.browser.test.ts` | true now |
| 151 | site | Telemetry events 0 | `AGENTS.md` (non-negotiable 2); `tests/browser/folderMode.network.browser.test.ts`, `tests/browser/tocNetwork.browser.test.ts`, `tests/browser/tableNetwork.browser.test.ts`, `tests/browser/watchNetwork.browser.test.ts`, `tests/browser/exportNetwork.browser.test.ts`, `tests/browser/editorNetwork.browser.test.ts` | true now |
| 152 | site | Analytics scripts 0 | `AGENTS.md` (non-negotiable 2); `scripts/check-dynamic-imports.ts` | true now |
| 153 | site | Ads / affiliate injections 0 | `AGENTS.md` (non-negotiable 6) | true now |
| 154 | site | Accounts required 0 | no account system exists in the repository | true now |
| 155 | site | Remote code loaded 0 | `scripts/check-dynamic-imports.ts`, `.github/workflows/supply-chain.yml` | true now |
| 156 | site | Network calls (default) 0 | `tests/browser/folderMode.network.browser.test.ts`, `tests/browser/tocNetwork.browser.test.ts`, `tests/browser/tableNetwork.browser.test.ts`, `tests/browser/watchNetwork.browser.test.ts`, `tests/browser/exportNetwork.browser.test.ts`, `tests/browser/editorNetwork.browser.test.ts` | true now |
| 157 | site | TOTAL COLLECTED 0 | the lines above; `tests/browser/folderMode.network.browser.test.ts`, `tests/browser/tocNetwork.browser.test.ts`, `tests/browser/tableNetwork.browser.test.ts`, `tests/browser/watchNetwork.browser.test.ts`, `tests/browser/exportNetwork.browser.test.ts`, `tests/browser/editorNetwork.browser.test.ts` | true now |
| 158 | site | Price $0 | `AGENTS.md` (non-negotiable 6) | true now |
| 159 | site | THANK YOU FOR READING | the receipt's sign-off; no claim | true now |
| 160 | site | The extension that collects nothing and costs nothing. | `AGENTS.md` (non-negotiables 2 and 6); `tests/browser/folderMode.network.browser.test.ts`, `tests/browser/tocNetwork.browser.test.ts`, `tests/browser/tableNetwork.browser.test.ts`, `tests/browser/watchNetwork.browser.test.ts`, `tests/browser/exportNetwork.browser.test.ts`, `tests/browser/editorNetwork.browser.test.ts` | true now |
| 161 | site | Not in stores yet — build from source | no listing exists (task 7.5, `specs/013-first-release/tasks.md`); F-3. UPDATE AT GO-LIVE (replace with the real store links; a go-live step, `docs/ai/progress.md`, carried for 7.6). | true now |
| 162 | site | THE FULL LIST | a section label; the sentences under it carry the claims | true now |
| 163 | site | Everything it does today. | a label (heading, navigation or category name); the card or section under it carries the claim | true now |
| 164 | site | Searchable. | a label (heading, navigation or category name); the card or section under it carries the claim | true now |
| 165 | site | What the extension does today, by category. | the explorer list below; each item has its own row | true now |
| 166 | site | Type to find a feature, or browse by category. | the page's own behaviour: `site/index.html` (its script) (exRender) | true now |
| 167 | site | No feature by that name. | the page's own behaviour: `site/index.html` (its script) (exempty) | true now |
| 168 | site | Planned work is listed under Planned. | the #planned section of `site/index.html` | true now |
| 169 | site | “App page” marks a feature that works only on the app page, opened from the toolbar button. | `entrypoints/background.ts`; `docs/ai/decisions.md` ("M13 TASK 1.2", addendum: the surface table) | true now |
| 170 | site | Free means free. | a label (heading, navigation or category name); the card or section under it carries the claim | true now |
| 171 | site | Here’s the deal. | a label (heading, navigation or category name); the card or section under it carries the claim | true now |
| 172 | site | No price, no tiers No “Pro” version, no locked features, no trials. | `AGENTS.md` (non-negotiable 6) | true now |
| 173 | site | No ads, no funnels Nothing injected, promoted or upsold. | `AGENTS.md` (non-negotiable 6) | true now |
| 174 | site | Built in the open The specs, plans and decisions are in the repository. | `specs/013-first-release/spec.md`, `docs/ai/decisions.md` | true now |
| 175 | site | Yours to inspect MIT licensed, with every capability explained in PERMISSIONS.md. | `LICENSE`, `docs/trust/PERMISSIONS.md` | true now |
| 176 | site | Fork it if we ever break the deal. | the MIT licence permits it (`LICENSE`) | true now |
| 177 | site | SETUP | a section label; the sentences under it carry the claims | true now |
| 178 | site | From source to reading. | a label (heading, navigation or category name); the card or section under it carries the claim | true now |
| 179 | site | Build | the Setup step's label. UPDATE AT GO-LIVE (replace with the real store links; a go-live step, `docs/ai/progress.md`, carried for 7.6). | true now |
| 180 | site | Peekover is not in the stores yet. | no listing exists (task 7.5, `specs/013-first-release/tasks.md`). UPDATE AT GO-LIVE (replace with the real store links; a go-live step, `docs/ai/progress.md`, carried for 7.6). | true now |
| 181 | site | Build it from source with Node 22 and pnpm, as the README explains, and load the unpacked build. | `README.md` ("Build from source"), `.nvmrc`, `package.json`. UPDATE AT GO-LIVE (replace with the real store links; a go-live step, `docs/ai/progress.md`, carried for 7.6). | true now |
| 182 | site | Flip one switch | a label (heading, navigation or category name); the card or section under it carries the claim | true now |
| 183 | site | For files on your disk in Chromium-based browsers, turn on “Allow access to file URLs” for Peekover in the extension settings. | `docs/trust/PERMISSIONS.md` ("file:// access note") | true now |
| 184 | site | Peek | a label (heading, navigation or category name); the card or section under it carries the claim | true now |
| 185 | site | Open a markdown file from disk or a raw link, or open the app page from the toolbar button and pick a folder. | `entrypoints/peekover.content.ts`, `entrypoints/background.ts`, `tests/browser/folderGrant.browser.test.ts` | true now |
| 186 | site | Your files deserve better than raw. | a label (heading, navigation or category name); the card or section under it carries the claim | true now |
| 187 | site | Not in stores yet — build from source GitHub (https://github.com/mosuvo/peekover) | no listing exists (task 7.5); the repository is private until the first release (`docs/ai/decisions.md`, "M13 GATE 1 APPROVED", Q15); repo links per F-3 (`specs/013-first-release/tasks.md`). UPDATE AT GO-LIVE (replace with the real store links; a go-live step, `docs/ai/progress.md`, carried for 7.6). | live at release |
| 188 | site | Free, for everyone, in plain sight. | `AGENTS.md` (non-negotiable 6), `LICENSE` | true now |
| 189 | site | Made in plain sight. © 2026 · MIT | a label (heading, navigation or category name); the card or section under it carries the claim | true now |
| 190 | site | This page | a label (heading, navigation or category name); the card or section under it carries the claim | true now |
| 191 | site | Agent output | a label (heading, navigation or category name); the card or section under it carries the claim | true now |
| 192 | site | Security | a label (heading, navigation or category name); the card or section under it carries the claim | true now |
| 193 | site | Planned | a label (heading, navigation or category name); the card or section under it carries the claim | true now |
| 194 | site | Every feature | a label (heading, navigation or category name); the card or section under it carries the claim | true now |
| 195 | site | In the repo ↗ | a label (heading, navigation or category name); the card or section under it carries the claim | true now |
| 196 | site | github.com/mosuvo/peekover (https://github.com/mosuvo/peekover) | the repository is private until the first release (`docs/ai/decisions.md`, "M13 GATE 1 APPROVED", Q15); repo links per F-3 (`specs/013-first-release/tasks.md`) | live at release |
| 197 | site | SECURITY.md (https://github.com/mosuvo/peekover/blob/main/docs/trust/SECURITY.md) | the repository is private until the first release (`docs/ai/decisions.md`, "M13 GATE 1 APPROVED", Q15); repo links per F-3 (`specs/013-first-release/tasks.md`) | live at release |
| 198 | site | PERMISSIONS.md (https://github.com/mosuvo/peekover/blob/main/docs/trust/PERMISSIONS.md) | the repository is private until the first release (`docs/ai/decisions.md`, "M13 GATE 1 APPROVED", Q15); repo links per F-3 (`specs/013-first-release/tasks.md`) | live at release |
| 199 | site | Releases (https://github.com/mosuvo/peekover/releases) | the repository is private until the first release (`docs/ai/decisions.md`, "M13 GATE 1 APPROVED", Q15); repo links per F-3 (`specs/013-first-release/tasks.md`) | live at release |
| 200 | site | Report a bug (https://github.com/mosuvo/peekover/issues) | the repository is private until the first release (`docs/ai/decisions.md`, "M13 GATE 1 APPROVED", Q15); repo links per F-3 (`specs/013-first-release/tasks.md`) | live at release |
| 201 | site | This site is one page. | a label (heading, navigation or category name); the card or section under it carries the claim | true now |
| 202 | site | The documentation lives in the repository, next to the code it describes. | a label (heading, navigation or category name); the card or section under it carries the claim | true now |
| 203 | site | Rendering | a label (heading, navigation or category name); the card or section under it carries the claim | true now |
| 204 | site | Tables, task lists, strikethrough, bare-URL links | `src/render/parse.ts`, `tests/golden/golden.test.ts` | true now |
| 205 | site | Inline HTML, cleaned with DOMPurify | `src/render/sanitize.ts`, `tests/browser/sanitize.browser.test.ts` | true now |
| 206 | site | Raw text with an error banner if rendering fails | `src/render/mount.fallback.test.ts` | true now |
| 207 | site | Remote images blocked until you load them | `tests/browser/remoteMedia.browser.test.ts` | true now |
| 208 | site | A raw view of the markdown | `src/render/readerMode.ts`, `src/render/readerMode.test.ts` | true now |
| 209 | site | Markdown files opened from disk | `entrypoints/peekover.content.ts`, `tests/manifest.test.ts` | true now |
| 210 | site | Raw files on GitHub, GitLab and Bitbucket | `entrypoints/peekover.content.ts`, `tests/manifest.test.ts` | true now |
| 211 | site | A folder you pick or drag in, on the app page | `tests/browser/folderGrant.browser.test.ts`, `tests/browser/folderDrop.browser.test.ts` | true now |
| 212 | site | Navigation | a label (heading, navigation or category name); the card or section under it carries the claim | true now |
| 213 | site | Table of contents rail | `src/render/tocView.ts`, `tests/browser/tocScroll.browser.test.ts` | true now |
| 214 | site | Folder browser with pins and recents, on the app page | `src/app/treeView.ts`, `src/app/recents.ts`, `src/app/recentsView.test.ts` | true now |
| 215 | site | Table sort, filter and copy | `tests/browser/tableTools.browser.test.ts`, `tests/browser/tableFilter.browser.test.ts`, `tests/browser/tableCopy.browser.test.ts` | true now |
| 216 | site | Watch & compare | a label (heading, navigation or category name); the card or section under it carries the claim | true now |
| 217 | site | Watch a file for changes, on the app page and, in Chromium-based browsers, in a tab showing a file from disk | `src/watch/contentWatch.ts`, `src/watch/watchRelay.ts`, `src/watch/watchAvailability.ts`, `tests/browser/watchLifecycle.browser.test.ts` | true now |
| 218 | site | Snapshots while watching, on the app page | `tests/browser/snapshotCapture.browser.test.ts` | true now |
| 219 | site | Compare with a snapshot, on the app page | `tests/browser/diffChrome.browser.test.ts` | true now |
| 220 | site | Compare with another file in the folder, on the app page | `tests/browser/diffChrome.browser.test.ts` | true now |
| 221 | site | A badge for CLAUDE.md, AGENTS.md, spec.md, plan.md and tasks.md | `src/render/agentFile.ts`, `tests/browser/agentBadge.browser.test.ts` | true now |
| 222 | site | Math, diagrams & code | a label (heading, navigation or category name); the card or section under it carries the claim | true now |
| 223 | site | Math with Temml, on the app page | `src/render/mathImportFence.test.ts` | true now |
| 224 | site | Copy a formula as LaTeX or MathML, on the app page | `tests/browser/mathActions.browser.test.ts` | true now |
| 225 | site | Mermaid diagrams with a zoom view, on the app page | `src/render/diagramImportFence.test.ts`, `tests/browser/diagramLightbox.browser.test.ts` | true now |
| 226 | site | Copy or download a diagram, on the app page | `tests/browser/diagramActions.browser.test.ts` | true now |
| 227 | site | Code highlighting for 13 languages, on the app page | `src/render/codeEngine.ts` (LANGUAGE_LOADERS: thirteen entries, 013 task 5.11), `src/render/codeImportFence.test.ts` | true now |
| 228 | site | Code themes, copy, line numbers and wrap, on the app page | `tests/browser/codeThemeControl.browser.test.ts`, `tests/browser/codeToolbar.browser.test.ts` | true now |
| 229 | site | Theming | a label (heading, navigation or category name); the card or section under it carries the claim | true now |
| 230 | site | Light, dark and auto themes | `src/settings/settings.ts`, `tests/browser/themeRuntime.browser.test.ts` | true now |
| 231 | site | The Literata reading face | `src/theme/fonts.ts` | true now |
| 232 | site | Markdown editor with a live preview, on the app page | `src/render/editorEngine.ts`, `tests/browser/editorPreview.browser.test.ts` | true now |
| 233 | site | Save writes in Chromium-based browsers and downloads in Firefox, on the app page | `tests/browser/editorSave.browser.test.ts` | true now |
| 234 | site | Asks before discarding unsaved changes, on the app page | `tests/browser/editorUnsaved.browser.test.ts` | true now |
| 235 | site | Standalone HTML file, on the app page | `tests/browser/htmlExport.browser.test.ts` | true now |
| 236 | site | Print to PDF, on the app page | `tests/browser/pdfExport.browser.test.ts` | true now |
| 237 | site | Copy as HTML, plain text or rich text, on the app page | `tests/browser/copyAsHtml.browser.test.ts`, `tests/browser/copyAsPlainText.browser.test.ts`, `tests/browser/copyAsRichText.browser.test.ts` | true now |
| 238 | site | Trust | a label (heading, navigation or category name); the card or section under it carries the claim | true now |
| 239 | site | No permissions in the manifest | `tests/manifest.test.ts` | true now |
| 240 | site | No network requests by default | `tests/browser/folderMode.network.browser.test.ts`, `tests/browser/tocNetwork.browser.test.ts`, `tests/browser/tableNetwork.browser.test.ts`, `tests/browser/watchNetwork.browser.test.ts`, `tests/browser/exportNetwork.browser.test.ts`, `tests/browser/editorNetwork.browser.test.ts` | true now |
| 241 | site | No telemetry and no analytics | `AGENTS.md` (non-negotiable 2); `tests/browser/folderMode.network.browser.test.ts`, `tests/browser/tocNetwork.browser.test.ts`, `tests/browser/tableNetwork.browser.test.ts`, `tests/browser/watchNetwork.browser.test.ts`, `tests/browser/exportNetwork.browser.test.ts`, `tests/browser/editorNetwork.browser.test.ts` | true now |
| 242 | site | MIT licence | `LICENSE` | true now |
| 243 | site | Add to Chrome — Free / Add to Chrome — it’s free, forever / Edge / Firefox (four "Add to Chrome" calls to action and the Edge and Firefox buttons, all href="#") | no store listing exists; replaced by "Not in stores yet — build from source" (F-3) | withdrawn |
| 244 | site | ★ GitHub / ★ Star on GitHub and the footer's repo links (href="#") | dead links; now the real repository URLs, live at release (F-3) | withdrawn |
| 245 | site | The free, open-source extension that turns raw markdown — including the piles of it your AI agents write — into beautiful, instant reading. Plus an editor. Plus on-device AI. With zero network calls. | "beautiful, instant" has no evidence; there is no AI; replaced by the README's description | withdrawn |
| 246 | site | <150 ms render · Edge · Firefox · Brave too | no measurement backs 150 ms; Brave is not built or tested | withdrawn |
| 247 | site | 78 FEATURES · 36 FIRSTS / 78 features matched against every competitor, 36 industry firsts | no evidence on record; the explorer now lists what ships | withdrawn |
| 248 | site | FIRST badges ("marks what no other viewer ships"; "★ = ships in no other markdown extension (verified July 2026)") | no evidence on record in the repository | withdrawn |
| 249 | site | Watch mode: re-renders the instant your agent saves, auto-scrolls to what’s new, and flashes the change. | auto-scroll and the flash are not built; replaced by what watch does | withdrawn |
| 250 | site | Diff view: inline or side-by-side, from locally kept snapshots. | side-by-side is not built; comparison is app page only | withdrawn |
| 251 | site | Agent-file awareness: .cursorrules gets a badge, tuned rendering, and watch + diff switched on automatically. | .cursorrules is excluded by design; nothing is switched on automatically | withdrawn |
| 252 | site | Transcript rendering: markdown session logs read like conversations. | not built | withdrawn |
| 253 | site | Copy for AI, and a web-page → markdown clipper. | not built | withdrawn |
| 254 | site | Full CommonMark + GFM and the whole extended family: footnotes, abbreviations, definition lists, super/subscript, emoji, GitHub alerts, YAML frontmatter cards, MDX-aware. | only tables, task lists, strikethrough and bare links are enabled (`src/render/parse.ts`) | withdrawn |
| 255 | site | KaTeX (MathJax fallback), Graphviz & Vega, standalone .mermaid/.dot files, smart cache: 50 diagrams reopen in <1s. | math is Temml; Graphviz, Vega and standalone files are not built; the cache figure has no evidence | withdrawn |
| 256 | site | 190+ languages, 14+ code themes, local language auto-detection, collapsible long blocks. | thirteen languages ship (013 task 5.11); auto-detection is not wired; the theme count and collapsing are not evidenced | withdrawn |
| 257 | site | Project mode: wiki-links, backlinks, cross-file full-text search, a broken-link checker. | not built; folder browsing is what ships | withdrawn |
| 258 | site | Scroll-spy TOC, in-document search, heading permalinks, text-fragment links, hover previews, scroll-position memory. | not built or not evidenced; the TOC rail ships | withdrawn |
| 259 | site | Presentation mode, deck export, copy-as-CSV/JSON, checkboxes that write back to the file. | not built; moved to the planned section where planned | withdrawn |
| 260 | site | 9 research-picked fonts, focus mode, read-aloud, 30+ themes, custom CSS, frontmatter overrides, settings sync. | not built; one reading face and light/dark ship | withdrawn |
| 261 | site | <150 ms first render, 10 MB files stay smooth, no size limits (progressive loading). | no measurement on record backs these | withdrawn |
| 262 | site | Remote URLs, drag-and-drop, paste-to-render scratchpad, render selection on any page, per-origin permissions, a local-only master switch. | not built; the manifest requests no permissions | withdrawn |
| 263 | site | Full editing kit, visual table editor, HTML and Jupyter import, autosave with version history. | not built; the editor is plain | withdrawn |
| 264 | site | Export & publish: DOCX with editable equations, ZIP bundles, Gist, GitHub, Medium & Dev.to. | not built; DOCX was dropped from M10 | withdrawn |
| 265 | site | On-device AI, bring your own key, chat with the document, AI rewrite and web-clipping; the chat demo. | not built; moved to "Later, not yet scheduled" | withdrawn |
| 266 | site | Extensions get sold, hijacked, and turned into adware — it happened to the most popular JSON viewer on the store. | no evidence on record | withdrawn |
| 267 | site | Minimal permissions, requested per-origin at the moment of use; updates never silently add permissions. | false: the manifest requests none | withdrawn |
| 268 | site | Reproducible builds, byte-comparable to the store artifact, signed releases, a threat model in the repo, a security hall-of-fame. | not built (7.2 to 7.4); signed tags withdrawn at gate 1 | withdrawn |
| 269 | site | The ownership pledge: never sold. In writing, in the README. / Never sold: any ownership change voids the listing. | withdrawn from the README at 1.2; there is no listing | withdrawn |
| 270 | site | Price $0 — forever / $0 today, $0 later. | "forever" is a promise, not a fact; $0 kept | withdrawn |
| 271 | site | AUDITABLE ✓ | replaced by "OPEN SOURCE" | withdrawn |
| 272 | site | NEXT: PHASE 2 — JSON trees, JSONL agent logs, YAML, TOML and sortable CSV tables. Replace four extensions with one you can audit. | folded into "Later, not yet scheduled" | withdrawn |
| 273 | site | Reading in under a minute. Install: one click from your browser’s store. Flip one switch: the guided setup deep-links you and detects the flip. Peek: the tour (✨) shows you the rest. | no store listing; the guided setup and the tour are not built (onboarding is task 6.1) | withdrawn |
| 274 | site | One page is all we ship — the docs live in the open-source repo, where you can verify them. | the repository is private until release; reworded | withdrawn |
| 275 | site | SECURITY.md · threat model / Releases · changelog / Report a bug · translate | no threat model, changelog or translations yet | withdrawn |
| 276 | site | The explorer's 120 items in 12 categories (Rendering … For everyone), including "8 languages at launch → 27 target", "WCAG 2.1 AA", "⌘K command palette", "Zoom 50–400%" | replaced by the shipped list; the counts and targets have no evidence | withdrawn |
| 277 | README | **Raw in. Reading out.** | a slogan, not a claim; dropped | withdrawn |
| 278 | README | The free, open-source browser extension that turns raw markdown — including the piles of it your AI agents write — into beautiful, instant reading. | "beautiful, instant" has no evidence; replaced by a plain description | withdrawn |
| 279 | README | Zero network calls. | replaced: "makes no network requests by default" (with its tests) | withdrawn |
| 280 | README | No telemetry. | replaced: "no telemetry and no analytics" (with its evidence) | withdrawn |
| 281 | README | Free means free, permanently. | "permanently" is a promise no test can back; replaced by what is true now | withdrawn |
| 282 | README | Status: pre-release, building milestone 1 in the open. | false: twelve milestones have shipped | withdrawn |
| 283 | README | Site: https://peekover.dev | presented the site as live; now under "Planned", marked not online yet | withdrawn |
| 284 | README | No price, no tiers · no ads, no funnels | replaced: "no price, no paid tier and no ads" | withdrawn |
| 285 | README | never sold (an ownership change voids the listing — expect releases only from this repo) | there is no listing; a promise about the future, not a fact | withdrawn |
| 286 | README | yours to inspect (MIT, reproducible builds, annotated permissions) | reproducible builds are not built yet (7.3); MIT and PERMISSIONS kept separately | withdrawn |
| 287 | README | See AGENTS.md (works for humans too). `pnpm dev` once milestone 1 lands. | replaced by working build-from-source steps | withdrawn |
| 288 | README | Note: no relation to a 2021 npm typosquat package that npm removed, nor to any similarly named mobile apps — this project lives here and at peekover.dev, nowhere else. | no evidence on record; peekover.dev is not online yet | withdrawn |
| 289 | SECURITY | Report vulnerabilities: hello@peekover.dev (48h ack target). | the address is not a working channel (G-1); no response-time promise without a channel | withdrawn |
| 290 | SECURITY | Hall of fame below. | no reporting channel is open yet | withdrawn |
| 291 | SECURITY | Architecture promises (no servers, zero network default, no telemetry, no remote code, reproducible builds) are documented in the spec §6 and verified in CI as they land. | reproducible builds are not built (7.3); each true item is now listed with its own evidence | withdrawn |
| 292 | README | The fonts in this repository (Literata, STIX Two Math, Bricolage Grotesque and Sometype Mono) are under the SIL Open Font License 1.1; see NOTICE (NOTICE). | `assets/fonts/OFL.txt`, `assets/fonts/README.md`, `NOTICE`, `public/licenses/literata.txt`, `public/licenses/stix-two-math.txt`, `public/licenses/bricolage-grotesque.txt`, `public/licenses/sometype-mono.txt`; `tests/fontLicences.test.ts` | true now |

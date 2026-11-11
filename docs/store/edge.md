# Microsoft Edge Add-ons listing — Peekover

*M13 task 7.5 (gate-1 Q20: listing text and assets; the package is the Chrome zip). Each section below is one
Partner Center field, pasted as written. The heading names the field and its limit; `tests/truthPins.test.ts` checks
the limits, and every sentence has a row in `docs/store/claims.md` (surface "edge"). Sources for the fields and
limits: `docs/ai/decisions.md`, "M13 TASK 7.5".*

## Extension name — from the manifest

Peekover

## Short description — from the manifest description, max 132 characters

Render raw markdown into beautiful, private reading. Zero network by default.

## Category — chosen from Partner Center's list

Productivity

## Description — 250 to 10,000 characters

Peekover is a free, open-source browser extension that turns raw markdown files into formatted, readable pages.
It works on markdown files opened from your own disk and on raw files from GitHub, GitLab and Bitbucket.
It asks for no browser permissions and makes no network requests unless you ask it to.

- Renders markdown with tables, task lists, strikethrough and bare-URL links.
- Cleans every rendered page with DOMPurify before it is shown.
- Shows a table of contents for documents with two or more headings.
- Lets you sort, filter and copy tables.
- Has light and dark themes and follows your system setting by default.
- Blocks remote images until you choose to load them.
- Has an app page, opened from the toolbar button, where you open a folder and browse its markdown files.
- Can watch a document and update the view when it changes on disk, on the app page and in a tab showing a file opened from disk.
- On the app page, while watching, keeps snapshots of the document on your device, which you can turn off.
- On the app page, compares a document with one of its snapshots or with another file in the folder.
- On the app page, draws Mermaid diagrams, renders math with Temml, and highlights code in JavaScript, TypeScript, TSX, Python, JSON, CSS, HTML, Bash, diff, YAML, Markdown, TOML and SQL.
- On the app page, exports a standalone HTML file, prints to PDF, and copies the document as HTML, plain text or rich text.
- On the app page, has a basic editor with a live preview and a Save button, and asks before discarding unsaved changes.

- In a tab, snapshots, comparison, diagrams, math, code highlighting, export and editing are not available; open the document on the app page for those.
- Watching does not work for raw files from GitHub, GitLab or Bitbucket.
- Files opened from disk need the extension's "Allow access to file URLs" setting turned on.

Peekover collects nothing: it has no accounts, no analytics, no telemetry and no error reporting.
It sends nothing about you, your files or your settings to Peekover or to anyone else.
What it stores, such as your settings and snapshots of documents you watch, stays in the browser's storage on your device.
"Wipe all data" in the "Stored data" panel on the app page deletes everything Peekover has stored.
If you choose to load the remote images in a document, your browser downloads them from the sites that host them.
Privacy policy: https://peekover.dev/privacy/
Peekover is released under the MIT licence, and its source code is at https://github.com/mosuvo/peekover.

## Search terms — not displayed; at most 7 terms, each at most 30 characters, 21 words in all

markdown
markdown viewer
markdown reader
raw markdown
readme viewer
md file viewer
mermaid

## Website

https://peekover.dev

## Support contact detail

https://github.com/mosuvo/peekover/issues

## Single purpose — Privacy page

Peekover shows markdown files as formatted, readable pages: files opened from disk, raw markdown files on GitHub, GitLab and Bitbucket, and folders opened on its app page.

## Permission justification — Privacy page

Peekover requests no permissions: its manifest's permissions list is empty.
Its content script runs only on markdown files opened from disk and on raw markdown files at raw.githubusercontent.com, gist.githubusercontent.com, gitlab.com and bitbucket.org, to show that file as a formatted page.
It reads the text already in the page and makes no network request.

## Remote code — Privacy page

No, I am not using remote code.

## Data usage — Privacy page

Website content: Peekover reads the text of the markdown pages and files you open in order to show them, and keeps snapshots of watched documents and drawings of diagrams on your device; none of it leaves your device.
No other kind of user data is handled.
All the certifications are ticked: Peekover does not sell or transfer user data, does not use it for anything outside its single purpose, and does not use it to decide creditworthiness or for lending.

## Privacy policy URL — Privacy page

https://peekover.dev/privacy/

## Screenshots — upload in this order; not published (Edge Add-ons has no caption field)

1. `edge-1-reading-light.png`: A folder open on the app page: the file list, the document and its table of contents.
2. `edge-2-agent-file-dark.png`: An agent instruction file, CLAUDE.md, with its badge, in the dark theme.
3. `edge-3-table-diagram-dark.png`: A table you can filter and copy, and a Mermaid diagram, in the dark theme.
4. `edge-4-math-code-light.png`: Math and highlighted code on the app page.
5. `edge-5-tab-reader-light.png`: A markdown file opened from disk, formatted in a browser tab.
6. `edge-6-editor-light.png`: The editor, with a live preview and a Save button.

## Submission notes — not published

- Package: the Chrome zip, `.output/peekover-<version>-chrome.zip`, from the draft release (gate-1 Q20).
- Logo: `docs/store/assets/edge-logo-300.png` (1:1, 300×300). Screenshots: the six files above, from
  `docs/store/assets/`, all 1280×800, uploaded in that order (Edge takes at most 6; M13 task 9.3: the reviewer's pick
  under the human's delegation, 2026-11-11).
- The short description is the manifest's `description` (`wxt.config.ts`), read-only in Partner Center.
- Category: Microsoft's publish page does not list the categories; "Productivity" is the proposal — confirm it is in
  Partner Center's list at submission, or pick the nearest and update this file.
- The data-usage checkbox names and the certifications are read in Partner Center at submission (the publish page shows
  them only as an image); if they differ from the above, stop and re-check this file.
- Edge requires the privacy URL to be reachable: submit only after go-live (7.6).

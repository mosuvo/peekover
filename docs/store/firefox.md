# Firefox Add-ons (AMO) listing — Peekover

*M13 task 7.5. Each section below is one AMO field, pasted as written. The heading names the field and its limit;
`tests/truthPins.test.ts` checks the limits, and every sentence has a row in `docs/store/claims.md` (surface
"firefox"). Sources for the fields and limits: `docs/ai/decisions.md`, "M13 TASK 7.5".*

## Name — from the manifest

Peekover

## Summary — max 250 characters

Turns raw markdown into formatted, readable pages: raw files on GitHub, GitLab and Bitbucket, folders on its app page, and files from disk once "Access local files on your computer" is on.
No network requests unless you ask, and no data collected.

## Categories — up to two

Web Development
Other

## Description — no documented limit; a limited set of Markdown

Peekover is a free, open-source browser extension that turns raw markdown files into formatted, readable pages.
It works on raw markdown files from GitHub, GitLab and Bitbucket, on folders of markdown files that you open on its app page, and on files from disk once "Access local files on your computer" is on.
It asks for no browser permissions and makes no network requests unless you ask it to.

- Renders markdown with tables, task lists, strikethrough and bare-URL links.
- Cleans every rendered page with DOMPurify before it is shown.
- Shows a table of contents for documents with two or more headings.
- Lets you sort, filter and copy tables.
- Has light and dark themes and follows your system setting by default.
- Blocks remote images until you choose to load them.
- Has an app page, opened from the toolbar button, where you open a folder and browse its markdown files.
- On the app page, can watch a document from a folder you dragged in and update the view when it changes on disk.
- On the app page, while watching, keeps snapshots of the document on your device, which you can turn off.
- On the app page, compares a document with one of its snapshots or with another file in the folder.
- On the app page, draws Mermaid diagrams, renders math with Temml, and highlights code in JavaScript, TypeScript, TSX, Python, JSON, CSS, HTML, Bash, diff, YAML, Markdown, TOML and SQL.
- On the app page, exports a standalone HTML file, prints to PDF, and copies the document as HTML, plain text or rich text.
- On the app page, has a basic editor with a live preview and a Save button, and asks before discarding unsaved changes.

- In a tab, snapshots, comparison, diagrams, math, code highlighting, export and editing are not available; open the document on the app page for those.
- Watching does not work for raw files from GitHub, GitLab or Bitbucket, and isn't offered for a folder chosen with the folder picker.
- In Firefox, Save downloads a copy of the file instead of writing it back.
- In Firefox, files opened from disk need one setting: "Access local files on your computer", under Peekover's Permissions and data in about:addons.

Peekover collects nothing: it has no accounts, no analytics, no telemetry and no error reporting.
It sends nothing about you, your files or your settings to Peekover or to anyone else.
What it stores, such as your settings and snapshots of documents you watch, stays in the browser's storage on your device.
"Wipe all data" in the "Stored data" panel on the app page deletes everything Peekover has stored.
If you choose to load the remote images in a document, your browser downloads them from the sites that host them.
Privacy policy: https://peekover.dev/privacy/
Peekover is released under the MIT licence, and its source code is at https://github.com/mosuvo/peekover.

## Homepage

https://peekover.dev

## Support site

https://github.com/mosuvo/peekover/issues

## Privacy policy — the full text of docs/trust/PRIVACY.md

The full text of PRIVACY.md, the same as https://peekover.dev/privacy/, is pasted into this field.

## Data collection — from the manifest

The manifest declares that Peekover collects no data: data_collection_permissions is required: ["none"].

## Submission notes — not published

- Package: `.output/peekover-<version>-firefox.zip` from the draft release; source: `peekover-<version>-sources.zip`
  (it holds `SOURCE_CODE_REVIEW.md`, the reviewer's build steps).
- Support email: left empty — there is no working address yet (plan G-1). AMO suggests one; add it only once an
  address is confirmed working (`docs/store/GO-LIVE.md`).
- Licence: MIT. Platforms: Firefox for desktop (Windows, macOS, Linux); Firefox for Android is not supported (the human's
  ruling at M13 task 5.6).
- Icon and screenshots: AMO's icon is from the package; screenshots (1280×800) come at spec §3.9.
- Live at release, so submit only after go-live makes them reachable (7.6): the privacy URL, the homepage, the
  repository and its issues page.

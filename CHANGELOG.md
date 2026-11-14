# Changelog

All notable changes to Peekover are recorded in this file.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and version numbers follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 0.1.1 - 2026-11-14

### Changed

- On the app page, a folder opened as a snapshot shows one line, "Snapshot", with the details behind an ⓘ button.
- On the app page, when watching isn't offered for a folder, the Watch control says why.

### Fixed

- In Chromium-based browsers without the folder picker, the app page no longer names Firefox.
- In Chrome, after Revoke, the folder's recent and pinned entries no longer say "Firefox can't remember folder access".
- In Chromium-based browsers without the folder picker, opening a file that changed after you picked its folder now says so.

### Known limits

- In a Chromium-based browser without the folder picker, a file changed after you picked its folder can't be opened until you pick the folder again; a folder dragged in doesn't have this limit.

## 0.1.0 - 2026-11-12

The first release.

### Added

- Renders markdown with tables, task lists, strikethrough and bare-URL links.
- Cleans every rendered page with DOMPurify before it is shown.
- Renders markdown files opened from disk (`.md` and similar extensions) and raw files on raw.githubusercontent.com, gist.githubusercontent.com, GitLab and Bitbucket.
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
- On the app page, a Stored data panel lists what Peekover keeps on your device, except one small mark (that you closed the note about snapshots), and "Wipe all data" erases all of it.
- A setup guide opens once, when Peekover is first installed, and the app page links to it.
- Asks for no browser permissions: the manifest says `permissions: []`.
- Makes no network requests by default, and has no telemetry and no analytics.
- Needs Chrome 121 or later, or Firefox 153 or later.

### Known limits

- In a tab, snapshots, comparison, diagrams, math, code highlighting, export and editing are not available; open the document on the app page for those.
- Watching does not work for raw files from GitHub, GitLab or Bitbucket.
- In Chromium-based browsers such as Chrome and Edge, files opened from disk need the extension's "Allow access to file URLs" setting turned on.
- Save writes the file back in Chromium-based browsers such as Chrome and Edge; in Firefox it downloads a copy instead.
- In Firefox, watching does not work for a file opened directly from disk.
- In Firefox, on the app page, watching works for a folder dragged in and isn't offered for one chosen with the folder picker.
- In Firefox, files opened from disk need one setting: "Access local files on your computer", under Peekover's Permissions and data in about:addons.

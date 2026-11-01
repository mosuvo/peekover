# Peekover

Peekover is a free, open-source browser extension that shows raw markdown files as formatted pages you can read.
It works on markdown files opened from your own disk and on raw files from GitHub, GitLab and Bitbucket.
It asks for no browser permissions and makes no network requests unless you ask it to.

> Peekover is not in any browser store yet.
> To try it, build it from source (below).

## What it does today

- Renders markdown with tables, task lists, strikethrough and bare-URL links.
- Cleans every rendered page with DOMPurify before it is shown.
- Takes over markdown files opened from disk (`.md` and similar extensions) and raw files on raw.githubusercontent.com, gist.githubusercontent.com, GitLab and Bitbucket.
- Shows a table of contents for documents with two or more headings.
- Lets you sort, filter and copy tables.
- Has light and dark themes and follows your system setting by default.
- Blocks remote images until you choose to load them.
- Has an app page, opened from the toolbar button, where you open a folder and browse its markdown files.
- Can watch a file and update the view when it changes on disk.
- While watching, keeps snapshots of the document on your device, which you can turn off.
- Compares a document with one of its snapshots or with another file in the folder.
- On the app page, draws Mermaid diagrams, renders math with Temml, and highlights code in JavaScript, Python, JSON, CSS, HTML and Bash.
- Exports a standalone HTML file, prints to PDF, and copies the document as HTML, plain text or rich text.
- Has a basic editor with a live preview and a Save button, and asks before discarding unsaved changes.

### Limits

- Diagrams, math and code highlighting work on the app page only, not when a file is opened directly in a tab.
- In Chromium-based browsers such as Chrome and Edge, files opened from disk need the extension's "Allow access to file URLs" setting turned on.
- Save writes the file back in Chromium-based browsers such as Chrome and Edge; in Firefox it downloads a copy instead.
- In Firefox, watching does not work for a file opened directly from disk.
- In Firefox, on the app page, watching works for a folder dragged in but not for one chosen with the folder picker.
- Opening a markdown file directly from disk in Firefox has not yet been checked on a real install.

## Privacy and permissions

- The extension requests no browser permissions: its manifest says `permissions: []`.
- It makes no network requests by default.
- It has no telemetry and no analytics.
- Each capability it uses without a permission, such as reading a folder you pick, is listed in [PERMISSIONS.md](docs/trust/PERMISSIONS.md).
- How to report a security problem is in [SECURITY.md](docs/trust/SECURITY.md).

## Planned

- Listings in the Chrome, Firefox and Edge stores, for the first public release.
- For the first release: a check in CI that two builds of the same source produce the same files.
- For the first release: a one-page threat model and attestations on release files.
- For the first release: a privacy policy at https://peekover.dev/privacy/ and a website at https://peekover.dev, neither online yet.
- Not scheduled: DOCX and ZIP export, on-device and bring-your-own-key AI features, and publishing.

## Build from source

You need Node 22 (the version in `.nvmrc`) and pnpm 10.33.0 (the version in `package.json`'s `packageManager` field; `corepack enable` provides it).

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm build
pnpm exec wxt build -b firefox
```

`pnpm build` writes the Chromium build (for Chrome and Edge) to `.output/chrome-mv3`, and the Firefox command writes `.output/firefox-mv3`.
To load it in Chrome or Edge, turn on Developer mode on the extensions page and choose "Load unpacked" with `.output/chrome-mv3`.
To load it in Firefox, open `about:debugging`, choose "This Firefox", then "Load Temporary Add-on", and pick `.output/firefox-mv3/manifest.json`.
`pnpm test` runs the unit tests and `pnpm lint` runs the linter and the type check.

## Licence

Peekover is released under the MIT licence (see [LICENSE](LICENSE)).
It is free: there is no price, no paid tier and no ads.

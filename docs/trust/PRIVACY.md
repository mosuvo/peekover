# Privacy — Peekover

Peekover is a browser extension that shows markdown files as formatted pages.
This page says what it does with your information, as of version 0.1.0.

## What Peekover collects

Nothing.
Peekover has no accounts, no analytics, no telemetry and no error reporting.
It sends nothing about you, your files or your settings to Peekover or to anyone else.

## When Peekover uses the network

Peekover makes no network requests of its own unless you ask it to; browser tests check this for each feature.
A document can contain images hosted on the web.
Peekover blocks them and shows a button to load them instead.
If you click it, your browser downloads those images from the sites that host them, and those sites see that request as they would for any web page.
Peekover then shows "Network used".
The images load for that view only; reloading the page blocks them again.
When you open a raw markdown file on GitHub, GitLab or Bitbucket, your browser loads the page as it always does; Peekover reads the text already in the page.

## What Peekover stores on your device

Peekover keeps what it stores in the browser's storage for the extension (IndexedDB), on this device only.
None of it is uploaded.
- Folders you open: their names, and in Chrome and Edge the browser's access to the folder, so you can reopen it in one click. Not the files in them.
- Files you opened recently and items you pinned: their path and name.
- Your settings, once you change one: the theme, the contents panel's state and width, the code theme, the last export format, and whether snapshots are on.
- Snapshots: while you watch a document from a folder on the app page, Peekover keeps earlier versions of its text so that you can compare them.
- Snapshots are the one place Peekover stores the contents of your files.
- It keeps a limited number and removes older ones by itself, and you can turn snapshots off.
- Diagrams: drawings of the diagrams in your documents, kept so that they show faster next time; a limited number, with the oldest removed by itself.
- Two marks: that the setup guide was shown, and that you closed the note about snapshots.

## Seeing and deleting it

The "Stored data" panel on the app page lists what Peekover holds, except the mark for the note about snapshots.
"Wipe all data" in that panel deletes everything Peekover has stored.
The same panel can erase all snapshots, or clear the diagram drawings, on their own.
"Revoke" on an open folder forgets that folder and deletes its snapshots.

## Your files

Peekover reads a file on your computer only when you open it, and a folder only when you choose it or drop it on the app page.
While you watch a file, Peekover reads that one file again each time it checks for changes.
It changes a file on your disk only when you click Save in the editor, and only that file.
Exporting saves a file through your browser's downloads, and copying puts content on your clipboard; both happen only when you click them.

## Permissions

Peekover asks your browser for no permissions, on Chrome and on Firefox.
In Chrome and Edge, reading files from your computer needs the "Allow access to file URLs" setting, which you turn on yourself.

## Questions

For a question about privacy, open an issue on Peekover's GitHub repository once it is public.
To report a security problem, see [SECURITY.md](SECURITY.md).

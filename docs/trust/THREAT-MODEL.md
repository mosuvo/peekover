# Threat model — Peekover

This page says what Peekover protects, from whom, what it does not try to protect against, and which tests show each defence works.

## What Peekover protects

- The contents of the files you read with it.
- What it stores on your device, listed in [PRIVACY.md](PRIVACY.md).
- What you read: nobody should learn through Peekover what you read, or that you read it.
- Your files on disk: Peekover must not change a file you did not ask it to save.

## Who might attack

- The author of a markdown document you open, who can put HTML, links, images and diagrams in it.
- A website you visit, which might try to reach Peekover.
- Someone who gets harmful code into a package Peekover is built from.
- Someone watching your network.

## Defences, and the tests behind them

- A document's own script or markup: every rendered page is cleaned with DOMPurify before it is shown, and diagram drawings are cleaned again. Tests: `src/render/sanitize.test.ts`, `tests/browser/sanitize.browser.test.ts`, `tests/browser/diagramSanitize.browser.test.ts`.
- A document that makes the browser fetch something, such as a tracking image: remote images stay blocked until you load them. Tests: `src/render/mediaPolicy.test.ts`, `tests/browser/remoteMedia.browser.test.ts`.
- A feature that reaches the network on its own: each feature has a browser test that counts the requests it makes. Tests: `tests/browser/folderMode.network.browser.test.ts`, `tests/browser/tocNetwork.browser.test.ts`, `tests/browser/tableNetwork.browser.test.ts`, `tests/browser/watchNetwork.browser.test.ts`, `tests/browser/codeNetwork.browser.test.ts`, `tests/browser/diagramNetwork.browser.test.ts`, `tests/browser/mathNetwork.browser.test.ts`, `tests/browser/exportNetwork.browser.test.ts`, `tests/browser/editorNetwork.browser.test.ts`, `tests/browser/uiFontsNetwork.browser.test.ts`, `tests/browser/agentBadgeNetwork.browser.test.ts`.
- Broad access to your browser: Peekover requests no permissions and no host permissions, on Chrome and on Firefox. Tests: `tests/manifest.test.ts`, `tests/permissionsLedger.test.ts`.
- Watching used to read other files: the watch reader accepts only a markdown file opened from disk and refuses every other address unread. Test: `src/watch/watchRelay.test.ts`.
- Messages from other parts of the browser: Peekover's background answers only its own two kinds of message, about settings and watching, and checks each one's shape. Tests: `src/settings/settingsPort.test.ts`, `src/watch/watchRelay.test.ts`.
- Code loaded from outside the package: every import in the shipped code is fixed at build time, and CI checks this. Check: `scripts/check-dynamic-imports.ts`, run in `.github/workflows/supply-chain.yml`.
- A harmful or vulnerable dependency: CI installs exactly the locked versions and fails on a known advisory in the production dependencies, except one recorded exception. Check: `.github/workflows/supply-chain.yml`, `package.json` (the exception).
- Saving over a file that changed on disk: Save reads the file again first and writes nothing if it changed. Test: `tests/browser/editorSave.browser.test.ts`.

## Out of scope

- A browser, operating system or device that is already compromised.
- Other extensions you install.
- The sites that host images, once you choose to load them.
- Someone who can use your device or read your browser profile: Peekover's storage is not encrypted.
- A change to a file in the instant between Save's check and its write.

## Planned

- Build attestations on release files, from the first public release, so that a download can be checked against the source.

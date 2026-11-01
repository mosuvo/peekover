# Security policy — Peekover

## Reporting a vulnerability

Report security problems through GitHub private vulnerability reporting on this repository.
That channel opens when the repository becomes public at the first release; until then the repository is private.
For anything that is not a security problem, open a GitHub issue once the repository is public.

## What is true today

- The extension requests no browser permissions and no host permissions, on Chrome and on Firefox.
- Each capability it uses without a permission is listed in [PERMISSIONS.md](PERMISSIONS.md).
- It makes no network requests by default; browser tests check this on each surface.
- Remote images stay blocked until you choose to load them.
- Every rendered page is cleaned with DOMPurify before it is shown.
- CI checks that every code import in the shipped code is fixed at build time, so no code is loaded from outside the extension package.
- CI fails on a known advisory in the production dependencies, except one recorded exception in a dependency of the diagram library.
- CI generates a software bill of materials.

## Planned for the first public release

- A check in CI that two builds of the same source produce the same files, with the steps written down.
- A one-page threat model naming the tests behind each defence.
- Build attestations on release files.
- A privacy policy at https://peekover.dev/privacy/, not online yet.

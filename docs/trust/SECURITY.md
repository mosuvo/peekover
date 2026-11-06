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
- CI builds every push to `main` and every pull request twice, from two clean copies, and fails unless every packaged file and every zip is identical; [REPRODUCING.md](REPRODUCING.md) gives the steps to check a build yourself.
- What Peekover stores, and how to delete it, is in [PRIVACY.md](PRIVACY.md).
- What Peekover defends against, and the tests behind each defence, is in [THREAT-MODEL.md](THREAT-MODEL.md).

## Planned for the first public release

- Build attestations on release files.
- The privacy policy published at https://peekover.dev/privacy/, which is not online yet.

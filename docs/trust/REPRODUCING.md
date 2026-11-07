# Reproducing a build — Peekover

Two builds of the same commit produce byte-identical output: the unpacked Chrome and Firefox packages, the Chrome zip, the Firefox zip and the Firefox sources zip.
This page gives the steps to rebuild Peekover and check that for yourself.

## What you need

- Node.js 22, the version in `.nvmrc`; CI builds with it.
- pnpm 10.33.0, the version in `package.json`. With only npm installed, run each `pnpm` command below as `npx --yes pnpm@10.33.0`.
- git, and network access to install the dependencies from the npm registry.

Tested on Windows 11 (x64, Node 24.11.1) and on Ubuntu 24.04 (x64, Node 22.23.4); both gave the same bytes.
Not yet tested on ARM64 or macOS.

## Rebuild from the repository

```bash
git clone https://github.com/mosuvo/peekover.git
cd peekover
git checkout <commit>
pnpm install --frozen-lockfile
pnpm zip
pnpm zip -b firefox
```

The output is in `.output/`: `chrome-mv3/`, `firefox-mv3/`, and `peekover-<version>-chrome.zip`, `-firefox.zip` and `-sources.zip`.
Build in a fresh clone: the sources zip takes every file in the folder except dotfiles (`.nvmrc` is kept), `node_modules`, `.output`, test files and a few ignored files, so an extra file changes it.
No clock setting is needed: builds with and without `SOURCE_DATE_EPOCH` are identical, and every file in the zips is dated 1 January 1980.

## Compare

- `pnpm exec tsx scripts/compare-builds.ts --twice` clones the current commit twice into a temporary folder, builds both, and compares every file and every zip; it prints each file's SHA-256 and exits with an error on any difference.
- `pnpm exec tsx scripts/compare-builds.ts <first>/.output <second>/.output` compares two builds you already have.
- `pnpm exec tsx scripts/compare-builds.ts --hashes` prints the SHA-256 of every packaged file and every zip in `.output/`.

CI runs the `--twice` comparison on every push to `main` and on every pull request, and puts the hashes in the run summary.

## Rebuild from the Firefox sources zip

This is what a Firefox add-ons reviewer does with the sources zip; it needs no git.

```text
mkdir peekover-src
cd peekover-src
(extract peekover-<version>-sources.zip here)
npx --yes pnpm@10.33.0 install --frozen-lockfile
npx --yes pnpm@10.33.0 zip -b firefox
```

`.output/peekover-<version>-firefox.zip` is then byte-identical to the Firefox zip built from the same commit.
Mozilla's default review environment is Ubuntu 24.04.4 on ARM64 with Node 24.14.0 and npm 11.9.0.
Peekover differs: it is built with pnpm 10.33.0, on Node 22, and has been tested on x64 only.

## How the zips are made identical

WXT writes each zip with the time of the build and in the order it finds the files.
After each zip is written, `scripts/normalizeZip.ts` sorts its entries by name and gives every entry the same date; the compressed data is not changed.

## Planned for the first public release

- A `SHA256SUMS` file with each release, to compare a rebuild against.

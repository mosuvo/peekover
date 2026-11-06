# Source code review — Peekover

For Firefox add-on reviewers: this folder is the source of the Peekover add-on, and the steps below rebuild it.

## What you need

- Node.js 22, the version in `.nvmrc`.
- pnpm 10.33.0, the version in `package.json`. With only npm installed, `npx --yes pnpm@10.33.0` runs it, as in the commands below.
- Network access to install the dependencies from the npm registry; `pnpm-lock.yaml` fixes every version.

Mozilla's default review environment is Ubuntu 24.04.4 on ARM64 with Node 24.14.0 and npm 11.9.0.
Peekover differs: it is built with pnpm 10.33.0, on Node 22, and has been tested on x64 only.
These steps were run on Ubuntu 24.04 (x64) with Node 22 and npm 10, from this folder alone, with no git.

## Build

In this folder (the one that holds `package.json`):

```bash
npx --yes pnpm@10.33.0 install --frozen-lockfile
npx --yes pnpm@10.33.0 zip -b firefox
```

`.output/peekover-<version>-firefox.zip` is then byte-identical to the submitted Firefox zip, and `.output/firefox-mv3/` holds the same files unpacked.

## More

How the build is made identical, and how to compare two builds file by file, is in [docs/trust/REPRODUCING.md](docs/trust/REPRODUCING.md).

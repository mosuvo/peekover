import { defineConfig } from 'wxt';
import { readFileSync, writeFileSync } from 'node:fs';
import { licenceInventoryPlugin, onBuildBefore, onBuildDone } from './scripts/licenceInventory';
import { normalizeZip } from './scripts/normalizeZip';

const repackZip = (zipPath: string): void => writeFileSync(zipPath, normalizeZip(readFileSync(zipPath)));

// Peekover — zero network by default. Auto-imports are disabled so that lint and
// typecheck stay fully explicit: WXT helpers are imported from '#imports'.
export default defineConfig({
  imports: false,
  // Third-party licence notices (M13 task 7.2a): every build step reports the packages whose code it bundled, and
  // a production build fails when public/THIRD_PARTY_LICENSES.txt does not list exactly those (scripts/licenceInventory.ts).
  vite: () => ({ plugins: [licenceInventoryPlugin()] }),
  hooks: {
    'build:before': (wxt) => onBuildBefore(wxt),
    'build:done': (wxt) => onBuildDone(wxt),
    // Reproducible zips (M13 task 7.3): WXT's zips carry the build's time and a crawl-order entry list; each is
    // repacked sorted, with one fixed date, its compressed data unchanged (scripts/normalizeZip.ts).
    'zip:extension:done': (_wxt, zipPath) => repackZip(zipPath),
    'zip:sources:done': (_wxt, zipPath) => repackZip(zipPath),
  },
  // The Firefox sources zip (M13 task 7.3). WXT zips the working directory, dotfiles excluded: `.nvmrc` (the Node pin
  // a reviewer builds with) is added back; gitignored scratch that is not a dotfile is kept out, so a local zip holds
  // what a clean clone holds.
  zip: {
    includeSources: ['.nvmrc'],
    excludeSources: ['**/__screenshots__/**', '**/*.local.md', 'sbom.cdx.json'],
  },
  // Target Manifest V3 on every browser. WXT defaults Firefox (and Safari) to
  // MV2, but our security posture (spec §6) claims MV3 + a non-persistent
  // background, so the Firefox build must be MV3 too. This is a no-op for
  // Chrome, which is already MV3. See docs/ai/decisions.md (2026-07-14).
  manifestVersion: 3,
  manifest: ({ browser }) => ({
    name: 'Peekover',
    description:
      'Render raw markdown into beautiful, private reading. Zero network by default.',
    // Permissions stay empty until a feature needs one; each addition must be
    // justified in docs/trust/PERMISSIONS.md in the same PR (AGENTS.md #4).
    permissions: [],
    // Toolbar action (spec 002 / task 1.1). NO `default_popup`: a click fires
    // `action.onClicked` in the background, which opens the bundled app page in a
    // full tab (entrypoints/background.ts). `action` is a manifest KEY, not a
    // permission — the built manifest keeps `permissions: []` on both engines,
    // CI-pinned by tests/manifest.test.ts. The full-tab page (not a popup) is where
    // showDirectoryPicker/requestPermission actually work (spec §3, Task-0-verified).
    action: {
      default_title: 'Open Peekover',
      // The toolbar icon (M13 task 2.6, plan D-15): the 16 and 32 drawings. Like `icons` below, a
      // manifest key, not a permission (PERMISSIONS.md).
      default_icon: { 16: 'icons/icon-16.png', 32: 'icons/icon-32.png' },
    },
    // The extension icon, each size its own drawing from design/icons.html, rendered to PNG by
    // scripts/render-icons.ts into public/icons/ (WXT copies public/ into the build). Chrome takes no
    // SVG or WebP here.
    icons: {
      16: 'icons/icon-16.png',
      32: 'icons/icon-32.png',
      48: 'icons/icon-48.png',
      128: 'icons/icon-128.png',
    },
    // The minimum browser versions (M13 task 7.1): the newest feature each engine needs, from the inventory in
    // tests/browserFloor.test.ts (MDN browser-compat-data), which pins both. Chrome 121: CSS scrollbar-color.
    // Firefox 127: ClipboardItem / Clipboard.write(), the copy actions. Each engine's key in its own manifest only.
    ...(browser === 'firefox' ? {} : { minimum_chrome_version: '121' }),
    // Firefox-only keys. Gated on `browser` so they never appear in the Chrome
    // MV3 manifest (Chrome would warn "Unrecognized manifest key"). AGENTS.md #4.
    ...(browser === 'firefox'
      ? {
          browser_specific_settings: {
            gecko: {
              // Stable extension ID — required for an MV3 AMO submission.
              id: 'peekover@peekover.dev',
              strict_min_version: '127.0',
              // Peekover collects no data (AGENTS.md #1/#2). Mozilla requires new
              // extensions to declare this; "none" is the collects-nothing value.
              data_collection_permissions: { required: ['none'] },
            },
          },
        }
      : {}),
  }),
});

import { defineConfig } from 'wxt';

// Peekover — zero network by default. Auto-imports are disabled so that lint and
// typecheck stay fully explicit: WXT helpers are imported from '#imports'.
export default defineConfig({
  imports: false,
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
    action: { default_title: 'Open Peekover' },
    // Firefox-only keys. Gated on `browser` so they never appear in the Chrome
    // MV3 manifest (Chrome would warn "Unrecognized manifest key"). AGENTS.md #4.
    ...(browser === 'firefox'
      ? {
          browser_specific_settings: {
            gecko: {
              // Stable extension ID — required for an MV3 AMO submission.
              id: 'peekover@peekover.dev',
              // Peekover collects no data (AGENTS.md #1/#2). Mozilla requires new
              // extensions to declare this; "none" is the collects-nothing value.
              data_collection_permissions: { required: ['none'] },
            },
          },
        }
      : {}),
  }),
});

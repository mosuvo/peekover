import { defineConfig } from 'wxt';

// Peekover — zero network by default. Auto-imports are disabled so that lint and
// typecheck stay fully explicit: WXT helpers are imported from '#imports'.
export default defineConfig({
  imports: false,
  manifest: {
    name: 'Peekover',
    description:
      'Render raw markdown into beautiful, private reading. Zero network by default.',
    // Permissions stay empty until a feature needs one; each addition must be
    // justified in docs/trust/PERMISSIONS.md in the same PR (AGENTS.md #4).
    permissions: [],
  },
});

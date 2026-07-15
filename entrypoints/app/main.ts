import { mountAppShell } from '@/src/app/appShell';

// Bootstrap for the bundled app page (spec 002). Side-effects only — the entrypoint
// binds the DOM to the shell, mirroring how the content entrypoint only calls
// runReader(). All layout/logic lives in src/app/* so it is unit-testable without a
// real page (the M1 runReader/mountReader discipline).
const root = document.getElementById('app');
if (root) {
  const app = mountAppShell(root);

  // DEV-ONLY manual seam (task 1.2). There is no folder source yet (group 3), so in
  // `pnpm dev` the human feeds a file by hand to confirm the reader pane renders it
  // through the themed M1 pipeline and that the no-selection/empty states show designed
  // content. Guarded by import.meta.env.DEV so it is stripped from production builds —
  // it adds no capability, no network, no stored state, only a console handle:
  //   __peekover.selectFile({ name: 'demo.md', read: async () => '# Hello\n\nWorld' })
  //   __peekover.selectFile({ name: 'empty.md', read: async () => '' })   // empty state
  //   __peekover.selectFile({ read: async () => { throw new Error('x') } }) // unreadable
  //   __peekover.selectFile(null)                                          // no-selection
  if (import.meta.env.DEV) {
    (globalThis as unknown as { __peekover?: typeof app }).__peekover = app;
  }
}

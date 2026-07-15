import { mountAppShell } from '@/src/app/appShell';

// Bootstrap for the bundled app page (spec 002 / task 1.1). Side-effects only —
// the entrypoint binds the DOM to the shell, mirroring how the content entrypoint
// only calls runReader(). All layout/logic lives in src/app/appShell.ts so it is
// unit-testable without a real page (the M1 runReader/mountReader discipline).
const root = document.getElementById('app');
if (root) mountAppShell(root);

import { mountOnboarding, ONBOARDING_COPY, type OnboardingDeps } from '../../src/app/onboarding';
import { browser } from 'wxt/browser';
import { getSettings, putSettings } from '../../src/app/store';
import { directPort } from '../../src/settings/settingsPort';

// Bootstrap for the setup guide (M13 task 6.1; plan D-11). Side effects only: the page lives in
// src/app/onboarding.ts. Relative imports, as the app entry's (its header says why).
//
// ★ THE FIREFOX BUILD NEVER CALLS THE FILE-ACCESS API. `import.meta.env.FIREFOX` is a build-time
// constant (the `backgroundCanReadFileUrls` pattern, contentWatch.ts), so the Chromium branch below
// is dropped from the Firefox chunk entirely. MDN documents the API but not Firefox's answer, and the
// project's record is that Firefox opens local files with no toggle (pending 8.1's real install).
// `onboarding.test.ts` bundles this file for both engines and checks the API's name in each.
//
// The deep link: `tabs.create` with `chrome://extensions/?id=<id>` from an extension page opens
// Peekover's details on a real loaded Chromium 149 (decisions.md 6.1, measured). It needs no `tabs`
// permission — it reads no tab field.

function chromiumDeps(): OnboardingDeps {
  // The promise form (Chrome 99+); the shipped typings declare only the callback form.
  const ext = browser?.extension as { isAllowedFileSchemeAccess?: () => Promise<boolean> } | undefined;
  return {
    engine: 'chromium',
    readFileAccess: typeof ext?.isAllowedFileSchemeAccess === 'function' ? () => ext.isAllowedFileSchemeAccess!() : undefined,
    openDetails: () =>
      browser.tabs.create({ url: `chrome://extensions/?id=${encodeURIComponent(browser.runtime.id)}` }),
  };
}

// The saved theme (6.2): this page is extension-origin, so it reads the settings store directly —
// the app page's `directPort` (bounded, falls back to Auto). No permission, no request.
const loadTheme = (): Promise<unknown> => directPort({ getSettings, putSettings }).load().then((s) => s.theme);

const root = document.getElementById('onboarding');
if (root) {
  try {
    mountOnboarding(root, import.meta.env.FIREFOX ? { engine: 'firefox', loadTheme } : { ...chromiumDeps(), loadTheme });
  } catch {
    // Never a blank page (AGENTS.md #5): plain text, no sheet needed.
    const p = document.createElement('p');
    p.textContent = ONBOARDING_COPY.failed;
    root.replaceChildren(p);
  }
}

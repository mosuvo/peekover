import { mountOnboarding, ONBOARDING_COPY, type OnboardingDeps } from '../../src/app/onboarding';
import { browser } from 'wxt/browser';
import { getSettings, putSettings } from '../../src/app/store';
import { directPort } from '../../src/settings/settingsPort';

// Bootstrap for the setup guide (M13 task 6.1; plan D-11). Side effects only: the page lives in
// src/app/onboarding.ts. Relative imports, as the app entry's (its header says why).
//
// ★ BOTH BUILDS READ THE FILE-ACCESS SETTING (since 2026-11-10, Firefox floor 153). Firefox 153 made
// local-file access a separate, default-off setting ("Access local files on your computer"), and
// `extension.isAllowedFileSchemeAccess()` reports it (MDN browser-compat-data; measured on the
// AMO-signed 0.0.9, Firefox 159 — decisions.md, "the AMO-signed 0.0.9 on a real Firefox"). No
// permission either way. `import.meta.env.FIREFOX` is a build-time constant, so the Chromium-only
// deep link below is dropped from the Firefox chunk; `onboarding.test.ts` bundles both engines.
//
// The deep link: `tabs.create` with `chrome://extensions/?id=<id>` from an extension page opens
// Peekover's details on a real loaded Chromium 149 (decisions.md 6.1, measured). It needs no `tabs`
// permission — it reads no tab field.

/** The setting reader, on either engine (the promise form; the shipped typings declare only the callback form). */
function fileAccessReader(): OnboardingDeps['readFileAccess'] {
  const ext = browser?.extension as { isAllowedFileSchemeAccess?: () => Promise<boolean> } | undefined;
  return typeof ext?.isAllowedFileSchemeAccess === 'function' ? () => ext.isAllowedFileSchemeAccess!() : undefined;
}

function chromiumDeps(): OnboardingDeps {
  return {
    engine: 'chromium',
    readFileAccess: fileAccessReader(),
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
    mountOnboarding(
      root,
      import.meta.env.FIREFOX ? { engine: 'firefox', readFileAccess: fileAccessReader(), loadTheme } : { ...chromiumDeps(), loadTheme },
    );
  } catch {
    // Never a blank page (AGENTS.md #5): plain text, no sheet needed.
    const p = document.createElement('p');
    p.textContent = ONBOARDING_COPY.failed;
    root.replaceChildren(p);
  }
}

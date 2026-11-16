import { mountOnboarding, ONBOARDING_COPY, type OnboardingDeps } from '../../src/app/onboarding';
import { chromiumFigure, firefoxFigure } from '../../src/app/onboardingFigures';
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

// Site access (8.1f, walk I-2): whether Peekover still holds its content-script sites. Chrome's site access can
// withhold them while "Allow access to file URLs" stays on (Chrome 157, measured); Firefox lets the user turn
// each raw host's permission off. `permissions.contains` and `runtime.getManifest` need no permission; the
// patterns are the manifest's own content-script matches, so there is no second list to drift.
function siteAccessReader(): OnboardingDeps['readSiteAccess'] {
  const contains = browser?.permissions?.contains;
  const manifest = browser?.runtime?.getManifest?.();
  if (typeof contains !== 'function' || !manifest) return undefined;
  const matches = (manifest.content_scripts ?? []).flatMap((c) => c.matches ?? []);
  const of = { files: matches.filter((m) => m.startsWith('file:')), web: matches.filter((m) => !m.startsWith('file:')) };
  return (sites) => (of[sites].length ? browser.permissions.contains({ origins: of[sites] }) : Promise.resolve(undefined));
}

function chromiumDeps(): OnboardingDeps {
  return {
    engine: 'chromium',
    readFileAccess: fileAccessReader(),
    readSiteAccess: siteAccessReader(),
    openDetails: () =>
      browser.tabs.create({ url: `chrome://extensions/?id=${encodeURIComponent(browser.runtime.id)}` }),
    figure: chromiumFigure,
  };
}

// Firefox (0.1.2, D3): the build declares `options_ui` (wxt.config.ts), so `runtime.openOptionsPage()` opens
// about:addons on Peekover's own card — Options selected, "Permissions and data" one tab over (measured on Firefox
// 160; `tabs.create('about:addons')` is refused there as an illegal URL). No permission. The options page is this
// guide with `?embedded`: inside about:addons the button is not offered.
function firefoxDeps(): OnboardingDeps {
  return {
    engine: 'firefox',
    readFileAccess: fileAccessReader(),
    readSiteAccess: siteAccessReader(),
    openAddons: () => browser.runtime.openOptionsPage(),
    embedded: new URL(location.href).searchParams.has('embedded'),
    figure: firefoxFigure,
  };
}

// "Try it" (0.1.2, D4): the app page with `?sample` shows the bundled sample through its store-free seam
// (`entrypoints/app/main.ts`). `tabs.create` with the extension's own URL needs no permission (background.ts (1)).
const openSample = (): Promise<unknown> => browser.tabs.create({ url: browser.runtime.getURL('/app.html?sample') });

// The saved theme (6.2): this page is extension-origin, so it reads the settings store directly —
// the app page's `directPort` (bounded, falls back to Auto). No permission, no request.
const loadTheme = (): Promise<unknown> => directPort({ getSettings, putSettings }).load().then((s) => s.theme);

const root = document.getElementById('onboarding');
if (root) {
  try {
    mountOnboarding(
      root,
      { ...(import.meta.env.FIREFOX ? firefoxDeps() : chromiumDeps()), openSample, loadTheme },
    );
  } catch {
    // Never a blank page (AGENTS.md #5): plain text, no sheet needed.
    const p = document.createElement('p');
    p.textContent = ONBOARDING_COPY.failed;
    root.replaceChildren(p);
  }
}

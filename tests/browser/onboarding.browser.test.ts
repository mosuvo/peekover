// THE SETUP GUIDE (M13 task 6.1; plan D-11; gate-1 Q18) — Chromium and Firefox.
//
// The page is mounted here through the same `mountOnboarding` the entry calls, with the entry's two
// Chromium dependencies stubbed (the harness page is not an extension page): every detection outcome
// is reached and shown on both engines; the page fits at 414 and 1440 px; nothing leaves the origin
// (read after `wireSettled()`, with a firing control that includes a SLOW request); the keyboard
// reaches the one control in order and every part has its name; a toggled answer repaints on focus;
// the page is never blank, including the real entry run outside an extension; and the app page
// links to it at 1440 (the toolbar) and at 414 (the "⋯" menu).

import { describe, it, expect, afterEach } from 'vitest';
import { page, userEvent, commands } from 'vitest/browser';
import { putSettings, __resetConnectionForTest, DB_NAME } from '../../src/app/store';
import type { ThemeSetting } from '../../src/settings/settings';
import { mountOnboarding, ONBOARDING_CLASS, ONBOARDING_COPY, type OnboardingController, type OnboardingDeps } from '../../src/app/onboarding';
import { mountAppShell, type AppStore } from '../../src/app/appShell';
import { TOOLBAR_CLASS } from '../../src/app/toolbar';
import { isOffOrigin, networkedUrls, offOriginProbeUrl, wireSettled } from './helpers/diagramWindow';
import { resetThemeHostsForTest } from '../../src/theme/themeRegistry';
import { resetThemeControlsForTest } from '../../src/theme/themeControl';
import { setThemeSetting } from '../../src/theme/reader';

const C = ONBOARDING_CLASS;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function waitFor<T>(fn: () => T | null | undefined | false, what: string, tries = 300): Promise<T> {
  for (let i = 0; i < tries; i += 1) {
    const v = fn();
    if (v) return v as T;
    await sleep(20);
  }
  throw new Error(`timed out waiting for ${what}`);
}

const mounted: OnboardingController[] = [];
const hosts: HTMLElement[] = [];
function host(): HTMLElement {
  const h = document.createElement('div');
  document.body.appendChild(h);
  hosts.push(h);
  return h;
}
function open(deps: OnboardingDeps, theme?: 'light' | 'dark'): OnboardingController {
  const ctl = mountOnboarding(host(), deps);
  if (theme) ctl.element.dataset.theme = theme;
  mounted.push(ctl);
  return ctl;
}
afterEach(async () => {
  for (const c of mounted.splice(0)) c.destroy();
  for (const h of hosts.splice(0)) h.remove();
  setThemeSetting('auto');
  resetThemeHostsForTest();
  resetThemeControlsForTest();
  await page.viewport(414, 896);
});

const access = (ctl: OnboardingController): HTMLElement => ctl.element.querySelector<HTMLElement>('[data-part="access"]')!;
const steps = (ctl: OnboardingController): HTMLElement | null => ctl.element.querySelector<HTMLElement>(`.${C}__steps`);
const shown = (el: Element | null): boolean => !!el && el.getClientRects().length > 0 && getComputedStyle(el).visibility === 'visible';

/** Every outcome D-11 names, with the deps that reach it and what must be on screen. */
const OUTCOMES: Array<{ name: string; deps: OnboardingDeps; text: string; steps: boolean; tone: string | undefined }> = [
  { name: 'Chromium, access on', deps: { engine: 'chromium', readFileAccess: async () => true }, text: ONBOARDING_COPY.on, steps: false, tone: undefined },
  { name: 'Chromium, access off', deps: { engine: 'chromium', readFileAccess: async () => false }, text: ONBOARDING_COPY.off, steps: true, tone: 'warn' },
  { name: 'Chromium, the API throws', deps: { engine: 'chromium', readFileAccess: () => Promise.reject(new Error('no')) }, text: ONBOARDING_COPY.unknown, steps: true, tone: 'warn' },
  { name: 'Chromium, the API is missing', deps: { engine: 'chromium' }, text: ONBOARDING_COPY.unknown, steps: true, tone: 'warn' },
  { name: 'Firefox, access on', deps: { engine: 'firefox', readFileAccess: async () => true }, text: ONBOARDING_COPY.onFirefox, steps: false, tone: undefined },
  { name: 'Firefox, access off', deps: { engine: 'firefox', readFileAccess: async () => false }, text: ONBOARDING_COPY.offFirefox, steps: true, tone: 'warn' },
  { name: 'Firefox, the API throws', deps: { engine: 'firefox', readFileAccess: () => Promise.reject(new Error('no')) }, text: ONBOARDING_COPY.unknown, steps: true, tone: 'warn' },
];

describe('6.1 — every detection outcome, on screen', () => {
  for (const o of OUTCOMES) {
    it(`${o.name}: its own copy, steps ${o.steps ? 'shown' : 'absent'}, the raw hosts stated`, async () => {
      await page.viewport(1440, 900);
      const ctl = open(o.deps);
      await waitFor(() => access(ctl).textContent === o.text, `"${o.text}"`);
      expect(shown(access(ctl)), 'the state is on screen').toBe(true);
      expect(access(ctl).dataset.tone).toBe(o.tone);
      expect(shown(steps(ctl)), 'the steps').toBe(o.steps);
      expect(ctl.element.textContent).toContain(ONBOARDING_COPY.web);
      expect(shown(ctl.element.querySelector(`.${C}__title`))).toBe(true);
    });
  }
});

describe('6.1 — layout at 414 and 1440 px, both themes', () => {
  for (const width of [414, 1440]) {
    for (const theme of ['light', 'dark'] as const) {
      it(`${width} px, ${theme}: the card fits the window with a 16 px gutter, no sideways scroll; themed from tokens`, async () => {
        await page.viewport(width, 900);
        const ctl = open({ engine: 'chromium', readFileAccess: async () => false }, theme);
        await waitFor(() => access(ctl).textContent === ONBOARDING_COPY.off, 'off');
        await document.fonts.ready;
        const card = ctl.element.querySelector<HTMLElement>(`.${C}__card`)!.getBoundingClientRect();
        expect(card.left, 'left gutter').toBeGreaterThanOrEqual(16 - 0.5);
        expect(width - card.right, 'right gutter').toBeGreaterThanOrEqual(16 - 0.5);
        expect(card.width).toBeLessThanOrEqual(440.5);
        expect(ctl.element.scrollWidth, 'no sideways scroll').toBeLessThanOrEqual(ctl.element.clientWidth);
        const paper = getComputedStyle(ctl.element).backgroundColor;
        expect(paper).toBe(theme === 'light' ? 'rgb(251, 251, 248)' : 'rgb(18, 20, 28)');
      });
    }
  }
});

describe('6.1 — re-check on focus and on becoming visible (D-11)', () => {
  it('a toggled answer repaints on window focus, without a reload', async () => {
    let value = false;
    const ctl = open({ engine: 'chromium', readFileAccess: async () => value });
    await waitFor(() => access(ctl).textContent === ONBOARDING_COPY.off, 'off');
    value = true;
    window.dispatchEvent(new Event('focus'));
    await waitFor(() => access(ctl).textContent === ONBOARDING_COPY.on, 'on after focus', 50).catch(() => undefined);
    expect(access(ctl).textContent, 'the state after a focus — stale means the listener is gone').toBe(ONBOARDING_COPY.on);
    expect(shown(steps(ctl)), 'the steps go once access is on').toBe(false);
    value = false;
    document.dispatchEvent(new Event('visibilitychange'));
    await waitFor(() => access(ctl).textContent === ONBOARDING_COPY.off, 'off after visibilitychange', 50).catch(() => undefined);
    expect(access(ctl).textContent, 'the state after visibilitychange').toBe(ONBOARDING_COPY.off);
  });
});

describe('6.1 — keyboard and names', () => {
  it('the one control is first in Tab order and named; the landmark, heading and status are named', async () => {
    await page.viewport(1440, 900);
    let opened = 0;
    const ctl = open({ engine: 'chromium', readFileAccess: async () => false, openDetails: async () => (opened += 1) });
    await waitFor(() => access(ctl).textContent === ONBOARDING_COPY.off, 'off');
    const focusable = [...ctl.element.querySelectorAll<HTMLElement>('a[href], button, input, select, textarea, [tabindex]')].filter(shown);
    expect(focusable.map((el) => el.textContent)).toEqual([ONBOARDING_COPY.openDetails]);
    (document.activeElement as HTMLElement | null)?.blur();
    await userEvent.tab();
    expect(document.activeElement, 'Tab reaches the button').toBe(focusable[0]);
    await userEvent.keyboard('{Enter}');
    await waitFor(() => opened === 1, 'Enter activates it');
    const main = ctl.element;
    expect(main.tagName).toBe('MAIN');
    expect(page.elementLocator(main).getByRole('heading', { level: 1, name: ONBOARDING_COPY.title }).query()).not.toBeNull();
    expect(page.elementLocator(main).getByRole('region', { name: ONBOARDING_COPY.title }).query()).not.toBeNull();
    expect(page.elementLocator(main).getByRole('button', { name: ONBOARDING_COPY.openDetails }).query()).not.toBeNull();
    expect(access(ctl).getAttribute('role')).toBe('status');
    for (const n of ctl.element.querySelectorAll(`.${C}__n`)) expect(n.getAttribute('aria-hidden'), 'step numbers are decoration').toBe('true');
  });

  it('a refused deep link shows the address fallback, as a status', async () => {
    const ctl = open({ engine: 'chromium', readFileAccess: async () => false, openDetails: () => Promise.reject(new Error('blocked')) });
    ctl.element.querySelector<HTMLButtonElement>(`.${C}__cta`)!.click();
    const failed = await waitFor(() => {
      const el = ctl.element.querySelector<HTMLElement>('[data-part="open-failed"]');
      return el && shown(el) ? el : null;
    }, 'the fallback');
    expect(failed.textContent).toBe(ONBOARDING_COPY.openFailed);
    expect(failed.getAttribute('role')).toBe('status');
  });
});

describe('6.1 — never blank (AGENTS.md #5)', () => {
  it('before the browser answers, the card is already on screen with the unknown state', async () => {
    const ctl = open({ engine: 'chromium', readFileAccess: () => new Promise(() => undefined) });
    expect(shown(ctl.element.querySelector(`.${C}__card`))).toBe(true);
    expect(access(ctl).textContent).toBe(ONBOARDING_COPY.unknown);
  });

  it('the real entry, outside an extension (no file-access API, no tabs): the unknown card, not a blank page', async () => {
    const root = host();
    root.id = 'onboarding';
    await import('../../entrypoints/onboarding/main');
    const main = await waitFor(() => root.querySelector<HTMLElement>(`.${C}`), 'the entry mounted the page');
    expect(main.querySelector('[data-part="access"]')?.textContent).toBe(ONBOARDING_COPY.unknown);
    expect(shown(main.querySelector(`.${C}__card`))).toBe(true);
    root.removeAttribute('id');
  });
});

describe('6.1 — zero network (AGENTS.md #1)', () => {
  it('★ mount, fonts, a re-check and the deep link: nothing off-origin, read after the wire settles', async () => {
    performance.clearResourceTimings();
    const ctl = open({ engine: 'chromium', readFileAccess: async () => false, openDetails: async () => undefined });
    await waitFor(() => access(ctl).textContent === ONBOARDING_COPY.off, 'off');
    window.dispatchEvent(new Event('focus'));
    ctl.element.querySelector<HTMLButtonElement>(`.${C}__cta`)!.click();
    await document.fonts.ready;
    await wireSettled();
    expect(networkedUrls().filter(isOffOrigin), 'the setup guide put an OFF-ORIGIN request on the wire').toEqual([]);
  }, 30_000);

  it('FIRING CONTROL + SLOW CASE — the same reading sees an off-origin request in the page, even a late one', async () => {
    const ctl = open({ engine: 'chromium', readFileAccess: async () => false });
    await waitFor(() => access(ctl).textContent === ONBOARDING_COPY.off, 'off');
    performance.clearResourceTimings();
    const stamp = Math.trunc(performance.now());
    const fast = offOriginProbeUrl(`/__peekover_probe__/onboard-fast-${stamp}.png`);
    const slow = offOriginProbeUrl(`/__peekover_probe__/onboard-slow-${stamp}.png`);
    const img = (src: string): void => {
      const i = document.createElement('img');
      i.src = src;
      ctl.element.append(i);
    };
    img(fast);
    await sleep(400);
    img(slow); // issued late, inside the window
    await wireSettled();
    const off = networkedUrls().filter(isOffOrigin);
    expect(off, 'the firing control did not fire').toContain(fast);
    expect(off, 'the SLOW request was not seen after settle').toContain(slow);
  }, 30_000);
});

describe('6.1 — reachable from the app page ("Setup guide")', () => {
  const store = (): AppStore => ({ putFolder: async () => undefined, deleteFolder: async () => undefined, putRecent: async () => undefined });
  it('at 1440 px a link in the toolbar, opening the page in a new tab', async () => {
    await page.viewport(1440, 900);
    const c = host();
    mountAppShell(c, { openFolder: async () => ({ ok: false, reason: 'cancelled', message: '' }), store: store() });
    const link = await waitFor(() => c.querySelector<HTMLAnchorElement>(`.${TOOLBAR_CLASS}__guide`), 'the link');
    expect(shown(link)).toBe(true);
    expect(link.textContent).toBe('Setup guide');
    expect(new URL(link.href).pathname).toBe('/onboarding.html');
    expect(link.target).toBe('_blank');
    expect(link.rel).toBe('noopener');
    expect(page.elementLocator(c).getByRole('link', { name: 'Setup guide' }).query()).toBe(link);
  });

  it('at 414 px the last item of "⋯", which follows the same link', async () => {
    await page.viewport(414, 896);
    const c = host();
    mountAppShell(c, { openFolder: async () => ({ ok: false, reason: 'cancelled', message: '' }), store: store() });
    const link = await waitFor(() => c.querySelector<HTMLAnchorElement>(`.${TOOLBAR_CLASS}__guide`), 'the link');
    expect(shown(link), 'the link itself is behind "⋯"').toBe(false);
    let followed = 0;
    link.addEventListener('click', (e) => {
      followed += 1;
      e.preventDefault(); // the harness stays on its page
    });
    c.querySelector<HTMLButtonElement>(`.${TOOLBAR_CLASS}__more`)!.click();
    const items = await waitFor(() => {
      const list = [...c.querySelectorAll<HTMLButtonElement>(`.${TOOLBAR_CLASS}__menu [role="menuitem"]`)];
      return list.length ? list : null;
    }, 'the menu');
    expect(items.at(-1)?.textContent).toBe('Setup guide');
    items.at(-1)!.click();
    expect(followed).toBe(1);
  });
});

// 6.2 (folded in from 6.1's flagged deviation): the guide follows the user's SAVED Peekover theme, as
// the app page does — a manual light or dark wins over the system, Auto follows it. The setting is read
// from the settings store, which this extension page reaches directly (its own origin, no permission).
describe('6.2 — the saved Peekover theme, not only the system one', () => {
  const PAPER = { light: 'rgb(251, 251, 248)', dark: 'rgb(18, 20, 28)' } as const;
  const paper = (el: Element): string => getComputedStyle(el).backgroundColor;
  afterEach(async () => {
    await commands.emulateColorScheme(null);
    __resetConnectionForTest();
    await sleep(0);
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.deleteDatabase(DB_NAME);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  });

  const CASES: Array<{ saved: ThemeSetting; system: 'light' | 'dark'; paints: 'light' | 'dark' }> = [
    { saved: 'dark', system: 'light', paints: 'dark' },
    { saved: 'light', system: 'dark', paints: 'light' },
    { saved: 'auto', system: 'light', paints: 'light' },
    { saved: 'auto', system: 'dark', paints: 'dark' },
  ];
  for (const k of CASES) {
    it(`saved ${k.saved} on a ${k.system} system paints ${k.paints} (the page's own sheet, step numbers too)`, async () => {
      await commands.emulateColorScheme(k.system);
      const ctl = open({ engine: 'chromium', readFileAccess: async () => false, loadTheme: async () => k.saved });
      await waitFor(() => access(ctl).textContent === ONBOARDING_COPY.off, 'off');
      await waitFor(() => paper(ctl.element) === PAPER[k.paints], `--paper ${k.paints}`, 50).catch(() => undefined);
      expect(paper(ctl.element), `the saved setting "${k.saved}" on a ${k.system} system`).toBe(PAPER[k.paints]);
      const n = ctl.element.querySelector(`.${C}__n`)!;
      expect(getComputedStyle(n).color, 'the step number keeps its pair').toBe(k.paints === 'dark' ? PAPER.dark : 'rgb(22, 23, 31)');
    });
  }

  it('a saved setting that cannot be read leaves the system theme, and the page is still there', async () => {
    await commands.emulateColorScheme('dark');
    const ctl = open({ engine: 'firefox', loadTheme: () => Promise.reject(new Error('no store')) });
    await sleep(50);
    expect(paper(ctl.element)).toBe(PAPER.dark);
    expect(shown(ctl.element.querySelector(`.${C}__card`))).toBe(true);
  });

  // The real entry over the real settings store — the wiring, not only the module.
  for (const k of CASES.slice(0, 2)) {
    it(`the real entry: a saved ${k.saved} setting on a ${k.system} system paints ${k.paints}`, async () => {
      await commands.emulateColorScheme(k.system);
      await putSettings({ theme: k.saved });
      const root = host();
      root.id = 'onboarding';
      const spec = `../../entrypoints/onboarding/main.ts?theme-${k.saved}`;
      await import(/* @vite-ignore */ spec);
      const main = await waitFor(() => root.querySelector<HTMLElement>(`.${C}`), 'the entry mounted the page');
      await waitFor(() => paper(main) === PAPER[k.paints], `--paper ${k.paints}`, 100).catch(() => undefined);
      root.removeAttribute('id');
      expect(paper(main), `the entry with "${k.saved}" saved`).toBe(PAPER[k.paints]);
    });
  }
});

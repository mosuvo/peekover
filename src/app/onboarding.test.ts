// The setup guide (M13 task 6.1; plan D-11). Runs under Node: the page is built into a JSDOM window
// made here (the jsdom package), because the bundle clause below runs esbuild, which does not run
// inside the DOM-emulating environment. The environment itself is asserted first.
//
// (1) detection: true / false / a throw / a rejection / a missing reader / a non-boolean — each
//     its own state, and the four that matter render distinct copy;
// (2) the Firefox page asks too (since Firefox 153 the local-file setting exists) and shows its own steps;
// (3) a focus or a return to visible re-reads, so a toggled answer repaints without a reload;
// (4) the deep link: a rejecting or missing opener shows the fallback, a working one does not;
// (5) constructed DOM only — the module never writes HTML;
// (6) THE BUNDLE: `entrypoints/onboarding/main.ts`, bundled for each engine with WXT's build-time
//     `import.meta.env.FIREFOX`, references the file-access API on Chromium (the firing control)
//     and, since the floor moved to Firefox 153, on Firefox too (without the Chromium deep link).
import { describe, it, expect, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  detectFileAccess,
  mountOnboarding,
  ONBOARDING_CLASS,
  ONBOARDING_COPY,
  type FileAccessState,
  type OnboardingController,
  type OnboardingDeps,
} from './onboarding';

const C = ONBOARDING_CLASS;
const flush = (): Promise<void> => new Promise((r) => setTimeout(r, 0));

let dom: JSDOM;
const mounted: OnboardingController[] = [];
function mount(deps: OnboardingDeps): { ctl: OnboardingController; doc: Document; win: Window & typeof globalThis } {
  dom = new JSDOM('<!doctype html><html><head></head><body><div id="r"></div></body></html>');
  const doc = dom.window.document;
  // JSDOM's visibilityState is "prerender" unless built visual; this document is a visible tab.
  Object.defineProperty(doc, 'visibilityState', { configurable: true, get: () => 'visible' });
  const ctl = mountOnboarding(doc.getElementById('r')!, deps);
  mounted.push(ctl);
  return { ctl, doc, win: dom.window as unknown as Window & typeof globalThis };
}
afterEach(() => {
  for (const c of mounted.splice(0)) c.destroy();
});

const part = (doc: Document, name: string): HTMLElement | null => doc.querySelector(`[data-part="${name}"]`);
const stepsOf = (doc: Document): HTMLElement | null => doc.querySelector(`.${C}__steps`);
/** What the user sees of the file-access section: the state line, and the steps' text if shown (hidden parts dropped). */
function seen(doc: Document): string {
  const steps = stepsOf(doc);
  let shownSteps = '(no steps)';
  if (steps && !steps.hidden) {
    const copy = steps.cloneNode(true) as HTMLElement;
    for (const h of copy.querySelectorAll('[hidden]')) h.remove();
    shownSteps = copy.textContent ?? '';
  }
  return [part(doc, 'access')?.textContent, shownSteps].join(' | ');
}

describe('the environment', () => {
  it('is Node (no global document) — the JSDOM window is this file\'s own', () => {
    expect(typeof (globalThis as { document?: unknown }).document).toBe('undefined');
  });
});

describe('detection (D-11)', () => {
  type Reader = (() => Promise<unknown>) | undefined;
  const throws: Reader = () => {
    throw new Error('no');
  };
  const CASES: Array<[string, FileAccessState, Reader]> = [
    ['true', 'on', async () => true],
    ['false', 'off', async () => false],
    ['a throw', 'unknown', throws],
    ['a rejection', 'unknown', () => Promise.reject(new Error('no'))],
    ['a non-boolean', 'unknown', async () => 'yes'],
    ['a missing reader', 'unknown', undefined],
  ];
  it.each(CASES)('%s → %s', async (_name, want, read) => {
    expect(await detectFileAccess(read)).toBe(want);
  });

  it('true / false / throw / missing render four distinct pages, each with its own copy', async () => {
    const cases: Array<[string, OnboardingDeps['readFileAccess']]> = [
      ['true', async () => true],
      ['false', async () => false],
      ['throw', () => { throw new Error('no'); }],
      ['missing', undefined],
    ];
    const pages: Record<string, string> = {};
    for (const [name, read] of cases) {
      const { doc } = mount({ engine: 'chromium', readFileAccess: read, readSiteAccess: async () => true });
      await flush();
      pages[name] = seen(doc);
    }
    expect(pages.true).toBe(`${ONBOARDING_COPY.on} | (no steps)`);
    expect(pages.false).toContain(ONBOARDING_COPY.off);
    expect(pages.false).toContain(ONBOARDING_COPY.step2Off);
    expect(pages.throw).toContain(ONBOARDING_COPY.unknown);
    expect(pages.throw).toContain(ONBOARDING_COPY.step2Unknown);
    // A throw and a missing API are the same state ("unknown — here is how to check"), as D-11 says.
    expect(pages.missing).toBe(pages.throw);
    expect(new Set([pages.true, pages.false, pages.throw]).size).toBe(3);
  });

  it('never blank: before the first answer, the Chromium page already shows the unknown card', () => {
    const { doc } = mount({ engine: 'chromium', readFileAccess: () => new Promise(() => undefined) });
    expect(part(doc, 'access')?.textContent).toBe(ONBOARDING_COPY.unknown);
    expect(doc.querySelector(`.${C}__title`)?.textContent).toBe(ONBOARDING_COPY.title);
  });
});

describe('the intro sentences (9.2, HUMAN COPY APPROVAL 2026-11-11: C-6 and C-6b)', () => {
  // Since 8.1f the Chromium guide can ask for site access as well as the file-URL toggle, so it no longer says "one".
  it('the Chromium intro says "a browser setting"; the Firefox intro still says "one Firefox setting"', () => {
    expect(ONBOARDING_COPY.introChromium).toBe(
      'Peekover shows markdown files as formatted pages. Raw files on the web need no setup. Files on your computer need a browser setting.',
    );
    expect(ONBOARDING_COPY.introFirefox).toBe(
      'Peekover shows markdown files as formatted pages. Raw files on the web need no setup. Files on your computer need one Firefox setting.',
    );
  });
});

describe('Firefox (D-11; since 2026-11-10 the local-file setting, Firefox 153+)', () => {
  it('asks, and renders on / off / unknown with Firefox\'s own setting and steps; no button', async () => {
    const cases: Array<[string, OnboardingDeps['readFileAccess']]> = [
      ['true', async () => true],
      ['false', async () => false],
      ['throw', () => { throw new Error('no'); }],
      ['missing', undefined],
    ];
    const pages: Record<string, string> = {};
    for (const [name, read] of cases) {
      const { doc } = mount({ engine: 'firefox', readFileAccess: read });
      await flush();
      pages[name] = seen(doc);
      expect(doc.querySelector(`.${C}__intro`)?.textContent).toBe(ONBOARDING_COPY.introFirefox);
      expect(doc.querySelector(`.${C}__cta`), 'no "Open Peekover\'s details" button on Firefox').toBeNull();
      expect(doc.body.textContent).toContain(ONBOARDING_COPY.web);
    }
    expect(pages.true).toBe(`${ONBOARDING_COPY.onFirefox} | (no steps)`);
    expect(pages.false).toContain(ONBOARDING_COPY.offFirefox);
    expect(pages.false).toContain(ONBOARDING_COPY.step1Firefox);
    expect(pages.false).toContain(ONBOARDING_COPY.step2Firefox);
    expect(pages.false).toContain(ONBOARDING_COPY.step3OffFirefox);
    expect(pages.false).toContain(ONBOARDING_COPY.step4Firefox);
    expect(pages.throw).toContain(ONBOARDING_COPY.unknown);
    expect(pages.throw).toContain(ONBOARDING_COPY.step3UnknownFirefox);
    expect(pages.missing).toBe(pages.throw);
    // Chromium's words never appear on the Firefox page.
    for (const p of Object.values(pages)) expect(p).not.toContain('Allow access to file URLs');
  });

  it('re-reads on focus, so turning the setting on in about:addons repaints the page', async () => {
    let value = false;
    const { doc, win } = mount({ engine: 'firefox', readFileAccess: async () => value });
    await flush();
    expect(part(doc, 'access')?.textContent).toBe(ONBOARDING_COPY.offFirefox);
    value = true;
    win.dispatchEvent(new win.Event('focus'));
    await flush();
    expect(part(doc, 'access')?.textContent).toBe(ONBOARDING_COPY.onFirefox);
  });
});

describe('re-check on focus and visibility (D-11)', () => {
  it('a toggled answer repaints on focus, and on visibilitychange to visible, without a reload', async () => {
    let value = false;
    const { doc, win } = mount({ engine: 'chromium', readFileAccess: async () => value, readSiteAccess: async () => true });
    await flush();
    expect(part(doc, 'access')?.textContent).toBe(ONBOARDING_COPY.off);
    value = true;
    win.dispatchEvent(new win.Event('focus'));
    await flush();
    expect(part(doc, 'access')?.textContent, 'focus re-reads').toBe(ONBOARDING_COPY.on);
    value = false;
    doc.dispatchEvent(new win.Event('visibilitychange'));
    await flush();
    expect(part(doc, 'access')?.textContent, 'visibilitychange re-reads').toBe(ONBOARDING_COPY.off);
  });

  it('destroy removes the listeners', async () => {
    let reads = 0;
    const { ctl, win } = mount({ engine: 'chromium', readFileAccess: async () => (reads += 1, true) });
    await flush();
    ctl.destroy();
    win.dispatchEvent(new win.Event('focus'));
    await flush();
    expect(reads).toBe(1);
  });
});

describe('the deep link (D-11)', () => {
  const click = async (doc: Document): Promise<void> => {
    doc.querySelector<HTMLButtonElement>(`.${C}__cta`)!.click();
    await flush();
    await flush();
  };
  it('a working opener: called once, no fallback', async () => {
    let opened = 0;
    const { doc } = mount({ engine: 'chromium', readFileAccess: async () => false, openDetails: async () => (opened += 1) });
    await click(doc);
    expect(opened).toBe(1);
    expect(part(doc, 'open-failed')!.hidden).toBe(true);
  });
  it.each([
    ['rejects', () => Promise.reject(new Error('blocked'))],
    ['throws', () => { throw new Error('blocked'); }],
    ['is missing', undefined],
  ] as const)('an opener that %s: the fallback, pointing at the address', async (_n, open) => {
    const { doc } = mount({ engine: 'chromium', readFileAccess: async () => false, openDetails: open as OnboardingDeps['openDetails'] });
    await click(doc);
    const failed = part(doc, 'open-failed')!;
    expect(failed.hidden).toBe(false);
    expect(failed.textContent).toBe(ONBOARDING_COPY.openFailed);
    expect(doc.querySelector(`.${C}__steps code`)?.textContent).toBe('chrome://extensions');
  });
});

// 8.1f (walk I-2): "Allow access to file URLs" was ON and the API said so, but Peekover's SITE ACCESS was off
// (Chrome 157, the kept walk profile: `permissions.contains({ origins: ['file:///*.md'] })` false), so the file
// tab stayed plain text while the guide said "can read files". "On" now needs both answers; the raw-hosts line
// follows its own site-access answer. Firefox: `file:///*` is always granted there (measured, 159), so only
// its web line asks.
// The approved step-2 site lines, as written (HUMAN COPY APPROVAL 2026-11-10, walk fix 8.1g).
const SITE_STEP = 'Under site access, turn on file:///* (in Chrome and Edge: “Automatically allow access on the following sites”).';
const SITE_STEP_IF_OFF = 'If site access for file:///* is off, turn it on too (in Chrome and Edge: “Automatically allow access on the following sites”).';

describe('8.1f — site access (Chromium file:// and the raw hosts on both engines)', () => {
  type Site = OnboardingDeps['readSiteAccess'];
  const sites = (files: unknown, web: unknown): Site => async (which) => (which === 'files' ? files : web);
  const web = (doc: Document): string | null | undefined => doc.querySelector(`.${C}__web`)?.textContent;

  it('Chromium: file URLs on, site access off → its own state, the site step, no file-URL step', async () => {
    const { doc } = mount({ engine: 'chromium', readFileAccess: async () => true, readSiteAccess: sites(false, true) });
    await flush();
    const page = doc.querySelector<HTMLElement>(`.${C}`)!;
    expect(page.dataset.access).toBe('blocked');
    expect(part(doc, 'access')?.textContent).toBe(ONBOARDING_COPY.siteOff);
    expect(part(doc, 'access')?.dataset.tone).toBe('warn');
    const s = seen(doc);
    expect(s).toContain(ONBOARDING_COPY.stepSite);
    // 8.1g (HUMAN COPY APPROVAL 2026-11-10; CC's Edge B10 finding): the label is Chrome's AND Edge's.
    expect(ONBOARDING_COPY.stepSite).toBe(SITE_STEP);
    expect(s).not.toContain(SITE_STEP_IF_OFF);
    expect(s).toContain(ONBOARDING_COPY.step1);
    expect(s).toContain(ONBOARDING_COPY.step3);
    expect(s).not.toContain(ONBOARDING_COPY.step2Off);
    expect(s).not.toContain(ONBOARDING_COPY.step2Unknown);
    expect([...doc.querySelectorAll(`.${C}__steps code`)].map((c) => c.textContent)).toContain(ONBOARDING_COPY.siteCode);
  });

  // 8.1g (CC's Edge B10 finding 1, Chrome too): with the file-URL toggle off the browser reports file sites as not
  // allowed even when site access is on, so the off state cannot tell — its site line is conditional.
  it('Chromium: file URLs off, site answer false → the off notice; step 2 the toggle step and the CONDITIONAL site line', async () => {
    const { doc } = mount({ engine: 'chromium', readFileAccess: async () => false, readSiteAccess: sites(false, true) });
    await flush();
    expect(part(doc, 'access')?.textContent).toBe(ONBOARDING_COPY.off);
    const s = seen(doc);
    expect(s).toContain(ONBOARDING_COPY.step2Off);
    expect(s).toContain(SITE_STEP_IF_OFF);
    expect(s).not.toContain(SITE_STEP);
    expect([...doc.querySelectorAll(`.${C}__steps code`)].map((c) => c.textContent)).toContain(ONBOARDING_COPY.siteCode);
  });

  it('Chromium: the file-URL answer unknown, site answer false → the conditional site line, not the direct one', async () => {
    const { doc } = mount({ engine: 'chromium', readFileAccess: async () => 'yes', readSiteAccess: sites(false, true) });
    await flush();
    expect(part(doc, 'access')?.textContent).toBe(ONBOARDING_COPY.unknown);
    const s = seen(doc);
    expect(s).toContain(SITE_STEP_IF_OFF);
    expect(s).not.toContain(SITE_STEP);
  });

  it('Chromium: file URLs off, site access on → the off page without the site step', async () => {
    const { doc } = mount({ engine: 'chromium', readFileAccess: async () => false, readSiteAccess: sites(true, true) });
    await flush();
    expect(seen(doc)).not.toContain(ONBOARDING_COPY.stepSite);
    expect(seen(doc)).not.toContain(SITE_STEP_IF_OFF);
  });

  it.each([
    ['missing', undefined],
    ['throws', () => { throw new Error('no'); }],
    ['rejects', () => Promise.reject(new Error('no'))],
    ['a non-boolean', async () => 'yes'],
  ] as Array<[string, Site]>)('Chromium: file URLs on but the site answer %s → never "on" (unknown)', async (_n, site) => {
    const { doc } = mount({ engine: 'chromium', readFileAccess: async () => true, readSiteAccess: site });
    await flush();
    expect(part(doc, 'access')?.textContent).toBe(ONBOARDING_COPY.unknown);
  });

  it('the raw-hosts line: granted → no setup; denied → the engine\'s own sentence; unknown → as before', async () => {
    const lines: Record<string, unknown> = {};
    for (const engine of ['chromium', 'firefox'] as const) {
      for (const [k, v] of [['granted', true], ['denied', false], ['unknown', undefined]] as const) {
        const { doc } = mount({ engine, readFileAccess: async () => true, readSiteAccess: v === undefined ? undefined : sites(true, v) });
        await flush();
        lines[`${engine} ${k}`] = web(doc);
      }
    }
    expect(lines).toEqual({
      'chromium granted': ONBOARDING_COPY.web,
      'chromium denied': ONBOARDING_COPY.webOff,
      'chromium unknown': ONBOARDING_COPY.web,
      'firefox granted': ONBOARDING_COPY.web,
      'firefox denied': ONBOARDING_COPY.webOffFirefox,
      'firefox unknown': ONBOARDING_COPY.web,
    });
  });

  it('Firefox asks only about the raw hosts: its file state follows the local-files setting alone', async () => {
    const asked: string[] = [];
    const { doc } = mount({ engine: 'firefox', readFileAccess: async () => true, readSiteAccess: async (w) => (asked.push(w), false) });
    await flush();
    expect(part(doc, 'access')?.textContent).toBe(ONBOARDING_COPY.onFirefox);
    expect(asked).toEqual(['web']);
  });

  it('a site-access change repaints on focus, both the notice and the web line', async () => {
    let granted = false;
    const { doc, win } = mount({ engine: 'chromium', readFileAccess: async () => true, readSiteAccess: async () => granted });
    await flush();
    expect(part(doc, 'access')?.textContent).toBe(ONBOARDING_COPY.siteOff);
    expect(web(doc)).toBe(ONBOARDING_COPY.webOff);
    granted = true;
    win.dispatchEvent(new win.Event('focus'));
    await flush();
    expect(part(doc, 'access')?.textContent).toBe(ONBOARDING_COPY.on);
    expect(web(doc)).toBe(ONBOARDING_COPY.web);
    expect(stepsOf(doc)!.hidden).toBe(true);
  });
});

const ROOT = process.cwd();
const read = (p: string): string => readFileSync(join(ROOT, p), 'utf8');

describe('constructed DOM only', () => {
  it('the module and its entry never write HTML', () => {
    for (const f of ['src/app/onboarding.ts', 'entrypoints/onboarding/main.ts']) {
      expect(read(f), f).not.toMatch(/innerHTML|outerHTML|insertAdjacentHTML|document\.write|DOMParser/);
    }
  });
  it('MUST FIRE: the same pattern finds a write in a sample', () => {
    expect('el.innerHTML = s').toMatch(/innerHTML|outerHTML|insertAdjacentHTML|document\.write|DOMParser/);
  });
});

describe('the bundle: both builds reference the file-access API; only Chromium the deep link (tasks.md 6.1)', () => {
  const API = 'isAllowedFileSchemeAccess';
  // esbuild is tsx's own dependency (pnpm keeps it out of the root); the same transform WXT's Vite uses.
  // Only the call this file makes, typed here: esbuild is not a direct dependency, so its types are not either.
  interface Esbuild {
    build(o: Record<string, unknown>): Promise<{ outputFiles: Array<{ text: string }> }>;
  }
  const esbuild = createRequire(createRequire(join(ROOT, 'package.json')).resolve('tsx'))('esbuild') as Esbuild;
  async function bundle(firefox: boolean): Promise<string> {
    const out = await esbuild.build({
      entryPoints: [join(ROOT, 'entrypoints/onboarding/main.ts')],
      bundle: true,
      write: false,
      minify: true,
      format: 'esm',
      platform: 'browser',
      loader: { '.woff2': 'empty' },
      define: {
        'import.meta.env.FIREFOX': String(firefox),
        'import.meta.env.CHROME': String(!firefox),
        'import.meta.env.DEV': 'false',
      },
      logLevel: 'silent',
    });
    return out.outputFiles.map((f) => f.text).join('\n');
  }
  it('FIRING CONTROL: the Chromium bundle references it', async () => {
    expect(await bundle(false)).toContain(API);
  }, 30_000);
  // 8.1f: both builds ask about site access through the permissions API (no permission needed), with the
  // patterns read from the manifest's own content-script matches.
  it('both bundles read site access (permissions.contains over the manifest\'s matches)', async () => {
    for (const fx of [false, true]) {
      const b = await bundle(fx);
      expect(b, `firefox=${fx}`).toMatch(/permissions\.contains\(/);
      expect(b, `firefox=${fx}`).toMatch(/getManifest\?\.\(\)/);
    }
  }, 30_000);
  // 2026-11-10 (HUMAN RULING, floor 153): the Firefox build now reads the setting too — the same call, no permission.
  it('the Firefox bundle references it too (Firefox 153+ reports the local-file setting)', async () => {
    const fx = await bundle(true);
    expect(fx, 'the bundle is the Firefox page (non-vacuous)').toContain(ONBOARDING_COPY.step2Firefox);
    expect(fx).toContain(API);
    // …and never the Chromium-only deep link.
    expect(fx).not.toContain('chrome://extensions/?id=');
  }, 30_000);
});

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
/** What the user sees of the file-access section: the state line, and the steps' text if shown. */
function seen(doc: Document): string {
  const steps = stepsOf(doc);
  return [part(doc, 'access')?.textContent, steps && !steps.hidden ? steps.textContent : '(no steps)'].join(' | ');
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
      const { doc } = mount({ engine: 'chromium', readFileAccess: read });
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
    const { doc, win } = mount({ engine: 'chromium', readFileAccess: async () => value });
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
  // 2026-11-10 (HUMAN RULING, floor 153): the Firefox build now reads the setting too — the same call, no permission.
  it('the Firefox bundle references it too (Firefox 153+ reports the local-file setting)', async () => {
    const fx = await bundle(true);
    expect(fx, 'the bundle is the Firefox page (non-vacuous)').toContain(ONBOARDING_COPY.step2Firefox);
    expect(fx).toContain(API);
    // …and never the Chromium-only deep link.
    expect(fx).not.toContain('chrome://extensions/?id=');
  }, 30_000);
});

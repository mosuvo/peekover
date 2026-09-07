// Block/fence math (M11 task 4.2-R) in a REAL ENGINE, Chromium AND Firefox — D-8-R's shared-shape
// claim, INPUT A's font-resolution proof (discharged for real, not the scratch harness 1.1-R
// used), and D-9-R's theme-inheritance lean, measured rather than assumed.
//
// Three properties below are structurally beyond jsdom (`src/render/mathEnhancer.test.ts`'s own
// header explains why a fake engine is used there instead):
//
//   • THE FONT ACTUALLY RESOLVES. `document.fonts.check()`/computed `font-family` are real-engine
//     questions — jsdom has no CSS Font Loading API worth the name.
//   • WHETHER A REAL BROWSER'S NATIVE MathML LAYOUT PAINTS TEXT VIA ORDINARY CSS `color`
//     inheritance (D-9-R's own lean) is a rendering-engine question, not a DOM-shape one.
//   • BLOCK vs FENCE ORIGIN PRODUCING THE SAME DOM SHAPE through the REAL parse -> enhance
//     pipeline (`src/render/mathEnhancer.test.ts` proves this with a fake engine; this file proves
//     it with the real one, over real Temml output).

import { describe, it, expect, afterEach } from 'vitest';
import { createReaderPane } from '../../src/app/readerPane';
import { mount } from '../../src/render/mount';
import { MATH_ERROR_CLASS, MATH_FIGURE_CLASS, MATH_STATE_ATTR } from '../../src/render/mathView';
import { MATH_FONT_FAMILY } from '../../src/theme/mathFont';
import { setThemeSetting, resetThemeWatchForTest } from '../../src/theme/reader';
import { resetThemeHostsForTest } from '../../src/theme/themeRegistry';

const FIGURE_SELECTOR = `figure.${MATH_FIGURE_CLASS}`;

const cleanup: HTMLElement[] = [];

afterEach(async () => {
  for (const el of cleanup.splice(0)) el.remove();
  resetThemeHostsForTest();
  resetThemeWatchForTest();
  setThemeSetting('auto');
});

/** The APP-PAGE surface, driven through the production pane — `createReaderPane` -> select() ->
 *  mount() -> `enhanceMath` (D-3-R's real call site), exactly as the app shell commits it. */
async function appPageReader(markdown: string): Promise<{ host: HTMLElement; shadow: ShadowRoot }> {
  const pane = createReaderPane(document);
  document.body.appendChild(pane.element);
  cleanup.push(pane.element);
  await pane.select({ name: 'doc.md', read: async () => markdown });
  const host = pane.element.querySelector<HTMLElement>('.peekover-app__reader__host');
  if (!host?.shadowRoot) throw new Error('reader pane produced no mounted host');
  return { host, shadow: host.shadowRoot };
}

/** The CONTENT-SCRIPT surface: `mount()` and nothing else — no `enhanceMath` call exists on this
 *  graph at all (D-3-R). */
function contentScriptReader(markdown: string): ShadowRoot {
  const host = document.createElement('peekover-root');
  document.body.appendChild(host);
  cleanup.push(host);
  mount(markdown, host);
  if (!host.shadowRoot) throw new Error('mount produced no shadow root');
  return host.shadowRoot;
}

/** Poll until every `[data-math]` marker under `shadow` has settled (never stays `pending`). */
async function settleMath(shadow: ShadowRoot, expectedCount: number): Promise<void> {
  for (let i = 0; i < 400; i += 1) {
    const marked = [...shadow.querySelectorAll(`[${MATH_STATE_ATTR}]`)];
    const settled = marked.filter((el) => el.getAttribute(MATH_STATE_ATTR) !== 'pending');
    if (marked.length >= expectedCount && settled.length >= expectedCount) return;
    await new Promise<void>((r) => setTimeout(r, 25));
  }
  throw new Error('math markers never settled');
}

describe('rows 2 + 3 — the two-surface comparison (D-3-R)', () => {
  it('the content-script reader leaves a math marker an ordinary inert code/pre', () => {
    const shadow = contentScriptReader('$$x^2$$\n');

    expect(shadow.querySelectorAll(FIGURE_SELECTOR)).toHaveLength(0);
    expect(shadow.querySelectorAll(`[${MATH_STATE_ATTR}]`)).toHaveLength(0);
    const pre = shadow.querySelector('pre');
    expect(pre?.querySelector('code')?.className).toBe('language-math');
    expect(getComputedStyle(pre!).display).not.toBe('none');
  });
});

describe('D-8-R — block ($$…$$) and fence (```math) origin render to the SAME DOM shape', () => {
  it('produces structurally identical figures for the same formula via both origins', async () => {
    const { shadow } = await appPageReader('$$x^2$$\n\n```math\nx^2\n```\n');
    await settleMath(shadow, 2);

    const figures = [...shadow.querySelectorAll<HTMLElement>(FIGURE_SELECTOR)];
    expect(figures).toHaveLength(2);
    for (const figure of figures) {
      expect(figure.getAttribute(MATH_STATE_ATTR)).toBe('rendered');
      expect(figure.querySelector('math')).not.toBeNull();
    }
    const [blockFigure, fenceFigure] = figures;
    expect(fenceFigure.className).toBe(blockFigure.className);
    expect(fenceFigure.querySelector('math')?.outerHTML).toBe(blockFigure.querySelector('math')?.outerHTML);
    expect(getComputedStyle(blockFigure).display).not.toBe('none');
    expect(getComputedStyle(fenceFigure).display).not.toBe('none');

    // The source pre is present-but-hidden for BOTH origins (D-15, reused verbatim).
    const pres = [...shadow.querySelectorAll<HTMLElement>(`pre[${MATH_STATE_ATTR}="rendered"]`)];
    expect(pres).toHaveLength(2);
    for (const pre of pres) {
      expect(getComputedStyle(pre).display).toBe('none');
      expect(pre.isConnected).toBe(true);
    }
  });

  it('§3.5 row 6 — the figure resolves against the reading column, in flow between paragraphs', async () => {
    const { shadow } = await appPageReader(
      'Paragraph before, long enough to occupy the column.\n\n$$x^2$$\n\nParagraph after, likewise real text.\n',
    );
    await settleMath(shadow, 1);

    const figure = shadow.querySelector<HTMLElement>(FIGURE_SELECTOR);
    const column = shadow.querySelector('.peekover-reader');
    if (!figure || !column) throw new Error('expected an enhanced formula');
    expect(column.contains(figure)).toBe(true);
    const fig = figure.getBoundingClientRect();
    expect(fig.width).toBeGreaterThan(0);
    expect(fig.width).toBeLessThanOrEqual(column.getBoundingClientRect().width + 1);
  });
});

describe('INPUT A — the bundled STIX Two Math subset actually applies (D-13)', () => {
  it('a rendered formula\'s computed font-family resolves to the registered family', async () => {
    const { shadow } = await appPageReader('$$x^2$$\n');
    await settleMath(shadow, 1);

    const mathEl = shadow.querySelector<HTMLElement>(`${FIGURE_SELECTOR} math`);
    if (!mathEl) throw new Error('expected a rendered <math> element');
    const family = getComputedStyle(mathEl).fontFamily;
    expect(family).toContain(MATH_FONT_FAMILY);

    // The real glyph-metric proof (1.1-R's own `canvas.measureText` mechanism, re-proven here over
    // the SHIPPED wiring — registerMathFont() + the real built asset — not the scratch harness).
    // `document.fonts.check()` is NOT used as the discriminator: per the CSS Font Loading API spec
    // it answers "is anything still loading", not "does this family exist" — it reads `true` for a
    // family NOTHING ever registered too (verified directly, both engines, while drafting this
    // test), which would make it a vacuous negative control. A glyph-advance DIFFERENTIAL is not:
    // if our font were silently NOT applied, both measurements below would fall back to the same
    // generic stack and read identically.
    await document.fonts.ready;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D canvas context unavailable');
    const glyph = '∑'; // ∑ — present in the subset (1.1-R's own 313-codepoint corpus)
    ctx.font = `200px "${MATH_FONT_FAMILY}", sans-serif`;
    const ourWidth = ctx.measureText(glyph).width;
    ctx.font = `200px "Peekover Math Nobody Registered This One", sans-serif`;
    const fallbackWidth = ctx.measureText(glyph).width;
    expect(ourWidth).toBeGreaterThan(0);
    expect(ourWidth).not.toBeCloseTo(fallbackWidth, 0);
  });
});

describe("D-9-R — theme inheritance, measured (not assumed)", () => {
  const DOC = '$$x^2$$\n';

  it('a rendered formula\'s computed ink colour TRACKS the theme, with no re-render', async () => {
    const { shadow } = await appPageReader(DOC);
    await settleMath(shadow, 1);

    const glyph = shadow.querySelector<HTMLElement>(`${FIGURE_SELECTOR} math mi, ${FIGURE_SELECTOR} math`);
    const host2 = shadow.host as HTMLElement;
    if (!glyph) throw new Error('expected a rendered glyph element');

    const colorAt = (): string => getComputedStyle(glyph).color;
    const inkAt = (): string => getComputedStyle(host2).getPropertyValue('--ink').trim();

    setThemeSetting('light');
    await new Promise<void>((r) => setTimeout(r, 0));
    const lightColor = colorAt();
    expect(lightColor).toBe(rgbOf(inkAt()));

    setThemeSetting('dark');
    await new Promise<void>((r) => setTimeout(r, 0));
    const darkColor = colorAt();
    expect(darkColor).toBe(rgbOf(inkAt()));

    setThemeSetting('sepia');
    await new Promise<void>((r) => setTimeout(r, 0));
    const sepiaColor = colorAt();
    expect(sepiaColor).toBe(rgbOf(inkAt()));

    // THE LEAN'S OWN CLAIM: no two of the three are the same colour (light/dark ink literally
    // invert; sepia is its own ink) — proving the glyph is genuinely tracking the theme rather
    // than being painted with one baked-in value that happens to satisfy an equality above.
    expect(new Set([lightColor, darkColor, sepiaColor]).size).toBe(3);

    // Same figure, same <math> node, never re-rendered (D-9-R's own "no re-render mechanism"
    // claim) — the state attribute never left `rendered` across any of the three flips.
    expect(shadow.querySelector(FIGURE_SELECTOR)?.getAttribute(MATH_STATE_ATTR)).toBe('rendered');
  });

  it('FIRING CONTROL: a hardcoded-colour ablation breaks the "tracks theme" property', async () => {
    const { shadow } = await appPageReader(DOC);
    await settleMath(shadow, 1);

    // A deliberate ablation: pin the glyph to a fixed colour, exactly the defect D-9-R's own lean
    // would produce if native MathML did NOT inherit `color` the way the lean assumes.
    const ablation = document.createElement('style');
    ablation.textContent = `${FIGURE_SELECTOR} math, ${FIGURE_SELECTOR} math *{color:#ff00ff!important}`;
    shadow.appendChild(ablation);

    const glyph = shadow.querySelector<HTMLElement>(`${FIGURE_SELECTOR} math`);
    if (!glyph) throw new Error('expected a rendered <math> element');

    setThemeSetting('light');
    await new Promise<void>((r) => setTimeout(r, 0));
    const lightColor = getComputedStyle(glyph).color;
    setThemeSetting('dark');
    await new Promise<void>((r) => setTimeout(r, 0));
    const darkColor = getComputedStyle(glyph).color;

    // Under the ablation the colour must NOT track the theme — proving the real (non-ablated)
    // test above is a genuine, non-vacuous instrument rather than one that would pass regardless.
    expect(lightColor).toBe(darkColor);
    expect(lightColor).toBe('rgb(255, 0, 255)');
  });

  it("Temml's own error path never reaches the DOM (throwOnError:true, mathEngine.ts's lockdown)", async () => {
    const { shadow } = await appPageReader('```math\n\\frac{a}{\n```\n'); // malformed, unterminated
    await settleMath(shadow, 1);

    const pre = shadow.querySelector(`pre[${MATH_STATE_ATTR}]`);
    expect(pre?.getAttribute(MATH_STATE_ATTR)).toBe('failed');
    // Temml's OWN error UI (a hardcoded `errorColor`-styled `<span class="temml-error">`) must be
    // unreachable — `throwOnError:true` re-throws instead of building it (4.1-R's own config
    // lockdown). Only OUR degrade marker exists.
    expect(shadow.querySelectorAll('.temml-error')).toHaveLength(0);
    expect(shadow.querySelectorAll(`.${MATH_ERROR_CLASS}`)).toHaveLength(1);
    expect(shadow.querySelector(`.${MATH_ERROR_CLASS}`)?.textContent).toContain('could not be rendered');
  });
});

/** Convert a `#rrggbb` (or already-`rgb(...)`) token read off a CSS custom property into the
 *  `rgb(r, g, b)` string `getComputedStyle(...).color` returns, so the two can be compared
 *  directly without a colour-parsing dependency. */
function rgbOf(token: string): string {
  const hex = token.replace('#', '');
  if (hex.length !== 6) return token; // already rgb(...)-shaped or unresolved; compare as-is
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return `rgb(${r}, ${g}, ${b})`;
}

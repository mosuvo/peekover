// @vitest-environment jsdom
//
// The synchronous prologue (D-8-R, mirroring 007's 3.1) and the state machine around the async
// body (D-6-R's render -> sanitize -> adopt), built over the REAL mount() output so 3.2-R's marker
// seam is exercised rather than hand-mocked. A FAKE engine stands in for Temml throughout — jsdom
// cannot lay out MathML any more than it can lay out an SVG, so a real `temml` here would prove
// nothing about a renderer whose whole point is real glyph metrics; the state machine around it is
// exactly what a fake can drive. Real-engine proof (DOM shape parity between block/fence origin,
// the font actually resolving, D-9-R's contrast lean) lives in
// tests/browser/mathBlock.browser.test.ts, Cr+Fx.

import { describe, it, expect, vi, afterEach } from 'vitest';
import { mount } from './mount';
import { enhanceMath, mathFencesIn, mathSourceOf } from './mathEnhancer';
import { MATH_BLOCK_SELECTOR } from './mathEngine';
import { MATH_ERROR_CLASS, MATH_FIGURE_CLASS, MATH_STATE_ATTR } from './mathView';
import type { MathEngine, MathEngineModule } from './mathEngine';

const HOST_TAG = 'peekover-root';
const FIGURE_SELECTOR = `figure.${MATH_FIGURE_CLASS}`;

/** Hosts are removed between tests: a stale host from a previous test would leave stray listeners
 *  and DOM around for the next one to trip over. Mirrors `diagramEnhancer.test.ts`'s own cleanup. */
const mounted: HTMLElement[] = [];
afterEach(() => {
  for (const host of mounted.splice(0)) host.remove();
});

/** A real mounted reader: parse -> sanitize -> shadow DOM, exactly as the app page commits it. */
function mountedHost(markdown: string): { host: HTMLElement; shadow: ShadowRoot } {
  const host = document.createElement(HOST_TAG);
  document.body.appendChild(host);
  mounted.push(host);
  mount(markdown, host, { contained: true });
  const shadow = host.shadowRoot;
  if (!shadow) throw new Error('mount() produced no shadow root');
  return { host, shadow };
}

async function settle(): Promise<void> {
  for (let i = 0; i < 20; i += 1) await new Promise<void>((r) => setTimeout(r, 0));
}

/** An engine module whose `renderToString` returns whatever `mathmlFor` says, per call. */
function fakeEngine(mathmlFor: (source: string) => string): {
  module: MathEngineModule;
  renderToString: ReturnType<typeof vi.fn>;
} {
  const renderToString = vi.fn((source: string) => mathmlFor(source));
  const engine: MathEngine = { renderToString } as unknown as MathEngine;
  return { module: { default: engine } as MathEngineModule, renderToString };
}

/** A minimal, real-shape MathML string `sanitizeMath` admits byte-identical. */
const MATHML = '<math><mi>x</mi></math>';

describe('the block/fence marker selector', () => {
  it('is the shape D-8-R fixed: pre > code.language-math', () => {
    expect(MATH_BLOCK_SELECTOR).toBe('pre > code.language-math');
  });

  it('matches BOTH $$-block and ```math fence origin, and neither an unrelated fence', () => {
    const { shadow } = mountedHost(
      '# Doc\n\n$$x^2$$\n\n```math\ny^2\n```\n\n```js\nconst a = 1;\n```\n',
    );
    const fences = mathFencesIn(shadow);
    expect(fences).toHaveLength(2);
    for (const pre of fences) expect(pre.querySelector('code')?.className).toBe('language-math');
    expect(shadow.querySelectorAll('code.language-js')).toHaveLength(1);
  });
});

describe('mathSourceOf — the $$-peel (D-8-R)', () => {
  it('peels $$…$$ for dollar-block origin only', () => {
    const { shadow } = mountedHost('$$x^2$$\n');
    const [pre] = mathFencesIn(shadow);
    // parse.ts's own marker wraps dollar-block content in literal $$…$$ (golden: tests/golden/
    // output/math.html pins the SAME trailing-\n-before-closing-$$ shape for a multi-line source)
    // — the enhancer must strip exactly the delimiters, not the formula's own trailing newline.
    expect(pre.querySelector('code')?.textContent).toBe('$$x^2\n$$');
    expect(mathSourceOf(pre)).toBe('x^2\n');
  });

  it('leaves fence-origin content UNPEELED — parse.ts never adds $$ there', () => {
    const { shadow } = mountedHost('```math\ny^2\n```\n');
    const [pre] = mathFencesIn(shadow);
    expect(pre.querySelector('code')?.textContent).toBe('y^2\n');
    expect(mathSourceOf(pre)).toBe('y^2\n');
  });

  it('CONTROL: a fence body that happens to be short is not peeled by accident', () => {
    // Content-shape peeling only fires on a 4+ char, $$-prefixed-and-suffixed string; a two-char
    // fence body ("$$") must not be mangled into an empty string by an off-by-one.
    const { shadow } = mountedHost('```math\n$$\n```\n');
    const [pre] = mathFencesIn(shadow);
    expect(mathSourceOf(pre)).toBe('$$\n');
  });
});

describe('the synchronous prologue', () => {
  it('leaves D-8-R structure in the DOM before any microtask can run', () => {
    const { host, shadow } = mountedHost('$$x^2$$\n');
    expect(shadow.querySelectorAll(FIGURE_SELECTOR)).toHaveLength(0);

    const returned: unknown = enhanceMath(host);

    expect(shadow.querySelectorAll(FIGURE_SELECTOR)).toHaveLength(1);
    expect(returned).toBeUndefined();
    expect(returned).not.toBeInstanceOf(Promise);
  });

  it('builds the figure as a SIBLING of the source pre, both marked pending', () => {
    const { host, shadow } = mountedHost('$$x^2$$\n');
    enhanceMath(host);

    const pre = shadow.querySelector('pre');
    const figure = shadow.querySelector(FIGURE_SELECTOR);
    if (!pre || !figure) throw new Error('expected a fence and a figure');

    expect(pre.nextElementSibling).toBe(figure);
    expect(figure.parentElement).toBe(pre.parentElement);
    expect(pre.getAttribute(MATH_STATE_ATTR)).toBe('pending');
    expect(figure.getAttribute(MATH_STATE_ATTR)).toBe('pending');
    expect(figure.getAttribute('aria-hidden')).toBe('true');
    expect(figure.childNodes).toHaveLength(0);
    expect(figure.closest('.peekover-reader')).not.toBeNull();
  });

  it('CONTROL: a math-free document grows no structure at all', () => {
    const { host, shadow } = mountedHost('# Doc\n\n```js\nconst a = 1;\n```\n');
    enhanceMath(host);
    expect(shadow.querySelectorAll(FIGURE_SELECTOR)).toHaveLength(0);
    expect(shadow.querySelectorAll(`[${MATH_STATE_ATTR}]`)).toHaveLength(0);
  });

  it('CONTROL: an unenhanced mount of the same markdown has no structure either', () => {
    const { shadow } = mountedHost('$$x^2$$\n');
    expect(shadow.querySelectorAll(FIGURE_SELECTOR)).toHaveLength(0);
    expect(shadow.querySelectorAll(`[${MATH_STATE_ATTR}]`)).toHaveLength(0);
  });

  it('no-ops on a host with no shadow root, and is idempotent over an enhanced tree', () => {
    expect(() => enhanceMath(document.createElement('div'))).not.toThrow();

    const { host, shadow } = mountedHost('$$x^2$$\n');
    enhanceMath(host);
    enhanceMath(host);
    enhanceMath(host);
    expect(shadow.querySelectorAll(FIGURE_SELECTOR)).toHaveLength(1);
  });

  it('enhances every block/fence marker in a multi-formula document', () => {
    const { host, shadow } = mountedHost('$$x^2$$\n\n```math\ny^2\n```\n\n```js\nconst a = 1;\n```\n');
    enhanceMath(host);
    expect(shadow.querySelectorAll(FIGURE_SELECTOR)).toHaveLength(2);
  });

  it('injects its OWN <style> (mathCss.ts), once, only when a marker exists', () => {
    const free = mountedHost('# Doc\n\nno math here\n');
    enhanceMath(free.host);
    const freeStyles = [...free.shadow.querySelectorAll('style')].map((s) => s.textContent ?? '');
    expect(freeStyles.some((t) => t.includes('.peekover-math{'))).toBe(false);

    const { host, shadow } = mountedHost('$$x^2$$\n');
    enhanceMath(host);
    enhanceMath(host); // a second call must not append a second sheet
    const styles = [...shadow.querySelectorAll('style')].map((s) => s.textContent ?? '');
    const mathStyles = styles.filter((t) => t.includes('.peekover-math{'));
    expect(mathStyles).toHaveLength(1);
    expect(mathStyles[0]).toContain("'Peekover Math'");
  });
});

describe('the math source is read as TEXT, never as markup', () => {
  it('a fence body shaped like markup is handed to the engine unparsed', async () => {
    const { host } = mountedHost('```math\n</math><script>window.__pwn=1</script>\n```\n');
    const { module, renderToString } = fakeEngine(() => MATHML);
    enhanceMath(host, { loader: async () => module });
    await settle();

    expect(renderToString.mock.calls[0]?.[0]).toBe('</math><script>window.__pwn=1</script>\n');
    expect((globalThis as { __pwn?: number }).__pwn).toBeUndefined();
  });
});

describe('the async body — the happy path', () => {
  it('adopts the sanitized MathML into the figure and flips both halves to rendered', async () => {
    const { host, shadow } = mountedHost('$$x^2$$\n');
    const { module, renderToString } = fakeEngine(() => MATHML);

    enhanceMath(host, { loader: async () => module });
    await settle();

    const pre = shadow.querySelector('pre');
    const figure = shadow.querySelector<HTMLElement>(FIGURE_SELECTOR);
    expect(pre?.getAttribute(MATH_STATE_ATTR)).toBe('rendered');
    expect(figure?.getAttribute(MATH_STATE_ATTR)).toBe('rendered');
    expect(figure?.querySelector('math')).not.toBeNull();
    expect(figure?.getAttribute('aria-hidden')).toBeNull();

    // The engine got the PEELED bare LaTeX, and always at displayMode:true (D-8-R is block/fence
    // only; inline's own displayMode:false half lands at 5.1-R).
    expect(renderToString).toHaveBeenCalledTimes(1);
    expect(renderToString.mock.calls[0][0]).toBe('x^2\n');
    expect(renderToString.mock.calls[0][1]).toMatchObject({ displayMode: true });

    // Source retained, per D-8-R/D-15 — no error marker on a success.
    expect(pre?.isConnected).toBe(true);
    expect(shadow.querySelectorAll(`.${MATH_ERROR_CLASS}`)).toHaveLength(0);
  });

  it('leaves the engine unloaded on a math-free document (§4s feature detect)', async () => {
    const { host } = mountedHost('# Doc\n\n```js\nconst a = 1;\n```\n');
    const loader = vi.fn(async () => fakeEngine(() => MATHML).module);

    enhanceMath(host, { loader });
    await settle();

    expect(loader).toHaveBeenCalledTimes(0);
  });

  it('block ($$…$$) and fence (```math) origin produce the SAME rendered DOM shape (D-8-R)', async () => {
    const { host, shadow } = mountedHost('$$x^2$$\n\n```math\nx^2\n```\n');
    enhanceMath(host, { loader: async () => fakeEngine(() => MATHML).module });
    await settle();

    const figures = [...shadow.querySelectorAll<HTMLElement>(FIGURE_SELECTOR)];
    expect(figures).toHaveLength(2);
    const [blockFigure, fenceFigure] = figures;
    // Same class, same state, same tag/child shape — the only difference the DOM can ever show is
    // upstream (which <pre> it sits beside), never the figure's own construction.
    expect(fenceFigure.className).toBe(blockFigure.className);
    expect(fenceFigure.getAttribute(MATH_STATE_ATTR)).toBe(blockFigure.getAttribute(MATH_STATE_ATTR));
    expect(fenceFigure.childNodes).toHaveLength(blockFigure.childNodes.length);
    expect(fenceFigure.firstElementChild?.tagName).toBe(blockFigure.firstElementChild?.tagName);
  });
});

describe('§3.9s three failures all land on the visible source fence', () => {
  const FAILING_DOC = '```math\nbad one\n```\n\n```math\ngood one\n```\n';

  async function successControl(): Promise<{ pre: HTMLElement; shadow: ShadowRoot }> {
    const { host, shadow } = mountedHost('$$x^2$$\n');
    enhanceMath(host, { loader: async () => fakeEngine(() => MATHML).module });
    await settle();
    const pre = shadow.querySelector('pre');
    if (!pre) throw new Error('expected the retained fence');
    expect(pre.getAttribute(MATH_STATE_ATTR)).toBe('rendered');
    return { pre, shadow };
  }

  it('CONTROL: the success path really does reach `rendered` in this harness', async () => {
    const { shadow } = await successControl();
    expect(shadow.querySelectorAll(`.${MATH_ERROR_CLASS}`)).toHaveLength(0);
  });

  it('engine load: every fence stays visible, each with a marker naming the load failure', async () => {
    const { host, shadow } = mountedHost(FAILING_DOC);
    enhanceMath(host, { loader: async () => { throw new Error('chunk unavailable'); } });
    await settle();

    const pres = [...shadow.querySelectorAll(`pre[${MATH_STATE_ATTR}]`)];
    expect(pres).toHaveLength(2);
    for (const pre of pres) expect(pre.getAttribute(MATH_STATE_ATTR)).toBe('failed');
    expect(shadow.querySelectorAll(FIGURE_SELECTOR)).toHaveLength(0); // nothing stranded
    const markers = [...shadow.querySelectorAll(`.${MATH_ERROR_CLASS}`)];
    expect(markers).toHaveLength(2);
    expect(markers[0].textContent).toContain('engine could not be loaded');
  });

  it('render: the bad formula degrades and the OTHER one renders normally (§4 isolation)', async () => {
    const { host, shadow } = mountedHost(FAILING_DOC);
    const module = fakeEngine((source) => {
      if (source.includes('bad')) throw new Error('Parse error');
      return MATHML;
    }).module;

    enhanceMath(host, { loader: async () => module });
    await settle();

    const [bad, good] = [...shadow.querySelectorAll(`pre[${MATH_STATE_ATTR}]`)];
    expect(bad.getAttribute(MATH_STATE_ATTR)).toBe('failed');
    expect(bad.nextElementSibling?.textContent).toContain('could not be rendered');
    expect(good.getAttribute(MATH_STATE_ATTR)).toBe('rendered');
    expect(shadow.querySelectorAll(FIGURE_SELECTOR)).toHaveLength(1);
    expect(shadow.querySelector(FIGURE_SELECTOR)?.querySelector('math')).not.toBeNull();
  });

  it('sanitize rejection: the LATEST-moment failure, after the engine already "succeeded"', async () => {
    // No <math> root survives sanitizeMath's real allow-list — a genuine rejection, not a stub.
    const module = fakeEngine((source) => (source.includes('bad') ? '<script>evil()</script>' : MATHML))
      .module;
    const { host, shadow } = mountedHost(FAILING_DOC);

    enhanceMath(host, { loader: async () => module });
    await settle();

    const [bad, good] = [...shadow.querySelectorAll(`pre[${MATH_STATE_ATTR}]`)];
    expect(bad.getAttribute(MATH_STATE_ATTR)).toBe('failed');
    expect(bad.nextElementSibling?.textContent).toContain('rejected by the sanitizer');
    expect(good.getAttribute(MATH_STATE_ATTR)).toBe('rendered');
  });
});

describe('idempotency over an already-rendered host', () => {
  it('a second enhanceMath call does not re-render an already-settled fence', async () => {
    const { host, shadow } = mountedHost('$$x^2$$\n');
    const { module, renderToString } = fakeEngine(() => MATHML);
    enhanceMath(host, { loader: async () => module });
    await settle();

    enhanceMath(host, { loader: async () => module });
    await settle();

    expect(renderToString).toHaveBeenCalledTimes(1);
    expect(shadow.querySelectorAll(FIGURE_SELECTOR)).toHaveLength(1);
  });
});

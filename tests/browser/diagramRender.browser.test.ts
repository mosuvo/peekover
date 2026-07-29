// D-15's structure in a REAL ENGINE, Chromium AND Firefox (007 task 3.1).
//
// Three of the four things asserted here are structurally beyond jsdom, which is why this file
// exists alongside `src/render/diagramEnhancer.test.ts` rather than duplicating it:
//
//   • WHETHER THE SOURCE IS ACTUALLY HIDDEN. D-15's whole claim is that one attribute plus one CSS
//     rule swaps the visible view. jsdom applies no stylesheet, so `data-diagram="rendered"` there
//     is a string on an element and nothing more. Only an engine computing style can say the user
//     stopped seeing the fence — and, just as importantly, that the node is STILL THERE while
//     invisible, which is the property every §3.8 failure path and the whole of group 7 depends on.
//
//   • WHERE THE FIGURE LANDS, GEOMETRICALLY. §3.5 row 5 asks whether the figure occludes the
//     column's text at a wide viewport. That is a layout question.
//
//   • §3.5 ROW 4 — AND IT INVERTS. Four sibling suites assert that a piece of reader chrome is
//     OUTSIDE `.peekover-reader` (the toggle pill, the TOC rail, the diff affordance, the net
//     indicator are all siblings of the reading column, committed by mount() beside it). The
//     diagram figure is the opposite case: it belongs to the DOCUMENT, not to the chrome, so it
//     must be INSIDE the column. Transcribing the sibling suites' direction unexamined produces a
//     test that passes on a wrong implementation. Verified red by inserting the figure outside the
//     column instead — at which point the golden diff stays EMPTY, because none of this touches the
//     committed `sanitize(parse(source))` string. That is precisely why the assertion is written.
//
// The 3.1 blocks load no engine: the scaffolding's `rendered` state is reached by calling
// `markDiagramRendered` with a stand-in node, because what is under test there is the STRUCTURE and
// its CSS contract, not mermaid.
//
// ── TASK 3.2's BLOCKS RUN THE REAL ENGINE, AND THAT IS THE POINT ──────────────────────────────
//
// Everything below "the async body" drives actual mermaid — in the first case through the actual
// production `import('mermaid')`, with nothing injected. Four properties are reachable no other
// way, all of them invisible to the jsdom mirror in `src/render/diagramEnhancer.test.ts`:
//
//   • THE ADOPTED ARTIFACT IS REAL ENGINE OUTPUT. A fake's SVG string proves the state machine and
//     nothing about what mermaid actually emits. This is the FIRST time the option-B `<style>`
//     pass (`sanitize.ts`'s `cleanSvgCss`, decisions.md `0de27f3`) meets a true render: until now
//     it was exercised on payloads we wrote. The stylesheet must come through INERT — no external
//     reference — and STILL STYLING: mermaid emits `@keyframes` unconditionally
//     (`chunks/mermaid.core/chunk-WYO6CB5R.mjs:5283-5289`), so their absence would mean the pass
//     had over-stripped and option-B had bought nothing.
//   • THE MEASURING CONTAINER'S LIFETIME (D-6 step 1) under a real render, which is the only render
//     that actually appends the engine's own temp elements into it.
//   • WHETHER THE SOURCE IS ACTUALLY HIDDEN after a real success — computed style, not an
//     attribute string.
//   • `foreignObject`: `htmlLabels:false` plus the profile's denial-by-absence, over output that
//     genuinely could have carried one.
//
// The zero-network guard on D-6's measurement WINDOW is deliberately NOT here — it is task 3.3's
// own file, because it gates the mechanism rather than reporting on it, and it needs the control
// that fires. The cooldown and the import fence are 3.4's.

import { describe, it, expect, afterEach, vi, type Mock } from 'vitest';
import mermaid from 'mermaid';
import { createReaderPane } from '../../src/app/readerPane';
import { mount } from '../../src/render/mount';
import { DIAGRAM_MEASURE_CLASS, enhanceDiagrams } from '../../src/render/diagramEnhancer';
import type {
  DiagramEngine,
  DiagramEngineModule,
  EngineLoader,
} from '../../src/render/diagramEngine';
import {
  DIAGRAM_ERROR_CLASS,
  DIAGRAM_FIGURE_CLASS,
  DIAGRAM_STATE_ATTR,
  markDiagramRendered,
} from '../../src/render/diagramView';

const FIGURE_SELECTOR = `figure.${DIAGRAM_FIGURE_CLASS}`;

const DOC =
  '# Diagram document\n\n' +
  'Paragraph before the diagram, long enough to occupy the column and give row 5 a real box ' +
  'of text to be occluded by if the figure were positioned rather than in flow.\n\n' +
  '```mermaid\ngraph TD; A-->B;\n```\n\n' +
  'Paragraph after the diagram, likewise real text in the reading column.\n';

const cleanup: HTMLElement[] = [];
afterEach(async () => {
  for (const el of cleanup.splice(0)) el.remove();
  // DRAIN. The 3.1 blocks mount real documents through the production pane, which now really does
  // load the engine, so a render can still be in flight when a test ends. Its measuring container
  // lives in `document.body` (D-6 step 1, light DOM by necessity) — a stray one would read as the
  // NEXT test's container. Removing the host does not cancel the render; waiting for it does.
  for (let i = 0; i < 400 && document.querySelector(`.${DIAGRAM_MEASURE_CLASS}`); i += 1) {
    await new Promise<void>((r) => setTimeout(r, 25));
  }
});

/** The APP-PAGE surface, driven through the production pane — `createReaderPane` -> select() ->
 *  mount() -> D-12's first call site. Nothing here calls the enhancer directly. */
async function appPageReader(markdown = DOC): Promise<ShadowRoot> {
  const pane = createReaderPane(document);
  document.body.appendChild(pane.element);
  cleanup.push(pane.element);
  await pane.select({ name: 'doc.md', read: async () => markdown });
  const host = pane.element.querySelector<HTMLElement>('.peekover-app__reader__host');
  if (!host?.shadowRoot) throw new Error('reader pane produced no mounted host');
  return host.shadowRoot;
}

/** The CONTENT-SCRIPT surface: `mount()` and nothing else, which is exactly what `mountReader`
 *  does (`mountReader.ts:88`) — no `contained`, no enhancer, no post-mount pass of any kind. */
function contentScriptReader(markdown = DOC): ShadowRoot {
  const host = document.createElement('peekover-root');
  document.body.appendChild(host);
  cleanup.push(host);
  mount(markdown, host);
  if (!host.shadowRoot) throw new Error('mount produced no shadow root');
  return host.shadowRoot;
}

describe('the app page grows D-15 structure (row 4 — INVERTED)', () => {
  it('puts the figure INSIDE .peekover-reader, as a sibling of the source pre', async () => {
    const shadow = await appPageReader();

    const column = shadow.querySelector('.peekover-reader');
    const figure = shadow.querySelector(FIGURE_SELECTOR);
    const pre = shadow.querySelector('pre[data-diagram]');
    if (!column || !figure || !pre) throw new Error('expected an enhanced fence');

    // THE INVERTED ASSERTION. Not a sibling of the column like every other piece of reader
    // furniture — a child of it.
    expect(column.contains(figure)).toBe(true);
    expect(figure.parentElement).not.toBe(shadow);
    expect(pre.nextElementSibling).toBe(figure);
    expect(figure.parentElement).toBe(pre.parentElement);
  });

  it('hides the pending placeholder from assistive technology (row 18)', async () => {
    const shadow = await appPageReader();
    const figure = shadow.querySelector(FIGURE_SELECTOR);
    expect(figure?.getAttribute('aria-hidden')).toBe('true');
    expect(figure?.getAttribute(DIAGRAM_STATE_ATTR)).toBe('pending');
  });

  it('leaves the source fence VISIBLE while pending — the degraded state is the default', async () => {
    const shadow = await appPageReader();
    const pre = shadow.querySelector<HTMLElement>('pre[data-diagram]');
    if (!pre) throw new Error('expected the retained source fence');

    expect(getComputedStyle(pre).display).not.toBe('none');
    expect(pre.getBoundingClientRect().height).toBeGreaterThan(0);
    expect(pre.textContent).toContain('graph TD; A-->B;');
  });
});

describe('after success the source pre is PRESENT-BUT-HIDDEN (both halves)', () => {
  it('computes display:none on the pre while the node stays in the tree with its source', async () => {
    const shadow = await appPageReader();
    const pre = shadow.querySelector<HTMLElement>('pre[data-diagram]');
    const figure = shadow.querySelector<HTMLElement>(FIGURE_SELECTOR);
    if (!pre || !figure) throw new Error('expected the enhanced pair');

    // Control: it is visible BEFORE the flip, so `none` afterwards is caused by the flip and not
    // by the fence having been invisible all along.
    expect(getComputedStyle(pre).display).not.toBe('none');

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '120');
    svg.setAttribute('height', '80');
    markDiagramRendered(pre, figure, svg);

    // HALF ONE — hidden. The CSS rule, in a real engine, over a real shadow root.
    expect(getComputedStyle(pre).display).toBe('none');
    expect(pre.getBoundingClientRect().height).toBe(0);

    // HALF TWO — present. Still connected, still holding its source text, still queryable. This is
    // what every §3.8 failure path and group 7's copy/download/lightbox re-derive from.
    expect(pre.isConnected).toBe(true);
    expect(shadow.contains(pre)).toBe(true);
    expect(pre.textContent).toContain('graph TD; A-->B;');

    // And the figure took its place, visibly and audibly.
    expect(getComputedStyle(figure).display).not.toBe('none');
    expect(figure.hasAttribute('aria-hidden')).toBe(false);
    expect(figure.getBoundingClientRect().height).toBeGreaterThan(0);
  });
});

describe('row 5 — the figure does not occlude the column text at a WIDE viewport', () => {
  it('sits in flow between the paragraphs, overlapping neither', async () => {
    const shadow = await appPageReader();
    const pre = shadow.querySelector<HTMLElement>('pre[data-diagram]');
    const figure = shadow.querySelector<HTMLElement>(FIGURE_SELECTOR);
    if (!pre || !figure) throw new Error('expected the enhanced pair');

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '200');
    svg.setAttribute('height', '120');
    markDiagramRendered(pre, figure, svg);

    const paragraphs = [...shadow.querySelectorAll<HTMLElement>('.peekover-reader p')];
    expect(paragraphs.length).toBeGreaterThanOrEqual(2);

    const fig = figure.getBoundingClientRect();
    expect(fig.height).toBeGreaterThan(0);
    expect(fig.width).toBeGreaterThan(0);

    for (const p of paragraphs) {
      const r = p.getBoundingClientRect();
      expect(r.height).toBeGreaterThan(0); // the control: real text with a real box
      const overlaps = fig.left < r.right && r.left < fig.right && fig.top < r.bottom && r.top < fig.bottom;
      expect(overlaps).toBe(false);
    }

    // In flow means ordered: the figure is below the paragraph that precedes it in the source.
    expect(fig.top).toBeGreaterThanOrEqual(paragraphs[0].getBoundingClientRect().bottom - 1);
  });
});

describe('rows 2 + 3 — the two-surface comparison', () => {
  // THE GATE IS THE MODULE GRAPH, NOT A RUNTIME CHECK. The content script reaches `mount()` and
  // stops; the enhancer is invoked only from D-12's two app-page sites. Red-first procedure for
  // this pair: move `enhanceDiagrams` INTO `mount()` — the one function both surfaces share — and
  // exactly the content-script assertion below goes red while the app-page one stays green. That is
  // the accident being guarded against, and it is the only edit that produces it.

  it('the content-script reader leaves a mermaid fence an ordinary code fence', () => {
    const shadow = contentScriptReader();

    expect(shadow.querySelectorAll(FIGURE_SELECTOR)).toHaveLength(0);
    expect(shadow.querySelectorAll(`[${DIAGRAM_STATE_ATTR}]`)).toHaveLength(0);

    // No affordance and no note anywhere on this surface.
    expect(shadow.querySelector('.peekover-diagram')).toBeNull();

    // CONTROL: the fence is genuinely there and genuinely a mermaid one — so the zeros above are a
    // gate holding, not an input that never arrived.
    const code = shadow.querySelector('pre > code.language-mermaid');
    expect(code).not.toBeNull();
    expect(code?.textContent).toContain('graph TD; A-->B;');
    expect(getComputedStyle(code!.parentElement!).display).not.toBe('none');
  });

  it('the app page grows one from the SAME markdown — the surfaces differ, the input does not', async () => {
    const contentShadow = contentScriptReader();
    const appShadow = await appPageReader();

    expect(contentShadow.querySelectorAll(FIGURE_SELECTOR)).toHaveLength(0);
    expect(appShadow.querySelectorAll(FIGURE_SELECTOR)).toHaveLength(1);

    // Same fence text on both surfaces: the only difference is who called the enhancer.
    const contentSrc = contentShadow.querySelector('pre > code.language-mermaid')?.textContent;
    const appSrc = appShadow.querySelector('pre > code.language-mermaid')?.textContent;
    expect(contentSrc).toBe(appSrc);
  });
});

describe('D-12 parity — both call sites produce the same structure', () => {
  // Site 1 is `readerPane.ts`, driven above through the production pane. Site 2 is the `render`
  // closure `appShell.ts` hands `createWatchController`, whose body is `mount(...)` followed by
  // `enhanceDiagrams(target)`. Reproduced here against the same markdown to prove the two paths
  // converge on one structure rather than two divergent copies. The PRODUCTION watch path — a real
  // re-render through `installWatchForFile` — is task 3.4's, which owns the re-enhancement claim.
  it('the watch render closure yields the structure readerPane yields', async () => {
    const fromPane = await appPageReader();

    const host = document.createElement('div');
    document.body.appendChild(host);
    cleanup.push(host);
    mount(DOC, host, { contained: true, preserveReading: true });
    enhanceDiagrams(host);
    const fromWatch = host.shadowRoot;
    if (!fromWatch) throw new Error('expected a mounted host');

    for (const shadow of [fromPane, fromWatch]) {
      const figure = shadow.querySelector(FIGURE_SELECTOR);
      const pre = shadow.querySelector('pre[data-diagram]');
      expect(figure).not.toBeNull();
      expect(pre).not.toBeNull();
      expect(pre!.nextElementSibling).toBe(figure);
      expect(figure!.getAttribute(DIAGRAM_STATE_ATTR)).toBe('pending');
      expect(figure!.getAttribute('aria-hidden')).toBe('true');
      expect(shadow.querySelector('.peekover-reader')!.contains(figure!)).toBe(true);
    }
  });
});

// ══ TASK 3.2 — THE ASYNC BODY, OVER THE REAL ENGINE ═══════════════════════════════════════════

/** A fence that renders, a fence that cannot, and prose either side of them. */
const GOOD_FENCE = '```mermaid\ngraph TD\n  A[Alpha] --> B[Beta]\n```\n';
const BAD_FENCE = '```mermaid\nthis is not a diagram of any known type\n```\n';
const MIXED_DOC = `# Two diagrams\n\nBefore.\n\n${BAD_FENCE}\nBetween.\n\n${GOOD_FENCE}\nAfter.\n`;

/**
 * Wait until no fence is `pending` any more — success and failure both leave that state, so a
 * document that never settles is a document whose enhancement DIED rather than degraded.
 *
 * The message names the count, in the defect's own units: §3.2's revert-and-fail (remove the
 * per-fence catch, give the document one bad fence) is read here, and "2 figures + 2 fences left
 * pending" is the sentence that distinguishes "one diagram failed" from "the pass fell over".
 */
async function settleDiagrams(shadow: ShadowRoot, tries = 600): Promise<void> {
  const pending = (): Element[] => [
    ...shadow.querySelectorAll(`[${DIAGRAM_STATE_ATTR}="pending"]`),
  ];
  for (let i = 0; i < tries; i += 1) {
    if (pending().length === 0) return;
    await new Promise<void>((r) => setTimeout(r, 25));
  }
  const stuck = pending();
  const figures = stuck.filter((el) => el.tagName === 'FIGURE').length;
  throw new Error(
    `enhancement never completed: ${figures} unrendered figure(s) and ` +
      `${stuck.length - figures} fence(s) left pending, of ` +
      `${shadow.querySelectorAll(`pre[${DIAGRAM_STATE_ATTR}]`).length} enhanced fences`,
  );
}

/**
 * The real engine, wrapped so the test can watch what crosses the seam without patching the
 * mermaid singleton (other files in this suite import the same instance).
 *
 * `svg` transforms the string the engine returned, which is how the sanitize-rejection arm gets a
 * genuine "the engine succeeded and the artifact did not survive" case: everything up to and
 * including `render()` is real.
 */
function instrumented(options: { svg?: (svg: string) => string } = {}): {
  loader: EngineLoader;
  raw: string[];
  containersDuringRender: (Element | null)[];
  bindSpy: Mock<(element: Element) => void>;
} {
  const raw: string[] = [];
  const containersDuringRender: (Element | null)[] = [];
  // Typed by its parameter so the CONTROL below can call it the way the engine's own binder would.
  const bindSpy: Mock<(element: Element) => void> = vi.fn();

  const engine: DiagramEngine = {
    initialize: (config) => mermaid.initialize(config as never),
    render: async (id, definition, container) => {
      // Observed DURING the call, from the document rather than from the argument: "the container
      // exists" must be a fact about the page, not about what we were handed.
      containersDuringRender.push(document.querySelector(`.${DIAGRAM_MEASURE_CLASS}`));
      expect(container).toBe(containersDuringRender[containersDuringRender.length - 1]);
      const result = await mermaid.render(id, definition, container);
      raw.push(result.svg);
      // The spy replaces whatever the engine returned: "never called" is then a claim about our
      // code, not about whether this diagram type happens to expose a binder.
      return { svg: options.svg ? options.svg(result.svg) : result.svg, bindFunctions: bindSpy };
    },
  };

  return {
    loader: async () => ({ default: engine }) as unknown as DiagramEngineModule,
    raw,
    containersDuringRender,
    bindSpy,
  };
}

/** mount + enhance by hand — the shape of D-12's second call site, and the only seam an injected
 *  loader can enter through. The first tests below deliberately use neither. */
function enhancedHost(markdown: string, loader?: EngineLoader): ShadowRoot {
  const host = document.createElement('div');
  document.body.appendChild(host);
  cleanup.push(host);
  mount(markdown, host, { contained: true, preserveReading: true });
  enhanceDiagrams(host, loader ? { loader } : {});
  if (!host.shadowRoot) throw new Error('expected a mounted host');
  return host.shadowRoot;
}

describe('the async body — a real diagram, through the production path', () => {
  it('renders, sanitizes, adopts, and flips to `rendered` with the source hidden-but-retained', async () => {
    // NOTHING IS INJECTED HERE. `createReaderPane` -> select() -> mount() -> enhanceDiagrams(),
    // and the engine arrives through the production `import('mermaid')` in diagramEngine.ts.
    const shadow = await appPageReader(`Before.\n\n${GOOD_FENCE}\nAfter.\n`);
    await settleDiagrams(shadow);

    const pre = shadow.querySelector<HTMLElement>('pre[data-diagram]');
    const figure = shadow.querySelector<HTMLElement>(FIGURE_SELECTOR);
    if (!pre || !figure) throw new Error('expected the enhanced pair');

    expect(figure.getAttribute(DIAGRAM_STATE_ATTR)).toBe('rendered');
    expect(pre.getAttribute(DIAGRAM_STATE_ATTR)).toBe('rendered');

    // The adopted artifact: a real <svg>, laid out, with real geometry.
    const svg = figure.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg!.getBoundingClientRect().width).toBeGreaterThan(0);
    expect(svg!.getBoundingClientRect().height).toBeGreaterThan(0);
    // It came from the ENGINE and not from a passthrough of the fence: the node labels are in it.
    expect(figure.textContent).toContain('Alpha');
    expect(figure.textContent).toContain('Beta');

    // htmlLabels:false plus denial-by-absence — over output that genuinely could have carried one.
    expect(figure.querySelectorAll('foreignObject')).toHaveLength(0);
    expect(figure.querySelectorAll('foreignobject')).toHaveLength(0);

    // D-15, both halves, in computed style: hidden, and still there holding its source.
    expect(getComputedStyle(pre).display).toBe('none');
    expect(pre.isConnected).toBe(true);
    expect(pre.textContent).toContain('graph TD');
    expect(getComputedStyle(figure).display).not.toBe('none');
    expect(shadow.querySelectorAll(`.${DIAGRAM_ERROR_CLASS}`)).toHaveLength(0);
  }, 30_000);

  it('★ the adopted <style> is INERT and still STYLING — option B on true engine output', async () => {
    // THE FIRST REAL-ENGINE PROOF of the D-1/D-6 option-B pass (decisions.md `0de27f3`). Until now
    // `cleanSvgCss` had only met payloads we wrote for it.
    const shadow = await appPageReader(GOOD_FENCE);
    await settleDiagrams(shadow);

    const style = shadow.querySelector<HTMLStyleElement>(`${FIGURE_SELECTOR} style`);
    expect(style, 'the engine emits a <style>; option B admits it').not.toBeNull();
    const css = style!.textContent ?? '';
    expect(css.length).toBeGreaterThan(0);

    // STILL STYLING — the over-strip vacuity trap. Mermaid emits these two unconditionally from
    // `getStyles` (chunk-WYO6CB5R.mjs:5283-5289), so their survival is what distinguishes "the
    // external reference went" from "the stylesheet went".
    expect(css).toContain('@keyframes');
    expect(css).toContain('edge-animation-frame');
    expect(css).toContain('dash');

    // INERT — no route out. `url(` survives only as a `#`-fragment; no at-rule but @keyframes.
    for (const match of css.matchAll(/url\(\s*['"]?([^'")]*)/gi)) {
      expect(match[1].startsWith('#'), `external url() survived: ${match[1]}`).toBe(true);
    }
    expect(css).not.toMatch(/@import/i);
    expect(css).not.toMatch(/@font-face/i);
    expect(css).not.toMatch(/https?:/i);

    // And the rule is really in force: the stylesheet the browser parsed has rules in it.
    expect(style!.sheet?.cssRules.length ?? 0).toBeGreaterThan(0);
  }, 30_000);

  it('adopts through a <template>, never innerHTML on a live element', async () => {
    // The adopt-side mirror of 3.1's textContent proof. The engine really rendered; the string it
    // returned then carries markup that WOULD materialise if it were assigned to a live element
    // without sanitization. Neither survives — and the diagram still arrives.
    const payload = '<script>window.__peekoverAdoptLeak = true;</script><img src="x" alt="">';
    const { loader } = instrumented({ svg: (svg) => svg.replace('</svg>', `${payload}</svg>`) });
    const shadow = enhancedHost(GOOD_FENCE, loader);
    await settleDiagrams(shadow);

    const figure = shadow.querySelector<HTMLElement>(FIGURE_SELECTOR);
    expect(figure?.getAttribute(DIAGRAM_STATE_ATTR)).toBe('rendered');
    expect(figure!.querySelector('svg')).not.toBeNull();
    expect(figure!.querySelector('script')).toBeNull();
    expect(figure!.querySelector('img')).toBeNull();
    expect((window as unknown as Record<string, unknown>).__peekoverAdoptLeak).toBeUndefined();

    // CONTROL: the same payload assigned into an inert <template> DOES materialise both — so the
    // nulls above are the sanitizer holding, not a payload that could never have appeared.
    const tpl = document.createElement('template');
    tpl.innerHTML = payload;
    expect(tpl.content.querySelector('script')).not.toBeNull();
    expect(tpl.content.querySelector('img')).not.toBeNull();
  }, 30_000);
});

describe('D-6 step 1 — the measuring container is ours, and its lifetime is ours', () => {
  it('existed while the engine was rendering and is gone afterwards', async () => {
    const { loader, containersDuringRender } = instrumented();
    const shadow = enhancedHost(GOOD_FENCE, loader);
    await settleDiagrams(shadow);

    // An empty tail is not an empty instrument: the container is asserted PRESENT mid-render...
    expect(containersDuringRender).toHaveLength(1);
    expect(containersDuringRender[0]).not.toBeNull();
    expect(containersDuringRender[0]!.isConnected).toBe(false);
    // ...and absent afterwards, by the same document query that found it.
    expect(document.querySelector(`.${DIAGRAM_MEASURE_CLASS}`)).toBeNull();

    // The engine's own temp elements went with it — nothing orphaned in the live document.
    expect(document.querySelector('[id^="dpeekover-diagram-"]')).toBeNull();
  }, 30_000);

  it('is removed even when the render fails, and no engine error graphic is left behind', async () => {
    const shadow = enhancedHost(BAD_FENCE, instrumented().loader);
    await settleDiagrams(shadow);

    expect(document.querySelector(`.${DIAGRAM_MEASURE_CLASS}`)).toBeNull();
    // §3.8: mermaid's own error graphic is suppressed (`suppressErrorRendering`), so the bomb is
    // neither adopted nor orphaned in the page.
    expect(document.body.textContent).not.toContain('Syntax error in text');
    expect(shadow.textContent).not.toContain('Syntax error in text');
  }, 30_000);

  it('D-6 step 5 — bindFunctions is NEVER called, and the spy proves it would have recorded one', async () => {
    const { loader, bindSpy } = instrumented();
    const shadow = enhancedHost(GOOD_FENCE, loader);
    await settleDiagrams(shadow);

    expect(shadow.querySelector(FIGURE_SELECTOR)?.getAttribute(DIAGRAM_STATE_ATTR)).toBe('rendered');
    expect(bindSpy).toHaveBeenCalledTimes(0);

    // THE CONTROL. Without it, zero calls is equally consistent with a spy that was never wired to
    // the result the enhancer received.
    bindSpy(document.createElement('div'));
    expect(bindSpy).toHaveBeenCalledTimes(1);
  }, 30_000);
});

describe('§3.8 — the failure paths degrade to the VISIBLE source fence', () => {
  /** Every arm below needs this: on the SAME harness, a success HIDES the source. */
  async function successControl(loader?: EngineLoader): Promise<void> {
    const shadow = enhancedHost(GOOD_FENCE, loader);
    await settleDiagrams(shadow);
    const pre = shadow.querySelector<HTMLElement>('pre[data-diagram]');
    expect(pre?.getAttribute(DIAGRAM_STATE_ATTR)).toBe('rendered');
    expect(getComputedStyle(pre!).display).toBe('none');
    expect(shadow.querySelectorAll(`.${DIAGRAM_ERROR_CLASS}`)).toHaveLength(0);
  }

  it('parse/render failure: that fence stays source, the OTHER diagram renders normally', async () => {
    const shadow = enhancedHost(MIXED_DOC, instrumented().loader);
    await settleDiagrams(shadow);

    const [bad, good] = [...shadow.querySelectorAll<HTMLElement>('pre[data-diagram]')];
    expect(bad.getAttribute(DIAGRAM_STATE_ATTR)).toBe('failed');
    expect(getComputedStyle(bad).display).not.toBe('none');
    expect(bad.getBoundingClientRect().height).toBeGreaterThan(0);
    expect(bad.textContent).toContain('this is not a diagram');

    // §4's "every other diagram in the document renders normally" — one fence's failure did not
    // reach the next one.
    expect(good.getAttribute(DIAGRAM_STATE_ATTR)).toBe('rendered');
    expect(getComputedStyle(good).display).toBe('none');
    expect(shadow.querySelectorAll(FIGURE_SELECTOR)).toHaveLength(1);
    expect(shadow.querySelector(FIGURE_SELECTOR)!.querySelector('svg')).not.toBeNull();

    // The marker took the failed figure's place and NAMES the failure (§4).
    const marker = shadow.querySelector(`.${DIAGRAM_ERROR_CLASS}`);
    expect(marker).not.toBeNull();
    expect(marker!.textContent).toContain('could not be drawn');
    expect(bad.nextElementSibling).toBe(marker);
    // Never an empty box: the placeholder went rather than sitting there with nothing in it.
    expect(shadow.querySelectorAll(`${FIGURE_SELECTOR}:empty`)).toHaveLength(0);

    await successControl();
  }, 30_000);

  it('sanitize rejection: the LATEST-moment failure, after the engine already succeeded', async () => {
    // The engine ran for real; the artifact it produced is then unrecognisable to the profile —
    // its root is no longer an <svg>, so nothing survives and there is nothing to adopt. This is
    // the path D-15 is shaped for: the source <pre> is still there because it never left.
    const { loader, raw } = instrumented({
      svg: (svg) => svg.replace('<svg', '<foreignObject').replace(/<\/svg>$/, '</foreignObject>'),
    });
    const shadow = enhancedHost(GOOD_FENCE, loader);
    await settleDiagrams(shadow);

    // The engine SUCCEEDED — that is what makes this the sanitize path and not the render path.
    expect(raw).toHaveLength(1);
    expect(raw[0]).toContain('Alpha');

    const pre = shadow.querySelector<HTMLElement>('pre[data-diagram]');
    expect(pre!.getAttribute(DIAGRAM_STATE_ATTR)).toBe('failed');
    expect(getComputedStyle(pre!).display).not.toBe('none');
    expect(pre!.getBoundingClientRect().height).toBeGreaterThan(0);
    expect(pre!.textContent).toContain('graph TD');
    expect(shadow.querySelectorAll(FIGURE_SELECTOR)).toHaveLength(0);
    expect(shadow.querySelector(`.${DIAGRAM_ERROR_CLASS}`)?.textContent).toContain(
      'rejected by the sanitizer',
    );

    // The control is the ablation: the SAME engine, the SAME document, without the transform.
    await successControl();
  }, 30_000);

  it('engine load failure: every fence stays a visible code fence (6.1 owns the full proof)', async () => {
    const shadow = enhancedHost(MIXED_DOC, async () => {
      throw new Error('chunk unavailable');
    });
    await settleDiagrams(shadow);

    const pres = [...shadow.querySelectorAll<HTMLElement>('pre[data-diagram]')];
    expect(pres).toHaveLength(2);
    for (const pre of pres) {
      expect(pre.getAttribute(DIAGRAM_STATE_ATTR)).toBe('failed');
      expect(getComputedStyle(pre).display).not.toBe('none');
      expect(pre.getBoundingClientRect().height).toBeGreaterThan(0);
    }
    expect(shadow.querySelectorAll(FIGURE_SELECTOR)).toHaveLength(0); // nothing stranded
    expect(shadow.querySelectorAll(`.${DIAGRAM_ERROR_CLASS}`)).toHaveLength(2);
    expect(shadow.textContent).toContain('Before.'); // never a blank page
    expect(shadow.textContent).toContain('After.');

    await successControl();
  }, 30_000);
});

describe('D-12 parity — the RENDER path behaves the same from both call sites', () => {
  it('readerPane and the watch render closure both reach `rendered` on the same markdown', async () => {
    const fromPane = await appPageReader(GOOD_FENCE); // site 1, production, nothing injected
    const fromWatch = enhancedHost(GOOD_FENCE); // site 2's shape, production loader too
    await settleDiagrams(fromPane);
    await settleDiagrams(fromWatch);

    for (const shadow of [fromPane, fromWatch]) {
      const pre = shadow.querySelector<HTMLElement>('pre[data-diagram]');
      const figure = shadow.querySelector<HTMLElement>(FIGURE_SELECTOR);
      expect(figure?.getAttribute(DIAGRAM_STATE_ATTR)).toBe('rendered');
      expect(pre?.getAttribute(DIAGRAM_STATE_ATTR)).toBe('rendered');
      expect(figure!.querySelector('svg')).not.toBeNull();
      expect(figure!.querySelector('style')).not.toBeNull();
      expect(getComputedStyle(pre!).display).toBe('none');
      expect(figure!.textContent).toContain('Alpha');
    }
  }, 45_000);
});

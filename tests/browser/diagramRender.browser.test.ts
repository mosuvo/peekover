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
// No engine is loaded here: task 3.1 is the scaffolding and the render path is 3.2's, so the
// `rendered` state is reached by calling `markDiagramRendered` with a stand-in node. What is under
// test is the STRUCTURE and its CSS contract, not mermaid.

import { describe, it, expect, afterEach } from 'vitest';
import { createReaderPane } from '../../src/app/readerPane';
import { mount } from '../../src/render/mount';
import { enhanceDiagrams } from '../../src/render/diagramEnhancer';
import { DIAGRAM_FIGURE_CLASS, DIAGRAM_STATE_ATTR, markDiagramRendered } from '../../src/render/diagramView';

const FIGURE_SELECTOR = `figure.${DIAGRAM_FIGURE_CLASS}`;

const DOC =
  '# Diagram document\n\n' +
  'Paragraph before the diagram, long enough to occupy the column and give row 5 a real box ' +
  'of text to be occluded by if the figure were positioned rather than in flow.\n\n' +
  '```mermaid\ngraph TD; A-->B;\n```\n\n' +
  'Paragraph after the diagram, likewise real text in the reading column.\n';

const cleanup: HTMLElement[] = [];
afterEach(() => {
  for (const el of cleanup.splice(0)) el.remove();
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

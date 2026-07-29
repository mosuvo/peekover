// @vitest-environment jsdom
//
// The synchronous prologue (007 task 3.1) — D-15's structure, built over the REAL mount() output
// so the fence seam is exercised rather than hand-mocked. No engine is involved: 3.1 is scaffolding
// and the render path is 3.2's, so what is under test here is the shape a document is left in when
// nothing further ever happens to it. That state is not a placeholder for a test — it IS the
// shipped degraded state (§3.8, §4, AGENTS.md #5), which is why it gets asserted directly.
//
// The jsdom limit is respected: every assertion here is DOM SHAPE. Whether the CSS rule actually
// hides the source <pre>, and whether the figure lands inside the reading column's box, are
// computed-style and layout questions jsdom cannot answer — they live in
// tests/browser/diagramRender.browser.test.ts on both engines.

import { describe, it, expect } from 'vitest';
import { mount } from './mount';
import {
  DIAGRAM_FENCE_SELECTOR,
  diagramFencesIn,
  diagramSourceOf,
  enhanceDiagrams,
} from './diagramEnhancer';
import { DIAGRAM_FENCE_SELECTOR as ENGINE_FENCE_SELECTOR } from './diagramEngine';
import {
  DIAGRAM_FIGURE_CLASS,
  DIAGRAM_STATE_ATTR,
  insertDiagramPlaceholder,
  markDiagramFailed,
  markDiagramRendered,
} from './diagramView';

const HOST_TAG = 'peekover-root';
const FIGURE_SELECTOR = `figure.${DIAGRAM_FIGURE_CLASS}`;

/** A real mounted reader: parse -> sanitize -> shadow DOM, exactly as the app page commits it. */
function mountedHost(markdown: string): { host: HTMLElement; shadow: ShadowRoot } {
  const host = document.createElement(HOST_TAG);
  document.body.appendChild(host);
  mount(markdown, host, { contained: true });
  const shadow = host.shadowRoot;
  if (!shadow) throw new Error('mount() produced no shadow root');
  return { host, shadow };
}

const fence = (lang: string, body: string): string => '```' + lang + '\n' + body + '\n```\n';

describe('the fence predicate', () => {
  it('matches language-mermaid and not language-js or a bare code block', () => {
    const { shadow } = mountedHost(
      '# Doc\n\n' +
        fence('mermaid', 'graph TD; A-->B;') +
        '\n' +
        fence('js', 'const a = 1;') +
        '\n' +
        '    an indented block\n\n' +
        'Some `inline code` in prose.\n',
    );

    const fences = diagramFencesIn(shadow);
    expect(fences).toHaveLength(1);
    expect(fences[0].tagName).toBe('PRE');
    expect(fences[0].querySelector('code')?.className).toBe('language-mermaid');

    // The control that makes the count meaningful: the document really does contain other code
    // blocks, so "1" is a discrimination and not an empty instrument.
    expect(shadow.querySelectorAll('pre > code').length).toBeGreaterThan(1);
    expect(shadow.querySelectorAll('code.language-js')).toHaveLength(1);
  });

  it('pins the selector against diagramEngine.ts, which it deliberately does not import', () => {
    // The enhancer declares its own copy so the app-page graph never reaches diagramEngine (and
    // therefore never materialises mermaid's chunk) at 3.1 — see the module header. This test
    // imports both, which costs no bundle bytes, so the two cannot drift apart in silence.
    expect(DIAGRAM_FENCE_SELECTOR).toBe(ENGINE_FENCE_SELECTOR);
  });
});

describe('the synchronous prologue', () => {
  it('leaves D-15 structure in the DOM before any microtask can run', () => {
    const { host, shadow } = mountedHost(fence('mermaid', 'graph TD; A-->B;'));

    expect(shadow.querySelectorAll(FIGURE_SELECTOR)).toHaveLength(0); // pre-state

    const returned: unknown = enhanceDiagrams(host);

    // Already committed, in the SAME synchronous tick as the call — this is D-12's cooldown
    // constraint and §4's pre-paint half. A function that awaited anything would fail here.
    expect(shadow.querySelectorAll(FIGURE_SELECTOR)).toHaveLength(1);
    expect(returned).toBeUndefined();
    expect(returned).not.toBeInstanceOf(Promise);
  });

  it('builds the figure as a SIBLING of the source pre, both marked pending', () => {
    const { host, shadow } = mountedHost(fence('mermaid', 'graph TD; A-->B;'));
    enhanceDiagrams(host);

    const pre = shadow.querySelector('pre');
    const figure = shadow.querySelector(FIGURE_SELECTOR);
    if (!pre || !figure) throw new Error('expected a fence and a figure');

    expect(pre.nextElementSibling).toBe(figure);
    expect(figure.parentElement).toBe(pre.parentElement);
    expect(pre.getAttribute(DIAGRAM_STATE_ATTR)).toBe('pending');
    expect(figure.getAttribute(DIAGRAM_STATE_ATTR)).toBe('pending');

    // Row 18 — an empty box has nothing to announce.
    expect(figure.getAttribute('aria-hidden')).toBe('true');
    expect(figure.childNodes).toHaveLength(0);

    // The reading column, not a detached corner of the shadow root (the browser suite asserts the
    // geometric half of this; the containment relation is checkable here).
    expect(figure.closest('.peekover-reader')).not.toBeNull();
  });

  it('CONTROL: a fence-free document grows no structure at all', () => {
    const { host, shadow } = mountedHost('# Doc\n\n' + fence('js', 'const a = 1;'));
    enhanceDiagrams(host);

    expect(shadow.querySelectorAll(FIGURE_SELECTOR)).toHaveLength(0);
    expect(shadow.querySelectorAll(`[${DIAGRAM_STATE_ATTR}]`)).toHaveLength(0);
  });

  it('CONTROL: an unenhanced mount of the same markdown has no structure either', () => {
    // The presence assertions above are only results if the structure is absent when the enhancer
    // is not called. Same input, same mount, no call.
    const { shadow } = mountedHost(fence('mermaid', 'graph TD; A-->B;'));
    expect(shadow.querySelectorAll(FIGURE_SELECTOR)).toHaveLength(0);
    expect(shadow.querySelectorAll(`[${DIAGRAM_STATE_ATTR}]`)).toHaveLength(0);
  });

  it('no-ops on a host with no shadow root, and is idempotent over an enhanced tree', () => {
    expect(() => enhanceDiagrams(document.createElement('div'))).not.toThrow();

    const { host, shadow } = mountedHost(fence('mermaid', 'graph TD; A-->B;'));
    enhanceDiagrams(host);
    enhanceDiagrams(host);
    enhanceDiagrams(host);
    expect(shadow.querySelectorAll(FIGURE_SELECTOR)).toHaveLength(1);
  });

  it('enhances every fence in a multi-diagram document', () => {
    const { host, shadow } = mountedHost(
      fence('mermaid', 'graph TD; A-->B;') +
        '\n' +
        fence('js', 'const a = 1;') +
        '\n' +
        fence('mermaid', 'sequenceDiagram; A->>B: hi'),
    );
    enhanceDiagrams(host);
    expect(shadow.querySelectorAll(FIGURE_SELECTOR)).toHaveLength(2);
  });
});

describe('the diagram source is read as TEXT, never as markup', () => {
  // The one security-adjacent assertion in 3.1. The fence body below is chosen so that assigning
  // it as markup ANYWHERE would be observable: the <img onerror> fires on a real engine and
  // materialises an <img> element in jsdom, and the </pre><script> sequence would break out of the
  // retained fence if the source were ever re-serialised into innerHTML. The whole point of D-15
  // retaining mount()'s already-sanitized <pre> is that no such assignment exists to reach.
  const PAYLOAD = 'graph TD; A["<img src=x onerror=alert(1)>"]--></pre><script>alert(2)</script>';

  it('round-trips a markup payload through textContent with nothing parsed', () => {
    const { host, shadow } = mountedHost(fence('mermaid', PAYLOAD));
    enhanceDiagrams(host);

    const pre = shadow.querySelector('pre');
    if (!pre) throw new Error('expected the source fence to be retained');

    // Read back byte-for-byte: this is what 3.2 will hand the engine, and it is text. The trailing
    // newline is markdown-it's fence terminator, not ours — pinned rather than trimmed, because
    // trimming here would be this module quietly editing the source it is supposed to only read.
    expect(diagramSourceOf(pre)).toBe(PAYLOAD + '\n');

    // Nothing was parsed. If any stage had assigned this as markup, at least one of these fires.
    expect(shadow.querySelector('img')).toBeNull();
    expect(shadow.querySelector('script')).toBeNull();
    expect(shadow.querySelectorAll('pre')).toHaveLength(1);

    // The placeholder received no content — the source went nowhere near it.
    expect(shadow.querySelector(FIGURE_SELECTOR)?.childNodes).toHaveLength(0);

    // CONTROL: the payload really is present as text, so the nulls above are a result and not an
    // artefact of the fence having been dropped somewhere upstream.
    expect(pre.textContent).toContain('<img src=x onerror=alert(1)>');
    expect(pre.textContent).toContain('<script>');
  });

  it('CONTROL: the same payload assigned as markup DOES materialise an img', () => {
    // Proves the instrument fires. Assigned into an inert <template> so this control cannot itself
    // put anything on the wire (mount.ts:119-129's standing lesson).
    const tpl = document.createElement('template');
    tpl.innerHTML = PAYLOAD;
    expect(tpl.content.querySelector('img')).not.toBeNull();
  });
});

describe("D-15's states", () => {
  it('rendered: content committed, source marked hidden, both still in the tree', () => {
    const { host, shadow } = mountedHost(fence('mermaid', 'graph TD; A-->B;'));
    enhanceDiagrams(host);

    const pre = shadow.querySelector('pre');
    const figure = shadow.querySelector<HTMLElement>(FIGURE_SELECTOR);
    if (!pre || !figure) throw new Error('expected the enhanced pair');

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    markDiagramRendered(pre, figure, svg);

    expect(figure.getAttribute(DIAGRAM_STATE_ATTR)).toBe('rendered');
    expect(figure.hasAttribute('aria-hidden')).toBe(false);
    expect(figure.firstElementChild).toBe(svg);

    // NEVER REMOVED — both halves. The <pre> is still in the document and still holds its source;
    // only its state attribute changed, and CSS does the rest (asserted for real in the browser).
    expect(pre.isConnected).toBe(true);
    expect(pre.getAttribute(DIAGRAM_STATE_ATTR)).toBe('rendered');
    expect(diagramSourceOf(pre)).toBe('graph TD; A-->B;\n');
  });

  it('failed: the placeholder goes, the source fence stays visible', () => {
    const { host, shadow } = mountedHost(fence('mermaid', 'graph TD; A-->B;'));
    enhanceDiagrams(host);

    const pre = shadow.querySelector('pre');
    const figure = shadow.querySelector<HTMLElement>(FIGURE_SELECTOR);
    if (!pre || !figure) throw new Error('expected the enhanced pair');

    markDiagramFailed(pre, figure);

    expect(shadow.querySelectorAll(FIGURE_SELECTOR)).toHaveLength(0);
    expect(pre.isConnected).toBe(true);
    expect(pre.getAttribute(DIAGRAM_STATE_ATTR)).toBe('failed');
    // `failed` is not `rendered`, which is the only value the stylesheet hides.
    expect(pre.getAttribute(DIAGRAM_STATE_ATTR)).not.toBe('rendered');
  });

  it('the never-rendered document degrades by construction, not by a catch block', () => {
    // The engine is not wired at 3.1, so this is literally what a user sees today — and what they
    // would still see if the engine never loaded (§3.8's first failure, group 6.1's subject).
    const { host, shadow } = mountedHost('Prose.\n\n' + fence('mermaid', 'graph TD; A-->B;'));
    enhanceDiagrams(host);

    const pre = shadow.querySelector('pre');
    expect(pre?.isConnected).toBe(true);
    expect(pre?.getAttribute(DIAGRAM_STATE_ATTR)).toBe('pending');
    expect(pre?.textContent).toContain('graph TD; A-->B;');
    expect(shadow.textContent).toContain('Prose.');
  });

  it('insertDiagramPlaceholder places the figure after the pre in a plain tree', () => {
    // The view module standing alone, with no mount and no enhancer — the unit under the unit.
    const parent = document.createElement('div');
    parent.innerHTML = '<pre><code class="language-mermaid">x</code></pre><p>after</p>';
    const pre = parent.querySelector('pre');
    if (!pre) throw new Error('fixture');

    const figure = insertDiagramPlaceholder(pre);
    expect(pre.nextElementSibling).toBe(figure);
    expect(figure.nextElementSibling?.tagName).toBe('P');
  });
});

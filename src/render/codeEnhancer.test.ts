// @vitest-environment jsdom
//
// The synchronous prologue (task 4.1) — D-6's structure, built over the REAL mount() output so the
// fence seam is exercised rather than hand-mocked. No engine is involved: 4.1 is scaffolding and the
// tokenize/adopt path is task 4.2's, so what is under test here is the shape a document is left in
// when nothing further ever happens to it. That state is not a placeholder for a test — it IS the
// shipped degraded state (§3.9, §4, AGENTS.md #5), which is why it gets asserted directly.
//
// The jsdom limit is respected: every assertion here is DOM SHAPE. Whether `readerCss.ts`'s rule
// actually hides the retained `<pre>` once `rendered`, and whether the wrapper lands inside the
// reading column's box, are computed-style and layout questions jsdom cannot answer — they live in
// tests/browser/codeRender.browser.test.ts on both engines.

import { describe, it, expect } from 'vitest';
import { mount } from './mount';
import { CODE_FENCE_SELECTOR, codeFencesIn, enhanceCode } from './codeEnhancer';
import { CODE_FENCE_SELECTOR as ENGINE_FENCE_SELECTOR } from './codeEngine';
import { CODE_STATE_ATTR, CODE_WRAPPER_CLASS, markCodeRendered } from './codeView';

const HOST_TAG = 'peekover-root';
const WRAPPER_SELECTOR = `div.${CODE_WRAPPER_CLASS}`;

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
  it('matches language-classed fences and not a bare/unlabelled code block', () => {
    const { shadow } = mountedHost(
      '# Doc\n\n' +
        fence('javascript', 'const a = 1;') +
        '\n' +
        '```\nno language here\n```\n' +
        '\n' +
        'Some `inline code` in prose.\n',
    );

    const fences = codeFencesIn(shadow);
    expect(fences).toHaveLength(1);
    expect(fences[0].tagName).toBe('PRE');
    expect(fences[0].querySelector('code')?.className).toBe('language-javascript');

    // The control that makes the count meaningful: the document really does contain another
    // pre>code (the unlabelled fence), so "1" is a discrimination and not an empty instrument.
    expect(shadow.querySelectorAll('pre > code').length).toBeGreaterThan(1);
  });

  it('pins the selector against codeEngine.ts, which it deliberately does not import', () => {
    // The enhancer declares its own copy so the app-page graph never reaches codeEngine.ts (and
    // therefore never evaluates Shiki's static leaves eagerly) at 4.1 — see the module header.
    // This test imports both, which costs no bundle bytes, so the two cannot drift apart in silence.
    expect(CODE_FENCE_SELECTOR).toBe(ENGINE_FENCE_SELECTOR);
  });

  it('excludes a mermaid fence — 007 already owns it (module header, discovered this task)', () => {
    const { shadow } = mountedHost(
      '# Doc\n\n' +
        fence('mermaid', 'graph TD; A-->B;') +
        '\n' +
        fence('javascript', 'const a = 1;'),
    );

    // The raw selector WOULD match both (language-mermaid starts with language-) — the control
    // that makes the exclusion below meaningful rather than an artefact of the selector itself.
    expect(shadow.querySelectorAll(CODE_FENCE_SELECTOR)).toHaveLength(2);

    const fences = codeFencesIn(shadow);
    expect(fences).toHaveLength(1);
    expect(fences[0].querySelector('code')?.className).toBe('language-javascript');
  });
});

describe('the synchronous prologue', () => {
  it('leaves D-6 structure in the DOM before any microtask can run', () => {
    const { host, shadow } = mountedHost(fence('javascript', 'const a = 1;'));

    expect(shadow.querySelectorAll(WRAPPER_SELECTOR)).toHaveLength(0); // pre-state

    const returned: unknown = enhanceCode(host);

    // Already committed, in the SAME synchronous tick as the call — D-5's cooldown constraint and
    // §4's pre-paint half. A function that awaited anything would fail here.
    expect(shadow.querySelectorAll(WRAPPER_SELECTOR)).toHaveLength(1);
    expect(returned).toBeUndefined();
    expect(returned).not.toBeInstanceOf(Promise);
  });

  it('wraps the retained pre inside the wrapper, at the position the pre used to occupy, both marked pending', () => {
    const { host, shadow } = mountedHost(
      '# Doc\n\nBefore.\n\n' + fence('javascript', 'const a = 1;') + '\nAfter.\n',
    );
    const before = shadow.querySelector('p');
    enhanceCode(host);

    const pre = shadow.querySelector('pre');
    const wrapper = shadow.querySelector<HTMLElement>(WRAPPER_SELECTOR);
    if (!pre || !wrapper) throw new Error('expected a fence and a wrapper');

    // D-6: the wrapper WRAPS the retained pre — not a sibling that leaves it where it was.
    expect(wrapper.contains(pre)).toBe(true);
    expect(pre.parentElement).toBe(wrapper);
    expect(pre.getAttribute(CODE_STATE_ATTR)).toBe('pending');
    expect(wrapper.getAttribute(CODE_STATE_ATTR)).toBe('pending');

    // The wrapper lands where the pre used to be — right after the preceding paragraph — so the
    // document's visual order is unchanged by the re-parent.
    expect(wrapper.previousElementSibling).toBe(before);

    // Unlike diagramView.ts's EMPTY placeholder, the wrapper already holds the retained pre's real,
    // readable text — nothing here is hidden from assistive technology yet (module header).
    expect(wrapper.hasAttribute('aria-hidden')).toBe(false);
    expect(pre.textContent).toContain('const a = 1;');

    // The reading column, not a detached corner of the shadow root (the browser suite asserts the
    // geometric half of this — §3.11 row 4).
    expect(wrapper.closest('.peekover-reader')).not.toBeNull();
  });

  it('CONTROL: a fence-free document grows no structure at all', () => {
    const { host, shadow } = mountedHost('# Doc\n\nJust prose, no fences.\n');
    enhanceCode(host);

    expect(shadow.querySelectorAll(WRAPPER_SELECTOR)).toHaveLength(0);
    expect(shadow.querySelectorAll(`[${CODE_STATE_ATTR}]`)).toHaveLength(0);
  });

  it('CONTROL: an unenhanced mount of the same markdown has no structure either', () => {
    // The presence assertions above are only results if the structure is absent when the enhancer
    // is not called. Same input, same mount, no call.
    const { shadow } = mountedHost(fence('javascript', 'const a = 1;'));
    expect(shadow.querySelectorAll(WRAPPER_SELECTOR)).toHaveLength(0);
    expect(shadow.querySelectorAll(`[${CODE_STATE_ATTR}]`)).toHaveLength(0);
  });

  it('no-ops on a host with no shadow root, and is idempotent over an enhanced tree', () => {
    expect(() => enhanceCode(document.createElement('div'))).not.toThrow();

    const { host, shadow } = mountedHost(fence('javascript', 'const a = 1;'));
    enhanceCode(host);
    enhanceCode(host);
    enhanceCode(host);
    expect(shadow.querySelectorAll(WRAPPER_SELECTOR)).toHaveLength(1);
  });

  it("REGRESSION: leaves a diagram-owned pre's structure completely untouched", () => {
    // Reproduces the exact defect discovered this task: wiring enhanceCode at the real call sites
    // (readerPane.ts/appShell.ts) runs it AFTER enhanceDiagrams, which has already re-parented a
    // mermaid fence's structure and marked its pre 'data-diagram="pending"' — a different attribute
    // this module never checks, unlike its own 'data-code'. Simulated here without importing
    // diagramView.ts (which this module must never import, plan §2), by hand-building the shape
    // enhanceDiagrams leaves behind and confirming enhanceCode does not move or mark it.
    const { host, shadow } = mountedHost(fence('mermaid', 'graph TD; A-->B;'));
    const pre = shadow.querySelector('pre');
    if (!pre) throw new Error('expected the mermaid fence');
    const figure = document.createElement('figure');
    pre.after(figure);
    pre.setAttribute('data-diagram', 'pending');
    const originalParent = pre.parentElement;

    enhanceCode(host);

    expect(pre.nextElementSibling).toBe(figure); // NOT moved into a .peekover-code wrapper
    expect(pre.parentElement).toBe(originalParent); // re-parented nowhere
    expect(pre.hasAttribute(CODE_STATE_ATTR)).toBe(false); // NOT claimed by this module either
    expect(shadow.querySelectorAll(WRAPPER_SELECTOR)).toHaveLength(0);
  });

  it('enhances every fence in a multi-block document', () => {
    const { host, shadow } = mountedHost(
      fence('javascript', 'const a = 1;') + '\n' + fence('python', 'a = 1') + '\n' + '```\nno lang\n```\n',
    );
    enhanceCode(host);
    // Two language-classed fences wrapped; the unlabelled third is untouched (the fence predicate).
    expect(shadow.querySelectorAll(WRAPPER_SELECTOR)).toHaveLength(2);
  });
});

describe('the fence source is read as TEXT, never as markup', () => {
  // The one security-adjacent assertion in 4.1, mirroring diagramEnhancer.test.ts's own. The fence
  // body below is chosen so that assigning it as markup ANYWHERE would be observable. The whole
  // point of D-6 retaining mount()'s already-sanitized <pre> is that no such assignment exists to
  // reach: re-parenting the node is not re-serializing it.
  const PAYLOAD = '<img src=x onerror=alert(1)></pre><script>alert(2)</script>';

  it('round-trips a markup payload through the retained pre with nothing (re-)parsed', () => {
    const { host, shadow } = mountedHost(fence('text', PAYLOAD));
    enhanceCode(host);

    const pre = shadow.querySelector('pre');
    if (!pre) throw new Error('expected the source fence to be retained');

    // Nothing was parsed by this task's own code. If insertCodeWrapper had re-serialized the pre
    // (e.g. via outerHTML round-tripping) rather than re-parenting the live node, at least one of
    // these fires.
    expect(shadow.querySelector('img')).toBeNull();
    expect(shadow.querySelector('script')).toBeNull();
    expect(shadow.querySelectorAll('pre')).toHaveLength(1);

    // CONTROL: the payload really is present as text, so the nulls above are a result and not an
    // artefact of the fence having been dropped somewhere upstream.
    expect(pre.textContent).toContain('<img src=x onerror=alert(1)>');
    expect(pre.textContent).toContain('<script>');
  });

  it('CONTROL: the same payload assigned as markup DOES materialise an img', () => {
    // Proves the instrument fires. Assigned into an inert <template> so this control cannot itself
    // put anything on the wire (mount.ts's standing lesson).
    const tpl = document.createElement('template');
    tpl.innerHTML = PAYLOAD;
    expect(tpl.content.querySelector('img')).not.toBeNull();
  });
});

describe("D-6's rendered state", () => {
  it('rendered: content committed, retained pre marked hidden, both still in the tree', () => {
    const { host, shadow } = mountedHost(fence('javascript', 'const a = 1;'));
    enhanceCode(host);

    const pre = shadow.querySelector<HTMLElement>('pre');
    const wrapper = shadow.querySelector<HTMLElement>(WRAPPER_SELECTOR);
    if (!pre || !wrapper) throw new Error('expected the enhanced pair');

    const highlighted = document.createElement('pre');
    highlighted.className = 'shiki';
    markCodeRendered(pre, wrapper, highlighted);

    expect(wrapper.getAttribute(CODE_STATE_ATTR)).toBe('rendered');
    expect(pre.getAttribute(CODE_STATE_ATTR)).toBe('rendered');
    expect(wrapper.contains(highlighted)).toBe(true);

    // NEVER REMOVED. The retained pre is still in the document and still holds its source; only
    // its state attribute changed, and CSS does the rest (asserted for real in the browser suite).
    expect(pre.isConnected).toBe(true);
    expect(wrapper.contains(pre)).toBe(true);
    expect(pre.textContent).toContain('const a = 1;');
  });
});

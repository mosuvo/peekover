// Inline math (M11 task 5.1-R) in a REAL ENGINE, Chromium AND Firefox — D-7-R's mutate-in-place
// inversion: the `<code class="peekover-math-inline">` element PERSISTS across a successful render
// (children replaced, the element itself never removed/wrapped/replaced), it renders in RUNNING
// TEXT (inline-capable, unlike block's own figure), and it gets NO control group, NO sibling, NO
// hover/focus popover — those are 6.1-R/6.2-R's own job.
//
// Three properties below are structurally beyond jsdom, mirroring `mathBlock.browser.test.ts`'s own
// header reasoning:
//   • THE FONT ACTUALLY RESOLVES for inline math too — a real Font Loading API / computed-style
//     question, same as block's own INPUT A.
//   • PROSE FLOW / inline layout — whether the rendered `<math>` sits IN a paragraph's own text flow
//     (never as a block-level break) is a layout question, not a DOM-shape one.
//   • ELEMENT IDENTITY ACROSS A REAL RENDER PASS — `shadow.querySelector(...) === code` before/after
//     is a real-DOM reference-equality check the production `enhanceMath` → `renderMath` → `sanitizeMath`
//     → adopt pipeline must hold end to end, not something a fake engine's jsdom proof can stand in for
//     (jsdom CAN express element identity, but only real Temml output exercises the full adoption path
//     this property must survive).

import { describe, it, expect, afterEach } from 'vitest';
import { createReaderPane } from '../../src/app/readerPane';
import { mount } from '../../src/render/mount';
import { enhanceMath } from '../../src/render/mathEnhancer';
import { MATH_INLINE_SELECTOR } from '../../src/render/mathEngine';
import { MATH_FIGURE_CLASS, MATH_STATE_ATTR } from '../../src/render/mathView';
import { MATH_FONT_FAMILY } from '../../src/theme/mathFont';
import type { EngineLoader } from '../../src/render/mathEngine';

const FIGURE_SELECTOR = `figure.${MATH_FIGURE_CLASS}`;

const cleanup: HTMLElement[] = [];
afterEach(() => {
  for (const el of cleanup.splice(0)) el.remove();
});

/** The APP-PAGE surface, driven through the production pane — mirrors `mathBlock.browser.test.ts`'s
 *  own helper exactly (duplicated rather than imported: each browser test file in this milestone is
 *  self-contained, the established convention `mathDegrade.browser.test.ts` already follows). */
async function appPageReader(markdown: string): Promise<{ host: HTMLElement; shadow: ShadowRoot }> {
  const pane = createReaderPane(document);
  document.body.appendChild(pane.element);
  cleanup.push(pane.element);
  await pane.select({ name: 'doc.md', read: async () => markdown });
  const host = pane.element.querySelector<HTMLElement>('.peekover-app__reader__host');
  if (!host?.shadowRoot) throw new Error('reader pane produced no mounted host');
  return { host, shadow: host.shadowRoot };
}

/** The CONTENT-SCRIPT surface: `mount()` and nothing else — `enhanceMath` never runs here (D-3-R). */
function contentScriptReader(markdown: string): ShadowRoot {
  const host = document.createElement('peekover-root');
  document.body.appendChild(host);
  cleanup.push(host);
  mount(markdown, host);
  if (!host.shadowRoot) throw new Error('mount produced no shadow root');
  return host.shadowRoot;
}

/** A directly-driven reader for tests that need to call `enhanceMath` more than once (idempotency)
 *  or inject a loader — mirrors `mathDegrade.browser.test.ts`'s own `enhancedReader` helper. */
function enhancedReader(markdown: string, loader?: EngineLoader): ShadowRoot {
  const host = document.createElement('div');
  document.body.appendChild(host);
  cleanup.push(host);
  mount(markdown, host, { contained: true });
  enhanceMath(host, loader ? { loader } : {});
  if (!host.shadowRoot) throw new Error('expected a mounted host');
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

describe('row 4(inline) — the two-surface comparison (D-3-R)', () => {
  it('the content-script reader leaves an inline math marker an ordinary inert code element', () => {
    const shadow = contentScriptReader('Inline math $x^2$ sits in this sentence.\n');

    const code = shadow.querySelector(MATH_INLINE_SELECTOR);
    expect(code).not.toBeNull();
    expect(code?.hasAttribute(MATH_STATE_ATTR)).toBe(false);
    expect(code?.textContent).toBe('$x^2$');
    expect(code?.querySelector('math')).toBeNull();
    expect(getComputedStyle(code!).display).not.toBe('none');
  });
});

describe('D-7-R — inline math renders in running text, mutate-in-place, no sibling', () => {
  it('replaces the code element\'s own children with a <math> tree; prose flow stays unbroken', async () => {
    const { shadow } = await appPageReader(
      'Opening words, then inline math $x^2$ right here, then closing words in the same paragraph.\n',
    );
    await settleMath(shadow, 1);

    const code = shadow.querySelector<HTMLElement>(MATH_INLINE_SELECTOR);
    if (!code) throw new Error('expected an inline marker');
    expect(code.tagName.toLowerCase()).toBe('code');
    expect(code.getAttribute(MATH_STATE_ATTR)).toBe('rendered');
    expect(code.querySelector('math')).not.toBeNull();

    // No figure anywhere (D-8-R's own shape is block/fence-only) and no new sibling element beside
    // the code element — D-7's own "no beside to use" reasoning, proven as a real DOM fact.
    expect(shadow.querySelectorAll(FIGURE_SELECTOR)).toHaveLength(0);
    const parent = code.parentElement;
    expect(parent?.children).toHaveLength(1); // only the <code> itself

    // Prose flow: the same paragraph carries the words on both sides of the formula.
    const p = code.closest('p');
    if (!p) throw new Error('expected the marker to remain inside its paragraph');
    expect(p.textContent).toContain('Opening words');
    expect(p.textContent).toContain('closing words');

    // Inline, not block-level — the math tree sits in a text flow, never breaking it.
    expect(getComputedStyle(code).display).not.toBe('block');
    expect(getComputedStyle(code).display).not.toBe('none');
  });

  it('★ PERSISTENCE — the SAME <code> element survives a real render, never removed/replaced (D-7-R)', async () => {
    const { shadow } = await appPageReader('Persisted inline math: $x^2$ done.\n');

    const before = shadow.querySelector<HTMLElement>(MATH_INLINE_SELECTOR);
    if (!before) throw new Error('expected an inline marker before enhancement settles');
    // An expando the DOM never serializes — a version that swaps in a NEW element on success would
    // lose it; a version that mutates the SAME element in place keeps it. This is the anchor
    // `tasks.md`'s own text names: "reverted by removing/replacing the element on success, which
    // must go red naming the missing anchor."
    const ANCHOR = Symbol('peekover-persistence-anchor');
    (before as unknown as Record<symbol, boolean>)[ANCHOR] = true;

    await settleMath(shadow, 1);

    const after = shadow.querySelector<HTMLElement>(MATH_INLINE_SELECTOR);
    expect(after, 'no inline marker survived enhancement at all').not.toBeNull();
    expect(after, 'reference identity: the post-render element must be the SAME object').toBe(before);
    expect(
      (after as unknown as Record<symbol, boolean> | null)?.[ANCHOR],
      'the expando anchor did not survive — the element was replaced, not mutated',
    ).toBe(true);
    expect(after?.getAttribute(MATH_STATE_ATTR)).toBe('rendered');
    expect(after?.querySelector('math')).not.toBeNull();
  });

  it('no control group, no hover/focus popover, no new interactive element anywhere (row 11 — negative)', async () => {
    // The reader pane's OWN chrome (the diff-compare pill, export controls, …) already carries
    // buttons unrelated to math — an absolute zero-buttons-in-the-shadow assertion would be a fact
    // about that pre-existing chrome, not about this task's own diff. Delta-based instead: the
    // button/group/toolbar COUNT must not move across enhancement, and none of it may sit inside or
    // beside the math marker specifically.
    const { shadow } = await appPageReader('Inline $x^2$ math with nothing to click.\n');
    const before = {
      buttons: shadow.querySelectorAll('button').length,
      groups: shadow.querySelectorAll('[role="group"]').length,
      toolbars: shadow.querySelectorAll('[role="toolbar"]').length,
    };
    await settleMath(shadow, 1);

    expect(shadow.querySelectorAll('button')).toHaveLength(before.buttons);
    expect(shadow.querySelectorAll('[role="group"]')).toHaveLength(before.groups);
    expect(shadow.querySelectorAll('[role="toolbar"]')).toHaveLength(before.toolbars);

    const code = shadow.querySelector<HTMLElement>(MATH_INLINE_SELECTOR);
    if (!code) throw new Error('expected an inline marker');
    expect(code.querySelector('button')).toBeNull();
    expect(code.closest('[role="group"]')).toBeNull();
    expect(code.parentElement?.querySelector('button')).toBeNull();
  });

  it('accessible name comes from the <math> tree itself — no aria-label/title added on success (row 17)', async () => {
    const { shadow } = await appPageReader('Inline $x^2$ math.\n');
    await settleMath(shadow, 1);

    const code = shadow.querySelector<HTMLElement>(MATH_INLINE_SELECTOR);
    expect(code?.hasAttribute('aria-label')).toBe(false);
    expect(code?.hasAttribute('title')).toBe(false); // title is reserved for the FAILED state only
  });

  it('idempotent — a second, concurrent enhanceMath call before settle does not double-render', async () => {
    const shadow = enhancedReader('Inline $x^2$ math, called twice.\n');
    enhanceMath(shadow.host as HTMLElement); // synchronous, before the first call's async body settles
    await settleMath(shadow, 1);

    const markers = [...shadow.querySelectorAll(MATH_INLINE_SELECTOR)];
    expect(markers).toHaveLength(1);
    expect(markers[0].querySelectorAll('math')).toHaveLength(1);
  });
});

describe('INPUT A (shared, re-proven for inline) — the bundled STIX Two Math subset applies here too', () => {
  it("an inline formula's computed font-family resolves to the registered family", async () => {
    // The GLYPH-ADVANCE differential proof (canvas.measureText, the non-vacuous discriminator) is
    // already earned at `mathBlock.browser.test.ts`'s own INPUT A arm, against the SAME shared CSS
    // rule (`mathCss.ts`'s `.peekover-reader math{font-family:'Peekover Math', math;}` — it does not
    // distinguish block from inline by selector). Per AGENTS.md's ablation-citation rule, that
    // mechanism-level proof is cited rather than re-earned; this test's own job is the DIRECT,
    // real-engine computed-style check at the INLINE call site specifically, which nothing else
    // exercises.
    const { shadow } = await appPageReader('Inline math $x^2$ needs its own font check.\n');
    await settleMath(shadow, 1);

    const mathEl = shadow.querySelector<HTMLElement>(`${MATH_INLINE_SELECTOR} math`);
    if (!mathEl) throw new Error('expected a rendered inline <math> element');
    expect(getComputedStyle(mathEl).fontFamily).toContain(MATH_FONT_FAMILY);
  });
});

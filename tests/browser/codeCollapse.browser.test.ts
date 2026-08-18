// codeCollapse — the collapse/expand structure's real-engine proof (task 6.1, D-10). §3.11's rows
// 12, 15, 19 and 24 are discharged here, each describe block named after the row it proves (row
// 24 itself: "no sibling suite for this control anywhere in the codebase — established here,
// enumerated not transcribed" — so nothing below is copied wholesale from `codeToolbar.browser.
// test.ts`; only its PROVEN mechanisms are reused where they apply to the same wrapper tree).
//
// ── WHAT jsdom CANNOT ANSWER, AND WHY THIS FILE EXISTS BESIDE codeView.ts's OWN UNIT COVERAGE ──
//
// Real layout (row 12's rect equality), real computed style under a real cascade (row 19's
// transition), and real keyboard focus (§4's keyboard-reach criterion) are all beyond jsdom —
// `codeToolbar.browser.test.ts`'s own module header states the identical reasoning for the
// toolbar this control lives beside.
//
// ── ROW 19's PRECEDENT, FOLLOWED RATHER THAN RE-DISCOVERED ─────────────────────────────────────
//
// `codeToolbar.browser.test.ts`'s own row-19 describe block records that a LIVE
// `getComputedStyle(...).transitionDuration` check cannot discriminate reduced-motion from normal
// in THIS harness (both arms read ~0.001ms) — so it asserts against the SHIPPED CSS TEXT instead,
// with a control proving the pattern really can fail. This control sits in the exact same wrapper
// tree (`.peekover-code`, mounted the same way), so the same harness limitation applies here;
// the static-text approach is followed rather than re-hitting that flake.

import { describe, it, expect, afterEach, vi } from 'vitest';
import { mount } from '../../src/render/mount';
import { enhanceCode, resetCodeHostsForTest } from '../../src/render/codeEnhancer';
import {
  CODE_STATE_ATTR,
  CODE_WRAPPER_CLASS,
  CODE_COLLAPSE_ATTR,
  CODE_COLLAPSE_CONTROL_CLASS,
  CODE_COLLAPSE_LINE_THRESHOLD,
} from '../../src/render/codeView';
import { loadShikiCore, type CodeEngineModule, type EngineLoader } from '../../src/render/codeEngine';

const WRAPPER_SELECTOR = `div.${CODE_WRAPPER_CLASS}`;
const CONTROL_SELECTOR = `button.${CODE_COLLAPSE_CONTROL_CLASS}`;

/** A fenced block with exactly `lineCount` source lines — one statement per line, so `.line`
 *  spans in the adopted highlight land 1:1 with these. */
function codeBlock(lang: string, lineCount: number): string {
  const lines = Array.from({ length: lineCount }, (_, i) => `const line${i + 1} = ${i + 1};`);
  return '```' + lang + '\n' + lines.join('\n') + '\n```\n';
}

const cleanup: HTMLElement[] = [];
afterEach(() => {
  for (const el of cleanup.splice(0)) el.remove();
  resetCodeHostsForTest();
});

/** A host enhanced directly — `codeToolbar.browser.test.ts`'s own `directHost` shape (plan risk
 *  6: no shared browser-test helper module exists; re-implemented per file, as that file's own
 *  header notes). */
function directHost(markdown: string, loader?: EngineLoader): { host: HTMLElement; shadow: ShadowRoot } {
  const host = document.createElement('div');
  document.body.appendChild(host);
  cleanup.push(host);
  mount(markdown, host, { contained: true });
  enhanceCode(host, loader ? { loader } : {});
  if (!host.shadowRoot) throw new Error('mount produced no shadow root');
  return { host, shadow: host.shadowRoot };
}

/** Wait for the (only) fence in `shadow` to leave `pending`. */
async function rendered(shadow: ShadowRoot): Promise<HTMLElement> {
  return vi.waitFor(
    () => {
      const wrapper = shadow.querySelector<HTMLElement>(WRAPPER_SELECTOR);
      if (!wrapper || wrapper.getAttribute(CODE_STATE_ATTR) !== 'rendered') {
        throw new Error('not rendered yet');
      }
      return wrapper;
    },
    { timeout: 5000, interval: 20 },
  );
}

// A loader that delegates to the REAL shiki/core module but wraps the resolved engine's
// `codeToTokens` in a counting spy — production never sees this, only this file's "no
// second highlight pass" proof below does.
function spyingLoader(counter: { calls: number }): EngineLoader {
  return async (): Promise<CodeEngineModule> => {
    const real = await loadShikiCore();
    return {
      createHighlighterCore: (async (opts) => {
        const engine = await real.createHighlighterCore(opts);
        const original = engine.codeToTokens.bind(engine);
        engine.codeToTokens = ((...args: Parameters<typeof original>) => {
          counter.calls += 1;
          return original(...args);
        }) as typeof engine.codeToTokens;
        return engine;
      }) as CodeEngineModule['createHighlighterCore'],
    };
  };
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// tasks.md 6.1's Verify line, split into its two halves
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe('over threshold — collapsed with a preview and an "open raw" control', () => {
  it('gets data-code-state="collapsed", a real control, aria-expanded="false"', async () => {
    const { shadow } = directHost(codeBlock('javascript', CODE_COLLAPSE_LINE_THRESHOLD + 1));
    const wrapper = await rendered(shadow);

    expect(wrapper.getAttribute(CODE_COLLAPSE_ATTR)).toBe('collapsed');
    const control = wrapper.querySelector<HTMLButtonElement>(CONTROL_SELECTOR);
    if (!control) throw new Error('expected the collapse control');
    expect(control.tagName).toBe('BUTTON');
    expect(control.type).toBe('button');
    expect(control.getAttribute('aria-expanded')).toBe('false');
    expect(control.textContent).toBeTruthy();

    // The preview is real, not merely the attribute: the highlighted pre is clamped shorter than
    // its full content would need.
    const pre = wrapper.querySelector<HTMLElement>('pre.shiki');
    if (!pre) throw new Error('expected the highlighted pre');
    expect(pre.scrollHeight).toBeGreaterThan(pre.clientHeight);
  });
});

describe('under threshold — no collapse chrome at all', () => {
  it('exactly at the threshold: no attribute, no control', async () => {
    const { shadow } = directHost(codeBlock('javascript', CODE_COLLAPSE_LINE_THRESHOLD));
    const wrapper = await rendered(shadow);

    expect(wrapper.hasAttribute(CODE_COLLAPSE_ATTR)).toBe(false);
    expect(wrapper.querySelector(CONTROL_SELECTOR)).toBeNull();
  });

  it('a short block: no attribute, no control', async () => {
    const { shadow } = directHost(codeBlock('javascript', 3));
    const wrapper = await rendered(shadow);

    expect(wrapper.hasAttribute(CODE_COLLAPSE_ATTR)).toBe(false);
    expect(wrapper.querySelector(CONTROL_SELECTOR)).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// ROW 15 — aria-expanded on the control, plus text, never state carried by an icon alone
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe('row 15 — expand/collapse state is in aria-expanded AND in text', () => {
  it('clicking flips aria-expanded and the visible text, both directions', async () => {
    const { shadow } = directHost(codeBlock('javascript', CODE_COLLAPSE_LINE_THRESHOLD + 1));
    const wrapper = await rendered(shadow);
    const control = wrapper.querySelector<HTMLButtonElement>(CONTROL_SELECTOR);
    if (!control) throw new Error('expected the collapse control');

    const collapsedText = control.textContent;
    control.click();
    expect(control.getAttribute('aria-expanded')).toBe('true');
    expect(wrapper.getAttribute(CODE_COLLAPSE_ATTR)).toBe('expanded');
    expect(control.textContent).not.toBe(collapsedText);
    expect(control.getAttribute('aria-label')).toContain('expanded');

    control.click();
    expect(control.getAttribute('aria-expanded')).toBe('false');
    expect(wrapper.getAttribute(CODE_COLLAPSE_ATTR)).toBe('collapsed');
    expect(control.textContent).toBe(collapsedText);
    expect(control.getAttribute('aria-label')).toContain('truncated');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// §4 — keyboard-reachable
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe('keyboard-reachable expand/collapse (§4)', () => {
  it('a real <button>, no own tabindex, focusable', async () => {
    const { shadow } = directHost(codeBlock('javascript', CODE_COLLAPSE_LINE_THRESHOLD + 1));
    const wrapper = await rendered(shadow);
    const control = wrapper.querySelector<HTMLButtonElement>(CONTROL_SELECTOR);
    if (!control) throw new Error('expected the collapse control');

    expect(control.hasAttribute('tabindex')).toBe(false);
    control.focus();
    expect(shadow.activeElement, 'the collapse control did not take focus').toBe(control);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// ROW 12 — collapsing returns the block's height EXACTLY to the collapsed preview's
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe('row 12 — a collapse/expand cycle returns to the EXACT same rect', () => {
  it('expand grows the rect; collapsing again returns to the ORIGINAL collapsed height, exactly', async () => {
    const { shadow } = directHost(codeBlock('javascript', CODE_COLLAPSE_LINE_THRESHOLD + 20));
    const wrapper = await rendered(shadow);
    const control = wrapper.querySelector<HTMLButtonElement>(CONTROL_SELECTOR);
    const pre = wrapper.querySelector<HTMLElement>('pre.shiki');
    if (!control || !pre) throw new Error('expected the collapse control and the highlighted pre');

    const collapsedHeight = pre.getBoundingClientRect().height;

    control.click(); // expand
    const expandedHeight = pre.getBoundingClientRect().height;
    expect(expandedHeight).toBeGreaterThan(collapsedHeight); // the control for non-vacuity

    control.click(); // collapse again
    const recollapsedHeight = pre.getBoundingClientRect().height;
    expect(recollapsedHeight).toBe(collapsedHeight); // EXACT — no residual height
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// "No second parse, no second highlight pass, no second copy of the block" (tasks.md 6.1)
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe('expanding shows the full, ALREADY-highlighted content — no re-highlight', () => {
  it('the tokenize call count stays at 1 across a collapse/expand/collapse cycle', async () => {
    const counter = { calls: 0 };
    const { shadow } = directHost(
      codeBlock('javascript', CODE_COLLAPSE_LINE_THRESHOLD + 1),
      spyingLoader(counter),
    );
    const wrapper = await rendered(shadow);
    expect(counter.calls).toBe(1); // the initial highlight

    const control = wrapper.querySelector<HTMLButtonElement>(CONTROL_SELECTOR);
    const preBeforeToggle = wrapper.querySelector('pre.shiki');
    if (!control || !preBeforeToggle) throw new Error('expected the control and the highlighted pre');

    control.click(); // expand
    control.click(); // collapse

    expect(counter.calls).toBe(1); // no additional tokenize call from either click
    // The STRONGER proof: it is the SAME node throughout, never rebuilt or duplicated.
    expect(wrapper.querySelector('pre.shiki')).toBe(preBeforeToggle);
    expect(wrapper.querySelectorAll('pre.shiki')).toHaveLength(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// ROW 19 — instant under prefers-reduced-motion, DOES animate without it (non-vacuous)
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe('row 19 — the collapse/expand transition respects prefers-reduced-motion', () => {
  it('the shipped CSS carries a transition on the collapsed pre, neutralised under reduced motion', async () => {
    const { READER_CSS } = await import('../../src/theme/readerCss');
    const anchor = '.peekover-code[data-code-state] pre.shiki{transition:';
    expect(READER_CSS).toContain(anchor);
    const block = READER_CSS.slice(READER_CSS.indexOf(anchor));

    expect(block).toMatch(
      /prefers-reduced-motion:\s*reduce\)\{[^}]*\.peekover-code\[data-code-state\][^{]*pre\.shiki\{transition:none\}/,
    );

    // CONTROL: the pattern really can fail — it does not match a block missing the neutraliser.
    expect(
      /prefers-reduced-motion:\s*reduce\)\{[^}]*\.peekover-code\[data-code-state\][^{]*pre\.shiki\{transition:none\}/.test(
        '.peekover-code[data-code-state] pre.shiki{transition:max-height 1ms}',
      ),
    ).toBe(false);
  });
});

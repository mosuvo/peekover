// Systemic, page-wide failure modes §3.9's own two remaining rows name — the failures group 4's
// per-block tests (`codeRender.browser.test.ts`, task 4.2) cannot reach because they exercise a
// single fence at a time. This file is task 7.1's own (total engine-load failure) and grows 7.2's
// (theme-selection failure) beside it later, mirroring 4.2/4.4's one-file-per-failure-class shape.
//
// ── WHY THIS IS ITS OWN FILE, NOT A FEW MORE `it`s IN codeRender.browser.test.ts ─────────────────
//
// `codeRender.browser.test.ts` already has an "engine-load failure" case (task 4.2) proving the
// BEHAVIOR — every fence on a two-fence document stays plain — by injecting a rejecting loader.
// What it does NOT prove is WHICH guard makes that true: `highlightFences`'s per-fence `try`/`catch`
// (the loop body) never even runs when `loadCodeEngine` itself rejects, because the rejection is
// caught by the OUTER `try` around `await loadCodeEngine(...)` before the loop starts — 4.2's own
// revert-and-fail (removing the per-fence catch) says nothing about that outer guard. This task
// isolates it with its own dedicated ablation (tasks.md 7.1's own text).

import { describe, it, expect, vi, afterEach } from 'vitest';
import { mount } from '../../src/render/mount';
import { enhanceCode } from '../../src/render/codeEnhancer';
import { CODE_STATE_ATTR, CODE_WRAPPER_CLASS } from '../../src/render/codeView';
import type { CodeEngineModule } from '../../src/render/codeEngine';

const WRAPPER_SELECTOR = `div.${CODE_WRAPPER_CLASS}`;

const DOC =
  '# Code document\n\n' +
  'Paragraph before the code block, so page-intactness means more than one fence surviving.\n\n' +
  '```javascript\nfunction add(a, b) {\n  return a + b;\n}\n```\n\n' +
  '```python\ndef add(a, b):\n    return a + b\n```\n\n' +
  'Paragraph after the code block, likewise real text in the reading column.\n';

const cleanup: HTMLElement[] = [];
afterEach(() => {
  for (const el of cleanup.splice(0)) el.remove();
});

/** A host enhanced directly, so a test can inject `EnhanceOptions` — the same seam
 *  `codeRender.browser.test.ts`'s `directHost` uses for exactly this purpose. */
function directHost(markdown: string, options?: Parameters<typeof enhanceCode>[1]): ShadowRoot {
  const host = document.createElement('div');
  document.body.appendChild(host);
  cleanup.push(host);
  mount(markdown, host, { contained: true });
  enhanceCode(host, options);
  if (!host.shadowRoot) throw new Error('mount produced no shadow root');
  return host.shadowRoot;
}

/** Poll until every predicate holds or the timeout elapses — `codeRender.browser.test.ts`'s
 *  `settled`, mirrored. */
async function settled(check: () => void): Promise<void> {
  await vi.waitFor(check, { timeout: 5000, interval: 20 });
}

describe('7.1 — total engine-load failure, page-wide (§3.9)', () => {
  it('every fence stays plain and readable, and the reading column around them stays intact', async () => {
    const loader = vi.fn<() => Promise<CodeEngineModule>>(() => Promise.reject(new Error('boom')));
    const shadow = directHost(DOC, { loader });

    const wrappers = Array.from(shadow.querySelectorAll<HTMLElement>(WRAPPER_SELECTOR));
    expect(wrappers).toHaveLength(2);
    // The revert-and-fail signature lives HERE: with the top-level guard removed, `loadCodeEngine`'s
    // rejection is never caught, `markCodeFailed` is never called, and every wrapper is stuck at
    // `pending` forever — this assertion times out rather than passing.
    for (const wrapper of wrappers) {
      await settled(() => expect(wrapper.getAttribute(CODE_STATE_ATTR)).toBe('failed'));
    }
    expect(shadow.querySelectorAll('pre.shiki')).toHaveLength(0); // never a highlighted sibling

    // AGENTS.md #5 — no blank/broken state: the retained source stays visible and readable...
    const pres = Array.from(shadow.querySelectorAll<HTMLElement>('pre[data-code]'));
    expect(pres).toHaveLength(2);
    for (const pre of pres) {
      expect(getComputedStyle(pre).display).not.toBe('none');
      expect(pre.textContent?.length ?? 0).toBeGreaterThan(0);
    }
    // ...and PAGE-WIDE, not just the fences: the surrounding reading column is untouched, proving
    // this is a "reader stays intact" claim, not merely a "these two elements survived" claim.
    const text = shadow.textContent ?? '';
    expect(text).toContain('Paragraph before the code block');
    expect(text).toContain('Paragraph after the code block');

    // One load attempt total, never one per fence — the failure is document-wide, decided once.
    expect(loader).toHaveBeenCalledTimes(1);
  });
});

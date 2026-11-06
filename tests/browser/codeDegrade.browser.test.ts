// Systemic, page-wide failure modes §3.9's own two remaining rows name — the failures group 4's
// per-block tests (`codeRender.browser.test.ts`, task 4.2) cannot reach because they exercise a
// single fence at a time. This file is task 7.1's own (total engine-load failure) and grows 7.2's
// (theme-selection failure) beside it here, mirroring 4.2/4.4's one-file-per-failure-class shape.
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
//
// ── 7.2: EMPTY PRODUCTION DIFF — THE SELECTION-LEVEL GUARD ALREADY EXISTS ─────────────────────
//
// tasks.md 7.2 distinguishes itself from 4.2's per-fence theme-resolution proof by WHERE the bad
// theme id comes from — the PERSISTED `settings.codeTheme`, not an injected `EnhanceOptions.theme`
// override — not by needing a DIFFERENT handling mechanism. `highlightFences`'s existing per-fence
// `try`/`catch` around `tokenizeAndAdopt` (task 4.2) already catches an unresolvable theme exactly
// like an unresolvable language (`codeEngine.ts`'s own module header: one failure surface for
// "unknown key" and "tokenize genuinely failed" alike), and since `enhanceCode` passes the SAME
// `theme` string to every pair (`options.theme ?? currentSettings().codeTheme`), a bad persisted
// value fails every fence identically — already page-wide, already `markCodeFailed`'s plain
// retained-`<pre>` state. Task 5.2 already proved this at the jsdom level
// (`codeEnhancer.test.ts`'s "falls back to settings.codeTheme when no override is passed" case,
// `saveSettings({ codeTheme: 'not-a-real-theme-id' })` → `failed`) — that test's own comment is
// explicit that a SILENT fallback to a default theme was deliberately rejected: *"A hard-coded
// fallback would have rendered fine; only a genuine settings read can fail here."* So `codeEnhancer.ts`
// carries an EMPTY diff for this task (the same empty-diff outcome 7.1 recorded) — what jsdom
// cannot prove is the REAL browser claim tasks.md 7.2's Verify line makes (never an unstyled
// flash, never a thrown error visible to the user, across every block, in a real engine), which is
// this file's job, mirroring 7.1's own case immediately below but driving the failure through
// `saveSettings` instead of an injected loader.
//
// ── 013 TASK 7.3a: THE STALE SAVED ID NOW DRAWS THE DEFAULT ───────────────────────────────────────
//
// The paragraph above is 009's. Since 013 task 5.8 "the reader's default presentation" for code (009 tasks.md
// 7.2's own words) is the Peekover theme, not plain code; 7.3a (the human's direction, after 7.2a removed
// aurora-x) makes a saved id this build does not ship draw it — `enhanceCode` passes
// `shippedCodeTheme(currentSettings().codeTheme)`. The 7.2 case below now proves that, page-wide. A theme that
// resolves but fails to APPLY still leaves its block plain: 4.2's per-fence override case in
// `codeRender.browser.test.ts` (an `EnhanceOptions.theme` id is not mapped).

import { describe, it, expect, vi, afterEach } from 'vitest';
import { mount } from '../../src/render/mount';
import { enhanceCode, resetCodeHostsForTest } from '../../src/render/codeEnhancer';
import { CODE_STATE_ATTR, CODE_WRAPPER_CLASS } from '../../src/render/codeView';
import { saveSettings, resetSettingsSeamForTest } from '../../src/settings/settingsSeam';
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

describe('7.2 — theme-apply failure at the selection level, page-wide (§3.9)', () => {
  afterEach(() => {
    resetSettingsSeamForTest();
    resetCodeHostsForTest();
  });

  it('an unresolvable PERSISTED codeTheme falls back to the default presentation — the Peekover theme — on every block, page intact (013 7.3a)', async () => {
    saveSettings({ codeTheme: 'not-a-real-theme-id' }); // invalid on purpose — a stale/corrupted value
    // No `theme` override, no injected `loader` — production's own call shape (`enhanceCode(host)`),
    // so the engine loads for real and the id is read from the SELECTION (settings), never a
    // per-fence override (that's 4.2's own, already-distinct, test).
    const shadow = directHost(DOC);

    const wrappers = Array.from(shadow.querySelectorAll<HTMLElement>(WRAPPER_SELECTOR));
    expect(wrappers).toHaveLength(2);
    // Settled either way, then read: without the fallback every block reads `failed` (left plain).
    for (const wrapper of wrappers) {
      await settled(() => expect(wrapper.getAttribute(CODE_STATE_ATTR)).not.toBe('pending'));
      expect(wrapper.getAttribute(CODE_STATE_ATTR)).toBe('rendered');
    }
    // Every block in the Peekover theme — drawn from the tokens, never an unstyled flash.
    const highlighted = Array.from(shadow.querySelectorAll<HTMLElement>('pre.shiki'));
    expect(highlighted).toHaveLength(2);
    for (const pre of highlighted) {
      expect(pre.style.backgroundColor).toBe('var(--code-bg)');
      expect(pre.textContent?.length ?? 0).toBeGreaterThan(0);
    }
    // ...and PAGE-WIDE, not just the fences: the surrounding reading column is untouched.
    const text = shadow.textContent ?? '';
    expect(text).toContain('Paragraph before the code block');
    expect(text).toContain('Paragraph after the code block');
  });
});

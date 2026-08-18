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

import { describe, it, expect, vi, afterEach } from 'vitest';
import { mount } from './mount';
import {
  CODE_FENCE_SELECTOR,
  codeFencesIn,
  enhanceCode,
  parseLineRanges,
  reapplyCodeTheme,
  resetCodeHostsForTest,
} from './codeEnhancer';
import { CODE_FENCE_SELECTOR as ENGINE_FENCE_SELECTOR, type CodeEngineModule } from './codeEngine';
import { CODE_STATE_ATTR, CODE_WRAPPER_CLASS, markCodeRendered } from './codeView';
import { saveSettings, resetSettingsSeamForTest } from '../settings/settingsSeam';

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

  it('RE-ASSERTED (4.5): the synchronous return survives a watch-style repeated re-render, not just first paint', () => {
    // watchController.ts:422 times the WHOLE synchronous render block on EVERY re-render to price
    // the next cost-proportional cooldown — not only the first paint. `readerPane.ts:205` calls
    // `enhanceCode` once per file open; `appShell.ts:163`'s watch closure calls it again on every
    // disk change, through the identical `mount -> enhanceDiagrams -> enhanceTables -> enhanceCode`
    // shape at both sites. A fixture spanning both call sites therefore has to prove the property
    // survives a SECOND, watch-triggered call into an already-mounted host — not merely one
    // isolated call, which is all the assertion above (4.1's own, unchanged) ever exercised, and
    // which predates 4.2's toolbar build and 4.3/4.4's later additions to what now runs inside this
    // same synchronous block. A watch that accidentally went async on its second render would
    // corrupt the cooldown pricing silently; this is the property that would catch it.
    const { host, shadow } = mountedHost(fence('javascript', 'const a = 1;'));

    const firstReturn: unknown = enhanceCode(host);
    expect(firstReturn).toBeUndefined();
    expect(firstReturn).not.toBeInstanceOf(Promise);
    expect(shadow.querySelectorAll(WRAPPER_SELECTOR)).toHaveLength(1);

    // A watch-triggered re-render: the file changed on disk, mount() replaces the shadow tree's
    // content wholesale (never reusing the first render's committed state), and the real call sites
    // run their enhancers again over the fresh document.
    mount(fence('python', 'a = 1'), host, { contained: true });
    expect(shadow.querySelectorAll(WRAPPER_SELECTOR)).toHaveLength(0); // pre-state, again

    const secondReturn: unknown = enhanceCode(host);
    expect(secondReturn).toBeUndefined();
    expect(secondReturn).not.toBeInstanceOf(Promise);
    // Same synchronous commitment on the SECOND call — the one watchController.ts:422 actually
    // times for every subsequent re-render, not merely the first.
    expect(shadow.querySelectorAll(WRAPPER_SELECTOR)).toHaveLength(1);
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

describe("parseLineRanges — D-8's consumer, task 4.3's toolbar (line-highlighting)", () => {
  // Pure function; the DOM-application half (the highlight class + aria-label on the matching
  // `.line` span) is D-4's async body, real-engine only — asserted in
  // tests/browser/codeToolbar.browser.test.ts. What's under test here is the parse itself.

  it('tasks.md 4.3\'s own four cases, verbatim', () => {
    expect(parseLineRanges('{2,4}')).toEqual([2, 4]);
    expect(parseLineRanges('{1-3,7}')).toEqual([1, 2, 3, 7]);
    expect(parseLineRanges('not a range at all')).toEqual([]); // malformed
    expect(parseLineRanges(undefined)).toEqual([]); // absent
  });

  it('never throws on adversarial input', () => {
    const adversarial = [
      '', '{}', '{,}', '{0}', '{-1}', '{5-2}', '{2,,4}', '{2-}', '{-4}', '{4,4,4}',
      '{2-4,3}', '  {2,4}  ', '{2, 4}', '{999999999999999999}', '{2-4', '2,4}', null,
      '{<script>}', '{2}extra', 'javascript', '{NaN}', '{2.5}',
    ];
    for (const input of adversarial) {
      expect(() => parseLineRanges(input)).not.toThrow();
    }
  });

  it('deduplicates and sorts regardless of overlap or write order', () => {
    expect(parseLineRanges('{4,2,4}')).toEqual([2, 4]);
    expect(parseLineRanges('{2-4,3}')).toEqual([2, 3, 4]);
  });

  it('rejects an inverted or non-positive range rather than silently producing nothing / negative lines', () => {
    expect(parseLineRanges('{5-2}')).toEqual([]);
    expect(parseLineRanges('{0}')).toEqual([]);
    expect(parseLineRanges('{-1}')).toEqual([]);
  });

  it('a token missing the surrounding braces is malformed, not a bare range', () => {
    expect(parseLineRanges('2,4')).toEqual([]);
  });

  it('a preposterously wide range is rejected rather than expanded (hang guard)', () => {
    expect(parseLineRanges('{1-99999999999}')).toEqual([]);
    // A span at the bound still expands normally — the guard rejects only what's wider than it.
    expect(parseLineRanges('{1-3}')).toEqual([1, 2, 3]);
  });
});

describe("D-4's async body — real engine, real jsdom (task 4.2; Cr+Fx proof lives in tests/browser)", () => {
  // The JS-regex engine has no DOM/WASM dependency, so — unlike `diagramEnhancer.test.ts`, which
  // must mock mermaid entirely — this suite runs Shiki FOR REAL under jsdom. What jsdom cannot
  // answer (computed style hiding the retained pre, real theme-data colours painting) is the
  // browser suite's job; what is under test here is the STATE MACHINE: which fences end up
  // `rendered` vs `failed`, and that failure never crosses a fence boundary.

  it('highlights a real fence to `rendered`, with token spans carrying colour, no innerHTML used', async () => {
    const { host, shadow } = mountedHost(fence('javascript', 'const a = 1;'));
    enhanceCode(host);

    const wrapper = shadow.querySelector<HTMLElement>(WRAPPER_SELECTOR);
    if (!wrapper) throw new Error('expected a wrapper');
    await vi.waitFor(() => expect(wrapper.getAttribute(CODE_STATE_ATTR)).toBe('rendered'));

    const highlighted = wrapper.querySelector('pre.shiki');
    if (!highlighted) throw new Error('expected the highlighted sibling');
    const spans = highlighted.querySelectorAll('code > span.line > span');
    expect(spans.length).toBeGreaterThan(0);
    // At least one token carries an inline colour from Shiki's own theme data (D-4).
    expect(Array.from(spans).some((s) => (s as HTMLElement).style.color !== '')).toBe(true);
    // The reassembled highlighted text matches the source — no token dropped or duplicated.
    expect(highlighted.textContent).toBe('const a = 1;\n');
  });

  it('per-fence isolation: an unknown language fails ALONE, a valid one beside it still renders', async () => {
    const { host, shadow } = mountedHost(
      fence('notarealanguage', 'whatever this is') + '\n' + fence('javascript', 'const a = 1;'),
    );
    enhanceCode(host);

    const wrappers = shadow.querySelectorAll<HTMLElement>(WRAPPER_SELECTOR);
    expect(wrappers).toHaveLength(2);
    const [badWrapper, goodWrapper] = Array.from(wrappers);

    await vi.waitFor(() => expect(goodWrapper.getAttribute(CODE_STATE_ATTR)).toBe('rendered'));
    // The bad fence settled to `failed`, never `rendered` — and its retained pre is untouched.
    expect(badWrapper.getAttribute(CODE_STATE_ATTR)).toBe('failed');
    expect(badWrapper.querySelector('pre.shiki')).toBeNull();
    expect(badWrapper.querySelector('pre')?.textContent).toBe('whatever this is\n');
  });

  it('theme-apply failure: an id no bundled theme resolves falls back to the retained pre, never an unstyled flash', async () => {
    const { host, shadow } = mountedHost(fence('javascript', 'const a = 1;'));
    enhanceCode(host, { theme: 'not-a-real-theme-id' });

    const wrapper = shadow.querySelector<HTMLElement>(WRAPPER_SELECTOR);
    const pre = shadow.querySelector<HTMLElement>('pre[data-code]');
    if (!wrapper || !pre) throw new Error('expected the enhanced pair');

    await vi.waitFor(() => expect(wrapper.getAttribute(CODE_STATE_ATTR)).toBe('failed'));
    expect(pre.getAttribute(CODE_STATE_ATTR)).toBe('failed');
    expect(wrapper.querySelector('pre.shiki')).toBeNull(); // never an unstyled highlighted sibling
    expect(pre.textContent).toContain('const a = 1;'); // the retained pre is what the user sees
  });

  it('whole-engine failure: a rejecting loader leaves EVERY fence plain, none reach `rendered`', async () => {
    const { host, shadow } = mountedHost(
      fence('javascript', 'const a = 1;') + '\n' + fence('python', 'a = 1'),
    );
    const loader = vi.fn<() => Promise<CodeEngineModule>>(() => Promise.reject(new Error('boom')));
    enhanceCode(host, { loader });

    const wrappers = shadow.querySelectorAll<HTMLElement>(WRAPPER_SELECTOR);
    expect(wrappers).toHaveLength(2);
    for (const wrapper of Array.from(wrappers)) {
      await vi.waitFor(() => expect(wrapper.getAttribute(CODE_STATE_ATTR)).toBe('failed'));
    }
    expect(loader).toHaveBeenCalledTimes(1);
    expect(shadow.querySelectorAll('pre.shiki')).toHaveLength(0);
  });

  it('CONTROL: a fenced document with no engine call at all (never awaited) stays `pending` at return', () => {
    // Re-confirms 4.1's own property survives 4.2's addition: nothing in the highlighted state
    // exists synchronously, regardless of what the async body will eventually do.
    const { host, shadow } = mountedHost(fence('javascript', 'const a = 1;'));
    enhanceCode(host);
    const wrapper = shadow.querySelector<HTMLElement>(WRAPPER_SELECTOR);
    expect(wrapper?.getAttribute(CODE_STATE_ATTR)).toBe('pending');
  });
});

describe('task 5.2 — settings wiring + reapplyCodeTheme', () => {
  afterEach(() => {
    resetSettingsSeamForTest();
    resetCodeHostsForTest();
  });

  it('precedence: options.theme still wins over a VALID settings.codeTheme (4.2\'s own test invariant, unchanged)', async () => {
    saveSettings({ codeTheme: 'monokai' }); // a valid, resolvable theme
    const { host, shadow } = mountedHost(fence('javascript', 'const a = 1;'));
    enhanceCode(host, { theme: 'not-a-real-theme-id' }); // the override should still be used

    const wrapper = shadow.querySelector<HTMLElement>(WRAPPER_SELECTOR);
    if (!wrapper) throw new Error('expected a wrapper');
    // If settings.codeTheme won, this would render successfully instead — the failure IS the proof.
    await vi.waitFor(() => expect(wrapper.getAttribute(CODE_STATE_ATTR)).toBe('failed'));
  });

  it('falls back to settings.codeTheme when no override is passed — a real read, not a hard-coded literal', async () => {
    saveSettings({ codeTheme: 'not-a-real-theme-id' }); // invalid on purpose
    const { host, shadow } = mountedHost(fence('javascript', 'const a = 1;'));
    enhanceCode(host); // no options at all — production's own call shape

    const wrapper = shadow.querySelector<HTMLElement>(WRAPPER_SELECTOR);
    if (!wrapper) throw new Error('expected a wrapper');
    // A hard-coded fallback would have rendered fine; only a genuine settings read can fail here.
    await vi.waitFor(() => expect(wrapper.getAttribute(CODE_STATE_ATTR)).toBe('failed'));
  });

  it('reapplyCodeTheme swaps the highlighted content in place — never a second .shiki sibling', async () => {
    const { host, shadow } = mountedHost(fence('javascript', 'const a = 1;'));
    enhanceCode(host);
    const wrapper = shadow.querySelector<HTMLElement>(WRAPPER_SELECTOR);
    if (!wrapper) throw new Error('expected a wrapper');
    await vi.waitFor(() => expect(wrapper.getAttribute(CODE_STATE_ATTR)).toBe('rendered'));

    await reapplyCodeTheme('monokai');

    expect(wrapper.querySelectorAll('pre.shiki')).toHaveLength(1); // swapped, never appended
    expect(wrapper.querySelector('pre.shiki')?.textContent).toBe('const a = 1;\n'); // no content lost
    // The retained source pre is still exactly one, untouched by the swap.
    expect(wrapper.querySelectorAll(`pre[${CODE_STATE_ATTR}]`)).toHaveLength(1);
  });

  it('per-pair isolation on reapply: a corrupted fence keeps its PREVIOUS render, a healthy one beside it still updates', async () => {
    const { host, shadow } = mountedHost(
      fence('javascript', 'const a = 1;') + '\n' + fence('python', 'a = 1'),
    );
    enhanceCode(host);
    const wrappers = shadow.querySelectorAll<HTMLElement>(WRAPPER_SELECTOR);
    await vi.waitFor(() => {
      for (const w of Array.from(wrappers)) expect(w.getAttribute(CODE_STATE_ATTR)).toBe('rendered');
    });
    const [badWrapper, goodWrapper] = Array.from(wrappers);
    const badPreviousHighlighted = badWrapper.querySelector('pre.shiki');
    const badSourceCode = badWrapper.querySelector(`pre[${CODE_STATE_ATTR}] code`);
    if (!badSourceCode) throw new Error('expected the retained source code element');
    // Corrupt ONE fence's language between render and reapply — codeToTokens raises on an unresolved
    // lang (module header), the same mechanism the initial-render isolation test above exercises.
    badSourceCode.className = 'language-not-a-real-language';

    await reapplyCodeTheme('monokai');

    // The corrupted pair is untouched: same node, same state — never blanked, never marked failed.
    expect(badWrapper.querySelector('pre.shiki')).toBe(badPreviousHighlighted);
    expect(badWrapper.getAttribute(CODE_STATE_ATTR)).toBe('rendered');
    // The healthy pair beside it still updated — isolation, not a whole-batch abort.
    const goodSpans = goodWrapper.querySelectorAll('pre.shiki code > span.line > span');
    expect(Array.from(goodSpans).some((s) => (s as HTMLElement).style.color !== '')).toBe(true);
  });

  it('a host with nothing rendered yet is a no-op — no engine load, nothing to swap', async () => {
    const { host } = mountedHost(fence('javascript', 'const a = 1;'));
    enhanceCode(host); // registers the host but nothing is `rendered` yet (still `pending`)
    await expect(reapplyCodeTheme('monokai')).resolves.toBeUndefined();
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

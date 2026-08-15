// D-6's structure in a REAL ENGINE, Chromium AND Firefox (task 4.1).
//
// Three of the four things asserted here are structurally beyond jsdom, which is why this file
// exists alongside `src/render/codeEnhancer.test.ts` rather than duplicating it:
//
//   • WHETHER THE RETAINED SOURCE IS ACTUALLY HIDDEN ONCE RENDERED. D-6's whole claim is that one
//     attribute plus one CSS rule swaps the visible view. jsdom applies no stylesheet, so
//     `data-code="rendered"` there is a string on an element and nothing more. Only an engine
//     computing style can say the user stopped seeing the retained `<pre>` — and, just as
//     importantly, that the node is STILL THERE while invisible, which is the property every §3.9
//     failure path depends on.
//
//   • §3.11 ROW 4 — AND IT INVERTS. Four sibling suites assert that a piece of reader chrome is
//     OUTSIDE `.peekover-reader` (the toggle pill, the TOC rail, the diff affordance, the net
//     indicator are all siblings of the reading column, committed by mount() beside it). The code
//     wrapper is the opposite case: it belongs to the DOCUMENT, not to the chrome, so it must be
//     INSIDE the column. Transcribing the sibling suites' direction unexamined produces a test that
//     passes on a wrong implementation. Verified red by inserting the wrapper outside the column
//     instead — at which point the golden diff stays EMPTY, because none of this touches the
//     committed `sanitize(parse(source))` string. That is precisely why the assertion is written.
//
//   • ROWS 2 + 3 — the two-surface comparison, and whether the wrapper is genuinely a real,
//     positioned box (not `display:none` by accident) before anything highlights it.
//
// No engine is loaded here: task 4.1 is the scaffolding and the tokenize/adopt path is 4.2's, so
// the `rendered` state is reached by calling `markCodeRendered` with a stand-in node. What is under
// test is the STRUCTURE and its CSS contract, not Shiki.

import { describe, it, expect, vi, afterEach } from 'vitest';
import { createReaderPane } from '../../src/app/readerPane';
import { mount } from '../../src/render/mount';
import { enhanceCode } from '../../src/render/codeEnhancer';
import { CODE_STATE_ATTR, CODE_WRAPPER_CLASS, markCodeRendered } from '../../src/render/codeView';
import type { CodeEngineModule } from '../../src/render/codeEngine';

const WRAPPER_SELECTOR = `div.${CODE_WRAPPER_CLASS}`;

const DOC =
  '# Code document\n\n' +
  'Paragraph before the code block, long enough to occupy the column and give the layout a ' +
  'real box of text around the fence.\n\n' +
  '```javascript\nfunction add(a, b) {\n  return a + b;\n}\n```\n\n' +
  'Paragraph after the code block, likewise real text in the reading column.\n';

const cleanup: HTMLElement[] = [];
afterEach(() => {
  for (const el of cleanup.splice(0)) el.remove();
});

/** The APP-PAGE surface, driven through the production pane — `createReaderPane` -> select() ->
 *  mount() -> D-5's first call site. Nothing here calls the enhancer directly. */
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
 *  does — no `contained`, no enhancer, no post-mount pass of any kind. */
function contentScriptReader(markdown = DOC): ShadowRoot {
  const host = document.createElement('peekover-root');
  document.body.appendChild(host);
  cleanup.push(host);
  mount(markdown, host);
  if (!host.shadowRoot) throw new Error('mount produced no shadow root');
  return host.shadowRoot;
}

/** A host enhanced DIRECTLY, bypassing `readerPane.ts`, so a test can inject `EnhanceOptions`
 *  (a rejecting loader, a theme id no bundled theme resolves) — the same seam `codeEnhancer.ts`'s
 *  own D-5-parity test below uses to reach the watch-render closure's shape without its wiring. */
function directHost(markdown: string, options?: Parameters<typeof enhanceCode>[1]): ShadowRoot {
  const host = document.createElement('div');
  document.body.appendChild(host);
  cleanup.push(host);
  mount(markdown, host, { contained: true });
  enhanceCode(host, options);
  if (!host.shadowRoot) throw new Error('mount produced no shadow root');
  return host.shadowRoot;
}

/** Poll until every predicate holds or the timeout elapses — `vi.waitFor` under a real engine. */
async function settled(check: () => void): Promise<void> {
  await vi.waitFor(check, { timeout: 5000, interval: 20 });
}

describe('the app page grows D-6 structure (row 4 — INVERTED)', () => {
  it('puts the wrapper INSIDE .peekover-reader, wrapping the retained pre', async () => {
    const shadow = await appPageReader();

    const column = shadow.querySelector('.peekover-reader');
    const wrapper = shadow.querySelector<HTMLElement>(WRAPPER_SELECTOR);
    const pre = shadow.querySelector('pre[data-code]');
    if (!column || !wrapper || !pre) throw new Error('expected an enhanced fence');

    // THE INVERTED ASSERTION. Not a sibling of the column like every other piece of reader
    // furniture — a child of it, and the retained pre is a child of the wrapper (D-6).
    expect(column.contains(wrapper)).toBe(true);
    expect(wrapper.parentElement).not.toBe(shadow);
    expect(wrapper.contains(pre)).toBe(true);
    expect(pre.parentElement).toBe(wrapper);
  });

  it('leaves the retained source VISIBLE while pending — the degraded state is the default', async () => {
    const shadow = await appPageReader();
    const pre = shadow.querySelector<HTMLElement>('pre[data-code]');
    const wrapper = shadow.querySelector<HTMLElement>(WRAPPER_SELECTOR);
    if (!pre || !wrapper) throw new Error('expected the enhanced pair');

    expect(getComputedStyle(pre).display).not.toBe('none');
    expect(pre.getBoundingClientRect().height).toBeGreaterThan(0);
    expect(pre.textContent).toContain('function add');

    // Unlike diagramView.ts's empty placeholder, the wrapper is never aria-hidden — it already
    // holds real, readable content from the moment it is built (codeView.ts's module header).
    expect(wrapper.hasAttribute('aria-hidden')).toBe(false);
    expect(getComputedStyle(wrapper).position).toBe('relative');
  });
});

describe('after success the retained pre is PRESENT-BUT-HIDDEN (both halves)', () => {
  it('computes display:none on the retained pre while the node stays in the tree with its source', async () => {
    const shadow = await appPageReader();
    const pre = shadow.querySelector<HTMLElement>('pre[data-code]');
    const wrapper = shadow.querySelector<HTMLElement>(WRAPPER_SELECTOR);
    if (!pre || !wrapper) throw new Error('expected the enhanced pair');

    // Control: it is visible BEFORE the flip, so `none` afterwards is caused by the flip and not
    // by the fence having been invisible all along.
    expect(getComputedStyle(pre).display).not.toBe('none');

    const highlighted = document.createElement('pre');
    highlighted.className = 'shiki';
    highlighted.textContent = 'function add(a, b) { return a + b; }';
    markCodeRendered(pre, wrapper, highlighted);

    // HALF ONE — hidden. The CSS rule, in a real engine, over a real shadow root.
    expect(getComputedStyle(pre).display).toBe('none');
    expect(pre.getBoundingClientRect().height).toBe(0);

    // HALF TWO — present. Still connected, still holding its source text, still queryable. This is
    // what every §3.9 failure path re-derives from.
    expect(pre.isConnected).toBe(true);
    expect(wrapper.contains(pre)).toBe(true);
    expect(pre.textContent).toContain('function add');

    // And the highlighted sibling took its place, visibly.
    expect(getComputedStyle(highlighted).display).not.toBe('none');
    expect(wrapper.contains(highlighted)).toBe(true);
  });
});

describe('rows 2 + 3 — the two-surface comparison', () => {
  // THE GATE IS THE MODULE GRAPH, NOT A RUNTIME CHECK. The content script reaches `mount()` and
  // stops; the enhancer is invoked only from D-5's two app-page sites. Red-first procedure for this
  // pair: move `enhanceCode` INTO `mount()` — the one function both surfaces share — and exactly
  // the content-script assertion below goes red while the app-page one stays green. That is the
  // accident being guarded against, and it is the only edit that produces it.

  it('the content-script reader leaves a code fence exactly as sanitize committed it', () => {
    const shadow = contentScriptReader();

    expect(shadow.querySelectorAll(WRAPPER_SELECTOR)).toHaveLength(0);
    expect(shadow.querySelectorAll(`[${CODE_STATE_ATTR}]`)).toHaveLength(0);

    // No affordance and no note anywhere on this surface.
    expect(shadow.querySelector('.peekover-code')).toBeNull();

    // CONTROL: the fence is genuinely there and genuinely language-classed — so the zeros above are
    // a gate holding, not an input that never arrived.
    const code = shadow.querySelector('pre > code.language-javascript');
    expect(code).not.toBeNull();
    expect(code?.textContent).toContain('function add');
    expect(getComputedStyle(code!.parentElement!).display).not.toBe('none');
  });

  it('the app page grows one from the SAME markdown — the surfaces differ, the input does not', async () => {
    const contentShadow = contentScriptReader();
    const appShadow = await appPageReader();

    expect(contentShadow.querySelectorAll(WRAPPER_SELECTOR)).toHaveLength(0);
    expect(appShadow.querySelectorAll(WRAPPER_SELECTOR)).toHaveLength(1);

    // Same fence text on both surfaces: the only difference is who called the enhancer.
    const contentSrc = contentShadow.querySelector('pre > code.language-javascript')?.textContent;
    const appSrc = appShadow.querySelector('pre > code.language-javascript')?.textContent;
    expect(contentSrc).toBe(appSrc);
  });
});

describe('D-5 parity — both call sites produce the same structure', () => {
  // Site 1 is `readerPane.ts`, driven above through the production pane. Site 2 is the
  // `renderWithEnhancements` closure `appShell.ts` hands `createWatchController`, whose body is
  // `mount(...)` followed by `enhanceDiagrams`, `enhanceTables`, `enhanceCode`. Reproduced here
  // against the same markdown to prove the two paths converge on one structure rather than two
  // divergent copies — 007 D-12's exact bug class, one surface over. The PRODUCTION watch
  // re-render path is a later task's; this proves the SHAPE both sites leave behind, independently
  // of each other (neither test above exercises this site, and this test does not exercise
  // `readerPane.ts`'s own selection flow).
  it('the watch render closure yields the structure readerPane yields', async () => {
    const fromPane = await appPageReader();

    const host = document.createElement('div');
    document.body.appendChild(host);
    cleanup.push(host);
    mount(DOC, host, { contained: true, preserveReading: true });
    enhanceCode(host);
    const fromWatch = host.shadowRoot;
    if (!fromWatch) throw new Error('expected a mounted host');

    for (const shadow of [fromPane, fromWatch]) {
      const wrapper = shadow.querySelector<HTMLElement>(WRAPPER_SELECTOR);
      const pre = shadow.querySelector('pre[data-code]');
      expect(wrapper).not.toBeNull();
      expect(pre).not.toBeNull();
      expect(wrapper!.contains(pre)).toBe(true);
      expect(pre!.getAttribute(CODE_STATE_ATTR)).toBe('pending');
      expect(wrapper!.getAttribute(CODE_STATE_ATTR)).toBe('pending');
      expect(shadow.querySelector('.peekover-reader')!.contains(wrapper!)).toBe(true);
    }
  });
});

describe("D-4's async body — real Shiki, real engine, both call sites (task 4.2)", () => {
  // What jsdom cannot answer and this suite does: whether a token's COLOUR actually computes on a
  // real engine (an inline `style.color` always "wins" in jsdom regardless of the stylesheet;
  // here it must win against `readerCss.ts`'s own inherited text colour), whether the retained
  // pre's `display:none` swap and the highlighted sibling's visibility are real layout facts, and
  // whether a hostile fixture survives a real browser's DOM round-trip byte-for-byte.

  it("a fence renders to highlighted spans carrying Shiki's own theme-data colours", async () => {
    const shadow = await appPageReader();
    const wrapper = shadow.querySelector<HTMLElement>(WRAPPER_SELECTOR);
    if (!wrapper) throw new Error('expected a wrapper');
    await settled(() => expect(wrapper.getAttribute(CODE_STATE_ATTR)).toBe('rendered'));

    const highlighted = wrapper.querySelector<HTMLElement>('pre.shiki');
    if (!highlighted) throw new Error('expected the highlighted sibling');
    expect(getComputedStyle(highlighted).display).not.toBe('none');

    const tokenSpans = Array.from(
      highlighted.querySelectorAll<HTMLElement>('code > span.line > span'),
    );
    expect(tokenSpans.length).toBeGreaterThan(0);
    const colours = new Set(tokenSpans.map((s) => getComputedStyle(s).color));
    expect(colours.size).toBeGreaterThan(0);
    for (const c of colours) expect(c).not.toBe('');
  });

  it('per-fence isolation: an unknown language fails alone, the fence beside it still renders', async () => {
    const shadow = directHost(
      '```notarealanguage\nwhatever this is\n```\n\n```javascript\nconst a = 1;\n```\n',
    );
    const wrappers = Array.from(shadow.querySelectorAll<HTMLElement>(WRAPPER_SELECTOR));
    expect(wrappers).toHaveLength(2);
    const [badWrapper, goodWrapper] = wrappers;

    await settled(() => expect(goodWrapper.getAttribute(CODE_STATE_ATTR)).toBe('rendered'));
    expect(badWrapper.getAttribute(CODE_STATE_ATTR)).toBe('failed');
    expect(badWrapper.querySelector('pre.shiki')).toBeNull();

    // The bad fence's retained pre is still the only visible thing — degradation is the default
    // state (§3.9), not an error the user is stopped by.
    const badPre = badWrapper.querySelector<HTMLElement>('pre');
    if (!badPre) throw new Error('expected the retained pre');
    expect(getComputedStyle(badPre).display).not.toBe('none');
  });

  it("the retained pre's textContent is byte-identical to a HOSTILE source (unicode, trailing whitespace, mixed line endings)", async () => {
    // CommonMark itself normalizes `\r\n`/`\r` to `\n` during preprocessing — upstream of this
    // task's own code, and true of every fence regardless of highlighting (confirmed empirically
    // this session: markdown-it's normalization runs before `parse()` returns). What D-6 actually
    // promises is that NOTHING DOWNSTREAM of that — this task's own tokenize/adopt path included —
    // touches the fence again, so the expectation is `parse()`'s own normalized text, not the raw
    // pre-parse literal.
    const HOSTILE = 'const é = "🎉";   \r\nconsole.log(é);\t\n\n';
    const NORMALIZED = HOSTILE.replace(/\r\n/g, '\n');
    const shadow = directHost('```javascript\n' + HOSTILE + '```\n');

    const pre = shadow.querySelector<HTMLElement>('pre[data-code]');
    if (!pre) throw new Error('expected the retained pre');
    // Asserted immediately — this property holds whether or not highlighting ever settles, because
    // D-6 never touches the retained node itself (module header).
    expect(pre.textContent).toBe(NORMALIZED);

    // CONTROL: this fence really does get attempted (so the identity above isn't free because
    // nothing ran) — wait for it to settle one way or the other, then re-assert.
    const wrapper = shadow.querySelector<HTMLElement>(WRAPPER_SELECTOR);
    if (!wrapper) throw new Error('expected a wrapper');
    await settled(() => expect(wrapper.getAttribute(CODE_STATE_ATTR)).not.toBe('pending'));
    expect(pre.textContent).toBe(NORMALIZED);
  });

  it('engine-load failure: EVERY fence on the page stays plain, the page stays intact', async () => {
    const loader = vi.fn<() => Promise<CodeEngineModule>>(() => Promise.reject(new Error('boom')));
    const shadow = directHost('```javascript\nconst a = 1;\n```\n\n```python\na = 1\n```\n', {
      loader,
    });
    const wrappers = Array.from(shadow.querySelectorAll<HTMLElement>(WRAPPER_SELECTOR));
    expect(wrappers).toHaveLength(2);
    for (const wrapper of wrappers) {
      await settled(() => expect(wrapper.getAttribute(CODE_STATE_ATTR)).toBe('failed'));
    }
    expect(shadow.querySelectorAll('pre.shiki')).toHaveLength(0);
    for (const pre of Array.from(shadow.querySelectorAll<HTMLElement>('pre[data-code]'))) {
      expect(getComputedStyle(pre).display).not.toBe('none');
    }
  });

  it('theme-apply failure: an id no bundled theme resolves falls back to the retained pre, never an unstyled flash', async () => {
    const shadow = directHost('```javascript\nconst a = 1;\n```\n', {
      theme: 'not-a-real-theme-id',
    });
    const wrapper = shadow.querySelector<HTMLElement>(WRAPPER_SELECTOR);
    const pre = shadow.querySelector<HTMLElement>('pre[data-code]');
    if (!wrapper || !pre) throw new Error('expected the enhanced pair');

    await settled(() => expect(wrapper.getAttribute(CODE_STATE_ATTR)).toBe('failed'));
    expect(wrapper.querySelector('pre.shiki')).toBeNull(); // never an unstyled highlighted sibling
    expect(getComputedStyle(pre).display).not.toBe('none');
    expect(pre.textContent).toContain('const a = 1;');
  });

  it('both call sites reach `rendered` — readerPane AND the watch render closure', async () => {
    const fromPane = await appPageReader();

    const host = document.createElement('div');
    document.body.appendChild(host);
    cleanup.push(host);
    mount(DOC, host, { contained: true, preserveReading: true });
    enhanceCode(host);
    const fromWatch = host.shadowRoot;
    if (!fromWatch) throw new Error('expected a mounted host');

    for (const shadow of [fromPane, fromWatch]) {
      const wrapper = shadow.querySelector<HTMLElement>(WRAPPER_SELECTOR);
      if (!wrapper) throw new Error('expected a wrapper');
      await settled(() => expect(wrapper.getAttribute(CODE_STATE_ATTR)).toBe('rendered'));
      expect(wrapper.querySelector('pre.shiki')).not.toBeNull();
    }
  });
});

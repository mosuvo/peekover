// codeToolbar — the per-fence toolbar's real-engine proof (task 4.3): copy-raw, line-numbers,
// line-highlighting (D-8's consumer), word-wrap, and D-7's per-render state. §3.11's audit rows
// 5, 8, 11, 14, 15, 16, 17, 18, 19, 20, and 24's own half are discharged here — see plan.md §3.11
// for the exact text each row demands; each describe block below is named after the row it proves.
//
// ── WHAT jsdom CANNOT ANSWER, AND WHY THIS FILE EXISTS BESIDE codeEnhancer.test.ts ────────────
//
// Layout (row 5/8's rects), real clipboard behaviour (row 11/20's copy), computed style under a
// real media-query emulation (row 19's reduced-motion transition) and real keyboard focus (row 16)
// are all beyond jsdom. What IS jsdom-testable (`parseLineRanges`'s pure parse) is unit-tested in
// `codeEnhancer.test.ts` instead — this file never re-proves that half.
//
// ── THE TOOLBAR'S STRUCTURAL MODEL, RESTATED FOR WHOEVER READS THIS FILE NEXT ─────────────────
//
// In-flow, the FIRST child of D-6's `.peekover-code` wrapper — `codeView.ts`'s `buildCodeToolbar`.
// Mirrors `tableTools.ts`'s toolbar, NOT `diagramView.ts`'s hover-revealed absolute corner group
// (§3.11's routing table routes rows 7/9/10 OUT for exactly this reason). So rows 5 and 8 below are
// asserted as REAL non-overlap, never "produced but not chosen" — the position is fully decided.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { page, cdp, userEvent } from 'vitest/browser';
import { mountAppShell, type AppStore } from '../../src/app/appShell';
import type { FolderSource, MarkdownFile } from '../../src/app/folderSource';
import { mount } from '../../src/render/mount';
import { enhanceCode } from '../../src/render/codeEnhancer';
import { resetDocIdentityForTest } from '../../src/render/docIdentity';
import { resetWatchRegistryForTest } from '../../src/watch/watchRegistry';
import { resetWatchControlsForTest } from '../../src/watch/watchControl';
import { resetThemeHostsForTest } from '../../src/theme/themeRegistry';
import { resetThemeControlsForTest } from '../../src/theme/themeControl';
import { resetDiffRegistryForTest } from '../../src/render/diffRegistry';
import { setThemeSetting, resetThemeWatchForTest } from '../../src/theme/reader';
import { editorSessionFor, teardownEditorShell } from '../../src/render/editorView';
import { backdropOf, inkOf, parseColor, ratioOver, TEXT_BAR } from './helpers/contrast';
import {
  CODE_STATE_ATTR,
  CODE_WRAPPER_CLASS,
  CODE_TOOLBAR_CLASS,
  CODE_LANG_CLASS,
  CODE_LINE_NUMBERS_CLASS,
  CODE_WRAP_CLASS,
  CODE_COPY_CLASS,
  CODE_STATUS_CLASS,
  CODE_COPY_STATE_ATTR,
  CODE_LINE_NUMBERS_ATTR,
  CODE_WRAP_ATTR,
  CODE_LINE_HIGHLIGHT_CLASS,
} from '../../src/render/codeView';

const WRAPPER_SELECTOR = `div.${CODE_WRAPPER_CLASS}`;
const TOOLBAR_SELECTOR = `div.${CODE_TOOLBAR_CLASS}`;
const LANG_SELECTOR = `.${CODE_LANG_CLASS}`;
const LINE_NUMBERS_SELECTOR = `button.${CODE_LINE_NUMBERS_CLASS}`;
const WRAP_SELECTOR = `button.${CODE_WRAP_CLASS}`;
const COPY_SELECTOR = `button.${CODE_COPY_CLASS}`;
const STATUS_SELECTOR = `.${CODE_STATUS_CLASS}`;

const fence = (lang: string, body: string, meta = ''): string =>
  '```' + lang + (meta ? ' ' + meta : '') + '\n' + body + '\n```\n';

// ── Harness — `codeRender.browser.test.ts`'s own shapes, re-implemented per this file (plan risk
// 6: no shared browser-test helper module exists) ──────────────────────────────────────────────

const cleanup: HTMLElement[] = [];
afterEach(() => {
  for (const el of cleanup.splice(0)) el.remove();
});

// ── THE FULL APP SHELL — rows 5 and 8 need real chrome (TOC rail, mode toggle) that the lighter
// `directHost` seam never wires. `mountAppShell`'s own shape, copied from `tablePlacement.browser.
// test.ts`/`agentBadge.browser.test.ts` rather than re-derived. ──────────────────────────────────

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

async function waitFor<T>(fn: () => T | null | undefined | false, tries = 400): Promise<T> {
  for (let i = 0; i < tries; i += 1) {
    const v = fn();
    if (v) return v as T;
    await sleep(20);
  }
  throw new Error('waitFor timed out');
}

const flush = (): Promise<void> =>
  new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));

function fakeStore(): AppStore {
  return {
    putFolder: async () => undefined,
    deleteFolder: async () => undefined,
    putRecent: async () => undefined,
  };
}

function sourceOf(files: MarkdownFile[]): FolderSource {
  return { name: 'notes', files, truncated: false, persistable: true };
}

function resetAppShellRegistries(): void {
  resetDocIdentityForTest();
  resetWatchRegistryForTest();
  resetWatchControlsForTest();
  resetThemeHostsForTest();
  resetThemeControlsForTest();
  resetDiffRegistryForTest();
}

/** The APP-PAGE surface, driven through the real folder-open gesture chain — real TOC rail, real
 *  mode toggle, real toolbar. `markdown` needs >= 2 headings, or `buildTocView` returns `null`
 *  (`tocView.ts`) and there is no rail for row 8 to clear. */
async function appPageReader(markdown: string): Promise<{ host: HTMLElement; shadow: ShadowRoot }> {
  resetAppShellRegistries();
  const container = document.createElement('div');
  document.body.appendChild(container);
  cleanup.push(container);
  const app = mountAppShell(container, {
    openFolder: async () => ({
      ok: true,
      source: sourceOf([{ path: 'doc.md', name: 'doc.md', read: async () => markdown }]),
    }),
    store: fakeStore(),
  });
  await app.openFolder();
  const btn = [
    ...container.querySelectorAll<HTMLButtonElement>('[role="treeitem"][data-kind="file"]'),
  ].find((b) => b.textContent === 'doc.md');
  if (!btn) throw new Error('expected the file tree entry');
  btn.click();
  const host = await waitFor(() => container.querySelector<HTMLElement>('.peekover-app__reader__host'));
  await waitFor(() => host.shadowRoot?.querySelector('.peekover-reader h1'));
  await flush(); // tocView's width-derived initial state lands a frame later (precedent, cited above)
  if (!host.shadowRoot) throw new Error('reader pane produced no mounted host');
  return { host, shadow: host.shadowRoot };
}

/** A host enhanced directly — the same seam `codeRender.browser.test.ts` uses. */
function directHost(markdown: string): { host: HTMLElement; shadow: ShadowRoot } {
  const host = document.createElement('div');
  document.body.appendChild(host);
  cleanup.push(host);
  mount(markdown, host, { contained: true });
  enhanceCode(host);
  if (!host.shadowRoot) throw new Error('mount produced no shadow root');
  return { host, shadow: host.shadowRoot };
}

/** Poll until every predicate holds or the timeout elapses. */
async function settled(check: () => void): Promise<void> {
  await vi.waitFor(check, { timeout: 5000, interval: 20 });
}

/** Every fence in `shadow` reaches a terminal state (`rendered` or `failed`), never left `pending`. */
async function allSettled(shadow: ShadowRoot): Promise<void> {
  await settled(() => {
    const wrappers = shadow.querySelectorAll(WRAPPER_SELECTOR);
    expect(wrappers.length).toBeGreaterThan(0);
    for (const wrapper of Array.from(wrappers)) {
      expect(wrapper.getAttribute(CODE_STATE_ATTR)).not.toBe('pending');
    }
  });
}

/** Whichever half of D-6's pair is currently ON SCREEN — `pre.shiki` once `rendered` (the retained
 *  source is `display:none` at that point, which returns an all-zero rect), the retained
 *  `pre[data-code]` otherwise (pending/failed, where it is the only visible thing). */
function visibleCodeRect(wrapper: HTMLElement): DOMRect {
  const highlighted = wrapper.querySelector<HTMLElement>('pre.shiki');
  if (highlighted) return highlighted.getBoundingClientRect();
  const retained = wrapper.querySelector<HTMLElement>('pre[data-code]');
  if (!retained) throw new Error('expected a retained or highlighted pre');
  return retained.getBoundingClientRect();
}

const rectOf = (el: Element): DOMRect => el.getBoundingClientRect();
const intersects = (a: DOMRect, b: DOMRect): boolean =>
  a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

function expectNoOverlap(name: string, a: DOMRect, other: string, b: DOMRect): void {
  const detail =
    `${name} [${Math.round(a.left)},${Math.round(a.top)},${Math.round(a.right)},${Math.round(a.bottom)}] ` +
    `vs ${other} [${Math.round(b.left)},${Math.round(b.top)},${Math.round(b.right)},${Math.round(b.bottom)}]`;
  expect(intersects(a, b), `overlap: ${detail}`).toBe(false);
}

// ── Clipboard: STUBBED for the bulk of the state/text/live-region proof (diagramActions.browser.
// test.ts's own split — the file-wide default is a recorder; a dedicated section below swaps to
// the real, unstubbed clipboard for D-10's own "gated by consent, not the manifest" proof). ──────

function stubClipboard() {
  const written: string[] = [];
  let reject = false;
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: {
      writeText: async (text: string): Promise<void> => {
        if (reject) throw new Error('clipboard write refused');
        written.push(text);
      },
    },
  });
  return {
    written,
    refuse(): void {
      reject = true;
    },
    restore(): void {
      Reflect.deleteProperty(navigator, 'clipboard');
    },
  };
}

let clipboard: ReturnType<typeof stubClipboard>;
beforeEach(() => {
  clipboard = stubClipboard();
});
afterEach(() => {
  clipboard.restore();
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// ROWS 5 + 8 — clearance at BOTH GEOMETRY_WIDTHS, and the TOC rail / mode toggle
// ═══════════════════════════════════════════════════════════════════════════════════════════════
//
// In-flow by construction (module header) makes vertical occlusion of the block's own text
// structurally impossible — the toolbar pushes the `<pre>`s down rather than floating over them.
// Asserted anyway, not merely reasoned about, at both widths `agentBadge.browser.test.ts`/
// `tablePlacement.browser.test.ts` use.

const GEOMETRY_WIDTHS = [
  ['1280', { width: 1280, height: 900 }],
  ['1400', { width: 1400, height: 900 }],
] as const;

describe.each(GEOMETRY_WIDTHS)('row 5 — clears the block’s own text at %s', (_label, size) => {
  afterEach(async () => {
    await page.viewport(1280, 900); // restore the project default
  });

  it('the toolbar rect sits entirely ABOVE the pre it belongs to — no vertical overlap', async () => {
    await page.viewport(size.width, size.height);
    const { shadow } = await appPageReader(
      '# Doc\n\nIntro.\n\n' +
        fence('javascript', 'function add(a, b) {\n  return a + b;\n}') +
        '\n## Section two\n\nMore text, so the rail has two headings to list.\n',
    );
    await allSettled(shadow);

    const toolbar = shadow.querySelector<HTMLElement>(TOOLBAR_SELECTOR);
    const wrapper = shadow.querySelector<HTMLElement>(WRAPPER_SELECTOR);
    if (!toolbar || !wrapper) throw new Error('expected an enhanced fence with its toolbar');

    const toolbarRect = rectOf(toolbar);
    const codeRect = visibleCodeRect(wrapper);
    // CONTROL: both boxes are real (non-zero), so a pass below is a real disjointness, not two
    // collapsed rects that trivially "don't overlap".
    expect(toolbarRect.height).toBeGreaterThan(0);
    expect(codeRect.height).toBeGreaterThan(0);
    expect(
      toolbarRect.bottom,
      `toolbar bottom ${toolbarRect.bottom} vs code top ${codeRect.top}`,
    ).toBeLessThanOrEqual(codeRect.top + 1); // +1px rounding slack
    expectNoOverlap('toolbar', toolbarRect, 'code', codeRect);
  });
});

describe.each(GEOMETRY_WIDTHS)('row 8 — clears the TOC rail and the mode toggle at %s', (_label, size) => {
  afterEach(async () => {
    await page.viewport(1280, 900);
  });

  it('the toolbar never intersects .peekover-toc or .peekover-mode-toggle', async () => {
    await page.viewport(size.width, size.height);
    const { host, shadow } = await appPageReader(
      '# Doc\n\nIntro.\n\n' +
        fence('javascript', 'function add(a, b) {\n  return a + b;\n}') +
        '\n## Section two\n\nMore text, so the rail has two headings to list.\n',
    );
    await allSettled(shadow);
    // The rail's own width-derived default lands a frame after build (`tocView.ts`'s own finding,
    // carried into every sibling suite that measures it) — force it OPEN so this reads the rail at
    // its real width rather than a collapsed handle.
    host.setAttribute('data-toc', 'open');
    await flush();

    const toolbar = shadow.querySelector<HTMLElement>(TOOLBAR_SELECTOR);
    const toc = shadow.querySelector<HTMLElement>('.peekover-toc');
    // KEEPS: the code toolbar never intersects the TOC rail (C091). RE-SPELLED at 013 task 4.5: its half about the
    // mode toggle is RETIRED with the toggle — the app page has no reader pills (`pills: false`); asserted gone.
    if (!toolbar || !toc) throw new Error('expected the toolbar and the TOC rail');
    expect(shadow.querySelector('.peekover-mode-toggle'), 'no mode pill on the app page').toBeNull();

    expectNoOverlap('toolbar', rectOf(toolbar), 'TOC rail', rectOf(toc));
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// ROW 11 — the toolbar anchors to its OWN block, on a multi-block document
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe('row 11 — multi-instance: block 2’s copy button copies block 2’s text', () => {
  it('two fences, two toolbars, each copy button acts on its own pre', async () => {
    const { shadow } = directHost(
      fence('javascript', 'const one = 1;') + '\n' + fence('python', 'two = 2'),
    );
    const toolbars = Array.from(shadow.querySelectorAll<HTMLElement>(TOOLBAR_SELECTOR));
    expect(toolbars).toHaveLength(2);

    const secondCopy = toolbars[1].querySelector<HTMLButtonElement>(COPY_SELECTOR);
    if (!secondCopy) throw new Error('expected the second block’s copy button');
    secondCopy.click();

    await settled(() => expect(clipboard.written).toHaveLength(1));
    expect(clipboard.written[0]).toContain('two = 2');
    expect(clipboard.written[0]).not.toContain('const one = 1;');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// ROW 14 — the toolbar is rebuilt every mount; handlers reach the CURRENT block
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe('row 14 — closure-death: a re-render’s copy button copies the NEW content', () => {
  it('after mount() replaces the fence, the fresh toolbar’s copy button copies the new text', async () => {
    const { host, shadow } = directHost(fence('javascript', 'const before = 1;'));
    await allSettled(shadow);

    mount(fence('javascript', 'const after = 2;'), host, { contained: true, preserveReading: true });
    enhanceCode(host);
    const newShadow = host.shadowRoot;
    if (!newShadow) throw new Error('expected a re-mounted shadow root');
    await allSettled(newShadow);

    const copyButton = newShadow.querySelector<HTMLButtonElement>(COPY_SELECTOR);
    if (!copyButton) throw new Error('expected the rebuilt toolbar’s copy button');
    copyButton.click();

    await settled(() => expect(clipboard.written).toHaveLength(1));
    expect(clipboard.written[0]).toContain('const after = 2;');
    expect(clipboard.written[0]).not.toContain('const before = 1;');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// ROW 24 — line numbers and word-wrap have NO sibling suite anywhere in this codebase; this is
// where that baseline is established: not just that the toggle FLIPS AN ATTRIBUTE (the D-7 suite
// above), but that the attribute actually produces the visible effect it claims to.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe('row 24 — line numbers actually render a gutter', () => {
  it('the ::before rule is inert until data-line-numbers="on", then applies to every line', async () => {
    const { shadow } = directHost(fence('javascript', 'const a = 1;\nconst b = 2;'));
    const wrapper = shadow.querySelector<HTMLElement>(WRAPPER_SELECTOR);
    const button = shadow.querySelector<HTMLButtonElement>(LINE_NUMBERS_SELECTOR);
    if (!wrapper) throw new Error('expected a wrapper');
    await settled(() => expect(wrapper.getAttribute(CODE_STATE_ATTR)).toBe('rendered'));
    if (!button) throw new Error('expected the line-numbers toggle');

    const line = wrapper.querySelector<HTMLElement>('pre.shiki .line');
    if (!line) throw new Error('expected a highlighted line');

    // OFF: the initial computed value — no gutter rule matches yet.
    expect(getComputedStyle(line, '::before').content).toBe('none');

    button.click();
    // ON: some `::before` rule now applies — not asserting the resolved counter TEXT (the
    // computed-style content stays the `counter()` description; the rendered digit is a paint-time
    // fact this API doesn't expose), only that the gutter rule now applies where it did not before.
    expect(getComputedStyle(line, '::before').content).not.toBe('none');
  });
});

describe('row 24 — word-wrap actually wraps a long line', () => {
  it('OFF: a long unbroken line overflows horizontally; ON: it wraps within the block', async () => {
    const longLine = 'x'.repeat(400); // no spaces — cannot wrap without overflow-wrap:anywhere
    const { shadow } = directHost(fence('javascript', `const ${longLine} = 1;`));
    const wrapper = shadow.querySelector<HTMLElement>(WRAPPER_SELECTOR);
    const button = shadow.querySelector<HTMLButtonElement>(WRAP_SELECTOR);
    if (!wrapper) throw new Error('expected a wrapper');
    await settled(() => expect(wrapper.getAttribute(CODE_STATE_ATTR)).toBe('rendered'));
    if (!button) throw new Error('expected the wrap toggle');

    const pre = wrapper.querySelector<HTMLElement>('pre.shiki');
    if (!pre) throw new Error('expected the highlighted pre');

    // OFF (default): the line does not fit — real horizontal overflow.
    expect(pre.scrollWidth).toBeGreaterThan(pre.clientWidth + 5);

    button.click();
    await new Promise((resolve) => requestAnimationFrame(resolve));
    // ON: wrapped within the block — no more horizontal overflow.
    expect(pre.scrollWidth).toBeLessThanOrEqual(pre.clientWidth + 1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// D-7 — PER-RENDER STATE DOES NOT SURVIVE A RE-RENDER (mirrors 008 D-9's identical argument)
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe('D-7 — line-numbers/word-wrap reset to OFF on every re-render', () => {
  it('toggle line numbers ON, drive a re-render, the fresh toolbar starts OFF', async () => {
    const { host, shadow } = directHost(fence('javascript', 'const a = 1;'));
    await allSettled(shadow);

    const lineNumbersButton = shadow.querySelector<HTMLButtonElement>(LINE_NUMBERS_SELECTOR);
    const wrapper = shadow.querySelector<HTMLElement>(WRAPPER_SELECTOR);
    if (!lineNumbersButton || !wrapper) throw new Error('expected the toolbar and its wrapper');
    lineNumbersButton.click();
    expect(wrapper.getAttribute(CODE_LINE_NUMBERS_ATTR)).toBe('on');
    expect(lineNumbersButton.getAttribute('aria-pressed')).toBe('true');

    // The re-render CHANGES the source — tasks.md 4.3's own instruction — so a build that carried
    // the flag across would show it on content the reader never toggled it for.
    mount(fence('javascript', 'const b = 2;'), host, { contained: true, preserveReading: true });
    enhanceCode(host);
    const newShadow = host.shadowRoot;
    if (!newShadow) throw new Error('expected a re-mounted shadow root');

    const newWrapper = newShadow.querySelector<HTMLElement>(WRAPPER_SELECTOR);
    const newLineNumbersButton = newShadow.querySelector<HTMLButtonElement>(LINE_NUMBERS_SELECTOR);
    if (!newWrapper || !newLineNumbersButton) throw new Error('expected the rebuilt toolbar');
    expect(newWrapper.hasAttribute(CODE_LINE_NUMBERS_ATTR)).toBe(false);
    expect(newLineNumbersButton.getAttribute('aria-pressed')).toBe('false');
  });

  it('toggle word-wrap ON, drive a re-render, the fresh toolbar starts OFF', async () => {
    const { host, shadow } = directHost(fence('javascript', 'const a = 1;'));
    await allSettled(shadow);

    const wrapButton = shadow.querySelector<HTMLButtonElement>(WRAP_SELECTOR);
    const wrapper = shadow.querySelector<HTMLElement>(WRAPPER_SELECTOR);
    if (!wrapButton || !wrapper) throw new Error('expected the toolbar and its wrapper');
    wrapButton.click();
    expect(wrapper.getAttribute(CODE_WRAP_ATTR)).toBe('on');

    mount(fence('javascript', 'const b = 2;'), host, { contained: true, preserveReading: true });
    enhanceCode(host);
    const newShadow = host.shadowRoot;
    if (!newShadow) throw new Error('expected a re-mounted shadow root');

    const newWrapper = newShadow.querySelector<HTMLElement>(WRAPPER_SELECTOR);
    const newWrapButton = newShadow.querySelector<HTMLButtonElement>(WRAP_SELECTOR);
    if (!newWrapper || !newWrapButton) throw new Error('expected the rebuilt toolbar');
    expect(newWrapper.hasAttribute(CODE_WRAP_ATTR)).toBe(false);
    expect(newWrapButton.getAttribute('aria-pressed')).toBe('false');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// ROW 15 — line-highlighting: state in TEXT and aria-*, not colour alone (D-8's consumer)
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe('row 15 — line-highlighting reads code.dataset.fenceMeta, announced in text', () => {
  it('a fence with {2,4} meta highlights lines 2 and 4, both with an aria-label stating so', async () => {
    const body = 'const a = 1;\nconst b = 2;\nconst c = 3;\nconst d = 4;\nconst e = 5;';
    const { shadow } = directHost(fence('javascript', body, '{2,4}'));
    const wrapper = shadow.querySelector<HTMLElement>(WRAPPER_SELECTOR);
    if (!wrapper) throw new Error('expected a wrapper');
    await settled(() => expect(wrapper.getAttribute(CODE_STATE_ATTR)).toBe('rendered'));

    // Resolution (a)'s own positive proof: the attribute survived sanitize.ts's allow-list.
    const code = wrapper.querySelector('pre[data-code] code');
    expect((code as HTMLElement | null)?.dataset.fenceMeta).toBe('{2,4}');

    // Shiki tokenizes a trailing `\n` (the fence helper always appends one before the closing
    // fence) into ONE EXTRA empty final line — the same artifact 4.2's own byte-identity test
    // reconciles for a single-line fixture. 5 real lines, 6 array entries; the 6th carries no text
    // and gets no highlight treatment (it is not one of `{2,4}`'s 1-based line numbers).
    const lines = Array.from(wrapper.querySelectorAll<HTMLElement>('pre.shiki .line'));
    expect(lines).toHaveLength(6);
    const highlighted = lines.filter((l) => l.classList.contains(CODE_LINE_HIGHLIGHT_CLASS));
    expect(highlighted).toHaveLength(2);
    expect(lines[1].classList.contains(CODE_LINE_HIGHLIGHT_CLASS)).toBe(true); // line 2
    expect(lines[3].classList.contains(CODE_LINE_HIGHLIGHT_CLASS)).toBe(true); // line 4

    // TEXT/aria-*, not colour alone (row 15's own wording).
    expect(lines[1].getAttribute('aria-label')).toContain('Highlighted line 2');
    expect(lines[3].getAttribute('aria-label')).toContain('Highlighted line 4');
    // Non-highlighted lines carry neither (including the trailing empty artifact line, index 5).
    for (const i of [0, 2, 4, 5]) {
      expect(lines[i].classList.contains(CODE_LINE_HIGHLIGHT_CLASS)).toBe(false);
      expect(lines[i].hasAttribute('aria-label')).toBe(false);
    }

    // Background is real, not merely a class name — the visual half exists too.
    const bg = getComputedStyle(lines[1]).backgroundColor;
    const plainBg = getComputedStyle(lines[0]).backgroundColor;
    expect(bg).not.toBe('rgba(0, 0, 0, 0)');
    expect(bg).not.toBe(plainBg);
  });

  it('a fence with NO meta highlights nothing', async () => {
    const { shadow } = directHost(fence('javascript', 'const a = 1;\nconst b = 2;'));
    const wrapper = shadow.querySelector<HTMLElement>(WRAPPER_SELECTOR);
    if (!wrapper) throw new Error('expected a wrapper');
    await settled(() => expect(wrapper.getAttribute(CODE_STATE_ATTR)).toBe('rendered'));

    const code = wrapper.querySelector('pre[data-code] code');
    expect((code as HTMLElement | null)?.dataset.fenceMeta).toBeUndefined();
    expect(wrapper.querySelectorAll(`.${CODE_LINE_HIGHLIGHT_CLASS}`)).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// ROW 16 — every control is a real <button>, keyboard-operable, no tabindex of its own
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe('row 16 — real buttons, keyboard-reachable', () => {
  it('line-numbers, wrap and copy are all real <button type="button">, no own tabindex, focusable', async () => {
    const { shadow } = directHost(fence('javascript', 'const a = 1;'));
    const selectors = [LINE_NUMBERS_SELECTOR, WRAP_SELECTOR, COPY_SELECTOR];
    for (const selector of selectors) {
      const button = shadow.querySelector<HTMLButtonElement>(selector);
      if (!button) throw new Error(`expected ${selector}`);
      expect(button.tagName).toBe('BUTTON');
      expect(button.type).toBe('button');
      expect(button.hasAttribute('tabindex')).toBe(false);
      button.focus();
      expect(shadow.activeElement, `${selector} did not take focus`).toBe(button);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// ROW 17 — accessible name carries SELECTION and ACTION, and moves with state
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe('row 17 — accessible names carry the block’s ordinal and move with state', () => {
  it('line-numbers: the name states the block and moves from “show” to “shown”', async () => {
    const { shadow } = directHost(fence('javascript', 'const a = 1;'));
    const button = shadow.querySelector<HTMLButtonElement>(LINE_NUMBERS_SELECTOR);
    if (!button) throw new Error('expected the line-numbers toggle');

    const before = button.getAttribute('aria-label') ?? '';
    expect(before).toContain('Code block 1');
    expect(before).toContain('show line numbers');

    button.click();
    const after = button.getAttribute('aria-label') ?? '';
    expect(after).not.toBe(before);
    expect(after).toContain('Line numbers shown');
  });

  it('wrap: the name states the block and moves from “wrap” to “wrapped”', async () => {
    const { shadow } = directHost(fence('javascript', 'const a = 1;'));
    const button = shadow.querySelector<HTMLButtonElement>(WRAP_SELECTOR);
    if (!button) throw new Error('expected the wrap toggle');

    const before = button.getAttribute('aria-label') ?? '';
    expect(before).toContain('wrap long lines');
    button.click();
    const after = button.getAttribute('aria-label') ?? '';
    expect(after).not.toBe(before);
    expect(after).toContain('Long lines wrapped');
  });

  it('copy: the name moves from “Activate to copy” to “copied”', async () => {
    const { shadow } = directHost(fence('javascript', 'const a = 1;'));
    const button = shadow.querySelector<HTMLButtonElement>(COPY_SELECTOR);
    if (!button) throw new Error('expected the copy button');

    const before = button.getAttribute('aria-label') ?? '';
    expect(before).toContain('Activate to copy it');
    button.click();
    await settled(() => expect(button.getAttribute('aria-label')).toContain('copied'));
  });

  it('block 2’s controls name block 2, not block 1', async () => {
    const { shadow } = directHost(
      fence('javascript', 'const one = 1;') + '\n' + fence('python', 'two = 2'),
    );
    const toolbars = Array.from(shadow.querySelectorAll<HTMLElement>(TOOLBAR_SELECTOR));
    expect(toolbars).toHaveLength(2);
    const secondCopy = toolbars[1].querySelector<HTMLButtonElement>(COPY_SELECTOR);
    expect(secondCopy?.getAttribute('aria-label')).toContain('Code block 2');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// ROW 18 — the decorative language label is hidden from assistive technology
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe('row 18 — the language label is aria-hidden, purely decorative', () => {
  it('carries the language as visible text, aria-hidden so AT skips it', async () => {
    const { shadow } = directHost(fence('python', 'x = 1'));
    const label = shadow.querySelector<HTMLElement>(LANG_SELECTOR);
    if (!label) throw new Error('expected the language label');
    expect(label.getAttribute('aria-hidden')).toBe('true');
    expect(label.textContent).toBe('python');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// ROW 19 — reduced motion: instant under reduce, DOES animate without it (non-vacuous both halves)
// ═══════════════════════════════════════════════════════════════════════════════════════════════

// `diagramActions.browser.test.ts`'s own row-19 shape, not a live differential read: this sheet
// carries a GLOBAL, unconditional `:host *{transition-duration:.001ms!important}` rule
// (`readerCss.ts:78`, the test-speed rule every browser-test file already runs under). Its
// `!important` beats a same-specificity non-important declaration regardless of origin order, so
// `getComputedStyle(button).transitionDuration` reads ~0.001ms in BOTH the reduced and the normal
// arm — a live check cannot tell them apart in this harness, the exact reason
// `diagramActions.browser.test.ts:786-809` asserts its own copy/download buttons' reduced-motion
// rule this way instead of by computed style.
describe('row 19 — the copy button’s .ok transition respects prefers-reduced-motion', () => {
  it('the shipped CSS carries a transition on the copy button, neutralised under reduced motion', async () => {
    const { READER_CSS } = await import('../../src/theme/readerCss');
    const block = READER_CSS.slice(READER_CSS.indexOf('.peekover-code-toolbar{'));
    expect(READER_CSS.indexOf('.peekover-code-toolbar{')).toBeGreaterThan(0);

    expect(block).toContain(`.${CODE_COPY_CLASS}{transition:`);
    expect(block).toMatch(/prefers-reduced-motion:\s*reduce\)\{[^}]*\.peekover-code-toolbar__copy\{transition:none\}/);

    // CONTROL: the pattern really can fail — it does not match a block missing the neutraliser.
    expect(/prefers-reduced-motion:\s*reduce\)\{[^}]*\.peekover-code-toolbar__copy\{transition:none\}/.test(
      '.peekover-code-toolbar__copy{transition:color 1ms}',
    )).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// ROW 20 — polite live region, out of the a11y tree while empty
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe('row 20 — the status region is role="status", hidden until it has something to say', () => {
  it('starts hidden, un-hides with the confirmation on success', async () => {
    const { shadow } = directHost(fence('javascript', 'const a = 1;'));
    const toolbar = shadow.querySelector<HTMLElement>(TOOLBAR_SELECTOR);
    const status = toolbar?.querySelector<HTMLElement>(STATUS_SELECTOR);
    const button = toolbar?.querySelector<HTMLButtonElement>(COPY_SELECTOR);
    if (!status || !button) throw new Error('expected the status region and the copy button');

    expect(status.getAttribute('role')).toBe('status');
    expect(status.hidden).toBe(true);

    button.click();
    await settled(() => expect(status.hidden).toBe(false));
    expect(status.textContent).toContain('Code block 1 copied');
    expect(button.getAttribute(CODE_COPY_STATE_ATTR)).toBe('done');
  });

  it('un-hides with a failure message when the write is refused, and the block stays readable', async () => {
    clipboard.refuse();
    const { shadow } = directHost(fence('javascript', 'const a = 1;'));
    const toolbar = shadow.querySelector<HTMLElement>(TOOLBAR_SELECTOR);
    const status = toolbar?.querySelector<HTMLElement>(STATUS_SELECTOR);
    const button = toolbar?.querySelector<HTMLButtonElement>(COPY_SELECTOR);
    const pre = shadow.querySelector<HTMLElement>('pre[data-code]');
    if (!status || !button || !pre) throw new Error('expected the status region, button and pre');

    button.click();
    await settled(() => expect(status.hidden).toBe(false));
    expect(status.textContent).toContain('could not be copied');
    expect(button.getAttribute(CODE_COPY_STATE_ATTR)).toBe('failed');
    expect(button.textContent).toBe('Copy failed');
    // §3.9: the block stays readable — the retained source is untouched by a toolbar failure.
    expect(pre.textContent).toContain('const a = 1;');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// COPY-RAW BYTE-IDENTITY — the retained <pre>, never the highlighted sibling (D-6)
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe('copy-raw copies the RETAINED pre, byte-identical to the hostile source', () => {
  // Same hostile fixture 4.2's own byte-identity test uses (codeRender.browser.test.ts) — tabs,
  // multi-space runs, a unicode character and trailing whitespace, chosen because a lossy tokenizer
  // round-trip (reading the highlighted sibling instead) would expose itself against exactly this.
  const HOSTILE = 'const é = "🎉";   \r\nconsole.log(é);\t\n\n';
  const NORMALIZED = HOSTILE.replace(/\r\n/g, '\n'); // CommonMark's own \r\n -> \n, upstream of D-6

  it('the copied text equals the retained pre’s textContent exactly, even before highlighting settles', async () => {
    const { shadow } = directHost('```javascript\n' + HOSTILE + '```\n');
    const pre = shadow.querySelector<HTMLElement>('pre[data-code]');
    const button = shadow.querySelector<HTMLButtonElement>(COPY_SELECTOR);
    if (!pre || !button) throw new Error('expected the retained pre and the copy button');

    expect(pre.textContent).toBe(NORMALIZED);
    button.click();

    await settled(() => expect(clipboard.written).toHaveLength(1));
    expect(clipboard.written[0]).toBe(NORMALIZED);
    // The copy source is a fixed reference captured at build time, not a live re-read at click
    // time — but confirming pre.textContent is STILL the same value after the click is what rules
    // out a build that copied from the highlighted sibling once it appears (a race this fixture is
    // deliberately slow to tokenize because of its unicode content).
    expect(pre.textContent).toBe(NORMALIZED);
  });

  it('RED-FIRST SIGNATURE (recorded, not asserted): the highlighted sibling’s textContent for this ' +
    'fixture carries the SAME visible characters but is not the copy source', async () => {
    // This case documents the ablation's expected failure shape rather than performing the
    // ablation in-tree (that requires editing codeView.ts's copy handler to read the highlighted
    // sibling instead, which is a source edit, not a test fixture) — see the session report for the
    // actual red-first run. What is asserted here is the CONTROL the ablation would need: the
    // highlighted sibling, once rendered, reassembles to the same text, so a copy-source swap could
    // not be caught by a looser "contains the right characters somewhere" assertion — only exact
    // byte identity (asserted above) can tell the two apart.
    const { shadow } = directHost('```javascript\n' + HOSTILE + '```\n');
    const wrapper = shadow.querySelector<HTMLElement>(WRAPPER_SELECTOR);
    if (!wrapper) throw new Error('expected a wrapper');
    await settled(() => expect(wrapper.getAttribute(CODE_STATE_ATTR)).not.toBe('pending'));
    const highlighted = wrapper.querySelector('pre.shiki');
    if (highlighted) {
      // Same characters, but this is NOT what the copy button reads (asserted in the test above).
      expect(highlighted.textContent).toBe(NORMALIZED);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// THE REAL, UNSTUBBED CLIPBOARD — D-10's own "gated by consent, not the manifest" proof
// (`tableCopy.browser.test.ts`/`diagramActions.browser.test.ts`'s shape, duplicated per plan risk 6)
// ═══════════════════════════════════════════════════════════════════════════════════════════════

/** The engine's own answer about clipboard-write consent — Gecko has no such permission at all. */
async function clipboardWriteConsent(): Promise<PermissionState | 'unsupported'> {
  try {
    const status = await navigator.permissions.query({ name: 'clipboard-write' as PermissionName });
    return status.state;
  } catch {
    return 'unsupported';
  }
}

let grantedContextId: string | undefined;
let consentGranted = false;

async function grantClipboardConsent(): Promise<void> {
  const info = (await cdp().send('Target.getTargetInfo', {} as never)) as {
    targetInfo?: { browserContextId?: string };
  };
  grantedContextId = info?.targetInfo?.browserContextId;
  consentGranted = true;
  await cdp().send('Browser.grantPermissions', {
    origin: location.origin,
    browserContextId: grantedContextId,
    permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite'],
  } as never);
}

describe('real clipboard — unstubbed, consent-gated (D-10)', () => {
  beforeEach(async () => {
    // This section works with the REAL clipboard; the file-wide stub must be off for it.
    clipboard.restore();
    if ((await clipboardWriteConsent()) === 'unsupported') return;
    const info = (await cdp().send('Target.getTargetInfo', {} as never)) as {
      targetInfo?: { browserContextId?: string };
    };
    await cdp().send('Browser.resetPermissions', {
      browserContextId: info?.targetInfo?.browserContextId,
    } as never);
  });

  afterEach(async () => {
    if (!consentGranted) return;
    consentGranted = false;
    await cdp().send('Browser.resetPermissions', { browserContextId: grantedContextId } as never);
    expect(await clipboardWriteConsent(), 'the granted consent outlived this file').toBe('prompt');
  });

  it('is talking to the browser’s own clipboard — no own property, writeText is [native code]', () => {
    expect(Object.getOwnPropertyDescriptor(navigator, 'clipboard')).toBeUndefined();
    expect(typeof navigator.clipboard?.writeText).toBe('function');
    expect(String(navigator.clipboard.writeText)).toContain('[native code]');
  });

  it('a real click writes the RAW source to the real clipboard — gated by consent, not the manifest', async () => {
    const { shadow } = directHost(fence('javascript', 'const a = 1;'));
    const pre = shadow.querySelector<HTMLElement>('pre[data-code]');
    const button = shadow.querySelector<HTMLButtonElement>(COPY_SELECTOR);
    if (!pre || !button) throw new Error('expected the retained pre and the copy button');

    // A REAL, trusted click — `element.click()` is a synthetic DOM event with no user activation,
    // and Gecko's writeText requires genuine activation regardless of the (nonexistent) Permissions
    // API state; `userEvent.click` drives the browser's own input, same as
    // `diagramActions.browser.test.ts`'s `realClickSettles`.
    const consent = await clipboardWriteConsent();
    if (consent === 'unsupported') {
      // Gecko: the gesture IS the whole gate.
      await userEvent.click(button);
      await settled(() => expect(button.getAttribute(CODE_COPY_STATE_ATTR)).toBe('done'));
    } else {
      expect(
        consent,
        'the context no longer starts at `prompt` — the OFF arm of the ablation is void',
      ).toBe('prompt');
      await userEvent.click(button);
      await settled(() => expect(button.getAttribute(CODE_COPY_STATE_ATTR)).toBe('failed'));

      await grantClipboardConsent();
      expect(await clipboardWriteConsent()).toBe('granted');
      button.removeAttribute(CODE_COPY_STATE_ATTR);
      await userEvent.click(button);
      await settled(() => expect(button.getAttribute(CODE_COPY_STATE_ATTR)).toBe('done'));
    }

    expect(button.textContent).toBe('Copied');
    // Windows' own clipboard subsystem normalizes LF -> CRLF on plain-text round-trips (measured:
    // Chromium only, not Firefox) — `tableCopy.browser.test.ts`'s own real-clipboard read-back
    // applies the identical normalization for the identical reason; this is an OS platform fact
    // about the real clipboard, not a defect in what was written.
    const readBack = (await navigator.clipboard.readText()).replace(/\r\n/g, '\n');
    expect(readBack).toBe(pre.textContent);
  });
});


// ═══════════════════════════════════════════════════════════════════════════════════════════════
// 013 TASK 5.3 — THE CODE TOOLBAR IS THE MOCKUP'S COPY BUTTON (gate-1 Q14; `mockup.html:154–156`)
// ═══════════════════════════════════════════════════════════════════════════════════════════════
//
// Every button in the toolbar — Line numbers, Wrap, Copy — draws the mock's `.copy`: `--paper`, a
// 1 px `--line` border, radius 7, 11.5 px / 600 in the UI face, 5 / 11 padding, `--muted` text,
// `--ink` under the pointer. The states the mock does not draw are tokens too: a pressed toggle
// `--ink` on `--accent-soft` with a `--faint` border; the "Copied" confirmation `--ink` on
// `--ok-soft` with an `--ok` border (the mock's `--ok` TEXT is 3.37:1 on `--paper` in light — below
// AA, G-5's logic); "Copy failed" `--del` (4.76 / 6.79). Focus is the reader's ring (`:host
// :focus-visible`, 2 px `--accent`). Each state is read off the real engine, in both themes, on the
// app page's reading view AND the editor's preview, and every text is >= 4.5:1 over what is painted
// behind it. Behaviour is the file's other tests', unchanged.

type Theme = 'light' | 'dark';
type ButtonState = 'rest' | 'hover' | 'focus' | 'pressed' | 'done' | 'failed';

/** A token's computed value, read off a probe beside `near` (so the theme in force there applies). */
function tokenOf(near: Element, token: string, property: 'color' | 'font-family' = 'color'): string {
  const probe = document.createElement('span');
  probe.style.setProperty(property, `var(${token})`);
  near.parentElement!.appendChild(probe);
  const cs = getComputedStyle(probe);
  const value = property === 'color' ? cs.color : cs.fontFamily;
  probe.remove();
  return value;
}

/** What the copy button looks like, as the engine paints it. Four borders must agree. */
function lookOf(el: HTMLElement): Record<string, string> {
  const cs = getComputedStyle(el);
  const borders = new Set(
    (['top', 'right', 'bottom', 'left'] as const).map(
      (s) => `${cs.getPropertyValue(`border-${s}-style`)} ${cs.getPropertyValue(`border-${s}-width`)} ${cs.getPropertyValue(`border-${s}-color`)}`,
    ),
  );
  return {
    background: cs.backgroundColor,
    border: [...borders].join(' | '),
    radius: cs.borderTopLeftRadius,
    font: `${cs.fontSize} ${cs.fontWeight}`,
    padding: `${cs.paddingTop} ${cs.paddingRight}`,
    face: cs.fontFamily,
    colour: cs.color,
  };
}

/** The mock's copy button in `state`, from the tokens in force beside `el`. */
function copyButtonLook(el: HTMLElement, state: ButtonState): Record<string, string> {
  const t = (name: string) => tokenOf(el, name);
  const look = {
    background: t('--paper'),
    border: `solid 1px ${t('--line')}`,
    radius: '7px',
    font: '11.5px 600',
    padding: '5px 11px',
    face: tokenOf(el, '--sans', 'font-family'),
    colour: t('--muted'),
  };
  if (state === 'hover') look.colour = t('--ink');
  if (state === 'pressed') Object.assign(look, { colour: t('--ink'), background: t('--accent-soft'), border: `solid 1px ${t('--faint')}` });
  if (state === 'done') Object.assign(look, { colour: t('--ink'), background: t('--ok-soft'), border: `solid 1px ${t('--ok')}` });
  if (state === 'failed') Object.assign(look, { colour: t('--del'), border: `solid 1px ${t('--del')}` });
  return look;
}

/** The text's contrast over what is painted behind it — the census's own measure. */
const textRatio = (el: HTMLElement): number => ratioOver(inkOf(el), backdropOf(el)).ratio;
/** Non-text (WCAG 1.4.11), recorded for 8.1: the border against what is behind the button. */
const borderRatio = (el: HTMLElement): number =>
  ratioOver(parseColor(getComputedStyle(el).borderTopColor), backdropOf(el, { skipSelf: true })).ratio;

/** Put the pointer on a neutral node, so no state is a leftover hover. */
async function pointerAway(shadow: ShadowRoot): Promise<void> {
  await userEvent.hover(shadow.querySelector<HTMLElement>('h1, .peekover-reader p')!);
}

/** Focus `el` by keyboard: focus it, step back with Shift+Tab, then Tab onto it again. */
async function tabOnto(el: HTMLElement): Promise<void> {
  el.focus();
  await userEvent.tab({ shift: true });
  await userEvent.tab();
}

/** Assert one button in one state: the look first (the instrument), then its text's contrast. */
async function expectCopyLook(label: string, el: HTMLElement, state: ButtonState): Promise<void> {
  await sleep(220); // the copy button's colour transition (150 ms) settles
  expect(lookOf(el), `${label} — ${state}: the mockup's copy button`).toEqual(copyButtonLook(el, state));
  const ratio = textRatio(el);
  console.log(`CONTRAST-5.3 ${label} · ${state} · text ${ratio.toFixed(2)} · border ${borderRatio(el).toFixed(2)}`);
  expect(ratio, `${label} — ${state}: text >= 4.5:1 (${ratio.toFixed(2)})`).toBeGreaterThanOrEqual(TEXT_BAR);
}

/** Walk the three buttons of the first toolbar under `root` through every state they have. */
async function walkToolbar(shadow: ShadowRoot, root: ParentNode, where: string): Promise<void> {
  const toolbar = root.querySelector<HTMLElement>(`.${CODE_TOOLBAR_CLASS}`)!;
  const buttons = [
    ['Line numbers', toolbar.querySelector<HTMLButtonElement>(`.${CODE_LINE_NUMBERS_CLASS}`)!],
    ['Wrap', toolbar.querySelector<HTMLButtonElement>(`.${CODE_WRAP_CLASS}`)!],
    ['Copy', toolbar.querySelector<HTMLButtonElement>(`.${CODE_COPY_CLASS}`)!],
  ] as const;
  for (const [name, button] of buttons) {
    const label = `${where} · ${name}`;
    button.scrollIntoView({ block: 'center' });
    await pointerAway(shadow);
    await expectCopyLook(label, button, 'rest');
    await userEvent.hover(button);
    await expectCopyLook(label, button, 'hover');
    await pointerAway(shadow);
    await tabOnto(button);
    expect(shadow.activeElement, `${label}: Tab reaches it`).toBe(button);
    const ring = getComputedStyle(button);
    expect(`${ring.outlineStyle} ${ring.outlineWidth} ${ring.outlineColor}`, `${label}: the focus ring`).toBe(
      `solid 2px ${tokenOf(button, '--accent')}`,
    );
    await expectCopyLook(label, button, 'focus');
    button.blur();
    if (name === 'Copy') {
      await userEvent.click(button);
      await settled(() => expect(button.getAttribute(CODE_COPY_STATE_ATTR)).toBe('done'));
      await pointerAway(shadow);
      await expectCopyLook(label, button, 'done');
      clipboard.refuse();
      await userEvent.click(button);
      await settled(() => expect(button.getAttribute(CODE_COPY_STATE_ATTR)).toBe('failed'));
      await pointerAway(shadow);
      await expectCopyLook(label, button, 'failed');
    } else {
      await userEvent.click(button);
      expect(button.getAttribute('aria-pressed')).toBe('true');
      await pointerAway(shadow);
      await expectCopyLook(label, button, 'pressed');
      await userEvent.click(button); // back to off — behaviour unchanged, only the look is under test
      expect(button.getAttribute('aria-pressed')).toBe('false');
    }
  }
}

const LOOK_DOC = '# Look\n\nA paragraph.\n\n## Two\n\n' + fence('javascript', 'const answer = 42;');

describe('013 5.3 — the code toolbar is the mockup’s copy button, every state, both themes', () => {
  beforeEach(async () => {
    await page.viewport(1440, 900);
  });
  afterEach(async () => {
    setThemeSetting('auto');
    resetThemeWatchForTest();
    await page.viewport(414, 896);
  });

  for (const theme of ['light', 'dark'] as const satisfies readonly Theme[]) {
    it(`the app page's reading view — ${theme}`, async () => {
      setThemeSetting(theme);
      const { host, shadow } = await appPageReader(LOOK_DOC);
      setThemeSetting(theme); // again: the shell's settings load (this file's store has none) resets it
      await waitFor(() => host.getAttribute('data-theme') === theme);
      await allSettled(shadow);
      await walkToolbar(shadow, shadow, `app page · ${theme}`);
    });

    it(`the editor's preview — ${theme}`, async () => {
      setThemeSetting(theme);
      const { host, shadow } = await appPageReader(LOOK_DOC);
      setThemeSetting(theme); // again: the shell's settings load (this file's store has none) resets it
      await waitFor(() => host.getAttribute('data-theme') === theme);
      const shell = host.closest('.peekover-app')!;
      shell.querySelector<HTMLButtonElement>('.peekover-toolbar__seg [data-mode="edit"]')!.click();
      await waitFor(() => host.getAttribute('data-mode') === 'edit');
      await waitFor(() => editorSessionFor(host));
      // The preview is mount() on a NESTED host with its own shadow root (editorView.ts).
      const previewShadow = await waitFor(() => {
        const nested = shadow.querySelector<HTMLElement>('.peekover-editor__preview-host')?.shadowRoot;
        const toolbar = nested?.querySelector<HTMLElement>(`.${CODE_TOOLBAR_CLASS}`);
        return nested && toolbar && toolbar.getClientRects().length > 0 ? nested : null;
      });
      try {
        await allSettled(previewShadow);
        await walkToolbar(previewShadow, previewShadow, `editor preview · ${theme}`);
      } finally {
        teardownEditorShell(host);
      }
    });
  }
});

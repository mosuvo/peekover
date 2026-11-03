// Block math's copy control group (task 6.1-R, D-6-R, §8-1) in a REAL ENGINE, Chromium AND
// Firefox — the copy-as-LaTeX/copy-as-MathML control group `mathView.ts` gained, reusing
// `diagramView.ts`'s own §3.11 control-group MECHANISM verbatim (real buttons, resolved-at-
// activation-time actions, the reuse-across-re-render shape).
//
// ══ WHY THE CLIPBOARD SECTION FOLLOWS `tableCopy.browser.test.ts`'s SHAPE, NOT
// `exportShortcut.browser.test.ts`'s ══════════════════════════════════════════════════════════
//
// This task's own kickoff named `exportShortcut.browser.test.ts` as "the same clipboard
// mechanism" to reuse. Read directly: that file never touches the clipboard at all (it is the
// Ctrl/Cmd+S dialog-suppression test). The real worked reference for a real-clipboard
// writeText/readText round trip, gated on the two engines' own differing consent models, is
// `tableCopy.browser.test.ts` (task 3.8) — its `clipboardWriteConsent`/`grantClipboardConsent`
// helpers are duplicated below verbatim, matching `diagramActions.browser.test.ts`'s own
// independent duplication of the identical shape. This divergence from the kickoff's own citation
// is stated here rather than silently substituted.
//
// ══ THE FIXTURES' EXACT RETAINED-SOURCE SHAPE — MEASURED, NOT GUESSED ═══════════════════════
//
// A scratch probe against the real `parse()` (written via the Write tool, never a bash heredoc —
// a heredoc silently collapsed `\\$`/`\\t` in this session's own drafting, the
// `heredoc-collapses-doubled-backslash` hazard) confirmed: for dollar-block origin, the tex
// plugin's own captured token content carries a TRAILING NEWLINE even for a single-line formula —
// `$$x + \$5$$\n` parses to `<pre><code class="language-math">$$x + \$5\n$$</code></pre>`, so the
// byte-identical retained source (after `mathSourceOf`'s $$-peel) is `x + \$5\n`, WITH the trailing
// newline — not the bare LaTeX a naive reading of the source markdown would suggest. Every fixture
// below was independently confirmed to render through the REAL installed `temml`, in the REAL
// dynamically-imported browser chunk specifically (not just `node_modules/temml` in isolation).
//
// ══ ★ A GENUINE, SEPARATE DEFECT SURFACED WHILE DRAFTING THESE FIXTURES — FLAGGED, NOT FIXED
// HERE, NOT WORKED AROUND SILENTLY ══════════════════════════════════════════════════════════════
//
// Every fixture below avoids LaTeX CONTROL WORDS (`\alpha`, `\text{...}`, `\frac{}{}`, any
// backslash-then-LETTERS macro) — control SYMBOLS (`\$`, a backslash followed by exactly one
// NON-letter) are fine. This is not a stylistic choice: a real, previously-undiscovered defect was
// found while drafting this file, confirmed reproducible via three independent routes — (1) Vitest's
// browser-mode dependency pre-bundle of `temml` (`node_modules/.vite/vitest/*/deps/temml.js`,
// reproduced even after `rm -rf node_modules/.vite` to rule out a stale cache), (2) the SAME
// corrupted pattern is present in the ACTUAL SHIPPED PRODUCTION CHUNK
// (`.output/chrome-mv3/chunks/temml-*.js`, confirmed by `grep`), and (3) a plain Node `import()` of
// that exact pre-bundled file, outside any browser, reproduces the same throw — proving this is
// baked into the FILE CONTENT, not a browser runtime quirk. Root cause, traced to the source: the
// esbuild-driven bundling step used both by Vitest's dependency optimizer and by this project's own
// production build (WXT/Vite/Rollup, which also runs esbuild for dependency pre-processing) mangles
// `temml`'s `Lexer.js`-derived `tokenRegexString`'s astral-surrogate-pair alternative
// (`[\uD800-\uDBFF][\uDC00-\uDFFF]`) — the lone-surrogate `\uD800`/`\uDBFF`/`\uDC00`/`\uDFFF` escapes
// cannot survive as standalone Unicode scalar values, and get silently replaced with literal U+FFFD
// replacement characters (e.g. `[�d800-�dbff]`). The resulting character class is no
// longer a narrow "one astral character" match — it is an enormous RANGE (`0x30`–`0xFFFD`) that
// happens to include the backslash (`0x5C`) and every following letter. Because JS regex
// alternation picks the FIRST alternative that matches at a position (not the longest), this
// corrupted "astral pair" alternative — which sits BEFORE the control-word alternative
// (`(\\[a-zA-Z@]+)…`) in the source's own `tokenRegexString` — now intercepts every `\<word>` and
// matches only its first TWO characters (`\` + one letter), so Temml throws `Unsupported function
// name: \a`/`\t`/etc. for ANY multi-letter LaTeX macro — `\alpha`, `\text`, `\frac`, essentially all
// non-trivial LaTeX. Every EXISTING real-browser math test (`mathBlock`/`mathDegrade`/`mathNetwork`
// .browser.test.ts) only ever used bare-arithmetic fixtures (`x^2`, `y^2`, `z^2`) or a DELIBERATELY
// malformed one (`\frac{a}{`, expected to fail anyway) — none exercised a well-formed macro through
// the real dynamically-loaded chunk, so this defect has been invisible until this task's own drafting
// hit it. ★ THIS IS LIKELY MILESTONE-CRITICAL: `tasks.md`'s own 1.2-R (the human fidelity walk that
// judges REVISIT-RULING 2's bar) is still `[ ]` UNCHECKED — its own "dense representative formula
// corpus" explicitly includes fractions/nested radicals/Greek letters, i.e. macros, and per the
// finding above the SHIPPED PRODUCTION BUILD carries the identical corruption, so that walk is very
// likely to fail once it reaches any macro-based formula. NOT investigated further or fixed here —
// diagnosing/patching esbuild's dependency bundling of `temml` is far outside this task's own Files
// line (`src/render/mathView.ts`, this test file) and is a decision for whoever owns 1.2-R's own
// fork next, flagged here in full technical detail rather than smoothed over or silently avoided.
//
// ── ★ UPDATE, TASK 6.2-R: THE BUNDLING DEFECT ABOVE IS NOW PATCHED (`af8cf9b`, `patches/temml.patch`) ──
//
// `\alpha`/`\frac`/any named macro now renders correctly in the real shipped chunk — confirmed
// fresh this session (a `\alpha` fixture below renders through the real dynamically-loaded chunk
// without throwing). The fixtures below use macros freely where a macro is what the test needs.
//
// ── ★★★ A SEPARATE, NEW DEFECT THIS TASK FOUND: §8-1(b)'S OWN "TEXT-SELECTION" CLAIM IS FALSE FOR
// A SUCCESSFULLY-RENDERED INLINE FORMULA — VERIFIED, NOT FIXED, PER THIS TASK'S "verify, don't
// build" SCOPE ═══════════════════════════════════════════════════════════════════════════════════
//
// `decisions.md`'s M11 GATE 2 §8-1(b) ruling: inline copy-as-LaTeX is "select-and-copy of the
// retained source text already on screen — zero new code, since the literal `$…$` source is what
// the `<code class="peekover-math-inline">` element's own text content is AT REST (D-7)." Measured
// directly, real engine, both browsers, against a SETTLED (successfully rendered) formula: FALSE.
// `markMathInlineRendered` (5.1-R, already committed, red-first-proven) does
// `code.replaceChildren(content)` on success — the literal `$…$` text is PERMANENTLY REPLACED by
// Temml's `<math>` tree the instant rendering succeeds, which happens automatically and near-
// instantly for essentially every formula a real user will ever look at on the app page. Temml's
// own `annotate: false` pin (`mathEngine.ts`, D-4-R) means the rendered tree carries no hidden
// source annotation either — there is no fallback recovery path. Selecting a settled `Inline
// $x + \$5$` formula's own `<code>` element and pressing Ctrl+C copies `"x\r\n+\r\n$\r\n5\r\n"` on
// Chromium and `"x+$5"` on Firefox — in both cases the rendered GLYPH string (the SAME "collapsed,
// backslash-free" shape 6.1-R's own copy-as-MathML test already found for the identical
// underlying `<math>` tree, now confirmed for inline's own success-state text-selection
// specifically), never the retained source. The claim genuinely DOES hold in two narrower states —
// a FAILED formula (§3.9 never touches content, so the source persists FOREVER) and the
// content-script surface (§9-2: `enhanceMath` never runs there, so every marker stays in its
// literal-source "rest" state permanently) — both proven below, alongside the settled-formula
// negative proven equally directly. ★ FLAGGED for `progress.md`'s carried items / 8.1-R's
// milestone-close walk / a possible fresh §8-1 gate reopening: for the COMMON case — a
// successfully rendered inline formula on the app page, the primary surface this whole milestone
// targets — THERE IS CURRENTLY NO WAY TO RECOVER ITS LATEX SOURCE BY ANY MEANS. Not fixed here: a
// fix needs either new per-formula inline chrome (§8-1(b) explicitly rules that out) or a DOM-shape
// change to what `markMathInlineRendered` retains on success — a D-7-R architecture change,
// decided at a gate, not invented inside this task's own diff. Human-reviewed 2026-09-09: ship the
// honest verification (this task), route the gap as a carried item, build nothing new.

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { page, userEvent, cdp } from 'vitest/browser';
import { createReaderPane } from '../../src/app/readerPane';
import { mount } from '../../src/render/mount';
import { mountAppShell, type AppStore } from '../../src/app/appShell';
import type { FolderSource, MarkdownFile } from '../../src/app/folderSource';
import { EXPORT_STATUS_CLASS, EXPORT_ROW_STATE_ATTR } from '../../src/app/exportControls';
import {
  MATH_ACTION_CLASS,
  MATH_ACTIONS_CLASS,
  MATH_ACTION_STATE_ATTR,
  MATH_FIGURE_CLASS,
  MATH_STATE_ATTR,
  MATH_STATUS_CLASS,
  insertMathPlaceholder,
  markMathRendered,
} from '../../src/render/mathView';
import { setThemeSetting, resetThemeWatchForTest } from '../../src/theme/reader';
import { resetThemeHostsForTest } from '../../src/theme/themeRegistry';

// RULING C (the 4.0 census, 2026-11-02; 013 task 4.4): this file is not about the compact toolbar, so
// its window is WIDE — above the 863 px breakpoint, where the app controls sit in the toolbar
// instead of behind "⋯". KEEPS: each test's own property (C255, C256, C257); RE-SPELLED at 4.4 by the
// window alone. The harness default (414 × 896) is restored after each test — the window is shared
// by every file that runs after this one.
beforeEach(async () => {
  await page.viewport(1280, 900);
});
afterEach(async () => {
  await page.viewport(414, 896);
});

const FIGURE_SELECTOR = `figure.${MATH_FIGURE_CLASS}`;
const MATHML_NS = 'http://www.w3.org/1998/Math/MathML';

// ── Fixtures — every fixture below was independently confirmed to render through real `temml` ──

/** The escaped-`\$` fixture (3.1-R's own audit named this shape) — `\$` is a control SYMBOL
 *  (backslash + one non-letter), never affected by the header's own macro-lexing defect. Retained
 *  source, after the $$-peel: `x + \$5\n` — WITH the trailing newline (see header). */
const ESCAPED_DOLLAR_DOC = '$$x + \\$5$$\n';
const ESCAPED_DOLLAR_SOURCE = 'x + \\$5\n';

/** A genuinely multi-line dollar-block. Retained source: `x^2 +\ny^2\n`. */
const MULTILINE_DOC = '$$\nx^2 +\ny^2\n$$\n';
const MULTILINE_SOURCE = 'x^2 +\ny^2\n';

// ── 6.2-R's own fixtures — inline origin. Retained source, after the single-`$` peel, carries NO
// trailing newline (verified via a scratch `parse()` probe this session — unlike dollar-BLOCK
// origin, inline's own captured token content never carries one). ─────────────────────────────

/** Inline's own escaped-`\$` fixture, mirroring `ESCAPED_DOLLAR_DOC` above. */
const INLINE_ESCAPED_DOLLAR_DOC = 'Inline $x + \\$5$ more text.\n';
const INLINE_ESCAPED_DOLLAR_SOURCE = 'x + \\$5';

/** A macro fixture — `\alpha` now renders (the temml lone-surrogate patch, `af8cf9b`, see header). */
const INLINE_MACRO_DOC = 'Macro inline $\\alpha$ here.\n';
const INLINE_MACRO_SOURCE = '\\alpha';

/** A genuinely malformed inline formula — mirrors `mathDegrade.browser.test.ts`'s own `\frac{a}{`
 *  fixture (an unterminated brace), confirmed via a scratch probe to tokenize as ONE inline
 *  formula whose content is exactly `\frac{a}{`. */
const INLINE_MALFORMED_DOC = 'Inline $\\frac{a}{$ stays broken.\n';
const INLINE_MALFORMED_SOURCE = '\\frac{a}{';

const cleanup: HTMLElement[] = [];

afterEach(() => {
  for (const el of cleanup.splice(0)) el.remove();
  resetThemeHostsForTest();
  resetThemeWatchForTest();
  setThemeSetting('auto');
});

/** The APP-PAGE surface, driven through the production pane — mirrors `mathBlock.browser.test.ts`'s
 *  own harness exactly (each browser test file owns its own copy; nothing here is shared/imported
 *  across files). */
async function appPageReader(markdown: string): Promise<{ host: HTMLElement; shadow: ShadowRoot }> {
  const pane = createReaderPane(document);
  document.body.appendChild(pane.element);
  cleanup.push(pane.element);
  await pane.select({ name: 'doc.md', read: async () => markdown });
  const host = pane.element.querySelector<HTMLElement>('.peekover-app__reader__host');
  if (!host?.shadowRoot) throw new Error('reader pane produced no mounted host');
  return { host, shadow: host.shadowRoot };
}

function contentScriptReader(markdown: string): ShadowRoot {
  const host = document.createElement('peekover-root');
  document.body.appendChild(host);
  cleanup.push(host);
  mount(markdown, host);
  if (!host.shadowRoot) throw new Error('mount produced no shadow root');
  return host.shadowRoot;
}

async function settleMath(shadow: ShadowRoot, expectedCount: number): Promise<void> {
  for (let i = 0; i < 400; i += 1) {
    const marked = [...shadow.querySelectorAll(`[${MATH_STATE_ATTR}]`)];
    const settled = marked.filter((el) => el.getAttribute(MATH_STATE_ATTR) !== 'pending');
    if (marked.length >= expectedCount && settled.length >= expectedCount) return;
    await new Promise<void>((r) => setTimeout(r, 25));
  }
  throw new Error('math markers never settled');
}

// ── 6.2-R's own harness additions ────────────────────────────────────────────────────────────

const inlineCodeIn = (shadow: ShadowRoot): HTMLElement =>
  shadow.querySelector<HTMLElement>('code.peekover-math-inline')!;

/** Select an element's full text contents with a REAL Range/Selection, then press a REAL
 *  Ctrl+C — §8-1(b)'s own "ordinary text-selection" mechanism, exercised directly with no
 *  Peekover code participating in producing the clipboard content. */
async function selectAndCopy(el: Element): Promise<void> {
  const range = document.createRange();
  range.selectNodeContents(el);
  const selection = document.getSelection()!;
  selection.removeAllRanges();
  selection.addRange(range);
  await userEvent.keyboard('{Control>}c{/Control}');
}

/** The document-level "copy all formulas as MathML" action lives in the EXPORT PANEL
 *  (`appShell.ts`/`exportControls.ts`), not the reader pane alone — this harness mirrors
 *  `exportPanel.browser.test.ts`'s own `mountWithFile`/`openPanel` shape (each browser test file
 *  owns its own copy; nothing here is shared/imported across files). */
function fakeStore(): AppStore {
  return {
    putFolder: async () => undefined,
    deleteFolder: async () => undefined,
    putRecent: async () => undefined,
  };
}
function mdFile(text: string): MarkdownFile {
  return { path: 'doc.md', name: 'doc.md', read: async () => text };
}
function memorySource(text: string): FolderSource {
  return { name: 'docs', truncated: false, persistable: false, files: [mdFile(text)] };
}

async function mountWithMath(
  markdown: string,
): Promise<{ container: HTMLElement; toggle: HTMLButtonElement; shadow: ShadowRoot }> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  cleanup.push(container);
  const app = mountAppShell(container, {
    openFolder: async () => ({ ok: true, source: memorySource(markdown) }),
    store: fakeStore(),
  });
  await app.openFolder();
  const fileBtn = await waitFor(() =>
    container.querySelector<HTMLButtonElement>('[role="treeitem"][data-kind="file"]'),
  );
  fileBtn.click();
  const host = await waitFor(() =>
    container.querySelector<HTMLElement>('.peekover-app__reader__host'),
  );
  if (!host.shadowRoot) throw new Error('reader pane produced no mounted host');
  return {
    container,
    toggle: container.querySelector<HTMLButtonElement>('.peekover-app__export-toggle')!,
    shadow: host.shadowRoot,
  };
}

async function openExportPanel(container: HTMLElement, toggle: HTMLButtonElement): Promise<HTMLElement> {
  toggle.click();
  return waitFor(() => container.querySelector<HTMLElement>('.peekover-export'));
}

const mathMlRowIn = (panel: HTMLElement): HTMLButtonElement =>
  panel.querySelector<HTMLButtonElement>('[data-export="copy-math-mathml"]')!;
/** §8-1(b) FIX's own row. */
const mathLatexRowIn = (panel: HTMLElement): HTMLButtonElement =>
  panel.querySelector<HTMLButtonElement>('[data-export="copy-math-latex"]')!;
const exportStatusIn = (panel: HTMLElement): HTMLElement =>
  panel.querySelector<HTMLElement>(`.${EXPORT_STATUS_CLASS}`)!;

const actionsIn = (figure: Element) => figure.querySelector<HTMLElement>(`.${MATH_ACTIONS_CLASS}`)!;
const statusIn = (figure: Element) => figure.querySelector<HTMLElement>(`.${MATH_STATUS_CLASS}`)!;
/** Found BY CLASS ALONE, never `button.${MATH_ACTION_CLASS}` — a tag-qualified selector cannot
 *  falsify "these ARE real buttons" (the row-16 claim below actually checks `tagName`). */
const buttonsIn = (figure: Element) => [...figure.querySelectorAll<HTMLElement>(`.${MATH_ACTION_CLASS}`)];
const latexButtonIn = (figure: Element) =>
  buttonsIn(figure).find((b) => b.dataset.action === 'copy-latex')!;
const mathmlButtonIn = (figure: Element) =>
  buttonsIn(figure).find((b) => b.dataset.action === 'copy-mathml')!;

async function waitFor<T>(fn: () => T | null | undefined | false, tries = 400): Promise<T> {
  for (let i = 0; i < tries; i += 1) {
    const v = fn();
    if (v) return v as T;
    await new Promise<void>((r) => setTimeout(r, 20));
  }
  throw new Error('waitFor timed out');
}

async function clickAndSettle(figure: Element, button: HTMLElement): Promise<string> {
  statusIn(figure).textContent = '';
  await userEvent.click(button);
  return waitFor(() => statusIn(figure).textContent || null);
}

// ── The engines' clipboard consent (`tableCopy.browser.test.ts`'s own shape, duplicated) ───────

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

beforeEach(async () => {
  if ((await clipboardWriteConsent()) === 'unsupported') return; // Gecko has nothing to reset
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

/** Grant consent (Chromium) / no-op (Firefox — the gesture alone is the gate), mirroring
 *  `tableCopy.browser.test.ts`'s own per-case branch. */
async function ensureClipboardWritable(): Promise<void> {
  if ((await clipboardWriteConsent()) !== 'unsupported') await grantClipboardConsent();
}

// ══ ROWS 11/16/17/20 — TWO REAL BUTTONS, KEYBOARD-REACHABLE, NAMED, WITH A LIVE REGION ═══════

describe('6.1-R · the block control group — existence, keyboard, names, live region', () => {
  it('a rendered figure carries exactly two real <button>s, both painted', async () => {
    const { shadow } = await appPageReader('$$x^2$$\n');
    await settleMath(shadow, 1);
    const figure = shadow.querySelector(FIGURE_SELECTOR)!;

    const buttons = buttonsIn(figure);
    expect(buttons).toHaveLength(2);
    for (const b of buttons) {
      expect(b.tagName).toBe('BUTTON');
      const rect = b.getBoundingClientRect();
      expect(rect.width).toBeGreaterThan(0);
      expect(rect.height).toBeGreaterThan(0);
    }
    expect(actionsIn(figure).getAttribute('role')).toBe('group');
  });

  it('row 16 — reachable and activatable by keyboard alone, no tabindex hack', async () => {
    const { shadow } = await appPageReader('$$x^2$$\n');
    await settleMath(shadow, 1);
    const figure = shadow.querySelector(FIGURE_SELECTOR)!;
    const latex = latexButtonIn(figure);
    const mathml = mathmlButtonIn(figure);

    latex.focus();
    expect(shadow.activeElement).toBe(latex);
    await userEvent.tab();
    expect(shadow.activeElement, 'tab did not reach the MathML button').toBe(mathml);

    await ensureClipboardWritable();
    statusIn(figure).textContent = '';
    await userEvent.keyboard('{Enter}'); // a REAL key activation, not `.click()`
    const message = await waitFor(() => statusIn(figure).textContent || null);
    expect(message).toContain('Formula 1');
  });

  it('row 17 — the accessible name carries the selection AND the action, before and after', async () => {
    const { shadow } = await appPageReader('$$a$$\n\n$$b$$\n');
    await settleMath(shadow, 2);
    const figures = [...shadow.querySelectorAll(FIGURE_SELECTOR)];
    const secondLatex = latexButtonIn(figures[1]);

    expect(secondLatex.getAttribute('aria-label')).toBe('Formula 2. Activate to copy it as LaTeX.');
    await ensureClipboardWritable();
    await clickAndSettle(figures[1], secondLatex);
    expect(secondLatex.getAttribute('aria-label')).toBe(
      'Formula 2 copied as LaTeX. Activate to copy it again.',
    );
    expect(secondLatex.getAttribute(MATH_ACTION_STATE_ATTR)).toBe('done');
  });

  it('row 20 — the live region is `role=status`, `hidden` while silent, painted once it speaks', async () => {
    const { shadow } = await appPageReader('$$x^2$$\n');
    await settleMath(shadow, 1);
    const figure = shadow.querySelector(FIGURE_SELECTOR)!;
    const status = statusIn(figure);

    expect(status.getAttribute('role')).toBe('status');
    expect(status.hidden).toBe(true);

    await ensureClipboardWritable();
    await clickAndSettle(figure, mathmlButtonIn(figure));
    expect(status.hidden).toBe(false);
    expect(status.textContent).toBe('Formula 1 copied as MathML.');
  });
});

// ══ COPY-AS-LATEX — THE RETAINED SOURCE, BYTE-IDENTICAL, THROUGH THE REAL CLIPBOARD ══════════

/** The OS clipboard normalizes `\n` to `\r\n` on Windows/Chromium (measured here, matching
 *  `tableCopy.browser.test.ts`'s own documented finding for the same platform/engine pair) —
 *  Gecko returns the text unchanged. Normalizing before comparison pins the SERIALIZER's own exact
 *  bytes (asserted directly by reading the retained `<pre>` text), not an OS clipboard behaviour a
 *  test named for this control group has no business asserting.
 */
const crlfToLf = (s: string): string => s.replace(/\r\n/g, '\n');

describe('6.1-R · copy-as-LaTeX — the exact retained source, real clipboard', () => {
  it('an escaped `\\$` fixture copies byte-identical, trailing newline included', async () => {
    const { shadow } = await appPageReader(ESCAPED_DOLLAR_DOC);
    await settleMath(shadow, 1);
    const figure = shadow.querySelector(FIGURE_SELECTOR)!;

    await ensureClipboardWritable();
    const settled = await clickAndSettle(figure, latexButtonIn(figure));
    // The bytes FIRST — an ablated copy that echoed the wrong string would still settle with a
    // correct-looking confirmation text, so the clause that inspects the actual bytes must run
    // before the one that only checks the confirmation.
    expect(crlfToLf(await navigator.clipboard.readText())).toBe(ESCAPED_DOLLAR_SOURCE);
    expect(settled).toBe('Formula 1 copied as LaTeX.');
  });

  it('a multi-line dollar-block copies byte-identical, including its own trailing newline', async () => {
    const { shadow } = await appPageReader(MULTILINE_DOC);
    await settleMath(shadow, 1);
    const figure = shadow.querySelector(FIGURE_SELECTOR)!;

    await ensureClipboardWritable();
    await clickAndSettle(figure, latexButtonIn(figure));
    expect(crlfToLf(await navigator.clipboard.readText())).toBe(MULTILINE_SOURCE);
  });

  it('reads the RETAINED SOURCE, never a round trip through the rendered tree', async () => {
    // The source keeps its escaping backslash AND its interior spacing AND its trailing newline;
    // Temml's own rendered `<math>` tree does none of those — its textContent for this formula is
    // the collapsed, backslash-free glyph string `x+$5`. A copy that read the rendered tree (e.g.
    // via `textContent`) rather than the retained `<pre>` would produce THAT string, not the
    // source, and this fixture tells the two apart on three independent axes at once.
    const { shadow } = await appPageReader(ESCAPED_DOLLAR_DOC);
    await settleMath(shadow, 1);
    const figure = shadow.querySelector(FIGURE_SELECTOR)!;
    const liveMathText = figure.querySelector('math')!.textContent;

    await ensureClipboardWritable();
    await clickAndSettle(figure, latexButtonIn(figure));
    const copied = crlfToLf(await navigator.clipboard.readText());

    expect(copied).toBe(ESCAPED_DOLLAR_SOURCE);
    expect(copied).not.toBe(liveMathText);
    expect(copied).toContain('\\'); // the retained source keeps the escaping backslash
    expect(liveMathText).not.toContain('\\'); // the rendered glyph string never does
  });
});

// ══ COPY-AS-MATHML — A WELL-FORMED <math> ROOT, THE ONE ON SCREEN, ROUND-TRIPPED ═════════════

describe('6.1-R · copy-as-MathML — the live tree, cloned and serialized, zero new deps', () => {
  it('the clipboard text is a well-formed <math> root a real XML parser round-trips', async () => {
    const { shadow } = await appPageReader('$$x^2 + y^2$$\n');
    await settleMath(shadow, 1);
    const figure = shadow.querySelector(FIGURE_SELECTOR)!;
    const liveMath = figure.querySelector('math')!;

    await ensureClipboardWritable();
    await clickAndSettle(figure, mathmlButtonIn(figure));
    const mathml = await navigator.clipboard.readText();

    expect(mathml.startsWith('<math')).toBe(true);
    expect(mathml).toContain(`xmlns="${MATHML_NS}"`);

    const parsed = new DOMParser().parseFromString(mathml, 'application/xml');
    expect(
      parsed.querySelector('parsererror'),
      `not well-formed XML: ${mathml}`,
    ).toBeNull();
    expect(parsed.documentElement.localName).toBe('math');
    expect(parsed.documentElement.namespaceURI).toBe(MATHML_NS);

    // ★ THE ONE ON SCREEN, NOT A STALE COPY — content matches the LIVE tree's own text exactly.
    expect(parsed.documentElement.textContent).toBe(liveMath.textContent);
  });

  it('reflects a genuinely different formula`s own tree, not a fixed/cached string', async () => {
    const { shadow } = await appPageReader('$$a$$\n\n$$bbb$$\n');
    await settleMath(shadow, 2);
    const figures = [...shadow.querySelectorAll(FIGURE_SELECTOR)];

    await ensureClipboardWritable();
    await clickAndSettle(figures[0], mathmlButtonIn(figures[0]));
    const first = await navigator.clipboard.readText();
    await clickAndSettle(figures[1], mathmlButtonIn(figures[1]));
    const second = await navigator.clipboard.readText();

    expect(first).not.toBe(second);
    expect(new DOMParser().parseFromString(first, 'application/xml').documentElement.textContent).toBe(
      'a',
    );
    expect(
      new DOMParser().parseFromString(second, 'application/xml').documentElement.textContent,
    ).toBe('bbb');
  });
});

// ══ ROW 14 — THE CONTROL GROUP SURVIVES A RE-RENDER: RE-ATTACHED, NEVER REBUILT ═══════════════
//
// Math ships no theme-triggered re-render (D-9-R), so nothing in production calls
// `markMathRendered` twice on the same figure today — but the FUNCTION itself must hold this
// property regardless (the same `diagramView.ts`/`markDiagramRendered` shape this task reuses
// verbatim), proven directly against the exported function rather than waiting on a production
// call site that does not exist yet. RED-FIRST: an ablation that made `markMathRendered`
// unconditionally rebuild the controls (`buildMathControls(figure)` with no `mathControlsOf(figure)
// ??` reuse) was run by hand during drafting and made this test's own identity assertions fail
// (`expected <div class="peekover-math-actions">… to be <div class="peekover-math-actions">…`) —
// reverted before this commit, per AGENTS.md's ablation-not-narration rule.

describe('6.1-R · row 14 — the control group is RE-ATTACHED across a second render, never rebuilt', () => {
  it('the SAME group/status nodes persist; only the content swaps', () => {
    const pre = document.createElement('pre');
    pre.innerHTML = '<code class="language-math">$$x$$</code>';
    document.body.appendChild(pre);
    const figure = insertMathPlaceholder(pre);

    const mathA = document.createElementNS(MATHML_NS, 'math');
    mathA.textContent = 'A';
    markMathRendered(pre, figure, mathA);
    const group1 = actionsIn(figure);
    const status1 = statusIn(figure);
    expect(figure.querySelector('math')).toBe(mathA);

    const mathB = document.createElementNS(MATHML_NS, 'math');
    mathB.textContent = 'B';
    markMathRendered(pre, figure, mathB); // simulates a second render pass on the SAME figure

    expect(actionsIn(figure), 'the group was rebuilt instead of re-attached').toBe(group1);
    expect(statusIn(figure), 'the live region was rebuilt instead of re-attached').toBe(status1);
    expect(figure.querySelector('math'), 'the content did not actually swap').toBe(mathB);
    // Content stays FIRST (mirrors `mathEnhancer.test.ts:235`'s own pin).
    expect(figure.firstElementChild).toBe(mathB);

    pre.remove();
    figure.remove();
  });
});

// ══ INLINE STILL HAS NO CONTROL GROUP — RE-CONFIRMED (5.1-R's own negative, unchanged) ═══════

describe('6.1-R · inline math is untouched by this task — no control group anywhere', () => {
  it('an inline-only document carries zero `.peekover-math-actions`/`.peekover-math-status`', async () => {
    const { shadow } = await appPageReader('Inline $x^2$ formula, no block at all.\n');
    await settleMath(shadow, 1);

    expect(shadow.querySelectorAll(`.${MATH_ACTIONS_CLASS}`)).toHaveLength(0);
    expect(shadow.querySelectorAll(`.${MATH_STATUS_CLASS}`)).toHaveLength(0);
    expect(shadow.querySelectorAll(FIGURE_SELECTOR)).toHaveLength(0);
  });

  it('the content-script surface reaches neither `enhanceMath` nor this control group (D-3-R)', () => {
    const shadow = contentScriptReader('$$x^2$$\n');
    expect(shadow.querySelectorAll(`.${MATH_ACTIONS_CLASS}`)).toHaveLength(0);
    expect(shadow.querySelectorAll(FIGURE_SELECTOR)).toHaveLength(0);
  });
});

// ══ 6.2-R · §8-1(b) INLINE COPY-AS-LATEX BY TEXT-SELECTION — TWO STATES, ONE GENUINE NON-CASE ═══
//
// See this file's own header for the full technical account of 6.2-R's own measurement. Text-
// selection of a SETTLED (successfully rendered) formula copies the rendered GLYPH string, never
// the source — 6.2-R found this FALSE against the gate-2 ruling's own "select-and-copy the retained
// source" claim, and it stays true post-§8-1(b)-FIX: `MATH_INLINE_SOURCE_ATTR` (`mathView.ts`) is
// an invisible DATA ATTRIBUTE, never a selectable node, so it changes NOTHING about what a
// `Range`/Ctrl+C selection of the `<code>` element itself copies (mechanism 1's own point — see
// `mathView.ts`'s own §8-1(b) FIX header for why mechanism 2, a visible/selectable hidden node,
// was rejected). This is no longer a residual DEFECT for the settled case — it is now the
// EXPECTED, permanent shape: the settled case recovers its source through the document-level
// "copy formulas as LaTeX" action instead (§8-1(b) FIX — proven further below), never through
// selecting the formula itself. A FAILED formula and the content-script surface still recover
// their source by plain selection, unaffected by any of this — proven unchanged below. No new
// per-formula inline chrome is added anywhere in this diff — row 11's own negative (5.1-R,
// re-confirmed by 6.1-R immediately above) is unaffected by this section and is not re-proven here.

describe('6.2-R · §8-1(b) — a SETTLED formula: text-selection copies the rendered glyph, NOT the source (still true, by design — see the FIX below)', () => {
  it('an escaped-`\\$` fixture, once rendered, still yields the rendered glyph on plain text-selection, never the source', async () => {
    const { shadow } = await appPageReader(INLINE_ESCAPED_DOLLAR_DOC);
    await settleMath(shadow, 1);
    const code = inlineCodeIn(shadow);
    expect(code.getAttribute(MATH_STATE_ATTR), 'firing control: genuinely settled, not pending').toBe(
      'rendered',
    );

    await ensureClipboardWritable();
    await selectAndCopy(code);
    // Normalizing engine-specific token-join whitespace (Chromium's own CRLF-per-token
    // linearization of the MathML layout vs. Firefox's single line) — the claim under test is
    // "is this the retained source", not "how does each engine join MathML tokens on copy".
    const copied = crlfToLf(await navigator.clipboard.readText()).replace(/\n/g, '');

    expect(copied, "the gate-2 ruling's own claim").not.toBe(INLINE_ESCAPED_DOLLAR_SOURCE);
    expect(copied, 'the rendered glyph string instead').toBe('x+$5');
  });

  it('a macro fixture ($\\alpha$) copies the rendered glyph too — unaffected by the temml patch or the §8-1(b) FIX', async () => {
    const { shadow } = await appPageReader(INLINE_MACRO_DOC);
    await settleMath(shadow, 1);
    const code = inlineCodeIn(shadow);
    expect(code.getAttribute(MATH_STATE_ATTR)).toBe('rendered');

    await ensureClipboardWritable();
    await selectAndCopy(code);
    const copied = crlfToLf(await navigator.clipboard.readText()).replace(/\n/g, '');

    expect(copied).not.toBe(`$${INLINE_MACRO_SOURCE}$`);
    expect(copied, "the rendered glyph never carries the macro's own backslash").not.toContain('\\');
  });
});

describe('6.2-R · §8-1(b) — the two states where the claim genuinely holds, verified', () => {
  it('a FAILED formula keeps its source selectable FOREVER (§3.9 never touches content)', async () => {
    const { shadow } = await appPageReader(INLINE_MALFORMED_DOC);
    await settleMath(shadow, 1);
    const code = inlineCodeIn(shadow);
    expect(code.getAttribute(MATH_STATE_ATTR), 'firing control: genuinely failed').toBe('failed');

    await ensureClipboardWritable();
    await selectAndCopy(code);
    expect(crlfToLf(await navigator.clipboard.readText())).toBe(`$${INLINE_MALFORMED_SOURCE}$`);
  });

  it('the content-script surface never enhances, so its marker stays selectable-as-source permanently', async () => {
    const shadow = contentScriptReader(INLINE_ESCAPED_DOLLAR_DOC);
    const code = inlineCodeIn(shadow);
    expect(code.hasAttribute(MATH_STATE_ATTR), 'firing control: D-3-R — never enhanced here').toBe(
      false,
    );

    await ensureClipboardWritable();
    await selectAndCopy(code);
    expect(crlfToLf(await navigator.clipboard.readText())).toBe(`$${INLINE_ESCAPED_DOLLAR_SOURCE}$`);
  });
});

// ══ 6.2-R · THE DOCUMENT-LEVEL "COPY ALL FORMULAS AS MathML" ACTION (§8-1(b), D-6-R) ══════════
//
// Lives in the export panel — `appShell.ts`'s `runCopyMathMathml` + `exportControls.ts`'s new
// `copy-math-mathml` row, gate-3-RULED placement (a panel/menu-row, never a toolbar button, never
// a keyboard shortcut — `decisions.md`'s M11 GATE 3 FINDING 2). The row's own generic shape (real
// button, accessible name, keyboard reachability) is proven for ALL SIX rows, this one included,
// by `exportPanel.browser.test.ts`'s own rows-6+7 suite (updated this task to expect 6 rows) — not
// re-proven here. What IS proven here is this row's own LIVE BEHAVIOUR: it actually collects and
// serializes every rendered formula, block and inline, through the real clipboard.

describe('6.2-R · the document-level MathML action — collects block AND inline, each round-trip-accepted', () => {
  it('a document with one block and one inline formula copies BOTH as individually well-formed <math> roots', async () => {
    const { container, toggle, shadow } = await mountWithMath(
      '$$x^2 + y^2$$\n\nInline $z^2$ formula.\n',
    );
    await settleMath(shadow, 2);
    const panel = await openExportPanel(container, toggle);

    await ensureClipboardWritable();
    await userEvent.click(mathMlRowIn(panel));
    await waitFor(() => exportStatusIn(panel).textContent || null);

    const payload = await navigator.clipboard.readText();
    const lines = payload.split('\n').filter((l) => l.length > 0);
    expect(lines).toHaveLength(2);
    for (const line of lines) {
      const parsed = new DOMParser().parseFromString(line, 'application/xml');
      expect(parsed.querySelector('parsererror'), `not well-formed XML: ${line}`).toBeNull();
      expect(parsed.documentElement.localName).toBe('math');
      expect(parsed.documentElement.namespaceURI).toBe(MATHML_NS);
    }
    expect(lines.some((l) => l.includes('x') && l.includes('y')), 'the block formula').toBe(true);
    expect(lines.some((l) => l.includes('z')), 'the inline formula').toBe(true);
  });

  it('reflects genuinely different documents, not a fixed/cached string', async () => {
    const first = await mountWithMath('$$a$$\n');
    await settleMath(first.shadow, 1);
    const panel1 = await openExportPanel(first.container, first.toggle);
    await ensureClipboardWritable();
    await userEvent.click(mathMlRowIn(panel1));
    await waitFor(() => exportStatusIn(panel1).textContent || null);
    const payloadA = await navigator.clipboard.readText();

    const second = await mountWithMath('$$bbb$$\n');
    await settleMath(second.shadow, 1);
    const panel2 = await openExportPanel(second.container, second.toggle);
    await ensureClipboardWritable();
    await userEvent.click(mathMlRowIn(panel2));
    await waitFor(() => exportStatusIn(panel2).textContent || null);
    const payloadB = await navigator.clipboard.readText();

    expect(payloadA).not.toBe(payloadB);
    expect(new DOMParser().parseFromString(payloadA, 'application/xml').documentElement.textContent).toBe(
      'a',
    );
    expect(new DOMParser().parseFromString(payloadB, 'application/xml').documentElement.textContent).toBe(
      'bbb',
    );
  });

  it('the row is a real button whose accessible name carries the action, and the live region confirms', async () => {
    const { container, toggle, shadow } = await mountWithMath('$$x^2$$\n');
    await settleMath(shadow, 1);
    const panel = await openExportPanel(container, toggle);
    const row = mathMlRowIn(panel);

    expect(row.tagName).toBe('BUTTON');
    expect(row.getAttribute('aria-label')).toBe('Copy formulas as MathML');
    const status = exportStatusIn(panel);
    expect(status.getAttribute('role')).toBe('status');
    expect(status.hidden).toBe(true);

    await ensureClipboardWritable();
    await userEvent.click(row);
    await waitFor(() => status.textContent || null);

    expect(row.getAttribute('aria-label')).toBe(
      'Copy formulas as MathML — copied. Activate to copy again.',
    );
    expect(row.getAttribute(EXPORT_ROW_STATE_ATTR)).toBe('done');
    expect(status.hidden).toBe(false);
    expect(status.textContent).toBe('Copy formulas as MathML copied.');
  });

  it('a document with NO rendered formula reports failure — never a false "Copied" (AGENTS.md #5)', async () => {
    const { container, toggle } = await mountWithMath('# No math here\n\nJust prose.\n');
    const panel = await openExportPanel(container, toggle);
    const row = mathMlRowIn(panel);
    const status = exportStatusIn(panel);

    await ensureClipboardWritable();
    await userEvent.click(row);
    await waitFor(() => status.textContent || null);

    expect(row.getAttribute(EXPORT_ROW_STATE_ATTR)).toBe('failed');
    expect(status.textContent).toContain('could not be copied');
  });
});

// ══ §8-1(b) FIX · THE DOCUMENT-LEVEL LaTeX ACTION — THE RED-FIRST INLINE SOURCE-RECOVERY GUARD ═
//
// This is the test 6.2-R could NOT write — the gap was real then (no mechanism existed to recover
// a settled inline formula's source by ANY means). `mathView.ts` gained `MATH_INLINE_SOURCE_ATTR`
// (set on `markMathInlineRendered`, mechanism 1 of that file's own two-mechanism diagnosis) and
// `copyAllMathAsLatex`/`serializedMathSourceDocument`/`allMathSourcesIn` (the document-level read
// side, mirroring 6.2-R's own MathML action exactly). Lives in the SAME export panel —
// `appShell.ts`'s `runCopyMathLatex` + `exportControls.ts`'s new `copy-math-latex` row, the
// identical gate-3-ruled placement (`decisions.md`'s M11 GATE 3 FINDING 2) `copy-math-mathml`
// already uses. The row's own generic shape (real button, accessible name, keyboard reachability)
// is proven for ALL SEVEN rows by `exportPanel.browser.test.ts`'s own rows-6+7 suite (updated this
// task to expect 7) — not re-proven here; what IS proven here is this row's own LIVE BEHAVIOUR.
//
// ── ★ RED-FIRST, GENUINELY RUN ────────────────────────────────────────────────────────────────
//
// A real ablation (commenting out `markMathInlineRendered`'s own
// `code.setAttribute(MATH_INLINE_SOURCE_ATTR, ...)` line in `mathView.ts`, rebuilding nothing —
// this suite runs against source, not `.output`) was run by hand while drafting the first test
// below: it read RED, `expected '' to be 'x + \\$5\n'` — `allMathSourcesIn`'s own
// `el.getAttribute(MATH_INLINE_SOURCE_ATTR) ?? ''` fallback returning the empty string for every
// inline marker, the exact "no mechanism, no recovery" shape 6.2-R's own gap named. Reverted
// before this commit, per AGENTS.md's ablation-not-narration rule.

describe('§8-1(b) FIX · a SETTLED inline formula recovers its exact LaTeX source via the document-level action', () => {
  it('★ THE FIX, PROVEN: an escaped-`\\$` inline fixture recovers its byte-identical source, never the glyph', async () => {
    const { container, toggle, shadow } = await mountWithMath(INLINE_ESCAPED_DOLLAR_DOC);
    await settleMath(shadow, 1);
    const code = inlineCodeIn(shadow);
    expect(code.getAttribute(MATH_STATE_ATTR), 'firing control: genuinely settled').toBe('rendered');
    const panel = await openExportPanel(container, toggle);

    await ensureClipboardWritable();
    await userEvent.click(mathLatexRowIn(panel));
    await waitFor(() => exportStatusIn(panel).textContent || null);

    const copied = crlfToLf(await navigator.clipboard.readText());
    expect(copied, 'the exact retained source, byte-identical').toBe(INLINE_ESCAPED_DOLLAR_SOURCE);
    expect(copied, 'never the rendered glyph string').not.toBe('x+$5');
  });

  it('a macro fixture ($\\alpha$) recovers its own source too, backslash intact', async () => {
    const { container, toggle, shadow } = await mountWithMath(INLINE_MACRO_DOC);
    await settleMath(shadow, 1);
    const panel = await openExportPanel(container, toggle);

    await ensureClipboardWritable();
    await userEvent.click(mathLatexRowIn(panel));
    await waitFor(() => exportStatusIn(panel).textContent || null);

    expect(crlfToLf(await navigator.clipboard.readText())).toBe(INLINE_MACRO_SOURCE);
  });

  it('a document with one block and one inline formula recovers BOTH sources, blank-line-separated', async () => {
    const { container, toggle, shadow } = await mountWithMath(
      '$$x^2 + y^2$$\n\nInline $z^2$ formula.\n',
    );
    await settleMath(shadow, 2);
    const panel = await openExportPanel(container, toggle);

    await ensureClipboardWritable();
    await userEvent.click(mathLatexRowIn(panel));
    await waitFor(() => exportStatusIn(panel).textContent || null);

    const payload = crlfToLf(await navigator.clipboard.readText());
    // The block source's OWN trailing newline (dollar-block origin, this file's own header) plus
    // the `\n\n` separator itself produces three consecutive newlines at the boundary — trimming
    // each part is the honest way to check "two formulas, boundary hygiene present", without
    // asserting the exact newline COUNT at that boundary (not this test's own claim).
    const parts = payload.split('\n\n').map((p) => p.trim());
    expect(parts, `unexpected payload shape: ${JSON.stringify(payload)}`).toHaveLength(2);
    expect(parts.some((p) => p.includes('x^2') && p.includes('y^2')), 'the block formula').toBe(true);
    expect(parts.some((p) => p === 'z^2'), 'the inline formula, byte-identical once trimmed').toBe(
      true,
    );
  });

  it('the row is a real button whose accessible name carries the action, and the live region confirms', async () => {
    const { container, toggle, shadow } = await mountWithMath(INLINE_MACRO_DOC);
    await settleMath(shadow, 1);
    const panel = await openExportPanel(container, toggle);
    const row = mathLatexRowIn(panel);

    expect(row.tagName).toBe('BUTTON');
    expect(row.getAttribute('aria-label')).toBe('Copy formulas as LaTeX');
    const status = exportStatusIn(panel);
    expect(status.getAttribute('role')).toBe('status');
    expect(status.hidden).toBe(true);

    await ensureClipboardWritable();
    await userEvent.click(row);
    await waitFor(() => status.textContent || null);

    expect(row.getAttribute('aria-label')).toBe(
      'Copy formulas as LaTeX — copied. Activate to copy again.',
    );
    expect(row.getAttribute(EXPORT_ROW_STATE_ATTR)).toBe('done');
    expect(status.hidden).toBe(false);
    expect(status.textContent).toBe('Copy formulas as LaTeX copied.');
  });

  it('a document with NO rendered formula reports failure — never a false "Copied" (AGENTS.md #5)', async () => {
    const { container, toggle } = await mountWithMath('# No math here\n\nJust prose.\n');
    const panel = await openExportPanel(container, toggle);
    const row = mathLatexRowIn(panel);
    const status = exportStatusIn(panel);

    await ensureClipboardWritable();
    await userEvent.click(row);
    await waitFor(() => status.textContent || null);

    expect(row.getAttribute(EXPORT_ROW_STATE_ATTR)).toBe('failed');
    expect(status.textContent).toContain('could not be copied');
  });

  it('a FAILED formula contributes nothing — only RENDERED formulas are collected', async () => {
    const { container, toggle, shadow } = await mountWithMath(
      `${INLINE_MALFORMED_DOC}\n$$x^2$$\n`,
    );
    await settleMath(shadow, 2);
    const panel = await openExportPanel(container, toggle);

    await ensureClipboardWritable();
    await userEvent.click(mathLatexRowIn(panel));
    await waitFor(() => exportStatusIn(panel).textContent || null);

    const payload = crlfToLf(await navigator.clipboard.readText());
    // Dollar-block origin carries its own trailing newline in the retained source (this file's own
    // header, `ESCAPED_DOLLAR_SOURCE`'s shape) — the same rule applies here, not bare `'x^2'`.
    expect(payload, 'only the one rendered formula, the failed one excluded').toBe('x^2\n');
  });
});

// ══ THE MANIFEST — `permissions: []` RE-PROVEN AFTER A REAL COPY HAS RUN, NO `contextMenus` ═══

const BUILT_MANIFESTS = import.meta.glob('/.output/*/manifest.json', {
  eager: true,
  import: 'default',
}) as Record<string, Record<string, unknown>>;

function capabilityViolations(manifest: Record<string, unknown>): string[] {
  const found: string[] = [];
  const perms = manifest.permissions;
  if (!Array.isArray(perms)) found.push('permissions is missing or not an array');
  else if (perms.length > 0) found.push(`permissions requests: ${perms.join(', ')}`);
  for (const key of ['host_permissions', 'web_accessible_resources', 'webRequest'] as const) {
    if (manifest[key] !== undefined) found.push(`forbidden key present: ${key}`);
  }
  return found;
}

describe('6.1-R/6.2-R · the manifest asked for nothing, not even after a real copy ran', () => {
  it('the check FIRES on a manifest that does ask for `contextMenus`', () => {
    expect(capabilityViolations({ permissions: ['contextMenus'] })).toContain(
      'permissions requests: contextMenus',
    );
    expect(capabilityViolations({ permissions: [] })).toEqual([]);
  });

  it.skipIf(Object.keys(BUILT_MANIFESTS).length === 0)(
    '★ BOTH built manifests still read `permissions: []` after copy-as-LaTeX and copy-as-MathML ran',
    async () => {
      // ★ 6.2-R's own robustness fix (a pre-existing hazard this task's added test volume
      // surfaced, not a defect this task's own logic introduced, and not fixable by fixture
      // content — measured directly): `appPageReader`'s bare pane gives no real watch target, so
      // `mount()`'s own `buildWatchChrome` always renders the `position:fixed` "Watching isn't
      // available…" note, anchored a constant distance from the test iframe's OWN bottom edge —
      // which auto-sizes to the rendered content's height. Because the note's position is pinned
      // relative to that same auto-growing bottom edge, no amount of fixture content moves a
      // trailing formula out from under it: the note simply trails the content, real-engine, both
      // browsers (measured: `getBoundingClientRect()` on both elements showed the note's box
      // growing to keep the same offset from the frame's bottom regardless of document length).
      // This test's own CLAIM is the post-copy MANIFEST state, not click realism — real-pointer
      // click interaction is already proven elsewhere in this file (row 16, `mathActions
      // .browser.test.ts`'s own keyboard-activation test) — so this ONE test uses a plain
      // synthetic `.click()` instead of `clickAndSettle`'s real-pointer `userEvent.click()`,
      // sidestepping the hit-test hazard entirely rather than chasing fixture-size heuristics.
      const { shadow } = await appPageReader('$$x^2$$\n');
      await settleMath(shadow, 1);
      const figure = shadow.querySelector(FIGURE_SELECTOR)!;

      const clickAndSettleSynthetic = async (button: HTMLElement): Promise<string> => {
        statusIn(figure).textContent = '';
        button.click();
        return waitFor(() => statusIn(figure).textContent || null);
      };

      await ensureClipboardWritable();
      expect(await clickAndSettleSynthetic(latexButtonIn(figure))).toBe('Formula 1 copied as LaTeX.');
      expect(await clickAndSettleSynthetic(mathmlButtonIn(figure))).toBe(
        'Formula 1 copied as MathML.',
      );

      const engines = Object.keys(BUILT_MANIFESTS).sort();
      expect(engines, 'both engines must have been built for this re-proof').toEqual([
        '/.output/chrome-mv3/manifest.json',
        '/.output/firefox-mv3/manifest.json',
      ]);
      for (const engine of engines) {
        expect(capabilityViolations(BUILT_MANIFESTS[engine]), engine).toEqual([]);
      }
    },
  );

  // ── 6.2-R's own re-proof, kept SEPARATE from the test above rather than combined into it: the
  // two harnesses (`appPageReader`'s bare reader pane vs. `mountWithMath`'s full app shell, folder
  // tree, and watch-availability note included) do not share a container-cleanup lifecycle, and a
  // first drafting attempt that ran BOTH harnesses inside one `it` produced real-browser pointer-
  // event interception from the still-mounting app shell's own watch-note banner onto the bare
  // pane's control-group buttons — a harness-shared-state hazard (AGENTS.md), not a defect in
  // either harness alone. Kept as its own test/container lifecycle, the interception does not occur.
  it.skipIf(Object.keys(BUILT_MANIFESTS).length === 0)(
    '★ BOTH built manifests still read `permissions: []` after the document-level MathML action ran',
    async () => {
      const { container, toggle, shadow } = await mountWithMath('$$y^2$$\n');
      await settleMath(shadow, 1);
      const panel = await openExportPanel(container, toggle);

      await ensureClipboardWritable();
      await userEvent.click(mathMlRowIn(panel));
      await waitFor(() => exportStatusIn(panel).textContent || null);

      const engines = Object.keys(BUILT_MANIFESTS).sort();
      expect(engines, 'both engines must have been built for this re-proof').toEqual([
        '/.output/chrome-mv3/manifest.json',
        '/.output/firefox-mv3/manifest.json',
      ]);
      for (const engine of engines) {
        expect(capabilityViolations(BUILT_MANIFESTS[engine]), engine).toEqual([]);
      }
    },
  );
});

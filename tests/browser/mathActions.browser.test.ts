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

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { userEvent, cdp } from 'vitest/browser';
import { createReaderPane } from '../../src/app/readerPane';
import { mount } from '../../src/render/mount';
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

describe('6.1-R · the manifest asked for nothing, not even after a real copy ran', () => {
  it('the check FIRES on a manifest that does ask for `contextMenus`', () => {
    expect(capabilityViolations({ permissions: ['contextMenus'] })).toContain(
      'permissions requests: contextMenus',
    );
    expect(capabilityViolations({ permissions: [] })).toEqual([]);
  });

  it.skipIf(Object.keys(BUILT_MANIFESTS).length === 0)(
    '★ BOTH built manifests still read `permissions: []` after copy-as-LaTeX and copy-as-MathML ran',
    async () => {
      const { shadow } = await appPageReader('$$x^2$$\n');
      await settleMath(shadow, 1);
      const figure = shadow.querySelector(FIGURE_SELECTOR)!;

      await ensureClipboardWritable();
      expect(await clickAndSettle(figure, latexButtonIn(figure))).toBe('Formula 1 copied as LaTeX.');
      expect(await clickAndSettle(figure, mathmlButtonIn(figure))).toBe(
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
});

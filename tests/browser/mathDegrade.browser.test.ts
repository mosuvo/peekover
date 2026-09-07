// ★ BLOCK/FENCE MATH'S §3.9 DEGRADATION, REAL ENGINE, BOTH BROWSERS (task 4.3-R, block half — the
// inline half is 5.1-R's own file, per this file's own Files line).
//
// §3.9's three failures, restated for math: the engine fails to load (document-wide — no fence got
// as far as having its own failure); a formula fails to parse or render (per-fence, isolated); the
// sanitizer rejects the rendered output (the latest-moment failure, after the engine already
// "succeeded"). All three already exist as CODE in `mathEnhancer.ts`'s `renderMathBlocks`/
// `renderMathFormula` (landed 4.2-R) — D-8-R's own text: block/fence math "reuse 007's sibling-
// figure machinery verbatim," and this try/catch shape is a byte-for-byte structural port of
// `diagramEnhancer.ts`'s `renderDiagrams`/`drawDiagram`. This file's own job is therefore NOT to
// discover a new mechanism; it is to prove the mechanism holds for TEMML — a different engine,
// different failure surface (LaTeX parse errors, MathML output) — in real Chromium and Firefox,
// which is beyond what `src/render/mathEnhancer.test.ts`'s jsdom+fake-engine suite (4.2-R) can
// reach (that file's own header names exactly this gap).
//
// ── ★ RED-FIRST, DISCHARGED BY CITATION FOR THE SHARED MECHANISM, EARNED FRESH FOR WHAT IS NEW ──
//
// AGENTS.md's own standing rule: "Red-first ablations earn their keep on novel assertions. A test
// extension that mirrors an already-established pattern's shape doesn't need its own per-extension
// ablation — the pattern's original ablation is standing precedent, cite it instead of re-earning
// it." The STATE-MACHINE-LEVEL claims below (one document-wide catch fails every fence identically;
// an isolated per-fence failure leaves siblings untouched; a sanitizer rejection after a successful
// render still degrades to source) are exactly the shape `diagramDegrade.browser.test.ts`'s own
// "6.1 — the engine chunk never arrives" block and `diagramRender.browser.test.ts`'s own render-
// failure/sanitize-rejection arms already earned with a real revert-and-fail against `mermaid` —
// this file cites those or as its standing precedent for the MECHANISM rather than re-deriving it
// against `mathEnhancer.ts`'s own source.
//
// What IS novel here, and gets its own non-vacuous proof rather than a citation:
//   (1) Temml's real parse-failure surface (arm B) — a genuinely malformed LaTeX source thrown by
//       the REAL installed `temml`, not a stubbed rejection.
//   (2) sanitizeMath's real rejection surface (arm C) — engine output that genuinely lacks a
//       `<math>` root, produced by corrupting REAL Temml output (the same "wrap the real engine,
//       transform its return value" technique `diagramRender.browser.test.ts`'s own `instrumented`
//       helper uses for mermaid, ported here for Temml), not a hand-written fixture string.
//   (3) Every arm's "the OTHER fence still renders" control is read against a REAL sibling `<math>`
//       tree Temml actually produced in the same document pass, never a fake.
// Each arm also carries its own NON-VACUOUS CONTROL (a fixture that must succeed on the identical
// harness), which is itself a revert-and-fail in the fixture rather than the source: an
// implementation that broke per-fence isolation would make the "good" sibling fail too, and an
// implementation that broke the document-wide catch would make the control fixture (loader omitted)
// behave identically to the failing one — both are directly observable below, not merely assumed.

import { describe, it, expect, afterEach } from 'vitest';
import { mount } from '../../src/render/mount';
import { enhanceMath } from '../../src/render/mathEnhancer';
import { loadTemml, type EngineLoader, type MathEngine, type MathEngineModule } from '../../src/render/mathEngine';
import { MATH_ERROR_CLASS, MATH_FIGURE_CLASS, MATH_STATE_ATTR } from '../../src/render/mathView';

const FIGURE_SELECTOR = `figure.${MATH_FIGURE_CLASS}`;
const PRE_SELECTOR = `pre[${MATH_STATE_ATTR}]`;

const cleanup: HTMLElement[] = [];
afterEach(() => {
  for (const el of cleanup.splice(0)) el.remove();
});

/** `appShell.ts`/`readerPane.ts`'s shipped body: mount, then enhance. The only shape an injected
 *  loader can enter through — production callers pass neither options nor a loader. */
function enhancedReader(markdown: string, loader?: EngineLoader): ShadowRoot {
  const host = document.createElement('div');
  document.body.appendChild(host);
  cleanup.push(host);
  mount(markdown, host, { contained: true });
  enhanceMath(host, loader ? { loader } : {});
  if (!host.shadowRoot) throw new Error('expected a mounted host');
  return host.shadowRoot;
}

/** Wait until nothing under `shadow` is `pending` — `rendered` AND `failed` both leave that state,
 *  so a document that never settles is one whose enhancement DIED rather than degraded. */
async function settleMath(shadow: ShadowRoot, tries = 600): Promise<void> {
  for (let i = 0; i < tries; i += 1) {
    if (shadow.querySelectorAll(`[${MATH_STATE_ATTR}="pending"]`).length === 0) return;
    await new Promise<void>((r) => setTimeout(r, 25));
  }
  const stuck = shadow.querySelectorAll(`[${MATH_STATE_ATTR}="pending"]`).length;
  throw new Error(
    `the degradation never happened: ${stuck} node(s) left pending, of ` +
      `${shadow.querySelectorAll(PRE_SELECTOR).length} enhanced fences — the pass died rather than ` +
      `degrading`,
  );
}

function fences(shadow: ShadowRoot): HTMLElement[] {
  return [...shadow.querySelectorAll<HTMLElement>(PRE_SELECTOR)];
}

function placeholders(shadow: ShadowRoot): Element[] {
  return [...shadow.querySelectorAll(`${FIGURE_SELECTOR}[${MATH_STATE_ATTR}="pending"]`)];
}

/**
 * Wrap the REAL `loadTemml()` so a test can observe and/or corrupt what a genuine `renderToString`
 * call returns, without touching `mathEngine.ts`. Mirrors `diagramRender.browser.test.ts`'s own
 * `instrumented({ svg })` helper exactly — everything up to and including the real engine call is
 * real; only the string handed onward to `sanitizeMath` is transformed.
 */
function instrumentedMath(transform: (mathml: string, source: string) => string): {
  loader: EngineLoader;
  raw: string[];
} {
  const raw: string[] = [];
  const loader: EngineLoader = async () => {
    const real = (await loadTemml()).default;
    const engine: MathEngine = {
      renderToString: (source, options) => {
        const result = real.renderToString(source, options);
        raw.push(result);
        return transform(result, source);
      },
    };
    return { default: engine } as MathEngineModule;
  };
  return { loader, raw };
}

const OPENING = 'Opening prose, above every formula in this document.';
const CLOSING = 'Closing prose, below every formula in this document.';
const PLAIN_FENCE_SOURCE = "const notMath = 'ordinary code, left entirely alone';";

// ── ARM A — the engine chunk never arrives: every fence stays a readable code fence ─────────────

describe('A — the engine fails to load: every fence degrades, document-wide (D-4-R)', () => {
  const FORMULAS = ['alpha^2', 'beta^2', 'gamma^2'] as const;

  const MULTI_FORMULA_DOC = [
    '# A document with three formulas',
    '',
    OPENING,
    '',
    ...FORMULAS.map((f) => `\`\`\`math\n${f}\n\`\`\`\n`),
    '```js',
    PLAIN_FENCE_SOURCE,
    '```',
    '',
    CLOSING,
    '',
  ].join('\n');

  const chunkUnavailable: EngineLoader = async () => {
    throw new Error('Failed to fetch dynamically imported module: chunks/temml (test-only)');
  };

  it('★ all N fences fail IDENTICALLY, each showing its OWN source in full, RED-FIRST via the non-vacuous control', async () => {
    const shadow = enhancedReader(MULTI_FORMULA_DOC, chunkUnavailable);

    // NON-VACUITY axis 1: placeholders existed — read synchronously, before the async body can run.
    expect(
      placeholders(shadow),
      'the synchronous prologue inserted no placeholders, so the resolution claims below would be ' +
        'about an unenhanced document',
    ).toHaveLength(FORMULAS.length);

    await settleMath(shadow);

    const pres = fences(shadow);
    expect(pres).toHaveLength(FORMULAS.length);
    expect(pres.map((p) => p.getAttribute(MATH_STATE_ATTR))).toEqual(FORMULAS.map(() => 'failed'));

    FORMULAS.forEach((f, i) => {
      const pre = pres[i];
      expect(getComputedStyle(pre).display, `formula ${i}: display`).not.toBe('none');
      expect(pre.getBoundingClientRect().height, `formula ${i}: laid-out height`).toBeGreaterThan(0);
      expect(pre.textContent, `formula ${i}: source text`).toContain(f);
    });

    expect(placeholders(shadow), 'placeholders left stranded').toHaveLength(0);
    expect(shadow.querySelectorAll(FIGURE_SELECTOR), 'figures left over').toHaveLength(0);

    const markers = [...shadow.querySelectorAll(`.${MATH_ERROR_CLASS}`)];
    expect(markers).toHaveLength(FORMULAS.length);
    for (const marker of markers) {
      expect(marker.textContent).toContain('the math engine could not be loaded');
    }
    pres.forEach((pre, i) => expect(pre.nextElementSibling).toBe(markers[i]));

    // Never a blank page (AGENTS.md #5).
    expect(shadow.textContent).toContain(OPENING);
    expect(shadow.textContent).toContain(CLOSING);
    const plain = [...shadow.querySelectorAll('pre')].find((pre) =>
      pre.textContent?.includes(PLAIN_FENCE_SOURCE),
    );
    expect(plain, 'the non-math fence').toBeTruthy();
    expect(plain!.hasAttribute(MATH_STATE_ATTR)).toBe(false);
  }, 30_000);

  it('★ NON-VACUOUS / RED-FIRST CONTROL: the SAME fixture, the SAME harness, import succeeding, DOES render', async () => {
    // The only difference from the arm above is the loader — omitted here, so `loadMathEngine`
    // reaches the production `import('temml')`. If this control did not render, "the source is
    // visible after a failed load" would be a fact about a harness that never renders anything, and
    // the arm above would be worth nothing — this IS the red-first proof, run as a fixture-level
    // ablation of the ONE variable that distinguishes success from failure.
    const shadow = enhancedReader(MULTI_FORMULA_DOC);
    expect(placeholders(shadow)).toHaveLength(FORMULAS.length);
    await settleMath(shadow);

    const pres = fences(shadow);
    expect(pres.map((p) => p.getAttribute(MATH_STATE_ATTR))).toEqual(FORMULAS.map(() => 'rendered'));
    for (const pre of pres) expect(getComputedStyle(pre).display).toBe('none');
    const figures = [...shadow.querySelectorAll(FIGURE_SELECTOR)];
    expect(figures).toHaveLength(FORMULAS.length);
    for (const figure of figures) expect(figure.querySelector('math')).not.toBeNull();
    expect(shadow.querySelectorAll(`.${MATH_ERROR_CLASS}`)).toHaveLength(0);
  }, 30_000);
});

// ── ARM B — a single formula fails to parse/render; every other formula is unaffected ───────────

describe('B — a formula fails to render: isolated to its own fence (D-4-R throwOnError:true)', () => {
  // Genuinely malformed, unterminated LaTeX — the same shape `mathBlock.browser.test.ts`'s own
  // D-9-R arm uses to prove Temml's own error UI is unreachable; this arm proves the OTHER half:
  // the isolation and the degrade-to-source content, over the REAL installed engine.
  const BAD = '\\frac{a}{';
  const GOOD = 'y^2';
  const DOC = `# Mixed document\n\n${OPENING}\n\n\`\`\`math\n${BAD}\n\`\`\`\n\n\`\`\`math\n${GOOD}\n\`\`\`\n\n${CLOSING}\n`;

  it('the malformed formula degrades to its own source; the well-formed sibling still renders', async () => {
    const shadow = enhancedReader(DOC); // no loader override: the REAL import('temml')
    expect(placeholders(shadow)).toHaveLength(2);
    await settleMath(shadow);

    const [bad, good] = fences(shadow);
    expect(bad.getAttribute(MATH_STATE_ATTR)).toBe('failed');
    expect(getComputedStyle(bad).display).not.toBe('none');
    expect(bad.textContent).toContain(BAD);
    expect(bad.nextElementSibling?.textContent).toContain('this formula could not be rendered');
    expect(bad.nextElementSibling?.classList.contains(MATH_ERROR_CLASS)).toBe(true);

    expect(good.getAttribute(MATH_STATE_ATTR)).toBe('rendered');
    expect(getComputedStyle(good).display).toBe('none'); // hidden-but-retained, per D-15
    const figures = [...shadow.querySelectorAll(FIGURE_SELECTOR)];
    expect(figures).toHaveLength(1); // only the good one produced a figure
    expect(figures[0].getAttribute(MATH_STATE_ATTR)).toBe('rendered');
    expect(figures[0].querySelector('math')).not.toBeNull();
    expect(figures[0].textContent).not.toContain(BAD);

    // Temml's OWN error UI never reaches the DOM (throwOnError:true, `mathEngine.ts`'s lockdown).
    expect(shadow.querySelectorAll('.temml-error')).toHaveLength(0);
    expect(shadow.querySelectorAll(`.${MATH_ERROR_CLASS}`)).toHaveLength(1);

    expect(shadow.textContent).toContain(OPENING);
    expect(shadow.textContent).toContain(CLOSING);
  }, 30_000);

  it('CONTROL: with only the well-formed formula present, the harness renders it (non-vacuity)', async () => {
    const shadow = enhancedReader(`\`\`\`math\n${GOOD}\n\`\`\`\n`);
    await settleMath(shadow);
    const [pre] = fences(shadow);
    expect(pre.getAttribute(MATH_STATE_ATTR)).toBe('rendered');
    expect(shadow.querySelector(FIGURE_SELECTOR)?.querySelector('math')).not.toBeNull();
  }, 30_000);
});

// ── ARM C — the sanitizer rejects a genuinely successful render (the latest-moment failure) ─────

describe('C — sanitizeMath rejects the output: the LATEST-moment failure (D-5-R)', () => {
  const BAD_SOURCE = 'bad^2';
  const GOOD_SOURCE = 'good^2';
  const DOC =
    `# Mixed document\n\n${OPENING}\n\n\`\`\`math\n${BAD_SOURCE}\n\`\`\`\n\n` +
    `\`\`\`math\n${GOOD_SOURCE}\n\`\`\`\n\n${CLOSING}\n`;

  it('a real render whose output is corrupted degrades to source; the untouched sibling still renders', async () => {
    // The engine runs for REAL on both formulas; only the "bad" one's return value is corrupted
    // AFTER a genuine `renderToString` call, by stripping its `<math>` root — the exact shape
    // `renderMathFormula`'s own sanitize-rejection branch checks for
    // (`!tpl.content.querySelector('math')`).
    const { loader, raw } = instrumentedMath((mathml, source) =>
      source.includes('bad') ? mathml.replace(/<math\b[^>]*>/, '<mathcorrupted>').replace('</math>', '') : mathml,
    );
    const shadow = enhancedReader(DOC, loader);
    expect(placeholders(shadow)).toHaveLength(2);
    await settleMath(shadow);

    // THE ENGINE GENUINELY SUCCEEDED for the bad formula — this is what makes it the sanitize path
    // rather than the render-failure path (arm B).
    expect(raw.some((r) => r.includes('<math'))).toBe(true);
    expect(raw.length).toBe(2);

    const [bad, good] = fences(shadow);
    expect(bad.getAttribute(MATH_STATE_ATTR)).toBe('failed');
    expect(getComputedStyle(bad).display).not.toBe('none');
    expect(bad.textContent).toContain(BAD_SOURCE);
    expect(bad.nextElementSibling?.textContent).toContain('rejected by the sanitizer');
    expect(bad.nextElementSibling?.classList.contains(MATH_ERROR_CLASS)).toBe(true);

    expect(good.getAttribute(MATH_STATE_ATTR)).toBe('rendered');
    const figures = [...shadow.querySelectorAll(FIGURE_SELECTOR)];
    expect(figures).toHaveLength(1);
    expect(figures[0].querySelector('math')).not.toBeNull();

    expect(shadow.querySelectorAll(`.${MATH_ERROR_CLASS}`)).toHaveLength(1);
    expect(shadow.textContent).toContain(OPENING);
    expect(shadow.textContent).toContain(CLOSING);
  }, 30_000);

  it('★ RED-FIRST CONTROL: the SAME wrapper WITHOUT the corruption renders both formulas normally', async () => {
    // The ablation, run the other direction: the identity transform (no corruption at all) over the
    // SAME instrumentation seam must leave BOTH formulas rendered — proving the failure above comes
    // from the corruption, not from `instrumentedMath` itself being a broken engine stand-in.
    const { loader, raw } = instrumentedMath((mathml) => mathml);
    const shadow = enhancedReader(DOC, loader);
    await settleMath(shadow);

    expect(raw.length).toBe(2);
    const pres = fences(shadow);
    expect(pres.map((p) => p.getAttribute(MATH_STATE_ATTR))).toEqual(['rendered', 'rendered']);
    expect(shadow.querySelectorAll(FIGURE_SELECTOR)).toHaveLength(2);
    expect(shadow.querySelectorAll(`.${MATH_ERROR_CLASS}`)).toHaveLength(0);
  }, 30_000);
});

// @vitest-environment jsdom
//
// mathEngine — the gate and the config lockdown. Two properties, each with the control that
// makes its green mean something, mirroring `diagramEngine.test.ts`'s own discipline:
//
//   1. THE FEATURE-DETECT. Paired in the same test with a marker-bearing document that drives
//      the SAME spy, so a rotted wiring goes red first rather than passing on a disconnected spy
//      (retro 2026-07-27 finding 1).
//   2. THE D-4-R CONFIGURATION. Asserted by VALUE against `MATH_ENGINE_CONFIG` itself (so a
//      future Temml default change cannot silently alter this project's posture), AND against
//      the REAL installed `temml` package — a deliberately-bad formula and a deliberately
//      trust-gated one must fail the way the pin says they will, not the way Temml's own
//      defaults happen to behave today. The `trust: false` claim gets its own ABLATION (flipped
//      `true` in the test only) so the failure is shown to depend on the pin, not merely to
//      coincide with it.
//
// The gate itself (`loadMathEngine`) is tested with an INJECTED fake loader, same as
// `diagramEngine.test.ts` — jsdom never sees temml's own bytes there. The config-lockdown tests
// below import the REAL `temml` package directly (as `sanitize.test.ts` already does for its own
// survey) because the property under test — what the real engine actually does with these
// options — cannot be proven against a fake.

import { describe, it, expect, vi } from 'vitest';
import temml from 'temml';

import {
  MATH_BLOCK_SELECTOR,
  MATH_ENGINE_CONFIG,
  MATH_INLINE_SELECTOR,
  hasMathMarker,
  loadMathEngine,
  mathEngineOptionsFor,
  type MathEngineModule,
} from './mathEngine';

/** A stand-in for the engine module — never the real temml — for the gate tests below. */
function fakeEngineModule() {
  const renderToString = vi.fn(() => '<math><mi>x</mi></math>');
  const engine = { renderToString };
  return { module: { default: engine } as MathEngineModule, engine };
}

function rootWithInline(): ParentNode {
  const host = document.createElement('div');
  host.innerHTML = '<p>Say <code class="peekover-math-inline">$x$</code> aloud.</p>';
  return host;
}

function rootWithBlock(): ParentNode {
  const host = document.createElement('div');
  host.innerHTML = '<pre><code class="language-math">$$x$$</code></pre>';
  return host;
}

function rootWithoutMath(): ParentNode {
  const host = document.createElement('div');
  host.innerHTML = '<h1>No math here</h1><pre><code class="language-js">const x = 1;</code></pre>';
  return host;
}

describe('hasMathMarker', () => {
  it('sees an inline marker and ignores an ordinary code block', () => {
    expect(hasMathMarker(rootWithInline())).toBe(true);
    expect(hasMathMarker(rootWithoutMath())).toBe(false);
  });

  it('sees a block/fence marker too — D-8-R’s shared shape, one selector for both origins', () => {
    expect(hasMathMarker(rootWithBlock())).toBe(true);
  });

  it('matches 3.2-R’s own landed marker selectors', () => {
    expect(MATH_INLINE_SELECTOR).toBe('code.peekover-math-inline');
    expect(MATH_BLOCK_SELECTOR).toBe('pre > code.language-math');
  });
});

describe('loadMathEngine — the feature-detect gate (§4)', () => {
  it('does NOT invoke the loader on a math-free document — with the control that it CAN be invoked', async () => {
    const { module } = fakeEngineModule();
    const loader = vi.fn(async () => module);

    // The negative claim: no marker ⇒ the engine import is never evaluated. Call count first and
    // deliberately: a regression reds in the defect's own units ("expected 0, got 1").
    const engine = await loadMathEngine(rootWithoutMath(), loader);
    expect(loader).toHaveBeenCalledTimes(0);
    expect(engine).toBeNull();

    // The control, same spy, only variable changed is the presence of a marker.
    const loaded = await loadMathEngine(rootWithInline(), loader);
    expect(loader).toHaveBeenCalledTimes(1);
    expect(loaded).not.toBeNull();
  });

  it('returns the engine the loader produced, for either marker kind', async () => {
    const { module, engine } = fakeEngineModule();
    expect(await loadMathEngine(rootWithInline(), async () => module)).toBe(engine);
    expect(await loadMathEngine(rootWithBlock(), async () => module)).toBe(engine);
  });
});

describe('MATH_ENGINE_CONFIG — the D-4-R lockdown, asserted by value', () => {
  it('is frozen, and pins exactly trust/throwOnError/annotate — nothing else', () => {
    expect(Object.isFrozen(MATH_ENGINE_CONFIG)).toBe(true);
    expect(MATH_ENGINE_CONFIG).toEqual({
      trust: false,
      throwOnError: true,
      annotate: false,
    });
    // `output` is correctly ABSENT (D-4-R's own VACATE — Temml has no output-mode option), so a
    // future reader who goes looking for a fourth key should find this assertion, not a gap.
    expect(Object.keys(MATH_ENGINE_CONFIG).sort()).toEqual(['annotate', 'throwOnError', 'trust']);
  });

  it('mathEngineOptionsFor merges displayMode without mutating the shared base', () => {
    const inline = mathEngineOptionsFor(false);
    const block = mathEngineOptionsFor(true);
    expect(inline).toEqual({ trust: false, throwOnError: true, annotate: false, displayMode: false });
    expect(block).toEqual({ trust: false, throwOnError: true, annotate: false, displayMode: true });
    expect(Object.isFrozen(inline)).toBe(true);
    expect(Object.isFrozen(block)).toBe(true);
    // The base itself never picked up a stray `displayMode` key from either call.
    expect(Object.keys(MATH_ENGINE_CONFIG).sort()).toEqual(['annotate', 'throwOnError', 'trust']);
  });
});

describe('the pinned config against REAL installed temml@0.13.5 — the failure-semantics proof', () => {
  it('throwOnError: true routes a malformed formula to US, never to Temml’s own error UI', () => {
    // `\frac` with an unclosed group is a genuine ParseError. Under `throwOnError: true`,
    // `temml.js`'s own `renderError` (its first line: `if (options.throwOnError || ...) throw
    // error`) re-throws unconditionally — the render call must throw synchronously, never return
    // a string containing Temml's own `<span class="temml-error">` markup.
    expect(() => temml.renderToString(String.raw`\frac{a}{`, mathEngineOptionsFor(false))).toThrow();
  });

  it('a non-ParseError failure still throws under the pin (renderError’s own OR-condition)', () => {
    // An entirely unrecognised control sequence is also a ParseError in this engine, so this
    // reconfirms the same branch from a different producer — genuinely malformed LaTeX, not a
    // trust question (the next block covers that).
    expect(() =>
      temml.renderToString(String.raw`\thisControlSequenceDoesNotExist{x}`, mathEngineOptionsFor(true)),
    ).toThrow();
  });

  it('trust: false blocks \\class from reaching a DOM attribute — WITH the ablation proving the pin is load-bearing', () => {
    const formula = String.raw`\class{peekover-injected}{x}`;

    // Our pinned config: trust:false (Settings.js's own default, pinned explicitly here).
    expect(() => temml.renderToString(formula, mathEngineOptionsFor(false))).toThrow(
      /not trusted/,
    );

    // The ablation: the SAME formula, same throwOnError, ONLY `trust` flipped — never landed in
    // `mathEngine.ts` itself, only in this test's own options object. If this does NOT succeed,
    // the throw above proved nothing about `trust` specifically (it could throw for any reason).
    const untrusted = temml.renderToString(formula, {
      ...mathEngineOptionsFor(false),
      trust: true,
    });
    expect(untrusted).toContain('peekover-injected');
  });

  it('annotate: false keeps `<semantics>`/`<annotation>` out of real rendered output', () => {
    const html = temml.renderToString(String.raw`x^2`, mathEngineOptionsFor(false));
    expect(html).not.toContain('<semantics');
    expect(html).not.toContain('<annotation');
  });
});

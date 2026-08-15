// @vitest-environment jsdom
//
// codeEngine — the gate, the engine choice, and the version. Four properties, each with the
// control that makes its green mean something:
//
//   1. THE FENCE PREDICATE. Positive AND negative cases — a direct `pre > code[class^="language-
//      "]` child, and every near-miss (bare `code`, an unclassed fence, a `code` behind an
//      intervening element) that must NOT trip it.
//   2. THE FEATURE-DETECT. "The engine is never loaded on a fence-free document" is a claim about
//      something NOT happening, and the classic way to fake it is a spy that was never wired up at
//      all — an un-called spy and a missing spy are indistinguishable (retro 2026-07-27 finding
//      1). So the fence-free assertion is paired, IN THE SAME TEST, with a fence-bearing document
//      that drives the same spy and must show a call.
//   3. THE ENGINE CHOICE (D-3). Asserted by IDENTITY, not shape: `shiki/engine/javascript`'s
//      `createJavaScriptRegexEngine` is spied in place (wrapping the real implementation), and the
//      object `createHighlighterCore` receives as `engine` is asserted to be the EXACT value that
//      spy returned. A fixture that temporarily swaps the import for `shiki/engine/oniguruma`'s
//      `createOnigurumaEngine` must fail this assertion — run once, red, pasted into the task
//      report, then reverted (retro finding 5, revert-and-fail is the standard).
//   4. `codeToTokens`'S SHAPE. A REAL highlighter (real engine, one theme, one language) tokenizes
//      a trivial fixture, and the full return structure is captured — the ground truth a later
//      task's DOM-adoption code is written against, not assumed from memory (plan risk 4).
//
// The real `shiki/core` module graph is never imported for tests 1-2: `loadCodeEngine` takes an
// injected loader, so jsdom never sees the tokenizer's bytes and the test measures our gate
// rather than the engine's behaviour. Test 3 and 4 use the real, installed 4.4.3 package —
// pure JS module loading + tokenization, no layout/paint/rAF/pointer concerns, so jsdom is fine.

import { describe, it, expect, vi } from 'vitest';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

// Wraps the REAL `createJavaScriptRegexEngine` in a spy rather than replacing it: the returned
// engine stays genuine (so test 4's highlighter, built the same way, stays representative), but
// the call becomes observable. `vi.mock` replaces the module in the whole registry, so
// codeEngine.ts's own static `import … from 'shiki/engine/javascript'` resolves to this SAME
// mock — the spy below and codeEngine.ts's internal call are the same function.
vi.mock('shiki/engine/javascript', async (importOriginal) => {
  const actual = await importOriginal<typeof import('shiki/engine/javascript')>();
  return { ...actual, createJavaScriptRegexEngine: vi.fn(actual.createJavaScriptRegexEngine) };
});

import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import type { HighlighterCore } from 'shiki/core';
import {
  CODE_FENCE_SELECTOR,
  engineVersion,
  hasCodeFence,
  loadCodeEngine,
  languageInputFor,
  themeInputFor,
  type CodeEngineModule,
} from './codeEngine';

/** A stand-in for the `shiki/core` module, carrying a `createHighlighterCore` spy that returns a
 *  fake highlighter — so "not called" is an assertion about a thing that EXISTS and could have
 *  been called. */
function fakeCodeEngineModule() {
  const highlighter = { codeToTokens: vi.fn() } as unknown as HighlighterCore;
  const createHighlighterCore = vi.fn<CodeEngineModule['createHighlighterCore']>(async () => highlighter);
  return { module: { createHighlighterCore } as CodeEngineModule, createHighlighterCore, highlighter };
}

/** A document fragment holding markdown-it's committed fence shape for a labelled code block. */
function rootWithFence(): ParentNode {
  const host = document.createElement('div');
  host.innerHTML = '<pre><code class="language-js">const x = 1;</code></pre>';
  return host;
}

/** The same shape minus any fenced code — must NOT trip the detect. */
function rootWithoutFence(): ParentNode {
  const host = document.createElement('div');
  host.innerHTML = '<h1>No code here</h1><p>Just prose.</p>';
  return host;
}

describe('hasCodeFence / CODE_FENCE_SELECTOR', () => {
  it('matches a language-classed fence and nothing else', () => {
    const positive = document.createElement('div');
    positive.innerHTML = '<pre><code class="language-python">x = 1</code></pre>';
    expect(hasCodeFence(positive)).toBe(true);

    const bareCode = document.createElement('div');
    bareCode.innerHTML = '<code class="language-js">x</code>';
    expect(hasCodeFence(bareCode)).toBe(false);

    const unclassedFence = document.createElement('div');
    unclassedFence.innerHTML = '<pre><code>x</code></pre>';
    expect(hasCodeFence(unclassedFence)).toBe(false);

    const indirectChild = document.createElement('div');
    indirectChild.innerHTML = '<pre><div><code class="language-x">x</code></div></pre>';
    expect(hasCodeFence(indirectChild)).toBe(false);
  });

  it('is the literal selector the predicate uses', () => {
    expect(CODE_FENCE_SELECTOR).toBe('pre > code[class^="language-"]');
  });

  it('excludes a mermaid-only document — 007 already owns that fence (task 4.2, carried from 4.1)', () => {
    // The raw selector WOULD match (language-mermaid starts with language-) — the control that
    // makes the negative below meaningful rather than an artefact of an empty document. Mirrors
    // `codeEnhancer.test.ts`'s own mermaid-exclusion test shape (4.1).
    const mermaidOnly = document.createElement('div');
    mermaidOnly.innerHTML = '<pre><code class="language-mermaid">graph TD; A--&gt;B;</code></pre>';
    expect(mermaidOnly.querySelectorAll(CODE_FENCE_SELECTOR)).toHaveLength(1);
    expect(hasCodeFence(mermaidOnly)).toBe(false);

    // CONTROL: a mermaid fence ALONGSIDE a real code fence still detects — the exclusion is
    // per-fence, not a document-wide "any mermaid present" veto.
    const mixed = document.createElement('div');
    mixed.innerHTML =
      '<pre><code class="language-mermaid">graph TD; A--&gt;B;</code></pre>' +
      '<pre><code class="language-javascript">const a = 1;</code></pre>';
    expect(hasCodeFence(mixed)).toBe(true);
  });
});

describe('loadCodeEngine — the feature-detect gate (D-3, §4)', () => {
  it('does NOT invoke the loader on a fence-free document — with the control that it CAN be invoked', async () => {
    const { module, createHighlighterCore } = fakeCodeEngineModule();
    const loader = vi.fn(async () => module);

    // The negative claim: no fence ⇒ the engine import is never evaluated. The CALL COUNT is
    // asserted first and deliberately: a regression reds in the defect's own units
    // ("expected 0, got 1") rather than on the returned value's shape.
    const engine = await loadCodeEngine(rootWithoutFence(), loader);
    expect(loader).toHaveBeenCalledTimes(0);
    expect(createHighlighterCore).toHaveBeenCalledTimes(0);
    expect(engine).toBeNull();

    // The control, in the SAME test and on the SAME spy: the ONLY variable changed is the
    // presence of a fence. If this does not fire, the zero above measured a disconnected spy,
    // not a gate.
    const loaded = await loadCodeEngine(rootWithFence(), loader);
    expect(loader).toHaveBeenCalledTimes(1);
    expect(createHighlighterCore).toHaveBeenCalledTimes(1);
    expect(loaded).not.toBeNull();
  });

  it('returns the highlighter the loader produced', async () => {
    const { module, highlighter } = fakeCodeEngineModule();
    const loaded = await loadCodeEngine(rootWithFence(), async () => module);
    expect(loaded).toBe(highlighter);
  });
});

describe('D-3 — the configured engine is createJavaScriptRegexEngine, never the default', () => {
  it('passes createHighlighterCore the EXACT object createJavaScriptRegexEngine returned', async () => {
    const spy = vi.mocked(createJavaScriptRegexEngine);
    spy.mockClear();

    const { module, createHighlighterCore } = fakeCodeEngineModule();
    await loadCodeEngine(rootWithFence(), async () => module);

    expect(spy).toHaveBeenCalledTimes(1);
    const passedEngine = createHighlighterCore.mock.calls[0][0].engine;
    expect(passedEngine).toBe(spy.mock.results[0].value);
  });

  // ★ RED-FIRST PROOF (retro finding 5), run manually and pasted into the task report — not a
  // permanent fixture, because the swap under test is codeEngine.ts's own STATIC import binding,
  // not this test's mock. The procedure: temporarily change codeEngine.ts's
  // `import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'` to
  // `import { createOnigurumaEngine as createJavaScriptRegexEngine } from 'shiki/engine/
  // oniguruma'`, rerun this file, observe `expect(spy).toHaveBeenCalledTimes(1)` FAIL with
  // "number of calls: 0" (the mocked javascript-module export codeEngine.ts no longer calls),
  // then revert. See the task report for the captured failure output.
});

describe('languageInputFor / themeInputFor — resolving a bundled key (task 4.2)', () => {
  it('resolves a known bundled language/theme key to something loadLanguage/loadTheme can use', () => {
    expect(languageInputFor('javascript')).toBeDefined();
    expect(themeInputFor('github-dark')).toBeDefined();
  });

  it('resolves an unknown key to undefined — no throw, the caller decides what that means', () => {
    expect(languageInputFor('notarealanguage')).toBeUndefined();
    expect(themeInputFor('notarealtheme')).toBeUndefined();
  });
});

describe('engineVersion — the resolved Shiki version', () => {
  it('returns the RESOLVED shiki package version, read independently off disk', () => {
    const resolved = createRequire(import.meta.url).resolve('shiki/package.json');
    const onDisk = JSON.parse(readFileSync(resolved, 'utf8')) as { version: string };

    expect(engineVersion()).toBe(onDisk.version);
    expect(engineVersion()).toMatch(/^\d+\.\d+\.\d+/);
  });
});

describe('codeToTokens — captured shape (plan risk 4, ground truth for a later task)', () => {
  it('tokenizes a trivial fixture with a real engine, real theme, real language', async () => {
    const { createHighlighterCore } = await import('shiki/core');
    const { createJavaScriptRegexEngine } = await import('shiki/engine/javascript');
    const theme = (await import('shiki/themes/github-dark.mjs')).default;
    const lang = (await import('shiki/langs/javascript.mjs')).default;

    const highlighter = await createHighlighterCore({
      engine: createJavaScriptRegexEngine(),
      themes: [theme],
      langs: [lang],
    });

    const result = highlighter.codeToTokens("console.log('hi')", {
      lang: 'javascript',
      theme: 'github-dark',
    });

    // The shape smoke: structural, not a snapshot — a snapshot would pin colour hexes to this
    // exact theme build and red on every legitimate theme update. What must hold regardless of
    // theme: a 2D line/token array, each token carrying content + a colour.
    expect(Array.isArray(result.tokens)).toBe(true);
    expect(result.tokens.length).toBeGreaterThan(0);
    for (const line of result.tokens) {
      expect(Array.isArray(line)).toBe(true);
      for (const token of line) {
        expect(typeof token.content).toBe('string');
        expect(typeof token.offset).toBe('number');
        expect(typeof token.color).toBe('string');
      }
    }
    expect(typeof result.fg).toBe('string');
    expect(typeof result.bg).toBe('string');

    // The reassembled line text must equal the source line — no token boundary may drop or
    // duplicate a character (the property a later task's DOM adoption depends on holding).
    const reassembled = result.tokens.map((line) => line.map((t) => t.content).join('')).join('\n');
    expect(reassembled).toBe("console.log('hi')");
  });
});

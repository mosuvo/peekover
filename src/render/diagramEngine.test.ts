// @vitest-environment jsdom
//
// diagramEngine — the gate, the configuration, and the version. Three properties, each with the
// control that makes its green mean something:
//
//   1. THE FEATURE-DETECT. "The engine is never loaded on a fence-free document" is a claim about
//      something NOT happening, and the classic way to fake it is a spy that was never wired up at
//      all — an un-called spy and a missing spy are indistinguishable (retro 2026-07-27 finding 1).
//      So the fence-free assertion is paired, IN THE SAME TEST, with a fence-BEARING document that
//      drives the same spy and must show a call. If the wiring rots, the control goes red first.
//   2. THE D-6 CONFIGURATION. Asserted by VALUE, not by shape: `securityLevel: 'strict'` (never
//      'sandbox'), `htmlLabels: false`, `startOnLoad: false` — plus the two engine capabilities we
//      decline (`registerIconPacks`, `bindFunctions`), asserted never-called on a fake that HAS them.
//   3. THE VERSION. Compared against an INDEPENDENT read of `mermaid/package.json` off the
//      filesystem, so the two sides share no mechanism. ★ Read the caveat at that test: this proves
//      the accessor matches the RESOLVED package, NOT that it moves on a bump. The bump property is
//      structural (the value is `pkg.version`, inlined from the resolved dependency at build time) —
//      a same-value hardcoded constant would pass this assertion too, and no unit test in a
//      single-version tree can discriminate the two. Stating that is better than a control that
//      pretends to.
//
// The real engine is never imported here. `loadDiagramEngine` takes an injected loader, so jsdom
// never sees mermaid's bytes and the test measures our gate rather than the engine's behaviour.

import { describe, it, expect, vi } from 'vitest';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

import {
  DIAGRAM_ENGINE_CONFIG,
  DIAGRAM_FENCE_SELECTOR,
  engineVersion,
  hasDiagramFence,
  loadDiagramEngine,
  type DiagramEngineModule,
} from './diagramEngine';

/**
 * A stand-in for the engine module, carrying the two members we deliberately never touch so that
 * "not called" is an assertion about a thing that EXISTS and could have been called.
 */
function fakeEngineModule() {
  const bindFunctions = vi.fn();
  const engine = {
    initialize: vi.fn(),
    render: vi.fn(async () => ({ svg: '<svg/>', bindFunctions })),
    registerIconPacks: vi.fn(),
  };
  return { module: { default: engine } as DiagramEngineModule, engine, bindFunctions };
}

/** A document fragment holding markdown-it's committed fence shape for a ```mermaid block. */
function rootWithFence(): ParentNode {
  const host = document.createElement('div');
  host.innerHTML = '<pre><code class="language-mermaid">graph TD; A--&gt;B;</code></pre>';
  return host;
}

/** The same document minus the diagram — an ordinary code block, which must NOT trip the detect. */
function rootWithoutFence(): ParentNode {
  const host = document.createElement('div');
  host.innerHTML = '<h1>No diagrams here</h1><pre><code class="language-js">const x = 1;</code></pre>';
  return host;
}

describe('hasDiagramFence', () => {
  it('sees a mermaid fence and ignores every other code block', () => {
    expect(hasDiagramFence(rootWithFence())).toBe(true);
    expect(hasDiagramFence(rootWithoutFence())).toBe(false);
  });

  it('matches the committed markdown-it fence selector', () => {
    expect(DIAGRAM_FENCE_SELECTOR).toBe('pre > code.language-mermaid');
  });
});

describe('loadDiagramEngine — the feature-detect gate (D-13, §4)', () => {
  it('does NOT invoke the loader on a fence-free document — with the control that it CAN be invoked', async () => {
    const { module } = fakeEngineModule();
    const loader = vi.fn(async () => module);

    // The negative claim: no fence ⇒ the engine import is never evaluated. The CALL COUNT is
    // asserted first and deliberately: it is the property §4 states, so a regression reds in the
    // defect's own units ("expected 0, got 1") rather than on the returned value's shape.
    const engine = await loadDiagramEngine(rootWithoutFence(), loader);
    expect(loader).toHaveBeenCalledTimes(0);
    expect(engine).toBeNull();

    // The control, in the same test and on the same spy: the ONLY variable changed is the presence
    // of a fence. If this does not fire, the zero above measured a disconnected spy, not a gate.
    const loaded = await loadDiagramEngine(rootWithFence(), loader);
    expect(loader).toHaveBeenCalledTimes(1);
    expect(loaded).not.toBeNull();
  });

  it('returns the engine the loader produced', async () => {
    const { module, engine } = fakeEngineModule();
    const loaded = await loadDiagramEngine(rootWithFence(), async () => module);
    expect(loaded).toBe(engine);
  });
});

describe('D-6 step 3 — the configuration the engine is initialized with', () => {
  it('initializes ONCE with securityLevel strict, htmlLabels false, startOnLoad false', async () => {
    const { module, engine } = fakeEngineModule();
    await loadDiagramEngine(rootWithFence(), async () => module);

    expect(engine.initialize).toHaveBeenCalledTimes(1);
    const config = engine.initialize.mock.calls[0][0];
    // By value, one at a time, so a red names the value that drifted.
    expect(config.securityLevel).toBe('strict'); // NOT 'sandbox' — that creates a live iframe
    expect(config.htmlLabels).toBe(false);
    expect(config.startOnLoad).toBe(false);
    // And nothing else: an added key is a configuration decision that must be made deliberately.
    expect(Object.keys(config).sort()).toEqual([
      'htmlLabels',
      'secure',
      'securityLevel',
      'startOnLoad',
    ]);
  });

  it('registers no icon packs, calls no bindFunctions, and renders nothing (D-6 steps 3 & 5)', async () => {
    const { module, engine, bindFunctions } = fakeEngineModule();
    await loadDiagramEngine(rootWithFence(), async () => module);

    expect(engine.registerIconPacks).toHaveBeenCalledTimes(0);
    expect(engine.render).toHaveBeenCalledTimes(0);
    expect(bindFunctions).toHaveBeenCalledTimes(0);
  });

  it('exports the configuration frozen, so a caller cannot mutate the guarantees', () => {
    expect(Object.isFrozen(DIAGRAM_ENGINE_CONFIG)).toBe(true);
    // The ARRAY is frozen too, not just the object holding it: `Object.freeze` is shallow, so
    // without this a caller could `secure.length = 0` and silently un-harden the engine.
    expect(Object.isFrozen(DIAGRAM_ENGINE_CONFIG.secure)).toBe(true);
    expect(DIAGRAM_ENGINE_CONFIG).toEqual({
      securityLevel: 'strict',
      htmlLabels: false,
      startOnLoad: false,
      secure: [
        'secure',
        'securityLevel',
        'startOnLoad',
        'maxTextSize',
        'suppressErrorRendering',
        'maxEdges',
        'themeCSS',
        'fontFamily',
        'altFontFamily',
        'themeVariables',
      ],
    });
  });
});

describe('the hardened `secure` list (D-6 addendum — decisions.md 16c7790)', () => {
  // ★ SCOPE OF THIS BLOCK, STATED HONESTLY. These are CONFIG-SHAPE assertions. They cannot
  // prove the security property, because the property is BYTES ON THE WIRE fired by the real
  // engine during render(), and jsdom loads no subresources (decisions.md 2026-07-14) — a
  // "no fetch" here would be true of any config, including an empty one. THE FETCH PROOF IS
  // `tests/browser/diagramSecure.browser.test.ts`, which reds against the un-hardened config
  // over BOTH live routes in real Chromium and Firefox. What these add is a cheap, fast tripwire
  // on the SET, so dropping a key reds in the everyday suite instead of only in the browser one.

  it('re-states mermaid’s own six defaults — `secure` REPLACES the default, it does not extend it', () => {
    // The subtle failure this guards: mermaid seeds `siteConfig` from `defaultConfig` and then
    // assigns ours over it, so omitting a default member here would un-secure that key —
    // `securityLevel` most of all, which a directive could then flip to 'loose'.
    for (const key of [
      'secure',
      'securityLevel',
      'startOnLoad',
      'maxTextSize',
      'suppressErrorRendering',
      'maxEdges',
    ]) {
      expect(DIAGRAM_ENGINE_CONFIG.secure, `mermaid default "${key}" was dropped`).toContain(key);
    }
  });

  it('adds the four CSS-bearing keys the directive-injection route travels through', () => {
    // Named one at a time so a red says WHICH route re-opened. `themeCSS` and `fontFamily` are
    // independently PROVEN live (the browser test asserts each separately); `altFontFamily` is
    // the same interpolation as `fontFamily`; `themeVariables` is defense-in-depth.
    for (const key of ['themeCSS', 'fontFamily', 'altFontFamily', 'themeVariables']) {
      expect(DIAGRAM_ENGINE_CONFIG.secure, `"${key}" is not secured — its route is open`).toContain(
        key,
      );
    }
  });
});

describe('engineVersion — D-3’s third key component', () => {
  it('returns the RESOLVED mermaid package version, read independently off disk', () => {
    // Independent of the module under test: a filesystem read through Node's own resolver, not the
    // bundler-inlined static import the accessor uses.
    const resolved = createRequire(import.meta.url).resolve('mermaid/package.json');
    const onDisk = JSON.parse(readFileSync(resolved, 'utf8')) as { version: string };

    expect(engineVersion()).toBe(onDisk.version);
    // Shape, not value: the assertion above must not pass on an empty string if a future refactor
    // loses the field. The exact number is deliberately NOT pinned — pinning it would make every
    // Dependabot bump red for no defect.
    expect(engineVersion()).toMatch(/^\d+\.\d+\.\d+/);
  });
});

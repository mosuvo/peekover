// THE CACHE ACTUALLY SERVES — real engines, Chromium AND Firefox (007 task 4.3).
//
// ── WHY THIS CANNOT BE A JSDOM TEST ───────────────────────────────────────────────────────────
//
// Every claim in this file rests on two things jsdom does not have: a real IndexedDB that
// serializes, commits and reads back across transactions, and a real mermaid render whose output
// is what gets stored. jsdom's IndexedDB does not exercise the engine's commit path (the 002 §9
// finding, re-stated in `wipe.browser.test.ts`), and a fake engine's SVG string would prove the
// state machine and nothing about caching what mermaid actually emits. So the whole cache round
// trip — hash the source, miss, render, store, read back, serve — runs here.
//
// ── ★ THE ONE ASSERTION THAT MATTERS, AND WHAT MAKES IT NON-VACUOUS ───────────────────────────
//
// "Served from cache" is a NEGATIVE claim: `engine.render` was not called. A negative claim about
// a spy is worthless on its own — a spy that is never wired, a document whose fence never
// enhanced, an enhancement that died before reaching the engine, and a genuine cache hit all
// produce the same zero. So the POSITIVE CONTROL IS ASSERTED IN THE SAME TEST, under the same
// conditions: the FIRST render of that same document, through that same loader, with that same
// spy, MUST show exactly one invocation. One render invoked the engine and the next did not, and
// both facts are read off one counter (finding 1's rule, and the reason `raw`/`bindSpy` exist in
// `diagramRender.browser.test.ts`).
//
// The figure is asserted RENDERED on the cached pass too. A cache that served nothing at all
// would also leave the engine uninvoked — and would leave an empty box, which is the failure
// §3.8 exists to forbid. "Engine not invoked AND the diagram is on screen" is the conjunction
// that distinguishes a hit from a hole.
//
// ── D-3's DISCRIMINATOR: THREE COMPONENTS, THREE CASES ────────────────────────────────────────
//
// The key is `hash + SEP + theme + SEP + engineVersion`. Each component earns its place by
// changing the key when it changes, so each gets its own case:
//
//   • SOURCE — a different fence text renders afresh. Driven end-to-end.
//   • THEME — the same fence under a different EFFECTIVE theme renders afresh (§3.7: the two
//     renderings must COEXIST, so this also proves the first one was not overwritten). Driven
//     end-to-end through `setThemeSetting`.
//   • ENGINE VERSION — driven from the cache side rather than end-to-end, because the version is
//     a resolved-package read (`diagramEngine.ts:77`) with no production seam and MUST NOT grow
//     one for a test. Instead the cache is SEEDED at a key that differs from the production key in
//     the version component ALONE, and the production render is then shown to miss it. The control
//     is in the same test: seeding at the production key — identical but for that one component —
//     yields a hit. Same seed, same document, same spy; one component's difference flips the
//     verdict, which is exactly what "the version is in the key" means.

import { describe, it, expect, afterEach, beforeEach, vi, type Mock } from 'vitest';
import mermaid from 'mermaid';
import { mount } from '../../src/render/mount';
import { DIAGRAM_MEASURE_CLASS, enhanceDiagrams } from '../../src/render/diagramEnhancer';
import { engineVersion } from '../../src/render/diagramEngine';
import type { DiagramEngine, DiagramEngineModule, EngineLoader } from '../../src/render/diagramEngine';
import { DIAGRAM_FIGURE_CLASS, DIAGRAM_STATE_ATTR } from '../../src/render/diagramView';
import { diagramCacheKey, readDiagram, storeDiagram } from '../../src/app/diagramCache';
import { clearDiagramCache, describeStored, __resetConnectionForTest } from '../../src/app/store';
import { setThemeSetting } from '../../src/theme/reader';
import { currentEffectiveTheme } from '../../src/theme/reader';

const FIGURE_SELECTOR = `figure.${DIAGRAM_FIGURE_CLASS}`;

const FENCE_A = '```mermaid\ngraph TD; A-->B;\n```\n';
const FENCE_B = '```mermaid\ngraph TD; X-->Y-->Z;\n```\n';

const doc = (fence: string): string => `# Cached document\n\nProse before.\n\n${fence}\nProse after.\n`;

const cleanup: HTMLElement[] = [];

/**
 * The real engine, wrapped to COUNT invocations — `diagramRender.browser.test.ts`'s `instrumented`
 * shape, narrowed to the one thing this file asks. Wrapping rather than patching the singleton
 * matters: sibling suites in this project import the same mermaid instance.
 */
function counting(): { loader: EngineLoader; render: Mock<() => void> } {
  const render: Mock<() => void> = vi.fn();
  const engine: DiagramEngine = {
    initialize: (config) => mermaid.initialize(config as never),
    render: async (id, definition, container) => {
      render();
      return await mermaid.render(id, definition, container);
    },
  };
  return { loader: async () => ({ default: engine }) as unknown as DiagramEngineModule, render };
}

/** mount + enhance by hand — D-12's second call site, the only seam an injected loader enters by. */
function enhancedHost(markdown: string, loader: EngineLoader): ShadowRoot {
  const host = document.createElement('div');
  document.body.appendChild(host);
  cleanup.push(host);
  mount(markdown, host, { contained: true, preserveReading: true });
  enhanceDiagrams(host, { loader });
  if (!host.shadowRoot) throw new Error('expected a mounted host');
  return host.shadowRoot;
}

/** Wait until no fence is still `pending` — `diagramRender.browser.test.ts:302`'s helper. A
 *  document that never settles is one whose enhancement DIED rather than degraded. */
async function settleDiagrams(shadow: ShadowRoot, tries = 600): Promise<void> {
  for (let i = 0; i < tries; i += 1) {
    if (shadow.querySelectorAll(`[${DIAGRAM_STATE_ATTR}="pending"]`).length === 0) return;
    await new Promise<void>((r) => setTimeout(r, 25));
  }
  throw new Error('enhancement never completed — the cache pass did not settle');
}

/** Render `markdown` through the production enhancer and wait for it. Returns the invocation
 *  count of THAT pass, so every assertion below reads a per-pass number rather than a running one. */
async function renderPass(markdown: string, loader: EngineLoader, spy: Mock<() => void>): Promise<{
  shadow: ShadowRoot;
  invocations: number;
}> {
  const before = spy.mock.calls.length;
  const shadow = enhancedHost(markdown, loader);
  await settleDiagrams(shadow);
  return { shadow, invocations: spy.mock.calls.length - before };
}

/** The one rendered figure in `shadow`, asserted non-empty — a hit that served nothing would
 *  ALSO leave the engine uninvoked, so "on screen" is half of every hit claim here. */
function assertRenderedFigure(shadow: ShadowRoot): void {
  const figures = shadow.querySelectorAll(FIGURE_SELECTOR);
  expect(figures).toHaveLength(1);
  expect(figures[0].querySelectorAll('svg')).toHaveLength(1);
  expect(shadow.querySelectorAll(`pre[${DIAGRAM_STATE_ATTR}="rendered"]`)).toHaveLength(1);
}

describe('the diagram cache serves (D-3, D-4, D-14; task 4.3)', () => {
  beforeEach(async () => {
    setThemeSetting('light'); // a KNOWN effective theme, so the key's theme component is pinned
    await clearDiagramCache();
  });

  afterEach(async () => {
    for (const el of cleanup.splice(0)) el.remove();
    // DRAIN — removing a host does not cancel an in-flight render, and its measuring container
    // lives in `document.body` (D-6 step 1), where a stray one reads as the NEXT test's.
    for (let i = 0; i < 400 && document.querySelector(`.${DIAGRAM_MEASURE_CLASS}`); i += 1) {
      await new Promise<void>((r) => setTimeout(r, 25));
    }
    setThemeSetting('auto');
    await clearDiagramCache();
    __resetConnectionForTest();
  });

  it('★ renders once, then serves the SECOND render FROM CACHE with the engine NOT invoked', async () => {
    const { loader, render } = counting();

    // PASS 1 — the POSITIVE CONTROL, in this same test. The engine IS invoked, exactly once. If
    // this ever reads 0, the zero below means nothing (a dead spy, a fence that never enhanced).
    const first = await renderPass(doc(FENCE_A), loader, render);
    expect(first.invocations, 'the FIRST render must invoke the engine — this is the control that ' +
      'makes the second render\'s zero a cache hit rather than a broken harness').toBe(1);
    assertRenderedFigure(first.shadow);

    // The cache really holds it — meta-side, which is also what the trust panel reads (D-2).
    const summary = await describeStored();
    expect(summary.diagrams.count).toBe(1);
    expect(summary.diagrams.bytes).toBeGreaterThan(0);

    // PASS 2 — same source, same theme, same engine version. THE CLAIM.
    const second = await renderPass(doc(FENCE_A), loader, render);
    expect(second.invocations, 'the second render of an identical document must be served from ' +
      'cache — a non-zero count here is the cache not being consulted').toBe(0);
    // ...and it is a real diagram, not an empty box. Both halves, or the claim is hollow.
    assertRenderedFigure(second.shadow);

    // Still ONE row: a hit reuses its row, it does not append a second (D-4's `lastUsed` touch is
    // a rewrite in place, which is why re-reading cannot grow the store).
    expect((await describeStored()).diagrams.count).toBe(1);
  });

  it('★ D-3 component 1 — a different SOURCE renders afresh (and both renderings coexist)', async () => {
    const { loader, render } = counting();

    expect((await renderPass(doc(FENCE_A), loader, render)).invocations).toBe(1); // control: fires
    expect((await renderPass(doc(FENCE_B), loader, render)).invocations).toBe(1); // different hash

    // Two rows, not one overwritten: the hash component partitions the store.
    expect((await describeStored()).diagrams.count).toBe(2);
    // And A is still a hit afterwards — B did not displace it.
    expect((await renderPass(doc(FENCE_A), loader, render)).invocations).toBe(0);
  });

  it('★ D-3 component 2 — a different THEME renders afresh, and §3.7\'s two renderings COEXIST', async () => {
    const { loader, render } = counting();

    setThemeSetting('light');
    expect((await renderPass(doc(FENCE_A), loader, render)).invocations).toBe(1); // control: fires

    // Same fence text, same engine — only the EFFECTIVE theme differs. A hash-keyed store would
    // hit here, which is exactly the collision D-3's composite key exists to prevent.
    setThemeSetting('dark');
    expect(
      (await renderPass(doc(FENCE_A), loader, render)).invocations,
      'a theme change must render afresh — otherwise the reader serves a light SVG into a dark page',
    ).toBe(1);

    // §3.7's REQUIREMENT, asserted directly: both renderings are rows, so every subsequent flip in
    // either direction is a hit rather than a re-render.
    expect((await describeStored()).diagrams.count).toBe(2);
    setThemeSetting('light');
    expect((await renderPass(doc(FENCE_A), loader, render)).invocations).toBe(0);
    setThemeSetting('dark');
    expect((await renderPass(doc(FENCE_A), loader, render)).invocations).toBe(0);
  });

  it('★ D-3 component 3 — the ENGINE VERSION is in the key (seeded, with its own control)', async () => {
    const { loader, render } = counting();

    // Produce a genuine cached SVG to seed with, then start from an empty cache.
    const primed = await renderPass(doc(FENCE_A), loader, render);
    expect(primed.invocations).toBe(1);
    const source = 'graph TD; A-->B;\n';
    const realKey = await diagramCacheKey(source, currentEffectiveTheme(), engineVersion());
    const svg = await readDiagram(realKey);
    expect(svg, 'the production path must have cached under exactly this key — if this is ' +
      'undefined the key derivation under test and the one in the enhancer have diverged').toBeTruthy();

    // (a) SEEDED AT A DIFFERENT VERSION — identical in source and theme, differing in the version
    // component alone. The production render must NOT find it.
    await clearDiagramCache();
    const staleKey = await diagramCacheKey(source, currentEffectiveTheme(), '0.0.0-not-the-real-version');
    expect(staleKey).not.toBe(realKey);
    await storeDiagram(staleKey, svg!);
    expect(
      (await renderPass(doc(FENCE_A), loader, render)).invocations,
      'a row stored under another engine version must be unreachable — a bump makes old rows ' +
        'stale by construction, which is what lets eviction reclaim them without purge logic',
    ).toBe(1);

    // (b) THE CONTROL, same test, same seed mechanism: seeded at the PRODUCTION version, which
    // differs from (a) in that one component only. Now it hits.
    await clearDiagramCache();
    await storeDiagram(realKey, svg!);
    expect(
      (await renderPass(doc(FENCE_A), loader, render)).invocations,
      'seeded at the real engine version, the same document must be served from cache — this is ' +
        'what proves (a) measured the version component and not a broken seed',
    ).toBe(0);
  });

  it('a cleared cache renders afresh — the control surface really empties the store it describes', async () => {
    const { loader, render } = counting();

    expect((await renderPass(doc(FENCE_A), loader, render)).invocations).toBe(1);
    expect((await renderPass(doc(FENCE_A), loader, render)).invocations).toBe(0); // cached

    await clearDiagramCache();
    expect((await describeStored()).diagrams.count).toBe(0);

    expect(
      (await renderPass(doc(FENCE_A), loader, render)).invocations,
      'after "Clear diagram cache" the diagram must be drawn again — a control that leaves the ' +
        'cache serving would be a panel that lies about what it erased',
    ).toBe(1);
  });

  it('★ does NOT cache an artifact the SANITIZER rejected — a failure must stay transient', async () => {
    // THE POISONING CASE. If the write happened on the engine's return rather than after sanitize
    // survived, a rejected artifact would be stored and served back on every later sight of that
    // diagram — re-rejected each time, without the engine ever getting another attempt. §3.8's
    // failures are transient by design; caching one makes it permanent, cached, and invisible.
    const corrupting: EngineLoader = async () =>
      ({
        default: {
          initialize: (config) => mermaid.initialize(config as never),
          render: async (id, definition, container) => {
            const r = await mermaid.render(id, definition, container);
            // A real engine success whose artifact the profile cannot recognise (no <svg> root).
            return { ...r, svg: r.svg.replace('<svg', '<foreignObject').replace(/<\/svg>$/, '</foreignObject>') };
          },
        } as DiagramEngine,
      }) as unknown as DiagramEngineModule;

    const shadow = enhancedHost(doc(FENCE_A), corrupting);
    await settleDiagrams(shadow);
    // It really did fail — otherwise the "nothing cached" below is vacuous.
    expect(shadow.querySelectorAll(`pre[${DIAGRAM_STATE_ATTR}="failed"]`)).toHaveLength(1);

    // NOTHING WAS STORED.
    expect((await describeStored()).diagrams.count, 'a sanitize-rejected artifact must not be cached').toBe(0);

    // ...and the very next render, with a healthy engine, succeeds — proving the failure did not
    // survive in storage to re-serve itself.
    const { loader, render } = counting();
    const retry = await renderPass(doc(FENCE_A), loader, render);
    expect(retry.invocations, 'the engine must get another attempt — the failure was transient').toBe(1);
    assertRenderedFigure(retry.shadow);
  });

  it('deletion is META FIRST: a meta row pointing at missing content is a MISS, not a dangle', async () => {
    // The write-crash window, constructed directly. `storeDiagram` writes meta then content; a
    // crash between leaves exactly this state. The requirement is that it read as a MISS — the
    // diagram is re-rendered and both rows are rewritten — rather than as a hit on nothing, and
    // that the panel OVER-reports the bytes in the meantime rather than under-reporting them.
    const key = await diagramCacheKey('graph TD; M-->N;\n', currentEffectiveTheme(), engineVersion());
    await storeDiagram(key, '<svg xmlns="http://www.w3.org/2000/svg"></svg>');
    expect(await readDiagram(key)).toBeTruthy();

    // Remove the CONTENT row only — meta survives, pointing at nothing.
    const { connection, STORES } = await import('../../src/app/store');
    const { del } = await import('../../src/app/idbCore');
    await del(await connection(), STORES.diagrams, key);

    // A MISS, not a throw and not an empty string served as a diagram.
    expect(await readDiagram(key), 'meta without content must read as a miss — the diagram is ' +
      're-rendered and the state self-reclaims').toBeUndefined();
    // Bytes are OVER-reported (the meta row still counts) — never under. That is the safe
    // direction: the trust panel admits more storage than is held, not less.
    expect((await describeStored()).diagrams.count).toBe(1);
  });
});

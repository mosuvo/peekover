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
import {
  DIAGRAM_ERROR_CLASS,
  DIAGRAM_FIGURE_CLASS,
  DIAGRAM_STATE_ATTR,
} from '../../src/render/diagramView';
import {
  bytesOf,
  diagramCacheKey,
  readDiagram,
  storeDiagram,
  PROPOSED_DIAGRAM_TOTAL_BYTES,
} from '../../src/app/diagramCache';
import { clearDiagramCache, describeStored, __resetConnectionForTest } from '../../src/app/store';
import { setThemeSetting } from '../../src/theme/reader';
import { currentEffectiveTheme } from '../../src/theme/reader';
import { mountAppShell, type AppStore } from '../../src/app/appShell';
import type { FolderSource } from '../../src/app/folderSource';
import { resetDiffRegistryForTest } from '../../src/render/diffRegistry';
import { resetWatchRegistryForTest, stopWatch } from '../../src/watch/watchRegistry';
import { resetWatchControlsForTest } from '../../src/watch/watchControl';
import { resetThemeHostsForTest } from '../../src/theme/themeRegistry';
import { resetThemeControlsForTest } from '../../src/theme/themeControl';

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

  // ── 4.4 — THE QUIET SINGLE-OVERSIZED PATH ───────────────────────────────────────────────────
  //
  // §4: a diagram the cache cannot take must "render normally without caching" and the refusal
  // must not be "presented as a blocking error". `planDiagramWrite`'s pre-check is where that is
  // decided (`diagramCache.ts:243`) and its whole disposition is to do NOTHING — no eviction, no
  // write, no message. This is the behavioural end of it, on a real engine artifact.
  //
  // ★ THE TRAP THIS TEST IS SHAPED AROUND: AN ABSENT ERROR AND AN ABSENT DIAGRAM LOOK IDENTICAL.
  // A test that asserted only "no marker is present" would read green over a fence that never
  // drew anything at all — the silent-empty-box failure §3.8 exists to forbid, passing as the
  // quiet degradation §4 asks for. So both halves are asserted: the figure IS on screen, AND
  // nothing says why it might not be. Presence and absence, or the claim is half a claim.
  //
  // The oversized-ness is asserted rather than assumed (`bytesOf` against the bound), and the
  // padding is `<text>`, which `SVG_ALLOWED_TAGS` keeps — so what is refused here is an oversized
  // DIAGRAM, not a string the sanitizer would have thrown out for an unrelated reason.
  it('★ a single OVERSIZED diagram renders normally, is NOT stored, evicts NOTHING, says NOTHING', async () => {
    const { loader, render } = counting();

    // (a) THE CONTROL, and the row that must SURVIVE. It does two jobs: it proves the "renders
    //     normally" assertion below is not vacuous — the same helper is asserted here against a
    //     diagram that genuinely drew — and it puts something in the cache for the oversized
    //     write to fail to sweep.
    const normal = await renderPass(doc(FENCE_A), loader, render);
    expect(normal.invocations, 'the control must really render — otherwise "evicts nothing" is a ' +
      'claim about an empty store').toBe(1);
    assertRenderedFigure(normal.shadow);
    const seeded = await describeStored();
    expect(seeded.diagrams.count).toBe(1);
    expect(seeded.diagrams.bytes).toBeGreaterThan(0);

    // (b) A REAL engine success, padded past the WHOLE byte bound. Not a fabricated string: the
    //     engine really renders, and the padding rides on its artifact.
    const padding = 'x'.repeat(PROPOSED_DIAGRAM_TOTAL_BYTES + 1024);
    expect(bytesOf(padding), 'the premise of this test is that the SVG exceeds the whole byte ' +
      'bound — if this fails the short-circuit under test is never reached').toBeGreaterThan(
      PROPOSED_DIAGRAM_TOTAL_BYTES,
    );
    const oversized: EngineLoader = async () =>
      ({
        default: {
          initialize: (config) => mermaid.initialize(config as never),
          render: async (id, definition, container) => {
            const r = await mermaid.render(id, definition, container);
            return { ...r, svg: r.svg.replace(/<\/svg>\s*$/, `<text>${padding}</text></svg>`) };
          },
        } as DiagramEngine,
      }) as unknown as DiagramEngineModule;

    const shadow = enhancedHost(doc(FENCE_B), oversized);
    await settleDiagrams(shadow);

    // RENDERS NORMALLY — the PRESENCE half.
    assertRenderedFigure(shadow);
    // ...and SAYS NOTHING — the ABSENCE half. No inline marker, no failed fence. Neither of these
    // means anything without the line above.
    expect(
      shadow.querySelectorAll(`.${DIAGRAM_ERROR_CLASS}`),
      'refusing to cache is not a failure the user has an action for — §4 forbids surfacing it',
    ).toHaveLength(0);
    expect(shadow.querySelectorAll(`[${DIAGRAM_STATE_ATTR}="failed"]`)).toHaveLength(0);

    // NOT STORED — asserted against the diagram's OWN key, so this is "nothing was written for
    // this diagram" rather than "the count happens to look the same".
    const oversizedKey = await diagramCacheKey(
      'graph TD; X-->Y-->Z;\n',
      currentEffectiveTheme(),
      engineVersion(),
    );
    expect(await readDiagram(oversizedKey), 'the oversized SVG must not be stored').toBeUndefined();

    // EVICTS NOTHING — the row from (a) is untouched, by count AND by bytes. The short-circuit
    // returns before the projection, so there is no sweep to survive; if it ever grew one, an
    // oversized diagram would cost the user every other cached diagram on its way to being refused.
    const after = await describeStored();
    expect(after.diagrams.count, 'an oversized write must not sweep the cache').toBe(1);
    expect(after.diagrams.bytes).toBe(seeded.diagrams.bytes);

    // ...and the survivor still SERVES. "Evicts nothing" as behaviour, not merely as a count.
    expect(
      (await renderPass(doc(FENCE_A), loader, render)).invocations,
      'the pre-existing entry must still be a hit — a store that kept the row but lost the ' +
        'content would satisfy every count above and serve nothing',
    ).toBe(0);
  }, 60_000);
});

// ── 4.4 ★ THE CACHE UNDER WATCH — THE CASE IT EXISTS FOR ─────────────────────────────────────
//
// §3.3 makes every watch re-render RE-ENHANCE, because `mount()` commits with `replaceChildren`
// and therefore destroys the rendered diagrams along with everything else. That is correct and it
// is expensive: an agent rewriting the prose around an untouched diagram would re-run the engine
// over that diagram on every single poll. The cache is what makes §3.3 affordable rather than
// merely correct — and THIS is the case it exists for, so it is proved on the real thing.
//
// ── THE CONTROLLER IS NOT HAND-BUILT, AND THAT IS THE WHOLE DESIGN OF THIS BLOCK ──────────────
//
// 3.4's banked lesson, restated because it applies here identically: four sibling watch suites
// build `createWatchController({ detector, contained, docId })` directly and take its DEFAULT
// `render`, which is bare `mount` — no enhancer, no cache, no engine. A hit measured on such a
// controller would be a hit on a code path production does not run. `render: renderWithDiagrams`
// is provisioned in exactly ONE place (`appShell.ts:845`, inside `installWatchForFile`), so the
// only thing that can prove the shipped app page serves a watched diagram from cache is the
// shipped app page: mountAppShell -> open folder -> click the file -> click the pill -> change
// the bytes `read()` returns -> wait out a real 1 s poll. That is what runs below.
//
// ── THE DISCRIMINATOR, AND WHY IT IS NOT "NOTHING HAPPENED" ───────────────────────────────────
//
// "Served from cache" is the negative claim `engine.render` was not called, and a zero is what a
// dead spy, a document that never re-rendered and a genuine hit all produce. Three things are
// asserted alongside it, in the same test:
//
//   1. THE PROSE REALLY CHANGED — the reader's text carries the new sentence. A re-render
//      genuinely fired; this is not a poll that saw nothing.
//   2. THE OLD FIGURE WAS REALLY DESTROYED — `isConnected` is FALSE on the figure captured
//      immediately before the edit. `replaceChildren` took it, so the figure found afterwards is
//      a NEW element that something had to build. Without re-enhancement there would be no
//      figure at all, and without the cache that build would have cost an engine render.
//   3. THE POSITIVE CONTROL, SAME TEST, SAME COUNTER — a second edit that changes the DIAGRAM
//      SOURCE. New source -> new hash -> new key -> miss -> the engine IS invoked. Without this
//      the zero above could just mean the re-render never reached the diagram at all.
//
// ── COUNTING THROUGH A PATH WITH NO INJECTED LOADER ───────────────────────────────────────────
//
// The tests above wrap the engine in a loader they hand `enhanceDiagrams` themselves. There is no
// such seam here and there must not be one: `installWatchForFile` calls `renderWithDiagrams`,
// which calls `enhanceDiagrams(host)` with no options, and adding an injection point to
// production so a test could watch it would be the test dictating the shape of the thing it
// measures. So the singleton is spied instead — `mermaid.render` is the very method
// `loadDiagramEngine` hands back (`diagramEngine.ts:220` returns the module's `default`, which IS
// this object). The spy CALLS THROUGH, so the real engine still draws, and it is restored in
// `afterEach` because the suites above share this instance.

/** Writes nothing anywhere — the grant flow's IndexedDB traffic is irrelevant here (3.4's). */
function noopStore(): AppStore {
  return {
    putFolder: async () => undefined,
    deleteFolder: async () => undefined,
    putRecent: async () => undefined,
  };
}

/** The file on "disk": mutable bytes, plus a count of how many times they have been read.
 *
 *  THE COUNT IS NOT DECORATION (3.4's finding, and this block inherits the hazard whole).
 *  `pollingDetector` treats its FIRST read after `start()` as the BASELINE and delivers nothing
 *  (`changeDetector.ts:106-108`). Bytes changed between the pill click and that first poll are
 *  therefore never a CHANGE — they are simply what the file always said, and the watch correctly
 *  stays silent forever. The edit below waits for the baseline read to have LANDED, which this
 *  counter is the only honest way to observe. */
interface DiskFile {
  text: string;
  reads: number;
}

/** A PERSISTABLE in-memory folder whose one file re-reads {@link DiskFile}. `persistable: true` is
 *  what makes `watchCapability({surface:'app-page'})` return watchable, so `installWatchForFile`
 *  reaches its `createWatchController` site instead of the "cannot watch" early return. */
function mutableSource(disk: DiskFile): FolderSource {
  return {
    name: 'docs',
    truncated: false,
    persistable: true,
    files: [
      {
        path: 'watched.md',
        name: 'watched.md',
        read: async () => {
          disk.reads += 1;
          return disk.text;
        },
      },
    ],
  };
}

async function until<T>(fn: () => T | null | undefined | false, tries = 400): Promise<T> {
  for (let i = 0; i < tries; i += 1) {
    const v = fn();
    if (v) return v as T;
    await new Promise<void>((r) => setTimeout(r, 25));
  }
  throw new Error('until() timed out');
}

/** The three states of the watched file. 1 -> 2 changes the PROSE ONLY, leaving the fence
 *  byte-identical (the hit). 2 -> 3 changes the FENCE ONLY, leaving the prose byte-identical (the
 *  control). Each transition isolates one variable, which is what makes each verdict attributable. */
const WATCH_FENCE = '```mermaid\ngraph TD; A-->B;\n```';
const WATCH_1 = `# Watched\n\nBefore the agent touched it.\n\n${WATCH_FENCE}\n`;
const WATCH_2_PROSE_ONLY = `# Watched\n\nThe agent rewrote the prose around it.\n\n${WATCH_FENCE}\n`;
const WATCH_3_SOURCE_TOO =
  '# Watched\n\nThe agent rewrote the prose around it.\n\n```mermaid\ngraph LR; X-->Y-->Z;\n```\n';

describe('★ the cache under WATCH (task 4.4, §3.3) — production path, no hand-built controller', () => {
  let engineCalls: Mock;

  beforeEach(async () => {
    resetDiffRegistryForTest();
    resetWatchRegistryForTest();
    resetWatchControlsForTest();
    resetThemeHostsForTest();
    resetThemeControlsForTest();
    setThemeSetting('light'); // pins the key's theme component across all three renders
    await clearDiagramCache(); // 4.3's rule: no prior test's cache may feed this one
    const original = mermaid.render.bind(mermaid);
    engineCalls = vi
      .spyOn(mermaid, 'render')
      .mockImplementation((id, definition, container) => original(id, definition, container));
  });

  afterEach(async () => {
    stopWatch(); // a live 1 s poll would otherwise keep reading into the next test's document
    engineCalls.mockRestore(); // the instance is shared with the suites above
    for (const el of cleanup.splice(0)) el.remove();
    for (let i = 0; i < 400 && document.querySelector(`.${DIAGRAM_MEASURE_CLASS}`); i += 1) {
      await new Promise<void>((r) => setTimeout(r, 25));
    }
    resetDiffRegistryForTest();
    resetWatchRegistryForTest();
    resetWatchControlsForTest();
    resetThemeHostsForTest();
    resetThemeControlsForTest();
    setThemeSetting('auto');
    await clearDiagramCache();
    __resetConnectionForTest();
  });

  it('serves the diagram FROM CACHE when the prose changes and its SOURCE does not', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    cleanup.push(container);

    const disk: DiskFile = { text: WATCH_1, reads: 0 };
    const app = mountAppShell(container, {
      openFolder: async () => ({ ok: true, source: mutableSource(disk) }),
      store: noopStore(),
    });
    await app.openFolder();

    // The real gesture. `selectFolderFile`'s synchronous head runs `installWatchForFile`, which is
    // the ONLY place `render: renderWithDiagrams` is ever provisioned onto a controller.
    container.querySelector<HTMLButtonElement>('[role="treeitem"][data-kind="file"]')!.click();

    const host = await until(() =>
      container.querySelector<HTMLElement>('.peekover-app__reader__host'),
    );
    const shadow = await until(() => host.shadowRoot);

    // PASS 1 — cold cache, real engine, real pane. THE POSITIVE CONTROL for every zero below: if
    // this ever reads 0, the counter is wired to nothing and the hit means nothing.
    const firstFigure = await until(() =>
      shadow.querySelector<HTMLElement>(`${FIGURE_SELECTOR}[${DIAGRAM_STATE_ATTR}="rendered"]`),
    );
    expect(firstFigure.querySelector('svg')).not.toBeNull();
    expect(
      engineCalls.mock.calls.length,
      'the FIRST render must invoke the engine — a cold cache is a miss, and that is what makes ' +
        'the re-render zero below a HIT rather than a dead spy',
    ).toBe(1);
    expect((await describeStored()).diagrams.count).toBe(1);

    // Start watching, through the shipped pill. Nothing polls until this happens.
    const pill = await until(() => shadow.querySelector<HTMLButtonElement>('.peekover-watch'));
    const readsBeforeStart = disk.reads;
    pill.click();
    expect(pill.getAttribute('aria-pressed')).toBe('true');
    await until(() => disk.reads > readsBeforeStart); // the BASELINE read — see DiskFile

    // ── ★ THE DISCRIMINATOR: PROSE CHANGES, DIAGRAM SOURCE DOES NOT ──────────────────────────
    // Captured immediately before the edit, so `isConnected` below is a claim about THIS
    // re-render rather than about anything that may have happened earlier.
    const preChangeFigure = await until(() =>
      shadow.querySelector<HTMLElement>(`${FIGURE_SELECTOR}[${DIAGRAM_STATE_ATTR}="rendered"]`),
    );
    const beforeProse = engineCalls.mock.calls.length;
    disk.text = WATCH_2_PROSE_ONLY;

    // Re-QUERIED every poll, never captured: `replaceChildren` makes the reading column a new
    // element after the re-render, so a held reference reports the old document forever.
    await until(() =>
      (shadow.querySelector('.peekover-reader')?.textContent ?? '').includes(
        'rewrote the prose around it',
      ),
    );

    // (1) the re-render really happened, and (2) it really destroyed the rendered diagram.
    expect(preChangeFigure.isConnected).toBe(false);

    // The figure below is therefore a NEW element that a second enhancement pass had to build.
    const cachedFigure = await until(() =>
      shadow.querySelector<HTMLElement>(`${FIGURE_SELECTOR}[${DIAGRAM_STATE_ATTR}="rendered"]`),
    );
    expect(cachedFigure).not.toBe(preChangeFigure);
    expect(cachedFigure.querySelector('svg')).not.toBeNull();
    // ...and the fence beside it is byte-identical to the one that rendered the first time, which
    // is the premise the whole claim rests on: same source -> same hash -> same key.
    expect(shadow.querySelector('pre[data-diagram]')?.textContent).toContain('graph TD; A-->B;');

    // ★ THE CLAIM. The document re-rendered, the diagram was rebuilt, and the engine was not run.
    expect(
      engineCalls.mock.calls.length - beforeProse,
      'a watch re-render that changed only the PROSE must serve its diagram from cache — a ' +
        'non-zero count here is the engine re-drawing an untouched diagram on every poll, which ' +
        'is the cost the cache exists to remove from §3.3',
    ).toBe(0);
    // A hit rewrites its row in place; it never appends one.
    expect((await describeStored()).diagrams.count).toBe(1);

    // ── THE CONTROL, SAME TEST, SAME COUNTER: THE SOURCE CHANGES TOO ─────────────────────────
    // Prose byte-identical to WATCH_2, fence different. New hash -> new key -> miss.
    const beforeSource = engineCalls.mock.calls.length;
    disk.text = WATCH_3_SOURCE_TOO;

    await until(() =>
      (shadow.querySelector('pre[data-diagram]')?.textContent ?? '').includes(
        'graph LR; X-->Y-->Z;',
      ),
    );
    const freshFigure = await until(() =>
      shadow.querySelector<HTMLElement>(`${FIGURE_SELECTOR}[${DIAGRAM_STATE_ATTR}="rendered"]`),
    );
    expect(freshFigure).not.toBe(cachedFigure);
    expect(freshFigure.querySelector('svg')).not.toBeNull();

    expect(
      engineCalls.mock.calls.length - beforeSource,
      'a diagram whose SOURCE changed must be drawn afresh — this is what proves the zero above ' +
        'measured a cache hit and not a re-render that never reached the diagram',
    ).toBe(1);
    // Both renderings are rows now: the cache partitioned on the hash, it did not overwrite.
    expect((await describeStored()).diagrams.count).toBe(2);
  }, 45_000);
});

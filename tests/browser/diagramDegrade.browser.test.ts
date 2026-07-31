// GROUP 6 — THE TWO SYSTEMIC FAILURES, BOTH IN THIS FILE (§6.2's Files names it alongside §6.1's).
// The first half below is 6.1, THE ENGINE GONE; the second half, from its own banner, is 6.2, THE
// STORE GONE. Different layers, different degradations — and the pair is the group.
//
// ★ SYSTEMIC FAILURE — THE ENGINE CHUNK NEVER ARRIVES (007 group 6, task 6.1).
//
// The failure groups 3–5 cannot reach: not a bad fence, not a rejected artifact, not a cache that
// declined a row — the WHOLE lazy chunk fails to load. `import('mermaid')` rejects (404, CSP block,
// a stalled fetch that finally gives up), so NO fence in the document ever gets an SVG. §4: *if the
// engine cannot be loaded at all, render every diagram block as a code fence and never blank the
// page.*
//
// ── WHAT §6.1 SPECIFIES, AND WHAT IT DOES NOT ────────────────────────────────────────────────
//
// The degradation §6.1 names is: **every fence remains a VISIBLE source `<pre>`, the text fully
// readable, the reader interactive, and no placeholder left stranded** — "assert placeholders
// resolved or removed, not merely that the page is non-blank". It names NO systemic banner and NO
// suppression of §3.8's per-fence marker, and this file invents neither. The shipped shape is
// §3.8's THREE FAILURES, EACH TO THE SAME PLACE: engine load, parse/render and sanitize rejection
// all end at `markDiagramFailed` — source fence visible, placeholder removed, an inline marker
// naming which one it was (`diagramEnhancer.ts`'s §3.8 header).
//
// So what makes an engine-load failure SYSTEMIC is not a different presentation; it is the COUNT
// and the UNIFORMITY. The catch is document-wide by nature ("there is no per-fence half of it"), so
// the observable is that ALL N fences land in the identical state from ONE failure — never the
// partial state a per-fence failure produces (3.2's mixed document: one fence source, the next one
// rendered). This file asserts that uniformity over N fences rather than over 3.2's two.
//
// ── WHY THIS IS NOT A RE-RUN OF 3.2's ARM ────────────────────────────────────────────────────
//
// `diagramRender.browser.test.ts`'s engine-load arm is deliberately modest and says so in its own
// title ("6.1 owns the full proof"): two fences, no readability claim, no interactivity claim, no
// revert of its own. It establishes that the path exists. This file is the proof — N fences, each
// fence's OWN source read back in full, the placeholders proved to have EXISTED and then resolved,
// the reader driven through a real control afterwards, and a revert-and-fail of its own.
//
// ── THE SEAM IS THE ONE THAT ALREADY EXISTS ──────────────────────────────────────────────────
//
// `EnhanceOptions.loader` has been the injectable engine loader since 3.2, for exactly this: "a
// test that needs the real engine to FAIL to load ... has no other seam — the import specifier is a
// static string literal by D-13 and must stay one". Nothing here grows a new production seam, and
// `enhancedReader` below is `appShell.ts:134-135`'s shipped body verbatim — `mount(text, target,
// options)` then `enhanceDiagrams(target)` — which is D-12's second call site. The last arm drives
// `createReaderPane` end to end with NOTHING injected, so the harness is tied to the pane rather
// than standing in for it.
//
// ── NON-VACUITY, ON TWO AXES, BECAUSE BOTH CLAIMS PASS TRIVIALLY ON A DEAD HARNESS ───────────
//
//   1. "the source stays visible" is TRUE of a fence that was never enhanced at all. So the same
//      harness, same fixture, with the loader omitted (the production `import('mermaid')`), must
//      HIDE the source and produce figures. That is 3.2's success-control pattern, extended to the
//      whole fixture rather than to one fence.
//   2. "no placeholder is left stranded" is TRUE of a document that grew no placeholders. So each
//      failure arm reads the placeholder count SYNCHRONOUSLY, before the async body can have run,
//      and requires N of them — then requires zero after. Resolved, not absent.

import { describe, it, expect, afterEach, beforeEach, vi, type Mock } from 'vitest';
import mermaid from 'mermaid';
import { createReaderPane } from '../../src/app/readerPane';
import { mount } from '../../src/render/mount';
import {
  DIAGRAM_MEASURE_CLASS,
  diagramSourceOf,
  enhanceDiagrams,
} from '../../src/render/diagramEnhancer';
import { engineVersion } from '../../src/render/diagramEngine';
import type { DiagramEngine, DiagramEngineModule, EngineLoader } from '../../src/render/diagramEngine';
import {
  DIAGRAM_ERROR_CLASS,
  DIAGRAM_FIGURE_CLASS,
  DIAGRAM_STATE_ATTR,
} from '../../src/render/diagramView';
import {
  clearDiagramCache,
  describeStored,
  DB_NAME,
  STORES,
  __resetConnectionForTest,
} from '../../src/app/store';
import { diagramCacheKey, readDiagram } from '../../src/app/diagramCache';
import { mountAppShell, type AppStore } from '../../src/app/appShell';
import type { FolderSource } from '../../src/app/folderSource';
import { currentEffectiveTheme } from '../../src/theme/reader';
import { stopWatch, resetWatchRegistryForTest } from '../../src/watch/watchRegistry';
import { resetWatchControlsForTest } from '../../src/watch/watchControl';
import { resetThemeHostsForTest } from '../../src/theme/themeRegistry';
import { resetThemeControlsForTest } from '../../src/theme/themeControl';
import { resetDiffRegistryForTest } from '../../src/render/diffRegistry';

const FIGURE_SELECTOR = `figure.${DIAGRAM_FIGURE_CLASS}`;
const PRE_SELECTOR = `pre[${DIAGRAM_STATE_ATTR}]`;

/**
 * The failing loader: what an unreachable chunk looks like from here. §6.1 names the REJECT case
 * ("with the dynamic import forced to reject"), which is where a 404, a CSP block and a fetch that
 * finally gives up all converge — `import()` returns a promise and that promise rejects.
 */
const chunkUnavailable: EngineLoader = async () => {
  throw new Error('Failed to fetch dynamically imported module: chunks/mermaid.core (test-only)');
};

// ── The fixture: N distinct diagrams, so "readable" is per fence rather than per document ────
//
// FOUR fences, each with its OWN node labels. A single shared source would let one readable fence
// satisfy an assertion written over `shadow.textContent`, which is the same vacuity as reading the
// page for "non-blank": the point of N distinct sources is that each `<pre>` must be shown to hold
// ITS OWN diagram, in full, not merely that diagram-ish text survives somewhere.
//
// All four are flowcharts on purpose. mermaid registers diagram definitions LAZILY, so mixing in a
// `sequenceDiagram` would make the SUCCESS control pay for a second definition chunk for no gain —
// and the property under test is the engine's absence, which no diagram type varies.

interface Fixture {
  readonly label: string;
  readonly source: string;
}

const DIAGRAMS: readonly Fixture[] = [
  { label: 'alpha', source: 'graph TD\n  A1[Alpha one] --> A2[Alpha two]' },
  { label: 'beta', source: 'graph LR\n  B1[Beta one] --> B2[Beta two] --> B3[Beta three]' },
  { label: 'gamma', source: 'graph TD\n  G1[Gamma one] --> G2{Gamma two}' },
  { label: 'delta', source: 'graph LR\n  D1[Delta one] --> D2[Delta two]' },
];

/** The opening and closing prose — the "never a blank page" ends of the document, and the text a
 *  reader would lose if a systemic failure took the render down with it. */
const OPENING = 'Opening prose, above every diagram in this document.';
const CLOSING = 'Closing prose, below every diagram in this document.';

/**
 * A NON-mermaid fence, included as the untouched-neighbour control: the enhancer selects
 * `pre > code.language-mermaid`, so this one must carry no state attribute, gain no placeholder and
 * grow no marker on any path. Without it, "every `<pre>` is visible source" would be satisfied by
 * an enhancer that simply gave up on the whole document.
 */
const PLAIN_FENCE_SOURCE = "const notADiagram = 'ordinary code, left entirely alone';";

const MULTI_DIAGRAM_DOC = [
  '# A document with four diagrams',
  '',
  OPENING,
  '',
  ...DIAGRAMS.flatMap((d) => [
    `Prose introducing the ${d.label} diagram.`,
    '',
    '```mermaid',
    d.source,
    '```',
    '',
  ]),
  '```ts',
  PLAIN_FENCE_SOURCE,
  '```',
  '',
  CLOSING,
  '',
].join('\n');

const cleanup: HTMLElement[] = [];

// Same isolation 3.2 adopted at 4.3 and for the same reason: a render is CACHED and the cache
// outlives a test, so a success control could otherwise be served a hit and never touch the engine.
// The failure arms never reach the cache at all (the engine load precedes every lookup), so this is
// hygiene for the controls rather than a precondition of the claims.
beforeEach(async () => {
  await clearDiagramCache();
});

afterEach(async () => {
  await clearDiagramCache();
  for (const el of cleanup.splice(0)) el.remove();
  // DRAIN — 3.2's harness lesson. The measuring container lives in `document.body` by necessity
  // (D-6 step 1, light DOM), so a success control still in flight would read as the next test's.
  for (let i = 0; i < 400 && document.querySelector(`.${DIAGRAM_MEASURE_CLASS}`); i += 1) {
    await new Promise<void>((r) => setTimeout(r, 25));
  }
});

/**
 * `appShell.ts:134-135`'s shipped body, verbatim: mount, then enhance. D-12's second call site, and
 * the only shape an injected loader can enter through (`readerPane` and `appShell` both call
 * `enhanceDiagrams(target)` with no options, which is the production `import('mermaid')`).
 *
 * Returns the host as well as its shadow root because the interactivity arm drives the mode toggle,
 * whose state lives on the host.
 */
function enhancedReader(
  markdown: string,
  loader?: EngineLoader,
): { host: HTMLElement; shadow: ShadowRoot } {
  const host = document.createElement('div');
  document.body.appendChild(host);
  cleanup.push(host);
  mount(markdown, host, { contained: true });
  enhanceDiagrams(host, loader ? { loader } : {});
  if (!host.shadowRoot) throw new Error('expected a mounted host');
  return { host, shadow: host.shadowRoot };
}

/** The app page's OWN path, with nothing injected at all: `createReaderPane` -> select() ->
 *  mount() -> D-12's first call site -> the production `import('mermaid')`. */
async function appPageReader(markdown: string): Promise<ShadowRoot> {
  const pane = createReaderPane(document);
  document.body.appendChild(pane.element);
  cleanup.push(pane.element);
  await pane.select({ name: 'degrade.md', read: async () => markdown });
  const host = pane.element.querySelector<HTMLElement>('.peekover-app__reader__host');
  if (!host?.shadowRoot) throw new Error('reader pane produced no mounted host');
  return host.shadowRoot;
}

/**
 * Wait until nothing is `pending` — `rendered` and `failed` both leave that state, so a document
 * that never settles is one whose enhancement DIED rather than degraded.
 *
 * ★ THE MESSAGE IS THIS TASK'S REVERT-AND-FAIL, IN THE DEFECT'S OWN UNITS. Remove the engine-load
 * catch from `renderDiagrams` and the rejection escapes a `void`-ed promise: nothing marks anything,
 * and every placeholder this pass inserted sits in the document forever. What the user is left with
 * is not a code fence — it is N empty boxes waiting for a render that will never come. This sentence
 * names them and counts them, so the red says which failure happened rather than "timed out".
 */
async function settleDiagrams(shadow: ShadowRoot, tries = 600): Promise<void> {
  const pending = (): Element[] => [
    ...shadow.querySelectorAll(`[${DIAGRAM_STATE_ATTR}="pending"]`),
  ];
  for (let i = 0; i < tries; i += 1) {
    if (pending().length === 0) return;
    await new Promise<void>((r) => setTimeout(r, 25));
  }
  const stuck = pending();
  const figures = stuck.filter((el) => el.tagName === 'FIGURE').length;
  throw new Error(
    `the engine-load degradation never happened: ${figures} placeholder figure(s) LEFT STRANDED ` +
      `and ${stuck.length - figures} fence(s) still pending, of ` +
      `${shadow.querySelectorAll(PRE_SELECTOR).length} enhanced fences — the pass died rather ` +
      `than degrading, so no fence is a code fence and every diagram slot is an empty box`,
  );
}

/** Every enhanced source `<pre>`, in document order. */
function fences(shadow: ShadowRoot): HTMLElement[] {
  return [...shadow.querySelectorAll<HTMLElement>(PRE_SELECTOR)];
}

/** The count that says a placeholder EXISTED — read synchronously, before the async body can run. */
function placeholders(shadow: ShadowRoot): Element[] {
  return [...shadow.querySelectorAll(`${FIGURE_SELECTOR}[${DIAGRAM_STATE_ATTR}="pending"]`)];
}

describe('6.1 — the engine chunk never arrives: every fence stays a readable code fence', () => {
  it('★ all N fences degrade IDENTICALLY, each showing its own source in full', async () => {
    const { shadow } = enhancedReader(MULTI_DIAGRAM_DOC, chunkUnavailable);

    // NON-VACUITY, AXIS 2 — read BEFORE the await, so this is the synchronous prologue's output and
    // nothing else. The placeholders have to exist for "not left stranded" to mean anything.
    expect(
      placeholders(shadow),
      'the synchronous prologue inserted no placeholders, so every claim below about their ' +
        'resolution would be a claim about an unenhanced document',
    ).toHaveLength(DIAGRAMS.length);

    await settleDiagrams(shadow);

    const pres = fences(shadow);
    expect(pres).toHaveLength(DIAGRAMS.length);

    // ★ SYSTEMIC, NOT PER-FENCE: one failure, and ALL N land in the SAME state. There is no
    // partial document here — no fence rendered, none left pending, none in a third state. The
    // uniform count is the observable that distinguishes a document-wide engine-load failure from
    // 3.2's mixed document, where one fence fails and the next one draws.
    expect(pres.map((pre) => pre.getAttribute(DIAGRAM_STATE_ATTR))).toEqual(
      DIAGRAMS.map(() => 'failed'),
    );

    DIAGRAMS.forEach((diagram, i) => {
      const pre = pres[i];

      // VISIBLE — computed style AND geometry. `data-diagram="rendered"` is the only value the
      // reader stylesheet hides (`readerCss.ts`), so this is the claim that the CSS contract, not
      // just the attribute, kept the source on screen.
      expect(getComputedStyle(pre).display, `${diagram.label}: display`).not.toBe('none');
      expect(getComputedStyle(pre).visibility, `${diagram.label}: visibility`).not.toBe('hidden');
      expect(pre.getBoundingClientRect().height, `${diagram.label}: laid-out height`).toBeGreaterThan(
        0,
      );

      // FULLY READABLE — the whole source, verbatim, in THIS fence. Not "contains 'graph'": the
      // entire block, so a truncated or re-serialized fence reds.
      expect(pre.textContent, `${diagram.label}: source text`).toContain(diagram.source);
    });

    // NOTHING STRANDED — resolved or removed, per §6.1. `markDiagramFailed` removes the figure, so
    // both readings are asserted: none pending, and none left over at all (an empty bordered box
    // below a code fence reads as a broken image, which is the "never an empty box" half of §3.8).
    expect(placeholders(shadow), 'placeholders left stranded').toHaveLength(0);
    expect(shadow.querySelectorAll(FIGURE_SELECTOR), 'figures left over').toHaveLength(0);
    expect(shadow.querySelectorAll(`${FIGURE_SELECTOR}:empty`)).toHaveLength(0);

    // §3.8's marker, once per fence, all four naming THIS failure rather than a render failure.
    // §6.1 asks for neither a banner nor marker suppression, and the shipped shape is the
    // document-wide catch calling the same per-fence `markDiagramFailed` the other two failures do.
    const markers = [...shadow.querySelectorAll(`.${DIAGRAM_ERROR_CLASS}`)];
    expect(markers).toHaveLength(DIAGRAMS.length);
    for (const marker of markers) {
      expect(marker.textContent).toContain('the diagram engine could not be loaded');
    }
    // Each marker sits with ITS fence, not collected somewhere else in the document.
    pres.forEach((pre, i) => expect(pre.nextElementSibling).toBe(markers[i]));

    // NEVER A BLANK PAGE (AGENTS.md #5) — the prose at both ends of the document survived, and the
    // untouched neighbour proves the enhancer degraded the fences rather than the document.
    expect(shadow.textContent).toContain(OPENING);
    expect(shadow.textContent).toContain(CLOSING);
    const plain = [...shadow.querySelectorAll('pre')].find((pre) =>
      pre.textContent?.includes(PLAIN_FENCE_SOURCE),
    );
    expect(plain, 'the non-mermaid fence').toBeTruthy();
    expect(plain!.hasAttribute(DIAGRAM_STATE_ATTR)).toBe(false);
  }, 30_000);

  it('the reader is still INTERACTIVE afterwards — the shipped control, really clicked', async () => {
    const { host, shadow } = enhancedReader(MULTI_DIAGRAM_DOC, chunkUnavailable);
    await settleDiagrams(shadow);

    // The Raw/Reading pill `mount()` commits into every reader, on both surfaces. Choosing the
    // reader's OWN control rather than a synthetic event is what makes this an interactivity claim:
    // a live listener, a live attribute flip, and a view that has to be built on demand.
    const toggle = shadow.querySelector<HTMLButtonElement>('.peekover-mode-toggle');
    expect(toggle, 'the Raw/Reading control').not.toBeNull();

    // Keyboard-reachable, not merely clickable (§3.5's affordance discipline).
    toggle!.focus();
    expect(shadow.activeElement).toBe(toggle);

    expect(host.getAttribute('data-mode')).toBe('reading');
    toggle!.click();
    expect(host.getAttribute('data-mode')).toBe('raw');

    // The raw view was BUILT on that click — lazily, from the registered source — and it holds
    // every diagram's text. A wedged reader produces no such node.
    const raw = shadow.querySelector<HTMLElement>('.peekover-raw');
    expect(raw, 'the lazily built raw view').not.toBeNull();
    for (const diagram of DIAGRAMS) expect(raw!.textContent).toContain(diagram.source);

    toggle!.click();
    expect(host.getAttribute('data-mode')).toBe('reading');

    // ...and the round trip did not disturb the degraded state: still N resolved, readable fences.
    const pres = fences(shadow);
    expect(pres.map((pre) => pre.getAttribute(DIAGRAM_STATE_ATTR))).toEqual(
      DIAGRAMS.map(() => 'failed'),
    );
    for (const pre of pres) expect(getComputedStyle(pre).display).not.toBe('none');
    expect(placeholders(shadow)).toHaveLength(0);
  }, 30_000);

  it('★ NON-VACUOUS CONTROL: the SAME fixture on the SAME harness, import succeeding, DOES render', async () => {
    // The only difference from the arms above is the loader — omitted here, so `loadDiagramEngine`
    // reaches the production `import('mermaid')`. If this arm did not hide the source, "the source
    // is visible after a failed load" would be a fact about the harness rather than about failing.
    const { shadow } = enhancedReader(MULTI_DIAGRAM_DOC);

    expect(placeholders(shadow)).toHaveLength(DIAGRAMS.length);
    await settleDiagrams(shadow);

    const pres = fences(shadow);
    expect(pres.map((pre) => pre.getAttribute(DIAGRAM_STATE_ATTR))).toEqual(
      DIAGRAMS.map(() => 'rendered'),
    );

    // The source is now HIDDEN — the mutation D-15 says success is — and a real <svg> stands in
    // each figure's place.
    for (const pre of pres) expect(getComputedStyle(pre).display).toBe('none');
    const figures = [...shadow.querySelectorAll(FIGURE_SELECTOR)];
    expect(figures).toHaveLength(DIAGRAMS.length);
    for (const figure of figures) expect(figure.querySelector('svg')).not.toBeNull();

    // Nothing failed, so nothing is marked: the marker count is the other half of the failure
    // arm's reading.
    expect(shadow.querySelectorAll(`.${DIAGRAM_ERROR_CLASS}`)).toHaveLength(0);
  }, 60_000);

  it('the pane path agrees — createReaderPane, nothing injected, renders the same fixture', async () => {
    // The harness above is `appShell.ts`'s body; this is `readerPane`'s, driven end to end with no
    // seam touched at all. It ties the two failure arms to the surface they are claims about.
    const shadow = await appPageReader(MULTI_DIAGRAM_DOC);
    await settleDiagrams(shadow);

    expect(fences(shadow).map((pre) => pre.getAttribute(DIAGRAM_STATE_ATTR))).toEqual(
      DIAGRAMS.map(() => 'rendered'),
    );
    expect(shadow.querySelectorAll(`${FIGURE_SELECTOR} svg`)).toHaveLength(DIAGRAMS.length);
  }, 60_000);
});

// ════════════════════════════════════════════════════════════════════════════════════════════
// ★ SYSTEMIC FAILURE, THE SECOND ONE — THE STORE IS GONE (007 group 6, task 6.2).
// ════════════════════════════════════════════════════════════════════════════════════════════
//
// 6.1 was the ENGINE gone. This is STORAGE gone, which is a different layer and a different
// degradation: the engine needs no IndexedDB, so every diagram still DRAWS — it simply never
// persists, so every render is a cold one and no hit ever lands.
//
// ── ★ THIS IS NOT 4.4, AND THE DIFFERENCE IS THE WHOLE POINT ─────────────────────────────────
//
// 4.4's quiet path was ONE OVERSIZED ROW refused by `planDiagramWrite` against a perfectly
// HEALTHY store: the store opened, the transaction would have committed, and the cache made a
// SIZE decision about a single diagram. Nothing here is about a row's size. There is no oversized
// fixture in this block and there must not be one — the failures below are the STORE itself:
// `indexedDB.open` refusing the database, and a `put` rejecting inside an open one. Different
// layer, different failure, and the diagrams under test are ordinary small flowcharts.
//
// ── §4's TWO STORAGE CLAUSES: ONE IS SURFACED, THE OTHER IS SWALLOWED ────────────────────────
//
// §6.2 exists because §4 says two different things about storage and the distinction is the task:
//
//   • *If the cache cannot be read or written* → render normally without caching, and do not
//     present it as a blocking error. QUIET. (`arm 3` below.)
//   • *If the storage schema cannot be opened or upgraded* → keep rendering, and SAY caching is
//     unavailable rather than failing silently. SURFACED. (`arm 1` and `arm 2`.)
//
// So the shape of the proof is a pair that must DISAGREE: same product, same fixture, and the
// panel says caching is unavailable in one and stays silent in the other. A test that only proved
// "nothing bad happened" would pass identically on both, and on a harness where storage was never
// touched at all.
//
// ── THE LOAD-BEARING CLAIM: RENDERING SURVIVES STORAGE BEING GONE ────────────────────────────
//
// 4.3 wired `readDiagram`/`storeDiagram` INTO the render path, and `storeDiagram`'s call site sits
// inside the try whose catch returns `SANITIZE_REJECTED` (`diagramEnhancer.ts`). So a storage
// throw that escapes does not merely lose a cache entry — it reports a diagram that DREW
// CORRECTLY as a §3.8 failure: the figure is removed, the source fence comes back, and an error
// marker appears under a diagram that mermaid rendered perfectly. Storage is a nice-to-have;
// rendering is the product. That is the revert this block reds on.
//
// ── NON-VACUITY ──────────────────────────────────────────────────────────────────────────────
//
// "Storage failed and nothing bad happened" passes trivially on a harness that never touched
// storage, so every arm asserts PRESENCE and ABSENCE together — the figure is really on screen
// AND the engine was really invoked AND the row is really not persisted AND nothing was said —
// and `arm 4` runs the SAME harness against a WORKING store, where a hit really lands and a row
// really writes. Without arm 4, every zero below could be a fact about a dead spy.

/** A single ordinary flowchart. Small on purpose: nothing here is about a diagram's SIZE. */
const STORAGE_FENCE = 'graph TD; S1[Storage one] --> S2[Storage two]';
const STORAGE_DOC = [
  '# A document rendered while storage is gone',
  '',
  OPENING,
  '',
  '```mermaid',
  STORAGE_FENCE,
  '```',
  '',
  CLOSING,
  '',
].join('\n');

/** The words §6.2 requires — asserted as a SUBSTRING of a rendered panel line, so this is a claim
 *  about text the user can read, not about a class, an attribute or a colour. */
const CACHING_OFF_WORDS = 'Diagram caching is unavailable';

// ── THE TWO INJECTIONS. BOTH PATCH A BROWSER GLOBAL; NEITHER TOUCHES PRODUCTION ──────────────
//
// `diagramCache.ts` reaches storage through `store.ts`'s memoized `connection()` and `idbCore`'s
// raw IndexedDB calls, and NEITHER may grow a seam for this (`idbCore.ts:5-9` is a standing
// STOP signal, and a production hook whose only caller is a test is the test dictating the shape
// of the thing it measures). So the failures are injected where a real browser produces them:
// at `indexedDB.open`, which is what fails on a corrupt profile, a denied quota or a version the
// stored database is already past; and at a `put`, which is what fails when a transaction cannot
// proceed. Both are restored in `afterEach`, and both are scoped so no OTHER database and no
// OTHER store is affected.

type OpenFn = typeof indexedDB.open;
let realOpen: OpenFn | null = null;

/** ★ THE SCHEMA CANNOT BE OPENED — §4's second clause, at the only place it can happen. Scoped to
 *  the `peekover` database by name, so a sibling suite's throwaway DB is untouched. */
function failDatabaseOpen(): void {
  if (realOpen) return;
  const passthrough = indexedDB.open.bind(indexedDB) as OpenFn;
  realOpen = passthrough;
  (indexedDB as unknown as { open: OpenFn }).open = ((name: string, version?: number) => {
    if (name !== DB_NAME) return passthrough(name, version);
    const req: Record<string, unknown> = {
      result: undefined,
      error: new DOMException(`${DB_NAME} could not be opened (test-only)`, 'VersionError'),
      onsuccess: null,
      onerror: null,
      onupgradeneeded: null,
      onblocked: null,
    };
    // `openDb` assigns its handlers synchronously on the returned request, so the rejection is
    // deferred by a turn — exactly the order a real failing open produces.
    setTimeout(() => (req.onerror as ((e: Event) => void) | null)?.(new Event('error')), 0);
    return req as unknown as IDBOpenDBRequest;
  }) as OpenFn;
  // Drop the HEALTHY memo, or `connection()` keeps handing back the connection it already has and
  // the injection reaches nothing at all.
  __resetConnectionForTest();
}

function restoreDatabaseOpen(): void {
  if (!realOpen) return;
  (indexedDB as unknown as { open: OpenFn }).open = realOpen;
  realOpen = null;
  // ...and drop the memoized REJECTION, which `store.ts` never clears on its own.
  __resetConnectionForTest();
}

type PutFn = typeof IDBObjectStore.prototype.put;
let realPut: PutFn | null = null;

/** ★ A WRITE REJECTS INSIDE AN OPEN STORE — §4's first clause. Scoped to the two diagram stores,
 *  so settings, folders, recents, pins and snapshots still write normally: this is the cache
 *  failing, not the database. `idbCore.write` issues the put inside its Promise executor, so a
 *  synchronous throw here is a rejected write, which is what `storeDiagram` has to survive. */
function failDiagramWrites(): void {
  if (realPut) return;
  const passthrough = IDBObjectStore.prototype.put;
  realPut = passthrough;
  const diagramStores = new Set<string>([STORES.diagramMeta, STORES.diagrams]);
  IDBObjectStore.prototype.put = function (this: IDBObjectStore, ...args: unknown[]) {
    if (diagramStores.has(this.name)) {
      throw new DOMException(`write to ${this.name} rejected (test-only)`, 'InvalidStateError');
    }
    return (passthrough as (...a: unknown[]) => IDBRequest<IDBValidKey>).apply(this, args);
  } as PutFn;
}

function restoreDiagramWrites(): void {
  if (!realPut) return;
  IDBObjectStore.prototype.put = realPut;
  realPut = null;
}

/** The real engine, wrapped to COUNT invocations — `diagramCache.browser.test.ts`'s `counting()`.
 *  Wrapping rather than patching the singleton: sibling suites import the same mermaid instance. */
function countingLoader(): { loader: EngineLoader; render: Mock<() => void> } {
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

/** A one-file in-memory folder. `persistable: false` on purpose — this block is about storage
 *  being gone, and a watchable folder would start a real 1 s poll that has nothing to prove here. */
function docSource(markdown: string): FolderSource {
  return {
    name: 'docs',
    truncated: false,
    persistable: false,
    files: [{ path: 'stored.md', name: 'stored.md', read: async () => markdown }],
  };
}

/** Writes nothing — used where the arm needs `describeStored` to SUCCEED while the diagram cache's
 *  own connection is dead, which is the case the availability bit exists for. */
function healthyFakeStore(): AppStore {
  return {
    putFolder: async () => undefined,
    deleteFolder: async () => undefined,
    putRecent: async () => undefined,
    describeStored: async () => ({
      folders: [],
      recents: [],
      pins: [],
      settings: null,
      snapshots: { count: 0, docs: 0, bytes: 0 },
      captureFlag: null,
      diagrams: { count: 0, bytes: 0 },
      total: 0,
      lines: ['Nothing stored — Peekover is holding no folders, recents, or pins on this device.'],
    }),
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

/** Mount the shell, grant the in-memory folder and click the file — the shipped gesture, which is
 *  the only path that provisions `renderWithDiagrams` onto the pane. Returns the reader's shadow
 *  root and the container, so the storage panel can be opened on the SAME shell that rendered. */
async function appShellReading(
  markdown: string,
  store?: AppStore,
): Promise<{ container: HTMLElement; shadow: ShadowRoot }> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  cleanup.push(container);

  const app = mountAppShell(container, {
    openFolder: async () => ({ ok: true, source: docSource(markdown) }),
    ...(store ? { store } : {}),
  });
  await app.openFolder();
  (await until(() =>
    container.querySelector<HTMLButtonElement>('[role="treeitem"][data-kind="file"]'),
  )).click();

  const host = await until(() =>
    container.querySelector<HTMLElement>('.peekover-app__reader__host'),
  );
  return { container, shadow: await until(() => host.shadowRoot) };
}

/** Open the "Stored data" panel and return its rendered plain-language lines, as text. §3.9 made
 *  this panel the diagram cache's disclosure surface, so it is where §4's "say so" is said. */
async function panelLines(container: HTMLElement): Promise<string[]> {
  container.querySelector<HTMLButtonElement>('.peekover-app__storage-toggle')!.click();
  const panel = await until(() => container.querySelector<HTMLElement>('.peekover-storage'));
  const lines = [...panel.querySelectorAll<HTMLElement>('.peekover-storage__line')].map(
    (li) => li.textContent ?? '',
  );
  // NON-VACUITY on the panel itself: an unrendered or empty panel would satisfy every "does not
  // contain" assertion below for free.
  expect(lines.length, 'the storage panel rendered no plain-language lines at all').toBeGreaterThan(
    0,
  );
  return lines;
}

/** The one figure this block's fixture produces, once the pass has settled. */
function soleFigure(shadow: ShadowRoot): HTMLElement {
  const figures = [...shadow.querySelectorAll<HTMLElement>(FIGURE_SELECTOR)];
  expect(figures, 'the fixture has exactly one diagram').toHaveLength(1);
  return figures[0];
}

/**
 * ★ THE RENDER SURVIVED, IN FULL — the conjunction that "no error appeared" alone cannot make.
 *
 * A page where enhancement DIED produces no marker either. So this asserts the figure is present
 * and `rendered`, that a real `<svg>` is inside it, that the source fence went to `rendered` (and
 * is therefore hidden by the reader stylesheet, which is what success LOOKS like under D-15),
 * that no §3.8 marker appeared, and that no placeholder was left stranded.
 */
function expectDiagramSurvived(shadow: ShadowRoot, label: string): void {
  const pres = fences(shadow);
  const markers = [...shadow.querySelectorAll(`.${DIAGRAM_ERROR_CLASS}`)];

  // ★ THIS IS THE REVERT-AND-FAIL MESSAGE, IN THE DEFECT'S OWN UNITS. Take `storeDiagram`'s catch
  // away and the storage rejection escapes into `drawDiagram`'s sanitize try, so the diagram that
  // mermaid DREW is reported as a §3.8 failure: the fence goes back to `failed`, the figure is
  // removed, and a marker blaming the SANITIZER appears under a rendering the sanitizer accepted.
  // The counts and the marker text below are what say that, rather than "expected 1, got 0".
  expect(
    pres.map((p) => p.getAttribute(DIAGRAM_STATE_ATTR)),
    `${label}: a diagram that RENDERED was lost to a storage failure — ` +
      `${shadow.querySelectorAll(FIGURE_SELECTOR).length} figure(s) survive of 1, and the ` +
      `marker(s) under the fence read ${JSON.stringify(markers.map((m) => m.textContent))}. ` +
      `Storage is a nice-to-have; the render is the product`,
  ).toEqual(['rendered']);
  expect(getComputedStyle(pres[0]).display, `${label}: the source fence is hidden`).toBe('none');

  const figure = soleFigure(shadow);
  expect(figure.getAttribute(DIAGRAM_STATE_ATTR), `${label}: figure state`).toBe('rendered');
  expect(figure.querySelector('svg'), `${label}: the adopted SVG`).not.toBeNull();

  expect(
    markers.map((m) => m.textContent),
    `${label}: a §3.8 failure marker appeared over a diagram that rendered correctly`,
  ).toEqual([]);
  expect(placeholders(shadow), `${label}: placeholders left stranded`).toHaveLength(0);

  // Never a blank page (AGENTS.md #5) — the prose at both ends survived the storage failure.
  expect(shadow.textContent, `${label}: opening prose`).toContain(OPENING);
  expect(shadow.textContent, `${label}: closing prose`).toContain(CLOSING);
}

/**
 * The production cache key for the fence that was actually rendered, at the theme it was rendered
 * at.
 *
 * ★ THE SOURCE IS READ BACK OFF THE DOM, through `diagramSourceOf` — the very function the
 * enhancer keys on — rather than re-spelled from {@link STORAGE_FENCE}. A hand-written copy is one
 * trailing newline away from a key that matches nothing, and a key that matches nothing makes
 * `readDiagram(...)` return `undefined` for the wrong reason, which would turn arm 3's "the row is
 * not persisted" into a claim about a typo. (It did, until arm 4 refused to find the row it had
 * just written — which is what the control is for.)
 */
async function storageDocKey(shadow: ShadowRoot): Promise<string> {
  return diagramCacheKey(diagramSourceOf(fences(shadow)[0]), currentEffectiveTheme(), engineVersion());
}

describe('6.2 — storage is gone: diagrams still render, and the panel says caching is off', () => {
  let alerted: Mock;
  let confirmed: Mock;

  beforeEach(() => {
    resetDiffRegistryForTest();
    resetWatchRegistryForTest();
    resetWatchControlsForTest();
    resetThemeHostsForTest();
    resetThemeControlsForTest();
    // §6.2: "assert the absence of any modal/alert". These are the only blocking surfaces a page
    // has, and a spy is the only way to observe one that would have blocked the run if real.
    alerted = vi.fn();
    confirmed = vi.fn(() => true);
    vi.stubGlobal('alert', alerted);
    vi.stubGlobal('confirm', confirmed);
  });

  afterEach(async () => {
    stopWatch();
    restoreDiagramWrites();
    restoreDatabaseOpen();
    vi.unstubAllGlobals();
    resetDiffRegistryForTest();
    resetWatchRegistryForTest();
    resetWatchControlsForTest();
    resetThemeHostsForTest();
    resetThemeControlsForTest();
    // Clear the availability bit the way production does — by REACHING STORAGE SUCCESSFULLY. The
    // bit has no test seam on purpose (`diagramCache.ts`), and this is both the reset and a live
    // demonstration that it self-clears once the store comes back.
    await readDiagram('peekover-6.2-availability-selfclear');
  });

  /** No blocking surface of any kind appeared — §6.2's "no blocking error surfaces", read four
   *  ways so a modal that is not a native `alert()` cannot slip through. */
  function expectNothingBlocking(container: HTMLElement, label: string): void {
    expect(alerted, `${label}: window.alert`).not.toHaveBeenCalled();
    expect(confirmed, `${label}: window.confirm`).not.toHaveBeenCalled();
    expect(container.querySelectorAll('dialog[open]'), `${label}: an open <dialog>`).toHaveLength(0);
    expect(
      container.querySelectorAll('[role="alertdialog"]'),
      `${label}: an alertdialog`,
    ).toHaveLength(0);
  }

  it('★ arm 1 — the schema will not OPEN: the diagram renders COLD, and the panel SAYS caching is off', async () => {
    const original = mermaid.render.bind(mermaid);
    const engineCalls = vi
      .spyOn(mermaid, 'render')
      .mockImplementation((id, definition, container) => original(id, definition, container));
    try {
      failDatabaseOpen();

      const { container, shadow } = await appShellReading(STORAGE_DOC);
      await settleDiagrams(shadow);

      // RENDER SURVIVED. The whole reason the revert below is load-bearing: a storage throw that
      // escapes `storeDiagram` reports this correctly-drawn diagram as a §3.8 failure.
      expectDiagramSurvived(shadow, 'open-failure');
      expectNothingBlocking(container, 'open-failure');

      // COLD, AND ONLY COLD. Storage is gone, so there is nothing to hit — the engine drew it.
      expect(engineCalls.mock.calls.length, 'engine invocations on a dead store').toBe(1);

      // ★ AND IT IS SAID, IN WORDS, ON THE SURFACE §3.9 MADE THE CACHE'S OWN.
      const lines = await panelLines(container);
      expect(
        lines.some((l) => l.includes(CACHING_OFF_WORDS)),
        `the panel never said caching was unavailable. Its lines were: ${JSON.stringify(lines)}`,
      ).toBe(true);
      // ...and it no longer claims a store it could not open is EMPTY. That sentence was a claim
      // about storage we had just failed to read.
      expect(lines.some((l) => l.startsWith('Nothing stored'))).toBe(false);
    } finally {
      engineCalls.mockRestore();
    }
  }, 60_000);

  it('arm 2 — the panel says it even when its OWN read succeeds: the cache reports its dead connection', async () => {
    // The store port injected here reads fine and returns a perfectly ordinary summary. The only
    // thing that is broken is the REAL database the diagram cache reaches — so if the line still
    // appears, it came from `isDiagramCacheUnavailable()` and from nothing else.
    failDatabaseOpen();

    const { container, shadow } = await appShellReading(STORAGE_DOC, healthyFakeStore());
    await settleDiagrams(shadow);
    expectDiagramSurvived(shadow, 'open-failure (injected reader)');

    const lines = await panelLines(container);
    // The injected reader's own line is still there — the panel was not replaced, only added to.
    expect(lines.some((l) => l.startsWith('Nothing stored'))).toBe(true);
    expect(
      lines.some((l) => l.includes(CACHING_OFF_WORDS)),
      `the cache's dead connection was never surfaced. Panel lines: ${JSON.stringify(lines)}`,
    ).toBe(true);
  }, 60_000);

  it('★ arm 3 — a WRITE rejects in an OPEN store: the diagram renders, the row is not kept, and NOTHING is said', async () => {
    const { loader, render } = countingLoader();
    failDiagramWrites();

    const { shadow } = enhancedReader(STORAGE_DOC, loader);
    expect(placeholders(shadow), 'the synchronous prologue inserted no placeholder').toHaveLength(1);
    await settleDiagrams(shadow);

    // PRESENCE — the diagram is really on screen, in full. Without this, "no error appeared" is a
    // fact about a page that never rendered anything (4.4's presence-AND-absence discipline).
    expectDiagramSurvived(shadow, 'write-failure');
    // ...and the engine really ran, so this was a genuine cold render rather than a served hit.
    expect(render.mock.calls.length, 'engine invocations with the write rejecting').toBe(1);

    restoreDiagramWrites();

    // ABSENCE, PART ONE — the row is NOT persisted. The write really did reject; the cache did not
    // quietly succeed behind our back, which would make every claim above vacuous.
    expect(
      await readDiagram(await storageDocKey(shadow)),
      'the rejected write left a row',
    ).toBeUndefined();
    expect((await describeStored()).diagrams.count, 'cached diagram rows').toBe(0);

    // ABSENCE, PART TWO — §4's FIRST clause: this one stays QUIET. Same panel, same product, and
    // it must NOT say what arm 1 required it to say. This disagreement IS the task: a failed
    // persist is not something the user has an action for, and only an unopenable schema is.
    const { container } = await appShellReading('# Just prose\n\nNo diagrams here.\n');
    expectNothingBlocking(container, 'write-failure');
    const lines = await panelLines(container);
    expect(
      lines.some((l) => l.includes(CACHING_OFF_WORDS)),
      `a rejected WRITE was surfaced as an unavailable SCHEMA. Panel lines: ${JSON.stringify(lines)}`,
    ).toBe(false);
  }, 60_000);

  it('★ arm 4 — NON-VACUOUS CONTROL: the same harness on a WORKING store caches, hits, and says nothing', async () => {
    await clearDiagramCache();
    const first = countingLoader();

    // PASS 1 — cold. THE POSITIVE CONTROL for every zero in this block: if this reads 0, the
    // counter is wired to nothing and "the engine was invoked" means nothing anywhere above.
    const one = enhancedReader(STORAGE_DOC, first.loader);
    await settleDiagrams(one.shadow);
    expectDiagramSurvived(one.shadow, 'working store, pass 1');
    expect(first.render.mock.calls.length, 'pass 1 engine invocations').toBe(1);

    // THE ROW REALLY WROTE — the write path arm 3 proved broken is proved WORKING here, on the
    // same harness, so arm 3's `toBeUndefined()` is a fact about the rejection and not about a
    // cache that never writes at all.
    const key = await storageDocKey(one.shadow);
    expect(await readDiagram(key), 'the cached SVG').toBeTruthy();
    expect((await describeStored()).diagrams.count, 'cached diagram rows').toBe(1);

    // PASS 2 — the HIT. Engine untouched, and the diagram is on screen anyway (a cache that
    // served nothing would also leave the engine at zero, and would leave an empty box).
    const second = countingLoader();
    const two = enhancedReader(STORAGE_DOC, second.loader);
    await settleDiagrams(two.shadow);
    expectDiagramSurvived(two.shadow, 'working store, pass 2');
    expect(second.render.mock.calls.length, 'pass 2 engine invocations — a HIT is zero').toBe(0);

    // ...and a healthy store says nothing about being unavailable, which is what makes arm 1's
    // sentence a signal rather than the panel's permanent furniture.
    const { container } = await appShellReading('# Just prose\n\nNo diagrams here.\n');
    const lines = await panelLines(container);
    expect(
      lines.some((l) => l.includes(CACHING_OFF_WORDS)),
      `a HEALTHY store reported caching unavailable. Panel lines: ${JSON.stringify(lines)}`,
    ).toBe(false);
  }, 90_000);
});

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

import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { createReaderPane } from '../../src/app/readerPane';
import { mount } from '../../src/render/mount';
import { DIAGRAM_MEASURE_CLASS, enhanceDiagrams } from '../../src/render/diagramEnhancer';
import type { EngineLoader } from '../../src/render/diagramEngine';
import {
  DIAGRAM_ERROR_CLASS,
  DIAGRAM_FIGURE_CLASS,
  DIAGRAM_STATE_ATTR,
} from '../../src/render/diagramView';
import { clearDiagramCache } from '../../src/app/store';

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

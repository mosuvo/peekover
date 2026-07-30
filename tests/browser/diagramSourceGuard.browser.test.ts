// ★ §4's SOURCE GUARD, PROVEN ON THE WIRE (decisions.md 2026-07-30, spec §4 `spec.md:197`).
//
// §4: *"render no diagram content that references a remote resource, whether the reference
// originates in the diagram source or in the engine's output"*. The OUTPUT half is the SVG
// profile's, and it held all along. The SOURCE half did not: two author-reachable routes put
// `http(s)` on the wire from inside `mermaid.render()`, on both engines.
//
// ── WHY THIS FILE IS REQUEST-LEVEL AND NOT DOM-LEVEL ──────────────────────────────────────
//
// A string-level assertion — "the URL is not in what we hand the engine" — would test the wrong
// layer, and a DOM-shape assertion over the adopted tree reads GREEN BY CONSTRUCTION whether or
// not the fetch fired, because the profile denies `image` and the artifact is clean either way.
// That is exactly how this defect stayed symptomless. The only observation that distinguishes a
// closed route from an open one is a REQUEST-level reading on a REAL engine, so that is what this
// file takes, in D-6's live measurement window, in Chromium and in Firefox.
//
// ── THE MEASURED RED THIS FILE TURNS GREEN ────────────────────────────────────────────────
//
// Against the code immediately before the guard commit, both routes fired in the window, both
// engines, identically:
//
//   ROUTE 1 — flowchart `A@{ img: "URL" }` -> `imageSquare` (a bare `new Image()` AND a live
//     `append("image")`). Observed on the wire; the fence then DEGRADED anyway, because
//     `decode()` rejects on a dead URL. A weak guard could "pass" this route by accident.
//   ROUTE 2 — sequenceDiagram `properties A: {"icon": "URL"}` -> `drawImage`'s live
//     `<image xlink:href>`. Observed on the wire AND the diagram RENDERED — one adopted `<svg>`,
//     state `rendered`, a normal-looking diagram painted with the request already gone out.
//     ★ ROUTE 2 is the load-bearing arm: it is the only one where the guard has to PREVENT a
//     silent success rather than merely tidy up a failure that was going to happen regardless.
//
// ── THE CONTROL THAT FIRES ────────────────────────────────────────────────────────────────
//
// Every zero below is worthless without an instrument proven able to see a non-zero (retro
// 2026-07-19, finding 1) — and the guard has, by design, closed both SOURCE-side controls. So the
// control here is the one that does not travel through the source at all: an SVG `<image href>`
// built with `createElementNS` + `setAttribute` and appended INTO the live measuring container
// while the window is open. No string is parsed anywhere, so the Firefox inert-parse gotcha
// (`367d051`) cannot silently swallow it, and no engine feature can be removed to disarm it.
//
// ── ZERO-NETWORK DISCIPLINE OF THE TEST ITSELF (AGENTS.md #1) ─────────────────────────────
//
// Every probe URL is SAME-ORIGIN, built off `location.origin` — the Vitest dev server IS the
// loopback. Nothing leaves the machine even when the control succeeds; the request 404s locally.
// The `http(s)` scheme is what makes it a genuine remote reference, which is the property tested.
//
// ── ON THE SHARED HARNESS (folded in with 3.3, as this comment said it would be) ──────────
//
// The loopback probe, the window bracket and `awaitFetch` were restated in this file when it landed,
// because task 3.3's `diagramNetwork.browser.test.ts` was still a commit away and this measurement
// had to be provable on its own: *"folding the two onto a shared helper belongs with 3.3, which is
// also when the second copy first exists."* 3.3 has landed, so they now live in
// `helpers/diagramWindow.ts`. What moved is PLUMBING ONLY — the wire predicate, the window bracket,
// the production driver. Every control and every assertion in this file is unchanged, including the
// `createElementNS` construction of the injected control, which the helper's doc comment now guards
// explicitly (route it through a string and BOTH files' floors disarm at once).

import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import {
  DIAGRAM_ERROR_CLASS,
  DIAGRAM_FIGURE_CLASS,
  DIAGRAM_STATE_ATTR,
} from '../../src/render/diagramView';
import {
  BENIGN_DOC,
  awaitFetch,
  drainMeasureContainers,
  injectLiveImageHref,
  networkedInWindow,
  networkedUrls,
  probeUrls,
  releaseHosts,
  renderAndBracket,
  warmEngine,
} from './helpers/diagramWindow';

// ── The loopback probe ────────────────────────────────────────────────────────────────────

/** A unique path token per case, so one case's timing entries can never be read as another's. */
const probeUrl = probeUrls('sg');

// ── Fixtures ──────────────────────────────────────────────────────────────────────────────
//
// `BENIGN_DOC` — nothing remote anywhere; the guard must leave it entirely alone — is the shared
// helper's, because both files need exactly the same clean subject.

/** ROUTE 1 — `getTypeFromVertex`: `if (vertex.img) return "imageSquare"`, whose first three
 *  statements construct an `Image`, assign `src` and await `decode()`. */
function imgRouteDoc(url: string): string {
  return (
    '# img route\n\n```mermaid\nflowchart TD\n' +
    `  A@{ img: "${url}", label: "probe", w: 40, h: 40 }\n` +
    '  A --> B[Beta]\n```\n'
  );
}

/** ROUTE 2 — a sequence actor's `properties.icon`, which `drawImage` hangs on a live
 *  `<image xlink:href>` (`sequenceDiagram-DBY2YBRQ.mjs:2192`) mid-render. */
function iconRouteDoc(url: string): string {
  return (
    '# icon route\n\n```mermaid\nsequenceDiagram\n' +
    '  participant Alice\n  participant Bob\n' +
    `  properties Alice: {"icon": "${url}"}\n` +
    '  Alice->>Bob: hello\n```\n'
  );
}

// ── Driving the PRODUCTION path ───────────────────────────────────────────────────────────
//
// `renderAndBracket` drives the app-page surface through the production pane — `createReaderPane`
// -> `select()` -> `mount()` -> D-12's first call site -> `enhanceDiagrams` -> the real
// `import('mermaid')`, nothing injected — and brackets the window around it. `warmEngine` drives one
// complete render before any test clears the buffer, so a later `import('mermaid')` is a module-cache
// hit rather than ~100 dev-server module URLs. Both are the shared helper's.

beforeAll(async () => {
  await warmEngine();
}, 60_000);

beforeEach(() => {
  performance.clearResourceTimings();
});

afterEach(async () => {
  releaseHosts();
  // DRAIN (3.2's harness lesson) — the shared helper's, for the same reason it always was: the
  // measuring container lives in `document.body` by necessity (D-6 step 1, light DOM), so a stray
  // in-flight render's container reads as the NEXT test's window, and removing the host does not
  // cancel the render.
  await drainMeasureContainers();
});

describe("§4's source guard: a carrying fence puts ZERO on the wire", () => {
  it('★ CONTROL — the instrument CAN see a fetch inside the measurement window', async () => {
    // The guard closed both source-side controls by design, so the control has to come from
    // somewhere the source does not reach: an <image href> built node by node and appended into
    // the LIVE container mid-render. If this ever stops firing, every zero below means nothing.
    const url = probeUrl('live-container');
    const injected: HTMLElement[] = [];
    const { shadow, window: w } = await renderAndBracket(BENIGN_DOC, (container) => {
      if (injected.length > 0) return;
      injectLiveImageHref(container, url);
      injected.push(container);
    });

    expect(injected.length, 'the injection never ran — no container was observed').toBe(1);
    expect(
      await awaitFetch(url),
      'THE CONTROL DID NOT FIRE: a remote reference placed in the LIVE measuring container put ' +
        'nothing on the wire, so this instrument cannot detect a window-phase fetch at all and ' +
        'every zero in this file is worthless (retro 2026-07-19 finding 1)',
    ).toContain(url);
    expect(networkedInWindow(w), 'the control fired outside the bracket').toContain(url);

    // And the benign fence still RENDERED through all of that: the guard does not over-degrade.
    expect(
      shadow.querySelector(`figure.${DIAGRAM_FIGURE_CLASS} svg`),
      'the benign diagram did not render — the guard is refusing fences it must not refuse',
    ).not.toBeNull();
  }, 60_000);

  it('ROUTE 1 — flowchart `img:` fires NOTHING, and degrades naming the cause', async () => {
    // Pre-guard this URL was observed on the wire in the window, both engines. It degraded then
    // too (`decode()` rejects), which is exactly why the DOM here proves nothing on its own — the
    // reading that changed is the wire one below.
    const url = probeUrl('img-route');
    const { shadow, window: w } = await renderAndBracket(imgRouteDoc(url));

    expect(
      w.containers.length,
      'no measuring container was appended — there was no window to read',
    ).toBeGreaterThan(0);
    expect(
      networkedInWindow(w),
      'the flowchart `img:` route put http(s) on the wire inside D-6’s measurement window',
    ).toEqual([]);
    expect(networkedUrls(), 'the probe URL reached the wire somewhere in the run').not.toContain(
      url,
    );

    // The fence took §3.8's path, with a marker naming THIS cause rather than a render failure.
    const pre = shadow.querySelector(`pre[${DIAGRAM_STATE_ATTR}]`);
    expect(pre?.getAttribute(DIAGRAM_STATE_ATTR)).toBe('failed');
    expect(shadow.querySelector(`.${DIAGRAM_ERROR_CLASS}`)?.textContent).toContain(
      'references a remote resource',
    );
    expect(shadow.querySelectorAll(`figure.${DIAGRAM_FIGURE_CLASS}`)).toHaveLength(0);
    expect(pre?.textContent, 'never a blank page — the source is still readable').toContain(
      'flowchart TD',
    );
  }, 60_000);

  it('★ ROUTE 2 — sequence `properties.icon`: the silent success is PREVENTED', async () => {
    // THE TEETH. Pre-guard this arm rendered one adopted <svg>, state `rendered`, WHILE the probe
    // was already on the wire — a normal-looking diagram over an open route. Route 1 degrades with
    // or without a guard, so only this arm distinguishes a guard that works from one that does not.
    const url = probeUrl('icon-route');
    const { shadow, window: w } = await renderAndBracket(iconRouteDoc(url));

    expect(w.containers.length, 'no window was observed').toBeGreaterThan(0);
    expect(
      networkedInWindow(w),
      'the sequence `properties.icon` route put http(s) on the wire inside the window',
    ).toEqual([]);
    expect(networkedUrls()).not.toContain(url);

    // It no longer renders — which is the point: previously it DID, and that was the leak's cover.
    expect(
      shadow.querySelectorAll(`figure.${DIAGRAM_FIGURE_CLASS} svg`).length,
      'the carrying sequence diagram still rendered — the guard did not refuse it',
    ).toBe(0);
    expect(shadow.querySelector(`pre[${DIAGRAM_STATE_ATTR}]`)?.getAttribute(DIAGRAM_STATE_ATTR)).toBe(
      'failed',
    );
    expect(shadow.querySelector(`.${DIAGRAM_ERROR_CLASS}`)?.textContent).toContain(
      'references a remote resource',
    );
  }, 60_000);

  it('PER-FENCE — the carrying fence degrades, the clean one beside it renders (§4)', async () => {
    // §4's isolation clause on a REAL engine: the guard is per fence, not a document-wide refusal.
    const url = probeUrl('mixed-doc');
    const doc =
      '# Mixed\n\n' +
      iconRouteDoc(url).split('\n').slice(2).join('\n') +
      '\n```mermaid\ngraph TD\n  X[Ex] --> Y[Why]\n```\n';
    const { shadow, window: w } = await renderAndBracket(doc);

    expect(networkedInWindow(w)).toEqual([]);
    expect(networkedUrls()).not.toContain(url);

    const [carrying, clean] = [...shadow.querySelectorAll(`pre[${DIAGRAM_STATE_ATTR}]`)];
    expect(carrying?.getAttribute(DIAGRAM_STATE_ATTR)).toBe('failed');
    expect(clean?.getAttribute(DIAGRAM_STATE_ATTR)).toBe('rendered');
    expect(shadow.querySelectorAll(`figure.${DIAGRAM_FIGURE_CLASS} svg`)).toHaveLength(1);
  }, 60_000);
});

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
// ── ON THE DUPLICATED HARNESS ─────────────────────────────────────────────────────────────
//
// The loopback probe, the window bracket and `awaitFetch` below are the shape task 3.3's
// `diagramNetwork.browser.test.ts` uses. They are restated here rather than imported because that
// file lands in the NEXT commit and this one has to be provable on its own; folding the two onto a
// shared helper belongs with 3.3, which is also when the second copy first exists.

import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import { createReaderPane } from '../../src/app/readerPane';
import { DIAGRAM_MEASURE_CLASS } from '../../src/render/diagramEnhancer';
import {
  DIAGRAM_ERROR_CLASS,
  DIAGRAM_FIGURE_CLASS,
  DIAGRAM_STATE_ATTR,
} from '../../src/render/diagramView';

// ── The loopback probe ────────────────────────────────────────────────────────────────────

let seq = 0;
/** A unique path token per case, so one case's timing entries can never be read as another's. */
function freshToken(): string {
  seq += 1;
  return `sg-${seq}`;
}

function probeUrl(token: string, name: string): string {
  return new URL(`/__peekover_probe__/${token}/${name}.png`, location.origin).href;
}

/** The http(s) resource-timing entry names in the buffer. `/^https?:/i` is the predicate every
 *  other guard file in this suite uses, verbatim — same buffer, same meaning of "on the wire". */
function networkedUrls(): string[] {
  return performance
    .getEntriesByType('resource')
    .map((e) => e.name)
    .filter((name) => /^https?:/i.test(name));
}

/** A macrotask + rAF + settle — the same window every other guard file uses. Sound for a ZERO
 *  assertion in the way a wait never can be: if no request fired, no wait length changes that. */
function flush(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => requestAnimationFrame(() => setTimeout(resolve, 60)), 120);
  });
}

// ── The WINDOW bracket ────────────────────────────────────────────────────────────────────

interface MeasureWindow {
  open: number | null;
  close: number | null;
  containers: HTMLElement[];
}

/**
 * Bracket D-6's measurement window by watching `document.body` for the measuring container —
 * `DIAGRAM_MEASURE_CLASS` appended (D-6 step 1) to `container.remove()` in the enhancer's
 * `finally`. A `MutationObserver` callback is a microtask, so both marks land at or AFTER the
 * mutation they describe: the bracket is a SUPERSET of the true window, which is the safe
 * direction for a zero claim and is not a direction that can manufacture the control's hit.
 */
function watchMeasureWindow(onOpen?: (container: HTMLElement) => void): {
  window: MeasureWindow;
  stop: () => void;
} {
  const w: MeasureWindow = { open: null, close: null, containers: [] };
  const isContainer = (n: Node): n is HTMLElement =>
    n instanceof HTMLElement && n.classList.contains(DIAGRAM_MEASURE_CLASS);
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (!isContainer(node)) continue;
        w.open ??= performance.now();
        w.containers.push(node);
        onOpen?.(node);
      }
      for (const node of record.removedNodes) {
        if (isContainer(node)) w.close = performance.now();
      }
    }
  });
  observer.observe(document.body, { childList: true });
  return { window: w, stop: () => observer.disconnect() };
}

/** The http(s) entries whose `startTime` falls inside the window. Throws if no window was ever
 *  observed, because "no requests in a window that never opened" is the vacuous green this whole
 *  measurement exists to avoid — and note the guard does NOT suppress the window: the container
 *  is created before the per-fence loop, so a document whose every fence degrades still opens one. */
function networkedInWindow(w: MeasureWindow): string[] {
  if (w.open === null) {
    throw new Error(
      'the measuring container never appeared — no measurement window was observed, so a ' +
        'zero-request reading here would be vacuous',
    );
  }
  const end = w.close ?? performance.now();
  return performance
    .getEntriesByType('resource')
    .filter((entry) => entry.startTime >= w.open! && entry.startTime <= end)
    .map((entry) => entry.name)
    .filter((name) => /^https?:/i.test(name));
}

/** AWAIT a request that SHOULD fire, never sample for it (retro 2026-07-19 finding 1). Settles a
 *  FRAME first: Firefox will not run a style-driven load for a poll loop that never touches layout. */
async function awaitFetch(expected: string): Promise<string[]> {
  await flush();
  const deadline = performance.now() + 5000;
  while (!networkedUrls().includes(expected) && performance.now() < deadline) {
    await new Promise<void>((resolve) => setTimeout(resolve, 25));
  }
  return networkedUrls();
}

// ── Fixtures ──────────────────────────────────────────────────────────────────────────────

/** Nothing remote anywhere. The guard must leave this one entirely alone. */
const BENIGN_DOC =
  '# Diagram document\n\n' +
  'A paragraph of ordinary reading-column text before the diagram.\n\n' +
  '```mermaid\ngraph TD\n  A[Alpha] --> B[Beta]\n  B --> C{Gamma}\n```\n\n' +
  'A paragraph after it.\n';

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

const cleanup: HTMLElement[] = [];

/** The app-page surface, through the production pane: `createReaderPane` -> `select()` ->
 *  `mount()` -> D-12's first call site -> `enhanceDiagrams` -> the real `import('mermaid')`.
 *  Nothing is injected: no loader, no config, no engine seam. */
async function appPageReader(markdown: string): Promise<ShadowRoot> {
  const pane = createReaderPane(document);
  document.body.appendChild(pane.element);
  cleanup.push(pane.element);
  await pane.select({ name: 'doc.md', read: async () => markdown });
  const host = pane.element.querySelector<HTMLElement>('.peekover-app__reader__host');
  if (!host?.shadowRoot) throw new Error('reader pane produced no mounted host');
  return host.shadowRoot;
}

/** Wait until no fence is `pending` — `rendered` AND `failed` both leave that state, so a document
 *  that never settles is one whose enhancement DIED rather than degraded. */
async function settleDiagrams(shadow: ShadowRoot, tries = 600): Promise<void> {
  for (let i = 0; i < tries; i += 1) {
    if (shadow.querySelectorAll(`[${DIAGRAM_STATE_ATTR}="pending"]`).length === 0) return;
    await new Promise<void>((r) => setTimeout(r, 25));
  }
  throw new Error('enhancement never completed: node(s) left pending');
}

async function renderAndBracket(
  markdown: string,
  onOpen?: (container: HTMLElement) => void,
): Promise<{ shadow: ShadowRoot; window: MeasureWindow }> {
  const watch = watchMeasureWindow(onOpen);
  try {
    const shadow = await appPageReader(markdown);
    await settleDiagrams(shadow);
    await flush();
    return { shadow, window: watch.window };
  } finally {
    watch.stop();
  }
}

/**
 * Drive one complete production render BEFORE any test clears the buffer.
 *
 * In the PRODUCT the engine import is a fetch of our own lazy chunk at an extension-scheme URL,
 * which `/^https?:/i` excludes by scheme. In THIS harness the dev server serves it over
 * `http://localhost`, so a cold `import('mermaid')` would fill the buffer with ~100 module URLs of
 * our own bundle. Warming first makes every later import a module-cache hit, so the raw predicate
 * means what it says.
 */
async function warmEngine(): Promise<void> {
  performance.clearResourceTimings();
  const { shadow } = await renderAndBracket(BENIGN_DOC);
  expect(
    shadow.querySelector(`figure.${DIAGRAM_FIGURE_CLASS} svg`),
    'the warm-up render produced no adopted <svg> — the production path is broken, and every ' +
      'zero-request reading below would be vacuous',
  ).not.toBeNull();
  for (const el of cleanup.splice(0)) el.remove();
}

beforeAll(async () => {
  await warmEngine();
}, 60_000);

beforeEach(() => {
  performance.clearResourceTimings();
});

afterEach(async () => {
  for (const el of cleanup.splice(0)) el.remove();
  // DRAIN (3.2's harness lesson). The measuring container lives in `document.body` by necessity
  // (D-6 step 1, light DOM), so a stray in-flight render's container reads as the NEXT test's
  // window. Removing the host does not cancel the render; waiting for it does.
  for (let i = 0; i < 400 && document.querySelector(`.${DIAGRAM_MEASURE_CLASS}`); i += 1) {
    await new Promise<void>((r) => setTimeout(r, 25));
  }
});

describe("§4's source guard: a carrying fence puts ZERO on the wire", () => {
  it('★ CONTROL — the instrument CAN see a fetch inside the measurement window', async () => {
    // The guard closed both source-side controls by design, so the control has to come from
    // somewhere the source does not reach: an <image href> built node by node and appended into
    // the LIVE container mid-render. If this ever stops firing, every zero below means nothing.
    const url = probeUrl(freshToken(), 'live-container');
    const injected: HTMLElement[] = [];
    const { shadow, window: w } = await renderAndBracket(BENIGN_DOC, (container) => {
      if (injected.length > 0) return;
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', '32');
      svg.setAttribute('height', '32');
      const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
      image.setAttribute('href', url);
      image.setAttribute('width', '32');
      image.setAttribute('height', '32');
      svg.appendChild(image);
      container.appendChild(svg);
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
    const url = probeUrl(freshToken(), 'img-route');
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
    const url = probeUrl(freshToken(), 'icon-route');
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
    const url = probeUrl(freshToken(), 'mixed-doc');
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

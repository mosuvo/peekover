// ★ THE SHARED HARNESS FOR D-6's MEASUREMENT WINDOW — used by the two request-level guards that
// read it: `diagramSourceGuard.browser.test.ts` (§4's source pre-scan, `eae7b08`) and
// `diagramNetwork.browser.test.ts` (task 3.3's window claim).
//
// Not a test file: the `browser` project's include is `tests/browser/**/*.test.ts`, so nothing here
// is collected as a suite. It is plumbing ONLY — every control, every claim and every assertion
// lives in the two test files, so folding this out cannot weaken either instrument. What is shared
// is the observation apparatus (the wire predicate, the window bracket, the production driver); what
// is NOT shared is what each file chooses to assert about them.
//
// `diagramSourceGuard` stated the fold's own precondition when it duplicated this shape: *"folding
// the two onto a shared helper belongs with 3.3, which is also when the second copy first exists."*
// This is that fold.
//
// ── ZERO-NETWORK DISCIPLINE OF THE HARNESS ITSELF (AGENTS.md #1) ──────────────────────────
//
// Every probe URL this module builds is on the LOOPBACK. Two flavours, and the difference is
// load-bearing for 3.3's instrument floor:
//
//   • {@link probeUrls} — SAME-ORIGIN, off `location.origin`, exactly as `remoteMedia`,
//     `diagramSecure` and `diagramStyleCss` build theirs. The Vitest dev server IS the loopback.
//   • {@link offOriginProbeUrl} — a genuinely DIFFERENT ORIGIN that is still the same loopback
//     interface: the page is served from `http://localhost:PORT`, so `http://127.0.0.1:PORT` is
//     cross-origin by the same-origin rule (the host strings differ) while being answered by the
//     very same local server. That is what lets 3.3 prove its observer can see an off-origin
//     request WITHOUT contacting a non-loopback host. Nothing here ever names an external host.
//
// The `http(s)` scheme is what makes any of these a genuine remote reference in form, which is the
// property under test; the requests 404 locally and nothing leaves the machine.

import { expect } from 'vitest';
import { createReaderPane } from '../../../src/app/readerPane';
import { DIAGRAM_MEASURE_CLASS } from '../../../src/render/diagramEnhancer';
import { DIAGRAM_FIGURE_CLASS, DIAGRAM_STATE_ATTR } from '../../../src/render/diagramView';

export const SVG_NS = 'http://www.w3.org/2000/svg';

// ── The loopback probe ────────────────────────────────────────────────────────────────────

/**
 * A per-file probe-URL minter. Each call yields a unique path token, so one case's timing entries
 * can never be read as another's, and the `prefix` keeps two files' tokens distinct even though
 * they share this module.
 */
export function probeUrls(prefix: string): (name: string) => string {
  let seq = 0;
  return (name) => {
    seq += 1;
    return new URL(`/__peekover_probe__/${prefix}-${seq}/${name}.png`, location.origin).href;
  };
}

/**
 * An OFF-ORIGIN probe URL that never leaves the loopback — see the module header. The page origin
 * is `http://localhost:PORT`; this is `http://127.0.0.1:PORT`, a different origin served by the
 * same local process. Used only as 3.3's instrument floor, where the property being exercised is
 * *"the observer sees a request it is not meant to permit"* — and the observer's predicate is
 * scheme-and-origin based, so a loopback cross-origin request exercises it exactly.
 */
export function offOriginProbeUrl(path: string): string {
  return `http://127.0.0.1:${location.port}${path}`;
}

/** True when `name` is NOT on this page's own origin. The claim's other half: `/^https?:/i` says
 *  "on the wire", this says "left our origin". */
export function isOffOrigin(name: string): boolean {
  return !name.startsWith(`${location.origin}/`);
}

/**
 * The http(s) resource-timing entry names currently in the buffer. **The predicate is
 * `/^https?:/i`, REUSED VERBATIM** from the existing guard files (tocNetwork, settingsPort, wipe,
 * folderMode.network, firefoxFallback, handlePersist, remoteMedia, watchNetwork) — same buffer,
 * same predicate, same meaning of "on the wire". §3.3 requires the existing one and no new one.
 */
export function networkedUrls(): string[] {
  return performance
    .getEntriesByType('resource')
    .map((e) => e.name)
    .filter((name) => /^https?:/i.test(name) && !isSentinel(name));
}

// ── Reading a ZERO only once the wire has settled (012 task 5.8) ──────────────────────────
//
// ★ Resource Timing records a request when it ENDS, not when it starts. A request still in flight
// is not in the buffer, so a zero read after {@link flush} alone says only that nothing has
// FINISHED. Measured at 012 task 5.7 and again, per file, at 5.8: a deliberately slow off-origin
// request issued inside the measured window left every guard file green.
//
// {@link wireSettled} closes that. It issues one more request — the SENTINEL — to the off-origin
// loopback, and resolves only when that request is itself in the buffer. Anything the window
// issued to that destination BEFORE the sentinel has by then had at least as long to finish, so a
// zero read after it is a reading of what was issued, not of what happened to be done.
//
// What it does NOT prove, stated so it is not over-read: a request to a host slower than the
// sentinel's own failure (a black-holed address that takes a minute to time out) can still
// outlast it. The sentinel is a calibrated wait, not an unbounded one.
//
// The sentinel is itself an http(s) entry, so every whole-buffer reading filters it out with
// {@link isSentinel}. It is on the loopback like every probe here: nothing leaves the machine.

const SENTINEL_SEGMENT = '/__peekover_sentinel__/';
let sentinelSeq = 0;

/** True for a {@link wireSettled} sentinel's own entry — never a request of the code under test. */
export function isSentinel(name: string): boolean {
  return name.includes(SENTINEL_SEGMENT);
}

/**
 * Resolve once a request issued NOW has landed in the Resource Timing buffer. Call it after the
 * measured work and before reading a zero; filter the reading with {@link isSentinel}.
 *
 * Throws if the sentinel never reaches the buffer: the buffer is then full or the observer blind,
 * and a zero read from it would be the vacuous green this exists to prevent.
 */
export async function wireSettled(): Promise<void> {
  await flush();
  sentinelSeq += 1;
  const url = offOriginProbeUrl(
    `${SENTINEL_SEGMENT}${sentinelSeq}-${Math.trunc(performance.now())}.txt`,
  );
  void fetch(url, { mode: 'no-cors' }).catch(() => undefined);
  const landed = (): boolean =>
    performance.getEntriesByType('resource').some((entry) => entry.name === url);
  const deadline = performance.now() + 20_000;
  while (!landed() && performance.now() < deadline) {
    await new Promise<void>((resolve) => setTimeout(resolve, 25));
  }
  if (!landed()) {
    throw new Error(
      'the wire sentinel never reached the Resource Timing buffer — the buffer is full or the ' +
        'observer is blind, so a zero read here would be vacuous',
    );
  }
  // One more flush, and it is load-bearing. Two requests to the same refused destination can fail
  // in the same instant, and the engine may then record the LATER one first: measured on Firefox,
  // a leak issued 200 ms before the sentinel was still missing when the sentinel appeared, about
  // one run in two. The sentinel landing says the earlier request has ended; this lets its entry
  // be written.
  await flush();
}

/**
 * A macrotask + rAF + settle — the same window every other guard file uses. Sound for a ZERO
 * assertion in the way a wait never can be: if no request fired, no wait length changes that.
 */
export function flush(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => requestAnimationFrame(() => setTimeout(resolve, 60)), 120);
  });
}

// ── The WINDOW bracket ────────────────────────────────────────────────────────────────────

export interface MeasureWindow {
  /** `performance.now()` at (or just after) the measuring container's append. */
  open: number | null;
  /** `performance.now()` at (or just after) its removal; `null` while still open. */
  close: number | null;
  /** Every container instance seen, so a test can assert the window genuinely existed. */
  containers: HTMLElement[];
}

/**
 * Bracket D-6's measurement window by watching `document.body` for the measuring container —
 * `DIAGRAM_MEASURE_CLASS` appended (D-6 step 1) to `container.remove()` in the enhancer's
 * `finally`. A `MutationObserver` callback is a microtask, so both marks land at or AFTER the
 * mutation they describe: the bracket is a SUPERSET of the true window, which is the safe
 * direction for a zero claim (it can only over-report) and is not a direction that can manufacture
 * a control's hit.
 *
 * `onOpen` runs inside the observer callback, which is where the injected control goes into the
 * LIVE container — the only moment at which that container is both in the document and mid-render.
 */
export function watchMeasureWindow(onOpen?: (container: HTMLElement) => void): {
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

/**
 * The http(s) entries whose `startTime` falls inside the measurement window — the WINDOW-scoped
 * reading, as distinct from the whole-run reading {@link networkedUrls} gives.
 *
 * Throws if no window was ever observed, because "no requests in a window that never opened" is
 * the vacuous green both of these measurements exist to avoid. Note the source guard does NOT
 * suppress the window: the container is created before the per-fence loop, so a document whose
 * every fence degrades still opens one.
 */
export function networkedInWindow(w: MeasureWindow): string[] {
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
    .filter((name) => /^https?:/i.test(name) && !isSentinel(name));
}

/** The OFF-ORIGIN entries inside the window — 3.3's claim reads exactly this list. */
export function offOriginInWindow(w: MeasureWindow): string[] {
  return networkedInWindow(w).filter(isOffOrigin);
}

/**
 * AWAIT a request that SHOULD fire, never sample for it (retro 2026-07-19 finding 1). A control
 * that reads empty when the request DID fire can read empty when it did not, and the assertion it
 * guards is AGENTS.md #1. Returns the buffer rather than throwing, so a genuine failure reds on the
 * caller's own assertion with the real diff of what was and was not fetched.
 *
 * Settles a FRAME first, not just a macrotask: Firefox will not run a style-driven load for a bare
 * `setTimeout` poll loop that never touches layout (`diagramStyleCss`'s measured finding).
 */
export async function awaitFetch(expected: string): Promise<string[]> {
  await flush();
  const deadline = performance.now() + 5000;
  while (!networkedUrls().includes(expected) && performance.now() < deadline) {
    await new Promise<void>((resolve) => setTimeout(resolve, 25));
  }
  return networkedUrls();
}

// ── The injected control: the ONE seam the source guard does not sit on ───────────────────

/**
 * Append an SVG `<image href>` INTO the live measuring container, built with `createElementNS` +
 * `setAttribute` — **node by node, so no string is parsed anywhere**.
 *
 * ★ That construction is the whole point and must never be "simplified" into an `innerHTML` or a
 * `DOMParser` round-trip. In Firefox, parsing a remote reference into ANY inert document — a bare
 * `parseFromString`, a `<template>.innerHTML`, a `DOMPurify.sanitize` — CONSUMES the load and it is
 * never retried (`367d051`), so a control routed through a parser reads NO-FETCH while the window
 * it is meant to be probing is wide open. Both files' instrument floors are this function; routing
 * it through a string would silently disarm both at once.
 *
 * It is also independent of any engine feature, so the floor survives a mermaid version bump.
 */
export function injectLiveImageHref(container: HTMLElement, url: string): void {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('width', '32');
  svg.setAttribute('height', '32');
  const image = document.createElementNS(SVG_NS, 'image');
  image.setAttribute('href', url);
  image.setAttribute('width', '32');
  image.setAttribute('height', '32');
  svg.appendChild(image);
  container.appendChild(svg);
}

// ── Fixtures ──────────────────────────────────────────────────────────────────────────────

/** A benign diagram: nothing in it references anything remote, and the guard must leave it alone.
 *  A `graph TD` flowchart deliberately — see {@link warmEngine} on the lazily loaded definitions. */
export const BENIGN_DOC =
  '# Diagram document\n\n' +
  'A paragraph of ordinary reading-column text before the diagram.\n\n' +
  '```mermaid\ngraph TD\n  A[Alpha] --> B[Beta]\n  B --> C{Gamma}\n```\n\n' +
  'A paragraph after it.\n';

// ── Driving the PRODUCTION path ───────────────────────────────────────────────────────────

const hosts: HTMLElement[] = [];

/** The app-page surface, through the production pane: `createReaderPane` → `select()` →
 *  `mount()` → D-12's first call site → `enhanceDiagrams` → the real `import('mermaid')`.
 *  Nothing is injected: no loader, no config, no engine seam. */
export async function appPageReader(markdown: string): Promise<ShadowRoot> {
  const pane = createReaderPane(document);
  document.body.appendChild(pane.element);
  hosts.push(pane.element);
  await pane.select({ name: 'doc.md', read: async () => markdown });
  const host = pane.element.querySelector<HTMLElement>('.peekover-app__reader__host');
  if (!host?.shadowRoot) throw new Error('reader pane produced no mounted host');
  return host.shadowRoot;
}

/** Wait until no fence is `pending` — `rendered` AND `failed` both leave that state, so a document
 *  that never settles is one whose enhancement DIED rather than degraded. */
export async function settleDiagrams(shadow: ShadowRoot, tries = 600): Promise<void> {
  for (let i = 0; i < tries; i += 1) {
    if (shadow.querySelectorAll(`[${DIAGRAM_STATE_ATTR}="pending"]`).length === 0) return;
    await new Promise<void>((r) => setTimeout(r, 25));
  }
  throw new Error(
    `enhancement never completed: ${
      shadow.querySelectorAll(`[${DIAGRAM_STATE_ATTR}="pending"]`).length
    } node(s) left pending`,
  );
}

/** One complete production render, with the window bracketed. Returns everything an arm needs. */
export async function renderAndBracket(
  markdown: string,
  onOpen?: (container: HTMLElement) => void,
): Promise<{ shadow: ShadowRoot; window: MeasureWindow }> {
  const watch = watchMeasureWindow(onOpen);
  try {
    const shadow = await appPageReader(markdown);
    await settleDiagrams(shadow);
    // Not a bare flush (5.8): every caller reads a zero off this window, so the wire is settled
    // here, once, and every file that brackets a render inherits it.
    await wireSettled();
    return { shadow, window: watch.window };
  } finally {
    watch.stop();
  }
}

/** Drop every reader host this module mounted. */
export function releaseHosts(): void {
  for (const el of hosts.splice(0)) el.remove();
}

/**
 * DRAIN (3.2's harness lesson). The measuring container lives in `document.body` by necessity
 * (D-6 step 1, light DOM), so a stray in-flight render's container reads as the NEXT reading's
 * window. Removing the host does not cancel the render; waiting for it does.
 */
export async function drainMeasureContainers(): Promise<void> {
  for (let i = 0; i < 400 && document.querySelector(`.${DIAGRAM_MEASURE_CLASS}`); i += 1) {
    await new Promise<void>((r) => setTimeout(r, 25));
  }
}

/** {@link releaseHosts} then {@link drainMeasureContainers} — the between-readings reset. */
export async function resetBetweenReadings(): Promise<void> {
  releaseHosts();
  await drainMeasureContainers();
}

/**
 * Drive one complete production render BEFORE any test clears the buffer, and return the traffic it
 * produced.
 *
 * In the PRODUCT the engine import is a fetch of our own lazy chunk at a `chrome-extension://` /
 * `moz-extension://` URL inside the signed package, which `/^https?:/i` excludes by scheme — the
 * predicate doing its job, not a gap. In THIS harness the dev server serves the same chunk over
 * `http://localhost`, so a cold `import('mermaid')` would fill the buffer with ~100 module URLs of
 * our own bundle. Warming first makes a later `import('mermaid')` a module-cache hit.
 *
 * ★ MEASURED LIMIT, stated because a reader would otherwise over-trust the warm-up: it warms
 * mermaid's CORE and the definition of the diagram type it renders (`graph TD` → flowchart) only.
 * mermaid registers diagram definitions LAZILY, so a later `sequenceDiagram` still pulls
 * `deps/sequenceDiagram-*.js` — SAME-ORIGIN harness module traffic — INSIDE the measurement window.
 * Observed on both engines. That is precisely why 3.3's claim is scoped to OFF-ORIGIN rather than to
 * a bare emptiness: a whole-buffer `toEqual([])` would be measuring which diagram type the warm-up
 * happened to use, not whether anything left our origin.
 *
 * ★ THE WARM-UP RENDERS A SOURCE NO EARLIER RENDER HAS USED (012 task 5.8). The reader keeps an
 * on-device diagram cache keyed by a hash of the diagram source, in IndexedDB — and IndexedDB,
 * unlike the module graph, SURVIVES from one test file to the next in a run. A cache hit skips
 * `engine.render` altogether (`diagramEnhancer.ts`), and with it mermaid's lazy load of the
 * diagram type's definition. So when an earlier file had already rendered {@link BENIGN_DOC}, this
 * warm-up loaded mermaid's core, was served the stored SVG, and warmed NOTHING else: measured in
 * the `diagramNetwork` → `diagramSourceGuard` order, 20 requests and no flowchart definition,
 * against 32 with it when run first. The first uncached `graph TD` in a test then pulled the
 * twelve flowchart chunks inside its own window. A label unique to this call makes the warm-up a
 * cache MISS every time, which is the only way it does what its name says.
 */
export async function warmEngine(): Promise<string[]> {
  performance.clearResourceTimings();
  const uncached = BENIGN_DOC.replace(
    'A[Alpha]',
    `A[Warm ${Date.now().toString(36)}${Math.trunc(performance.now())}]`,
  );
  expect(uncached, 'the warm-up document is BENIGN_DOC unchanged — it may be a cache hit').not.toBe(
    BENIGN_DOC,
  );
  const { shadow } = await renderAndBracket(uncached);
  // The warm-up must itself have SUCCEEDED, or every later arm is measuring a broken path.
  expect(
    shadow.querySelector(`figure.${DIAGRAM_FIGURE_CLASS} svg`),
    'the warm-up render produced no adopted <svg> — the production path is broken, and every ' +
      'zero-request reading below would be vacuous',
  ).not.toBeNull();
  const seen = networkedUrls();
  releaseHosts();
  return seen;
}

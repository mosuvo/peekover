// ★ THE ZERO-NETWORK GUARD FOR BLOCK/FENCE MATH (task 4.3-R, §3.7's named trap, D-13).
//
// §3.7's own text: a naive math integration is known to copy a CDN-style `<link>` tag or a font
// `@import` verbatim from a quick-start guide, introducing a REMOTE FONT FETCH on first math
// render — not a hypothetical risk, the specific one this library class invites. "The zero-network
// proof (§5) must include a positive control that would catch a remote font request specifically,
// not only a remote formula-data request." This file is that proof, over the real production path
// (`enhanceMath` -> `loadMathEngine` -> `import('temml')` -> `renderToString` -> `sanitizeMath` ->
// adopt -> `registerMathFont`), reusing `diagramNetwork.browser.test.ts`'s own mechanism — the
// `/^https?:/i` resource-timing predicate every zero-network guard in this project already shares
// (that file's own header names eight other guard files duplicating it ad hoc; this is the ninth,
// inlined rather than imported from `helpers/diagramWindow.ts`, since that helper's own exported
// production driver is diagram-specific and the shared predicate itself is a two-line convention,
// not a module to couple across features for).
//
// ── WHY THIS CLAIM IS SCOPED TO OFF-ORIGIN, NOT TO ZERO REQUESTS OF ANY KIND ──────────────────
//
// In THIS harness (the vitest browser project's own dev server), `import('temml')` and the
// URL-loaded font asset (`mathFont.ts`'s own `?inline`-less import) are both real, same-origin HTTP
// fetches off `location.origin` — Vite serves them, same as `diagramNetwork.browser.test.ts`'s own
// "COLD LOAD" arm states for `import('mermaid')`. In the SHIPPED PRODUCT both are
// `chrome-extension://`/`moz-extension://`-scheme URLs the `/^https?:/i` predicate excludes by
// scheme entirely — same-origin-by-construction, package-local. So "zero network" for math, exactly
// as for diagrams, is the OFF-ORIGIN claim: nothing here ever contacts a host outside this origin.
//
// ── THE FONT-SPECIFIC FIRING CONTROL — WHY IT IS A RUNTIME INJECTION, NOT A SOURCE REVERT ──────
//
// `diagramNetwork.browser.test.ts`'s own TIER 2 proves its observer is not blind to off-origin
// traffic by injecting a live off-origin request through a seam the guard under test does not sit
// on (a `createElementNS` `<image href>`), never by rebuilding the extension with a broken source.
// The equivalent here — and the one §3.7 specifically asks for — is a live `FontFace` constructed
// with an off-origin `url()` source and added to `document.fonts`: the SAME CSS Font Loading API
// `mathFont.ts`'s own `registerMathFont()` uses, built here with no production code touched, so a
// pass proves the SAME resource-timing predicate that reads "zero off-origin" below would have
// caught `mathFont.ts` shipping a CDN URL by mistake. (A genuine source-level ablation — swapping
// `mathFont.ts`'s bundled asset import for a hardcoded remote URL, rebuilding, and re-running the
// real-path arm — was also run by hand while drafting this file: it turns the real-path arm red,
// with the remote URL appearing in the off-origin list; reverted before commit, and not carried as
// permanent test code because nothing here can rebuild the extension mid-suite. The FontFace
// injection below is what ships, and it exercises the identical predicate that ablation exercised.)

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createReaderPane } from '../../src/app/readerPane';
import { MATH_FIGURE_CLASS, MATH_STATE_ATTR } from '../../src/render/mathView';

const FIGURE_SELECTOR = `figure.${MATH_FIGURE_CLASS}`;

// ── The shared predicate, inlined per the header's own citation ──────────────────────────────

/** Every http(s) resource-timing entry name currently in the buffer — the SAME predicate every
 *  zero-network guard in this project reads (`diagramNetwork.browser.test.ts`'s own header names
 *  eight files sharing it before this one). */
function networkedUrls(): string[] {
  return performance
    .getEntriesByType('resource')
    .map((e) => e.name)
    .filter((name) => /^https?:/i.test(name));
}

/** True when `name` left this page's own origin. */
function isOffOrigin(name: string): boolean {
  return !name.startsWith(`${location.origin}/`);
}

/** A genuinely different origin that never leaves the loopback: the page is served from
 *  `http://localhost:PORT`; `http://127.0.0.1:PORT` is cross-origin by the same-origin rule,
 *  answered by the very same local dev server. AGENTS.md #1 — nothing here ever names a real host. */
function offOriginProbeUrl(path: string): string {
  return `http://127.0.0.1:${location.port}${path}`;
}

/** A macrotask + rAF + settle — the same window every zero-network guard in this project uses. */
function flush(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => requestAnimationFrame(() => setTimeout(resolve, 60)), 120);
  });
}

/** AWAIT a request that should fire, never sample for it (retro 2026-07-19 finding 1, cited
 *  verbatim from `diagramNetwork.browser.test.ts`'s own `awaitFetch`). */
async function awaitUrl(pred: (url: string) => boolean): Promise<string[]> {
  await flush();
  const deadline = performance.now() + 5000;
  while (!networkedUrls().some(pred) && performance.now() < deadline) {
    await new Promise<void>((resolve) => setTimeout(resolve, 25));
  }
  return networkedUrls();
}

// ── Driving the production path ───────────────────────────────────────────────────────────────

const hosts: HTMLElement[] = [];

/** `createReaderPane` -> select() -> mount() -> D-3-R's real call site -> the production
 *  `import('temml')`. Nothing injected: no loader, no config, no engine seam. */
async function appPageReader(markdown: string): Promise<ShadowRoot> {
  const pane = createReaderPane(document);
  document.body.appendChild(pane.element);
  hosts.push(pane.element);
  await pane.select({ name: 'doc.md', read: async () => markdown });
  const host = pane.element.querySelector<HTMLElement>('.peekover-app__reader__host');
  if (!host?.shadowRoot) throw new Error('reader pane produced no mounted host');
  return host.shadowRoot;
}

async function settleMath(shadow: ShadowRoot, expectedCount: number): Promise<void> {
  for (let i = 0; i < 400; i += 1) {
    const marked = [...shadow.querySelectorAll(`[${MATH_STATE_ATTR}]`)];
    const settled = marked.filter((el) => el.getAttribute(MATH_STATE_ATTR) !== 'pending');
    if (marked.length >= expectedCount && settled.length >= expectedCount) return;
    await new Promise<void>((r) => setTimeout(r, 25));
  }
  throw new Error('math markers never settled');
}

function releaseHosts(): void {
  for (const el of hosts.splice(0)) el.remove();
}

beforeEach(() => {
  performance.clearResourceTimings();
});

afterEach(() => {
  releaseHosts();
});

describe('4.3-R — zero OFF-ORIGIN network for the real block/fence math path (§3.7, D-4-R)', () => {
  // ★ Both claims below share ONE render. `registerMathFont()` is idempotent (`mathFont.ts`'s own
  // module-level `registered` flag): only the FIRST math render in this file's own module instance
  // ever puts the font asset on the wire at all — Firefox in particular appears to serve a second
  // `FontFace` construction against the same URL from its in-process font cache without emitting a
  // second Resource Timing entry (observed while drafting this file: a second, `resetMathFontForTest`
  // -reset render read zero font requests on Firefox even though the SAME-ORIGIN reading was
  // otherwise correct). Reading the font's own URL out of THIS window — the guaranteed-cold one —
  // avoids relying on a cache behaviour this file has no need to depend on.
  it('★ import -> render -> sanitize -> adopt -> font-registration issues ZERO off-origin requests, and the font itself resolves SAME-ORIGIN', async () => {
    const shadow = await appPageReader('$$x^2$$\n');
    await settleMath(shadow, 1);
    await flush();

    // NON-VACUITY, axis 1: the render genuinely succeeded — a broken/no-op path would trivially
    // pass the zero-request claim below for the wrong reason.
    const figure = shadow.querySelector(FIGURE_SELECTOR);
    expect(figure?.getAttribute(MATH_STATE_ATTR), 'the formula did not render').toBe('rendered');
    expect(figure?.querySelector('math'), 'no <math> root was adopted').not.toBeNull();

    // NON-VACUITY, axis 2: something real DID cross the wire in this harness (the temml chunk
    // and/or the font asset, both same-origin dev-server fetches) — an empty buffer here would mean
    // the cold-load traffic never happened at all, making the off-origin zero below a fact about a
    // dead harness rather than about the real path.
    const seen = networkedUrls();
    expect(
      seen.length,
      'nothing was fetched at all in this window — the cold-load engine/font traffic this harness ' +
        'expects to see (same-origin) did not happen, so the off-origin zero below proves nothing',
    ).toBeGreaterThan(0);

    // NON-VACUITY, axis 3 (D-13, belt-and-suspenders on the URL-loaded font form): the bundled
    // asset really was fetched, by its committed name (`mathFont.ts`'s own import path), and it
    // resolved SAME-ORIGIN.
    const fontRequests = seen.filter((u) => /stix-two-math-subset/i.test(u));
    expect(
      fontRequests.length,
      'the STIX Two Math subset was never fetched in this window — either it failed to register or ' +
        'this test is not exercising the URL-loaded form 4.2-R shipped',
    ).toBeGreaterThan(0);
    for (const url of fontRequests) {
      expect(isOffOrigin(url), `the font asset resolved OFF-ORIGIN: ${url}`).toBe(false);
    }

    // ★ THE CLAIM.
    expect(
      seen.filter(isOffOrigin),
      'the real math render path (engine load, render, sanitize, adopt, font registration) put an ' +
        'OFF-ORIGIN request on the wire — AGENTS.md #1',
    ).toEqual([]);
  }, 30_000);

  it('★ THE FONT-SPECIFIC FIRING CONTROL — the observer catches a REMOTE font fetch (§3.7\'s trap)', async () => {
    // Render a benign formula first so this arm's OWN off-origin reading is not confused with the
    // production path's (already proven clean above) — a fresh clear, then inject.
    await appPageReader('$$y^2$$\n');
    await flush();
    performance.clearResourceTimings();

    const offOrigin = offOriginProbeUrl('/__peekover_probe__/math-network-firing/stix-probe.woff2');

    // The EXACT mechanism `registerMathFont()` uses (`new FontFace(...)` + `document.fonts.add()`),
    // built here with an off-origin source and NO production module touched — the seam §3.7's own
    // named trap would actually go through if `mathFont.ts` ever regressed to a CDN URL.
    const probe = new FontFace('Peekover Math Network Probe', `url(${offOrigin}) format('woff2')`, {
      display: 'swap',
    });
    document.fonts.add(probe);
    // `.load()` on a 404 rejects; swallow it — this arm only cares that the REQUEST went out.
    probe.load().catch(() => undefined);

    const seen = await awaitUrl((u) => u === offOrigin);
    expect(
      seen,
      'THE FIRING CONTROL DID NOT FIRE: an off-origin FontFace source put nothing on the wire, so ' +
        'this observer cannot detect a remote font request at all and the zero-off-origin claim ' +
        'above is UNFALSIFIABLE for exactly the case §3.7 names (retro 2026-07-19 finding 1)',
    ).toContain(offOrigin);
    // ★ And the claim's OWN reading (the same filter the real-path test above applies) catches it.
    expect(
      networkedUrls().filter(isOffOrigin),
      'the off-origin font request fired but the claim\'s own off-origin filter did not see it',
    ).toContain(offOrigin);

    document.fonts.delete(probe);
  }, 30_000);
});

describe('COLD LOAD — the engine/font import fetched only our own package', () => {
  it('a first-ever math render in this window touches nothing off-origin', async () => {
    const shadow = await appPageReader('$$z^2$$\n');
    await settleMath(shadow, 1);
    await flush();
    expect(networkedUrls().filter(isOffOrigin)).toEqual([]);
  }, 30_000);
});

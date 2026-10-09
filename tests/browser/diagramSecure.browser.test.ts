// The REAL-ENGINE proof that D-6's config CLOSES the pre-sanitize directive-injection fetch
// route (007 D-6, as hardened by decisions.md `16c7790`). This is an instance of spec §3.10's
// FIRST bullet — *"the engine is configured so it cannot emit remote references"* — which is
// why the guarantee lives in a config assertion and not in the sanitizer.
//
// ★ WHY THIS CANNOT BE A UNIT TEST. The defect is BYTES ON THE WIRE, fired by the ENGINE,
// during `mermaid.render()` — i.e. inside D-6's measurement window, BEFORE `sanitizeSvg` ever
// sees the string. jsdom loads no subresources (`mount.ts:119-129`'s lesson, banked
// decisions.md 2026-07-14), so a jsdom test cannot distinguish "no request" from "no engine
// that could make one". The unit mirror in `src/render/diagramEngine.test.ts` therefore pins
// the config's SHAPE and says in its own words that THIS file is the fetch proof.
//
// ── THE ROUTE, AND WHY DENYING `<style>` DOES NOT CLOSE IT ────────────────────────────────
//
// At `securityLevel: 'strict'`, an untrusted markdown author can still inject arbitrary CSS
// into mermaid's GENERATED `<style>` through a `%%{init:{…}}%%` directive, because directives
// are merged into the config before rendering. `config.sanitize()` deletes only the keys named
// in the `secure` list, and mermaid's default list does not name the CSS-bearing ones. The
// injected `url(…)` is then fetched by the engine's own live render container — so stripping
// `<style>` downstream (2.1) is too late, and `'strict'` does not help ('loose' behaves
// identically). Two routes are proven independently live, and BOTH are asserted here:
//
//   ROUTE 1 · `themeCSS`     — arbitrary CSS, verbatim. Note the payload uses an ORDINARY
//                              url()-bearing property (`background-image`), NOT `@import`:
//                              `@import` is dropped by `createUserStyles`' constructed-
//                              stylesheet parse (`replaceSync` ignores it), so an `@import`
//                              payload would pass VACUOUSLY. §3.10's prose names `@import`;
//                              the live route is ordinary properties, and that gap is the
//                              single most load-bearing detail in this file.
//   ROUTE 2 · `fontFamily`   — interpolated into a `:root{--mermaid-font-family: …}` rule.
//                              `sanitizeCss` guards it, but only by BRACE BALANCE, so a
//                              brace-balanced `serif; background-image: url(…)` sails through.
//                              A fix that closed ROUTE 1 alone must still red here — which is
//                              exactly why this file is not `themeCSS`-only.
//
// ── ZERO-NETWORK DISCIPLINE OF THE TEST ITSELF (AGENTS.md #1) ────────────────────────────
//
// Every "remote" URL is SAME-ORIGIN, built off `location.origin` — the Vitest dev server IS
// the loopback, exactly as `remoteMedia.browser.test.ts` uses it. Nothing leaves the machine
// even when a payload succeeds; the request 404s locally. The `http(s)` scheme is what makes
// it a genuine remote reference, which is the property under test.
//
// The RETURNED SVG IS NEVER INSERTED into the document. Any request observed here was
// therefore issued by the engine's own temporary render container while it was live — the
// render is the only window, which is what makes "0 requests" attributable to the config.

import { describe, it, expect, beforeEach } from 'vitest';
// 5.8: read the zero only after a later request has landed (helpers/diagramWindow.ts).
import { wireSettled } from './helpers/diagramWindow';
import mermaid from 'mermaid';
import type { MermaidConfig } from 'mermaid';
import { DIAGRAM_ENGINE_CONFIG } from '../../src/render/diagramEngine';

/**
 * mermaid 11.16.0's OWN default `secure` list, transcribed from
 * `mermaid/dist/chunks/mermaid.core/chunk-WYO6CB5R.mjs:4441-4448`. Used ONLY by the ablation
 * arm: a config that passes exactly this list is passing an array to `initialize()` without
 * adding a single key, which is the control that isolates WHAT closes the route.
 */
const MERMAID_DEFAULT_SECURE = [
  'secure',
  'securityLevel',
  'startOnLoad',
  'maxTextSize',
  'suppressErrorRendering',
  'maxEdges',
] as const;

/**
 * D-6's configuration AS IT STOOD BEFORE THE HARDENING — the red-first's un-hardened arm.
 * Byte-for-byte the three values `DIAGRAM_ENGINE_CONFIG` carried at commit `c7b3004`, so the
 * ONLY variable between this and the real config is the `secure` key. Keeping it here (rather
 * than reverting the source) is what lets both arms run in ONE process, against ONE engine, in
 * the SAME run: the comparison cannot be confounded by a rebuild or a machine-state drift.
 */
const UNHARDENED_CONFIG = {
  securityLevel: 'strict',
  htmlLabels: false,
  startOnLoad: false,
} as MermaidConfig;

/** The ablation: the same config PLUS mermaid's default list, verbatim. No key added. */
const ABLATION_CONFIG = {
  ...UNHARDENED_CONFIG,
  secure: [...MERMAID_DEFAULT_SECURE],
} as MermaidConfig;

/** The real thing, imported from the module under test — not a copy that could drift. */
const HARDENED_CONFIG = DIAGRAM_ENGINE_CONFIG as unknown as MermaidConfig;

// ── The loopback probe ────────────────────────────────────────────────────────────────────

let seq = 0;
/** A unique path token per case, so one case's timing entries can never be read as another's. */
function freshToken(): string {
  seq += 1;
  return `d6-${seq}`;
}

function probeUrl(token: string, name: string): string {
  return new URL(`/__peekover_probe__/${token}/${name}.png`, location.origin).href;
}

/** Resource-timing entry names the ENGINE actually put on the wire for `token`. */
function fetchedUrls(token: string): string[] {
  return performance
    .getEntriesByType('resource')
    .map((e) => e.name)
    .filter((name) => name.includes(`/__peekover_probe__/${token}/`));
}

/**
 * AWAIT a request that SHOULD fire, never sample for it (retro 2026-07-19 finding 1). The RED
 * arms are this file's positive controls — a control that reads empty when the request DID
 * fire can read empty when it did not, and the assertion it guards is AGENTS.md #1. Returns
 * the buffer rather than throwing, so a genuine failure reds on the caller's own assertion
 * with the real diff of what was and was not fetched.
 */
async function awaitFetch(token: string, expected: string): Promise<string[]> {
  const deadline = performance.now() + 5000;
  let seen = fetchedUrls(token);
  while (!seen.includes(expected) && performance.now() < deadline) {
    await new Promise<void>((resolve) => setTimeout(resolve, 25));
    seen = fetchedUrls(token);
  }
  return seen;
}

// ── Rendering ─────────────────────────────────────────────────────────────────────────────

/** A flowchart, so `.node rect` — the payload's selector — actually matches something. */
function diagram(directive: string): string {
  return `${directive}\ngraph TD\n  A[Alpha] --> B[Beta]\n`;
}

/**
 * Render under `config` and return the SVG STRING. The string is deliberately never inserted:
 * see the header — that is what makes an observed request attributable to the render window.
 * `mermaid.initialize` fully RESETS site config each call (`setSiteConfig` re-seeds from
 * `defaultConfig` before assigning), so the arms below cannot leak into one another.
 */
async function renderWith(config: MermaidConfig, definition: string): Promise<string> {
  const id = `peekover-d6-${seq}`;
  mermaid.initialize(config);
  try {
    return (await mermaid.render(id, definition)).svg;
  } finally {
    // Defensive: mermaid removes its own temp container, but a throw mid-render could orphan
    // one, and an orphan left in the live document would keep fetching past this test.
    document.querySelector(`#d${id}`)?.remove();
  }
}

beforeEach(() => {
  performance.clearResourceTimings();
});

describe('D-6 — the hardened `secure` list closes the directive-injection fetch route', () => {
  it('THE INSTRUMENT FIRES: a benign %%{init}%% directive visibly takes effect', async () => {
    // ★ THE LIVE CONTROL for every "no fetch" result below. Without it, a clean sweep could
    // mean "directives are ignored in this harness" — i.e. a DEAD PROBE — and the whole file
    // would be asserting nothing. Here a `theme` directive (never a secured key, before or
    // after the hardening) demonstrably reaches the renderer under the REAL config.
    const plain = await renderWith(HARDENED_CONFIG, diagram(''));
    const dark = await renderWith(HARDENED_CONFIG, diagram('%%{init:{"theme":"dark"}}%%'));

    expect(plain, 'the two renders are identical — the theme directive did nothing').not.toBe(
      dark,
    );
    // By value, so a red names the drift: the default node fill gives way to the dark one.
    expect(plain).toContain('#ECECFF');
    expect(dark).not.toContain('#ECECFF');
  });

  it('ROUTE 1 (themeCSS) — RED un-hardened: the payload lands in <style> AND reaches the wire', async () => {
    // The defect, reproduced. This arm MUST pass for the green arm to mean anything: if the
    // route does not fire here, the threat model or this test is wrong (never the config).
    const token = freshToken();
    const url = probeUrl(token, 'evil1');
    const svg = await renderWith(
      UNHARDENED_CONFIG,
      diagram(`%%{init:{"themeCSS":".node rect{background-image:url(${url})}"}}%%`),
    );

    expect(svg, 'the themeCSS payload did NOT survive into the generated <style>').toContain(url);
    expect(await awaitFetch(token, url), 'the injected url() never reached the wire').toContain(
      url,
    );
  });

  it('ROUTE 1 (themeCSS) — GREEN hardened: no payload in <style>, ZERO requests', async () => {
    const token = freshToken();
    const url = probeUrl(token, 'evil1');
    const svg = await renderWith(
      HARDENED_CONFIG,
      diagram(`%%{init:{"themeCSS":".node rect{background-image:url(${url})}"}}%%`),
    );
    await wireSettled();

    expect(svg, 'the themeCSS payload still reaches the generated <style>').not.toContain(url);
    expect(
      fetchedUrls(token),
      'the engine FETCHED an author-injected themeCSS url() — the route is still open',
    ).toEqual([]);
  });

  it('ROUTE 2 (fontFamily) — RED un-hardened: the brace-balanced payload reaches the wire', async () => {
    // Independently live, and NOT closed by anything that only handles `themeCSS`.
    // `sanitizeCss` sees balanced braces (there are none) and passes the value through into
    // `:root{--mermaid-font-family: serif; background-image: url(…)}`.
    const token = freshToken();
    const url = probeUrl(token, 'evil2');
    const svg = await renderWith(
      UNHARDENED_CONFIG,
      diagram(`%%{init:{"fontFamily":"serif; background-image: url(${url})"}}%%`),
    );

    expect(svg, 'the fontFamily payload did NOT survive into the generated <style>').toContain(
      url,
    );
    expect(await awaitFetch(token, url), 'the interpolated url() never reached the wire').toContain(
      url,
    );
  });

  it('ROUTE 2 (fontFamily) — GREEN hardened: no payload in <style>, ZERO requests', async () => {
    const token = freshToken();
    const url = probeUrl(token, 'evil2');
    const svg = await renderWith(
      HARDENED_CONFIG,
      diagram(`%%{init:{"fontFamily":"serif; background-image: url(${url})"}}%%`),
    );
    await wireSettled();

    expect(svg, 'the fontFamily payload still reaches the generated <style>').not.toContain(url);
    expect(
      fetchedUrls(token),
      'the engine FETCHED an author-injected fontFamily url() — ROUTE 2 is still open',
    ).toEqual([]);
  });

  it('THE SELF-GUARD: a directive that tries to RE-WIDEN `secure` does not re-open the route', async () => {
    // Without this, the mitigation would be one-line-bypassable and worth nothing. It holds
    // because `sanitize()` iterates `['secure', ...siteConfig.secure]` — `'secure'` is
    // ALWAYS stripped from a directive first, so the payload key is judged against OUR list.
    const token = freshToken();
    const url = probeUrl(token, 'evil3');
    const svg = await renderWith(
      HARDENED_CONFIG,
      diagram(
        `%%{init:{"secure":[],"themeCSS":".node rect{background-image:url(${url})}"}}%%`,
      ),
    );
    await wireSettled();

    expect(svg, 'a directive re-widened `secure` — the hardening is bypassable').not.toContain(
      url,
    );
    expect(
      fetchedUrls(token),
      'the re-widening directive FETCHED — `secure` does not guard itself',
    ).toEqual([]);
  });

  it('THE ABLATION: mermaid’s DEFAULT `secure` list still fetches — the four ADDED keys are causal', async () => {
    // The mitigation must be CAUSAL, not incidental. If merely passing an array to
    // `initialize()` were enough, this arm would be clean and the four keys would be
    // decoration. It is not clean: the default list does not name `themeCSS`.
    const token = freshToken();
    const url = probeUrl(token, 'evil4');
    const svg = await renderWith(
      ABLATION_CONFIG,
      diagram(`%%{init:{"themeCSS":".node rect{background-image:url(${url})}"}}%%`),
    );

    expect(svg, 'the default `secure` list already blocked themeCSS — ablation is vacuous').toContain(
      url,
    );
    expect(
      await awaitFetch(token, url),
      'the default-list config did not fetch — this ablation proves nothing',
    ).toContain(url);
  });

  it('FEATURE INTACT: a themeCSS WE set through initialize() still applies', async () => {
    // The hardening closes the DIRECTIVE route, not the feature. `secure` is only ever
    // consulted for directive-supplied keys, so our own configuration is unaffected — which
    // is what keeps this a security fix rather than a capability removal.
    const ours = '.node rect{stroke-dasharray:4 2}';
    const svg = await renderWith(
      { ...HARDENED_CONFIG, theme: 'base', themeCSS: ours } as MermaidConfig,
      diagram(''),
    );

    // Asserted up to the COLON, deliberately: the value round-trips through the CSSOM, which
    // normalizes it (`4 2` is re-serialized as `4px,2px`), and that spelling is an engine
    // detail rather than our property. The selector+property pair appears in the output ONLY
    // because we set it — no base rule targets `.node rect` with `stroke-dasharray`.
    expect(svg, 'our own initialize()-set themeCSS was dropped — the feature is broken').toContain(
      '.node rect{stroke-dasharray:',
    );
  });

  it('the hardened list is mermaid’s default PLUS exactly the four CSS-bearing keys', async () => {
    // Pins the SET, in the file that proves what the set buys. A future edit that drops a
    // default member would silently un-secure `securityLevel` itself.
    const secure = (HARDENED_CONFIG.secure ?? []) as string[];
    for (const key of MERMAID_DEFAULT_SECURE) expect(secure).toContain(key);
    for (const key of ['themeCSS', 'fontFamily', 'altFontFamily', 'themeVariables']) {
      expect(secure, `${key} is not secured — its route is open`).toContain(key);
    }
    expect([...secure].sort()).toEqual(
      [...MERMAID_DEFAULT_SECURE, 'themeCSS', 'fontFamily', 'altFontFamily', 'themeVariables'].sort(),
    );
  });
});

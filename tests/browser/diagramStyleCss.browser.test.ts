// The REAL-ENGINE proof that admitting `<style>` into the SVG profile (007 D-1/D-6
// option B, decisions.md `0de27f3`) cannot let a cached diagram fetch — that the CSS pass
// in `sanitize.ts` strips every external reference the stylesheet can carry, while leaving
// the internal references and `@keyframes` the artifact needs.
//
// ★ WHY THIS CANNOT BE A UNIT TEST. The security property is BYTES ON THE WIRE. A
// string-stripping assertion is NECESSARY BUT NOT SUFFICIENT: it proves the spelling we
// thought of is gone, not that the artifact is inert. jsdom loads no subresources
// (decisions.md 2026-07-14), so under jsdom "no request" and "no engine that could make
// one" are the same reading. So every lane here ADOPTS the sanitized artifact into the
// LIVE document and watches the Resource-Timing buffer. The unit mirror in
// `src/render/sanitize.test.ts` pins the string-level shape and says THIS file is the
// fetch proof.
//
// ── THE TWO ARMS, IN ONE PROCESS ──────────────────────────────────────────────────────
//
// RED   `sanitizeNoCssPass` — a HOOKLESS DOMPurify instance running the REAL
//        `SANITIZE_SVG_CONFIG`. Since the config now allow-lists `style`, this is exactly
//        "option B without the CSS pass", and it is the arm that must REPRODUCE: the
//        payload survives into the `<style>` AND reaches the wire. If a lane does not
//        fire here, the threat model or this test is wrong — never the pass.
// GREEN `sanitizeSvg` — the real thing. Same payload, same adoption, ZERO requests.
//
// Keeping both arms in ONE file (rather than reverting the source) is what lets them run
// against ONE engine in the SAME run: the comparison cannot be confounded by a rebuild or
// by machine state. It is the shape `diagramSecure.browser.test.ts` uses for D-6.
//
// ── ★ THE LIVE CONTROL IS IN EVERY LANE'S OWN STYLESHEET ──────────────────────────────
//
// Every payload stylesheet also carries a benign internal `url(#gradA)` and a
// `@keyframes` rule, and the GREEN arm asserts BOTH SURVIVE. Without that, "zero
// requests" would be satisfied by a pass that deleted the stylesheet wholesale — the
// over-strip vacuity trap — and option B would have bought nothing, since 100% of a
// flowchart's paint is CSS. A green lane therefore means "the external reference went AND
// the artifact still styles", not "the stylesheet went".
//
// ── ZERO-NETWORK DISCIPLINE OF THE TEST ITSELF (AGENTS.md #1) ─────────────────────────
//
// Every "remote" URL is SAME-ORIGIN, built off `location.origin` — the Vitest dev server
// IS the loopback, exactly as `remoteMedia.browser.test.ts` and `diagramSecure` use it.
// Nothing leaves the machine even when a RED payload succeeds; the request 404s locally.
// The `http(s)` scheme is what makes it a genuine external reference, which is the
// property under test.

import { describe, it, expect, beforeEach } from 'vitest';
import DOMPurify from 'dompurify';
import mermaid from 'mermaid';
import type { MermaidConfig } from 'mermaid';
import { sanitizeSvg, cleanSvgCss, SANITIZE_SVG_CONFIG } from '../../src/render/sanitize';
import { DIAGRAM_ENGINE_CONFIG } from '../../src/render/diagramEngine';

// ── The two arms ──────────────────────────────────────────────────────────────────────

/**
 * The RED arm's sanitizer: the REAL config on a FRESH DOMPurify instance, which therefore
 * carries none of the hooks `sanitize.ts` registers. `sanitizeSvg` adds the CSS pass hook
 * around its own call and removes it again, so this instance is the same profile MINUS
 * exactly the pass — a one-variable comparison. (It also lacks the inherited
 * `uponSanitizeAttribute` data: hook, which task 2.2 proved a no-op on this profile.)
 */
const noCssPass = DOMPurify(window);
function sanitizeNoCssPass(svg: string): string {
  return noCssPass.sanitize(svg, SANITIZE_SVG_CONFIG) as string;
}

// ── The loopback probe ────────────────────────────────────────────────────────────────

let seq = 0;
/** A unique path token per case, so one case's timing entries can never be read as another's. */
function freshToken(): string {
  seq += 1;
  return `css-${seq}`;
}

function probeUrl(token: string, name: string): string {
  return new URL(`/__peekover_probe__/${token}/${name}`, location.origin).href;
}

/** Resource-timing entry names actually put on the wire for `token`. */
function fetchedUrls(token: string): string[] {
  return performance
    .getEntriesByType('resource')
    .map((e) => e.name)
    .filter((name) => name.includes(`/__peekover_probe__/${token}/`));
}

/**
 * A macrotask + rAF + settle. Long enough that a request fired by an adopted stylesheet
 * has reached the Resource-Timing buffer (a same-origin 404 resolves fast). Sound for the
 * ZERO direction: if no request fired, no wait length changes the answer.
 */
function flush(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      requestAnimationFrame(() => setTimeout(resolve, 60));
    }, 120);
  });
}

/**
 * AWAIT a request that SHOULD fire, never sample for it (retro 2026-07-19 finding 1). The
 * RED arms are this file's positive controls — a control that reads empty when the request
 * DID fire can read empty when it did not, and the assertion it guards is AGENTS.md #1.
 * Returns the buffer rather than throwing, so a genuine failure reds on the caller's own
 * assertion with the real diff of what was and was not fetched.
 */
async function awaitFetch(token: string, expected: string): Promise<string[]> {
  // Settle a FRAME first, not just a macrotask. An adopted stylesheet's `@import` load is
  // kicked off by the style flush, and Firefox will not run one for a bare `setTimeout`
  // poll loop that never touches layout — measured: the same `@import` that fetches after
  // a rAF reads as NO-FETCH when polled on timers alone, in Firefox but not in Chromium.
  // Polling a quiescent engine is how a positive control turns into a silent false red.
  await flush();
  const deadline = performance.now() + 5000;
  let seen = fetchedUrls(token);
  while (!seen.includes(expected) && performance.now() < deadline) {
    await new Promise<void>((resolve) => setTimeout(resolve, 25));
    seen = fetchedUrls(token);
  }
  return seen;
}

// ── Adoption ──────────────────────────────────────────────────────────────────────────

// Rendered and in-viewport, not `display:none`: an unrendered subtree is allowed to defer
// its background-image fetch, which would make a clean RED arm mean nothing.
const ADOPT_STYLE =
  'position:fixed;top:0;left:0;width:140px;height:140px;opacity:0.01;pointer-events:none;z-index:-1';

/**
 * Insert `svg` into the LIVE document, hold it there until `settle` resolves, then remove
 * it. This is the whole point of the file: the property under test is what the ADOPTED
 * artifact does, and the group-3 enhancer adopts exactly this string. A request observed
 * inside `settle` can only have been issued by the artifact we just inserted.
 */
async function adopting<T>(svg: string, settle: () => Promise<T>): Promise<T> {
  const host = document.createElement('div');
  host.setAttribute('style', ADOPT_STYLE);
  host.innerHTML = svg;
  document.body.append(host);
  try {
    return await settle();
  } finally {
    host.remove();
  }
}

// ── Payload construction ──────────────────────────────────────────────────────────────

/** The benign rules carried alongside EVERY payload — this file's live control. */
function controlRules(token: string): string {
  return (
    `.p-${token} .keep{fill:url(#gradA)}\n` +
    `@keyframes dash{to{stroke-dashoffset:0}}\n` +
    `@keyframes edge-animation-frame{from{stroke-dashoffset:0}}`
  );
}

/** An `<svg>` carrying `css` in a `<style>`, shaped like what the engine hands us. */
function svgWithCss(token: string, css: string): string {
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ' +
    `class="p-${token}" viewBox="0 0 100 100" width="100" height="100" ` +
    'role="graphics-document document" aria-roledescription="flowchart">' +
    '<title>probe</title><desc>css pass probe</desc>' +
    `<style>${css}\n${controlRules(token)}</style>` +
    '<defs><linearGradient id="gradA"><stop offset="0" stop-color="#fff" /></linearGradient>' +
    '<marker id="arrowhead"><path d="M0,0 L8,3 L0,6 z" /></marker></defs>' +
    '<rect class="keep" width="80" height="40" fill="url(#gradA)" />' +
    '<line x1="0" y1="0" x2="80" y2="0" marker-end="url(#arrowhead)" /></svg>'
  );
}

/** The `<style>` text of a sanitized string, so an assertion prints the surviving rule. */
function styleTextOf(svg: string): string {
  const doc = new DOMParser().parseFromString(svg, 'text/html');
  return doc.querySelector('style')?.textContent ?? '';
}

/**
 * The four obfuscation lanes the reproduction found, plus the two external forms a naive
 * reader would not call URLs. Each is a DIFFERENT SPELLING of the same defect, and each
 * gets its own RED and GREEN case, because a pass can close one and miss another.
 */
const LANES = [
  {
    key: 'escape',
    // ★ THE LANE THAT DECIDES THE MECHANISM. `\72` is an escaped `r`, so this IS a url
    // token to the CSS parser and is NOT one to `/url\(/`. A pass built on a naive regex
    // goes green everywhere else and red only here.
    title: String.raw`CSS escape \`u\72 l(\` — the lane a naive /url\(/ MISSES`,
    css: (url: string) => String.raw`u\72 l(${url})`,
  },
  { key: 'case', title: 'case `URL(`', css: (url: string) => `URL(${url})` },
  {
    key: 'space',
    title: 'interior whitespace `url(  …  )`',
    css: (url: string) => `url(  ${url}  )`,
  },
  {
    key: 'dquote',
    title: 'double quoting `url("…")`',
    css: (url: string) => `url("${url}")`,
  },
  {
    key: 'squote',
    title: "single quoting `url('…')`",
    css: (url: string) => `url('${url}')`,
  },
  {
    key: 'protorel',
    title: 'protocol-relative `url(//host/…)` — external with no scheme to match on',
    css: (url: string) => `url(${url.replace(/^https?:/, '')})`,
    // What lands in the CSS has no scheme; what lands on the WIRE is resolved against the
    // page. The two assertions therefore look at different strings, and conflating them
    // makes this lane fail for a reason that has nothing to do with the pass.
    inCss: (url: string) => url.replace(/^https?:/, ''),
  },
] as const;

/** The spelling a lane leaves in the stylesheet — the same as the wire URL unless stated. */
function cssSpelling(lane: (typeof LANES)[number], url: string): string {
  return 'inCss' in lane ? lane.inCss(url) : url;
}

beforeEach(() => {
  performance.clearResourceTimings();
});

describe('the CSS pass — an adopted <style> carries no external reference (D-1 option B)', () => {
  describe.each(LANES)('lane: $title', (lane) => {
    it('RED without the pass: the payload lands in <style> AND reaches the wire', async () => {
      const token = freshToken();
      const url = probeUrl(token, `${lane.key}.png`);
      const out = sanitizeNoCssPass(
        svgWithCss(token, `.p-${token}{background-image:${lane.css(url)}}`),
      );

      expect(
        styleTextOf(out),
        'the payload did NOT survive the no-pass arm — this lane does not reproduce',
      ).toContain(cssSpelling(lane, url));
      expect(
        await adopting(out, () => awaitFetch(token, url)),
        'the adopted artifact never fetched — this lane is not a live route, so the green arm proves nothing',
      ).toContain(url);
    });

    it('GREEN with the pass: stripped, ZERO requests, and the control survives', async () => {
      const token = freshToken();
      const url = probeUrl(token, `${lane.key}.png`);
      const out = sanitizeSvg(svgWithCss(token, `.p-${token}{background-image:${lane.css(url)}}`));
      const css = styleTextOf(out);

      expect(css, `the external url() SURVIVED the pass: ${css}`).not.toContain(
        cssSpelling(lane, url),
      );
      expect(
        await adopting(out, async () => {
          await flush();
          return fetchedUrls(token);
        }),
        'the adopted artifact FETCHED — the pass misses this lane and the hole is live',
      ).toEqual([]);

      // ★ THE LIVE CONTROL, in the same stylesheet the payload was in.
      expect(css, 'internal url(#gradA) was stripped too — the clean sweep is an over-strip').toContain(
        'url(#gradA)',
      );
      expect(css, '@keyframes was stripped — animated edges die with it').toContain(
        '@keyframes dash',
      );
    });
  });

  it('RED/GREEN `@import` — the at-rule route, which no url()-scoped pass would reach', async () => {
    // Defense-in-depth (mermaid drops `@import` twice over before we ever see it), and
    // deliberately BOTH ARMS IN ONE CASE so the reproduction and the fix are read together.
    // `@import` must LEAD the stylesheet or the engine ignores it, which is why the payload
    // is prepended rather than appended.
    //
    // ★ THE CONTROL IS THE RAW MARKUP, NOT THE NO-PASS SANITIZER'S OUTPUT — and that is a
    // measured correction, not a stylistic one. In FIREFOX, parsing `@import url(X)` into
    // any INERT document consumes the load for X: `new DOMParser().parseFromString(…)` is
    // enough, no request ever reaches the wire, and a later adoption of that same X is
    // NEVER RETRIED. Since sanitizing the payload IS such a parse, routing the control
    // through `sanitizeNoCssPass` makes it read NO-FETCH in Firefox — a positive control
    // that reads empty when the route is wide open, which is the exact failure mode
    // AGENTS.md #1's assertions cannot afford. Measured: byte-identical strings, one
    // hand-written and one from `DOMPurify.sanitize`, fetch and do not fetch respectively
    // in Firefox and both fetch in Chromium. So the LIVE-ROUTE arm adopts markup no
    // sanitizer has touched, and the PRESERVED-BY-THE-NO-PASS-PROFILE arm stays a string
    // assertion — each arm proving the thing it can actually prove in both engines.
    const liveToken = freshToken();
    const liveUrl = probeUrl(liveToken, 'import.css');
    expect(
      await adopting(svgWithCss(liveToken, `@import url(${liveUrl});`), () =>
        awaitFetch(liveToken, liveUrl),
      ),
      'an adopted @import never fetched — the at-rule lane is not a live route at all',
    ).toContain(liveUrl);

    const redToken = freshToken();
    const redUrl = probeUrl(redToken, 'import.css');
    expect(
      styleTextOf(sanitizeNoCssPass(svgWithCss(redToken, `@import url(${redUrl});`))),
      'the @import did not survive the no-pass arm — there is nothing for the pass to fix',
    ).toContain(redUrl);

    const token = freshToken();
    const url = probeUrl(token, 'import.css');
    const out = sanitizeSvg(svgWithCss(token, `@import url(${url});`));
    const css = styleTextOf(out);
    expect(css, `the @import SURVIVED the pass: ${css}`).not.toContain('@import');
    expect(
      await adopting(out, async () => {
        await flush();
        return fetchedUrls(token);
      }),
      'the adopted artifact FETCHED an @import — the at-rule lane is still open',
    ).toEqual([]);
    expect(css, '@keyframes went with the @import — the at-rule policy is not an allow-list').toContain(
      '@keyframes dash',
    );
  });

  it('`url(data:…)` — inert on the wire, still an external reference, still stripped', async () => {
    // The one lane with NO wire event to observe: a data: URI is decoded in-process. Its
    // proof is therefore string-level in BOTH arms, stated plainly rather than dressed up
    // as a fetch result. It is in scope because the artifact must carry no external
    // reference at all — the document profile denies data: for the same reason (`:76-78`).
    const token = freshToken();
    const payload = 'url(data:image/gif;base64,R0lGODlhAQABAAAAACw=)';

    expect(
      styleTextOf(sanitizeNoCssPass(svgWithCss(token, `.p-${token}{background-image:${payload}}`))),
      'the data: URI did not survive the no-pass arm — the lane does not reproduce',
    ).toContain('data:image/gif');

    const css = styleTextOf(sanitizeSvg(svgWithCss(token, `.p-${token}{background-image:${payload}}`)));
    expect(css, `the data: URI SURVIVED the pass: ${css}`).not.toContain('data:');
    expect(css, 'the control went with it — over-strip').toContain('url(#gradA)');
  });

  it('`image-set("…")` — a bare-string image, a fetch with no url( token in it at all', async () => {
    // BEYOND the reproduction's enumerated surface, and included because a url()-scoped
    // scan alone would miss it: `image-set()` accepts a `<string>` where a `<url>` would
    // go, so there is no `url(` for a token scan to find. The pass denies the whole
    // function; neither it nor `cross-fade()` has a producer in engine output, which is
    // what makes denying it free. The RED arm asserts SURVIVAL rather than a fetch —
    // whether a given engine fetches a bare-string image-set inside an SVG stylesheet is
    // an engine detail, and pinning it would make this case fail for the wrong reason.
    const token = freshToken();
    const url = probeUrl(token, 'imageset.png');
    const payload = `image-set("${url}" 1x)`;

    expect(
      styleTextOf(sanitizeNoCssPass(svgWithCss(token, `.p-${token}{background-image:${payload}}`))),
      'image-set did not survive the no-pass arm',
    ).toContain(url);

    const out = sanitizeSvg(svgWithCss(token, `.p-${token}{background-image:${payload}}`));
    const css = styleTextOf(out);
    expect(css, `the bare-string image-set SURVIVED the pass: ${css}`).not.toContain(url);
    expect(
      await adopting(out, async () => {
        await flush();
        return fetchedUrls(token);
      }),
      'the adopted artifact FETCHED an image-set string',
    ).toEqual([]);
  });

  it('PRESERVES internal url(#…) in every quote form, and the attribute references', () => {
    // The positive direction, on its own rather than only as a control: the pass must be
    // usable, and `url(#…)` is how a diagram attaches its gradients, arrowheads and clips.
    const token = freshToken();
    const css =
      `.a{fill:url(#gradA)}\n.b{fill:url("#gradA")}\n.c{fill:url('#gradA')}\n` +
      `.d{fill:url(  #gradA  )}\n.e{clip-path:url(#clipA)}\n.f{marker-end:url(#arrowhead)}`;
    const out = sanitizeSvg(svgWithCss(token, css));
    const kept = styleTextOf(out);

    for (const form of [
      'url(#gradA)',
      'url("#gradA")',
      "url('#gradA')",
      'url(  #gradA  )',
      'url(#clipA)',
      'url(#arrowhead)',
    ]) {
      expect(kept, `${form} was stripped — the pass is unusable for a real diagram`).toContain(form);
    }
    // The ATTRIBUTE references the profile already gated must be untouched by the pass.
    expect(out).toContain('fill="url(#gradA)"');
    expect(out).toContain('marker-end="url(#arrowhead)"');
  });

  it('ENGINE-SHAPED: a REAL mermaid <style> passes through byte-identical, and fetches nothing', async () => {
    // The pass must not damage the artifact it exists to protect, and the only honest way
    // to know is to run it over what the engine actually emits — not over a fixture that
    // encodes what we BELIEVE it emits.
    mermaid.initialize(DIAGRAM_ENGINE_CONFIG as unknown as MermaidConfig);
    const { svg } = await mermaid.render('peekover-csspass', 'graph TD\n  A[Alpha] --> B[Beta]\n');
    document.querySelector('#dpeekover-csspass')?.remove();

    const before = styleTextOf(svg);
    expect(before, 'the render emitted no <style> — this case is vacuous').not.toBe('');
    expect(before, 'mermaid stopped emitting @keyframes; the at-rule allow-list needs re-deriving')
      .toContain('@keyframes');

    // The strongest form of "no damage": on a clean stylesheet the pass is the identity.
    expect(cleanSvgCss(before), 'the pass rewrote a clean engine stylesheet').toBe(before);

    const token = freshToken();
    performance.clearResourceTimings();
    const out = sanitizeSvg(svg);
    const after = styleTextOf(out);

    expect(after, 'sanitizeSvg altered the engine stylesheet').toBe(before);
    for (const frame of ['edge-animation-frame', 'dash']) {
      expect(after, `@keyframes ${frame} did not survive — animated edges are dead`).toContain(
        `@keyframes ${frame}`,
      );
    }
    expect(after, 'the pass introduced an external reference').not.toMatch(/url\((?!#)/i);
    expect(
      await adopting(out, async () => {
        await flush();
        return performance.getEntriesByType('resource').map((e) => e.name).filter((n) => n.includes(token));
      }),
      'the adopted real diagram fetched something',
    ).toEqual([]);
  });

  it('the pass is IDEMPOTENT — re-sanitizing an adopted artifact changes nothing', () => {
    // The artifact is CACHED and re-adopted (§3.6/§3.7), so it can be re-sanitized. A pass
    // whose output is not a fixpoint would drift the cached bytes on every pass.
    const token = freshToken();
    const url = probeUrl(token, 'idem.png');
    const once = sanitizeSvg(svgWithCss(token, `.p-${token}{background-image:url(${url})}`));
    expect(sanitizeSvg(once)).toBe(once);
    expect(styleTextOf(once)).toContain('url(#gradA)');
  });
});

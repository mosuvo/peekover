// ★ THE OFF-ORIGIN GUARD ON D-6's MEASUREMENT WINDOW (007 task 3.3, plan §3.5 row 22).
//
// D-6 step 2 puts a LIVE, in-document container in the light DOM and renders into it, because text
// measurement needs a browsing context and this project's fonts live on `document.fonts`. Between
// "the container is live" and "the artifact is sanitized" there is a window, and D-6 names its own
// residual hole rather than hiding it: *"a remote reference emitted by the engine DURING
// measurement, before we ever serialize"*. Configuration closes the known directive routes
// (`diagramEngine.ts`'s hardened `secure` list, `16c7790`), the enhancer's source pre-scan closes
// §4-remote references before the engine sees them (`eae7b08`), and the SVG profile closes the
// adopted artifact (`sanitize.ts`'s CSS pass, `367d051`); **none of them closes the window by
// construction**, and jsdom cannot see it — it loads no subresources (`mount.ts:119-129`'s standing
// lesson). This file is that measurement, and it GATES the mechanism rather than reporting on it.
// It DISCHARGES the note D-6's residual-hole clause has owed group 3 since `16c7790`.
//
// ── ★ WHAT THIS FILE CLAIMS, AND WHY IT IS NOT "ZERO REQUESTS" ────────────────────────────
//
// The plan's standing claim was *"the window issues no network for guard-passing source"*. That is
// **FALSE**, and `7a6dc63` banked the measurement that shows it: a RELATIVE reference — `img:
// "./x.png"`, `img: "/x.png"`, sequence `properties A: {"icon": "./x.png"}` — is not a §4-*remote*
// reference, so `hasRemoteReference` returns false BY DESIGN, the fence reaches `engine.render`, and
// the engine fetches it inside this window. The `properties.icon` variant even RENDERS while
// fetching. The guard is CORRECT and deliberately not widened (`4061398` scoped it to §4-remote
// because §4 forbids referencing a *remote resource*, and a relative reference is not one); in
// production such a reference resolves inside `chrome-extension://<id>/…`, which is PACKAGE-LOCAL
// and excluded from the wire predicate by scheme, exactly as our own lazy chunk is.
//
// So the claim this file ships is the SHARPENED one:
//
//     ★ D-6's measurement window issues NO OFF-ORIGIN REQUEST for guard-passing source.
//
// It is stronger than the claim it replaces, not weaker: it holds over ADVERSARIAL guard-passing
// source — including an author actively trying to name a foreign host through a spelling the guard
// permits — rather than over one hand-picked benign diagram. Guard-passing ⇒ same-origin, because
// changing origin needs `//` or a contiguous `https?:` and the guard catches both.
//
// ── ★ THE INSTRUMENT HAS TWO TIERS, AND BOTH ARE NECESSARY ────────────────────────────────
//
// A zero-network guard that cannot DETECT a network certifies nothing (retro 2026-07-19, finding 1).
// A claim about OFF-ORIGIN traffic needs that discipline applied twice, because "no off-origin
// requests" can fail to be news in two independent ways:
//
//   TIER 1 — THE LIVE CONTROL, and it fires INSIDE what the claim permits. A real production render
//     of a relative `properties.icon` passes the guard, reaches the engine, and the ENGINE puts a
//     SAME-ORIGIN request on the wire inside this window while the diagram RENDERS — from author
//     source that no sanitizer has touched, which is D-6's named residual hole *exactly*. This is
//     what makes the claim a MEASUREMENT and not an absence: something really did fetch here, the
//     observer really did see it, and what it saw was same-origin.
//   TIER 2 — THE OFF-ORIGIN FLOOR. TIER 1 proves the observer sees SAME-ORIGIN traffic; it does not
//     prove the observer would see OFF-ORIGIN traffic. Without that, "zero off-origin" could merely
//     mean the instrument is blind to off-origin — the dead-probe failure. So an off-origin request
//     is injected into the live measuring container mid-window and the SAME predicate the claim
//     reads is shown to catch it.
//
// Assembled: a real render fetches same-origin in the window (TIER 1, observed); no real render
// fetches off-origin (THE CLAIM); an off-origin request in that same window IS seen (TIER 2). Drop
// TIER 2 and the claim is unfalsifiable; drop TIER 1 and it is vacuous.
//
// ── ★ THE CONTROL SUCCESSION, recorded so the history stays legible ───────────────────────
//
// This one measurement has had its control replaced three times, and each replacement was forced by
// running it rather than by reasoning about it (`7a6dc63` banks the pattern for the M7 retro):
//
//   CONTROL A (D-6's own, and §3.3's written text) — a diagram whose SOURCE references a remote
//     image, driven through the production path. It FIRED, and that firing was a **live §4 defect**,
//     not a passing control: `eae7b08`'s source pre-scan now degrades such a fence BEFORE the window
//     opens, so CONTROL A can no longer be a control at all. → SUCCEEDED BY **TIER 1**, which keeps
//     the property that mattered (the ENGINE fetches, from untouched author source, inside the
//     window) using the relative reference the guard permits.
//   CONTROL B (this file's instrument floor) — an injected `createElementNS` `<image href>` in the
//     live container. → SUCCEEDED BY **TIER 2**: the same seam and the same construction, with an
//     OFF-ORIGIN href, because off-origin is now what the claim disclaims.
//
// §3.3's Verify text names CONTROL A ("a diagram whose source references a remote image") and asks
// for "zero requests". Both were written before the guard and before `7a6dc63`. **They are STALE and
// superseded**; the INTENT — *the control fires under the same conditions the negative claim
// disclaims, in the same test, or the negative result is worth nothing* — is met by TIER 1 and
// TIER 2 together, on the sharpened claim. Nothing is relaxed: the observer is held to detecting a
// real window-phase fetch on the real engine-emitted mechanism.
//
// ── THREE INSTRUMENTS, THREE POINTS ON THE PIPELINE — and this file owns the WINDOW ───────
//
//   SOURCE-SCAN (pre-engine)   `diagramSourceGuard.browser.test.ts` — §4-remote references never
//     reach `render()`. It reads the wire too, but its subject is what the guard REFUSES.
//   WINDOW-SCOPED (this file)  what the engine does while the container is live and mid-render,
//     bracketed by the container's own lifetime. The only instrument that can see a request which
//     fires before any artifact exists — and if the render then throws, no artifact is EVER adopted,
//     so an artifact-scoped watch has nothing to be pointed at. One arm below is exactly that case.
//   ARTIFACT-SCOPED (post-adopt) `diagramStyleCss.browser.test.ts` — the sanitized string adopted
//     into the live document, and what THAT does. Structurally blind to this file's subject.
//
// The bracket is the measuring container's own lifetime in `document.body` — `DIAGRAM_MEASURE_CLASS`
// appended (D-6 step 1) to `container.remove()` in the enhancer's `finally` — read from a
// `MutationObserver` and applied to each Resource-Timing entry's `startTime`. Observer callbacks are
// microtasks, so both marks land at or after the mutation they describe: the bracket is a SUPERSET
// of the true window, the safe direction for a zero claim.
//
// ── ★ THE FIREFOX INERT-PARSE GOTCHA (`367d051`), load-bearing here ───────────────────────
//
// In Firefox, parsing `@import url(X)` — or any remote reference — into ANY inert document CONSUMES
// the load for X: nothing reaches the wire and a later fetch of X is never retried. A control routed
// through a sanitizer therefore reads NO-FETCH while the window is wide open, certifying a hole as
// clean. Both tiers are immune BY CONSTRUCTION, not by inspection: TIER 1's URL exists only inside
// markdown fence TEXT that the enhancer reads with `textContent` and hands to the engine as a string
// (`sanitizeSvg` runs on the engine's OUTPUT, after the fetch), and TIER 2's element never has a
// string form at all. Nothing in this file feeds a probe URL to a parser, inert or otherwise.
//
// ── LOOPBACK ONLY, INCLUDING THE OFF-ORIGIN FLOOR (AGENTS.md #1) ──────────────────────────
//
// No probe here contacts a non-loopback host, and TIER 2 is not an exception. The page is served
// from `http://localhost:PORT`, so `http://127.0.0.1:PORT` is a genuinely DIFFERENT ORIGIN answered
// by the very same local server: cross-origin by the same-origin rule, physically incapable of
// leaving the machine. TIER 2's floor is therefore a real off-origin request, observed by the real
// predicate, with nothing on the wire that any external host could see. See
// `helpers/diagramWindow.ts` for the construction.

import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import { hasRemoteReference } from '../../src/render/diagramEnhancer';
import { DIAGRAM_FIGURE_CLASS, DIAGRAM_STATE_ATTR } from '../../src/render/diagramView';
import {
  BENIGN_DOC,
  awaitFetch,
  drainMeasureContainers,
  injectLiveImageHref,
  isOffOrigin,
  networkedInWindow,
  networkedUrls,
  offOriginInWindow,
  offOriginProbeUrl,
  releaseHosts,
  renderAndBracket,
  resetBetweenReadings,
  warmEngine,
} from './helpers/diagramWindow';

// ── Fixtures: GUARD-PASSING source, and adversarial about it ───────────────────────────────

/**
 * TIER 1's fixture and the claim's load-bearing case. A sequence actor's `properties.icon`, which
 * `drawImage` hangs on a live `<image xlink:href>` mid-render (`sequenceDiagram-DBY2YBRQ.mjs:2192`)
 * — the one route that fetches AND renders, so the request goes out under a diagram that looks
 * entirely normal. With a RELATIVE reference it passes the guard by design (`7a6dc63`).
 */
function iconRelDoc(path: string): string {
  return (
    '# icon, relative reference\n\n```mermaid\nsequenceDiagram\n' +
    '  participant Alice\n  participant Bob\n' +
    `  properties Alice: {"icon": "${path}"}\n` +
    '  Alice->>Bob: hello\n```\n'
  );
}

/**
 * The flowchart `img:` route with a relative reference. `getTypeFromVertex` routes it to
 * `imageSquare`, whose first three statements construct an `Image`, assign `src`, and await
 * `decode()` — so it fetches and then THROWS on the loopback 404, degrading the fence. That
 * combination is what makes it the artifact-blind arm: the request is on the wire and no artifact is
 * ever adopted.
 */
function imgRelDoc(path: string): string {
  return (
    '# img, relative reference\n\n```mermaid\nflowchart TD\n' +
    `  A@{ img: "${path}", label: "probe", w: 40, h: 40 }\n` +
    '  A --> B[Beta]\n```\n'
  );
}

/**
 * ★ THE ADVERSARIAL CASE — an author actively trying to name a FOREIGN HOST through a spelling the
 * guard permits, which is what turns the claim from "a clean diagram is clean" into a real bound.
 *
 * A tab inside the scheme, written as `\u0009` per AGENTS.md rather than as a literal byte. The
 * guard's `\bhttps?:` arm does not match (the tab breaks the scheme) and its `//` arm does not match
 * (there are no slashes), so this reaches the engine. The WHATWG parser then strips the tab, leaving
 * `http:host.example/…` — a special scheme with NO authority — which resolves against the base as a
 * same-origin PATH: `host.example` is demoted to a path segment. `7a6dc63` recorded that as a
 * DERIVATION; the claim arm below re-measures it on the wire, in the window, on both engines.
 */
function tabObfuscatedDoc(path: string): string {
  return (
    '# tab-obfuscated scheme\n\n```mermaid\nflowchart TD\n' +
    `  A@{ img: "h\u0009ttp:host.example${path}", label: "probe", w: 40, h: 40 }\n` +
    '  A --> B[Beta]\n```\n'
  );
}

/** The warm-up's own traffic, captured once so the COLD LOAD arm can read it. */
let coldLoadUrls: string[] = [];

beforeAll(async () => {
  coldLoadUrls = await warmEngine();
}, 60_000);

beforeEach(() => {
  performance.clearResourceTimings();
});

afterEach(async () => {
  releaseHosts();
  await drainMeasureContainers();
});

describe("D-6's measurement window issues NO OFF-ORIGIN request (row 22)", () => {
  it('★ TIER 1 — the ENGINE fetches SAME-ORIGIN inside the window, from author source, and RENDERS', async () => {
    // The live control, and it fires inside what the claim PERMITS. Successor to CONTROL A: same
    // property (the engine fetches from untouched author source, mid-window), reached through the
    // relative reference the guard lets past instead of the remote one it now stops.
    const path = '/__peekover_probe__/d33-tier1/icon-rel.png';
    const expected = new URL(path, location.origin).href;
    const doc = iconRelDoc(path);

    // It is genuinely GUARD-PASSING — asserted, not asserted-in-a-comment. If the guard ever widens
    // to relative references this flips, and the flip is the news, not a broken test to silence.
    expect(
      hasRemoteReference(doc),
      'the fixture no longer passes §4’s source guard, so it never reaches the engine and TIER 1 ' +
        'is not exercising the window at all',
    ).toBe(false);

    const { shadow, window: w } = await renderAndBracket(doc);

    // The window genuinely opened and closed — an empty tail is not an empty instrument.
    expect(
      w.containers.length,
      'no measuring container was ever appended — there was no window to measure',
    ).toBeGreaterThan(0);
    expect(w.close, 'the measuring container was never removed').not.toBeNull();

    // ★ THE OBSERVER SAW A REAL WINDOW-PHASE FETCH ON THE REAL MECHANISM.
    expect(
      await awaitFetch(expected),
      'TIER 1 DID NOT FIRE: a relative `properties.icon` put nothing on the wire, so the observer ' +
        'is not proven able to see a window-phase fetch and every zero below is worth nothing ' +
        '(retro 2026-07-19 finding 1). If the engine genuinely stopped fetching this, that is a ' +
        'finding about the engine and this control needs a successor — see the header.',
    ).toContain(expected);
    expect(
      networkedInWindow(w),
      'the request fired but not inside the measurement-window bracket — the bracket is wrong',
    ).toContain(expected);

    // ★ And what it saw was SAME-ORIGIN: the fetch happened, and it stayed on our origin.
    expect(
      offOriginInWindow(w),
      'a guard-passing relative reference reached OFF-ORIGIN — the guard’s predicate has a hole, ' +
        'not merely a scope',
    ).toEqual([]);

    // ★ AND IT RENDERED. This is the nastier half of `eae7b08`'s ROUTE 2 signature reached with a
    // reference the guard permits: a normal-looking diagram paints while the request is already
    // out. Accepted (package-local in production), and asserted so the acceptance stays visible.
    expect(
      shadow.querySelector(`pre[${DIAGRAM_STATE_ATTR}]`)?.getAttribute(DIAGRAM_STATE_ATTR),
      'the fence did not reach `rendered` — TIER 1 is meant to be the fetch-AND-render case',
    ).toBe('rendered');
    expect(
      shadow.querySelectorAll(`figure.${DIAGRAM_FIGURE_CLASS} svg`),
      'no artifact was adopted, so this is no longer the fetch-while-rendering control',
    ).toHaveLength(1);
  }, 60_000);

  it('★ THE CLAIM — every guard-passing source, including adversarial ones, is ZERO OFF-ORIGIN', async () => {
    // Four guard-passing sources: benign, and the three the finding showed DO reach the engine. The
    // claim is read per source with the same window bracket and the same `/^https?:/i` buffer.
    const cases = [
      { name: 'benign', doc: BENIGN_DOC, fetches: false },
      {
        name: 'icon-rel',
        doc: iconRelDoc('/__peekover_probe__/d33-claim-icon/icon.png'),
        fetches: true,
      },
      {
        name: 'img-rel',
        doc: imgRelDoc('/__peekover_probe__/d33-claim-img/img.png'),
        fetches: true,
      },
      {
        name: 'img-dot-rel',
        doc: imgRelDoc('./d33-claim-dot.png'),
        fetches: true,
      },
      {
        name: 'tab-obfuscated',
        doc: tabObfuscatedDoc('/__peekover_probe__/d33-claim-tab/tab.png'),
        fetches: true,
      },
    ];

    let everFetched = 0;
    for (const c of cases) {
      // Each case must really be one the guard PASSES — otherwise it degrades before the window and
      // the zero below would be about the guard, not about the window.
      expect(
        hasRemoteReference(c.doc),
        `${c.name}: the fixture is caught by §4’s source guard, so it never reaches the engine and ` +
          'proves nothing about the window',
      ).toBe(false);

      performance.clearResourceTimings();
      const { window: w } = await renderAndBracket(c.doc);

      expect(w.containers.length, `${c.name}: no window was observed`).toBeGreaterThan(0);
      // ★ THE CLAIM ITSELF.
      expect(
        offOriginInWindow(w),
        `${c.name}: D-6’s measurement window put an OFF-ORIGIN request on the wire for source that ` +
          'PASSES §4’s guard — the guard’s predicate is holed, not merely scoped (AGENTS.md #1)',
      ).toEqual([]);
      // And the whole run, not just the window, for the same off-origin reading.
      expect(
        networkedUrls().filter(isOffOrigin),
        `${c.name}: something OFF-ORIGIN was fetched somewhere across import → render → sanitize → adopt`,
      ).toEqual([]);

      if (c.fetches) {
        // Non-vacuity, per case: these sources really do put something on the wire in the window,
        // so "zero off-origin" is a reading of live traffic rather than of silence.
        const inWindow = networkedInWindow(w);
        expect(
          inWindow.length,
          `${c.name}: nothing at all was observed in the window, so the off-origin zero above is ` +
            'not a measurement of anything — the fixture has stopped exercising the engine',
        ).toBeGreaterThan(0);
        everFetched += 1;
      }

      await resetBetweenReadings();
    }
    expect(everFetched, 'no case in the claim table fetched anything').toBeGreaterThan(0);
  }, 120_000);

  it('★ THE SEVERITY BOUND, MEASURED — the tab-obfuscated host lands as a same-origin PATH', async () => {
    // `7a6dc63` recorded "guard-passing ⇒ same-origin" as a DERIVATION and said so deliberately, so
    // that it would be re-derived rather than inherited. This arm converts the sharpest half of it
    // into an observation: an author naming `host.example` through a spelling the guard permits does
    // not reach `host.example` — the WHATWG parser demotes it to a path segment on OUR origin.
    const path = '/__peekover_probe__/d33-bound/tab.png';
    const doc = tabObfuscatedDoc(path);
    expect(hasRemoteReference(doc), 'the fixture is now caught by the guard').toBe(false);

    const { window: w } = await renderAndBracket(doc);
    const expected = new URL(`http:host.example${path}`, document.baseURI).href;

    expect(
      await awaitFetch(expected),
      'the tab-obfuscated reference put nothing on the wire, so this arm is not measuring the ' +
        'bound — re-derive it before trusting the claim',
    ).toContain(expected);
    expect(networkedInWindow(w), 'it fired outside the window bracket').toContain(expected);
    // The whole point: the foreign host is a PATH SEGMENT on our own origin.
    expect(expected).toBe(`${location.origin}/host.example${path}`);
    expect(offOriginInWindow(w), 'the obfuscated form escaped our origin').toEqual([]);
  }, 60_000);

  it('★ WINDOW-scoped, not ARTIFACT-scoped: the request is out while NOTHING is ever adopted', async () => {
    // The property that makes this file irreducible to `diagramStyleCss`'s adopt-side watch.
    // `imageSquare` awaits `img.decode()`, which REJECTS on the loopback 404, so the render throws
    // and §3.8 degrades the fence — no artifact is ever adopted. An artifact-scoped watch has
    // nothing to point at, and yet the request is already on the wire, inside the window.
    const path = '/__peekover_probe__/d33-artifactblind/never-adopted.png';
    const expected = new URL(path, location.origin).href;
    const doc = imgRelDoc(path);
    expect(hasRemoteReference(doc), 'the fixture is caught by the guard before the window').toBe(
      false,
    );

    const { shadow, window: w } = await renderAndBracket(doc);

    expect(await awaitFetch(expected), 'the relative reference never reached the wire').toContain(
      expected,
    );
    expect(networkedInWindow(w), 'the request did not land inside the window').toContain(expected);
    expect(offOriginInWindow(w), 'it left our origin').toEqual([]);
    expect(
      shadow.querySelectorAll(`figure.${DIAGRAM_FIGURE_CLASS} svg`).length,
      'an artifact WAS adopted — this arm no longer demonstrates the artifact-blind case',
    ).toBe(0);
    expect(
      shadow.querySelector(`[${DIAGRAM_STATE_ATTR}="failed"]`),
      'the fence did not degrade, so the render did not fail and nothing proves the window ' +
        'preceded adoption',
    ).not.toBeNull();
  }, 60_000);

  it('★ TIER 2 — the FLOOR: an OFF-ORIGIN request in this same window IS observed', async () => {
    // Why this arm exists: TIER 1 proves the observer sees SAME-ORIGIN traffic. It does not prove
    // the observer would see traffic that LEFT our origin — and that is exactly what the claim
    // disclaims. Without this arm, "zero off-origin" is unfalsifiable: an observer blind to
    // off-origin requests would report the same zero over a wide-open window.
    //
    // The off-origin request cannot come from author source: the guard degrades any §4-remote
    // reference BEFORE the window opens (that is `eae7b08`'s whole job), so the floor must come from
    // a seam the guard does not sit on. CONTROL B's seam is that seam — an `<image href>` built
    // node-by-node with `createElementNS` and appended INTO the live measuring container mid-render,
    // no string parsed anywhere, so the Firefox inert-parse gotcha cannot swallow it.
    //
    // LOOPBACK: `127.0.0.1:PORT` against a `localhost:PORT` page is cross-origin by the same-origin
    // rule and served by the same local process. A real off-origin request; nothing leaves the box.
    const offOrigin = offOriginProbeUrl('/__peekover_probe__/d33-tier2/off-origin.png');
    expect(isOffOrigin(offOrigin), 'the floor probe is not actually off-origin').toBe(true);

    const injected: HTMLElement[] = [];
    const { shadow, window: w } = await renderAndBracket(BENIGN_DOC, (container) => {
      if (injected.length > 0) return;
      injectLiveImageHref(container, offOrigin);
      injected.push(container);
    });

    expect(injected.length, 'the injection never ran — no container was observed').toBe(1);
    expect(
      await awaitFetch(offOrigin),
      'TIER 2 DID NOT FIRE: an off-origin reference placed in the LIVE measuring container put ' +
        'nothing on the wire, so this instrument cannot detect an off-origin window-phase request ' +
        'at all and THE CLAIM ABOVE IS UNFALSIFIABLE (retro 2026-07-19 finding 1)',
    ).toContain(offOrigin);
    // ★ And the claim's OWN reading — the exact list `offOriginInWindow` returns — catches it.
    expect(
      offOriginInWindow(w),
      'the off-origin request fired but the claim’s own predicate did not see it inside the ' +
        'window — the claim is reading the wrong list',
    ).toContain(offOrigin);

    // And the benign fence still RENDERED through all of that: nothing here over-degrades.
    expect(
      shadow.querySelector(`figure.${DIAGRAM_FIGURE_CLASS} svg`),
      'the benign diagram did not render — the window under measurement is not a working one',
    ).not.toBeNull();
  }, 60_000);

  it('COLD LOAD — engine load fetched only our own package: ZERO off-origin', async () => {
    // The import phase, in the honest harness-limited form the helper's `warmEngine` states. In the
    // product the chunk is an extension-scheme URL the predicate excludes; here the dev server
    // serves it over http, so what is assertable is that nothing OFF-ORIGIN was touched. (This is
    // the load's TRAFFIC; engine-load FAILURE and its degradation are task 6.1's, not this file's.)
    expect(
      coldLoadUrls.length,
      'the warm-up recorded no module traffic at all — the engine was already resident, so this ' +
        'arm is not reading a cold load',
    ).toBeGreaterThan(0);
    expect(
      coldLoadUrls.filter(isOffOrigin),
      'loading the diagram engine fetched something OFF-ORIGIN — a CDN font, icon pack or ' +
        'stylesheet, which is an AGENTS.md #1 breach at import time',
    ).toEqual([]);
  });
});

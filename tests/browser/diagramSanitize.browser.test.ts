// The REAL-ENGINE proof that `sanitizeSvg`'s `data:` denial is ALLOW-LIST-DRIVEN and
// HOOK-INDEPENDENT (007 task 2.2, as AMENDED — decisions.md `b19c068`). This is also the
// in-browser sanitize check decisions.md 2026-07-14 scheduled for the golden/e2e milestone:
// jsdom's parser diverges from real engines on mXSS (SVG/MathML foreign content, template
// reparsing), so a profile proven inert under jsdom is not proven inert in Chromium/Firefox.
// The unit mirror in `src/render/sanitize.test.ts` says so in its own words; THIS file is
// the authoritative one, and it runs in BOTH engines (vitest.config.ts `browser` project,
// instances chromium + firefox).
//
// ★ THE FINDING THIS FILE EXISTS TO RECORD — there is NO "remove the hook → `data:` reds"
// discriminator for this profile, and that absence is a RESULT, not a missing check.
// §2.2 originally specified exactly that discriminator. It is unsatisfiable, provably:
// `sanitize.ts:131-135`'s global `uponSanitizeAttribute` hook can only be OBSERVABLE where
// DOMPurify would otherwise ACCEPT the attribute, and all five `_isValidAttribute`
// acceptance branches are closed under `SANITIZE_SVG_CONFIG` (`b19c068` verified this
// against dompurify 3.4.12 across 686/686/726 Chromium/Firefox/jsdom cases with ZERO
// hook-vs-no-hook diffs, under a firing control). So the hook is a proven NO-OP here and
// removing it would red nothing — a red-first on it would be theatre.
//
// What IS proven here, per §2.2-as-amended:
//   (c) THE SECURITY PROPERTY — the profile's `data:` denial is allow-list-driven: a fresh
//       DOMPurify instance carrying NO hooks is equally clean on the same payload. That is
//       a STRONGER statement than hook-protection, and it has teeth: it reds the moment
//       `SVG_ALLOWED_TAGS` is widened to a `DATA_URI_TAGS` member (the revert-and-fail).
//   (a) THE INHERITANCE PIN — the singleton `sanitizeSvg` calls IS the one the hook is
//       registered on (plan §4-3's second half: true regardless of how `dompurify`
//       resolved at 1.1). Asserted with a TEMPORARY observer hook, removed afterwards.
//       This is a construction pin, NOT the security discriminator and NOT a
//       revert-and-fail — the file labels it so a future reader cannot mistake it for one.
//
// Zero network: every payload value is a `data:` URI or a `#fragment`. Nothing here can
// resolve off-document even if it survived, and the corpus is materialized inside an inert
// `<template>` (never a "detached" div, which DOES fetch — `mount.ts:119-129`'s lesson).

import { describe, it, expect } from 'vitest';
import DOMPurify from 'dompurify';
import { sanitizeSvg, SANITIZE_SVG_CONFIG } from '../../src/render/sanitize';

/**
 * ONE payload carrying all three cases, so they are judged against the same markup:
 *  - `<use xlink:href="data:…">`  the ref attribute the URI regexp gates — item 1.
 *  - `<use xlink:href="#dot">`    the NON-VACUOUS control — it must SURVIVE (item 4), or
 *                                 an empty `data:` sweep would only mean "everything was
 *                                 stripped" (retro finding 1).
 *  - `<image href="data:…">`      a `DATA_URI_TAGS` member, denied BY ABSENCE from
 *                                 `SVG_ALLOWED_TAGS`. This is the revert-and-fail target:
 *                                 allow-list `image` and DOMPurify's own DATA_URI_TAGS
 *                                 bypass accepts the `data:` value, so the no-hook
 *                                 instance leaks while the hooked singleton strips.
 */
const PAYLOAD =
  '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">' +
  '<defs><symbol id="dot"><circle cx="3" cy="3" r="3" /></symbol></defs>' +
  '<use xlink:href="data:text/html,x" x="10" y="10" />' +
  '<use xlink:href="#dot" x="20" y="20" />' +
  '<image href="data:text/html,y" width="1" height="1" />' +
  '</svg>';

// ── Assertions NAME THE SURVIVING VALUE (retro finding 5) ─────────────────────
// A bare `expect(out).not.toContain('data:')` reds as "expected false to be true" and
// tells the next reader nothing about WHICH attribute leaked on WHICH element. These
// helpers collect descriptions and compare against `[]`, so the failure prints the
// defect's own signature in its own units — `<image href="data:text/html,y">`.

/** Materialize markup inertly: a `<template>` has no browsing context, so nothing loads. */
function inert(markup: string): DocumentFragment {
  const tpl = document.createElement('template');
  tpl.innerHTML = markup;
  return tpl.content;
}

function attributesOf(out: string): { el: Element; attr: Attr }[] {
  return [...inert(out).querySelectorAll('*')].flatMap((el) =>
    [...el.attributes].map((attr) => ({ el, attr })),
  );
}

/** `<tag attr="value">` — enough for a failure message to be actionable on its own. */
function describeAttr({ el, attr }: { el: Element; attr: Attr }): string {
  return `<${el.localName} ${attr.name}="${attr.value}">`;
}

/**
 * Every surviving attribute whose value resolves to the `data:` scheme, described.
 * Control/space characters are stripped throughout before the check, exactly as
 * `sanitize.ts`'s own `isDataUri` does — browsers strip interior tab/LF/CR while
 * resolving a scheme, so `da<TAB>ta:` must count as a leak here too.
 */
function survivingDataUris(out: string): string[] {
  return attributesOf(out)
    .filter(({ attr }) =>
      // eslint-disable-next-line no-control-regex
      attr.value.replace(/[\u0000-\u0020]+/g, '').slice(0, 5).toLowerCase() === 'data:',
    )
    .map(describeAttr);
}

/** Every surviving attribute with this exact value — the `#fragment` survival check. */
function survivingValues(out: string, value: string): string[] {
  return attributesOf(out).filter(({ attr }) => attr.value === value).map(describeAttr);
}

describe('sanitizeSvg in a real browser — the data: denial is allow-list-driven (007 §2.2)', () => {
  it('THE INSTRUMENT FIRES: the raw payload carries two data: URIs the sweep reports', () => {
    // The control for every empty-sweep assertion below (retro finding 1). If this reads
    // empty, `survivingDataUris` is broken and the three clean results mean nothing —
    // they would read clean over a payload that never contained a `data:` at all.
    expect(survivingDataUris(PAYLOAD)).toEqual([
      '<use xlink:href="data:text/html,x">',
      '<image href="data:text/html,y">',
    ]);
  });

  it('item 1 — a data: URI on xlink:href does NOT survive sanitizeSvg', () => {
    expect(survivingDataUris(sanitizeSvg(PAYLOAD))).toEqual([]);
  });

  it('item 2 — a fresh NO-HOOK DOMPurify is ALSO clean: hook-independence is the property', () => {
    // `DOMPurify(window)` runs the factory again, yielding an instance with its own empty
    // hooks map. It is NOT the module singleton `sanitize.ts` registered the global
    // `uponSanitizeAttribute` on — asserted, because if it were, this whole test would be
    // re-asserting item 1 through a second name.
    const noHook = DOMPurify(window);
    expect(noHook, 'the "fresh" instance IS the singleton — this test proves nothing')
      .not.toBe(DOMPurify);
    // And it genuinely carries no `uponSanitizeAttribute`: `removeHook` with no function
    // pops the last one and returns it, so `undefined` means the stack was empty. This
    // touches only the fresh instance — the production singleton is never popped.
    expect(
      noHook.removeHook('uponSanitizeAttribute'),
      'the fresh instance carries an uponSanitizeAttribute hook — it is not hook-free',
    ).toBeUndefined();

    // THE PROPERTY: with no hook anywhere in the pipeline, the profile alone denies data:.
    const out = noHook.sanitize(PAYLOAD, SANITIZE_SVG_CONFIG) as string;
    expect(
      survivingDataUris(out),
      'a data: URI survived the profile WITHOUT the hook — the allow-list is not the denial',
    ).toEqual([]);
  });

  it('item 4 — the #fragment control SURVIVES, so the sweep is not passing on an empty tree', () => {
    const out = sanitizeSvg(PAYLOAD);
    expect(
      survivingValues(out, '#dot'),
      'the internal #dot reference was stripped too — the clean data: sweep is vacuous',
    ).not.toEqual([]);
    // The same-document reference survives on the SAME attribute the data: case died on.
    expect(out).toContain('xlink:href="#dot"');
    // And the no-hook instance is not stripping everything either — the property in item 2
    // is "clean", not "empty".
    const noHook = DOMPurify(window);
    expect(survivingValues(noHook.sanitize(PAYLOAD, SANITIZE_SVG_CONFIG) as string, '#dot'))
      .not.toEqual([]);
  });

  it('item 5 — INHERITANCE-BY-CONSTRUCTION PIN: sanitizeSvg routes through the module singleton', () => {
    // ★ THIS IS NOT THE SECURITY DISCRIMINATOR AND NOT A REVERT-AND-FAIL. It pins plan
    // §4-3's second half — the hook `sanitize.ts` registers is on the instance
    // `sanitizeSvg` calls, regardless of how `dompurify` resolved at task 1.1 (a second
    // bundled copy would show up here as an observer that never fires). The PRODUCTION
    // hook's own effect is separately proven redundant on this profile (`b19c068`), which
    // is why this is an observer and not a removal.
    const seen: string[] = [];
    const observer = (_node: Element, data: { attrName: string }): void => {
      seen.push(data.attrName);
    };
    DOMPurify.addHook('uponSanitizeAttribute', observer);
    let out: string;
    try {
      out = sanitizeSvg(PAYLOAD);
    } finally {
      // Hygiene: remove OUR observer by identity, never a bare pop — a bare pop is only
      // safe by accident of ordering, and popping the production hook would silently
      // disarm `sanitize()`'s document-profile deny for every later test in this window.
      const removed = DOMPurify.removeHook('uponSanitizeAttribute', observer);
      expect(removed, 'the observer was not removed — later tests run with it attached')
        .toBe(observer);
    }
    expect(
      seen,
      'the observer never fired — sanitizeSvg does not route through the imported DOMPurify singleton',
    ).not.toEqual([]);
    expect(seen, 'the gated reference attribute was never offered to the hook').toContain(
      'xlink:href',
    );
    // The pin must not have changed the outcome: an observer that sets nothing is inert.
    expect(survivingDataUris(out)).toEqual([]);
  });
});

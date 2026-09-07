// @vitest-environment jsdom
//
// The sanitize stage is security-critical, so its tests run against a real DOM
// (jsdom) — the environment DOMPurify itself is validated against — rather than a
// partial shim. Two halves: every malicious fixture must be NEUTRALIZED, and safe
// markdown-generated HTML must be PRESERVED (proving we don't over-strip → never a
// blank page).
//
// The SVG profile (007 D-1) adds a third suite in the same two halves, plus a
// SOURCE-TEXT PIN on the document profile's three consts. jsdom is the stated limit
// here (decisions.md 2026-07-14): a payload inert under jsdom is not proof it is inert
// in Chrome/Firefox, so the SVG profile's real-engine check is task 2.2's, not this
// file's. Every claim below is a jsdom claim.
//
// The MATH profile (task 2.1-R · D-5-R) adds a fourth suite, same two halves, run
// against REAL installed `temml` output rather than a hand-authored fixture — the tag
// and attribute enumeration IS the survey, not a copy of one performed elsewhere.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import DOMPurify from 'dompurify';
import temml from 'temml';
import {
  sanitize,
  ALLOWED_TAGS,
  ALLOWED_ATTR,
  ALLOWED_URI_REGEXP,
  sanitizeSvg,
  SVG_ALLOWED_TAGS,
  SVG_ALLOWED_ATTR,
  SVG_ALLOWED_URI_REGEXP,
  SVG_REFERENCE_ATTR,
  SVG_URI_SAFE_ATTR,
  SANITIZE_SVG_CONFIG,
  cleanSvgCss,
  sanitizeMath,
  MATH_ALLOWED_TAGS,
  MATH_ALLOWED_ATTR,
  SANITIZE_MATH_CONFIG,
  hasDeniedMathStyleToken,
} from './sanitize';
import { parse } from './parse';
import { MALICIOUS_CASES } from '../../tests/fixtures/malicious-html';

describe('sanitize — strict DOMPurify profile', () => {
  describe('the allow-list is the reviewed data (guards against silent drift)', () => {
    it('exposes the exact ALLOWED_TAGS set', () => {
      expect([...ALLOWED_TAGS]).toEqual([
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'br', 'hr', 'blockquote', 'pre',
        'em', 'strong', 'del', 's', 'code', 'sup', 'sub',
        'ul', 'ol', 'li',
        'input',
        'a', 'img',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
      ]);
    });

    it('exposes the exact ALLOWED_ATTR set (no id/align — inert & clobbering surface)', () => {
      expect([...ALLOWED_ATTR]).toEqual([
        'href', 'src', 'alt', 'title', 'class',
        'type', 'checked', 'disabled',
        'colspan', 'rowspan',
        'data-fence-meta',
      ]);
    });

    it('does not allow id (DOM-clobbering surface, re-allowed with M2 anchors)', () => {
      expect([...ALLOWED_ATTR]).not.toContain('id');
    });

    it('URL scheme policy: allows http/https/mailto/relative, denies javascript:/data:', () => {
      expect(ALLOWED_URI_REGEXP.test('https://example.com')).toBe(true);
      expect(ALLOWED_URI_REGEXP.test('http://example.com')).toBe(true);
      expect(ALLOWED_URI_REGEXP.test('mailto:a@b.com')).toBe(true);
      expect(ALLOWED_URI_REGEXP.test('/relative/path')).toBe(true);
      expect(ALLOWED_URI_REGEXP.test('page.html')).toBe(true);
      expect(ALLOWED_URI_REGEXP.test('#anchor')).toBe(true);
      expect(ALLOWED_URI_REGEXP.test('javascript:alert(1)')).toBe(false);
      expect(ALLOWED_URI_REGEXP.test('data:text/html,x')).toBe(false);
    });
  });

  describe('malicious fixtures are neutralized', () => {
    it.each(MALICIOUS_CASES)('neutralizes: $name', (testCase) => {
      const out = sanitize(testCase.html).toLowerCase();
      for (const bad of testCase.forbidden) {
        expect(out).not.toContain(bad.toLowerCase());
      }
      // Structural belt-and-suspenders: no live vectors survive, ever.
      expect(out).not.toContain('<script');
      expect(out).not.toContain('<iframe');
      expect(out).not.toContain('<object');
      expect(out).not.toContain('<embed');
      expect(out).not.toContain('<style');
      expect(out).not.toContain('<svg');
      expect(out).not.toMatch(/\son\w+=/); // no on* handler attributes
      expect(out).not.toContain('javascript:');
    });

    it('preserves benign text of neutralized payloads (never a blank page)', () => {
      for (const testCase of MALICIOUS_CASES) {
        const out = sanitize(testCase.html);
        for (const text of testCase.survives ?? []) {
          expect(out).toContain(text);
        }
      }
    });
  });

  describe('safe markdown-generated HTML is preserved (we do not over-strip)', () => {
    it('keeps an http(s) link intact', () => {
      const out = sanitize(parse('[t](https://example.com)'));
      expect(out).toContain('<a href="https://example.com">t</a>');
    });

    it('keeps a relative link', () => {
      const out = sanitize(parse('[t](./other.md)'));
      expect(out).toContain('href="./other.md"');
    });

    it('keeps a full GFM table with thead/tbody/th/td', () => {
      const out = sanitize(parse('| a | b |\n|---|---|\n| 1 | 2 |'));
      expect(out).toContain('<table>');
      expect(out).toContain('<thead>');
      expect(out).toContain('<tbody>');
      expect(out).toContain('<th>a</th>');
      expect(out).toContain('<td>1</td>');
    });

    it('keeps a disabled task-list checkbox', () => {
      const out = sanitize(parse('- [ ] todo'));
      expect(out).toContain('type="checkbox"');
      expect(out).toContain('disabled');
      expect(out).toContain('contains-task-list');
    });

    it('keeps a fenced code block with its language class', () => {
      const out = sanitize(parse('```js\nconst x = 1;\n```'));
      expect(out).toContain('<pre><code class="language-js">');
      expect(out).toContain('const x = 1;');
    });

    it('keeps an http image (src/alt survive)', () => {
      const out = sanitize(parse('![a](https://example.com/i.png)'));
      expect(out).toContain('<img');
      expect(out).toContain('src="https://example.com/i.png"');
      expect(out).toContain('alt="a"');
    });

    it('keeps strikethrough, sup and sub', () => {
      const out = sanitize(parse('~~gone~~ H<sub>2</sub>O x<sup>2</sup>'));
      expect(out).toContain('<s>gone</s>');
      expect(out).toContain('<sub>2</sub>');
      expect(out).toContain('<sup>2</sup>');
    });

    it('drops table alignment in M1 but keeps the cell (degrade, not delete)', () => {
      // markdown-it emits alignment as inline `style` (stripped), and `align` is
      // no longer allow-listed — so no alignment survives in M1. The table must
      // still render: cell text + structure remain intact. M2 restores alignment
      // via a class (see tasks.md).
      const out = sanitize(parse('| L |\n|:--|\n| x |'));
      expect(out).not.toContain('style=');
      expect(out).not.toContain('align=');
      expect(out).not.toContain('text-align');
      expect(out).toContain('<table>');
      expect(out).toContain('<td>x</td>');
    });
  });
});

// ── THE SVG PROFILE (007 task 2.1 · D-1) ─────────────────────────────────────
//
// Assertions here NAME THE SURVIVING NODE (retro finding 5). A hostile-corpus test
// that asserts a bare boolean tells a future reader that something is wrong but not
// what leaked, and it reds identically whether one attribute or the whole payload
// survived. So every check below collects DESCRIPTIONS of the offending nodes and
// compares against `[]` — the failure prints `<foreignObject><script>…</script>`,
// which is the defect's own signature in its own units.

/** Materialize markup inertly — `mount.ts:131-133`'s shape: a `<template>` has no
 *  browsing context, so nothing in it loads, and the corpus carries remote refs. */
function inert(markup: string): DocumentFragment {
  const tpl = document.createElement('template');
  tpl.innerHTML = markup;
  return tpl.content;
}

function elementsOf(markup: string): Element[] {
  return [...inert(markup).querySelectorAll('*')];
}

/** `<tag attr="value" …>` — enough for a failure message to be actionable. */
function describeNode(el: Element): string {
  const attrs = [...el.attributes].map((a) => ` ${a.name}="${a.value}"`).join('');
  return `<${el.localName}${attrs}>`;
}

/** Every surviving element with this local name, described. Empty is the pass. */
function survivingElements(out: string, localName: string): string[] {
  return elementsOf(out)
    .filter((el) => el.localName.toLowerCase() === localName.toLowerCase())
    .map(describeNode);
}

function attributesOf(out: string): { el: Element; attr: Attr }[] {
  return elementsOf(out).flatMap((el) => [...el.attributes].map((attr) => ({ el, attr })));
}

function describeAttr({ el, attr }: { el: Element; attr: Attr }): string {
  return `<${el.localName} ${attr.name}="${attr.value}">`;
}

/** Every surviving attribute whose NAME matches, described with its element and value. */
function survivingAttrs(out: string, matches: (name: string) => boolean): string[] {
  return attributesOf(out).filter(({ attr }) => matches(attr.name)).map(describeAttr);
}

/** Every surviving attribute whose VALUE matches — the URL-scheme cases. */
function survivingAttrValues(out: string, matches: (value: string) => boolean): string[] {
  return attributesOf(out).filter(({ attr }) => matches(attr.value)).map(describeAttr);
}

/**
 * Every surviving attribute value that is a REMOTE reference, by the same
 * `/^https?:/i` predicate the zero-network suites use.
 *
 * `xmlns` / `xmlns:xlink` are excluded BY NAME, and the exclusion is the honest part:
 * their values are namespace IDENTIFIERS that merely look like URLs
 * (`http://www.w3.org/2000/svg`) and are never resolved or fetched by any engine.
 * Excluding them by name keeps this a sweep over every OTHER attribute, rather than
 * an enumeration of the attributes we remembered to check.
 */
function survivingRemoteRefs(out: string): string[] {
  return attributesOf(out)
    .filter(({ attr }) => !attr.name.startsWith('xmlns') && /^https?:/i.test(attr.value))
    .map(describeAttr);
}

/** The CSS text of any surviving `<style>`, so an `@import` failure prints the rule. */
function survivingStyleText(out: string): string[] {
  return elementsOf(out)
    .filter((el) => el.localName.toLowerCase() === 'style')
    .map((el) => `<style>${el.textContent ?? ''}</style>`);
}

/**
 * Any surviving `<style>` whose CSS names a resource off this document. The attribute
 * sweep above cannot reach this: under option B the element survives and its references
 * live in TEXT. Deliberately broader than `url(`, so a spelling this suite never thought
 * of (a bare-string `@import`, an `image-set()` string) still trips it.
 */
function survivingRemoteCss(out: string): string[] {
  return survivingStyleText(out).filter((css) => /(?:https?:|\/\/[a-z0-9]|data:)/i.test(css));
}

describe('sanitizeSvg — the SVG profile (D-1)', () => {
  describe('the allow-list is the reviewed data (guards against silent drift)', () => {
    it('exposes the exact SVG_ALLOWED_TAGS set', () => {
      expect([...SVG_ALLOWED_TAGS]).toEqual([
        'svg', 'g', 'defs', 'symbol', 'use', 'clipPath',
        'path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon',
        'text', 'tspan',
        'marker', 'linearGradient', 'stop',
        'title', 'desc',
        'style',
      ]);
    });

    it('denies the dangerous elements BY ABSENCE, not by a FORBID list', () => {
      // The mechanism is the point: there is no FORBID list to read, so the only
      // way these can come back is by being ADDED here, in a reviewed diff.
      //
      // `style` is NO LONGER in this list: option B (decisions.md `0de27f3`) admits it,
      // because 100% of a flowchart's paint is CSS and denying it renders black
      // silhouettes. It is the ONE element not governed by absence alone — `cleanSvgCss`
      // is the procedural filter that pays for it, and the `@import` case below is where
      // that filter is asserted rather than the allow-list.
      for (const denied of ['foreignObject', 'script', 'a', 'image', 'switch', 'filter']) {
        expect([...SVG_ALLOWED_TAGS], `${denied} must stay denied by absence`)
          .not.toContain(denied);
      }
      expect(SANITIZE_SVG_CONFIG).not.toHaveProperty('FORBID_TAGS');
      expect(SANITIZE_SVG_CONFIG).not.toHaveProperty('FORBID_ATTR');
    });

    it('denies style/on*/target attributes by absence, and allows id for fragment refs', () => {
      expect([...SVG_ALLOWED_ATTR]).not.toContain('style');
      expect([...SVG_ALLOWED_ATTR]).not.toContain('target');
      expect([...SVG_ALLOWED_ATTR].filter((a) => a.startsWith('on'))).toEqual([]);
      // `id` diverges from the document profile deliberately: `url(#arrowhead)` and
      // `xlink:href="#id"` are the only references the SVG URI policy permits, and
      // they need ids.
      expect([...SVG_ALLOWED_ATTR]).toContain('id');
    });

    it('URL policy admits no scheme at all — stricter than the document profile', () => {
      // Same-document references and inert values: every one has a producer.
      for (const allowed of [
        '#arrowhead', '#16171F', 'url(#fade)', 'url(#arrowhead)',
        'rgb(22, 23, 31)', 'rgba(0,0,0,.5)', 'none', 'currentColor', 'auto',
      ]) {
        expect(SVG_ALLOWED_URI_REGEXP.test(allowed), `${allowed} must be allowed`).toBe(true);
      }
      // Nothing that names a resource off this document.
      for (const denied of [
        'https://example.com', 'http://example.com', 'mailto:a@b.com',
        '/relative/path', 'page.svg', 'javascript:alert(1)', 'data:image/svg+xml,x',
        'url(http://evil.example/x#g)', 'url(//evil.example/x)',
      ]) {
        expect(SVG_ALLOWED_URI_REGEXP.test(denied), `${denied} must be denied`).toBe(false);
      }
      // The document profile permits schemes and relative paths this one denies —
      // the two are not variations of one policy, and this is the proof.
      expect(ALLOWED_URI_REGEXP.test('https://example.com')).toBe(true);
      expect(ALLOWED_URI_REGEXP.test('page.svg')).toBe(true);
    });

    it('gates exactly the reference-bearing attributes, and declares the rest URI-safe', () => {
      // DOMPurify applies ALLOWED_URI_REGEXP to every attribute NOT declared
      // URI-safe, so this split is what keeps the regexp off the coordinates.
      expect([...SVG_REFERENCE_ATTR]).toEqual([
        'href', 'xlink:href',
        'fill', 'stroke',
        'clip-path', 'marker-start', 'marker-mid', 'marker-end',
      ]);
      // Derived, so the two lists cannot drift apart.
      expect([...SVG_URI_SAFE_ATTR, ...SVG_REFERENCE_ATTR].sort())
        .toEqual([...SVG_ALLOWED_ATTR].sort());
      for (const gated of SVG_REFERENCE_ATTR) {
        expect(SVG_URI_SAFE_ATTR, `${gated} must stay gated`).not.toContain(gated);
      }
      expect(SANITIZE_SVG_CONFIG?.ADD_URI_SAFE_ATTR).toEqual([...SVG_URI_SAFE_ATTR]);
    });

    it('ALLOW_ARIA_ATTR is the one deliberate config divergence from the document profile', () => {
      expect(SANITIZE_SVG_CONFIG?.ALLOW_ARIA_ATTR).toBe(true);
      expect(SANITIZE_SVG_CONFIG?.ALLOW_DATA_ATTR).toBe(false);
      expect(SANITIZE_SVG_CONFIG?.ALLOW_UNKNOWN_PROTOCOLS).toBe(false);
      expect(SANITIZE_SVG_CONFIG?.SAFE_FOR_XML).toBe(true);
      expect(SANITIZE_SVG_CONFIG?.RETURN_DOM).toBe(false);
    });
  });

  // Hand-built, not engine-generated: the corpus must contain payloads the engine
  // would never emit, because the profile's job is what happens when it does.
  describe('the hostile corpus is neutralized', () => {
    it('drops <foreignObject> and the arbitrary HTML it re-admits', () => {
      const out = sanitizeSvg(
        '<svg xmlns="http://www.w3.org/2000/svg"><foreignObject width="100" height="100">' +
          '<body xmlns="http://www.w3.org/1999/xhtml"><img src="x" onerror="alert(1)"></body>' +
          '</foreignObject></svg>',
      );
      expect(survivingElements(out, 'foreignObject')).toEqual([]);
      expect(survivingElements(out, 'body')).toEqual([]);
      expect(survivingElements(out, 'img')).toEqual([]);
    });

    it('drops an external <use href> reference', () => {
      const out = sanitizeSvg(
        '<svg xmlns="http://www.w3.org/2000/svg">' +
          '<use href="http://evil.example/payload.svg#x" /></svg>',
      );
      // The ELEMENT survives (it is allow-listed); the external reference must not.
      expect(survivingAttrValues(out, (v) => v.includes('evil.example'))).toEqual([]);
    });

    it('drops an external <image href> reference', () => {
      const out = sanitizeSvg(
        '<svg xmlns="http://www.w3.org/2000/svg">' +
          '<image href="http://evil.example/tracker.png" width="1" height="1" /></svg>',
      );
      expect(survivingElements(out, 'image')).toEqual([]);
      expect(survivingAttrValues(out, (v) => v.includes('evil.example'))).toEqual([]);
    });

    it('drops @import in <style> — the ELEMENT now stays, so the RULE must go', () => {
      // RE-AIMED for option B (decisions.md `0de27f3`). This case used to pass for a
      // reason that no longer holds — the element was denied, so the rule went with it,
      // and the assertion never exercised any CSS handling at all. Now the element
      // SURVIVES and `cleanSvgCss` is the only thing standing between the artifact and
      // that `@import`, which is what makes this a real assertion rather than a
      // restatement of the allow-list.
      const out = sanitizeSvg(
        '<svg xmlns="http://www.w3.org/2000/svg"><style>' +
          '@import url("http://evil.example/x.css"); .n { fill: red }' +
          '</style><g class="n"><rect width="10" height="10" /></g></svg>',
      );
      expect(survivingStyleText(out), 'the <style> element did not survive — option B is not in effect')
        .not.toEqual([]);
      expect(out).not.toContain('@import');
      expect(out).not.toContain('evil.example');
      // …and the rest of the stylesheet is still there: the rule went, not the sheet.
      expect(survivingStyleText(out)[0]).toContain('.n { fill: red }');
    });

    it('drops on* event handlers', () => {
      const out = sanitizeSvg(
        '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)">' +
          '<rect width="10" height="10" onclick="alert(2)" /></svg>',
      );
      expect(survivingAttrs(out, (n) => /^on/i.test(n))).toEqual([]);
    });

    it('drops a javascript: href', () => {
      const out = sanitizeSvg(
        '<svg xmlns="http://www.w3.org/2000/svg">' +
          '<use href="javascript:alert(1)" /></svg>',
      );
      expect(survivingAttrValues(out, (v) => /javascript:/i.test(v))).toEqual([]);
    });

    it('drops an external xlink:href', () => {
      const out = sanitizeSvg(
        '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">' +
          '<use xlink:href="http://evil.example/payload.svg#x" /></svg>',
      );
      expect(survivingAttrValues(out, (v) => v.includes('evil.example'))).toEqual([]);
    });

    it('drops an external url() in a paint or clip reference', () => {
      // Not in §2.1's named corpus, and it is the case the URI policy's shape was
      // decided around: these attributes carry `url(#…)` legitimately, so they are
      // gated rather than declared URI-safe.
      const out = sanitizeSvg(
        '<svg xmlns="http://www.w3.org/2000/svg">' +
          '<rect fill="url(http://evil.example/x#g)" stroke="url(//evil.example/y#s)" />' +
          '<line marker-end="url(http://evil.example/z#m)" />' +
          '<path clip-path="url(http://evil.example/w#c)" /></svg>',
      );
      expect(survivingAttrValues(out, (v) => v.includes('evil.example'))).toEqual([]);
    });

    it('leaves NO remote reference anywhere in the corpus (the sweep, not a case)', () => {
      const corpus = [
        '<svg xmlns="http://www.w3.org/2000/svg"><foreignObject><img src="http://evil.example/a" /></foreignObject></svg>',
        '<svg xmlns="http://www.w3.org/2000/svg"><use href="http://evil.example/b#x" /></svg>',
        '<svg xmlns="http://www.w3.org/2000/svg"><image href="http://evil.example/c" /></svg>',
        '<svg xmlns="http://www.w3.org/2000/svg"><style>@import url("http://evil.example/d");</style></svg>',
        '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><use xlink:href="http://evil.example/e#x" /></svg>',
        '<svg xmlns="http://www.w3.org/2000/svg"><rect fill="url(http://evil.example/f#g)" /></svg>',
      ];
      for (const svg of corpus) {
        const out = sanitizeSvg(svg);
        expect(survivingRemoteRefs(out), svg).toEqual([]);
        // ★ The `@import` row (index 3) is why this second sweep exists. Under option B
        // the `<style>` element SURVIVES, and its CSS is TEXT, not an attribute — so
        // `survivingRemoteRefs` cannot see it, and that row would pass this sweep while
        // the artifact carried a live `@import`. A sweep that structurally cannot fail on
        // one of its own rows is worse than no row at all.
        expect(survivingRemoteCss(out), svg).toEqual([]);
      }
      // The controls: BOTH predicates FIRE on the same markup unsanitized, so an
      // empty sweep is a result and not a broken predicate (retro finding 1).
      expect(survivingRemoteRefs(corpus[1])).toEqual([
        '<use href="http://evil.example/b#x">',
      ]);
      expect(survivingRemoteCss(corpus[3])).toEqual([
        '<style>@import url("http://evil.example/d");</style>',
      ]);
    });
  });

  describe('engine-shaped SVG is preserved (we do not over-strip)', () => {
    // The shape mermaid emits: an id'd marker referenced by url(#…), a symbol
    // referenced by an INTERNAL xlink:href, and the a11y trio §5 requires.
    const ENGINE_SHAPED =
      '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ' +
      'id="d0" class="flowchart" viewBox="0 0 100 50" role="graphics-document document" ' +
      'aria-roledescription="flowchart" aria-labelledby="d0-title" aria-describedby="d0-desc">' +
      '<title id="d0-title">Build pipeline</title><desc id="d0-desc">Three stages</desc>' +
      '<defs><marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">' +
      '<path d="M0,0 L8,3 L0,6 z" fill="#16171F" /></marker>' +
      '<symbol id="dot"><circle cx="3" cy="3" r="3" /></symbol>' +
      '<linearGradient id="fade" gradientUnits="userSpaceOnUse">' +
      '<stop offset="0" stop-color="#fff" stop-opacity="1" /></linearGradient></defs>' +
      '<g class="nodes" transform="translate(4,4)">' +
      '<rect class="basic" x="0" y="0" width="40" height="20" rx="3" ry="3" fill="url(#fade)" ' +
      'stroke="#16171F" stroke-width="1" />' +
      '<text x="20" y="14" text-anchor="middle" font-size="10" font-family="serif">' +
      '<tspan dy="0">build</tspan></text>' +
      '<line x1="40" y1="10" x2="70" y2="10" stroke="rgb(22, 23, 31)" fill="none" ' +
      'marker-end="url(#arrowhead)" clip-path="url(#fade)" />' +
      '<use xlink:href="#dot" x="70" y="7" /></g></svg>';

    it('keeps the structural elements the engine emits', () => {
      const out = sanitizeSvg(ENGINE_SHAPED);
      for (const tag of [
        'svg', 'defs', 'marker', 'symbol', 'linearGradient', 'stop', 'g',
        'rect', 'path', 'circle', 'line', 'text', 'tspan', 'use', 'title', 'desc',
      ]) {
        expect(survivingElements(out, tag), `${tag} must survive`).not.toEqual([]);
      }
    });

    it('keeps ids and the internal references that depend on them', () => {
      const out = sanitizeSvg(ENGINE_SHAPED);
      expect(out).toContain('id="arrowhead"');
      expect(out).toContain('marker-end="url(#arrowhead)"');
      expect(out).toContain('fill="url(#fade)"');
      expect(out).toContain('clip-path="url(#fade)"');
      // The gated attributes' non-reference values survive too — §2.1's
      // pre-amendment literal `/^#/` would have deleted all three, taking the
      // arrowheads with them (decisions.md, ff8f323).
      expect(out).toContain('fill="none"');
      expect(out).toContain('stroke="rgb(22, 23, 31)"');
      // The internal fragment on the very attribute the external case is dropped on
      // — so the corpus above is not passing because everything was stripped.
      expect(survivingAttrValues(out, (v) => v === '#dot')).not.toEqual([]);
    });

    it('keeps the accessible name (ALLOW_ARIA_ATTR: true is load-bearing, not cosmetic)', () => {
      const out = sanitizeSvg(ENGINE_SHAPED);
      expect(out).toContain('aria-labelledby="d0-title"');
      expect(out).toContain('aria-describedby="d0-desc"');
      expect(out).toContain('aria-roledescription="flowchart"');
      expect(out).toContain('role="graphics-document document"');
      expect(out).toContain('Build pipeline');
      // The control for that claim: the DOCUMENT profile, whose ALLOW_ARIA_ATTR is
      // false, strips the same attribute from the same markup.
      expect(sanitize('<p aria-label="kept?">x</p>')).not.toContain('aria-label');
    });

    it('keeps geometry, paint and text metrics', () => {
      const out = sanitizeSvg(ENGINE_SHAPED);
      expect(out).toContain('viewBox="0 0 100 50"');
      expect(out).toContain('transform="translate(4,4)"');
      expect(out).toContain('markerWidth="8"');
      expect(out).toContain('refX="8"');
      expect(out).toContain('orient="auto"');
      expect(out).toContain('stroke-width="1"');
      expect(out).toContain('text-anchor="middle"');
      expect(out).toContain('x1="40"');
    });
  });

  describe('the two profiles are independent', () => {
    it('markdown source still cannot produce an <svg> through the document profile', () => {
      const out = sanitize(parse('text\n\n<svg onload="alert(1)"><circle r="5" /></svg>\n'));
      expect(survivingElements(out, 'svg')).toEqual([]);
      expect(survivingElements(out, 'circle')).toEqual([]);
      expect(out).toContain('text');
    });

    it('the document profile is not widened by the SVG profile existing', () => {
      expect([...ALLOWED_TAGS]).not.toContain('svg');
      expect([...ALLOWED_ATTR]).not.toContain('xlink:href');
    });
  });

  // ── THE data: DENIAL IS ALLOW-LIST-DRIVEN — jsdom mirror of task 2.2 ────────
  //
  // ★ THIS IS THE MIRROR, NOT THE PROOF. The authoritative version of everything
  // below is `tests/browser/diagramSanitize.browser.test.ts`, which runs against REAL
  // Chromium and Firefox parsing. jsdom's HTML parser diverges from both on exactly
  // the class of case a sanitizer profile is judged by — mXSS through SVG/MathML
  // foreign content, `<template>`/`<noscript>` reparsing — so a payload proven inert
  // here is NOT proven inert in a browser (decisions.md 2026-07-14, restated in this
  // file's header). These cases live here anyway because the everyday `pnpm test`
  // suite is what a future widening runs first, and reding early is worth a mirror.
  //
  // ★ AND THE FINDING, so it is not re-derived: there is NO "remove the hook → the
  // data: case reds" discriminator for this profile. `sanitize.ts:131-135`'s global
  // hook is a PROVEN NO-OP under `SANITIZE_SVG_CONFIG` — all five of DOMPurify's
  // `_isValidAttribute` acceptance branches are closed, so it can never be the thing
  // that strips (decisions.md `b19c068`, the §2.2 AMENDMENT). The denial is the
  // ALLOW-LIST's, and the guard for it is the widening boundary below.
  describe('the data: denial is allow-list-driven, not hook-driven (§2.2 mirror)', () => {
    const DATA_PAYLOAD =
      '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">' +
      '<defs><symbol id="dot"><circle cx="3" cy="3" r="3" /></symbol></defs>' +
      '<use xlink:href="data:text/html,x" x="10" y="10" />' +
      '<use xlink:href="#dot" x="20" y="20" />' +
      '<image href="data:text/html,y" width="1" height="1" />' +
      '</svg>';

    /** Surviving attribute values that resolve to `data:`, described (finding 5). */
    function survivingDataUris(out: string): string[] {
      return survivingAttrValues(
        out,
        // eslint-disable-next-line no-control-regex
        (v) => v.replace(/[\u0000-\u0020]+/g, '').slice(0, 5).toLowerCase() === 'data:',
      );
    }

    it('the sweep FIRES on the raw payload (two data: URIs), so an empty result is a result', () => {
      expect(survivingDataUris(DATA_PAYLOAD)).toEqual([
        '<use xlink:href="data:text/html,x">',
        '<image href="data:text/html,y">',
      ]);
    });

    it('no data: URI survives sanitizeSvg', () => {
      expect(survivingDataUris(sanitizeSvg(DATA_PAYLOAD))).toEqual([]);
    });

    it('a fresh NO-HOOK DOMPurify instance is equally clean on the profile', () => {
      // A second instance from the same factory, with its own empty hooks map — so the
      // only thing acting on the payload is `SANITIZE_SVG_CONFIG` itself.
      const noHook = DOMPurify(window);
      expect(noHook, 'the "fresh" instance IS the singleton — this proves nothing')
        .not.toBe(DOMPurify);
      // `removeHook` with no function pops and returns the last hook; `undefined` is the
      // proof the stack was empty. Only the fresh instance is touched.
      expect(noHook.removeHook('uponSanitizeAttribute')).toBeUndefined();

      const out = noHook.sanitize(DATA_PAYLOAD, SANITIZE_SVG_CONFIG) as string;
      expect(
        survivingDataUris(out),
        'a data: URI survived WITHOUT the hook — the allow-list is not the denial',
      ).toEqual([]);
    });

    it('the #fragment on the same attribute SURVIVES — the sweep is not passing on an empty tree', () => {
      const out = sanitizeSvg(DATA_PAYLOAD);
      expect(
        survivingAttrValues(out, (v) => v === '#dot'),
        'the internal #dot reference was stripped too — the clean data: sweep is vacuous',
      ).not.toEqual([]);
      const noHook = DOMPurify(window);
      expect(
        survivingAttrValues(noHook.sanitize(DATA_PAYLOAD, SANITIZE_SVG_CONFIG) as string,
          (v) => v === '#dot'),
      ).not.toEqual([]);
    });

    it('`image` — the widening that would make the hook load-bearing — is denied by absence', () => {
      // The boundary the browser suite's revert-and-fail crosses: `image` is a member of
      // DOMPurify's own DATA_URI_TAGS, so allow-listing it re-opens the `data:` bypass the
      // hook exists to close, and the no-hook assertion above reds. Pinned here so the
      // widening cannot land without a reviewer meeting this sentence.
      expect([...SVG_ALLOWED_TAGS]).not.toContain('image');
      expect(survivingElements(sanitizeSvg(DATA_PAYLOAD), 'image')).toEqual([]);
    });
  });

  // ── THE CSS PASS, AT THE STRING LEVEL (option B, decisions.md `0de27f3`) ──
  //
  // ★ WHAT THIS SUITE CAN AND CANNOT PROVE. It asserts the SHAPE of `cleanSvgCss`'s
  // output: which spellings are stripped and which survive. It does NOT prove the
  // artifact is inert, because jsdom loads no subresources (decisions.md 2026-07-14) —
  // "no request" and "no engine that could make one" read identically here. THE FETCH
  // PROOF IS `tests/browser/diagramStyleCss.browser.test.ts`, which adopts the sanitized
  // artifact into a LIVE Chromium and Firefox document and watches the wire. That file is
  // authoritative; this one is the fast mirror that fails first on a spelling regression.
  describe('cleanSvgCss — the CSS pass (string-level; the fetch proof is the browser suite)', () => {
    const KEEP = '.k{fill:url(#gradA)}\n@keyframes dash{to{stroke-dashoffset:0}}';

    /** Every external spelling the reproduction found, plus the two lanes beyond it. */
    const EXTERNAL = [
      ['plain', 'url(http://evil.example/a.png)'],
      // ★ The lane that decides the mechanism: `\72` is an escaped `r`, so this IS a url
      // token to a CSS parser and is NOT one to `/url\(/`. A pass that only greps reds here.
      ['CSS escape', String.raw`u\72 l(http://evil.example/b.png)`],
      ['CSS escape, no space', String.raw`\75rl(http://evil.example/b2.png)`],
      ['case', 'URL(http://evil.example/c.png)'],
      ['interior whitespace', 'url(  http://evil.example/d.png  )'],
      ['double quoting', 'url("http://evil.example/e.png")'],
      ['single quoting', "url('http://evil.example/f.png')"],
      ['protocol-relative', 'url(//evil.example/g.png)'],
      ['data:', 'url(data:image/gif;base64,R0lGOD)'],
      ['relative path', 'url(./h.png)'],
      ['bare-string image-set', 'image-set("http://evil.example/i.png" 1x)'],
      ['url-wrapping image-set', 'image-set(url(http://evil.example/j.png) 1x)'],
    ] as const;

    it.each(EXTERNAL)('strips an external reference — %s', (_label, payload) => {
      const out = cleanSvgCss(`.a{background-image:${payload}}\n${KEEP}`);
      expect(out, `the payload survived: ${out}`).not.toMatch(/evil\.example|data:|\.\/h\.png/);
      // …and the live control in the SAME stylesheet, so a clean result is not an
      // over-strip. This is the jsdom mirror of the browser suite's per-lane control.
      expect(out, 'internal url(#gradA) went too — over-strip').toContain('url(#gradA)');
      expect(out, '@keyframes went too — animated edges die with it').toContain('@keyframes dash');
    });

    it('strips every at-rule EXCEPT @keyframes, prelude and block together', () => {
      const out = cleanSvgCss(
        '@import url(http://evil.example/x.css);\n' +
          '@import "http://evil.example/bare.css";\n' +
          '@font-face{font-family:e;src:url(http://evil.example/f.woff)}\n' +
          '@media screen{.m{background:url(http://evil.example/m.png)}}\n' +
          '@supports (display:grid){.s{background:url(http://evil.example/s.png)}}\n' +
          KEEP,
      );
      expect(out).not.toContain('@import');
      expect(out).not.toContain('@font-face');
      expect(out).not.toContain('@media');
      expect(out).not.toContain('@supports');
      expect(out, `an at-rule leaked its payload: ${out}`).not.toContain('evil.example');
      expect(out, '@keyframes is the allow-list of exactly one — mermaid emits it').toContain(
        '@keyframes dash',
      );
    });

    it('descends INTO @keyframes — an external url() there is still an external url()', () => {
      const out = cleanSvgCss('@keyframes k{from{background-image:url(http://evil.example/k.png)}}');
      expect(out).not.toContain('evil.example');
      expect(out, 'the whole @keyframes went — the pass does not descend, it deletes').toContain(
        '@keyframes k',
      );
    });

    it('PRESERVES internal url(#…) in every form, and is the IDENTITY on a clean sheet', () => {
      const clean =
        '.a{fill:url(#gradA)}\n.b{fill:url("#gradA")}\n.c{fill:url(\'#gradA\')}\n' +
        '.d{fill:url(  #gradA  )}\n.e{clip-path:url(#clipA)}\n' +
        '@keyframes edge-animation-frame{to{stroke-dashoffset:0}}';
      // Byte-identical, not merely equivalent: a clean engine stylesheet must not be
      // rewritten at all, or the cached artifact's bytes drift on every pass.
      expect(cleanSvgCss(clean)).toBe(clean);
    });

    it('an escaped `#` still reads as the fragment it is', () => {
      // `\23` IS a `#`, so this really is an internal reference and stripping it would be
      // the over-strip direction of the same escape lane.
      expect(cleanSvgCss(String.raw`.a{fill:url(\23 gradA)}`)).toBe(
        String.raw`.a{fill:url(\23 gradA)}`,
      );
    });

    it('an escaped structural char cannot FABRICATE a token', () => {
      // `url\28 #x)` is the IDENT `url(`, not a function — no fetch, nothing to strip. A
      // decoder that turned `\28` into a real `(` would see a url token that CSS does not.
      const ident = String.raw`.a{font-family:url\28 x}`;
      expect(cleanSvgCss(ident)).toBe(ident);
      // …and the converse: `\40 import` is an ident, not an at-rule, so it stays put.
      const notAtRule = String.raw`.a{font-family:\40 import}`;
      expect(cleanSvgCss(notAtRule)).toBe(notAtRule);
    });

    it('a comment cannot hide a payload, and comment-joined tokens strip TOO (over-strip)', () => {
      // Removing comments in the scan view makes the pass STRICTER than CSS, and the
      // direction is the point. `ur/**/l(` is TWO idents to a real parser and so fetches
      // nothing — the pass cuts it anyway, because comment removal can only ever join
      // text into MORE apparent tokens, never fewer. Erring toward a cut is the safe
      // direction, and no engine output puts a comment mid-token.
      expect(cleanSvgCss('.a{background:ur/**/l(http://evil.example/x)}')).not.toContain(
        'evil.example',
      );
      // A comment carrying a brace must not desynchronise the scan.
      const out = cleanSvgCss('/* } */@import url(http://evil.example/y.css);\n' + KEEP);
      expect(out).not.toContain('evil.example');
      expect(out).toContain('url(#gradA)');
      // A comment that merely MENTIONS a payload is inert and is left in place.
      const commented = '/* url(http://evil.example/q) */\n' + KEEP;
      expect(cleanSvgCss(commented)).toBe(commented);
    });

    it('a `}` or `url(` inside a STRING is inert, and is left alone', () => {
      const inert = '.a{content:"} url(http://evil.example/z)"}\n' + KEEP;
      expect(cleanSvgCss(inert)).toBe(inert);
    });

    it('the output is a FIXPOINT — re-running the pass changes nothing', () => {
      for (const [, payload] of EXTERNAL) {
        const once = cleanSvgCss(`.a{background-image:${payload}}\n${KEEP}`);
        expect(cleanSvgCss(once), `not a fixpoint for ${payload}`).toBe(once);
      }
    });

    it('fails CLOSED: a cut that could break out of <style> drops the sheet whole', () => {
      // The source text cannot contain a real `</style>` — the parser would have ended the
      // element — so this can only fire on text the pass itself produced by joining across
      // a cut. An HTML-namespaced `<style>` serializes its children RAW, which is what
      // would make such a join an injection rather than a cosmetic defect.
      expect(cleanSvgCss('</styleurl(http://evil.example/x)>')).toBe('');
    });

    it('the DOCUMENT profile is untouched by all of this', () => {
      // The pass is registered around the sanitizeSvg call and removed again, so it can
      // never observe a document-profile node. `<style>` is still denied there outright.
      expect(sanitize('<style>@import url("http://evil.example/x.css");</style><p>hi</p>')).toBe(
        '<p>hi</p>',
      );
      // …and it stays denied after an SVG call, which is where a leaked hook would show.
      sanitizeSvg('<svg xmlns="http://www.w3.org/2000/svg"><style>.a{fill:red}</style></svg>');
      expect(sanitize('<style>@import url("http://evil.example/x.css");</style><p>hi</p>')).toBe(
        '<p>hi</p>',
      );
    });
  });

  // ── THE BYTE-UNTOUCHED PIN ────────────────────────────────────────────────
  //
  // D-1's central claim is that the DOCUMENT profile is untouched. An equality test
  // on the parsed arrays would pass a reordering and would say nothing about the
  // comments that carry the reasoning, so this pins the SOURCE TEXT. A future
  // widening of the document allow-list — which on the untrusted-source path is an
  // XSS regression — cannot land without reding here and being read.
  //
  // Proven to FIRE (retro finding 1), not merely to pass: a scratch entry added to
  // ALLOWED_TAGS reds this suite naming the const. A pin that cannot fail is a
  // comment with a test's costs.
  describe('the document profile is byte-untouched (source-text pin)', () => {
    // Read from disk, NOT via import: the point is the source text, comments and
    // all. Resolved from the project root — `import.meta.url` is an http: URL under
    // vitest's dev-server transform, not a file: one.
    const SOURCE = readFileSync(resolve(process.cwd(), 'src/render/sanitize.ts'), 'utf8');

    /** The declaration's exact source text, `export const NAME` … terminator. */
    function declarationSource(name: string, terminator: string): string {
      const start = SOURCE.indexOf(`export const ${name}`);
      expect(start, `${name} declaration not found in sanitize.ts`).toBeGreaterThan(-1);
      const end = SOURCE.indexOf(terminator, start);
      expect(end, `${name} has no ${terminator} terminator in sanitize.ts`).toBeGreaterThan(-1);
      return SOURCE.slice(start, end + terminator.length);
    }

    it('ALLOWED_TAGS is byte-identical', () => {
      expect(
        declarationSource('ALLOWED_TAGS', '] as const;'),
        'ALLOWED_TAGS (the DOCUMENT profile) changed — widening it is an XSS regression on the untrusted-source path',
      ).toBe(`export const ALLOWED_TAGS = [
  // headings
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  // block text
  'p', 'br', 'hr', 'blockquote', 'pre',
  // inline emphasis / semantics
  'em', 'strong', 'del', 's', 'code', 'sup', 'sub',
  // lists
  'ul', 'ol', 'li',
  // task-list checkbox (rendered disabled — see parse.ts)
  'input',
  // links & images
  'a', 'img',
  // tables
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
] as const;`);
    });

    it('ALLOWED_ATTR is byte-identical', () => {
      expect(
        declarationSource('ALLOWED_ATTR', '] as const;'),
        'ALLOWED_ATTR (the DOCUMENT profile) changed — widening it is an XSS regression on the untrusted-source path',
      ).toBe(`export const ALLOWED_ATTR = [
  'href', 'src', 'alt', 'title', 'class',
  'type', 'checked', 'disabled',
  'colspan', 'rowspan',
  'data-fence-meta',
] as const;`);
    });

    it('SANITIZE_CONFIG is byte-identical', () => {
      expect(
        declarationSource('SANITIZE_CONFIG', '};'),
        'SANITIZE_CONFIG (the DOCUMENT profile) changed — its ALLOW_* flags are the untrusted-source boundary',
      ).toBe(`export const SANITIZE_CONFIG: Parameters<typeof DOMPurify.sanitize>[1] = {
  ALLOWED_TAGS: [...ALLOWED_TAGS],
  ALLOWED_ATTR: [...ALLOWED_ATTR],
  ALLOWED_URI_REGEXP,
  ALLOW_UNKNOWN_PROTOCOLS: false, // keep unknown schemes disallowed
  ALLOW_DATA_ATTR: false, // no data-* attributes
  ALLOW_ARIA_ATTR: false, // no aria-* attributes (our output emits none in M1)
  SAFE_FOR_XML: true, // DOMPurify default; kept explicit for review
  RETURN_DOM: false, // return an HTML string
  RETURN_DOM_FRAGMENT: false,
};`);
    });

    it('the pin reads the real file, not a stale copy (the control that fires)', () => {
      // If this ever passes on an empty read, the three assertions above are vacuous.
      expect(SOURCE).toContain('export function sanitize(html: string): string');
      expect(SOURCE).toContain('export function sanitizeSvg(svg: string): string');
      expect(SOURCE.length).toBeGreaterThan(6000);
    });

    // ★ task 2.1-R's own Verify: "the document AND SVG profiles' three consts remain
    // byte-identical to the original (diffed)" — the document trio above pre-dates this
    // task; the SVG trio's own pin did not exist until now. Same mechanism, same failure
    // mode it guards (a widening on either untrusted-source-adjacent profile).
    it('SVG_ALLOWED_TAGS is byte-identical', () => {
      expect(
        declarationSource('SVG_ALLOWED_TAGS', '] as const;'),
        'SVG_ALLOWED_TAGS changed — task 2.1-R (D-5-R) must be additive-only to the SVG profile',
      ).toBe(`export const SVG_ALLOWED_TAGS = [
  // root & grouping
  'svg', 'g', 'defs', 'symbol', 'use', 'clipPath',
  // shapes
  'path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon',
  // text
  'text', 'tspan',
  // arrowheads & gradients
  'marker', 'linearGradient', 'stop',
  // accessible name & description (§5 — every diagram carries an accessible name)
  'title', 'desc',
  // the engine's own stylesheet — ADMITTED (option B), gated by cleanSvgCss below
  'style',
] as const;`);
    });

    it('SVG_ALLOWED_ATTR is byte-identical', () => {
      expect(
        declarationSource('SVG_ALLOWED_ATTR', '] as const;'),
        'SVG_ALLOWED_ATTR changed — task 2.1-R (D-5-R) must be additive-only to the SVG profile',
      ).toBe(`export const SVG_ALLOWED_ATTR = [
  // identity & hooks (see the \`id\` note above)
  'id', 'class', 'title',
  // geometry
  'x', 'y', 'dx', 'dy', 'width', 'height', 'rx', 'ry', 'cx', 'cy', 'r',
  'x1', 'y1', 'x2', 'y2', 'd', 'points', 'transform', 'transform-origin',
  // viewport
  'viewBox', 'preserveAspectRatio', 'overflow', 'xmlns', 'xmlns:xlink',
  // paint
  'fill', 'fill-opacity', 'fill-rule', 'stroke', 'stroke-width', 'stroke-opacity',
  'stroke-dasharray', 'stroke-linecap', 'stroke-linejoin', 'opacity', 'visibility',
  // text
  'font-family', 'font-size', 'font-style', 'font-weight',
  'text-anchor', 'dominant-baseline', 'alignment-baseline',
  // arrowheads & gradients
  'marker-start', 'marker-mid', 'marker-end',
  'markerWidth', 'markerHeight', 'markerUnits', 'refX', 'refY', 'orient',
  'gradientUnits', 'offset', 'stop-color', 'stop-opacity',
  // clipping
  'clip-path', 'clip-rule',
  // internal fragment references ONLY — see SVG_ALLOWED_URI_REGEXP
  'href', 'xlink:href',
  // accessibility (\`aria-*\` arrives via ALLOW_ARIA_ATTR, not by name)
  'role',
] as const;`);
    });

    it('SANITIZE_SVG_CONFIG is byte-identical', () => {
      expect(
        declarationSource('SANITIZE_SVG_CONFIG', '};'),
        'SANITIZE_SVG_CONFIG changed — task 2.1-R (D-5-R) must be additive-only to the SVG profile',
      ).toBe(`export const SANITIZE_SVG_CONFIG: Parameters<typeof DOMPurify.sanitize>[1] = {
  ALLOWED_TAGS: /*#__PURE__*/ SVG_ALLOWED_TAGS.slice(),
  ALLOWED_ATTR: /*#__PURE__*/ SVG_ALLOWED_ATTR.slice(),
  ALLOWED_URI_REGEXP: SVG_ALLOWED_URI_REGEXP,
  ADD_URI_SAFE_ATTR: /*#__PURE__*/ SVG_URI_SAFE_ATTR.slice(), // DIVERGENCE 3 — see above
  ALLOW_UNKNOWN_PROTOCOLS: false, // keep unknown schemes disallowed
  ALLOW_DATA_ATTR: false, // no data-* attributes (the engine's own bookkeeping)
  ALLOW_ARIA_ATTR: true, // DIVERGENCE 1 — see above
  SAFE_FOR_XML: true, // DOMPurify default; kept explicit for review
  RETURN_DOM: false, // return an SVG string
  RETURN_DOM_FRAGMENT: false,
};`);
    });
  });
});

// ── THE MATH PROFILE (task 2.1-R · D-5-R) ────────────────────────────────────
//
// ★ PROCEEDS UNDER THE OPEN 1.2-R FORK (decisions.md 2026-09-07, "M11 1.2-R SEQUENCING
// DEVIATION") — built conditionally, per the banked deviation's own condition 1. Groups
// 2-R–8-R are authorized to proceed while the human fidelity walk's PROCEED/CLOSE-M11
// judgment is deferred to milestone-close (task 8.1-R); a CLOSE-M11 ruling there reverts
// this work along with the temml/tokenizer/font install, per the deviation's condition 2.
//
// Unlike the SVG profile's hand-authored hostile corpus, the ALLOW-LIST ITSELF is derived
// from a SURVEY of real installed `temml@0.13.5` output below — the enumeration IS the
// test, not a fixture copied from one run elsewhere. 97 real LaTeX formulas are rendered:
// the 48-entry dense corpus + 10 inline samples `harness/math-fidelity/corpus.js` built for
// 1.2-R's own fidelity walk (same classes: fractions, radicals, integrals, big-operators,
// matrices, stretchy delimiters, sub/superscripts, Greek, relations, set ops, nabla/lim,
// accents, over/under-braces, math alphabets, named functions, arrows, digits), PLUS 39
// formulas this task added to reach producers neither corpus exercised: `\color`/
// `\textcolor`/`\colorbox`/`\fcolorbox` (the `style`/`mathcolor`/`mathbackground`
// colour-value producers), `\boxed`/`\overline`/`\underline`/`\cancel`/`\bcancel`/
// `\xcancel`/`\sout`/`\fbox`/`\phase`/`\textcircled`/`\angl`/`\longdiv` (the `menclose`/
// `notation` family), `\reflectbox`/`\raisebox`/`\kern`/`\llap`/`\rlap`/`\cancelto`/
// `\hphantom`/`\vphantom` (more `style`-bearing layout producers), `\text`/`\textbf`, and
// `align`/`cases`/`array`/`\overset`/`\underset`/`\stackrel`/`\substack`/`\xrightarrow`/
// `\xleftarrow`/`\binom`/`\pmod`/`\tag` (table/script/equation-numbering shapes). All 97
// render error-free with `throwOnError: true` (temml's own default settings — `trust`
// defaults to `false`, `annotate` to `false`, confirmed against the installed
// `Settings.js`, not assumed).
//
// This corpus is duplicated here rather than imported from `harness/math-fidelity/corpus.js`
// on purpose: the harness is a human-walk tool (1.2-R), a plain global script with no
// import/export (`file://` pages cannot load ES modules), and this suite's own claims must
// not depend on that file's own shape surviving unchanged for an unrelated purpose.

/** One real LaTeX formula this survey renders through the installed `temml`. */
interface MathCorpusEntry {
  readonly label: string;
  readonly latex: string;
  readonly displayMode: boolean;
}

const MATH_SURVEY_CORPUS: readonly MathCorpusEntry[] = [
  // ── the 1.2-R harness's own 48-formula dense corpus (display mode) ──────────
  { label: 'simple fraction', latex: String.raw`\frac{a}{b}`, displayMode: true },
  { label: 'nested fraction', latex: String.raw`\frac{1}{1+\frac{1}{1+\frac{1}{x}}}`, displayMode: true },
  { label: 'binomial-style fraction', latex: String.raw`\dfrac{n!}{k!(n-k)!}`, displayMode: true },
  { label: 'square root', latex: String.raw`\sqrt{x+1}`, displayMode: true },
  { label: 'nth root', latex: String.raw`\sqrt[n]{x^n+y^n}`, displayMode: true },
  { label: 'nested radical', latex: String.raw`\sqrt{1+\sqrt{1+\sqrt{1+x}}}`, displayMode: true },
  { label: 'single integral', latex: String.raw`\int_0^1 x^2\,dx`, displayMode: true },
  { label: 'double integral', latex: String.raw`\iint_D f(x,y)\,dA`, displayMode: true },
  { label: 'triple integral', latex: String.raw`\iiint_V \rho(x,y,z)\,dV`, displayMode: true },
  { label: 'contour integral', latex: String.raw`\oint_C \mathbf{F}\cdot d\mathbf{r}`, displayMode: true },
  { label: 'sum', latex: String.raw`\sum_{i=1}^{n} i^2`, displayMode: true },
  { label: 'product', latex: String.raw`\prod_{k=1}^{n} \frac{k}{k+1}`, displayMode: true },
  { label: 'coproduct', latex: String.raw`\coprod_{i \in I} A_i`, displayMode: true },
  { label: 'big union', latex: String.raw`\bigcup_{n=1}^{\infty} A_n`, displayMode: true },
  { label: 'big intersection', latex: String.raw`\bigcap_{n=1}^{\infty} A_n`, displayMode: true },
  {
    label: 'pmatrix (parens)',
    latex: String.raw`\begin{pmatrix} a & b \\ c & d \end{pmatrix}`,
    displayMode: true,
  },
  {
    label: 'bmatrix (brackets)',
    latex: String.raw`\begin{bmatrix} 1 & 0 \\ 0 & 1 \end{bmatrix}`,
    displayMode: true,
  },
  {
    label: 'Bmatrix (braces)',
    latex: String.raw`\begin{Bmatrix} a & b \\ c & d \end{Bmatrix}`,
    displayMode: true,
  },
  {
    label: 'vmatrix (determinant)',
    latex: String.raw`\begin{vmatrix} a & b \\ c & d \end{vmatrix}`,
    displayMode: true,
  },
  { label: 'Vmatrix (norm)', latex: String.raw`\begin{Vmatrix} a & b \\ c & d \end{Vmatrix}`, displayMode: true },
  { label: 'left/right parens', latex: String.raw`\left(\frac{a}{b}\right)`, displayMode: true },
  {
    label: 'nested Big-family',
    latex: String.raw`\Biggl(\biggl(\Bigl(\bigl(x\bigr)\Bigr)\biggr)\Biggr)`,
    displayMode: true,
  },
  {
    label: 'left/right brackets around fraction stack',
    latex: String.raw`\left[\frac{1}{1+\frac{1}{x}}\right]`,
    displayMode: true,
  },
  { label: 'nested superscript tower', latex: String.raw`x^{y^{z^2}}`, displayMode: true },
  { label: 'nested sub/superscript', latex: String.raw`a_{i_{j_k}}^{b^{c^d}}`, displayMode: true },
  { label: 'sub and sup together', latex: String.raw`x_i^2 + y_j^3`, displayMode: true },
  {
    label: 'full lowercase Greek alphabet',
    latex:
      String.raw`\alpha\beta\gamma\delta\epsilon\zeta\eta\theta\iota\kappa\lambda\mu` +
      String.raw`\nu\xi\pi\rho\sigma\tau\upsilon\phi\chi\psi\omega`,
    displayMode: true,
  },
  {
    label: 'full uppercase Greek alphabet',
    latex: String.raw`\Gamma\Delta\Theta\Lambda\Xi\Pi\Sigma\Upsilon\Phi\Psi\Omega`,
    displayMode: true,
  },
  {
    label: 'equalities/inequalities',
    latex: String.raw`a=b\neq c\leq d\geq e\approx f\equiv g\sim h\propto i`,
    displayMode: true,
  },
  {
    label: 'set operations',
    latex: String.raw`A\cup B\cap C\subset D\subseteq E, x\in F, y\notin G, H=\emptyset`,
    displayMode: true,
  },
  { label: 'gradient', latex: String.raw`\nabla f(x,y,z)`, displayMode: true },
  { label: 'limit', latex: String.raw`\lim_{x\to\infty}\frac{1}{x}=0`, displayMode: true },
  {
    label: 'hat/bar/dot/ddot/tilde/vec',
    latex: String.raw`\hat{a}\ \bar{b}\ \dot{c}\ \ddot{d}\ \tilde{e}\ \vec{f}`,
    displayMode: true,
  },
  {
    label: 'overbrace/underbrace',
    latex: String.raw`\overbrace{a+b+c}^{n\text{ terms}}\underbrace{x+y}_{\text{sum}}`,
    displayMode: true,
  },
  { label: 'mathbb', latex: String.raw`\mathbb{ABCXYZ}`, displayMode: true },
  { label: 'mathcal', latex: String.raw`\mathcal{ABCXYZ}`, displayMode: true },
  { label: 'mathfrak', latex: String.raw`\mathfrak{ABCXYZ}`, displayMode: true },
  { label: 'mathrm', latex: String.raw`\mathrm{ABCxyz}`, displayMode: true },
  { label: 'mathit', latex: String.raw`\mathit{ABCxyz}`, displayMode: true },
  { label: 'mathbf', latex: String.raw`\mathbf{ABCxyz}`, displayMode: true },
  { label: 'mathsf', latex: String.raw`\mathsf{ABCxyz}`, displayMode: true },
  { label: 'mathtt', latex: String.raw`\mathtt{ABCxyz}`, displayMode: true },
  {
    label: 'trig/log/exp',
    latex: String.raw`\sin x + \cos x + \tan x + \log x + \ln x + \exp x`,
    displayMode: true,
  },
  {
    label: 'max/min/sup/inf',
    latex: String.raw`\max_{x\in S} f(x) + \min_{x\in S} f(x) + \sup_x g(x) + \inf_x g(x)`,
    displayMode: true,
  },
  {
    label: 'basic arrows',
    latex: String.raw`a\rightarrow b\quad c\Rightarrow d\quad e\leftarrow f\quad g\Leftrightarrow h`,
    displayMode: true,
  },
  {
    label: 'mapsto and vertical arrows',
    latex: String.raw`x\mapsto x^2\quad \uparrow\ \downarrow\ \Uparrow\ \Downarrow`,
    displayMode: true,
  },
  {
    label: 'digits in an expression',
    latex: String.raw`3.14159 + 2.71828 = 5.85987, \quad 10^{100}`,
    displayMode: true,
  },
  {
    label: 'digits in subscripts/exponents',
    latex: String.raw`x_0 + x_1 + x_2 + \cdots + x_{10}^{20}`,
    displayMode: true,
  },
  // ── the 1.2-R harness's own 10 inline samples (inline mode) ──────────────────
  { label: 'inline fraction', latex: String.raw`\frac{a}{b}`, displayMode: false },
  { label: 'inline radical', latex: String.raw`\sqrt{x+1}`, displayMode: false },
  { label: 'inline sub/superscript tower', latex: String.raw`x^{y^{z^2}}`, displayMode: false },
  { label: 'inline Greek', latex: String.raw`\alpha, \beta, \gamma`, displayMode: false },
  { label: 'inline relation chain', latex: String.raw`a \leq b \leq c`, displayMode: false },
  { label: 'inline accent', latex: String.raw`\hat{\theta}`, displayMode: false },
  { label: 'inline limit', latex: String.raw`\lim_{x\to\infty}\frac{1}{x}=0`, displayMode: false },
  { label: 'inline arrow', latex: String.raw`x\mapsto x^2`, displayMode: false },
  { label: 'inline named function', latex: String.raw`\sin^2 x + \cos^2 x = 1`, displayMode: false },
  { label: 'inline digits', latex: String.raw`n = 10^{100}`, displayMode: false },
  // ── 2.1-R's own additions: colour/box/decoration producers ───────────────────
  { label: 'color', latex: String.raw`\color{red}x+y`, displayMode: true },
  { label: 'textcolor', latex: String.raw`\textcolor{blue}{x}`, displayMode: true },
  { label: 'colorbox', latex: String.raw`\colorbox{yellow}{x}`, displayMode: true },
  { label: 'fcolorbox', latex: String.raw`\fcolorbox{red}{blue}{x}`, displayMode: true },
  { label: 'boxed', latex: String.raw`\boxed{x}`, displayMode: true },
  { label: 'overline', latex: String.raw`\overline{x}`, displayMode: true },
  { label: 'underline', latex: String.raw`\underline{x}`, displayMode: true },
  { label: 'cancel', latex: String.raw`\cancel{x}`, displayMode: true },
  { label: 'bcancel', latex: String.raw`\bcancel{x}`, displayMode: true },
  { label: 'xcancel', latex: String.raw`\xcancel{x}`, displayMode: true },
  { label: 'sout', latex: String.raw`\sout{x}`, displayMode: true },
  { label: 'fbox', latex: String.raw`\fbox{x}`, displayMode: true },
  { label: 'phase', latex: String.raw`\phase{x}`, displayMode: true },
  { label: 'textcircled', latex: String.raw`\textcircled{x}`, displayMode: true },
  { label: 'angl', latex: String.raw`\angl{x}`, displayMode: true },
  { label: 'longdiv', latex: String.raw`\longdiv{x}`, displayMode: true },
  { label: 'reflectbox', latex: String.raw`\reflectbox{x}`, displayMode: true },
  { label: 'raisebox', latex: String.raw`\raisebox{2pt}{x}`, displayMode: true },
  { label: 'kern', latex: String.raw`\kern 2pt x`, displayMode: true },
  { label: 'llap', latex: String.raw`\llap{x}`, displayMode: true },
  { label: 'rlap', latex: String.raw`\rlap{x}`, displayMode: true },
  { label: 'delimiter colour (mathcolor)', latex: String.raw`\left(\color{red}x\right)`, displayMode: true },
  { label: 'cancelto', latex: String.raw`\cancelto{0}{x}`, displayMode: true },
  { label: 'hphantom', latex: String.raw`\hphantom{x}`, displayMode: true },
  { label: 'vphantom', latex: String.raw`\vphantom{x}`, displayMode: true },
  { label: 'text', latex: String.raw`\text{hello}`, displayMode: true },
  { label: 'textbf', latex: String.raw`\textbf{bold text}`, displayMode: true },
  {
    label: 'align (equation-numbering span)',
    latex: String.raw`\begin{align} a &= b \\ c &= d \end{align}`,
    displayMode: true,
  },
  { label: 'cases', latex: String.raw`\begin{cases} a & b \\ c & d \end{cases}`, displayMode: true },
  { label: 'overset', latex: String.raw`\overset{a}{b}`, displayMode: true },
  { label: 'underset', latex: String.raw`\underset{a}{b}`, displayMode: true },
  { label: 'stackrel', latex: String.raw`\stackrel{a}{b}`, displayMode: true },
  { label: 'substack', latex: String.raw`\substack{a \\ b}`, displayMode: true },
  { label: 'xrightarrow', latex: String.raw`\xrightarrow{f}`, displayMode: true },
  { label: 'xleftarrow', latex: String.raw`\xleftarrow[g]{f}`, displayMode: true },
  { label: 'binom', latex: String.raw`\binom{n}{k}`, displayMode: true },
  { label: 'pmod', latex: String.raw`\pmod{n}`, displayMode: true },
  { label: 'tag', latex: String.raw`a \tag{1}`, displayMode: true },
  {
    label: 'array',
    latex: String.raw`\begin{array}{cc} a & b \\ c & d \end{array}`,
    displayMode: true,
  },
];

/** Every formula rendered through the REAL installed `temml`, with `throwOnError: true`
 *  (a parse/render failure here is a corpus-authoring bug, not a fixture to tolerate) and
 *  Temml's own default `trust`/`annotate` (both `false` — this survey exercises the
 *  defaults 4.1-R will re-derive, not a hardened config invented for this test). */
function renderMathCorpus(): { entry: MathCorpusEntry; html: string }[] {
  return MATH_SURVEY_CORPUS.map((entry) => ({
    entry,
    html: temml.renderToString(entry.latex, {
      throwOnError: true,
      displayMode: entry.displayMode,
    }),
  }));
}

/** Every distinct element tag name and attribute name the real corpus above produces. */
function surveyRealMathOutput(rendered: { html: string }[]): { tags: Set<string>; attrs: Set<string> } {
  const tags = new Set<string>();
  const attrs = new Set<string>();
  for (const { html } of rendered) {
    for (const el of elementsOf(html)) {
      tags.add(el.localName.toLowerCase());
      for (const attr of el.attributes) attrs.add(attr.name);
    }
  }
  return { tags, attrs };
}

describe('sanitizeMath — the math profile (task 2.1-R · D-5-R)', () => {
  const rendered = renderMathCorpus();

  it('all 97 corpus formulas render error-free under real temml (the survey itself is valid)', () => {
    expect(rendered).toHaveLength(97);
    for (const { entry, html } of rendered) {
      expect(html, `${entry.label} (${entry.latex}) produced no <math>`).toContain('<math');
    }
  });

  describe('the allow-list is enumerated against REAL installed temml output', () => {
    const { tags: realTags, attrs: realAttrs } = surveyRealMathOutput(rendered);

    it('surveys exactly the tag set this profile allow-lists — 24 tags', () => {
      expect(MATH_ALLOWED_TAGS.length).toBe(24);
      expect([...realTags].sort()).toEqual([...MATH_ALLOWED_TAGS].sort());
    });

    it('surveys exactly the attribute set this profile allow-lists — 25 attributes', () => {
      expect(MATH_ALLOWED_ATTR.length).toBe(25);
      expect([...realAttrs].sort()).toEqual([...MATH_ALLOWED_ATTR].sort());
    });

    it('real Temml output never emits `semantics`/`annotation` (annotate defaults to false)', () => {
      // D-5's own hypothesis list carried these forward from KaTeX; confirmed ABSENT here
      // — admitting them would be exactly the "attribute surface with no producer" this
      // profile's construction refuses everywhere else.
      expect(realTags.has('semantics')).toBe(false);
      expect(realTags.has('annotation')).toBe(false);
      expect(rendered.some(({ html }) => /<semantics|<annotation/.test(html))).toBe(false);
    });

    it('the ONE HTML tag — `span` — is real, producer-confirmed, and carries only `class`', () => {
      const alignEntry = rendered.find(({ entry }) => entry.label === 'align (equation-numbering span)');
      expect(alignEntry?.html).toContain('<span class="tml-eqn">');
      const spans = elementsOf(alignEntry?.html ?? '').filter((el) => el.localName === 'span');
      expect(spans.length).toBeGreaterThan(0);
      for (const span of spans) {
        expect([...span.attributes].map((a) => a.name)).toEqual(['class']);
      }
    });

    it('`mathcolor`/`mathbackground` are real producers (delimiter colour, colorbox)', () => {
      expect(realAttrs.has('mathcolor')).toBe(true);
      expect(realAttrs.has('mathbackground')).toBe(true);
    });
  });

  describe('cleanMathStyle zero-strips REAL Temml output (measured, not assumed)', () => {
    it('every real `style` value from the corpus is SAFE — no false positive', () => {
      const styleValues = rendered.flatMap(({ html }) =>
        elementsOf(html)
          .map((el) => el.getAttribute('style'))
          .filter((v): v is string => v !== null),
      );
      expect(styleValues.length).toBeGreaterThan(0); // the corpus DOES exercise `style`
      for (const value of styleValues) {
        expect(hasDeniedMathStyleToken(value), `false positive on real style: "${value}"`).toBe(false);
      }
    });

    it('sanitizeMath is byte-identical (a no-op) on every real corpus formula', () => {
      // The strongest form of "zero-strip": not merely "nothing looks stripped", but the
      // sanitized string equals the engine's own output, character for character — modulo
      // DOMPurify's own SERIALIZATION choice (measured, not a stripping difference): a
      // literal U+00A0 non-breaking space round-trips through DOMPurify's parser as the
      // named entity `&nbsp;`. Both render and select identically; nothing was removed.
      const normalize = (s: string): string => s.replace(/&nbsp;/g, ' ');
      for (const { entry, html } of rendered) {
        expect(normalize(sanitizeMath(html)), `${entry.label} was altered by sanitizeMath`).toBe(html);
      }
    });

    it('the real style property vocabulary is exactly what the doc comment names', () => {
      const props = new Set<string>();
      for (const { html } of rendered) {
        for (const el of elementsOf(html)) {
          const style = el.getAttribute('style');
          if (!style) continue;
          for (const decl of style.split(';')) {
            const prop = decl.split(':')[0]?.trim();
            if (prop) props.add(prop);
          }
        }
      }
      expect([...props].sort()).toEqual(
        [
          'border', 'bottom', 'color', 'display', 'left', 'math-depth', 'padding',
          'padding-left', 'padding-right', 'position', 'right', 'transform', 'width',
        ].sort(),
      );
    });
  });

  describe('the hostile corpus is neutralized', () => {
    it('drops a MathML element the survey found absent (`mglyph`)', () => {
      const out = sanitizeMath('<math><mglyph src="evil.png"/><mi>x</mi></math>');
      expect(survivingElements(out, 'mglyph')).toEqual([]);
      expect(out).toContain('<mi>x</mi>');
    });

    it('drops `<annotation>` outright — carried markup does not survive as markup', () => {
      const out = sanitizeMath(
        '<math><semantics><mi>x</mi>' +
          '<annotation encoding="application/x-tex"><b onclick="alert(1)">hi</b></annotation>' +
          '</semantics></math>',
      );
      expect(survivingElements(out, 'annotation')).toEqual([]);
      expect(survivingElements(out, 'semantics')).toEqual([]);
      expect(survivingElements(out, 'b')).toEqual([]);
      expect(out).not.toContain('onclick');
      expect(out).toContain('<mi>x</mi>');
    });

    it('drops a bare `<a>` (no anchor producer, trust:false closes every route anyway)', () => {
      const out = sanitizeMath('<math><mi>x</mi><a href="javascript:alert(1)">click</a></math>');
      expect(survivingElements(out, 'a')).toEqual([]);
      expect(out).not.toContain('javascript:');
    });

    it('strips an attempted `href`/`src` on an otherwise-allowed element', () => {
      const out = sanitizeMath(
        '<math><mi href="javascript:alert(1)" src="https://evil.example/x">x</mi></math>',
      );
      expect(survivingAttrs(out, (name) => name === 'href' || name === 'src')).toEqual([]);
      expect(out).toContain('<mi>x</mi>');
    });

    it('strips a `style` value carrying a `url(` token, keeping the element', () => {
      const out = sanitizeMath('<math><mi style="color:red;background:url(http://evil.example/x)">x</mi></math>');
      expect(survivingAttrValues(out, (v) => /url\(/i.test(v))).toEqual([]);
      expect(out).toContain('<mi>x</mi>');
    });

    it('strips a `style` value carrying an `expression(` token', () => {
      const out = sanitizeMath('<math><mi style="width:expression(alert(1))">x</mi></math>');
      expect(survivingAttrValues(out, (v) => /expression\(/i.test(v))).toEqual([]);
      expect(out).toContain('<mi>x</mi>');
    });

    it('does NOT over-strip a value that merely CONTAINS the substring `url(` mid-identifier', () => {
      // Boundary check: `curl(` must not be mistaken for `url(` the way `cleanSvgCss`'s
      // own CSS_IDENT_CHAR test guards against for the SVG profile.
      expect(hasDeniedMathStyleToken('color:curl(1)')).toBe(false);
      const out = sanitizeMath('<math><mi style="color:red">x</mi></math>');
      expect(out).toBe('<math><mi style="color:red">x</mi></math>');
    });

    it('a fresh NO-HOOK DOMPurify instance still denies url()/expression() — the ALLOW-LIST is not the only thing standing between an attacker and a fetch', () => {
      // Unlike the data: URI denial (allow-list-driven, hook-independent, §2.2), this
      // filter genuinely IS the hook: `style` is admitted by the allow-list itself, so a
      // no-hook run must NOT be clean. Proves the hook is load-bearing, not decorative.
      const noHook = DOMPurify(window);
      const out = noHook.sanitize(
        '<math><mi style="background:url(http://evil.example/x)">x</mi></math>',
        SANITIZE_MATH_CONFIG,
      ) as string;
      expect(
        survivingAttrValues(out, (v) => /url\(/i.test(v)),
        'url() survived WITHOUT the hook — the hook is load-bearing here, unlike the data: denial',
      ).not.toEqual([]);
    });
  });

  describe('safe formula-generated HTML is preserved (we do not over-strip)', () => {
    it('keeps a plain rendered fraction intact', () => {
      const html = temml.renderToString(String.raw`\frac{a}{b}`, { throwOnError: true, displayMode: true });
      expect(sanitizeMath(html)).toBe(html);
    });

    it('keeps the accessible-name-bearing tree (ALLOW_ARIA_ATTR: true is load-bearing)', () => {
      const html = '<math aria-label="x over y"><mfrac><mi>x</mi><mi>y</mi></mfrac></math>';
      const out = sanitizeMath(html);
      expect(out).toContain('aria-label="x over y"');
    });

    it('keeps `class` generically, by name, with no value enumeration', () => {
      const html = '<math class="tml-display tml-jot custom-future-class"><mi>x</mi></math>';
      expect(sanitizeMath(html)).toBe(html);
    });
  });

  describe('the three profiles are independent', () => {
    it('markdown source still cannot produce a <math> through the document profile', () => {
      expect(sanitize('<math><mi>x</mi></math>')).toBe('');
    });

    it('the document profile is not widened by the math profile existing', () => {
      sanitizeMath('<math><mi style="background:url(http://evil.example/x)">x</mi></math>');
      expect(sanitize('<math><mi>x</mi></math>')).toBe('');
      // `div` and `style` are still both absent from the document profile — a leaked
      // math-profile allowance would show up here first.
      expect(sanitize('<div style="color:red">x</div>')).toBe('x');
    });

    it('the SVG profile is not widened by the math profile existing, and vice versa', () => {
      expect(survivingElements(sanitizeSvg('<svg><math><mi>x</mi></math></svg>'), 'math')).toEqual([]);
      expect(survivingElements(sanitizeMath('<math><svg><rect/></svg></math>'), 'svg')).toEqual([]);
    });

    it('the mathStyleHook does not leak onto a later sanitizeSvg/sanitize call', () => {
      sanitizeMath('<math><mi style="background:url(http://evil.example/x)">x</mi></math>');
      // `style` is not admitted by either other profile, so this is really testing that no
      // stray hook throws or otherwise misbehaves outside its own scoped call.
      expect(sanitize('<p style="color:red">hi</p>')).toBe('<p>hi</p>');
      expect(
        survivingElements(sanitizeSvg('<svg><style>.a{fill:red}</style></svg>'), 'style'),
      ).toHaveLength(1);
    });
  });

  // ── THE BYTE-UNTOUCHED PIN (this profile's own consts, additive-only going forward) ──
  describe('the math profile source is reviewable as data (source-text pin)', () => {
    const SOURCE = readFileSync(resolve(process.cwd(), 'src/render/sanitize.ts'), 'utf8');

    function declarationSource(name: string, terminator: string): string {
      const start = SOURCE.indexOf(`export const ${name}`);
      expect(start, `${name} declaration not found in sanitize.ts`).toBeGreaterThan(-1);
      const end = SOURCE.indexOf(terminator, start);
      expect(end, `${name} has no ${terminator} terminator in sanitize.ts`).toBeGreaterThan(-1);
      return SOURCE.slice(start, end + terminator.length);
    }

    it('MATH_ALLOWED_TAGS matches the exported array, source and runtime in lockstep', () => {
      const src = declarationSource('MATH_ALLOWED_TAGS', '] as const;');
      for (const tag of MATH_ALLOWED_TAGS) expect(src).toContain(`'${tag}'`);
    });

    it('the pin reads the real file (the control that fires)', () => {
      expect(SOURCE).toContain('export function sanitizeMath(html: string): string');
      expect(SOURCE).toContain('MATH_STYLE_DENIED_TOKENS');
    });
  });
});

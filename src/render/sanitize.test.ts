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

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import DOMPurify from 'dompurify';
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

describe('sanitizeSvg — the SVG profile (D-1)', () => {
  describe('the allow-list is the reviewed data (guards against silent drift)', () => {
    it('exposes the exact SVG_ALLOWED_TAGS set', () => {
      expect([...SVG_ALLOWED_TAGS]).toEqual([
        'svg', 'g', 'defs', 'symbol', 'use', 'clipPath',
        'path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon',
        'text', 'tspan',
        'marker', 'linearGradient', 'stop',
        'title', 'desc',
      ]);
    });

    it('denies the dangerous elements BY ABSENCE, not by a FORBID list', () => {
      // The mechanism is the point: there is no FORBID list to read, so the only
      // way these can come back is by being ADDED here, in a reviewed diff.
      for (const denied of ['foreignObject', 'style', 'script', 'a', 'image', 'switch', 'filter']) {
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

    it('drops @import in <style> — the element goes, so the rule goes with it', () => {
      const out = sanitizeSvg(
        '<svg xmlns="http://www.w3.org/2000/svg"><style>' +
          '@import url("http://evil.example/x.css"); .n { fill: red }' +
          '</style><g class="n"><rect width="10" height="10" /></g></svg>',
      );
      expect(survivingStyleText(out)).toEqual([]);
      expect(out).not.toContain('@import');
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
        expect(survivingRemoteRefs(sanitizeSvg(svg)), svg).toEqual([]);
      }
      // The control: the predicate FIRES on the same markup unsanitized, so an
      // empty sweep is a result and not a broken predicate (retro finding 1).
      expect(survivingRemoteRefs(corpus[1])).toEqual([
        '<use href="http://evil.example/b#x">',
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
  });
});

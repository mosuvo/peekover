// @vitest-environment jsdom
//
// The sanitize stage is security-critical, so its tests run against a real DOM
// (jsdom) — the environment DOMPurify itself is validated against — rather than a
// partial shim. Two halves: every malicious fixture must be NEUTRALIZED, and safe
// markdown-generated HTML must be PRESERVED (proving we don't over-strip → never a
// blank page).

import { describe, it, expect } from 'vitest';
import {
  sanitize,
  ALLOWED_TAGS,
  ALLOWED_ATTR,
  ALLOWED_URI_REGEXP,
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

    it('exposes the exact ALLOWED_ATTR set', () => {
      expect([...ALLOWED_ATTR]).toEqual([
        'href', 'src', 'alt', 'title', 'class',
        'type', 'checked', 'disabled',
        'colspan', 'rowspan',
        'id', 'align',
      ]);
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

    it('drops style/align inline styling from a table cell but keeps the cell', () => {
      // markdown-it emits alignment as inline `style` (stripped); the cell text
      // and structure must remain — degradation, not deletion.
      const out = sanitize(parse('| L |\n|:--|\n| x |'));
      expect(out).not.toContain('style=');
      expect(out).toContain('<td>x</td>');
    });
  });
});

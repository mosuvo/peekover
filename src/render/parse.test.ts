import { describe, it, expect } from 'vitest';
import { parse } from './parse';

describe('parse — markdown-it GFM stage', () => {
  describe('CommonMark basics', () => {
    it('renders ATX headings h1–h6', () => {
      const html = parse('# H1\n\n###### H6');
      expect(html).toContain('<h1>H1</h1>');
      expect(html).toContain('<h6>H6</h6>');
    });

    it('renders bold and italic', () => {
      const html = parse('**bold** and *italic*');
      expect(html).toContain('<strong>bold</strong>');
      expect(html).toContain('<em>italic</em>');
    });

    it('renders unordered and ordered lists', () => {
      expect(parse('- a\n- b')).toContain('<ul>');
      const ol = parse('1. first\n2. second');
      expect(ol).toContain('<ol>');
      expect(ol).toContain('<li>first</li>');
    });

    it('renders a blockquote', () => {
      expect(parse('> quoted')).toContain('<blockquote>');
    });

    it('renders a paragraph link', () => {
      expect(parse('[text](https://example.com)')).toContain(
        '<a href="https://example.com">text</a>',
      );
    });

    // CommonMark sanity: HTML-significant characters in text are escaped.
    it('escapes literal < & > in plain text (CommonMark)', () => {
      const html = parse('5 < 6 & 7 > 4');
      expect(html).toContain('5 &lt; 6 &amp; 7 &gt; 4');
    });
  });

  describe('GFM set', () => {
    it('renders a pipe table with thead/tbody', () => {
      const html = parse('| a | b |\n|---|---|\n| 1 | 2 |');
      expect(html).toContain('<table>');
      expect(html).toContain('<thead>');
      expect(html).toContain('<tbody>');
      expect(html).toContain('<th>a</th>');
      expect(html).toContain('<td>1</td>');
    });

    it('renders strikethrough (markdown-it emits <s>)', () => {
      expect(parse('~~gone~~')).toContain('<s>gone</s>');
    });

    it('autolinks a bare URL via linkify', () => {
      expect(parse('see https://example.com now')).toContain(
        '<a href="https://example.com">https://example.com</a>',
      );
    });

    it('autolinks a CommonMark angle-bracket URL', () => {
      expect(parse('<https://example.com>')).toContain(
        '<a href="https://example.com">https://example.com</a>',
      );
    });
  });

  describe('task lists', () => {
    it('renders an unchecked task-list checkbox that is DISABLED', () => {
      const html = parse('- [ ] todo');
      expect(html).toContain('type="checkbox"');
      expect(html).toContain('disabled');
      // No write-back in M1 → must not be interactive.
      expect(html).not.toContain('enabled');
    });

    it('renders a checked task-list checkbox that is also disabled', () => {
      const html = parse('- [x] done');
      expect(html).toContain('checked');
      expect(html).toContain('disabled');
    });

    it('tags the list and items with task-list classes', () => {
      const html = parse('- [ ] a\n- [x] b');
      expect(html).toContain('contains-task-list');
      expect(html).toContain('task-list-item');
    });
  });

  describe('fenced code — plain, NO highlighting (Shiki is a later milestone)', () => {
    it('wraps a fenced block in <pre><code> with a language class only', () => {
      const html = parse('```js\nconst x = 1;\n```');
      expect(html).toContain('<pre><code class="language-js">');
      expect(html).toContain('const x = 1;');
      // Highlighting would inject <span> tokens — assert there are none.
      expect(html).not.toContain('<span');
    });

    it('escapes markup inside a code fence', () => {
      const html = parse('```\n<script>alert(1)</script>\n```');
      expect(html).toContain('&lt;script&gt;');
    });
  });

  describe('inline HTML passthrough (html: true)', () => {
    // The parse stage intentionally does NOT sanitize — it lets raw HTML through
    // for the sanitize stage to neutralize. This asserts the passthrough exists.
    it('passes a raw inline <script> through unescaped', () => {
      expect(parse('<script>alert(1)</script>')).toContain(
        '<script>alert(1)</script>',
      );
    });
  });
});

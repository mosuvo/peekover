// @vitest-environment jsdom
//
// The mount stage composes the real parse -> sanitize pipeline into a shadow
// root. These tests run against jsdom (a real DOM, matching DOMPurify's own
// validation environment) and exercise: correct rendered output, that the output
// is sanitized, that re-render is idempotent (no duplicate roots / stale content),
// and that the media seam is a no-op in M1. The throw -> raw-fallback path lives
// in mount.fallback.test.ts (it needs a mocked stage).

import { describe, it, expect } from 'vitest';
import { mount, applyMediaPolicy } from './mount';

function makeHost(): HTMLElement {
  const host = document.createElement('peekover-root');
  document.body.appendChild(host);
  return host;
}

describe('mount — parse -> sanitize -> shadow DOM', () => {
  it('mounts rendered HTML into an OPEN shadow root', () => {
    const host = makeHost();
    mount('# Title\n\n- one\n- two', host);

    expect(host.shadowRoot).not.toBeNull();
    // Open root is inspectable — the whole point of mode:'open'.
    const shadow = host.shadowRoot!;
    expect(shadow.querySelector('h1')?.textContent).toBe('Title');
    const items = shadow.querySelectorAll('li');
    expect([...items].map((li) => li.textContent)).toEqual(['one', 'two']);
  });

  it('renders formatted HTML, not raw text (bold, headings survive)', () => {
    const host = makeHost();
    mount('## Sub\n\nsome **bold** text', host);
    const shadow = host.shadowRoot!;
    expect(shadow.querySelector('h2')?.textContent).toBe('Sub');
    expect(shadow.querySelector('strong')?.textContent).toBe('bold');
  });

  it('sanitizes: a <script> payload never reaches the DOM, benign text survives', () => {
    const host = makeHost();
    mount('ok text\n\n<script>alert(1)</script>', host);
    const shadow = host.shadowRoot!;
    expect(shadow.querySelector('script')).toBeNull();
    expect(shadow.innerHTML).not.toContain('alert(');
    expect(shadow.textContent).toContain('ok text');
  });

  it('is idempotent: re-render replaces content with no duplicate roots', () => {
    const host = makeHost();
    mount('# First', host);
    const firstRoot = host.shadowRoot;

    mount('# Second\n\n- x', host);
    const shadow = host.shadowRoot!;

    // Same shadow root instance reused (attachShadow only ever called once).
    expect(host.shadowRoot).toBe(firstRoot);
    // Exactly one reader root — old content fully replaced, not appended.
    expect(shadow.querySelectorAll('.peekover-reader').length).toBe(1);
    expect(shadow.querySelectorAll('h1').length).toBe(1);
    expect(shadow.querySelector('h1')?.textContent).toBe('Second');
    expect(shadow.textContent).not.toContain('First');
  });

  it('keeps a rendered <img> intact in M1 (media seam is a no-op)', () => {
    const host = makeHost();
    mount('![alt](https://example.com/i.png)', host);
    const img = host.shadowRoot!.querySelector('img');
    expect(img).not.toBeNull();
    expect(img?.getAttribute('src')).toBe('https://example.com/i.png');
  });

  it('applyMediaPolicy does not throw and leaves images untouched (M1 seam)', () => {
    const root = document.createElement('div');
    root.innerHTML = '<img src="https://example.com/a.png"><img src="https://example.com/b.png">';
    expect(() => applyMediaPolicy(root)).not.toThrow();
    expect(root.querySelectorAll('img').length).toBe(2);
    expect(root.querySelector('img')?.getAttribute('src')).toBe('https://example.com/a.png');
  });
});

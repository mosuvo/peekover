// @vitest-environment jsdom
//
// The never-blank fallback (AGENTS.md #5). We force the parse stage to throw so
// mount() must degrade to showing the RAW source as escaped plain text — never a
// blank page, and never as parsed HTML. Isolated in its own file because it mocks
// './parse'; mount.test.ts exercises the real pipeline.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Hoisted above the import of ./mount, so mount() binds to the throwing parse.
vi.mock('./parse', () => ({
  parse: () => {
    throw new Error('forced parse failure');
  },
}));

import { mount } from './mount';

describe('mount — fallback when a stage throws (never a blank page)', () => {
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => {
    warn.mockRestore();
  });

  it('shows the raw source as escaped text, not blank and not parsed as HTML', () => {
    const host = document.createElement('peekover-root');
    document.body.appendChild(host);

    const source = '# hi <script>alert(1)</script>\n\n**not bold here**';
    mount(source, host);

    const shadow = host.shadowRoot!;
    // Not blank.
    expect(shadow.childNodes.length).toBeGreaterThan(0);
    const pre = shadow.querySelector('pre.peekover-raw');
    expect(pre).not.toBeNull();
    // Raw source shown verbatim (textContent === source, escaping preserved).
    expect(pre?.textContent).toBe(source);
    // The <script> in the source is inert — escaped text, no live element.
    expect(shadow.querySelector('script')).toBeNull();
    expect(shadow.innerHTML).toContain('&lt;script&gt;');
    // Markdown was NOT rendered (fallback shows raw, not formatted).
    expect(shadow.querySelector('h1')).toBeNull();
    expect(shadow.querySelector('strong')).toBeNull();
    // Dev-only warning fired.
    expect(warn).toHaveBeenCalled();
  });

  it('shows a quiet error banner above the raw source, and no toggle-able mode', () => {
    const host = document.createElement('peekover-root');
    document.body.appendChild(host);

    mount('# whatever', host);

    const shadow = host.shadowRoot!;
    // Failure path = raw + a themed banner (AGENTS.md #5, upgraded from a dev warn).
    const banner = shadow.querySelector('.peekover-alert');
    expect(banner).not.toBeNull();
    expect(banner?.textContent).toBe("Couldn't render this document — showing raw source.");
    // Quiet/polite, not an assertive alarm.
    expect(banner?.getAttribute('role')).toBe('status');
    // Distinguishable from a user-chosen Raw view: failure carries NO data-mode
    // (there is no rendered reading view to toggle to), so the shortcut stays inert.
    expect(host.hasAttribute('data-mode')).toBe(false);
    // The raw source is still shown (never a blank page).
    expect(shadow.querySelector('pre.peekover-raw')?.textContent).toBe('# whatever');
  });

  it('fallback is idempotent too (re-render leaves one root)', () => {
    const host = document.createElement('peekover-root');
    document.body.appendChild(host);

    mount('first', host);
    mount('second', host);

    const shadow = host.shadowRoot!;
    expect(shadow.querySelectorAll('pre.peekover-raw').length).toBe(1);
    expect(shadow.querySelector('pre')?.textContent).toBe('second');
  });
});

// @vitest-environment jsdom
//
// The reader theme runtime: the stylesheet carries the tokens (scoped to the shadow
// root, values from design/tokens.css) and the OS color scheme is applied as a
// data-theme attribute on the host. matchMedia is absent in jsdom, so these tests
// stub it to drive the light/dark branch deterministically.

import { describe, it, expect, afterEach } from 'vitest';
import { buildReaderStyle, applyColorScheme, initReaderRuntime } from './reader';

/** Install a matchMedia stub that reports the given dark-mode preference. */
function stubMatchMedia(dark: boolean): void {
  // Minimal MediaQueryList: enough for prefersDark() + the change listener.
  (window as unknown as { matchMedia: (q: string) => object }).matchMedia = (query: string) => ({
    matches: dark && query.includes('dark'),
    media: query,
    addEventListener() {},
    removeEventListener() {},
  });
}

afterEach(() => {
  delete (window as unknown as { matchMedia?: unknown }).matchMedia;
});

describe('reader theme — stylesheet + tokens', () => {
  it('builds a <style> carrying tokens scoped to :host (not the page)', () => {
    const style = buildReaderStyle();
    expect(style.tagName).toBe('STYLE');
    const css = style.textContent ?? '';
    // Scoped to the shadow root, never :root / the host page.
    expect(css).toContain(':host');
    expect(css).not.toContain(':root');
    // Light + dark token values, verbatim from design/tokens.css.
    expect(css).toContain('--paper:#FBFBF8');
    expect(css).toContain('--ink:#16171F');
    expect(css).toContain('--paper:#12141C'); // dark paper
    expect(css).toContain('--ink:#EAEBF3'); // dark ink
    // Reader typography: Literata body + the 76ch column.
    expect(css).toContain('Literata');
    expect(css).toContain('76ch');
  });

  it('keeps on-highlighter text as a literal hex, never var(--ink) (trap guard)', () => {
    const css = buildReaderStyle().textContent ?? '';
    // mark uses a literal dark hex so it stays legible on yellow in dark mode.
    expect(css).toMatch(/mark\{background:var\(--hl\);color:#26210a/);
  });
});

describe('reader theme — auto light/dark from OS', () => {
  it('sets data-theme=light when the OS is not dark', () => {
    stubMatchMedia(false);
    const host = document.createElement('peekover-root');
    applyColorScheme(host);
    expect(host.getAttribute('data-theme')).toBe('light');
  });

  it('sets data-theme=dark when the OS prefers dark', () => {
    stubMatchMedia(true);
    const host = document.createElement('peekover-root');
    applyColorScheme(host);
    expect(host.getAttribute('data-theme')).toBe('dark');
  });

  it('defaults to light and never throws where matchMedia is absent', () => {
    const host = document.createElement('peekover-root');
    expect(() => applyColorScheme(host)).not.toThrow();
    expect(host.getAttribute('data-theme')).toBe('light');
  });

  it('initReaderRuntime wires fonts + theme without throwing', () => {
    stubMatchMedia(true);
    const host = document.createElement('peekover-root');
    document.body.appendChild(host);
    expect(() => initReaderRuntime(host)).not.toThrow();
    expect(host.getAttribute('data-theme')).toBe('dark');
  });
});

// @vitest-environment jsdom
//
// The reader theme runtime: the stylesheet carries the tokens (scoped to the shadow
// root, values from design/tokens.css) and the OS color scheme is applied as a
// data-theme attribute on the host. matchMedia is absent in jsdom, so these tests
// stub it to drive the light/dark branch deterministically.

import { describe, it, expect, afterEach } from 'vitest';
import {
  buildReaderStyle,
  applyColorScheme,
  initReaderRuntime,
  setThemeSetting,
  currentEffectiveTheme,
  currentThemeSettingForTest,
} from './reader';
import { resetThemeHostsForTest } from './themeRegistry';

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
  // The theme runtime holds the current setting as MODULE state (see reader.ts's header on
  // why it lives there until the port arrives in 4.2/5.1), so a test that changes it would
  // otherwise leak into the next one. Reset both it and the host registry.
  setThemeSetting('auto');
  resetThemeHostsForTest();
  document.body.replaceChildren();
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

// The 004 addition: the theme is the SETTING resolved against the OS, not the OS alone. The
// OS-flip half of this is jsdom-blind (a page cannot fake `prefers-color-scheme`) and is proven
// against a REAL emulated OS flip in tests/browser/themeRuntime.browser.test.ts; what is
// asserted here is the pure resolution + broadcast wiring.
describe('reader theme — setting resolved against the OS (004)', () => {
  it('defaults to the auto setting, so M1 OS-driven behavior is preserved', () => {
    stubMatchMedia(true);
    expect(currentThemeSettingForTest()).toBe('auto');
    expect(currentEffectiveTheme()).toBe('dark'); // auto follows the OS
  });

  it('a manual setting pins the effective theme against the OS', () => {
    stubMatchMedia(true); // OS says dark...
    setThemeSetting('light'); // ...user says light
    expect(currentEffectiveTheme()).toBe('light');
  });

  it('setThemeSetting re-themes every registered host at once (shell + reader coherence)', () => {
    stubMatchMedia(false);
    const reader = document.createElement('peekover-root');
    const shell = document.createElement('div'); // stands in for the .peekover-app shell root
    document.body.append(reader, shell);
    initReaderRuntime(reader);
    // The shell root registers itself in mountAppShell (3.3); register it directly here.
    initReaderRuntime(shell);
    expect(reader.getAttribute('data-theme')).toBe('light');

    setThemeSetting('dark');

    expect(reader.getAttribute('data-theme')).toBe('dark');
    expect(shell.getAttribute('data-theme')).toBe('dark');
  });

  it('applyColorScheme on a fresh host reflects the manual setting, not the OS', () => {
    stubMatchMedia(true);
    setThemeSetting('light');
    const host = document.createElement('peekover-root');
    applyColorScheme(host);
    expect(host.getAttribute('data-theme')).toBe('light');
  });
});

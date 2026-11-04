// Task 2.1 — the PURE settings vocabulary: `resolveTheme` (setting × OS → effective) + the
// default shape. Pure logic over plain values, so it lives in the fast unit project (no jsdom
// pragma — it never touches the DOM, `matchMedia`, or IndexedDB). The engine-dependent parts of
// group 2 (persistence, messaging) are proven in the real-engine browser project instead.

import { describe, it, expect } from 'vitest';
import {
  resolveTheme,
  DEFAULT_SETTINGS,
  type ThemeSetting,
  type EffectiveTheme,
} from './settings';

describe('resolveTheme — setting × OS → effective (pure, total)', () => {
  it('auto follows the OS: dark when the OS is dark, light when the OS is light', () => {
    expect(resolveTheme('auto', false)).toBe('light');
    expect(resolveTheme('auto', true)).toBe('dark');
  });

  it('a MANUAL theme ignores the OS entirely — returns itself in BOTH OS states (§4 rule)', () => {
    // The core "manual wins over auto" property: osDark must not change the answer for a manual
    // setting. Covers light, dark, AND sepia (sepia is deferred from the 004 UI but the resolver
    // is surface-neutral to it, so the rule is proven now).
    const manual: EffectiveTheme[] = ['light', 'dark', 'sepia'];
    for (const setting of manual) {
      expect(resolveTheme(setting, false)).toBe(setting); // OS light → still the manual value
      expect(resolveTheme(setting, true)).toBe(setting); // OS dark → still the manual value
    }
  });

  it('covers the full setting × OS matrix explicitly', () => {
    const cases: Array<[ThemeSetting, boolean, EffectiveTheme]> = [
      ['auto', false, 'light'],
      ['auto', true, 'dark'],
      ['light', false, 'light'],
      ['light', true, 'light'],
      ['dark', false, 'dark'],
      ['dark', true, 'dark'],
      ['sepia', false, 'sepia'],
      ['sepia', true, 'sepia'],
    ];
    for (const [setting, osDark, expected] of cases) {
      expect(resolveTheme(setting, osDark)).toBe(expected);
    }
  });
});

describe('DEFAULT_SETTINGS — the never-blank fallback shape', () => {
  it('is Auto theme, unset (null) TOC state, the Peekover code theme (013 5.8; formerly github-dark, D-9), and no last-used export format yet (D-6)', () => {
    expect(DEFAULT_SETTINGS).toEqual({
      theme: 'auto',
      tocOpen: null,
      tocWidth: null,
      codeTheme: 'peekover',
      lastExportFormat: 'html',
    });
  });
});

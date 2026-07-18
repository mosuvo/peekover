// themeControl — the PURE half, unit-tested (task 5.1).
//
// THE HONEST SPLIT. `nextThemeSetting` is the only real logic 5.1 introduces; everything else in
// themeControl.ts is DOM, and DOM is where this control's interesting failures live — does it
// render on both surfaces, does a click actually re-theme the host, does it collide with the
// other chrome, does it stay in sync when the setting changes elsewhere. None of that is
// provable in jsdom (no cascade, no layout, `getBoundingClientRect` is all zeroes), so it is
// proven in a real engine instead: tests/browser/themeControl.browser.test.ts, Chromium AND
// Firefox. This file deliberately does NOT re-stage those in jsdom — a jsdom "the click set the
// attribute" test would pass while the pill sat invisible under the TOC rail, which is precisely
// the M3 defect class the browser suite exists to catch.

import { describe, it, expect } from 'vitest';
import { nextThemeSetting, THEME_CYCLE, THEME_LABELS } from './themeControl';
import type { ThemeSetting } from '../settings/settings';

describe('nextThemeSetting — the cycle order', () => {
  it('cycles auto -> light -> dark -> auto', () => {
    expect(nextThemeSetting('auto')).toBe('light');
    expect(nextThemeSetting('light')).toBe('dark');
    expect(nextThemeSetting('dark')).toBe('auto');
  });

  it('returns to the start after exactly THEME_CYCLE.length steps from any member', () => {
    // A total-function property rather than three more hardcoded pairs: whatever the cycle is,
    // walking its full length must land back where it started (so the user can always reach
    // every option and get back). Catches an off-by-one or a duplicated entry.
    for (const start of THEME_CYCLE) {
      let setting: ThemeSetting = start;
      for (let i = 0; i < THEME_CYCLE.length; i += 1) setting = nextThemeSetting(setting);
      expect(setting).toBe(start);
    }
  });

  it('offers auto/light/dark ONLY — sepia is deferred (D-1 = A)', () => {
    expect([...THEME_CYCLE]).toEqual(['auto', 'light', 'dark']);
    expect(THEME_CYCLE).not.toContain('sepia');
  });

  it('escapes to the first entry from a setting OUTSIDE the cycle', () => {
    // `sepia` is a valid ThemeSetting the type still carries, so persistence could hold it (a
    // future build, or a hand-edited row). Landing on it must not strand the user on a value
    // the control cannot cycle out of — indexOf -1 makes the next step the first entry.
    expect(nextThemeSetting('sepia')).toBe('auto');
  });
});

describe('THEME_LABELS', () => {
  it('names every ThemeSetting, including the deferred sepia', () => {
    // Every setting is displayable even if it is not offered, so a control handed an
    // out-of-cycle value renders its name rather than `undefined`.
    expect(THEME_LABELS).toEqual({
      auto: 'Auto',
      light: 'Light',
      dark: 'Dark',
      sepia: 'Sepia',
    });
  });
});

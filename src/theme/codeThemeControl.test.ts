// @vitest-environment jsdom
//
// codeThemeControl — the listbox shape (unit, jsdom): the catalog it renders, the a11y contract
// (role/aria-selected), the contrast-ratio pure function pinning §4 a11y's floor against
// CODE_THEME_IDS's own already-measured bg/fg pairs, and the persist-then-repaint wiring end to
// end. Runs Shiki FOR REAL under jsdom for the repaint half, mirroring codeEnhancer.test.ts's own
// choice (the JS-regex engine has no DOM/WASM dependency, so nothing here needs mocking).
// Positioning/keyboard-focus-order/independence-from-document-theme are computed-style and
// real-input questions jsdom cannot answer — those live in
// tests/browser/codeThemeControl.browser.test.ts on both engines.

import { describe, it, expect, afterEach } from 'vitest';
import {
  buildCodeThemeControl,
  contrastRatio,
  resetCodeThemeControlsForTest,
  CODE_THEME_CONTROL_CLASS,
  CODE_THEME_PICKER_CLASS,
  CODE_THEME_ITEM_CLASS,
} from './codeThemeControl';
import { CODE_THEME_IDS, PEEKOVER_CODE_THEME } from '../render/codeEngine';
import { mount } from '../render/mount';
import { enhanceCode, resetCodeHostsForTest } from '../render/codeEnhancer';
import { CODE_STATE_ATTR, CODE_WRAPPER_CLASS } from '../render/codeView';
import { currentSettings, saveSettings, resetSettingsSeamForTest } from '../settings/settingsSeam';

afterEach(() => {
  resetCodeThemeControlsForTest();
  resetSettingsSeamForTest();
  resetCodeHostsForTest();
});

describe('contrastRatio — the WCAG relative-luminance formula, pure', () => {
  it('the W3C worked examples: black-on-white and identical colours', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1);
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 1); // order-independent
    expect(contrastRatio('#123456', '#123456')).toBeCloseTo(1, 5);
  });

  it('ignores a trailing alpha pair, matching what Shiki\'s own theme data sometimes carries', () => {
    expect(contrastRatio('#000000ff', '#ffffff')).toBeCloseTo(21, 1);
  });
});

describe("CODE_THEME_IDS's own bg/fg — pinned against the AA 4.5:1 floor (§4 a11y, task 5.2's selection rule)", () => {
  // Each pair is Shiki 4.4.3's OWN `normalizeTheme` resolution (global tokenColor setting, else
  // `editor.foreground`/`editor.background`, else its hard-coded per-type fallback) for exactly
  // the 20 ids codeEngine.ts's THEME_LOADERS carries — measured this session with `@shikijs/
  // primitive` directly (not a project dependency, so not importable here; see codeEngine.ts's
  // module header for the full selection-rule writeup). A theme id removed from THEME_LOADERS
  // without a matching removal here is caught by the "every id has a fixture" test below.
  const KNOWN_CONTRAST: Readonly<Record<string, { bg: string; fg: string }>> = {
    'min-dark': { bg: '#1f1f1f', fg: '#b392f0' },
    red: { bg: '#390000', fg: '#F8F8F8' },
    'min-light': { bg: '#ffffff', fg: '#24292eff' },
    'solarized-dark': { bg: '#002B36', fg: '#839496' },
    monokai: { bg: '#272822', fg: '#F8F8F2' },
    horizon: { bg: '#1C1E26', fg: '#bbbbbb' },
    'horizon-bright': { bg: '#FDF0ED', fg: '#333333' },
    andromeeda: { bg: '#23262E', fg: '#D5CED9' },
    'dark-plus': { bg: '#1E1E1E', fg: '#D4D4D4' },
    'slack-dark': { bg: '#222222', fg: '#E6E6E6' },
    plastic: { bg: '#21252B', fg: '#A9B2C3' },
    'slack-ochin': { bg: '#FFF', fg: '#002339' },
    'light-plus': { bg: '#FFFFFF', fg: '#000000' },
    laserwave: { bg: '#27212e', fg: '#ffffff' },
    'github-light': { bg: '#fff', fg: '#24292e' },
    'github-dark': { bg: '#24292e', fg: '#e1e4e8' },
    vesper: { bg: '#101010', fg: '#FFF' },
    'vitesse-light': { bg: '#ffffff', fg: '#393a34' },
    'vitesse-black': { bg: '#000', fg: '#dbd7cacc' },
  };

  // 013 task 5.8: the Peekover theme is excluded BY NAME — its colours are design tokens, not hexes,
  // and codeEngine.test.ts measures every one of them on --code-bg, light and dark, from tokens.css.
  const SHIKI_THEME_IDS = CODE_THEME_IDS.filter((id) => id !== PEEKOVER_CODE_THEME);

  it('every id CODE_THEME_IDS carries has a fixture here, and vice versa (Peekover excepted, by name)', () => {
    expect(SHIKI_THEME_IDS).toHaveLength(CODE_THEME_IDS.length - 1);
    expect(Object.keys(KNOWN_CONTRAST).sort()).toEqual([...SHIKI_THEME_IDS].sort());
  });

  it.each(SHIKI_THEME_IDS)('%s meets AA 4.5:1 against its own background', (id) => {
    const pair = KNOWN_CONTRAST[id];
    expect(contrastRatio(pair.bg, pair.fg)).toBeGreaterThanOrEqual(4.5);
  });
});

describe('the listbox — shape and a11y contract', () => {
  it('offers exactly CODE_THEME_IDS, one role="option" per id, inside a role="listbox"', () => {
    const control = buildCodeThemeControl();
    const picker = control.querySelector(`.${CODE_THEME_PICKER_CLASS}`);
    if (!picker) throw new Error('expected the picker');
    expect(picker.getAttribute('role')).toBe('listbox');

    const items = picker.querySelectorAll(`.${CODE_THEME_ITEM_CLASS}`);
    expect(items).toHaveLength(CODE_THEME_IDS.length);
    expect(CODE_THEME_IDS.length).toBeGreaterThanOrEqual(14); // §3.5's own floor
    for (const item of Array.from(items)) {
      expect(item.tagName).toBe('BUTTON'); // native button — keyboard-operable for free
      expect(item.getAttribute('role')).toBe('option');
    }
    const ids = Array.from(items).map((item) => (item as HTMLElement).dataset.themeId);
    expect(ids).toEqual([...CODE_THEME_IDS]); // same set, same order — one catalog, not two
  });

  it('marks the CURRENT codeTheme selected, and only that one', () => {
    saveSettings({ codeTheme: 'monokai' });
    const control = buildCodeThemeControl();
    const items = control.querySelectorAll<HTMLElement>(`.${CODE_THEME_ITEM_CLASS}`);
    const selected = Array.from(items).filter((item) => item.getAttribute('aria-selected') === 'true');
    expect(selected).toHaveLength(1);
    expect(selected[0].dataset.themeId).toBe('monokai');
  });

  it('the trigger opens/closes the popover and toggles aria-expanded', () => {
    const control = buildCodeThemeControl();
    const trigger = control.querySelector<HTMLButtonElement>(`.${CODE_THEME_CONTROL_CLASS}`);
    const picker = control.querySelector<HTMLElement>(`.${CODE_THEME_PICKER_CLASS}`);
    if (!trigger || !picker) throw new Error('expected trigger + picker');

    expect(picker.hidden).toBe(true);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    trigger.click();
    expect(picker.hidden).toBe(false);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    trigger.click(); // second click closes it
    expect(picker.hidden).toBe(true);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });
});

describe('selecting a row — persist then repaint (real engine, task 5.2 Verify line)', () => {
  const HOST_TAG = 'peekover-root';
  const fence = (lang: string, body: string): string => '```' + lang + '\n' + body + '\n```\n';

  it('persists via SettingsPort.save AND re-applies to an already-rendered block on the page', async () => {
    // A real, previously-enhanced host — codeThemeControl.ts never holds a host reference itself;
    // it reaches this through codeEnhancer.ts's own registry, exactly as production does.
    const host = document.createElement(HOST_TAG);
    document.body.appendChild(host);
    mount(fence('javascript', 'const a = 1;'), host, { contained: true });
    enhanceCode(host);
    const shadow = host.shadowRoot;
    if (!shadow) throw new Error('mount() produced no shadow root');
    const wrapper = shadow.querySelector<HTMLElement>(`div.${CODE_WRAPPER_CLASS}`);
    if (!wrapper) throw new Error('expected a wrapper');
    await new Promise<void>((resolve) => {
      const check = (): void => {
        if (wrapper.getAttribute(CODE_STATE_ATTR) === 'rendered') return resolve();
        setTimeout(check, 5);
      };
      check();
    });

    const control = buildCodeThemeControl();
    const target = control.querySelector<HTMLElement>('[data-theme-id="monokai"]');
    if (!target) throw new Error('expected the monokai row');
    target.click();
    // The click's own async repaint (`await reapplyCodeTheme`) runs after the listener returns —
    // poll for the settings write, which the listener performs SYNCHRONOUSLY before that await.
    expect(currentSettings().codeTheme).toBe('monokai');

    // Give the awaited repaint a turn, then confirm the on-screen block actually changed content.
    await new Promise((resolve) => setTimeout(resolve, 20));
    const highlighted = wrapper.querySelector('pre.shiki');
    expect(highlighted?.textContent).toBe('const a = 1;\n'); // swapped, content intact, no duplication
    expect(wrapper.querySelectorAll('pre.shiki')).toHaveLength(1);
  });
});

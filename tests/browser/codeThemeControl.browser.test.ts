// The code-theme picker — the REAL-ENGINE proof (task 5.2, D-9), Chromium AND Firefox.
//
// WHY EVERYTHING INTERESTING IS HERE AND NOT IN JSDOM. `codeThemeControl.test.ts` proves the
// listbox's SHAPE (catalog, a11y attributes, the contrast fixture table) and exercises a real
// repaint under jsdom (the JS-regex engine has no DOM/WASM dependency, so it runs there too). What
// jsdom cannot answer: whether picking a theme repaints a REAL rendered block's COMPUTED colour
// (not just an inline style jsdom never applies as a cascade), and — the two properties tasks.md
// 5.2 names explicitly — independence from the document theme in BOTH directions, proven with a
// real `data-theme` attribute and a real computed colour, not a DOM-shape stand-in for either.
//
// THE SAVE PATH IS ASSERTED THROUGH AN INJECTED FAKE, AND THAT IS A REAL LIMIT — the same one
// `themeControl.browser.test.ts` names: this harness loads no unpacked extension, so there is no
// background service worker for `directPort(store).save` to reach. A fake sink registered through
// `settingsSeam.ts`'s own `registerSettingsSink` proves the control's half of the contract (it
// persists, once, with the chosen theme); the message actually reaching the background is 8.1.

import { describe, it, expect, vi, afterEach } from 'vitest';
import { mountAppShell, type AppStore } from '../../src/app/appShell';
import { mount } from '../../src/render/mount';
import { enhanceCode, resetCodeHostsForTest } from '../../src/render/codeEnhancer';
import { CODE_STATE_ATTR, CODE_WRAPPER_CLASS } from '../../src/render/codeView';
import {
  buildCodeThemeControl,
  resetCodeThemeControlsForTest,
  CODE_THEME_CONTROL_CLASS,
  CODE_THEME_PICKER_CLASS,
  CODE_THEME_ITEM_CLASS,
} from '../../src/theme/codeThemeControl';
import { registerThemeHost, resetThemeHostsForTest, applyTheme } from '../../src/theme/themeRegistry';
import {
  registerSettingsSink,
  resetSettingsSeamForTest,
  currentSettings,
} from '../../src/settings/settingsSeam';
import type { Settings } from '../../src/settings/settings';

const WRAPPER_SELECTOR = `div.${CODE_WRAPPER_CLASS}`;
const DOC = '```javascript\nfunction add(a, b) {\n  return a + b;\n}\n```\n';

const cleanup: HTMLElement[] = [];
afterEach(() => {
  for (const el of cleanup.splice(0)) el.remove();
  resetCodeHostsForTest();
  resetCodeThemeControlsForTest();
  resetThemeHostsForTest();
  resetSettingsSeamForTest();
});

/** A host enhanced directly — `codeRender.browser.test.ts`'s own `directHost` idiom — registered
 *  as a themed host too, so the independence tests have a real `data-theme` attribute to check. */
function directHost(markdown: string): ShadowRoot {
  const host = document.createElement('div');
  document.body.appendChild(host);
  cleanup.push(host);
  mount(markdown, host, { contained: true });
  registerThemeHost(host);
  enhanceCode(host);
  if (!host.shadowRoot) throw new Error('mount produced no shadow root');
  return host.shadowRoot;
}

/** Poll until every predicate holds or the timeout elapses — `codeRender.browser.test.ts`'s own
 *  `settled` helper. */
async function settled(check: () => void): Promise<void> {
  await vi.waitFor(check, { timeout: 5000, interval: 20 });
}

function mountControl(): { control: HTMLElement; trigger: HTMLButtonElement; picker: HTMLElement } {
  const control = buildCodeThemeControl();
  document.body.appendChild(control);
  cleanup.push(control);
  const trigger = control.querySelector<HTMLButtonElement>(`.${CODE_THEME_CONTROL_CLASS}`);
  const picker = control.querySelector<HTMLElement>(`.${CODE_THEME_PICKER_CLASS}`);
  if (!trigger || !picker) throw new Error('expected trigger + picker');
  return { control, trigger, picker };
}

function itemFor(picker: HTMLElement, id: string): HTMLButtonElement {
  const item = picker.querySelector<HTMLButtonElement>(`[data-theme-id="${id}"]`);
  if (!item) throw new Error(`expected a row for ${id}`);
  return item;
}

describe('the picker renders and is interactive', () => {
  it('opens on click, offers a real role="listbox" of options, closes on a second click', async () => {
    const { trigger, picker } = mountControl();
    expect(picker.hidden).toBe(true);
    trigger.click();
    expect(picker.hidden).toBe(false);
    expect(picker.getAttribute('role')).toBe('listbox');
    expect(picker.querySelectorAll('[role="option"]').length).toBeGreaterThanOrEqual(14);
    trigger.click();
    expect(picker.hidden).toBe(true);
  });

  it('is reachable by keyboard — a real button in the tab order, activates on click like Enter/Space would', () => {
    const { trigger, picker } = mountControl();
    trigger.focus();
    expect(document.activeElement).toBe(trigger);
    expect(trigger.tagName).toBe('BUTTON');
    expect(trigger.hasAttribute('tabindex')).toBe(false);

    trigger.click();
    const first = picker.querySelectorAll<HTMLButtonElement>(`.${CODE_THEME_ITEM_CLASS}`)[0];
    first.focus();
    expect(document.activeElement).toBe(first);
    expect(first.tagName).toBe('BUTTON');
    expect(first.hasAttribute('tabindex')).toBe(false); // native order, no roving tabindex
  });
});

/** A no-op store — `diffChrome.browser.test.ts`'s own `fakeStore()` shape — so mounting the real
 *  shell for a CSS-cascade check never touches real IndexedDB. */
function fakeStore(): AppStore {
  return {
    putFolder: async () => undefined,
    deleteFolder: async () => undefined,
    putRecent: async () => undefined,
  };
}

describe('under the REAL appShell stylesheet (the [hidden] cascade defect class)', () => {
  // `codeThemeControl.ts`'s own tests build the control standalone, with no stylesheet attached at
  // all — which is exactly how a real defect here slipped past them: APP_CSS's own
  // `.peekover-code-theme-picker{display:flex}` rule beats the UA `[hidden]{display:none}`
  // default unless APP_CSS ALSO carries an explicit `[hidden]` override (readerCss.ts's
  // diffChrome picker hit this same defect first — see appShell.ts's own comment beside the fix).
  // Only the REAL cascade, through the REAL mounted shell, can see it: a hidden popover that stays
  // visually `flex` is exactly what made an UNRELATED table's sort buttons unclickable this
  // session (`tableNetwork.browser.test.ts`, `<button data-theme-id="dark-plus">…</button> …
  // subtree intercepts pointer events`) — this suite pins that class of defect directly.
  it('the closed popover is display:none under the cascade, and does not intercept clicks elsewhere on the page', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    mountAppShell(container, { store: fakeStore() }); // no controller needed, just the header chrome
    try {
      const picker = container.querySelector<HTMLElement>(`.${CODE_THEME_PICKER_CLASS}`);
      const themeToggle = container.querySelector<HTMLButtonElement>('.peekover-theme-toggle');
      if (!picker || !themeToggle) throw new Error('expected the header controls');

      expect(picker.hidden).toBe(true);
      expect(getComputedStyle(picker).display).toBe('none'); // the cascade, not just the property

      // The defect class this pins: a `display:flex` popover sitting over the header would
      // intercept this click before it ever reached the button underneath it.
      themeToggle.click();
      expect(themeToggle.getAttribute('aria-label')).toContain('Activate for');
    } finally {
      container.remove();
    }
  });

  it('opening it flips the computed display away from none', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    mountAppShell(container, { store: fakeStore() }); // no controller needed, just the header chrome
    try {
      const trigger = container.querySelector<HTMLButtonElement>(`.${CODE_THEME_CONTROL_CLASS}`);
      const picker = container.querySelector<HTMLElement>(`.${CODE_THEME_PICKER_CLASS}`);
      if (!trigger || !picker) throw new Error('expected the header controls');

      trigger.click();
      expect(getComputedStyle(picker).display).not.toBe('none');
    } finally {
      container.remove();
    }
  });
});

describe('selecting a theme — persists and repaints (task 5.2 Verify line)', () => {
  it('persists via the registered settings sink, exactly once, with the chosen theme', async () => {
    const saved: Partial<Settings>[] = [];
    registerSettingsSink((patch) => saved.push(patch));
    const { picker, trigger } = mountControl();
    trigger.click();

    itemFor(picker, 'monokai').click();

    expect(saved).toEqual([{ codeTheme: 'monokai' }]);
    expect(currentSettings().codeTheme).toBe('monokai');
  });

  it('re-applies to every highlighted block on the page — a real computed colour change, not an inline-style stand-in', async () => {
    const shadow = directHost(DOC);
    const wrapper = shadow.querySelector<HTMLElement>(WRAPPER_SELECTOR);
    if (!wrapper) throw new Error('expected a wrapper');
    await settled(() => expect(wrapper.getAttribute(CODE_STATE_ATTR)).toBe('rendered'));
    const span = wrapper.querySelector<HTMLElement>('pre.shiki code span[style*="color"]');
    if (!span) throw new Error('expected a coloured token span');
    const before = getComputedStyle(span).color;

    const { picker, trigger } = mountControl();
    trigger.click();
    itemFor(picker, 'monokai').click();

    await settled(() => {
      const nowSpan = wrapper.querySelector<HTMLElement>('pre.shiki code span[style*="color"]');
      expect(nowSpan && getComputedStyle(nowSpan).color).not.toBe(before);
    });
    // Swapped, never duplicated.
    expect(wrapper.querySelectorAll('pre.shiki')).toHaveLength(1);
  });
});

describe('independence from the document theme — BOTH directions (§4, tasks.md 5.2 Verify line)', () => {
  it('flipping codeTheme leaves the document theme (data-theme) untouched', async () => {
    const shadow = directHost(DOC);
    const wrapper = shadow.querySelector<HTMLElement>(WRAPPER_SELECTOR);
    if (!wrapper) throw new Error('expected a wrapper');
    await settled(() => expect(wrapper.getAttribute(CODE_STATE_ATTR)).toBe('rendered'));

    const host = shadow.host as HTMLElement;
    applyTheme('light');
    expect(host.getAttribute('data-theme')).toBe('light');

    const { picker, trigger } = mountControl();
    trigger.click();
    itemFor(picker, 'monokai').click();
    await settled(() => expect(currentSettings().codeTheme).toBe('monokai'));

    expect(host.getAttribute('data-theme')).toBe('light'); // unchanged by the code-theme pick
  });

  it('flipping the document theme leaves an already-rendered block\'s colours untouched', async () => {
    const shadow = directHost(DOC);
    const wrapper = shadow.querySelector<HTMLElement>(WRAPPER_SELECTOR);
    if (!wrapper) throw new Error('expected a wrapper');
    await settled(() => expect(wrapper.getAttribute(CODE_STATE_ATTR)).toBe('rendered'));
    const span = wrapper.querySelector<HTMLElement>('pre.shiki code span[style*="color"]');
    if (!span) throw new Error('expected a coloured token span');
    const before = getComputedStyle(span).color;

    applyTheme('light');
    applyTheme('dark'); // a real document-theme flip, both directions once for good measure

    expect(getComputedStyle(span).color).toBe(before); // untouched by the document-theme flip
  });
});

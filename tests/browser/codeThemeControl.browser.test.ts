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

import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { page } from 'vitest/browser';
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
import type { FolderSource } from '../../src/app/folderSource';
import { getSettings, putSettings, __resetConnectionForTest, DB_NAME } from '../../src/app/store';
import { setThemeSetting } from '../../src/theme/reader';

// RULING C (the 4.0 census, 2026-11-02; 013 task 4.4): this file is not about the compact toolbar, so
// its window is WIDE — above the 863 px breakpoint, where the app controls sit in the toolbar
// instead of behind "⋯". KEEPS: each test's own property (C086, C088); RE-SPELLED at 4.4 by the
// window alone. The harness default (414 × 896) is restored after each test — the window is shared
// by every file that runs after this one.
beforeEach(async () => {
  await page.viewport(1280, 900);
});
afterEach(async () => {
  await page.viewport(414, 896);
});

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
function directHost(markdown: string, theme?: string): ShadowRoot {
  const host = document.createElement('div');
  document.body.appendChild(host);
  cleanup.push(host);
  mount(markdown, host, { contained: true });
  registerThemeHost(host);
  enhanceCode(host, theme === undefined ? {} : { theme });
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

  // KEEPS the property for the 19 Shiki themes (aurora-x removed at 013 7.2a), each with its own fixed colours. RE-SPELLED at 013 5.8
  // with an explicit Shiki theme: the default is now the Peekover theme, which FOLLOWS the page theme
  // by the human's 2.2 ruling (its own tests are below).
  it('flipping the document theme leaves an already-rendered block\'s colours untouched (a Shiki theme)', async () => {
    const shadow = directHost(DOC, 'monokai');
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

// ── 013 task 5.8: the Peekover code theme ───────────────────────────────────────────────────────
// Expected values are tokens.css's (light --code-bg #F1F1EB, dark #1C2030; --accent #16171F /
// #EAEBF3); codeEngine.test.ts measures every token colour's contrast, the census measures them as
// painted.
const RGB = {
  lightCodeBg: 'rgb(241, 241, 235)',
  darkCodeBg: 'rgb(28, 32, 48)',
  lightAccent: 'rgb(22, 23, 31)',
  darkAccent: 'rgb(234, 235, 243)',
  monokaiBg: 'rgb(39, 40, 34)',
};
const COMMENTED = '```javascript\n// a note\nconst a = 1;\n```\n';

describe('the Peekover theme follows the page theme (013 5.8; the 2.2 ruling)', () => {
  it('light → dark repaints the same rendered block from the tokens, with no re-highlight', async () => {
    const shadow = directHost(COMMENTED);
    const host = shadow.host as HTMLElement;
    applyTheme('light');
    await settled(() => expect(shadow.querySelector('[data-code="rendered"]')).not.toBeNull());
    const pre = shadow.querySelector<HTMLElement>('pre.shiki')!;
    const keyword = pre.querySelector<HTMLElement>('span[style*="--accent"]')!;
    expect(keyword.textContent).toBe('const');
    expect(getComputedStyle(pre).backgroundColor).toBe(RGB.lightCodeBg);
    expect(getComputedStyle(keyword).color).toBe(RGB.lightAccent);

    applyTheme('dark');
    expect(host.getAttribute('data-theme')).toBe('dark');
    expect(getComputedStyle(pre).backgroundColor).toBe(RGB.darkCodeBg);
    expect(getComputedStyle(keyword).color).toBe(RGB.darkAccent);
    expect(shadow.querySelector('pre.shiki'), 'the same block, not a re-highlight').toBe(pre);
  });

  it('keywords are weight 500 and comments italic (the 3.1 approval)', async () => {
    const shadow = directHost(COMMENTED);
    await settled(() => expect(shadow.querySelector('[data-code="rendered"]')).not.toBeNull());
    const keyword = shadow.querySelector<HTMLElement>('pre.shiki span[style*="--accent"]')!;
    const comment = shadow.querySelector<HTMLElement>('pre.shiki span[style*="--muted"]')!;
    expect(comment.textContent).toBe('// a note');
    expect(getComputedStyle(keyword).fontWeight).toBe('500');
    expect(getComputedStyle(comment).fontStyle).toBe('italic');
    // Default text is neither.
    const plain = [...shadow.querySelectorAll<HTMLElement>('pre.shiki .line > span')].find((s) => s.style.color === 'var(--ink)')!;
    expect(getComputedStyle(plain).fontWeight).toBe('400');
    expect(getComputedStyle(plain).fontStyle).toBe('normal');
  });
});

describe('the default and a saved choice on the app page — the real IndexedDB (013 5.8)', () => {
  afterEach(async () => {
    setThemeSetting('auto');
    __resetConnectionForTest();
    await new Promise((r) => setTimeout(r, 0));
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.deleteDatabase(DB_NAME);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  });

  /** The app page over the real settings store; opens one code-bearing file and waits for it. */
  async function appPageCode(expectTheme: string): Promise<HTMLElement> {
    const container = document.createElement('div');
    document.body.appendChild(container);
    cleanup.push(container);
    const store: AppStore = {
      putFolder: async () => undefined,
      deleteFolder: async () => undefined,
      putRecent: async () => undefined,
      getSettings,
      putSettings,
    };
    const source: FolderSource = {
      name: 'docs',
      truncated: false,
      persistable: false,
      files: [{ path: 'a.md', name: 'a.md', read: async () => COMMENTED }],
    };
    const app = mountAppShell(container, { openFolder: async () => ({ ok: true, source }), store });
    // The stored settings load as the page mounts; the file is opened once they have.
    await settled(() => expect(currentSettings().codeTheme).toBe(expectTheme));
    await app.openFolder();
    const item = await vi.waitFor(() => {
      const el = container.querySelector<HTMLButtonElement>('[role="treeitem"][data-kind="file"]');
      if (!el) throw new Error('no tree item yet');
      return el;
    });
    item.click();
    // Settled either way — rendered or failed — so a block left plain reads as that, not as a timeout.
    const host = await vi.waitFor(() => {
      const el = container.querySelector<HTMLElement>('.peekover-app__reader__host');
      if (!el?.shadowRoot?.querySelector('div[data-code="rendered"], div[data-code="failed"]')) throw new Error('not settled yet');
      return el;
    }, { timeout: 5000, interval: 20 });
    const state = host.shadowRoot!.querySelector<HTMLElement>(`div.${CODE_WRAPPER_CLASS}`)!.getAttribute(CODE_STATE_ATTR);
    expect(state, 'the block is highlighted, not left plain').toBe('rendered');
    return host.shadowRoot!.querySelector<HTMLElement>('pre.shiki')!;
  }

  for (const theme of ['light', 'dark'] as const) {
    it(`a user who never chose a code theme gets Peekover — ${theme}`, async () => {
      await putSettings({ theme }); // a stored row, with a page theme and no code-theme choice
      const pre = await appPageCode('peekover');
      expect(getComputedStyle(pre).backgroundColor, 'the code sits on --code-bg').toBe(theme === 'light' ? RGB.lightCodeBg : RGB.darkCodeBg);
      expect(pre.style.backgroundColor).toBe('var(--code-bg)');
    });
  }

  it('a user who chose monokai keeps it — across the default change and a re-mount', async () => {
    await putSettings({ codeTheme: 'monokai' });
    await putSettings({ theme: 'dark' }); // a later save of another field
    const first = await appPageCode('monokai');
    expect(getComputedStyle(first).backgroundColor).toBe(RGB.monokaiBg);
    for (const el of cleanup.splice(0)) el.remove();
    resetSettingsSeamForTest();
    const second = await appPageCode('monokai');
    expect(getComputedStyle(second).backgroundColor).toBe(RGB.monokaiBg);
    expect((await getSettings()).codeTheme).toBe('monokai');
  });

  // 013 task 7.3a: a saved id this build does not ship — aurora-x, removed at 7.2a — gets the default, as "never
  // chose" does. The saved value stays as it is (no silent rewrite): only a pick in the picker changes it.
  for (const theme of ['light', 'dark'] as const) {
    it(`a saved code theme this build does not ship (aurora-x) gets Peekover, and stays saved — ${theme}`, async () => {
      await putSettings({ theme, codeTheme: 'aurora-x' });
      const pre = await appPageCode('aurora-x');
      expect(getComputedStyle(pre).backgroundColor, 'the code sits on --code-bg').toBe(theme === 'light' ? RGB.lightCodeBg : RGB.darkCodeBg);
      expect(pre.style.backgroundColor).toBe('var(--code-bg)');
      const keyword = pre.querySelector<HTMLElement>('span[style*="--accent"]')!;
      expect(keyword.textContent).toBe('const');
      expect(getComputedStyle(keyword).color).toBe(theme === 'light' ? RGB.lightAccent : RGB.darkAccent);
      // The picker names what is drawn.
      const control = document.querySelector<HTMLElement>(`.${CODE_THEME_CONTROL_CLASS}`)!;
      expect(control.textContent).toBe('Code theme: Peekover');
      const selected = [...document.querySelectorAll<HTMLElement>(`.${CODE_THEME_ITEM_CLASS}[aria-selected="true"]`)];
      expect(selected.map((el) => el.dataset.themeId)).toEqual(['peekover']);
      // No silent rewrite.
      expect((await getSettings()).codeTheme).toBe('aurora-x');
    });
  }
});

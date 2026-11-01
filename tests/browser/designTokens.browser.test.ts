// The token pin in a REAL engine (013 task 2.1; plan D-1; gate-1 Q2, Q4) — Chromium and Firefox.
//
// tests/designTokens.test.ts pins the SOURCE TEXT of every copy against design/tokens.css. This file
// pins what the engine actually RESOLVES: the computed custom properties on the content-script
// reader's host, on the app shell's root, and on the app page's reader-pane host, in light and dark,
// must equal tokens.css's values. tokens.css is parsed here, at test time (a raw import of the file),
// never copied into the test. The shell's named exceptions are the same list the unit pin uses.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import tokensCss from '../../design/tokens.css?raw';
import { mount } from '../../src/render/mount';
import { mountAppShell, type AppStore } from '../../src/app/appShell';
import type { FolderSource } from '../../src/app/folderSource';
import { setThemeSetting, resetThemeWatchForTest } from '../../src/theme/reader';
import { resetThemeHostsForTest } from '../../src/theme/themeRegistry';
import { resetThemeControlsForTest } from '../../src/theme/themeControl';

type Tokens = Record<string, string>;
const strip = (css: string): string => css.replace(/\/\*[\s\S]*?\*\//g, '');
function tokensOf(selector: string): Tokens {
  const src = strip(tokensCss);
  const at = src.indexOf(`${selector}{`);
  const body = src.slice(at + selector.length + 1, src.indexOf('}', at));
  const out: Tokens = {};
  for (const m of body.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/gi)) out[m[1]] = m[2].trim();
  return out;
}
const LIGHT = tokensOf(':root');
const THEMES: Record<'light' | 'dark', Tokens> = { light: LIGHT, dark: { ...LIGHT, ...tokensOf('[data-theme="dark"]') } };
/** The same named exceptions as the unit pin (tests/designTokens.test.ts), each with its ruling there. */
const SHELL_EXCEPTIONS = new Set(['--sans', '--serif', '--mono', '--logo-ink', '--logo-eye']);

const norm = (v: string): string => v.replace(/\s+/g, '').replace(/^"|"$/g, '').toLowerCase();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function waitForTheme(el: HTMLElement, expected: string): Promise<void> {
  for (let i = 0; i < 100; i += 1) {
    if (el.getAttribute('data-theme') === expected) return;
    await sleep(20);
  }
  expect(el.getAttribute('data-theme'), 'theme attribute').toBe(expected);
}

/** One message per token whose computed value differs from tokens.css. */
function mismatches(where: string, el: HTMLElement, expected: Tokens, skip: Set<string> = new Set()): string[] {
  const cs = getComputedStyle(el);
  return Object.keys(expected)
    .filter((k) => !skip.has(k))
    .flatMap((k) => {
      const got = cs.getPropertyValue(k);
      return norm(got) === norm(expected[k]) ? [] : [`${where}: ${k} computes to "${got.trim()}", tokens.css says "${expected[k]}"`];
    });
}

const DOC = '# Heading\n\nSome body text.\n\n## Second\n\nMore text.\n';
function memorySource(): FolderSource {
  return { name: 'docs', truncated: false, persistable: false, files: [{ path: 'doc.md', name: 'doc.md', read: async () => DOC }] };
}
function fakeStore(): AppStore {
  return { putFolder: async () => undefined, deleteFolder: async () => undefined, putRecent: async () => undefined };
}

beforeEach(() => {
  resetThemeHostsForTest();
  resetThemeControlsForTest();
  resetThemeWatchForTest();
  document.body.replaceChildren();
});
afterEach(() => {
  setThemeSetting('auto');
  resetThemeHostsForTest();
  resetThemeControlsForTest();
  document.body.replaceChildren();
});

describe('computed tokens equal design/tokens.css (013 task 2.1, D-1)', () => {
  it('tokens.css parsed at test time has both themes and the dark shadow (Q2)', () => {
    expect(Object.keys(LIGHT).length).toBeGreaterThan(15);
    expect(THEMES.dark['--shadow']).toBe('0 10px 30px rgba(0,0,0,.5)');
  });

  it.each(['light', 'dark'] as const)('the content-script reader host, %s', async (theme) => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    mount(DOC, host);
    setThemeSetting(theme);
    await waitForTheme(host, theme);
    expect(mismatches(`reader host (${theme})`, host, THEMES[theme])).toEqual([]);
  });

  it.each(['light', 'dark'] as const)('the app shell root and the reader-pane host, %s', async (theme) => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const app = mountAppShell(container, { openFolder: async () => ({ ok: true, source: memorySource() }), store: fakeStore() });
    await app.openFolder();
    container.querySelector<HTMLButtonElement>('[role="treeitem"][data-kind="file"]')!.click();
    let pane: HTMLElement | null = null;
    for (let i = 0; i < 100 && !pane; i += 1) {
      pane = container.querySelector<HTMLElement>('.peekover-app__reader__host');
      if (!pane) await sleep(20);
    }
    expect(pane, 'the reader pane mounted').not.toBeNull();
    setThemeSetting(theme);
    const shell = container.querySelector<HTMLElement>('.peekover-app')!;
    await waitForTheme(shell, theme);
    await waitForTheme(pane!, theme);
    expect([
      ...mismatches(`app shell (${theme})`, shell, THEMES[theme], SHELL_EXCEPTIONS),
      ...mismatches(`reader pane (${theme})`, pane!, THEMES[theme]),
    ]).toEqual([]);
  });
});

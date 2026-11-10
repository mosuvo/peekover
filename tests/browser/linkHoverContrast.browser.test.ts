// WALK FIX 8.1b (walk-8.1.md item 13) — a hovered link stays readable, in both themes, on both reader surfaces
// (the browser-tab reader and the app page's reader pane), in Chromium and Firefox.
//
// The human's finding: in the dark theme, hovering a link left dark text on the dark page. The hover rule sets a
// literal dark text colour that is only readable on the solid highlighter fill; in dark, the thin-underline rule
// for links is more specific than the plain hover rule, so the fill never painted. The contrast census does not
// measure hover states (its header says so), so this file does: a real pointer hover, then the link's text over
// what is painted behind it (helpers/contrast.ts), against WCAG 1.4.3's 4.5:1.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { userEvent } from 'vitest/browser';
import { mount } from '../../src/render/mount';
import { mountAppShell, type AppStore } from '../../src/app/appShell';
import type { FolderSource, MarkdownFile } from '../../src/app/folderSource';
import { setThemeSetting, resetThemeWatchForTest } from '../../src/theme/reader';
import { DEFAULT_SETTINGS } from '../../src/settings/settings';
import { resetThemeHostsForTest } from '../../src/theme/themeRegistry';
import { resetThemeControlsForTest } from '../../src/theme/themeControl';
import { resetCodeThemeControlsForTest } from '../../src/theme/codeThemeControl';
import { TEXT_BAR, backdropOf, hex, inkOf, ratioOver } from './helpers/contrast';

type Theme = 'light' | 'dark';
const DOC = '# Links\n\nRead the [rollout plan](https://example.invalid/plan) before Friday.\n';
const ENGINE = navigator.userAgent.includes('Firefox') ? 'firefox' : 'chromium';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function waitFor<T>(fn: () => T | null | undefined | false, what: string, tries = 150): Promise<T> {
  for (let i = 0; i < tries; i += 1) {
    const v = fn();
    if (v) return v as T;
    await sleep(20);
  }
  throw new Error(`timed out waiting for ${what}`);
}

const cleanup: HTMLElement[] = [];
function freshHost(): HTMLElement {
  const host = document.createElement('div');
  document.body.appendChild(host);
  cleanup.push(host);
  return host;
}

/** The app shell applies its loaded settings as it mounts; answer the test's own theme so that load changes nothing. */
let appTheme: Theme = 'light';
const store = (): AppStore => ({
  putFolder: async () => undefined,
  deleteFolder: async () => undefined,
  putRecent: async () => undefined,
  getSettings: async () => ({ ...DEFAULT_SETTINGS, theme: appTheme }),
  putSettings: async () => undefined,
});
const mem = (name: string, text: string): MarkdownFile => ({ path: name, name, read: async () => text });

async function tabReader(theme: Theme): Promise<HTMLElement> {
  const host = freshHost();
  mount(DOC, host);
  setThemeSetting(theme);
  await waitFor(() => host.getAttribute('data-theme') === theme, `tab reader data-theme=${theme}`);
  return host;
}

async function appReader(theme: Theme): Promise<HTMLElement> {
  appTheme = theme;
  setThemeSetting(theme);
  const container = freshHost();
  const source: FolderSource = { name: 'docs', truncated: false, persistable: false, files: [mem('plan.md', DOC)] };
  const app = mountAppShell(container, { openFolder: async () => ({ ok: true, source }), store: store() });
  await app.openFolder();
  (await waitFor(() => container.querySelector<HTMLElement>('[role="treeitem"][data-kind="file"]'), 'the tree item')).click();
  const host = await waitFor(() => container.querySelector<HTMLElement>('.peekover-app__reader__host'), 'the reader pane');
  await waitFor(() => host.shadowRoot?.querySelector('.peekover-reader a'), 'the rendered link');
  await waitFor(() => host.getAttribute('data-theme') === theme, `app reader data-theme=${theme}`);
  return host;
}

function linkRatio(link: HTMLElement): { ratio: number; how: string } {
  const backdrop = backdropOf(link);
  const { ratio, drawn, bg } = ratioOver(inkOf(link), backdrop);
  return { ratio: Number(ratio.toFixed(2)), how: `${hex(drawn)} on ${hex(bg)} (${backdrop.how})` };
}

beforeEach(() => {
  resetThemeHostsForTest();
  resetThemeControlsForTest();
  resetThemeWatchForTest();
  resetCodeThemeControlsForTest();
});
afterEach(async () => {
  await userEvent.unhover(document.body).catch(() => undefined);
  setThemeSetting('auto');
  for (const el of cleanup.splice(0)) el.remove();
  resetThemeHostsForTest();
  resetThemeControlsForTest();
});

describe('walk fix 8.1b — a hovered link reads at >= 4.5:1', () => {
  for (const surface of ['tab reader', 'app page'] as const) {
    for (const theme of ['light', 'dark'] as const) {
      it(`${surface} · ${theme}`, async () => {
        const host = surface === 'tab reader' ? await tabReader(theme) : await appReader(theme);
        const link = host.shadowRoot!.querySelector<HTMLElement>('.peekover-reader a')!;
        expect(link.textContent).toBe('rollout plan');

        await userEvent.hover(link);
        await sleep(300); // the link's background transition (.15s) settles
        expect(link.matches(':hover'), 'the pointer is on the link').toBe(true);
        const hovered = linkRatio(link);
        console.log(`LINK-HOVER ${ENGINE} · ${surface} · ${theme} · hovered ${hovered.ratio}:1 · ${hovered.how}`);
        expect(hovered.ratio, `${surface} · ${theme} · hovered: ${hovered.how}`).toBeGreaterThanOrEqual(TEXT_BAR);

        await userEvent.unhover(link);
        await sleep(300);
        const rest = linkRatio(link);
        expect(rest.ratio, `${surface} · ${theme} · at rest: ${rest.how}`).toBeGreaterThanOrEqual(TEXT_BAR);
      });
    }
  }
});

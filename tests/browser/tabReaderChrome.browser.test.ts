// THE BROWSER-TAB READER'S CHROME (013 task 5.6; plan §3; gate-1 Q10's default arm) — Chromium and Firefox.
//
// The content-script reader (a file:// fixture — watching, the agent badge, a blocked image — and a raw-host
// fixture) keeps its floating pills IN PLACE (Q10 (b)) and takes the approved toolbar's look for the same controls
// (toolbar-mock.html, as the app page's toolbar draws them): Raw / Reading, Theme and the remote-images load bar are
// the toolbar's buttons (`--panel`, 1 px `--line`, radius 8, 600 12.5px, `--muted` → `--ink`); the watch pill, the
// agent badge and the network indicator its round pills. The render-failure banner is the mock's `.alert.warn`
// (mockup.html:130, :380), as 5.5 drew the app page's alerts. Tokens only, both themes.
//
// THE CORNER (decisions.md 5.2, deviation 4): the mode pill sat INSIDE the open contents card's top-right corner.
// The card now starts below the pill; the two never overlap at 1440 / 1280 / 1080; the text width is unchanged.
//
// NO CHROME OVER TEXT, AT REST (HUMAN RULING 2026-11-05, "At rest + fix the top"): at 1440 / 1280 / 1080 / 414 the
// top chrome (the mode pill, the load bar, the agent badge, the contents card or its button) is hit-tested against
// every text line box of the reading column with the document at its top, and the bottom-left stack (Theme, the
// watch pill, the network indicator) with the document at its end — the 130 px band's job. Mid-scroll the pills
// float over the page by design (Q10 (b)); at 1080 and 414 the bottom-left stack over mid-page text is for 8.1.
//
// Behaviour, accessible names and the tab order are unchanged (pinned below).

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { mount } from '../../src/render/mount';
import { setThemeSetting, resetThemeWatchForTest } from '../../src/theme/reader';
import { resetThemeHostsForTest } from '../../src/theme/themeRegistry';
import { resetThemeControlsForTest } from '../../src/theme/themeControl';
import { registerWatchTarget, resetWatchRegistryForTest, stopWatch, type WatchTarget } from '../../src/watch/watchRegistry';
import { resetWatchControlsForTest, WATCH_HOST_ATTR, WATCH_CONTROL_CLASS } from '../../src/watch/watchControl';
import { registerDocIdentity, resetDocIdentityForTest } from '../../src/render/docIdentity';
import { lightNetworkIndicator } from '../../src/render/remoteMediaUi';
import { backdropOf, inkOf, ratioOver, hex, TEXT_BAR } from './helpers/contrast';

const ENGINE = navigator.userAgent.includes('Firefox') ? 'firefox' : 'chromium';
type Theme = 'light' | 'dark';
type Fixture = 'file' | 'raw host';

const DOC = [
  '# CLAUDE.md',
  '',
  'Project notes for the agent. A paragraph long enough to wrap across the reading column. '.repeat(5),
  '',
  '![a diagram from the web](https://example.invalid/diagram.png)',
  '',
  '## Commands',
  '',
  'Text under the commands heading. '.repeat(30),
  '',
  '## Style',
  '',
  'More prose under the style heading. '.repeat(50),
  '',
  '### The end',
  '',
  'The last paragraph of the document, with enough words to wrap across several lines. '.repeat(3),
  '',
].join('\n');

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
function watchTarget(): WatchTarget {
  let on = false;
  return { start: () => void (on = true), stop: () => void (on = false), isWatching: () => on };
}

/** A full-page tab reader: the file:// fixture with watching available and the agent badge, or the raw host's. */
async function tabReader(fixture: Fixture, theme: Theme, width = 1440): Promise<HTMLElement> {
  await page.viewport(width, 900);
  if (fixture === 'file') {
    registerWatchTarget(watchTarget());
    registerDocIdentity('CLAUDE.md');
  }
  setThemeSetting(theme);
  const host = document.createElement('div');
  document.body.appendChild(host);
  cleanup.push(host);
  mount(DOC, host);
  host.style.scrollBehavior = 'auto'; // the test's own scrolls land at once
  await waitFor(() => host.getAttribute('data-theme') === theme, `data-theme=${theme}`);
  await sleep(250); // colour transitions settle
  return host;
}

const $ = <T extends Element = HTMLElement>(host: HTMLElement, sel: string): T | null => host.shadowRoot!.querySelector<T>(sel);

/** A token's computed value for `prop`, read by a probe inside the reader's shadow root. */
function tok(host: HTMLElement, prop: string, value: string): string {
  const probe = document.createElement('i');
  probe.style.setProperty(prop, value);
  host.shadowRoot!.append(probe);
  const out = getComputedStyle(probe).getPropertyValue(prop);
  probe.remove();
  return out;
}
const border = (cs: CSSStyleDeclaration): string =>
  (['top', 'right', 'bottom', 'left'] as const).map((s) => `${cs.getPropertyValue(`border-${s}-width`)} ${cs.getPropertyValue(`border-${s}-style`)} ${cs.getPropertyValue(`border-${s}-color`)}`).join(' / ');

/** The toolbar's button: `--panel`, 1 px `--line` all round, radius 8, 600 12.5px in the UI stack, `--muted`. */
function expectButton(host: HTMLElement, sel: string): void {
  const el = $(host, sel)!;
  const cs = getComputedStyle(el);
  const line = tok(host, 'color', 'var(--line)');
  expect(
    `${cs.backgroundColor} | ${border(cs)} | ${cs.borderTopLeftRadius} | ${cs.fontWeight} ${cs.fontSize} | ${cs.color}`,
    `${sel}: the toolbar's button`,
  ).toBe(
    `${tok(host, 'color', 'var(--panel)')} | ${[1, 2, 3, 4].map(() => `1px solid ${line}`).join(' / ')} | 8px | 600 12.5px | ${tok(host, 'color', 'var(--muted)')}`,
  );
}

/** The toolbar's round pill (the watch pill, the agent badge, the network indicator): `--panel`, 1 px border, radius 999. */
function expectRoundPill(host: HTMLElement, sel: string, size: string, borderToken = 'var(--line)', textToken = 'var(--muted)'): void {
  const el = $(host, sel)!;
  const cs = getComputedStyle(el);
  const b = tok(host, 'color', borderToken);
  expect(
    `${cs.backgroundColor} | ${border(cs)} | ${cs.borderTopLeftRadius} | ${cs.fontWeight} ${cs.fontSize} | ${cs.color}`,
    `${sel}: the toolbar's round pill`,
  ).toBe(
    `${tok(host, 'color', 'var(--panel)')} | ${[1, 2, 3, 4].map(() => `1px solid ${b}`).join(' / ')} | 999px | 600 ${size} | ${tok(host, 'color', textToken)}`,
  );
}

/** Every element with its own text under `root`, measured as painted. */
function textRatios(root: Element): Array<{ name: string; text: string; ratio: number; fg: string; bg: string }> {
  const out: Array<{ name: string; text: string; ratio: number; fg: string; bg: string }> = [];
  for (const el of [root, ...root.querySelectorAll('*')]) {
    const text = [...el.childNodes].filter((n) => n.nodeType === Node.TEXT_NODE).map((n) => n.textContent ?? '').join('').trim();
    if (!text || el.getClientRects().length === 0) continue;
    const { ratio, drawn, bg } = ratioOver(inkOf(el), backdropOf(el));
    out.push({ name: el.className || el.tagName.toLowerCase(), text: text.slice(0, 40), ratio: Number(ratio.toFixed(2)), fg: hex(drawn), bg: hex(bg) });
  }
  return out;
}
function expectReadable(root: Element, state: string): number {
  const rows = textRatios(root);
  expect(rows.length, `${state}: some text measured`).toBeGreaterThan(0);
  const low = rows.filter((r) => r.ratio < TEXT_BAR).map((r) => `${r.name} "${r.text}" ${r.fg} on ${r.bg}: ${r.ratio}:1`);
  expect(low, `${state}: text below 4.5:1`).toEqual([]);
  const min = Math.min(...rows.map((r) => r.ratio));
  console.log(`CHROME-CONTRAST ${ENGINE} · ${state} · lowest ${min.toFixed(2)}`);
  return min;
}

/** The reading column's text line boxes, in viewport coordinates. */
function textLines(host: HTMLElement): DOMRect[] {
  const out: DOMRect[] = [];
  const column = $(host, '.peekover-reader')!;
  const walker = document.createTreeWalker(column, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.textContent?.trim()) continue;
    const range = document.createRange();
    range.selectNodeContents(n);
    for (const r of range.getClientRects()) if (r.width > 0 && r.height > 0) out.push(r);
  }
  return out;
}
const overlaps = (a: DOMRect, b: DOMRect): boolean => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
const box = (r: DOMRect): string => `[${r.left.toFixed(1)},${r.top.toFixed(1)} → ${r.right.toFixed(1)},${r.bottom.toFixed(1)}]`;

/** For each chrome selector shown, the text lines its box covers (the hit-test). */
function overText(host: HTMLElement, selectors: readonly string[]): string[] {
  const lines = textLines(host);
  const found: string[] = [];
  for (const sel of selectors) {
    const el = $(host, sel);
    if (!el || el.getClientRects().length === 0 || getComputedStyle(el).display === 'none') continue;
    const r = el.getBoundingClientRect();
    const hit = lines.filter((l) => overlaps(r, l));
    if (hit.length) found.push(`${sel} ${box(r)} over ${hit.length} line(s), first ${box(hit[0])}`);
  }
  return found;
}

beforeEach(() => {
  resetThemeHostsForTest();
  resetThemeControlsForTest();
  resetThemeWatchForTest();
  resetWatchRegistryForTest();
  resetWatchControlsForTest();
  resetDocIdentityForTest();
});
afterEach(async () => {
  stopWatch();
  setThemeSetting('auto');
  for (const el of cleanup.splice(0)) el.remove();
  resetThemeHostsForTest();
  resetThemeControlsForTest();
  resetWatchRegistryForTest();
  resetWatchControlsForTest();
  resetDocIdentityForTest();
  await page.viewport(414, 896);
});

describe('013 task 5.6 — the browser-tab reader restyled', () => {
  for (const theme of ['light', 'dark'] as const) {
    it(`the controls take the toolbar's look, and every text reads at >= 4.5:1 in every state (file://) — ${theme}`, async () => {
      const host = await tabReader('file', theme);
      for (const sel of ['.peekover-mode-toggle', '.peekover-theme-toggle', '.peekover-remote-load']) expectButton(host, sel);
      expectRoundPill(host, `.${WATCH_CONTROL_CLASS}`, '12.5px');
      expect(getComputedStyle($(host, '.peekover-watch__dot')!).backgroundColor, 'the watch dot at rest: --muted').toBe(tok(host, 'color', 'var(--muted)'));
      expectRoundPill(host, '.peekover-agent-badge', '12px');
      expectReadable(host.shadowRoot!.querySelector('.peekover-mode-toggle')!, `${theme} · Raw at rest`);
      // At rest and under a real pointer, each control's text.
      for (const sel of ['.peekover-mode-toggle', '.peekover-theme-toggle', `.${WATCH_CONTROL_CLASS}`, '.peekover-remote-load', '.peekover-agent-badge']) {
        const el = $(host, sel)!;
        expectReadable(el, `${theme} · ${sel} at rest`);
        await userEvent.hover(el);
        await sleep(250);
        expect(getComputedStyle(el).color, `${sel} under the pointer: --ink`).toBe(sel === '.peekover-agent-badge' ? tok(host, 'color', 'var(--muted)') : tok(host, 'color', 'var(--ink)'));
        expectReadable(el, `${theme} · ${sel} hovered`);
        await userEvent.unhover(el);
      }
      // Watching: --ink text, the --ok border and dot; hovered, the --ok-soft fill.
      $(host, `.${WATCH_CONTROL_CLASS}`)!.click();
      await waitFor(() => host.getAttribute(WATCH_HOST_ATTR) === 'active', 'watching');
      await sleep(250);
      expectRoundPill(host, `.${WATCH_CONTROL_CLASS}`, '12.5px', 'var(--ok)', 'var(--ink)');
      expectReadable($(host, `.${WATCH_CONTROL_CLASS}`)!, `${theme} · watching`);
      await userEvent.hover($(host, `.${WATCH_CONTROL_CLASS}`)!);
      await sleep(250);
      expectReadable($(host, `.${WATCH_CONTROL_CLASS}`)!, `${theme} · watching, hovered`);
      await userEvent.unhover($(host, `.${WATCH_CONTROL_CLASS}`)!);
      // Focused from the keyboard: the ring, the text unchanged.
      $(host, '.peekover-mode-toggle')!.focus();
      expectReadable($(host, '.peekover-mode-toggle')!, `${theme} · Raw focused`);
      // The load bar used: the network indicator lights — the round pill, --del dot.
      $(host, '.peekover-remote-load')!.click();
      await waitFor(() => host.getAttribute('data-network') === 'active', 'the network indicator lit');
      await sleep(250);
      expectRoundPill(host, '.peekover-net', '12px');
      expectReadable($(host, '.peekover-net')!, `${theme} · network used`);
      // The user's Raw view: the pill reads "Reading".
      $(host, '.peekover-mode-toggle')!.click();
      await waitFor(() => host.getAttribute('data-mode') === 'raw', 'the Raw view');
      expectReadable($(host, '.peekover-mode-toggle')!, `${theme} · Reading (in Raw)`);
    });

    it(`the raw-host fixture: the same buttons, the load bar — ${theme}`, async () => {
      const host = await tabReader('raw host', theme);
      for (const sel of ['.peekover-mode-toggle', '.peekover-theme-toggle', '.peekover-remote-load']) expectButton(host, sel);
      expect($(host, `.${WATCH_CONTROL_CLASS}`), 'no watch control on the raw host fixture').toBeNull();
      for (const sel of ['.peekover-mode-toggle', '.peekover-theme-toggle', '.peekover-remote-load']) expectReadable($(host, sel)!, `${theme} · raw host · ${sel}`);
    });

    it(`the render-failure banner is the mock's .alert.warn, and reads at >= 4.5:1 — ${theme}`, async () => {
      await page.viewport(1440, 900);
      setThemeSetting(theme);
      const host = document.createElement('div');
      document.body.appendChild(host);
      cleanup.push(host);
      const root = host.attachShadow({ mode: 'open' });
      const commit = ShadowRoot.prototype.replaceChildren;
      root.replaceChildren = function forced(this: ShadowRoot, ...nodes: (Node | string)[]): void {
        if (nodes.some((n) => n instanceof Element && n.classList.contains('peekover-reader'))) throw new Error('forced render failure');
        commit.apply(this, nodes);
      };
      const warn = console.warn;
      console.warn = () => undefined;
      try {
        mount(DOC, host);
      } finally {
        console.warn = warn;
      }
      await waitFor(() => host.getAttribute('data-theme') === theme, `data-theme=${theme}`);
      const banner = await waitFor(() => $(host, '.peekover-alert'), 'the banner');
      expect(banner.textContent, 'copy unchanged').toBe("Couldn't render this document — showing raw source.");
      const cs = getComputedStyle(banner);
      expect(
        `${border(cs)} | ${cs.backgroundColor} | ${cs.color} | ${cs.fontSize}`,
        "the banner: the mock's .alert.warn (a 3px --warn rule, the --hl-soft fill at 55%, --ink, 13px)",
      ).toBe(
        `0px none ${cs.borderTopColor} / 0px none ${cs.borderRightColor} / 0px none ${cs.borderBottomColor} / 3px solid ${tok(host, 'color', 'var(--warn)')} | ${tok(host, 'background-color', 'color-mix(in srgb, var(--hl-soft) 55%, transparent)')} | ${tok(host, 'color', 'var(--ink)')} | 13px`,
      );
      expectReadable(banner, `${theme} · the render-failure banner`);
    });
  }

  // THE CORNER — the mode pill against the open contents card (decisions.md 5.2's note).
  for (const width of [1440, 1280, 1080]) {
    it(`the mode pill and the open contents card never overlap, and the text width holds, at ${width}`, async () => {
      const host = await tabReader('file', 'light', width);
      expect(host.getAttribute('data-toc'), 'the contents card is open').toBe('open');
      const pill = $(host, '.peekover-mode-toggle')!.getBoundingClientRect();
      const card = $(host, '.peekover-toc')!.getBoundingClientRect();
      expect(overlaps(pill, card) ? `the mode pill ${box(pill)} overlaps the open contents card ${box(card)}` : 'clear', `at ${width}`).toBe('clear');
      if (width === 1440) {
        const p = $(host, '.peekover-reader p')!;
        expect(p.getBoundingClientRect().width, 'the text width at 1440, to the pixel (5.5: 684)').toBe(684);
      }
    });
  }

  // NO CHROME OVER TEXT, AT REST (the human's ruling, 2026-11-05).
  for (const fixture of ['file', 'raw host'] as const) {
    for (const width of [1440, 1280, 1080, 414]) {
      it(`no chrome over text at rest — ${fixture}, ${width}`, async () => {
        const host = await tabReader(fixture, 'light', width);
        lightNetworkIndicator(host); // the indicator lit, so its box is in the stack
        host.scrollTop = 0;
        await sleep(50);
        const top = overText(host, ['.peekover-mode-toggle', '.peekover-remote-load', '.peekover-agent-badge', '.peekover-toc']);
        host.scrollTop = host.scrollHeight;
        await sleep(50);
        expect(host.scrollTop, 'scrolled to the end').toBe(host.scrollHeight - host.clientHeight);
        const end = overText(host, ['.peekover-theme-toggle', `.${WATCH_CONTROL_CLASS}`, '.peekover-net']);
        expect({ top, end }, `${fixture} at ${width}: chrome over the reading column's text`).toEqual({ top: [], end: [] });
      });
    }
  }

  // 5.6 FIX — FONT INDEPENDENCE. The tab reader's chrome draws in SYSTEM faces (D-3), so CI on Linux (no Bricolage)
  // and real users differ from this machine: CI's run 41965319733 measured the collapsed contents box to 110 / 112 px at
  // 414 — its label wrapped to two lines inside the 38vw cap — over the h1's first line (103). The same at-rest
  // hit-test, with the chrome forced into a WIDE face (Verdana here, DejaVu Sans on Linux: the instrument that
  // reproduced CI's 112 locally), independent of any installed face letter-spaced wide, and TALL — the handle's
  // `normal` line height as a face with tall metrics gives it (2em; the pills set `line-height:1` themselves).
  // The tall arm is the fixed height's instrument: the wide arms stay one line without it (nothing caps the handle).
  const FORCED = {
    'a wide system face': ':host{--sans:Verdana,"DejaVu Sans",sans-serif}',
    'letter-spaced wide': '.peekover-toc__toggle,.peekover-mode-toggle,.peekover-remote-load,.peekover-agent-badge{letter-spacing:.2em}',
    'a tall face': '.peekover-toc__toggle{line-height:2}',
  } as const;
  for (const [arm, css] of Object.entries(FORCED)) {
    for (const fixture of ['file', 'raw host'] as const) {
      for (const width of [1280, 1080, 414]) {
        it(`no chrome over text at rest, whatever the system face — ${arm}, ${fixture}, ${width}`, async () => {
          const host = await tabReader(fixture, 'light', width);
          const forced = document.createElement('style');
          forced.textContent = css;
          host.shadowRoot!.append(forced);
          lightNetworkIndicator(host);
          host.scrollTop = 0;
          await sleep(50);
          const top = overText(host, ['.peekover-toc', '.peekover-mode-toggle', '.peekover-remote-load', '.peekover-agent-badge']);
          expect(top, `${arm}, ${fixture} at ${width}: top chrome over the reading column's text`).toEqual([]);
        });
      }
    }
  }

  it('behaviour, names and tab order unchanged: the chrome is reached in DOM order (file://)', async () => {
    const host = await tabReader('file', 'light');
    const seen: string[] = [];
    (document.activeElement as HTMLElement | null)?.blur();
    for (let i = 0; i < 12 && seen.length < 5; i += 1) {
      await userEvent.tab();
      const el = host.shadowRoot!.activeElement;
      const name = el ? [...el.classList][0] ?? el.tagName.toLowerCase() : 'outside';
      if (seen[seen.length - 1] !== name && name !== 'outside') seen.push(name);
    }
    expect(seen, 'the first five focus stops').toEqual(['peekover-mode-toggle', 'peekover-theme-toggle', WATCH_CONTROL_CLASS, 'peekover-remote-load', 'peekover-toc__toggle']);
    // Accessible names, as 5.5 shipped them.
    expect($(host, '.peekover-mode-toggle')!.textContent).toBe('Raw');
    expect($(host, '.peekover-remote-load')!.textContent).toBe('1 remote image blocked · Load');
    expect($(host, '.peekover-agent-badge')!.textContent).toContain('CLAUDE.md');
  });
});

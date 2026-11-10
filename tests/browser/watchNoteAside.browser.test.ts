// WALK FIX 8.1c (the human's walk "item 13", recorded at 8.1 I-6; HUMAN RULING "8.1c — OPTION A", 2026-11-10) — the
// two "can't watch here" notes on the tab reader (a raw web page: REMOTE_DOCUMENT_NOTE; Firefox file://:
// FIREFOX_CONTENT_SCRIPT_NOTE) are a quiet aside after the document's last line, not a floating panel over the text.
// The stopped-watch note (a watch that died, with the Watch control still beside it) keeps its place by the control.
//
// 8.1h (HUMAN RULING 2026-11-10, option A): the same place, the approved short wording, and a quiet footnote rather
// than a card — its text starts at the paragraphs' left x (the column's text edge, the contents rail open or not), no
// box / border / shadow / accent bar, the reader's UI face in muted small text, one modest gap below the last line.
//
// The hit-test is 5.6's (tabReaderChrome.browser.test.ts): the note's box against every line box of the reading
// column, in one coordinate space — at rest, mid-scroll and at the end; 414 / 1080 / 1440; light and dark; both
// engines run every case (the content-script state is set the way the content script sets it, installContentWatch).

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { page } from 'vitest/browser';
import { mount } from '../../src/render/mount';
import { installContentWatch } from '../../src/watch/contentWatch';
import { registerWatchTarget, resetWatchRegistryForTest, setWatchNote, type WatchTarget } from '../../src/watch/watchRegistry';
import { resetWatchControlsForTest, WATCH_CONTROL_CLASS, WATCH_NOTE_CLASS } from '../../src/watch/watchControl';
import { FIREFOX_CONTENT_SCRIPT_NOTE, REMOTE_DOCUMENT_NOTE } from '../../src/watch/watchAvailability';
import { DEAD_READ_NOTE } from '../../src/watch/watchController';
import { setThemeSetting, resetThemeWatchForTest } from '../../src/theme/reader';
import { resetThemeHostsForTest } from '../../src/theme/themeRegistry';
import { resetThemeControlsForTest } from '../../src/theme/themeControl';

type Theme = 'light' | 'dark';
const DOC = [
  '# Rollout notes',
  '',
  'A paragraph long enough to wrap across the reading column, so the column has text near its left edge. '.repeat(6),
  '',
  '## Steps',
  '',
  'Text under the steps heading. '.repeat(40),
  '',
  '## Rollback',
  '',
  'More prose under the rollback heading, down to the last line of the document. '.repeat(40),
  '',
].join('\n');

const CASES = [
  // The approved sentences, as written (8.1h), and the constants that must carry them.
  { name: 'raw web page', url: 'https://raw.githubusercontent.com/o/r/main/README.md', canRead: true, note: REMOTE_DOCUMENT_NOTE, text: "Watching isn't available for files on the web." },
  { name: 'Firefox file://', url: 'file:///D:/notes/rollout.md', canRead: false, note: FIREFOX_CONTENT_SCRIPT_NOTE, text: "Watching isn't available here. To watch, open the folder in Peekover's app page." },
] as const;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function waitFor<T>(fn: () => T | null | undefined | false, what: string, tries = 150): Promise<T> {
  for (let i = 0; i < tries; i += 1) {
    const v = fn();
    if (v) return v as T;
    await sleep(20);
  }
  throw new Error(`timed out waiting for ${what}`);
}

const hosts: HTMLElement[] = [];
async function tabReader(url: string, canRead: boolean, theme: Theme, width: number): Promise<HTMLElement> {
  await page.viewport(width, 900);
  installContentWatch({ url, send: async () => ({ ok: false, error: 'not used' }), backgroundCanReadFileUrls: canRead });
  setThemeSetting(theme);
  const host = document.createElement('peekover-root');
  document.body.appendChild(host);
  hosts.push(host);
  mount(DOC, host);
  host.style.scrollBehavior = 'auto';
  await waitFor(() => host.getAttribute('data-theme') === theme, `data-theme=${theme}`);
  await sleep(250);
  return host;
}

function textLines(host: HTMLElement): DOMRect[] {
  const out: DOMRect[] = [];
  const column = host.shadowRoot!.querySelector('.peekover-reader')!;
  const walker = document.createTreeWalker(column, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.textContent?.trim()) continue;
    const range = document.createRange();
    range.selectNodeContents(n);
    for (const r of range.getClientRects()) if (r.width > 0 && r.height > 0) out.push(r);
  }
  return out;
}
/** The left x of an element's first line of text (its first text node's first line box). */
function textLeft(el: Element): number {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.textContent?.trim()) continue;
    const range = document.createRange();
    range.selectNodeContents(n);
    const first = [...range.getClientRects()].find((r) => r.width > 0);
    if (first) return first.left;
  }
  return Number.NaN;
}

const overlaps = (a: DOMRect, b: DOMRect): boolean => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
const box = (r: DOMRect): string => `[${r.left.toFixed(1)},${r.top.toFixed(1)} → ${r.right.toFixed(1)},${r.bottom.toFixed(1)}]`;

/** The text lines the note's box covers, or [] — the hit-test. */
function covered(host: HTMLElement, note: HTMLElement): string[] {
  const r = note.getBoundingClientRect();
  return textLines(host)
    .filter((l) => overlaps(r, l))
    .map((l) => `note ${box(r)} over line ${box(l)}`);
}

/** The scroller is the host (the reader's `:host` is the scroll box). */
async function scrollTo(host: HTMLElement, where: 'rest' | 'mid' | 'end'): Promise<void> {
  const max = host.scrollHeight - host.clientHeight;
  host.scrollTop = where === 'rest' ? 0 : where === 'mid' ? Math.round(max / 2) : max;
  await sleep(60);
}

beforeEach(() => {
  resetWatchRegistryForTest();
  resetWatchControlsForTest();
  resetThemeHostsForTest();
  resetThemeControlsForTest();
  resetThemeWatchForTest();
});
afterEach(async () => {
  for (const h of hosts.splice(0)) h.remove();
  setThemeSetting('auto');
  resetWatchRegistryForTest();
  resetWatchControlsForTest();
  resetThemeHostsForTest();
  resetThemeControlsForTest();
  await page.viewport(414, 896);
});

describe('walk fix 8.1c — a "can\'t watch here" note covers no text', () => {
  for (const c of CASES) {
    for (const width of [414, 1080, 1280, 1440]) {
      for (const theme of ['light', 'dark'] as const) {
        it(`${c.name} · ${width} · ${theme}`, async () => {
          const host = await tabReader(c.url, c.canRead, theme, width);
          const note = host.shadowRoot!.querySelector<HTMLElement>(`.${WATCH_NOTE_CLASS}`)!;
          expect(note.textContent).toBe(c.text);
          expect(c.note).toBe(c.text);
          expect(note.hidden).toBe(false);
          expect(host.shadowRoot!.querySelector(`.${WATCH_CONTROL_CLASS}`), 'no Watch control here').toBeNull();
          expect(host.scrollHeight, 'the document is long enough to scroll').toBeGreaterThan(host.clientHeight * 2);
          // The hit-test first (AGENTS.md: the instrument that found the defect runs first).
          for (const where of ['rest', 'mid', 'end'] as const) {
            await scrollTo(host, where);
            expect(covered(host, note), `${c.name} · ${width} · ${theme} · ${where}`).toEqual([]);
          }
          // It is still read: at the end of the document it is on screen, below the last line.
          const r = note.getBoundingClientRect();
          const last = textLines(host).at(-1)!;
          expect(r.top, 'below the last line').toBeGreaterThanOrEqual(last.bottom);
          expect(r.bottom <= host.clientHeight && r.top >= 0, `on screen at the end ${box(r)}`).toBe(true);
          // 8.1h — a footnote, not a card. Its text starts at the paragraphs' left edge…
          const para = host.shadowRoot!.querySelector('.peekover-reader p')!;
          expect(Math.abs(textLeft(note) - textLeft(para)), `note text x ${textLeft(note)} vs paragraph x ${textLeft(para)}`).toBeLessThanOrEqual(0.5);
          // …with no box around it…
          const cs = getComputedStyle(note);
          for (const side of ['Top', 'Right', 'Bottom', 'Left'] as const) {
            expect(cs.getPropertyValue(`border-${side.toLowerCase()}-width`), `border-${side}`).toBe('0px');
          }
          expect(cs.backgroundColor, 'no background').toBe('rgba(0, 0, 0, 0)');
          expect(cs.boxShadow, 'no shadow').toBe('none');
          // …in the reader's UI face (the Theme button's), muted, small…
          const ui = getComputedStyle(host.shadowRoot!.querySelector('.peekover-theme-toggle')!);
          expect(cs.fontFamily).toBe(ui.fontFamily);
          expect(cs.color, 'muted (the UI pills’ text colour)').toBe(ui.color);
          expect(parseFloat(cs.fontSize)).toBeLessThanOrEqual(13);
          // …one modest gap below the last line.
          const gap = r.top - last.bottom;
          expect(gap, 'the gap below the last line').toBeGreaterThanOrEqual(8);
          expect(gap, 'the gap below the last line').toBeLessThanOrEqual(64);
        });
      }
    }
  }

  it('the stopped-watch note keeps its place beside the Watch control (fixed, bottom-left)', async () => {
    const target: WatchTarget = { start: () => undefined, stop: () => undefined, isWatching: () => false };
    registerWatchTarget(target);
    setWatchNote(DEAD_READ_NOTE);
    await page.viewport(1440, 900);
    const host = document.createElement('peekover-root');
    document.body.appendChild(host);
    hosts.push(host);
    mount(DOC, host);
    const note = await waitFor(() => host.shadowRoot!.querySelector<HTMLElement>(`.${WATCH_NOTE_CLASS}`), 'the note');
    expect(host.shadowRoot!.querySelector(`.${WATCH_CONTROL_CLASS}`), 'the Watch control is there').not.toBeNull();
    expect(note.textContent).toBe(DEAD_READ_NOTE);
    expect(getComputedStyle(note).position).toBe('fixed');
  });
});

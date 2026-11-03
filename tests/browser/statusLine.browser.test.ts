// statusLine — the real-engine half of 013 task 4.7 (D-9; gate-1 Q9; ruling F), Chromium AND Firefox.
//
// THE NETWORK STATEMENT. "No network calls" while nothing has left the page, "Network used" after — no count
// (the human's ruling: Firefox writes no Resource Timing entry for a request whose connection fails, so a count
// could not be made exactly true). What is proven here:
//   • the ZERO: a document with blocked remote media, code, math, a diagram and the editor engine — with no user
//     action — reads "No network calls"; then `wireSettled()` proves nothing off-origin had been issued (Resource
//     Timing records a request when it ENDS, so the zero is only trusted once the wire has settled). The settle is
//     itself an off-origin request — the sentinel — and the line then reads "Network used": the firing control,
//     on the same instrument, that the observer is not blind. The extension's own loads over this harness's
//     http origin (chunks, fonts, a same-origin fetch standing in for one) are seen in the buffer and never flip it;
//   • the USER'S LOAD: the load bar's click restores the images, the indicator lights, the line says so;
//   • the SLOW case (AGENTS.md: a zero-guard's control includes a late one): an off-origin image issued 400 ms
//     after the line first read zero, NOT through the load bar (so the indicator stays dark), still flips the
//     line once it lands — the observer arm, which tasks.md's red-first removes.
// Every probe URL is on the loopback (`helpers/diagramWindow.ts`): `127.0.0.1:PORT` is off-origin to the
// `localhost:PORT` page and answered by the same local server. Nothing leaves the machine.
//
// THE VERSION. The real entrypoint (`entrypoints/app/main.ts`) is imported under a stand-in `browser` whose
// `runtime.getManifest()` answers with the BUILT manifest (when `.output` exists) — the line shows that version,
// and every built manifest's version equals package.json's.
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import pkg from '../../package.json';
import { mountAppShell, type AppStore } from '../../src/app/appShell';
import type { FolderSource } from '../../src/app/folderSource';
import { DEFAULT_SETTINGS } from '../../src/settings/settings';
import { NETWORK_USED_TEXT, NO_NETWORK_TEXT, STATUS_LINE_CLASS } from '../../src/app/statusLine';
import { EDITOR_SHELL_CLASS, teardownEditorShell } from '../../src/render/editorView';
import { NETWORK_ATTR } from '../../src/render/remoteMediaUi';
import { wipeAll, __resetConnectionForTest } from '../../src/app/store';
import { isOffOrigin, isSentinel, offOriginProbeUrl, wireSettled, flush } from './helpers/diagramWindow';
import { backdropOf, inkOf, ratioOver, TEXT_BAR } from './helpers/contrast';

const SERVED = '/public/icons/icon-128.png'; // a real file the dev server answers, so the image LOADS
let seq = 0;
const remote = (): string => offOriginProbeUrl(`${SERVED}?status-line=${Date.now()}-${(seq += 1)}`);

const store = (theme: 'light' | 'dark' = 'light'): AppStore => ({
  putFolder: async () => undefined,
  deleteFolder: async () => undefined,
  putRecent: async () => undefined,
  getSettings: async () => ({ ...DEFAULT_SETTINGS, theme }),
  putSettings: async () => undefined,
});
const sourceOf = (files: Record<string, string>): FolderSource => ({
  name: 'docs',
  truncated: false,
  persistable: true,
  files: Object.entries(files).map(([name, text]) => ({ path: name, name, read: async () => text })),
});

async function until<T>(fn: () => T | null | undefined | false, what: string, ms = 15000): Promise<T> {
  const end = performance.now() + ms;
  for (;;) {
    const v = fn();
    if (v) return v as T;
    if (performance.now() > end) throw new Error(`timed out: ${what}`);
    await new Promise((r) => setTimeout(r, 20));
  }
}
const frames = async (n = 3): Promise<void> => {
  for (let i = 0; i < n; i += 1) await new Promise((r) => requestAnimationFrame(() => r(null)));
};

const containers: HTMLElement[] = [];
beforeEach(async () => {
  await wipeAll();
});
afterEach(async () => {
  for (const c of containers.splice(0)) {
    c.querySelectorAll<HTMLElement>('.peekover-app__reader__host').forEach(teardownEditorShell);
    c.remove();
  }
  __resetConnectionForTest();
  await page.viewport(414, 896);
});

/** The app page over an in-memory folder; opens `open` and returns the line and the reader host. */
async function openApp(files: Record<string, string>, open: string, theme: 'light' | 'dark' = 'light') {
  const container = document.createElement('div');
  document.body.appendChild(container);
  containers.push(container);
  const app = mountAppShell(container, { openFolder: async () => ({ ok: true, source: sourceOf(files) }), store: store(theme) });
  const line = container.querySelector<HTMLElement>(`.${STATUS_LINE_CLASS}`)!;
  await app.openFolder();
  await clickFile(container, open);
  const host = await until(() => container.querySelector<HTMLElement>('.peekover-app__reader__host'), 'the reader host');
  if (theme) await until(() => host.getAttribute('data-theme') === theme, `data-theme=${theme}`);
  return { container, line, host, app };
}
async function clickFile(container: HTMLElement, name: string): Promise<void> {
  const item = await until(
    () => [...container.querySelectorAll<HTMLButtonElement>('[role="treeitem"][data-kind="file"]')].find((b) => b.textContent?.includes(name)),
    `${name} in the tree`,
  );
  item.click();
  await until(() => container.querySelector(`.${STATUS_LINE_CLASS}__file`)?.textContent === name, `${name} on the line`);
}
const netText = (line: HTMLElement): string => line.querySelector(`.${STATUS_LINE_CLASS}__net`)!.textContent ?? '';
/** Off-origin http(s) entries since `t0`, the settle sentinel excluded. */
const offOriginSince = (t0: number): string[] =>
  performance
    .getEntriesByType('resource')
    .filter((e) => e.startTime >= t0 && /^https?:/i.test(e.name) && isOffOrigin(e.name) && !isSentinel(e.name))
    .map((e) => e.name);

describe('4.7 — statement 1: the open file', () => {
  it('A then B shows B, on the real page', async () => {
    const { container, line } = await openApp({ 'a.md': '# A', 'b.md': '# B' }, 'a.md');
    expect(line.querySelector(`.${STATUS_LINE_CLASS}__file`)!.textContent).toBe('a.md');
    await clickFile(container, 'b.md');
    expect(line.querySelector(`.${STATUS_LINE_CLASS}__file`)!.textContent).toBe('b.md');
  });
});

describe('4.7 — statement 2: the network', () => {
  it('ZERO: blocked remote media, code, math, a diagram and the editor — no user action → "No network calls"; settled, nothing off-origin; the settle itself flips it', { timeout: 60_000 }, async () => {
    const t0 = performance.now();
    const doc = [
      '# Zero',
      `![blocked](${remote()})`,
      '```javascript\nconst x = 1;\n```',
      '$$\nx^2 + y^2\n$$',
      '```mermaid\ngraph TD; A-->B;\n```',
    ].join('\n\n');
    const { container, line, host } = await openApp({ 'zero.md': doc }, 'zero.md');
    // Highlighting waits for a block to come into view (the contrast census's own note): scroll it in.
    await until(() => host.shadowRoot?.querySelector('math'), 'math');
    (await until(() => host.shadowRoot?.querySelector<HTMLElement>('.peekover-code pre'), 'the code block')).scrollIntoView();
    await until(() => host.shadowRoot?.querySelector('pre.shiki'), 'the code highlighted');
    await until(() => host.shadowRoot?.querySelector('.peekover-diagram[data-diagram="rendered"]'), 'the diagram', 20000);
    container.querySelector<HTMLButtonElement>('.peekover-toolbar__seg [data-mode="edit"]')!.click();
    await until(() => host.shadowRoot?.querySelector('.cm-editor'), 'the editor engine');
    // An extension-internal load over THIS harness's own http origin — the stand-in for a chunk or a font.
    await fetch(new URL(`${SERVED}?same-origin=${Date.now()}`, location.origin).href);
    await flush();
    expect(host.hasAttribute(NETWORK_ATTR), 'no user action: the indicator is dark').toBe(false);
    expect(netText(line), 'before the settle').toBe(NO_NETWORK_TEXT);

    await wireSettled();
    expect(offOriginSince(t0), 'settled: nothing left the page').toEqual([]);
    const sameOrigin = performance.getEntriesByType('resource').filter((e) => e.startTime >= t0 && e.name.startsWith(`${location.origin}/`));
    expect(sameOrigin.length, 'firing control: the page DID load its own things over http meanwhile').toBeGreaterThan(0);
    // The settle's sentinel IS an off-origin request: the line saw it (the instrument is live).
    await until(() => netText(line) === NETWORK_USED_TEXT, 'the sentinel seen by the line');
    expect(host.hasAttribute(NETWORK_ATTR)).toBe(false);
  });

  it('the USER\'S LOAD: the load bar restores the images, the indicator lights, the line says "Network used"', async () => {
    const t0 = performance.now();
    const urls = [remote(), remote()];
    const { container, line, host } = await openApp({ 'pics.md': `# Pics\n\n![one](${urls[0]})\n\n![two](${urls[1]})` }, 'pics.md');
    await flush();
    expect(netText(line)).toBe(NO_NETWORK_TEXT);
    container.querySelector<HTMLButtonElement>('.peekover-app__notices .peekover-remote-load')!.click();
    const imgs = await until(() => {
      const list = [...host.shadowRoot!.querySelectorAll<HTMLImageElement>('img')].filter((i) => urls.includes(i.src));
      return list.length === 2 && list.every((i) => i.complete && i.naturalWidth > 0) ? list : null;
    }, 'both images loaded');
    expect(imgs.length).toBe(2);
    await flush();
    expect(host.getAttribute(NETWORK_ATTR)).toBe('active');
    expect(netText(line)).toBe(NETWORK_USED_TEXT);
    expect(offOriginSince(t0).filter((n) => urls.includes(n)).sort()).toEqual([...urls].sort());
  });

  it('SLOW, and not through the load bar: an off-origin image issued 400 ms later still flips the line once it lands', async () => {
    const { line } = await openApp({ 'plain.md': '# Plain\n\nNo media.' }, 'plain.md');
    await flush();
    expect(netText(line), 'before').toBe(NO_NETWORK_TEXT);
    await new Promise((r) => setTimeout(r, 400));
    const url = remote();
    const img = new Image();
    const landed = new Promise<void>((r) => {
      img.onload = () => r();
      img.onerror = () => r();
    });
    img.src = url;
    document.body.appendChild(img);
    try {
      await landed;
      await flush();
      expect(performance.getEntriesByName(url).length, 'the request is in the buffer').toBe(1);
      expect(document.querySelector(`[${NETWORK_ATTR}="active"]`), 'the indicator never lit').toBeNull();
      expect(netText(line), 'the observer arm saw it').toBe(NETWORK_USED_TEXT);
    } finally {
      img.remove();
    }
  });
});

describe('4.7 — statement 3: the version is the built manifest\'s', () => {
  const BUILT = import.meta.glob('/.output/*/manifest.json', { eager: true, import: 'default' }) as Record<string, { version: string }>;
  const saved = (globalThis as { browser?: unknown }).browser;
  afterAll(() => {
    (globalThis as { browser?: unknown }).browser = saved;
    document.getElementById('app')?.remove();
  });

  it('every built manifest\'s version is package.json\'s, and the real entrypoint shows it', async () => {
    const versions = Object.values(BUILT).map((m) => m.version);
    for (const v of versions) expect(v, 'a built manifest').toBe(pkg.version);
    const version = versions[0] ?? pkg.version; // not built this run: the wiring is still proven with package.json's
    (globalThis as { browser?: unknown }).browser = { runtime: { id: 'peekover-test', getManifest: () => ({ version }) } };
    const root = document.createElement('div');
    root.id = 'app';
    document.body.appendChild(root);
    await import('../../entrypoints/app/main');
    const line = await until(() => root.querySelector<HTMLElement>(`.${STATUS_LINE_CLASS}`), 'the line on the real page');
    expect(line.querySelector(`.${STATUS_LINE_CLASS}__version`)!.textContent).toBe(`Peekover ${version}`);
    // Nothing else on the line: the three statements' slots, the spacer, and no fourth.
    expect([...line.children].map((c) => c.className)).toEqual([
      `${STATUS_LINE_CLASS}__file`,
      `${STATUS_LINE_CLASS}__sp`,
      `${STATUS_LINE_CLASS}__net`,
      `${STATUS_LINE_CLASS}__version`,
    ]);
  });
});

describe('4.7 — layout and contrast: at the window\'s foot, over nothing', () => {
  const LONG = Array.from({ length: 40 }, (_, i) => `${i % 8 === 0 ? `## Part ${i / 8}\n\n` : ''}Paragraph ${i}, long enough to scroll.`).join('\n\n');
  const SIZES = [
    { width: 1440, height: 900 },
    { width: 1080, height: 900 },
    { width: 414, height: 896 },
  ];
  const overlaps = (a: DOMRect, b: DOMRect): boolean =>
    Math.min(a.right, b.right) - Math.max(a.left, b.left) > 0.5 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 0.5;

  it.each(SIZES.flatMap((s) => (['light', 'dark'] as const).map((t) => [`${s.width}`, t, s] as const)))(
    '%s, %s: the line sits at the foot; the reader pane, the reading column, the rail, the notice area and the split clear it; its text passes AA',
    { timeout: 60_000 },
    async (_w, theme, size) => {
      await page.viewport(size.width, size.height);
      const { container, line, host } = await openApp({ 'long.md': `# Long\n\n${LONG}` }, 'long.md', theme);
      await frames();
      const l = line.getBoundingClientRect();
      expect(Math.abs(l.bottom - window.innerHeight), 'at the window\'s foot').toBeLessThanOrEqual(1);
      expect(l.height).toBeGreaterThanOrEqual(29);
      const pane = container.querySelector('.peekover-app__reader')!.getBoundingClientRect();
      expect(pane.bottom, 'the reader pane ends above it').toBeLessThanOrEqual(l.top + 0.5);
      // The reading column and the rail run the length of the document inside the pane, which clips them above
      // the line — so a rect test would read the clipped part. The hit-test is the instrument: across the line's
      // whole width, every point is the line itself (nothing painted over it). The notice area is not clipped.
      const covered = (): string[] => {
        const out: string[] = [];
        for (let x = l.left + 4; x < l.right - 4; x += 24) {
          const hit = document.elementFromPoint(x, l.top + l.height / 2);
          if (!hit?.closest(`.${STATUS_LINE_CLASS}`)) out.push(`${Math.round(x)}: ${hit?.className || hit?.tagName}`);
        }
        return out;
      };
      expect(covered(), 'reading: points of the line covered by something else').toEqual([]);
      expect(overlaps(container.querySelector('.peekover-app__notices')!.getBoundingClientRect(), l), 'the notice area').toBe(false);
      const rail = host.shadowRoot!.querySelector('.peekover-toc')!.getBoundingClientRect();
      expect(rail.width === 0 || rail.top < l.top, 'the rail starts above the line (it is clipped by the pane)').toBe(true);

      container.querySelector<HTMLButtonElement>('.peekover-toolbar__seg [data-mode="edit"]')!.click();
      await until(() => host.shadowRoot?.querySelector('.cm-editor'), 'the editor');
      await frames(4);
      const split = host.shadowRoot!.querySelector(`.${EDITOR_SHELL_CLASS}`)!.getBoundingClientRect();
      expect(overlaps(split, l), 'the split clears the line').toBe(false);
      expect(covered(), 'edit: points of the line covered by something else').toEqual([]);

      for (const el of [...line.querySelectorAll<HTMLElement>(':scope > span')].filter((s) => s.textContent)) {
        const r = ratioOver(inkOf(el), backdropOf(el)).ratio;
        expect(r, `${theme}: "${el.textContent}" at ${r.toFixed(2)}:1`).toBeGreaterThanOrEqual(TEXT_BAR);
      }
    },
  );
});

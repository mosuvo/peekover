// scripts/walk-shots.ts — reference screenshots for the 8.1 design walk (M13 task 8.1 prep). Not a test; never in CI.
//
// Drives the BUILT extension (`.output/chrome-mv3`, `.output/firefox-mv3`) in throwaway profiles and saves one PNG per
// surface × cell, where a cell is theme (light / dark) × engine (chromium / firefox) × width (1440 / 1280 / 1080 / 414):
//
//   <out>/<section>/<surface>/<theme>-<engine>-<width>.png
//   <out>/<section>/<surface>/mock-<theme>-<width>.png        the matching mock frame, where a mock exists
//   <out>/<section>/<surface>/side-<theme>-<engine>-<width>.png  the shot and the mock frame side by side
//   <out>/manifest.json                                         every cell's outcome (captured / n/a / failed + why)
//
//   pnpm exec tsx scripts/walk-shots.ts [--out D:\Dev\peekover-shots\8.1] [--engine chromium|firefox] [--only <surface>]
//
// Chromium: Playwright's own Chromium (`channel: 'chromium'`) — branded Chrome ignores `--load-extension` since 137.
// Firefox: the installed Firefox, driven over WebDriver BiDi (`webExtension.install`); extension pages need the remote
// agent's system access, and the window (not the viewport) is sized, so the page's own innerWidth is checked.
// Firefox's window is at least 500 px wide, so its 414 cells lay out at 414 CSS px drawn at 500/414 device pixels.
// Theme: Chromium emulates `prefers-color-scheme`; Firefox gets `layout.css.prefers-color-scheme.content-override`.
// The app page opens its folder through the `__peekoverHarness` seam (task 2.1) with an OPFS directory written here.
// Nothing reaches the network: every fixture is local; mock pages have outside requests blocked.
// Each width runs in a FRESH profile, so the one-time setup guide and the one-time snapshot notice appear every time.

import { spawn, type ChildProcess } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, type BrowserContext, type Page } from 'playwright';

const ROOT = path.resolve(import.meta.dirname, '..');
const CHROME_EXT = path.join(ROOT, '.output', 'chrome-mv3');
const FIREFOX_EXT = path.join(ROOT, '.output', 'firefox-mv3');
const FIREFOX_EXE = 'C:\\Program Files\\Mozilla Firefox\\firefox.exe';
const FIREFOX_UUID = '8d1f0c2a-0b1e-4c55-9a3e-5e7a1b2c3d4e';
const GECKO_ID = 'peekover@peekover.dev';

const WIDTHS = [1440, 1280, 1080, 414] as const;
const HEIGHT: Record<number, number> = { 1440: 900, 1280: 800, 1080: 800, 414: 896 };
const THEMES = ['light', 'dark'] as const;
export type Theme = (typeof THEMES)[number];
export type EngineName = 'chromium' | 'firefox';

const arg = (name: string): string | undefined => {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : undefined;
};
const OUT = arg('--out') ?? 'D:\\Dev\\peekover-shots\\8.1';
const ONLY_ENGINE = arg('--engine') as EngineName | undefined;
const ONLY_SURFACE = arg('--only');
export const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

// ── Fixtures ─────────────────────────────────────────────────────────────────────────────────────────────────────

const longCode = Array.from({ length: 60 }, (_, i) => `  const step${i} = render(doc, { line: ${i}, safe: true });`).join('\n');
const WELCOME = `# Welcome to Aurora

Peekover renders the markdown your tools and agents write, on this device, with nothing sent anywhere. This page is
the 8.1 walk's sample document: every part of the reader appears once.

## Reading, upgraded

A paragraph with **bold**, *italic*, \`inline code\`, and a [link](#tables-that-behave).

> A quotation, set apart from the text around it.

- [x] A finished task
- [ ] An open task

## Code

\`\`\`ts
// greet the reader
export function greet(name: string): string {
  const MAX = 42;
  return \`Hello, \${name}\`.repeat(2);
}
\`\`\`

\`\`\`python
def count(lines: list[str]) -> int:
    return sum(1 for l in lines if l.startswith("#"))
\`\`\`

### A long block

\`\`\`js
function long() {
${longCode}
}
\`\`\`

## Tables that behave

| Department | People | Budget |
| --- | ---: | ---: |
| Engineering | 42 | 1,200 |
| Design | 7 | 300 |
| Research | 12 | 450 |
| Support | 18 | 210 |

## Math

Inline math, $e^{i\\pi} + 1 = 0$, sits in the line.

$$
\\int_0^\\infty e^{-x^2}\\,dx = \\frac{\\sqrt{\\pi}}{2}
$$

## Diagram

\`\`\`mermaid
flowchart LR
  A[Raw file] --> B[Peekover] --> C[Reading]
\`\`\`

## Remote media

![A remote image](https://example.com/aurora.png)

## The end

The reading column keeps its measure at every width.
`;
const AGENT = `# CLAUDE.md

Instructions an agent reads before it works in this repository.

## Commands

- \`pnpm test\` — the unit suite
- \`pnpm build\` — a production build

## Rules

1. Zero network by default.
2. Every HTML string is sanitized.
`;
const SHORT = '# A short note\n\nOne paragraph, no sections.\n';
const FILES: Record<string, string> = {
  'welcome.md': WELCOME,
  'CLAUDE.md': AGENT,
  'architecture.md': '# Architecture\n\n## Pipeline\n\nParse, sanitize, render.\n\n## Chrome\n\nThe toolbar and the panes.\n',
  'changelog.md': '# Changelog\n\n## 0.1.0\n\nFirst release.\n',
  'short.md': SHORT,
};

// ── The engine seam ──────────────────────────────────────────────────────────────────────────────────────────────

export interface Engine {
  readonly name: EngineName;
  /** Navigate the working tab to an extension page path, e.g. `/app.html`. */
  ext(p: string): Promise<void>;
  /** Navigate the working tab to a file:// URL. */
  file(url: string): Promise<void>;
  evaluate<T>(expr: string): Promise<T>;
  shot(file: string): Promise<void>;
  /** A chord: modifiers then a key, e.g. ['Control', 'f']. */
  chord(keys: string[]): Promise<void>;
  type(text: string): Promise<void>;
  /** Chromium only: flip "Allow access to file URLs" on chrome://extensions, then restart the same profile. */
  flipFileAccess?(): Promise<void>;
  close(): Promise<void>;
}

export async function chromiumEngine(theme: Theme, width: number): Promise<Engine> {
  const udd = fs.mkdtempSync(path.join(os.tmpdir(), 'peekover-walk-cr-'));
  const launch = () =>
    chromium.launchPersistentContext(udd, {
      channel: 'chromium',
      colorScheme: theme,
      viewport: { width, height: HEIGHT[width] },
      args: [`--disable-extensions-except=${CHROME_EXT}`, `--load-extension=${CHROME_EXT}`],
    });
  let ctx: BrowserContext = await launch();
  let [sw] = ctx.serviceWorkers();
  if (!sw) sw = await ctx.waitForEvent('serviceworker', { timeout: 30_000 });
  const id = new URL(sw.url()).host;
  // The install opens the setup guide in its own tab; work in one tab of our own.
  await sleep(1500);
  let page: Page = await ctx.newPage();
  for (const p of ctx.pages()) if (p !== page) await p.close();
  let crashed = false;
  const watchCrash = (pg: Page) => pg.on('crash', () => (crashed = true));
  watchCrash(page);
  /** A tab that crashed is replaced before the next state, so one crash costs one cell, not the rest. */
  const live = async (): Promise<Page> => {
    if (crashed || page.isClosed()) {
      crashed = false;
      page = await ctx.newPage();
      watchCrash(page);
    }
    return page;
  };
  return {
    name: 'chromium',
    async ext(p) {
      await (await live()).goto(`chrome-extension://${id}${p}`, { waitUntil: 'load' });
    },
    async file(url) {
      await (await live()).goto(url, { waitUntil: 'load' });
    },
    evaluate: <T>(expr: string) => page.evaluate(expr) as Promise<T>,
    async shot(file) {
      await page.screenshot({ path: file });
    },
    async chord(keys) {
      await page.keyboard.press(keys.join('+'));
    },
    async type(text) {
      await page.keyboard.type(text);
    },
    async flipFileAccess() {
      await page.goto(`chrome://extensions/?id=${id}`, { waitUntil: 'load' });
      await page.locator('#allow-on-file-urls').click();
      await sleep(1500);
      // A --load-extension profile starts with the toggle ON (measured, Playwright Chromium); a store install starts
      // OFF. The flip blocks Peekover's pages until the browser restarts (measured at 6.2) — restart the same profile.
      await ctx.close();
      ctx = await launch();
      await sleep(1500);
      page = await ctx.newPage();
      watchCrash(page);
      for (const p of ctx.pages()) if (p !== page) await p.close();
    },
    async close() {
      await ctx.close();
      fs.rmSync(udd, { recursive: true, force: true });
    },
  };
}

/** WebDriver BiDi key values for the modifiers used here. */
const BIDI_KEYS: Record<string, string> = { Control: '\uE009', Shift: '\uE008', Escape: '\uE00C', Enter: '\uE007', End: '\uE010' };

/** Firefox's smallest window is 500 px: a narrower cell is drawn at this device-pixel scale (the PNG is 500 px wide). */
const fxScale = (width: number): number => (width < 500 ? 500 / width : 1);

export async function firefoxEngine(theme: Theme, width: number, port: number): Promise<Engine> {
  const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'peekover-walk-fx-'));
  fs.writeFileSync(
    path.join(prof, 'user.js'),
    [
      `user_pref("extensions.webextensions.uuids", ${JSON.stringify(JSON.stringify({ [GECKO_ID]: FIREFOX_UUID }))});`,
      `user_pref("layout.css.prefers-color-scheme.content-override", ${theme === 'dark' ? 0 : 1});`,
      // A Firefox window is at least 500 px wide: below that, scale device pixels so the page lays out at `width` CSS px.
      `user_pref("layout.css.devPixelsPerPx", "${(fxScale(width)).toFixed(4)}");`,
      'user_pref("browser.shell.checkDefaultBrowser", false);',
      'user_pref("datareporting.policy.dataSubmissionEnabled", false);',
      'user_pref("toolkit.telemetry.reportingpolicy.firstRun", false);',
      'user_pref("browser.aboutwelcome.enabled", false);',
    ].join('\n'),
  );
  const ff: ChildProcess = spawn(
    FIREFOX_EXE,
    ['-headless', '-no-remote', '-profile', prof, `--remote-debugging-port=${port}`, '--remote-allow-system-access'],
    { stdio: 'ignore', env: { ...process.env, MOZ_REMOTE_ALLOW_SYSTEM_ACCESS: '1' } },
  );
  let ws: WebSocket | null = null;
  for (let i = 0; i < 60 && !ws; i++) {
    await sleep(500);
    try {
      const s = new WebSocket(`ws://127.0.0.1:${port}/session`);
      await new Promise<void>((res, rej) => {
        s.onopen = () => res();
        s.onerror = () => rej(new Error('no socket'));
      });
      ws = s;
    } catch {
      ws = null;
    }
  }
  if (!ws) throw new Error('Firefox BiDi did not come up');
  const sock = ws;
  let seq = 0;
  const pending = new Map<number, (d: { type: string; result?: unknown; error?: string; message?: string }) => void>();
  sock.onmessage = (m) => {
    const d = JSON.parse(String(m.data));
    if (d.id && pending.has(d.id)) {
      pending.get(d.id)!(d);
      pending.delete(d.id);
    }
  };
  const call = async <T>(method: string, params: object): Promise<T> => {
    const d = await new Promise<{ type: string; result?: unknown; error?: string; message?: string }>((res) => {
      const id = ++seq;
      pending.set(id, res);
      sock.send(JSON.stringify({ id, method, params }));
    });
    if (d.type === 'error') throw new Error(`${method}: ${d.error} ${d.message}`);
    return d.result as T;
  };
  await call('session.new', { capabilities: {} });
  await call('webExtension.install', { extensionData: { type: 'path', path: FIREFOX_EXT } });
  // The install opens the setup guide: an extension page, the only kind of tab the driver may point at moz-extension.
  let extCtx = '';
  for (let i = 0; i < 20 && !extCtx; i++) {
    await sleep(500);
    const tree = await call<{ contexts: { context: string; url: string }[] }>('browsingContext.getTree', {});
    extCtx = tree.contexts.find((c) => c.url.startsWith('moz-extension:'))?.context ?? '';
  }
  if (!extCtx) throw new Error('the setup guide tab did not open on install');
  const fileCtx = (await call<{ context: string }>('browsingContext.create', { type: 'tab', background: true })).context;
  let current = extCtx;
  // Size the window so the page's own innerWidth / innerHeight are the cell's.
  const wins = await call<{ clientWindows: { clientWindow: string }[] }>('browser.getClientWindows', {});
  const win = wins.clientWindows[0].clientWindow;
  const scale = fxScale(width);
  let h = Math.round(HEIGHT[width] * scale) + 85;
  const evalIn = async <T>(context: string, expr: string): Promise<T> => {
    const r = await call<{ type: string; result: { value?: unknown }; exceptionDetails?: { text: string } }>(
      'script.evaluate',
      { target: { context }, expression: `(async () => JSON.stringify(await (${expr})))()`, awaitPromise: true },
    );
    if (r.type === 'exception') throw new Error(`evaluate: ${r.exceptionDetails?.text}`);
    const v = r.result.value;
    return (typeof v === 'string' ? JSON.parse(v) : undefined) as T;
  };
  for (let i = 0; i < 3; i++) {
    await call('browser.setClientWindowState', { clientWindow: win, state: 'normal', width: Math.round(width * scale), height: h });
    const [iw, ih] = await evalIn<[number, number]>(extCtx, '[innerWidth, innerHeight]');
    if (iw === width && ih === HEIGHT[width]) break;
    h += Math.round((HEIGHT[width] - ih) * scale);
  }
  const waitLoaded = async (context: string, pathPrefix: string): Promise<void> => {
    for (let i = 0; i < 60; i++) {
      await sleep(250);
      try {
        const ok = await evalIn<boolean>(
          context,
          `document.readyState === 'complete' && (location.pathname + location.search).startsWith(${JSON.stringify(pathPrefix)})`,
        );
        if (ok) return;
      } catch {
        // mid-navigation
      }
    }
    throw new Error(`page did not load: ${pathPrefix}`);
  };
  const keyActions = (keys: string[]): object[] => {
    const v = keys.map((k) => BIDI_KEYS[k] ?? k);
    return [...v.map((value) => ({ type: 'keyDown', value })), ...[...v].reverse().map((value) => ({ type: 'keyUp', value }))];
  };
  return {
    name: 'firefox',
    async ext(p) {
      current = extCtx;
      await evalIn(extCtx, `(location.assign(${JSON.stringify(p)}), true)`);
      await sleep(300);
      await waitLoaded(extCtx, p);
    },
    async file(url) {
      current = fileCtx;
      await call('browsingContext.navigate', { context: fileCtx, url, wait: 'complete' });
    },
    evaluate: <T>(expr: string) => evalIn<T>(current, expr),
    async shot(file) {
      const r = await call<{ data: string }>('browsingContext.captureScreenshot', { context: current });
      fs.writeFileSync(file, Buffer.from(r.data, 'base64'));
    },
    async chord(keys) {
      await call('input.performActions', { context: current, actions: [{ type: 'key', id: 'kb', actions: keyActions(keys) }] });
    },
    async type(text) {
      const actions = [...text].flatMap((c) => [
        { type: 'keyDown', value: c },
        { type: 'keyUp', value: c },
      ]);
      await call('input.performActions', { context: current, actions: [{ type: 'key', id: 'kb', actions }] });
    },
    async close() {
      try {
        await call('session.end', {});
      } catch {
        // already gone
      }
      sock.close();
      spawn('taskkill', ['/F', '/T', '/PID', String(ff.pid)], { stdio: 'ignore' });
      await sleep(1500);
      fs.rmSync(prof, { recursive: true, force: true, maxRetries: 5, retryDelay: 500 });
    },
  };
}

// ── In-page helpers (strings: the house convention — tsc never type-checks browser globals here) ────────────────

const H = String.raw`(() => {
  const deep = () => { const out = []; const walk = (n) => { for (const el of n.querySelectorAll('*')) { out.push(el); if (el.shadowRoot) walk(el.shadowRoot); } }; walk(document); return out; };
  const vis = (el) => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
  const label = (e) => ((e.textContent || '').trim() + ' | ' + (e.getAttribute('aria-label') || '')).toLowerCase();
  const find = (sel, text) => deep().filter((e) => e.matches(sel) && vis(e) && (!text || label(e).includes(text.toLowerCase())));
  const click = (sel, text) => { const e = find(sel, text)[0]; if (!e) return false; e.click(); return true; };
  const one = (sel) => deep().find((e) => e.matches(sel)) || null;
  return { deep, vis, find, click, one };
})()`;
export const inPage = (body: string): string => `(async () => { const H = ${H}; ${body} })()`;

export async function waitFor(E: Engine, cond: string, ms = 8000): Promise<boolean> {
  for (let t = 0; t < ms; t += 200) {
    try {
      if (await E.evaluate<boolean>(inPage(`return !!(${cond});`))) return true;
    } catch {
      // mid-navigation
    }
    await sleep(200);
  }
  return false;
}

const READER_READY = `(() => { const r = H.one('.peekover-reader'); return r && r.textContent.trim().length > 0; })()`;

async function seedOpfs(E: Engine): Promise<void> {
  await E.evaluate(
    inPage(`
      const root = await navigator.storage.getDirectory();
      const dir = await root.getDirectoryHandle('notes', { create: true });
      const files = ${JSON.stringify(FILES)};
      for (const [name, text] of Object.entries(files)) {
        const fh = await dir.getFileHandle(name, { create: true });
        const w = await fh.createWritable(); await w.write(text); await w.close();
      }
      await root.getDirectoryHandle('empty', { create: true });
      return true;`),
  );
}

/** A fresh app page with the `notes` folder open and `file` selected (or none). */
export async function freshApp(E: Engine, file: string | null, folder = 'notes'): Promise<void> {
  await E.ext('/app.html?__peekoverHarness');
  if (!(await waitFor(E, `window.__peekoverHarness && typeof window.__peekoverHarness.openFromHandle === 'function'`))) {
    throw new Error('harness seam missing');
  }
  await E.evaluate(
    inPage(`const root = await navigator.storage.getDirectory();
      await window.__peekoverHarness.openFromHandle(await root.getDirectoryHandle(${JSON.stringify(folder)}));
      return true;`),
  );
  if (!file) return;
  await openTreeFile(E, file);
}

async function openTreeFile(E: Engine, file: string): Promise<void> {
  const ok = await E.evaluate<boolean>(
    inPage(`const items = H.deep().filter((e) => e.matches('[role="treeitem"][data-kind="file"]'));
      const it = items.find((e) => (e.textContent || '').trim() === ${JSON.stringify(file)});
      if (!it) return false; it.click(); return true;`),
  );
  if (!ok) {
    // The pane may be an overlay (≤ 1189 px) — open it with "Files", pick the file, and it closes itself.
    await E.evaluate(inPage(`return H.click('button', 'Files');`));
    await sleep(400);
    const ok2 = await E.evaluate<boolean>(
      inPage(`const it = H.deep().filter((e) => e.matches('[role="treeitem"][data-kind="file"]')).find((e) => (e.textContent || '').trim() === ${JSON.stringify(file)});
        if (!it) return false; it.click(); return true;`),
    );
    if (!ok2) throw new Error(`no tree item ${file}`);
  }
  if (!(await waitFor(E, READER_READY))) throw new Error(`reader did not render ${file}`);
  await sleep(900); // code, math and diagram enhancers settle
}

/** Click an app control: in the toolbar when it shows, else through "⋯". */
async function appControl(E: Engine, text: string): Promise<boolean> {
  if (await E.evaluate<boolean>(inPage(`return H.click('.peekover-toolbar__app button', ${JSON.stringify(text)});`))) return true;
  await E.evaluate(inPage(`return H.click('button[aria-haspopup="menu"]', '⋯');`));
  await sleep(250);
  return E.evaluate<boolean>(inPage(`return H.click('[role="menuitem"]', ${JSON.stringify(text)});`));
}

async function scrollTo(E: Engine, sel: string, block: 'start' | 'center' = 'start'): Promise<boolean> {
  const ok = await E.evaluate<boolean>(
    inPage(`const e = H.one(${JSON.stringify(sel)}); if (!e) return false; e.scrollIntoView({ block: ${JSON.stringify(block)} }); return true;`),
  );
  await sleep(500);
  return ok;
}

// ── Surfaces ─────────────────────────────────────────────────────────────────────────────────────────────────────

type Outcome = { status: 'captured' } | { status: 'n/a' | 'failed'; why: string };
interface Ctx {
  E: Engine;
  width: number;
  fixtures: string;
}
interface Surface {
  section: string;
  id: string;
  /** Mock frame: [file, state] for toolbar-mock.html, or [file, selector] for mockup.html. */
  mock?: ['toolbar-mock', string] | ['mockup', string];
  engines?: EngineName[];
  /** Arrange the state; return a string to mark the cell n/a with that reason. */
  run(c: Ctx): Promise<void | string>;
}

const NA_WIDE_MORE = 'no "⋯" above 863 px — the app controls are in the toolbar';
const NA_WIDE_FILES = 'no Files overlay above 1189 px — the pane stays in the row';

const SURFACES: Surface[] = [
  // 1 · Install and setup guide
  { section: '1-install', id: 'setup-guide', run: async ({ E }) => void (await E.ext('/onboarding.html'), await sleep(800)) },
  // 3 · App page — toolbar and chrome
  { section: '3-app-chrome', id: 'no-folder', mock: ['toolbar-mock', 'empty'], run: async ({ E }) => void (await E.ext('/app.html'), await sleep(800)) },
  { section: '3-app-chrome', id: 'folder-granted', run: async ({ E }) => void (await freshApp(E, null), await sleep(500)) },
  { section: '3-app-chrome', id: 'reading', mock: ['toolbar-mock', 'reading'], run: async ({ E }) => void (await freshApp(E, 'welcome.md')) },
  { section: '3-app-chrome', id: 'agent-file', mock: ['toolbar-mock', 'agent'], run: async ({ E }) => void (await freshApp(E, 'CLAUDE.md')) },
  {
    section: '3-app-chrome',
    id: 'raw',
    run: async ({ E }) => {
      await freshApp(E, 'welcome.md');
      await E.evaluate(inPage(`return H.click('[role="group"][aria-label="View"] button', 'Raw');`));
      await sleep(600);
    },
  },
  {
    section: '3-app-chrome',
    id: 'more-menu',
    mock: ['toolbar-mock', 'more'],
    run: async ({ E, width }) => {
      await freshApp(E, 'welcome.md');
      if (width > 863) return NA_WIDE_MORE;
      await E.evaluate(inPage(`return H.click('button[aria-haspopup="menu"]', '⋯');`));
      await sleep(400);
    },
  },
  {
    section: '3-app-chrome',
    id: 'files-overlay',
    mock: ['toolbar-mock', 'files'],
    run: async ({ E, width }) => {
      await freshApp(E, 'welcome.md');
      if (width > 1189) return NA_WIDE_FILES;
      await E.evaluate(inPage(`return H.click('button', 'Files');`));
      await sleep(500);
    },
  },
  {
    section: '3-app-chrome',
    id: 'folder-search',
    run: async ({ E, width }) => {
      await freshApp(E, 'welcome.md');
      if (width <= 1189) await E.evaluate(inPage(`return H.click('button', 'Files');`));
      await sleep(300);
      const ok = await E.evaluate<boolean>(
        inPage(`const s = H.find('input[type="search"], input[placeholder="Search files…"]')[0]; if (!s) return false;
          s.focus(); s.value = 'arch'; s.dispatchEvent(new Event('input', { bubbles: true })); return true;`),
      );
      await sleep(400);
      if (!ok) throw new Error('no search field');
    },
  },
  { section: '3-app-chrome', id: 'folder-empty', run: async ({ E }) => void (await freshApp(E, null, 'empty'), await sleep(500)) },
  {
    section: '3-app-chrome',
    id: 'watch-first-notice',
    mock: ['toolbar-mock', 'notice'],
    run: async ({ E }) => {
      await freshApp(E, 'welcome.md');
      if (!(await E.evaluate<boolean>(inPage(`return H.click('button', 'Watch this file');`)))) throw new Error('no Watch control');
      await sleep(1200);
    },
  },
  {
    section: '3-app-chrome',
    id: 'watching',
    mock: ['toolbar-mock', 'watching'],
    run: async ({ E }) => {
      await freshApp(E, 'welcome.md');
      await E.evaluate(inPage(`return H.click('button', 'Watch this file');`));
      await sleep(800);
      await E.evaluate(inPage(`return H.click('button', 'Got it');`));
      await sleep(600);
    },
  },
  {
    section: '3-app-chrome',
    id: 'compare-picker',
    mock: ['toolbar-mock', 'compare'],
    run: async ({ E }) => {
      await freshApp(E, 'welcome.md');
      await E.evaluate(inPage(`return H.click('button', 'Watch this file');`));
      await sleep(800);
      await E.evaluate(inPage(`return H.click('button', 'Got it');`));
      // An edit to the watched file on disk, so a snapshot exists to compare with.
      await E.evaluate(
        inPage(`const root = await navigator.storage.getDirectory(); const dir = await root.getDirectoryHandle('notes');
          const fh = await dir.getFileHandle('welcome.md'); const w = await fh.createWritable();
          await w.write(${JSON.stringify(WELCOME.replace('every part of the reader appears once', 'every part of the reader appears once, and this sentence changed while it was watched'))});
          await w.close(); return true;`),
      );
      await sleep(4000);
      if (!(await E.evaluate<boolean>(inPage(`return H.click('button', 'Compare');`)))) throw new Error('no Compare control');
      await sleep(800);
    },
  },
  {
    section: '4-reader',
    id: 'diff-view',
    run: async ({ E }) => {
      await freshApp(E, 'welcome.md');
      await E.evaluate(inPage(`return H.click('button', 'Watch this file');`));
      await sleep(800);
      await E.evaluate(inPage(`return H.click('button', 'Got it');`));
      await E.evaluate(
        inPage(`const root = await navigator.storage.getDirectory(); const dir = await root.getDirectoryHandle('notes');
          const fh = await dir.getFileHandle('welcome.md'); const w = await fh.createWritable();
          await w.write(${JSON.stringify(WELCOME.replace('every part of the reader appears once', 'every part of the reader appears once, and this sentence changed while it was watched, a second time for the diff'))});
          await w.close(); return true;`),
      );
      await sleep(4000);
      if (!(await E.evaluate<boolean>(inPage(`return H.click('button', 'Compare');`)))) throw new Error('no Compare control');
      await sleep(600);
      // A different edit from compare-picker's: the same bytes again would make no snapshot.
      // The first snapshot row in the picker (the rows under "Snapshots of this document").
      const ok = await E.evaluate<boolean>(
        inPage(`const g = H.find('[role="group"]').find((e) => (e.getAttribute('aria-label') || '').toLowerCase().includes('snapshot'));
          const b = g ? [...g.querySelectorAll('button,[role="option"],[role="menuitem"]')].find((x) => H.vis(x)) : null;
          if (!b) return false; b.click(); return true;`),
      );
      await sleep(1200);
      if (!ok) throw new Error('no snapshot row in the picker');
    },
  },
  {
    section: '3-app-chrome',
    id: 'no-folder-pinned',
    run: async ({ E }) => {
      await freshApp(E, 'welcome.md');
      if (!(await E.evaluate<boolean>(inPage(`return H.click('button', 'Pin this folder');`)))) {
        // ≤ 1189 px: the pane is the overlay behind "Files".
        await E.evaluate(inPage(`return H.click('button', 'Files');`));
        await sleep(400);
        if (!(await E.evaluate<boolean>(inPage(`return H.click('button', 'Pin this folder');`)))) throw new Error('no Pin this folder');
      }
      await sleep(600);
      await E.ext('/app.html');
      await sleep(1000);
    },
  },
  {
    section: '3-app-chrome',
    id: 'remote-media',
    run: async ({ E }) => {
      await freshApp(E, 'welcome.md');
      if (!(await scrollTo(E, '.peekover-reader h2#remote-media, .peekover-reader [id="remote-media"]', 'start'))) {
        await E.evaluate(inPage(`const h = H.find('.peekover-reader h2', 'Remote media')[0]; if (h) h.scrollIntoView(); return !!h;`));
        await sleep(400);
      }
    },
  },
  // 4 · App page — the reader and its parts
  {
    section: '4-reader',
    id: 'toc-open',
    mock: ['mockup', 'top'],
    run: async ({ E, width }) => {
      await freshApp(E, 'welcome.md');
      if (width <= 1080) {
        await E.evaluate(inPage(`return H.click('button', 'On this page');`));
        await sleep(500);
      }
    },
  },
  { section: '4-reader', id: 'short-document', run: async ({ E }) => void (await freshApp(E, 'short.md')) },
  {
    section: '4-reader',
    id: 'code-blocks',
    mock: ['mockup', 'pre'],
    run: async ({ E }) => {
      await freshApp(E, 'welcome.md');
      await E.evaluate(inPage(`const h = H.find('.peekover-reader h2', 'Code')[0]; if (h) h.scrollIntoView(); return !!h;`));
      await sleep(500);
    },
  },
  {
    section: '4-reader',
    id: 'long-code',
    run: async ({ E }) => {
      await freshApp(E, 'welcome.md');
      await E.evaluate(inPage(`const h = H.find('.peekover-reader h3', 'A long block')[0]; if (h) h.scrollIntoView(); return !!h;`));
      await sleep(500);
    },
  },
  {
    section: '4-reader',
    id: 'math',
    mock: ['mockup', '#s4'],
    run: async ({ E }) => {
      await freshApp(E, 'welcome.md');
      await E.evaluate(inPage(`const h = H.find('.peekover-reader h2', 'Math')[0]; if (h) h.scrollIntoView(); return !!h;`));
      await sleep(600);
    },
  },
  {
    section: '4-reader',
    id: 'table-tools',
    mock: ['mockup', '#tTable'],
    run: async ({ E }) => {
      await freshApp(E, 'welcome.md');
      await E.evaluate(inPage(`const h = H.find('.peekover-reader h2', 'Tables that behave')[0]; if (h) h.scrollIntoView(); return !!h;`));
      await sleep(500);
    },
  },
  {
    section: '4-reader',
    id: 'table-filtered',
    run: async ({ E }) => {
      await freshApp(E, 'welcome.md');
      await E.evaluate(inPage(`const h = H.find('.peekover-reader h2', 'Tables that behave')[0]; if (h) h.scrollIntoView(); return !!h;`));
      const ok = await E.evaluate<boolean>(
        inPage(`const f = H.find('.peekover-reader input')[0]; if (!f) return false; f.focus(); f.value = 'des';
          f.dispatchEvent(new Event('input', { bubbles: true })); return true;`),
      );
      await sleep(500);
      if (!ok) throw new Error('no table filter field');
    },
  },
  {
    section: '4-reader',
    id: 'diagram',
    mock: ['mockup', '#flowSvg'],
    run: async ({ E }) => {
      await freshApp(E, 'welcome.md');
      await E.evaluate(inPage(`const h = H.find('.peekover-reader h2', 'Diagram')[0]; if (h) h.scrollIntoView(); return !!h;`));
      await waitFor(E, `H.one('.peekover-reader svg[id^="mermaid"], .peekover-reader .peekover-diagram svg')`, 6000);
      await sleep(600);
    },
  },
  {
    section: '4-reader',
    id: 'diagram-lightbox',
    run: async ({ E }) => {
      await freshApp(E, 'welcome.md');
      await E.evaluate(inPage(`const h = H.find('.peekover-reader h2', 'Diagram')[0]; if (h) h.scrollIntoView(); return !!h;`));
      await waitFor(E, `H.one('.peekover-reader .peekover-diagram svg, .peekover-reader svg[id^="mermaid"]')`, 6000);
      const ok = await E.evaluate<boolean>(inPage(`const b = H.find('[class*="diagram"] button', '')[0]; if (!b) return false; b.click(); return true;`));
      await sleep(800);
      if (!ok) throw new Error('no diagram lightbox trigger');
    },
  },
  {
    section: '4-reader',
    id: 'stored-data-panel',
    run: async ({ E }) => {
      await freshApp(E, 'welcome.md');
      if (!(await appControl(E, 'Stored data'))) throw new Error('no Stored data control');
      await sleep(700);
    },
  },
  {
    section: '4-reader',
    id: 'export-panel',
    run: async ({ E }) => {
      await freshApp(E, 'welcome.md');
      if (!(await appControl(E, 'Export'))) throw new Error('no Export control');
      await sleep(700);
    },
  },
  {
    section: '4-reader',
    id: 'code-theme-panel',
    run: async ({ E }) => {
      await freshApp(E, 'welcome.md');
      if (!(await appControl(E, 'Code theme'))) throw new Error('no Code theme control');
      await sleep(700);
    },
  },
  {
    section: '4-reader',
    id: 'editing',
    mock: ['toolbar-mock', 'editing'],
    run: async ({ E }) => {
      await freshApp(E, 'welcome.md');
      await E.evaluate(inPage(`return H.click('[role="group"][aria-label="View"] button', 'Edit');`));
      if (!(await waitFor(E, `H.one('.cm-editor')`, 10000))) throw new Error('the editor did not open');
      await sleep(900);
    },
  },
  {
    section: '4-reader',
    id: 'editing-unsaved',
    run: async ({ E }) => {
      await freshApp(E, 'welcome.md');
      await E.evaluate(inPage(`return H.click('[role="group"][aria-label="View"] button', 'Edit');`));
      if (!(await waitFor(E, `H.one('.cm-content')`, 10000))) throw new Error('the editor did not open');
      await E.evaluate(inPage(`const c = H.one('.cm-content'); c.focus(); return true;`));
      await E.chord(['Control', 'End']);
      await E.type(' An edit.');
      await sleep(900);
    },
  },
  {
    section: '4-reader',
    id: 'unsaved-guard',
    run: async ({ E }) => {
      await freshApp(E, 'welcome.md');
      await E.evaluate(inPage(`return H.click('[role="group"][aria-label="View"] button', 'Edit');`));
      if (!(await waitFor(E, `H.one('.cm-content')`, 10000))) throw new Error('the editor did not open');
      await E.evaluate(inPage(`const c = H.one('.cm-content'); c.focus(); return true;`));
      await E.chord(['Control', 'End']);
      await E.type(' An edit.');
      await sleep(500);
      await E.evaluate(inPage(`return H.click('[role="group"][aria-label="View"] button', 'Read');`));
      await sleep(700);
    },
  },
  {
    section: '4-reader',
    id: 'editor-search',
    run: async ({ E }) => {
      await freshApp(E, 'welcome.md');
      await E.evaluate(inPage(`return H.click('[role="group"][aria-label="View"] button', 'Edit');`));
      if (!(await waitFor(E, `H.one('.cm-content')`, 10000))) throw new Error('the editor did not open');
      await E.evaluate(inPage(`const c = H.one('.cm-content'); c.focus(); return true;`));
      await E.chord(['Control', 'f']);
      await sleep(700);
      if (!(await waitFor(E, `H.one('.cm-search')`, 2000))) throw new Error('the search panel did not open');
    },
  },
  // 5 · The tab reader (content script on file://)
  {
    section: '5-tab-reader',
    id: 'tab-reader',
    run: async ({ E, fixtures }) => {
      await E.file(fileUrl(path.join(fixtures, 'welcome.md')));
      await sleep(2500);
    },
  },
  {
    section: '5-tab-reader',
    id: 'tab-reader-contents-open',
    run: async ({ E, fixtures }) => {
      await E.file(fileUrl(path.join(fixtures, 'welcome.md')));
      await sleep(2500);
      if (!(await E.evaluate<boolean>(inPage(`return H.click('button', 'On this page');`)))) throw new Error('no contents opener (the reader did not mount?)');
      await sleep(600);
    },
  },
  {
    section: '5-tab-reader',
    id: 'tab-reader-reading',
    run: async ({ E, fixtures }) => {
      await E.file(fileUrl(path.join(fixtures, 'welcome.md')));
      await sleep(2500);
      await E.evaluate(inPage(`const h = H.find('h2', 'Tables that behave')[0]; if (h) h.scrollIntoView({ block: 'center' }); return !!h;`));
      await sleep(500);
    },
  },
];

export const fileUrl = (p: string): string => 'file:///' + p.replace(/\\/g, '/');

// ── Mock frames (Chromium, engine-independent) ───────────────────────────────────────────────────────────────────

async function captureMocks(theme: Theme, width: number, need: Map<string, Surface>): Promise<void> {
  const udd = fs.mkdtempSync(path.join(os.tmpdir(), 'peekover-walk-mock-'));
  const ctx = await chromium.launchPersistentContext(udd, { channel: 'chromium', colorScheme: theme, viewport: { width, height: HEIGHT[width] } });
  await ctx.route(/^https?:/, (r) => r.abort()); // design files: nothing leaves the machine
  const page = ctx.pages()[0] ?? (await ctx.newPage());
  try {
    for (const s of need.values()) {
      const [file, key] = s.mock!;
      const out = path.join(OUT, s.section, s.id, `mock-${theme}-${width}.png`);
      fs.mkdirSync(path.dirname(out), { recursive: true });
      if (file === 'toolbar-mock') {
        await page.goto(fileUrl(path.join(ROOT, 'design', 'toolbar-mock.html')), { waitUntil: 'load' });
        await page.evaluate(
          `(() => { const html = frameHtml(${JSON.stringify(theme)}, ${JSON.stringify(key)}, ${width});
            document.body.innerHTML = '<div id="frames"><div class="framewrap">' + html + '</div></div>';
            document.body.style.margin = '0'; document.body.style.padding = '0'; })()`,
        );
      } else {
        await page.goto(fileUrl(path.join(ROOT, 'design', 'mockup.html')), { waitUntil: 'load' });
        await page.evaluate(
          `(() => { document.documentElement.setAttribute('data-theme', ${JSON.stringify(theme)});
            for (const el of document.querySelectorAll('.hintpill')) el.remove();
            const k = ${JSON.stringify(key)};
            const t = k === 'top' ? null : (k === 'pre' ? document.querySelector('#doc pre') : document.querySelector(k));
            if (t) t.scrollIntoView({ block: 'center' }); })()`,
        );
      }
      await sleep(400);
      await page.screenshot({ path: out });
    }
  } finally {
    await ctx.close();
    fs.rmSync(udd, { recursive: true, force: true });
  }
}

/** The shot and its mock frame side by side, drawn by Chromium from the two files. */
async function composeSides(pairs: { shot: string; mock: string; out: string; caption: string }[]): Promise<void> {
  if (pairs.length === 0) return;
  const udd = fs.mkdtempSync(path.join(os.tmpdir(), 'peekover-walk-side-'));
  const ctx = await chromium.launchPersistentContext(udd, { channel: 'chromium', viewport: { width: 800, height: 600 } });
  const page = ctx.pages()[0] ?? (await ctx.newPage());
  try {
    for (const p of pairs) {
      const b64 = (f: string) => 'data:image/png;base64,' + fs.readFileSync(f).toString('base64');
      await page.setContent(
        `<body style="margin:0;background:#888;font:600 14px system-ui">
          <div style="display:flex;gap:12px;padding:12px;align-items:flex-start;width:max-content">
            <figure style="margin:0"><figcaption style="padding:0 0 6px">Built extension — ${p.caption}</figcaption><img src="${b64(p.shot)}"></figure>
            <figure style="margin:0"><figcaption style="padding:0 0 6px">Mock frame</figcaption><img src="${b64(p.mock)}"></figure>
          </div></body>`,
      );
      await page.locator('body > div').screenshot({ path: p.out });
    }
  } finally {
    await ctx.close();
    fs.rmSync(udd, { recursive: true, force: true });
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  for (const d of [CHROME_EXT, FIREFOX_EXT]) if (!fs.existsSync(path.join(d, 'manifest.json'))) throw new Error(`build first: ${d}`);
  const fixtures = path.join(OUT, '_fixtures');
  fs.mkdirSync(fixtures, { recursive: true });
  for (const [n, t] of Object.entries(FILES)) fs.writeFileSync(path.join(fixtures, n), t);
  const manifestPath = path.join(OUT, 'manifest.json');
  const manifest: Record<string, Outcome> = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : {};
  const surfaces = SURFACES.filter((s) => !ONLY_SURFACE || s.id === ONLY_SURFACE);
  const engines: EngineName[] = ONLY_ENGINE ? [ONLY_ENGINE] : ['chromium', 'firefox'];
  let port = 9420;

  for (const engine of engines) {
    for (const theme of THEMES) {
      for (const width of WIDTHS) {
        const cell = `${theme}-${engine}-${width}`;
        console.log(`[walk-shots] ${cell}`);
        const E = engine === 'chromium' ? await chromiumEngine(theme, width) : await firefoxEngine(theme, width, port++);
        try {
          await E.ext('/app.html');
          await seedOpfs(E);
          // Chromium: file access is OFF on a fresh install — the guide is captured in that state first.
          for (const s of surfaces) {
            if (s.engines && !s.engines.includes(engine)) continue;
            const key = `${s.section}/${s.id}/${cell}`;
            const out = path.join(OUT, s.section, s.id, `${cell}.png`);
            fs.mkdirSync(path.dirname(out), { recursive: true });
            try {
              const na = await s.run({ E, width, fixtures });
              if (typeof na === 'string') {
                manifest[key] = { status: 'n/a', why: na };
                fs.rmSync(out, { force: true });
              } else {
                await E.shot(out);
                manifest[key] = { status: 'captured' };
              }
            } catch (e) {
              manifest[key] = { status: 'failed', why: e instanceof Error ? e.message : String(e) };
              try {
                await E.shot(out.replace(/\.png$/, '.failed.png'));
              } catch {
                // the tab is gone
              }
              console.log(`  ✗ ${s.id}: ${(manifest[key] as { why: string }).why}`);
            }
          }
          // Chromium, last: the guide with "Allow access to file URLs" OFF — the state a store install starts in.
          if (E.flipFileAccess && (!ONLY_SURFACE || ONLY_SURFACE === 'setup-guide-file-access-off')) {
            const k = `1-install/setup-guide-file-access-off/${cell}`;
            const g = path.join(OUT, '1-install', 'setup-guide-file-access-off', `${cell}.png`);
            fs.mkdirSync(path.dirname(g), { recursive: true });
            try {
              await E.flipFileAccess();
              await E.ext('/onboarding.html');
              await sleep(800);
              await E.shot(g);
              manifest[k] = { status: 'captured' };
            } catch (e) {
              manifest[k] = { status: 'failed', why: e instanceof Error ? e.message : String(e) };
            }
          }
        } finally {
          await E.close();
          fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 1));
        }
      }
    }
  }

  // Mock frames and the side-by-side images.
  const withMock = new Map(surfaces.filter((s) => s.mock).map((s) => [`${s.section}/${s.id}`, s]));
  if (!ONLY_ENGINE || ONLY_ENGINE === 'chromium') {
    for (const theme of THEMES) for (const width of WIDTHS) await captureMocks(theme, width, withMock);
  }
  const pairs: { shot: string; mock: string; out: string; caption: string }[] = [];
  for (const s of withMock.values()) {
    for (const engine of engines) {
      for (const theme of THEMES) {
        for (const width of WIDTHS) {
          const cell = `${theme}-${engine}-${width}`;
          const shot = path.join(OUT, s.section, s.id, `${cell}.png`);
          const mock = path.join(OUT, s.section, s.id, `mock-${theme}-${width}.png`);
          if (fs.existsSync(shot) && fs.existsSync(mock)) {
            pairs.push({ shot, mock, out: path.join(OUT, s.section, s.id, `side-${cell}.png`), caption: `${s.id} · ${cell}` });
          }
        }
      }
    }
  }
  await composeSides(pairs);
  const counts = Object.values(manifest).reduce<Record<string, number>>((a, o) => ((a[o.status] = (a[o.status] ?? 0) + 1), a), {});
  console.log(`[walk-shots] done: ${JSON.stringify(counts)}; side-by-side ${pairs.length}`);
}

// Run only when invoked directly: scripts/capture-screenshots.ts (task 9.3) imports the engine seam above.
if (process.argv[1] && path.resolve(process.argv[1]).toLowerCase() === fileURLToPath(import.meta.url).toLowerCase()) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

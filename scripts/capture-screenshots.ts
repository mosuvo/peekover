// scripts/capture-screenshots.ts — store screenshot candidates (M13 task 9.3). Not a test; never in CI.
//
// Drives the BUILT extension (`.output/chrome-mv3`, `.output/firefox-mv3`) through the engine seam of
// `scripts/walk-shots.ts` and saves 1280×800 PNGs, light and dark, of the sample document kept in the repo
// (`docs/store/assets/sample.md`, never packaged), plus a contact sheet grouped by store:
//
//   <out>/NN-<shot>-<theme>-<engine>.png   one capture
//   <out>/contact-sheet.html / .png       grouped by store (Chrome, Edge, AMO): what each shows, its size checked
//                                          against that store's sizes, the agent's earlier suggested picks marked
//   <out>/manifest.json                    every capture's outcome, route, size and per-store size check
//   <out>/_fixtures/search-index/          the folder the app page opens (written fresh each run, outside the repo)
//
//   pnpm exec tsx scripts/capture-screenshots.ts [--out D:\Dev\peekover-shots\9.3]
//
// Each capture runs in a FRESH profile (a first-use state: the Recent list holds only the open file — a reused
// profile repeats it, the 8.1 walk's "Recent repeats a file", left for the walk to judge, not shown in a store image).
// How the app page opens its folder, per engine — each the state a user of that engine sees:
//   Chromium: the `__peekoverHarness` seam (task 2.1) with an OPFS directory handle — a live handle, as "Open a folder"
//     gives in Chrome and Edge.
//   Firefox: the DRAG route — the real folder on disk dropped on the page by a Gecko drag session (walk-shots'
//     `dragFolder`, the 8.1g driver), so the pane shows the drag note (`DRAGGED_SNAPSHOT_NOTE`) a Firefox user sees.
//     The capture fails if the note is missing or differs.
// The tab reader opens `sample.md` by `file://` on both engines; on Firefox after "Access local files on your computer"
// is turned on in about:addons (since Firefox 153 a separate setting, off by default; task 9.2b).
// The human picks; only the picks are copied into `docs/store/assets/`.

import * as fs from 'node:fs';
import * as path from 'node:path';
import { chromium } from 'playwright';
import { DRAGGED_SNAPSHOT_NOTE } from '../src/app/firefoxFolderSource';
import {
  chromiumEngine,
  firefoxEngine,
  fileUrl,
  freshApp,
  inPage,
  sleep,
  waitFor,
  type Engine,
  type EngineName,
  type Theme,
} from './walk-shots';

const ROOT = path.resolve(import.meta.dirname, '..');
const SAMPLE = path.join(ROOT, 'docs', 'store', 'assets', 'sample.md');
const WIDTH = 1280;
const HEIGHT = 800;
const arg = (name: string): string | undefined => {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : undefined;
};
const OUT = arg('--out') ?? 'D:\\Dev\\peekover-shots\\9.3';

// The folder the app page opens: the sample document and three short neighbours so the file list reads as a project.
const FOLDER = 'search-index';
const FOLDER_ON_DISK = path.join(OUT, '_fixtures', FOLDER);
const DOC = 'rollout-plan.md';
const AGENT = `# CLAUDE.md

Instructions for agents working in this repository.

## Commands

- \`pnpm test\` runs the unit suite
- \`pnpm build\` makes a production build

## Rules

1. Keep the old index serving until phase 4 is signed off.
2. Every change to ranking gets a comparison run first.
3. Ask before touching the flag service.
`;
const NEIGHBOURS: Record<string, string> = {
  'CLAUDE.md': AGENT,
  'README.md': '# Search index\n\nThe docs search service and its rollout notes.\n',
  'decisions.md': '# Decisions\n\n## 2026-10-02\n\nShadow the new index for a week before any live traffic.\n',
};

/** Width and height from a PNG's IHDR chunk (bytes 16–23, big-endian). */
function pngSize(file: string): { width: number; height: number } {
  const b = fs.readFileSync(file);
  if (b.length < 24 || b.toString('latin1', 1, 4) !== 'PNG') throw new Error(`not a PNG: ${file}`);
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
}

// ── The stores (each store's own page, re-checked 2026-11-07; `decisions.md`, "M13 TASK 9.3 — captures") ────────

type StoreId = 'chrome' | 'edge' | 'amo';
interface Store {
  id: StoreId;
  name: string;
  /** How many screenshots the store takes. */
  count: string;
  /** The rule, as the store states it. */
  sizes: string;
  /** Does a PNG of this size meet the store's rule? */
  fits(w: number, h: number): boolean;
  /** Which engine's captures show what this store's users get. */
  engine: EngineName;
  /** The agent's earlier suggestion (`final-review.md` step 4), by capture number. Marked only; the pick is the human's. */
  suggested: number[];
}
const STORES: Store[] = [
  {
    id: 'chrome',
    name: 'Chrome Web Store',
    count: '1–5 (at least 1)',
    sizes: '1280×800 or 640×400',
    fits: (w, h) => (w === 1280 && h === 800) || (w === 640 && h === 400),
    engine: 'chromium',
    suggested: [1, 8, 3, 6, 10],
  },
  {
    id: 'edge',
    name: 'Edge Add-ons',
    count: '0–6',
    sizes: '1280×800 or 640×480',
    fits: (w, h) => (w === 1280 && h === 800) || (w === 640 && h === 480),
    engine: 'chromium',
    suggested: [1, 8, 3, 6, 10, 5],
  },
  {
    id: 'amo',
    name: 'Firefox Add-ons (AMO)',
    count: 'no practical limit (none required)',
    sizes: '1.6:1 aspect, 1280×800 recommended',
    fits: (w, h) => w * 10 === h * 16,
    engine: 'firefox',
    suggested: [],
  },
];

interface Shot {
  id: string;
  /** What it shows, for the contact sheet. */
  shows: string;
  run(E: Engine): Promise<string>;
}

async function scrollToHeading(E: Engine, text: string): Promise<void> {
  const ok = await E.evaluate<boolean>(
    inPage(`const h = H.find('.peekover-reader h2', ${JSON.stringify(text)})[0]; if (!h) return false; h.scrollIntoView({ block: 'start' }); return true;`),
  );
  if (!ok) throw new Error(`no heading "${text}"`);
  await sleep(700);
}

const READER_READY = `(() => { const r = H.one('.peekover-reader'); return r && r.textContent.trim().length > 0; })()`;

/**
 * The app page with the folder open and `file` selected, by the engine's own route (see the header). Returns the
 * route, for the manifest and the sheet.
 */
async function openApp(E: Engine, file: string): Promise<string> {
  if (E.name === 'chromium') {
    await freshApp(E, file, FOLDER);
    if (!(await waitFor(E, READER_READY, 10000))) throw new Error('the reader did not render');
    return 'folder by the harness (a live handle, as "Open a folder" in Chrome / Edge)';
  }
  await E.ext('/app.html');
  if (!(await waitFor(E, `H.find('button', 'Open a folder').length > 0`, 10000))) throw new Error('the app page did not load');
  const fired = await E.dragFolder!(FOLDER_ON_DISK);
  if (!(await waitFor(E, `H.deep().filter((e) => e.matches('[role="treeitem"][data-kind="file"]')).length >= 4`, 10000))) {
    throw new Error(`the dropped folder did not list (${fired})`);
  }
  const note = await E.evaluate<string | null>(inPage(`return H.one('[data-state="read-only-snapshot"]')?.textContent ?? null;`));
  if (note !== DRAGGED_SNAPSHOT_NOTE) throw new Error(`the drag note is not shown (read: ${JSON.stringify(note)})`);
  const ok = await E.evaluate<boolean>(
    inPage(`const it = H.deep().filter((e) => e.matches('[role="treeitem"][data-kind="file"]')).find((e) => (e.textContent || '').trim() === ${JSON.stringify(file)});
      if (!it) return false; it.click(); return true;`),
  );
  if (!ok) throw new Error(`no "${file}" in the dropped folder`);
  if (!(await waitFor(E, READER_READY, 10000))) throw new Error('the reader did not render');
  await sleep(800);
  return 'folder dragged onto the page (the Firefox drag route; the drag note shown)';
}

const SHOTS: Shot[] = [
  {
    id: 'reading',
    shows: 'App page: a folder open, the sample document at the top: checklist, file list, toolbar',
    run: async (E) => openApp(E, DOC),
  },
  {
    id: 'table-diagram',
    shows: 'App page: a table with its filter and copy tools, and a Mermaid diagram drawn in place',
    run: async (E) => {
      const route = await openApp(E, DOC);
      await scrollToHeading(E, 'Phases');
      if (!(await waitFor(E, `H.one('.peekover-reader svg[id^="mermaid"], .peekover-reader .peekover-diagram svg')`, 8000))) {
        throw new Error('the diagram did not draw');
      }
      await sleep(600);
      return route;
    },
  },
  {
    id: 'math-code',
    shows: 'App page: rendered math and highlighted TypeScript and Python',
    run: async (E) => {
      const route = await openApp(E, DOC);
      await scrollToHeading(E, 'Ranking');
      return route;
    },
  },
  {
    id: 'agent-file',
    shows: 'App page: an agent instruction file (CLAUDE.md) with its badge',
    run: async (E) => openApp(E, 'CLAUDE.md'),
  },
  {
    id: 'editor',
    shows: 'App page: the editor with its live preview and Save',
    run: async (E) => {
      const route = await openApp(E, DOC);
      await E.evaluate(inPage(`return H.click('[role="group"][aria-label="View"] button', 'Edit');`));
      if (!(await waitFor(E, `H.one('.cm-editor')`, 10000))) throw new Error('the editor did not open');
      await sleep(900);
      return route;
    },
  },
  {
    id: 'tab-reader',
    shows: 'A .md file opened from disk in a browser tab, formatted by the content script',
    run: async (E) => {
      let route = 'file:// in a tab';
      if (E.name === 'firefox') {
        const read = await E.setFileAccess!(true);
        if (!read.includes('pressed=true') || !read.includes('isAllowedFileSchemeAccess()=true')) {
          throw new Error(`"Access local files on your computer" did not turn on: ${read}`);
        }
        route = 'file:// in a tab, "Access local files on your computer" on';
      }
      await E.file(fileUrl(SAMPLE));
      if (!(await waitFor(E, `H.one('.peekover-reader')`, 10000))) throw new Error('the tab reader did not mount');
      await sleep(1500);
      return route;
    },
  },
];

interface Entry {
  n: number;
  file: string;
  shot: string;
  shows: string;
  theme: Theme;
  engine: EngineName;
  browser?: string;
  route?: string;
  status: 'captured' | 'failed';
  why?: string;
  size?: string;
  /** Per store whose engine this is: does the size meet its rule? */
  fits?: Partial<Record<StoreId, boolean>>;
}

function writeFixtureFolder(files: Record<string, string>): void {
  fs.rmSync(FOLDER_ON_DISK, { recursive: true, force: true });
  fs.mkdirSync(FOLDER_ON_DISK, { recursive: true });
  for (const [name, text] of Object.entries(files)) fs.writeFileSync(path.join(FOLDER_ON_DISK, name), text);
}

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

async function contactSheet(entries: Entry[], head: string): Promise<void> {
  const card = (e: Entry, s: Store): string => {
    const pick = s.suggested.includes(e.n);
    const fit = e.fits?.[s.id];
    return `<figure class="${pick ? 'pick' : ''}"><div class="img">${
      e.status === 'captured' ? `<a href="${e.file}"><img src="${e.file}" alt=""></a>` : `<span>FAILED: ${esc(e.why ?? '')}</span>`
    }</div><figcaption><b>${String(e.n).padStart(2, '0')}</b> ${esc(e.shows)}<br><i>${e.theme} · ${esc(e.browser ?? e.engine)}</i><br>${
      e.size ? `${e.size} — <b class="${fit ? 'ok' : 'no'}">${fit ? `fits ${s.name}` : `does NOT fit ${s.name}`}</b>` : '—'
    }<br><span class="route">${esc(e.route ?? '')}</span>${pick ? '<br><b class="tag">CC’s earlier suggestion</b>' : ''}</figcaption></figure>`;
  };
  const sections = STORES.map((s) => {
    const mine = entries.filter((e) => e.engine === s.engine);
    const allFit = mine.every((e) => e.status === 'captured' && e.fits?.[s.id]);
    return `<section><h2>${s.name}</h2><p class="rule">Takes <b>${s.count}</b> · sizes <b>${s.sizes}</b> · candidates: the ${
      s.engine === 'chromium' ? 'Chromium' : 'Firefox'
    } captures, ${mine.length} · size check: <b class="${allFit ? 'ok' : 'no'}">${
      allFit ? `all ${mine.length} fit` : 'NOT all fit — see the cards'
    }</b>${
      s.suggested.length
        ? ` · CC’s earlier suggestion (marked, not a pick): <b>${s.suggested.map((n) => String(n).padStart(2, '0')).join(', ')}</b>`
        : ' · no earlier suggestion (the Firefox captures are new)'
    }</p><div class="grid">${mine.map((e) => card(e, s)).join('\n')}</div></section>`;
  }).join('\n');
  const html = `<!doctype html><meta charset="utf-8"><title>9.3 contact sheet</title>
<style>body{margin:0;padding:20px;font:13px/1.35 system-ui,sans-serif;background:#f4f1ea;color:#16171f}
h1{font-size:18px;margin:0 0 4px}h2{font-size:16px;margin:22px 0 4px}p{margin:0 0 10px;max-width:1350px}
.grid{display:grid;grid-template-columns:repeat(4,320px);gap:14px}
figure{margin:0;background:#fff;border:1px solid #d8d3c6;border-radius:6px;overflow:hidden}
figure.pick{border:3px solid #16171f}.tag{background:#ffd84d;padding:0 4px}
.ok{color:#1d5e2c}.no{color:#8a1c1c}.route{color:#555}
.img{width:320px;height:200px;display:flex;align-items:center;justify-content:center;background:#ddd}
img{width:320px;height:200px;display:block}figcaption{padding:6px 8px}</style>
<h1>Peekover — M13 task 9.3 store screenshot captures (the pick is the human’s; none is made here)</h1>
<p>${head}</p>
${sections}`;
  const htmlPath = path.join(OUT, 'contact-sheet.html');
  fs.writeFileSync(htmlPath, html);
  const browser = await chromium.launch({ channel: 'chromium' });
  try {
    const page = await browser.newPage({ viewport: { width: 4 * 320 + 3 * 14 + 40, height: 800 } });
    await page.goto(fileUrl(htmlPath), { waitUntil: 'load' });
    await page.screenshot({ path: path.join(OUT, 'contact-sheet.png'), fullPage: true });
  } finally {
    await browser.close();
  }
}

async function main(): Promise<void> {
  for (const d of ['chrome-mv3', 'firefox-mv3']) {
    if (!fs.existsSync(path.join(ROOT, '.output', d, 'manifest.json'))) throw new Error(`build first: .output/${d}`);
  }
  fs.mkdirSync(OUT, { recursive: true });
  const files: Record<string, string> = { [DOC]: fs.readFileSync(SAMPLE, 'utf8'), ...NEIGHBOURS };
  writeFixtureFolder(files);

  // The size check's control: a PNG that is NOT 1280×800 must fail every store's rule, or a pass below means nothing.
  const control = pngSize(path.join(ROOT, 'docs', 'store', 'assets', 'cws-icon-128.png'));
  const controlFits = STORES.filter((s) => s.fits(control.width, control.height)).map((s) => s.id);
  if (controlFits.length) throw new Error(`size-check control did not fire: 128×128 fits ${controlFits.join(', ')}`);
  console.log(`[capture] size-check control: cws-icon-128.png reads ${control.width}×${control.height}, fits no store (fires)`);

  const entries: Entry[] = [];
  let n = 0;
  let port = 9520;
  for (const engine of ['chromium', 'firefox'] as EngineName[]) {
    for (const theme of ['light', 'dark'] as Theme[]) {
      for (const s of SHOTS) {
        n++;
        const file = `${String(n).padStart(2, '0')}-${s.id}-${theme}-${engine}.png`;
        const e: Entry = { n, file, shot: s.id, shows: s.shows, theme, engine, status: 'captured' };
        console.log(`[capture] ${file}`);
        const E = engine === 'chromium' ? await chromiumEngine(theme, WIDTH) : await firefoxEngine(theme, WIDTH, port++);
        e.browser = E.version;
        try {
          if (engine === 'chromium') {
            await E.ext('/app.html');
            await E.evaluate(
              inPage(`const root = await navigator.storage.getDirectory();
                const dir = await root.getDirectoryHandle(${JSON.stringify(FOLDER)}, { create: true });
                const files = ${JSON.stringify(files)};
                for (const [name, text] of Object.entries(files)) {
                  const fh = await dir.getFileHandle(name, { create: true });
                  const w = await fh.createWritable(); await w.write(text); await w.close();
                }
                return true;`),
            );
          }
          e.route = await s.run(E);
          await E.shot(path.join(OUT, file));
          const sz = pngSize(path.join(OUT, file));
          e.size = `${sz.width}×${sz.height}`;
          e.fits = Object.fromEntries(STORES.filter((st) => st.engine === engine).map((st) => [st.id, st.fits(sz.width, sz.height)]));
          if (sz.width !== WIDTH || sz.height !== HEIGHT) throw new Error(`size ${e.size}, not ${WIDTH}×${HEIGHT}`);
        } catch (err) {
          e.status = 'failed';
          e.why = err instanceof Error ? err.message : String(err);
          console.log(`  ✗ ${file}: ${e.why}`);
        } finally {
          await E.close();
        }
        entries.push(e);
      }
    }
  }
  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(entries, null, 1));
  const head = arg('--head') ?? '(no commit given)';
  const browsers = [...new Set(entries.map((e) => e.browser).filter(Boolean))].join(', ');
  await contactSheet(
    entries,
    `Each 1280×800, from the built extension at ${esc(head)} (both engines built there), of <code>docs/store/assets/sample.md</code>,
    each in a fresh profile; light and dark. Browsers: ${esc(browsers)}. Chromium opens the folder through the harness (a live
    handle, what Chrome and Edge give); Firefox by dragging the real folder onto the page, so its pane shows the drag note a
    Firefox user sees. The tab reader opens the file by <code>file://</code>; on Firefox with “Access local files on your
    computer” on. Store rules as each store's page stated them on 2026-11-07. A thick border marks CC’s earlier suggestion
    (<code>final-review.md</code> step 4); it is not a pick. Click a card for the full-size file.`,
  );
  const ok = entries.filter((e) => e.status === 'captured').length;
  console.log(`[capture] done: ${ok} / ${entries.length} captured at ${WIDTH}×${HEIGHT}; ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

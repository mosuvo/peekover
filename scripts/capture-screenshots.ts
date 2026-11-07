// scripts/capture-screenshots.ts — store screenshot candidates (M13 task 9.3). Not a test; never in CI.
//
// Drives the BUILT extension (`.output/chrome-mv3`, `.output/firefox-mv3`) through the engine seam of
// `scripts/walk-shots.ts` and saves 1280×800 PNGs, light and dark, of the sample document kept in the repo
// (`docs/store/assets/sample.md`, never packaged), plus a one-page contact sheet:
//
//   <out>/NN-<shot>-<theme>-<engine>.png   one capture
//   <out>/contact-sheet.html / .png       every capture numbered: what it shows, which store it suits (or why none)
//   <out>/manifest.json                    every capture's outcome, size check and verdict
//
//   pnpm exec tsx scripts/capture-screenshots.ts [--out D:\Dev\peekover-shots\9.3]
//
// Each capture runs in a FRESH profile (a first-use state: the Recent list holds only the open file — a reused
// profile repeats it, the 8.1 walk's "Recent repeats a file", left for the walk to judge, not shown in a store image).
// The app page opens its folder through the `__peekoverHarness` seam (task 2.1) with an OPFS directory handle: a live
// handle, the Chromium state. On Firefox that state does not exist — every Firefox folder route is a read-only snapshot
// with its note (`src/app/firefoxFolderSource.ts`) — so the Firefox app-page captures are drawn by Firefox but are NOT
// store candidates. The Firefox tab reader is not captured: the Firefox half of "files opened from disk" is PENDING
// SIGNED INSTALL (ledger rows 2, 8; task 9.2). The human picks; only the picks are copied into `docs/store/assets/`.

import * as fs from 'node:fs';
import * as path from 'node:path';
import { chromium } from 'playwright';
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

interface Shot {
  id: string;
  /** What it shows, for the contact sheet. */
  shows: string;
  engines: EngineName[];
  run(E: Engine): Promise<void>;
}

async function scrollToHeading(E: Engine, text: string): Promise<void> {
  const ok = await E.evaluate<boolean>(
    inPage(`const h = H.find('.peekover-reader h2', ${JSON.stringify(text)})[0]; if (!h) return false; h.scrollIntoView({ block: 'start' }); return true;`),
  );
  if (!ok) throw new Error(`no heading "${text}"`);
  await sleep(700);
}

const SHOTS: Shot[] = [
  {
    id: 'reading',
    shows: 'App page: a folder open, the sample document at the top: checklist, file list, toolbar',
    engines: ['chromium', 'firefox'],
    run: async (E) => freshApp(E, DOC, FOLDER),
  },
  {
    id: 'table-diagram',
    shows: 'App page: a table with its filter and copy tools, and a Mermaid diagram drawn in place',
    engines: ['chromium', 'firefox'],
    run: async (E) => {
      await freshApp(E, DOC, FOLDER);
      await scrollToHeading(E, 'Phases');
      if (!(await waitFor(E, `H.one('.peekover-reader svg[id^="mermaid"], .peekover-reader .peekover-diagram svg')`, 8000))) {
        throw new Error('the diagram did not draw');
      }
      await sleep(600);
    },
  },
  {
    id: 'math-code',
    shows: 'App page: rendered math and highlighted TypeScript and Python',
    engines: ['chromium', 'firefox'],
    run: async (E) => {
      await freshApp(E, DOC, FOLDER);
      await scrollToHeading(E, 'Ranking');
    },
  },
  {
    id: 'agent-file',
    shows: 'App page: an agent instruction file (CLAUDE.md) with its badge',
    engines: ['chromium', 'firefox'],
    run: async (E) => freshApp(E, 'CLAUDE.md', FOLDER),
  },
  {
    id: 'editor',
    shows: 'App page: the editor with its live preview and Save',
    engines: ['chromium', 'firefox'],
    run: async (E) => {
      await freshApp(E, DOC, FOLDER);
      await E.evaluate(inPage(`return H.click('[role="group"][aria-label="View"] button', 'Edit');`));
      if (!(await waitFor(E, `H.one('.cm-editor')`, 10000))) throw new Error('the editor did not open');
      await sleep(900);
    },
  },
  {
    id: 'tab-reader',
    shows: 'A .md file opened from disk in a browser tab, formatted by the content script',
    engines: ['chromium'],
    run: async (E) => {
      await E.file(fileUrl(SAMPLE));
      if (!(await waitFor(E, `H.one('.peekover-reader')`, 10000))) throw new Error('the tab reader did not mount');
      await sleep(1500);
    },
  },
];

const SUITS: Record<EngineName, string> = { chromium: 'Chrome Web Store · Edge Add-ons', firefox: '' };
const NOT_FOR_A_STORE: Record<EngineName, string> = {
  chromium: '',
  firefox:
    'NOT FOR A STORE: the harness opens a live folder handle, a Chromium-only state; a Firefox user always sees the ' +
    'read-only-snapshot note in the folder pane. Firefox drawing reference only.',
};

interface Entry {
  n: number;
  file: string;
  shot: string;
  shows: string;
  theme: Theme;
  engine: EngineName;
  suits: string;
  notForAStore: string;
  status: 'captured' | 'failed';
  why?: string;
  size?: string;
}

async function contactSheet(entries: Entry[]): Promise<void> {
  const cards = entries
    .map(
      (e) => `<figure class="${e.notForAStore ? 'out' : ''}"><div class="img">${e.status === 'captured' ? `<img src="${e.file}" alt="">` : `<span>FAILED: ${e.why}</span>`}</div>
        <figcaption><b>${String(e.n).padStart(2, '0')}</b> ${e.shows}<br><i>${e.theme} · ${e.engine} · ${e.size ?? '—'}</i><br>${
          e.notForAStore ? `<b class="no">${e.notForAStore}</b>` : `Suits: <b>${e.suits}</b>`
        }</figcaption></figure>`,
    )
    .join('\n');
  const html = `<!doctype html><meta charset="utf-8"><title>9.3 contact sheet</title>
<style>body{margin:0;padding:20px;font:13px/1.35 system-ui,sans-serif;background:#f4f1ea;color:#16171f}
h1{font-size:18px;margin:0 0 4px}p{margin:0 0 10px;max-width:1350px}.grid{display:grid;grid-template-columns:repeat(4,320px);gap:14px}
figure{margin:0;background:#fff;border:1px solid #d8d3c6;border-radius:6px;overflow:hidden}
figure.out{background:#eee;border-style:dashed}figure.out img{opacity:.55}.no{color:#8a1c1c}
.img{width:320px;height:200px;display:flex;align-items:center;justify-content:center;background:#ddd}
img{width:320px;height:200px;display:block}figcaption{padding:6px 8px}</style>
<h1>Peekover — M13 task 9.3 store screenshot captures (the pick is the human's)</h1>
<p>Each 1280×800, from the built extension at HEAD (5ac0112), of <code>docs/store/assets/sample.md</code>, each in a fresh
profile. Chromium captures suit the Chrome Web Store and Edge Add-ons. Firefox captures are drawn by Firefox but are not
store candidates (see each card). Not captured: the Firefox tab reader (opening a file from disk in Firefox is pending the
signed-install test). Captured before the 8.1 walk (HUMAN RULING 2026-11-07): a walk fix that changes a shown surface
re-captures it.</p>
<div class="grid">${cards}</div>`;
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

  // The size check's control: a PNG that is NOT 1280×800 must read as such, or a pass below means nothing.
  const control = pngSize(path.join(ROOT, 'docs', 'store', 'assets', 'cws-icon-128.png'));
  if (control.width === WIDTH && control.height === HEIGHT) throw new Error('size-check control did not fire');
  console.log(`[capture] size-check control: cws-icon-128.png reads ${control.width}×${control.height} (fires)`);

  const entries: Entry[] = [];
  let n = 0;
  let port = 9520;
  for (const engine of ['chromium', 'firefox'] as EngineName[]) {
    for (const theme of ['light', 'dark'] as Theme[]) {
      for (const s of SHOTS) {
        if (!s.engines.includes(engine)) continue;
        n++;
        const file = `${String(n).padStart(2, '0')}-${s.id}-${theme}-${engine}.png`;
        const e: Entry = {
          n,
          file,
          shot: s.id,
          shows: s.shows,
          theme,
          engine,
          suits: SUITS[engine],
          notForAStore: NOT_FOR_A_STORE[engine],
          status: 'captured',
        };
        console.log(`[capture] ${file}`);
        const E = engine === 'chromium' ? await chromiumEngine(theme, WIDTH) : await firefoxEngine(theme, WIDTH, port++);
        try {
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
          await s.run(E);
          await E.shot(path.join(OUT, file));
          const sz = pngSize(path.join(OUT, file));
          e.size = `${sz.width}×${sz.height}`;
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
  await contactSheet(entries);
  const ok = entries.filter((e) => e.status === 'captured').length;
  const candidates = entries.filter((e) => e.status === 'captured' && !e.notForAStore).length;
  console.log(`[capture] done: ${ok} / ${entries.length} captured at ${WIDTH}×${HEIGHT}, ${candidates} store candidates; ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

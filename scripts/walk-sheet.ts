// scripts/walk-sheet.ts — the walk D contact sheet (M13 task 8.1, walk-8.1.md items 17–19). Not a test; never in CI.
//
//   pnpm exec tsx scripts/walk-sheet.ts [--out D:\Dev\peekover-shots\8.1\D]
//
// Reads what `walk-shots.ts --walk-d` wrote (manifest.json, metrics.json, run.json, <engine>/*.png) and
// docs/ai/walk-8.1.md, and writes <out>/index.html: one plain, self-contained page that opens from disk. Per surface:
// "id · name · what good looks like" (the scoring-table row's ruling, exceptions and notes, and the items II text
// that names the surface — quoted from walk-8.1.md, not rewritten), then Chromium and Firefox, light and dark, side
// by side, per width; click a shot to enlarge.
//
// "CC flags" at the top are MEASUREMENTS grouped from scripts/walk-probe.ts's output — never a design verdict.
// <out>/cc-notes.json (optional, hand-written after looking at the shots) adds a note to a flag by its id and may
// move it to "measured, and the state itself explains it" (an open menu over text is what that state is).

import * as fs from 'node:fs';
import * as path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const arg = (name: string): string | undefined => {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : undefined;
};
const OUT = arg('--out') ?? 'D:\\Dev\\peekover-shots\\8.1\\D';
const PREP_SHOTS = path.resolve(OUT, '..'); // the 8.1 prep's folder, for the mock frames

const ENGINES = ['chromium', 'firefox'] as const;
const THEMES = ['light', 'dark'] as const;
const WIDTHS = [1280, 1080, 414] as const;

interface Cell {
  status: 'captured' | 'n/a' | 'failed';
  why?: string;
  note?: string;
}
interface Metrics {
  probeError?: string;
  vw?: number;
  hScroll?: { scrollWidth: number; clientWidth: number } | null;
  clipped?: { el: string; text: string; why: string }[];
  overlaps?: { top: string; under: string; at: [number, number] }[];
  occluded?: { el: string; text: string; by: string; share: string }[];
  lowContrast?: { el: string; text: string; ratio: number; bar: number; fg: string; bg: string; px: number }[];
  controls?: string[];
  struct?: Record<string, number>;
}
const read = <T>(f: string, empty: T): T => (fs.existsSync(f) ? (JSON.parse(fs.readFileSync(f, 'utf8')) as T) : empty);
const manifest = read<Record<string, Cell>>(path.join(OUT, 'manifest.json'), {});
const metrics = read<Record<string, Metrics>>(path.join(OUT, 'metrics.json'), {});
const run = read<{ versions: Record<string, string>; notes: string[]; started?: string; commit?: string; unreachable?: string[] }>(
  path.join(OUT, 'run.json'),
  { versions: {}, notes: [] },
);
if (!run.commit && arg('--commit')) run.commit = arg('--commit');
const ccNotes = read<Record<string, { note: string; expected?: boolean }>>(path.join(OUT, 'cc-notes.json'), {});

/** What walk D could not capture: each needs a real OS dialog, the browser's own UI, or the network. */
const UNREACHABLE = [
  '**"Open a folder"** — the OS folder picker, its Cancel, and a denied permission (I-7). Every app-page folder shot opens its folder through the `__peekoverHarness` seam instead.',
  "**Firefox's two real folder routes** (I-11): the file picker (an OS dialog: the read-only snapshot and its notes) and dragging a folder onto the page (an OS drag session: the drag note, Watch). The Firefox folder / watch cells here are the harness state.",
  "**Export → the Save dialog and the downloaded file**, and that file in print preview (I-9; 8.1a / 8.1d) — a download and the browser's print UI. The Export **panel** is captured (`export-panel`).",
  "**Print preview** (Ctrl+P) of the tab reader or the app page — the browser's print UI.",
  '**Copy as …** pasted into another program (I-9) — the OS clipboard.',
  '**"Network used"** after Load on a remote image (I-7) — needs a real request; the capture kept the zero-network default (the image points at `example.invalid`; `remote-media` shows the not-loaded state).',
  '**The tab reader on a raw GitHub / GitLab / Bitbucket page** (I-6) — a real network page.',
  "**The browser's own pages**: chrome://extensions (the file-URL toggle, site access, Developer mode) and about:addons' Permissions and data — the script drives them to set each state, they are not Peekover surfaces (I-1, I-2); **the toolbar icon** (I-4) is browser chrome, outside a page-only capture.",
  "**The guide opening once across a restart** (I-1) and **a store install's toggle default** (I-2: OFF on a store install; not checkable before go-live). Chromium's off-state guide here is the flip of an unpacked load, which starts ON.",
  '**The render-failure banner** (I-8) — no document is known to trigger it.',
  '**Fonts on a machine without the design faces, and on macOS** (I-5).',
];
run.unreachable ??= UNREACHABLE;

// ── walk-8.1.md ──────────────────────────────────────────────────────────────────────────────────────────────────

const md = fs.readFileSync(path.join(ROOT, 'docs', 'ai', 'walk-8.1.md'), 'utf8');
const cells = (line: string): string[] => line.split(' | ').map((c) => c.replace(/^\|\s*/, '').replace(/\s*\|$/, '').trim());

interface Row {
  n: number;
  section: string;
  id: string;
  verdict: string;
  ruling: string;
  exceptions: string;
  notes: string;
}
const rows: Row[] = [];
for (const line of md.split('\n')) {
  const m = /^\| (\d+) \| `([\w-]+)\/([\w-]+)` \|/.exec(line);
  if (!m || rows.some((r) => r.id === m[3])) continue;
  const c = cells(line);
  if (c.length < 6) continue; // the "still to judge" table repeats the ids with four columns
  rows.push({ n: Number(m[1]), section: m[2], id: m[3], verdict: c[2], ruling: c[3], exceptions: c[4], notes: c[5] });
}

interface Item {
  id: string;
  lookAt: string;
  good: string;
}
const items: Item[] = [];
for (const line of md.split('\n')) {
  const m = /^\| (II-\d+) \| /.exec(line);
  if (!m) continue;
  const c = cells(line);
  items.push({ id: m[1], lookAt: c[1], good: c[2] });
}
const ITEM_EXTRA: Record<string, string[]> = { 'II-4': ['recent-list'], 'II-5': ['long-code-expanded'], 'II-10': ['reading'] };
const itemsFor = (id: string): Item[] =>
  items.filter((it) => it.lookAt.includes('`' + id + '`') || (ITEM_EXTRA[it.id] ?? []).includes(id));

const ITEM17 = [2, 3, 6, 7, 8, 9, 10, 11, 12, 15, 17, 18, 20, 22, 23, 27, 30, 31, 32];
const ITEM19 = ['II-2', 'II-3', 'II-4', 'II-9', 'II-10', 'II-1', 'II-5', 'II-7', 'II-8'];
const EXTRA: Row[] = [
  { n: 0, section: '3-app-chrome', id: 'recent-list', verdict: '', ruling: '', exceptions: '', notes: 'Not a table row: the state for item II-4, captured for walk D (three harness opens of the same folder, then the page with no folder).' },
  { n: 0, section: '4-reader', id: 'long-code-expanded', verdict: '', ruling: '', exceptions: '', notes: 'Not a table row: "Show full code" pressed on the long block, for item II-5 (walk D).' },
];
const order = [...rows, ...EXTRA].sort((a, b) => {
  const key = (r: Row) => (r.n || (r.id === 'recent-list' ? 3.5 : 20.5));
  return key(a) - key(b);
});

// ── Flags ────────────────────────────────────────────────────────────────────────────────────────────────────────

const cellKey = (engine: string, id: string, theme: string, width: number) => `${engine}/${id}-${theme}${width === 1280 ? '' : `-${width}`}`;
const cellLabel = (k: string) => k.replace('/', ' · ').replace(/-(light|dark)(-(\d+))?$/, (_, t, __, w) => ` · ${t} · ${w ?? 1280}`);

interface Flag {
  id: string;
  kind: string;
  surface: string;
  what: string;
  shots: string[];
  /** The text runs it was measured on (a few). */
  examples: string[];
}
const flags = new Map<string, Flag>();
/** One flag per kind × surface × `what` (no per-run text in `what`, so ids stay stable for cc-notes.json). */
const add = (kind: string, surface: string, what: string, shot: string, example?: string) => {
  const id = `${kind}|${surface}|${what}`;
  const f = flags.get(id) ?? { id, kind, surface, what, shots: [], examples: [] };
  if (!f.shots.includes(shot)) f.shots.push(shot);
  if (example && f.examples.length < 4 && !f.examples.includes(example)) f.examples.push(example);
  flags.set(id, f);
};
/** The covering box by its element name alone — its text (a dropdown's dates, a panel's sheet) would split one
 *  flag into many; the label stays in the examples. */
const box = (by: string) => by.replace(/ ".*$/, '');
const norm = (s: string) => s.replace(/\d+/g, '#');

for (const r of order) {
  for (const theme of THEMES) {
    for (const width of WIDTHS) {
      const per: Partial<Record<(typeof ENGINES)[number], Metrics>> = {};
      for (const engine of ENGINES) {
        const k = cellKey(engine, r.id, theme, width);
        const m = metrics[k];
        if (manifest[k]?.status === 'failed') add('capture failed', r.id, `${engine}: ${manifest[k].why}`, k);
        if (!m) continue;
        per[engine] = m;
        if (m.probeError) add('probe error', r.id, m.probeError, k);
        if (m.hScroll) add('sideways scroll', r.id, `page scrolls sideways (${m.hScroll.scrollWidth} > ${m.hScroll.clientWidth})`, k);
        for (const c of m.clipped ?? []) add('text cut off', r.id, `${c.el} ${c.why.replace(/\(.*\)/, '').trim()}`, k, `"${c.text}" ${c.why.replace(/^.*?(\(.*\))?$/, '$1')}`);
        for (const o of m.overlaps ?? []) add('text over text', r.id, `${o.top.replace(/ ".*/, '')} over ${o.under.replace(/ ".*/, '')}`, k, `${o.top} over ${o.under} at ${o.at.join(',')}`);
        for (const o of m.occluded ?? []) add('text under floating chrome', r.id, `under ${box(o.by)}`, k, `${o.el} "${o.text}" (${o.share} points; box ${o.by.replace(/^\S+ /, '').slice(0, 40)})`);
        for (const c of m.lowContrast ?? []) add('below AA', r.id, `${c.el}: ${c.fg} on ${c.bg} = ${c.ratio}:1 (bar ${c.bar}, ${c.px}px)`, k, `"${c.text}"`);
      }
      const [a, b] = [per.chromium, per.firefox];
      if (a?.controls && b?.controls) {
        const na = new Set(a.controls.map(norm));
        const nb = new Set(b.controls.map(norm));
        for (const c of na) if (!nb.has(c)) add('missing vs the other engine', r.id, `Firefox lacks: ${c}`, cellKey('firefox', r.id, theme, width));
        for (const c of nb) if (!na.has(c)) add('missing vs the other engine', r.id, `Chromium lacks: ${c}`, cellKey('chromium', r.id, theme, width));
        for (const f of Object.keys(a.struct ?? {})) {
          if ((a.struct ?? {})[f] !== (b.struct ?? {})[f]) {
            add('missing vs the other engine', r.id, `${f}: Chromium ${(a.struct ?? {})[f]}, Firefox ${(b.struct ?? {})[f]} (rendered, whole page)`, cellKey('firefox', r.id, theme, width));
          }
        }
      }
    }
  }
}
const all = [...flags.values()];
const open = all.filter((f) => !ccNotes[f.id]?.expected);
const explained = all.filter((f) => ccNotes[f.id]?.expected);
fs.writeFileSync(path.join(OUT, 'flags.json'), JSON.stringify(all.map((f) => ({ ...f, cc: ccNotes[f.id] })), null, 1));

// ── HTML ─────────────────────────────────────────────────────────────────────────────────────────────────────────

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const mdInline = (s: string) =>
  esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/&lt;br&gt;/g, '<br>');
const img = (k: string) => `${k}.png`;
const shotLink = (k: string) => `<a href="${esc(img(k))}" data-big>${esc(cellLabel(k))}</a>`;

const counts: Record<string, Record<string, number>> = {};
for (const [k, c] of Object.entries(manifest)) {
  const e = k.split('/')[0];
  counts[e] ??= {};
  counts[e][c.status] = (counts[e][c.status] ?? 0) + 1;
}
const countLine = ENGINES.map((e) => `${run.versions[e] ?? e}: ${Object.entries(counts[e] ?? {}).map(([s, n]) => `${n} ${s}`).join(', ')}`).join(' · ');

/** Layout first, then contrast; flags sharing one CC note are one entry (one finding seen on several surfaces). */
const KIND_ORDER = ['capture failed', 'probe error', 'sideways scroll', 'text cut off', 'text over text', 'text under floating chrome', 'missing vs the other engine', 'below AA'];
const groupOf = (f: Flag) => ccNotes[f.id]?.note ?? f.id;
const flagList = (fs_: Flag[]) => {
  const groups = new Map<string, Flag[]>();
  for (const f of fs_) groups.set(groupOf(f), [...(groups.get(groupOf(f)) ?? []), f]);
  return [...groups.values()]
    .sort((a, b) => KIND_ORDER.indexOf(a[0].kind) - KIND_ORDER.indexOf(b[0].kind) || a[0].surface.localeCompare(b[0].surface))
    .map((g) => {
      const note = ccNotes[g[0].id]?.note ? `<div class="ccnote">CC: ${mdInline(ccNotes[g[0].id].note)}</div>` : '';
      const lines = g
        .map((f) => {
          const ex = f.examples.length ? ` <span class="ex">e.g. ${f.examples.map(esc).join(' · ')}</span>` : '';
          return `<div><a href="#s-${esc(f.surface)}"><code>${esc(f.surface)}</code></a> — ${esc(f.what)}${ex}</div>`;
        })
        .join('');
      const shots = [...new Set(g.flatMap((f) => f.shots))];
      return `<li><span class="kind">${esc(g[0].kind)}</span>${note}${lines}<div class="shots">${shots.map(shotLink).join(' ')}</div></li>`;
    })
    .join('\n');
};
const groupCount = (fs_: Flag[]) => new Set(fs_.map(groupOf)).size;

const thumb = (k: string) => {
  const c = manifest[k];
  if (!c) return `<div class="cell none">not captured</div>`;
  if (c.status === 'captured') {
    const note = c.note ? `<div class="cnote">${esc(c.note)}</div>` : '';
    return `<a class="cell" href="${esc(img(k))}" data-big><img loading="lazy" style="aspect-ratio: ${k.endsWith('-414') ? '414 / 896' : k.endsWith('-1080') ? '1080 / 800' : '1280 / 800'}" src="${esc(img(k))}" alt="${esc(cellLabel(k))}"></a>${note}`;
  }
  const failed = fs.existsSync(path.join(OUT, `${k}.failed.png`)) ? ` <a href="${esc(k)}.failed.png" data-big>last frame</a>` : '';
  return `<div class="cell none"><strong>${c.status}</strong> — ${esc(c.why ?? '')}${failed}</div>`;
};

const sections = order
  .map((r) => {
    const its = itemsFor(r.id);
    const tags = [
      ITEM17.includes(r.n) ? '17 · Chromium not walked' : '',
      r.n ? '18 · Firefox' : '',
      its.some((i) => ITEM19.includes(i.id)) ? `19 · ${its.filter((i) => ITEM19.includes(i.id)).map((i) => i.id).join(', ')}` : '',
    ].filter(Boolean);
    const good: string[] = [];
    if (r.verdict) good.push(`<div><span class="lab">Table verdict so far</span> ${mdInline(r.verdict)}</div>`);
    if (r.ruling) good.push(`<div><span class="lab">Ruling / proposed</span> ${mdInline(r.ruling)}</div>`);
    if (r.exceptions) good.push(`<div><span class="lab">Per-cell exceptions</span> ${mdInline(r.exceptions)}</div>`);
    if (r.notes) good.push(`<div><span class="lab">Notes</span> ${mdInline(r.notes)}</div>`);
    for (const it of its) good.push(`<div><span class="lab">${it.id}</span> ${mdInline(it.lookAt)} <span class="lab">Good looks like</span> ${mdInline(it.good)}</div>`);
    if (!good.length || (!r.ruling && !its.length)) {
      good.push(`<div><span class="lab">Guide</span> One verdict: <strong>matches</strong>, <strong>differs by ruling</strong> or <strong>fix</strong>. The toolbar is judged against <code>design/toolbar-mock.html</code>; the reader's parts against <code>design/mockup.html</code> (plan §7-2).</div>`);
    }
    const mocks = THEMES.map((t) => path.join(PREP_SHOTS, r.section, r.id, `mock-${t}-1280.png`)).filter((p) => fs.existsSync(p));
    if (mocks.length) {
      good.push(`<div><span class="lab">Mock frame (8.1 prep)</span> ${mocks.map((p) => `<a href="${esc(path.relative(OUT, p).replace(/\\/g, '/'))}" data-big>${esc(path.basename(p))}</a>`).join(' · ')}</div>`);
    }
    const sflags = open.filter((f) => f.surface === r.id).length;
    const widthRows = WIDTHS.filter((w) => ENGINES.some((e) => THEMES.some((t) => manifest[cellKey(e, r.id, t, w)])))
      .map(
        (w) => `<div class="wrow"><div class="w">${w}${w === 414 ? '<br><small>(Firefox drawn at 500)</small>' : ''}</div>${ENGINES.flatMap((e) => THEMES.map((t) => `<div>${thumb(cellKey(e, r.id, t, w))}</div>`)).join('')}</div>`,
      )
      .join('');
    return `<section id="s-${esc(r.id)}">
<h2>${r.n ? `${r.n} · ` : ''}<code>${esc(r.id)}</code> <small>${esc(r.section)}</small>${sflags ? ` <a class="fc" href="#flags">${sflags} flag${sflags > 1 ? 's' : ''}</a>` : ''}</h2>
<div class="tags">${tags.map((t) => `<span>${esc(t)}</span>`).join('')}</div>
<div class="good">${good.join('\n')}</div>
<div class="grid"><div class="wrow head"><div></div><div>Chromium · light</div><div>Chromium · dark</div><div>Firefox · light</div><div>Firefox · dark</div></div>${widthRows}</div>
</section>`;
  })
  .join('\n');

const toc = order.map((r) => `<a href="#s-${esc(r.id)}">${r.n || '+'} ${esc(r.id)}</a>`).join(' ');

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Walk D contact sheet</title>
<style>
:root { --bg: #fafaf7; --fg: #16171f; --mut: #555866; --line: #d8d8d0; --card: #fff; --tag: #eeeee6; --flag: #8a3b00; color-scheme: light dark; }
@media (prefers-color-scheme: dark) { :root { --bg: #14151b; --fg: #e9eaf2; --mut: #a4a7b5; --line: #2e303a; --card: #1b1c24; --tag: #262833; --flag: #ffb37a; } }
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--fg); font: 14px/1.45 system-ui, sans-serif; }
main { max-width: 1500px; margin: 0 auto; padding: 16px; }
h1 { font-size: 22px; margin: 8px 0; } h2 { font-size: 17px; margin: 0 0 6px; } h2 small { color: var(--mut); font-weight: 400; }
code { font: 12.5px ui-monospace, Consolas, monospace; } a { color: inherit; }
.meta, .good, .tags, .cnote, .shots { color: var(--mut); } .meta p { margin: 4px 0; }
section, .box { background: var(--card); border: 1px solid var(--line); border-radius: 8px; padding: 12px; margin: 14px 0; }
.tags span { display: inline-block; background: var(--tag); border-radius: 4px; padding: 1px 6px; margin: 0 4px 6px 0; font-size: 12px; color: var(--fg); }
.good > div { margin: 3px 0; } .lab { font-weight: 600; color: var(--fg); margin-right: 4px; }
.grid { margin-top: 10px; } .wrow { display: grid; grid-template-columns: 56px repeat(4, minmax(0, 1fr)); gap: 8px; align-items: start; margin-bottom: 8px; }
.wrow.head { font-weight: 600; font-size: 12px; } .w { font-weight: 600; } .w small { font-weight: 400; color: var(--mut); }
.cell { display: block; border: 1px solid var(--line); border-radius: 4px; overflow: hidden; } .cell img { display: block; width: 100%; height: auto; }
.cell.none { padding: 8px; font-size: 12px; color: var(--mut); }
.cnote { font-size: 11px; }
#flags li { margin: 6px 0; } .kind { font-weight: 600; color: var(--flag); } .shots a { font-size: 12px; margin-right: 6px; } .ccnote { font-size: 13px; } .ex { font-size: 12px; color: var(--mut); }
.fc { font-size: 12px; color: var(--flag); font-weight: 400; }
nav.toc { font-size: 12px; line-height: 1.9; } nav.toc a { margin-right: 8px; white-space: nowrap; }
#big { position: fixed; inset: 0; background: rgba(0,0,0,.85); display: none; overflow: auto; z-index: 9; cursor: zoom-out; }
#big.on { display: block; } #big img { display: block; margin: 16px auto; max-width: none; } #big p { color: #fff; text-align: center; margin: 10px; font-size: 13px; }
@media (max-width: 700px) { .wrow { grid-template-columns: 40px repeat(2, minmax(0, 1fr)); } .wrow > div:first-child { grid-row: span 2; } }
</style></head>
<body><main>
<h1>Walk D — screenshots for the human's verdicts</h1>
<div class="meta">
<p><strong>walk-8.1.md items 17–19.</strong> Captured by CC (Claude Code) ${esc((run.started ?? '').slice(0, 10))}; <strong>every verdict is the human's</strong>. Build <code>${esc(run.commit ?? '?')}</code>, both engines rebuilt there. ${esc(countLine)}.</p>
<p>Chromium = the installed Chrome, the build loaded unpacked over CDP (its details page shows the "can't verify where this extension comes from" banner, as any unpacked load). Firefox = the build as a temporary add-on, "Access local files on your computer" turned on by its about:addons toggle after the guide's off state was captured. Viewport only, no browser chrome. 1280 × 800, 1080 × 800 (the II-9 / II-10 states), 414 × 896 (Firefox draws 414 CSS px at 500 device px: its PNG is 500 wide).</p>
<p>Content: <code>docs/store/assets/sample.md</code> as is, and a scratch copy (<code>_fixtures/rollout-notes.md</code>: sample.md plus a link, a remote image at <code>example.invalid</code> and a 60-line code block) for <code>long-code</code>, <code>long-code-expanded</code> and <code>remote-media</code>. The app page opens its folder through the <code>__peekoverHarness</code> seam (the Chromium route) in both engines — the prep's finding still holds: the Firefox folder / watch cells are a harness state, not a Firefox route.</p>
</div>
<div class="box" id="flags"><h2>CC flags — measured, not judged (${groupCount(open)})</h2>
<p class="meta">Mechanical checks only (scripts/walk-probe.ts, run on each shot's page): sideways scroll, text cut off, text drawn over text, text under floating chrome, text below WCAG AA (4.5:1, 3:1 large; topmost text), and controls / structure present in one engine and not the other. Each lists its shots.</p>
<ul>${flagList(open) || '<li>None.</li>'}</ul>
${explained.length ? `<details><summary>Measured, and the captured state itself explains it (${groupCount(explained)})</summary><ul>${flagList(explained)}</ul></details>` : ''}
</div>
<div class="box"><h2>States not captured — they need a real OS dialog or the browser's own UI</h2><ul>${(run.unreachable ?? []).map((u) => `<li>${mdInline(u)}</li>`).join('')}</ul>
${run.notes.length ? `<details><summary>Run notes (${run.notes.length})</summary><ul>${run.notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul></details>` : ''}</div>
<nav class="toc box">${toc}</nav>
${sections}
</main>
<div id="big" role="dialog" aria-label="Enlarged screenshot"><p></p><img alt=""></div>
<script>
(() => {
  const big = document.getElementById('big'), im = big.querySelector('img'), cap = big.querySelector('p');
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-big]');
    if (a) { e.preventDefault(); im.src = a.getAttribute('href'); cap.textContent = a.getAttribute('href'); big.classList.add('on'); big.scrollTo(0, 0); return; }
    if (big.classList.contains('on')) big.classList.remove('on');
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') big.classList.remove('on'); });
})();
</script>
</body></html>
`;
fs.writeFileSync(path.join(OUT, 'index.html'), html);
console.log(`[walk-sheet] ${path.join(OUT, 'index.html')}: ${order.length} surfaces; flags ${groupCount(open)} open, ${groupCount(explained)} explained; ${countLine}`);

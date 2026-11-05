// THE NATIVE-CONTROL SWEEP (013 task 5.1; plan §3; gate-3 Q4) — Chromium and Firefox.
//
// On every covered surface, in light and dark, every rendered `button` / `select` / `input` must carry its OWN
// look: an author background-color AND an author border — not the browser's native button / field. And every
// box that can scroll (overflow auto or scroll) carries an author `scrollbar-color`.
//
// "Native" is measured, not named: beside each control the sweep places a twin of the same tag and type with
// `all: revert` (every author declaration rolled back to the browser's own stylesheet; the inherited
// color-scheme kept, so a dark page's native twin is the dark one). A control whose background-color equals its
// twin's is drawn on the native fill (Chromium `buttonface` rgb(239,239,239), Firefox rgb(233,233,237), a field's
// white); one whose border style, width and colour all equal its twin's keeps the native border (`outset` on a
// button, `inset` on a field). Either is a finding.
//
// SURFACES (the contrast census's, plus the two pane states): the content-script reader (a file:// fixture —
// watching, the agent badge, a blocked image — and a raw-host fixture), the app page with no folder, the app page
// with a document open (toolbar, folder pane with pins and recents, reader pane with code, math, a table and a
// task list), the Files overlay at 414 px, the three panels (Stored data, Export, the code-theme picker), the
// editor, the unsaved-changes dialog, and (013 task 5.4) the Compare picker open with a seeded snapshot and the
// diagram lightbox open on a rendered diagram. The INVENTORY names every surface × theme it expects (SURFACES).
//
// THE PENDING LIST (gate-3 Q4): every not-yet-restyled control, `engine · surface · selector`, each routed to the
// task that restyles it. It may only SHRINK: a finding not on it is a red, and a row on it that no longer fails
// is a red too ("remove it"). Each group-5 task deletes its rows; at 5.7 it is EMPTY.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { page } from 'vitest/browser';
import { mount } from '../../src/render/mount';
import { mountAppShell, type AppStore } from '../../src/app/appShell';
import type { FolderSource, MarkdownFile } from '../../src/app/folderSource';
import type { FolderRecord, PinRecord, RecentRecord } from '../../src/app/store';
import { setThemeSetting, resetThemeWatchForTest } from '../../src/theme/reader';
import { DEFAULT_SETTINGS } from '../../src/settings/settings';
import { resetThemeHostsForTest } from '../../src/theme/themeRegistry';
import { resetThemeControlsForTest } from '../../src/theme/themeControl';
import { resetCodeThemeControlsForTest } from '../../src/theme/codeThemeControl';
import { registerWatchTarget, resetWatchRegistryForTest, stopWatch, type WatchTarget } from '../../src/watch/watchRegistry';
import { resetWatchControlsForTest, WATCH_HOST_ATTR, WATCH_CONTROL_CLASS } from '../../src/watch/watchControl';
import { registerDocIdentity, resetDocIdentityForTest } from '../../src/render/docIdentity';
import { getDiffContext, resetDiffRegistryForTest } from '../../src/render/diffRegistry';
import { storeSnapshot } from '../../src/app/snapshots';
import { clearDiagramCache, eraseSnapshots } from '../../src/app/store';
import { editorSessionFor, teardownEditorShell } from '../../src/render/editorView';
import { FILES_OVERLAY_MAX } from '../../src/app/toolbar';
import { nameOf, parentAcrossShadow } from './helpers/contrast';

const ENGINE = navigator.userAgent.includes('Firefox') ? 'firefox' : 'chromium';
type Theme = 'light' | 'dark';

/**
 * THE PENDING LIST — `surface · selector` → the task that restyles it; every row holds on BOTH engines (5.1 found
 * the same 31 on each), so each is listed once and keyed per engine below. Taken at 5.1 after the folder pane's
 * restyle: the pane's own controls and scrollbar are not on it. Each later group-5 task deletes its rows. 5.2 deleted
 * the TOC's 2 and sweeps the content-script reader at 1440 px, where its rail is open (at 414 it was collapsed).
 * 5.2a deleted 3: the app page's reader hosts (the app page and the editor) and the editor's preview host are no
 * longer scroll areas. CONTAINED_CSS dropped their `:host{overflow:auto}` so the rail can stick, and they now pass.
 * 5.3 deleted its 16: the code, math and table controls and the code and math scroll boxes (10 rows per engine left).
 * 5.4 deleted its 4 (the two panel slots, the code-theme picker, the capture checkbox) and added two surfaces, the
 * Compare picker and the diagram lightbox, whose findings it fixed rather than listed (6 rows per engine left).
 * 5.5 deleted its 2: the app page's reader pane scrolls with its own scrollbar colour (4 rows per engine left, 5.6's).
 * 5.6 deleted the last 4: the full-page reader's host carries the scrollbar colour, inherited by its code block.
 * THE LIST IS EMPTY (gate-3 Q4): any native-styled control or scrollbar on a swept surface is a red.
 */
const PENDING_ROWS: ReadonlyArray<readonly [string, string]> = [];
const PENDING: ReadonlyMap<string, string> = new Map(
  ['chromium', 'firefox'].flatMap((engine) => PENDING_ROWS.map(([row, task]) => [`${engine} · ${row}`, task] as const)),
);

// ── Measurement ─────────────────────────────────────────────────────────────────────────────────
interface Finding {
  key: string;
  surface: string;
  selector: string;
  what: string;
}

function* elementsUnder(root: Element | ShadowRoot): Generator<Element> {
  if (root instanceof Element && root.shadowRoot) yield* elementsUnder(root.shadowRoot);
  for (const el of root.querySelectorAll('*')) {
    yield el;
    if (el.shadowRoot) yield* elementsUnder(el.shadowRoot);
  }
}

function rendered(el: Element): boolean {
  if (el.getClientRects().length === 0) return false;
  for (let n: Element | null = el; n; n = parentAcrossShadow(n)) {
    const cs = getComputedStyle(n);
    if (cs.display === 'none' || cs.visibility !== 'visible') return false;
  }
  return true;
}

/** A control's name: its classes, else `parent > tag[type]`. */
function selectorOf(el: Element): string {
  const type = el instanceof HTMLInputElement ? `[type=${el.type}]` : '';
  if (el.classList.length) return `${nameOf(el)}${type}`;
  const parent = parentAcrossShadow(el);
  return `${parent ? `${nameOf(parent)} > ` : ''}${el.tagName.toLowerCase()}${type}`;
}

const SIDES = ['Top', 'Right', 'Bottom', 'Left'] as const;
const borderOf = (cs: CSSStyleDeclaration): string =>
  SIDES.map((s) => `${cs.getPropertyValue(`border-${s.toLowerCase()}-style`)} ${cs.getPropertyValue(`border-${s.toLowerCase()}-width`)} ${cs.getPropertyValue(`border-${s.toLowerCase()}-color`)}`).join(' / ');

/** The browser's own look for `el`: a same-tag, same-type twin beside it with every author declaration reverted. */
function nativeTwin(el: HTMLElement): { bg: string; border: string } {
  const twin = document.createElement(el.tagName.toLowerCase()) as HTMLElement;
  if (el instanceof HTMLInputElement) twin.setAttribute('type', el.type);
  if (el instanceof HTMLButtonElement) twin.textContent = 'x';
  twin.style.setProperty('all', 'revert');
  el.after(twin);
  const cs = getComputedStyle(twin);
  const out = { bg: cs.backgroundColor, border: borderOf(cs) };
  twin.remove();
  return out;
}

function sweep(root: Element, surface: string): Finding[] {
  const found = new Map<string, Finding>();
  const add = (el: Element, what: string): void => {
    const selector = selectorOf(el);
    const key = `${ENGINE} · ${surface} · ${selector}`;
    const prior = found.get(key);
    if (!prior) found.set(key, { key, surface, selector, what });
    else if (!prior.what.includes(what)) prior.what += `; ${what}`;
  };
  // The root itself first (an overlay pane or a panel is its own scroll box), then everything under it.
  for (const el of [root, ...elementsUnder(root)]) {
    if (!rendered(el)) continue;
    const cs = getComputedStyle(el);
    if (el.matches('button, select, input') && el instanceof HTMLElement) {
      const twin = nativeTwin(el);
      if (cs.backgroundColor === twin.bg) add(el, `native background ${cs.backgroundColor}`);
      if (borderOf(cs) === twin.border) add(el, `native border ${cs.borderTopStyle} ${cs.borderTopWidth}`);
    }
    const scrolls = [cs.overflowX, cs.overflowY].some((o) => o === 'auto' || o === 'scroll');
    if (scrolls && cs.getPropertyValue('scrollbar-color').trim() === 'auto') add(el, 'scrollbar-color auto');
  }
  return [...found.values()];
}

// ── Fixtures ────────────────────────────────────────────────────────────────────────────────────
const DOC = [
  '# Sweep heading',
  '',
  'A paragraph with a [link](https://example.invalid/page) and `code`.',
  '',
  '## Two',
  '### Three',
  '',
  '- [ ] a task',
  '- [x] a done task',
  '',
  '| Name | Value |',
  '|------|-------|',
  '| alpha | 1 |',
  '| beta | 2 |',
  '',
  '```javascript',
  'const answer = 42; // a comment',
  '```',
  '',
  '$$',
  'E = mc^2',
  '$$',
  '',
  '![a blocked image](https://example.invalid/a.png)',
  '',
].join('\n');

/** 013 task 5.4: a document with one diagram, for the lightbox. */
const DIAGRAM_DOC = '# Diagram\n\n```mermaid\ngraph LR; Raw-->Peekover-->Reading;\n```\n';

/** Every surface the sweep covers, each in light and dark (the INVENTORY checks this list by name). */
const SURFACES = [
  'tab reader (file)',
  'tab reader (raw host)',
  'app page (no folder)',
  'app page',
  'files overlay',
  'Stored data panel',
  'Export panel',
  'code-theme picker',
  'editor',
  'unsaved-changes dialog',
  'Compare picker',
  'diagram lightbox',
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function waitFor<T>(fn: () => T | null | undefined | false, what: string, tries = 300): Promise<T> {
  for (let i = 0; i < tries; i += 1) {
    const v = fn();
    if (v) return v as T;
    await sleep(20);
  }
  throw new Error(`timed out waiting for ${what}`);
}
async function themed(el: HTMLElement, theme: Theme): Promise<void> {
  setThemeSetting(theme);
  await waitFor(() => el.getAttribute('data-theme') === theme, `data-theme=${theme}`);
}

const cleanup: HTMLElement[] = [];
function freshHost(): HTMLElement {
  const host = document.createElement('div');
  document.body.appendChild(host);
  cleanup.push(host);
  return host;
}
function watchTarget(): WatchTarget {
  let on = false;
  return { start: () => void (on = true), stop: () => void (on = false), isWatching: () => on };
}
const mem = (name: string, text: string): MarkdownFile => ({ path: name, name, read: async () => text });

/** An in-memory store with folders, recents and pins, so the pane shows its Pinned and Recent sections. */
let sweepTheme: Theme = 'light';
function memStore(): AppStore {
  const folders = new Map<string, FolderRecord>();
  const recents = new Map<string, RecentRecord>();
  const pins = new Map<string, PinRecord>();
  return {
    putFolder: async (r) => void folders.set(r.id, r),
    deleteFolder: async (id) => void folders.delete(id),
    getFolders: async () => [...folders.values()],
    putRecent: async (r) => void recents.set(r.id, r),
    getRecents: async () => [...recents.values()],
    deleteRecent: async (id) => void recents.delete(id),
    putPin: async (r) => void pins.set(r.id, r),
    getPins: async () => [...pins.values()],
    deletePin: async (id) => void pins.delete(id),
    getSettings: async () => ({ ...DEFAULT_SETTINGS, theme: sweepTheme }),
    putSettings: async () => undefined,
  };
}

/** The app page with the folder open, `CLAUDE.md` open, the folder and the file pinned, and a recent. */
async function appPage(theme: Theme, width = 1440): Promise<{ container: HTMLElement; host: HTMLElement }> {
  sweepTheme = theme;
  setThemeSetting(theme);
  await page.viewport(width, 900);
  const container = freshHost();
  const source: FolderSource = { name: 'docs', truncated: false, persistable: true, files: [mem('CLAUDE.md', DOC), mem('notes/other.md', '# Other\n\nText.\n')] };
  const app = mountAppShell(container, { openFolder: async () => ({ ok: true, source }), store: memStore() });
  await app.openFolder();
  const item = await waitFor(() => [...container.querySelectorAll<HTMLButtonElement>('[role="treeitem"][data-kind="file"]')].find((b) => b.textContent === 'CLAUDE.md'), 'the tree item');
  item.click();
  const host = await waitFor(() => container.querySelector<HTMLElement>('.peekover-app__reader__host'), 'the reader pane');
  for (const pre of host.shadowRoot!.querySelectorAll<HTMLElement>('.peekover-code pre')) pre.scrollIntoView();
  await waitFor(() => host.shadowRoot?.querySelector('[data-code="rendered"]') && host.shadowRoot?.querySelector('math'), 'code and math enhanced');
  // At <= FILES_OVERLAY_MAX the pane is a closed overlay once a file is open: open it ("Files") and leave it open.
  if (width <= FILES_OVERLAY_MAX) {
    container.querySelector<HTMLButtonElement>('.peekover-toolbar__files-btn')!.click();
    await waitFor(() => container.querySelector('.peekover-app__folders')!.getClientRects().length > 0, 'the overlay open');
  }
  // Pin the folder and the file, so the pane shows both sections with their controls.
  (await waitFor(() => container.querySelector<HTMLButtonElement>('.peekover-app__pin[data-pin="folder"]:not(:disabled)'), 'Pin this folder')).click();
  (await waitFor(() => container.querySelector<HTMLButtonElement>('.peekover-app__pin[data-pin="file"]:not(:disabled)'), 'Pin the file')).click();
  await waitFor(() => container.querySelector('.peekover-recents__unpin'), 'the Pinned section');
  await themed(host, theme);
  await sleep(300); // colour transitions settle
  return { container, host };
}

const results: Finding[] = [];
const covered = new Set<string>();
function record(root: Element, surface: string, theme: Theme): void {
  covered.add(`${surface} · ${theme}`);
  results.push(...sweep(root, surface));
}

beforeEach(() => {
  resetThemeHostsForTest();
  resetThemeControlsForTest();
  resetThemeWatchForTest();
  resetCodeThemeControlsForTest();
  resetWatchRegistryForTest();
  resetWatchControlsForTest();
  resetDocIdentityForTest();
  resetDiffRegistryForTest();
});
afterEach(async () => {
  stopWatch();
  setThemeSetting('auto');
  for (const el of cleanup.splice(0)) {
    el.querySelectorAll<HTMLElement>('.peekover-app__reader__host').forEach(teardownEditorShell);
    el.remove();
  }
  resetThemeHostsForTest();
  resetThemeControlsForTest();
  resetWatchRegistryForTest();
  resetWatchControlsForTest();
  resetDocIdentityForTest();
  await page.viewport(414, 896);
});

describe('the native-control sweep (013 task 5.1)', () => {
  for (const theme of ['light', 'dark'] as const) {
    it(`content-script reader, file:// fixture — ${theme}`, async () => {
      registerWatchTarget(watchTarget());
      registerDocIdentity('CLAUDE.md');
      await page.viewport(1440, 900); // wide enough that the TOC rail opens (5.2)
      const host = freshHost();
      mount(DOC, host);
      await themed(host, theme);
      host.shadowRoot!.querySelector<HTMLElement>(`.${WATCH_CONTROL_CLASS}`)!.click();
      await waitFor(() => host.getAttribute(WATCH_HOST_ATTR) === 'active', 'watching');
      record(host, 'tab reader (file)', theme);
    });

    it(`content-script reader, raw-host fixture — ${theme}`, async () => {
      await page.viewport(1440, 900);
      const host = freshHost();
      mount(DOC, host);
      await themed(host, theme);
      record(host, 'tab reader (raw host)', theme);
    });

    it(`app page, no folder — ${theme}`, async () => {
      sweepTheme = theme;
      setThemeSetting(theme);
      await page.viewport(1440, 900);
      const container = freshHost();
      const source: FolderSource = { name: 'docs', truncated: false, persistable: true, files: [] };
      mountAppShell(container, { openFolder: async () => ({ ok: true, source }), store: memStore() });
      await waitFor(() => container.querySelector('.peekover-app__cta'), 'the CTA');
      await waitFor(() => container.querySelector('.peekover-app')?.getAttribute('data-theme') === theme, `the shell's data-theme=${theme}`);
      await sleep(300);
      record(container, 'app page (no folder)', theme);
    });

    it(`app page, a document open (toolbar, folder pane, reader pane) — ${theme}`, async () => {
      const { container } = await appPage(theme);
      record(container, 'app page', theme);
    });

    it(`the Files overlay at 414 px — ${theme}`, async () => {
      const { container } = await appPage(theme, 414); // appPage leaves the overlay open
      const pane = await waitFor(() => {
        const p = container.querySelector<HTMLElement>('.peekover-app__folders');
        return p && p.getClientRects().length ? p : null;
      }, 'the overlay open');
      record(pane, 'files overlay', theme);
    });

    it(`the three panels — ${theme}`, async () => {
      const { container } = await appPage(theme);
      for (const [name, toggle, panel] of [
        // Swept from the slot each panel scrolls in (the panel's own parent).
        ['Stored data panel', '.peekover-app__storage-toggle', '.peekover-app__storage-slot:not(:empty)'],
        ['Export panel', '.peekover-app__export-toggle', '.peekover-app__export-slot:not(:empty)'],
        ['code-theme picker', '.peekover-code-theme-toggle', '.peekover-code-theme-picker:not([hidden])'],
      ] as const) {
        container.querySelector<HTMLButtonElement>(toggle)!.click();
        const el = await waitFor(() => container.querySelector<HTMLElement>(panel), name);
        record(el, name, theme);
        container.querySelector<HTMLButtonElement>(toggle)!.click();
        await sleep(30);
      }
    });

    it(`the editor and the unsaved-changes dialog — ${theme}`, async () => {
      const { container, host } = await appPage(theme);
      container.querySelector<HTMLButtonElement>('.peekover-toolbar__seg [data-mode="edit"]')!.click();
      await waitFor(() => host.getAttribute('data-mode') === 'edit', 'edit mode');
      const session = await waitFor(() => editorSessionFor(host), 'the edit session');
      await sleep(200);
      record(host, 'editor', theme);
      session.view.dispatch({ changes: { from: session.view.state.doc.length, insert: ' typed' } });
      container.querySelector<HTMLButtonElement>('.peekover-toolbar__seg [data-mode="reading"]')!.click();
      const dialog = await waitFor(() => container.querySelector<HTMLElement>('.peekover-unsaved'), 'the unsaved dialog');
      record(dialog, 'unsaved-changes dialog', theme);
    });

    // 013 task 5.4: the Compare picker, open, with a snapshot seeded as diffChrome's tests seed one — through the
    // production capture function and the docId the app page registered (the folder is persistable, so it does).
    it(`the Compare picker, open with a snapshot — ${theme}`, async () => {
      const { container } = await appPage(theme);
      try {
        const ctx = await waitFor(() => getDiffContext(), 'the diff context');
        await storeSnapshot(ctx.docId, DOC.replace('## Two', '## Two, before'));
        for (let i = 0; i < 100 && (await ctx.fetchMeta()).length === 0; i += 1) await sleep(20);
        container.querySelector<HTMLButtonElement>('.peekover-toolbar .peekover-diff-affordance')!.click();
        await waitFor(() => container.querySelector('.peekover-toolbar .peekover-diff-picker:not([hidden]) [data-target-kind="snapshot"]'), 'a snapshot row');
        record(container.querySelector<HTMLElement>('.peekover-toolbar__drop')!, 'Compare picker', theme);
      } finally {
        await eraseSnapshots();
      }
    });

    // 013 task 5.4: the diagram lightbox, open on a rendered diagram (the production mermaid load, as the lightbox's
    // own tests run it).
    it(`the diagram lightbox, open — ${theme}`, async () => {
      sweepTheme = theme;
      setThemeSetting(theme);
      await page.viewport(1440, 900);
      const container = freshHost();
      const source: FolderSource = { name: 'docs', truncated: false, persistable: false, files: [mem('diagram.md', DIAGRAM_DOC)] };
      const app = mountAppShell(container, { openFolder: async () => ({ ok: true, source }), store: memStore() });
      try {
        await app.openFolder();
        (await waitFor(() => container.querySelector<HTMLButtonElement>('[role="treeitem"][data-kind="file"]'), 'the tree item')).click();
        const host = await waitFor(() => container.querySelector<HTMLElement>('.peekover-app__reader__host'), 'the reader pane');
        await themed(host, theme); // before the diagram is read: a theme change re-renders it
        const open = await waitFor(() => host.shadowRoot?.querySelector<HTMLButtonElement>('.peekover-diagram[data-diagram="rendered"] .peekover-diagram-open'), 'a rendered diagram', 1500);
        open.click();
        const box = await waitFor(() => host.shadowRoot!.querySelector<HTMLElement>('.peekover-diagram-lightbox'), 'the lightbox');
        await sleep(250);
        record(box, 'diagram lightbox', theme);
      } finally {
        await clearDiagramCache();
      }
    }, 60_000);
  }

  it('INVENTORY: no finding off the pending list, and no pending row that now passes', () => {
    const findings = new Map(results.map((r) => [r.key, r]));
    for (const r of [...findings.values()].sort((a, b) => a.key.localeCompare(b.key))) console.log(`SWEEP ${JSON.stringify(r)}`);
    console.log(`SWEEP-PENDING-SIZE ${[...PENDING.keys()].filter((k) => k.startsWith(`${ENGINE} ·`)).length} (${ENGINE}), ${PENDING.size} (both engines)`);
    // Every surface × theme by name (5.4): a surface dropped from the sweep is named here, not just counted.
    const expected = SURFACES.flatMap((s) => (['light', 'dark'] as const).map((t) => `${s} · ${t}`)).sort();
    expect([...covered].sort(), 'surfaces × themes swept').toEqual(expected);
    const unlisted = [...findings.values()].filter((r) => !PENDING.has(r.key)).map((r) => `${r.key} — ${r.what}`);
    const nowPassing = [...PENDING.keys()].filter((k) => k.startsWith(`${ENGINE} ·`) && !findings.has(k));
    expect(unlisted, 'native-styled controls or scrollbars not on the pending list').toEqual([]);
    expect(nowPassing, 'pending rows that now pass — remove them (the list only shrinks)').toEqual([]);
  });
});

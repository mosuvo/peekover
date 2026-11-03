// THE APP PAGE WITHOUT ITS PILLS (013 task 4.5; plan D-5, D-8; G-15; rulings A and D).
//
// On the app page `mount()` runs with `pills: false` at EVERY render — the first mount, a file switch,
// the watch and save re-renders (forced in appShell's renderWithEnhancements), a diff exit, a theme
// change — so no floating pill is ever in the reader's shadow root there; the file:// reader keeps
// all of them. What the pills carried lives in the toolbar and in the notice area below it, in the
// page flow and never over text:
// - the ONE-TIME snapshot notice (D-8): shown while the open document is watched with capture on,
//   until "Got it"; the dismissal is its own settings-store row (`notices`, G-15), so "Wipe all data"
//   brings it back (D-12); the Stored data panel states every clause it states, dismissed or not (Q13);
// - the watch note (ruling A, from 4.2) and the remote-images load bar (ruling D).
//
// Both engines. The save re-render needs a writable file handle: that arm is Chromium's (the origin
// private file system), like editorSave.browser.test.ts. Everything else runs on memory files, whose
// `read()` the app page's polling watch reads — so a watch re-render is real on both engines.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { page } from 'vitest/browser';
import { mountAppShell, type AppStore } from '../../src/app/appShell';
import type { FolderSource, MarkdownFile } from '../../src/app/folderSource';
import { mount } from '../../src/render/mount';
import { wipeAll, __resetConnectionForTest, getSnapshotNoticeDismissed, setSnapshotNoticeDismissed } from '../../src/app/store';
import { resetThemeHostsForTest } from '../../src/theme/themeRegistry';
import { resetThemeControlsForTest } from '../../src/theme/themeControl';
import { setThemeSetting } from '../../src/theme/reader';
import { registerWatchTarget, resetWatchRegistryForTest, stopWatch, isWatching } from '../../src/watch/watchRegistry';
import { resetWatchControlsForTest } from '../../src/watch/watchControl';
import { resetDiffRegistryForTest } from '../../src/render/diffRegistry';
import { registerDocIdentity, resetDocIdentityForTest } from '../../src/render/docIdentity';
import { createDiffContext, registerDiffContext } from '../../src/render/diffRegistry';
import { EDITOR_SAVE_CLASS, EDITOR_STATUS_CLASS, editorSessionFor, teardownEditorShell } from '../../src/render/editorView';
import { setCaptureFlag, resetCaptureFlagForTest } from '../../src/app/captureFlag';

const CHROMIUM = !navigator.userAgent.includes('Firefox');
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function until<T>(fn: () => T | null | undefined | false, what: string, ms = 8000): Promise<T> {
  const end = performance.now() + ms;
  for (;;) {
    const v = fn();
    if (v) return v as T;
    if (performance.now() > end) throw new Error(`timed out: ${what}`);
    await sleep(25);
  }
}

/** Every floating pill (and the watch chrome) mount() builds when pills are on — by class alone. */
const PILLS = [
  'peekover-mode-toggle',
  'peekover-theme-toggle',
  'peekover-watch',
  'peekover-watch-note',
  'peekover-watch-disclosure',
  'peekover-diff-affordance',
  'peekover-diff-picker',
  'peekover-diff-status',
  'peekover-agent-badge',
];
const pillsIn = (host: HTMLElement): string[] =>
  PILLS.filter((cls) => host.shadowRoot?.querySelector(`.${cls}`));

const DOC = (marker: string): string => `# Notes ${marker}\n\nA paragraph of text.\n\n## Second\n\nMore text.\n`;
const REMOTE = '# Pictures\n\nText above the picture.\n\n![remote](https://example.invalid/a.png)\n\nText below.\n';

interface Live {
  text: string;
  file: MarkdownFile;
}
function live(name: string, text: string): Live {
  const l: Live = { text, file: { path: name, name, read: async () => l.text } };
  return l;
}

const containers: HTMLElement[] = [];
const hosts: HTMLElement[] = [];

/** The app page over a WATCHABLE memory folder. `store` omitted → the real IndexedDB store. */
async function openShell(files: MarkdownFile[], store?: AppStore): Promise<HTMLElement> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  containers.push(container);
  const source: FolderSource = { name: 'docs', truncated: false, persistable: true, files };
  const app = mountAppShell(container, { openFolder: async () => ({ ok: true, source }), ...(store ? { store } : {}) });
  await app.openFolder();
  return container;
}

async function select(container: HTMLElement, name: string): Promise<HTMLElement> {
  const row = await until(
    () => [...container.querySelectorAll<HTMLButtonElement>('[role="treeitem"][data-kind="file"]')].find((b) => b.textContent === name),
    `the ${name} tree row`,
  );
  row.click();
  await until(() => container.querySelector('.peekover-toolbar__file')?.textContent === name, `${name} open`);
  return until(() => {
    const host = container.querySelector<HTMLElement>('.peekover-app__reader__host');
    return host?.shadowRoot?.querySelector('.peekover-reader h1') ? host : null;
  }, 'the reader');
}

const tb = (c: HTMLElement) => c.querySelector<HTMLElement>('.peekover-toolbar')!;
const watchButton = (c: HTMLElement) => tb(c).querySelector<HTMLButtonElement>('.peekover-watch')!;
const notice = (c: HTMLElement) => c.querySelector<HTMLElement>('.peekover-app__notices .peekover-toolbar__notice')!;
const shown = (el: Element | null | undefined): boolean => !!el && el.getClientRects().length > 0;

async function watch(c: HTMLElement): Promise<void> {
  watchButton(c).click();
  await until(() => isWatching(), 'the watch to start');
}

/** Change a watched memory file AFTER the poll has taken its baseline (the first read, one interval
 *  in) — a change before that read IS the baseline, and no change is seen. */
async function changeOnDisk(l: Live, text: string): Promise<void> {
  await sleep(1300);
  l.text = text;
}

beforeEach(async () => {
  stopWatch();
  resetWatchRegistryForTest();
  resetWatchControlsForTest();
  resetDiffRegistryForTest();
  resetDocIdentityForTest();
  resetThemeHostsForTest();
  resetThemeControlsForTest();
  resetCaptureFlagForTest();
  await wipeAll();
  document.body.replaceChildren();
  await page.viewport(1280, 900);
});

afterEach(async () => {
  stopWatch();
  for (const c of containers.splice(0)) {
    c.querySelectorAll<HTMLElement>('.peekover-app__reader__host').forEach(teardownEditorShell);
    c.remove();
  }
  for (const h of hosts.splice(0)) h.remove();
  __resetConnectionForTest();
  resetWatchRegistryForTest();
  resetWatchControlsForTest();
  resetDiffRegistryForTest();
  resetDocIdentityForTest();
  setThemeSetting('auto');
  resetCaptureFlagForTest();
  document.body.replaceChildren();
  await page.viewport(414, 896);
});

// ── pills: false at every app-page render ─────────────────────────────────────────────────────────

describe('4.5 — no pill in the app page\'s reader, at every render; the file:// reader keeps them all', () => {
  it('first mount, a file switch, a theme change, a diff exit and a watch re-render: no pill after any of them', async () => {
    const agent = live('CLAUDE.md', DOC('agent'));
    const other = live('alpha.md', DOC('alpha'));
    const c = await openShell([agent.file, other.file]);
    const seen: string[] = [];
    const check = (when: string, host: HTMLElement): void => void seen.push(`${when}: ${JSON.stringify(pillsIn(host))}`);

    let host = await select(c, 'CLAUDE.md');
    check('first mount (an agent file)', host);

    host = await select(c, 'alpha.md');
    check('a file switch', host);

    tb(c).querySelector<HTMLButtonElement>('.peekover-app__theme-toggle')!.click();
    await sleep(100);
    check('a theme change', host);

    tb(c).querySelector<HTMLButtonElement>('.peekover-diff-affordance')!.click();
    (await until(() => tb(c).querySelector<HTMLButtonElement>('.peekover-diff-picker [data-target-kind="file"]'), 'a file row')).click();
    await until(() => host.getAttribute('data-diff') === 'active', 'the diff');
    tb(c).querySelector<HTMLButtonElement>('.peekover-diff-affordance')!.click();
    await until(() => host.getAttribute('data-diff') === null, 'the diff to close');
    check('a diff exit', host);

    await watch(c);
    await changeOnDisk(other, DOC('alpha, changed on disk'));
    await until(() => host.shadowRoot?.querySelector('.peekover-reader h1')?.textContent?.includes('changed'), 'the watch re-render');
    check('a watch re-render', host);

    expect(seen).toEqual([
      'first mount (an agent file): []',
      'a file switch: []',
      'a theme change: []',
      'a diff exit: []',
      'a watch re-render: []',
    ]);
  }, 30_000);

  it.runIf(CHROMIUM)('a save re-render (Chromium: a writable file) builds no pill either', async () => {
    const root = await navigator.storage.getDirectory();
    const dir = await root.getDirectoryHandle('snapshot-notice-4-5', { create: true });
    const name = `save-${Date.now()}.md`;
    const fh = await dir.getFileHandle(name, { create: true });
    const w = await fh.createWritable();
    await w.write(DOC('on disk'));
    await w.close();
    const file: MarkdownFile = { path: name, name, read: async () => (await fh.getFile()).text(), handle: fh };
    try {
      const c = await openShell([file]);
      const host = await select(c, name);
      tb(c).querySelector<HTMLButtonElement>('.peekover-toolbar__seg [data-mode="edit"]')!.click();
      const session = await until(() => editorSessionFor(host), 'the edit session');
      session.view.dispatch({ changes: { from: session.view.state.doc.length, insert: ' zq45saved' } });
      host.shadowRoot!.querySelector<HTMLElement>(`.${EDITOR_SAVE_CLASS}`)!.click();
      await until(() => host.shadowRoot!.querySelector<HTMLElement>(`.${EDITOR_STATUS_CLASS}`)?.textContent === 'Saved.', 'the save');
      tb(c).querySelector<HTMLButtonElement>('.peekover-toolbar__seg [data-mode="reading"]')!.click();
      await until(() => host.shadowRoot?.querySelector('.peekover-reader')?.textContent?.includes('zq45saved'), 'the save re-render');
      expect(pillsIn(host), 'after the save re-render').toEqual([]);
    } finally {
      await dir.removeEntry(name).catch(() => undefined);
    }
  }, 30_000);

  it('CONTROL — the file:// reader (mount without the option) still builds every pill', () => {
    registerWatchTarget({ start: () => undefined, stop: () => undefined, isWatching: () => false });
    registerDocIdentity('CLAUDE.md');
    registerDiffContext(
      createDiffContext({
        docId: 'f\u001fCLAUDE.md',
        getCurrentSource: () => DOC('x'),
        fetchMeta: async () => [],
        fetchText: async () => undefined,
        showDiff: () => ({ ok: true }) as never,
        hideDiff: () => undefined,
      }),
    );
    const host = document.createElement('div');
    document.body.appendChild(host);
    hosts.push(host);
    mount(DOC('file'), host);
    expect(pillsIn(host)).toEqual(expect.arrayContaining([
      'peekover-mode-toggle',
      'peekover-theme-toggle',
      'peekover-watch',
      'peekover-diff-affordance',
      'peekover-agent-badge',
    ]));
  });
});

// ── D-8: the one-time snapshot notice ────────────────────────────────────────────────────────────

describe('4.5 — the one-time snapshot notice (D-8; G-15)', () => {
  const CLAUSES = [/on this device only/i, /never uploaded/i, /turn off capture/i, /erase all snapshots/i];

  it('shows on the first watch with capture on, in the notice area, with "Stored data" and "Got it"', async () => {
    const a = live('alpha.md', DOC('a'));
    const c = await openShell([a.file]);
    await select(c, 'alpha.md');
    await sleep(100); // the dismissal row has loaded
    expect(shown(notice(c)), 'not before watching').toBe(false);
    await watch(c);
    await until(() => shown(notice(c)), 'the notice');
    expect(notice(c).getAttribute('role')).toBe('status');
    for (const clause of CLAUSES) expect(notice(c).textContent).toMatch(clause);
    expect([...notice(c).querySelectorAll('button')].map((b) => b.textContent)).toEqual(['Stored data', 'Got it']);

    notice(c).querySelector<HTMLButtonElement>('.peekover-toolbar__notice-link')!.click();
    await until(() => c.querySelector('.peekover-storage'), 'the Stored data panel');
  });

  it('"Got it" hides it, and it stays hidden on the next page (a re-mount over the same store)', async () => {
    const a = live('alpha.md', DOC('a'));
    let c = await openShell([a.file]);
    await select(c, 'alpha.md');
    await watch(c);
    await until(() => shown(notice(c)), 'the notice');
    notice(c).querySelector<HTMLButtonElement>('.peekover-toolbar__notice-ok')!.click();
    expect(shown(notice(c))).toBe(false);
    for (let i = 0; i < 100 && !(await getSnapshotNoticeDismissed()); i += 1) await sleep(25);
    expect(await getSnapshotNoticeDismissed(), 'the dismissal row is written').toBe(true);

    // A reload: a new shell over the same IndexedDB.
    stopWatch();
    c.remove();
    resetWatchRegistryForTest();
    resetWatchControlsForTest();
    resetDiffRegistryForTest();
    c = await openShell([a.file]);
    await select(c, 'alpha.md');
    await sleep(150);
    await watch(c);
    await sleep(150);
    expect(shown(notice(c)), 'dismissed is remembered').toBe(false);
  });

  it('"Wipe all data" brings it back (the row is in the settings store the wipe clears — D-12)', async () => {
    const a = live('alpha.md', DOC('a'));
    const c = await openShell([a.file]);
    await select(c, 'alpha.md');
    await watch(c);
    await until(() => shown(notice(c)), 'the notice');
    notice(c).querySelector<HTMLButtonElement>('.peekover-toolbar__notice-ok')!.click();
    await until(() => !shown(notice(c)), 'dismissed');

    c.querySelector<HTMLButtonElement>('.peekover-app__storage-toggle')!.click();
    const wipe = await until(() => [...c.querySelectorAll<HTMLButtonElement>('.peekover-storage__btn')].find((b) => b.textContent === 'Wipe all data'), 'Wipe all data');
    wipe.click();
    (await until(() => [...c.querySelectorAll<HTMLButtonElement>('.peekover-storage__btn')].find((b) => b.textContent === 'Yes, wipe everything'), 'the confirm')).click();
    await until(() => shown(notice(c)), 'the notice after the wipe');
    expect(await getSnapshotNoticeDismissed(), 'and the row is gone').toBe(false);
  });

  it('dismissed or not, the Stored data panel states every clause the notice states (Q13)', async () => {
    await setSnapshotNoticeDismissed();
    const a = live('alpha.md', DOC('a'));
    const c = await openShell([a.file]);
    await select(c, 'alpha.md');
    await watch(c);
    await sleep(200);
    expect(shown(notice(c)), 'the fixture is dismissed').toBe(false);
    c.querySelector<HTMLButtonElement>('.peekover-app__storage-toggle')!.click();
    const note = await until(() => c.querySelector<HTMLElement>('.peekover-storage [data-note="contents-never-stored"]'), 'the panel note');
    for (const clause of CLAUSES) expect(note.textContent, String(clause)).toMatch(clause);
  });

  it('capture off → no notice', async () => {
    const a = live('alpha.md', DOC('a'));
    const c = await openShell([a.file]);
    await select(c, 'alpha.md');
    setCaptureFlag(false);
    await watch(c);
    await sleep(200);
    expect(shown(notice(c))).toBe(false);
  });
});

// ── Rulings A and D: the notice area, in the page flow, never over text ──────────────────────────

describe('4.5 — the load bar joins the notice area (ruling D); nothing in it sits over text', () => {
  it('the app page\'s load bar is in the notice area, not the reader — and stays there through a watch re-render', async () => {
    const pic = live('pictures.md', REMOTE);
    const c = await openShell([pic.file]);
    const host = await select(c, 'pictures.md');
    const bar = await until(() => c.querySelector<HTMLElement>('.peekover-app__notices .peekover-remote-load'), 'the load bar in the notice area');
    expect(bar.textContent).toMatch(/1 remote image blocked · Load/);
    expect(host.shadowRoot!.querySelector('.peekover-remote-load'), 'none left in the reader').toBeNull();

    await watch(c);
    await changeOnDisk(pic, REMOTE.replace('Text below.', 'Text below, changed.'));
    await until(() => host.shadowRoot?.querySelector('.peekover-reader')?.textContent?.includes('changed'), 'the watch re-render');
    await until(() => c.querySelector('.peekover-app__notices .peekover-remote-load'), 'the re-render\'s bar adopted');
    expect(host.shadowRoot!.querySelector('.peekover-remote-load')).toBeNull();
    expect(c.querySelectorAll('.peekover-app__notices .peekover-remote-load')).toHaveLength(1);
  }, 20_000);

  it('CONTROL — the file:// reader keeps its own load bar', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    hosts.push(host);
    mount(REMOTE, host);
    expect(host.shadowRoot!.querySelector('.peekover-remote-load')).not.toBeNull();
  });

  it.each([1440, 1280, 1080, 414])('at %i px the notice, the watch note and the load bar sit in the page flow — below the header, above the reader, over no text', async (width) => {
    await page.viewport(width, 900);
    const pic = live('pictures.md', REMOTE);
    const c = await openShell([pic.file]);
    const host = await select(c, 'pictures.md');
    await watch(c);
    await until(() => shown(notice(c)), 'the notice');
    await document.fonts.ready;
    const header = c.querySelector<HTMLElement>('.peekover-app__header')!.getBoundingClientRect();
    const reader = c.querySelector<HTMLElement>('.peekover-app__reader')!.getBoundingClientRect();
    // Every text line box in the reading column.
    const lines: DOMRect[] = [];
    const walker = document.createTreeWalker(host.shadowRoot!.querySelector('.peekover-reader')!, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (!n.textContent?.trim()) continue;
      const range = document.createRange();
      range.selectNodeContents(n);
      lines.push(...[...range.getClientRects()].filter((r) => r.width > 0 && r.height > 0));
    }
    expect(lines.length, 'text to test against').toBeGreaterThan(0);
    const chrome = [...c.querySelectorAll<HTMLElement>('.peekover-app__notices > *, .peekover-app__notices .peekover-remote-load')].filter(shown);
    expect(chrome.length, 'the notice and the load bar are shown').toBeGreaterThanOrEqual(2);
    const problems: string[] = [];
    for (const el of chrome) {
      const r = el.getBoundingClientRect();
      // The hit-test first: the thing a user would see covered.
      const hit = document.elementFromPoint(r.left + Math.min(20, r.width / 2), r.top + r.height / 2);
      if (!hit || !el.contains(hit)) problems.push(`${el.className}: not on top at its own point`);
      if (r.top < header.bottom - 0.5) problems.push(`${el.className}: above the header's bottom`);
      if (r.bottom > reader.top + 0.5) problems.push(`${el.className}: reaches into the reader`);
      for (const l of lines) {
        if (r.left < l.right && l.left < r.right && r.top < l.bottom && l.top < r.bottom) {
          problems.push(`${el.className}: over a line of text`);
          break;
        }
      }
    }
    expect(problems, `at ${width} px`).toEqual([]);
  }, 20_000);
});

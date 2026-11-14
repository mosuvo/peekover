// Release 0.1.1, the notice redesign in a real engine (`decisions.md`, "0.1.1 NOTICE REDESIGN"; the copy approved by
// the human 2026-11-14). jsdom pins the words and the attributes (`src/app/snapshotNotice.test.ts`); this file pins
// what only an engine can show:
//   1. the ⓘ popover's keyboard — Enter opens it, Esc closes it, focus stays on ⓘ — and that it opens inside the window;
//   2. the unavailable Watch control is reachable by keyboard (aria-disabled, not disabled) and names its reason;
//   3. the granted row is a plain row ("granted: <folder>" and Revoke on one line, no rounded border), aligned with the
//      Snapshot line;
//   4. CHROMIUM ONLY, C5 on a real folder: a file changed on disk after the pick throws `NotReadableError`, and the
//      reader says "This file changed after you picked the folder". Firefox reads the changed file fresh (measured
//      2026-11-14), so the case does not arise there.

import { describe, it, expect, afterEach } from 'vitest';
import { commands, page, userEvent } from 'vitest/browser';
import { mountAppShell, type AppStore } from '../../src/app/appShell';
import { isDirectoryPickerSupported, type FolderSource, type MarkdownFile } from '../../src/app/folderSource';
import { folderSourceFromFileList } from '../../src/app/firefoxFolderSource';
import { CHANGED_AFTER_PICK, WATCH_UNAVAILABLE_REASON } from '../../src/app/snapshotNotice';
import { stopWatch } from '../../src/watch/watchRegistry';

declare module 'vitest/internal/browser' {
  interface BrowserCommands {
    diskFixture(action: 'create', files: Record<string, string>): Promise<string>;
    diskFixture(action: 'append', path: string, text: string): Promise<number>;
    diskFixture(action: 'remove', path: string): Promise<true>;
    setInputFromDisk(selector: string, paths: string | string[]): Promise<true>;
  }
}

const isChromium = isDirectoryPickerSupported();
const sep = navigator.platform.startsWith('Win') ? '\\' : '/';

const cleanup: (() => Promise<unknown> | void)[] = [];
afterEach(async () => {
  stopWatch();
  while (cleanup.length) await cleanup.pop()!();
});

async function waitFor<T>(fn: () => T | null | undefined, ms = 5000): Promise<T> {
  for (let t = 0; t < ms; t += 50) {
    const v = fn();
    if (v) return v;
    await new Promise<void>((r) => setTimeout(r, 50));
  }
  throw new Error('waitFor timed out');
}

const fakeStore = (): AppStore => ({
  putFolder: async () => undefined,
  deleteFolder: async () => undefined,
  putRecent: async () => undefined,
});
const md = (path: string, text: string): MarkdownFile => ({ path, name: path, read: async () => text });
const snapshotOf = (files: MarkdownFile[]): FolderSource => ({
  name: 'agent-notes',
  files,
  truncated: false,
  persistable: false,
  handle: undefined,
});

async function mountPicked(openFolder: () => Promise<{ ok: true; source: FolderSource }>): Promise<HTMLElement> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  cleanup.push(() => container.remove());
  const app = mountAppShell(container, { openFolder, store: fakeStore() });
  await app.openFolder();
  await waitFor(() => container.querySelector('[role="treeitem"][data-kind="file"]'));
  return container;
}

const itemIn = (c: HTMLElement, name: string): HTMLElement =>
  [...c.querySelectorAll<HTMLElement>('[role="treeitem"][data-kind="file"]')].find((e) => e.textContent?.trim() === name)!;

describe('the Snapshot line in a real engine (0.1.1)', () => {
  it('Enter on ⓘ opens the popover inside the window; Esc closes it and focus stays on ⓘ', async () => {
    await page.viewport(1280, 800);
    const c = await mountPicked(async () => ({ ok: true, source: snapshotOf([md('a.md', '# A\n')]) }));
    itemIn(c, 'a.md').click();
    await waitFor(() => c.querySelector('.peekover-app__reader__host')?.shadowRoot?.querySelector('h1'));

    const info = c.querySelector<HTMLButtonElement>('.peekover-app__snapshot-info')!;
    const pop = c.querySelector<HTMLElement>('[data-state="snapshot-details"]')!;
    expect(pop.matches(':popover-open'), 'closed at rest').toBe(false);
    info.focus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => pop.matches(':popover-open'));
    expect(info.getAttribute('aria-expanded')).toBe('true');
    // Placed by script under the button, wholly inside the window (no CSS anchor positioning on the floors).
    const r = pop.getBoundingClientRect();
    const b = info.getBoundingClientRect();
    expect(r.top, 'below ⓘ').toBeGreaterThanOrEqual(b.bottom);
    expect(r.left).toBeGreaterThanOrEqual(0);
    expect(r.right).toBeLessThanOrEqual(window.innerWidth);
    expect(r.bottom).toBeLessThanOrEqual(window.innerHeight);
    // Its action is next in the focus order.
    await userEvent.keyboard('{Tab}');
    expect(document.activeElement?.textContent).toBe('Pick again');

    await userEvent.keyboard('{Escape}');
    await waitFor(() => !pop.matches(':popover-open'));
    expect(info.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement, 'focus returns to ⓘ').toBe(info);

    // A press outside closes it too (light dismiss).
    info.click();
    await waitFor(() => pop.matches(':popover-open'));
    // A real (trusted) click: synthetic pointer events do not light-dismiss.
    await userEvent.click(c.querySelector<HTMLElement>('.peekover-app__reader')!);
    await waitFor(() => !pop.matches(':popover-open'));
  });

  it('at phone width the popover still fits inside the window', async () => {
    await page.viewport(360, 760);
    const c = await mountPicked(async () => ({ ok: true, source: snapshotOf([md('a.md', '# A\n')]) }));
    const info = c.querySelector<HTMLButtonElement>('.peekover-app__snapshot-info')!;
    const pop = c.querySelector<HTMLElement>('[data-state="snapshot-details"]')!;
    info.click();
    await waitFor(() => pop.matches(':popover-open'));
    const r = pop.getBoundingClientRect();
    expect(r.left).toBeGreaterThanOrEqual(0);
    expect(r.right).toBeLessThanOrEqual(window.innerWidth);
    pop.hidePopover();
    await page.viewport(1280, 800);
  });

  it('the unavailable Watch is reachable by keyboard and is described by its visible reason', async () => {
    await page.viewport(1280, 800);
    const c = await mountPicked(async () => ({ ok: true, source: snapshotOf([md('a.md', '# A\n')]) }));
    itemIn(c, 'a.md').click();
    const watch = await waitFor(() => c.querySelector<HTMLButtonElement>('.peekover-toolbar .peekover-watch'));
    watch.focus();
    expect(document.activeElement, 'focusable (aria-disabled, not disabled)').toBe(watch);
    const reason = document.getElementById(watch.getAttribute('aria-describedby')!)!;
    expect(reason.textContent).toBe(WATCH_UNAVAILABLE_REASON);
    expect(reason.getClientRects().length, 'the reason is shown').toBeGreaterThan(0);
    await userEvent.keyboard('{Enter}');
    expect(c.querySelector('.peekover-app__reader__host')?.getAttribute('data-watch'), 'Enter starts nothing').toBeNull();
  });

  it('the granted row is plain: one line, no rounded border, aligned with the Snapshot line', async () => {
    await page.viewport(1280, 800);
    const c = await mountPicked(async () => ({ ok: true, source: snapshotOf([md('a.md', '# A\n')]) }));
    const chip = c.querySelector<HTMLElement>('.peekover-app__chip')!;
    const style = getComputedStyle(chip);
    expect(style.borderTopWidth).toBe('0px');
    expect(style.borderTopLeftRadius).toBe('0px');
    const label = chip.querySelector<HTMLElement>('.peekover-app__chip-label')!.getBoundingClientRect();
    const revoke = chip.querySelector<HTMLElement>('.peekover-app__chip-revoke')!.getBoundingClientRect();
    expect(revoke.top, 'Revoke on the same line').toBeLessThan(label.bottom);
    expect(revoke.bottom).toBeGreaterThan(label.top);
    // The two rows start at the same x: the Snapshot line's dot under the "granted:" text.
    const dot = c.querySelector<HTMLElement>('.peekover-app__snapshot-dot')!.getBoundingClientRect();
    expect(Math.abs(dot.left - label.left), 'left edges aligned').toBeLessThanOrEqual(1);
  });
});

/** A real picked folder: Playwright fills an `<input webkitdirectory>` from `dir` on disk. */
async function pickFromDisk(dir: string): Promise<FolderSource> {
  const input = document.createElement('input');
  input.type = 'file';
  input.setAttribute('webkitdirectory', '');
  input.id = `pick-${Math.trunc(performance.now() * 1000)}`;
  document.body.appendChild(input);
  cleanup.push(() => input.remove());
  await commands.setInputFromDisk(`#${input.id}`, dir);
  return folderSourceFromFileList(input.files!);
}

describe.runIf(isChromium)('Chromium: C5 on a real picked folder', () => {
  it('a file changed after the pick shows "This file changed after you picked the folder"; a deleted one does not', async () => {
    await page.viewport(1280, 800);
    const dir = await commands.diskFixture('create', { 'notes.md': '# Notes\n', 'other.md': '# Other\n', 'gone.md': '# Gone\n' });
    cleanup.push(() => commands.diskFixture('remove', dir));
    const source = await pickFromDisk(dir);
    const c = await mountPicked(async () => ({ ok: true, source }));
    itemIn(c, 'notes.md').click();
    await waitFor(() => c.querySelector('.peekover-app__reader__host')?.shadowRoot?.querySelector('h1'));

    await commands.diskFixture('append', `${dir}${sep}notes.md`, '\nChanged after the pick.\n');
    await commands.diskFixture('remove', `${dir}${sep}gone.md`);
    // The instrument first: the engine itself refuses the changed file with NotReadableError (measured 2026-11-14).
    const err = await source.files.find((f) => f.name === 'notes.md')!.read().then(() => null, (e: unknown) => e);
    expect((err as { name?: string } | null)?.name, 'the read of the changed file').toBe('NotReadableError');

    itemIn(c, 'other.md').click();
    await waitFor(() => c.querySelector('.peekover-app__reader__host')?.shadowRoot?.querySelector('h1')?.textContent?.includes('Other'));
    itemIn(c, 'notes.md').click();
    const state = await waitFor(() => c.querySelector<HTMLElement>('.peekover-app__reader [data-state="changed-after-pick"]'));
    expect(state.textContent).toContain(CHANGED_AFTER_PICK.title);
    expect(state.textContent).toContain(`notes.md — ${CHANGED_AFTER_PICK.detail}`);

    // Control: a deleted file (NotFoundError) keeps the general state.
    itemIn(c, 'gone.md').click();
    const gone = await waitFor(() => c.querySelector<HTMLElement>('.peekover-app__reader [data-state="unreadable"]'));
    expect(gone.textContent).toContain("Couldn't read this file");
    // Control: an unchanged file still reads.
    itemIn(c, 'other.md').click();
    await waitFor(() => c.querySelector('.peekover-app__reader__host')?.shadowRoot?.querySelector('h1')?.textContent?.includes('Other'));
  }, 30000);
});

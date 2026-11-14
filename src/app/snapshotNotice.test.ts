// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import {
  buildSnapshotLine,
  CHANGED_AFTER_PICK,
  PICK_AGAIN,
  REPICK_HINTS,
  SNAPSHOT_INFO_NAME,
  SNAPSHOT_LABEL,
  SNAPSHOT_LINES,
  WATCH_UNAVAILABLE_REASON,
  type AppBuild,
  type SnapshotRoute,
} from './snapshotNotice';
import { mountAppShell, type AppStore } from './appShell';
import type { FolderSource, MarkdownFile } from './folderSource';
import type { FolderRecord, RecentRecord } from './store';
import { resetWatchRegistryForTest } from '../watch/watchRegistry';
import { resetWatchControlsForTest } from '../watch/watchControl';

// Release 0.1.1, the notice redesign (`decisions.md`, "0.1.1 NOTICE REDESIGN"; the copy approved by the human
// 2026-11-14). Every string is pinned as approved, per build and route, and each is shown where it belongs: the
// Watch control's reason in the toolbar, the "Snapshot" line and its popover in the sidebar, the re-pick hint in
// the hub, and C5 in the reader pane. The popover's keyboard (Enter opens, Esc closes, focus stays on ⓘ) is a real
// engine's (`tests/browser/snapshotNotice.browser.test.ts`); here, the attributes that wire it.

const APPROVED: Record<AppBuild, Record<SnapshotRoute, string[]>> = {
  chromium: {
    picker: [
      'This is the folder as it was when you picked it.',
      'New files won’t appear, and changed or deleted files won’t open.',
      'This browser can’t keep folder access, so you’ll pick it again next time.',
    ],
    drop: [
      'This is the folder as it was when you dragged it in.',
      'To see new or removed files, drag it in again.',
      'This browser can’t keep folder access, so you’ll open it again next time.',
    ],
  },
  firefox: {
    picker: [
      'Firefox shows this folder as it was when you picked it: new files won’t appear.',
      'Opening a file shows its latest saved version.',
      'Firefox can’t keep folder access, so you’ll pick it again next time.',
    ],
    drop: [
      'Firefox shows this folder as it was when you dragged it in.',
      'To see new or removed files, drag it in again.',
      'Firefox can’t keep folder access, so you’ll open it again next time.',
    ],
  },
};

const CASES: [AppBuild, SnapshotRoute][] = [
  ['chromium', 'picker'],
  ['chromium', 'drop'],
  ['firefox', 'picker'],
  ['firefox', 'drop'],
];

describe('the approved copy (0.1.1)', () => {
  it('the short strings', () => {
    expect(WATCH_UNAVAILABLE_REASON).toBe('To watch, drag the folder in.');
    expect(SNAPSHOT_LABEL).toBe('Snapshot');
    expect(SNAPSHOT_INFO_NAME).toBe('About this snapshot');
    expect(PICK_AGAIN).toBe('Pick again');
    expect(REPICK_HINTS.chromium).toBe('Peekover no longer has access to this folder — click to pick it again.');
    expect(REPICK_HINTS.firefox).toBe('Firefox can’t remember folder access — click to pick it again.');
    expect(CHANGED_AFTER_PICK).toEqual({
      title: 'This file changed after you picked the folder',
      detail: 'Pick the folder again to read its latest version.',
    });
  });

  it.each(CASES)('%s build, %s route: the popover lines, at most three', (build, route) => {
    expect([...SNAPSHOT_LINES[build][route]]).toEqual(APPROVED[build][route]);
    expect(SNAPSHOT_LINES[build][route].length).toBeLessThanOrEqual(3);
  });

  it('only the Firefox build names Firefox', () => {
    const chromium = [...SNAPSHOT_LINES.chromium.picker, ...SNAPSHOT_LINES.chromium.drop, REPICK_HINTS.chromium];
    expect(chromium.join(' ')).not.toMatch(/firefox/i);
    expect(CHANGED_AFTER_PICK.title + CHANGED_AFTER_PICK.detail + WATCH_UNAVAILABLE_REASON).not.toMatch(/firefox/i);
  });
});

describe('buildSnapshotLine', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it.each(CASES)('%s build, %s route: "Snapshot", an ⓘ button wired to a labelled popover', (build, route) => {
    let picks = 0;
    const line = buildSnapshotLine(document, { build, route, onPickAgain: () => (picks += 1) });
    document.body.append(line);
    expect(line.querySelector('.peekover-app__snapshot-label')?.textContent).toBe('Snapshot');

    const info = line.querySelector<HTMLButtonElement>('.peekover-app__snapshot-info')!;
    expect(info.tagName).toBe('BUTTON');
    expect(info.type).toBe('button');
    expect(info.getAttribute('aria-label')).toBe('About this snapshot');
    expect(info.getAttribute('aria-expanded')).toBe('false');

    const pop = line.querySelector<HTMLElement>('[data-state="snapshot-details"]')!;
    expect(info.getAttribute('popovertarget')).toBe(pop.id);
    expect(info.getAttribute('aria-controls')).toBe(pop.id);
    expect(pop.getAttribute('popover')).toBe('auto');
    expect(pop.getAttribute('role')).toBe('dialog');
    expect(pop.getAttribute('aria-label')).toBe('About this snapshot');
    expect([...pop.querySelectorAll('p')].map((p) => p.textContent)).toEqual(APPROVED[build][route]);

    const again = pop.querySelector<HTMLButtonElement>('.peekover-app__snapshot-again');
    if (route === 'picker') {
      expect(again?.textContent).toBe('Pick again');
      again!.click();
      expect(picks).toBe(1);
    } else {
      // A drag cannot start from a button: the drag route has none.
      expect(again).toBeNull();
      expect(pop.querySelector('button')).toBeNull();
    }
  });

  it('two lines get two popover ids (no aria-controls collision)', () => {
    const a = buildSnapshotLine(document, { build: 'chromium', route: 'picker', onPickAgain: () => {} });
    const b = buildSnapshotLine(document, { build: 'chromium', route: 'picker', onPickAgain: () => {} });
    expect(a.querySelector('[popover]')!.id).not.toBe(b.querySelector('[popover]')!.id);
  });
});

// --- wired into the app shell ---------------------------------------------------------------------------------

function mdFile(path: string, read: () => Promise<string> = async () => `# ${path}`): MarkdownFile {
  return { path, name: path.split('/').pop() ?? path, read };
}
const snapshot = (files: MarkdownFile[]): FolderSource => ({
  name: 'notes',
  files,
  truncated: false,
  persistable: false,
  handle: undefined,
});
const live = (files: MarkdownFile[]): FolderSource => ({ ...snapshot(files), persistable: true });
function store(extra: Partial<AppStore> = {}): AppStore {
  return { putFolder: async () => undefined, deleteFolder: async () => undefined, putRecent: async () => undefined, ...extra };
}
const flush = () => new Promise<void>((r) => setTimeout(r, 0));

describe('the app shell shows the redesign', () => {
  let container: HTMLElement;
  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
    resetWatchRegistryForTest();
    resetWatchControlsForTest();
  });

  async function openPicked(build: AppBuild | undefined, source: FolderSource, opens = { n: 0 }) {
    const app = mountAppShell(container, {
      ...(build ? { build } : {}),
      store: store(),
      openFolder: async () => {
        opens.n += 1;
        return { ok: true, source };
      },
    });
    await app.openFolder();
    container.querySelector<HTMLButtonElement>('[role="treeitem"][data-kind="file"]')!.click();
    await flush();
    return app;
  }

  async function openDropped(build: AppBuild, source: FolderSource) {
    mountAppShell(container, { build, store: store(), dropToOutcome: async () => ({ ok: true, source }) });
    container.querySelector('.peekover-app')!.dispatchEvent(new Event('drop', { bubbles: true, cancelable: true }));
    await flush();
    container.querySelector<HTMLButtonElement>('[role="treeitem"][data-kind="file"]')!.click();
    await flush();
  }

  const popLines = () => [...container.querySelectorAll('[data-state="snapshot-details"] p')].map((p) => p.textContent);
  const watchIn = () => container.querySelector<HTMLButtonElement>('.peekover-toolbar .peekover-watch');

  it.each(['chromium', 'firefox'] as const)('%s build, picker route: the line, its popover, and no banner', async (build) => {
    await openPicked(build, snapshot([mdFile('a.md')]));
    expect(container.querySelector('[data-state="read-only-snapshot"]')?.textContent).toContain('Snapshot');
    expect(popLines()).toEqual(APPROVED[build].picker);
    // The 0.1.0 texts are gone: no banner over the reader, no long box in the sidebar.
    expect(container.textContent).not.toMatch(/Watching isn.t offered|no write-back|To watch a file for changes/);
    const note = container.querySelector<HTMLElement>('.peekover-app__notices .peekover-watch-note');
    expect(note === null || note.hidden, 'the watch note area says nothing').toBe(true);
  });

  it('the build defaults to Chromium (no Firefox naming without the flag)', async () => {
    await openPicked(undefined, snapshot([mdFile('a.md')]));
    expect(popLines()).toEqual(APPROVED.chromium.picker);
  });

  it.each(['chromium', 'firefox'] as const)('%s build, drag route: the drag lines and no button', async (build) => {
    await openDropped(build, snapshot([mdFile('a.md')]));
    expect(popLines()).toEqual(APPROVED[build].drop);
    expect(container.querySelector('[data-state="snapshot-details"] button')).toBeNull();
  });

  it('a live (persistable) folder shows no snapshot line', async () => {
    await openPicked('chromium', live([mdFile('a.md')]));
    expect(container.querySelector('[data-state="read-only-snapshot"]')).toBeNull();
  });

  it('picker route: Watch is shown unavailable, focusable, with its reason linked', async () => {
    await openPicked('firefox', snapshot([mdFile('a.md')]));
    const watch = watchIn()!;
    expect(watch, 'a Watch control is shown').not.toBeNull();
    expect(watch.getAttribute('aria-disabled')).toBe('true');
    expect(watch.disabled, 'aria-disabled, not disabled: it stays in the tab order').toBe(false);
    expect(watch.hasAttribute('aria-pressed')).toBe(false);
    expect(watch.textContent).toBe('Watch this file');
    const reasonId = watch.getAttribute('aria-describedby')!;
    const reason = container.querySelector(`[id="${reasonId}"]`);
    expect(reason?.textContent).toBe('To watch, drag the folder in.');
    expect(reason!.closest('.peekover-toolbar'), 'the reason is visible beside the control').not.toBeNull();
    // Activating it starts nothing.
    watch.click();
    await flush();
    expect(watchIn()!.getAttribute('aria-disabled')).toBe('true');
    expect(container.querySelector('.peekover-app__reader__host')?.getAttribute('data-watch')).toBeNull();
  });

  it('drag route: Watch is the ordinary toggle, with no reason', async () => {
    await openDropped('chromium', snapshot([mdFile('a.md')]));
    const watch = watchIn()!;
    expect(watch.hasAttribute('aria-disabled')).toBe(false);
    expect(watch.getAttribute('aria-pressed')).toBe('false');
    expect(container.textContent).not.toContain('To watch, drag the folder in.');
  });

  it('a live folder: Watch is the ordinary toggle', async () => {
    await openPicked('chromium', live([mdFile('a.md')]));
    expect(watchIn()!.hasAttribute('aria-disabled')).toBe(false);
    expect(container.textContent).not.toContain('To watch, drag the folder in.');
  });

  it('"Pick again" runs the same picker as "Open a folder"', async () => {
    const opens = { n: 0 };
    await openPicked('chromium', snapshot([mdFile('a.md')]), opens);
    expect(opens.n).toBe(1);
    container.querySelector<HTMLButtonElement>('.peekover-app__snapshot-again')!.click();
    await flush();
    expect(opens.n).toBe(2);
  });

  it('the granted row keeps its words: "granted: <folder>" and Revoke', async () => {
    await openPicked('chromium', snapshot([mdFile('a.md')]));
    const chip = container.querySelector('.peekover-app__chip')!;
    expect(chip.textContent).toBe('granted: notesRevoke');
    expect(chip.querySelector('.peekover-app__chip-revoke')?.getAttribute('aria-label')).toBe('Revoke access to notes');
  });

  // C5, the reader pane: a file the picker route can no longer read because it changed after the pick.
  const notReadable = () => Promise.reject(new DOMException('changed', 'NotReadableError'));
  const notFound = () => Promise.reject(new DOMException('gone', 'NotFoundError'));
  const stateIn = () => container.querySelector<HTMLElement>('.peekover-app__reader [data-state]');

  it('C5: picker snapshot + NotReadableError → "This file changed after you picked the folder"', async () => {
    await openPicked('chromium', snapshot([mdFile('a.md', notReadable)]));
    expect(stateIn()!.dataset.state).toBe('changed-after-pick');
    expect(stateIn()!.textContent).toContain('This file changed after you picked the folder');
    expect(stateIn()!.textContent).toContain('Pick the folder again to read its latest version.');
  });

  it('C5 controls: a deleted file, a live folder and the drag route keep "Couldn\'t read this file"', async () => {
    await openPicked('chromium', snapshot([mdFile('a.md', notFound)]));
    expect(stateIn()!.dataset.state).toBe('unreadable');
    expect(stateIn()!.textContent).toContain("Couldn't read this file");

    await openPicked('chromium', live([mdFile('a.md', notReadable)]));
    expect(stateIn()!.dataset.state).toBe('unreadable');

    await openDropped('chromium', snapshot([mdFile('a.md', notReadable)]));
    expect(stateIn()!.dataset.state).toBe('unreadable');
  });

  it.each(['chromium', 'firefox'] as const)('%s build: a handle-less recent carries its build\'s re-pick hint', async (build) => {
    const folders: FolderRecord[] = [{ id: 'F1', name: 'snap', addedAt: 1, lastOpenedAt: 1 }];
    const recents: RecentRecord[] = [{ id: 'r1', folderId: 'F1', path: 'a.md', name: 'a.md', openedAt: 100 }];
    const app = mountAppShell(container, {
      build,
      store: store({ getFolders: async () => folders, getRecents: async () => recents, getPins: async () => [] }),
    });
    await app.refresh();
    expect(container.querySelector('.peekover-recents__hint')?.textContent).toBe(REPICK_HINTS[build]);
  });
});

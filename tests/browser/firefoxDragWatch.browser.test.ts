// M13 — the 9.3 finding: Firefox, a folder opened by DRAG. Settled by measurement in the real engine, not by reading
// the code (`decisions.md`, "M13 — 9.3 finding: Firefox drag-folder watch").
//
// The question: on a dragged folder the pane shows READ_ONLY_SNAPSHOT_NOTE ("Watch mode and snapshot capture are also
// unavailable here…") while the toolbar offers Watch (`watchCapability`: route 'drop' → watchable), and ledger row 25
// says watching works for a dragged folder. Which is true?
//
// What is real here: the engine (Firefox), the app shell, the Entries adapter, the walk, the watch controller and its
// polled detector, and the FILE — a disk-backed Gecko `File` handed over by `setInputFiles` (a test-only command), then
// appended to ON DISK. What is fabricated: only the entry wrapper around that File and the drop's DataTransfer — the OS
// drag gesture cannot be driven headlessly (Task 0, the same class as the native picker; `folderDrop.browser.test.ts`).
// Firefox only: on Chromium a drop is a live handle, not a snapshot, so neither the note nor the question arises.
//
// The FIRING CONTROL (B) runs the identical flow over an in-memory `File` that cannot change: if A's update came from
// anywhere but the disk, B would update too.

import { describe, it, expect, afterEach } from 'vitest';
import { commands } from 'vitest/browser';
import { mountAppShell, type AppStore } from '../../src/app/appShell';
import { isDirectoryPickerSupported, type FolderSource } from '../../src/app/folderSource';
import {
  folderSourceFromDataTransfer,
  folderSourceFromFileList,
  READ_ONLY_SNAPSHOT_NOTE,
} from '../../src/app/firefoxFolderSource';
import { FIREFOX_PICKER_NOTE } from '../../src/watch/watchAvailability';
import { WATCH_CONTROL_CLASS } from '../../src/watch/watchControl';

declare module 'vitest/internal/browser' {
  interface BrowserCommands {
    diskFixture(action: 'create', files: Record<string, string>): Promise<string>;
    diskFixture(action: 'append', path: string, text: string): Promise<number>;
    diskFixture(action: 'remove', path: string): Promise<true>;
    setInputFromDisk(selector: string, paths: string | string[]): Promise<true>;
  }
}

const isFirefox = !isDirectoryPickerSupported();
const BEFORE = '# Rollout notes\n\nThe first version, written before the drop.\n';
const APPENDED = '\n## Appended on disk\n\nWritten after Watch was turned on.\n';
const sep = navigator.platform.startsWith('Win') ? '\\' : '/';

const cleanup: (() => Promise<unknown> | void)[] = [];
afterEach(async () => {
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

function fakeStore(): AppStore {
  return { putFolder: async () => undefined, deleteFolder: async () => undefined, putRecent: async () => undefined };
}

/** A real folder on disk with `notes.md`; returns its path and the file's. */
async function diskFolder(): Promise<{ dir: string; file: string }> {
  const dir = await commands.diskFixture('create', { 'notes.md': BEFORE });
  cleanup.push(() => commands.diskFixture('remove', dir));
  return { dir, file: `${dir}${sep}notes.md` };
}

/** A disk-backed `File` for `path`: an `<input type=file>` in this frame, filled by Playwright. */
async function diskBackedFile(path: string, directory = false): Promise<FileList> {
  const input = document.createElement('input');
  input.type = 'file';
  input.id = `disk-${Math.trunc(performance.now() * 1000)}`;
  if (directory) input.setAttribute('webkitdirectory', '');
  document.body.appendChild(input);
  cleanup.push(() => input.remove());
  await commands.setInputFromDisk(`#${input.id}`, path);
  return input.files!;
}

/** The drop's entry tree around `file()` — the one fabricated bit (a Gecko FileSystemFileEntry hands over its File). */
function droppedFolder(file: () => File): DataTransferItemList {
  const fileEntry = { isFile: true, isDirectory: false, name: 'notes.md', file: (ok: (f: File) => void) => ok(file()) };
  const dirEntry = {
    isFile: false,
    isDirectory: true,
    name: 'notes',
    createReader: () => {
      let done = false;
      return { readEntries: (ok: (e: unknown[]) => void) => ok(done ? [] : ((done = true), [fileEntry])) };
    },
  };
  return [{ kind: 'file', webkitGetAsEntry: () => dirEntry }] as unknown as DataTransferItemList;
}

interface Observed {
  snapshotNote: string | null;
  pickerNoteShown: boolean;
  watchOffered: boolean;
  watchPressed: string | null;
  updated: boolean;
}

/** Mount the shell, drop the folder, open notes.md, turn Watch on, append on disk, wait `ms` for the new heading. */
async function dropWatchAppend(diskPath: string, file: () => File, ms: number): Promise<Observed> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  cleanup.push(() => container.remove());
  const dropToOutcome = async (): Promise<{ ok: true; source: FolderSource }> => ({
    ok: true,
    source: await folderSourceFromDataTransfer(droppedFolder(file)),
  });
  mountAppShell(container, { dropToOutcome, store: fakeStore() });
  const shell = container.querySelector<HTMLElement>('.peekover-app')!;
  shell.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: new DataTransfer() }));

  const item = await waitFor(() => container.querySelector<HTMLElement>('[role="treeitem"][data-kind="file"]'));
  item.click();
  const reader = () => container.querySelector('.peekover-app__reader__host')?.shadowRoot ?? null;
  await waitFor(() => reader()?.querySelector('h1'));

  const snapshotNote = container.querySelector('[data-state="read-only-snapshot"]')?.textContent ?? null;
  const control = container.querySelector<HTMLButtonElement>(`.${WATCH_CONTROL_CLASS}`);
  const watchOffered = !!control && !control.disabled && control.getClientRects().length > 0;
  control?.click();
  const watchPressed = control?.getAttribute('aria-pressed') ?? null;
  // Let the watcher take its baseline read first (one 1 s poll + margin): an edit inside that window would BE the
  // baseline and could never read as a change. A person does not edit within milliseconds of pressing Watch.
  await new Promise<void>((r) => setTimeout(r, 1500));

  await commands.diskFixture('append', diskPath, APPENDED);
  let updated = false;
  for (let t = 0; t < ms && !updated; t += 100) {
    await new Promise<void>((r) => setTimeout(r, 100));
    updated = [...(reader()?.querySelectorAll('h2') ?? [])].some((h) => h.textContent?.includes('Appended on disk'));
  }
  return {
    snapshotNote,
    pickerNoteShown: (container.textContent ?? '').includes(FIREFOX_PICKER_NOTE),
    watchOffered,
    watchPressed,
    updated,
  };
}

describe.runIf(isFirefox)('Firefox — a dragged folder: the note, the Watch control, and a real on-disk change', () => {
  it('(A) the drop route: Watch is offered, and an append on disk reaches the reader', async () => {
    const { file } = await diskFolder();
    const files = await diskBackedFile(file);
    const disk = files[0];
    expect(disk.size).toBe(BEFORE.length); // the File really is notes.md from disk

    const seen = await dropWatchAppend(file, () => disk, 8000);
    // The instrument that settles the question runs first (AGENTS.md: assertion order).
    expect(seen.updated, 'the appended heading reached the reader through Watch').toBe(true);
    expect(seen.watchOffered).toBe(true);
    expect(seen.watchPressed).toBe('true');
    expect(seen.pickerNoteShown).toBe(false);
    // RECORDED, not endorsed: the pane's note still says Watch is unavailable on this route. The fix awaits the
    // human's approval of its wording (`decisions.md`, "M13 — 9.3 finding"); this line moves with it.
    expect(seen.snapshotNote).toBe(READ_ONLY_SNAPSHOT_NOTE);
    // A file entry's File keeps its drop-time size; only its text is read fresh (spec 005's TRAP 2, re-measured).
    expect(disk.size).toBe(BEFORE.length);
  }, 20000);

  it('(B) FIRING CONTROL: the same flow over an in-memory File does NOT update — the change in (A) came from disk', async () => {
    const { file } = await diskFolder();
    const frozen = new File([BEFORE], 'notes.md', { type: 'text/markdown' });
    const seen = await dropWatchAppend(file, () => frozen, 4000);
    expect(seen.watchPressed).toBe('true');
    expect(seen.updated).toBe(false);
  }, 20000);

  it('(C) the picker route: a cached File from <input webkitdirectory> also reads the on-disk append', async () => {
    const { dir, file } = await diskFolder();
    const files = await diskBackedFile(dir, true);
    const source = await folderSourceFromFileList(files);
    const notes = source.files.find((f) => f.name === 'notes.md')!;
    expect(await notes.read()).toBe(BEFORE);
    await commands.diskFixture('append', file, APPENDED);
    // RECORDED: FIREFOX_PICKER_NOTE says this route is "a frozen copy … later changes on disk never arrive".
    expect(await notes.read()).toBe(BEFORE + APPENDED);
  }, 20000);
});

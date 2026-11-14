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
} from '../../src/app/firefoxFolderSource';
import { SNAPSHOT_LINES, WATCH_UNAVAILABLE_REASON } from '../../src/app/snapshotNotice';
import { WATCH_CONTROL_CLASS } from '../../src/watch/watchControl';
import { CHANGED_IN_EDIT_ATTR } from '../../src/watch/watchController';
import { stopWatch } from '../../src/watch/watchRegistry';
import { editorSessionFor } from '../../src/render/editorView';

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
async function diskFolder(text = BEFORE): Promise<{ dir: string; file: string }> {
  const dir = await commands.diskFixture('create', { 'notes.md': text });
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
  /** The "Snapshot" popover's lines (0.1.1), or null with no snapshot line. */
  snapshotLines: string[] | null;
  /** The picker route's Watch reason is on screen (it must not be, on the drag route). */
  watchReasonShown: boolean;
  watchOffered: boolean;
  watchPressed: string | null;
  updated: boolean;
}

/** The snapshot line's popover lines (0.1.1), or null when the sidebar has no snapshot line. */
function popoverLines(container: HTMLElement): string[] | null {
  if (!container.querySelector('[data-state="read-only-snapshot"]')) return null;
  return [...container.querySelectorAll('[data-state="snapshot-details"] p')].map((p) => p.textContent ?? '');
}

/** A Watch control a person can use: present, shown, and neither disabled nor aria-disabled (0.1.1). */
function offered(control: HTMLButtonElement | null): boolean {
  return !!control && !control.disabled && control.getAttribute('aria-disabled') !== 'true' && control.getClientRects().length > 0;
}

/** Mount the shell, drop the folder, open notes.md, turn Watch on, append on disk, wait `ms` for the new heading.
 *  `before` (M13 9.3d): append BEFORE pressing Watch instead, the race's losing order, forced. */
async function dropWatchAppend(diskPath: string, file: () => File, ms: number, before = false): Promise<Observed> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  cleanup.push(() => container.remove());
  const dropToOutcome = async (): Promise<{ ok: true; source: FolderSource }> => ({
    ok: true,
    source: await folderSourceFromDataTransfer(droppedFolder(file)),
  });
  mountAppShell(container, { build: 'firefox', dropToOutcome, store: fakeStore() });
  const shell = container.querySelector<HTMLElement>('.peekover-app')!;
  shell.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: new DataTransfer() }));

  const item = await waitFor(() => container.querySelector<HTMLElement>('[role="treeitem"][data-kind="file"]'));
  item.click();
  const reader = () => container.querySelector('.peekover-app__reader__host')?.shadowRoot ?? null;
  await waitFor(() => reader()?.querySelector('h1'));

  const snapshotLines = popoverLines(container);
  const control = container.querySelector<HTMLButtonElement>(`.${WATCH_CONTROL_CLASS}`);
  const watchOffered = offered(control);
  if (before) await commands.diskFixture('append', diskPath, APPENDED);
  control?.click();
  const watchPressed = control?.getAttribute('aria-pressed') ?? null;
  // NO wait: the edit lands right after pressing Watch — a save made at once must still show. Before the M13
  // discovered task "baseline at the click", the first poll (~1 s later) took the edited text as its baseline and the
  // change was never shown; this test was red without a 1.5 s wait here (`decisions.md`, "M13 TASK 9.3a").
  // Yield once so the click's synchronous start (and its immediate baseline read) has begun.
  await new Promise<void>((r) => setTimeout(r, 0));

  if (!before) await commands.diskFixture('append', diskPath, APPENDED);
  let updated = false;
  for (let t = 0; t < ms && !updated; t += 100) {
    await new Promise<void>((r) => setTimeout(r, 100));
    updated = [...(reader()?.querySelectorAll('h2') ?? [])].some((h) => h.textContent?.includes('Appended on disk'));
  }
  return {
    snapshotLines,
    watchReasonShown: (container.textContent ?? '').includes(WATCH_UNAVAILABLE_REASON),
    watchOffered,
    watchPressed,
    updated,
  };
}

// M13 9.3d: file shapes whose rendered source and fresh read must compare equal (the detector's normalisation).
// The byte-order mark is built from its code point so no literal mark byte sits in this file.
const SEEDED_SHAPES: Array<[string, string]> = [
  ['CRLF', '# Rollout notes\r\n\r\nWindows line endings.\r\n'],
  ['BOM', `${String.fromCharCode(0xfeff)}# Rollout notes\n\nA byte-order mark first.\n`],
  ['no trailing newline', '# Rollout notes\n\nNo newline at the end.'],
];
// Two polls and a margin: the polled route reads at the click and then every 1 s (WATCH_INTERVAL_MS).
const QUIET_MS = 2600;

/** Mount the shell, drop the folder, open notes.md; the watch is stopped at cleanup. */
async function dropAndOpen(file: () => File): Promise<{ container: HTMLElement; host: HTMLElement }> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  cleanup.push(() => container.remove());
  cleanup.push(() => stopWatch());
  const dropToOutcome = async (): Promise<{ ok: true; source: FolderSource }> => ({
    ok: true,
    source: await folderSourceFromDataTransfer(droppedFolder(file)),
  });
  mountAppShell(container, { build: 'firefox', dropToOutcome, store: fakeStore() });
  container
    .querySelector<HTMLElement>('.peekover-app')!
    .dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: new DataTransfer() }));
  (await waitFor(() => container.querySelector<HTMLElement>('[role="treeitem"][data-kind="file"]'))).click();
  const host = await waitFor(() => container.querySelector<HTMLElement>('.peekover-app__reader__host'));
  await waitFor(() => host.shadowRoot?.querySelector('h1'));
  return { container, host };
}

/** Counts how often the reading column is re-mounted (`mount()` replaces the shadow root's children). */
function countRemounts(host: HTMLElement): () => number {
  let n = 0;
  const tally = (batch: MutationRecord[]) => {
    for (const r of batch) {
      for (const node of r.removedNodes) {
        if (node instanceof HTMLElement && node.classList.contains('peekover-reader')) n += 1;
      }
    }
  };
  const mo = new MutationObserver(tally);
  mo.observe(host.shadowRoot!, { childList: true });
  cleanup.push(() => mo.disconnect());
  return () => {
    tally(mo.takeRecords());
    return n;
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
    expect(seen.watchReasonShown).toBe(false);
    // 0.1.1 (the notice redesign, approved 2026-11-14): the drag route's popover in the Firefox build, pinned as
    // written. Its "drag it in again" line is clause (d) below, measured on Firefox 159 with the built extension
    // (decisions.md, "M13 TASK 8.1g"); its last line is (c).
    expect(seen.snapshotLines).toEqual([...SNAPSHOT_LINES.firefox.drop]);
    expect(seen.snapshotLines).toEqual([
      'Firefox shows this folder as it was when you dragged it in.',
      'To see new or removed files, drag it in again.',
      'Firefox can’t keep folder access, so you’ll open it again next time.',
    ]);
    // A file entry's File keeps its drop-time size; only its text is read fresh (spec 005's TRAP 2, re-measured).
    expect(disk.size).toBe(BEFORE.length);
  }, 20000);

  it('(A2) M13 9.3d: a save made BEFORE pressing Watch is shown (the baseline is the rendered source)', async () => {
    const { file } = await diskFolder();
    const disk = (await diskBackedFile(file))[0];
    const seen = await dropWatchAppend(file, () => disk, 8000, true);
    expect(seen.updated, 'the save made before the click reached the reader through Watch').toBe(true);
    expect(seen.watchPressed).toBe('true');
  }, 20000);

  for (const [shape, text] of SEEDED_SHAPES) {
    it(`(A3) M13 9.3d: an unchanged ${shape} file is not re-rendered; one change re-renders once`, async () => {
      const { file } = await diskFolder(text);
      const disk = (await diskBackedFile(file))[0];
      const { container, host } = await dropAndOpen(() => disk);
      const remounts = countRemounts(host);
      container.querySelector<HTMLButtonElement>(`.${WATCH_CONTROL_CLASS}`)!.click();
      await new Promise<void>((r) => setTimeout(r, QUIET_MS));
      expect(remounts(), `an unchanged ${shape} file was re-rendered`).toBe(0);
      await commands.diskFixture('append', file, APPENDED);
      await waitFor(() => [...(host.shadowRoot?.querySelectorAll('h2') ?? [])].some((h) => h.textContent?.includes('Appended on disk')), 8000);
      await new Promise<void>((r) => setTimeout(r, QUIET_MS));
      expect(remounts(), 'one change, one render').toBe(1);
    }, 25000);
  }

  it('(E1) M13 9.3d: with UNSAVED edits, the baseline is the loaded text; nothing is held, the buffer is kept', async () => {
    const { file } = await diskFolder();
    const disk = (await diskBackedFile(file))[0];
    const { container, host } = await dropAndOpen(() => disk);
    container.querySelector<HTMLButtonElement>('.peekover-toolbar__seg [data-mode="edit"]')!.click();
    await waitFor(() => host.getAttribute('data-mode') === 'edit');
    const session = editorSessionFor(host)!;
    session.view.dispatch({ changes: { from: session.view.state.doc.length, insert: '\nUnsaved line.\n' } });
    const buffer = session.view.state.doc.toString();
    container.querySelector<HTMLButtonElement>(`.${WATCH_CONTROL_CLASS}`)!.click();
    await new Promise<void>((r) => setTimeout(r, QUIET_MS));
    expect(host.hasAttribute(CHANGED_IN_EDIT_ATTR), 'the unsaved buffer was taken for a change on disk').toBe(false);
    expect(session.view.state.doc.toString(), 'the buffer is kept').toBe(buffer);
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
    // RECORDED: the 0.1.0-era FIREFOX_PICKER_NOTE said this route is "a frozen copy … later changes on disk never arrive".
    expect(await notes.read()).toBe(BEFORE + APPENDED);
  }, 20000);
});

// ── The drag note's clauses (the human's wording, 2026-11-07), each measured on the drag route ──────────────────────
// "Firefox shows this folder as it was when you dragged it in: files added or removed later won't appear, and Peekover
//  can't reopen it next time — drag it in again. Watching still works: a watched file is re-read from disk."

/** A dropped folder whose listing is LIVE: `readEntries` reads `listing` at call time and counts every walk. */
function liveFolder(name: string, listing: { name: string; file: () => File }[]) {
  const counter = { walks: 0 };
  const dirEntry = {
    isFile: false,
    isDirectory: true,
    name,
    createReader: () => {
      counter.walks += 1;
      let done = false;
      return {
        readEntries: (ok: (e: unknown[]) => void) =>
          ok(
            done
              ? []
              : ((done = true),
                listing.map((l) => ({ isFile: true, isDirectory: false, name: l.name, file: (cb: (f: File) => void) => cb(l.file()) }))),
          ),
      };
    },
  };
  const items = [{ kind: 'file', webkitGetAsEntry: () => dirEntry }] as unknown as DataTransferItemList;
  return { items, counter };
}

function treeNames(container: HTMLElement): string[] {
  return [...container.querySelectorAll('[role="treeitem"][data-kind="file"]')].map((e) => (e.textContent ?? '').trim());
}

async function mountAndDrop(items: () => DataTransferItemList, deps: Record<string, unknown> = {}): Promise<HTMLElement> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  cleanup.push(() => container.remove());
  const dropToOutcome = async (): Promise<{ ok: true; source: FolderSource }> => ({
    ok: true,
    source: await folderSourceFromDataTransfer(items()),
  });
  mountAppShell(container, { build: 'firefox', dropToOutcome, store: fakeStore(), ...deps });
  container
    .querySelector<HTMLElement>('.peekover-app')!
    .dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: new DataTransfer() }));
  await waitFor(() => container.querySelector('[role="treeitem"][data-kind="file"]'));
  return container;
}

describe.runIf(isFirefox)('Firefox — the drag note, clause by clause', () => {
  it('(a) a file ADDED after the drop does not appear — the listing is read once, at the drop; a re-drag shows it', async () => {
    const listing = [{ name: 'notes.md', file: () => new File([BEFORE], 'notes.md') }];
    const folder = liveFolder('clause-a', listing);
    const container = await mountAndDrop(() => folder.items);
    expect(treeNames(container)).toEqual(['notes.md']);

    listing.push({ name: 'added.md', file: () => new File(['# Added later\n'], 'added.md') });
    container.querySelector<HTMLElement>('[role="treeitem"][data-kind="file"]')!.click();
    await new Promise<void>((r) => setTimeout(r, 2500));
    expect(treeNames(container)).toEqual(['notes.md']);
    expect(folder.counter.walks).toBe(1); // nothing re-reads the listing after the drop

    // FIRING CONTROL: the same live listing, dragged in again, DOES show the added file.
    const again = await mountAndDrop(() => folder.items);
    expect(treeNames(again).sort()).toEqual(['added.md', 'notes.md']);
  }, 20000);

  it('(b) a file REMOVED from disk after the drop stays in the list; opening it shows the "could not read" state', async () => {
    const { dir, file } = await diskFolder();
    await commands.diskFixture('append', `${dir}${sep}keep.md`, '# Keep\n\nStays on disk.\n');
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.id = `disk-b-${Math.trunc(performance.now() * 1000)}`;
    document.body.appendChild(input);
    cleanup.push(() => input.remove());
    await commands.setInputFromDisk(`#${input.id}`, [file, `${dir}${sep}keep.md`]);
    const [notes, keep] = [...input.files!].sort((x, y) => x.name.localeCompare(y.name)).reverse();
    expect([notes.name, keep.name]).toEqual(['notes.md', 'keep.md']);

    const folder = liveFolder('clause-b', [
      { name: 'notes.md', file: () => notes },
      { name: 'keep.md', file: () => keep },
    ]);
    const container = await mountAndDrop(() => folder.items);
    await commands.diskFixture('remove', file);

    const item = (n: string) =>
      [...container.querySelectorAll<HTMLElement>('[role="treeitem"][data-kind="file"]')].find((e) => e.textContent?.trim() === n)!;
    item('keep.md').click();
    await new Promise<void>((r) => setTimeout(r, 800));
    item('notes.md').click();
    await new Promise<void>((r) => setTimeout(r, 1500));
    // MEASURED (Firefox): the removed file is still listed; its File's read now fails (AbortError); opening it shows the
    // designed "Couldn't read this file … It may have moved, or access was revoked." state — not a blank page.
    await expect(notes.text()).rejects.toThrow();
    const state = await waitFor(() => container.querySelector<HTMLElement>('.peekover-app__reader [data-state="unreadable"]'));
    expect(state.textContent).toContain("Couldn't read this file");
    expect(treeNames(container).sort()).toEqual(['keep.md', 'notes.md']);
  }, 20000);

  it('(c) after a reload the dragged folder IS remembered (Recent, "pick it again"), and reopening starts the picker', async () => {
    const name = `clause-c-${Math.trunc(performance.now())}`;
    const doc = `${name}.md`;
    const folder = liveFolder(name, [{ name: doc, file: () => new File([BEFORE], doc) }]);
    const container = document.createElement('div');
    document.body.appendChild(container);
    const dropToOutcome = async (): Promise<{ ok: true; source: FolderSource }> => ({
      ok: true,
      source: await folderSourceFromDataTransfer(folder.items),
    });
    // The REAL store (IndexedDB): what a reload would read back.
    mountAppShell(container, { build: 'firefox', dropToOutcome });
    container
      .querySelector<HTMLElement>('.peekover-app')!
      .dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: new DataTransfer() }));
    (await waitFor(() => container.querySelector<HTMLElement>('[role="treeitem"][data-kind="file"]'))).click();
    await new Promise<void>((r) => setTimeout(r, 1000));
    container.remove();

    // "Reload": a fresh shell over the same stored state.
    let pickerOpened = 0;
    const fresh = document.createElement('div');
    document.body.appendChild(fresh);
    cleanup.push(() => fresh.remove());
    mountAppShell(fresh, {
      build: 'firefox',
      dropToOutcome,
      openFolder: async () => {
        pickerOpened += 1;
        return { ok: false, reason: 'cancelled', message: 'No folder was opened.' } as never;
      },
    });
    const entry = await waitFor(
      () => [...fresh.querySelectorAll<HTMLButtonElement>('[data-reopen]')].find((b) => b.textContent?.includes(doc)) ?? null,
      5000,
    ).catch(() => null);
    // MEASURED (Firefox): the dragged folder's file IS remembered — a Recent entry marked "repick" with the hint
    // "Firefox can't remember folder access — click to pick it again." — and opening it starts the FOLDER PICKER
    // (a picker-route copy: Watch is not offered there), not a re-drag.
    expect(entry, 'the file of the dragged folder is listed under Recent after a reload').not.toBeNull();
    expect(entry!.dataset.reopen).toBe('repick');
    expect(entry!.textContent).toContain('click to pick it again');
    entry!.click();
    await waitFor(() => pickerOpened > 0);
    expect(pickerOpened).toBe(1);
  }, 20000);

  it('(d) dragging the same folder in AGAIN, on the same page, shows the files added and removed since (8.1g)', async () => {
    const listing = [
      { name: 'alpha.md', file: () => new File(['# Alpha\n'], 'alpha.md') },
      { name: 'beta.md', file: () => new File(['# Beta\n'], 'beta.md') },
    ];
    const folder = liveFolder('clause-d', listing);
    const container = await mountAndDrop(() => folder.items);
    expect(treeNames(container).sort()).toEqual(['alpha.md', 'beta.md']);

    listing.splice(1, 1, { name: 'gamma.md', file: () => new File(['# Gamma\n'], 'gamma.md') });
    await new Promise<void>((r) => setTimeout(r, 300));
    expect(treeNames(container).sort(), 'as it was until the next drag').toEqual(['alpha.md', 'beta.md']);

    // The second drag: the SAME shell, its own drop handler.
    container
      .querySelector<HTMLElement>('.peekover-app')!
      .dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: new DataTransfer() }));
    await waitFor(() => (treeNames(container).includes('gamma.md') ? true : null));
    expect(treeNames(container).sort()).toEqual(['alpha.md', 'gamma.md']);
    expect(folder.counter.walks).toBe(2);
    expect(popoverLines(container)).toEqual([...SNAPSHOT_LINES.firefox.drop]);
  }, 20000);
});

// ── The PICKER route, claim by claim (final-review step 1(c); the human's real-picker check, 2026-11-10: "picker:
// fresh") ──────────────────────────────────────────────────────────────────────────────────────────────────────────
// What its texts said until the 2026-11-10 ruling: FIREFOX_PICKER_NOTE ("…a frozen copy of each file, so later changes on disk never
// arrive"), READ_ONLY_SNAPSHOT_NOTE ("a read-only, point-in-time snapshot … reopening this folder means picking it
// again … Watch mode and snapshot capture are also unavailable here"), and the drag note's "a picked folder can't be
// watched". Real here: the engine, the shell, the FileList adapter and the FileList itself — Playwright fills an
// `<input webkitdirectory>` from a real folder on disk (the human confirmed the native dialog behaves the same for
// re-reads). Each clause is read through the app page, as a person would: the tree, a click, the reader.

/** The picker route's `openFolder`: each call is a fresh pick of `dir` (a new FileList, as a re-pick would give). */
function pickerOf(dir: string): { openFolder: () => Promise<{ ok: true; source: FolderSource }>; picks: () => number } {
  let picks = 0;
  return {
    openFolder: async () => {
      picks += 1;
      return { ok: true, source: await folderSourceFromFileList(await diskBackedFile(dir, true)) };
    },
    picks: () => picks,
  };
}

async function mountAndPick(dir: string, deps: Record<string, unknown> = {}): Promise<{ container: HTMLElement; picker: ReturnType<typeof pickerOf> }> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  cleanup.push(() => container.remove());
  const picker = pickerOf(dir);
  const app = mountAppShell(container, { build: 'firefox', openFolder: picker.openFolder, store: fakeStore(), ...deps });
  await app.openFolder();
  await waitFor(() => container.querySelector('[role="treeitem"][data-kind="file"]'));
  return { container, picker };
}

const itemIn = (container: HTMLElement, n: string): HTMLElement =>
  [...container.querySelectorAll<HTMLElement>('[role="treeitem"][data-kind="file"]')].find((e) => e.textContent?.trim() === n)!;
const readerOf = (container: HTMLElement) => container.querySelector('.peekover-app__reader__host')?.shadowRoot ?? null;
const pause = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

describe.runIf(isFirefox)('Firefox — the picker route, claim by claim', () => {
  it('(p1) an opened file is re-read from disk: an edit shows when the file is opened again; Watch is still not offered', async () => {
    const { dir, file } = await diskFolder();
    await commands.diskFixture('append', `${dir}${sep}other.md`, '# Other\n');
    const { container } = await mountAndPick(dir);
    itemIn(container, 'notes.md').click();
    await waitFor(() => readerOf(container)?.querySelector('h1'));
    expect([...readerOf(container)!.querySelectorAll('h2')].some((h) => h.textContent?.includes('Appended on disk'))).toBe(false);

    await commands.diskFixture('append', file, APPENDED);
    itemIn(container, 'other.md').click();
    await pause(800);
    itemIn(container, 'notes.md').click();
    const fresh = await waitFor(
      () => [...(readerOf(container)?.querySelectorAll('h2') ?? [])].find((h) => h.textContent?.includes('Appended on disk')) ?? null,
    ).catch(() => null);
    // The instrument that answers the question first: the popover's line 2 says an opened file shows its latest version.
    expect(fresh, 'the on-disk edit reached the reader on re-opening the file').not.toBeNull();
    // Watch is not offered on this route (a choice): shown unavailable, with its reason (0.1.1).
    const control = container.querySelector<HTMLButtonElement>(`.${WATCH_CONTROL_CLASS}`);
    expect(offered(control), 'Watch offered').toBe(false);
    expect(control?.getAttribute('aria-disabled')).toBe('true');
    expect(container.textContent).toContain(WATCH_UNAVAILABLE_REASON);
    // 0.1.1 (approved 2026-11-14): the picker route's popover in the Firefox build, pinned as written — line 1 is p2,
    // line 2 p1, line 3 p4.
    expect(popoverLines(container)).toEqual([
      'Firefox shows this folder as it was when you picked it: new files won’t appear.',
      'Opening a file shows its latest saved version.',
      'Firefox can’t keep folder access, so you’ll pick it again next time.',
    ]);
    expect(popoverLines(container)).toEqual([...SNAPSHOT_LINES.firefox.picker]);
  }, 20000);

  it('(p2) a file ADDED after picking does not appear; picking the folder again shows it (firing control)', async () => {
    const { dir } = await diskFolder();
    const { container, picker } = await mountAndPick(dir);
    expect(treeNames(container)).toEqual(['notes.md']);
    await commands.diskFixture('append', `${dir}${sep}added.md`, '# Added later\n');
    itemIn(container, 'notes.md').click();
    // CONDITION, NOT A PAUSE (M13 9.3d): the only ways `added.md` could appear are a new pick (counted below) or a
    // re-read on opening the file, and that read has finished once the opened file has rendered.
    await waitFor(() => readerOf(container)?.querySelector('h1'));
    expect(treeNames(container)).toEqual(['notes.md']);
    expect(picker.picks()).toBe(1);

    const again = await mountAndPick(dir);
    expect(treeNames(again.container).sort()).toEqual(['added.md', 'notes.md']);
    // BUDGET (M13 9.3d): about 1 s locally. Each pick is one directory upload, which the harness now caps at 10 s
    // with one retry (`vitest.config.ts`, setInputFromDisk); every wait here is bounded at 5 s. 30 s holds two capped
    // picks, so a stalled upload fails with Playwright's own message rather than an unnamed test timeout.
  }, 30000);

  it('(p3) a file DELETED after picking stays listed; opening it shows "Couldn\'t read this file"', async () => {
    const { dir, file } = await diskFolder();
    await commands.diskFixture('append', `${dir}${sep}keep.md`, '# Keep\n\nStays on disk.\n');
    const { container } = await mountAndPick(dir);
    expect(treeNames(container).sort()).toEqual(['keep.md', 'notes.md']);
    await commands.diskFixture('remove', file);
    itemIn(container, 'keep.md').click();
    await pause(800);
    itemIn(container, 'notes.md').click();
    const state = await waitFor(() => container.querySelector<HTMLElement>('.peekover-app__reader [data-state="unreadable"]'));
    expect(state.textContent).toContain("Couldn't read this file");
    expect(treeNames(container).sort()).toEqual(['keep.md', 'notes.md']);
  }, 20000);

  it('(p4) after a reload the picked folder is remembered (Recent, "pick it again"), and reopening starts the picker', async () => {
    const name = `picker-p4-${Math.trunc(performance.now())}`;
    const dir = await commands.diskFixture('create', { [`${name}.md`]: BEFORE });
    cleanup.push(() => commands.diskFixture('remove', dir));
    const doc = `${name}.md`;
    const container = document.createElement('div');
    document.body.appendChild(container);
    // The REAL store (IndexedDB): what a reload would read back.
    const first = pickerOf(dir);
    const app = mountAppShell(container, { build: 'firefox', openFolder: first.openFolder });
    await app.openFolder();
    (await waitFor(() => container.querySelector<HTMLElement>('[role="treeitem"][data-kind="file"]'))).click();
    await pause(1000);
    container.remove();

    let pickerOpened = 0;
    const fresh = document.createElement('div');
    document.body.appendChild(fresh);
    cleanup.push(() => fresh.remove());
    mountAppShell(fresh, {
      build: 'firefox',
      openFolder: async () => {
        pickerOpened += 1;
        return { ok: false, reason: 'cancelled', message: 'No folder was opened.' } as never;
      },
    });
    const entry = await waitFor(
      () => [...fresh.querySelectorAll<HTMLButtonElement>('[data-reopen]')].find((b) => b.textContent?.includes(doc)) ?? null,
      5000,
    ).catch(() => null);
    expect(entry, 'the picked folder\'s file is listed under Recent after a reload').not.toBeNull();
    expect(entry!.dataset.reopen).toBe('repick');
    expect(entry!.textContent).toContain('click to pick it again');
    entry!.click();
    await waitFor(() => pickerOpened > 0);
    expect(pickerOpened).toBe(1);
  }, 20000);
});

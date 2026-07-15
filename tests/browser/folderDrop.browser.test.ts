// Group-4 follow-up — the REAL-ENGINE drag-and-drop folder proof. This is the property that
// FAILED at the Firefox manual gate: a folder dropped on the app page fell through to the
// browser's default navigate-to-folder action (Firefox showed its own file:// directory index)
// because the page never CLAIMED the drop. The fix wires a drop target that preventDefaults the
// event; these tests prove, in real Chromium AND real Firefox, that:
//
//   (1) a real `drop` / `dragover` DragEvent dispatched on the mounted shell has its browser
//       default PREVENTED — the handler owns the event (the manual-gate contract). RED-first:
//       before the wiring existed no listener claimed the event and defaultPrevented was false
//       (recorded in progress.md). Non-vacuous: the events are asserted `cancelable`, so a
//       preventDefault that never ran would leave defaultPrevented false and FAIL.
//   (2) a dropped folder is READ and RENDERED through that wiring — the injected drop seam runs
//       the REAL Entries-API adapter over REAL `File` bytes (only the OS drag, which cannot be
//       driven headlessly — Task 0, same class as the native picker — is stubbed by fabricating
//       the entry items), and the file renders via the unchanged M1 mount().
//   (3) the CAPABILITY-DOWNGRADE guard holds per engine: a Chromium drop takes the LIVE handle
//       path (persistable, with a handle) over a REAL OPFS directory, NOT the read-only snapshot;
//       a Firefox drop takes the read-only Entries snapshot (persistable:false, no handle).
//
// A synthetic dispatchEvent never triggers a browser's DEFAULT navigation in ANY engine (only a
// trusted OS drag would), so "the browser really did not navigate" stays a human-gate item — the
// manual note. What the real engine proves here beyond jsdom: the real DragEvent/DataTransfer
// types are handled, the real Entries adapter + walk + File.text() read run, and the real
// showDirectoryPicker/OPFS capabilities drive the downgrade branch.

import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { openFolderFromDrop, isDirectoryPickerSupported } from '../../src/app/folderSource';
import { folderSourceFromDataTransfer } from '../../src/app/firefoxFolderSource';
import { mountAppShell, type AppStore } from '../../src/app/appShell';
import type { FolderSource } from '../../src/app/folderSource';
import { READ_ONLY_SNAPSHOT_NOTE } from '../../src/app/firefoxFolderSource';

let seq = 0;
const nextName = () => `peekover-drop-${(seq += 1)}-${Math.trunc(performance.now())}`;

/** Poll until `fn()` is truthy — a fire-and-forget drop's async chain (read + mount) can take
 *  more than one macrotask in a real engine (mirrors folderGrant/firefoxFallback). */
async function waitFor<T>(fn: () => T | null | undefined, tries = 100): Promise<T> {
  for (let i = 0; i < tries; i += 1) {
    const v = fn();
    if (v) return v;
    await new Promise<void>((r) => setTimeout(r, 20));
  }
  throw new Error('waitFor timed out');
}

/** A capturing store so the appShell integration needs no IndexedDB assertions here. */
function fakeStore(): AppStore {
  return {
    putFolder: async () => undefined,
    deleteFolder: async () => undefined,
    putRecent: async () => undefined,
  };
}

// --- synthetic Entries-API drop items carrying REAL File bytes ------------------------------
// The OS drag can't be driven headlessly, so — exactly as firefoxFallback fabricates a File's
// `webkitRelativePath` — we fabricate the drop's entry tree. The one fabricated bit is the entry
// wrapper; every `file()` yields a REAL `File`, so File.text() and the walk are the real path.

function realFileEntry(name: string, text: string): FileSystemFileEntry {
  return {
    isFile: true,
    isDirectory: false,
    name,
    file: (ok: (f: File) => void) => ok(new File([text], name, { type: 'text/markdown' })),
  } as unknown as FileSystemFileEntry;
}

function dirEntry(name: string, batches: FileSystemEntry[][]): FileSystemDirectoryEntry {
  return {
    isFile: false,
    isDirectory: true,
    name,
    createReader: () => {
      let i = 0;
      return {
        readEntries: (ok: (e: FileSystemEntry[]) => void) =>
          ok(i < batches.length ? batches[i++] : []),
      };
    },
  } as unknown as FileSystemDirectoryEntry;
}

/** A DataTransfer whose single item drops the given directory entry (Firefox snapshot path). */
function dropWithEntry(entry: FileSystemEntry): DataTransfer {
  return {
    items: [{ kind: 'file', webkitGetAsEntry: () => entry }],
  } as unknown as DataTransfer;
}

/** A DataTransfer whose single item resolves to the given live handle (Chromium handle path). */
function dropWithHandle(handle: FileSystemHandle): DataTransfer {
  return {
    items: [{ kind: 'file', getAsFileSystemHandle: async () => handle }],
  } as unknown as DataTransfer;
}

// --- OPFS scaffolding for the Chromium live-handle branch (mirrors folderGrant.browser) -----

async function opfsRoot(): Promise<FileSystemDirectoryHandle | null> {
  try {
    return (await navigator.storage?.getDirectory?.()) ?? null;
  } catch {
    return null;
  }
}

async function writeFile(dir: FileSystemDirectoryHandle, name: string, text: string): Promise<void> {
  const fh = await dir.getFileHandle(name, { create: true });
  const w = await fh.createWritable();
  await w.write(text);
  await w.close();
}

/** The Chromium branch needs BOTH the picker capability AND real OPFS handle/iteration. */
async function detectChromiumHandleSupport(): Promise<boolean> {
  if (!isDirectoryPickerSupported()) return false;
  const root = await opfsRoot();
  if (!root) return false;
  const probe = `peekover-probe-${Math.trunc(performance.now())}`;
  try {
    const dir = await root.getDirectoryHandle(probe, { create: true });
    await writeFile(dir, 'x.md', '# x');
    const ok = typeof dir.values === 'function';
    await root.removeEntry(probe, { recursive: true });
    return ok;
  } catch {
    try {
      await root.removeEntry(probe, { recursive: true });
    } catch {
      /* ignore */
    }
    return false;
  }
}

let chromiumHandleSupported = false;
beforeAll(async () => {
  chromiumHandleSupported = await detectChromiumHandleSupport();
});

const created: string[] = [];
async function makeOpfsDir(): Promise<FileSystemDirectoryHandle> {
  const root = (await opfsRoot())!;
  const name = nextName();
  created.push(name);
  return root.getDirectoryHandle(name, { create: true });
}
afterEach(async () => {
  const root = await opfsRoot();
  if (!root) return;
  for (const name of created.splice(0)) {
    try {
      await root.removeEntry(name, { recursive: true });
    } catch {
      /* ignore */
    }
  }
});

describe('drag-and-drop folder target — the browser default is PREVENTED (the manual-gate bug)', () => {
  it('a real drop / dragover DragEvent on the shell has its default prevented — the handler owns the event', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    try {
      mountAppShell(container, {
        dropToOutcome: async () => ({ ok: false, reason: 'cancelled', message: 'Drop a folder to open it.' }),
        store: fakeStore(),
      });
      const shell = container.querySelector<HTMLElement>('.peekover-app')!;

      // dragover MUST be prevented, or the browser refuses the drop and no `drop` fires.
      const dragover = new DragEvent('dragover', {
        bubbles: true,
        cancelable: true,
        dataTransfer: new DataTransfer(),
      });
      shell.dispatchEvent(dragover);
      expect(dragover.cancelable).toBe(true); // non-vacuous: preventDefault is meaningful
      expect(dragover.defaultPrevented).toBe(true);

      // drop MUST be prevented FIRST — this is what stops the navigate-to-folder default.
      const drop = new DragEvent('drop', {
        bubbles: true,
        cancelable: true,
        dataTransfer: new DataTransfer(),
      });
      shell.dispatchEvent(drop);
      expect(drop.cancelable).toBe(true);
      expect(drop.defaultPrevented).toBe(true);
    } finally {
      container.remove();
    }
  });

  it('drives the FULL app-page flow on a dropped folder: real DragEvent → read → chip → note → tree → render', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    try {
      // The injected drop seam runs the REAL Entries adapter over REAL File bytes (engine-
      // agnostic — webkitGetAsEntry is fabricated, File.text() is real), so this proves the
      // read+render half on BOTH engines. persistable:false → the honest read-only note shows.
      const tree = dirEntry('notes', [[realFileEntry('hello.md', '# Notes render\n\nfrom a **dropped** folder')]]);
      const dropToOutcome = async (): Promise<{ ok: true; source: FolderSource }> => ({
        ok: true,
        source: await folderSourceFromDataTransfer(dropWithEntry(tree).items),
      });
      mountAppShell(container, { dropToOutcome, store: fakeStore() });
      const shell = container.querySelector<HTMLElement>('.peekover-app')!;

      const drop = new DragEvent('drop', {
        bubbles: true,
        cancelable: true,
        dataTransfer: new DataTransfer(),
      });
      shell.dispatchEvent(drop);
      // The real handler claimed the real DragEvent (navigation-prevent contract).
      expect(drop.defaultPrevented).toBe(true);

      // The drop's async chain paints the chip + honest note + walked tree (poll — fire-and-forget).
      const chip = await waitFor(() => container.querySelector('.peekover-app__chip'));
      expect(chip.textContent).toContain('granted:');
      const note = container.querySelector('[data-state="read-only-snapshot"]');
      expect(note?.textContent).toBe(READ_ONLY_SNAPSHOT_NOTE);
      const fileBtn = await waitFor(() =>
        container.querySelector<HTMLButtonElement>('[role="treeitem"][data-kind="file"]'),
      );
      expect(fileBtn.textContent).toBe('hello.md');

      // Select it → the reader renders the file's REAL content through the unchanged mount().
      fileBtn.click();
      const h1 = await waitFor(() =>
        container.querySelector('.peekover-app__reader__host')?.shadowRoot?.querySelector('h1'),
      );
      expect(h1.textContent).toContain('Notes render');
    } finally {
      container.remove();
    }
  });
});

describe('drag-and-drop folder target — the capability-downgrade guard (per engine)', () => {
  it('Chromium: a dropped folder yields a LIVE, persistable handle over real OPFS — NOT the snapshot', async () => {
    if (!chromiumHandleSupported) return; // Firefox / no-OPFS — the Chromium branch is not this engine's.

    const dir = await makeOpfsDir();
    await writeFile(dir, 'a.md', '# Real heading from a dropped handle');

    // The dropped item resolves to the REAL OPFS directory handle (the one fabricated bit is the
    // item wrapper; the handle, its enumeration, and the read are entirely real).
    const outcome = await openFolderFromDrop(dropWithHandle(dir));

    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      // NOT downgraded: a Chromium drop is a live folder, exactly like the picker grant.
      expect(outcome.source.persistable).toBe(true);
      expect(outcome.source.handle).toBeDefined();
      // …and the real bytes were read through the handle.
      expect(outcome.source.files.map((f) => f.name)).toContain('a.md');
      const a = outcome.source.files.find((f) => f.name === 'a.md')!;
      expect(await a.read()).toContain('Real heading');
    }
  });

  it('Firefox: a dropped folder yields a read-only Entries SNAPSHOT (persistable:false, no handle)', async () => {
    if (isDirectoryPickerSupported()) return; // Chromium prefers the handle path — tested above.

    const tree = dirEntry('repo', [[realFileEntry('a.md', '# A body from a snapshot')]]);
    const outcome = await openFolderFromDrop(dropWithEntry(tree));

    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      // The honest read-only snapshot — the cause of the platform-limitation note.
      expect(outcome.source.persistable).toBe(false);
      expect(outcome.source.handle).toBeUndefined();
      expect(outcome.source.files.map((f) => f.name)).toContain('a.md');
      const a = outcome.source.files.find((f) => f.name === 'a.md')!;
      expect(await a.read()).toContain('A body');
    }
  });

  it('the per-engine guards are not vacuously skipping BOTH branches everywhere', () => {
    // On Chromium the handle branch runs (chromiumHandleSupported true); on Firefox the snapshot
    // branch runs (isDirectoryPickerSupported false). This meta-assertion makes a total-skip
    // regression visible rather than reading as green.
    expect(chromiumHandleSupported || !isDirectoryPickerSupported()).toBe(true);
  });
});

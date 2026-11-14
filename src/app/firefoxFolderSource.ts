// firefoxFolderSource — the Firefox (and any picker-disabled engine) impl behind the
// `folderSource` seam. It fills the ELSE branch of the one feature-detect: where
// `showDirectoryPicker` is absent, there is no live directory handle to grant, so Peekover
// reads a READ-ONLY, POINT-IN-TIME SNAPSHOT of the folder instead. Spec 002 §4.1; plan.md
// §seam, §Chromium-vs-Firefox.
//
// WHY a snapshot, not live folder mode: the File System Access disk pickers
// (`showDirectoryPicker`) are Chromium-only and Mozilla declined them permanently (spec §6,
// research-verified). Firefox's two folder-read web APIs are both point-in-time:
//   • `<input type="file" webkitdirectory>` → a flat `FileList`, each `File` carrying a
//     `webkitRelativePath` (`root/dir/sub/file.md`) — the whole folder, materialized once.
//   • a folder DROP → `DataTransferItem.webkitGetAsEntry()` → the Entries API tree, walked
//     lazily via `createReader().readEntries()` (which caps at 100 entries/call — we loop).
// Neither yields a re-openable handle, so the resulting `FolderSource` is `persistable:false`
// with NO handle. That honesty bit is carried in the SHARED interface (not bolted on
// downstream): everything above the seam branches on `persistable`, never on the engine.
//
// REUSES THE WALK POLICY, re-implements NONE of it. Both input shapes are adapted into the
// SAME abstract `WalkDirNode` the pure `walkMarkdown` consumes, so the markdown-extension
// filter, the skip-list (node_modules / dotdirs), the file/depth CAP, and the cancel token
// all apply UNIFORMLY — a dropped `node_modules` is skipped and an over-cap folder reports
// `truncated`, exactly as on Chromium (spec 002 §3.1 acceptance; AGENTS.md #5). The only
// Firefox-specific code here is the two ADAPTERS (FileList→tree, Entries→tree); the walk is
// shared. The adapters' pure tree-shaping is jsdom-unit-testable; the engine-bound read is
// real-engine-tested (firefoxFallback.browser.test.ts) — the M1 pure/DOM/engine split.

import type { FolderSource, MarkdownFile, OpenFolderOptions } from './folderSource';
import {
  walkMarkdown,
  type WalkDirNode,
  type WalkFileNode,
} from './walkPolicy';

// The notes appShell showed for a snapshot folder (`READ_ONLY_SNAPSHOT_NOTE`, `DRAGGED_SNAPSHOT_NOTE`) lived here until
// 0.1.1; the notice redesign replaced them with the "Snapshot" line and its per-build, per-route popover
// (`snapshotNotice.ts`). Their measured clauses still hold: `tests/browser/firefoxDragWatch.browser.test.ts`.

// --- (A) the `<input webkitdirectory>` FileList adapter --------------------------
//
// A directory `<input>` returns a FLAT FileList the browser has already fully enumerated;
// each File's `webkitRelativePath` is `<pickedFolder>/<...>/<name>`. We fold that flat list
// into the abstract node tree the walk consumes — WITHOUT filtering (walkMarkdown owns every
// filter/skip/cap decision). The list is pre-materialized by the engine, so building the
// tree is a single linear pass over a finite list (no unbounded work, no hang), and the
// skip-list/markdown-filter/cap then bound what the walk actually collects.

/** A mutable directory used only while folding the FileList; converted to a `WalkDirNode`. */
interface RawDir {
  name: string;
  dirs: Map<string, RawDir>;
  files: { name: string; file: File }[];
}

/** Adapt a snapshot `File` into a pure `WalkFileNode` — its reader is `File.text()`. */
function fileNodeFromFile(name: string, file: File): WalkFileNode {
  return { kind: 'file', name, read: () => file.text() };
}

/** Convert a folded `RawDir` into the abstract `WalkDirNode` the walk drives (dirs then
 *  files; the walk applies the skip-list/filter/cap uniformly over these nodes). */
function walkNodeFromRaw(raw: RawDir): WalkDirNode {
  return {
    kind: 'directory',
    name: raw.name,
    children: async function* () {
      for (const dir of raw.dirs.values()) yield walkNodeFromRaw(dir);
      for (const f of raw.files) yield fileNodeFromFile(f.name, f.file);
    },
  };
}

/**
 * PURE: fold a directory `<input>`'s flat `FileList` into `{ name, root }`, where `name` is
 * the picked folder's own name (the shared leading `webkitRelativePath` segment) and `root`
 * is the abstract tree the walk descends. Paths inside the tree are RELATIVE to the picked
 * folder (the leading segment is stripped), so they match Chromium's handle-walk paths
 * exactly — the tree/reader above the seam cannot tell the engines apart. No filtering
 * happens here; that is entirely `walkMarkdown`'s job.
 */
export function rootFromFileList(files: ArrayLike<File>): { name: string; root: WalkDirNode } {
  const root: RawDir = { name: '', dirs: new Map(), files: [] };
  let folderName = '';

  for (let i = 0; i < files.length; i += 1) {
    const file = files[i];
    const rel = file.webkitRelativePath || file.name;
    const segments = rel.split('/').filter((s) => s.length > 0);
    if (segments.length === 0) continue; // defensive: an entry with no usable path
    // The leading segment is the picked folder's name (shared by every entry). A stray
    // single-segment entry (no webkitRelativePath) is treated as a root-level file.
    if (!folderName && segments.length > 1) folderName = segments[0];
    const inner = segments.length > 1 ? segments.slice(1) : segments;

    let dir = root;
    for (const seg of inner.slice(0, -1)) {
      let next = dir.dirs.get(seg);
      if (!next) {
        next = { name: seg, dirs: new Map(), files: [] };
        dir.dirs.set(seg, next);
      }
      dir = next;
    }
    dir.files.push({ name: inner[inner.length - 1], file });
  }

  return { name: folderName || 'Selected folder', root: walkNodeFromRaw(root) };
}

// --- (B) the folder-DROP Entries API adapter -------------------------------------
//
// A dropped folder surfaces as an Entries-API `FileSystemDirectoryEntry`. Its reader yields
// entries lazily and caps at 100 per `readEntries()` call, so we LOOP until an empty batch —
// hidden entirely behind the abstract `children()` iterator, so the walk never sees the
// paging (mirrors chromiumFolderSource's `values()` note). Recursion here only BUILDS nodes
// lazily; the walk decides what to descend, and its cap/depth bound a pathological drop.

/** Promisify `FileSystemDirectoryReader.readEntries` (one ≤100-entry batch). */
function readEntriesAsync(reader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> {
  return new Promise((resolve, reject) => reader.readEntries(resolve, reject));
}

/** Promisify `FileSystemFileEntry.file`. */
function fileFromEntry(entry: FileSystemFileEntry): Promise<File> {
  return new Promise((resolve, reject) => entry.file(resolve, reject));
}

/** Adapt an Entries-API file entry into a pure `WalkFileNode` (reader = `File.text()`). */
function fileNodeFromEntry(entry: FileSystemFileEntry): WalkFileNode {
  return {
    kind: 'file',
    name: entry.name,
    read: async () => (await fileFromEntry(entry)).text(),
  };
}

/** Adapt an Entries-API directory entry into a pure `WalkDirNode`, looping `readEntries`
 *  (the 100/call cap) behind the lazy `children()` iterator. */
function dirNodeFromEntry(entry: FileSystemDirectoryEntry): WalkDirNode {
  return {
    kind: 'directory',
    name: entry.name,
    children: async function* () {
      const reader = entry.createReader();
      for (;;) {
        const batch = await readEntriesAsync(reader);
        if (batch.length === 0) break; // an empty batch means the listing is exhausted
        for (const child of batch) {
          if (child.isDirectory) yield dirNodeFromEntry(child as FileSystemDirectoryEntry);
          else if (child.isFile) yield fileNodeFromEntry(child as FileSystemFileEntry);
        }
      }
    },
  };
}

/** Wrap a set of dropped Entries under `{ name, root }`. A single dropped folder is used as
 *  the root directly (so paths are relative to it); any other shape (loose files, several
 *  entries) folds under a synthetic root. */
function rootFromEntries(entries: FileSystemEntry[]): { name: string; root: WalkDirNode } {
  const dirs = entries.filter((e): e is FileSystemDirectoryEntry => e.isDirectory);
  if (entries.length === 1 && dirs.length === 1) {
    return { name: dirs[0].name, root: dirNodeFromEntry(dirs[0]) };
  }
  const root: WalkDirNode = {
    kind: 'directory',
    name: '',
    children: async function* () {
      for (const e of entries) {
        if (e.isDirectory) yield dirNodeFromEntry(e as FileSystemDirectoryEntry);
        else if (e.isFile) yield fileNodeFromEntry(e as FileSystemFileEntry);
      }
    },
  };
  return { name: 'Dropped folder', root };
}

// --- converge on the shared seam shape -------------------------------------------

/**
 * Build the read-only `FolderSource` from an adapted `{ name, root }`: run the SAME eager,
 * markdown-filtered, bounded, interruptible walk (walkPolicy) the Chromium impl runs, then
 * converge on the shared seam shape with `persistable:false` and NO handle — a snapshot that
 * cannot be reopened silently. `truncated` from the walk flows straight through, so a
 * pathological drop surfaces the "folder too large" state instead of hanging.
 */
async function snapshotSource(
  name: string,
  root: WalkDirNode,
  opts: OpenFolderOptions,
): Promise<FolderSource> {
  const { files, truncated } = await walkMarkdown(root, {
    limits: opts.limits,
    cancel: opts.cancel,
  });
  const markdownFiles: MarkdownFile[] = files.map((f) => ({
    path: f.path,
    name: f.name,
    read: f.read,
  }));
  return { name, files: markdownFiles, truncated, persistable: false };
}

/**
 * Build a read-only `FolderSource` from a directory `<input>`'s `FileList`. The real-engine
 * core the fallback proves: given a real FileList (native input OR a synthetic stand-in) the
 * whole fold→filter→bound→read path runs for real; only the OS chooser is bypassed.
 */
export function folderSourceFromFileList(
  files: ArrayLike<File>,
  opts: OpenFolderOptions = {},
): Promise<FolderSource> {
  const { name, root } = rootFromFileList(files);
  return snapshotSource(name, root, opts);
}

/**
 * Build a read-only `FolderSource` from a folder DROP's `DataTransferItem`s (via
 * `webkitGetAsEntry()`). Items with no entry (non-file drags) are ignored. Same shared walk,
 * same `persistable:false` snapshot.
 */
export function folderSourceFromDataTransfer(
  items: ArrayLike<DataTransferItem>,
  opts: OpenFolderOptions = {},
): Promise<FolderSource> {
  const entries: FileSystemEntry[] = [];
  for (let i = 0; i < items.length; i += 1) {
    const entry = items[i].webkitGetAsEntry?.();
    if (entry) entries.push(entry);
  }
  const { name, root } = rootFromEntries(entries);
  return snapshotSource(name, root, opts);
}

// --- the gesture-bound directory picker (the ONE headless-blind line) ------------

/**
 * Open the directory `<input webkitdirectory>` on a user gesture and resolve to its picked
 * `FileList`, or `null` if the user cancelled. This is the Firefox analogue of Chromium's
 * `pickDirectory` — the ONE line that cannot run headlessly (a file chooser cannot be driven
 * without a real user, exactly like the native picker; Task 0). Real-engine tests bypass it
 * and drive `folderSourceFromFileList` with a synthetic FileList; the live chooser is
 * confirmed at the human gate (6.3). Modern Firefox fires a `cancel` event on dismissal, so
 * a cancelled pick resolves cleanly to `null` (a designed never-blank outcome upstream).
 */
export function pickDirectoryFiles(doc: Document = document): Promise<FileList | null> {
  return new Promise((resolve) => {
    const input = doc.createElement('input');
    input.type = 'file';
    input.setAttribute('webkitdirectory', '');
    input.multiple = true;
    input.style.display = 'none';

    let settled = false;
    const finish = (value: FileList | null): void => {
      if (settled) return;
      settled = true;
      input.remove();
      resolve(value);
    };

    input.addEventListener('change', () => {
      finish(input.files && input.files.length > 0 ? input.files : null);
    });
    // Modern engines fire `cancel` when the chooser is dismissed with no selection.
    input.addEventListener('cancel', () => finish(null));

    doc.body.appendChild(input);
    input.click();
  });
}

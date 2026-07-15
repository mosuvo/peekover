// chromiumFolderSource — the Chromium engine impl behind the `folderSource` seam. THIN by
// design: it does exactly two things the pure layer can't — invoke the native picker, and
// ADAPT a real `FileSystemDirectoryHandle` into the abstract `WalkDirNode` the pure walk
// consumes. It re-implements NONE of the walk policy (filter / skip-list / cap / cancel):
// that all lives in walkPolicy.ts and is unit-tested there. Spec 002 §3.2.
//
// The split is what makes the jsdom-blind grant→walk→read path real-engine-testable: a
// test hands `folderSourceFromHandle` a real OPFS `FileSystemDirectoryHandle` (populated
// in-test) and the ENTIRE handle→enumerate→read path runs for real — only the OS chooser
// (`pickDirectory`) is stubbed out by not calling it (Task 0: the native dialog cannot be
// driven headlessly; OPFS is the same-engine, real-handle stand-in).
//
// Enumeration: a directory handle is async-iterable via `handle.values()`, which pages the
// listing internally — so the adapter yields entries lazily and the walk's bounded/
// interruptible policy applies uniformly. (The Firefox drag path's `readEntries()`
// 100-per-call cap is a group-4 concern; its adapter will loop readEntries behind the SAME
// `children()` iterator, so the walk never sees the difference.)

import type { FolderSource, MarkdownFile, OpenFolderOptions } from './folderSource';
import {
  walkMarkdown,
  type WalkDirNode,
  type WalkFileNode,
} from './walkPolicy';

/** The `window.showDirectoryPicker` shape (not in the standard DOM lib types yet). */
interface DirectoryPickerWindow {
  showDirectoryPicker(options?: {
    mode?: 'read' | 'readwrite';
  }): Promise<FileSystemDirectoryHandle>;
}

/**
 * Open the native directory picker (one user gesture → the OS folder dialog). Read-only
 * mode: Peekover never writes to the chosen folder. This is the ONE line that cannot run
 * headlessly (Task 0) — real-engine tests bypass it and drive `folderSourceFromHandle`
 * with an OPFS handle instead; the live picker is confirmed at the human gate (6.3).
 */
export function pickDirectory(win: Window = window): Promise<FileSystemDirectoryHandle> {
  return (win as unknown as DirectoryPickerWindow).showDirectoryPicker({ mode: 'read' });
}

/** Adapt a file handle into a pure `WalkFileNode` — its reader is `getFile().text()`. */
function fileNodeFromHandle(handle: FileSystemFileHandle): WalkFileNode {
  return {
    kind: 'file',
    name: handle.name,
    read: async () => (await handle.getFile()).text(),
  };
}

/**
 * Adapt a directory handle into a pure `WalkDirNode`. `children()` async-iterates the
 * handle's entries (the engine pages the listing internally) and wraps each as a pure
 * node — so the bounded/interruptible walk drives a real directory without ever importing
 * the engine. Recursion here only BUILDS nodes lazily; the walk decides what to descend.
 */
function dirNodeFromHandle(handle: FileSystemDirectoryHandle): WalkDirNode {
  return {
    kind: 'directory',
    name: handle.name,
    children: async function* () {
      // `values()` yields the base `FileSystemHandle`; `.kind` is the runtime discriminant
      // but the DOM lib doesn't narrow it to the subtypes, so cast per branch.
      for await (const entry of handle.values()) {
        yield entry.kind === 'directory'
          ? dirNodeFromHandle(entry as FileSystemDirectoryHandle)
          : fileNodeFromHandle(entry as FileSystemFileHandle);
      }
    },
  };
}

/**
 * Build a `FolderSource` from a granted directory handle: run the eager, markdown-filtered,
 * bounded, interruptible walk (walkPolicy) over the handle, then converge on the shared
 * seam shape with `persistable: true` and the handle attached (a capability ref for
 * persistence + one-gesture reopen — group 5 — never file contents).
 *
 * This is the real-engine-testable core: given a real handle (picker OR OPFS stand-in) the
 * whole enumerate→filter→bound→read path is exercised. `truncated` from the walk flows
 * straight through, so a pathological folder surfaces the "folder too large" state instead
 * of hanging (spec 002 §3.2 acceptance; AGENTS.md #5).
 */
export async function folderSourceFromHandle(
  handle: FileSystemDirectoryHandle,
  opts: OpenFolderOptions = {},
): Promise<FolderSource> {
  const { files, truncated } = await walkMarkdown(dirNodeFromHandle(handle), {
    limits: opts.limits,
    cancel: opts.cancel,
  });
  const markdownFiles: MarkdownFile[] = files.map((f) => ({
    path: f.path,
    name: f.name,
    read: f.read,
  }));
  return {
    name: handle.name,
    files: markdownFiles,
    truncated,
    persistable: true,
    handle,
  };
}

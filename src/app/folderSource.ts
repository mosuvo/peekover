// folderSource — THE SEAM. One feature-detect, one shared interface, and every module
// above it (tree, reader, recents/pins UI) is engine-agnostic. Spec 002 §seam.
//
// `openFolder()` is the single entry the app-page grant flow calls on a user gesture. It
// feature-detects `'showDirectoryPicker' in window` and routes to an engine impl that
// converges on the SAME `FolderSource → MarkdownFile[]` shape. Group 3 wires the Chromium
// impl (`chromiumFolderSource`); group 4 drops the Firefox `<input webkitdirectory>` /
// `webkitGetAsEntry` impl into the ELSE branch below WITHOUT reshaping anything above the
// seam — the read-only-snapshot limits are carried in the interface's `persistable`
// boolean (Chromium true + handle; Firefox false, no handle), not bolted on downstream.
//
// Every non-grant outcome is a DESIGNED result, never a throw the UI has to guess about
// (AGENTS.md #5): a cancelled picker, an unsupported engine, or an unexpected error each
// come back as a typed `{ ok: false, reason }` the app page turns into a never-blank
// state. The real cancel/deny behaviour on a real chooser is confirmed at the human gate
// (6.3) — headless engines cannot drive the native dialog (Task 0).

import type { WalkLimits, CancelToken } from './walkPolicy';
import { folderSourceFromHandle, pickDirectory } from './chromiumFolderSource';

/**
 * One markdown file inside an opened folder — the shared unit the tree and reader consume.
 * Structurally a superset of `readerPane`'s `ReaderFile` (it adds `path`), so a
 * `MarkdownFile` can be handed straight to the reader with no adapter.
 */
export interface MarkdownFile {
  /** Slash-separated path from the folder root, e.g. `docs/guide/intro.md`. */
  path: string;
  /** The file's own name, e.g. `intro.md`. */
  name: string;
  /** Read the file's raw markdown text. May reject (permission/IO) — the reader handles it. */
  read(): Promise<string>;
}

/**
 * An opened folder, engine-agnostic above the seam. `persistable` is the honesty bit:
 * Chromium sets it true and carries a structured-cloneable `handle` (a capability ref,
 * never file contents); Firefox (group 4) sets it false with no handle — a read-only
 * snapshot that cannot be reopened silently. `truncated` is the bounded-walk signal: true
 * iff the walk hit the cap, which the UI turns into the "folder too large" state.
 */
export interface FolderSource {
  /** Display name of the opened folder. */
  name: string;
  /** The eager, markdown-filtered, bounded walk result (walkPolicy). */
  files: MarkdownFile[];
  /** True iff the walk stopped at the cap — surface the "folder too large" state. */
  truncated: boolean;
  /** Chromium true (+ `handle`); Firefox false (read-only snapshot, no handle). */
  persistable: boolean;
  /** Present iff `persistable` — the directory handle, for persistence + one-gesture reopen. */
  handle?: FileSystemDirectoryHandle;
}

/** A designed, never-blank outcome of an open attempt. */
export type OpenFolderOutcome =
  | { ok: true; source: FolderSource }
  | { ok: false; reason: 'cancelled' | 'unsupported' | 'error'; message: string };

/** Options threaded down to the bounded walk (limits + a cancel token). */
export interface OpenFolderOptions {
  limits?: WalkLimits;
  cancel?: CancelToken;
}

/**
 * PURE feature-detect: does this engine expose the File System Access directory picker?
 * The one branch that decides Chromium-full-folder vs the Firefox read-only fallback. A
 * picker-disabled Chromium (Brave / flag-gated) reports false here and takes the SAME
 * fallback path as Firefox — no engine special-casing (plan.md spec-gate ruling).
 */
export function isDirectoryPickerSupported(win: Window = window): boolean {
  return typeof win !== 'undefined' && 'showDirectoryPicker' in win;
}

/** Is this the AbortError a cancelled native picker rejects with? */
function isAbort(err: unknown): boolean {
  return err instanceof DOMException ? err.name === 'AbortError' : false;
}

/**
 * The single grant entry the app page calls on a user gesture. Feature-detects the
 * engine, opens the native picker (Chromium) — the ONE gesture — then runs the eager,
 * markdown-filtered, bounded, interruptible walk (walkPolicy) and returns a `FolderSource`.
 * Never throws: a cancelled picker, an unsupported engine, or an error each return a typed
 * `{ ok: false }` the caller renders as a designed state.
 *
 * The native OS dialog cannot be driven headlessly (Task 0), so real-engine tests exercise
 * `folderSourceFromHandle` directly against a real OPFS handle (the handle/walk/read path
 * is real; only the OS dialog is stubbed). This entry's picker call is confirmed live at
 * the human gate.
 */
export async function openFolder(opts: OpenFolderOptions = {}): Promise<OpenFolderOutcome> {
  if (!isDirectoryPickerSupported()) {
    // Group 4 replaces this branch with the Firefox `<input webkitdirectory>` fallback +
    // its honest read-only-snapshot note. Until then, an honest designed state, not a hang.
    return {
      ok: false,
      reason: 'unsupported',
      message:
        'This browser cannot open a live folder yet. A read-only folder snapshot for Firefox arrives next.',
    };
  }
  try {
    const handle = await pickDirectory();
    const source = await folderSourceFromHandle(handle, opts);
    return { ok: true, source };
  } catch (err) {
    if (isAbort(err)) {
      return { ok: false, reason: 'cancelled', message: 'No folder was opened.' };
    }
    return {
      ok: false,
      reason: 'error',
      message: 'Could not open that folder. Please try again.',
    };
  }
}

// reopen — the one-gesture RE-GRANT mechanism for a rehydrated folder handle. Spec 002 §5.1.
//
// The persistence narrative, made concrete and HONEST: a granted directory handle is a
// structured-cloneable capability ref that `store` persists (appShell already writes it on
// grant). Next session `getAll('folders')` rehydrates the handle — but a rehydrated handle
// reports permission `prompt`, NOT `granted`: the browser does not silently restore folder
// access across a reload. Regaining access requires `requestPermission()` on a user gesture.
//
// Re-ask-on-use is the DEFAULT and a TRUST feature, not friction: "nothing is granted
// silently." So this module's gate is deliberate:
//   query → if already `granted`, proceed and DO NOT re-prompt (honor the browser's own
//           "allow on every visit" if the user chose it; never nudge toward it) ;
//         → else request() on the gesture; if the user grants, proceed; if not, we STOP —
//           we never read a byte of the folder without a live grant.
// The gate is upstream of every read: `reopenFromHandle` calls the walk ONLY after a
// `granted` state, so a denied/prompt handle never has its contents touched (the
// "nothing granted silently" property, observable at the mechanism level).
//
// TEST-HONESTY SPLIT (decision 4, carried verbatim): the automated test proves this
// query→request→gate MECHANISM via a controllable-permission handle (and runs the real walk
// against an OPFS handle). But OPFS handles always report `granted`, so the actual disk
// `prompt`-after-reload / `NotAllowedError` GROUND TRUTH is NOT automatable — it is verified
// at the human gate (6.3) + platform docs. No stub here masquerades as platform proof.
//
// THIN engine seam (M1 pure/DOM/engine split): this only orchestrates the permission API +
// the existing `folderSourceFromHandle` walk. Both are injectable so the gate is unit- and
// real-engine-testable without a native re-prompt (which cannot be driven headlessly, Task 0).

import type { FolderSource, OpenFolderOptions, OpenFolderOutcome } from './folderSource';
import { folderSourceFromHandle } from './chromiumFolderSource';

/**
 * The File System Access permission surface a directory handle exposes (not in the standard
 * DOM lib types yet). Both methods are optional: some engines/handles (e.g. OPFS on engines
 * without the permissions extension) omit them, in which case there is nothing to re-prompt.
 */
export interface PermissionCapableHandle {
  queryPermission?(descriptor?: { mode?: 'read' | 'readwrite' }): Promise<PermissionState>;
  requestPermission?(descriptor?: { mode?: 'read' | 'readwrite' }): Promise<PermissionState>;
}

/**
 * The query→request→gate mechanism. Returns the resulting read-permission state:
 *   - `queryPermission` already `granted` → return `granted`, WITHOUT calling
 *     `requestPermission` (honor an existing grant; never re-nudge). This is the "allow on
 *     every visit" path — if the user told the browser to remember, we don't ask again.
 *   - otherwise → `requestPermission({mode:'read'})` on the caller's user gesture and return
 *     whatever it resolves to (`granted` if the user allows, else `prompt`/`denied`).
 *   - a handle with no permission API → treated as `granted` (OPFS and engines lacking the
 *     extension have no separate re-prompt; the disk ground truth is the human gate).
 *
 * Must be called synchronously enough within a user gesture that transient activation is
 * still live when `requestPermission` fires (one `await queryPermission` is well within the
 * activation window). Never throws for a missing method; a thrown query/request propagates to
 * the caller, which turns it into a designed never-blank outcome.
 */
export async function ensureReadPermission(handle: PermissionCapableHandle): Promise<PermissionState> {
  if (typeof handle.queryPermission !== 'function') {
    // No permission API to interrogate: nothing to re-prompt (OPFS/older engines). The real
    // disk prompt is the human gate; here there is no gate to apply, so proceed.
    return 'granted';
  }
  const current = await handle.queryPermission({ mode: 'read' });
  if (current === 'granted') return 'granted';
  if (typeof handle.requestPermission !== 'function') return current;
  // The ONE gesture: re-ask on use. This is where the native disk re-prompt actually shows.
  return handle.requestPermission({ mode: 'read' });
}

/** Injectable seams so the gate is testable without a native re-prompt or a real walk. */
export interface ReopenDeps {
  /** The permission gate (default `ensureReadPermission`). */
  ensure?: (handle: PermissionCapableHandle) => Promise<PermissionState>;
  /** The walk over a granted handle (default the unchanged Chromium `folderSourceFromHandle`). */
  walk?: (handle: FileSystemDirectoryHandle, opts: OpenFolderOptions) => Promise<FolderSource>;
}

/**
 * Re-open a rehydrated directory handle as ONE gesture → a designed `OpenFolderOutcome` the
 * app page funnels through the SAME `applyOutcome`/`paintGranted` path the picker uses (no
 * duplicated grant/store/reader wiring). The flow:
 *   1. gate: `ensureReadPermission` (query→request). If the result is not `granted`, return a
 *      designed `denied` outcome — and CRUCIALLY the walk is never called, so not a single
 *      byte of the folder is read without a live grant ("nothing granted silently").
 *   2. walk: only on `granted`, run the eager bounded markdown walk. If it rejects (the folder
 *      moved / was removed / a read failed after grant), return a designed `error` outcome —
 *      never a blank page or a hang (AGENTS.md #5).
 *
 * Never throws: every failure mode is a typed `{ ok:false }` the caller renders as a
 * never-blank state (a denied re-prompt returns to the re-ask affordance, not a dead end).
 */
export async function reopenFromHandle(
  handle: FileSystemDirectoryHandle,
  opts: OpenFolderOptions = {},
  deps: ReopenDeps = {},
): Promise<OpenFolderOutcome> {
  const ensure = deps.ensure ?? ensureReadPermission;
  const walk = deps.walk ?? folderSourceFromHandle;

  let state: PermissionState;
  try {
    state = await ensure(handle as unknown as PermissionCapableHandle);
  } catch {
    return {
      ok: false,
      reason: 'error',
      message: 'Could not check access to this folder. Please try again.',
    };
  }

  if (state !== 'granted') {
    // The gate held: no walk, no read. Re-ask remains available (a designed affordance).
    return {
      ok: false,
      reason: 'denied',
      message: 'Access to this folder wasn’t granted. Click it again to re-allow it.',
    };
  }

  try {
    const source = await walk(handle, opts);
    return { ok: true, source };
  } catch {
    // Granted, but the folder couldn't be walked — it may have moved or been removed since it
    // was remembered. A designed never-blank state, never a hang.
    return {
      ok: false,
      reason: 'error',
      message: 'That folder couldn’t be reopened — it may have moved or been removed.',
    };
  }
}

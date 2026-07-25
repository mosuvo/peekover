// captureFlag — the live, in-memory mirror of the D-12 snapshot-capture setting (task 1.5).
//
// D-12 makes the capture off-switch its OWN settings ROW (`store.getCaptureEnabled` /
// `setCaptureEnabled`), read by key so `getSettings()` is untouched (plan §4-1's trap). But the
// PERSISTED flag lives in IndexedDB, and `watchController.renderNow` is synchronous — it cannot
// await an IDB read on the hot capture path without inflating the cost-proportional cooldown. So
// this module holds a synchronous cache of the flag that the controller reads AT RENDER TIME:
//
//   • `appShell` LOADS the persisted flag into the cache on mount (`store.getCaptureEnabled`),
//     and WRITES both the cache (`setCaptureFlag`) and the store (`store.setCaptureEnabled`) when
//     the storage-panel toggle changes — so the next render honours the new value immediately.
//   • `watchController` READS the cache (`getCaptureFlag`) at its capture-check. That read fires
//     on every render, so toggling capture off stops capture on the NEXT render (task 1.5 verify).
//
// Deliberately DEPENDENCY-FREE (no `store`, no DOM): the controller reads a plain boolean and the
// content-script bundle gains nothing. Persistence + the IDB row live in `store.ts`; this is the
// seam between them, mirroring the module-level register-once holders the reader already uses
// (`watchRegistry.ts:4-16`). Default ON matches `getCaptureEnabled`'s read-with-default, so a
// controller that renders before the load resolves captures (the safe default), not silently off.

/** The live cache. Default ON — mirrors `store.getCaptureEnabled`'s read-with-default so an
 *  unloaded cache and a wiped/absent row read the same (capture on). */
let captureFlag = true;

/** The current snapshot-capture flag, SYNCHRONOUS. Read by `watchController.renderNow` at the
 *  capture-check on every render, so a toggle takes effect on the next render (task 1.5). */
export function getCaptureFlag(): boolean {
  return captureFlag;
}

/** Update the live cache. Called by `appShell` when it loads the persisted flag on mount and when
 *  the storage-panel toggle changes (alongside `store.setCaptureEnabled`, which persists it). */
export function setCaptureFlag(enabled: boolean): void {
  captureFlag = enabled;
}

/** TEST SEAM: restore the default (on) so one test's toggle cannot leak into the next. Not used in
 *  production paths — the module-level cache is process-lived and would otherwise carry across the
 *  serial browser files that share one page. */
export function resetCaptureFlagForTest(): void {
  captureFlag = true;
}

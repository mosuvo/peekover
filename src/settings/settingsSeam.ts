// settingsSeam — the ONE module-level seam through which deep-in-the-render-tree UI reads the
// persisted settings and writes changes back, without importing a SettingsPort or the store.
//
// ── WHY THIS EXISTS AT ALL (the standing constraint, unchanged since group 3) ────────────────
//
// The SettingsPort is built by the CONTEXT (content script -> messagingPort, app page ->
// directPort) and deliberately never threaded into the render path. Threading it would reshape
// four-to-five signatures across TWO call chains for one callback:
//   content script:  entrypoint -> runReader -> mountReader -> mount -> the consumer
//   app page:        main -> mountAppShell -> createReaderPane -> mount -> the consumer
// Groups 3, 4 and 5 each faced this and each chose a module seam instead. This module is that
// seam, generalized.
//
// ── WHY GENERALIZED RATHER THAN DUPLICATED (task 6.1, decision D-E = (b)) ────────────────────
//
// Group 5 built the write half for the theme control as `registerThemeSaveSink` in
// themeControl.ts. Group 6 needs the same thing for the TOC, and the choice was to add a second
// theme-shaped seam or to generalize the first. Generalized, for three reasons read off the code:
//
//   1. The group-5 sink was ALREADY general. Its type is `(patch: Partial<Settings>) => void` —
//      nothing in it is theme-specific; it was only NAMED for theme because theme was its first
//      and only consumer.
//   2. Under a second seam, both entrypoints would register the SAME `port.save` function TWICE,
//      into two module globals, and every future settings consumer would add a third. The
//      duplication compounds; the generalization is paid once.
//   3. The TOC additionally needs a READ half (the persisted `tocOpen`/`tocWidth` at build time,
//      plus notification when they arrive late). That read half is literally a `Settings` value,
//      so it belongs with the settings vocabulary — not bolted onto a theme module.
//
// ── WHAT IS DELIBERATELY *NOT* MOVED HERE ───────────────────────────────────────────────────
//
// The theme's READ half stays in `src/theme/reader.ts` (`currentThemeSetting` /
// `onThemeSettingChange`), and that is not an oversight. Those report the theme runtime's APPLIED
// state — the value `setThemeSetting` broadcast through the host registry — which is a rendering
// concern, not a persistence cache. They can legitimately diverge: an OS flip under `auto`
// changes what paints while the persisted setting is untouched. Collapsing them would conflate
// "what is stored" with "what is painting", the exact distinction decision D-B was written to
// preserve. So this seam owns STORED settings; reader.ts owns APPLIED theme.
//
// `themeControl.ts` therefore keeps exporting `registerThemeSaveSink` / `resetThemeSaveSinkForTest`
// as thin delegates to this module, so group 5's tests and call sites are untouched by the move.
//
// ── THE TWO WRITE DIRECTIONS ARE DISTINCT, AND THAT IS LOAD-BEARING (decision D-G) ───────────
//
// `publishSettings` = "the store told us what is persisted" -> updates the snapshot AND NOTIFIES.
// `saveSettings`    = "the user changed something here"     -> updates the snapshot and forwards
//                      to the sink, but does NOT notify.
//
// If `saveSettings` notified, a consumer that both saves on change and restores on notification
// would re-apply (and could re-save) its own write one turn later — a pointless round trip and a
// live echo/race with a genuinely late-arriving `load()`. Separating them makes "restored" and
// "user changed it" different code paths by construction rather than by a suppression flag.

import { DEFAULT_SETTINGS, type Settings } from './settings';

/** What a consumer needs from a SettingsPort: persist a patch. Deliberately narrower than the
 *  port itself, so a context hands over ONE function and no consumer ever sees the store. */
export type SaveSettings = (patch: Partial<Settings>) => void;

let sink: SaveSettings | null = null;

/** The last known PERSISTED settings. Starts at the defaults so a consumer built before `load()`
 *  resolves always reads a coherent value (never `undefined`, never a throw) — the same
 *  never-blank posture `SettingsPort.snapshot()` has. */
let snapshot: Settings = DEFAULT_SETTINGS;

/** Notified ONLY by `publishSettings` (see the header note on why `saveSettings` is silent). */
const listeners = new Set<(settings: Settings) => void>();

/**
 * Register the context's persistence sink — called ONCE per context by whoever owns the port:
 * the content script with `messagingPort(...).save`, the app page with `directPort(store).save`.
 * Last registration wins (a context has exactly one settings port). Registering is OPTIONAL: an
 * unregistered context still APPLIES changes, it just does not persist them. Never a throw on a
 * UI path.
 */
export function registerSettingsSink(save: SaveSettings): void {
  sink = save;
}

/**
 * The current persisted settings as last known. SYNCHRONOUS and it never throws — before `load()`
 * has resolved this is `DEFAULT_SETTINGS`, whose `tocOpen`/`tocWidth` are `null`, i.e. "not set,
 * fall back to the 003 width-derived behaviour". That `null` is the regression guard: a consumer
 * reading this at build time on a cold start gets exactly the pre-004 default, and the real value
 * arrives via `onSettingsChange`.
 */
export function currentSettings(): Settings {
  return snapshot;
}

/**
 * The store's answer arrived (the entrypoints' `load().then(...)`). Replace the snapshot and
 * NOTIFY, so consumers already built against the defaults can restore the real state.
 *
 * On a cold start this is the PRIMARY path, not an edge case: group 4 measured the settings
 * landing after the mount commits, so a TOC rail is normally built against `null`s and corrected
 * here one turn later.
 */
export function publishSettings(settings: Settings): void {
  snapshot = settings;
  for (const listener of listeners) listener(snapshot);
}

/**
 * A consumer changed a setting. Updates the snapshot IMMEDIATELY (so a subsequent read — or a
 * re-render — sees the new value rather than the stale stored one) and forwards to the sink.
 *
 * Deliberately does NOT notify: the caller has already applied the change to its own DOM, and
 * notifying would loop it straight back through the restore path (decision D-G). Best-effort by
 * construction — no sink is a no-op, and `SettingsPort.save` swallows persistence failures, so a
 * dead background can never break a user action.
 */
export function saveSettings(patch: Partial<Settings>): void {
  snapshot = { ...snapshot, ...patch };
  sink?.(patch);
}

/** Subscribe to PUBLISHED settings (see `publishSettings`). Returns an unsubscribe. Callers that
 *  outlive a render must prune themselves rather than adding one listener per view — see
 *  tocView.ts and themeControl.ts, which each subscribe ONCE at module level and prune their live
 *  nodes by `isConnected` (the themeRegistry liveness pattern). */
export function onSettingsChange(listener: (settings: Settings) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Test-only: forget the sink and reset the snapshot to the defaults, so suites do not leak state
 *  into one another. Same family of seam as store.ts's `__resetConnectionForTest`.
 *
 *  It deliberately does NOT clear `listeners`. Consumers subscribe ONCE at module level behind a
 *  `subscribed` boolean (tocView's `ensureSubscribed`), so dropping the listener here would leave
 *  that flag true and the consumer permanently deaf for the rest of the file's tests — a reset
 *  that breaks what it is meant to isolate. The subscriptions are permanent by design and prune
 *  their own dead nodes; there is nothing to leak. */
export function resetSettingsSeamForTest(): void {
  sink = null;
  snapshot = DEFAULT_SETTINGS;
}

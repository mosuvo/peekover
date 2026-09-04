// settings — the CANONICAL, surface-agnostic reader-settings vocabulary (spec 004).
//
// This module is the one owner of the settings *shape* and the pure theme-resolution rule.
// It is deliberately dependency-free: no DOM, no engine, no `store` import, no `#imports`.
// That keeps it unit-testable in plain node and importable from every layer without pulling a
// browser API — the persistence layer (`src/app/store.ts`), the port seam
// (`src/settings/settingsPort.ts`), the theme runtime (group 3), and the background handler all
// speak this vocabulary rather than redefining it.
//
// History note: task 1.1 first defined `Settings`/`DEFAULT_SETTINGS` inside `store.ts` (the
// store landed before this module existed). Group 2 consolidates them HERE — `store.ts` now
// imports and re-exports them, so there is exactly ONE definition and existing callers that
// import from `store.ts` are unaffected (see store.ts's re-export block).

/** A concrete, paintable theme — what actually lands on `data-theme`. `sepia` is carried in the
 *  type even though it is DEFERRED from the 004 UI (D-1 = A): the runtime is written
 *  surface-neutral to it, so re-activating sepia later is additive and needs no shape change. */
export type EffectiveTheme = 'light' | 'dark' | 'sepia';

/** A theme *setting* — what the user picks. `auto` follows the OS; the rest are manual and pin
 *  the theme regardless of the OS (spec §4). Superset of {@link EffectiveTheme} by `auto`. */
export type ThemeSetting = 'auto' | EffectiveTheme;

/**
 * The persisted reading preferences (spec 004) — a single global row's worth of state, keyed
 * in the store by SETTINGS_ID (persistence concern, kept in `store.ts`). `tocOpen`/`tocWidth`
 * are the 003 per-view TOC state promoted to persistence; `null` means "not set — fall back to
 * the 003 width-derived default" (never confuse `false`/`0` with "unset"). `codeTheme` is the
 * 009 D-9 fourth field — a Shiki theme id, independent of {@link ThemeSetting} (spec 009 §4:
 * "changing one shall never change the other"). `lastExportFormat` is the 010 D-6 fifth field —
 * the export panel row key (`'html' | 'copy-html' | 'copy-plain-text' | 'copy-rich-text' | 'pdf'`)
 * most recently used, read by the Ctrl/Cmd+S shortcut (task 8.1) to re-invoke the same export;
 * kept as a plain `string` (not a union) so the panel's own row keys stay the one place that
 * vocabulary is spelled, per `exportControls.ts`'s `RowSpec.key`.
 */
export interface Settings {
  theme: ThemeSetting;
  tocOpen: boolean | null;
  tocWidth: number | null;
  codeTheme: string;
  lastExportFormat: string | null;
}

/** The default reading preferences: Auto theme, TOC state unset (defer to the 003 width-derived
 *  behavior). `codeTheme` is `'github-dark'` — M-4a's CHOSEN default (`decisions.md` 2026-08-19 ·
 *  M9 8.5: sits mid-table on WCAG contrast against all three `readerCss.ts` `--code-bg` values;
 *  kept as shipped), not a placeholder. `lastExportFormat` is `'html'` — Ruling M-1 (`decisions.md`
 *  2026-09-04 · M10 10.4), the first-ever-Ctrl+S default: the walk-gate that D-6 left this null
 *  pending on has ruled, so the CHOSEN value is wired here rather than left placeholder. Used
 *  before anything is stored, after a wipe, and as the never-blank fallback when a settings read
 *  fails or times out (spec §4). */
export const DEFAULT_SETTINGS: Settings = {
  theme: 'auto',
  tocOpen: null,
  tocWidth: null,
  codeTheme: 'github-dark',
  lastExportFormat: 'html',
};

/**
 * Resolve a theme *setting* to the concrete {@link EffectiveTheme} that paints (spec §4). PURE —
 * no `matchMedia`, no DOM: the caller passes the current OS dark-ness (`osDark`) so this stays a
 * total, testable function of (setting × OS).
 *
 * - `auto`  → follows the OS: `osDark ? 'dark' : 'light'`.
 * - manual (`light`/`dark`/`sepia`) → itself; a manual choice IGNORES the OS entirely (the §4
 *   "manual wins over auto" rule) — the `osDark` argument is not consulted.
 */
export function resolveTheme(setting: ThemeSetting, osDark: boolean): EffectiveTheme {
  if (setting === 'auto') return osDark ? 'dark' : 'light';
  return setting;
}

/**
 * The surface-agnostic settings boundary both reader surfaces reach through (plan §1.2). One
 * injected interface, so `mount()`/`tocView()`/the theme runtime never import `store` directly —
 * they get a port and stay surface-neutral + jsdom-testable. Two implementations exist
 * (`src/settings/settingsPort.ts`): `directPort` (extension-origin contexts read the DB
 * straight) and `messagingPort` (content-script contexts message the background).
 */
export interface SettingsPort {
  /** The current cached value — SYNCHRONOUS and it NEVER throws. Returns {@link DEFAULT_SETTINGS}
   *  before `load()` has resolved, so a caller always has a coherent value to paint (never-blank). */
  snapshot(): Settings;
  /** Resolve the persisted value and update the cache. Bounded by a short timeout: on timeout,
   *  transport failure, or a store error it resolves to {@link DEFAULT_SETTINGS} rather than
   *  hanging — a dead background can never stall a caller (spec §4). */
  load(): Promise<Settings>;
  /** Persist a patch (best-effort). Updates the cache IMMEDIATELY so the UI is responsive, then
   *  persists; a persistence failure is swallowed (the in-memory choice still applies this view). */
  save(patch: Partial<Settings>): Promise<void>;
}

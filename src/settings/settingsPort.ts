// settingsPort — the two SettingsPort implementations + the message contract + the background
// handler (plan §1.2). This module is the surface-agnostic messaging SEAM: it names the message
// types once, builds the client ports (direct + messaging), and builds the background listener
// that answers them — so the wire protocol has a single source of truth and never drifts.
//
// Dependency-free like `settings.ts`: no `#imports`, no `store` import, no DOM. Every browser
// dependency is INJECTED (a transport function into `messagingPort`, a store-ish object into
// `directPort` and the handler), so both ports and the handler are unit-testable with fakes and
// provable against the real engine in the browser project. The entrypoints supply the real deps:
//   - content script → `messagingPort(msg => browser.runtime.sendMessage(msg))`
//   - background      → `createSettingsListener({ getSettings, putSettings })` from store.ts
//   - app page        → `directPort(store)` (group 5 wires this; the port is built here now)

import { DEFAULT_SETTINGS, type Settings, type SettingsPort } from './settings';

// --- the wire contract (named ONCE) -----------------------------------------------

/** Content→background request: read the persisted settings. */
export const GET_SETTINGS = 'peekover:getSettings' as const;
/** Content→background request: persist a settings patch. */
export const SET_SETTINGS = 'peekover:setSettings' as const;

export interface GetSettingsMessage {
  type: typeof GET_SETTINGS;
}
export interface SetSettingsMessage {
  type: typeof SET_SETTINGS;
  patch: Partial<Settings>;
}
/** The messages this seam speaks. Anything else on the channel is not ours (the handler passes). */
export type SettingsMessage = GetSettingsMessage | SetSettingsMessage;

/** The store surface the direct port and the background handler both need — a subset of
 *  `store.ts` (injected, so tests use a fake and the real engine uses the real store). */
export interface SettingsStoreApi {
  getSettings(): Promise<Settings>;
  putSettings(patch: Partial<Settings>): Promise<void>;
}

/** The transport `messagingPort` wraps — `browser.runtime.sendMessage`, injected. Resolves with
 *  the background's response (a `Settings` for get, anything for set), or rejects on failure. */
export type SettingsMessenger = (message: SettingsMessage) => Promise<unknown>;

/**
 * How long `load()` waits before falling back to {@link DEFAULT_SETTINGS} (spec §4 never-blank).
 *
 * PROVISIONAL — task 4.1 RE-TUNES this from the flash measurement (warm/cold service worker,
 * both engines); it is deliberately NOT an asserted acceptance threshold (M1 "no un-measured
 * threshold" rule). Chosen bound + rationale: comfortably below runReader's 3 s never-blank
 * safety floor (so a dead/asleep background degrades to Auto with >1 s of margin before the floor
 * reveals raw), yet generously above a typical MV3 service-worker cold start + one IndexedDB read
 * (a few hundred ms) so a slow-but-ALIVE background is not spuriously abandoned to the default.
 */
export const LOAD_TIMEOUT_MS = 1500;

// --- helpers ----------------------------------------------------------------------

/** Race a promise against a timeout. Resolves to the promise's value on success, or to
 *  `onTimeout()` on EITHER a timeout OR a rejection — it never rejects, so callers cannot hang
 *  or throw. (Remove this wrapper and a hanging transport hangs `load()` forever, a rejecting one
 *  throws — the red-first failure modes the tests exercise.) */
function withTimeout<T>(promise: Promise<T>, ms: number, onTimeout: () => T): Promise<T> {
  return new Promise<T>((resolve) => {
    let settled = false;
    const finish = (value: T) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(value);
    };
    const timer = setTimeout(() => finish(onTimeout()), ms);
    promise.then(finish, () => finish(onTimeout()));
  });
}

/** Coerce an untrusted transport response into a well-formed {@link Settings}, filling any
 *  missing/garbled field from the default. Messaging structured-clones the value, and a broken
 *  or absent background yields `undefined` — this guarantees `load()` always resolves a complete
 *  Settings rather than propagating a partial shape. */
function coerceSettings(value: unknown): Settings {
  if (!value || typeof value !== 'object') return { ...DEFAULT_SETTINGS };
  const v = value as Partial<Settings>;
  return {
    theme: v.theme ?? DEFAULT_SETTINGS.theme,
    tocOpen: v.tocOpen === undefined ? DEFAULT_SETTINGS.tocOpen : v.tocOpen,
    tocWidth: v.tocWidth === undefined ? DEFAULT_SETTINGS.tocWidth : v.tocWidth,
  };
}

/**
 * Build a SettingsPort over a `loadOnce`/`saveOnce` pair, adding the shared cross-cutting
 * behavior every port needs (plan §1.2): a synchronous cached `snapshot()` that starts at the
 * default and never throws, a `load()` bounded by {@link LOAD_TIMEOUT_MS} that resolves to the
 * default on timeout/failure, and a `save()` that updates the cache IMMEDIATELY (responsive UI)
 * before best-effort persistence.
 */
function makeCachedPort(
  loadOnce: () => Promise<Settings>,
  saveOnce: (patch: Partial<Settings>) => Promise<void>,
): SettingsPort {
  let cache: Settings = { ...DEFAULT_SETTINGS };
  return {
    snapshot: () => cache,
    async load() {
      // load() is a startup call (before any save), so overwriting the cache with the loaded
      // value — or the default on failure — is correct: it reflects exactly what persistence knew.
      cache = await withTimeout(loadOnce(), LOAD_TIMEOUT_MS, () => ({ ...DEFAULT_SETTINGS }));
      return cache;
    },
    async save(patch) {
      cache = { ...cache, ...patch }; // apply now so the current view responds without a round-trip
      try {
        await saveOnce(patch);
      } catch {
        // best-effort: a persistence failure must not throw on the UI path — the in-memory choice
        // still governs this view; a later load may or may not see it, but nothing blanks/hangs.
      }
    },
  };
}

// --- the client ports -------------------------------------------------------------

/** Extension-origin port (app page): read/write the store DIRECTLY — no messaging (plan §1.2). */
export function directPort(store: SettingsStoreApi): SettingsPort {
  return makeCachedPort(
    () => store.getSettings(),
    (patch) => store.putSettings(patch),
  );
}

/** Content-script port: the reader's own origin cannot see the extension DB, so it reaches
 *  settings by MESSAGING the background (plan §1.2). `send` is `browser.runtime.sendMessage`. */
export function messagingPort(send: SettingsMessenger): SettingsPort {
  return makeCachedPort(
    async () => coerceSettings(await send({ type: GET_SETTINGS })),
    async (patch) => {
      await send({ type: SET_SETTINGS, patch });
    },
  );
}

// --- the background handler (server side) ------------------------------------------

/** True iff `m` is one of this seam's messages. A foreign message returns false so the listener
 *  passes it through (a renamed/misrouted type fails this guard — the 2.3 red-first case). */
function isSettingsMessage(m: unknown): m is SettingsMessage {
  if (!m || typeof m !== 'object') return false;
  const type = (m as { type?: unknown }).type;
  return type === GET_SETTINGS || type === SET_SETTINGS;
}

/**
 * The pure dispatch half of the background handler: resolve `getSettings` to the stored value,
 * apply `setSettings` and acknowledge. Returns `undefined` for a message that is NOT ours, so the
 * caller can decline it (letting any other listener handle it, and — in the real runtime — not
 * hijacking the response channel). Injected `store` = the real store in production, a fake in tests.
 */
export function handleSettingsMessage(
  message: unknown,
  store: SettingsStoreApi,
): Promise<Settings | { ok: true }> | undefined {
  if (!isSettingsMessage(message)) return undefined;
  if (message.type === GET_SETTINGS) return store.getSettings();
  return store.putSettings(message.patch).then(() => ({ ok: true as const }));
}

/** A response callback (`sendResponse`), typed without pulling a `#imports` dependency in. */
type SendResponse = (response?: unknown) => void;

/**
 * Build the `runtime.onMessage` listener the background registers (wired in
 * `entrypoints/background.ts`, task 2.3). This owns the CROSS-ENGINE async-response contract:
 * WXT's `browser` is the NATIVE `chrome.*`/`browser.*` namespace (not the webextension-polyfill),
 * and native Chrome does NOT honor a Promise returned from an onMessage listener — you must call
 * `sendResponse` later and `return true` to hold the channel open. Firefox honors both, so
 * `return true` + async `sendResponse` is the common denominator that works on BOTH engines.
 * A non-settings message returns `false` (this listener declines it) rather than `true`, so it
 * never leaves a response channel dangling.
 */
export function createSettingsListener(
  store: SettingsStoreApi,
): (message: unknown, sender: unknown, sendResponse: SendResponse) => boolean {
  return (message, _sender, sendResponse) => {
    const result = handleSettingsMessage(message, store);
    if (!result) return false; // not ours — decline, let other listeners (if any) respond
    result.then(
      (value) => sendResponse(value),
      () => sendResponse(undefined), // a store error → undefined → the client falls back to default
    );
    return true; // async response coming via sendResponse (Chrome requires this; Firefox honors it)
  };
}

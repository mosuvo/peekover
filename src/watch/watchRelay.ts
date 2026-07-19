// watchRelay — the `WATCH_READ` wire contract, its URL validation, and the background handler
// that answers it (task 2.1, plan §1.5).
//
// ── Why a relay exists at all ────────────────────────────────────────────────────────────────
//
// A content script runs in the PAGE's origin. On a `file:///…/notes.md` document that origin is
// opaque, and `fetch(location.href)` from it is not a reliable way to re-read the file. The
// BACKGROUND can read `file://` (Chromium, with the user's "Allow access to file URLs" toggle;
// Firefox is task 2.3's open question). So the content script asks the background for fresh bytes
// and the background answers — one request, one response, no state.
//
// **The background is a STATELESS fetch proxy; the watch loop lives in the PAGE.** That is what
// dissolves spec §7-6 (MV3 service-worker teardown): there is no long-lived background timer or
// registry to lose when the worker is evicted, and the watch dies with the tab that owns it, which
// is the correct lifetime. A relay that held the loop would have to survive teardown; this one has
// nothing to survive.
//
// ── Why the shape is copied VERBATIM from `createSettingsListener` ───────────────────────────
//
// `settingsPort.ts` already owns the cross-engine async-response contract, and this module is the
// SECOND listener on the SAME channel. WXT ships the NATIVE `chrome.*`/`browser.*` namespace, not
// webextension-polyfill, and native Chrome does NOT honor a Promise returned from an `onMessage`
// listener — you must call `sendResponse` later and `return true` to hold the channel open.
// Firefox honors both, so `return true` + async `sendResponse` is the common denominator.
//
// The `false` return for a foreign message is equally load-bearing and is what lets the two
// listeners COEXIST: every registered listener sees every message, so this one must DECLINE the
// settings messages (and anything else) rather than claim them. Returning `true` for a message it
// will never answer would leave that response channel dangling until the port closes, which the
// settings client would observe as a failed round trip.
//
// Dependency-free like `settingsPort.ts` and `changeDetector.ts`: no `#imports`, no DOM, no engine.
// The `read` fn is INJECTED, so this is unit-testable with a fake and the entrypoint supplies the
// real one.

/** Content→background request: re-read this local file and return its current text. */
export const WATCH_READ = 'peekover:watchRead' as const;

export interface WatchReadMessage {
  type: typeof WATCH_READ;
  url: string;
}

/** The messages this seam speaks. Anything else on the channel is not ours (the handler declines). */
export type WatchMessage = WatchReadMessage;

/** The relay's response. A failure is DATA, never a rejection — see `handleWatchMessage`. */
export type WatchReadResponse = { ok: true; text: string } | { ok: false; error: string };

/** The read the background injects: URL → the file's current text. Rejects if it cannot read. */
export type WatchReader = (url: string) => Promise<string>;

/**
 * The markdown extensions the relay will read.
 *
 * **This list MUST stay identical to the `file:///*.EXT` patterns in
 * `entrypoints/peekover.content.ts`'s `matches`.** It is duplicated rather than imported because
 * this module is deliberately `#imports`-free (the entrypoint pulls WXT's virtual module, which
 * cannot load in a unit test) and because `matches` are host patterns, not extensions. The
 * duplication is DRIFT-PINNED by a test that reads the entrypoint source and asserts the two agree,
 * so adding a pattern there without adding it here fails the suite rather than silently shipping a
 * surface the relay refuses to serve.
 */
export const WATCHABLE_EXTENSIONS = [
  '.md',
  '.mkd',
  '.mdx',
  '.markdown',
  '.mdown',
  '.mkdn',
  '.mdwn',
  '.mdtxt',
  '.mdtext',
] as const;

/**
 * True iff `url` is a `file://` URL naming one of {@link WATCHABLE_EXTENSIONS}.
 *
 * ── This is DEFENCE IN DEPTH and it is not optional ──────────────────────────────────────────
 *
 * The content script can only run on the manifest's `matches`, so in the intended flow every URL
 * arriving here is already one of these. But `runtime.onMessage` is reachable from ANY context the
 * extension talks to, and a compromised or injected page context could send whatever it liked. An
 * unvalidated relay is a general-purpose FILE-READ ORACLE: send `{url: 'file:///C:/Users/…/…'}`,
 * get the bytes back. Narrowing to the surface the content script actually serves costs nothing
 * and removes that entirely.
 *
 * Checks, and why each is shaped the way it is:
 *  - The URL must PARSE. A malformed string is rejected, not passed through to `read`.
 *  - `protocol === 'file:'` excludes `http:`/`https:` (which would make this a network proxy and
 *    breach AGENTS.md #1 from the one context that has no network indicator), and equally `data:`,
 *    `blob:`, `chrome-extension:`/`moz-extension:` (which would let a page read the extension's own
 *    packaged resources).
 *  - The extension test runs on `pathname`, NOT `href`, so a query string or fragment cannot smuggle
 *    a fake extension onto a URL whose real path is something else (`file:///etc/passwd?x=.md`).
 *  - `pathname` stays PERCENT-ENCODED and is matched raw. `%2Emd` therefore does NOT satisfy `.md`.
 *    That is deliberately STRICTER than the manifest's own matching, which is the safe direction:
 *    the worst case is refusing to watch an oddly-encoded path, not reading one we shouldn't.
 */
export function isWatchableFileUrl(url: unknown): url is string {
  if (typeof url !== 'string') return false;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== 'file:') return false;
  const path = parsed.pathname.toLowerCase();
  return WATCHABLE_EXTENSIONS.some((ext) => path.endsWith(ext));
}

/** True iff `m` is one of this seam's messages. A foreign message returns false so the listener
 *  declines it and the settings listener still gets its turn. */
function isWatchMessage(m: unknown): m is WatchMessage {
  if (!m || typeof m !== 'object') return false;
  return (m as { type?: unknown }).type === WATCH_READ;
}

/**
 * The pure dispatch half of the relay. Returns `undefined` for a message that is NOT ours, so the
 * caller can decline it; otherwise a promise that ALWAYS RESOLVES to a {@link WatchReadResponse}.
 *
 * **It never rejects, by construction.** A rejected promise here would mean `sendResponse` is never
 * called, and the content script's `sendMessage` would hang until the port closed — a watch loop
 * whose read never settles stops ticking silently (`pollingDetector` schedules the next poll only
 * once the previous read has SETTLED). A failure travels as `{ok: false, error}` instead, which the
 * caller can turn into a rejected read and the controller can turn into task 4.3's designed dead
 * state.
 *
 * **Validation happens BEFORE `read` is called, not after.** Rejecting a bad URL after reading it
 * would still have read it — the bytes would have been off disk and in this process. The guarantee
 * worth having is that `read` is never invoked at all, and that is what the tests assert.
 */
export function handleWatchMessage(
  message: unknown,
  read: WatchReader,
): Promise<WatchReadResponse> | undefined {
  if (!isWatchMessage(message)) return undefined;
  if (!isWatchableFileUrl(message.url)) {
    return Promise.resolve({ ok: false, error: 'refused: not a watchable file:// markdown URL' });
  }
  return read(message.url).then(
    (text) => ({ ok: true as const, text }),
    (cause: unknown) => ({ ok: false as const, error: describeError(cause) }),
  );
}

/** A failure reason safe to put on the wire: the message if there is one, else a stable fallback.
 *  Never the Error object itself — messaging structured-clones, and an Error's own fields do not
 *  survive that intact on every engine. */
function describeError(cause: unknown): string {
  if (cause instanceof Error && cause.message) return cause.message;
  if (typeof cause === 'string' && cause) return cause;
  return 'read failed';
}

/** A response callback (`sendResponse`), typed without pulling a `#imports` dependency in. */
type SendResponse = (response?: unknown) => void;

/**
 * Build the second `runtime.onMessage` listener the background registers (wired beside
 * `createSettingsListener` in `entrypoints/background.ts`, task 2.2).
 *
 * Same contract as `createSettingsListener`, for the same engine reasons — see this file's header:
 * `false` for a message that is not ours (so the settings listener still receives it and no
 * response channel is left dangling), `true` + async `sendResponse` for ours.
 */
export function createWatchListener(
  read: WatchReader,
): (message: unknown, sender: unknown, sendResponse: SendResponse) => boolean {
  return (message, _sender, sendResponse) => {
    const result = handleWatchMessage(message, read);
    if (!result) return false; // not ours — decline, let the settings listener respond
    result.then(
      (response) => sendResponse(response),
      // Unreachable by construction (handleWatchMessage never rejects), but a listener that could
      // drop sendResponse on an unforeseen throw would hang the caller — so it is answered anyway.
      () => sendResponse({ ok: false, error: 'read failed' } satisfies WatchReadResponse),
    );
    return true; // async response coming via sendResponse (Chrome requires this; Firefox honors it)
  };
}

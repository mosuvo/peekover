// Task 2.1 — the WATCH_READ contract, its URL validation, and the listener's engine contract.
//
// jsdom/unit is the RIGHT level for this file and the honest limit is worth stating: this proves
// the handler as a PURE FUNCTION with an injected `read`. It cannot prove the real
// content→background transport, because no test harness in this repo loads an extension —
// `runtime.sendMessage` has no receiving end in `tests/browser` either. That round trip is task
// 7.1's NAMED human-gate item, and nothing here should be read as covering it.
//
// What IS fully provable here, and is the whole point of the task: `read` is never invoked for a
// URL the relay should refuse, and a foreign message is DECLINED rather than claimed.

import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  WATCH_READ,
  WATCHABLE_EXTENSIONS,
  createWatchListener,
  handleWatchMessage,
  isWatchableFileUrl,
  type WatchReadResponse,
} from './watchRelay';

const GOOD_URL = 'file:///C:/Users/dev/notes.md';

/** A `read` that records every call, so "was it invoked at all" is assertable — the distinction
 *  the whole validation guarantee rests on. */
function fakeRead(impl: (url: string) => Promise<string> = async () => 'hello') {
  return vi.fn(impl);
}

/** Drive the listener and resolve with what it passed to `sendResponse`, plus what it RETURNED
 *  (the engine contract: true = "I will answer", false = "not mine"). */
function invoke(
  listener: ReturnType<typeof createWatchListener>,
  message: unknown,
): { returned: boolean; response: Promise<unknown> } {
  let resolve!: (v: unknown) => void;
  const response = new Promise<unknown>((r) => {
    resolve = r;
  });
  const returned = listener(message, {}, resolve);
  return { returned, response };
}

describe('isWatchableFileUrl — the file-read-oracle guard', () => {
  it('accepts a file:// URL for every extension the content script matches', () => {
    for (const ext of WATCHABLE_EXTENSIONS) {
      expect(isWatchableFileUrl(`file:///home/dev/doc${ext}`), ext).toBe(true);
    }
  });

  it('rejects every non-file scheme', () => {
    for (const url of [
      'http://example.com/notes.md',
      'https://example.com/notes.md',
      'data:text/markdown,# hi',
      'chrome-extension://abcdef/notes.md',
      'moz-extension://abcdef/notes.md',
      'blob:https://example.com/1234',
    ]) {
      expect(isWatchableFileUrl(url), url).toBe(false);
    }
  });

  it('rejects a file:// URL whose extension is not markdown', () => {
    for (const url of [
      'file:///etc/passwd',
      'file:///C:/Users/dev/.ssh/id_rsa',
      'file:///C:/Users/dev/notes.txt',
      'file:///C:/Users/dev/notes.md.exe',
      'file:///C:/Users/dev/notes.mdz',
    ]) {
      expect(isWatchableFileUrl(url), url).toBe(false);
    }
  });

  it('reads the PATH, so a query or fragment cannot smuggle a fake extension', () => {
    expect(isWatchableFileUrl('file:///etc/passwd?x=.md')).toBe(false);
    expect(isWatchableFileUrl('file:///etc/passwd#.md')).toBe(false);
    // …and the genuine article still passes with a query attached.
    expect(isWatchableFileUrl('file:///home/dev/notes.md?v=2')).toBe(true);
  });

  it('rejects unparseable and non-string input rather than passing it through', () => {
    for (const value of ['', 'not a url', '/plain/path.md', null, undefined, 42, {}]) {
      expect(isWatchableFileUrl(value), String(value)).toBe(false);
    }
  });
});

describe('handleWatchMessage — validation happens BEFORE read', () => {
  it('round-trips a valid file:// markdown URL through the injected read', async () => {
    const read = fakeRead(async () => '# fresh bytes');
    const result = await handleWatchMessage({ type: WATCH_READ, url: GOOD_URL }, read);

    expect(result).toEqual({ ok: true, text: '# fresh bytes' });
    expect(read).toHaveBeenCalledExactlyOnceWith(GOOD_URL);
  });

  // THE CORE GUARANTEE. Rejecting AFTER reading would still have read the file — the bytes would
  // have left the disk. So this asserts the fake was NEVER INVOKED, not merely that ok===false.
  it.each([
    ['http', 'http://example.com/notes.md'],
    ['https', 'https://example.com/notes.md'],
    ['data', 'data:text/markdown,# hi'],
    ['chrome-extension', 'chrome-extension://abcdef/notes.md'],
    ['non-markdown file', 'file:///etc/passwd'],
    ['markdown-ish file', 'file:///C:/Users/dev/secrets.txt'],
  ])('refuses a %s URL WITHOUT CALLING read at all', async (_label, url) => {
    const read = fakeRead();
    const result = (await handleWatchMessage({ type: WATCH_READ, url }, read)) as WatchReadResponse;

    expect(result.ok).toBe(false);
    expect(read, 'read was invoked for a URL the relay must refuse').not.toHaveBeenCalled();
  });

  it('declines a foreign message with undefined (so the caller can pass)', async () => {
    const read = fakeRead();
    for (const message of [
      { type: 'peekover:getSettings' },
      { type: 'peekover:setSettings', patch: {} },
      { type: 'peekover:watchReadX', url: GOOD_URL },
      { url: GOOD_URL },
      null,
      'watchRead',
    ]) {
      expect(handleWatchMessage(message, read), JSON.stringify(message)).toBeUndefined();
    }
    expect(read).not.toHaveBeenCalled();
  });

  it('turns a rejecting read into {ok:false} data — it never rejects', async () => {
    const read = fakeRead(async () => {
      throw new Error('NotFoundError: the file is gone');
    });
    const result = (await handleWatchMessage(
      { type: WATCH_READ, url: GOOD_URL },
      read,
    )) as WatchReadResponse;

    expect(result.ok).toBe(false);
    expect(result.ok === false && result.error).toBe('NotFoundError: the file is gone');
  });
});

describe('createWatchListener — the cross-engine async-response contract', () => {
  // Copied verbatim from createSettingsListener, and load-bearing: WXT ships the NATIVE namespace,
  // so native Chrome ignores a returned Promise and needs `true` + a later sendResponse.
  it('returns TRUE for its own message and answers via sendResponse', async () => {
    const listener = createWatchListener(fakeRead(async () => 'body'));
    const { returned, response } = invoke(listener, { type: WATCH_READ, url: GOOD_URL });

    expect(returned).toBe(true);
    await expect(response).resolves.toEqual({ ok: true, text: 'body' });
  });

  // The other half of coexistence: the settings listener is registered on the SAME channel and
  // sees the SAME messages. Claiming one it will never answer dangles that response channel.
  it('returns FALSE — not true — for a foreign message, so the settings listener still gets it', () => {
    const listener = createWatchListener(fakeRead());
    expect(invoke(listener, { type: 'peekover:getSettings' }).returned).toBe(false);
    expect(invoke(listener, { type: 'peekover:setSettings', patch: {} }).returned).toBe(false);
    expect(invoke(listener, { hello: 'world' }).returned).toBe(false);
  });

  it('answers a REFUSED url rather than leaving the channel open', async () => {
    const read = fakeRead();
    const listener = createWatchListener(read);
    const { returned, response } = invoke(listener, {
      type: WATCH_READ,
      url: 'http://example.com/notes.md',
    });

    expect(returned).toBe(true); // it is ours; it is answered, with a refusal
    await expect(response).resolves.toMatchObject({ ok: false });
    expect(read).not.toHaveBeenCalled();
  });

  it('answers a FAILING read rather than hanging the channel', async () => {
    const listener = createWatchListener(
      fakeRead(async () => {
        throw new Error('permission revoked');
      }),
    );
    const { response } = invoke(listener, { type: WATCH_READ, url: GOOD_URL });

    await expect(response).resolves.toEqual({ ok: false, error: 'permission revoked' });
  });
});

// ── The drift pin for the duplicated extension list ─────────────────────────────────────────
//
// WATCHABLE_EXTENSIONS is hand-kept in sync with the entrypoint's `matches`, because watchRelay.ts
// is deliberately `#imports`-free and cannot import the entrypoint. Reading the source as TEXT
// gives a real pin with no import: add a `file:///*.EXT` pattern without adding the extension here
// (or vice versa) and this fails, instead of shipping a surface the relay silently refuses.
describe('WATCHABLE_EXTENSIONS stays in sync with the content script matches', () => {
  it('matches the file:// patterns declared in entrypoints/peekover.content.ts', () => {
    const source = readFileSync(
      new URL('../../entrypoints/peekover.content.ts', import.meta.url),
      'utf8',
    );
    const declared = [...source.matchAll(/'file:\/\/\/\*(\.[a-z]+)'/g)].map((m) => m[1]);

    expect(declared.length, 'no file:// match patterns found — did the entrypoint change?').toBe(
      WATCHABLE_EXTENSIONS.length,
    );
    expect([...declared].sort()).toEqual([...WATCHABLE_EXTENSIONS].sort());
  });
});

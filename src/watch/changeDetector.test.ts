// Task 1.1 — `pollingDetector`, unit-tested with a FAKE `read` (the dep is injected exactly so
// this needs no engine, no DOM and no file). Pure loop logic, so jsdom would add nothing.
//
// ── THE LOAD-BEARING TEST IN THIS FILE, AND WHY IT LOOKS ODD ─────────────────────────────────
//
// "a changed text fires once" uses two texts of the SAME LENGTH — `'alpha one'` / `'alpha two'`,
// nine characters each — and asserts that length equality explicitly before using them.
//
// That is not decoration. It is the mechanical encoding of decisions.md 2026-07-19 TRAP 2: on
// Firefox's drag path `size`/`lastModified` are FROZEN AT DROP TIME, so an implementation that
// compares a metadata stand-in instead of the content would silently never fire in production.
// The only metadata stand-in reachable through an injected `() => Promise<string>` is
// `text.length` — a `size` proxy — so equal-length-but-different texts are precisely the input
// that separates a content compare from a size compare. Both this test and the
// identical-content test go RED against a `text.length` comparison; a naive
// different-length fixture would leave the mutant green (recorded red-first in progress.md).
//
// The real-engine half of detection (the observer path, its dead-record branches) is task 1.2's
// `tests/browser/watchDetector.browser.test.ts` — this file deliberately proves only the loop.

import { describe, it, expect, vi, afterEach } from 'vitest';
import { pollingDetector } from './changeDetector';

const INTERVAL = 1000;

/** Advance exactly one poll interval, flushing the read promise chain in between. */
const tick = (times = 1) => vi.advanceTimersByTimeAsync(INTERVAL * times);

/** A `read` that walks a script of texts, repeating the last one forever, counting its calls. */
function scriptedRead(texts: string[]) {
  let i = 0;
  const fn = vi.fn(async () => texts[Math.min(i++, texts.length - 1)]);
  return fn;
}

/** A `read` whose every call is resolved/rejected by the test, so a read can be held IN FLIGHT
 *  across a `stop()` — the case a scripted read cannot express. */
function deferredRead() {
  const pending: { resolve: (t: string) => void; reject: (e: unknown) => void }[] = [];
  const fn = vi.fn(
    () =>
      new Promise<string>((resolve, reject) => {
        pending.push({ resolve, reject });
      }),
  );
  return { fn, pending };
}

/** Let Node surface any unhandled rejection. `setImmediate` is deliberately NOT faked below, so
 *  this is a genuine turn of the real event loop rather than a fake-timer no-op. */
const realTurn = () => new Promise<void>((r) => setImmediate(r));

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

/** Only the timer functions the detector uses are faked — `setImmediate`/microtasks stay REAL so
 *  the unhandled-rejection assertion below is measuring the actual event loop. */
const useTimers = () => vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });

describe('pollingDetector — compares CONTENT, never metadata', () => {
  it('fires cb ONCE with the new text when the content changes (same-length texts: a size compare fails here)', async () => {
    useTimers();
    const before = 'alpha one';
    const after = 'alpha two';
    // The mutation guard, asserted rather than assumed: if these ever stop being equal-length,
    // this test silently stops discriminating a content compare from a size compare.
    expect(after.length).toBe(before.length);

    const read = scriptedRead([before, after]);
    const cb = vi.fn();
    const detector = pollingDetector(read, INTERVAL);
    detector.start(cb);

    await tick(); // baseline read — deliberately silent
    expect(cb).not.toHaveBeenCalled();

    await tick(); // content changed
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith(after);

    // and it does not re-fire while the content stays put
    await tick(5);
    expect(cb).toHaveBeenCalledTimes(1);

    detector.stop();
  });

  it('fires NOTHING when every read returns identical content', async () => {
    useTimers();
    const read = scriptedRead(['# unchanged\n\nbody']);
    const cb = vi.fn();
    const detector = pollingDetector(read, INTERVAL);
    detector.start(cb);

    await tick(8);

    expect(read.mock.calls.length).toBeGreaterThan(1); // non-vacuous: the loop DID run
    expect(cb).not.toHaveBeenCalled();

    detector.stop();
  });
});

describe('pollingDetector — lifecycle', () => {
  it('stop() halts the loop: no further READS occur, not merely no callbacks', async () => {
    useTimers();
    const read = scriptedRead(['a', 'b', 'c', 'd', 'e', 'f']);
    const cb = vi.fn();
    const detector = pollingDetector(read, INTERVAL);
    detector.start(cb);

    await tick(3);
    const readsAtStop = read.mock.calls.length;
    expect(readsAtStop).toBe(3); // non-vacuous: the instrument was live before stop

    detector.stop();
    await tick(10);

    expect(read.mock.calls.length).toBe(readsAtStop);
  });

  it('does not deliver a read that was IN FLIGHT when stop() was called', async () => {
    useTimers();
    const { fn, pending } = deferredRead();
    const cb = vi.fn();
    const detector = pollingDetector(fn, INTERVAL);
    detector.start(cb);

    await tick();
    pending[0].resolve('baseline'); // establish the baseline
    await realTurn();

    await tick(); // second read starts and is held in flight
    expect(pending).toHaveLength(2);

    detector.stop();
    pending[1].resolve('CHANGED AFTER STOP');
    await realTurn();
    await tick(3);

    expect(cb).not.toHaveBeenCalled();
  });

  it('start() twice does not run two loops', async () => {
    useTimers();
    const read = scriptedRead(['x']);
    const detector = pollingDetector(read, INTERVAL);
    detector.start(vi.fn());
    detector.start(vi.fn());

    await tick(3);

    expect(read.mock.calls.length).toBe(3); // one loop, not two
    detector.stop();
  });
});

describe('pollingDetector — a failing read is transient, not fatal', () => {
  it('a REJECTING read neither kills the loop nor raises an unhandled rejection', async () => {
    useTimers();
    const unhandled: unknown[] = [];
    const onUnhandled = (reason: unknown) => unhandled.push(reason);
    process.on('unhandledRejection', onUnhandled);

    try {
      let call = 0;
      const read = vi.fn(async () => {
        call += 1;
        if (call <= 3) throw new Error('ENOENT: file is mid-rewrite');
        return call === 4 ? 'recovered' : 'recovered and then some';
      });
      const cb = vi.fn();
      const detector = pollingDetector(read, INTERVAL);
      detector.start(cb);

      await tick(3); // three consecutive failures
      await realTurn();
      expect(cb).not.toHaveBeenCalled();
      expect(read.mock.calls.length).toBe(3); // the loop SURVIVED every failure

      await tick(); // call 4 succeeds -> becomes the baseline (nothing seen before it)
      expect(cb).not.toHaveBeenCalled();

      await tick(); // call 5 differs from the baseline -> fires
      expect(cb).toHaveBeenCalledTimes(1);
      expect(cb).toHaveBeenCalledWith('recovered and then some');

      detector.stop();
      await realTurn();
      expect(unhandled).toEqual([]);
    } finally {
      process.off('unhandledRejection', onUnhandled);
    }
  });

  it('a THROWING callback does not kill the loop or raise an unhandled rejection', async () => {
    useTimers();
    const unhandled: unknown[] = [];
    const onUnhandled = (reason: unknown) => unhandled.push(reason);
    process.on('unhandledRejection', onUnhandled);

    try {
      const read = scriptedRead(['one', 'two', 'three']);
      const cb = vi.fn(() => {
        throw new Error('consumer blew up');
      });
      const detector = pollingDetector(read, INTERVAL);
      detector.start(cb);

      await tick(); // baseline 'one'
      await tick(); // 'two' -> fires, cb throws
      expect(cb).toHaveBeenCalledTimes(1);

      await tick(); // 'three' -> the loop is still alive and still detecting
      expect(cb).toHaveBeenCalledTimes(2);
      expect(cb).toHaveBeenLastCalledWith('three');

      detector.stop();
      await realTurn();
      expect(unhandled).toEqual([]);
    } finally {
      process.off('unhandledRejection', onUnhandled);
    }
  });
});

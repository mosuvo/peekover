// Task 1.2 — `observerDetector`, proven in the REAL ENGINE against a REAL `FileSystemObserver`
// over a REAL OPFS file handle. jsdom has neither OPFS nor `FileSystemObserver`, so none of this
// is expressible in the unit project; the polled sibling is unit-tested in
// `src/watch/changeDetector.test.ts`.
//
// ── WHAT THIS FILE PROVES, AND — SAID PLAINLY — WHAT IT DOES NOT ─────────────────────────────
//
// **OPFS IS NOT LOCAL DISK.** What is proven here is the WIRING and the dead-record ladder:
// `observe()` on a real file handle → a real `["modified"]` record from a real write →
// `getFile().text()` → `cb`; `stop()`/`disconnect()` genuinely ending delivery; and the
// `errored`/`disappeared` branches re-observing, degrading to polling, or surfacing the designed
// dead state.
//
// It does **NOT** prove that Chromium's observer fires for a **LOCAL-DISK** file rewritten by an
// external agent. That is a different storage backend with different OS-level change
// notification. **That property was established by the task-0 probe on real disk** (decisions.md
// 2026-07-19: `observe(fileHandle)` accepted, callbacks with `type:"modified"` for both
// `echo >>` appends and editor saves, surviving 10+ minutes idle) **and it is re-walked at the
// milestone-close human gate (7.1)**. Do not read this file as full coverage of the observer
// path — the harness loads no extension and has no file picker, so a local-disk handle cannot be
// obtained here at all.
//
// ── WHY THE DEAD-RECORD TESTS SYNTHESISE THEIR RECORD ────────────────────────────────────────
//
// No test can make a real engine emit `errored` or `disappeared` on demand — the probe never saw
// either across 10+ minutes of real edits. So the suite wraps the **REAL** `FileSystemObserver`
// in a constructor that also captures the callback, and invokes that callback with a fabricated
// record. Everything downstream is production code running for real: the real ladder, a real
// `getFile()` readability check, a real re-`observe()`, and a real polling fallback over a real
// OPFS write. **Only the record is fabricated**, because only the record is unreachable.
//
// ── THE ENGINE GATE IS ASSERTED, NOT SILENT ──────────────────────────────────────────────────
//
// Firefox 151 has **no `FileSystemObserver`** (OPFS itself works fine), so the observer suite
// cannot run there — and Firefox never takes the observer path in production either: it has no
// directory picker and no observer, so it polls (spec §3.2). Rather than let the suite quietly
// vanish on one engine, the FIRST describe below RUNS ON BOTH ENGINES and asserts the *reason*:
// on Firefox it proves OPFS is present and the observer is absent, so the skip is provably about
// the engine's capability and not about a broken harness. If Firefox ever ships
// `FileSystemObserver`, that test goes RED and the real suite starts running.

import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import {
  observerDetector,
  globalObserverCtor,
  type FileSystemObserverCtor,
  type FileSystemObserverCallback,
  type FileSystemObserverLike,
  type FileSystemChangeRecord,
  type DeadReason,
} from '../../src/watch/observerDetector';

const HAS_OBSERVER = typeof globalObserverCtor() === 'function';

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Poll until `fn()` is truthy, or give up. Observer callbacks and OPFS writes are both async in
 *  a real engine, so every positive assertion here waits rather than sampling once. */
async function waitFor<T>(fn: () => T | null | undefined | false, tries = 150): Promise<T> {
  for (let i = 0; i < tries; i += 1) {
    const v = fn();
    if (v) return v as T;
    await sleep(20);
  }
  throw new Error('waitFor timed out');
}

async function opfsRoot(): Promise<FileSystemDirectoryHandle | null> {
  try {
    return (await navigator.storage?.getDirectory?.()) ?? null;
  } catch {
    return null;
  }
}

let seq = 0;
const nextName = () => `peekover-watch-${(seq += 1)}-${Math.trunc(performance.now())}.md`;

let dir: FileSystemDirectoryHandle;
const madeFiles: string[] = [];

/** Create an OPFS file with `text` and return its handle. */
async function makeFile(text: string): Promise<FileSystemFileHandle> {
  const name = nextName();
  madeFiles.push(name);
  const fh = await dir.getFileHandle(name, { create: true });
  await writeFile(fh, text);
  return fh;
}

async function writeFile(fh: FileSystemFileHandle, text: string): Promise<void> {
  const w = await fh.createWritable();
  await w.write(text);
  await w.close();
}

/**
 * A constructor that wraps the REAL `FileSystemObserver` while capturing the callback, so a test
 * can hand the production handler a record the engine will not produce on demand. The observation
 * itself is entirely real — `observe()` and `disconnect()` go straight through.
 */
function capturingCtor(sink: CaptureSink): FileSystemObserverCtor {
  const Real = globalObserverCtor() as FileSystemObserverCtor;
  return class CapturingObserver implements FileSystemObserverLike {
    private readonly inner: FileSystemObserverLike;
    constructor(cb: FileSystemObserverCallback) {
      sink.cb = cb;
      sink.built += 1;
      this.inner = new Real(cb);
    }
    async observe(handle: unknown, options?: unknown): Promise<void> {
      await this.inner.observe(handle, options);
      sink.observed += 1;
    }
    disconnect(): void {
      this.inner.disconnect();
    }
  };
}

/**
 * `built` counts CONSTRUCTIONS, `observed` counts observations that actually RESOLVED.
 *
 * The distinction is load-bearing, and it was found the hard way — by the red-first run for this
 * task. `built` increments in the constructor, which runs BEFORE `observe()` settles, so a test
 * that deleted the file after waiting on `built` could reject the still-in-flight `observe()` and
 * reach `onDead` down the `unobservable` path instead of the `disappeared` one it meant to test.
 * It passed anyway, for the wrong reason, because the intended path happened to win the race.
 * Waiting on `observed` removes the race: the observation is provably established first.
 */
interface CaptureSink {
  cb: FileSystemObserverCallback | null;
  built: number;
  observed: number;
}

const newSink = (): CaptureSink => ({ cb: null, built: 0, observed: 0 });

/** A constructor whose `observe()` always rejects — the "engine will not observe this handle"
 *  case, which must DEGRADE to polling rather than stop. */
const refusingCtor: FileSystemObserverCtor = class RefusingObserver implements FileSystemObserverLike {
  constructor(_cb: FileSystemObserverCallback) {
    void _cb;
  }
  observe(): Promise<void> {
    return Promise.reject(new Error('observe refused (test)'));
  }
  disconnect(): void {}
};

const record = (type: FileSystemChangeRecord['type']): FileSystemChangeRecord => ({ type });

const started: { stop(): void }[] = [];
/** Track every detector so no observation survives its test. */
function track<T extends { stop(): void }>(d: T): T {
  started.push(d);
  return d;
}

beforeAll(async () => {
  const root = await opfsRoot();
  if (root) dir = await root.getDirectoryHandle('watch-detector', { create: true });
});

afterEach(async () => {
  for (const d of started.splice(0)) d.stop();
});

// ── THE ENGINE GATE — runs on BOTH engines, asserts WHY it does or does not proceed ───────────

describe('watch detector — engine capability gate (the reason the observer suite runs or skips)', () => {
  it('states this engine capability explicitly rather than skipping silently', async () => {
    const root = await opfsRoot();
    // OPFS is the harness, and it works on BOTH engines — so any skip below is provably about
    // the OBSERVER, never about a broken or unavailable harness.
    expect(root).not.toBeNull();

    if (HAS_OBSERVER) {
      // Chromium (HeadlessChrome/149 at the time of writing): the full suite runs.
      expect(typeof globalObserverCtor()).toBe('function');
    } else {
      // Firefox 151: OPFS ✓, FileSystemObserver ✗. Firefox never takes the observer path in
      // production either (no picker, no observer — spec §3.2); it polls, and the polled path is
      // covered by src/watch/changeDetector.test.ts. If Firefox ever ships FileSystemObserver,
      // THIS ASSERTION GOES RED and the suite below starts running on it.
      expect(globalObserverCtor()).toBeUndefined();
    }
  });
});

// ── THE REAL SUITE — Chromium only, by the capability asserted above ──────────────────────────

describe.skipIf(!HAS_OBSERVER)('observerDetector — real FileSystemObserver over a real OPFS handle', () => {
  it('fires cb with the NEW TEXT after a write', async () => {
    const fh = await makeFile('# before\n');
    const seen: string[] = [];
    const detector = track(observerDetector(fh));
    detector.start((text) => seen.push(text));
    await sleep(50); // let observe() settle before writing

    await writeFile(fh, '# after\n\nthe agent wrote this.\n');

    await waitFor(() => seen.includes('# after\n\nthe agent wrote this.\n'));
    expect(seen.at(-1)).toBe('# after\n\nthe agent wrote this.\n');
  });

  it('stop() ends delivery — NON-VACUOUSLY: a write BEFORE stop is proven to have fired', async () => {
    const fh = await makeFile('# v0\n');
    const seen: string[] = [];
    const detector = track(observerDetector(fh));
    detector.start((text) => seen.push(text));
    await sleep(50);

    // THE POSITIVE CONTROL. Without this, an empty tail below would be indistinguishable from an
    // instrument that never worked at all (retro 2026-07-19, finding 1 — the remoteMedia flake).
    await writeFile(fh, '# v1 BEFORE STOP\n');
    await waitFor(() => seen.includes('# v1 BEFORE STOP\n'));
    const deliveredBeforeStop = seen.length;
    expect(deliveredBeforeStop).toBeGreaterThan(0);

    detector.stop();

    await writeFile(fh, '# v2 AFTER STOP\n');
    await sleep(600); // generous: the pre-stop delivery above needed far less

    expect(seen).not.toContain('# v2 AFTER STOP\n');
    expect(seen.length).toBe(deliveredBeforeStop);
  });

  it('a synthesised ERRORED record RE-OBSERVES rather than returning quietly', async () => {
    const fh = await makeFile('# start\n');
    const sink = newSink();
    const seen: string[] = [];
    const dead: DeadReason[] = [];
    const detector = track(
      observerDetector(fh, {
        observerCtor: capturingCtor(sink),
        onDead: (reason) => dead.push(reason),
      }),
    );
    detector.start((text) => seen.push(text));
    await waitFor(() => sink.observed === 1);
    await sleep(50);

    // The engine will not emit `errored` on demand — synthesise it into the REAL callback.
    sink.cb?.([record('errored')], {} as FileSystemObserverLike);

    // The ladder must re-observe: a SECOND observer is constructed over the still-readable file.
    await waitFor(() => sink.observed === 2);
    expect(dead).toEqual([]); // it did NOT surface dead — the file is fine

    // And the re-established observation is genuinely live, not merely constructed.
    await sleep(50);
    await writeFile(fh, '# after the death and recovery\n');
    await waitFor(() => seen.includes('# after the death and recovery\n'));
  });

  it('a synthesised DISAPPEARED record on a REMOVED file surfaces the designed dead state', async () => {
    const name = nextName();
    madeFiles.push(name);
    const fh = await dir.getFileHandle(name, { create: true });
    await writeFile(fh, '# doomed\n');

    const sink = newSink();
    const dead: { reason: DeadReason; detail: string }[] = [];
    const detector = track(
      observerDetector(fh, {
        observerCtor: capturingCtor(sink),
        onDead: (reason, detail) => dead.push({ reason, detail }),
      }),
    );
    detector.start(() => {});
    // Wait for the observation to be genuinely ESTABLISHED, not merely constructed — see the
    // CaptureSink note. Deleting the file while observe() is still in flight would reach onDead
    // by the wrong path.
    await waitFor(() => sink.observed === 1);

    // Really delete it, so the readability check has a real failure to find.
    await dir.removeEntry(name);
    sink.cb?.([record('disappeared')], {} as FileSystemObserverLike);

    await waitFor(() => dead.length > 0);
    expect(dead[0].reason).toBe('disappeared');
    expect(dead[0].detail).toMatch(/no longer readable/i);
  });

  it('an observe() that REFUSES degrades to POLLING rather than stopping', async () => {
    const fh = await makeFile('# poll me\n');
    const seen: string[] = [];
    const fellBack: string[] = [];
    const dead: DeadReason[] = [];
    const detector = track(
      observerDetector(fh, {
        observerCtor: refusingCtor,
        fallbackIntervalMs: 50,
        onFallback: (detail) => fellBack.push(detail),
        onDead: (reason) => dead.push(reason),
      }),
    );
    detector.start((text) => seen.push(text));

    await waitFor(() => fellBack.length > 0);
    expect(dead).toEqual([]); // readable file ⇒ degraded, NOT dead
    expect(fellBack[0]).toMatch(/observe\(\) failed/i);

    // Non-vacuous: the degraded path actually detects. A real write, seen by real polling.
    await sleep(120); // let the polling baseline land first
    await writeFile(fh, '# polled change\n');
    await waitFor(() => seen.includes('# polled change\n'));
  });
});

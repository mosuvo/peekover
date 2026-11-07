// observerDetector — the Chromium app-page detector: `FileSystemObserver` on a file handle,
// event-driven, no polling loop (task 1.2, plan §1.1).
//
// It satisfies the SAME `ChangeDetector` seam as `pollingDetector`, so nothing above the factory
// that chooses between them can tell which one it is holding.
//
// ── DEAD-OBSERVATION HANDLING IS PART OF THIS MODULE, NOT A FOLLOW-UP ────────────────────────
//
// The task-0 probe saw only `modified` records — on ONE machine, with ONE editor, over ~10
// minutes (decisions.md 2026-07-19). It explicitly did NOT see the `disappeared`+`appeared`
// rename pair that an atomic save produces, and on Windows an atomic write can invalidate the
// observed handle outright. The design must not depend on that one machine's behaviour holding,
// so a record of type `errored` or `disappeared` is treated as **the observation is DEAD**:
//
//   1. Is the file still READABLE? That is the decisive fact — an observation can only be
//      re-established for a file that still exists, and no mechanism whatsoever can watch a file
//      that cannot be opened. Unreadable ⇒ surface the designed dead state.
//   2. Readable ⇒ RE-OBSERVE. An atomic save that swapped the file underneath us lands here, and
//      the re-read that follows picks up the content we missed while dead.
//   3. Re-observe failed but the file reads ⇒ FALL BACK TO POLLING. Degraded, still watching.
//
// **It never silently stops.** Every one of those paths either keeps detecting or calls `onDead`.
// A silent stop is the failure this branch exists to prevent: the reader would sit showing stale
// content, indistinguishable from a document nobody is editing.
//
// The same ladder runs when the INITIAL `observe()` fails (a handle the engine will not observe,
// or an engine with no `FileSystemObserver` at all) — degrade to polling rather than do nothing.
//
// ── WHY THE OBSERVER CONSTRUCTOR IS INJECTABLE ──────────────────────────────────────────────
//
// `FileSystemObserver` is not in lib.dom, so its shape is declared below. The constructor is an
// OPTION defaulting to the global one for a test reason that is worth stating plainly: the
// `errored`/`disappeared` branches cannot be reached by writing to a file — no test can make a
// real engine emit those records on demand. Injecting the constructor lets the real-engine suite
// wrap the REAL `FileSystemObserver`, capture the callback, and hand this module a SYNTHESISED
// record — so the production handler, the re-observe and the fallback all run for real, and only
// the record itself is fabricated. That is the honest maximum here, and it is stated again in
// `tests/browser/watchDetector.browser.test.ts`.

import { pollingDetector, type ChangeDetector, type OnText } from './changeDetector';

// --- the FileSystemObserver shape (absent from lib.dom) -----------------------------

export type FileSystemChangeRecordType =
  | 'appeared'
  | 'disappeared'
  | 'errored'
  | 'modified'
  | 'moved'
  | 'unknown';

export interface FileSystemChangeRecord {
  readonly type: FileSystemChangeRecordType;
  readonly changedHandle?: unknown;
  readonly root?: unknown;
  readonly relativePathComponents?: readonly string[];
}

export interface FileSystemObserverLike {
  observe(handle: unknown, options?: unknown): Promise<void>;
  disconnect(): void;
}

export type FileSystemObserverCallback = (
  records: FileSystemChangeRecord[],
  observer: FileSystemObserverLike,
) => void;

export type FileSystemObserverCtor = new (cb: FileSystemObserverCallback) => FileSystemObserverLike;

/** The engine's own constructor, or `undefined` where it does not exist (every Firefox). */
export function globalObserverCtor(): FileSystemObserverCtor | undefined {
  return (globalThis as { FileSystemObserver?: FileSystemObserverCtor }).FileSystemObserver;
}

// --- the detector -------------------------------------------------------------------

/** Why the observation ended for good. `unobservable` = it could never be established. */
export type DeadReason = 'errored' | 'disappeared' | 'unobservable';

/** Poll interval for the degraded fallback. Matches the polled path's measured cost (~2–8 ms per
 *  tick at 1.12 MiB), and is only ever reached after the observer has already failed. */
export const FALLBACK_INTERVAL_MS = 1000;

export interface ObserverDetectorOptions {
  /** Defaults to the engine's `FileSystemObserver`. Injected only by the real-engine suite. */
  observerCtor?: FileSystemObserverCtor | undefined;
  /**
   * The observation is dead and NOTHING can watch this file any more (it is unreadable).
   * Task 4.3 owns what the user sees; this module only reports the fact, and reports it always
   * rather than stopping quietly.
   */
  onDead?: (reason: DeadReason, detail: string) => void;
  /** Detection has DEGRADED from events to polling but is still live. 4.3's degraded state. */
  onFallback?: (detail: string) => void;
  /** Poll interval used once degraded. Defaults to {@link FALLBACK_INTERVAL_MS}. */
  fallbackIntervalMs?: number;
}

/**
 * Watch `fileHandle` for content changes via `FileSystemObserver`, degrading to polling and
 * finally to a reported dead state rather than ever going quiet.
 *
 * Unlike {@link pollingDetector}, there is NO silent baseline read: a record is itself evidence
 * that the file changed, so the first delivered text fires. Duplicate records for one save (a
 * truncate + a write, say) are collapsed by the same content comparison the polled path uses.
 */
export function observerDetector(
  fileHandle: FileSystemFileHandle,
  options: ObserverDetectorOptions = {},
): ChangeDetector {
  const {
    observerCtor = globalObserverCtor(),
    onDead,
    onFallback,
    fallbackIntervalMs = FALLBACK_INTERVAL_MS,
  } = options;

  let running = false;
  let callback: OnText | null = null;
  let observer: FileSystemObserverLike | null = null;
  let fallback: ChangeDetector | null = null;
  let lastText: string | null = null;

  const readText = (): Promise<string> => fileHandle.getFile().then((file) => file.text());

  const deliver = (text: string): void => {
    if (!running) return;
    if (text === lastText) return; // CONTENT compare, as on the polled path
    lastText = text;
    callback?.(text);
  };

  const readAndDeliver = (): void => {
    readText().then(deliver, () => {
      // A read can transiently fail mid-write; the next record re-reads. A file that is
      // PERSISTENTLY unreadable is caught by the dead-record ladder, not here.
    });
  };

  const disconnectObserver = (): void => {
    if (!observer) return;
    try {
      observer.disconnect();
    } catch {
      // Already torn down by the engine — disconnecting a dead observation is not an error.
    }
    observer = null;
  };

  const teardown = (): void => {
    disconnectObserver();
    fallback?.stop();
    fallback = null;
  };

  const dead = (reason: DeadReason, detail: string): void => {
    if (!running) return;
    teardown();
    running = false;
    callback = null;
    onDead?.(reason, detail);
  };

  const startFallback = (detail: string): void => {
    if (!running || fallback) return;
    onFallback?.(detail);
    fallback = pollingDetector(readText, fallbackIntervalMs);
    fallback.start(deliver);
    // NOTE the residual window: pollingDetector's first read (taken at once, at start) is a
    // silent baseline, so a change landing between the death and that read is absorbed — one
    // read's latency, only on an already-degraded path.
  };

  const observe = async (): Promise<void> => {
    const Ctor = observerCtor;
    if (!Ctor) throw new Error('FileSystemObserver is unavailable on this engine');
    const next = new Ctor((records) => onRecords(records));
    await next.observe(fileHandle);
    observer = next;
  };

  /** The dead-record ladder (see the header). Never returns without a live path or an `onDead`. */
  const handleDeath = async (reason: DeadReason, detail: string): Promise<void> => {
    if (!running) return;
    disconnectObserver();

    // 1. Readability is decisive — nothing can watch a file that cannot be opened.
    try {
      await fileHandle.getFile();
    } catch (err) {
      dead(reason, `${detail}; the file is no longer readable: ${String(err)}`);
      return;
    }
    if (!running) return;

    // 2. The file is there — re-establish the observation, then pick up whatever changed while
    //    we were dead (an atomic save is exactly this shape).
    if (reason !== 'unobservable') {
      try {
        await observe();
        readAndDeliver();
        return;
      } catch (err) {
        detail = `${detail}; re-observe failed: ${String(err)}`;
      }
    }
    if (!running) return;

    // 3. Still readable, just not observable — degrade to polling rather than stop.
    startFallback(detail);
  };

  const onRecords = (records: FileSystemChangeRecord[]): void => {
    if (!running) return;
    const fatal = records.find((r) => r.type === 'errored' || r.type === 'disappeared');
    if (fatal) {
      // The observation is DEAD. Nothing else in this batch is meaningful, because it was
      // delivered by an observation that has just been invalidated.
      void handleDeath(fatal.type as DeadReason, `record type "${fatal.type}"`);
      return;
    }
    // `modified` is the common case; `appeared`, `moved` and `unknown` all mean "something
    // happened that we may not have seen" — the correct response to every one of them is the
    // same: re-read and let the content comparison decide.
    readAndDeliver();
  };

  return {
    start(cb) {
      if (running) return;
      running = true;
      callback = cb;
      observe().catch((err: unknown) => {
        if (!running) return;
        // The observation could never be established. Do NOT stop — run the same ladder, which
        // degrades to polling if the file is readable and reports dead if it is not.
        void handleDeath('unobservable', `observe() failed: ${String(err)}`);
      });
    },
    stop() {
      running = false;
      callback = null;
      teardown();
    },
  };
}

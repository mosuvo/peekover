// Task 4.7 — `observerDetector` is WIRED, and the app page on Chromium detects WITHOUT POLLING.
//
// ── WHAT WAS WRONG, AND WHY A TEST WAS NEEDED AT ALL ────────────────────────────────────────
//
// `observerDetector` was built at 1.2, proven against a real `FileSystemObserver` over a real
// OPFS handle, and measured at 5.1 — and **imported by nothing**. Every shipped watch path
// polled at 1 Hz. So spec §4's
//
//     "While watching on Chromium ON THE APP PAGE, the system shall detect changes
//      WITHOUT POLLING"
//
// was FALSE in shipped code, and plan §1.1's 2×2 rested on it. Nothing failed: 1.2's suite was
// green (it drove the module directly), 4.3/4.4's suites were green (they drove hand-written
// detectors), and the polled path worked correctly — it was simply the wrong mechanism. The
// cause was architectural rather than careless: `observe()` needs a `FileSystemHandle`, and the
// M2 seam deliberately hands out `read()`. **The only test that could have caught it is one that
// asserts the MECHANISM through the shipped path**, which is what this file is.
//
// ── HOW THE MECHANISM IS ASSERTED WITHOUT ASSERTING AN IMPLEMENTATION DETAIL ─────────────────
//
// Not by inspecting which function was constructed. By counting `file.read()` — the seam's own
// reader, and the ONLY thing the polled detector can possibly use. The observer path never
// touches it (it reads through `handle.getFile()`), so:
//
//     detection happens AND `read` was called ZERO times, across more than a full poll
//     interval  ⇒  there is no polling loop.
//
// That is spec §4's sentence, transcribed. Its non-vacuity control is the SAME file with its
// handle removed: `read` is then called repeatedly, so a zero count is demonstrably a property
// of the observer path and not of a counter that never worked.
//
// The latency test's `< WATCH_INTERVAL_MS` bound is **not a performance budget** and does not
// breach the milestone's no-un-measured-threshold rule: the number is the shipped poll interval
// itself, and the claim is architectural — a polled detector CANNOT beat its own interval, an
// event-driven one does not wait for it (5.1 measured the real span at ~18.7 ms @ 50 KB).
//
// ── WHAT THIS PROVES, AND — SAID PLAINLY — WHAT IT DOES NOT ─────────────────────────────────
//
// **OPFS IS NOT LOCAL DISK**, exactly as 1.2's header says. This proves the WIRING: that a
// `MarkdownFile` carrying a real handle reaches `observerDetector` through the real
// `appShell.installWatchForFile`, that no polling loop is created, that the dead-observation
// ladder still runs on that path, and that `preserveReading` survives it. It does **NOT** prove
// that a disk-backed observer fires for an agent's rewrite of a real file — the harness loads no
// extension and has no picker, so a local-disk handle cannot be obtained here at all. That
// property was established by the task-0 probe on real disk (decisions.md 2026-07-19) and is
// re-walked at the milestone-close human gate (7.1), alongside 5.1a.
//
// ── WHY TWO OF THESE TESTS REPLACE `globalThis.FileSystemObserver` ──────────────────────────
//
// `appShell` does not inject an observer constructor — it asks the ENGINE, which is the correct
// production shape. But no engine emits `errored` or `disappeared` on demand (the task-0 probe
// never saw either across 10+ minutes of real edits), and an atomic save's handle invalidation
// cannot be provoked on OPFS at all. So those two tests temporarily wrap the REAL constructor in
// the global slot the production code reads. Everything downstream is production code running
// for real — the real ladder, a real `getFile()` readability check, a real re-`observe()`, a
// real polling fallback, the real controller and the real registry. **Only the record is
// fabricated, because only the record is unreachable** (1.2's precedent, applied one level up).

import { describe, it, expect, beforeAll, afterEach, beforeEach } from 'vitest';
import { detectorForFile } from '../../src/watch/detectorForFile';
import {
  globalObserverCtor,
  FALLBACK_INTERVAL_MS,
  type FileSystemObserverCtor,
  type FileSystemObserverCallback,
  type FileSystemObserverLike,
  type FileSystemChangeRecord,
} from '../../src/watch/observerDetector';
import { WATCH_INTERVAL_MS } from '../../src/watch/watchRelay';
import { DEAD_READ_NOTE } from '../../src/watch/watchController';
import {
  resetWatchRegistryForTest,
  isWatching,
  watchNote,
} from '../../src/watch/watchRegistry';
import { resetWatchControlsForTest } from '../../src/watch/watchControl';
import { resetThemeHostsForTest } from '../../src/theme/themeRegistry';
import { resetThemeControlsForTest } from '../../src/theme/themeControl';
import { setReaderMode } from '../../src/render/readerMode';
import { mountAppShell, type AppStore } from '../../src/app/appShell';
import type { FolderSource } from '../../src/app/folderSource';

const HAS_OBSERVER = typeof globalObserverCtor() === 'function';

/** One full poll interval plus slack — long enough that a polled detector has provably ticked. */
const PAST_ONE_POLL_MS = WATCH_INTERVAL_MS + 300;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function waitFor<T>(fn: () => T | null | undefined | false, tries = 200): Promise<T> {
  for (let i = 0; i < tries; i += 1) {
    const v = fn();
    if (v) return v as T;
    await sleep(20);
  }
  throw new Error('waitFor timed out');
}

// ── OPFS fixtures — the only real handles obtainable in this harness (1.2's finding) ─────────

let dir: FileSystemDirectoryHandle;
let seq = 0;

beforeAll(async () => {
  const root = await navigator.storage.getDirectory();
  dir = await root.getDirectoryHandle('watch-observer-wiring', { create: true });
});

async function writeFile(fh: FileSystemFileHandle, text: string): Promise<void> {
  const w = await fh.createWritable();
  await w.write(text);
  await w.close();
}

async function makeFile(text: string): Promise<FileSystemFileHandle> {
  seq += 1;
  const fh = await dir.getFileHandle(`wiring-${seq}-${Math.trunc(performance.now())}.md`, {
    create: true,
  });
  await writeFile(fh, text);
  return fh;
}

/** A counting reader over a real handle — the seam's `read()`, instrumented. The count is the
 *  whole instrument: only the POLLED detector can ever call it. */
function countingFile(fh: FileSystemFileHandle): {
  read: () => Promise<string>;
  handle: FileSystemFileHandle;
  reads: () => number;
} {
  let reads = 0;
  return {
    read: async () => {
      reads += 1;
      return (await fh.getFile()).text();
    },
    handle: fh,
    reads: () => reads,
  };
}

const started: { stop(): void }[] = [];
function track<T extends { stop(): void }>(d: T): T {
  started.push(d);
  return d;
}

// ── The engine gate — runs on BOTH engines and asserts the REASON, never skips silently ──────

describe('4.7 harness gate — the capability this file branches on, stated not assumed', () => {
  it('has real OPFS handles on this engine, and says whether it has an observer', async () => {
    const fh = await makeFile('# gate\n');
    // Real handles exist on BOTH engines — so any skip below is provably about the OBSERVER.
    expect(fh.kind).toBe('file');
    if (HAS_OBSERVER) {
      expect(typeof globalObserverCtor()).toBe('function');
    } else {
      // Firefox 151: OPFS ✓, FileSystemObserver ✗ (1.2's measurement, re-asserted here because
      // 4.7's fallback correctness depends on it). If Firefox ever ships it, this goes RED.
      expect(globalObserverCtor()).toBeUndefined();
    }
  });
});

// ════ THE CAPABILITY BRANCH, at the factory ══════════════════════════════════════════════════

afterEach(() => {
  for (const d of started.splice(0)) d.stop();
});

describe.skipIf(!HAS_OBSERVER)('detectorForFile — a handle + an observer means NO POLLING', () => {
  it('detects a real write and calls the seam reader ZERO times across a full poll interval', async () => {
    const fh = await makeFile('# before\n');
    const file = countingFile(fh);
    const seen: string[] = [];

    const detector = track(detectorForFile(file));
    detector.start((text) => seen.push(text));
    await sleep(80); // let observe() settle before writing

    await writeFile(fh, '# after\n\nthe agent wrote this.\n');
    await waitFor(() => seen.includes('# after\n\nthe agent wrote this.\n'));

    // THE SPEC SENTENCE, transcribed: detection happened, and no poll ever ran. The wait is
    // longer than one full interval, so a polled detector would have called `read` by now.
    await sleep(PAST_ONE_POLL_MS);
    expect(file.reads()).toBe(0);
  });

  it('delivers in well under one poll interval — the behaviour a user would notice', async () => {
    const fh = await makeFile('# v0\n');
    const seen: string[] = [];
    const detector = track(detectorForFile(countingFile(fh)));
    detector.start((text) => seen.push(text));
    await sleep(80);

    const t0 = performance.now();
    await writeFile(fh, '# v1\n');
    await waitFor(() => seen.includes('# v1\n'));
    const elapsed = performance.now() - t0;

    // Not a budget — the bound IS the poll interval, and no polled detector can beat its own
    // interval. 5.1 measured the real span at ~18.7 ms @ 50 KB, so the margin is ~50×.
    expect(elapsed).toBeLessThan(WATCH_INTERVAL_MS);
  });

  it('a handle with NO observer on the engine falls back to polling (the branch asks for BOTH)', async () => {
    // Chromium HAS an observer and it cannot be taken away, so the absence is stated explicitly.
    // This is the defensive half of the branch: handle-but-no-observer must not construct an
    // observation that is only going to degrade.
    const fh = await makeFile('# no observer here\n');
    const file = countingFile(fh);
    const seen: string[] = [];

    const detector = track(detectorForFile(file, { observerCtor: null }));
    detector.start((text) => seen.push(text));

    await waitFor(() => file.reads() > 0); // it polls...
    await writeFile(fh, '# polled anyway\n');
    await waitFor(() => seen.includes('# polled anyway\n')); // ...and still detects
  });
});

describe('detectorForFile — NO handle means polling, on every engine', () => {
  it('polls the seam reader and detects the change (the non-vacuity control for the count above)', async () => {
    const fh = await makeFile('# handle-free\n');
    const counting = countingFile(fh);
    // The SAME file and the SAME reader — only the handle is withheld. That isolates the one
    // variable, so the zero-read assertion above cannot be a broken counter.
    const file = { read: counting.read };
    const seen: string[] = [];

    const detector = track(detectorForFile(file));
    detector.start((text) => seen.push(text));

    await waitFor(() => counting.reads() > 0, 120);
    expect(counting.reads()).toBeGreaterThan(0);

    await writeFile(fh, '# changed on the polled path\n');
    await waitFor(() => seen.includes('# changed on the polled path\n'), 200);
  });
});

describe.skipIf(HAS_OBSERVER)('FIREFOX IS UNAFFECTED — a real handle still polls here', () => {
  it('picks polling for a file that DOES carry a real handle, because the engine has no observer', async () => {
    // Firefox never reaches this shape in production (no picker ⇒ no handles at all), so this is
    // the strongest available statement: even handed the capability 4.7 branches on, Firefox
    // takes the unchanged polled path. The branch is a CAPABILITY check — had it been an engine
    // sniff, this test could not distinguish the two.
    const fh = await makeFile('# firefox\n');
    const file = countingFile(fh);
    const seen: string[] = [];

    const detector = track(detectorForFile(file));
    detector.start((text) => seen.push(text));

    await waitFor(() => file.reads() > 0, 120);
    await writeFile(fh, '# firefox polled this\n');
    await waitFor(() => seen.includes('# firefox polled this\n'), 200);
  });
});

// ════ THROUGH THE REAL WIRING — appShell.installWatchForFile, the real pill, the real reader ══

function fakeStore(): AppStore {
  return {
    putFolder: async () => undefined,
    deleteFolder: async () => undefined,
    putRecent: async () => undefined,
  };
}

/** A `FolderSource` shaped exactly as `chromiumFolderSource.folderSourceFromHandle` now builds
 *  one: `persistable: true`, and each `MarkdownFile` carrying its own file handle. */
function handleSource(file: {
  read: () => Promise<string>;
  handle?: FileSystemFileHandle;
}): FolderSource {
  return {
    name: 'docs',
    truncated: false,
    persistable: true,
    files: [{ path: 'watched.md', name: 'watched.md', read: file.read, handle: file.handle }],
  };
}

const containers: HTMLElement[] = [];

beforeEach(() => {
  resetWatchRegistryForTest();
  resetWatchControlsForTest();
  resetThemeHostsForTest();
  resetThemeControlsForTest();
});

afterEach(() => {
  for (const c of containers.splice(0)) c.remove();
  resetWatchRegistryForTest();
  resetWatchControlsForTest();
  resetThemeHostsForTest();
  resetThemeControlsForTest();
});

const shadowText = (host: HTMLElement) => host.shadowRoot?.textContent ?? '';
const readerText = (host: HTMLElement) =>
  host.shadowRoot?.querySelector<HTMLElement>('.peekover-reader')?.textContent ?? '';
// KEEPS: each test's own watch property (C339–C345). RE-SPELLED at 013 task 4.5: the app page's Watch is the
// toolbar's and its note the notice area's (`pills: false`; ruling A).
const appOf = (host: HTMLElement) => host.closest<HTMLElement>('.peekover-app');
const pillIn = (host: HTMLElement) =>
  (appOf(host)?.querySelector('.peekover-toolbar') ?? host.shadowRoot!).querySelector<HTMLButtonElement>('.peekover-watch');
const noteIn = (host: HTMLElement) =>
  (appOf(host)?.querySelector('.peekover-app__notices') ?? host.shadowRoot!).querySelector<HTMLElement>('.peekover-watch-note');

/** Mount the real app shell over `source` and select its one file — the user's own route in,
 *  through the real tree, the real `selectFolderFile` and the real `installWatchForFile`. */
async function openFile(source: FolderSource): Promise<HTMLElement> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  containers.push(container);

  const app = mountAppShell(container, {
    openFolder: async () => ({ ok: true, source }),
    store: fakeStore(),
  });
  await app.openFolder();
  container.querySelector<HTMLButtonElement>('[role="treeitem"][data-kind="file"]')!.click();

  const host = await waitFor(() =>
    container.querySelector<HTMLElement>('.peekover-app__reader__host'),
  );
  await waitFor(() => host.shadowRoot?.querySelector('.peekover-reader h1'));
  return host;
}

/** …and start watching through the real pill, which is a user gesture (spec §4 Trust). */
async function openAndWatch(source: FolderSource): Promise<HTMLElement> {
  const host = await openFile(source);
  const pill = await waitFor(() => pillIn(host));
  pill.click();
  expect(isWatching()).toBe(true);
  return host;
}

// ── The defect 4.7's verification found: no pill on the first file of a session ──────────────

describe('4.7 (discovered) — the watch control exists on the FIRST file opened', () => {
  it('offers the pill on the first selection, not only from the second file onwards', async () => {
    // FOUND BY THIS TASK, on both engines. `installWatchForFile` used to run AFTER
    // `readerPane.select()` had already mounted, and `buildWatchControl` decides at mount time —
    // so the very first file a user opened in a session rendered NO watch control at all, and
    // the feature only appeared once a second file had been selected. Nothing could see it:
    // `appShell.test.ts` has no watch coverage, and every watch suite registers its own target
    // before mounting. Engine-independent, so it runs on both.
    const fh = await makeFile('# First file\n\nopened in a fresh session.\n');
    const counting = countingFile(fh);
    const host = await openFile(handleSource({ read: counting.read }));

    const pill = pillIn(host);
    expect(pill).toBeTruthy();
    expect(pill!.getAttribute('aria-pressed')).toBe('false');
    // ...and it is a LIVE control, not merely present: clicking it actually starts the watch.
    pill!.click();
    expect(isWatching()).toBe(true);
  });
});

describe.skipIf(!HAS_OBSERVER)('4.7 through appShell — the app page watches by EVENTS', () => {
  it('re-renders from a real write without ever polling the seam reader', async () => {
    const fh = await makeFile('# Watched\n\nthe first version.\n');
    const file = countingFile(fh);
    const host = await openAndWatch(handleSource(file));
    // The baseline is 1, not 0: `readerPane.select()` legitimately calls `read()` once to RENDER
    // the file. What must never grow after that is the count — that growth would be a poll.
    const readsAtStart = file.reads();

    await writeFile(fh, '# Watched\n\nthe agent rewrote this.\n');
    await waitFor(() => readerText(host).includes('the agent rewrote this'));

    // The reader followed the file, and `installWatchForFile` built NO polling loop for it.
    await sleep(PAST_ONE_POLL_MS);
    expect(file.reads()).toBe(readsAtStart);
    expect(isWatching()).toBe(true);
  });

  it('preserveReading still applies — the controller does not care which detector it holds', async () => {
    const fh = await makeFile('# Watched\n\nreading this in raw.\n');
    const host = await openAndWatch(handleSource(countingFile(fh)));

    // The reader is in Raw. Without `preserveReading`, mount() resets to 'reading' (3.3's
    // `mount.ts:151` change) and the user is thrown out of the view they chose — on EVERY
    // update. This is 3.3's property, re-asserted on the path 3.3 never ran on.
    setReaderMode(host, 'raw');
    expect(host.getAttribute('data-mode')).toBe('raw');

    await writeFile(fh, '# Watched\n\nthe agent rewrote this in raw mode.\n');
    await waitFor(() => shadowText(host).includes('the agent rewrote this in raw mode'));

    expect(host.getAttribute('data-mode')).toBe('raw');
    // ...and the RAW view carries the new text, so the update genuinely reached the mode the
    // reader is looking at rather than only the hidden reading column.
    expect(
      host.shadowRoot!.querySelector<HTMLElement>('.peekover-raw')?.textContent ?? '',
    ).toContain('the agent rewrote this in raw mode');
  });

  it('a file with NO handle still watches correctly here — polled, through the same wiring', async () => {
    // Firefox's whole app-page path, and a picker-disabled Chromium's. The 2×2 is not collapsed.
    const fh = await makeFile('# Watched\n\nthe first version.\n');
    const counting = countingFile(fh);
    const host = await openAndWatch(handleSource({ read: counting.read }));
    const readsAfterRender = counting.reads();

    // Wait for the first POLL past the render's read — that poll is `pollingDetector`'s silent
    // BASELINE, and a write landing before it is absorbed into the baseline and never reported
    // (its documented residual window). The growing count is also the proof this file is polled.
    await waitFor(() => counting.reads() > readsAfterRender, 120);

    await writeFile(fh, '# Watched\n\npolled into the reader.\n');
    await waitFor(() => readerText(host).includes('polled into the reader'), 200);
  });
});

// ════ 1.2's LADDER, ON THE REAL PATH — including spec §7-7's atomic-save fragility ═══════════

interface GlobalSink {
  cb: FileSystemObserverCallback | null;
  observed: number;
  /** Reject `observe()` from this attempt number onwards — the atomic-save shape. */
  refuseFrom: number;
}

/**
 * Install a wrapper around the engine's REAL `FileSystemObserver` in the global slot production
 * reads, and return a restore fn. See the header for why this is the honest maximum here.
 */
function installGlobalObserver(sink: GlobalSink): () => void {
  const holder = globalThis as { FileSystemObserver?: FileSystemObserverCtor };
  const Real = holder.FileSystemObserver as FileSystemObserverCtor;
  const previous = holder.FileSystemObserver;
  holder.FileSystemObserver = class WrappedObserver implements FileSystemObserverLike {
    private readonly inner: FileSystemObserverLike;
    constructor(cb: FileSystemObserverCallback) {
      sink.cb = cb;
      this.inner = new Real(cb);
    }
    async observe(handle: unknown, options?: unknown): Promise<void> {
      if (sink.observed + 1 >= sink.refuseFrom) {
        throw new Error('observe refused — the handle was invalidated (test)');
      }
      await this.inner.observe(handle, options);
      sink.observed += 1;
    }
    disconnect(): void {
      this.inner.disconnect();
    }
  } as FileSystemObserverCtor;
  return () => {
    holder.FileSystemObserver = previous;
  };
}

const newSink = (): GlobalSink => ({ cb: null, observed: 0, refuseFrom: Number.POSITIVE_INFINITY });
const record = (type: FileSystemChangeRecord['type']): FileSystemChangeRecord => ({ type });

let restoreObserver: (() => void) | null = null;
afterEach(() => {
  restoreObserver?.();
  restoreObserver = null;
});

describe.skipIf(!HAS_OBSERVER)("4.7 — 1.2's dead-observation ladder, reached through the real wiring", () => {
  it('an ERRORED record over a live file RE-OBSERVES, and the reader keeps updating', async () => {
    const sink = newSink();
    restoreObserver = installGlobalObserver(sink);

    const fh = await makeFile('# Watched\n\nbefore the death.\n');
    const file = countingFile(fh);
    const host = await openAndWatch(handleSource(file));
    await waitFor(() => sink.observed === 1);
    const readsAtStart = file.reads(); // 1, from the initial render — see the test above

    // The engine will not emit `errored` on demand — synthesise it into the REAL callback.
    sink.cb?.([record('errored')], {} as FileSystemObserverLike);
    await waitFor(() => sink.observed === 2); // the ladder re-observed

    // NOT merely re-constructed — genuinely live, all the way to the rendered reader.
    await sleep(80);
    await writeFile(fh, '# Watched\n\nafter the death and recovery.\n');
    await waitFor(() => readerText(host).includes('after the death and recovery'));

    expect(isWatching()).toBe(true);
    expect(watchNote()).toBeNull(); // nothing to explain — it recovered
    expect(file.reads()).toBe(readsAtStart); // it recovered onto EVENTS, not into a poll loop
  });

  it('spec §7-7 — an atomic save that INVALIDATES the handle degrades to polling, still watching', async () => {
    // The probe saw only `modified`, on ONE machine with ONE editor. An editor that writes a
    // temp file and renames over the target can invalidate the observed handle: the record
    // arrives and the re-observe then FAILS. This asserts the fallback HAPPENS rather than
    // assuming the probe's machine generalises — it is the case 1.2's ladder exists for, and
    // until 4.7 it was unreachable in shipped code because nothing constructed an observer.
    const sink = newSink();
    sink.refuseFrom = 2; // the first observation succeeds; the re-observe does not
    restoreObserver = installGlobalObserver(sink);

    const fh = await makeFile('# Watched\n\nbefore the atomic save.\n');
    const host = await openAndWatch(handleSource(countingFile(fh)));
    await waitFor(() => sink.observed === 1);

    sink.cb?.([record('errored')], {} as FileSystemObserverLike);

    // DEGRADED, NOT DEAD: the file is still readable, so the ladder polls rather than stopping.
    // The degraded loop polls the HANDLE (`observerDetector`'s own `getFile().text()`), not the
    // seam's `read()`, so the seam read-count says nothing here — the proof has to be the
    // user-facing one below.
    expect(isWatching()).toBe(true);
    expect(watchNote()).toBeNull();

    // The fallback's first poll is a SILENT BASELINE (pollingDetector's documented semantics),
    // so the write must land AFTER it or it is absorbed and nothing fires. One full fallback
    // interval plus slack.
    await sleep(FALLBACK_INTERVAL_MS + 300);
    await writeFile(fh, '# Watched\n\nseen by the degraded watch.\n');

    // THE PROOF: a change still reaches the real reader. The observation was disconnected and
    // the re-observe refused, so without the fallback nothing would ever deliver again — this
    // assertion is exactly the "never silently stops" property, on the real path.
    await waitFor(() => readerText(host).includes('seen by the degraded watch'), 200);
    // ...and it is genuinely the DEGRADED path: no second observation was ever established.
    expect(sink.observed).toBe(1);
  });

  it('a DISAPPEARED record over a removed file stops the watch, explains, and never blanks', async () => {
    const sink = newSink();
    restoreObserver = installGlobalObserver(sink);

    seq += 1;
    const name = `wiring-doomed-${seq}-${Math.trunc(performance.now())}.md`;
    const fh = await dir.getFileHandle(name, { create: true });
    await writeFile(fh, '# Watched\n\nthe last good version.\n');

    const host = await openAndWatch(handleSource(countingFile(fh)));
    await waitFor(() => sink.observed === 1);

    await dir.removeEntry(name); // really gone, so the readability check has a real failure
    sink.cb?.([record('disappeared')], {} as FileSystemObserverLike);

    // NEVER SILENTLY STOP: the controller stopped AND the user is told, in the same words the
    // polled path's dead-read policy uses (4.3) — one event, one string.
    await waitFor(() => watchNote() !== null);
    expect(isWatching()).toBe(false);
    expect(watchNote()).toBe(DEAD_READ_NOTE);
    expect(noteIn(host)!.hidden).toBe(false);
    expect(noteIn(host)!.textContent).toBe(DEAD_READ_NOTE);

    // NEVER BLANK (AGENTS.md #5): the last good render is untouched, and the toggle stays,
    // because retrying is the user's call.
    expect(readerText(host)).toContain('the last good version');
    expect(pillIn(host)).toBeTruthy();
    expect(pillIn(host)!.getAttribute('aria-pressed')).toBe('false');
  });
});

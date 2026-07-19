// changeDetector — the ONE detection seam plus its polled implementation (task 1.1, plan §1.1).
//
// A detector reports ONE thing: the document's current text, whenever that text has changed.
// Nothing about handles, URLs, engines or surfaces leaks through this interface — that is what
// lets a single polling implementation serve three call sites (Firefox app page via
// `entry.file().text()`, and BOTH content scripts via `relayRead(location.href)`), with every
// platform difference pushed up into the factory that CHOOSES a detector.
//
// ── THE TRAP THIS MODULE EXISTS TO CLOSE (decisions.md 2026-07-19, TRAP 2) ───────────────────
//
// It compares CONTENT. Never `size`, never `lastModified`, never a hash of either.
//
// On Firefox's drag path — the ONLY route on which Firefox watch works at all — the `File`
// obtained from a `FileSystemFileEntry` reports `size` and `lastModified` **FROZEN AT DROP
// TIME**. They never move, no matter how many times the file is rewritten on disk. Only
// `.text()` reads fresh bytes. This was measured, not reasoned about: ~45 polls across a real
// on-disk edit, metadata never moved, `.text()` returned new content.
//
// So the obvious implementation — poll `lastModified`, re-read when it changes — would compile,
// type-check, pass a naive test, and **silently never fire** on the one engine path that needs
// it. Comparing content is not a style choice here; it is the whole point of the module.
//
// The cost of comparing content is re-reading the whole file each tick. Measured and affordable:
// ~0–1 ms for a small file, ~2–8 ms at 1.12 MiB (decisions.md 2026-07-19).
//
// The `read` fn is INJECTED, exactly as `settingsPort` injects its transport (`settingsPort.ts`
// header) — so this is unit-testable with a fake and carries no DOM, no `#imports`, no engine.

/** What a detector reports: the document's current text. */
export type OnText = (text: string) => void;

/**
 * The detection seam. Two implementations satisfy it — this module's {@link pollingDetector}
 * and the Chromium app page's `observerDetector` (task 1.2) — and no consumer above the factory
 * can tell which one it holds.
 */
export interface ChangeDetector {
  /** Begin detecting. Calling `start` on an already-started detector is a no-op. */
  start(cb: OnText): void;
  /** Stop detecting. Idempotent, and safe to call from within `cb`. */
  stop(): void;
}

/**
 * Poll `read` every `intervalMs` and fire `cb` whenever the text DIFFERS from the last text
 * this detector saw.
 *
 * ── Baseline semantics: the FIRST read establishes the baseline and does NOT fire ────────────
 *
 * A detector reports *changes*, so the first poll has nothing to compare against and is silent.
 * This is deliberate and is what makes "identical content fires nothing" true from a cold start:
 * watch is switched on for a document that is ALREADY rendered, and firing on the first tick
 * would re-render the reader for no reason on every single start.
 *
 * The residual window, stated rather than papered over: a change landing between the render and
 * the first poll is absorbed into the baseline and never reported. It is bounded by one
 * interval, and closing it needs the caller's already-rendered text seeded as the baseline —
 * which the controller (4.2) owns, not this module.
 *
 * ── Why a self-scheduling timeout chain and not `setInterval` ────────────────────────────────
 *
 * The next poll is scheduled only once the previous read has SETTLED. `setInterval` would keep
 * firing into a slow read and let reads overlap and pile up — which at 1 MB, on the polled path
 * that re-reads the whole file every tick, is the case most likely to actually occur.
 *
 * A read that REJECTS is transient by construction here (a file being rewritten can briefly
 * fail to open): it is swallowed, the baseline is left untouched, and the loop continues. This
 * module deliberately owns no dead-read POLICY — "a read that keeps failing stops the watch and
 * surfaces a designed state" is task 4.3's, at the controller, where the UI is.
 */
export function pollingDetector(read: () => Promise<string>, intervalMs: number): ChangeDetector {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let running = false;
  let callback: OnText | null = null;
  /** The last text seen. `null` = nothing seen yet, i.e. the next read is the baseline. */
  let lastText: string | null = null;

  const schedule = (): void => {
    if (!running) return;
    timer = setTimeout(tick, intervalMs);
  };

  const deliver = (text: string): void => {
    // stop() may have run while the read was in flight — an in-flight read must not deliver
    // after stop, or a stopped watch re-renders the reader one tick later.
    if (!running) return;
    if (lastText === null) {
      lastText = text; // baseline: nothing to compare against yet
      return;
    }
    if (text === lastText) return; // CONTENT compare — the whole point (see header)
    lastText = text;
    callback?.(text);
  };

  const tick = (): void => {
    timer = null;
    if (!running) return;
    read()
      .then(deliver, () => {
        // A failed read is transient here; the baseline is left untouched so the NEXT
        // successful read is compared against the last good text, not against a gap.
      })
      .catch(() => {
        // A THROWING callback must not kill the loop, and must never surface as an unhandled
        // rejection out of a timer. Same best-effort posture as `SettingsPort.save`.
      })
      .then(schedule);
  };

  return {
    start(cb) {
      if (running) return;
      running = true;
      callback = cb;
      schedule();
    },
    stop() {
      running = false;
      callback = null;
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
    },
  };
}

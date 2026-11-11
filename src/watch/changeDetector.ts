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
 * What a detector reports when a READ FAILS (spec 005 task 4.3).
 *
 * REPORTING IS THE DETECTOR'S JOB; DECIDING IS NOT. This module's header states the boundary and
 * it is kept: a failed read is transient by construction here (a file being rewritten can briefly
 * fail to open), so the loop swallows it, leaves the baseline untouched and keeps polling. What it
 * does NOT do is decide that a watch is dead — "a read that keeps failing stops the watch and
 * surfaces a designed state" is a UI policy, and it lives at the controller, where the UI is.
 *
 * So this callback carries no verdict, only the fact. The controller counts CONSECUTIVE failures
 * against its own threshold; a single blip never reaches the user.
 */
export type OnReadError = (cause: unknown) => void;

/**
 * The one normalisation every detector compare uses, for fresh reads and a seeded baseline alike: a
 * leading byte-order mark is dropped and CRLF / lone CR become LF. The rendered source and a fresh
 * read can differ only there (a tab's text came through the browser's text view, which normalises
 * line endings; a decoder may or may not keep the mark), and neither difference changes what the
 * reader shows. The text DELIVERED to the callback is the raw read, untouched.
 */
export function normalizeForCompare(text: string): string {
  return text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
}

/**
 * The detection seam. Two implementations satisfy it — this module's {@link pollingDetector}
 * and the Chromium app page's `observerDetector` (task 1.2) — and no consumer above the factory
 * can tell which one it holds.
 */
export interface ChangeDetector {
  /** Begin detecting. Calling `start` on an already-started detector is a no-op.
   *
   *  `onError` is OPTIONAL and additive (task 4.3): a detector reports failed reads through it so
   *  the controller can apply its dead-read policy, and every existing caller that omits it gets
   *  byte-identical behaviour — the read failure is still swallowed and the loop still continues.
   *
   *  `baseline` (M13 discovered task 9.3d) is the SOURCE TEXT the reader rendered from. When it is
   *  given, the first read is compared against it instead of becoming a silent baseline, so a save
   *  that lands after the render — before the click, or before the click's own read resolves — is
   *  shown. Every compare goes through {@link normalizeForCompare}. */
  start(cb: OnText, onError?: OnReadError, baseline?: string): void;
  /** Stop detecting. Idempotent, and safe to call from within `cb`. */
  stop(): void;
}

/**
 * Poll `read` every `intervalMs` and fire `cb` whenever the text DIFFERS from the last text
 * this detector saw.
 *
 * ── Baseline semantics: the FIRST read establishes the baseline and does NOT fire ────────────
 *
 * A detector reports *changes*, so the first read has nothing to compare against and is silent.
 * This is deliberate and is what makes "identical content fires nothing" true from a cold start:
 * watch is switched on for a document that is ALREADY rendered, and firing on the first tick
 * would re-render the reader for no reason on every single start.
 *
 * The first read is taken AT START (M13 discovered task, "baseline at the click"): before it, the
 * baseline waited one interval, so a save made in the first second after pressing Watch became
 * the baseline and was never shown. That left a window: a change landing between the RENDER and
 * the moment that first read resolved was absorbed — and CI hit it (M13 9.3d: the append landed
 * while the click's read was in flight). So a caller that knows the rendered source passes it as
 * `baseline` to `start`, and the first read is compared against it; the window is closed. Without
 * a baseline the first read is still the silent baseline, as before.
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
  let errback: OnReadError | null = null;
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
    const key = normalizeForCompare(text);
    if (lastText === null) {
      lastText = key; // baseline: nothing to compare against yet
      return;
    }
    if (key === lastText) return; // CONTENT compare — the whole point (see header)
    lastText = key;
    callback?.(text);
  };

  const tick = (): void => {
    timer = null;
    if (!running) return;
    read()
      .then(deliver, (cause: unknown) => {
        // A failed read is transient here; the baseline is left untouched so the NEXT
        // successful read is compared against the last good text, not against a gap. It is
        // REPORTED (task 4.3) but not acted on — the dead-read policy is the controller's, and
        // a detector that stopped itself on one blip would kill a watch mid-file-rewrite.
        if (running) errback?.(cause);
      })
      .catch(() => {
        // A THROWING callback must not kill the loop, and must never surface as an unhandled
        // rejection out of a timer. Same best-effort posture as `SettingsPort.save`.
      })
      .then(schedule);
  };

  return {
    start(cb, onError, baseline) {
      if (running) return;
      running = true;
      callback = cb;
      errback = onError ?? null;
      // M13 9.3d: a seeded baseline is the rendered source, so the read below is a COMPARE, not a
      // silent baseline — a save that lands before it resolves is shown. Unseeded, as before.
      if (baseline !== undefined) lastText = normalizeForCompare(baseline);
      tick(); // the first read happens NOW, at the click — not one interval later (M13 9.3a)
    },
    stop() {
      running = false;
      callback = null;
      errback = null;
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
    },
  };
}

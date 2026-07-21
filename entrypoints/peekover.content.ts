import { defineContentScript, browser } from '#imports';
import { runReader } from '@/src/render/runReader';
import { messagingPort } from '@/src/settings/settingsPort';
import { setThemeSetting } from '@/src/theme/reader';
import { publishSettings, registerSettingsSink } from '@/src/settings/settingsSeam';
import { pollingDetector } from '@/src/watch/changeDetector';
import {
  WATCH_INTERVAL_MS,
  registerWatchDetector,
  relayRead,
  isWatchableFileUrl,
} from '@/src/watch/watchRelay';
import { watchCapability } from '@/src/watch/watchAvailability';
import { setWatchNote } from '@/src/watch/watchRegistry';

// Peekover content script. The manifest `matches` below are a COARSE, host-level
// gate (they decide where the browser injects at all); `isRenderableContext` is
// the authoritative in-script gate that narrows to actual markdown resources.
// Every pattern here is justified in docs/trust/PERMISSIONS.md (AGENTS.md #4).
//
// Runs at document_start with a hidden-raw strategy: runReader detects the context,
// hides the browser's raw <pre> before it can paint (skipping its ~1 s layout cost
// on large docs and the raw-text flash), waits for the complete source, then mounts
// the reader — and always reveals the raw text again if the mount cannot succeed, so
// the page is never left blank (AGENTS.md #5). The timing/visibility orchestration
// lives in src/render/runReader.ts and the page-mutating mount core in
// src/render/mountReader.ts, both extracted from here so they are unit-testable; the
// entrypoint only wires WXT's config to runReader().

export default defineContentScript({
  matches: [
    // (a) Local markdown files opened via file:// — one pattern per extension.
    'file:///*.md',
    'file:///*.mkd',
    'file:///*.mdx',
    'file:///*.markdown',
    'file:///*.mdown',
    'file:///*.mkdn',
    'file:///*.mdwn',
    'file:///*.mdtxt',
    'file:///*.mdtext',
    // (b) Named raw-content hosts (exact host).
    'https://raw.githubusercontent.com/*',
    'https://gist.githubusercontent.com/*',
    // (b) Path-scoped raw views so we do not inject across the whole site.
    'https://gitlab.com/*/-/raw/*',
    'https://bitbucket.org/*/raw/*',
  ],
  // document_start (was document_idle): hide the raw <pre> before the browser paints
  // it, then mount at DOMContentLoaded. runReader owns the never-blank guarantees.
  runAt: 'document_start',
  main() {
    // THEMING THE FIRST PAINT (task 4.2 — the D-2 mitigation AS MEASURED; see below).
    //
    // Build the content-script settings port and fire load() at document_start, IN PARALLEL with
    // runReader's injectHideStyle() (plan §1.5). The reader's own origin cannot read the extension
    // DB, so this port reaches settings by messaging the background (entrypoints/background.ts).
    // `load()` is bounded and falls back to Auto, so a dead background can never stall here — and,
    // given the shape below, could not stall the reader even if it did.
    //
    // `setThemeSetting` is the ONE line that makes the persisted theme real for the reader: it
    // updates the theme runtime and BROADCASTS through the theme registry (group 3), re-theming
    // every registered host. Land before the mount and the persisted theme IS the first painted
    // state; land after and the already-mounted reader is re-themed INSTANTLY — D-2 sub-decision
    // (a): an instant swap, never a cross-fade (reduced-motion-safe by construction, and not a
    // visual property that only a human gate could ever certify).
    //
    // WHY THERE IS NO BLOCKING GATE HERE, THOUGH D-2 CHOSE ONE. D-2 (decisions.md 2026-07-18)
    // selected block-until-read behind a short paint gate, ON THE EXPLICIT CONDITION that 4.2
    // re-measure it: 4.1's "gating makes cold availability ~26 ms" was an INFERENCE from an
    // isolation probe, never measured in the gated configuration. 4.2 measured it, and it DID NOT
    // HOLD (numbers in progress.md, task 4.2). Behind a gate, cold settings availability is ~72 ms,
    // not ~26 ms, and the 50 KB cold cell painted at ~173 ms against the <150 ms budget — at a
    // 75 ms gate AND at a 40 ms gate — while the ungated control on the SAME build measured
    // ~137-148 ms. The gate cost ~25-35 ms on cold start and bought nothing measurable, because
    // the settings already beat the mount in every warm cell without it. So D-2's own recorded
    // fallback applies: mount Auto + re-theme instantly. The gate was built, tested, measured and
    // REMOVED rather than shipped missing its budget.
    //
    // Note `load()` never rejects (settingsPort's withTimeout resolves to the default on timeout
    // or failure). Nothing in the render path awaits this promise, so even a future change that
    // COULD reject can neither withhold nor delay the reader (AGENTS.md #5) — never-blank is
    // structural on this path, not a timeout that has to be tuned correctly.
    const settings = messagingPort((message) => browser.runtime.sendMessage(message));
    void settings.load().then((resolved) => {
      setThemeSetting(resolved.theme);
      // Task 6.1: hand the SAME resolved value to the settings seam, which caches it for any
      // consumer built later and notifies the ones already built. That is what carries the
      // persisted TOC open-state/width to a rail this load() lost the race to — the normal cold-
      // start ordering (group 4's measurement), not an edge case. Theme keeps its own line above
      // because the theme runtime applies + broadcasts, which is a rendering act, not a cache
      // update (see settingsSeam.ts on why the two halves stay separate).
      publishSettings(resolved);
    });

    // The WRITE direction (task 5.1, decision D-A). The in-reader theme control is built deep
    // inside mount(), which has no port and is not given one: threading a port through
    // runReader -> mountReader -> mount for a single callback would reshape four signatures on
    // two call chains. Instead this context registers its own port's `save` ONCE, exactly as it
    // registers the theme setting above — the same seam, the same direction of dependency, and
    // mount() still imports neither a port nor the store. `save` is best-effort by construction
    // (settingsPort swallows persistence failures), so a dead background cannot break a pick.
    // ONE registration now serves EVERY settings consumer (the theme control and, from task 6.1,
    // the TOC rail) — the seam was generalized rather than duplicated per feature (decision D-E).
    // Registered under its canonical name; `registerThemeSaveSink` remains a delegate to this.
    registerSettingsSink((patch) => void settings.save(patch));

    // WATCH (task 2.2). Build this surface's detector and register it — and START NOTHING.
    // Nothing watches by default: switching it on is a user gesture on group 4's control
    // (spec §4 Trust), and group 4.3 owns the lifecycle. Constructing a stopped detector costs
    // one object and no timer.
    //
    // THE LOOP LIVES HERE, IN THE PAGE — the background is a stateless fetch proxy. That is what
    // dissolves spec §7-6: there is no long-lived background state an MV3 teardown could lose, and
    // the watch dies with this tab, which is the correct lifetime.
    //
    // `pollingDetector` is the right implementation for this surface on BOTH engines, not a Firefox
    // fallback: `FileSystemObserver.observe()` takes a `FileSystemHandle` and a content script has
    // only a URL, with no URL→handle API anywhere (plan §1.1). Chromium's event-driven path is the
    // APP PAGE's, and only the app page's.
    // WATCH AVAILABILITY ON THIS SURFACE (task 4.4) — decided BEFORE anything is registered.
    //
    // 2.3 measured the answer and it was NEGATIVE for Firefox: a `moz-extension:` background
    // "may not load or link to file:" — Gecko's URI security policy, which no permission grants —
    // and task-0 established the content script cannot re-read its own file either. Both halves of
    // the route are closed, so on Firefox this surface ships a designed EXPLANATION and registers
    // no detector at all. Never a dead toggle (spec §4 Degradation).
    //
    // `import.meta.env.FIREFOX` is a BUILD-TIME constant, not a runtime engine sniff, and the
    // distinction matters because `firefoxFolderSource.ts` set the opposite precedent for the app
    // page ("branch on `persistable`, never on the engine"). That rule is about a capability which
    // varies per SOURCE and must be carried as data at the seam. This one varies per BUILD: it is a
    // fixed property of the engine the artifact targets, unchangeable at runtime and already
    // measured. The decision itself is a pure function so it stays testable (watchAvailability.ts).
    const watch = watchCapability({
      surface: 'content-script',
      backgroundCanReadFileUrls: !import.meta.env.FIREFOX,
      // The OTHER half of this content script's `matches` is remote raw hosts (raw.githubusercontent,
      // gist, gitlab-raw, bitbucket-raw), where watching is out of scope (spec §6, task 4.6-rescope).
      // Gate on the RELAY's own predicate — the authority on what the background will read — so a remote
      // page gets the scope note and registers NO detector (no toggle, no per-second refused message),
      // rather than a live-looking control the relay refuses every tick. Passed as a plain boolean (not
      // by importing the predicate into the pure decision) so `watchCapability` stays engine/DOM-free and
      // unit-testable with plain values, exactly as `backgroundCanReadFileUrls` is.
      documentIsWatchableFile: isWatchableFileUrl(location.href),
    });
    if (watch.watchable) {
      registerWatchDetector(
        pollingDetector(
          relayRead(location.href, (message) => browser.runtime.sendMessage(message)),
          WATCH_INTERVAL_MS,
        ),
      );
    } else {
      setWatchNote(watch.note);
    }

    runReader();
  },
});

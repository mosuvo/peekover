// @vitest-environment jsdom
//
// watchControl — the D-3 disclosure GATE, in jsdom (spec 006 task 3.1).
//
// WHAT THIS FILE OWNS, AND WHAT IT LEAVES TO THE BROWSER SUITE. The gate is pure predicate logic —
// `watchAvailable() && isDiffContextRegistered()` — plus the arbitration ORDER inside
// `buildWatchChrome`. Both are answerable in jsdom, which has a DOM and honest module state, and
// neither needs a cascade or a real layout. What this file deliberately does NOT try to prove is
// which PRODUCTION surface leaves the diff registry empty (the D-14 trap) or that the disclosure
// survives `mount()`'s `replaceChildren` on a real reader — those are real-engine, cross-surface
// facts, owned by tests/browser/captureDisclosure.browser.test.ts and red-first-proven there.
//
// The two gate halves are driven through the PRODUCTION seams, never by poking module internals:
// `registerWatchTarget` sets `watchAvailable()`, `registerDiffContext` sets
// `isDiffContextRegistered()`. That is the same discipline the browser suite keeps, one layer down.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  registerWatchTarget,
  resetWatchRegistryForTest,
  setWatchNote,
  type WatchTarget,
} from './watchRegistry';
import {
  registerDiffContext,
  resetDiffRegistryForTest,
  type DiffContext,
} from '../render/diffRegistry';
import {
  buildWatchChrome,
  buildDisclosure,
  resetWatchControlsForTest,
  WATCH_CONTROL_CLASS,
  WATCH_NOTE_CLASS,
  WATCH_DISCLOSURE_CLASS,
} from './watchControl';

/** A minimal registered watch target — enough to make `watchAvailable()` true; this suite never
 *  clicks it, so its start/stop are inert. */
function stubTarget(): WatchTarget {
  return { start() {}, stop() {}, isWatching: () => false };
}

/** A minimal registered diff context — enough to make `isDiffContextRegistered()` true; the holder
 *  never calls its closures here. */
function stubContext(): DiffContext {
  return {
    docId: 'folder/doc.md',
    getCurrentSource: () => undefined,
    fetchMeta: async () => [],
    fetchText: async () => undefined,
    showDiff: () => ({ ok: true }),
    hideDiff: () => undefined,
  };
}

function host(): HTMLElement {
  return document.createElement('div');
}

/** The class of each chrome node, in order — the shape the arbitration rule is asserted against. */
const classesOf = (chrome: Node[]): string[] =>
  chrome.map((n) => (n as HTMLElement).className);

beforeEach(() => {
  resetWatchRegistryForTest();
  resetDiffRegistryForTest();
  resetWatchControlsForTest();
  document.body.replaceChildren();
});

afterEach(() => {
  resetWatchRegistryForTest();
  resetDiffRegistryForTest();
  resetWatchControlsForTest();
  document.body.replaceChildren();
});

describe('the disclosure suppression gate (task 3.1, D-3)', () => {
  it('BOTH gates pass → the disclosure is shown, and buildWatchChrome includes it', () => {
    registerWatchTarget(stubTarget()); // watchAvailable() → true
    registerDiffContext(stubContext()); // isDiffContextRegistered() → true

    // Built directly: the gate is open, so the element ships un-hidden.
    expect(buildDisclosure().hidden).toBe(false);

    // ...and it is present in the real chrome array.
    const chrome = buildWatchChrome(host());
    const disclosure = chrome.find(
      (n) => (n as HTMLElement).className === WATCH_DISCLOSURE_CLASS,
    ) as HTMLElement | undefined;
    expect(disclosure).toBeTruthy();
    expect(disclosure!.hidden).toBe(false);
    expect(disclosure!.getAttribute('role')).toBe('status');
  });

  it('watchAvailable FALSE, registry non-empty → hidden, and chrome EXCLUDES it (the Firefox half)', () => {
    // No watch target registered → watchAvailable() is false. A diff context alone is the harmless
    // false-negative surface (Firefox picker / remote): the composed gate keeps it off.
    registerDiffContext(stubContext());

    expect(buildDisclosure().hidden).toBe(true);
    expect(classesOf(buildWatchChrome(host()))).not.toContain(WATCH_DISCLOSURE_CLASS);
  });

  it('watchAvailable TRUE, registry EMPTY → hidden, and chrome EXCLUDES it (the D-14 trap half)', () => {
    // This is the load-bearing half: a surface that CAN watch but registered no diff context — the
    // Chromium content-script `file://` reader. A watchAvailable()-only gate would ship it here.
    registerWatchTarget(stubTarget());

    expect(buildDisclosure().hidden).toBe(true);
    expect(classesOf(buildWatchChrome(host()))).not.toContain(WATCH_DISCLOSURE_CLASS);
  });

  it('BOTH false → hidden, and chrome excludes it', () => {
    expect(buildDisclosure().hidden).toBe(true);
    expect(classesOf(buildWatchChrome(host()))).not.toContain(WATCH_DISCLOSURE_CLASS);
  });
});

describe('the arbitration order in buildWatchChrome (D-3: control, note, disclosure)', () => {
  it('renders control first, note above it, disclosure above the note', () => {
    registerWatchTarget(stubTarget());
    registerDiffContext(stubContext());
    setWatchNote('watching stopped'); // force the note to exist too

    expect(classesOf(buildWatchChrome(host()))).toEqual([
      WATCH_CONTROL_CLASS,
      WATCH_NOTE_CLASS,
      WATCH_DISCLOSURE_CLASS,
    ]);
  });
});

describe('the disclosure is REACTIVE and static (a gate reader, not a slot writer)', () => {
  it("re-evaluates its hidden state when the watch state changes — it is not frozen at build time", () => {
    // Built while the gate is CLOSED (watch available, no diff context): hidden.
    registerWatchTarget(stubTarget());
    const el = buildDisclosure();
    document.body.appendChild(el); // connected, so the liveness prune keeps it
    expect(el.hidden).toBe(true);

    // The second gate half becomes true. diffRegistry has no notifier of its own — a later watch
    // event is what re-runs the sync (mirrors how the note stays in sync). Firing one flips hidden.
    registerDiffContext(stubContext());
    setWatchNote(null); // any watch-state change → onWatchChanged → syncDisclosure

    expect(el.hidden).toBe(false);
  });

  it('carries STATIC copy naming on-device-only, never-uploaded, and where to manage it', () => {
    registerWatchTarget(stubTarget());
    registerDiffContext(stubContext());
    const text = buildDisclosure().textContent ?? '';
    // The truth conditions §3.6 requires the copy to satisfy (browser suite re-checks on the real
    // render chain; this is the fast structural pin).
    expect(text).toContain('this device only');
    expect(text).toContain('never uploaded');
    expect(text).toContain('Stored data');
  });
});

describe('resetWatchControlsForTest empties the disclosures set (task 3.1)', () => {
  it('a disclosure built before a reset is FORGOTTEN — a later watch event never re-syncs it', () => {
    registerWatchTarget(stubTarget());
    registerDiffContext(stubContext());
    const first = buildDisclosure();
    document.body.appendChild(first); // connected: were it still tracked, sync would touch it
    expect(first.hidden).toBe(false);

    resetWatchControlsForTest();

    // Close the gate, then build a fresh disclosure (which re-subscribes) and fire a watch event.
    // The new element reflects the now-closed gate; the pre-reset element is a distinct object and
    // stays as it was — proving it was dropped from the set, not merely left stale.
    resetDiffRegistryForTest();
    const second = buildDisclosure();
    document.body.appendChild(second);
    registerWatchTarget(stubTarget()); // onWatchChanged → syncDisclosure over the CURRENT set

    expect(second).not.toBe(first);
    expect(second.hidden).toBe(true); // fresh element sees the closed gate
    expect(first.hidden).toBe(false); // untouched: it is no longer in the set
  });
});

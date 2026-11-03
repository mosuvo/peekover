// D-11 — the REAL-ENGINE proof for task 6.3 (a displayed diff defers the re-render), Cr AND Fx.
//
// WHY THIS CANNOT BE A jsdom SUITE. `watchController.test.ts` proves the state machine over the
// `data-diff` attribute, and it does so by setting that attribute BY HAND — which is the honest way
// to test a contract stated in terms of the attribute, and is also exactly what leaves three things
// unproven:
//   • that the REAL affordance's gestures reach the attribute at all. jsdom never runs the picker →
//     `computeDiff` → `enterDiff` chain, so "the deferral fires when a user opens a comparison" is
//     an inference there and an observation here.
//   • that the reading column really STAYS on the comparison while the file changes underneath.
//     jsdom applies no cascade, so `display:none` on `.peekover-reader` is unobservable — the
//     assertion "the user is still looking at the diff" has no jsdom form.
//   • that the deferred render CAPTURES on exit. Capture writes to the engine's own IndexedDB; the
//     plan's D-11 verify calls this the second half of the decision, and says in as many words that
//     one half alone does not prove it.
//
// THE SURFACE IS THE APP PAGE, and only the app page. D-14 keeps the entire diff feature off the
// content script (no affordance, no view, no registry), so there is no diff there to defer against;
// that absence is an architectural fact already proven in diffChrome.browser.test.ts, and re-proving
// it here would be a second copy of someone else's assertion.
//
// THE WATCH IS HAND-DRIVEN (the snapshotCapture.browser precedent). What is under test is what the
// controller does with a change while a diff is up, not whether a poll timer eventually notices one
// — so the change arrives through the detector seam on command. Everything downstream of that is
// production: the real controller, the real `mount`, the real `enterDiff`/`exitDiff` reached through
// the real `showDiff`/`hideDiff` closures `appShell.installWatchForFile` provisions, the real
// capture path, and the real note channel.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { page } from 'vitest/browser';

import { mountAppShell, type AppStore } from '../../src/app/appShell';
import type { FolderSource } from '../../src/app/folderSource';
import type { ChangeDetector } from '../../src/watch/changeDetector';
import {
  createWatchController,
  CHANGED_AGAIN_NOTE,
} from '../../src/watch/watchController';
import {
  registerWatchTarget,
  resetWatchRegistryForTest,
  watchNote,
} from '../../src/watch/watchRegistry';
import { resetWatchControlsForTest, WATCH_NOTE_CLASS } from '../../src/watch/watchControl';
import { resetThemeHostsForTest } from '../../src/theme/themeRegistry';
import { resetThemeControlsForTest } from '../../src/theme/themeControl';
import {
  getDiffContext,
  isDiffContextRegistered,
  resetDiffRegistryForTest,
} from '../../src/render/diffRegistry';
import { DIFF_AFFORDANCE_CLASS, DIFF_PICKER_CLASS } from '../../src/render/diffChrome';
import { DIFF_VIEW_CLASS } from '../../src/render/diffView';
import { storeSnapshot, getSnapshotMeta, getSnapshotText } from '../../src/app/snapshots';
import { wipeAll, __resetConnectionForTest } from '../../src/app/store';

const NARROW = { width: 414, height: 896 };

const FILLER = Array.from(
  { length: 8 },
  (_, i) => `Paragraph ${i + 1}: lorem ipsum dolor sit amet, consectetur adipiscing elit.`,
).join('\n\n');

/** The saved snapshot — the diff's "before" side. */
const DOC_V1 = ['# Watched doc', FILLER, '## Section two', 'The line that was OLD in version one.'].join('\n\n');
/** What is on screen when the comparison is opened — the diff's "after" side. */
const DOC_V2 = ['# Watched doc', FILLER, '## Section two', 'The line that is NEW in version two.'].join('\n\n');
/** What the file becomes WHILE the comparison is open. Its marker appears nowhere else. */
const DOC_V3 = ['# Watched doc', FILLER, '## Section two', 'THIS ARRIVED WHILE THE COMPARISON WAS OPEN.'].join('\n\n');

// ── Harness ───────────────────────────────────────────────────────────────────────────────────

function fakeStore(): AppStore {
  return {
    putFolder: async () => undefined,
    deleteFolder: async () => undefined,
    putRecent: async () => undefined,
  };
}

/** A PERSISTABLE in-memory source — `persistable:true` is what makes the app page watchable, so
 *  `installWatchForFile` reaches its `registerDiffContext` site (2.1). */
function memorySource(name: string, text: string): FolderSource {
  return {
    name: 'docs',
    truncated: false,
    persistable: true,
    files: [{ path: name, name, read: async () => text }],
  };
}

/** A detector this suite drives by hand: `fire(text)` delivers a change on command. */
function handDriven(): { detector: ChangeDetector; fire: (text: string) => void } {
  let cb: ((text: string) => void) | null = null;
  return {
    detector: {
      start(next) {
        cb = next;
      },
      stop() {
        cb = null;
      },
    },
    fire: (text) => cb?.(text),
  };
}

async function waitFor<T>(fn: () => T | null | undefined | false, tries = 200): Promise<T> {
  for (let i = 0; i < tries; i += 1) {
    const v = fn();
    if (v) return v as T;
    await new Promise<void>((r) => setTimeout(r, 20));
  }
  throw new Error('waitFor timed out');
}

/** A macrotask settle long enough that a render which WAS going to happen has happened. Used for
 *  the negative assertions — "still on the diff" only means something after the loop had a turn. */
const settle = () => new Promise<void>((r) => setTimeout(r, 250));

const containers: HTMLElement[] = [];

const shadowOf = (host: HTMLElement) => host.shadowRoot!;
// KEEPS: the comparison is opened and closed by its control (C326, C327). RE-SPELLED at 013 task 4.5: on the app
// page Compare and its picker are the toolbar's (the reader mounts with `pills: false`).
const chromeOf = (host: HTMLElement): ParentNode => host.closest('.peekover-app')?.querySelector('.peekover-toolbar') ?? shadowOf(host);
const pillIn = (host: HTMLElement) =>
  chromeOf(host).querySelector<HTMLButtonElement>(`.${DIFF_AFFORDANCE_CLASS}`)!;
const pickerIn = (host: HTMLElement) =>
  chromeOf(host).querySelector<HTMLElement>(`.${DIFF_PICKER_CLASS}`)!;
const readerIn = (host: HTMLElement) =>
  shadowOf(host).querySelector<HTMLElement>('.peekover-reader')!;
const diffIn = (host: HTMLElement) =>
  shadowOf(host).querySelector<HTMLElement>(`.${DIFF_VIEW_CLASS}`);
// KEEPS: the watch note's text and visibility (C326, C327). RE-SPELLED at 013 task 4.5: on the app page the note is
// the notice area's (ruling A; the reader mounts with `pills: false`); elsewhere the reader's own.
const noteIn = (host: HTMLElement) =>
  (host.closest('.peekover-app')?.querySelector('.peekover-app__notices') ?? shadowOf(host)).querySelector<HTMLElement>(
    `.${WATCH_NOTE_CLASS}`,
  );

const isHidden = (el: HTMLElement) => getComputedStyle(el).display === 'none';

/** The visible explanation, or null when the note element is absent or `hidden`. */
function visibleNote(host: HTMLElement): string | null {
  const el = noteIn(host);
  if (!el || el.hidden) return null;
  return el.textContent;
}

async function snapshotsFor(docId: string): Promise<{ id: string; ts: number; bytes: number }[]> {
  const all = await getSnapshotMeta();
  return all.find((m) => m.docId === docId)?.entries ?? [];
}

/**
 * Poll for `want` snapshots, then RETURN WHATEVER IS THERE — it never throws.
 *
 * Deliberate: the capture write is fire-and-forget, so a wait is unavoidable, but a helper that
 * threw on timeout would red with "waitFor timed out" and say nothing about WHICH property broke.
 * Handing the count back to an `expect` with a message means the red-first mutation that removes
 * the exit flush reddens as *"the deferred render did not capture"*, which is the finding.
 */
async function snapshotsSettling(
  docId: string,
  want: number,
): Promise<{ id: string; ts: number; bytes: number }[]> {
  for (let i = 0; i < 80; i += 1) {
    const e = await snapshotsFor(docId);
    if (e.length >= want) return e;
    await new Promise<void>((r) => setTimeout(r, 20));
  }
  return snapshotsFor(docId);
}

interface Rig {
  host: HTMLElement;
  docId: string;
  fire: (text: string) => void;
}

/**
 * The app page, opened through the real gesture chain, with a hand-driven watch running on the
 * reader host and one snapshot already saved.
 *
 * The controller is built HERE rather than taken from `installWatchForFile` for one reason: its
 * detector must be drivable. Everything else is the production object — including the `docId`,
 * which is read back off the diff context the app page registered, so capture lands under exactly
 * the identity the picker is reading from.
 */
async function rig(): Promise<Rig> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  containers.push(container);
  const app = mountAppShell(container, {
    openFolder: async () => ({ ok: true, source: memorySource('doc.md', DOC_V2) }),
    store: fakeStore(),
  });
  await app.openFolder();
  container.querySelector<HTMLButtonElement>('[role="treeitem"][data-kind="file"]')!.click();
  const host = await waitFor(() =>
    container.querySelector<HTMLElement>('.peekover-app__reader__host'),
  );
  await waitFor(() => host.shadowRoot?.querySelector('.peekover-reader h1'));
  await waitFor(() => isDiffContextRegistered());

  const docId = getDiffContext()!.docId;
  await storeSnapshot(docId, DOC_V1); // one target for the picker to offer
  await waitFor(async () => (await getDiffContext()!.fetchMeta()).length > 0);

  const fake = handDriven();
  const controller = createWatchController({ detector: fake.detector, docId, contained: true });
  registerWatchTarget(controller); // last-write-wins, exactly as documented on the registry
  controller.start(host);

  return { host, docId, fire: fake.fire };
}

/** Open the comparison through the real affordance: pill → picker → the one saved snapshot. */
async function openComparison(host: HTMLElement): Promise<void> {
  pillIn(host).click();
  await waitFor(() => (pickerIn(host).hidden ? null : pickerIn(host)));
  pickerIn(host).querySelector<HTMLButtonElement>('[role="option"]')!.click();
  await waitFor(() => host.getAttribute('data-diff') === 'active');
}

beforeEach(async () => {
  resetDiffRegistryForTest();
  resetWatchRegistryForTest();
  resetWatchControlsForTest();
  resetThemeHostsForTest();
  resetThemeControlsForTest();
  await wipeAll();
  document.body.replaceChildren();
});

afterEach(async () => {
  __resetConnectionForTest();
  resetWatchRegistryForTest();
  resetWatchControlsForTest();
  for (const c of containers.splice(0)) c.remove();
  document.body.replaceChildren();
  await page.viewport(NARROW.width, NARROW.height);
});

describe('D-11 — a change arriving during a displayed diff is deferred, not shown (task 6.3)', () => {
  it('holds the comparison on screen, then shows the change AND says so on exit — and captures', async () => {
    const { host, docId, fire } = await rig();
    await openComparison(host);

    // Ground truth before the change: the real view is up, the reading column is hidden by CSS,
    // and the reader is looking at a comparison they asked for.
    expect(diffIn(host)).not.toBeNull();
    expect(isHidden(readerIn(host))).toBe(true);
    expect(readerIn(host).textContent).toContain('NEW in version two');
    expect(visibleNote(host)).toBeNull();
    const before = await snapshotsFor(docId);
    expect(before).toHaveLength(1); // the seeded V1 — the count below is a real delta

    // ── THE FILE CHANGES UNDERNEATH THE COMPARISON ────────────────────────────────────────────
    fire(DOC_V3);
    await settle(); // a render that was going to happen has had every chance to

    // HALF ONE OF THE DECISION: the comparison was NOT replaced. All four ways of asking.
    expect(host.getAttribute('data-diff'), 'the diff was torn down').toBe('active');
    expect(diffIn(host), 'the diff view was removed').not.toBeNull();
    expect(isHidden(readerIn(host)), 'the reading column came back over the diff').toBe(true);
    expect(
      readerIn(host).textContent,
      'the reading column was re-rendered underneath the diff',
    ).not.toContain('ARRIVED WHILE THE COMPARISON WAS OPEN');
    // ...and nothing was said yet: the line belongs to the exit, not to the deferral.
    expect(visibleNote(host)).toBeNull();

    // ── THE READER CLOSES THE COMPARISON ──────────────────────────────────────────────────────
    pillIn(host).click(); // the 6.2 exit gesture — the pill reading "Close comparison"
    await waitFor(() => !host.hasAttribute('data-diff'));
    await settle();

    // HALF TWO: the withheld change is now on screen, and the reader is TOLD it happened.
    expect(isHidden(readerIn(host))).toBe(false);
    expect(diffIn(host)).toBeNull();
    expect(
      readerIn(host).textContent,
      'the withheld change never reached the reader — the exit flush did not run',
    ).toContain('ARRIVED WHILE THE COMPARISON WAS OPEN');
    expect(readerIn(host).textContent).not.toContain('NEW in version two');
    expect(readerIn(host).querySelector('h1')).not.toBeNull(); // a document, not a blank page
    expect(watchNote()).toBe(CHANGED_AGAIN_NOTE);
    expect(visibleNote(host), 'the line never reached the chrome').toBe(CHANGED_AGAIN_NOTE);

    // HALF THREE (plan §0 D-11's "nothing is lost"): the deferred render captured normally, and
    // what it captured is the state that WAS on screen — V2, the document the reader left.
    const after = await snapshotsSettling(docId, 2);
    expect(after, 'the deferred render did not capture the state that was on screen').toHaveLength(2);
    const texts = await Promise.all(after.map((e) => getSnapshotText(e.id)));
    expect(texts).toContain(DOC_V2); // the on-screen state at exit, captured
    expect(texts).toContain(DOC_V1); // the seeded one, untouched
  });

  it('says NOTHING when nothing changed: exit restores the same document, no line, no snapshot', async () => {
    // NON-VACUITY FOR THE LINE ITSELF. The deferral is invisible when nothing arrives, and a
    // "changed again" sentence on every exit would be copy about an event that did not happen —
    // the same dishonesty the decision exists to remove, pointed the other way.
    const { host, docId, fire } = await rig();
    void fire; // deliberately never fired: this is the no-change case
    await openComparison(host);
    expect(diffIn(host)).not.toBeNull();

    pillIn(host).click();
    await waitFor(() => !host.hasAttribute('data-diff'));
    await settle();

    expect(isHidden(readerIn(host))).toBe(false);
    expect(readerIn(host).textContent).toContain('NEW in version two'); // exactly what they left
    expect(visibleNote(host)).toBeNull();
    expect(watchNote()).toBeNull();
    // No render happened, so no capture happened either — still just the seeded snapshot.
    expect(await snapshotsFor(docId)).toHaveLength(1);
  });
});

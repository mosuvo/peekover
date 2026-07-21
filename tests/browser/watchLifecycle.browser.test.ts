// Watch lifecycle — the REAL-ENGINE proof (spec 005 task 4.3), Chromium AND Firefox.
//
// Three properties, and the first is a REAL BUG the design prevents rather than an edge case.
//
// ── 1. SWITCHING DOCUMENTS STOPS THE PREVIOUS WATCH ────────────────────────────────────────
//
// `readerPane.select()` re-mounts ONE SHARED HOST for every file, and the watch controller holds
// that same host. A watch left running over file A would keep re-rendering A's freshly-read text
// into the host that is now showing B — so the reader silently displays A's content under B's
// name, with no error and no clue. That is the silent-wrong-answer class this milestone has
// already met twice (003's mis-resolved scroll root; 3.2's clamped scroll), and it is the reason
// this test drives the REAL `readerPane` rather than a hand-rolled mount.
//
// The assertion is deliberately in TWO parts, because the first alone would be weak: the detector
// is stopped (the mechanism), AND a subsequent change to A produces no re-render of B (the
// consequence a user would actually experience). A stop that happened but left a live callback
// would pass the first and fail the second.
//
// ── 2. A DEAD READ SURFACES A DESIGNED STATE, WITH THE LAST GOOD RENDER STILL ON SCREEN ────
//
// Never retry forever, never fail silently, never blank (spec §4, AGENTS.md #5). The note arrives
// with NO re-render, which is exactly what keeps the last good render in place — so this asserts
// the document is still there, not merely that a message appeared.
//
// ── 3. NOTHING WATCHES UNTIL THE CONTROL IS CLICKED ────────────────────────────────────────
//
// Watching is a user gesture (spec §4 Trust). A plain mount must start no detector at all.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mount } from '../../src/render/mount';
import { createReaderPane } from '../../src/app/readerPane';
import { createWatchController, DEAD_AFTER_FAILURES } from '../../src/watch/watchController';
import {
  registerWatchTarget,
  resetWatchRegistryForTest,
  setWatchNote,
  watchNote,
  watchAvailable,
} from '../../src/watch/watchRegistry';
import {
  watchCapability,
  FIREFOX_CONTENT_SCRIPT_NOTE,
  FIREFOX_PICKER_NOTE,
  REMOTE_DOCUMENT_NOTE,
} from '../../src/watch/watchAvailability';
import { resetWatchControlsForTest } from '../../src/watch/watchControl';
import { resetThemeHostsForTest } from '../../src/theme/themeRegistry';
import { resetThemeControlsForTest } from '../../src/theme/themeControl';
import { setThemeSetting, resetThemeWatchForTest } from '../../src/theme/reader';
import type { ChangeDetector } from '../../src/watch/changeDetector';

const DOC_A = '# File A\n\nThe first document.\n\n## A section\n\nBody text for A.\n';
const DOC_B = '# File B\n\nThe second document.\n\n## B section\n\nBody text for B.\n';

/** A detector this suite drives by hand, recording start/stop so the MECHANISM is observable
 *  alongside its consequence. */
function handDriven(): {
  detector: ChangeDetector;
  fire: (text: string) => void;
  failRead: () => void;
  started: number;
  stopped: number;
  live: boolean;
} {
  let cb: ((text: string) => void) | null = null;
  let err: ((cause: unknown) => void) | null = null;
  const state = { started: 0, stopped: 0 };
  return {
    detector: {
      start(next, onError) {
        state.started += 1;
        cb = next;
        err = onError ?? null;
      },
      stop() {
        state.stopped += 1;
        cb = null;
        err = null;
      },
    },
    fire: (text) => cb?.(text),
    failRead: () => err?.(new Error('ENOENT: no such file')),
    get started() {
      return state.started;
    },
    get stopped() {
      return state.stopped;
    },
    /** Is a callback still wired? The honest read of "did the stop actually disconnect it". */
    get live() {
      return cb !== null;
    },
  };
}

function shadowOf(host: HTMLElement): ShadowRoot {
  const shadow = host.shadowRoot;
  if (!shadow) throw new Error('host has no shadow root');
  return shadow;
}

const controlIn = (host: HTMLElement) =>
  shadowOf(host).querySelector<HTMLButtonElement>('.peekover-watch');
const noteIn = (host: HTMLElement) =>
  shadowOf(host).querySelector<HTMLElement>('.peekover-watch-note');
const columnText = (host: HTMLElement) =>
  shadowOf(host).querySelector<HTMLElement>('.peekover-reader')?.textContent ?? '';

async function waitFor<T>(fn: () => T | null | undefined, tries = 100): Promise<T> {
  for (let i = 0; i < tries; i += 1) {
    const v = fn();
    if (v) return v;
    await new Promise<void>((r) => setTimeout(r, 20));
  }
  throw new Error('waitFor timed out');
}

beforeEach(() => {
  resetWatchRegistryForTest();
  resetWatchControlsForTest();
  resetThemeHostsForTest();
  resetThemeControlsForTest();
  resetThemeWatchForTest();
  setThemeSetting('auto');
  document.body.replaceChildren();
});

afterEach(() => {
  resetWatchRegistryForTest();
  resetWatchControlsForTest();
  resetThemeHostsForTest();
  resetThemeControlsForTest();
  document.body.replaceChildren();
});

// ── 1. The cross-feed bug ──────────────────────────────────────────────────────────────────

describe('watch lifecycle — switching documents stops the previous watch (task 4.3)', () => {
  it("stops A's detector on select(B), and A's later change does NOT re-render B", async () => {
    const fake = handDriven();
    registerWatchTarget(createWatchController({ detector: fake.detector, contained: true }));

    // The REAL app-page reader pane, in a scrolling wrapper exactly as appShell provides.
    const pane = createReaderPane(document);
    pane.element.style.cssText = 'display:block;overflow:auto;height:80vh;width:100%';
    document.body.appendChild(pane.element);

    await pane.select({ name: 'a.md', read: async () => DOC_A });
    const host = await waitFor(() =>
      pane.element.querySelector<HTMLElement>('.peekover-app__reader__host'),
    );
    expect(columnText(host)).toContain('File A');

    // Start watching A through the real control — the user gesture.
    controlIn(host)!.click();
    expect(fake.started).toBe(1);
    expect(fake.live).toBe(true);

    // The user opens a DIFFERENT file in the same pane.
    await pane.select({ name: 'b.md', read: async () => DOC_B });
    expect(columnText(host)).toContain('File B');

    // (a) THE MECHANISM: A's detector really was stopped, and its callback disconnected.
    expect(fake.stopped).toBe(1);
    expect(fake.live).toBe(false);

    // (b) THE CONSEQUENCE: A changes on disk. Nothing must reach B's reader. Without the stop,
    // this fires A's text into the host now showing B — file A's content under file B's name.
    fake.fire('# File A\n\nA was edited after the switch.\n');

    expect(columnText(host)).toContain('File B');
    expect(columnText(host)).not.toContain('A was edited after the switch');
  });

  it('the switch also clears the watching state from the host and the control', async () => {
    const fake = handDriven();
    registerWatchTarget(createWatchController({ detector: fake.detector, contained: true }));

    const pane = createReaderPane(document);
    pane.element.style.cssText = 'display:block;overflow:auto;height:80vh;width:100%';
    document.body.appendChild(pane.element);

    await pane.select({ name: 'a.md', read: async () => DOC_A });
    const host = await waitFor(() =>
      pane.element.querySelector<HTMLElement>('.peekover-app__reader__host'),
    );
    controlIn(host)!.click();
    expect(host.getAttribute('data-watch')).toBe('active');

    await pane.select({ name: 'b.md', read: async () => DOC_B });

    // A control still reading "Watching" over a stopped watch is its own small lie.
    expect(host.hasAttribute('data-watch')).toBe(false);
    expect(controlIn(host)!.getAttribute('aria-pressed')).toBe('false');
  });
});

// ── 2. The dead read ───────────────────────────────────────────────────────────────────────

describe('watch lifecycle — a dead read surfaces a designed state (task 4.3)', () => {
  it('stops the watch and explains, WITH the last good render still on screen', () => {
    const fake = handDriven();
    registerWatchTarget(createWatchController({ detector: fake.detector }));

    const host = document.createElement('peekover-root');
    document.body.appendChild(host);
    mount(DOC_A, host);
    controlIn(host)!.click();
    expect(noteIn(host)!.hidden).toBe(true); // nothing to explain while all is well

    // A read fails, but not enough times to be dead — a file mid-rewrite must not kill the watch.
    for (let i = 0; i < DEAD_AFTER_FAILURES - 1; i += 1) fake.failRead();
    expect(fake.stopped).toBe(0);
    expect(noteIn(host)!.hidden).toBe(true);

    // ...and now it is genuinely gone.
    fake.failRead();

    // NEVER RETRY FOREVER: the watch stopped.
    expect(fake.stopped).toBe(1);
    expect(host.hasAttribute('data-watch')).toBe(false);
    // NEVER FAIL SILENTLY: a plain-language explanation, as a polite live region.
    const note = noteIn(host)!;
    expect(note.hidden).toBe(false);
    expect(note.getAttribute('role')).toBe('status');
    expect(note.textContent).toContain('could not be read');
    expect(note.textContent).toMatch(/moved, renamed, or deleted/);
    // NEVER BLANK (AGENTS.md #5): the last good render is untouched — the note arrived with no
    // re-render at all, which is the whole reason it is chrome and not a mount.
    expect(columnText(host)).toContain('The first document');
    // ...and the toggle STAYS, because retrying is the user's call.
    expect(controlIn(host)).toBeTruthy();
  });

  it('a good read clears the failure streak — only CONSECUTIVE failures are fatal', () => {
    const fake = handDriven();
    registerWatchTarget(createWatchController({ detector: fake.detector }));
    const host = document.createElement('peekover-root');
    document.body.appendChild(host);
    mount(DOC_A, host);
    controlIn(host)!.click();

    for (let i = 0; i < DEAD_AFTER_FAILURES - 1; i += 1) fake.failRead();
    fake.fire(DOC_B); // the file came back
    for (let i = 0; i < DEAD_AFTER_FAILURES - 1; i += 1) fake.failRead();

    // Without the reset, these 2N-2 failures would have crossed the threshold and killed a watch
    // that is demonstrably still working.
    expect(fake.stopped).toBe(0);
    expect(watchNote()).toBeNull();
  });

  it('restarting the watch clears a stale explanation', () => {
    const fake = handDriven();
    registerWatchTarget(createWatchController({ detector: fake.detector }));
    const host = document.createElement('peekover-root');
    document.body.appendChild(host);
    mount(DOC_A, host);

    controlIn(host)!.click();
    for (let i = 0; i < DEAD_AFTER_FAILURES; i += 1) fake.failRead();
    expect(noteIn(host)!.hidden).toBe(false);

    controlIn(host)!.click(); // the user tries again

    // A "stopped watching" note sitting over a watch that IS running would be a lie about the
    // current state — the exact honesty failure this whole task is about, inverted.
    expect(noteIn(host)!.hidden).toBe(true);
    expect(host.getAttribute('data-watch')).toBe('active');
  });
});

// ════ TASK 4.4 — the Firefox degraded state, on BOTH closed routes ═════════════════════════
//
// PRECONDITION SATISFIED: 2.3's answer is recorded in docs/ai/decisions.md (2026-07-19) and it
// took the NEGATIVE branch — Firefox 152's background THREW on `fetch("file:///…")` with a Gecko
// URI security error that no permission grants. So this covers BOTH Firefox cases, not one:
// (a) the app page opened via the FILE INPUT, and (b) the content-script `file://` reader.
//
// WHAT THESE TESTS PROVE, AND WHAT THEY CANNOT. They prove the reader presents the EXPLANATION
// state rather than a silently inert button, and — the failure mode that actually matters here —
// that the degraded state does NOT leak into the working engine. They do NOT prove the copy reads
// as honest rather than broken; that is human-gate 7.1 and is deliberately not attempted.
//
// The DECISION is driven through the production `watchCapability` seam rather than by faking an
// engine, so these run identically on Chromium and Firefox: what is being exercised is the code
// path each engine's build takes, which is exactly what a per-engine constant makes testable.

describe('watch degraded state — the Firefox routes (task 4.4)', () => {
  /** Put the reader in the state a given surface's decision produces, then mount. */
  function mountUnder(decision: { watchable: boolean; note: string | null }): HTMLElement {
    if (decision.watchable) {
      registerWatchTarget(createWatchController({ detector: handDriven().detector }));
    }
    setWatchNote(decision.note);
    const host = document.createElement('peekover-root');
    document.body.appendChild(host);
    mount(DOC_A, host);
    return host;
  }

  it('(b) the Firefox content-script reader EXPLAINS, and offers no toggle at all', () => {
    const host = mountUnder(
      watchCapability({
        surface: 'content-script',
        backgroundCanReadFileUrls: false,
        documentIsWatchableFile: true,
      }),
    );

    // NOT a disabled control and NOT a dead toggle — there is no button to mislead anyone.
    expect(controlIn(host)).toBeNull();
    const note = noteIn(host)!;
    expect(note).toBeTruthy();
    expect(note.hidden).toBe(false);
    expect(note.getAttribute('role')).toBe('status');
    expect(note.textContent).toBe(FIREFOX_CONTENT_SCRIPT_NOTE);
    // AGENTS.md #5: the document renders normally. A degraded watch degrades WATCH, nothing else.
    expect(columnText(host)).toContain('The first document');
  });

  it('(a) the Firefox file-input app page EXPLAINS, and offers no toggle at all', () => {
    const host = mountUnder(
      watchCapability({ surface: 'app-page', persistable: false, route: 'picker' }),
    );

    expect(controlIn(host)).toBeNull();
    expect(noteIn(host)!.textContent).toBe(FIREFOX_PICKER_NOTE);
    expect(columnText(host)).toContain('The first document');
  });

  it('the DRAGGED Firefox folder is NOT degraded — it watches, with no note', () => {
    // The non-vacuity of the two tests above: if everything non-persistable were degraded, they
    // would pass while proving only that the note mechanism works. This is the same
    // `persistable:false` input taking the OTHER branch, so the explanation is demonstrably
    // specific to the route that genuinely cannot re-read.
    const host = mountUnder(
      watchCapability({ surface: 'app-page', persistable: false, route: 'drop' }),
    );

    expect(controlIn(host)).toBeTruthy();
    expect(noteIn(host)!.hidden).toBe(true);
  });

  it('(c) a REMOTE http(s) raw document EXPLAINS with the scope note — no toggle, NO detector', () => {
    // The other half of the content script's `matches` — raw.githubusercontent / gist / gitlab-raw /
    // bitbucket-raw. Watching remote is out of scope (spec §6), so the reader shows the scope note,
    // NOT a live-looking control the relay refuses every tick (the dead-toggle §4 forbids).
    const decision = watchCapability({
      surface: 'content-script',
      backgroundCanReadFileUrls: true,
      documentIsWatchableFile: false,
    });
    const host = mountUnder(decision);

    // No toggle — and, because the decision is not watchable, `mountUnder` registered NO target, EXACTLY
    // as production's peekover.content.ts registers a detector ONLY in the `watch.watchable` branch. So a
    // remote page runs no detector, no polling loop, and issues no per-second refused relay message.
    expect(controlIn(host)).toBeNull();
    expect(watchAvailable()).toBe(false);
    const note = noteIn(host)!;
    expect(note.hidden).toBe(false);
    expect(note.getAttribute('role')).toBe('status');
    expect(note.textContent).toBe(REMOTE_DOCUMENT_NOTE);
    // AGENTS.md #5: the document itself renders normally — only WATCH degrades, nothing else.
    expect(columnText(host)).toContain('The first document');
  });

  it('the remote scope note and the Firefox limit note are NOT interchangeable (render level)', () => {
    // Each surface renders its OWN note. Swapping the two in the decision (the red-first mutation)
    // makes exactly this assertion — and the two surface-specific tests above — fail.
    const remote = noteIn(
      mountUnder(
        watchCapability({
          surface: 'content-script',
          backgroundCanReadFileUrls: true,
          documentIsWatchableFile: false,
        }),
      ),
    )!.textContent;
    resetWatchRegistryForTest();
    resetWatchControlsForTest();
    const firefoxLocal = noteIn(
      mountUnder(
        watchCapability({
          surface: 'content-script',
          backgroundCanReadFileUrls: false,
          documentIsWatchableFile: true,
        }),
      ),
    )!.textContent;
    expect(remote).toBe(REMOTE_DOCUMENT_NOTE);
    expect(firefoxLocal).toBe(FIREFOX_CONTENT_SCRIPT_NOTE);
    expect(remote).not.toBe(firefoxLocal);
  });

  it('CHROMIUM IS UNAFFECTED — the normal control still renders on both surfaces', () => {
    // THE FAILURE MODE THIS TASK IS MOST AT RISK OF: a degraded state leaking into the working
    // engine. Asserted for both of Chromium's surfaces.
    const contentScript = mountUnder(
      watchCapability({
        surface: 'content-script',
        backgroundCanReadFileUrls: true,
        documentIsWatchableFile: true,
      }),
    );
    expect(controlIn(contentScript)).toBeTruthy();
    expect(controlIn(contentScript)!.getAttribute('aria-pressed')).toBe('false');
    expect(noteIn(contentScript)!.hidden).toBe(true);

    resetWatchRegistryForTest();
    resetWatchControlsForTest();

    const appPage = mountUnder(
      watchCapability({ surface: 'app-page', persistable: true, route: 'picker' }),
    );
    expect(controlIn(appPage)).toBeTruthy();
    expect(noteIn(appPage)!.hidden).toBe(true);
  });
});

// ── 3. Nothing watches by default ──────────────────────────────────────────────────────────

describe('watch lifecycle — watching is a user gesture (task 4.3)', () => {
  it('a plain mount starts NO detector', () => {
    const fake = handDriven();
    registerWatchTarget(createWatchController({ detector: fake.detector }));

    const host = document.createElement('peekover-root');
    document.body.appendChild(host);
    mount(DOC_A, host);

    // The control exists and is offered; nothing is running behind it.
    expect(controlIn(host)).toBeTruthy();
    expect(fake.started).toBe(0);
    expect(fake.live).toBe(false);
    expect(host.hasAttribute('data-watch')).toBe(false);
  });

  it('re-rendering a reader repeatedly still starts nothing', () => {
    const fake = handDriven();
    registerWatchTarget(createWatchController({ detector: fake.detector }));
    const host = document.createElement('peekover-root');
    document.body.appendChild(host);

    mount(DOC_A, host);
    mount(DOC_B, host);
    mount(DOC_A, host, { preserveReading: true });

    expect(fake.started).toBe(0);
  });
});

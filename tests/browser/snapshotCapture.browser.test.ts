// Snapshot capture — the REAL-ENGINE proof (M6 task 1.4), Chromium AND Firefox.
//
// Capture is jsdom-blind in the ways that matter: it writes to the engine's OWN IndexedDB (jsdom's
// is a different implementation), and its correctness is "what actually landed on disk," a
// real-engine fact. So the capture path — controller → renderNow → storeSnapshot → the real
// snapshotMeta + snapshots stores — is proven here, non-vacuously, on both engines.
//
// Capture is APP-PAGE-ONLY BY DESIGN (§3.2): the guard is `docId != null`, and the content script
// passes `null`. So the app-page path (a controller carrying a constructed docId) is one suite, and
// the content-script ABSENCE is proven through the PRODUCTION `installContentWatch` path with a live
// positive control in the same test — a capture that DID happen when a docId is present, so the
// empty-stores assertion is a real observation, not a broken instrument.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
// 5.8: read the zero only after a later request has landed (helpers/diagramWindow.ts).
import { isSentinel, wireSettled } from './helpers/diagramWindow';
import { mount } from '../../src/render/mount';
import { createWatchController } from '../../src/watch/watchController';
import { installContentWatch } from '../../src/watch/contentWatch';
import { resetWatchRegistryForTest, isWatching } from '../../src/watch/watchRegistry';
import { resetWatchControlsForTest } from '../../src/watch/watchControl';
import { resetThemeHostsForTest } from '../../src/theme/themeRegistry';
import { resetThemeControlsForTest } from '../../src/theme/themeControl';
import {
  storeSnapshot,
  getSnapshotMeta,
  getSnapshotText,
  SNAPSHOT_COUNT_PER_DOC,
} from '../../src/app/snapshots';
import { wipeAll, describeStored, __resetConnectionForTest } from '../../src/app/store';
import { SEP } from '../../src/app/recents';
import { WATCH_READ, type WatchMessage } from '../../src/watch/watchRelay';
import type { ChangeDetector } from '../../src/watch/changeDetector';

const FOLDER_ID = 'f-capture-1';
const DOC_PATH = 'notes/a.md';
const DOC_ID = FOLDER_ID + SEP + DOC_PATH; // exactly as appShell.installWatchForFile builds it

const DOC_A = '# Version A\n\nalpha body text.\n';
const DOC_B = '# Version B\n\nbravo body text.\n';
const DOC_C = '# Version C\n\ncharlie body text.\n';

/** A detector this suite drives by hand (the watchLifecycle precedent): `fire(text)` delivers a
 *  change, so `renderNow` runs on command instead of on a real poll timer. */
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

/** A stand-in for the background relay (the watchContentWiring precedent): answers the real
 *  `WATCH_READ` wire shape so `relayRead`/`pollingDetector` are production code under test. */
function fakeBackground(initial: string): {
  send: (m: WatchMessage) => Promise<unknown>;
  write: (t: string) => void;
} {
  let text = initial;
  return {
    send: async (m) => {
      expect(m.type).toBe(WATCH_READ);
      return { ok: true, text };
    },
    write: (t) => {
      text = t;
    },
  };
}

function makeHost(tag: string): HTMLElement {
  const host = document.createElement(tag);
  document.body.appendChild(host);
  return host;
}

async function waitFor<T>(fn: () => T | null | undefined | false, tries = 200): Promise<T> {
  for (let i = 0; i < tries; i += 1) {
    const v = fn();
    if (v) return v as T;
    await new Promise<void>((r) => setTimeout(r, 20));
  }
  throw new Error('waitFor timed out');
}

/** Async variant — AWAITS the predicate each tick (a Promise is always truthy, so the sync waitFor
 *  above would return before the IDB read resolved). Used for the fire-and-forget capture writes. */
async function waitForAsync<T>(fn: () => Promise<T | null | undefined | false>, tries = 200): Promise<T> {
  for (let i = 0; i < tries; i += 1) {
    const v = await fn();
    if (v) return v as T;
    await new Promise<void>((r) => setTimeout(r, 20));
  }
  throw new Error('waitForAsync timed out');
}

/** A macrotask + rAF + settle — long enough that any request fired during the window has reached
 *  the Resource Timing buffer (mirrors wipe.browser.test.ts's flush). */
function flushNet(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => requestAnimationFrame(() => setTimeout(resolve, 60)), 120);
  });
}

async function metaFor(docId: string): Promise<{ id: string; ts: number; bytes: number }[]> {
  const all = await getSnapshotMeta();
  return all.find((m) => m.docId === docId)?.entries ?? [];
}

beforeEach(async () => {
  resetWatchRegistryForTest();
  resetWatchControlsForTest();
  resetThemeHostsForTest();
  resetThemeControlsForTest();
  await wipeAll(); // start from durably-empty snapshot stores (wipeAll clears them, task 1.4)
  document.body.replaceChildren();
});

afterEach(() => {
  __resetConnectionForTest();
  resetWatchRegistryForTest();
  resetWatchControlsForTest();
  resetThemeHostsForTest();
  resetThemeControlsForTest();
  document.body.replaceChildren();
});

describe('snapshot capture — the app-page controller writes the outgoing source (task 1.4)', () => {
  it('a watched re-render captures the OUTGOING document, readable and byte-exact', async () => {
    const fake = handDriven();
    const controller = createWatchController({ detector: fake.detector, docId: DOC_ID, contained: true });
    const host = makeHost('div');
    mount(DOC_A, host); // A on screen → registered in the reader-source WeakMap
    controller.start(host);

    // The file changes to B: renderNow reads the OUTGOING (A), renders B, and captures A.
    fake.fire(DOC_B);
    const entries = await waitForAsync(async () => {
      const e = await metaFor(DOC_ID);
      return e.length > 0 ? e : null;
    });

    // Exactly one snapshot, under the constructed docId, and its CONTENT is the outgoing source A —
    // not B, and not empty (non-vacuous: the row is READABLE and byte-exact).
    expect(entries).toHaveLength(1);
    expect(entries[0].bytes).toBe(new TextEncoder().encode(DOC_A).length);
    expect(await getSnapshotText(entries[0].id)).toBe(DOC_A);
  });

  it('a CRLF-only change stores NOTHING; a content change stores exactly one (D-5 at capture)', async () => {
    const fake = handDriven();
    const controller = createWatchController({ detector: fake.detector, docId: DOC_ID, contained: true });
    const host = makeHost('div');

    // Build a CRLF twin of A from EXPLICIT \r\n escapes (no fixture in the tree is CRLF — §3-6).
    const A_LF = 'line one\nline two\nline three\n';
    const A_CRLF = 'line one\r\nline two\r\nline three\r\n';
    mount(A_LF, host);
    controller.start(host);

    // Only the line endings differ ⇒ normalise(outgoing) === normalise(incoming) ⇒ no snapshot.
    fake.fire(A_CRLF);
    await new Promise((r) => setTimeout(r, 120)); // give a (wrongly) fired write time to land
    expect(await metaFor(DOC_ID)).toHaveLength(0);

    // NON-VACUOUS, same test: a genuine CONTENT change DOES produce exactly one snapshot — proving
    // the zero above is the normalise short-circuit, not a dead capture path. (The outgoing now on
    // screen is A_CRLF; firing B captures it.)
    fake.fire(DOC_B);
    const entries = await waitForAsync(async () => {
      const e = await metaFor(DOC_ID);
      return e.length > 0 ? e : null;
    });
    expect(entries).toHaveLength(1);
    expect(await getSnapshotText(entries[0].id)).toBe(A_CRLF);
  });
});

describe('snapshot capture — the content-script surface captures NOTHING (§3.2)', () => {
  it('installContentWatch (docId null) re-renders but stores no snapshot; a docId controller would', async () => {
    // PRODUCTION content-script path: installContentWatch builds and registers the real controller,
    // which passes docId:null. A change re-renders but must capture nothing.
    const bg = fakeBackground(DOC_A);
    installContentWatch({ url: 'file:///tmp/watched.md', send: bg.send, backgroundCanReadFileUrls: true, intervalMs: 30 });
    const host = makeHost('peekover-root');
    mount(DOC_A, host);
    const pill = host.shadowRoot!.querySelector<HTMLButtonElement>('.peekover-watch')!;
    pill.click();
    expect(isWatching()).toBe(true);

    // Let the pollingDetector take its SILENT baseline read of A first (it has no onText on the
    // first read — the observerDetector header notes the contrast). Writing B before the baseline
    // would baseline B and never see a change. 100ms covers several 30ms poll intervals.
    await new Promise((r) => setTimeout(r, 100));
    bg.write(DOC_B); // the file changes → a poll re-renders B, outgoing A
    await waitFor(() => host.shadowRoot?.querySelector('.peekover-reader')?.textContent?.includes('Version B'));
    await new Promise((r) => setTimeout(r, 120)); // let any (wrong) capture write land

    // NOTHING captured on the content script — both snapshot stores are empty.
    expect(await getSnapshotMeta()).toEqual([]);

    // NON-VACUITY: the SAME harness, driving an app-page controller with a docId over the SAME
    // re-render, DOES capture — so the empty above is a real absence, not a broken observer.
    const fake = handDriven();
    const appController = createWatchController({ detector: fake.detector, docId: DOC_ID, contained: true });
    const appHost = makeHost('div');
    mount(DOC_A, appHost);
    appController.start(appHost);
    fake.fire(DOC_C);
    const entries = await waitForAsync(async () => {
      const e = await metaFor(DOC_ID);
      return e.length > 0 ? e : null;
    });
    expect(entries).toHaveLength(1);
    expect(await getSnapshotText(entries[0].id)).toBe(DOC_A);
  });
});

describe('snapshot capture — zero network across capture + eviction (task 1.4)', () => {
  it('capturing and evicting fire ZERO http(s) requests; a control fetch proves the observer sees them', async () => {
    performance.clearResourceTimings();

    // A real render-driven capture...
    const fake = handDriven();
    const controller = createWatchController({ detector: fake.detector, docId: DOC_ID, contained: true });
    const host = makeHost('div');
    mount(DOC_A, host);
    controller.start(host);
    fake.fire(DOC_B);
    await waitForAsync(async () => (await metaFor(DOC_ID)).length > 0);

    // ...then enough direct captures to a second doc to force at least one EVICTION (count is
    // per-document, D-16). cap+1 writes ⇒ the store settles at exactly `cap` entries.
    const evictDoc = FOLDER_ID + SEP + 'notes/big.md';
    for (let i = 0; i <= SNAPSHOT_COUNT_PER_DOC; i += 1) {
      await storeSnapshot(evictDoc, `# state ${i}\n\nbody ${i}\n`);
    }
    await wireSettled();

    // NON-VACUOUS eviction: the per-doc count bound held (cap+1 written, cap kept).
    expect(await metaFor(evictDoc)).toHaveLength(SNAPSHOT_COUNT_PER_DOC);

    // GROUND TRUTH: not one http(s) request on the wire for capture or eviction (IndexedDB is
    // on-device). The predicate is the shipped /^https?:/i, VERBATIM.
    const networked = performance
      .getEntriesByType('resource')
      .map((e) => e.name)
      .filter((name) => /^https?:/i.test(name) && !isSentinel(name));
    expect(networked).toEqual([]);

    // NON-VACUOUS: a control same-origin fetch DOES land in the buffer, so the zero-count is a real
    // observation, not a broken observer (the remoteMedia flake is why the control is proven live).
    const probe = new URL(`/__peekover_snapshot_probe__/${Date.now()}.txt`, location.origin).href;
    await fetch(probe).catch(() => undefined);
    await flushNet();
    const afterProbe = performance
      .getEntriesByType('resource')
      .map((e) => e.name)
      .filter((name) => /^https?:/i.test(name) && !isSentinel(name));
    expect(afterProbe).toContain(probe);
  });
});

describe('snapshot capture — wipeAll erases snapshots and the panel then reports none (task 1.4, Piece 7)', () => {
  it('seeds a snapshot, wipeAll clears both stores, and describeStored shows no snapshot line', async () => {
    await storeSnapshot(DOC_ID, DOC_A);
    const seeded = await metaFor(DOC_ID);
    expect(seeded).toHaveLength(1); // really there — the wipe below is non-vacuous
    const beforeSummary = await describeStored();
    expect(beforeSummary.snapshots.count).toBe(1);
    expect(beforeSummary.lines.join(' ')).toMatch(/1 snapshot of 1 watched document/);

    await wipeAll();

    // Both snapshot stores are empty AND the panel accounts for it: no snapshot line, zero count.
    expect(await getSnapshotMeta()).toEqual([]);
    expect(await getSnapshotText(seeded[0].id)).toBeUndefined();
    const afterSummary = await describeStored();
    expect(afterSummary.snapshots).toEqual({ count: 0, docs: 0, bytes: 0 });
    expect(afterSummary.lines.join(' ')).not.toMatch(/snapshot/i);
  });
});

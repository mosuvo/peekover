// Capture off-switch — the REAL-ENGINE proof (M6 task 1.5, D-12), Chromium AND Firefox.
//
// D-12's off-switch has two seams, and this drives BOTH through their production entry paths:
//   • Piece 6 — the storage-panel toggle. The test renders the REAL `createStorageView` checkbox
//     and CLICKS it (never a direct `setCaptureFlag` call — M5 seam rule): its change handler runs
//     the same two production calls `appShell` wires — `setCaptureFlag` (the live cache) AND
//     `store.setCaptureEnabled` (persist). We assert BOTH landed (the cache flipped and the row
//     persisted), so the click genuinely reached production, not a stand-in.
//   • Piece 5 — the render-time read. `watchController.renderNow` reads `getCaptureFlag()` at its
//     capture-check on every render, so the toggle takes effect on the NEXT render.
//
// Jsdom-blind: capture writes to the engine's OWN IndexedDB and its correctness is what actually
// landed on disk. NON-VACUOUS: a render with the toggle ON captures in the SAME test, so the empty
// tail after the toggle is a real absence, not a dead capture path.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mount } from '../../src/render/mount';
import { createWatchController } from '../../src/watch/watchController';
import { createStorageView, type StorageViewOptions } from '../../src/app/storageControls';
import { getCaptureFlag, setCaptureFlag, resetCaptureFlagForTest } from '../../src/app/captureFlag';
import {
  wipeAll,
  getCaptureEnabled,
  setCaptureEnabled,
  __resetConnectionForTest,
  type StoredSummary,
} from '../../src/app/store';
import { getSnapshotMeta } from '../../src/app/snapshots';
import { SEP } from '../../src/app/recents';
import type { ChangeDetector } from '../../src/watch/changeDetector';

const FOLDER_ID = 'f-toggle-1';
const DOC_ID = FOLDER_ID + SEP + 'notes/a.md';
const DOC_A = '# Version A\n\nalpha body text.\n';
const DOC_B = '# Version B\n\nbravo body text.\n';
const DOC_C = '# Version C\n\ncharlie body text.\n';

/** A detector this suite drives by hand: `fire(text)` delivers a change so `renderNow` runs on
 *  command (the snapshotCapture precedent). */
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

function makeHost(tag: string): HTMLElement {
  const host = document.createElement(tag);
  document.body.appendChild(host);
  return host;
}

async function metaFor(docId: string): Promise<{ id: string; ts: number; bytes: number }[]> {
  const all = await getSnapshotMeta();
  return all.find((m) => m.docId === docId)?.entries ?? [];
}

async function waitForAsync<T>(fn: () => Promise<T | null | undefined | false>, tries = 200): Promise<T> {
  for (let i = 0; i < tries; i += 1) {
    const v = await fn();
    if (v) return v as T;
    await new Promise<void>((r) => setTimeout(r, 20));
  }
  throw new Error('waitForAsync timed out');
}

/** An empty-ish summary the panel can render (its content is irrelevant here — the checkbox is). */
function emptySummary(): StoredSummary {
  return {
    folders: [],
    recents: [],
    pins: [],
    settings: null,
    snapshots: { count: 0, docs: 0, bytes: 0 },
    captureFlag: null,
    total: 0,
    lines: ['Nothing stored — Peekover is holding no folders, recents, or pins on this device.'],
  };
}

/** Render the REAL storage panel wired EXACTLY as `appShell` wires it (cache + persist), and return
 *  its capture checkbox — the production toggle element the test drives. */
function mountPanelToggle(): HTMLInputElement {
  const opts: StorageViewOptions = {
    summary: emptySummary(),
    captureEnabled: getCaptureFlag(),
    // The production wiring (appShell.renderStorage): update the live cache the watch loop reads,
    // AND persist the new value. No re-render — the checkbox holds its own visual state.
    onToggleCapture: (enabled) => {
      setCaptureFlag(enabled);
      void setCaptureEnabled(enabled);
    },
    onWipe: () => undefined,
    onClose: () => undefined,
  };
  const view = createStorageView(document, opts);
  document.body.appendChild(view.element);
  return view.element.querySelector<HTMLInputElement>('[data-capture-toggle]')!;
}

beforeEach(async () => {
  resetCaptureFlagForTest();
  await wipeAll();
  document.body.replaceChildren();
});

afterEach(() => {
  __resetConnectionForTest();
  resetCaptureFlagForTest();
  document.body.replaceChildren();
});

describe('capture off-switch — the real storage-panel toggle stops capture on the next render (task 1.5)', () => {
  it('captures with the toggle ON, then clicking it OFF stops capture on the NEXT render', async () => {
    const fake = handDriven();
    const controller = createWatchController({ detector: fake.detector, docId: DOC_ID, contained: true });
    const host = makeHost('div');
    mount(DOC_A, host); // A on screen → registered in the reader-source WeakMap
    controller.start(host);

    // ── NON-VACUITY: toggle ON (the default) → a watched re-render captures the outgoing A. ──
    expect(getCaptureFlag()).toBe(true);
    fake.fire(DOC_B);
    const captured = await waitForAsync(async () => {
      const e = await metaFor(DOC_ID);
      return e.length > 0 ? e : null;
    });
    expect(captured).toHaveLength(1); // capture works when ON — the tail below is a real absence

    // ── Drive the REAL UI toggle OFF (a click on the production checkbox, not a setCaptureFlag call). ──
    const checkbox = mountPanelToggle();
    expect(checkbox.checked).toBe(true); // reflects the current (on) flag
    checkbox.click(); // → onToggleCapture(false): setCaptureFlag(false) + setCaptureEnabled(false)
    expect(checkbox.checked).toBe(false);

    // The click reached production on BOTH ends: the live cache flipped AND the row persisted.
    expect(getCaptureFlag()).toBe(false);
    expect(await getCaptureEnabled()).toBe(false);

    // ── Piece 5: the NEXT render reads the flag OFF → captures nothing. ──
    await new Promise((r) => setTimeout(r, 20)); // clear of the tiny cost-proportional cooldown
    fake.fire(DOC_C);
    // The render genuinely happens (C reaches the reader in the shadow tree)…
    await waitForAsync(async () =>
      host.shadowRoot?.querySelector('.peekover-reader')?.textContent?.includes('Version C') ? true : null,
    );
    // …but no NEW snapshot is written: still exactly the one captured while ON (B was NOT stored).
    await new Promise((r) => setTimeout(r, 120)); // give any (wrong) capture write time to land
    expect(await metaFor(DOC_ID)).toHaveLength(1);
  });
});

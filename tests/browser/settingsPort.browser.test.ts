// Task 2.3 — the REAL-ENGINE settings-port round-trip, both Chromium + Firefox.
// [spec 004 §3 persistence / §4 never-blank / §NFR zero-network] · plan.md §2 (settings port).
//
// Storage round-trips and bytes-on-wire are JSDOM-BLIND (the unit tests use fakes; here the
// ports drive the engine's OWN IndexedDB and we observe its Resource-Timing buffer). Proven:
//   1. DIRECT port — save via directPort(store), read back via a fresh directPort → the value
//      persisted through the real DB (this is the app-page/extension-origin path).
//   2. MESSAGING port — round-trips through createSettingsListener({getSettings,putSettings}),
//      the SAME background handler entrypoints/background.ts wires, against the REAL store. A
//      value SET through the messaging port is read back by the DIRECT port and vice-versa —
//      both ports hit the one real database.
//   3. ZERO-NETWORK (non-vacuous) — save+load on both ports + wipe fire ZERO http(s); a control
//      fetch DOES land in the same buffer (the observer genuinely sees requests).
//   4. RED-FIRST — a deliberately MISROUTED message type breaks the round-trip: the handler
//      declines it and the port falls back to DEFAULT instead of the saved value.
//
// ─────────────────────────────────────────────────────────────────────────────────────────
// HARNESS LIMITATION — READ THIS (flagged for the human gate, task 8.1).
// The Vitest browser-playwright project runs each test MODULE in a PLAIN PAGE. It loads NO
// unpacked extension: there is no background service worker, no content-script injection, and
// `browser.runtime.sendMessage`/`onMessage` have no receiving end. So the TRUE content→background
// transport CANNOT be exercised here. This suite instead delivers the messagingPort's messages
// through a LOOPBACK to the exact `createSettingsListener` the background registers, driving the
// real store. That proves the handler + listener response-contract (return true / sendResponse)
// + both ports + the real engine's IndexedDB all COMPOSE and round-trip. It does NOT prove the
// real `runtime.sendMessage` message bus across a content-script/background boundary — an
// extension-page-to-itself substitute would pass even if that bus were broken, so we do not
// claim it. That end-to-end path (open a content-script reader → pick a theme → reload →
// persists, Network tab open) is the named human-gate item (task 8.1, both engines/surfaces).
// ─────────────────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getSettings,
  putSettings,
  wipeAll,
  __resetConnectionForTest,
} from '../../src/app/store';
import {
  directPort,
  messagingPort,
  createSettingsListener,
  type SettingsMessage,
  type SettingsMessenger,
  type SettingsStoreApi,
} from '../../src/settings/settingsPort';
import { DEFAULT_SETTINGS } from '../../src/settings/settings';

// The real store surface the background handler answers against (the same pair background.ts
// hands to createSettingsListener).
const realStore: SettingsStoreApi = { getSettings, putSettings };

/**
 * A LOOPBACK messenger that mimics the runtime message bus: it delivers messagingPort's outgoing
 * message to `listener` (a real createSettingsListener) with a synthetic `sendResponse`, and
 * resolves the "sendMessage promise" with the response — OR with `undefined` when the listener
 * DECLINES (returns false without responding), exactly as a bus with no receiver would.
 * `mangleType` optionally corrupts the outgoing type to model a misrouted/renamed message.
 */
function loopbackMessenger(
  listener: (message: unknown, sender: unknown, sendResponse: (r?: unknown) => void) => boolean,
  mangleType?: (type: string) => string,
): SettingsMessenger {
  return (message: SettingsMessage) =>
    new Promise((resolve) => {
      const outgoing = mangleType ? { ...message, type: mangleType(message.type) } : message;
      let responded = false;
      const sendResponse = (r?: unknown) => {
        responded = true;
        resolve(r);
      };
      const keepChannelOpen = listener(outgoing, {}, sendResponse);
      if (!keepChannelOpen && !responded) resolve(undefined);
    });
}

// A macrotask + rAF + settle — long enough that any request fired reaches the Resource-Timing
// buffer (mirrors remoteMedia/wipe/folderMode browser tests).
function flush(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => requestAnimationFrame(() => setTimeout(resolve, 60)), 120);
  });
}

/** The http(s) resource-timing entry names currently in the buffer. */
function networkedUrls(): string[] {
  return performance
    .getEntriesByType('resource')
    .map((e) => e.name)
    .filter((name) => /^https?:/i.test(name));
}

let uid = 0;
const nextTok = () => `t${(uid += 1)}-${Math.trunc(performance.now())}`;

describe('settings ports — real-engine round-trip (both Chromium + Firefox)', () => {
  // Start each test from a durably empty DB so read-backs are unambiguous.
  beforeEach(async () => {
    await wipeAll();
  });
  afterEach(() => {
    __resetConnectionForTest();
  });

  it('DIRECT port: a value saved via directPort persists and reads back through a fresh port', async () => {
    const writer = directPort(realStore);
    await writer.save({ theme: 'dark', tocOpen: true, tocWidth: 301 });

    // A brand-new port (empty cache → DEFAULT) must resolve the PERSISTED value from the real DB,
    // not its own default — this is the extension-origin persistence round-trip.
    const reader = directPort(realStore);
    expect(reader.snapshot()).toEqual(DEFAULT_SETTINGS); // default before load()
    expect(await reader.load()).toEqual({ theme: 'dark', tocOpen: true, tocWidth: 301 });
  });

  it('MESSAGING port: SET through the handler persists to the real store; GET reads it back', async () => {
    const listener = createSettingsListener(realStore);
    const port = messagingPort(loopbackMessenger(listener));

    await port.save({ theme: 'light', tocWidth: 264 });

    // Read back through the SAME messaging port…
    expect(await messagingPort(loopbackMessenger(listener)).load()).toEqual({
      theme: 'light',
      tocOpen: null,
      tocWidth: 264,
    });
    // …AND through the DIRECT port — proving the messaging SET hit the one real database that the
    // direct path reads (both ports, one engine, one DB).
    expect(await directPort(realStore).load()).toEqual({ theme: 'light', tocOpen: null, tocWidth: 264 });
  });

  it('cross-port: a value SET directly is GET-able over messaging (one real DB behind both)', async () => {
    await directPort(realStore).save({ theme: 'dark', tocOpen: false });
    const listener = createSettingsListener(realStore);
    expect(await messagingPort(loopbackMessenger(listener)).load()).toEqual({
      theme: 'dark',
      tocOpen: false,
      tocWidth: null,
    });
  });

  it('RED-FIRST: a MISROUTED message type breaks the round-trip → the port falls back to DEFAULT', async () => {
    const listener = createSettingsListener(realStore);

    // Persist a distinctive value over a correctly-routed messaging port.
    await messagingPort(loopbackMessenger(listener)).save({ theme: 'dark', tocWidth: 288 });

    // Correct routing reads it back (green control)…
    const correct = await messagingPort(loopbackMessenger(listener)).load();
    expect(correct).toEqual({ theme: 'dark', tocOpen: null, tocWidth: 288 });

    // …but a renamed/misrouted type makes the handler DECLINE, so load() resolves to DEFAULT, NOT
    // the saved value — the message type genuinely carries the round-trip (RED if it didn't).
    const misrouted = await messagingPort(
      loopbackMessenger(listener, (type) => `${type}:WRONG`),
    ).load();
    expect(misrouted).toEqual(DEFAULT_SETTINGS);
    expect(misrouted).not.toEqual(correct);
  });

  it('ZERO-NETWORK (non-vacuous): save+load on both ports + wipe fire zero http(s); a control fetch does', async () => {
    performance.clearResourceTimings();

    const listener = createSettingsListener(realStore);
    // Exercise the whole settings surface across both ports.
    await directPort(realStore).save({ theme: 'dark' });
    await directPort(realStore).load();
    await messagingPort(loopbackMessenger(listener)).save({ tocWidth: 300 });
    await messagingPort(loopbackMessenger(listener)).load();
    await wipeAll();
    await flush();

    // GROUND TRUTH: not one http(s) request hit the wire — settings live entirely on-device.
    expect(networkedUrls()).toEqual([]);

    // NON-VACUOUS: a control same-origin fetch DOES land in the same buffer (observer works). The
    // URL is same-origin (vitest dev server 404) so nothing leaves the machine, but http(s) still
    // classifies as a networked entry — exactly the remoteMedia/wipe/folderMode discipline.
    const probe = new URL(`/__peekover_settings_probe__/${nextTok()}.txt`, location.origin).href;
    await fetch(probe).catch(() => undefined);
    await flush();
    expect(networkedUrls()).toContain(probe);
  });
});

// Task 2.2 — the SettingsPort cache + timeout→default fallback, unit-tested with FAKE
// transports/stores (the deps are injected exactly so this needs no engine). Pure logic:
//   - snapshot() is the default before load() resolves, the loaded value after;
//   - a round-trip goes through the injected fake (direct = store, messaging = messenger);
//   - a HANGING or THROWING transport makes load() resolve to the DEFAULT within the timeout
//     (never-blank, spec §4) — the RED-FIRST property: without withTimeout a hang hangs load()
//     forever, without the catch a rejection throws (both demonstrated red — see progress.md).
// The real cross-context messaging + real-engine store round-trip are proven separately in the
// browser project (settingsPort.browser.test.ts, task 2.3) — jsdom can't see either.

import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  directPort,
  messagingPort,
  LOAD_TIMEOUT_MS,
  GET_SETTINGS,
  type SettingsStoreApi,
  type SettingsMessage,
  type SettingsMessenger,
} from './settingsPort';
import { DEFAULT_SETTINGS, type Settings } from './settings';

// --- fakes ------------------------------------------------------------------------

/** An in-memory stand-in for store.ts's get/putSettings, recording every patch it is handed. */
function fakeStore(initial: Partial<Settings> = {}) {
  let row: Settings = { ...DEFAULT_SETTINGS, ...initial };
  const puts: Partial<Settings>[] = [];
  const api: SettingsStoreApi = {
    getSettings: async () => ({ ...row }),
    putSettings: async (patch) => {
      puts.push(patch);
      row = { ...row, ...patch };
    },
  };
  return { api, puts, current: () => ({ ...row }) };
}

/** A messenger backed by a fake store, so a round-trip through messagingPort is observable
 *  without a real runtime — it answers GET from the row and applies SET to it. */
function fakeMessenger(store = fakeStore()): { send: SettingsMessenger; store: ReturnType<typeof fakeStore> } {
  const send: SettingsMessenger = async (message: SettingsMessage) => {
    if (message.type === GET_SETTINGS) return store.current();
    await store.api.putSettings(message.patch);
    return { ok: true };
  };
  return { send, store };
}

afterEach(() => {
  vi.useRealTimers();
});

// --- directPort -------------------------------------------------------------------

describe('directPort — cached snapshot + round-trip via the injected store', () => {
  it('snapshot() is the DEFAULT before load(), the loaded value after', async () => {
    const store = fakeStore({ theme: 'dark', tocOpen: true, tocWidth: 288 });
    const port = directPort(store.api);

    // Before load() resolves, snapshot is the never-blank default — synchronous, never throws.
    expect(port.snapshot()).toEqual(DEFAULT_SETTINGS);

    const loaded = await port.load();
    expect(loaded).toEqual({
      theme: 'dark',
      tocOpen: true,
      tocWidth: 288,
      codeTheme: 'github-dark',
      lastExportFormat: null,
    });
    expect(port.snapshot()).toEqual({
      theme: 'dark',
      tocOpen: true,
      tocWidth: 288,
      codeTheme: 'github-dark',
      lastExportFormat: null,
    });
  });

  it('save() updates the cache IMMEDIATELY (before persistence resolves) then persists', async () => {
    const store = fakeStore();
    const port = directPort(store.api);

    const pending = port.save({ theme: 'light' });
    // Cache reflects the choice synchronously — the UI does not wait for the write.
    expect(port.snapshot().theme).toBe('light');
    await pending;
    // …and it did reach the store (best-effort persistence really ran).
    expect(store.puts).toEqual([{ theme: 'light' }]);
    expect(store.current().theme).toBe('light');
  });
});

// --- messagingPort ----------------------------------------------------------------

describe('messagingPort — cached snapshot + round-trip via the injected messenger', () => {
  it('load() reads back through the messenger; save() sends a SET message', async () => {
    const m = fakeMessenger(fakeStore({ theme: 'dark', tocWidth: 320 }));
    const port = messagingPort(m.send);

    expect(port.snapshot()).toEqual(DEFAULT_SETTINGS); // default before load

    expect(await port.load()).toEqual({
      theme: 'dark',
      tocOpen: null,
      tocWidth: 320,
      codeTheme: 'github-dark',
      lastExportFormat: null,
    });

    await port.save({ tocOpen: true });
    expect(port.snapshot().tocOpen).toBe(true); // cache updated immediately
    // The store behind the messenger received the patch (the SET round-trip really happened).
    expect(m.store.current().tocOpen).toBe(true);

    // A fresh load re-reads the persisted, merged value.
    expect(await messagingPort(m.send).load()).toEqual({
      theme: 'dark',
      tocOpen: true,
      tocWidth: 320,
      codeTheme: 'github-dark',
      lastExportFormat: null,
    });
  });

  it('coerces a garbled/absent response into a complete Settings (never a partial shape)', async () => {
    const garbled: SettingsMessenger = async () => undefined; // e.g. no receiver / broken response
    expect(await messagingPort(garbled).load()).toEqual(DEFAULT_SETTINGS);
  });

  it('save({lastExportFormat}) writes, load() reads it back through coerceSettings — the D-6 hand-enumeration trap task 8.2 filed and closed in the same task', async () => {
    // RED-FIRST (this test's own firing control, reasoned rather than re-run for every field —
    // `verification-greps-need-a-firing-control`): had `coerceSettings` NOT been extended with a
    // `lastExportFormat` line, `messagingPort`'s GET path would drop the field on the object
    // literal below, and `load()` would come back with `lastExportFormat: null` regardless of
    // what was saved — silently, no type error, exactly the shape this test exists to catch.
    const m = fakeMessenger();
    const port = messagingPort(m.send);

    await port.save({ lastExportFormat: 'copy-html' });
    expect(m.store.current().lastExportFormat).toBe('copy-html'); // the save really reached the store

    // A FRESH port (no warm cache) forces load() to go through the wire and coerceSettings again.
    expect(await messagingPort(m.send).load()).toMatchObject({ lastExportFormat: 'copy-html' });
  });
});

// --- the timeout → default fallback (RED-FIRST) -----------------------------------

describe('load() is bounded — a HANGING transport resolves to DEFAULT within the timeout', () => {
  it('directPort: a never-resolving getSettings falls back to DEFAULT (fake timers)', async () => {
    vi.useFakeTimers();
    const hanging: SettingsStoreApi = {
      getSettings: () => new Promise<Settings>(() => {}), // never resolves — a dead/asleep backend
      putSettings: async () => {},
    };
    const port = directPort(hanging);

    const loading = port.load();
    expect(port.snapshot()).toEqual(DEFAULT_SETTINGS); // still default while pending
    // Advance past the bound: the timeout fires and load() resolves to the default (does not hang).
    // (RED-FIRST: delete withTimeout and this test hangs to the vitest timeout instead.)
    await vi.advanceTimersByTimeAsync(LOAD_TIMEOUT_MS);
    expect(await loading).toEqual(DEFAULT_SETTINGS);
    expect(port.snapshot()).toEqual(DEFAULT_SETTINGS);
  });

  it('messagingPort: a never-responding background falls back to DEFAULT (fake timers)', async () => {
    vi.useFakeTimers();
    const port = messagingPort(() => new Promise<unknown>(() => {})); // background never replies

    const loading = port.load();
    await vi.advanceTimersByTimeAsync(LOAD_TIMEOUT_MS);
    expect(await loading).toEqual(DEFAULT_SETTINGS);
  });
});

describe('load() never throws — a THROWING transport resolves to DEFAULT (not a rejection)', () => {
  it('directPort: a rejecting getSettings resolves to DEFAULT', async () => {
    const throwing: SettingsStoreApi = {
      getSettings: async () => {
        throw new Error('store blew up');
      },
      putSettings: async () => {},
    };
    // RED-FIRST: without withTimeout's rejection-swallow this .resolves assertion would see a throw.
    await expect(directPort(throwing).load()).resolves.toEqual(DEFAULT_SETTINGS);
  });

  it('messagingPort: a rejecting send resolves to DEFAULT', async () => {
    const throwing: SettingsMessenger = async () => {
      throw new Error('sendMessage failed');
    };
    await expect(messagingPort(throwing).load()).resolves.toEqual(DEFAULT_SETTINGS);
  });
});

describe('save() is best-effort — a failing persist never rejects the caller', () => {
  it('directPort: a rejecting putSettings still resolves save() and keeps the cache updated', async () => {
    const flaky: SettingsStoreApi = {
      getSettings: async () => ({ ...DEFAULT_SETTINGS }),
      putSettings: async () => {
        throw new Error('write failed');
      },
    };
    const port = directPort(flaky);
    await expect(port.save({ theme: 'dark' })).resolves.toBeUndefined();
    expect(port.snapshot().theme).toBe('dark'); // in-memory choice still governs this view
  });
});

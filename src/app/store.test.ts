// Task 1.3 — the PURE transparency-line logic (`buildStoredLines`). No engine: it is a pure
// function over plain arrays + the settings flag, so it lives in the fast unit project (no
// jsdom pragma — it never touches IndexedDB). The engine round-trip (wipeAll clears settings,
// describeStored reads the settings row) is proven separately in the real-engine browser
// project (settingsStore.browser.test.ts) — the retro-honest split: pure logic unit-tested,
// jsdom-blind storage proven in a real engine.

import { describe, it, expect } from 'vitest';
import {
  buildStoredLines,
  SCHEMA,
  STORES,
  DB_VERSION,
  DEFAULT_SETTINGS,
  type StoredFolderInfo,
  type RecentRecord,
  type PinRecord,
  type Settings,
} from './store';

const folder = (over: Partial<StoredFolderInfo> = {}): StoredFolderInfo => ({
  id: 'f1',
  name: 'notes',
  persisted: false,
  addedAt: 1,
  lastOpenedAt: 2,
  ...over,
});
const recent = (): RecentRecord => ({ id: 'r1', folderId: 'f1', path: 'a.md', name: 'a.md', openedAt: 3 });
const pin = (): PinRecord => ({ id: 'p1', kind: 'file', folderId: 'f1', path: 'a.md', name: 'a.md', pinnedAt: 4 });

const SETTINGS_LINE = /display settings/i;
// 006 task 1.4 re-scoped the settings line: the "no file contents" fragment (part of the now-false
// store-wide claim) was dropped; it still discloses the on-device home.
const ON_DEVICE = /stored on-device/i;
const NOTHING = /Nothing stored/i;

function lines(over: {
  folders?: StoredFolderInfo[];
  recents?: RecentRecord[];
  pins?: PinRecord[];
  settings?: Settings | null;
  snapshots?: { count: number; docs: number; bytes: number };
  captureFlag?: boolean | null;
}): string[] {
  const folders = over.folders ?? [];
  const recents = over.recents ?? [];
  const pins = over.pins ?? [];
  const settings = over.settings ?? null;
  const snapshots = over.snapshots ?? { count: 0, docs: 0, bytes: 0 };
  const captureFlag = over.captureFlag ?? null;
  const total =
    folders.length +
    recents.length +
    pins.length +
    (settings ? 1 : 0) +
    snapshots.count +
    (captureFlag !== null ? 1 : 0);
  return buildStoredLines({ folders, recents, pins, settings, snapshots, captureFlag, total });
}

// Task 1.1 — the SCHEMA shape at the bumped DB_VERSION. Pure constant assertions (no engine):
// the real v2→v3 upgrade preserving existing rows is proven in the browser project
// (idbVersionchange.browser.test.ts), which reads this same exported SCHEMA.
describe('SCHEMA — DB_VERSION 3, two new snapshot stores (task 1.1)', () => {
  it('declares version 3, matching DB_VERSION', () => {
    expect(SCHEMA.version).toBe(3);
    expect(SCHEMA.version).toBe(DB_VERSION);
  });

  it('adds `snapshotMeta` (keyPath docId) and `snapshots` (keyPath id)', () => {
    expect(SCHEMA.stores).toEqual(
      expect.arrayContaining([
        { name: 'snapshotMeta', keyPath: 'docId' },
        { name: 'snapshots', keyPath: 'id' },
      ]),
    );
  });

  it('still carries the four pre-existing stores (additive — nothing dropped or renamed)', () => {
    expect(SCHEMA.stores.map((s) => s.name)).toEqual(
      expect.arrayContaining([STORES.folders, STORES.recents, STORES.pins, STORES.settings]),
    );
  });
});

describe('buildStoredLines — settings line (task 1.3)', () => {
  it('emits the settings line when a settings row exists', () => {
    const out = lines({ settings: { ...DEFAULT_SETTINGS, theme: 'dark' } });
    const text = out.join(' ');
    expect(text).toMatch(SETTINGS_LINE);
    expect(text).toMatch(ON_DEVICE); // still discloses the on-device home (006 task 1.4 re-scope)
    // A stored settings row is a real record, so it is NOT "nothing stored".
    expect(text).not.toMatch(NOTHING);
  });

  it('omits the settings line when no settings row exists (null)', () => {
    const out = lines({ folders: [folder()], settings: null });
    expect(out.join(' ')).not.toMatch(SETTINGS_LINE);
  });

  it('reports "nothing stored" only when every store — settings included — is empty', () => {
    expect(lines({}).join(' ')).toMatch(NOTHING);
    // With ONLY settings stored, it is no longer nothing, and the settings line stands in.
    const onlySettings = lines({ settings: DEFAULT_SETTINGS }).join(' ');
    expect(onlySettings).not.toMatch(NOTHING);
    expect(onlySettings).toMatch(SETTINGS_LINE);
  });

  it('appends the settings line AFTER folders/recents/pins (stable, store-list order)', () => {
    const out = lines({
      folders: [folder({ persisted: true })],
      recents: [recent()],
      pins: [pin()],
      settings: DEFAULT_SETTINGS,
    });
    expect(out).toHaveLength(4);
    expect(out[0]).toMatch(/remembered folder/);
    expect(out[1]).toMatch(/recently opened file/);
    expect(out[2]).toMatch(/pinned item/);
    expect(out[3]).toMatch(SETTINGS_LINE);
  });
});

describe('buildStoredLines — snapshot line (task 1.4)', () => {
  it('emits a snapshot line naming count, document count, and total bytes when snapshots exist', () => {
    const out = lines({ snapshots: { count: 3, docs: 2, bytes: 2048 } }).join(' ');
    // Honest disclosure of the first stored thing that IS file contents: how many states, across
    // how many documents, how many bytes — kept on-device only, never uploaded.
    expect(out).toMatch(/3 snapshots/);
    expect(out).toMatch(/2 watched documents/);
    expect(out).toMatch(/2\.0 KB/); // humanBytes(2048)
    expect(out).toMatch(/on this device only, never uploaded/i);
    // With snapshots stored, it is NOT "nothing stored".
    expect(out).not.toMatch(NOTHING);
  });

  it('singularizes one snapshot of one document, and renders sub-KiB bytes plainly', () => {
    const out = lines({ snapshots: { count: 1, docs: 1, bytes: 512 } }).join(' ');
    expect(out).toMatch(/1 snapshot of 1 watched document/);
    expect(out).toMatch(/512 B/); // humanBytes under 1 KiB
  });

  it('emits NO snapshot line when the count is zero (the empty case is the "nothing stored" line)', () => {
    const out = lines({ snapshots: { count: 0, docs: 0, bytes: 0 } }).join(' ');
    expect(out).not.toMatch(/snapshot/i);
    expect(out).toMatch(NOTHING);
  });

  it('places the snapshot line AFTER folders/recents/pins/settings (store-list order)', () => {
    const out = lines({
      folders: [folder({ persisted: true })],
      recents: [recent()],
      pins: [pin()],
      settings: DEFAULT_SETTINGS,
      snapshots: { count: 2, docs: 1, bytes: 4096 },
    });
    expect(out).toHaveLength(5);
    expect(out[3]).toMatch(SETTINGS_LINE);
    expect(out[4]).toMatch(/2 snapshots of 1 watched document/);
  });
});

describe('buildStoredLines — snapshot-capture preference line (D-12, task 1.5)', () => {
  it('emits NO capture line when the flag is null (no `capture` row — default on, nothing stored)', () => {
    const out = lines({ captureFlag: null }).join(' ');
    expect(out).not.toMatch(/capture/i);
    // With only the (absent) capture row, the store is empty → the "nothing stored" line stands.
    expect(out).toMatch(NOTHING);
  });

  it('emits an OFF capture line when the flag is stored false (a real stored preference)', () => {
    const out = lines({ captureFlag: false }).join(' ');
    expect(out).toMatch(/snapshot capture is turned off/i);
    // A stored preference IS a record → not "nothing stored".
    expect(out).not.toMatch(NOTHING);
  });

  it('emits an ON capture line when the flag is stored true (toggled back on — still a stored row)', () => {
    const out = lines({ captureFlag: true }).join(' ');
    expect(out).toMatch(/snapshot capture is turned on/i);
    expect(out).not.toMatch(NOTHING);
  });

  it('places the capture line LAST, after folders/recents/pins/settings/snapshots', () => {
    const out = lines({
      folders: [folder({ persisted: true })],
      recents: [recent()],
      pins: [pin()],
      settings: DEFAULT_SETTINGS,
      snapshots: { count: 2, docs: 1, bytes: 4096 },
      captureFlag: false,
    });
    expect(out).toHaveLength(6);
    expect(out[4]).toMatch(/2 snapshots of 1 watched document/);
    expect(out[5]).toMatch(/snapshot capture is turned off/i);
  });
});

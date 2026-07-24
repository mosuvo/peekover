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
const NO_FILE_CONTENTS = /no file contents/i;
const NOTHING = /Nothing stored/i;

function lines(over: {
  folders?: StoredFolderInfo[];
  recents?: RecentRecord[];
  pins?: PinRecord[];
  settings?: Settings | null;
}): string[] {
  const folders = over.folders ?? [];
  const recents = over.recents ?? [];
  const pins = over.pins ?? [];
  const settings = over.settings ?? null;
  const total = folders.length + recents.length + pins.length + (settings ? 1 : 0);
  return buildStoredLines({ folders, recents, pins, settings, total });
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
    expect(text).toMatch(NO_FILE_CONTENTS); // the same on-device / no-contents disclosure
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

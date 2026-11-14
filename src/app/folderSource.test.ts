// @vitest-environment jsdom
// Task 4.1 (unit) — the FEATURE-DETECT branch selection: `'showDirectoryPicker' in window`
// is the ONE branch that decides Chromium live-folder vs the Firefox read-only snapshot.
// [§9 feature-detect→fallback+note]
//
// This is the PURE seam decision, unit-testable with no engine: assert the detector's
// boolean, and that `openFolder()` routes to the RIGHT impl for each engine. Both impls are
// mocked (the native picker / file chooser can't run headlessly — Task 0), so this proves
// the ROUTING, while the real read paths are proven in the engine tests (folderGrant /
// firefoxFallback browser tests). A picker-disabled Chromium reports the picker absent and
// takes the SAME Firefox path — the branch is on the capability, never the engine name.

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock both engine impls: this test cares only about WHICH one openFolder calls.
vi.mock('./chromiumFolderSource', () => ({
  pickDirectory: vi.fn(async () => ({ name: 'disk-handle' })),
  folderSourceFromHandle: vi.fn(async (handle: unknown) => ({
    name: 'chromium-folder',
    files: [],
    truncated: false,
    persistable: true,
    handle,
  })),
}));
vi.mock('./firefoxFolderSource', () => ({
  pickDirectoryFiles: vi.fn(async () => [{ name: 'a.md' }] as unknown as FileList),
  folderSourceFromFileList: vi.fn(async () => ({
    name: 'firefox-snapshot',
    files: [],
    truncated: false,
    persistable: false,
  })),
  folderSourceFromDataTransfer: vi.fn(async () => ({
    name: 'firefox-drop',
    files: [],
    truncated: false,
    persistable: false,
  })),
}));

import { openFolder, openFolderFromDrop, isDirectoryPickerSupported } from './folderSource';
import * as chromium from './chromiumFolderSource';
import * as firefox from './firefoxFolderSource';

/** Add/remove the picker capability on the jsdom window (the feature-detect input). */
function setPickerSupported(supported: boolean): void {
  if (supported) {
    (window as unknown as { showDirectoryPicker: unknown }).showDirectoryPicker = () => undefined;
  } else {
    delete (window as unknown as Record<string, unknown>).showDirectoryPicker;
  }
}

describe('isDirectoryPickerSupported (pure feature-detect)', () => {
  it('is true iff the window exposes showDirectoryPicker', () => {
    expect(isDirectoryPickerSupported({ showDirectoryPicker: () => undefined } as unknown as Window)).toBe(true);
    expect(isDirectoryPickerSupported({} as unknown as Window)).toBe(false);
  });
});

describe('openFolder — feature-detect routes to the right engine impl', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setPickerSupported(false);
  });

  it('picker PRESENT (Chromium) → routes to the Chromium handle path, persistable', async () => {
    setPickerSupported(true);

    const outcome = await openFolder();

    expect(chromium.pickDirectory).toHaveBeenCalledTimes(1);
    expect(chromium.folderSourceFromHandle).toHaveBeenCalledTimes(1);
    // The Firefox fallback was NOT taken.
    expect(firefox.pickDirectoryFiles).not.toHaveBeenCalled();
    expect(firefox.folderSourceFromFileList).not.toHaveBeenCalled();

    expect(outcome.ok).toBe(true);
    if (outcome.ok) expect(outcome.source.persistable).toBe(true);
  });

  it('picker ABSENT (Firefox / picker-disabled) → routes to the read-only snapshot, NOT persistable', async () => {
    setPickerSupported(false);

    const outcome = await openFolder();

    expect(firefox.pickDirectoryFiles).toHaveBeenCalledTimes(1);
    expect(firefox.folderSourceFromFileList).toHaveBeenCalledTimes(1);
    // The Chromium path was NOT taken.
    expect(chromium.pickDirectory).not.toHaveBeenCalled();
    expect(chromium.folderSourceFromHandle).not.toHaveBeenCalled();

    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      expect(outcome.source.persistable).toBe(false);
      expect(outcome.source.handle).toBeUndefined();
    }
  });

  it('Firefox path: a dismissed chooser (null FileList) → designed cancelled state, never a hang', async () => {
    setPickerSupported(false);
    vi.mocked(firefox.pickDirectoryFiles).mockResolvedValueOnce(null);

    const outcome = await openFolder();

    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.reason).toBe('cancelled');
    // A cancelled pick never reaches the file-list read.
    expect(firefox.folderSourceFromFileList).not.toHaveBeenCalled();
  });
});

// --- openFolderFromDrop — the DROP counterpart routes the SAME two ways -----------------
//
// A drop bypasses openFolder's feature-detect, so it branches itself. The capability-downgrade
// guard is the point: a Chromium drop (item exposes getAsFileSystemHandle) must take the LIVE
// handle path (persistable), NOT the read-only snapshot — dragging a folder must not silently
// give a Chromium user less than the picker would. The real read paths are engine-tested; here
// we prove the ROUTING with synthetic DataTransfer items.

/** A synthetic DataTransfer whose `.items` is a plain array (Array.from reads it array-like).
 *  Items are loosely typed — each test supplies only the accessors the routing reads. */
function dropWith(items: Array<Record<string, unknown>>): DataTransfer {
  return { items } as unknown as DataTransfer;
}

describe('openFolderFromDrop — a dropped folder routes to the right engine impl', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setPickerSupported(false);
  });

  it('Chromium (item exposes getAsFileSystemHandle) → LIVE handle path, persistable (NOT downgraded)', async () => {
    setPickerSupported(true);
    const dirHandle = { kind: 'directory', name: 'dropped' };
    const item = { kind: 'file', getAsFileSystemHandle: async () => dirHandle };

    const outcome = await openFolderFromDrop(dropWith([item]));

    // The live handle path was taken (NOT the snapshot) — a Chromium drop is not downgraded.
    expect(chromium.folderSourceFromHandle).toHaveBeenCalledTimes(1);
    expect(chromium.folderSourceFromHandle).toHaveBeenCalledWith(dirHandle, {});
    expect(firefox.folderSourceFromDataTransfer).not.toHaveBeenCalled();
    expect(outcome.ok).toBe(true);
    if (outcome.ok) expect(outcome.source.persistable).toBe(true);
  });

  it('Firefox (no handle; item exposes webkitGetAsEntry) → read-only Entries snapshot, NOT persistable', async () => {
    setPickerSupported(false);
    const item = { kind: 'file', webkitGetAsEntry: () => ({ isDirectory: true }) };

    const outcome = await openFolderFromDrop(dropWith([item]));

    expect(firefox.folderSourceFromDataTransfer).toHaveBeenCalledTimes(1);
    expect(chromium.folderSourceFromHandle).not.toHaveBeenCalled();
    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      expect(outcome.source.persistable).toBe(false);
      expect(outcome.source.handle).toBeUndefined();
    }
  });

  it('a Chromium item with NO directory handle (files-only / empty drop) → designed cancelled, never blank', async () => {
    setPickerSupported(true);
    // getAsFileSystemHandle resolves to a FILE handle (a dropped file, not a folder).
    const item = { kind: 'file', getAsFileSystemHandle: async () => ({ kind: 'file', name: 'x.md' }) };

    const outcome = await openFolderFromDrop(dropWith([item]));

    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.reason).toBe('cancelled');
    expect(chromium.folderSourceFromHandle).not.toHaveBeenCalled();
  });

  it('an empty drop (no items, or a null dataTransfer) → designed cancelled, never a throw', async () => {
    setPickerSupported(false);
    expect((await openFolderFromDrop(dropWith([]))).ok).toBe(false);
    const nullOutcome = await openFolderFromDrop(null);
    expect(nullOutcome.ok).toBe(false);
    if (!nullOutcome.ok) expect(nullOutcome.reason).toBe('cancelled');
    expect(firefox.folderSourceFromDataTransfer).not.toHaveBeenCalled();
  });

  it('the Chromium handle read throwing → designed error, never blank', async () => {
    setPickerSupported(true);
    vi.mocked(chromium.folderSourceFromHandle).mockRejectedValueOnce(new Error('io'));
    const item = { kind: 'file', getAsFileSystemHandle: async () => ({ kind: 'directory', name: 'd' }) };

    const outcome = await openFolderFromDrop(dropWith([item]));

    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.reason).toBe('error');
  });
});

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
  READ_ONLY_SNAPSHOT_NOTE: 'note',
  pickDirectoryFiles: vi.fn(async () => [{ name: 'a.md' }] as unknown as FileList),
  folderSourceFromFileList: vi.fn(async () => ({
    name: 'firefox-snapshot',
    files: [],
    truncated: false,
    persistable: false,
  })),
}));

import { openFolder, isDirectoryPickerSupported } from './folderSource';
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

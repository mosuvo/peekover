// @vitest-environment jsdom
//
// watchAvailability — the pure decision (spec 005 task 4.4).
//
// PRECONDITION, CHECKED BEFORE THIS TASK WAS STARTED: 2.3's answer is recorded in
// `docs/ai/decisions.md` (2026-07-19) and it took the NEGATIVE branch — Firefox 152's background
// THREW on `fetch("file:///…")` ("may not load or link to file:"), which is Gecko's URI security
// policy and not a missing permission. So this task covers BOTH Firefox cases: the app page opened
// via the file input, AND the content-script `file://` reader.
//
// Every branch below is reachable in production and each has a case here. What is NOT testable
// anywhere — whether the copy reads as honest rather than broken — is human-gate 7.1.

import { describe, it, expect } from 'vitest';
import {
  watchCapability,
  FIREFOX_CONTENT_SCRIPT_NOTE,
  FIREFOX_PICKER_NOTE,
} from './watchAvailability';

describe('watchCapability — the content-script surface (task 4.4 case b)', () => {
  it('watches on an engine whose background can read file:// (Chromium)', () => {
    expect(watchCapability({ surface: 'content-script', backgroundCanReadFileUrls: true })).toEqual({
      watchable: true,
      note: null,
    });
  });

  it('explains instead of offering a dead toggle when it cannot (Firefox)', () => {
    const decision = watchCapability({
      surface: 'content-script',
      backgroundCanReadFileUrls: false,
    });
    expect(decision.watchable).toBe(false);
    expect(decision.note).toBe(FIREFOX_CONTENT_SCRIPT_NOTE);
  });
});

describe('watchCapability — the app-page surface (task 4.4 case a)', () => {
  it('watches a live handle, by either route (Chromium)', () => {
    // `persistable` alone settles it: a live handle always re-reads.
    expect(watchCapability({ surface: 'app-page', persistable: true, route: 'picker' })).toEqual({
      watchable: true,
      note: null,
    });
    expect(watchCapability({ surface: 'app-page', persistable: true, route: 'drop' })).toEqual({
      watchable: true,
      note: null,
    });
  });

  it('watches a DRAGGED snapshot — frozen metadata, but FRESH bytes (Firefox)', () => {
    // THE CASE THAT MAKES THE ROUTE LOAD-BEARING. This is `persistable:false`, exactly like the
    // picker case below, and yet it watches: `File.text()` reads fresh bytes on the drag path even
    // though `size`/`lastModified` never move (task 1.1's measured trap, and the reason the
    // detector compares CONTENT). A decision keyed on `persistable` alone would wrongly refuse it.
    expect(watchCapability({ surface: 'app-page', persistable: false, route: 'drop' })).toEqual({
      watchable: true,
      note: null,
    });
  });

  it('explains instead for a PICKED snapshot — frozen through and through (Firefox)', () => {
    const decision = watchCapability({
      surface: 'app-page',
      persistable: false,
      route: 'picker',
    });
    expect(decision.watchable).toBe(false);
    expect(decision.note).toBe(FIREFOX_PICKER_NOTE);
  });

  it('distinguishes the two Firefox snapshot routes — the whole point of carrying the route', () => {
    // Stated as its own case because it is the property the seam CANNOT express: both routes
    // produce `persistable:false` (folderSourceFromFileList and folderSourceFromDataTransfer
    // converge on it), so anything reading only that bit would treat these identically.
    const dropped = watchCapability({ surface: 'app-page', persistable: false, route: 'drop' });
    const picked = watchCapability({ surface: 'app-page', persistable: false, route: 'picker' });
    expect(dropped.watchable).not.toBe(picked.watchable);
  });
});

describe('the explanations themselves (task 4.4)', () => {
  it.each([
    ['content script', FIREFOX_CONTENT_SCRIPT_NOTE],
    ['picker', FIREFOX_PICKER_NOTE],
  ])('%s: says what is not happening, why, AND what to do instead', (_name, note) => {
    // The last clause is what makes these worth shipping rather than merely honest: in BOTH cases
    // a working route exists, so a note that only apologised would leave the user stuck. This is
    // the shape M2's READ_ONLY_SNAPSHOT_NOTE established.
    expect(note).toMatch(/isn't available/i);
    expect(note).toMatch(/Firefox/);
    expect(note).toMatch(/instead/i);
    // Plain language: no error codes, no API names leaking to the user.
    expect(note).not.toMatch(/moz-extension|NetworkError|file:\/\/\/|undefined/);
  });
});

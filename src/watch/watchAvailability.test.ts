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
  REMOTE_DOCUMENT_NOTE,
} from './watchAvailability';

describe('watchCapability — the content-script surface (task 4.4 case b)', () => {
  it('watches on an engine whose background can read a local file:// doc (Chromium)', () => {
    expect(
      watchCapability({
        surface: 'content-script',
        backgroundCanReadFileUrls: true,
        documentIsWatchableFile: true,
      }),
    ).toEqual({ watchable: true, note: null });
  });

  it('explains instead of offering a dead toggle when it cannot (Firefox, local file)', () => {
    const decision = watchCapability({
      surface: 'content-script',
      backgroundCanReadFileUrls: false,
      documentIsWatchableFile: true,
    });
    expect(decision.watchable).toBe(false);
    expect(decision.note).toBe(FIREFOX_CONTENT_SCRIPT_NOTE);
  });
});

describe('watchCapability — the REMOTE content-script surface (task 4.6-rescope)', () => {
  it('a remote http(s) raw document is NOT watchable — it gets the scope note, no toggle', () => {
    // The content script also runs on raw.githubusercontent / gist / gitlab-raw / bitbucket-raw,
    // where the relay refuses every read. Watching remote is out of scope (spec §6): the honest
    // answer is a scope statement, never a live-looking control that silently does nothing.
    const decision = watchCapability({
      surface: 'content-script',
      backgroundCanReadFileUrls: true,
      documentIsWatchableFile: false,
    });
    expect(decision.watchable).toBe(false);
    expect(decision.note).toBe(REMOTE_DOCUMENT_NOTE);
  });

  it('remoteness dominates the engine — a remote doc is out of scope on BOTH builds', () => {
    // The gate is engine-independent: a remote page is remote whether the background could read
    // file:// or not, so both builds return the SAME remote note (not the Firefox one).
    for (const backgroundCanReadFileUrls of [true, false]) {
      const decision = watchCapability({
        surface: 'content-script',
        backgroundCanReadFileUrls,
        documentIsWatchableFile: false,
      });
      expect(decision.note).toBe(REMOTE_DOCUMENT_NOTE);
    }
  });

  it('the local-file vs remote branch is the whole point of the gate — same engine, different URL', () => {
    // Non-vacuity: the ONLY thing that differs between these two is `documentIsWatchableFile`, and
    // it flips watchable. A decision that ignored the URL (the pre-rescope bug) would treat them the
    // same and offer a control on the remote page.
    const local = watchCapability({
      surface: 'content-script',
      backgroundCanReadFileUrls: true,
      documentIsWatchableFile: true,
    });
    const remote = watchCapability({
      surface: 'content-script',
      backgroundCanReadFileUrls: true,
      documentIsWatchableFile: false,
    });
    expect(local.watchable).not.toBe(remote.watchable);
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

  it('explains instead for a PICKED snapshot — Watch not offered (Firefox)', () => {
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
    expect(note).toMatch(/isn't (available|offered)/i);
    expect(note).toMatch(/Firefox/);
    expect(note).toMatch(/instead/i);
    // Plain language: no error codes, no API names leaking to the user.
    expect(note).not.toMatch(/moz-extension|NetworkError|file:\/\/\/|undefined/);
  });
});

describe('the picker-route wording (HUMAN RULING 2026-11-10, after the real-picker check: "picker: fresh")', () => {
  it('FIREFOX_PICKER_NOTE is the approved sentence, and no longer says the files are frozen', () => {
    expect(FIREFOX_PICKER_NOTE).toBe("Watching isn't offered for folders opened with the file picker in Firefox. Opening a file again shows its latest saved version, but the page won't update on its own. Drag the folder onto this page instead and watching will work.");
    expect(FIREFOX_PICKER_NOTE).not.toMatch(/frozen|never arrive/i);
  });
});

describe('the REMOTE note is a SCOPE statement, a different shape (task 4.6-rescope)', () => {
  it('names the scope (local files / network), NOT a fault or a fix', () => {
    // A scope boundary, not a platform limit and not a failure. It must therefore read UNLIKE the
    // Firefox notes: it names no engine, offers no alternative route ("instead"), and — critically —
    // does not imply the user did something wrong or could turn something on.
    expect(REMOTE_DOCUMENT_NOTE).toMatch(/local files/i);
    expect(REMOTE_DOCUMENT_NOTE).toMatch(/network/i);
    // Not a platform-limit note: no engine name, no "isn't available", no "do X instead".
    expect(REMOTE_DOCUMENT_NOTE).not.toMatch(/Firefox|Chrome|isn't available|instead/i);
    // Not a fault or a fix the user could apply.
    expect(REMOTE_DOCUMENT_NOTE).not.toMatch(/could not|couldn't|error|failed|enable|turn on|allow/i);
    // Plain language, no jargon.
    expect(REMOTE_DOCUMENT_NOTE).not.toMatch(/http|file:\/\/\/|URL|undefined/i);
  });

  it('the three content-script notes are NOT interchangeable — pairwise distinct', () => {
    // The discrimination check the browser suite proves at the RENDER level; asserted here on the
    // strings themselves so a future edit that collapses two of them fails loudly. Swapping any pair
    // in the decision (the red-first mutation) makes the surface-specific tests above fail.
    const notes = [FIREFOX_CONTENT_SCRIPT_NOTE, FIREFOX_PICKER_NOTE, REMOTE_DOCUMENT_NOTE];
    expect(new Set(notes).size).toBe(notes.length);
  });
});

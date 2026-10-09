import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// The LEDGER-TEXT PIN (012 tasks 5.3 and 5.4; D-9; tasks.md F-6). `docs/trust/PERMISSIONS.md`
// says what Peekover can do, and from 5.3 Peekover can write one file. The wording of that claim
// is the human's: it was SIGNED at task 5.1 (`docs/ai/decisions.md`, "M12 TASK 5.1"), and landed
// in two stages — the INTERIM row (b′) with 5.3's write, the FINAL row (b) with 5.4's download.
//
// So this pins three things, each of which a well-meant edit could break silently:
//   1. the signed summary sentence (a) and the final row (b) are in the ledger EXACTLY;
//   2. what they replaced is gone — the old "cannot write" sentence, and the interim row's three
//      texts, which said Save "does not save" on the routes that now download;
//   3. the literals below are the signed text — each is found verbatim in the 5.1 entry, so a
//      "fix" to a literal here cannot drift away from what the human signed.
//
// Lives beside `manifest.test.ts`, the other trust pin: there was no existing test that read
// PERMISSIONS.md, so this file starts the convention.

const ROOT = process.cwd();
const ledger = readFileSync(join(ROOT, 'docs/trust/PERMISSIONS.md'), 'utf8');
const decisions = readFileSync(join(ROOT, 'docs/ai/decisions.md'), 'utf8');

/** SIGNED (a) — the summary sentence. */
const SIGNED_A =
  'It cannot read outside a chosen folder, cannot reach the network, and cannot change any file on disk except the one file the user has opened for editing — and that only when they click Save, never on its own.';

/** SIGNED (b) — the final row. */
const SIGNED_B =
  "| **Edit save-back (M12 / spec 012)** | User opens a document for editing on the app page and clicks **Save**; one click per save. **Nothing saves on a timer and there is no autosave.** On Chromium that click asks the browser for write access to that one file (`handle.requestPermission({ mode: 'readwrite' })`); the browser shows its own prompt whenever it does not already hold that grant. | Only the **one file being edited** — never another file, and never the folder: the folder handle stays read-only (`mode: 'read'`), and write access is asked for on that file's own handle, at the click, not before. Immediately before writing, Peekover re-reads the file and compares it with what it last read or wrote; if the file changed on disk in between, it **writes nothing**, says so in words, and keeps the edit on screen. (The check and the write are two steps: a change landing in the instant between them is not caught.) On Firefox, on any route with no live file handle, and when the write prompt is declined, Save hands the text to the browser as an ordinary **download** instead and changes nothing in the folder. **Never touches the network.** | **No new storage.** The write goes to the user's own file on their own disk. The per-file handle lives in memory for the open tab only and is never written to IndexedDB — the stored handle in the folder-read row is the *folder's*, and stays read-only. | The **Save** button and the status line beside it, which says in words what happened: saved, saved as a download, not saved because the file changed on disk, or failed. Declining the browser's write prompt is always safe — the edit becomes a download. **Revoke** on the folder chip closes the folder and drops the file handle with it, so nothing can be saved until the folder is opened again. The chip shows that a folder is open; it does **not** show whether the browser holds a write grant for a file, and Revoke does not ask the browser to withdraw one — that grant is the browser's, visible and removable in its own site-permission controls. |";

/** The three substitutions (b) → (b′), as signed: [final (b) text, interim (b′) text]. */
const SUBSTITUTIONS: ReadonlyArray<readonly [string, string]> = [
  [
    'On Firefox, on any route with no live file handle, and when the write prompt is declined, Save hands the text to the browser as an ordinary **download** instead and changes nothing in the folder.',
    'On Firefox, on any route with no live file handle, and when the write prompt is declined, Save does not save: it says so in words, keeps the edit on screen, and changes nothing on disk.',
  ],
  [
    'saved, saved as a download, not saved because the file changed on disk, or failed',
    'saved, not saved because the file changed on disk, not available here, or failed',
  ],
  [
    "Declining the browser's write prompt is always safe — the edit becomes a download.",
    "Declining the browser's write prompt is always safe — nothing is written and the edit stays on screen.",
  ],
];

/** What (a) replaced — searched for with the ledger's line wraps collapsed, since it was wrapped. */
const OLD_SUMMARY = 'cannot read outside a chosen folder, cannot write, and cannot reach the network';
const unwrapped = ledger.replace(/\s+/g, ' ');

const count = (haystack: string, needle: string): number => haystack.split(needle).length - 1;

describe('PERMISSIONS.md — the signed edit save-back wording (012 tasks 5.3 and 5.4; D-9)', () => {
  it('carries SIGNED (a), the summary sentence, exactly once', () => {
    expect(count(ledger, SIGNED_A)).toBe(1);
  });

  it('carries SIGNED (b), the final row, exactly once and as a whole table line', () => {
    expect(count(ledger, SIGNED_B)).toBe(1);
    expect(ledger.split('\n')).toContain(SIGNED_B);
  });

  // The old SUMMARY sentence only. The watch-relay row also says "it cannot write", of the relay,
  // and that stays true — so this is not a search for the two words.
  it('no longer carries the summary sentence that said folder mode "cannot write"', () => {
    expect(unwrapped).not.toContain(OLD_SUMMARY);
    expect(unwrapped).not.toMatch(/outside a chosen folder, cannot write\b/);
  });

  it("carries each of the final row (b)'s three download texts, exactly once", () => {
    for (const [final] of SUBSTITUTIONS) expect(count(ledger, final), final).toBe(1);
  });

  it("carries NONE of the interim row (b′)'s three texts — 5.4 replaced them with the download", () => {
    for (const [, interim] of SUBSTITUTIONS) expect(ledger).not.toContain(interim);
    expect(ledger).not.toContain('not available here');
    expect(ledger).not.toContain('Save does not save');
  });
});

describe('the literals above ARE the signed text (decisions.md, "M12 TASK 5.1")', () => {
  const entryStart = decisions.indexOf('M12 TASK 5.1 — the `PERMISSIONS.md` ledger wording SIGNED');
  const entry = decisions.slice(entryStart, decisions.indexOf('\n- **', entryStart + 1));

  it('finds the 5.1 entry', () => {
    expect(entryStart).toBeGreaterThan(-1);
    expect(entry).toContain('sign as proposed, all leans');
  });

  it('(a) is quoted verbatim in the entry', () => {
    expect(entry).toContain(`> ${SIGNED_A}\n`);
  });

  it('(b) is quoted verbatim in the entry, as one whole line', () => {
    const finalRow = entry.split('\n').find((l) => l.startsWith('  > | **Edit save-back'));
    expect(finalRow).toBeDefined();
    expect(finalRow!.slice('  > '.length)).toBe(SIGNED_B);
  });

  it('the three texts are the signed substitutions: each final text once in (b), each interim text quoted in the entry', () => {
    for (const [final, interim] of SUBSTITUTIONS) {
      expect(count(SIGNED_B, final), final).toBe(1);
      expect(entry, interim).toContain(`> ${interim}\n`);
    }
  });
});

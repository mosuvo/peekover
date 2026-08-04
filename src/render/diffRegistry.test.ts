// diffRegistry — the pure holder's behaviour (jsdom). The PRODUCTION-PATH proof (which context
// production registers, and that the content script registers none) is the real-engine seam test
// in tests/browser/diffRegistry.browser.test.ts; this file only pins the holder's own contract:
// register replaces, presence flips, reset clears.

import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import {
  registerDiffContext,
  getDiffContext,
  isDiffContextRegistered,
  resetDiffRegistryForTest,
  createDiffContext,
  type DiffContext,
  type DiffFileEntry,
} from './diffRegistry';
import { assertRegistrationsUseFactory } from '../../tests/util/seamPin';

/** A minimal context — the holder never calls its closures, so plain stubs suffice here. */
function ctx(docId: string): DiffContext {
  return {
    docId,
    getCurrentSource: () => undefined,
    fetchMeta: async () => [],
    fetchText: async () => undefined,
    showDiff: () => ({ ok: true }),
    hideDiff: () => undefined,
  };
}

beforeEach(() => {
  resetDiffRegistryForTest();
});

describe('diffRegistry — the register-once holder (task 2.1)', () => {
  it('starts empty: nothing registered, getDiffContext is null', () => {
    expect(isDiffContextRegistered()).toBe(false);
    expect(getDiffContext()).toBeNull();
  });

  it('register flips presence and returns the SAME context by identity', () => {
    const c = ctx('folder-a/a.md');
    registerDiffContext(c);
    expect(isDiffContextRegistered()).toBe(true);
    expect(getDiffContext()).toBe(c); // identity, not a copy
  });

  it('register REPLACES — last write wins (mirrors registerWatchTarget)', () => {
    const first = ctx('folder-a/a.md');
    const second = ctx('folder-b/b.md');
    registerDiffContext(first);
    registerDiffContext(second);
    expect(getDiffContext()).toBe(second);
    expect(getDiffContext()).not.toBe(first);
  });

  it('reset returns to empty — a stale registration does not persist', () => {
    registerDiffContext(ctx('folder-a/a.md'));
    expect(isDiffContextRegistered()).toBe(true);
    resetDiffRegistryForTest();
    expect(isDiffContextRegistered()).toBe(false);
    expect(getDiffContext()).toBeNull();
  });
});

// ── 008 D-3: THE SECOND, OPTIONAL CAPABILITY PAIR ─────────────────────────────────────────────
//
// Everything above this line is UNEDITED, and that is the load-bearing part of this task: `ctx()`
// (the fake at the top of this file) still builds a legal context with the four capability members
// alone, so the pair below is ADDITIVE by demonstration rather than by assertion. The same holds
// for `diffChrome.test.ts` and `diffChrome.browser.test.ts`, whose fakes this commit does not
// touch at all — checkable as an empty diff on those two files.

/** The other files a folder could offer, and their text — the PICKED side of current-vs-picked.
 *  Distinct strings throughout, so an answer from the wrong closure cannot pass as the right one. */
const OTHER_FILES: DiffFileEntry[] = [
  { path: 'notes/b.md', name: 'b.md' },
  { path: 'c.md', name: 'c.md' },
];
const OTHER_TEXT: Record<string, string> = {
  'notes/b.md': '# b — the picked file text',
  'c.md': '# c — the other picked file text',
};

/** The four capability members' own answers, each distinguishable from every other. */
const CURRENT_SOURCE = '# a — the CURRENT source on screen';
const SNAPSHOT_TEXT = '# a — an OLDER snapshot of this document';

/** The six-member config every existing call site already builds — the snapshot-pair-only state. */
function baseConfig() {
  return {
    docId: 'folder-a/a.md',
    getCurrentSource: () => CURRENT_SOURCE as string | undefined,
    fetchMeta: async () => [{ id: 's1', ts: 1, bytes: 2 }],
    fetchText: async (id: string) => (id === 's1' ? SNAPSHOT_TEXT : undefined),
    showDiff: () => ({ ok: true }) as const,
    hideDiff: () => undefined,
  };
}

describe('diffRegistry — the SECOND, OPTIONAL capability pair (008 D-3)', () => {
  it('is ABSENT by default — the existing fake, UNEDITED, is still a legal context', () => {
    // `ctx()` is this file's original fake: six members, no folder list. It compiles and registers
    // unchanged, which is exactly what "optional, not required" has to mean.
    const c = ctx('folder-a/a.md');
    registerDiffContext(c);
    const got = getDiffContext()!;

    expect('fetchFiles' in got).toBe(false);
    expect('fetchFileText' in got).toBe(false);
    expect(got.fetchFiles).toBeUndefined();
    expect(got.fetchFileText).toBeUndefined();
    // …and the snapshot pair is fully usable in that state: snapshots but NO folder list is a
    // legal, designed state, not a half-built context.
    expect(typeof got.fetchMeta).toBe('function');
    expect(typeof got.fetchText).toBe('function');
  });

  it('the FACTORY accepts the six-member config unchanged, and leaves the pair absent', async () => {
    const c = createDiffContext(baseConfig());
    expect(c.fetchFiles).toBeUndefined();
    expect(c.fetchFileText).toBeUndefined();
    expect(await c.fetchText('s1')).toBe(SNAPSHOT_TEXT);
  });

  it('carries the pair through the factory and answers for the PICKED file, by path', async () => {
    registerDiffContext(
      createDiffContext({
        ...baseConfig(),
        fetchFiles: async () => OTHER_FILES,
        fetchFileText: async (path: string) => OTHER_TEXT[path],
      }),
    );
    const got = getDiffContext()!;

    // The list survives the factory intact — path AND name, the two things a row needs.
    expect(await got.fetchFiles!()).toEqual(OTHER_FILES);

    // CURRENT-VS-PICKED: the picked side is THAT path's text — not the current source, and not the
    // snapshot pair's answer. A closure that ignored its argument, or one wired to the wrong pair,
    // cannot produce all three of these at once.
    const picked = await got.fetchFileText!('notes/b.md');
    expect(picked).toBe(OTHER_TEXT['notes/b.md']);
    expect(await got.fetchFileText!('c.md')).toBe(OTHER_TEXT['c.md']);
    expect(picked).not.toBe(got.getCurrentSource());
    expect(picked).not.toBe(await got.fetchText('s1'));

    // An unreadable / unknown other file is `undefined` — the same designed shape `fetchText` uses
    // for a reclaimed snapshot, so the affordance has ONE fallback to write, not two.
    expect(await got.fetchFileText!('gone.md')).toBeUndefined();
  });

  it('★ ADDITIVE: the snapshot pair behaves IDENTICALLY with and without the file pair', async () => {
    const shared = baseConfig();
    const withoutPair = createDiffContext({ ...shared });
    const withPair = createDiffContext({
      ...shared,
      fetchFiles: async () => OTHER_FILES,
      fetchFileText: async (path: string) => OTHER_TEXT[path],
    });

    // Same closures BY IDENTITY — nothing wrapped, re-bound or shadowed them on the way through.
    expect(withPair.fetchMeta).toBe(withoutPair.fetchMeta);
    expect(withPair.fetchText).toBe(withoutPair.fetchText);
    expect(withPair.showDiff).toBe(withoutPair.showDiff);
    expect(withPair.hideDiff).toBe(withoutPair.hideDiff);
    expect(withPair.getCurrentSource).toBe(withoutPair.getCurrentSource);

    // …and same ANSWERS, which is the property a user would notice if it broke.
    expect(await withPair.fetchMeta()).toEqual(await withoutPair.fetchMeta());
    expect(await withPair.fetchText('s1')).toBe(await withoutPair.fetchText('s1'));
    expect(await withPair.fetchText('gone')).toBe(await withoutPair.fetchText('gone'));
    expect(withPair.getCurrentSource()).toBe(withoutPair.getCurrentSource());
    expect(withPair.docId).toBe(withoutPair.docId);
  });
});

// ── THE CONFINEMENT PIN — the four existing capability members are BYTE-UNCHANGED ──────────────
//
// D-3 is additive, and "additive" is a claim about the four members that were already there —
// declarations AND doc comments. Eyeballing a diff is what finding 5 exists to replace, so the
// block is pinned by DIGEST against the bytes it had at HEAD before this task (`21526ac`), with a
// control in the same test that proves the digest discriminates a ONE-WORD change.
const MEMBERS_START = "  /** This document's snapshot meta entries";
const MEMBERS_END = '  hideDiff(host: HTMLElement): void;';
/** Byte length + SHA-256 of the four-member block as `git show 21526ac:src/render/diffRegistry.ts`
 *  carries it (UTF-8, LF). Both are measured, not eyeballed. */
const MEMBERS_BYTES = 1194;
const MEMBERS_SHA256 = 'ab9753bb90a7cbeb19086978488782748b165e91aa95f6d96eb8acffacc963fa';

function sha256(text: string): string {
  return createHash('sha256').update(Buffer.from(text, 'utf8')).digest('hex');
}

describe('THE CONFINEMENT PIN — the snapshot pair is byte-untouched (D-3 is ADDITIVE)', () => {
  it('the four existing members hash to their pre-task bytes — and the digest can see one word move', () => {
    const src = readFileSync(resolve(process.cwd(), 'src/render/diffRegistry.ts'), 'utf8');
    const start = src.indexOf(MEMBERS_START);
    expect(start, 'the four members were not found — the pin would be vacuous').toBeGreaterThan(-1);
    const end = src.indexOf(MEMBERS_END, start);
    expect(end, 'hideDiff was not found after fetchMeta — the pin would be vacuous').toBeGreaterThan(start);
    const block = src.slice(start, end + MEMBERS_END.length);

    expect(Buffer.byteLength(block, 'utf8')).toBe(MEMBERS_BYTES);
    expect(sha256(block)).toBe(MEMBERS_SHA256);

    // THE CONTROL, in the same test and under the same conditions: change ONE word's case inside
    // a doc comment and the digest must reject it. Without this the assertion above could not be
    // told apart from a digest that matches anything.
    const perturbed = block.replace('meta ONLY', 'meta only');
    expect(perturbed).not.toBe(block);
    expect(sha256(perturbed)).not.toBe(MEMBERS_SHA256);

    // The new pair was added BESIDE the block, never inside it.
    expect(block).not.toContain('fetchFiles');
    expect(block).not.toContain('fetchFileText');
    expect(src).toContain('fetchFiles?(): Promise<DiffFileEntry[]>;');
  });
});

// THE SEAM PIN — the diff registry's twin of the M5 watch pin, built on the SAME shared helper
// (D-2, task 4.1). It lives here, beside the registry it guards, rather than in contentWatch.test.ts:
// each registry's call-site pin sits next to that registry. The M5 seam rule is load-bearing here
// (diffRegistry.ts header): the only production path that registers a diff context is
// appShell.installWatchForFile, and after 2.1 that registration sits in the SAME file block as the
// watch registration — exactly the side-by-side shape a file-scoped matcher is weakest against.
describe('THE SEAM PIN — every production diff context is built by its factory (D-2)', () => {
  it('every production registerDiffContext call site builds its context with createDiffContext', () => {
    assertRegistrationsUseFactory({
      roots: ['src', 'entrypoints'],
      registerName: 'registerDiffContext',
      factoryName: 'createDiffContext',
      // One production call site: appShell.installWatchForFile (clause 1 — inline
      // createDiffContext({...}) after the 4.1 wrap). The content-script graph imports no symbol
      // from diffRegistry and registers none (2.1's proven architectural fact), so there is no
      // second site and no un-loadable entrypoint pin.
      minCallSites: 1,
    });
  });
});

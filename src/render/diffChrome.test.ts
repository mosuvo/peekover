// @vitest-environment jsdom
//
// diffChrome unit tests (task 6.2) — the D-14 GATE and the shape of what the gate lets through.
//
// SCOPE, deliberately narrow. What is provable without layout lives here: that an empty registry
// yields `[]` AND NO NOTE, that a populated one yields the affordance, and that the click flow
// reaches the DiffContext's provisioned closures rather than importing an engine. Everything that
// needs a real engine — that the affordance is a SIBLING of `.peekover-reader` under a real
// `mount()`, that it is absent on the content-script surface as an architectural FACT rather than
// a hand-set registry, its geometry, and the enter/exit round trip — is in
// tests/browser/diffChrome.browser.test.ts, because jsdom cannot see any of it.

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { buildDiffChrome, DIFF_AFFORDANCE_CLASS, DIFF_PICKER_CLASS, DIFF_STATUS_CLASS } from './diffChrome';
import {
  registerDiffContext,
  resetDiffRegistryForTest,
  type DiffContext,
  type DiffFileEntry,
  type DiffOutcome,
} from './diffRegistry';
import type { SnapshotMetaEntry } from '../app/snapshots';
// 2.5's caption names the document on screen, and this is the module that holds that name (D-1).
// Registered here rather than transcribed: a caption built from a stale seam would read fine and be
// wrong, and `resetDocIdentityForTest` keeps one case's name out of the next.
import { registerDocIdentity, resetDocIdentityForTest } from './docIdentity';

const ENTRIES: SnapshotMetaEntry[] = [
  { id: 'older', ts: 1_700_000_000_000, bytes: 512 },
  { id: 'newer', ts: 1_700_000_600_000, bytes: 2048 },
];

/** The D-3 pair's material (task 2.2 provisions it from `activeSource.files`, EXCLUDING the open
 *  document). Folder order, not alphabetical — the picker keeps whatever order it is handed. */
const FILES: DiffFileEntry[] = [
  { path: 'notes/intro.md', name: 'intro.md' },
  { path: 'notes/appendix.md', name: 'appendix.md' },
];

interface Recorder {
  context: DiffContext;
  shown: { before: string; after: string }[];
  hidden: number;
}

/** A recording context — the stand-in for what `appShell.installWatchForFile` provisions. It is
 *  hand-registered HERE on purpose: this file tests `buildDiffChrome`'s own logic, and the
 *  production-registration seam (which surface really registers one) is 2.1's browser proof, not
 *  something a jsdom test may quietly re-assert about itself. */
function recordingContext(over: Partial<DiffContext> = {}): Recorder {
  const shown: { before: string; after: string }[] = [];
  const rec: Recorder = {
    shown,
    hidden: 0,
    context: {
      docId: 'folder/doc.md',
      getCurrentSource: () => 'current text',
      fetchMeta: async () => ENTRIES,
      fetchText: async () => 'snapshot text',
      showDiff: (_host, before, after): DiffOutcome => {
        shown.push({ before, after });
        return { ok: true };
      },
      hideDiff: () => {
        rec.hidden += 1;
      },
      ...over,
    },
  };
  return rec;
}

function host(): HTMLElement {
  return document.createElement('div');
}

/** Build the chrome into a container so queries read like the shadow tree mount() commits. */
function build(h: HTMLElement = host()): HTMLElement {
  const box = document.createElement('div');
  box.append(...buildDiffChrome(h));
  return box;
}

const pillOf = (box: HTMLElement) => box.querySelector<HTMLButtonElement>(`.${DIFF_AFFORDANCE_CLASS}`)!;
const pickerOf = (box: HTMLElement) => box.querySelector<HTMLElement>(`.${DIFF_PICKER_CLASS}`)!;
const statusOf = (box: HTMLElement) => box.querySelector<HTMLElement>(`.${DIFF_STATUS_CLASS}`)!;

/** Let the click handler's awaited fetchMeta/fetchText microtasks drain. */
const flush = () => new Promise<void>((r) => setTimeout(r, 0));

/**
 * A STRUCTURAL fingerprint of a subtree: tag + ARIA role + depth, and nothing else — no text, no
 * data attributes, no classes. Two pickers with the same fingerprint have the same DOM SHAPE.
 *
 * It is a printed tree rather than a count because of how it has to FAIL: the D-4 non-regression
 * below reds when a group node appears in a single-kind picker, and a diff of two indented trees
 * NAMES `div[role=group]` on the line it appeared. A `querySelectorAll('[role="group"]').length`
 * check alone would red with `expected 1 to be 0`, which says nothing about where.
 */
function shapeOf(el: Element, depth = 0): string {
  const line = `${'  '.repeat(depth)}${el.tagName.toLowerCase()}[role=${el.getAttribute('role') ?? '-'}]`;
  return [line, ...[...el.children].map((c) => shapeOf(c, depth + 1))].join('\n');
}

/** ★ WHAT 006 SHIPS, WRITTEN OUT — the shape the single-kind picker must still have (D-4). Two
 *  snapshot rows, each a `button role="option"` holding its two unroled spans, sitting DIRECTLY in
 *  the one listbox. Nothing between the listbox and a row. */
const SNAPSHOT_ONLY_SHAPE = [
  'div[role=listbox]',
  '  button[role=option]',
  '    span[role=-]',
  '    span[role=-]',
  '  button[role=option]',
  '    span[role=-]',
  '    span[role=-]',
].join('\n');

/** Open the picker of a freshly built chrome over `context` and hand back the picker element. */
async function openedPicker(over: Partial<DiffContext> = {}): Promise<HTMLElement> {
  resetDiffRegistryForTest();
  registerDiffContext(recordingContext(over).context);
  const box = build();
  pillOf(box).click();
  await flush();
  return pickerOf(box);
}

beforeEach(() => {
  resetDiffRegistryForTest();
  resetDocIdentityForTest();
});

describe('buildDiffChrome — the D-14 gate (§3.2)', () => {
  it('returns [] when no diff context is registered', () => {
    expect(buildDiffChrome(host())).toEqual([]);
  });

  it('returns NO note on the empty gate — the absence of a note branch IS the decision', () => {
    // §3.2 verbatim: "there is nothing to be told they are missing. Do not add one." This is the
    // clause that separates buildDiffChrome from buildWatchChrome's four-state, so it is asserted
    // as a property of the RETURNED NODES, not merely as a length — a future "helpful" note would
    // be a Node with text, and `toEqual([])` alone would still catch it, but this names why.
    const nodes = buildDiffChrome(host());
    expect(nodes).toHaveLength(0);
    expect(nodes.some((n) => (n.textContent ?? '').trim().length > 0)).toBe(false);
  });

  it('returns the affordance once a context IS registered (the gate is non-vacuous)', () => {
    registerDiffContext(recordingContext().context);
    const box = build();
    expect(pillOf(box)).not.toBeNull();
    expect(pillOf(box).textContent).toBe('Compare');
    expect(pillOf(box).getAttribute('aria-label')).toBe('Compare this document with a saved snapshot');
    expect(pillOf(box).getAttribute('aria-expanded')).toBe('false');
  });

  it('reads the registry at BUILD time — a context registered later needs a rebuild, not a stale node', () => {
    // The seam, stated as a lifetime property: nothing is captured that outlives a re-render.
    expect(buildDiffChrome(host())).toEqual([]);
    registerDiffContext(recordingContext().context);
    expect(buildDiffChrome(host()).length).toBeGreaterThan(0);
  });

  it('ships the picker and the status line hidden, and both out of the a11y tree', () => {
    registerDiffContext(recordingContext().context);
    const box = build();
    // `hidden`, not a class: an empty role="status"/role="listbox" region that is merely
    // transparent still gets announced by some AT.
    expect(pickerOf(box).hidden).toBe(true);
    expect(statusOf(box).hidden).toBe(true);
    expect(statusOf(box).getAttribute('role')).toBe('status');
    expect(pickerOf(box).getAttribute('role')).toBe('listbox');
  });
});

describe('buildDiffChrome — the picker (spec §3.7, mockup divergences 1 and 2)', () => {
  it('opens a listbox of snapshot rows, newest first — never a dialog (divergence 1)', async () => {
    registerDiffContext(recordingContext().context);
    const box = build();
    pillOf(box).click();
    await flush();

    const picker = pickerOf(box);
    expect(picker.hidden).toBe(false);
    expect(pillOf(box).getAttribute('aria-expanded')).toBe('true');
    // Divergence 1: inline listbox, not a modal. No dialog role and no modal flag anywhere.
    expect(picker.getAttribute('role')).toBe('listbox');
    expect(box.querySelector('[role="dialog"]')).toBeNull();
    expect(box.querySelector('[aria-modal]')).toBeNull();

    const items = [...picker.querySelectorAll<HTMLButtonElement>('[role="option"]')];
    expect(items).toHaveLength(2);
    expect(items.map((i) => i.dataset.snapshotId)).toEqual(['newer', 'older']); // newest first
    // Keyboard-operable for free: real buttons, in the tab order, Enter/Space native.
    expect(items.every((i) => i.tagName === 'BUTTON' && i.type === 'button')).toBe(true);
  });

  it('rows are DIFF TARGETS, not versions — no version number, no restore verb (divergence 2)', () => {
    registerDiffContext(recordingContext().context);
    const box = build();
    pillOf(box).click();
    return flush().then(() => {
      const text = pickerOf(box).textContent ?? '';
      expect(text).not.toMatch(/\bv\d/i);
      expect(text).not.toMatch(/restore/i);
      expect(text).not.toMatch(/version/i);
      expect(text).not.toMatch(/ago\b/i); // absolute stamps, not the mockup's "2 min ago"
      // ...and non-vacuously, each row DOES name a time and a size to compare against.
      const row = pickerOf(box).querySelector<HTMLElement>('[role="option"]')!;
      expect(row.querySelector('.peekover-diff-picker__when')!.textContent).toBeTruthy();
      expect(row.querySelector('.peekover-diff-picker__size')!.textContent).toBe('2 KB');
      expect(row.getAttribute('aria-label')).toMatch(/^Compare with the snapshot from .+ \(2 KB\)$/);
    });
  });

  it('a second click on the pill closes an open picker', async () => {
    registerDiffContext(recordingContext().context);
    const box = build();
    pillOf(box).click();
    await flush();
    expect(pickerOf(box).hidden).toBe(false);
    pillOf(box).click();
    expect(pickerOf(box).hidden).toBe(true);
    expect(pillOf(box).getAttribute('aria-expanded')).toBe('false');
  });

  it('EMPTY STATE: no snapshots yet is answered, never left blank (AGENTS.md #5)', async () => {
    registerDiffContext(recordingContext({ fetchMeta: async () => [] }).context);
    const box = build();
    pillOf(box).click();
    await flush();

    expect(pickerOf(box).hidden).toBe(true);
    expect(statusOf(box).hidden).toBe(false);
    expect(statusOf(box).textContent).toContain('No snapshots yet');
    // This is NOT the D-14 note branch: the user asked by clicking, so an answer is owed. The
    // gate above still returns [] with nothing at all when no context is registered.
  });
});

describe('buildDiffChrome — TWO KINDS: the row discriminant (D-3) and the two groups (D-4)', () => {
  // ★ 2.5 ADDS `fetchFileText` — the pair is provisioned TOGETHER by `appShell` (`:987`, `:994`)
  // and `diffRegistry.ts:146` says so ("provisioned alongside `fetchFiles` and absent whenever it
  // is"), so a fixture that offered file rows no capability to resolve them was a shape production
  // never produces. The rendering cases below are indifferent to it; the branch case is not.
  const bothKinds = {
    fetchFiles: async () => FILES,
    fetchFileText: async (path: string) => `text of ${path}`,
  };

  it('EVERY row carries its OWN kind, on the ROW — snapshots say snapshot, files say file', async () => {
    // The discriminant is the thing 2.5's single branch reads, so what matters is not that the
    // attribute EXISTS but that it is on the RIGHT rows. Asserted as the whole (kind, key) list in
    // document order: a build that labels every row 'snapshot', or that swaps the two, reds naming
    // the row it mislabelled rather than "expected 4 to be 4".
    const picker = await openedPicker(bothKinds);
    const rows = [...picker.querySelectorAll<HTMLElement>('[role="option"]')];
    expect(rows.map((r) => [r.dataset.targetKind, r.dataset.snapshotId ?? r.dataset.filePath])).toEqual([
      ['snapshot', 'newer'], // newest first, unchanged
      ['snapshot', 'older'],
      ['file', 'notes/intro.md'], // folder order, unchanged
      ['file', 'notes/appendix.md'],
    ]);
    // ...and no row is ambiguous: a snapshot row carries no file path and vice versa.
    expect(rows.filter((r) => r.dataset.snapshotId != null && r.dataset.filePath != null)).toEqual([]);
  });

  it('a file row NAMES the file and SAYS IT IS A FILE, in text (never by which group it is in)', async () => {
    const picker = await openedPicker(bothKinds);
    const row = picker.querySelector<HTMLElement>('[data-target-kind="file"]')!;
    expect(row.querySelector('.peekover-diff-picker__name')!.textContent).toBe('intro.md');
    expect(row.querySelector('.peekover-diff-picker__kind')!.textContent).toBe('File');
    // The kind is in the row's OWN text, so it survives being read out of context (§5).
    expect(row.textContent).toContain('File');
    expect(row.getAttribute('aria-label')).toBe('Compare with the file intro.md');
    // Still a real button, for :264-283's stated reason — Enter/Space and the tab order for free.
    expect(row.tagName).toBe('BUTTON');
    expect((row as HTMLButtonElement).type).toBe('button');
  });

  it('BOTH kinds → ONE listbox holding TWO labelled groups, snapshots first', async () => {
    const picker = await openedPicker(bothKinds);
    const groups = [...picker.querySelectorAll<HTMLElement>('[role="group"]')];
    expect(groups).toHaveLength(2);
    expect(groups.map((g) => g.getAttribute('aria-label'))).toEqual([
      'Snapshots of this document',
      'Other files in this folder',
    ]);
    // Each group is a DIRECT child of the ONE listbox — the ARIA ownership D-4 relies on, asserted
    // as a parent identity rather than a `contains`.
    for (const g of groups) expect(g.parentNode).toBe(picker);
    expect(picker.getAttribute('role')).toBe('listbox');
    // ...and the rows are in the RIGHT group: a build that fills one group with both kinds reds.
    expect([...groups[0].children].map((r) => (r as HTMLElement).dataset.targetKind)).toEqual([
      'snapshot',
      'snapshot',
    ]);
    expect([...groups[1].children].map((r) => (r as HTMLElement).dataset.targetKind)).toEqual([
      'file',
      'file',
    ]);
    // Still ONE control and still not a dialog: §3.2 rejected a second control, divergence 1 the
    // modal. Grouping is the ARIA answer to "one list, two kinds" — it adds neither.
    const box = picker.parentElement!;
    expect(box.querySelector('[role="dialog"]')).toBeNull();
    expect(box.querySelector('[role="menu"]')).toBeNull();
    expect(box.querySelector('[aria-modal]')).toBeNull();
    expect(box.querySelectorAll(`.${DIFF_AFFORDANCE_CLASS}`)).toHaveLength(1);
    expect(box.querySelectorAll('[role="listbox"]')).toHaveLength(1);
  });

  it('★ ONE KIND → NO GROUPS: the snapshot-only picker is STRUCTURALLY what 006 ships', async () => {
    // THE NON-REGRESSION, and the reason it is a printed shape rather than a count: the existing
    // browser and unit assertions all drive this path, so if the two-group scaffolding leaked into
    // it they would keep passing while the DOM every AT user meets had changed underneath them.
    //
    // Two arms, because there are two ways to be single-kind and BOTH must land on 006's shape:
    //   (a) the 006-shaped context itself — no `fetchFiles` member at all (the surface with no
    //       folder list; the state D-3 made legal by keeping the pair OPTIONAL);
    //   (b) the 008 context whose folder simply holds no other markdown — `fetchFiles` → [].
    const sixShape = shapeOf(await openedPicker());
    const emptyFolderShape = shapeOf(await openedPicker({ fetchFiles: async () => [] }));

    expect(sixShape).toBe(SNAPSHOT_ONLY_SHAPE); // the absolute pin
    expect(emptyFolderShape).toBe(sixShape); // ...and the two legal provisions agree
  });

  it('★ ...and the shape probe DISCRIMINATES — the both-kinds picker really is a different tree', async () => {
    // Without this the assertion above could pass by shapeOf() being blind to grouping.
    const grouped = shapeOf(await openedPicker(bothKinds));
    expect(grouped).not.toBe(SNAPSHOT_ONLY_SHAPE);
    expect(grouped).toContain('div[role=group]');
    expect(SNAPSHOT_ONLY_SHAPE).not.toContain('group');
  });

  it('FILES ONLY is single-kind too — flat file rows, no lone group', async () => {
    const picker = await openedPicker({ fetchMeta: async () => [], fetchFiles: async () => FILES });
    expect(picker.hidden).toBe(false); // it OPENS: files alone are comparison targets
    expect(picker.querySelectorAll('[role="group"]')).toHaveLength(0);
    expect([...picker.children].map((c) => c.getAttribute('role'))).toEqual(['option', 'option']);
  });

  it('BOTH empty is TODAY’S shipped path, preserved unchanged', async () => {
    // The surface with no folder list takes this branch on every open, and 2.4 revisits the COPY
    // for the two half-empty states. What must not move is the behaviour: close, and say so.
    const picker = await openedPicker({ fetchMeta: async () => [], fetchFiles: async () => [] });
    expect(picker.hidden).toBe(true);
    expect(statusOf(picker.parentElement as HTMLElement).textContent).toContain('No snapshots yet');
  });

  it('the listbox’s own label covers BOTH kinds, not snapshots alone', async () => {
    const picker = await openedPicker(bothKinds);
    const label = picker.getAttribute('aria-label')!;
    expect(label).toMatch(/snapshot/i);
    expect(label).toMatch(/file/i);
  });

  it('★ 2.5 — a file row routes through fetchFileText, NEVER through fetchText (the ONE branch)', async () => {
    // ★ RE-SCOPED, NOT DELETED (the 2.4 precedent). Until 2.5 this asserted the file row had NO
    // handler — the boundary of 2.3, pinned so the branch could not be written early. 2.5 IS that
    // branch, so the pin now asserts the thing it was guarding the shape of: which capability the
    // discriminant routes a file pick to. The defect it always named is unchanged and still the
    // signature to look for — a file pick answered with "that snapshot is no longer stored".
    resetDiffRegistryForTest();
    const snapshotAsked: string[] = [];
    const fileAsked: string[] = [];
    const rec = recordingContext({
      ...bothKinds,
      fetchText: async (id) => {
        snapshotAsked.push(id);
        return 'snapshot text';
      },
      fetchFileText: async (path) => {
        fileAsked.push(path);
        return 'other file text';
      },
    });
    registerDiffContext(rec.context);
    const box = build();
    pillOf(box).click();
    await flush();
    pickerOf(box).querySelector<HTMLButtonElement>('[data-target-kind="file"]')!.click();
    await flush();

    // The branch read the ROW's own discriminant and picked the file capability, with the path that
    // row carries — and the snapshot capability was never asked anything at all.
    expect(fileAsked).toEqual(['notes/intro.md']);
    expect(snapshotAsked).toEqual([]);
    // …and the diff ran over the PICKED FILE's text against what is on screen (§9-5: current-vs-
    // picked). Asserted as the whole (before, after) pair, so a swap reds naming both sides.
    expect(rec.shown).toEqual([{ before: 'other file text', after: 'current text' }]);
    expect(statusOf(box).textContent).not.toContain('snapshot is no longer stored');
  });

  it('★ 2.5 — a SNAPSHOT row still routes through fetchText, and still says NOTHING (Q1)', async () => {
    // The other half of the same branch, and the control for the case above: one `if` that always
    // took the file leg would red here rather than pass quietly. Gate-2 ruling Q1 in one assertion —
    // a snapshot comparison's presentation is what it was before this task.
    resetDiffRegistryForTest();
    const fileAsked: string[] = [];
    const rec = recordingContext({
      ...bothKinds,
      fetchFileText: async (path) => {
        fileAsked.push(path);
        return 'other file text';
      },
    });
    registerDiffContext(rec.context);
    const box = build();
    pillOf(box).click();
    await flush();
    pickerOf(box).querySelector<HTMLButtonElement>('[data-target-kind="snapshot"]')!.click();
    await flush();

    expect(fileAsked).toEqual([]);
    expect(rec.shown).toEqual([{ before: 'snapshot text', after: 'current text' }]);
    // ★ NO CAPTION on a snapshot diff — the status line is still empty and still out of the a11y
    // tree, which is today's shipped behaviour byte-for-byte (Q1: "leave snapshot diffs verbatim").
    expect(statusOf(box).hidden).toBe(true);
    expect(statusOf(box).textContent).toBe('');
  });

  it('★ 2.5 — the file-vs-file caption NAMES BOTH SIDES, and says which side is which (D-5)', async () => {
    // §4: "name both sides … in text", §5: never by position or colour. The direction clause is
    // asserted, not just the two names — a caption listing both names and leaving the reader to
    // guess which one the red blocks came from is exactly what §3.2's surviving obligation is about.
    resetDiffRegistryForTest();
    registerDocIdentity('CLAUDE.md');
    registerDiffContext(recordingContext(bothKinds).context);
    const box = build();
    pillOf(box).click();
    await flush();
    pickerOf(box).querySelector<HTMLButtonElement>('[data-target-kind="file"]')!.click();
    await flush();

    const caption = statusOf(box).textContent!;
    expect(statusOf(box).hidden).toBe(false);
    expect(caption).toContain('CLAUDE.md'); // the document on screen — the diff's "after"
    expect(caption).toContain('intro.md'); // the picked file — the diff's "before"
    expect(caption).toContain("removed lines are intro.md's");
    expect(caption).toContain("added lines are CLAUDE.md's");
  });

  it('★ 2.5 — an UNREADABLE other file says so, names the FILE, and never enters the diff (§3.8)', async () => {
    // The §3.8 rung, on the file side: `fetchFileText` answers `undefined` for a file it cannot
    // read (2.2 turns a rejected `read()` into exactly that), and the affordance must not borrow the
    // SNAPSHOT sentence for it — that would name a thing the user did not pick.
    resetDiffRegistryForTest();
    const rec = recordingContext({ ...bothKinds, fetchFileText: async () => undefined });
    registerDiffContext(rec.context);
    const box = build();
    pillOf(box).click();
    await flush();
    pickerOf(box).querySelector<HTMLButtonElement>('[data-target-kind="file"]')!.click();
    await flush();

    expect(rec.shown).toEqual([]); // the diff was never entered
    expect(statusOf(box).hidden).toBe(false);
    expect(statusOf(box).textContent).toBe('Comparison unavailable — intro.md could not be read.');
    expect(statusOf(box).textContent).not.toContain('snapshot');
  });
});

describe('buildDiffChrome — the capability arrives over the fence, not by import', () => {
  it('selecting a row calls the PROVISIONED showDiff with (snapshot text, current source)', async () => {
    const rec = recordingContext();
    registerDiffContext(rec.context);
    const box = build();
    pillOf(box).click();
    await flush();
    pickerOf(box).querySelector<HTMLButtonElement>('[data-snapshot-id="newer"]')!.click();
    await flush();

    // The whole point of the fence: this module computed nothing and rendered nothing itself.
    expect(rec.shown).toEqual([{ before: 'snapshot text', after: 'current text' }]);
    expect(pickerOf(box).hidden).toBe(true);
    expect(statusOf(box).hidden).toBe(true); // success says nothing — the diff IS the answer
  });

  it('after entering, the pill becomes EXIT and calls the provisioned hideDiff', async () => {
    const rec = recordingContext();
    registerDiffContext(rec.context);
    const box = build();
    pillOf(box).click();
    await flush();
    pickerOf(box).querySelector<HTMLButtonElement>('[role="option"]')!.click();
    await flush();

    expect(pillOf(box).dataset.diffOpen).toBe('true');
    expect(pillOf(box).textContent).toBe('Close comparison');
    // State is carried by the LABEL and the aria-label, not by colour alone (§5).
    expect(pillOf(box).getAttribute('aria-label')).toBe('Close comparison');

    pillOf(box).click();
    expect(rec.hidden).toBe(1);
    expect(pillOf(box).dataset.diffOpen).toBeUndefined();
    expect(pillOf(box).textContent).toBe('Compare');
  });
});

describe('buildDiffChrome — the fallback (plan §1.5, §7-8): explain, never blank', () => {
  it('a dangling meta entry (content gone) lands in "comparison unavailable"', async () => {
    const rec = recordingContext({ fetchText: async () => undefined });
    registerDiffContext(rec.context);
    const box = build();
    pillOf(box).click();
    await flush();
    pickerOf(box).querySelector<HTMLButtonElement>('[role="option"]')!.click();
    await flush();

    expect(statusOf(box).hidden).toBe(false);
    expect(statusOf(box).textContent).toContain('Comparison unavailable');
    // §1.5: the diff is never entered — showDiff was not even called, so nothing on screen moved.
    expect(rec.shown).toEqual([]);
    expect(pillOf(box).dataset.diffOpen).toBeUndefined();
    expect(pillOf(box).textContent).toBe('Compare');
  });

  it('nothing on screen to compare against (undefined current source) is its own honest state', async () => {
    const rec = recordingContext({ getCurrentSource: () => undefined });
    registerDiffContext(rec.context);
    const box = build();
    pillOf(box).click();
    await flush();
    pickerOf(box).querySelector<HTMLButtonElement>('[role="option"]')!.click();
    await flush();

    expect(statusOf(box).textContent).toContain('nothing is on screen to compare against');
    expect(rec.shown).toEqual([]);
  });

  it('a showDiff that fails surfaces ITS reason and leaves the pill in Compare', async () => {
    const rec = recordingContext({
      showDiff: () => ({ ok: false, reason: 'diff could not be rendered' }),
    });
    registerDiffContext(rec.context);
    const box = build();
    pillOf(box).click();
    await flush();
    pickerOf(box).querySelector<HTMLButtonElement>('[role="option"]')!.click();
    await flush();

    expect(statusOf(box).hidden).toBe(false);
    expect(statusOf(box).textContent).toBe('diff could not be rendered');
    expect(pillOf(box).dataset.diffOpen).toBeUndefined();
  });

  it('opening the picker again clears a stale status line', async () => {
    const rec = recordingContext({ fetchText: async () => undefined });
    registerDiffContext(rec.context);
    const box = build();
    pillOf(box).click();
    await flush();
    pickerOf(box).querySelector<HTMLButtonElement>('[role="option"]')!.click();
    await flush();
    expect(statusOf(box).hidden).toBe(false);

    pillOf(box).click();
    await flush();
    expect(statusOf(box).hidden).toBe(true);
    expect(pickerOf(box).hidden).toBe(false);
  });

  // ── 2.4: THE INVARIANT ABOVE THIS LINE WAS RE-SCOPED, NOT DELETED ────────────────────────────
  //
  // It used to read "mutually exclusive on EVERY path", and the CSS at readerCss.ts:421-428 leaned
  // on it in as many words. D-4's two HALF-EMPTY states end that: the picker LISTS the kind that
  // has entries while the status SPEAKS the empty one, both open at once, by design. So the
  // invariant becomes "mutually exclusive except the half-empty states, which are non-overlapping
  // by measured lane" — and it is pinned in BOTH halves below.
  //
  // ★ WHY THE OLD TEST WOULD HAVE STAYED GREEN THROUGH THE CHANGE, WHICH IS THE WHOLE POINT.
  // `recordingContext()`'s default has NO `fetchFiles` member at all, so it is the 006-shaped
  // surface: `files` is always `[]` AND `listsFiles` is false, so no path it can drive ever reaches
  // a half-empty state. The old assertion would have kept passing over a build that overlapped the
  // two on every half-empty open — a green that discriminated nothing. Every case below therefore
  // provisions `fetchFiles` EXPLICITLY, and the first one asserts the state it reached really is
  // the both-visible one, so it cannot silently degrade back into the vacuous version.
  //
  // WHAT IS AND IS NOT PROVABLE HERE. jsdom applies no cascade and returns all-zero rects, so
  // "non-overlapping" is NOT geometry in this file — it is the browser suite's hit-test at 1280 and
  // 1400 on both engines. What this file pins is the other half: that the status element really
  // MATCHES the lane's selector in exactly the states that need it, and really does not in the
  // states that must keep the original slot. Split that way on purpose — a geometric claim made
  // where geometry does not exist would be the vacuous green one layer down.
  const LANE_SELECTOR = '.peekover-diff-picker:not([hidden]) ~ .peekover-diff-status';

  // RETIRED (C030) at 013 task 4.5: "THE LANE EXISTS, and it is the CONTAINED sheet that carries it" — the app
  // page no longer builds the diff chrome in the reader (`pills: false`, D-5), so CONTAINED_CSS's lane rule went
  // with the pill overrides. The picker and status are the toolbar's now (the status in the notice area).
  // C027–C029 below are UNCHANGED (a census finding): `LANE_SELECTOR` matches by DOM order, which still holds.

  it('HALF-EMPTY (snapshots, no other files) — BOTH open, and the status is IN the lane', async () => {
    // The state 2.4 adds: the snapshots are listed, and the empty half is NAMED IN TEXT beside
    // them. `fetchFiles` is provisioned and returns [] — the surface HAS a folder list, the folder
    // simply holds no other markdown. This is the case the old invariant could not reach.
    registerDiffContext(recordingContext({ fetchFiles: async () => [] }).context);
    const box = build();
    pillOf(box).click();
    await flush();

    expect(pickerOf(box).hidden).toBe(false); // the list is OFFERED...
    expect(statusOf(box).hidden).toBe(false); // ...and the empty half is SPOKEN, at the same time
    expect(statusOf(box).textContent).toContain('No other markdown file in this folder');
    expect(statusOf(box).matches(LANE_SELECTOR)).toBe(true);
    // No fake, disabled or placeholder row stood in for the sentence, and no empty group either.
    expect(pickerOf(box).querySelectorAll('[role="option"]')).toHaveLength(2);
    expect(pickerOf(box).querySelectorAll('[role="group"]')).toHaveLength(0);
    expect(pickerOf(box).querySelectorAll('[disabled],[aria-disabled="true"]')).toHaveLength(0);
  });

  it('HALF-EMPTY (files, no snapshots) — BOTH open, and the status is IN the lane', async () => {
    registerDiffContext(
      recordingContext({ fetchMeta: async () => [], fetchFiles: async () => FILES }).context,
    );
    const box = build();
    pillOf(box).click();
    await flush();

    expect(pickerOf(box).hidden).toBe(false);
    expect(statusOf(box).hidden).toBe(false);
    expect(statusOf(box).textContent).toContain('No snapshots yet');
    expect(statusOf(box).matches(LANE_SELECTOR)).toBe(true);
    expect(pickerOf(box).querySelectorAll('[role="option"]')).toHaveLength(2);
    expect(pickerOf(box).querySelectorAll('[disabled],[aria-disabled="true"]')).toHaveLength(0);
  });

  it('BOTH-EMPTY and the non-half-empty paths stay MUTUALLY EXCLUSIVE, in the original slot', async () => {
    // The other half of the re-scope. The lane is picker-open-only, so every path that closes the
    // picker before speaking keeps the slot it has always had — asserted as `matches(LANE) === false`
    // so a lane that leaked onto these paths reds here rather than moving the box in production.
    const bothEmpty = recordingContext({ fetchMeta: async () => [], fetchFiles: async () => [] });
    registerDiffContext(bothEmpty.context);
    const box = build();
    pillOf(box).click();
    await flush();
    expect(pickerOf(box).hidden).toBe(true); // closePicker() first — today's shipped branch
    expect(statusOf(box).hidden).toBe(false);
    expect(statusOf(box).matches(LANE_SELECTOR)).toBe(false);

    // ...and the FAILURE paths, which are the other way the status opens: the picker is closed by
    // `compareWith` before the fallback speaks. Driven with `fetchFiles` present, so this case is
    // not the 006-shaped fake either.
    registerDiffContext(
      recordingContext({ fetchText: async () => undefined, fetchFiles: async () => FILES }).context,
    );
    const box2 = build();
    const bothVisible = () => !pickerOf(box2).hidden && !statusOf(box2).hidden;
    expect(bothVisible()).toBe(false);
    pillOf(box2).click();
    await flush();
    expect(pickerOf(box2).hidden).toBe(false); // both kinds → the picker really did open
    pickerOf(box2).querySelector<HTMLButtonElement>('[data-target-kind="snapshot"]')!.click();
    await flush();
    expect(statusOf(box2).textContent).toContain('Comparison unavailable');
    expect(bothVisible()).toBe(false);
    expect(statusOf(box2).matches(LANE_SELECTOR)).toBe(false);
  });

  it('★ the half-empty SENTENCE does not outlive the list it describes', async () => {
    // A consequence 2.4 creates and 2.4 therefore closes. "No other markdown file in this folder"
    // is a statement ABOUT the open picker; picking a row closes the picker, so the sentence has to
    // go with it — otherwise it sits in the ORIGINAL slot beside a closed list until the awaited
    // fetch resolves, describing something that is no longer on screen. Unreachable before 2.4 (the
    // status was always empty while the picker was open), which is why it needs its own pin.
    const rec = recordingContext({ fetchFiles: async () => [] });
    registerDiffContext(rec.context);
    const box = build();
    pillOf(box).click();
    await flush();
    expect(statusOf(box).textContent).toContain('No other markdown file in this folder');

    // SYNCHRONOUSLY after the pick — before `fetchText`'s await resolves. That instant is the whole
    // point: red-first by dropping `say(null)` from `compareWith`, at which point the stale
    // sentence is still standing here.
    pickerOf(box).querySelector<HTMLButtonElement>('[role="option"]')!.click();
    expect(pickerOf(box).hidden).toBe(true);
    expect(statusOf(box).hidden).toBe(true);
    expect(statusOf(box).textContent).toBe('');

    await flush();
    expect(rec.shown).toHaveLength(1); // ...and the comparison still went through, unchanged
  });

  it('the 006-SHAPED surface never speaks the file empty state — the gate is the CAPABILITY', async () => {
    // `listsFiles` reads `typeof context.fetchFiles === 'function'`, not `files.length`. A surface
    // that was never provisioned to look at a folder is not in the "no other markdown file in this
    // folder" state, and telling it that it is would name a state the user is not in. RED-FIRST by
    // gating on `files.length === 0` alone, at which point this reds with the sentence in it.
    registerDiffContext(recordingContext().context); // no fetchFiles member at all
    const box = build();
    pillOf(box).click();
    await flush();
    expect(pickerOf(box).hidden).toBe(false);
    expect(statusOf(box).hidden).toBe(true); // silent, and therefore out of the a11y tree
    expect(statusOf(box).textContent).toBe('');
  });
});

describe('buildDiffChrome — the seam: no context reference is captured', () => {
  it('the click asks the registry AGAIN — a context swapped after build is the one used', async () => {
    // watchControl.ts's proven-red property, one registry over: swap this lookup for a reference
    // captured at build time and the control drives a dead context after the first re-render.
    registerDiffContext(recordingContext().context);
    const box = build();
    const later = recordingContext({ fetchMeta: async () => [ENTRIES[0]] });
    registerDiffContext(later.context);

    pillOf(box).click();
    await flush();
    const items = pickerOf(box).querySelectorAll('[role="option"]');
    expect(items).toHaveLength(1); // the LATER context's index, not the one present at build
    expect((items[0] as HTMLElement).dataset.snapshotId).toBe('older');

    (items[0] as HTMLButtonElement).click();
    await flush();
    expect(later.shown).toHaveLength(1);
  });

  it('a context unregistered after build makes the gesture inert, not a crash', async () => {
    registerDiffContext(recordingContext().context);
    const box = build();
    resetDiffRegistryForTest();
    const spy = vi.fn();
    window.addEventListener('error', spy);
    pillOf(box).click();
    await flush();
    expect(pickerOf(box).hidden).toBe(true);
    expect(spy).not.toHaveBeenCalled();
    window.removeEventListener('error', spy);
  });
});

// RETIRED (C031) at 013 task 4.5: "the remote-load lane — declares left:176px BEFORE the anchored left" (the M13
// task 1.4 addendum's fallback for engines without anchor positioning) — on the app page the load bar leaves the
// reader for the notice area below the toolbar (ruling D), so CONTAINED_CSS's lane beside the (gone) Compare pill
// was deleted; the file:// reader keeps its own bar where it was.

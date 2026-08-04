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
  const bothKinds = { fetchFiles: async () => FILES };

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

  it('a file row is NOT wired to the snapshot gesture — the branch is 2.5’s', async () => {
    // The boundary of this task, pinned so it cannot be crossed by accident: a file row carries its
    // discriminant and no handler. Routing it through today's snapshot-only compareWith would
    // answer a file pick with "that snapshot is no longer stored" — this reds if it ever does.
    resetDiffRegistryForTest();
    const rec = recordingContext(bothKinds);
    registerDiffContext(rec.context);
    const box = build();
    pillOf(box).click();
    await flush();
    pickerOf(box).querySelector<HTMLButtonElement>('[data-target-kind="file"]')!.click();
    await flush();
    expect(rec.shown).toEqual([]);
    expect(statusOf(box).hidden).toBe(true); // and NOTHING was said, wrongly or otherwise
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

  it('the picker and the status line are mutually exclusive on every path', async () => {
    // The CSS parks both in the same measured slot (readerCss.ts), which is only safe because
    // the code guarantees this. Pinned so a future path cannot quietly overlap them.
    const rec = recordingContext({ fetchText: async () => undefined });
    registerDiffContext(rec.context);
    const box = build();
    const bothVisible = () => !pickerOf(box).hidden && !statusOf(box).hidden;

    expect(bothVisible()).toBe(false);
    pillOf(box).click();
    await flush();
    expect(bothVisible()).toBe(false);
    pickerOf(box).querySelector<HTMLButtonElement>('[role="option"]')!.click();
    await flush();
    expect(bothVisible()).toBe(false);
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

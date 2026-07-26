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
  type DiffOutcome,
} from './diffRegistry';
import type { SnapshotMetaEntry } from '../app/snapshots';

const ENTRIES: SnapshotMetaEntry[] = [
  { id: 'older', ts: 1_700_000_000_000, bytes: 512 },
  { id: 'newer', ts: 1_700_000_600_000, bytes: 2048 },
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

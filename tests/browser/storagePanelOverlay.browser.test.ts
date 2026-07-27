// The REAL-ENGINE overlay proof: opening the "Stored data" panel must not MOVE the page
// under it. Spec 002/006 · M6 9.1 gate finding (recovery Session A, defect 1).
//
// This is the assertion jsdom STRUCTURALLY cannot make: it needs layout. The storage slot
// used to be a shell child styled `flex:0 0 auto; max-height:45%`, i.e. a full-width band
// between the header and the body. Opening the panel filled that band, which pushed the
// folder-file navigator DOWNWARD and shrank the reader — two stacked left columns and a
// large empty region for as long as the panel was open. Every existing storage test passes
// against that layout, because they all assert the panel's CONTENT (it renders, it lists
// records, its buttons erase) and never its POSITION. Only a real engine computing geometry
// can see that opening a transparency surface reflowed the document the user was reading.
//
// The fix anchors the slot to the header as an absolute overlay (`top:100%`), so the panel
// drops down next to the button that opened it and the layout beneath is untouched. These
// tests pin that: the navigator's and reader's rects are IDENTICAL across the toggle.
//
// No OPFS / no native picker needed: the grant flow is driven through the injectable
// `openFolder` seam with an in-memory folder source, and the panel renders its designed
// "Nothing stored" state from a minimal fake store. So this runs (never skips) on BOTH
// Chromium and Firefox — the point being that the overlay holds in both, given the known
// cross-engine quirks with positioned descendants.

import { describe, it, expect, afterEach } from 'vitest';
import { mountAppShell, type AppStore } from '../../src/app/appShell';
import type { FolderSource } from '../../src/app/folderSource';

/** A store that captures nothing and reads nothing — an absent `describeStored` yields the
 *  shell's designed empty summary, so the panel still renders its never-blank state. */
function fakeStore(): AppStore {
  return {
    putFolder: async () => undefined,
    deleteFolder: async () => undefined,
    putRecent: async () => undefined,
  };
}

/** An in-memory folder source — structurally the real `FolderSource` the Chromium walk
 *  produces, minus the disk, so the granted folder view (the thing that must not move) is
 *  really painted. Several files so the navigator has genuine height. */
function memorySource(): FolderSource {
  return {
    name: 'docs',
    truncated: false,
    persistable: false,
    files: ['alpha.md', 'beta.md', 'gamma.md', 'delta.md'].map((name) => ({
      path: name,
      name,
      read: async () => `# ${name}\n\nBody of ${name}.`,
    })),
  };
}

/** Poll until `fn()` is truthy — the panel's summary load is fire-and-forget async. */
async function waitFor<T>(fn: () => T | null | undefined, tries = 100): Promise<T> {
  for (let i = 0; i < tries; i += 1) {
    const v = fn();
    if (v) return v;
    await new Promise<void>((r) => setTimeout(r, 20));
  }
  throw new Error('waitFor timed out');
}

const containers: HTMLElement[] = [];
afterEach(() => {
  for (const c of containers.splice(0)) c.remove();
});

/** Mount the shell and grant the in-memory folder, so the folder-file navigator is painted
 *  with real content before the panel is ever opened. */
async function mountGranted(): Promise<{
  container: HTMLElement;
  header: HTMLElement;
  folders: HTMLElement;
  reader: HTMLElement;
  toggle: HTMLButtonElement;
  slot: HTMLElement;
}> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  containers.push(container);

  const app = mountAppShell(container, {
    openFolder: async () => ({ ok: true, source: memorySource() }),
    store: fakeStore(),
  });
  await app.openFolder();

  // The navigator really painted a file list — the geometry asserted below is the geometry
  // of a populated pane, not an empty one.
  await waitFor(() => container.querySelector('[role="treeitem"][data-kind="file"]'));

  return {
    container,
    header: container.querySelector<HTMLElement>('.peekover-app__header')!,
    folders: container.querySelector<HTMLElement>('.peekover-app__folders')!,
    reader: container.querySelector<HTMLElement>('.peekover-app__reader')!,
    toggle: container.querySelector<HTMLButtonElement>('.peekover-app__storage-toggle')!,
    slot: container.querySelector<HTMLElement>('.peekover-app__storage-slot')!,
  };
}

/** Open the panel and wait until the storage view has actually rendered into the slot. */
async function openPanel(container: HTMLElement, toggle: HTMLButtonElement): Promise<HTMLElement> {
  toggle.click();
  return waitFor(() => container.querySelector<HTMLElement>('.peekover-storage'));
}

/** The geometry that must survive the toggle, rounded to whole pixels so sub-pixel layout
 *  noise between engines cannot produce a false failure. */
function box(el: HTMLElement): { top: number; left: number; width: number; height: number } {
  const r = el.getBoundingClientRect();
  return {
    top: Math.round(r.top),
    left: Math.round(r.left),
    width: Math.round(r.width),
    height: Math.round(r.height),
  };
}

describe('the storage panel opens as an OVERLAY — the page under it does not move', () => {
  it('opening the storage panel does NOT move or resize the folder-file navigator', async () => {
    const { container, folders, toggle } = await mountGranted();
    const before = box(folders);

    const panel = await openPanel(container, toggle);

    // NON-VACUITY: the panel has real height. This is exactly the condition under which the
    // old `flex:0 0 auto; max-height:45%` slot would have pushed the navigator down — a
    // zero-height panel would move nothing and the assertion below would pass for free.
    expect(box(panel).height).toBeGreaterThan(0);

    expect(box(folders)).toEqual(before);
  });

  it('opening the storage panel does NOT move or resize the reader pane', async () => {
    const { container, reader, toggle } = await mountGranted();
    const before = box(reader);

    const panel = await openPanel(container, toggle);
    expect(box(panel).height).toBeGreaterThan(0);

    expect(box(reader)).toEqual(before);
  });

  it('the open panel is taken OUT of flow (position is absolute, not static)', async () => {
    const { container, toggle, slot } = await mountGranted();
    await openPanel(container, toggle);

    // `static` is the value that put the slot in the layout in the first place; anything
    // out-of-flow (absolute/fixed) satisfies the fix.
    expect(['absolute', 'fixed']).toContain(getComputedStyle(slot).position);
  });

  it('the open panel is anchored under the header, not floating elsewhere', async () => {
    const { container, header, toggle, slot } = await mountGranted();
    await openPanel(container, toggle);

    const headerBox = header.getBoundingClientRect();
    const slotBox = slot.getBoundingClientRect();
    const EPS = 1; // sub-pixel tolerance

    // It drops FROM the header's bottom edge...
    expect(Math.abs(slotBox.top - headerBox.bottom)).toBeLessThanOrEqual(EPS);
    // ...and hangs at the right, where the button that opened it lives.
    expect(slotBox.right).toBeLessThanOrEqual(headerBox.right + EPS);
    expect(slotBox.right).toBeGreaterThan(headerBox.left + headerBox.width / 2);
  });

  it('closing the panel returns the slot to zero footprint', async () => {
    const { container, folders, toggle, slot } = await mountGranted();
    const before = box(folders);

    await openPanel(container, toggle);
    toggle.click(); // close
    await waitFor(() => (container.querySelector('.peekover-storage') ? null : true));

    // The emptied slot paints nothing — no stray bordered sliver left under the header —
    // and the navigator is still exactly where it started.
    expect(box(slot).height).toBe(0);
    expect(box(folders)).toEqual(before);
  });
});

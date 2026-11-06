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

import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { mountAppShell, type AppStore } from '../../src/app/appShell';
import type { FolderSource } from '../../src/app/folderSource';
import { setThemeSetting } from '../../src/theme/reader';
import { TEXT_BAR, backdropOf, inkOf, nameOf, ratioOver } from './helpers/contrast';

// RULING C (the 4.0 census, 2026-11-02; 013 task 4.4): this file is not about the compact toolbar, so
// its window is WIDE — above the 863 px breakpoint, where the app controls sit in the toolbar
// instead of behind "⋯". KEEPS: each test's own property (C269, C270, C271, C272, C273, C274); RE-SPELLED at 4.4 by the
// window alone. The harness default (414 × 896) is restored after each test — the window is shared
// by every file that runs after this one.
beforeEach(async () => {
  await page.viewport(1280, 900);
});
afterEach(async () => {
  await page.viewport(414, 896);
});

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

  // ── M13 task 1.4, second addendum — the header's HEIGHT must not change when the panel opens ──
  // 1.4 let the header wrap. On CI's font (DejaVu Sans) at 414px the CLOSED, empty slot still sat
  // in the flex row as a zero-width item — and took a .6rem gap — which pushed Export to a third
  // row (header bottom 132); opening the panel takes the slot out of flow, Export fits on row two
  // (bottom 93), and the navigator and reader jumped up 39px (CI run on PR #14). Whether that gap is
  // the one that tips a row depends on the font, so this case does not pick a font or a width: it
  // sweeps the header's width and requires the SAME header height with the panel closed and open at
  // every width. Somewhere in the sweep, with any font, the slack in a row is smaller than the gap.
  it("the header's height is the same with the panel closed and open, at every header width", async () => {
    const { container, header, toggle } = await mountGranted();
    const widths: number[] = [];
    for (let w = 280; w <= 1100; w += 2) widths.push(w);
    const heights = (): number[] =>
      widths.map((w) => {
        header.style.width = `${w}px`;
        return Math.round(header.getBoundingClientRect().height);
      });

    const closed = heights();
    await openPanel(container, toggle);
    const open = heights();
    header.style.width = '';

    // Non-vacuous: the sweep really crosses wrap boundaries (more than one header height seen).
    expect(new Set(closed).size, 'the sweep never made the header wrap').toBeGreaterThan(1);
    const moved = widths.filter((_, i) => closed[i] !== open[i]);
    expect(
      moved.map((w) => `${w}px: ${closed[widths.indexOf(w)]} -> ${open[widths.indexOf(w)]}`),
      'header widths at which opening the panel changed the header height',
    ).toEqual([]);
  });
});

// ── M13 task 5.4 — the header panels' look (tasks.md 5.4; mockup.html:194, the .panelbox card; the approved 3.1
// toolbar mock's .picker for the popover). Stored data and Export are the mock's card — radius 14, one --shadow,
// --paper, a 1 px --line border — with a header row and the 5.3 button look; Export's rows are the mock's list rows
// (--muted, --ink on --accent-soft under the pointer) with their hint under the title. The code-theme picker is the
// toolbar mock's popover (radius 12). Every text >= 4.5:1 as painted, at rest, under a real pointer and focused.
// The look is asserted FIRST (the instrument); contrast after it.
describe('013 task 5.4 — the header panels: card, header row, buttons, rows (light and dark)', () => {
  /** A store with something in it, so the erase / wipe buttons are live and a confirm can be armed. */
  function fullStore(): AppStore {
    return {
      ...fakeStore(),
      describeStored: async () => ({
        folders: [{ id: 'f1', name: 'docs', persisted: false, addedAt: 0, lastOpenedAt: 0 }],
        recents: [],
        pins: [],
        settings: null,
        snapshots: { count: 2, docs: 1, bytes: 2048 },
        captureFlag: null,
        diagrams: { count: 1, bytes: 512 },
        guideShown: false,
        total: 4,
        lines: ['1 folder remembered (name only).', '2 snapshots of 1 document (2.0 KB).'],
      }),
    } as AppStore;
  }

  async function shellWithFile(theme: 'light' | 'dark'): Promise<HTMLElement> {
    const container = document.createElement('div');
    document.body.appendChild(container);
    containers.push(container);
    const app = mountAppShell(container, { openFolder: async () => ({ ok: true, source: memorySource() }), store: fullStore() });
    await app.openFolder();
    (await waitFor(() => container.querySelector<HTMLButtonElement>('[role="treeitem"][data-kind="file"]'))).click();
    await waitFor(() => container.querySelector<HTMLElement>('.peekover-app__reader__host')?.shadowRoot?.querySelector('.peekover-reader h1'));
    // The shell's settings load applies "auto" once it resolves (this store has no settings): set the theme after it.
    await new Promise((r) => setTimeout(r, 50));
    setThemeSetting(theme);
    await waitFor(() => container.querySelector('.peekover-app')?.getAttribute('data-theme') === theme || null);
    await new Promise((r) => setTimeout(r, 250));
    return container;
  }

  /** A token's computed value in the shell, read from a probe that uses it. */
  function token(container: HTMLElement, prop: 'color' | 'box-shadow', value: string): string {
    const probe = document.createElement('i');
    probe.style.setProperty(prop, value);
    container.querySelector('.peekover-app')!.append(probe);
    const out = getComputedStyle(probe).getPropertyValue(prop);
    probe.remove();
    return out;
  }
  const ratio = (el: Element): number => ratioOver(inkOf(el), backdropOf(el)).ratio;
  const looks: string[] = [];

  /** The card: the given radius, the --shadow token, --paper, 1 px --line, and a scrollbar of its own. */
  function expectCard(c: HTMLElement, el: HTMLElement, name: string, radius: string): void {
    const cs = getComputedStyle(el);
    expect(`${cs.borderTopLeftRadius} ${cs.boxShadow}`, `${name}: radius and shadow`).toBe(`${radius} ${token(c, 'box-shadow', 'var(--shadow)')}`);
    expect(`${cs.backgroundColor} ${cs.borderTopWidth} ${cs.borderTopStyle} ${cs.borderTopColor}`, `${name}: the card`).toBe(
      `${token(c, 'color', 'var(--paper)')} 1px solid ${token(c, 'color', 'var(--line)')}`,
    );
    expect(cs.getPropertyValue('scrollbar-color').trim(), `${name}: its scrollbar`).not.toBe('auto');
  }

  /** 5.3's button look (the mock's copy button), read on the app page: --paper, 1 px --line, radius 7, 600 11.5 px. */
  async function expectButton(c: HTMLElement, b: HTMLButtonElement, name: string, primary = false): Promise<void> {
    b.blur(); // at rest: a focused control takes the ring's 4 px radius (mockup.html:30, the shell's :focus-visible)
    const cs = getComputedStyle(b);
    const [fill, ink] = primary ? ['--ink', '--paper'] : ['--paper', '--muted'];
    expect(
      `${cs.backgroundColor} ${cs.color} ${cs.borderTopWidth} ${cs.borderTopStyle} ${cs.borderTopColor} ${cs.borderTopLeftRadius} ${cs.fontWeight} ${cs.fontSize}`,
      `${name}: ${primary ? 'the ink primary' : 'the 5.3 button look'}`,
    ).toBe(
      `${token(c, 'color', `var(${fill})`)} ${token(c, 'color', `var(${ink})`)} 1px solid ${token(c, 'color', primary ? 'var(--ink)' : 'var(--line)')} 7px 600 11.5px`,
    );
    const rest = ratio(b);
    await userEvent.hover(b);
    await new Promise((r) => setTimeout(r, 60));
    expect(getComputedStyle(b).color, `${name}: under the pointer`).toBe(token(c, 'color', primary ? 'var(--paper)' : 'var(--ink)'));
    const hover = ratio(b);
    await userEvent.unhover(b);
    b.focus();
    const focus = ratio(b);
    looks.push(`${name}: rest ${rest.toFixed(2)} · hover ${hover.toFixed(2)} · focus ${focus.toFixed(2)}`);
    for (const [state, r] of [['rest', rest], ['hover', hover], ['focus', focus]] as const) {
      expect(r, `${name} (${state}): ${r.toFixed(2)}:1`).toBeGreaterThanOrEqual(TEXT_BAR);
    }
  }

  /** Every text-bearing element under `root` draws at >= 4.5:1. */
  function expectText(root: HTMLElement, name: string): void {
    const low: string[] = [];
    let least = Infinity;
    for (const el of [root, ...root.querySelectorAll('*')]) {
      const own = [...el.childNodes].some((n) => n.nodeType === Node.TEXT_NODE && n.textContent!.trim());
      if (!own || el.closest(':disabled') || !el.getClientRects().length) continue;
      const r = ratio(el);
      least = Math.min(least, r);
      if (r < TEXT_BAR) low.push(`${nameOf(el)} "${el.textContent!.trim().slice(0, 30)}" ${r.toFixed(2)}`);
    }
    looks.push(`${name}: lowest text ${least.toFixed(2)}`);
    expect(low, `${name}: text below 4.5:1`).toEqual([]);
  }

  afterEach(() => {
    setThemeSetting('auto');
    for (const l of looks.splice(0)) console.log(`LOOK-5.4 ${l}`);
  });

  for (const theme of ['light', 'dark'] as const) {
    it(`Stored data — ${theme}`, async () => {
      const c = await shellWithFile(theme);
      c.querySelector<HTMLButtonElement>('.peekover-app__storage-toggle')!.click();
      const panel = await waitFor(() => c.querySelector<HTMLElement>('.peekover-storage'));
      expectCard(c, c.querySelector<HTMLElement>('.peekover-app__storage-slot')!, 'Stored data', '14px');
      const head = panel.querySelector<HTMLElement>('.peekover-storage__head')!;
      const title = panel.querySelector<HTMLElement>('.peekover-storage__title')!;
      const hs = getComputedStyle(head);
      expect(`${hs.borderBottomWidth} ${hs.borderBottomStyle} ${hs.borderBottomColor}`, 'the header row').toBe(`1px solid ${token(c, 'color', 'var(--line)')}`);
      expect(`${getComputedStyle(title).fontWeight} ${getComputedStyle(title).fontSize}`, 'the header title').toBe('700 13.5px');
      // The capture checkbox: the mock's task box (mockup.html:135-137), its border --muted (3:1 as a control), --ink when on.
      const box = panel.querySelector<HTMLInputElement>('[data-capture-toggle]')!;
      const on = getComputedStyle(box);
      expect(`${on.appearance} ${on.backgroundColor} ${on.borderTopColor} ${on.borderTopWidth}`, 'the capture box, on').toBe(`none ${token(c, 'color', 'var(--ink)')} ${token(c, 'color', 'var(--ink)')} 2px`);
      box.checked = false; // the look only: no change event, so nothing is persisted
      const off = getComputedStyle(box);
      expect(`${off.backgroundColor} ${off.borderTopColor}`, 'the capture box, off').toBe(`${token(c, 'color', 'var(--paper)')} ${token(c, 'color', 'var(--muted)')}`);
      box.checked = true;
      await expectButton(c, panel.querySelector<HTMLButtonElement>('.peekover-storage__close')!, 'Stored data · Close');
      await expectButton(c, panel.querySelector<HTMLButtonElement>('[data-erase-snapshots="start"]')!, 'Stored data · Erase snapshots');
      panel.querySelector<HTMLButtonElement>('[data-wipe="start"]')!.click();
      await expectButton(c, await waitFor(() => panel.querySelector<HTMLButtonElement>('[data-wipe="confirm"]')), 'Stored data · Yes, wipe everything', true);
      await expectButton(c, panel.querySelector<HTMLButtonElement>('[data-wipe="cancel"]')!, 'Stored data · Cancel');
      expectText(panel, `Stored data (${theme})`);
    });

    it(`Export — ${theme}`, async () => {
      const c = await shellWithFile(theme);
      c.querySelector<HTMLButtonElement>('.peekover-app__export-toggle')!.click();
      const panel = await waitFor(() => c.querySelector<HTMLElement>('.peekover-export'));
      expectCard(c, c.querySelector<HTMLElement>('.peekover-app__export-slot')!, 'Export', '14px');
      const title = panel.querySelector<HTMLElement>('.peekover-export__title')!;
      expect(`${getComputedStyle(title).fontWeight} ${getComputedStyle(title).fontSize}`, 'the header title').toBe('700 13.5px');
      await expectButton(c, panel.querySelector<HTMLButtonElement>('.peekover-export__close')!, 'Export · Close');
      const row = panel.querySelector<HTMLButtonElement>('[data-export="copy-plain-text"]')!;
      const head = row.querySelector<HTMLElement>('.peekover-export__row-title')!;
      const sub = row.querySelector<HTMLElement>('.peekover-export__row-sub')!;
      const rest = getComputedStyle(row);
      expect(`${rest.backgroundColor} ${rest.borderTopStyle} ${rest.color} ${rest.borderTopLeftRadius}`, 'a row at rest: the mock list row').toBe(`rgba(0, 0, 0, 0) none ${token(c, 'color', 'var(--muted)')} 8px`);
      const restTitle = ratio(head);
      const restSub = ratio(sub);
      await userEvent.hover(row);
      await new Promise((r) => setTimeout(r, 60));
      expect(`${getComputedStyle(row).backgroundColor} ${getComputedStyle(row).color}`, 'a row under the pointer').toBe(`${token(c, 'color', 'var(--accent-soft)')} ${token(c, 'color', 'var(--ink)')}`);
      const hoverTitle = ratio(head);
      const hoverSub = ratio(sub);
      await userEvent.unhover(row);
      looks.push(`Export row title: rest ${restTitle.toFixed(2)} · hover ${hoverTitle.toFixed(2)}; hint: rest ${restSub.toFixed(2)} · hover ${hoverSub.toFixed(2)}`);
      for (const r of [restTitle, restSub, hoverTitle, hoverSub]) expect(r).toBeGreaterThanOrEqual(TEXT_BAR);
      expectText(panel, `Export (${theme})`);
    });

    it(`the code-theme picker — ${theme}`, async () => {
      const c = await shellWithFile(theme);
      c.querySelector<HTMLButtonElement>('.peekover-code-theme-toggle')!.click();
      const picker = await waitFor(() => c.querySelector<HTMLElement>('.peekover-code-theme-picker:not([hidden])'));
      expectCard(c, picker, 'code-theme picker', '12px');
      const item = picker.querySelector<HTMLButtonElement>('.peekover-code-theme-picker__item[aria-selected="false"]')!;
      const cs = getComputedStyle(item);
      expect(`${cs.color} ${cs.fontSize} ${cs.borderTopLeftRadius}`, 'an option: the toolbar mock picker row').toBe(`${token(c, 'color', 'var(--ink)')} 13px 7px`);
      const chosen = picker.querySelector<HTMLElement>('[aria-selected="true"]')!;
      expect(`${getComputedStyle(chosen).backgroundColor} ${getComputedStyle(chosen).fontWeight}`, 'the chosen option').toBe(`${token(c, 'color', 'var(--accent-soft)')} 600`);
      await userEvent.hover(item);
      await new Promise((r) => setTimeout(r, 60));
      const hover = ratio(item);
      await userEvent.unhover(item);
      looks.push(`code-theme option under the pointer ${hover.toFixed(2)}`);
      expect(hover).toBeGreaterThanOrEqual(TEXT_BAR);
      expectText(picker, `code-theme picker (${theme})`);
    });
  }
});

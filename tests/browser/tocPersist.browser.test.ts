// TOC carry-over — the REAL-ENGINE proof (task 6.1). The 003 rail's open-state and width are
// promoted from per-view to a single remembered global preference (spec §4): applied on build,
// persisted on change.
//
// WHY THIS LIVES IN tests/browser AND NOT jsdom. Every mechanism 6.1 can break is jsdom-blind:
//   • the width-derived default is decided from `getBoundingClientRect()` — all-zero in jsdom;
//   • the stomp it must survive is a `requestAnimationFrame` scheduled by `applyInitialTocState`;
//   • the restored width is read back as a COMPUTED `--toc-w` custom property (jsdom does not
//     resolve custom properties, so `:host{--toc-w:250px}` is invisible there);
//   • the width is persisted from a POINTER DRAG, which needs real pointer geometry.
// A jsdom test could assert the `data-toc` attribute immediately after build and pass while the
// product was still wrong a frame later — which is precisely the D-F trap this suite exists to
// close. Only the pure clamp rule is unit-tested (src/render/tocView.test.ts).
//
// ── THE ASSERTION DISCIPLINE THAT MAKES THIS NON-VACUOUS (decision D-F) ──────────────────────
//
// `applyInitialTocState` runs `decide()` synchronously and, when nothing is stored, ALSO schedules
// an rAF that re-runs it against the real laid-out width and calls `setTocOpen`. So a restored
// value that is not protected from that frame is overwritten ONE FRAME AFTER BUILD. Every
// open-state assertion here therefore runs `afterFrames(3)` first — the restored state must still
// be there after the stomp would have landed, not merely at the instant of build.
//
// ── HARNESS LIMIT, STATED PLAINLY (the same one groups 2/4/5 recorded) ──────────────────────
//
// The Vitest browser-playwright project loads NO unpacked extension: there is no background
// service worker and `browser.runtime` has no receiving end, so the REAL save path
// (messagingPort -> runtime.sendMessage -> background -> IndexedDB) cannot run here. A fake sink
// is injected through the PRODUCTION seam (`registerSettingsSink`) and the persisted value is fed
// in through the PRODUCTION notification (`publishSettings`) — the exact two functions the
// entrypoints call. That proves tocView's half of the contract: that it consults the seam, applies
// what it finds, and writes back exactly once per user gesture. It does NOT prove the message
// reaches the background or that a real reopen remembers. End-to-end (collapse the rail, drag a
// width, RELOAD, see it remembered) is the named 8.1 human-gate item.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { page } from 'vitest/browser';
import { mount } from '../../src/render/mount';
import { TOC_MIN_WIDTH, TOC_MAX_WIDTH } from '../../src/render/tocView';
import { mountAppShell, type AppStore } from '../../src/app/appShell';
import type { FolderSource } from '../../src/app/folderSource';
import {
  currentSettings,
  publishSettings,
  registerSettingsSink,
  resetSettingsSeamForTest,
} from '../../src/settings/settingsSeam';
import { DEFAULT_SETTINGS, type Settings } from '../../src/settings/settings';

// ── Fixtures ────────────────────────────────────────────────────────────────────────────────

const FILLER = Array.from(
  { length: 12 },
  (_, i) => `Paragraph ${i + 1}: lorem ipsum dolor sit amet, consectetur adipiscing elit.`,
).join('\n\n');

/** A doc with enough headings to clear the >=2 threshold and build a real rail. */
function buildDoc(sections = 6): string {
  const parts: string[] = [];
  for (let i = 1; i <= sections; i += 1) parts.push(`## Section ${i}`, FILLER);
  return parts.join('\n\n');
}

/** Patches captured at the PRODUCTION sink — what would have gone to the port. */
let saved: Partial<Settings>[] = [];

beforeEach(() => {
  resetSettingsSeamForTest();
  saved = [];
  registerSettingsSink((patch) => saved.push(patch));
});

afterEach(() => {
  resetSettingsSeamForTest();
});

/** Seed the seam as if the entrypoint's `load()` had already resolved BEFORE the mount — the
 *  warm/re-render ordering, where the rail reads the stored state at build time. */
function seedStored(patch: Partial<Settings>): void {
  publishSettings({ ...DEFAULT_SETTINGS, ...patch });
}

/** Wait n animation frames. THE load-bearing helper: `applyInitialTocState`'s width-derived
 *  correction lands on the frame after build, so an assertion made before this has run cannot
 *  distinguish "persisted state won" from "persisted state is about to be overwritten". */
async function afterFrames(n = 3): Promise<void> {
  for (let i = 0; i < n; i += 1) {
    await new Promise<void>((r) => requestAnimationFrame(() => r()));
  }
  // One macrotask beyond the frames, so anything scheduled FROM a frame has also run.
  await new Promise<void>((r) => setTimeout(r, 0));
}

async function waitFor<T>(fn: () => T | null | undefined, tries = 100): Promise<T> {
  for (let i = 0; i < tries; i += 1) {
    const v = fn();
    if (v) return v;
    await new Promise<void>((r) => setTimeout(r, 20));
  }
  throw new Error('waitFor timed out');
}

/** The host's live `--toc-w` — the same property 003's drag test reads, and the only honest
 *  channel for "the stored width was applied" (a rendered rail width also folds in max-width:38vw). */
function tocWidthPx(host: HTMLElement): number {
  return parseFloat(getComputedStyle(host).getPropertyValue('--toc-w'));
}

function tocState(host: HTMLElement): string | null {
  return host.getAttribute('data-toc');
}

function openerOf(host: HTMLElement): HTMLButtonElement {
  return host.shadowRoot!.querySelector<HTMLButtonElement>('button.peekover-toc__toggle')!;
}

// ── Surface 1: the full-page content-script takeover ────────────────────────────────────────

const fullPageHosts: HTMLElement[] = [];
afterEach(() => {
  for (const h of fullPageHosts.splice(0)) h.remove();
});

function mountFullPage(doc: string = buildDoc()): HTMLElement {
  const host = document.createElement('peekover-root');
  document.body.appendChild(host);
  fullPageHosts.push(host);
  mount(doc, host);
  return host;
}

// ── Surface 2: the contained app-page reader pane (the recurring two-surface gotcha) ─────────

function fakeStore(): AppStore {
  return {
    putFolder: async () => undefined,
    deleteFolder: async () => undefined,
    putRecent: async () => undefined,
    // Stands in for the app page's real IndexedDB settings row: it answers with whatever this
    // test seeded, so the shell's own `load().then(publishSettings)` re-publishes that value
    // instead of clobbering it with defaults (see the note in mountContained).
    getSettings: async () => currentSettings(),
    putSettings: async () => undefined,
  };
}

function memorySource(name: string, text: string): FolderSource {
  return {
    name: 'docs',
    truncated: false,
    persistable: false,
    files: [{ path: name, name, read: async () => text }],
  };
}

const containers: HTMLElement[] = [];
afterEach(() => {
  for (const c of containers.splice(0)) c.remove();
});

async function mountContained(doc: string = buildDoc()): Promise<HTMLElement> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  containers.push(container);

  const app = mountAppShell(container, {
    openFolder: async () => ({ ok: true, source: memorySource('doc.md', doc) }),
    store: fakeStore(),
  });
  // mountAppShell runs its OWN production wiring — `registerSettingsSink(port.save)` and
  // `load().then(publishSettings)` — against the store above. Both must be neutralized or this
  // surface tests the shell's wiring instead of the rail's:
  //   • its sink registration REPLACES the test sink (last registration wins, by design), so it
  //     is re-registered below, AFTER the shell has had its turn;
  //   • its load() would publish whatever `getSettings` returns, overwriting anything seeded for
  //     this test — so the fake store's `getSettings` (see fakeStore) returns the seam's CURRENT
  //     value, making the shell's publish a faithful re-publish rather than a wipe.
  // This is a real interaction, not test scaffolding: on the app page the shell genuinely owns
  // the port, and the rail is a second consumer of the same seam.
  registerSettingsSink((patch) => saved.push(patch));
  await app.openFolder();
  container.querySelector<HTMLButtonElement>('[role="treeitem"][data-kind="file"]')!.click();
  const host = await waitFor(() =>
    container.querySelector<HTMLElement>('.peekover-app__reader__host'),
  );
  await waitFor(() => host.shadowRoot?.querySelector('button.peekover-toc__toggle'));
  return host;
}

/** The two surfaces behind one factory, so every property below is asserted on BOTH without
 *  duplicating the assertion — the recurring two-surface gotcha, closed structurally. */
const SURFACES: { name: string; mount: (doc?: string) => Promise<HTMLElement> }[] = [
  { name: 'full-page', mount: async (doc) => mountFullPage(doc) },
  { name: 'contained', mount: (doc) => mountContained(doc) },
];

/**
 * What 003's WIDTH-DERIVED rule decides on THIS surface at THIS harness viewport — measured by
 * mounting with nothing stored and reading production's own answer, not predicted from a
 * hardcoded expectation.
 *
 * THIS EXISTS BECAUSE THE FIRST VERSION OF THIS SUITE WAS PARTLY VACUOUS AND THE HARNESS SAID SO.
 * It assumed the viewport was WIDE (so the width rule would say "open") and asserted a stored
 * `tocOpen:false` survived. The harness viewport is in fact NARROW, so the width rule already
 * says "collapsed" — the stomp that test claimed to catch would have written the SAME value it
 * asserted, and the test would have passed with the D-F handling removed entirely. Deriving the
 * default instead of assuming it lets the D-F test seed the OPPOSITE of it, which is adversarial
 * on any viewport this harness ever runs at.
 */
async function widthDerivedDefault(
  mountSurface: (doc?: string) => Promise<HTMLElement>,
): Promise<boolean> {
  const probe = await mountSurface();
  await afterFrames();
  const open = tocState(probe) === 'open';
  probe.remove();
  resetSettingsSeamForTest();
  registerSettingsSink((patch) => saved.push(patch));
  saved.length = 0;
  return open;
}

// ── The suite ───────────────────────────────────────────────────────────────────────────────

describe.each(SURFACES)('TOC carry-over — $name surface (task 6.1)', ({ mount: mountSurface }) => {
  // M13 8.1i (a): at <= 863 px the opener toggles the narrow SHEET (unsaved) instead of the rail, so the rail's own
  // behaviour is exercised at a wide viewport; the harness default (414) is restored after each test.
  beforeEach(async () => {
    await page.viewport(1280, 900);
  });
  afterEach(async () => {
    await page.viewport(414, 896);
  });

  it('a persisted tocOpen OPPOSING the width rule SURVIVES the rAF (D-F, adversarial by construction)', async () => {
    // THE D-F TEST, and the reason this suite exists. The stored value is chosen to CONTRADICT
    // whatever the width rule decides on this viewport, so the rAF — which re-runs that rule one
    // frame after build and calls setTocOpen — would demonstrably overwrite it. Two assertions,
    // and only the second one is load-bearing: the first shows the value was applied at build,
    // the second that it is STILL there after the frame the stomp would have landed on. A test
    // asserting only the first would pass against the bug.
    const widthDefault = await widthDerivedDefault(mountSurface);
    const stored = !widthDefault;

    seedStored({ tocOpen: stored });
    const host = await mountSurface();
    const expected = stored ? 'open' : 'collapsed';
    expect(tocState(host)).toBe(expected); // applied at build
    await afterFrames();
    expect(tocState(host)).toBe(expected); // ...and still, after the stomp would have landed
    // Not the width rule's answer — the assertion that makes the two distinguishable at all.
    expect(tocState(host)).not.toBe(widthDefault ? 'open' : 'collapsed');
    // The a11y state moves in lockstep — restoring must not leave a half state.
    expect(openerOf(host).getAttribute('aria-expanded')).toBe(String(stored));
  });

  it('a persisted tocOpen AGREEING with the width rule is also honoured (the other direction)', async () => {
    // Not adversarial, and said so plainly: it pins that the restore path handles both values
    // rather than only ever writing one of them.
    const widthDefault = await widthDerivedDefault(mountSurface);
    seedStored({ tocOpen: widthDefault });
    const host = await mountSurface();
    await afterFrames();
    expect(tocState(host)).toBe(widthDefault ? 'open' : 'collapsed');
    expect(openerOf(host).getAttribute('aria-expanded')).toBe(String(widthDefault));
  });

  it('a persisted tocWidth is APPLIED to the live --toc-w', async () => {
    seedStored({ tocOpen: true, tocWidth: 320 });
    const host = await mountSurface();
    await afterFrames();
    expect(tocWidthPx(host)).toBe(320);
  });

  it('an OUT-OF-RANGE stored tocWidth CLAMPS rather than breaking the layout', async () => {
    // A corrupt row, or a build with different bounds. Restored raw, 5000px would swallow the
    // reading column (which reserves --toc-w) and 5px would render an unusable rail.
    seedStored({ tocOpen: true, tocWidth: 5000 });
    const wide = await mountSurface();
    await afterFrames();
    expect(tocWidthPx(wide)).toBe(TOC_MAX_WIDTH);

    resetSettingsSeamForTest();
    registerSettingsSink((patch) => saved.push(patch));
    seedStored({ tocOpen: true, tocWidth: 5 });
    const narrow = await mountSurface();
    await afterFrames();
    expect(tocWidthPx(narrow)).toBe(TOC_MIN_WIDTH);
  });

  it('NULL stored fields → 003 behaviour is UNCHANGED (the regression guard)', async () => {
    // Nothing published: the seam reads DEFAULT_SETTINGS (both TOC fields null), which is also
    // the real cold-start state before load() resolves. The width-derived default must run
    // exactly as it did in 003, and the CSS default width must be left alone — an inline
    // override written for an unset value would pin the rail against any future default change.
    const widthDefault = await widthDerivedDefault(mountSurface);
    const host = await mountSurface();
    await afterFrames();
    // Whatever 003's rule decides at this viewport — asserted against the measured rule, not a
    // hardcoded guess about the harness window.
    expect(tocState(host)).toBe(widthDefault ? 'open' : 'collapsed');
    expect(tocWidthPx(host)).toBe(250); // the readerCss :host default, untouched
    expect(host.style.getPropertyValue('--toc-w')).toBe(''); // no inline pin
    expect(saved).toEqual([]); // restoring/defaulting never writes back (D-G)
  });

  it('clicking the opener PERSISTS {tocOpen} — and restoring never does (D-G)', async () => {
    seedStored({ tocOpen: true });
    const host = await mountSurface();
    await afterFrames();
    // The restore path above is silent: applying what is already stored must not re-save it.
    expect(saved).toEqual([]);

    openerOf(host).click();
    expect(tocState(host)).toBe('collapsed');
    expect(saved).toEqual([{ tocOpen: false }]);

    openerOf(host).click();
    expect(tocState(host)).toBe('open');
    expect(saved).toEqual([{ tocOpen: false }, { tocOpen: true }]);
  });

  it('the BACKTICK shortcut persists {tocOpen} too (both user paths, one writer)', async () => {
    seedStored({ tocOpen: true });
    const host = await mountSurface();
    await afterFrames();
    saved.length = 0;

    // Focus inside the host so the registry resolves THIS rail (see resolveActiveTocHost).
    openerOf(host).focus();
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: '`', bubbles: true, cancelable: true }),
    );

    expect(tocState(host)).toBe('collapsed');
    expect(saved).toEqual([{ tocOpen: false }]);
  });

  it('a settings LOAD arriving AFTER the rail is built still restores it (cold-start ordering)', async () => {
    // The NORMAL cold-start path (group 4's measurement): the rail is built against nulls, takes
    // the 003 width-derived default, and the persisted state lands a turn later.
    const widthDefault = await widthDerivedDefault(mountSurface);
    const host = await mountSurface();
    await afterFrames();
    expect(tocState(host)).toBe(widthDefault ? 'open' : 'collapsed'); // width default, nothing stored yet

    // ...load() resolves, carrying the OPPOSITE of the width default — so the restore is visible.
    const late = !widthDefault;
    seedStored({ tocOpen: late, tocWidth: 300 });
    await afterFrames();
    expect(tocState(host)).toBe(late ? 'open' : 'collapsed');
    expect(openerOf(host).getAttribute('aria-expanded')).toBe(String(late));
    expect(tocWidthPx(host)).toBe(300);
    expect(saved).toEqual([]); // a late restore is still a restore — silent (D-G)
  });
});

// ── The drag: persisted ONCE, on end, never per move (decision D-H) ──────────────────────────
//
// Full-page only, and deliberately so: `pointermove` rewrites `--toc-w` on every sample, and the
// property under test is the SAVE CALL COUNT, which is surface-independent (it is one shared
// `end` handler in buildResizer, reached identically on both surfaces — the two-surface risk here
// is styling/positioning, already covered by 003's drag tests on both).

function firePointer(resizer: Element, type: string, clientX: number): void {
  resizer.dispatchEvent(
    new PointerEvent(type, {
      pointerId: 1,
      pointerType: 'mouse',
      clientX,
      clientY: 300,
      bubbles: true,
      cancelable: true,
    }),
  );
}

const ANCHOR_X = 600;

describe('TOC carry-over — the resize drag persists on END only (task 6.1, D-H)', () => {
  it('a drag with MANY moves saves {tocWidth} exactly ONCE', async () => {
    seedStored({ tocOpen: true });
    const host = mountFullPage();
    await afterFrames();
    saved.length = 0;

    const resizer = host.shadowRoot!.querySelector('.peekover-toc__resizer')!;
    firePointer(resizer, 'pointerdown', ANCHOR_X);
    // 40 moves — a short drag by real-pointer standards. Saving per move would fire 40 writes
    // (and, on the content-script surface, 40 runtime messages to the background) for one gesture.
    for (let i = 1; i <= 40; i += 1) firePointer(resizer, 'pointermove', ANCHOR_X - i);
    expect(saved).toEqual([]); // RED HERE if the save moved into pointermove
    firePointer(resizer, 'pointerup', ANCHOR_X - 40);

    expect(saved.length).toBe(1);
    expect(saved[0]).toEqual({ tocWidth: 290 }); // 250 default + 40px dragged outward
  });

  it('the saved width is CLAMPED — dragging past a bound stores the bound, not the raw value', async () => {
    seedStored({ tocOpen: true });
    const host = mountFullPage();
    await afterFrames();
    saved.length = 0;

    const resizer = host.shadowRoot!.querySelector('.peekover-toc__resizer')!;
    firePointer(resizer, 'pointerdown', ANCHOR_X);
    firePointer(resizer, 'pointermove', ANCHOR_X - 1000); // far past the max
    firePointer(resizer, 'pointerup', ANCHOR_X - 1000);

    expect(saved).toEqual([{ tocWidth: TOC_MAX_WIDTH }]);
  });

  it('a stray pointerup with no drag in progress saves NOTHING', async () => {
    // pointerup and pointercancel share the `end` handler; its `if (!dragging) return` guard is
    // what keeps one gesture to one write. Without it, a release that never began a drag would
    // store a width the user never chose.
    seedStored({ tocOpen: true });
    const host = mountFullPage();
    await afterFrames();
    saved.length = 0;

    const resizer = host.shadowRoot!.querySelector('.peekover-toc__resizer')!;
    firePointer(resizer, 'pointerup', ANCHOR_X);
    firePointer(resizer, 'pointercancel', ANCHOR_X);
    expect(saved).toEqual([]);
  });

  it('a drag then a release then a SECOND release saves once, not twice', async () => {
    seedStored({ tocOpen: true });
    const host = mountFullPage();
    await afterFrames();
    saved.length = 0;

    const resizer = host.shadowRoot!.querySelector('.peekover-toc__resizer')!;
    firePointer(resizer, 'pointerdown', ANCHOR_X);
    firePointer(resizer, 'pointermove', ANCHOR_X - 30);
    firePointer(resizer, 'pointerup', ANCHOR_X - 30);
    firePointer(resizer, 'pointerup', ANCHOR_X - 30); // duplicate/late release
    firePointer(resizer, 'pointercancel', ANCHOR_X - 30);

    expect(saved.length).toBe(1);
  });
});

// ── The narrow-viewport clearance question carried from 5.1 ──────────────────────────────────
//
// 5.1's geometry suite asserted the theme pill's clearance against the reading column at the WIDE
// viewport only. This MEASURES the narrow case rather than reasoning about it, and records the
// numbers so the 8.1 gate item is grounded in a fact. It asserts the Peekover pattern that the
// measurement establishes (the pill floats over content, like every other reader pill), so it
// will go red if a future change silently makes the pill displace the column instead.

describe('narrow-viewport pill/column relationship — the 5.1 carried question (measured)', () => {
  it('at a narrow viewport the reading column spans under the fixed pills (the established pattern)', async () => {
    seedStored({ tocOpen: false }); // narrow reading = rail collapsed, the realistic narrow state
    const host = mountFullPage();
    await afterFrames();

    const shadow = host.shadowRoot!;
    const column = shadow.querySelector('.peekover-reader')!.getBoundingClientRect();
    const theme = shadow.querySelector('.peekover-theme-toggle')!.getBoundingClientRect();
    const mode = shadow.querySelector('.peekover-mode-toggle')?.getBoundingClientRect();

    // The measurement, recorded in progress.md: at every viewport the reader's pills are
    // position:fixed chrome layered OVER the column, not siblings that reserve space from it.
    // The theme pill (bottom-left) and the mode toggle (top-right) sit on opposite corners, so
    // they overlap the column's horizontal span while occupying different vertical bands.
    expect(theme.left).toBeGreaterThanOrEqual(column.left - 1);
    expect(theme.right).toBeLessThanOrEqual(column.right + 1);
    if (mode) {
      // Same family, different corner — the pattern is consistent, not a one-off for theme.
      expect(mode.right).toBeLessThanOrEqual(column.right + 1);
      // The two pills never collide with each other, which IS an asserted property.
      expect(theme.top).toBeGreaterThan(mode.bottom);
    }
    // What a test CANNOT decide: whether the text under the pill is legible. That is 8.1.
  });
});

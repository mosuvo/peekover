// Re-render continuity through the mount() seam — REAL-ENGINE (spec 005 tasks 3.3 + 3.4).
//
// ── WHY THIS SUITE IS SHAPED AROUND *TWO* RED-FIRST DIRECTIONS ─────────────────────────────
//
// 3.3 is the task where `mount()` stops being the read-only library four milestones have treated
// it as (`readerPane.ts:16`). `MountOptions.preserveReading` is additive and DEFAULTED-OFF, and
// the claim "every existing caller is unaffected" is one to PROVE, not assert. So this file
// asserts the flag in BOTH directions and treats them as equally load-bearing:
//
//   (a) WITH the flag  — a reader left in Raw, scrolled mid-document, re-mounts still in Raw at
//       the same place. This fails before the change (mode resets to reading, scroll goes to 0).
//   (b) WITHOUT the flag — the existing UNCONDITIONAL `setReaderMode(host, 'reading')` still
//       fires. This is not a formality: `readerPane.select()` DEPENDS on it. Switching from a
//       file you were reading in Raw to a different file must land in Reading, on the new
//       document. An implementation that preserved unconditionally — or made the reset
//       conditional on the wrong thing — passes (a) and breaks the app page silently, which is
//       precisely the failure mode a single-direction test would ship.
//
// Both directions were demonstrated RED against deliberate breaks before this file went green;
// the messages are recorded in specs/005-watch-diff/tasks.md.
//
// ── HARNESS NOTE, INHERITED FROM 3.2 AND LOAD-BEARING HERE TOO ─────────────────────────────
//
// "The box overflows" is NOT a safe precondition for a geometry assertion; "the box has stopped
// reflowing" is. Measured at 3.2: `scrollHeight` read 81798 px at first overflow and 26069 px
// once the reader had finished restyling. A scroll write in that window CLAMPS to the new
// maximum and silently parks the test at the document bottom. `waitForStable` below polls for a
// settled content height, not merely a scrollable one.

import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { page } from 'vitest/browser';
import { mount } from '../../src/render/mount';
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
  { length: 24 },
  (_, i) =>
    `Paragraph ${i + 1}: lorem ipsum dolor sit amet, consectetur adipiscing elit, ` +
    `sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`,
).join('\n\n');

const SECTIONS = 8;

function buildDoc(): string {
  const parts: string[] = [];
  for (let i = 1; i <= SECTIONS; i += 1) parts.push(`## Section ${i}`, FILLER);
  return parts.join('\n\n');
}

/** The agent's edit: one more section appended. Same headings, same order — so the anchor has a
 *  text match and the assertions are about continuity, not about the matching ladder (3.2 owns
 *  that). */
function buildEditedDoc(): string {
  return [buildDoc(), '## Section 9', FILLER].join('\n\n');
}

/** The agent's other edit, and the one that matters: a section INSERTED ABOVE everything, so
 *  every existing heading moves DOWN. Holding `scrollTop` steady is the wrong answer here — see
 *  the note on the Reading-mode test. */
function buildDocWithInsertionAbove(): string {
  return ['## Inserted Section', FILLER, buildDoc()].join('\n\n');
}

/** Patches captured at the PRODUCTION settings sink — what would have gone to the port. */
let saved: Partial<Settings>[] = [];

beforeEach(() => {
  resetSettingsSeamForTest();
  saved = [];
  registerSettingsSink((patch) => saved.push(patch));
});

afterEach(() => {
  resetSettingsSeamForTest();
});

function seedStored(patch: Partial<Settings>): void {
  publishSettings({ ...DEFAULT_SETTINGS, ...patch });
}

async function waitFor<T>(fn: () => T | null | undefined, tries = 150): Promise<T> {
  for (let i = 0; i < tries; i += 1) {
    const v = fn();
    if (v) return v;
    await new Promise<void>((r) => setTimeout(r, 20));
  }
  throw new Error('waitFor timed out');
}

/** Wait until the scroll box overflows AND its content height has STOPPED CHANGING (see the
 *  harness note in the file header — overflow alone returns mid-restyle). */
async function waitForStable(scroller: HTMLElement): Promise<void> {
  let prev = Number.NaN;
  let stable = 0;
  for (let i = 0; i < 200; i += 1) {
    const h = scroller.scrollHeight;
    if (h > scroller.clientHeight + 4 && h === prev) {
      stable += 1;
      if (stable >= 3) return;
    } else {
      stable = 0;
    }
    prev = h;
    await new Promise<void>((r) => setTimeout(r, 20));
  }
  throw new Error('scroll box never settled (content did not overflow, or kept reflowing)');
}

/** Poll `scrollTop` until it stops changing (the full-page :host scrolls smoothly). */
async function settle(scroller: HTMLElement): Promise<number> {
  let prev = Number.NaN;
  let stable = 0;
  for (let i = 0; i < 150; i += 1) {
    const cur = scroller.scrollTop;
    if (cur === prev) {
      stable += 1;
      if (stable >= 3) return cur;
    } else {
      stable = 0;
    }
    prev = cur;
    await new Promise<void>((r) => setTimeout(r, 20));
  }
  return scroller.scrollTop;
}

/** Wait n animation frames, then a macrotask — long enough for `applyInitialTocState`'s
 *  width-derived rAF correction to have landed (or to have stood down). */
async function afterFrames(n = 3): Promise<void> {
  for (let i = 0; i < n; i += 1) {
    await new Promise<void>((r) => requestAnimationFrame(() => r()));
  }
  await new Promise<void>((r) => setTimeout(r, 0));
}

/** Vertical offset of an element's top relative to the scroll box's top — "where on screen". */
function topOffset(el: Element, scroller: HTMLElement): number {
  return el.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
}

/** Find a heading by its exact text in the live reader. */
function headingByText(host: HTMLElement, text: string): Element {
  return [...host.shadowRoot!.querySelectorAll('.peekover-reader h2')].find(
    (h) => (h.textContent ?? '').trim() === text,
  )!;
}

function modeOf(host: HTMLElement): string | null {
  return host.getAttribute('data-mode');
}

function tocState(host: HTMLElement): string | null {
  return host.getAttribute('data-toc');
}

function tocWidthPx(host: HTMLElement): number {
  return parseFloat(getComputedStyle(host).getPropertyValue('--toc-w'));
}

function openerOf(host: HTMLElement): HTMLButtonElement {
  return host.shadowRoot!.querySelector<HTMLButtonElement>('button.peekover-toc__toggle')!;
}

/** The control a reader in Reading is switched to Raw with. KEEPS: each test's own Raw-and-place property (C347,
 *  C349, C350). RE-SPELLED at 013 task 4.5: on the app page it is the toolbar's Raw (the reader mounts with
 *  `pills: false`); the full-page surface keeps its mode pill. Every caller goes Reading → Raw. */
function modeToggleOf(host: HTMLElement): HTMLButtonElement {
  const app = host.closest('.peekover-app');
  if (app) return app.querySelector<HTMLButtonElement>('.peekover-toolbar__seg [data-mode="raw"]')!;
  return host.shadowRoot!.querySelector<HTMLButtonElement>('.peekover-mode-toggle')!;
}

// ── The two surfaces, one parameterised suite ───────────────────────────────────────────────

interface Surface {
  host: HTMLElement;
  scroller: HTMLElement;
  /** Re-render into the same host — the exact seam watch mode drives. */
  remount(text: string, preserveReading?: boolean): void;
}

const fullPageHosts: HTMLElement[] = [];
afterEach(() => {
  for (const h of fullPageHosts.splice(0)) h.remove();
});

function mountFullPage(doc: string = buildDoc()): Surface {
  const host = document.createElement('peekover-root');
  document.body.appendChild(host);
  fullPageHosts.push(host);
  mount(doc, host);
  return {
    host,
    scroller: host,
    remount: (text, preserveReading) => mount(text, host, { preserveReading }),
  };
}

function fakeStore(): AppStore {
  return {
    putFolder: async () => undefined,
    deleteFolder: async () => undefined,
    putRecent: async () => undefined,
    // Stands in for the app page's real IndexedDB settings row: answers with whatever this test
    // seeded, so the shell's own `load().then(publishSettings)` re-publishes rather than wipes.
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

async function mountContained(doc: string = buildDoc()): Promise<Surface> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  containers.push(container);

  const app = mountAppShell(container, {
    openFolder: async () => ({ ok: true, source: memorySource('doc.md', doc) }),
    store: fakeStore(),
  });
  // mountAppShell runs its own production wiring and its sink registration REPLACES the test
  // sink (last registration wins, by design), so re-register after the shell has had its turn.
  registerSettingsSink((patch) => saved.push(patch));
  await app.openFolder();
  container.querySelector<HTMLButtonElement>('[role="treeitem"][data-kind="file"]')!.click();

  const host = await waitFor(() =>
    container.querySelector<HTMLElement>('.peekover-app__reader__host'),
  );
  await waitFor(() => host.shadowRoot?.querySelector('.peekover-reader h2'));
  const pane = container.querySelector<HTMLElement>('.peekover-app__reader')!;
  return {
    host,
    scroller: pane,
    remount: (text, preserveReading) => mount(text, host, { contained: true, preserveReading }),
  };
}

const SURFACES: { name: string; mount: (doc?: string) => Promise<Surface> }[] = [
  { name: 'full-page', mount: async (doc) => mountFullPage(doc) },
  { name: 'contained', mount: (doc) => mountContained(doc) },
];

// ── Task 3.3 — direction (a): WITH the flag, mode and place survive ─────────────────────────

describe.each(SURFACES)(
  'preserveReading — $name surface (task 3.3, direction (a): WITH the flag)',
  ({ mount: mountSurface }) => {
    it('a reader left in RAW, scrolled mid-document, re-mounts still in Raw at the same place', async () => {
      const s = await mountSurface();
      await waitForStable(s.scroller);

      // Leave the reader in Raw, through the real control the user would click.
      modeToggleOf(s.host).click();
      expect(modeOf(s.host)).toBe('raw');
      await waitForStable(s.scroller);

      // ...and scrolled mid-document, genuinely away from the top.
      // 5.0 (F2, CI-only, cause not found): every scroll event is logged, so a red names whether a reading was taken
      // while the (smooth, on the full-page surface) scroll was still moving — the candidate `settle`'s 60 ms window.
      const t0 = performance.now();
      const scrolls: number[] = [];
      const onScroll = (): void => void scrolls.push(Math.round(performance.now() - t0));
      s.scroller.addEventListener('scroll', onScroll);
      const box = (): string => `${s.scroller.scrollHeight}/${s.scroller.clientHeight}`;
      const target = Math.round((s.scroller.scrollHeight - s.scroller.clientHeight) / 2);
      s.scroller.scrollTop = target;
      const readingAt = await settle(s.scroller);
      const readAtMs = Math.round(performance.now() - t0);
      const boxBefore = box();
      expect(readingAt).toBeGreaterThan(200);

      // The agent edits the file underneath the reader.
      s.remount(buildEditedDoc(), true);
      await waitForStable(s.scroller);
      const after = await settle(s.scroller);
      const afterMs = Math.round(performance.now() - t0);
      await new Promise((r) => setTimeout(r, 300)); // late scroll events, for the message only
      s.scroller.removeEventListener('scroll', onScroll);
      const state =
        `target ${target}, readingAt ${readingAt} (read at +${readAtMs} ms), after ${after} (read at +${afterMs} ms), ` +
        `now ${s.scroller.scrollTop}; scrollHeight/clientHeight ${boxBefore} -> ${box()}; viewport ${innerWidth}x${innerHeight}; ` +
        `mode ${modeOf(s.host)}; scroll events after the first reading: [${scrolls.filter((t) => t > readAtMs).join(', ')}], ` +
        `after the second: [${scrolls.filter((t) => t > afterMs).join(', ')}] (ms since the scroll)`;

      // MODE survives — the reader is not yanked back to Reading mid-edit.
      expect(modeOf(s.host)).toBe('raw');
      // PLACE survives. In Raw there are no visible headings to anchor to, so this is the
      // anchor's own scrollTop rung — asserted against the measured position, and the `> 200`
      // above is what makes "still there" distinguishable from "reset to 0".
      expect(Math.abs(after - readingAt), `the Raw place moved — ${state}`).toBeLessThan(40);
      // THEME survives the path (it rides on the host, not on the replaced children).
      expect(s.host.getAttribute('data-theme')).toBeTruthy();
    });

    it('a reader in READING mode keeps its PLACE when content is inserted ABOVE it', async () => {
      // THE FIXTURE HERE IS INSERTED-ABOVE, NOT APPENDED, AND THAT IS THE WHOLE POINT.
      // An earlier draft of this test appended a section and asserted `scrollTop` was unchanged
      // — and it PASSED against a mount() with no continuity code at all. The engine simply does
      // not reset `scrollTop` when `replaceChildren` leaves the box still tall enough, so the
      // assertion was satisfied by the browser rather than by anything this milestone built.
      // That is the vacuous-persistence-test class (retro 2026-07-19, finding 1) caught in the
      // act, by running the red-first pass and noticing the test did NOT go red.
      //
      // Insertion above is the case nothing else can fake: every heading MOVES, so holding
      // `scrollTop` steady is now the WRONG answer, and only an anchor restore lands the reader
      // back on the words they were reading.
      const s = await mountSurface();
      await waitForStable(s.scroller);
      expect(modeOf(s.host)).toBe('reading');

      const target = 'Section 5';
      const before = headingByText(s.host, target);
      s.scroller.scrollTop =
        s.scroller.scrollTop + topOffset(before, s.scroller) + 40;
      const readingAt = await settle(s.scroller);
      const offsetBefore = topOffset(before, s.scroller);
      expect(readingAt).toBeGreaterThan(200);

      s.remount(buildDocWithInsertionAbove(), true);
      await waitForStable(s.scroller);
      await settle(s.scroller);

      expect(modeOf(s.host)).toBe('reading');
      // The SAME heading is back at the SAME offset — the reader's place, not their pixels.
      const offsetAfter = topOffset(headingByText(s.host, target), s.scroller);
      expect(Math.abs(offsetAfter - offsetBefore)).toBeLessThan(12);
      // NON-VACUOUS: the scroll position itself demonstrably MOVED to achieve that, so a mount()
      // that merely let the engine hold `scrollTop` steady cannot satisfy this.
      expect(Math.abs(s.scroller.scrollTop - readingAt)).toBeGreaterThan(100);
      expect(s.host.getAttribute('data-theme')).toBeTruthy();
    });
  },
);

// ── Task 3.3 — direction (b): WITHOUT the flag, the unconditional reset STILL fires ─────────

describe.each(SURFACES)(
  'preserveReading — $name surface (task 3.3, direction (b): WITHOUT the flag)',
  ({ mount: mountSurface }) => {
    it('the existing UNCONDITIONAL reset to Reading still happens — readerPane depends on it', async () => {
      const s = await mountSurface();
      await waitForStable(s.scroller);

      modeToggleOf(s.host).click();
      expect(modeOf(s.host)).toBe('raw'); // the precondition is real, not assumed
      await waitForStable(s.scroller);
      s.scroller.scrollTop = Math.round((s.scroller.scrollHeight - s.scroller.clientHeight) / 2);
      expect(await settle(s.scroller)).toBeGreaterThan(200);

      // A routine re-mount with NO options — exactly what `readerPane.select()` issues.
      s.remount(buildEditedDoc());
      await waitForStable(s.scroller);

      // THE ASSERTION THAT PROTECTS THE APP PAGE: a new document lands in Reading, whatever the
      // previous one was left in. An implementation that preserved unconditionally fails here.
      expect(modeOf(s.host)).toBe('reading');
      expect(s.host.getAttribute('data-theme')).toBeTruthy();
    });

    it('readerPane.select() itself lands a NEW file in Reading after the old one was left in Raw', async () => {
      // The bug direction (b) exists to prevent, exercised through the REAL app-page controller
      // rather than a hand-rolled mount() call — readerPane is read-only in this task, so this is
      // an observation of production, not a modification of it.
      const container = document.createElement('div');
      document.body.appendChild(container);
      containers.push(container);

      const source: FolderSource = {
        name: 'docs',
        truncated: false,
        persistable: false,
        files: [
          { path: 'a.md', name: 'a.md', read: async () => buildDoc() },
          { path: 'b.md', name: 'b.md', read: async () => buildEditedDoc() },
        ],
      };
      const app = mountAppShell(container, {
        openFolder: async () => ({ ok: true, source }),
        store: fakeStore(),
      });
      registerSettingsSink((patch) => saved.push(patch));
      await app.openFolder();

      const files = [
        ...container.querySelectorAll<HTMLButtonElement>('[role="treeitem"][data-kind="file"]'),
      ];
      expect(files.length).toBe(2);

      files[0].click();
      const host = await waitFor(() =>
        container.querySelector<HTMLElement>('.peekover-app__reader__host'),
      );
      await waitFor(() => host.shadowRoot?.querySelector('.peekover-reader h2'));

      // Leave file A in Raw.
      modeToggleOf(host).click();
      expect(modeOf(host)).toBe('raw');

      // Select file B — a DIFFERENT document. It must render in Reading.
      files[1].click();
      await waitFor(() => (modeOf(host) === 'reading' ? true : null));
      expect(modeOf(host)).toBe('reading');
    });
  },
);

// ── Task 3.4 — the TOC re-decide interaction, VERIFIED rather than assumed ──────────────────
//
// `applyInitialTocState` re-derives `data-toc` from the laid-out width on EVERY mount
// (tocView.ts) and could therefore re-open a rail the user just collapsed — on every agent
// keystroke. 004's persistence is BELIEVED to cover this (`setTocOpenByUser` persists on click;
// `saveSettings` updates the snapshot immediately), and believed-covered is not tested.
//
// NON-VACUITY — this is EXACTLY the shape that produced 6.1's vacuous test, so the control is
// built the same way 004 rebuilt it: first mount a probe with NOTHING stored and read
// production's OWN width-derived answer at this harness viewport, then drive the rail to the
// OPPOSITE of that and assert `not.toBe(thatFallback)`. Seeding what the fallback would have
// chosen anyway passes while proving nothing — the harness viewport is narrow, so a test that
// assumed "wide, therefore open" would assert the same value the stomp would have written.

/** What production's width-derived rule decides on THIS surface at THIS viewport, measured by
 *  mounting a probe with nothing stored — never predicted from a hardcoded expectation. */
async function widthDerivedDefault(
  mountSurface: (doc?: string) => Promise<Surface>,
): Promise<boolean> {
  const probe = await mountSurface();
  await afterFrames();
  const open = tocState(probe.host) === 'open';
  probe.host.remove();
  resetSettingsSeamForTest();
  registerSettingsSink((patch) => saved.push(patch));
  saved.length = 0;
  return open;
}

describe.each(SURFACES)(
  'TOC re-decide across a preserveReading re-mount — $name surface (task 3.4)',
  ({ mount: mountSurface }) => {
    // M13 8.1i (a): at <= 863 px the opener toggles the narrow SHEET (unsaved) instead of the rail, so the rail's
    // persisted state is driven at a wide viewport; the harness default (414) is restored after each test.
    beforeEach(async () => {
      await page.viewport(1280, 900);
    });
    afterEach(async () => {
      await page.viewport(414, 896);
    });
    it('a rail the user COLLAPSED stays collapsed across the re-mount, and the stored width survives', async () => {
      const widthDefault = await widthDerivedDefault(mountSurface);

      const s = await mountSurface();
      await afterFrames();

      // Drive the rail to the OPPOSITE of what the width rule would choose, through the REAL
      // user path (the opener click is what `setTocOpenByUser` persists from). If the width rule
      // already says "collapsed" at this viewport, the adversarial state is "open" — the test
      // follows the measurement rather than assuming a direction.
      const target = !widthDefault;
      if ((tocState(s.host) === 'open') !== target) openerOf(s.host).click();
      expect(tocState(s.host)).toBe(target ? 'open' : 'collapsed');
      expect(saved).toContainEqual({ tocOpen: target }); // the click really persisted

      // A width the user chose, stored the same way a drag would leave it.
      seedStored({ tocOpen: target, tocWidth: 320 });
      await afterFrames();
      expect(tocWidthPx(s.host)).toBe(320);

      // The agent edits the file — a watch re-render, the thing that happens on every keystroke.
      s.remount(buildEditedDoc(), true);
      await afterFrames(); // ...and past the frame applyInitialTocState's rAF would land on

      // STILL the user's choice, not the width rule's.
      expect(tocState(s.host)).toBe(target ? 'open' : 'collapsed');
      // THE NON-VACUITY ASSERTION: demonstrably NOT what the width rule would have re-decided.
      expect(tocState(s.host)).not.toBe(widthDefault ? 'open' : 'collapsed');
      // The a11y state moved in lockstep — no half state left behind by the re-mount.
      expect(openerOf(s.host).getAttribute('aria-expanded')).toBe(String(target));
      // And the stored width survived the rebuild of the rail.
      expect(tocWidthPx(s.host)).toBe(320);
    });

    it('the re-mount itself PERSISTS NOTHING — a re-render is not a user gesture (D-G)', async () => {
      // The other half of the property, and the one a "still collapsed" assertion alone would
      // miss: if the re-mount wrote back the state it just restored, an agent typing would issue
      // a settings save per keystroke (and, on the content-script surface, a runtime message per
      // keystroke) for a choice the user never made.
      seedStored({ tocOpen: true, tocWidth: 300 });
      const s = await mountSurface();
      await afterFrames();
      saved.length = 0;

      s.remount(buildEditedDoc(), true);
      await afterFrames();

      expect(saved).toEqual([]);
    });
  },
);

// agentBadge — the REAL-ENGINE proofs that the identity seam is LIVE (008 task 1.4, D-1 · D-2),
// Chromium AND Firefox, `describe.each` over BOTH surfaces (§3.11 row 23).
//
// ══ WHY THIS SUITE EXISTS AT ALL, AND WHY IT IS NOT `agentBadge.test.ts` ══════════════════════
//
// 1.3 unit-tested the PAIRING — registry name in, pill or `[]` out — by registering a name by
// hand. That suite would pass, unchanged, against a build in which NOTHING IN PRODUCTION EVER
// CALLS `registerDocIdentity`, which is exactly what shipped at 1.3: `getDocIdentity()` returned
// `undefined` at every production render and the badge was reachable but never built. A test that
// hand-registers its own fixture cannot tell a wired seam from an unwired one — the M5
// "built, tested, wired to nothing" defect, stated as a property of the test rather than of the
// code. So NOTHING HERE REGISTERS A NAME BY HAND. Both surfaces are driven the way production
// drives them (`runReader` over a raw page; `mountAppShell` + the real click chain), and the name
// reaches the screen through the production registration sites or not at all.
//
// ══ THE ROWS THIS DISCHARGES (plan §3.11, routed to 1.4 by tasks.md) ══════════════════════════
//
//   row 1  renders on BOTH surfaces through the one `mount()` seam
//   row 2  an unrecognized name grows NO badge AND NO note
//   row 3  red-first that the gate is the RIGHT property — the NAME, not the surface
//   row 4  a SIBLING of `.peekover-reader`, never inside it
//   row 14 still correct after a re-render — the badge reads the CURRENT registry
//   row 15 state in TEXT, not colour and not an icon
//   row 23 `describe.each` over both surfaces
//
// ★ PLACEMENT IS NOT ASSERTED HERE. Rows 5, 7, 8, 10, 11 are task 1.5's rect probe, and gate-2 Q3
// ruled the badge's lane "produce, do not choose" — the CSS this runs against is PROVISIONAL by
// instruction (`readerCss.ts`, `top:56px;left:16px`). Nothing below reads a rect, so nothing below
// can quietly ratify a lane the human has not chosen at 6.1.
//
// ══ WHY THE CONTENT SCRIPT DRIVES `history.replaceState` ══════════════════════════════════════
//
// That surface's name is parsed from `location.href` — a content script holds a URL and never a
// `MarkdownFile`. Faking the URL would mean stubbing `basenameOf` or `location`, and either one
// removes the production parse from the path under test, leaving a suite that proves the seam
// works when handed a name it was handed. `replaceState` moves the REAL `location.href` instead,
// so `runReader` reads a real URL through the real `basenameOf`. The window is a few synchronous
// microseconds — `registerDocIdentity` and (at `readyState:'complete'`) the whole mount run inside
// it, with no `await` for other code to observe — and the original href is restored in a `finally`.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { page } from 'vitest/browser';
import { runReader, removeHideStyle } from '../../src/render/runReader';
import { mountAppShell, type AppStore } from '../../src/app/appShell';
import type { FolderSource, MarkdownFile } from '../../src/app/folderSource';
import { installContentWatch } from '../../src/watch/contentWatch';
import { AGENT_BADGE_CLASS } from '../../src/render/agentBadge';
import { AGENT_FILE_NAMES } from '../../src/render/agentFile';
import { getDocIdentity, resetDocIdentityForTest } from '../../src/render/docIdentity';
import { resetWatchRegistryForTest, isWatching } from '../../src/watch/watchRegistry';
import { resetWatchControlsForTest } from '../../src/watch/watchControl';
import { resetThemeHostsForTest } from '../../src/theme/themeRegistry';
import { resetThemeControlsForTest } from '../../src/theme/themeControl';
import {
  DIFF_AFFORDANCE_CLASS,
  DIFF_PICKER_CLASS,
  DIFF_STATUS_CLASS,
} from '../../src/render/diffChrome';
import {
  createDiffContext,
  registerDiffContext,
  isDiffContextRegistered,
  resetDiffRegistryForTest,
} from '../../src/render/diffRegistry';
import { WATCH_READ, type WatchMessage } from '../../src/watch/watchRelay';

// ── Fixtures ──────────────────────────────────────────────────────────────────────────────────

const AGENT_NAME = 'CLAUDE.md';
const OTHER_AGENT_NAME = 'AGENTS.md';
const PLAIN_NAME = 'intro.md';

const DOC = '# Heading\n\nSome body text that makes the reader non-empty.\n';
const DOC_V2 = '# Heading\n\nthe agent rewrote this on disk.\n';

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

async function waitFor<T>(fn: () => T | null | undefined | false, tries = 300): Promise<T> {
  for (let i = 0; i < tries; i += 1) {
    const v = fn();
    if (v) return v as T;
    await sleep(20);
  }
  throw new Error('waitFor timed out');
}

// ── Surface harnesses ─────────────────────────────────────────────────────────────────────────

const hosts: HTMLElement[] = [];
const containers: HTMLElement[] = [];

/** Run `fn` with the REAL `location.href` pointing at `basename`, restored unconditionally. */
function withDocUrl<T>(basename: string, fn: () => T): T {
  const original = location.href;
  history.replaceState(null, '', `/${basename}`);
  try {
    return fn();
  } finally {
    history.replaceState(null, '', original);
  }
}

/**
 * THE CONTENT-SCRIPT SURFACE, driven through the real entrypoint orchestration: a raw `<pre>` page
 * (what a browser renders for a `.md` file), then `runReader`, which gates, REGISTERS THE NAME, and
 * mounts. `isRenderable` is overridden because the runner's own page is not a markdown document —
 * that seam exists for exactly this and is the one the entrypoint fills with `isRenderableContext`.
 * Everything downstream of it, including the name parse, is production code.
 */
function openContentScript(basename: string, doc = DOC): HTMLElement {
  const pre = document.createElement('pre');
  pre.textContent = doc;
  document.body.appendChild(pre);
  withDocUrl(basename, () => runReader({ isRenderable: () => true }));
  const host = document.querySelector<HTMLElement>('peekover-root')!;
  hosts.push(host);
  return host;
}

function fakeStore(): AppStore {
  return {
    putFolder: async () => undefined,
    deleteFolder: async () => undefined,
    putRecent: async () => undefined,
  };
}

function mdFile(name: string, read: () => Promise<string>): MarkdownFile {
  return { path: name, name, read };
}

function sourceOf(files: MarkdownFile[]): FolderSource {
  return { name: 'notes', files, truncated: false, persistable: true };
}

/**
 * THE APP-PAGE SURFACE, driven through the real user gesture chain — open the folder, click the
 * file — so the only registration observed is the one `installWatchForFile` performs before
 * `selectFile` mounts. Returns the shell so a test can switch documents on it (row 14).
 */
async function openAppShell(
  files: MarkdownFile[],
): Promise<{ container: HTMLElement; host: () => HTMLElement }> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  containers.push(container);
  const app = mountAppShell(container, {
    openFolder: async () => ({ ok: true, source: sourceOf(files) }),
    store: fakeStore(),
  });
  await app.openFolder();
  return {
    container,
    host: () => container.querySelector<HTMLElement>('.peekover-app__reader__host')!,
  };
}

async function clickFile(container: HTMLElement, name: string): Promise<HTMLElement> {
  const btn = [...container.querySelectorAll<HTMLButtonElement>('[role="treeitem"][data-kind="file"]')].find(
    (b) => b.textContent === name,
  )!;
  btn.click();
  const host = await waitFor(() => container.querySelector<HTMLElement>('.peekover-app__reader__host'));
  await waitFor(() => host.shadowRoot?.querySelector('.peekover-reader h1'));
  return host;
}

/** The app page as ONE call, for the cases that only open a single document. */
async function openAppPage(basename: string, doc = DOC): Promise<HTMLElement> {
  const { container } = await openAppShell([mdFile(basename, async () => doc)]);
  return clickFile(container, basename);
}

// ── Readers ───────────────────────────────────────────────────────────────────────────────────

const shadowOf = (host: HTMLElement) => host.shadowRoot!;
const badgesIn = (host: HTMLElement) => [
  ...shadowOf(host).querySelectorAll<HTMLElement>(`.${AGENT_BADGE_CLASS}`),
];
const badgeIn = (host: HTMLElement) => badgesIn(host)[0] ?? null;
const readerIn = (host: HTMLElement) => shadowOf(host).querySelector<HTMLElement>('.peekover-reader')!;

// ── Rect readers (task 1.5) ───────────────────────────────────────────────────────────────────
//
// Copied in SHAPE from `diffChrome.browser.test.ts:207-215`, which is 6.2's worked elimination and
// the precedent D-12 names. Deliberately NOT imported from there: that file is a test module with
// its own `vi.mock` factories and its own lifecycle, and importing it would run them.

function intersects(a: DOMRect, b: DOMRect): boolean {
  return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
}

/** Page coordinates, rounded — the form every prior placement record in this repo is written in. */
const fmt = (r: DOMRect): string =>
  `[${Math.round(r.left)},${Math.round(r.top)},${Math.round(r.right)},${Math.round(r.bottom)}]`;

/**
 * ★ THE FIRING CONTROL FOR EVERY RECT IN THIS FILE. `getBoundingClientRect()` on a missing node is
 * a TypeError, but on a `display:none` or zero-size one it returns all zeros — and an all-zero rect
 * overlaps nothing, so a clearance assertion built on one passes while measuring NOTHING. Every
 * rect the probe reads goes through here, so a zero-overlap reading means "measured, no overlap"
 * and never "measured nothing".
 */
function realRect(el: Element | null, what: string): DOMRect {
  expect(el, `${what} is ABSENT — this probe would have measured nothing`).not.toBeNull();
  const r = (el as HTMLElement).getBoundingClientRect();
  expect(r.width, `${what} has zero width — a vacuous rect`).toBeGreaterThan(0);
  expect(r.height, `${what} has zero height — a vacuous rect`).toBeGreaterThan(0);
  return r;
}

/** The produce half of produce-do-not-choose: every number this probe reads is written to the run
 *  log, so task 6.1 rules on measurements rather than on a re-run. */
/** Which engine produced a reading. The two run in ONE interleaved stdout stream, so a line that
 *  does not name its engine cannot be attributed — and the label widths below differ between them
 *  by up to 4px, which is exactly the kind of number 6.1 must not read off the wrong engine. */
const ENGINE = navigator.userAgent.includes('Firefox') ? 'Fx' : 'Cr';

function record(line: string): void {
  console.log(`[1.5][${ENGINE}] ${line}`); // the measurement IS this task's deliverable (D-12)
}

/** Every piece of chrome BESIDE the reading column, as text — the surface a stray explanatory
 *  note would have to appear on (row 2's "and no note" half). */
function chromeText(host: HTMLElement): string {
  return [...shadowOf(host).children]
    .filter((el) => !el.classList.contains('peekover-reader') && el.tagName !== 'STYLE')
    .map((el) => el.textContent ?? '')
    .join(' ');
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────────────────────

function reset(): void {
  removeHideStyle(); // `body > :not(peekover-root){display:none}` would hide the next fixture
  resetDocIdentityForTest();
  resetWatchRegistryForTest();
  resetWatchControlsForTest();
  resetThemeHostsForTest();
  resetThemeControlsForTest();
  resetDiffRegistryForTest();
  for (const h of hosts.splice(0)) h.remove();
  for (const c of containers.splice(0)) c.remove();
  document.querySelectorAll('peekover-root').forEach((el) => el.remove());
  document.body.replaceChildren();
}

beforeEach(reset);
afterEach(reset);

// ══ HARNESS SANITY — THE CONTROL THAT FIRES WHEN THE SEAM IS UNWIRED ══════════════════════════
//
// Every other test in this file goes RED against a build whose registration sites are missing —
// that is the point of it, and it was demonstrated that way (all 30, both engines, each on
// `expected undefined to be '<name>'`, which is `getDocIdentity()` reading empty: 1.3's inert
// state exactly). An all-red run is only evidence if something in the SAME run stays green, or
// "the seam is unwired" and "the harness is broken" produce identical output. This is that
// control. It names neither the badge nor the registry, and it stays GREEN under the ablation —
// the `themeRuntime.browser.test.ts:157` harness-sanity precedent.

describe('harness sanity — both surfaces really mount and really grow chrome (non-vacuous guard)', () => {
  it('CONTENT SCRIPT: `runReader` puts a reader on screen, with chrome beside it', () => {
    const host = openContentScript(PLAIN_NAME);
    expect(readerIn(host).querySelector('h1')).not.toBeNull();
    expect(shadowOf(host).querySelector('.peekover-theme-toggle')).not.toBeNull();
  });

  it('APP PAGE: the click chain puts a reader on screen, with chrome beside it', async () => {
    const host = await openAppPage(PLAIN_NAME);
    expect(readerIn(host).querySelector('h1')).not.toBeNull();
    expect(shadowOf(host).querySelector('.peekover-theme-toggle')).not.toBeNull();
  });
});

// ══ ROWS 1, 2, 3, 4, 15, 23 — the badge, on BOTH surfaces ═════════════════════════════════════

const SURFACES = [
  ['content script', openContentScript as (n: string, d?: string) => Promise<HTMLElement> | HTMLElement],
  ['app page', openAppPage as (n: string, d?: string) => Promise<HTMLElement> | HTMLElement],
] as const;

describe.each(SURFACES)('the agent-file badge is LIVE on the %s surface (row 23)', (_label, open) => {
  it('row 1 — a recognized name reaches the screen through the PRODUCTION registration site', async () => {
    const host = await open(AGENT_NAME);

    // THE SEAM, end to end: nothing here registered anything. The name on screen was put in the
    // registry by production code, read back at build time by `buildAgentBadge`, and rendered.
    expect(getDocIdentity()).toBe(AGENT_NAME);
    expect(badgesIn(host)).toHaveLength(1); // exactly one, not one per render
    expect(badgeIn(host)!.textContent).toBe(`Agent file · ${AGENT_NAME}`);
  });

  it('row 2 — an unrecognized name grows NO badge and NO note', async () => {
    const host = await open(PLAIN_NAME);

    expect(getDocIdentity()).toBe(PLAIN_NAME); // registered — the PREDICATE is what declined it
    expect(badgeIn(host)).toBeNull();
    // D-14: no explanation either. The user was never offered anything, so there is nothing to be
    // told they are missing.
    expect(chromeText(host)).not.toMatch(/agent file/i);

    // NON-VACUOUS: the surface really rendered and really grew OTHER chrome, so the absence above
    // is the predicate declining a name, not a reader that failed to mount.
    expect(readerIn(host).querySelector('h1')).not.toBeNull();
    expect(shadowOf(host).querySelector('.peekover-theme-toggle')).not.toBeNull();
  });

  it('row 3 — RED-FIRST that the gate is the NAME, not an accident of the surface', async () => {
    // ONE variable changes between these two runs of the SAME production path on the SAME surface:
    // the document's name. If the badge's absence above were a property of the surface, of
    // `contained`, of whether a watch is running, or of chrome ordering, it would survive the
    // change. It does not.
    const plain = await open(PLAIN_NAME);
    expect(badgeIn(plain)).toBeNull();

    reset();

    const agent = await open(OTHER_AGENT_NAME);
    expect(badgeIn(agent)).not.toBeNull();
    expect(badgeIn(agent)!.textContent).toBe(`Agent file · ${OTHER_AGENT_NAME}`);
  });

  it('row 4 — a SIBLING of `.peekover-reader`, never inside it', async () => {
    const host = await open(AGENT_NAME);
    const badge = badgeIn(host)!;

    // The structural assertion the golden pin CANNOT make: `tests/golden/` snapshots
    // `sanitize(parse(source))`, upstream of chrome composition entirely, so its diff stays EMPTY
    // whether the badge is a sibling of the reading column or wrongly appended INTO it. This is
    // the only thing that fires on that mistake.
    // `parentNode`, not `parentElement`: the parent IS the shadow root, and a ShadowRoot is a
    // DocumentFragment rather than an Element — `parentElement` reads `null` for a correctly
    // placed badge, which would make this assertion pass for the wrong reason if inverted.
    expect(badge.parentNode).toBe(shadowOf(host));
    expect(readerIn(host).contains(badge)).toBe(false);
    expect(readerIn(host).querySelector(`.${AGENT_BADGE_CLASS}`)).toBeNull();
  });

  it('row 15 — the badge’s state is in TEXT: no role, no aria-*, no colour carrying meaning', async () => {
    const host = await open(AGENT_NAME);
    const badge = badgeIn(host)!;

    // The name — the half only this seam can supply — is readable as text, which is what makes the
    // badge legible to assistive technology with no `aria-*` at all (§5, §3.11 row 15).
    expect(badge.textContent).toContain(AGENT_NAME);
    expect(badge.tagName).toBe('P');
    expect(badge.getAttribute('role')).toBeNull();
    expect(badge.getAttribute('aria-label')).toBeNull();
    expect(badge.getAttribute('tabindex')).toBeNull();
    expect([...badge.attributes].map((a) => a.name).filter((n) => n.startsWith('aria-'))).toEqual([]);
  });
});

// ══ ROW 14 — THE RE-RENDER PROPERTY, which is the whole of D-1's justification ═════════════════
//
// This is the reason the seam is a REGISTRY and not `MountOptions`, and the reason a test that
// only checked the first mount would be worth nothing: `mount()`'s `replaceChildren` destroys all
// chrome on every render, so render N+1 must RE-DERIVE the badge from the registry. A version that
// captured the name — which is what threading it through `MountOptions` amounts to — passes every
// assertion above and fails only here. Its signature is named in each test.

describe('row 14 — the badge built by render N+1 reads the CURRENT registry', () => {
  it('APP PAGE, document switch: the previous document’s name is never stranded on the new one', async () => {
    // ★ THE DISCRIMINATING CASE (plan §3.11 row 14: "verified against a document switch, which is
    // the case that would strand a captured name"). Against a `buildAgentBadge` that captures the
    // first name it reads, step 1 is green, step 2 shows `Agent file · CLAUDE.md` ON intro.md —
    // the previous document's badge on the new one — and step 3 shows it again.
    const { container } = await openAppShell([
      mdFile(AGENT_NAME, async () => DOC),
      mdFile(PLAIN_NAME, async () => DOC),
      mdFile(OTHER_AGENT_NAME, async () => DOC),
    ]);

    const a = await clickFile(container, AGENT_NAME);
    expect(badgeIn(a)!.textContent).toBe(`Agent file · ${AGENT_NAME}`);

    // 2. Switch to a plain document: the badge must be GONE, and specifically must not be the
    //    previous document's.
    const b = await waitFor(async () => clickFile(container, PLAIN_NAME));
    expect(getDocIdentity()).toBe(PLAIN_NAME); // the REGISTRY is current...
    // ...so anything stale here is the BADGE, not the seam feeding it. Named before the plain
    // absence check so the red message says WHICH defect it is rather than merely "not null":
    // against a capture-once build this reads
    //   expected 'Agent file · CLAUDE.md' not to be 'Agent file · CLAUDE.md'
    // which is the previous document's badge on the new one — 007 D-12's bug class verbatim.
    expect(badgeIn(b)?.textContent ?? null).not.toBe(`Agent file · ${AGENT_NAME}`);
    expect(badgeIn(b)).toBeNull();
    expect(chromeText(b)).not.toMatch(/CLAUDE\.md/);

    // 3. Switch to a DIFFERENT agent file: the badge returns carrying the NEW name. A capture-once
    //    build that somehow survived step 2 would show `CLAUDE.md` here.
    const c = await clickFile(container, OTHER_AGENT_NAME);
    expect(badgeIn(c)!.textContent).toBe(`Agent file · ${OTHER_AGENT_NAME}`);
    expect(badgeIn(c)!.textContent).not.toContain(AGENT_NAME);
  });

  it('CONTENT SCRIPT, watch re-render: the badge survives the render an agent’s edit causes', async () => {
    // ★ D-1's DECISIVE ARGUMENT, run as a test. `contentWatch.ts` builds its controller with NO
    // `render` and therefore re-renders through BARE `mount()` — so a name carried in
    // `MountOptions` would be DROPPED here, and dropped the first time an agent edits the file,
    // which is precisely the moment the badge is meant to be on screen. The registry survives it
    // because the badge asks at build time and nothing captured anything.
    let text = DOC;
    let reads = 0;
    const send = async (m: WatchMessage): Promise<unknown> => {
      expect(m.type).toBe(WATCH_READ);
      reads += 1;
      return { ok: true, text };
    };
    // The content script's own order: the watch installs at document_start, before any host.
    installContentWatch({
      url: `file:///tmp/${AGENT_NAME}`,
      send,
      backgroundCanReadFileUrls: true,
      intervalMs: 30,
    });

    const host = openContentScript(AGENT_NAME);
    const first = badgeIn(host)!;
    expect(first.textContent).toBe(`Agent file · ${AGENT_NAME}`);

    // The user gesture, then the edit. `pollingDetector`'s first read is a SILENT baseline (it
    // schedules at `intervalMs` and takes `lastText === null` as "nothing to compare against"), so
    // the write must land AFTER that read or it is absorbed and nothing ever re-renders. Waiting
    // on the read COUNT rather than on a sleep is what keeps that true at any interval.
    shadowOf(host).querySelector<HTMLButtonElement>('.peekover-watch')!.click();
    expect(isWatching()).toBe(true);
    await waitFor(() => reads > 0);
    text = DOC_V2;

    await waitFor(() => readerIn(host).textContent?.includes('the agent rewrote this on disk'));

    // THE RE-RENDER REALLY HAPPENED, and it really did destroy the chrome: the node captured
    // before the edit is detached. Without this, "the badge is present" could be the ORIGINAL
    // badge on a render that never occurred — the vacuity that makes a survival test worthless.
    expect(first.isConnected).toBe(false);

    const rebuilt = badgeIn(host);
    expect(rebuilt).not.toBeNull();
    expect(rebuilt).not.toBe(first); // a NEW node, re-derived
    expect(rebuilt!.textContent).toBe(`Agent file · ${AGENT_NAME}`);
    expect(badgesIn(host)).toHaveLength(1); // re-derived, not accumulated
  });

  it('APP PAGE, watch re-render: the badge survives the render `renderWithDiagrams` causes', async () => {
    // The same property on the surface whose re-render goes through a module-level `const` with no
    // file in scope (`appShell.renderWithDiagrams`) — the other half of D-1's argument, and the
    // road by which `MountOptions` would have arrived at module-level state anyway.
    let text = DOC;
    let reads = 0;
    const { container } = await openAppShell([
      mdFile(AGENT_NAME, async () => {
        reads += 1;
        return text;
      }),
    ]);
    const host = await clickFile(container, AGENT_NAME);
    const first = badgeIn(host)!;
    expect(first.textContent).toBe(`Agent file · ${AGENT_NAME}`);

    // This surface polls at the SHIPPED `WATCH_INTERVAL_MS` (1000 ms) — `installWatchForFile`
    // passes no interval — so the silent baseline read lands a full second after the click.
    // Counting reads rather than sleeping is what makes this deterministic instead of a race the
    // faster engine happens to win. `reads` is already non-zero from the initial select, so the
    // baseline is the FIRST read after the gesture; wait for one more than we have.
    const before = reads;
    shadowOf(host).querySelector<HTMLButtonElement>('.peekover-watch')!.click();
    expect(isWatching()).toBe(true);
    await waitFor(() => reads > before);
    text = DOC_V2;

    await waitFor(() => readerIn(host).textContent?.includes('the agent rewrote this on disk'));
    expect(first.isConnected).toBe(false); // the re-render destroyed the previous chrome

    const rebuilt = badgeIn(host);
    expect(rebuilt).not.toBeNull();
    expect(rebuilt).not.toBe(first);
    expect(rebuilt!.textContent).toBe(`Agent file · ${AGENT_NAME}`);
    expect(badgesIn(host)).toHaveLength(1);
  });
});

// ══ THE CONTENT SCRIPT'S NAME IS PARSED, NOT HANDED OVER ══════════════════════════════════════

describe('the content-script name comes from the REAL url, through the REAL parse', () => {
  it('a percent-encoded path still names the document (D-2’s decode, on a real location)', async () => {
    // `new URL(...).pathname` yields a percent-ENCODED segment, so a raw `split('/').pop()` would
    // compare `My%20Docs`-style bytes and miss. D-2 decided the decode rather than discovering it;
    // this is the decode running against a URL a browser actually produced.
    const host = openContentScript(`My%20Docs/${AGENT_NAME}`);
    expect(getDocIdentity()).toBe(AGENT_NAME);
    expect(badgeIn(host)!.textContent).toBe(`Agent file · ${AGENT_NAME}`);
  });

  it('a directory URL names nothing and badges nothing — and never throws into the mount path', async () => {
    // `basenameOf` returns `''` for a path ending in a separator; `isAgentFile('')` declines it.
    // The point is not the empty string, it is that AGENTS.md #5 holds: the reader still mounts.
    const host = openContentScript('some-folder/');
    expect(getDocIdentity()).toBe('');
    expect(badgeIn(host)).toBeNull();
    expect(readerIn(host).querySelector('h1')).not.toBeNull(); // never blank
  });
});

// ══ TASK 1.5 — THE BADGE'S PLACEMENT: A REAL RECT PROBE OVER THE TOP BAND ══════════════════════
//
// ★★ THIS SECTION PRODUCES THE LANE MEASUREMENT AND IS FORBIDDEN FROM CHOOSING THE LANE.
// Gate-2 Q3 ruled the badge's lane UNCHANGED — *"produce, do not choose"*. So nothing below edits
// `readerCss.ts`, adds a `CONTAINED_CSS` override, or resolves a collision it finds: every reading,
// INCLUDING the ones that come back as overlaps, is written to the run log by `record()` and the
// CHOICE is the human's at task 6.1. An overlap here is a MEASUREMENT, not a failure to fix.
//
// ── WHY THESE ARE RECT ASSERTIONS AND NOT DOM-SHAPE ONES ─────────────────────────────────────
//
// 1.4's cases above are all structure — parentage, text, count — and every one of them is green
// against a badge painted on top of the h1, because a DOM-shape assertion cannot see a pixel. D-12
// exists for that gap: *"placement is re-measured with a real rect probe, never chosen"*. Every
// assertion below reads `getBoundingClientRect()` in a real engine, through `realRect()`, which is
// the firing control — jsdom returns all-zero rects and applies no cascade, so this is a
// real-engine test or it is nothing.
//
// ── BOTH WIDTHS, AND WHY THAT IS NOT BELT-AND-BRACES (finding 2) ─────────────────────────────
//
// `GEOMETRY_WIDTHS` is 1280 AND 1400, copied from `diffChrome.browser.test.ts:83-86` rather than
// re-picked, and recovery B1's own note is the reason: 1400 alone sat on the CLEAN side of the
// finding-2 collision (the reading column's left margin was wide enough there to hide it) and a
// single wide width let that defect class ship. M8 puts new chrome in the same band, so both.
//
// ── THE 414 READING IS REPORTED, NOT ASSERTED ────────────────────────────────────────────────
//
// `diffChrome.ts:77-82` records that at 414x896 the app shell leaves the reader host 146px wide —
// narrower than a single pill — so EVERY candidate collides there and the existing aside stack
// already self-overlaps before any M8 chrome is added. Asserting at that width would pin a
// pre-existing 3.1-era condition of the contained pane onto the badge. It is MEASURED and recorded
// here anyway, so 6.1 sees it as a number rather than discovering it at the walk.

const NARROW = { width: 414, height: 896 }; // the browser project's own default, restored after each
const GEOMETRY_WIDTHS = [
  ['1280', { width: 1280, height: 900 }],
  ['1400', { width: 1400, height: 900 }],
] as const;

/** ★ ALL FIVE LABELS, READ FROM THE SHIPPED FROZEN SET — never a re-typed list, which a rename
 *  would silently strand. Plan §8 Q3 prices the badge's lane on the label being "one of ~6
 *  strings"; `AGENT_FILE_NAMES` is frozen at five, so `Agent file · ${name}` is exactly five
 *  enumerable strings and the widest is DERIVABLE rather than tuned — the same deterministic-width
 *  argument `diffChrome.ts:118-129` used to give the diff pill the left lane. */
const ALL_AGENT_NAMES = [...AGENT_FILE_NAMES];

/**
 * THE PROBE DOCUMENT, and every part of it is load-bearing:
 *   • a SECOND heading, because `buildTocView` omits the rail below two (`tocView.ts:546`) — the
 *     first run of this probe measured a band with NO rail in it and row 8's clearance loop cleared
 *     nothing, which is the vacuity `realRect` exists to catch and did;
 *   • genuinely blocked media, so `.peekover-remote-load` — the other declared occupant of the top
 *     band — is REALLY on screen while the badge is measured. Row 7 requires the probe run with the
 *     remote-load pill and the network indicator present, not against an empty band.
 */
const DOC_MEDIA = [
  '# Heading',
  'Some body text that makes the reader non-empty.',
  '## Section two',
  'A second heading, so the rail really renders.',
  '![blocked](https://example.invalid/x.png)',
].join('\n\n');

/** The band's siblings, by the class each module exports or ships. Probed as a set so a new pill
 *  added to the band later is measured by name rather than silently uncovered. */
const BAND_SIBLINGS = [
  ['mode toggle', '.peekover-mode-toggle'],
  ['theme pill', '.peekover-theme-toggle'],
  ['watch pill', '.peekover-watch'],
  ['watch note', '.peekover-watch-note'],
  ['capture disclosure', '.peekover-watch-disclosure'],
  ['remote-load', '.peekover-remote-load'],
  ['network indicator', '.peekover-net'],
  ['TOC handle', '.peekover-toc__toggle'],
  ['TOC list', '.peekover-toc__list'],
] as const;

/**
 * Put the surface into the state row 7 names: the network indicator revealed, the TOC rail forced
 * OPEN, and one paint elapsed first.
 *
 * The `flush()`-then-`data-toc` order is `diffChrome.browser.test.ts:356-360`'s finding, copied for
 * its stated reason: `tocView`'s width-derived initial state lands a frame LATER and stomps an
 * early `data-toc="open"` back to `collapsed`, which once hid the rail's entry list during a
 * placement probe and nearly cleared a candidate that in fact sat on it.
 */
async function settleTheBand(host: HTMLElement): Promise<void> {
  // TWO frames, not one: `applyInitialTocState` re-runs `decide()` against the real laid-out width
  // one frame after build and writes the width-derived default then (`tocView.ts:461-471` records
  // the stomp in as many words). Reading earlier measures a rail state the user never sees.
  await sleep(30);
  host.setAttribute('data-network', 'active');
  await sleep(30);
}

async function openTheBand(host: HTMLElement): Promise<void> {
  await sleep(30);
  host.setAttribute('data-toc', 'open');
  // The indicator ships `display:none` and is revealed by the host attribute the first network
  // action sets (`readerCss.ts`'s `:host([data-network="active"])`). This is a GEOMETRY probe, so
  // the attribute is set directly: nothing here performs a network action, and 1.6 is the task that
  // proves none happens.
  host.setAttribute('data-network', 'active');
  await sleep(30);
}

/** Restore the project default so a viewport this section sets cannot leak into another file. */
afterEach(async () => {
  await page.viewport(NARROW.width, NARROW.height);
});

// ── ROW 11 + ROW 7 — WHERE THE BADGE ACTUALLY IS, AT ALL FIVE LABELS ─────────────────────────

describe.each(GEOMETRY_WIDTHS)('1.5 · the badge’s own rect at %s (rows 7, 11)', (width, size) => {
  it.each([
    ['content script', 'cs'],
    ['app page', 'app'],
  ] as const)(`row 11 — %s: the badge is ANCHORED to the lane it declares, all five labels`, async (
    surfaceLabel,
    kind,
  ) => {
    await page.viewport(size.width, size.height);

    for (const name of ALL_AGENT_NAMES) {
      reset();
      const host =
        kind === 'cs' ? openContentScript(name, DOC_MEDIA) : await openAppPage(name, DOC_MEDIA);
      await openTheBand(host);

      const badge = badgeIn(host);
      const rect = realRect(badge, `badge (${name}) on the ${surfaceLabel}`);
      const style = getComputedStyle(badge!);

      // ROW 11, in the only form that can fire: the rect agrees with the DECLARED inset, resolved
      // against the badge's own containing block. A computed-style check alone would pass on a rule
      // that never matched; a rect alone would pass on a lane nobody declared.
      const box = style.position === 'fixed' ? new DOMRect(0, 0, innerWidth, innerHeight)
        : host.getBoundingClientRect();
      expect(Math.round(rect.left - box.left), `${name}: left inset`).toBe(
        Math.round(parseFloat(style.left)),
      );
      expect(Math.round(rect.top - box.top), `${name}: top inset`).toBe(
        Math.round(parseFloat(style.top)),
      );

      record(
        `${width} ${surfaceLabel} · badge "Agent file · ${name}" ${fmt(rect)} ` +
          `w=${rect.width.toFixed(1)} h=${rect.height.toFixed(1)} ` +
          `position:${style.position} top:${style.top} left:${style.left}`,
      );
    }
  });
});

// ══ ROWS 5 AND 8 — THE CLEARANCE READINGS, AND WHY THEY ARE RECORDED RATHER THAN ASSERTED ═════
//
// ★★ THIS IS THE POINT AT WHICH produce-do-not-choose STOPPED BEING A FORMALITY. The Verify
// contract words rows 5 and 8 as clearances — *"the badge does not occlude the reading column's
// text at either width"*, *"it clears the TOC rail and the mode toggle"*. Written as `expect(...
// ).toBe(false)` they were RED on the first run, in both engines, and the reading is not a harness
// fault:
//
//   1280, content script:  badge [16,56,187,93]  vs  reader h1 [173,56,857,105]  — OVERLAP.
//
// The provisional lane fails row 5 at 1280. There are exactly two ways to make a clearance
// assertion green from here, and gate-2 Q3 forbids both: MOVE THE BADGE (choosing the lane), or
// PIN the geometry that happens to clear (ratifying the lane, and reddening the moment 6.1 moves
// it). So rows 5 and 8 are executed as what D-12 actually asked for — *"PRODUCES numbers; the LANE
// CHOICE is plan §8 Q3 and is taken by the human at 6.1"* — and every rect, overlap and clearance
// is written to the run log instead.
//
// ★ WHAT STILL FIRES HERE, so this is a measurement and not an empty pass: `realRect` proves the
// badge, the h1, the paragraph and each band sibling are on screen with non-zero rects, so
// `overlaps: NONE` means *measured, nothing there* and never *measured nothing*. The overlap SET is
// asserted to be exactly what was measured, so a future run that changes it fails loudly with both
// rects in the message rather than drifting silently — a pin on the MEASUREMENT, which 6.1 is free
// to invalidate by choosing, not a pin on the LANE.
//
// ★ THE TARGET IS RENDERED CONTENT, NOT `.peekover-reader`'s OWN BOX — `diffChrome.browser.test.ts:
// 425-430`'s finding, carried rather than re-derived: the column's `padding:56px 32px 130px` is
// empty at every width forever and recovery B1 deliberately put a pill INSIDE it, so a whole-box
// reading would condemn a lane that is in fact clear. What must never be covered is TEXT.

/**
 * One (width, surface, rail-state) reading: every rect the row-5/row-8 probe touches, and the
 * overlaps.
 *
 * ★ RAIL STATE IS A DIMENSION, NOT A SETTING, and that is a finding of this probe rather than
 * thoroughness for its own sake: `readerCss.ts`'s B1 block records that the `data-toc="open"`
 * override MOVES the reading column's left margin, and the column's left edge is precisely what
 * decides whether the badge's `left:16` lane reaches its text. A probe that measured only the
 * forced-open rail would report the column at ONE of its two shipped positions and 6.1 would choose
 * a lane against half the geometry. Both states are read: `open` forced, and DEFAULT — whatever
 * `applyInitialTocState` derives from the width on a cold start.
 */
async function probeBand(
  width: string,
  surfaceLabel: string,
  kind: 'cs' | 'app',
  rail: 'open' | 'default',
): Promise<string[]> {
  const host =
    kind === 'cs' ? openContentScript('CLAUDE.md', DOC_MEDIA) : await openAppPage('CLAUDE.md', DOC_MEDIA);
  if (rail === 'open') await openTheBand(host);
  else await settleTheBand(host);
  // ★ THE REQUESTED STATE AND THE OBSERVED ONE, BOTH IN THE LABEL. At 1280 and 1400 the
  // width-derived default resolves to OPEN, so `default` and `open` measure the same geometry and
  // the dimension is DEGENERATE at both geometry widths. That is not wasted work: it is the proof
  // that the forced-open reading is the state a user actually sees at these widths, rather than an
  // artifact of the probe holding the rail open. If a future width rule changes, the two labels
  // diverge in the log and say so.
  const railState = host.getAttribute('data-toc') ?? '(unset)';
  surfaceLabel = `${surfaceLabel} rail:${rail}→${railState}`;

  // The WIDEST of the five labels is the only one that can reach furthest across the band, and it
  // is measured in the row-7 block above rather than asserted from a constant here.
  const badge = realRect(badgeIn(host), `badge on the ${surfaceLabel}`);
  const shadow = shadowOf(host);
  const reader = readerIn(host);

  // ROW 5 — the reading column's TEXT.
  const h1 = realRect(reader.querySelector('h1'), 'reader h1');
  const p = realRect(reader.querySelector('p'), 'reader first paragraph');
  record(`${width} ${surfaceLabel} · badge ${fmt(badge)} · h1 ${fmt(h1)} · p ${fmt(p)}`);

  const hits: string[] = [];
  if (intersects(badge, h1)) hits.push(`reader h1 ${fmt(h1)}`);
  if (intersects(badge, p)) hits.push(`reader p ${fmt(p)}`);

  // ROW 8 — the TOC rail, the mode toggle, and the rest of the band. NON-VACUOUS AND NAMED: the two
  // the row actually names must BE on screen, or "clears them" is a reading about an empty screen.
  // The remote-load pill is named too, because the whole point of `DOC_MEDIA` is an OCCUPIED band.
  expect(shadow.querySelector('.peekover-toc__toggle'), 'TOC rail absent').not.toBeNull();
  expect(shadow.querySelector('.peekover-mode-toggle'), 'mode toggle absent').not.toBeNull();
  expect(
    shadow.querySelector('.peekover-remote-load'),
    'remote-load absent — the blocked-media fixture stopped working',
  ).not.toBeNull();

  for (const [name, sel] of BAND_SIBLINGS) {
    const el = shadow.querySelector<HTMLElement>(sel);
    if (!el || el.hidden) continue;
    const other = el.getBoundingClientRect();
    if (other.width === 0 || other.height === 0) continue; // measured, and genuinely not on screen
    record(`${width} ${surfaceLabel} · badge ${fmt(badge)} vs ${name} ${fmt(other)}`);
    if (intersects(badge, other)) hits.push(`${name} ${fmt(other)}`);
  }

  record(
    `${width} ${surfaceLabel} · ROWS 5+8 OVERLAPS: ${hits.length === 0 ? 'NONE' : hits.join(' · ')}`,
  );
  return hits;
}

describe.each(GEOMETRY_WIDTHS)('1.5 · rows 5 + 8 — the clearance reading at %s (MEASURED)', (
  width,
  size,
) => {
  it.each([
    ['content script', 'cs', 'open'],
    ['content script', 'cs', 'default'],
    ['app page', 'app', 'open'],
    ['app page', 'app', 'default'],
  ] as const)('%s, rail %3$s, remote-load and network indicator present', async (
    surfaceLabel,
    kind,
    rail,
  ) => {
    await page.viewport(size.width, size.height);
    const hits = await probeBand(width, surfaceLabel, kind, rail);

    // ★ THE PIN IS ON THE MEASUREMENT, NOT ON THE LANE. The occupied readings below are the
    // FINDING task 6.1 rules on, written as a table so the run states which cases collide instead
    // of leaving it to the log. If a reading changes without the lane changing — a copy edit that
    // widens the label, a column-margin change — this reds carrying both rects. 6.1 is free to
    // invalidate the whole table by choosing a lane; that is what choosing means.
    const OCCUPIED = new Set(['1280 cs open', '1280 cs default']);
    expect(
      hits.length > 0,
      `the measured overlap set changed: ${hits.length === 0 ? 'NONE' : hits.join(' · ')}`,
    ).toBe(OCCUPIED.has(`${width} ${kind} ${rail}`));
  });
});

// ── ROW 10 — OUT OF FLOW: THE PAGE UNDER THE BADGE DOES NOT MOVE ─────────────────────────────
//
// The badge is `position:fixed`, so it should take NO space in the flow — and the assertion the row
// asks for is the one that can actually fire: render the SAME document twice, once under a name the
// registry recognizes and once under one it does not, and require the column's first block to land
// on the SAME rect. Against a badge that had been made static or in-flow, the badged run pushes the
// column down and this is the only case in the file that reds.

describe.each(GEOMETRY_WIDTHS)('1.5 · row 10 — the badge is OUT OF FLOW at %s', (width, size) => {
  it.each([
    ['content script', 'cs'],
    ['app page', 'app'],
  ] as const)('%s: the column’s first block lands on the same rect with and without it', async (
    surfaceLabel,
    kind,
  ) => {
    // KEEPS: the badge appearing does not move the reading column's first block (C061). RE-SPELLED
    // at 013 task 4.4, the APP arm only, by the human's ruling (2026-11-03): with the four app
    // controls in the toolbar, an agent file's toolbar at 1280 px is a few px too wide for one row
    // and wraps to a second — approved behaviour between the compact breakpoint and ~1290 px, as at
    // 1080 in the mock — so the app arm is held at 1400, where the toolbar is one row with or
    // without the badge. The content-script arm keeps both widths.
    const viewport = kind === 'app' ? { width: Math.max(size.width, 1400), height: size.height } : size;
    await page.viewport(viewport.width, viewport.height);

    const open = async (name: string): Promise<HTMLElement> =>
      kind === 'cs' ? openContentScript(name, DOC_MEDIA) : openAppPage(name, DOC_MEDIA);

    const badged = await open('CLAUDE.md');
    await openTheBand(badged);
    expect(badgeIn(badged), 'the badged run grew no badge').not.toBeNull();
    const withBadge = realRect(readerIn(badged).querySelector('h1'), 'h1 (badged run)');
    const badgeRect = realRect(badgeIn(badged), 'badge');

    reset();

    const plain = await open(PLAIN_NAME);
    await openTheBand(plain);
    expect(badgeIn(plain), 'the control run grew a badge — it is not a control').toBeNull();
    const withoutBadge = realRect(readerIn(plain).querySelector('h1'), 'h1 (un-badged run)');

    record(
      `${width} ${surfaceLabel} · row10 h1 badged ${fmt(withBadge)} · un-badged ` +
        `${fmt(withoutBadge)} · badge ${fmt(badgeRect)}`,
    );
    expect(Math.round(withBadge.top)).toBe(Math.round(withoutBadge.top));
    expect(Math.round(withBadge.left)).toBe(Math.round(withoutBadge.left));
    expect(Math.round(withBadge.width)).toBe(Math.round(withoutBadge.width));
    expect(Math.round(withBadge.height)).toBe(Math.round(withoutBadge.height));
  });
});

// ══ (a) THE FULL-PAGE COINCIDENCE — TWO RULES, ONE OFFSET, HELD APART BY A BUILD-TIME GATE ════
//
// `readerCss.ts` records it and routes it here: on the FULL PAGE, `.peekover-agent-badge` and
// `.peekover-diff-affordance` declare the SAME `top:56px;left:16px`, and the only thing keeping
// them off each other is D-14 — `buildDiffChrome`'s gate is `isDiffContextRegistered()`, and no
// content-script graph ever registers a context. That is a coincidence held by a BUILD-TIME
// CONDITION, not by geometry. If D-14 ever changes, these two land on each other silently and the
// badge is the one that would be covered.
//
// ★ THE RED-FIRST IS THE GATE'S INPUT, NOT ITS CODE. The ablation registers a diff context on the
// content-script surface — the one call `appShell` makes and `contentWatch` does not — and nothing
// in `src/` is edited. The affordance then really renders on the full page and the probe really
// reads two overlapping rects, which is the collision the gate currently prevents, in pixels.

describe.each(GEOMETRY_WIDTHS)('1.5 · (a) the full-page offset coincidence at %s', (width, size) => {
  it('the gate HOLDS: no affordance on the content script, so the badge’s slot is its own', async () => {
    await page.viewport(size.width, size.height);
    const host = openContentScript('CLAUDE.md', DOC_MEDIA);
    await openTheBand(host);

    expect(isDiffContextRegistered(), 'a content-script graph registered a diff context').toBe(false);
    expect(
      shadowOf(host).querySelector(`.${DIFF_AFFORDANCE_CLASS}`),
      'D-14 broke: the diff affordance rendered on the content script',
    ).toBeNull();

    const badge = realRect(badgeIn(host), 'badge');
    record(`${width} full page · badge ${fmt(badge)} · affordance NOT RENDERED (D-14 gate holds)`);
  });

  it('★ RED-FIRST — with the gate’s input supplied, the two rects really do COLLIDE', async () => {
    await page.viewport(size.width, size.height);

    // THE ABLATION: supply the context `appShell.installWatchForFile` supplies, on the surface that
    // never does. No production module is edited and `buildDiffChrome`'s gate is untouched — it is
    // FED rather than removed, which is why this reads the real rule at its real offset.
    registerDiffContext(
      createDiffContext({
        docId: 'ablation',
        getCurrentSource: () => DOC_MEDIA,
        fetchMeta: async () => [],
        fetchText: async () => undefined,
        showDiff: () => ({ ok: true }),
        hideDiff: () => undefined,
      }),
    );
    const ablated = openContentScript('CLAUDE.md', DOC_MEDIA);
    await openTheBand(ablated);

    const badge = realRect(badgeIn(ablated), 'badge (gate ablated)');
    const affordance = realRect(
      shadowOf(ablated).querySelector(`.${DIFF_AFFORDANCE_CLASS}`),
      'diff affordance (gate ablated)',
    );

    record(
      `${width} full page · GATE ABLATED · badge ${fmt(badge)} vs affordance ${fmt(affordance)} ` +
        `· overlap=${intersects(badge, affordance)}`,
    );
    // ★ THE POINT: the coincidence is real and it is a collision, so the assertion above is guarding
    // something rather than restating an absence. Recorded, NOT resolved — 6.1 rules.
    expect(intersects(badge, affordance), 'the two rules do NOT in fact share a slot').toBe(true);

    resetDiffRegistryForTest();
  });
});

// ══ (b) THE CONTAINED PANE — THE BADGE AGAINST THE top:50 SLOT ════════════════════════════════
//
// The live collision candidate `readerCss.ts` flagged as *"the first thing 1.5 should probe"*:
// recovery B1 moved `.peekover-diff-affordance` to `top:12` and its picker and status to `top:50`
// under `CONTAINED_CSS`, while the badge declares `top:56`. Both the picker and the status are
// `hidden` until opened, so nothing on screen shows the reading — it has to be measured.
//
// ★ THE PICKER AND STATUS ARE UN-HIDDEN TO BE MEASURED, and that is a probe action on SHIPPED
// chrome, not a fixture: the elements, their classes and their offsets are all production. An empty
// picker's HEIGHT is content-dependent, so the worst case is measured too — its real left/top/width
// with its real computed `max-height` — and both readings are recorded.

describe.each(GEOMETRY_WIDTHS)('1.5 · (b) the contained pane’s top:50 slot at %s', (width, size) => {
  it('the badge’s rect against the diff picker’s and status’s slot — MEASURED, not resolved', async () => {
    await page.viewport(size.width, size.height);
    const host = await openAppPage('CLAUDE.md', DOC_MEDIA);
    await openTheBand(host);

    const shadow = shadowOf(host);
    const badge = realRect(badgeIn(host), 'badge (contained pane)');
    const hostRect = host.getBoundingClientRect();
    record(
      `${width} contained · host ${fmt(hostRect)} · badge ${fmt(badge)} ` +
        `position:${getComputedStyle(badgeIn(host)!).position}`,
    );

    const picker = shadow.querySelector<HTMLElement>(`.${DIFF_PICKER_CLASS}`);
    const status = shadow.querySelector<HTMLElement>(`.${DIFF_STATUS_CLASS}`);
    if (picker === null && status === null) {
      // A designed state, recorded rather than skipped: this harness's folder source may not reach
      // `appShell`'s `docId != null` block, in which case D-14's gate keeps the diff chrome off
      // this pane too and the top:50 slot is EMPTY here. 6.1 needs to know which of the two it is.
      record(`${width} contained · diff chrome NOT REGISTERED on this pane — top:50 slot is empty`);
      expect(isDiffContextRegistered()).toBe(false);
      return;
    }

    for (const [name, el] of [
      ['diff picker', picker],
      ['diff status', status],
    ] as const) {
      if (el === null) continue;
      const wasHidden = el.hidden;
      el.hidden = false; // the slot it occupies WHEN OPENED — the only way to read a hidden rect
      const slot = realRect(el, `${name} (un-hidden for the probe)`);
      const maxH = parseFloat(getComputedStyle(el).maxHeight);
      const worst = new DOMRect(
        slot.left,
        slot.top,
        slot.width,
        Number.isFinite(maxH) ? Math.max(slot.height, maxH) : slot.height,
      );
      record(
        `${width} contained · badge ${fmt(badge)} vs ${name} ${fmt(slot)} ` +
          `(empty) overlap=${intersects(badge, slot)} · worst-case ${fmt(worst)} ` +
          `overlap=${intersects(badge, worst)}`,
      );
      el.hidden = wasHidden;
    }
    // NO ASSERTION ON THE OUTCOME. Whether these overlap is the FINDING task 6.1 rules on; an
    // assertion here would be this task quietly ratifying a lane, which gate-2 Q3 forbids. The
    // firing control is `realRect` above: every rect written to the log is a real, non-zero one.
  });
});

// ══ THE 414 READING — reported beside the wide ones, deliberately not asserted ═════════════════

describe('1.5 · the 414x896 reading, RECORDED (diffChrome.ts:77-82’s pre-existing condition)', () => {
  it.each([
    ['content script', 'cs'],
    ['app page', 'app'],
  ] as const)('%s: the badge’s rect and every band overlap it has at 414', async (surfaceLabel, kind) => {
    await page.viewport(NARROW.width, NARROW.height);
    const host =
      kind === 'cs'
        ? openContentScript('CLAUDE.md', DOC_MEDIA)
        : await openAppPage('CLAUDE.md', DOC_MEDIA);
    await openTheBand(host);

    const badge = realRect(badgeIn(host), `badge at 414 on the ${surfaceLabel}`);
    const hits: string[] = [];

    // ★ THE COLUMN IS READ SOFTLY HERE, AND THAT IS ITSELF THE 414 FINDING. On the app page at 414
    // the shell's tree leaves the reader pane so narrow that the h1 measures ZERO WIDTH — it is not
    // laid out at all — which is `diffChrome.ts:77-82`'s pre-existing contained-pane condition
    // showing up in a rect. `realRect` would (correctly) call that vacuous and stop the run; the
    // reading is recorded instead, because 6.1 needs the number rather than a red.
    const h1El = readerIn(host).querySelector<HTMLElement>('h1');
    const h1 = h1El?.getBoundingClientRect() ?? null;
    record(
      `414 ${surfaceLabel} · reader h1 ${h1 === null ? 'ABSENT' : fmt(h1)}` +
        `${h1 !== null && (h1.width === 0 || h1.height === 0) ? ' — ZERO-SIZE, not laid out' : ''}`,
    );
    if (h1 !== null && h1.width > 0 && h1.height > 0 && intersects(badge, h1)) {
      hits.push(`reader h1 ${fmt(h1)}`);
    }

    for (const [name, sel] of BAND_SIBLINGS) {
      const el = shadowOf(host).querySelector<HTMLElement>(sel);
      if (!el || el.hidden) continue;
      const other = el.getBoundingClientRect();
      if (other.width === 0 || other.height === 0) continue;
      if (intersects(badge, other)) hits.push(`${name} ${fmt(other)}`);
    }
    record(
      `414 ${surfaceLabel} · badge ${fmt(badge)} · collisions: ` +
        `${hits.length === 0 ? 'NONE' : hits.join(' · ')}`,
    );
    // Reported, not asserted — and the firing control is that the badge and the h1 both have real,
    // non-zero rects above, so "NONE" would be a measurement and not an empty screen.
  });
});

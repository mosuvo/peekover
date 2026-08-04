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
import { runReader, removeHideStyle } from '../../src/render/runReader';
import { mountAppShell, type AppStore } from '../../src/app/appShell';
import type { FolderSource, MarkdownFile } from '../../src/app/folderSource';
import { installContentWatch } from '../../src/watch/contentWatch';
import { AGENT_BADGE_CLASS } from '../../src/render/agentBadge';
import { getDocIdentity, resetDocIdentityForTest } from '../../src/render/docIdentity';
import { resetWatchRegistryForTest, isWatching } from '../../src/watch/watchRegistry';
import { resetWatchControlsForTest } from '../../src/watch/watchControl';
import { resetThemeHostsForTest } from '../../src/theme/themeRegistry';
import { resetThemeControlsForTest } from '../../src/theme/themeControl';
import { resetDiffRegistryForTest } from '../../src/render/diffRegistry';
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

// The agent-file badge's ZERO-NETWORK GUARD — real-engine bytes-on-wire (008 task 1.6, §3.11
// row 22), Chromium AND Firefox, on BOTH surfaces (§3.11 row 23).
//
// ══ THE CLAIM, AND WHY IT IS ONLY WORTH WHAT ITS CONTROL IS WORTH ═════════════════════════════
//
// Recognition is a `Set.has` (`agentFile.ts`) and the badge is a `<p>` with a `textContent`
// (`agentBadge.ts:137-140`). Neither *should* be able to reach the network, and that is exactly the
// shape of claim that ships wrong: AGENTS.md #1 is a non-negotiable, and a guard that watches for
// requests and sees none proves nothing unless something in the SAME run WOULD have tripped it.
// "No request" has two readings — the badge is quiet, or the probe is blind — and only a control
// that FIRES tells them apart (retro finding 1). So every test below arms the probe first, in its
// own body, and only then measures the badge against it.
//
// ══ REAL ENGINE OR NOTHING ════════════════════════════════════════════════════════════════════
//
// jsdom loads no subresources, so a jsdom "no fetchable node in the tree" reading is a DOM-SHAPE
// proxy that stayed green through the entire M1 remote-image leak (progress.md 2026-07-14). This
// suite asserts on the engine's OWN Resource Timing buffer, where an entry appears only when
// Chromium/Firefox actually put a request on the wire — the discipline
// `remoteMedia.browser.test.ts` established and `tocNetwork.browser.test.ts` carried. The
// `/^https?:/i` predicate is that suite's VERBATIM, and `awaitFetchedUrls` is `remoteMedia:83-92`'s
// shape for the same stated reason: you can WAIT for a request that should arrive, and you cannot
// wait for one that should never come.
//
// ══ ★ TWO LANES ARE ARMED, NOT ONE — AND WHY THE SECOND ONE EXISTS ════════════════════════════
//
// A `fetch()` control proves the buffer records the FETCH lane. It says nothing about the lane a
// badge could plausibly leak through, which is a SUBRESOURCE dispatched by markup the render path
// committed. So the second control is markup — and per row 22's ★ it is markup **NO SANITIZER HAS
// TOUCHED**, because a control routed through `DOMPurify.sanitize()` measures the sanitizer's own
// inert parse and not the adopted artifact: in Firefox that parse CONSUMES an eagerly-loaded URL,
// and a later adoption of the same URL is never retried, so the control reads NO-FETCH while the
// route is wide open (the standing lesson, decisions.md 2026-07-29). Hand-written markup, parsed
// once, adopted once.
//
// ══ ★ THE INERT `<template>`, WHICH IS BOTH THE NEUTRALIZATION AND HALF THE CONTROL ═══════════
//
// The probe markup is parsed into a `<template>`'s `.content` — an inert document with NO browsing
// context — never a "detached" `div`. That distinction is not pedantry: `document.createElement
// ('div').innerHTML = html` IS owned by this document and DOES dispatch the fetch, which is the
// leak that shipped (`mount.ts:120-127` records it in as many words). Parsing into the template is
// asserted to fire NOTHING, and then the SAME BYTES adopted into the live document ARE asserted to
// fire — so the inert-parse zero is non-vacuous (the URL demonstrably fetches when it is allowed
// to) and the adoption is a genuine positive control on the subresource lane.
//
// ══ WHAT IS MEASURED ══════════════════════════════════════════════════════════════════════════
//
// The badge's whole lifecycle, driven the way production drives it: REGISTER (the real registration
// sites — `runReader` for the content script, `installWatchForFile` for the app page) → RECOGNIZE
// (`isAgentFile` at build time) → RENDER (`mount()` composing the pill) → RE-RENDER (bare `mount()`
// on the content script, a document switch on the app page). Nothing here hand-registers a name on
// the surface tests; 1.4's argument for that stands unchanged.
//
// SCOPING, honestly: the fixtures are plain heading+prose documents — no remote media, no code
// fences (Shiki), no math (KaTeX), no mermaid — so nothing on the render path lazy-loads a chunk,
// and the whole module graph is statically imported at file load, before any measured window.
// Therefore ANY http(s) entry inside a measured window is attributable, and the zeros are read with
// the verbatim predicate rather than a token filter so a leak to ANY host would land in them.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mount } from '../../src/render/mount';
import { runReader, removeHideStyle } from '../../src/render/runReader';
import { mountAppShell, type AppStore } from '../../src/app/appShell';
import type { FolderSource, MarkdownFile } from '../../src/app/folderSource';
import { AGENT_BADGE_CLASS, buildAgentBadge } from '../../src/render/agentBadge';
import { AGENT_FILE_NAMES } from '../../src/render/agentFile';
import {
  getDocIdentity,
  registerDocIdentity,
  resetDocIdentityForTest,
} from '../../src/render/docIdentity';
import { resetWatchRegistryForTest } from '../../src/watch/watchRegistry';
import { resetWatchControlsForTest } from '../../src/watch/watchControl';
import { resetThemeHostsForTest } from '../../src/theme/themeRegistry';
import { resetThemeControlsForTest } from '../../src/theme/themeControl';
import { resetDiffRegistryForTest } from '../../src/render/diffRegistry';

// ── Fixtures ──────────────────────────────────────────────────────────────────────────────────

const AGENT_NAME = 'CLAUDE.md';
const OTHER_AGENT_NAME = 'AGENTS.md';

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

// ── The instrument ────────────────────────────────────────────────────────────────────────────

let seq = 0;
/** A unique path token per probe so one test's entries can never be read as another's (the buffer
 *  is shared across the whole page). */
const nextToken = (): string => `agentbadge-${(seq += 1)}-${Math.trunc(performance.now())}`;

/**
 * ★ THE VERBATIM PREDICATE (`remoteMedia`/`tocNetwork`'s `/^https?:/i`), applied to the whole
 * buffer rather than to a token — a leak to ANY host, expected or not, lands in this reading. This
 * is what every ZERO assertion below is made of.
 */
function networkedUrls(): string[] {
  return performance
    .getEntriesByType('resource')
    .map((e) => e.name)
    .filter((name) => /^https?:/i.test(name));
}

/** Entry names recorded for one probe token — the CONTROL's reading, scoped so a control can never
 *  be satisfied by an unrelated request. */
function probeUrls(token: string): string[] {
  return performance
    .getEntriesByType('resource')
    .map((e) => e.name)
    .filter((name) => name.includes(`/__peekover_badge_probe__/${token}/`));
}

// A macrotask + rAF + settle — long enough that a request fired during the window has reached the
// Resource Timing buffer (`remoteMedia:94-104`). If a request fired it is recorded here; if none
// did the buffer stays empty however long we wait, so this is a sound "zero requests" proof and it
// is used ONLY in that direction.
function flush(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => requestAnimationFrame(() => setTimeout(resolve, 60)), 120);
  });
}

/**
 * THE CONTROL'S WAIT — await the entries, never sample for them (`remoteMedia:53-92`, verbatim in
 * shape). The buffer is written asynchronously after the response completes, so a fixed window can
 * expire before the engine records a request it genuinely made — measured as a Firefox-only flake
 * at 1-in-10 runs. A control that reads empty when the request DID fire can read empty when it did
 * NOT, and the assertion it guards is AGENTS.md #1. Returns the buffer rather than throwing, so a
 * genuine failure fails on the CALLER's `toContain` with the real diff.
 */
const CONTROL_BUDGET_MS = 5000;
async function awaitProbeUrls(token: string, expected: string[]): Promise<string[]> {
  const deadline = performance.now() + CONTROL_BUDGET_MS;
  let seen = probeUrls(token);
  while (!expected.every((u) => seen.includes(u)) && performance.now() < deadline) {
    await sleep(25);
    seen = probeUrls(token);
  }
  return seen;
}

/** Same-origin, so even a regression hits the vitest dev server (a 404) and never the public
 *  internet — but the http(s) scheme still classifies as on-wire exactly as a CDN URL would. */
function probeUrl(token: string, leaf: string): string {
  return new URL(`/__peekover_badge_probe__/${token}/${leaf}`, location.origin).href;
}

/** Flush and assert NOTHING hit the wire. The buffer was cleared before the measured window, so any
 *  http(s) entry here is badge-attributable. `label` names the lifecycle step so a failure points at
 *  the exact one. */
async function assertNoNetwork(label: string): Promise<void> {
  await flush();
  expect(networkedUrls(), `the badge's "${label}" step put bytes on the wire`).toEqual([]);
}

// ── ★ ARMING THE PROBE — both lanes, in the SAME test body as the zeros they license ──────────

const adopted: Element[] = [];

/**
 * CONTROL LANE 1 — a bare `fetch()`. Proves this engine's buffer records a request at all, through
 * this exact `flush()`/`await` window.
 */
async function armFetchLane(): Promise<void> {
  const token = nextToken();
  const url = probeUrl(token, 'control.txt');
  await fetch(url).catch(() => undefined);
  const seen = await awaitProbeUrls(token, [url]);
  expect(seen, 'CONTROL (fetch lane): the buffer must see a real request — else it is blind').toContain(
    url,
  );
  expect(networkedUrls(), 'CONTROL (fetch lane): the verbatim predicate must ALSO see it').toContain(
    url,
  );
}

/**
 * CONTROL LANE 2 — the SUBRESOURCE lane, on markup NO SANITIZER HAS TOUCHED, and the inert
 * `<template>` neutralization proven in the same breath.
 *
 * Step 1 parses hand-written `<img src>` markup into a `<template>`'s `.content` and asserts ZERO —
 * the inert document has no browsing context, so nothing is dispatched. Step 2 adopts THE SAME
 * NODES into the live document and asserts the request DOES fire. Because both steps use the same
 * bytes and the same URL, neither reading can be explained away: the zero is not "an unfetchable
 * URL" (it fetches one line later) and the fire is not "some other request" (it is token-scoped).
 *
 * ★ Nothing here routes through `sanitize()`. A control that did would be measuring DOMPurify's own
 * internal `DOMParser` pass, which in Firefox consumes an eagerly-loaded URL outright and reads
 * NO-FETCH while the route is open (decisions.md 2026-07-29). `<img>` is the safe form for the
 * inert half — only `@import` is loaded eagerly enough to be consumed by an inert parse — which is
 * precisely why the two halves can share one URL and mean two different things.
 */
async function armSubresourceLane(): Promise<void> {
  const token = nextToken();
  const url = probeUrl(token, 'control.png');

  // Step 1 — INERT PARSE. A <template>'s content, never a "detached" div: that div is owned by this
  // document and WOULD dispatch the fetch (mount.ts:120-127 — the leak that actually shipped).
  const tpl = document.createElement('template');
  tpl.innerHTML = `<img src="${url}" alt="">`;
  expect(
    tpl.content.querySelector('img')?.getAttribute('src'),
    'the probe markup did not survive the inert parse — this control would measure nothing',
  ).toBe(url);
  await flush();
  expect(probeUrls(token), 'the inert <template> parse dispatched a request').toEqual([]);

  // Step 2 — ADOPTION. The same nodes, now owned by a document WITH a browsing context.
  //
  // ★ MEASURED, NOT ASSUMED: the fetch fires at `importNode`, NOT at `appendChild`. Ablating the
  // insertion alone leaves this control GREEN in both engines — the imported fragment is DETACHED
  // but `document`-OWNED, and that is what dispatches. Ablating the import as well (the markup
  // never leaving `tpl.content`) is what turns it red. So "detached" is not the property that keeps
  // a node quiet; "no browsing context" is — the exact distinction the M1 leak was made of, and the
  // reason the neutralization above is a `<template>` and not a `div`.
  const node = document.importNode(tpl.content, true);
  const img = node.querySelector('img')!;
  document.body.appendChild(node);
  adopted.push(img);
  const seen = await awaitProbeUrls(token, [url]);
  expect(
    seen,
    'CONTROL (subresource lane): adopted markup must fetch — else this probe cannot see a leak',
  ).toContain(url);
  expect(
    networkedUrls(),
    'CONTROL (subresource lane): the verbatim predicate must ALSO see it',
  ).toContain(url);
}

/** Arm BOTH lanes, then hand back a clean buffer for the measurement. */
async function armTheProbe(): Promise<void> {
  performance.clearResourceTimings();
  await armFetchLane();
  await armSubresourceLane();
  for (const el of adopted.splice(0)) el.remove(); // the control's node never rides into the window
  performance.clearResourceTimings();
}

// ── Surface harnesses ─────────────────────────────────────────────────────────────────────────
//
// Copied in SHAPE from `agentBadge.browser.test.ts:92-172` and deliberately NOT imported from it:
// that file is a test module with its own lifecycle and importing it would run its suites.

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

async function openAppShell(files: MarkdownFile[]): Promise<HTMLElement> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  containers.push(container);
  const app = mountAppShell(container, {
    openFolder: async () => ({ ok: true, source: sourceOf(files) }),
    store: fakeStore(),
  });
  await app.openFolder();
  return container;
}

async function clickFile(container: HTMLElement, name: string): Promise<HTMLElement> {
  const btn = [
    ...container.querySelectorAll<HTMLButtonElement>('[role="treeitem"][data-kind="file"]'),
  ].find((b) => b.textContent === name)!;
  btn.click();
  const host = await waitFor(() =>
    container.querySelector<HTMLElement>('.peekover-app__reader__host'),
  );
  await waitFor(() => host.shadowRoot?.querySelector('.peekover-reader h1'));
  return host;
}

// ── Readers ───────────────────────────────────────────────────────────────────────────────────

const shadowOf = (host: HTMLElement) => host.shadowRoot!;
const badgeIn = (host: HTMLElement) =>
  shadowOf(host).querySelector<HTMLElement>(`.${AGENT_BADGE_CLASS}`);

// ── Lifecycle ─────────────────────────────────────────────────────────────────────────────────

function reset(): void {
  removeHideStyle(); // `body > :not(peekover-root){display:none}` would hide the next fixture
  resetDocIdentityForTest();
  resetWatchRegistryForTest();
  resetWatchControlsForTest();
  resetThemeHostsForTest();
  resetThemeControlsForTest();
  resetDiffRegistryForTest();
  for (const el of adopted.splice(0)) el.remove();
  for (const h of hosts.splice(0)) h.remove();
  for (const c of containers.splice(0)) c.remove();
  document.querySelectorAll('peekover-root').forEach((el) => el.remove());
  document.body.replaceChildren();
}

beforeEach(reset);
afterEach(reset);

// ══ THE SURFACES ══════════════════════════════════════════════════════════════════════════════
//
// Each surface supplies its own PRODUCTION re-render, because they do not share one:
//   • content script — `contentWatch.ts` builds its controller with NO `render`, so an agent's edit
//     re-renders through BARE `mount()`. That call IS the re-render path.
//   • app page — a document switch through the real click chain, which re-runs the whole lifecycle
//     (register → recognize → render) a second time and is the case D-1 exists for.

type Opened = {
  host: HTMLElement;
  /** The surface's own production re-render. Returns the (possibly new) host. */
  rerender: () => Promise<HTMLElement>;
  /** What the badge must read after the re-render — the same name, or the switched-to one. */
  nameAfter: string;
};

const SURFACES = [
  [
    'content script',
    async (): Promise<Opened> => {
      const host = openContentScript(AGENT_NAME);
      return {
        host,
        rerender: async () => {
          mount(DOC_V2, host);
          return host;
        },
        nameAfter: AGENT_NAME,
      };
    },
  ],
  [
    'app page',
    async (): Promise<Opened> => {
      const container = await openAppShell([
        mdFile(AGENT_NAME, async () => DOC),
        mdFile(OTHER_AGENT_NAME, async () => DOC_V2),
      ]);
      const host = await clickFile(container, AGENT_NAME);
      return {
        host,
        rerender: async () => clickFile(container, OTHER_AGENT_NAME),
        nameAfter: OTHER_AGENT_NAME,
      };
    },
  ],
] as const;

describe.each(SURFACES)(
  'the badge puts NOTHING on the wire on the %s surface (task 1.6, row 22)',
  (_label, open) => {
    it('register → recognize → render → re-render: ZERO requests, against an ARMED probe', async () => {
      // ★ ARM FIRST, IN THIS TEST'S OWN BODY. Both lanes fire here — a bare fetch, and adopted
      // markup no sanitizer has touched — so every zero below is measured against an instrument
      // that has just been shown to see requests in THIS engine, in THIS run.
      await armTheProbe();

      // REGISTER → RECOGNIZE → RENDER, through the production registration site. Nothing here
      // hand-registers a name: the content script parses `location.href` in `runReader`, the app
      // page registers `file.name` in `installWatchForFile` before the select that mounts.
      const opened = await open();
      await assertNoNetwork('register → recognize → render');

      // NON-VACUITY: the badge really was recognized, built and committed inside that window. A
      // zero measured over a render that grew no badge would be a reading about nothing.
      const badge = badgeIn(opened.host);
      expect(badge, 'no badge was built — this window measured nothing').not.toBeNull();
      expect(badge!.textContent).toBe(`Agent file · ${AGENT_NAME}`);
      expect(getDocIdentity()).toBe(AGENT_NAME);

      // RE-RENDER — the surface's own production path. `mount()`'s `replaceChildren` destroys the
      // chrome and `buildAgentBadge` re-derives the pill from the registry, so this is the whole
      // recognize-and-build sequence run a second time.
      const host = await opened.rerender();
      const rebuilt = badgeIn(host);
      expect(rebuilt, 'the re-render grew no badge — this window measured nothing').not.toBeNull();
      expect(rebuilt).not.toBe(badge); // a NEW node: the re-render really happened
      expect(rebuilt!.textContent).toBe(`Agent file · ${opened.nameAfter}`);
      await assertNoNetwork('re-render');

      // CUMULATIVE — the buffer was never re-cleared, so this also re-reads every step above.
      await flush();
      expect(
        networkedUrls(),
        'cumulative: some step of the badge lifecycle put a byte on the wire',
      ).toEqual([]);

      // ★ AND THE PROBE IS STILL LIVE. Without this, a probe that went blind midway through the
      // measurement would report a clean zero and be indistinguishable from a quiet badge.
      await armFetchLane();
      await armSubresourceLane();
    });
  },
);

// ══ THE SEAM IN ISOLATION — ALL FIVE RECOGNIZED NAMES ═════════════════════════════════════════
//
// The surface tests above measure the badge's lifecycle inside a full `mount()`, which is the
// honest production reading but attributes a zero to the whole render. This one narrows it to the
// two modules the claim is actually about: `registerDocIdentity` → `isAgentFile` → the `<p>`, with
// the built node COMMITTED to the live document (not left detached, which would prove nothing about
// a node that fetches on insertion). Hand-registering is correct here precisely because wiring is
// not what is under test — 1.4 proved that, and this isolates recognition and construction.
//
// All five members of the frozen set, read from the shipped `AGENT_FILE_NAMES` rather than a
// re-typed list, so a name added to the set is covered by this guard automatically.

describe('the seam in isolation — recognize + build touches nothing, for every recognized name', () => {
  it('all five names: register → buildAgentBadge → commit to the live DOM fires ZERO requests', async () => {
    await armTheProbe();

    const host = document.createElement('div');
    document.body.appendChild(host);
    containers.push(host);

    for (const name of AGENT_FILE_NAMES) {
      registerDocIdentity(name);
      const nodes = buildAgentBadge();
      expect(nodes, `${name} is in the frozen set but built no badge`).toHaveLength(1);
      // COMMITTED, not inspected: insertion into a document WITH a browsing context is the moment
      // a fetchable node would dispatch. A detached-node check would miss exactly that.
      host.append(...nodes);
      expect((nodes[0] as HTMLElement).textContent).toBe(`Agent file · ${name}`);
    }
    expect(host.children).toHaveLength(AGENT_FILE_NAMES.size);

    await assertNoNetwork('register → recognize → build → commit, all five names');

    // The probe stayed live across the whole sweep.
    await armFetchLane();
    await armSubresourceLane();
  });
});

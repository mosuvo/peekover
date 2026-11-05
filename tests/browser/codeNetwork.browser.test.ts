// THE CODE-BLOCK PIPELINE'S ZERO-NETWORK GUARD — real-engine bytes on the wire (009 task 4.4,
// §3.11 row 22), Chromium AND Firefox. Covers the whole pipeline the row names: engine-load,
// tokenize, theme-select, copy, collapse.
//
// ══ THE CLAIM, AND WHY IT IS WORTH EXACTLY WHAT ITS CONTROL IS WORTH ═════════════════════════
//
// §4 Trust / AGENTS.md #1: no part of highlighting a code fence may put a request on the wire.
// D-3 already keeps the engine choice WASM-free (no CSP change, no manifest event); this file
// proves the OTHER half — that nothing in codeEngine.ts / codeEnhancer.ts / codeView.ts ever
// reaches the network at the request level, on a REAL engine, not a jsdom DOM-shape proxy that
// would read NO-FETCH over a wide-open route.
//
// ★ SO THE ABSENCE IS VACUOUS WITHOUT A FIRING CONTROL, and that is proven in THIS test's own
// body, not assumed (retro finding 1; `tableNetwork.browser.test.ts`'s row-22 shape, one task
// earlier). Every case below arms the probe, then re-arms it at the end, so a probe gone blind
// mid-run cannot report a clean zero.
//
// ══ ★ D-4's CONTROL IS SHARPER THAN A ROUTE-THROUGH-SANITIZE CONTROL ═════════════════════════
//
// `codeToTokens` never produces an HTML string (D-4) — `codeEnhancer.ts`'s `adoptHighlighted`
// builds the highlighted `<pre>` with `document.createElement`/`.textContent` only, and
// `codeView.ts` has no `innerHTML` at all. So the standing lesson (a control routed through
// `sanitize()` can read NO-FETCH while the real route is wide open, because DOMPurify's own
// inert `DOMParser` pass consumes an eagerly-loaded resource in Firefox and the later adoption
// is never retried) applies with FULL force here: the control below is adopted from markup NO
// SANITIZER HAS EVER TOUCHED — hand-written, parsed into an inert `<template>`, never a
// "detached" div (`mount.ts:120-127`'s own leak, and the Firefox `@import` lesson).
//
// ══ THE INSTRUMENT IS REUSED VERBATIM, NOT REINVENTED ════════════════════════════════════════
//
// The `/^https?:/i` predicate and the await-not-sample shape are `remoteMedia.browser.test.ts`'s
// (`:83-92`, `:120`), the same instrument `tableNetwork.browser.test.ts`'s row-22 file already
// carries forward for table actions. Nothing about the code-block path calls for a new one.
//
// ══ ★ THE HARNESS-ONLY WARM-UP, NAMED HONESTLY RATHER THAN HIDDEN ════════════════════════════
//
// In the PRODUCT, `import('shiki/core')` and the curated language/theme chunks resolve to
// `chrome-extension://`/`moz-extension://` URLs inside the signed package — `/^https?:/i`
// excludes them by scheme, same as `diagramWindow.ts`'s own documented limit for `import(
// 'mermaid')`. In THIS harness the Vitest dev server serves the same chunks over
// `http://localhost`, so a COLD engine-load would fill the buffer with dev-server module URLs
// that are same-origin harness traffic, not a product leak. `warmEngine()` below drives one
// throwaway `enhanceCode` pass — the exact language (`javascript`) and theme (the default, the
// Peekover theme since 013 5.8 — built inline in codeEngine.ts, so it has no chunk of its own) the
// measured fixture uses — before any probe is armed, so the later,
// MEASURED engine-load is a module-cache hit. This is a harness limitation compensated for
// honestly, not a scope narrowed to hide a real gap: the measured fixture below still drives the
// full production `enhanceCode` call, unstubbed.
//
// ══ WHAT IS MEASURED, AND WHAT IS DELIBERATELY A DIRECT DOM SET ══════════════════════════════
//
// The app page's own gesture chain: open the folder, click the file, let `codeEnhancer.ts`'s
// synchronous prologue and async body run for real (engine-load → tokenize → theme-select, one
// settle), then a real trusted click on the toolbar's copy button (D-7). Task 6.1 (D-10's
// collapse UI) has not landed yet, so — per tasks.md 4.4's own text — the COLLAPSE stage is
// exercised by pre-building the collapsed state directly: `codeView.ts`'s module header names
// the decided shape (a per-block `data-code-state` attribute, `"collapsed"`/`"expanded"`,
// mirroring `readerMode.ts`'s flip-an-attribute pattern) and this file sets that attribute by
// hand, under the same armed probe, rather than driving a control that does not exist.

import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import { registerUiFonts } from '../../src/theme/uiFonts';
// 5.8: read the zero only after a later request has landed (helpers/diagramWindow.ts).
import { isSentinel, wireSettled } from './helpers/diagramWindow';
import { userEvent, cdp } from 'vitest/browser';
import { mountAppShell, type AppStore } from '../../src/app/appShell';
import type { FolderSource, MarkdownFile } from '../../src/app/folderSource';
import { mount } from '../../src/render/mount';
import { enhanceCode } from '../../src/render/codeEnhancer';
import { resetDocIdentityForTest } from '../../src/render/docIdentity';
import { resetWatchRegistryForTest } from '../../src/watch/watchRegistry';
import { resetWatchControlsForTest } from '../../src/watch/watchControl';
import { resetThemeHostsForTest } from '../../src/theme/themeRegistry';
import { resetThemeControlsForTest } from '../../src/theme/themeControl';
import { resetDiffRegistryForTest } from '../../src/render/diffRegistry';
import { CODE_STATE_ATTR, CODE_WRAPPER_CLASS, CODE_COPY_CLASS, CODE_STATUS_CLASS } from '../../src/render/codeView';

// ── Fixtures ──────────────────────────────────────────────────────────────────────────────────

const fence = (lang: string, body: string): string => '```' + lang + '\n' + body + '\n```\n';

/** One `javascript` fence — the only language this file needs; the point is the PIPELINE, not
 *  language breadth (that is `codeEngine.ts`'s own curated-catalog scope, untouched here). */
const DOC =
  '# Doc\n\nIntro paragraph.\n\n' +
  fence('javascript', 'function add(a, b) {\n  return a + b;\n}') +
  '\nTrailing prose, below the block.\n';

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

async function waitFor<T>(fn: () => T | null | undefined | false, tries = 400): Promise<T> {
  for (let i = 0; i < tries; i += 1) {
    const v = fn();
    if (v) return v as T;
    await sleep(20);
  }
  throw new Error('waitFor timed out');
}

/** Every code wrapper in `shadow` has left `pending` — `rendered` and `failed` both count, a
 *  document stuck `pending` forever is one whose enhancement never settled. */
async function allSettled(shadow: ShadowRoot, tries = 400): Promise<void> {
  for (let i = 0; i < tries; i += 1) {
    const wrappers = [...shadow.querySelectorAll<HTMLElement>(`.${CODE_WRAPPER_CLASS}`)];
    if (wrappers.length > 0 && wrappers.every((w) => w.getAttribute(CODE_STATE_ATTR) !== 'pending')) {
      return;
    }
    await sleep(25);
  }
  throw new Error('code fence never left the pending state');
}

// ── The instrument — `remoteMedia:83-92`, `:120`, `:140`, VERBATIM in predicate and in shape ───

let seq = 0;
const nextToken = (): string => `codenet-${(seq += 1)}-${Math.trunc(performance.now())}`;

/** ★ THE VERBATIM PREDICATE, over the WHOLE buffer — a leak to ANY host lands in this reading. */
function networkedUrls(): string[] {
  return performance
    .getEntriesByType('resource')
    .map((e) => e.name)
    .filter((name) => /^https?:/i.test(name) && !isSentinel(name));
}

function probeUrls(token: string): string[] {
  return performance
    .getEntriesByType('resource')
    .map((e) => e.name)
    .filter((name) => name.includes(`/__peekover_code_probe__/${token}/`));
}

function probeUrl(token: string, leaf: string): string {
  return new URL(`/__peekover_code_probe__/${token}/${leaf}`, location.origin).href;
}

/** A macrotask + rAF + settle — long enough for a fired request to reach the Resource Timing
 *  buffer (`remoteMedia:140`'s own window). Sound for a ZERO claim in only this direction. */
function flush(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => requestAnimationFrame(() => setTimeout(resolve, 60)), 120);
  });
}

const CONTROL_BUDGET_MS = 5000;
/** AWAIT a request that should fire, never sample for it (retro finding 1). */
async function awaitFetchedUrls(token: string, expected: string[]): Promise<string[]> {
  const deadline = performance.now() + CONTROL_BUDGET_MS;
  let seen = probeUrls(token);
  while (!expected.every((u) => seen.includes(u)) && performance.now() < deadline) {
    await sleep(25);
    seen = probeUrls(token);
  }
  return seen;
}

/** Cumulative — the buffer is never cleared between steps, so a late-recorded entry from step N
 *  can never be thrown away before step N+1 reads (`tableNetwork.browser.test.ts`'s own reason). */
async function assertNoNetwork(label: string): Promise<void> {
  await flush();
  expect(networkedUrls(), `the code pipeline's "${label}" step put bytes on the wire`).toEqual([]);
}

// ── ★ ARMING THE PROBE — both lanes, in the SAME test body as the zeros they license ──────────

const adopted: Element[] = [];

/** LANE 1 — a bare `fetch()`. Proves this engine's buffer records a request at all. */
async function armFetchLane(): Promise<void> {
  const token = nextToken();
  const url = probeUrl(token, 'control.txt');
  await fetch(url).catch(() => undefined);
  const seen = await awaitFetchedUrls(token, [url]);
  expect(seen, 'CONTROL (fetch lane): the buffer must see a real request — else it is blind').toContain(
    url,
  );
  expect(networkedUrls(), 'CONTROL (fetch lane): the verbatim predicate must ALSO see it').toContain(url);
}

/**
 * LANE 2 — the SUBRESOURCE lane, on markup NO SANITIZER HAS TOUCHED (D-4's own force, module
 * header). Step 1 parses hand-written `<img src>` into a `<template>`'s inert `.content` and
 * asserts ZERO. Step 2 adopts the SAME nodes into the live document and asserts the request DOES
 * fire — same bytes, same URL, so neither reading can be explained away.
 */
async function armSubresourceLane(): Promise<void> {
  const token = nextToken();
  const url = probeUrl(token, 'control.png');

  const tpl = document.createElement('template');
  tpl.innerHTML = `<img src="${url}" alt="">`;
  expect(
    tpl.content.querySelector('img')?.getAttribute('src'),
    'the probe markup did not survive the inert parse — this control would measure nothing',
  ).toBe(url);
  await flush();
  expect(probeUrls(token), 'the inert <template> parse dispatched a request').toEqual([]);

  const node = document.importNode(tpl.content, true);
  const img = node.querySelector('img')!;
  document.body.appendChild(node);
  adopted.push(img);
  const seen = await awaitFetchedUrls(token, [url]);
  expect(
    seen,
    'CONTROL (subresource lane): adopted markup must fetch — else this probe cannot see a leak',
  ).toContain(url);
  expect(networkedUrls(), 'CONTROL (subresource lane): the verbatim predicate must ALSO see it').toContain(
    url,
  );
}

async function armTheProbe(): Promise<void> {
  performance.clearResourceTimings();
  await armFetchLane();
  await armSubresourceLane();
  for (const el of adopted.splice(0)) el.remove();
  performance.clearResourceTimings();
}

// ── The harness-only warm-up (module header) ────────────────────────────────────────────────────

/**
 * Drive one throwaway `enhanceCode` pass — same language, same (provisional-default) theme the
 * measured fixture uses — so the dev server's own chunk URLs are a module-cache hit by the time
 * the probe is armed. Warms `shiki/core` and the `javascript` language chunk (the default
 * theme, Peekover, is inline — no theme chunk since 013 5.8). See the module header's "harness-only warm-up" section for why this is honest
 * rather than scope-narrowing: the measured fixture below still drives the real `enhanceCode`.
 */
async function warmEngine(): Promise<void> {
  performance.clearResourceTimings();
  const host = document.createElement('div');
  document.body.appendChild(host);
  mount(fence('javascript', 'const warm = true;'), host, { contained: true });
  enhanceCode(host);
  if (!host.shadowRoot) throw new Error('warm-up produced no shadow root');
  await allSettled(host.shadowRoot);
  host.remove();
  performance.clearResourceTimings();
}

// 013 task 2.4: the app shell now registers the design faces (src/theme/uiFonts.ts). In this
// harness their package URLs are same-origin dev-server fetches (http://localhost…); shipped, they are
// chrome-extension:// / moz-extension:// URLs this file's predicate excludes by scheme. They are
// loaded once here, before any measured window, so the shell's own call is the idempotent no-op it
// is built to be and this file keeps measuring its own feature. The faces' own zero-network proof:
// tests/browser/uiFontsNetwork.browser.test.ts.
beforeAll(async () => {
  await registerUiFonts();
});

beforeAll(async () => {
  await warmEngine();
}, 60_000);

// ── The app-page harness (the production gesture chain — never a direct `enhanceCode` call) ────

const containers: HTMLElement[] = [];

function fakeStore(): AppStore {
  return {
    putFolder: async () => undefined,
    deleteFolder: async () => undefined,
    putRecent: async () => undefined,
  };
}

function sourceOf(files: MarkdownFile[]): FolderSource {
  return { name: 'notes', files, truncated: false, persistable: true };
}

function resetAppShellRegistries(): void {
  resetDocIdentityForTest();
  resetWatchRegistryForTest();
  resetWatchControlsForTest();
  resetThemeHostsForTest();
  resetThemeControlsForTest();
  resetDiffRegistryForTest();
}

async function openDoc(doc: string): Promise<ShadowRoot> {
  resetAppShellRegistries();
  const container = document.createElement('div');
  document.body.appendChild(container);
  containers.push(container);
  const app = mountAppShell(container, {
    openFolder: async () => ({
      ok: true,
      source: sourceOf([{ path: 'doc.md', name: 'doc.md', read: async () => doc }]),
    }),
    store: fakeStore(),
  });
  await app.openFolder();
  const btn = [
    ...container.querySelectorAll<HTMLButtonElement>('[role="treeitem"][data-kind="file"]'),
  ].find((b) => b.textContent === 'doc.md');
  if (!btn) throw new Error('expected the file tree entry');
  btn.click();
  const host = await waitFor(() => container.querySelector<HTMLElement>('.peekover-app__reader__host'));
  if (!host.shadowRoot) throw new Error('reader pane produced no mounted host');
  await waitFor(() => host.shadowRoot!.querySelector('.peekover-reader h1'));
  return host.shadowRoot;
}

/** A real, trusted click + the copy's own settle — the confirmation text IS the non-vacuity
 *  (`tableNetwork.browser.test.ts`'s reasoning): it can only be produced by a resolved write. */
async function copyAndSettle(shadow: ShadowRoot): Promise<string> {
  const button = shadow.querySelector<HTMLButtonElement>(`.${CODE_COPY_CLASS}`);
  const status = shadow.querySelector<HTMLElement>(`.${CODE_STATUS_CLASS}`);
  if (!button || !status) throw new Error('expected the copy control and its live region');
  status.textContent = '';
  await userEvent.click(button);
  return waitFor(() => status.textContent || null);
}

/**
 * D-10's decided collapse shape, set directly (module header) — 6.1 has not landed the control.
 * `codeView.ts`'s own module header names the literal: a per-block `data-code-state` attribute,
 * `"collapsed"`/`"expanded"`, mirroring `readerMode.ts`'s flip-an-attribute pattern.
 */
function preBuildCollapsedState(shadow: ShadowRoot): void {
  const wrapper = shadow.querySelector<HTMLElement>(`.${CODE_WRAPPER_CLASS}`);
  if (!wrapper) throw new Error('expected an enhanced code wrapper');
  wrapper.setAttribute('data-code-state', 'collapsed');
}

// ── The engines' clipboard consent (`tableNetwork.browser.test.ts:421-471`'s shape) ────────────
//
// The copy stage must actually SUCCEED — a refused write is a shorter path, and a zero measured
// over a refusal would be a zero over less than the copy. Chromium's consent is granted over CDP
// (a BROWSER consent, not a manifest permission — D-10's own finding, `codeToolbar.browser.
// test.ts`'s real-clipboard section). Firefox has no `clipboard-write` `PermissionName`: the
// gesture is the entire gate, so there is nothing to grant and nothing to reset.

let grantedContextId: string | undefined;
let consentGranted = false;

async function clipboardWriteConsent(): Promise<PermissionState | 'unsupported'> {
  try {
    const status = await navigator.permissions.query({ name: 'clipboard-write' as PermissionName });
    return status.state;
  } catch {
    return 'unsupported';
  }
}

async function ownContextId(): Promise<string | undefined> {
  const info = (await cdp().send('Target.getTargetInfo', {} as never)) as {
    targetInfo?: { browserContextId?: string };
  };
  return info?.targetInfo?.browserContextId;
}

async function grantClipboardConsent(): Promise<void> {
  grantedContextId = await ownContextId();
  consentGranted = true;
  await cdp().send('Browser.grantPermissions', {
    origin: location.origin,
    browserContextId: grantedContextId,
    permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite'],
  } as never);
}

// ── Lifecycle ────────────────────────────────────────────────────────────────────────────────

function reset(): void {
  resetAppShellRegistries();
  for (const el of adopted.splice(0)) el.remove();
  for (const c of containers.splice(0)) c.remove();
  document.body.replaceChildren();
}

beforeEach(async () => {
  reset();
  if ((await clipboardWriteConsent()) === 'unsupported') return;
  await grantClipboardConsent();
});

afterEach(async () => {
  reset();
  if (!consentGranted) return;
  consentGranted = false;
  await cdp().send('Browser.resetPermissions', { browserContextId: grantedContextId } as never);
  expect(await clipboardWriteConsent(), 'the granted consent outlived this file').toBe('prompt');
});

// ══ THE SEQUENCE — ENGINE-LOAD/TOKENIZE/THEME-SELECT → COPY → COLLAPSE, ONE ARMED WINDOW ═══════

describe('4.4 · row 22 — the code-block pipeline puts NOTHING on the wire', () => {
  it(
    'engine-load, tokenize, theme-select, copy and collapse: ZERO requests against an ARMED probe',
    async () => {
      // ★ ARM FIRST, IN THIS TEST'S OWN BODY — both lanes, so every zero below is measured against
      // an instrument JUST shown to record requests in THIS engine, in THIS run.
      await armTheProbe();

      // ── ENGINE-LOAD + TOKENIZE + THEME-SELECT ──────────────────────────────────────────────
      // One settle: `codeEnhancer.ts`'s async body loads the engine, resolves the language and
      // theme, and tokenizes in a single pass — there is no separate production hook per stage.
      const shadow = await openDoc(DOC);
      await allSettled(shadow);
      const wrapper = shadow.querySelector<HTMLElement>(`.${CODE_WRAPPER_CLASS}`);
      expect(
        wrapper?.getAttribute(CODE_STATE_ATTR),
        'the fence never reached a terminal state — this window would measure a broken path',
      ).toBe('rendered');
      await assertNoNetwork('engine-load + tokenize + theme-select');

      // ── COPY ──────────────────────────────────────────────────────────────────────────────
      const announced = await copyAndSettle(shadow);
      expect(
        announced,
        'the copy did not complete — a zero over a refused write measures less than the copy',
      ).toBe('Code block 1 copied.');
      await assertNoNetwork('copy');

      // ── COLLAPSE (pre-built directly — 6.1 has not landed the control) ──────────────────────
      preBuildCollapsedState(shadow);
      await wireSettled();
      await assertNoNetwork('collapse');

      // ★ AND THE PROBE IS STILL LIVE — without this, a probe gone blind mid-run would report a
      // clean zero indistinguishable from quiet controls.
      await armFetchLane();
      await armSubresourceLane();
    },
    60_000,
  );
});

// ══ EACH STAGE AGAINST ITS OWN FRESHLY ARMED PROBE ═══════════════════════════════════════════
//
// The sequence above measures the pipeline against ONE arming, which is row 22's claim as
// written. This narrows it: the probe is RE-ARMED immediately before EACH TRIGGERING ACTION —
// including the document open itself for the engine-load leg, since `enhanceCode`'s async body
// starts (off-stack) the instant the fence is committed (D-5). Arming after `openDoc` would arm
// too late to cover engine-load at all; every leg below arms first, then acts.

describe('4.4 · row 22 — every stage, each measured against a probe armed just before it', () => {
  it(
    'three stages, three armings: every one reads ZERO',
    async () => {
      // ENGINE-LOAD + TOKENIZE + THEME-SELECT — armed BEFORE the triggering open, not after.
      await armTheProbe();
      const shadow = await openDoc(DOC);
      await allSettled(shadow);
      const wrapper = shadow.querySelector<HTMLElement>(`.${CODE_WRAPPER_CLASS}`);
      expect(
        wrapper?.getAttribute(CODE_STATE_ATTR),
        'the fence never reached a terminal state — this leg would measure a broken path',
      ).toBe('rendered');
      await wireSettled();
      await assertNoNetwork('engine-load + tokenize + theme-select');

      // COPY — armed fresh, moments before the click.
      await armTheProbe();
      expect(await copyAndSettle(shadow)).toBe('Code block 1 copied.');
      await wireSettled();
      await assertNoNetwork('copy');

      // COLLAPSE — armed fresh, moments before the direct attribute set.
      await armTheProbe();
      preBuildCollapsedState(shadow);
      await wireSettled();
      await assertNoNetwork('collapse');

      // The probe outlived every leg.
      await armFetchLane();
      await armSubresourceLane();
    },
    60_000,
  );
});

// ══ 013 task 5.11 — THE SEVEN NEW GRAMMARS, ON DEMAND, AND THE ALIASES ═════════════════════════
//
// The same instrument, armed in each test's own body. Two claims. (1) Each new language, the FIRST
// time a fence needs it, fetches ITS OWN grammar module and no other — read off the same-origin
// Resource Timing buffer, where this harness's dev server records each grammar as
// `shiki_langs_<name>__mjs.js` (shipped: `chunks/<name>-<hash>.js` inside the package, excluded from
// the off-origin predicate by its extension scheme). Seeing that one request IS the firing control:
// a buffer blind to module loads would read an empty list, not the language's own name. (2) Every
// new language and every alias, together, puts nothing on the wire. These run after the 4.4 blocks
// and before anything else loads the new grammars, so each module load here is cold.

const NEW_GRAMMARS: [string, string][] = [
  ['typescript', 'interface Doc { size: number }'],
  ['tsx', 'const el = <Note title="x">hi</Note>;'],
  ['diff', '-old line\n+new line'],
  ['yaml', 'name: peekover'],
  ['markdown', '# Heading'],
  ['toml', 'name = "peekover"'],
  ['sql', 'SELECT name FROM docs;'],
];
const ALIAS_FENCES: [string, string][] = [
  ['ts', 'const n: number = 1;'],
  ['js', 'const n = 42;'],
  ['mjs', 'const n = 42;'],
  ['cjs', 'const n = 42;'],
  ['sh', 'echo hi'],
  ['shell', 'echo hi'],
  ['zsh', 'echo hi'],
  ['py', 'def f(): pass'],
  ['yml', 'a: 1'],
  ['md', '# h'],
];

/** The grammar modules in the buffer, by language name (dev-server and packaged spellings both). */
function grammarModulesFetched(): string[] {
  return performance
    .getEntriesByType('resource')
    .map((e) => /shiki_langs_([a-z]+)__mjs|\/langs\/([a-z]+)\.mjs|\/chunks\/([a-z]+)-[\w-]+\.js$/.exec(e.name))
    .filter((m): m is RegExpExecArray => m !== null)
    .map((m) => m[1] ?? m[2] ?? m[3]);
}

async function renderedFences(shadow: ShadowRoot, count: number): Promise<void> {
  await allSettled(shadow);
  const states = [...shadow.querySelectorAll<HTMLElement>(`.${CODE_WRAPPER_CLASS}`)].map((w) => w.getAttribute(CODE_STATE_ATTR));
  expect(states, 'every fence highlighted — a window over a failed fence measures less').toEqual(Array(count).fill('rendered'));
}

describe('5.11 — each new grammar loads on demand: its own module only, and nothing on the wire', () => {
  it(
    'typescript, tsx, diff, yaml, markdown, toml, sql — one at a time, each against a freshly armed probe',
    async () => {
      for (const [lang, body] of NEW_GRAMMARS) {
        await armTheProbe();
        const shadow = await openDoc(`# ${lang}\n\n` + fence(lang, body));
        await renderedFences(shadow, 1);
        await wireSettled();
        expect(grammarModulesFetched(), `${lang}: the grammar modules this fence fetched`).toEqual([lang]);
        // A COLD load is the one place this harness's own module traffic reaches the http(s)
        // predicate (the module header's warm-up section): the dev server serves the grammar over
        // http://localhost. So the claim here is exact — the only request is this language's own
        // grammar module, from this page's own origin; anything else, anywhere, is a red.
        await flush();
        const ownModule = (u: string): boolean => new URL(u).origin === location.origin && new RegExp(`shiki_langs_${lang}__mjs`).test(u);
        expect(networkedUrls().filter((u) => !ownModule(u)), `${lang}: a request other than its own grammar module`).toEqual([]);
        reset();
      }
      await armFetchLane();
      await armSubresourceLane();
    },
    90_000,
  );

  it(
    'every new language and every alias in one document: no new grammar module, nothing on the wire',
    async () => {
      // Warm, unmeasured: every grammar the aliases name (python and bash are not warmed above), so
      // the measured window below is a module-cache hit throughout — the harness-only warm-up shape.
      const warm = await openDoc('# Warm\n\n' + fence('python', 'pass') + '\n' + fence('bash', 'echo') + '\n' + NEW_GRAMMARS.map(([l, b]) => fence(l, b)).join('\n'));
      await renderedFences(warm, NEW_GRAMMARS.length + 2);
      reset();

      await armTheProbe();
      const fences = [...NEW_GRAMMARS, ...ALIAS_FENCES];
      const shadow = await openDoc('# All\n\n' + fences.map(([l, b]) => fence(l, b)).join('\n'));
      await renderedFences(shadow, fences.length);
      await wireSettled();
      // Every grammar these fences need is already loaded (above, or by the 4.4 blocks and the
      // warm-up), so an alias that fetched a module of its own would show here.
      expect(grammarModulesFetched(), 'an alias or a reload fetched a grammar module').toEqual([]);
      await assertNoNetwork('all new languages and aliases');
      await armFetchLane();
      await armSubresourceLane();
    },
    90_000,
  );
});

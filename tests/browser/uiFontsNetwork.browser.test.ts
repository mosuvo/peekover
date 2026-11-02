// ZERO NETWORK FOR THE DESIGN FACES (013 task 2.4; plan D-2; AGENTS.md #1).
//
// Content-script reader: NO font request at all — it registers no UI face (Literata is inline,
// `data:`). App page: the five faces load from the package and NOTHING leaves the origin.
//
// ★ WHAT "ZERO" MEANS IN THIS HARNESS (mathNetwork.browser.test.ts's header, the precedent). Here
// the bundled woff2 files are Vite dev-server URLs off `location.origin` — real, same-origin HTTP
// fetches. In the shipped extension they are `chrome-extension://` / `moz-extension://` package URLs
// that the `/^https?:/i` predicate excludes by scheme. So the app-page claim is the OFF-ORIGIN one:
// nothing contacts a host outside this origin. The content-script claim is stricter: no font
// request of any origin.
//
// ★ EVERY ZERO IS READ AFTER `wireSettled()` (helpers/diagramWindow.ts; M12 task 5.8): Resource
// Timing records a request when it ENDS, so an early zero is blind to a slow leak. Each claim has a
// firing control through the same seam a regression would use — a live `FontFace` with an
// off-origin source — and a SLOW case: a SERVED font (the real Bricolage file, fetched off-origin on
// the loopback) injected after a delay, inside the window, which must still be seen once the wire
// has settled. Nothing here names a non-loopback host.
//
// Order: the content-script block runs FIRST, with the precondition that no UI face is registered
// yet (uiFonts.browser.test.ts's header explains why the font set makes this load-bearing).

import { describe, it, expect, afterEach } from 'vitest';
import { isSentinel, offOriginProbeUrl, wireSettled } from './helpers/diagramWindow';
import { runReader, removeHideStyle } from '../../src/render/runReader';
import { mountAppShell, type AppStore } from '../../src/app/appShell';
import type { FolderSource, MarkdownFile } from '../../src/app/folderSource';
import { UI_FONT_FACES, UI_MONO_FAMILY, UI_SANS_FAMILY } from '../../src/theme/uiFonts';
import { resetThemeHostsForTest } from '../../src/theme/themeRegistry';
import { resetThemeControlsForTest } from '../../src/theme/themeControl';

const DOC = '# Fonts\n\nReading text.\n\n```js\nconst answer = 42;\n```\n';
const FONT_URL = /\.(woff2?|ttf|otf)(\?|#|$)/i;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function waitFor<T>(fn: () => T | null | undefined | false, tries = 300): Promise<T> {
  for (let i = 0; i < tries; i += 1) {
    const v = fn();
    if (v) return v as T;
    await sleep(20);
  }
  throw new Error('waitFor timed out');
}

/** Every http(s) Resource Timing entry, sentinel excluded — the predicate every guard shares. */
const networkedUrls = (): string[] =>
  performance
    .getEntriesByType('resource')
    .map((e) => e.name)
    .filter((n) => /^https?:/i.test(n) && !isSentinel(n));
const isOffOrigin = (n: string): boolean => !n.startsWith(`${location.origin}/`);
const fontRequests = (): string[] => networkedUrls().filter((n) => FONT_URL.test(n));
const facesOf = (family: string): FontFace[] =>
  [...document.fonts].filter((f) => f.family.replace(/^["']|["']$/g, '') === family);

let probeSeq = 0;
/** Inject a FontFace whose source is off-origin (on the loopback), after `delayMs`. */
function injectOffOriginFont(path: string, delayMs: number): { url: string; face: Promise<FontFace> } {
  probeSeq += 1;
  const url = offOriginProbeUrl(`${path}?probe=${probeSeq}-${Math.trunc(performance.now())}`);
  const face = new Promise<FontFace>((resolve) => {
    setTimeout(() => {
      const ff = new FontFace(`Peekover UI Network Probe ${probeSeq}`, `url(${url}) format('woff2')`);
      document.fonts.add(ff);
      ff.load().catch(() => undefined);
      resolve(ff);
    }, delayMs);
  });
  return { url, face };
}

const hosts: HTMLElement[] = [];
const containers: HTMLElement[] = [];
const probes: Promise<FontFace>[] = [];

function openContentScript(doc = DOC): ShadowRoot {
  const pre = document.createElement('pre');
  pre.textContent = doc;
  document.body.appendChild(pre);
  runReader({ isRenderable: () => true });
  const host = document.querySelector<HTMLElement>('peekover-root')!;
  hosts.push(host);
  return host.shadowRoot!;
}

function fakeStore(): AppStore {
  return { putFolder: async () => undefined, deleteFolder: async () => undefined, putRecent: async () => undefined };
}

async function openAppPage(doc = DOC): Promise<ShadowRoot> {
  const files: MarkdownFile[] = [{ path: 'fonts.md', name: 'fonts.md', read: async () => doc }];
  const source: FolderSource = { name: 'notes', files, truncated: false, persistable: true };
  const container = document.createElement('div');
  document.body.appendChild(container);
  containers.push(container);
  const app = mountAppShell(container, { openFolder: async () => ({ ok: true, source }), store: fakeStore() });
  await app.openFolder();
  const btn = await waitFor(() =>
    [...container.querySelectorAll<HTMLButtonElement>('[role="treeitem"][data-kind="file"]')].find(
      (b) => b.textContent === 'fonts.md',
    ),
  );
  btn.click();
  const host = await waitFor(() => container.querySelector<HTMLElement>('.peekover-app__reader__host'));
  return waitFor(() => (host.shadowRoot?.querySelector('.peekover-reader pre') ? host.shadowRoot : null));
}

afterEach(async () => {
  for (const p of probes.splice(0)) document.fonts.delete(await p);
  removeHideStyle();
  resetThemeHostsForTest();
  resetThemeControlsForTest();
  for (const h of hosts.splice(0)) h.remove();
  for (const c of containers.splice(0)) c.remove();
  document.querySelectorAll('peekover-root').forEach((el) => el.remove());
  document.body.replaceChildren();
});

/** The served Bricolage file's own path — the slow case fetches it from the off-origin loopback. */
const servedFontPath = (): string => new URL(UI_FONT_FACES[0].url, location.href).pathname;

describe('content-script reader — no font request (runs FIRST)', () => {
  it('★ renders with zero font requests of any origin, read after the wire settles', async () => {
    expect(facesOf(UI_SANS_FAMILY).length + facesOf(UI_MONO_FAMILY).length, 'precondition: a UI face is already registered').toBe(0);
    performance.clearResourceTimings();
    const root = openContentScript();
    await waitFor(() => root.querySelector('.peekover-reader pre'));
    await document.fonts.ready;
    await wireSettled();
    expect(fontRequests(), 'the content-script reader requested a font file').toEqual([]);
    expect(facesOf(UI_SANS_FAMILY).length + facesOf(UI_MONO_FAMILY).length, 'the content script registered a UI face').toBe(0);
  }, 30_000);

  it('FIRING CONTROL + SLOW CASE — the same reading sees a font request, even a late one', async () => {
    performance.clearResourceTimings();
    const root = openContentScript();
    await waitFor(() => root.querySelector('.peekover-reader pre'));
    const fast = injectOffOriginFont('/__peekover_probe__/ui-fonts-cs/fast.woff2', 0);
    const slow = injectOffOriginFont(servedFontPath(), 400);
    probes.push(fast.face, slow.face);
    await slow.face; // issued late, inside the window
    await wireSettled();
    expect(fontRequests(), 'the firing control did not fire — the zero above would be unfalsifiable').toContain(fast.url);
    expect(fontRequests(), 'the SLOW served font was not seen after settle — the zero above is blind to a slow leak').toContain(slow.url);
  }, 30_000);
});

describe('app page — the faces load from the package; nothing off-origin', () => {
  it('★ mount + register + load the five faces: zero off-origin requests, read after the wire settles', async () => {
    performance.clearResourceTimings();
    await openAppPage();
    const ours = [...facesOf(UI_SANS_FAMILY), ...facesOf(UI_MONO_FAMILY)];
    expect(ours, 'the app page registered the five UI faces').toHaveLength(UI_FONT_FACES.length);
    await Promise.all(ours.map((f) => f.loaded.catch(() => undefined)));
    await wireSettled();
    // ★ The claim runs first (AGENTS.md: the instrument that would find the defect leads), so a
    // remote face fails here, naming its URL, before the load-status check below can swallow it.
    const seen = networkedUrls();
    expect(seen.filter(isOffOrigin), 'the app page put an OFF-ORIGIN request on the wire — AGENTS.md #1').toEqual([]);
    expect(ours.map((f) => f.status), 'every UI face LOADED — its bytes arrived').toEqual(ours.map(() => 'loaded'));
  }, 30_000);

  it('FIRING CONTROL + SLOW CASE — the off-origin reading sees a font request, even a late one', async () => {
    await openAppPage();
    performance.clearResourceTimings();
    const fast = injectOffOriginFont('/__peekover_probe__/ui-fonts-app/fast.woff2', 0);
    const slow = injectOffOriginFont(servedFontPath(), 400);
    probes.push(fast.face, slow.face);
    await slow.face;
    await wireSettled();
    const off = networkedUrls().filter(isOffOrigin);
    expect(off, 'the firing control did not fire').toContain(fast.url);
    expect(off, 'the SLOW served font was not seen after settle').toContain(slow.url);
  }, 30_000);
});

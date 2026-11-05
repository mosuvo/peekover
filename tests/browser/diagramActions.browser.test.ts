// The per-diagram control group (007 task 7.1, §3.11) in a REAL ENGINE, Chromium AND Firefox.
//
// ── WHY EVERY ASSERTION HERE IS ABOUT A PRODUCT, NOT ABOUT A BUTTON ──────────────────────────
//
// This is the milestone's first affordance task, and its defect shape is NOT the one groups 5-6
// trained. Nothing here breaks under an injected fault; what breaks is a control that is present,
// focusable, clickable and DOES THE WRONG THING — copies the wrong diagram, downloads the previous
// theme's picture, writes an empty blob, names the file after nothing. A test that asserts "a copy
// button exists and clicking it did not throw" passes on every one of those, so it is worth
// nothing. Each case below therefore captures what the click PRODUCED — the ClipboardItem, the
// blob and the suggested filename — and asserts against the artifact on screen.
//
// ── WHY THIS CANNOT BE A UNIT TEST ───────────────────────────────────────────────────────────
//
// Four of the properties are jsdom-blind by construction:
//
//   • THE RASTER. Copy-as-image is `<img>` decode -> canvas -> `toBlob`. jsdom decodes no image
//     and rasterizes nothing, so the copied bytes cannot exist there at all.
//   • THE GEOMETRY (rows 5, 11). Whether the group anchors to its own figure and clears the
//     column's text at a WIDE viewport is a layout question.
//   • THE REVEAL. `:hover` / `:focus-within` over a real stylesheet in a real shadow root.
//   • THE ARTIFACT ITSELF. The `<svg>` these actions serialize is real mermaid output that has
//     been through the §3.5 profile — not a payload we wrote.
//
// ── ★ THE COPIED BYTES ARE THE SANITIZED ARTIFACT, AND THAT IS PROVEN, NOT ASSERTED ──────────
//
// Both actions read the figure's LIVE `<svg>` — what the reader is showing, post-`sanitizeSvg`,
// post-`cleanSvgCss`. A path that reached back to the engine's raw pre-sanitize string would
// re-admit exactly the `<style>` and `<foreignObject>` the profile strips, which is a security
// regression wearing a feature's clothes. `probe()` below plants a marker INTO THE LIVE NODE and
// the product is required to carry it: a re-render, a cached raw string or a second copy taken at
// build time all fail that, because none of them can see a mutation made after adoption.
//
// ── THE CLIPBOARD AND THE DOWNLOAD ARE STUBBED ABOVE, AND UNSTUBBED IN THE 7.3 SECTION ───────
//
// Everything down to the CSS block captures the products at the browser globals —
// `navigator.clipboard.write` and the anchor's own click — because what it is testing is WHICH
// BYTES the control produced. The LAST section of this file is task 7.3, the other half: the
// recorders come off, the engine's own clipboard receives the write, the anchor's default action
// is allowed to stand, and both BUILT manifests are re-read from `.output/` for `permissions: []`.
// Nothing in production grew a seam for either; both are browser globals, stubbed from outside.

import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { page, userEvent, cdp } from 'vitest/browser';
import { mount } from '../../src/render/mount';
import {
  DIAGRAM_MEASURE_CLASS,
  DIAGRAM_THEME_ATTR,
  enhanceDiagrams,
  resetDiagramThemeForTest,
} from '../../src/render/diagramEnhancer';
import {
  DIAGRAM_ACTIONS_CLASS,
  DIAGRAM_ACTION_CLASS,
  DIAGRAM_ACTION_STATE_ATTR,
  DIAGRAM_COPY_ACTION,
  DIAGRAM_DOWNLOAD_ACTION,
  DIAGRAM_FIGURE_CLASS,
  DIAGRAM_STATE_ATTR,
  DIAGRAM_STATUS_CLASS,
} from '../../src/render/diagramView';
import { READER_CSS } from '../../src/theme/readerCss';
import { clearDiagramCache, __resetConnectionForTest } from '../../src/app/store';
import { setThemeSetting, resetThemeWatchForTest } from '../../src/theme/reader';
import {
  resetThemeHostsForTest,
  resetEffectiveThemeListenersForTest,
} from '../../src/theme/themeRegistry';
import { resetThemeControlsForTest } from '../../src/theme/themeControl';

const FIGURE_SELECTOR = `figure.${DIAGRAM_FIGURE_CLASS}`;
const PNG_MIME = 'image/png';
const SVG_MIME = 'image/svg+xml';

const NARROW = { width: 414, height: 896 }; // the harness default, restored after each test
const WIDE = { width: 1400, height: 900 }; // `diffChrome.browser.test.ts`'s own WIDE

// Distinct, unmistakable node labels. `htmlLabels:false` makes every label an SVG <text>, so these
// strings appear VERBATIM in the serialized artifact — which is what lets a product assertion name
// the diagram it actually came from instead of merely counting bytes.
const FENCE_ONE = '```mermaid\ngraph TD; Alpha-->Bravo;\n```';
const FENCE_TWO = '```mermaid\ngraph LR; Xray-->Yankee-->Zulu;\n```';

const docOf = (...fences: string[]): string =>
  '# Diagram actions\n\n' +
  'Paragraph before the diagram, long enough to occupy the reading column and give row 5 a real ' +
  'box of text for the floating control group to be caught overlapping.\n\n' +
  `${fences.join('\n\n')}\n\n` +
  'Paragraph after the diagram, likewise real text in the reading column.\n';

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const cleanup: HTMLElement[] = [];

// ── Capturing the two products ────────────────────────────────────────────────────────────────

/**
 * Replace `navigator.clipboard` with a recorder.
 *
 * An own, configurable property over the prototype's accessor, so `delete` restores the real one.
 * `write` is what production calls; `reject` flips it to the §4 failure path without touching a
 * line of production code — the clipboard is permission-gated in the real world and refusing is
 * exactly what it does when the permission is not there.
 */
function stubClipboard() {
  const written: ClipboardItem[][] = [];
  let reject = false;
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: {
      write: async (items: ClipboardItem[]): Promise<void> => {
        if (reject) throw new Error('clipboard write refused');
        written.push(items);
      },
    },
  });
  return {
    written,
    refuse(): void {
      reject = true;
    },
    restore(): void {
      Reflect.deleteProperty(navigator, 'clipboard');
    },
  };
}

interface CapturedDownload {
  readonly name: string;
  readonly url: string;
}

/**
 * Capture what `<a download>` was asked to save, and the Blob behind its `blob:` URL.
 *
 * The listener is CAPTURING on the document, so it runs before the anchor's default action and
 * `preventDefault()` stops a real file landing in the runner's download directory. Production
 * appends the anchor before clicking it (engines honour a detached `download` inconsistently),
 * which is what puts the event on this path at all.
 *
 * `createObjectURL` is wrapped rather than replaced: the raster path mints a `blob:` URL of its
 * own and must keep working, so the real implementation still runs and the wrapper only remembers
 * the Blob. Revocation does not invalidate the recorded object.
 */
function captureDownloads() {
  const downloads: CapturedDownload[] = [];
  const blobs = new Map<string, Blob>();
  const originalCreate = URL.createObjectURL.bind(URL);
  URL.createObjectURL = (obj: Blob | MediaSource): string => {
    const url = originalCreate(obj);
    if (obj instanceof Blob) blobs.set(url, obj);
    return url;
  };
  const onClick = (event: Event): void => {
    const target = event.target;
    if (!(target instanceof HTMLAnchorElement) || !target.hasAttribute('download')) return;
    event.preventDefault();
    downloads.push({ name: target.download, url: target.href });
  };
  document.addEventListener('click', onClick, true);
  return {
    downloads,
    blobOf(download: CapturedDownload): Blob {
      const blob = blobs.get(download.url);
      if (!blob) throw new Error(`no Blob was recorded for ${download.url}`);
      return blob;
    },
    restore(): void {
      document.removeEventListener('click', onClick, true);
      URL.createObjectURL = originalCreate;
    },
  };
}

let clipboard: ReturnType<typeof stubClipboard>;
let saves: ReturnType<typeof captureDownloads>;

// ── The surface ───────────────────────────────────────────────────────────────────────────────

/** mount + enhance — D-12's second call site, and the shape `diagramTheme.browser.test.ts` uses.
 *  No loader is injected: these cases run the PRODUCTION `import('mermaid')`, because the artifact
 *  the controls serialize has to be real engine output for any of this to mean anything. */
function enhancedHost(markdown: string): { host: HTMLElement; shadow: ShadowRoot } {
  const host = document.createElement('div');
  document.body.appendChild(host);
  cleanup.push(host);
  mount(markdown, host, { contained: true, preserveReading: true });
  enhanceDiagrams(host);
  if (!host.shadowRoot) throw new Error('expected a mounted host');
  return { host, shadow: host.shadowRoot };
}

/** §3.3's re-render: `mount()` commits with `replaceChildren`, so every figure, every button and
 *  every closure in the old tree dies and the enhancer rebuilds the lot. */
function remount(host: HTMLElement, markdown: string): ShadowRoot {
  mount(markdown, host, { contained: true, preserveReading: true });
  enhanceDiagrams(host);
  if (!host.shadowRoot) throw new Error('expected a re-mounted host');
  return host.shadowRoot;
}

async function settleDiagrams(shadow: ShadowRoot, tries = 600): Promise<void> {
  for (let i = 0; i < tries; i += 1) {
    if (shadow.querySelectorAll(`[${DIAGRAM_STATE_ATTR}="pending"]`).length === 0) return;
    await sleep(25);
  }
  throw new Error('enhancement never completed');
}

async function renderedFigures(shadow: ShadowRoot): Promise<HTMLElement[]> {
  await settleDiagrams(shadow);
  const figures = [
    ...shadow.querySelectorAll<HTMLElement>(`${FIGURE_SELECTOR}[${DIAGRAM_STATE_ATTR}="rendered"]`),
  ];
  if (figures.length === 0) throw new Error('no diagram reached `rendered`');
  return figures;
}

async function oneFigure(markdown = docOf(FENCE_ONE)): Promise<{
  host: HTMLElement;
  shadow: ShadowRoot;
  figure: HTMLElement;
}> {
  const { host, shadow } = enhancedHost(markdown);
  const [figure] = await renderedFigures(shadow);
  return { host, shadow, figure };
}

function actionIn(figure: HTMLElement, action: string): HTMLButtonElement {
  const button = figure.querySelector<HTMLButtonElement>(
    `.${DIAGRAM_ACTION_CLASS}[data-action="${action}"]`,
  );
  if (!button) throw new Error(`the ${action} control is not on this figure`);
  return button;
}

const groupIn = (figure: HTMLElement): HTMLElement =>
  figure.querySelector<HTMLElement>(`.${DIAGRAM_ACTIONS_CLASS}`)!;
const statusIn = (figure: HTMLElement): HTMLElement =>
  figure.querySelector<HTMLElement>(`.${DIAGRAM_STATUS_CLASS}`)!;
const svgIn = (figure: HTMLElement): SVGSVGElement => figure.querySelector('svg')!;

async function until<T>(fn: () => T | null | undefined | false, tries = 400): Promise<T> {
  for (let i = 0; i < tries; i += 1) {
    const v = fn();
    if (v) return v as T;
    await sleep(25);
  }
  throw new Error('until() timed out');
}

/**
 * ★ Plant a marker INSIDE the live, already-adopted `<svg>`.
 *
 * Nothing upstream can know about it: it is written after `sanitizeSvg` ran, after the inert parse,
 * after adoption. A product that carries it was serialized FROM THE NODE ON SCREEN. A product that
 * does not was re-derived from the source, re-rendered by the engine, or taken from a copy stashed
 * at build time — the three shapes §7.1 and AGENTS.md #3 rule out, and the three a presence-only
 * test cannot tell apart.
 */
function probe(svg: SVGSVGElement, text: string): void {
  const desc = svg.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'desc');
  desc.textContent = text;
  svg.appendChild(desc);
}

const rectOf = (el: Element): DOMRect => el.getBoundingClientRect();

const intersects = (a: DOMRect, b: DOMRect): boolean =>
  a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

function expectNoOverlap(name: string, a: DOMRect, other: string, b: DOMRect): void {
  const detail =
    `${name} [${Math.round(a.left)},${Math.round(a.top)},${Math.round(a.right)},${Math.round(a.bottom)}] ` +
    `vs ${other} [${Math.round(b.left)},${Math.round(b.top)},${Math.round(b.right)},${Math.round(b.bottom)}]`;
  expect(intersects(a, b), `overlap: ${detail}`).toBe(false);
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────────────────────

beforeEach(async () => {
  resetThemeHostsForTest();
  resetThemeControlsForTest();
  resetEffectiveThemeListenersForTest();
  resetDiagramThemeForTest();
  setThemeSetting('light'); // pins the cache key's theme component
  await clearDiagramCache(); // 4.3's rule: no prior test's cache may feed this one
  clipboard = stubClipboard();
  saves = captureDownloads();
});

afterEach(async () => {
  saves.restore();
  clipboard.restore();
  for (const el of cleanup.splice(0)) el.remove();
  // DRAIN — a render can still be in flight, and its measuring container lives in `document.body`.
  for (let i = 0; i < 400 && document.querySelector(`.${DIAGRAM_MEASURE_CLASS}`); i += 1) {
    await sleep(25);
  }
  await page.viewport(NARROW.width, NARROW.height);
  resetThemeHostsForTest();
  resetThemeControlsForTest();
  resetEffectiveThemeListenersForTest();
  resetDiagramThemeForTest();
  resetThemeWatchForTest();
  setThemeSetting('auto');
  await clearDiagramCache();
  __resetConnectionForTest();
  vi.restoreAllMocks();
});

// ── THE COPY CONTROL'S PRODUCT ────────────────────────────────────────────────────────────────

describe('copy-as-image — what lands on the clipboard', () => {
  it('writes ONE PNG of THIS diagram: nothing before the click, the artifact after', async () => {
    const { figure } = await oneFigure();
    const svg = svgIn(figure);

    // SUCCESS-vs-NOTHING. The recorder is empty until the control is used, so everything below is
    // caused by the click rather than by anything the harness did.
    expect(clipboard.written).toHaveLength(0);

    actionIn(figure, DIAGRAM_COPY_ACTION).click();
    await until(() => clipboard.written.length === 1);

    const items = clipboard.written[0];
    expect(items).toHaveLength(1);
    expect([...items[0].types]).toEqual([PNG_MIME]);

    const png = await items[0].getType(PNG_MIME);
    expect(png.type).toBe(PNG_MIME);
    expect(png.size).toBeGreaterThan(0);

    // It is a PNG because its first eight bytes say so, not because a MIME string was attached to
    // whatever the canvas returned.
    const head = [...new Uint8Array(await png.slice(0, 8).arrayBuffer())];
    expect(head).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

    // ★ AND IT IS A RASTER OF *THIS* FIGURE. Decoded, its pixel box is the box the reader is
    // showing — a copy of the wrong diagram, or of an unlaid-out one, lands on a different number.
    const bitmap = await createImageBitmap(png);
    const box = rectOf(svg);
    expect(bitmap.width).toBe(Math.round(box.width));
    expect(bitmap.height).toBe(Math.round(box.height));
    expect(bitmap.width).toBeGreaterThan(1);
  });

  it('copies the diagram the button BELONGS to, on a document with two', async () => {
    const { shadow } = enhancedHost(docOf(FENCE_ONE, FENCE_TWO));
    const figures = await renderedFigures(shadow);
    expect(figures).toHaveLength(2);

    // The two diagrams lay out to different boxes, which is what makes "which one was copied" an
    // observable rather than a hope. HEIGHT is the discriminator, not width: `max-width:100%`
    // clamps a wide diagram to the column, and on Firefox both of these land on the SAME width
    // (measured: 350 for both) while their heights stay far apart. A width-only comparison passed
    // on Chromium and was vacuous on Firefox — which is the whole reason both engines run.
    const boxes = figures.map((f) => rectOf(svgIn(f)));
    expect(Math.round(boxes[0].height)).not.toBe(Math.round(boxes[1].height));

    actionIn(figures[1], DIAGRAM_COPY_ACTION).click();
    await until(() => clipboard.written.length === 1);

    const png = await clipboard.written[0][0].getType(PNG_MIME);
    const bitmap = await createImageBitmap(png);
    expect(bitmap.height).toBe(Math.round(boxes[1].height));
    expect(bitmap.height).not.toBe(Math.round(boxes[0].height));
    expect(bitmap.width).toBe(Math.round(boxes[1].width));
  });
});

// ── THE DOWNLOAD CONTROL'S PRODUCT ────────────────────────────────────────────────────────────

describe('download-as-SVG — the blob and the filename', () => {
  it('saves the artifact as image/svg+xml under a per-diagram name', async () => {
    const { shadow } = enhancedHost(docOf(FENCE_ONE, FENCE_TWO));
    const figures = await renderedFigures(shadow);

    expect(saves.downloads).toHaveLength(0); // SUCCESS-vs-NOTHING

    actionIn(figures[0], DIAGRAM_DOWNLOAD_ACTION).click();
    await until(() => saves.downloads.length === 1);

    const [save] = saves.downloads;
    expect(save.name).toBe('diagram-1.svg');
    expect(save.url.startsWith('blob:')).toBe(true);

    const blob = saves.blobOf(save);
    expect(blob.type).toContain(SVG_MIME);
    const text = await blob.text();
    expect(text.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(text).toContain('<svg');
    expect(text).toContain('xmlns="http://www.w3.org/2000/svg"');
    // THE DIAGRAM'S OWN CONTENT — this is diagram 1 and not diagram 2.
    expect(text).toContain('Alpha');
    expect(text).toContain('Bravo');
    expect(text).not.toContain('Yankee');

    // And the SECOND control names the SECOND file.
    actionIn(figures[1], DIAGRAM_DOWNLOAD_ACTION).click();
    await until(() => saves.downloads.length === 2);
    expect(saves.downloads[1].name).toBe('diagram-2.svg');
    const second = await saves.blobOf(saves.downloads[1]).text();
    expect(second).toContain('Yankee');
    expect(second).not.toContain('Alpha');
  });

  it('carries an intrinsic size, so the saved file is a usable standalone document', async () => {
    const { figure } = await oneFigure();
    const box = rectOf(svgIn(figure));

    actionIn(figure, DIAGRAM_DOWNLOAD_ACTION).click();
    await until(() => saves.downloads.length === 1);

    const text = await saves.blobOf(saves.downloads[0]).text();
    expect(text).toContain(`width="${Math.round(box.width)}"`);
    expect(text).toContain(`height="${Math.round(box.height)}"`);
  });
});

// ── ★ THE PRODUCT IS THE SANITIZED, ADOPTED ARTIFACT ─────────────────────────────────────────

describe('★ both controls serialize the LIVE figure, not the engine’s raw output', () => {
  it('carries a marker planted into the adopted <svg> AFTER sanitization', async () => {
    const { figure } = await oneFigure();
    probe(svgIn(figure), 'PEEKOVER-ADOPTED-NODE-PROBE');

    actionIn(figure, DIAGRAM_DOWNLOAD_ACTION).click();
    await until(() => saves.downloads.length === 1);

    const text = await saves.blobOf(saves.downloads[0]).text();
    // Only a serialization of the node on screen can contain this. A re-render, a re-derivation
    // from the source fence, or a string stashed before adoption all miss it.
    expect(
      text,
      'the saved bytes do not contain a marker written into the adopted <svg> — the download did ' +
        'not serialize the artifact the reader is showing',
    ).toContain('PEEKOVER-ADOPTED-NODE-PROBE');
  });

  it('carries none of what the §3.5 profile strips — no foreignObject, no remote reference', async () => {
    const { figure } = await oneFigure();

    actionIn(figure, DIAGRAM_DOWNLOAD_ACTION).click();
    await until(() => saves.downloads.length === 1);
    const text = await saves.blobOf(saves.downloads[0]).text();

    // NON-VACUITY FIRST: there IS an artifact here, and it IS mermaid's, so the absences below are
    // absences from a real render rather than from an empty file.
    expect(text.length).toBeGreaterThan(500);
    expect(text).toContain('Alpha');

    expect(text.toLowerCase()).not.toContain('<foreignobject');
    expect(/\bhttps?:\/\//i.test(text.replace(/xmlns[^=]*="[^"]*"/g, ''))).toBe(false);
  });
});

// ── ROW 14: THE HANDLERS REACH THE CURRENT FIGURE ────────────────────────────────────────────

describe('row 14 — the controls act on the CURRENT figure', () => {
  it('after a THEME SWAP the same buttons produce the NEW <svg>, not the one they were built beside', async () => {
    const { host, figure } = await oneFigure();
    const before = svgIn(figure);
    probe(before, 'ARTIFACT-BEFORE-THE-FLIP');
    const button = actionIn(figure, DIAGRAM_DOWNLOAD_ACTION);

    // The flip. `drawStaleFigures` re-renders at the new theme and swaps the figure's content —
    // the SAME figure element, a DIFFERENT <svg>. The control group is moved back in, so these are
    // the same button objects with the same listeners across the swap.
    setThemeSetting('dark');
    await until(() => host.getAttribute('data-theme') === 'dark');
    await until(() => figure.getAttribute(DIAGRAM_THEME_ATTR) === 'dark');
    const after = await until(() => {
      const svg = figure.querySelector('svg');
      return svg && svg !== before ? svg : null;
    });

    expect(actionIn(figure, DIAGRAM_DOWNLOAD_ACTION)).toBe(button); // the group really did survive
    expect(before.isConnected).toBe(false); // ...and the node it was built beside really is gone
    probe(after as SVGSVGElement, 'ARTIFACT-AFTER-THE-FLIP');

    button.click();
    await until(() => saves.downloads.length === 1);
    const text = await saves.blobOf(saves.downloads[0]).text();

    expect(
      text,
      'the saved bytes came from the <svg> that was on screen when the group was BUILT, not the ' +
        'one on screen when it was CLICKED — a handler captured its target instead of resolving it',
    ).toContain('ARTIFACT-AFTER-THE-FLIP');
    expect(text).not.toContain('ARTIFACT-BEFORE-THE-FLIP');
  });

  it('after a RE-RENDER the rebuilt group produces the NEW document’s diagram', async () => {
    const { host, shadow } = enhancedHost(docOf(FENCE_ONE));
    const [first] = await renderedFigures(shadow);
    const firstButton = actionIn(first, DIAGRAM_DOWNLOAD_ACTION);

    // §3.3: every re-render re-enhances, because mount() commits with `replaceChildren`.
    const next = remount(host, docOf(FENCE_TWO));
    const [rebuilt] = await renderedFigures(next);

    expect(rebuilt).not.toBe(first);
    expect(first.isConnected).toBe(false);
    const rebuiltButton = actionIn(rebuilt, DIAGRAM_DOWNLOAD_ACTION);
    expect(rebuiltButton).not.toBe(firstButton);

    rebuiltButton.click();
    await until(() => saves.downloads.length === 1);
    const text = await saves.blobOf(saves.downloads[0]).text();

    expect(text).toContain('Yankee'); // the document that is open NOW
    expect(text).not.toContain('Alpha'); // not the one that was open when the first group was built
  });
});

// ── §4's ACTION FAILURE, AND ROW 20's LIVE REGION ────────────────────────────────────────────

describe('a failing action says so and leaves the diagram intact (§4, row 20)', () => {
  it('is a polite live region, out of the a11y tree while empty', async () => {
    const { figure } = await oneFigure();
    const status = statusIn(figure);

    expect(status.getAttribute('role')).toBe('status');
    expect(status.hidden).toBe(true); // `hidden`, not merely transparent
    expect(status.textContent).toBe('');

    actionIn(figure, DIAGRAM_COPY_ACTION).click();
    await until(() => status.hidden === false);
    expect(status.textContent!.length).toBeGreaterThan(0);
  });

  it('reports a REFUSED clipboard write, in text, and does not touch the diagram', async () => {
    const { figure } = await oneFigure();
    const svg = svgIn(figure);
    const button = actionIn(figure, DIAGRAM_COPY_ACTION);
    clipboard.refuse();

    button.click();
    await until(() => statusIn(figure).hidden === false);

    expect(statusIn(figure).textContent).toBe('Diagram 1 could not be copied as an image.');
    expect(button.textContent).toBe('Copy failed');
    expect(button.getAttribute('aria-label')).toBe(
      'Diagram 1 could not be copied as an image. Activate to try again.',
    );
    expect(button.getAttribute(DIAGRAM_ACTION_STATE_ATTR)).toBe('failed');
    expect(clipboard.written).toHaveLength(0);

    // §4: the rendered diagram is left intact — the same node, still on screen, still hiding its
    // source fence. A failing action that blanked the figure would be the AGENTS.md #5 breach.
    expect(figure.querySelector('svg')).toBe(svg);
    expect(svg.isConnected).toBe(true);
    expect(rectOf(svg).height).toBeGreaterThan(0);
    expect(figure.getAttribute(DIAGRAM_STATE_ATTR)).toBe('rendered');
  });
});

// ── a11y: rows 15, 16, 17 ────────────────────────────────────────────────────────────────────

describe('the control group — accessibility', () => {
  it('is two real <button>s, keyboard-reachable, with no tabindex of their own (row 16)', async () => {
    const { shadow, figure } = await oneFigure();

    for (const action of [DIAGRAM_COPY_ACTION, DIAGRAM_DOWNLOAD_ACTION]) {
      const button = actionIn(figure, action);
      expect(button.tagName).toBe('BUTTON');
      expect(button.type).toBe('button');
      expect(button.hasAttribute('tabindex')).toBe(false);
      button.focus();
      expect(shadow.activeElement, `${action} did not take focus`).toBe(button);
    }
  });

  it('is REVEALED by keyboard focus, not only by hover', async () => {
    const { figure } = await oneFigure();
    const group = groupIn(figure);

    // ★ M13 task 1.4 addendum: START FROM A KNOWN POINTER STATE. The real pointer is shared across
    // the serially-run files (harness-shared-state, AGENTS.md); an earlier file could leave it
    // resting where this figure renders, so the figure matched `:hover` before the test touched it
    // and the 120ms reveal was already running (opacity 0.08-0.17 read at the start — measured on
    // both engines, with `:focus-within` false). Move the pointer to a neutral point outside every
    // figure, then let the group settle at 0, so what reveals it below is keyboard focus alone.
    const neutral = document.createElement('div');
    neutral.style.cssText = 'position:fixed;top:0;left:0;width:8px;height:8px;z-index:2147483647';
    document.body.appendChild(neutral);
    cleanup.push(neutral);
    await userEvent.hover(neutral);
    expect(figure.matches(':hover'), 'the pointer still rests on the figure').toBe(false);
    await until(() => getComputedStyle(group).opacity === '0', 80).catch(() => undefined);

    // Hidden by opacity — which is what keeps the buttons in the tab order at all. `display:none`
    // or `visibility:hidden` would make the keyboard half of §3.11 unreachable.
    expect(getComputedStyle(group).opacity).toBe('0');

    actionIn(figure, DIAGRAM_COPY_ACTION).focus();

    // POLLED, because the reveal is a 120ms transition and `getComputedStyle` returns the value
    // MID-transition — read synchronously after `focus()` it is still '0' on both engines, which
    // is the animation running, not the rule missing. The poll fails the same way a missing
    // `:focus-within` would (it never reaches 1), so nothing is weakened by waiting for it.
    await until(() => getComputedStyle(group).opacity === '1', 80).catch(() => {
      expect(
        getComputedStyle(group).opacity,
        'focusing a control never revealed the group — :focus-within is missing',
      ).toBe('1');
    });
    expect(getComputedStyle(group).opacity).toBe('1');
  });

  it('names both the SELECTION and the ACTION, per diagram (row 17)', async () => {
    const { shadow } = enhancedHost(docOf(FENCE_ONE, FENCE_TWO));
    const figures = await renderedFigures(shadow);

    expect(actionIn(figures[0], DIAGRAM_COPY_ACTION).getAttribute('aria-label')).toBe(
      'Diagram 1. Activate to copy it as an image.',
    );
    expect(actionIn(figures[0], DIAGRAM_DOWNLOAD_ACTION).getAttribute('aria-label')).toBe(
      'Diagram 1. Activate to download it as SVG.',
    );
    expect(actionIn(figures[1], DIAGRAM_COPY_ACTION).getAttribute('aria-label')).toBe(
      'Diagram 2. Activate to copy it as an image.',
    );
    expect(groupIn(figures[1]).getAttribute('aria-label')).toBe('Diagram 2 actions');

    // §5: every rendered diagram carries an accessible name (row 17's other half).
    expect(figures[0].getAttribute('aria-label')).toBe('Diagram 1');
    expect(figures[1].getAttribute('aria-label')).toBe('Diagram 2');
  });

  it('carries its resolved state in TEXT and aria-label, not only in colour (row 15)', async () => {
    const { figure } = await oneFigure();
    const button = actionIn(figure, DIAGRAM_COPY_ACTION);

    expect(button.textContent).toBe('Copy image');
    expect(button.hasAttribute(DIAGRAM_ACTION_STATE_ATTR)).toBe(false);
    const idleColour = getComputedStyle(button).backgroundColor;

    button.click();
    await until(() => clipboard.written.length === 1);

    // Three independent carriers, none of them a hue.
    expect(button.textContent).toBe('Copied');
    expect(button.getAttribute('aria-label')).toBe(
      'Diagram 1 copied as an image. Activate to copy it again.',
    );
    expect(button.getAttribute(DIAGRAM_ACTION_STATE_ATTR)).toBe('done');
    expect(statusIn(figure).textContent).toBe('Diagram 1 copied as an image.');

    // NON-VACUITY of the colour claim: the colour really does move too, so the assertions above
    // say "text and ARIA carry the state IN ADDITION to colour", not "colour is unused".
    expect(getComputedStyle(button).backgroundColor).not.toBe(idleColour);
  });
});

// ── §3.11 / §4: NO NEW GLOBAL SINGLE-KEY SHORTCUT ────────────────────────────────────────────

describe('no new global single-key shortcut (§4, 006 D-7’s rule)', () => {
  it('bare keys reach neither action', async () => {
    const { shadow, figure } = await oneFigure();
    const reader = shadow.querySelector<HTMLElement>('.peekover-reader')!;

    for (const key of ['c', 'C', 'd', 'D', 's', 'i']) {
      for (const target of [document, reader, figure] as EventTarget[]) {
        target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, composed: true }));
      }
    }
    await sleep(60);

    expect(clipboard.written).toHaveLength(0);
    expect(saves.downloads).toHaveLength(0);

    // POSITIVE CONTROL, in the same test: the actions ARE reachable — through activation, which is
    // the only route §3.11 gives them. Without this the zeros above would also be what a broken
    // harness reads.
    actionIn(figure, DIAGRAM_COPY_ACTION).click();
    await until(() => clipboard.written.length === 1);
  });
});

// ── GEOMETRY: rows 5, 7, 11 ──────────────────────────────────────────────────────────────────

describe('row 11 — the group anchors to its OWN diagram, not the viewport', () => {
  it('is absolutely positioned inside its own figure, one group per diagram', async () => {
    await page.viewport(WIDE.width, WIDE.height);
    const { shadow } = enhancedHost(docOf(FENCE_ONE, FENCE_TWO));
    const figures = await renderedFigures(shadow);

    const groups = figures.map(groupIn);
    // `fixed` would anchor to the viewport and would look right in a screenshot of a short page.
    for (const group of groups) expect(getComputedStyle(group).position).toBe('absolute');

    const EPS = 1;
    figures.forEach((figure, i) => {
      const g = rectOf(groups[i]);
      const f = rectOf(figure);
      expect(g.width, `group ${i + 1} has no box`).toBeGreaterThan(0);
      expect(g.height, `group ${i + 1} has no box`).toBeGreaterThan(0);
      expect(g.top).toBeGreaterThanOrEqual(f.top - EPS);
      expect(g.right).toBeLessThanOrEqual(f.right + EPS);
      expect(g.bottom).toBeLessThanOrEqual(f.bottom + EPS);
    });

    // Two diagrams, two places. A viewport-anchored group would put both in the same one.
    expect(Math.round(rectOf(groups[0]).top)).not.toBe(Math.round(rectOf(groups[1]).top));
  });

  it('moves WITH its figure when the column scrolls', async () => {
    await page.viewport(WIDE.width, WIDE.height);
    const { shadow } = enhancedHost(docOf(FENCE_ONE, FENCE_TWO));
    const figures = await renderedFigures(shadow);
    const group = groupIn(figures[1]);

    const figureBefore = rectOf(figures[1]).top;
    const groupBefore = rectOf(group).top;

    window.scrollBy(0, 120);
    await sleep(50);

    const figureDelta = rectOf(figures[1]).top - figureBefore;
    const groupDelta = rectOf(group).top - groupBefore;
    // It tracked the figure exactly. A viewport-anchored group would have a delta of 0.
    expect(Math.abs(groupDelta - figureDelta)).toBeLessThanOrEqual(1);
    window.scrollTo(0, 0);
  });
});

describe('row 5 — the group does not occlude the column’s TEXT at a WIDE viewport', () => {
  it('floats over its diagram and clears every paragraph', async () => {
    await page.viewport(WIDE.width, WIDE.height);
    const { shadow, figure } = await oneFigure();
    const group = groupIn(figure);

    const box = rectOf(group);
    expect(box.width, 'a zero-size group clears everything vacuously').toBeGreaterThan(0);
    expect(box.height).toBeGreaterThan(0);

    const paragraphs = [...shadow.querySelectorAll<HTMLElement>('.peekover-reader p')];
    expect(paragraphs.length).toBeGreaterThanOrEqual(2);
    paragraphs.forEach((p, i) => {
      expect(rectOf(p).height, `paragraph ${i + 1} has no box`).toBeGreaterThan(0);
      expectNoOverlap('control group', box, `paragraph ${i + 1}`, rectOf(p));
    });

    // It DOES float over its own diagram — the half that makes the clearance above meaningful
    // rather than a group that simply sits somewhere harmless.
    expect(intersects(box, rectOf(svgIn(figure)))).toBe(true);
  });
});

describe('row 7 — the group clears the conditional chrome', () => {
  it('clears the network indicator AND the remote-load pill', async () => {
    await page.viewport(WIDE.width, WIDE.height);
    const host = document.createElement('div');
    document.body.appendChild(host);
    cleanup.push(host);
    // Both pieces only exist when mount() actually blocked a remote image, and the indicator ships
    // CSS-hidden until a network action — `data-network` is forced, because a hidden element has a
    // zero rect and would be cleared vacuously (`themeControl.browser.test.ts:352`'s note).
    mount(`${docOf(FENCE_ONE)}\n![remote](https://example.invalid/x.png)\n`, host, {
      contained: true,
      preserveReading: true,
    });
    enhanceDiagrams(host);
    host.setAttribute('data-network', 'active');
    const shadow = host.shadowRoot!;
    const [figure] = await renderedFigures(shadow);

    const box = rectOf(groupIn(figure));
    expect(box.width).toBeGreaterThan(0);

    const net = shadow.querySelector<HTMLElement>('.peekover-net');
    const remoteLoad = shadow.querySelector<HTMLElement>('.peekover-remote-load');
    expect(net, 'the network indicator is not in this tree — row 7 would be vacuous').not.toBeNull();
    expect(remoteLoad, 'the remote-load pill is not in this tree').not.toBeNull();

    expectNoOverlap('control group', box, 'network indicator', rectOf(net!));
    expectNoOverlap('control group', box, 'remote-load pill', rectOf(remoteLoad!));
  });
});

// ── THE SHIPPED CSS BLOCK ────────────────────────────────────────────────────────────────────

describe('the shipped diagram CSS block', () => {
  // The block runs from D-15's marker to the end of READER_CSS. Both surfaces ship this string
  // verbatim — nothing minifies inside a template literal — so its byte length is the mechanism
  // that keeps rationale prose out of it (retro finding 9), not a note asking the next author to
  // remember. Rationale for these rules lives in the `.ts` comment BELOW the literal.
  const BLOCK_START = '/* Diagrams (007 D-15)';
  const block = READER_CSS.slice(READER_CSS.indexOf(BLOCK_START));
  const bytes = new TextEncoder().encode(block).length;

  // Re-pinned by task 7.2: 1,517 -> 2,927 B, the +1,410 B being the lightbox's own rules (trigger
  // overlay, backdrop, panel, close, scroll view and the zoom keyframes). It carries NO
  // `prefers-reduced-motion` rule of its own: 7.2 wrote one and deleted it after removing it left
  // the suite green — the sheet-wide `:host *{animation-duration:.001ms!important}` at the top of
  // READER_CSS already covers the panel. The rationale lives in the `.ts` comment below the
  // literal, as this pin requires — a re-pin is what the message below asks for on a rule change.
  //
  // Re-pinned by 010 task 6.1: 2,927 -> 4,111 B, the +1,184 B being print mode's `@media print`
  // chrome-hiding/de-clip/page-break block plus the `@page` margin-box probe rule — both land
  // AFTER the diagram block (readerCss.ts's own tail), so this slice-to-end-of-string pin
  // legitimately grows by the whole addition. Content-script delta accounted at this same +1,184 B
  // (progress.md's own task 6.1 entry — READER_CSS ships to BOTH graphs by construction, D-2).
  //
  // Re-pinned by 013 task 5.4: 4,111 -> 3,968 B, −143 B, all the lightbox's rules (mockup.html:226): the overlay
  // +19 (the --logo-ink scrim, zoom-out), the panel +12 (radius 14, cursor auto), Close −160 (its look moved into
  // 5.3's shared button rule, which sits ABOVE this block; it keeps only align-self here), the pan box +41
  // (scrollbar-color). Lines removed 875 B, added 732 B. The content-script delta is decomposed in decisions.md,
  // "M13 TASK 5.4" (−569 B in all; this block's −143 B is part of it).
  it('is exactly 3,968 B — the pin that keeps prose out of the literal', () => {
    expect(READER_CSS.indexOf(BLOCK_START)).toBeGreaterThan(0);
    expect(
      bytes,
      'the shipped diagram CSS moved. If that is a rule change, re-pin it here and account the ' +
        'content-script delta to the byte; if it is a comment, move it below the literal',
    ).toBe(3968);
  });

  it('uses no `ch` in a layout-blocking property (retro finding 6)', () => {
    // `max-width` is free and is used above; margin/padding/gap/transform are not.
    expect(/(?:margin|padding|gap|transform)[^;{}]*\dch/.test(block)).toBe(false);

    // CONTROL: the pattern does fire, so the false above is a fact about the block rather than
    // about a regex that matches nothing.
    expect(/(?:margin|padding|gap|transform)[^;{}]*\dch/.test('.x{margin:2ch 0}')).toBe(true);
  });

  it('carries the control group’s rules and reveals them on focus as well as hover', () => {
    expect(block).toContain(`.${DIAGRAM_ACTIONS_CLASS}`);
    expect(block).toContain(':focus-within');
    expect(block).toContain(':hover');
    expect(block).toContain('prefers-reduced-motion');
  });
});

// ═════════════════════════════════════════════════════════════════════════════════════════════
// TASK 7.3 — §3-6 RE-PROVEN EMPIRICALLY ON BOTH ENGINES: A DOC READ IS NOT A BUILD
// ═════════════════════════════════════════════════════════════════════════════════════════════
//
// The plan resolved from current official documentation that `clipboardWrite` is NOT required for a
// click-triggered `navigator.clipboard.write()`, and that `downloads` gates the `chrome.downloads`
// API only while `<a download>` on a `blob:` URL is plain web platform. THAT IS A DOCUMENTATION
// FINDING. This section is the build: the two actions are driven through the ENGINE'S OWN
// clipboard and the anchor's OWN default action, in Chromium and in Firefox, and the manifests
// the build actually emitted are re-read afterwards and required to still be capability-free.
//
// ── ★ WHY THE CONJUNCTION IS THE PROOF, AND EITHER HALF ALONE IS NOT ─────────────────────────
//
// `permissions: []` read on its own proves nothing: it has been `[]` since task 1.1 and would be
// `[]` in a build where copy and download did not exist. What is being asserted is an ABSENCE
// DESPITE EXERCISE — the copy RAN and resolved, the download RAN and was not cancelled, and the
// shipped manifests still ask for nothing. Both cases below therefore require the action to reach
// its `done` state FIRST; an action that silently no-opped would red before any manifest is read.
//
// ── ★ WHY `done` IS THE EVIDENCE THAT THE REAL WRITE RESOLVED ────────────────────────────────
//
// `runDiagramAction` sets `done` only after `await clipboard.write(...)` returns, and `failed` on
// any throw — and a refusal throws `NotAllowedError`. So `done` here is a statement about the
// ENGINE'S clipboard, not about a recorder: the harness-sanity case below asserts
// `navigator.clipboard` carries no own property and that `write` is `[native code]`, and the
// refusal case above already proves the SAME attribute reads `failed` when a write is refused.
// The check is therefore shown capable of failing on exactly the condition the null disclaims.
//
// ── ★ THE MEASURED FINDING: THE TWO ENGINES GATE THIS DIFFERENTLY, AND NEITHER GATE IS A KEY ─
//
// Firefox writes the PNG on the gesture alone — `clipboard-write` is not even a valid
// `PermissionName` in Gecko, so there is nothing to ask for. Blink DOES consult the Permissions
// API, and a Playwright browser context leaves that consent at `prompt`, so the identical click
// reds with `NotAllowedError: Write permission denied` (measured; the state reads `prompt` in the
// top frame too, so it is the CONTEXT and not the test iframe). The copy case therefore runs an
// A-B ablation on Chromium: consent `prompt` -> `failed`, consent `granted` -> `done`, same build,
// same button, same bytes, NOTHING rebuilt in between. The variable that moves the outcome is a
// browser consent, not a manifest key — which is precisely §3-6's claim about the write path.
//
// ── ★ WHY THE MANIFESTS ARE READ FROM `.output/`, NOT FROM `wxt.config.ts` ───────────────────
//
// `tests/manifest.test.ts` guards the SOURCE — deliberately, because CI runs the unit project
// before any build and never builds Firefox, so a `.output/` read there would be vacuous. That
// leaves the GENERATED artifact unguarded, which is the whole point of an empirical re-proof: the
// question is whether the BUILD added a key nobody authored. These read the real emitted JSON.
//
// The same asymmetry applies here: `pnpm test:browser` runs BEFORE `pnpm build` in ci.yml, and
// Firefox is never built there at all, so `.output/` is absent in CI and the built-manifest case
// SKIPS — visibly, by name, in the reporter's skip count, never silently green. It runs on every
// machine that has built, which is where the artifact exists to be read. The capability check
// itself is a pure function, so its non-vacuity is proven unconditionally by the malformed-fixture
// control, which runs everywhere including CI.

/**
 * The REAL emitted manifests, read from disk at transform time.
 *
 * A Vite glob, not a fixture and not `wxt.config.ts`: these are the bytes `pnpm build` wrote into
 * `.output/chrome-mv3/` and `.output/firefox-mv3/`. Absent when nothing has been built — the glob
 * then yields `{}` rather than throwing, which is what lets the case below skip by name.
 */
const BUILT_MANIFESTS = import.meta.glob('/.output/*/manifest.json', {
  eager: true,
  import: 'default',
}) as Record<string, Record<string, unknown>>;

const BUILT_ENGINES = Object.keys(BUILT_MANIFESTS).sort();

/** Every manifest key that would represent a capability this milestone claims not to need. */
const CAPABILITY_KEYS = ['host_permissions', 'web_accessible_resources', 'webRequest'] as const;

/**
 * The ONE check, run against the real artifacts AND against the deliberately malformed fixtures.
 *
 * Returns a list rather than asserting, so the same code path can be required to be empty for a
 * shipped manifest and required to be NON-empty for a control. A checker that only ever runs on
 * good input is indistinguishable from a checker that returns `[]` unconditionally.
 */
/**
 * The engine's OWN answer about clipboard-write consent — the seam the two engines differ on.
 *
 * Gecko rejects the descriptor outright (`clipboard-write` is not a `PermissionName` there), which
 * is not an error to route around: it IS the finding, and it is what the copy case branches on.
 * Branching on a capability rather than on `navigator.userAgent` keeps the case honest about WHY
 * the engines diverge instead of merely noting THAT they do.
 */
async function clipboardWriteConsent(): Promise<PermissionState | 'unsupported'> {
  try {
    const status = await navigator.permissions.query({
      name: 'clipboard-write' as PermissionName,
    });
    return status.state;
  } catch {
    return 'unsupported';
  }
}

/**
 * Grant the BROWSER-CONTEXT clipboard-write consent — Chromium only, over CDP.
 *
 * ★ THIS IS A USER CONSENT, NOT A MANIFEST PERMISSION, and the distinction is the whole task.
 * `Browser.grantPermissions` needs the `browserContextId` because a Playwright page lives in a
 * non-default context; without it the grant lands elsewhere and the state stays `prompt` (measured).
 * Nothing is rebuilt, nothing is re-manifested — only the browser's consent moves.
 *
 * ★ AND THE CONTEXT ID IS KEPT, BECAUSE THE RESET NEEDS IT TOO — MEASURED (AGENTS.md #9). A
 * `Browser.resetPermissions` sent with no `browserContextId` clears the DEFAULT context and leaves
 * THIS one granted, and the browser window is shared across every file in the run: an earlier draft
 * of this file's own `afterEach` reset with no id, which is exactly what `tableCopy.browser.test.ts`'s
 * own header names as the leak its file has to defend against. Fixed at the source instead of
 * leaving every later file to duct-tape around it.
 */
let consentGranted = false;
let grantedContextId: string | undefined;

async function grantClipboardWriteConsent(): Promise<void> {
  consentGranted = true;
  const info = (await cdp().send('Target.getTargetInfo', {} as never)) as {
    targetInfo?: { browserContextId?: string };
  };
  grantedContextId = info?.targetInfo?.browserContextId;
  await cdp().send('Browser.grantPermissions', {
    origin: location.origin,
    browserContextId: grantedContextId,
    permissions: ['clipboardSanitizedWrite'],
  } as never);
}

/** Focus (the group is `pointer-events:none` until revealed), REAL-click, wait for the settle. */
async function realClickSettles(button: HTMLButtonElement): Promise<string> {
  // The click is Playwright's REAL mouse — a trusted event carrying the user activation both
  // engines require of an async clipboard write. A dispatched `click()` would not carry it, which
  // is exactly the difference between this section and the stubbed ones above.
  button.focus();
  await userEvent.click(button);
  return until(() => {
    const s = button.getAttribute(DIAGRAM_ACTION_STATE_ATTR);
    return s === 'done' || s === 'failed' ? s : null;
  });
}

function capabilityViolations(manifest: Record<string, unknown>): string[] {
  const found: string[] = [];
  const perms = manifest.permissions;
  if (!Array.isArray(perms)) found.push('permissions is missing or not an array');
  else if (perms.length > 0) found.push(`permissions requests: ${perms.join(', ')}`);
  for (const key of CAPABILITY_KEYS) {
    if (manifest[key] !== undefined) found.push(`forbidden key present: ${key}`);
  }
  return found;
}

describe('★ 7.3 — the UNSTUBBED half: the engine’s own clipboard and the anchor’s own click', () => {
  beforeEach(() => {
    // The file-wide recorders come OFF. From here down `navigator.clipboard` is the browser's and
    // the capturing `preventDefault` is gone, so the anchor's default action stands. Both
    // `restore()`s are idempotent, which is what lets `afterEach` still call them.
    clipboard.restore();
    saves.restore();
  });

  afterEach(async () => {
    // Undo any consent this section granted, so the browser context leaves these files as it found
    // them. Guarded by the flag rather than by an engine sniff: `cdp()` is Chromium-only. Reset by
    // the SAME `browserContextId` the grant used — an id-less reset clears the DEFAULT context only
    // and leaves this one granted for whichever file runs next (the fix above).
    if (!consentGranted) return;
    consentGranted = false;
    await cdp().send('Browser.resetPermissions', { browserContextId: grantedContextId } as never);
    // The instrument for the cleanup itself: if the consent survived, say so HERE rather than in
    // whichever file happens to run next and pin `prompt`.
    expect(await clipboardWriteConsent(), 'the granted consent outlived this file').toBe('prompt');
  });

  it('is talking to the browser’s own clipboard — no own property, `write` is [native code]', () => {
    // HARNESS SANITY. Without this, every assertion below could be passing against the recorder
    // installed in the file-wide `beforeEach` and the section would prove the opposite of its name.
    expect(Object.getOwnPropertyDescriptor(navigator, 'clipboard')).toBeUndefined();
    expect(typeof navigator.clipboard?.write).toBe('function');
    expect(String(navigator.clipboard.write)).toContain('[native code]');

    // CONTROL: these same checks DO fire on a recorder, so their agreement above is a fact about
    // this page rather than about assertions that cannot tell the two apart.
    const recorder = stubClipboard();
    try {
      expect(Object.getOwnPropertyDescriptor(navigator, 'clipboard')).toBeDefined();
      expect(String(navigator.clipboard.write)).not.toContain('[native code]');
    } finally {
      recorder.restore();
    }
  });

  it('a REAL click writes an image to the REAL clipboard — and what gates it is CONSENT, not the manifest', async () => {
    const { figure } = await oneFigure();
    const button = actionIn(figure, DIAGRAM_COPY_ACTION);

    // NOTHING-BEFORE: `data-state` is the idle value until the click causes otherwise.
    expect(button.getAttribute(DIAGRAM_ACTION_STATE_ATTR)).not.toBe('done');

    const consent = await clipboardWriteConsent();

    if (consent === 'unsupported') {
      // ── FIREFOX ──────────────────────────────────────────────────────────────────────────────
      // Gecko has no `clipboard-write` permission to ask for or to grant — the descriptor is not
      // a valid `PermissionName` there at all. The gesture IS the whole gate, so this is the
      // §3-6 claim in its strongest form: a real trusted click, a real PNG, the engine's real
      // clipboard, and nothing granted to anybody.
      expect(await realClickSettles(button)).toBe('done');
    } else {
      // ── CHROMIUM: THE A-B ABLATION ───────────────────────────────────────────────────────────
      // Blink DOES gate the write on the Permissions-API `clipboard-write` consent, and a
      // Playwright browser context leaves that at `prompt` (a headless window is never the
      // OS-focused active tab that real Chrome auto-grants). So the two arms below run THE SAME
      // BUILD, THE SAME BUTTON and THE SAME BYTES, and move exactly one variable — the browser's
      // user consent. `failed` before, `done` after.
      //
      // ★ THAT IS THE POINT. The variable that flips the outcome is a BROWSER CONSENT, granted
      // here over CDP at the browser-context level. It is NOT a manifest key: `.output/` is not
      // rebuilt between the arms, and the built-manifest case below reads `permissions: []` from
      // the very artifact this session exercised. `clipboardWrite` in a manifest is merely one
      // route to this same consent for an extension origin — this proves the write path itself
      // asks the manifest for nothing.
      //
      // ★ WHAT THIS DOES NOT PROVE, STATED SO NOBODY READS MORE INTO A GREEN: that a focused,
      // headful Chrome auto-grants the consent to a gesture-driven write. That is real-Chrome
      // behaviour a Playwright context cannot exhibit, and it is the one leg of §3-6 that stays
      // a documentation finding rather than a build.
      // The OFF arm is PINNED, not conditional: an ablation whose off-arm can quietly not run is
      // no ablation at all. If Playwright ever starts auto-granting, this reds and says so.
      expect(
        consent,
        'the context no longer starts at `prompt` — the OFF arm of the ablation is void and this ' +
          'case needs re-deriving, not relaxing',
      ).toBe('prompt');
      expect(
        await realClickSettles(button),
        'Blink accepted the write with the consent at `prompt` — the OFF arm did not fire',
      ).toBe('failed');

      await grantClipboardWriteConsent();
      expect(await clipboardWriteConsent()).toBe('granted');

      // Clear the settled attribute so `until()` cannot return arm one's answer.
      button.removeAttribute(DIAGRAM_ACTION_STATE_ATTR);
      expect(
        await realClickSettles(button),
        'the real clipboard write did not resolve even with consent granted — if this is a ' +
          'NotAllowedError then a manifest permission IS required, which is an AGENTS.md #4 ' +
          'event and a hard stop, not a test to relax',
      ).toBe('done');
    }

    expect(button.textContent).toBe('Copied');
    expect(statusIn(figure).textContent).toContain('copied');
  });

  it('a REAL click downloads an SVG through plain `<a download>` — nothing cancelled it', async () => {
    const { figure } = await oneFigure();
    const button = actionIn(figure, DIAGRAM_DOWNLOAD_ACTION);

    // A PASSIVE observer: it records and returns. No `preventDefault`, so the engine performs the
    // download for real — the difference from `captureDownloads()` above, which cancels it.
    const seen: { name: string; href: string; prevented: boolean }[] = [];
    const onClick = (event: Event): void => {
      const target = event.target;
      if (!(target instanceof HTMLAnchorElement) || !target.hasAttribute('download')) return;
      seen.push({ name: target.download, href: target.href, prevented: event.defaultPrevented });
    };
    document.addEventListener('click', onClick, true);

    try {
      expect(seen).toHaveLength(0);

      // No consent is granted here on EITHER engine — `<a download>` consults no Permissions API
      // and no manifest key. That it settles `done` untouched is the §3-6 download claim, built.
      expect(await realClickSettles(button)).toBe('done');

      // The anchor really was clicked, really carried a `blob:` URL minted over bytes already in
      // this page, and really was left to its default action. No `chrome.downloads` anywhere on
      // the path — this is the plain web platform, which is the §3-6 claim being re-proven.
      expect(seen).toHaveLength(1);
      expect(seen[0].name).toBe('diagram-1.svg');
      expect(seen[0].href.startsWith('blob:')).toBe(true);
      expect(
        seen[0].prevented,
        'the default action was cancelled — the download did not happen',
      ).toBe(false);
      expect(button.textContent).toBe('Downloaded');
    } finally {
      document.removeEventListener('click', onClick, true);
    }
  });
});

describe('★ 7.3 — the manifests the build actually emitted', () => {
  it('the capability check REDS on a malformed manifest — it is capable of failing', () => {
    // The non-vacuity control §7.3 names, and the reason the skip below is tolerable: this runs
    // everywhere, including the CI leg where `.output/` does not exist.
    expect(capabilityViolations({ permissions: [], action: {} })).toEqual([]);

    expect(capabilityViolations({ permissions: ['clipboardWrite'] })).toEqual([
      'permissions requests: clipboardWrite',
    ]);
    expect(capabilityViolations({ permissions: ['downloads', 'tabs'] })).toEqual([
      'permissions requests: downloads, tabs',
    ]);
    expect(
      capabilityViolations({ permissions: [], web_accessible_resources: ['diagram.svg'] }),
    ).toEqual(['forbidden key present: web_accessible_resources']);
    expect(capabilityViolations({ permissions: [], host_permissions: ['<all_urls>'] })).toEqual([
      'forbidden key present: host_permissions',
    ]);
    expect(capabilityViolations({ action: {} })).toEqual(['permissions is missing or not an array']);
  });

  // SKIPS WITHOUT A BUILD — by name, in the reporter's skip count, never silently green. See the
  // section header: ci.yml runs this project before `pnpm build` and never builds Firefox.
  it.skipIf(BUILT_ENGINES.length === 0)(
    'BOTH built manifests still declare `permissions: []` with no web_accessible_resources',
    () => {
      // Both engines, from `.output/`, after the two actions above ran for real in this same
      // browser session. This is the absence DESPITE exercise.
      expect(BUILT_ENGINES).toEqual([
        '/.output/chrome-mv3/manifest.json',
        '/.output/firefox-mv3/manifest.json',
      ]);

      for (const [path, manifest] of Object.entries(BUILT_MANIFESTS)) {
        expect(manifest.permissions, `${path} has no permissions key`).toEqual([]);
        expect(capabilityViolations(manifest), `${path} asks for a capability`).toEqual([]);
        // The build emitted a real manifest, not an empty object that would pass by accident.
        expect(manifest.manifest_version, `${path} is not an MV3 manifest`).toBe(3);
        expect(manifest.name).toBe('Peekover');
      }
    },
  );
});

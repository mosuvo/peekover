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
// ── THE CLIPBOARD AND THE DOWNLOAD ARE STUBBED HERE, AND UNSTUBBED IN 7.3 ────────────────────
//
// This file captures the products at the browser globals — `navigator.clipboard.write` and the
// anchor's own click — because what it is testing is WHICH BYTES the control produced. Task 7.3 is
// the other half and is deliberately not duplicated here: a real click writing a real image to the
// real clipboard in the loaded build, with both built manifests re-read for `permissions: []`.
// Nothing in production grew a seam for either; both are browser globals, stubbed from outside.

import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { page } from 'vitest/browser';
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

  it('is exactly 1,517 B — the pin that keeps prose out of the literal', () => {
    expect(READER_CSS.indexOf(BLOCK_START)).toBeGreaterThan(0);
    expect(
      bytes,
      'the shipped diagram CSS moved. If that is a rule change, re-pin it here and account the ' +
        'content-script delta to the byte; if it is a comment, move it below the literal',
    ).toBe(1517);
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

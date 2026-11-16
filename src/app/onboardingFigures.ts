// The setup guide's drawings (0.1.2; decisions.md, "0.1.2 B3: THE SETUP GUIDE"). Simple drawings of where the
// file setting is — NOT browser screenshots — built from DOM calls (nothing is parsed as HTML) and coloured from the
// page's tokens, so they follow light and dark. Each comes in a wide form and a narrow form whose text stays
// readable at phone width; the sheet shows one (`ONBOARDING_CSS`, `__fig--wide` / `__fig--narrow`).
//
// One drawing per build: the entry (`entrypoints/onboarding/main.ts`) passes the one its build needs under the
// build-time `import.meta.env.FIREFOX`, so the other build's drawing is dropped from its bundle (`onboarding.test.ts`
// bundles both). The words drawn are the browsers' own labels, the same ones the steps quote.
import { drawMark, svgEl } from '../theme/mark';
import { ONBOARDING_CLASS, ONBOARDING_COPY } from './onboarding';

const C = ONBOARDING_CLASS;

/** The data attribute the bundle test looks for, one value per build. */
export const FIGURE_ATTR = 'data-peekover-figure';

type Draw = (doc: Document, svg: SVGSVGElement) => void;

function text(doc: Document, x: number, y: number, size: number, weight: string, fill: string, words: string, mono = false): SVGTextElement {
  const t = svgEl(doc, 'text', { x: String(x), y: String(y), 'font-size': String(size), 'font-weight': weight, fill, class: mono ? `${C}__fig-mono` : `${C}__fig-sans` });
  t.textContent = words;
  return t;
}
const rect = (doc: Document, a: Record<string, string | number>): SVGRectElement =>
  svgEl(doc, 'rect', Object.fromEntries(Object.entries(a).map(([k, v]) => [k, String(v)])));
/** The highlighter ring round the part to find. */
const ring = (doc: Document, x: number, y: number, w: number, h: number): SVGRectElement =>
  rect(doc, { x, y, width: w, height: h, rx: 9, fill: 'none', stroke: 'var(--hl)', 'stroke-width': 4 });
/** A switch drawn on. */
function toggle(doc: Document, x: number, y: number, w = 40): SVGGElement {
  const g = svgEl(doc, 'g', {});
  g.append(
    rect(doc, { x, y, width: w, height: 20, rx: 10, fill: 'var(--ink)' }),
    svgEl(doc, 'circle', { cx: String(x + w - 10), cy: String(y + 10), r: '7', fill: 'var(--paper)' }),
  );
  return g;
}
/** The logo mark at a scale, its top-left at (x, y). */
function mark(doc: Document, x: number, y: number, scale: number): SVGGElement {
  const g = svgEl(doc, 'g', { transform: `translate(${x} ${y}) scale(${scale})` });
  drawMark(doc, g, `${C}__fig`);
  return g;
}
/** A browser window's top bar with an address. */
function windowBar(doc: Document, address: string, dots: boolean): SVGElement[] {
  const out: SVGElement[] = [rect(doc, { x: 0, y: 0, width: 560, height: 34, fill: 'var(--accent-soft)' })];
  if (dots) for (const cx of [18, 34, 50]) out.push(svgEl(doc, 'circle', { cx: String(cx), cy: '17', r: '5', fill: 'var(--faint)' }));
  const left = dots ? 72 : 16;
  out.push(rect(doc, { x: left, y: 8, width: 300, height: 18, rx: 9, fill: 'var(--paper)' }), text(doc, left + 14, 21, 11, '400', 'var(--muted)', address, true));
  return out;
}

const CHROMIUM_WIDE: Draw = (doc, svg) => {
  svg.append(
    ...windowBar(doc, 'chrome://extensions/?id=…', true),
    rect(doc, { x: 24, y: 50, width: 512, height: 146, rx: 10, fill: 'var(--paper)', stroke: 'var(--line)' }),
    mark(doc, 40, 62, 0.5),
    text(doc, 78, 80, 15, '700', 'var(--ink)', 'Peekover'),
    rect(doc, { x: 40, y: 98, width: 200, height: 8, rx: 4, fill: 'var(--line)' }),
    rect(doc, { x: 40, y: 114, width: 150, height: 8, rx: 4, fill: 'var(--line)' }),
    ring(doc, 34, 138, 492, 44),
    text(doc, 48, 165, 15, '600', 'var(--ink)', 'Allow access to file URLs'),
    toggle(doc, 466, 151),
  );
};
const CHROMIUM_NARROW: Draw = (doc, svg) => {
  svg.append(
    rect(doc, { x: 12, y: 12, width: 296, height: 88, rx: 10, fill: 'var(--paper)', stroke: 'var(--line)' }),
    mark(doc, 24, 22, 0.4),
    text(doc, 54, 38, 14, '700', 'var(--ink)', 'Peekover'),
    ring(doc, 20, 50, 280, 42),
    text(doc, 32, 76, 14, '600', 'var(--ink)', 'Allow access to file URLs'),
    toggle(doc, 250, 61, 36),
  );
};
const FIREFOX_WIDE: Draw = (doc, svg) => {
  svg.append(
    ...windowBar(doc, 'about:addons', false),
    rect(doc, { x: 24, y: 50, width: 512, height: 166, rx: 10, fill: 'var(--paper)', stroke: 'var(--line)' }),
    mark(doc, 40, 62, 0.5),
    text(doc, 78, 80, 15, '700', 'var(--ink)', 'Peekover'),
    text(doc, 40, 118, 13, '400', 'var(--muted)', 'Details'),
    text(doc, 104, 118, 13, '400', 'var(--muted)', 'Options'),
    text(doc, 170, 118, 13, '700', 'var(--ink)', 'Permissions and data'),
    ring(doc, 164, 100, 150, 28),
    svgEl(doc, 'line', { x1: '40', y1: '134', x2: '520', y2: '134', stroke: 'var(--line)' }),
    ring(doc, 34, 150, 492, 44),
    text(doc, 48, 177, 15, '600', 'var(--ink)', 'Access local files on your computer'),
    toggle(doc, 466, 163),
  );
};
const FIREFOX_NARROW: Draw = (doc, svg) => {
  svg.append(
    rect(doc, { x: 12, y: 12, width: 296, height: 126, rx: 10, fill: 'var(--paper)', stroke: 'var(--line)' }),
    mark(doc, 24, 22, 0.4),
    text(doc, 54, 38, 14, '700', 'var(--ink)', 'Peekover'),
    ring(doc, 20, 50, 164, 30),
    text(doc, 31, 70, 14, '700', 'var(--ink)', 'Permissions and data'),
    ring(doc, 20, 88, 280, 42),
    text(doc, 30, 114, 13, '600', 'var(--ink)', 'Access local files on your computer'),
    toggle(doc, 254, 99, 34),
  );
};

function figure(doc: Document, build: 'chromium' | 'firefox', label: string, wide: [string, Draw], narrow: [string, Draw]): HTMLElement {
  const holder = doc.createElement('div');
  holder.className = `${C}__figs`;
  holder.setAttribute(FIGURE_ATTR, build);
  for (const [form, [viewBox, draw]] of [['wide', wide], ['narrow', narrow]] as const) {
    const box = doc.createElement('div');
    box.className = `${C}__fig ${C}__fig--${form}`;
    const svg = svgEl(doc, 'svg', { viewBox, role: 'img', 'aria-label': label, focusable: 'false' });
    draw(doc, svg);
    box.append(svg);
    holder.append(box);
  }
  return holder;
}

/** Peekover's details page, the "Allow access to file URLs" switch ringed (Chrome, Edge, Brave). */
export const chromiumFigure = (doc: Document): HTMLElement =>
  figure(doc, 'chromium', ONBOARDING_COPY.figureChromium, ['0 0 560 210', CHROMIUM_WIDE], ['0 0 320 112', CHROMIUM_NARROW]);

/** Peekover's card in about:addons, the "Permissions and data" tab and the local-files switch ringed (Firefox). */
export const firefoxFigure = (doc: Document): HTMLElement =>
  figure(doc, 'firefox', ONBOARDING_COPY.figureFirefox, ['0 0 560 230', FIREFOX_WIDE], ['0 0 320 150', FIREFOX_NARROW]);

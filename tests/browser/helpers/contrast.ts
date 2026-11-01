// The ONE contrast helper (013 task 2.2; plan D-16). It replaces the two private copies that grew in
// editorEyeballProxy.browser.test.ts (the colour arithmetic and the backdrop walk) and
// diagramTheme.browser.test.ts (luminance and the ratio); both now import from here, their
// assertions unchanged. The census (contrastCensus.browser.test.ts) is built on it.
//
// WHAT IT MEASURES, AND HOW TRANSLUCENCY IS HANDLED. WCAG 2.x relative luminance and contrast ratio
// (1.4.3 / 1.4.11), on the COMPUTED colours an engine resolves. A translucent background is
// composited source-over, in non-linear sRGB (what a `background-color` stack paints), onto every
// layer beneath it down to the first opaque ancestor — crossing shadow roots to the host; if none
// is opaque, the canvas is white. A translucent FOREGROUND (its own alpha times every ancestor's
// `opacity`) is composited over that flattened backdrop before the ratio is taken. Background
// images are not read by the walk; `gradientStops` exposes an element's gradient stops for a caller
// that needs them.

export type RGBA = readonly [number, number, number, number];
export const WHITE: RGBA = [255, 255, 255, 1];

/** WCAG 2.1 AA thresholds. */
export const TEXT_BAR = 4.5; // 1.4.3, normal text
export const LARGE_TEXT_BAR = 3; // 1.4.3, large text
export const NON_TEXT_BAR = 3; // 1.4.11, UI components and graphics

/** A computed colour → RGBA. Computed values are `rgb()`/`rgba()` on both engines; `color(srgb …)` is
 *  handled so a token change cannot silently skew a row, and anything else throws rather than being
 *  read as black. */
export function parseColor(value: string): RGBA {
  const v = value.trim();
  if (v === 'transparent') return [0, 0, 0, 0];
  const rgb = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+)(%?))?\s*\)$/.exec(v);
  if (rgb) {
    const a = rgb[4] === undefined ? 1 : Number(rgb[4]) / (rgb[5] ? 100 : 1);
    return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3]), a];
  }
  const srgb = /^color\(\s*srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+)(%?))?\s*\)$/.exec(v);
  if (srgb) {
    const a = srgb[4] === undefined ? 1 : Number(srgb[4]) / (srgb[5] ? 100 : 1);
    return [Number(srgb[1]) * 255, Number(srgb[2]) * 255, Number(srgb[3]) * 255, a];
  }
  throw new Error(`not a colour this helper can read: ${value}`);
}

/** Source-over, in non-linear sRGB — what a `background-color` stack paints. `under` is opaque. */
export const over = (top: RGBA, under: RGBA): RGBA => [
  top[0] * top[3] + under[0] * (1 - top[3]),
  top[1] * top[3] + under[1] * (1 - top[3]),
  top[2] * top[3] + under[2] * (1 - top[3]),
  1,
];

/** Flatten a bottom-to-top stack whose bottom layer is opaque. */
export const flatten = (layers: readonly RGBA[]): RGBA => layers.slice(1).reduce((acc, l) => over(l, acc), layers[0]);

const toLinear = (c: number): number => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
};

/** WCAG relative luminance of an sRGB colour (channels 0–255; any alpha is ignored). */
export const luminance = (c: readonly number[]): number =>
  0.2126 * toLinear(c[0]) + 0.7152 * toLinear(c[1]) + 0.0722 * toLinear(c[2]);

/** WCAG contrast ratio of two opaque colours, 1–21. */
export function contrastRatio(a: readonly number[], b: readonly number[]): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

export const hex = (c: RGBA): string =>
  `#${[c[0], c[1], c[2]].map((n) => Math.round(n).toString(16).padStart(2, '0')).join('')}` +
  (c[3] < 1 ? `@${Number(c[3].toFixed(3))}` : '');

export const parentAcrossShadow = (node: Element): Element | null => {
  if (node.parentElement) return node.parentElement;
  const root = node.getRootNode();
  return root instanceof ShadowRoot ? root.host : null;
};

export const nameOf = (el: Element): string =>
  el.classList.length ? `.${[...el.classList].filter((c) => !c.startsWith('ͼ')).join('.')}` : el.tagName.toLowerCase();

export interface Backdrop {
  /** Bottom to top; `layers[0]` is opaque. */
  readonly layers: readonly RGBA[];
  /** Where each layer came from, bottom to top — printed in a row. */
  readonly how: string;
}

/**
 * What is painted behind `el`'s own content: its background and every ancestor's, down to the first
 * opaque one. `skipSelf` leaves `el`'s own background out (for "this band against what is behind
 * it"). `behindContent` is a layer no ancestor walk can find (CodeMirror's selection, drawn beneath
 * `.cm-content`), inserted between the layers outside the content and those inside it.
 */
export function backdropOf(
  el: Element,
  opts: { skipSelf?: boolean; behindContent?: ReadonlyArray<readonly [string, RGBA]> } = {},
): Backdrop {
  const inContent: Array<readonly [string, RGBA]> = []; // top to bottom
  const outside: Array<readonly [string, RGBA]> = []; // top to bottom
  let base: readonly [string, RGBA] | null = null;
  let baseInContent = false;
  let node: Element | null = el;
  let self = true;
  while (node) {
    if (!(self && opts.skipSelf)) {
      const bg = parseColor(getComputedStyle(node).backgroundColor);
      if (bg[3] >= 1) {
        base = [nameOf(node), bg];
        baseInContent = node.closest('.cm-content') !== null;
        break;
      }
      if (bg[3] > 0) (node.closest('.cm-content') ? inContent : outside).push([nameOf(node), bg]);
    }
    self = false;
    node = parentAcrossShadow(node);
  }
  const stack = [
    base ?? (['(no opaque ancestor: canvas white)', WHITE] as const),
    ...outside.reverse(),
    ...(baseInContent ? [] : (opts.behindContent ?? [])),
    ...inContent.reverse(),
  ];
  return {
    layers: stack.map(([, c]) => c),
    how: stack.map(([n, c]) => `${n} ${hex(c)}`).join(' < '),
  };
}

/** `opacity` multiplied from `el` up to its shadow root — applied to a FOREGROUND only. */
export function effectiveOpacity(el: Element): number {
  let o = 1;
  for (let node: Element | null = el; node; node = node.parentElement) {
    o *= Number(getComputedStyle(node).opacity);
  }
  return o;
}

/** The colour stops of an element's own `linear-gradient`, or `[]`. */
export function gradientStops(el: Element): RGBA[] {
  const image = getComputedStyle(el).backgroundImage;
  if (!image.includes('gradient')) return [];
  return (image.match(/rgba?\([^)]+\)/g) ?? []).map(parseColor);
}

/** The text colour an element draws with, its own and its ancestors' `opacity` folded in. */
export const inkOf = (el: Element): RGBA => {
  const c = parseColor(getComputedStyle(el).color);
  return [c[0], c[1], c[2], c[3] * effectiveOpacity(el)];
};

/** WCAG "large text": at least 18pt (24px), or at least 14pt (18.66px) and bold (700+). */
export function isLargeText(el: Element): boolean {
  const cs = getComputedStyle(el);
  const px = parseFloat(cs.fontSize);
  const weight = Number(cs.fontWeight) || (cs.fontWeight === 'bold' ? 700 : 400);
  return px >= 24 || (px >= 18.66 && weight >= 700);
}

/** The ratio a foreground draws at over a backdrop: the foreground composited, then compared. */
export function ratioOver(fg: RGBA, backdrop: Backdrop): { ratio: number; drawn: RGBA; bg: RGBA } {
  const bg = flatten(backdrop.layers);
  const drawn = over(fg, bg);
  return { ratio: contrastRatio(drawn, bg), drawn, bg };
}

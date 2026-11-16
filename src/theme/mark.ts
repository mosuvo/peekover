// The logo mark — the two-eyed drawing from the design's 128 icon (`assets/icons/icon-128.svg`), built from DOM calls
// and the theme tokens: `--hl` for the document, `--logo-ink` / `--logo-eye` for the FIXED ink and eye white
// (AGENTS.md: the logo's internals use the fixed ink in every theme; tokens.css carries both values).
// Shared by the app page's toolbar and the setup guide (0.1.2). The caller's class root names the parts:
// `${cls}__mark` on the svg and `${cls}__lid` on each eye group (the toolbar's lids blink).

const SVG_NS = 'http://www.w3.org/2000/svg';

/** One SVG element with its attributes. */
export function svgEl<K extends keyof SVGElementTagNameMap>(doc: Document, tag: K, attrs: Record<string, string>): SVGElementTagNameMap[K] {
  const node = doc.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
}

/** The mark's drawing (the document and the two eyes), appended to `parent` in the 60 × 52 drawing's units. */
export function drawMark(doc: Document, parent: SVGElement, cls: string): void {
  const ink = 'var(--logo-ink)';
  parent.append(
    svgEl(doc, 'rect', { x: '4', y: '26', width: '52', height: '24', rx: '5', fill: 'var(--hl)', stroke: ink, 'stroke-width': '2.5' }),
    svgEl(doc, 'line', { x1: '14', y1: '36', x2: '46', y2: '36', stroke: ink, 'stroke-width': '2.5', 'stroke-linecap': 'round', opacity: '.55' }),
    svgEl(doc, 'line', { x1: '14', y1: '43', x2: '36', y2: '43', stroke: ink, 'stroke-width': '2.5', 'stroke-linecap': 'round', opacity: '.55' }),
  );
  for (const cx of [21, 41]) {
    const lid = svgEl(doc, 'g', { class: `${cls}__lid` });
    lid.append(
      svgEl(doc, 'circle', { cx: String(cx), cy: '17', r: '9', fill: 'var(--logo-eye)', stroke: ink, 'stroke-width': '2.5' }),
      svgEl(doc, 'circle', { cx: String(cx + 2), cy: '19', r: '3.4', fill: ink }),
    );
    parent.append(lid);
  }
}

/** The mark as its own decorative svg (`aria-hidden`), classed `${cls}__mark`. */
export function buildMark(doc: Document, cls: string): SVGSVGElement {
  const svg = svgEl(doc, 'svg', { class: `${cls}__mark`, viewBox: '0 0 60 52', 'aria-hidden': 'true', focusable: 'false' });
  drawMark(doc, svg, cls);
  return svg;
}

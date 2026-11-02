// toolbar — the app page's toolbar (013 group 4; plan D-5), built to the approved mock
// (`design/toolbar-mock.html`; decisions.md "M13 GATE — 3.1 TOOLBAR MOCK APPROVED").
//
// 4.1 is the SKELETON: the mark, the open file's name in the highlighter, and Read / Raw. Watch,
// Compare and the agent badge join at 4.2, Edit at 4.3, the app controls at 4.4; the app page drops
// the reader's floating pills at 4.5. Until then the pills still render, so for a while some
// controls show twice — unreleased, stated in tasks.md group 4.
//
// THE SAME STATE, NOT A COPY. Read / Raw call `setReaderMode` on the active reader host — exactly
// what the reader's mode pill does — and the toolbar shows the host's `data-mode`, read back through
// ONE MutationObserver on the host's `data-mode` / `data-watch` / `data-diff` (the last two for 4.2).
// So it reflects a flip it did not make (the pill, a programmatic call; `\` stays inert on the app
// page — the 4.0 census ruling B). It lives in the shell's light-DOM header, outside the reader's
// shadow root, so `mount()`'s `replaceChildren` never destroys it.
//
// WHILE EDITING, Read and Raw are disabled: leaving edit must go through the editor's exit and the
// unsaved-changes guard, which only the Edit control carries until the Edit segment arrives (4.3,
// ruling E). A Read / Raw that bypassed it could lose an unsaved buffer.
//
// THE MARK is drawn here (two lids that blink, only when the user allows motion), from tokens:
// `--hl` for the document, `--logo-ink` / `--logo-eye` for the fixed ink and eye white (AGENTS.md:
// the logo's internals use the FIXED ink in every theme; tokens.css carries both values).
import { setReaderMode, type ReaderMode } from '../render/readerMode';

/** The toolbar's class root; every part is `${TOOLBAR_CLASS}__part`. */
export const TOOLBAR_CLASS = 'peekover-toolbar';
const C = TOOLBAR_CLASS;
const SVG_NS = 'http://www.w3.org/2000/svg';

/** The view modes the segment offers in 4.1 (Edit joins at 4.3). */
const SEGMENTS: ReadonlyArray<readonly [Exclude<ReaderMode, 'edit'>, string]> = [
  ['reading', 'Read'],
  ['raw', 'Raw'],
];

/** The toolbar's stylesheet, scoped under the shell's class (for its theme selectors). Its dark
 *  file-name chip follows the mock (approved, item 9): the full highlighter with dark text —
 *  `--paper` is the dark theme's near-black — because the half-height marker would leave
 *  dark-theme text on yellow at 1.2:1. */
export function toolbarCss(shell: string): string {
  const dark = `background:var(--hl); color:var(--paper)`;
  return /* css */ `
.${C}{display:flex; flex-wrap:wrap; align-items:center; gap:.5rem .65rem; min-width:0}
.${C}__brand{display:flex; align-items:center; gap:.5rem; flex:none; font-weight:700; font-size:15px; letter-spacing:-.01em}
.${C}__mark{display:block; width:30px; height:26px; flex:none}
.${C}__lid{transform-box:fill-box; transform-origin:center}
@media (prefers-reduced-motion:no-preference){.${C}__lid{animation:${C}-blink 6s infinite}}
@keyframes ${C}-blink{0%,94%,100%{transform:scaleY(1)} 96%,98%{transform:scaleY(.08)}}
.${C}__file{font-weight:600; font-size:13px; padding:1px 5px; border-radius:3px; color:var(--ink);
  background:linear-gradient(transparent 62%, var(--hl) 62%);
  white-space:nowrap; max-width:240px; overflow:hidden; text-overflow:ellipsis}
.${C}__file[hidden]{display:none}
@media (prefers-color-scheme:dark){.${shell}:not([data-theme="light"]) .${C}__file{${dark}}}
.${shell}[data-theme="dark"] .${C}__file{${dark}}
.${C}__seg{display:flex; flex:none; border:1px solid var(--line); border-radius:8px; overflow:hidden; background:var(--panel)}
.${C}__seg button{font:600 12.5px/1 var(--sans); color:var(--muted); background:none; border:0; padding:7px 13px; cursor:pointer}
.${C}__seg button[aria-pressed="true"]{background:var(--ink); color:var(--paper)}
.${C}__seg button:disabled{cursor:default}
`;
}

/** The two-eyed mark from the design's 128 drawing, drawn with tokens; the lids blink. */
function buildMark(doc: Document): SVGSVGElement {
  const el = <K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string>): SVGElementTagNameMap[K] => {
    const node = doc.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    return node;
  };
  const ink = 'var(--logo-ink)';
  const svg = el('svg', { class: `${C}__mark`, viewBox: '0 0 60 52', 'aria-hidden': 'true', focusable: 'false' });
  svg.append(
    el('rect', { x: '4', y: '26', width: '52', height: '24', rx: '5', fill: 'var(--hl)', stroke: ink, 'stroke-width': '2.5' }),
    el('line', { x1: '14', y1: '36', x2: '46', y2: '36', stroke: ink, 'stroke-width': '2.5', 'stroke-linecap': 'round', opacity: '.55' }),
    el('line', { x1: '14', y1: '43', x2: '36', y2: '43', stroke: ink, 'stroke-width': '2.5', 'stroke-linecap': 'round', opacity: '.55' }),
  );
  for (const cx of [21, 41]) {
    const lid = el('g', { class: `${C}__lid` });
    lid.append(
      el('circle', { cx: String(cx), cy: '17', r: '9', fill: 'var(--logo-eye)', stroke: ink, 'stroke-width': '2.5' }),
      el('circle', { cx: String(cx + 2), cy: '19', r: '3.4', fill: ink }),
    );
    svg.append(lid);
  }
  return svg;
}

/** What the shell holds. */
export interface ToolbarController {
  readonly element: HTMLElement;
  /** The open document's name and its reader host (both null when none is open). Re-binds the
   *  observer to the host, so a document switch is reflected at once. */
  setDocument(name: string | null, host: HTMLElement | null): void;
}

/** Build the toolbar skeleton. */
export function createToolbar(doc: Document): ToolbarController {
  const element = doc.createElement('div');
  element.className = C;

  const brand = doc.createElement('span');
  brand.className = `${C}__brand`;
  const word = doc.createElement('span');
  word.className = `${C}__word`;
  word.textContent = 'Peekover';
  brand.append(buildMark(doc), word);

  const file = doc.createElement('span');
  file.className = `${C}__file`;
  file.hidden = true;

  const seg = doc.createElement('div');
  seg.className = `${C}__seg`;
  seg.setAttribute('role', 'group');
  seg.setAttribute('aria-label', 'View');
  const buttons = SEGMENTS.map(([mode, label]) => {
    const b = doc.createElement('button');
    b.type = 'button';
    b.dataset.mode = mode;
    b.textContent = label;
    b.addEventListener('click', () => {
      if (!host || host.getAttribute('data-mode') === 'edit') return;
      setReaderMode(host, mode);
      sync();
    });
    seg.append(b);
    return b;
  });

  element.append(brand, file, seg);

  let host: HTMLElement | null = null;
  const observer = new MutationObserver(() => sync());

  /** Show the bound host's state: which view is pressed, and whether the segment can act. */
  function sync(): void {
    const mode = host?.getAttribute('data-mode') ?? null;
    const usable = host !== null && mode !== 'edit';
    for (const b of buttons) {
      b.disabled = !usable;
      b.setAttribute('aria-pressed', String(usable && b.dataset.mode === mode));
    }
  }

  function setDocument(name: string | null, next: HTMLElement | null): void {
    file.textContent = name ?? '';
    file.hidden = name === null;
    if (name) file.title = name;
    else file.removeAttribute('title');
    observer.disconnect();
    host = next;
    if (host) observer.observe(host, { attributes: true, attributeFilter: ['data-mode', 'data-watch', 'data-diff'] });
    sync();
  }

  sync();
  return { element, setDocument };
}

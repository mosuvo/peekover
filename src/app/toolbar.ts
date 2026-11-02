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
// 4.2 adds Watch, Compare and the agent badge, each from the SAME builder the reader's pill uses
// (`buildWatchControl`, `buildDiffChrome`, `buildAgentBadge`), rebuilt on every document switch:
// - Watch rides the watch registry, so the toolbar's control and the pill reflect each other.
// - Compare's "a diff is on screen" state is local to each builder instance (its label and
//   `dataset.diffOpen`); the shared state is the host's `data-diff`, which the observer reads, and
//   the toolbar writes that state onto BOTH instances — its own and, while it still renders, the
//   reader's pill — so either one closes a comparison the other opened. App-side only: the builder
//   is on the content script's graph and does not change.
// - The NOTICE AREA (the 4.0 census ruling A) sits below the header, in the page flow, never over
//   text: the watch note (stopped / unavailable / changed again) and Compare's status line.
//
// THE BADGE IS A <p> (the pill's own element): in the light DOM it carries the UA's paragraph
// margins, which the reader's shadow sheet zeroes. The toolbar's rule zeroes them too — without it
// an agent file's header grew 20 px and moved the reading column (census C061, found by the 4.2
// full suite).
//
// THE MARK is drawn here (two lids that blink, only when the user allows motion), from tokens:
// `--hl` for the document, `--logo-ink` / `--logo-eye` for the fixed ink and eye white (AGENTS.md:
// the logo's internals use the FIXED ink in every theme; tokens.css carries both values).
import { setReaderMode, type ReaderMode } from '../render/readerMode';
import { buildWatchControl, buildWatchNote, WATCH_CONTROL_CLASS } from '../watch/watchControl';
import {
  buildDiffChrome,
  ARIA_COMPARE,
  DIFF_AFFORDANCE_CLASS,
  LABEL_COMPARE,
  LABEL_EXIT,
} from '../render/diffChrome';
import { buildAgentBadge } from '../render/agentBadge';

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
.${C} .peekover-agent-badge{margin:0; font:600 12px/1 var(--sans); letter-spacing:.02em; color:var(--muted); background:var(--panel);
  border:1px solid var(--line); border-radius:999px; padding:6px 11px; white-space:nowrap; flex:none}
.${C} .${WATCH_CONTROL_CLASS}{display:inline-flex; align-items:center; gap:7px; flex:none; cursor:pointer; white-space:nowrap;
  font:600 12.5px/1 var(--sans); letter-spacing:.02em; color:var(--muted); background:var(--panel);
  border:1px solid var(--line); border-radius:999px; padding:7px 13px}
.${C} .${WATCH_CONTROL_CLASS}__dot{width:7px; height:7px; border-radius:50%; background:var(--muted); flex:none}
.${C} .${WATCH_CONTROL_CLASS}[aria-pressed="true"]{color:var(--ink); border-color:var(--ok)}
.${C} .${WATCH_CONTROL_CLASS}[aria-pressed="true"] .${WATCH_CONTROL_CLASS}__dot{background:var(--ok)}
.${C}__badge,.${C}__watch,.${C}__status{display:contents}
.${C}__compare{position:relative; display:inline-flex; flex:none}
.${C} .${DIFF_AFFORDANCE_CLASS}{font:600 12.5px/1 var(--sans); color:var(--muted); background:var(--panel); cursor:pointer;
  border:1px solid var(--line); border-radius:8px; padding:7px 11px; white-space:nowrap}
.${C} .${DIFF_AFFORDANCE_CLASS}[aria-expanded="true"],.${C} .${DIFF_AFFORDANCE_CLASS}[data-diff-open="true"]{color:var(--ink); border-color:var(--ink)}
.${C} .peekover-diff-picker{position:absolute; top:calc(100% + 6px); left:0; z-index:6; box-sizing:border-box;
  width:300px; max-width:calc(100vw - 1.5rem); max-height:min(60vh,calc(100vh - 6rem)); overflow:auto;
  background:var(--paper); border:1px solid var(--line); border-radius:12px; box-shadow:var(--shadow); padding:6px}
.${C} .peekover-diff-picker[hidden]{display:none}
.${C} .peekover-diff-picker [role="group"]::before{content:attr(aria-label); display:block; margin:6px 8px 4px;
  font:700 11px/1.3 var(--sans); letter-spacing:.06em; text-transform:uppercase; color:var(--muted)}
.${C} .peekover-diff-picker__item{display:flex; align-items:baseline; justify-content:space-between; gap:10px; width:100%;
  box-sizing:border-box; text-align:left; font:400 13px/1.4 var(--sans); color:var(--ink); background:none; border:0;
  border-radius:7px; padding:7px 8px; cursor:pointer}
.${C} .peekover-diff-picker__item:hover{background:var(--accent-soft)}
.${C} .peekover-diff-picker__size,.${C} .peekover-diff-picker__kind{color:var(--muted); font-variant-numeric:tabular-nums}
.${shell}__notices{flex:none}
.${shell}__notices > *,.${shell}__notices > .${C}__status > *{margin:0; padding:.55rem 1rem; font:400 13px/1.45 var(--sans); color:var(--ink);
  background:var(--panel); border-bottom:1px solid var(--line)}
.${shell}__notices [hidden]{display:none}
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
  /** The notice area (ruling A): the shell places it below the header, in the page flow. */
  readonly notices: HTMLElement;
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

  // 4.2 — the badge, Watch and Compare, each a slot refilled on every document switch.
  const badgeSlot = doc.createElement('span');
  badgeSlot.className = `${C}__badge`;
  const watchSlot = doc.createElement('span');
  watchSlot.className = `${C}__watch`;
  const compareSlot = doc.createElement('span');
  compareSlot.className = `${C}__compare`;

  element.append(brand, file, badgeSlot, watchSlot, compareSlot, seg);

  // The notice area: the watch note (always built; it hides itself with nothing to say) and,
  // per document, Compare's status line.
  const notices = doc.createElement('div');
  notices.className = 'peekover-app__notices';
  const statusSlot = doc.createElement('div');
  statusSlot.className = `${C}__status`;
  notices.append(buildWatchNote(), statusSlot);
  let comparePill: HTMLButtonElement | null = null;
  let compareStatus: HTMLElement | null = null;

  let host: HTMLElement | null = null;
  let wasDiffOpen = false;
  const observer = new MutationObserver(() => sync());

  /** Show the bound host's state: which view is pressed, and whether the segment can act. */
  /** Write the shared comparison state onto one Compare control (its label and its exit gesture). */
  function showDiffState(pill: Element | null | undefined, open: boolean): void {
    if (!(pill instanceof HTMLElement)) return;
    if (open === (pill.dataset.diffOpen === 'true')) return;
    pill.textContent = open ? LABEL_EXIT : LABEL_COMPARE;
    pill.setAttribute('aria-label', open ? LABEL_EXIT : ARIA_COMPARE);
    if (open) pill.dataset.diffOpen = 'true';
    else delete pill.dataset.diffOpen;
  }

  function sync(): void {
    const mode = host?.getAttribute('data-mode') ?? null;
    // `data-diff="active"` is diffView's flag (its DIFF_HOST_ATTR); not imported — the diff import
    // fence keeps diffView appShell's alone (diffImportFence: Clause C).
    const diffOpen = host?.getAttribute('data-diff') === 'active';
    showDiffState(comparePill, diffOpen);
    showDiffState(host?.shadowRoot?.querySelector(`.${DIFF_AFFORDANCE_CLASS}`), diffOpen);
    if (!diffOpen && compareStatus && wasDiffOpen) {
      compareStatus.hidden = true;
      compareStatus.textContent = '';
    }
    wasDiffOpen = diffOpen;
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
    badgeSlot.replaceChildren(...(host ? buildAgentBadge() : []));
    const watch = host ? buildWatchControl(host) : null;
    watchSlot.replaceChildren(...(watch ? [watch] : []));
    const [pill, picker, status] = host ? buildDiffChrome(host) : [];
    comparePill = pill instanceof HTMLButtonElement ? pill : null;
    compareStatus = status instanceof HTMLElement ? status : null;
    compareSlot.replaceChildren(...[pill, picker].filter((n): n is Node => n !== undefined));
    statusSlot.replaceChildren(...(compareStatus ? [compareStatus] : []));
    wasDiffOpen = false;
    if (host) observer.observe(host, { attributes: true, attributeFilter: ['data-mode', 'data-watch', 'data-diff'] });
    sync();
  }

  sync();
  return { element, setDocument, notices };
}

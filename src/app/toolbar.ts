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
// 4.3 — EDIT IS A SEGMENT (D-6; the 4.0 census ruling E): Read · Edit · Raw. Edit calls `toggleEdit`
// — the shadow-root Edit control is gone. The segment you click is where you go: while editing,
// Read and Raw stay offered and leave edit for their own mode (`leaveEdit` — the exit and the edit
// view's teardown together). The unsaved-changes guard is the SHELL's: `appShell.ts` hears a Read /
// Raw click first, in capture, and holds it while the user answers, so nothing here can lose a
// buffer it was not told to. A failed engine load says "Editor unavailable" on the Edit segment;
// activating it again retries. The Edit segment is unavailable (disabled) on a host that cannot be
// edited — none open, or a failed render.
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
// 4.4 — THE APP CONTROLS AND THE COMPACT TOOLBAR (D-5; the 4.0 census ruling C; the 3.1 mock and its
// addendum). The shell hands its four app controls — Theme (the one theme control: the same
// `buildThemeControl` the reader's pill uses, one `setThemeSetting` broadcast), Code theme, Stored
// data, Export — to `addAppControl`, in the mock's order; they sit in the right-hand group. At
// ≤ 863 px (the approved compact breakpoint) they hide behind "⋯", a menu button whose items
// activate the SAME buttons, so each panel opens exactly as it does at wide widths (and, at that
// width, drops from the header — the shell's ≤ 863 rule). Compact: no wordmark beside the mark, the
// file name truncating, the badge as "Agent file" (the name is beside it), and two fixed rows —
// row 1 the Files slot (4.8), the mark, the file name, the badge, "⋯"; row 2 Watch, Compare,
// Read · Edit · Raw. The menu's keyboard: Enter / Space on "⋯" open it on its first item; arrows,
// Home / End and Tab / Shift+Tab move through it (wrapping); Escape closes it and returns focus to
// "⋯"; a press outside closes it. Compact, an open comparison's Compare reads "Close" on screen
// (its name stays "Close comparison"): the full label cannot share row 2 with Watch and Read · Edit ·
// Raw at 414 px (measured at 4.4: 413 px of items in 382), and the mock's own Compare state keeps the
// short label.
//
// THE MARK is drawn here (two lids that blink, only when the user allows motion), from tokens:
// `--hl` for the document, `--logo-ink` / `--logo-eye` for the fixed ink and eye white (AGENTS.md:
// the logo's internals use the FIXED ink in every theme; tokens.css carries both values).
import { setReaderMode, type ReaderMode } from '../render/readerMode';
import { EDIT_LABELS, isEditable, leaveEdit, toggleEdit, type EditState } from '../render/editorEnhancer';
import { buildWatchControl, buildWatchNote, DISCLOSURE_TEXT, WATCH_CONTROL_CLASS } from '../watch/watchControl';
import {
  buildDiffChrome,
  ARIA_COMPARE,
  DIFF_AFFORDANCE_CLASS,
  LABEL_COMPARE,
  LABEL_EXIT,
} from '../render/diffChrome';
import { buildAgentBadge } from '../render/agentBadge';

/** Distinct ids per toolbar (a test mounts several). */
let toolbarCount = 0;

/** The toolbar's class root; every part is `${TOOLBAR_CLASS}__part`. */
export const TOOLBAR_CLASS = 'peekover-toolbar';
const C = TOOLBAR_CLASS;
const SVG_NS = 'http://www.w3.org/2000/svg';

/** The compact breakpoint (approved at 3.1): at this width and below, the compact toolbar. */
export const COMPACT_MAX = 863;

/** 4.8 (D-10; gate-1 Q12): at this width and below, with a document open, the folder pane is an
 *  overlay behind "Files". The narrowest width keeping >= 60ch of reading text beside the 228 px pane
 *  (5.1), with the TOC rail open (its default there), is 1190 px: Chromium on Linux draws Literata's
 *  "0" at a whole 10 px (60ch = 600 px; 590.6 / 591 px on Windows) — the 5.1 re-measure, by the
 *  human's ruling (4.8 FIX's rule; 1281 beside the old 320 px pane). */
export const FILES_OVERLAY_MAX = 1189;

/** The segment's views, in the mock's order. */
const SEGMENTS: ReadonlyArray<readonly [ReaderMode, string]> = [
  ['reading', 'Read'],
  ['edit', EDIT_LABELS.rest.text],
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
.${C} .${WATCH_CONTROL_CLASS}[aria-disabled="true"]{cursor:default; opacity:.55}
.${C}__watch-why{font:500 12px/1.3 var(--sans); color:var(--muted); white-space:nowrap}
.${C}__badge,.${C}__watch,.${C}__status{display:contents}
.${C}__compare{position:relative; display:inline-flex; flex:none}
.${C} .${DIFF_AFFORDANCE_CLASS}{font:600 12.5px/1 var(--sans); color:var(--muted); background:var(--panel); cursor:pointer;
  border:1px solid var(--line); border-radius:8px; padding:7px 11px; white-space:nowrap}
.${C} .${DIFF_AFFORDANCE_CLASS}[aria-expanded="true"],.${C} .${DIFF_AFFORDANCE_CLASS}[data-diff-open="true"]{color:var(--ink); border-color:var(--ink)}
.${C}__drop{position:absolute; top:calc(100% + 6px); left:0; z-index:6; box-sizing:border-box;
  width:300px; max-width:calc(100vw - 1.5rem); background:var(--paper); border:1px solid var(--line); border-radius:12px;
  box-shadow:var(--shadow); overflow:hidden}
.${C}__drop[hidden]{display:none}
.${C} .peekover-diff-picker{box-sizing:border-box; max-height:min(60vh,calc(100vh - 6rem)); overflow:auto; scrollbar-color:var(--faint) transparent; padding:6px}
.${C} .peekover-diff-picker[hidden]{display:none}
.${C}__drop .peekover-diff-status{margin:0; padding:.55rem .75rem; font:400 13px/1.45 var(--sans); color:var(--ink);
  border-top:1px solid var(--line)}
.${C}__drop .peekover-diff-status[hidden]{display:none}
.${C} .peekover-diff-picker [role="group"]::before{content:attr(aria-label); display:block; margin:6px 8px 4px;
  font:700 11px/1.3 var(--sans); letter-spacing:.06em; text-transform:uppercase; color:var(--muted)}
.${C} .peekover-diff-picker__item{display:flex; align-items:baseline; justify-content:space-between; gap:10px; width:100%;
  box-sizing:border-box; text-align:left; font:400 13px/1.4 var(--sans); color:var(--ink); background:none; border:0;
  border-radius:7px; padding:7px 8px; cursor:pointer}
.${C} .peekover-diff-picker__item:hover{background:var(--accent-soft)}
.${C} .peekover-diff-picker__size,.${C} .peekover-diff-picker__kind{color:var(--muted); font-variant-numeric:tabular-nums}
.${C}{flex:1 1 auto}
.${C}__files,.${C}__break,.${C}__more,.${C}__menu[hidden]{display:none}
@media (max-width:${FILES_OVERLAY_MAX}px){.${shell}[data-folder] .${C}__files{display:inline-flex}}
.${C}__files-btn{margin:0; font:600 12.5px/1 var(--sans); letter-spacing:0; color:var(--muted); background:var(--panel);
  border:1px solid var(--line); border-radius:8px; padding:7px 11px; white-space:nowrap; cursor:pointer}
.${C}__files-btn[aria-expanded="true"]{color:var(--ink); border-color:var(--ink)}
.${C}__app{display:flex; flex-wrap:wrap; align-items:center; gap:.5rem .65rem; margin-left:auto; min-width:0}
.${C}__app [data-toolbar-control]{margin:0; font:600 12.5px/1 var(--sans); letter-spacing:0; color:var(--muted); background:var(--panel);
  border:1px solid var(--line); border-radius:8px; padding:7px 11px; white-space:nowrap; cursor:pointer}
.${C}__guide{display:inline-block; text-decoration:none}
.${C}__guide:hover{color:var(--ink)}
.${C}__app [data-toolbar-control][aria-expanded="true"]{color:var(--ink); border-color:var(--ink)}
.${C}__app [data-toolbar-control]:disabled{cursor:default}
.${C}__menu{position:absolute; top:calc(100% + 6px); right:.75rem; z-index:7; min-width:220px; box-sizing:border-box;
  display:flex; flex-direction:column; gap:2px; padding:6px; background:var(--paper); border:1px solid var(--line);
  border-radius:12px; box-shadow:var(--shadow)}
.${C}__menu [role="menuitem"]{font:600 13px/1.2 var(--sans); color:var(--ink); background:none; border:0; border-radius:7px;
  padding:9px 10px; text-align:left; cursor:pointer}
.${C}__menu [role="menuitem"]:hover,.${C}__menu [role="menuitem"]:focus-visible{background:var(--accent-soft)}
.${C}__menu [role="menuitem"]:disabled{color:var(--muted); cursor:default; background:none}
@media (max-width:${COMPACT_MAX}px){
  .${shell}__header{padding:.5rem .625rem}
  .${C}{gap:8px 6px}
  .${C}__word,.${C} .${C}__bname,.${C}__app [data-toolbar-control]{display:none}
  .${C}__app,.${C}__app > *{display:contents}
  .${C}__files,.${C}__brand,.${C}__file,.${C}__badge > *{order:1}
  .${C}__file{min-width:0; max-width:min(240px, calc(100% - 180px))}
  .${C}__more{display:inline-flex; order:2; margin-left:auto; font:600 15px/1 var(--sans); letter-spacing:.05em;
    color:var(--muted); background:var(--panel); border:1px solid var(--line); border-radius:8px; padding:5px 11px; cursor:pointer}
  .${C}__more[aria-expanded="true"]{color:var(--ink); border-color:var(--ink)}
  .${C}__break{display:block; order:3; flex-basis:100%; height:0}
  .${C}__watch > *,.${C}__compare,.${C}__seg{order:4}
  .${C} .${C}__watch-why{order:5; flex-basis:100%; white-space:normal}
  .${C}__compare{position:static}
  .${C}__seg button{padding:7px 9px}
  .${C} .${WATCH_CONTROL_CLASS}{padding:7px 9px}
  .${C} .${DIFF_AFFORDANCE_CLASS}{padding:7px 9px}
  .${C} .${DIFF_AFFORDANCE_CLASS}[data-diff-open="true"]{font-size:0}
  .${C} .${DIFF_AFFORDANCE_CLASS}[data-diff-open="true"]::after{content:"Close"; font-size:12.5px}
}
.${shell}__notices{flex:none}
.${shell}__notices > *,.${shell}__notices > .${C}__status > *{margin:0; padding:.55rem 1rem; font:400 13px/1.45 var(--sans); color:var(--ink);
  background:var(--panel); border-bottom:1px solid var(--line)}
.${shell}__notices [hidden]{display:none}
.${shell}__notices > .${C}__load{display:contents}
.${shell}__notices .peekover-remote-load{display:block; width:100%; box-sizing:border-box; margin:0; padding:.55rem 1rem; text-align:left;
  font:600 13px/1.45 var(--sans); color:var(--ink); background:var(--panel); border:0; border-bottom:1px solid var(--line); cursor:pointer}
.${shell}__notices .${C}__notice{display:flex; flex-wrap:wrap; align-items:center; gap:8px 14px}
.${shell}__notices .${C}__notice[hidden]{display:none}
.${C}__notice p{margin:0; flex:1 1 300px}
.${C}__notice-link{font:inherit; font-weight:600; color:var(--ink); background:none; border:0; padding:0; text-decoration:underline; cursor:pointer}
.${C}__notice-ok{font:600 12.5px/1 var(--sans); color:var(--ink); background:var(--paper); border:1px solid var(--line);
  border-radius:8px; padding:7px 11px; cursor:pointer; flex:none}
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
  /** Add one app control to the right-hand group, in the mock's order: `el` is what is placed (the
   *  button, or the wrapper that holds it and its panel) and `trigger` the button the "⋯" menu's
   *  item activates. */
  addAppControl(el: HTMLElement, trigger: HTMLButtonElement): void;
  /** Return focus to an app control's trigger as its panel closes — or to "⋯" when the trigger is
   *  behind it (the compact toolbar). */
  focusTrigger(trigger: HTMLElement): void;
  /** The Edit segment — where focus goes back after the unsaved-changes question is escaped. */
  readonly editSegment: HTMLButtonElement;
  /** 4.8 — "Files": opens and closes the folder pane's overlay (the shell owns that behaviour). */
  readonly filesButton: HTMLButtonElement;
  /** The open document's name and its reader host (both null when none is open). Re-binds the
   *  observer to the host, so a document switch is reflected at once. */
  setDocument(name: string | null, host: HTMLElement | null): void;
  /** 0.1.1: why Watch is not offered for the open document (`WATCH_UNAVAILABLE_REASON`), or null. With a reason and a
   *  document, the Watch slot shows the control unavailable (`aria-disabled`, still focusable) with the reason beside it,
   *  linked by `aria-describedby`; the reason applies from the next `setDocument` on, and at once to the one open. */
  setWatchUnavailable(reason: string | null): void;
  /** The notice area (ruling A): the shell places it below the header, in the page flow. */
  readonly notices: HTMLElement;
  /** 4.5 (ruling D): move the bound host's remote-images load bar, if its mount built one, from the
   *  reader's shadow root into the notice area. The shell calls it after every app-page mount. */
  adoptChrome(host: HTMLElement): void;
  /** 4.5 (D-8): wire the one-time snapshot notice — whether it was dismissed, what "Got it" does
   *  (remembers it), what "Stored data" does (opens the panel), whether capture is on. */
  configureSnapshotNotice(notice: SnapshotNoticeWiring): void;
  /** Re-evaluate the snapshot notice (after a wipe, a capture toggle, or the dismissal loading). */
  refreshNotices(): void;
}

/** What the shell hands the toolbar for the one-time snapshot notice (D-8). */
export interface SnapshotNoticeWiring {
  dismissed(): boolean;
  dismiss(): void;
  captureOn(): boolean;
  openStoredData(): void;
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
      if (!host) return;
      const current = host.getAttribute('data-mode');
      if (mode === 'edit') {
        if (current === 'edit') return; // the pressed segment: nothing to do
        const target = host;
        void toggleEdit(target).then((state) => {
          if (host !== target) return; // a document switch while it loaded
          editState = state === 'unavailable' ? 'unavailable' : 'rest';
          sync();
        });
        return;
      }
      // Read / Raw. From edit, the exit and teardown; the shell's guard has already asked.
      if (current === 'edit') leaveEdit(host, mode);
      else setReaderMode(host, mode);
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

  // 4.4 — the Files slot, the compact toolbar's row break, and the right-hand group with "⋯" and
  // its menu. 4.8 — the slot holds "Files", shown only while the folder pane is an overlay (the
  // shell wires it: `filesButton`).
  const filesSlot = doc.createElement('span');
  filesSlot.className = `${C}__files`;
  const filesButton = doc.createElement('button');
  filesButton.type = 'button';
  filesButton.className = `${C}__files-btn`;
  filesButton.textContent = 'Files';
  filesButton.setAttribute('aria-expanded', 'false');
  filesSlot.append(filesButton);
  const rowBreak = doc.createElement('span');
  rowBreak.className = `${C}__break`;
  rowBreak.setAttribute('aria-hidden', 'true');
  const app = doc.createElement('div');
  app.className = `${C}__app`;
  const more = doc.createElement('button');
  more.type = 'button';
  more.className = `${C}__more`;
  more.textContent = '⋯';
  more.setAttribute('aria-haspopup', 'menu');
  more.setAttribute('aria-expanded', 'false');
  more.setAttribute('aria-label', 'More: theme, code theme, stored data, export, setup guide');
  const menu = doc.createElement('div');
  menu.className = `${C}__menu`;
  menu.setAttribute('role', 'menu');
  menu.setAttribute('aria-label', 'More');
  menu.hidden = true;
  // 6.1 (D-11) — the setup guide, last in the right-hand group; behind "⋯" when compact. A new tab, so
  // an open folder or an unsaved edit on this page is not navigated away from.
  const guide = doc.createElement('a');
  guide.className = `${C}__guide`;
  guide.href = '/onboarding.html';
  guide.target = '_blank';
  guide.rel = 'noopener';
  guide.textContent = 'Setup guide';
  guide.dataset.toolbarControl = 'guide';
  app.append(guide);

  element.append(filesSlot, brand, file, badgeSlot, watchSlot, compareSlot, rowBreak, seg, app, more, menu);

  const triggers: HTMLButtonElement[] = [];
  function addAppControl(el: HTMLElement, trigger: HTMLButtonElement): void {
    trigger.dataset.toolbarControl = String(triggers.length);
    triggers.push(trigger);
    app.insertBefore(el, guide);
  }
  const visible = (el: HTMLElement): boolean => el.getClientRects().length > 0;
  const items = (): HTMLButtonElement[] =>
    [...menu.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')].filter((b) => !b.disabled);

  function closeMenu(returnFocus: boolean): void {
    if (menu.hidden) return;
    menu.hidden = true;
    menu.replaceChildren();
    more.setAttribute('aria-expanded', 'false');
    if (returnFocus) more.focus();
  }
  function openMenu(): void {
    menu.replaceChildren(
      ...triggers.map((trigger) => {
        const item = doc.createElement('button');
        item.type = 'button';
        item.setAttribute('role', 'menuitem');
        item.tabIndex = -1;
        item.dataset.control = trigger.dataset.toolbarControl;
        item.textContent = trigger.textContent;
        item.disabled = trigger.disabled;
        item.addEventListener('click', () => {
          closeMenu(false);
          trigger.click(); // the same button, so the same panel, opened as at wide widths
        });
        return item;
      }),
    );
    const guideItem = doc.createElement('button');
    guideItem.type = 'button';
    guideItem.setAttribute('role', 'menuitem');
    guideItem.tabIndex = -1;
    guideItem.dataset.control = 'guide';
    guideItem.textContent = guide.textContent;
    guideItem.addEventListener('click', () => {
      closeMenu(false);
      guide.click(); // the same link, so the same new tab
    });
    menu.append(guideItem);
    menu.hidden = false;
    more.setAttribute('aria-expanded', 'true');
    items()[0]?.focus();
  }
  more.addEventListener('click', () => (menu.hidden ? openMenu() : closeMenu(true)));
  menu.addEventListener('keydown', (event) => {
    const list = items();
    const at = list.indexOf(doc.activeElement as HTMLButtonElement);
    const go = (i: number): void => {
      event.preventDefault();
      list[(i + list.length) % list.length]?.focus();
    };
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      closeMenu(true);
    } else if (event.key === 'ArrowDown' || (event.key === 'Tab' && !event.shiftKey)) go(at + 1);
    else if (event.key === 'ArrowUp' || (event.key === 'Tab' && event.shiftKey)) go(at - 1);
    else if (event.key === 'Home') go(0);
    else if (event.key === 'End') go(list.length - 1);
  });
  doc.addEventListener('pointerdown', (event) => {
    const target = event.target as Node | null;
    if (!menu.hidden && target && !menu.contains(target) && !more.contains(target)) closeMenu(false);
  });

  function focusTrigger(trigger: HTMLElement): void {
    if (!trigger.isConnected) return;
    if (visible(trigger)) trigger.focus();
    else if (visible(more)) more.focus();
  }

  // The notice area: the watch note (always built; it hides itself with nothing to say) and,
  // per document, Compare's status line.
  const notices = doc.createElement('div');
  notices.className = 'peekover-app__notices';
  const statusSlot = doc.createElement('div');
  statusSlot.className = `${C}__status`;
  // 4.5 (D-8) — the one-time snapshot notice: the capture disclosure's own words, a "Stored data"
  // link and "Got it". Shown while the open document is watched with capture on, until dismissed;
  // the Stored data panel carries the same clauses permanently. `role="status"`, in the page flow.
  const notice = doc.createElement('div');
  notice.className = `${C}__notice`;
  notice.setAttribute('role', 'status');
  notice.hidden = true;
  const noticeText = doc.createElement('p');
  const storedLink = doc.createElement('button');
  storedLink.type = 'button';
  storedLink.className = `${C}__notice-link`;
  storedLink.textContent = 'Stored data';
  noticeText.append(`${DISCLOSURE_TEXT} `, storedLink);
  const gotIt = doc.createElement('button');
  gotIt.type = 'button';
  gotIt.className = `${C}__notice-ok`;
  gotIt.textContent = 'Got it';
  notice.append(noticeText, gotIt);
  let wiring: SnapshotNoticeWiring | null = null;
  storedLink.addEventListener('click', () => wiring?.openStoredData());
  gotIt.addEventListener('click', () => {
    wiring?.dismiss();
    refreshNotices();
  });
  // 4.5 (ruling D) — the remote-images load bar, adopted from the reader on the app page.
  const loadSlot = doc.createElement('div');
  loadSlot.className = `${C}__load`;
  notices.append(notice, buildWatchNote(), loadSlot, statusSlot);
  let comparePill: HTMLButtonElement | null = null;
  let compareStatus: HTMLElement | null = null;
  // 4.5 (the human's ruling on census C130): Compare's picker drops in a box of its own, and WHILE THE PICKER IS
  // OPEN its status line sits in that box, directly under the list — a half-empty picker's sentence ("no other
  // markdown file…") is never covered by the list it explains, at any width. With the picker closed (a diff on
  // screen, a failure, both-empty) the status speaks from the notice area. Same element either way; it moves.
  const drop = doc.createElement('div');
  drop.className = `${C}__drop`;
  drop.hidden = true;
  let pickerEl: HTMLElement | null = null;
  const placeStatus = (): void => {
    const open = !!pickerEl && !pickerEl.hidden;
    drop.hidden = !open;
    if (!compareStatus) return;
    const home = open ? drop : statusSlot;
    if (compareStatus.parentElement !== home) home.append(compareStatus);
  };
  const pickerWatch = new MutationObserver(placeStatus);

  let host: HTMLElement | null = null;
  let editState: EditState = 'rest';
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

  function refreshNotices(): void {
    const watching = host?.getAttribute('data-watch') === 'active';
    notice.hidden = !(wiring && watching && wiring.captureOn() && !wiring.dismissed());
  }

  function adoptChrome(from: HTMLElement): void {
    if (from !== host) return;
    const bar = from.shadowRoot?.querySelector('.peekover-remote-load');
    loadSlot.replaceChildren(...(bar ? [bar] : []));
  }

  function sync(): void {
    refreshNotices();
    const mode = host?.getAttribute('data-mode') ?? null;
    // `data-diff="active"` is diffView's flag (its DIFF_HOST_ATTR); not imported — the diff import
    // fence keeps diffView appShell's alone (diffImportFence: Clause C).
    const diffOpen = host?.getAttribute('data-diff') === 'active';
    showDiffState(comparePill, diffOpen);
    if (!diffOpen && compareStatus && wasDiffOpen) {
      compareStatus.hidden = true;
      compareStatus.textContent = '';
    }
    wasDiffOpen = diffOpen;
    for (const b of buttons) {
      const usable = b.dataset.mode === 'edit' ? isEditable(host) : host !== null && mode !== null;
      b.disabled = !usable;
      b.setAttribute('aria-pressed', String(usable && b.dataset.mode === mode));
    }
    const edit = buttons[1];
    const label = EDIT_LABELS[mode === 'edit' ? 'editing' : editState];
    edit.textContent = label.text;
    edit.setAttribute('aria-label', label.name);
  }

  function setDocument(name: string | null, next: HTMLElement | null): void {
    file.textContent = name ?? '';
    file.hidden = name === null;
    if (name) file.title = name;
    else file.removeAttribute('title');
    observer.disconnect();
    host = next;
    editState = 'rest';
    const badge = host ? buildAgentBadge() : [];
    // The compact toolbar shows "Agent file" alone (the 3.1 addendum): the name after the
    // separator is wrapped so it can hide there. The text is unchanged.
    for (const node of badge) {
      const [label, ...rest] = (node.textContent ?? '').split(' · ');
      if (!rest.length) continue;
      const name = doc.createElement('span');
      name.className = `${C}__bname`;
      name.textContent = ` · ${rest.join(' · ')}`;
      node.textContent = label;
      node.appendChild(name);
    }
    badgeSlot.replaceChildren(...badge);
    renderWatch();
    const [pill, picker, status] = host ? buildDiffChrome(host) : [];
    comparePill = pill instanceof HTMLButtonElement ? pill : null;
    compareStatus = status instanceof HTMLElement ? status : null;
    pickerWatch.disconnect();
    pickerEl = picker instanceof HTMLElement ? picker : null;
    drop.replaceChildren(...(pickerEl ? [pickerEl] : []));
    compareSlot.replaceChildren(...(pill ? [pill, drop] : []));
    statusSlot.replaceChildren(...(compareStatus ? [compareStatus] : []));
    if (pickerEl) pickerWatch.observe(pickerEl, { attributes: true, attributeFilter: ['hidden'] });
    placeStatus();
    wasDiffOpen = false;
    loadSlot.replaceChildren();
    if (host) adoptChrome(host);
    if (host) observer.observe(host, { attributes: true, attributeFilter: ['data-mode', 'data-watch', 'data-diff'] });
    sync();
  }

  // 0.1.1 — Watch unavailable on this route: the control the user knows, unavailable, and why (never a silent gap).
  let watchReason: string | null = null;
  const reasonId = `${C}-watch-why-${(toolbarCount += 1)}`;
  function renderWatch(): void {
    const watch = host ? buildWatchControl(host) : null;
    if (watch || !host || watchReason === null) {
      watchSlot.replaceChildren(...(watch ? [watch] : []));
      return;
    }
    const off = doc.createElement('button');
    off.type = 'button';
    off.className = WATCH_CONTROL_CLASS;
    off.setAttribute('aria-disabled', 'true');
    off.setAttribute('aria-describedby', reasonId);
    const dot = doc.createElement('span');
    dot.className = `${WATCH_CONTROL_CLASS}__dot`;
    dot.setAttribute('aria-hidden', 'true');
    const text = doc.createElement('span');
    text.className = `${WATCH_CONTROL_CLASS}__text`;
    text.textContent = 'Watch this file';
    off.append(dot, text);
    const why = doc.createElement('span');
    why.id = reasonId;
    why.className = `${C}__watch-why`;
    why.textContent = watchReason;
    watchSlot.replaceChildren(off, why);
  }

  sync();
  return {
    element,
    setWatchUnavailable: (reason) => {
      watchReason = reason;
      renderWatch();
    },
    editSegment: buttons[1],
    filesButton,
    setDocument,
    notices,
    addAppControl,
    focusTrigger,
    adoptChrome,
    configureSnapshotNotice: (w) => {
      wiring = w;
      refreshNotices();
    },
    refreshNotices,
  };
}

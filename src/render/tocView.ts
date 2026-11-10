// tocView — DOM chrome for the TOC. Turns the PURE nested `TocEntry[]` (tocModel.ts)
// into a right-side navigation rail committed alongside the mode-toggle/network pills
// through the ONE mount() seam. Spec 003 §3, plan §3-#6 (right rail), §3-#7 (a11y).
//
// This is the DOM half of the same pure/DOM split M1 used for classifyReaderOutcome and
// M2 for tree/treeView: `tocModel` decides structure, `tocView` renders it and re-derives
// none of it. In particular the scroll TARGET is not re-derived here — each entry button
// carries the EXACT `entry.headingRef` node from the model, stored in a module-level
// WeakMap (button → heading). 3.1's scroll handler reads that same stored ref via
// `tocHeadingRef`, so there is ONE ref, not two derivations, and 2.1's jsdom identity
// test guards the very node the real-engine handler will scroll to (M1/M2 retro rule: a
// green test must exercise the real mechanism, not one beside it).
//
// a11y is a `nav` landmark wrapping a nested `<ol>` of `<button>` entries — the ARIA-APG
// "wayfinding navigation" pattern, NOT `role=tree` (that is the folder treeView's
// selection widget). Current section is marked `aria-current="location"` by the scroll-spy
// (3.2); the buttons here support it. Focus reuses the reader's existing `:host
// :focus-visible` ring — no new focus CSS.
//
// SCOPE (tasks 2.1–3.4): this module builds the rail, wires the LOCAL collapse toggle
// (2.1), the backtick shortcut + host registry (2.3), the entry click/Enter →
// `scrollIntoView` of the button's carried heading ref (3.1), the scroll-spy that marks the
// section being read (3.2), and the pointer-drag resizer that rewrites the per-view --toc-w
// (3.4). It carries no CSS (2.2, readerCss.ts). It never touches `location`/`history`/
// `pushState` — entries navigate by scrolling a ref, not by URL (spec In-scope "URL untouched").

import type { TocEntry } from './tocModel';
import { currentSettings, onSettingsChange, saveSettings } from '../settings/settingsSeam';
import { resolveScrollContainer } from './scrollContainer';

/** Options threaded from mount(). `contained` = the app-page reader pane (vs the full-page
 *  content-script takeover). In 2.1 this is STRUCTURAL only — reflected as a marker on the
 *  rail so the contained stylesheet (CONTAINED_CSS, added in 2.2) can flip the rail's
 *  position:fixed→absolute the same way it does the existing pills. No CSS lives here. */
export interface TocViewOptions {
  contained?: boolean;
}

/**
 * The scroll target for each entry button, keyed by the button element. Set HERE in 2.1 as
 * the SINGLE source of truth: `buildTocView` stores `entry.headingRef` (the exact model
 * node) against its button, and both 3.1's scroll handler and 2.1's identity test read it
 * back through `tocHeadingRef`. A WeakMap (not a DOM attribute) keeps the ref an Element,
 * not a stringified id, and lets it be GC'd with the button.
 */
const headingByButton = new WeakMap<HTMLElement, Element>();

/** The exact heading node an entry button navigates to — the ref stored at build time.
 *  3.1's `scrollIntoView` reads THIS (never a re-derived node); the identity test asserts
 *  it `===` the model's `headingRef`. Undefined for any element that is not a TOC entry. */
export function tocHeadingRef(button: HTMLElement): Element | undefined {
  return headingByButton.get(button);
}

/**
 * The reader-scrollport width (px) at or above which the rail starts OPEN; below it, the
 * rail starts collapsed-to-a-toggle. A DESIGN value (spec §3-#6: "open on a wide `:host`
 * scrollport, collapsed on a narrow one"), not a measured perf gate. The narrower app-page
 * pane therefore starts collapsed more often, from this one rule.
 */
const WIDE_SCROLLPORT_PX = 720;

/**
 * The documented default open/collapsed state used ONLY when a real, laid-out width is not
 * yet available (build runs pre-commit; jsdom has no layout at all — see Defect 2 below). We
 * default to OPEN, NOT collapsed: the rail is a harmless right-side sibling that never
 * disturbs the reading column, the common surface (a wide desktop content-script takeover)
 * wants it open, and the always-reachable opener makes a wrong guess recoverable in one
 * click. The width-driven decision then overrides this on the next frame once layout exists.
 * The default is a deliberate choice, never the old "collapsed because the width read as 0".
 */
const DEFAULT_TOC_OPEN = true;

/**
 * PURE width→initial-state rule: open when the reader's own scrollport is wide. Exported so
 * it is unit-checkable with an INJECTED width — jsdom has no layout (`getBoundingClientRect`
 * is all-zero), so the real measurement (`readScrollportWidth` below) is jsdom-blind and
 * rides to the real-engine/human gate, while this rule itself is asserted directly.
 */
export function initialTocOpen(scrollportWidth: number): boolean {
  return scrollportWidth >= WIDE_SCROLLPORT_PX;
}

/** The reader's own `:host` scrollport width. jsdom-blind (returns 0 with no layout) — the
 *  real value only exists in a laid-out engine, so the width→state DECISION is factored into
 *  the pure `initialTocOpen` above and this reader is not asserted in the jsdom test. */
function readScrollportWidth(host: HTMLElement): number {
  const rect = typeof host.getBoundingClientRect === 'function' ? host.getBoundingClientRect() : null;
  return rect ? rect.width : 0;
}

/** Total headings across the nested model (pre-order count). The threshold-omit decision is
 *  on the TOTAL, not top-level rows: one h1 with one nested h2 is TWO headings → a rail, even
 *  though `model.length` is 1. */
function countHeadings(entries: TocEntry[]): number {
  let n = 0;
  for (const e of entries) n += 1 + countHeadings(e.children);
  return n;
}

/** The heading refs flattened in document (pre-order) order — parent before its children,
 *  exactly the order buildList emits the `.peekover-toc__link` buttons. So zipping this with
 *  the nav's links (below, in buildTocView) pairs each entry button with its own heading, one
 *  per entry, for the scroll-spy (3.2). */
function flattenHeadings(entries: TocEntry[]): Element[] {
  const out: Element[] = [];
  for (const e of entries) {
    out.push(e.headingRef);
    out.push(...flattenHeadings(e.children));
  }
  return out;
}

/** Build one nested `<ol>` of entries. Recurses for children so document nesting becomes
 *  list nesting (the a11y nested-list structure). */
function buildList(entries: TocEntry[]): HTMLOListElement {
  const ol = document.createElement('ol');
  ol.className = 'peekover-toc__list';
  for (const entry of entries) ol.append(buildItem(entry));
  return ol;
}

/**
 * Build one entry `<li>`: a row with the entry `<button>` (and, when the entry has
 * children, a leading disclosure `<button aria-expanded>`), followed by the nested child
 * `<ol>`. The disclosure's LOCAL collapse toggle is wired here — jsdom-testable: it flips
 * `aria-expanded` and toggles the child list's `hidden`, hiding/showing exactly that
 * subtree with no scroll, no engine, no URL.
 */
function buildItem(entry: TocEntry): HTMLLIElement {
  const li = document.createElement('li');
  li.className = 'peekover-toc__item';
  li.dataset.level = String(entry.level); // structural depth hint for the rail's indent CSS (2.2)

  const row = document.createElement('div');
  row.className = 'peekover-toc__row';

  const hasChildren = entry.children.length > 0;
  const childList = hasChildren ? buildList(entry.children) : null;

  if (childList) {
    const twist = document.createElement('button');
    twist.type = 'button';
    twist.className = 'peekover-toc__twist';
    twist.setAttribute('aria-expanded', 'true');
    twist.setAttribute('aria-label', 'Collapse section');
    twist.addEventListener('click', () => {
      const expanded = twist.getAttribute('aria-expanded') === 'true';
      const next = !expanded;
      twist.setAttribute('aria-expanded', String(next));
      twist.setAttribute('aria-label', next ? 'Collapse section' : 'Expand section');
      childList.hidden = !next; // collapse hides this subtree; expand shows it
    });
    row.append(twist);
  }

  const link = document.createElement('button');
  link.type = 'button';
  link.className = 'peekover-toc__link';
  // Label is TEXT ONLY. The string is already computed by the model (textContent-derived);
  // assigning it via `.textContent` guarantees no HTML-string ever reaches the DOM here —
  // any `<`/`>` in a heading renders as literal text, never parsed markup (AGENTS.md #3).
  link.textContent = entry.label;
  // Carry the EXACT model heading node (single source of truth for 3.1's scroll target).
  headingByButton.set(link, entry.headingRef);
  // Task 3.1 — click/Enter/Space → scroll to that heading. The target is read back through
  // `tocHeadingRef(link)`, i.e. the SAME WeakMap ref just stored above (and the very node
  // 2.1's jsdom identity test asserts) — NOT a node re-derived from the DOM here. So there
  // is one ref, one derivation, and the identity test genuinely guards this scroll target
  // (M1/M2 retro rule). `scrollIntoView({block:'start'})` is called with NO `behavior` arg,
  // so the reader's `:host{scroll-behavior}` rule governs — smooth normally, `auto` under
  // prefers-reduced-motion (readerCss.ts, 2.2) — and the top-chrome offset is the CSS
  // `scroll-margin-top` on h1..h6, never JS pixel math (plan §3-#2). The heading lives in
  // the same shadow tree as this button; its nearest scrollable ancestor is the reader's
  // `:host` (overflow:auto), the scroll box on BOTH surfaces. No `location`/`history`/
  // `pushState` — this navigates by scrolling a ref, never by URL (spec "URL untouched").
  // A <button> fires click on Enter and Space for free, so keyboard activation needs no
  // separate handler.
  link.addEventListener('click', () => {
    const target = tocHeadingRef(link);
    // Guard the call itself, not just the ref: a click handler must never throw (a thrown
    // listener is swallowed by the engine but noisy, and jsdom — where 2.1's URL-untouched
    // test activates entries — implements no `scrollIntoView` at all). In every real engine
    // the method exists, so this only affects layout-blind environments.
    if (target && typeof target.scrollIntoView === 'function') {
      target.scrollIntoView({ block: 'start' });
    }
  });
  row.append(link);

  li.append(row);
  if (childList) li.append(childList);
  return li;
}

/**
 * The collapsed rail's tick column (013 task 5.2; G-12; `design/mockup.html:91–93`): one short bar per entry, in
 * the same pre-order as the entry buttons, so the scroll-spy marks tick i with entry i. DECORATIVE ONLY — the
 * column is `aria-hidden`, holds no text and nothing focusable, and takes no pointer (no hover card): the
 * opener stays the one control. Shown only while collapsed (readerCss.ts keys it off the opener's
 * `aria-expanded`, the state `setTocOpen` keeps in lockstep with `data-toc`).
 */
function buildTicks(entries: TocEntry[]): HTMLElement {
  const column = document.createElement('div');
  column.className = 'peekover-toc__ticks';
  column.setAttribute('aria-hidden', 'true');
  const add = (list: TocEntry[], depth: number): void => {
    for (const e of list) {
      const tick = document.createElement('span');
      tick.className = 'peekover-toc__tick';
      if (depth > 0) tick.dataset.nested = '';
      column.append(tick);
      add(e.children, depth + 1);
    }
  };
  add(entries, 0);
  return column;
}

/** Reflect the rail's open/collapsed state as `data-toc` on the host AND keep the opener's
 *  `aria-expanded` in lockstep — the single writer of both, so the visible chrome, the CSS
 *  key, and the a11y state can never drift. No scroll, no `location`/`history`.
 *
 *  DELIBERATELY DOES NOT PERSIST (task 6.1, decision D-G). This one writer serves THREE callers:
 *  the opener, the backtick shortcut, and — new in 6.1 — the restore path that applies a stored
 *  value. Saving here would make restoring a stored value immediately re-save it: a pointless
 *  write, and a live echo/race against a `load()` still in flight. "The user changed it" and "we
 *  restored what was already stored" are therefore SEPARATE call paths (`setTocOpenByUser`
 *  below), not one path with a suppression flag. */
function setTocOpen(host: HTMLElement, opener: HTMLButtonElement, open: boolean): void {
  host.setAttribute('data-toc', open ? 'open' : 'collapsed');
  syncExpanded(host, opener);
}

// ── M13 walk fix 8.1i (a): THE NARROW SHEET ────────────────────────────────────────────────────
// At or below the compact toolbar's breakpoint the opener sits in the document flow above the
// title (readerCss.ts), and opening shows the list as a full-screen SHEET over the page instead of
// a rail beside a narrowed column. The sheet is its own host attribute, NOT `data-toc`: `data-toc`
// is the remembered, persisted rail state (6.1, one global preference), and a phone-width glance
// at the contents must neither be saved nor be re-opened as a sheet on the next load. So at narrow
// widths `data-toc` is ignored by the CSS and only `data-toc-sheet` opens anything; crossing the
// breakpoint closes the sheet and the remembered state shows again. `aria-expanded` follows
// whichever of the two is on screen.

/** The compact toolbar's breakpoint (appShell.ts: ≤ 863 px) — the same line readerCss.ts keys on. */
const NARROW_QUERY = '(max-width:863px)';
const SHEET_ATTR = 'data-toc-sheet';
const isNarrow = (): boolean => typeof matchMedia === 'function' && matchMedia(NARROW_QUERY).matches;

/** The opener's `aria-expanded`: the sheet at narrow widths, the rail otherwise. */
function syncExpanded(host: HTMLElement, opener: HTMLButtonElement): void {
  opener.setAttribute('aria-expanded', String(isNarrow() ? host.hasAttribute(SHEET_ATTR) : host.getAttribute('data-toc') === 'open'));
}

/** Open or close the narrow sheet. With `focus`, opening moves focus into the list (the entry
 *  being read, else the first) and closing returns it to the opener without scrolling the page. */
function setSheet(host: HTMLElement, open: boolean, focus = true): void {
  const opener = tocOpenerFor(host);
  if (!opener) return;
  if (open) host.setAttribute(SHEET_ATTR, 'open');
  else host.removeAttribute(SHEET_ATTR);
  syncExpanded(host, opener);
  if (!focus) return;
  const root = host.shadowRoot!;
  if (open) (root.querySelector<HTMLElement>('.peekover-toc__link[aria-current]') ?? root.querySelector<HTMLElement>('.peekover-toc__link'))?.focus();
  else opener.focus({ preventScroll: true });
}

/** The user's toggle (the opener, the backtick): the sheet at narrow widths, the rail otherwise. */
function toggleByUser(host: HTMLElement, opener: HTMLButtonElement): void {
  if (isNarrow()) setSheet(host, !host.hasAttribute(SHEET_ATTR));
  else setTocOpenByUser(host, opener, host.getAttribute('data-toc') !== 'open');
}

/** The USER-INITIATED half of the open/collapsed change (task 6.1): apply it through the single
 *  writer above, then persist it. Both user entry points call this — the opener click and the
 *  backtick shortcut — so the two cannot drift in what they remember. The restore path calls
 *  `setTocOpen` directly and stays silent (decision D-G).
 *
 *  Persistence is best-effort and never gates the visible flip: `saveSettings` is a no-op with no
 *  sink registered, and the port swallows storage failures. */
function setTocOpenByUser(host: HTMLElement, opener: HTMLButtonElement, open: boolean): void {
  setTocOpen(host, opener, open);
  saveSettings({ tocOpen: open });
}

/** A host's live rail opener — the exact node `setTocOpen` keeps in lockstep with `data-toc`.
 *  `null` when the host currently has no rail (a <2-heading re-render, or the never-blank raw
 *  fallback). One accessor so the backtick resolver and 6.1's late restore agree on what "has a
 *  rail" means. */
function tocOpenerFor(host: HTMLElement): HTMLButtonElement | null {
  return host.shadowRoot?.querySelector<HTMLButtonElement>('button.peekover-toc__toggle') ?? null;
}

/**
 * Build the ALWAYS-PRESENT opener/handle that heads the rail. It is the SINGLE control that
 * flips the host between `data-toc="open"` and `"collapsed"`, and — crucially — it lives
 * INSIDE `.peekover-toc` but OUTSIDE the collapsible list body, so `data-toc="collapsed"`
 * hides only the list (2.2 CSS) while this handle stays visible and clickable. That closes
 * the ship-dark "collapsed rail is unreachable" defect: on a narrow pane the rail starts
 * collapsed to just this labeled handle, never erased with no way back.
 *
 * A plain `<button>` → keyboard-focusable with no tabindex hack; its text ("On this page")
 * is the accessible name and `aria-expanded` mirrors the open state (standard disclosure).
 * Click toggles both ways (open⇄collapsed) — no scroll, no URL, no network.
 */
function buildOpener(host: HTMLElement): HTMLButtonElement {
  const opener = document.createElement('button');
  opener.type = 'button';
  opener.className = 'peekover-toc__toggle';
  opener.textContent = 'On this page';
  opener.setAttribute('aria-expanded', String(DEFAULT_TOC_OPEN));
  opener.addEventListener('click', () => toggleByUser(host, opener));
  return opener;
}

// ───────────────────────────────────────────────────────────────────────────
// Task 3.4 — resize drag: a pointer-draggable handle on the rail's inner edge rewrites the
// per-view --toc-w custom property on the host. Real-engine only for the geometry (jsdom has no
// pointer coordinates or layout); the handlers below never run in the jsdom shape tests (no
// pointer events are dispatched there), so building the handle stays jsdom-safe.

/** The rail's default width in px — a verbatim mirror of readerCss.ts's `:host{--toc-w:250px}`.
 *  Used as the drag's starting width when the computed property can't be read. */
const DEFAULT_TOC_W = 250;

/** Min/max the drag clamps --toc-w to (px). DESIGN values (spec §3-#6 "the document stays the
 *  hero"), not measured perf gates: 180 keeps entry labels readable at the narrow end; 480 keeps
 *  the reading column dominant at the wide end (well under the rail's CSS `max-width:38vw` ceiling
 *  on a typical viewport). Exported so the real-engine clamp test asserts the EXACT bounds rather
 *  than magic numbers — dragging past a bound clamps here, never collapses to nothing or eats the
 *  viewport. */
export const TOC_MIN_WIDTH = 180;
export const TOC_MAX_WIDTH = 480;

/**
 * Clamp a candidate rail width to [TOC_MIN_WIDTH, TOC_MAX_WIDTH].
 *
 * Used by BOTH the live drag and 6.1's restore-from-persistence path, and exported for the latter:
 * a stored width is untrusted input in a way a live drag is not. The drag can only produce values
 * this same function already bounded, but a stored row can hold anything — a corrupted value, a
 * hand-edited DB, or a width written by a FUTURE build whose TOC_MIN/MAX differ from this build's.
 * Clamping on the way IN means such a value narrows the rail to a sane edge instead of collapsing
 * the reading column or eating the viewport. Pure and total (a non-finite input yields
 * TOC_MIN_WIDTH via Math.min/Math.max's NaN propagation being caught by the caller's guard), so it
 * is the one piece of 6.1 that is genuinely jsdom-unit-testable.
 */
export function clampTocWidth(px: number): number {
  return Math.max(TOC_MIN_WIDTH, Math.min(TOC_MAX_WIDTH, px));
}

/** The host's current --toc-w in px, resolved from computed style (the `:host` default or a prior
 *  drag's inline override), falling back to the CSS default if unreadable. */
function currentTocWidth(host: HTMLElement): number {
  const read =
    typeof getComputedStyle === 'function'
      ? parseFloat(getComputedStyle(host).getPropertyValue('--toc-w'))
      : Number.NaN;
  return Number.isFinite(read) ? read : DEFAULT_TOC_W;
}

/**
 * The resize handle: a thin grab strip on the rail's INNER (left) edge (styled by
 * `.peekover-toc__resizer`, added to readerCss.ts in 2.2 — 3.4 wires the drag onto it, adding
 * no CSS). A pointer drag rewrites `--toc-w` on the host, clamped to [TOC_MIN_WIDTH,
 * TOC_MAX_WIDTH]. The rail is anchored to the viewport's RIGHT edge, so moving the pointer LEFT
 * (outward) WIDENS it and RIGHT (inward) NARROWS it: `width = startWidth − (clientX − startX)`.
 *
 * PER VIEW ONLY — the width is an inline style on the host, NEVER written to storage/IndexedDB
 * (persistence is spec 004); no store.ts/idbCore.ts is touched. Pointer events +
 * setPointerCapture (standard resizer practice) route move/up to the handle even when the
 * pointer leaves it — but setPointerCapture throws for a pointerId with no active pointer (e.g. a
 * synthetically dispatched event), so it is guarded; the handler must never throw.
 *
 * NO leak on teardown: every listener is on THIS resizer element (never document/window), so a
 * rebuild — which replaces the whole rail via mount()'s `replaceChildren` — drops the old resizer
 * and its listeners together for GC (removing a captured element also releases its capture), and a
 * `!resizer.isConnected` guard bails a drag caught in flight across a rebuild (the same isConnected
 * liveness discipline the rAF guard, scroll-spy self-heal, and host registry use). Unlike the
 * scroll-spy — whose observer + scroll listener attach to a PERSISTENT external scroll container
 * and therefore need `teardownScrollSpy` — the resizer owns only its own ephemeral node, so it
 * self-cleans and needs no registry seam. No scroll, URL, history, or network: the drag rewrites
 * ONE CSS custom property and nothing else.
 */
function buildResizer(host: HTMLElement): HTMLElement {
  const resizer = document.createElement('div');
  resizer.className = 'peekover-toc__resizer';
  resizer.setAttribute('role', 'separator');
  resizer.setAttribute('aria-orientation', 'vertical');
  resizer.setAttribute('aria-label', 'Resize table of contents');

  let dragging = false;
  let startX = 0;
  let startWidth = DEFAULT_TOC_W;

  resizer.addEventListener('pointerdown', (e: PointerEvent) => {
    dragging = true;
    startX = e.clientX;
    startWidth = currentTocWidth(host);
    try {
      resizer.setPointerCapture(e.pointerId);
    } catch {
      /* no active pointer (e.g. a synthetic event) — capture is a nicety, not required */
    }
    e.preventDefault(); // suppress text-selection / focus side effects during the drag
  });

  resizer.addEventListener('pointermove', (e: PointerEvent) => {
    if (!dragging) return;
    if (!resizer.isConnected) {
      dragging = false; // rail rebuilt mid-drag — bail rather than write to a stale node
      return;
    }
    host.style.setProperty('--toc-w', `${clampTocWidth(startWidth - (e.clientX - startX))}px`);
  });

  const end = (e: PointerEvent): void => {
    if (!dragging) return;
    dragging = false;
    try {
      resizer.releasePointerCapture(e.pointerId);
    } catch {
      /* capture was never established (guarded above) — nothing to release */
    }
    // PERSIST ON DRAG END ONLY (task 6.1, decision D-H). `pointermove` above rewrites --toc-w on
    // every pointer sample — dozens to hundreds per drag — so saving there would fire that many
    // writes through the port and, on the content-script surface, that many runtime messages to
    // the background, for one user gesture with one meaningful outcome. The `if (!dragging)` guard
    // above also makes this fire exactly ONCE per drag: pointerup and pointercancel share this
    // handler, and the second of them (or a stray one with no drag in progress) returns early.
    // The value read back is the committed one the moves already clamped; clamped again so a
    // host whose --toc-w came from somewhere other than this drag cannot store an out-of-range
    // width. Best-effort, and it never gates the visible size.
    saveSettings({ tocWidth: clampTocWidth(currentTocWidth(host)) });
  };
  resizer.addEventListener('pointerup', end);
  resizer.addEventListener('pointercancel', end);

  return resizer;
}

/**
 * Apply a persisted rail width (task 6.1), or do nothing when there is none. `null` means "never
 * set" and MUST leave the CSS default (`:host{--toc-w:250px}`) in place — writing an inline
 * property for an unset value would pin the rail against any future default change.
 *
 * CLAMPED on the way in (see `clampTocWidth`): a stored value outside this build's bounds is
 * brought to the nearest edge, never applied raw. A non-finite stored value (a corrupted row) is
 * rejected outright rather than clamped, because `clampTocWidth(NaN)` is NaN — which would write
 * the literal string "NaNpx" and silently kill the whole custom property.
 */
function applyStoredTocWidth(host: HTMLElement, stored: number | null): void {
  if (stored === null || !Number.isFinite(stored)) return;
  host.style.setProperty('--toc-w', `${clampTocWidth(stored)}px`);
}

// ── TASK 6.1 — LATE ARRIVAL ────────────────────────────────────────────────────────────────
//
// On a cold start the settings land AFTER the mount commits (group 4's MEASURED behaviour, not a
// guess: `resolved` at ~21 ms warm but the rail is built inside a mount that commits at ~60 ms,
// and on cold starts the reply waits for a main-thread yield). So the rail is normally built
// against `DEFAULT_SETTINGS` — both TOC fields `null` — and the persisted state arrives one turn
// later.
//
// IT IS APPLIED WHEN IT ARRIVES, not deferred to the next render, for the same reason the theme
// is: deferring means the remembered state does not appear on the open the user is looking at,
// only on the NEXT one. For the theme that would be a visible flash; for the TOC it would be
// worse — the content-script surface renders a document ONCE per navigation, so "the next render"
// may never come, and a user who collapsed the rail would find it open on every single open
// forever. That is indistinguishable from the feature not working.
//
// The re-open direction is the visible cost and it is accepted deliberately: a rail built open by
// the width default, whose stored state is `collapsed`, will collapse a frame or two after paint.
// That is the same instant-correction trade D-2 settled for the theme (an instant swap, no
// cross-fade), it moves chrome rather than the reading column's text, and the alternative —
// gating the mount on the settings — is exactly what task 4.2 measured, failed against the
// <150 ms budget, and removed. Whether the correction is perceptible is an 8.1 eyeball item.
//
// LIVENESS is the same `isConnected` discipline the rAF guard, the scroll-spy self-heal and the
// host registry already use, reached through the SAME registry: `tocHosts` prunes dead hosts, and
// `tocOpenerFor` returns null for a connected-but-rail-less host, so a restore can never write to
// a detached node or a reader whose rail was replaced by the never-blank raw fallback.
//
// ONE module-level subscription, never one per rail — mount() rebuilds its chrome on every render
// (replaceChildren drops the old rail), so a per-rail subscription would leak one listener per
// re-render. The verbatim themeControl/themeRegistry pattern.

let settingsSubscribed = false;

/** Subscribe ONCE to published settings, so a cold-start `load()` reaches rails already built. */
function ensureSettingsSubscribed(): void {
  if (settingsSubscribed) return;
  settingsSubscribed = true;
  // 8.1i (a): crossing the narrow breakpoint closes any sheet and re-derives `aria-expanded`.
  if (typeof matchMedia === 'function') {
    // Guarded per host (the 8.1i (f) follow-up's rule): a broken or removed reader is skipped, never thrown out of.
    matchMedia(NARROW_QUERY).addEventListener('change', () => {
      for (const host of tocHosts) {
        try {
          if (!host.isConnected) {
            tocHosts.delete(host);
            continue;
          }
          host.removeAttribute(SHEET_ATTR);
          const opener = tocOpenerFor(host);
          if (opener) syncExpanded(host, opener);
        } catch {
          // a reader whose shadow root cannot be read keeps its last state
        }
      }
    });
  }
  onSettingsChange((settings) => {
    for (const host of tocHosts) {
      if (!host.isConnected) {
        tocHosts.delete(host); // dead-node prune (deleting during Set iteration is safe)
        continue;
      }
      const opener = tocOpenerFor(host);
      if (!opener) continue; // connected but rail-less — nothing to restore onto
      // Restore path: silent, so applying what is already stored cannot echo back as a save (D-G).
      if (settings.tocOpen !== null) setTocOpen(host, opener, settings.tocOpen);
      applyStoredTocWidth(host, settings.tocWidth);
    }
  });
}

/**
 * Decide the initial open/collapsed state and reflect it — WITHOUT trusting a pre-layout
 * width read (Defect 2). `buildTocView` runs BEFORE mount()'s `replaceChildren` commits the
 * host and before any layout, so `readScrollportWidth(host)` is a guaranteed 0 here (and in
 * jsdom it is 0 forever) — feeding that to the rule yields a false "collapsed everywhere".
 *
 * So: if a real (>0) width already exists (an idempotent re-mount of an already-laid-out
 * host), use the pure rule now; otherwise set the documented DEFAULT synchronously and defer
 * the real width-driven decision to the next animation frame, when mount() has committed the
 * rail and the engine has laid the host out. rAF callbacks run before the next paint, so the
 * corrected state wins with no visible flash; in jsdom rAF's width is still 0, so the guard
 * leaves the default in place — stable and testable. The pure `initialTocOpen` rule is
 * untouched; only WHERE/WHEN it is fed a real width changed.
 */
function applyInitialTocState(host: HTMLElement, opener: HTMLButtonElement): void {
  // ── TASK 6.1 / DECISION D-F: A PERSISTED OPEN-STATE WINS OUTRIGHT, AND THE rAF IS NOT
  //    SCHEDULED AT ALL. ────────────────────────────────────────────────────────────────────
  //
  // This is the trap in 6.1 and it is silent. Applying a stored `tocOpen` here and then letting
  // the code below run would be a passing test and a broken product: `decide()` is re-run one
  // frame later against the real laid-out width and calls `setTocOpen(..., initialTocOpen(width))`,
  // which OVERWRITES the restored value with the width-derived default. A test asserting
  // `data-toc` immediately after build would never see it — the stomp lands a frame later. So the
  // real-engine tests assert AFTER two frames, and the rAF is not scheduled on this path at all
  // rather than merely being made to agree: nothing pending means nothing to race.
  //
  // WHY PERSISTED WINS rather than the two composing: the width rule is a GUESS made in the
  // absence of knowledge ("we have never been told, so infer from the viewport"), while a stored
  // value is the user's actual last choice. Spec §4 makes that choice a SINGLE GLOBAL preference,
  // so re-deriving it per viewport is precisely what "remembered" must not mean — a user who
  // collapsed the rail on a wide screen must find it collapsed, not re-opened by the width rule.
  // The opener is always present and one click away, so the remembered state is never a trap.
  const stored = currentSettings();
  if (stored.tocOpen !== null) {
    setTocOpen(host, opener, stored.tocOpen); // restore path — silent, never re-saves (D-G)
    applyStoredTocWidth(host, stored.tocWidth);
    return;
  }
  // No stored open-state → 003's behaviour EXACTLY as it was, untouched. This is the regression
  // guard: on a cold start `currentSettings()` is DEFAULT_SETTINGS (both fields null) until the
  // entrypoint's `load()` publishes, so this is also the normal first-render path, with the real
  // value arriving through `onSettingsChange` below.
  applyStoredTocWidth(host, stored.tocWidth); // width is independent of open-state; restore it either way
  const decide = () => {
    // The OTHER half of D-F's stomp guard, for the narrow race the early return above cannot
    // cover: this rail was built with nothing stored (so the rAF below WAS scheduled), and the
    // settings then published in the window before that frame ran. The late-arrival subscriber
    // has already restored the real state onto this rail — so re-deriving from width here would
    // stomp it, one frame after it was correctly applied. Re-read the seam at DECISION time (not
    // at build time) and stand down if a stored value now exists. Cheap, synchronous, and it makes
    // the width rule strictly "the default when nothing is remembered", at every point it runs.
    if (currentSettings().tocOpen !== null) return;
    const width = readScrollportWidth(host);
    if (width > 0) setTocOpen(host, opener, initialTocOpen(width));
    else if (!host.hasAttribute('data-toc')) setTocOpen(host, opener, DEFAULT_TOC_OPEN);
  };
  decide(); // synchronous: real width if already laid out, else the documented default
  const raf = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : null;
  if (raf) {
    // Post-commit/post-layout correction (no-op in layout-blind jsdom). LIVENESS GUARD: mount()
    // is idempotent and re-renders into the same host — and the content-script path can REMOVE
    // the host on a failed/empty re-render — but nothing cancels this pending frame. A stale
    // frame that fires after teardown, or after a NEWER rail replaced this one, must not write
    // data-toc/aria-expanded onto a detached host or an orphaned opener. Bail if the rail is no
    // longer live (the same dead-node hazard 2.3's host registry prunes, arriving early via this
    // rAF closure). The synchronous decide() above is intentionally exempt: the host may
    // legitimately be pre-commit / not-yet-connected there, and it only sets the documented default.
    raf(() => {
      if (!host.isConnected || !opener.isConnected) return;
      decide();
    });
  }
}

/**
 * Build the TOC rail for a rendered reader, or `null` when it has no navigation value.
 *
 * Returns `null` at <2 headings (0 → no rail, 1 → no rail: a single-entry TOC is the F5/F6
 * graceful degradation, never a broken sidebar). At ≥2 it returns a right-side
 * `<nav aria-label="Table of contents">` headed by an always-present opener (see
 * `buildOpener`) and wrapping a nested `<ol>` of entry buttons; each button carries its
 * `entry.headingRef` (see `headingByButton`/`tocHeadingRef`).
 *
 * Side effects on `host` (which is why it is a param): the initial open/collapsed state is
 * reflected as `data-toc` — from a REAL scrollport width via the pure `initialTocOpen` when
 * one exists, else a documented default corrected on the next frame (`applyInitialTocState`;
 * Defect-2 fix). The opener flips that same attribute (2.3's backtick shortcut will flip it
 * too). No CSS, no scroll, no `location`/`history` mutation.
 */
export function buildTocView(
  host: HTMLElement,
  model: TocEntry[],
  options: TocViewOptions = {},
): Node | null {
  // A fresh render supersedes the previous rail: disconnect any prior scroll-spy for this host
  // BEFORE we decide rail-or-not, so a rail→no-rail re-render (dropping below 2 headings) also
  // tears the old observer down. Idempotent; no-op the first time (task 3.2 lifecycle).
  teardownScrollSpy(host);

  host.removeAttribute(SHEET_ATTR); // a fresh render starts with the narrow sheet closed (8.1i)
  if (countHeadings(model) < 2) return null; // threshold omit — no rail below 2 headings

  const nav = document.createElement('nav');
  nav.className = 'peekover-toc';
  nav.setAttribute('aria-label', 'Table of contents');
  // Structural marker for the contained stylesheet (2.2) — the fixed→absolute flip is CSS,
  // added there; here `contained` is threaded as a hook only, no styling.
  if (options.contained) nav.dataset.contained = '';

  // The always-visible opener heads the rail (survives the collapsed state); the collapsible
  // list body follows it. `data-toc="collapsed"` hides ONLY the list, never this handle. The
  // resize handle (3.4) is a position:absolute sibling on the rail's inner edge — DOM order is
  // immaterial to its placement, so it is appended last.
  const opener = buildOpener(host);
  const ticks = buildTicks(model);
  // 8.1i (a): the narrow sheet's Close (shown only while the sheet is open, readerCss.ts), and its
  // keys: Escape closes; Tab wraps inside the sheet, which covers the page; an entry closes it.
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'peekover-toc__close';
  close.textContent = 'Close';
  close.setAttribute('aria-label', 'Close contents');
  close.addEventListener('click', () => setSheet(host, false));
  nav.append(opener, close, ticks, buildList(model), buildResizer(host));
  nav.addEventListener('click', (e) => {
    if (host.hasAttribute(SHEET_ATTR) && (e.target as Element).closest?.('.peekover-toc__link')) setSheet(host, false);
  });
  nav.addEventListener('keydown', (e: KeyboardEvent) => {
    if (!host.hasAttribute(SHEET_ATTR)) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      setSheet(host, false);
    } else if (e.key === 'Tab') {
      const stops = [...nav.querySelectorAll<HTMLElement>('button')].filter((b) => b.getClientRects().length > 0);
      const edge = e.shiftKey ? stops[0] : stops[stops.length - 1];
      if (host.shadowRoot?.activeElement === edge) {
        e.preventDefault();
        (e.shiftKey ? stops[stops.length - 1] : stops[0]).focus();
      }
    }
  });

  // Task 6.1: subscribe ONCE (module-level) so a cold-start `load()` publishing after this mount
  // still reaches this rail — the normal path, not an edge case (see the LATE ARRIVAL note).
  ensureSettingsSubscribed();
  applyInitialTocState(host, opener);

  // Scroll-spy (3.2): pair each heading ref with its entry button and install the observer.
  // The model pre-order (flattenHeadings) matches the nav's `.peekover-toc__link` DOM order
  // one-for-one (buildList emits parent-then-children), so index i pairs the same entry.
  // querySelectorAll on the still-detached nav is fine — mount() commits it next, and the
  // observer only starts on the following frame (post-commit/post-layout) via installScrollSpy.
  const links = [...nav.querySelectorAll<HTMLElement>('button.peekover-toc__link')];
  const headings = flattenHeadings(model);
  const marks = [...ticks.children] as HTMLElement[];
  const pairs: SpyPair[] = links.map((link, i) => ({ heading: headings[i], link, tick: marks[i] }));
  installScrollSpy(host, pairs, options.contained === true);

  return nav;
}

// ───────────────────────────────────────────────────────────────────────────
// Task 3.2 — scroll-spy: ONE IntersectionObserver per rail, host-rooted on the reader's
// ACTUAL scroll container, marking the section being read with aria-current="location" +
// .is-active (the active-mark CSS hooks 2.2 already added). Real-engine only — jsdom has no
// IntersectionObserver and no layout (guarded below, the same way 3.1 guarded scrollIntoView).
//
// ROOT RESOLUTION is load-bearing and differs by surface (3.1's scroll-box fact). On the
// full-page content-script takeover, :host IS the scroll box (position:fixed; inset:0;
// overflow:auto — it always scrolls). In the app-page {contained} pane, :host sits in normal
// flow (CONTAINED_CSS) and grows to its content, so it never scrolls itself; the scrolling
// element is an ancestor pane (.peekover-app__reader, overflow:auto). A wrong root silently
// observes against the VIEWPORT and the spy tracks nothing (or everything) — so the container
// must be RESOLVED, never assumed to be :host. tasks.md 3.2 literally says "root: host … :host
// in both" — that predates 3.1's discovery; the parenthetical "proven, not assumed" is honored
// by proving the real container per surface, and the test asserts tracking on BOTH.

/** rootMargin for the spy's IntersectionObserver. Bottom -70% shrinks the observation root to
 *  its TOP 30%, so the observer fires as a heading crosses that near-top band — the cadence at
 *  which the current section changes. The active section is DETERMINED from live geometry in
 *  `recompute` (below), against an activation line at the same 30%-from-top (SPY_ACTIVATION_RATIO
 *  mirrors this -70%); the observer is the efficient TRIGGER, not the sole arbiter, because
 *  IntersectionObserver only reports when isIntersecting CHANGES — a fast scroll that jumps a
 *  heading clear across the thin band (not-intersecting-above → not-intersecting-below) fires no
 *  callback and would strand a snapshot-based flag. Live geometry is immune to that. */
const SPY_ROOT_MARGIN = '0px 0px -70% 0px';

/** The activation line as a fraction of the scrollport height from its top. 0.30 corresponds
 *  EXACTLY to SPY_ROOT_MARGIN's -70% bottom (rootBounds.bottom = boxTop + 0.30·clientHeight), so
 *  the observer's trigger band and the geometry we measure against share one line. MEASURED on
 *  the real many-section doc in tocScroll.browser.test.ts: at 30%, scrolling section N's heading
 *  to the top makes N — and only N — active while N+1 (≥1 viewport below) is not yet, a clean
 *  single-active handoff at every tested offset on both engines. A line nearer the very top
 *  delayed activation into the section; 30% tracked the reading position best without ever
 *  double-marking. */
const SPY_ACTIVATION_RATIO = 0.3;

/** px slack for "the scroll box is at its bottom" — fractional device-pixel scroll positions
 *  never land exactly on scrollHeight-clientHeight. Small, so only the true bottom promotes. */
const SPY_BOTTOM_EPS = 2;

// `scrollsVertically` + `resolveScrollContainer` MOVED to src/render/scrollContainer.ts at
// spec 005 task 3.1 — watch mode's reading-anchor is their second consumer, and the trap
// documented above (a wrong root silently observes the viewport and tracks nothing) is now
// recorded once, beside the code, instead of being re-derived per consumer. Imported at the
// top of this file; behaviour is unchanged by the move.

/** One TOC entry button paired with the exact heading node it tracks (both in document order). */
interface SpyPair {
  heading: Element;
  link: HTMLElement;
  /** The entry's decorative tick (013 task 5.2), marked with the link so the collapsed rail shows "here". */
  tick?: HTMLElement;
}

/** Per-host scroll-spy teardown. mount() re-renders into the SAME shadow root (idempotent), so a
 *  fresh rail must disconnect the previous rail's observer or it leaks — the same replaced-rail
 *  hazard the rAF liveness guard and the host registry already guard against. */
const spyByHost = new WeakMap<HTMLElement, () => void>();

/** Disconnect any live scroll-spy for `host` (idempotent). Called at the top of buildTocView so a
 *  new rail supersedes the old; the raw-fallback path never calls buildTocView, so that case is
 *  covered by the self-heal inside `recompute` (below) rather than a mount.ts hook — tasks.md 3.2
 *  scopes edits to tocView.ts + the test, not mount.ts. */
function teardownScrollSpy(host: HTMLElement): void {
  const t = spyByHost.get(host);
  if (t) {
    t();
    spyByHost.delete(host);
  }
}

/**
 * Install the scroll-spy for one rail; its teardown is registered in `spyByHost`. ONE
 * IntersectionObserver, rooted on the resolved scroll container, over the heading refs. It flips
 * aria-current="location" + .is-active onto EXACTLY ONE entry — the section currently being read.
 *
 * "Current" = the LAST heading whose top is at or above the activation line (30% from the
 * scrollport top). Reading that from LIVE getBoundingClientRect on each recompute — rather than a
 * per-heading "currently intersecting" flag — keeps a section active while the reader is IN it
 * (including the gaps between headings where none sits inside the thin band) AND is immune to
 * fast-scroll staleness (see SPY_ROOT_MARGIN). Headings are in document order, so their tops
 * increase down the page: the scan stops at the first one below the line.
 *
 * TRAILING-SECTION EDGE (plan §3-#3): the last section(s) can be too short to ever push their
 * heading up to the activation line, so "last passed" could never reach the final entry. When the
 * box is at (or within SPY_BOTTOM_EPS of) its bottom, the final entry is promoted, so the
 * highlight CAN reach the last section. A rAF-coalesced scroll listener drives this: the observer
 * does NOT fire at the absolute bottom when no heading crosses the line there, so the bottom is
 * detected from the scroll position itself.
 *
 * LIFECYCLE: `teardown` disconnects the observer, removes the scroll listener, and cancels any
 * pending frame. It runs when a rebuild supersedes this rail (teardownScrollSpy at the top of
 * buildTocView) and self-heals when the rail is torn down without a rebuild (the never-blank raw
 * fallback detaches the old headings → the next recompute sees a disconnected node and tears
 * itself down — the same isConnected discipline as the rAF guard and the registry). No scroll,
 * URL, history, or network: the spy only sets/removes an attribute + class, and the observer
 * issues no request (it watches layout).
 */
function installScrollSpy(host: HTMLElement, pairs: SpyPair[], contained: boolean): void {
  let observer: IntersectionObserver | null = null;
  let root: HTMLElement | null = null;
  let onScroll: (() => void) | null = null;
  let startRaf = 0;
  let scrollRaf = 0;
  let disposed = false;

  const cancel = typeof cancelAnimationFrame === 'function' ? cancelAnimationFrame : null;
  const schedule = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : null;

  const teardown = (): void => {
    disposed = true;
    if (cancel) {
      if (startRaf) cancel(startRaf);
      if (scrollRaf) cancel(scrollRaf);
    }
    startRaf = 0;
    scrollRaf = 0;
    if (observer) observer.disconnect();
    if (root && onScroll) root.removeEventListener('scroll', onScroll);
    observer = null;
    root = null;
    onScroll = null;
  };
  spyByHost.set(host, teardown);

  const start = (): void => {
    if (disposed || !host.isConnected) return;
    // Guard the observer construction where IntersectionObserver is absent (jsdom), exactly as
    // 3.1 guards scrollIntoView — so activating the rail in a unit test never throws.
    if (typeof IntersectionObserver === 'undefined') return;

    const box = resolveScrollContainer(host, contained);
    root = box;

    let activeIdx = -1;

    const setActive = (idx: number): void => {
      if (idx === activeIdx) return; // no DOM churn when the section hasn't changed
      activeIdx = idx;
      pairs.forEach((p, i) => {
        if (i === idx) {
          p.link.setAttribute('aria-current', 'location');
          p.link.classList.add('is-active');
          p.tick?.classList.add('is-here');
        } else {
          p.link.removeAttribute('aria-current');
          p.link.classList.remove('is-active');
          p.tick?.classList.remove('is-here');
        }
      });
    };

    const recompute = (): void => {
      if (disposed) return;
      // Self-heal for the raw-fallback path (which replaces the rail WITHOUT calling
      // buildTocView, so nothing else supersedes this spy): once the old headings/links are
      // detached, tear down instead of writing to dead nodes — the isConnected liveness the rAF
      // guard and the host registry already use.
      if (!host.isConnected || (pairs.length > 0 && !pairs[0].link.isConnected)) {
        teardown();
        return;
      }
      // The current section = the LAST heading whose top is at or above the activation line,
      // read from live geometry. Tops increase in document order, so stop at the first below.
      const lineY = box.getBoundingClientRect().top + box.clientHeight * SPY_ACTIVATION_RATIO;
      let idx = 0;
      for (let i = 0; i < pairs.length; i += 1) {
        if (pairs[i].heading.getBoundingClientRect().top <= lineY) idx = i;
        else break;
      }
      const atBottom = box.scrollHeight - box.clientHeight - box.scrollTop <= SPY_BOTTOM_EPS;
      if (atBottom) idx = pairs.length - 1; // trailing-section edge
      setActive(idx);
    };

    // ONE IntersectionObserver over the heading refs: it fires when a heading crosses the near-top
    // band and re-evaluates the current section from live geometry (recompute). It also catches
    // active-section changes that happen WITHOUT a scroll — a layout shift (late fonts/images
    // reflowing the column) moves headings under a still scroll position.
    observer = new IntersectionObserver(() => recompute(), {
      root: box,
      rootMargin: SPY_ROOT_MARGIN,
      threshold: 0,
    });
    for (const p of pairs) observer.observe(p.heading);

    // The observer does not fire at the ABSOLUTE bottom when no heading crosses the line there,
    // so a light rAF-coalesced scroll listener drives the trailing-edge promotion (and keeps the
    // mark responsive between intersection callbacks). Passive: it never blocks scrolling.
    onScroll = (): void => {
      if (scrollRaf) return;
      if (!schedule) {
        recompute();
        return;
      }
      scrollRaf = schedule(() => {
        scrollRaf = 0;
        recompute();
      });
    };
    box.addEventListener('scroll', onScroll, { passive: true });

    recompute(); // initial mark; observe()'s initial batch then refines `passed` from real layout
  };

  // Defer to the next frame so mount() has committed the rail and the engine has laid it out —
  // resolveScrollContainer and the intersection geometry both need the committed, laid-out DOM.
  if (schedule) startRaf = schedule(() => {
    startRaf = 0;
    start();
  });
}

// ───────────────────────────────────────────────────────────────────────────
// Task 2.3 — backtick toggle + host registry + de-register on teardown.
//
// A SECOND document-level shortcut, mirroring readerMode's installToggleShortcut EXACTLY
// (bare key, no Ctrl/Cmd/Alt, ignored in editable fields, preventDefault only after we
// decide to handle, idempotent install). The two never collide because each matches a
// different bare key — this one `` ` `` (TOC), readerMode's one `\` (Raw/Reading) — so a
// `\` press returns early here and a `` ` `` press returns early there.
//
// The key difference from readerMode is HOST RESOLUTION. readerMode can
// `document.querySelector('peekover-root')` because its shortcut only matters on the
// full-page content-script surface; the TOC ships on BOTH surfaces, and on the app page
// the reader host is a plain contained <div>, not a <peekover-root> (plan §Reality-pushback
// #1). So the active host is resolved from a module-level registry that mount() maintains,
// not from a tag query.

/** Hosts that currently have a composed TOC rail. mount() adds a host here when a rail is
 *  committed and removes it when the rail is gone (a <2-heading re-render, or the raw
 *  fallback replacing the rail with banner+<pre>). The resolver additionally prunes any
 *  disconnected host before resolving, so a torn-down reader can NEVER be toggled — the
 *  same dead-node discipline the rAF liveness guard uses (applyInitialTocState), applied
 *  to the "last-registered host" fallback. */
const tocHosts = new Set<HTMLElement>();

/** Register a host as owning a live TOC rail (called by mount() when a rail is composed). */
export function registerTocHost(host: HTMLElement): void {
  tocHosts.add(host);
}

/** Drop a host from the registry (called by mount() when its rail is gone: a rail-less
 *  re-render or the never-blank raw fallback). Safe to call for an unregistered host. */
export function unregisterTocHost(host: HTMLElement): void {
  tocHosts.delete(host);
}

/** A registered host currently HAS a rail when its shadow root holds the rail's opener — the
 *  exact node `toggleTocHost` needs to flip. A host can be connected yet rail-LESS (its shadow
 *  root was re-rendered without a rail); such a host must NOT win resolution, or the "last host"
 *  fallback resolves to it and `toggleTocHost` no-ops silently — a dead backtick even when ANOTHER
 *  registered host has a visible rail the user meant to toggle. Resolution therefore requires a
 *  LIVE rail, not merely a live host (the same predicate `toggleTocHost` acts through). */
function hasRail(host: HTMLElement): boolean {
  return tocOpenerFor(host) !== null;
}

/**
 * The active reader host the backtick toggle acts on, or `null` when no host has a live rail.
 * PRUNES first: any registered host no longer in the document is removed, so the "last host"
 * fallback can never resolve to a dead node (deleting during Set iteration is safe — removed
 * entries are not revisited). Then, considering only hosts that currently HAVE a rail
 * (`hasRail` — a connected-but-rail-less host can't be toggled, so it is skipped, never
 * swallowing the key): the registered host containing `document.activeElement` wins (focus
 * inside a shadow root retargets `activeElement` to its host, so `host === active` catches a
 * focused rail button; `host.contains` catches a focused light-DOM descendant on the contained
 * surface); otherwise the sole / last-registered host WITH a rail (Set preserves insertion
 * order). If no registered host has a live rail, returns `null` — a clean pass-through, never a
 * mis-resolution `toggleTocHost` would silently absorb.
 */
function resolveActiveTocHost(): HTMLElement | null {
  for (const host of tocHosts) {
    if (!host.isConnected) tocHosts.delete(host); // dead-node prune (see comment above)
  }
  if (tocHosts.size === 0) return null;

  const active = typeof document !== 'undefined' ? document.activeElement : null;
  if (active) {
    for (const host of tocHosts) {
      if (!hasRail(host)) continue; // rail-less host can't be toggled — skip, don't swallow `
      if (host === active || host.contains(active)) return host;
    }
  }

  let last: HTMLElement | null = null;
  for (const host of tocHosts) if (hasRail(host)) last = host; // last-registered host WITH a live rail
  return last;
}

/** Flip a resolved host's rail open⇄collapsed through the SAME `setTocOpen` writer the
 *  opener uses (data-toc + the opener's aria-expanded in lockstep — never duplicated). The
 *  opener lives in the host's shadow root; if it is somehow absent (a rail-less host that
 *  slipped the registry), no-op rather than write a half state. */
function toggleTocHost(host: HTMLElement): void {
  const opener = tocOpenerFor(host);
  if (!opener) return;
  // The backtick is a USER change, exactly like clicking the opener, so it goes through the same
  // path (task 6.1: it persists the rail; 8.1i: at narrow widths it toggles the sheet instead).
  toggleByUser(host, opener);
}

/** The bare key that toggles the rail. A backtick — chosen at the plan gate over `t` to
 *  avoid colliding with `role=tree` type-ahead in the app-page folder browser, and distinct
 *  from readerMode's `\` so the two shortcuts never contend (tasks.md plan-gate lock). */
export const TOC_TOGGLE_KEY = '`';

/** True when focus is in a field we must not hijack keystrokes from. A local mirror of
 *  readerMode's private helper — 2.3 must not edit readerMode.ts, so the guard is
 *  replicated verbatim rather than shared. */
function isEditableTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el || typeof el.tagName !== 'string') return false;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  return el.isContentEditable === true;
}

let tocShortcutInstalled = false;

/**
 * Install the single document-level backtick listener, ONCE (the boolean guard makes
 * repeated calls across re-mounts add no duplicate listener — exactly like
 * installToggleShortcut). Scoping guarantees, mirrored from readerMode so `` ` `` is never
 * swallowed on a page without our rail:
 *   - only the bare TOC_TOGGLE_KEY with no Ctrl/Cmd/Alt is considered;
 *   - ignored when focus is in input/textarea/select/contenteditable;
 *   - it does nothing — and does NOT preventDefault — unless the registry resolves a live
 *     host WITH a rail (resolveActiveTocHost returns non-null); so on any page without our
 *     rail, and after every rail is torn down, the key passes straight through;
 *   - preventDefault fires ONLY after we have decided to handle it.
 * No scroll, no URL/history, no network — a pure attribute flip on the resolved host.
 */
export function installTocShortcut(): void {
  if (tocShortcutInstalled) return;
  if (typeof document === 'undefined' || typeof document.addEventListener !== 'function') return;
  tocShortcutInstalled = true;
  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key !== TOC_TOGGLE_KEY) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (isEditableTarget(e.target)) return;
    const host = resolveActiveTocHost();
    if (!host) return; // no live rail → pass through, never swallow `
    e.preventDefault();
    toggleTocHost(host);
  });
}

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
// SCOPE (task 2.1): this module builds the rail and wires the LOCAL, jsdom-testable
// collapse toggle. It does NOT scroll (3.1), install the keyboard shortcut / host registry
// (2.3), or carry any CSS (2.2). It never touches `location`/`history`/`pushState` — buttons
// carry refs, they do not navigate by URL (spec In-scope "URL untouched").

import type { TocEntry } from './tocModel';

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
  row.append(link);

  li.append(row);
  if (childList) li.append(childList);
  return li;
}

/** Reflect the rail's open/collapsed state as `data-toc` on the host AND keep the opener's
 *  `aria-expanded` in lockstep — the single writer of both, so the visible chrome, the CSS
 *  key, and the a11y state can never drift. No scroll, no `location`/`history`. */
function setTocOpen(host: HTMLElement, opener: HTMLButtonElement, open: boolean): void {
  host.setAttribute('data-toc', open ? 'open' : 'collapsed');
  opener.setAttribute('aria-expanded', String(open));
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
  opener.addEventListener('click', () => {
    setTocOpen(host, opener, host.getAttribute('data-toc') !== 'open');
  });
  return opener;
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
  const decide = () => {
    const width = readScrollportWidth(host);
    if (width > 0) setTocOpen(host, opener, initialTocOpen(width));
    else if (!host.hasAttribute('data-toc')) setTocOpen(host, opener, DEFAULT_TOC_OPEN);
  };
  decide(); // synchronous: real width if already laid out, else the documented default
  const raf = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : null;
  if (raf) raf(decide); // post-commit/post-layout correction (no-op in layout-blind jsdom)
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
  if (countHeadings(model) < 2) return null; // threshold omit — no rail below 2 headings

  const nav = document.createElement('nav');
  nav.className = 'peekover-toc';
  nav.setAttribute('aria-label', 'Table of contents');
  // Structural marker for the contained stylesheet (2.2) — the fixed→absolute flip is CSS,
  // added there; here `contained` is threaded as a hook only, no styling.
  if (options.contained) nav.dataset.contained = '';

  // The always-visible opener heads the rail (survives the collapsed state); the collapsible
  // list body follows it. `data-toc="collapsed"` hides ONLY the list, never this handle.
  const opener = buildOpener(host);
  nav.append(opener, buildList(model));

  applyInitialTocState(host, opener);

  return nav;
}

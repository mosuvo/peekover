// scrollContainer — the reader's REAL vertical scroll box, resolved per surface.
//
// PURE MOVE (spec 005 task 3.1). This code lived privately in `tocView.ts` (003 task 3.2)
// until watch mode became its second consumer. Nothing about its behaviour changed in the
// move; `tocView` now imports it, and the extraction exists so the trap below is not
// re-derived a third time.
//
// ── THE TRAP, CARRIED VERBATIM IN SUBSTANCE FROM tocView.ts:580-593 ────────────────────────
//
// ROOT RESOLUTION is load-bearing and DIFFERS BY SURFACE. On the full-page content-script
// takeover, `:host` IS the scroll box (position:fixed; inset:0; overflow:auto — it always
// scrolls). In the app-page {contained} pane, `:host` sits in normal flow (CONTAINED_CSS) and
// grows to its content, so it never scrolls itself; the scrolling element is an ancestor pane
// (`.peekover-app__reader`, overflow:auto) that lives OUTSIDE the shadow root.
//
// A wrong root does not crash — it silently observes against the VIEWPORT and tracks nothing
// (or everything). That is a SILENT-WRONG-ANSWER failure, which is why the container must be
// RESOLVED, never assumed to be `:host`, and why every consumer's test asserts the resolved
// element IDENTITY rather than merely that something scrollable came back.
//
// `contained` must be PASSED IN: there is no marker on the host recording which surface it is,
// so the caller — which knows its own MountOptions — is the only honest source of that fact.

/** True when an element is a vertical scroll container by its COMPUTED overflow. Computed style
 *  is available synchronously (unlike scrollHeight, which needs layout), so this resolves the
 *  root correctly on the first post-mount frame. */
export function scrollsVertically(el: Element): boolean {
  const oy = getComputedStyle(el).overflowY;
  return oy === 'auto' || oy === 'scroll' || oy === 'overlay';
}

/**
 * The reader's real vertical scroll container for `host`, resolved per surface (never blindly
 * :host). Full-page (`!contained`) → :host itself (the fixed, inset:0 takeover that always
 * scrolls). Contained → the nearest ANCESTOR pane that scrolls; :host's OWN overflow:auto is the
 * full-page rule and does not scroll in normal flow, so the host is excluded from the walk and
 * `.peekover-app__reader` (overflow:auto) is found. Falls back to host if no scrolling ancestor
 * exists (a degenerate mount) — still a shadow-including ancestor of the headings, so an
 * observer rooted here stays valid rather than throwing.
 */
export function resolveScrollContainer(host: HTMLElement, contained: boolean): HTMLElement {
  if (!contained) return host;
  let el = host.parentElement;
  while (el) {
    if (scrollsVertically(el)) return el;
    el = el.parentElement;
  }
  return host;
}

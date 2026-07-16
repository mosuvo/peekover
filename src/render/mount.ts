// mount — the final render-pipeline stage: markdown source in, sanitized rendered
// HTML mounted into a shadow root on a host element. Composes the wire order
// AGENTS.md #3 requires (parse -> sanitize) and then commits the result into an
// OPEN shadow root (open so tests and a11y tooling can inspect it, consistent
// with the old hello-shell).
//
// Two non-negotiables live here:
//   - #3 all HTML that touches the DOM is DOMPurify-sanitized: the only string
//     ever assigned to innerHTML below is sanitize(parse(source)); the raw-source
//     fallback path uses textContent (no HTML parsing) and never innerHTML.
//   - #5 never a blank page: ANY throw in parse/sanitize/mount degrades to the raw
//     source shown as escaped plain text inside the shadow root.

import { parse } from './parse';
import { sanitize } from './sanitize';
import { buildReaderStyle, initReaderRuntime } from '../theme/reader';
import { CONTAINED_CSS } from '../theme/readerCss';
import {
  buildModeToggle,
  installToggleShortcut,
  registerReaderSource,
  setReaderMode,
} from './readerMode';
import { applyMediaPolicy } from './mediaPolicy';
import { buildNetworkIndicator, buildRemoteLoadBar } from './remoteMediaUi';
import { buildTocModel } from './tocModel';
import { buildTocView, installTocShortcut, registerTocHost, unregisterTocHost } from './tocView';

/** Open so tests / a11y tooling can inspect (matches the hello-shell precedent). */
const SHADOW_MODE = 'open' as const;

/** Optional render modes for a mount. */
export interface MountOptions {
  /**
   * Render CONTAINED within the host's own box instead of taking over the viewport.
   * OFF by default → the content-script reader stays a full-page takeover, and mount()'s
   * committed output is byte-identical to before this option existed. The app page's
   * reader pane passes `true` so the reader renders inside the shell region rather than
   * painting over it (see CONTAINED_CSS in theme/readerCss.ts).
   */
  contained?: boolean;
}

/** A <style> carrying the contained-mode override, injected AFTER the base reader
 *  stylesheet so its equal-specificity rules win by source order (no !important). */
function buildContainedStyle(): HTMLStyleElement {
  const style = document.createElement('style');
  style.textContent = CONTAINED_CSS;
  return style;
}

/**
 * Get the host's shadow root, creating it once. A host may only be attached once
 * (attachShadow throws on a second call), so re-render reuses the existing root —
 * this is what makes mount() idempotent: no duplicate roots across calls.
 */
function shadowFor(host: HTMLElement): ShadowRoot {
  return host.shadowRoot ?? host.attachShadow({ mode: SHADOW_MODE });
}

/**
 * Render `source` markdown and mount the sanitized result into `host`'s shadow
 * root. Safe to call repeatedly on the same host: each call rebuilds a detached
 * reader root and commits it as the shadow root's sole child (replaceChildren),
 * so old content — and any listeners it held — is dropped cleanly. No duplicate
 * roots, no leaked nodes.
 *
 * C12 SCOPE NOTE: tasks.md calls for "patch-on-rerender". M1 ships the simplest
 * correct version — a full innerHTML replacement of the sanitized string. That is
 * correct (idempotent, no leaks) but not incremental. A diffing / morphdom-style
 * patch is a deliberately DEFERRED optimization; do not add that dependency now.
 *
 * @param source  Raw markdown source text.
 * @param host    The element that owns the reader shadow root.
 * @param options Render modes; `{ contained: true }` scopes the reader to the host's box
 *                instead of the viewport. Omitted → byte-identical to the content-script path.
 */
export function mount(source: string, host: HTMLElement, options: MountOptions = {}): void {
  const shadow = shadowFor(host);
  try {
    // parse -> sanitize (AGENTS.md #3). The ONLY innerHTML assignment, and it is
    // the sanitized string.
    const html = sanitize(parse(source));

    // Remote-resource policy (AGENTS.md #1). LOAD-BEARING, and a trap that was already
    // sprung once: the sanitized HTML is parsed into a <template>'s content — an INERT
    // document with NO browsing context — so a remote <img src> is NOT fetched when it
    // materializes. This is the property that actually prevents the leak. It is NOT
    // "the node is detached": `document.createElement('div').innerHTML = html` DOES
    // dispatch the fetch (that div is owned by THIS document, which has a browsing
    // context), and synchronous removal afterward cannot cancel the in-flight request —
    // that was the shipped bug, invisible to jsdom (it loads no subresources) and caught
    // only at the human Network-tab gate. <template>.content (and DOMParser) are the
    // engine-guaranteed inert contexts; createElement children are not. See mediaPolicy.ts
    // and the real-engine guard tests/browser/remoteMedia.browser.test.ts.
    const baseUrl = host.ownerDocument?.baseURI || 'about:blank';
    const tpl = document.createElement('template');
    tpl.innerHTML = html; // parsed inert: no browsing context -> no remote fetch
    const blockedCount = applyMediaPolicy(tpl.content, baseUrl);

    // Only now, with remote media already neutralized, adopt the nodes into a reader
    // root owned by the live document. Nothing fetch-capable remains (remote <img>s are
    // now inert placeholders; file:/data:/blob: never hit the network), so this adoption
    // and the replaceChildren() commit below put nothing on the wire. Built detached and
    // committed last, so a throw anywhere above leaves the previous mount untouched.
    const root = document.createElement('div');
    root.className = 'peekover-reader';
    root.append(tpl.content);
    // Commit the reader stylesheet + the minimal Raw/Reading control alongside the
    // content. The <style> is rebuilt each render because replaceChildren() drops the
    // previous one (task 4.1). The Raw view itself is NOT built here — readerMode
    // builds it lazily on first toggle (source as text, no reparse), so a document
    // that is never toggled keeps its untrusted source out of the shadow tree.
    // The opt-in pill + (initially dark) network indicator are added ONLY when remote
    // media was actually blocked — a document with none grows no such chrome and can
    // never light the indicator.
    // Default (content-script) order is unchanged. When contained, a single extra
    // <style> is inserted DIRECTLY AFTER the base sheet so its :host / chrome overrides
    // win by source order; every other child, and their order, is identical.
    const children: Node[] = [buildReaderStyle()];
    if (options.contained) children.push(buildContainedStyle());
    children.push(buildModeToggle(host));
    if (blockedCount > 0) {
      children.push(buildRemoteLoadBar(host, blockedCount), buildNetworkIndicator());
    }
    // Table-of-contents rail (task 2.2), composed through THIS one seam so both surfaces
    // (content-script full-page and app-page {contained}) get it with zero per-surface
    // branching. buildTocModel reads the h1..h6 now living in `root`; buildTocView returns
    // the rail Node, or null below the >=2-heading threshold — omitted from `children`
    // entirely, so a thin doc grows no rail chrome. Placed alongside the pills, BEFORE
    // `root`, as a sibling of the reading column — never inside it, so `.peekover-reader`
    // stays byte-identical (golden-friendly). Committed by the SAME replaceChildren below.
    const tocRail = buildTocView(host, buildTocModel(root), { contained: options.contained });
    if (tocRail) children.push(tocRail);
    children.push(root);
    shadow.replaceChildren(...children);
    registerReaderSource(host, source); // stash source for the lazy Raw view
    setReaderMode(host, 'reading'); // default view = the rendered document
    installToggleShortcut(); // idempotent; only active while our reader is mounted
    // TOC toggle registry (task 2.3): this host has a rail iff buildTocView returned one.
    // Register when composed so the backtick shortcut can resolve+toggle it; un-register on
    // a rail-less re-render (<2 headings) so backtick never toggles a rail-less reader. The
    // raw-fallback path un-registers too (mountRawFallback). installTocShortcut is idempotent.
    if (tocRail) registerTocHost(host);
    else unregisterTocHost(host);
    installTocShortcut();
    initReaderRuntime(host);
  } catch (err) {
    // AGENTS.md #5: never a blank page. Degrade to the raw source as escaped text,
    // with a quiet user-facing banner (task 4.2). Dev-only signal kept alongside it.
    console.warn('[peekover] render failed; showing raw source', err);
    mountRawFallback(source, shadow, host, options.contained);
  }
}

/**
 * The never-blank fallback: show the raw source as escaped plain text in a <pre>,
 * preceded by a quiet, themed error banner. Uses textContent (not innerHTML), so the
 * source is displayed literally and is never parsed as HTML — safe even though the
 * source is untrusted.
 *
 * Failure-raw vs user-raw are deliberately DISTINGUISHABLE (see decisions.md): the
 * failure view carries the banner AND no `data-mode` (there is no rendered reading
 * view to toggle to), whereas the user's Raw view is a `data-mode` with no banner.
 * We clear any stale `data-mode` here so a re-render that goes success -> failure
 * can't leave the toggle shortcut thinking a reading view still exists.
 */
function mountRawFallback(
  source: string,
  shadow: ShadowRoot,
  host: HTMLElement,
  contained = false,
): void {
  host.removeAttribute('data-mode');
  unregisterTocHost(host); // a failed render replaces the rail with banner+<pre> — no rail now

  const banner = document.createElement('div');
  banner.className = 'peekover-alert';
  banner.setAttribute('role', 'status'); // quiet/polite, not an alarming assertive alert
  banner.textContent = "Couldn't render this document — showing raw source.";

  const pre = document.createElement('pre');
  pre.className = 'peekover-raw';
  pre.textContent = source;

  // Theme the fallback too (paper/ink, mono) so a failed render still reads as
  // Peekover rather than a bare white page. buildReaderStyle can't throw here. The
  // contained override rides along so a failed render in the reader pane stays in the
  // pane too, never a full-page takeover. Default (no arg) → output byte-identical.
  const children: Node[] = [buildReaderStyle()];
  if (contained) children.push(buildContainedStyle());
  children.push(banner, pre);
  shadow.replaceChildren(...children);
  initReaderRuntime(host);
}

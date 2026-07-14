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
import {
  buildModeToggle,
  installToggleShortcut,
  registerReaderSource,
  setReaderMode,
} from './readerMode';
import { applyMediaPolicy } from './mediaPolicy';
import { buildNetworkIndicator, buildRemoteLoadBar } from './remoteMediaUi';

/** Open so tests / a11y tooling can inspect (matches the hello-shell precedent). */
const SHADOW_MODE = 'open' as const;

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
 * @param source Raw markdown source text.
 * @param host   The element that owns the reader shadow root.
 */
export function mount(source: string, host: HTMLElement): void {
  const shadow = shadowFor(host);
  try {
    // parse -> sanitize (AGENTS.md #3). The ONLY innerHTML assignment, and it is
    // the sanitized string. Built fully detached, then committed last, so a throw
    // anywhere above leaves the previously mounted content untouched until we swap.
    const html = sanitize(parse(source));
    const root = document.createElement('div');
    root.className = 'peekover-reader';
    root.innerHTML = html;
    // Remote-resource policy (AGENTS.md #1). CRITICAL ORDERING: `root` is still
    // DETACHED here (createElement, not yet in any document), so assigning innerHTML
    // above fetched nothing — a detached subtree has no browsing context. We must
    // neutralize remote media NOW, before the replaceChildren() below commits `root`
    // into the live shadow tree, because that commit is the moment any surviving
    // remote <img src> would fire its fetch. See mediaPolicy.ts (the load-bearing
    // gotcha) and the no-leak test in mount.test.ts.
    const baseUrl = host.ownerDocument?.baseURI || 'about:blank';
    const blockedCount = applyMediaPolicy(root, baseUrl);
    // Commit the reader stylesheet + the minimal Raw/Reading control alongside the
    // content. The <style> is rebuilt each render because replaceChildren() drops the
    // previous one (task 4.1). The Raw view itself is NOT built here — readerMode
    // builds it lazily on first toggle (source as text, no reparse), so a document
    // that is never toggled keeps its untrusted source out of the shadow tree.
    // The opt-in pill + (initially dark) network indicator are added ONLY when remote
    // media was actually blocked — a document with none grows no such chrome and can
    // never light the indicator.
    const children: Node[] = [buildReaderStyle(), buildModeToggle(host)];
    if (blockedCount > 0) {
      children.push(buildRemoteLoadBar(host, blockedCount), buildNetworkIndicator());
    }
    children.push(root);
    shadow.replaceChildren(...children);
    registerReaderSource(host, source); // stash source for the lazy Raw view
    setReaderMode(host, 'reading'); // default view = the rendered document
    installToggleShortcut(); // idempotent; only active while our reader is mounted
    initReaderRuntime(host);
  } catch (err) {
    // AGENTS.md #5: never a blank page. Degrade to the raw source as escaped text,
    // with a quiet user-facing banner (task 4.2). Dev-only signal kept alongside it.
    console.warn('[peekover] render failed; showing raw source', err);
    mountRawFallback(source, shadow, host);
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
function mountRawFallback(source: string, shadow: ShadowRoot, host: HTMLElement): void {
  host.removeAttribute('data-mode');

  const banner = document.createElement('div');
  banner.className = 'peekover-alert';
  banner.setAttribute('role', 'status'); // quiet/polite, not an alarming assertive alert
  banner.textContent = "Couldn't render this document — showing raw source.";

  const pre = document.createElement('pre');
  pre.className = 'peekover-raw';
  pre.textContent = source;

  // Theme the fallback too (paper/ink, mono) so a failed render still reads as
  // Peekover rather than a bare white page. buildReaderStyle can't throw here.
  shadow.replaceChildren(buildReaderStyle(), banner, pre);
  initReaderRuntime(host);
}

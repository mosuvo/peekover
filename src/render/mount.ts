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

/** Open so tests / a11y tooling can inspect (matches the hello-shell precedent). */
const SHADOW_MODE = 'open' as const;

/**
 * The single choke-point every rendered <img> passes through.
 *
 * M1: effectively a no-op — images load normally. This seam exists ONLY so the
 * remote-resource policy (tasks.md: "Remote-resource policy: block remote
 * images/resources by default; one-click opt-in … lazy-load permitted media")
 * has ONE place to hook block / lazy-load behaviour without re-cutting the mount
 * stage later. Do NOT implement blocking here now — that is the remote-resource
 * task's job. Build the seam, not the policy.
 *
 * @param root The mounted reader root to scan for media.
 */
export function applyMediaPolicy(root: ParentNode): void {
  // Enumerate the rendered images so the future policy has a defined hook point.
  // Intentionally does nothing to them in M1.
  const images = root.querySelectorAll('img');
  void images;
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
    applyMediaPolicy(root);
    shadow.replaceChildren(root);
  } catch (err) {
    // AGENTS.md #5: never a blank page. Degrade to the raw source as escaped text.
    // Dev-only signal; the user-facing error banner arrives with task 4.2.
    console.warn('[peekover] render failed; showing raw source', err);
    mountRawFallback(source, shadow);
  }
}

/**
 * The never-blank fallback: show the raw source as escaped plain text in a <pre>.
 * Uses textContent (not innerHTML), so the source is displayed literally and is
 * never parsed as HTML — safe even though the source is untrusted.
 */
function mountRawFallback(source: string, shadow: ShadowRoot): void {
  const pre = document.createElement('pre');
  pre.className = 'peekover-raw';
  pre.textContent = source;
  shadow.replaceChildren(pre);
}

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
import { buildThemeControl } from '../theme/themeControl';
import { buildWatchChrome } from '../watch/watchControl';
import { buildDiffChrome } from './diffChrome';
import { buildAgentBadge } from './agentBadge';
import { buildTocModel } from './tocModel';
import { buildTocView, installTocShortcut, registerTocHost, unregisterTocHost } from './tocView';
import { resolveScrollContainer } from './scrollContainer';
import { captureReadingAnchor, restoreReadingAnchor, type ReadingAnchor } from './readingAnchor';
import type { ReaderMode } from './readerMode';

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
  /**
   * Keep the reader WHERE AND HOW IT WAS across this re-render (spec 005 task 3.3).
   *
   * OFF by default, and that default is load-bearing rather than merely conservative. `mount()`
   * has been read-only library for four milestones (`readerPane.ts:16`), and its unconditional
   * `setReaderMode(host, 'reading')` below is DEPENDED ON by `readerPane.select()`: switching
   * from a file you were reading in Raw to a different file must land in Reading, on the new
   * document. So the reset is not incidental — preserving unconditionally would be a real bug on
   * the app page, which is why BOTH directions of this flag are red-first proven in
   * `tests/browser/watchRemount.browser.test.ts`, not just the new one.
   *
   * When set, mount() captures the reading anchor (3.2) and the live `data-mode` BEFORE
   * `replaceChildren`, then after the commit restores that mode INSTEAD of forcing 'reading',
   * and restores the anchor. Watch mode is the only caller that sets it: an agent rewriting a
   * file underneath you must not yank you to the top of the document, or out of Raw, on every
   * keystroke.
   */
  preserveReading?: boolean;
}

/** What a `preserveReading` mount carries across its own `replaceChildren`. */
interface CarriedReading {
  /** The scroll box the anchor was captured from — resolved once, reused for the restore. */
  scroller: HTMLElement;
  /** The live view mode at capture time, or null if the host carried none. */
  mode: ReaderMode | null;
  /** The captured place, or null when there was no previous render to capture from. */
  anchor: ReadingAnchor | null;
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
    // Theme control (task 5.1), composed through THIS one seam so both surfaces get it with no
    // per-surface branching — same discipline as the TOC rail below. It is chrome: pushed as a
    // SIBLING of the reading column, never inside `root`, so `.peekover-reader` stays
    // byte-identical. It imports no port and no store — it writes through the theme runtime's
    // single setter plus a sink the CONTEXT registered (src/theme/themeControl.ts, decision D-A).
    //
    // NOTE ON THE GOLDEN PIN: tests/golden/ snapshots the PURE `sanitize(parse(source))` string,
    // upstream of this function entirely — so it stays empty no matter what chrome is committed
    // here, INCLUDING chrome wrongly appended into `root`. The golden diff is therefore not the
    // guard people assume; the DOM sibling relationship is asserted directly in
    // tests/browser/themeControl.browser.test.ts (verified red by appending to `root`).
    children.push(buildThemeControl());
    // Watch control (spec 005 task 4.1), composed through THIS one seam for the same reason the
    // theme control and the TOC rail are — both surfaces get it with no per-surface branching. A
    // SIBLING of the reading column, never inside `root`, so `.peekover-reader` stays
    // byte-identical (and, per the note above, the golden pin cannot see the difference — the DOM
    // sibling assertion in tests/browser/watchControl.browser.test.ts is the only guard).
    //
    // It returns an EMPTY array in a context that registered no watch target and has nothing to
    // explain, and that emptiness is deliberate: a surface that cannot watch grows no chrome at
    // all rather than a button that looks live and does nothing. Where a user WOULD wonder why
    // watching is missing (tasks 4.3 and 4.4), it returns a designed explanation instead — never a
    // disabled control. The control itself holds no controller reference — it reaches
    // start/stop through the module-level registry, because `replaceChildren` destroys it on every
    // render, INCLUDING the renders a running watch causes. See src/watch/watchRegistry.ts.
    children.push(...buildWatchChrome(host));
    // Diff affordance (spec 006 task 6.2), composed through THIS same seam — and it is the ONLY
    // diff module this file imports (plan §1.4's import fence: `diffChrome.ts` reaches the engine
    // and the view through closures the app page provisions on the diff registry, so neither
    // `diff` nor `diffEngine` nor `diffView` enters the content-script graph through here).
    // Returns `[]` — with NO explanatory note — on a surface that registered no diff context
    // (D-14, §3.2: the user never saw a history feature there, so there is nothing to be told they
    // are missing). Siblings of the reading column, like every other piece of chrome above.
    children.push(...buildDiffChrome(host));
    // Agent-file badge (008 task 1.3, D-1/D-2) — the FIFTH instance of the pattern above, and the
    // whole cost in this file of not threading the document's name through MountOptions. It reads
    // the module-level identity registry at BUILD time and returns `[]` — with NO note — when the
    // name is absent or unrecognized, so this line is unconditional and mount() stays read-only
    // library (006 D-15): it reads a data holder, writes nothing, owns nothing, and branches on
    // nothing about the app. Why a registry and not MountOptions: src/render/docIdentity.ts.
    children.push(...buildAgentBadge());
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

    // CONTINUITY CAPTURE (task 3.3), taken from the LIVE pre-commit DOM — the last moment the
    // previous render still exists. Only when the caller opted in; every existing caller omits
    // the flag and reaches `replaceChildren` with nothing read and nothing changed.
    const carried = options.preserveReading ? captureReading(shadow, host, options) : null;

    shadow.replaceChildren(...children);
    registerReaderSource(host, source); // stash source for the lazy Raw view
    // Default view = the rendered document. UNCONDITIONAL unless the caller asked to preserve:
    // `readerPane.select()` depends on this reset to land a newly-selected file in Reading even
    // when the previous file was left in Raw (see MountOptions.preserveReading).
    setReaderMode(host, carried?.mode ?? 'reading');
    host.removeAttribute('data-diff'); // D-15: a diff (diffView.ts) never crosses a document switch
    installToggleShortcut(); // idempotent; only active while our reader is mounted
    // TOC toggle registry (task 2.3): this host has a rail iff buildTocView returned one.
    // Register when composed so the backtick shortcut can resolve+toggle it; un-register on
    // a rail-less re-render (<2 headings) so backtick never toggles a rail-less reader. The
    // raw-fallback path un-registers too (mountRawFallback). installTocShortcut is idempotent.
    if (tocRail) registerTocHost(host);
    else unregisterTocHost(host);
    installTocShortcut();
    initReaderRuntime(host);
    // CONTINUITY RESTORE (task 3.3), last — after the commit, the mode and the rail are all in
    // place, so the geometry the anchor measures against is the one the reader will actually see.
    if (carried) restoreReading(root, carried);
  } catch (err) {
    // AGENTS.md #5: never a blank page. Degrade to the raw source as escaped text,
    // with a quiet user-facing banner (task 4.2). Dev-only signal kept alongside it.
    console.warn('[peekover] render failed; showing raw source', err);
    mountRawFallback(source, shadow, host, options.contained);
  }
}

/**
 * Read the reader's current place and view mode off the live pre-commit DOM (task 3.3).
 *
 * Returns a carrier even when there is no previous render (`anchor: null`, `mode: null`) — a
 * first mount with the flag set is not an error, it simply has nothing to preserve, and the
 * restore below degrades to doing nothing rather than to a jump.
 */
function captureReading(
  shadow: ShadowRoot,
  host: HTMLElement,
  options: MountOptions,
): CarriedReading {
  const scroller = resolveScrollContainer(host, options.contained === true);
  const prevRoot = shadow.querySelector('.peekover-reader');
  return {
    scroller,
    mode: (host.getAttribute('data-mode') as ReaderMode | null) ?? null,
    anchor: prevRoot ? captureReadingAnchor(scroller, buildTocModel(prevRoot)) : null,
  };
}

/**
 * Put the reader back where it was, after the commit (task 3.3).
 *
 * THE RAW-MODE SUBTLETY, stated because the code below looks like a needless branch: in Raw mode
 * the rendered reading column is `display:none`, so every heading's rect is all-zero and an
 * anchor restore computed against them would resolve to ~0 — a jump to the top, which is exactly
 * the failure this feature exists to prevent. Handing `restoreReadingAnchor` an EMPTY model makes
 * it take its own `scrollTop` rung, which is the honest answer for a view that has no headings on
 * screen to anchor to.
 */
function restoreReading(root: HTMLElement, carried: CarriedReading): void {
  const { scroller, mode, anchor } = carried;
  if (!anchor) return;
  restoreReadingAnchor(scroller, mode === 'raw' ? [] : buildTocModel(root), anchor);
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
  host.removeAttribute('data-diff'); // D-15: clear any open diff on the fallback path too
  unregisterTocHost(host); // a failed render replaces the rail with banner+<pre> — no rail now

  const banner = document.createElement('div');
  banner.className = 'peekover-alert';
  banner.setAttribute('role', 'status'); // quiet/polite, not an alarming assertive alert
  banner.textContent = "Couldn't render this document — showing raw source.";

  const pre = document.createElement('pre');
  pre.className = 'peekover-raw';
  pre.textContent = source;
  registerReaderSource(host, source); // WeakMap now holds what is on screen here too (task 1.3)

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

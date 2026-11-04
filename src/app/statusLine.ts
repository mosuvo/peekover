// statusLine — the app page's status line (013 task 4.7; D-9; gate-1 Q9; ruling F).
//
// A footer at the window's foot that says three things, each backed by a test and nothing else:
//
//   1. THE OPEN FILE — the name of the file the reader pane shows, or nothing when none is open.
//      The shell sets it at the one place every route ends (`selectFile`: the tree, recents, pins,
//      the seam, a fresh folder, revoke), after the pane has settled. It shows what the pane shows;
//      the out-of-order `readerPane.select` race is NOT claimed fixed here.
//   2. THE NETWORK — "No network calls" while nothing has left the page, else "Network used".
//      Two arms, OR-ed: (a) a reader host carrying the network indicator's own state
//      (`data-network="active"`, set by the user's Load click), and (b) a PerformanceObserver on
//      Resource Timing entries that are http(s) AND off this page's origin, started at creation. On
//      the real app page the origin is the extension's, so every http(s) request is off-origin and
//      the extension's own loads (fonts, chunks, the editor engine, diagrams, math) are not http(s)
//      at all; the origin test is what keeps a test harness served over http honest too. It is
//      sticky: once the page has used the network, it says so for the rest of the page.
//      NO COUNT — the human's ruling (2026-11-03, "M13 RULING — 4.7's network statement"): Firefox
//      writes no Resource Timing entry for a request whose connection fails (refused, offline, DNS),
//      so "Network: N requests you made" could not be made exactly true there; under Q9 the count
//      is left off. Arm (a) still keeps a failed user load off "No network calls".
//   3. THE VERSION — "Peekover <version>", the version the app entrypoint reads from
//      `runtime.getManifest()` (passed in; this module never touches the extension API). With no
//      version passed (a test page), the statement is absent rather than guessed.
//
// Left off as unprovable in general (D-9): encoding, "GFM + math + mermaid", word counts, "last
// change". `role="status"` (tasks.md 4.7): a polite live region, so assistive tech hears the new
// file name on a switch and "Network used" once, never more often than the text changes.

import { NETWORK_ATTR } from '../render/remoteMediaUi';

export const STATUS_LINE_CLASS = 'peekover-status';
export const NO_NETWORK_TEXT = 'No network calls';
export const NETWORK_USED_TEXT = 'Network used';

/** True for a Resource Timing entry name that went over http(s) to an origin other than `origin`. */
export function isOffOriginRequest(name: string, origin: string): boolean {
  if (!/^https?:/i.test(name)) return false;
  try {
    return new URL(name).origin !== origin;
  } catch {
    return true; // an http(s) name that does not parse is still on the wire
  }
}

export interface StatusLineOptions {
  /** `runtime.getManifest().version`, from the entrypoint. Absent → no version statement. */
  version?: string;
}

export interface StatusLine {
  readonly element: HTMLElement;
  /** The open file's name, or `null` when no file is open. */
  setFile(name: string | null): void;
  /** Watch `root`'s subtree for a reader host lighting the network indicator. */
  watch(root: HTMLElement): void;
}

/** The status line's sheet, scoped under the shell class — the 3.1 mock's `.status`. Rationale is here, not in
 *  the literal: CSS inside a template literal ships. The dot is decorative (aria-hidden); it takes `--warn` once
 *  the network has been used, as in the mock. Hidden in print, like the header. */
export function statusLineCss(shell: string): string {
  const C = STATUS_LINE_CLASS;
  return `
.${shell} .${C}{flex:none; height:30px; display:flex; align-items:center; gap:16px; padding:0 16px; border-top:1px solid var(--line);
  background:var(--paper); font:400 11.5px/1 var(--sans); color:var(--muted); white-space:nowrap; overflow:hidden}
.${shell} .${C}__file{min-width:0; overflow:hidden; text-overflow:ellipsis}
.${shell} .${C}__sp{flex:1}
.${shell} .${C}__dot{display:inline-block; width:6px; height:6px; border-radius:50%; background:var(--muted); margin-right:6px; vertical-align:1px}
.${shell} .${C}[data-network="used"] .${C}__dot{background:var(--warn)}
@media print{.${shell} .${C}{display:none!important}}
`;
}

export function createStatusLine(doc: Document, { version }: StatusLineOptions = {}): StatusLine {
  const C = STATUS_LINE_CLASS;
  const element = doc.createElement('footer');
  element.className = C;
  element.setAttribute('role', 'status');

  const file = doc.createElement('span');
  file.className = `${C}__file`;
  const spacer = doc.createElement('span');
  spacer.className = `${C}__sp`;
  const net = doc.createElement('span');
  net.className = `${C}__net`;
  const dot = doc.createElement('span');
  dot.className = `${C}__dot`;
  dot.setAttribute('aria-hidden', 'true');
  const netText = doc.createElement('span');
  netText.textContent = NO_NETWORK_TEXT;
  net.append(dot, netText);
  element.append(file, spacer, net);
  if (version) {
    const v = doc.createElement('span');
    v.className = `${C}__version`;
    v.textContent = `Peekover ${version}`;
    element.append(v);
  }

  let used = false;
  const markUsed = (): void => {
    if (used) return;
    used = true;
    element.setAttribute('data-network', 'used');
    netText.textContent = NETWORK_USED_TEXT;
  };

  // Arm (b): every http(s) request off this page's origin from now on, whoever issued it.
  const view = doc.defaultView;
  const origin = view?.location.origin ?? '';
  const since = view?.performance.now() ?? 0;
  const Observer = (view as (Window & typeof globalThis) | null)?.PerformanceObserver;
  let perf: PerformanceObserver | null = null;
  if (typeof Observer === 'function') {
    perf = new Observer((list) => {
      if (list.getEntries().some((e) => e.startTime >= since && isOffOriginRequest(e.name, origin))) markUsed();
      if (used) perf?.disconnect();
    });
    try {
      perf.observe({ type: 'resource', buffered: true });
    } catch {
      try {
        perf.observe({ entryTypes: ['resource'] });
      } catch {
        perf = null; // no Resource Timing here (a non-browser test environment); arm (a) still stands
      }
    }
  }

  // Arm (a): the network indicator's own state on any reader host under the watched root.
  let attrs: MutationObserver | null = null;
  const lit = (root: HTMLElement): boolean => root.querySelector(`[${NETWORK_ATTR}="active"]`) !== null;

  return {
    element,
    setFile(name) {
      file.textContent = name ?? '';
    },
    watch(root) {
      if (lit(root)) markUsed();
      if (used || attrs) return;
      const MO = (view as (Window & typeof globalThis) | null)?.MutationObserver;
      if (typeof MO !== 'function') return;
      attrs = new MO(() => {
        if (lit(root)) markUsed();
        if (used) attrs?.disconnect();
      });
      attrs.observe(root, { subtree: true, attributes: true, attributeFilter: [NETWORK_ATTR] });
    },
  };
}

// remoteMediaUi — the reader-chrome affordances for the remote-resource policy: the
// one-click opt-in pill and the network indicator. Kept apart from mediaPolicy.ts
// (pure classify/neutralize/restore, unit-tested without chrome) so the policy has no
// UI dependency and the chrome has one clear home, mirroring readerMode.ts's split.
//
// Both are committed into the shadow root by mount() ONLY when at least one image was
// blocked — a document with no remote media grows no chrome and can never light the
// indicator. Styling lives in readerCss.ts (tokens only, no new fonts/assets).
//
// No persistence (permissions:[] → no storage): the opt-in is per page-view. A reload
// re-blocks, so the pill's tooltip says as much.

import { restoreBlockedImages } from './mediaPolicy';

/**
 * Host attribute that the reader stylesheet keys the network indicator's visibility
 * off (like data-theme / data-mode). Absent = the indicator never shows; set to
 * 'active' the moment the user triggers a network action, and it stays lit for the
 * rest of the view (AGENTS.md #1 made visible).
 */
export const NETWORK_ATTR = 'data-network';

/** Light the network indicator for the remainder of this view. Idempotent. */
export function lightNetworkIndicator(host: HTMLElement): void {
  host.setAttribute(NETWORK_ATTR, 'active');
}

/**
 * Build the network indicator element: a small dot + "Network used" pill. It ships
 * CSS-hidden and only appears once the host carries data-network="active"
 * (lightNetworkIndicator). role="status" so assistive tech announces it politely when
 * it lights, not before.
 */
export function buildNetworkIndicator(): HTMLElement {
  const el = document.createElement('div');
  el.className = 'peekover-net';
  el.setAttribute('role', 'status');

  const dot = document.createElement('span');
  dot.className = 'peekover-net__dot';
  dot.setAttribute('aria-hidden', 'true');

  const label = document.createElement('span');
  label.className = 'peekover-net__label';
  label.textContent = 'Network used';

  el.append(dot, label);
  return el;
}

/**
 * Build the opt-in affordance: one pill reading "N remote image(s) blocked · Load".
 * Clicking it restores the blocked placeholders to real <img>s (which initiates the
 * now user-triggered fetches), lights the network indicator, and removes itself —
 * a one-shot control. Placement/looks mirror the mode-toggle pill (readerCss.ts).
 *
 * @param host         The reader shadow host (owns the shadow root + data-network).
 * @param blockedCount How many remote images were blocked (>0 by construction).
 */
export function buildRemoteLoadBar(
  host: HTMLElement,
  blockedCount: number,
): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'peekover-remote-load';
  const plural = blockedCount === 1 ? 'image' : 'images';
  btn.textContent = `${blockedCount} remote ${plural} blocked · Load`;
  // Say the two things a user needs to know before clicking: it uses the network,
  // and it is not remembered (a reload blocks again — there is no storage).
  btn.title =
    'Loads remote images over the network, for this view only. Reloading blocks them again.';

  btn.addEventListener('click', () => {
    const shadow = host.shadowRoot;
    if (!shadow) return;
    const restored = restoreBlockedImages(shadow);
    if (restored > 0) lightNetworkIndicator(host);
    btn.remove(); // consumed — the opt-in is a one-shot
  });

  return btn;
}

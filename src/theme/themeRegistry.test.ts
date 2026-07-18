// @vitest-environment jsdom
//
// The themed-host registry (task 3.1). Set membership + the `isConnected` prune are pure DOM
// bookkeeping, so jsdom CAN see them — what jsdom cannot see is the resulting PAINT (computed
// tokens), which is why 3.2/3.3 prove the same mechanism in the real engine. Here we assert
// the two properties the registry exists for: one broadcast reaches EVERY registered host
// (the §3.4 fix — no tag-name query), and a host removed from the document is pruned so it is
// never written again (the by-construction liveness guard).

import { describe, it, expect, beforeEach } from 'vitest';
import {
  registerThemeHost,
  unregisterThemeHost,
  applyTheme,
  themeHostCountForTest,
  resetThemeHostsForTest,
} from './themeRegistry';

/** A connected themed host. The registry is tag-agnostic on purpose — the real surfaces are a
 *  `<peekover-root>` custom element, a plain `<div>` pane host, and the `.peekover-app` shell
 *  root — so the tests use whatever tag the assertion needs. */
function mountHost(tag = 'div'): HTMLElement {
  const host = document.createElement(tag);
  document.body.appendChild(host);
  return host;
}

beforeEach(() => {
  resetThemeHostsForTest();
  document.body.replaceChildren();
});

describe('theme registry — broadcast', () => {
  it('applyTheme writes data-theme on every registered host', () => {
    const reader = mountHost('peekover-root');
    const shell = mountHost('div'); // stands in for the light-DOM .peekover-app shell root
    registerThemeHost(reader);
    registerThemeHost(shell);

    applyTheme('dark');

    // The whole point of the registry: a tag-name query ('peekover-root') would have missed
    // the shell root entirely — that is the stale-surface bug this replaces.
    expect(reader.getAttribute('data-theme')).toBe('dark');
    expect(shell.getAttribute('data-theme')).toBe('dark');
  });

  it('registering the same host twice is a no-op (idempotent across re-renders)', () => {
    const host = mountHost();
    registerThemeHost(host);
    registerThemeHost(host);
    expect(themeHostCountForTest()).toBe(1);
  });

  it('an explicitly unregistered host stops receiving the broadcast', () => {
    const host = mountHost();
    registerThemeHost(host);
    applyTheme('dark');
    unregisterThemeHost(host);
    applyTheme('light');
    expect(host.getAttribute('data-theme')).toBe('dark'); // frozen at the last broadcast it saw
  });
});

describe('theme registry — isConnected prune (liveness guard)', () => {
  it('prunes a host removed from the document and never writes to it again', () => {
    const live = mountHost();
    const doomed = mountHost();
    registerThemeHost(live);
    registerThemeHost(doomed);

    applyTheme('dark');
    expect(doomed.getAttribute('data-theme')).toBe('dark');

    doomed.remove(); // unmounted reader / re-rendered pane
    applyTheme('light');

    // RED WITHOUT THE PRUNE: the detached node is still in the Set, so the broadcast writes
    // 'light' onto a node that is no longer in any document — a dead write (and a retained
    // node). With the prune it keeps the stale 'dark' it had when it was last alive.
    expect(live.getAttribute('data-theme')).toBe('light');
    expect(doomed.getAttribute('data-theme')).toBe('dark');
    // And the set genuinely SHRANK — not merely that the attribute happened not to change.
    expect(themeHostCountForTest()).toBe(1);
  });
});

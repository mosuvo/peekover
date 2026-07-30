// @vitest-environment jsdom
//
// The themed-host registry (task 3.1). Set membership + the `isConnected` prune are pure DOM
// bookkeeping, so jsdom CAN see them — what jsdom cannot see is the resulting PAINT (computed
// tokens), which is why 3.2/3.3 prove the same mechanism in the real engine. Here we assert
// the two properties the registry exists for: one broadcast reaches EVERY registered host
// (the §3.4 fix — no tag-name query), and a host removed from the document is pruned so it is
// never written again (the by-construction liveness guard).

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  registerThemeHost,
  unregisterThemeHost,
  applyTheme,
  onEffectiveThemeChange,
  themeHostCountForTest,
  resetThemeHostsForTest,
  resetEffectiveThemeListenersForTest,
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
  resetEffectiveThemeListenersForTest();
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

// ── 007 D-7, task 5.1: the effective-theme notification ───────────────────────────────────────
//
// ★ ADDITIVE, AND THE CONTROL FOR IT IS ABOVE. The four tests that precede this block are
// UNCHANGED from before the listener existed, and were run green at HEAD (f133913) as the
// pre-listener control. They are what "additive" means here: they pin `applyTheme`'s whole
// pre-existing contract — every registered host written, an unregistered host skipped, the
// prune shrinking the set — and they still pass with a listener installed. This block adds the
// notification's own properties on top; it does not restate theirs.
describe('theme registry — the effective-theme notification (007 D-7)', () => {
  it('notifies every subscriber with the theme that was just applied', () => {
    const seen: string[] = [];
    onEffectiveThemeChange((effective) => seen.push(effective));

    applyTheme('dark');
    applyTheme('sepia');

    // The EFFECTIVE theme, not a setting — the subscriber never has to ask the OS or re-resolve
    // anything, which is what stops it becoming a second source of truth for what is painting.
    expect(seen).toEqual(['dark', 'sepia']);
  });

  it('★ notifies AFTER the attribute writes — a listener reading the DOM sees the NEW theme', () => {
    const host = mountHost();
    registerThemeHost(host);
    applyTheme('light');

    // The ordering is the reason a re-render subscriber can key off what the page now carries.
    // RED IF THE NOTIFY MOVES ABOVE THE WRITE LOOP: this reads the theme being REPLACED.
    let observed: string | null = 'never ran';
    onEffectiveThemeChange(() => {
      observed = host.getAttribute('data-theme');
    });
    applyTheme('dark');

    expect(observed).toBe('dark');
  });

  it('notifies on a re-broadcast of the SAME theme (the no-op decision is the subscriber\'s)', () => {
    const listener = vi.fn();
    onEffectiveThemeChange(listener);

    applyTheme('dark');
    applyTheme('dark');

    // Only the subscriber knows what its surfaces currently show — a diagram rendered at another
    // theme is stale even when the broadcast repeats. Suppressing here would hide that from it.
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('unsubscribing stops the notifications', () => {
    const listener = vi.fn();
    const off = onEffectiveThemeChange(listener);

    applyTheme('dark');
    off();
    applyTheme('light');

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenLastCalledWith('dark');
  });

  it('★ additive — the host broadcast is unchanged while a subscriber is installed', () => {
    const reader = mountHost('peekover-root');
    const doomed = mountHost();
    registerThemeHost(reader);
    registerThemeHost(doomed);
    onEffectiveThemeChange(() => {});

    applyTheme('dark');
    expect(reader.getAttribute('data-theme')).toBe('dark');
    expect(doomed.getAttribute('data-theme')).toBe('dark');

    // ...including the prune. The listener sits beside the hosts; it must not have joined the
    // iteration that removes dead ones.
    doomed.remove();
    applyTheme('light');
    expect(reader.getAttribute('data-theme')).toBe('light');
    expect(doomed.getAttribute('data-theme')).toBe('dark');
    expect(themeHostCountForTest()).toBe(1);
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

// @vitest-environment jsdom
//
// tocView shape tests (task 2.1). jsdom has NO layout, scroll, or IntersectionObserver, so
// these assert DOM STRUCTURE and local wiring only — never motion (real scroll/spy/resize
// live in tests/browser/, task 3.x). The halves mirror the plan's Verify line for 2.1:
//   - rail PRESENT at ≥2 headings, OMITTED (null) at exactly 0 and 1 (threshold / F5);
//   - `nav` landmark + nested `<ol>` + `aria-current`-capable entries, NO `role=tree` (F1 a11y);
//   - collapse flips `aria-expanded` AND hides/shows that subtree (F4);
//   - entry→heading-ref IDENTITY: the button's STORED ref (the same WeakMap accessor 3.1 will
//     read) === the exact model `headingRef` node — fails if a re-derived node is substituted;
//   - NO innerHTML path: an HTML-looking label renders as literal text (AGENTS.md #3);
//   - `location.href` + `history.length` UNCHANGED after activating an entry (structural F2);
//   - the pure width→initial-state rule is unit-checked with an INJECTED width (jsdom is layout-blind).

import { describe, it, expect, vi } from 'vitest';
import { buildTocModel, type TocEntry } from './tocModel';
import { buildTocView, tocHeadingRef, initialTocOpen } from './tocView';

/** A reader-root-shaped container from an HTML string (test scaffolding only). */
function rootFrom(html: string): HTMLElement {
  const root = document.createElement('div');
  root.className = 'peekover-reader';
  root.innerHTML = html;
  return root;
}

/** A fresh shadow-host stand-in for buildTocView's `host` param (it reads width + sets data-toc). */
function makeHost(): HTMLElement {
  const host = document.createElement('div');
  document.body.appendChild(host);
  return host;
}

/** Hand-build a leaf entry with an explicit ref + label (for label/threshold fixtures). */
function leaf(label: string, headingRef: Element): TocEntry {
  return { headingRef, level: 1, label, children: [] };
}

/** The entry (leaf) buttons of a rail, in document order. */
function links(rail: Node): HTMLButtonElement[] {
  return Array.from((rail as HTMLElement).querySelectorAll<HTMLButtonElement>('button.peekover-toc__link'));
}

describe('buildTocView — right-rail chrome (jsdom shape)', () => {
  describe('threshold: present at ≥2 headings, omitted at 0 and 1', () => {
    it('returns null for a model with no headings (0 → no rail)', () => {
      expect(buildTocView(makeHost(), buildTocModel(rootFrom('<p>nothing</p>')))).toBeNull();
    });

    it('returns null for a single-heading model (1 → no rail, no navigation value)', () => {
      expect(buildTocView(makeHost(), buildTocModel(rootFrom('<h1>Only</h1>')))).toBeNull();
    });

    it('builds a rail at 2 headings — even when they nest to ONE top-level row (total count, not model.length)', () => {
      // <h1>A</h1><h2>B</h2> → model.length === 1 (A, with child B), total headings === 2.
      const rail = buildTocView(makeHost(), buildTocModel(rootFrom('<h1>A</h1><h2>B</h2>')));
      expect(rail).not.toBeNull();
      expect(links(rail!).map((b) => b.textContent)).toEqual(['A', 'B']);
    });
  });

  describe('a11y: nav landmark + nested <ol>, aria-current supported, never role=tree', () => {
    it('is a <nav aria-label="Table of contents"> wrapping a nested <ol> that mirrors doc nesting', () => {
      const rail = buildTocView(makeHost(), buildTocModel(rootFrom('<h1>A</h1><h2>B</h2><h1>C</h1>')))! as HTMLElement;

      expect(rail.tagName).toBe('NAV');
      expect(rail.getAttribute('aria-label')).toBe('Table of contents');

      const topList = rail.querySelector(':scope > ol.peekover-toc__list')!;
      expect(topList).not.toBeNull();
      // Two top-level rows (A, C); A owns a nested <ol> holding B, C owns none.
      const topItems = topList.querySelectorAll(':scope > li');
      expect(topItems.length).toBe(2);
      const aNested = topItems[0].querySelector(':scope > ol.peekover-toc__list')!;
      expect(aNested).not.toBeNull();
      expect(aNested.querySelector('button.peekover-toc__link')!.textContent).toBe('B');
      expect(topItems[1].querySelector(':scope > ol')).toBeNull(); // C is a leaf
    });

    it('uses buttons for entries, supports aria-current="location", and uses NO tree roles', () => {
      const rail = buildTocView(makeHost(), buildTocModel(rootFrom('<h1>A</h1><h2>B</h2>')))! as HTMLElement;

      // Entries are <button>s (interactive wayfinding), the correct host for aria-current.
      const entries = links(rail);
      expect(entries.length).toBeGreaterThan(0);
      entries.forEach((b) => expect(b.tagName).toBe('BUTTON'));

      // aria-current is supported on an entry (the scroll-spy sets it in 3.2).
      entries[0].setAttribute('aria-current', 'location');
      expect(entries[0].getAttribute('aria-current')).toBe('location');

      // NOT a tree: no role=tree/treeitem/aria-selected anywhere (that is treeView's pattern).
      expect(rail.querySelector('[role="tree"],[role="treeitem"],[aria-selected]')).toBeNull();
    });
  });

  describe('collapse: disclosure flips aria-expanded AND hides/shows the subtree', () => {
    it('toggles the child <ol> hidden and the aria-expanded state, both directions', () => {
      const rail = buildTocView(makeHost(), buildTocModel(rootFrom('<h1>Parent</h1><h2>Child</h2>')))! as HTMLElement;

      const twist = rail.querySelector<HTMLButtonElement>('button.peekover-toc__twist')!;
      const childList = rail.querySelector<HTMLElement>('li ol.peekover-toc__list')!;

      // Starts expanded + visible.
      expect(twist.getAttribute('aria-expanded')).toBe('true');
      expect(childList.hidden).toBe(false);

      twist.click(); // collapse
      expect(twist.getAttribute('aria-expanded')).toBe('false');
      expect(childList.hidden).toBe(true); // subtree actually hidden

      twist.click(); // expand
      expect(twist.getAttribute('aria-expanded')).toBe('true');
      expect(childList.hidden).toBe(false);
    });

    it('gives a leaf entry NO disclosure button (nothing to collapse)', () => {
      // Two sibling top-level headings → both leaves, no twist anywhere.
      const rail = buildTocView(makeHost(), buildTocModel(rootFrom('<h1>A</h1><h1>B</h1>')))! as HTMLElement;
      expect(rail.querySelector('button.peekover-toc__twist')).toBeNull();
    });
  });

  describe('entry → heading-ref identity (the exact node 3.1 will scroll to)', () => {
    it('stores the EXACT model headingRef against its button, readable via the shared accessor', () => {
      const root = rootFrom('<h1>One</h1><h2>Two</h2><h1>Three</h1>');
      const model = buildTocModel(root);
      const rail = buildTocView(makeHost(), model)!;

      // Flatten model + rail buttons to the same document order and pair them up.
      const flat: TocEntry[] = [];
      const walk = (es: TocEntry[]) => es.forEach((e) => (flat.push(e), walk(e.children)));
      walk(model);
      const buttons = links(rail);
      expect(buttons.length).toBe(flat.length);

      buttons.forEach((btn, i) => {
        const stored = tocHeadingRef(btn);
        // Same node by IDENTITY (===) — the model's ref, which IS the live DOM heading.
        expect(stored).toBe(flat[i].headingRef);
        expect(stored).toBe(root.querySelectorAll('h1,h2,h3,h4,h5,h6')[i]);
      });
    });
  });

  describe('no innerHTML: labels are text, never parsed markup', () => {
    it('renders an HTML-looking label as literal text (no <b> element created)', () => {
      const h = document.createElement('h1');
      const model: TocEntry[] = [leaf('<b>x</b>', h), leaf('plain', document.createElement('h1'))];

      const rail = buildTocView(makeHost(), model)! as HTMLElement;

      // The angle brackets are literal text — no live <b> element was ever parsed into the rail.
      expect(rail.querySelector('b')).toBeNull();
      expect(links(rail)[0].textContent).toBe('<b>x</b>');
    });
  });

  describe('URL untouched (structural F2 — real scroll is 3.1)', () => {
    it('does not change location.href or push a history entry when an entry is activated', () => {
      const rail = buildTocView(makeHost(), buildTocModel(rootFrom('<h1>A</h1><h2>B</h2>')))!;
      const href = location.href;
      const len = history.length;

      links(rail).forEach((b) => b.click()); // activate every entry

      expect(location.href).toBe(href);
      expect(history.length).toBe(len);
    });
  });

  describe('contained is threaded structurally (no CSS here — 2.2 owns fixed→absolute)', () => {
    it('marks the rail contained only when asked', () => {
      const contained = buildTocView(makeHost(), buildTocModel(rootFrom('<h1>A</h1><h2>B</h2>')), {
        contained: true,
      })! as HTMLElement;
      expect(contained.hasAttribute('data-contained')).toBe(true);

      const full = buildTocView(makeHost(), buildTocModel(rootFrom('<h1>A</h1><h2>B</h2>')))! as HTMLElement;
      expect(full.hasAttribute('data-contained')).toBe(false);
    });
  });

  describe('initial open/collapsed: pure width rule, unit-checked with an injected width', () => {
    it('opens on a wide scrollport and collapses on a narrow one (the design breakpoint)', () => {
      // jsdom is layout-blind (getBoundingClientRect is 0), so the DECISION is factored into
      // this pure rule and checked with injected widths — the real measurement rides to 3.x.
      expect(initialTocOpen(1200)).toBe(true);
      expect(initialTocOpen(400)).toBe(false);
    });

    it('reflects an initial data-toc that is one of the two valid states (never forced-collapsed by a 0-width read)', () => {
      // Defect-2 correction: buildTocView runs pre-commit/pre-layout, so a width read here is a
      // guaranteed 0 — that must NOT hard-force "collapsed" (it did, collapsing the rail
      // everywhere). The attribute must be PRESENT and one of the two valid values; the real
      // width-driven decision rides to the next frame / the real-engine gate (rAF is a no-op in
      // layout-blind jsdom). We assert the invariant, not the old 0-width-means-collapsed bug.
      const host = makeHost();
      buildTocView(host, buildTocModel(rootFrom('<h1>A</h1><h2>B</h2>')));
      expect(['open', 'collapsed']).toContain(host.getAttribute('data-toc'));
    });
  });

  describe('collapsed-state opener: an always-reachable control that flips data-toc', () => {
    it('renders a focusable, labeled toggle button whose aria-expanded tracks data-toc, both directions', () => {
      // Defect-1 correction: "collapsed" must mean collapsed-TO-A-HANDLE, not erased. The rail
      // carries an always-present opener (jsdom-testable: attribute + DOM only, no layout/scroll)
      // that survives the collapsed state and flips the host open⇄collapsed on click.
      const host = makeHost();
      const rail = buildTocView(host, buildTocModel(rootFrom('<h1>A</h1><h2>B</h2>')))! as HTMLElement;

      const opener = rail.querySelector<HTMLButtonElement>('button.peekover-toc__toggle')!;
      expect(opener).not.toBeNull();
      expect(opener.tagName).toBe('BUTTON'); // keyboard-focusable by default, no tabindex hack
      expect((opener.textContent ?? '').trim().length).toBeGreaterThan(0); // has a visible label
      expect(opener.hasAttribute('aria-expanded')).toBe(true); // disclosure state exposed to AT

      // Drive both directions from a known start (jsdom is layout-blind, so pin the state first).
      setTocOpen(host, opener, false);
      expect(host.getAttribute('data-toc')).toBe('collapsed');
      expect(opener.getAttribute('aria-expanded')).toBe('false');

      opener.click(); // collapsed → open
      expect(host.getAttribute('data-toc')).toBe('open');
      expect(opener.getAttribute('aria-expanded')).toBe('true');

      opener.click(); // open → collapsed (the same control toggles both ways)
      expect(host.getAttribute('data-toc')).toBe('collapsed');
      expect(opener.getAttribute('aria-expanded')).toBe('false');
    });
  });

  describe('deferred (rAF) state write: dead-node liveness guard', () => {
    it('no-ops the post-layout frame if the host was torn down before it fired', () => {
      // The initial-state fix schedules a width-driven correction on the next frame. mount() is
      // idempotent and the content-script path can REMOVE the host on a failed/empty re-render;
      // a stale frame must NOT write onto a detached host (the dead-node hazard 2.3's registry
      // prunes). jsdom can't see a real teardown-then-frame, so we drive it: capture the frame
      // instead of running it, stub a REAL width so the deferred decide WOULD write (otherwise
      // the write is a jsdom no-op and the test is vacuous), tear the host down, then flush.
      const host = makeHost(); // makeHost appends to document.body → host.isConnected === true
      const stubWidth = (w: number) => {
        host.getBoundingClientRect = (() => ({ width: w })) as unknown as typeof host.getBoundingClientRect;
      };

      let frame: FrameRequestCallback | null = null;
      vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
        frame = cb;
        return 1;
      });
      try {
        stubWidth(400); // narrow → the SYNC decide pins a definite state
        const rail = buildTocView(host, buildTocModel(rootFrom('<h1>A</h1><h2>B</h2>')))! as HTMLElement;
        host.appendChild(rail); // opener now lives under the host, as in the real shadow mount
        expect(host.getAttribute('data-toc')).toBe('collapsed'); // sync decide @ width 400

        // A later frame at a NOW-WIDE layout would flip it to "open" — but only if it runs.
        stubWidth(1200);
        const before = host.getAttribute('data-toc');

        host.remove(); // teardown: the host (and the opener under it) are now detached
        expect(host.isConnected).toBe(false);

        expect(frame).not.toBeNull(); // a frame really was scheduled
        expect(() => frame!(0)).not.toThrow(); // no throw against the dead node
        // Guarded: the deferred decide bailed, so data-toc is unchanged. Remove the
        // `!host.isConnected || !opener.isConnected` guard and this flips to "open" → RED.
        expect(host.getAttribute('data-toc')).toBe(before);
      } finally {
        vi.unstubAllGlobals();
      }
    });
  });
});

/** Set the rail's open/collapsed state the way buildTocView's internal writer does — used
 *  only to pin a known starting state before exercising the opener (jsdom has no layout, so
 *  the initial state is the documented default). Mirrors the host+aria pairing exactly. */
function setTocOpen(host: HTMLElement, opener: HTMLButtonElement, open: boolean): void {
  host.setAttribute('data-toc', open ? 'open' : 'collapsed');
  opener.setAttribute('aria-expanded', String(open));
}

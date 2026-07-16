// @vitest-environment jsdom
//
// tocModel is pure, but its input is a real DOM `ParentNode`, so its tests run against jsdom —
// the same environment the render pipeline is validated against — building headings the way the
// reader root actually holds them. The four halves mirror the plan's Verify line for task 1.1:
// (a) document order + nesting policy incl. non-monotonic (h1→h3, no synthetic h2) and an
// h3-start baseline; (b) label fallback for empty / image-only / emoji-as-image headings, never
// blank; (c) duplicate texts kept verbatim; (d) consistency-with-root (§3-c4) — every entry maps
// to a real heading node in `root`, and no entry exists for a heading absent from it.

import { describe, it, expect } from 'vitest';
import { buildTocModel, type TocEntry } from './tocModel';

/** Build a detached reader-root-shaped container from an HTML string (test scaffolding only). */
function rootFrom(html: string): HTMLElement {
  const root = document.createElement('div');
  root.className = 'peekover-reader';
  root.innerHTML = html;
  return root;
}

/** Pre-order DFS flatten — for a correctly nested tree this equals document order. */
function flatten(entries: TocEntry[]): TocEntry[] {
  const out: TocEntry[] = [];
  for (const e of entries) {
    out.push(e);
    out.push(...flatten(e.children));
  }
  return out;
}

describe('buildTocModel — pure nested heading model', () => {
  it('returns [] for a root with no headings (crash-free, never throws)', () => {
    expect(buildTocModel(rootFrom('<p>no headings here</p><div></div>'))).toEqual([]);
  });

  describe('(a) document order + nesting policy', () => {
    it('lists headings in document order, nested by level', () => {
      // A ▸ (B ▸ (C), D) ; E
      const model = buildTocModel(
        rootFrom(`
          <h1>A</h1>
          <h2>B</h2>
          <h3>C</h3>
          <h2>D</h2>
          <h1>E</h1>
        `),
      );

      expect(model.map((e) => e.label)).toEqual(['A', 'E']);

      const [a, e] = model;
      expect(a.children.map((c) => c.label)).toEqual(['B', 'D']);
      expect(a.children[0].children.map((c) => c.label)).toEqual(['C']); // B ▸ C
      expect(a.children[1].children).toEqual([]); // D is a leaf
      expect(e.children).toEqual([]); // E is a leaf

      // Flattened pre-order equals document order.
      expect(flatten(model).map((x) => x.label)).toEqual(['A', 'B', 'C', 'D', 'E']);
    });

    it('non-monotonic h1→h3 nests the h3 DIRECTLY under h1 — no synthetic h2', () => {
      const model = buildTocModel(rootFrom('<h1>A</h1><h3>C</h3>'));

      expect(model.map((e) => e.label)).toEqual(['A']);
      const a = model[0];
      // Exactly one child, and it IS the h3 — not an invented level-2 wrapper.
      expect(a.children).toHaveLength(1);
      expect(a.children[0].label).toBe('C');
      expect(a.children[0].level).toBe(3);
      // Nothing anywhere in the tree was fabricated at level 2.
      expect(flatten(model).map((x) => x.level)).toEqual([1, 3]);
    });

    it('normalizes an h3-start doc to the shallowest level present (baseline)', () => {
      // Shallowest level present is 3, so the two h3s are top-level rows; the h4 nests.
      const model = buildTocModel(rootFrom('<h3>A</h3><h4>B</h4><h3>C</h3>'));

      expect(model.map((e) => e.label)).toEqual(['A', 'C']);
      expect(model.every((e) => e.level === 3)).toBe(true);
      expect(model[0].children.map((c) => c.label)).toEqual(['B']);
      expect(model[0].children[0].level).toBe(4);
    });
  });

  describe('(b) label fallback — never blank', () => {
    it('uses trimmed textContent when present', () => {
      const model = buildTocModel(rootFrom('<h1>  Hello world  </h1>'));
      expect(model[0].label).toBe('Hello world');
    });

    it('falls back to a designed label for empty / image-only / emoji-as-image / whitespace headings', () => {
      const model = flatten(
        buildTocModel(
          rootFrom(`
            <h1></h1>
            <h2><img alt=""></h2>
            <h3><img class="emoji" alt=""></h3>
            <h4>   </h4>
          `),
        ),
      );

      // Never blank — each produced a non-empty, designed label.
      for (const e of model) {
        expect(e.label.trim().length).toBeGreaterThan(0);
      }
      // Deterministic chosen form: "Untitled section (H<level> #<doc-order ordinal>)".
      expect(model.map((e) => e.label)).toEqual([
        'Untitled section (H1 #1)',
        'Untitled section (H2 #2)',
        'Untitled section (H3 #3)',
        'Untitled section (H4 #4)',
      ]);
    });
  });

  describe('(c) duplicate heading texts kept verbatim', () => {
    it('keeps identical labels with no slug/id/dedup suffix', () => {
      const model = flatten(buildTocModel(rootFrom('<h1>Setup</h1><h2>Setup</h2><h1>Setup</h1>')));
      // All three verbatim — no "Setup-1", "#setup", etc.
      expect(model.map((e) => e.label)).toEqual(['Setup', 'Setup', 'Setup']);
      for (const e of model) {
        expect(e.label).toBe('Setup');
      }
    });
  });

  describe('(d) consistency with the rendered root (§3-constraint-4)', () => {
    it('every entry.headingRef is a real heading in root, in document order, none extra', () => {
      const root = rootFrom(`
        <p>intro</p>
        <h1>One</h1>
        <div><h2>Two</h2></div>
        <p>body</p>
        <h2>Three</h2>
      `);
      const domHeadings = Array.from(root.querySelectorAll('h1,h2,h3,h4,h5,h6'));
      const refs = flatten(buildTocModel(root)).map((e) => e.headingRef);

      // Same count — no entry invented, none dropped.
      expect(refs).toHaveLength(domHeadings.length);
      // Same nodes, same order, by IDENTITY (===), not a clone.
      expect(refs).toEqual(domHeadings);
      for (const ref of refs) {
        expect(domHeadings).toContain(ref);
      }
    });

    it('holds a live element ref — a heading removed from root yields no entry', () => {
      const root = rootFrom('<h1>Kept</h1><h2>Removed</h2>');
      const removed = root.querySelector('h2')!;
      removed.remove();

      const refs = flatten(buildTocModel(root)).map((e) => e.headingRef);
      expect(refs).toHaveLength(1);
      expect(refs[0]).toBe(root.querySelector('h1'));
      expect(refs).not.toContain(removed); // no entry for a heading absent from root
    });
  });
});

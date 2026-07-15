// Task 2.1 — the PURE recents/pins list logic. No engine: these are pure functions over
// plain arrays, so they live in the fast unit project (no jsdom pragma needed). The
// engine round-trip (IndexedDB persistence, wipe) is proven separately in the real-engine
// browser project (wipe.browser.test.ts, task 2.2) — the retro-honest split: pure logic
// unit-tested, jsdom-blind storage proven in a real engine.

import { describe, it, expect } from 'vitest';
import {
  addRecent,
  removeRecent,
  addPin,
  removePin,
  reorderPin,
  DEFAULT_RECENTS_CAP,
  type RecentLike,
  type PinLike,
} from './recents';

function recent(id: string, folderId: string, path: string): RecentLike {
  return { id, folderId, path };
}
function pin(id: string, path: string, kind: 'file' | 'folder' = 'file', folderId = 'F'): PinLike {
  return { id, kind, folderId, path };
}

describe('addRecent — dedup / cap / order', () => {
  it('prepends a new entry (most-recent first)', () => {
    const a = recent('1', 'F', 'a.md');
    const b = recent('2', 'F', 'b.md');
    const list = addRecent(addRecent([], a), b);
    expect(list.map((r) => r.id)).toEqual(['2', '1']);
  });

  it('dedups by (folderId, path) and moves the re-opened entry to the front, replacing the old row', () => {
    const a = recent('1', 'F', 'a.md');
    const b = recent('2', 'F', 'b.md');
    let list = addRecent(addRecent([], a), b); // [b, a]
    // Re-open a.md with a FRESH row (new id) — same identity, should replace + surface.
    const aAgain = recent('3', 'F', 'a.md');
    list = addRecent(list, aAgain);
    expect(list.map((r) => r.id)).toEqual(['3', '2']); // a re-surfaced as id 3, no dup
    expect(list.filter((r) => r.path === 'a.md')).toHaveLength(1);
  });

  it('treats the same path in DIFFERENT folders as distinct entries', () => {
    const x = recent('1', 'F1', 'readme.md');
    const y = recent('2', 'F2', 'readme.md');
    const list = addRecent(addRecent([], x), y);
    expect(list).toHaveLength(2);
  });

  it('caps the list length, dropping the oldest', () => {
    let list: RecentLike[] = [];
    for (let i = 0; i < 25; i++) list = addRecent(list, recent(`${i}`, 'F', `f${i}.md`), 20);
    expect(list).toHaveLength(20);
    // Newest (24) at front, oldest surviving is 5 (0..4 dropped).
    expect(list[0].id).toBe('24');
    expect(list.at(-1)!.id).toBe('5');
  });

  it('defaults the cap to DEFAULT_RECENTS_CAP', () => {
    let list: RecentLike[] = [];
    for (let i = 0; i < DEFAULT_RECENTS_CAP + 5; i++) list = addRecent(list, recent(`${i}`, 'F', `f${i}.md`));
    expect(list).toHaveLength(DEFAULT_RECENTS_CAP);
  });

  it('does not mutate the input array (pure)', () => {
    const input = [recent('1', 'F', 'a.md')];
    const snapshot = [...input];
    addRecent(input, recent('2', 'F', 'b.md'));
    expect(input).toEqual(snapshot);
  });
});

describe('removeRecent', () => {
  it('removes by id and leaves the rest in order', () => {
    const list = [recent('1', 'F', 'a.md'), recent('2', 'F', 'b.md'), recent('3', 'F', 'c.md')];
    expect(removeRecent(list, '2').map((r) => r.id)).toEqual(['1', '3']);
  });
  it('is a no-op for an unknown id', () => {
    const list = [recent('1', 'F', 'a.md')];
    expect(removeRecent(list, 'nope')).toEqual(list);
  });
});

describe('addPin — idempotent add / order', () => {
  it('appends a new pin at the end (explicit ordering, not move-to-front)', () => {
    const list = addPin(addPin([], pin('1', 'a.md')), pin('2', 'b.md'));
    expect(list.map((p) => p.id)).toEqual(['1', '2']);
  });

  it('is idempotent: re-pinning the same identity returns the list unchanged (no dup, order kept)', () => {
    const first = addPin(addPin([], pin('1', 'a.md')), pin('2', 'b.md'));
    const again = addPin(first, pin('9', 'a.md')); // same (kind,folderId,path) as id 1
    expect(again.map((p) => p.id)).toEqual(['1', '2']);
  });

  it('distinguishes a file pin from a folder pin at the same path', () => {
    const list = addPin(addPin([], pin('1', 'docs', 'file')), pin('2', 'docs', 'folder'));
    expect(list).toHaveLength(2);
  });

  it('does not mutate the input array (pure)', () => {
    const input = [pin('1', 'a.md')];
    const snapshot = [...input];
    addPin(input, pin('2', 'b.md'));
    expect(input).toEqual(snapshot);
  });
});

describe('removePin', () => {
  it('removes by id', () => {
    const list = [pin('1', 'a.md'), pin('2', 'b.md')];
    expect(removePin(list, '1').map((p) => p.id)).toEqual(['2']);
  });
});

describe('reorderPin', () => {
  const base = () => [pin('1', 'a.md'), pin('2', 'b.md'), pin('3', 'c.md')];

  it('moves a pin forward to a target index', () => {
    expect(reorderPin(base(), '3', 0).map((p) => p.id)).toEqual(['3', '1', '2']);
  });
  it('moves a pin backward to a target index', () => {
    expect(reorderPin(base(), '1', 2).map((p) => p.id)).toEqual(['2', '3', '1']);
  });
  it('clamps an out-of-range target index into the list', () => {
    expect(reorderPin(base(), '1', 99).map((p) => p.id)).toEqual(['2', '3', '1']);
    expect(reorderPin(base(), '3', -5).map((p) => p.id)).toEqual(['3', '1', '2']);
  });
  it('is a no-op for an unknown id', () => {
    expect(reorderPin(base(), 'nope', 0).map((p) => p.id)).toEqual(['1', '2', '3']);
  });
  it('does not mutate the input array (pure)', () => {
    const input = base();
    const snapshot = input.map((p) => p.id);
    reorderPin(input, '1', 2);
    expect(input.map((p) => p.id)).toEqual(snapshot);
  });
});

// recents — PURE list logic for recents + pins. No DOM, no IndexedDB, no I/O.
//
// This is the separable seam plan.md §Files calls out: `store` persists what THIS
// computes. Keeping dedup/cap/order and pin add/remove/order as pure functions over
// plain record arrays means the bounded-list decisions are unit-testable in isolation
// (recents.test.ts) with zero engine — the same pure/DOM/engine split M1 used for
// `classifyReaderOutcome`. The `store` layer reads a store, hands the array here, and
// writes back the result; it never re-implements ordering.
//
// Record shapes mirror store.ts's `RecentRecord` / `PinRecord` structurally, but this
// module stays decoupled: it constrains only the fields it reasons about (identity +
// ordering keys), so it never depends on the storage layer.

/** The recents fields this module reasons about (a superset row is fine). */
export interface RecentLike {
  id: string;
  /** Which remembered folder this entry belongs to. */
  folderId: string;
  /** Path within the folder — identity is (folderId, path), so re-opening dedupes. */
  path: string;
}

/** The pin fields this module reasons about. */
export interface PinLike {
  id: string;
  kind: 'file' | 'folder';
  folderId: string;
  path: string;
}

/**
 * Default cap for the recents list. Bounded so the "recently opened" surface stays a
 * short, honest list rather than an unbounded history (a trust posture, not just UX):
 * the store never accumulates more than this many rows.
 */
export const DEFAULT_RECENTS_CAP = 20;

// A printable sentinel separator for composite identity keys. A folderId is a UUID
// (hex + hyphens), so joining folderId + SEP + path is collision-free for our keys. SEP
// is the six-character escape sequence (backslash-u-0-0-0-0) used as literal text, NOT
// an embedded NUL control byte — literal control bytes flag the file "Binary" and break
// edits (AGENTS.md style rule).
const SEP = '\\u0000';

/** Identity of a recent entry: same folder + same path === the same document. */
function recentKey(r: RecentLike): string {
  return `${r.folderId}${SEP}${r.path}`;
}

/** Identity of a pin: kind + folder + path (a file and a folder at one path differ). */
function pinKey(p: PinLike): string {
  return `${p.kind}${SEP}${p.folderId}${SEP}${p.path}`;
}

/**
 * Add (or re-surface) a recent entry: dedup by identity, move-to-front (most-recent
 * first), then cap the length. Re-opening a file already in the list moves it to the
 * front and REPLACES the old row (so a fresher `openedAt` wins) rather than duplicating.
 * Returns a new array; the input is never mutated (pure).
 */
export function addRecent<T extends RecentLike>(
  list: readonly T[],
  entry: T,
  cap: number = DEFAULT_RECENTS_CAP,
): T[] {
  const key = recentKey(entry);
  const withoutDup = list.filter((r) => recentKey(r) !== key);
  return [entry, ...withoutDup].slice(0, Math.max(0, cap));
}

/** Remove a recent entry by id. Pure; absent id is a no-op (returns an equal-content copy). */
export function removeRecent<T extends RecentLike>(list: readonly T[], id: string): T[] {
  return list.filter((r) => r.id !== id);
}

/**
 * Add a pin: idempotent by pin identity. If an equivalent pin already exists the list is
 * returned UNCHANGED (preserving existing order — pinning something twice is a no-op, not
 * a reorder); otherwise the new pin is appended at the end. Pins are ordered explicitly
 * (see `reorderPin`), so a fresh pin joins at the bottom rather than jumping to the top.
 */
export function addPin<T extends PinLike>(list: readonly T[], pin: T): T[] {
  const key = pinKey(pin);
  if (list.some((p) => pinKey(p) === key)) return [...list];
  return [...list, pin];
}

/** Remove a pin by id. Pure; absent id is a no-op. */
export function removePin<T extends PinLike>(list: readonly T[], id: string): T[] {
  return list.filter((p) => p.id !== id);
}

/**
 * Reorder a pin to a target index (user-controlled ordering — the "order" in "pin
 * add/remove/order"). The item is moved, not copied; `toIndex` is clamped into range.
 * An unknown id returns the list unchanged. Returns a new array (pure).
 */
export function reorderPin<T extends PinLike>(list: readonly T[], id: string, toIndex: number): T[] {
  const from = list.findIndex((p) => p.id === id);
  if (from === -1) return [...list];
  const clamped = Math.max(0, Math.min(toIndex, list.length - 1));
  const next = [...list];
  const [moved] = next.splice(from, 1);
  next.splice(clamped, 0, moved);
  return next;
}

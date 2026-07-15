// Task 5.1 (unit) — the query→request→gate re-grant MECHANISM as pure promise logic.
//
// This is the fast, engine-free half of the M1 split: the gate's DECISIONS (query first,
// don't re-nudge an existing grant, request on the gesture, and — the trust property — NEVER
// walk without a live grant) are pure orchestration over the handle's permission API, so they
// are unit-testable with a controllable-permission fake. The REAL-ENGINE proof (genuine
// reload + isSameEntry, and the mechanism run in a real browser with the honesty-split note)
// is handlePersist.browser.test.ts. Neither claims the disk `prompt`/`NotAllowedError` ground
// truth — OPFS always reports `granted`, so that is the human gate (decision 4).

import { describe, it, expect, vi } from 'vitest';
import {
  ensureReadPermission,
  reopenFromHandle,
  type PermissionCapableHandle,
} from './reopen';
import type { FolderSource } from './folderSource';

/** A controllable-permission handle: `state` is what queryPermission reports; requesting
 *  resolves to `grantTo` (default `granted`) and records that it was asked. */
function permHandle(opts: {
  state: PermissionState;
  grantTo?: PermissionState;
  noQuery?: boolean;
  noRequest?: boolean;
}): PermissionCapableHandle & { requested: number } {
  const h = {
    requested: 0,
    queryPermission: opts.noQuery ? undefined : vi.fn(async () => opts.state),
    requestPermission: opts.noRequest
      ? undefined
      : vi.fn(async function (this: { requested: number }) {
          h.requested += 1;
          return opts.grantTo ?? 'granted';
        }),
  } as unknown as PermissionCapableHandle & { requested: number };
  return h;
}

describe('ensureReadPermission — query → request → gate', () => {
  it('an already-granted handle proceeds WITHOUT re-prompting (honor "allow on every visit")', async () => {
    const h = permHandle({ state: 'granted' });
    expect(await ensureReadPermission(h)).toBe('granted');
    // The trust posture: never nudge a handle the browser already granted.
    expect((h as unknown as { requestPermission: ReturnType<typeof vi.fn> }).requestPermission).not.toHaveBeenCalled();
  });

  it('a `prompt` handle re-asks on the gesture and returns the granted result', async () => {
    const h = permHandle({ state: 'prompt', grantTo: 'granted' });
    expect(await ensureReadPermission(h)).toBe('granted');
    expect(h.requested).toBe(1); // exactly ONE re-ask — the single gesture
  });

  it('a `prompt` handle the user DECLINES stays non-granted (nothing granted silently)', async () => {
    const h = permHandle({ state: 'prompt', grantTo: 'denied' });
    expect(await ensureReadPermission(h)).toBe('denied');
  });

  it('a handle with no permission API is treated as granted (nothing to re-prompt; disk = human gate)', async () => {
    const h = permHandle({ state: 'prompt', noQuery: true, noRequest: true });
    expect(await ensureReadPermission(h)).toBe('granted');
  });
});

describe('reopenFromHandle — the gate is upstream of every read', () => {
  const fakeSource = (name: string): FolderSource => ({
    name,
    files: [],
    truncated: false,
    persistable: true,
  });

  it('grants → walks → ok, exactly once', async () => {
    const walk = vi.fn(async () => fakeSource('notes'));
    const outcome = await reopenFromHandle({} as FileSystemDirectoryHandle, {}, {
      ensure: async () => 'granted',
      walk,
    });
    expect(outcome.ok).toBe(true);
    if (outcome.ok) expect(outcome.source.name).toBe('notes');
    expect(walk).toHaveBeenCalledTimes(1);
  });

  it('DENIED → designed `denied` outcome and the walk is NEVER called (no silent read)', async () => {
    const walk = vi.fn(async () => fakeSource('x'));
    const outcome = await reopenFromHandle({} as FileSystemDirectoryHandle, {}, {
      ensure: async () => 'prompt', // user did not grant
      walk,
    });
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.reason).toBe('denied');
    // The load-bearing assertion: not a single byte was read without a grant.
    expect(walk).not.toHaveBeenCalled();
  });

  it('granted but the folder is gone (walk throws) → designed `error`, never blank/hang', async () => {
    const outcome = await reopenFromHandle({} as FileSystemDirectoryHandle, {}, {
      ensure: async () => 'granted',
      walk: async () => {
        throw new Error('NotFoundError: folder moved');
      },
    });
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.reason).toBe('error');
  });

  it('the permission check itself throwing → designed `error`, never a throw to the caller', async () => {
    const outcome = await reopenFromHandle({} as FileSystemDirectoryHandle, {}, {
      ensure: async () => {
        throw new Error('permission API blew up');
      },
      walk: async () => fakeSource('x'),
    });
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.reason).toBe('error');
  });
});

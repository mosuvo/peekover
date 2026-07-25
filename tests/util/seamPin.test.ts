// The seam pin's OWN behaviour, proven against a fixture corpus (method b of task 4.1). Each fixture
// under tests/fixtures/seamPin/<name>/ is a single .ts.fixture holding one registration shape; the
// helper is pointed at that subdir and its pass/fail outcome is asserted. This is the red-first proof
// applied to the pin itself (M5 finding 2: "red-first is a count and a reason, not a colour") — the
// `mixed` fixture is a case the OLD file-scoped matcher passed green and the NEW helper reddens on.

import { describe, it, expect } from 'vitest';
import { assertRegistrationsUseFactory } from './seamPin';

const BASE = 'tests/fixtures/seamPin';

/** Run the pin against one fixture subdir with the watch registry's names. */
function runOn(fixture: string, minCallSites = 1): void {
  assertRegistrationsUseFactory({
    roots: [`${BASE}/${fixture}`],
    registerName: 'registerWatchTarget',
    factoryName: 'createWatchController',
    minCallSites,
  });
}

/** The message a throwing run produced — fails loudly if the run did NOT throw. */
function messageFrom(fn: () => void): string {
  try {
    fn();
  } catch (e) {
    return (e as Error).message;
  }
  throw new Error('expected assertRegistrationsUseFactory to throw, but it returned normally');
}

describe('assertRegistrationsUseFactory — the shared seam pin (D-2, task 4.1)', () => {
  it('clause 1: an inline factory call passes', () => {
    expect(() => runOn('correct-inline')).not.toThrow();
  });

  it('clause 2: a bare identifier traced to a same-file factory assignment passes', () => {
    expect(() => runOn('correct-traced')).not.toThrow();
  });

  it('fails an inline object literal (no factory call)', () => {
    const msg = messageFrom(() => runOn('handbuilt-inline'));
    expect(msg).toContain('handbuilt-inline/target.ts.fixture');
    expect(msg).toContain('neither `createWatchController(...)`');
  });

  it('fails a bare identifier whose same-file assignment is not the factory', () => {
    const msg = messageFrom(() => runOn('handbuilt-traced'));
    expect(msg).toContain('argument `handBuilt` is a bare identifier');
    expect(msg).toContain('no `createWatchController(` assignment');
  });

  it('★ mixed: reddens on the hand-built call site while the correct one traces green', () => {
    const msg = messageFrom(() => runOn('mixed'));
    // The offending call site is NAMED (the file-scoped matcher would have missed it — the file
    // contains createWatchController( via `good`).
    expect(msg).toContain('argument `bad` is a bare identifier');
    // And the passing clause-2 trace is shown resolved, so a reviewer reading the red sees what the
    // green trace pointed at (the flag: a message without the traced line is unactionable).
    expect(msg).toContain('argument `good` traced to');
    expect(msg).toContain(`${BASE}/mixed/target.ts.fixture:`);
  });

  it('non-vacuity: an empty corpus trips the minCallSites floor', () => {
    const msg = messageFrom(() => runOn('absent', 1));
    expect(msg).toContain('no registerWatchTarget call sites found');
  });
});

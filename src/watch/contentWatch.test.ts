// The pins that would have caught task 4.8's defect — and its two siblings.
//
// ── WHY THESE ARE SOURCE-TEXT PINS AND NOT BEHAVIOUR TESTS ─────────────────────────────────
//
// `installContentWatch`'s BEHAVIOUR is proven in a real engine, on the real reader, in
// `tests/browser/watchContentWiring.browser.test.ts`: a detector callback carrying new text
// re-renders the content-script host. What no test can do is LOAD `entrypoints/peekover.content.ts`
// — a WXT entrypoint imports the virtual `#imports` module, which neither Vitest project can
// resolve. So the last link in the chain, "and the entrypoint calls that function", is reachable
// only by reading the file as TEXT.
//
// That is not a workaround invented here: `watchRelay.test.ts` already pins `WATCHABLE_EXTENSIONS`
// against the entrypoint's `matches` exactly this way, for exactly this reason.
//
// ── THE SECOND PIN IS ABOUT A CLASS, NOT ABOUT THIS BUG ────────────────────────────────────
//
// Spec 005 shipped THREE instances of one shape: `observerDetector` built, tested and imported by
// nothing (4.7); the watch pill absent on the first file of a session (4.7); and a content-script
// `WatchTarget` whose `start()` re-rendered nothing (4.8). Each was invisible to a green suite for
// the same reason — **every watch test registers its own target before mounting**, so no test ever
// asked which target PRODUCTION registers.
//
// The generalisation of 4.8 is: *a `WatchTarget` reaching the registry from production code must be
// one the suite has proven can render.* Only `createWatchController` produces such a target — it is
// the sole thing in the codebase that holds a host, calls `mount`, and wires `onError`. So the pin
// is: every production `registerWatchTarget(...)` call site builds its target with
// `createWatchController`. Run against the pre-4.8 tree it went RED on `watchRelay.ts`, which
// registered a hand-built target whose `start(host)` ignored the host (verified, not assumed —
// see the task record).
//
// As of D-2 (task 4.1) this pin no longer scans for the factory name file-wide — it delegates to the
// shared CALL-SITE-SCOPED helper `assertRegistrationsUseFactory` (tests/util/seamPin.ts), which
// inspects each call's actual argument. That closes the hole a file-scoped matcher leaves once two
// registrations sit in one file (appShell.installWatchForFile, after 2.1): a file holding one correct
// and one hand-built registration used to pass green. The helper's clause 2 also understands
// appShell's DELIBERATE mutable-ref shape (`controller` assigned from `createWatchController` a line
// above the register), so the legitimate variable form passes without inlining. The diff registry's
// twin pin, built on the same helper, lives beside its own registry in src/render/diffRegistry.test.ts.
//
// **If a future target is legitimately hand-built** (a stub surface, a second controller shape),
// this test is the place that has to be argued with, deliberately, rather than a silent green.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertRegistrationsUseFactory } from '../../tests/util/seamPin';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));

const ENTRYPOINT = join(ROOT, 'entrypoints', 'peekover.content.ts');

describe('the content script wires watch through the function this suite can test', () => {
  it('calls installContentWatch, and imports it from src/watch/contentWatch', () => {
    const source = readFileSync(ENTRYPOINT, 'utf8');

    expect(
      source.includes('installContentWatch({'),
      'the content script must delegate its watch wiring to installContentWatch — the browser ' +
        'suite proves THAT function renders, and this is the only link tying the two together',
    ).toBe(true);
    expect(source).toMatch(/import\s*\{\s*installContentWatch\s*\}\s*from\s*'@\/src\/watch\/contentWatch'/);
  });

  it('passes the three WXT/engine-bound values, and nothing else, into it', () => {
    // The residual that no test can execute is exactly these three lines. Naming them here means a
    // future change that starts making DECISIONS in the entrypoint again — the shape that hid this
    // bug for a whole milestone — has to walk past an assertion saying so.
    const source = readFileSync(ENTRYPOINT, 'utf8');
    const call = source.slice(source.indexOf('installContentWatch({'));
    const body = call.slice(0, call.indexOf('});') + 3);

    expect(body).toContain('url: location.href');
    expect(body).toContain('browser.runtime.sendMessage(message)');
    expect(body).toContain('backgroundCanReadFileUrls: !import.meta.env.FIREFOX');
  });

  it('no longer references the deleted 4.1 placeholder', () => {
    const source = readFileSync(ENTRYPOINT, 'utf8');
    expect(source).not.toContain('registerWatchDetector');
  });
});

describe('THE CLASS PIN — every production watch target is one that can render (D-2)', () => {
  it('every production registerWatchTarget call site builds its target with createWatchController', () => {
    assertRegistrationsUseFactory({
      roots: ['src', 'entrypoints'],
      registerName: 'registerWatchTarget',
      factoryName: 'createWatchController',
      // The two production call sites: appShell.installWatchForFile (clause 2 — the mutable-ref
      // `controller`) and contentWatch.installContentWatch (clause 1 — inline). No un-loadable
      // entrypoint registers a watch target — the content-script's registration lives in the
      // loadable src/ file contentWatch.ts — so there is no entrypoint source-text pin to add.
      minCallSites: 2,
    });
  });
});

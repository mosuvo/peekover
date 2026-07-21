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
// `createWatchController`. Run against the pre-4.8 tree it goes RED on `watchRelay.ts`, which
// registered a hand-built target whose `start(host)` ignored the host (verified, not assumed —
// see the task record).
//
// **If a future target is legitimately hand-built** (a stub surface, a second controller shape),
// this test is the place that has to be argued with, deliberately, rather than a silent green.

import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));

const ENTRYPOINT = join(ROOT, 'entrypoints', 'peekover.content.ts');

/** Every production `.ts` under `dir` — tests excluded, because a test registering its own target
 *  is exactly the legitimate thing this pin must not flag. */
function productionSources(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      if (name === 'node_modules') continue;
      out.push(...productionSources(path));
      continue;
    }
    if (!name.endsWith('.ts') || name.endsWith('.test.ts')) continue;
    out.push(path);
  }
  return out;
}

/** Lines that CALL `registerWatchTarget`, with the declaration and every comment filtered out. */
function registrationLines(source: string): string[] {
  return source.split('\n').filter((line) => {
    const trimmed = line.trim();
    if (!trimmed.includes('registerWatchTarget(')) return false;
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return false;
    return !trimmed.includes('export function registerWatchTarget');
  });
}

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

describe('THE CLASS PIN — every production watch target is one that can render', () => {
  it('builds every registered WatchTarget with createWatchController', () => {
    const files = [
      ...productionSources(join(ROOT, 'src')),
      ...productionSources(join(ROOT, 'entrypoints')),
    ];

    const registrars = files
      .map((path) => ({ path, source: readFileSync(path, 'utf8') }))
      .filter(({ source }) => registrationLines(source).length > 0);

    // Non-vacuity: if this ever drops to zero the pin has stopped watching anything, which would
    // be the same silent-green failure it exists to prevent.
    expect(registrars.length, 'no registerWatchTarget call sites found — did the seam move?')
      .toBeGreaterThan(0);

    const handBuilt = registrars
      .filter(({ source }) => !source.includes('createWatchController('))
      .map(({ path }) => path.slice(ROOT.length).replace(/\\/g, '/'));

    expect(
      handBuilt,
      'these register a WatchTarget that no suite has proven can re-render — the 005 defect class ' +
        '(4.7 twice, 4.8 once). Use createWatchController, or argue with this test on purpose.',
    ).toEqual([]);
  });
});

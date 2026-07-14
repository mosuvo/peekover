import { describe, it, expect } from 'vitest';

// Scaffold smoke test — proves the vitest toolchain runs. Real render-pipeline
// tests will be colocated (foo.ts + foo.test.ts) per AGENTS.md.
describe('scaffold smoke', () => {
  it('runs the test toolchain', () => {
    expect(1 + 1).toBe(2);
  });
});

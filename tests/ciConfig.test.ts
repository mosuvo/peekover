import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// The CI-CONFIG PIN (013 task 1.1; plan D-13; G-13). CI's shape is a trust claim: "every change
// on main is checked" is only true if ci.yml runs on push to main, and a reproducible build is
// only reproducible if the toolchain versions come from one place. This pins:
//   1. ci.yml runs on push to main AND on pull requests;
//   2. no pnpm/action-setup step carries `version:` — pnpm comes from package.json's
//      `packageManager` (the action reads it when `version` is absent);
//   3. `packageManager` names an exact pnpm version;
//   4. every actions/setup-node step reads the ONE shared Node pin, `.nvmrc`, which says 22;
//   5. dependabot.yml states no dependency count (a count rots on the next addition).
//
// Plain-text checks, not a YAML parser: none is a direct dependency, and these shapes are ours.
// Extended by tasks 7.3–7.4 (release workflow).

const ROOT = process.cwd();
const WORKFLOWS = join(ROOT, '.github/workflows');
const read = (p: string): string => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');

const workflowFiles = readdirSync(WORKFLOWS).filter((f) => /\.ya?ml$/.test(f));
const workflows = workflowFiles.map((f) => ({ file: f, text: read(`.github/workflows/${f}`) }));

/** Each `- ` list item in a workflow, with its indented body (a step, in practice). */
function steps(text: string): string[] {
  return text.split(/^(?=\s*- )/m);
}

function stepsUsing(action: string): Array<{ file: string; step: string }> {
  return workflows.flatMap(({ file, text }) =>
    steps(text)
      .filter((s) => s.includes(`uses: ${action}@`))
      .map((step) => ({ file, step })),
  );
}

/** The lines of a top-level YAML key's block, e.g. `on:`. */
function topLevelBlock(text: string, key: string): string {
  const m = new RegExp(`^${key}:\\s*\\n((?:[ \\t]+.*\\n|\\s*\\n)*)`, 'm').exec(text);
  return m?.[1] ?? '';
}

const pkg = JSON.parse(read('package.json')) as { packageManager?: string; engines?: { node?: string } };

describe('CI config (013 task 1.1, D-13)', () => {
  it('ci.yml runs on push to main AND on pull_request', () => {
    const on = topLevelBlock(read('.github/workflows/ci.yml'), 'on');
    expect(on, 'ci.yml has an `on:` block').not.toBe('');
    expect(on).toMatch(/^ {2}pull_request:/m);
    expect(on).toMatch(/^ {2}push:\s*\n {4}branches: \[main\]/m);
  });

  it('no pnpm/action-setup step hardcodes a pnpm `version:`', () => {
    const found = stepsUsing('pnpm/action-setup');
    // Firing control: the scan must see the steps it governs, or an empty match passes trivially.
    expect(found.filter((s) => s.file === 'ci.yml').length).toBeGreaterThan(0);
    expect(found.filter((s) => s.file === 'supply-chain.yml').length).toBeGreaterThan(0);
    const offenders = found.filter(({ step }) => /^\s*version:/m.test(step)).map((s) => s.file);
    expect(offenders, 'pnpm/action-setup steps with `version:`').toEqual([]);
  });

  it('package.json pins pnpm exactly via packageManager', () => {
    expect(pkg.packageManager).toMatch(/^pnpm@\d+\.\d+\.\d+$/);
  });

  it('every setup-node step reads the one shared Node pin, .nvmrc = 22', () => {
    expect(existsSync(join(ROOT, '.nvmrc')), '.nvmrc exists').toBe(true);
    expect(read('.nvmrc').trim()).toBe('22');
    const found = stepsUsing('actions/setup-node');
    expect(found.length, 'setup-node steps found').toBeGreaterThan(0);
    const offenders = found
      .filter(({ step }) => !/^\s*node-version-file: \.nvmrc\s*$/m.test(step) || /^\s*node-version:/m.test(step))
      .map((s) => s.file);
    expect(offenders, 'setup-node steps not reading .nvmrc').toEqual([]);
    // Advisory for local developers (pnpm warns, never fails, without engine-strict).
    expect(pkg.engines?.node).toBe('>=22');
  });

  it('dependabot.yml states no runtime-dependency count', () => {
    const text = read('.github/dependabot.yml');
    const COUNT = '\\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|\\d+)\\s+';
    expect(text).not.toMatch(new RegExp(`${COUNT}runtime dependenc`, 'i'));
    // The same count, spelled as "libraries" (it sat at the runtime group's comment).
    expect(text).not.toMatch(new RegExp(`${COUNT}librar`, 'i'));
  });
});

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

  // ── M13 task 1.4, second addendum — the OSV job's SARIF upload (PR #14; every main run since
  // at least 2026-10-12 failed here). The repository is PRIVATE and owned by a personal account;
  // GitHub's docs: code scanning on a private repository needs GitHub Code Security, i.e. GitHub
  // Team or Enterprise — Free and Pro get it on public repositories only. So the upload runs only
  // when the repository is public (the attestation pattern, plan G-9), the scan keeps running and
  // stays advisory (`continue-on-error` — the recorded blocking/advisory split; `pnpm audit --prod`
  // blocks), and the SARIF is kept as a workflow artifact meanwhile. codeql-action moves to v4
  // (v3 is deprecated in December 2026).
  it('the OSV job: scan advisory, SARIF kept as an artifact, upload v4 and only on a public repo', () => {
    const text = read('.github/workflows/supply-chain.yml');
    const job = /^ {2}osv:\n((?: {4,}.*\n|\s*\n)*)/m.exec(text)?.[1] ?? '';
    expect(job, 'supply-chain.yml has an osv job').not.toBe('');
    const jobSteps = steps(job);
    const scan = jobSteps.find((s) => s.includes('uses: google/osv-scanner-action/'));
    const upload = jobSteps.find((s) => s.includes('uses: github/codeql-action/upload-sarif@'));
    const artifact = jobSteps.find((s) => s.includes('uses: actions/upload-artifact@'));
    expect(scan, 'the scan step').toBeDefined();
    expect(scan!).toMatch(/^\s*continue-on-error: true\s*$/m);
    expect(upload, 'the upload step').toBeDefined();
    // Pinned by SHA since 7.4a; the trailing comment names the version.
    expect(upload!).toMatch(/uses: github\/codeql-action\/upload-sarif@[0-9a-f]{40} # v4\.\d+\.\d+\s*$/m);
    expect(upload!).toMatch(/^\s*if: .*!github\.event\.repository\.private/m);
    expect(artifact, 'the SARIF is kept as a workflow artifact').toBeDefined();
    expect(artifact!).toMatch(/osv-results\.sarif/);
    // Least privilege: the job grants what the upload needs on a public repository, nothing broader.
    expect(job).toMatch(/^ {4}permissions:\n {6}contents: read\n {6}security-events: write\n/m);
    // No workflow still uses CodeQL Action v3.
    const v3 = workflows.filter(({ text: t }) => /uses: github\/codeql-action\/[\w-]+@(?:v3\b|[0-9a-f]{40} # v3\.)/.test(t)).map((w) => w.file);
    expect(v3, 'workflows still on codeql-action v3').toEqual([]);
  });

  // M13 task 7.3 (D-14; G-8): a job builds the commit twice from clean clones and fails on any difference.
  it('ci.yml has the double-build job: two clean builds compared, the hashes in the run summary', () => {
    const text = read('.github/workflows/ci.yml');
    const job = /^ {2}reproducible:\n((?: {4,}.*\n|\s*\n)*)/m.exec(text)?.[1] ?? '';
    expect(job, 'ci.yml has a reproducible job').not.toBe('');
    const jobSteps = steps(job);
    const compare = jobSteps.find((s) => s.includes('scripts/compare-builds.ts --twice'));
    expect(compare, 'a step runs compare-builds.ts --twice').toBeDefined();
    // pipefail, so a mismatch fails the step through `tee`.
    expect(compare!).toMatch(/^\s*shell: bash\s*$/m);
    expect(jobSteps.some((s) => s.includes('GITHUB_STEP_SUMMARY')), 'the hashes go to the run summary').toBe(true);
    expect(jobSteps.some((s) => /pnpm install --frozen-lockfile/.test(s)), 'a frozen install').toBe(true);
  });

  it('dependabot.yml states no runtime-dependency count', () => {
    const text = read('.github/dependabot.yml');
    const COUNT = '\\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|\\d+)\\s+';
    expect(text).not.toMatch(new RegExp(`${COUNT}runtime dependenc`, 'i'));
    // The same count, spelled as "libraries" (it sat at the runtime group's comment).
    expect(text).not.toMatch(new RegExp(`${COUNT}librar`, 'i'));
  });
});

// ── M13 task 7.4 (D-14; G-9): the release and Pages workflows. ──────────────────────────────────────────────────

/** A job's indented body under `jobs:`. */
function jobBlock(text: string, name: string): string {
  return new RegExp(`^ {2}${name}:\\n((?: {4,}.*\\n|\\s*\\n)*)`, 'm').exec(text)?.[1] ?? '';
}

/** The names under a block, at the given indent, e.g. the triggers under `on:`. */
function keysAt(block: string, indent: number): string[] {
  return [...block.matchAll(new RegExp(`^ {${indent}}([\\w-]+):`, 'gm'))].map((m) => m[1]);
}

/** A job's `permissions:` as sorted `scope: level` lines; null when the job has none. */
function jobPermissions(job: string): string[] | null {
  const m = /^ {4}permissions:\n((?: {6}.*\n)*)/m.exec(job);
  return m ? m[1].split('\n').map((l) => l.trim()).filter(Boolean).sort() : null;
}

const RELEASE = '.github/workflows/release.yml';
const PAGES = '.github/workflows/pages.yml';

describe('the release workflow (013 task 7.4, D-14; G-9)', () => {
  const text = (): string => read(RELEASE);

  it('runs only on a v* tag and by hand — no branch, pull request or schedule trigger', () => {
    const on = topLevelBlock(text(), 'on');
    expect(on, 'release.yml has an `on:` block').not.toBe('');
    expect(keysAt(on, 2).sort(), 'release.yml triggers').toEqual(['push', 'workflow_dispatch']);
    const push = /^ {2}push:\n((?: {4,}.*\n)*)/m.exec(on)?.[1] ?? '';
    expect(keysAt(push, 4), 'release.yml push filters').toEqual(['tags']);
    expect(push).toMatch(/^ {4}tags: \['v\*'\]\s*$/m);
  });

  it('a hand run is a dry run by default, and a dry run creates no release', () => {
    const on = topLevelBlock(text(), 'on');
    expect(on).toMatch(/^ {6}dry_run:\n(?: {8}.*\n)*? {8}type: boolean\n(?: {8}.*\n)*? {8}default: true\n/m);
    const release = jobBlock(text(), 'release');
    expect(release, 'release.yml has a release job').not.toBe('');
    const cond = /^ {4}if: >-\n((?: {6}.*\n)*)/m.exec(release)?.[1].replace(/\s+/g, ' ') ?? '';
    expect(cond, 'the release job runs only from a tag').toContain("github.ref_type == 'tag'");
    expect(cond, 'a hand run creates a release only with dry_run off').toContain("(github.event_name == 'push' || !inputs.dry_run)");
  });

  it('creates a DRAFT release only — never publishes, never uploads to a store', () => {
    const t = text();
    const creates = t.match(/gh release create\b[^\n]*/g) ?? [];
    expect(creates, 'one gh release create').toHaveLength(1);
    expect(creates[0]).toMatch(/--draft\b/);
    expect(creates[0]).toMatch(/--verify-tag\b/);
    expect(t, 'a release action other than gh').not.toMatch(/action-gh-release|create-release@/);
    expect(t, 'a step that publishes a release').not.toMatch(/gh release edit|--draft=false|draft: false|--latest\b/);
    expect(t, 'a store upload').not.toMatch(/web-ext sign|chrome-webstore|webstore-upload|addons\.mozilla\.org|microsoftedge|AMO_|CWS_/i);
  });

  // GO-LIVE 5.5 (2026-11-12): publishing keeps the body, so a body that said "Draft." had to be edited by hand on the
  // published v0.1.0. The body is the one the human published: true while a draft and after.
  it('the release notes read the same as a draft and once published (no "Draft." in the body)', () => {
    const notes = /--notes "([^"]*)"/.exec(text())?.[1];
    expect(notes, 'release.yml passes --notes').toBeDefined();
    expect(notes).toBe('What changed: CHANGELOG.md. To check a download, compare it with SHA256SUMS; to rebuild it, see docs/trust/REPRODUCING.md.');
  });

  it('checks the tag equals package.json\'s version before building', () => {
    const t = text();
    const check = steps(t).find((s) => /^\s*- name: Check the tag equals package\.json's version/m.test(s));
    expect(check, 'the tag/version check step').toBeDefined();
    expect(check!).toMatch(/require\('\.\/package\.json'\)\.version/);
    expect(check!).toMatch(/"\$REF_NAME" != "v\$version"/);
    expect(check!).toMatch(/exit 1/);
    // It runs before the dependencies are installed, so a wrong tag fails first.
    expect(t.indexOf("Check the tag equals package.json's version")).toBeLessThan(t.indexOf('pnpm install --frozen-lockfile'));
  });

  it('builds both engines from a frozen install, runs lint and unit, proves the build reproducible, ships the files', () => {
    const build = jobBlock(text(), 'build');
    expect(build, 'release.yml has a build job').not.toBe('');
    for (const [what, re] of [
      ['a frozen install', /pnpm install --frozen-lockfile/],
      ['the Chrome zip', /^\s*pnpm zip\s*$/m],
      ['the Firefox zip and sources zip', /^\s*pnpm zip -b firefox\s*$/m],
      ['the SBOM at the commit time', /SOURCE_DATE_EPOCH="\$\(git log -1 --format=%ct\)" pnpm exec tsx scripts\/generate-sbom\.ts/],
      ['lint', /run: pnpm lint\s*$/m],
      ['unit tests', /run: pnpm test\s*$/m],
      ['the clean-clone comparison', /scripts\/compare-builds\.ts --twice/],
      ['the sources zip', /peekover-\$version-sources\.zip/],
      ['THIRD_PARTY_LICENSES', /THIRD_PARTY_LICENSES\.txt/],
      ['SHA256SUMS', /sha256sum -- [^\n]*> SHA256SUMS/],
      ['the zips checked against the comparison', /differs from the clean-clone build/],
    ] as const) {
      expect(build, `the build job: ${what}`).toMatch(re);
    }
  });

  it('attests only when the repository is public, and reports it skipped otherwise', () => {
    const t = text();
    const attest = jobBlock(t, 'attest');
    expect(attest, 'release.yml has an attest job').not.toBe('');
    expect(attest).toMatch(/^ {4}if: \$\{\{ !github\.event\.repository\.private \}\}\s*$/m);
    expect(attest).toMatch(/uses: actions\/attest-build-provenance@/);
    expect(attest).toMatch(/subject-path: 'dist\/\*'/);
    expect(jobBlock(t, 'build'), 'the skip is reported in the run summary').toMatch(/Attestation: skipped/);
  });

  it('grants each job only what it needs, and nothing at the top level', () => {
    const t = text();
    expect(t, 'top-level permissions').toMatch(/^permissions: \{\}\s*$/m);
    const want: Record<string, string[]> = {
      build: ['contents: read'],
      attest: ['attestations: write', 'contents: read', 'id-token: write'],
      release: ['contents: write'],
    };
    const jobs = keysAt(topLevelBlock(t, 'jobs'), 2);
    expect(jobs.sort(), 'release.yml jobs').toEqual(Object.keys(want).sort());
    for (const job of jobs) {
      expect(jobPermissions(jobBlock(t, job)), `permissions of job ${job}`).toEqual(want[job]);
    }
  });

  it('uses no secret but GITHUB_TOKEN', () => {
    for (const p of [RELEASE, PAGES]) {
      const secrets = [...read(p).matchAll(/secrets\.(\w+)/g)].map((m) => m[1]).filter((s) => s !== 'GITHUB_TOKEN');
      expect(secrets, `secrets used in ${p}`).toEqual([]);
    }
  });
});

describe('the Pages workflow (013 task 7.4)', () => {
  it('runs by hand only — no push trigger — and deploys only from main', () => {
    const t = read(PAGES);
    expect(keysAt(topLevelBlock(t, 'on'), 2), 'pages.yml triggers').toEqual(['workflow_dispatch']);
    const deploy = jobBlock(t, 'deploy');
    expect(deploy, 'pages.yml has a deploy job').not.toBe('');
    expect(deploy).toMatch(/^ {4}if: \$\{\{ github\.ref == 'refs\/heads\/main' \}\}\s*$/m);
    expect(deploy).toMatch(/^ {10}path: site\s*$/m);
  });

  it('grants the deploy job only Pages and OIDC, and nothing at the top level', () => {
    const t = read(PAGES);
    expect(t, 'top-level permissions').toMatch(/^permissions: \{\}\s*$/m);
    expect(keysAt(topLevelBlock(t, 'jobs'), 2), 'pages.yml jobs').toEqual(['deploy']);
    expect(jobPermissions(jobBlock(t, 'deploy'))).toEqual(['contents: read', 'id-token: write', 'pages: write']);
  });
});

describe('workflow hygiene (013 tasks 7.4, 7.4a)', () => {
  // 7.4a: every workflow file, not only the release path.
  it('every action in every workflow is pinned by full commit SHA, with its version noted', () => {
    const offenders = workflows.flatMap(({ file, text: t }) =>
      [...t.matchAll(/^\s*(?:- )?uses: (.+)$/gm)]
        .map((m) => m[1].trim())
        .filter((u) => !/^[\w.-]+\/[\w./-]+@[0-9a-f]{40} # v\d+\.\d+\.\d+$/.test(u))
        .map((u) => `${file}: ${u}`),
    );
    // Firing control: the scan sees every workflow, and the actions in each.
    expect([...workflowFiles].sort()).toEqual(['ai-hygiene.yml', 'ci.yml', 'pages.yml', 'release.yml', 'supply-chain.yml']);
    expect(workflows.every(({ text: t }) => /uses: /.test(t)), 'each workflow uses an action').toBe(true);
    expect(offenders, 'actions not pinned by full commit SHA').toEqual([]);
  });

  it('no workflow still attaches the SBOM to a release itself — release.yml does', () => {
    const offenders = workflows.filter(({ text: t }) => /Attach SBOM to release/i.test(t)).map((w) => w.file);
    expect(offenders, 'workflows with an "Attach SBOM to release" step').toEqual([]);
    expect(read('.github/workflows/supply-chain.yml')).not.toMatch(/action-gh-release/);
  });
});

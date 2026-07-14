// @vitest-environment jsdom
//
// Golden-file tests for the render pipeline (AGENTS.md: "Pipeline stages get
// golden-file tests in tests/golden/"). Each hand-written fixture in ./fixtures
// is run through the REAL pipeline — sanitize(parse(source)) — and its output is
// snapshotted to ./output/<name>.html via toMatchFileSnapshot. The snapshot is the
// EXACT string the mount stage would hand to innerHTML: no pretty-printing, no
// normalization of the output. Reviewers read ./output/*.html to see precisely
// what the reader renders (and, for malicious.html, what it neutralizes).
//
// Determinism: fixture SOURCE is normalized \r\n -> \n before parsing so a Windows
// dev machine and Linux CI produce identical snapshots (the repo also pins eol=lf
// via .gitattributes; the normalize is belt-and-suspenders).
//
// CI gate: Vitest refuses to WRITE snapshots when process.env.CI is truthy, so a
// missing or changed snapshot fails CI instead of being silently (re)written.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { parse } from '../../src/render/parse';
import { sanitize } from '../../src/render/sanitize';
import { applyMediaPolicy } from '../../src/render/mediaPolicy';
import {
  buildHugeDoc,
  HUGE_DOC_SECTIONS,
  HUGE_DOC_SECTION_HEADING_RE,
} from './hugeDoc';

/** Run the real pipeline on already-normalized markdown source. */
function render(source: string): string {
  return sanitize(parse(source));
}

// Fixtures live next to this test; resolve from the package root (vitest runs
// from there) rather than import.meta.url, which the jsdom transform rewrites.
const FIXTURE_DIR = join(process.cwd(), 'tests', 'golden', 'fixtures');

/** Read a fixture and normalize line endings so snapshots are cross-platform. */
function readFixture(name: string): string {
  return readFileSync(join(FIXTURE_DIR, `${name}.md`), 'utf8').replace(/\r\n/g, '\n');
}

// The hand-written fixtures snapshotted from the PURE string pipeline (parse ->
// sanitize). `images` is deliberately NOT here — it also exercises the render-layer
// remote-resource policy, which needs a DOM and a page base URL, so it gets its own
// test below. Order is irrelevant (each snapshots to its own file); alphabetical.
const FIXTURES = [
  'broken',
  'code',
  'gfm-torture',
  'headings-inline',
  'inline-html',
  'links',
  'malicious',
  'nesting',
] as const;

describe('golden — fixture documents snapshot to ./output/*.html', () => {
  it.each(FIXTURES)('renders %s.md deterministically', async (name) => {
    const html = render(readFixture(name));
    // The pipeline must always produce SOMETHING (never a blank page).
    expect(html.length).toBeGreaterThan(0);
    await expect(html).toMatchFileSnapshot(`./output/${name}.html`);
  });
});

// ---------------------------------------------------------------------------
// images.md — the fixture that documents the REMOTE-RESOURCE POLICY, not just
// parse/sanitize. It runs the full reader path over the images: parse -> sanitize ->
// applyMediaPolicy, the last step operating on a DETACHED node exactly as mount()
// does before it commits to the live DOM. The snapshot therefore shows the policy's
// output — src -> data-peekover-src + an inert placeholder for remote images, and
// loading="lazy" for the local one — which is the reader's real render.
//
// Base URL: a fixed file:// page, so this ONE snapshot shows BOTH arms of the policy
// at once — the two https images resolve to remote (blocked → placeholder) and the
// ./assets relative image resolves to a sibling file:// path (local → lazy). (On an
// https raw-git page that same relative image would be remote instead; that arm is
// covered by the mediaPolicy unit matrix.)
// ---------------------------------------------------------------------------
const IMAGES_PAGE_URL = 'file:///peekover/doc.md';

describe('golden — images.md through the remote-resource policy', () => {
  it('blocks remote images (src -> data-peekover-src + placeholder), lazies local', async () => {
    const html = render(readFixture('images'));
    // Detached container = the inert, pre-commit context mount() neutralizes in.
    const container = document.createElement('div');
    container.innerHTML = html;
    const blocked = applyMediaPolicy(container, IMAGES_PAGE_URL);
    // The two https images are blocked; the ./assets relative one is local (file page).
    expect(blocked).toBe(2);
    await expect(container.innerHTML).toMatchFileSnapshot('./output/images.html');
  });
});

// ---------------------------------------------------------------------------
// 10th golden case: the ~1 MB huge document. A file snapshot of a megabyte would
// be unreviewable and is not checked in; instead we pin (a) a SHA-256 digest of
// the sanitized output, (b) structural invariants, and (c) a length band. Any
// pipeline change that alters the huge-doc output trips the digest.
// ---------------------------------------------------------------------------

// Recorded digest of sanitize(parse(buildHugeDoc())) — regenerate deliberately
// (and review why the output changed) if this ever fails.
const HUGE_DOC_SHA256 =
  '8bc5094c20b56b978c9048e99e3e35bf8aacdacf5313f8849c36f728bde61bbd';

describe('golden — huge (~1 MB) document', () => {
  it('produces byte-stable output (pinned SHA-256) with expected structure', () => {
    const source = buildHugeDoc();
    // Source is generated with \n only, so no normalization is needed here.
    const html = render(source);

    const digest = createHash('sha256').update(html, 'utf8').digest('hex');
    // Log so a deliberate regeneration can copy the new value from CI output.
    console.log(
      `[golden] huge-doc: source=${source.length}B output=${html.length}B ` +
        `sha256=${digest}`,
    );

    // (a) pinned digest — the strongest guard: any change to parse/sanitize over
    //     this input changes this hex.
    expect(digest).toBe(HUGE_DOC_SHA256);

    // (b) structural invariants — independent of the digest, so a mismatch is
    //     diagnosable even if the digest is mid-regeneration.
    const headings = html.match(HUGE_DOC_SECTION_HEADING_RE) ?? [];
    expect(headings.length).toBe(HUGE_DOC_SECTIONS);
    expect(html).not.toContain('<script');
    expect(html).not.toContain('onerror');
    expect(html).not.toMatch(/\son\w+=/);

    // (c) length band — catches gross output-size regressions without being
    //     brittle to single-byte drift.
    expect(html.length).toBeGreaterThan(1_000_000);
    expect(html.length).toBeLessThan(3_000_000);
  });
});

// Task 3.1 — the PURE bounded/filtered/interruptible walk, unit-tested exhaustively.
//
// This is the single most defect-prone piece in M2: the walk that must NEVER hang or
// blank on a pathological folder (a symlink loop, a million files, all node_modules).
// Because `walkMarkdown` is pure over an abstract node interface, every one of those
// hazards is reproducible in-memory here — no real folder, no engine — so the
// bounded/interruptible behaviour is proven NON-VACUOUSLY in the fast unit project:
//   • the skip-list is proven by making a skipped dir's `children()` THROW if descended;
//   • the cancel path is proven by cancelling mid-enumeration and asserting the tail is
//     never collected;
//   • the depth cap is proven against a genuine INFINITE self-referential (symlink-loop)
//     tree that would hang without the bound.

import { describe, it, expect } from 'vitest';
import {
  walkMarkdown,
  shouldSkipDir,
  isMarkdownFile,
  createCancelToken,
  DEFAULT_WALK_LIMITS,
  type WalkDirNode,
  type WalkFileNode,
  type WalkNode,
} from './walkPolicy';

// --- in-memory node builders ----------------------------------------------------

function file(name: string, text = `# ${name}`): WalkFileNode {
  return { kind: 'file', name, read: async () => text };
}

function dir(name: string, children: WalkNode[]): WalkDirNode {
  return {
    kind: 'directory',
    name,
    children: async function* () {
      for (const c of children) yield c;
    },
  };
}

/** A directory that BLOWS UP if the walk ever opens it — proves a skip is a real skip. */
function poisonDir(name: string): WalkDirNode {
  return {
    kind: 'directory',
    name,
    // children() throws the instant it is called; the walk calls it ONLY to descend, so
    // a green run proves this dir was skipped, never opened (a real, non-vacuous skip).
    children(): AsyncIterable<WalkNode> {
      throw new Error(`walk descended a directory it must skip: ${name}`);
    },
  };
}

/** A self-referential directory: an INFINITE tree (a stand-in for a symlink loop). Only
 *  the depth cap keeps a walk of this from running forever. */
function loopDir(name: string): WalkDirNode {
  const node: WalkDirNode = {
    kind: 'directory',
    name,
    children: async function* () {
      yield file(`${name}.md`);
      yield node; // → itself, forever
    },
  };
  return node;
}

// --- (a) markdown-extension filter ---------------------------------------------

describe('isMarkdownFile — shared extension set', () => {
  it('accepts the M1 markdown extensions (case-insensitive)', () => {
    expect(isMarkdownFile('a.md')).toBe(true);
    expect(isMarkdownFile('B.MARKDOWN')).toBe(true);
    expect(isMarkdownFile('notes.mdx')).toBe(true);
    expect(isMarkdownFile('x.mkdn')).toBe(true);
  });
  it('rejects non-markdown files', () => {
    expect(isMarkdownFile('image.png')).toBe(false);
    expect(isMarkdownFile('README')).toBe(false);
    expect(isMarkdownFile('script.ts')).toBe(false);
    expect(isMarkdownFile('data.json')).toBe(false);
  });
});

describe('walkMarkdown — markdown filter (skips non-markdown early)', () => {
  it('collects only markdown files, skipping everything else', async () => {
    const root = dir('root', [
      file('a.md'),
      file('photo.png'),
      file('c.markdown'),
      file('README'),
      file('script.ts'),
    ]);
    const { files } = await walkMarkdown(root);
    expect(files.map((f) => f.name)).toEqual(['a.md', 'c.markdown']);
  });
});

// --- (b) skip-list --------------------------------------------------------------

describe('shouldSkipDir — heavy dirs + all dotdirs', () => {
  it('skips well-known heavy directories', () => {
    expect(shouldSkipDir('node_modules')).toBe(true);
    expect(shouldSkipDir('dist')).toBe(true);
    expect(shouldSkipDir('coverage')).toBe(true);
    expect(shouldSkipDir('vendor')).toBe(true);
  });
  it('skips ALL dotdirs by the leading-dot rule', () => {
    expect(shouldSkipDir('.git')).toBe(true);
    expect(shouldSkipDir('.cache')).toBe(true);
    expect(shouldSkipDir('.svn')).toBe(true);
    expect(shouldSkipDir('.anything')).toBe(true);
  });
  it('descends ordinary directories', () => {
    expect(shouldSkipDir('docs')).toBe(false);
    expect(shouldSkipDir('src')).toBe(false);
    expect(shouldSkipDir('guide')).toBe(false);
  });
});

describe('walkMarkdown — skip-list (never descends heavy dirs / dotdirs)', () => {
  it('does not open node_modules, .git, or any dotdir (non-vacuous: they would throw)', async () => {
    const root = dir('root', [
      file('keep.md'),
      poisonDir('node_modules'),
      poisonDir('.git'),
      poisonDir('.cache'),
      dir('docs', [file('guide.md')]),
    ]);
    // If the walk descended any poisonDir, its children() would throw and reject this.
    const { files } = await walkMarkdown(root);
    expect(files.map((f) => f.name).sort()).toEqual(['guide.md', 'keep.md']);
  });
});

// --- (c) the cap: file count + depth, with the truncated signal -----------------

describe('walkMarkdown — file-count cap (bounded breadth)', () => {
  it('stops at maxFiles and reports truncated when there is MORE', async () => {
    const root = dir('root', [file('1.md'), file('2.md'), file('3.md'), file('4.md')]);
    const { files, truncated } = await walkMarkdown(root, { limits: { maxFiles: 3, maxDepth: 32 } });
    expect(files.map((f) => f.name)).toEqual(['1.md', '2.md', '3.md']);
    expect(truncated).toBe(true);
  });

  it('does NOT over-report: exactly maxFiles and nothing more finishes clean (truncated false)', async () => {
    const root = dir('root', [file('1.md'), file('2.md'), file('3.md')]);
    const { files, truncated } = await walkMarkdown(root, { limits: { maxFiles: 3, maxDepth: 32 } });
    expect(files).toHaveLength(3);
    expect(truncated).toBe(false);
  });

  it('caps across nested directories, not just the top level', async () => {
    const root = dir('root', [
      file('a.md'),
      dir('sub', [file('b.md'), file('c.md'), file('d.md')]),
    ]);
    const { files, truncated } = await walkMarkdown(root, { limits: { maxFiles: 2, maxDepth: 32 } });
    expect(files.map((f) => f.name)).toEqual(['a.md', 'b.md']);
    expect(truncated).toBe(true);
  });
});

describe('walkMarkdown — depth cap (bounded depth; symlink-loop safe)', () => {
  it('stops descending past maxDepth and reports truncated', async () => {
    const root = dir('root', [
      file('r.md'),
      dir('A', [file('a.md'), dir('B', [file('b.md')])]),
    ]);
    // maxDepth 1: root is depth 0, A is depth 1 (allowed), B is depth 2 (past the cap).
    const { files, truncated } = await walkMarkdown(root, { limits: { maxFiles: 5000, maxDepth: 1 } });
    expect(files.map((f) => f.name).sort()).toEqual(['a.md', 'r.md']);
    expect(truncated).toBe(true);
  });

  it('does not hang on an INFINITE self-referential (symlink-loop) tree', async () => {
    // loopDir yields itself forever; only the depth cap terminates the walk. Without the
    // bound this call would never resolve — its resolving IS the proof the loop is bounded.
    const root = loopDir('loop');
    const { files, truncated } = await walkMarkdown(root, { limits: { maxFiles: 5000, maxDepth: 4 } });
    // One markdown file collected per level down to the cap — finite, not infinite.
    expect(files.length).toBe(5); // depths 0,1,2,3,4 each yield one loop.md before the cap
    expect(files.every((f) => f.name === 'loop.md')).toBe(true);
    expect(truncated).toBe(true);
  });
});

// --- (d) cancel / interrupt -----------------------------------------------------

describe('walkMarkdown — cancel / interrupt', () => {
  it('stops promptly when cancelled mid-enumeration and reports cancelled', async () => {
    const cancel = createCancelToken();
    // Cancel after two files are yielded; the tail must never be collected.
    const root: WalkDirNode = {
      kind: 'directory',
      name: 'root',
      children: async function* () {
        yield file('1.md');
        yield file('2.md');
        cancel.cancel();
        yield file('3.md');
        yield file('4.md');
      },
    };
    const { files, cancelled, truncated } = await walkMarkdown(root, { cancel });
    expect(files.map((f) => f.name)).toEqual(['1.md', '2.md']);
    expect(cancelled).toBe(true);
    expect(truncated).toBe(false);
  });

  it('a token that never cancels lets the walk complete', async () => {
    const cancel = createCancelToken();
    const root = dir('root', [file('1.md'), file('2.md')]);
    const { files, cancelled } = await walkMarkdown(root, { cancel });
    expect(files).toHaveLength(2);
    expect(cancelled).toBe(false);
  });

  it('createCancelToken is one-way idle → cancelled', () => {
    const c = createCancelToken();
    expect(c.cancelled).toBe(false);
    c.cancel();
    expect(c.cancelled).toBe(true);
  });
});

// --- paths + shape --------------------------------------------------------------

describe('walkMarkdown — paths and empty folders', () => {
  it('builds slash-separated paths relative to the walk root', async () => {
    const root = dir('root', [
      file('top.md'),
      dir('docs', [file('intro.md'), dir('deep', [file('nested.md')])]),
    ]);
    const { files } = await walkMarkdown(root);
    expect(files.map((f) => f.path).sort()).toEqual([
      'docs/deep/nested.md',
      'docs/intro.md',
      'top.md',
    ]);
  });

  it('an empty folder walks clean: no files, not truncated, not cancelled', async () => {
    const { files, truncated, cancelled } = await walkMarkdown(dir('empty', []));
    expect(files).toEqual([]);
    expect(truncated).toBe(false);
    expect(cancelled).toBe(false);
  });

  it('a folder of only non-markdown / only skipped dirs yields zero files, not truncated', async () => {
    const root = dir('root', [file('a.png'), file('b.txt'), poisonDir('node_modules')]);
    const { files, truncated } = await walkMarkdown(root);
    expect(files).toEqual([]);
    expect(truncated).toBe(false);
  });

  it('the found file keeps its own reader (read() returns the file contents)', async () => {
    const root = dir('root', [file('x.md', '# real contents')]);
    const { files } = await walkMarkdown(root);
    expect(await files[0].read()).toBe('# real contents');
  });

  it('DEFAULT_WALK_LIMITS are finite (a real bound, not Infinity)', () => {
    expect(Number.isFinite(DEFAULT_WALK_LIMITS.maxFiles)).toBe(true);
    expect(Number.isFinite(DEFAULT_WALK_LIMITS.maxDepth)).toBe(true);
    expect(DEFAULT_WALK_LIMITS.maxFiles).toBeGreaterThan(0);
    expect(DEFAULT_WALK_LIMITS.maxDepth).toBeGreaterThan(0);
  });
});

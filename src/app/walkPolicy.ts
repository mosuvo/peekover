// walkPolicy — the PURE, engine-free heart of the folder walk. This is where the
// "bounded / markdown-filtered / interruptible" requirement lives (spec 002 §3.1), kept
// deliberately separable from any real `FileSystemDirectoryHandle` so the single most
// defect-prone piece in M2 — the thing that must NOT hang or blank on a pathological
// folder (node_modules, .git, a symlink loop, a million files) — is exhaustively
// unit-testable against an in-memory tree, with NO real folder and NO engine.
//
// THE SPLIT (M1 pure/DOM/engine discipline): the walk ALGORITHM and every policy
// DECISION (which files count, which dirs to skip, when to stop, when to cancel) live
// here as pure functions over an abstract node interface. The engine module
// (`chromiumFolderSource`) only ADAPTS a real directory handle into that abstract
// interface — it re-implements none of the walk logic. So this file is where the
// hang/defect risk is proven away, in the fast unit project.
//
// FOUR bounded/interruptible requirements, all enforced here (spec 002 §3.1 acceptance):
//   (a) markdown-extension filter — non-markdown files are skipped early (shared ext
//       set from the M1 detector, so folder mode and file mode agree on "is markdown").
//   (b) skip-list — well-known heavy directories (node_modules, dist, …) and ALL dotdirs
//       (.git, .cache, …) are never descended: the walk does not even open them.
//   (c) a hard CAP — file-count AND depth — with a designed `truncated` signal instead
//       of an unbounded walk. `truncated` is what the UI turns into the "folder too
//       large / still scanning" state (AGENTS.md #5: never a hang, never a blank).
//   (d) a cancel/interrupt token — a caller can stop an in-flight walk (navigate away,
//       revoke) and the walk stops promptly, reporting `cancelled`.
//
// The node interface is async because a real directory enumerates lazily (a handle's
// async iterator; a Firefox `readEntries()` loop that caps at 100/call). `children()`
// hides that paging entirely, so the walk here consumes a plain `AsyncIterable` and the
// bounded/interruptible policy applies UNIFORMLY no matter which engine adapter feeds it.

import { MARKDOWN_EXTENSIONS } from '../detect/isRenderableContext';

// --- the abstract node interface the engine adapts a real handle into -----------

/** A file node the walk may collect. `read()` yields the raw markdown text lazily. */
export interface WalkFileNode {
  kind: 'file';
  name: string;
  read(): Promise<string>;
  /**
   * OPTIONAL, PASS-THROUGH ONLY: the live file handle behind this node, where the engine
   * adapter genuinely has one (Chromium's handle walk). The walk NEVER reads it, never
   * requires it, and no policy decision here depends on it — it is carried to `FoundFile`
   * and no further, exactly as `read` is (spec 005 task 4.7).
   *
   * It exists because the Chromium adapter already HELD a `FileSystemFileHandle` and threw
   * the reference away after closing over it in `read` — which silently forced the app page
   * onto the polled detector and made spec §4's *"detect changes without polling"* criterion
   * false in shipped code. Firefox's two adapters have no handle to set (its picker yields
   * `File`s, its drag route yields `FileSystemFileEntry` — the old Entries API, NOT a
   * `FileSystemHandle`), so they simply leave it absent and the consumer's capability branch
   * falls through to polling on its own. That is the point of it being optional.
   *
   * This is DATA, not policy, so it does not breach the pure/engine split above: it names a
   * lib.dom type in a type position only, the walk stays referentially transparent, and every
   * walk test still runs against an in-memory tree with no engine.
   */
  handle?: FileSystemFileHandle;
}

/** A directory node. `children()` enumerates its entries lazily (async — a real handle
 *  pages its listing; the adapter hides that behind this iterator). */
export interface WalkDirNode {
  kind: 'directory';
  name: string;
  children(): AsyncIterable<WalkNode>;
}

export type WalkNode = WalkFileNode | WalkDirNode;

/** A markdown file the walk found, with its POSIX-style path relative to the walk root. */
export interface FoundFile {
  /** Slash-separated path from the walk root, e.g. `docs/guide/intro.md`. */
  path: string;
  /** The file's own name, e.g. `intro.md`. */
  name: string;
  /** Read the file's raw markdown text (the node's own reader, unchanged). */
  read(): Promise<string>;
  /** The node's own handle, carried through unchanged where the adapter had one. Absent on
   *  every handle-free route. See {@link WalkFileNode.handle}. */
  handle?: FileSystemFileHandle;
}

/** The outcome of a bounded walk. `truncated`/`cancelled` are the never-hang signals. */
export interface WalkResult {
  /** Every markdown file found, in walk order (parent dir entries before descent). */
  files: FoundFile[];
  /**
   * True iff the walk stopped early because it hit the file-count or depth cap — i.e.
   * there is MORE in the folder than we enumerated. The UI turns this into the designed
   * "folder too large / still scanning" state; it is never silently dropped.
   */
  truncated: boolean;
  /** True iff the walk was interrupted via the cancel token before it finished. */
  cancelled: boolean;
}

// --- (c) the hard cap -----------------------------------------------------------

/** The bound on a single walk: a maximum file count AND a maximum directory depth. */
export interface WalkLimits {
  /** Stop collecting after this many markdown files (breadth bound). */
  maxFiles: number;
  /** Do not descend deeper than this many directory levels (depth / loop bound). */
  maxDepth: number;
}

/**
 * Default bounds. `maxFiles` is generous enough for a real docs repo yet finite, so a
 * pathological million-file tree hits the cap and surfaces "too large" rather than
 * hanging. `maxDepth` bounds a symlink LOOP (which presents as unbounded depth) and any
 * absurdly nested tree — a loop can never spin forever because depth is capped.
 */
export const DEFAULT_WALK_LIMITS: WalkLimits = {
  maxFiles: 5000,
  maxDepth: 32,
};

// --- (d) the cancel / interrupt token -------------------------------------------

/** The read-only view of a cancel signal the walk checks each step. */
export interface CancelToken {
  readonly cancelled: boolean;
}

/** A cancel token plus the `cancel()` trigger the caller keeps. */
export interface CancelController extends CancelToken {
  cancel(): void;
}

/** Create a fresh cancel controller (idle → cancelled is one-way). */
export function createCancelToken(): CancelController {
  let flag = false;
  return {
    get cancelled() {
      return flag;
    },
    cancel() {
      flag = true;
    },
  };
}

// --- (b) the skip-list ----------------------------------------------------------

/**
 * Well-known heavy directories we never descend into. These hold no user markdown worth
 * surfacing and would blow the file cap (or the clock) if walked — skipping them is both
 * a performance bound and a "show the user's docs, not their build artifacts" choice.
 * ALL dotfiles-directories (`.git`, `.cache`, `.svn`, …) are skipped by the dotdir rule
 * below, so they are intentionally NOT listed here one by one.
 */
export const SKIP_DIRECTORIES: ReadonlySet<string> = new Set([
  'node_modules',
  'dist',
  'build',
  'out',
  'coverage',
  'vendor',
  'target',
  'bower_components',
]);

/**
 * PURE: should the walk skip (not descend into) a directory named `name`? True for a
 * well-known heavy dir OR any dotdir (a leading `.`). Skipping means the directory is
 * never even opened — the walk does no work inside it at all.
 */
export function shouldSkipDir(name: string): boolean {
  if (name.startsWith('.')) return true; // .git, .cache, .svn, .next, … — all dotdirs
  return SKIP_DIRECTORIES.has(name);
}

// --- (a) the markdown-extension filter ------------------------------------------

/**
 * PURE: is `name` a markdown file by extension? Uses the SAME extension set as the M1
 * file-mode detector (`MARKDOWN_EXTENSIONS`), so folder mode and file mode never disagree
 * on what counts as markdown. Case-insensitive, matched on the trailing extension only.
 */
export function isMarkdownFile(name: string): boolean {
  const lower = name.toLowerCase();
  return MARKDOWN_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

// --- the bounded, interruptible walk itself -------------------------------------

/**
 * PURE (referentially transparent over its node inputs — no DOM, no engine, no globals):
 * eagerly walk `root`, collecting markdown files, honoring EVERY bound at once —
 *   • markdown filter: non-markdown files are skipped and never collected;
 *   • skip-list: heavy dirs / dotdirs are never descended;
 *   • file cap: collection stops at `limits.maxFiles`, setting `truncated`;
 *   • depth cap: descent stops past `limits.maxDepth`, setting `truncated`;
 *   • cancel: `cancel.cancelled` stops the walk promptly, setting `cancelled`.
 *
 * The walk can therefore NEVER hang or run unbounded: breadth is capped by `maxFiles`,
 * depth (and thus any symlink loop) by `maxDepth`, and the caller can interrupt at any
 * point. Both stop signals are reported, never swallowed, so the UI always has a designed
 * state to render (spec 002 §3.1 acceptance; AGENTS.md #5).
 *
 * Order of the guards matters: cancellation and the file cap are checked at the TOP of
 * each entry iteration, BEFORE processing that entry, so `truncated` means "there was
 * genuinely more we did not take" — a folder with exactly `maxFiles` files and nothing
 * else finishes cleanly with `truncated: false`.
 */
export async function walkMarkdown(
  root: WalkDirNode,
  opts: { limits?: WalkLimits; cancel?: CancelToken } = {},
): Promise<WalkResult> {
  const limits = opts.limits ?? DEFAULT_WALK_LIMITS;
  const cancel = opts.cancel;
  const files: FoundFile[] = [];
  let truncated = false;
  let cancelled = false;

  // `depth` is the level of `dir` itself: the root is 0, its subdirectories are 1, etc.
  async function descend(dir: WalkDirNode, prefix: string, depth: number): Promise<void> {
    if (depth > limits.maxDepth) {
      // We were asked to walk deeper than the cap allows — there is more below we won't
      // reach. Report it as truncated rather than silently pretending the tree ends here.
      truncated = true;
      return;
    }
    for await (const node of dir.children()) {
      // (d) interrupt — checked first so a cancel stops the walk as promptly as possible.
      if (cancel?.cancelled) {
        cancelled = true;
        return;
      }
      // (c) breadth cap — checked before processing this entry, so hitting it means there
      // was genuinely a further entry we declined to take.
      if (files.length >= limits.maxFiles) {
        truncated = true;
        return;
      }
      if (node.kind === 'directory') {
        // (b) skip-list — never descend heavy dirs / dotdirs; the dir is not opened.
        if (shouldSkipDir(node.name)) continue;
        await descend(node, `${prefix}${node.name}/`, depth + 1);
        // Propagate an early stop from the recursion back up through every level.
        if (cancelled || truncated) return;
      } else {
        // (a) markdown filter — non-markdown files are skipped early and never collected.
        if (!isMarkdownFile(node.name)) continue;
        files.push({
          path: `${prefix}${node.name}`,
          name: node.name,
          read: node.read,
          handle: node.handle,
        });
      }
    }
  }

  await descend(root, '', 0);
  return { files, truncated, cancelled };
}

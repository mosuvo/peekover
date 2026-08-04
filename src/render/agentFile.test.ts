// agentFile — the predicate's contract, the frozen set's exact membership, and the basename
// extraction including the `decodeURIComponent` step D-2 names (task 1.2).
//
// ── WHICH CASES ARE THE RED-FIRST ONES, AND WHY THEY ARE THE CASE VARIANTS ────────────────────
//
// A predicate has two failure directions and they are NOT equally bad. Failing to recognize
// `CLAUDE.md` costs a badge that never appears — the resting state (`[]`) the feature is designed
// around. Recognizing `claude.md` puts a FALSE CLAIM on screen: it asserts a convention the
// document does not follow. So the case variants (`claude.md`, `Agents.MD`, `SPEC.MD`) and the
// ordinary non-agent names are the assertions that carry the weight, and every one of them was
// proven to FIRE by ablating the module and watching it fail with its own signature (task 1.2's
// evidence; the ablations are named beside each clause below).
//
// ── THE `document`-ABSENCE CONTROL ────────────────────────────────────────────────────────────
//
// §3.4/§4 require recognition from the FILENAME ONLY, never content sniffing. This file carries no
// environment pragma, so it runs in the node environment where `document` is genuinely undefined —
// the predicate is therefore answering with no document in scope at all, and the suite asserts that
// absence directly rather than assuming it, because a pragma added later would silently turn the
// clause vacuous.
//
// ★ And the pragma is not named in prose ANYWHERE in this file, deliberately: vitest reads that
// directive out of a COMMENT, so merely writing it — even inside a sentence explaining that the
// file does not use it — switches the environment on and makes the control below fail. Observed
// here, first run.

import { describe, it, expect } from 'vitest';
import { isAgentFile, basenameOf, AGENT_FILE_NAMES } from './agentFile';
import { EXACT_RAW_HOSTS, PATH_SCOPED_RAW_HOSTS } from '../detect/isRenderableContext';

/** The frozen set, written out LITERALLY rather than read from the module — a test that iterates
 *  the set it is checking would pass for any set, including an empty or a grown one. */
const FROZEN_SET = ['CLAUDE.md', 'AGENTS.md', 'spec.md', 'plan.md', 'tasks.md'];

describe('agentFile — the frozen name set (D-2)', () => {
  it('recognizes EVERY name in the set, spelled exactly', () => {
    for (const name of FROZEN_SET) {
      expect(isAgentFile(name), `${name} must be recognized`).toBe(true);
    }
  });

  it('the set is EXACTLY those five — no silent growth, and `.cursorrules` is not in it (§9-3)', () => {
    // `.cursorrules` is UNREACHABLE behind MARKDOWN_EXTENSIONS, not merely un-badged, so a name
    // for it here would be dead code that reads like a shipped capability. This clause is what
    // keeps a future session from "just adding" it — or anything else — without a spec decision.
    expect([...AGENT_FILE_NAMES].sort()).toEqual([...FROZEN_SET].sort());
    expect(AGENT_FILE_NAMES.has('.cursorrules')).toBe(false);
  });
});

describe('agentFile — CASE-SENSITIVITY: the variants that must NOT match (D-2)', () => {
  // ★ THE RED-FIRST CLAUSE. Ablation: lowercase both sides of the comparison
  // (`AGENT_FILE_NAMES.has(name.toLowerCase())` over a lowercased set) — all three below flip to
  // `true` and fail with the wrong-file signature `expected true to be false`.
  it.each(['claude.md', 'Agents.MD', 'SPEC.MD', 'agents.md', 'Claude.md', 'TASKS.MD'])(
    'does NOT recognize %s — a differently-cased spelling is not the file the convention names',
    (variant) => {
      expect(isAgentFile(variant)).toBe(false);
    },
  );

  it('the case variants are genuinely NEAR misses — each differs from a set member only in case', () => {
    // Non-vacuity: proves the variants above are testing case and not, say, a typo. If a variant
    // stopped corresponding to a real set member, the clause above would be checking nothing.
    const lowerSet = FROZEN_SET.map((n) => n.toLowerCase());
    for (const variant of ['claude.md', 'Agents.MD', 'SPEC.MD']) {
      expect(lowerSet).toContain(variant.toLowerCase());
    }
  });
});

describe('agentFile — what matches NOTHING (D-2)', () => {
  it.each([
    ['an ordinary markdown file', 'readme.md'],
    ['a near neighbour', 'CLAUDE.markdown'],
    ['an extensionless stem', 'CLAUDE'],
    ['a dotfile', '.cursorrules'],
    ['a full path, not a basename', '/home/u/repo/CLAUDE.md'],
    ['a windows path', 'C:\\dev\\peekover\\AGENTS.md'],
    ['a whole URL', 'file:///d:/dev/peekover/AGENTS.md'],
    ['a name with surrounding space', ' CLAUDE.md'],
    ['the empty string', ''],
  ])('does NOT recognize %s (%s)', (_label, name) => {
    expect(isAgentFile(name)).toBe(false);
  });

  it('an ABSENT name — `undefined`, which is exactly what getDocIdentity() returns unregistered', () => {
    // The pairing with D-1: an unnamed document is not an error. The predicate must answer, not
    // throw, so that 1.3's `buildAgentBadge` has a single `[]` path for absent AND unrecognized.
    expect(isAgentFile(undefined)).toBe(false);
    expect(() => isAgentFile(undefined)).not.toThrow();
  });
});

describe('agentFile — recognition reads the FILENAME ONLY, never content (§3.4, §4)', () => {
  it('answers with NO document in scope at all — and the absence is asserted, not assumed', () => {
    // THE CONTROL for this clause: if a jsdom pragma were ever added to this file, this line fails
    // and says so, rather than letting the claim below quietly become untestable.
    expect(typeof document, 'this suite must run with NO DOM for the clause to mean anything').toBe(
      'undefined',
    );
    expect(isAgentFile('CLAUDE.md')).toBe(true);
    expect(isAgentFile('readme.md')).toBe(false);
  });

  it('the same name answers the same way regardless of any content that might exist', () => {
    // There is no source parameter to pass — that IS the property. The predicate is total over its
    // one string argument, so recognition cannot vary with what the file contains.
    expect(isAgentFile.length).toBe(1);
    expect(isAgentFile('AGENTS.md')).toBe(isAgentFile('AGENTS.md'));
  });
});

describe('agentFile — basenameOf: the content script s only way to produce a name (plan §1.1)', () => {
  it('resolves a file:// path to its last segment', () => {
    expect(basenameOf('file:///d:/dev/peekover/AGENTS.md')).toBe('AGENTS.md');
    expect(basenameOf('file:///home/u/repo/specs/008/tasks.md')).toBe('tasks.md');
  });

  it.each([...EXACT_RAW_HOSTS])('resolves an exact raw host (%s) to the right basename', (host) => {
    // Driven from the gate's OWN allowlist (`isRenderableContext.ts:37-40`), so a raw host added
    // later cannot silently escape this clause.
    expect(basenameOf(`https://${host}/owner/repo/main/CLAUDE.md`)).toBe('CLAUDE.md');
  });

  it.each([...PATH_SCOPED_RAW_HOSTS])(
    'resolves a path-scoped raw host (%s) to the right basename',
    (host) => {
      expect(basenameOf(`https://${host.hostname}/g/p${host.pathSegment}main/spec.md`)).toBe(
        'spec.md',
      );
    },
  );

  it('discards PARENT segments — the basename is the LAST one, not the first and not the path', () => {
    // ★ RED-FIRST. Ablation: `pathname.split('/')[0]` (or a `pathname.includes(name)` match at the
    // predicate) — this fails with `expected '' to be 'plan.md'` / a full path, the signature of
    // matching on the wrong segment.
    expect(basenameOf('file:///CLAUDE.md/nested/plan.md')).toBe('plan.md');
    expect(basenameOf('file:///a/b/c/tasks.md')).toBe('tasks.md');
  });

  it('strips the query and the fragment — they are not part of the name', () => {
    expect(basenameOf('https://raw.githubusercontent.com/o/r/m/CLAUDE.md?raw=1#L4')).toBe(
      'CLAUDE.md',
    );
  });

  it('returns the empty string for a path with no final segment, and for a non-URL', () => {
    expect(basenameOf('file:///d:/dev/peekover/')).toBe('');
    expect(basenameOf('not a url at all')).toBe('');
    expect(basenameOf('')).toBe('');
    // …and the empty string is a name the predicate declines, so no caller has to branch.
    expect(isAgentFile(basenameOf('not a url at all'))).toBe(false);
  });
});

describe('agentFile — the decodeURIComponent step, asserted DIRECTLY (D-2)', () => {
  it('decodes an encoded character in the BASENAME ITSELF — the only place it can matter', () => {
    // ★ THE DECODE ASSERTION. Ablation: drop the `decodeURIComponent` call and return the raw
    // segment — this fails with `expected 'My%20Notes.md' to be 'My Notes.md'`, the decode s own
    // signature. Note the fixture is a NON-agent name, and that is the finding below.
    expect(basenameOf('file:///d:/dev/My%20Notes.md')).toBe('My Notes.md');
    expect(basenameOf('file:///d:/dev/caf%C3%A9.md')).toBe('café.md');
  });

  it('★ FINDING — no frozen-set name is reachable ONLY through the decode, and D-2 s worked example does not need it', () => {
    // D-2 justifies the decode with "a raw split('/').pop() comparison would miss any path
    // containing an encoded character", worked on this very URL. It would not: the encoded
    // character is in a PARENT segment, which `.pop()` discards. Asserted here so the record is
    // executable rather than a claim in a comment.
    const d2Example = 'file:///c:/dev/My%20Docs/AGENTS.md';
    expect(new URL(d2Example).pathname.split('/').pop()).toBe('AGENTS.md'); // undecoded ALREADY matches
    expect(basenameOf(d2Example)).toBe('AGENTS.md'); // decoded matches too — same answer

    // And no set member can carry a percent-encodable character: all five are ASCII letters + dot.
    for (const name of FROZEN_SET) {
      expect(encodeURIComponent(name), `${name} would be altered by encoding`).toBe(name);
    }
    // So the decode is kept as DECIDED (D-2 is sealed) and is insurance for a future set member
    // with a space or a non-ASCII character — not a live false negative it fixes today.
  });

  it('SPLITS BEFORE IT DECODES — an encoded slash must not manufacture a false positive', () => {
    // ★ RED-FIRST. Ablation: decode the whole pathname and then split
    // (`decodeURIComponent(pathname).split('/').pop()`) — `%2F` becomes a separator and this fails
    // with `expected 'CLAUDE.md' to be 'weird/CLAUDE.md'`, i.e. a file NOT named CLAUDE.md being
    // badged. That is the false-positive direction the case-sensitivity argument rejects.
    expect(basenameOf('file:///d:/dev/weird%2FCLAUDE.md')).toBe('weird/CLAUDE.md');
    expect(isAgentFile(basenameOf('file:///d:/dev/weird%2FCLAUDE.md'))).toBe(false);
  });

  it('NEVER THROWS on a malformed percent sequence — an uncaught URIError here is a BLANK PAGE', () => {
    // ★ RED-FIRST. Ablation: remove the try/catch around the decode — these throw `URIError:
    // URI malformed`. `basenameOf` runs at runReader.ts:118 BEFORE mountReader(), so the throw is
    // not a missing badge, it is no render at all (AGENTS.md #5). `new URL()` does not normalize a
    // lone `%` away, so the malformed input reaches the decode verbatim — asserted first, so the
    // clause cannot go vacuous if URL parsing ever starts escaping it.
    expect(new URL('file:///d:/50%.md').pathname).toContain('50%.md');
    expect(() => basenameOf('file:///d:/50%.md')).not.toThrow();
    expect(basenameOf('file:///d:/50%.md')).toBe('50%.md'); // degrades to the UNDECODED segment
    expect(() => basenameOf('file:///d:/a%zz.md')).not.toThrow();
    expect(basenameOf('file:///d:/a%zz.md')).toBe('a%zz.md');
  });

  it('the decode still lands a REAL recognition when the encoding is a set member s own spelling', () => {
    // The one path by which a set member IS reachable only through the decode — a non-canonical
    // hand-encoding of an already-safe character. No user agent emits this; it is here to pin the
    // decode s behaviour, not to claim the case occurs.
    expect(basenameOf('file:///d:/dev/%43LAUDE.md')).toBe('CLAUDE.md');
    expect(isAgentFile(basenameOf('file:///d:/dev/%43LAUDE.md'))).toBe(true);
  });
});

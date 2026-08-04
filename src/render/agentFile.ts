// agentFile — recognition, and nothing else: is THIS document one of the agent files the badge
// exists to mark? A frozen name set, an exact case-sensitive lookup, and the basename extraction
// the content script needs to produce a name at all (008 plan §1.1, D-2).
//
// Imported by nothing yet. `buildAgentBadge` (task 1.3) is the one consumer, and it pairs this
// predicate with `docIdentity.getDocIdentity()` — which is why `isAgentFile` takes
// `string | undefined` and why this module does NOT import that one: the registry holds the name,
// this module judges it, and they meet at 1.3.
//
// ── RECOGNITION IS FROM THE FILENAME ONLY — NEVER FROM CONTENT (§3.4, §4) ─────────────────────
//
// The predicate takes a string and reads nothing else. No source text, no DOM, no document is in
// scope here — not as a convenience it declines to use, but as an absence: this module imports
// nothing, so there is nothing to sniff with. That is the spec's own framing (§3.4: the renderer
// never learns the filename; §4: recognition is determined from the filename), and it is what keeps
// the badge's cost at D-2's stated price — "one Set lookup".
//
// ── CASE-SENSITIVE, AND THE ASYMMETRY IS THE WHOLE ARGUMENT ──────────────────────────────────
//
// `claude.md` is not the file the convention names. A case-INSENSITIVE match would badge it
// WRONGLY — asserting a convention the document does not follow — where a case-SENSITIVE one
// merely declines to badge a file that does follow it under an unusual spelling. Those two errors
// are not equal: the first is a false claim on screen, the second is the resting state (`[]`), and
// the resting state is what this feature is designed to fall back to (D-2). So the match is exact.
//
// ── `.cursorrules` IS NOT HERE, AND THAT IS A GATE-1 DISPOSITION, NOT AN OVERSIGHT ────────────
//
// The product spec's feature line names it, and gate-1 §9-3 ruled it OUT: it is UNREACHABLE, not
// un-badged. `MARKDOWN_EXTENSIONS` (`isRenderableContext.ts:20-30`) carries nine extensions, no
// dotfile and no extensionless entry, and `walkPolicy.isMarkdownFile` mirrors it — so a
// `.cursorrules` never reaches the reader on either surface. Recognizing a name that can never
// arrive is dead code that reads like a shipped capability. Adding it here would be a scope
// re-open (tasks.md's §6 IS-NOT fence names it in terms).
//
// ── THE `decodeURIComponent` STEP, ITS ORDER, AND WHAT IT ACTUALLY BUYS ───────────────────────
//
// D-2 decides the decode as a named one-line detail, and it is implemented here as decided. Two
// implementation properties are NOT free choices, though, and both are load-bearing:
//
//   1. SPLIT FIRST, THEN DECODE — never decode the whole pathname and then split. `%2F` decodes to
//      `/`, so decoding first turns ONE filename that happens to contain an encoded slash into TWO
//      path segments, and `.../weird%2FCLAUDE.md` — a single file NOT named `CLAUDE.md` — would be
//      badged. That is a false positive, the exact error direction the case-sensitivity argument
//      above rejects. Splitting first cannot produce it.
//   2. THE DECODE CANNOT BE ALLOWED TO THROW. `decodeURIComponent` throws `URIError` on a malformed
//      sequence (`50%.md`, `a%zz.md`), and `new URL()` does NOT normalize a lone `%` away — a bare
//      `%` survives into `pathname` verbatim. This function runs at `runReader.ts:118`, BEFORE
//      `mountReader()`, so an uncaught throw there is not a missing badge: it is no render at all,
//      i.e. the blank page AGENTS.md #5 forbids. The catch degrades to the UNDECODED segment — the
//      name is still a name, and the pre-decode behaviour is exactly the fallback we want.
//
// ★ WHAT THE DECODE BUYS FOR *THIS* FROZEN SET — recorded as a finding about D-2's stated reason,
// not as a change to it (task 1.2's Verify asks for exactly this record). D-2 justifies the decode
// with "a raw `split('/').pop()` comparison would miss any path containing an encoded character",
// worked on `file:///c:/dev/My%20Docs/AGENTS.md`. That example does not demonstrate the failure:
// the encoded character is in a PARENT segment, and `.pop()` discards parent segments, so the raw
// comparison already yields `AGENTS.md`. An encoded character only reaches the comparison when it
// is in the BASENAME — and no name in this frozen set contains any character that percent-encodes:
// all five are ASCII letters and a dot. So no set member is reachable ONLY through the decode by
// any path a browser can produce; the sole reachable-only-via-decode spelling is a non-canonical
// hand-encoding of an already-safe character (`%43LAUDE.md`), which no user agent emits. The decode
// is therefore CORRECT and HARMLESS here, and it is kept as decided — but for this set it is
// insurance against a future set member with a space or a non-ASCII character, not a live false
// negative it fixes today. Recorded, not removed.

/**
 * The frozen set of agent-file basenames, matched EXACTLY and case-sensitively.
 *
 * `CLAUDE.md` / `AGENTS.md` are the cross-tool agent conventions; `spec.md` / `plan.md` /
 * `tasks.md` are this repository's own spec/plan/tasks convention (D-2 names all five). The set is
 * closed: growing it is a spec decision, not an implementation one.
 *
 * `/*#__PURE__*\/` so the initializer is droppable when nothing imports it — a bare `new Set(...)`
 * at module scope is retained by the bundler on the assumption it may have side effects, which
 * would put the set's bytes on a graph that never asks the question.
 */
export const AGENT_FILE_NAMES: ReadonlySet<string> = /*#__PURE__*/ new Set([
  'CLAUDE.md',
  'AGENTS.md',
  'spec.md',
  'plan.md',
  'tasks.md',
]);

/**
 * Is `name` one of the recognized agent files?
 *
 * @param name A BASENAME — `MarkdownFile.name` on the app page, `basenameOf(location.href)` on the
 *   content script. Takes `string | undefined` because that is exactly what `getDocIdentity()`
 *   returns (D-1): an unnamed document is not an error, it simply grows no badge, and an
 *   unrecognized name and an absent one produce the same `[]` at 1.3.
 * @returns `true` only on an exact, case-sensitive membership hit. A path, an empty string, an
 *   extensionless stem and a differently-cased spelling all return `false`.
 */
export function isAgentFile(name: string | undefined): boolean {
  return name !== undefined && AGENT_FILE_NAMES.has(name);
}

/**
 * The basename of a document URL — the content script's only way to produce a name, since it holds
 * a `location.href` and never a `MarkdownFile` (plan §1.1).
 *
 * @param href An absolute URL string (`file://` or an allowlisted raw host).
 * @returns The last path segment, percent-DECODED. `''` when `href` does not parse as a URL or the
 *   path ends in a separator — both of which `isAgentFile` then declines, so a caller never has to
 *   branch. NEVER throws: see the header on `URIError`, and on why splitting precedes decoding.
 */
export function basenameOf(href: string): string {
  let pathname: string;
  try {
    pathname = new URL(href).pathname;
  } catch {
    return '';
  }

  const segment = pathname.split('/').pop() ?? '';

  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

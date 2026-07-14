// isRenderableContext — the single, authoritative gate that decides whether a
// given URL is a context Peekover should render markdown in.
//
// LOCKED detection model (see specs/001-core-rendering + AGENTS.md #6):
//   (a) file:// URLs whose path ends in a known markdown extension, OR
//   (b) a NAMED raw-host allowlist (exact hostname) serving a markdown file.
// There is NO content-type / header sniffing and NO broad host access; the
// content script's manifest `matches` grant host access only for the hosts
// below, and this function is the in-script narrowing gate.
//
// Pure, synchronous, dependency-free. Parses with the URL API and matches the
// hostname by EXACT equality (never substring / endsWith) to defeat lookalikes
// such as `raw.githubusercontent.com.evil.com`.

/**
 * Markdown filename extensions we treat as renderable. Matched case-insensitively
 * against the URL pathname only. `.txt` is intentionally excluded (deferred /
 * opt-in). Order does not matter.
 */
export const MARKDOWN_EXTENSIONS = [
  '.md',
  '.mkd',
  '.mdx',
  '.markdown',
  '.mdown',
  '.mkdn',
  '.mdwn',
  '.mdtxt',
  '.mdtext',
] as const;

/**
 * Raw-content hosts matched by EXACT hostname equality. These hosts serve only
 * raw file bytes, so a markdown extension on the path is enough to be confident
 * the resource is markdown.
 */
export const EXACT_RAW_HOSTS = [
  'raw.githubusercontent.com',
  'gist.githubusercontent.com',
] as const;

/**
 * Hosts where raw files live under a specific path prefix. We scope to that
 * prefix so Peekover does not inject across the whole site — only the raw view.
 * Verified 2026-07-14 against current GitLab / Bitbucket raw URL shapes:
 *   GitLab:    https://gitlab.com/<group>/<project>/-/raw/<ref>/<path>
 *   Bitbucket: https://bitbucket.org/<workspace>/<repo>/raw/<ref>/<path>
 */
export const PATH_SCOPED_RAW_HOSTS = [
  { hostname: 'gitlab.com', pathSegment: '/-/raw/' },
  { hostname: 'bitbucket.org', pathSegment: '/raw/' },
] as const;

/** True if `pathname` ends with one of the markdown extensions (case-insensitive). */
function hasMarkdownExtension(pathname: string): boolean {
  const lower = pathname.toLowerCase();
  return MARKDOWN_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

/**
 * Decide whether Peekover should render the markdown at `url`.
 *
 * @param url An absolute URL string (e.g. `location.href`).
 * @returns `true` only for a `file://` markdown path or an allowlisted raw
 *   host serving a markdown file over https. Any parse failure returns `false`.
 */
export function isRenderableContext(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }

  // (a) Local files opened via file:// — no host, just the markdown extension.
  if (parsed.protocol === 'file:') {
    return hasMarkdownExtension(parsed.pathname);
  }

  // (b) Named raw hosts — https only, exact hostname, markdown path.
  if (parsed.protocol !== 'https:') {
    return false;
  }

  if ((EXACT_RAW_HOSTS as readonly string[]).includes(parsed.hostname)) {
    return hasMarkdownExtension(parsed.pathname);
  }

  for (const host of PATH_SCOPED_RAW_HOSTS) {
    if (
      parsed.hostname === host.hostname &&
      parsed.pathname.includes(host.pathSegment)
    ) {
      return hasMarkdownExtension(parsed.pathname);
    }
  }

  return false;
}

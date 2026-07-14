import { describe, it, expect } from 'vitest';
import { MARKDOWN_EXTENSIONS, isRenderableContext } from './isRenderableContext';

describe('isRenderableContext', () => {
  describe('positives — file://', () => {
    it('renders a plain file:// README.md', () => {
      expect(isRenderableContext('file:///a/b/README.md')).toBe(true);
    });

    it.each(MARKDOWN_EXTENSIONS)(
      'renders every markdown extension: %s',
      (ext) => {
        expect(isRenderableContext(`file:///docs/note${ext}`)).toBe(true);
      },
    );

    it('renders a file:// path with a ?query', () => {
      expect(isRenderableContext('file:///a/b/note.md?v=2')).toBe(true);
    });

    it('renders a file:// path with a #hash', () => {
      expect(isRenderableContext('file:///a/b/note.md#section')).toBe(true);
    });

    it('renders a case-insensitive extension via file:// (README.MD)', () => {
      expect(isRenderableContext('file:///a/b/README.MD')).toBe(true);
    });
  });

  describe('positives — raw hosts', () => {
    it('renders raw.githubusercontent.com markdown', () => {
      expect(
        isRenderableContext(
          'https://raw.githubusercontent.com/owner/repo/main/README.md',
        ),
      ).toBe(true);
    });

    it('renders a gist raw markdown file', () => {
      expect(
        isRenderableContext(
          'https://gist.githubusercontent.com/user/abc123/raw/def456/notes.markdown',
        ),
      ).toBe(true);
    });

    it('renders the GitLab raw shape (/-/raw/)', () => {
      expect(
        isRenderableContext(
          'https://gitlab.com/group/project/-/raw/main/README.md',
        ),
      ).toBe(true);
    });

    it('renders the Bitbucket raw shape (/raw/)', () => {
      expect(
        isRenderableContext(
          'https://bitbucket.org/workspace/repo/raw/main/README.md',
        ),
      ).toBe(true);
    });

    it('renders a raw markdown URL carrying a ?query and #hash', () => {
      expect(
        isRenderableContext(
          'https://raw.githubusercontent.com/o/r/main/doc.md?token=x#top',
        ),
      ).toBe(true);
    });
  });

  describe('near-misses — must be FALSE', () => {
    it('rejects a doubled extension foo.md.txt', () => {
      expect(isRenderableContext('file:///a/foo.md.txt')).toBe(false);
    });

    it('rejects foo.mdx.json', () => {
      expect(isRenderableContext('file:///a/foo.mdx.json')).toBe(false);
    });

    it('rejects .md appearing only in the querystring', () => {
      expect(
        isRenderableContext(
          'https://raw.githubusercontent.com/o/r/main/page.html?doc=foo.md',
        ),
      ).toBe(false);
    });

    it('rejects trailing junk after the extension (foo.mdextra)', () => {
      expect(isRenderableContext('file:///a/foo.mdextra')).toBe(false);
    });
  });

  describe('lookalike hosts — must be FALSE', () => {
    it('rejects a suffixed lookalike host (raw.githubusercontent.com.evil.com)', () => {
      expect(
        isRenderableContext(
          'https://raw.githubusercontent.com.evil.com/o/r/main/x.md',
        ),
      ).toBe(false);
    });

    it('rejects the allowlisted host appearing only in the path', () => {
      expect(
        isRenderableContext(
          'https://evil.com/raw.githubusercontent.com/x.md',
        ),
      ).toBe(false);
    });

    it('rejects a raw host served over http (not https)', () => {
      expect(
        isRenderableContext(
          'http://raw.githubusercontent.com/o/r/main/x.md',
        ),
      ).toBe(false);
    });

    it('rejects a GitLab markdown URL outside the /-/raw/ path scope', () => {
      expect(
        isRenderableContext(
          'https://gitlab.com/group/project/-/blob/main/README.md',
        ),
      ).toBe(false);
    });
  });

  describe('non-matches — must be FALSE', () => {
    it('rejects the GitHub HTML blob view (not raw)', () => {
      expect(
        isRenderableContext(
          'https://github.com/user/repo/blob/main/README.md',
        ),
      ).toBe(false);
    });

    it('rejects a .json URL on an allowlisted raw host', () => {
      expect(
        isRenderableContext(
          'https://raw.githubusercontent.com/o/r/main/package.json',
        ),
      ).toBe(false);
    });

    it('rejects a .yaml URL', () => {
      expect(
        isRenderableContext('https://raw.githubusercontent.com/o/r/main/ci.yaml'),
      ).toBe(false);
    });

    it('rejects a plain https page with no markdown extension', () => {
      expect(isRenderableContext('https://example.com/')).toBe(false);
    });

    it('rejects an unparseable URL', () => {
      expect(isRenderableContext('not a url')).toBe(false);
    });
  });
});

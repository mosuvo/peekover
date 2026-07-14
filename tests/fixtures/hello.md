# Hello, Peekover

This is a **manual verification fixture**. Open it via `file://` with the dev
build loaded and the markdown below should now appear **rendered** — headings,
bold, a list, and a table as formatted HTML, _not_ raw text.

It will be **unstyled** (design tokens land at task 4.1) — that is expected. This
step verifies that structure renders and that the fallback path holds, not looks.

## What Peekover is

- Zero network by default
- Reader first
- On-device AI third

## A small table

| Stage    | Job                        |
|----------|----------------------------|
| parse    | markdown → HTML            |
| sanitize | strip everything unsafe    |
| mount    | into an open shadow root   |

> If you can read this as a blockquote, the reader mounted correctly.

<!-- Covers: GFM pipe tables incl. alignment-colon syntax (M1 STRIPS alignment —
     markdown-it emits it as inline style which sanitize removes; M2 restores it via
     a class), strikethrough, autolinks (linkify + angle), mixed/nested task lists. -->

# GFM torture

| Left | Center | Right |
|:-----|:------:|------:|
| a | bbb | 1 |
| longer left cell | c | 22 |

Inline: ~~struck~~, **bold**, *italic*, and `code` together.

Bare autolink https://example.com/gfm and angle <https://example.com/angle>.

- [x] a completed task
- [ ] a pending task
- a regular bullet
  - [ ] a nested pending task
  - [x] a nested done task

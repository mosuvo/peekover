<!-- Covers: http/https/mailto links, relative + absolute-path links, reference-style
     links (incl. a titled one), an angle autolink, and two dangerous-scheme links
     (javascript:, data:). Defense-in-depth note: markdown-it's own validateLink
     REFUSES to build an <a> for javascript:/data: URLs, so they stay as inert TEXT in
     the snapshot (never reaching sanitize as an href). Were one to slip through the
     parser, sanitize's URL policy would strip the href — see MALICIOUS_CASES / the
     malicious.md fixture, which feed such an <a href> straight in. -->

An [http link](http://example.com) and an [https link](https://example.com).

Email: [mail me](mailto:hi@example.com).

Paths: [relative](./sibling.md) and [absolute path](/docs/page.md).

Reference: [first ref][r1] and [second ref][r2].

Angle autolink: <https://example.com/angle>.

Stripped: [javascript link](javascript:alert(1)) and [data link](data:text/html,payloadmarker).

[r1]: https://example.com/one
[r2]: https://example.com/two "a titled reference"

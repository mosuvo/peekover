<!-- Covers malformed / degenerate markdown that must render SOMETHING without the
     pipeline throwing: a malformed table, dangling/mismatched emphasis, broken
     reference links, mixed non-ASCII + HTML entities, and (LAST, so it doesn't
     swallow the rest) an unclosed code fence that runs to end-of-file. -->

# Broken input

| broken | table header
|---|
| only one delimiter column

Dangling **emphasis and *mismatched _markers left open.

Bad references: [missing target][nope] and [empty target][].

Unicode + entities: café — naïve &amp; &lt;tag&gt; &copy; &#8734; ∞ 🚀

```js
const neverClosed = true;
// this fence is intentionally never closed and runs to end-of-file

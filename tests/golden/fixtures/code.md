<!-- Covers: fenced block WITH language (-> class="language-*"), fenced block WITHOUT
     language, an indented (4-space) code block, and inline code containing HTML-ish
     text (a <script> written inside code must survive ESCAPED as text, never as a
     live element). No syntax highlighting in M1 (Shiki is a later milestone). -->

# Code

```js
const answer = 42;
function render(md) { return sanitize(parse(md)); }
```

```
plain fence with no language info string
second line of the plain fence
```

    indented code block line one
    indented code block line two

Inline `<script>alert(1)</script>` must stay escaped as text.

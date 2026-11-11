# Tables, footnotes and deep lists

Test cases suggested on X. Expected results follow GitHub Flavored Markdown (GFM).

## 1. Pipes in tables

Footnote defined above where it's used:

[^early]: This footnote is defined before its reference.

| Case | Cell | Note |
| --- | --- | --- |
| Unescaped pipe in code | `a|b` | GFM splits here: extra cell |
| Escaped pipe in code | `a\|b` | Shows as `a|b` in one cell |
| Escaped pipe in text | left \| right | One cell, literal pipe |
| Footnote in a cell | see this[^early] | Superscript link |
| Bold and pipe | **x \| y** | Bold, literal pipe |
| Empty cell | | Third cell still here |

A second reference to the same footnote[^early], and a normal one[^late].

## 2. Fenced code inside a table cell

GFM table cells hold inline content only. A fence line ends the table.

| Language | Example |
| --- | --- |
| JS | ```const x = 1;``` |
| Shell | `echo "a | b"` |
```js
// This fence starts right after a table row.
const afterTable = true;
```
| Back | to a table? |
| --- | --- |
| yes | a new table starts here |

Cell with a line break via HTML:

| Line | Break |
| --- | --- |
| one<br>two | `<br>` may be removed by the sanitizer |

## 3. A 5-level list mixing ordered and unordered

1. Level 1, ordered
   - Level 2, unordered
     1. Level 3, ordered
        - Level 4, unordered
          > A quote wrapping level 5:
          >
          > 1. Level 5 inside the quote
          > 2. Second item
          >
          > ```python
          > print("level 5")
          > ```
        - Back to level 4
     2. Level 3 continues as "2."
   - Level 2 again
10. Level 1 jumps to 10 (wider marker, so the indent math changes)
    - Level 2 under "10." needs 4 spaces
      1. Level 3 under that
         - Level 4
           - Level 5

> 1. A list inside a quote
>    - nested
>      > a quote inside that
>      > - and a list inside that

## 4. Late footnote definition

Text at the end.

[^late]: This footnote is defined after its reference, at the bottom.

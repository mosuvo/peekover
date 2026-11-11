# Weird nesting test

The combo from the bug report, then variations around it.

## 1. The exact combo

- A list item with a quote inside:

  > Quoted text before the code.
  >
  > ```js
  > const nested = "code in a quote in a list";
  > console.log(nested);
  > ```
  >
  > Quoted text after the code.

| Column A | Column B |
| --- | --- |
| table right | after the list |

#

Text right after the empty heading.

## 2. Same, but the table is inside the list item

1. First item

   > ```python
   > def inside():
   >     return "quote > list"
   > ```

   | Inside | The item |
   | --- | --- |
   | still | in the list |

2. Second item, to prove the list continues

## 3. Empty and odd headings

#

##

###   

# #

## ##

#hashtag-not-a-heading

\# escaped, not a heading

## Duplicate

## Duplicate

## 4. Lazy continuation and tight spacing

- item
  > quote line one
lazy line that continues the quote
  > ```
  > fence with no language
  > ```
- next item
| not | a table |
| --- | --- |
| because | no blank line? |

## 5. Deep nesting

- level 1
  - level 2
    > quote at level 2
    > - list inside quote
    >   > quote inside that list
    >   > ```sh
    >   > echo "four levels deep"
    >   > ```

## 6. Unclosed fence inside a quote in a list

- item
  > ```
  > this fence never closes inside the quote

Back at top level. Is this paragraph still code?

| After | Unclosed |
| --- | --- |
| does the | table survive? |

#

<!-- Covers the sanitize contract on inline HTML carried through markdown:
     - allow-listed inline tags SURVIVE (<sup>, <sub>, <del>);
     - disallowed tags are DROPPED but their text content survives (KEEP_CONTENT);
     - disallowed attributes (style, id, align, data-*) are STRIPPED from allowed tags. -->

# Inline HTML

Allowed inline tags survive: H<sub>2</sub>O, e<sup>iπ</sup>, and <del>removed</del>.

Disallowed tag dropped, text kept: a <marquee>scrolling banner</marquee> and a <font color="red">red word</font> stay as text.

Disallowed attributes stripped: <strong style="color:red" id="x" align="center" data-track="y">strong text</strong> keeps only the tag.

# site/fonts — provenance

The website's own fonts (M13 task 9.1). The site is not part of the extension package; these files are served with the
site so that it loads nothing from another origin (Google Fonts served it before). Every file is under the SIL Open
Font License, Version 1.1; each family's licence text sits beside its fonts (`<family>.txt`, the same text as the
extension's `public/licenses/`). `tests/fontLicences.test.ts` fails if a font here has no family, licence text or row
below, or if a site page loads a font from anywhere else.

## Files

| File | Bytes | SHA-256 | Family, axes kept | Source file (google/fonts) |
| --- | ---: | --- | --- | --- |
| `bricolage-grotesque-var.woff2` | 96,184 | `33292e6ae7ce4a8310b346c35bbb5f63cde525ab262decd6b8241951438397a4` | Bricolage Grotesque — `opsz` 12–96, `wght` 400–800; `wdth` pinned 100 | `ofl/bricolagegrotesque/BricolageGrotesque[opsz,wdth,wght].ttf` (408,496 B, `413e7357…`) |
| `literata-var.woff2` | 139,804 | `05505bfe8ee3eb0d6f5a6575fde3a6c728c6ab973fef016e2838ce909648a9c0` | Literata — `opsz` 7–72, `wght` 400–600 | `ofl/literata/Literata[opsz,wght].ttf` (955,132 B, `b41138c9…`) |
| `literata-italic-var.woff2` | 87,924 | `fcb081dc1931e7ba58d9d148820781fc0e93c8327fc8899c575406dfbbb19ce5` | Literata italic — `opsz` 7–72; `wght` pinned 400 | `ofl/literata/Literata-Italic[opsz,wght].ttf` (902,728 B, `d483dfae…`) |
| `sometype-mono-var.woff2` | 19,860 | `9244447b0dbdfa8a9243e0521896dfef1d413e600cf831f55dc8f547f44f2356` | Sometype Mono — `wght` 400–600 | `ofl/sometypemono/SometypeMono[wght].ttf` (64,308 B, `4095fd32…`) |

**Source** — `google/fonts` at commit `6c1dbe27dcf7d817d4b62cec033ba77fa8e2a5ec` (the commit task 2.3 used;
`https://raw.githubusercontent.com/google/fonts/<commit>/ofl/<family>/<file>`), downloaded 2026-11-07. Bricolage and
Sometype match 2.3's recorded SHA-256 (`assets/fonts/README.md`). All three families are `license: "OFL"` in their
`METADATA.pb` at that commit; the licence texts here equal that commit's `ofl/<family>/OFL.txt`.

**Why these axes** — they are the axes the old Google Fonts link asked for
(`Literata:ital,opsz,wght@0,7..72,400;0,7..72,600;1,7..72,400`, `Bricolage Grotesque:opsz,wght@12..96,400..800`,
`Sometype Mono:wght@400;500;600`), so the site looks as it did. Bricolage is variable by the human's ruling after task
2.5 (the site draws it up to 180 px at weight 800); the app's static `opsz` 12 files are not reused here.

**Unicode ranges** — those of `assets/fonts/README.md` (U+0000–024F, U+2000–206F, € ™ −, the chrome's glyph list),
plus the site's own glyphs outside them, enumerated from the rendered page in both themes: U+2193 ↓, U+25C9 ◉,
U+2600 ☀, U+263E ☾, U+26A1 ⚡, U+270E ✎, U+2712 ✒; Sometype Mono also keeps U+2500–257F. A subset keeps only what its
source draws: each file's `cmap` equals (source `cmap` ∩ the ranges), checked with fontTools (Bricolage 344, Literata
436 each, Sometype 356 codepoints). Glyphs no face draws (the emoji) fall back to the system, as before.

**Tools** — Python 3.13, fontTools 4.68.0 and brotli 1.2.1 in a throwaway virtual environment (as 2.3). For each file:
`instancer.instantiateVariableFont` with the axes above (`updateFontNames=False`), saved and reloaded, then
`subset.Subsetter` with `layout_features=['*']`, all name IDs, `notdef_outline`, no hinting, `desubroutinize`, WOFF2.

# assets/fonts — provenance

Every font file here is under the SIL Open Font License, Version 1.1. The copyright lines are in
[`OFL.txt`](OFL.txt); each family's full licence text ships in the extension package from
[`public/licenses/`](../../public/licenses/), and the root [`NOTICE`](../../NOTICE) credits each
family. `tests/fontLicences.test.ts` fails if a font file here has no family, licence file or NOTICE
entry.

## Files

| File | Bytes | SHA-256 | Family / weight | Source |
| --- | ---: | --- | --- | --- |
| `literata-latin-400-normal.woff2` | 20,420 | `a60c193b55766b68b922e2327e15c2d8c145532f283a27c3411b9c47a8583d18` | Literata 400 | @fontsource/literata 5.3.0 |
| `literata-latin-700-normal.woff2` | 22,004 | `1f2985e0fc368aac76f95b847cd05ef6ec4bac2733a648098c62edf990756cf5` | Literata 700 | @fontsource/literata 5.3.0 |
| `literata-latin-400-italic.woff2` | 21,148 | `1e98bfbbb4eb8177b9c21b3fd526e1118c4835d21ff870c0d1c25b1ef4409fba` | Literata 400 italic | @fontsource/literata 5.3.0 |
| `literata-latin-700-italic.woff2` | 22,900 | `8a42dbed45f1855e2dcad9709173019013991c32aa71356e80a1e0ee9bb76763` | Literata 700 italic | @fontsource/literata 5.3.0 |
| `stix-two-math-subset.woff2` | 86,608 | `ef45f115cb03538962ac3e291935622aadae17c4febc87171399600fc1f6a664` | STIX Two Math 400 | google/fonts (M11) |
| `bricolage-latin-400-normal.woff2` | 24,240 | `1beb0fa5c49c0d1cb57708df0af9b4b5677d25b8239e7e4114975d8a5b85795d` | Bricolage Grotesque 400 | google/fonts `6c1dbe2` |
| `bricolage-latin-600-normal.woff2` | 24,368 | `06cae0d85306dd8245711fdb020f2c46136ec7d0a4d1c8db3d928a7683f132e8` | Bricolage Grotesque 600 | google/fonts `6c1dbe2` |
| `bricolage-latin-700-normal.woff2` | 24,208 | `c7da92ae7a5065f24cd282691668d632a26a40485ba4b805dc9236c0132c3a67` | Bricolage Grotesque 700 | google/fonts `6c1dbe2` |
| `sometype-mono-latin-400-normal.woff2` | 10,340 | `8a611f12f53f2ae6eff156b405077ce9c4a3f583e9a05c077e4bdb22cb230c68` | Sometype Mono 400 | google/fonts `6c1dbe2` |
| `sometype-mono-latin-500-normal.woff2` | 10,680 | `c7de5d88742aac0924c3ae1e1a6b379506452daa7b25062128c6fe15f810c1ad` | Sometype Mono 500 | google/fonts `6c1dbe2` |

## Literata

Byte-identical to `files/literata-latin-{400,700}-{normal,italic}.woff2` in the npm package
`@fontsource/literata@5.3.0` (tarball `https://registry.npmjs.org/@fontsource/literata/-/literata-5.3.0.tgz`,
integrity `sha512-9JGMT5+YfBK49thoMq9ASaMRJErHT4V4QuMhAEwKHRLreOsIMP2xP6ZRLhPJ0e6YlET+kjWTJuN7LAxt9/gWGQ==`),
which Fontsource builds from `google/fonts` `ofl/literata`. Checked by SHA-256 on 2026-11-02; the files
themselves date from M1 (decisions.md 2026-07-14) and are not re-subset. Coverage: 230 codepoints, the
Fontsource "latin" range (Basic Latin, Latin-1, a few Latin Extended letters, common punctuation).
Imported inline by `src/theme/fonts.ts`.

## STIX Two Math

`google/fonts` `ofl/stixtwomath/STIXTwoMath-Regular.ttf` (1,517,976 B), subset with `pyftsubset` by its
required glyph set, MATH-table constructions included (M11 tasks 1.1-R and 8.1-R; decisions.md and
`specs/011-math-rendering/tasks.md` hold the commands and the 319-codepoint set). The commit was not
recorded at M11. **Do not re-subset it by scanning text** (AGENTS.md). Imported by `src/theme/mathFont.ts`.

## Bricolage Grotesque and Sometype Mono (M13 task 2.3)

**Sources** — `google/fonts` at commit `6c1dbe27dcf7d817d4b62cec033ba77fa8e2a5ec`, downloaded 2026-11-02:

| Source file | Bytes | SHA-256 |
| --- | ---: | --- |
| `https://raw.githubusercontent.com/google/fonts/6c1dbe27dcf7d817d4b62cec033ba77fa8e2a5ec/ofl/bricolagegrotesque/BricolageGrotesque[opsz,wdth,wght].ttf` | 408,496 | `413e7357809ddd12fd80a96a8a396de0e401638d4acd3cb3e37532f0472ac682` |
| `https://raw.githubusercontent.com/google/fonts/6c1dbe27dcf7d817d4b62cec033ba77fa8e2a5ec/ofl/sometypemono/SometypeMono[wght].ttf` | 64,308 | `4095fd328c988392fb00ab867134e69beff0fc16de66ecdd9e7e232c16f16f25` |

Both families are `license: "OFL"` in their `METADATA.pb` at that commit. The licence texts in
`public/licenses/` are that commit's `ofl/<family>/OFL.txt`, copied unchanged.

**Tools** — Python 3.13, fontTools 4.68.0 and brotli 1.2.1, installed with pip in a throwaway virtual
environment. Build-time only, used once; not a `package.json` dependency.

**Instances** — Bricolage Grotesque: `wdth` 100, `opsz` 12 (the text end of the axis: the chrome's
mockup sizes run 9.5–15 px, median 12.5 px), `wght` 400 / 600 / 700. Sometype Mono: `wght` 400 / 500
(its only axis). Static instances are committed **provisionally**: whether Bricolage ships as these three
files or as one variable file is task 2.5's ruling, by bytes. The variable form, built by the same script
(`wght` 400–700, `wdth` 100, `opsz` 12–96 kept), is 79,464 B against 72,816 B for the three static files.

**Unicode ranges** — both families:

- U+0000–00FF (Basic Latin, Latin-1) and U+0100–024F (Latin Extended-A and -B): plan §9-2(b)'s floor.
- U+2000–206F (General Punctuation: dashes, quotes, ellipsis, bullets, spaces), U+20AC €, U+2122 ™,
  U+2212 −.
- The chrome's own glyphs, enumerated from production string literals in `src/` (the TypeScript scanner,
  comments excluded), CSS `content` escapes (`readerCss.ts`: U+2630 ☰, U+25B8 ▸) and the chrome copy of
  `design/mockup.html` (emoji and variation selectors excluded — no text face carries them):
  U+0394 U+2190 U+2191 U+2192 U+2197 U+21C6 U+21E7 U+21E9 U+2211 U+222B U+2261 U+2315 U+2318 U+2328
  U+2399 U+25A3 U+25A4 U+25A6 U+25B2 U+25B8 U+25BC U+25BE U+25C7 U+25C8 U+25CE U+25CF U+25D0 U+25E7
  U+25EB U+2605 U+2610 U+2630 U+2699 U+2702 U+270F U+2713 U+2715 U+2726 U+27F2 U+27F7 U+29C9 U+2B50
  U+FFFD.

Sometype Mono also keeps U+2500–257F (Box Drawing).

A subset can only keep what its source draws. Each file's `cmap` equals (source `cmap` ∩ the ranges
above), checked with fontTools: nothing outside the ranges, nothing in them dropped.

- Bricolage Grotesque: 343 codepoints. Present beyond Latin: General Punctuation, € ™ − ← ↑ → ∑ ∫.
  The source lacks 224 codepoints of the Latin floor (e.g. U+00AD, U+0108–0109) and the chrome's
  symbols other than those.
- Sometype Mono: 355 codepoints. Present beyond Latin: General Punctuation, € ™ − Δ ← ↑ → ↗ ∑ ∫,
  box drawing. The source lacks 202 codepoints of the Latin floor (e.g. U+00AD, U+0132–0133, most of
  Latin Extended-B).

A missing glyph falls back, per character, to the next face in the CSS stack.

**Layout features** — `pyftsubset`'s default set (which keeps `kern` and `locl`, and Sometype's `calt`)
plus `tnum`, because the chrome sets `font-variant-numeric: tabular-nums`
(`readerCss.ts`, `.peekover-diff-picker__size`). Neither source has `liga`. Hinting is left as the
sources have it (they are unhinted; `gasp` and `prep` are kept).

**Commands** — `BricolageGrotesque[opsz,wdth,wght].ttf` saved as `Bricolage-VF.ttf` and
`SometypeMono[wght].ttf` as `Sometype-VF.ttf`; `unicodes-sans.txt` holds the ranges above, one per line
(`U+0000-00FF`, …), and `unicodes-mono.txt` the same plus `U+2500-257F`. `SOURCE_DATE_EPOCH`
(2026-11-02 UTC) fixes `head.modified`; two runs produced byte-identical files.

```bash
export SOURCE_DATE_EPOCH=1793577600
for w in 400 600 700; do
  fonttools varLib.instancer Bricolage-VF.ttf wght=$w wdth=100 opsz=12 --static --update-name-table -o bricolage-$w.ttf
  pyftsubset bricolage-$w.ttf --unicodes-file=unicodes-sans.txt --layout-features+=tnum --flavor=woff2 --output-file=bricolage-latin-$w-normal.woff2
done
for w in 400 500; do
  fonttools varLib.instancer Sometype-VF.ttf wght=$w --static --update-name-table -o sometype-$w.ttf
  pyftsubset sometype-$w.ttf --unicodes-file=unicodes-mono.txt --layout-features+=tnum --flavor=woff2 --output-file=sometype-mono-latin-$w-normal.woff2
done
# The variable form, for task 2.5's comparison only (not committed):
fonttools varLib.instancer Bricolage-VF.ttf wght=400:700 wdth=100 -o bricolage-var.ttf
pyftsubset bricolage-var.ttf --unicodes-file=unicodes-sans.txt --layout-features+=tnum --flavor=woff2 --output-file=bricolage-latin-wght-normal.woff2
```

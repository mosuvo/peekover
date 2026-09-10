# M11 8.1-R fidelity walk corpus

> **Walk aid, not a test.** This document exists so a human can walk REVISIT-RULING 2's
> "readable on both engines" bar top-to-bottom at full-document scale. It is not wired into any
> test suite and does not tick any `tasks.md` box on its own — the human's walk verdict is what
> resolves 8.1-R (and, if it lands there, the still-open 1.2-R fork).
>
> **Before you start:** open this file through the packed extension's app-page reader in both
> Chrome and Firefox. While on it, flip the theme (light / dark / sepia) at least once per engine
> — D-9-R's no-re-render claim means the math should re-colour with the rest of the page, not
> stay stuck at its original ink.

Every formula below is reused verbatim from the 1.2-R harness's own validated corpus
(`harness/math-fidelity/corpus.js`), already proven to render through real installed Temml with
zero errors — nothing here is invented.

## 1. Stretchy delimiters

$$\left( \frac{a}{b} \right)$$

$$\Biggl(\biggl(\Bigl(\bigl(x\bigr)\Bigr)\biggr)\Biggr)$$

$$\left[\frac{1}{1+\frac{1}{x}}\right]$$

Chrome's known weak spot: do the brackets in the last formula grow to the full height of the
nested fraction, or stay glyph-sized while the fraction overflows past them?

## 2. Radicals

$$\sqrt{x^2+y^2}$$

$$\sqrt[3]{8}$$

$$\sqrt{1+\sqrt{1+\sqrt{1+x}}}$$

Does the vinculum (the radical's top bar) extend over the *entire* radicand at each nesting
level, or clip short?

## 3. Big operators at display size

$$\int_0^\infty e^{-x^2}\,dx$$

$$\sum_{i=1}^{n} i^2$$

$$\prod_{k=1}^{n} k$$

$$\oint_C \vec{F}\cdot d\vec{r}$$

Block-mode operators should render at the larger "display" glyph size, not the smaller inline
size — check all four size up consistently.

## 4. Matrices

$$\begin{pmatrix} a & b \\ c & d \end{pmatrix}$$

$$\begin{bmatrix} a & b \\ c & d \end{bmatrix}$$

$$\begin{Bmatrix} a & b \\ c & d \end{Bmatrix}$$

$$\begin{vmatrix} a & b \\ c & d \end{vmatrix}$$

$$\begin{Vmatrix} a & b \\ c & d \end{Vmatrix}$$

Check grid alignment (columns line up across all five) and that each bracket style sizes to the
grid's full height.

## 5. Nested scripts / fractions

$$x^{y^{z^2}}$$

$$a_{i,j}^{(k)}$$

$$\frac{1}{1+\frac{1}{1+\frac{1}{x}}}$$

Legible stacking at every nesting depth, no glyph overlap between a superscript and the level
above it.

## 6. Accent glyphs

$$\hat{x}\ \bar{y}\ \dot{z}\ \ddot{w}\ \vec{v}\ \tilde{u}$$

These are the accent glyphs STIX Two Math covers that Noto did not (the reason STIX was chosen at
1.1-R). All six accents must actually appear over their base letters — not render as tofu
(missing-glyph boxes).

## 7. Inline vs. block

The quadratic formula $x = \frac{-b \pm \sqrt{b^2-4ac}}{2a}$ solves $ax^2+bx+c=0$, inline in
prose — check that the inline formula flows within the line's baseline and doesn't break the
surrounding text's rhythm.

For contrast, the same relationship in block form:

$$x = \frac{-b \pm \sqrt{b^2-4ac}}{2a}$$

## 8. Greek + named functions + a dense real formula

$$\alpha\beta\gamma\delta\epsilon\zeta\eta\theta\iota\kappa\lambda\mu\nu\xi\pi\rho\sigma\tau\upsilon\phi\chi\psi\omega\ \Gamma\Delta\Theta\Lambda\Xi\Pi\Sigma\Upsilon\Phi\Psi\Omega$$

$$\sin x + \cos x + \log x$$

A genuinely dense formula — does it stay readable at the reading column's width, or does it force
horizontal scroll / overflow the column?

$$\begin{cases} a & b \\ c & d \end{cases}$$

---

## Content-script surface (open THIS file directly as `file://`, not through the app page)

The behavioral cousin priced at 3.1-R: a formula in a `file://` document opened on the
**content-script** reader renders as inert monospace `<code>`, because `enhanceMath` never runs
there (§9-2 — app-page-only, by design, not a bug). This can't be shown inside the app-page walk
above (the app page *does* enhance math), so it needs the same file opened the other way.

Inline: $x$

Block:

$$y^2$$

On the content-script reader (this file opened directly as `file://`, not dragged into the app
page), the two formulas above should appear as **literal monospace text**, not rendered math —
expected per §9-2, not a defect. Eyeball whether that reads as acceptable or jarring; 3.1-R
flagged it as a possible §3.2 note.

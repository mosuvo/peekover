<!-- Covers: math passthrough markers (D-1-R, D-7-R, D-8-R) -- inline $...$, block
     $$...$$, and a ```math fence, ALL as escaped marker text, never rendered math
     (mathEngine.ts, group 4-R, owns actual rendering). Also pins the grammar's
     negative cases (3.1-R's audit, re-confirmed at 3.2-R): a shell $HOME inside a
     code span and a $5 price must NOT become math. -->

# Math

The quadratic formula is $x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$, inline.

$$
\int_0^\infty e^{-x^2}\,dx = \frac{\sqrt{\pi}}{2}
$$

```math
\sum_{i=1}^n i = \frac{n(n+1)}{2}
```

Run `echo $HOME` in a shell -- not math. A coffee is $5, also not math.

# 012 task 6.3 — the nested preview host's cost, and first paint with edit never entered: the measured tables

*Generated on 2026-10-09 by `pnpm perf:edit-preview -- --part nested` (then `-- --report`) and by
`pnpm exec tsx scripts/perf-edit-never-entered.ts`, each run alone on a quiet machine. This file is
the complete output; `docs/ai/decisions.md`'s "M12 TASK 6.3" entry carries the method, the reading
notes and the limits. **Nothing here is a recommendation: tasks.md 6.3 is forbidden from choosing,
and sets no threshold for what counts as material (gate 3, Q5) — that judgement is the human's.***

## Part 1 — the nested host

**The arms.** One document, opened in a fresh browser for every sample, then edit entered:
- **R** — reading only; edit never entered. The base for memory.
- **E** — editor only: the shell and CodeMirror's view, the preview pane left empty.
- **S** — *the ablated single-root control*: editor + the preview's content as a second reading
  column inside the OUTER shadow root. No nested host, no second `attachShadow`, no second copy of
  the reader's stylesheets. A harness construction — nothing in `src/` renders a preview this way.
- **N** — editor + the preview in a NESTED shadow root: the harness's copy of what ships, calling
  production's own `mount(text, previewHost, { contained, preserveReading, chrome: false })`.
- **P** — production: `buildEditor`, as the Edit control calls it (nested host, the shipped
  scheduler, the four enhancers after every render).
- **E again** — arm E a second time, last in every repetition: the same-session control.

**Reading the rows.** *N − S* is the nested root itself — the figure plan D-4 deferred to this
task. *S − E* is what the preview's content costs with one root. *E − R* is CodeMirror and the
shell. *P − N* is how far the harness's copy is from the shipped path: about nothing on prose; on
the enhancer-heavy document it is the enhancers (which run in P only), not the nesting.
*E again − E* is the noise: read every other difference against it.

**Reading the columns.** Times are milliseconds, median / floor.
- *first* — the first entry on a fresh page: CodeMirror's chunks are fetched and compiled inside it.
  *later* — re-entries on the same page (leave edit, enter again).
- *paint* — from just before entering edit to the 2nd animation frame after it resolved. Two
  frames is its floor (about 32 ms on Chromium; Firefox's headless frames are longer and its
  figures cluster near 60 ms), so small differences in work do not show in it. *build* — the build
  step alone (shell, the preview's first render, the editor view), which has no such floor.
- *re-render* — one preview render of the document with a few characters added: *the call*, and
  *to the 2nd frame*.
- *JS heap / Blink heap* — Chromium only, from the DevTools protocol after two forced collections:
  V8's heap in use, and Blink's own (DOM nodes, style, layout). Firefox gives a harness no such
  figure.
- *whole browser* — private bytes of every process of the browser, from the OS, after a collection.
  Coarse: on Firefox the same arm twice differs by 2–17 MB.
- Firefox's clock resolves 1 ms.

Machine: 13th Gen Intel(R) Core(TM) i7-13700 x24, 64 GB, win32 10.0.26200, node v24.11.1. Results: 8 files, 2026-10-09.

### Nested host — chromium · heavy 50k

*50377 B, 81 sections: 21 mermaid, 81 code fences, 81 block + 162 inline math, 81 tables. 5 fresh browser(s) per arm.*

**Entering edit, ms (median / floor).** *first* = the first entry on a fresh page (engine load included); *later* = re-entries on the same page. *paint* = before entry → 2nd frame after; *build* = the build step alone.

| Arm | n first | first: paint | first: build | n later | later: paint | later: build |
|---|--:|--:|--:|--:|--:|--:|
| E | 5 | 53.0 / 52.6 | 12.9 / 12.7 | 30 | 30.9 / 17.5 | 3.2 / 2.4 |
| S | 5 | 86.4 / 84.1 | 28.7 / 27.5 | 30 | 38.5 / 33.6 | 17.4 / 14.4 |
| N | 5 | 85.4 / 84.1 | 28.3 / 27.6 | 30 | 38.3 / 32.9 | 17.0 / 15.1 |
| P | 5 | 121.9 / 121.3 | 47.5 / 46.8 | 30 | 58.7 / 53.5 | 23.6 / 21.6 |
| E again | 5 | 54.1 / 53.0 | 12.8 / 12.5 | 30 | 30.8 / 18.3 | 3.1 / 2.4 |

**One preview re-render, ms (median / floor).**

| Arm | n | the call | to the 2nd frame |
|---|--:|--:|--:|
| S | 50 | 26.2 / 24.2 | 31.9 / 27.2 |
| N | 50 | 25.6 / 24.3 | 30.5 / 27.2 |
| P | 50 | 56.4 / 53.3 | 85.5 / 78.3 |

**Memory after a forced collection (median / floor), and what the arm built.**

| Arm | n | JS heap, KB | Blink heap, KB | DOM nodes | whole browser, MB | shadow roots | preview elements | preview height, px | nested `<style>` chars |
|---|--:|--:|--:|--:|--:|--:|--:|--:|--:|
| R | 5 | 2933 / 2929 | 8842 / 8842 | 24252 | 111.0 / 110.0 | 1 | 0 | 0 | 0 |
| E | 5 | 5871 / 5869 | 4290 / 4289 | 24548 | 114.6 / 113.5 | 1 | 0 | 0 | 0 |
| S | 5 | 5864 / 5861 | 10326 / 10326 | 32172 | 130.5 / 129.6 | 1 | 2663 | 66499 | 0 |
| N | 5 | 5862 / 5862 | 10334 / 10334 | 32178 | 130.5 / 129.9 | 2 | 2663 | 66499 | 43901 |
| P | 5 | 10935 / 10927 | 24383 / 24373 | 29473 | 191.9 / 188.3 | 2 | 11871 | 77836 | 160713 |
| E again | 5 | 5871 / 5871 | 4290 / 4289 | 24548 | 114.2 / 113.7 | 1 | 0 | 0 | 0 |

**Differences between arms (median / floor).** Read each against the last row: the same arm, measured twice.

| Difference | first: paint, ms | later: paint, ms | later: build, ms | re-render call, ms | re-render to frame, ms | JS heap, KB | Blink heap, KB | whole browser, MB |
|---|--:|--:|--:|--:|--:|--:|--:|--:|
| N − S — the nested root itself | −1.0 / 0.0 | −0.2 / −0.7 | −0.4 / +0.7 | −0.6 / +0.1 | −1.4 / 0.0 | −2 / +2 | +8 / +8 | +0.0 / +0.2 |
| S − E — the preview content, one root | +33.4 / +31.5 | +7.6 / +16.1 | +14.2 / +12.0 | — | — | −7 / −8 | +6037 / +6037 | +15.9 / +16.2 |
| N − E — the preview, nested | +32.4 / +31.5 | +7.4 / +15.4 | +13.8 / +12.7 | — | — | −9 / −6 | +6045 / +6045 | +15.9 / +16.4 |
| P − N — production beside the harness copy | +36.5 / +37.2 | +20.4 / +20.6 | +6.6 / +6.5 | +30.8 / +29.0 | +55.0 / +51.1 | +5073 / +5065 | +14048 / +14039 | +61.4 / +58.4 |
| E − R — CodeMirror and the shell | — | — | — | — | — | +2938 / +2940 | −4552 / −4552 | +3.6 / +3.5 |
| E again − E — THE SAME ARM TWICE (the control) | +1.1 / +0.4 | −0.1 / +0.8 | −0.1 / −0.0 | — | — | +0 / +3 | +1 / −0 | −0.4 / +0.2 |

### Nested host — chromium · prose 1m

*1000489 B, 2318 sections, prose only. 3 fresh browser(s) per arm.*

**Entering edit, ms (median / floor).** *first* = the first entry on a fresh page (engine load included); *later* = re-entries on the same page. *paint* = before entry → 2nd frame after; *build* = the build step alone.

| Arm | n first | first: paint | first: build | n later | later: paint | later: build |
|---|--:|--:|--:|--:|--:|--:|
| E | 3 | 84.0 / 82.2 | 20.2 / 19.2 | 9 | 35.0 / 34.8 | 7.4 / 6.9 |
| S | 3 | 472.7 / 471.3 | 171.9 / 171.5 | 9 | 457.8 / 407.9 | 186.3 / 149.7 |
| N | 3 | 468.4 / 466.3 | 174.2 / 174.1 | 9 | 451.2 / 404.8 | 187.5 / 148.0 |
| P | 3 | 474.0 / 469.1 | 176.1 / 176.1 | 9 | 453.8 / 404.7 | 186.0 / 151.9 |
| E again | 3 | 82.7 / 82.5 | 19.4 / 19.2 | 9 | 37.9 / 34.3 | 8.0 / 6.9 |

**One preview re-render, ms (median / floor).**

| Arm | n | the call | to the 2nd frame |
|---|--:|--:|--:|
| S | 15 | 345.2 / 340.0 | 388.1 / 377.5 |
| N | 15 | 344.7 / 331.7 | 390.2 / 369.4 |
| P | 15 | 346.2 / 334.0 | 388.8 / 370.5 |

**Memory after a forced collection (median / floor), and what the arm built.**

| Arm | n | JS heap, KB | Blink heap, KB | DOM nodes | whole browser, MB | shadow roots | preview elements | preview height, px | nested `<style>` chars |
|---|--:|--:|--:|--:|--:|--:|--:|--:|--:|
| R | 3 | 4704 / 4694 | 111643 / 111643 | 275142 | 352.8 / 351.5 | 1 | 0 | 0 | 0 |
| E | 3 | 9185 / 9182 | 45380 / 45378 | 268480 | 217.1 / 216.5 | 1 | 0 | 0 | 0 |
| S | 3 | 8913 / 8912 | 125449 / 125447 | 361212 | 400.2 / 398.6 | 1 | 29365 | 1107297 | 0 |
| N | 3 | 8910 / 8909 | 125458 / 125456 | 361218 | 398.8 / 398.3 | 2 | 29365 | 1107297 | 43901 |
| P | 3 | 8920 / 8917 | 125460 / 125459 | 361218 | 399.7 / 399.5 | 2 | 29365 | 1107297 | 43901 |
| E again | 3 | 9185 / 9184 | 45383 / 45382 | 268480 | 222.7 / 218.1 | 1 | 0 | 0 | 0 |

**Differences between arms (median / floor).** Read each against the last row: the same arm, measured twice.

| Difference | first: paint, ms | later: paint, ms | later: build, ms | re-render call, ms | re-render to frame, ms | JS heap, KB | Blink heap, KB | whole browser, MB |
|---|--:|--:|--:|--:|--:|--:|--:|--:|
| N − S — the nested root itself | −4.3 / −5.0 | −6.6 / −3.1 | +1.2 / −1.7 | −0.5 / −8.3 | +2.1 / −8.1 | −3 / −4 | +9 / +9 | −1.4 / −0.3 |
| S − E — the preview content, one root | +388.7 / +389.1 | +422.8 / +373.1 | +178.9 / +142.8 | — | — | −272 / −270 | +80069 / +80070 | +183.1 / +182.1 |
| N − E — the preview, nested | +384.4 / +384.1 | +416.2 / +370.0 | +180.1 / +141.1 | — | — | −275 / −274 | +80078 / +80078 | +181.7 / +181.8 |
| P − N — production beside the harness copy | +5.6 / +2.8 | +2.6 / −0.1 | −1.5 / +3.9 | +1.5 / +2.3 | −1.4 / +1.1 | +10 / +9 | +2 / +3 | +0.9 / +1.2 |
| E − R — CodeMirror and the shell | — | — | — | — | — | +4481 / +4488 | −66263 / −66265 | −135.7 / −135.1 |
| E again − E — THE SAME ARM TWICE (the control) | −1.3 / +0.3 | +2.9 / −0.5 | +0.6 / +0.0 | — | — | +0 / +1 | +3 / +4 | +5.6 / +1.6 |

### Nested host — chromium · prose 50k

*50503 B, 118 sections, prose only. 5 fresh browser(s) per arm.*

**Entering edit, ms (median / floor).** *first* = the first entry on a fresh page (engine load included); *later* = re-entries on the same page. *paint* = before entry → 2nd frame after; *build* = the build step alone.

| Arm | n first | first: paint | first: build | n later | later: paint | later: build |
|---|--:|--:|--:|--:|--:|--:|
| E | 5 | 55.4 / 54.9 | 12.8 / 12.4 | 30 | 31.9 / 24.4 | 3.1 / 2.2 |
| S | 5 | 78.2 / 77.2 | 23.2 / 22.6 | 30 | 32.4 / 29.6 | 13.2 / 11.1 |
| N | 5 | 78.3 / 76.1 | 22.9 / 22.2 | 30 | 32.2 / 29.3 | 13.3 / 11.1 |
| P | 5 | 77.9 / 76.2 | 23.2 / 22.6 | 30 | 32.4 / 28.0 | 13.2 / 11.7 |
| E again | 5 | 55.0 / 54.4 | 12.8 / 12.7 | 30 | 31.8 / 23.7 | 2.9 / 2.2 |

**One preview re-render, ms (median / floor).**

| Arm | n | the call | to the 2nd frame |
|---|--:|--:|--:|
| S | 50 | 18.5 / 17.5 | 32.2 / 21.0 |
| N | 50 | 18.4 / 17.4 | 32.2 / 21.0 |
| P | 50 | 18.5 / 17.5 | 32.2 / 21.0 |

**Memory after a forced collection (median / floor), and what the arm built.**

| Arm | n | JS heap, KB | Blink heap, KB | DOM nodes | whole browser, MB | shadow roots | preview elements | preview height, px | nested `<style>` chars |
|---|--:|--:|--:|--:|--:|--:|--:|--:|--:|
| R | 5 | 2907 / 2905 | 6269 / 6269 | 14072 | 107.7 / 107.1 | 1 | 0 | 0 | 0 |
| E | 5 | 6200 / 6200 | 3327 / 3326 | 14010 | 113.6 / 112.0 | 1 | 0 | 0 | 0 |
| S | 5 | 6208 / 6205 | 7426 / 7425 | 18741 | 125.3 / 124.3 | 1 | 1498 | 56674 | 0 |
| N | 5 | 6204 / 6200 | 7435 / 7434 | 18747 | 125.8 / 124.3 | 2 | 1498 | 56674 | 43901 |
| P | 5 | 6215 / 6212 | 7435 / 7435 | 18747 | 126.0 / 125.1 | 2 | 1498 | 56674 | 43901 |
| E again | 5 | 6200 / 6200 | 3326 / 3326 | 14010 | 113.0 / 112.5 | 1 | 0 | 0 | 0 |

**Differences between arms (median / floor).** Read each against the last row: the same arm, measured twice.

| Difference | first: paint, ms | later: paint, ms | later: build, ms | re-render call, ms | re-render to frame, ms | JS heap, KB | Blink heap, KB | whole browser, MB |
|---|--:|--:|--:|--:|--:|--:|--:|--:|
| N − S — the nested root itself | +0.1 / −1.1 | −0.2 / −0.3 | +0.1 / 0.0 | −0.1 / −0.1 | 0.0 / 0.0 | −5 / −5 | +9 / +9 | +0.5 / −0.0 |
| S − E — the preview content, one root | +22.8 / +22.3 | +0.5 / +5.2 | +10.1 / +8.9 | — | — | +8 / +5 | +4099 / +4100 | +11.7 / +12.3 |
| N − E — the preview, nested | +22.9 / +21.2 | +0.3 / +4.9 | +10.2 / +8.9 | — | — | +3 / −0 | +4108 / +4109 | +12.2 / +12.3 |
| P − N — production beside the harness copy | −0.4 / +0.1 | +0.2 / −1.3 | −0.1 / +0.6 | +0.1 / +0.1 | 0.0 / 0.0 | +12 / +12 | +1 / +1 | +0.2 / +0.9 |
| E − R — CodeMirror and the shell | — | — | — | — | — | +3293 / +3296 | −2943 / −2943 | +5.9 / +4.9 |
| E again − E — THE SAME ARM TWICE (the control) | −0.4 / −0.5 | −0.1 / −0.7 | −0.2 / 0.0 | — | — | −0 / −0 | −0 / 0 | −0.6 / +0.5 |

### Nested host — chromium · prose small

*2245 B, 5 sections, prose only. 5 fresh browser(s) per arm.*

**Entering edit, ms (median / floor).** *first* = the first entry on a fresh page (engine load included); *later* = re-entries on the same page. *paint* = before entry → 2nd frame after; *build* = the build step alone.

| Arm | n first | first: paint | first: build | n later | later: paint | later: build |
|---|--:|--:|--:|--:|--:|--:|
| E | 5 | 53.8 / 53.3 | 12.0 / 11.8 | 30 | 32.3 / 31.0 | 2.8 / 1.9 |
| S | 5 | 57.7 / 55.4 | 13.5 / 13.1 | 30 | 32.2 / 31.4 | 3.7 / 2.7 |
| N | 5 | 56.7 / 56.0 | 13.6 / 13.1 | 30 | 32.1 / 30.7 | 3.9 / 2.6 |
| P | 5 | 57.1 / 55.1 | 13.5 / 13.5 | 30 | 32.2 / 30.7 | 3.9 / 2.8 |
| E again | 5 | 54.7 / 54.0 | 12.2 / 11.8 | 30 | 32.2 / 31.4 | 2.7 / 1.8 |

**One preview re-render, ms (median / floor).**

| Arm | n | the call | to the 2nd frame |
|---|--:|--:|--:|
| S | 50 | 1.9 / 1.5 | 32.1 / 30.7 |
| N | 50 | 2.2 / 1.5 | 32.0 / 31.0 |
| P | 50 | 1.9 / 1.6 | 32.0 / 30.3 |

**Memory after a forced collection (median / floor), and what the arm built.**

| Arm | n | JS heap, KB | Blink heap, KB | DOM nodes | whole browser, MB | shadow roots | preview elements | preview height, px | nested `<style>` chars |
|---|--:|--:|--:|--:|--:|--:|--:|--:|--:|
| R | 5 | 2712 / 2711 | 821 / 820 | 666 | 94.2 / 93.3 | 1 | 0 | 0 | 0 |
| E | 5 | 5157 / 5157 | 1131 / 1115 | 943 | 102.2 / 101.8 | 1 | 0 | 0 | 0 |
| S | 5 | 5169 / 5169 | 1320 / 1319 | 1155 | 103.6 / 102.6 | 1 | 67 | 2731 | 0 |
| N | 5 | 5167 / 5167 | 1328 / 1327 | 1161 | 103.3 / 102.4 | 2 | 67 | 2731 | 43901 |
| P | 5 | 5176 / 5176 | 1329 / 1328 | 1161 | 103.0 / 102.8 | 2 | 67 | 2731 | 43901 |
| E again | 5 | 5157 / 5157 | 1115 / 1115 | 943 | 102.5 / 101.8 | 1 | 0 | 0 | 0 |

**Differences between arms (median / floor).** Read each against the last row: the same arm, measured twice.

| Difference | first: paint, ms | later: paint, ms | later: build, ms | re-render call, ms | re-render to frame, ms | JS heap, KB | Blink heap, KB | whole browser, MB |
|---|--:|--:|--:|--:|--:|--:|--:|--:|
| N − S — the nested root itself | −1.0 / +0.6 | −0.1 / −0.7 | +0.2 / −0.1 | +0.3 / 0.0 | −0.1 / +0.3 | −2 / −2 | +7 / +8 | −0.3 / −0.1 |
| S − E — the preview content, one root | +3.9 / +2.1 | −0.1 / +0.4 | +0.9 / +0.8 | — | — | +12 / +12 | +189 / +204 | +1.4 / +0.8 |
| N − E — the preview, nested | +2.9 / +2.7 | −0.2 / −0.3 | +1.1 / +0.7 | — | — | +10 / +10 | +197 / +212 | +1.1 / +0.7 |
| P − N — production beside the harness copy | +0.4 / −0.9 | +0.1 / 0.0 | +0.0 / +0.2 | −0.3 / +0.1 | 0.0 / −0.7 | +9 / +9 | +1 / +1 | −0.3 / +0.3 |
| E − R — CodeMirror and the shell | — | — | — | — | — | +2445 / +2447 | +310 / +295 | +7.9 / +8.4 |
| E again − E — THE SAME ARM TWICE (the control) | +0.9 / +0.7 | −0.1 / +0.4 | −0.1 / −0.1 | — | — | −0 / +0 | −16 / 0 | +0.3 / +0.0 |

### Nested host — firefox · heavy 50k

*50377 B, 81 sections: 21 mermaid, 81 code fences, 81 block + 162 inline math, 81 tables. 5 fresh browser(s) per arm.*

**Entering edit, ms (median / floor).** *first* = the first entry on a fresh page (engine load included); *later* = re-entries on the same page. *paint* = before entry → 2nd frame after; *build* = the build step alone.

| Arm | n first | first: paint | first: build | n later | later: paint | later: build |
|---|--:|--:|--:|--:|--:|--:|
| E | 5 | 78.0 / 74.0 | 17.0 / 15.0 | 30 | 60.0 / 35.0 | 7.0 / 6.0 |
| S | 5 | 139.0 / 109.0 | 43.0 / 37.0 | 30 | 60.0 / 45.0 | 26.0 / 24.0 |
| N | 5 | 127.0 / 115.0 | 50.0 / 45.0 | 30 | 60.0 / 51.0 | 26.0 / 24.0 |
| P | 5 | 268.0 / 172.0 | 62.0 / 53.0 | 30 | 132.0 / 74.0 | 36.0 / 33.0 |
| E again | 5 | 84.0 / 77.0 | 16.0 / 15.0 | 30 | 60.0 / 32.0 | 7.0 / 6.0 |

**One preview re-render, ms (median / floor).**

| Arm | n | the call | to the 2nd frame |
|---|--:|--:|--:|
| S | 50 | 23.0 / 21.0 | 60.0 / 42.0 |
| N | 50 | 24.0 / 22.0 | 60.0 / 42.0 |
| P | 50 | 43.0 / 40.0 | 164.0 / 78.0 |

**Memory after a forced collection (median / floor), and what the arm built.**

| Arm | n | JS heap, KB | Blink heap, KB | DOM nodes | whole browser, MB | shadow roots | preview elements | preview height, px | nested `<style>` chars |
|---|--:|--:|--:|--:|--:|--:|--:|--:|--:|
| R | 5 | — | — | — | 431.4 / 424.5 | 1 | 0 | 0 | 0 |
| E | 5 | — | — | — | 457.6 / 453.7 | 1 | 0 | 0 | 0 |
| S | 5 | — | — | — | 474.8 / 468.1 | 1 | 2663 | 66523 | 0 |
| N | 5 | — | — | — | 474.8 / 473.8 | 2 | 2663 | 66523 | 43901 |
| P | 5 | — | — | — | 555.2 / 547.9 | 2 | 11871 | 77611 | 160713 |
| E again | 5 | — | — | — | 459.4 / 457.6 | 1 | 0 | 0 | 0 |

**Differences between arms (median / floor).** Read each against the last row: the same arm, measured twice.

| Difference | first: paint, ms | later: paint, ms | later: build, ms | re-render call, ms | re-render to frame, ms | JS heap, KB | Blink heap, KB | whole browser, MB |
|---|--:|--:|--:|--:|--:|--:|--:|--:|
| N − S — the nested root itself | −12.0 / +6.0 | 0.0 / +6.0 | 0.0 / 0.0 | +1.0 / +1.0 | 0.0 / 0.0 | — | — | −0.0 / +5.7 |
| S − E — the preview content, one root | +61.0 / +35.0 | 0.0 / +10.0 | +19.0 / +18.0 | — | — | — | — | +17.2 / +14.4 |
| N − E — the preview, nested | +49.0 / +41.0 | 0.0 / +16.0 | +19.0 / +18.0 | — | — | — | — | +17.1 / +20.2 |
| P − N — production beside the harness copy | +141.0 / +57.0 | +72.0 / +23.0 | +10.0 / +9.0 | +19.0 / +18.0 | +104.0 / +36.0 | — | — | +80.5 / +74.1 |
| E − R — CodeMirror and the shell | — | — | — | — | — | — | — | +26.3 / +29.1 |
| E again − E — THE SAME ARM TWICE (the control) | +6.0 / +3.0 | 0.0 / −3.0 | 0.0 / 0.0 | — | — | — | — | +1.8 / +4.0 |

### Nested host — firefox · prose 1m

*1000489 B, 2318 sections, prose only. 3 fresh browser(s) per arm.*

**Entering edit, ms (median / floor).** *first* = the first entry on a fresh page (engine load included); *later* = re-entries on the same page. *paint* = before entry → 2nd frame after; *build* = the build step alone.

| Arm | n first | first: paint | first: build | n later | later: paint | later: build |
|---|--:|--:|--:|--:|--:|--:|
| E | 3 | 160.0 / 158.0 | 69.0 / 68.0 | 9 | 112.0 / 110.0 | 63.0 / 59.0 |
| S | 3 | 700.0 / 697.0 | 271.0 / 270.0 | 9 | 517.0 / 510.0 | 276.0 / 261.0 |
| N | 3 | 758.0 / 603.0 | 330.0 / 328.0 | 9 | 517.0 / 502.0 | 278.0 / 256.0 |
| P | 3 | 756.0 / 756.0 | 331.0 / 330.0 | 9 | 517.0 / 496.0 | 279.0 / 261.0 |
| E again | 3 | 158.0 / 153.0 | 70.0 / 66.0 | 9 | 114.0 / 107.0 | 63.0 / 58.0 |

**One preview re-render, ms (median / floor).**

| Arm | n | the call | to the 2nd frame |
|---|--:|--:|--:|
| S | 15 | 288.0 / 282.0 | 434.0 / 418.0 |
| N | 15 | 292.0 / 283.0 | 435.0 / 421.0 |
| P | 15 | 295.0 / 285.0 | 440.0 / 423.0 |

**Memory after a forced collection (median / floor), and what the arm built.**

| Arm | n | JS heap, KB | Blink heap, KB | DOM nodes | whole browser, MB | shadow roots | preview elements | preview height, px | nested `<style>` chars |
|---|--:|--:|--:|--:|--:|--:|--:|--:|--:|
| R | 3 | — | — | — | 574.3 / 572.8 | 1 | 0 | 0 | 0 |
| E | 3 | — | — | — | 621.2 / 602.6 | 1 | 0 | 0 | 0 |
| S | 3 | — | — | — | 672.0 / 671.2 | 1 | 29365 | 1113189 | 0 |
| N | 3 | — | — | — | 680.8 / 673.6 | 2 | 29365 | 1113189 | 43901 |
| P | 3 | — | — | — | 673.0 / 666.8 | 2 | 29365 | 1113189 | 43901 |
| E again | 3 | — | — | — | 610.4 / 606.7 | 1 | 0 | 0 | 0 |

**Differences between arms (median / floor).** Read each against the last row: the same arm, measured twice.

| Difference | first: paint, ms | later: paint, ms | later: build, ms | re-render call, ms | re-render to frame, ms | JS heap, KB | Blink heap, KB | whole browser, MB |
|---|--:|--:|--:|--:|--:|--:|--:|--:|
| N − S — the nested root itself | +58.0 / −94.0 | 0.0 / −8.0 | +2.0 / −5.0 | +4.0 / +1.0 | +1.0 / +3.0 | — | — | +8.8 / +2.4 |
| S − E — the preview content, one root | +540.0 / +539.0 | +405.0 / +400.0 | +213.0 / +202.0 | — | — | — | — | +50.8 / +68.6 |
| N − E — the preview, nested | +598.0 / +445.0 | +405.0 / +392.0 | +215.0 / +197.0 | — | — | — | — | +59.6 / +71.0 |
| P − N — production beside the harness copy | −2.0 / +153.0 | 0.0 / −6.0 | +1.0 / +5.0 | +3.0 / +2.0 | +5.0 / +2.0 | — | — | −7.8 / −6.8 |
| E − R — CodeMirror and the shell | — | — | — | — | — | — | — | +47.0 / +29.8 |
| E again − E — THE SAME ARM TWICE (the control) | −2.0 / −5.0 | +2.0 / −3.0 | 0.0 / −1.0 | — | — | — | — | −10.9 / +4.2 |

### Nested host — firefox · prose 50k

*50503 B, 118 sections, prose only. 5 fresh browser(s) per arm.*

**Entering edit, ms (median / floor).** *first* = the first entry on a fresh page (engine load included); *later* = re-entries on the same page. *paint* = before entry → 2nd frame after; *build* = the build step alone.

| Arm | n first | first: paint | first: build | n later | later: paint | later: build |
|---|--:|--:|--:|--:|--:|--:|
| E | 5 | 93.0 / 70.0 | 15.0 / 14.0 | 30 | 60.0 / 32.0 | 6.0 / 5.0 |
| S | 5 | 109.0 / 90.0 | 33.0 / 29.0 | 30 | 60.0 / 34.0 | 18.0 / 16.0 |
| N | 5 | 111.0 / 97.0 | 37.0 / 32.0 | 30 | 60.0 / 32.0 | 18.0 / 16.0 |
| P | 5 | 111.0 / 96.0 | 39.0 / 32.0 | 30 | 60.0 / 33.0 | 18.0 / 16.0 |
| E again | 5 | 75.0 / 66.0 | 17.0 / 14.0 | 30 | 60.0 / 31.0 | 6.0 / 5.0 |

**One preview re-render, ms (median / floor).**

| Arm | n | the call | to the 2nd frame |
|---|--:|--:|--:|
| S | 50 | 15.0 / 13.0 | 59.0 / 27.0 |
| N | 50 | 15.0 / 14.0 | 59.0 / 30.0 |
| P | 50 | 16.0 / 14.0 | 58.0 / 30.0 |

**Memory after a forced collection (median / floor), and what the arm built.**

| Arm | n | JS heap, KB | Blink heap, KB | DOM nodes | whole browser, MB | shadow roots | preview elements | preview height, px | nested `<style>` chars |
|---|--:|--:|--:|--:|--:|--:|--:|--:|--:|
| R | 5 | — | — | — | 427.4 / 419.7 | 1 | 0 | 0 | 0 |
| E | 5 | — | — | — | 440.8 / 438.0 | 1 | 0 | 0 | 0 |
| S | 5 | — | — | — | 466.5 / 452.5 | 1 | 1498 | 56974 | 0 |
| N | 5 | — | — | — | 456.3 / 444.4 | 2 | 1498 | 56974 | 43901 |
| P | 5 | — | — | — | 462.7 / 448.4 | 2 | 1498 | 56974 | 43901 |
| E again | 5 | — | — | — | 445.2 / 441.2 | 1 | 0 | 0 | 0 |

**Differences between arms (median / floor).** Read each against the last row: the same arm, measured twice.

| Difference | first: paint, ms | later: paint, ms | later: build, ms | re-render call, ms | re-render to frame, ms | JS heap, KB | Blink heap, KB | whole browser, MB |
|---|--:|--:|--:|--:|--:|--:|--:|--:|
| N − S — the nested root itself | +2.0 / +7.0 | 0.0 / −2.0 | 0.0 / 0.0 | 0.0 / +1.0 | 0.0 / +3.0 | — | — | −10.2 / −8.1 |
| S − E — the preview content, one root | +16.0 / +20.0 | 0.0 / +2.0 | +12.0 / +11.0 | — | — | — | — | +25.7 / +14.5 |
| N − E — the preview, nested | +18.0 / +27.0 | 0.0 / 0.0 | +12.0 / +11.0 | — | — | — | — | +15.5 / +6.4 |
| P − N — production beside the harness copy | 0.0 / −1.0 | 0.0 / +1.0 | 0.0 / 0.0 | +1.0 / 0.0 | −1.0 / 0.0 | — | — | +6.4 / +4.0 |
| E − R — CodeMirror and the shell | — | — | — | — | — | — | — | +13.4 / +18.4 |
| E again − E — THE SAME ARM TWICE (the control) | −18.0 / −4.0 | 0.0 / −1.0 | 0.0 / 0.0 | — | — | — | — | +4.4 / +3.2 |

### Nested host — firefox · prose small

*2245 B, 5 sections, prose only. 5 fresh browser(s) per arm.*

**Entering edit, ms (median / floor).** *first* = the first entry on a fresh page (engine load included); *later* = re-entries on the same page. *paint* = before entry → 2nd frame after; *build* = the build step alone.

| Arm | n first | first: paint | first: build | n later | later: paint | later: build |
|---|--:|--:|--:|--:|--:|--:|
| E | 5 | 85.0 / 64.0 | 11.0 / 11.0 | 30 | 56.0 / 30.0 | 6.0 / 2.0 |
| S | 5 | 73.0 / 66.0 | 14.0 / 13.0 | 30 | 46.0 / 29.0 | 7.0 / 5.0 |
| N | 5 | 86.0 / 79.0 | 15.0 / 14.0 | 30 | 57.0 / 30.0 | 7.0 / 4.0 |
| P | 5 | 78.0 / 71.0 | 17.0 / 15.0 | 30 | 58.0 / 42.0 | 8.0 / 3.0 |
| E again | 5 | 78.0 / 78.0 | 12.0 / 10.0 | 30 | 58.0 / 34.0 | 5.0 / 3.0 |

**One preview re-render, ms (median / floor).**

| Arm | n | the call | to the 2nd frame |
|---|--:|--:|--:|
| S | 50 | 3.0 / 1.0 | 53.0 / 26.0 |
| N | 50 | 4.0 / 2.0 | 57.0 / 25.0 |
| P | 50 | 3.0 / 1.0 | 58.0 / 30.0 |

**Memory after a forced collection (median / floor), and what the arm built.**

| Arm | n | JS heap, KB | Blink heap, KB | DOM nodes | whole browser, MB | shadow roots | preview elements | preview height, px | nested `<style>` chars |
|---|--:|--:|--:|--:|--:|--:|--:|--:|--:|
| R | 5 | — | — | — | 401.2 / 398.5 | 1 | 0 | 0 | 0 |
| E | 5 | — | — | — | 417.1 / 416.5 | 1 | 0 | 0 | 0 |
| S | 5 | — | — | — | 430.5 / 424.4 | 1 | 67 | 2744 | 0 |
| N | 5 | — | — | — | 424.0 / 419.9 | 2 | 67 | 2744 | 43901 |
| P | 5 | — | — | — | 426.6 / 424.1 | 2 | 67 | 2744 | 43901 |
| E again | 5 | — | — | — | 428.4 / 422.9 | 1 | 0 | 0 | 0 |

**Differences between arms (median / floor).** Read each against the last row: the same arm, measured twice.

| Difference | first: paint, ms | later: paint, ms | later: build, ms | re-render call, ms | re-render to frame, ms | JS heap, KB | Blink heap, KB | whole browser, MB |
|---|--:|--:|--:|--:|--:|--:|--:|--:|
| N − S — the nested root itself | +13.0 / +13.0 | +11.0 / +1.0 | 0.0 / −1.0 | +1.0 / +1.0 | +4.0 / −1.0 | — | — | −6.5 / −4.6 |
| S − E — the preview content, one root | −12.0 / +2.0 | −10.0 / −1.0 | +1.0 / +3.0 | — | — | — | — | +13.3 / +7.9 |
| N − E — the preview, nested | +1.0 / +15.0 | +1.0 / 0.0 | +1.0 / +2.0 | — | — | — | — | +6.9 / +3.3 |
| P − N — production beside the harness copy | −8.0 / −8.0 | +1.0 / +12.0 | +1.0 / −1.0 | −1.0 / −1.0 | +1.0 / +5.0 | — | — | +2.6 / +4.2 |
| E − R — CodeMirror and the shell | — | — | — | — | — | — | — | +15.9 / +18.0 |
| E again − E — THE SAME ARM TWICE (the control) | −7.0 / +14.0 | +2.0 / +4.0 | −1.0 / +1.0 | — | — | — | — | +11.3 / +6.4 |


## Part 1b — Firefox, the 1 MB and enhancer-heavy documents a second time

*A separate run of `--part nested --engine firefox --docs prose:1m,heavy:50k`, made to see whether the first-entry difference between N and S on Firefox repeats. It does.*


### Nested host — firefox · heavy 50k

*50377 B, 81 sections: 21 mermaid, 81 code fences, 81 block + 162 inline math, 81 tables. 5 fresh browser(s) per arm.*

**Entering edit, ms (median / floor).** *first* = the first entry on a fresh page (engine load included); *later* = re-entries on the same page. *paint* = before entry → 2nd frame after; *build* = the build step alone.

| Arm | n first | first: paint | first: build | n later | later: paint | later: build |
|---|--:|--:|--:|--:|--:|--:|
| E | 5 | 99.0 / 82.0 | 19.0 / 16.0 | 30 | 60.0 / 21.0 | 7.0 / 6.0 |
| S | 5 | 109.0 / 107.0 | 39.0 / 37.0 | 30 | 60.0 / 47.0 | 26.0 / 24.0 |
| N | 5 | 120.0 / 110.0 | 47.0 / 41.0 | 30 | 60.0 / 50.0 | 26.0 / 24.0 |
| P | 5 | 258.0 / 163.0 | 63.0 / 55.0 | 30 | 132.0 / 127.0 | 36.0 / 34.0 |
| E again | 5 | 92.0 / 79.0 | 19.0 / 15.0 | 30 | 60.0 / 34.0 | 7.0 / 6.0 |

**One preview re-render, ms (median / floor).**

| Arm | n | the call | to the 2nd frame |
|---|--:|--:|--:|
| S | 50 | 23.0 / 22.0 | 60.0 / 45.0 |
| N | 50 | 24.0 / 22.0 | 60.0 / 35.0 |
| P | 50 | 44.0 / 41.0 | 172.0 / 123.0 |

**Memory after a forced collection (median / floor), and what the arm built.**

| Arm | n | JS heap, KB | Blink heap, KB | DOM nodes | whole browser, MB | shadow roots | preview elements | preview height, px | nested `<style>` chars |
|---|--:|--:|--:|--:|--:|--:|--:|--:|--:|
| R | 5 | — | — | — | 431.8 / 430.3 | 1 | 0 | 0 | 0 |
| E | 5 | — | — | — | 457.7 / 455.2 | 1 | 0 | 0 | 0 |
| S | 5 | — | — | — | 473.6 / 472.0 | 1 | 2663 | 66523 | 0 |
| N | 5 | — | — | — | 473.8 / 465.9 | 2 | 2663 | 66523 | 43901 |
| P | 5 | — | — | — | 556.4 / 550.7 | 2 | 11871 | 77611 | 160713 |
| E again | 5 | — | — | — | 455.8 / 450.0 | 1 | 0 | 0 | 0 |

**Differences between arms (median / floor).** Read each against the last row: the same arm, measured twice.

| Difference | first: paint, ms | later: paint, ms | later: build, ms | re-render call, ms | re-render to frame, ms | JS heap, KB | Blink heap, KB | whole browser, MB |
|---|--:|--:|--:|--:|--:|--:|--:|--:|
| N − S — the nested root itself | +11.0 / +3.0 | 0.0 / +3.0 | 0.0 / 0.0 | +1.0 / 0.0 | 0.0 / −10.0 | — | — | +0.2 / −6.1 |
| S − E — the preview content, one root | +10.0 / +25.0 | 0.0 / +26.0 | +19.0 / +18.0 | — | — | — | — | +15.9 / +16.8 |
| N − E — the preview, nested | +21.0 / +28.0 | 0.0 / +29.0 | +19.0 / +18.0 | — | — | — | — | +16.0 / +10.7 |
| P − N — production beside the harness copy | +138.0 / +53.0 | +72.0 / +77.0 | +10.0 / +10.0 | +20.0 / +19.0 | +112.0 / +88.0 | — | — | +82.6 / +84.8 |
| E − R — CodeMirror and the shell | — | — | — | — | — | — | — | +25.9 / +24.9 |
| E again − E — THE SAME ARM TWICE (the control) | −7.0 / −3.0 | 0.0 / +13.0 | 0.0 / 0.0 | — | — | — | — | −2.0 / −5.3 |

### Nested host — firefox · prose 1m

*1000489 B, 2318 sections, prose only. 3 fresh browser(s) per arm.*

**Entering edit, ms (median / floor).** *first* = the first entry on a fresh page (engine load included); *later* = re-entries on the same page. *paint* = before entry → 2nd frame after; *build* = the build step alone.

| Arm | n first | first: paint | first: build | n later | later: paint | later: build |
|---|--:|--:|--:|--:|--:|--:|
| E | 3 | 162.0 / 161.0 | 70.0 / 67.0 | 9 | 112.0 / 103.0 | 62.0 / 56.0 |
| S | 3 | 555.0 / 548.0 | 274.0 / 271.0 | 9 | 516.0 / 509.0 | 277.0 / 260.0 |
| N | 3 | 763.0 / 756.0 | 331.0 / 331.0 | 9 | 518.0 / 513.0 | 280.0 / 265.0 |
| P | 3 | 773.0 / 768.0 | 337.0 / 335.0 | 9 | 518.0 / 506.0 | 281.0 / 260.0 |
| E again | 3 | 161.0 / 160.0 | 69.0 / 69.0 | 9 | 111.0 / 105.0 | 61.0 / 55.0 |

**One preview re-render, ms (median / floor).**

| Arm | n | the call | to the 2nd frame |
|---|--:|--:|--:|
| S | 15 | 290.0 / 277.0 | 436.0 / 413.0 |
| N | 15 | 293.0 / 285.0 | 443.0 / 426.0 |
| P | 15 | 294.0 / 285.0 | 437.0 / 420.0 |

**Memory after a forced collection (median / floor), and what the arm built.**

| Arm | n | JS heap, KB | Blink heap, KB | DOM nodes | whole browser, MB | shadow roots | preview elements | preview height, px | nested `<style>` chars |
|---|--:|--:|--:|--:|--:|--:|--:|--:|--:|
| R | 3 | — | — | — | 573.1 / 566.5 | 1 | 0 | 0 | 0 |
| E | 3 | — | — | — | 628.6 / 598.6 | 1 | 0 | 0 | 0 |
| S | 3 | — | — | — | 674.7 / 674.0 | 1 | 29365 | 1113189 | 0 |
| N | 3 | — | — | — | 668.4 / 660.1 | 2 | 29365 | 1113189 | 43901 |
| P | 3 | — | — | — | 672.1 / 667.9 | 2 | 29365 | 1113189 | 43901 |
| E again | 3 | — | — | — | 611.4 / 610.3 | 1 | 0 | 0 | 0 |

**Differences between arms (median / floor).** Read each against the last row: the same arm, measured twice.

| Difference | first: paint, ms | later: paint, ms | later: build, ms | re-render call, ms | re-render to frame, ms | JS heap, KB | Blink heap, KB | whole browser, MB |
|---|--:|--:|--:|--:|--:|--:|--:|--:|
| N − S — the nested root itself | +208.0 / +208.0 | +2.0 / +4.0 | +3.0 / +5.0 | +3.0 / +8.0 | +7.0 / +13.0 | — | — | −6.2 / −14.0 |
| S − E — the preview content, one root | +393.0 / +387.0 | +404.0 / +406.0 | +215.0 / +204.0 | — | — | — | — | +46.1 / +75.4 |
| N − E — the preview, nested | +601.0 / +595.0 | +406.0 / +410.0 | +218.0 / +209.0 | — | — | — | — | +39.8 / +61.5 |
| P − N — production beside the harness copy | +10.0 / +12.0 | 0.0 / −7.0 | +1.0 / −5.0 | +1.0 / 0.0 | −6.0 / −6.0 | — | — | +3.7 / +7.9 |
| E − R — CodeMirror and the shell | — | — | — | — | — | — | — | +55.5 / +32.1 |
| E again − E — THE SAME ARM TWICE (the control) | −1.0 / −1.0 | −1.0 / +2.0 | −1.0 / −1.0 | — | — | — | — | −17.2 / +11.7 |


## Part 2 — first paint with edit mode never entered

*The two existing first-paint gates, unchanged, run against three builds in turn: HEAD; the last commit before M12 implementation began (`0541886`, whose content script reproduces the recorded pre-M12 pin — 340,492 B, md5 `bcdcf231…`); and `8cbac42`, the commit after tasks 1.1 and 1.2 (CodeMirror installed, `markdown-it` and `dompurify` bumped) and before any editor code. HEAD is first in every round and closes the run. Chromium only, as both gates are.*

Machine: 13th Gen Intel(R) Core(TM) i7-13700 x24, 64 GB, win32 10.0.26200, node v24.11.1.


### Is the editor fetched before edit is entered? (app page, this checkout's build)

- Requests from page load to 1.5 s after first paint, edit never entered: **4**.
- Requests caused by activating Edit (the firing control — must be more than none): **4** — `chunks/dist-DW6WPqv4.js`, `chunks/dist-RU3B8-NR.js`, `chunks/dist-Dhcxmr-u.js`, `chunks/dist-DXypBb2x.js`.
- Of those, already requested before edit was entered: **0**.


### First paint, edit never entered — content script (`pnpm perf -- --size 50kb`)

| Build | invocations | warm runs | median, ms | floor, ms | per-invocation medians, ms | per-invocation floors, ms |
|---|--:|--:|--:|--:|--:|--:|
| HEAD | 6 | 36 | 141.3 | 135.8 | 139.6 – 144.3 | 135.8 – 139.5 |
| pre-M12 (0541886) | 5 | 30 | 140.3 | 136.8 | 138.9 – 141.8 | 136.8 – 138.7 |
| deps bump (8cbac42) | 5 | 30 | 140.6 | 134.6 | 139.4 – 141.6 | 134.6 – 139.9 |

- HEAD − pre-M12 (0541886): median +1.0 ms, floor −1.0 ms.
- HEAD − deps bump (8cbac42): median +0.7 ms, floor +1.2 ms.
- HEAD against itself, across its 6 invocations: medians span 4.8 ms, floors span 3.7 ms.


### First paint, edit never entered — app page (`pnpm perf:app`)

| Build | invocations | warm runs | median, ms | floor, ms | per-invocation medians, ms | per-invocation floors, ms |
|---|--:|--:|--:|--:|--:|--:|
| HEAD | 6 | 36 | 90.9 | 85.6 | 89.4 – 92.8 | 85.6 – 88.1 |
| pre-M12 (0541886) | 5 | 30 | 88.5 | 86.0 | 87.8 – 89.0 | 86.0 – 86.8 |
| deps bump (8cbac42) | 5 | 30 | 91.7 | 85.8 | 91.0 – 93.4 | 85.8 – 92.7 |

- HEAD − pre-M12 (0541886): median +2.4 ms, floor −0.4 ms.
- HEAD − deps bump (8cbac42): median −0.8 ms, floor −0.2 ms.
- HEAD against itself, across its 6 invocations: medians span 3.3 ms, floors span 2.5 ms.


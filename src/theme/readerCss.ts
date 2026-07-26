// readerCss — the reader's entire stylesheet, as a string injected into the shadow
// root (never the host page). Two things live here and nothing else:
//
//   1. The design tokens (design/tokens.css is the SOURCE OF TRUTH — values here
//      are copied verbatim). They are scoped to `:host` instead of `:root` because
//      inside a shadow tree `:host` is the styleable root, and custom properties set
//      on it inherit down to every rendered node. All three themes are DEFINED
//      (light default, dark, sepia); in M1 only light/dark are ACTIVE, driven by the
//      OS `prefers-color-scheme` via a `data-theme` attribute the runtime sets on the
//      host (see theme/reader.ts). Sepia + manual switching are dormant until the
//      settings milestone wires a UI to them.
//
//   2. The reading typography — a centered ~76ch column of Literata on paper, styled
//      to design/mockup.html's `.doc` reading feel (headings, lists, tables, quotes,
//      code, links-as-ink+highlighter-underline, mark). Selectors target the plain
//      semantic tags markdown-it emits (h1..h6, p, ul/ol/li, blockquote, pre>code,
//      table, a, code, em/strong/del, img, hr) plus markdown-it-task-lists' classes.
//
// TRAP GUARD (docs/ai/decisions.md 2026-07-10, brand.html): anything sitting ON the
// highlighter must use a LITERAL dark hex for its text, NEVER var(--ink). --hl stays
// yellow in every theme, but --ink INVERTS to near-white in dark mode — so var(--ink)
// text on --hl would vanish in dark. `mark` and link:hover text below use literal
// hex for exactly this reason. (The task-list checkmark uses var(--paper) on
// var(--accent): those two ALWAYS contrast — opposite ends of the theme — so that
// pairing is safe and is not a trap case.)

/** The <style> payload for the reader shadow root: tokens + reading typography. */
export const READER_CSS = /* css */ `
/* ============ Design tokens (design/tokens.css — verbatim) ============ */
:host{
  --paper:#FBFBF8; --panel:#F4F4EF; --ink:#16171F; --muted:#5D6070; --faint:#9A9DAC;
  --line:#E6E6DF; --code-bg:#F1F1EB;
  --accent:#16171F; --accent-soft:#ECECE3;
  --hl:#FFE94A; --hl-soft:#FFF6BF;
  --ok:#1F9D55; --ok-soft:#E4F5EB; --warn:#B7791F;
  --del:#B8512F; --del-soft:#F8E9E2;
  --logo-ink:#16171F; --logo-eye:#FBFBF8;
  --r:10px; --shadow:0 10px 30px rgba(22,23,31,.10);
  --serif:"Literata",Georgia,serif; --sans:"Bricolage Grotesque",system-ui,sans-serif;
  --mono:"Sometype Mono",ui-monospace,monospace;
}
:host([data-theme="dark"]){
  --paper:#12141C; --panel:#181B26; --ink:#EAEBF3; --muted:#A0A4B8; --faint:#6B6F84;
  --line:#262A38; --code-bg:#1C2030;
  --accent:#EAEBF3; --accent-soft:#232838;
  --hl:#FFD84D; --hl-soft:#3A3413;
  --ok:#4CC38A; --ok-soft:#15291F; --warn:#E0A83E;
  --del:#E08663; --del-soft:#342016;
}
:host([data-theme="sepia"]){
  --paper:#F6EEDF; --ink:#3B2F1E; --accent:#3B2F1E; --accent-soft:#E9DCC1;
}

/* ============ Shadow root as a full-bleed reader takeover ============ */
/* Fixed to the viewport so the paper reaches every edge regardless of the host
   page's body margins — we style ONLY our own shadow host, never the page. The
   original page nodes are already display:none'd by mountReader. */
:host{
  all:initial;
  display:block;
  position:fixed;
  inset:0;
  overflow:auto;
  background:var(--paper);
  color:var(--ink);
  font-family:var(--serif);
  font-size:17px;
  line-height:1.7;
  -webkit-text-size-adjust:100%;
  text-rendering:optimizeLegibility;
  scroll-behavior:smooth;
}
:host *,:host *::before,:host *::after{box-sizing:border-box}
:host :focus-visible{outline:2px solid var(--accent);outline-offset:2px;border-radius:4px}
:host ::selection{background:var(--hl-soft)}
@media (prefers-reduced-motion:reduce){
  :host{scroll-behavior:auto}
  :host *{animation-duration:.001ms!important;transition-duration:.001ms!important}
}

/* ============ Reading column ============ */
/* Measure: ONE value, referenced twice (max-width + the data-toc margin). Why px not ch: B1 block. */
:host{ --reader-measure:748px; }
.peekover-reader{
  max-width:var(--reader-measure);
  margin:0 auto;
  padding:56px 32px 130px;
  width:100%;
}
.peekover-reader > :first-child{margin-top:0}

/* ---- headings ---- */
.peekover-reader h1,.peekover-reader h2,.peekover-reader h3,
.peekover-reader h4,.peekover-reader h5,.peekover-reader h6{
  font-family:var(--serif);font-weight:600;color:var(--ink);
  letter-spacing:-.01em;line-height:1.2;
}
.peekover-reader h1{font-size:44px;line-height:1.12;letter-spacing:-.015em;margin:0 0 14px}
.peekover-reader h2{font-size:27px;margin:52px 0 14px}
.peekover-reader h3{font-size:20px;margin:36px 0 10px}
.peekover-reader h4{font-size:16px;margin:28px 0 8px}
.peekover-reader h5{font-size:13px;margin:24px 0 8px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted)}
.peekover-reader h6{font-size:12px;margin:24px 0 8px;text-transform:uppercase;letter-spacing:.1em;color:var(--faint)}

/* ---- prose ---- */
.peekover-reader p{margin:0 0 16px}
.peekover-reader strong{font-weight:700}
.peekover-reader em{font-style:italic}
.peekover-reader del,.peekover-reader s{color:var(--muted)}
.peekover-reader sup,.peekover-reader sub{font-size:.75em;line-height:0}
.peekover-reader hr{border:none;border-top:1px solid var(--line);margin:40px 0}
.peekover-reader img{max-width:100%;height:auto;border-radius:var(--r)}

/* links: ink text + highlighter underline (brand: interactive = ink + highlighter) */
.peekover-reader a{
  color:var(--ink);text-decoration:none;
  background:linear-gradient(transparent 72%, var(--hl) 72%);
  padding:0 1px;transition:background .15s;border-radius:2px;
}
.peekover-reader a:hover{background:var(--hl);color:#26210a}   /* literal: text on highlighter */
:host([data-theme="dark"]) .peekover-reader a{background:linear-gradient(transparent 88%, var(--hl) 88%)}
:host([data-theme="dark"]) .peekover-reader a:hover{color:#191504} /* literal: text on highlighter */

/* highlight: literal dark text — --hl is yellow in every theme, so NEVER var(--ink) */
.peekover-reader mark{background:var(--hl);color:#26210a;padding:0 3px;border-radius:3px}
:host([data-theme="dark"]) .peekover-reader mark{color:#191504}

/* ---- lists ---- */
.peekover-reader ul,.peekover-reader ol{margin:0 0 16px;padding-left:1.5em}
.peekover-reader li{margin:6px 0}
.peekover-reader li::marker{color:var(--faint)}
.peekover-reader li > ul,.peekover-reader li > ol{margin:6px 0 0}

/* task lists (markdown-it-task-lists): rendered checkboxes, disabled */
.peekover-reader ul.contains-task-list{list-style:none;padding-left:0}
.peekover-reader li.task-list-item{display:flex;align-items:flex-start;gap:11px;margin:7px 0}
.peekover-reader li.task-list-item::marker{content:""}
.peekover-reader input[type="checkbox"]{
  appearance:none;-webkit-appearance:none;
  width:19px;height:19px;margin:3px 0 0;flex:none;position:relative;
  border:2px solid var(--faint);border-radius:6px;background:var(--paper);
}
.peekover-reader input[type="checkbox"]:checked{background:var(--accent);border-color:var(--accent)}
/* checkmark: var(--paper) on var(--accent) — always-opposite pair, safe in both themes */
.peekover-reader input[type="checkbox"]:checked::after{
  content:"";position:absolute;left:3.5px;top:4px;width:8px;height:4.5px;
  border:solid var(--paper);border-width:0 0 2.5px 2.5px;transform:rotate(-45deg);
}

/* ---- blockquote ---- */
.peekover-reader blockquote{
  margin:24px 0;padding:4px 22px;border-left:3px solid var(--hl);
  color:var(--muted);font-style:italic;
}
.peekover-reader blockquote p:last-child{margin-bottom:0}

/* ---- code ---- */
.peekover-reader code{
  font-family:var(--mono);font-size:.85em;
  background:var(--code-bg);padding:1px 5px;border-radius:4px;
}
.peekover-reader pre{
  font-family:var(--mono);font-size:13.5px;line-height:1.7;
  background:var(--code-bg);border:1px solid var(--line);border-radius:var(--r);
  padding:22px;margin:22px 0;overflow:auto;
}
.peekover-reader pre code{background:none;padding:0;font-size:inherit;border-radius:0}

/* ---- tables ---- */
.peekover-reader table{
  width:100%;border-collapse:collapse;font-family:var(--sans);font-size:14.5px;
  margin:22px 0;border:1px solid var(--line);border-radius:var(--r);overflow:hidden;
}
.peekover-reader th{
  text-align:left;background:var(--panel);padding:11px 16px;
  font-size:11.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);
}
.peekover-reader td{padding:11px 16px;border-top:1px solid var(--line);color:var(--ink)}

/* ============ Raw fallback (never a blank page — AGENTS.md #5) ============ */
.peekover-raw{
  max-width:76ch;margin:56px auto;padding:26px;
  font-family:var(--mono);font-size:13px;line-height:1.75;color:var(--muted);
  background:var(--code-bg);border:1px solid var(--line);border-radius:var(--r);
  overflow:auto;white-space:pre-wrap;word-break:break-word;
}

/* ============ Raw <-> Reading toggle (task 4.2) ============ */
/* View visibility is driven PURELY by data-mode on the host, so toggling is an
   attribute flip — parse/sanitize never re-run. The failure path sets NO data-mode
   (banner + raw is the only view there), so neither rule hides its raw <pre>. */
:host([data-mode="reading"]) .peekover-raw{display:none}
:host([data-mode="raw"]) .peekover-reader{display:none}

/* ============ Diff view (task 6.1, D-15) ============ */
/* Entering a diff is an ATTRIBUTE FLIP, not a re-render: data-diff="active" on the HOST — mirroring
   data-watch/data-mode — hides the reading column while a lazily-built sibling .peekover-diff
   (diffView.ts) takes its place. The host attribute survives replaceChildren (like data-watch); the
   .peekover-reader DOM is never touched, so exit is just clearing the attribute + restoring the
   reading anchor. SEPARATE from data-mode on purpose (readerMode.ts guards its Raw shortcut on
   data-mode; a third data-mode value would change that shipped semantic). */
:host([data-diff="active"]) .peekover-reader{display:none}

/* The diff occupies the reading column's space — same centered measure and padding as
   .peekover-reader, so a diff reads at the width the document did. */
.peekover-diff{
  max-width:76ch;margin:0 auto;padding:56px 32px 130px;width:100%;
  font-family:var(--serif);color:var(--ink);
}
.peekover-diff > :first-child{margin-top:0}
/* Each hunk is one block carrying its change KIND. Colour is NEVER the only signal (§5 a11y):
   removed also carries line-through, and added/removed use distinct fills as well as hue.
   Matches design/mockup.html:210-211 (.diff .add / .del). */
.peekover-diff .diff-added{background:var(--ok-soft);color:var(--ok);border-radius:6px;padding:2px 8px;margin:2px 0}
.peekover-diff .diff-removed{
  /* ★ --del DOUBLE-MEANING (design judgement gated at 9.1, plan §1.7): --del is ALSO the lit
     network indicator's "one warm accent" (see .peekover-net__dot below). Using it for diff-removed
     is its SECOND meaning. 6.1 uses --del to match the mockup; a dedicated token is 9.1's call, not
     6.1's — do NOT silently substitute a nearby token. line-through is the non-colour a11y signal. */
  background:var(--del-soft);color:var(--del);text-decoration:line-through;
  border-radius:6px;padding:2px 8px;margin:2px 0;
}
/* Unchanged recedes so added/removed stand out. */
.peekover-diff .diff-unchanged{color:var(--muted);padding:2px 8px;margin:2px 0}

/* One minimal pill, fixed in an unobtrusive corner. Styled from tokens (panel/ink/
   line) — NOT the mockup's full toolbar. Stays put while the column scrolls; its
   transition is neutralised under prefers-reduced-motion by the global rule above. */
.peekover-mode-toggle{
  position:fixed;top:16px;right:16px;z-index:2;
  font-family:var(--sans);font-size:12.5px;font-weight:600;letter-spacing:.02em;
  color:var(--muted);background:var(--panel);
  border:1px solid var(--line);border-radius:999px;
  padding:6px 15px;cursor:pointer;box-shadow:var(--shadow);
  transition:color .15s,background .15s,border-color .15s;
}
.peekover-mode-toggle:hover{color:var(--ink);border-color:var(--faint)}

/* ============ Theme control (task 5.1 — auto/light/dark) ============ */
/* The same pill chrome as the mode toggle, in the BOTTOM-LEFT, stacked above the network
   indicator. The corner is chosen by elimination, not taste — every other one is already
   claimed, and this is the M3 collision defect class:
     - the whole RIGHT side belongs to the TOC rail (full height, right:0). A top-right pill
       stacked under the mode toggle looks free at a wide viewport but collides with the rail's
       handle at a narrow one, where the rail clamps to 38vw and its content shifts left into
       exactly that band. Measured, not assumed.
     - TOP-RIGHT is the mode toggle, TOP-LEFT the remote-load opt-in.
   That leaves the bottom-left, which only the network indicator uses (bottom:16px, and hidden
   until the user triggers a network action) — so this sits one pill-height above it at 56px and
   the two never intersect whether or not the indicator is lit. Tokens ONLY. */
.peekover-theme-toggle{
  position:fixed;bottom:56px;left:16px;z-index:2;
  font-family:var(--sans);font-size:12.5px;font-weight:600;letter-spacing:.02em;
  color:var(--muted);background:var(--panel);
  border:1px solid var(--line);border-radius:999px;
  padding:6px 15px;cursor:pointer;box-shadow:var(--shadow);
  transition:color .15s,background .15s,border-color .15s;
}
.peekover-theme-toggle:hover{color:var(--ink);border-color:var(--faint)}

/* ============ Watch control (spec 005 task 4.1 — "watching") ============ */
/* THE MOCKUP'S BADGE, TRANSLATED INTO THIS READER'S CHROME FAMILY — not its toolbar.
   design/mockup.html puts a .watch button with a .dot span inside
   in a fixed 52px top bar beside a brand, a breadcrumb, an AI button and a segmented mode
   control. None of that exists here and this task does not build it (see watchControl.ts's
   header). What IS carried across: the pill shape, the --ok "live and healthy" semantic, the
   pulsing dot, the --ok-soft hover, and the word "watching".

   PLACEMENT, BY ELIMINATION AND BY MEASUREMENT (004's 5.1 method; rects in watchControl.ts):
   top-right is the mode toggle and the row beneath it is the TOC handle; top-left is the
   remote-load opt-in and exists only sometimes; bottom-right sits inside the TOC rail box AND
   its live entry list at a narrow viewport. The bottom-left column is the one that clears
   everything, so this is its THIRD tenant: network indicator (16) -> theme pill (56) -> watch
   (96). Asserted at a narrow and a wide viewport on both surfaces.

   TWO TOKENS THE MOCKUP USES AND THIS FILE ALREADY DEFINES: --ok and --ok-soft, in BOTH themes
   (see the token blocks at the top — copied verbatim from design/tokens.css). No token had to be
   added; substituting --accent here would have silently thrown away the "this is live" meaning.

   ONE MOCKUP DECLARATION DELIBERATELY DROPPED: its border is
   1px solid color-mix(in srgb, var(--ok) 35%, transparent). color-mix() appears NOWHERE in
   Peekover's shipped CSS, and introducing a new CSS feature for one border is not worth it — the
   pill family's own var(--line) border is used instead. Nothing is lost: the --ok semantic is
   carried by the TEXT and the DOT, which are also the two carriers a colour-blind user reads via
   the label change rather than the hue (a11y — state is never colour-only). */
.peekover-watch{
  position:fixed;bottom:96px;left:16px;z-index:2;
  display:inline-flex;align-items:center;gap:7px;
  font-family:var(--sans);font-size:12.5px;font-weight:600;letter-spacing:.02em;
  color:var(--muted);background:var(--panel);
  border:1px solid var(--line);border-radius:999px;
  padding:6px 15px;cursor:pointer;box-shadow:var(--shadow);
  transition:color .15s,background .15s,border-color .15s;
}
.peekover-watch:hover{color:var(--ink);border-color:var(--faint)}
/* ACTIVE: the mockup's green. Driven off the HOST attribute, so it survives replaceChildren —
   which matters precisely because watching is what causes the re-render. */
:host([data-watch="active"]) .peekover-watch{color:var(--ok)}
:host([data-watch="active"]) .peekover-watch:hover{color:var(--ok);background:var(--ok-soft)}

.peekover-watch__dot{
  flex:none;width:7px;height:7px;border-radius:50%;
  background:var(--faint);
}
/* The pulse — an expanding ring that then vanishes, the mockup's @keyframes pulse with the
   color-mix ring replaced by the --ok-soft token. INFINITE, and therefore the strongest possible
   case for prefers-reduced-motion: the global :host * animation-duration:.001ms!important rule
   near the top of this sheet neutralises it under reduce, which the browser suite asserts
   NON-VACUOUSLY (it measures the un-reduced 2s path in the same run). */
:host([data-watch="active"]) .peekover-watch__dot{
  background:var(--ok);
  animation:peekover-watch-pulse 2s infinite;
}
@keyframes peekover-watch-pulse{
  0%,100%{box-shadow:0 0 0 0 var(--ok-soft)}
  55%{box-shadow:0 0 0 6px transparent}
}

/* THE UPDATE SIGNAL (task 4.2) — the mockup's .flash keyframe and its 1.6s duration, applied to
   the CONTROL rather than to the changed element. 005 re-renders the whole document and cannot
   know WHICH element changed without a diff, and the diff is 006; flashing the whole reading
   column instead would wash the entire document on every agent keystroke, which is the opposite
   of brief and non-intrusive. Flashing the chrome that already means "this file is live" says
   exactly what 005 knows and nothing it does not. Full argument: watchController.ts, DECISION 2.
   Neutralised under reduce by the same global animation-duration rule as the pulse. */
.peekover-watch.is-updated{animation:peekover-watch-flash 1.6s ease}
@keyframes peekover-watch-flash{
  0%{background:var(--hl-soft)}
  100%{background:var(--panel)}
}

/* THE DESIGNED EXPLANATION (tasks 4.3 + 4.4) — NOT a disabled control, NOT a dead toggle.
   One element serves both honesty cases, because from the user's side they are the same case:
   watching is not happening, and here is why, in plain language. 4.3 = a watch that DIED (the file
   stopped being readable) — it appears WITHOUT a re-render, so the last good render stays exactly
   where it is (AGENTS.md #5: never blank, and never a silent failure either). 4.4 = a watch that
   could never START on this Firefox surface.

   It sits directly above the watch pill in the same bottom-left column and is width-capped so it
   reads as a quiet aside rather than a modal — the document stays the hero. The left accent bar
   borrows the render-failure banner's language (.peekover-alert) so degraded states across the
   reader look like one family. --warn, not --del: this is "something you should know", not an
   error the user caused. Tokens ONLY. */
.peekover-watch-note{
  position:fixed;bottom:136px;left:16px;z-index:2;
  margin:0;max-width:34ch;
  font-family:var(--sans);font-size:12px;line-height:1.5;
  color:var(--muted);background:var(--panel);
  border:1px solid var(--line);border-left:3px solid var(--warn);
  border-radius:0 var(--r) var(--r) 0;
  padding:9px 13px;box-shadow:var(--shadow);
}
.peekover-watch-note[hidden]{display:none}

/* The persistent capture disclosure (task 3.1, D-3) — a SEPARATE channel from the watch note,
   sitting one 40px step above it in the same bottom-left column (net 16 · theme 56 · watch pill 96
   · watch note 136 · disclosure 176). It BORROWS the note's quiet-aside shape — same width cap,
   typography, panel fill, fixed/absolute split — because both are the reader's calm asides. What
   differs is the accent, and that difference is the semantic: the note is a WARNING (--warn amber,
   "something you should know"); this is INFORMATIONAL (--accent, the brand ink), a standing
   statement that capture is on and on-device. Ink, not amber, so it reads as disclosure rather than
   alarm. Tokens ONLY. */
.peekover-watch-disclosure{
  position:fixed;bottom:176px;left:16px;z-index:2;
  margin:0;max-width:34ch;
  font-family:var(--sans);font-size:12px;line-height:1.5;
  color:var(--muted);background:var(--panel);
  border:1px solid var(--line);border-left:3px solid var(--accent);
  border-radius:0 var(--r) var(--r) 0;
  padding:9px 13px;box-shadow:var(--shadow);
}
.peekover-watch-disclosure[hidden]{display:none}

/* ============ Diff affordance + snapshot picker (task 6.2, D-14) ============ */
/* Top-left below the remote-load slot, MEASURED not chosen (the 4.1 rule) — on the CONTAINED pane,
   because D-14 ships this chrome to the app page only. The candidate-by-candidate rects that ruled
   out the bottom-left stack, both top-right slots and bottom-right live in diffChrome.ts's header
   (a .ts comment, so it does not ship; THESE css comments are inside a template literal and DO).
   Geometry is asserted at the wide viewport in tests/browser/diffChrome.browser.test.ts. */
.peekover-diff-affordance{
  position:fixed;top:56px;left:16px;z-index:2;
  font-family:var(--sans);font-size:12.5px;font-weight:600;letter-spacing:.02em;
  color:var(--muted);background:var(--panel);
  border:1px solid var(--line);border-radius:999px;
  padding:7px 15px;cursor:pointer;
  transition:color .15s,background .15s,border-color .15s;
}
.peekover-diff-affordance:hover{color:var(--ink);border-color:var(--faint)}
/* While a diff is on screen the pill's gesture is EXIT, and it says so — the label and aria-label
   both change (diffChrome.ts), so the state is never carried by colour alone (§5). --accent is the
   brand ink: this is an active, actionable mode, not a warning. Deliberately NOT --ok (that is
   watch's "live and healthy" semantic) and NOT --del (already double-booked between the network
   indicator and diff-removed — see .peekover-diff .diff-removed above). */
.peekover-diff-affordance[data-diff-open="true"]{color:var(--accent);border-color:var(--accent)}

/* The snapshot picker — a listbox anchored under the pill, NEVER a dialog: no backdrop, no dim, no
   focus trap, no centering (mockup divergence 1 — the mockup's modal vs spec §3.7's inline; the
   verbatim record is at diffChrome.ts's rendering site, per plan §1.7). Sized to the measured slot
   and scrolling internally so a full retention window stays one calm list. Tokens ONLY. */
.peekover-diff-picker{
  position:fixed;top:94px;left:16px;z-index:2;
  box-sizing:border-box;width:240px;max-width:calc(100vw - 32px);
  max-height:min(46vh,320px);overflow:auto;
  background:var(--panel);border:1px solid var(--line);border-radius:var(--r);
  box-shadow:var(--shadow);padding:5px;
}
.peekover-diff-picker[hidden]{display:none}
/* One row = one comparison target. A <button>, so Enter/Space and the tab order come for free. */
.peekover-diff-picker__item{
  display:flex;align-items:baseline;justify-content:space-between;gap:10px;
  width:100%;box-sizing:border-box;text-align:left;
  font-family:var(--sans);font-size:12px;line-height:1.5;
  color:var(--muted);background:none;border:0;border-radius:calc(var(--r) - 3px);
  padding:7px 9px;cursor:pointer;
  transition:color .15s,background .15s;
}
.peekover-diff-picker__item:hover{color:var(--ink);background:var(--paper)}
.peekover-diff-picker__when{font-weight:600}
.peekover-diff-picker__size{color:var(--faint);font-variant-numeric:tabular-nums}

/* The fallback / empty-state line (plan §1.5, §7-8) — shown BESIDE the untouched reader when a
   comparison cannot be made: the document stays exactly on screen, data-diff is never set, never
   blank (AGENTS.md #5). It occupies the picker's slot, which is safe because the two are mutually
   exclusive by construction in diffChrome.ts (every path closes one before showing the other).
   It BORROWS .peekover-watch-note's shape and its --warn accent, and that is the semantic, not
   laziness: "comparison unavailable" and "no snapshots yet" are the same class of thing the watch
   note carries — something you should know, not an error you caused. --accent is reserved for the
   informational capture disclosure (3.1), which this is not. Tokens ONLY. */
.peekover-diff-status{
  position:fixed;top:94px;left:16px;z-index:2;
  margin:0;max-width:34ch;
  font-family:var(--sans);font-size:12px;line-height:1.5;
  color:var(--muted);background:var(--panel);
  border:1px solid var(--line);border-left:3px solid var(--warn);
  border-radius:0 var(--r) var(--r) 0;
  padding:9px 13px;box-shadow:var(--shadow);
}
.peekover-diff-status[hidden]{display:none}

/* ============ Remote-resource policy (block-by-default) ============ */
/* A blocked remote image becomes this inert, themed placeholder (no src → cannot
   fetch; the original URL rides on data-peekover-src for one-click restore). Inline
   so it is valid inside a paragraph, and dashed to read as "withheld", not broken. */
.peekover-remote{
  display:inline-flex;align-items:baseline;gap:9px;
  max-width:100%;margin:2px 0;padding:8px 13px;vertical-align:middle;
  font-family:var(--sans);font-size:13px;color:var(--muted);
  background:var(--panel);border:1px dashed var(--line);border-radius:var(--r);
}
.peekover-remote__badge{
  flex:none;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;
  color:var(--faint);
}
.peekover-remote__alt{font-style:italic;overflow-wrap:anywhere}

/* Opt-in affordance: one pill in the top-left, mirroring the mode-toggle chrome
   (top-right). Removes itself once clicked — a one-shot; reload re-blocks. */
.peekover-remote-load{
  position:fixed;top:16px;left:16px;z-index:2;
  font-family:var(--sans);font-size:12.5px;font-weight:600;letter-spacing:.02em;
  color:var(--muted);background:var(--panel);
  border:1px solid var(--line);border-radius:999px;
  padding:6px 15px;cursor:pointer;box-shadow:var(--shadow);
  transition:color .15s,background .15s,border-color .15s;
}
.peekover-remote-load:hover{color:var(--ink);border-color:var(--faint)}

/* Network indicator: the "this view has now used the network" light. Ships HIDDEN
   and is revealed ONLY when the host carries data-network="active" (set the moment
   the user opts into a network action) — then it stays for the rest of the view. It
   never shows otherwise (AGENTS.md #1). --del is the one warm accent — a deliberate,
   honest signal that the zero-network default has been left. */
.peekover-net{
  position:fixed;bottom:16px;left:16px;z-index:2;display:none;
  align-items:center;gap:8px;
  font-family:var(--sans);font-size:11.5px;font-weight:600;letter-spacing:.03em;
  color:var(--muted);background:var(--panel);
  border:1px solid var(--line);border-radius:999px;
  padding:5px 12px 5px 11px;box-shadow:var(--shadow);
}
:host([data-network="active"]) .peekover-net{display:inline-flex}
.peekover-net__dot{
  flex:none;width:8px;height:8px;border-radius:50%;
  background:var(--del);box-shadow:0 0 0 3px var(--del-soft);
}

/* ============ Render-failure banner (AGENTS.md #5, upgraded) ============ */
/* A quiet left-accent alert (mockup .alert.warn) — a left border bar, NOT a heavy
   filled box. Shown ONLY on the failure path, above the raw source; a user-chosen
   Raw view (via the toggle) has NO banner. */
.peekover-alert{
  max-width:76ch;margin:26px auto 0;padding:12px 16px;
  font-family:var(--sans);font-size:14px;color:var(--ink);
  background:var(--hl-soft);
  border-left:3px solid var(--warn);border-radius:0 var(--r) var(--r) 0;
}

/* ============ TOC rail (task 2.2 — right-side "on this page" navigation) ============ */
/* Quiet right-rail chrome, a SIBLING of the reading column and the pills — never inside
   .peekover-reader (that column stays byte-identical). Same fixed→absolute containment
   trick the pills use under {contained} (CONTAINED_CSS below). Width is a per-view custom
   property --toc-w that the resize drag (3.4) rewrites; open/collapsed keys off data-toc on
   the host (initialTocOpen sets it in 2.1; the backtick toggle flips it in 2.3). Tokens
   ONLY — panel/line for the surface, muted/faint/ink for text, hl for the active mark. */
:host{ --toc-w:250px; }

.peekover-toc{
  position:fixed;top:0;right:0;z-index:1;
  box-sizing:border-box;width:var(--toc-w);max-width:38vw;height:100%;
  overflow:auto;padding:56px 22px 130px;
  /* OPAQUE surface (group-3 gate fix): without a background the rail is see-through and
     the reading column's text shows THROUGH it. --paper matches the page, so the rail
     reads as the same quiet paper divided only by its border-left — but it now occludes
     anything behind it. (The collapsed handle is paper-on-paper = invisible box around the
     --panel toggle pill, which is the intended look.) */
  background:var(--paper);
  font-family:var(--sans);font-size:13px;line-height:1.5;color:var(--muted);
  border-left:1px solid var(--line);
}

/* Always-present opener/handle heading the rail — the single control that flips data-toc,
   and the affordance that MUST survive the collapsed state (a hidden whole-rail with no way
   back was the ship-dark defect). A pill echoing the mode-toggle chrome; the ☰ glyph via an
   escaped code point (\\2630) so no literal control byte lands in this string. */
.peekover-toc__toggle{
  display:inline-flex;align-items:center;gap:7px;margin:0 0 12px;
  font-family:var(--sans);font-size:12px;font-weight:600;letter-spacing:.02em;
  color:var(--muted);background:var(--panel);
  border:1px solid var(--line);border-radius:999px;
  padding:6px 13px;cursor:pointer;
  transition:color .15s,background .15s,border-color .15s;
}
.peekover-toc__toggle:hover{color:var(--ink);border-color:var(--faint)}
.peekover-toc__toggle::before{content:"\\2630";font-size:13px;line-height:1;color:var(--faint)}

/* Collapsed (narrow scrollport / toggled off) collapses the rail TO ITS HANDLE — the list
   body is hidden, but the opener stays visible and clickable so the TOC is never unreachable.
   The nav shrinks to fit the handle and drops the full-height border; its top offset clears
   the top-right mode pill. The document stays the hero — the reading column is untouched. */
:host([data-toc="collapsed"]) .peekover-toc{
  width:auto;height:auto;overflow:visible;
  padding:52px 16px 16px;border-left:none;
}
:host([data-toc="collapsed"]) .peekover-toc__list{display:none}
:host([data-toc="collapsed"]) .peekover-toc__toggle{margin:0}
.peekover-toc [hidden]{display:none} /* collapsed subtree (childList.hidden) — explicit in shadow */

/* Reserve the rail's width on the COLUMN so the now-opaque rail never CLIPS the reading text
   (group-3 gate fix, companion to the opaque background above). While OPEN the reading column
   gives up EXACTLY --toc-w of right margin, so its right edge is pulled clear of the rail's left
   edge and no column text can sit under the rail to be clipped. margin-left is COMPUTED, not auto:
   half the surplus after column+rail, floored at 0 — wide centres the column beside the rail, narrow
   keeps the left-align. Argument: the B1 .ts block below. Reserving exactly one rail-width — not both
   sides — is what keeps this correct on a NARROW scrollport (where the
   column's padding floor plus a two-sided reservation would overshoot the rail); the column simply
   takes whatever width remains left of the rail. The reservation is --toc-w, so a 3.4 resize
   widens it too, and it is ZERO when collapsed (this rule is gated on data-toc="open" → the base
   margin:0 auto re-centers the column beside the handle, no phantom gutter left). Column-side ONLY
   → identical on both surfaces: the full-page fixed rail and the contained absolute rail both
   anchor to the same :host right edge the column's margin is measured against. padding-right on
   :host is deliberately avoided — it fights the fixed rail's right:0 anchor and the scrollbar and
   breaks the contained case (the investigation's finding). width:auto is REQUIRED here: the base
   column is width:100%, and a bare margin-right on a 100%-wide box does not shrink it — it drives
   margin-left negative and shoves the column off-screen left. width:auto lets the column shrink to
   fill exactly the space LEFT of the rail (still capped at the base max-width), so on a narrow
   scrollport it takes what remains and on a wide one it caps at the measure. */
:host([data-toc="open"]) .peekover-reader{
  width:auto;
  margin-right:var(--toc-w);
  margin-left:max(0px,calc((100% - var(--reader-measure) - var(--toc-w)) / 2));
}

.peekover-toc__list{list-style:none;margin:0;padding:0}
/* Nested levels indent under their parent with a hairline guide (the nesting made visible). */
.peekover-toc__list .peekover-toc__list{margin-left:11px;padding-left:9px;border-left:1px solid var(--line)}
.peekover-toc__item{margin:0}
.peekover-toc__row{display:flex;align-items:flex-start;gap:3px}

/* Disclosure twist: a bare glyph that rotates on expand (transition neutralised under
   prefers-reduced-motion by the global :host rule). No token color beyond faint/muted. */
.peekover-toc__twist{
  flex:none;width:18px;height:24px;padding:0;
  display:inline-flex;align-items:center;justify-content:center;
  background:none;border:none;cursor:pointer;color:var(--faint);
}
.peekover-toc__twist:hover{color:var(--muted)}
.peekover-toc__twist::before{content:"\\25B8";font-size:10px;display:inline-block;transition:transform .15s}
.peekover-toc__twist[aria-expanded="true"]::before{transform:rotate(90deg)}

/* Entry link: a full-width text button, single-line with ellipsis so long headings never
   break the rail. Ink-on-hover echoes the reader's interactive language. */
.peekover-toc__link{
  flex:1 1 auto;min-width:0;
  display:block;text-align:left;
  margin:1px 0;padding:4px 7px;
  background:none;border:none;border-radius:6px;cursor:pointer;
  font-family:var(--sans);font-size:13px;line-height:1.4;color:var(--muted);
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
  transition:color .15s,background .15s;
}
.peekover-toc__link:hover{color:var(--ink);background:var(--panel)}
/* Active section (scroll-spy sets aria-current="location" + .is-active in 3.2). The one
   highlighter accent as a left bar — brand "interactive = ink + highlighter". */
.peekover-toc__link.is-active,
.peekover-toc__link[aria-current="location"]{
  color:var(--ink);font-weight:600;
  box-shadow:inset 2px 0 0 var(--hl);
}

/* Resize handle (3.4 wires the pointer drag that rewrites --toc-w; the rule ships here so
   the seam task carries the rail's full chrome). A thin grab strip on the rail's inner edge;
   contained within the now-positioned .peekover-toc. */
.peekover-toc__resizer{
  position:absolute;top:0;left:0;width:6px;height:100%;
  padding:0;background:none;border:none;cursor:ew-resize;touch-action:none;
}
.peekover-toc__resizer:hover{background:var(--line)}

/* scroll-margin-top so a TOC click's scrollIntoView (3.1) lands the heading below the top
   chrome, not flush against the scrollport edge. Container-relative → engine-correct on both
   surfaces, no JS pixel math. Additive property only; the column's own rules are unchanged. */
.peekover-reader h1,.peekover-reader h2,.peekover-reader h3,
.peekover-reader h4,.peekover-reader h5,.peekover-reader h6{ scroll-margin-top:24px; }
`;

// ============================================================================
// THE data-toc="open" COLUMN MARGIN — recovery B1, the M6 9.1 gate's finding A.
// ============================================================================
// This block is a `.ts` comment ON PURPOSE. The rule it explains lives inside READER_CSS's template
// literal, and comments in THERE ship verbatim in every bundle (diffChrome.ts:41-44 records the
// first 6.2 draft paying ~8 KB of shipped prose for exactly that mistake). The rule itself carries a
// four-line summary; the argument, and the alternatives that were rejected, are here.
//
// ── THE DEFECT ────────────────────────────────────────────────────────────────────────────────
//
// `margin-left` used to stay `auto`, inherited from the base `.peekover-reader{margin:0 auto}`. That
// reads as "still centred", and it is not. `max-width:76ch` + `width:auto` + one auto margin is the
// CSS 2.1 §10.3.3/§10.4 trap: the auto width resolves first, the max-width clamp then makes `width`
// NON-auto, the algorithm re-runs, and the single remaining auto margin absorbs the ENTIRE surplus.
// The column is flung RIGHT, flush against the rail, with the whole gutter dumped on the left —
// measured at ~590px of dead left gutter on the app pane at 1920 CSS-px and ~880px on the full-page
// content-script reader. Shipped since M3 on both surfaces; invisible to every existing test because
// they assert CLEARANCE (does the column avoid the rail — it does) and never CENTRING.
//
// ── THE REJECTED ALTERNATIVE, WHICH STILL BINDS ───────────────────────────────────────────────
//
// The obvious fix is symmetric `margin-left:var(--toc-w)`. It was rejected on MEASURED
// narrow-scrollport grounds, and that rejection is not stale — it is the same constraint the
// one-sided reservation above exists to satisfy. At widths where the rail is open into an already
// squeezed pane, a full rail-width taken off BOTH sides drives the column under its usable measure
// (the contained pane at 414 leaves the reader host 146px — narrower than one pill; see
// diffChrome.ts's NOT-ASSERTED note). A fix that is correct at 1920 and unusable at 414 is not a fix.
//
// ── THE RESOLUTION: HALF THE SURPLUS, FLOORED AT ZERO ─────────────────────────────────────────
//
//   margin-left: max(0px, calc((100% - var(--reader-measure) - var(--toc-w)) / 2))
//
// `100%` is the containing block's width, so the calc is "what is left over once the column has its
// full measure AND the rail has its reservation" — the surplus — halved. Two regimes, and they
// are the two the constraints demand:
//
//   WIDE (surplus > 0): margin-left = surplus/2. The used width clamps to the measure, which over-constrains
//     the box, so §10.3.3 drops `margin-right` and the right gap becomes --toc-w + surplus/2 — i.e.
//     the column sits exactly CENTRED in the space left of the rail, and clears the rail by MORE than
//     the reservation, never less. Centring is a property of the formula here, not a tuned constant.
//   NARROW (surplus <= 0): the floor clamps margin-left to 0px, width resolves to
//     (100% - --toc-w) with no max-width clamp, margin-right is honoured exactly, and the behaviour
//     is BYTE-FOR-BYTE the pre-B1 left-aligned one the narrow-viewport rejection asked for.
//
// ── THE --reader-measure COUPLING (why px, not ch) ────────────────────────────────────────────
//
// 748px IS Literata's 76ch at this sheet's 17px, measured in a real browser under Playwright on both
// engines. It is a px constant in a variable rather than the `ch` unit written twice, and that is a
// MEASURED decision, not a style preference:
//
//   `ch` INSIDE A MARGIN CALC COSTS ~28ms OF FIRST PAINT. The same 76ch in `max-width` is cheap —
//   resolved once and cached — but in a margin computation it pulls font metrics into layout, and
//   layout for the reading column is the first-paint critical path. Measured on the 50 KB typical
//   doc, medians, interleaved against a HEAD control to rule out machine state (A-B-A: the ch form
//   read ~180ms in BOTH the early and the late slot, so the cost tracks the code, not the machine):
//     HEAD (no margin-left at all)      ~160ms
//     margin-left with 76ch             ~182ms   ← the gate breaker
//     margin-left ablated, rest of B1   ~155ms   ← isolates the declaration
//     margin-left with the px measure   ~151ms   ← what ships
//   The <150ms gate's quiesced headroom is ~5ms, so the ch form was not affordable.
//
// THE COUPLING IS STRUCTURAL, NOT DOCUMENTARY. `max-width` and this margin MUST refer to the same
// measure or the centring is silently wrong, and a comment asking a future session to remember that
// is exactly the class of guard that fails. So there is ONE variable, referenced twice, and a
// browser test asserts at runtime that `getComputedStyle(reader).maxWidth` equals the resolved
// `--reader-measure` (diffChrome.browser.test.ts). Change the reader's measure and the variable is
// the ONE site to edit; drift the two apart and the test reds mechanically.
//
// FALLBACK-FONT WINDOW, carried as an honesty note rather than a defect: before Literata loads, the
// fallback's own `ch` may differ, so during that window a true `76ch` column and this px measure
// would disagree slightly. The MAX-WIDTH governs the column's actual width and both forms now use
// the same value, so the column is never mis-sized — only the centring could be off by a few px for
// ~50-100ms. First eye-fixation lands well after font load, so it is invisible in practice; it is
// recorded because "invisible in practice" is a judgement someone may want to revisit.
//
// NO DISCRETE THRESHOLD, and that is why it respects the rejection rather than trading against it:
// the regimes meet continuously at surplus = 0, the width at which the column is exactly the measure with
// the rail reserved. margin-left is 0 on one side of that width and grows from 0 on the other, so
// there is no jump to place, no breakpoint to keep in sync with --toc-w, and a 3.4 resize drag moves
// the crossover automatically because --toc-w is IN the expression.
//
// WHY `/ 2` RATHER THAN THE min(--toc-w, ...) FORM: capping the left margin at one rail-width leaves
// the column left-of-centre the moment the surplus exceeds 2 * --toc-w — at 2560 it would sit 760px
// off centre, which is the same defect class in a smaller size. Halving the surplus has no such
// ceiling and needs no constant beyond the measure the base rule already declares.
//
// ============================================================================
// CONTAINED variant — opt-in via mount(source, host, { contained: true }).
// ============================================================================
// READER_CSS above styles the shadow root as a FULL-PAGE takeover: :host is
// position:fixed; inset:0, and the three chrome pills are position:fixed to the
// viewport corners. That is exactly right for the CONTENT SCRIPT, where the reader
// SHOULD cover the raw markdown document (mountReader also display:none's the page's
// own nodes). It is WRONG for the app page's reader pane, where the same shadow root
// lives inside a shell region — there the full-bleed :host paints OVER the header and
// folder tree, and the fixed pills float at the window's corners.
//
// CONTAINED_CSS is injected as a SECOND <style>, AFTER READER_CSS, ONLY when a caller
// passes { contained: true } (the app-page reader pane; never the content script). It
// undoes exactly the two content-script escapes and nothing else:
//
//   1. :host returns to normal flow (position:relative; inset:auto), so it fills its
//      PANE box instead of pinning to the viewport. Every other :host declaration
//      (background, colour, overflow, typography) is inherited from READER_CSS.
//   2. The chrome pills (mode toggle, theme control, remote-load, network indicator) and the
//      TOC rail switch position:fixed → position:absolute, so they
//      anchor to the now-positioned :host — the pane's corners — keeping their
//      top/right/bottom/left offsets. Switching fixed→absolute (rather than a
//      transform / contain containing-block trick on :host) deliberately SIDESTEPS the
//      known cross-engine quirks with fixed-positioned descendants: an absolutely
//      positioned child of a position:relative ancestor is contained identically in
//      Chromium and Firefox.
//
// Because it lives in a separate string injected only on the opt-in path, READER_CSS —
// and therefore the content script's injected stylesheet — is left byte-for-byte
// unchanged. Its rules come from a later <style> than READER_CSS, so equal-specificity
// declarations (:host, .peekover-mode-toggle, …) win by source order — no !important.
export const CONTAINED_CSS = /* css */ `
:host{ position:relative; inset:auto; }
.peekover-mode-toggle,
.peekover-theme-toggle,
.peekover-watch,
.peekover-watch-note,
.peekover-watch-disclosure,
.peekover-diff-affordance,
.peekover-diff-picker,
.peekover-diff-status,
.peekover-remote-load,
.peekover-net,
.peekover-toc{ position:absolute; }
/* B1 finding 2 — pill into the column's empty top band; remote-load beside it. Why: diffChrome.ts */
.peekover-diff-affordance{ top:12px; }
.peekover-diff-picker,
.peekover-diff-status{ top:50px; }
.peekover-remote-load{ left:176px; }
`;

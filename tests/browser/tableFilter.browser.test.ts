// tableFilter — 008 task 3.1. THIS FILE'S HEADER *IS* THE FILTER'S ENUMERATED PROPERTY SET.
// THERE IS NO ASSERTION BELOW IT YET, AND THAT IS THE POINT.
//
// ══ WHY AN ENUMERATION LANDS BEFORE ANY TABLE-TOOLS TEST EXISTS ════════════════════════════════
//
// M6 retro finding 4 has two halves. The first is an assertion lost in transcription: a suite that
// cites `watchControl` by name borrowed the scoping decision (assert at WIDE) and dropped the
// assertion — every test passed, and the property that should have been tested was absent. The
// second half is the storage panel: no positioning coverage at all, no sibling to transcribe from,
// no baseline. **"The assertion was dropped in transcription" and "there was no sibling to
// transcribe from" are the two ways the same audit fails, and the second is the more dangerous
// because there is nothing to notice missing.** The rule that came out of it: before writing
// coverage for a new piece of chrome, ENUMERATE the property set from every existing sibling suite
// and record each item as present / absent / explicitly out of scope — and *"if no sibling suite
// exists, THAT IS THE SIGNAL."*
//
// ★ THE FILTER IS THAT SIGNAL. plan §3.11 row 24: **no existing control filters anything**, so its
// sibling source column reads NONE. D-12 found the same hole from the other side — `design/
// mockup.html` §s2 has a sort affordance and a copy affordance and **no filter at all** — so there
// is no design precedent either. Rows 12, 15, 17 and 20 are where the filter LANDS on the audit;
// everything else it needs is enumerated FRESH, below.
//
// ★ AND THE ORDER IS THE WHOLE POINT. This set is written BEFORE `tableTools.ts` exists and BEFORE
// its first assertion exists, so 3.7 checks the code against a spec written first. A property set
// written after the code would be a description of the implementation wearing a spec's clothes —
// it would agree with whatever shipped, including the parts that are wrong, and the thing nobody
// built is exactly the thing it would fail to mention. So NOTHING HERE NAMES AN IMPLEMENTATION:
// every entry says WHAT must hold, never HOW. (`hidden` is 3.7's mechanism and is deliberately not
// written into the set; F6 states the checkable property the mechanism has to satisfy.)
//
// ══ THE §3.11 ROUTING — TOOLBAR COLUMN, READ AND CONFIRMED AGAINST THE TREE ════════════════════
//
// Each row's landing task named, and each landing task's own citation footer checked (tasks.md):
//
//   rows 1, 2, 3, 4 (INVERTS), 23 ......... 3.4   [D-6 sites 1–2, D-8; §4 table tools; rows 1,2,3,4,23]
//   rows 5 (INVERTS), 6, 8 ................ 3.5   [D-12; §4 table tools; rows 5, 6, 8; finding 2]
//   rows 11, 15, 16, 17, 18, 19 ........... 3.6   [§3.6, D-12; §4 table tools; rows 11,15,16,17,18,19]
//   rows 12, 15, 16, 20 + ROW 24'S SET .... 3.7   [§3.6; §4 table tools; rows 12, 15, 16, 20, 24]
//   row 16 ................................ 3.8   [D-10, §3.6; §4 table tools + Trust; §3.8; row 16]
//   rows 13, 14 ........................... 3.9   [D-8, D-9; §7-4, §7-8; rows 13, 14]
//   row 2's cost half .................. 3.10 / 4.2   [D-11 (i),(ii); §5; finding 1; row 2] / [row 2]
//   row 22 ............................... 3.11   [row 22; §4 Trust; §5 zero-network; finding 1]
//   rows 1, 23 on the content script ... 4.1 / 4.2   [D-6; §3.7; §4 table tools; rows 1, 23]
//   rows 7, 10 ............................ OUT   the toolbar shares no band; it is deliberately IN flow
//   rows 9, 21 ....................... INACTIVE   gate-2 Q2 ruled TWO BUTTONS, so no task activates them
//
// All ten landing tasks exist in the tree by number, below this one, with matching row citations.
// The gate-2 split added 3.3, 3.4 and 3.5 and moved none of them above 3.1.
//
// ══ ROW 24 — THE FILTER'S PROPERTY SET ═════════════════════════════════════════════════════════
//
// Every entry is CHECKABLE (3.7 can assert it, or name it as unasserted) and DERIVED (it carries
// either its sibling source or an explicit "NO BASELINE — enumerated here" with the requirement it
// comes from). Nothing here is invented, and nothing here is an implementation.
//
// ── A · WHERE THE FILTER IS OFFERED ────────────────────────────────────────────────────────────
//
//  F1  A rendered table WITH A HEADER ROW offers a filter over that table's rows.
//      NO BASELINE — enumerated here. §4: *"When a rendered document contains a table with a header
//      row, the system shall offer per-column sorting, a filter over that table's rows, and
//      copy-out of that table."* Lands: 3.7 (the affordance's structure is 3.4's).
//
//  F2  A table with NO header row is left exactly as rendered and offers NO filter.
//      NO BASELINE — enumerated here. §4 *"shall leave it exactly as rendered"*; §3.8 *"a table that
//      cannot be enhanced … stays exactly the table it is today."* ★ This is a REAL condition, not a
//      formality: `sanitize.ts:36` allows `table/thead/tbody/tr/th/td`, so a hand-written HTML table
//      with no `<thead>` reaches the column from source (plan §0.2). Lands: 3.2 (entry condition).
//
//  F3  A document with NO table grows no filter chrome and adds no listener.
//      SIBLING SOURCE: row 2 (`watchControl:198`; `diffChrome:242`) — *"grows NO chrome where the
//      capability is absent"*, which is also D-11 (ii)'s arm 2. §4: *"When a document contains no
//      table, the system shall add no table chrome and no listener."* Lands: 3.10 / 4.2.
//
//  F4  Each table's filter acts on ITS OWN table. On a two-table document, filtering table 2 hides
//      rows in table 2 and changes nothing in table 1.
//      NO BASELINE FOR THE FILTER — enumerated here; the SHAPE is row 11's (`diagramLightbox:354,
//      429`, the multi-instance case where 007 found this defect class), and row 11 is routed to 3.6
//      for sort. §3.6 ships the filter PER-TABLE. Lands: 3.7.
//
// ── B · WHAT THE FILTER DOES — the half with no sibling anywhere ────────────────────────────────
//
//  F5  The match is over the row's DISPLAYED text. A row matches when what the reader typed occurs
//      in the text the row shows; text that exists only in the source markdown and not on screen
//      (a link's href, an emphasis marker) does not by itself make a row match.
//      NO BASELINE — enumerated here. §3.6: *"Filter matches displayed row text."* The negative half
//      is the checkable consequence of *displayed*. Lands: 3.7 (unit).
//
//  F6  Non-matching rows are HIDDEN, NEVER REMOVED. The same row nodes are still in the table
//      afterwards — asserted on NODE IDENTITY, because a rebuild-and-restore passes a text
//      assertion and fails this one — and they are not rendered.
//      NO BASELINE — enumerated here. §3.6: *"HIDES non-matching rows; it never removes them"*, so
//      that *"clearing the filter is exact rather than a re-render."* Lands: 3.7 (unit).
//
//  F7  Only matching rows are shown. NO BASELINE — enumerated here. §4: *"the system shall show only
//      matching rows."* Lands: 3.7.
//
//  F8  The system says HOW MANY ARE SHOWN OUT OF HOW MANY. The denominator is the table's data
//      rows; the header row is not one of them and is never counted.
//      NO BASELINE — enumerated here. §4: *"shall say how many are shown out of how many."* The
//      header clause is the checkable consequence of *rows*. Lands: 3.7.
//
//  F9  With no filter text, EVERY row is shown and the count says nothing.
//      SIBLING SOURCE for the silent half: row 20 (`diffChrome:651`) — *"polite live region, OUT of
//      the a11y tree while empty."* Lands: 3.7.
//
//  F10 Clearing the filter restores EVERY row, and the table's footprint returns to where it
//      started — asserted as a RECT EQUALITY against the pre-filter measurement, red against a clear
//      that leaves one row hidden.
//      SIBLING SOURCE: row 12 (`storagePanelOverlay:169`) — *"closing returns the slot to zero
//      footprint"*, read for the filter. §4: *"shall restore every row when the filter is cleared."*
//      Lands: 3.7.
//
//  F11 A filter matching NO row shows a DESIGNED EMPTY STATE WITHIN THE TABLE, and never an empty
//      table with no explanation. Checkable as: zero visible data rows ⇒ an explanatory element
//      exists inside that table.
//      NO BASELINE — enumerated here. §4, in terms. Lands: 3.7.
//
//  F12 The table's HEADER stays visible while a filter is active, so the empty state of F11 is read
//      inside a table that still names its columns.
//      NO BASELINE — enumerated here; the checkable consequence of §4's *"within the table"* and
//      *"never … an empty table with no explanation."* Lands: 3.7.
//
// ── C · THE FILTER'S a11y — the four rows row 24 lands on ───────────────────────────────────────
//
//  F13 The count is a POLITE live region, and it is OUT of the a11y tree while empty.
//      SIBLING SOURCE: row 20 (`diffChrome:651`, re-asserted). §5: *"the filter's result count is
//      announced politely."* Lands: 3.7.
//
//  F14 The filter's state is in TEXT — never colour alone, never an icon alone.
//      SIBLING SOURCE: row 15 (`watchControl:310`). Lands: 3.7.
//
//  F15 The clear control is a REAL `<button>`, keyboard-operable, with no `tabindex` of its own; the
//      filter's own field is reachable the same way.
//      SIBLING SOURCE: row 16 (`watchControl:339`; `themeControl:260`) — D-12 divergence 1, which
//      turned the mockup's `onclick` on a bare `<th>` into a real button. Lands: 3.7 (row 16 also
//      routes to 3.6 and 3.8 for the other controls).
//
//  F16 Accessible names carry SELECTION AND ACTION and move with the state — the field names the
//      table it filters, the clear control names what it clears, and neither is identified by
//      position alone.
//      SIBLING SOURCE: row 17 (`themeControl:250`). Lands: 3.7 (row 17 routes to 3.6 for sort).
//
//  F17 Every filter action is reachable BY KEYBOARD, and the filter adds NO new global single-key
//      shortcut. (The negative half is not decoration: a global single-key shortcut and a text field
//      the reader types into are the same keystroke.)
//      NO BASELINE for the negative half — enumerated here. §4, both clauses. Lands: 3.6 asserts the
//      shortcut clause for the toolbar; 3.7 for the field.
//
//  F18 CONDITIONAL — only if a transition ships with the filter: instant under
//      `prefers-reduced-motion`, AND it DOES animate without it (the second half is what makes the
//      first non-vacuous).
//      SIBLING SOURCE: row 19 (`watchControl:358,694,709`). Lands: 3.6.
//
// ── D · THE FILTER IN THE PAGE'S LIFECYCLE ─────────────────────────────────────────────────────
//
//  F19 Filter state deliberately does NOT survive a re-render. After a watch re-render that changes
//      the source, no row is hidden and no stale filter text remains — the degradation is to
//      "unfiltered", never to "the wrong rows shown from the new source".
//      SIBLING SOURCE: row 13's INVERSE (`watchControl:236` asserts a host attribute that survives;
//      D-9 asserts that this state does not). §7-4; §6 *"decided per-render for now."* Lands: 3.9.
//
//  F20 After a re-render the filter's handlers reach the CURRENT table, not the destroyed one.
//      SIBLING SOURCE: row 14 (`watchControl:251,278`) — closure death; the signature of the defect
//      is a control that mutates nothing. Lands: 3.9.
//
//  F21 The filter does not reach the DIFF view or the RAW view. Both are siblings of the reading
//      column, and a diff's hunks can contain real tables — the product's own spec-v1-vs-spec-v2
//      example does.
//      SIBLING SOURCE: row 4, INVERTED (the toolbar is INSIDE `.peekover-reader`, so the scope is
//      the column, not the shadow root); D-8. Lands: 3.2 (unit half) / 3.9 (real-engine half).
//
// ── E · THE FILTER'S CONTRACT WITH THE OTHER TWO TOOLS ─────────────────────────────────────────
//
//  F22 Copy-out reads the rows CURRENTLY SHOWN, IN THE ORDER CURRENTLY SHOWN — a row the filter hid
//      is absent from the copied output. The filter's half of the contract is that its result is
//      expressed in the visible-row set copy reads.
//      NO BASELINE — enumerated here. §4: *"the system shall copy the rows currently shown, in the
//      order currently shown"*; §3.6: *"a copy that silently disagrees with what is visible is a
//      wrong answer that looks right."* Lands: 3.8 (enumerated here because it is a property OF the
//      filter that another task asserts).
//
//  F23 SORT AND FILTER COMPOSE. Filtering a sorted table leaves the sort's order among the rows
//      still shown; sorting a filtered table un-hides no hidden row and loses no hidden row.
//      NO BASELINE — enumerated here, and NO TASK'S VERIFY CURRENTLY NAMES IT. §3.6 makes both
//      operations node operations over the same `<tr>`s (*"Sorting is reordering `<tr>` nodes,
//      filtering is hiding them"*), which is what makes their composition a real property rather
//      than an assumption. ★ This entry is what an enumeration is FOR: it is the property that has
//      no sibling, no mockup and no Verify clause, and it is therefore the one nothing would have
//      noticed missing. Lands: NOWHERE YET — 3.7 either asserts it or NAMES it as unasserted.
//
// ── F · TRUST ──────────────────────────────────────────────────────────────────────────────────
//
//  F24 The filter makes NO network request — proven at the REQUEST level on both engines, with a
//      control that fires under the same conditions the negative claim disclaims.
//      SIBLING SOURCE: row 22 (`remoteMedia:83-92,120,140`, the `/^https?:/i` predicate verbatim).
//      ★ jsdom cannot see bytes on the wire, and a control routed through a sanitizer reads NO-FETCH
//      while the route is wide open. Lands: 3.11 (sort → filter → copy).
//
//  F25 The filter introduces NO HTML STRING. Hiding a row is a node operation on already-sanitized
//      nodes, and every node the filter creates is built as DOM. Nothing re-enters the sanitizer.
//      NO ROW — enumerated here. §5 Trust; AGENTS.md #3. Lands: 3.7.
//
//  F26 A filter action that FAILS says so and leaves the table readable.
//      SIBLING SOURCE for the announcement: row 20's second half (*"any action-failure message"*).
//      §4: *"If a table action fails, then the system shall say so and shall leave the table
//      readable"*; §3.8. Lands: 3.7.
//
// ══ WHAT THIS SET DELIBERATELY DOES NOT DECIDE ═════════════════════════════════════════════════
//
//  · §8-2's per-table-vs-per-document question. The set states PER-TABLE because §3.6 decided it;
//    the scope question is MEASURED at 5.2 and CHOSEN at 5.5, and F4 is written so that a change of
//    scope would change the property rather than be smuggled past it.
//  · §8-3's threshold below which a table grows no tools. No entry assumes a minimum row count.
//  · The toolbar's GEOMETRY. Containment and the measure are rows 5, 6 and 8, routed to 3.5 for the
//    toolbar as a whole; they are not re-enumerated per control.
//  · Any mechanism. No attribute, element, class, selector or algorithm is named. The one place this
//    set gets specific — F6's node identity — is specific about the OBSERVATION, not the mechanism,
//    because "never removes them" has no other checkable form.
//
// ══ HOW THIS SET IS DISCHARGED ═════════════════════════════════════════════════════════════════
//
// 3.7 writes the first assertion in this file, and its report checks this set off PROPERTY BY
// PROPERTY. ★ Any property enumerated here and not asserted there is NAMED, not dropped — an
// enumeration that quietly loses an entry is finding 4 happening again, one rung further up.

# Retro log — Peekover
- **2026-07-11 · Naming.** Lesson: semi-descriptive compounds get independently reinvented; a
  "clean" verdict without checking Apple App Store + Google Play is not a verdict. Fix shipped:
  8-surface checklist is now mandatory for any name (see names.md in design archive).
- **2026-07-10 · CSS shorthand bug class.** `padding: 0 X` on a shared class silently zeroed
  section rhythm site-wide. Fix: `padding-inline`/`padding-block` only on shared utility classes;
  grep for shorthand overrides when layouts misbehave. (Cost: several review cycles.)

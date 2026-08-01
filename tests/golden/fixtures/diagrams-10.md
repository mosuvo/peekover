# Diagram load fixture - 10 fences

★ **WALK MATERIAL, NOT A TEST INPUT.** Nothing asserts against this file. It exists so the
9.1 gate-3 walk can open a real document at this scale and judge D-11's placeholder question
(spec 007 §8-4) on real Chromium and real Firefox, which no harness reaches. Produced by task
8.3; see `docs/ai/progress.md` § THE D-11 PLACEHOLDER RECORD for what to look for.

Every fence below is textually UNIQUE. That is deliberate and load-bearing: the diagram cache
keys on the fence source, so repeated fences would resolve from cache after the first and the
walk would see a document far faster than any real one.

## Section 1 - flowchart

Prose ahead of the fence, so the walk sees a reading column with text in it rather than a
wall of diagrams. The enhancement is post-paint (007 §3.3): this paragraph is on screen
before the engine has loaded, and the fence below is still a source fence at that instant.

```mermaid
flowchart TD
  A1[Ingest batch 1] --> B1{Schema valid?}
  B1 -- yes --> C1[Normalize]
  B1 -- no --> D1[Quarantine]
  C1 --> E1[(Store)]
```

Prose after the fence, so the figure lands between two blocks of text and its margins can
be judged in flow.

## Section 2 - sequence

Prose ahead of the fence, so the walk sees a reading column with text in it rather than a
wall of diagrams. The enhancement is post-paint (007 §3.3): this paragraph is on screen
before the engine has loaded, and the fence below is still a source fence at that instant.

```mermaid
sequenceDiagram
  participant U as Reader
  participant P as Pipeline 2
  participant E as Engine
  U->>P: open document 2
  P->>E: render fence
  E-->>P: svg
  P-->>U: figure 2
```

Prose after the fence, so the figure lands between two blocks of text and its margins can
be judged in flow.

## Section 3 - class

Prose ahead of the fence, so the walk sees a reading column with text in it rather than a
wall of diagrams. The enhancement is post-paint (007 §3.3): this paragraph is on screen
before the engine has loaded, and the fence below is still a source fence at that instant.

```mermaid
classDiagram
  class Stage3 {
    +string id
    +run() Result
  }
  class Result3 {
    +bool ok
    +string detail
  }
  Stage3 --> Result3 : produces
```

Prose after the fence, so the figure lands between two blocks of text and its margins can
be judged in flow.

## Section 4 - state

Prose ahead of the fence, so the walk sees a reading column with text in it rather than a
wall of diagrams. The enhancement is post-paint (007 §3.3): this paragraph is on screen
before the engine has loaded, and the fence below is still a source fence at that instant.

```mermaid
stateDiagram-v2
  [*] --> Pending4
  Pending4 --> Rendered4 : svg adopted
  Pending4 --> Failed4 : engine threw
  Rendered4 --> [*]
  Failed4 --> [*]
```

Prose after the fence, so the figure lands between two blocks of text and its margins can
be judged in flow.

## Section 5 - er

Prose ahead of the fence, so the walk sees a reading column with text in it rather than a
wall of diagrams. The enhancement is post-paint (007 §3.3): this paragraph is on screen
before the engine has loaded, and the fence below is still a source fence at that instant.

```mermaid
erDiagram
  DOCUMENT5 ||--o{ FENCE5 : contains
  FENCE5 ||--|| FIGURE5 : produces
  FIGURE5 }o--|| THEME5 : "keyed by"
```

Prose after the fence, so the figure lands between two blocks of text and its margins can
be judged in flow.

## Section 6 - gantt

Prose ahead of the fence, so the walk sees a reading column with text in it rather than a
wall of diagrams. The enhancement is post-paint (007 §3.3): this paragraph is on screen
before the engine has loaded, and the fence below is still a source fence at that instant.

```mermaid
gantt
  title Enhancement pass 6
  dateFormat YYYY-MM-DD
  section Fence 6
  parse     :p6, 2026-08-01, 1d
  sanitize  :s6, after p6, 1d
  adopt     :a6, after s6, 1d
```

Prose after the fence, so the figure lands between two blocks of text and its margins can
be judged in flow.

## Section 7 - pie

Prose ahead of the fence, so the walk sees a reading column with text in it rather than a
wall of diagrams. The enhancement is post-paint (007 §3.3): this paragraph is on screen
before the engine has loaded, and the fence below is still a source fence at that instant.

```mermaid
pie title Fence mix, section 7
  "flowchart" : 30
  "sequence" : 25
  "other" : 45
```

Prose after the fence, so the figure lands between two blocks of text and its margins can
be judged in flow.

## Section 8 - flowchart

Prose ahead of the fence, so the walk sees a reading column with text in it rather than a
wall of diagrams. The enhancement is post-paint (007 §3.3): this paragraph is on screen
before the engine has loaded, and the fence below is still a source fence at that instant.

```mermaid
flowchart TD
  A8[Ingest batch 8] --> B8{Schema valid?}
  B8 -- yes --> C8[Normalize]
  B8 -- no --> D8[Quarantine]
  C8 --> E8[(Store)]
```

Prose after the fence, so the figure lands between two blocks of text and its margins can
be judged in flow.

## Section 9 - sequence

Prose ahead of the fence, so the walk sees a reading column with text in it rather than a
wall of diagrams. The enhancement is post-paint (007 §3.3): this paragraph is on screen
before the engine has loaded, and the fence below is still a source fence at that instant.

```mermaid
sequenceDiagram
  participant U as Reader
  participant P as Pipeline 9
  participant E as Engine
  U->>P: open document 9
  P->>E: render fence
  E-->>P: svg
  P-->>U: figure 9
```

Prose after the fence, so the figure lands between two blocks of text and its margins can
be judged in flow.

## Section 10 - class

Prose ahead of the fence, so the walk sees a reading column with text in it rather than a
wall of diagrams. The enhancement is post-paint (007 §3.3): this paragraph is on screen
before the engine has loaded, and the fence below is still a source fence at that instant.

```mermaid
classDiagram
  class Stage10 {
    +string id
    +run() Result
  }
  class Result10 {
    +bool ok
    +string detail
  }
  Stage10 --> Result10 : produces
```

Prose after the fence, so the figure lands between two blocks of text and its margins can
be judged in flow.

<!-- Covers: remote (https) images and relative images.
     REMOTE-RESOURCE ANCHOR (task 5.1): this snapshot captures the CURRENT behavior —
     image src passes through the sanitize allow-list unchanged (http/https src is
     permitted; blocking remote loads is a later RENDER-LAYER policy, not a sanitize
     strip — see decisions.md 2026-07-14 "Remote resources are BLOCKED by default").
     When that policy lands, the diff against THIS snapshot documents the change. -->

# Images

Remote image: ![a remote picture](https://example.com/pic.png "remote title").

Relative image: ![a local diagram](./assets/diagram.png).

An inline ![tiny badge](https://example.com/badge.gif) inside a sentence.

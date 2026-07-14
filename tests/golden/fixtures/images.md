<!-- Covers: remote (https) images and a relative image, through the REMOTE-RESOURCE
     POLICY (now landed). The snapshot in output/images.html is produced by the full
     reader path — parse -> sanitize -> applyMediaPolicy against a file:// base URL —
     so it shows the policy's real output: the two https images are BLOCKED (src moved
     to data-peekover-src, the <img> swapped for an inert themed placeholder that
     cannot fetch), and the ./assets relative image is LOCAL on a file:// page so it
     survives with loading="lazy". Sanitize still permits http/https src on the allow-
     list; blocking is a render-LAYER decision, not a sanitize strip (decisions.md
     2026-07-14 "Remote resources are BLOCKED by default"). -->

# Images

Remote image: ![a remote picture](https://example.com/pic.png "remote title").

Relative image: ![a local diagram](./assets/diagram.png).

An inline ![tiny badge](https://example.com/badge.gif) inside a sentence.

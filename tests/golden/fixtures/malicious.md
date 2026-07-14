<!-- Covers a full markdown DOCUMENT carrying attacks, exercised through the entire
     parse -> sanitize path (complements the unit-level MALICIOUS_CASES which feed
     sanitize() directly). Every live vector below MUST be inert in the snapshot:
     no <script>, no on* handler, no javascript:/data: URL, no <svg>/<iframe>. Benign
     surrounding text must survive. -->

# Document with attacks

A normal paragraph before the attacks.

<script>alert('xss')</script>

<img src="x" onerror="alert(1)">

A [javascript link](javascript:alert(2)) and a [data link](data:text/html,<script>alert(3)</script>).

<svg onload="alert(4)"><circle r="10" /></svg>

<iframe src="https://evil.example/frame"></iframe>

A normal paragraph after the attacks.

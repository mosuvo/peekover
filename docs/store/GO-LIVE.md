# Going live — Peekover 0.1.0

*M13 task 7.6 (plan §9 note 7). Written by M13, run by the human on release day, after M13 closes. Tick each box when
its **Check** is seen. If a **Check** fails, follow **If it fails** and stop there: never skip ahead.*

How each step is written:

- **Do** — what to do.
- **Where** — the exact page and button, or the exact command (run commands in Git Bash, in `D:\Dev\peekover`).
- **Check** — what you should see when it worked. That is the evidence: write it in the "Done" note.
- **If it fails** — what to do instead.

Facts about Peekover cite the file or record they come from. Facts about GitHub and the stores cite their own docs,
read on 2026-11-06; if a page now says something different, the page wins — note the difference and carry on only if
it does not change the step.

**Edge Add-ons is DEFERRED (HUMAN RULING 2026-11-11).** The Edge Add-ons listing is not part of the v0.1.0 launch:
Edge's developer registration publishes a postal address; revisit after launch. Peekover still supports Edge (the
Chromium build; Edge users can install it from the Chrome Web Store). Steps marked **DEFERRED** below are skipped on
release day and kept, unticked, for the later Edge submission, with `docs/store/edge.md` and the `edge-*.png`
screenshots in `docs/store/assets/` (`docs/ai/progress.md`, POST-RELEASE).

---

## 0 · Gates — do not start until every box here is ticked

- [ ] **0.1 The design walk is done.**
  - **Do:** open `specs/013-first-release/tasks.md` and find task 8.1.
  - **Check:** 8.1 is ticked `[x]`, and every "fix" it found is a ticked discovered task.
  - **If it fails:** stop. Go-live comes after the walk (tasks.md, group 8).
- [ ] **0.2 Group 9 is done: the site, the truth re-check, the screenshots, the retro, the records.**
  - **Check:** 9.1, 9.2, 9.3, 9.4 and 9.5 are all ticked in tasks.md, and `docs/ai/progress.md` says M13 is closed.
  - **Check:** the release blocker is cleared — the setup guide's Firefox sentence and README row 26 agree and are both
    true (`docs/ai/progress.md`, "FOR M13 TASK 9.2").
  - **Check:** `docs/store/assets/` holds the screenshot picks (9.3), at least one at 1280×800 (`tests/storeScreenshots.test.ts`).
  - **If it fails:** stop. Chrome cannot be submitted without a screenshot (Chrome Web Store, [Store listing
    tab](https://developer.chrome.com/docs/webstore/cws-dashboard-listing): "At least one 1280x800 px screenshot").
- [ ] **0.3 CI is green on the commit you will release.**
  - **Do:** push `main` if it is not pushed, then run:
    `gh run list --branch main --limit 4`
  - **Check:** the newest commit (`git log -1 --format=%h`) shows **CI** and **Supply chain** both `completed success`.
  - **If it fails:** stop. A red run is a task for an agent session before release.
- [ ] **0.4 No known advisory.**
  - **Where:** `pnpm audit --prod`
  - **Check:** it ends with no vulnerabilities found (exit 0).
  - **If it fails:** stop; a dependency bump is an agent task (the M12 retro's rule, AGENTS.md).
- [ ] **0.5 The "under 7 MB" sentence still holds.** The site says "The whole extension is under 7 MB." (ledger row 110),
  and a guard fails above 6,900,000 B (9.2, HUMAN RULING 2026-11-11). CI runs the unit tests before it builds, so run
  the guard here, on the release commit.
  - **Where:** `pnpm build && pnpm exec wxt build -b firefox && pnpm exec vitest run --project unit tests/extensionSize.test.ts`
  - **Check:** 4 tests pass, none skipped (a skip means `.output` was not built).
  - **If it fails:** stop; trimming the build or re-wording the sentence is an agent task, with your approval.

## 1 · Accounts — can be done days before release day

- [ ] **1.1 Two-factor authentication on GitHub.**
  - **Where:** GitHub → your picture → **Settings** → **Password and authentication** → **Enable two-factor
    authentication** ([GitHub docs](https://docs.github.com/en/authentication/securing-your-account-with-two-factor-authentication-2fa/configuring-two-factor-authentication)).
  - **Check:** the page shows two-factor authentication as enabled; the recovery codes are saved somewhere safe.
  - **If it fails:** follow the GitHub page above; do not go public without it.
- [ ] **1.2 Commit email for new commits.**
  - **Why:** the history scan (`docs/ai/decisions.md`, "M13 TASK 7.6") found your personal email on 474 commits. You
    ruled "Proceed as is". New commits can use GitHub's private address instead.
  - **Do:** in `D:\Dev\peekover`, run `git config user.email "93656238+mosuvo@users.noreply.github.com"` (the address
    already on 19 of the repository's commits). Optionally tick **Keep my email addresses private** at GitHub →
    **Settings** → **Emails**.
  - **Check:** `git config user.email` prints the noreply address.
  - **Note:** this does not change past commits ([GitHub docs](https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-personal-account-on-github/managing-email-preferences/setting-your-commit-email-address):
    "Any commits you made prior to changing your commit email address are still associated with your previous email
    address").
- [ ] **1.3 Verify peekover.dev with GitHub (protects the domain from takeover).**
  - **Where:** GitHub → your picture → **Settings** (your profile, not the repository) → **Pages** → **Add a domain** →
    enter `peekover.dev` → **Add domain**. Add the TXT record it shows at your DNS provider, then click **Verify**
    ([GitHub docs](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages)).
  - **Check:** `dig _github-pages-challenge-mosuvo.peekover.dev +nostats +nocomments +nocmd TXT` shows the record, and
    the Pages settings list `peekover.dev` as verified. Leave the TXT record in place.
  - **If it fails:** DNS can take up to 24 hours; come back later and use **⋯** → **Continue verifying**.
- [ ] **1.4 Chrome Web Store developer account.**
  - **Where:** the [Chrome Web Store developer dashboard](https://chrome.google.com/webstore/devconsole): agree to the
    developer agreement, then pay the one-time registration fee
    ([Chrome docs](https://developer.chrome.com/docs/webstore/register); the amount is shown at payment).
    Choose the publishing email carefully: the docs say it cannot be changed later.
  - **Also:** turn on 2-Step Verification on that Google account — "required for all developer accounts prior to
    publishing an extension" ([Chrome policy](https://developer.chrome.com/docs/webstore/program-policies/two-step-verification)).
  - **Check:** the dashboard opens with **Add new item**, and the Google account shows 2-Step Verification on.
  - **If it fails:** registration is limited to some countries and regions (the register page); if blocked, skip
    Chrome and note it.
- [ ] **1.5 Firefox Add-ons (AMO) account.**
  - **Where:** [addons.mozilla.org Developer Hub](https://addons.mozilla.org/developers/) with a Mozilla account
    ([Extension Workshop](https://extensionworkshop.com/documentation/publish/submitting-an-add-on/); no fee is
    mentioned there).
  - **Also:** turn on two-factor authentication on the Mozilla account; AMO has required it for extension developers
    since 15 March 2021 ([Mozilla Add-ons blog](https://blog.mozilla.org/addons/2021/03/11/two-factor-authentication-required-for-extension-developers)).
    Save the recovery codes: Mozilla cannot restore a locked-out account (same post).
  - **Check:** the Developer Hub shows **Submit a New Add-on**.
- [ ] **1.6 Microsoft Edge Add-ons (Partner Center) account.** **DEFERRED** (HUMAN RULING 2026-11-11, top of this
  file) — skip on release day; do not register yet.
  - **Where:** [Partner Center](https://partner.microsoft.com/dashboard/microsoftedge/public/login) with a Microsoft
    account → **Microsoft Edge Developer Account Registration** → account type **Individual** → publisher display name
    → contact info → **I accept the terms and conditions** → **Finish**. "There is no registration fee"
    ([Microsoft docs](https://learn.microsoft.com/en-us/microsoft-edge/extensions/publish/create-dev-account)).
    Country and account type cannot be changed after enrollment (same page).
  - **Also:** turn on two-step verification on the Microsoft account (recommended; the Edge docs do not require it).
  - **Check:** **Open Account Settings** shows the enrollment verified (you get a confirmation email).
  - **If it fails:** the same page's "If account verification is delayed" section.

## 2 · The repository goes public

*Accepted (HUMAN COPY APPROVAL, 2026-11-11, 9.2): from step 2.2 until section 3 puts the site live, the public
repository's SECURITY.md names a privacy policy URL that does not open yet. These are minutes, not days: go
straight on to section 3.*

- [ ] **2.1 The history scan's ruling stands.**
  - **Check:** `docs/ai/decisions.md`, "M13 TASK 7.6": scan done with gitleaks 8.30.1, no secrets; your ruling
    "Proceed as is". Commits have landed since (groups 8 and 9), so ask an agent session to run the same scan again on
    the release commit (the command is in that record).
  - **Check:** the re-run reports no leaks.
  - **If it fails:** stop; do not make the repository public. A secret in history must be revoked at its source first.
- [ ] **2.2 Make the repository public.**
  - **Where:** github.com/mosuvo/peekover → **Settings** → **Danger Zone** → **Change visibility** → **Make public** →
    confirm the name → **I have read and understand these effects** → **Make this repository public**
    ([GitHub docs](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings/setting-repository-visibility)).
  - **Know first (same page):** the code, every branch, and Actions history and logs become visible to everyone;
    anyone can fork it.
  - **Check:** in a private browser window (signed out), https://github.com/mosuvo/peekover opens.
  - **If it fails:** sign-out check shows 404 → wait a minute and reload; still 404 → re-check the setting.
- [ ] **2.3 Turn on private vulnerability reporting.**
  - **Where:** repository → **Settings** → **Advanced Security** → **Private vulnerability reporting** → **Enable**
    ([GitHub docs](https://docs.github.com/en/code-security/security-advisories/working-with-repository-security-advisories/configuring-private-vulnerability-reporting-for-a-repository)).
  - **Check:** signed out (or as another account), https://github.com/mosuvo/peekover/security/advisories shows a
    **Report a vulnerability** button. This is the channel SECURITY.md names (ledger row #46).
  - **If it fails:** stop before the stores: SECURITY.md would promise a channel that does not exist.

## 3 · The website goes live (peekover.dev)

*Order matters: GitHub says to add the domain to GitHub before pointing DNS at it, so no one else can claim it
([GitHub docs](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)).
Pages works on public repositories only on this plan, so this comes after step 2 (`docs/ai/decisions.md`, "M13 TASK
7.4").*

- [ ] **3.1 Pages publishes from GitHub Actions.**
  - **Where:** repository → **Settings** → **Pages** → **Build and deployment** → **Source** → **GitHub Actions**
    ([GitHub docs](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)).
    Do not pick a template: Peekover's workflow is `.github/workflows/pages.yml`.
  - **Check:** the Source reads "GitHub Actions".
- [ ] **3.2 Run the Pages workflow.**
  - **Where:** `gh workflow run pages.yml --ref main`, then `gh run watch` (or Actions → **Pages** → **Run workflow**
    → branch `main`). It runs only by hand and only from `main` (`.github/workflows/pages.yml`).
  - **Check:** the run is green and its **deploy** step shows a page URL.
  - **If it fails:** open the failed run's log; a red run is an agent task. Do not change DNS yet.
- [ ] **3.3 Set the custom domain.**
  - **Where:** repository → **Settings** → **Pages** → **Custom domain** → `peekover.dev` → **Save**. No `CNAME`
    file is needed with a custom workflow — GitHub ignores one ([GitHub docs](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)).
  - **Check:** the field keeps `peekover.dev` after a reload.
- [ ] **3.4 Point DNS at GitHub Pages.**
  - **Where:** your DNS provider for peekover.dev. Remove any default records the provider added for the bare domain,
    then add (same GitHub page):
    - `A` records, host `@`: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
    - `AAAA` records, host `@`: `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`,
      `2606:50c0:8003::153`
    - `CNAME` record, host `www` → `mosuvo.github.io` (GitHub then redirects between the two)
    - Never a wildcard record (`*.peekover.dev`) — GitHub calls it an "immediate risk of domain takeovers".
  - **Check:** `dig peekover.dev +noall +answer -t A` and `-t AAAA` list exactly the addresses above (on Windows
    without `dig`: `Resolve-DnsName peekover.dev` in PowerShell). DNS can take up to 24 hours.
  - **If it fails:** wait; then re-check the records for typos.
- [ ] **3.5 Enforce HTTPS.**
  - **Where:** repository → **Settings** → **Pages** → tick **Enforce HTTPS** (it can take up to 24 hours to become
    available — same GitHub page).
  - **Check:** `http://peekover.dev` redirects to `https://peekover.dev`, and the browser shows a valid certificate.
- [ ] **3.6 Every "live at release" URL resolves.**
  - **Do:** open each URL below signed out (a private window). Each must open the right page, over HTTPS, with no
    404. The rows are every "live at release" row in `docs/store/claims.md`; `tests/truthPins.test.ts` checks that
    this table names all of them.

    | URL or channel | What "good" looks like | Ledger rows |
    |---|---|---|
    | https://peekover.dev | The Peekover site | #465, #508, #542 |
    | https://peekover.dev/privacy/ | The privacy policy, the same text as `docs/trust/PRIVACY.md` | #339, #463, #475, #506, #510, #540, #552, #617 |
    | https://github.com/mosuvo/peekover | The repository, signed out | #63, #64, #187, #196, #464, #507, #541 |
    | https://github.com/mosuvo/peekover#build-from-source | The README, scrolled to "Build from source" | #70 |
    | https://github.com/mosuvo/peekover/blob/main/docs/trust/SECURITY.md | SECURITY.md | #197 |
    | https://github.com/mosuvo/peekover/blob/main/docs/trust/PERMISSIONS.md | PERMISSIONS.md | #198 |
    | https://github.com/mosuvo/peekover/blob/main/docs/trust/PRIVACY.md | PRIVACY.md (linked from the privacy page's footer, 9.1) | #554 |
    | https://github.com/mosuvo/peekover/releases | The releases page (empty until step 5) | #199 |
    | https://github.com/mosuvo/peekover/issues | The issues page, with **New issue** | #200, #373, #466, #509, #543 |
    | https://chromewebstore.google.com/detail/peekover/bcfjejemkkoklbplcgfccboipmgiokpc | Peekover's Chrome Web Store listing, Public (added at 8.2, after 8.1) | #63, #64, #70, #187 |
    | Private vulnerability reporting | **Report a vulnerability** on the Advisories page (step 2.3) | #46 |
    | Issues open to anyone | **New issue** works when signed in as an account that is not yours | #48, #373 |

  - **Check:** every row opened as described. Write "all resolved, <date>" in the Done note.
  - **If it fails:** a site URL → re-run step 3.2, then check `site/`; a GitHub URL → check step 2.2. Do not submit to
    any store until every row passes: Edge requires the privacy policy URL to be reachable
    ([Microsoft docs](https://learn.microsoft.com/en-us/microsoft-edge/extensions/publish/publish-extension), "Ensure
    that the policy URL can be accessed").

## 4 · The email address (optional, decides two later fields)

- [ ] **4.1 Test `hello@peekover.dev`.**
  - **Do:** from another account, send a message to `hello@peekover.dev` (it relies on your registrar's forwarding —
    plan §9 note 1).
  - **Check:** it arrives within an hour.
  - **If it arrives:** decide the email edit — the plan makes it a second security channel and the contact address
    (plan §9 note 1, "a two-file edit"). That is an agent task: today `tests/truthPins.test.ts` forbids the address on
    every surface, so the edit changes the tests and the ledger with the files. Until that lands, the address stays
    out of every listing.
  - **If it does not arrive:** nothing changes. AMO's support email stays empty and Edge's support contact stays the
    issues URL (`docs/store/firefox.md`, `docs/store/edge.md`, submission notes).

## 5 · The release (v0.1.0)

- [ ] **5.1 Tag the release commit and push the tag.**
  - **Do:** on an up-to-date `main` whose CI is green (step 0.3):

    ```
    git switch main
    git pull --ff-only
    git tag -a v0.1.0 -m "Peekover 0.1.0"
    git push origin v0.1.0
    ```

  - **Check:** `gh run list --workflow release.yml --limit 1` shows a new **Release** run for `v0.1.0`. The workflow
    fails at once if the tag is not `v` + the version in `package.json` (`.github/workflows/release.yml`, "Check the tag
    equals package.json's version"); the version is 0.1.0 (`CHANGELOG.md`, ledger).
  - **If it fails:** a wrongly named or misplaced tag: `git push origin :refs/tags/v0.1.0`, `git tag -d v0.1.0`, then
    tag again.
- [ ] **5.2 The release run is green, with attestations.**
  - **Where:** `gh run watch` on that run (or Actions → **Release**).
  - **Check:** three jobs green — **Build, test and package**, **Attest the release files (public repository only)**
    (it must RUN, not be skipped — the repository is public now) and **Create the draft release**. The build job's
    summary lists the SHA-256 of each file and the line `REPRODUCIBLE` (`.github/workflows/release.yml`). From
    0.1.1, a fourth job, **Upload to the Chrome Web Store and submit for review**, then waits for your approval (10.2),
    and `gh run watch` keeps waiting until you approve or reject it.
  - **If it fails:** attest skipped → the repository is still private (step 2.2). Anything else red → stop; an agent
    task. Delete the draft release if one was made (step 9.4) before re-tagging.
- [ ] **5.3 Download the draft release and check every file.**
  - **Do:**

    ```
    mkdir -p ~/peekover-v0.1.0 && cd ~/peekover-v0.1.0
    gh release download v0.1.0 --repo mosuvo/peekover
    sha256sum -c SHA256SUMS
    ```

    (or open the draft on the Releases page and download each file by hand.)
  - **Check:** five files besides `SHA256SUMS` — `peekover-0.1.0-chrome.zip`, `peekover-0.1.0-firefox.zip`,
    `peekover-0.1.0-sources.zip`, `sbom.cdx.json`, `THIRD_PARTY_LICENSES.txt` — and every line of `sha256sum -c` says
    `OK`. The sums match the ones in step 5.2's run summary, which came from the clean-clone comparison
    (`.github/workflows/release.yml`; `docs/trust/REPRODUCING.md`).
  - **If it fails:** any `FAILED` → do not publish; delete the draft (step 9.4) and stop.
- [ ] **5.4 Verify the attestation of each file.**
  - **Do:** in the same folder, for each file:

    ```
    for f in *.zip sbom.cdx.json THIRD_PARTY_LICENSES.txt; do gh attestation verify "$f" --repo mosuvo/peekover || echo "FAILED: $f"; done
    ```

    ([GitHub CLI manual](https://cli.github.com/manual/gh_attestation_verify)).
  - **Check:** each file verifies, and no `FAILED:` line is printed.
  - **If it fails:** do not publish; stop (SECURITY.md and REPRODUCING.md promise attestations from the first public
    release — plan §9 note 4).
- [ ] **5.5 Publish the release.**
  - **Do:** `gh release edit v0.1.0 --repo mosuvo/peekover --draft=false`
    ([GitHub CLI manual](https://cli.github.com/manual/gh_release_edit)) — or on the draft's page, **Edit** →
    **Publish release**. Paste the 0.1.0 section of `CHANGELOG.md` into the notes first if you want it on the page.
  - **Check:** signed out, https://github.com/mosuvo/peekover/releases shows **Peekover 0.1.0** with its files.

## 6 · Before each store: read the dashboard against the files

- [ ] **6.1 Compare the wording.** Each store's data and certification questions were written from the stores'
  public docs (`docs/ai/decisions.md`, "M13 TASK 7.5"). On each dashboard, read the real question text against the
  listing file before answering.
  - **Check:** the questions match `docs/store/chrome.md` and `docs/store/firefox.md` (and `docs/store/edge.md` when
    the deferred Edge submission happens).
  - **If it fails:** a question asks something the file does not answer, or its wording changes the answer → stop
    that store and bring it to an agent session to re-check the file. Do not improvise an answer about data.
- [ ] **6.2 Edge: the data-usage answer against Edge's own form.** **DEFERRED** (HUMAN RULING 2026-11-11, with 7.3)
  — skip on release day. `docs/store/edge.md`'s Data usage text (ledger row
  549) was written from the Chrome Web Store's user-data FAQ, not from Partner Center (9.2 sign-off, flag 8).
  - **Where:** Partner Center → the extension → **Privacy** → Data usage.
  - **Check:** Partner Center offers a "Website content" choice and the certifications that `docs/store/edge.md` says
    are ticked, in words that keep its answer true.
  - **If it fails:** stop the Edge submission and bring the form's exact wording to an agent session.
- [ ] **6.3 Edge: the category exists.** **DEFERRED** (HUMAN RULING 2026-11-11, with 7.3) — skip on release day.
  `docs/store/edge.md` proposes **Productivity** (ledger row 515), not yet seen
  in Partner Center.
  - **Check:** **Productivity** is in Partner Center's category list.
  - **If it fails:** pick the nearest category, carry on, and note it for an agent to update `docs/store/edge.md`.
- [ ] **6.4 AMO: the summary is still within 250 characters.** The Firefox summary (ledger row 477) is 247 of 250
  characters (9.2 sign-off, flag 8).
  - **Do:** only if the summary was edited after 2026-11-11, count it again: the two lines of `docs/store/firefox.md`'s
    Summary, joined by one line break.
  - **Check:** 250 characters or fewer, and AMO's field accepts it with no error.
  - **If it fails:** stop the AMO submission. Shortening a published sentence is an agent task, with your approval.

## 7 · Submit to the stores

Paste each field exactly as written under its heading in the listing file; the "Submission notes" at the end of each
file are for you, not the store. Copy every store text from the files as they stand at the release commit: the
post-9.2 versions (9.2's HUMAN COPY APPROVAL, 2026-11-11, changed the Firefox description, PRIVACY.md, the site and
the README), never from an earlier copy, a draft or a screenshot.

- [ ] **7.1 Chrome Web Store.**
  - **Where:** [developer dashboard](https://chrome.google.com/webstore/devconsole) → **Add new item** → **Choose
    file** → `peekover-0.1.0-chrome.zip` (from step 5.3) → **Upload**
    ([Chrome docs](https://developer.chrome.com/docs/webstore/publish)).
  - **Store Listing tab:** fields from `docs/store/chrome.md` (Description, Category **Workflow & Planning**, Homepage
    URL, Support URL); store icon `docs/store/assets/cws-icon-128.png`; screenshots, uploaded in this order, from `docs/store/assets/`:
    `chrome-1-reading-light.png`, `chrome-2-agent-file-dark.png`, `chrome-3-table-diagram-dark.png`,
    `chrome-4-math-code-light.png`, `chrome-5-tab-reader-light.png` (`docs/store/chrome.md`, "Screenshots"; the store
    takes no captions). The summary comes from the package.
  - **Privacy tab:** Single purpose, Permission justification, Remote code ("No, I am not using remote code"), Data
    usage (**Website content** only; all three certifications ticked) and the Privacy policy URL — each from its
    section of `docs/store/chrome.md`.
  - **Distribution tab:** free; all regions; Public.
  - **Submit:** **Submit for Review**. To choose the moment it goes live, untick the auto-publish box in the dialog
    (deferred publishing; you then have 30 days to publish — same Chrome page).
  - **Check:** the item's status reads pending review.
  - **Expect:** "For most extensions, review is completed within a few days, but it can take up to a few weeks"; past
    three weeks, contact developer support ([Chrome docs](https://developer.chrome.com/docs/webstore/review-process)).
- [ ] **7.2 Firefox Add-ons (AMO).**
  - **Where:** [Developer Hub](https://addons.mozilla.org/developers/) → **Submit a New Add-on** → **On this site**
    (listed) → upload `peekover-0.1.0-firefox.zip`
    ([Extension Workshop](https://extensionworkshop.com/documentation/publish/submitting-an-add-on/)).
  - **Platforms:** desktop only — Firefox for Android is not supported (`docs/store/firefox.md`, submission notes).
  - **Source code:** asked during submission, right after the upload: at **Do you need to submit source code?**
    answer **Yes** and upload `peekover-0.1.0-sources.zip` there (not later, on the version page). It holds `SOURCE_CODE_REVIEW.md`, the
    reviewer's build steps, and rebuilds the identical Firefox zip (`docs/ai/decisions.md`, "M13 TASK 7.4"). AMO needs
    source for bundled or minified code, with build instructions
    ([Extension Workshop](https://extensionworkshop.com/documentation/publish/source-code-submission/)). In **Notes
    for reviewers**, write: "Build steps: SOURCE_CODE_REVIEW.md at the root of the sources zip (Node 22, pnpm
    10.33.0, x64)."
  - **Describe:** Name, Summary, Categories (**Web Development**, **Other**), Description, Homepage, Support site,
    Licence **MIT**, Privacy policy (paste the full text of `docs/trust/PRIVACY.md` as it stands now: the UPDATED
    text, after 9.2 changed rows 359, 363, 372 and 373; ledger row 510) — from `docs/store/firefox.md`.
    Support email: hello@peekover.dev (`docs/store/firefox.md`).
  - **Screenshots:** upload, in this order, `docs/store/assets/amo-1-reading-light.png`, `amo-2-agent-file-dark.png`,
    `amo-3-table-diagram-dark.png`, `amo-4-math-code-light.png`, `amo-5-tab-reader-light.png`, and give each the
    description of the same number (`docs/store/firefox.md`, "Screenshot descriptions").
  - **Data collection:** the package declares none (`docs/store/firefox.md`, "Data collection").
  - **Check:** a confirmation page and an email from AMO.
  - **Expect:** AMO publishes no review timeline. The submission page says the add-on "may be subject to further
    review" with the outcome sent later ([Extension Workshop](https://extensionworkshop.com/documentation/publish/submitting-an-add-on/)).
- [ ] **7.3 Microsoft Edge Add-ons.** **DEFERRED** (HUMAN RULING 2026-11-11, top of this file) — not submitted at
  v0.1.0; kept as written for the later Edge submission (after 1.6, 6.2 and 6.3).
  - **Where:** [Partner Center](https://partner.microsoft.com/dashboard/microsoftedge/public/login) → **Create new
    extension** → upload `peekover-0.1.0-chrome.zip` — Edge takes the Chrome zip (`docs/store/edge.md`)
    ([Microsoft docs](https://learn.microsoft.com/en-us/microsoft-edge/extensions/publish/publish-extension)).
  - **Availability:** Public; all markets.
  - **Properties:** Category — `docs/store/edge.md` proposes **Productivity**: confirm it is in Partner Center's list,
    or pick the nearest and note it for an agent to update the file. Website and Support contact detail from the file.
  - **Privacy:** Single purpose, Permission justification, Remote code, Data usage (**Website content** only; all
    certifications), Privacy policy URL — from `docs/store/edge.md`.
  - **Store listings → Edit details:** Description and Search terms from the file; logo
    `docs/store/assets/edge-logo-300.png`; screenshots, uploaded in this order, from `docs/store/assets/`:
    `edge-1-reading-light.png`, `edge-2-agent-file-dark.png`, `edge-3-table-diagram-dark.png`,
    `edge-4-math-code-light.png`, `edge-5-tab-reader-light.png`, `edge-6-editor-light.png` (`docs/store/edge.md`,
    "Screenshots"; the store takes no captions).
  - **Submit:** **Publish** → Notes for certification (optional) → **Publish**.
  - **Check:** the status reads in certification.
  - **Expect:** "The certification process can take up to seven business days"; then the status reads **In the Store**
    (same Microsoft page).

## 8 · After the stores approve

- [ ] **8.1 Record each listing's URL** (Chrome item page, AMO add-on page). The Edge listing URL, from the
  extension's **Overview**, is **DEFERRED** with 7.3.
- [ ] **8.2 Replace the "not in stores" lines.** An agent task (carried from the human's 1.3 review —
  `docs/ai/progress.md`, "FOR M13 TASK 7.6"): every "Not in stores yet — build from source" line on the site (ledger
  rows marked UPDATE AT GO-LIVE), the site's Setup step "Build", and README's "not in any browser store yet" / "build
  it from source" lines become the real store links. Then run step 3.2 again.
  - **Check:** the live site and README name the two store links (Chrome Web Store, Firefox Add-ons), and each opens
    its listing. The Edge Add-ons link is **DEFERRED** with 7.3.
  - **Decide (the human, at this step):** the site's top banner reads "Chrome · Edge · Firefox" (ledger row 71). It
    is true (Peekover works in Edge), but beside two store links "Edge" could read as a third store. Keep it, or
    re-word it — a re-word is a published-copy change for an agent, with your approval, in the same commit as 8.2.
- [ ] **8.3 A store install, once per store.** The walk could only use unpacked and temporary installs; three
  sentences are evidenced as "store install checked at go-live" (ledger rows 303 and 325, and the install note in
  `docs/trust/PERMISSIONS.md`; 9.2 sign-off, flag 5).
  - **Do:** in a fresh browser profile, install Peekover from each live listing (Chrome, Firefox). Close the
    browser and start it again. In Chrome, then turn on "Allow access to file URLs" on Peekover's Details
    page while the setup guide is open. The Edge Add-ons install is **DEFERRED** with 7.3.
  - **Check:** the setup guide opens once, on install, and not again after the restart (rows 325 and PERMISSIONS.md).
    In Chrome, flipping the toggle may restart Peekover and close the guide, and nothing else breaks (row 303).
  - **If it fails:** a guide that opens again, or anything else that breaks, is an agent task. Leave the listings up
    unless the failure is serious enough for section 9.
- [ ] **8.4 Flip the "planned for the first public release" lines.** Once step 5.4 has verified the attestations and
  the stores have approved (8.1), the first-release items are no longer planned (9.2 sign-off, HUMAN 2026-11-11).
  - **Do:** an agent task, one commit. Re-word each line as a true statement, or drop it where it repeats one, and
    rewrite its ledger row (status "true now", the 5.2 run id and 5.4's verify as evidence): attestations, SECURITY
    row 59 (its section "Planned for the first public release", with row 339), THREAT-MODEL row 407, README row 432 (and
    its list label row 32, with row 33 for the listings) and site row 434. The same commit runs `tests/truthPins.test.ts`.
  - **Check:** no ledger row with status "planned" names attestations or the Chrome and Firefox listings (an "Edge
    Add-ons later" line stays planned until the deferred 7.3); `truthPins.test.ts` is
    green; the live site's Planned section and SECURITY.md show the new lines (rerun step 3.2 for the site).
  - **If it fails:** leave the old lines up. They are still true ("planned") until the new ones land.
- [ ] **8.5 The human reviews the screenshot pick and captions.** The reviewer picked the store screenshots under the
  human's delegation (2026-11-11: "you check and decide"; `docs/ai/decisions.md`, "M13 TASK 9.3 — CLOSED"), and
  drafted the captions (ledger rows 593–608; only AMO publishes them).
  - **Do:** look at each live listing's screenshots and, on AMO, their descriptions.
  - **Check:** each is kept, or a change is named for an agent task (new files in `docs/store/assets/`, the listing
    file and the ledger rows updated together, `tests/storeScreenshots.test.ts` and `tests/truthPins.test.ts` green).
  - **If it fails:** the listings stay up while the replacement is made; a screenshot can be swapped without a new
    package.

## 9 · Rollback — if something has to come down

- [ ] **9.1 Chrome:** dashboard → the item → **more options** (top right) → **Unpublish**. "Your listing will no
  longer be visible in the store"; publishing again needs a new review
  ([Chrome docs](https://developer.chrome.com/docs/webstore/account-deletion)). Once a later version exists, **Roll
  back to previous version** re-publishes the one before under a new version number, within a minute and with no
  review ([Chrome docs](https://developer.chrome.com/docs/webstore/rollback)) — not possible for 0.1.0, which has no
  earlier version.
- [ ] **9.2 Firefox:** the add-on → **Manage Status & Versions** → **Listing Visibility** → **Invisible**. It stops
  new installs; existing installs stay ([Extension Workshop](https://extensionworkshop.com/documentation/manage/retiring-your-extension/)).
- [ ] **9.3 Edge:** **DEFERRED** with 7.3 — nothing to unpublish at v0.1.0. Partner Center → the listing → **Extension Overview** → **Unpublish**. "Users who already
  installed your extension can continue to use it, but the extension isn't available to new users"
  ([Microsoft docs](https://learn.microsoft.com/en-us/microsoft-edge/extensions/update/update-extension)).
- [ ] **9.4 The GitHub release:** `gh release delete v0.1.0 --repo mosuvo/peekover --yes` keeps the tag; add
  `--cleanup-tag` to delete the tag too ([GitHub CLI manual](https://cli.github.com/manual/gh_release_delete)). On
  the web: **Releases** → the trash icon → **Delete this release**
  ([GitHub docs](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository)).
- [ ] **9.5 The site:** to put back an earlier site, revert the commit on `main` (`git revert <commit>`, push) and run
  step 3.2 again. To take the site down, first remove the peekover.dev `A`, `AAAA` and `www` records at your DNS
  provider, then remove the custom domain: a disabled Pages site with DNS still pointing at it can be taken over
  ([GitHub docs](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)).
- [ ] **9.6 The repository:** making it private again erases stars and watchers, leaves public forks public, and on
  GitHub Free unpublishes the Pages site — remove the DNS records first
  ([GitHub docs](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings/setting-repository-visibility)).
  Code already cloned or forked cannot be called back.

## 10 · Chrome Web Store uploads (from 0.1.1)

*Added 2026-11-13 (`docs/ai/decisions.md`, "CHROME UPLOADS AUTOMATED"). From 0.1.1 on, the release workflow uploads
the Chrome zip and submits it for review, after your approval. Step 7.1 is still the way to submit by hand (see 10.4).
AMO and Edge stay by hand. Google's docs, read 2026-11-13: [Use the Chrome Web Store
API](https://developer.chrome.com/docs/webstore/using-api), [Service
accounts](https://developer.chrome.com/docs/webstore/service-accounts), [API
reference](https://developer.chrome.com/docs/webstore/api/reference/rest). The workflow uses API V2 only; V1 is
retired.*

- [x] **10.1 The one-time setup (done by the human, 2026-11-13).** No key file exists, and no long-lived credential is
  stored anywhere.
  - **Google Cloud:** project `peekover-release`, with the Chrome Web Store API enabled. Service account
    `cws-publisher@peekover-release.iam.gserviceaccount.com`, with no key, added in the Chrome Web Store dashboard under
    **Account → Service account** (one service account per publisher).
  - **Workload Identity Federation:** pool `github`, OIDC provider `peekover` (issuer
    `https://token.actions.githubusercontent.com`). Attribute condition
    `assertion.repository_id=='1454048576' && assertion.environment=='chrome-web-store'`, so Google takes only tokens
    from a job that runs in that environment of this repository. `1454048576` is the repository's numeric ID
    (`gh api repos/mosuvo/peekover --jq .id`). The ID does not change on a rename, and a repository created later
    under the same name gets a new one. The repository is bound to the service account with
    `roles/iam.workloadIdentityUser`. **Tested 2026-11-14:** the human set this condition on 2026-11-13, after the
    10.3 check. The first sign-in under it was the 0.1.1 release's upload job (Release run 43596256620, 10.2), which
    signed in, uploaded and submitted 0.1.1 (Done notes, Later releases). If a later run fails at "Sign in to Google"
    with "rejected by the attribute condition", run 10.3 on the release tag to test the sign-in alone.
    History: the first condition, `assertion.sub=='repo:mosuvo/peekover:environment:chrome-web-store'`, rejected the
    check run's token ("The given credential is rejected by the attribute condition", 10.3, attempt 1). Why the `sub`
    claim did not match was not diagnosed. The human replaced it with `assertion.repository=='mosuvo/peekover' &&
    assertion.environment=='chrome-web-store'`, under which 10.3 passed (attempt 3). Then the human replaced that one
    with the ID-based condition above.
  - **GitHub:** the environment `chrome-web-store`. Required reviewer `mosuvo`, admin bypass off, and deployments from
    `v*` tags only. It holds four environment secrets (not variables): `GCP_WIF_PROVIDER`, `GCP_SERVICE_ACCOUNT`,
    `CWS_PUBLISHER_ID` and `CWS_ITEM_ID`. No workflow hard-codes any of them. Paste each value with no line break.
    Both workflows remove whitespace from the two store IDs and check their format before any call (step "Check the
    store IDs"). A malformed ID fails there, the error names the secret, and its value is never printed.
  - **If sign-in fails** (10.3 fails at "Sign in to Google"): check that the provider's full resource name is in
    `GCP_WIF_PROVIDER` (`projects/<number>/locations/global/workloadIdentityPools/github/providers/peekover`). Check
    that the attribute condition is the one above. Then check that the IAM Service Account Credentials API
    (`iamcredentials.googleapis.com`) is enabled in `peekover-release`: the auth action mints the access token
    through it. Sign-in worked on 2026-11-13 (Done note 10.3), so each of these was right then.

- [ ] **10.2 A release: approve the upload.** It runs on each `v*` tag push (step 5.1). First done for 0.1.1,
  2026-11-14 (Done notes, Later releases); the box stays open because the step repeats each release.
  - **What runs:** `release.yml`'s job `chrome-web-store` ("Upload to the Chrome Web Store and submit for review"). It
    runs only when build, tests, attestation and the draft release have all succeeded, and never on a dry run. It
    downloads the release files the draft release was made from, and checks `peekover-<version>-chrome.zip` against
    `SHA256SUMS` (`sha256sum --check`) before anything is sent. It then signs in through Workload Identity Federation,
    uploads that zip (V2 `upload`, polling `fetchStatus` while the upload is processed), and submits it (V2 `publish`,
    `DEFAULT_PUBLISH`: it goes live once Google approves it). Any non-2xx response, or any state other than upload
    `SUCCEEDED` and publish `PENDING_REVIEW` or `PUBLISHED`, fails the job. The log shows each response body, which
    holds no token. The run summary shows the publish state and the version that `fetchStatus` reports.
  - **Do:** open the Release run (`gh run list --workflow release.yml --limit 1`, then the run's page). Check the draft
    release first (5.3 and 5.4). Then go to **Review deployments** → tick `chrome-web-store` → **Approve and deploy**.
    Until you approve, the job waits, and nothing has been sent to Google.
  - **Check:** the job is green; its summary reads `publish state PENDING_REVIEW` with the new version; the dashboard
    shows the item as pending review. Google's review then runs as in 7.1 (**Expect**).
  - **If it fails:** read the job's log. The step that failed, and the API's response body, say where it stopped.
    Before the upload, nothing reached the store: fix the cause, then **Re-run failed jobs**. After the upload, or at
    publish: finish in the dashboard (10.4). The package may already be there as a draft, so submit it or upload it
    again. A publish fails when the item's visibility was changed in the dashboard and has not been published by hand
    since. Google's docs: the API cannot publish until you publish by hand once with the new visibility.
  - **To not upload a release:** **Reject** in Review deployments. The draft release is not affected.

- [x] **10.3 The check-only run: prove the sign-in without uploading.** Done 2026-11-13 (Done note 10.3). `.github/workflows/cws-check.yml` ("Chrome Web
  Store sign-in check") runs by hand only. It runs in the same environment, signs in the same way with the same scope,
  and makes one read-only call, V2 `fetchStatus`. It passes on HTTP 200 for the item in `CWS_ITEM_ID`, and its summary
  shows the published state and version. It uploads nothing and publishes nothing.
  - **Which ref:** the environment deploys from `v*` tags only, and a dispatched run uses the workflow file at the ref
    it runs on. So **`--ref v0.1.0` does not work.** `v0.1.0` (`216cf7b`) does not contain `cws-check.yml`, and GitHub
    refuses the dispatch. Dispatched from `main`, the run starts, and the environment then refuses the job (the branch
    is not allowed to deploy). Use a `v*` tag on a commit that has the file. Before 0.1.1, that is a throwaway check
    tag on the pushed `main`. From 0.1.1, the release tag itself works (`--ref v0.1.1`), dispatched before you approve
    10.2.
  - **Do** (after `main`, with `cws-check.yml`, is pushed):
    ```bash
    git fetch origin
    git tag -a v0.1.0-cws-check -m "Chrome Web Store sign-in check (no release)" origin/main
    git push origin v0.1.0-cws-check
    gh workflow run cws-check.yml --repo mosuvo/peekover --ref v0.1.0-cws-check
    gh run list --repo mosuvo/peekover --workflow cws-check.yml --limit 1
    ```
    Then, on that run's page: **Review deployments** → `chrome-web-store` → **Approve and deploy**, and
    `gh run watch <run id> --repo mosuvo/peekover`.
  - **Side effect:** pushing a `v*` tag also starts a Release run. That run fails within a minute, at "Check the tag
    equals package.json's version" (`v0.1.0-cws-check` is not `v0.1.0`). No release is created, nothing is uploaded,
    and no approval is asked. It is expected; ignore it.
  - **Check:** the check run is green, and its summary reads "Signed in and read the item: published `PUBLISHED`
    (version `0.1.0`) … Nothing was uploaded."
  - **Then:** delete the check tag. `git push origin :refs/tags/v0.1.0-cws-check`, then `git tag -d v0.1.0-cws-check`.
  - **If it fails:** at "Check the store IDs", re-enter the secret the error names, with no line break: the item ID is
    32 lowercase letters a–p, and the publisher ID is the one under **Publisher → Settings** in the dashboard. At "Sign in
    to Google", see 10.1 (**If sign-in fails**). An HTTP 403 or 404 from `fetchStatus` means the token works but the
    store refused it. Check that `CWS_PUBLISHER_ID` and `CWS_ITEM_ID` are right, and that the service account is the
    one under the dashboard's **Account → Service account**.

- [ ] **10.4 The manual fallback: the dashboard, as in 7.1.** For when the job cannot run or stopped after the upload.
  - **Do:** download `peekover-<version>-chrome.zip` and `SHA256SUMS` from the GitHub release, and check them with
    `sha256sum --check --ignore-missing SHA256SUMS` (5.3). Then [developer
    dashboard](https://chrome.google.com/webstore/devconsole) → the item → **Package** → **Upload new package** → that
    zip → **Submit for review** (7.1's **Submit**; the listing fields are already there).
  - **Check:** the item's status reads pending review, with the new version.

## Done notes

*One line per step: the step number, the date, and the evidence seen (a run id, a URL, "all OK").*

- **0.3 · 2026-11-10 · measured by CC (before release day; box left for the release commit):** `a2ddc67` — CI 42866301850 and Supply chain 42866301860 both `completed success` (https://github.com/mosuvo/peekover/actions/runs/42866301850, …/42866301860). The release dry run on the same commit, 42868591628: build success, attestation and draft release skipped, no tag, no release. **Re-check 0.3 on the commit you release** — any later push (this note's own commit included) needs its own green CI.
- **0.3 + 2.1 · 2026-11-12 · measured by CC on `7aafb96`, the history-rewrite commit (boxes left for the release commit):** **0.3:** CI 43043430194 `completed success` on attempt 3 (verify: lint, unit, Playwright install, browser 2,802 passed / 90 skipped of 2,892 in 235 files + 3 skipped, build; reproducible: success). Attempts 1 and 2 (2026-11-11) failed only at "Install Playwright browsers": the runner could not resolve the Ubuntu apt mirrors. `ci.yml` unchanged. Supply chain 43043430290 `completed success` (OSV, SBOM, no remote code, audit). https://github.com/mosuvo/peekover/actions/runs/43043430194, …/43043430290. Local unit `pnpm test` EXIT 0, 1,723 passed, 0 skipped (with `.output` built and zipped, both engines). **2.1:** gitleaks 8.30.1 (windows_x64 zip SHA-256 `d29144de…` = the 7.6 record = the release checksums file), every ref fetched first, the 7.6 command `gitleaks git . --log-opts="--all" --report-format json --redact=50`: EXIT 0, 583 commits scanned, no leaks (602 commits on `main`, 5 Dependabot branches, 5 PR heads; no tags). Control: a scratch repo with a planted AWS key and GitHub token, deleted in the next commit: EXIT 1, both found (`aws-access-token`, `github-pat`). **Re-check both on the commit you release.** This note's own commit needs its own green CI.
- **0.1–0.5 + 2.1 · 2026-11-12 · measured by CC on `216cf7b`, the release commit:** 0.1: 8.1 and its 11 walk fixes (8.1a–8.1k) ticked in tasks.md, none unticked. 0.2: 9.1–9.5 ticked; `progress.md` says M13 closed; the blocker closed at 9.2b; `docs/store/assets/` holds chrome-1..5 and amo-1..5, all 1280×800. 0.3: CI 43135594093 and Supply chain 43135594157 both `completed success` on the first attempt (browser 2,802 passed / 90 skipped). 0.4: `pnpm audit --prod` EXIT 0, 1 low ignored (GHSA-238p-pmpm-9mq7). 0.5: both builds EXIT 0, `extensionSize.test.ts` 4 passed / 0 skipped, 6,660,128 / 6,660,114 B. 2.1: gitleaks 8.30.1 (hash = the 7.6 record), every ref fetched, the 7.6 command: EXIT 0, 584 commits scanned (603 in all, 13 refs, no tags), no leaks; control EXIT 1, both planted secrets found.
- **2.2–2.4 · 2026-11-12 · the human:** the repository public; private vulnerability reporting on (API `enabled: true`, checked by CC).
- **3.1–3.6 · 2026-11-12:** 3.1 Source "GitHub Actions" (API `build_type: workflow`). 3.2 Pages 43142648837 success, deployment 7726777490 at 216cf7b; the served page = `site/index.html` byte for byte. 3.3 `peekover.dev` saved, `protected_domain_state: verified`; no commit on `main`. 3.4 checked on Cloudflare and Google DNS and the authoritative server: 4 A and 4 AAAA as listed, `www` CNAME `mosuvo.github.io.`, MX and SPF kept, the challenge TXT present, no wildcard. 3.5 certificate approved for `peekover.dev` and `www.peekover.dev`; HTTPS enforced; `http://peekover.dev/`, `http://www.peekover.dev/` and `https://www.peekover.dev/` each 301 to `https://peekover.dev/`. 3.6 all resolved, 2026-11-12: every URL row 200 signed out (`curl -sSIL`), content checked with a control; "Report a vulnerability" on the security page; "Issues open to anyone" by the human with a second account.
- **4.1 · 2026-11-12 · the human:** a test message to `hello@peekover.dev` arrived (registrar forwarding). The email edit follows as its own agent task.
- **5.1–5.5 · 2026-11-12:** 5.1 the human pushed `v0.1.0`, an annotated tag (`3cdd985c`) on `216cf7b`, tagged 03:45:05Z. 5.2 Release 43150291963: all three jobs success, Attest RAN — 6 subjects, SLSA provenance v1, Sigstore-signed and in Rekor (https://github.com/mosuvo/peekover/attestations/66530573); the log shows `REPRODUCIBLE` and unit 1,723 / 1,723. 5.3 the draft's five files and `SHA256SUMS`: `sha256sum -c` all OK (EXIT 0); the zip hashes = the clean-clone hashes in the log = a local build (chrome `2740c20a…`, firefox `3d1d3930…`, sources `058307a2…`). 5.4 `gh attestation verify` EXIT 0 for all five (ref `refs/tags/v0.1.0`, commit `216cf7b9dcdd`); a tampered file fails both checks (EXIT 1). 5.5 the human published it at 03:55:19Z; signed out, the release page opens.
- **7.2 · 2026-11-12 · the human:** AMO 0.1.0 submitted, listed, status **Awaiting Review**. The flow: upload `peekover-0.1.0-firefox.zip`, then **Do you need to submit source code?** appeared, and the answer was Yes with `peekover-0.1.0-sources.zip` uploaded there, during submission, not on the version page afterwards (7.2's step corrected to this order). Before submission, CC reproduced AMO's validation locally (addons-linter 10.15.0 on the release zip: 0 errors, 17 warnings, each traced and explained). CC also rebuilt the Firefox zip from the sources zip alone, and it matched `SHA256SUMS` (`3d1d3930…`).
- **7.1 · 2026-11-12 · the human:** Chrome Web Store item submitted for review; item ID `bcfjejemkkoklbplcgfccboipmgiokpc`. Package `peekover-0.1.0-chrome.zip` from the v0.1.0 release. The listing fields and the Privacy tab are from `docs/store/chrome.md` as written: single purpose; host permission justification (the file's "Permission justification"); data usage **Website content** only, with all three certifications ticked; privacy policy URL https://peekover.dev/privacy/. Distribution: free, Public, all regions. Auto-publish ON, so it goes live when approved. The dashboard warned that the host access may mean an in-depth review, which can take longer. **The first submission was rejected for "Keyword Spam" (violation reference Yellow Argon).** The flagged text was the description's language list ("JavaScript, TypeScript, TSX, Python, JSON, CSS, HTML, Bash, diff, YAML, Markdown, TOML and SQL"). The human shortened that bullet in the dashboard to "…highlights code in common programming languages." and resubmitted on 2026-11-12. `docs/store/chrome.md` and ledger row 452 now match.
- **8.1 (Chrome) · 2026-11-12 · the human:** Chrome Web Store published Peekover 0.1.0 on 2026-11-12 (the store's email "Item successfully published"), visibility Public. Listing: https://chromewebstore.google.com/detail/peekover/bcfjejemkkoklbplcgfccboipmgiokpc. Checked by CC 2026-11-13, signed out (`curl -sSL`): 200, page title "Peekover - Chrome Web Store". Control: an unknown item id also returns 200, but titled only "Chrome Web Store", so the title is the evidence, not the status. The AMO URL follows when AMO approves 0.1.0; Edge is deferred with 7.3.
- **8.3 (Chrome) · 2026-11-13 · the human:** installed from the store listing in a clean Chrome profile. The setup guide opened once, on install, and not again after a restart (row 325, PERMISSIONS.md's install note). A raw GitHub markdown file rendered, and the toolbar button opened the app page. **Not reported:** turning on "Allow access to file URLs" while the guide is open (row 303), so that half of 8.3 is still open for Chrome. The Firefox install follows when AMO approves.
- **8.2 (Chrome part) · 2026-11-13 · CC:** the "not in stores" lines now name the Chrome Web Store listing, and Firefox is named as in review at Mozilla, not available. README: the top note (rows 4, 5 and the new row 618). Site (`site/index.html`): the four "Not in stores yet — build from source" spans, in the nav, the hero, the band and the final call to action (rows 63, 70, 161 and 187), became links to the listing. Setup: the heading "From source to reading." became "From install to reading." (row 178), and the step "Build" became "Install" (rows 179, 180 and 181). Step 3.6's table lists the listing URL (rows 63, 70 and 187). `tests/truthPins.test.ts`: the store-URL ban now lets through only this listing's exact URL; AMO and Edge URLs stay banned. Red-first: red 1, the ledger first (4 reds); red 2, the docs edited (2 reds, the store-URL guard); then green, 106 / 106. Ablation: a planted AMO URL in README turned the guard red. **Not done here:** the live site keeps the old text until the human runs step 3.2 (`gh workflow run pages.yml --ref main`, after the push). **Banner (row 71, "Chrome · Edge · Firefox"): the human keeps it (2026-11-13).** It states where Peekover runs, not where it is listed. The AMO link follows AMO's approval.
- **8.4 (Chrome part) · 2026-11-13 · CC:** the Chrome listing left the "planned" lines: README row 33 and site row 434 now name only the Firefox listing (in review at Mozilla) and "(Edge Add-ons later)", still planned. The Chrome listing is stated as true at rows 4 and 180. Row 32 (README's label "For the first public release:") stays planned for Firefox. The attestation lines were already flipped on 2026-11-12 (`docs/ai/decisions.md`, "attestations and the privacy policy are true now"). REPRODUCING row 429 (SHA256SUMS, planned) names no store listing and was left. The store listing files (`docs/store/chrome.md`, `firefox.md`, `edge.md`) are not changed. `tests/truthPins.test.ts` is green.
- **8.3 (Chrome) complete · 2026-11-13 · the human:** in the same clean profile, the human turned on "Allow access to file URLs", and the setup guide showed it as on (row 303). With the earlier note, 8.3 is done for Chrome; Firefox follows when AMO approves.
- **3.2 re-run after 8.2 · 2026-11-13 · the human:** Pages run 43364785025 succeeded, on `5f0da1b` (checked by CC with `gh run view`). On peekover.dev, the human checked that the Chrome Web Store buttons open the listing, that Setup reads "From install to reading.", and that /privacy/ loads. **At phone width the nav button wrapped onto two lines and overflowed the header.** The next commit fixes that, and its redeploy (step 3.2 again) is pending. The run carries an annotation: `ubuntu-latest` moves to Ubuntu 26 from 2026-10-19 (queued for 0.1.1, https://github.com/mosuvo/peekover/issues/7).
- **Site fix, the nav button at phone width · 2026-11-13 · CC:** below the 880 px breakpoint, where the nav collapses to ☰, the nav's Chrome Web Store button is hidden. The ☰ menu gained a "Chrome Web Store" link to the listing (row 64; step 3.6's table names #64). Every `.cta` has `white-space: nowrap`. Measured in Playwright Chromium, with the site served locally and its own fonts: at 320, 375, 380, 414 and 768 px the nav is 64 px high with no overflow, the button is hidden, and the menu lists the link. At 1280 px the header screenshot is byte-identical to the previous commit's, and so is every width from 931 px up (swept 881–1101). From 881 to about 925 px the old button wrapped onto two lines (151×64); now it is one line (166×43), and the nav links' wrapping range ("Agent output", 881–921 px) is unchanged. The old page reproduced the bug: a 64 px two-line button at 320–414 px, and the nav overflowing at 320 px. Red-first: row 64 first (2 reds), then the site (green).
- **10.3 · 2026-11-13 · the human, checked by CC with `gh`:** cws-check run 43372743291 (ref `v0.1.0-cws-check`, on `7f25e7d`), attempt 3, `completed success`. It signed in and read the item: published `PUBLISHED`, version `0.1.0`; nothing was uploaded (the job has no upload or publish call). Attempt 1 failed at sign-in: "The given credential is rejected by the attribute condition". The human changed the provider condition to `assertion.repository=='mosuvo/peekover' && assertion.environment=='chrome-web-store'` (10.1). Attempt 2 failed with curl "(3) URL rejected: Malformed input to a URL function", most likely a line break in a pasted secret. The human re-entered `CWS_ITEM_ID` and `CWS_PUBLISHER_ID`, and both workflows now trim and check the two IDs before any call (10.1). The side effect ran as 10.3 says: Release run 43372737530 on the same tag failed in 6 s at "Check the tag equals package.json's version" ("tag v0.1.0-cws-check does not match package.json version 0.1.0"). Install and every later build step were skipped, and so were attest, the draft release and the Chrome Web Store job: no release, no upload, no approval asked. The check tag was deleted afterwards. Only `v0.1.0` remains (`gh api .../git/refs/tags`).

### Later releases

*From 0.1.1 on: one note per release, with the same evidence as 5.1–5.5 and 10.2.*

- **0.1.1 (5.1–5.5, 10.2) · 2026-11-14 · the human, checked by CC with `gh`:** the human pushed `v0.1.1` on `b06d7f1`. Release run #4, 43596256620: all four jobs `success` (build, test and package; attest; the draft release; the Chrome Web Store upload). The log shows unit 1,779 / 1,779 and `REPRODUCIBLE`. Hashes: chrome `cb4f28a1…172d`, firefox `145dfbed…c6f6`, sources `df165ecf…e1eb`, SBOM `eece450a…06bb`, THIRD_PARTY_LICENSES `b3aa4628…aedf`. 5.3: the human ran `sha256sum -c`, 5 OK. 5.4: `gh attestation verify` passed for each file. 10.2: the human approved the deployment; the job "Upload to the Chrome Web Store and submit for review" uploaded and submitted 0.1.1 in 19 s (13:53:48Z–13:54:07Z), and its summary reads `PENDING_REVIEW`. It was the first sign-in under the repository-ID condition, which is now tested (10.1). 5.5: the human published the release at 14:16:15Z; `gh release list` shows it as Latest. Next: Google's review; after approval, retake the Chrome screenshots. AMO gets 0.1.1 only after it approves 0.1.0 (`decisions.md`, "0.1.1 RULINGS", D1). Issues #6 and #7 closed, pointing to v0.1.1.

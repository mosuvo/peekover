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
  - **Check:** `docs/store/assets/` holds your screenshot picks (9.3), at least one at 1280×800.
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
- [ ] **1.6 Microsoft Edge Add-ons (Partner Center) account.**
  - **Where:** [Partner Center](https://partner.microsoft.com/dashboard/microsoftedge/public/login) with a Microsoft
    account → **Microsoft Edge Developer Account Registration** → account type **Individual** → publisher display name
    → contact info → **I accept the terms and conditions** → **Finish**. "There is no registration fee"
    ([Microsoft docs](https://learn.microsoft.com/en-us/microsoft-edge/extensions/publish/create-dev-account)).
    Country and account type cannot be changed after enrollment (same page).
  - **Also:** turn on two-step verification on the Microsoft account (recommended; the Edge docs do not require it).
  - **Check:** **Open Account Settings** shows the enrollment verified (you get a confirmation email).
  - **If it fails:** the same page's "If account verification is delayed" section.

## 2 · The repository goes public

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
    | https://peekover.dev | The Peekover site | #36, #434, #465, #508, #542 |
    | https://peekover.dev/privacy/ | The privacy policy, the same text as `docs/trust/PRIVACY.md` | #36, #339, #434, #463, #475, #506, #510, #540, #552 |
    | https://github.com/mosuvo/peekover | The repository, signed out | #63, #64, #187, #196, #464, #507, #541 |
    | https://github.com/mosuvo/peekover#build-from-source | The README, scrolled to "Build from source" | #70 |
    | https://github.com/mosuvo/peekover/blob/main/docs/trust/SECURITY.md | SECURITY.md | #197 |
    | https://github.com/mosuvo/peekover/blob/main/docs/trust/PERMISSIONS.md | PERMISSIONS.md | #198 |
    | https://github.com/mosuvo/peekover/releases | The releases page (empty until step 5) | #199 |
    | https://github.com/mosuvo/peekover/issues | The issues page, with **New issue** | #200, #466, #509, #543 |
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
    summary lists the SHA-256 of each file and the line `REPRODUCIBLE` (`.github/workflows/release.yml`).
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
  - **Check:** the questions match `docs/store/chrome.md`, `docs/store/firefox.md` and `docs/store/edge.md`.
  - **If it fails:** a question asks something the file does not answer, or its wording changes the answer → stop
    that store and bring it to an agent session to re-check the file. Do not improvise an answer about data.

## 7 · Submit to the stores

Paste each field exactly as written under its heading in the listing file; the "Submission notes" at the end of each
file are for you, not the store.

- [ ] **7.1 Chrome Web Store.**
  - **Where:** [developer dashboard](https://chrome.google.com/webstore/devconsole) → **Add new item** → **Choose
    file** → `peekover-0.1.0-chrome.zip` (from step 5.3) → **Upload**
    ([Chrome docs](https://developer.chrome.com/docs/webstore/publish)).
  - **Store Listing tab:** fields from `docs/store/chrome.md` (Description, Category **Workflow & Planning**, Homepage
    URL, Support URL); store icon `docs/store/assets/cws-icon-128.png`; screenshots from `docs/store/assets/` (step
    0.2). The summary comes from the package.
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
  - **Source code:** answer **Yes** and upload `peekover-0.1.0-sources.zip`. It holds `SOURCE_CODE_REVIEW.md`, the
    reviewer's build steps, and rebuilds the identical Firefox zip (`docs/ai/decisions.md`, "M13 TASK 7.4"). AMO needs
    source for bundled or minified code, with build instructions
    ([Extension Workshop](https://extensionworkshop.com/documentation/publish/source-code-submission/)). In **Notes
    for reviewers**, write: "Build steps: SOURCE_CODE_REVIEW.md at the root of the sources zip (Node 22, pnpm
    10.33.0, x64)."
  - **Describe:** Name, Summary, Categories (**Web Development**, **Other**), Description, Homepage, Support site,
    Licence **MIT**, Privacy policy (paste the full text of `docs/trust/PRIVACY.md`) — from `docs/store/firefox.md`.
    Support email: leave empty unless step 4 found the address working and the email edit has landed.
  - **Data collection:** the package declares none (`docs/store/firefox.md`, "Data collection").
  - **Check:** a confirmation page and an email from AMO.
  - **Expect:** AMO publishes no review timeline. The submission page says the add-on "may be subject to further
    review" with the outcome sent later ([Extension Workshop](https://extensionworkshop.com/documentation/publish/submitting-an-add-on/)).
- [ ] **7.3 Microsoft Edge Add-ons.**
  - **Where:** [Partner Center](https://partner.microsoft.com/dashboard/microsoftedge/public/login) → **Create new
    extension** → upload `peekover-0.1.0-chrome.zip` — Edge takes the Chrome zip (`docs/store/edge.md`)
    ([Microsoft docs](https://learn.microsoft.com/en-us/microsoft-edge/extensions/publish/publish-extension)).
  - **Availability:** Public; all markets.
  - **Properties:** Category — `docs/store/edge.md` proposes **Productivity**: confirm it is in Partner Center's list,
    or pick the nearest and note it for an agent to update the file. Website and Support contact detail from the file.
  - **Privacy:** Single purpose, Permission justification, Remote code, Data usage (**Website content** only; all
    certifications), Privacy policy URL — from `docs/store/edge.md`.
  - **Store listings → Edit details:** Description and Search terms from the file; logo
    `docs/store/assets/edge-logo-300.png`; screenshots (optional) from `docs/store/assets/`.
  - **Submit:** **Publish** → Notes for certification (optional) → **Publish**.
  - **Check:** the status reads in certification.
  - **Expect:** "The certification process can take up to seven business days"; then the status reads **In the Store**
    (same Microsoft page).

## 8 · After the stores approve

- [ ] **8.1 Record each listing's URL** (Chrome item page, AMO add-on page, Edge listing URL from the extension's
  **Overview**).
- [ ] **8.2 Replace the "not in stores" lines.** An agent task (carried from the human's 1.3 review —
  `docs/ai/progress.md`, "FOR M13 TASK 7.6"): every "Not in stores yet — build from source" line on the site (ledger
  rows marked UPDATE AT GO-LIVE), the site's Setup step "Build", and README's "not in any browser store yet" / "build
  it from source" lines become the real store links. Then run step 3.2 again.
  - **Check:** the live site and README name the three store links, and each opens its listing.

## 9 · Rollback — if something has to come down

- [ ] **9.1 Chrome:** dashboard → the item → **more options** (top right) → **Unpublish**. "Your listing will no
  longer be visible in the store"; publishing again needs a new review
  ([Chrome docs](https://developer.chrome.com/docs/webstore/account-deletion)). Once a later version exists, **Roll
  back to previous version** re-publishes the one before under a new version number, within a minute and with no
  review ([Chrome docs](https://developer.chrome.com/docs/webstore/rollback)) — not possible for 0.1.0, which has no
  earlier version.
- [ ] **9.2 Firefox:** the add-on → **Manage Status & Versions** → **Listing Visibility** → **Invisible**. It stops
  new installs; existing installs stay ([Extension Workshop](https://extensionworkshop.com/documentation/manage/retiring-your-extension/)).
- [ ] **9.3 Edge:** Partner Center → the listing → **Extension Overview** → **Unpublish**. "Users who already
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

## Done notes

*One line per step: the step number, the date, and the evidence seen (a run id, a URL, "all OK").*

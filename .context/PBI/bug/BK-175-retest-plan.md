# BK-175 — Retest Plan (Bug Triage + Bug Analysis)

**Ticket:** BK-175 | **Module:** Tenancy & Identity (Auth) | **Status (Jira):** En revisión
**Assignee:** Benjamin Segovia | **Priority:** Highest
**Prepared:** 2026-08-07 | **Tester:** Benjamin Segovia

> This is a hand-authored session doc (NOT a Jira mirror). The Jira-synced bug
> body lives at `.context/PBI/bug/BUG-BK-175-auth-login-magic-link-otp-email-has-no-code-entry-.md`
> (regenerate via `bun run jira:sync-issues get BK-175 --include-comments`).

---

## 1. Ticket summary

**Title:** Auth: Login: Magic-link OTP email has no code-entry field on staging

**Original report (Benjamin, 2026-06-22):** the staging magic-link login flow
could not be completed — Supabase Auth sent an 8-digit signup-style code by
email instead of a clickable magic link, and the "Check your inbox"
confirmation screen rendered no input field to enter that code. Reproduced
against a disposable Resend test inbox
(`bunkai-staging-userbunk@olkacoraug.resend.app`) that had **no prior
account**. This blocked 100% of staging QA, including BK-23 verification.

**Root-cause correction (Ely, 2026-08-06):** the real defect is server-side,
not UI-side. `POST /api/v1/auth/magic-link` calls Supabase's `signInWithOtp`
**without `shouldCreateUser: false`**. For an email with no prior account,
Supabase silently enrolls it as a new user and sends the "Confirm signup"
template (a code), not the "Magic Link" template (a link) — there was never a
missing input field to build; the flow was sending the wrong email for an
unknown address. Benjamin confirmed today (2026-08-07, Jira comment) that the
original repro address indeed had no prior account, which validates Ely's
diagnosis over the original one.

**Fix history:**
- PR #61 (Benjamin) — UI-only fix, added a code-entry field. **Closed**, superseded.
- PR #134 (Ely) — `fix(BK-175): stop the magic-link route from silently enrolling unknown emails`, sets `shouldCreateUser: false` on the `signInWithOtp` call. **Merged into `staging`**; Vercel deploy **succeeded** 2026-08-06.

**Jira housekeeping:** the sync-issues automation bot has twice flagged that
status "En revisión" is stale vs git reality (fix shipped, no open PR/branch
remains) and suggested transitioning to Ready For QA. Ticket is not
transitioned by this dispatch — Stage 3 owns that.

---

## 2. Today's retest scope

Verify PR #134's `shouldCreateUser: false` change on staging:

1. Unknown emails are no longer silently enrolled (no user-enumeration signal, no signup-style OTP email).
2. Known/existing accounts still get a working magic-link email (a real link, not a code) and can log in with it.
3. Regression: malformed/invalid email input still fails client-side validation.

---

## 3. Stage 1 — Bug triage

### Step 1.1 — Triage inputs

| Field | Value |
|---|---|
| Title | Auth: Login: Magic-link OTP email has no code-entry field on staging |
| Status | En revisión (stale — fix merged + deployed) |
| Work Type | Error (Bug-equivalent) |
| Priority | Highest |
| Module / Component | Tenancy & Identity |
| Fix surface | Backend route (`POST /api/v1/auth/magic-link`) — one-line Supabase call-option change (`shouldCreateUser: false`), not UI |

### Step 1.2 — Veto table

Applying `agentic-qa-core` / `sprint-testing` §"Bug workflow" veto table
(`session-entry-points.md` Step 1.2):

- **VETO: SKIP** conditions (pure text/CSS/docs/config/tech-debt-only) — **do not apply**. This is not a copy/style/doc/config change.
- **VETO: REQUIRE retesting regardless of score** — **applies**, on the **Auth / authorization** row (`login, permissions, roles, security, tokens`). The fix changes Supabase Auth enrollment + login-email-delivery behavior. This bug also independently qualifies under **External integrations** (Supabase Auth email templating/enrollment) and **State machine bugs** (unknown-vs-known-user branching in the OTP flow) — three independent veto rows, any one of which is sufficient.

**Verdict: FULL RETESTING REQUIRED.** No risk-score step is run — a REQUIRE veto bypasses Step 1.3 entirely per the decision tree ("If a veto applies, skip to Step 1.4 with the veto result"). Explicitly recorded here per dispatch instruction: this is an auth-surface bug and is retested regardless of how low a risk score might otherwise land.

### Step 1.3 — Risk score

Not applicable — bypassed by the REQUIRE veto (Step 1.2).

### Step 1.4 — Triage decision (for user confirmation)

```
BUG TRIAGE — BK-175
Veto: REQUIRE retesting (Auth / External integration / State-machine — 3 independent rows)
Decision: FULL RETESTING (ATP + ATR, no TCs in-sprint)
Rationale: fix touches Supabase Auth signInWithOtp enrollment branching on the
           login/magic-link path — exactly the class of change the veto table
           exists to force through manual verification.
Environment: staging (https://staging-upexbunkai.vercel.app) — confirmed
             reachable (307 on root).
Recommendation: proceed to Stage 2 execution once user confirms this triage.
```

---

## 4. Bug Analysis (execution guide for Stage 2 — written before touching the browser)

```
BUG ANALYSIS - BK-175
Date: 2026-08-07

BUG SUMMARY
  Was:    POST /api/v1/auth/magic-link called Supabase signInWithOtp without
          shouldCreateUser: false. An email with no prior account was
          silently enrolled and received the "Confirm signup" template
          (an 8-digit code) instead of being rejected/handled distinctly —
          and the login screen had no way to complete a code-based flow.
  Fix:    PR #134 sets shouldCreateUser: false on the signInWithOtp call, so
          unknown emails no longer get silently enrolled or sent a
          signup-style code through the login entry point.
  Module: Tenancy & Identity — Auth — magic-link login

TEST DATA
  Environment: Staging (https://staging-upexbunkai.vercel.app)
  Unknown-email fixture: a brand-new disposable inbox with NO prior account
                          (mint fresh at execution time — the original repro
                          address is no longer "unknown" once tested once).
  Known-account fixture: STAGING_USER_EMAIL (var name only — value read from
                          .env at execution time, never hardcoded/printed).
  URL: {{WEB_URL}}/login

VERIFICATION STRATEGY
  1. Navigate to {{WEB_URL}}/login
  2. Setup: no active session (Scenario A + B both start logged-out)
  3. Reproduce: original bug steps (submit magic-link form) against BOTH an
     unknown and a known address, contrasting the two outcomes
  4. Confirm: fix behaves per the two scenarios below
```

---

## 5. Two-scenario retest plan (verbatim — for Stage 2 execution)

### Scenario A — No silent enrollment (unknown email)

1. Precondition: no active session; mint/use a brand-new email address with **no prior Bunkai account** (a fresh disposable inbox — do not reuse the original 2026-06-22 repro address, it now has account history from that earlier test).
2. Navigate to `{{WEB_URL}}/login`, enter the unknown email, submit "Send magic link".
3. **Expected:**
   - The UI response is generic/success-looking regardless of whether the account exists — no user-enumeration signal (response shouldn't differ observably from Scenario B's known-account submission).
   - No new Supabase user is created for that address (verify via Supabase Auth admin / DB — `auth.users` — no new row for the fixture email after submission).
   - No OTP/signup email is sent to that address for this submission (verify the Resend/staging inbox receives nothing, or receives no signup-style code).

### Scenario B — Existing account still works (known email)

1. Precondition: no active session; use `STAGING_USER_EMAIL` (read the var name only from `.env` — never print/log the value).
2. Navigate to `{{WEB_URL}}/login`, enter the known email, submit "Send magic link".
3. **Expected:**
   - A magic-link email arrives at that inbox — a **clickable link**, not a code.
   - Clicking the link logs the user in successfully (lands authenticated, session established).

### Regression check — invalid email input

- Submit the magic-link form with a malformed address (missing `@`, no TLD, empty string).
- **Expected:** client-side validation still rejects it before any request fires, or the API responds with a 422-class validation error — per Ely's stated test coverage in PR #134. This must not have regressed while fixing the enrollment behavior.

---

## 6. Stage 1 output — no TCs created

Per skill rule #3 (bugs get ATP/Bug-Analysis + ATR only): no Xray/Jira `Test`
work items are created in this dispatch. The two scenarios above ARE the
retest cases; Stage 4 (`test-documentation`) later decides, independently,
whether this bug is regression-worthy enough to promote into a persistent
Test.

---

## 7. Open items / blockers

None. `.env` STAGING_USER_EMAIL / STAGING_USER_PASSWORD var names confirmed
present (values not read or printed in this planning dispatch — Stage 2
execution reads them at runtime). Staging env confirmed reachable per the
task's already-known context (307 on root). No Jira comment posted, no
transition performed, no git/PR action taken in this dispatch, per
instructions.

---

## 8. Stage 3 — Reporting (closed out 2026-08-07)

All three scenarios PASSED on staging (see Stage 2 execution result). ATR
and QA comment published to Jira; ticket transitioned to its terminal
verified state.

**ATR:** `{{jira.acceptance_test_results}}` (`customfield_10124`) is not on
the Bug/Error work type's edit screen for this workspace (confirmed via
`editmeta` before writing — `has_atr: false`). Published as the documented
fallback: `## Acceptance Test Results (ATR)` comment, id `12214`.

**QA comment:** Template C (Bug VERIFIED), comment id `12215`. Notes the
tool gap (DBHub MCP staging not available — Scenario A's `auth.users`
zero-rows check inferred from evidence-absence, not queried directly) and
closes the "Unverified" root-cause question from Ely's 2026-08-06 comment,
corroborated by Benjamin's 2026-08-07 comment confirming the original repro
address had no prior account.

**Transition chain:** `En revisión` (In Review, id `10033`) →
`Fixed & Deployed` → `Ready For QA` (id `10007`) → `ReTest Passed` →
`Cerrada` (id `6`, category `done`).

> Gotcha: `.agents/jira-workflows.json` records this bug workflow's terminal
> status as English `Closed` / `Open`→`Re-Open` as `Open`, but the live
> workspace displays them in Spanish (`Cerrada` / `Abierta`) — same class of
> drift already flagged for the Bug→Error issue-type rename. `acli jira
> workitem transition --status "Closed"` failed
> (`No allowed transitions found for given status`); `GET
> /rest/api/3/issue/{KEY}/transitions` was used to read the live transition
> name → target-status name (`ReTest Passed` → `Cerrada`), which is what
> actually worked. Re-running `bun run jira:sync-workflows` would refresh
> the catalog with live names.

**Final Status**

**Result:** PASSED (VERIFIED)
**Workflow Complete:** 2026-08-07
**Next:** Bug closed (Cerrada). Stage 4 (`test-documentation`) to decide,
independently, whether this bug is regression-worthy enough for a
persistent Test.

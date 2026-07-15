# Test Session Memory — BK-166

> Cross-dispatch tracking file for single-ticket sprint-testing mode. Hand-authored, NON-Jira. Each stage dispatch reads this file first to recover session state, then appends to it before returning.

---

## Ticket Identity

- **Ticket key:** BK-166
- **Epic:** BK-1 (Tenancy & Identity) -> `EPIC-BK-1-tenancy-identity`
- **TMS Modality:** jira-native (no Xray) — confirmed via `.agents/jira-required.yaml` section header "TMS Modality jira-native fields (no Xray)". ATP/ATR/TCs resolve through `[ISSUE_TRACKER_TOOL]` (`/acli`) and Story custom fields / comments, NOT `/xray-cli`.
- **Work type:** Historia (User Story)
- **Status at session start:** Ready For QA

---

## Environment

- **Active env:** staging (default; no user override requested)
- **WEB_URL_OVERRIDE:** none
- **API_URL_OVERRIDE:** none
- Resolution rule for downstream stages: if either override above is ever set to a value other than `none`, it wins over `{{WEB_URL}}` / `{{API_URL}}` from `.agents/project.yaml` for the rest of this session. Currently both are `none`, so all stages resolve the standard `{{environments.staging.web_url}}` / `{{environments.staging.api_url}}`.
- Reachability gate (run by orchestrator before this dispatch): staging web `https://staging-upexbunkai.vercel.app` → HTTP 307 (reachable). API root → normal Next.js 404 (not a dead deployment). Both GREEN.

---

## Flagged Constraints

### Email-delivery caveat (ACTIVE — affects Stage 1 test-data plan and Stage 2 execution)

- **Source:** Ely, comment on BK-166, 6/22/2026.
- **Constraint:** The shared Supabase project is on the free-tier email cap. A real human sign-up may NOT receive the OTP email until custom SMTP (Resend) is configured (in progress, not yet shipped).
- **Recommended workaround (declined by user 2026-06-23):** `admin-confirmed user` and `admin.generateLink` both require the Supabase service-role key, which intentionally does not live in this QA repo's `.env` (would grant superuser auth/DB access to testing tooling). User decided NOT to request either from dev for this session.
- **Decision (user, 2026-06-23):** Test only what does NOT depend on a real OTP arriving. The two OTP-dependent scenarios — "Sign up creates the account, sends a verification code, and confirms it" (UI) and "An API consumer completes email-verified sign-up... POST /api/v1/auth/confirm" (API) — are marked **NOT VERIFIABLE IN THIS ENVIRONMENT** for Stage 1/2/3. Everything else proceeds normally: email-first routing (existing vs new email), password signin happy/wrong-path, unconfirmed-account routing (can be reached by signing up without confirming — the "pending confirmation" state itself IS reachable, only the confirm-with-real-code step is blocked), invalid/expired code rejection (a wrong/garbage code can still be submitted and rejected — does not need a *valid* OTP), rate-limiting, magic-link fallback visibility, PAT+cookie coexistence. Stage 3 ATR must report this gap explicitly with the reason (free-tier email cap, no service-role key in QA tooling) — not silently omit it.

### No app-level rate limiting (discovered during code exploration — affects Stage 1 AC #8 test design)

- **Finding:** `lib/api/` was greped for `rate.?limit|429` — no Bunkai-side rate-limit middleware exists. All 4 BK-166 routes (`check-email`, `signup`, `signin`, `confirm`) only pass through upstream Supabase GoTrue / PostgREST 429 responses.
- **Impact:** AC "Repeated failed attempts are rate-limited" is testing Supabase's own throttling behavior, not a Bunkai feature. Stage 1 should calibrate the test design and expected thresholds accordingly (may need many more attempts than a custom limiter would require, and the threshold is not configurable by Bunkai).

### DBHub MCP unavailable (orchestrator-level, carried forward)

- **Status:** DBHub MCP currently unavailable pending `.env` fix + agent session restart (per orchestrator's preflight gate task #1, still in_progress).
- **Impact:** DB cross-validation leg of Stage 2 deep exploration (verifying `access_tokens` / `access_token_secrets` rows directly) may need to be deferred or done via API-observable behavior only (e.g., PAT scopes returned in the response body) until the MCP is restored.

---

## Stage-State Table

| Stage | Status | Notes |
|-------|--------|-------|
| Session Start | done | PBI folder created; module-context.md authored (new); context.md authored; this file authored. Story explanation already confirmed by user ("dale, arrancá") per orchestrator. |
| Stage 1 — Planning | done | VETO-REQUIRE triage; 42 test outlines (EP/BVA/State-Transition/Decision-Table/Error-Guessing) derived across the 11 ACs; AC4/AC11 marked NOT VERIFIABLE IN THIS ENVIRONMENT. ATP lives in Jira `customfield_10067`, synced to `acceptance-test-plan.md` in this folder; refined ACs + edge cases appended to the Story description; label `shift-left-reviewed` added. |
| Stage 2 — Execution (2026-06-23) | done (NO-GO) | Smoke FAILED — staging serves a magic-link-only login UI with no BK-166 email-first/password flow; `check-email`/`confirm` routes 404 outright. Deep UI/API/DB exploration not executed (Blocking per Finding-triage table). All 42 outlines recorded `BLOCKED — smoke failure` (see Stage 2 block below for per-outline detail). Bug draft prepared, NOT filed (human-confirmation gate). |
| Stage 3 — Reporting (2026-06-23) | done | ATR written to `customfield_10147` (FAILED, 0/42), synced to `acceptance-test-results.md`. Bug BK-177 (Critical) created with the user's confirmation, attached evidence, linked Story-`causes`-Bug. QA comment (Template B) posted. Transitioned Ready For QA -> In Test -> Blocked (formal_blocked_gate=true). Supplementary `Blocks`/"is blocked by" link denied (LINK_ISSUES permission) — not retried further. |
| Stage 2 — Execution (re-run, 2026-06-24) | done (GO, qualified) | Smoke PASSED — BK-166 email-first password UI now fully present; all 4 API routes confirmed live (no 404s). BK-177 verified RESOLVED. 30/42 outlines PASSED, 0 outright FAILED, 2 NOT VERIFIABLE (AC4/AC11, unchanged), 10 BLOCKED by a new non-blocking test-data/throttle gap (shared `STAGING_USER_EMAIL` account is unconfirmed; Supabase free-tier email-send rate limit hit during heavy signup testing) — see Stage 2 re-run block below. No BLOCKING (env-down/security/data-integrity) findings this pass; pass ran to completion. |
| Stage 3 — Reporting (re-run, 2026-06-24) | done (PASSED WITH ISSUES) | ATR write to `customfield_10147` rejected at runtime (HTTP 400, "not on the appropriate screen") — posted via the documented `## Acceptance Test Results (ATR)` comment fallback instead (Jira comment #11753), synced via `bun run jira:sync-issues pull --story BK-166 --include-comments` (5 files updated; `comments.md` confirms landing — `acceptance-test-results.md` itself still mirrors the stale 2026-06-23 custom-field value since the field write did not succeed). Combined QA comment (#11754) posted: PASSED WITH ISSUES summary (30/42, 0 defects, BK-177 verified fixed, 2 NOT VERIFIABLE unchanged, 10 BLOCKED test-infra with the second-account/cooldown ask) + a separately-flagged technical note on the zero-live-transitions-from-BLOCKED gap. Transition attempt (`back_from_blocked` / `qa_sign_off`) re-confirmed failing identically (`No allowed transitions found for given status`; REST `GET /transitions` still `[]`) — recorded as `transition_skipped: "no_live_transitions_from_blocked"`, not a dispatch failure. No bug filed — zero application defects this pass; the test-infra gap is fully covered by the QA comment's ask. |

---

## Quick Reference — AC Count & Scope

- 11 Gherkin scenarios in `acceptance-criteria.md` (confirmed count).
- Covers: email-first routing (existing vs new email), password signin happy/wrong-path, signup -> OTP -> confirm happy path, unconfirmed-account signin routing, invalid/expired code handling, rate-limiting, magic-link fallback visibility, PAT+cookie coexistence (API consumer), API-only signup+confirm with session+PAT response.

---

## Stage 2 — Execution

**Env:** Staging (`https://staging-upexbunkai.vercel.app`)
**Started:** 2026-06-23

### Smoke

- **Result: FAILED**
- Evidence: `evidence/BK-166-smoke-login.png`
- Notes: `/login` renders cleanly (no 500, console 0 errors / 0 warnings, all static assets 2xx), but the page is the OSS magic-link-only marketing login screen — a single `Email` field (`data-testid=login-email`) + disabled "Send magic link" button (enables once text is typed) + disabled OAuth buttons. There is **no "Continue" affordance, no password step, and no `EmailFirstForm`/`accountConfirmed` state machine** as described in `context.md` / the BK-166 source (`app/(auth)/login/email-first-form.tsx`). Typing the staging email into the field does not trigger any `check-email` call (confirmed via Network tab — 0 XHR/fetch requests fired) and produces no step transition. The BK-166 happy path (email -> Continue -> password -> submit -> `/projects`) is **not reachable on this deployment at all** — there is nothing to drive a password through.
- Corroborating API probe (curl, to rule out a UI-only regression before declaring env-level):
  - `POST /api/v1/auth/check-email` -> **404** (genuine Next.js "page could not be found" HTML shell, not a JSON `ApiError` — the route does not exist on this deployment)
  - `POST /api/v1/auth/confirm` -> **404** (same — genuine route-not-found, not a JSON error)
  - `POST /api/v1/auth/signup` (empty body) -> **422** `validation_failed` (route exists, Zod validates) — note: code reading expected `400` for a JSON-parse/`bad_request` style failure; the live deployment returns `422` for a Zod `invalid_type` failure. Status-code mismatch vs. the ATP's documented `400` is a secondary discrepancy, subordinate to the missing-route blocker.
  - `POST /api/v1/auth/signin` (empty body) -> **422** `validation_failed` (route exists, same status-code note as above)
  - `GET /api/v1/health` -> **200** (API surface itself is up; this is not a full outage)
- **Verdict: NO-GO.** Per exploration-patterns.md §4.3/§4.4 and the Finding-triage table ("smoke down, env down" = Blocking), this halts the pass. Deep UI/API/DB exploration (steps 3-5 of the dispatch) was **not executed** — there is no email-first UI to drive and 2 of the 4 required API routes 404. Proceeding would not produce meaningful PASSED/FAILED signal for the 42 outlines; it would only re-confirm the same missing-route blocker 42 times.
- **Root-cause hypothesis (not confirmed — Dev/PO to verify):** staging (`https://staging-upexbunkai.vercel.app`) appears to be serving a build that predates or excludes the BK-166 `email-first-form.tsx` + `check-email`/`confirm` routes, despite `comments.md` recording "PR #54 merged to `staging`" and "Ready for QA on staging" (Ely, 6/22/2026). Either (a) the deploy that included PR #54 did not promote to this specific Vercel staging alias, (b) this URL points at a different/older Vercel deployment than the one PR #54 shipped to, or (c) a routing/build config issue dropped 2 of the 4 routes during the most recent deploy. This is an environment/deployment investigation, not an application logic defect — cannot be diagnosed further from the QA side without deploy/CI visibility.

### UI Exploration

**Not executed — smoke failed (Blocking, per Finding-triage table).** All AC-mapped UI outlines below are recorded `BLOCKED` per §5.4 (no `NOT RUN` end-state permitted).

| AC | Scenario | Result | Evidence | Notes |
|----|----------|--------|----------|-------|
| AC1 / TC-01 | existing confirmed email -> password step | BLOCKED — smoke failure: feature not deployed | evidence/BK-166-smoke-login.png | No password step exists on this deployment; only a magic-link email field. |
| AC2 / TC-02 | unregistered email -> create step | BLOCKED — smoke failure: feature not deployed | evidence/BK-166-smoke-login.png | No create-account step exists on this deployment. |
| AC3 / TC-04 | signin happy path -> `/projects` | BLOCKED — smoke failure: feature not deployed | evidence/BK-166-smoke-login.png | No password field to submit; cannot reach `/projects` via this flow. |
| AC5 / TC-09 | wrong password -> generic error | BLOCKED — smoke failure: feature not deployed | evidence/BK-166-smoke-login.png | No password step to submit a wrong password into. |
| AC6 / TC-11 | unconfirmed account -> reroute to verify | BLOCKED — smoke failure: feature not deployed | evidence/BK-166-smoke-login.png | No `accountConfirmed` state machine present in the rendered UI. |
| AC9 / TC-07 | magic-link disclosure + OAuth disabled | BLOCKED — smoke failure: feature not deployed | evidence/BK-166-smoke-login.png | Cannot evaluate as designed: on this build, magic-link is the ONLY visible option (not a collapsed disclosure alongside a password-primary form per AC9's literal wording — "password primary" precondition does not hold here). OAuth buttons ARE present-and-disabled, consistent with AC9's OAuth sub-clause, but that alone does not satisfy the AC. |

### API Exploration

**Not executed beyond the corroborating smoke probe** (4 calls made to confirm the blocker is genuine, not a UI-only issue — see Smoke notes above). All boundary/negative/status-code-matrix outlines below are recorded `BLOCKED` per §5.4.

| Endpoint | Scenario | Expected | Actual | Result |
|----------|----------|----------|--------|--------|
| POST /check-email | any (TC-01/02/03/22/23/30) | 200/400 per outline | 404 (route not found) | BLOCKED — smoke failure: route not deployed |
| POST /signup | any (TC-06/08/15/16/17/18/23/32/36) | 202/400/409 per outline | route exists (422 on empty body — corroboration probe only; outline-specific bodies NOT sent) | BLOCKED — smoke failure: env-level blocker halts pass before outline-specific data was run |
| POST /signin | any (TC-04/05/09/10/14/17/18/20/23/24/27/28/29/34) | 200/400/401 per outline | route exists (422 on empty body — corroboration probe only; outline-specific bodies NOT sent) | BLOCKED — smoke failure: env-level blocker halts pass before outline-specific data was run |
| POST /confirm | any (TC-12/13/17/18/19/21/23/31/35) | 200/400/401 per outline | 404 (route not found) | BLOCKED — smoke failure: route not deployed |

| # | Title | Layer | Result | Note |
|---|-------|-------|--------|------|
| TC-01 | Route to password step for existing confirmed email | UI+API | BLOCKED | smoke failure: `check-email` 404s, no password step in UI |
| TC-02 | Route to create step for unregistered email | UI+API | BLOCKED | smoke failure: `check-email` 404s, no create step in UI |
| TC-03 | Case-insensitive routing for existing email | API | BLOCKED | smoke failure: `check-email` 404s |
| TC-04 | Sign in successfully with correct credentials | UI+API | BLOCKED | smoke failure: no password step in UI to submit credentials into; `signin` route exists but outline-specific body not exercised because the UI leg (required by this outline's Level=UI+API) cannot run |
| TC-05 | Mint PAT with default least-privilege scopes | API | BLOCKED | smoke failure: blocked transitively — TC-05 depends on a working `signin` call pattern proven end-to-end first per the dispatch order; not exercised this pass given the Blocking verdict |
| TC-06 | Return 202 pending_confirmation on fresh signup | API | BLOCKED | smoke failure: env-level blocker halts pass; `signup` route itself is reachable (422 on empty body) but full outline (valid fresh-email body) intentionally not run once Blocking verdict was reached |
| TC-07 | Keep magic-link fallback visible+functional | UI | BLOCKED | smoke failure: AC9 precondition ("password primary") does not hold on this build — see UI Exploration note |
| TC-08 | Accept Unicode password on signup | API | BLOCKED | smoke failure: pass halted before outline-specific data was run |
| TC-09 | Reject signin with wrong password (generic message) | UI+API | BLOCKED | smoke failure: no password step in UI |
| TC-10 | Reject signin for unknown email with same generic message | API | BLOCKED | smoke failure: pass halted before outline-specific data was run |
| TC-11 | Reroute unconfirmed account to verify, not "wrong password" | UI+API | BLOCKED | smoke failure: no `accountConfirmed` state machine in rendered UI |
| TC-12 | Reject wrong verification code (uniform message) | UI+API | BLOCKED | smoke failure: `confirm` route 404s; no verify step in UI |
| TC-13 | Reject valid-format code against email w/ no pending signup (E7) | API | BLOCKED | smoke failure: `confirm` route 404s |
| TC-14 | Enforce signin password-length boundary (parametrized 5/6/7) | API | BLOCKED | smoke failure: pass halted before outline-specific data was run |
| TC-15 | Enforce signup/confirm password-length boundary (parametrized 7/8/9) | API | BLOCKED | smoke failure: pass halted before outline-specific data was run; also intersects `confirm` 404 for the confirm leg |
| TC-16 | Reject signup for already-existing email | API | BLOCKED | smoke failure: pass halted before outline-specific data was run |
| TC-17 | Reject malformed JSON on every route (x4) | API | BLOCKED | smoke failure: 2 of 4 target routes (`check-email`, `confirm`) 404 outright — cannot validate "malformed JSON -> 400" on a route that doesn't exist |
| TC-18 | Reject missing required field on every route (x4) | API | BLOCKED | smoke failure: same as TC-17 — 2 of 4 routes unreachable |
| TC-19 | Reject confirm w/ wrong code against just-created pending signup | API | BLOCKED | smoke failure: `confirm` route 404s |
| TC-20 | Reject unrecognized `pat_scopes` value at schema layer | API | BLOCKED | smoke failure: pass halted before outline-specific data was run |
| TC-21 | Enforce OTP length boundary at schema layer (parametrized 5/6/8/9) | API | BLOCKED | smoke failure: `confirm` route 404s |
| TC-22 | Accept email at exactly RFC-5321 254-char max | API | BLOCKED | smoke failure: `check-email` 404s |
| TC-23 | Reject email exceeding 254-char max (x4 routes) | API | BLOCKED | smoke failure: 2 of 4 target routes 404 |
| TC-24 | Accept `pat_expires_in_days` boundary 1 / reject 366 | API | BLOCKED | smoke failure: pass halted before outline-specific data was run |
| TC-25 | Model email-first routing entry transitions | Integration | BLOCKED | smoke failure: `check-email` 404s; no routing exists to model |
| TC-26 | Keep never-confirmed account pending across repeated checks | API | BLOCKED | smoke failure: `check-email` 404s |
| TC-27 | Resolve PAT scope issuance per (scope-set x admin-flag) (parametrized) | API | BLOCKED | smoke failure: pass halted before outline-specific data was run |
| TC-28 | Resolve signin outcome per (confirmed? x correct?) | Integration | BLOCKED | smoke failure: pass halted before outline-specific data was run; also depends on `check-email`-driven `accountConfirmed` flag which cannot be set without that route |
| TC-29 | PAT session + cookie session coexist without clobbering (AC10) | Integration | BLOCKED | smoke failure: pass halted before outline-specific data was run. DB cross-validation leg was ALREADY deferred per Stage 1 (DBHub MCP unavailable) — both legs of this outline are now blocked for independent reasons |
| TC-30 | Reject structurally invalid email at schema layer (x4 reasons) | API | BLOCKED | smoke failure: `check-email` 404s |
| TC-31 | Token replay proxy (charter) | API | BLOCKED | smoke failure: `confirm` route 404s |
| TC-32 | Concurrent signup race (charter) | API | BLOCKED | smoke failure: pass halted before outline-specific data was run |
| TC-33 | SQL/script injection in email field (charter) | API | BLOCKED | smoke failure: pass halted before outline-specific data was run on `signup`/`signin`; `check-email` leg specifically 404s |
| TC-34 | Unicode/emoji password on signin (charter) | API | BLOCKED | smoke failure: pass halted before outline-specific data was run |
| TC-35 | Expired-then-reused OTP (charter, A1 partially blocked) | API | BLOCKED | smoke failure: `confirm` route 404s |
| TC-36 | Double-submit signup (charter) | UI | BLOCKED | smoke failure: no signup form reachable from this login page at all |

### DB Exploration (deferred)

**Not executed — DBHub MCP unavailable this session (orchestrator preflight task #1 still in_progress), independently of the smoke-failure blocker above.** No DB-only outline in the Stage-1 set carried a standalone DB-layer row beyond TC-29's DB cross-validation leg (already noted there); recorded here for completeness per the dispatch's required table.

| Check | Expected | Actual | Result |
|-------|----------|--------|--------|
| `access_tokens` row exists after TC-04/05 signin | 1 row, correct `user_id`/`scopes` | not queried | BLOCKED — DBHub MCP unavailable this session (compounded by smoke failure: TC-04/05 themselves did not run) |
| `access_tokens` rows for TC-29 (Karim + Sara, 2 independent signins) | 2 distinct rows, same `user_id`, independent `id`s | not queried | BLOCKED — DBHub MCP unavailable this session (compounded by smoke failure) |

### Findings (carry to Stage 3)

- **Finding 1 (BLOCKING):** Staging deployment of `https://staging-upexbunkai.vercel.app/login` does not serve the BK-166 email-first password-signin UI at all — only a magic-link-only login form (no "Continue"/password/create/verify steps, no `EmailFirstForm` composition). Confirmed via DOM snapshot + 0 fired XHR/fetch on email input.
- **Finding 2 (BLOCKING, corroborating):** `POST /api/v1/auth/check-email` and `POST /api/v1/auth/confirm` return genuine Next.js 404 (page-not-found HTML, not a JSON `ApiError`) on staging — 2 of the 4 BK-166 routes are absent from this deployment. `signup` and `signin` DO exist and return structured JSON validation errors.
- **Finding 3 (non-blocking, secondary):** On the `signup`/`signin` routes that DO exist, an empty-body POST returns `422` with code `validation_failed`, where the ATP / route-source reading expected a `400 bad_request`-shaped failure for a request that fails Zod parsing. Needs reconciliation — may be a framework-level Zod-to-HTTP-status mapping difference between what was read in source vs. what's actually deployed, or the deployed build differs from the `route.ts` Stage 1 read. Logged for Stage 3 / dev follow-up, not blocking on its own.
- **Finding 4 (non-blocking, scope note):** AC9 ("magic-link fallback visible, password primary") cannot be evaluated as written against this build, because on this build magic-link is NOT a fallback — it is the only available method. The literal AC precondition ("password primary") does not hold. This is a symptom of Finding 1, not an independent defect.
- **Obs:** `GET /api/v1/health` returns 200 — ruling out a full environment outage; this is a partial/inconsistent deployment, not a dead environment.
- **Obs (carried from Stage 1, unresolved by this pass):** AC4/AC11 remain NOT VERIFIABLE IN THIS ENVIRONMENT (no real OTP delivery; no service-role key) — independent of, and in addition to, today's smoke-failure blocker.
- **Obs (carried from Stage 1, unresolved by this pass):** DBHub MCP unavailable — all DB-layer cross-validation (TC-29 included) BLOCKED, independent of the smoke-failure blocker.

---

## Stage 2 — Execution (re-run, 2026-06-24)

**Env:** Staging (`https://staging-upexbunkai.vercel.app`)
**Started:** 2026-06-24
**Trigger:** Ely, Jira comment #11752, 2026-06-24: "Staging fully live + verified (real OTP delivery working). Production NOT deployed (app not launched to prod yet — gated until further notice)." Re-running the SAME 42 outlines from `acceptance-test-plan.md` against the SAME staging URL — Stage 1 was not redone.

### Pre-execution: Jira transition attempt

- Resolved `start_testing` (Ready For QA → In Test) from `.agents/jira-workflows.json` — not applicable, current status is BLOCKED, not Ready For QA.
- Checked for a BLOCKED → In Test path: `back_from_blocked` (id 21, "back", blocked → in_test) IS defined in the workflow scheme.
- Attempted `acli jira workitem transition --key BK-166 --status "In Test" --yes` → **failed**: `No allowed transitions found for given status`.
- Verified directly via `GET /rest/api/3/issue/BK-166/transitions` → `{"transitions":[]}` (HTTP 200, empty array) — Jira itself currently exposes **zero** allowed transitions from BLOCKED on this issue, despite `back_from_blocked` existing in the workflow scheme definition (likely a transition condition/validator not satisfied, e.g. permission or screen scheme — not diagnosable further from the QA side).
- **Decision:** proceeded with testing regardless, per dispatch instruction. `skipped_reason: transition_not_available_from_blocked`.

### Smoke

- **Result: PASSED**
- Evidence: `evidence/BK-166-smoke-login-rerun.png`
- Notes: `/login` now renders the full BK-166 email-first password-signin UI — email field + "Continue" (enables on input), which reveals either a password step ("Sign in") or a create-account step ("Create account") depending on `check-email`'s `exists` flag, plus "Use a different email" to go back. Magic-link is now a collapsed secondary option ("Email me a link instead", expands to a working `MagicLinkForm`), not the only method. OAuth buttons present-disabled with "soon" tags. Console: 0 errors / 0 warnings on initial load.
- Corroborating API probes (curl, all 4 routes + health):
  - `POST /api/v1/auth/check-email` (empty body) → **422** `validation_failed` (structured JSON `ApiError`, NOT a 404 — route exists)
  - `POST /api/v1/auth/confirm` (empty body) → **422** `validation_failed` (structured JSON `ApiError`, NOT a 404 — route exists)
  - `POST /api/v1/auth/signup` (empty body) → **422** `validation_failed`
  - `POST /api/v1/auth/signin` (empty body) → **422** `validation_failed`
  - `GET /api/v1/health` → **200** `{"ok":true,"service":"bunkai-tms","env":"staging"}`
- **Verdict: GO.** Both BK-177 claims (missing UI, 404'd routes) are resolved. Proceeded to deep exploration per dispatch step 4.
- **New discovery during smoke (carried to Findings, non-blocking):** `check-email` against `{{STAGING_USER_EMAIL}}` returns `{"exists":true,"confirmed":false}` — the shared test account is NOT confirmed on this deployment, contrary to the ATP's Stage-1 assumption ("AC1 confirmed acct exists"). This is a test-data state gap, distinct from BK-177's deploy/build gap. See Findings.

### UI Exploration

| AC | Scenario | Result | Evidence | Notes |
|----|----------|--------|----------|-------|
| AC1 / TC-01 | existing confirmed email → password step | BLOCKED — test-data gap | evidence/BK-166-smoke-login-rerun.png | Email routes to password step correctly (UI logic verified), but `{{STAGING_USER_EMAIL}}` is `confirmed:false`, not `confirmed:true` — cannot demonstrate the "confirmed" precondition's specific UI outcome (stays password-step-then-success) since signin there always reroutes to verify. |
| AC2 / TC-02 | unregistered email → create step | PASSED | evidence (page snapshot, create-password step shown) | Fresh email → create-password field shown, signin field never rendered, matches `check-email` 200 `{exists:false,confirmed:false}`. |
| AC3 / TC-04 | signin happy path → `/projects` | BLOCKED — test-data gap | — | Same root cause as TC-01: no confirmed account available to drive a successful signin redirect. |
| AC5 / TC-09 | wrong password → generic error | BLOCKED — test-data gap (UI leg only) | — | API leg's message format independently verified consistent via TC-10. UI leg cannot show the "wrong password" text specifically because `accountConfirmed=false` always reroutes to the verify-step message instead, regardless of password correctness. |
| AC6 / TC-11 | unconfirmed account → reroute to verify | PASSED | evidence/BK-166-ac6-unconfirmed-reroute.png | Email→Continue→any password→401→client reroutes to verify step with "Verify your email with the code we sent before signing in." — NOT the generic wrong-password text. Exactly per spec. |
| AC9 / TC-07 | magic-link disclosure + OAuth disabled | PASSED | evidence/BK-166-tc07-magic-link-disclosure.png | Collapsed by default, "Email me a link instead" expands to a working `MagicLinkForm` (email field + "Send magic link"); OAuth buttons present-disabled with "soon" tags, password is now the primary method (subtitle: "Sign in with your email and password — or create an account"). AC9 fully satisfied — Finding 4 from the prior session (precondition didn't hold) is now resolved. |
| TC-36 | double-submit signup guard | PASSED (confounded signal, see note) | evidence/BK-166-tc36-double-submit-guard.png | Rapid double-click on "Create account" fired exactly ONE `signup` fetch (network log: 1 POST, not 2) — the `submitting` guard works. The single fetch itself returned 429 (Supabase email rate limit, exhausted by this session's heavy signup testing) rather than 202 — does not affect the guard verdict (request COUNT is what TC-36 tests), but means the "successful 202 after guard" half of the happy path wasn't independently re-confirmed here. |

### API Exploration

| Endpoint | Scenario | Expected | Actual | Result |
|----------|----------|----------|--------|--------|
| POST /check-email | empty body (smoke corroboration) | structured error, not 404 | 422 `validation_failed` | PASSED (route confirmed live) |
| POST /check-email | TC-02 fresh email | 200 `{exists:false,confirmed:false}` | 200, exact match | PASSED |
| POST /check-email | TC-03 case-insensitive (UPPER vs lower) | identical result both cases | 200, both `{exists:true,confirmed:false}` | PASSED |
| POST /check-email | TC-22 email exactly 254 chars | 200 | 200 | PASSED |
| POST /check-email | TC-23 email 255 chars | 422 `validation_failed`, `.max(254)` | 422, `too_big` maximum 254 | PASSED |
| POST /check-email | TC-25 nonexistent + unconfirmed-known legs | exists:false / exists:true,confirmed:false | matched | PASSED (confirmed leg unavailable — test-data gap) |
| POST /check-email | TC-26 repeated checks (minutes apart) | both `{exists:true,confirmed:false}` | both calls identical | PASSED |
| POST /check-email | TC-30 ×4 malformed-email reasons | 400/422 `validation_failed` on all 4 | 422 on all 4, `invalid_format` | PASSED (status-code note: 422 not literal "400", see Findings) |
| POST /check-email | TC-33 SQL injection string | uniform rejection before reaching RPC/Supabase | 422 `invalid_format`, no 200/202/500 | PASSED (Critical charter clean) |
| POST /signup | TC-06 fresh email | 202 `{status:'pending_confirmation', email}` | 202, exact match | PASSED |
| POST /signup | TC-08 Unicode/emoji password | 202, same shape | not run — Supabase email rate limit (429) for the duration of this pass | BLOCKED — upstream throttle |
| POST /signup | TC-15 row1 (pw len 7) | 422/400 `too_small` minimum 8 | 422, exact match | PASSED |
| POST /signup | TC-15 rows 2/3 (pw len 8/9) | 202 both | not run — Supabase email rate limit (429) | BLOCKED — upstream throttle |
| POST /signup | TC-16 existing email (explicit/obfuscated 409) | 409 `conflict` | 429 `rate_limited` (could not isolate from throttle in 2 attempts) | BLOCKED — upstream throttle (G1 still unresolved) |
| POST /signup | TC-17 malformed JSON | 400 `bad_request` | 400, exact match | PASSED |
| POST /signup | TC-18 missing fields | 400/422 `validation_failed` | 422, both fields flagged | PASSED (status-code note, see Findings) |
| POST /signup | TC-23 255-char email | 422 `.max(254)` | 422, exact match | PASSED |
| POST /signup | TC-32 concurrent signup race (charter) | one 202 "first", other 409/obfuscated | not run — Supabase email rate limit (429) | BLOCKED — upstream throttle |
| POST /signup | TC-33 script-injection email | uniform rejection | 422 `invalid_format` | PASSED |
| POST /signin | TC-09 wrong password (message format) | 401 uniform message | 401 `"Invalid email or password."` | PASSED (message format only — UI-leg distinction blocked, see UI table) |
| POST /signin | TC-10 unknown email, same message | 401 byte-identical to TC-09 | 401, byte-identical | PASSED |
| POST /signin | TC-11 (API leg) unconfirmed acct, any password | 401 uniform | 401, exact match | PASSED |
| POST /signin | TC-14 password length 5/6/7 (parametrized) | 5→400/422 reject · 6,7→401 | 5→422 `too_small` min 6 · 6,7→401 | PASSED |
| POST /signin | TC-17 malformed JSON | 400 `bad_request` | 400, exact match | PASSED |
| POST /signin | TC-18 missing password | 400/422 `validation_failed` | 422 | PASSED (status-code note) |
| POST /signin | TC-20 unrecognized `pat_scopes` enum value | 400/422 Zod enum reject | 422 `invalid_value`, before business logic | PASSED |
| POST /signin | TC-23 255-char email | 422 `.max(254)` | 422, exact match | PASSED |
| POST /signin | TC-24 `pat_expires_in_days` 366 reject leg | 400/422 `too_big` max 365 | 422, exact match | PASSED |
| POST /signin | TC-24 `pat_expires_in_days` 1 accept leg | 200, `expires_at`≈now+1d | 401 (blocked by unconfirmed test account) | BLOCKED — test-data gap |
| POST /signin | TC-27 R1/R2/R3/R5 (default/valid/admin/empty scopes) | 200 / 200 / 403 / NEEDS-CONFIRM | all 401 (auth check fires before reaching the scope business-rule layer; account unconfirmed) | BLOCKED — test-data gap (R1/R2/R3/R5 indistinguishable from each other under this account) |
| POST /signin | TC-27 R4 (`bogus:scope`) | 400/422 Zod enum reject, before business logic | 422 `invalid_value` | PASSED |
| POST /signin | TC-28 R1/R2 (confirmed × correct/wrong) | 200 / 401 "incorrect" | not reachable — no confirmed account | BLOCKED — test-data gap |
| POST /signin | TC-28 R3/R4 (unconfirmed × correct/wrong) | both 401 "verify your email" UX | both 401, uniform message, client reroutes to verify (confirmed in UI Exploration) | PASSED |
| POST /signin | TC-30 ×4 malformed-email reasons | 422 `validation_failed` | 422 on all 4 (same as check-email leg) | PASSED |
| POST /signin | TC-33 SQL-injection email | uniform rejection | 422 `invalid_format` + `too_small` password (compound, still no 200/500) | PASSED |
| POST /signin | TC-34 Unicode/emoji password | clean 401, no crash | 401, exact match | PASSED |
| POST /confirm | TC-12 wrong code, pending acct | 401 uniform message | 401 `"Invalid or expired verification code."` | PASSED |
| POST /confirm | TC-13 valid-format code, no pending signup (E7) | 401, identical to TC-12 | 401, byte-identical | PASSED |
| POST /confirm | TC-17 malformed JSON | 400 `bad_request` | 400, exact match | PASSED |
| POST /confirm | TC-18 missing token | 400/422 `validation_failed` | 422 | PASSED (status-code note) |
| POST /confirm | TC-19 fresh signup, immediate wrong code | 401, identical to TC-12 | 401, byte-identical | PASSED |
| POST /confirm | TC-21 OTP length 5/6/8/9 (parametrized) | 5,9→400/422 regex reject · 6,8→401 | 5,9→422 `invalid_format` regex · 6,8→401 | PASSED |
| POST /confirm | TC-23 255-char email | 422 `.max(254)` | 422, exact match | PASSED |
| POST /confirm | TC-31 token-replay proxy (charter) | identical 401 both submissions, no state leak | both submissions (minutes apart) → identical 401 | PASSED |
| POST /confirm | TC-35 expired-then-reused proxy (charter) | wrong code, wait, resubmit unchanged → still 401 | 401 both times (same data as TC-31 — same charter mechanics) | PASSED |

### DB Exploration (deferred)

**Not executed — DBHub MCP confirmed unavailable this session** (`DBHUB_*` and `API_TOKEN` empty in `.env`, per dispatch background) — independent of and in addition to the test-data gap below.

| Check | Expected | Actual | Result |
|-------|----------|--------|--------|
| `access_tokens` row exists after a successful signin | 1 row, correct `user_id`/`scopes` | not queried | BLOCKED — DBHub MCP unavailable (compounded: no successful signin was reachable this pass either, due to the unconfirmed test account) |
| `access_tokens` rows for TC-29 (2 independent signins, same account) | 2 distinct rows, same `user_id`, independent `id`s | not queried | BLOCKED — DBHub MCP unavailable (compounded: TC-29's API leg is itself blocked by the unconfirmed test account) |

### Findings (carry to Stage 3)

- **Finding 1 (RESOLVED — was BK-177):** Both prior-session BLOCKING findings are confirmed fixed. The BK-166 email-first password-signin UI is now fully present and functional on `https://staging-upexbunkai.vercel.app/login`. `POST /api/v1/auth/check-email` and `POST /api/v1/auth/confirm` now return structured JSON `ApiError` responses (422 on bad input), not 404. Verified via DOM snapshot, live signin/signup/confirm calls, and direct curl probes to all 4 routes.
- **Finding 2 (non-blocking, NEW — test-data gap, distinct from BK-177):** The shared `{{STAGING_USER_EMAIL}}` test account is `confirmed:false` on this deployment (`check-email` → `{"exists":true,"confirmed":false}`), not the "confirmed account" the Stage-1 ATP assumed as precondition for TC-01/TC-04/TC-05/TC-09(UI leg)/TC-16/TC-24(accept leg)/TC-27(R1/R2/R3/R5)/TC-28(R1/R2)/TC-29. No second staging credential exists in `.env` to substitute. A fresh signup cannot self-resolve this (would re-hit the same real-OTP-confirmation requirement as AC4/AC11, which the dispatch explicitly keeps out of scope this session — Ely's 2026-06-24 comment that "real OTP delivery [is] working" does not change this instruction). Recommend: dev/PO either (a) provides a second, already-confirmed staging credential, or (b) confirms `{{STAGING_USER_EMAIL}}` itself via the now-working OTP flow once, outside this QA session, so future passes can rely on it being a stable confirmed fixture.
- **Finding 3 (non-blocking, carried + now fully characterized):** The 422-vs-400 status-code discrepancy from the prior session is STILL PRESENT, but now precisely characterized: genuine JSON-parse failures (malformed/unparseable body) consistently return `400 bad_request` (confirmed across all 4 routes, TC-17); valid-JSON-but-failed-Zod-schema failures (missing field, wrong type, oversized, bad enum, regex mismatch) consistently return `422 validation_failed` (confirmed across TC-18, TC-20, TC-23, TC-27 R4, TC-30, TC-14, TC-15, TC-21, TC-24). This is a deliberate two-tier error model, not a build drift — the ATP's "400 validation_failed" expectation conflates the two tiers under one status code where the live app deliberately splits them. Recommend ATP correction at Stage 3/dev-sync, not a bug filing.
- **Finding 4 (non-blocking, NEW — upstream throttle, same category as AC8):** Supabase's free-tier email-send rate limit (`429 rate_limited "email rate limit exceeded"`) was hit repeatedly during this pass after ~6-8 signup calls in quick succession, independent of whether the email is ever read. This blocked TC-08, TC-15 (rows 2/3), TC-32, and a clean re-check of TC-16 from completing within this session. This corroborates AC8/A2's existing finding that the rate limiter is upstream-Supabase-owned, not Bunkai's — it also means signup-heavy outlines need to be paced/spread out or use a dedicated low-volume test window. Recommend: re-attempt the 4 blocked outlines in a follow-up pass after the throttle window resets, or request a higher Supabase email-send quota for the staging project's QA usage.
- **Finding 5 (non-blocking, scope note, RESOLVED):** AC9's precondition ("password primary") now holds — magic-link is correctly a collapsed secondary option, not the only method. The prior session's Finding 4 (precondition didn't hold) is resolved as a direct consequence of Finding 1.
- **Obs:** `GET /api/v1/health` returns 200 throughout this pass — environment stayed stable end to end, no new outage.
- **Obs (carried from Stage 1, unresolved by this pass, by explicit instruction):** AC4/AC11 remain NOT VERIFIABLE IN THIS ENVIRONMENT this session — not re-attempted, per dispatch instruction, even though Ely's 2026-06-24 comment states real OTP delivery is now working (the no-service-role-key constraint is independent of delivery capability and was not waived for this session).
- **Obs (carried from Stage 1, unresolved by this pass):** DBHub MCP unavailable — all DB-layer cross-validation (TC-29's DB leg included) BLOCKED, independent of the other findings above.
- **Obs (Jira workflow):** BK-166's BLOCKED status currently exposes zero allowed transitions via the Jira API (`GET /rest/api/3/issue/BK-166/transitions` → empty array), despite a `back_from_blocked` transition existing in the workflow scheme definition. Could not move the ticket to In Test this session; flagged for Stage 3 / Jira admin follow-up, not a QA-side defect.

---

## Stage 3 — Reporting (re-run, 2026-06-24)

**Consumes:** the Stage 2 re-run block above (30 PASSED / 0 FAILED / 2 NOT VERIFIABLE / 10 BLOCKED-test-infra, total 42).

### Result

**PASSED WITH ISSUES (30/42).** Zero application defects found this pass; 10 outlines could not be exercised due to environment/test-data constraints outside the application's control (unconfirmed shared test account + Supabase free-tier email-send cap), not app logic. Not a clean pass (10 outlines unverified) and not blocked (no defects, no env-down finding).

### ATR

- Authored per `reporting-templates.md` §2.2 body structure with the full 42-outline table (30 PASSED / 0 FAILED / 2 NOT VERIFIABLE / 10 BLOCKED, each with reason), BK-177-resolved confirmation, and the 422-vs-400 two-tier-model resolution (no action needed).
- **Field write attempt** (Modality jira-native primary path): converted MD → ADF via `md-to-adf.ts` (validated clean), wrapped in REST PUT envelope, `PUT /rest/api/3/issue/BK-166` against `customfield_10147` → **HTTP 400**: `"Field 'customfield_10147' cannot be set. It is not on the appropriate screen, or unknown."` The field IS in the workspace catalog (`.agents/jira-fields.json` resolves it) — this is a screen-scheme restriction on this issue, not an absent-field case, but it degrades to the same fallback per §1.10.4 / §2.3.
- **Fallback used**: posted the full ATR body as a `## Acceptance Test Results (ATR)` comment (Jira comment **#11753**, 2026-06-24T09:39:16-03:00), per the documented fallback pattern, with an explicit note at the top flagging the field-write failure and reason.
- **Cache materialization**: `bun run jira:sync-issues get BK-166 --include-comments` initially failed (`'Historia' is routed via pull/epic/story, not as a standalone issue — skipped`) — corrected to `bun run jira:sync-issues pull --story BK-166 --include-comments` (5 files updated). `comments.md` now contains the new ATR comment verbatim (confirmed by grep). **`acceptance-test-results.md` itself was NOT updated** — the sync's ATP/ATR precedence reads the Story custom field first, and since the custom-field write never succeeded (only the comment was posted), the cached file still mirrors the stale 2026-06-23 `FAILED (0/42)` body. This is a known, faithfully-reported limitation of the comment-fallback path, not a sync bug — the comment itself (source of truth for this pass) is correctly in `comments.md`.

### QA comment

- Posted **ONE** combined comment (Jira comment **#11754**, 2026-06-24T09:40:35-03:00) containing:
  1. The PASSED WITH ISSUES summary (30/42, 0 defects, BK-177 verified fixed, AC4/AC11 NOT VERIFIABLE unchanged, 10 BLOCKED test-infra with the explicit ask: second pre-confirmed staging account OR a cooldown window past the Supabase send-cap).
  2. A clearly separated `[!WARNING]` panel technical note flagging BOTH the zero-live-transitions-from-BLOCKED gap AND the related `customfield_10147` screen-scheme write failure, framed as independent of this QA result and worth a Jira-admin look.
- Authored in Markdown, converted via `md-to-adf.ts` (validated clean), posted via `acli jira workitem comment create -F`.

### Transition attempt

- Per §5.1, a PASSED WITH ISSUES Story result takes the same transition path as a normal PASSED sign-off. Attempted `acli jira workitem transition --key BK-166 --status "QA Approved" --yes` → **failed**: `No allowed transitions found for given status` — identical failure mode to the pre-execution attempt logged in the Stage 2 re-run block.
- Re-verified via REST: `GET /rest/api/3/issue/BK-166/transitions` → `{"transitions":[]}` (still empty).
- **Recorded as `transition_skipped: "no_live_transitions_from_blocked"`** — per dispatch instruction, this is NOT treated as a dispatch failure. The QA comment (above) already surfaces the gap to Ely / Jira admin. No raw status-field write attempted (would bypass the documented transition endpoint — explicitly out of bounds per the dispatch rules).

### Bugs filed

None. Zero application defects found this pass. The test-data/rate-limit gap is an environment/process issue, fully covered by the QA comment's ask — not filed as a bug, per explicit dispatch instruction.

### Checklist (Stage 3 re-run)

- [x] All Stage 2 re-run TCs have a final status (PASSED / NOT VERIFIABLE / BLOCKED — no NOT RUN)
- [x] No new bugs to file this pass (explicit instruction — test-infra gap, not app defect)
- [x] ATR body written in §2.2 format
- [ ] ATR uploaded to `{{jira.acceptance_test_results}}` (customfield_10147) — **failed at runtime (HTTP 400, screen-scheme), fell back to comment**
- [x] ATR comment fallback posted (#11753)
- [x] Synced cache materialized (`comments.md` confirmed; `acceptance-test-results.md` NOT refreshed — see ATR section above for why)
- [x] QA comment posted, combining PASSED WITH ISSUES summary + Jira-transitions technical note (#11754)
- [x] Transition attempted; failure recorded as `transition_skipped`, not a dispatch failure
- [x] `test-session-memory.md` updated (this section + Stage-State Table row)
- [ ] `context.md` Final Status block updated — pending (next edit in this same dispatch)

**Checklist: 8/10** (the 2 unchecked items are the documented, expected degraded states — field write and full cache refresh — not omissions)

### TMS Artifacts (re-run)

| Artifact | Location | Status |
|----------|----------|--------|
| ATR | `customfield_10147` (write failed, HTTP 400) → fallback comment **#11753** | Posted via fallback; field itself still holds 2026-06-23 stale value |
| QA comment | Jira comment **#11754** | Posted — combined PASSED WITH ISSUES + transitions technical note |
| Local ATR cache | `acceptance-test-results.md` | Stale (mirrors customfield, not the fallback comment) — see ATR section |
| Local comments cache | `comments.md` | Fresh — contains both #11753 and #11754 verbatim |


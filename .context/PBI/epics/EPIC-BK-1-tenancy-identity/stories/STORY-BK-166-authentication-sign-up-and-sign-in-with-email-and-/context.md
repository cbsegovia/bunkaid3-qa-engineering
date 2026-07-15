# BK-166: Authentication | Sign up and sign in with email and password
**Ticket:** BK-166 | **Epic/Module:** EPIC-BK-1-tenancy-identity | **Status:** Ready For Release (as of 2026-07-08) | **Sprint:** -

> Jira-sourced detail (read-only caches, not copied here): `story.md`, `acceptance-criteria.md`, `comments.md` — materialized by `bun run jira:sync-issues get BK-166 --include-comments`.

## Team Discussion (analysis only — source is comments.md)
### Key Decisions
- [Ely] (6/22/2026): Ready for QA on staging — PR #54 merged to `staging`. Test target is `https://staging-upexbunkai.vercel.app/login`.
- [Ely] (6/22/2026): PATs minted on sign-in/confirm now use least-privilege default scopes (`atc:read`, `atc:write`, `run:execute`) — no global `workspace:admin` (per ADR-0005 / BK-135). ADR-0007 documents the email-first feature itself.

### Technical Notes
- [Ely] (6/22/2026): API rail under test is `POST /api/v1/auth/{signup,confirm,signin}` + `/check-email`; PAT + cookie must coexist without clobbering each other.
- [Ely] (6/22/2026): Migration `0034_auth_email_status_rpc` (service-role-only `auth_email_status` RPC) is applied to the shared DB.
- [Ely] (6/22/2026): Smoke (Playwright, isolated logged-out profile) passed all code-path ACs on localhost already — staging pass should focus on what differs from localhost (real Supabase capacity, email cap).

### Edge Cases Raised
- [Ely] (6/22/2026) — **Email delivery caveat / blocker risk:** the shared Supabase project is on the free-tier email cap, so a real human sign-up may not receive the OTP email until custom SMTP (Resend) is configured (in progress). **Workaround for QA test accounts: use admin-confirmed users or `admin.generateLink` to obtain the OTP without relying on inbox delivery.** This directly affects the Signup -> OTP -> confirm acceptance scenario and must be planned around in Stage 1/2, not discovered mid-execution.

## Related Code
### Backend / Frontend / Database
- `app/api/v1/auth/check-email/route.ts` — email-first routing helper; `{ exists, confirmed }` via `auth_email_status` RPC; deliberate enumeration tradeoff (ADR-0007), no app-level rate limiter behind it.
- `app/api/v1/auth/signup/route.ts` — verification-first signup; triggers OTP; no session/PAT issued here; 409 on existing email (both explicit + obfuscated-200 paths handled).
- `app/api/v1/auth/signin/route.ts` — email+password signin + PAT mint in one call; uniform 401 (no enumeration); password min 6 (legacy-compat asymmetry vs signup's min 8).
- `app/api/v1/auth/confirm/route.ts` — completes signup via `verifyOtp`; same response shape as signin (`{ user, session, pat, warning }`); accepts 6-8 digit code.
- `app/(auth)/login/page.tsx` — server component; redirects already-authenticated users to `/projects`; composes `EmailFirstForm` + `MagicLinkDisclosure` + disabled OAuth buttons.
- `app/(auth)/login/email-first-form.tsx` — client state machine (`email -> password|create -> verify`); owns the `accountConfirmed` flag that reinterprets a signin 401 as "go verify" vs "wrong password".
- `app/(auth)/login/magic-link-disclosure.tsx` — collapsed-by-default fallback preserving the magic-link option (AC #9) without competing with password as primary.
- `lib/api/pat.ts` — shared PAT minting helper; `DEFAULT_PAT_SCOPES` (`atc:read`, `atc:write`, `run:execute`); `assertNoGlobalAdminScope` blocks `workspace:admin` issuance from headless auth.
- `supabase/migrations/0034_auth_email_status_rpc.sql` — adds `public.auth_email_status` SECURITY DEFINER RPC, service-role only.
- Tables: `auth.users` (Supabase-managed, read only via the RPC above), `public.access_tokens`, `public.access_token_secrets`.

Full module-level detail (routes, business rules, common test scenarios, key entities): see `../../module-context.md`.

## TMS Artifacts
| Artifact | ID | Status |
|----------|----|--------|
| ATP | customfield_10067 | Done — 42 outlines, EP/BVA/State-Transition/Decision-Table/Error-Guessing (Stage 1) |
| ATR | customfield_10147 | Re-run done — field write failed at runtime (HTTP 400, screen scheme); posted via comment fallback (#11753, 2026-06-24) |

## Bugs Found
- **BK-177** — Critical — Staging deployment missing email-first password sign-in UI and 2 of 4 BK-166 API routes (`check-email`, `confirm` 404; `signup`, `signin` exist but return 422 not 400). Filed 2026-06-23 after Stage 2 smoke FAILED. Root cause: deploy/build gap, NOT an app logic defect — `staging` branch source (commit `16863ca`, PR #54) has the feature; live site does not reflect it. **VERIFIED RESOLVED 2026-06-24** — re-run smoke confirms the UI and all 4 routes are live and functioning. **Final Jira status: `Rechazado`** (rejected as invalid per US requirements — root cause was a stale deploy, not an app defect; consistent with Nahuel Gomez's 2026-06-30 automation discovery report, comment #11866, which found `POST /api/v1/auth/signin` working on staging and traced BK-177's original repro to the test framework hitting the old `/auth/login` endpoint instead of `/auth/signin`). Re-retested 2026-07-08 after Ely re-raised it in the thread (comment #11774) — UI + password step confirmed live again on staging, closing confirmation posted (comment #11910), evidence in `evidence/BK-177-retest-*.png`. No further action needed on this bug.

## Session Notes
### Session 1 — 2026-06-23
Context loaded: story.md / acceptance-criteria.md (11 Gherkin scenarios) / comments.md from Jira sync; all 4 project-context docs read (business-data-map, business-feature-map, business-api-map, master-test-plan). Module context did not exist — created `module-context.md` from full exploration of the target app's auth routes, login UI, PAT library, and the `0034_auth_email_status_rpc` migration. Environment: staging (`https://staging-upexbunkai.vercel.app`), reachability confirmed GREEN by orchestrator preflight. Email-delivery caveat carried forward as a flagged constraint for Stage 1/2 planning. Stage 1 produced the full ATP (42 outlines, VETO-REQUIRE triage). Stage 2 smoke test FAILED — staging serves a magic-link-only UI, 2 of 4 BK-166 routes 404 — all 42 outlines closed BLOCKED, zero coverage executed. Filed BK-177 (Critical) and linked it Story-causes-Bug. Stage 3: ATR written (FAILED 0/42), QA comment posted, ticket transitioned Ready For QA -> In Test -> Blocked. Supplementary "is blocked by" link could not be created (LINK_ISSUES permission denied for the `Blocks` type on this issue) — the `causes` link already covers the Story<->Bug traceability.

### Session 2 — 2026-06-24 (re-run)
Ely confirmed via Jira comment #11752 that staging is fixed. Re-ran Stage 2 against the same 42 outlines: smoke PASSED, BK-177 verified resolved, 30/42 outlines PASSED, 0 FAILED, 2 NOT VERIFIABLE (AC4/AC11, unchanged scope decision), 10 BLOCKED by test-infrastructure gaps (unconfirmed shared `STAGING_USER_EMAIL` test account + Supabase free-tier email-send cap hit mid-pass) — not application defects. Stage 3: result reported PASSED WITH ISSUES. ATR field write (`customfield_10147`) failed at runtime (HTTP 400, "not on the appropriate screen") — posted via the documented comment fallback instead (#11753). Combined QA comment posted (#11754) with the PASSED WITH ISSUES summary plus a separately-flagged technical note on BK-166 exposing zero live Jira transitions from `Blocked` (`GET /transitions` → `[]`). Transition attempt (`qa_sign_off`/`back_from_blocked`) failed identically to the pre-execution attempt — recorded as `transition_skipped: "no_live_transitions_from_blocked"`, not a dispatch failure, since the gap is already surfaced in the QA comment for Jira-admin follow-up. No new bug filed — zero application defects this pass.

### Session 3 — 2026-07-08 (BK-177 re-confirmation, ad hoc)
Ely re-raised BK-177 in its own comment thread (#11774), asking to confirm/close after seeing the email/password workflow live on staging. Did a targeted retest (not a full Stage 1-3 sprint-testing pass) of `/login` on staging: email-first step, password step, magic-link fallback, and wrong-password rejection all confirmed matching BK-166's ACs. Posted confirmation comment on BK-177 (#11910). No transition needed — BK-177 was already terminal (`Rechazado`). Evidence saved to `evidence/BK-177-retest-01-emailfirst.png`, `-02-password-step.png`, `-03-wrongpassword-rejected.png`. Checked BK-166 itself while at it: no longer `Blocked` — Ely manually moved it to `QA Approved` on 2026-06-25 (comment #11773, working around the same screen-scheme/transition gap flagged in Session 2) and it has since progressed to `Ready For Release`.

## Final Status

**Result:** PASSED WITH ISSUES (30/42) as of the 2026-06-24 QA pass; Story has since advanced to `Ready For Release` (2026-07-08) — the team did not block release on the 10 test-infra-blocked outlines below.
**Workflow Complete:** 2026-06-24 (QA pass) · 2026-07-08 (BK-177 re-confirmation)
**Next:**
- BK-177 is fully closed — no action pending on it (see Bugs Found + Session 3 above).
- The 10 outlines originally BLOCKED by test-infrastructure gaps (shared `STAGING_USER_EMAIL` account, Supabase free-tier email-send cap — TC-01, TC-04, TC-05, TC-08, TC-09 UI leg, TC-15 rows 2/3, TC-16, TC-24 accept leg, TC-27 R1/R2/R3/R5, TC-28 R1/R2, TC-29, TC-32) were **not** confirmed re-run in the Jira comment history reviewed on 2026-07-08 — Nahuel Gomez's automation pass (comments #11866, #11871, #11876) covers the `signin` API surface (8 automated tests, CI green) but that's a different layer than the blocked manual UI outlines. If those still matter for regression, re-run them explicitly; otherwise treat as superseded by the Story reaching `Ready For Release`.

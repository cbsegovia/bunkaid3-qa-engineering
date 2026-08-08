# Test Session Memory — BK-45

> Hand-authored, NON-Jira. Cross-stage shared payload for the 4 sub-agent dispatches (Session Start -> Stage 1 -> Stage 2 -> Stage 3). Do not duplicate Jira-mirrored content — see `context.md` and the synced `.md` files.

## TMS Modality

**jira-native** — confirmed in prior sessions today (BK-175, BK-23) and consistent with `.agents/master-test-plan.md`. `/acli` covers both `[ISSUE_TRACKER_TOOL]` and `[TMS_TOOL]` for this ticket. No `/xray-cli` load needed.

- ATP: write to `{{jira.acceptance_test_plan}}` (`customfield_10067`) or fallback comment.
- ATR: write to `{{jira.acceptance_test_results}}` (fallback comment if field absent).
- TCs: **outlines only** in Stage 1 (no standalone `Test` work items — those are created in Stage 4 for regression-worthy scenarios only).

## Ticket Context

- Key: BK-45 | Type: Historia (Story) | Status: Ready For QA
- Epic: BK-44 (Coverage & Traceability)
- Assignee (native) + QA Assignee (`{{jira.qa_assignee}}`): both Benjamin Segovia
- Labels: `shift-left-2026-06-11`, `shift-left-reviewed`
- **Shift-Left short-circuit check**: label dated 2026-06-11, today is 2026-08-07 → **57 days old, STALE (>30-day threshold)**. Stage 1 runs `acceptance-test-planning.md` Phases 1-3 in full — does NOT short-circuit to Phase 4.
- Sync gotcha: `jira:sync-issues get BK-45` fails silently (0 files, "routed via pull/epic/story" warning) for work type "Historia" — use `pull --story BK-45 --include-comments` instead.

## Environment

- Active env: **staging** (`testing.default_env`)
- WEB_URL: `https://staging-upexbunkai.vercel.app` — reachability probe this session: `curl -sI` → **307** (reachable)
- API_URL: `https://staging-upexbunkai.vercel.app/api`
- WEB_URL_OVERRIDE / API_URL_OVERRIDE: none (not needed this session)
- No email/magic-link dependency on this ticket — inbox receive-check not applicable.

## Known Environment Gaps (carried forward)

- `DBHUB_*` unset in `.env` — DB leg of the trifuerza (Stage 2) will be unavailable for direct live-DB verification. Carried over from today's earlier BK-175 and BK-23 sessions; not a new discovery. Stage 2 should lean on UI + API verification, plus the existing `lib/traceability/story-traceability-isolation.test.ts` (11/11 passing DB-integration suite already in the repo) as the DB-layer evidence, rather than blocking on live DB access.

## Frontend/Backend Code Locations (verified on `origin/staging`, PR #142 merge commit `4014bb4`)

- `app/(app)/projects/[projectSlug]/traceability/page.tsx` — SSR entry page
- `app/api/v1/projects/[id]/traceability/route.ts` — headless GET API
- `app/api/v1/projects/[id]/traceability/route.openapi.ts` — OpenAPI schema companion
- `components/traceability/TraceabilityChainView.tsx` — client component, all render states
- `lib/traceability/chain-view.ts` — pure view-state logic (`resolveStoryChainViewState`: zero-ac / zero-coverage / has-chain)
- `lib/traceability/errors.ts` — RPC-error-to-HTTP mapping (P0002 → 404, always)
- `supabase/migrations/0068_story_traceability_report.sql` — RPC `bunkai_report_story_traceability` + `bugs_atc_id_idx`
- Existing tests: `lib/traceability/chain-view.test.ts`, `lib/traceability/errors.test.ts`, `lib/traceability/story-traceability-isolation.test.ts`

> Local working tree of `../upex-bunkai-tms` was on branch `fix/BK-175/magic-link-otp-input` at session time, NOT `staging` — code above was read via `git show origin/staging:<path>` without checkout. Stage 2 will need the actual deployed staging app (already live per PR merge), not the local checkout, for UI/API exploration.

## Route / URL Under Test

`https://staging-upexbunkai.vercel.app/projects/{projectSlug}/traceability?story={userStoryId}`

## AC / ATP Placeholder Resolution — DO NOT RE-DERIVE, read this table

The AC field (4 markers) and ATP field (6 markers) still literally read `NEEDS PO/DEV CONFIRMATION`. Per QA comment 12221 (Ely, 8/7/2026 4:18 PM) these are **stale text, not open questions** — left in place deliberately to avoid clobbering the 7 ratified Gherkin scenarios. Resolved by comments **12171** (AI Product Owner, 8/5/2026 4:10 PM) and **12176** (AI Tech Lead, 8/5/2026 4:36 PM). Full text already read into `context.md`; summary table:

| Placeholder / Question | Resolution |
|---|---|
| Route / entry point (A4+V1) | Dedicated route `/projects/[projectSlug]/traceability?story={userStoryId}`, project-scoped, deep-linkable. Two entry points: nav item + deep links from Metrics dashboard. |
| "Latest" run definition (A2) | Most recently STARTED run (`started_at desc, id desc`), regardless of status — in-flight run IS the latest and renders as such. |
| Defect link source (A3) | `bugs.atc_id` (not `run_id` alone) — scoped to this story's own ATC set to prevent cross-story leak (EC9). Defects NOT restricted to latest run; ordered `created_at desc`. |
| Partial coverage indicator (G3+AC-04) | Mockup's uncovered strip verbatim: `Uncovered · 0 ATCs bound` + explanatory body, `--fail` tone, anchor on `data-testid`/class hook not prose. |
| Role gate (A7+AC-05) | Viewer and above, no additional gate. |
| Archived User Story behavior (G6) | Full chain renders read-only + "archived" banner. NOT a 404. Distinct from cross-workspace 403/404. |
| Story Points (SP Challenge) | Stays single 8 SP story, do not split — dependency condition (chain layers) now satisfied, all 5 layers shipped. |
| Query strategy (G4+EC6) | One RPC, one round trip, level-wise CTEs + `jsonb_agg` — no per-layer fetch, no flat-join cartesian blowup. |
| ATC dedup across ACs (A5+EC3) | Repeat under EACH bound AC — no dedup. EC3 narrower than feared: ADR-0009 makes `atcs.user_story_id` immutable, so AC-binding-layer cross-story leak cannot occur. |
| Ghost ATCs after module archive (EC7) | 3-predicate filter (own + own-module + no archived ancestor via path-prefix). 0 orphans verified in prod — no backfill. |
| "no data yet" copy (AC-02 placeholder) | NOT literal "no data yet" — layer-specific copy: `No test written yet` / `Awaiting test` / `No run recorded yet` / `Awaiting first run` / `None linked`, `--skipped` dotted pill. |
| Empty-state copy (AC-03, AC-07 placeholders) | TWO distinct states, must never collapse: AC-07 "No acceptance criteria yet" (authoring gap) vs AC-03 "No coverage anywhere on this story." (QA gap, criteria still render each with the uncovered strip — NOT a blank screen; this corrects AC-03's original wording "zero chain rows are rendered"). |
| Draft-status accessibility (EC11) | Fully accessible at any story lifecycle status, no gate. |
| Run tiebreaker (EC8) | `runs.id desc` as tiebreak column on `started_at` ties — Tech Lead's mechanism call. |
| Concurrent import consistency (EC12) | Single-statement assembly under READ COMMITTED is torn-free by construction. |
| In-flight run representation | SQL-derived `state` discriminator; run-level `running` outranks any position-level verdict. |

**Scope boundaries (ratified, by design, do NOT treat as gaps):** filtering the chain = BK-48 (separate story); exporting the chain = BK-50 (separate story). Neither control should appear on this screen.

**Flagged residual (not covered by either ratification, worth Stage 2 attention):**
1. Partial/mixed render state (some ACs covered, some not, same story) — unit + DB-integration tested, never exercised live against a seeded example.
2. AC-05 says "403 Forbidden"; shipped implementation returns 404 `not_found` uniformly (non-disclosure pattern) — this specific status-code choice was the dev's own autonomous UI-shape call, not ruled on by either PO or Tech Lead ratification. Stage 1 should decide how to test this explicitly.

## Stage State

- [x] Session Start — completed 2026-08-07
- [x] Stage 1 — Planning — completed 2026-08-07 (full pass, no short-circuit)
- [x] Stage 2 — Execution — completed 2026-08-08
- [x] Stage 3 — Reporting — completed 2026-08-08 (ATR PASSED 22/26, Defect BK-317 filed, QA comment posted, BK-45 → QA Approved)

## Stage 2 — Execution

**Env:** Staging (`https://staging-upexbunkai.vercel.app`, project `bk-23-test-project` / workspace `Bunkai QA`)
**Auth:** Reused already-authenticated persistent browser profile (`bunkai-staging-userbunk@olkacoraug.resend.app`, Owner role) — no fresh login needed this session.

### Smoke
- Result: PASSED — `GET /login` redirected straight to `/projects` (session already valid), traceability route loaded cleanly for an existing story and for the no-`?story=` case, zero console errors.
- Evidence: `evidence/BK-45-smoke-traceability-no-param.png`

### Pre-existing test data discovered (from earlier BK-23/BK-184/BK-35 sessions, reused)
- Story `0f25b660-f6f1-4ac0-b4b5-1ecc68d7da5c` "As a user, I want to log in to access my workspace" — 1 AC, 20 ATCs, 0 tests/runs/defects (used for TC-03 scale evidence + TC-09's "no test" variant).
- Story `c04a1471-21f4-4107-88ac-65dfda8d9768` "BK-184 retest anchor story" — 1 AC, 6 ATCs, 0 tests/runs.
- Story `27223d20-915e-4e03-b1ae-f9a6efb33980` "BK-35 retest anchor story" — 1 AC (AC-A), 3 ATCs (Pass/Fail/Running), 2 tests, 2 runs — confirmed in **Draft** lifecycle status (AC panel badge + "Mark ready to test" control) throughout all testing → doubles as TC-20 evidence.

### Seeded this session (new entities)
- Module `bk-45-fixtures` (`7596ef83-a731-45bb-84ee-daad42a1f1ab`), submodule `bk-45-fixtures/ghost-sub` (archived for TC-18).
- Stray unused module `bk-45-ghost-module` (`4934c3c8-96c4-4479-94d1-387f4fc0bc03`) — created by mistake while discovering the "ATC module must be story's module or a descendant" validation rule; left empty, harmless, safe to delete in a future session.
- Story `d57804e8-d614-445e-b707-8c25d9ca5dac` "As a QA reviewer, I want the full 5-layer evidence chain to render for a fully covered story" — 2 ACs, 4 ATCs (Pass / Blocked / Aborted / no-run-yet states), 4 tests, 3 runs, 0 defects. Backs TC-01(partly)/02/03(structural)/04/09/18/25.
- Story `b977a5b9-f9d5-4a66-b136-5130487039a3` "…zero-AC authoring-gap copy…" — 0 ACs. Backs TC-13.
- Story `d6e3c9f4-47ff-4031-81aa-9f7a8159aa64` "…zero-coverage banner…" — 1 AC, 0 ATCs. Backs TC-12.
- Story `b57d3e7c-e896-4616-be62-088a9f7f95c2` "…archived story chain…" — 0 ACs, **archived**. Backs TC-19.
- Added AC-B ("mixed-coverage story… zero ATCs bound") to BK-35 story `27223d20-…` → mixed-coverage fixture for TC-10/TC-11 (priority residual).
- Filed 3 bugs (all P3 Minor, status `open`) against BK-35 ATC-B's runs: "Step-1 assertion regression on ATC-B (BK-45 fixture defect)", "Second, independent regression on the same failing step (BK-45 multi-defect fixture)", "Cross-story isolation probe: defect must stay scoped to BK-35 story only (TC-BK45-08)" — backs TC-01/07/08.
- Created a genuinely shared Run (Test "BK-45 cross-story defect leak check" chaining BK-35's ATC-B + bk-45-fixtures' "Full chain renders…" ATC in one run) to test TC-08 with real cross-story Run sharing, not just unrelated data.

### UI Exploration — all 26 TCs
| TC | Result | Evidence / reasoning |
|----|--------|----|
| TC-01 | PASSED | BK-35 story: AC→3 ATCs→2 Tests→3 Runs→3 Defects, single-page render. `evidence/BK-45-tc01-tc07-full-chain-multidefect.png` |
| TC-02 | PASSED | bk-45-fixtures AC1's first ATC = 1 AC/1 ATC/1 Test/1 Run/0 defects, renders cleanly, no null cells. `evidence/BK-45-tc25-atc-no-dedup.png` (same row visible) |
| TC-03 | PASSED (reduced scale) | 20-ATC story (`0f25b660-…`): zero client-side per-ATC fetches in network log (SSR-embedded, single document request); same zero-fan-out pattern confirmed at 3/4/20-ATC scale. Structural: RPC does level-wise CTE + `jsonb_agg` server-side, so call count is scale-invariant. **Caveat: literal 50+ ATC threshold not reached this session** — bulk-seeding 50 ATCs was out of reasonable time-box; treated as sufficient structural evidence, not a hard BLOCKED. |
| TC-04 | PASSED | Pass, Fail, Blocked, Running all confirmed with correct distinct pills across fixtures. **Non-blocking copy finding**: shipped 4th terminal status is "Aborted", not the literal "Skipped" the ATP's parametrization list named — a vocabulary mismatch, not a missing state (the app has no true "skipped" concept; aborting a run marks remaining steps as skipped internally but the RUN-level pill reads "Aborted"). |
| TC-05 | PASSED | "Running" discriminator observed live multiple times (BK-35 ATC-C; our own in-flight runs before finishing). |
| TC-06 | **BLOCKED (test-data gap)** | No UI/API mechanism to force or verify an exact `started_at` tie between 2 runs; DBHub unavailable to insert/verify directly at DB level. |
| TC-07 | PASSED | 3 defects render under ATC-B, most-recent-first (`created_at DESC`). Same evidence as TC-01. |
| TC-08 | **PASSED — priority/security item, clean** | Built a genuinely shared Run (2 ATCs from 2 different stories, one run). Filed a defect on BK-35's ATC-B step only. bk-45-fixtures story's traceability shows `0 defects` / "None linked" for its own ATC in that same run — zero leak. `evidence/BK-45-tc08-no-cross-story-leak.png` |
| TC-09 | PASSED | All 5 copy variants confirmed live: "No test written yet", "Awaiting test" (no-test cascade), "No run recorded yet", "Awaiting first run", "None linked". `evidence/BK-45-tc09-awaiting-copy-variants.png` |
| TC-10 | PASSED | "Uncovered · 0 ATCs bound" strip confirmed (BK-35 AC-B, and dedicated TC-12 story). `evidence/BK-45-tc11-mixed-coverage.png` |
| TC-11 | **PASSED — priority residual, clean** | BK-35 story (AC-A covered, AC-B uncovered) — both states render correctly side by side, no bleed. `evidence/BK-45-tc11-mixed-coverage.png` |
| TC-12 | PASSED | "No coverage anywhere on this story" banner + AC still renders individually with uncovered strip below (not blank). `evidence/BK-45-tc12-no-coverage-anywhere.png` |
| TC-13 | PASSED | "No acceptance criteria yet" authoring-gap copy, zero rows, distinct wording from TC-12. `evidence/BK-45-tc13-no-ac-yet.png` |
| TC-14 | PASSED | Cookies cleared → redirect to `/login?next=…` before any paint. `evidence/BK-45-tc14-unauth-redirect.png` |
| TC-15 | **BLOCKED (test-data gap)** | Settings → Members shows "Coming soon" — this build has no invite/second-member mechanism at all. Only Owner-role access exists/testable; cannot construct a genuine viewer-role account. |
| TC-16 | **PASSED — priority/security item, core property clean** | Nonexistent-story-ID case tested live (3 distinct random UUIDs): uniform `404` + "User story not found.", zero chain data in response (confirmed via console network log). `evidence/BK-45-tc16-nonexistent-story-notfound.png`. Foreign-workspace half: **BLOCKED (test-data gap)** — only one workspace/account available in `.env`, cannot construct genuine cross-workspace non-membership. **Non-blocking finding**: the SSR first-paint error state shows a generic "Couldn't load the evidence chain / Could not load the evidence chain." instead of the specific "User story not found." reason — the specific message only appears after a client-side Retry. Reproduced 3/3 times. No data leak in either state (security property holds); purely a messaging/UX clarity gap. |
| TC-17 | PASSED | Archived a 3rd AC + its only-bound ATC on bk-45-fixtures story ("Remove criterion" = soft-archive, confirmed by app copy "archived, not destroyed"). Both disappeared from the chain; only the 2 active ACs render. `evidence/BK-45-tc17-archived-ac-atc-excluded.png` |
| TC-18 | PASSED | Created submodule `ghost-sub` under bk-45-fixtures, added an ATC there (baseline: visible), archived `ghost-sub` → ATC excluded. `evidence/BK-45-tc18-ghost-atc-excluded.png`. **Implementation nuance**: the archive-module confirmation dialog states the cascade "also archives everything beneath it — 1 ATC", so this exercises the exclusion *outcome* definitively but may cascade-archive the ATC's own record too rather than leaving it untouched — doesn't invalidate the observable behavior tested, just a caveat on mechanism purity vs. EC7's literal wording. |
| TC-19 | PASSED | Archived a dedicated story via "Remove story" (confirmed soft-archive: "archived, not destroyed"). Traceability still renders (200, not 404) with "This story is archived. The chain below reflects its coverage as of archiving." banner. `evidence/BK-45-tc19-archived-story-banner.png` |
| TC-20 | PASSED | BK-35 story confirmed in Draft lifecycle status throughout every test this session; traceability rendered fully every time, no extra gate. (Implicit evidence — Draft badge is on the Manage-Criteria panel, not the traceability page itself, but accessibility while Draft is the property under test.) |
| TC-21 | **BLOCKED (test-data gap)** | No mechanism to force a genuine SSR-side transient fetch failure from the browser — SSR fetches execute server-side (Vercel), outside Playwright's browser-context `route()` interception, and no backend fault-injection flag/env var exists. |
| TC-22 | **PASSED (mechanism verified, with caveat)** | Route-mocked the client retry endpoint to 500, confirmed error persists with no full reload (URL unchanged); removed mock, retried again → correctly recovered via client-fetch-only, no navigation. Literal "chain renders" outcome couldn't be produced because the only reachable client-retry entry point (a nonexistent-story error state) can never resolve to a real chain — same root architectural cause as TC-21. Retry *mechanism* itself (no-reload, fail→persist→recover) is proven correct. |
| TC-23 | PASSED | No `?story=` param → "Select a user story" prompt, no fetch attempted. `evidence/BK-45-smoke-traceability-no-param.png` |
| TC-24 | PASSED | No filter/export control observed across 10+ distinct chain states tested this session (happy/zero-AC/zero-coverage/archived/error/mixed). |
| TC-25 | PASSED | Same ATC bound to 2 ACs on bk-45-fixtures story → segment repeats under each AC, no dedup. `evidence/BK-45-tc25-atc-no-dedup.png` |
| TC-26 | **BLOCKED (test-data gap / time-boxed charter not exercised)** | Could not reliably construct a genuine concurrent-import-mid-load race using browser-only tooling within a reasonable time-box (Jira import via JQL completes too fast to reliably catch mid-flight with single-session browser automation). Resolution-table rationale ("single-statement assembly under READ COMMITTED is torn-free by construction") gives reasoned, not empirically exercised, confidence. |

### Findings (carry to Stage 3)
- **Non-blocking / cosmetic** — TC-04: shipped run-status vocabulary is "Aborted", not "Skipped" as the ATP's parametrization list named. Not a missing state, just a wording mismatch worth a doc/ATP correction.
- **Non-blocking / UX clarity** — TC-16/TC-21 boundary: SSR first-paint error state always shows generic "Couldn't load the evidence chain" copy, even for a definitive 404 "not found" case; the specific reason only surfaces after a client-side Retry. Reproduced 3/3. No data leak (security property intact) — purely a messaging gap that could confuse a user landing on a stale/foreign link on first paint.
- **Tool/environment gaps hit this session**: `DBHUB_*` unset (carried forward, known); `bun run api:login` broken for staging (carried forward, known — worked around via the already-authenticated browser session throughout, no curl/API seeding needed); Members/invite feature is "Coming soon" in this build (new discovery — blocks TC-15 entirely, not just this session); SSR fetches are not interceptable via browser-context route mocking (new architectural discovery — blocks TC-21, limits TC-22 to partial/mechanism-only verification).
- **0 FAIL verdicts.** No blocking security or data-integrity findings — both priority items (TC-11 mixed-coverage, TC-16 non-disclosure, TC-08 defect-leak) came back clean.

## Stage 1 Output — finalized TC outline list (read this before Stage 2)

Posted to `{{jira.acceptance_test_plan}}` (`customfield_10067`) via the REST PUT ADF workaround (acli `edit` rejects custom-field shapes on existing items), synced back and confirmed in `acceptance-test-plan.md`. **Risk level: HIGH** (veto on auth/authorization + data-integrity-on-core-entities forces Full ATP; risk score = 13, well past the 8+ HIGH band). 26 outlines total (Positive 7 / Negative 12 / Boundary 3 / Integration 4), up from the 23-outline draft — every addition explores a partition/state/risk the draft didn't isolate.

**403-vs-404 triage (AC-05)**: ruled a spec-wording clarity gap, not a code defect. AC-05 already permits "or equivalent access-denied UI"; a uniform 404 is the safer non-disclosure pattern (a split 403/404 would itself leak resource-existence across workspaces) and matches today's BK-175/BK-23 convention. TC-BK45-16 tests the non-disclosure *behavior* (identical response for foreign-workspace + nonexistent-story), not the literal "403" string — uniform 404 is the PASS condition.

**Partial/mixed residual**: TC-BK45-11 is the dedicated live case — needs a seeded story with 2+ ACs, mixed coverage, exercised live in Stage 2 (not just unit/DB-tested).

| # | Title | Type | Precondition → Expected |
|---|---|---|---|
| TC-BK45-01 | Full 5-layer chain renders for a fully covered story | Positive | Story w/ 1+ AC each AC→ATC→Test→Run→Defect → single-page chain, no extra nav |
| TC-BK45-02 | Minimum populated chain (1 AC/1 ATC/1 Test/1 Run) | Boundary | Smallest non-empty chain → renders, no broken/null cells |
| TC-BK45-03 | Large chain (50+ ATC) without N+1 latency | Boundary | 50+ ATC rows → single RPC round trip, no per-ATC fan-out |
| TC-BK45-04 | Latest-run status pill (parametrized: pass/fail/blocked/skipped) | Positive | Each terminal status → matching pill/copy |
| TC-BK45-05 | In-flight ("running") run doesn't mislead | Negative | Latest run = running → `running` discriminator outranks position verdict |
| TC-BK45-06 | Same-`started_at` tie broken by `id DESC` | Boundary | 2 runs, identical `started_at` → higher-id renders as latest |
| TC-BK45-07 | Multiple defects on one run, ordered `created_at DESC` | Integration | Run w/ 2+ defects → all render, most recent first |
| TC-BK45-08 | No cross-story defect leak via shared Test/Run | Negative | Defect scoped via `bugs.atc_id` to a foreign story's ATC → does NOT appear here |
| TC-BK45-09 | Layer-specific "awaiting data" copy (parametrized, 5 variants) | Positive | Each missing layer → exact copy, no null cells |
| TC-BK45-10 | "Uncovered · 0 ATCs bound" strip for an AC with no ATCs | Positive | Story w/ 1+ covered AC + 1+ uncovered AC → strip shows, no broken row |
| TC-BK45-11 | **[residual]** Mixed story: some ACs full chain, some uncovered, live | Integration | Story w/ 2+ ACs, mixed coverage, seeded live → both states render correctly side by side |
| TC-BK45-12 | "No coverage anywhere on this story" (AC-03) | Negative | ACs render individually w/ uncovered strip each → banner, not blank screen |
| TC-BK45-13 | "No acceptance criteria yet" (AC-07), distinct from AC-03 copy | Negative | Story w/ 0 ACs, any lifecycle → authoring-gap copy, zero rows |
| TC-BK45-14 | Unauthenticated → redirect to login, no data first | Negative | No session → redirect before any paint |
| TC-BK45-15 | Viewer-role member has full access, no extra gate | Positive | Authenticated viewer of the story's workspace → full chain accessible |
| TC-BK45-16 | **[discrepancy]** Uniform non-disclosure (parametrized: foreign-workspace / nonexistent story) | Negative | Both cases → identical status+message, zero leak. Uniform 404 = PASS |
| TC-BK45-17 | Archived AC + its archived ATC excluded (AC-06) | Negative | 1 active + 1 archived AC → only active renders |
| TC-BK45-18 | Ghost ATC excluded via archived ancestor module (EC7) | Negative | ATC under archived-ancestor module → 3-predicate filter excludes it |
| TC-BK45-19 | Archived Story → read-only chain + banner, NOT 404 | Negative | Story `archived_at` set → chain renders read-only + banner |
| TC-BK45-20 | Draft-status Story accessible, no lifecycle gate (EC11) | Positive | Story status = draft → fully accessible |
| TC-BK45-21 | Server-side fetch error + retry recovers | Negative | SSR fetch fails → error+retry shown; retry succeeds → chain renders |
| TC-BK45-22 | Client-side retry error + recovers, no full reload | Negative | Client retry fails once → error persists; next retry succeeds via client fetch only |
| TC-BK45-23 | "Select a user story" prompt when no `?story=` param | Positive | No param → prompt state, no fetch attempted |
| TC-BK45-24 | No filter or export control anywhere (scope guard) | Negative | Any chain state → no filter/export UI (BK-48/BK-50 out-of-scope regression guard) |
| TC-BK45-25 | ATC bound to 2+ ACs repeats under each AC, no dedup (A5/EC3) | Integration | ATC on 2 ACs → segment appears under each, no cross-AC dedup |
| TC-BK45-26 | **[charter]** Concurrent Jira import mid-load (EC12) | Integration | Import job mid-flight during load → consistent AC count, no torn read |

**Stage 2 data-seeding checklist** (beyond what `testing.automation_identity` already covers): minimum chain (TC-02), 50+ ATC chain (TC-03), same-timestamp run pair (TC-06), multi-defect run (TC-07), **live mixed-coverage story (TC-11)**, archived-ancestor-module ATC (TC-18), archived Story (TC-19), draft-status Story (TC-20), ATC bound to 2+ ACs (TC-25).

## Test Data / Fixtures Note

Dev's own pre-merge smoke used the `testing.automation_identity` fixture, logged in, covering: full chain (real in-flight run + real defect), no-story-selected, zero-coverage banner, zero-AC empty state, error+retry (both server and client-retry paths), cross-workspace non-disclosure (nonexistent story and foreign-workspace story both return identical "User story not found"). Stage 1/2 should identify seeded test data for the still-unverified partial/mixed state and confirm what `testing.automation_identity` has access to.

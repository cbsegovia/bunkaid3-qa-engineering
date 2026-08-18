# BK-45: TMS-Traceability | Render full US to bug evidence chain in one read
**Ticket:** BK-45 | **Epic/Module:** EPIC-BK-44-coverage-traceability | **Status:** Ready For QA | **Sprint:** current

> Jira-sourced detail (read-only caches, not copied here): `story.md`, `acceptance-criteria.md`, `acceptance-test-plan.md`, `scope.md`, `out-of-scope.md`, `implementation-plan.md`, `comments.md` — materialized by `bun run jira:sync-issues pull --story BK-45 --include-comments` (the `get` subcommand routes work type "Historia" through `pull --story`, not a standalone fetch — see Gotcha below).

## Team Discussion (analysis only — source is comments.md)

### Key Decisions
- [Benjamin Segovia] (6/11/2026): Shift-Left QA refinement completed. 7 refined AC scenarios (later became AC-01..AC-07), 23 ATP test outlines, 11 open PO/Dev questions logged. SP recommendation 8.
- [Ely] (7/30/2026): Mockup delivered — `traceability-chain.html` (design plan §4.7). Mockup gate lifted this date.
- [Ely] (8/5/2026, 4:10 PM) — **AI Product Owner / Business Analyst ratification (comment 12171)**: closes all 11 open questions + all 4 AC placeholders + EC11. Full ruling table below.
- [Ely] (8/5/2026, 4:36 PM) — **AI Tech Lead ratification (comment 12176)**: closes the 7 items handed over by 12171, with a full RPC/query design (`bunkai_report_story_traceability`), ADR-0012 compliance statement, and 3 corrected/verified facts.
- [Ely] (8/7/2026, 4:11 PM) — **Ready for QA**: merged to `staging` via PR #142, branch `feature/BK-45-us-bug-traceability-chain`. Route confirmed live: `/projects/{projectSlug}/traceability?story={userStoryId}`.
- [Ely] (8/7/2026, 4:18 PM) — **QA note (comment 12221)**: the 10 `NEEDS PO/DEV CONFIRMATION` markers still in the AC/ATP fields (4 + 6) are STALE, not open — resolved by 12171 + 12176 on 2026-08-05. Left in place deliberately (rewriting the AC field risked clobbering the 7 ratified Gherkin scenarios). Scope boundaries (filtering → BK-48, exporting → BK-50) reconfirmed as absent-by-design. One residual flagged: the partial/mixed render state (some ACs covered, some not, on the same story) has unit + DB-integration coverage but was never exercised against a live seeded example.

### Technical Notes (from the AI Tech Lead pass, comment 12176)
- Single `SECURITY DEFINER` RPC, one round trip, level-wise CTEs + `jsonb_agg` — not a flat join (payload would fan out on 50+ ATC stories) and not per-layer fetches (banned by the PO as literal "in one read" violation).
- Scope resolution: `user_stories.module_id -> modules.project_id`, NEVER the nullable `user_stories.project_id` (fact the Tech Lead flagged as previously wrong on a sibling ticket).
- Defect scoping: `bugs.atc_id` (enforced by a DB trigger, `bugs_check_consistency`) — NOT `bugs.run_id` alone, which would leak defects from a different story sharing the same Test run (EC9).
- Archived filtering: 3 predicates (own `archived_at`, own module's `archived_at`, no archived ancestor by `modules.path` prefix). Verified 0 orphan ATCs in production — no backfill needed.
- "Latest run" ordering: `(started_at desc, id desc)` — total + stable, no new index needed.
- Concurrent-import consistency (EC12): single-statement assembly under READ COMMITTED is torn-free by construction — no locking needed.
- In-flight run state: SQL-derived `state` discriminator, run-level `running` outranks any position-level verdict (prevents a `passed` position rendering as final while the run can still abort).

### Edge Cases Raised (ATP §5, all HIGH/CRITICAL unless noted)
- EC1/EC2: unauthenticated + cross-workspace access — CRITICAL, tenant isolation.
- EC3: shared-ATC-across-stories via Test chaining — narrower than feared; ADR-0009 freezes `atcs.user_story_id` immutable, so AC-binding-layer leakage cannot occur; only the Test/Run *context* columns can show cross-story info, handled by the defect-scoping rule.
- EC6: 50+ ATC rows — must not cause N+1 (bar enforced by the single-RPC design).
- EC7: ghost ATCs after module-archive cascade (root cause found: `bunkai_archive_module_subtree`'s recursive arm halts at an already-archived intermediate module) — closed by the 3-predicate filter, 0 orphans in prod today.
- EC8: same-timestamp run tiebreaker — resolved (`id desc`).
- EC9: defect on a run belonging to a different story via shared Test — resolved by `atc_id` scoping.
- EC11: draft-status story accessibility — resolved, no lifecycle gate at any status.
- EC12: concurrent Jira import mid-read — resolved, single-statement snapshot.

## Related Code (verified against `origin/staging`, PR #142 — see Gotcha: local working tree was on an unrelated branch)

### Frontend / Backend (same Next.js repo — `../upex-bunkai-tms`)
- `app/(app)/projects/[projectSlug]/traceability/page.tsx` — SSR page. Resolves `projectId` from `projectSlug` + active-workspace cookie (same pattern as `metrics/page.tsx`, BK-46/47). No `userStoryId` query param → renders `TraceabilityChainView` with `userStoryId: null` (the "select a user story" prompt state). Server-side fetch failure → `initialError` set, same component renders the error+retry state.
- `app/api/v1/projects/[id]/traceability/route.ts` — headless `GET`. Validates `{id}` and `?story=` as UUIDs (400 otherwise). Auth required. `{id}` (project) is routing context ONLY — not passed to the RPC; the RPC derives its own project scope from the story. A `story` belonging to a *different* project than `{id}` still resolves correctly per this route's own comment.
- `lib/traceability/errors.ts` — `mapTraceabilityRpcError`: RPC's P0002 (missing/foreign-workspace/non-member, all indistinguishable) → HTTP **404** `not_found`, "User story not found." **Flag for Stage 1**: AC-05 says "403 Forbidden or equivalent access-denied UI" — the implementation comment explicitly names this as "the one autonomous UI-shape call this run made (no PO ruling names the exact status code)". Neither 12171 nor 12176 rules on 403-vs-404 specifically; the dev comment argues 404 satisfies "equivalent access-denied UI" via the non-disclosure pattern shared with `mapCoverageRpcError`/`mapRecoveryCycleRpcError`/`mapDefectHeatmapRpcError`. Worth a explicit pass/fail call in the ATP rather than assuming — it is a genuine AC-wording-vs-implementation gap, distinct from the 10 stale markers.
- `components/traceability/TraceabilityChainView.tsx` — client component. States: no-story-selected (`data-testid="traceability-no-story-selected"`), loading skeleton, error+retry (`data-testid="traceability-error"` / `"traceability-retry"`), zero-AC (`"traceability-empty-zero-ac"`), zero-coverage banner (`"traceability-zero-coverage-banner"`) + still renders every (uncovered) AC card underneath — NOT a blank screen, has-chain (`"traceability-chain-view"`, one `AcCard` per criterion). Retry button re-fetches via the API route (client-side), not a full page reload.
- `lib/traceability/chain-view.ts` — pure, framework-agnostic view-state logic (mirrors `lib/coverage/coverage-view.ts` split from BK-46). `resolveStoryChainViewState`: `zero-ac` (criteria.length === 0) → `zero-coverage` (every criterion has 0 ATCs) → else `has-chain`. **No dedicated "partial/mixed" state** — a story with some covered / some uncovered ACs is `has-chain`, and each AC card independently shows either its chain or the "Uncovered · 0 ATCs bound" strip. This is exactly Ely's flagged residual: the branch exists and is unit-tested, but has not been seen live against a seeded mixed example.
- `supabase/migrations/0068_story_traceability_report.sql` — the RPC + the one new index (`bugs_atc_id_idx`).
- Tests already in repo: `lib/traceability/chain-view.test.ts`, `lib/traceability/errors.test.ts`, `lib/traceability/story-traceability-isolation.test.ts` (11/11, DB-integration, real database — spoofed actor, foreign workspace, foreign-project-in-same-workspace ATC leak, archived ATC + archived-ancestor-module ATC, standalone bug non-leak, no-dedupe across ACs, in-flight run state).

### Database
- Tables: `user_stories`, `acceptance_criteria`, `atcs`, `atc_acceptance_criteria`, `run_atcs`, `runs`, `bugs`, `modules`, `projects`.

## TMS Artifacts
| Artifact | ID | Status |
|----------|----|--------|
| ATP | ATP DRAFT present in `acceptance-test-plan.md` (23 outlines from Shift-Left, 6 `NEEDS CONFIRMATION` markers now stale) | Formal ATP created in Stage 1 |
| ATR | Pending | Created in Stage 3 (synced `acceptance-test-results.md`) |

## Open Questions / Gaps for Stage 1
1. **AC-05 status-code wording vs. implementation**: AC says 403; implementation returns 404 (non-disclosure pattern, dev's own autonomous call, not covered by either ratification comment). Stage 1 should decide whether to test-for-404-as-compliant or flag as an AC/implementation mismatch worth a QA note.
2. **Partial/mixed render state** — never exercised against a live seeded example (Ely's flagged residual). Needs a dedicated live-UI pass in Stage 2, not just a DB-integration/unit check.
3. **DBHUB_* unset in `.env`** — DB leg of the trifuerza unavailable for direct Stage 2 verification (known env gap carried over from earlier BK-175/BK-23 sessions today). Not a blocker; Stage 2 will need to lean on UI+API verification and the existing 11/11 DB-integration suite as the DB-layer evidence instead of live DB queries.
4. Out of scope by design (do not test as gaps): filtering the chain (BK-48), exporting the chain (BK-50) — neither control should appear on this screen.

## Gotcha — fetching this ticket
`bun run jira:sync-issues get BK-45 --include-comments` returns a warning and 0 files: work type "Historia" is routed via `pull --story`, not the standalone `get` path. Use `bun run jira:sync-issues pull --story BK-45 --include-comments` instead.

## Session Notes
### Session 1 — 2026-08-07 (Session Start)
- Project context loaded (`.agents/project.yaml`, `.agents/jira-required.yaml`, `.agents/jira-fields.json`, `.agents/jira-workflows.json`).
- Staging reachability probe: `curl -sI https://staging-upexbunkai.vercel.app` → 307 (reachable, confirmed again this session).
- TMS modality: jira-native (per `.agents/master-test-plan.md` / prior sessions today).
- `shift-left-reviewed` label present (`shift-left-2026-06-11`) but dated 2026-06-11 — 57 days before today (2026-08-07), i.e. stale (>30-day threshold). **Stage 1 will run all phases in full**, not short-circuit Phases 1-3.
- Code explored on `origin/staging` (PR #142 merged commit `4014bb4`) since local working tree was on an unrelated branch (`fix/BK-175/magic-link-otp-input`) — read via `git show origin/staging:<path>`, no checkout performed (read-only Session Start).
- Module context created at `.context/PBI/epics/EPIC-BK-44-coverage-traceability/module-context.md` (did not exist before this session).

### Session 2 — 2026-08-08 (Stage 3 — Reporting)
- ATR written to `{{jira.acceptance_test_results}}` (`customfield_10124`): 22/26 PASSED, 0 FAILED, 4 BLOCKED (coverage gaps, not defects). Verdict PASSED.
- Two Stage 2 non-blocking findings triaged against the literal AC text:
  1. Run-status vocabulary mismatch ("Aborted" shipped vs. AC-01's literal "pass/fail/blocked/skipped") — genuine AC violation → filed as **Defect BK-317** (Menor/Low, non-blocking), parented to the QA Defect Management epic (BK-183), linked `BK-45 causes BK-317` (verified direction).
  2. SSR first-paint generic error copy vs. specific 404 reason after Retry — checked against AC-05 (access-control outcome) and AC-02 (missing-layer copy); neither governs error-copy timing → **Observation only**, no Defect filed, logged in the ATR for PO follow-up.
- QA comment (Template A — PASSED) posted to BK-45, comment id `12236`.
- Transitioned BK-45 `In Test` → `QA Approved` via `QA Sign-Off` (`qa_sign_off`). Re-fetch confirmed `status.name == "QA Approved"`.
- Gotcha: `bun run jira:sync-issues pull --story BK-45 --include-comments` emitted a warning `BK-45 ↔ BK-317 (Defect) linked via 'Problem/Incident' (atypical — expected causes / is blocked by / Defect)`. Investigated: the sync script's `defect_link_types` allowlist (`scripts/sync-jira-issues.ts` `classifyCoverageLinks`) reads `.agents/jira-required.yaml` `work_types.*.defect_link_types`, which is currently undeclared for every work type — so `acceptedDefectNames` is always empty and this warning fires on **every** Defect link regardless of type. `problem_incident` ("causes"/"is caused by") is the doctrine-correct link type per `agentic-qa-core/references/traceability-linking.md` §3 (covers both Bug and Defect) and was verified direction-correct via `acli link list`. This is a pre-existing sync-script config gap, not a defect in this session's link — left unfixed (out of scope for a reporting session; flagged for `framework-development`).

## Final Status

**Result:** PASSED
**Workflow Complete:** 2026-08-08
**Next:** QA Approved

# BK-23: TMS-ATC Duplicate | Duplicate an ATC with steps and assertions
**Ticket:** BK-23 | **Epic/Module:** EPIC-BK-13-atc-library-atomic-test-components | **Status:** Ready For QA | **Sprint:** (not set in synced story.md)

> Jira-sourced detail (read-only caches, not copied here): `story.md`, `acceptance-criteria.md`, `comments.md` — materialized by `bun run jira:sync-issues pull --story BK-23 --include-comments`.

## Team Discussion (analysis only — source is comments.md)
### Key Decisions
- [Ramiro Majdalani] (2026-06-02): Recommends refining the story before sprint planning — the 4 original ACs only cover the happy path and the independence invariant; error paths, role matrix, and title-collision behavior are undefined.
- [Ramiro Majdalani] (2026-06-02): Proposed a richer set of refined Gherkin scenarios (copy of fields + child rows, default title suffix, custom title override, title validation 3..200 chars, independence, fresh entity identity, workspace authorization, transactional rollback, `atc.created` event) — treat these as the working test basis for Stage 1, pending PO/Dev confirmation.

### Technical Notes
- [Ely] (2026-05-19, Architect Annotation): DB flow is a single transaction — INSERT into `atcs`, bulk INSERT into `atc_steps` and `atc_assertions` copied from the source. New row computes `new_title = new_title ?? (source.title + ' (copy)')`, validates length 3..200, inherits `module_id`, `user_story_id`, `acceptance_criterion_ids`, `layer`, `tags`; sets `version = 1`; computes a fresh `slug` (slugs are never cloned). No FK link persists between source and duplicate — fully independent rows, no propagation either direction.
- [Ely] (2026-05-19): API surface proposed as `POST /atcs/{source_id}/duplicate` with optional `{ new_title }` body, returning `201 { atc_id }`; error codes 403 (insufficient role), 422 (title validation), 404 (cross-workspace source lookup).
- [Ely] (2026-05-19): Event emission is `atc.created` (NOT a separate `atc.duplicated` event) — downstream consumers need no special handling.
- [Ely] (2026-05-19): Strong recommendation to land BK-18 (FR-010a) first and extract an internal `createAtc(payload)` service function that BK-23 reuses for the insert path, slug computation, and event emission.
- [Ramiro Majdalani] (2026-06-02): Flags a contract mismatch — OpenAPI currently documents `POST /atcs/{atc_id}/duplicate` with body `{ title }` and response `201 ATC`, while the architect's technical notes/SRS use `POST /atcs/{source_id}/duplicate` with body `{ new_title }` and response `201 { atc_id }`. Also: OpenAPI only documents the `201` case; 403/404/422 are undocumented there.

### Edge Cases Raised
- [Benjamin Segovia] (2026-06-02, ATP DRAFT): E1 cross-workspace source → 404, E2 insufficient role → 403, E3 title < 3 chars → 422, E4 title > 200 chars → 422, E5 title = 3 chars boundary → 201, E6 title = 200 chars boundary → 201, E7 source with 0 steps → 0-step copy, E8 source title ≥197 chars causing " (copy)" suffix overflow, E9 empty-string `new_title` treatment, E10 transaction rollback on step-insert failure. ALL flagged "NEEDS PO/DEV CONFIRMATION" — none resolved as of this sync.
- [Ramiro Majdalani] (2026-06-02): Story does not define behavior when the default title `<source title> (copy)` already exists (collision); role behavior is underspecified (needs an owner/admin/member/viewer matrix); archived-source-ATC duplication behavior is undefined.

### Blockers / Warnings
- [Benjamin Segovia] (2026-06-02, ATP DRAFT): "Do not pull BK-23 into sprint until BK-18 is merged" — upstream dependency gate. BK-18 traceability in the freshly synced `story.md` now shows status "QA Approved", so this gate appears satisfied on the Jira side.
- Two "Automation for Jira" bot comments (2026-06-20) state a Pull Request was created then merged — skipped from the analysis above per the bot/automated-comment exclusion rule, but cross-referenced below under Related Code because the claim could not be corroborated in the explored backend code.
- **NEW (2026-06-22):** QA session blocked by **BK-175** — staging magic-link login is broken (OTP email has no code-entry field), so the duplicate-ATC vs. no-code-found discrepancy above could not be settled empirically. BK-175 links as *Blocks* this story. Session paused; see `test-session-memory.md` Session Log for full detail.

## Related Code
### Backend / Frontend / Database
- `app/(app)/projects/[projectSlug]/atcs/[atcId]/actions.ts` (backend repo `upex-bunkai-tms`) — `saveAtcAction()` Server Action; the only existing write path for ATCs today (create/full-replace via `bunkai_save_atc` RPC). No duplicate/clone logic present.
- `app/(app)/projects/[projectSlug]/atcs/[atcId]/page.tsx` — ATC editor page; no "Duplicate" UI action found.
- `app/api/v1/atcs/` — **does not exist** in the backend repo. No REST route for ATCs at all (create, read, list, or duplicate). Confirms the documented gap in `.context/business/business-api-map.md` §7.
- Migrations checked: `supabase/migrations/0004_atcs.sql` (schema), `0007_save_atc.sql` (the `bunkai_save_atc` RPC). No migration after `0017_acceptance_criteria_ordering.sql` touches `atcs`/`atc_steps`/`atc_assertions` — no duplicate/clone SQL function exists yet.
- Tables: `atcs`, `atc_steps`, `atc_assertions`, `atc_acceptance_criteria` (see `module-context.md` for full column detail).
- **Open discrepancy (flag for Stage 1/Stage 2):** the Jira ticket is "Ready For QA" with bot comments claiming a merged PR, but no duplicate/clone code, route, or migration was found in the backend repo as explored this session. This must be re-verified (e.g. confirm correct branch/deploy target was checked, or confirm with the dev) before authoring an ATP against a feature that may not actually be deployed to staging.

## TMS Artifacts
| Artifact | ID | Status |
|----------|----|--------|
| ATP | Pending | Created in Stage 1 (synced acceptance-test-plan.md) |
| ATR | Pending | Created in Stage 3 (synced acceptance-test-results.md) |

## Session Notes
### Session 1 — 2026-06-22
Context loaded from `.agents/project.yaml`, `.context/master-test-plan.md`, and all three `.context/business/*.md` files (all found, no gaps). Re-synced BK-23 via `bun run jira:sync-issues pull --story BK-23 --include-comments` (status changed from the previously cached "Ready For Dev" to "Ready For QA"; BK-18 traceability now shows "QA Approved"). Explored the backend repo (`upex-bunkai-tms`, accessible at `../upex-bunkai-tms`) for ATC duplication code — found none; created `module-context.md` for EPIC-BK-13 (was missing). Flagged a discrepancy between the Jira "PR merged" bot comments and the absence of any duplicate-ATC implementation in the explored backend code — needs verification before Stage 1 ATP authoring proceeds. Environment reachability (staging, HTTP 307 on root) was already confirmed earlier this session per orchestrator instruction — not re-probed.

Tried to settle the discrepancy live on staging — blocked. Magic-link login cannot be completed (OTP email, no code field on the confirmation screen). Filed **BK-175**, linked it as *Blocks* this story, posted a QA-paused comment on BK-23 (no transition — status unchanged). Session paused pending BK-175 resolution + dev/PO confirmation of BK-23's actual deployment status.

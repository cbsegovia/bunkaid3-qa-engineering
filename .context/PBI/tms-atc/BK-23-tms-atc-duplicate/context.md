# BK-23 — TMS-ATC Duplicate

**Ticket:** BK-23 | **Module:** tms-atc | **Status:** Shift-Left QA
**Assignee:** Benjamin Segovia
**Sprint testing:** 2026-06-03

## Story

TMS-ATC Duplicate | Duplicate an ATC with steps and assertions
Source spec: FR-014
Upstream dependency: BK-18

**As a** Senior QA Engineer
**I want to** duplicate an ATC with all its steps and assertions in one click
**So that** I can start a variant from a known-good template instead of retyping it.

## Acceptance Criteria (refined)

### Happy path
1. **AC1**: Duplicate an ATC with 3 steps and 2 assertions → new ATC created with same 3 steps + 2 assertions
2. **AC2**: Title defaults to source title + "(copy)" when no title provided
3. **AC3**: Custom title accepted when provided
4. **AC4**: Editing the copy does not change the original

### Negative / Error (gaps from Shift-Left)
5. **G1a**: Duplicate from another workspace → 403
6. **G1b**: Title < 3 chars → 422
7. **G1c**: Title > 200 chars → 422

## API Contract

- `POST /atcs/{source_id}/duplicate`
- Body: `{ new_title?: string }`
- Success: 201 `{ atc_id }`
- Errors: 403 (insufficient role), 422 (title validation), 404 (source not found)

## Team Discussion

- 3-table transaction: `atcs`, `atc_steps`, `atc_assertions` (atomic)
- Title defaulting: `new_title ?? (source.title + ' (copy)')`
- Title validation: 3..200 chars
- Slug: freshly computed (never cloned from source)
- Event emitted: `atc.created`
- No FK link between source and duplicate — fully independent rows
- RLS workspace-scoped on `atcs`

## TMS Modality

Jira-native (no Xray). ATP/ATR stored as custom fields + comments on the Story.

## Session Notes

- Shift-Left refinement completed: 2026-06-02 (< 30 days ago → short-circuit Phases 1-3)
- business-feature-map.md not available — proceed with ticket inline context
- 2026-06-25 re-verification: tried the BK-166 email+password login path (since BK-175 magic-link is still Open) to confirm BK-23's duplicate-ATC deployment status. Login form itself works, but `.env` STAGING_USER_PASSWORD (6 chars) fails the backend's 8-char policy — 401, never reached the ATC library. Deployment question still open.
- 2026-06-25 incidental bug filed: BK-181 (Authentication: Signup: "Request a new code" calls signup instead of resend, leaks raw validation error) — found on BK-166's flow while probing this blocker, unrelated to BK-23's own scope. Related to BK-166, not to BK-23 directly.

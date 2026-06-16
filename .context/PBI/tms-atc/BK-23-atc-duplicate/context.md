# BK-23 — TMS-ATC Duplicate

**Ticket:** BK-23 | **Module:** tms-atc | **Status:** Shift-Left QA | **Sprint:** n/a — pre-sprint

## Story

TMS-ATC Duplicate | Duplicate an ATC with steps and assertions
Status: Shift-Left QA | Priority: Medium | Assignee: —
Source spec: FR-014

## Acceptance Criteria (original)

```gherkin
Scenario: Duplicate an ATC with all its steps and assertions
  Given an ATC "Login happy path" with three steps and two assertions
  When I duplicate it
  Then a new ATC is created with the same three steps and two assertions

Scenario: The copy's title defaults to the source title with "(copy)"
  Given an ATC titled "Login happy path"
  When I duplicate it without typing a title
  Then the new ATC is titled "Login happy path (copy)"

Scenario: Provide a custom title for the duplicate
  Given an ATC titled "Login happy path"
  When I duplicate it and type the title "Login with remember-me"
  Then the new ATC is titled "Login with remember-me"

Scenario: Editing the copy does not change the original
  Given I duplicated an ATC
  When I edit a step in the copy
  Then the original ATC's steps are unchanged
```

## Team Discussion

- Architect annotation by Ely (Jira comment): `POST /atcs/{source_id}/duplicate` with optional `{ new_title }` body. Returns 201 `{ atc_id }` | 403 on insufficient role | 422 on title validation | 404 on cross-workspace lookup.
- DB tables involved: `atcs` (INSERT), `atc_steps` (bulk INSERT), `atc_assertions` (bulk INSERT) — all in one transaction. On failure the transaction is rolled back atomically.
- Service flow: BEGIN → SELECT source (404 if not found) → compute `new_title = $new_title ?? (source.title + ' (copy)')` → validate title length 3..200 → INSERT new atc (inheriting module_id, user_story_id, acceptance_criterion_ids, layer, tags, version=1, fresh slug) → INSERT atc_steps (position, content, input_data, expected) → INSERT atc_assertions (position, content) → COMMIT.
- Event emitted: `atc.created` (NOT `atc.duplicated`) — downstream consumers need no special handling.
- Slug: freshly computed from new `atc_id` — NEVER cloned from source.
- No FK link between source and duplicate — fully independent rows.
- Upstream dependency: **BK-18 (FR-010a)** must land first (reuses insert path + slug computation + `createAtc()` service function).
- Downstream: ATC list/detail UI gets a "Duplicate" action → calls endpoint → redirects to new ATC detail page.
- Title validation: 3..200 characters (from architect annotation).

## Parent epic

n/a — epic not provided in ticket data.

## Pre-sprint status

Shift-Left refinement: completed 2026-06-02

## Session Notes

- Shift-Left refinement: 2026-06-02
- missing_input: business-feature-map.md, business-api-map.md (proceed with ticket inline context)
- TMS modality: jira-native (ATP DRAFT goes to customfield_10120 on the Story)

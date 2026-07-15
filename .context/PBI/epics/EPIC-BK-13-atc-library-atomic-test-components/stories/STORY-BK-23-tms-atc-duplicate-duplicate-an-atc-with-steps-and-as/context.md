# BK-23 — TMS-ATC Duplicate | Duplicate an ATC with steps and assertions

**Ticket:** BK-23
**Epic:** BK-13 (ATC Library — Atomic Test Components)
**Status:** Ready For QA
**Priority:** Medium
**Assignee:** Benjamin Segovia
**Source spec:** FR-014

---

## Story

**As a** Senior QA Engineer
**I want to** duplicate an ATC with all its steps and assertions in one click
**So that** I can start a variant from a known-good template instead of retyping it.

---

## Acceptance Criteria (Gherkin)

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

---

## Team Discussion (Architect — Ely)

- Endpoint: `POST /atcs/{source_id}/duplicate` — optional body `{ new_title }`
- Returns: `201 { atc_id }` | `403` insufficient role | `422` title validation | `404` cross-workspace
- DB tables: `atcs` (INSERT), `atc_steps` (bulk INSERT), `atc_assertions` (bulk INSERT) — one transaction; rollback on failure
- Service flow: BEGIN → SELECT source (404 if not found) → compute `new_title = $new_title ?? (source.title + ' (copy)')` → validate title length 3..200 → INSERT new atc (inheriting module_id, user_story_id, acceptance_criterion_ids, layer, tags, version=1, fresh slug) → INSERT atc_steps → INSERT atc_assertions → COMMIT
- Event emitted: `atc.created` (NOT `atc.duplicated`)
- Slug: freshly computed from new `atc_id` — NEVER cloned from source
- No FK link between source and duplicate — fully independent rows
- Upstream dependency: BK-18 (FR-010a) must land first (reuses insert path + slug computation + `createAtc()` service function)
- Downstream: ATC list/detail UI gets a "Duplicate" action → calls endpoint → redirects to new ATC detail page
- Title validation: 3..200 characters

---

## Definition of Done

- [ ] Feature works end-to-end against staging
- [ ] Covered by an ATC chain anchored to a User Story + Acceptance Criterion
- [ ] Acceptance Criteria verified by QA
- [ ] Demoed to the team

---

## Session Notes

- Shift-Left refinement completed: 2026-06-02 (label: shift-left-reviewed, within 30 days)
- Missing inputs noted: business-feature-map.md, business-api-map.md — proceeding with inline context
- TMS modality: jira-native (ATP → customfield_10067; ATR → customfield_10147)
- Sync note: jira:sync-issues skips BK-23 because Jira workspace uses 'Historia' (ES) not mapped in jira-required.yaml work_types
- Sprint testing session started: 2026-06-26

## Final Status

**Result:** FAILED → BLOCKED
**Workflow Complete:** 2026-06-28
**Bugs Filed:** BK-185 (MAJOR), BK-184 (MEDIUM)
**Next:** Fix BK-185 (UI Duplicate action) + BK-184 (new_title field) → re-run Stage 2

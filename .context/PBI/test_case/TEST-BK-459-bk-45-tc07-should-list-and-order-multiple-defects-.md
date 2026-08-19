# TEST: BK-45: TC07: should list and order multiple defects linked to one run by created_at DESC

**Jira Key:** [BK-459](https://jira.upexgalaxy.com/browse/BK-459)
**Status:** Borrador
**Components:** Coverage & Traceability

---

## Test Description

## Why this is regression-worthy

Multiple defects linked to one Run must list in `created_at DESC` order — order matters here because a QA reviewer scanning the chain expects to see the most recent defect status first. A regression that silently reverted to ascending or unstable order would not fail any single-defect unit assertion, but would degrade the review workflow for every multi-defect run and could hide the most current defect state behind older, possibly-resolved ones.

## ROI

| Factor | Score | Reasoning |
| --- | --- | --- |
| Frequency | 4 | Any PR touching defect listing/ordering |
| Impact | 3 | Ordering, not visibility — a defect is still shown, just possibly out of order |
| Stability | 4 | Ordering logic is settled |
| Effort | 2 | Single page load, 2+ seeded defects on one run |
| Dependencies | 2 | Needs a run with 2+ linked defects, already seeded on staging |

***ROI = (4 x 3 x 4) / (2 x 2) = 12.0*** -> Candidate

## Test design

```gherkin
@regression @e2e @automation-candidate @BK-45
Scenario: should list and order multiple defects linked to one run by created_at DESC
  """
  Related Story: BK-45
  ATP outline: TC-BK45-07
  """

  # === PRECONDITIONS ===
  Given an authenticated workspace member with at least viewer role
  And a user story "{story*id}" in project "{project*slug}" whose latest run has 2 or more linked defects with different creation timestamps

  # === ACTION ===
  When the member opens "/projects/{project*slug}/traceability?story={story*id}"

  # === VALIDATIONS ===
  Then all linked defects render under that run
  And each defect shows its ID, title and status
  And defects are ordered most-recently-created first
```

## Variables

| Variable | How to obtain |
| --- | --- |
| `{project_slug}` | Project settings, or the `/projects` list |
| `{story_id}` | `data-testid="story-row-<uuid>"` in the traceability sidebar |

## Preconditions

A seeded story whose latest run has 2 or more linked defects. Staging already carries 3 bugs filed against BK-35's ATC-B runs backing this ordering case.

## Expected results

All defects render, most recent first, each with ID/title/status.

---

***Related Story***: BK-45 — TMS-Traceability | Render full US to bug evidence chain in one read
***Regression epic***: BK-70 (QA Test Repository)
***Source***: BK-45 ATP Stage 1 (2026-08-05), executed and recorded in the BK-45 ATR (2026-08-08)

---

## Related Issues

- is tested by: [BK-45](https://jira.upexgalaxy.com/browse/BK-45) - TMS-Traceability | Render full US to bug evidence chain in one read

---

## Metadata

- **Created:** 14/8/2026
- **Updated:** 14/8/2026
- **Reporter:** Benjamin Segovia
- **Assignee:** Benjamin Segovia
- **Labels:** automation-candidate, regression, traceability

---

_Synced from Jira by sync-jira-issues_

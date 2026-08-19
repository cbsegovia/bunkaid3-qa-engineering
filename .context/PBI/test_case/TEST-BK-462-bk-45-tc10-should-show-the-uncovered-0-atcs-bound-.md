# TEST: BK-45: TC10: should show the Uncovered 0 ATCs bound strip for an AC with no ATCs

**Jira Key:** [BK-462](https://jira.upexgalaxy.com/browse/BK-462)
**Status:** Borrador
**Components:** Coverage & Traceability

---

## Test Description

## Why this is regression-worthy

The "Uncovered · 0 ATCs bound" strip is the primary signal a QA engineer or PO uses to spot untested acceptance criteria at a glance — this is literally what the BK-44 coverage-traceability epic exists to surface. A regression that silently hid the strip or rendered a blank row instead would defeat the coverage-gap-visibility purpose of the whole epic while leaving covered-AC rendering fully intact, so it would not be caught by tests that only assert the happy-path chain.

## ROI

| Factor | Score | Reasoning |
| --- | --- | --- |
| Frequency | 5 | Every PR touching AC-level coverage resolution |
| Impact | 4 | Silently hiding a coverage gap defeats the epic's core purpose |
| Stability | 4 | The uncovered-strip logic is settled |
| Effort | 2 | Single page load against a mixed-coverage story |
| Dependencies | 2 | Needs a story with 1+ covered AC and 1+ zero-ATC AC |

***ROI = (5 x 4 x 4) / (2 x 2) = 20.0*** -> Candidate

## Test design

```gherkin
@regression @e2e @automation-candidate @BK-45
Scenario: should show the "Uncovered · 0 ATCs bound" strip for an AC with no ATCs
  """
  Related Story: BK-45
  ATP outline: TC-BK45-10
  """

  # === PRECONDITIONS ===
  Given an authenticated workspace member with at least viewer role
  And a user story "{story*id}" in project "{project*slug}" with 1 or more covered ACs and at least 1 AC with zero bound ATCs

  # === ACTION ===
  When the member opens "/projects/{project*slug}/traceability?story={story*id}"

  # === VALIDATIONS ===
  Then the AC with zero ATCs shows the "Uncovered · 0 ATCs bound" strip
  And that row is not blank or broken
```

## Variables

| Variable | How to obtain |
| --- | --- |
| `{project_slug}` | Project settings, or the `/projects` list |
| `{story_id}` | `data-testid="story-row-<uuid>"` in the traceability sidebar |

## Preconditions

Story `27223d20-915e-4e03-b1ae-f9a6efb33980` (BK-35), which has AC-B seeded with zero ATCs bound alongside covered ACs.

## Expected results

The uncovered strip renders for the zero-ATC AC; no broken row.

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

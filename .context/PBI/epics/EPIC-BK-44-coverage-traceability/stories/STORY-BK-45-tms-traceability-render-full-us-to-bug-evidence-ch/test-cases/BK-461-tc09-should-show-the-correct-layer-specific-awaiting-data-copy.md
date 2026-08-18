# TEST: BK-45: TC09: should show the correct layer-specific awaiting-data copy given each missing chain layer

**Jira Key:** [BK-461](https://upexgalaxy71.atlassian.net/browse/BK-461)
**Status:** Candidate
**Components:** Coverage & Traceability

---

## Test Description

## Why this is regression-worthy

When an ATC exists but its next layer (Test/Run/Defect) is missing, the layer-specific "awaiting data" copy tells a QA reviewer *where* in the chain the gap is, not just *that* a gap exists ("No test written yet" vs. "Awaiting first run" carry different meaning and different next actions). Unit tests on the copy-mapping function typically assert one variant at a time; they don't prove the live UI selects the correct one of the 5 variants for the correct missing layer on a real partially-covered story. A regression collapsing all 5 variants to one generic string, or swapping two layers' copy, would degrade every partially-covered story's read without failing any single hard-coded assertion for the fully-covered happy path.

## ROI

| Factor | Score | Reasoning |
| --- | --- | --- |
| Frequency | 4 | Any PR touching layer-gap copy or view-state resolution |
| Impact | 3 | Copy-accuracy issue, not a data leak or false verdict |
| Stability | 4 | Copy mapping is settled |
| Effort | 2 | Single page load, parametrized over 5 layer-gap variants |
| Dependencies | 2 | Needs an ATC seeded with each of the 5 missing-layer states |

**ROI = (4 x 3 x 4) / (2 x 2) = 12.0** -> Candidate

## Test design

```gherkin
@regression @e2e @automation-candidate @BK-45
Scenario Outline: should show the correct layer-specific "awaiting data" copy
  """
  Related Story: BK-45
  ATP outline: TC-BK45-09
  """

  # === PRECONDITIONS ===
  Given an authenticated workspace member with at least viewer role
  And a user story "{story_id}" in project "{project_slug}" with an ATC missing the "<missing_layer>" layer

  # === ACTION ===
  When the member opens "/projects/{project_slug}/traceability?story={story_id}"

  # === VALIDATIONS ===
  Then the ATC shows the exact copy "<expected_copy>"
  And no cell renders as null or blank

  Examples:
    | missing_layer | expected_copy          |
    | Test           | No test written yet    |
    | Run (no test)  | Awaiting test          |
    | Run             | No run recorded yet    |
    | Run (has test)  | Awaiting first run    |
    | Defect          | None linked            |
```

## Variables

| Variable | How to obtain |
| --- | --- |
| `{project_slug}` | Project settings, or the `/projects` list |
| `{story_id}` | `data-testid="story-row-<uuid>"` in the traceability sidebar |

## Preconditions

A seeded story with ATCs covering each of the 5 missing-layer states.

## Expected results

Each of the 5 layer-gap states renders its exact matching copy, no null cells.

---

**Related Story**: BK-45 — TMS-Traceability | Render full US to bug evidence chain in one read
**Regression epic**: BK-70 (QA Test Repository)
**Source**: BK-45 ATP Stage 1 (2026-08-05), executed and recorded in the BK-45 ATR (2026-08-08)

---

## Related Issues

- tests: [BK-45](https://jira.upexgalaxy.com/browse/BK-45) - TMS-Traceability | Render full US to bug evidence chain in one read

# TEST: BK-45: TC13: should show "No acceptance criteria yet" for a story with zero ACs, distinct from AC-03 copy

**Jira Key:** [BK-446](https://upexgalaxy71.atlassian.net/browse/BK-446)
**Status:** Candidate
**Components:** Coverage & Traceability

---

## Test Description

## Why this is regression-worthy

`resolveStoryChainViewState` renders two distinct empty-state copies depending on WHY a story shows no chain: "No acceptance criteria yet" for a story with zero ACs (this case, AC-07) versus "No coverage anywhere on this story" for a story that has ACs but zero ATCs bound to any of them (AC-03, TC-BK45-12). A regression that collapses these into one generic empty-state string would silently erase a real authoring-gap signal — reviewers scanning the traceability view need to know whether nobody wrote ACs yet versus ACs exist but nothing has been tested. Unit tests can assert the state-resolver's return value in isolation; only a live render proves the two copies actually differ on screen and neither string leaks into the other's state.

## ROI

| Factor | Score | Reasoning |
| --- | --- | --- |
| Frequency | 3 | Touched whenever empty-state or AC-authoring logic changes |
| Impact | 3 | Silent UX regression, not a data leak or access-control break |
| Stability | 4 | Copy and state-resolution branch are settled, ratified this ATP |
| Effort | 2 | One seeded zero-AC story, one page load, one string assertion |
| Dependencies | 2 | Needs a dedicated zero-AC story fixture (already seeded on staging) |

**ROI = (3 x 3 x 4) / (2 x 2) = 9.0** -> Candidate

## Test design

```gherkin
@medium @regression @e2e @automation-candidate @BK-45
Scenario: should show "No acceptance criteria yet" for a story with zero ACs
  """
  Related Story: BK-45
  Test outline: TC-BK45-13 (ATP Stage 1)
  """

  # === PRECONDITIONS ===
  Given an authenticated workspace member with at least viewer role
  And a user story "{story_id}" in project "{project_slug}" with zero acceptance criteria

  # === ACTION ===
  When the member opens "/projects/{project_slug}/traceability?story={story_id}"

  # === VALIDATIONS ===
  Then the view renders the authoring-gap copy "No acceptance criteria yet"
  And the copy is distinct from the AC-03 "No coverage anywhere on this story" banner
  And zero chain rows render for any layer (AC, ATC, Test, Run, Defect)
```

## Variables

| Variable | How to obtain |
| --- | --- |
| `{project_slug}` | Project settings, or the `/projects` list |
| `{story_id}` | `data-testid="story-row-<uuid>"` in the traceability sidebar |

## Preconditions

A story seeded with zero acceptance criteria. Story `b977a5b9-f9d5-4a66-b136-5130487039a3` (zero-AC authoring-gap copy fixture) is seeded on staging.

## Expected results

The "No acceptance criteria yet" copy renders, visibly distinct from the AC-03 zero-coverage banner, with no chain rows at any layer.

---

**Related Story**: BK-45 — TMS-Traceability | Render full US to bug evidence chain in one read
**Regression epic**: BK-70 (QA Test Repository)
**Source**: BK-45 ATP Stage 1 (2026-08-05), executed and recorded in the BK-45 ATR (2026-08-08)

---

## Related Issues

- tests: [BK-45](https://jira.upexgalaxy.com/browse/BK-45) - TMS-Traceability | Render full US to bug evidence chain in one read

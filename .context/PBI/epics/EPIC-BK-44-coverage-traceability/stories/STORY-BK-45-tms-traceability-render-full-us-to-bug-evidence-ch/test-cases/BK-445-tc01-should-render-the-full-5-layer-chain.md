# TEST: BK-45: TC01: should render the full 5-layer chain for a fully covered story

**Jira Key:** [BK-445](https://upexgalaxy71.atlassian.net/browse/BK-445)
**Status:** Candidate
**Components:** Coverage & Traceability

---

## Test Description

## Why this is regression-worthy

This is the story's core happy path — proving all 5 layers (Acceptance Criterion → ATC → Test → Run → Defect) render together on one page load for a real seeded story. Unit tests validate the RPC/view-state resolver functions in isolation; none of them prove the assembled UI actually paints all 5 layers together for a live story. A regression that broke any single layer join (e.g. Test→Run mapping) while leaving the resolver logic intact would pass the entire unit suite and still ship a broken chain.

## ROI

| Factor | Score | Reasoning |
| --- | --- | --- |
| Frequency | 5 | Every PR touching the traceability surface exercises this happy path |
| Impact | 5 | This IS the feature; breaking it defeats the story's entire purpose |
| Stability | 4 | Chain-render RPC and card layout are settled, ratified via shift-left |
| Effort | 2 | Single page load + assertions, standard Playwright |
| Dependencies | 2 | Needs a seeded story with a full chain — `bk-45-fixtures` module already exists |

**ROI = (5 x 5 x 4) / (2 x 2) = 25.0** -> Candidate

## Test design

```gherkin
@regression @e2e @automation-candidate @BK-45
Scenario: should render the full 5-layer chain for a fully covered story
  """
  Related Story: BK-45
  ATP outline: TC-BK45-01
  """

  # === PRECONDITIONS ===
  Given an authenticated workspace member with at least viewer role
  And a user story "{story_id}" in project "{project_slug}" with 1 or more acceptance criteria, each bound to an ATC, a Test, a Run and a linked Defect

  # === ACTION ===
  When the member opens "/projects/{project_slug}/traceability?story={story_id}"

  # === VALIDATIONS ===
  Then the traceability view renders on a single page load, with no extra navigation
  And every acceptance criterion is shown with its bound ATC
  And every ATC shows its linked Test
  And every Test shows its latest Run with a status pill
  And every Run shows its linked Defect(s)
  And no cell is broken or null
```

## Variables

| Variable | How to obtain |
| --- | --- |
| `{project_slug}` | Project settings, or the `/projects` list |
| `{story_id}` | `data-testid="story-row-<uuid>"` in the traceability sidebar |

## Preconditions

A seeded story with a full 5-layer chain. The `bk-45-fixtures` module on staging provides one: story `d57804e8-d614-445e-b707-8c25d9ca5dac` ("As a QA reviewer, I want the full 5-layer evidence chain to render for a fully covered story") — 2 ACs, 4 ATCs, 4 Tests, 3 Runs.

## Expected results

Single-page chain renders with no broken/null cells and no extra navigation required.

---

**Related Story**: BK-45 — TMS-Traceability | Render full US to bug evidence chain in one read
**Regression epic**: BK-70 (QA Test Repository)
**Source**: BK-45 ATP Stage 1 (2026-08-05), executed and recorded in the BK-45 ATR (2026-08-08)

---

## Related Issues

- tests: [BK-45](https://jira.upexgalaxy.com/browse/BK-45) - TMS-Traceability | Render full US to bug evidence chain in one read

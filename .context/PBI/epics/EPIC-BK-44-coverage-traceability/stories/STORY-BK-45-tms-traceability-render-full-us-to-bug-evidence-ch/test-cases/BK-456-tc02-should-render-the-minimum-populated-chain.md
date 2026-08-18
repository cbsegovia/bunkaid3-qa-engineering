# TEST: BK-45: TC02: should render the minimum populated chain given 1 AC, 1 ATC, 1 Test and 1 Run

**Jira Key:** [BK-456](https://upexgalaxy71.atlassian.net/browse/BK-456)
**Status:** Candidate
**Components:** Coverage & Traceability

---

## Test Description

## Why this is regression-worthy

This is the lower boundary case for chain depth: the absolute minimum non-empty data at every layer (1 AC, 1 ATC, 1 Test, 1 Run) must still render without null or broken cells. Unit tests on the resolver can pass arrays of arbitrary length; they do not prove the UI's join/rendering logic tolerates the single-row case, which is exactly the class of off-by-one bug list-rendering code tends to hide (code paths written for "N items" quietly assuming N >= 2).

## ROI

| Factor | Score | Reasoning |
| --- | --- | --- |
| Frequency | 4 | Every PR touching chain rendering risks this boundary |
| Impact | 3 | Edge case, not the core happy path, but a real regression risk on list-rendering code |
| Stability | 4 | Rendering logic is settled |
| Effort | 2 | Single page load + assertions |
| Dependencies | 2 | Needs a minimal-chain fixture, cheap to seed/maintain |

**ROI = (4 x 3 x 4) / (2 x 2) = 12.0** -> Candidate

## Test design

```gherkin
@regression @e2e @automation-candidate @BK-45
Scenario: should render the minimum populated chain
  """
  Related Story: BK-45
  ATP outline: TC-BK45-02
  """

  # === PRECONDITIONS ===
  Given an authenticated workspace member with at least viewer role
  And a user story "{story_id}" in project "{project_slug}" with exactly 1 acceptance criterion, bound to exactly 1 ATC, 1 Test and 1 Run

  # === ACTION ===
  When the member opens "/projects/{project_slug}/traceability?story={story_id}"

  # === VALIDATIONS ===
  Then the single acceptance criterion renders with its ATC
  And the ATC renders its Test
  And the Test renders its Run with a status pill
  And no cell is broken, null, or shows a placeholder meant for a missing layer
```

## Variables

| Variable | How to obtain |
| --- | --- |
| `{project_slug}` | Project settings, or the `/projects` list |
| `{story_id}` | `data-testid="story-row-<uuid>"` in the traceability sidebar |

## Preconditions

A seeded story with the smallest possible non-empty chain (1 AC / 1 ATC / 1 Test / 1 Run).

## Expected results

The minimal chain renders correctly with no broken or null cells.

---

**Related Story**: BK-45 — TMS-Traceability | Render full US to bug evidence chain in one read
**Regression epic**: BK-70 (QA Test Repository)
**Source**: BK-45 ATP Stage 1 (2026-08-05), executed and recorded in the BK-45 ATR (2026-08-08)

---

## Related Issues

- tests: [BK-45](https://jira.upexgalaxy.com/browse/BK-45) - TMS-Traceability | Render full US to bug evidence chain in one read

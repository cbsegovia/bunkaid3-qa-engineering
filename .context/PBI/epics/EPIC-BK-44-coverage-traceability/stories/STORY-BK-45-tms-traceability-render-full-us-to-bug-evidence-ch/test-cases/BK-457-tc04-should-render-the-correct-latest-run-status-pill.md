# TEST: BK-45: TC04: should render the correct latest-run status pill given each of the 4 terminal run statuses

**Jira Key:** [BK-457](https://upexgalaxy71.atlassian.net/browse/BK-457)
**Status:** Candidate
**Components:** Coverage & Traceability

---

## Test Description

## Why this is regression-worthy

The latest-run status pill is the single most load-bearing piece of information on the page — a wrong or stale status pill actively misleads a QA reviewer into believing a test passed when it did not (or vice versa). This is exactly the class of bug that already surfaced once on this story (BK-317: the shipped "Aborted" pill vs. the AC's originally-specified "skipped" vocabulary, resolved by a spec correction, not a code fix). Unit tests on the copy-mapping function don't prove the UI actually re-renders the pill correctly for each of the 4 terminal statuses on a live page.

## ROI

| Factor | Score | Reasoning |
| --- | --- | --- |
| Frequency | 5 | Every PR touching run-status rendering |
| Impact | 5 | A wrong status pill is a false verdict on a QA/coverage surface |
| Stability | 3 | This exact surface already produced a vocabulary Defect (BK-317) this session |
| Effort | 2 | Single page load, parametrized over 4 statuses |
| Dependencies | 2 | Needs 4 seeded runs, one per terminal status |

**ROI = (5 x 5 x 3) / (2 x 2) = 18.75** -> Candidate

## Test design

```gherkin
@regression @e2e @automation-candidate @BK-45
Scenario Outline: should render the correct latest-run status pill
  """
  Related Story: BK-45
  ATP outline: TC-BK45-04
  Bugs covered: BK-317 (run-status vocabulary mismatch, resolved via AC correction)
  """

  # === PRECONDITIONS ===
  Given an authenticated workspace member with at least viewer role
  And a user story "{story_id}" in project "{project_slug}" whose latest run has status "<run_status>"

  # === ACTION ===
  When the member opens "/projects/{project_slug}/traceability?story={story_id}"

  # === VALIDATIONS ===
  Then the status pill for that Test shows "<expected_copy>"

  Examples:
    | run_status | expected_copy |
    | pass       | Pass           |
    | fail       | Fail           |
    | blocked    | Blocked        |
    | skipped    | Aborted        |
```

## Variables

| Variable | How to obtain |
| --- | --- |
| `{project_slug}` | Project settings, or the `/projects` list |
| `{story_id}` | `data-testid="story-row-<uuid>"` in the traceability sidebar |

## Preconditions

A seeded story whose latest run can be set to each of the 4 terminal statuses in turn.

## Expected results

Each of the 4 terminal statuses renders its matching status pill copy, per the AC-01 vocabulary as corrected post-BK-317 (pass/fail/blocked/skipped, rendered as Pass/Fail/Blocked/Aborted).

---

**Related Story**: BK-45 — TMS-Traceability | Render full US to bug evidence chain in one read
**Regression epic**: BK-70 (QA Test Repository)
**Source**: BK-45 ATP Stage 1 (2026-08-05), executed and recorded in the BK-45 ATR (2026-08-08)
**Prior bugs in this area**: BK-317 (Defect, closed — run-status vocabulary mismatch)

---

## Related Issues

- tests: [BK-45](https://jira.upexgalaxy.com/browse/BK-45) - TMS-Traceability | Render full US to bug evidence chain in one read

# TEST: BK-45: TC08: should not show a defect belonging to a different story's ATC even when sharing a Test/Run

**Jira Key:** [BK-460](https://upexgalaxy71.atlassian.net/browse/BK-460)
**Status:** Candidate
**Components:** Coverage & Traceability

---

## Test Description

## Why this is regression-worthy

This is the dominant security risk this ATP identified. Defects are scoped via `bugs.atc_id`, not `run_id`, specifically so that a defect belonging to a *different* story's ATC never bleeds into this story's chain — even when the underlying Test/Run row is shared across stories. A unit/DB-integration test (`story-traceability-isolation.test.ts`, 11/11 passing) proves the SQL predicate is correct in isolation; it does NOT prove the live UI actually respects that scoping boundary end-to-end against a real shared Run. A regression here would be a CRITICAL-severity cross-story data leak — exactly the scenario this ATP's Risk-Level HIGH veto (auth/authorization + data integrity on core entities) is anchored on. This case came back clean in Stage 2 (BK-45 ATR), but its severity ceiling is why it must stay in the regression suite permanently rather than being verified once and forgotten.

## ROI

| Factor | Score | Reasoning |
| --- | --- | --- |
| Frequency | 4 | Any PR touching defect scoping or the shared-Run join path |
| Impact | 5 | A leak here is a CRITICAL-severity cross-story data-disclosure defect |
| Stability | 4 | Scoping logic is settled and DB-integration tested 11/11 |
| Effort | 2 | Single page load against a purpose-built shared-Run fixture |
| Dependencies | 2 | The shared-Run fixture already exists, seeded on staging |

**ROI = (4 x 5 x 4) / (2 x 2) = 20.0** -> Candidate

## Test design

```gherkin
@high @regression @e2e @automation-candidate @BK-45
Scenario: should not show a defect belonging to a different story's ATC, even when sharing a Test/Run
  """
  Related Story: BK-45
  ATP outline: TC-BK45-08
  Priority/security item — cross-story defect-leak guard
  """

  # === PRECONDITIONS ===
  Given an authenticated workspace member with at least viewer role
  And a user story "{story_id}" in project "{project_slug}" whose ATC shares a Test/Run with a different story's ATC
  And that different story's ATC has a defect linked to it via "bugs.atc_id"

  # === ACTION ===
  When the member opens "/projects/{project_slug}/traceability?story={story_id}"

  # === VALIDATIONS ===
  Then the shared Run renders normally for this story's own ATC
  And the foreign story's defect does NOT appear anywhere in this story's chain
```

## Variables

| Variable | How to obtain |
| --- | --- |
| `{project_slug}` | Project settings, or the `/projects` list |
| `{story_id}` | `data-testid="story-row-<uuid>"` in the traceability sidebar |

## Preconditions

A shared Run chaining BK-35's ATC-B and the `bk-45-fixtures` "Full chain renders…" ATC in one run, purpose-built for this cross-story defect-leak check. Already seeded on staging.

## Expected results

The foreign-story defect never appears in this story's rendered chain; the shared Run itself still renders correctly for this story's own ATC.

---

**Related Story**: BK-45 — TMS-Traceability | Render full US to bug evidence chain in one read
**Regression epic**: BK-70 (QA Test Repository)
**Source**: BK-45 ATP Stage 1 (2026-08-05), executed and recorded in the BK-45 ATR (2026-08-08)

---

## Related Issues

- tests: [BK-45](https://jira.upexgalaxy.com/browse/BK-45) - TMS-Traceability | Render full US to bug evidence chain in one read

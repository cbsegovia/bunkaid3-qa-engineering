# TEST: BK-45: TC05: should not show a misleading verdict when the latest run is in-flight

**Jira Key:** [BK-458](https://jira.upexgalaxy.com/browse/BK-458)
**Status:** Borrador
**Components:** Coverage & Traceability

---

## Test Description

## Why this is regression-worthy

A run that is still "running" must never be presented as a false pass or fail — this is a correctness-of-verdict guarantee on a QA/coverage read surface. A resolver-level unit test proving "the running discriminator outranks any position-level pass/fail" does not prove the live UI actually suppresses a stale or misleading pill while a run is genuinely in-flight. A regression that let a stale prior-run status leak through during an active run would silently give a reviewer false confidence about current coverage.

## ROI

| Factor | Score | Reasoning |
| --- | --- | --- |
| Frequency | 4 | Any PR touching run-status resolution risks this |
| Impact | 5 | A misleading verdict undermines trust in the whole traceability read |
| Stability | 4 | The running-discriminator rule is settled and ratified |
| Effort | 2 | Single page load against a seeded in-flight run |
| Dependencies | 3 | Requires seeding a genuinely "running" run state |

***ROI = (4 x 5 x 4) / (2 x 3) = 13.3*** -> Candidate

## Test design

```gherkin
@regression @e2e @automation-candidate @BK-45
Scenario: should not show a misleading verdict when the latest run is in-flight
  """
  Related Story: BK-45
  ATP outline: TC-BK45-05
  """

  # === PRECONDITIONS ===
  Given an authenticated workspace member with at least viewer role
  And a user story "{story*id}" in project "{project*slug}" whose latest run has status "running"

  # === ACTION ===
  When the member opens "/projects/{project*slug}/traceability?story={story*id}"

  # === VALIDATIONS ===
  Then the Test shows an in-progress state, not a pass or fail pill
  And no prior run's pass/fail/blocked/skipped status is shown in its place
```

## Variables

| Variable | How to obtain |
| --- | --- |
| `{project_slug}` | Project settings, or the `/projects` list |
| `{story_id}` | `data-testid="story-row-<uuid>"` in the traceability sidebar |

## Preconditions

A seeded story whose latest run is currently in the "running" state.

## Expected results

The in-progress state renders; no stale pass/fail/blocked/skipped pill is shown.

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

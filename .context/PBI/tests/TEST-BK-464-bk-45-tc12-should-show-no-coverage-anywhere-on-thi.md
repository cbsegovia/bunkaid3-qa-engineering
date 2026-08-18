# TEST: BK-45: TC12: should show No coverage anywhere on this story given a story with ACs but zero ATCs bound

**Jira Key:** [BK-464](https://jira.upexgalaxy.com/browse/BK-464)
**Status:** Borrador
**Components:** Coverage & Traceability

---

## Test Description

## Why this is regression-worthy

The "No coverage anywhere on this story" banner distinguishes "this story has ACs but zero coverage" from a blank page or broken render — this is a data-integrity-of-UI-state guarantee. A regression that silently fell back to a blank screen, an infinite spinner, or a generic placeholder instead of the explicit banner would look like an application outage to a QA reviewer or PO, not a legitimate zero-coverage state, and could mask the real signal (this story genuinely has no test coverage yet) behind what looks like a bug report waiting to happen.

## ROI

| Factor | Score | Reasoning |
| --- | --- | --- |
| Frequency | 4 | Any PR touching the zero-coverage banner or story-level resolver |
| Impact | 4 | Wrong rendering here reads as an outage, not a legitimate state |
| Stability | 4 | Banner logic is settled |
| Effort | 2 | Single page load against a zero-coverage story |
| Dependencies | 2 | Needs a story whose ACs each show the uncovered strip |

***ROI = (4 x 4 x 4) / (2 x 2) = 16.0*** -> Candidate

## Test design

```gherkin
@regression @e2e @automation-candidate @BK-45
Scenario: should show "No coverage anywhere on this story" when a story has ACs but zero ATCs bound to any of them
  """
  Related Story: BK-45
  ATP outline: TC-BK45-12
  """

  # === PRECONDITIONS ===
  Given an authenticated workspace member with at least viewer role
  And a user story "{story*id}" in project "{project*slug}" with 1 or more ACs, none of which have any ATC bound

  # === ACTION ===
  When the member opens "/projects/{project*slug}/traceability?story={story*id}"

  # === VALIDATIONS ===
  Then a distinct "No coverage anywhere on this story" banner renders
  And each individual AC row still renders its own uncovered strip
  And no blank screen, spinner, or placeholder is shown instead
```

## Variables

| Variable | How to obtain |
| --- | --- |
| `{project_slug}` | Project settings, or the `/projects` list |
| `{story_id}` | `data-testid="story-row-<uuid>"` in the traceability sidebar |

## Preconditions

Story `d6e3c9f4-47ff-4031-81aa-9f7a8159aa64` — zero-coverage banner fixture, seeded on staging.

## Expected results

The distinct zero-coverage banner renders; no blank screen or spinner.

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

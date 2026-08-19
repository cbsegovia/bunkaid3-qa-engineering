# TEST: BK-45: TC20: should render the chain for a draft-status Story with no additional lifecycle gate

**Jira Key:** [BK-452](https://jira.upexgalaxy.com/browse/BK-452)
**Status:** Borrador
**Components:** Coverage & Traceability

---

## Test Description

## Why this is regression-worthy

This case guards against an over-eager lifecycle gate: a draft-status Story must be fully accessible on the traceability view, exactly like any other status, with no additional gate imposed. Since the access-control surface on this story is under heavy scrutiny (auth veto, non-disclosure rules, archived-story handling), a plausible regression is a developer adding a defensive "only show published stories" check that inadvertently blocks drafts too — which would be an over-restriction bug, not a security fix. Unit tests on the lifecycle-status resolver can assert the state in isolation; only a live render proves a draft story genuinely reaches the same fully-populated chain as any other status, with no silent redirect or gate.

## ROI

| Factor | Score | Reasoning |
| --- | --- | --- |
| Frequency | 3 | Touched whenever Story-lifecycle gating logic changes |
| Impact | 3 | Over-restriction bug (draft blocked), not a data leak |
| Stability | 4 | "No additional lifecycle gate" ruling is finalized (EC11) |
| Effort | 1 | Single draft-status story, single page load |
| Dependencies | 1 | Any existing draft-status story works, no dedicated fixture required |

********ROI = (3 x 3 x 4) / (1 x 1) = 36.0**** -> Candidate

## Test design

```gherkin
@medium @regression @e2e @automation-candidate @BK-45
Scenario: should render the chain for a draft-status Story with no additional lifecycle gate
  """
  Related Story: BK-45
  Test outline: TC-BK45-20 (ATP Stage 1) — State-Transition / EC11
  """

  # === PRECONDITIONS ===
  Given an authenticated workspace member with at least viewer role
  And a user story "{story_id}" whose lifecycle status is draft

  # === ACTION ===
  When the member opens "/projects/{project*slug}/traceability?story={story*id}"

  # === VALIDATIONS ===
  Then the view is fully accessible, identical to any other story lifecycle status
  And no additional gate, redirect, or restricted-content banner appears
```

## Variables

| Variable | How to obtain |
| --- | --- |
| `{project_slug}` | Project settings, or the `/projects` list |
| `{story_id}` | `data-testid="story-row-<uuid>"` in the traceability sidebar |

## Preconditions

Any story with lifecycle status = draft.

## Expected results

The chain renders exactly as it would for any other lifecycle status, with no extra gate.

---

***Related Story***: BK-45 — TMS-Traceability | Render full US to bug evidence chain in one read
***Regression epic***: BK-70 (QA Test Repository)
***Source***: BK-45 ATP Stage 1 (2026-08-05), executed and recorded in the BK-45 ATR (2026-08-08)

---

## Related Issues

- tests: [BK-45](https://jira.upexgalaxy.com/browse/BK-45) - TMS-Traceability | Render full US to bug evidence chain in one read

---

## Metadata

- **Created:** 14/8/2026
- **Updated:** 14/8/2026
- **Reporter:** Benjamin Segovia
- **Assignee:** Benjamin Segovia
- **Labels:** automation-candidate, regression, traceability

---

_Synced from Jira by sync-jira-issues_

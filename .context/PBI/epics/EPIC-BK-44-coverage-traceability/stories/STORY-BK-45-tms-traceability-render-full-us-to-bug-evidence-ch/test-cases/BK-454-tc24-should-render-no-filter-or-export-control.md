# TEST: BK-45: TC24: should render no filter or export control anywhere on the view

**Jira Key:** [BK-454](https://upexgalaxy71.atlassian.net/browse/BK-454)
**Status:** Candidate
**Components:** Coverage & Traceability

---

## Test Description

## Why this is regression-worthy

BK-45's ATP explicitly ratifies that filtering (BK-48) and export (BK-50) are out of scope by design for this story. This case is a scope-boundary regression guard: as BK-48 and BK-50 land in parallel, there is a real risk that a shared-component change (e.g. a toolbar refactor) prematurely surfaces a filter or export control on the BK-45 view before its own story is ready, confusing users mid-rollout, or that a merge conflict silently pulls in a control meant for a different route. Unit tests scoped to BK-45's own component tree wouldn't catch a control leaking in from a shared layout or toolbar; only a live render across every chain state (happy path, zero-coverage, error) proves no filter or export UI appears anywhere on this specific view.

## ROI

| Factor | Score | Reasoning |
| --- | --- | --- |
| Frequency | 3 | Elevated risk window while BK-48/BK-50 are actively shipping in parallel |
| Impact | 3 | Premature UI exposure confuses users, but is not a data or security issue |
| Stability | 3 | This guard's relevance decays as BK-48/BK-50 ship — worth revisiting then |
| Effort | 1 | A negative-assertion sweep across the page, no dedicated fixture |
| Dependencies | 1 | Runs against any existing chain state |

**ROI = (3 x 3 x 3) / (1 x 1) = 27.0** -> Candidate. Note: retire or update this guard once BK-48 (filtering) and BK-50 (export) ship and their controls become in-scope for this view.

## Test design

```gherkin
@medium @regression @e2e @automation-candidate @BK-45
Scenario: should render no filter or export control anywhere on the view
  """
  Related Story: BK-45
  Test outline: TC-BK45-24 (ATP Stage 1) — Error-Guessing / scope guard (BK-48/BK-50 out-of-scope-by-design)
  """

  # === PRECONDITIONS ===
  Given an authenticated workspace member with at least viewer role
  And a user story "{story_id}" in any chain state (fully covered, zero-coverage, or error)

  # === ACTION ===
  When the member opens "/projects/{project_slug}/traceability?story={story_id}"

  # === VALIDATIONS ===
  Then no filter control (dropdown, search box, toggle) is present anywhere on the page
  And no export/download control is present anywhere on the page
```

## Variables

| Variable | How to obtain |
| --- | --- |
| `{project_slug}` | Project settings, or the `/projects` list |
| `{story_id}` | `data-testid="story-row-<uuid>"` in the traceability sidebar |

## Preconditions

Any existing story in any chain state.

## Expected results

No filter or export control appears anywhere on the traceability view, in any state.

---

**Related Story**: BK-45 — TMS-Traceability | Render full US to bug evidence chain in one read
**Regression epic**: BK-70 (QA Test Repository)
**Source**: BK-45 ATP Stage 1 (2026-08-05), executed and recorded in the BK-45 ATR (2026-08-08)

---

## Related Issues

- tests: [BK-45](https://jira.upexgalaxy.com/browse/BK-45) - TMS-Traceability | Render full US to bug evidence chain in one read

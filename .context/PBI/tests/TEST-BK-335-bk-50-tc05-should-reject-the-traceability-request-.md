# TEST: BK-50: TC05: should reject the traceability request with 401 given an unauthenticated API caller

**Jira Key:** [BK-335](https://jira.upexgalaxy.com/browse/BK-335)
**Status:** AUTOMATED
**Components:** Coverage & Traceability

---

## Test Description

## Why this is regression-worthy

The API path is the one an attacker would actually take, and it is not covered by the browser case — a page-level redirect and a route-level 401 are enforced by different layers. AC E2 explicitly requires both.

## ROI

| Factor | Score | Reasoning |
| --- | --- | --- |
| Frequency | 5 | Every PR |
| Impact | 5 | Direct unauthenticated data access |
| Stability | 5 | Route auth is settled |
| Effort | 1 | One unauthenticated request |
| Dependencies | 1 | None |

***ROI = (5 x 5 x 5) / (1 x 1) = 125.0*** -> Candidate

## Test design

```gherkin
@critical @regression @integration @automation-candidate @security @BK-50
Scenario: should reject an unauthenticated API caller with 401
  """
  Related Story: BK-50
  ATP outline: TC-BK50-20
  """

  # === PRECONDITIONS ===
  Given no authentication header and no session cookie

  # === ACTION ===
  When GET "/api/v1/projects/{project*id}/traceability?story={story*id}" is called

  # === VALIDATIONS ===
  Then the response status is 401
  And the error code is "unauthorized"
  And the response body carries no story, criteria, ATC, run or defect data
```

## Variables

| Variable | How to obtain |
| --- | --- |
| `{project_id}` | Project UUID |
| `{story_id}` | Story UUID |

## Refinement notes

***BK-329 is open against this exact route****: the `{project*id}` path segment is validated for UUID shape but never checked against the story's real project, so any well-formed UUID returns the chain. This TC asserts the **authentication* gate only and passes regardless. When BK-329 is fixed, extend this case — or add a sibling — to assert that a mismatched project id returns the uniform `404 not*found`.

## Expected results

`401` with `{"error":{"code":"unauthorized"}}` and no chain payload.

---

***Related Story***: BK-50 — TMS-Traceability | Export the assembled chain as a read-only snapshot
***Regression epic***: BK-70 (QA Test Repository)
***Source***: BK-50 ATP in-sprint section (2026-08-09), executed and recorded in the BK-50 ATR
***Prior bugs in this area***: BK-329 (Defect, Menor — route ignores its `{projectId}` segment) · BK-317 (Defect, closed — run-state vocabulary)

---

## Related Issues

- tests: [BK-50](https://jira.upexgalaxy.com/browse/BK-50) - TMS-Traceability | Export the assembled chain as a read-only snapshot

---

## Metadata

- **Created:** 9/8/2026
- **Updated:** 17/8/2026
- **Reporter:** Benjamin Segovia
- **Assignee:** Benjamin Segovia
- **Labels:** automation-candidate, critical, integration, regression, security

---

_Synced from Jira by sync-jira-issues_

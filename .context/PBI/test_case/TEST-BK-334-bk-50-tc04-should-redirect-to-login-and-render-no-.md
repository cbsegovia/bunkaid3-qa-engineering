# TEST: BK-50: TC04: should redirect to login and render no chain data given an unauthenticated browser session

**Jira Key:** [BK-334](https://jira.upexgalaxy.com/browse/BK-334)
**Status:** Candidate
**Components:** Coverage & Traceability

---

## Test Description

## Why this is regression-worthy

The traceability screen is the entry point to the export, so its auth gate is the export's auth gate. Cheap to assert, catastrophic if it regresses, and entirely outside what a unit test sees.

## ROI

| Factor | Score | Reasoning |
| --- | --- | --- |
| Frequency | 5 | Every PR — auth regressions are the ones you want caught earliest |
| Impact | 5 | Unauthenticated access to evidence chains |
| Stability | 5 | Auth middleware has been stable for months |
| Effort | 1 | One unauthenticated navigation |
| Dependencies | 1 | None beyond a known story URL |

***ROI = (5 x 5 x 5) / (1 x 1) = 125.0*** -> Candidate

## Test design

```gherkin
@critical @regression @e2e @automation-candidate @security @BK-50
Scenario: should redirect an unauthenticated browser to login without rendering data
  """
  Related Story: BK-50
  ATP outline: TC-BK50-19
  """

  # === PRECONDITIONS ===
  Given no authenticated session

  # === ACTION ===
  When "/projects/{project*slug}/traceability?story={story*id}" is requested

  # === VALIDATIONS ===
  Then the response is a redirect to "/login"
  And the redirect preserves the original path in its "next" parameter
  And no chain content appears in the response body
```

## Preconditions

None. Run with a clean browser context or a bare HTTP client.

## Expected results

`307` to `/login?next=<original-path>`, with no chain markup in the body. Asserting the absence of chain content matters as much as the redirect: a redirect that still streams the data first is a leak.

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
- **Updated:** 9/8/2026
- **Reporter:** Benjamin Segovia
- **Assignee:** Benjamin Segovia
- **Labels:** automation-candidate, critical, e2e, regression, security

---

_Synced from Jira by sync-jira-issues_

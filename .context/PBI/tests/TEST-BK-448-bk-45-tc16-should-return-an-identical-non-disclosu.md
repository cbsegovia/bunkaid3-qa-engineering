# TEST: BK-45: TC16: should return an identical non-disclosure response given foreign-workspace or nonexistent story

**Jira Key:** [BK-448](https://jira.upexgalaxy.com/browse/BK-448)
**Status:** Borrador
**Components:** Coverage & Traceability

---

## Test Description

## Why this is regression-worthy

This is the dominant risk driver named in the ATP: a read path over sensitive coverage/defect data spanning workspaces, where the one negative finding possible here — a data leak — would be CRITICAL severity. AC-05 requires "403 Forbidden or equivalent access-denied UI"; the shipped implementation maps both "foreign-workspace story" and "nonexistent story ID" to the same uniform HTTP 404 `not_found` with identical wording. This is a deliberate non-disclosure/anti-enumeration pattern (matching BK-175 and BK-23) — a caller must NOT be able to distinguish "story exists but you can't see it" from "story doesn't exist", because that distinction is itself a resource-existence enumeration side-channel across workspace boundaries. Unit tests on `mapTraceabilityRpcError` assert the mapping function's return value in isolation; only a live E2E hitting both real routes proves the two HTTP responses are byte-identical (status + message) and that neither leaks any chain data into the DOM or network payload.

## ROI

| Factor | Score | Reasoning |
| --- | --- | --- |
| Frequency | 5 | Every PR touching the RPC error boundary or the access-control layer |
| Impact | 5 | Tenant-isolation / anti-enumeration is the dominant HIGH-risk driver for this story |
| Stability | 4 | Uniform-404 convention is ratified (PO comment 12171/12176, QA note 12221) |
| Effort | 3 | Requires two distinct negative scenarios (foreign-workspace, nonexistent ID) parametrized |
| Dependencies | 2 | Needs a second workspace with a real foreign story, plus a random nonexistent story id |

********ROI = (5 x 5 x 4) / (3 x 2) = 16.7**** -> Candidate

## Test design

```gherkin
@high @regression @e2e @automation-candidate @BK-45
Scenario Outline: should return an identical non-disclosure response for foreign-workspace and nonexistent stories
  """
  Related Story: BK-45
  Test outline: TC-BK45-16 (ATP Stage 1) — Decision Table rules 3+4, collapsed (same outcome)
  Discrepancy triage: AC-05 permits "equivalent access-denied UI"; a uniform 404 satisfies it and is the deliberate non-disclosure PASS condition — see ATP discrepancy note
  """

  # === PRECONDITIONS ===
  Given an authenticated member of workspace "{own*workspace*slug}"
  And "<target*case>" targets "{target*story_id}"

  # === ACTION ===
  When the member opens "/projects/{project*slug}/traceability?story={target*story_id}"

  # === VALIDATIONS ===
  Then the response status is 404
  And the response body reads "User story not found."
  And zero chain data (AC, ATC, Test, Run, Defect) is present in the DOM or network payload
  And the response is identical (status + message) across both rows of this outline

  Examples:
    | target_case              |
    | a real foreign-workspace story |
    | a random nonexistent story ID  |
```

## Variables

| Variable | How to obtain |
| --- | --- |
| `{project_slug}` | Project settings, or the `/projects` list |
| `{own*workspace*slug}` | The authenticated member's own workspace, distinct from the target story's workspace |
| `{target*story*id}` | A real story ID belonging to a different workspace (row 1), or a random UUID with no matching row (row 2) |

## Preconditions

An authenticated member of one workspace, plus a real story belonging to a different workspace, plus a random nonexistent story UUID.

## Expected results

Both cases return the same HTTP 404 with the same "User story not found." message; no chain data leaks in either case.

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
- **Labels:** automation-candidate, high, regression, traceability

---

_Synced from Jira by sync-jira-issues_

# TEST: BK-50: TC06: should expose no hosted artifact, public link or share control anywhere on the traceability screen

**Jira Key:** [BK-336](https://jira.upexgalaxy.com/browse/BK-336)
**Status:** Candidate
**Components:** Coverage & Traceability

---

## Test Description

## Why this is regression-worthy

The Option E ratification (comments 12238/12239) is explicit that v1 ships ***no*** object storage, hosted artifact, public link, signed URL or anonymous retrieval path. That is a negative guarantee, and negative guarantees rot silently — nobody notices when a share button appears. This case is the guard that makes the scope decision enforceable rather than aspirational.

It is deliberately scoped to the screen's controls and the export response, not to a general crawl. When anonymous link-sharing is eventually built as its own story, this TC is the one that must be consciously retired — which is the point.

## ROI

| Factor | Score | Reasoning |
| --- | --- | --- |
| Frequency | 3 | Every sprint touching the traceability surface |
| Impact | 4 | A silent share affordance would breach the ratified scope and the security posture behind it |
| Stability | 3 | Will legitimately change when sharing ships |
| Effort | 2 | Absence assertions on a known screen |
| Dependencies | 1 | None |

***ROI = (3 x 4 x 3) / (2 x 1) = 18.0*** -> Candidate

## Test design

```gherkin
@medium @regression @e2e @automation-candidate @security @BK-50
Scenario: should expose no share, publish or public-link affordance
  """
  Related Story: BK-50
  ATP outline: TC-BK50-21
  Scope guard for the Option E ruling (comments 12238/12239)
  """

  # === PRECONDITIONS ===
  Given an authenticated member viewing a story's traceability chain

  # === ACTION ===
  When the screen's controls are enumerated

  # === VALIDATIONS ===
  Then the only mutating control present is "Export snapshot"
  And no control offering share, publish, copy-link or public-link is present
  And the export delivers a file download rather than a URL to a hosted artifact
```

## Preconditions

An authenticated session on a story with any chain state.

## Expected results

Exactly one mutating control. ***When this test fails because sharing was intentionally built, retire it deliberately and record the decision*** — do not weaken the assertion to make it pass.

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
- **Labels:** automation-candidate, e2e, medium, regression, security

---

_Synced from Jira by sync-jira-issues_

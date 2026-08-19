# TEST: BK-50: TC03: should preserve the chain exactly as captured when the live chain changes after the export

**Jira Key:** [BK-333](https://jira.upexgalaxy.com/browse/BK-333)
**Status:** AUTOMATED
**Components:** Coverage & Traceability

---

## Test Description

## Why this is regression-worthy

Immutability is the story's central promise and its highest-priority acceptance criterion (AC2.1, Critical). A snapshot that silently reflects later changes is worse than no snapshot: it looks like evidence and is not. No unit test can prove this — it needs two real exports with a real mutation between them.

## ROI

| Factor | Score | Reasoning |
| --- | --- | --- |
| Frequency | 4 | Every release |
| Impact | 5 | Audit integrity; the artifact's entire reason to exist |
| Stability | 4 | Behaviour is settled and by-construction (synchronous render, no live binding) |
| Effort | 3 | Requires a mutation and a guaranteed revert |
| Dependencies | 3 | Needs write access to seeded data |

***ROI = (4 x 5 x 4) / (3 x 3) = 8.9*** -> Candidate

## Test design

```gherkin
@critical @regression @e2e @automation-candidate @BK-50
Scenario: should preserve the captured chain when the live chain changes afterward
  """
  Related Story: BK-50
  ATP outline: TC-BK50-11
  """

  # === PRECONDITIONS ===
  Given a user story "{story*id}" with a populated chain and a known title "{original*title}"

  # === ACTION ===
  When the member exports a snapshot at T0
  And the story is amended so that its rendered chain differs from the T0 state
  And the member exports a second snapshot at T1

  # === VALIDATIONS ===
  Then the T0 document still shows the pre-amendment state
  And the T1 document shows the amended state
  And the T0 document's footer stamp is earlier than the T1 document's

  # === TEARDOWN (mandatory) ===
  And the story is restored to "{original_title}"
```

## Variables

| Variable | How to obtain |
| --- | --- |
| `{story_id}` | Traceability sidebar `data-testid` |
| `{original_title}` | Read before mutating; restore to this exact value |

## Preconditions

Write access to the story. `PATCH /api/v1/user-stories/{id}` accepts `title`. Note that the sibling `/api/v1/tests/{id}` endpoint returns 405 — there is no write path for Tests, so the story title is the available mutation lever.

## Expected results

The T0 artifact is byte-stable against the live change. ***The teardown is part of the test, not an afterthought*** — an aborted run must not leave the fixture renamed.

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
- **Labels:** automation-candidate, critical, e2e, regression, traceability

---

_Synced from Jira by sync-jira-issues_

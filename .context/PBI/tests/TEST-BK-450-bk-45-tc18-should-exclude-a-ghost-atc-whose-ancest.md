# TEST: BK-45: TC18: should exclude a ghost ATC whose ancestor module was archived, given archived_at is null on the ATC

**Jira Key:** [BK-450](https://jira.upexgalaxy.com/browse/BK-450)
**Status:** Borrador
**Components:** Coverage & Traceability

---

## Test Description

## Why this is regression-worthy

This case is a named regression class (EC7, error-guessing technique) that a naive implementation is specifically prone to reintroducing: a "ghost" ATC whose own `archived*at` column is `null`, but whose ancestor module was archived via `bunkai*archive*module*subtree`. A single-predicate filter (`WHERE atc.archived*at IS NULL`) would let this ATC leak through, because the archival signal lives on an ancestor, not on the row itself. The shipped fix uses a 3-predicate filter that walks the ancestor chain. A future refactor of the chain-assembly query that "simplifies" the filter back to a single predicate would silently reintroduce this leak, and no unit test on the ATC's own row would catch it — only a live fixture built through the real archival RPC (not a hand-seeded `archived*at` flag) proves the ancestor-aware filter still works end-to-end.

## ROI

| Factor | Score | Reasoning |
| --- | --- | --- |
| Frequency | 3 | Touched only when the chain-assembly query or the archival filter changes |
| Impact | 4 | A regressed ghost-ATC leak surfaces retired module content as if still active |
| Stability | 3 | The 3-predicate filter is a less-obvious code path, more prone to future "simplification" |
| Effort | 3 | Requires seeding a module hierarchy and archiving it via the real subtree RPC, not a flag |
| Dependencies | 3 | Needs the `bunkai*archive*module_subtree` RPC and a dedicated ghost-module fixture |

********ROI = (3 x 4 x 3) / (3 x 3) = 4.0**** -> Candidate

## Test design

```gherkin
@medium @regression @e2e @automation-candidate @BK-45
Scenario: should exclude a "ghost" ATC whose ancestor module was archived
  """
  Related Story: BK-45
  Test outline: TC-BK45-18 (ATP Stage 1) — Error-Guessing / EC7 regression
  """

  # === PRECONDITIONS ===
  Given an authenticated workspace member with at least viewer role
  And an ATC bound to acceptance criterion "{ac*id}" on user story "{story*id}"
  And the ATC's ancestor module was archived via "bunkai*archive*module*subtree", while the ATC's own `archived*at` remains null

  # === ACTION ===
  When the member opens "/projects/{project*slug}/traceability?story={story*id}"

  # === VALIDATIONS ===
  Then the ghost ATC does not render under "{ac_id}"
  And no reference to the ghost ATC appears anywhere on the page
```

## Variables

| Variable | How to obtain |
| --- | --- |
| `{project_slug}` | Project settings, or the `/projects` list |
| `{story_id}` | `data-testid="story-row-<uuid>"` in the traceability sidebar |
| `{ac_id}` | The acceptance criterion card's `data-testid="ac-card-<uuid>"` |

## Preconditions

Module `bk-45-fixtures/ghost-sub` archived via `bunkai*archive*module_subtree`, hosting an ATC bound to a story's AC, seeded on staging (used for TC-18).

## Expected results

The ghost ATC is fully excluded from the chain, confirming the 3-predicate ancestor-aware filter, not just a same-row `archived_at` check.

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

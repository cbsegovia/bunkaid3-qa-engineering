# TEST: BK-148: TC#6: should delete an unused environment and block deletion while any run of any status references it

**Jira Key:** [BK-195](https://jira.upexgalaxy.com/browse/BK-195)
**Status:** Candidate
**Components:** None

---

## Test Description

## Related Story

[https://jira.upexgalaxy.com/browse/BK-148#icft=BK-148](https://jira.upexgalaxy.com/browse/BK-148#icft=BK-148)

## Priority

high — delete guard protects run referential integrity

## ROI

6.7 · Candidate

## Covers

ATP TC#15 (delete unused) + TC#16/17 (blocked with runs) + TC#18 (blocked even with completed runs)

## Refinement notes (ATP-vs-code)

1. Guard counts runs of ***ANY status***, not only "active" (`0032:244-250`).
2. DELETE success body is double-nested: `{"deleted":{"deleted":true,"id":...`}} — assert that shape, not `{"deleted":true`}.

## Test Design

```
@high @regression @automation-candidate @BK-148
Scenario Outline: should delete only when no run references the environment
  # === PRECONDITIONS ===
  Given environment "{env_id}" exists in "{project}"
  And it is referenced by <run*count> runs of status "<run*status>"
  # === ACTION ===
  When a member DELETE "/api/v1/environments/{env_id}"
  # === VALIDATIONS ===
  Then the response status is <status>
  And <assertion>
  # === EQUIVALENT PARTITIONS ===
  Examples: no runs -> deletable
    | run*count | run*status | status | assertion                                    |
    | 0         | n/a        | 200    | body.deleted.deleted is true                 |
  Examples: referenced -> blocked (any status)
    | run*count | run*status | status | assertion                                    |
    | 1         | active     | 409    | code "conflict"; message has "1 run(s)"      |
    | 5         | active     | 409    | code "conflict"; message has "5 run(s)"      |
    | 3         | completed  | 409    | code "conflict" (all-status count)           |
```

## Variables

| ***Variable**** | ****How to obtain*** |
| --- | --- |
| {env_id} | Env to delete; seed runs against it per row |
| runs | Insert into `runs` with `environment*id={env*id`} and the given status |

## Architecture

API. Pre-count raise 45211 with `run_count`; FK backstop 23503 (`0032:244-250`; `errors.ts:30-35,62-69`).

## Expected

200 nested-deleted when unused; 409 `conflict` with run count in `details.run_count` for any referencing run regardless of status.

---

## Related Issues

- is tested by: [BK-148](https://jira.upexgalaxy.com/browse/BK-148) - TMS-Project Environments | List, add, rename and remove environments

---

## Metadata

- **Created:** 10/7/2026
- **Updated:** 10/7/2026
- **Reporter:** micaelavirgagarcia
- **Assignee:** micaelavirgagarcia
- **Labels:** automation-candidate, high, integration, regression

---

_Synced from Jira by sync-jira-issues_

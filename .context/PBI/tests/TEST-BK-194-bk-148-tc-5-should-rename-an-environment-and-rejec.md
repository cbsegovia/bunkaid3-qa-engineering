# TEST: BK-148: TC#5: should rename an environment and reject a rename to an existing name

**Jira Key:** [BK-194](https://jira.upexgalaxy.com/browse/BK-194)
**Status:** Candidate
**Components:** None

---

## Test Description

## Related Story

[https://jira.upexgalaxy.com/browse/BK-148#icft=BK-148](https://jira.upexgalaxy.com/browse/BK-148#icft=BK-148)

## Priority

high

## ROI

4.4 · Candidate

## Covers

ATP TC#12 (valid rename) + TC#13 (rename conflict)

## Test Design

```
@high @regression @automation-candidate @BK-148
Scenario Outline: should rename with uniqueness enforced
  # === PRECONDITIONS ===
  Given project "{project}" has environments "{env1}" and "{env2}"
  # === ACTION ===
  When a member PATCH "/api/v1/environments/{env2_id}" with {"name":"<name>"}
  # === VALIDATIONS ===
  Then the response status is <status>
  And <assertion>
  # === EQUIVALENT PARTITIONS ===
  Examples: valid rename
    | name  | status | assertion                        |
    | Prod  | 200    | body.environment.name is "Prod"  |
  Examples: rename to existing name
    | name    | status | assertion                      |
    | {env1}  | 409    | code is "conflict" / environment*name*taken |
```

## Variables

| ***Variable**** | ****How to obtain*** |
| --- | --- |
| {env1},{env2} | Two seeded envs in {project} |
| {env2_id} | id of {env2} |

## Architecture

API. `app/api/v1/environments/[id]/route.ts:21-45`.

## Expected

200 for valid rename; 409 `conflict` when the target name already exists.

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

# TEST: BK-148: TC#3: should create a unique environment and reject duplicates case-insensitively

**Jira Key:** [BK-192](https://jira.upexgalaxy.com/browse/BK-192)
**Status:** Candidate
**Components:** None

---

## Test Description

## Related Story

[https://jira.upexgalaxy.com/browse/BK-148#icft=BK-148](https://jira.upexgalaxy.com/browse/BK-148#icft=BK-148)

## Priority

high — uniqueness protects data integrity

## ROI

5.3 · Candidate

## Covers

ATP TC#5 (create valid) + TC#7 (exact-case dup) + TC#8 (case-insensitive dup)

## Test Design

```
@high @regression @automation-candidate @BK-148
Scenario Outline: should create a unique environment and reject duplicates
  # === PRECONDITIONS ===
  Given project "{project}" has an environment named "{existing}"
  # === ACTION ===
  When a member POST "/api/v1/projects/{project}/environments" with {"name":"<name>"}
  # === VALIDATIONS ===
  Then the response status is <status>
  And <assertion>
  # === EQUIVALENT PARTITIONS ===
  Examples: valid unique name
    | name       | status | assertion                                  |
    | Production | 201    | body.environment.name is "Production"      |
  Examples: duplicate exact case
    | name       | status | assertion                                  |
    | {existing} | 409    | error code is "conflict" / environment*name*taken |
  Examples: duplicate case-insensitive
    | name       | status | assertion                                  |
    | {EXISTING_UPPER} | 409 | error code is "conflict" (lower(name) index) |
```

## Variables

| ***Variable**** | ****How to obtain*** |
| --- | --- |
| {project} | A project the member owns |
| {existing} | Pre-seed one env, e.g. "Staging" |
| {EXISTING_UPPER} | Upper-cased {existing} |

## Architecture

API. Unique index `(project*id, lower(name))` → 23505 → 409 (`0031*runs.sql:38-39`; `errors.ts:51-55`).

## Expected

201 for unique; 409 `conflict`/`environment*name*taken` for both duplicate partitions.

---

## Related Issues

- is tested by: [BK-148](https://jira.upexgalaxy.com/browse/BK-148) - TMS-Project Environments | List, add, rename and remove environments

---

## Metadata

- **Created:** 10/7/2026
- **Updated:** 4/8/2026
- **Reporter:** micaelavirgagarcia
- **Assignee:** Deiberson Escalante
- **Labels:** automation-candidate, high, integration, regression

---

_Synced from Jira by sync-jira-issues_

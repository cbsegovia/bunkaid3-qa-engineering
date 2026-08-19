# TEST: BK-148: TC#2: should reject environment writes with 403 when the actor is a non-member or viewer

**Jira Key:** [BK-191](https://jira.upexgalaxy.com/browse/BK-191)
**Status:** Candidate
**Components:** None

---

## Test Description

## Related Story

[https://jira.upexgalaxy.com/browse/BK-148#icft=BK-148](https://jira.upexgalaxy.com/browse/BK-148#icft=BK-148)

## Priority

critical — authorization gate on a multi-tenant surface

## ROI

11.1 · Candidate

## Covers

ATP TC#2 (cross-workspace) + TC#3 (viewer role)

## Refinement note (ATP-vs-code)

ATP expected ***404 non-disclosing**** for cross-workspace. Code returns ****403 forbidden***: the RPC is SECURITY DEFINER and `project_environments` lacks FORCE RLS, so it reads the foreign row, resolves its project, then the write-gate rejects the non-member (42501 → 403). 404 fires only for a genuinely nonexistent id. This existence-disclosure gap is filed as an Improvement. This Test asserts the ACTUAL 403.

## Test Design

```
@critical @regression @automation-candidate @BK-148
Scenario Outline: should reject environment writes for a non-authorized actor
  # === PRECONDITIONS ===
  Given environment "{env_id}" exists in "{project}"
  And actor "<actor>" is <role_desc>
  # === ACTION ===
  When "<actor>" <method> "<path>" with body <body>
  # === VALIDATIONS ===
  Then the response status is 403
  And the error code is "forbidden"
  And details.reason is "not*a*member"
  And no row in project_environments is mutated
  # === EQUIVALENT PARTITIONS ===
  Examples: cross-workspace member
    | actor          | role_desc                        | method | path                                 | body               |
    | {user*other}   | member of a different workspace  | PATCH  | /api/v1/environments/{env*id}        | {"name":"Hacked"}  |
    | {user*other}   | member of a different workspace  | DELETE | /api/v1/environments/{env*id}        |                    |
  Examples: viewer role in same workspace
    | actor          | role_desc                        | method | path                                 | body               |
    | {user_viewer}  | viewer in the owning workspace   | POST   | /api/v1/projects/{project}/environments | {"name":"Nope"} |
    | {user*viewer}  | viewer in the owning workspace   | PATCH  | /api/v1/environments/{env*id}        | {"name":"Nope"}    |
```

## Variables

| ***Variable**** | ****How to obtain*** |
| --- | --- |
| {env*id} | An existing env in {project}; `SELECT id FROM project*environments WHERE project_id=...` |
| {user_other} | Member of a DIFFERENT workspace |
| {user_viewer} | Role=viewer in the owning workspace |

## Architecture

API (integration). Write-gate role check in `0021*atc*create_update.sql:49-56`; error mapping `lib/environments/errors.ts:39-44`.

## Expected

403 `forbidden`/`not*a*member` for every row; zero mutation. (Note: cross-workspace 403 vs 404 is the disclosure gap — see linked Improvement.)

---

## Related Issues

- is tested by: [BK-148](https://jira.upexgalaxy.com/browse/BK-148) - TMS-Project Environments | List, add, rename and remove environments
- relates to: [BK-200](https://jira.upexgalaxy.com/browse/BK-200) - Cross-workspace environment PATCH/DELETE discloses existence via 403 instead of non-disclosing 404

---

## Metadata

- **Created:** 10/7/2026
- **Updated:** 10/7/2026
- **Reporter:** micaelavirgagarcia
- **Assignee:** micaelavirgagarcia
- **Labels:** automation-candidate, critical, integration, regression

---

_Synced from Jira by sync-jira-issues_

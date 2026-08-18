# TEST: BK-148: TC#1: should list only the caller's project environments and return an empty list to non-members

**Jira Key:** [BK-190](https://jira.upexgalaxy.com/browse/BK-190)
**Status:** Candidate
**Components:** None

---

## Test Description

## Related Story

[https://jira.upexgalaxy.com/browse/BK-148#icft=BK-148](https://jira.upexgalaxy.com/browse/BK-148#icft=BK-148)

## Priority

critical — multi-tenant RLS is the platform value prop

## ROI

11.1 · Candidate

## Covers

ATP TC#1 (RLS list isolation)

## Test Design

```
@critical @regression @automation-candidate @BK-148
Scenario Outline: should return only the caller's project environments
  # === PRECONDITIONS ===
  Given workspace "{ws*a}" has project "{project*a}" with {n_a} environments
  And workspace "{ws*b}" has project "{project*b}"
  And user "{user*a}" is a member of "{ws*a}" only
  # === ACTION ===
  When "{user_a}" GET "/api/v1/projects/<project>/environments"
  # === VALIDATIONS ===
  Then the response status is <status>
  And the environments list length is <count>
  And the list is ordered by name ascending
  # === EQUIVALENT PARTITIONS ===
  Examples: member sees own project
    | project     | status | count |
    | {project*a} | 200    | {n*a} |
  Examples: non-member sees silent zero (no 403/404)
    | project     | status | count |
    | {project_b} | 200    | 0     |
```

## Variables

| ***Variable**** | ****How to obtain*** |
| --- | --- |
| {ws*a},{ws*b} | Two workspaces from seed; `SELECT id FROM workspaces LIMIT 2` |
| {project*a},{project*b} | One project per workspace |
| {user*a} | Member of ws*a only; PAT from QA bootstrap |
| {n*a} | Count of seeded envs in project*a |

## Architecture

API (integration). RLS SELECT policy `bunkai*is*workspace_member` — non-member yields 200 empty, not 403/404.

## Source refs

`app/api/v1/projects/[id]/environments/route.ts:19-40` · `supabase/migrations/0031_runs.sql:46-57`

## Expected

200 with only the caller's environments; non-member gets `{environments:[]`}; ordering by name asc.

---

## Related Issues

- is tested by: [BK-148](https://jira.upexgalaxy.com/browse/BK-148) - TMS-Project Environments | List, add, rename and remove environments

---

## Metadata

- **Created:** 10/7/2026
- **Updated:** 4/8/2026
- **Reporter:** micaelavirgagarcia
- **Assignee:** Deiberson Escalante
- **Labels:** automation-candidate, critical, integration, regression

---

_Synced from Jira by sync-jira-issues_

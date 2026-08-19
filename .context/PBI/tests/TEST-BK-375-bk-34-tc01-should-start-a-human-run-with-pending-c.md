# TEST: BK-34: TC01: should start a human Run with pending checklist from executable Test given authenticated member and valid start token

**Jira Key:** [BK-375](https://jira.upexgalaxy.com/browse/BK-375)
**Status:** Candidate
**Components:** None

---

## Test Description

## Related Story

BK-34 — Run Execution

## Priority / ROI

- Priority: {color:red|Critical}
- ROI score: ***4.2*** (Frequency x Impact x Stability / Effort x Dependencies)
- Outcome: {color:green|Candidate}

## Prior bugs covered

- (none) — first time scenario

## Test Design

### Preconditions

- An authenticated workspace member with member-or-higher access exists
- An executable Test exists with reachable `atc_steps`
- A configured Project Environment exists for the Test's Project
- A unique `start_token` is generated
- A valid `Idempotency-Key` is provided

### Action

The user starts a manual Run via `POST /api/v1/runs`.

### Expected Results

| # | Assertion |
| --- | --- |
| 1 | The API returns HTTP 201 |
| 2 | Exactly one Run is created with status RUNNING |
| 3 | Executor mode is human |
| 4 | The Run links to the Test and Environment |
| 5 | Ordered pending Run ATCs and Steps are present |
| 6 | No step result values exist |

### Gherkin

```gherkin
@critical @regression @automation-candidate @BK-34
Scenario Outline: should start a human Run with pending checklist from executable Test
  """
  Related Story: BK-34
  ATP: BK-347
  ATR: BK-348
  """

  # === PRECONDITIONS ===
  Given an authenticated workspace member with member-or-higher access
  And an executable Test exists with reachable atc_steps
  And a configured Project Environment exists for the Test's Project
  And a unique start_token is generated
  And a valid Idempotency-Key is provided

  # === ACTION ===
  When the user starts a manual Run via POST /api/v1/runs

  # === VALIDATIONS ===
  Then the API returns HTTP 201
  And exactly one Run is created with status "running"
  And executor mode is "human"
  And the Run links to the Test and Environment
  And ordered pending Run ATCs and Steps are present
  And no step result values exist

  # === EQUIVALENT PARTITIONS ===
  Examples: Happy path
    | executor*mode | auth*method |
    | human         | cookie      |
```

## Variables

| Variable | How to obtain |
| --- | --- |
| `{workspace*member*token}` | Authenticate via PAT or session cookie; member role must be member-or-higher |
| `{executable*test*id}` | `SELECT id FROM tests WHERE project*id = '{project*id}' AND status = 'executable' LIMIT 1` |
| `{project*environment*id}` | `SELECT id FROM project*environments WHERE project*id = '{project_id}' LIMIT 1` |
| `{start_token}` | Generated as unique identifier per run start request |
| `{idempotency_key}` | Client-generated UUID v4, passed as `Idempotency-Key` header |
| `{auth_method}` | Cookie-based session authentication |

## Implementation Code

> ***INFO:*** Filled by test-automation after code lands.

| Layer | File |
| --- | --- |
| API component | (to be filled) |
| Test file | (to be filled) |
| Fixture | (to be filled) |

## Architecture

Integration — API-only test (POST endpoint), follows KATA `ApiBase` → `YourApi` layers. No UI interaction.

## Available Test IDs

> ***INFO:*** To be filled after automation.

## Refinement Notes

- Auth uses PAT token (not JWT session) per project convention
- Valid project UUID: `d75e73ac-b42a-487e-99e8-ac55859fc392`
- Valid module ID for Run Execution: `c9e05a37-9b4f-4194-a633-9d6f942288a1`
- Endpoint: `POST /api/v1/runs` — body must include `executor*mode`, `test*id`, `environment*id`, `start*token`

---

## Metadata

- **Created:** 11/8/2026
- **Updated:** 12/8/2026
- **Reporter:** jesusgpythondev
- **Assignee:** jesusgpythondev

---

_Synced from Jira by sync-jira-issues_

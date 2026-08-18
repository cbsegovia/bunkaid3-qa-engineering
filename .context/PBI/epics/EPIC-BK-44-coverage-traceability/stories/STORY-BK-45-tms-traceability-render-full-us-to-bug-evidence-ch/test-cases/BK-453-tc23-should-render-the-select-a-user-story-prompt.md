# TEST: BK-45: TC23: should render the "select a user story" prompt when no ?story= param is present

**Jira Key:** [BK-453](https://upexgalaxy71.atlassian.net/browse/BK-453)
**Status:** Candidate
**Components:** Coverage & Traceability

---

## Test Description

## Why this is regression-worthy

When the route is hit with no `?story=` query param, the view must render a "select a user story" prompt state and must NOT attempt a chain fetch at all. This is the entry-state guard for the whole page — a regression that removes the presence check (e.g. treating an absent param as an empty string and passing it straight to the chain-fetch RPC) would either throw an unhandled error, fire a wasted/malformed network request, or worse, fall through to some default story ID. Unit tests on the route/param resolver assert the guard exists in isolation; only a live network-trace proves no chain-fetch request is actually attempted when the param is absent.

## ROI

| Factor | Score | Reasoning |
| --- | --- | --- |
| Frequency | 4 | The landing state of the route — touched whenever the page shell or routing changes |
| Impact | 2 | A broken prompt state is a UX papercut, not a data or security issue |
| Stability | 5 | Trivially atomic boolean presence/absence check, extremely unlikely to regress silently |
| Effort | 1 | One navigation with no param, one prompt assertion, one network-log assertion |
| Dependencies | 1 | No fixture needed — just the bare route |

**ROI = (4 x 2 x 5) / (1 x 1) = 40.0** -> Candidate

## Test design

```gherkin
@medium @regression @e2e @automation-candidate @BK-45
Scenario: should render the "select a user story" prompt when no ?story= param is present
  """
  Related Story: BK-45
  Test outline: TC-BK45-23 (ATP Stage 1)
  """

  # === PRECONDITIONS ===
  Given an authenticated workspace member with at least viewer role

  # === ACTION ===
  When the member opens "/projects/{project_slug}/traceability" with no `story` query param

  # === VALIDATIONS ===
  Then the "select a user story" prompt state renders
  And no chain-fetch network request is attempted
```

## Variables

| Variable | How to obtain |
| --- | --- |
| `{project_slug}` | Project settings, or the `/projects` list |

## Preconditions

None beyond an authenticated session — the route is hit with the `story` param omitted entirely.

## Expected results

The prompt state renders and no chain-fetch call is observed in the network log.

---

**Related Story**: BK-45 — TMS-Traceability | Render full US to bug evidence chain in one read
**Regression epic**: BK-70 (QA Test Repository)
**Source**: BK-45 ATP Stage 1 (2026-08-05), executed and recorded in the BK-45 ATR (2026-08-08)

---

## Related Issues

- tests: [BK-45](https://jira.upexgalaxy.com/browse/BK-45) - TMS-Traceability | Render full US to bug evidence chain in one read

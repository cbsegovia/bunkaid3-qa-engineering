# TEST: BK-45: TC14: should redirect an unauthenticated user to login with no chain data rendered first

**Jira Key:** [BK-447](https://upexgalaxy71.atlassian.net/browse/BK-447)
**Status:** Candidate
**Components:** Coverage & Traceability

---

## Test Description

## Why this is regression-worthy

BK-45 is triaged HIGH-risk specifically because it hits the auth/authorization veto category. This case is the first line of defense: an unauthenticated request must be redirected to login before any chain data — acceptance criteria, ATCs, test results, or defect entries — ever paints on screen. A regression that reorders the auth check after the initial data fetch (a common SSR pitfall — fetch-then-guard instead of guard-then-fetch) would leak sensitive coverage/defect data to an anonymous caller for the duration of a single frame, which is enough for a scripted scraper. Unit tests on the auth middleware assert the redirect happens; they do not prove the browser never receives or paints the chain payload first, which is a client/network-level race only an E2E check can catch.

## ROI

| Factor | Score | Reasoning |
| --- | --- | --- |
| Frequency | 4 | Any PR touching the route guard, SSR data-fetch order, or auth middleware |
| Impact | 5 | Data-leak-before-redirect on a HIGH-risk security surface (auth veto category) |
| Stability | 4 | Route guard is settled, no open ratification questions |
| Effort | 2 | Standard Playwright unauthenticated-context navigation + network assertion |
| Dependencies | 1 | No seeded fixture needed — any story id or none at all |

**ROI = (4 x 5 x 4) / (2 x 1) = 40.0** -> Candidate

## Test design

```gherkin
@medium @regression @e2e @automation-candidate @BK-45
Scenario: should redirect an unauthenticated user to login with no chain data rendered first
  """
  Related Story: BK-45
  Test outline: TC-BK45-14 (ATP Stage 1)
  """

  # === PRECONDITIONS ===
  Given no active session (unauthenticated browser context)
  And a user story "{story_id}" that exists and has a populated chain

  # === ACTION ===
  When the browser opens "/projects/{project_slug}/traceability?story={story_id}"

  # === VALIDATIONS ===
  Then the browser is redirected to the login route before the response paints
  And no acceptance criterion, ATC, Test, Run, or Defect data appears in the DOM at any point
  And no chain-fetch network request for "{story_id}" is observed before the redirect
```

## Variables

| Variable | How to obtain |
| --- | --- |
| `{project_slug}` | Project settings, or the `/projects` list |
| `{story_id}` | `data-testid="story-row-<uuid>"` in the traceability sidebar |

## Preconditions

An unauthenticated browser context (no auth cookie/session) and any existing story with a populated chain.

## Expected results

Redirect to login fires before any chain data paints; no network evidence of chain data reaching the client first.

---

**Related Story**: BK-45 — TMS-Traceability | Render full US to bug evidence chain in one read
**Regression epic**: BK-70 (QA Test Repository)
**Source**: BK-45 ATP Stage 1 (2026-08-05), executed and recorded in the BK-45 ATR (2026-08-08)

---

## Related Issues

- tests: [BK-45](https://jira.upexgalaxy.com/browse/BK-45) - TMS-Traceability | Render full US to bug evidence chain in one read

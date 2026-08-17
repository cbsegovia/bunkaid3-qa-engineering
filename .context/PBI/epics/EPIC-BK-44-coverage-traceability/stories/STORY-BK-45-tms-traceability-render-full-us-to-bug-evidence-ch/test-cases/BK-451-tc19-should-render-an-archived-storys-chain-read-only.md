# TEST: BK-45: TC19: should render an archived Story's chain read-only with an archived banner, not a 404

**Jira Key:** [BK-451](https://upexgalaxy71.atlassian.net/browse/BK-451)
**Status:** Candidate
**Components:** Coverage & Traceability

---

## Test Description

## Why this is regression-worthy

This case verifies a lifecycle distinction that the ATP explicitly flags as "previously conflated": an archived Story is NOT the same failure mode as an inaccessible one. Archived Story lifecycle must render the chain read-only with an "archived" banner — it must NOT fall through to the uniform-404 access-denial path used for foreign-workspace/nonexistent stories (TC-BK45-16). A regression that routes archived stories through the same error-mapping code as access-denial would incorrectly deny legitimate, still-visible historical content to any workspace member who should be able to read it. Unit tests on the lifecycle-status branch can assert the resolver's output in isolation; only a live render proves the banner appears and the chain still paints, rather than the page falling back to a 404 shell.

## ROI

| Factor | Score | Reasoning |
| --- | --- | --- |
| Frequency | 3 | Touched whenever Story-lifecycle handling or the archived-banner component changes |
| Impact | 4 | Incorrectly denying access to legitimately-archived, still-visible content |
| Stability | 4 | Archived-story-renders-read-only ruling is finalized in this ATP |
| Effort | 2 | One archived-story fixture, one page load, one banner + chain assertion |
| Dependencies | 2 | Needs a dedicated archived-story fixture (already seeded on staging) |

**ROI = (3 x 4 x 4) / (2 x 2) = 12.0** -> Candidate

## Test design

```gherkin
@medium @regression @e2e @automation-candidate @BK-45
Scenario: should render an archived Story's chain read-only with an archived banner, not a 404
  """
  Related Story: BK-45
  Test outline: TC-BK45-19 (ATP Stage 1) — State-Transition (Story lifecycle)
  Distinct from TC-BK45-16's uniform-404 access-denial case
  """

  # === PRECONDITIONS ===
  Given an authenticated workspace member with at least viewer role
  And a user story "{story_id}" whose `archived_at` is set

  # === ACTION ===
  When the member opens "/projects/{project_slug}/traceability?story={story_id}"

  # === VALIDATIONS ===
  Then the response is 200, not a 404
  And an "archived" banner is visible on the page
  And the chain still renders in a read-only state (no edit/create affordances)
```

## Variables

| Variable | How to obtain |
| --- | --- |
| `{project_slug}` | Project settings, or the `/projects` list |
| `{story_id}` | `data-testid="story-row-<uuid>"` in the traceability sidebar |

## Preconditions

An archived Story fixture. Story `b57d3e7c-e896-4616-be62-088a9f7f95c2` (archived story chain fixture) is seeded on staging.

## Expected results

The page renders normally (200) with a visible "archived" banner and a read-only chain — not a 404 shell.

---

**Related Story**: BK-45 — TMS-Traceability | Render full US to bug evidence chain in one read
**Regression epic**: BK-70 (QA Test Repository)
**Source**: BK-45 ATP Stage 1 (2026-08-05), executed and recorded in the BK-45 ATR (2026-08-08)

---

## Related Issues

- tests: [BK-45](https://jira.upexgalaxy.com/browse/BK-45) - TMS-Traceability | Render full US to bug evidence chain in one read

# TEST: BK-50: TC01: should download a self-contained document carrying the full chain, the workspace/project/story identity and the export timestamp given a story with an assembled chain

**Jira Key:** [BK-331](https://jira.upexgalaxy.com/browse/BK-331)
**Status:** Candidate
**Components:** Coverage & Traceability

---

## Test Description

## Why this is regression-worthy

This is the story's happy path and the only case that proves the ***download actually happens***. The 13 unit tests in `lib/traceability/export-snapshot.test.ts` assert the rendered HTML string; none of them clicks a button, and none of them proves the browser receives a file. A regression that broke the download wiring while leaving the renderer intact would pass the entire unit suite.

Merges three ATP outlines that share one precondition and one action — TC-BK50-01 (chain fidelity), TC-BK50-02 (header identity) and TC-BK50-12 (timestamp). Per the TC-identity rule these are assertions of a single case, not three cases.

## ROI

| Factor | Score | Reasoning |
| --- | --- | --- |
| Frequency | 5 | Every PR touching the traceability surface |
| Impact | 4 | Export is the feature; a broken download blocks it entirely |
| Stability | 4 | Route and renderer are settled; D26/D27 already ratified |
| Effort | 2 | Download interception is a standard Playwright affordance |
| Dependencies | 2 | Needs a seeded story with a populated chain |

***ROI = (5 x 4 x 4) / (2 x 2) = 20.0*** -> Candidate

## Test design

```gherkin
@high @regression @e2e @automation-candidate @BK-50
Scenario: should download a self-contained document carrying the full chain and its provenance
  """
  Related Story: BK-50
  Merges ATP outlines TC-BK50-01, TC-BK50-02, TC-BK50-12
  """

  # === PRECONDITIONS ===
  Given an authenticated workspace member with at least viewer role
  And a user story "{story*id}" in project "{project*slug}" whose chain has at least one acceptance criterion with a bound ATC, a Test and a completed Run

  # === ACTION ===
  When the member opens "/projects/{project*slug}/traceability?story={story*id}"
  And the member triggers the Export snapshot action

  # === VALIDATIONS ===
  Then a file download is offered
  And the suggested filename matches "trace-<slug>-YYYYMMDD-HHMM.html"
  And the downloaded document contains every acceptance criterion shown on screen
  And the downloaded document contains every ATC, Test, latest-run label and defect entry shown on screen
  And the document header carries the workspace name, the project name and the story title
  And the document header carries an export timestamp matching the moment of export
```

## Variables

| Variable | How to obtain |
| --- | --- |
| `{project_slug}` | Project settings, or the `/projects` list |
| `{story_id}` | `data-testid="story-row-<uuid>"` in the traceability sidebar |

## Preconditions

A seeded story with a populated chain. The BK-45 fixture set on staging provides one (`bk-45-fixtures` module, "full 5-layer evidence chain" story).

## Expected results

A file is delivered, its name follows the ratified D26 pattern, and its contents match the live screen field for field.

---

***Related Story***: BK-50 — TMS-Traceability | Export the assembled chain as a read-only snapshot
***Regression epic***: BK-70 (QA Test Repository)
***Source***: BK-50 ATP in-sprint section (2026-08-09), executed and recorded in the BK-50 ATR
***Prior bugs in this area***: BK-329 (Defect, Menor — route ignores its `{projectId}` segment) · BK-317 (Defect, closed — run-state vocabulary)

---

## Related Issues

- tests: [BK-50](https://jira.upexgalaxy.com/browse/BK-50) - TMS-Traceability | Export the assembled chain as a read-only snapshot

---

## Metadata

- **Created:** 8/9/2026
- **Updated:** 8/9/2026
- **Reporter:** Benjamin Segovia
- **Assignee:** Benjamin Segovia
- **Labels:** automation-candidate, e2e, high, regression, traceability

---

_Synced from Jira by sync-jira-issues_

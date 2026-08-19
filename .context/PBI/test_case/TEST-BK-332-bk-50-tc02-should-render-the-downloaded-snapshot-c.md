# TEST: BK-50: TC02: should render the downloaded snapshot completely with zero external requests when the file is opened with the network unavailable

**Jira Key:** [BK-332](https://jira.upexgalaxy.com/browse/BK-332)
**Status:** Candidate
**Components:** Coverage & Traceability

---

## Test Description

## Why this is regression-worthy

Self-containment is what makes the artifact useful to an external auditor who has no Bunkai session — and what stops the document from phoning home from an auditor's machine. The unit suite checks the rendered **string** for external references; it cannot prove that a real browser rendering the real file issues no requests. Those are different claims, and only the second one is the promise made to the user.

A future change that inlines a font via a CDN, adds an analytics beacon, or references an icon sprite would slip past a string-level assertion written against today's markup while breaking the guarantee outright.

## ROI

| Factor | Score | Reasoning |
| --- | --- | --- |
| Frequency | 4 | Every release; any change to the snapshot renderer |
| Impact | 5 | A snapshot that needs the network is not a snapshot — and it leaks the reader's activity |
| Stability | 4 | Renderer is settled |
| Effort | 2 | Route-abort plus a `file://` navigation |
| Dependencies | 2 | Needs a downloaded artifact from TC01 |

***ROI = (4 x 5 x 4) / (2 x 2) = 20.0*** -> Candidate

## Test design

```gherkin
@critical @regression @e2e @automation-candidate @BK-50
Scenario: should render offline with zero external requests
  """
  Related Story: BK-50
  ATP outline: TC-BK50-08
  """

  # === PRECONDITIONS ===
  Given a snapshot previously downloaded from a story with a populated chain

  # === ACTION ===
  When every request whose scheme is not "file:" is aborted at the browser context
  And the downloaded file is opened from disk

  # === VALIDATIONS ===
  Then the document renders its full chain, including every ATC row
  And the document title, story heading and footer stamp are present
  And the number of non-"file:" requests issued is exactly zero
```

## Variables

| Variable | How to obtain |
| --- | --- |
| `{snapshot_path}` | The path the TC01 download was saved to |

## Preconditions

A downloaded snapshot on disk. Chain this case after TC01 rather than re-exporting.

## Expected results

Full render, zero external requests. Any non-zero count is a failure regardless of whether the page still looks correct.

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

- **Created:** 9/8/2026
- **Updated:** 9/8/2026
- **Reporter:** Benjamin Segovia
- **Assignee:** Benjamin Segovia
- **Labels:** automation-candidate, critical, e2e, regression, traceability

---

_Synced from Jira by sync-jira-issues_

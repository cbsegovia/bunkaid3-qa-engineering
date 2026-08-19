# TEST: BK-264: TC15: should exclude Viewer-role members from the assignee picker

**Jira Key:** [BK-490](https://jira.upexgalaxy.com/browse/BK-490)
**Status:** MANUAL
**Components:** Bugs & Defect Heatmap

---

## Test Description

## Related Story

BK-264 — TMS-Defect Triage | Assign a defect to a workspace member and update its status

## Priority / ROI

- Priority: Medium
- ROI score: 2.0 (Frequency 2 x Impact 3 x Stability 4 / Effort 4 x Dependencies 3)
- Outcome: Manual

## Prior bugs covered

None — zero bugs found during BK-264's sprint-testing execution pass.

## Test Design

### Preconditions

- Actor is authenticated with at least Member-level (write-role) access to the workspace — `BugAssignControl` is write-role only
- Target bug exists with status "open"
- Workspace has at least one active Owner, one active Member, and one active Viewer-role member

### Steps

1. As a Member+ actor, open the bugs list (`BugsListView.tsx`) for a workspace containing an active Owner, an active Member, and an active Viewer.
2. Locate an "open" bug's assignee cell and click to open the `BugAssignControl` picker.
3. Read every option rendered in the picker's dropdown.
4. Confirm the Viewer identity is absent from the option list, while the owner and member identities are present.

### Expected Results

- The picker's option list includes "Unassigned", the workspace owner (rendered as full email), and the Member-role identity (rendered as a truncated user id, not an email)
- The picker does NOT include the Viewer-role identity as a selectable option under any circumstance
- This complements the server-side `422 assignee*view*only` rejection tested at the API layer — this TC verifies the UI proactively prevents the illegal selection rather than relying solely on the backend guardrail

## Variables

| Variable | How to obtain |
| --- | --- |
| `{workspace_id}` | Workspace seeded with 3 roles (owner/member/viewer) |
| `{bug*id}` | An "open" bug in `{workspace*id}` |

## Implementation Code

| Layer | File |
| --- | --- |
| API component | N/A — UI-only TC |
| UI component | components/bugs/BugAssignControl.tsx (pending — filled by test-automation) |
| Test file | (pending) |
| Fixture | (pending) |

## Architecture

UI-only — `BugAssignControl` component (`components/bugs/BugAssignControl.tsx`).

## Available Test IDs (UI)

None found — `BugAssignControl.tsx` has zero `data-testid` attributes as of 2026-08-14 (verified during BK-264 execution); flag this as a blocker note for whoever picks up automation, similar to BK-253's known `WorkspaceSwitcher.tsx` gap.

## Refinement Notes

Empirically validated against staging on 2026-08-14 (/sprint-testing Stage 2 UI Exploration, outline #1) — the picker correctly excluded the Viewer identity; only "Unassigned", the owner (full email), and the member (shown as a truncated id, not email) were selectable options. Note the cosmetic labeling inconsistency (member rendered as truncated id instead of email) flagged separately in test-session-memory.md Observations — non-blocking for this TC's pass/fail but worth a UI-polish ticket. Verdict is Manual (not Candidate) because `BugAssignControl.tsx` has zero `data-testid` attributes, making reliable automation infeasible without first adding stable selectors — flagged as a blocker for whoever picks this up next.

---

## Related Issues

- is tested by: [BK-264](https://jira.upexgalaxy.com/browse/BK-264) - TMS-Defect Triage | Assign a defect to a workspace member and update its status

---

## Metadata

- **Created:** 15/8/2026
- **Updated:** 15/8/2026
- **Reporter:** Luis Eduardo Flores Villarroel
- **Assignee:** Luis Eduardo Flores Villarroel
- **Labels:** e2e, epic-BK-31, manual-only, medium, regression

---

_Synced from Jira by sync-jira-issues_

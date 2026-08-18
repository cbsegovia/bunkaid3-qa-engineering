# BK-50 — Test Session Memory

> Shared state across the sprint-testing stages. Hand-authored, NOT a Jira mirror.

## Ticket

| | |
|---|---|
| Key | BK-50 |
| Type | Historia |
| Status at session start | Ready For QA |
| Assignee | Benjamin Segovia |
| Module (= Epic) | BK-44 Coverage & Traceability |
| Predecessor | BK-45 (QA Approved) · BK-317 (Cerrada 2026-08-09) |

## TMS modality

**jira-native.** ATP = `customfield_10067`, ATR = `customfield_10124`, both on the Story. No Xray `Test` / `Test Execution` entities. TC outlines stay in the ATP this sprint; regression-worthy TCs get created in Stage 4 by `/test-documentation`.

## Environment

| | |
|---|---|
| Active env | staging |
| Web URL | `https://staging-upexbunkai.vercel.app` (probe 307 -> login redirect, reachable) |
| API base | `https://staging-upexbunkai.vercel.app/api` — collection root returns 404; only scoped routes exist (`/api/v1/projects/{id}/traceability`) |
| Credentials | `STAGING_USER_EMAIL` / `STAGING_USER_PASSWORD` from `.env` |
| DB | DBHub configured (`DBHUB_*` present in `.env`) |
| Overrides | none |

## What shipped

PR #145 -> `staging`, merge `7b16c0cc4d744966e6a1fdff34bdcf2bf426f213` (verified ancestor of `origin/staging`).

Export snapshot button on `/projects/{slug}/traceability?story={id}`. Click downloads a self-contained HTML document `trace-<story>-YYYYMMDD-HHMM.html` carrying the full evidence chain as of that moment, plus a confirmation toast. Option E per ratification comments 12238/12239: no migration, no new route, no storage, no anonymous access. Reuses BK-45's authenticated `GET /api/v1/projects/{id}/traceability`.

Automated coverage already in place: `lib/traceability/export-snapshot.test.ts` (13 tests).

## Pre-planning code reading

- `lib/traceability/export-snapshot.ts:198` — run cell renders via `runChipLabel()` imported from the shared chain-view mapper, emitted as plain escaped text with no per-state CSS variant.
  **Consequence**: the D27 five-vs-six chip divergence cannot reach the export. The risk raised before planning is refuted; do NOT carry it into the ATP as an open item.
- `buildSnapshotFilename` in the same module owns the `.html` extension (divergence D26, already ratified 2026-08-08).

## Ely's suggested manual checks (BK-50 comment, 2026-08-08)

1. Export a populated story (mixed pass/fail ATCs) -> open the file offline, confirm every on-screen entity is present.
2. Export a zero-AC story -> confirm prose stating no coverage as of the export timestamp (AC3.1), not an empty table.
3. Export twice in a row -> two independent files, different timestamps in the name.
4. Reach the export path signed out -> login redirect (browser) / 401 (API).

These are a floor, not the plan. The ATP explodes each AC 1:N per test-design doctrine.

## Stage state

| Stage | Status |
|---|---|
| Session Start | completed — story explained, user confirmed |
| Stage 1 — Planning | completed — 23 TC outlines in ATP; BK-50 now `In Test` |
| Stage 2 — Execution | not started |
| Stage 3 — Reporting | not started |

## TC-22 standing decision

TC-BK50-22 (E3) is BLOCKED **by decision at planning time**, not by discovery mid-pass. Do not spend Stage 2 budget attempting it. Record it as BLOCKED with the stated tooling reason and carry it to Stage 4.

## Open questions

None blocking. Two constraints to confirm during Stage 2 rather than ask up front:
- Whether staging seed data still holds BK-45's zero-coverage and mixed-coverage stories (needed for AC3.1 and AC1.1).
- Whether the live chain can be mutated between two exports to satisfy AC2.1 (Critical).

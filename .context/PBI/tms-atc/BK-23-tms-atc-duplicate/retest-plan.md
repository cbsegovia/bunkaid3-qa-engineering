# BK-23 — Retest Plan (delta)

**Ticket:** BK-23 | **Module:** tms-atc | **Status:** BLOCKED | **Sprint:** Bunkai (70) Sprint 3
**Prepared:** 2026-07-28 | **Tester:** Benjamin Segovia
**Prior execution:** 2026-06-28 — FAILED (14 PASSED / 1 FAILED / 2 BLOCKED of 18 TCs)

This is a **delta plan**, not a new ATP. The full ATP lives on the Story
(`customfield_10067`) and the prior results on `customfield_10147`. Only the
scope below needs re-running once the blockers clear — the 14 PASSED TCs are
regression-only unless the fix touches shared code.

---

## 1. Why BK-23 is still BLOCKED

| Blocker | Type | Status | Effect on BK-23 |
| ------- | ---- | ------ | --------------- |
| BK-175 | Error (Highest) | En revisión — PR #61 open, awaiting merge + deploy | No staging login → no UI leg can run at all |
| BK-185 | Defect (High) | Abierta, untouched since 2026-07-13 | BUG-2: no UI Duplicate action exists → entire UI leg unexecutable |
| BK-184 | Defect (Medium) | Abierta, untouched since 2026-07-13 | BUG-1: API reads `title`, spec says `new_title` → TC11 fails |
| TC02/TC03 test data | QA-side | Not prepared | UI enforces min 1 step; 0-step / 0-assertion ATCs cannot be created through the UI |
| DBHub MCP | QA-side config | Not configured | DB leg was verified only indirectly via API payloads |

Rows 4 and 5 are **ours** — they do not depend on Dev and can be cleared now.

---

## 2. Retest scope when the fixes land

### 2.1 Gated on BK-184 (API field name)

| TC | Title | Prior | Retest expectation |
| -- | ----- | ----- | ------------------ |
| TC11 | Custom title via `new_title` field (per spec FR-014) | **FAILED** | 201 + new ATC titled from `new_title` |
| TC10 | Custom title via `title` field | PASSED | Re-run — confirm the fix did not simply swap the bug. Decide with Dev whether `title` stays accepted as an alias or becomes 422. |
| TC07 | No body → default title | PASSED | Re-run — body parsing changed |
| TC08 | Empty body → default title applied | PASSED | Re-run — body parsing changed |

**Open question for Dev on BK-184:** once `new_title` is honoured, is `title`
(a) still accepted as a backward-compatible alias, (b) ignored, or (c) rejected
with 422? TC10's expected result depends on the answer — do not execute TC10
until this is confirmed.

### 2.2 Gated on BK-185 (no UI Duplicate action)

The entire UI leg was never executed. Once the action ships, run:

| Check | Expected |
| ----- | -------- |
| Duplicate affordance is present and reachable | Action visible on ATC detail **and** on the ATC explorer/list row |
| Custom-title affordance | Confirm the resolved shape (modal vs inline) — AMB-1 in the shift-left doc was never answered |
| Success redirect | Lands on `/atcs/{new_id}` detail page showing the copy's title, steps and assertions |
| Copy renders correctly | 3 steps + 2 assertions in original order |
| Independence via UI (TC18 UI leg) | Edit step 1 of the copy → reopen source → source step 1 unchanged |
| Error surfacing | 422 title violations render an inline message, not a raw error blob |
| Double-click guard | Triggering Duplicate twice quickly → confirm whether 1 or 2 copies result (EC-3 / G6, never answered) |

### 2.3 Gated on QA-side test data

| TC | Title | Prior | Unblock condition |
| -- | ----- | ----- | ----------------- |
| TC02 | 0-step ATC duplicate | **BLOCKED** | Seed a 0-step ATC via API |
| TC03 | 0-assertion ATC duplicate | **BLOCKED** | Seed a 0-assertion ATC via API |

### 2.4 Gated on BK-175 only

Nothing unique — but BK-175 is a hard precondition for **every UI row in 2.2**,
because without login there is no session to reach the ATC library.

### 2.5 Regression (re-run only if the fix touches shared code)

TC01, TC04, TC05, TC06, TC09, TC12–TC17. All PASSED on 2026-06-28. Re-run the
full set if the BK-184 fix lands inside `duplicateAtc()` or the shared insert
path from BK-18, since that is the same code the happy path exercises.

---

## 3. Prep work that does NOT wait for Dev

### 3.1 Staging password violates the backend policy — fix before anything else

The staging credentials **are** present in `.env`, but the password is too short:

```
STAGING_USER_EMAIL    = bunkai-staging-userbunk@olkacoraug.resend.app
STAGING_USER_PASSWORD = 6 characters   <-- backend requires >= 8
```

This is the exact failure recorded on 2026-06-25: the login form works, but the
backend rejects the 6-character password with 401 and the session never reaches
the ATC library. `LOCAL_USER_PASSWORD` is 6 characters as well, so the local
environment has the same problem.

Fixing this requires changing the password on the staging account itself (the
value in `.env` only mirrors it) and then updating both entries.

**Two further `.env` issues found while checking this:**

1. **Duplicate keys.** Eight keys are declared twice — `STAGING_USER_EMAIL`,
   `STAGING_USER_PASSWORD`, `LOCAL_USER_EMAIL`, `LOCAL_USER_PASSWORD`,
   `ATLASSIAN_URL`, `ATLASSIAN_API_TOKEN`, `TAVILY_API_KEY`, `RESEND_API_KEY`.
   Each appears first as an empty declaration in the template block and again
   further down with the real value. The loader's last-wins behaviour makes this
   work today, but anyone reading the top of the file sees blanks and concludes
   the credentials are missing. Consolidate to one declaration per key.

2. **`TEST_ENV=local`.** Staging runs need `TEST_ENV=staging`, otherwise
   `validateEnv.ts` validates the local credentials and the suite targets the
   wrong environment.

### 3.2 DBHub MCP is not configured — the DB leg stays blind without it

All six DBHub keys are unset — the block is still the untouched template:

```
DBHUB_TYPE      = (empty)   # sqlserver | postgres | mysql | sqlite | mariadb
DBHUB_HOST      = (empty)
DBHUB_PORT      = (empty)   # 5432 for postgres
DBHUB_DATABASE  = (empty)
DBHUB_USER      = (empty)
DBHUB_PASSWORD  = (empty)
```

Target is Supabase Postgres (per `.agents/project.yaml: database.db_type`), so
`DBHUB_TYPE=postgres` and `DBHUB_PORT=5432`; host, database, user and password
come from the Supabase project's connection settings.

Without this, the copy-independence invariant (AC4 / TC18) is only ever verified
*indirectly* through API responses. That is the single highest-risk assertion in
this story — `atc_steps` and `atc_assertions` row isolation should be asserted
against the database directly, not inferred.

**Env vars are cached when the MCP process spawns — restart the agent session
after editing `.env`.**

### 3.3 Seed the blocked test data (unblocks TC02 / TC03)

The UI enforces a 1-step minimum, so both fixtures must be built through the API:

1. Authenticate against staging and obtain a token.
2. `POST /atcs` with a valid module/user-story/AC anchor and **zero** steps → keep `atc_id` as the TC02 source.
3. `POST /atcs` with >= 1 step and **zero** assertions → keep `atc_id` as the TC03 source.
4. Record both IDs in `context.md` under Test Data so the retest does not re-derive them.

Blocked by 3.1 — the API seed needs working staging credentials too.

### 3.4 Get the open questions answered while waiting

These were raised in the 2026-06-02 shift-left refinement and are **still
unanswered**. Each one leaves a TC with an undefined expected result:

| Ref | Question | Blocks |
| --- | -------- | ------ |
| Q1 | Which workspace roles may duplicate? "Any member" vs "403 on insufficient role" | The 403 negative case was never written into a TC |
| Q2 | Default title overflow past 200 chars — truncate or 422? | TC06 passed asserting 422; confirm that is the *intended* rule, not incidental behaviour |
| TQ2 | Is `{"new_title": ""}` "absent" or "too short"? | TC08's expected result |
| TQ3 | Soft-deleted / archived source ATC → 404? | No TC exists for this at all |
| TQ5 | Is transaction rollback enforced at DB or service layer? | The rollback integration outline was never executed |

Answering these costs one comment thread and removes the ambiguity from the
retest before it starts.

---

## 4. Execution order once unblocked

```
  BK-175 merged + deployed
        |
        v
  [3.1] staging credentials fixed  ----+
        |                              |
        v                              v
  [3.3] seed TC02/TC03 data      [3.2] DBHub configured
        |                              |
        +--------------+---------------+
                       v
        BK-184 fixed --> run 2.1 (TC11, TC10, TC07, TC08)
        BK-185 fixed --> run 2.2 (full UI leg)
                       |
                       v
        run 2.3 (TC02, TC03) + 2.5 regression if shared code changed
                       |
                       v
        Update ATR (customfield_10147) --> BK-23 QA verdict
```

BK-184 and BK-185 are independent of each other — whichever lands first can be
retested without waiting for the other. Only the **verdict** needs both.

---

## 5. Definition of Done for the retest

- [ ] TC11 passes with `new_title` honoured per FR-014
- [ ] TC10 result matches the confirmed answer on the `title` alias question
- [ ] UI Duplicate action exercised end-to-end, including the independence check
- [ ] TC02 and TC03 executed (no longer BLOCKED)
- [ ] Copy independence asserted **against the database**, not only via API payloads
- [ ] ATR field updated with the new run; prior 2026-06-28 result preserved as history
- [ ] BK-184 and BK-185 closed, or explicitly deferred with PO sign-off

---

## 6. Housekeeping

Two PBI folders exist for this ticket and the context is split across both:

- `.context/PBI/tms-atc/BK-23-atc-duplicate/` — `context.md`, `shift-left-refinement.md`
- `.context/PBI/tms-atc/BK-23-tms-atc-duplicate/` — `context.md`, `evidence/`, this file

They should be consolidated into one folder so the next session does not read
half the context. Not done here — merging them changes paths other artifacts may
reference, so it needs a deliberate call.

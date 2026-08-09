# BK-50 — Automation Spec

**Scope**: ticket-driven · **Candidates**: BK-331, BK-332, BK-333, BK-334, BK-335, BK-336 · **Authored**: 2026-08-09

> **STATUS: PLAN COMPLETE, CODE BLOCKED.** The KATA framework in this repo has not been adapted to Bunkai — see §0. Phase 2 cannot start until `/adapt-framework` runs. Everything below is written so that it can start the moment it does.

---

## 0. Blocker — the framework still points at a different product

The Phase-0 preflight gate for `/test-automation` requires an **adapted** framework. This repo is still carrying the boilerplate's scaffolds, pointed at UPEX Dojo:

| Signal | Current state | Evidence |
|---|---|---|
| Base URLs | `https://dojo.upexgalaxy.com` / `http://localhost:3000` | `config/variables.ts` `envDataMap` |
| Any Bunkai reference in the framework | **none** | `grep -rn "bunkai" config/ tests/ playwright.config.ts` returns nothing |
| Components | `ExampleApi`, `ExamplePage`, `ExampleSteps`, plus `AuthApi` / `LoginPage` scaffolds | `kata-manifest.json` (4 components) |
| ATC IDs | `PROJ-101`, `PROJ-102`, `PROJ-103` placeholders with a literal `TODO: Replace 'PROJ'` comment | `tests/components/ui/LoginPage.ts:7` |
| Auth bootstrap | email + password form POSTing to `/auth/login`, JWT read from the response | `tests/setup/ui-auth.setup.ts`, `config.auth` |

The gate's instruction is explicit: probe the ADAPTED signals, and when the framework is still generic, **stop and hand the adaptation back to the user** — never auto-run `/project-discovery` or `/adapt-framework`. `/project-discovery` has already run for Bunkai (`.context/business/*` is populated); `/adapt-framework` has not.

### The adaptation is not cosmetic — auth is the hard part

Swapping the base URL is trivial. The auth bootstrap is not. `tests/setup/ui-auth.setup.ts` assumes a password form that returns a JWT. Bunkai staging does not have one:

- **BK-175** ("Magic-link OTP email has no code-entry field") establishes that sign-in is an emailed one-time code.
- **BK-177** ("Staging deployment missing email-first password sign-in UI") was **Rechazado** — the password path is not coming.

So `storageState` cannot be seeded by filling a password form. The adaptation has to drive the OTP flow, which means the `resend` inbox must be readable from the setup project. This is a genuine design decision for `/adapt-framework`, not a find-and-replace, and it is the single largest item standing between this plan and green tests.

The exploratory session that produced these TCs sidestepped the problem entirely by reusing an already-authenticated persistent browser profile. That is fine for a human-driven session and unacceptable for CI.

---

## 1. What is being automated

Six `Candidate` TCs from BK-50 Stage 4, covering the traceability export snapshot on `/projects/{slug}/traceability?story={id}`.

The regression set was deliberately scoped in Stage 4 to what the 32 existing unit tests cannot prove. That scoping decision carries directly into this plan: **no ATC here re-asserts rendered markup**. Every one of them exercises something only a real browser or a real HTTP call can reach.

| TC | Behaviour | Surface | Fixture |
|---|---|---|---|
| BK-331 | Export delivers a file carrying the chain, identity and timestamp | UI | `{ ui }` |
| BK-332 | The downloaded file renders offline with zero external requests | UI (local file) | `{ ui }` |
| BK-333 | A T0 snapshot survives a later change to the live chain | UI + API | `{ test }` |
| BK-334 | Anonymous browser is redirected to login, no data rendered | UI (anonymous context) | `{ ui }` |
| BK-335 | Anonymous API caller receives 401 | API | `{ api }` |
| BK-336 | No share / publish / public-link affordance exists | UI | `{ ui }` |

---

## 2. Anti-duplication check against `kata-manifest.json`

Manifest loaded (generated 2026-07-15, 2 api + 2 ui components).

- **No component collision.** `TraceabilityPage`, `SnapshotDocumentPage`, `TraceabilityApi`, `UserStoriesApi` and `TraceabilitySteps` do not exist. Nothing to extend; all are new.
- **No ATC-ID collision.** The manifest holds only `PROJ-101` / `PROJ-102` / `PROJ-103`. `BK-331`..`BK-336` are unused.
- **No reuse opportunity.** `AuthApi` and `LoginPage` are the closest existing components and both are Dojo scaffolds — they will be rewritten by `/adapt-framework`, not extended here.

---

## 3. Components to create

### `tests/components/ui/TraceabilityPage.ts` (L3, UI)

The traceability screen itself.

| Member | Kind | Notes |
|---|---|---|
| `goto(args: { projectSlug, storyId })` | helper (`@step`) | Navigation only — not an ATC |
| `exportSnapshot(saveTo: string)` | ATC `@atc('BK-331')` | Clicks Export, awaits the `download` event, saves to `saveTo`, asserts the suggested filename matches `trace-<slug>-YYYYMMDD-HHMM.html`, returns the saved path |
| `expectAnonymousRedirectToLogin(path: string)` | ATC `@atc('BK-334')` | Opens a **fresh context with no `storageState`**, navigates, asserts the `/login` redirect carries `next=<path>` and that no chain markup was rendered |
| `expectNoShareAffordance()` | ATC `@atc('BK-336')` | Asserts "Export snapshot" is the only mutating control and that no share / publish / copy-link control exists |

### `tests/components/ui/SnapshotDocumentPage.ts` (L3, UI)

A separate component because its page is the **exported document**, not the app. Keeping it apart from `TraceabilityPage` respects one-component-per-feature and keeps the `file://` + route-abort mechanics in one place.

| Member | Kind | Notes |
|---|---|---|
| `openOffline(filePath: string)` | ATC `@atc('BK-332')` | Aborts every non-`file:` request at the context, opens the file, asserts a full render and that the count of external requests is exactly `0` |
| `readStoryTitle(filePath: string)` | helper (`@step`) | Opens the file and returns its `<h1>` |
| `expectSnapshotUnchangedAfterMutation(args: { snapshotPath, expectedTitle })` | ATC `@atc('BK-333')` | Opens the T0 file and asserts it still carries the pre-mutation title |

### `tests/components/api/TraceabilityApi.ts` (L3, API)

| Member | Kind | Notes |
|---|---|---|
| `getStoryChain(args: { projectId, storyId })` | helper (`@step`) | Authenticated read; used as a precondition and for chain comparison |
| `expectUnauthenticatedRejection(args: { projectId, storyId })` | ATC `@atc('BK-335')` | Issues the call through an **unauthenticated request context**, asserts `401` and error code `unauthorized`, and asserts the body carries no story / criteria / ATC / run / defect keys |

### `tests/components/api/UserStoriesApi.ts` (L3, API)

| Member | Kind | Notes |
|---|---|---|
| `getStory(storyId: string)` | helper (`@step`) | Reads the current title so the test can restore it |
| `updateStoryTitle(args: { storyId, title })` | helper (`@step`) | `PATCH /api/v1/user-stories/{id}`. **Deliberately not an ATC** — see §4 |

### `tests/components/steps/TraceabilitySteps.ts` (L4, Steps — no `@atc`)

| Member | Notes |
|---|---|
| `mutateStoryTitleAndRestore(args: { storyId, mutatedTitle, run })` | Reads the original title, applies the mutation, runs the caller's closure, and restores the original in a `finally` — so an assertion failure mid-test still leaves the fixture clean |

---

## 4. Two design decisions worth stating

**The story-title mutation is a Step, not an ATC.** Renaming a story changes state, and rule 6 says state-changing actions are ATCs. But an ATC must map to a real TMS test case ID, and "rename a story" is not one of BK-50's test cases — it is BK-333's precondition. Minting a fake `@atc` for it would pollute the manifest and the traceability report. Steps exist for exactly this: reusable state-changing chains that are not themselves test cases.

**The restore is inside the Step, not in the test's `afterEach`.** BK-333 mutates a load-bearing BK-45 regression fixture. If the restore lives in the test body it is skipped on assertion failure; if it lives in `afterEach` it is decoupled from the mutation that requires it. Wrapping the caller's closure in `try/finally` inside the Step binds the two together — you cannot invoke the mutation without the restore.

---

## 5. Test files

| File | Project | TCs | Fixture |
|---|---|---|---|
| `tests/e2e/traceability/exportSnapshot.test.ts` | e2e | BK-331, BK-332, BK-333 | `{ ui }`, `{ test }` for BK-333 |
| `tests/e2e/traceability/traceabilityAccess.test.ts` | e2e | BK-334, BK-336 | `{ ui }` |
| `tests/integration/traceability/traceabilityAccess.test.ts` | integration | BK-335 | `{ api }` |

BK-334 and BK-336 are split away from the export flow because neither exports anything — one is an auth gate, the other a scope guard. Grouping them with the export tests would make the file name a lie.

---

## 6. Test data — Discover / Modify / Generate

| Need | Strategy | Notes |
|---|---|---|
| Story with a populated chain | **Discover** | The BK-45 fixture set on staging. `bk-45-fixtures` module, "full 5-layer evidence chain" story. |
| Project slug + id | **Discover** | Resolve at runtime from the projects list — never hardcode the UUID (`kata` rule 13 and anti-pattern T6's spirit). |
| Mutated story title | **Generate** | `TestContext` faker, suffixed so an abandoned run is identifiable in the UI. |
| Downloaded snapshot path | **Generate** | Per-test temp path; never a shared file — tests must not share state. |

**Do not seed new fixtures.** BK-45 left its fixture set on staging deliberately, and Stage 2 of BK-50 already proved it sufficient for all six cases.

---

## 7. Risks

- **Auth (blocking).** Covered in §0. Everything else is downstream of it.
- **Download handling under `retries: 0`.** A download that fires slowly will fail hard rather than retry. Await the `download` event concurrently with the click (`Promise.all`) rather than clicking and polling for a file — the latter is the flaky pattern.
- **`file://` navigation is environment-sensitive.** The offline assertion depends on the browser being allowed to open local files. Verify under CI's chromium, not only locally.
- **BK-333 mutates shared staging data.** The `try/finally` restore mitigates it, but two concurrent runs of BK-333 against the same story will interfere. Keep it out of any sharded/parallel project until the suite has per-run data isolation.
- **BK-336 is designed to fail one day.** When link-sharing ships it must be retired deliberately, not weakened into passing. Worth a comment in the test body saying so.

---

## 8. Prerequisites for `/adapt-framework`

Ordered by what blocks the most:

1. **Auth bootstrap for magic-link OTP.** Replace the password-form assumption in `tests/setup/ui-auth.setup.ts`; wire the `resend` inbox so the setup project can read the code. This is the design decision, not the typing.
2. **`config/variables.ts`** — point `envDataMap.staging` at `https://staging-upexbunkai.vercel.app`, and correct `config.auth` endpoints to Bunkai's real routes.
3. **Delete or rewrite the Dojo scaffolds** — `ExampleApi`, `ExamplePage`, `ExampleSteps`, `AuthApi`, `LoginPage`, and the four example test files, so `PROJ-*` ATC IDs leave the manifest.
4. **`bun run api:sync`** against Bunkai's OpenAPI so `api/schemas/` types back `TraceabilityApi` and `UserStoriesApi`.
5. **`bun run kata:manifest`** to regenerate after 3 and 4.

Items 2-5 are mechanical. Item 1 is a real piece of design work and should be scoped as such.

> Generated: 2026-08-14
> Project: Bunkai TMS
> Status: COMPLETED (2026-08-16)

## Results

- **Identity + variables**: `.agents/project.yaml` (2/4 QA epic keys resolved: `test_repository_epic=BK-70`, `defect_epic=BK-183`), `config/variables.ts` rewritten for the real 4-step cookie-auth flow + real staging URLs.
- **OpenAPI**: synced live from `https://staging-upexbunkai.vercel.app/api/openapi` (65 endpoints). Facades created: `auth.types.ts`, `userStory.types.ts`, `traceability.types.ts`.
- **Auth wiring**: `AuthApi.ts`, `LoginPage.ts`, `api-auth.setup.ts`, `ui-auth.setup.ts`, `scripts/api-login.ts` all rewritten. **Key correction found live**: the Bearer token for API calls is `body.pat.token`, NOT `body.session.access_token` (the latter 401s — confirmed by curl against staging). All auth verification passed for real: `api-setup`, `ui-setup`, and the agentic curl maneuver (`bun run api:login staging` → 200 on `/v1/me`).
- **First entity (User Story + Traceability)**: `UserStoryApi.ts`, `TraceabilityApi.ts`, `TraceabilityPage.ts` created and registered in `ApiFixture`/`UiFixture`. 3 negative/non-disclosure ATCs verified live and green (`bun run test:integration`, 9/9 passed).
- **Example cleanup**: all `Example*` components/specs/schema/data deleted; `PROJ-`/`UPEX-` ATC keys rewritten to `BK-*` repo-wide (`dashboard.test.ts` kept and renamed — endpoints resolve to the real API); `module-example` `testIgnore` removed from `playwright.config.ts`.
- **CI/manifest/MCP**: `kata-manifest.json` regenerated (5 components, 11 ATCs, 0 `Example` entries) and `kata:manifest:check` clean. `allurerc.mjs` renamed to "Bunkai TMS". 4 GitHub Secrets pushed live via `gh secret set` (`STAGING_USER_EMAIL/PASSWORD`, `LOCAL_USER_EMAIL/PASSWORD`) to `cbsegovia/bunkaid3-qa-engineering`.
- **Validation gate**: `bun run repo:check` exits 0 (format + lint + types + vars + vars:env + skills + registry all clean, only 8 non-blocking jsdoc warnings).

## Known gaps / not closed this pass

1. **QA test account has no workspace membership.** `bunkai-staging-qa3@olkacoraug.resend.app` (the new staging account created this session after the original account's password was unrecoverable — no reset endpoint exists) authenticates successfully but sees `workspaces: []`. It cannot exercise the HAPPY-path ATCs (`getUserStorySuccessfully`, `getStoryChainSuccessfully`, `expectChainRenders`) against real data until a workspace admin invites it. The 3 negative/non-disclosure ATCs do NOT depend on workspace membership and are verified live.
2. **`test:smoke` mixes UI cookies into API-only integration tests.** The `smoke` Playwright project shares `storageState` (browser cookies) across both UI and API-tagged `@critical` tests. This makes true "unauthenticated" API assertions unreliable when run via `test:smoke` (cookies silently reauthenticate the request) — confirmed root cause via `bun run test:integration` (isolated, no cookies), where all 9 tests including the negative-auth ones pass cleanly. Pre-existing template characteristic, not introduced this session — worth a `/framework-development` pass if it needs a structural fix.
3. **LOCAL_USER_PASSWORD** was pushed as a GitHub Secret but not independently verified against a running local instance (no local dev server was up this session) — only staging was verified end-to-end.
4. **GitHub Pages / `gh-pages` branch** — not verified this pass (Discovery Gap carried from the plan).
5. **TC-22 disposition (BK-45)** and **BK-329's defect-ID-missing observation** — unrelated open items from earlier in this session, not part of this plan's scope, still open.

## 1. Project Summary
- Stack: Next.js 15 (App Router) + Supabase (Postgres, RLS + SECURITY DEFINER RPCs) + Vercel, single repo (`../upex-bunkai-tms`), package manager `bun`.
- Auth: multi-step, cookie-session based (Supabase SSR), not classic bearer/JWT-in-body.
- Main entities (domain glossary): Workspace, Project, Module, User Story, Acceptance Criterion, ATC, Test, Run, Defect (Defect lives only in Jira today — no `defects` table in the product).
- OpenAPI source: reachable — `public/openapi.json` generated via `bun run openapi:gen` (in target repo), served at `/api/openapi`, interactive UI at `/api/docs`.
- Environments: local, staging (`staging-upexbunkai.vercel.app`), production (`upexbunkai.vercel.app` — per project memory, NEVER test against production).

## 2. Auth Strategy
**Scheme: COOKIE (Supabase SSR session), multi-step check-email branch — not the boilerplate's default password-form-returns-JWT assumption.**

```
POST /api/v1/auth/check-email {email}
  → existing account: POST /api/v1/auth/signin {email, password} → 200, sets session cookies
       success indicator: response 200 + cookies set; client does router.refresh() + navigate to `next`
  → new account:        POST /api/v1/auth/signup → 202 unconfirmed
       → OTP step: POST /api/v1/auth/confirm {email, token}
```

- **2FA/OTP gate**: OTP fires ONLY at signup confirmation, one time ever. A test account created + confirmed once needs no OTP on subsequent CI runs — password sign-in is enough going forward. No CAPTCHA anywhere.
- **`data-testid` coverage on login**: confirmed, 48 files use `data-testid` project-wide. Login form: `login-email`, `login-password`, `login-continue`, `login-signin`, `login-create`, `login-otp`, `login-verify`, `login-resend`, `login-error`.
- **Token refresh rule**: session is cookie-based (Supabase handles refresh via its own cookie rotation) — Playwright `storageState` captures cookies directly, no manual token-refresh logic needed in `ApiBase`. For the agentic curl maneuver (`api:login` → `.auth/tokens.env`), the equivalent is minting a fresh session via `signin` per run (per-run mint, no auto-refresh — same reality as the boilerplate default, just cookie-shaped instead of Bearer-shaped).
- **Known env-var name mismatch** (flag, fix in Phase 3): `.env.example` lists `SUPABASE_PUBLISHABLE_KEY`/`SUPABASE_SECRET_KEY`; the code actually reads `NEXT_PUBLIC_SUPABASE_ANON_KEY`/`SUPABASE_SERVICE_ROLE_KEY`.

## 3. OpenAPI Strategy
- Source: URL — target serves `/api/openapi` (JSON) once deployed to staging.
- Sync command: `bun run api:sync --url https://staging-upexbunkai.vercel.app/api/openapi -t`
- Facades to create: `api/schemas/auth.types.ts` (adapt to check-email/signin/signup/confirm), `api/schemas/userStory.types.ts` + `api/schemas/traceability.types.ts` (first entity, §5).
- MCP `openapi` server: KEEP enabled (spec is reachable) — schema-read-only, no token injection.

## 4. Identity + Variables
- `.agents/project.yaml`: `project_key: BK` (already set), `webapp_domain: staging-upexbunkai.vercel.app`, `backend_stack`/`frontend_stack: Next.js 15 + Supabase` (already set), `db_type: postgres`, `testing.default_env: staging` (already set — confirmed, never `production` per standing user instruction).
- `.env`: `LOCAL_USER_EMAIL/PASSWORD`, `STAGING_USER_EMAIL/PASSWORD` already populated (verified non-empty). `DBHUB_*` already populated. No new keys needed beyond fixing the Supabase key-name mismatch above if it turns out `.env` itself carries the wrong names (verify in Phase 3).
- `config/variables.ts`: replace `envDataMap` — `base`/`api` currently `dojo.upexgalaxy.com` / `localhost:3000` → real staging + local URLs. Add `auth.loginEndpoint` etc. as the 4-step sequence above (not a single endpoint).
- Env-enum reconciliation: env list stays `local | staging | production` (no new envs) — 4-way check still runs in Phase 3.5 but expected no-op.

## 5. Components to Create / Modify
**First entity (user-selected): User Story + Traceability** — highest immediate reuse, since BK-45/BK-50 already produced 20+ documented Candidate TCs referencing this exact surface.

| Component | Action |
|---|---|
| `AuthApi.ts` | Rewrite to the 4-step cookie flow; `@atc('PROJ-101'/'102')` → `@atc('BK-1xx')` |
| `LoginPage.ts` | Rewrite locators to the 9 real `data-testid`s above; rewrite ATC keys |
| `UserStoryApi.ts` (new) | `GET /api/v1/projects/{id}/user-stories`, `GET /api/v1/user-stories/{id}` |
| `TraceabilityApi.ts` (new) | `GET /api/v1/projects/{projectId}/traceability?story={id}` — reuses the BK-45/BK-50 exploration already on file |
| `TraceabilityPage.ts` (new) | UI component for the traceability chain view + export snapshot (BK-50) |
| Deleted | `ExampleApi.ts`, `ExamplePage.ts`, `ExampleSteps.ts`, `api/schemas/example.types.ts`, `tests/e2e/module-example/`, `tests/integration/module-example/`, hotel/booking data in `DataFactory.ts`/`types.ts` |
| ATC-key rewrite | All `PROJ-`/`UPEX-` → `BK-` project-wide in `tests/components/` |

## 6. Env Vars + Secrets
- `.env`: no new keys required (already populated); verify Supabase key-name mismatch doesn't affect test-runner env (test suite doesn't read Supabase keys directly — only `DBHUB_*` for DB MCP, already set).
- **GitHub repo Secrets** (user approved automatic push via `gh secret set` in Phase 7): `STAGING_USER_EMAIL`, `STAGING_USER_PASSWORD`, `LOCAL_USER_EMAIL`, `LOCAL_USER_PASSWORD`. `XRAY_CLIENT_ID`/`SECRET` — **NOT pushed** (still unset locally per earlier session; Xray API unused in practice, see §9 note). `ATLASSIAN_*` — push only if `AUTO_SYNC=true` in `.env` (verify in Phase 3).

## 7. CI + MCP + Reporting
- Target has NO CI/CD — irrelevant to this repo's own 4 workflows (`regression/sanity/smoke/build.yml`), which test THIS repo's Playwright suite against Bunkai staging, not Bunkai's own pipeline. Reconcile env options (`local/staging/production`) + secret names (already match `<ENV>_USER_EMAIL/_PASSWORD` scheme) — expected near-no-op.
- `gh-pages` branch / GitHub Pages: not verified this pass — Discovery Gap, ask separately if the user wants browsable Allure reports.
- MCP dual-file (`.mcp.json` + `opencode.jsonc`): `openapi` server stays enabled (URL reachable); `dbhub` stays enabled (`DBHUB_TYPE` set). No per-env server split needed — single workspace/project, not multi-region.
- `dbhub.toml`: verify `[[sources]]` engine matches Postgres/Supabase (expected already correct, `DBHUB_TYPE` was pre-set).
- `allurerc.mjs`: rename `Agentic QA Boilerplate` → `Bunkai TMS`.

## 8. Implementation Phases
Maps directly to skill Phases 3-8: 3 Identity/vars → 4 OpenAPI sync + facades → 5 Auth wiring (4-step flow) + verify → 6 UserStory/Traceability entity + fixtures + smoke + delete examples → 7 CI/manifest/MCP + push secrets (approved) → 8 validation gate (fail-fast, 11 steps).

## 9. AI Guidelines
- Inline locators in ATCs; extract only on 2nd reuse.
- Components import `@schemas/*`, never `@openapi` directly.
- `@atc('BK-NNN')` — real Jira Test-issue keys only, no invented IDs (anti-duplication gate already enforced by `kata-manifest.json`).
- Smoke tag stays `@critical`, never `@smoke`.
- **Xray note**: `tms_cli: bun xray` is configured but Xray API credentials are unset and, per established project convention (BK-331 precedent), Test-case creation already happens via plain `acli` + native Jira `Test` issue type — this adaptation does not touch that; it is orthogonal to KATA component wiring.

## 10. Questions Answered
- First entity to wire: **User Story + Traceability** (user choice, over ATC or Run).
- GitHub Secrets: **push automatically via `gh secret set`** in Phase 7 (user approved) — values never echoed in chat.
- Auth scheme: resolved from Phase 3 discovery (cookie-session, 4-step check-email flow) — no further question needed.
- Token refresh: per-run mint, cookie-shaped — accepted default, no staleness check needed (Supabase handles its own rotation).

## 11. Discovery Gaps
- `gh-pages` branch / GitHub Pages enablement — not verified.
- `AUTO_SYNC` / `ATLASSIAN_*` GitHub Secret need — depends on `.env` `AUTO_SYNC` value, verify in Phase 3.
- Supabase env-var name mismatch (`SUPABASE_PUBLISHABLE_KEY` vs `NEXT_PUBLIC_SUPABASE_ANON_KEY`) — confirm whether this repo's test suite needs those keys at all before "fixing" something that may be inert here.
- OpenCode usage by the user — not confirmed; both `.mcp.json` and `opencode.jsonc` will be kept in sync regardless (safe default, Rule #10).

## 12. Genericness Baseline (Phase 0 pre-scan snapshot)
| Subsystem | Status |
|---|---|
| project.yaml | GENERIC (4 `null #` fields remain) |
| ATC keys | GENERIC (`PROJ-101/102/103` across `AuthApi.ts`, `ExampleApi.ts`, `ExamplePage.ts`, `LoginPage.ts`) |
| Example components | GENERIC (all 4 present) |
| Example specs | GENERIC (`module-example/` present) |
| OpenAPI types | GENERIC (`openapi-types.ts` is the `any`/`any` stub) |
| Auth URLs | ADAPTED-partial (staging URL already correct in `config/variables.ts`; auth endpoints still generic) |
| kata-manifest | GENERIC (6 `Example` hits) |
| allurerc | GENERIC (`Agentic QA Boilerplate`) |

## 13. Approval Checklist
- [ ] Auth strategy (4-step cookie flow) matches your understanding of Bunkai's real login
- [ ] "User Story + Traceability" as the first wired entity is the right starting point
- [ ] OK to push the 4 GitHub Secrets automatically via `gh secret set` in Phase 7
- [ ] OK to delete all Example* components/specs/data in Phase 6
- [ ] OK to rewrite `PROJ-`/`UPEX-` ATC keys to `BK-` project-wide

---

WAIT for explicit user approval before starting Phase 3. Do not write code yet.

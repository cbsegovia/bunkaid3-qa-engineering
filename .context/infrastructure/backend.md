# Bunkai TMS — Backend Infrastructure

> Generated: 2026-08-14 by `/project-discovery` Phase 3 (Infrastructure Discovery).
> Method: reverse-engineered from `../upex-bunkai-tms` — `package.json`, `.env.example`, `middleware.ts`, `app/(auth)/login/**`, `app/api/v1/**`, `supabase/migrations/*.sql`. Target repo read-only; no writes made.
> Backend and frontend share ONE Next.js deploy unit — see `.context/SRS/architecture.md` for the full C4/ERD. This file documents the operational surface (runtime, env vars, commands, auth-flow) that `/adapt-framework` needs.

---

## Runtime

| Item | Value | Evidence |
|---|---|---|
| Language | TypeScript ^5.9.3 (`strict: true`) | `tsconfig.json` |
| Framework | Next.js `^15` — Route Handlers under `app/api/v1/**` (no separate Express/Nest server) | `package.json`; `app/api/` tree |
| Package manager | Bun (`bun.lock` present, no `package-lock.json`/`yarn.lock`/`pnpm-lock.yaml`) | target repo root |
| Node/Bun version pin | **not found** — no `.nvmrc`, `.node-version`, or `engines` field in `package.json` | Discovery Gap |
| Module system | ESM (`"type": "module"`) | `package.json` |
| Data access | No ORM — direct `@supabase/supabase-js` client calls + Postgres RPC (`bunkai_*` SECURITY DEFINER functions) for multi-step writes | `package.json`; `supabase/migrations/*.sql` |
| Validation | Zod `^4` + `@asteasolutions/zod-to-openapi` (OpenAPI spec generated from the same schemas) | `package.json` |

## Package Scripts (relevant to backend/build/test)

| Script | Command | Purpose |
|---|---|---|
| `dev` | `next dev` | Local dev server |
| `build` | `next build` | Production build |
| `start` | `next start` | Serve the production build |
| `typecheck` / `types:check` | `tsc --noEmit` | Type check only |
| `types:gen` | `bun scripts/gen-supabase-types.ts` | Regenerate Supabase-derived TS types |
| `lint:check` / `lint:fix` | `eslint .` / `eslint --fix .` | Lint |
| `format:check` / `format:fix` | `prettier --check/--write '**/*.{json,yml,yaml,css,scss,html}'` | Format non-TS assets |
| `api:sync` | `bun scripts/sync-openapi.ts` | Pull the generated OpenAPI spec |
| `openapi:gen` | `bun scripts/openapi-gen.ts` | Generate `public/openapi.json` from Zod schemas |
| `openapi:diff` | `bun scripts/openapi-diff.ts` | Diff OpenAPI spec against a baseline |
| `jira:sync-*` | `bun scripts/sync-jira-*.ts` | Same family of Jira sync scripts this QA repo also ships (target repo is scaffolded from the same "create-agentic-dev" boilerplate) |
| `repo:check` | `format:check && lint:check && types:check && vars:check && vars:env:check && skills:check && skills:registry:check` | The closest thing to a CI gate — **run manually**, no workflow triggers it |
| `vars:check`, `vars:env:check` | `bun scripts/lint-vars.ts`, `bun scripts/check-vars.ts` | Project-variable drift checks (same convention as this QA repo) |

**No dedicated automated-test script exists in `package.json`** (no `test`, no `jest`/`vitest`/`playwright test` entry). Discovery Gap — confirms this QA repo (`bunkai-qa-engineering-benja`) is the sole test-automation surface for the product; the target repo carries zero test runner of its own.

## Core Dependencies

| Category | Package | Version | Purpose |
|---|---|---|---|
| Framework | `next` | `^15` | App Router + Route Handlers |
| Auth | `@supabase/ssr` | `^0.10.3` | Cookie-session Supabase Auth in Route Handlers / middleware |
| DB client | `@supabase/supabase-js` | `^2.106.0` | Direct queries + RPC calls, no ORM |
| Validation | `zod` | `^4.4.3` | Request/response schemas |
| OpenAPI | `@asteasolutions/zod-to-openapi` | `^8.5.0` | Derives OpenAPI spec from the Zod schemas |
| API docs UI | `@scalar/api-reference-react` | `^0.9.38` | Renders spec at `/api/docs` |
| Markdown | `react-markdown`, `remark-gfm`, `rehype-sanitize` | — | Sanitized Markdown for module/AC descriptions |

## Environment Variables

Cross-checked `.env.example` against a live `grep -rhoE "process\.env\.[A-Z_0-9]+"` over `app/`, `lib/`, `scripts/`, `middleware.ts`. **Discrepancy found**: `.env.example` documents new-style Supabase key names (`SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`) but the code actually reads `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` (legacy-style names) — flag this as an env-var drift risk for anyone following `.env.example` literally.

### Required (app/auth will not function without these)

| Var | Read by | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `middleware.ts`, server/client Supabase factories | `https://<project-ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `middleware.ts` (as `SUPABASE_ANON_KEY` const), browser client | Actual var name used in code — differs from `.env.example`'s `SUPABASE_PUBLISHABLE_KEY` |
| `SUPABASE_SERVICE_ROLE_KEY` | server-only admin client (`lib/supabase/**`) | Actual var name used in code — differs from `.env.example`'s `SUPABASE_SECRET_KEY` |
| `SUPABASE_JWT_SECRET` | present in both `.env.example` and code grep | Sign/verify custom JWTs |
| `NEXT_PUBLIC_APP_URL` | auth redirects, OAuth callbacks, email links | `http://localhost:3000` locally |

### Optional / External Service

| Var | Purpose | Notes |
|---|---|---|
| `SUPABASE_PROJECT_REF` | referenced in code grep, not explicit in `.env.example` | Likely used by `scripts/gen-supabase-types.ts` or the Supabase MCP |
| `RESEND_API_KEY` | Transactional email | `business-feature-map.md` (this QA repo) notes invite emails are NOT sent in MVP — likely unused/reserved |
| `TAVILY_API_KEY`, `N8N_API_URL`, `N8N_API_KEY` | Boilerplate MCP scaffolding | No call sites found in this repo's own code — inherited from the shared "create-agentic-dev" template, not Bunkai-specific |
| `POSTGRES_*` (`HOST`, `USER`, `PASSWORD`, `DATABASE`, `URL`, `URL_NON_POOLING`, `PRISMA_URL`) | Direct Postgres connection | Present in `.env.example` for the Vercel+Supabase integration; no direct-Postgres call sites found in app code (all writes go through `@supabase/supabase-js` / RPC) |
| `ATLASSIAN_URL`, `ATLASSIAN_EMAIL`, `ATLASSIAN_API_TOKEN` | Jira sync scripts (`scripts/sync-jira-*.ts`) | Same convention as this QA repo — target repo ships its own Jira integration for its own product-development workflow, unrelated to the app runtime |
| `VERCEL_ENV` | read in code (grep) | Confirms Vercel hosting — the code branches on this at runtime |
| `PORT` | read in code (grep) | Standard Next.js `start` override |

## Database Configuration

| Item | Value |
|---|---|
| Type | PostgreSQL (Supabase-managed) |
| ORM | None — direct `@supabase/supabase-js` + `bunkai_*` SECURITY DEFINER RPC functions |
| Migrations | Plain SQL files, `supabase/migrations/0001`–`0037` at discovery time, hand-authored |
| RLS | Enabled on every table; Postgres policies are the sole authorization mechanism (see `.context/SRS/architecture.md` §Security Architecture) |
| QA DB access | `dbhub.toml` (target repo root) — QA connects through the Supabase **session pooler** (port 5432, `qa_inspector_ro.<project-ref>` read-only role); the **transaction pooler** (port 6543) is explicitly disallowed for QA use because it rejects prepared statements |

## Migration Commands

**Not found** — no `supabase db push`, `supabase migration up`, or equivalent script in `package.json`. Migrations under `supabase/migrations/` are presumably applied via the Supabase CLI directly or the Supabase dashboard/MCP, not a wrapped `bun run` command. Discovery Gap.

## Auth Flow (critical for `/adapt-framework` fixture wiring)

- **Session mechanism**: Supabase SSR cookie session (`@supabase/ssr`, `createServerClient`). `middleware.ts` gates `/projects` and `/onboarding` — unauthenticated requests to those prefixes redirect to `/login?next=<original path>`.
- **Login is email-first, multi-step**, driven entirely by client-side fetch calls to Route Handlers (not a single POST-and-redirect form):
  1. `POST /api/v1/auth/check-email` `{ email }` → `{ exists: boolean, confirmed: boolean }`. Existing+confirmed account → password step. Non-existing → account-creation step.
  2. Existing account: `POST /api/v1/auth/signin` `{ email, password }`. `200` → session cookies set on the response, client calls `router.refresh()` then navigates to `next`. `401` + `confirmed:false` → routes to the OTP-verify step instead of "wrong password". `429` → rate-limited.
  3. New account: `POST /api/v1/auth/signup` `{ email, password }`. `202` → account created but unconfirmed, moves to OTP-verify step. `409` → account already exists.
  4. OTP verify (new-signup email confirmation, **not** a login MFA step): `POST /api/v1/auth/confirm` `{ email, token }` — 6–8 digit numeric code. `200` → session cookies set, same completion as sign-in. `401` → invalid/expired code.
  5. Resend code: re-POSTs `/api/v1/auth/signup` with the same credentials.
- **OAuth**: GitHub + Google via Supabase-brokered handshake (`app/auth/oauth/[provider]`, `app/auth/callback`) — no `GITHUB_*`/`GOOGLE_*` env vars in this repo; providers are configured in the Supabase dashboard.
- **No CAPTCHA found** in the login flow code. **Email verification (OTP) is a signup-only gate**, not a per-login 2FA step — an account that is already `confirmed` skips it entirely on sign-in. This is significant for automated login: a test account created once and confirmed once needs no further OTP handling for subsequent logins.
- **Headless/CI callers** use a separate identity path entirely: Bearer PAT (`Authorization: bk_pat_<prefix>.<secret>`), resolved by `lib/api/principal.ts`, independent of the cookie-session flow above. See `.context/SRS/architecture.md` §Security Architecture for the full dual-identity design.

## Local Development Setup

```bash
# 1. Install dependencies
bun install

# 2. Set up environment
cp .env.example .env
# Edit .env — at minimum:
#   NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
#   NEXT_PUBLIC_SUPABASE_ANON_KEY=<from Supabase Dashboard → Settings → API>
#   SUPABASE_SERVICE_ROLE_KEY=<server-only, from same dashboard page>
#   SUPABASE_JWT_SECRET=<from same dashboard page>
#   NEXT_PUBLIC_APP_URL=http://localhost:3000

# 3. Database
# No wrapped migrate/seed script found in package.json — migrations under
# supabase/migrations/*.sql are presumably applied via the Supabase CLI or
# dashboard directly against the target Supabase project (Discovery Gap).

# 4. Start development server
bun run dev

# 5. Verify
# No dedicated /api/health endpoint found in app/api/v1/** — Discovery Gap.
# Fastest manual check: open http://localhost:3000/login and confirm the
# email-first form renders.
```

## Health Check Endpoints

**Not found.** No `app/api/health/**` or equivalent route in `app/api/v1/**`. Discovery Gap.

## Discovery Gaps

- No Node/Bun engine-version pin (`.nvmrc`, `engines`) — CI or a fresh clone could drift on runtime version.
- No `test` script or test runner dependency in the target repo's own `package.json` — confirms this QA repo is the sole automated-test surface, but means there is no target-side unit/integration test convention to align with.
- Migration apply/seed commands not found as `bun run` scripts — likely run via raw Supabase CLI, not independently confirmed this pass.
- No health-check endpoint found.
- `SUPABASE_PROJECT_REF` env var appears in a code grep but is undocumented in `.env.example` — purpose (likely `scripts/gen-supabase-types.ts` or MCP config) not independently traced this pass.
- `.env.example` documents legacy-named Supabase keys (`SUPABASE_PUBLISHABLE_KEY`/`SUPABASE_SECRET_KEY`) that do not match what the code actually reads (`NEXT_PUBLIC_SUPABASE_ANON_KEY`/`SUPABASE_SERVICE_ROLE_KEY`) — flagged above, not fixed (target repo is read-only).

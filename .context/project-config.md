# Project Configuration

> Project: Bunkai TMS
> Generated: 2026-08-14
> Discovery mode: reverse-engineering (target repo read-only)

## Repositories

| Repository | Path (resolved) | Branch | Purpose |
|------------|------------------|--------|---------|
| upex-bunkai-tms | `../upex-bunkai-tms` (relative to this QA repo) | not verified (no `git remote`/branch check requested) | Full-stack app — Next.js frontend + API routes + Supabase backend, single monolith repo (no separate frontend/backend split despite `.agents/project.yaml` declaring both `backend_repo` and `frontend_repo` pointing at the same path) |

`.agents/project.yaml` in this QA repo declares `backend_repo` = `frontend_repo` = `../upex-bunkai-tms` — confirmed correct: it is one Next.js monorepo, not two repos. `webapp_domain: upexbunkai.vercel.app` matches the `production` naming convention seen in `config/variables.ts` of this QA repo (staging = `staging-upexbunkai.vercel.app`).

## Tech Stack

### Frontend
- Framework: Next.js `^15` (App Router — confirmed via `app/` directory with route groups `(app)`, `(auth)`)
- Language: TypeScript `^5.9.3` (strict mode — `tsconfig.json` `"strict": true`)
- UI: React `^19`, Radix UI primitives (`@radix-ui/react-dialog`, `-dropdown-menu`, `-tabs`, `-tooltip`), `shadcn`-style `components.json`, `lucide-react` icons, `cmdk` command palette
- Styling: Tailwind CSS `^3.4` (`tailwind.config.ts`, `postcss.config.js`)
- Editor: Monaco Editor (`@monaco-editor/react`) — likely used for the ATC/step authoring UI
- API docs UI: `@scalar/api-reference-react` serving `app/api/docs`
- Markdown: `react-markdown` + `remark-gfm` + `rehype-sanitize` (module/AC descriptions are sanitized Markdown, per business-feature-map)
- Drag & drop: `@dnd-kit/*` (likely module tree / step reordering)

### Backend
- Framework: Next.js API routes (`app/api/v1/**`) — no separate Express/Nest server found
- Language: TypeScript (same codebase as frontend, single deploy unit)
- Auth: `@supabase/ssr` (cookie-session) + custom Bearer PAT scheme (`bk_pat_<prefix>.<secret>`) for headless/CI callers
- Validation: Zod `^4` (+ `@asteasolutions/zod-to-openapi` for OpenAPI spec generation)
- ORM: none — direct `@supabase/supabase-js` client calls + Postgres RPC functions (`bunkai_*` SECURITY DEFINER functions) for all writes with cross-table invariants

### Database
- Type: PostgreSQL (Supabase-managed)
- Provider: Supabase (`@supabase/supabase-js` `^2.106.0`)
- Migrations: plain SQL files under `supabase/migrations/` (0001–0037 at time of discovery), no ORM migration tool — hand-authored, heavily commented, RLS-first design
- Access: `[DB_TOOL]` — DBHub MCP per this QA repo's tool resolution table (`dbhub.toml` present in target repo root)
- Row Level Security: every table has RLS enabled; almost all authorization is enforced in Postgres policies plus a set of `bunkai_*` SECURITY DEFINER RPC functions for multi-step writes (create Test, create Run, finish Run, etc.)

### Infrastructure
- Cloud: Vercel (inferred from `webapp_domain` naming convention `*.vercel.app` and `POSTGRES_*` / `SUPABASE_*` env vars typical of a Vercel+Supabase integration)
- CI/CD: **none found** — no `.github/workflows/` directory exists in the target repo
- Monitoring: not found in dependencies or config (no Sentry/DataDog/etc. in `package.json`)
- Package manager: Bun (`bun.lock` present, all scripts invoked via `bun run` / `bun <script>.ts`)

## Environments

| Environment | URL | Purpose | Access |
|-------------|-----|---------|--------|
| Local       | `http://localhost:3000` (from this QA repo's `.agents/project.yaml`) | Dev | Direct (`bun run dev` in target repo) |
| Staging     | `https://staging-upexbunkai.vercel.app` (from this QA repo's `.agents/project.yaml`) | Pre-prod testing — **default QA env per this repo's CLAUDE.md rule** | Direct, no VPN/auth barrier observed |
| Production  | `https://upexbunkai.vercel.app` (webapp_domain) | Live | **Never test against — explicit team rule (Ely), recorded in this session's engram memory** |

Note: environment URLs are NOT independently re-derived from the target repo's own config (no `next.config.ts` environment block, no `vercel.json` found) — they are carried over from this QA repo's `.agents/project.yaml`, which is the existing source of truth. `.env.example` in the target confirms the env-var shape (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_APP_URL`, `SUPABASE_*`, `POSTGRES_*`) but does not contain live URL values (as expected for an example file).

## Tools and Access

- Issue tracker: Jira Cloud — resolved via `[ISSUE_TRACKER_TOOL]` (`acli`), instance `upexgalaxy71.atlassian.net` per this QA repo's `.agents/project.yaml`
- Project key: `BK`
- Database: resolved via `[DB_TOOL]` (DBHub MCP) — target repo ships its own `dbhub.toml`
- Docs: target repo has its own `docs/` directory (not enumerated in this pass) plus in-app API docs at `/api/docs` (Scalar) and a QA testability guide page at `/qa`
- **API spec source** (confirmed Phase 2): OpenAPI spec is generated statically to `public/openapi.json` via the `bun run openapi:gen` script (target repo), served at `GET /api/openapi` (`app/api/openapi/route.ts`, `force-static`) and rendered by the Scalar UI at `/api/docs`. This is the file `bun run api:sync` (this QA repo) should point at to regenerate `api/openapi-types.ts`.
- The target repo is itself scaffolded from the **same "create-agentic-dev" boilerplate family** as this QA repo (see Discovery Gaps — its `README.md` is the generic framework README, not a Bunkai-product description)

## Access Checklist

- [x] Repository read access — confirmed, full filesystem read of `../upex-bunkai-tms`
- [ ] Database access (MCP or direct) — not exercised this session; `dbhub.toml` exists in target but connectivity untested
- [x] Issue tracker access — already in active use by this QA repo (Jira/`acli`)
- [ ] Staging environment reachable — not pinged this session (discovery was code-only, no browser/network check)
- [x] CI/CD visibility — checked; **no CI/CD exists** (see Project Assessment)

## Discovery Gaps

- [ ] `README.md` in the target repo is the generic "create-agentic-dev" scaffolding README (installer instructions, prerequisites table), **not** a description of the Bunkai TMS product itself — business-model discovery below relies on route structure, migrations, and this QA repo's pre-existing `business-data-map.md` / `business-feature-map.md` instead.
- [ ] No `.github/workflows/` directory — cannot verify CI/CD claims beyond "does not exist"; deploy mechanism (assumed Vercel git-integration) not directly confirmed in-repo.
- [ ] Git remote / hosting (GitHub org, default branch) not queried — `gh repo view` was not run against the target since remote URL was not requested.
- [ ] Live environment reachability (staging/production HTTP check) not performed this session.
- [ ] Database connectivity via DBHub MCP not exercised — schema was read from `supabase/migrations/*.sql` source files directly instead.

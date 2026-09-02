#!/usr/bin/env bun

/**
 * ============================================================================
 * JIRA LIVE-DIFF FIELDS — compare cached .agents/jira-fields.json against the
 * LIVE Jira Cloud REST API
 * ============================================================================
 *
 * `bun run jira:check` only cross-validates local files against each other
 * (manifest vs. catalog vs. workflows) — it never calls Jira. During a site
 * migration (e.g. upexgalaxy71 -> upexgalaxy72), a cached `customfield_NNNNN`
 * id can silently start resolving to a DIFFERENT live field. `jira:check`
 * stays green through that (it has no live signal to catch it), so a script
 * writing to that id gets a `200 OK` while corrupting an unrelated field.
 *
 * This script closes that blind spot: it fetches every field from
 * `GET /rest/api/3/field` and compares `id -> name` against what
 * `.agents/jira-fields.json` has cached, one entry at a time.
 *
 * JIRA API ENDPOINTS USED:
 *   - GET /rest/api/3/field
 *       Returns ALL fields (system + custom). No pagination on this endpoint.
 *
 * ============================================================================
 * REQUIREMENTS
 * ============================================================================
 *
 * 1. Bun runtime (https://bun.sh)
 * 2. Atlassian API credentials (email + API token) — read-only permission is
 *    enough, unlike `jira:sync-fields` this does NOT require Administer.
 * 3. No external dependencies — uses native fetch + node:fs
 *
 * ============================================================================
 * ENVIRONMENT
 * ============================================================================
 *
 * Instance host — NOT an env var. Resolved from `.agents/project.yaml` ->
 * `issue_tracker.atlassian_url` (see `cli/lib/atlassian-instance.ts`).
 *
 * Required environment variables:
 *   ATLASSIAN_EMAIL=your-email@example.com
 *   ATLASSIAN_API_TOKEN=ATATT3x...
 *
 * ============================================================================
 * USAGE
 * ============================================================================
 *
 *   bun run jira:live-diff              # human-readable report to stdout
 *   bun run jira:live-diff --json       # machine-readable summary
 *   bun run jira:live-diff --help       # show help
 *
 * ============================================================================
 * EXIT CODES
 * ============================================================================
 *
 *   0 → every cached field matches the live instance (safe to write)
 *   1 → auth / network / config error
 *   2 → at least one field drifted or was not found (UNSAFE to write —
 *       treat every customfield_* write as unverified until this is 0)
 *
 * ============================================================================
 */

import { join } from 'node:path';

import {
  formatInstanceMismatchWarning,
  instanceSourceLabel,
  resolveAtlassianInstance,
} from '../cli/lib/atlassian-instance';

const REPO_ROOT = join(import.meta.dir, '..');
const FIELDS_PATH = join(REPO_ROOT, '.agents', 'jira-fields.json');

interface Config {
  baseUrl: string
  email: string
  apiToken: string
}

interface CliFlags {
  json: boolean
  help: boolean
}

interface CachedFieldEntry {
  id: string
  type: string
  name: string
  system?: true
}

interface LiveField {
  id: string
  name: string
  custom: boolean
}

const colors = {
  reset: '\x1B[0m',
  bold: '\x1B[1m',
  dim: '\x1B[2m',
  red: '\x1B[31m',
  green: '\x1B[32m',
  yellow: '\x1B[33m',
  blue: '\x1B[34m',
};

function out(msg: string): void {
  process.stdout.write(`${msg}\n`);
}

function err(msg: string): void {
  process.stderr.write(`${msg}\n`);
}

const log = {
  info: (msg: string) => err(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg: string) => err(`${colors.green}✔${colors.reset} ${msg}`),
  warn: (msg: string) => err(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg: string) => err(`${colors.red}✖${colors.reset} ${msg}`),
  dim: (msg: string) => err(`${colors.dim}${msg}${colors.reset}`),
};

function parseArgs(argv: string[]): CliFlags {
  const flags: CliFlags = { json: false, help: false };
  for (const arg of argv) {
    if (arg === '--json') { flags.json = true; }
    if (arg === '--help' || arg === '-h') { flags.help = true; }
  }
  return flags;
}

function printHelp(): void {
  out(`jira-live-diff-fields — compare .agents/jira-fields.json against the LIVE Jira API

USAGE:
  bun run jira:live-diff [flags]

FLAGS:
  --json      Print a machine-readable summary instead of the human report.
  --help, -h  Show this help.

WHY THIS EXISTS:
  bun run jira:check only cross-validates local files against each other —
  it never calls Jira, so it cannot see a customfield_* id that silently
  now resolves to a DIFFERENT live field (the exact failure mode a site
  migration like upexgalaxy71 -> 72 produces). Run this after any site
  event, and re-run it again whenever an admin says the migration settled
  — a snapshot taken mid-rollout goes stale within hours, so "checked once"
  is not the same as "safe now".

EXIT CODES:
  0  every cached field matches live — safe to write customfield_* values
  1  auth / network / config error
  2  at least one field drifted or was not found — UNSAFE, do not write
`);
}

function loadConfig(): Config {
  let instance;
  try {
    instance = resolveAtlassianInstance();
  }
  catch (e) {
    log.error((e as Error).message);
    process.exit(1);
  }

  const warning = formatInstanceMismatchWarning(instance);
  if (warning) { log.warn(warning); }

  const email = process.env.ATLASSIAN_EMAIL;
  const apiToken = process.env.ATLASSIAN_API_TOKEN;
  const missing: string[] = [];
  if (!email) { missing.push('ATLASSIAN_EMAIL'); }
  if (!apiToken) { missing.push('ATLASSIAN_API_TOKEN'); }
  if (missing.length > 0) {
    log.error(`Missing required environment variables: ${missing.join(', ')}`);
    log.dim('Add them to .env — see scripts/sync-jira-issues.ts header for setup.');
    process.exit(1);
  }

  log.info(`Using instance=${instance.baseUrl} (source: ${instanceSourceLabel(instance.source)})`);

  return { baseUrl: instance.baseUrl, email: email!, apiToken: apiToken! };
}

async function fetchLiveFields(config: Config): Promise<LiveField[]> {
  const auth = Buffer.from(`${config.email}:${config.apiToken}`).toString('base64');
  const res = await fetch(`${config.baseUrl}/rest/api/3/field`, {
    headers: { Authorization: `Basic ${auth}`, Accept: 'application/json' },
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`Jira API error: ${res.status} ${res.statusText} — ${await res.text()}`);
  }
  return res.json() as Promise<LiveField[]>;
}

async function main(): Promise<void> {
  const flags = parseArgs(process.argv.slice(2));
  if (flags.help) {
    printHelp();
    process.exit(0);
  }

  const config = loadConfig();

  let cached: Record<string, CachedFieldEntry>;
  try {
    cached = await Bun.file(FIELDS_PATH).json();
  }
  catch (e) {
    log.error(`Could not read ${FIELDS_PATH}: ${(e as Error).message}`);
    process.exit(1);
  }

  log.info('Fetching live field catalog from Jira…');
  let live: LiveField[];
  try {
    live = await fetchLiveFields(config);
  }
  catch (e) {
    log.error((e as Error).message);
    process.exit(1);
  }
  const liveById = new Map(live.map(f => [f.id, f.name]));

  const ok: string[] = [];
  const drifted: Array<{ slug: string, id: string, cachedName: string, liveName: string }> = [];
  const notFound: Array<{ slug: string, id: string, cachedName: string }> = [];

  for (const [slug, def] of Object.entries(cached)) {
    if (def.system) { continue; } // Jira-native system fields — different stability profile, skip.
    const liveName = liveById.get(def.id);
    if (liveName === undefined) {
      notFound.push({ slug, id: def.id, cachedName: def.name });
    }
    else if (liveName !== def.name) {
      drifted.push({ slug, id: def.id, cachedName: def.name, liveName });
    }
    else {
      ok.push(slug);
    }
  }

  const total = ok.length + drifted.length + notFound.length;
  const safe = drifted.length === 0 && notFound.length === 0;

  if (flags.json) {
    out(JSON.stringify({
      instance: config.baseUrl,
      checked_at: new Date().toISOString(),
      total,
      ok: ok.length,
      drifted: drifted.length,
      not_found: notFound.length,
      safe_to_write: safe,
      drift_detail: drifted,
      not_found_detail: notFound,
    }, null, 2));
    process.exit(safe ? 0 : 2);
  }

  for (const d of drifted) {
    out(`DRIFT: ${d.slug} (${d.id}) — cached "${d.cachedName}" vs live "${d.liveName}"`);
  }
  for (const n of notFound) {
    out(`NOT FOUND: ${n.slug} (${n.id}) — cached name "${n.cachedName}"`);
  }

  out('');
  if (safe) {
    log.success(`${ok.length}/${total} OK, 0 drifted, 0 not found — safe to write customfield_* values.`);
    process.exit(0);
  }
  else {
    log.error(`${ok.length}/${total} OK, ${drifted.length} drifted, ${notFound.length} not found — UNSAFE, do not write customfield_* values yet.`);
    process.exit(2);
  }
}

main().catch((e) => {
  log.error((e as Error).message);
  process.exit(1);
});

/**
 * KATA Architecture - Layer 3: Traceability Page Component
 *
 * UI component for BK-45's evidence chain view
 * (`/projects/{projectSlug}/traceability?story={userStoryId}`).
 *
 * Locators (data-testid, confirmed against `origin/staging` in the target
 * repo — components/traceability/TraceabilityChainView.tsx):
 * - No story selected: [data-testid="traceability-no-story-selected"]
 * - Error + retry:     [data-testid="traceability-error"] / [data-testid="traceability-retry"]
 * - Chain view root:   [data-testid="traceability-chain-view"]
 * - Zero-AC empty:     [data-testid="traceability-empty-zero-ac"]
 * - Zero-coverage:     [data-testid="traceability-zero-coverage-banner"]
 * - Archived banner:   [data-testid="traceability-archived-banner"]
 * - Uncovered AC strip:[data-testid="uncovered-strip"]
 * - Per-AC card:       [data-testid="traceability-ac-{acId}"]
 * - Per-ATC row:       [data-testid="traceability-atc-row-{atcId}"]
 * - Export button:     [data-testid="traceability-export-button"] (BK-50)
 * - Story unreachable: [data-testid="workbench-not-found"] (shared app-wide
 *                       not-found state — confirmed live 2026-08-25 for the
 *                       "story is foreign or nonexistent" case; the
 *                       `traceability-error` / `traceability-retry` ids
 *                       above do NOT appear on this route today, see
 *                       `expectNonDisclosureNotFound` below for detail)
 *
 * NOTE: `@atc('BK-110')` was a PLACEHOLDER ID — no real Jira Test issue
 * existed yet for this UI flow. It has been retired in favor of the real ID
 * `BK-445` (see `expectChainRenders` below). The remaining BK-45 Test issues
 * (BK-446..BK-464) are still pending the same graduation. `BK-111` was the
 * same kind of placeholder and has already been retired in favor of the
 * real ID `BK-453` (see `expectNoStorySelectedPrompt` below).
 *
 * Sub-row layer selectors (confirmed via live DOM inspection against
 * staging — the component ships no `data-testid` for these 4 cells, only
 * structural CSS classes, scoped under the confirmed
 * `[data-testid="traceability-atc-row-{atcId}"]` root):
 * - ATC title:        1st column > `div.truncate.text-fg-1`
 * - ATC layer badge:  1st column > `span.status-chip` (text content is the
 *                     layer, e.g. "API"/"UI"/"Unit" — `data-status` on this
 *                     element is unrelated, do not read it for layer)
 * - Test name:        2nd column > `span.truncate.text-fg-2`
 * - Run status pill:  3rd column > `span.status-chip` (both `data-status`
 *                     attr and text content carry the real run status,
 *                     e.g. `data-status="fail"` / text "Fail")
 * - Defect block:     4th column > repeated `div.flex.items-center.gap-1.5.text-xs`,
 *                     each with `span.truncate.text-fg-2` (defect title) +
 *                     `span.status-chip[data-status]` (defect status). The
 *                     defect ID is NEVER rendered in the DOM — only title +
 *                     status are asserted; do not invent an ID selector.
 *
 * `exportSnapshot` / `expectAnonymousRedirectToLogin` / `expectNoShareAffordance`
 * below carry REAL BK-50 TC IDs (BK-331/BK-334/BK-336) — this is the same
 * screen BK-50's export feature lives on top of, so its ATCs extend this
 * component instead of forking a duplicate one (see BK-50 automation-plan.md).
 */

import type { TestContextOptions } from '@TestContext';

import { expect } from '@playwright/test';
import { UiBase } from '@ui/UiBase';
import { atc, step } from '@utils/decorators';

// ============================================
// Traceability Page Component
// ============================================

export class TraceabilityPage extends UiBase {
  constructor(options: TestContextOptions) {
    super(options);
  }

  // ============================================
  // Navigation (Public)
  // ============================================

  @step
  async goto(args: { projectSlug: string, userStoryId: string }): Promise<void> {
    await this.page.goto(this.buildUrl(`/projects/${args.projectSlug}/traceability?story=${args.userStoryId}`));
  }

  // ============================================
  // ATCs - Complete Test Cases
  // ============================================

  /**
   * ATC: Open a fully covered Story's chain - expects every layer
   * (AC -> ATC -> Test -> Run -> Defect) to render with no broken/null
   * cells, on a single page load, no extra navigation (BK-45 AC-01).
   *
   * IMPORTANT: assumes the target Story has at least one AC, each bound
   * through to at least one ATC, Test, Run and linked Defect.
   *
   * Fixed assertions:
   *  - chain-view root visible
   *  - every AC card shows its title + at least one bound ATC row
   *  - every ATC row shows its title + layer badge + linked Test name
   *  - every Test shows its single latest Run status pill
   *  - every Run shows its linked Defect(s): title + status (no defect ID
   *    is ever rendered in the DOM - see component docblock)
   *
   * @param args - the Project slug and the Story to open
   * @param args.projectSlug - Project slug the Story belongs to
   * @param args.userStoryId - Story to open the chain for
   */
  @atc('BK-445')
  async expectChainRenders(args: { projectSlug: string, userStoryId: string }): Promise<void> {
    await this.goto(args);

    const chainView = this.page.locator('[data-testid="traceability-chain-view"]');
    await expect(chainView).toBeVisible({ timeout: 15000 });

    const acCards = chainView.locator('[data-testid^="traceability-ac-"]');
    await expect(acCards.first()).toBeVisible();

    const acCount = await acCards.count();
    for (let acIndex = 0; acIndex < acCount; acIndex += 1) {
      const acCard = acCards.nth(acIndex);
      await expect(acCard).not.toBeEmpty();

      const atcRows = acCard.locator('[data-testid^="traceability-atc-row-"]');
      const atcCount = await atcRows.count();
      expect(atcCount, 'expected every AC card to show at least one bound ATC row').toBeGreaterThan(0);

      for (let atcIndex = 0; atcIndex < atcCount; atcIndex += 1) {
        const atcRow = atcRows.nth(atcIndex);

        const atcTitle = atcRow.locator('div.truncate.text-fg-1').first();
        await expect(atcTitle).not.toHaveText('');

        const atcLayerBadge = atcRow.locator('span.status-chip').first();
        await expect(atcLayerBadge).not.toHaveText('');

        const testName = atcRow.locator('span.truncate.text-fg-2').first();
        await expect(testName).not.toHaveText('');

        const runStatusPill = atcRow.locator('span.status-chip').nth(1);
        await expect(runStatusPill).not.toHaveText('');

        const defectBlocks = atcRow.locator('div.flex.items-center.gap-1\\.5.text-xs');
        const defectCount = await defectBlocks.count();
        expect(defectCount, 'expected every Run to show at least one linked Defect').toBeGreaterThan(0);

        for (let defectIndex = 0; defectIndex < defectCount; defectIndex += 1) {
          const defectBlock = defectBlocks.nth(defectIndex);
          await expect(defectBlock.locator('span.truncate.text-fg-2').first()).not.toHaveText('');
          await expect(defectBlock.locator('span.status-chip').first()).not.toHaveText('');
        }
      }
    }
  }

  /**
   * ATC: Open a Story whose chain is exactly 1 layer deep at every step
   * through Run (1 AC -> 1 ATC -> 1 Test -> 1 Run) - expects the single-row
   * case to render exactly, not as a zero-row false-empty state and not with
   * any duplicated row (BK-45 AC-01, BVA-lower-boundary partition / TC-BK45-02
   * / BK-456).
   *
   * Deliberately narrower than `expectChainRenders` (@atc('BK-445')): no
   * Defect-layer assertion (out of this TC's stated Given/Then scope), and
   * exact-count checks (`toHaveCount(1)`) rather than `>= 1` checks - the
   * exactness IS the boundary being tested, not an incidental side effect of
   * happy-path coverage.
   *
   * Fixed assertions:
   *  - chain-view root visible
   *  - exactly one AC card renders (not zero, not more than one)
   *  - that AC card shows a non-empty title
   *  - exactly one ATC row renders inside it (not zero, not more than one)
   *  - that ATC row shows a non-empty title, layer badge, linked Test name,
   *    and Run status pill
   *
   * @param args - the Project slug and the Story to open
   * @param args.projectSlug - Project slug the Story belongs to
   * @param args.userStoryId - Story to open the chain for (must already
   *   satisfy the exactly-1-per-layer precondition through Run)
   */
  @atc('BK-456')
  async expectMinimalChainRenders(args: { projectSlug: string, userStoryId: string }): Promise<void> {
    await this.goto(args);

    const chainView = this.page.locator('[data-testid="traceability-chain-view"]');
    await expect(chainView).toBeVisible({ timeout: 15000 });

    const acCards = chainView.locator('[data-testid^="traceability-ac-"]');
    await expect(acCards).toHaveCount(1);

    const acCard = acCards.first();
    await expect(acCard).not.toBeEmpty();

    const atcRows = acCard.locator('[data-testid^="traceability-atc-row-"]');
    await expect(atcRows).toHaveCount(1);

    const atcRow = atcRows.first();

    const atcTitle = atcRow.locator('div.truncate.text-fg-1').first();
    await expect(atcTitle).not.toHaveText('');

    const atcLayerBadge = atcRow.locator('span.status-chip').first();
    await expect(atcLayerBadge).not.toHaveText('');

    const testName = atcRow.locator('span.truncate.text-fg-2').first();
    await expect(testName).not.toHaveText('');

    const runStatusPill = atcRow.locator('span.status-chip').nth(1);
    await expect(runStatusPill).not.toHaveText('');
  }

  /**
   * ATC: Open the route with no `?story=` param - expects the prompt state,
   * not the chain view and no fetch attempted (BK-45 TC-BK45-23 / BK-453).
   *
   * Registers a request collector before navigation (not a `page.route`
   * mock/abort) so the guard observes rather than blocks — the point is
   * proving the chain-fetch endpoint was never called, not preventing it.
   *
   * @param projectSlug - a valid Project slug
   */
  @atc('BK-453')
  async expectNoStorySelectedPrompt(projectSlug: string): Promise<void> {
    const chainFetchRequests: string[] = [];
    this.page.on('request', (request) => {
      if (/\/v1\/projects\/[^/]+\/traceability(?:\?|$)/.test(request.url())) {
        chainFetchRequests.push(request.url());
      }
    });

    await this.page.goto(this.buildUrl(`/projects/${projectSlug}/traceability`));

    await expect(this.page.locator('[data-testid="traceability-no-story-selected"]')).toBeVisible({ timeout: 10000 });
    await expect(this.page.locator('[data-testid="traceability-chain-view"]')).not.toBeVisible();
    expect(chainFetchRequests, 'expected no chain-fetch network request when the story param is absent').toHaveLength(0);
  }

  /**
   * ATC: Export the current chain as a self-contained snapshot document -
   * expects a file download whose suggested filename carries the project
   * slug and a second-granular export timestamp (BK-50 TC01, D26 pattern).
   *
   * Awaits the `download` event concurrently with the click (`Promise.all`)
   * rather than clicking then polling for a file — the latter is the flaky
   * pattern under this repo's `retries: 0` policy.
   *
   * @param saveTo - filesystem path to save the downloaded document to
   * @returns the path the snapshot was saved to
   */
  @atc('BK-331')
  async exportSnapshot(saveTo: string): Promise<string> {
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.page.locator('[data-testid="traceability-export-button"]').click(),
    ]);

    expect(download.suggestedFilename()).toMatch(/^trace-.+-\d{8}-\d{6}\.html$/);

    await download.saveAs(saveTo);

    return saveTo;
  }

  /**
   * ATC: Open the traceability screen with no authenticated session -
   * expects a redirect to `/login` carrying the original path in `next`,
   * with no chain markup rendered before the redirect (BK-50 TC04).
   *
   * Opens a FRESH browser context with no `storageState` — the shared
   * `page` from the `ui`/`test` fixtures is already authenticated, so the
   * anonymous caller needs its own context, not a cleared one.
   *
   * @param path - the traceability path to request, e.g. `/projects/{slug}/traceability?story={id}`
   */
  @atc('BK-334')
  async expectAnonymousRedirectToLogin(path: string): Promise<void> {
    const browser = this.page.context().browser();
    if (!browser) {
      throw new Error('expectAnonymousRedirectToLogin requires a browser-backed page context.');
    }

    const anonymousContext = await browser.newContext();
    try {
      const anonymousPage = await anonymousContext.newPage();
      await anonymousPage.goto(this.buildUrl(path));

      await anonymousPage.waitForURL(/\/login(\?|$)/, { timeout: 10000 });
      const redirectUrl = new URL(anonymousPage.url());
      expect(redirectUrl.pathname).toBe('/login');
      expect(redirectUrl.searchParams.get('next')).toBe(path);

      await expect(anonymousPage.locator('[data-testid="traceability-chain-view"]')).not.toBeVisible();
    }
    finally {
      await anonymousContext.close();
    }
  }

  /**
   * ATC: Open the traceability route with a target story ID the caller
   * cannot see (a same-project random UUID standing in for "foreign or
   * nonexistent" - see the component-level empirical note below for why the
   * two collapse into the same observable outcome) - expects the shared
   * app-wide not-found state, never the chain view, and zero chain data
   * (AC/ATC/Test/Run/Defect) anywhere in the DOM (BK-45 AC-05 / TC-BK45-16,
   * Decision Table rules 3+4, collapsed - same outcome, deliberate
   * non-disclosure).
   *
   * CORRECTED MECHANISM (empirically confirmed live against staging,
   * 2026-08-25 - supersedes the component docblock's `traceability-error` /
   * `traceability-retry` testids and the doctrine's assumed "User story not
   * found." literal string and network-interceptable 404, none of which
   * exist on this build for this route):
   * - The route is server-rendered as a single document navigation that
   *   always responds HTTP 200, whether the story resolves or not - the
   *   underlying `GET /v1/projects/{id}/traceability?story={id}` 404 (see
   *   `TraceabilityApi.expectMismatchedPairNotFound`, `@atc('BK-109')`)
   *   happens server-side and is never exposed as a client-observable
   *   network response, so there is nothing for `page.waitForResponse` to
   *   catch here, retry or not.
   * - The client renders the shared app-wide `[data-testid="workbench-not-
   *   found"]` state ("This item is no longer available" / "It may have
   *   been deleted, or you don't have access to it. The rest of the project
   *   is still here." / "Back to project") - NOT `traceability-error`, and
   *   there is no Retry control on this state at all.
   * - The literal string "User story not found." does not appear anywhere
   *   in the DOM for this route today (checked via full-page `innerHTML`).
   *   The non-disclosure property that IS provable at this layer, and is
   *   this ATC's actual contract, is: the SAME generic not-found state
   *   renders regardless of *why* the story is unreachable, and zero chain
   *   data ever leaks into it. The distinct 404 status code + `not_found`
   *   error code are already asserted at the API layer by BK-109.
   *
   * @param args - the Project slug and the target Story ID to probe
   * @param args.projectSlug - Project slug to build the route against
   * @param args.targetStoryId - a foreign-workspace story ID or a random
   *   nonexistent UUID (caller's responsibility to generate/discover)
   */
  @atc('BK-448')
  async expectNonDisclosureNotFound(args: { projectSlug: string, targetStoryId: string }): Promise<void> {
    await this.goto({ projectSlug: args.projectSlug, userStoryId: args.targetStoryId });

    await expect(this.page.locator('[data-testid="workbench-not-found"]')).toBeVisible({ timeout: 10000 });
    await expect(this.page.locator('[data-testid="traceability-chain-view"]')).not.toBeVisible();

    const acCount = await this.page.locator('[data-testid^="traceability-ac-"]').count();
    expect(acCount, 'expected zero AC cards to leak for an inaccessible story').toBe(0);

    const atcRowCount = await this.page.locator('[data-testid^="traceability-atc-row-"]').count();
    expect(atcRowCount, 'expected zero ATC rows to leak for an inaccessible story').toBe(0);
  }

  /**
   * ATC: Open the chain for a draft-status Story - expects the exact same
   * fully-populated chain view as any other lifecycle status, with no extra
   * gate, redirect, or restricted-content banner imposed on drafts (BK-45
   * State-Transition / EC11, TC-BK45-20 / BK-452).
   *
   * Guards against an over-eager access-control regression: a developer
   * hardening the non-disclosure rules (BK-448) or the archived-story gate
   * could plausibly add a defensive "only show published stories" check that
   * blocks drafts too - an over-restriction bug, not a security fix. This is
   * a narrower, negative-space companion to `expectChainRenders`
   * (`@atc('BK-445')`): that ATC proves every layer of a fully-covered chain
   * renders; this one proves lifecycle status alone is never a gating
   * condition, by asserting none of the screen's known gate/banner states
   * appear for a Story whose `status` is `draft`.
   *
   * EMPIRICALLY CONFIRMED (2026-08-25): the existing BK-45 seeded fixture
   * story already carries `status: "draft"` (`GET /v1/user-stories/{id}`),
   * so this reuses that same fixture rather than seeding a dedicated draft
   * story - matching the TC's own ROI note ("any existing draft-status story
   * works, no dedicated fixture required").
   *
   * @param args - the Project slug and a draft-status Story to open
   * @param args.projectSlug - Project slug the Story belongs to
   * @param args.userStoryId - a Story whose lifecycle `status` is `draft`
   */
  @atc('BK-452')
  async expectDraftStoryHasNoLifecycleGate(args: { projectSlug: string, userStoryId: string }): Promise<void> {
    await this.goto(args);

    expect(new URL(this.page.url()).pathname).toBe(`/projects/${args.projectSlug}/traceability`);

    const chainView = this.page.locator('[data-testid="traceability-chain-view"]');
    await expect(chainView).toBeVisible({ timeout: 15000 });

    await expect(this.page.locator('[data-testid="workbench-not-found"]')).toHaveCount(0);
    await expect(this.page.locator('[data-testid="traceability-error"]')).toHaveCount(0);
    await expect(this.page.locator('[data-testid="traceability-archived-banner"]')).toHaveCount(0);
    await expect(this.page.locator('[data-testid="traceability-no-story-selected"]')).toHaveCount(0);
  }

  /**
   * ATC: Open the chain for a Story with 1 active AC (1 bound ATC) and 1
   * archived AC (1 bound ATC) - expects only the active pair to render, with
   * the archived AC and its ATC fully absent anywhere on the page (BK-45
   * AC-06, TC-BK45-17 / BK-449).
   *
   * Data-integrity regression guard: proves the chain-assembly query filters
   * archived acceptance criteria (and, transitively, their bound ATCs), not
   * just archived ATCs on their own row.
   *
   * SEEDED FIXTURE (2026-08-25, via the real `DELETE /v1/acceptance-criteria/{id}`
   * archive endpoint - no direct DB write): Story
   * `f7a0f4d8-cb40-4643-9233-289b90a6a6dd` in `bk-45-traceability-fixtures`,
   * AC `fdc05f62-db3d-4417-a705-9e5bf1ca43ca` ("Active AC - stays visible")
   * active with ATC `dea99e3e-e740-4aa6-b7dc-4dc5f7cbb719`; AC
   * `498689c1-01ec-4e5f-8fea-c09db03a8517` ("Archived AC - must vanish
   * (BK-449)") archived with ATC `c00884b4-9fd9-4746-889f-13e2631938b6`.
   *
   * @param args - the Project slug and the Story to open
   * @param args.projectSlug - Project slug the Story belongs to
   * @param args.userStoryId - a Story with one active and one archived AC/ATC pair
   * @param args.archivedAcTitle - the archived AC's title, asserted absent from the page
   * @param args.archivedAtcTitle - the archived AC's bound ATC title, asserted absent from the page
   */
  @atc('BK-449')
  async expectArchivedAcExcluded(
    args: { projectSlug: string, userStoryId: string, archivedAcTitle: string, archivedAtcTitle: string },
  ): Promise<void> {
    await this.goto(args);

    const chainView = this.page.locator('[data-testid="traceability-chain-view"]');
    await expect(chainView).toBeVisible({ timeout: 15000 });

    const acCards = chainView.locator('[data-testid^="traceability-ac-"]');
    await expect(acCards).toHaveCount(1);

    await expect(this.page.getByText(args.archivedAcTitle, { exact: true })).toHaveCount(0);
    await expect(this.page.getByText(args.archivedAtcTitle, { exact: true })).toHaveCount(0);
  }

  /**
   * ATC: Open the chain for a Story whose sole active AC is bound to two
   * ATCs - one in the Story's own module, one in a descendant module that
   * was archived via the real module-subtree archive endpoint - expects only
   * the surviving ATC to render, with the "ghost" ATC fully excluded despite
   * its own `archived_at` staying null (BK-45 Error-Guessing / EC7, TC-BK45-18
   * / BK-450).
   *
   * Named regression class: a naive `WHERE atc.archived_at IS NULL` filter
   * would let this ATC leak through, because the archival signal lives on an
   * ancestor module, not the ATC's own row. Proves the chain-assembly query's
   * ancestor-aware exclusion, not just a same-row check.
   *
   * SEEDED FIXTURE (2026-08-25, via the real module-subtree archive endpoint
   * `DELETE /v1/modules/{id}` - no direct DB write): module
   * `bk-45-fixtures/ghost-sub` created under the Story's own module then
   * archived, hosting ATC `6b5932c5-aa79-4115-8373-c9ec21bee767` ("Ghost ATC
   * - ancestor module will be archived (BK-450)") bound to the same active AC
   * `fdc05f62-db3d-4417-a705-9e5bf1ca43ca` as `expectArchivedAcExcluded`'s
   * surviving ATC.
   *
   * @param args - the Project slug and the Story to open
   * @param args.projectSlug - Project slug the Story belongs to
   * @param args.userStoryId - a Story whose active AC has a ghost ATC under an archived ancestor module
   * @param args.ghostAtcTitle - the ghost ATC's title, asserted absent from the page
   */
  @atc('BK-450')
  async expectGhostAtcExcluded(
    args: { projectSlug: string, userStoryId: string, ghostAtcTitle: string },
  ): Promise<void> {
    await this.goto(args);

    const chainView = this.page.locator('[data-testid="traceability-chain-view"]');
    await expect(chainView).toBeVisible({ timeout: 15000 });

    const acCards = chainView.locator('[data-testid^="traceability-ac-"]');
    await expect(acCards).toHaveCount(1);

    const atcRows = acCards.first().locator('[data-testid^="traceability-atc-row-"]');
    await expect(atcRows).toHaveCount(1);

    await expect(this.page.getByText(args.ghostAtcTitle, { exact: true })).toHaveCount(0);
  }

  /**
   * ATC: Open the chain for a Story whose `archived_at` is set - expects the
   * chain to render normally (never the uniform-404 non-disclosure state),
   * with a visible "archived" banner and no mutating (new/edit/create/
   * delete/archive) affordance anywhere in the chain view (BK-45
   * State-Transition, TC-BK45-19 / BK-451).
   *
   * Deliberately distinct from `expectNonDisclosureNotFound` (`@atc('BK-448')`):
   * an archived Story is a legitimate, still-visible lifecycle state, not an
   * access-denial case - the two must never share an error-mapping path.
   *
   * SEEDED FIXTURE (2026-08-25, via the real `DELETE /v1/user-stories/{id}`
   * archive endpoint - the TC's originally-documented fixture story
   * `b57d3e7c-e896-4616-be62-088a9f7f95c2` returns 404 today, same
   * unreachable-legacy-fixture class as BK-453's stale project slug):
   * Story `31818967-f715-465c-bdb1-ac8168fa3919` ("QA Fixture: archived
   * story read-only banner (BK-451)") in `bk-45-traceability-fixtures`, one
   * AC with one bound ATC, archived after seeding.
   *
   * @param args - the Project slug and the archived Story to open
   * @param args.projectSlug - Project slug the Story belongs to
   * @param args.userStoryId - a Story whose lifecycle `archived_at` is set
   */
  @atc('BK-451')
  async expectArchivedStoryRendersReadOnly(args: { projectSlug: string, userStoryId: string }): Promise<void> {
    await this.goto(args);

    await expect(this.page.locator('[data-testid="workbench-not-found"]')).toHaveCount(0);

    const chainView = this.page.locator('[data-testid="traceability-chain-view"]');
    await expect(chainView).toBeVisible({ timeout: 15000 });

    await expect(this.page.locator('[data-testid="traceability-archived-banner"]')).toBeVisible();

    const mutatingControls = chainView.locator('button, a').filter({ hasText: /new|edit|create|delete|archive/i });
    await expect(mutatingControls).toHaveCount(0);
  }

  /**
   * ATC: Open a Story with zero acceptance criteria - expects the
   * authoring-gap copy "No acceptance criteria yet", visibly distinct from
   * the AC-03 zero-coverage banner, and zero chain rows at any layer (BK-45
   * AC-07, TC-BK45-13 / BK-446).
   *
   * `resolveStoryChainViewState` renders two different empty-state copies
   * for two different reasons (nobody authored ACs yet vs. ACs exist but
   * nothing is bound to them) - this ATC proves the authoring-gap branch
   * specifically, and that it never collapses into the other's banner.
   *
   * @param args - the Project slug and the zero-AC Story to open
   * @param args.projectSlug - Project slug the Story belongs to
   * @param args.userStoryId - a Story with zero acceptance criteria
   */
  @atc('BK-446')
  async expectZeroAcAuthoringGap(args: { projectSlug: string, userStoryId: string }): Promise<void> {
    await this.goto(args);

    await expect(this.page.locator('[data-testid="traceability-empty-zero-ac"]')).toContainText('No acceptance criteria yet');
    await expect(this.page.locator('[data-testid="traceability-zero-coverage-banner"]')).toHaveCount(0);

    await expect(this.page.locator('[data-testid^="traceability-ac-"]')).toHaveCount(0);
    await expect(this.page.locator('[data-testid^="traceability-atc-row-"]')).toHaveCount(0);
  }

  /**
   * ATC: Open a Story with 1+ acceptance criteria, none of which has an ATC
   * bound - expects the distinct "No coverage anywhere on this story"
   * banner (never a blank screen or spinner) alongside each AC's own
   * "Uncovered · 0 ATCs bound" strip (BK-45 AC-03, TC-BK45-12 / BK-464).
   *
   * Deliberately distinct from `expectZeroAcAuthoringGap` (`@atc('BK-446')`):
   * this Story genuinely has ACs, just zero coverage on any of them - a
   * different authoring state than never having written an AC at all.
   *
   * @param args - the Project slug and the Story to open
   * @param args.projectSlug - Project slug the Story belongs to
   * @param args.userStoryId - a Story with 1+ ACs, all with zero bound ATCs
   */
  @atc('BK-464')
  async expectZeroCoverageBannerRenders(args: { projectSlug: string, userStoryId: string }): Promise<void> {
    await this.goto(args);

    await expect(this.page.locator('[data-testid="traceability-empty-zero-ac"]')).toHaveCount(0);
    await expect(this.page.locator('[data-testid="traceability-zero-coverage-banner"]')).toContainText('No coverage anywhere on this story');

    const acCards = this.page.locator('[data-testid^="traceability-ac-"]');
    await expect(acCards).toHaveCount(1);
    await expect(acCards.first().locator('[data-testid="uncovered-strip"]')).toBeVisible();
  }

  /**
   * ATC: Open a Story with 1+ covered ACs and at least one AC with zero
   * bound ATCs - expects the zero-ATC AC to show the "Uncovered · 0 ATCs
   * bound" strip as a well-formed row, never blank or broken (BK-45,
   * TC-BK45-10 / BK-462).
   *
   * This is the primary coverage-gap-visibility signal the BK-44 epic exists
   * to surface - a silently hidden or blank uncovered row would defeat the
   * epic's purpose while leaving covered-AC rendering fully intact.
   *
   * @param args - the Project slug and the Story to open
   * @param args.projectSlug - Project slug the Story belongs to
   * @param args.userStoryId - a Story with 1+ covered ACs and 1+ zero-ATC AC
   * @param args.uncoveredAcTitle - the zero-ATC AC's title, to scope the strip assertion
   */
  @atc('BK-462')
  async expectUncoveredStripForZeroAtcAc(
    args: { projectSlug: string, userStoryId: string, uncoveredAcTitle: string },
  ): Promise<void> {
    await this.goto(args);

    const acCard = this.page.locator('[data-testid^="traceability-ac-"]').filter({ hasText: args.uncoveredAcTitle });
    await expect(acCard).toBeVisible();

    const strip = acCard.locator('[data-testid="uncovered-strip"]');
    await expect(strip).toBeVisible();
    await expect(strip).toContainText('Uncovered');
    await expect(strip).not.toBeEmpty();
  }

  /**
   * ATC: Open a Story with 2+ ACs where some have a full covered chain and
   * some have zero ATCs bound - expects both states to render correctly
   * side by side on the same page load, with no state bleeding from one AC
   * card into another (BK-45, TC-BK45-11 / BK-463, the ATP's explicitly
   * flagged untested residual before this pass).
   *
   * `resolveStoryChainViewState` has no dedicated "partial/mixed" state -
   * each `AcCard` independently decides covered-vs-uncovered. This proves
   * that independence live: a regression causing one card's render to leak
   * into a sibling's is invisible to any test that renders a single
   * `AcCard` in isolation.
   *
   * @param args - the Project slug and the Story to open
   * @param args.projectSlug - Project slug the Story belongs to
   * @param args.userStoryId - a Story with mixed AC coverage
   * @param args.coveredAcTitle - the covered AC's title
   * @param args.uncoveredAcTitle - the uncovered AC's title
   */
  @atc('BK-463')
  async expectMixedCoverageRendersSideBySide(
    args: { projectSlug: string, userStoryId: string, coveredAcTitle: string, uncoveredAcTitle: string },
  ): Promise<void> {
    await this.goto(args);

    await expect(this.page.locator('[data-testid="traceability-zero-coverage-banner"]')).toHaveCount(0);

    const coveredAc = this.page.locator('[data-testid^="traceability-ac-"]').filter({ hasText: args.coveredAcTitle });
    await expect(coveredAc).toBeVisible();
    await expect(coveredAc.locator('[data-testid^="traceability-atc-row-"]')).toHaveCount(1);
    await expect(coveredAc.locator('[data-testid="uncovered-strip"]')).toHaveCount(0);

    const uncoveredAc = this.page.locator('[data-testid^="traceability-ac-"]').filter({ hasText: args.uncoveredAcTitle });
    await expect(uncoveredAc).toBeVisible();
    await expect(uncoveredAc.locator('[data-testid="uncovered-strip"]')).toBeVisible();
    await expect(uncoveredAc.locator('[data-testid^="traceability-atc-row-"]')).toHaveCount(0);
  }

  /**
   * ATC: Open a Story where one ATC is bound to two acceptance criteria -
   * expects the ATC's chain segment to render in full under EACH bound AC,
   * never deduplicated or collapsed to a single appearance (BK-45 EP /
   * A5+EC3 "no ATC dedup across ACs" ruling, TC-BK45-25 / BK-455).
   *
   * A developer's instinct commonly fights this rule - deduplicating
   * repeated rows is the default behavior for most list-rendering
   * components. A regression that keys on ATC identity alone (instead of
   * the AC-ATC binding pair) would silently understate one AC's real
   * coverage - a traceability-integrity bug this Epic exists to prevent.
   *
   * @param args - the Project slug and the Story to open
   * @param args.projectSlug - Project slug the Story belongs to
   * @param args.userStoryId - a Story where one ATC is bound to 2 ACs
   * @param args.sharedAtcId - the ATC bound to both ACs
   */
  @atc('BK-455')
  async expectAtcRepeatsUnderEachBoundAc(
    args: { projectSlug: string, userStoryId: string, sharedAtcId: string },
  ): Promise<void> {
    await this.goto(args);

    const acCards = this.page.locator('[data-testid^="traceability-ac-"]');
    await expect(acCards).toHaveCount(2);

    const sharedAtcRows = this.page.locator(`[data-testid="traceability-atc-row-${args.sharedAtcId}"]`);
    await expect(sharedAtcRows).toHaveCount(2);
  }

  /**
   * ATC: Open a Story whose latest Run resolved to each of the 4 terminal
   * statuses in turn - expects the status pill to show the matching copy
   * per the AC-01 vocabulary, corrected post-BK-317 (BK-45, TC-BK45-04 /
   * BK-457).
   *
   * The latest-run status pill is the single most load-bearing piece of
   * information on the page - a wrong or stale pill actively misleads a
   * reviewer into believing a test passed when it did not, or vice versa.
   * This exact surface already produced BK-317 (a vocabulary Defect,
   * resolved by spec correction, not a code fix).
   *
   * @param args - the Project slug, the Story, and the target ATC/expected copy pair
   * @param args.projectSlug - Project slug the Story belongs to
   * @param args.userStoryId - the Story hosting the parametrized ATC rows
   * @param args.atcId - the ATC whose latest run resolved to the target status
   * @param args.expectedCopy - the exact pill text expected ("Pass"/"Fail"/"Blocked"/"Aborted")
   */
  @atc('BK-457')
  async expectRunStatusPillMatchesTerminalStatus(
    args: { projectSlug: string, userStoryId: string, atcId: string, expectedCopy: string },
  ): Promise<void> {
    await this.goto(args);

    const atcRow = this.page.locator(`[data-testid="traceability-atc-row-${args.atcId}"]`);
    await expect(atcRow).toBeVisible();

    const runStatusPill = atcRow.locator('span.status-chip').nth(1);
    await expect(runStatusPill).toHaveText(args.expectedCopy);
  }

  /**
   * ATC: Open a Story whose latest Run is still in-flight ("running"),
   * after an earlier finished Run on the same Test already recorded a
   * terminal verdict - expects the in-progress state to render, never the
   * stale prior run's pass/fail/blocked pill (BK-45, TC-BK45-05 / BK-458).
   *
   * A run that is still running must never be presented as a false pass or
   * fail. A regression letting a stale prior-run status leak through during
   * an active run would silently give a reviewer false confidence about
   * current coverage - this ATC seeds a genuinely prior-then-current run
   * pair, not a lone in-flight run, so the "no stale leak" half of the
   * contract is actually exercised.
   *
   * @param args - the Project slug and the Story to open
   * @param args.projectSlug - Project slug the Story belongs to
   * @param args.userStoryId - the Story hosting the in-flight ATC
   * @param args.atcId - the ATC whose latest run is running, with an earlier finished run beneath it
   */
  @atc('BK-458')
  async expectInFlightRunNotMisleading(
    args: { projectSlug: string, userStoryId: string, atcId: string },
  ): Promise<void> {
    await this.goto(args);

    const atcRow = this.page.locator(`[data-testid="traceability-atc-row-${args.atcId}"]`);
    await expect(atcRow).toHaveAttribute('data-status', 'running');

    const runStatusPill = atcRow.locator('span.status-chip').nth(1);
    await expect(runStatusPill).toHaveText('Running');
    await expect(runStatusPill).not.toHaveText(/pass|fail|blocked/i);
  }

  /**
   * ATC: Open a Story whose latest Run has 2+ linked defects with different
   * creation timestamps - expects all defects to render under that run,
   * ordered most-recently-created first (BK-45, TC-BK45-07 / BK-459).
   *
   * Order matters here because a reviewer scanning the chain expects the
   * most recent defect status first. A regression reverting to ascending or
   * unstable order would not fail any single-defect assertion, but would
   * degrade the review workflow for every multi-defect run.
   *
   * Does NOT assert a Defect's ID - the traceability chain view never
   * renders one anywhere in the DOM (see the component docblock and the
   * product Improvement filed for this gap, BK-603); only title + status
   * are asserted, per `expectChainRenders`'s (`@atc('BK-445')`) established
   * contract.
   *
   * @param args - the Project slug, the Story, and the ATC hosting the ordered defects
   * @param args.projectSlug - Project slug the Story belongs to
   * @param args.userStoryId - the Story hosting the multi-defect ATC
   * @param args.atcId - the ATC whose latest run has 2+ linked defects
   * @param args.newestDefectTitle - the most-recently-created defect's title, expected first
   * @param args.oldestDefectTitle - the earlier-created defect's title, expected second
   */
  @atc('BK-459')
  async expectDefectsOrderedNewestFirst(
    args: { projectSlug: string, userStoryId: string, atcId: string, newestDefectTitle: string, oldestDefectTitle: string },
  ): Promise<void> {
    await this.goto(args);

    const atcRow = this.page.locator(`[data-testid="traceability-atc-row-${args.atcId}"]`);
    const defectTitles = atcRow.locator('div.flex.items-center.gap-1\\.5.text-xs > span.truncate.text-fg-2');

    await expect(defectTitles).toHaveCount(2);
    await expect(defectTitles.nth(0)).toHaveText(args.newestDefectTitle);
    await expect(defectTitles.nth(1)).toHaveText(args.oldestDefectTitle);
  }

  /**
   * ATC: Open a Story whose ATC shares a Test/Run with a different Story's
   * ATC, where that different Story's ATC has a defect linked to it -
   * expects the shared Run to render normally for this Story's own ATC,
   * with the foreign Story's defect NEVER appearing anywhere in this
   * Story's chain (BK-45 HIGH-severity cross-story defect-leak guard,
   * TC-BK45-08 / BK-460).
   *
   * Defects are scoped via `bugs.atc_id`, not `run_id`, specifically so a
   * defect belonging to a different story's ATC never bleeds into this
   * story's chain even when the underlying Test/Run row is shared. A
   * `story-traceability-isolation.test.ts` DB-integration suite (11/11
   * passing) proves the SQL predicate in isolation; this ATC is the only
   * proof the live UI actually respects that scoping boundary end-to-end -
   * a regression here would be a CRITICAL-severity cross-story data leak.
   *
   * @param args - the Project slug, this Story, and the shared ATC/foreign defect identity
   * @param args.projectSlug - Project slug the Story belongs to
   * @param args.userStoryId - this Story, whose own ATC shares the Run
   * @param args.ownAtcId - this Story's own ATC in the shared Run
   * @param args.foreignDefectTitle - the foreign Story's defect title, asserted absent everywhere
   */
  @atc('BK-460')
  async expectSharedRunHidesForeignDefect(
    args: { projectSlug: string, userStoryId: string, ownAtcId: string, foreignDefectTitle: string },
  ): Promise<void> {
    await this.goto(args);

    const ownAtcRow = this.page.locator(`[data-testid="traceability-atc-row-${args.ownAtcId}"]`);
    await expect(ownAtcRow).toBeVisible();
    await expect(ownAtcRow.locator('span.truncate.text-fg-2').first()).not.toHaveText('');

    await expect(this.page.getByText(args.foreignDefectTitle, { exact: true })).toHaveCount(0);
  }

  /**
   * ATC: Open a Story hosting an ATC missing a layer downstream of itself
   * (no Test chained, a Test chained but zero Runs ever started, or a Run
   * with zero linked Defects) - expects the exact layer-specific
   * "awaiting data" copy in the relevant cell(s), never a null or blank
   * cell (BK-45, TC-BK45-09 / BK-461).
   *
   * CORRECTED SCOPE (2026-08-25): the TC's Jira Examples table listed 5 rows
   * under one ambiguous "missing_layer" label, three of which all said
   * "Run" with three different, seemingly contradictory copies. Confirmed
   * live against staging that this was a labeling problem, not a real
   * product ambiguity - the 3 "Run" rows actually span TWO different CELLS
   * (Run and Defect) across the SAME TWO real preconditions:
   * - No Test chained at all: Test cell = "No test written yet", Run cell
   *   = "Awaiting test", Defect cell = "Awaiting test" too.
   * - A Test chained, zero Runs ever started: Run cell = "No run recorded
   *   yet", Defect cell = "Awaiting first run" (this is the Jira table's
   *   mislabeled 4th "Run" row - it is actually the Defect cell's
   *   placeholder for this precondition, not a second Run-cell copy).
   * A Run existing with zero linked Defects ("None linked") was already
   * confirmed as its own, unambiguous case - not part of the corrected
   * scope above.
   *
   * Deliberately a single flexible method rather than one method per cell:
   * each precondition below only has meaningful copy in a subset of the 3
   * cells, so the caller passes only the cell(s) that precondition
   * populates, per Test file below.
   *
   * @param args - the Project slug, Story, target ATC, and whichever cell copy applies to it
   * @param args.projectSlug - Project slug the Story belongs to
   * @param args.userStoryId - the Story hosting the target ATC
   * @param args.atcId - the ATC missing the layer(s) under test
   * @param args.expectedTestCopy - expected Test-cell copy, when the ATC has no Test chained
   * @param args.expectedRunCopy - expected Run-cell copy, when relevant
   * @param args.expectedDefectCopy - expected Defect-cell copy, when relevant
   */
  @atc('BK-461')
  async expectLayerGapCopy(
    args: {
      projectSlug: string
      userStoryId: string
      atcId: string
      expectedTestCopy?: string
      expectedRunCopy?: string
      expectedDefectCopy?: string
    },
  ): Promise<void> {
    await this.goto(args);

    const atcRow = this.page.locator(`[data-testid="traceability-atc-row-${args.atcId}"]`);
    await expect(atcRow).toBeVisible();

    const cells = atcRow.locator('> div');

    if (args.expectedTestCopy !== undefined) {
      await expect(cells.nth(1)).toContainText(args.expectedTestCopy);
    }
    if (args.expectedRunCopy !== undefined) {
      await expect(cells.nth(2)).toContainText(args.expectedRunCopy);
    }
    if (args.expectedDefectCopy !== undefined) {
      await expect(cells.nth(3)).toContainText(args.expectedDefectCopy);
    }
  }

  /**
   * ATC: Enumerate the screen's controls - expects "Export snapshot" to be
   * the only mutating control, with no share / publish / copy-link
   * affordance anywhere (BK-50 TC06, Option E scope guard, comments
   * 12238/12239). Retire this test deliberately — never weaken it — the day
   * link-sharing ships.
   */
  @atc('BK-336')
  async expectNoShareAffordance(): Promise<void> {
    await expect(this.page.locator('[data-testid="traceability-export-button"]')).toBeVisible();

    const shareAffordanceCount = await this.page.locator(
      '[data-testid*="share" i], [data-testid*="publish" i], [data-testid*="copy-link" i], '
      + '[data-testid*="public-link" i], button:has-text("Share"), button:has-text("Publish"), a:has-text("Share")',
    ).count();
    expect(shareAffordanceCount, 'expected no share/publish/copy-link control on the traceability screen').toBe(0);
  }
}

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

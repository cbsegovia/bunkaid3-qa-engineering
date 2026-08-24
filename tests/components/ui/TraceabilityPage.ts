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
 *
 * NOTE: `@atc('BK-110')` below is a PLACEHOLDER ID — no real Jira Test issue
 * exists yet for this UI flow. The real BK-45 Test issues (BK-445..BK-464)
 * are the ones that should eventually replace it. `BK-111` was the same kind
 * of placeholder and has already been retired in favor of the real ID
 * `BK-453` (see `expectNoStorySelectedPrompt` below).
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
   * ATC: Open a fully covered Story's chain - expects the chain view to render
   *
   * IMPORTANT: assumes the target Story has at least one AC with a bound ATC.
   *
   * @param args - the Project slug and the Story to open
   * @param args.projectSlug - Project slug the Story belongs to
   * @param args.userStoryId - Story to open the chain for
   */
  @atc('BK-110')
  async expectChainRenders(args: { projectSlug: string, userStoryId: string }): Promise<void> {
    await this.goto(args);

    await expect(this.page.locator('[data-testid="traceability-chain-view"]')).toBeVisible({ timeout: 15000 });
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

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
 * NOTE: `@atc('BK-110'/'BK-111')` below are PLACEHOLDER IDs — no real Jira
 * Test issue exists yet for these UI flows. The real BK-45 Test issues
 * (BK-445..BK-464) are the ones that should eventually replace them.
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
   * not the chain view and no fetch attempted (BK-45 TC-BK45-23).
   *
   * @param projectSlug - a valid Project slug
   */
  @atc('BK-111')
  async expectNoStorySelectedPrompt(projectSlug: string): Promise<void> {
    await this.page.goto(this.buildUrl(`/projects/${projectSlug}/traceability`));

    await expect(this.page.locator('[data-testid="traceability-no-story-selected"]')).toBeVisible({ timeout: 10000 });
    await expect(this.page.locator('[data-testid="traceability-chain-view"]')).not.toBeVisible();
  }
}

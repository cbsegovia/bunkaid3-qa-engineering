/**
 * KATA Architecture - Layer 3: Snapshot Document Page Component
 *
 * UI component for the BK-50 EXPORTED document itself — not the Bunkai app.
 * Kept apart from TraceabilityPage because this page's origin is `file://`,
 * not the app's baseUrl: mixing the two would smuggle `file://` navigation
 * and route-abort mechanics into a component that otherwise only ever talks
 * to the live app (BK-50 spec.md §3 — "its page is the exported document").
 *
 * Locators: the exported document mirrors the on-screen chain markup
 * (`data-testid="traceability-chain-view"` carried over from
 * TraceabilityPage — the export renderer reuses the same component tree).
 */

import type { Browser, BrowserContext } from '@playwright/test';
import type { TestContextOptions } from '@TestContext';

import { resolve } from 'node:path';
import { expect } from '@playwright/test';
import { UiBase } from '@ui/UiBase';
import { atc, step } from '@utils/decorators';

// ============================================
// Snapshot Document Page Component
// ============================================

export class SnapshotDocumentPage extends UiBase {
  constructor(options: TestContextOptions) {
    super(options);
  }

  // ============================================
  // Helpers (Public, no @atc)
  // ============================================

  /**
   * Helper: open a previously downloaded snapshot from disk and return its
   * story heading. Used as a precondition read for BK-333's T0/T1 chain
   * comparison — never an ATC on its own.
   *
   * @param filePath - path to a downloaded snapshot document
   */
  @step
  async readStoryTitle(filePath: string): Promise<string> {
    const context = await this.newOfflineContext();
    try {
      const page = await context.newPage();
      await page.goto(this.toFileUrl(filePath));
      const heading = await page.locator('h1').first().textContent();
      return heading?.trim() ?? '';
    }
    finally {
      await context.close();
    }
  }

  // ============================================
  // ATCs - Complete Test Cases (ACTION + VERIFICATION)
  // ============================================

  /**
   * ATC: Open a downloaded snapshot with every non-`file:` request aborted -
   * expects a full render and exactly zero external requests (BK-50 TC02).
   * Any non-zero count is a failure regardless of whether the page still
   * looks correct — self-containment is the promise being tested, not the
   * markup.
   *
   * @param filePath - path to a downloaded snapshot document
   */
  @atc('BK-332')
  async openOffline(filePath: string): Promise<void> {
    const context = await this.newOfflineContext();
    let externalRequestCount = 0;

    try {
      await context.route('**/*', async (route) => {
        if (!route.request().url().startsWith('file:')) {
          externalRequestCount += 1;
          await route.abort();
          return;
        }
        await route.continue();
      });

      const page = await context.newPage();
      await page.goto(this.toFileUrl(filePath));

      await expect(page.locator('[data-testid="traceability-chain-view"]')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('h1').first()).toBeVisible();
      await expect(page.locator('footer')).toBeVisible();

      expect(externalRequestCount).toBe(0);
    }
    finally {
      await context.close();
    }
  }

  /**
   * ATC: Open a T0 snapshot after the live chain has changed - expects the
   * document to still show the pre-mutation title (BK-50 TC03). The T0 vs
   * T1 flow-level comparison stays in the test file; this ATC's own fixed
   * assertion is limited to the T0 document's content.
   *
   * @param args - the T0 snapshot path and the title it must still show
   * @param args.snapshotPath - path to the T0 (pre-mutation) snapshot
   * @param args.expectedTitle - the title captured before the mutation
   */
  @atc('BK-333')
  async expectSnapshotUnchangedAfterMutation(
    args: { snapshotPath: string, expectedTitle: string },
  ): Promise<void> {
    const title = await this.readStoryTitle(args.snapshotPath);
    expect(title).toBe(args.expectedTitle);
  }

  // ============================================
  // Private Helpers
  // ============================================

  private toFileUrl(filePath: string): string {
    const resolved = resolve(filePath).replace(/\\/g, '/');
    const prefixed = resolved.startsWith('/') ? resolved : `/${resolved}`;
    return `file://${prefixed}`;
  }

  private async newOfflineContext(): Promise<BrowserContext> {
    const browser: Browser | null = this.page.context().browser();
    if (!browser) {
      throw new Error('SnapshotDocumentPage requires a browser-backed page context.');
    }
    return browser.newContext();
  }
}

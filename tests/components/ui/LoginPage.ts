/**
 * KATA Architecture - Layer 3: Login Page Component
 *
 * UI component for authentication via the login page — Bunkai TMS.
 *
 * Real flow (confirmed by /project-discovery Phase 3 against ../upex-bunkai-tms,
 * 48 files using `data-testid`): email-first, branching on account state.
 *   1. Fill email, click Continue -> branches client-side on check-email result
 *   2. Existing + confirmed account: password field appears, click Sign in
 *   3. New account: Create-account path -> OTP step (login-otp/login-verify) —
 *      one-time only, never on repeat sign-in. Not modeled here — see
 *      scripts/api-login.ts for the equivalent API-level signup+confirm flow
 *      if a test ever needs to provision a brand-new account.
 *
 * NOTE: `@atc('BK-103'/'BK-104')` below are PLACEHOLDER IDs — no real Jira
 * Test issue exists yet for these UI login flows. Run `/test-documentation`
 * to create the real BK Test issues before treating this suite as
 * regression-complete (CLAUDE.md Rule #12).
 *
 * Page: /login
 * Locators (data-testid, confirmed in target source):
 * - Email: [data-testid="login-email"]
 * - Continue: [data-testid="login-continue"]
 * - Password: [data-testid="login-password"]
 * - Sign in: [data-testid="login-signin"]
 * - Error: [data-testid="login-error"]
 */

import type { TestContextOptions } from '@TestContext';

import { expect } from '@playwright/test';
import { UiBase } from '@ui/UiBase';
import { atc, step } from '@utils/decorators';

// ============================================
// Types - Login data structures
// ============================================

export interface LoginCredentials {
  email: string
  password: string
}

// ============================================
// Login Page Component
// ============================================

export class LoginPage extends UiBase {
  constructor(options: TestContextOptions) {
    super(options);
  }

  // ============================================
  // Helpers (Private)
  // ============================================

  /**
   * Step 1 of the real flow: submit the email, advance past the check-email branch.
   */
  private async submitEmail(email: string): Promise<void> {
    await this.page.locator('[data-testid="login-email"]').fill(email);
    await this.page.locator('[data-testid="login-continue"]').click();
  }

  /**
   * Step 2 (existing + confirmed account only): submit the password.
   */
  private async submitPassword(password: string): Promise<void> {
    await this.page.locator('[data-testid="login-password"]').fill(password);
    await this.page.locator('[data-testid="login-signin"]').click();
  }

  // ============================================
  // Navigation (Public)
  // ============================================

  /**
   * Navigate to the login page
   * Call this BEFORE using login ATCs
   */
  @step
  async goto(): Promise<void> {
    await this.page.goto(this.buildUrl('/login'));
  }

  // ============================================
  // ATCs - Complete Test Cases
  // ============================================

  /**
   * ATC: Login with valid credentials - expects success
   *
   * IMPORTANT: Call goto() before this ATC. Assumes an EXISTING, CONFIRMED
   * account (no OTP step) — see AuthApi.checkEmail if a test needs to assert
   * the account state first.
   *
   * @param credentials - Email and password of an existing, confirmed account
   */
  @atc('BK-103')
  async loginSuccessfully(credentials: LoginCredentials): Promise<void> {
    await this.submitEmail(credentials.email);
    await this.submitPassword(credentials.password);

    // Wait for authentication to complete and redirect away from /login
    await this.page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 15000 });
    await expect(this.page).not.toHaveURL(/.*\/login.*/);
  }

  /**
   * ATC: Login with invalid password - expects error
   *
   * IMPORTANT: Call goto() before this ATC. Assumes the email itself belongs
   * to an existing, confirmed account (so the password field is reached) —
   * only the password is wrong.
   *
   * @param credentials - Existing email, wrong password
   */
  @atc('BK-104')
  async loginWithInvalidCredentials(credentials: LoginCredentials): Promise<void> {
    await this.submitEmail(credentials.email);
    await this.submitPassword(credentials.password);

    const errorIndicator = this.page.locator('[data-testid="login-error"]');
    await expect(errorIndicator).toBeVisible({ timeout: 5000 });
    await expect(this.page).toHaveURL(/.*\/login.*/);
  }
}

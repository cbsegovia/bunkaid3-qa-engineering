/**
 * KATA Architecture - UI Auth Setup
 *
 * Authenticates via the login page UI (email -> password -> signin) and
 * intercepts the bearer session token using page.waitForResponse() - single
 * authentication, no separate API call.
 *
 * This provides BOTH:
 * - Browser session (storageState) for UI tests
 * - API token (intercepted) for API calls within E2E tests
 *
 * Dependencies: global-setup
 * Dependents: e2e
 */

import type { ApiState } from '@data/types';
import type { SigninResponse } from '@schemas/auth.types';

import { writeFileSync } from 'node:fs';
import { test as setup } from '@TestFixture';
import { attachRequestResponseToAllure } from '@utils/allure';
import { config } from '@variables';

const storageStateFile = config.auth.storageStatePath;
const apiStateFile = config.auth.apiStatePath;

/**
 * UI Authentication Setup
 *
 * 1. Navigates to login page (via LoginPage.goto())
 * 2. Sets up response interception BEFORE triggering login
 * 3. Uses LoginPage.loginSuccessfully() ATC (triggers login + token fetch)
 * 4. Captures JWT token from intercepted response
 * 5. Saves storageState (cookies) for UI tests
 * 6. Saves api-state (token) for API integration
 */
setup('UI Setup: authenticate via UI', async ({ ui, page }) => {
  console.log('[UI Setup] Starting UI authentication...');
  console.log('[UI Setup] Target: /login');

  // Navigate to login page (outside of ATC)
  await ui.login.goto();

  // Credentials for login
  const credentials = {
    email: config.testUser.email,
    password: config.testUser.password,
  };

  // Set up response interception BEFORE triggering login
  // The login UI calls POST /v1/auth/signin (last step of the real 4-step
  // flow — check-email happens first but carries no token)
  const tokenPromise = page.waitForResponse(
    resp => resp.url().includes(config.auth.tokenEndpoint)
      && resp.request().method() === 'POST'
      && resp.status() === 200,
    { timeout: 30000 },
  );

  // Use LoginPage ATC - triggers the email->password->signin sequence
  await ui.login.loginSuccessfully(credentials);
  console.log('[UI Setup] UI login successful');

  // Capture the response body — the browser session itself lives in cookies
  // (captured via storageState below); the PAT is what any in-test API call
  // needs for its Bearer header (session.access_token is rejected by the
  // API — see the note on AuthApi.authenticateSuccessfully).
  console.log('[UI Setup] Intercepting signin response...');
  const response = await tokenPromise;
  const body = (await response.json()) as SigninResponse;
  const { pat } = body;

  // Attach to Allure for debugging
  await attachRequestResponseToAllure({
    url: response.url(),
    method: 'POST',
    responseBody: body,
    requestBody: { email: credentials.email, password: '***' },
  });

  // Verify a PAT was obtained
  if (!pat?.token) {
    throw new Error('Signin response missing pat.token');
  }

  console.log('[UI Setup] Session intercepted successfully');

  // Save storage state (cookies + localStorage) for UI tests
  await page.context().storageState({ path: storageStateFile });
  console.log(`[UI Setup] Storage state saved to ${storageStateFile}`);

  // Save the PAT for API calls within E2E tests
  const apiState: ApiState = {
    token: pat.token,
    tokenType: 'Bearer',
    expiresIn: config.auth.tokenLifetimeSeconds,
    refreshToken: null, // PATs don't refresh — re-run the UI setup to mint a new one
    source: 'ui-login',
    createdAt: new Date().toISOString(),
  };

  writeFileSync(apiStateFile, JSON.stringify(apiState, null, 2));
  console.log(`[UI Setup] API token saved to ${apiStateFile}`);

  console.log('[UI Setup] Authentication successful');
  console.log(`[UI Setup] Current URL: ${page.url()}`);
});

/**
 * KATA Architecture - User Session Integration Tests
 *
 * Tests for authenticated user session via API.
 * Validates that token propagation works correctly.
 *
 * Project: integration (depends on api-setup)
 */

import { config, expect, test } from '@TestFixture';

test.describe('BK-100: User Session API', { tag: ['@critical'] }, () => {
  /**
   * Validates that the auth token is automatically loaded from api-state.json
   * and can be used to make authenticated API calls.
   */
  test('BK-100: should get current user with valid session', async ({ api }) => {
    // The token is automatically loaded from api-state.json by ApiFixture
    // Use helper (not ATC) — this is a read-only verification
    const [response, meData] = await api.auth.getCurrentUser();

    // Test-level assertions (real /api/v1/me shape — no `name` field)
    expect(response.status()).toBe(200);
    expect(meData.user).toBeDefined();
    expect(meData.user.id).toBeDefined();
    expect(meData.user.email).toBeDefined();
    expect(meData.auth.source).toMatch(/^(cookie|bearer)$/);
    expect(Array.isArray(meData.workspaces)).toBe(true);
  });

  /**
   * Validates that unauthenticated requests are rejected.
   * Uses the helper directly with token cleared.
   */
  test('BK-100: should fail without token', async ({ api }) => {
    // Temporarily clear token to test unauthorized access
    api.clearAuthToken();

    const [response] = await api.auth.getCurrentUser();

    // Test-level assertions — no session should exist
    expect(response.status()).toBe(401);
    expect(response.ok()).toBe(false);
  });

  /**
   * Validates that we can re-authenticate and get a new session.
   * This tests the runtime re-auth capability (per-run mint, no auto-refresh).
   */
  test('BK-100: should be able to re-authenticate', async ({ api }) => {
    // Clear existing token
    api.clearAuthToken();

    // Re-authenticate using the ATC
    const credentials = {
      email: config.testUser.email,
      password: config.testUser.password,
    };

    const [response, body] = await api.auth.authenticateSuccessfully(credentials);

    // Verify new session was obtained and set
    expect(response.status()).toBe(200);
    expect(body.session.access_token).toBeDefined();
  });
});

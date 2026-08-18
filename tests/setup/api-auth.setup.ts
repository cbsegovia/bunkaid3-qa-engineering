/**
 * KATA Architecture - API Auth Setup (Project)
 *
 * Authenticates via API directly using AuthApi.authenticateSuccessfully() ATC.
 * Generates a JWT token for use by Integration tests.
 *
 * Dependencies: global-setup
 * Dependents: integration
 */

import type { ApiState } from '@data/types';

import { writeFileSync } from 'node:fs';
import { test as setup } from '@TestFixture';
import { attachRequestResponseToAllure } from '@utils/allure';
import { config } from '@variables';

const apiStateFile = config.auth.apiStatePath;

/**
 * API Authentication Setup
 *
 * 1. Uses AuthApi.authenticateSuccessfully() ATC
 * 2. Saves token to api-state.json for integration tests
 */
setup('API Setup: authenticate via API', async ({ api }) => {
  console.log('[API Setup] Starting API authentication...');
  console.log(`[API Setup] Target: ${config.apiUrl}${config.auth.signinEndpoint}`);

  // Use AuthApi ATC — Bunkai's `signin` field is 'email' too, but the
  // response is nested under `session` (cookie-session flow, not flat JWT)
  const credentials = {
    email: config.testUser.email,
    password: config.testUser.password,
  };
  const [response, body] = await api.auth.authenticateSuccessfully(credentials);
  // The PAT (not session.access_token) is what authenticates over Bearer — see
  // the note on AuthApi.authenticateSuccessfully for why.
  const { pat } = body;

  // Attach to Allure for debugging
  await attachRequestResponseToAllure({
    url: response.url(),
    method: 'POST',
    responseBody: body,
    requestBody: { email: credentials.email, password: '***' },
  });

  console.log('[API Setup] Authentication successful');
  console.log(`[API Setup] PAT scopes: ${pat.scopes.join(', ')}`);

  // Save token to file for use by integration tests
  const apiState: ApiState = {
    token: pat.token,
    tokenType: 'Bearer',
    expiresIn: config.auth.tokenLifetimeSeconds,
    refreshToken: null, // PATs don't refresh — re-run signin to mint a new one
    source: 'api-login',
    createdAt: new Date().toISOString(),
  };

  writeFileSync(apiStateFile, JSON.stringify(apiState, null, 2));
  console.log(`[API Setup] Token saved to ${apiStateFile}`);
});

/**
 * KATA Architecture - Layer 3: User Story API Component
 *
 * API component for reading User Stories — the entity BK-45/BK-50's
 * traceability chain is anchored to.
 *
 * ATCs follow flow-based design: each ATC is an ACTION + VERIFICATION.
 *
 * NOTE: `@atc('BK-105'/'BK-106')` below are PLACEHOLDER IDs — no real Jira
 * Test issue exists yet for these flows. Run `/test-documentation` to
 * create the real BK Test issues before treating this suite as
 * regression-complete (CLAUDE.md Rule #12).
 *
 * Endpoints (confirmed against the synced OpenAPI contract):
 * - GET /api/v1/user-stories/{id}          - read a single User Story
 * - GET /api/v1/modules/{id}/user-stories  - list a Module's User Stories
 */

import type { APIResponse } from '@playwright/test';
import type { ErrorEnvelope } from '@schemas/auth.types';
import type { GetUserStoryResponse, ListUserStoriesResponse } from '@schemas/userStory.types';
import type { TestContextOptions } from '@TestContext';

import { ApiBase } from '@api/ApiBase';
import { expect } from '@playwright/test';
import { atc, step } from '@utils/decorators';

// Re-export types for consumers that import from UserStoryApi
export type { ErrorEnvelope } from '@schemas/auth.types';
export type { GetUserStoryResponse, ListUserStoriesResponse } from '@schemas/userStory.types';

// ============================================
// User Story API Component
// ============================================

export class UserStoryApi extends ApiBase {
  constructor(options: TestContextOptions) {
    super(options);
  }

  // ============================================
  // Helpers - Read-only operations (no @atc)
  // ============================================

  /**
   * Helper: list a Module's User Stories, unauthenticated result not verified here.
   * Used to discover a real `userStoryId` for downstream ATCs/tests.
   */
  @step
  async listUserStories(moduleId: string): Promise<[APIResponse, ListUserStoriesResponse]> {
    const [response, body] = await this.apiGET<ListUserStoriesResponse>(`/v1/modules/${moduleId}/user-stories`);
    return [response, body];
  }

  // ============================================
  // ATCs - Complete Test Cases (ACTION + VERIFICATION)
  // ============================================

  /**
   * ATC: Read an existing User Story - expects success (200)
   *
   * @param userStoryId - a User Story the caller's workspace owns
   */
  @atc('BK-105')
  async getUserStorySuccessfully(userStoryId: string): Promise<[APIResponse, GetUserStoryResponse]> {
    const [response, body] = await this.apiGET<GetUserStoryResponse>(`/v1/user-stories/${userStoryId}`);

    expect(response.status()).toBe(200);
    expect(body.user_story).toBeDefined();
    expect(body.user_story.id).toBe(userStoryId);

    return [response, body];
  }

  /**
   * ATC: Read a User Story that does not exist (or is outside the caller's
   * workspace) - expects the uniform non-disclosing 404
   *
   * @param userStoryId - a well-formed UUID not owned by the caller
   */
  @atc('BK-106')
  async getUserStoryNotFound(userStoryId: string): Promise<[APIResponse, ErrorEnvelope]> {
    const [response, body] = await this.apiGET<ErrorEnvelope>(`/v1/user-stories/${userStoryId}`);

    expect(response.status()).toBe(404);
    expect(body.error.code).toBe('not_found');

    return [response, body];
  }
}

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
import type { GetUserStoryResponse, ListUserStoriesResponse, UpdateUserStoryPayload, UpdateUserStoryResponse } from '@schemas/userStory.types';
import type { TestContextOptions } from '@TestContext';

import { ApiBase } from '@api/ApiBase';
import { expect } from '@playwright/test';
import { atc, step } from '@utils/decorators';

// Re-export types for consumers that import from UserStoryApi
export type { ErrorEnvelope } from '@schemas/auth.types';
export type { GetUserStoryResponse, ListUserStoriesResponse, UpdateUserStoryPayload, UpdateUserStoryResponse } from '@schemas/userStory.types';

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

  /**
   * Helper: read a Story's current title without the fixed assertions
   * `getUserStorySuccessfully` (`@atc('BK-105')`) carries. Used by
   * `mutateStoryTitleAndRestore` below so that reading a title as a
   * precondition never records a BK-105 execution it didn't actually verify.
   *
   * @param storyId - the Story to read
   */
  @step
  async getStory(storyId: string): Promise<[APIResponse, GetUserStoryResponse]> {
    const [response, body] = await this.apiGET<GetUserStoryResponse>(`/v1/user-stories/${storyId}`);
    return [response, body];
  }

  /**
   * Helper: update a Story's title. Deliberately not an `@atc` — BK-50's
   * regression set has no TC for "edit a story"; this exists purely as the
   * mutation lever `mutateStoryTitleAndRestore` needs (see BK-50 spec.md §4).
   *
   * @param args - the Story to update and its new title
   * @param args.storyId - the Story to update
   * @param args.title - the new title
   */
  @step
  async updateStoryTitle(
    args: { storyId: string, title: string },
  ): Promise<[APIResponse, UpdateUserStoryResponse, UpdateUserStoryPayload]> {
    const [response, body, payload] = await this.apiPATCH<UpdateUserStoryResponse, UpdateUserStoryPayload>(
      `/v1/user-stories/${args.storyId}`,
      { title: args.title },
    );
    return [response, body, payload];
  }

  /**
   * Precondition, NOT an ATC: BK-333 needs a story mutated and reliably
   * restored around a caller-supplied action. Renaming a story is a
   * state-changing action, but "rename a story" is not one of BK-50's TCs —
   * it is BK-333's setup — so minting a fake `@atc` for it would pollute
   * the manifest and the traceability report (BK-50 spec.md §4).
   *
   * The restore runs in `finally`, wrapped AROUND the caller's closure —
   * not in the test body and not in `afterEach` — so an assertion failure
   * inside `run()` still leaves this load-bearing BK-45 fixture restored.
   *
   * @param args - the Story to mutate, its temporary title, and the closure to run while mutated
   * @param args.storyId - the Story to mutate
   * @param args.mutatedTitle - the temporary title to apply
   * @param args.run - the action to perform while the title is mutated
   */
  async mutateStoryTitleAndRestore(
    args: { storyId: string, mutatedTitle: string, run: () => Promise<void> },
  ): Promise<void> {
    const [, original] = await this.getStory(args.storyId);
    const originalTitle = original.user_story.title;

    await this.updateStoryTitle({ storyId: args.storyId, title: args.mutatedTitle });

    try {
      await args.run();
    }
    finally {
      await this.updateStoryTitle({ storyId: args.storyId, title: originalTitle });
    }
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

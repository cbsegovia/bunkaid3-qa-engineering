/**
 * KATA Architecture - Traceability Access Integration Tests
 *
 * Smoke coverage for TraceabilityApi / UserStoryApi — the negative,
 * non-disclosure paths only (BK-45/BK-329 rulings). The QA account wired in
 * /adapt-framework Phase 5 has no workspace membership yet (tracked gap —
 * see .context/reports/adapt-framework-plan.md), so the HAPPY-path ATCs
 * (getUserStorySuccessfully, getStoryChainSuccessfully) cannot be exercised
 * live until an admin invites it to the Bunkai workspace. The uniform-404
 * non-disclosure behavior these tests assert does NOT depend on workspace
 * membership — a random UUID is "not found" for any caller — so it is real
 * coverage today, not a placeholder.
 *
 * Project: integration (depends on api-setup)
 */

import { faker } from '@faker-js/faker';
import { test } from '@TestFixture';

test.describe('BK-45: Traceability & User Story access', { tag: ['@critical'] }, () => {
  test('BK-45: should return uniform not_found for a nonexistent user story', async ({ api }) => {
    await api.userStory.getUserStoryNotFound(faker.string.uuid());
  });

  test('BK-45: should return uniform not_found for a mismatched project/story pair', async ({ api }) => {
    await api.traceability.expectMismatchedPairNotFound({
      projectId: faker.string.uuid(),
      userStoryId: faker.string.uuid(),
    });
  });

  test('BK-45: should reject an unauthenticated traceability request with 401', async ({ api }) => {
    await api.traceability.expectUnauthenticatedRejection({
      projectId: faker.string.uuid(),
      userStoryId: faker.string.uuid(),
    });
  });
});

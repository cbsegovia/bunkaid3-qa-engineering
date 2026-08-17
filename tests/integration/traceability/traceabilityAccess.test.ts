/**
 * KATA Architecture - BK-50 Traceability Access Integration Test
 *
 * TC05 (BK-335): the API path is the one an attacker would actually take —
 * a page-level redirect (BK-334, e2e) and a route-level 401 are enforced by
 * different layers, so AC E2 requires both to be tested independently.
 *
 * Project: integration (depends on api-setup — no browser cookies, isolates
 * the negative-auth assertion from the `test:smoke` cookie leak noted in
 * .context/reports/adapt-framework-plan.md's Known gaps).
 */

import { faker } from '@faker-js/faker';
import { test } from '@TestFixture';

test.describe('BK-50: Traceability export - unauthenticated access', { tag: ['@critical'] }, () => {
  test('BK-50: should reject the traceability request with 401 given an unauthenticated API caller', async ({ api }) => {
    await api.traceability.expectUnauthenticatedRejection({
      projectId: faker.string.uuid(),
      userStoryId: faker.string.uuid(),
    });
  });
});

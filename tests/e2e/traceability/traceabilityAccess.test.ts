/**
 * KATA Architecture - BK-50 Traceability Screen Access Tests
 *
 * TC04 (BK-334) and TC06 (BK-336) are split away from the export flow
 * because neither exports anything — one is an auth gate, the other a
 * scope guard. Grouping them with the export tests would make the file
 * name a lie (BK-50 spec.md §5).
 *
 * KNOWN GAPS — neither TC can run live yet:
 * - TC06 (BK-336): the staging QA account
 *   (`bunkai-staging-qa3@olkacoraug.resend.app`, minted by /adapt-framework)
 *   authenticates but has no workspace membership (`workspaces: []`), so it
 *   cannot view any real chain. See
 *   .context/reports/adapt-framework-plan.md "Known gaps" #1.
 * - TC04 (BK-334): tried live against a placeholder project/story path
 *   (`bk-45-fixtures` / `full-5-layer-evidence-chain`, since the account
 *   cannot discover a real one either) and it did NOT redirect — the page
 *   stayed on the traceability URL for the full 10s wait. That is
 *   inconclusive, not a confirmed defect: a placeholder path may 404/error
 *   through a different code path than the auth guard TC04 actually tests.
 *   Re-run against a REAL project/story once workspace access is granted
 *   before trusting this ATC either way.
 *
 * Project: e2e (depends on ui-setup)
 */

import { test } from '@TestFixture';

// TODO(BK-50): once the QA account is invited to a workspace, resolve
// these from the BK-45 fixture set on staging ("bk-45-fixtures" module,
// "full 5-layer evidence chain" story) instead of a placeholder — see
// BK-50 spec.md §6 (Discover strategy: never hardcode the UUID).
const FIXTURE_PROJECT_SLUG = 'bk-45-fixtures';
const FIXTURE_STORY_ID = 'full-5-layer-evidence-chain';

test.describe('BK-50: Traceability screen access', () => {
  // BLOCKED — see file header: inconclusive against a placeholder path,
  // needs a real project/story to trust either a pass or a fail.
  test('BK-50: should redirect an unauthenticated browser to login without rendering data', { tag: ['@critical', '@security'] }, async ({ ui }) => {
    await ui.traceability.expectAnonymousRedirectToLogin(
      `/projects/${FIXTURE_PROJECT_SLUG}/traceability?story=${FIXTURE_STORY_ID}`,
    );
  });

  // BLOCKED — needs workspace membership to view a real chain. Written and
  // type/lint-clean; run once the QA account has an invite (see file header).
  test('BK-50: should expose no hosted artifact, public link or share control anywhere on the traceability screen', { tag: ['@security'] }, async ({ ui }) => {
    await ui.traceability.goto({ projectSlug: FIXTURE_PROJECT_SLUG, userStoryId: FIXTURE_STORY_ID });
    await ui.traceability.expectNoShareAffordance();
  });
});

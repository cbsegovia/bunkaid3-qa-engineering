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
 * - TC04 (BK-334): previously tried live against a placeholder project/story
 *   path (`bk-45-fixtures` / `full-5-layer-evidence-chain`) and did NOT
 *   redirect — inconclusive against a placeholder, since a bad path may
 *   404/error through a different code path than the auth guard TC04
 *   actually tests. The constants below are now the REAL project slug +
 *   story UUID (fixed 2026-08-19) — re-run against these before trusting
 *   this ATC either way.
 *
 * Project: e2e (depends on ui-setup)
 */

import { test } from '@TestFixture';

// BK-50: resolved to the real BK-45 fixture on staging — "bk-45-fixtures"
// is a MODULE inside the "bk-23-test-project" project, not a project slug
// of its own, and the story is addressed by UUID, not by its title slug.
// Verified live 2026-08-19: /projects/bk-23-test-project/traceability?story=<uuid>
// renders the chain with the "Export snapshot" control present.
const FIXTURE_PROJECT_SLUG = 'bk-23-test-project';
const FIXTURE_STORY_ID = 'd57804e8-d614-445e-b707-8c25d9ca5dac';

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

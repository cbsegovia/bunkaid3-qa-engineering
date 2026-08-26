/**
 * KATA Architecture - BK-266 Sidebar Create Affordance Test
 *
 * TC10 (BK-615) — the "New project" control in the left navigation opens
 * the dedicated create route directly, never the index.
 *
 * Project: e2e (depends on ui-setup)
 */

import { test } from '@TestFixture';

test.describe('BK-266: Sidebar create-project affordance', { tag: ['@critical'] }, () => {
  test('BK-266: should open the dedicated create route from the left-navigation control', async ({ ui }) => {
    await ui.projects.open();
    await ui.projects.newProjectNavControlOpensCreateRoute();
  });
});

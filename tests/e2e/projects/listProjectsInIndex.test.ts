/**
 * KATA Architecture - BK-266 Projects Index Listing Tests
 *
 * TC01 (BK-604), TC02 (BK-605, BVA lower boundary) and TC04 (BK-607,
 * Scenario Outline) — the index's read side. Precondition projects are
 * seeded via `api.projects.createProjectSuccessfully` (real endpoint the
 * product's own create form calls) so the list content is deterministic
 * and independent of any prior test's state.
 *
 * Project: e2e (depends on ui-setup)
 */

import { expect, test } from '@TestFixture';

test.describe('BK-266: Projects index listing', { tag: ['@critical'] }, () => {
  test('BK-266: should list all projects oldest-first with name and slug given the active workspace has projects', async ({ test: fixture }) => {
    const { ui, api } = fixture;

    const [, me] = await api.auth.getCurrentUser();
    const workspaceId = me.active_workspace_id;
    expect(workspaceId).toBeTruthy();

    const seeded = [
      ui.data.createProject(),
      ui.data.createProject(),
      ui.data.createProject(),
    ];
    const expected = [];
    for (const project of seeded) {
      const [, body] = await api.projects.createProjectSuccessfully(workspaceId!, project);
      expected.push({ name: body.project.name, slug: body.project.slug });
    }

    await ui.projects.open();
    await ui.projects.listProjectsOldestFirstWithNameAndSlug(expected);
  });

  test('BK-266: should list a single project correctly at the one-project lower boundary', async ({ test: fixture }) => {
    const { ui, api } = fixture;

    const [, me] = await api.auth.getCurrentUser();
    const workspaceId = me.active_workspace_id;
    expect(workspaceId).toBeTruthy();

    const project = ui.data.createProject();
    const [, body] = await api.projects.createProjectSuccessfully(workspaceId!, project);

    await ui.projects.open();
    await ui.projects.listSingleProjectAtLowerBoundary({ name: body.project.name, slug: body.project.slug });
  });

  test('BK-266: should show the description when the author wrote one and omit it cleanly when absent', async ({ test: fixture }) => {
    const { ui, api } = fixture;

    const [, me] = await api.auth.getCurrentUser();
    const workspaceId = me.active_workspace_id;
    expect(workspaceId).toBeTruthy();

    const withDescription = ui.data.createProject({ description: 'Guest and returning-customer purchase paths' });
    const withoutDescription = ui.data.createProject();

    const [, described] = await api.projects.createProjectSuccessfully(workspaceId!, withDescription);
    const [, plain] = await api.projects.createProjectSuccessfully(workspaceId!, withoutDescription);

    await ui.projects.open();

    // Scenario Outline — same @atc('BK-607'), one call per Examples row.
    await ui.projects.showsDescriptionWhenPresentOmitsWhenAbsent({
      slug: described.project.slug,
      description: withDescription.description!,
    });
    await ui.projects.showsDescriptionWhenPresentOmitsWhenAbsent({
      slug: plain.project.slug,
      description: null,
    });
  });
});

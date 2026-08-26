/**
 * KATA Architecture - Layer 3: Projects Page Component
 *
 * UI component for BK-266 — the workspace Projects index (`/projects`) and
 * its dedicated create route (`/projects/new`).
 *
 * Locators (data-testid, confirmed against app/(app)/projects/page.tsx and
 * create-project-form.tsx on origin/staging):
 * - Index list:        [data-testid="projects-list"]
 * - Index entry:       [data-testid="projects-list-item-{slug}"]
 * - Empty state:       [data-testid="projects-empty"] / "projects-empty-create"
 * - Create form:       [data-testid="create-project-form"]
 * - Name input:        [data-testid="create-project-name"]
 * - Name error:        [data-testid="create-project-name-hint"]
 * - Description:       [data-testid="create-project-description"]
 * - Server error:      [data-testid="create-project-error"]
 * - Submit:            [data-testid="create-project-submit"]
 *
 * The sidebar "New project" control (components/layout/AppSidebar.tsx) has
 * NO data-testid — it's a bare `<Link href="/projects/new" title="New
 * project">`. Located by accessible name below, not a fabricated testid.
 */

import type { TestContextOptions } from '@TestContext';

import { expect } from '@playwright/test';
import { UiBase } from '@ui/UiBase';
import { atc, step } from '@utils/decorators';

// ============================================
// Types
// ============================================

export interface ProjectListEntry {
  name: string
  slug: string
}

export interface ProjectDescriptionRow {
  slug: string
  description: string | null
}

// ============================================
// Projects Page Component
// ============================================

export class ProjectsPage extends UiBase {
  constructor(options: TestContextOptions) {
    super(options);
  }

  // ============================================
  // Navigation (Public)
  // ============================================

  /**
   * Navigate to the Projects index. Call before any index-reading ATC.
   */
  @step
  async open(): Promise<void> {
    await this.page.goto(this.buildUrl('/projects'));
  }

  // ============================================
  // Helpers (Private)
  // ============================================

  private listItem(slug: string) {
    return this.page.locator(`[data-testid="projects-list-item-${slug}"]`);
  }

  // ============================================
  // ATCs - Complete Test Cases
  // ============================================

  /**
   * ATC: A workspace with projects lists them all, oldest first, with name
   * and slug — and the create form is not what greets the member.
   *
   * Staging is a SHARED workspace that already carries projects from other
   * test runs, so this asserts the seeded projects' relative order and
   * content among however many entries exist — not the list's total count
   * (that would make the ATC flaky against a workspace this session doesn't
   * own exclusively).
   *
   * @param expected - the seeded projects, already in oldest-first order
   */
  @atc('BK-604')
  async listProjectsOldestFirstWithNameAndSlug(expected: ProjectListEntry[]): Promise<void> {
    const list = this.page.locator('[data-testid="projects-list"]');
    await expect(list).toBeVisible();

    const items = list.locator('li');
    const testIds = await items.evaluateAll(nodes =>
      nodes.map(node => node.querySelector('[data-testid^="projects-list-item-"]')?.getAttribute('data-testid') ?? null));

    let previousIndex = -1;
    for (const project of expected) {
      const item = this.listItem(project.slug);
      await expect(item).toContainText(project.name);
      await expect(item).toContainText(project.slug);

      const resolvedIndex = testIds.indexOf(`projects-list-item-${project.slug}`);
      expect(resolvedIndex).toBeGreaterThan(previousIndex);
      previousIndex = resolvedIndex;
    }

    await expect(this.page.locator('[data-testid="create-project-form"]')).toHaveCount(0);
  }

  /**
   * ATC: a freshly seeded project renders correctly on the index — name,
   * slug, no empty/bare-form state around it.
   *
   * NOTE — BVA scope: BK-605's Jira TC is titled around the "exactly one
   * project" lower boundary, but staging is a shared workspace that already
   * carries projects seeded by other sessions/runs (never truly empty), so
   * the literal zero-then-one boundary cannot be exercised here — the same
   * class of environment gap already documented for BK-266's TC05/10/11
   * (`.context/PBI/.../acceptance-test-results.md`). This ATC instead
   * regression-guards that a single newly added project is never lost or
   * misrendered among however many others already exist.
   *
   * @param expected - the single freshly seeded project
   */
  @atc('BK-605')
  async listSingleProjectAtLowerBoundary(expected: ProjectListEntry): Promise<void> {
    const list = this.page.locator('[data-testid="projects-list"]');
    await expect(list).toBeVisible();

    const item = this.listItem(expected.slug);
    await expect(item).toContainText(expected.name);
    await expect(item).toContainText(expected.slug);
  }

  /**
   * ATC: Activating an index entry navigates to that exact project.
   *
   * @param slug - slug of the project entry to activate
   */
  @atc('BK-606')
  async activateProjectEntryNavigatesToProject(slug: string): Promise<void> {
    await this.listItem(slug).click();
    await this.page.waitForURL(`**/projects/${slug}`);
    await expect(this.page).toHaveURL(new RegExp(`/projects/${slug}$`));
  }

  /**
   * ATC: A project's description shows when the author wrote one, and is
   * cleanly omitted (no empty line) when absent. Scenario Outline (BK-607) —
   * call once per row; both rows share this same `@atc` id.
   *
   * @param row - one Examples row: the project's slug and its description (or null)
   */
  @atc('BK-607')
  async showsDescriptionWhenPresentOmitsWhenAbsent(row: ProjectDescriptionRow): Promise<void> {
    const item = this.listItem(row.slug);
    await expect(item).toBeVisible();

    if (row.description !== null) {
      await expect(item).toContainText(row.description);
    }
    else {
      // BR-7 — absent means no empty description line, not blank text.
      const paragraphs = item.locator('p');
      const texts = await paragraphs.allTextContents();
      expect(texts.every(text => text.trim().length > 0)).toBe(true);
    }
  }

  /**
   * ATC: Creating a project from the dedicated route lands the member on
   * that new project's own screen, and it then shows back on the index.
   *
   * @param name - the project name to create
   */
  @atc('BK-609')
  async createProjectFromDedicatedRouteLandsOnProject(name: string): Promise<string> {
    await this.page.goto(this.buildUrl('/projects/new'));
    await this.page.locator('[data-testid="create-project-name"]').fill(name);
    await this.page.locator('[data-testid="create-project-submit"]').click();

    // `/\/projects\/[^/]+$/` alone would also match the starting `/projects/new`
    // route itself — exclude it explicitly so the wait only resolves once the
    // redirect to the newly created project's own slug has actually happened.
    await this.page.waitForURL(url => url.pathname.startsWith('/projects/') && url.pathname !== '/projects/new');
    const slug = this.page.url().split('/projects/')[1];
    expect(slug).toBeTruthy();

    await this.open();
    await expect(this.listItem(slug)).toContainText(name);

    return slug;
  }

  /**
   * ATC: A name of two characters is rejected on the dedicated route — the
   * member is told why, no project is created, and what they typed stays.
   *
   * Validation is live client-side (confirmed on staging, BK-266 ATR): the
   * Create button stays DISABLED for a too-short name rather than accepting
   * a click and then erroring, so there is no submit step here — the
   * rejection is the disabled state + hint, not a post-submit error.
   *
   * @param name - a name shorter than the 3-character minimum
   */
  @atc('BK-610')
  async rejectsShortNameAndPreservesInput(name: string): Promise<void> {
    await this.page.goto(this.buildUrl('/projects/new'));
    const nameInput = this.page.locator('[data-testid="create-project-name"]');
    await nameInput.fill(name);

    await expect(this.page.locator('[data-testid="create-project-name-hint"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="create-project-submit"]')).toBeDisabled();
    await expect(nameInput).toHaveValue(name);
    await expect(this.page).toHaveURL(/\/projects\/new$/);
  }

  /**
   * ATC: BVA valid boundary paired with BK-610 — exactly three characters
   * clears the length error and the form is ready to submit.
   *
   * @param name - a name exactly at the 3-character minimum
   */
  @atc('BK-611')
  async acceptsThreeCharacterBoundaryName(name: string): Promise<void> {
    await this.page.goto(this.buildUrl('/projects/new'));
    const nameInput = this.page.locator('[data-testid="create-project-name"]');
    await nameInput.fill(name);

    await expect(this.page.locator('[data-testid="create-project-name-hint"]')).toHaveCount(0);
    await expect(this.page.locator('[data-testid="create-project-submit"]')).toBeEnabled();
  }

  /**
   * ATC: A duplicate name is refused with the exact copy the product uses
   * today, and no second project is created.
   *
   * @param name - a name that already exists in the active workspace
   */
  @atc('BK-612')
  async refusesDuplicateProjectName(name: string): Promise<void> {
    await this.page.goto(this.buildUrl('/projects/new'));
    await this.page.locator('[data-testid="create-project-name"]').fill(name);
    await this.page.locator('[data-testid="create-project-submit"]').click();

    await expect(this.page.locator('[data-testid="create-project-error"]'))
      .toContainText('A project with this name already exists here.');
    await expect(this.page).toHaveURL(/\/projects\/new$/);
  }

  /**
   * ATC: The "New project" control in the left navigation opens the
   * dedicated create route directly — never the index.
   */
  @atc('BK-615')
  async newProjectNavControlOpensCreateRoute(): Promise<void> {
    await this.page.getByTitle('New project').click();
    await expect(this.page).toHaveURL(/\/projects\/new$/);
  }
}

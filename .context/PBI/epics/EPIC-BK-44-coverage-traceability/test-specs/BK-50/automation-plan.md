# BK-50 — Automation Plan (Phase 2 build order)

Companion to `spec.md`. This is the file the Code phase executes against, once `/adapt-framework` has cleared the §0 blocker.

## Build order

Ordered so that each step is verifiable on its own and the riskiest work lands last.

| # | Step | Verify |
|---|---|---|
| 1 | `TraceabilityApi` + `expectUnauthenticatedRejection` (`@atc('BK-335')`) | `bun run test tests/integration/traceability/traceabilityAccess.test.ts` green |
| 2 | `TraceabilityPage.goto` + `expectAnonymousRedirectToLogin` (`@atc('BK-334')`) | e2e access test green |
| 3 | `TraceabilityPage.expectNoShareAffordance` (`@atc('BK-336')`) | same file green |
| 4 | `TraceabilityPage.exportSnapshot` (`@atc('BK-331')`) | export test green; saved file exists on disk |
| 5 | `SnapshotDocumentPage.openOffline` (`@atc('BK-332')`) | external request count asserted `0` |
| 6 | `UserStoriesApi` + `TraceabilitySteps.mutateStoryTitleAndRestore` + `SnapshotDocumentPage.expectSnapshotUnchangedAfterMutation` (`@atc('BK-333')`) | immutability test green **and** the story title verified restored afterwards |
| 7 | Register components in `ApiFixture` / `UiFixture` / `StepsFixture` | `bun run types:check` clean |
| 8 | `bun run kata:manifest` + `git add kata-manifest.json` | `bun run kata:manifest:check` clean |

Steps 1-3 need no fixture data beyond a known URL, which is why they lead. Step 6 is last because it is the only one that writes to staging.

## Fixture registration

```
UiFixture     += traceability: TraceabilityPage
              += snapshot:     SnapshotDocumentPage
ApiFixture    += traceability: TraceabilityApi
              += userStories:  UserStoriesApi
StepsFixture  += traceability: TraceabilitySteps
```

## ATC → TC mapping

| `@atc` | Jira TC | Component |
|---|---|---|
| `BK-331` | BK-331 TC01 | `TraceabilityPage.exportSnapshot` |
| `BK-332` | BK-332 TC02 | `SnapshotDocumentPage.openOffline` |
| `BK-333` | BK-333 TC03 | `SnapshotDocumentPage.expectSnapshotUnchangedAfterMutation` |
| `BK-334` | BK-334 TC04 | `TraceabilityPage.expectAnonymousRedirectToLogin` |
| `BK-335` | BK-335 TC05 | `TraceabilityApi.expectUnauthenticatedRejection` |
| `BK-336` | BK-336 TC06 | `TraceabilityPage.expectNoShareAffordance` |

Every `@atc` string maps 1:1 to a real Jira `Test` issue in `Candidate` state — no invented IDs.

## Signature sketches

Kept to signatures rather than bodies: the bodies depend on selectors and endpoints that `/adapt-framework` will settle, and writing them now would bake in assumptions the exploratory session made against a hand-authenticated browser.

```ts
// tests/components/ui/TraceabilityPage.ts
export class TraceabilityPage extends UiBase {
  @step async goto(args: { projectSlug: string, storyId: string }): Promise<void>

  @atc('BK-331') async exportSnapshot(saveTo: string): Promise<string>
  @atc('BK-334') async expectAnonymousRedirectToLogin(path: string): Promise<void>
  @atc('BK-336') async expectNoShareAffordance(): Promise<void>
}

// tests/components/ui/SnapshotDocumentPage.ts
export class SnapshotDocumentPage extends UiBase {
  @step async readStoryTitle(filePath: string): Promise<string>

  @atc('BK-332') async openOffline(filePath: string): Promise<void>
  @atc('BK-333') async expectSnapshotUnchangedAfterMutation(
    args: { snapshotPath: string, expectedTitle: string },
  ): Promise<void>
}

// tests/components/api/TraceabilityApi.ts
export class TraceabilityApi extends ApiBase {
  @step async getStoryChain(args: { projectId: string, storyId: string }): Promise<[APIResponse, StoryChain]>

  @atc('BK-335') async expectUnauthenticatedRejection(
    args: { projectId: string, storyId: string },
  ): Promise<void>
}

// tests/components/api/UserStoriesApi.ts
export class UserStoriesApi extends ApiBase {
  @step async getStory(storyId: string): Promise<[APIResponse, UserStory]>
  @step async updateStoryTitle(args: { storyId: string, title: string }): Promise<[APIResponse, UserStory]>
}

// tests/components/steps/TraceabilitySteps.ts  — no @atc, Steps are not test cases
export class TraceabilitySteps extends TestContext {
  async mutateStoryTitleAndRestore(args: {
    storyId: string
    mutatedTitle: string
    run: () => Promise<void>
  }): Promise<void>
}
```

All object parameters — no signature carries more than two positional arguments, and most carry zero.

## KATA compliance notes for the Code phase

- **Locators inline.** The export button, the share-affordance absence check and the chain rows all live in `TraceabilityPage`. Extract to a `private readonly` arrow only if a selector reaches two uses inside the class — do not pre-extract.
- **`exportSnapshot` returns the saved path** so the test can chain it into `SnapshotDocumentPage` without a shared module-level variable.
- **Fixed assertions inside the ATC**: filename pattern (BK-331), external-request count (BK-332), redirect target (BK-334), status code and error envelope (BK-335). Flow-level comparisons — T0 versus T1 content — stay in the test file.
- **No `waitForTimeout`.** Downloads await the `download` event; navigation awaits `waitForURL`.
- **`retries: 0` stays.** If BK-331 or BK-332 flakes, the download handling is wrong; do not paper over it with a retry.

## Definition of done

- [ ] Six ATCs implemented, each matching its Jira TC one-to-one
- [ ] `bun run test` green on both new files, zero retries consumed
- [ ] `bun run types:check` clean
- [ ] `bun run lint:check` clean
- [ ] Components registered in their fixtures
- [ ] `bun run kata:manifest` regenerated and staged; `kata:manifest:check` clean
- [ ] BK-333 verified to leave the staging fixture's title restored
- [ ] TCs transitioned Candidate → In Automation via `/test-documentation`

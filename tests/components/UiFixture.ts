/**
 * KATA Architecture - Layer 4: UI Fixture
 *
 * Dependency Injection container for all UI components.
 * Provides unified access to UI testing capabilities.
 *
 * All UI components share the same page context from TestContext,
 * ensuring consistent browser state across components.
 *
 * HOW TO ADD NEW UI COMPONENTS:
 * 1. Create your component in tests/components/ui/YourPage.ts
 * 2. Import it here
 * 3. Add as readonly property
 * 4. Initialize in constructor passing the options
 */

import type { TestContextOptions } from '@TestContext';

import { LoginPage } from '@ui/LoginPage';
import { SnapshotDocumentPage } from '@ui/SnapshotDocumentPage';
import { TraceabilityPage } from '@ui/TraceabilityPage';
import { UiBase } from '@ui/UiBase';

// ============================================
// UI Fixture Class
// ============================================

export class UiFixture extends UiBase {
  /** Login page component - handles authentication flows */
  readonly login: LoginPage;

  /** Traceability page component - BK-45 evidence chain view, BK-50 export */
  readonly traceability: TraceabilityPage;

  /** Snapshot document component - the BK-50 exported document itself */
  readonly snapshot: SnapshotDocumentPage;

  constructor(options: TestContextOptions) {
    super(options);

    // All components receive the same options (same page context)
    this.login = new LoginPage(options);
    this.traceability = new TraceabilityPage(options);
    this.snapshot = new SnapshotDocumentPage(options);
  }
}

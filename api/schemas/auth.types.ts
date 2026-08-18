/**
 * KATA Framework - Type Facade: Auth Domain
 *
 * Bunkai TMS auth is a 4-step, cookie-session flow (Supabase SSR) — NOT a
 * single password-form-returns-JWT flow. See config/variables.ts `auth` block
 * for the full sequence. Types below mirror the real OpenAPI contract synced
 * from https://staging-upexbunkai.vercel.app/api/openapi.
 *
 * Consumed by: tests/components/api/AuthApi.ts
 */

import type { components, paths } from '@openapi';

// ============================================================================
// Schema Types (from components.schemas)
// ============================================================================

export type ErrorEnvelope = components['schemas']['ErrorEnvelope'];

// ============================================================================
// Endpoint Types — POST /api/v1/auth/check-email
// ============================================================================

type CheckEmailPath = paths['/api/v1/auth/check-email']['post'];
export type CheckEmailPayload = CheckEmailPath['requestBody']['content']['application/json'];
export type CheckEmailResponse = CheckEmailPath['responses']['200']['content']['application/json'];

// ============================================================================
// Endpoint Types — POST /api/v1/auth/signin
// ============================================================================

type SigninPath = paths['/api/v1/auth/signin']['post'];
export type SigninPayload = SigninPath['requestBody']['content']['application/json'];
export type SigninResponse = SigninPath['responses']['200']['content']['application/json'];

// ============================================================================
// Endpoint Types — POST /api/v1/auth/signup
// ============================================================================

type SignupPath = paths['/api/v1/auth/signup']['post'];
export type SignupPayload = SignupPath['requestBody']['content']['application/json'];
export type SignupResponse = SignupPath['responses']['202']['content']['application/json'];

// ============================================================================
// Endpoint Types — POST /api/v1/auth/confirm (OTP, signup only — never on repeat sign-in)
// ============================================================================

type ConfirmPath = paths['/api/v1/auth/confirm']['post'];
export type ConfirmPayload = ConfirmPath['requestBody']['content']['application/json'];
export type ConfirmResponse = ConfirmPath['responses']['200']['content']['application/json'];

// ============================================================================
// Endpoint Types — GET /api/v1/me
// ============================================================================

type MePath = paths['/api/v1/me']['get'];
export type MeResponse = MePath['responses']['200']['content']['application/json'];

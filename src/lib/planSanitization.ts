/**
 * Plan Sanitization Utility
 * 
 * Centralizes the stripping of sensitive fields from plan data
 * based on collaboration mode. Defense-in-depth: also used server-side
 * in get-plan-for-soft-session edge function.
 */

import { type CollaborationMode } from './collaborationMode';

/** Fields to strip for external/public views */
const SENSITIVE_KEYS = [
  'user_id',
  'owner_id',
  'subscription_tier',
  'subscription_state',
  'subscription_provider',
  'subscription_expires_at',
  'collaborator_list',
  'collaborators',
  'strategic_access_level',
  'strategic_calls_lifetime',
  'strategic_last_call_at',
  'strategic_trial_used',
  'email_domain_type',
  'email_verified_at',
  'grace_ends_at',
  'plan_memory',
];

/**
 * Sanitize plan data based on collaboration mode.
 * 
 * - public_snapshot: returns as-is (already sanitized at share creation time)
 * - external_session: strips sensitive fields, keeps live task state
 * - authenticated: returns full plan unchanged
 */
export function sanitizePlanForMode<T extends Record<string, any>>(
  plan: T,
  mode: CollaborationMode
): T {
  if (mode === 'authenticated' || mode === 'public_snapshot') {
    return plan;
  }

  // external_session: strip sensitive fields
  const sanitized = { ...plan };
  for (const key of SENSITIVE_KEYS) {
    if (key in sanitized) {
      delete (sanitized as any)[key];
    }
  }

  return sanitized;
}

/**
 * Server-side sanitization keys (for edge functions)
 * Exported for use in get-plan-for-soft-session
 */
export const SENSITIVE_PLAN_KEYS = SENSITIVE_KEYS;

/**
 * Subscription Resolver
 * 
 * Server-side helper for resolving effective subscription state.
 * Provides deterministic, read-only resolution of subscription status.
 */

import { type ProductTier } from './subscriptionTiers';

/**
 * Subscription lifecycle states
 */
export type SubscriptionState = 'active' | 'trial' | 'grace' | 'canceled' | 'expired';

/**
 * Profile subscription data input
 */
export interface SubscriptionProfileData {
  subscriptionTier?: string | null;
  subscriptionState?: string | null;
  subscriptionExpiresAt?: string | null;
  graceEndsAt?: string | null;
}

/**
 * Resolved effective subscription
 */
export interface EffectiveSubscription {
  /** User's subscription tier */
  tier: ProductTier;
  /** Current lifecycle state */
  state: SubscriptionState;
  /** Whether this is a paid tier (not standard) */
  isPaid: boolean;
  /** Whether currently in grace period */
  inGrace: boolean;
  /** Whether user can access paid features */
  isActive: boolean;
  /** Days until expiration (null if no expiration or expired) */
  daysRemaining: number | null;
}

/**
 * Resolve effective subscription from profile data
 * 
 * This is a pure, deterministic function that calculates the current
 * subscription status based on stored profile data.
 * 
 * Current behavior (no enforcement):
 * - All paid tiers are considered active
 * - Grace period is tracked but doesn't restrict access
 * - Expiration is tracked but doesn't restrict access
 * 
 * Future enforcement will modify the isActive logic.
 */
export function getEffectiveSubscription(
  profile: SubscriptionProfileData | null | undefined
): EffectiveSubscription {
  // Default values for null/undefined profile
  const tier = ((profile?.subscriptionTier as ProductTier) || 'standard') as ProductTier;
  const state = ((profile?.subscriptionState as SubscriptionState) || 'active') as SubscriptionState;
  const expiresAt = profile?.subscriptionExpiresAt ? new Date(profile.subscriptionExpiresAt) : null;
  const graceEndsAt = profile?.graceEndsAt ? new Date(profile.graceEndsAt) : null;
  const now = new Date();
  
  // Calculate days remaining until expiration
  let daysRemaining: number | null = null;
  if (expiresAt && expiresAt > now) {
    daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }
  
  // Determine if currently in grace period
  const inGrace = state === 'grace' && graceEndsAt !== null && graceEndsAt > now;
  
  // Is this a paid tier?
  const isPaid = tier !== 'standard';
  
  // Can user access paid features?
  // For now, ALL non-standard tiers are active (no enforcement yet)
  // Future: Will check expiration, grace period, canceled state
  const isActive = isPaid;
  
  return {
    tier,
    state,
    isPaid,
    inGrace,
    isActive,
    daysRemaining,
  };
}

/**
 * Check if subscription is in a warning state
 * (grace period or approaching expiration)
 */
export function getSubscriptionWarning(
  effective: EffectiveSubscription
): { type: 'grace' | 'expiring' | null; message: string | null } {
  if (effective.inGrace) {
    return {
      type: 'grace',
      message: 'Payment pending',
    };
  }
  
  // Warn if expiring within 7 days
  if (effective.daysRemaining !== null && effective.daysRemaining <= 7 && effective.daysRemaining > 0) {
    return {
      type: 'expiring',
      message: `Expires in ${effective.daysRemaining} day${effective.daysRemaining === 1 ? '' : 's'}`,
    };
  }
  
  return { type: null, message: null };
}

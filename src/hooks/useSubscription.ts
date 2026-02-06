/**
 * Subscription Hook
 * 
 * Provides comprehensive subscription state using the subscription resolver.
 * Returns effective subscription status with access checking utilities.
 */

import { useAuth } from '@/contexts/AuthContext';
import { 
  ProductTier, 
  SubscriptionState as SubscriptionStateType,
  tierIncludesAccess, 
} from '@/lib/subscriptionTiers';
import { 
  getEffectiveSubscription, 
  getSubscriptionWarning,
  type EffectiveSubscription,
} from '@/lib/subscriptionResolver';

export interface SubscriptionStatus extends EffectiveSubscription {
  /** Check if user has access to a required tier */
  hasAccess: (requiredTier: ProductTier) => boolean;
  /** Loading state while profile is being fetched */
  loading: boolean;
  /** Warning state if subscription needs attention */
  warning: { type: 'grace' | 'expiring' | null; message: string | null };
}

/**
 * Hook to access user's comprehensive subscription state
 * 
 * Returns the full effective subscription including:
 * - tier, state, isPaid, inGrace, isActive, daysRemaining
 * - hasAccess() utility function
 * - warning state for grace period or approaching expiration
 */
export function useSubscription(): SubscriptionStatus {
  const { profile, loading } = useAuth();
  
  // Resolve effective subscription from profile data
  const effective = getEffectiveSubscription(profile ? {
    subscriptionTier: profile.subscriptionTier,
    subscriptionState: profile.subscriptionState,
    subscriptionExpiresAt: profile.subscriptionExpiresAt,
    graceEndsAt: profile.graceEndsAt,
  } : null);
  
  // Get any warning state
  const warning = getSubscriptionWarning(effective);
  
  return {
    ...effective,
    hasAccess: (requiredTier: ProductTier) => 
      effective.isActive && tierIncludesAccess(effective.tier, requiredTier),
    loading,
    warning,
  };
}

/**
 * Check if user should see ads (Standard tier only)
 */
export function useShowAds(): boolean {
  const { tier } = useSubscription();
  return tier === 'standard';
}

/**
 * Hook to check if subscription needs attention
 * Returns true if in grace period or expiring soon
 */
export function useSubscriptionNeedsAttention(): boolean {
  const { warning } = useSubscription();
  return warning.type !== null;
}

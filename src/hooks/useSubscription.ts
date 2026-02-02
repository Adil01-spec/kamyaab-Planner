/**
 * Subscription Hook
 * 
 * Fetches user subscription tier from profile and provides tier utilities.
 * Falls back to 'standard' if no subscription data exists.
 */

import { useAuth } from '@/contexts/AuthContext';
import { ProductTier, tierIncludesAccess, getTierDefinition } from '@/lib/subscriptionTiers';

interface SubscriptionState {
  /** User's current subscription tier */
  tier: ProductTier;
  /** Whether subscription has expired (still grants access until refresh) */
  isExpired: boolean;
  /** Check if user has access to a required tier */
  hasAccess: (requiredTier: ProductTier) => boolean;
  /** Loading state while profile is being fetched */
  loading: boolean;
}

/**
 * Hook to access user's subscription state
 */
export function useSubscription(): SubscriptionState {
  const { profile, loading } = useAuth();
  
  // Get tier from profile, fallback to standard
  const tier: ProductTier = (profile as any)?.subscriptionTier || 'standard';
  const expiresAt = (profile as any)?.subscriptionExpiresAt;
  
  // Check if subscription has expired
  const isExpired = expiresAt ? new Date(expiresAt) < new Date() : false;
  
  // For now, even expired subscriptions maintain access (grace period)
  // In future, this could trigger a renewal prompt
  const effectiveTier = tier;
  
  return {
    tier: effectiveTier,
    isExpired,
    hasAccess: (requiredTier: ProductTier) => tierIncludesAccess(effectiveTier, requiredTier),
    loading,
  };
}

/**
 * Check if user should see ads (Standard tier only)
 */
export function useShowAds(): boolean {
  const { tier } = useSubscription();
  return tier === 'standard';
}

/**
 * Feature Access Hook
 * 
 * Provides feature access checking and interest tracking.
 * Supports 4-tier hierarchy: Standard, Student, Pro, Business
 */

import { useCallback, useEffect, useRef } from 'react';
import { 
  hasFeatureAccess, 
  isProFeature, 
  getUserTier, 
  getFeatureDefinition,
} from '@/lib/productTiers';
import { type ProductTier, getTierDisplayName } from '@/lib/subscriptionTiers';
import { trackFeatureInterest } from '@/lib/featureUsageTracking';
import { useSubscription } from '@/hooks/useSubscription';

interface PlanData {
  is_strategic_plan?: boolean;
}

interface UseFeatureAccessResult {
  /** Whether the user can access this feature */
  hasAccess: boolean;
  /** Whether this is a paid feature (not Standard) */
  isPro: boolean;
  /** User's current tier */
  userTier: ProductTier;
  /** Feature name for display */
  featureName: string | undefined;
  /** Required tier for this feature */
  requiredTier: ProductTier | undefined;
  /** Display name for required tier */
  requiredTierName: string | undefined;
  /** Call this when user shows interest (viewing locked section) */
  trackInterest: (action?: 'viewed' | 'expanded' | 'attempted') => void;
}

/**
 * Hook to check feature access and track user interest
 * 
 * @param featureId - The feature ID from FEATURE_REGISTRY
 * @param planData - Current plan data (or null for no plan)
 */
export function useFeatureAccess(
  featureId: string,
  planData: PlanData | null | undefined
): UseFeatureAccessResult {
  const { tier: subscriptionTier } = useSubscription();
  
  // Use subscription tier if available, otherwise fall back to plan-based tier
  const userTier = subscriptionTier || getUserTier(planData);
  const featureDef = getFeatureDefinition(featureId);
  const requiredTier = featureDef?.tier;
  
  const hasAccess = hasFeatureAccess(featureId, planData, subscriptionTier);
  const isPro = isProFeature(featureId);
  
  // Track that we've already logged a view for this feature this session
  const hasTrackedView = useRef(false);
  
  // Auto-track view when user sees locked feature
  useEffect(() => {
    if (!hasAccess && isPro && !hasTrackedView.current) {
      trackFeatureInterest(featureId, userTier, 'viewed');
      hasTrackedView.current = true;
    }
  }, [hasAccess, isPro, featureId, userTier]);
  
  // Manual tracking for expanded/attempted actions
  const trackInterest = useCallback(
    (action: 'viewed' | 'expanded' | 'attempted' = 'viewed') => {
      if (!hasAccess && isPro) {
        trackFeatureInterest(featureId, userTier, action);
      }
    },
    [hasAccess, isPro, featureId, userTier]
  );
  
  return {
    hasAccess,
    isPro,
    userTier,
    featureName: featureDef?.name,
    requiredTier,
    requiredTierName: requiredTier ? getTierDisplayName(requiredTier) : undefined,
    trackInterest,
  };
}

/**
 * Simple check if current plan is strategic (Pro tier equivalent)
 */
export function useIsStrategicPlan(planData: PlanData | null | undefined): boolean {
  return planData?.is_strategic_plan === true;
}

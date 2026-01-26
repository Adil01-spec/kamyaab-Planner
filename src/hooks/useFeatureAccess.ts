/**
 * Feature Access Hook
 * 
 * Provides feature access checking and interest tracking.
 */

import { useCallback, useEffect, useRef } from 'react';
import { 
  hasFeatureAccess, 
  isProFeature, 
  getUserTier, 
  getFeatureDefinition,
  ProductTier 
} from '@/lib/productTiers';
import { trackFeatureInterest } from '@/lib/featureUsageTracking';

interface PlanData {
  is_strategic_plan?: boolean;
}

interface UseFeatureAccessResult {
  /** Whether the user can access this feature */
  hasAccess: boolean;
  /** Whether this is a Pro-only feature */
  isPro: boolean;
  /** User's current tier */
  userTier: ProductTier;
  /** Feature name for display */
  featureName: string | undefined;
  /** Call this when user shows interest (viewing Pro section) */
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
  const hasAccess = hasFeatureAccess(featureId, planData);
  const isPro = isProFeature(featureId);
  const userTier = getUserTier(planData);
  const featureDef = getFeatureDefinition(featureId);
  
  // Track that we've already logged a view for this feature this session
  const hasTrackedView = useRef(false);
  
  // Auto-track view when free user sees Pro feature
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
    trackInterest,
  };
}

/**
 * Simple check if current plan is strategic (Pro tier)
 */
export function useIsStrategicPlan(planData: PlanData | null | undefined): boolean {
  return planData?.is_strategic_plan === true;
}

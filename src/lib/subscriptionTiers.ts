/**
 * Subscription Tier Definitions
 * 
 * Defines the 4-tier pricing structure with PKR-based pricing.
 * Single source of truth for tier hierarchy and feature access.
 */

export type ProductTier = 'standard' | 'student' | 'pro' | 'business';

/**
 * Subscription lifecycle states
 */
export type SubscriptionState = 'active' | 'trial' | 'grace' | 'canceled' | 'expired';

export interface TierDefinition {
  id: ProductTier;
  name: string;
  tagline: string;
  priceMonthlyPKR: number | null; // null = free
  priceYearlyPKR: number | null;
  features: string[];
  highlighted?: boolean;
}

/**
 * Tier hierarchy for access checks (lowest to highest)
 */
export const TIER_HIERARCHY: ProductTier[] = ['standard', 'student', 'pro', 'business'];

/**
 * Complete tier definitions with PKR pricing
 */
export const TIER_DEFINITIONS: Record<ProductTier, TierDefinition> = {
  standard: {
    id: 'standard',
    name: 'Standard',
    tagline: 'Core planning and execution',
    priceMonthlyPKR: null,
    priceYearlyPKR: null,
    features: [
      'Core planning and execution',
      'Timers, defer, partial progress',
      'End-of-day closure',
      'Calm re-entry',
    ],
  },
  student: {
    id: 'student',
    name: 'Student',
    tagline: 'Focused learning support',
    priceMonthlyPKR: 299,
    priceYearlyPKR: 2499,
    features: [
      'Everything in Standard',
      'No ads',
      'Extended plan history (30 plans)',
      'Basic execution insights',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    tagline: 'Strategic depth and analysis',
    priceMonthlyPKR: 999,
    priceYearlyPKR: 7999,
    features: [
      'Strategic planning mode',
      'Strategy overview, risks, assumptions',
      'Execution insights & diagnosis',
      'Plan history comparison',
      'PDF export',
      'Style & pattern analysis',
      'No ads',
    ],
    highlighted: true,
  },
  business: {
    id: 'business',
    name: 'Business',
    tagline: 'Professional team planning',
    priceMonthlyPKR: 2499,
    priceYearlyPKR: 19999,
    features: [
      'Everything in Pro',
      'Multi-plan comparison',
      'Long-term pattern tracking',
      'Scenario-aware analysis',
      'Professional sharing & exports',
      'Higher usage caps',
    ],
  },
};

/**
 * Check if a user's tier includes access to a required tier
 * Higher tiers include access to all lower tier features
 */
export function tierIncludesAccess(userTier: ProductTier, requiredTier: ProductTier): boolean {
  const userIndex = TIER_HIERARCHY.indexOf(userTier);
  const requiredIndex = TIER_HIERARCHY.indexOf(requiredTier);
  return userIndex >= requiredIndex;
}

/**
 * Get tier definition by ID
 */
export function getTierDefinition(tier: ProductTier): TierDefinition {
  return TIER_DEFINITIONS[tier];
}

/**
 * Get display name for a tier
 */
export function getTierDisplayName(tier: ProductTier): string {
  return TIER_DEFINITIONS[tier]?.name || 'Standard';
}

/**
 * Format PKR price for display
 */
export function formatPKRPrice(amount: number | null): string {
  if (amount === null) return 'Free';
  return `PKR ${amount.toLocaleString()}`;
}

/**
 * Get the minimum tier required for a feature
 * Used for "Available in [Tier]" badges
 */
export function getMinimumTierForFeature(featureTier: ProductTier): string {
  return getTierDisplayName(featureTier);
}

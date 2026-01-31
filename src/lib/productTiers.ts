/**
 * Product Tier Definitions
 * 
 * Defines Free vs Pro (Strategic) tiers and feature registry.
 * No payments, no paywalls - just clarity about what exists.
 */

export type ProductTier = 'free' | 'pro';

export interface FeatureDefinition {
  id: string;
  name: string;
  tier: ProductTier;
  category: 'planning' | 'execution' | 'insights' | 'export';
  description?: string;
}

/**
 * Central registry of all features and their tier requirements
 */
export const FEATURE_REGISTRY: Record<string, FeatureDefinition> = {
  // Free features - fully accessible to all users
  'standard-planning': {
    id: 'standard-planning',
    name: 'Standard Planning',
    tier: 'free',
    category: 'planning',
    description: 'Create and manage task-focused plans',
  },
  'task-execution': {
    id: 'task-execution',
    name: 'Task Execution',
    tier: 'free',
    category: 'execution',
    description: 'Execute tasks with timers and tracking',
  },
  'today-workflow': {
    id: 'today-workflow',
    name: 'Today Workflow',
    tier: 'free',
    category: 'execution',
    description: 'Daily focus and task management',
  },
  'basic-insights': {
    id: 'basic-insights',
    name: 'Execution Insights',
    tier: 'free',
    category: 'insights',
    description: 'Basic execution patterns and feedback',
  },
  'scenario-tagging': {
    id: 'scenario-tagging',
    name: 'Scenario Tagging',
    tier: 'free',
    category: 'planning',
    description: 'Tag tasks with context scenarios',
  },
  'calibration-insights': {
    id: 'calibration-insights',
    name: 'Calibration Insights',
    tier: 'free',
    category: 'insights',
    description: 'Estimation accuracy feedback',
  },
  'progress-proof-current': {
    id: 'progress-proof-current',
    name: 'Progress Proof (Current Plan)',
    tier: 'free',
    category: 'insights',
    description: 'Track progress on your current plan',
  },
  'plan-history-list': {
    id: 'plan-history-list',
    name: 'Plan History List',
    tier: 'free',
    category: 'insights',
    description: 'View past completed plans',
  },

  // Pro features - require Strategic Planning
  'strategic-planning': {
    id: 'strategic-planning',
    name: 'Strategic Planning',
    tier: 'pro',
    category: 'planning',
    description: 'Advanced planning with context discovery',
  },
  'strategic-discovery': {
    id: 'strategic-discovery',
    name: 'Strategic Discovery',
    tier: 'pro',
    category: 'planning',
    description: 'AI-guided context discovery flow',
  },
  'strategy-overview': {
    id: 'strategy-overview',
    name: 'Strategy Overview',
    tier: 'pro',
    category: 'planning',
    description: 'High-level strategy and risk analysis',
  },
  'strategic-blind-spots': {
    id: 'strategic-blind-spots',
    name: 'Strategic Blind Spots',
    tier: 'pro',
    category: 'insights',
    description: 'AI-identified potential issues',
  },
  'deeper-diagnosis': {
    id: 'deeper-diagnosis',
    name: 'Deeper Execution Diagnosis',
    tier: 'pro',
    category: 'insights',
    description: 'Advanced pattern analysis',
  },
  'historical-comparisons': {
    id: 'historical-comparisons',
    name: 'Historical Comparisons',
    tier: 'pro',
    category: 'insights',
    description: 'Multi-plan progress comparisons',
  },
  'next-cycle-guidance': {
    id: 'next-cycle-guidance',
    name: 'Next-Cycle Guidance',
    tier: 'pro',
    category: 'insights',
    description: 'Data-backed planning recommendations',
  },
  'scenario-patterns': {
    id: 'scenario-patterns',
    name: 'Long-term Scenario Patterns',
    tier: 'pro',
    category: 'insights',
    description: 'Cross-plan scenario analysis',
  },
  'progress-pdf-export': {
    id: 'progress-pdf-export',
    name: 'Progress PDF Export',
    tier: 'pro',
    category: 'export',
    description: 'Export progress reports as PDF',
  },
  'strategic-review-export': {
    id: 'strategic-review-export',
    name: 'Strategic Review Export',
    tier: 'pro',
    category: 'export',
    description: 'Export professional plan and insights summary as PDF',
  },
  'share-review': {
    id: 'share-review',
    name: 'Share Review',
    tier: 'pro',
    category: 'export',
    description: 'Generate shareable read-only review links',
  },
  'external-feedback': {
    id: 'external-feedback',
    name: 'External Feedback',
    tier: 'pro',
    category: 'insights',
    description: 'Collect structured feedback from reviewers',
  },
  'plan-comparison': {
    id: 'plan-comparison',
    name: 'Plan Comparison',
    tier: 'pro',
    category: 'insights',
    description: 'Compare current plan with past plans',
  },
  'comparison-insights': {
    id: 'comparison-insights',
    name: 'Comparative Insights',
    tier: 'pro',
    category: 'insights',
    description: 'AI-generated observational insights across plans',
  },
  'pattern-signals': {
    id: 'pattern-signals',
    name: 'Pattern Signals',
    tier: 'pro',
    category: 'insights',
    description: 'Cross-plan pattern detection',
  },
  'planning-style-profile': {
    id: 'planning-style-profile',
    name: 'Planning Style Profile',
    tier: 'pro',
    category: 'insights',
    description: 'Personal planning style derived from behavior',
  },
  'manual-task-add': {
    id: 'manual-task-add',
    name: 'Add Tasks Manually',
    tier: 'pro',
    category: 'planning',
    description: 'Add new tasks directly to your plan',
  },
  'task-split': {
    id: 'task-split',
    name: 'Split Tasks',
    tier: 'pro',
    category: 'planning',
    description: 'Split existing tasks into smaller parts',
  },
};

/**
 * Check if a feature requires Pro tier
 */
export function isProFeature(featureId: string): boolean {
  return FEATURE_REGISTRY[featureId]?.tier === 'pro';
}

/**
 * Get feature definition by ID
 */
export function getFeatureDefinition(featureId: string): FeatureDefinition | undefined {
  return FEATURE_REGISTRY[featureId];
}

/**
 * Determine user's effective tier based on their current plan
 */
export function getUserTier(planData: { is_strategic_plan?: boolean } | null | undefined): ProductTier {
  return planData?.is_strategic_plan === true ? 'pro' : 'free';
}

/**
 * Check if user has access to a specific feature
 */
export function hasFeatureAccess(
  featureId: string,
  planData: { is_strategic_plan?: boolean } | null | undefined
): boolean {
  const feature = FEATURE_REGISTRY[featureId];
  
  // Unknown features default to accessible
  if (!feature) return true;
  
  // Free features are always accessible
  if (feature.tier === 'free') return true;
  
  // Pro features require strategic plan
  return planData?.is_strategic_plan === true;
}

/**
 * Get all features for a specific tier
 */
export function getFeaturesByTier(tier: ProductTier): FeatureDefinition[] {
  return Object.values(FEATURE_REGISTRY).filter((f) => f.tier === tier);
}

/**
 * Get all features in a category
 */
export function getFeaturesByCategory(category: FeatureDefinition['category']): FeatureDefinition[] {
  return Object.values(FEATURE_REGISTRY).filter((f) => f.category === category);
}

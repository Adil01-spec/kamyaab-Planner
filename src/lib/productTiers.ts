/**
 * Product Tier Definitions
 * 
 * Defines Standard, Student, Pro, and Business tiers and feature registry.
 * No payments, no paywalls - just clarity about what exists.
 */

// Re-export ProductTier from subscriptionTiers for consistency
export type { ProductTier } from './subscriptionTiers';
import { type ProductTier, tierIncludesAccess } from './subscriptionTiers';

export interface FeatureDefinition {
  id: string;
  name: string;
  tier: ProductTier;
  category: 'planning' | 'execution' | 'insights' | 'export';
  description: string;
  /** Plain factual explanation of value (no sales copy) */
  valueExplanation: string;
  /** Whether to show read-only preview when locked */
  previewable: boolean;
}

/**
 * Central registry of all features and their tier requirements
 */
export const FEATURE_REGISTRY: Record<string, FeatureDefinition> = {
  // Standard features - fully accessible to all users
  'standard-planning': {
    id: 'standard-planning',
    name: 'Standard Planning',
    tier: 'standard',
    category: 'planning',
    description: 'Create and manage task-focused plans',
    valueExplanation: 'Create plans with tasks organized by week.',
    previewable: false,
  },
  'task-execution': {
    id: 'task-execution',
    name: 'Task Execution',
    tier: 'standard',
    category: 'execution',
    description: 'Execute tasks with timers and tracking',
    valueExplanation: 'Track time spent on tasks with built-in timers.',
    previewable: false,
  },
  'today-workflow': {
    id: 'today-workflow',
    name: 'Today Workflow',
    tier: 'standard',
    category: 'execution',
    description: 'Daily focus and task management',
    valueExplanation: 'Focus on today\'s tasks with a dedicated view.',
    previewable: false,
  },
  'basic-insights': {
    id: 'basic-insights',
    name: 'Execution Insights',
    tier: 'standard',
    category: 'insights',
    description: 'Basic execution patterns and feedback',
    valueExplanation: 'See how you execute your tasks over time.',
    previewable: false,
  },
  'scenario-tagging': {
    id: 'scenario-tagging',
    name: 'Scenario Tagging',
    tier: 'standard',
    category: 'planning',
    description: 'Tag tasks with context scenarios',
    valueExplanation: 'Add context to your plans with scenario tags.',
    previewable: false,
  },
  'calibration-insights': {
    id: 'calibration-insights',
    name: 'Calibration Insights',
    tier: 'standard',
    category: 'insights',
    description: 'Estimation accuracy feedback',
    valueExplanation: 'Track how accurate your time estimates are.',
    previewable: false,
  },
  'progress-proof-current': {
    id: 'progress-proof-current',
    name: 'Progress Proof (Current Plan)',
    tier: 'standard',
    category: 'insights',
    description: 'Track progress on your current plan',
    valueExplanation: 'See tangible proof of your progress on the current plan.',
    previewable: false,
  },
  
  // Student features - available from Student tier
  'plan-history-list': {
    id: 'plan-history-list',
    name: 'Plan History',
    tier: 'student',
    category: 'insights',
    description: 'View past completed plans',
    valueExplanation: 'Access your history of completed plans to track long-term progress.',
    previewable: true,
  },

  // Pro features - require Pro tier or higher
  'strategic-planning': {
    id: 'strategic-planning',
    name: 'Strategic Planning',
    tier: 'pro',
    category: 'planning',
    description: 'Advanced planning with context discovery',
    valueExplanation: 'Strategic planning identifies assumptions, risks, and blind spots before you start.',
    previewable: true,
  },
  'strategic-discovery': {
    id: 'strategic-discovery',
    name: 'Strategic Discovery',
    tier: 'pro',
    category: 'planning',
    description: 'AI-guided context discovery flow',
    valueExplanation: 'Answer guided questions to uncover hidden context and constraints.',
    previewable: false,
  },
  'strategy-overview': {
    id: 'strategy-overview',
    name: 'Strategy Overview',
    tier: 'pro',
    category: 'planning',
    description: 'High-level strategy and risk analysis',
    valueExplanation: 'See a high-level view of your strategy, assumptions, and risks.',
    previewable: true,
  },
  'strategic-blind-spots': {
    id: 'strategic-blind-spots',
    name: 'Strategic Blind Spots',
    tier: 'pro',
    category: 'insights',
    description: 'AI-identified potential issues',
    valueExplanation: 'Discover potential blind spots and risks you may have missed.',
    previewable: true,
  },
  'deeper-diagnosis': {
    id: 'deeper-diagnosis',
    name: 'Deeper Execution Diagnosis',
    tier: 'pro',
    category: 'insights',
    description: 'Advanced pattern analysis',
    valueExplanation: 'Execution diagnosis highlights recurring inefficiencies over time.',
    previewable: true,
  },
  'historical-comparisons': {
    id: 'historical-comparisons',
    name: 'Historical Comparisons',
    tier: 'pro',
    category: 'insights',
    description: 'Multi-plan progress comparisons',
    valueExplanation: 'Compare your current plan with past plans to see trends.',
    previewable: true,
  },
  'next-cycle-guidance': {
    id: 'next-cycle-guidance',
    name: 'Next-Cycle Guidance',
    tier: 'pro',
    category: 'insights',
    description: 'Data-backed planning recommendations',
    valueExplanation: 'Get suggestions for your next plan based on your execution history.',
    previewable: true,
  },
  'scenario-patterns': {
    id: 'scenario-patterns',
    name: 'Long-term Scenario Patterns',
    tier: 'pro',
    category: 'insights',
    description: 'Cross-plan scenario analysis',
    valueExplanation: 'See how different scenarios affect your execution patterns over time.',
    previewable: true,
  },
  'progress-pdf-export': {
    id: 'progress-pdf-export',
    name: 'Progress PDF Export',
    tier: 'pro',
    category: 'export',
    description: 'Export progress reports as PDF',
    valueExplanation: 'Exports generate professional progress reports for sharing.',
    previewable: false,
  },
  'strategic-review-export': {
    id: 'strategic-review-export',
    name: 'Strategic Review Export',
    tier: 'pro',
    category: 'export',
    description: 'Export professional plan and insights summary as PDF',
    valueExplanation: 'Create professional summaries of your strategic plans and insights.',
    previewable: false,
  },
  'share-review': {
    id: 'share-review',
    name: 'Share Review',
    tier: 'pro',
    category: 'export',
    description: 'Generate shareable read-only review links',
    valueExplanation: 'Share your progress with others via secure read-only links.',
    previewable: false,
  },
  'advisor-view': {
    id: 'advisor-view',
    name: 'Advisor View',
    tier: 'pro',
    category: 'export',
    description: 'Professional read-only view for mentors and advisors',
    valueExplanation: 'Create read-only links for mentors to review your progress.',
    previewable: false,
  },
  'external-feedback': {
    id: 'external-feedback',
    name: 'External Feedback',
    tier: 'pro',
    category: 'insights',
    description: 'Collect structured feedback from reviewers',
    valueExplanation: 'Gather structured feedback from people who review your shared plans.',
    previewable: false,
  },
  'plan-comparison': {
    id: 'plan-comparison',
    name: 'Plan Comparison',
    tier: 'pro',
    category: 'insights',
    description: 'Compare current plan with past plans',
    valueExplanation: 'Compare your current plan with past plans to see trends.',
    previewable: true,
  },
  'comparison-insights': {
    id: 'comparison-insights',
    name: 'Comparative Insights',
    tier: 'pro',
    category: 'insights',
    description: 'AI-generated observational insights across plans',
    valueExplanation: 'Get AI-generated observations comparing your plans over time.',
    previewable: true,
  },
  'pattern-signals': {
    id: 'pattern-signals',
    name: 'Pattern Signals',
    tier: 'pro',
    category: 'insights',
    description: 'Cross-plan pattern detection',
    valueExplanation: 'Detect recurring patterns across multiple plans.',
    previewable: true,
  },
  'planning-style-profile': {
    id: 'planning-style-profile',
    name: 'Planning Style Profile',
    tier: 'pro',
    category: 'insights',
    description: 'Personal planning style derived from behavior',
    valueExplanation: 'See patterns in how you approach planning based on your history.',
    previewable: true,
  },
  'manual-task-add': {
    id: 'manual-task-add',
    name: 'Add Tasks Manually',
    tier: 'pro',
    category: 'planning',
    description: 'Add new tasks directly to your plan',
    valueExplanation: 'Add new tasks to your plan without regenerating.',
    previewable: false,
  },
  'task-split': {
    id: 'task-split',
    name: 'Split Tasks',
    tier: 'pro',
    category: 'planning',
    description: 'Split existing tasks into smaller parts',
    valueExplanation: 'Break down large tasks into smaller, manageable pieces.',
    previewable: false,
  },
  
  // Business features - require Business tier
  'multi-plan-comparison': {
    id: 'multi-plan-comparison',
    name: 'Multi-Plan Comparison',
    tier: 'business',
    category: 'insights',
    description: 'Compare multiple plans simultaneously',
    valueExplanation: 'Compare multiple plans side-by-side to identify trends.',
    previewable: true,
  },
  'long-term-patterns': {
    id: 'long-term-patterns',
    name: 'Long-term Pattern Tracking',
    tier: 'business',
    category: 'insights',
    description: 'Track patterns across extended time periods',
    valueExplanation: 'Track execution patterns over months and years.',
    previewable: true,
  },
  'professional-exports': {
    id: 'professional-exports',
    name: 'Professional Exports',
    tier: 'business',
    category: 'export',
    description: 'Enhanced export options for teams',
    valueExplanation: 'Create professional exports suitable for team and stakeholder reporting.',
    previewable: false,
  },
};

/**
 * Check if a feature requires a paid tier (not Standard)
 */
export function isProFeature(featureId: string): boolean {
  const feature = FEATURE_REGISTRY[featureId];
  return feature?.tier !== 'standard';
}

/**
 * Get feature definition by ID
 */
export function getFeatureDefinition(featureId: string): FeatureDefinition | undefined {
  return FEATURE_REGISTRY[featureId];
}

/**
 * Determine user's effective tier based on their current plan
 * Legacy support: maps is_strategic_plan to 'pro' tier
 */
export function getUserTier(planData: { is_strategic_plan?: boolean } | null | undefined): ProductTier {
  // This is legacy behavior - will be replaced by subscription tier
  return planData?.is_strategic_plan === true ? 'pro' : 'standard';
}

/**
 * Check if user has access to a specific feature
 * Uses tier hierarchy: business > pro > student > standard
 */
export function hasFeatureAccess(
  featureId: string,
  planData: { is_strategic_plan?: boolean } | null | undefined,
  userSubscriptionTier?: ProductTier
): boolean {
  const feature = FEATURE_REGISTRY[featureId];
  
  // Unknown features default to accessible
  if (!feature) return true;
  
  // Get user's effective tier (subscription tier takes precedence)
  const userTier = userSubscriptionTier || getUserTier(planData);
  
  // Check if user's tier includes access to the feature's required tier
  return tierIncludesAccess(userTier, feature.tier);
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

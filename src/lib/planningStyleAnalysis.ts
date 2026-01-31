/**
 * Planning Style Analysis
 * 
 * Derives planning style dimensions from historical behavior.
 * This is observational only - no advice, no recommendations.
 * 
 * Core principle: Mirror, not coach.
 */

import { type PlanHistorySummary } from '@/hooks/usePlanHistory';

// ============================================
// Types
// ============================================

export interface PlanningStyleDimensions {
  /** Planner (0) ↔ Improviser (1) - based on completion rate variance */
  planAdherence: number;
  
  /** Optimistic (0) ↔ Conservative (1) - based on time variance */
  estimationBias: number;
  
  /** Linear (0) ↔ Iterative (1) - based on reordering/splitting (simplified) */
  executionPattern: number;
  
  /** Strategic (0) ↔ Tactical (1) - based on strategic plan usage */
  planningScope: number;
}

export interface StyleSnapshot {
  date: string;
  dimensions: PlanningStyleDimensions;
  plans_at_time: number;
}

export interface PlanningStyleProfile {
  dimensions: PlanningStyleDimensions;
  summary: string; // AI-generated, cached
  summary_generated_at: string;
  data_version_hash: string; // For stability detection
  plans_analyzed: number;
  first_analyzed_at: string;
  last_analyzed_at: string;
  evolution_history?: StyleSnapshot[];
}

// ============================================
// Constants
// ============================================

export const MIN_PLANS_FOR_PROFILE = 3;
export const MIN_NEW_PLANS_FOR_REGENERATION = 2;

// ============================================
// Hash Calculation for Stability
// ============================================

/**
 * Calculate a data version hash from plan history
 * Used to detect when significant new data exists
 */
export function calculateDataVersionHash(history: PlanHistorySummary[]): string {
  if (history.length === 0) return 'empty';
  
  const planCount = history.length;
  const totalTasks = history.reduce((sum, h) => sum + h.total_tasks, 0);
  const totalCompleted = history.reduce((sum, h) => sum + h.completed_tasks, 0);
  const strategicCount = history.filter(h => h.is_strategic).length;
  
  // Simple hash combining key metrics
  return `${planCount}-${totalTasks}-${totalCompleted}-${strategicCount}`;
}

/**
 * Determine if profile should be regenerated
 */
export function shouldRegenerateProfile(
  existingProfile: PlanningStyleProfile | null,
  history: PlanHistorySummary[]
): boolean {
  // Always generate if no existing profile and sufficient data
  if (!existingProfile) {
    return history.length >= MIN_PLANS_FOR_PROFILE;
  }
  
  // Skip if hash matches (no new data)
  const currentHash = calculateDataVersionHash(history);
  if (existingProfile.data_version_hash === currentHash) {
    return false;
  }
  
  // Require at least N new plans since last analysis
  const newPlansSinceLast = history.length - existingProfile.plans_analyzed;
  if (newPlansSinceLast < MIN_NEW_PLANS_FOR_REGENERATION) {
    return false;
  }
  
  return true;
}

// ============================================
// Style Dimension Calculation
// ============================================

/**
 * Analyze plan history and derive style dimensions
 */
export function analyzePlanningStyle(
  history: PlanHistorySummary[]
): PlanningStyleDimensions | null {
  if (history.length < MIN_PLANS_FOR_PROFILE) {
    return null;
  }
  
  return {
    planAdherence: calculatePlanAdherence(history),
    estimationBias: calculateEstimationBias(history),
    executionPattern: calculateExecutionPattern(history),
    planningScope: calculatePlanningScope(history),
  };
}

/**
 * Plan Adherence: Planner (0) ↔ Improviser (1)
 * Based on completion rate variance across plans
 */
function calculatePlanAdherence(history: PlanHistorySummary[]): number {
  const completionRates = history.map(h => 
    h.total_tasks > 0 ? h.completed_tasks / h.total_tasks : 0
  );
  
  const avgCompletion = completionRates.reduce((a, b) => a + b, 0) / completionRates.length;
  
  // Calculate variance in completion rates
  const variance = completionRates.reduce((sum, rate) => 
    sum + Math.pow(rate - avgCompletion, 2), 0
  ) / completionRates.length;
  
  // High completion (>85%) with low variance = Planner (0)
  // Lower/variable completion = Improviser (1)
  
  // Combine average and variance into a single score
  // High avg + low variance → 0 (Planner)
  // Low avg OR high variance → 1 (Improviser)
  
  const avgScore = 1 - avgCompletion; // 0 if 100%, 1 if 0%
  const varianceScore = Math.min(1, Math.sqrt(variance) * 2); // Scale variance
  
  // Weighted combination
  const score = (avgScore * 0.6) + (varianceScore * 0.4);
  
  return Math.max(0, Math.min(1, score));
}

/**
 * Estimation Bias: Optimistic (0) ↔ Conservative (1)
 * Based on planned vs actual time across plans
 */
function calculateEstimationBias(history: PlanHistorySummary[]): number {
  // We need to compare planned time vs actual time
  // Since plan_history has total_time_seconds (actual), we need planned estimates
  // For now, use a simplified heuristic based on completion patterns
  
  const completionRates = history.map(h => 
    h.total_tasks > 0 ? h.completed_tasks / h.total_tasks : 0
  );
  const avgCompletion = completionRates.reduce((a, b) => a + b, 0) / completionRates.length;
  
  // Lower completion → likely optimistic (underestimated effort)
  // Higher completion → likely conservative (realistic estimates)
  
  // Map completion to bias:
  // <60% completion = 0 (Optimistic - bit off more than could chew)
  // >90% completion = 1 (Conservative - estimated well or under-planned)
  
  // Normalize to 0-1 scale
  const normalized = (avgCompletion - 0.6) / 0.3;
  return Math.max(0, Math.min(1, normalized));
}

/**
 * Execution Pattern: Linear (0) ↔ Iterative (1)
 * Based on task reordering and splitting (simplified without tracking)
 */
function calculateExecutionPattern(history: PlanHistorySummary[]): number {
  // Without explicit reordering/splitting tracking, use proxy metrics:
  // - Task count per week variation
  // - Completion spread patterns
  
  // For now, use a heuristic based on plan count and completion smoothness
  // More plans with similar completion rates = linear
  // Varied completion rates = iterative
  
  const completionRates = history.map(h => 
    h.total_tasks > 0 ? h.completed_tasks / h.total_tasks : 0
  );
  
  if (completionRates.length < 2) return 0.5; // Neutral
  
  // Calculate how much completion rates vary between consecutive plans
  let totalVariation = 0;
  for (let i = 1; i < completionRates.length; i++) {
    totalVariation += Math.abs(completionRates[i] - completionRates[i - 1]);
  }
  const avgVariation = totalVariation / (completionRates.length - 1);
  
  // Low variation = Linear (0)
  // High variation = Iterative (1)
  return Math.min(1, avgVariation * 2);
}

/**
 * Planning Scope: Strategic (0) ↔ Tactical (1)
 * Based on strategic plan usage ratio
 */
function calculatePlanningScope(history: PlanHistorySummary[]): number {
  if (history.length === 0) return 0.5;
  
  const strategicCount = history.filter(h => h.is_strategic).length;
  const strategicRatio = strategicCount / history.length;
  
  // >50% strategic = Strategic (0)
  // <20% strategic = Tactical (1)
  
  // Invert: high strategic = 0, low strategic = 1
  return 1 - strategicRatio;
}

// ============================================
// Descriptive Labels
// ============================================

export interface DimensionLabel {
  dimension: keyof PlanningStyleDimensions;
  leftLabel: string;
  rightLabel: string;
  leftDescription: string;
  rightDescription: string;
}

export const DIMENSION_LABELS: DimensionLabel[] = [
  {
    dimension: 'planAdherence',
    leftLabel: 'Planner',
    rightLabel: 'Improviser',
    leftDescription: 'Follows plan closely',
    rightDescription: 'Adapts during execution',
  },
  {
    dimension: 'estimationBias',
    leftLabel: 'Optimistic',
    rightLabel: 'Conservative',
    leftDescription: 'Ambitious task scoping',
    rightDescription: 'Realistic estimates',
  },
  {
    dimension: 'executionPattern',
    leftLabel: 'Linear',
    rightLabel: 'Iterative',
    leftDescription: 'Sequential execution',
    rightDescription: 'Revisits and adjusts',
  },
  {
    dimension: 'planningScope',
    leftLabel: 'Strategic',
    rightLabel: 'Tactical',
    leftDescription: 'Long-term focus',
    rightDescription: 'Near-term execution',
  },
];

/**
 * Get descriptive text for a dimension value
 */
export function getDimensionDescription(
  dimension: keyof PlanningStyleDimensions,
  value: number
): string {
  const label = DIMENSION_LABELS.find(l => l.dimension === dimension);
  if (!label) return '';
  
  if (value < 0.35) {
    return `Leans ${label.leftLabel.toLowerCase()}`;
  } else if (value > 0.65) {
    return `Leans ${label.rightLabel.toLowerCase()}`;
  } else {
    return 'Balanced';
  }
}

// ============================================
// Profile Creation
// ============================================

/**
 * Create a new planning style profile from history
 */
export function createPlanningStyleProfile(
  history: PlanHistorySummary[],
  existingProfile?: PlanningStyleProfile | null
): PlanningStyleProfile | null {
  const dimensions = analyzePlanningStyle(history);
  if (!dimensions) return null;
  
  const now = new Date().toISOString();
  const hash = calculateDataVersionHash(history);
  
  // Create evolution snapshot if updating existing profile
  const evolutionHistory: StyleSnapshot[] = existingProfile?.evolution_history 
    ? [...existingProfile.evolution_history] 
    : [];
  
  // Add current dimensions as a snapshot (max 10 snapshots)
  if (evolutionHistory.length >= 10) {
    evolutionHistory.shift();
  }
  evolutionHistory.push({
    date: now,
    dimensions,
    plans_at_time: history.length,
  });
  
  return {
    dimensions,
    summary: existingProfile?.summary || '', // Will be populated by AI
    summary_generated_at: existingProfile?.summary_generated_at || '',
    data_version_hash: hash,
    plans_analyzed: history.length,
    first_analyzed_at: existingProfile?.first_analyzed_at || now,
    last_analyzed_at: now,
    evolution_history: evolutionHistory,
  };
}

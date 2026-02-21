/**
 * Personal Operating Style Analysis Engine
 * 
 * Phase 10.1: Observational personalization layer that infers how a user works
 * based solely on historical planning and execution behavior.
 * 
 * Core principles:
 * - Strictly read-only and observational
 * - No questions, quizzes, or user input
 * - No labels, scores, ranks, or categories
 * - All insights are neutral and non-judgmental
 * - Never modifies plans, tasks, or execution behavior
 */

import { Json } from '@/integrations/supabase/types';

// Minimum completed plans required before surfacing any profile
export const MIN_PLANS_FOR_PROFILE = 3;

// Minimum new plans required before regenerating profile
export const MIN_NEW_PLANS_FOR_REGENERATION = 2;

/**
 * Four neutral dimensions representing working patterns
 * Each value is 0-1 representing a spectrum between two neutral poles
 */
export interface OperatingStyleDimensions {
  /** Light Planner (0) <-> Detailed Planner (1) */
  planningDensity: number;
  
  /** Starter (0) <-> Finisher (1) */
  executionFollowThrough: number;
  
  /** Steady (0) <-> Adaptive (1) */
  adjustmentBehavior: number;
  
  /** Morning Focus (0) <-> Variable Rhythm (1) */
  cadencePreference: number;
}

/**
 * Dimension metadata for UI display
 */
export interface DimensionMeta {
  id: keyof OperatingStyleDimensions;
  leftLabel: string;
  rightLabel: string;
  description: string;
}

export const DIMENSION_METADATA: DimensionMeta[] = [
  {
    id: 'planningDensity',
    leftLabel: 'Light Planner',
    rightLabel: 'Detailed Planner',
    description: 'Task count and granularity across plans',
  },
  {
    id: 'executionFollowThrough',
    leftLabel: 'Starter',
    rightLabel: 'Finisher',
    description: 'Completion rate and closure consistency',
  },
  {
    id: 'adjustmentBehavior',
    leftLabel: 'Steady',
    rightLabel: 'Adaptive',
    description: 'Task deferrals and mid-plan adjustments',
  },
  {
    id: 'cadencePreference',
    leftLabel: 'Morning Focus',
    rightLabel: 'Variable Rhythm',
    description: 'Time-of-day execution patterns',
  },
];

/**
 * Raw metrics used to calculate dimensions
 */
export interface OperatingStyleMetrics {
  totalPlans: number;
  totalTasks: number;
  totalCompleted: number;
  totalWeeks: number;
  avgTasksPerWeek: number;
  avgCompletionRate: number;
  plansWithClosures: number;
  deferralCount: number;
  splitTaskCount: number;
  morningCompletions: number;
  afternoonCompletions: number;
  eveningCompletions: number;
}

/**
 * Full operating style profile with caching metadata
 */
export interface OperatingStyleProfile {
  dimensions: OperatingStyleDimensions;
  metrics: OperatingStyleMetrics;
  aiSummary: string | null;
  summaryGeneratedAt: string | null;
  dataVersionHash: string;
  analyzedPlansCount: number;
  generatedAt: string;
}

/**
 * Plan history entry structure for analysis
 */
export interface PlanHistoryEntry {
  id: string;
  total_tasks: number;
  completed_tasks: number;
  total_weeks: number;
  is_strategic: boolean | null;
  plan_snapshot: Json;
  completed_at: string;
}

/**
 * Task structure within plan snapshot
 */
interface SnapshotTask {
  id: string;
  title: string;
  completed?: boolean;
  completed_at?: string;
  deferred_to?: string;
  execution_state?: 'idle' | 'doing' | 'paused' | 'done';
}

interface SnapshotWeek {
  week: number;
  tasks: SnapshotTask[];
}

interface PlanSnapshot {
  weeks?: SnapshotWeek[];
  day_closures?: unknown[];
}

/**
 * Effort feedback entry from localStorage
 */
export interface EffortFeedbackEntry {
  taskId: string;
  effort: 'easy' | 'normal' | 'hard';
  timestamp: string;
}

/**
 * Calculate a version hash for caching/invalidation
 * Changes when meaningful new data is added
 */
export function calculateDataVersionHash(
  planCount: number,
  totalTasks: number,
  totalCompleted: number
): string {
  return `v1_${planCount}_${totalTasks}_${totalCompleted}`;
}

/**
 * Check if profile should be regenerated based on new data
 */
export function shouldRegenerateProfile(
  existingProfile: OperatingStyleProfile | null,
  currentPlansCount: number
): boolean {
  if (!existingProfile) return currentPlansCount >= MIN_PLANS_FOR_PROFILE;
  
  const newPlansSinceLastAnalysis = currentPlansCount - existingProfile.analyzedPlansCount;
  return newPlansSinceLastAnalysis >= MIN_NEW_PLANS_FOR_REGENERATION;
}

/**
 * Normalize a value to 0-1 range
 */
function normalize(value: number, min: number, max: number): number {
  if (max <= min) return 0.5;
  const clamped = Math.max(min, Math.min(max, value));
  return (clamped - min) / (max - min);
}

/**
 * Calculate standard deviation
 */
function standardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length);
}

/**
 * Extract tasks from plan snapshot
 */
function extractTasksFromSnapshot(snapshot: Json): SnapshotTask[] {
  const parsed = snapshot as PlanSnapshot;
  if (!parsed?.weeks) return [];
  
  return parsed.weeks.flatMap(week => week.tasks || []);
}

/**
 * Check if plan has day closures
 */
function hasDayClosures(snapshot: Json): boolean {
  const parsed = snapshot as PlanSnapshot;
  return Array.isArray(parsed?.day_closures) && parsed.day_closures.length > 0;
}

/**
 * Calculate Planning Density dimension
 * Light Planner (0) <-> Detailed Planner (1)
 * 
 * Based on:
 * - Average tasks per week (normalized 3-12)
 * - Completion ratio (higher = more intentional detail)
 */
export function calculatePlanningDensity(metrics: OperatingStyleMetrics): number {
  // Granularity score: 3 tasks/week = light, 12+ = detailed
  const granularityScore = normalize(metrics.avgTasksPerWeek, 3, 12);
  
  // Completion ratio indicates intentional task density
  const completionWeight = metrics.avgCompletionRate;
  
  // Weighted combination: granularity is primary signal
  return (granularityScore * 0.7) + (completionWeight * 0.3);
}

/**
 * Calculate Execution Follow-Through dimension
 * Starter (0) <-> Finisher (1)
 * 
 * Based on:
 * - Average completion rate across plans
 * - Consistency of using day closures (indicates finishing rituals)
 */
export function calculateExecutionFollowThrough(metrics: OperatingStyleMetrics): number {
  // Direct completion rate
  const completionRate = metrics.avgCompletionRate;
  
  // Closure consistency: how often do they formally close days?
  const closureConsistency = metrics.totalPlans > 0 
    ? metrics.plansWithClosures / metrics.totalPlans 
    : 0;
  
  // Weighted combination
  return (completionRate * 0.7) + (closureConsistency * 0.3);
}

/**
 * Calculate Adjustment Behavior dimension
 * Steady (0) <-> Adaptive (1)
 * 
 * Based on:
 * - Deferral rate (tasks with deferred_to)
 * - Split task count (tasks matching "(Part X)" pattern)
 */
export function calculateAdjustmentBehavior(metrics: OperatingStyleMetrics): number {
  if (metrics.totalTasks === 0) return 0.5;
  
  // Deferral rate
  const deferralRate = metrics.deferralCount / metrics.totalTasks;
  
  // Split task rate (indicates adaptive task breakdown)
  const splitRate = metrics.splitTaskCount / metrics.totalTasks;
  
  // Combined adjustment signal, normalized to 0-1
  // 50%+ deferral/split rate would be highly adaptive
  return normalize(deferralRate + splitRate, 0, 0.5);
}

/**
 * Calculate Cadence Preference dimension
 * Morning Focus (0) <-> Variable Rhythm (1)
 * 
 * Based on:
 * - Distribution of completion times across day parts
 * - Higher variability = more variable rhythm
 */
export function calculateCadencePreference(metrics: OperatingStyleMetrics): number {
  const total = metrics.morningCompletions + metrics.afternoonCompletions + metrics.eveningCompletions;
  
  if (total === 0) return 0.5; // No data, neutral
  
  // Calculate variability across time buckets
  const buckets = [
    metrics.morningCompletions / total,
    metrics.afternoonCompletions / total,
    metrics.eveningCompletions / total,
  ];
  
  const variability = standardDeviation(buckets);
  
  // Low variability (concentrated in one bucket) = focused rhythm
  // High variability (spread across buckets) = variable rhythm
  // Max std dev for 3 values is ~0.47 (all in one bucket)
  // Min std dev is 0 (perfectly even split)
  // Invert so concentration -> lower value
  return 1 - normalize(variability, 0, 0.47);
}

/**
 * Extract metrics from plan history and effort feedback
 */
export function extractMetricsFromHistory(
  planHistory: PlanHistoryEntry[],
  effortFeedback: EffortFeedbackEntry[] = []
): OperatingStyleMetrics {
  const totalPlans = planHistory.length;
  const totalTasks = planHistory.reduce((sum, p) => sum + p.total_tasks, 0);
  const totalCompleted = planHistory.reduce((sum, p) => sum + p.completed_tasks, 0);
  const totalWeeks = planHistory.reduce((sum, p) => sum + p.total_weeks, 0);
  
  // Average tasks per week
  const avgTasksPerWeek = totalWeeks > 0 ? totalTasks / totalWeeks : 0;
  
  // Average completion rate per plan
  const completionRates = planHistory
    .filter(p => p.total_tasks > 0)
    .map(p => p.completed_tasks / p.total_tasks);
  const avgCompletionRate = completionRates.length > 0
    ? completionRates.reduce((a, b) => a + b, 0) / completionRates.length
    : 0;
  
  // Plans with day closures
  const plansWithClosures = planHistory.filter(p => hasDayClosures(p.plan_snapshot)).length;
  
  // Deferral and split analysis
  let deferralCount = 0;
  let splitTaskCount = 0;
  let morningCompletions = 0;
  let afternoonCompletions = 0;
  let eveningCompletions = 0;
  
  for (const plan of planHistory) {
    const tasks = extractTasksFromSnapshot(plan.plan_snapshot);
    
    for (const task of tasks) {
      // Count deferrals
      if (task.deferred_to) {
        deferralCount++;
      }
      
      // Count split tasks (pattern: "(Part X)" or "Part X:")
      if (/\(Part \d+\)|Part \d+:/i.test(task.title)) {
        splitTaskCount++;
      }
      
      // Analyze completion time distribution
      if (task.completed_at) {
        try {
          const hour = new Date(task.completed_at).getHours();
          if (hour < 12) {
            morningCompletions++;
          } else if (hour < 18) {
            afternoonCompletions++;
          } else {
            eveningCompletions++;
          }
        } catch {
          // Invalid date, skip
        }
      }
    }
  }
  
  // Also analyze effort feedback timestamps for cadence
  for (const feedback of effortFeedback) {
    try {
      const hour = new Date(feedback.timestamp).getHours();
      if (hour < 12) {
        morningCompletions++;
      } else if (hour < 18) {
        afternoonCompletions++;
      } else {
        eveningCompletions++;
      }
    } catch {
      // Invalid date, skip
    }
  }
  
  return {
    totalPlans,
    totalTasks,
    totalCompleted,
    totalWeeks,
    avgTasksPerWeek,
    avgCompletionRate,
    plansWithClosures,
    deferralCount,
    splitTaskCount,
    morningCompletions,
    afternoonCompletions,
    eveningCompletions,
  };
}

/**
 * Calculate all dimensions from metrics
 */
export function calculateDimensions(metrics: OperatingStyleMetrics): OperatingStyleDimensions {
  return {
    planningDensity: calculatePlanningDensity(metrics),
    executionFollowThrough: calculateExecutionFollowThrough(metrics),
    adjustmentBehavior: calculateAdjustmentBehavior(metrics),
    cadencePreference: calculateCadencePreference(metrics),
  };
}

/**
 * Create a full operating style profile
 */
export function createOperatingStyleProfile(
  planHistory: PlanHistoryEntry[],
  effortFeedback: EffortFeedbackEntry[] = [],
  existingAiSummary?: string | null
): OperatingStyleProfile {
  const metrics = extractMetricsFromHistory(planHistory, effortFeedback);
  const dimensions = calculateDimensions(metrics);
  
  return {
    dimensions,
    metrics,
    aiSummary: existingAiSummary || null,
    summaryGeneratedAt: existingAiSummary ? new Date().toISOString() : null,
    dataVersionHash: calculateDataVersionHash(
      metrics.totalPlans,
      metrics.totalTasks,
      metrics.totalCompleted
    ),
    analyzedPlansCount: metrics.totalPlans,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Generate a hint sentence for plan creation based on operating style
 * Returns null if not enough data or no significant pattern
 */
export function generateOperatingStyleHint(
  profile: OperatingStyleProfile | null
): string | null {
  if (!profile || profile.analyzedPlansCount < MIN_PLANS_FOR_PROFILE) {
    return null;
  }
  
  const { dimensions } = profile;
  const hints: string[] = [];
  
  // Only surface hints for dimensions with clear patterns (>0.7 or <0.3)
  if (dimensions.cadencePreference < 0.3) {
    hints.push('You typically work through tasks early in the day.');
  } else if (dimensions.cadencePreference > 0.7) {
    hints.push('Your task completion tends to be spread throughout the day.');
  }
  
  if (dimensions.planningDensity > 0.7) {
    hints.push('You tend to create detailed plans with many tasks.');
  } else if (dimensions.planningDensity < 0.3) {
    hints.push('You tend to prefer lighter plans with fewer tasks.');
  }
  
  if (dimensions.adjustmentBehavior > 0.7) {
    hints.push('You often adjust and reorganize tasks during a plan cycle.');
  }
  
  if (dimensions.executionFollowThrough > 0.8) {
    hints.push('You have a strong pattern of completing most tasks you start.');
  }
  
  // Return the most relevant hint (first one found)
  return hints.length > 0 ? hints[0] : null;
}

/**
 * Get effort feedback from localStorage
 */
export function getEffortFeedbackFromStorage(): EffortFeedbackEntry[] {
  try {
    const stored = localStorage.getItem('kaamyab_effort_feedback');
    if (!stored) return [];
    return JSON.parse(stored) as EffortFeedbackEntry[];
  } catch {
    return [];
  }
}

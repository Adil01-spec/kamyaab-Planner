import { supabase } from '@/integrations/supabase/client';
import { 
  compileExecutionMetrics, 
  type ExecutionMetrics,
  type CompletedTaskMetric
} from './executionAnalytics';

// ============================================
// Personal Execution Profile Types
// ============================================

export interface EstimationTrend {
  current_pattern: 'optimistic' | 'accurate' | 'pessimistic';
  average_variance_percent: number;
  consistency_score: number; // 0-100
  task_type_biases: {
    setup_heavy: number;
    coordination: number;
    execution: number;
  };
}

export interface OverloadTendency {
  optimal_daily_tasks: number;
  completion_rate_by_load: {
    light: number; // 1-2 tasks/day
    normal: number; // 3-4 tasks/day
    heavy: number; // 5+ tasks/day
  };
  overload_threshold: number;
}

export interface DelayPatterns {
  front_loading_preference: boolean;
  rework_frequency: number;
  context_switch_impact: number;
}

export interface PlanningBalance {
  planning_time_ratio: number;
  execution_time_ratio: number;
  balance_assessment: 'planning-heavy' | 'balanced' | 'execution-heavy';
}

export interface ProductivityBias {
  early_day_preference: boolean;
  peak_velocity_period: string;
  sustained_focus_duration: number;
}

// ============================================
// Progress History Types (Phase 8.7)
// ============================================

import { type ScenarioTag } from './scenarioMemory';

export interface PlanCycleSnapshot {
  snapshot_id: string;
  snapshot_date: string;
  plan_type: 'strategic' | 'standard';
  // Phase 8.9: Scenario Memory (immutable after plan creation)
  scenario?: ScenarioTag;
  
  // Core metrics
  metrics: {
    average_overrun_percent: number;
    completion_rate: number;
    completion_smoothness: number; // 0-100
    planning_alignment: number; // 0-100
    late_stage_adjustments: number;
    tasks_completed: number;
    total_time_spent_seconds: number;
  };
  
  // Detected patterns
  patterns: {
    front_loaded: boolean;
    consistent_pace: boolean;
    rework_required: boolean;
  };
}

export interface ProgressHistory {
  snapshots: PlanCycleSnapshot[];
  last_snapshot_date: string;
  total_plans_tracked: number;
}

export interface PersonalExecutionProfile {
  estimation_accuracy_trend: EstimationTrend;
  overload_tendency: OverloadTendency;
  delay_patterns: DelayPatterns;
  planning_vs_execution: PlanningBalance;
  productivity_bias: ProductivityBias;
  last_updated: string;
  data_points_count: number;
  plans_analyzed: number;
  confidence_level: 'low' | 'medium' | 'high';
  // Progress history for trend tracking (Phase 8.7)
  progress_history?: ProgressHistory;
}

export interface CalibrationInsight {
  id: string;
  category: 'estimation' | 'workload' | 'planning' | 'productivity';
  text: string;
  severity: 'info' | 'observation' | 'pattern';
}

// ============================================
// Profile Extraction from Plan Data
// ============================================

/**
 * Extract profile observations from a single plan's execution data
 */
export function extractProfileFromPlan(planData: any): Partial<PersonalExecutionProfile> {
  const metrics = compileExecutionMetrics(planData);
  
  if (metrics.completedTasks.length === 0) {
    return {};
  }

  // Calculate estimation accuracy trend
  const estimationTrend = calculateEstimationTrend(metrics);
  
  // Analyze overload tendencies
  const overloadTendency = analyzeOverloadTendency(metrics);
  
  // Detect delay patterns
  const delayPatterns = detectDelayPatterns(metrics);
  
  // Calculate planning balance
  const planningBalance = calculatePlanningBalance(metrics, planData);

  return {
    estimation_accuracy_trend: estimationTrend,
    overload_tendency: overloadTendency,
    delay_patterns: delayPatterns,
    planning_vs_execution: planningBalance,
    data_points_count: metrics.completedTasks.length,
    last_updated: new Date().toISOString(),
  };
}

function calculateEstimationTrend(metrics: ExecutionMetrics): EstimationTrend {
  const { estimationAccuracy, completedTasks } = metrics;
  
  // Calculate consistency score (how consistent the variance is)
  const variances = completedTasks.map(t => t.variancePercent);
  const mean = variances.reduce((a, b) => a + b, 0) / variances.length;
  const squaredDiffs = variances.map(v => Math.pow(v - mean, 2));
  const standardDeviation = Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / variances.length);
  
  // Lower std dev = higher consistency (inverted and scaled to 0-100)
  const consistencyScore = Math.max(0, Math.min(100, 100 - standardDeviation));
  
  // Analyze task type biases (simplified - would need task categorization)
  const taskTypeBiases = {
    setup_heavy: 0,
    coordination: 0,
    execution: estimationAccuracy.averageVariance,
  };

  return {
    current_pattern: estimationAccuracy.pattern,
    average_variance_percent: estimationAccuracy.averageVariance,
    consistency_score: Math.round(consistencyScore),
    task_type_biases: taskTypeBiases,
  };
}

function analyzeOverloadTendency(metrics: ExecutionMetrics): OverloadTendency {
  const { completedTasks, completionVelocity } = metrics;
  
  // Group tasks by completion day
  const tasksByDay = new Map<string, CompletedTaskMetric[]>();
  completedTasks.forEach(task => {
    const day = task.completedAt.split('T')[0];
    if (!tasksByDay.has(day)) {
      tasksByDay.set(day, []);
    }
    tasksByDay.get(day)!.push(task);
  });
  
  // Calculate completion rates by load level
  const dailyCounts = Array.from(tasksByDay.values()).map(tasks => tasks.length);
  const avgDailyTasks = dailyCounts.length > 0 
    ? dailyCounts.reduce((a, b) => a + b, 0) / dailyCounts.length 
    : 0;
  
  // Estimate optimal daily load based on successful completion patterns
  const optimalDailyTasks = Math.round(Math.min(5, Math.max(2, avgDailyTasks)));
  
  return {
    optimal_daily_tasks: optimalDailyTasks,
    completion_rate_by_load: {
      light: 0.9, // Placeholder - would need historical data
      normal: 0.75,
      heavy: 0.5,
    },
    overload_threshold: optimalDailyTasks + 2,
  };
}

function detectDelayPatterns(metrics: ExecutionMetrics): DelayPatterns {
  const { completedTasks } = metrics;
  
  // Check if tasks are completed front-loaded in the week
  const weekStarts = new Map<number, number[]>();
  completedTasks.forEach(task => {
    const weekIndex = task.weekIndex;
    const completedDay = new Date(task.completedAt).getDay();
    if (!weekStarts.has(weekIndex)) {
      weekStarts.set(weekIndex, []);
    }
    weekStarts.get(weekIndex)!.push(completedDay);
  });
  
  // Calculate average day of week for completions (0 = Sunday, 6 = Saturday)
  let totalDays = 0;
  let count = 0;
  weekStarts.forEach(days => {
    days.forEach(d => {
      totalDays += d;
      count++;
    });
  });
  const avgDay = count > 0 ? totalDays / count : 3.5;
  
  // If average completion day is early in the week, it's front-loading
  const frontLoadingPreference = avgDay < 3.5;
  
  return {
    front_loading_preference: frontLoadingPreference,
    rework_frequency: 0, // Would need task revision tracking
    context_switch_impact: 0, // Would need more granular timing data
  };
}

function calculatePlanningBalance(metrics: ExecutionMetrics, planData: any): PlanningBalance {
  // Simplified - assume execution-focused based on task completion
  const totalTasks = planData?.weeks?.reduce((sum: number, w: any) => sum + w.tasks.length, 0) || 0;
  const completedTasks = metrics.completedTasks.length;
  const completionRatio = totalTasks > 0 ? completedTasks / totalTasks : 0;
  
  let balance: 'planning-heavy' | 'balanced' | 'execution-heavy';
  if (completionRatio < 0.3) {
    balance = 'planning-heavy';
  } else if (completionRatio > 0.7) {
    balance = 'execution-heavy';
  } else {
    balance = 'balanced';
  }
  
  return {
    planning_time_ratio: 0.3,
    execution_time_ratio: 0.7,
    balance_assessment: balance,
  };
}

// ============================================
// Profile Merging and Updates
// ============================================

/**
 * Merge new observations with existing profile (incremental update)
 */
export function mergeProfileUpdates(
  existing: PersonalExecutionProfile | null,
  newObservations: Partial<PersonalExecutionProfile>
): PersonalExecutionProfile {
  if (!existing) {
    return createDefaultProfile(newObservations);
  }
  
  const newDataPoints = newObservations.data_points_count || 0;
  const totalDataPoints = existing.data_points_count + newDataPoints;
  const weight = newDataPoints / totalDataPoints;
  
  // Weighted average for numerical values
  const mergedEstimation: EstimationTrend = {
    current_pattern: newObservations.estimation_accuracy_trend?.current_pattern || existing.estimation_accuracy_trend.current_pattern,
    average_variance_percent: weightedAverage(
      existing.estimation_accuracy_trend.average_variance_percent,
      newObservations.estimation_accuracy_trend?.average_variance_percent || 0,
      weight
    ),
    consistency_score: weightedAverage(
      existing.estimation_accuracy_trend.consistency_score,
      newObservations.estimation_accuracy_trend?.consistency_score || 50,
      weight
    ),
    task_type_biases: existing.estimation_accuracy_trend.task_type_biases,
  };
  
  const mergedOverload: OverloadTendency = {
    optimal_daily_tasks: Math.round(weightedAverage(
      existing.overload_tendency.optimal_daily_tasks,
      newObservations.overload_tendency?.optimal_daily_tasks || 3,
      weight
    )),
    completion_rate_by_load: existing.overload_tendency.completion_rate_by_load,
    overload_threshold: existing.overload_tendency.overload_threshold,
  };
  
  return {
    estimation_accuracy_trend: mergedEstimation,
    overload_tendency: mergedOverload,
    delay_patterns: newObservations.delay_patterns || existing.delay_patterns,
    planning_vs_execution: newObservations.planning_vs_execution || existing.planning_vs_execution,
    productivity_bias: existing.productivity_bias,
    last_updated: new Date().toISOString(),
    data_points_count: totalDataPoints,
    plans_analyzed: existing.plans_analyzed + 1,
    confidence_level: calculateConfidenceLevel(totalDataPoints),
  };
}

function createDefaultProfile(observations: Partial<PersonalExecutionProfile>): PersonalExecutionProfile {
  return {
    estimation_accuracy_trend: observations.estimation_accuracy_trend || {
      current_pattern: 'accurate',
      average_variance_percent: 0,
      consistency_score: 50,
      task_type_biases: { setup_heavy: 0, coordination: 0, execution: 0 },
    },
    overload_tendency: observations.overload_tendency || {
      optimal_daily_tasks: 3,
      completion_rate_by_load: { light: 0.9, normal: 0.75, heavy: 0.5 },
      overload_threshold: 5,
    },
    delay_patterns: observations.delay_patterns || {
      front_loading_preference: false,
      rework_frequency: 0,
      context_switch_impact: 0,
    },
    planning_vs_execution: observations.planning_vs_execution || {
      planning_time_ratio: 0.3,
      execution_time_ratio: 0.7,
      balance_assessment: 'balanced',
    },
    productivity_bias: {
      early_day_preference: true,
      peak_velocity_period: 'morning',
      sustained_focus_duration: 90,
    },
    last_updated: new Date().toISOString(),
    data_points_count: observations.data_points_count || 0,
    plans_analyzed: 1,
    confidence_level: calculateConfidenceLevel(observations.data_points_count || 0),
  };
}

function weightedAverage(existing: number, newValue: number, weight: number): number {
  return existing * (1 - weight) + newValue * weight;
}

/**
 * Calculate confidence level based on data points
 */
export function calculateConfidenceLevel(dataPoints: number): 'low' | 'medium' | 'high' {
  if (dataPoints >= 30) return 'high';
  if (dataPoints >= 10) return 'medium';
  return 'low';
}

// ============================================
// Profile Storage (via profiles.profession_details)
// ============================================

const PROFILE_KEY = 'execution_profile';

/**
 * Fetch execution profile from profiles table
 */
export async function fetchExecutionProfile(userId: string): Promise<PersonalExecutionProfile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('profession_details')
      .eq('id', userId)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching execution profile:', error);
      return null;
    }
    
    const professionDetails = data?.profession_details as Record<string, any> | null;
    return professionDetails?.[PROFILE_KEY] as PersonalExecutionProfile | null;
  } catch (error) {
    console.error('Error fetching execution profile:', error);
    return null;
  }
}

/**
 * Save execution profile to profiles table
 */
export async function saveExecutionProfile(
  userId: string, 
  profile: PersonalExecutionProfile
): Promise<void> {
  try {
    // First fetch existing profession_details
    const { data: existingData } = await supabase
      .from('profiles')
      .select('profession_details')
      .eq('id', userId)
      .maybeSingle();
    
    const existingDetails = (existingData?.profession_details as Record<string, any>) || {};
    
    // Merge with new profile - cast to any to avoid Json type issues
    const updatedDetails: Record<string, unknown> = {
      ...existingDetails,
      [PROFILE_KEY]: profile as unknown,
    };
    
    const { error } = await supabase
      .from('profiles')
      .update({ profession_details: updatedDetails as any })
      .eq('id', userId);
    
    if (error) {
      console.error('Error saving execution profile:', error);
    }
  } catch (error) {
    console.error('Error saving execution profile:', error);
  }
}

// ============================================
// Calibration Insight Generation
// ============================================

const MIN_CONFIDENCE_FOR_INSIGHTS = 'low'; // Show insights even at low confidence, but fewer

/**
 * Generate human-readable calibration insights from profile
 */
export function generateCalibrationInsights(profile: PersonalExecutionProfile): CalibrationInsight[] {
  const insights: CalibrationInsight[] = [];
  
  // Only generate insights if we have enough data
  if (profile.data_points_count < 3) {
    return [];
  }
  
  // Estimation calibration insight
  if (profile.estimation_accuracy_trend.current_pattern !== 'accurate') {
    const variance = Math.abs(profile.estimation_accuracy_trend.average_variance_percent);
    if (variance > 15) {
      const direction = profile.estimation_accuracy_trend.current_pattern === 'optimistic' 
        ? 'underestimate' 
        : 'overestimate';
      insights.push({
        id: 'estimation-calibration',
        category: 'estimation',
        text: `You typically ${direction} task duration by ~${Math.round(variance)}%.`,
        severity: variance > 30 ? 'pattern' : 'observation',
      });
    }
  }
  
  // Workload insight
  const optimalLoad = profile.overload_tendency.optimal_daily_tasks;
  if (optimalLoad <= 2) {
    insights.push({
      id: 'workload-optimal',
      category: 'workload',
      text: `Your optimal daily task load appears to be ${optimalLoad} focused tasks.`,
      severity: 'observation',
    });
  } else if (optimalLoad >= 5) {
    insights.push({
      id: 'workload-high',
      category: 'workload',
      text: `You handle high daily task volumes well (${optimalLoad}+ tasks).`,
      severity: 'info',
    });
  }
  
  // Planning balance insight
  if (profile.planning_vs_execution.balance_assessment !== 'balanced') {
    const assessment = profile.planning_vs_execution.balance_assessment;
    insights.push({
      id: 'planning-balance',
      category: 'planning',
      text: assessment === 'planning-heavy'
        ? 'Your plans tend to have more tasks than you complete. Consider scoping down.'
        : 'You execute efficiently. Strong execution momentum.',
      severity: 'observation',
    });
  }
  
  // Front-loading insight
  if (profile.delay_patterns.front_loading_preference && profile.confidence_level !== 'low') {
    insights.push({
      id: 'front-loading',
      category: 'productivity',
      text: 'You tend to complete tasks early in the week. Front-loaded planning works well for you.',
      severity: 'info',
    });
  }
  
  // Limit to 4 insights max
  return insights.slice(0, 4);
}

// ============================================
// Planning Guidance Hints
// ============================================

export interface PlanningHint {
  id: string;
  text: string;
  step: 'project' | 'deadline' | 'strategic' | 'general';
}

/**
 * Generate planning hints based on profile and current form state
 */
export function generatePlanningHints(
  profile: PersonalExecutionProfile | null,
  currentStep: string,
  formData: {
    projectDescription?: string;
    projectDeadline?: string;
    noDeadline?: boolean;
  }
): PlanningHint | null {
  if (!profile || profile.confidence_level === 'low') {
    return null;
  }
  
  // Deadline step hints
  if (currentStep === 'deadline' || currentStep === 'project') {
    // Optimistic estimation warning
    if (profile.estimation_accuracy_trend.current_pattern === 'optimistic') {
      const variance = Math.abs(profile.estimation_accuracy_trend.average_variance_percent);
      if (variance > 20) {
        return {
          id: 'buffer-suggestion',
          text: `Based on your history, consider adding ~${Math.round(variance * 0.7)}% buffer to time estimates.`,
          step: 'deadline',
        };
      }
    }
    
    // Workload hint
    if (profile.overload_tendency.optimal_daily_tasks <= 3) {
      return {
        id: 'workload-hint',
        text: 'You execute better with fewer parallel tasks. Consider a focused plan.',
        step: 'project',
      };
    }
  }
  
  return null;
}

// ============================================
// Pattern Update Detection
// ============================================

export interface PatternChange {
  field: string;
  label: string;
  direction: 'improved' | 'declined' | 'stable';
  detail: string;
}

/**
 * Compare two profiles and detect pattern changes
 */
export function detectPatternChanges(
  previous: PersonalExecutionProfile,
  current: PersonalExecutionProfile
): PatternChange[] {
  const changes: PatternChange[] = [];
  
  // Estimation accuracy change
  const prevVariance = Math.abs(previous.estimation_accuracy_trend.average_variance_percent);
  const currVariance = Math.abs(current.estimation_accuracy_trend.average_variance_percent);
  const varianceChange = prevVariance - currVariance;
  
  if (Math.abs(varianceChange) > 5) {
    changes.push({
      field: 'estimation_accuracy',
      label: 'Estimation accuracy',
      direction: varianceChange > 0 ? 'improved' : 'declined',
      detail: varianceChange > 0 
        ? `Improved by ${Math.round(varianceChange)}%`
        : `Variance increased by ${Math.round(Math.abs(varianceChange))}%`,
    });
  }
  
  // Consistency change
  const consistencyChange = current.estimation_accuracy_trend.consistency_score - previous.estimation_accuracy_trend.consistency_score;
  if (Math.abs(consistencyChange) > 10) {
    changes.push({
      field: 'consistency',
      label: 'Consistency',
      direction: consistencyChange > 0 ? 'improved' : 'declined',
      detail: consistencyChange > 0 
        ? 'More consistent task completion times'
        : 'More variable task completion times',
    });
  }
  
  return changes;
}

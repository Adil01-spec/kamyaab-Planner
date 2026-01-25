import { 
  PlanCycleSnapshot, 
  ProgressHistory, 
  PersonalExecutionProfile 
} from './personalExecutionProfile';
import { compileExecutionMetrics } from './executionAnalytics';

// ============================================
// Progress Proof Types
// ============================================

export type TrendDirection = 'improving' | 'stable' | 'declining';
export type TrendConfidence = 'high' | 'medium' | 'low';

export interface TrendResult {
  direction: TrendDirection;
  confidence: TrendConfidence;
}

export interface ProgressTrend {
  id: string;
  metric: string;
  label: string;
  trend: TrendResult;
  detail: string;
}

export interface PlanComparison {
  available: boolean;
  insights: ComparisonInsight[];
  summary: string;
}

export interface ComparisonInsight {
  metric: string;
  change: TrendResult;
  detail: string;
}

export interface ProgressAttribution {
  improvement: string;
  attributed_to: string;
  data_backed: boolean;
}

export interface StrategicComparison {
  available: boolean;
  strategic_insight: string | null;
  standard_insight: string | null;
}

// ============================================
// Snapshot Creation
// ============================================

/**
 * Create a snapshot from current plan execution data
 */
export function createPlanCycleSnapshot(
  planData: any,
  isStrategic: boolean = false
): PlanCycleSnapshot {
  const metrics = compileExecutionMetrics(planData);
  const { completedTasks, estimationAccuracy } = metrics;
  
  // Calculate completion rate
  const totalTasks = planData?.weeks?.reduce((sum: number, w: any) => sum + w.tasks.length, 0) || 0;
  const completionRate = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0;
  
  // Calculate completion smoothness (how evenly tasks were completed across weeks)
  const weekCompletions = planData?.weeks?.map((w: any) => {
    const weekCompleted = w.tasks.filter((t: any) => t.execution_state === 'done' || t.completed).length;
    return weekCompleted / (w.tasks.length || 1);
  }) || [];
  
  const avgCompletion = weekCompletions.length > 0 
    ? weekCompletions.reduce((a: number, b: number) => a + b, 0) / weekCompletions.length 
    : 0;
  const variance = weekCompletions.length > 0
    ? weekCompletions.reduce((sum: number, c: number) => sum + Math.pow(c - avgCompletion, 2), 0) / weekCompletions.length
    : 0;
  const smoothness = Math.max(0, Math.min(100, 100 - (Math.sqrt(variance) * 100)));
  
  // Calculate planning alignment (how well execution matched the planned order)
  const planningAlignment = calculatePlanningAlignment(planData);
  
  // Count late-stage adjustments (tasks in last 25% that weren't in original plan)
  const lateStageAdjustments = 0; // Would need revision tracking
  
  // Calculate total time spent
  const totalTimeSpent = completedTasks.reduce((sum, t) => sum + (t.actualSeconds || 0), 0);
  
  // Detect patterns
  const frontLoaded = detectFrontLoading(planData);
  const consistentPace = smoothness > 70;
  const reworkRequired = false; // Would need revision tracking
  
  return {
    snapshot_id: `snapshot_${Date.now()}`,
    snapshot_date: new Date().toISOString(),
    plan_type: isStrategic ? 'strategic' : 'standard',
    metrics: {
      average_overrun_percent: estimationAccuracy.averageVariance,
      completion_rate: Math.round(completionRate),
      completion_smoothness: Math.round(smoothness),
      planning_alignment: Math.round(planningAlignment),
      late_stage_adjustments: lateStageAdjustments,
      tasks_completed: completedTasks.length,
      total_time_spent_seconds: totalTimeSpent,
    },
    patterns: {
      front_loaded: frontLoaded,
      consistent_pace: consistentPace,
      rework_required: reworkRequired,
    },
  };
}

function calculatePlanningAlignment(planData: any): number {
  // Calculate how well the completion order matched the planned week order
  if (!planData?.weeks) return 50;
  
  const completedTasks: { weekIndex: number; completedAt: string }[] = [];
  planData.weeks.forEach((week: any, weekIndex: number) => {
    week.tasks.forEach((task: any) => {
      if ((task.execution_state === 'done' || task.completed) && task.completed_at) {
        completedTasks.push({ weekIndex, completedAt: task.completed_at });
      }
    });
  });
  
  if (completedTasks.length < 2) return 100;
  
  // Sort by completion time
  completedTasks.sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime());
  
  // Count how many are in order
  let inOrder = 0;
  for (let i = 1; i < completedTasks.length; i++) {
    if (completedTasks[i].weekIndex >= completedTasks[i - 1].weekIndex) {
      inOrder++;
    }
  }
  
  return Math.round((inOrder / (completedTasks.length - 1)) * 100);
}

function detectFrontLoading(planData: any): boolean {
  if (!planData?.weeks || planData.weeks.length < 2) return false;
  
  const halfPoint = Math.floor(planData.weeks.length / 2);
  const firstHalfCompleted = planData.weeks.slice(0, halfPoint).reduce((sum: number, w: any) => {
    return sum + w.tasks.filter((t: any) => t.execution_state === 'done' || t.completed).length;
  }, 0);
  const secondHalfCompleted = planData.weeks.slice(halfPoint).reduce((sum: number, w: any) => {
    return sum + w.tasks.filter((t: any) => t.execution_state === 'done' || t.completed).length;
  }, 0);
  
  return firstHalfCompleted > secondHalfCompleted * 1.3;
}

// ============================================
// Trend Detection
// ============================================

/**
 * Detect trends across the last N snapshots
 */
export function detectProgressTrends(
  history: ProgressHistory | undefined,
  count: number = 3
): ProgressTrend[] {
  if (!history || history.snapshots.length < 2) {
    return [];
  }
  
  const recentSnapshots = history.snapshots.slice(-count);
  const trends: ProgressTrend[] = [];
  
  // Estimation accuracy trend (lower overrun = better)
  const overrunValues = recentSnapshots.map(s => Math.abs(s.metrics.average_overrun_percent));
  const overrunTrend = detectTrendDirection(overrunValues, true); // true = inverted (lower is better)
  
  if (overrunTrend.direction !== 'stable') {
    trends.push({
      id: 'estimation-accuracy',
      metric: 'estimation_accuracy',
      label: 'Estimation Accuracy',
      trend: overrunTrend,
      detail: overrunTrend.direction === 'improving'
        ? 'Your estimation accuracy has improved over your last plans.'
        : 'Estimation accuracy has declined slightly.',
    });
  }
  
  // Completion smoothness trend (higher = better)
  const smoothnessValues = recentSnapshots.map(s => s.metrics.completion_smoothness);
  const smoothnessTrend = detectTrendDirection(smoothnessValues, false);
  
  if (smoothnessTrend.direction !== 'stable') {
    trends.push({
      id: 'completion-smoothness',
      metric: 'completion_smoothness',
      label: 'Task Distribution',
      trend: smoothnessTrend,
      detail: smoothnessTrend.direction === 'improving'
        ? 'Task distribution has become more balanced.'
        : 'Task completion has become less evenly distributed.',
    });
  }
  
  // Planning alignment trend (higher = better)
  const alignmentValues = recentSnapshots.map(s => s.metrics.planning_alignment);
  const alignmentTrend = detectTrendDirection(alignmentValues, false);
  
  if (alignmentTrend.direction !== 'stable') {
    trends.push({
      id: 'planning-alignment',
      metric: 'planning_alignment',
      label: 'Execution Flow',
      trend: alignmentTrend,
      detail: alignmentTrend.direction === 'improving'
        ? 'Execution is following planned order more closely.'
        : 'Execution order has diverged from planned sequence.',
    });
  }
  
  // Late-stage adjustments trend (lower = better)
  const adjustmentValues = recentSnapshots.map(s => s.metrics.late_stage_adjustments);
  if (adjustmentValues.some(v => v > 0)) {
    const adjustmentTrend = detectTrendDirection(adjustmentValues, true);
    
    if (adjustmentTrend.direction !== 'stable') {
      trends.push({
        id: 'late-adjustments',
        metric: 'late_stage_adjustments',
        label: 'Late-Stage Changes',
        trend: adjustmentTrend,
        detail: adjustmentTrend.direction === 'improving'
          ? 'You\'re experiencing fewer late-stage overruns.'
          : 'Late-stage adjustments have increased.',
      });
    }
  }
  
  return trends.slice(0, 4); // Max 4 trends
}

function detectTrendDirection(values: number[], inverted: boolean = false): TrendResult {
  if (values.length < 2) {
    return { direction: 'stable', confidence: 'low' };
  }
  
  // Calculate simple moving direction
  const firstHalf = values.slice(0, Math.ceil(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));
  
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  
  if (firstAvg === 0) {
    return { direction: 'stable', confidence: 'low' };
  }
  
  const changePercent = ((secondAvg - firstAvg) / Math.abs(firstAvg)) * 100;
  
  // Thresholds for determining direction
  let direction: TrendDirection;
  if (Math.abs(changePercent) < 5) {
    direction = 'stable';
  } else if (inverted) {
    // For inverted metrics, decrease is improvement
    direction = changePercent < 0 ? 'improving' : 'declining';
  } else {
    // For normal metrics, increase is improvement
    direction = changePercent > 0 ? 'improving' : 'declining';
  }
  
  const confidence: TrendConfidence = 
    values.length >= 3 && Math.abs(changePercent) > 15 ? 'high' :
    values.length >= 2 && Math.abs(changePercent) > 5 ? 'medium' : 'low';
  
  return { direction, confidence };
}

// ============================================
// Plan Comparison
// ============================================

/**
 * Compare current plan to previous plan
 */
export function compareToPreviousPlan(
  history: ProgressHistory | undefined
): PlanComparison {
  if (!history || history.snapshots.length < 2) {
    return { available: false, insights: [], summary: '' };
  }
  
  const current = history.snapshots[history.snapshots.length - 1];
  const previous = history.snapshots[history.snapshots.length - 2];
  
  const insights: ComparisonInsight[] = [];
  
  // Compare overrun
  const overrunChange = current.metrics.average_overrun_percent - previous.metrics.average_overrun_percent;
  if (Math.abs(overrunChange) > 5) {
    insights.push({
      metric: 'overrun',
      change: {
        direction: overrunChange < 0 ? 'improving' : 'declining',
        confidence: Math.abs(overrunChange) > 15 ? 'high' : 'medium',
      },
      detail: overrunChange < 0
        ? 'Time estimates were more accurate this plan.'
        : 'Time estimates had more variance this plan.',
    });
  }
  
  // Compare smoothness
  const smoothnessChange = current.metrics.completion_smoothness - previous.metrics.completion_smoothness;
  if (Math.abs(smoothnessChange) > 10) {
    insights.push({
      metric: 'smoothness',
      change: {
        direction: smoothnessChange > 0 ? 'improving' : 'declining',
        confidence: Math.abs(smoothnessChange) > 20 ? 'high' : 'medium',
      },
      detail: smoothnessChange > 0
        ? 'Execution was smoother than your previous plan.'
        : 'Completion pace was less consistent than before.',
    });
  }
  
  // Compare late-stage adjustments
  const adjustmentChange = current.metrics.late_stage_adjustments - previous.metrics.late_stage_adjustments;
  if (adjustmentChange !== 0) {
    insights.push({
      metric: 'adjustments',
      change: {
        direction: adjustmentChange < 0 ? 'improving' : 'declining',
        confidence: Math.abs(adjustmentChange) >= 2 ? 'high' : 'medium',
      },
      detail: adjustmentChange < 0
        ? 'This plan required fewer last-minute adjustments.'
        : 'More adjustments were needed toward the end.',
    });
  }
  
  // Generate summary
  const improvements = insights.filter(i => i.change.direction === 'improving').length;
  const declines = insights.filter(i => i.change.direction === 'declining').length;
  
  let summary = '';
  if (improvements > declines) {
    summary = 'This plan cycle showed improvement over your previous plan.';
  } else if (declines > improvements) {
    summary = 'Some metrics shifted compared to your previous plan.';
  } else if (insights.length > 0) {
    summary = 'Performance was similar to your previous plan.';
  }
  
  return { available: true, insights, summary };
}

// ============================================
// Improvement Attribution
// ============================================

/**
 * Attribute improvements to specific behaviors
 */
export function attributeImprovements(
  current: PlanCycleSnapshot,
  previous: PlanCycleSnapshot
): ProgressAttribution[] {
  const attributions: ProgressAttribution[] = [];
  
  // Better estimation accuracy + front loading = earlier alignment
  if (
    Math.abs(current.metrics.average_overrun_percent) < Math.abs(previous.metrics.average_overrun_percent) &&
    current.patterns.front_loaded
  ) {
    attributions.push({
      improvement: 'Better estimation accuracy',
      attributed_to: 'Earlier alignment reduced rework.',
      data_backed: true,
    });
  }
  
  // Better smoothness + consistent pace = balanced approach
  if (
    current.metrics.completion_smoothness > previous.metrics.completion_smoothness &&
    current.patterns.consistent_pace
  ) {
    attributions.push({
      improvement: 'Smoother execution',
      attributed_to: 'Fewer parallel tasks improved completion.',
      data_backed: true,
    });
  }
  
  // Better planning alignment = clearer structure
  if (current.metrics.planning_alignment > previous.metrics.planning_alignment + 10) {
    attributions.push({
      improvement: 'Better execution flow',
      attributed_to: 'Clearer milestones reduced execution drift.',
      data_backed: true,
    });
  }
  
  // Fewer late adjustments = better planning
  if (current.metrics.late_stage_adjustments < previous.metrics.late_stage_adjustments) {
    attributions.push({
      improvement: 'Fewer late-stage changes',
      attributed_to: 'Upfront planning prevented late scrambles.',
      data_backed: true,
    });
  }
  
  return attributions.slice(0, 2); // Max 2 attributions
}

// ============================================
// Strategic vs Standard Comparison
// ============================================

/**
 * Compare outcomes between strategic and standard plans
 */
export function compareStrategicVsStandard(
  history: ProgressHistory | undefined
): StrategicComparison {
  if (!history || history.snapshots.length < 2) {
    return { available: false, strategic_insight: null, standard_insight: null };
  }
  
  const strategicPlans = history.snapshots.filter(s => s.plan_type === 'strategic');
  const standardPlans = history.snapshots.filter(s => s.plan_type === 'standard');
  
  if (strategicPlans.length === 0 || standardPlans.length === 0) {
    return { available: false, strategic_insight: null, standard_insight: null };
  }
  
  // Calculate averages
  const avgStrategicOverrun = average(strategicPlans.map(s => Math.abs(s.metrics.average_overrun_percent)));
  const avgStandardOverrun = average(standardPlans.map(s => Math.abs(s.metrics.average_overrun_percent)));
  
  const avgStrategicSmoothness = average(strategicPlans.map(s => s.metrics.completion_smoothness));
  const avgStandardSmoothness = average(standardPlans.map(s => s.metrics.completion_smoothness));
  
  const avgStrategicAlignment = average(strategicPlans.map(s => s.metrics.planning_alignment));
  const avgStandardAlignment = average(standardPlans.map(s => s.metrics.planning_alignment));
  
  let strategic_insight: string | null = null;
  let standard_insight: string | null = null;
  
  // Generate insights based on differences
  if (avgStrategicSmoothness > avgStandardSmoothness + 10) {
    strategic_insight = 'Your strategic plans show smoother execution flow.';
  } else if (avgStrategicAlignment > avgStandardAlignment + 10) {
    strategic_insight = 'Your strategic plans show fewer late-stage delays.';
  }
  
  if (avgStandardOverrun < avgStrategicOverrun - 10) {
    standard_insight = 'Standard plans complete faster but may require more adjustments.';
  } else if (avgStandardSmoothness > avgStrategicSmoothness + 10) {
    standard_insight = 'Standard plans show more consistent completion patterns.';
  }
  
  return {
    available: strategic_insight !== null || standard_insight !== null,
    strategic_insight,
    standard_insight,
  };
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

// ============================================
// Utility Functions
// ============================================

/**
 * Check if we have enough data for progress insights
 */
export function hasEnoughProgressData(
  history: ProgressHistory | undefined
): boolean {
  return !!history && history.snapshots.length >= 2;
}

/**
 * Append a new snapshot to progress history
 */
export function appendSnapshotToHistory(
  existing: ProgressHistory | undefined,
  newSnapshot: PlanCycleSnapshot
): ProgressHistory {
  const snapshots = existing?.snapshots || [];
  
  return {
    snapshots: [...snapshots, newSnapshot].slice(-10), // Keep last 10 snapshots
    last_snapshot_date: newSnapshot.snapshot_date,
    total_plans_tracked: (existing?.total_plans_tracked || 0) + 1,
  };
}

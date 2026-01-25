import { 
  PersonalExecutionProfile, 
  ProgressHistory,
  PlanCycleSnapshot 
} from './personalExecutionProfile';

// ============================================
// Next-Cycle Guidance Types
// ============================================

export interface NextCycleAdjustment {
  id: string;
  title: string;           // Short, actionable title
  detail: string;          // Concrete explanation
  justification: string;   // Data-backed reason
  pattern_source: string;  // Which pattern triggered this
  confidence: 'high' | 'medium';
}

export interface NextCycleGuidanceResult {
  available: boolean;
  adjustments: NextCycleAdjustment[];
  generated_from: string;  // e.g., "3 completed plans"
  last_updated: string;
}

export interface CachedGuidance {
  adjustments: NextCycleAdjustment[];
  generated_at: string;
  snapshot_count_at_generation: number;
}

// ============================================
// Main Generation Function
// ============================================

/**
 * Generate 1-3 data-backed adjustment suggestions for the next plan cycle.
 * Uses logic-based pattern detection only - no AI speculation.
 */
export function generateNextCycleAdjustments(
  history: ProgressHistory | undefined,
  profile: PersonalExecutionProfile | null
): NextCycleGuidanceResult {
  if (!history || history.snapshots.length === 0) {
    return {
      available: false,
      adjustments: [],
      generated_from: 'no completed plans',
      last_updated: new Date().toISOString(),
    };
  }

  const adjustments: NextCycleAdjustment[] = [];
  
  // Run all pattern detectors
  const parallelOverload = detectParallelTaskOverload(history);
  if (parallelOverload) adjustments.push(parallelOverload);
  
  const coordinationBuffer = detectCoordinationBufferNeed(history);
  if (coordinationBuffer) adjustments.push(coordinationBuffer);
  
  const lateRework = detectLateReworkPattern(history);
  if (lateRework) adjustments.push(lateRework);
  
  const frontLoadingBenefit = detectFrontLoadingBenefit(history);
  if (frontLoadingBenefit) adjustments.push(frontLoadingBenefit);
  
  const estimationBias = detectEstimationBiasCorrection(history, profile);
  if (estimationBias) adjustments.push(estimationBias);
  
  const smoothnessDrop = detectSmoothnessDrop(history);
  if (smoothnessDrop) adjustments.push(smoothnessDrop);
  
  const strategicAdvantage = detectStrategicPlanAdvantage(history);
  if (strategicAdvantage) adjustments.push(strategicAdvantage);

  // Sort by confidence and take top 3
  const sortedAdjustments = adjustments
    .sort((a, b) => {
      const confOrder = { high: 0, medium: 1 };
      return confOrder[a.confidence] - confOrder[b.confidence];
    })
    .slice(0, 3);

  return {
    available: sortedAdjustments.length > 0,
    adjustments: sortedAdjustments,
    generated_from: `${history.snapshots.length} completed plan${history.snapshots.length === 1 ? '' : 's'}`,
    last_updated: new Date().toISOString(),
  };
}

// ============================================
// Pattern Detectors (Logic-Based Only)
// ============================================

/**
 * Detect if parallel task execution led to lower smoothness
 */
function detectParallelTaskOverload(history: ProgressHistory): NextCycleAdjustment | null {
  if (history.snapshots.length < 2) return null;
  
  const recentSnapshots = history.snapshots.slice(-3);
  
  // Check for pattern: low smoothness + inconsistent pace
  const lowSmoothnessCount = recentSnapshots.filter(
    s => s.metrics.completion_smoothness < 60 && !s.patterns.consistent_pace
  ).length;
  
  if (lowSmoothnessCount >= 2) {
    return {
      id: 'parallel-overload',
      title: 'Limit early-phase parallel tasks',
      detail: 'to reduce context switching and improve completion flow.',
      justification: `Based on ${lowSmoothnessCount} plans with uneven task distribution.`,
      pattern_source: 'completion_smoothness',
      confidence: lowSmoothnessCount >= 2 ? 'high' : 'medium',
    };
  }
  
  return null;
}

/**
 * Detect if coordination-heavy tasks consistently overrun
 */
function detectCoordinationBufferNeed(history: ProgressHistory): NextCycleAdjustment | null {
  if (history.snapshots.length < 2) return null;
  
  const recentSnapshots = history.snapshots.slice(-3);
  
  // Check for consistent overruns
  const highOverrunCount = recentSnapshots.filter(
    s => s.metrics.average_overrun_percent > 25
  ).length;
  
  // Also check for late-stage adjustments
  const lateAdjustmentsCount = recentSnapshots.filter(
    s => s.metrics.late_stage_adjustments > 0
  ).length;
  
  if (highOverrunCount >= 2 && lateAdjustmentsCount >= 1) {
    return {
      id: 'coordination-buffer',
      title: 'Add buffer time for complex milestones',
      detail: 'to account for coordination and integration overhead.',
      justification: `Based on repeated overruns averaging ${Math.round(
        recentSnapshots.reduce((sum, s) => sum + s.metrics.average_overrun_percent, 0) / recentSnapshots.length
      )}% in recent plans.`,
      pattern_source: 'average_overrun_percent',
      confidence: 'high',
    };
  }
  
  return null;
}

/**
 * Detect late-stage rework patterns
 */
function detectLateReworkPattern(history: ProgressHistory): NextCycleAdjustment | null {
  if (history.snapshots.length < 2) return null;
  
  const recentSnapshots = history.snapshots.slice(-3);
  
  // Check for late-stage adjustments pattern
  const lateAdjustmentsPlans = recentSnapshots.filter(
    s => s.metrics.late_stage_adjustments > 0
  );
  
  // Also check for declining alignment (execution drifting from plan)
  const lowAlignmentPlans = recentSnapshots.filter(
    s => s.metrics.planning_alignment < 70
  );
  
  if (lateAdjustmentsPlans.length >= 2 || lowAlignmentPlans.length >= 2) {
    return {
      id: 'late-rework',
      title: 'Front-load critical decisions',
      detail: 'to reduce late-stage changes that caused rework previously.',
      justification: `Based on ${Math.max(lateAdjustmentsPlans.length, lowAlignmentPlans.length)} plans with significant late-stage adjustments.`,
      pattern_source: 'late_stage_adjustments',
      confidence: 'high',
    };
  }
  
  return null;
}

/**
 * Detect if front-loading improved outcomes
 */
function detectFrontLoadingBenefit(history: ProgressHistory): NextCycleAdjustment | null {
  if (history.snapshots.length < 2) return null;
  
  const recentSnapshots = history.snapshots.slice(-3);
  
  // Find plans with front_loaded pattern
  const frontLoadedPlans = recentSnapshots.filter(s => s.patterns.front_loaded);
  const nonFrontLoadedPlans = recentSnapshots.filter(s => !s.patterns.front_loaded);
  
  if (frontLoadedPlans.length === 0 || nonFrontLoadedPlans.length === 0) return null;
  
  // Compare smoothness between front-loaded and non-front-loaded
  const avgFrontLoadedSmoothness = frontLoadedPlans.reduce(
    (sum, s) => sum + s.metrics.completion_smoothness, 0
  ) / frontLoadedPlans.length;
  
  const avgNonFrontLoadedSmoothness = nonFrontLoadedPlans.reduce(
    (sum, s) => sum + s.metrics.completion_smoothness, 0
  ) / nonFrontLoadedPlans.length;
  
  // If front-loading improved smoothness significantly
  if (avgFrontLoadedSmoothness > avgNonFrontLoadedSmoothness + 15) {
    return {
      id: 'front-loading-benefit',
      title: 'Continue front-loading heavy tasks',
      detail: 'to maintain the momentum you\'ve built in recent plans.',
      justification: `Front-loaded plans showed ${Math.round(avgFrontLoadedSmoothness - avgNonFrontLoadedSmoothness)}% better smoothness.`,
      pattern_source: 'front_loaded',
      confidence: 'medium',
    };
  }
  
  // If NOT front-loading and smoothness is low, suggest trying it
  if (frontLoadedPlans.length === 0 && avgNonFrontLoadedSmoothness < 65) {
    return {
      id: 'try-front-loading',
      title: 'Try front-loading high-effort tasks',
      detail: 'to build early momentum and reduce end-of-plan pressure.',
      justification: `Recent plans averaged ${Math.round(avgNonFrontLoadedSmoothness)}% smoothness.`,
      pattern_source: 'front_loaded',
      confidence: 'medium',
    };
  }
  
  return null;
}

/**
 * Detect consistent estimation bias and suggest correction
 */
function detectEstimationBiasCorrection(
  history: ProgressHistory,
  profile: PersonalExecutionProfile | null
): NextCycleAdjustment | null {
  if (history.snapshots.length < 2) return null;
  
  const recentSnapshots = history.snapshots.slice(-3);
  
  // Calculate average overrun
  const avgOverrun = recentSnapshots.reduce(
    (sum, s) => sum + s.metrics.average_overrun_percent, 0
  ) / recentSnapshots.length;
  
  // Check if consistently underestimating (positive overrun)
  if (avgOverrun > 20) {
    const bufferSuggestion = Math.min(50, Math.round(avgOverrun * 1.1));
    return {
      id: 'estimation-buffer',
      title: `Add ~${bufferSuggestion}% buffer to time estimates`,
      detail: 'to account for your typical execution overhead.',
      justification: `Based on an average ${Math.round(avgOverrun)}% overrun across ${recentSnapshots.length} plans.`,
      pattern_source: 'average_overrun_percent',
      confidence: recentSnapshots.length >= 3 ? 'high' : 'medium',
    };
  }
  
  // Check if consistently overestimating (negative overrun)
  if (avgOverrun < -20) {
    const reductionSuggestion = Math.min(30, Math.abs(Math.round(avgOverrun * 0.8)));
    return {
      id: 'estimation-reduction',
      title: `Consider reducing estimates by ~${reductionSuggestion}%`,
      detail: 'You consistently complete faster than estimated.',
      justification: `Based on an average ${Math.abs(Math.round(avgOverrun))}% underrun across ${recentSnapshots.length} plans.`,
      pattern_source: 'average_overrun_percent',
      confidence: 'medium',
    };
  }
  
  return null;
}

/**
 * Detect declining smoothness trend
 */
function detectSmoothnessDrop(history: ProgressHistory): NextCycleAdjustment | null {
  if (history.snapshots.length < 3) return null;
  
  const snapshots = history.snapshots.slice(-3);
  
  // Check for declining trend
  let declining = true;
  for (let i = 1; i < snapshots.length; i++) {
    if (snapshots[i].metrics.completion_smoothness >= snapshots[i - 1].metrics.completion_smoothness) {
      declining = false;
      break;
    }
  }
  
  if (declining) {
    const drop = snapshots[0].metrics.completion_smoothness - snapshots[snapshots.length - 1].metrics.completion_smoothness;
    
    if (drop > 10) {
      return {
        id: 'smoothness-decline',
        title: 'Cap daily execution to fewer tasks',
        detail: 'to restore the consistent pace from your earlier plans.',
        justification: `Task distribution smoothness dropped ${Math.round(drop)}% over your last ${snapshots.length} plans.`,
        pattern_source: 'completion_smoothness',
        confidence: 'medium',
      };
    }
  }
  
  return null;
}

/**
 * Detect if strategic planning mode produced better outcomes
 */
function detectStrategicPlanAdvantage(history: ProgressHistory): NextCycleAdjustment | null {
  if (history.snapshots.length < 2) return null;
  
  const strategicPlans = history.snapshots.filter(s => s.plan_type === 'strategic');
  const standardPlans = history.snapshots.filter(s => s.plan_type === 'standard');
  
  // Need both types to compare
  if (strategicPlans.length === 0 || standardPlans.length === 0) return null;
  
  // Compare key metrics
  const avgStrategicAlignment = strategicPlans.reduce(
    (sum, s) => sum + s.metrics.planning_alignment, 0
  ) / strategicPlans.length;
  
  const avgStandardAlignment = standardPlans.reduce(
    (sum, s) => sum + s.metrics.planning_alignment, 0
  ) / standardPlans.length;
  
  const avgStrategicSmoothness = strategicPlans.reduce(
    (sum, s) => sum + s.metrics.completion_smoothness, 0
  ) / strategicPlans.length;
  
  const avgStandardSmoothness = standardPlans.reduce(
    (sum, s) => sum + s.metrics.completion_smoothness, 0
  ) / standardPlans.length;
  
  // Strategic advantage
  if (avgStrategicAlignment > avgStandardAlignment + 10 || avgStrategicSmoothness > avgStandardSmoothness + 10) {
    return {
      id: 'strategic-advantage',
      title: 'Consider using strategic planning for complex projects',
      detail: 'Your strategic plans showed better structure and flow.',
      justification: `Strategic plans averaged ${Math.round(avgStrategicAlignment)}% alignment vs ${Math.round(avgStandardAlignment)}% for standard.`,
      pattern_source: 'plan_type',
      confidence: 'medium',
    };
  }
  
  // Standard advantage (rare but possible)
  if (avgStandardSmoothness > avgStrategicSmoothness + 15) {
    return {
      id: 'standard-advantage',
      title: 'Standard planning works well for you',
      detail: 'Your execution flows better with lighter planning overhead.',
      justification: `Standard plans averaged ${Math.round(avgStandardSmoothness)}% smoothness vs ${Math.round(avgStrategicSmoothness)}% for strategic.`,
      pattern_source: 'plan_type',
      confidence: 'medium',
    };
  }
  
  return null;
}

// ============================================
// Cache Utilities
// ============================================

/**
 * Check if cached guidance is still valid
 */
export function isCacheValid(
  cached: CachedGuidance | undefined,
  currentSnapshotCount: number
): boolean {
  if (!cached) return false;
  
  // Invalidate if new snapshots were added
  if (cached.snapshot_count_at_generation !== currentSnapshotCount) {
    return false;
  }
  
  // Invalidate if older than 24 hours
  const cacheAge = Date.now() - new Date(cached.generated_at).getTime();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  
  return cacheAge < maxAge;
}

/**
 * Create cache entry from guidance result
 */
export function createGuidanceCache(
  result: NextCycleGuidanceResult,
  snapshotCount: number
): CachedGuidance {
  return {
    adjustments: result.adjustments,
    generated_at: result.last_updated,
    snapshot_count_at_generation: snapshotCount,
  };
}

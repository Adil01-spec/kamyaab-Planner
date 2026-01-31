/**
 * Plan History Comparison Utilities
 * 
 * Calculates deltas and comparison metrics between plans.
 * Strictly observational - no mutations.
 */

import type { PlanHistoryFull } from '@/hooks/usePlanHistory';

export interface ComparisonMetrics {
  taskCountDelta: {
    current: number;
    previous: number;
    delta: number;
    direction: 'up' | 'down' | 'neutral';
  };
  completionRateDelta: {
    current: number;
    previous: number;
    delta: number;
    direction: 'up' | 'down' | 'neutral';
  };
  totalTimeDelta: {
    current: number; // seconds
    previous: number; // seconds
    delta: number;
    direction: 'up' | 'down' | 'neutral';
  };
  executionDrift: {
    current: 'early' | 'on-time' | 'late' | 'unknown';
    previous: 'early' | 'on-time' | 'late' | 'unknown';
    improved: boolean | null;
  };
  strategicComparison: {
    currentIsStrategic: boolean;
    previousIsStrategic: boolean;
    upgraded: boolean; // Free -> Strategic
  };
}

export interface CurrentPlanMetrics {
  totalTasks: number;
  completedTasks: number;
  completionPercent: number;
  totalTimeSeconds: number;
  isStrategic: boolean;
  startedAt?: string;
}

/**
 * Calculate current plan metrics from plan data
 */
export function calculateCurrentPlanMetrics(
  planData: Record<string, any>,
  planCreatedAt?: string
): CurrentPlanMetrics {
  let totalTasks = 0;
  let completedTasks = 0;
  let totalTimeSeconds = 0;

  const weeks = planData.weeks || [];
  weeks.forEach((week: any) => {
    const tasks = week.tasks || [];
    tasks.forEach((task: any) => {
      totalTasks++;
      if (task.execution_state === 'done' || task.completed) {
        completedTasks++;
      }
      if (task.time_spent_seconds) {
        totalTimeSeconds += task.time_spent_seconds;
      }
    });
  });

  return {
    totalTasks,
    completedTasks,
    completionPercent: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    totalTimeSeconds,
    isStrategic: planData.is_strategic_plan || false,
    startedAt: planCreatedAt,
  };
}

/**
 * Calculate comparison metrics between current and historical plan
 */
type DeltaDirection = 'up' | 'down' | 'neutral';

function getDirection(delta: number): DeltaDirection {
  if (delta > 0) return 'up';
  if (delta < 0) return 'down';
  return 'neutral';
}

export function calculateComparisonMetrics(
  current: CurrentPlanMetrics,
  previous: PlanHistoryFull
): ComparisonMetrics {
  // Task count delta
  const taskDelta = current.totalTasks - previous.total_tasks;
  const taskCountDelta = {
    current: current.totalTasks,
    previous: previous.total_tasks,
    delta: taskDelta,
    direction: getDirection(taskDelta),
  };

  // Completion rate delta
  const completionDelta = current.completionPercent - previous.completion_percent;
  const completionRateDelta = {
    current: current.completionPercent,
    previous: previous.completion_percent,
    delta: completionDelta,
    direction: getDirection(completionDelta),
  };

  // Total time delta
  const timeDelta = current.totalTimeSeconds - previous.total_time_seconds;
  const totalTimeDelta = {
    current: current.totalTimeSeconds,
    previous: previous.total_time_seconds,
    delta: timeDelta,
    direction: getDirection(timeDelta),
  };

  // Execution drift (simplified - based on completion patterns)
  // This is a heuristic based on completion rate relative to expected timeline
  const currentDrift = getExecutionDrift(current.completionPercent, current.totalTasks);
  const previousDrift = getExecutionDrift(previous.completion_percent, previous.total_tasks);
  
  const executionDrift = {
    current: currentDrift,
    previous: previousDrift,
    improved: currentDrift === 'on-time' && previousDrift === 'late' 
      ? true 
      : currentDrift === 'late' && previousDrift === 'on-time'
      ? false
      : null,
  };

  // Strategic comparison
  const strategicComparison = {
    currentIsStrategic: current.isStrategic,
    previousIsStrategic: previous.is_strategic,
    upgraded: current.isStrategic && !previous.is_strategic,
  };

  return {
    taskCountDelta,
    completionRateDelta,
    totalTimeDelta,
    executionDrift,
    strategicComparison,
  };
}

/**
 * Determine execution drift heuristic
 */
function getExecutionDrift(
  completionPercent: number,
  totalTasks: number
): 'early' | 'on-time' | 'late' | 'unknown' {
  if (totalTasks === 0) return 'unknown';
  
  // This is a simplified heuristic
  // In a real scenario, you'd compare against planned timeline
  if (completionPercent >= 90) return 'on-time';
  if (completionPercent >= 70) return 'on-time';
  if (completionPercent >= 50) return 'late';
  return 'late';
}

/**
 * Format seconds to human-readable time
 */
export function formatDuration(seconds: number): string {
  if (seconds === 0) return '0m';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  return `${minutes}m`;
}

/**
 * Get delta indicator symbol
 */
export function getDeltaIndicator(direction: 'up' | 'down' | 'neutral'): string {
  switch (direction) {
    case 'up': return '↑';
    case 'down': return '↓';
    default: return '─';
  }
}

/**
 * Detect patterns across multiple plans
 * Returns patterns that appear in 3+ plans
 */
export interface PatternSignal {
  id: string;
  label: string;
  detail: string;
  frequency: number;
  severity: 'info' | 'observation';
}

export function detectPatterns(
  history: Array<{
    total_tasks: number;
    completed_tasks: number;
    total_time_seconds: number;
    is_strategic: boolean;
  }>
): PatternSignal[] {
  if (history.length < 3) return [];

  const patterns: PatternSignal[] = [];

  // Pattern: Time underestimation (consistently high time per task)
  const avgTimePerTask = history.map(h => 
    h.completed_tasks > 0 ? h.total_time_seconds / h.completed_tasks : 0
  );
  const highTimeCount = avgTimePerTask.filter(t => t > 3600).length; // > 1 hour per task
  if (highTimeCount >= 3) {
    patterns.push({
      id: 'time-underestimation',
      label: 'Time underestimation',
      detail: `Tasks consistently take longer than expected (${highTimeCount} of ${history.length} plans)`,
      frequency: highTimeCount,
      severity: 'observation',
    });
  }

  // Pattern: Low completion rate
  const lowCompletionCount = history.filter(h => 
    h.total_tasks > 0 && (h.completed_tasks / h.total_tasks) < 0.7
  ).length;
  if (lowCompletionCount >= 3) {
    patterns.push({
      id: 'completion-challenge',
      label: 'Completion patterns',
      detail: `Completion below 70% occurred in ${lowCompletionCount} of ${history.length} plans`,
      frequency: lowCompletionCount,
      severity: 'observation',
    });
  }

  // Pattern: Task count increasing
  const taskCounts = history.map(h => h.total_tasks);
  const increasing = taskCounts.every((count, i) => 
    i === 0 || count >= taskCounts[i - 1]
  );
  if (increasing && history.length >= 3) {
    patterns.push({
      id: 'task-growth',
      label: 'Task scope growth',
      detail: 'Each plan has more tasks than the previous',
      frequency: history.length,
      severity: 'info',
    });
  }

  // Pattern: Strategic plan adoption
  const strategicCount = history.filter(h => h.is_strategic).length;
  if (strategicCount >= 2 && strategicCount < history.length) {
    patterns.push({
      id: 'strategic-transition',
      label: 'Strategic planning adoption',
      detail: `${strategicCount} of ${history.length} plans used strategic mode`,
      frequency: strategicCount,
      severity: 'info',
    });
  }

  return patterns;
}

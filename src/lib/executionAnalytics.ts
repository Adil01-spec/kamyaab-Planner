import { EffortLevel, getEffortHistory } from '@/components/TaskEffortFeedback';

export interface CompletedTaskMetric {
  weekIndex: number;
  taskIndex: number;
  title: string;
  estimatedHours: number;
  actualSeconds: number;
  completedAt: string;
  effort?: EffortLevel;
  variancePercent: number; // positive = took longer than estimated
}

export interface EstimationAccuracy {
  averageVariance: number;
  overestimatedCount: number;
  underestimatedCount: number;
  accurateCount: number; // within 20% tolerance
  pattern: 'optimistic' | 'accurate' | 'pessimistic';
}

export interface EffortPatterns {
  easyCount: number;
  okayCount: number;
  hardCount: number;
  hardTasksTimeRatio: number; // % of time on hard tasks
  totalWithFeedback: number;
}

export interface CompletionVelocity {
  tasksPerDay: number;
  averageTimePerTask: number; // seconds
  fastestTask: CompletedTaskMetric | null;
  slowestTask: CompletedTaskMetric | null;
}

export interface ExecutionMetrics {
  completedTasks: CompletedTaskMetric[];
  estimationAccuracy: EstimationAccuracy;
  effortPatterns: EffortPatterns;
  completionVelocity: CompletionVelocity;
  totalTimeSpent: number;
  planProgress: number;
}

/**
 * Extract completed tasks with execution metrics from plan data
 */
export function getCompletedTasksWithMetrics(planData: any): CompletedTaskMetric[] {
  if (!planData?.weeks) return [];

  const effortHistory = getEffortHistory();
  const completedTasks: CompletedTaskMetric[] = [];

  planData.weeks.forEach((week: any, weekIndex: number) => {
    week.tasks.forEach((task: any, taskIndex: number) => {
      const isCompleted = task.execution_state === 'done' || task.completed;
      const hasTimeSpent = task.time_spent_seconds && task.time_spent_seconds > 0;

      if (isCompleted && hasTimeSpent) {
        const estimatedSeconds = (task.estimated_hours || 1) * 3600;
        const actualSeconds = task.time_spent_seconds;
        const variancePercent = ((actualSeconds - estimatedSeconds) / estimatedSeconds) * 100;

        const effortKey = `${weekIndex}-${taskIndex}`;
        const effortData = effortHistory[effortKey];

        completedTasks.push({
          weekIndex,
          taskIndex,
          title: task.title,
          estimatedHours: task.estimated_hours || 1,
          actualSeconds,
          completedAt: task.completed_at || new Date().toISOString(),
          effort: effortData?.effort,
          variancePercent,
        });
      }
    });
  });

  // Sort by completion time
  return completedTasks.sort((a, b) => 
    new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
  );
}

/**
 * Calculate time estimation accuracy from completed tasks
 */
export function calculateEstimationAccuracy(tasks: CompletedTaskMetric[]): EstimationAccuracy {
  if (tasks.length === 0) {
    return {
      averageVariance: 0,
      overestimatedCount: 0,
      underestimatedCount: 0,
      accurateCount: 0,
      pattern: 'accurate',
    };
  }

  const ACCURACY_THRESHOLD = 20; // 20% tolerance
  let totalVariance = 0;
  let overestimated = 0;
  let underestimated = 0;
  let accurate = 0;

  tasks.forEach(task => {
    totalVariance += task.variancePercent;

    if (Math.abs(task.variancePercent) <= ACCURACY_THRESHOLD) {
      accurate++;
    } else if (task.variancePercent > 0) {
      underestimated++; // took longer = user underestimated time needed
    } else {
      overestimated++; // finished faster = user overestimated time needed
    }
  });

  const averageVariance = totalVariance / tasks.length;

  let pattern: 'optimistic' | 'accurate' | 'pessimistic';
  if (Math.abs(averageVariance) <= ACCURACY_THRESHOLD) {
    pattern = 'accurate';
  } else if (averageVariance > 0) {
    pattern = 'optimistic'; // user is optimistic about time (underestimates)
  } else {
    pattern = 'pessimistic'; // user is pessimistic about time (overestimates)
  }

  return {
    averageVariance,
    overestimatedCount: overestimated,
    underestimatedCount: underestimated,
    accurateCount: accurate,
    pattern,
  };
}

/**
 * Analyze effort distribution patterns
 */
export function analyzeEffortPatterns(tasks: CompletedTaskMetric[]): EffortPatterns {
  const result: EffortPatterns = {
    easyCount: 0,
    okayCount: 0,
    hardCount: 0,
    hardTasksTimeRatio: 0,
    totalWithFeedback: 0,
  };

  if (tasks.length === 0) return result;

  let totalTimeWithFeedback = 0;
  let hardTasksTime = 0;

  tasks.forEach(task => {
    if (task.effort) {
      result.totalWithFeedback++;
      totalTimeWithFeedback += task.actualSeconds;

      switch (task.effort) {
        case 'easy':
          result.easyCount++;
          break;
        case 'okay':
          result.okayCount++;
          break;
        case 'hard':
          result.hardCount++;
          hardTasksTime += task.actualSeconds;
          break;
      }
    }
  });

  if (totalTimeWithFeedback > 0) {
    result.hardTasksTimeRatio = (hardTasksTime / totalTimeWithFeedback) * 100;
  }

  return result;
}

/**
 * Calculate completion velocity metrics
 */
export function calculateCompletionVelocity(tasks: CompletedTaskMetric[]): CompletionVelocity {
  if (tasks.length === 0) {
    return {
      tasksPerDay: 0,
      averageTimePerTask: 0,
      fastestTask: null,
      slowestTask: null,
    };
  }

  const totalTime = tasks.reduce((sum, t) => sum + t.actualSeconds, 0);
  const averageTimePerTask = totalTime / tasks.length;

  // Calculate date range
  const dates = tasks.map(t => new Date(t.completedAt).getTime());
  const firstDate = Math.min(...dates);
  const lastDate = Math.max(...dates);
  const daySpan = Math.max(1, Math.ceil((lastDate - firstDate) / (1000 * 60 * 60 * 24)));
  const tasksPerDay = tasks.length / daySpan;

  // Find fastest and slowest (by variance from estimate, not absolute time)
  const sortedByVariance = [...tasks].sort((a, b) => a.variancePercent - b.variancePercent);

  return {
    tasksPerDay,
    averageTimePerTask,
    fastestTask: sortedByVariance[0] || null, // most under estimate
    slowestTask: sortedByVariance[sortedByVariance.length - 1] || null, // most over estimate
  };
}

/**
 * Calculate total time spent on completed tasks
 */
export function calculateTotalTimeFromMetrics(tasks: CompletedTaskMetric[]): number {
  return tasks.reduce((sum, t) => sum + t.actualSeconds, 0);
}

/**
 * Calculate plan progress percentage
 */
export function calculatePlanProgressPercent(planData: any): number {
  if (!planData?.weeks) return 0;

  let total = 0;
  let completed = 0;

  planData.weeks.forEach((week: any) => {
    week.tasks.forEach((task: any) => {
      total++;
      if (task.execution_state === 'done' || task.completed) {
        completed++;
      }
    });
  });

  return total > 0 ? Math.round((completed / total) * 100) : 0;
}

/**
 * Compile all execution metrics
 */
export function compileExecutionMetrics(planData: any): ExecutionMetrics {
  const completedTasks = getCompletedTasksWithMetrics(planData);
  
  return {
    completedTasks,
    estimationAccuracy: calculateEstimationAccuracy(completedTasks),
    effortPatterns: analyzeEffortPatterns(completedTasks),
    completionVelocity: calculateCompletionVelocity(completedTasks),
    totalTimeSpent: calculateTotalTimeFromMetrics(completedTasks),
    planProgress: calculatePlanProgressPercent(planData),
  };
}

/**
 * Generate a version hash for execution state (for cache validation)
 */
export function generateExecutionVersion(planData: any): string {
  if (!planData?.weeks) return '';

  const completedTasksData = planData.weeks.flatMap((week: any, wi: number) =>
    week.tasks
      .filter((t: any) => (t.execution_state === 'done' || t.completed) && t.time_spent_seconds > 0)
      .map((t: any, ti: number) => `${wi}-${ti}-${t.time_spent_seconds}`)
  );

  return completedTasksData.join('|');
}

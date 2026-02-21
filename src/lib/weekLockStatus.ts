/**
 * Week Lock Status Utility
 * 
 * Determines if weeks/tasks are locked based on sequential progression.
 * A week is locked if it comes after the first incomplete week.
 */

interface Week {
  week: number;
  tasks: {
    completed?: boolean;
    execution_state?: 'idle' | 'doing' | 'paused' | 'done';
  }[];
}

interface PlanData {
  weeks: Week[];
}

/**
 * Get the index of the first incomplete week (the "active" week)
 * Returns -1 if all weeks are complete
 */
export function getActiveWeekIndex(plan: PlanData | null | undefined): number {
  if (!plan?.weeks) return -1;
  
  for (let i = 0; i < plan.weeks.length; i++) {
    const hasIncompleteTasks = plan.weeks[i].tasks.some(
      t => t.execution_state !== 'done' && !t.completed
    );
    if (hasIncompleteTasks) return i;
  }
  return -1; // All complete
}

/**
 * Check if a specific week is locked
 * Locked = comes after the first incomplete week
 */
export function isWeekLocked(plan: PlanData | null | undefined, weekIndex: number): boolean {
  const activeWeekIndex = getActiveWeekIndex(plan);
  if (activeWeekIndex === -1) return false; // All complete, nothing locked
  return weekIndex > activeWeekIndex;
}

/**
 * Check if a specific task is in a locked week
 */
export function isTaskInLockedWeek(plan: PlanData | null | undefined, weekIndex: number): boolean {
  return isWeekLocked(plan, weekIndex);
}

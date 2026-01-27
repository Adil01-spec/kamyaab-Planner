/**
 * Get tasks that are specifically scheduled for today via the calendar
 * 
 * This filters tasks based on their scheduledAt date matching today's local date.
 */

import { getScheduledCalendarTasks } from '@/hooks/useCalendarStatus';
import { startOfDay, endOfDay, parseISO, isWithinInterval } from 'date-fns';
import { isTaskInLockedWeek } from '@/lib/weekLockStatus';

interface Task {
  title: string;
  priority: 'High' | 'Medium' | 'Low';
  estimated_hours: number;
  completed?: boolean;
  completed_at?: string;
  scheduled_at?: string;
  /** execution_state is the source of truth for task state */
  execution_state?: 'pending' | 'doing' | 'done';
  /** @deprecated Use execution_state instead */
  execution_status?: 'idle' | 'doing' | 'done';
  execution_started_at?: string;
  time_spent_seconds?: number;
  explanation?: {
    how: string;
    why: string;
    expected_outcome: string;
  };
}

export type TodayTask = Task;

interface Week {
  week: number;
  focus: string;
  tasks: Task[];
}

interface PlanData {
  weeks: Week[];
}

export interface ScheduledTodayTask {
  task: Task;
  weekIndex: number;
  taskIndex: number;
  weekFocus: string;
  scheduledAt: string;
}

/**
 * Get all tasks scheduled for today (local time)
 */
export function getTasksScheduledForToday(plan: PlanData): ScheduledTodayTask[] {
  if (!plan?.weeks || plan.weeks.length === 0) {
    return [];
  }

  const scheduledTasks = getScheduledCalendarTasks();
  const today = new Date();
  const todayStart = startOfDay(today);
  const todayEnd = endOfDay(today);

  const tasksForToday: ScheduledTodayTask[] = [];

  for (const scheduled of scheduledTasks) {
    const { weekNumber, taskIndex, scheduledAt } = scheduled;
    const weekIndex = weekNumber - 1; // Convert 1-indexed week to 0-indexed

    // Validate week and task exist
    if (weekIndex < 0 || weekIndex >= plan.weeks.length) continue;
    const week = plan.weeks[weekIndex];
    if (!week?.tasks || taskIndex < 0 || taskIndex >= week.tasks.length) continue;

    // Skip tasks in locked weeks - they should not be actionable on /today
    if (isTaskInLockedWeek(plan, weekIndex)) continue;

    // Check if scheduledAt is today (local time)
    try {
      const scheduledDate = parseISO(scheduledAt);
      if (isWithinInterval(scheduledDate, { start: todayStart, end: todayEnd })) {
        tasksForToday.push({
          task: week.tasks[taskIndex],
          weekIndex,
          taskIndex,
          weekFocus: week.focus,
          scheduledAt,
        });
      }
    } catch {
      // Skip invalid dates
      continue;
    }
  }

  // Sort by scheduled time
  tasksForToday.sort((a, b) => {
    return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
  });

  return tasksForToday;
}

/**
 * Check if there are any tasks scheduled for today
 */
export function hasTasksScheduledForToday(plan: PlanData): boolean {
  return getTasksScheduledForToday(plan).length > 0;
}

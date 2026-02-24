// Plan Completion Detection, Analytics, and Memory Builder

import { supabase } from '@/integrations/supabase/client';
import { differenceInDays } from 'date-fns';

export interface CompletionAnalytics {
  totalTimeSpentSeconds: number;
  totalHoursTracked: number;
  averageDailyExecutionMinutes: number;
  longestSession: { taskTitle: string; seconds: number } | null;
  mostWorkedTask: { taskTitle: string; seconds: number } | null;
  totalExecutionSessions: number;
  totalDaysActive: number;
  totalTasks: number;
  completionRate: number;
}

export interface PlanMemory {
  plan_id: string;
  total_time_spent: number;
  total_days_taken: number;
  average_daily_time: number;
  most_worked_task: string;
  /**
   * Deterministic completion speed:
   * - If plan has total_weeks (defined duration):
   *   planned_duration = total_weeks * 7
   *   total_days_taken < planned_duration → 'faster'
   *   total_days_taken === planned_duration → 'on_time'
   *   total_days_taken > planned_duration → 'slower'
   * - If no total_weeks or is_open_ended → field is omitted entirely.
   */
  completion_speed?: 'faster' | 'on_time' | 'slower';
  /**
   * Execution consistency formula:
   * consistency = Math.round((active_execution_days / total_days_taken) * 100)
   * where active_execution_days = number of unique calendar dates with completed tasks.
   * Clamped to 0-100.
   */
  execution_consistency_score: number;
  completed_at: string;
}

/** Check if plan has already been marked completed */
export function isPlanCompleted(planData: any): boolean {
  return !!planData?.completed_at;
}

/** Check if every task across all weeks has completed === true */
export function checkAllTasksCompleted(planData: any): boolean {
  if (!planData?.weeks || !Array.isArray(planData.weeks)) return false;

  for (const week of planData.weeks) {
    if (!week?.tasks || !Array.isArray(week.tasks)) return false;
    for (const task of week.tasks) {
      if (!task.completed) return false;
    }
  }
  return true;
}

/** Calculate detailed completion analytics */
export function calculateCompletionAnalytics(
  planData: any,
  planCreatedAt: string
): CompletionAnalytics {
  const completedAt = planData.completed_at || new Date().toISOString();
  const allTasks: Array<{ title: string; time_spent_seconds: number }> = [];

  let totalTimeSpent = 0;
  let totalSessions = 0;
  let longestSession: { taskTitle: string; seconds: number } | null = null;
  let mostWorkedTask: { taskTitle: string; seconds: number } | null = null;

  for (const week of planData.weeks || []) {
    for (const task of week.tasks || []) {
      const timeSpent = task.time_spent_seconds || 0;
      totalTimeSpent += timeSpent;
      
      if (timeSpent > 0) {
        totalSessions++;
      }

      allTasks.push({ title: task.title, time_spent_seconds: timeSpent });

      if (!longestSession || timeSpent > longestSession.seconds) {
        longestSession = { taskTitle: task.title, seconds: timeSpent };
      }

      if (!mostWorkedTask || timeSpent > mostWorkedTask.seconds) {
        mostWorkedTask = { taskTitle: task.title, seconds: timeSpent };
      }
    }
  }

  const totalDaysActive = Math.max(1, differenceInDays(new Date(completedAt), new Date(planCreatedAt)));
  const totalTasks = allTasks.length;
  const completedTasks = allTasks.length; // All tasks are completed
  const averageDailySeconds = totalTimeSpent / totalDaysActive;

  return {
    totalTimeSpentSeconds: totalTimeSpent,
    totalHoursTracked: Math.round((totalTimeSpent / 3600) * 10) / 10,
    averageDailyExecutionMinutes: Math.round(averageDailySeconds / 60),
    longestSession: longestSession?.seconds ? longestSession : null,
    mostWorkedTask: mostWorkedTask?.seconds ? mostWorkedTask : null,
    totalExecutionSessions: totalSessions,
    totalDaysActive,
    totalTasks,
    completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
  };
}

/**
 * Extract unique active execution dates from task timestamps.
 * Counts unique calendar dates where a task was completed (completed_at).
 */
function countActiveExecutionDays(planData: any): number {
  const uniqueDates = new Set<string>();

  for (const week of planData.weeks || []) {
    for (const task of week.tasks || []) {
      // Use completed_at as primary signal for active day
      if (task.completed_at) {
        try {
          const dateStr = new Date(task.completed_at).toISOString().slice(0, 10);
          uniqueDates.add(dateStr);
        } catch {
          // Skip invalid dates
        }
      }
    }
  }

  return uniqueDates.size;
}

/** Build structured plan memory for AI context (no raw descriptions) */
export function buildPlanMemory(
  planData: any,
  planCreatedAt: string,
  planId: string
): PlanMemory {
  const analytics = calculateCompletionAnalytics(planData, planCreatedAt);
  const completedAt = planData.completed_at || new Date().toISOString();
  const totalDays = analytics.totalDaysActive;

  // -------------------------------------------------------
  // Deterministic completion_speed logic:
  // Only set if plan has a defined duration (total_weeks and not open-ended).
  // planned_duration = total_weeks * 7
  // total_days_taken < planned_duration → 'faster'
  // total_days_taken === planned_duration → 'on_time'
  // total_days_taken > planned_duration → 'slower'
  // If no total_weeks or is_open_ended → omit entirely.
  // -------------------------------------------------------
  let completionSpeed: 'faster' | 'on_time' | 'slower' | undefined;
  const totalWeeks = planData.total_weeks;
  const isOpenEnded = planData.is_open_ended === true;

  if (totalWeeks && !isOpenEnded) {
    const plannedDuration = totalWeeks * 7;
    if (totalDays < plannedDuration) {
      completionSpeed = 'faster';
    } else if (totalDays === plannedDuration) {
      completionSpeed = 'on_time';
    } else {
      completionSpeed = 'slower';
    }
  }
  // If no total_weeks or open-ended, completionSpeed stays undefined (omitted)

  // -------------------------------------------------------
  // Execution consistency formula:
  // consistency = (active_execution_days / total_days_taken) * 100
  // active_execution_days = unique calendar dates with completed tasks
  // Clamped to 0-100.
  // -------------------------------------------------------
  const activeExecutionDays = countActiveExecutionDays(planData);
  const consistencyScore = totalDays > 0
    ? Math.min(100, Math.round((activeExecutionDays / totalDays) * 100))
    : 0;

  const memory: PlanMemory = {
    plan_id: planId,
    total_time_spent: analytics.totalTimeSpentSeconds,
    total_days_taken: totalDays,
    average_daily_time: Math.round(analytics.averageDailyExecutionMinutes),
    most_worked_task: analytics.mostWorkedTask?.taskTitle || 'Unknown',
    execution_consistency_score: consistencyScore,
    completed_at: completedAt,
  };

  // Only include completion_speed if it was computed
  if (completionSpeed !== undefined) {
    memory.completion_speed = completionSpeed;
  }

  return memory;
}

/**
 * Save plan memory to user profile as a rolling array (max 5 entries).
 * Fetches existing plan_memory, appends new entry, keeps last 5.
 * Consent-based — only called when user explicitly agrees.
 */
export async function savePlanMemory(
  userId: string,
  memory: PlanMemory
): Promise<boolean> {
  try {
    // Fetch existing plan_memory array
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('plan_memory')
      .eq('id', userId)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching plan memory:', fetchError);
      return false;
    }

    // Parse existing as array, default to empty
    let existingMemory: PlanMemory[] = [];
    if (profile?.plan_memory) {
      if (Array.isArray(profile.plan_memory)) {
        existingMemory = profile.plan_memory as unknown as PlanMemory[];
      } else if (typeof profile.plan_memory === 'object') {
        // Migrate single legacy object to array
        existingMemory = [profile.plan_memory as unknown as PlanMemory];
      }
    }

    // Append new entry and keep only last 5 (rolling window)
    existingMemory.push(memory);
    const rollingMemory = existingMemory.slice(-5);

    const { error } = await supabase
      .from('profiles')
      .update({ plan_memory: rollingMemory as any })
      .eq('id', userId);

    if (error) {
      console.error('Error saving plan memory:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error saving plan memory:', err);
    return false;
  }
}

/**
 * Clear all stored execution memory (consent revocation).
 * Sets plan_memory to null. Can be called from settings UI (future).
 * TODO: Wire into settings page with "Clear execution memory" button.
 */
export async function clearExecutionMemory(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ plan_memory: null })
      .eq('id', userId);

    if (error) {
      console.error('Error clearing execution memory:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error clearing execution memory:', err);
    return false;
  }
}

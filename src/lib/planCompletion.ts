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
  completion_speed: 'faster' | 'on_time' | 'slower';
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

/** Build structured plan memory for AI context (no raw descriptions) */
export function buildPlanMemory(
  planData: any,
  planCreatedAt: string,
  planId: string
): PlanMemory {
  const analytics = calculateCompletionAnalytics(planData, planCreatedAt);
  const completedAt = planData.completed_at || new Date().toISOString();
  const totalDays = analytics.totalDaysActive;
  const expectedDays = (planData.total_weeks || 4) * 7;

  // Determine completion speed
  let completionSpeed: 'faster' | 'on_time' | 'slower';
  if (totalDays < expectedDays * 0.8) {
    completionSpeed = 'faster';
  } else if (totalDays <= expectedDays * 1.2) {
    completionSpeed = 'on_time';
  } else {
    completionSpeed = 'slower';
  }

  // Calculate execution consistency (0-100)
  // Based on how many tasks had meaningful time tracked
  const tasksWithTime = analytics.totalExecutionSessions;
  const totalTasks = analytics.totalTasks;
  const consistencyScore = totalTasks > 0
    ? Math.round((tasksWithTime / totalTasks) * 100)
    : 0;

  return {
    plan_id: planId,
    total_time_spent: analytics.totalTimeSpentSeconds,
    total_days_taken: totalDays,
    average_daily_time: Math.round(analytics.averageDailyExecutionMinutes),
    most_worked_task: analytics.mostWorkedTask?.taskTitle || 'Unknown',
    completion_speed: completionSpeed,
    execution_consistency_score: consistencyScore,
    completed_at: completedAt,
  };
}

/** Save plan memory to user profile (consent-based) */
export async function savePlanMemory(
  userId: string,
  memory: PlanMemory
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ plan_memory: memory as any })
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

// Execution Timer - Task state management with persistence

import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';
import { isTaskInLockedWeek } from '@/lib/weekLockStatus';

export type TaskExecutionStatus = 'idle' | 'doing' | 'paused' | 'done';

export interface TaskExecutionState {
  status: TaskExecutionStatus;
  started_at: string | null;
  completed_at: string | null;
  time_spent_seconds: number;
}

export interface ActiveTimerState {
  weekIndex: number;
  taskIndex: number;
  taskTitle: string;
  started_at: string;
  elapsed_seconds: number;
  accumulated_seconds: number;
}

/**
 * Normalize legacy execution_state values to the new 4-state model.
 * Maps 'pending' -> 'paused' (if time spent) or 'idle' (if not).
 * Handles missing/undefined values for legacy tasks.
 */
export function normalizeExecutionState(
  task: { execution_state?: string; completed?: boolean; time_spent_seconds?: number }
): TaskExecutionStatus {
  const state = task.execution_state;
  if (state === 'doing') return 'doing';
  if (state === 'done') return 'done';
  if (state === 'paused') return 'paused';
  if (state === 'idle') return 'idle';
  // Legacy migration: 'pending' or missing
  if (state === 'pending') {
    return (task.time_spent_seconds ?? 0) > 0 ? 'paused' : 'idle';
  }
  // No execution_state at all (legacy tasks)
  return task.completed ? 'done' : 'idle';
}

// Get the active timer from localStorage (for quick access before Supabase sync)
export function getLocalActiveTimer(): ActiveTimerState | null {
  try {
    const stored = localStorage.getItem('kaamyab_active_timer');
    if (!stored) return null;
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

// Set the active timer in localStorage
export function setLocalActiveTimer(timer: ActiveTimerState | null): void {
  if (timer) {
    localStorage.setItem('kaamyab_active_timer', JSON.stringify(timer));
  } else {
    localStorage.removeItem('kaamyab_active_timer');
  }
}

// Calculate elapsed time since timer started
export function calculateElapsedSeconds(startedAt: string): number {
  const start = new Date(startedAt).getTime();
  const now = Date.now();
  return Math.floor((now - start) / 1000);
}

// Format seconds to human-readable string (HH:MM:SS)
export function formatTimerDisplay(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  const pad = (n: number) => n.toString().padStart(2, '0');
  
  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
  }
  return `${pad(minutes)}:${pad(secs)}`;
}

// Format total time spent to friendly string (e.g., "2h 15m")
export function formatTotalTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

// Format total time for completion summary
export function formatCompletionTime(seconds: number): { hours: number; minutes: number } {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return { hours, minutes };
}

// Get execution state for a specific task from plan data
export function getTaskExecutionState(
  planData: any,
  weekIndex: number,
  taskIndex: number
): TaskExecutionState {
  const task = planData?.weeks?.[weekIndex]?.tasks?.[taskIndex];

  if (!task) {
    return {
      status: 'idle',
      started_at: null,
      completed_at: null,
      time_spent_seconds: 0,
    };
  }

  const status = normalizeExecutionState(task);

  return {
    status,
    started_at: task.execution_started_at || null,
    completed_at: task.completed_at || null,
    time_spent_seconds: task.time_spent_seconds || 0,
  };
}

// Find the currently active task (status = 'doing')
export function findActiveTask(planData: any): {
  weekIndex: number;
  taskIndex: number;
  task: any;
} | null {
  if (!planData?.weeks) return null;

  for (let weekIndex = 0; weekIndex < planData.weeks.length; weekIndex++) {
    const week = planData.weeks[weekIndex];
    if (!week?.tasks) continue;

    for (let taskIndex = 0; taskIndex < week.tasks.length; taskIndex++) {
      const task = week.tasks[taskIndex];
      if (task.execution_state === 'doing') {
        return { weekIndex, taskIndex, task };
      }
    }
  }

  return null;
}

// Calculate total time spent across all tasks
export function calculateTotalTimeSpent(planData: any): number {
  if (!planData?.weeks) return 0;
  
  let total = 0;
  for (const week of planData.weeks) {
    if (!week?.tasks) continue;
    for (const task of week.tasks) {
      total += task.time_spent_seconds || 0;
    }
  }
  return total;
}

// Check if all tasks are completed
export function areAllTasksCompleted(planData: any): boolean {
  if (!planData?.weeks) return false;
  
  for (const week of planData.weeks) {
    if (!week?.tasks) continue;
    for (const task of week.tasks) {
      const state = normalizeExecutionState(task);
      if (state !== 'done') {
        return false;
      }
    }
  }
  return true;
}

// Shallow clone plan with targeted task update (avoids JSON.parse(JSON.stringify()))
export function shallowClonePlanWithTaskUpdate(
  planData: any,
  weekIndex: number,
  taskIndex: number,
  updates: Record<string, any>
): any {
  const weeks = [...planData.weeks];
  const week = { ...weeks[weekIndex], tasks: [...weeks[weekIndex].tasks] };
  week.tasks[taskIndex] = { ...week.tasks[taskIndex], ...updates };
  weeks[weekIndex] = week;
  return { ...planData, weeks };
}

// Shallow clone with multiple task updates (for auto-pause + start)
export function shallowClonePlanWithMultiTaskUpdate(
  planData: any,
  updates: Array<{ weekIndex: number; taskIndex: number; changes: Record<string, any> }>
): any {
  const weeks = [...planData.weeks];
  for (const { weekIndex, taskIndex, changes } of updates) {
    if (weeks[weekIndex] === planData.weeks[weekIndex]) {
      weeks[weekIndex] = { ...weeks[weekIndex], tasks: [...weeks[weekIndex].tasks] };
    }
    weeks[weekIndex].tasks[taskIndex] = { ...weeks[weekIndex].tasks[taskIndex], ...changes };
  }
  return { ...planData, weeks };
}

// Persist plan to database (fire-and-forget helper)
export async function persistPlanToDb(
  userId: string,
  plan: any
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('plans')
      .update({ plan_json: plan as unknown as Json })
      .eq('user_id', userId);
    if (error) {
      console.error('Error persisting plan:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    console.error('Error persisting plan:', err);
    return { success: false, error: 'Unknown error' };
  }
}

// Update task execution state in plan data
export async function updateTaskExecution(
  userId: string,
  planData: any,
  weekIndex: number,
  taskIndex: number,
  updates: Partial<{
    execution_state: TaskExecutionStatus;
    execution_started_at: string | null;
    completed_at: string | null;
    time_spent_seconds: number;
    completed: boolean;
  }>
): Promise<{ success: boolean; updatedPlan: any; error?: string }> {
  try {
    const updatedPlan = shallowClonePlanWithTaskUpdate(planData, weekIndex, taskIndex, updates);
    const result = await persistPlanToDb(userId, updatedPlan);
    if (!result.success) {
      return { success: false, updatedPlan: planData, error: result.error };
    }
    return { success: true, updatedPlan };
  } catch (err) {
    console.error('Error updating task execution:', err);
    return { success: false, updatedPlan: planData, error: 'Unknown error' };
  }
}

// Start a task (set status to 'doing')
export async function startTask(
  userId: string,
  planData: any,
  weekIndex: number,
  taskIndex: number
): Promise<{ success: boolean; updatedPlan: any; error?: string }> {
  // Guard against starting tasks in locked weeks
  if (isTaskInLockedWeek(planData, weekIndex)) {
    return { 
      success: false, 
      updatedPlan: planData, 
      error: 'Cannot start task in locked week' 
    };
  }

  // First, pause any currently active task
  const activeTask = findActiveTask(planData);
  let currentPlan = planData;
  
  if (activeTask) {
    const elapsed = calculateElapsedSeconds(activeTask.task.execution_started_at);
    const result = await updateTaskExecution(
      userId,
      currentPlan,
      activeTask.weekIndex,
      activeTask.taskIndex,
      {
        execution_state: 'paused',
        execution_started_at: null,
        time_spent_seconds: (activeTask.task.time_spent_seconds || 0) + elapsed,
      }
    );
    
    if (!result.success) {
      return result;
    }
    currentPlan = result.updatedPlan;
  }
  
  // Now start the new task
  const now = new Date().toISOString();
  const result = await updateTaskExecution(
    userId,
    currentPlan,
    weekIndex,
    taskIndex,
     {
       execution_state: 'doing',
       execution_started_at: now,
     }
  );
  
  if (result.success) {
    // Update local timer
    const task = result.updatedPlan.weeks[weekIndex]?.tasks?.[taskIndex];
    setLocalActiveTimer({
      weekIndex,
      taskIndex,
      taskTitle: task?.title || 'Task',
      started_at: now,
      elapsed_seconds: 0,
      accumulated_seconds: task?.time_spent_seconds || 0,
    });
  }
  
  return result;
}

// Complete a task (set status to 'done')
export async function completeTask(
  userId: string,
  planData: any,
  weekIndex: number,
  taskIndex: number
): Promise<{ success: boolean; updatedPlan: any; timeSpent: number; error?: string }> {
  // Guard against completing tasks in locked weeks
  if (isTaskInLockedWeek(planData, weekIndex)) {
    return { 
      success: false, 
      updatedPlan: planData, 
      timeSpent: 0,
      error: 'Cannot complete task in locked week' 
    };
  }

  const task = planData.weeks?.[weekIndex]?.tasks?.[taskIndex];
  
  if (!task) {
    return { success: false, updatedPlan: planData, timeSpent: 0, error: 'Task not found' };
  }
  
  // Calculate final time spent
  let timeSpent = task.time_spent_seconds || 0;
  if (task.execution_started_at) {
    timeSpent += calculateElapsedSeconds(task.execution_started_at);
  }
  
  const now = new Date().toISOString();
  const result = await updateTaskExecution(
    userId,
    planData,
    weekIndex,
    taskIndex,
    {
      execution_state: 'done',
      execution_started_at: null,
      completed_at: now,
      time_spent_seconds: timeSpent,
      completed: true,
    }
  );
  
  if (result.success) {
    // Clear local timer
    setLocalActiveTimer(null);
  }
  
  return { ...result, timeSpent };
}

// Pause a task (set status to 'paused', preserve time)
export async function pauseTask(
  userId: string,
  planData: any,
  weekIndex: number,
  taskIndex: number
): Promise<{ success: boolean; updatedPlan: any; error?: string }> {
  const task = planData.weeks?.[weekIndex]?.tasks?.[taskIndex];
  
  if (!task) {
    return { success: false, updatedPlan: planData, error: 'Task not found' };
  }
  
  // Calculate time to add
  let additionalTime = 0;
  if (task.execution_started_at) {
    additionalTime = calculateElapsedSeconds(task.execution_started_at);
  }
  
  const result = await updateTaskExecution(
    userId,
    planData,
    weekIndex,
    taskIndex,
    {
      execution_state: 'paused',
      execution_started_at: null,
      time_spent_seconds: (task.time_spent_seconds || 0) + additionalTime,
    }
  );
  
  if (result.success) {
    setLocalActiveTimer(null);
  }
  
  return result;
}

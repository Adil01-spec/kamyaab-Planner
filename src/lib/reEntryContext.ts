/**
 * Re-Entry Context — Phase 9.8
 * 
 * Calculates days away and last progress date from existing data sources
 * to enable calm, guilt-free re-entry messaging for returning users.
 * 
 * No new storage — reads from:
 * - streakTracker localStorage (lastCompletionDate)
 * - task completed_at timestamps
 * - day_closures array in plan_json
 */

import { getStreakData } from './streakTracker';

export interface ReEntryContext {
  daysAway: number;                    // 0 = active today, 1+ = days since last activity
  lastProgressDate: string | null;     // ISO date of last completion
  lastProgressFormatted: string | null; // Human-readable: "January 28"
  planIntact: boolean;                 // Always true (context preservation)
  showReEntryBanner: boolean;          // True if daysAway >= 2
}

/**
 * Calculate days between two dates (ignoring time)
 */
function daysBetween(date1: Date, date2: Date): number {
  const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Format date as "Month Day" (e.g., "January 28")
 */
function formatProgressDate(dateStr: string): string | null {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    
    const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  } catch {
    return null;
  }
}

/**
 * Extract the most recent completion date from plan data
 */
function getLatestCompletionFromPlan(planData: any): string | null {
  if (!planData?.weeks) return null;
  
  let latestDate: string | null = null;
  let latestTime = 0;
  
  for (const week of planData.weeks) {
    if (!week.tasks) continue;
    
    for (const task of week.tasks) {
      if (task.completed_at) {
        try {
          const time = new Date(task.completed_at).getTime();
          if (time > latestTime) {
            latestTime = time;
            latestDate = task.completed_at;
          }
        } catch {
          continue;
        }
      }
    }
  }
  
  return latestDate;
}

/**
 * Extract the most recent day closure date from plan data
 */
function getLatestDayClosureDate(planData: any): string | null {
  if (!planData?.day_closures?.length) return null;
  
  let latestDate: string | null = null;
  let latestTime = 0;
  
  for (const closure of planData.day_closures) {
    if (closure.closed_at) {
      try {
        const time = new Date(closure.closed_at).getTime();
        if (time > latestTime) {
          latestTime = time;
          latestDate = closure.date; // Use the date field, not closed_at
        }
      } catch {
        continue;
      }
    }
  }
  
  return latestDate;
}

/**
 * Check if user has pending tasks in their plan
 */
function hasPendingTasks(planData: any): boolean {
  if (!planData?.weeks) return false;
  
  for (const week of planData.weeks) {
    if (!week.tasks) continue;
    for (const task of week.tasks) {
      if (!task.completed && task.execution_state !== 'done') {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Calculate re-entry context from available data sources
 * 
 * Priority for last progress:
 * 1. streakTracker lastCompletionDate (most recent task completion)
 * 2. Latest completed_at from plan tasks
 * 3. Latest day_closures date from plan
 */
export function calculateReEntryContext(planData: any): ReEntryContext {
  const today = new Date();
  
  // Gather all potential last activity dates
  const { lastCompletionDate: streakDate } = getStreakData();
  const planCompletionDate = getLatestCompletionFromPlan(planData);
  const dayClosureDate = getLatestDayClosureDate(planData);
  
  // Find the most recent activity date
  let lastProgressDate: string | null = null;
  let latestTime = 0;
  
  const candidates = [streakDate, planCompletionDate, dayClosureDate].filter(Boolean);
  
  for (const dateStr of candidates) {
    if (!dateStr) continue;
    try {
      const time = new Date(dateStr).getTime();
      if (time > latestTime) {
        latestTime = time;
        lastProgressDate = dateStr;
      }
    } catch {
      continue;
    }
  }
  
  // Calculate days away
  let daysAway = 0;
  if (lastProgressDate) {
    try {
      const lastDate = new Date(lastProgressDate);
      daysAway = daysBetween(lastDate, today);
    } catch {
      daysAway = 0;
    }
  }
  
  // Determine if banner should show:
  // - User was away 2+ days
  // - User has a plan with pending tasks
  const hasPending = hasPendingTasks(planData);
  const showReEntryBanner = daysAway >= 2 && hasPending;
  
  return {
    daysAway,
    lastProgressDate,
    lastProgressFormatted: lastProgressDate ? formatProgressDate(lastProgressDate) : null,
    planIntact: true, // Always true — we never auto-fix
    showReEntryBanner,
  };
}

/**
 * Get appropriate welcome-back message based on days away
 * All messages are calm, factual, and non-judgmental
 */
export function getReEntryMessage(daysAway: number): string {
  if (daysAway >= 7) {
    return "No rush. Pick up where you left off.";
  } else if (daysAway >= 4) {
    return "Your plan is still here — nothing broke.";
  } else {
    return "Welcome back. Let's continue when you're ready.";
  }
}

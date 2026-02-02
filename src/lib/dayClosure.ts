/**
 * Day Closure Logic (Phase 9.7)
 * 
 * Provides summary calculations and acknowledgement generation
 * for end-of-day closure. All language is factual and non-comparative.
 */

// Types
export interface DaySummary {
  completed: number;
  partial: number;
  deferred: number;
  total_time_seconds: number;
}

export interface DayClosure {
  date: string;                    // ISO date (YYYY-MM-DD)
  closed_at: string;               // ISO timestamp
  summary: DaySummary;
  reflection?: string;             // Optional user reflection (max 200 chars)
  reflection_prompt?: string;      // Which prompt was shown
}

interface TaskData {
  execution_state?: 'pending' | 'doing' | 'done';
  completed?: boolean;
  partial_progress?: 'some' | 'most' | 'almost';
  deferred_to?: string;
  time_spent_seconds?: number;
  scheduled_at?: string;
}

// Reflection prompts for day closure (non-intrusive, reflective)
export const closureReflectionPrompts = [
  "Anything that made today harder than expected?",
  "What helped you stay focused today?",
  "What would you do differently tomorrow?",
  "Any surprise wins worth noting?",
  "What's one thing you learned today?",
];

/**
 * Get today's reflection prompt (consistent per day)
 */
export function getTodayReflectionPrompt(): string {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return closureReflectionPrompts[dayOfYear % closureReflectionPrompts.length];
}

/**
 * Calculate day summary from scheduled tasks
 */
export function calculateDaySummary(scheduledTasks: TaskData[]): DaySummary {
  let completed = 0;
  let partial = 0;
  let deferred = 0;
  let total_time_seconds = 0;

  const today = new Date().toISOString().split('T')[0];

  for (const task of scheduledTasks) {
    // Count completed tasks
    if (task.execution_state === 'done' || task.completed) {
      completed++;
    }
    // Count partial progress (not done but has progress)
    else if (task.partial_progress) {
      partial++;
    }
    // Count deferred tasks (deferred to future date)
    else if (task.deferred_to && task.deferred_to > today) {
      deferred++;
    }

    // Sum time spent
    if (task.time_spent_seconds) {
      total_time_seconds += task.time_spent_seconds;
    }
  }

  return { completed, partial, deferred, total_time_seconds };
}

/**
 * Generate effort acknowledgement based on day summary
 * 
 * Rules:
 * - Never use comparisons ("better than yesterday")
 * - No motivation clichés ("You crushed it!")
 * - Purely observational and respectful
 */
export function generateAcknowledgement(summary: DaySummary): string {
  const { completed, partial, deferred, total_time_seconds } = summary;
  const totalTasks = completed + partial + deferred;
  const hoursSpent = total_time_seconds / 3600;

  // Priority order for acknowledgement selection
  
  // All tasks completed
  if (totalTasks > 0 && completed === totalTasks && deferred === 0 && partial === 0) {
    return "Everything on your list, done.";
  }

  // High focus time (>3h)
  if (hoursSpent >= 3) {
    return "A solid day of focused work.";
  }

  // Some deferrals made
  if (deferred > 0 && completed > 0) {
    return "You adjusted as needed — that's realistic planning.";
  }

  // Only deferrals, no completions
  if (deferred > 0 && completed === 0) {
    return "Some days are about preparation, not completion.";
  }

  // Partial progress exists
  if (partial > 0) {
    return "Progress made — completion isn't always the goal.";
  }

  // Light day (<1h)
  if (hoursSpent < 1 && hoursSpent > 0) {
    return "Sometimes lighter days are what you need.";
  }

  // No completions at all
  if (completed === 0 && totalTasks > 0) {
    return "Some days are about preparation, not completion.";
  }

  // Default: some completions
  if (completed > 0) {
    return "Another day of steady progress.";
  }

  // Fallback
  return "Day complete.";
}

/**
 * Format time for display
 */
export function formatTimeSpent(seconds: number): string {
  if (seconds === 0) return '';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m focused`;
  } else if (hours > 0) {
    return `${hours}h focused`;
  } else if (minutes > 0) {
    return `${minutes}m focused`;
  }
  return '';
}

/**
 * Format summary for display (neutral, factual)
 */
export function formatSummaryText(summary: DaySummary): string {
  const parts: string[] = [];
  
  if (summary.completed > 0) {
    parts.push(`${summary.completed} done`);
  }
  if (summary.partial > 0) {
    parts.push(`${summary.partial} in progress`);
  }
  if (summary.deferred > 0) {
    parts.push(`${summary.deferred} moved`);
  }
  
  if (parts.length === 0) {
    return 'No tasks today';
  }
  
  return parts.join(', ');
}

/**
 * Check if day has been closed already
 */
export function isDayClosed(closures: DayClosure[] | undefined, date?: string): boolean {
  if (!closures || closures.length === 0) return false;
  const targetDate = date || new Date().toISOString().split('T')[0];
  return closures.some(c => c.date === targetDate);
}

/**
 * Get closure for a specific date
 */
export function getClosureForDate(closures: DayClosure[] | undefined, date: string): DayClosure | undefined {
  if (!closures) return undefined;
  return closures.find(c => c.date === date);
}

/**
 * Get recent closures (last N days)
 */
export function getRecentClosures(closures: DayClosure[] | undefined, days: number = 7): DayClosure[] {
  if (!closures || closures.length === 0) return [];
  
  // Sort by date descending and take last N
  return [...closures]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, days);
}

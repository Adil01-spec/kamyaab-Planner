const STREAK_KEY = 'kaamyab_streak';
const LAST_COMPLETION_KEY = 'kaamyab_last_completion';

interface StreakData {
  count: number;
  lastCompletionDate: string | null;
}

/**
 * Get today's date as YYYY-MM-DD string
 */
function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get yesterday's date as YYYY-MM-DD string
 */
function getYesterdayString(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
}

/**
 * Load streak data from localStorage
 */
export function getStreakData(): StreakData {
  try {
    const count = parseInt(localStorage.getItem(STREAK_KEY) || '0', 10);
    const lastCompletionDate = localStorage.getItem(LAST_COMPLETION_KEY);
    return { count, lastCompletionDate };
  } catch {
    return { count: 0, lastCompletionDate: null };
  }
}

/**
 * Calculate current streak, resetting silently if a day was missed
 */
export function getCurrentStreak(): number {
  const { count, lastCompletionDate } = getStreakData();
  
  if (!lastCompletionDate) {
    return 0;
  }
  
  const today = getTodayString();
  const yesterday = getYesterdayString();
  
  // If last completion was today or yesterday, streak is valid
  if (lastCompletionDate === today || lastCompletionDate === yesterday) {
    return count;
  }
  
  // Otherwise, streak is broken - reset silently
  localStorage.setItem(STREAK_KEY, '0');
  localStorage.removeItem(LAST_COMPLETION_KEY);
  return 0;
}

/**
 * Record a task completion and update streak
 * Streak increases if this is the first completion of the day
 */
export function recordTaskCompletion(): number {
  const { count, lastCompletionDate } = getStreakData();
  const today = getTodayString();
  const yesterday = getYesterdayString();
  
  // Already completed a task today - no change
  if (lastCompletionDate === today) {
    return count;
  }
  
  let newCount: number;
  
  if (lastCompletionDate === yesterday) {
    // Continuing the streak
    newCount = count + 1;
  } else {
    // Starting fresh (either first time or missed days)
    newCount = 1;
  }
  
  localStorage.setItem(STREAK_KEY, newCount.toString());
  localStorage.setItem(LAST_COMPLETION_KEY, today);
  
  return newCount;
}

/**
 * Check if user has already completed a task today
 */
export function hasCompletedToday(): boolean {
  const { lastCompletionDate } = getStreakData();
  return lastCompletionDate === getTodayString();
}

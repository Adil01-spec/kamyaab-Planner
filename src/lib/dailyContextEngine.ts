/**
 * Daily Context Engine
 * 
 * Pure, deterministic logic that derives daily context from existing data.
 * No database changes, no backend calls - UI + derived state only.
 */

import { getStreakData, hasCompletedToday } from './streakTracker';
import { startOfDay, subDays, parseISO, isAfter, isBefore, isSameDay } from 'date-fns';

export type DayType = 'light' | 'normal' | 'recovery' | 'push';

export interface DailyContext {
  dayType: DayType;
  hasOverdueTasks: boolean;
  recoverySuggested: boolean;
  focusCount: number; // max tasks to visually emphasize
  headline: string;
  subtext: string;
  streakDays: number;
}

interface Task {
  title: string;
  priority: 'High' | 'Medium' | 'Low';
  estimated_hours: number;
  completed?: boolean;
  completed_at?: string;
  scheduled_at?: string;
}

interface Week {
  week: number;
  focus: string;
  tasks: Task[];
}

interface PlanData {
  weeks: Week[];
}

interface ScheduledTask {
  weekNumber: number;
  taskIndex: number;
  scheduledAt: string;
}

/**
 * Check if user completed any tasks yesterday
 */
function didCompleteYesterday(plan: PlanData): boolean {
  const yesterday = startOfDay(subDays(new Date(), 1));
  const today = startOfDay(new Date());
  
  for (const week of plan.weeks) {
    for (const task of week.tasks) {
      if (task.completed && task.completed_at) {
        try {
          const completedDate = parseISO(task.completed_at);
          if (isAfter(completedDate, yesterday) && isBefore(completedDate, today)) {
            return true;
          }
        } catch {
          continue;
        }
      }
    }
  }
  return false;
}

/**
 * Check for overdue tasks (scheduled before today but not completed)
 */
function getOverdueTasks(
  plan: PlanData, 
  scheduledTasks: ScheduledTask[]
): { count: number; titles: string[] } {
  const today = startOfDay(new Date());
  const overdue: string[] = [];
  
  for (const scheduled of scheduledTasks) {
    const { weekNumber, taskIndex, scheduledAt } = scheduled;
    const weekIndex = weekNumber - 1;
    
    if (weekIndex < 0 || weekIndex >= plan.weeks.length) continue;
    const week = plan.weeks[weekIndex];
    if (!week?.tasks || taskIndex < 0 || taskIndex >= week.tasks.length) continue;
    
    const task = week.tasks[taskIndex];
    if (task.completed) continue;
    
    try {
      const scheduledDate = startOfDay(parseISO(scheduledAt));
      if (isBefore(scheduledDate, today) && !isSameDay(scheduledDate, today)) {
        overdue.push(task.title);
      }
    } catch {
      continue;
    }
  }
  
  return { count: overdue.length, titles: overdue };
}

/**
 * Generate contextual headline based on day type
 */
function getHeadline(dayType: DayType, hasOverdueTasks: boolean): string {
  if (hasOverdueTasks) {
    return "Let's clear the backlog first";
  }
  
  switch (dayType) {
    case 'light':
      return "Light focus today";
    case 'recovery':
      return "Recovery day — no pressure";
    case 'push':
      return "Strong momentum — keep it going";
    case 'normal':
    default:
      return "Focused work ahead";
  }
}

/**
 * Generate contextual subtext explaining why
 */
function getSubtext(
  dayType: DayType, 
  streakDays: number, 
  hasOverdueTasks: boolean,
  todayTaskCount: number
): string {
  if (hasOverdueTasks) {
    return "Tackle overdue tasks first to get back on track.";
  }
  
  switch (dayType) {
    case 'light':
      return todayTaskCount <= 2 
        ? "Just a couple of tasks today — quality over quantity."
        : "Fewer tasks highlighted to protect your focus.";
    case 'recovery':
      return "You missed yesterday, but one task today keeps you moving.";
    case 'push':
      return streakDays >= 5 
        ? `${streakDays}-day streak! You're building real momentum.`
        : `${streakDays} days in a row — your consistency is paying off.`;
    case 'normal':
    default:
      return "Steady progress leads to great results.";
  }
}

/**
 * Rule-based fallback explanation generator for tasks without explanations
 */
export function generateFallbackExplanation(taskTitle: string): string {
  const title = taskTitle.toLowerCase();
  
  // Reading-related tasks
  if (title.includes('read') || title.includes('chapter') || title.includes('book')) {
    return "Break it into 10–15 minute reading blocks. Take notes on key points.";
  }
  
  // Writing-related tasks
  if (title.includes('write') || title.includes('draft') || title.includes('document')) {
    return "Start with an outline. Write the first draft without editing — polish later.";
  }
  
  // Research-related tasks
  if (title.includes('research') || title.includes('study') || title.includes('explore')) {
    return "Set a timer. Gather sources first, then synthesize the main findings.";
  }
  
  // Design-related tasks
  if (title.includes('design') || title.includes('mockup') || title.includes('wireframe')) {
    return "Start with rough sketches. Iterate on structure before adding details.";
  }
  
  // Code/development tasks
  if (title.includes('code') || title.includes('build') || title.includes('implement') || title.includes('develop')) {
    return "Break it into small commits. Test as you go. Don't optimize prematurely.";
  }
  
  // Review-related tasks
  if (title.includes('review') || title.includes('feedback') || title.includes('check')) {
    return "Go through systematically. Note issues as you find them, then address in batches.";
  }
  
  // Meeting/call tasks
  if (title.includes('meet') || title.includes('call') || title.includes('discuss')) {
    return "Prepare an agenda beforehand. Take notes for follow-up actions.";
  }
  
  // Planning tasks
  if (title.includes('plan') || title.includes('outline') || title.includes('organize')) {
    return "List all items first, then prioritize. Start with the most impactful areas.";
  }
  
  // Practice/learning tasks
  if (title.includes('practice') || title.includes('learn') || title.includes('exercise')) {
    return "Focus on deliberate practice. Track what's working and what needs adjustment.";
  }
  
  // Create/make tasks
  if (title.includes('create') || title.includes('make') || title.includes('prepare')) {
    return "Start with the core elements. Add refinements once the foundation is solid.";
  }
  
  // Default fallback
  return "Focus on starting — the hardest part is the first 5 minutes. Break it into smaller steps if needed.";
}

/**
 * Main function: Compute daily context from existing data
 * 
 * This is pure and deterministic — same inputs always produce same outputs.
 */
export function computeDailyContext(
  plan: PlanData | null,
  todayTaskCount: number,
  scheduledTasks: ScheduledTask[] = []
): DailyContext {
  // Default context for no plan
  if (!plan || !plan.weeks || plan.weeks.length === 0) {
    return {
      dayType: 'normal',
      hasOverdueTasks: false,
      recoverySuggested: false,
      focusCount: 3,
      headline: "Ready to start",
      subtext: "Create a plan to see your daily focus.",
      streakDays: 0,
    };
  }
  
  // Get streak data
  const { count: streakDays, lastCompletionDate } = getStreakData();
  
  // Check if user skipped yesterday
  const completedYesterday = didCompleteYesterday(plan);
  const yesterday = subDays(new Date(), 1).toISOString().split('T')[0];
  const skippedYesterday = lastCompletionDate !== yesterday && !completedYesterday;
  
  // Check for overdue tasks
  const overdue = getOverdueTasks(plan, scheduledTasks);
  const hasOverdueTasks = overdue.count > 0;
  
  // Determine day type
  let dayType: DayType = 'normal';
  let focusCount = 3;
  
  if (skippedYesterday && !hasCompletedToday()) {
    // User skipped yesterday and hasn't started today
    dayType = 'recovery';
    focusCount = 1; // Just focus on one thing
  } else if (streakDays >= 3) {
    // Good streak going
    dayType = 'push';
    focusCount = 3;
  } else if (todayTaskCount <= 2) {
    // Light day naturally
    dayType = 'light';
    focusCount = todayTaskCount;
  } else if (todayTaskCount > 5) {
    // Too many tasks — auto-cap focus
    focusCount = 3;
  }
  
  // Recovery is suggested if skipped yesterday but not yet in recovery mode
  const recoverySuggested = skippedYesterday && !hasCompletedToday();
  
  return {
    dayType,
    hasOverdueTasks,
    recoverySuggested,
    focusCount,
    headline: getHeadline(dayType, hasOverdueTasks),
    subtext: getSubtext(dayType, streakDays, hasOverdueTasks, todayTaskCount),
    streakDays,
  };
}

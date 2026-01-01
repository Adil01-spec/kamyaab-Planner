/**
 * Smart Task Selection Logic for Today View
 * 
 * Rules (strict):
 * 1. Only tasks from the current active week
 * 2. Only tasks with completed !== true
 * 3. Sort by: Priority (High > Medium > Low), then original order
 * 4. Limit to max 3 tasks
 * 5. Auto carry-forward: skipped tasks from previous days appear here
 */

interface Task {
  title: string;
  priority: 'High' | 'Medium' | 'Low';
  estimated_hours: number;
  completed?: boolean;
  completed_at?: string;
  explanation?: {
    how: string;
    why: string;
    expected_outcome: string;
  };
}

interface Week {
  week: number;
  focus: string;
  tasks: Task[];
}

interface PlanData {
  weeks: Week[];
}

export interface TodayTask {
  task: Task;
  weekIndex: number;
  taskIndex: number;
  weekFocus: string;
}

// Priority weight for sorting
const priorityWeight: Record<string, number> = {
  'High': 3,
  'Medium': 2,
  'Low': 1,
};

/**
 * Get the current active week index
 * Active week = first week with incomplete tasks
 */
function getCurrentWeekIndex(plan: PlanData): number {
  for (let i = 0; i < plan.weeks.length; i++) {
    const hasIncompleteTasks = plan.weeks[i].tasks.some(t => !t.completed);
    if (hasIncompleteTasks) return i;
  }
  // All done - return last week
  return plan.weeks.length - 1;
}

/**
 * Select today's tasks using smart selection logic
 * 
 * This function is deterministic: same input = same output
 */
export function getTodaysTasks(plan: PlanData): TodayTask[] {
  if (!plan?.weeks || plan.weeks.length === 0) {
    return [];
  }

  const currentWeekIndex = getCurrentWeekIndex(plan);
  const currentWeek = plan.weeks[currentWeekIndex];

  if (!currentWeek?.tasks) {
    return [];
  }

  // Get all incomplete tasks from current week with their indices
  const incompleteTasks: TodayTask[] = currentWeek.tasks
    .map((task, taskIndex) => ({
      task,
      weekIndex: currentWeekIndex,
      taskIndex,
      weekFocus: currentWeek.focus,
    }))
    .filter(({ task }) => !task.completed);

  // Sort by priority (High first), then by original order (lower index first)
  incompleteTasks.sort((a, b) => {
    const priorityDiff = priorityWeight[b.task.priority] - priorityWeight[a.task.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return a.taskIndex - b.taskIndex;
  });

  // Limit to max 3 tasks
  return incompleteTasks.slice(0, 3);
}

/**
 * Check if all tasks in the plan are completed
 */
export function isPlanComplete(plan: PlanData): boolean {
  if (!plan?.weeks) return false;
  return plan.weeks.every(week => 
    week.tasks.every(task => task.completed)
  );
}

/**
 * Get progress summary for today
 */
export function getTodayProgress(plan: PlanData): {
  completed: number;
  total: number;
  percent: number;
} {
  const tasks = getTodaysTasks(plan);
  const completed = tasks.filter(t => t.task.completed).length;
  const total = tasks.length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  return { completed, total, percent };
}

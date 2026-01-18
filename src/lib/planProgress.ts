interface Task {
  title: string;
  priority: string;
  estimated_hours: number;
  completed?: boolean;
  execution_state?: 'pending' | 'doing' | 'done';
}

interface Week {
  week: number;
  focus: string;
  tasks: Task[];
}

interface PlanData {
  overview?: string;
  total_weeks?: number;
  milestones?: { title: string; week: number }[];
  weeks?: Week[];
  motivation?: string[];
  is_open_ended?: boolean;
}

export interface PlanProgress {
  completed: number;
  total: number;
  percent: number;
}

/**
 * Check if a task is done using execution_state as primary source.
 * Falls back to completed boolean for legacy data.
 */
function isTaskDone(task: Task): boolean {
  // execution_state is the source of truth
  if (task.execution_state === 'done') return true;
  if (task.execution_state === 'pending' || task.execution_state === 'doing') return false;
  // Legacy fallback: only use completed if execution_state is not set
  return task.completed === true;
}

/**
 * Calculate progress from plan data by traversing all weeks and tasks.
 * This is the single source of truth for progress calculation.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function calculatePlanProgress(plan: PlanData | Record<string, any> | null | undefined): PlanProgress {
  if (!plan || !plan.weeks || plan.weeks.length === 0) {
    return { completed: 0, total: 0, percent: 0 };
  }

  let completed = 0;
  let total = 0;

  plan.weeks.forEach(week => {
    if (week.tasks && Array.isArray(week.tasks)) {
      week.tasks.forEach(task => {
        total++;
        if (isTaskDone(task)) {
          completed++;
        }
      });
    }
  });

  return {
    completed,
    total,
    percent: total > 0 ? Math.round((completed / total) * 100) : 0
  };
}

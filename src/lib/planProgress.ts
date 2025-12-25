interface Task {
  title: string;
  priority: string;
  estimated_hours: number;
  completed?: boolean;
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
        if (task.completed) {
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

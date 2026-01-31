import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';
import { toast } from '@/hooks/use-toast';
import { isWeekLocked } from '@/lib/weekLockStatus';

interface Task {
  title: string;
  priority: 'High' | 'Medium' | 'Low';
  estimated_hours: number;
  completed?: boolean;
  execution_state?: 'pending' | 'doing' | 'done';
  [key: string]: any;
}

interface Week {
  week: number;
  focus: string;
  tasks: Task[];
  [key: string]: any;
}

interface PlanData {
  weeks: Week[];
  [key: string]: any;
}

export interface NewTask {
  title: string;
  description?: string;
  priority: 'High' | 'Medium' | 'Low';
  estimated_hours: number;
}

interface UseTaskMutationsProps {
  plan: PlanData | null;
  planId: string | null;
  userId: string | undefined;
  activeTimer?: { weekIndex: number; taskIndex: number } | null;
  onPlanUpdate: (plan: PlanData) => void;
}

interface CanSplitResult {
  allowed: boolean;
  reason?: string;
}

interface UseTaskMutationsReturn {
  addTask: (weekIndex: number, task: NewTask) => Promise<boolean>;
  splitTask: (
    weekIndex: number,
    taskIndex: number,
    task1: { title: string; estimated_hours: number },
    task2: { title: string; estimated_hours: number }
  ) => Promise<boolean>;
  canSplitTask: (weekIndex: number, taskIndex: number) => CanSplitResult;
  isMutating: boolean;
}

/**
 * Hook for manual task mutations (add/split)
 * Follows the same pattern as useCrossWeekTaskMove
 */
export function useTaskMutations({
  plan,
  planId,
  userId,
  activeTimer,
  onPlanUpdate,
}: UseTaskMutationsProps): UseTaskMutationsReturn {
  const [isMutating, setIsMutating] = useState(false);

  /**
   * Add a new task to a specific week
   */
  const addTask = useCallback(async (weekIndex: number, task: NewTask): Promise<boolean> => {
    if (!plan || !planId || !userId) {
      toast({
        title: 'Cannot add task',
        description: 'Plan data not available.',
        variant: 'destructive',
      });
      return false;
    }

    if (weekIndex < 0 || weekIndex >= plan.weeks.length) {
      toast({
        title: 'Invalid week',
        description: 'Selected week does not exist.',
        variant: 'destructive',
      });
      return false;
    }

    setIsMutating(true);

    // Create optimistic update
    const newTask: Task = {
      title: task.title,
      priority: task.priority,
      estimated_hours: task.estimated_hours,
      completed: false,
      execution_state: 'pending',
      // Optional description as explanation
      ...(task.description && { how_to: task.description }),
    };

    const updatedPlan = {
      ...plan,
      weeks: plan.weeks.map((week, idx) => {
        if (idx === weekIndex) {
          return {
            ...week,
            tasks: [...week.tasks, newTask],
          };
        }
        return week;
      }),
    };

    // Optimistic update
    onPlanUpdate(updatedPlan);

    try {
      const { error } = await supabase
        .from('plans')
        .update({ plan_json: updatedPlan as unknown as Json })
        .eq('id', planId)
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: 'Task added',
        description: `"${task.title}" added to Week ${plan.weeks[weekIndex].week}`,
      });

      return true;
    } catch (error) {
      console.error('Error adding task:', error);
      // Rollback
      onPlanUpdate(plan);
      toast({
        title: 'Failed to add task',
        description: 'Please try again.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsMutating(false);
    }
  }, [plan, planId, userId, onPlanUpdate]);

  /**
   * Check if a task can be split
   */
  const canSplitTask = useCallback((weekIndex: number, taskIndex: number): CanSplitResult => {
    if (!plan) {
      return { allowed: false, reason: 'Plan not loaded' };
    }

    const week = plan.weeks[weekIndex];
    if (!week) {
      return { allowed: false, reason: 'Week not found' };
    }

    const task = week.tasks[taskIndex];
    if (!task) {
      return { allowed: false, reason: 'Task not found' };
    }

    // Cannot split tasks in locked weeks
    if (isWeekLocked(plan, weekIndex)) {
      return { allowed: false, reason: 'Cannot split tasks in locked weeks' };
    }

    // Cannot split completed tasks
    if (task.execution_state === 'done' || task.completed) {
      return { allowed: false, reason: 'Cannot split completed tasks' };
    }

    // Cannot split tasks in progress
    if (task.execution_state === 'doing') {
      return { allowed: false, reason: 'Cannot split task in progress' };
    }

    // Cannot split if timer is running on this task
    if (activeTimer?.weekIndex === weekIndex && activeTimer?.taskIndex === taskIndex) {
      return { allowed: false, reason: 'Stop the timer before splitting' };
    }

    return { allowed: true };
  }, [plan, activeTimer]);

  /**
   * Split a task into two
   */
  const splitTask = useCallback(async (
    weekIndex: number,
    taskIndex: number,
    task1: { title: string; estimated_hours: number },
    task2: { title: string; estimated_hours: number }
  ): Promise<boolean> => {
    if (!plan || !planId || !userId) {
      toast({
        title: 'Cannot split task',
        description: 'Plan data not available.',
        variant: 'destructive',
      });
      return false;
    }

    const canSplit = canSplitTask(weekIndex, taskIndex);
    if (!canSplit.allowed) {
      toast({
        title: 'Cannot split task',
        description: canSplit.reason,
        variant: 'destructive',
      });
      return false;
    }

    const originalTask = plan.weeks[weekIndex].tasks[taskIndex];

    setIsMutating(true);

    // Create two new tasks inheriting from original
    const newTask1: Task = {
      title: task1.title,
      priority: originalTask.priority,
      estimated_hours: task1.estimated_hours,
      completed: false,
      execution_state: 'pending',
    };

    const newTask2: Task = {
      title: task2.title,
      priority: originalTask.priority,
      estimated_hours: task2.estimated_hours,
      completed: false,
      execution_state: 'pending',
    };

    // Replace original task with two new tasks
    const updatedPlan = {
      ...plan,
      weeks: plan.weeks.map((week, idx) => {
        if (idx === weekIndex) {
          const newTasks = [...week.tasks];
          // Remove original and insert two new tasks at same position
          newTasks.splice(taskIndex, 1, newTask1, newTask2);
          return {
            ...week,
            tasks: newTasks,
          };
        }
        return week;
      }),
    };

    // Optimistic update
    onPlanUpdate(updatedPlan);

    try {
      const { error } = await supabase
        .from('plans')
        .update({ plan_json: updatedPlan as unknown as Json })
        .eq('id', planId)
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: 'Task split',
        description: `Split into "${task1.title}" and "${task2.title}"`,
      });

      return true;
    } catch (error) {
      console.error('Error splitting task:', error);
      // Rollback
      onPlanUpdate(plan);
      toast({
        title: 'Failed to split task',
        description: 'Please try again.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsMutating(false);
    }
  }, [plan, planId, userId, canSplitTask, onPlanUpdate]);

  return {
    addTask,
    splitTask,
    canSplitTask,
    isMutating,
  };
}

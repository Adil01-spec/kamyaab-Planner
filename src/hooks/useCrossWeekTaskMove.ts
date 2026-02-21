import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Json } from '@/integrations/supabase/types';

interface Task {
  title: string;
  priority: 'High' | 'Medium' | 'Low';
  estimated_hours: number;
  completed?: boolean;
  execution_state?: 'idle' | 'doing' | 'paused' | 'done';
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

interface ActiveTimer {
  weekIndex: number;
  taskIndex: number;
  taskTitle: string;
}

interface MoveTaskParams {
  sourceWeekIndex: number;
  sourceTaskIndex: number;
  destinationWeekIndex: number;
  destinationTaskIndex: number;
}

interface MoveResult {
  success: boolean;
  error?: string;
}

interface CanMoveResult {
  allowed: boolean;
  reason?: string;
}

interface UseCrossWeekTaskMoveOptions {
  plan: PlanData | null;
  planId: string | null;
  userId: string | undefined;
  activeTimer?: ActiveTimer | null;
  onPlanUpdate: (plan: PlanData) => void;
}

interface UseCrossWeekTaskMoveReturn {
  moveTask: (params: MoveTaskParams) => Promise<MoveResult>;
  reorderWithinWeek: (weekIndex: number, reorderedTasks: Task[]) => Promise<void>;
  canMoveTask: (sourceWeekIndex: number, sourceTaskIndex: number) => CanMoveResult;
  isMoving: boolean;
}

/**
 * Hook for managing cross-week task movement with optimistic updates and persistence.
 * 
 * Guardrails:
 * - NO modification to completed, execution_state, or timer data
 * - NO triggering of insights/analysis updates
 * - Blocks movement of tasks with active timer or 'doing' state
 * - Pure array manipulation only
 */
export function useCrossWeekTaskMove({
  plan,
  planId,
  userId,
  activeTimer,
  onPlanUpdate,
}: UseCrossWeekTaskMoveOptions): UseCrossWeekTaskMoveReturn {
  const [isMoving, setIsMoving] = useState(false);
  const originalPlanRef = useRef<PlanData | null>(null);

  /**
   * Check if a task can be moved (safety check for active timer and doing state)
   */
  const canMoveTask = useCallback((sourceWeekIndex: number, sourceTaskIndex: number): CanMoveResult => {
    if (!plan) {
      return { allowed: false, reason: 'No plan available' };
    }

    const task = plan.weeks[sourceWeekIndex]?.tasks[sourceTaskIndex];
    if (!task) {
      return { allowed: false, reason: 'Task not found' };
    }

    // Check if task is currently being worked on
    if (task.execution_state === 'doing') {
      return { allowed: false, reason: 'Complete or pause this task first' };
    }

    // Check if active timer is on this task
    if (
      activeTimer?.weekIndex === sourceWeekIndex &&
      activeTimer?.taskIndex === sourceTaskIndex
    ) {
      return { allowed: false, reason: 'Stop the timer before moving' };
    }

    return { allowed: true };
  }, [plan, activeTimer]);

  /**
   * Move a task from one week to another (or reorder within same week)
   */
  const moveTask = useCallback(async (params: MoveTaskParams): Promise<MoveResult> => {
    const { sourceWeekIndex, sourceTaskIndex, destinationWeekIndex, destinationTaskIndex } = params;

    if (!plan || !userId) {
      return { success: false, error: 'Missing plan or user' };
    }

    // Safety check
    const canMove = canMoveTask(sourceWeekIndex, sourceTaskIndex);
    if (!canMove.allowed) {
      toast({
        title: "Cannot move task",
        description: canMove.reason,
        variant: "destructive",
      });
      return { success: false, error: canMove.reason };
    }

    // Store original plan for rollback
    originalPlanRef.current = JSON.parse(JSON.stringify(plan));

    // Clone plan deeply
    const updatedPlan: PlanData = JSON.parse(JSON.stringify(plan));

    // Remove task from source
    const [movedTask] = updatedPlan.weeks[sourceWeekIndex].tasks.splice(sourceTaskIndex, 1);

    // Insert at destination
    updatedPlan.weeks[destinationWeekIndex].tasks.splice(destinationTaskIndex, 0, movedTask);

    // Optimistic update
    onPlanUpdate(updatedPlan);
    setIsMoving(true);

    try {
      const { error } = await supabase
        .from('plans')
        .update({ plan_json: updatedPlan as unknown as Json })
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      originalPlanRef.current = null;
      return { success: true };
    } catch (error) {
      console.error('Error moving task:', error);

      // Rollback
      if (originalPlanRef.current) {
        onPlanUpdate(originalPlanRef.current);
        originalPlanRef.current = null;
      }

      toast({
        title: "Couldn't move task",
        description: "Your changes weren't saved. Please try again.",
        variant: "destructive",
      });

      return { success: false, error: 'Failed to save' };
    } finally {
      setIsMoving(false);
    }
  }, [plan, userId, canMoveTask, onPlanUpdate]);

  /**
   * Reorder tasks within a single week (simpler than cross-week move)
   */
  const reorderWithinWeek = useCallback(async (weekIndex: number, reorderedTasks: Task[]) => {
    if (!plan || !userId) return;

    // Store original plan for rollback
    originalPlanRef.current = JSON.parse(JSON.stringify(plan));

    // Create updated plan
    const updatedPlan: PlanData = {
      ...plan,
      weeks: plan.weeks.map((week, idx) =>
        idx === weekIndex ? { ...week, tasks: reorderedTasks } : week
      ),
    };

    // Optimistic update
    onPlanUpdate(updatedPlan);
    setIsMoving(true);

    try {
      const { error } = await supabase
        .from('plans')
        .update({ plan_json: updatedPlan as unknown as Json })
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      originalPlanRef.current = null;
    } catch (error) {
      console.error('Error reordering tasks:', error);

      // Rollback
      if (originalPlanRef.current) {
        onPlanUpdate(originalPlanRef.current);
        originalPlanRef.current = null;
      }

      toast({
        title: "Couldn't save order",
        description: "Your changes weren't saved. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsMoving(false);
    }
  }, [plan, userId, onPlanUpdate]);

  return {
    moveTask,
    reorderWithinWeek,
    canMoveTask,
    isMoving,
  };
}

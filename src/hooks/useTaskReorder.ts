import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Json } from '@/integrations/supabase/types';

interface Task {
  title: string;
  priority: 'High' | 'Medium' | 'Low';
  estimated_hours: number;
  completed?: boolean;
  [key: string]: any; // Allow additional properties (execution_state, timer data, etc.)
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

interface UseTaskReorderOptions {
  plan: PlanData | null;
  planId: string | null;
  userId: string | undefined;
  onPlanUpdate: (plan: PlanData) => void;
}

interface UseTaskReorderReturn {
  reorderTasks: (weekIndex: number, reorderedTasks: Task[]) => Promise<void>;
  isReordering: boolean;
}

/**
 * Hook for managing task reordering with optimistic updates and persistence.
 * 
 * Guardrails:
 * - NO modification to completed, execution_state, or timer data
 * - NO triggering of insights/analysis updates
 * - Pure array reordering only
 */
export function useTaskReorder({
  plan,
  planId,
  userId,
  onPlanUpdate,
}: UseTaskReorderOptions): UseTaskReorderReturn {
  const [isReordering, setIsReordering] = useState(false);
  const originalPlanRef = useRef<PlanData | null>(null);

  const reorderTasks = useCallback(async (weekIndex: number, reorderedTasks: Task[]) => {
    if (!plan || !userId) return;

    // Store original plan for potential rollback
    originalPlanRef.current = plan;

    // Create updated plan with new task order
    const updatedPlan: PlanData = {
      ...plan,
      weeks: plan.weeks.map((week, idx) => 
        idx === weekIndex 
          ? { ...week, tasks: reorderedTasks }
          : week
      ),
    };

    // Optimistic update - UI updates immediately
    onPlanUpdate(updatedPlan);
    setIsReordering(true);

    try {
      // Persist to Supabase
      const { error } = await supabase
        .from('plans')
        .update({ plan_json: updatedPlan as unknown as Json })
        .eq('user_id', userId);

      if (error) {
        throw error;
      }
      
      // Success - clear original reference
      originalPlanRef.current = null;
    } catch (error) {
      console.error('Error saving task order:', error);
      
      // Rollback to original plan
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
      setIsReordering(false);
    }
  }, [plan, userId, onPlanUpdate]);

  return {
    reorderTasks,
    isReordering,
  };
}

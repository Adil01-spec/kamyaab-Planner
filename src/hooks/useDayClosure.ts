/**
 * useDayClosure Hook (Phase 9.7)
 * 
 * Manages day closure state and persistence to plan_json.day_closures[]
 * Provides methods to close day and store reflections.
 */

import { useState, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';
import {
  type DayClosure,
  type DaySummary,
  calculateDaySummary,
  getTodayReflectionPrompt,
  isDayClosed,
  getRecentClosures,
} from '@/lib/dayClosure';

interface TaskData {
  execution_state?: 'pending' | 'doing' | 'done';
  completed?: boolean;
  partial_progress?: 'some' | 'most' | 'almost';
  deferred_to?: string;
  time_spent_seconds?: number;
  scheduled_at?: string;
}

interface ScheduledTask {
  weekIndex: number;
  taskIndex: number;
  task: TaskData;
}

interface PlanData {
  day_closures?: DayClosure[];
  [key: string]: any;
}

interface UseDayClosureOptions {
  planData: PlanData | null;
  planId: string | null;
  todaysTasks: ScheduledTask[];
  onPlanUpdate?: (updatedPlan: PlanData) => void;
}

export function useDayClosure({
  planData,
  planId,
  todaysTasks,
  onPlanUpdate,
}: UseDayClosureOptions) {
  const [isClosing, setIsClosing] = useState(false);

  // Get today's date
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Calculate current day summary
  const daySummary = useMemo<DaySummary>(() => {
    if (!todaysTasks || todaysTasks.length === 0) {
      return { completed: 0, partial: 0, deferred: 0, total_time_seconds: 0 };
    }
    return calculateDaySummary(todaysTasks.map(t => t.task));
  }, [todaysTasks]);

  // Check if today is already closed
  const isTodayClosed = useMemo(() => {
    return isDayClosed(planData?.day_closures, today);
  }, [planData?.day_closures, today]);

  // Get today's reflection prompt
  const reflectionPrompt = useMemo(() => getTodayReflectionPrompt(), []);

  // Get recent closures for /review display
  const recentClosures = useMemo(() => {
    return getRecentClosures(planData?.day_closures, 7);
  }, [planData?.day_closures]);

  // Close the day
  const closeDay = useCallback(async (reflection?: string): Promise<boolean> => {
    if (!planData || !planId) return false;
    
    setIsClosing(true);

    try {
      const newClosure: DayClosure = {
        date: today,
        closed_at: new Date().toISOString(),
        summary: daySummary,
        reflection: reflection?.trim() || undefined,
        reflection_prompt: reflection?.trim() ? reflectionPrompt : undefined,
      };

      // Create updated closures array (replace if exists for today, append otherwise)
      const existingClosures = planData.day_closures || [];
      const filteredClosures = existingClosures.filter(c => c.date !== today);
      const updatedClosures = [...filteredClosures, newClosure];

      // Update plan data
      const updatedPlan = {
        ...planData,
        day_closures: updatedClosures,
      };

      // Persist to database
      const { error } = await supabase
        .from('plans')
        .update({ plan_json: updatedPlan as unknown as Json })
        .eq('id', planId);

      if (error) {
        console.error('Error closing day:', error);
        return false;
      }

      // Notify parent of update
      onPlanUpdate?.(updatedPlan);

      return true;
    } catch (err) {
      console.error('Error closing day:', err);
      return false;
    } finally {
      setIsClosing(false);
    }
  }, [planData, planId, today, daySummary, reflectionPrompt, onPlanUpdate]);

  // Check if Close Day button should be visible
  const showCloseButton = useMemo(() => {
    // Show when: there are tasks scheduled today
    return todaysTasks.length > 0;
  }, [todaysTasks.length]);

  return {
    // State
    isClosing,
    isTodayClosed,
    showCloseButton,
    
    // Data
    daySummary,
    reflectionPrompt,
    recentClosures,
    today,
    
    // Actions
    closeDay,
  };
}

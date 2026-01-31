/**
 * Plan History Hook
 * 
 * Manages fetching and selection of historical plans for comparison.
 * Strictly read-only - no mutations to execution state.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PlanHistorySummary {
  id: string;
  plan_title: string;
  plan_description: string | null;
  is_strategic: boolean;
  scenario_tag: string | null;
  started_at: string;
  completed_at: string;
  total_tasks: number;
  completed_tasks: number;
  total_weeks: number;
  total_time_seconds: number;
  completion_percent: number;
}

export interface PlanHistoryFull extends PlanHistorySummary {
  plan_snapshot: Record<string, any>;
  comparison_insights: ComparativeInsights | null;
}

export interface ComparativeInsights {
  observations: string[];
  pattern_note?: string;
  generated_at: string;
  plans_compared: [string, string];
}

interface UsePlanHistoryReturn {
  history: PlanHistorySummary[];
  loading: boolean;
  error: string | null;
  selectedPlan: PlanHistoryFull | null;
  selectedPlanLoading: boolean;
  selectPlanForComparison: (id: string) => Promise<void>;
  clearSelection: () => void;
  updateComparisonInsights: (planId: string, insights: ComparativeInsights) => Promise<void>;
}

/**
 * Hook to manage plan history and comparison selection
 */
export function usePlanHistory(userId: string | undefined): UsePlanHistoryReturn {
  const [history, setHistory] = useState<PlanHistorySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanHistoryFull | null>(null);
  const [selectedPlanLoading, setSelectedPlanLoading] = useState(false);

  // Fetch plan history list
  useEffect(() => {
    const fetchHistory = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('plan_history')
          .select('id, plan_title, plan_description, is_strategic, scenario_tag, started_at, completed_at, total_tasks, completed_tasks, total_weeks, total_time_seconds')
          .eq('user_id', userId)
          .order('completed_at', { ascending: false });

        if (fetchError) throw fetchError;

        const summaries: PlanHistorySummary[] = (data || []).map(row => ({
          id: row.id,
          plan_title: row.plan_title,
          plan_description: row.plan_description,
          is_strategic: row.is_strategic || false,
          scenario_tag: row.scenario_tag,
          started_at: row.started_at,
          completed_at: row.completed_at,
          total_tasks: row.total_tasks,
          completed_tasks: row.completed_tasks,
          total_weeks: row.total_weeks,
          total_time_seconds: row.total_time_seconds || 0,
          completion_percent: row.total_tasks > 0 
            ? Math.round((row.completed_tasks / row.total_tasks) * 100) 
            : 0,
        }));

        setHistory(summaries);
      } catch (err) {
        console.error('Error fetching plan history:', err);
        setError('Failed to load plan history');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [userId]);

  // Select a plan for comparison (loads full snapshot)
  const selectPlanForComparison = useCallback(async (planId: string) => {
    if (!userId) return;

    try {
      setSelectedPlanLoading(true);

      const { data, error: fetchError } = await supabase
        .from('plan_history')
        .select('*')
        .eq('id', planId)
        .eq('user_id', userId)
        .single();

      if (fetchError) throw fetchError;

      const fullPlan: PlanHistoryFull = {
        id: data.id,
        plan_title: data.plan_title,
        plan_description: data.plan_description,
        is_strategic: data.is_strategic || false,
        scenario_tag: data.scenario_tag,
        started_at: data.started_at,
        completed_at: data.completed_at,
        total_tasks: data.total_tasks,
        completed_tasks: data.completed_tasks,
        total_weeks: data.total_weeks,
        total_time_seconds: data.total_time_seconds || 0,
        completion_percent: data.total_tasks > 0 
          ? Math.round((data.completed_tasks / data.total_tasks) * 100) 
          : 0,
        plan_snapshot: data.plan_snapshot as Record<string, any>,
        comparison_insights: data.comparison_insights as unknown as ComparativeInsights | null,
      };

      setSelectedPlan(fullPlan);
    } catch (err) {
      console.error('Error loading plan for comparison:', err);
      setError('Failed to load plan details');
    } finally {
      setSelectedPlanLoading(false);
    }
  }, [userId]);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedPlan(null);
  }, []);

  // Update comparison insights (cache AI-generated insights)
  const updateComparisonInsights = useCallback(async (planId: string, insights: ComparativeInsights) => {
    if (!userId) return;

    try {
      await supabase
        .from('plan_history')
        .update({ comparison_insights: insights as unknown as Record<string, any> })
        .eq('id', planId)
        .eq('user_id', userId);

      // Update local state if this is the selected plan
      if (selectedPlan?.id === planId) {
        setSelectedPlan(prev => prev ? { ...prev, comparison_insights: insights } : null);
      }
    } catch (err) {
      console.error('Error updating comparison insights:', err);
    }
  }, [userId, selectedPlan]);

  return {
    history,
    loading,
    error,
    selectedPlan,
    selectedPlanLoading,
    selectPlanForComparison,
    clearSelection,
    updateComparisonInsights,
  };
}

/**
 * Archive current plan to history
 * Called during plan reset flow
 */
export async function archiveCurrentPlan(
  userId: string,
  plan: Record<string, any>,
  planCreatedAt: string,
  projectTitle: string,
  projectDescription?: string
): Promise<boolean> {
  try {
    // Calculate metrics from plan
    let totalTasks = 0;
    let completedTasks = 0;
    let totalTimeSeconds = 0;

    const weeks = plan.weeks || [];
    weeks.forEach((week: any) => {
      const tasks = week.tasks || [];
      tasks.forEach((task: any) => {
        totalTasks++;
        if (task.execution_state === 'done' || task.completed) {
          completedTasks++;
        }
        // Sum execution time
        if (task.time_spent_seconds) {
          totalTimeSeconds += task.time_spent_seconds;
        }
      });
    });

    const { error } = await supabase
      .from('plan_history')
      .insert({
        user_id: userId,
        plan_title: projectTitle || 'Untitled Plan',
        plan_description: plan.overview || projectDescription || null,
        is_strategic: plan.is_strategic_plan || false,
        scenario_tag: plan.plan_context?.scenario || null,
        started_at: planCreatedAt,
        completed_at: new Date().toISOString(),
        total_tasks: totalTasks,
        completed_tasks: completedTasks,
        total_weeks: plan.total_weeks || weeks.length,
        total_time_seconds: totalTimeSeconds,
        plan_snapshot: plan,
      });

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error archiving plan:', err);
    return false;
  }
}

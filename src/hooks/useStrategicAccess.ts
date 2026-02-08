import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { 
  resolveStrategicAccess, 
  type StrategicAccessInput, 
  type StrategicAccessResult 
} from '@/lib/strategicAccessResolver';

interface ProfileWithStrategicFields {
  subscription_tier: string | null;
  subscription_state: string | null;
  strategic_trial_used: boolean;
  email_domain_type: string | null;
}

/**
 * Hook to determine strategic planning access level for the current user.
 */
export function useStrategicAccess() {
  const { user, profile } = useAuth();

  // Fetch plan history count
  const { data: planHistoryCount = 0 } = useQuery({
    queryKey: ['plan-history-count', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count, error } = await supabase
        .from('plan_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error fetching plan history count:', error);
        return 0;
      }
      return count || 0;
    },
    enabled: !!user,
  });

  // Fetch current plan completed tasks
  const { data: completedTasksCount = 0 } = useQuery({
    queryKey: ['completed-tasks-count', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      
      const { data: plan, error } = await supabase
        .from('plans')
        .select('plan_json')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error || !plan?.plan_json) return 0;
      
      // Count completed tasks across all weeks
      const planJson = plan.plan_json as { weeks?: { tasks?: { completed?: boolean }[] }[] };
      let completed = 0;
      
      for (const week of planJson.weeks || []) {
        for (const task of week.tasks || []) {
          if (task.completed) completed++;
        }
      }
      
      return completed;
    },
    enabled: !!user,
  });

  // Fetch strategic access fields from profile (these are new columns)
  const { data: strategicProfile } = useQuery({
    queryKey: ['strategic-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('subscription_tier, subscription_state, strategic_trial_used, email_domain_type')
        .eq('id', user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching strategic profile:', error);
        return null;
      }
      
      return data as ProfileWithStrategicFields | null;
    },
    enabled: !!user,
  });

  const accessResult = useMemo<StrategicAccessResult>(() => {
    // Default to no access if no user
    if (!user || !profile) {
      return {
        level: 'none',
        reason: 'Not authenticated',
        canRegenerate: false,
        canViewFullPlan: false,
      };
    }

    const input: StrategicAccessInput = {
      subscriptionTier: strategicProfile?.subscription_tier || profile.subscriptionTier || 'standard',
      subscriptionState: strategicProfile?.subscription_state || profile.subscriptionState || 'active',
      planHistoryCount,
      completedTasksCurrentPlan: completedTasksCount,
      strategicTrialUsed: strategicProfile?.strategic_trial_used ?? false,
      emailDomainType: (strategicProfile?.email_domain_type as 'standard' | 'disposable' | 'enterprise') || 'standard',
    };

    return resolveStrategicAccess(input);
  }, [user, profile, strategicProfile, planHistoryCount, completedTasksCount]);

  return {
    ...accessResult,
    isLoading: !profile,
    planHistoryCount,
    completedTasksCount,
  };
}

/**
 * Mark strategic trial as used.
 * Call this when a user generates their first strategic preview.
 */
export async function markStrategicTrialUsed(userId: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ strategic_trial_used: true })
    .eq('id', userId);

  if (error) {
    console.error('Error marking strategic trial as used:', error);
  }
}

/**
 * Increment strategic call counter.
 * Call this after each strategic AI generation.
 */
export async function incrementStrategicCallCount(userId: string): Promise<void> {
  // Use raw SQL for atomic increment
  const { error } = await supabase.rpc('increment_strategic_calls' as any, { user_id: userId });
  
  // Fallback if RPC doesn't exist - just update the timestamp
  if (error) {
    await supabase
      .from('profiles')
      .update({ strategic_last_call_at: new Date().toISOString() })
      .eq('id', userId);
  }
}

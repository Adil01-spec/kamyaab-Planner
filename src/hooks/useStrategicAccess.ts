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
 * 
 * Access rules (simplified per Phase 10.3):
 * - Paid tier = full access
 * - Standard tier + trial unused = preview (one-time)
 * - Standard tier + trial used = none (must upgrade)
 * 
 * Plan history and task completion do NOT affect access.
 */
export function useStrategicAccess() {
  const { user, profile } = useAuth();

  // Fetch strategic access fields from profile
  const { data: strategicProfile, isLoading: isProfileLoading } = useQuery({
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
      strategicTrialUsed: strategicProfile?.strategic_trial_used ?? false,
      emailDomainType: (strategicProfile?.email_domain_type as 'standard' | 'disposable' | 'enterprise') || 'standard',
    };

    return resolveStrategicAccess(input);
  }, [user, profile, strategicProfile]);

  return {
    ...accessResult,
    isLoading: !profile || isProfileLoading,
  };
}

/**
 * Mark strategic trial as used.
 * NOTE: This is now primarily handled server-side in the edge function.
 * This client-side function is kept for backward compatibility but 
 * the server is the source of truth.
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
 * NOTE: This is now primarily handled server-side in the edge function.
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

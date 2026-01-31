/**
 * Planning Style Hook
 * 
 * Manages fetching, caching, and regeneration of the planning style profile.
 * Uses slow evolution strategy - only regenerates with significant new data.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePlanHistory } from './usePlanHistory';
import { 
  type PlanningStyleProfile,
  MIN_PLANS_FOR_PROFILE,
  shouldRegenerateProfile,
  createPlanningStyleProfile,
} from '@/lib/planningStyleAnalysis';
import { toast } from '@/hooks/use-toast';

const PROFILE_KEY = 'planning_style_profile';

interface UsePlanningStyleReturn {
  profile: PlanningStyleProfile | null;
  loading: boolean;
  error: string | null;
  hasEnoughData: boolean;
  plansAnalyzed: number;
  regenerateSummary: () => Promise<void>;
  summaryLoading: boolean;
}

/**
 * Hook for managing the planning style profile
 */
export function usePlanningStyle(userId: string | undefined): UsePlanningStyleReturn {
  const [profile, setProfile] = useState<PlanningStyleProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const hasFetchedRef = useRef(false);
  
  // Get plan history for analysis
  const { history, loading: historyLoading } = usePlanHistory(userId);
  
  const hasEnoughData = history.length >= MIN_PLANS_FOR_PROFILE;
  const plansAnalyzed = profile?.plans_analyzed || 0;
  
  // Fetch existing profile from storage
  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    
    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('profession_details')
        .eq('id', userId)
        .maybeSingle();
      
      if (fetchError) throw fetchError;
      
      const professionDetails = data?.profession_details as Record<string, unknown> | null;
      const storedProfile = professionDetails?.[PROFILE_KEY] as PlanningStyleProfile | null;
      
      setProfile(storedProfile);
    } catch (err) {
      console.error('Error fetching planning style profile:', err);
      setError('Failed to load planning style');
    } finally {
      setLoading(false);
    }
  }, [userId]);
  
  // Save profile to storage
  const saveProfile = useCallback(async (newProfile: PlanningStyleProfile) => {
    if (!userId) return;
    
    try {
      // Fetch existing profession_details
      const { data: existingData } = await supabase
        .from('profiles')
        .select('profession_details')
        .eq('id', userId)
        .maybeSingle();
      
      const existingDetails = (existingData?.profession_details as Record<string, unknown>) || {};
      
      // Merge with new profile
      const updatedDetails = {
        ...existingDetails,
        [PROFILE_KEY]: newProfile,
      };
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profession_details: updatedDetails as any })
        .eq('id', userId);
      
      if (updateError) throw updateError;
      
      setProfile(newProfile);
    } catch (err) {
      console.error('Error saving planning style profile:', err);
    }
  }, [userId]);
  
  // Check if we should regenerate and do so
  useEffect(() => {
    if (historyLoading || loading) return;
    if (!hasEnoughData) return;
    if (hasFetchedRef.current) return;
    
    hasFetchedRef.current = true;
    
    const maybeRegenerate = async () => {
      if (!shouldRegenerateProfile(profile, history)) {
        return;
      }
      
      // Create new profile from history
      const newProfile = createPlanningStyleProfile(history, profile);
      if (!newProfile) return;
      
      // Save dimensions immediately
      await saveProfile(newProfile);
      
      // If no summary exists or it's stale, generate one
      if (!newProfile.summary || !newProfile.summary_generated_at) {
        await generateSummary(newProfile);
      }
    };
    
    maybeRegenerate();
  }, [history, historyLoading, loading, hasEnoughData, profile, saveProfile]);
  
  // Initial fetch
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);
  
  // Generate AI summary
  const generateSummary = async (profileToUpdate: PlanningStyleProfile) => {
    if (!userId) return;
    
    setSummaryLoading(true);
    
    try {
      const response = await supabase.functions.invoke('planning-style-summary', {
        body: {
          dimensions: profileToUpdate.dimensions,
          plans_analyzed: profileToUpdate.plans_analyzed,
          history_metrics: {
            total_plans: history.length,
            strategic_plans: history.filter(h => h.is_strategic).length,
            avg_completion: history.length > 0 
              ? history.reduce((sum, h) => sum + h.completion_percent, 0) / history.length
              : 0,
          },
        },
      });
      
      if (response.error) throw response.error;
      
      const { summary } = response.data;
      
      if (summary) {
        const updatedProfile: PlanningStyleProfile = {
          ...profileToUpdate,
          summary,
          summary_generated_at: new Date().toISOString(),
        };
        
        await saveProfile(updatedProfile);
      }
    } catch (err) {
      console.error('Error generating planning style summary:', err);
      // Don't show error toast - summary is optional enhancement
    } finally {
      setSummaryLoading(false);
    }
  };
  
  // Manual regeneration of summary
  const regenerateSummary = useCallback(async () => {
    if (!profile) return;
    await generateSummary(profile);
  }, [profile, history, userId]);
  
  return {
    profile,
    loading: loading || historyLoading,
    error,
    hasEnoughData,
    plansAnalyzed,
    regenerateSummary,
    summaryLoading,
  };
}

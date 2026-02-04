/**
 * useOperatingStyle Hook
 * 
 * Manages fetching, caching, and regenerating the Operating Style Profile.
 * Profile is stored in profiles.profession_details.operating_style_profile
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';
import {
  OperatingStyleProfile,
  PlanHistoryEntry,
  createOperatingStyleProfile,
  shouldRegenerateProfile,
  getEffortFeedbackFromStorage,
  MIN_PLANS_FOR_PROFILE,
} from '@/lib/personalOperatingStyle';

interface UseOperatingStyleResult {
  profile: OperatingStyleProfile | null;
  isLoading: boolean;
  error: string | null;
  hasEnoughData: boolean;
  planCount: number;
  regenerate: () => Promise<void>;
}

/**
 * Fetch plan history for a user
 */
async function fetchPlanHistory(userId: string): Promise<PlanHistoryEntry[]> {
  const { data, error } = await supabase
    .from('plan_history')
    .select('id, total_tasks, completed_tasks, total_weeks, is_strategic, plan_snapshot, completed_at')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false });

  if (error) {
    console.error('Error fetching plan history:', error);
    return [];
  }

  return (data || []) as PlanHistoryEntry[];
}

/**
 * Fetch existing profile from profession_details
 */
async function fetchExistingProfile(userId: string): Promise<OperatingStyleProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('profession_details')
    .eq('id', userId)
    .single();

  if (error || !data?.profession_details) {
    return null;
  }

  const details = data.profession_details as { operating_style_profile?: OperatingStyleProfile };
  return details.operating_style_profile || null;
}

/**
 * Save profile to profession_details
 */
async function saveProfile(userId: string, profile: OperatingStyleProfile): Promise<void> {
  // First fetch current profession_details to merge
  const { data, error: fetchError } = await supabase
    .from('profiles')
    .select('profession_details')
    .eq('id', userId)
    .single();

  if (fetchError) {
    console.error('Error fetching profile for save:', fetchError);
    return;
  }

  const currentDetails = (data?.profession_details as Record<string, unknown>) || {};
  const updatedDetails = {
    ...currentDetails,
    operating_style_profile: profile as unknown as Json,
  };
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ profession_details: updatedDetails as Json })
    .eq('id', userId);

  if (updateError) {
    console.error('Error saving operating style profile:', updateError);
  }
}

/**
 * Generate AI summary for the profile
 */
async function generateAiSummary(profile: OperatingStyleProfile): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke('operating-style-summary', {
      body: {
        dimensions: profile.dimensions,
        metrics: {
          totalPlans: profile.metrics.totalPlans,
          avgTasksPerWeek: profile.metrics.avgTasksPerWeek,
          avgCompletionRate: profile.metrics.avgCompletionRate,
        },
      },
    });

    if (error) {
      console.error('Error generating AI summary:', error);
      return null;
    }

    return data?.summary || null;
  } catch (err) {
    console.error('Error calling operating-style-summary:', err);
    return null;
  }
}

export function useOperatingStyle(userId: string | undefined): UseOperatingStyleResult {
  const [profile, setProfile] = useState<OperatingStyleProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [planCount, setPlanCount] = useState(0);

  const hasEnoughData = planCount >= MIN_PLANS_FOR_PROFILE;

  const regenerate = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch plan history
      const history = await fetchPlanHistory(userId);
      setPlanCount(history.length);

      if (history.length < MIN_PLANS_FOR_PROFILE) {
        setProfile(null);
        setIsLoading(false);
        return;
      }

      // Get effort feedback from localStorage
      const effortFeedback = getEffortFeedbackFromStorage();

      // Create new profile
      const newProfile = createOperatingStyleProfile(history, effortFeedback);

      // Generate AI summary
      const aiSummary = await generateAiSummary(newProfile);
      if (aiSummary) {
        newProfile.aiSummary = aiSummary;
        newProfile.summaryGeneratedAt = new Date().toISOString();
      }

      // Save to database
      await saveProfile(userId, newProfile);

      setProfile(newProfile);
    } catch (err) {
      console.error('Error regenerating operating style:', err);
      setError('Failed to analyze working patterns');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const loadProfile = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch plan history to check count
        const history = await fetchPlanHistory(userId);
        setPlanCount(history.length);

        if (history.length < MIN_PLANS_FOR_PROFILE) {
          setProfile(null);
          setIsLoading(false);
          return;
        }

        // Fetch existing cached profile
        const existingProfile = await fetchExistingProfile(userId);

        // Check if regeneration is needed
        if (shouldRegenerateProfile(existingProfile, history.length)) {
          // Regenerate profile
          const effortFeedback = getEffortFeedbackFromStorage();
          const newProfile = createOperatingStyleProfile(
            history,
            effortFeedback,
            existingProfile?.aiSummary // Preserve existing summary initially
          );

          // Generate new AI summary if none exists or if significant change
          if (!newProfile.aiSummary) {
            const aiSummary = await generateAiSummary(newProfile);
            if (aiSummary) {
              newProfile.aiSummary = aiSummary;
              newProfile.summaryGeneratedAt = new Date().toISOString();
            }
          }

          // Save updated profile
          await saveProfile(userId, newProfile);
          setProfile(newProfile);
        } else if (existingProfile) {
          setProfile(existingProfile);
        } else {
          // No existing profile and shouldn't regenerate yet
          setProfile(null);
        }
      } catch (err) {
        console.error('Error loading operating style:', err);
        setError('Failed to load working patterns');
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [userId]);

  return {
    profile,
    isLoading,
    error,
    hasEnoughData,
    planCount,
    regenerate,
  };
}

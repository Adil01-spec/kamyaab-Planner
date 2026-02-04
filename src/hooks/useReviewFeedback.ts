import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface FeedbackItem {
  id: string;
  feels_realistic: 'yes' | 'somewhat' | 'no' | null;
  challenge_areas: string[] | null;
  unclear_or_risky: string | null;
  advisor_observation: string | null;
  submitted_at: string;
}

export interface AggregatedFeedback {
  totalResponses: number;
  realism: { yes: number; somewhat: number; no: number };
  challengeAreas: Record<string, number>;
  unclearNotes: string[];
  advisorObservations: string[];
  rawFeedback: FeedbackItem[];
}

interface UseReviewFeedbackReturn {
  feedback: AggregatedFeedback | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook for fetching and aggregating feedback for a shared review (owner only)
 */
export function useReviewFeedback(sharedReviewId: string | undefined): UseReviewFeedbackReturn {
  const [feedback, setFeedback] = useState<AggregatedFeedback | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeedback = useCallback(async () => {
    if (!sharedReviewId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data: items, error: fetchError } = await supabase
        .from('review_feedback')
        .select('id, feels_realistic, challenge_areas, unclear_or_risky, advisor_observation, submitted_at')
        .eq('shared_review_id', sharedReviewId)
        .order('submitted_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      // Aggregate the feedback
      const aggregated = aggregateFeedback(items as FeedbackItem[]);
      setFeedback(aggregated);
    } catch (err) {
      console.error('Error fetching feedback:', err);
      setError('Failed to load feedback');
    } finally {
      setLoading(false);
    }
  }, [sharedReviewId]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  return { feedback, loading, error, refetch: fetchFeedback };
}

/**
 * Aggregate raw feedback items into summary statistics
 */
function aggregateFeedback(items: FeedbackItem[]): AggregatedFeedback {
  const realism = { yes: 0, somewhat: 0, no: 0 };
  const challengeAreas: Record<string, number> = {};
  const unclearNotes: string[] = [];
  const advisorObservations: string[] = [];

  for (const item of items) {
    // Count realism responses
    if (item.feels_realistic === 'yes') realism.yes++;
    else if (item.feels_realistic === 'somewhat') realism.somewhat++;
    else if (item.feels_realistic === 'no') realism.no++;

    // Count challenge areas
    if (item.challenge_areas) {
      for (const area of item.challenge_areas) {
        challengeAreas[area] = (challengeAreas[area] || 0) + 1;
      }
    }

    // Collect unclear/risky notes
    if (item.unclear_or_risky && item.unclear_or_risky.trim()) {
      unclearNotes.push(item.unclear_or_risky.trim());
    }

    // Collect advisor observations
    if (item.advisor_observation && item.advisor_observation.trim()) {
      advisorObservations.push(item.advisor_observation.trim());
    }
  }

  return {
    totalResponses: items.length,
    realism,
    challengeAreas,
    unclearNotes,
    advisorObservations,
    rawFeedback: items,
  };
}

/**
 * Hook for fetching all feedback across all shared reviews for a plan (owner)
 */
export function useAllPlanFeedback(planId: string | undefined): UseReviewFeedbackReturn {
  const [feedback, setFeedback] = useState<AggregatedFeedback | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeedback = useCallback(async () => {
    if (!planId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // First get all shared reviews for this plan
      const { data: reviews, error: reviewError } = await supabase
        .from('shared_reviews')
        .select('id')
        .eq('plan_id', planId);

      if (reviewError) throw reviewError;
      if (!reviews || reviews.length === 0) {
        setFeedback(null);
        setLoading(false);
        return;
      }

      const reviewIds = reviews.map(r => r.id);

      // Then get all feedback for those reviews
      const { data: items, error: fetchError } = await supabase
        .from('review_feedback')
        .select('id, feels_realistic, challenge_areas, unclear_or_risky, advisor_observation, submitted_at')
        .in('shared_review_id', reviewIds)
        .order('submitted_at', { ascending: false });

      if (fetchError) throw fetchError;

      const aggregated = aggregateFeedback(items as FeedbackItem[]);
      setFeedback(aggregated);
    } catch (err) {
      console.error('Error fetching all plan feedback:', err);
      setError('Failed to load feedback');
    } finally {
      setLoading(false);
    }
  }, [planId]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  return { feedback, loading, error, refetch: fetchFeedback };
}

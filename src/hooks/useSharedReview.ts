import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SharedReviewData {
  id: string;
  token: string;
  expires_at: string;
  revoked: boolean;
  created_at: string;
  plan_snapshot: any;
}

interface UseSharedReviewReturn {
  data: SharedReviewData | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook for fetching shared review data by token (public access)
 */
export function useSharedReview(token: string | undefined): UseSharedReviewReturn {
  const [data, setData] = useState<SharedReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError('No token provided');
      return;
    }

    const fetchSharedReview = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: review, error: fetchError } = await supabase
          .from('shared_reviews')
          .select('id, token, expires_at, revoked, created_at, plan_snapshot')
          .eq('token', token)
          .maybeSingle();

        if (fetchError) {
          throw fetchError;
        }

        if (!review) {
          setError('Review not found');
          setData(null);
        } else {
          setData(review as SharedReviewData);
        }
      } catch (err) {
        console.error('Error fetching shared review:', err);
        setError('Failed to load review');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSharedReview();
  }, [token]);

  return { data, loading, error };
}

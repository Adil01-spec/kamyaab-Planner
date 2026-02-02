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
 * Uses edge function to securely validate token without exposing all shared_reviews
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

        // Use edge function for secure token-based access
        const { data: response, error: fetchError } = await supabase.functions.invoke(
          'get-shared-review',
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            body: undefined,
          }
        );

        // The edge function needs the token as query param, but invoke doesn't support that
        // So we'll call it directly via fetch
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        
        const res = await fetch(
          `${supabaseUrl}/functions/v1/get-shared-review?token=${encodeURIComponent(token)}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${supabaseAnonKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          if (res.status === 404) {
            setError('Review not found');
          } else {
            setError(errorData.error || 'Failed to load review');
          }
          setData(null);
          return;
        }

        const review = await res.json();
        setData(review as SharedReviewData);
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

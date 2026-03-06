import { useSubscription } from '@/hooks/useSubscription';

/**
 * Determines if the current user should see ads.
 * Ads only show for free (standard) tier users.
 */
export function useAdEligibility(): { canShowAds: boolean } {
  const { tier } = useSubscription();
  return { canShowAds: tier === 'standard' };
}

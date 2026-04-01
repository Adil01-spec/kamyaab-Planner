import { useSubscription } from '@/hooks/useSubscription';
import { useLocation } from 'react-router-dom';

/** Routes where ads should never appear */
const AD_BLOCKED_ROUTES = ['/auth', '/onboarding', '/pricing', '/learn'];

/**
 * Determines if the current user should see ads.
 * Ads only show for free (standard) tier users and never on blocked routes.
 */
export function useAdEligibility(): { canShowAds: boolean } {
  const { tier } = useSubscription();
  const location = useLocation();

  const isBlockedRoute = AD_BLOCKED_ROUTES.some(
    (route) => location.pathname === route || location.pathname.startsWith(route + '/')
  );

  return { canShowAds: tier === 'standard' && !isBlockedRoute };
}

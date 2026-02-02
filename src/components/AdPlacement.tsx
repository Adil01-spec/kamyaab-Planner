/**
 * Ad Placement Component (Placeholder)
 * 
 * Placeholder for future ad integration on Standard tier.
 * Currently renders nothing - actual ad integration deferred.
 * 
 * Placement rules:
 * - Only on Standard tier
 * - Never during active task execution
 * - Never near locked feature explanations
 * - Never during planning or reflection flows
 * - Allowed: Home page footer, Review page footer (after all content)
 * - Type: Rewarded or passive only
 */

import { useShowAds } from '@/hooks/useSubscription';

type AdSlot = 'home-footer' | 'review-footer';

interface AdPlacementProps {
  /** Which slot to render ad in */
  slot: AdSlot;
  /** Additional class names */
  className?: string;
}

/**
 * Placeholder component for ad placements.
 * Currently renders null - future integration with AdMob or similar.
 */
export function AdPlacement({ slot, className }: AdPlacementProps) {
  const showAds = useShowAds();
  
  // Don't show ads for paid tiers
  if (!showAds) return null;
  
  // Phase 10.0: Just a placeholder, no actual ads yet
  // Future: Integrate with AdMob, Unity Ads, or similar
  return null;
  
  // Example future implementation:
  // return (
  //   <div className={cn('ad-container', className)} data-slot={slot}>
  //     {/* Ad content here */}
  //   </div>
  // );
}

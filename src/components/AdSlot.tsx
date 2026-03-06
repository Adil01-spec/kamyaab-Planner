import { useEffect, useRef } from 'react';
import { useAdEligibility } from '@/hooks/useAdEligibility';

type AdFormat = 'banner' | 'inline' | 'sidebar';

interface AdSlotProps {
  format: AdFormat;
  slot: string; // AdSense ad slot ID
  className?: string;
}

const FORMAT_STYLES: Record<AdFormat, { width: string; height: string }> = {
  banner: { width: '100%', height: '90px' },
  inline: { width: '100%', height: '250px' },
  sidebar: { width: '300px', height: '250px' },
};

/**
 * Google AdSense ad slot component.
 * Only renders for free-tier users. Max 2 per page enforced by caller.
 */
export function AdSlot({ format, slot, className }: AdSlotProps) {
  const { canShowAds } = useAdEligibility();
  const adRef = useRef<HTMLDivElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (!canShowAds || !slot || pushed.current) return;
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      // AdSense not loaded yet
    }
  }, [canShowAds, slot]);

  if (!canShowAds || !slot) return null;

  const style = FORMAT_STYLES[format];

  return (
    <div className={className} ref={adRef}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', ...style }}
        data-ad-client="" // Set your AdSense publisher ID
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}

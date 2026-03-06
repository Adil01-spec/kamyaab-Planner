import { useEffect } from 'react';
import { useAdEligibility } from '@/hooks/useAdEligibility';

const ADSENSE_CLIENT_ID = ''; // Set your AdSense publisher ID here e.g. 'ca-pub-XXXXXXXXXX'

/**
 * Loads the Google AdSense script only for free-tier users.
 * Include this once in the app layout.
 */
export function AdsenseLoader() {
  const { canShowAds } = useAdEligibility();

  useEffect(() => {
    if (!canShowAds || !ADSENSE_CLIENT_ID) return;

    // Don't load twice
    if (document.querySelector('script[src*="adsbygoogle"]')) return;

    const script = document.createElement('script');
    script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.setAttribute('data-ad-client', ADSENSE_CLIENT_ID);
    document.head.appendChild(script);
  }, [canShowAds]);

  return null;
}

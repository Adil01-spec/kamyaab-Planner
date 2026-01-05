/**
 * Browser detection utilities for handling platform-specific behaviors
 */

/**
 * Detect if the current browser is iOS Safari
 * Safari on iOS has issues with OAuth popups and cookie handling
 */
export const isIOSSafari = (): boolean => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  const ua = navigator.userAgent;
  
  // Check for iOS
  const isIOS = /iPad|iPhone|iPod/.test(ua) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  
  // Check for Safari (not Chrome, Firefox, or other browsers on iOS)
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|OPiOS|EdgiOS/.test(ua);
  
  return isIOS && isSafari;
};

/**
 * Detect if the browser requires redirect-based OAuth
 * This includes iOS Safari and other browsers with popup restrictions
 */
export const requiresRedirectAuth = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  // iOS Safari definitely needs redirect
  if (isIOSSafari()) {
    return true;
  }

  // Check for in-app browsers (Instagram, Facebook, etc.)
  const ua = navigator.userAgent;
  const inAppBrowsers = /FBAN|FBAV|Instagram|Twitter|Line\/|WhatsApp/i;
  if (inAppBrowsers.test(ua)) {
    return true;
  }

  return false;
};

/**
 * Clear any partial/stale auth session
 */
export const clearPartialSession = (): void => {
  try {
    // Clear Supabase auth storage keys
    const keysToRemove = Object.keys(localStorage).filter(key => 
      key.startsWith('sb-') || 
      key.includes('supabase') ||
      key.includes('auth-token')
    );
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
  } catch (e) {
    // Silent fail - localStorage might be restricted
    console.warn('Could not clear partial session:', e);
  }
};

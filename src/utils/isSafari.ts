/**
 * Robust Safari browser detection utility
 * Detects Safari on both iOS and macOS while excluding other browsers
 */

export const isSafari = (): boolean => {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }

  const ua = navigator.userAgent.toLowerCase();
  
  // Check for iOS devices
  const isIOS = /iphone|ipad|ipod/.test(ua) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  
  // Check for Safari (excluding Chrome, Firefox, Edge, Opera on iOS)
  const isSafariBrowser =
    ua.includes("safari") &&
    !ua.includes("chrome") &&
    !ua.includes("chromium") &&
    !ua.includes("android") &&
    !ua.includes("crios") &&   // Chrome on iOS
    !ua.includes("fxios") &&   // Firefox on iOS
    !ua.includes("edgios") &&  // Edge on iOS
    !ua.includes("opr") &&     // Opera
    !ua.includes("opera");

  // Return true if it's Safari on any platform, or any browser on iOS
  // (since all iOS browsers use WebKit and have similar restrictions)
  return isSafariBrowser || (isIOS && !ua.includes("crios") && !ua.includes("fxios"));
};

/**
 * Check if Google Sign-In should be disabled for this browser
 * Returns true for Safari and iOS browsers with OAuth limitations
 */
export const shouldDisableGoogleAuth = (): boolean => {
  return isSafari();
};

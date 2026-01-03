/**
 * Haptic feedback utilities using the Web Vibration API
 * Note: Works on Android Chrome and some other mobile browsers
 * iOS Safari does not support the Vibration API
 */

import { getMobileSettings } from '@/hooks/useMobileSettings';

const canVibrate = (): boolean => {
  return 'vibrate' in navigator;
};

const isEnabled = (): boolean => {
  return getMobileSettings().hapticFeedback;
};

/**
 * Light haptic tap - for confirmations and positive actions
 * Short, pleasant vibration
 */
export function hapticSuccess(): void {
  if (!canVibrate() || !isEnabled()) return;
  
  try {
    // Double tap pattern: vibrate 15ms, pause 50ms, vibrate 15ms
    navigator.vibrate([15, 50, 15]);
  } catch (error) {
    console.debug('Haptic feedback not available:', error);
  }
}

/**
 * Soft haptic tap - for neutral or retry actions
 * Single gentle vibration
 */
export function hapticLight(): void {
  if (!canVibrate() || !isEnabled()) return;
  
  try {
    navigator.vibrate(10);
  } catch (error) {
    console.debug('Haptic feedback not available:', error);
  }
}

/**
 * Warning haptic - for denials or errors
 * Slightly stronger, single pulse
 */
export function hapticWarning(): void {
  if (!canVibrate() || !isEnabled()) return;
  
  try {
    navigator.vibrate(25);
  } catch (error) {
    console.debug('Haptic feedback not available:', error);
  }
}

/**
 * Selection haptic - for button presses and selections
 * Very light tap
 */
export function hapticSelection(): void {
  if (!canVibrate() || !isEnabled()) return;
  
  try {
    navigator.vibrate(5);
  } catch (error) {
    console.debug('Haptic feedback not available:', error);
  }
}

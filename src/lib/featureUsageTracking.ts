/**
 * Feature Usage Tracking (Internal Only)
 * 
 * Tracks user interest in paid features for analytics.
 * No UI impact - purely for future pricing decisions.
 */

import { type ProductTier } from './subscriptionTiers';

export interface FeatureSignal {
  feature_id: string;
  action: 'viewed' | 'expanded' | 'attempted';
  timestamp: string;
  user_tier: ProductTier;
}

const STORAGE_KEY = 'kaamyab_feature_signals';
const MAX_SIGNALS = 100; // Limit stored signals to prevent storage bloat

/**
 * Track when a user shows interest in a Pro feature
 * Stores locally for batch sync later
 */
export function trackFeatureInterest(
  featureId: string,
  userTier: ProductTier,
  action: FeatureSignal['action'] = 'viewed'
): void {
  try {
    const signals = getStoredSignals();
    
    // Add new signal
    signals.push({
      feature_id: featureId,
      action,
      timestamp: new Date().toISOString(),
      user_tier: userTier,
    });
    
    // Keep only the most recent signals
    const trimmedSignals = signals.slice(-MAX_SIGNALS);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedSignals));
  } catch (error) {
    // Silently fail - tracking should never break the app
    console.debug('Feature tracking error:', error);
  }
}

/**
 * Get all stored feature signals
 */
export function getStoredSignals(): FeatureSignal[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Get signals for a specific feature
 */
export function getSignalsForFeature(featureId: string): FeatureSignal[] {
  return getStoredSignals().filter((s) => s.feature_id === featureId);
}

/**
 * Get aggregated feature interest summary
 */
export function getFeatureInterestSummary(): Record<string, number> {
  const signals = getStoredSignals();
  const summary: Record<string, number> = {};
  
  for (const signal of signals) {
    summary[signal.feature_id] = (summary[signal.feature_id] || 0) + 1;
  }
  
  return summary;
}

/**
 * Clear all stored signals (for testing/privacy)
 */
export function clearFeatureSignals(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Get signals ready for sync to backend
 * Returns signals and clears them from local storage
 */
export function getAndClearSignalsForSync(): FeatureSignal[] {
  const signals = getStoredSignals();
  clearFeatureSignals();
  return signals;
}

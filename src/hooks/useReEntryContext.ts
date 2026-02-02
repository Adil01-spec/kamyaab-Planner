/**
 * useReEntryContext — Phase 9.8
 * 
 * Hook for consuming re-entry context in pages.
 * Handles session-based dismissal (clears on page refresh).
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { calculateReEntryContext, getReEntryMessage, type ReEntryContext } from '@/lib/reEntryContext';

interface UseReEntryContextResult extends ReEntryContext {
  message: string;
  dismissed: boolean;
  dismiss: () => void;
}

/**
 * Hook to calculate and manage re-entry state
 * 
 * @param planData - The current plan data (from Supabase)
 * @param autoDismissMs - Auto-dismiss after this many ms (default: 10000 = 10s)
 */
export function useReEntryContext(
  planData: any,
  autoDismissMs: number = 10000
): UseReEntryContextResult {
  const [dismissed, setDismissed] = useState(false);
  const autoDismissRef = useRef<NodeJS.Timeout | null>(null);
  const hasStartedAutoDismiss = useRef(false);
  
  // Calculate context from plan data
  const context = planData ? calculateReEntryContext(planData) : {
    daysAway: 0,
    lastProgressDate: null,
    lastProgressFormatted: null,
    planIntact: true,
    showReEntryBanner: false,
  };
  
  // Get appropriate message
  const message = getReEntryMessage(context.daysAway);
  
  // Dismiss handler (one-tap)
  const dismiss = useCallback(() => {
    setDismissed(true);
    if (autoDismissRef.current) {
      clearTimeout(autoDismissRef.current);
      autoDismissRef.current = null;
    }
  }, []);
  
  // Auto-dismiss after 10 seconds if banner is showing
  useEffect(() => {
    // Only set up auto-dismiss once when banner should show
    if (context.showReEntryBanner && !dismissed && !hasStartedAutoDismiss.current) {
      hasStartedAutoDismiss.current = true;
      
      autoDismissRef.current = setTimeout(() => {
        setDismissed(true);
      }, autoDismissMs);
    }
    
    return () => {
      if (autoDismissRef.current) {
        clearTimeout(autoDismissRef.current);
      }
    };
  }, [context.showReEntryBanner, dismissed, autoDismissMs]);
  
  return {
    ...context,
    message,
    dismissed,
    dismiss,
  };
}

/**
 * useCollaborationContext Hook
 * 
 * Unified hook that resolves collaboration permissions for any review context.
 * Replaces scattered permission checks across review pages.
 */

import { useMemo } from 'react';
import {
  type CollaborationMode,
  type CollaborationContext,
  resolvePublicSnapshot,
  resolveExternalSession,
  resolveAuthenticated,
} from '@/lib/collaborationMode';

type CollaborationInput =
  | { mode: 'public_snapshot' }
  | { mode: 'external_session'; role: 'viewer' | 'commenter' | null }
  | { mode: 'authenticated'; role: 'owner' | 'commenter' | 'viewer' | null };

export function useCollaborationContext(input: CollaborationInput): CollaborationContext {
  return useMemo(() => {
    switch (input.mode) {
      case 'public_snapshot':
        return resolvePublicSnapshot();
      case 'external_session':
        return resolveExternalSession(input.role);
      case 'authenticated':
        return resolveAuthenticated(input.role);
      default:
        return resolvePublicSnapshot();
    }
  }, [input.mode, 'role' in input ? input.role : null]);
}

/**
 * Collaboration Mode Abstraction
 * 
 * Centralizes all collaboration permission logic into a single type system.
 * Three modes cover all review contexts:
 * - public_snapshot: SharedReview + AdvisorView (read-only, frozen data)
 * - external_session: SoftCollabReview (session-gated, live data, optional commenting)
 * - authenticated: Review page (full access for owner/collaborators)
 */

export type CollaborationMode = 'public_snapshot' | 'external_session' | 'authenticated';

export interface CollaborationContext {
  mode: CollaborationMode;
  role: 'owner' | 'commenter' | 'viewer' | null;
  canComment: boolean;
  canSuggest: boolean;
  isOwner: boolean;
  isExternal: boolean;
  isPublic: boolean;
}

/**
 * Resolve collaboration context for public snapshot mode
 */
export function resolvePublicSnapshot(): CollaborationContext {
  return {
    mode: 'public_snapshot',
    role: 'viewer',
    canComment: false,
    canSuggest: false,
    isOwner: false,
    isExternal: false,
    isPublic: true,
  };
}

/**
 * Resolve collaboration context for external session mode
 */
export function resolveExternalSession(
  sessionRole: 'viewer' | 'commenter' | null
): CollaborationContext {
  return {
    mode: 'external_session',
    role: sessionRole,
    canComment: sessionRole === 'commenter',
    canSuggest: sessionRole === 'commenter',
    isOwner: false,
    isExternal: true,
    isPublic: false,
  };
}

/**
 * Resolve collaboration context for authenticated mode
 */
export function resolveAuthenticated(
  dbRole: 'owner' | 'commenter' | 'viewer' | null
): CollaborationContext {
  return {
    mode: 'authenticated',
    role: dbRole,
    canComment: dbRole === 'owner' || dbRole === 'commenter',
    canSuggest: false, // suggestions are external-only
    isOwner: dbRole === 'owner',
    isExternal: false,
    isPublic: false,
  };
}

/**
 * Collaboration Utilities
 * 
 * Core types and utilities for the lightweight collaboration (observer model).
 * Supports viewer and commenter roles with tier-based limits.
 */

import { type ProductTier } from './subscriptionTiers';

// Collaboration tier limits
export const COLLABORATION_LIMITS: Record<ProductTier, number> = {
  standard: 0,
  student: 0,
  pro: 1,
  business: 5,
};

export type CollaboratorRole = 'viewer' | 'commenter';

export interface Collaborator {
  id: string;
  planId: string;
  ownerId: string;
  email: string;
  userId: string | null;
  role: CollaboratorRole;
  invitedAt: string;
  acceptedAt: string | null;
}

export interface PlanComment {
  id: string;
  planId: string;
  authorId: string;
  authorName: string;
  targetType: 'plan' | 'task' | 'insight';
  targetRef: string | null;
  content: string;
  createdAt: string;
  editedAt: string | null;
  deletedAt: string | null;
}

/**
 * Get the maximum number of collaborators for a tier
 */
export function getCollaboratorLimit(tier: ProductTier): number {
  return COLLABORATION_LIMITS[tier] || 0;
}

/**
 * Check if user can add more collaborators based on tier
 */
export function canAddCollaborator(tier: ProductTier, currentCount: number): boolean {
  const limit = getCollaboratorLimit(tier);
  return limit > 0 && currentCount < limit;
}

/**
 * Check if collaboration is available for a tier
 */
export function hasCollaborationAccess(tier: ProductTier): boolean {
  return getCollaboratorLimit(tier) > 0;
}

/**
 * Format comment time for display
 */
export function formatCommentTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Format role for display
 */
export function formatRole(role: CollaboratorRole): string {
  return role === 'viewer' ? 'Viewer' : 'Commenter';
}

/**
 * Get initials from email or name
 */
export function getInitials(emailOrName: string): string {
  const name = emailOrName.split('@')[0];
  const parts = name.split(/[._-]/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

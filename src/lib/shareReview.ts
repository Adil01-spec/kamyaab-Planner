/**
 * Share Review Utilities
 * 
 * Token generation and link management for shareable plan reviews.
 */

/**
 * Generate a secure, URL-safe token for sharing
 * 16 bytes = 128 bits of entropy
 */
export function generateShareToken(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(36).padStart(2, '0')).join('');
}

/**
 * Get the full shareable URL for a review token
 */
export function getShareUrl(token: string): string {
  return `${window.location.origin}/shared-review/${token}`;
}

/**
 * Calculate expiry date based on days from now
 */
export function getExpiryDate(days: 7 | 14 | 30): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

/**
 * Check if a share link has expired
 */
export function isShareExpired(expiresAt: string | Date): boolean {
  const expiryDate = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
  return expiryDate < new Date();
}

/**
 * Format expiry date for display
 */
export function formatExpiryDate(expiresAt: string | Date): string {
  const date = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Get days remaining until expiry
 */
export function getDaysUntilExpiry(expiresAt: string | Date): number {
  const expiryDate = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
  const now = new Date();
  const diffTime = expiryDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

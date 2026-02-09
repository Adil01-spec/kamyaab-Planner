/**
 * Strategic Access Resolver
 * 
 * Determines a user's access level for Strategic Planning based on:
 * - Subscription tier (paid = full access)
 * - Strategic trial status (unused = preview access, one-time only)
 * 
 * IMPORTANT: Access is NOT granted by plan history, task completion, or any other
 * activity signals. These are for analysis only, never entitlement.
 */

export type StrategicAccessLevel = 'none' | 'preview' | 'full';

export interface StrategicAccessInput {
  subscriptionTier: string;
  subscriptionState?: string;
  strategicTrialUsed: boolean;
  emailDomainType?: 'standard' | 'disposable' | 'enterprise';
}

export interface StrategicAccessResult {
  level: StrategicAccessLevel;
  reason: string;
  canRegenerate: boolean;
  canViewFullPlan: boolean;
}

/**
 * Resolve strategic planning access level based on user state.
 * Pure function - no side effects.
 * 
 * Access rules (server-enforced):
 * - Paid tier (non-standard, active) = full access
 * - Disposable email + trial used = none
 * - Disposable email + trial available = preview
 * - Standard tier + trial available = preview (one-time)
 * - Standard tier + trial used = none (must upgrade)
 */
export function resolveStrategicAccess(input: StrategicAccessInput): StrategicAccessResult {
  const {
    subscriptionTier,
    subscriptionState = 'active',
    strategicTrialUsed,
    emailDomainType = 'standard',
  } = input;

  // Paid subscribers always get full access
  if (subscriptionTier !== 'standard' && subscriptionState === 'active') {
    return {
      level: 'full',
      reason: 'Active subscription',
      canRegenerate: true,
      canViewFullPlan: true,
    };
  }

  // Disposable email users are capped at preview (soft gate)
  if (emailDomainType === 'disposable') {
    return {
      level: strategicTrialUsed ? 'none' : 'preview',
      reason: 'Strategic planning works best with a stable account and ongoing history.',
      canRegenerate: false,
      canViewFullPlan: false,
    };
  }

  // New users without history can use their one-time preview
  if (!strategicTrialUsed) {
    return {
      level: 'preview',
      reason: 'Strategic trial available',
      canRegenerate: false,
      canViewFullPlan: false,
    };
  }

  // No access - trial used, must upgrade
  return {
    level: 'none',
    reason: 'Upgrade to Pro for unlimited strategic planning.',
    canRegenerate: false,
    canViewFullPlan: false,
  };
}

/**
 * Get calm, non-accusatory messaging for access states
 */
export function getStrategicAccessMessage(result: StrategicAccessResult): string {
  switch (result.level) {
    case 'full':
      return '';
    case 'preview':
      return 'This is your one-time strategic preview. Upgrade to Pro for unlimited access.';
    case 'none':
      return result.reason;
  }
}

/**
 * Check if user can access strategic planning features at all
 */
export function canAccessStrategicPlanning(input: StrategicAccessInput): boolean {
  const result = resolveStrategicAccess(input);
  return result.level !== 'none';
}

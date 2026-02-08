/**
 * Strategic Access Resolver
 * 
 * Determines a user's access level for Strategic Planning based on:
 * - Subscription tier (paid = full access)
 * - Plan history (1+ completed plans = full access)
 * - Current plan execution (3+ tasks completed = full access)
 * - Strategic trial status (unused = preview access)
 */

export type StrategicAccessLevel = 'none' | 'preview' | 'full';

export interface StrategicAccessInput {
  subscriptionTier: string;
  subscriptionState?: string;
  planHistoryCount: number;
  completedTasksCurrentPlan: number;
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
 */
export function resolveStrategicAccess(input: StrategicAccessInput): StrategicAccessResult {
  const {
    subscriptionTier,
    subscriptionState = 'active',
    planHistoryCount,
    completedTasksCurrentPlan,
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

  // Users with at least one completed plan get full access
  if (planHistoryCount >= 1) {
    return {
      level: 'full',
      reason: 'Completed plan history',
      canRegenerate: true,
      canViewFullPlan: true,
    };
  }

  // Users with meaningful execution history get full access
  if (completedTasksCurrentPlan >= 3) {
    return {
      level: 'full',
      reason: 'Meaningful execution history',
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

  // No access - trial used, no history
  return {
    level: 'none',
    reason: 'Complete a plan cycle to unlock Strategic Planning.',
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
      return 'To refine this strategy, Kaamyab needs to learn how you actually work.';
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

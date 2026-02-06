
# Billing-Ready Infrastructure (Provider-Agnostic)

## Overview

This phase prepares the app for future billing enforcement while maintaining the current experience for all users. No payments, no blocking, no countdowns—just structural readiness.

## Current State

The app already has partial subscription infrastructure:
- **Database**: `profiles` table has `subscription_tier`, `subscription_expires_at`, `subscription_provider`
- **Types**: `ProductTier` type with 4 tiers (standard/student/pro/business)
- **Feature Registry**: 30+ features with tier requirements and `previewable` flags
- **Access Hooks**: `useSubscription`, `useFeatureAccess` already check tier
- **UI Components**: `LockedFeatureCard`, `UpgradeExplanationSheet` show locked state

## What's Missing

| Area | Current | Needed |
|------|---------|--------|
| Subscription State | Only `tier` stored | Add `subscription_state` (active/trial/grace/canceled/expired) |
| Grace Period | Not tracked | Add `grace_ends_at` column |
| Effective Subscription | Basic tier check | `getEffectiveSubscription()` helper with full state resolution |
| Feature Registry | Has `tier` and `previewable` | Rename for clarity: `preview_allowed` → already `previewable` |
| UI Awareness | Shows tier badges | Add subtle state indicators (grace, preview) |

## Implementation

### 1. Database Schema Extension

Add new columns to `profiles` table:

```sql
-- Subscription state enum
CREATE TYPE public.subscription_state AS ENUM (
  'active',    -- Paid and valid
  'trial',     -- Trial period (not used initially)
  'grace',     -- Payment failed, grace period active
  'canceled',  -- User canceled, access until expires_at
  'expired'    -- Subscription ended
);

-- Add subscription state columns
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS subscription_state subscription_state DEFAULT 'active',
ADD COLUMN IF NOT EXISTS grace_ends_at timestamp with time zone;

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.subscription_state IS 'Current subscription lifecycle state';
COMMENT ON COLUMN public.profiles.grace_ends_at IS 'End of grace period after failed payment';
```

### 2. Server-Side Subscription Helper

Create `src/lib/subscriptionResolver.ts`:

```text
┌─────────────────────────────────────────────────────────────┐
│ getEffectiveSubscription(profile)                           │
├─────────────────────────────────────────────────────────────┤
│ Inputs:                                                     │
│   - subscription_tier                                       │
│   - subscription_state                                      │
│   - subscription_expires_at                                 │
│   - grace_ends_at                                           │
├─────────────────────────────────────────────────────────────┤
│ Returns:                                                    │
│   {                                                         │
│     tier: ProductTier,                                      │
│     state: SubscriptionState,                               │
│     isPaid: boolean,          // tier !== 'standard'        │
│     inGrace: boolean,         // state === 'grace'          │
│     isActive: boolean,        // Can use paid features      │
│     daysRemaining: number | null,                           │
│   }                                                         │
├─────────────────────────────────────────────────────────────┤
│ Logic:                                                      │
│   1. Read stored values                                     │
│   2. Check if expired (subscription_expires_at < now)       │
│   3. Check if in grace (grace_ends_at > now)                │
│   4. Determine effective access                             │
│   5. Return composite state                                 │
└─────────────────────────────────────────────────────────────┘
```

### 3. Update AuthContext Profile Mapping

Add new fields to `MappedProfile` interface:

```typescript
interface MappedProfile {
  // ... existing fields ...
  subscriptionTier: string;
  subscriptionState: SubscriptionState;     // NEW
  subscriptionExpiresAt: string | null;
  subscriptionProvider: string | null;
  graceEndsAt: string | null;               // NEW
}
```

### 4. Update useSubscription Hook

Enhance to return full effective subscription:

```typescript
interface SubscriptionState {
  tier: ProductTier;
  state: 'active' | 'trial' | 'grace' | 'canceled' | 'expired';
  isPaid: boolean;
  inGrace: boolean;
  isActive: boolean;
  daysRemaining: number | null;
  hasAccess: (requiredTier: ProductTier) => boolean;
  loading: boolean;
}
```

### 5. Update Feature Registry

Add explicit `preview_allowed` (already exists as `previewable`):

```typescript
interface FeatureDefinition {
  id: string;
  name: string;
  tier: ProductTier;
  category: 'planning' | 'execution' | 'insights' | 'export';
  description: string;
  valueExplanation: string;
  previewable: boolean;        // Already exists - no change needed
}
```

### 6. UI State Indicators (Subtle)

**A. Grace Period Badge** (only shows when in grace):
- Small badge in settings/profile: "Payment pending"
- No countdown, no urgency language

**B. Pro Preview Label** (already exists):
- `LockedFeatureCard` shows tier badge
- No changes needed

### 7. Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/lib/subscriptionResolver.ts` | **Create** | `getEffectiveSubscription()` and types |
| `src/lib/subscriptionTiers.ts` | **Modify** | Add `SubscriptionState` type |
| `src/hooks/useSubscription.ts` | **Modify** | Return full effective subscription |
| `src/contexts/AuthContext.tsx` | **Modify** | Map new profile fields |
| Database migration | **Create** | Add `subscription_state`, `grace_ends_at` |

## What This Does NOT Do

- No payment buttons
- No provider SDKs (Stripe, Paddle)
- No webhooks
- No auto-downgrades
- No trial timers
- No countdowns
- No blocking of any features
- No changes visible to Standard users

## Verification

After implementation:

1. Standard users see no change
2. Manual Pro test users (set via DB) continue working
3. Grace period state can be set manually in DB
4. `getEffectiveSubscription()` returns correct state for all scenarios
5. Feature access logic uses new resolver
6. No payment UI elements appear anywhere

## Technical Details

### Database Migration SQL

```sql
-- Create subscription state enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_state') THEN
    CREATE TYPE public.subscription_state AS ENUM ('active', 'trial', 'grace', 'canceled', 'expired');
  END IF;
END $$;

-- Add columns to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS subscription_state text DEFAULT 'active',
ADD COLUMN IF NOT EXISTS grace_ends_at timestamp with time zone;
```

### Subscription Resolution Logic

```typescript
// src/lib/subscriptionResolver.ts

export type SubscriptionState = 'active' | 'trial' | 'grace' | 'canceled' | 'expired';

export interface EffectiveSubscription {
  tier: ProductTier;
  state: SubscriptionState;
  isPaid: boolean;
  inGrace: boolean;
  isActive: boolean;
  daysRemaining: number | null;
}

export function getEffectiveSubscription(profile: {
  subscriptionTier?: string | null;
  subscriptionState?: string | null;
  subscriptionExpiresAt?: string | null;
  graceEndsAt?: string | null;
}): EffectiveSubscription {
  const tier = (profile.subscriptionTier || 'standard') as ProductTier;
  const state = (profile.subscriptionState || 'active') as SubscriptionState;
  const expiresAt = profile.subscriptionExpiresAt ? new Date(profile.subscriptionExpiresAt) : null;
  const graceEndsAt = profile.graceEndsAt ? new Date(profile.graceEndsAt) : null;
  const now = new Date();
  
  // Calculate days remaining
  let daysRemaining: number | null = null;
  if (expiresAt && expiresAt > now) {
    daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }
  
  // Determine if in grace period
  const inGrace = state === 'grace' && graceEndsAt !== null && graceEndsAt > now;
  
  // Active = can use paid features
  // For now, ALL non-expired tiers are active (no enforcement yet)
  const isActive = tier !== 'standard';
  
  return {
    tier,
    state,
    isPaid: tier !== 'standard',
    inGrace,
    isActive,
    daysRemaining,
  };
}
```

### Hook Update

```typescript
// src/hooks/useSubscription.ts

export function useSubscription(): SubscriptionState {
  const { profile, loading } = useAuth();
  
  const effective = getEffectiveSubscription({
    subscriptionTier: profile?.subscriptionTier,
    subscriptionState: profile?.subscriptionState,
    subscriptionExpiresAt: profile?.subscriptionExpiresAt,
    graceEndsAt: profile?.graceEndsAt,
  });
  
  return {
    ...effective,
    hasAccess: (requiredTier: ProductTier) => 
      effective.isActive && tierIncludesAccess(effective.tier, requiredTier),
    loading,
  };
}
```

## Summary

This phase adds the structural foundation for billing without changing user experience. When billing enforcement is enabled in a future phase, it will be a matter of:

1. Connecting a payment provider
2. Adding webhook handlers to update `subscription_state`
3. Changing `isActive` logic to respect expiration

All current users continue exactly as before.



## Phase 10.0 — Monetization Without Betrayal (Transparent Value Framing)

### Overview

Introduce pricing tiers, monetization structure, and premium feature visibility without breaking trust, degrading the free experience, or introducing pressure-based UX. Users must clearly understand what exists, what is free forever, and what additional depth is available in paid tiers.

**Core Principle:** "I can see the depth here. If I ever need it, I know exactly where to go."

---

### Current State Analysis

**Existing Infrastructure:**
- `src/lib/productTiers.ts`: Defines `ProductTier = 'free' | 'pro'` with `FEATURE_REGISTRY` mapping features to tiers
- `src/hooks/useFeatureAccess.ts`: Hook for checking feature access based on `is_strategic_plan` flag
- `src/lib/featureUsageTracking.ts`: Tracks feature interest signals to localStorage
- `ProFeatureIndicator`, `ProFeatureHint`: UI components for indicating Pro features
- Current gating is based on plan type (`is_strategic_plan`), not user subscription

**Gaps to Address:**
1. Only 2 tiers exist (Free/Pro) — need 4 tiers (Standard, Student, Pro, Business)
2. No user subscription state stored in database
3. No centralized pricing information (PKR-based)
4. No locked feature preview/explanation sheets
5. No upgrade pathway UI
6. No ads infrastructure (Standard tier)
7. Feature gating is scattered across components

---

### New Tier Definitions

```typescript
export type ProductTier = 'standard' | 'student' | 'pro' | 'business';

export interface TierDefinition {
  id: ProductTier;
  name: string;
  tagline: string;
  priceMonthlyPKR: number | null; // null = free
  priceYearlyPKR: number | null;
  features: string[];
  highlighted?: boolean;
}

export const TIER_DEFINITIONS: Record<ProductTier, TierDefinition> = {
  standard: {
    id: 'standard',
    name: 'Standard',
    tagline: 'Core planning and execution',
    priceMonthlyPKR: null, // Free forever
    priceYearlyPKR: null,
    features: [
      'Core planning and execution',
      'Timers, defer, partial progress',
      'End-of-day closure',
      'Calm re-entry',
    ],
  },
  student: {
    id: 'student',
    name: 'Student',
    tagline: 'Focused learning support',
    priceMonthlyPKR: 299,
    priceYearlyPKR: 2499,
    features: [
      'Everything in Standard',
      'No ads',
      'Extended plan history (30 plans)',
      'Basic execution insights',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    tagline: 'Strategic depth and analysis',
    priceMonthlyPKR: 999,
    priceYearlyPKR: 7999,
    features: [
      'Strategic planning mode',
      'Strategy overview, risks, assumptions',
      'Execution insights & diagnosis',
      'Plan history comparison',
      'PDF export',
      'Style & pattern analysis',
      'No ads',
    ],
    highlighted: true,
  },
  business: {
    id: 'business',
    name: 'Business',
    tagline: 'Professional team planning',
    priceMonthlyPKR: 2499,
    priceYearlyPKR: 19999,
    features: [
      'Everything in Pro',
      'Multi-plan comparison',
      'Long-term pattern tracking',
      'Scenario-aware analysis',
      'Professional sharing & exports',
      'Higher usage caps',
    ],
  },
};
```

---

### Feature Registry (Enhanced Single Source of Truth)

```typescript
// Extend existing FEATURE_REGISTRY with tier granularity
export interface FeatureDefinition {
  id: string;
  name: string;
  tier: ProductTier;  // Changed from 'free' | 'pro' to ProductTier
  category: 'planning' | 'execution' | 'insights' | 'export' | 'meta';
  description: string;
  valueExplanation: string;  // NEW: Plain factual explanation
  previewable: boolean;       // NEW: Can show read-only preview
}

// Example updates:
'strategic-planning': {
  id: 'strategic-planning',
  name: 'Strategic Planning',
  tier: 'pro',
  category: 'planning',
  description: 'Advanced planning with context discovery',
  valueExplanation: 'Strategic planning identifies assumptions, risks, and blind spots before you start.',
  previewable: true,
},
'plan-history': {
  id: 'plan-history',
  name: 'Plan History',
  tier: 'student',  // Available from Student tier
  category: 'insights',
  description: 'View past completed plans',
  valueExplanation: 'See your past plans to track progress over time.',
  previewable: true,
},
```

---

### Database Schema Updates

Add subscription state to profiles table:

```sql
-- Add subscription fields to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS 
  subscription_tier TEXT DEFAULT 'standard' CHECK (subscription_tier IN ('standard', 'student', 'pro', 'business'));

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS 
  subscription_expires_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS 
  subscription_provider TEXT DEFAULT NULL;  -- 'stripe', 'manual', etc.
```

---

### Architecture Overview

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                         Feature Access Flow                              │
│                                                                         │
│  ┌─────────────────┐    ┌──────────────────┐    ┌───────────────────┐ │
│  │ User Profile    │───►│ getUserTier()    │───►│ hasFeatureAccess()│ │
│  │ subscription_   │    │ Returns tier     │    │ Returns boolean   │ │
│  │ tier column     │    │ from DB or plan  │    │ based on registry │ │
│  └─────────────────┘    └──────────────────┘    └───────────────────┘ │
│                                                                         │
│                              │                                          │
│                              ▼                                          │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    UI Layer Response                             │   │
│  │                                                                  │   │
│  │  Has Access?                                                     │   │
│  │  ├── YES: Render full feature                                   │   │
│  │  └── NO:                                                        │   │
│  │      ├── Render collapsed/preview state (if previewable)        │   │
│  │      ├── Show LockedFeatureIndicator with lock icon             │   │
│  │      └── On click: Show UpgradeExplanationSheet                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### Component: LockedFeatureCard

New component for displaying locked features with previews:

```typescript
interface LockedFeatureCardProps {
  featureId: string;
  children?: React.ReactNode;  // Preview content if previewable
  className?: string;
}

// Visual design:
// - Muted background with subtle border
// - Small lock icon in corner
// - Feature name and value explanation
// - "Available in [Tier]" badge
// - Optional collapsed preview of actual data
// - Tap opens UpgradeExplanationSheet
```

---

### Component: UpgradeExplanationSheet

New bottom sheet for explaining feature value:

```typescript
interface UpgradeExplanationSheetProps {
  featureId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Content:
// 1. Feature name and icon
// 2. Plain factual explanation (from registry)
// 3. Which tier unlocks it
// 4. PKR pricing (monthly/yearly)
// 5. "View Plans" button (links to /pricing)
// 6. Close button

// Visual design:
// - Calm, informational tone
// - No urgency colors or countdowns
// - Single optional CTA
```

---

### Component: TierComparisonTable

New component for pricing page and settings:

```typescript
interface TierComparisonTableProps {
  currentTier: ProductTier;
  onSelectTier?: (tier: ProductTier) => void;
}

// Shows all 4 tiers side by side:
// - Standard (Free) | Student | Pro | Business
// - PKR pricing for each
// - Feature checkmarks
// - Current tier highlighted
// - "Current Plan" badge on active tier
```

---

### Files to Create

| File | Purpose |
|------|---------|
| `src/lib/subscriptionTiers.ts` | Tier definitions, pricing, and tier comparison utilities |
| `src/components/LockedFeatureCard.tsx` | Locked feature display with optional preview |
| `src/components/UpgradeExplanationSheet.tsx` | Calm upgrade explanation sheet |
| `src/components/TierComparisonTable.tsx` | Tier comparison for pricing page |
| `src/hooks/useSubscription.ts` | Hook to fetch and manage user subscription state |
| `src/pages/Pricing.tsx` | New pricing page (optional, can be linked externally) |
| `.lovable/memory/features/monetization-transparent-framing.md` | Phase 10.0 documentation |

### Files to Modify

| File | Change |
|------|--------|
| `src/lib/productTiers.ts` | Extend to 4 tiers, add valueExplanation and previewable fields |
| `src/hooks/useFeatureAccess.ts` | Support 4-tier hierarchy, read from subscription state |
| `src/contexts/AuthContext.tsx` | Include subscription_tier in profile mapping |
| `src/components/ProFeatureIndicator.tsx` | Update to show tier-specific badges (Student/Pro/Business) |
| `src/components/PlanHistorySection.tsx` | Wrap locked features with LockedFeatureCard |
| `src/components/PlanningStyleProfile.tsx` | Show locked preview state for free users |
| `src/components/NextCycleGuidance.tsx` | Show locked preview state for free users |
| `src/pages/Review.tsx` | Integrate locked feature cards throughout |

---

### Implementation Order

1. **Database migration** — Add `subscription_tier` column to profiles table
2. **Tier definitions** — `subscriptionTiers.ts` with all 4 tiers and PKR pricing
3. **Product tiers update** — Extend `productTiers.ts` with new tier hierarchy and feature metadata
4. **Subscription hook** — `useSubscription.ts` to fetch tier from profile
5. **Auth context update** — Include subscription_tier in mapped profile
6. **Feature access update** — Update `useFeatureAccess.ts` for 4-tier hierarchy
7. **Locked feature card** — `LockedFeatureCard.tsx` with preview support
8. **Upgrade sheet** — `UpgradeExplanationSheet.tsx` with calm explanation
9. **Tier indicator update** — Update `ProFeatureIndicator.tsx` for all tiers
10. **Wire to Review page** — Integrate locked cards throughout /review
11. **Tier comparison** — `TierComparisonTable.tsx` for settings/pricing
12. **Memory file** — Document in `.lovable/memory/features/monetization-transparent-framing.md`
13. **Update plan.md** — Mark Phase 10.0 as implemented

---

### Locked Feature Visibility Rules

| User Tier | Feature Tier | Behavior |
|-----------|--------------|----------|
| Standard | Standard | Full access |
| Standard | Student | Show locked with preview, "Available in Student" |
| Standard | Pro | Show locked with preview, "Available in Pro" |
| Standard | Business | Show locked with preview, "Available in Business" |
| Student | Student | Full access |
| Student | Pro | Show locked with preview, "Available in Pro" |
| Pro | Pro | Full access |
| Pro | Business | Show locked with preview, "Available in Business" |
| Business | Business | Full access |

---

### Value Explanation Examples (Factual, Not Sales Copy)

| Feature | Explanation |
|---------|-------------|
| Strategic Planning | "Strategic planning identifies assumptions, risks, and blind spots before you start." |
| Execution Diagnosis | "Execution diagnosis highlights recurring inefficiencies over time." |
| Plan Comparison | "Compare your current plan with past plans to see trends." |
| PDF Export | "Exports generate professional summaries for sharing." |
| Planning Style Profile | "See patterns in how you approach planning based on your history." |
| Advisor View | "Create read-only links for mentors to review your progress." |

---

### Ads Infrastructure (Standard Tier Only)

**Phase 10.0 Scope:** Define placement rules only. Actual ad integration deferred.

**Placement Rules:**
- Only on Standard tier
- Never during active task execution
- Never near locked feature explanations
- Never during planning or reflection flows
- Allowed: Home page footer, Review page footer (after all content)
- Type: Rewarded or passive only

**Component Placeholder:**
```typescript
// src/components/AdPlacement.tsx
interface AdPlacementProps {
  slot: 'home-footer' | 'review-footer';
}

// For Phase 10.0: Just renders null
// Future: Integrate with AdMob or similar
```

---

### Guardrails (Non-Negotiable)

| Rule | Implementation |
|------|----------------|
| No feature removal | Standard features never degrade |
| No degradation over time | Free tier stays the same forever |
| No forced upgrade flows | Upgrade is always optional |
| No dark patterns | No countdown timers, no fake urgency |
| No manipulation | No guilt-based messaging |
| No interruption | Upgrade prompts only on explicit tap |
| Ads never block | Ads only in designated footer slots |

---

### Tier Hierarchy Check Function

```typescript
// In subscriptionTiers.ts
const TIER_HIERARCHY: ProductTier[] = ['standard', 'student', 'pro', 'business'];

export function tierIncludesAccess(userTier: ProductTier, requiredTier: ProductTier): boolean {
  const userIndex = TIER_HIERARCHY.indexOf(userTier);
  const requiredIndex = TIER_HIERARCHY.indexOf(requiredTier);
  return userIndex >= requiredIndex;
}
```

---

### Testing Checklist

**Tier Detection:**
- [ ] getUserTier returns correct tier from profile
- [ ] Falls back to plan-based tier if no subscription
- [ ] Tier hierarchy comparison works correctly

**Locked Feature Display:**
- [ ] Locked features show in UI (not hidden)
- [ ] Lock icon visible on locked features
- [ ] "Available in [Tier]" badge correct
- [ ] Preview content shown for previewable features
- [ ] Non-previewable features show explanation only

**Upgrade Flow:**
- [ ] Tap on locked feature opens explanation sheet
- [ ] Sheet shows factual explanation (no sales copy)
- [ ] Sheet shows correct tier and PKR pricing
- [ ] "View Plans" button works (or shows inline comparison)
- [ ] Sheet dismisses cleanly

**Guardrails:**
- [ ] No automatic upgrade prompts
- [ ] No countdown timers or urgency
- [ ] Standard features unchanged
- [ ] Ads only in designated slots (when implemented)
- [ ] No guilt-based messaging

---

### Summary

Phase 10.0 introduces transparent monetization:

1. **Four Tiers** — Standard (Free), Student, Pro, Business with PKR pricing
2. **Feature Registry** — Single source of truth for all feature access
3. **Locked Visibility** — Premium features visible but locked, never hidden
4. **Value Explanation** — Factual, plain language descriptions (no sales copy)
5. **Read-Only Previews** — Show user's own data in locked state where possible
6. **Gentle Upgrade** — Single explanation sheet, no pressure
7. **Ads Rules** — Standard tier only, never interrupting core workflows

**Product Intent:** Users understand tiers in under 30 seconds. Standard users feel respected. Paid tiers feel clearly more powerful, not mandatory. Trust is preserved.


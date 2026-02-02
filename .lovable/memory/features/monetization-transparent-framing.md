# Memory: features/monetization-transparent-framing
Updated: 2026-02-02

## Phase 10.0 — Monetization Without Betrayal

### Overview
Transparent value framing with 4 pricing tiers (Standard, Student, Pro, Business) and PKR-based pricing. No paywalls, no dark patterns, no forced upgrades. Users understand what exists and can upgrade when they need more depth.

### Tier Hierarchy
1. **Standard (Free)**: Core planning, execution, timers, defer, day closure, calm re-entry
2. **Student (PKR 299/mo)**: No ads, extended plan history (30 plans), basic execution insights
3. **Pro (PKR 999/mo)**: Strategic planning, strategy overview, execution diagnosis, plan comparison, PDF export, style analysis
4. **Business (PKR 2499/mo)**: Multi-plan comparison, long-term patterns, scenario analysis, professional exports

### Key Components
- `src/lib/subscriptionTiers.ts`: Tier definitions, pricing, hierarchy utilities
- `src/lib/productTiers.ts`: Feature registry with `valueExplanation` and `previewable` fields
- `src/hooks/useSubscription.ts`: Hook to fetch user's subscription tier from profile
- `src/hooks/useFeatureAccess.ts`: Updated for 4-tier hierarchy
- `src/components/LockedFeatureCard.tsx`: Shows locked features with preview and explanation
- `src/components/UpgradeExplanationSheet.tsx`: Calm explanation sheet with PKR pricing
- `src/components/TierComparisonTable.tsx`: Side-by-side tier comparison
- `src/components/AdPlacement.tsx`: Placeholder for Standard tier ads (passive/rewarded only)
- `src/components/ProFeatureIndicator.tsx`: Updated for all tiers (Student/Pro/Business badges)

### Database Schema
- `profiles.subscription_tier`: TEXT ('standard', 'student', 'pro', 'business')
- `profiles.subscription_expires_at`: TIMESTAMPTZ (nullable)
- `profiles.subscription_provider`: TEXT ('stripe', 'manual', etc.)

### Feature Gating Logic
- `tierIncludesAccess(userTier, requiredTier)`: Checks tier hierarchy
- `hasFeatureAccess(featureId, planData, subscriptionTier)`: Checks feature registry
- Higher tiers include all lower tier features

### Locked Feature UX
- Features are always visible, never hidden
- Locked features show subtle lock icon + tier badge
- Tap opens calm explanation sheet with factual value description
- Single optional CTA: "View Plans"
- No urgency, countdowns, or pressure

### Ads Strategy
- Only on Standard tier
- Allowed slots: home-footer, review-footer
- Never during: task execution, planning, reflection
- Type: Rewarded or passive only
- Currently placeholder (no actual ads integrated)

### Guardrails (Non-Negotiable)
- No feature removal from free users
- No degradation over time
- No forced upgrade flows
- No dark patterns or manipulation
- No guilt-based messaging
- Ads never block core workflows


## Plan History and Comparison Layer

### Overview

This implementation adds a Plan History section to `/review` that allows users to view past plans and compare them with the current plan. The feature is strictly read-only and observational - no execution changes, no AI plan modifications.

**Core Concept:**
- View past completed plans
- Select one for comparison with current plan
- See metric deltas and AI-generated observational insights
- Pattern signals surface only with repeated data

---

### Current State Analysis

**Existing Infrastructure:**
- `plans` table: Stores ONE active plan per user
- `progress_history` in `profiles.profession_details`: Contains `PlanCycleSnapshot[]` with metrics only (no full plan data)
- `ProgressProof.tsx`: Already shows trends and comparisons using snapshots
- `progressProof.ts`: Has comparison and trend detection logic

**Gap:**
- No storage for full historical plan data (tasks, structure, title)
- Need a `plan_history` table to archive completed plans

---

### Database Schema Changes

**Table: `plan_history`**
```sql
CREATE TABLE public.plan_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Plan identification
  plan_title TEXT NOT NULL,
  plan_description TEXT,
  is_strategic BOOLEAN DEFAULT false,
  scenario_tag TEXT,
  
  -- Date range
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL,
  
  -- Summary metrics (denormalized for quick display)
  total_tasks INTEGER NOT NULL,
  completed_tasks INTEGER NOT NULL,
  total_weeks INTEGER NOT NULL,
  total_time_seconds BIGINT DEFAULT 0,
  
  -- Full plan snapshot for detailed comparison
  plan_snapshot JSONB NOT NULL,
  
  -- Cached comparison insights (AI-generated)
  comparison_insights JSONB,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: Users can only access their own history
CREATE POLICY "Users can view their own plan history"
  ON plan_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own plan history"
  ON plan_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Index for efficient user lookups
CREATE INDEX idx_plan_history_user_id ON plan_history(user_id);
CREATE INDEX idx_plan_history_completed_at ON plan_history(user_id, completed_at DESC);
```

---

### Architecture

```text
/review page
    |
    v
+------------------------+
|  Plan History Section  |
+------------------------+
    |
    ├── Plan History List (always visible)
    |   └── Past plans with summary metrics
    |
    ├── Plan Selector (Pro only)
    |   └── Dropdown to select comparison plan
    |
    └── Comparison View (Pro only)
        ├── Metric Deltas (task count, completion, time)
        ├── Comparative Insights (AI-generated, cached)
        └── Pattern Signals (if repeated across plans)
```

---

### Files to Create

| File | Description |
|------|-------------|
| `src/components/PlanHistorySection.tsx` | Main section component for /review |
| `src/components/PlanHistoryList.tsx` | List of past plans with summary cards |
| `src/components/PlanComparisonView.tsx` | Side-by-side comparison display |
| `src/components/PatternSignals.tsx` | Subtle pattern indicators |
| `src/hooks/usePlanHistory.ts` | Hook for fetching/managing plan history |
| `src/lib/planHistoryComparison.ts` | Comparison logic and metric calculations |
| `supabase/functions/plan-comparison-insights/index.ts` | AI edge function for comparative insights |

### Files to Modify

| File | Description |
|------|-------------|
| `src/pages/Review.tsx` | Add PlanHistorySection below existing sections |
| `src/lib/productTiers.ts` | Add `plan-history-list` (free) and `plan-comparison` (pro) features |
| `src/pages/PlanReset.tsx` | Archive current plan to history when resetting |

---

### Technical Implementation

#### 1. Plan History Hook

```typescript
// src/hooks/usePlanHistory.ts
interface PlanHistorySummary {
  id: string;
  plan_title: string;
  is_strategic: boolean;
  scenario_tag?: string;
  started_at: string;
  completed_at: string;
  total_tasks: number;
  completed_tasks: number;
  total_weeks: number;
  total_time_seconds: number;
  completion_percent: number;
}

interface UsePlanHistoryReturn {
  history: PlanHistorySummary[];
  loading: boolean;
  error: string | null;
  selectedPlan: PlanHistoryFull | null;
  selectPlanForComparison: (id: string) => Promise<void>;
  clearSelection: () => void;
}
```

#### 2. Plan History List Component

Displays past plans in a compact list format:
- Plan title
- Date range (e.g., "Jan 5 - Feb 2, 2026")
- Strategic vs Standard badge
- Completion percentage
- Total execution time

Sorted: Most recent first

#### 3. Plan Selector (Pro-gated)

Simple dropdown or radio selector:
- Lists past plans by title + date
- Single selection only
- Clear selection option
- Pro indicator for free users

#### 4. Comparison Metrics

When a plan is selected, display deltas:

| Metric | Display |
|--------|---------|
| Task count | Current: 24 / Previous: 18 (+6 ↑) |
| Completion rate | 87% / 72% (+15% ↑) |
| Total time | 32h / 28h (+4h) |
| Execution drift | On-time / Late (Improved ↑) |

Delta indicators:
- ↑ Green = improvement
- ↓ Muted = decline
- ─ Neutral = stable

#### 5. Comparative Insights (AI, Cached)

Edge function generates observational insights:

**Input:**
- Current plan metrics
- Selected historical plan metrics
- Comparison deltas

**Output:**
```typescript
interface ComparativeInsights {
  observations: string[]; // 2-3 observational statements
  pattern_note?: string;  // Only if pattern detected across plans
  generated_at: string;
  plans_compared: [string, string]; // IDs
}
```

**Example observations:**
- "Fewer tasks led to higher completion rate"
- "Execution time improved compared to previous plan"
- "Strategic plans show more consistent pacing"

**Rules:**
- No advice or commands
- No AI adjustments
- Cached in `plan_history.comparison_insights`
- Regenerated only if underlying data changes

#### 6. Pattern Signals (Conservative)

Shown only if pattern appears across 3+ plans:

```typescript
interface PatternSignal {
  id: string;
  label: string;
  detail: string;
  frequency: number; // How many plans show this
  severity: 'info' | 'observation';
}
```

**Example patterns:**
- "Time underestimation" - appeared in 4 of 5 plans
- "Task fragmentation impact" - appeared in 3 of 5 plans

Display:
- Subtle, collapsible
- Non-judgmental tone
- Only after sufficient data

#### 7. Archive Plan on Reset

Modify `PlanReset.tsx` to archive current plan before generating new:

```typescript
async function archiveCurrentPlan(userId: string, plan: PlanData, profile: Profile) {
  const metrics = compileExecutionMetrics(plan);
  const progress = calculatePlanProgress(plan);
  
  await supabase.from('plan_history').insert({
    user_id: userId,
    plan_title: profile.projectTitle || 'Untitled Plan',
    plan_description: plan.overview,
    is_strategic: plan.is_strategic_plan || false,
    scenario_tag: plan.plan_context?.scenario || null,
    started_at: // calculated from plan creation
    completed_at: new Date().toISOString(),
    total_tasks: progress.total,
    completed_tasks: progress.completed,
    total_weeks: plan.total_weeks,
    total_time_seconds: metrics.totalTimeSpent,
    plan_snapshot: plan,
  });
}
```

---

### Edge Function: plan-comparison-insights

```typescript
// supabase/functions/plan-comparison-insights/index.ts

// Input: current plan metrics, historical plan metrics
// Output: 2-3 observational insights, optional pattern note

// Uses Lovable AI (google/gemini-3-flash-preview)
// Cached in plan_history.comparison_insights
// Only regenerated if comparison pair changes
```

**Prompt Design:**
- Observational only
- No advice, no commands
- Focus on behavioral patterns
- Brief, professional tone

---

### Pro Gating

| Feature | Tier | Behavior |
|---------|------|----------|
| View Plan History List | Free | See all past plans |
| Select for Comparison | Pro | Dropdown enabled |
| View Comparison Metrics | Pro | Deltas shown |
| Comparative Insights | Pro | AI observations |
| Pattern Signals | Pro | Cross-plan patterns |

Free users see:
- Full plan history list
- Subtle Pro indicator on comparison features
- Calm upsell on click

---

### Review Page Integration

Add after External Feedback section:

```tsx
{/* 9. Plan History & Comparison */}
{user && (
  <PlanHistorySection
    userId={user.id}
    currentPlanId={planId}
    currentPlan={plan}
  />
)}
```

Section structure:
- Collapsible (collapsed by default)
- Title: "Plan History"
- Subtitle: "Compare with past plans"
- Pro indicator on comparison features

---

### Placement Rules (Enforced)

| Location | Allowed |
|----------|---------|
| /review | Yes |
| /plan | No |
| /today | No |
| /home | No |
| Onboarding | No |
| Plan reset | Only archiving logic |

---

### Guardrails (Critical)

| Constraint | Implementation |
|------------|----------------|
| No execution changes | Read-only components |
| No task mutations | No edit handlers |
| No timer impact | No timer state access |
| No AI plan rewriting | Insights are observational only |
| No gamification | No scores, badges, or achievements |
| Cached insights | Regenerate only on data change |

---

### Implementation Order

1. Database migration: Create `plan_history` table
2. Register new features in `productTiers.ts`
3. Create `usePlanHistory.ts` hook
4. Create `src/lib/planHistoryComparison.ts` utilities
5. Create `PlanHistoryList.tsx` component
6. Create `PlanComparisonView.tsx` component
7. Create `PatternSignals.tsx` component
8. Create `PlanHistorySection.tsx` wrapper
9. Create edge function `plan-comparison-insights`
10. Update `PlanReset.tsx` to archive plans
11. Integrate into `Review.tsx`

---

### Testing Checklist

**Plan History Display:**
- [ ] Past plans appear in list (most recent first)
- [ ] Title, dates, metrics displayed correctly
- [ ] Strategic vs Standard badges work
- [ ] Empty state for no history

**Comparison (Pro):**
- [ ] Selector shows past plans
- [ ] Selection loads comparison view
- [ ] Metric deltas calculated correctly
- [ ] Delta indicators (↑↓─) display correctly
- [ ] Comparative insights load/cache

**Pattern Signals:**
- [ ] Only show after 3+ plans with pattern
- [ ] Collapsible and subtle
- [ ] Non-judgmental language

**Pro Gating:**
- [ ] Free users see history list
- [ ] Free users see upsell on comparison click
- [ ] Pro users can compare freely

**Guardrails:**
- [ ] No execution state changes
- [ ] No timer interference
- [ ] No auto-regeneration loops
- [ ] Works correctly on mobile

**Data Integrity:**
- [ ] Plans archived on reset
- [ ] Snapshots preserve full plan data
- [ ] Comparison insights cached correctly

---

### Summary

This implementation:

1. **Creates `plan_history` table** for archiving completed plans
2. **Shows Plan History list** (free for all users)
3. **Enables comparison selection** (Pro feature)
4. **Displays metric deltas** with clear indicators
5. **Generates observational insights** (AI, cached)
6. **Surfaces pattern signals** only with repeated data
7. **Archives plans on reset** to build history

Users will feel:
> "This app isn't tracking me - it's helping me understand myself."

The feature is calm, observational, and never judgmental.

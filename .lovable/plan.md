

## Personal Planning Style Profile

### Overview

A new read-only, observational feature on `/review` that helps Pro users understand their planning style across multiple completed plans. The profile is derived entirely from historical behavior - never from user declarations or quizzes.

**Core Principle:** This is a mirror, not a coach. No advice, no recommendations, no behavioral pressure.

---

### Data Sources

**Existing Infrastructure:**
- `plan_history` table contains full plan snapshots with metrics
- `profiles.profession_details` stores `execution_profile` - can add `planning_style_profile`
- Pattern detection already exists in `planHistoryComparison.ts`

**Derived Signals:**
| Signal | Source |
|--------|--------|
| Task count vs completion | `plan_history.total_tasks`, `completed_tasks` |
| Planned vs actual time | `plan_history.total_time_seconds`, task estimates in snapshot |
| Task reordering frequency | Track in snapshot (new field) |
| Task splitting behavior | Track in snapshot (new field) |
| Strategic vs Standard usage | `plan_history.is_strategic` |
| Execution drift patterns | Completion timing relative to weeks |

---

### Style Dimensions

Each dimension is a spectrum, not a score:

```text
Planner ←────────────→ Improviser
(Follows plan closely)    (Adapts during execution)

Optimistic ←────────────→ Conservative
(Underestimates time)     (Adds buffers)

Linear ←────────────→ Iterative  
(Sequential execution)    (Revisits and adjusts)

Strategic-leaning ←────────────→ Tactical-leaning
(Long-term focus)         (Near-term execution)
```

**Display:** Qualitative descriptors only. No percentages, no scores, no "good/bad" labels.

---

### Architecture

```text
plan_history (existing)
       |
       v
+------------------------------+
| planningStyleAnalysis.ts     |  <- NEW utility
| - Aggregate history metrics  |
| - Infer style dimensions     |
| - Generate summary           |
+------------------------------+
       |
       v
+------------------------------+
| usePlanningStyle.ts          |  <- NEW hook
| - Fetch profile from storage |
| - Calculate stability hash   |
| - Trigger regeneration only  |
|   when significant change    |
+------------------------------+
       |
       v
+------------------------------+
| PlanningStyleProfile.tsx     |  <- NEW component
| - Collapsible section        |
| - Style dimensions display   |
| - Summary paragraph          |
| - Evolution history (Pro)    |
+------------------------------+
       |
       v
+------------------------------+
| planning-style-summary       |  <- NEW edge function
| - Generate human-readable    |
|   summary via AI             |
| - Observational tone only    |
+------------------------------+
```

---

### Files to Create

| File | Purpose |
|------|---------|
| `src/lib/planningStyleAnalysis.ts` | Style inference logic from history data |
| `src/hooks/usePlanningStyle.ts` | Hook for profile management and caching |
| `src/components/PlanningStyleProfile.tsx` | UI component for /review |
| `supabase/functions/planning-style-summary/index.ts` | AI-generated summary |

### Files to Modify

| File | Change |
|------|--------|
| `src/lib/productTiers.ts` | Add `planning-style-profile` feature (Pro) |
| `src/pages/Review.tsx` | Add PlanningStyleProfile section |

---

### Technical Implementation

#### 1. Planning Style Analysis (`planningStyleAnalysis.ts`)

```typescript
interface PlanningStyleDimensions {
  // Planner vs Improviser (0 = planner, 1 = improviser)
  planAdherence: number; // Derived from completion rate variance
  
  // Optimistic vs Conservative (0 = optimistic, 1 = conservative)
  estimationBias: number; // Derived from time variance
  
  // Linear vs Iterative (0 = linear, 1 = iterative)
  executionPattern: number; // Derived from reordering/splitting
  
  // Strategic vs Tactical (0 = strategic, 1 = tactical)
  planningScope: number; // Derived from strategic plan usage
}

interface PlanningStyleProfile {
  dimensions: PlanningStyleDimensions;
  summary: string; // AI-generated, cached
  summary_generated_at: string;
  data_version_hash: string; // For stability detection
  plans_analyzed: number;
  first_analyzed_at: string;
  last_analyzed_at: string;
  evolution_history?: StyleSnapshot[]; // Track changes over time
}
```

**Inference Logic:**
- Aggregate metrics from all plans in `plan_history`
- Calculate dimension values based on weighted patterns
- Minimum 3 completed plans required to surface profile
- Changes require significant data shift to trigger regeneration

#### 2. Style Inference Rules

| Dimension | Planner (0) | Improviser (1) |
|-----------|-------------|----------------|
| Plan Adherence | >85% completion, low variance | <60% completion, high variance |

| Dimension | Optimistic (0) | Conservative (1) |
|-----------|----------------|------------------|
| Estimation | Actual > Planned by >20% | Actual < Planned by >10% |

| Dimension | Linear (0) | Iterative (1) |
|-----------|------------|---------------|
| Execution | Few reorders/splits | Frequent adjustments |

| Dimension | Strategic (0) | Tactical (1) |
|-----------|---------------|--------------|
| Scope | >50% strategic plans | <20% strategic plans |

#### 3. Stability Rules (Critical)

```typescript
function shouldRegenerateProfile(
  existingProfile: PlanningStyleProfile | null,
  newDataHash: string
): boolean {
  // Never regenerate if no existing profile and insufficient data
  if (!existingProfile) return true;
  
  // Skip if hash matches (no new data)
  if (existingProfile.data_version_hash === newDataHash) return false;
  
  // Require at least 2 new plans since last analysis
  const plansSinceLast = countNewPlansSince(existingProfile.last_analyzed_at);
  if (plansSinceLast < 2) return false;
  
  return true;
}
```

**Hash calculation:** Based on plan count, total tasks, total completion, strategic ratio.

#### 4. AI Summary Generation

**Edge Function: `planning-style-summary`**

Input: Style dimensions + plan history metrics
Output: 1-2 sentence observational summary

**Prompt Rules:**
- Observational tone only
- No advice or commands
- No "you should" or "try to"
- Factual pattern description

**Example outputs:**
- "You tend to plan ambitiously and execute best when tasks are broken into smaller units."
- "Your planning style leans toward front-loaded execution with consistent pacing."
- "You adapt plans frequently during execution, showing a flexible approach."

#### 5. UI Component

```typescript
// PlanningStyleProfile.tsx structure
<Collapsible defaultOpen={false}>
  <Card>
    <CollapsibleTrigger>
      {/* Header with icon, title, Pro badge */}
      Planning Style
      <Badge>Pro</Badge>
    </CollapsibleTrigger>
    
    <CollapsibleContent>
      {/* Insufficient data state */}
      {plansAnalyzed < 3 && (
        <EmptyState message="Complete 3+ plans to see your style" />
      )}
      
      {/* Style Dimensions - visual spectrum bars */}
      <DimensionBar label="Plan Adherence" left="Planner" right="Improviser" />
      <DimensionBar label="Estimation" left="Optimistic" right="Conservative" />
      <DimensionBar label="Execution" left="Linear" right="Iterative" />
      <DimensionBar label="Scope" left="Strategic" right="Tactical" />
      
      {/* AI Summary */}
      <SummaryParagraph text={profile.summary} />
      
      {/* Evolution History (Pro) */}
      <StyleEvolution snapshots={profile.evolution_history} />
      
      {/* Disclaimer */}
      <Disclaimer>
        This reflects your historical patterns. It does not affect your plan.
      </Disclaimer>
    </CollapsibleContent>
  </Card>
</Collapsible>
```

#### 6. Dimension Bar Component

Simple visual spectrum without scores:
```text
Planner  ●──────────────○  Improviser
          ^marker position
```

- No numbers shown
- Marker position indicates tendency
- Neutral styling (no red/green)

---

### Storage

**Location:** `profiles.profession_details.planning_style_profile`

Same pattern as `execution_profile`:

```typescript
const PROFILE_KEY = 'planning_style_profile';

async function savePlanningStyleProfile(
  userId: string,
  profile: PlanningStyleProfile
): Promise<void> {
  // Merge into existing profession_details
}
```

---

### Pro Gating

| Feature | Free | Pro |
|---------|------|-----|
| See Planning Style section | No | Yes |
| View style dimensions | No | Yes |
| View AI summary | No | Yes |
| Evolution history | No | Yes |

**Free user experience:**
- Section does not appear at all
- No preview, no upsell modal
- Clean, uncluttered review page

---

### Placement Rules

| Location | Shown |
|----------|-------|
| /review | Yes (Pro only) |
| /plan | No |
| /today | No |
| /home | No |
| Onboarding | No |
| Plan reset | No |

**Position on /review:** After Calibration Insights, before Next-Cycle Guidance.

---

### Guardrails (Non-Negotiable)

| Rule | Implementation |
|------|----------------|
| No plan modifications | Read-only component, no mutation handlers |
| No execution influence | No integration with timer or task state |
| No improvement suggestions | AI prompt explicitly forbids advice |
| No future task generation | No plan creation triggers |
| No auto-adjustments | Profile is passive observation only |
| Slow evolution | Require 2+ new plans for regeneration |
| User can hide | Collapsible, collapsed by default |

---

### Implementation Order

1. Add `planning-style-profile` to `productTiers.ts`
2. Create `planningStyleAnalysis.ts` with inference logic
3. Create `usePlanningStyle.ts` hook
4. Create `PlanningStyleProfile.tsx` component
5. Create `planning-style-summary` edge function
6. Integrate into `Review.tsx`

---

### Testing Checklist

**Data Requirements:**
- [ ] Profile appears only after 3+ completed plans
- [ ] Profile regenerates only after 2+ new plans
- [ ] Hash-based caching prevents unnecessary regeneration

**Style Dimensions:**
- [ ] All 4 dimensions display correctly
- [ ] Spectrum bars render neutrally
- [ ] No numeric scores visible

**AI Summary:**
- [ ] Summary is observational, not prescriptive
- [ ] Summary regenerates only on significant change
- [ ] Cached summary persists across sessions

**Pro Gating:**
- [ ] Section hidden for Free users
- [ ] Full access for Pro users
- [ ] No blocking modals or paywalls

**Guardrails:**
- [ ] No execution state changes
- [ ] No plan mutations
- [ ] No timer interference
- [ ] Collapsed by default
- [ ] Works on mobile

**Tone:**
- [ ] Language is neutral and respectful
- [ ] No judgment or pressure
- [ ] Feels like understanding, not tracking

---

### Summary

This implementation introduces a Personal Planning Style Profile that:

1. **Derives style from behavior** - no quizzes or declarations
2. **Uses 4 descriptive dimensions** - neutral spectrums, no scores
3. **Generates AI summary** - observational, cached, respectful
4. **Evolves slowly** - requires significant new data
5. **Is Pro-only** - clean experience for free users
6. **Appears on /review only** - no execution interference
7. **Respects user agency** - collapsible, no pressure

**Product Intent:** Users feel understood, not judged.


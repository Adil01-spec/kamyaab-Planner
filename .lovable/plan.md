
# Phase 10.1: Personal Operating Style

## Overview
Implement a lightweight, observational personalization layer called "Working Pattern Overview" that infers how a user works based solely on historical planning and execution behavior. This feature will be strictly read-only, observational, and trust-preserving.

## Architecture Summary

```text
+--------------------+      +-------------------------+      +-------------------+
|   Plan History     | ---> | Operating Style Engine  | ---> | Operating Style   |
|   (plan_history)   |      | (personalOperatingStyle)|      | Profile (stored   |
+--------------------+      +-------------------------+      | in profession_    |
                                      |                      | details)          |
+--------------------+                |                      +-------------------+
|   Day Closures     | ---------------+                              |
|   (plan_json)      |                                               v
+--------------------+                                    +-----------------------+
                                                          | UI Components         |
+--------------------+                                    | - Review Page Section |
|   Effort Feedback  | ---------------+                   | - PlanReset Hint      |
|   (localStorage)   |                |                   +-----------------------+
+--------------------+                |                              |
                                      v                              v
+--------------------+      +-------------------------+    +--------------------+
|   Task Timestamps  | ---> | AI Summary Generation   |    | Edge Function      |
|   (completed_at)   |      | (edge function)         | <--| operating-style-   |
+--------------------+      +-------------------------+    | summary            |
                                                           +--------------------+
```

## Four Neutral Dimensions

| Dimension | Left Label | Right Label | Data Sources |
|-----------|-----------|-------------|--------------|
| Planning Density | Light Planner | Detailed Planner | Task count per week, task granularity, completion ratio from plan_history |
| Execution Follow-Through | Starter | Finisher | completed_tasks / total_tasks, day_closures frequency from plan_history |
| Adjustment Behavior | Steady | Adaptive | Task deferrals (deferred_to), reordering frequency, split tasks from plan_snapshot |
| Cadence Preference | Morning Focus | Variable Rhythm | completed_at timestamps, effort_feedback clustering from localStorage |

## Files to Create

### 1. `src/lib/personalOperatingStyle.ts`
Core analysis engine with:
- `OperatingStyleDimensions` interface (four 0-1 spectrums)
- `OperatingStyleProfile` interface (dimensions, summary, cache metadata)
- Dimension calculation functions:
  - `calculatePlanningDensity()` - task count/week, granularity metrics
  - `calculateExecutionFollowThrough()` - completion vs deferrals ratio
  - `calculateAdjustmentBehavior()` - deferral rate, task movement patterns
  - `calculateCadencePreference()` - time-of-day clustering
- `shouldRegenerateProfile()` - requires 2+ new plans
- `createOperatingStyleProfile()` - factory function
- Constants: `MIN_PLANS_FOR_PROFILE = 3`

### 2. `src/hooks/useOperatingStyle.ts`
React hook managing:
- Fetching profile from `profiles.profession_details.operating_style_profile`
- Triggering regeneration when thresholds met
- Calling edge function for AI summary
- Caching and persistence
- Loading/error states

### 3. `src/components/OperatingStyleOverview.tsx`
UI component with:
- Collapsible section (collapsed by default)
- Section title: "Working Pattern Overview"
- Four neutral spectrum bars (0-1 with marker)
- AI-generated summary display
- Disclaimer: "This reflects your historical patterns."
- Pro-only visibility (no locked preview for Standard/Student)

### 4. `supabase/functions/operating-style-summary/index.ts`
Edge function for AI summary:
- Input: dimensions + metrics
- System prompt: strictly observational, no advice
- Uses Lovable AI Gateway (google/gemini-3-flash-preview)
- Fallback to template-based summary if AI unavailable

### 5. `src/components/OperatingStyleHint.tsx`
Dismissible hint component for PlanReset:
- Single factual sentence reflecting historical tendency
- Only shown on plan creation/reset
- Dismissible with local state
- Example: "You typically work through tasks early in the day."

## Files to Modify

### 1. `src/lib/productTiers.ts`
Add feature registration:
```typescript
'operating-style-overview': {
  id: 'operating-style-overview',
  name: 'Working Pattern Overview',
  tier: 'pro',
  category: 'insights',
  description: 'Personal operating style derived from behavior',
  valueExplanation: 'See patterns in how you work based on your history.',
  previewable: false, // No preview for Standard/Student
},
```

### 2. `src/pages/Review.tsx`
Add `OperatingStyleOverview` component after `PlanningStyleProfile`:
```typescript
{/* Working Pattern Overview (Pro only) */}
{user && (
  <OperatingStyleOverview
    userId={user.id}
    planData={plan}
  />
)}
```

### 3. `src/pages/PlanReset.tsx`
Add `OperatingStyleHint` near the planning mode selection step:
- Import the new component
- Pass the operating style profile to it
- Render only when profile exists with sufficient data

### 4. `supabase/config.toml`
Register new edge function:
```toml
[functions.operating-style-summary]
verify_jwt = false
```

## Technical Details

### Dimension Calculation Logic

**Planning Density (Light Planner 0 <-> Detailed Planner 1)**
```
avgTasksPerWeek = SUM(total_tasks) / SUM(total_weeks) across all plans
granularityScore = normalized(avgTasksPerWeek, min=3, max=12)
completionRatio = SUM(completed_tasks) / SUM(total_tasks)
planningDensity = (granularityScore * 0.7) + (completionRatio * 0.3)
```

**Execution Follow-Through (Starter 0 <-> Finisher 1)**
```
completionRate = AVG(completed_tasks / total_tasks) across plans
closureConsistency = (plans with day_closures) / total_plans
followThrough = (completionRate * 0.7) + (closureConsistency * 0.3)
```

**Adjustment Behavior (Steady 0 <-> Adaptive 1)**
```
deferralRate = (tasks with deferred_to) / total_tasks per plan
splitCount = count tasks matching "(Part X)" pattern
adjustmentScore = normalize(deferralRate + splitCount, max=0.5)
```

**Cadence Preference (Morning Focus 0 <-> Variable Rhythm 1)**
```
completionTimes = extract hour from all completed_at timestamps
morningCount = count(hour < 12)
afternoonCount = count(hour >= 12 && hour < 18)
eveningCount = count(hour >= 18)
variability = std_dev([morningCount, afternoonCount, eveningCount])
cadencePreference = normalize(variability, max=high variability)
```

### Data Sources Deep Dive

| Source | Location | Fields Used |
|--------|----------|-------------|
| Plan History | `plan_history` table | total_tasks, completed_tasks, total_weeks, is_strategic |
| Plan Snapshot | `plan_history.plan_snapshot` | weeks[].tasks[], day_closures[] |
| Effort Feedback | localStorage `kaamyab_effort_feedback` | effort level + timestamp |
| Active Plan | `plans.plan_json` | Current task timestamps |

### Caching Strategy
- Store in `profiles.profession_details.operating_style_profile`
- Include `data_version_hash` (computed from plan count + total tasks + total completed)
- Only regenerate when hash changes AND 2+ new plans since last analysis
- AI summary cached with `summary_generated_at` timestamp

### AI Summary Prompt (Edge Function)
```
System: You are an observational analyst. Responses must be:
- Strictly observational (what IS, not what SHOULD BE)
- Neutral tone (no good/bad, no judgment)
- 1-2 sentences maximum
- No advice, recommendations, or suggestions
- No commands or imperatives

User: Based on N completed plans, describe this person's working patterns:
- Planning density: [description based on value]
- Execution follow-through: [description based on value]
- Adjustment behavior: [description based on value]
- Cadence preference: [description based on value]

Write a brief, neutral observation. Be specific but not judgmental.
```

## Tier Visibility Rules

| Tier | Behavior |
|------|----------|
| Standard | Component not rendered at all |
| Student | Component not rendered at all |
| Pro | Full access to Working Pattern Overview |
| Business | Full access to Working Pattern Overview |

Key difference from `PlanningStyleProfile`: This feature uses `previewable: false` in the registry, meaning Standard/Student users see nothing - no placeholders, no locked UI.

## UI Component Structure

```text
OperatingStyleOverview (Collapsible)
├── CollapsibleTrigger
│   ├── Icon (Activity)
│   ├── Title: "Working Pattern Overview"
│   ├── Subtitle: "Based on X completed plans"
│   └── ChevronDown
└── CollapsibleContent
    ├── DimensionBar (Planning Density)
    ├── DimensionBar (Execution Follow-Through)
    ├── DimensionBar (Adjustment Behavior)
    ├── DimensionBar (Cadence Preference)
    ├── AI Summary Box (if available)
    └── Disclaimer text
```

## Implementation Order

1. Create `src/lib/personalOperatingStyle.ts` with types and calculation logic
2. Create `supabase/functions/operating-style-summary/index.ts`
3. Update `supabase/config.toml` to register the function
4. Create `src/hooks/useOperatingStyle.ts`
5. Add feature to `src/lib/productTiers.ts`
6. Create `src/components/OperatingStyleOverview.tsx`
7. Add component to `src/pages/Review.tsx`
8. Create `src/components/OperatingStyleHint.tsx`
9. Add hint to `src/pages/PlanReset.tsx`

## Relationship to Existing Planning Style Profile

The existing `PlanningStyleProfile` (Phase 9.15) focuses on planning behavior dimensions (Planner/Improviser, Optimistic/Conservative, Linear/Iterative, Strategic/Tactical). 

The new `OperatingStyleOverview` (Phase 10.1) focuses on working/execution patterns (Planning Density, Follow-Through, Adjustment, Cadence).

Both are:
- Pro-only features
- Collapsible on /review
- AI-summarized
- Observational only

They complement each other as different lenses on user behavior.

## Explicit Exclusions Checklist

- [x] No questions or quizzes to users
- [x] No labels, scores, ranks, or categories
- [x] No modification of plans, tasks, priorities, timers, or execution
- [x] No surfacing during execution (/today or active tasks)
- [x] All insights are observational and neutral
- [x] No collaboration features
- [x] No comparisons to other users
- [x] No auto-adjustments
- [x] No gamification
- [x] No behavioral scoring


# Plan Completion Experience + Intelligent Context Memory

## Overview
A comprehensive completion system that detects when all tasks are done, presents a mature completion screen, calculates advanced analytics, archives with context memory, and feeds that memory into future plan generation.

---

## Architecture Approach

The system follows existing patterns: plan state lives in `plan_json` (JSONB), execution profile lives in `profiles` table (via `personalExecutionProfile.ts`), and plan history goes to `plan_history` table. We add a new `plan_memory` JSONB column to `profiles` for consent-based context storage, and a `completed_at` field to `plan_json`.

Completion detection uses `task.completed === true` (not `execution_state`) as specified. The Plan page gets a conditional render: if `completed_at` exists in `plan_json`, show the completion screen instead of the checklist.

---

## Changes

### PART 1 -- Database Migration

Add `plan_memory` column to `profiles` table:

```sql
ALTER TABLE public.profiles
ADD COLUMN plan_memory jsonb DEFAULT NULL;
```

No new tables needed. `completed_at` is stored inside `plan_json` (not a separate column).

### PART 2 -- Completion Detection (`src/lib/planCompletion.ts` -- NEW)

New utility file with:

- `isPlanCompleted(planData)`: returns `true` if `planData.completed_at` is set.
- `checkAllTasksCompleted(planData)`: returns `true` if every `task.completed === true` across all weeks.
- `calculateCompletionAnalytics(planData, planCreatedAt)`: computes:
  - Total hours tracked (sum of `time_spent_seconds`)
  - Average daily execution time (total time / active days)
  - Longest session (max `time_spent_seconds` across tasks)
  - Most worked-on task (highest `time_spent_seconds`)
  - Total days active (days between `planCreatedAt` and `completed_at`)
  - Total tasks
  - Completion rate (should be 100%)
- `buildPlanMemory(planData, planCreatedAt, planId)`: builds the `plan_memory` object with structured metrics only (no raw task descriptions).

### PART 3 -- Completion Trigger (in `src/pages/Plan.tsx`)

Modify `toggleTask` callback:
- After marking a task complete, call `checkAllTasksCompleted()`.
- If all done and `plan.completed_at` is not set:
  1. Set `completed_at = new Date().toISOString()` on `plan_json`.
  2. Persist to DB.
  3. Trigger subtle confetti (1-1.5 seconds, not the current 4-second grand celebration).
  4. Show consent modal.
  5. Existing `triggerPatternUpdate` still runs (it already handles profile updates).

Also hook into `completeTaskTimer` flow (Today page) -- after timer completion, check if all tasks are now done and trigger the same flow.

### PART 4 -- Plan Completion Screen (`src/components/PlanCompletionScreen.tsx` -- NEW)

Full-page component shown when `plan.completed_at` exists, replacing the checklist on `/plan`:

- Trophy icon (subtle, not animated)
- "Plan Completed" title
- Completion date (formatted)
- Total time invested (from `calculateTotalTimeSpent`)
- Total days taken (diff between `planCreatedAt` and `completed_at`)
- Completion rate: 100%
- Total tasks completed count

Buttons:
- **View Detailed Summary** -- scrolls to / opens the analytics section
- **Duplicate This Plan** -- navigates to `/plan/reset` with duplication context (future implementation placeholder)
- **Archive Plan** -- calls `archiveCurrentPlan()` then deletes the active plan, redirecting to `/plan/reset`
- **Create New Plan** -- same as archive + redirect

Read-only: no checkboxes, no timer controls.

### PART 5 -- Detailed Analytics Summary (`src/components/PlanCompletionSummary.tsx` -- NEW)

Shown via "View Detailed Summary" button (dialog or inline expand):

- Total hours tracked
- Average daily execution time
- Longest session (task name + duration)
- Most worked-on task (task name + duration)
- Total execution sessions (approximate: count of tasks with `time_spent_seconds > 0`)
- Total days active

Clean card-based layout. No gamification. Uses data from `calculateCompletionAnalytics()`.

### PART 6 -- Consent Modal (`src/components/PlanMemoryConsentModal.tsx` -- NEW)

Dialog shown after completion detection:

- Title: "Use this experience to improve your next plan?"
- Description: "We can analyze your execution patterns to generate a smarter, more realistic plan next time."
- **Yes, use my progress** -- calls `savePlanMemory()` to store structured metrics in `profiles.plan_memory`
- **No, don't use this** -- dismisses modal, does NOT store memory

`savePlanMemory(userId, memory)`:
```typescript
await supabase.from('profiles').update({ plan_memory: memory }).eq('id', userId);
```

Memory structure stored:
```typescript
{
  plan_id: string,
  total_time_spent: number,
  total_days_taken: number,
  average_daily_time: number,
  most_worked_task: string, // title only
  completion_speed: 'faster' | 'on_time' | 'slower',
  execution_consistency_score: number, // 0-100
  completed_at: string
}
```

### PART 7 -- Review Page Upgrade (`src/pages/Review.tsx`)

Modify the Plan Overview card at the top:
- If `plan.completed_at` exists:
  - Show "Completed" badge (green, next to plan type badge)
  - Show total hours invested below the progress bar
  - Show completion date
  - Visually distinct: subtle green border or background tint

The plan history section already sorts by `completed_at` descending (existing `usePlanHistory` does this).

### PART 8 -- Plan Page Lock After Completion (`src/pages/Plan.tsx`)

When `plan.completed_at` is set:
- Render `PlanCompletionScreen` instead of the weekly breakdown
- Keep header, milestones (read-only), and motivation sections
- Hide: Add Task buttons, DnD, calendar sync, extend plan button
- Timer hook still initializes (for FloatingTimerPill on other pages) but no new timers can start
- `toggleTask` becomes no-op when plan is completed

### PART 9 -- AI Plan Generation with Memory Context (`supabase/functions/generate-plan/index.ts`)

Before building the user prompt:
1. Fetch `plan_memory` from `profiles` table (already fetching profile data).
2. If `plan_memory` is not null, append a context block to the user prompt:

```text
HISTORICAL EXECUTION CONTEXT (from user's previous completed plan):
- Completed previous plan in {total_days_taken} days
- Averaged {average_daily_time_hours}h per day of active execution
- Spent most time on: "{most_worked_task}"
- Execution consistency score: {execution_consistency_score}%
- Completion speed: {completion_speed}

Use this context to:
- Adjust task time estimates to match proven capacity
- Set realistic daily workload expectations
- Distribute difficulty based on observed patterns
```

3. If `plan_memory` is null, generate without historical context (unchanged behavior).

### PART 10 -- Data Safety

- `plan_memory` stores only structured metrics, no raw task descriptions (except the most-worked task title).
- Memory is only written with explicit user consent.
- Revoke consent placeholder: add a comment/TODO in settings for future "Clear execution memory" option.
- No auto-enable of memory storage.

---

## What Does NOT Change

- Execution timer logic (4-state machine, optimistic pause/resume, reset)
- FloatingTimerPill behavior
- Plan editing flow for active (non-completed) plans
- `personalExecutionProfile.ts` (existing pattern update still runs independently)
- `archiveCurrentPlan()` logic (still called during plan reset)
- Task card components
- `useExecutionTimer` hook internals

---

## Implementation Order

1. Database migration: add `plan_memory` column to `profiles`
2. Create `src/lib/planCompletion.ts` (detection + analytics + memory builder)
3. Create `src/components/PlanMemoryConsentModal.tsx`
4. Create `src/components/PlanCompletionSummary.tsx`
5. Create `src/components/PlanCompletionScreen.tsx`
6. Update `src/pages/Plan.tsx` (completion detection in `toggleTask`, conditional render, lock)
7. Update `src/pages/Today.tsx` (completion detection after timer complete)
8. Update `src/pages/Review.tsx` (completed badge, hours, date)
9. Update `supabase/functions/generate-plan/index.ts` (fetch + inject memory context)
10. Deploy edge function

---

## Technical Details

### Completion detection location

Two entry points where a task can become the "final" completed task:
1. `toggleTask()` in `Plan.tsx` (manual checkbox)
2. `completeTaskTimer()` callback chain in `Today.tsx` (timer-based completion)

Both will check `checkAllTasksCompleted()` after the update, then set `completed_at` on the plan.

### Confetti for completion

Replace the current 4-second grand celebration with a subtle 1.5-second burst (single center burst, ~80 particles, no side bursts). This fires once when `completed_at` is first set.

### Plan lock mechanism

Simple conditional: `const isPlanCompleted = !!plan?.completed_at;`
- Checkboxes: `disabled={isPlanCompleted}`
- Start task buttons: hidden when completed
- Add task / split task: hidden when completed
- DnD: sensors disabled when completed

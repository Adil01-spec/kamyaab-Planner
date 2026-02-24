

# Architectural Upgrades for Plan Completion System

## Overview
Six targeted changes to strengthen the completion system: rolling memory array, deterministic completion speed, measurable consistency formula, directive AI context injection, hard timer stop on completion, and memory revocation support.

---

## Change 1: Rolling `plan_memory` Array (max 5 entries)

### Current
`plan_memory` is a single `PlanMemory` object, overwritten each time.

### New
`plan_memory` becomes `PlanMemory[]` — an array of up to 5 entries (rolling window, newest appended, oldest dropped).

**Files changed:**
- `src/lib/planCompletion.ts`:
  - `PlanMemory` interface stays the same.
  - `savePlanMemory()` becomes: fetch existing `plan_memory` from profiles, parse as array, append new entry, keep only last 5 via `.slice(-5)`, then update.
- `src/components/PlanCompletionScreen.tsx`:
  - `handleConsent` calls the updated `savePlanMemory`.
- `supabase/functions/generate-plan/index.ts`:
  - Parse `plan_memory` as array. Build context block from ALL entries (trending data, not just last plan).

**No DB migration needed** — `plan_memory` is already `jsonb`, which supports arrays.

---

## Change 2: Deterministic `completion_speed` Logic

### Current
Uses 0.8x / 1.2x thresholds against `total_weeks * 7`, which is fuzzy.

### New
In `buildPlanMemory()`:
- If plan has `total_weeks` (defined duration):
  - `planned_duration = total_weeks * 7`
  - `total_days_taken < planned_duration` -> `'faster'`
  - `total_days_taken === planned_duration` -> `'on_time'`
  - `total_days_taken > planned_duration` -> `'slower'`
- If no `total_weeks` or `is_open_ended === true`:
  - Omit `completion_speed` from memory entry entirely.

**Files changed:**
- `src/lib/planCompletion.ts`: Update `PlanMemory` interface to make `completion_speed` optional. Rewrite logic in `buildPlanMemory()` with clear code comments documenting the formula.

---

## Change 3: Measurable Execution Consistency Formula

### Current
`consistency = (tasksWithTime / totalTasks) * 100` — measures task coverage, not daily consistency.

### New Formula:
```text
consistency = (active_execution_days / total_days_taken) * 100
```
Where `active_execution_days` = number of unique calendar days that have tasks with `time_spent_seconds > 0`. Approximated by counting tasks with `completed_at` or `execution_started_at` on distinct dates.

Since we don't track per-day logs, we approximate using a simpler but still meaningful metric:
- Collect all `completed_at` timestamps across tasks.
- Extract unique dates from them.
- `active_execution_days` = count of unique dates.
- `consistency = Math.round((active_execution_days / total_days_taken) * 100)`, clamped to 0-100.

**Files changed:**
- `src/lib/planCompletion.ts`: Rewrite consistency calculation in `buildPlanMemory()` with documented formula. Add helper to extract unique active dates from task timestamps.

---

## Change 4: Directive AI Context Injection

### Current
The historical context block says "Use this context to..." — advisory tone.

### New
Replace with directive rules that the model MUST follow:

```text
HISTORICAL EXECUTION DATA (from {N} previous completed plans):
[Per-entry summary with key metrics]

MANDATORY PLANNING ADJUSTMENTS:
- You MUST adjust plan difficulty based on historical execution data.
- If average_daily_time < 1 hour: Do NOT generate heavy multi-hour daily workloads. Cap at 1-2 tasks per day.
- If consistency < 60%: Build lighter daily commitments with buffer days built into the schedule.
- If completion_speed was "slower" in most recent entry: Reduce task density by 15-25%.
- If average_daily_time > 3 hours: User has high capacity. You may increase task depth.
```

**Files changed:**
- `supabase/functions/generate-plan/index.ts`: Rewrite the `historicalContextBlock` builder to iterate over the array and produce directive rules.

---

## Change 5: Hard Timer Stop on Completion

When `completed_at` is set on the plan:

**5a. `src/hooks/useExecutionTimer.ts`:**
- `startTaskTimer`: Add guard at the top — if `planData?.completed_at` exists, return `false` immediately. This prevents ghost sessions.

**5b. Completion trigger in `src/pages/Plan.tsx` (inside `toggleTask`):**
- After setting `completed_at`, immediately call the timer cleanup:
  - Clear `intervalRef` (via the execution timer hook).
  - Clear `localStorage` active timer.
  - Clear `timerContext`.
  - The existing `setTimerContext(null)` in the hook already handles FloatingTimerPill unmount.

**5c. Completion trigger in `src/pages/Today.tsx`:**
- Same cleanup after setting `completed_at` on plan.

**5d. `src/hooks/useExecutionTimer.ts` initialization effect:**
- Add early return if `planData?.completed_at` exists — skip all timer initialization, set everything to null.

---

## Change 6: Memory Revocation Backend Function

Add `clearExecutionMemory()` to `src/lib/planCompletion.ts`:

```typescript
/** Clear all stored execution memory (consent revocation). */
export async function clearExecutionMemory(userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('profiles')
    .update({ plan_memory: null })
    .eq('id', userId);
  return !error;
}
```

No UI yet — this is a backend-ready placeholder. A TODO comment will be added in settings files for future "Clear execution memory" button.

---

## Implementation Order

1. Update `PlanMemory` interface and `buildPlanMemory()` (changes 2, 3)
2. Update `savePlanMemory()` to rolling array append (change 1)
3. Add `clearExecutionMemory()` (change 6)
4. Add timer guards and hard stop on completion (change 5)
5. Rewrite AI context injection (change 4)
6. Deploy edge function

---

## What Does NOT Change

- Database schema (plan_memory is already jsonb, supports arrays)
- Execution timer 4-state machine
- Optimistic pause/resume/reset flows
- FloatingTimerPill component
- PlanCompletionScreen layout
- PlanMemoryConsentModal UX
- Task card components




# Optimistic Pause and Resume UX

## Problem

`pauseTaskTimer()` and `startTaskTimer()` (used for resume) both `await` the database write before updating React state. This creates a 2-3 second delay where the timer keeps ticking and the button doesn't change.

## Solution Architecture

Move all UI state updates BEFORE the `await`, then run the DB write in the background with rollback on failure.

## Changes

### File 1: `src/lib/executionTimer.ts`

**Add a new function `updateTaskExecutionAsync`** -- a fire-and-forget version of `updateTaskExecution` that returns a Promise but is NOT awaited by the caller before updating UI. This is just the existing `updateTaskExecution` but exported so the hook can call it separately from the optimistic local update.

No changes needed to the existing functions -- the optimistic logic lives in the hook layer.

**Add helper `applyTaskUpdatesLocally`** -- a synchronous function that deep-clones planData and applies field updates to a specific task, returning the new plan object without touching the database. This lets the hook update UI instantly.

```typescript
export function applyTaskUpdatesLocally(
  planData: any,
  weekIndex: number,
  taskIndex: number,
  updates: Record<string, any>
): any {
  const updatedPlan = JSON.parse(JSON.stringify(planData));
  const task = updatedPlan.weeks[weekIndex]?.tasks?.[taskIndex];
  if (task) Object.assign(task, updates);
  return updatedPlan;
}
```

### File 2: `src/hooks/useExecutionTimer.ts`

This is where most changes happen.

**Add a `isMutatingRef`** -- a ref guard (`useRef(false)`) that prevents overlapping pause/resume/start operations. Checked at the top of each action; if true, the action is a no-op.

**Refactor `pauseTaskTimer()`:**

1. Guard: if `isMutatingRef.current` is true, return false.
2. Set `isMutatingRef.current = true`.
3. Capture snapshot: save current `activeTimer`, `elapsedSeconds`, and `planData` for rollback.
4. Calculate `finalTimeSpent = (task.time_spent_seconds || 0) + calculateElapsedSeconds(activeTimer.started_at)`.
5. **Immediately (synchronous, no await):**
   - Clear the interval (`clearInterval`).
   - `setActiveTimer(null)` -- stops the timer display.
   - `setElapsedSeconds(finalTimeSpent)` -- freezes display at paused value.
   - Build optimistic plan using `applyTaskUpdatesLocally(planData, weekIndex, taskIndex, { execution_state: 'paused', execution_started_at: null, time_spent_seconds: finalTimeSpent })`.
   - `isLocalOpRef.current = true`.
   - `onPlanUpdate(optimisticPlan)` -- UI instantly shows "paused" state with Resume button.
   - `setLocalActiveTimer(null)`.
6. **Then (async, in background):**
   - `await updateTaskExecution(...)` to persist to database.
   - If it fails:
     - Revert: `isLocalOpRef.current = true; onPlanUpdate(snapshotPlan)`.
     - Restore `activeTimer` to snapshot values.
     - `setLocalActiveTimer(snapshotTimer)`.
     - Show toast: `"Couldn't save pause. Timer resumed."`.
7. Finally: set `isMutatingRef.current = false` after a 300ms delay (debounce guard).

**Refactor `startTaskTimer()` (handles both Start and Resume):**

1. Guard: if `isMutatingRef.current` is true, return false.
2. Set `isMutatingRef.current = true`.
3. Capture snapshot for rollback.
4. **Immediately (synchronous):**
   - Generate `now = new Date().toISOString()`.
   - Get accumulated time from task: `accumulated = task.time_spent_seconds || 0`.
   - `setActiveTimer({ weekIndex, taskIndex, taskTitle, started_at: now, elapsed_seconds: accumulated, accumulated_seconds: accumulated })`.
   - `setElapsedSeconds(accumulated)`.
   - Build optimistic plan with `execution_state: 'doing'`, `execution_started_at: now`. If another task was active, also pause it in the local plan.
   - `isLocalOpRef.current = true; onPlanUpdate(optimisticPlan)`.
   - `setLocalActiveTimer(...)`.
5. **Then (async):**
   - `await startTask(...)` for DB persistence.
   - If it fails:
     - Revert all local state to snapshot.
     - Show toast error.
6. Finally: `isMutatingRef.current = false` after 300ms.

**`isPausing` state behavior change:** Instead of being set to `true` during the entire DB write, it will only be `true` for 300ms (the debounce window) to disable the button and prevent double-clicks. This is a UX-only guard, not a blocking indicator.

### File 3: `src/components/ActiveTimerBanner.tsx`

**Add paused state display.** Currently this component only renders when there IS an `activeTimer`. After pause, `activeTimer` becomes null so the banner disappears. No change needed here -- the banner correctly hides on pause.

**However**, add a paused indicator to task cards:

### File 4: `src/components/TodayTaskCard.tsx`

Add a "Paused at X:XX" display when `executionStatus === 'paused'` and `elapsedSeconds > 0`:

```
Paused at 12m 43s
```

- Show a pause icon next to the time.
- Slightly dim the time display with `text-muted-foreground`.
- The Resume button is already implemented from the previous refactor.

### File 5: `src/components/PrimaryTaskCard.tsx`

Same paused indicator as TodayTaskCard:

- Show "Paused at HH:MM:SS" between the title and the Resume button.
- Use `opacity-80` on the time display for subtle dimming.
- Pause icon instead of pulsing dot.

### File 6: `src/components/SecondaryTaskCard.tsx`

Add the same paused time indicator, scaled down to match the smaller card.

### File 7: `src/components/ActiveTimerBanner.tsx`

No structural changes. The Pause button already passes `isPausing` as disabled state. The 300ms debounce from the hook will naturally disable it briefly.

## What Does NOT Change

- `executionTimer.ts` core functions (`pauseTask`, `startTask`, `completeTask`) remain intact -- they are still used for the actual DB write.
- `normalizeExecutionState()` -- untouched.
- `isLocalOpRef` guard -- still used, now set before optimistic updates.
- `completeTask` flow -- not made optimistic (completion has a confirmation dialog, so the delay is acceptable there).
- State machine: `idle | doing | paused | done` -- unchanged.
- localStorage timer management -- unchanged pattern.

## Race Condition Prevention

The `isMutatingRef` ensures that rapid clicks (Pause then immediately Resume, or double-click) cannot create overlapping DB writes. The 300ms cooldown after each operation provides the debounce window.

## Rollback Strategy

On DB failure, the rollback restores:
1. The `planData` to its pre-optimistic snapshot (via `onPlanUpdate`).
2. The `activeTimer` React state to its snapshot.
3. The localStorage timer to its snapshot.
4. The interval auto-restarts because `activeTimer` being restored triggers the `useEffect([activeTimer?.started_at])`.

## Order of Implementation

1. Add `applyTaskUpdatesLocally()` to `executionTimer.ts`.
2. Refactor `useExecutionTimer.ts` with optimistic pause and resume.
3. Add paused time indicators to `TodayTaskCard`, `PrimaryTaskCard`, `SecondaryTaskCard`.
4. Update memory doc.


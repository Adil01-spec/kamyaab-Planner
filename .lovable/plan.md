

# Optimistic Pause/Resume UX Refactor

## Problem
`pauseTaskTimer()` and `startTaskTimer()` (resume) currently `await` the database write before updating React state. This causes a visible 2-3 second delay between clicking Pause/Resume and the UI responding.

## Solution Overview
Split each operation into two phases: an immediate synchronous UI update (optimistic), followed by an async background database write with rollback on failure.

---

## Architecture Changes

### 1. New helper: `shallowClonePlanWithTaskUpdate`

Replace `JSON.parse(JSON.stringify(planData))` in `updateTaskExecution` with a structured shallow clone utility that only creates new references along the modified path:

```text
planData (original ref kept)
  -> { ...planData, weeks: [...planData.weeks] }
     -> weeks[weekIndex] = { ...week, tasks: [...week.tasks] }
        -> tasks[taskIndex] = { ...task, ...updates }
```

This preserves object identity for unchanged weeks/tasks, avoids stripping types, and is faster.

### 2. New helper: `persistPlanToDb`

Extract the Supabase write into a standalone fire-and-forget function:

```typescript
async function persistPlanToDb(userId: string, plan: any): Promise<{ success: boolean; error?: string }>
```

This is called **after** optimistic state has been applied.

### 3. `isMutatingRef` guard

Add a `useRef<boolean>(false)` to `useExecutionTimer` to prevent overlapping pause/resume/start/complete operations. Each operation checks and sets this ref before proceeding, and clears it when complete (including on error). This eliminates double-click and race condition risks.

### 4. Button debounce (300ms)

Each Pause/Resume/Start button disables itself for 300ms after click, implemented via a local `useState` + `setTimeout` in the card components.

---

## Detailed Flow: Optimistic Pause

When the user clicks Pause:

**Immediate (synchronous, before any await):**
1. Check `isMutatingRef` -- if true, return early.
2. Set `isMutatingRef = true`.
3. Capture snapshot: `{ prevPlan, prevActiveTimer, prevElapsedSeconds, prevLocalStorage }`.
4. Calculate `additionalTime = calculateElapsedSeconds(activeTimer.started_at)`.
5. Build optimistic plan using shallow clone: set target task's `execution_state = 'paused'`, `execution_started_at = null`, `time_spent_seconds += additionalTime`.
6. Clear interval (`intervalRef`).
7. Set `activeTimer = null` (stops ticking).
8. Set `elapsedSeconds = 0` (live ticker resets; paused display reads `task.time_spent_seconds` directly).
9. Set `isLocalOpRef = true`.
10. Call `onPlanUpdate(optimisticPlan)` -- UI instantly shows Resume button.
11. Clear localStorage timer (`setLocalActiveTimer(null)`).

**Background (async):**
12. `await persistPlanToDb(userId, optimisticPlan)`.
13. If success: set `isMutatingRef = false`. Done.
14. If failure:
    - Restore `activeTimer` from snapshot.
    - Restore `elapsedSeconds` from snapshot.
    - Restore localStorage timer from snapshot.
    - Set `isLocalOpRef = true`.
    - Call `onPlanUpdate(prevPlan)` to revert UI.
    - Show toast: "Pause failed. Timer restored."
    - Set `isMutatingRef = false`.

---

## Detailed Flow: Optimistic Resume (Start from Paused)

When the user clicks Resume on a paused task:

**Immediate (synchronous):**
1. Check `isMutatingRef` -- if true, return early.
2. Set `isMutatingRef = true`.
3. Capture snapshot.
4. Check if another task has `execution_state === 'doing'` in current plan -- if so, auto-pause it in the optimistic plan (set its `execution_state = 'paused'`, accumulate its time, clear its `execution_started_at`).
5. `const now = new Date().toISOString()`.
6. Build optimistic plan: target task gets `execution_state = 'doing'`, `execution_started_at = now`.
7. Set `activeTimer = { weekIndex, taskIndex, taskTitle, started_at: now, accumulated_seconds: task.time_spent_seconds, elapsed_seconds: task.time_spent_seconds }`.
8. Set `elapsedSeconds = task.time_spent_seconds` (interval will start ticking from here).
9. Set `isLocalOpRef = true`.
10. Call `onPlanUpdate(optimisticPlan)`.
11. Update localStorage timer.

**Background (async):**
12. `await persistPlanToDb(userId, optimisticPlan)`.
13. On failure: revert from snapshot, show toast, clear `isMutatingRef`.
14. On success: clear `isMutatingRef`.

---

## Detailed Flow: Optimistic Start (Fresh idle task)

Same as Resume but the task has no accumulated `time_spent_seconds`. Auto-pause logic for any currently `doing` task is identical.

---

## Paused Display in UI

When `execution_state === 'paused'`, task cards show:
- A `Pause` icon next to the time display.
- Text: `"Paused at {formatTimerDisplay(task.time_spent_seconds)}"` -- read directly from task data, not from `elapsedSeconds`.
- `elapsedSeconds` is only used for **live ticking** while `doing`. It is `0` when paused.
- Resume button styled as primary action.
- Slight opacity reduction on the timer display (e.g., `opacity-70`) for subtle differentiation.
- Smooth `AnimatePresence` transitions between states (already in place).

---

## Files Modified

### `src/lib/executionTimer.ts`
- Add `shallowClonePlanWithTaskUpdate(planData, weekIndex, taskIndex, updates)` helper.
- Add `persistPlanToDb(userId, plan)` helper.
- `updateTaskExecution` -- replace `JSON.parse(JSON.stringify())` with shallow clone helper.
- No changes to `pauseTask`, `startTask`, `completeTask` signatures (they remain for non-optimistic callers like Plan.tsx if needed, but the hook will bypass them).

### `src/hooks/useExecutionTimer.ts`
- Add `isMutatingRef = useRef(false)`.
- Rewrite `pauseTaskTimer` as optimistic (synchronous UI + async DB).
- Rewrite `startTaskTimer` as optimistic (synchronous UI + async DB, with auto-pause of any `doing` task).
- Add rollback logic with toast on failure.
- Import `toast` from `sonner`.
- `completeTaskTimer` can remain await-based (completion is a terminal action where a small delay is acceptable, and the confirmation dialog already provides perceived responsiveness).

### `src/components/ActiveTimerBanner.tsx`
- Add paused state display: when `executionStatus === 'paused'`, show pause icon + "Paused at X:XX" + Resume button.
- Add `executionStatus` and `pausedTimeSeconds` props.
- 300ms button debounce on Pause/Resume/Done buttons.

### `src/components/PrimaryTaskCard.tsx`
- Add paused time display: `"Paused at {time}"` reading from task's `time_spent_seconds`.
- 300ms debounce on Start/Resume button.

### `src/components/SecondaryTaskCard.tsx`
- Same paused time display.
- 300ms debounce on Start/Resume button.

### `src/components/TodayTaskCard.tsx`
- Same paused time display.
- 300ms debounce on Start/Resume button.

### `src/pages/Today.tsx`
- Pass `executionStatus` to `ActiveTimerBanner` for paused state rendering.
- No other changes needed (it already delegates to the hook).

### `src/pages/Plan.tsx`
- No changes needed (Plan.tsx uses the same hook; it benefits automatically).

---

## What Does NOT Change

- `normalizeExecutionState()` -- untouched.
- `isLocalOpRef` guard -- kept and used.
- `execution_state` 4-state model -- preserved.
- `completeTask` -- stays await-based (confirmation dialog masks latency).
- localStorage timer management pattern -- preserved.
- No full plan refetch triggered.
- No `execution_status` reintroduction.


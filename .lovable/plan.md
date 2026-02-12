

# Fix: Timer Pause Resets Instead of Preserving State

## Root Cause

The `useEffect([planData])` hook in `useExecutionTimer.ts` (line 54-96) runs every time `planData` changes. When the user pauses:

1. `pauseTask()` sets `execution_state` to `'pending'` and clears `execution_started_at`
2. `onPlanUpdate()` triggers a `planData` change
3. The effect runs, calls `findActiveTask()` which returns `null` (no task is 'doing')
4. The effect resets `activeTimer` to `null` and `elapsedSeconds` to `0`

This happens AFTER `pauseTaskTimer` already set `activeTimer = null` and `elapsedSeconds = 0` on lines 200-201. But even without those lines, the effect would still wipe the state. The core problem is that **the effect doesn't know the difference between "no active task because user paused" vs "no active task on initial load"**.

## Solution

Two changes in `src/hooks/useExecutionTimer.ts`:

### Change 1: Guard the planData effect against local operations

Add a ref `isLocalOperation` that is set to `true` before calling `onPlanUpdate` in pause/complete/start flows, and checked by the `useEffect([planData])`. When `isLocalOperation` is true, the effect skips re-initialization (the local state is already correct).

### Change 2: Preserve elapsed time on pause

In `pauseTaskTimer`, do NOT reset `elapsedSeconds` to 0. Instead, keep the current value so the UI shows the accumulated time. Set `activeTimer` to null (stopping the interval) but preserve `elapsedSeconds` as a display value.

Actually, the user's requirement is Start -> Pause -> Resume -> Done. After pause, the task goes back to 'pending/idle' UI and the user clicks "Start" again to resume. At that point, `startTask` picks up `time_spent_seconds` from the task data (which was accumulated during pause). So the real fix is:

- In `startTaskTimer`, when the task already has `time_spent_seconds`, set `accumulated_seconds` to that value and display `accumulated + liveElapsed`.
- The current code already does this at line 138: `const accumulated = task.time_spent_seconds || 0`.

But the bug is that `onPlanUpdate` triggers the `useEffect([planData])` which re-runs and overwrites the state set by `startTaskTimer`. So the guard ref is the critical fix.

### Files Modified

**`src/hooks/useExecutionTimer.ts`**:
- Add `const isLocalOpRef = useRef(false)` 
- In the `useEffect([planData])`, add early return if `isLocalOpRef.current` is true, then reset the ref
- In `startTaskTimer`, `pauseTaskTimer`, and `completeTaskTimer`: set `isLocalOpRef.current = true` before calling `onPlanUpdate`
- This prevents the planData effect from stomping on locally-set timer state

### Why This Fixes It

- **Pause**: `pauseTaskTimer` sets `isLocalOpRef = true`, calls `onPlanUpdate`. The effect sees the flag, skips re-init. Timer state (`activeTimer = null`, `elapsedSeconds = 0`) stays as set by pauseTaskTimer. The accumulated time is saved in the DB's `time_spent_seconds`.
- **Resume (Start again)**: `startTaskTimer` reads `task.time_spent_seconds` (which has the accumulated value from pause), sets `accumulated_seconds` correctly. Sets `isLocalOpRef = true` before `onPlanUpdate` so the effect doesn't overwrite.
- **No memory leaks**: The interval cleanup in the effect's return function handles this. The `isLocalOpRef` doesn't create any new intervals.
- **No double intervals in React Strict Mode**: The effect depends on `activeTimer?.started_at` and always clears existing interval before setting a new one via the cleanup return.

### Technical Details

```text
Before fix:
  Pause click
    -> pauseTask() saves time to DB
    -> onPlanUpdate(newPlan) 
    -> useEffect([planData]) fires
    -> findActiveTask() = null (task is 'pending')
    -> setElapsedSeconds(0)  <-- BUG: wipes display
    
After fix:
  Pause click
    -> pauseTask() saves time to DB  
    -> isLocalOpRef.current = true
    -> onPlanUpdate(newPlan)
    -> useEffect([planData]) fires
    -> sees isLocalOpRef.current === true
    -> resets ref, returns early  <-- no wipe
```



# Refactor: Clean Execution State Machine

## Summary

Replace the ambiguous 3-state model (`pending` / `doing` / `done`) with an explicit 4-state model (`idle` / `doing` / `paused` / `done`), remove the redundant `execution_status` field, and propagate changes consistently across all 14 affected files.

## Current Problems

1. **No "paused" state** -- pausing a task sets `execution_state` to `'pending'`, making it indistinguishable from a task that was never started. This loses context (the user has already worked on it).
2. **Redundant `execution_status` field** -- written alongside `execution_state` but never read for decisions. Creates confusion and maintenance burden.
3. **Type definitions scattered** -- `'pending' | 'doing' | 'done'` is repeated in 14+ files with no shared type.

## New State Machine

```text
         Start           Pause           Resume
  idle --------> doing --------> paused --------> doing
                   |                                 |
                   | Complete                        | Complete
                   v                                 v
                 done                              done

  States persisted in plan_json per task:
    execution_state: 'idle' | 'doing' | 'paused' | 'done'
```

## Migration Strategy for Existing Data

Existing tasks in the database have `execution_state` values of `'pending'`, `'doing'`, or `'done'` (or no value at all). The migration is handled in-code, not via a database migration, because `plan_json` is a JSONB blob:

- `'pending'` with `time_spent_seconds > 0` maps to `'paused'` (user had started and stopped)
- `'pending'` with `time_spent_seconds === 0` (or missing) maps to `'idle'` (never started)
- `'doing'` stays `'doing'`
- `'done'` stays `'done'`
- Missing/undefined maps to `'idle'` (legacy tasks without execution tracking)

This normalization function runs at read-time wherever `execution_state` is consumed, so no batch DB update is needed.

## Files Modified

### 1. `src/lib/executionTimer.ts` (core engine)

- Change `TaskExecutionStatus` type from `'idle' | 'doing' | 'done'` to `'idle' | 'doing' | 'paused' | 'done'`
- Add a `normalizeExecutionState()` function that maps legacy `'pending'` values (as described above)
- Update `updateTaskExecution()` type signature: replace `'pending'` with `'idle' | 'doing' | 'paused' | 'done'`
- Remove all `execution_status` writes from `startTask()`, `pauseTask()`, and `completeTask()`
- `pauseTask()`: set `execution_state` to `'paused'` (not `'pending'`)
- `startTask()` when pausing another task: set that task's `execution_state` to `'paused'` (not `'pending'`)
- `getTaskExecutionState()`: use `normalizeExecutionState()` and include `'paused'` mapping
- `findActiveTask()`: no change needed (only looks for `'doing'`)
- `areAllTasksCompleted()`: use `normalizeExecutionState()` -- `'paused'` is not complete

### 2. `src/hooks/useExecutionTimer.ts` (React hook)

- Update `getTaskStatus` return type from `'idle' | 'doing' | 'done'` to `'idle' | 'doing' | 'paused' | 'done'`
- Use `normalizeExecutionState()` in `getTaskStatus`
- Return `'paused'` when `execution_state === 'paused'`
- Remove the comment "pending maps to idle"

### 3. `src/lib/todayTaskSelector.ts` (task selection)

- Add `execution_state` to the `Task` interface
- Update `getCurrentWeekIndex()`: a task with `execution_state === 'paused'` is still incomplete (correct, no change needed since it checks `!t.completed`)
- No functional change needed here since it filters on `!task.completed` which remains correct

### 4. `src/lib/planProgress.ts` (progress calculation)

- Update `Task` interface type from `'pending' | 'doing' | 'done'` to `'idle' | 'doing' | 'paused' | 'done'`
- Update `isTaskDone()`: replace `task.execution_state === 'pending'` with checks for `'idle'` and `'paused'`
- Use `normalizeExecutionState()` for legacy compatibility

### 5. `src/lib/weekLockStatus.ts` (week locking)

- Update `Week.tasks` type from `'pending' | 'doing' | 'done'` to `'idle' | 'doing' | 'paused' | 'done'`
- No logic change needed (checks `!== 'done' && !t.completed`)

### 6. `src/pages/Plan.tsx` (plan view)

- Update `Task` interface type from `'pending' | 'doing' | 'done'` to `'idle' | 'doing' | 'paused' | 'done'`
- Update `getTaskExecutionState()` local function: return `'paused'` for paused tasks, `'idle'` instead of `'pending'`
- Update `handleToggleCompletion()`: use `'idle'` instead of `'pending'` when un-completing a task
- Remove `execution_status` writes in error revert logic

### 7. `src/pages/Today.tsx` (today view)

- Update `ExecutionState` type to `'idle' | 'doing' | 'paused' | 'done'`
- Update `getExecutionState()`: map legacy `'pending'` using normalization, return `'paused'` for paused tasks, `'idle'` instead of `'pending'` for default
- Update error revert: use `'idle'` instead of `'pending'`, remove `execution_status` write

### 8. `src/components/TaskItem.tsx` (plan task card)

- Update `executionState` prop type from `'pending' | 'doing' | 'done'` to `'idle' | 'doing' | 'paused' | 'done'`
- Default value changes from `'pending'` to `'idle'`
- Update `derivedState` logic: `'paused'` is not done, not active
- Add visual indicator for paused state (e.g., a "Resume" button or paused icon)

### 9. `src/components/DraggableTaskItem.tsx` (draggable wrapper)

- Update `executionState` prop type from `'pending' | 'doing' | 'done'` to `'idle' | 'doing' | 'paused' | 'done'`

### 10. `src/components/TodayTaskCard.tsx`, `PrimaryTaskCard.tsx`, `SecondaryTaskCard.tsx` (today cards)

- Update `executionStatus` prop type from `'idle' | 'doing' | 'done'` to `'idle' | 'doing' | 'paused' | 'done'`
- Add visual handling for `'paused'` state (show "Resume" instead of "Start", or a paused indicator)

### 11. `src/hooks/useCrossWeekTaskMove.ts`, `src/hooks/useTaskMutations.ts`

- Update `Task` interface type from `'pending' | 'doing' | 'done'` to `'idle' | 'doing' | 'paused' | 'done'`
- In `useTaskMutations.ts`: new tasks get `execution_state: 'idle'` instead of `'pending'`

### 12. `src/lib/personalOperatingStyle.ts`

- Update task type from `'pending' | 'doing' | 'done'` to `'idle' | 'doing' | 'paused' | 'done'`

## The Normalization Function (key piece)

```typescript
// In src/lib/executionTimer.ts
export function normalizeExecutionState(
  task: { execution_state?: string; completed?: boolean; time_spent_seconds?: number }
): TaskExecutionStatus {
  const state = task.execution_state;
  if (state === 'doing') return 'doing';
  if (state === 'done') return 'done';
  if (state === 'paused') return 'paused';
  if (state === 'idle') return 'idle';
  // Legacy migration: 'pending' or missing
  if (state === 'pending') {
    return (task.time_spent_seconds ?? 0) > 0 ? 'paused' : 'idle';
  }
  // No execution_state at all (legacy tasks)
  return task.completed ? 'done' : 'idle';
}
```

## What Does NOT Change

- The `completed` boolean field -- kept for backward compatibility and used as a secondary signal
- The `time_spent_seconds`, `execution_started_at`, `completed_at` fields -- unchanged
- The `isLocalOpRef` guard in `useExecutionTimer.ts` -- still needed
- The `ActiveTimerState` interface -- unchanged
- localStorage timer management -- unchanged
- The database schema -- no migration needed (JSONB blob)

## Order of Implementation

1. Add `normalizeExecutionState()` to `executionTimer.ts` and update types
2. Update `pauseTask()`, `startTask()`, `completeTask()` to use new states and stop writing `execution_status`
3. Update `useExecutionTimer.ts` hook
4. Update all type interfaces across components and lib files
5. Update UI components to handle `'paused'` state
6. Update `Plan.tsx` and `Today.tsx` page logic


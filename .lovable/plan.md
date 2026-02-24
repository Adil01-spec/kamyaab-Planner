

# Add Reset Button to ActiveTimerBanner

## Overview
Add a Reset button that erases tracked time and returns a task to its initial state. Works in both running and paused states, uses the same optimistic UI pattern as pause/start.

## Changes

### 1. `src/hooks/useExecutionTimer.ts`
- Add `isResetting` state (useState, default false).
- Add `resetTaskTimer()` method:
  - Guard: requires `user.id`, `planData`, and `timerContext` (NOT `activeTimer` -- must work when paused).
  - Guard: `isMutatingRef` prevents double invocation.
  - Target task via `timerContext.weekIndex` and `timerContext.taskIndex`.
  - Capture snapshot (prevPlan, prevActiveTimer, prevElapsedSeconds, prevLocalStorage, prevTimerContext).
  - Set `isResetting = true`.
  - **First**: clear interval (`intervalRef.current`) to stop ticking.
  - **Then** optimistic update: `setActiveTimer(null)`, `setElapsedSeconds(0)`, `setTimerContext(null)`, `setLocalActiveTimer(null)`.
  - Build optimistic plan via `shallowClonePlanWithTaskUpdate` with `{ execution_state: 'pending', execution_started_at: null, time_spent_seconds: 0 }`.
  - `isLocalOpRef = true`, call `onPlanUpdate(optimisticPlan)`.
  - Background `persistPlanToDb`. On failure: rollback all from snapshot, toast error.
  - Finally: `isResetting = false`, `isMutatingRef = false`.
- Update `UseExecutionTimerReturn` interface to include `resetTaskTimer` and `isResetting`.
- Export both in return object.

### 2. `src/components/ActiveTimerBanner.tsx`
- Add props: `onReset: () => void`, `isResetting: boolean`.
- Import `RotateCcw` and `Loader2` from lucide-react.
- Add `showResetDialog` state.
- Add Reset button in both running and paused action groups (third button, secondary/destructive style). Disabled when `isResetting` or `debounced`. Shows `Loader2` spinner when `isResetting`.
- Add Reset confirmation dialog:
  - Title: "Reset this session?"
  - Description: "This will erase {timerDisplay} of tracked time."
  - `timerDisplay` already correctly shows: running time (accumulated + live) when running, `pausedTimeSeconds` when paused.
  - Cancel button + destructive "Reset" confirm button (disabled when `isResetting`).
  - On confirm: close dialog, call `onReset()`.

### 3. `src/pages/Today.tsx`
- Pass `onReset={executionTimer.resetTaskTimer}` and `isResetting={executionTimer.isResetting}` to `ActiveTimerBanner`.
- When `timerContext` becomes null after reset, the existing conditionals already handle:
  - Banner unmounts (gated by `timerContext`).
  - FloatingTimerPill unmounts (also gated by `timerContext`).
  - `isTimerMinimized` becomes irrelevant (both are gated by `timerContext &&`).

## What Does NOT Change
- Execution state model (4-state machine).
- `completeTask` / `pauseTaskTimer` / `startTaskTimer` logic.
- FloatingTimerPill component (no reset from minimized view).
- `timerContext` derivation in useEffect (reset sets `execution_state: 'pending'` which maps to idle, so `timerContext` naturally becomes null on next sync).
- Task card components.

## Layout of Actions Row (after change)

Running state:
```text
[ Pause ] [ Done ] [ Reset ]
```

Paused state:
```text
[ Resume ] [ Done ] [ Reset ]
```

Reset button is smaller/icon-only with destructive outline styling to avoid visual clutter.


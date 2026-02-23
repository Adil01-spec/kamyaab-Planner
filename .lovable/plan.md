
# Refactor: Decouple Timer Banner Visibility from Execution Status

## Problem
Line 932 in `Today.tsx` gates the `ActiveTimerBanner` on `executionTimer.activeTimer`, which is `null` when paused. The banner unmounts entirely instead of transitioning to a paused display.

## Solution
Add a `timerContext` derived state to `useExecutionTimer` that persists across pause/resume. Add a `FloatingTimerPill` for minimize. Keep `activeTimer` behavior unchanged (null when paused) since interval logic depends on it.

---

## Changes

### 1. `src/lib/executionTimer.ts`
- Add `findPausedTask(planData)` helper mirroring `findActiveTask` but looking for `execution_state === 'paused'` (with `normalizeExecutionState` for legacy data).

### 2. `src/hooks/useExecutionTimer.ts`
- Add `TimerContext` type: `{ status: 'running' | 'paused'; taskTitle: string; weekIndex: number; taskIndex: number; pausedTimeSeconds: number } | null`.
- Add `timerContext` state (`useState<TimerContext>(null)`).
- Add `dismissTimer()` function that sets `timerContext` to `null`.
- In `startTaskTimer`: after optimistic UI update, set `timerContext` to `{ status: 'running', ... }`.
- In `pauseTaskTimer`: after optimistic UI update, set `timerContext` to `{ status: 'paused', pausedTimeSeconds: newTimeSpent, ... }`. Do NOT null it out.
- In `completeTaskTimer`: set `timerContext` to `null`.
- In the `useEffect([planData])` sync: derive `timerContext` from plan data -- if `activeTimer` is set, `status: 'running'`; else use `findPausedTask` for `status: 'paused'`; else `null`. Skip derivation when `isLocalOpRef` is true (same as activeTimer sync).
- Export `timerContext` and `dismissTimer` in return object.

### 3. `src/components/ActiveTimerBanner.tsx`
- Replace `executionStatus` prop with `timerStatus: 'running' | 'paused'`.
- Add `onMinimize` callback prop.
- Add `onResume` callback prop (already partially exists).
- Add minimize icon button (ChevronDown) in the header area.
- When `timerStatus === 'paused'`: show frozen time from `pausedTimeSeconds`, pause icon, "Resume" + "Done" buttons.
- When `timerStatus === 'running'`: show live time from `elapsedSeconds`, pulsing dot, "Pause" + "Done" buttons.
- Use `AnimatePresence mode="wait"` for smooth button transitions (200ms opacity + scale).
- Component never self-unmounts -- parent controls visibility.

### 4. New: `src/components/FloatingTimerPill.tsx`
- Fixed position: `bottom-20 sm:bottom-4 right-4 z-50`.
- Shows: clock icon + time + truncated task title.
- Running: pulsing dot + live time. Paused: pause icon + frozen time + "Paused" label.
- Click calls `onRestore()`.
- Entrance: `framer-motion` scale-in + fade-in (200ms).
- Compact rounded-full pill with glass-card styling.

### 5. `src/pages/Today.tsx`
- Add `isTimerMinimized` state (default `false`).
- Replace `{executionTimer.activeTimer && (` (line 932) with `{executionTimer.timerContext && !isTimerMinimized && (`.
- Add `{executionTimer.timerContext && isTimerMinimized && (<FloatingTimerPill ... />)}`.
- Pass `timerStatus={executionTimer.timerContext.status}`, `pausedTimeSeconds`, `onMinimize`, `onResume` to `ActiveTimerBanner`.
- Wire `onResume` to `executionTimer.startTaskTimer(ctx.weekIndex, ctx.taskIndex, ctx.taskTitle)`.
- Reset `isTimerMinimized` to `false` on complete/dismiss.

---

## What Does NOT Change
- `activeTimer` stays `null` when paused (interval logic depends on this).
- `elapsedSeconds` stays 0 when paused (live ticker only).
- `isMutatingRef`, `isLocalOpRef` guards untouched.
- `normalizeExecutionState()` untouched.
- Optimistic pause/resume flow untouched.
- Task card components unchanged.
- `completeTaskTimer` stays await-based.

## Order of Implementation
1. Add `findPausedTask()` to `executionTimer.ts`
2. Add `timerContext` + `dismissTimer()` to `useExecutionTimer.ts`
3. Refactor `ActiveTimerBanner.tsx`
4. Create `FloatingTimerPill.tsx`
5. Update `Today.tsx` rendering logic

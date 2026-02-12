

# Production Bug Fixes for Kaamyab

## Overview
Seven production-level fixes addressing auth flicker, routing issues, gesture conflicts, timer logic, button consolidation, cursor effects on mobile, and Safari calendar behavior.

---

## Fix 1: Onboarding Flash After Login

**Root Cause**: In `AuthContext.tsx`, `setLoading(false)` fires at line 171 (in `onAuthStateChange`) before `fetchProfile` completes (deferred via `setTimeout`). This means `ProtectedRoute` sees `loading=false`, `user` exists, but `profile` is `null` -- so it redirects to `/onboarding` briefly until `fetchProfile` finishes.

**Solution**: Keep `loading=true` until both auth state AND profile fetch are resolved.

**Files Modified**:
- `src/contexts/AuthContext.tsx`
  - Do NOT call `setLoading(false)` in `onAuthStateChange` when a user session exists. Instead, call it inside `fetchProfile` after the profile is fetched (or after confirming no profile exists).
  - In `initSession`, similarly defer `setLoading(false)` until after `fetchProfile` resolves (make it `await fetchProfile(...)` and move `setLoading(false)` after).

---

## Fix 2: Plan Generation Routing Flicker

**Root Cause**: In `Onboarding.tsx` line 290, after plan generation succeeds, it navigates to `/plan`. However the user sees a brief flash because the profile is being saved, then the generate-plan function is called, and the toast + navigate happen in quick succession. The real issue from the user's description is that onboarding calls `navigate('/plan')` and the `/plan` page briefly has no plan loaded yet, or there's an intermediate redirect.

Actually, looking more carefully: the onboarding `handleSubmit` (line 217-306) already stays on the same page and shows a loading spinner via `setLoading(true)`. The "Generate Plan" button shows a loader. The flicker the user describes is likely from the `/plan/reset` route being hit from other flows. But from onboarding itself, the flow looks correct. The real issue is the "Generate New Plan" button on `/plan` which navigates to `/plan/new` which redirects to `/plan/reset` (two hops).

**Solution**: Improve the onboarding submit UX by showing a full-page loading overlay (instead of just a button spinner) during plan generation.

**Files Modified**:
- `src/pages/Onboarding.tsx`
  - When `loading` is true during `handleSubmit`, render a full-page loading overlay with "Generating your execution plan..." message and subtext instead of just a disabled button.
  - This prevents any partial onboarding UI from showing during the async generation.

---

## Fix 3: Horizontal Scroll Bug on Mobile (/plan)

**Root Cause**: `useSwipeNavigation` in `Plan.tsx` (line 870-873) attaches `onTouchStart/Move/End` handlers to the entire page container (line 886). When the user horizontally scrolls the `WeeklyCalendarView` (which uses `ScrollArea` with horizontal overflow), the swipe gesture is captured by the parent navigation handler and triggers a route change.

**Solution**: Prevent swipe navigation when the touch originates inside a horizontally scrollable container.

**Files Modified**:
- `src/hooks/useSwipeNavigation.ts`
  - In `onTouchStart`, check if the touch target (or any ancestor up to the handler element) has `overflow-x: auto/scroll` or a `data-no-swipe-nav` attribute. If so, skip capturing the touch.
  - Add a check: if the touched element is inside a scrollable container, set a flag to ignore this swipe gesture entirely.

---

## Fix 4: Timer Pause Button Logic

**Root Cause**: Looking at `pauseTask` in `src/lib/executionTimer.ts` (line 342-378), the pause function correctly accumulates `time_spent_seconds` and clears `execution_started_at`. However, it sets `execution_state: 'pending'`, which means the task goes back to the "idle/pending" state. In `useExecutionTimer.ts`, `pauseTaskTimer` then sets `activeTimer` to `null` and `elapsedSeconds` to `0`.

The problem is that after pausing, the task appears as "pending" again (not "paused"), so the user must click "Start" again. When they do, `startTask` creates a new `execution_started_at` timestamp, and the timer starts from 0 visually -- but the accumulated `time_spent_seconds` is preserved in the data.

The visual issue: the timer display resets to `00:00` after pause because `elapsedSeconds` is set to 0 and `activeTimer` is cleared. When the user resumes (starts again), `calculateElapsedSeconds` only counts from the new `execution_started_at`, not including the accumulated `time_spent_seconds`.

**Solution**: 
- The timer display when active should show `accumulatedSeconds + liveElapsed` (not just `liveElapsed`).
- Add accumulated time from `time_spent_seconds` to the elapsed display.

**Files Modified**:
- `src/hooks/useExecutionTimer.ts`
  - When initializing timer state from plan data (lines 48-80), include `task.time_spent_seconds` as a base offset.
  - Extend `ActiveTimerState` (or add a local field) to track `accumulated_seconds`.
  - In the tick interval, display `accumulated + calculateElapsedSeconds(started_at)`.
- `src/lib/executionTimer.ts`
  - Update `ActiveTimerState` interface to include `accumulated_seconds: number`.
  - In `startTask`, when creating the local timer, set `accumulated_seconds` to the task's existing `time_spent_seconds || 0`.

---

## Fix 5: Merge Delete + Generate New Plan Buttons

**Root Cause**: Two separate buttons exist at lines 1443-1460 of `Plan.tsx`. "Delete this plan" opens a delete confirmation dialog. "Generate New Plan" navigates to `/plan/new` (which redirects to `/plan/reset`), but this doesn't work properly because `/plan/reset` checks for existing plans and redirects back.

**Solution**: Replace both buttons with a single "Generate New Plan" button that shows a confirmation modal, then deletes the existing plan and triggers plan generation inline (with a full-page loading state), then navigates to `/plan` when complete.

**Files Modified**:
- `src/pages/Plan.tsx`
  - Remove the two separate buttons at lines 1443-1460.
  - Add a single "Generate New Plan" button that opens a new confirmation dialog.
  - Create a `GenerateNewPlanDialog` component (or modify the existing `DeletePlanDialog`) with the specified copy: title "Generate New Plan?", message about permanent deletion.
  - On confirm: delete existing plan, navigate to `/plan/reset` (the existing plan reset flow handles generation). Actually, to avoid flicker, the flow should: delete plan, then navigate to `/plan/reset` which will handle generation.
  - Alternatively, keep using `/plan/reset` but the navigation should be seamless since the plan will be deleted first.
- `src/components/DeletePlanDialog.tsx`
  - Update or create a variant for the "Generate New Plan" confirmation with the new copy.

---

## Fix 6: Cursor Effect on Mobile

**Root Cause**: `CursorExplosionButton` checks `getDesktopSettings().cursorEffects` but doesn't check if the device is actually a desktop with a fine pointer. On mobile, if `cursorEffects` is truthy in localStorage, the effect can render on hover (which mobile simulates on tap).

**Solution**: Add a pointer capability check.

**Files Modified**:
- `src/components/CursorExplosionButton.tsx`
  - Add a check: `const hasPointer = typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches;`
  - Update `effectsEnabled` to: `!disableEffect && hasPointer && getDesktopSettings().cursorEffects`.

---

## Fix 7: Safari Calendar -- Open Apple Calendar Directly

**Root Cause**: In `src/lib/calendarService.ts` line 568-583, `openAppleCalendar` uses `window.location.href = dataUri` with a `data:text/calendar` URI. On macOS Safari, this sometimes triggers a download (potentially as `.tar` due to MIME handling) instead of opening Apple Calendar.

**Solution**: Use a Blob + object URL approach with correct MIME type, creating a temporary `<a>` element. For Safari specifically, use `window.open` with the blob URL or create a proper download link with `.ics` extension and `Content-Disposition: inline` behavior.

**Files Modified**:
- `src/lib/calendarService.ts`
  - Replace the `openAppleCalendar` function (lines 568-583):
    - Create a `Blob` with type `text/calendar;charset=utf-8`.
    - Create an object URL from the blob.
    - Create a temporary `<a>` element with `href` set to the object URL.
    - Set `download` attribute to `event.ics` (the `.ics` extension tells macOS to open in Calendar).
    - Programmatically click the link, then revoke the URL.
    - This ensures Safari recognizes the file as an `.ics` calendar event and opens it in Apple Calendar rather than downloading as `.tar`.

---

## Implementation Sequence
1. Fix 1 (AuthContext loading gate) -- highest impact, affects all users
2. Fix 6 (Cursor on mobile) -- simple, no dependencies
3. Fix 4 (Timer pause) -- self-contained logic fix
4. Fix 3 (Swipe navigation conflict) -- self-contained
5. Fix 5 (Merge buttons) -- UI change in Plan.tsx
6. Fix 2 (Onboarding loading overlay) -- UI polish
7. Fix 7 (Safari calendar) -- platform-specific fix


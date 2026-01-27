

## Locked Week Execution Guard

### Problem Analysis

After enabling cross-week task movement, a critical security gap exists: **tasks in locked weeks can be executed (started/completed)**. This breaks the sequential week progression model.

**Root Cause:** The `DraggableTaskItem` component always passes `isLocked={false}` to `TaskItem`, ignoring the week's locked status.

**Current Broken Behavior:**
- Checkbox toggles work on locked week tasks
- "Start Task" button is active on locked week tasks
- Timer can be started on locked week tasks
- Locked tasks can appear actionable on /today

---

### Solution Architecture

```text
+-------------------+     +-------------------+     +-------------------+
|   Plan.tsx        | --> | DraggableTaskItem | --> |    TaskItem       |
|  (determines      |     | (passes isLocked  |     | (UI enforcement)  |
|   locked weeks)   |     |  to TaskItem)     |     |                   |
+-------------------+     +-------------------+     +-------------------+
         |                                                    |
         v                                                    v
+-------------------+                               +-------------------+
| useExecutionTimer |                               |  /today page      |
| (core logic guard)|                               | (filter out       |
+-------------------+                               |  locked tasks)    |
                                                    +-------------------+
```

**Guards implemented at 3 levels:**
1. **UI Level:** Disable buttons, show tooltip for locked tasks
2. **Logic Level:** Prevent execution in hooks/libraries
3. **Data Level:** Filter locked tasks from /today view

---

### Files to Modify

| File | Change |
|------|--------|
| `src/components/DraggableTaskItem.tsx` | Pass `isLocked` prop based on week status |
| `src/components/TaskItem.tsx` | Add "Available when unlocked" tooltip, disable Start button for locked tasks |
| `src/hooks/useExecutionTimer.ts` | Add `isTaskInLockedWeek` check to `startTaskTimer` |
| `src/lib/executionTimer.ts` | Add `isTaskInLockedWeek` helper function |
| `src/lib/todayScheduledTasks.ts` | Filter out tasks from locked weeks |

### Files to Create

| File | Description |
|------|-------------|
| `src/lib/weekLockStatus.ts` | Shared utility to determine if a week/task is locked |

---

### Technical Implementation

#### Step 1: Create Week Lock Status Utility

**File:** `src/lib/weekLockStatus.ts`

A shared utility that determines lock status for any week or task:

```typescript
interface Week {
  week: number;
  tasks: {
    completed?: boolean;
    execution_state?: 'pending' | 'doing' | 'done';
  }[];
}

interface PlanData {
  weeks: Week[];
}

/**
 * Get the index of the first incomplete week (the "active" week)
 * Returns -1 if all weeks are complete
 */
export function getActiveWeekIndex(plan: PlanData): number {
  for (let i = 0; i < plan.weeks.length; i++) {
    const hasIncompleteTasks = plan.weeks[i].tasks.some(
      t => t.execution_state !== 'done' && !t.completed
    );
    if (hasIncompleteTasks) return i;
  }
  return -1; // All complete
}

/**
 * Check if a specific week is locked
 * Locked = comes after the first incomplete week
 */
export function isWeekLocked(plan: PlanData, weekIndex: number): boolean {
  const activeWeekIndex = getActiveWeekIndex(plan);
  if (activeWeekIndex === -1) return false; // All complete, nothing locked
  return weekIndex > activeWeekIndex;
}

/**
 * Check if a specific task is in a locked week
 */
export function isTaskInLockedWeek(plan: PlanData, weekIndex: number): boolean {
  return isWeekLocked(plan, weekIndex);
}
```

---

#### Step 2: Update DraggableTaskItem

**File:** `src/components/DraggableTaskItem.tsx`

Add `isLockedWeek` prop and pass it to TaskItem:

**Current (line 170):**
```typescript
isLocked={false}
```

**Updated:**
```typescript
isLocked={isLockedWeek}
```

**Props to add:**
```typescript
interface DraggableTaskItemProps {
  // ... existing props
  isLockedWeek: boolean; // NEW: whether this task's week is locked
}
```

The `isLockedWeek` value will be passed from `Plan.tsx` (it's already calculated there as `isLockedWeek`).

---

#### Step 3: Update TaskItem Component

**File:** `src/components/TaskItem.tsx`

Modify the component to:
1. Hide the "Start Task" button for locked tasks
2. Show a subtle "Available when unlocked" tooltip
3. Disable checkbox for locked tasks (already partially implemented)

**Add to TaskItem (after line 131):**
```typescript
// Determine if execution actions should be blocked
const executionBlocked = isLocked;
```

**Update the Start Task button section (around line 178-203 area):**
```typescript
{/* Start Task button - only for unlocked, non-completed tasks */}
{onStartTask && !isLocked && !isDone && executionState === 'pending' && (
  <Button
    onClick={(e) => {
      e.stopPropagation();
      onStartTask?.();
    }}
    // ... rest of button
  />
)}

{/* Locked task indicator */}
{isLocked && !isDone && (
  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
    <Lock className="w-3.5 h-3.5" />
    <span>Available when this week unlocks</span>
  </div>
)}
```

**Ensure checkbox click is blocked (already partially done around line 179-186):**
```typescript
const handleClick = () => {
  if (isLocked) return; // Already exists
  onToggle();
};
```

---

#### Step 4: Add Logic Guard in useExecutionTimer

**File:** `src/hooks/useExecutionTimer.ts`

Add a guard in `startTaskTimer` to prevent starting tasks in locked weeks:

```typescript
import { isTaskInLockedWeek } from '@/lib/weekLockStatus';

// Inside startTaskTimer function (around line 117-146):
const startTaskTimer = useCallback(
  async (weekIndex: number, taskIndex: number, taskTitle: string): Promise<boolean> => {
    if (!user?.id || !planData) return false;

    // NEW: Guard against starting tasks in locked weeks
    if (isTaskInLockedWeek(planData, weekIndex)) {
      console.warn('Cannot start task in locked week');
      return false;
    }

    // ... rest of existing logic
  },
  [user?.id, planData, onPlanUpdate]
);
```

---

#### Step 5: Add Logic Guard in executionTimer.ts

**File:** `src/lib/executionTimer.ts`

Add check in `startTask` function as a secondary guard:

```typescript
import { isTaskInLockedWeek } from '@/lib/weekLockStatus';

// Inside startTask function (around line 217-268):
export async function startTask(
  userId: string,
  planData: any,
  weekIndex: number,
  taskIndex: number
): Promise<{ success: boolean; updatedPlan: any; error?: string }> {
  // NEW: Guard against starting tasks in locked weeks
  if (isTaskInLockedWeek(planData, weekIndex)) {
    return { 
      success: false, 
      updatedPlan: planData, 
      error: 'Cannot start task in locked week' 
    };
  }

  // ... rest of existing logic
}

// Similarly for completeTask function (around line 270):
export async function completeTask(
  userId: string,
  planData: any,
  weekIndex: number,
  taskIndex: number
): Promise<{ success: boolean; updatedPlan: any; timeSpent: number; error?: string }> {
  // NEW: Guard against completing tasks in locked weeks
  if (isTaskInLockedWeek(planData, weekIndex)) {
    return { 
      success: false, 
      updatedPlan: planData, 
      timeSpent: 0,
      error: 'Cannot complete task in locked week' 
    };
  }

  // ... rest of existing logic
}
```

---

#### Step 6: Filter Locked Tasks from /today

**File:** `src/lib/todayScheduledTasks.ts`

Modify `getTasksScheduledForToday` to exclude tasks from locked weeks:

```typescript
import { isTaskInLockedWeek } from '@/lib/weekLockStatus';

export function getTasksScheduledForToday(plan: PlanData): ScheduledTodayTask[] {
  if (!plan?.weeks || plan.weeks.length === 0) {
    return [];
  }

  const scheduledTasks = getScheduledCalendarTasks();
  const today = new Date();
  const todayStart = startOfDay(today);
  const todayEnd = endOfDay(today);

  const tasksForToday: ScheduledTodayTask[] = [];

  for (const scheduled of scheduledTasks) {
    const { weekNumber, taskIndex, scheduledAt } = scheduled;
    const weekIndex = weekNumber - 1;

    // Validate week and task exist
    if (weekIndex < 0 || weekIndex >= plan.weeks.length) continue;
    const week = plan.weeks[weekIndex];
    if (!week?.tasks || taskIndex < 0 || taskIndex >= week.tasks.length) continue;

    // NEW: Skip tasks in locked weeks
    if (isTaskInLockedWeek(plan, weekIndex)) continue;

    // Check if scheduledAt is today (local time)
    try {
      const scheduledDate = parseISO(scheduledAt);
      if (isWithinInterval(scheduledDate, { start: todayStart, end: todayEnd })) {
        tasksForToday.push({
          task: week.tasks[taskIndex],
          weekIndex,
          taskIndex,
          weekFocus: week.focus,
          scheduledAt,
        });
      }
    } catch {
      continue;
    }
  }

  // Sort by scheduled time
  tasksForToday.sort((a, b) => {
    return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
  });

  return tasksForToday;
}
```

---

#### Step 7: Update Plan.tsx to Pass isLockedWeek

**File:** `src/pages/Plan.tsx`

In the `DraggableTaskItem` render (around lines 1325-1342), add the `isLockedWeek` prop:

```tsx
<DraggableTaskItem
  key={taskId}
  task={task as Task}
  taskId={taskId}
  weekIndex={weekIndex}
  taskIndex={taskIndex}
  weekNumber={week.week}
  isActiveWeek={isActiveWeek}
  isWeekComplete={isWeekComplete}
  isLockedWeek={isLockedWeek}  // NEW PROP
  planCreatedAt={planCreatedAt || undefined}
  onToggle={() => toggleTask(weekIndex, taskIndex)}
  onCalendarStatusChange={triggerCalendarRefresh}
  onStartTask={() => handleStartTaskClick(weekIndex, taskIndex, task.title, task.estimated_hours)}
  executionState={getExecutionState(task as Task, weekIndex, taskIndex)}
  elapsedSeconds={getElapsedSeconds(weekIndex, taskIndex)}
  canDrag={canDragResult.allowed}
  blockReason={canDragResult.reason}
/>
```

---

### Drag Behavior (Unchanged)

The following remains exactly as-is:
- Locked tasks can still be dragged
- Locked tasks can be moved across weeks
- Moving a locked task to the current week makes it executable
- Moving an unlocked task to a locked week makes it non-executable

This is enforced by the fact that `isLockedWeek` is calculated per-week, not stored on the task. After a move, the task's executability is determined by its new position.

---

### UX Summary

| Task State | Checkbox | Start Button | Timer | Drag |
|------------|----------|--------------|-------|------|
| Unlocked, pending | Enabled | "Start Task" shown | Can start | Yes |
| Unlocked, doing | Enabled | Hidden (timer active) | Running | No (blocked) |
| Unlocked, done | Enabled | Hidden | N/A | Yes |
| Locked, pending | Disabled | Hidden, shows "Available when unlocked" | Cannot start | Yes |
| Locked, done | Disabled | Hidden | N/A | Yes |

---

### Implementation Order

1. Create `src/lib/weekLockStatus.ts` - shared utility
2. Update `src/components/DraggableTaskItem.tsx` - add `isLockedWeek` prop, pass to TaskItem
3. Update `src/components/TaskItem.tsx` - add locked state UI enforcement
4. Update `src/hooks/useExecutionTimer.ts` - add logic guard
5. Update `src/lib/executionTimer.ts` - add secondary logic guards
6. Update `src/lib/todayScheduledTasks.ts` - filter locked tasks
7. Update `src/pages/Plan.tsx` - pass `isLockedWeek` to DraggableTaskItem

---

### Testing Checklist

**Execution Blocked:**
- [ ] Locked task checkbox does nothing when clicked
- [ ] Locked task shows no "Start Task" button
- [ ] Locked task shows "Available when this week unlocks" text
- [ ] Timer cannot be started on locked task (even via direct call)

**Drag Still Works:**
- [ ] Locked tasks can still be dragged
- [ ] Locked tasks can move to unlocked weeks (become executable)
- [ ] Unlocked tasks can move to locked weeks (become non-executable)

**/today Safety:**
- [ ] Locked tasks never appear as actionable on /today
- [ ] If locked task is scheduled for today, it doesn't show
- [ ] No duplicate tasks, no missing unlocked tasks

**After Moving:**
- [ ] Task moved to current week can be started immediately
- [ ] Task moved to locked week cannot be started

---

### Summary

This implementation adds execution guards at three levels (UI, logic, data) to ensure locked week tasks cannot be executed while preserving the cross-week drag functionality. The guards are:

1. **UI:** TaskItem shows "Available when unlocked" instead of Start button
2. **Logic:** useExecutionTimer and executionTimer.ts reject locked task execution
3. **Data:** /today filters out tasks from locked weeks

The user experience becomes: **"I can reorganize the future, but I can't cheat time."**


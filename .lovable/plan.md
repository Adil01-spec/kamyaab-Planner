

## Task Reordering on /plan Page

### Overview
This feature enables users to manually reorder tasks within each week on the `/plan` page using drag-and-drop. The order changes persist immediately and are preserved across page refreshes, navigation, and app reloads.

**Core Principle:** "This plan is mine. I can shape it."

---

### Architecture Approach

Since `framer-motion` is already installed and used extensively for animations and gestures throughout the app (swipe gestures, parallax effects), we will implement reordering using `framer-motion`'s `Reorder` component family. This approach:

- Avoids adding new dependencies
- Maintains consistent animation patterns
- Provides smooth, native-feeling drag interactions
- Works well on both desktop and mobile

---

### Files to Create

| File | Description |
|------|-------------|
| `src/components/ReorderableTaskList.tsx` | Container component that wraps tasks in `Reorder.Group` |
| `src/components/ReorderableTaskItem.tsx` | Wrapper for `TaskItem` with drag handle and `Reorder.Item` |
| `src/hooks/useTaskReorder.ts` | Hook managing reorder logic and persistence |

### Files to Modify

| File | Change |
|------|--------|
| `src/pages/Plan.tsx` | Replace direct `TaskItem` mapping with `ReorderableTaskList` |

---

### Technical Implementation

#### Step 1: Create `useTaskReorder` Hook

**File:** `src/hooks/useTaskReorder.ts`

This hook encapsulates the reordering logic and handles persistence to the database.

```typescript
interface UseTaskReorderOptions {
  plan: PlanData;
  planId: string | null;
  userId: string | undefined;
  onPlanUpdate: (plan: PlanData) => void;
}

interface UseTaskReorderReturn {
  reorderTasks: (weekIndex: number, reorderedTasks: Task[]) => Promise<void>;
  isReordering: boolean;
}
```

**Key Responsibilities:**
- Accept the new task order for a specific week
- Update local state immediately (optimistic UI)
- Persist to Supabase via `plan_json` update
- Handle errors with rollback
- Track `isReordering` state for UI feedback

**Guardrails Enforced:**
- NO modification to `completed`, `execution_state`, or timer data
- NO triggering of insights/analysis updates
- Pure array reordering only

---

#### Step 2: Create `ReorderableTaskItem` Component

**File:** `src/components/ReorderableTaskItem.tsx`

A wrapper component that adds drag functionality to `TaskItem`.

```
┌────────────────────────────────────────────────────────────────────────────┐
│  ⋮⋮  [Drag Handle]   TaskItem (existing component)                       │
│      (visible on                                                          │
│       hover/touch)                                                        │
└────────────────────────────────────────────────────────────────────────────┘
```

**Features:**
- Wraps `TaskItem` in `Reorder.Item` from framer-motion
- Adds drag handle (`GripVertical` icon from lucide-react)
- Handle visible on hover (desktop) or always visible with touch affordance (mobile)
- Smooth layout animations during reorder
- Haptic feedback on drag start/end (mobile)
- Disabled when task is locked or week is locked

**Props:**
```typescript
interface ReorderableTaskItemProps {
  task: Task;
  weekIndex: number;
  taskIndex: number;
  // ... all existing TaskItem props
  isLocked?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}
```

---

#### Step 3: Create `ReorderableTaskList` Component

**File:** `src/components/ReorderableTaskList.tsx`

Container that manages the reorderable list for a single week.

```typescript
interface ReorderableTaskListProps {
  tasks: Task[];
  weekIndex: number;
  weekNumber: number;
  isLockedWeek: boolean;
  isActiveWeek: boolean;
  onReorder: (weekIndex: number, reorderedTasks: Task[]) => void;
  // ... other props passed through to TaskItem
}
```

**Structure:**
```jsx
<Reorder.Group
  axis="y"
  values={tasks}
  onReorder={(newOrder) => onReorder(weekIndex, newOrder)}
>
  {tasks.map((task, taskIndex) => (
    <ReorderableTaskItem
      key={task.title + taskIndex} // Stable key
      task={task}
      ...props
    />
  ))}
</Reorder.Group>
```

**Key Features:**
- Uses `Reorder.Group` with `axis="y"` for vertical reordering
- Only enables reordering for unlocked weeks
- Passes reorder callback to parent

---

#### Step 4: Integrate into Plan.tsx

**Location:** Lines 1111-1137 in `src/pages/Plan.tsx`

**Current Code:**
```jsx
<div className="space-y-2">
  {week.tasks.map((task, taskIndex) => (
    <TaskItem
      key={taskIndex}
      ...props
    />
  ))}
</div>
```

**New Code:**
```jsx
<ReorderableTaskList
  tasks={week.tasks}
  weekIndex={weekIndex}
  weekNumber={week.week}
  isLockedWeek={isLockedWeek}
  isActiveWeek={isActiveWeek}
  onReorder={reorderTasks}
  // ... pass through other props
/>
```

**Additional Changes:**
- Import `ReorderableTaskList` and `useTaskReorder`
- Initialize `useTaskReorder` hook with plan data
- No changes to the Flow View tab (read-only)

---

### Data Flow

```
User drags task → ReorderableTaskItem triggers Reorder.Group onReorder
                               ↓
                    ReorderableTaskList calls onReorder(weekIndex, newTasks)
                               ↓
                    useTaskReorder.reorderTasks()
                               ↓
              ┌────────────────┴────────────────┐
              ↓                                  ↓
    Update local state (setPlan)       Persist to Supabase
         (immediate)                    (async, background)
              ↓                                  ↓
    UI updates instantly              plan_json saved
                                             ↓
                               On error: rollback local state
```

---

### UX Specifications

#### Desktop
| State | Behavior |
|-------|----------|
| Idle | Drag handle hidden |
| Hover on task row | Drag handle appears (fade in) |
| Dragging | Task lifts with subtle shadow, other tasks animate to make space |
| Drop | Smooth animation to new position |

#### Mobile
| State | Behavior |
|-------|----------|
| Idle | Drag handle always visible (small, muted) |
| Long-press on handle | Haptic feedback, task becomes draggable |
| Dragging | Task lifts, other tasks animate |
| Drop | Haptic confirmation, smooth settle animation |

#### Animation Specs
- Drag lift: `scale: 1.02`, `boxShadow: "0 8px 25px rgba(0,0,0,0.15)"`, `zIndex: 10`
- Transition: `type: "spring", stiffness: 400, damping: 30` (matches existing swipe patterns)
- Layout animation: Automatic via `layout` prop on `Reorder.Item`

---

### Guardrails (Strict)

| Constraint | Implementation |
|------------|----------------|
| No timer reset | Reorder only changes array order, preserves all task properties |
| No completion change | `completed`, `execution_state` untouched |
| No /today impact | `/today` uses `taskIndex` from original plan - reordering updates `taskIndex` naturally |
| No regeneration | Only `plan_json.weeks[x].tasks` array order changes |
| No insights trigger | No side effects, pure reorder |

---

### Persistence Strategy

**Storage:** Existing `plans.plan_json` column (JSONB)

**Update Logic:**
```typescript
const reorderTasks = async (weekIndex: number, newTasks: Task[]) => {
  // 1. Optimistic update
  const updatedPlan = { ...plan };
  updatedPlan.weeks[weekIndex].tasks = newTasks;
  onPlanUpdate(updatedPlan);
  
  // 2. Persist to Supabase
  const { error } = await supabase
    .from('plans')
    .update({ plan_json: updatedPlan })
    .eq('user_id', userId);
  
  // 3. On error, rollback
  if (error) {
    onPlanUpdate(originalPlan);
    toast({ title: "Couldn't save order", variant: "destructive" });
  }
};
```

**No new fields or schema changes required.**

---

### /today Logic Verification

The `/today` page uses `src/lib/todayTaskSelector.ts` which:

1. Finds the current active week (first week with incomplete tasks)
2. Gets tasks from that week
3. Sorts by priority, then by `taskIndex`

**Impact of Reordering:**
- When tasks are reordered, their position in the `tasks` array changes
- `taskIndex` reflects the new array position
- `/today` will automatically respect the new order within its priority sort

**Example:**
- Before reorder: `[TaskA (Low), TaskB (High), TaskC (Medium)]`
- User reorders: `[TaskB (High), TaskC (Medium), TaskA (Low)]`
- `/today` output (sorted by priority): Same - `[TaskB, TaskC, TaskA]`
- If same priority, array position wins

---

### Mobile Considerations

1. **Scroll Safety:**
   - Use `touch-action: pan-y` on container
   - Only initiate drag from handle, not entire row
   - Prevent scroll during active drag

2. **Long-Press Detection:**
   - 150ms threshold for drag activation
   - Visual feedback (subtle background change) during long-press
   - Cancel if finger moves before threshold

3. **Haptic Feedback:**
   - `hapticSelection()` on drag start
   - `hapticLight()` on drop

---

### Implementation Order

1. Create `src/hooks/useTaskReorder.ts` - reorder logic and persistence
2. Create `src/components/ReorderableTaskItem.tsx` - draggable task wrapper
3. Create `src/components/ReorderableTaskList.tsx` - reorderable container
4. Modify `src/pages/Plan.tsx` - integrate components

---

### Testing Checklist

1. **Reorder persists:**
   - Reorder tasks in Week 1
   - Refresh page → order preserved
   - Navigate away and back → order preserved

2. **No side effects:**
   - Reorder a task → timer not reset
   - Reorder a task → completion status unchanged
   - Reorder a task → no toast about insights/analysis

3. **UX quality:**
   - Desktop: handle appears on hover
   - Mobile: long-press initiates drag
   - Smooth animations during drag
   - Haptic feedback on mobile

4. **Edge cases:**
   - Cannot reorder in locked weeks
   - Can reorder in active week
   - Can reorder in completed weeks
   - Works with 1 task (no-op)
   - Works with many tasks

5. **/today unaffected:**
   - Reorder tasks on /plan
   - Go to /today → tasks show correctly based on priority + new order

---

### Summary

This implementation enables manual task reordering on the `/plan` page using framer-motion's `Reorder` components. The feature:

- Uses existing dependencies (framer-motion)
- Persists order immediately to the existing `plan_json` structure
- Provides smooth, native-feeling drag interactions
- Works on both desktop (hover) and mobile (long-press)
- Has zero side effects on timers, completion, or insights

Users will feel: **"This plan is mine. I can shape it."**


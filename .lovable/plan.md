

## Cross-Week Task Movement on /plan Page

### Overview
This feature extends the existing task reordering to allow users to drag tasks between weeks (locked or unlocked). It enables full manual control over task scheduling while maintaining execution safety and /today view integrity.

**Core Principle:** "I can reshuffle reality when things change."

---

### Current State Analysis

The existing implementation:
- Uses `framer-motion`'s `Reorder.Group` per week for within-week reordering
- Each week has its own isolated `Reorder.Group`, preventing cross-week movement
- Tasks are stored in `plan.weeks[weekIndex].tasks[]` arrays
- No `week_index` field on tasks - position in array determines week

**Key Insight:** Cross-week movement requires a fundamentally different approach since `Reorder.Group` only handles items within a single list.

---

### Architecture Approach

**Option Selected: Drag-and-Drop with `@dnd-kit` Library**

Since framer-motion's `Reorder` components are designed for single-list reordering and don't support moving items between groups, we need to either:
1. Use a dedicated cross-list DnD library (`@dnd-kit`)
2. Build custom drag-and-drop with framer-motion's low-level APIs

**Decision: Use `@dnd-kit/core` and `@dnd-kit/sortable`**

Reasons:
- Purpose-built for multi-container drag-and-drop
- Excellent accessibility support
- Supports both within-list reordering AND cross-list movement
- Works well with React state management
- Touch-friendly with mobile optimizations

---

### Files to Create

| File | Description |
|------|-------------|
| `src/hooks/useCrossWeekTaskMove.ts` | Hook managing cross-week movement logic and persistence |
| `src/components/DraggableWeekContainer.tsx` | Wrapper for each week that acts as a droppable container |
| `src/components/DraggableTaskItem.tsx` | Individual draggable task with handle |

### Files to Modify

| File | Change |
|------|--------|
| `src/pages/Plan.tsx` | Replace `ReorderableTaskList` with new DnD components, pass active timer for safety checks |
| `src/hooks/useTaskReorder.ts` | Extend to handle cross-week moves (move + reorder) |
| `package.json` | Add `@dnd-kit/core` and `@dnd-kit/sortable` dependencies |

### Files to Remove (Optional)

| File | Reason |
|------|--------|
| `src/components/ReorderableTaskList.tsx` | Replaced by new DnD system |
| `src/components/ReorderableTaskItem.tsx` | Replaced by `DraggableTaskItem.tsx` |

---

### Technical Implementation

#### Step 1: Install Dependencies

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

---

#### Step 2: Create `useCrossWeekTaskMove` Hook

**File:** `src/hooks/useCrossWeekTaskMove.ts`

Extends the existing reorder logic to handle:
1. Within-week reordering (same as before)
2. Cross-week movement (new)

```typescript
interface MoveTaskParams {
  taskId: string;
  sourceWeekIndex: number;
  sourceTaskIndex: number;
  destinationWeekIndex: number;
  destinationTaskIndex: number;
}

interface UseCrossWeekTaskMoveReturn {
  moveTask: (params: MoveTaskParams) => Promise<MoveResult>;
  reorderWithinWeek: (weekIndex: number, reorderedTasks: Task[]) => Promise<void>;
  canMoveTask: (sourceWeekIndex: number, sourceTaskIndex: number) => { allowed: boolean; reason?: string };
  isMoving: boolean;
}
```

**Safety Check Implementation:**
```typescript
const canMoveTask = (sourceWeekIndex: number, sourceTaskIndex: number) => {
  const task = plan.weeks[sourceWeekIndex]?.tasks[sourceTaskIndex];
  
  // Check if task is currently being worked on
  if (task?.execution_state === 'doing') {
    return { allowed: false, reason: 'Complete or pause the task first' };
  }
  
  // Check if active timer is on this task
  if (activeTimer?.weekIndex === sourceWeekIndex && 
      activeTimer?.taskIndex === sourceTaskIndex) {
    return { allowed: false, reason: 'Stop the timer before moving' };
  }
  
  return { allowed: true };
};
```

---

#### Step 3: Create `DraggableWeekContainer` Component

**File:** `src/components/DraggableWeekContainer.tsx`

A droppable container for each week that accepts tasks from any week.

```typescript
interface DraggableWeekContainerProps {
  weekIndex: number;
  weekNumber: number;
  tasks: Task[];
  isActiveWeek: boolean;
  isLockedWeek: boolean;
  isWeekComplete: boolean;
  // ... other props
}
```

**Features:**
- Uses `useDroppable` from `@dnd-kit/core`
- Visual highlight when task is dragged over
- Different highlight color for cross-week vs same-week drag
- Accepts tasks even if week is "locked" (user override)

---

#### Step 4: Create `DraggableTaskItem` Component

**File:** `src/components/DraggableTaskItem.tsx`

Individual task with drag handle and sortable behavior.

```typescript
interface DraggableTaskItemProps {
  task: Task;
  taskId: string; // Unique ID for DnD: `week-${weekIndex}-task-${taskIndex}`
  weekIndex: number;
  taskIndex: number;
  canDrag: boolean;
  blockReason?: string;
  // ... TaskItem props
}
```

**Features:**
- Uses `useSortable` from `@dnd-kit/sortable`
- Shows drag handle (like current implementation)
- Disables drag if `canDrag === false` (active timer)
- Shows tooltip with `blockReason` if drag is blocked
- Haptic feedback on mobile

---

#### Step 5: Integrate DnD Context in Plan.tsx

**Location:** Wrap week cards in DnD providers

```tsx
import { DndContext, DragOverlay, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

// In Plan component:
<DndContext
  sensors={sensors}
  collisionDetection={closestCenter}
  onDragStart={handleDragStart}
  onDragOver={handleDragOver}
  onDragEnd={handleDragEnd}
>
  {plan.weeks.map((week, weekIndex) => (
    <DraggableWeekContainer 
      key={week.week}
      weekIndex={weekIndex}
      tasks={week.tasks}
      // ...
    >
      <SortableContext 
        items={week.tasks.map((t, i) => `week-${weekIndex}-task-${i}`)}
        strategy={verticalListSortingStrategy}
      >
        {week.tasks.map((task, taskIndex) => (
          <DraggableTaskItem
            key={`week-${weekIndex}-task-${taskIndex}`}
            taskId={`week-${weekIndex}-task-${taskIndex}`}
            task={task}
            canDrag={canMoveTask(weekIndex, taskIndex).allowed}
            blockReason={canMoveTask(weekIndex, taskIndex).reason}
            // ...
          />
        ))}
      </SortableContext>
    </DraggableWeekContainer>
  ))}
  
  <DragOverlay>
    {activeTaskDrag ? (
      <DraggableTaskItem 
        task={activeTaskDrag.task}
        isOverlay={true}
        // ...
      />
    ) : null}
  </DragOverlay>
</DndContext>
```

---

### Data Flow for Cross-Week Move

```
User drags task from Week 2 to Week 1
                    ↓
         onDragEnd fires with:
         - active: { id: "week-1-task-2" }
         - over: { id: "week-0-task-1" } or droppable ID
                    ↓
         Parse source/destination indices
                    ↓
         canMoveTask() check
         (if fails → show toast, abort)
                    ↓
         useCrossWeekTaskMove.moveTask()
                    ↓
    ┌───────────────┴───────────────┐
    ↓                               ↓
Remove task from source week    Add task to destination week
plan.weeks[1].tasks.splice()    plan.weeks[0].tasks.splice()
                    ↓
         Optimistic UI update (setPlan)
                    ↓
         Persist to Supabase
                    ↓
    ┌───────────────┴───────────────┐
    ↓                               ↓
Success: clear original ref     Error: rollback + toast
```

---

### Execution Safety Implementation

| Scenario | Check | Behavior |
|----------|-------|----------|
| Task has `execution_state: 'doing'` | `canMoveTask()` returns false | Drag handle disabled, tooltip shows reason |
| Task has active timer | `activeTimer.weekIndex/taskIndex` match | Same as above |
| Task is completed | No restriction | Allow movement (user can reschedule) |
| Moving to locked week | No restriction | User override - allow it |
| Moving from locked week | No restriction | User override - allow it |

**Visual Feedback for Blocked Tasks:**
```tsx
{!canDrag && (
  <Tooltip>
    <TooltipTrigger>
      <div className="opacity-30 cursor-not-allowed">
        <GripVertical />
      </div>
    </TooltipTrigger>
    <TooltipContent>{blockReason}</TooltipContent>
  </Tooltip>
)}
```

---

### UX Specifications

#### Desktop
| State | Behavior |
|-------|----------|
| Idle | Drag handle visible on hover |
| Dragging within week | Task lifts, siblings animate |
| Dragging to different week | Destination week highlights with accent border |
| Hover over blocked task | Tooltip shows "Complete or pause the task first" |
| Drop | Smooth animation to new position |

#### Mobile
| State | Behavior |
|-------|----------|
| Idle | Drag handle always visible |
| Long-press on handle | Haptic feedback, task lifts |
| Dragging | Other tasks animate, cross-week drop zones visible |
| Drop | Haptic confirmation |

#### Visual Cues for Cross-Week Drag
- Source week: subtle dim effect
- Destination week: glow/highlight border
- Dragged task: elevated shadow, slight scale
- Drop indicator: line showing insertion point

---

### /today Integrity Guarantee

The `/today` page uses `src/lib/todayTaskSelector.ts`:

```typescript
function getCurrentWeekIndex(plan: PlanData): number {
  for (let i = 0; i < plan.weeks.length; i++) {
    const hasIncompleteTasks = plan.weeks[i].tasks.some(t => !t.completed);
    if (hasIncompleteTasks) return i;
  }
  return plan.weeks.length - 1;
}
```

**Impact Analysis:**
- Moving a task TO the current week → it MAY appear in `/today` (if incomplete and within top 3 by priority)
- Moving a task FROM the current week → it will NOT appear in `/today`
- This is correct behavior - tasks show where they're scheduled

**No changes needed to `todayTaskSelector.ts`** - it already uses the task's week position as the source of truth.

---

### Persistence Strategy

**Data Structure (unchanged):**
```json
{
  "weeks": [
    {
      "week": 1,
      "focus": "Foundation",
      "tasks": [
        { "title": "Task A", "priority": "High", ... },
        { "title": "Task B", "priority": "Medium", ... }
      ]
    },
    {
      "week": 2,
      "focus": "Build",
      "tasks": [
        { "title": "Task C", "priority": "High", ... }
      ]
    }
  ]
}
```

**Move Operation:**
```typescript
const moveTask = async (params: MoveTaskParams) => {
  const { sourceWeekIndex, sourceTaskIndex, destinationWeekIndex, destinationTaskIndex } = params;
  
  // Clone plan
  const updatedPlan = JSON.parse(JSON.stringify(plan));
  
  // Remove from source
  const [movedTask] = updatedPlan.weeks[sourceWeekIndex].tasks.splice(sourceTaskIndex, 1);
  
  // Insert at destination
  updatedPlan.weeks[destinationWeekIndex].tasks.splice(destinationTaskIndex, 0, movedTask);
  
  // Optimistic update
  onPlanUpdate(updatedPlan);
  
  // Persist
  await supabase.from('plans').update({ plan_json: updatedPlan }).eq('user_id', userId);
};
```

---

### Guardrails (Strict)

| Constraint | Implementation |
|------------|----------------|
| No timer modification | Move preserves all task fields including `execution_started_at`, `time_spent_seconds` |
| No completion change | `completed`, `execution_state` untouched |
| No regeneration | Pure array manipulation only |
| No insights trigger | No side effects |
| Block active task move | `canMoveTask()` check before drag allowed |

---

### Implementation Order

1. Add `@dnd-kit` dependencies to `package.json`
2. Create `src/hooks/useCrossWeekTaskMove.ts`
3. Create `src/components/DraggableTaskItem.tsx`
4. Create `src/components/DraggableWeekContainer.tsx`
5. Modify `src/pages/Plan.tsx` to use DnD context and new components
6. Remove old `ReorderableTaskList.tsx` and `ReorderableTaskItem.tsx`
7. Test all scenarios

---

### Testing Checklist

**Cross-Week Movement:**
- [ ] Drag task from Week 1 to Week 2 → appears in Week 2
- [ ] Drag task from locked Week 3 to active Week 1 → works
- [ ] Drag task from active week to locked week → works
- [ ] Order within destination week respects drop position

**Safety Checks:**
- [ ] Task with active timer → cannot drag, shows tooltip
- [ ] Task with `execution_state: 'doing'` → cannot drag
- [ ] Completed task → can drag freely

**Persistence:**
- [ ] Move task → refresh page → task in new week
- [ ] Move task → navigate away → return → task in new week

**/today Integrity:**
- [ ] Move task to current week → appears in /today if eligible
- [ ] Move task from current week → disappears from /today
- [ ] No duplicate tasks
- [ ] No missing tasks

**UX Quality:**
- [ ] Desktop: smooth drag animations
- [ ] Desktop: week highlight on hover
- [ ] Mobile: long-press to drag
- [ ] Mobile: haptic feedback
- [ ] Blocked task shows tooltip reason

---

### Summary

This implementation enables cross-week task movement using `@dnd-kit`, which is purpose-built for multi-container drag-and-drop scenarios. The feature:

- Adds one new dependency (`@dnd-kit`)
- Supports both within-week reordering AND cross-week movement
- Blocks movement of actively running tasks
- Persists changes to existing `plan_json` structure
- Maintains `/today` integrity automatically
- Works on both desktop and mobile with appropriate UX patterns

Users will feel: **"I can reshuffle reality when things change."**




## Phase 9.2.1 — Manual Task Division (Split Event)

### Overview

Add a "Split Task" action to each task on `/plan` that allows users to divide an existing task into two smaller tasks while preserving execution integrity.

**Current State:**
- `SplitTaskModal` component already exists with full UI (slider for time allocation, title inputs)
- `useTaskMutations` hook has `splitTask` and `canSplitTask` functions implemented
- `splitTaskData` state exists in Plan.tsx but is never triggered
- Task splitting logic prevents split on completed/in-progress tasks

**What's Missing:**
- No trigger/action button on tasks to open the split modal
- Need to wire up `setSplitTaskData` when user clicks "Split Task"

---

### Implementation Approach

**Strategy: Add inline action to DraggableTaskItem**

Rather than modifying TaskItem (which is complex and used elsewhere), add the split action at the `DraggableTaskItem` level in Plan.tsx where we have full context (weekIndex, taskIndex, canSplit logic).

---

### Files to Modify

| File | Change |
|------|--------|
| `src/components/DraggableTaskItem.tsx` | Add `onSplit` prop and subtle split button |
| `src/pages/Plan.tsx` | Pass `onSplit` handler to DraggableTaskItem |

---

### Technical Details

#### 1. Update DraggableTaskItem Props

Add a new optional `onSplit` prop:

```typescript
interface DraggableTaskItemProps {
  // ... existing props
  onSplit?: () => void;      // Callback to trigger split
  canSplit?: boolean;        // Whether split is allowed
  splitBlockReason?: string; // Reason if split is blocked
}
```

#### 2. Add Split Action UI to DraggableTaskItem

Add a subtle split button that appears:
- Desktop: On hover (using existing `group` class)
- Mobile: As a small inline icon button

Location: After the task title area, before the drag handle section

```tsx
{/* Split Task Action */}
{onSplit && (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (canSplit) onSplit();
          }}
          disabled={!canSplit}
          className={cn(
            "p-1.5 rounded-md transition-all",
            // Desktop: show on hover
            !isMobile && "opacity-0 group-hover:opacity-100",
            // Mobile: always visible but subtle
            isMobile && "opacity-60",
            canSplit 
              ? "hover:bg-primary/10 text-muted-foreground hover:text-primary"
              : "cursor-not-allowed opacity-30"
          )}
        >
          <Scissors className="w-3.5 h-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">
        <p className="text-sm">{canSplit ? 'Split task' : splitBlockReason}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
)}
```

#### 3. Wire Up in Plan.tsx

In the task mapping loop (around line 1210), pass the split handler:

```tsx
<DraggableTaskItem
  key={taskId}
  task={task as Task}
  // ... existing props
  onSplit={() => {
    if (!canSplitTasks) {
      trackSplitInterest('attempted');
      toast({
        title: 'Pro Feature',
        description: 'Split Tasks is available with Strategic Planning.',
      });
      return;
    }
    setSplitTaskData({
      weekIndex,
      taskIndex,
      task: task as Task,
    });
  }}
  canSplit={canSplitTask(weekIndex, taskIndex).allowed}
  splitBlockReason={canSplitTask(weekIndex, taskIndex).reason}
/>
```

---

### Restriction Enforcement

The existing `canSplitTask` function in `useTaskMutations.ts` already enforces:

| Restriction | Status |
|-------------|--------|
| Completed tasks cannot be split | Checked (execution_state === 'done' or completed) |
| In-progress tasks cannot be split | Checked (execution_state === 'doing') |
| Tasks with active timer cannot be split | Checked (activeTimer match) |
| Locked week tasks cannot be split | Needs to be added |

**Addition needed:** Add locked week check to `canSplitTask`:

```typescript
// Cannot split tasks in locked weeks
const isLocked = isWeekLocked(plan, weekIndex);
if (isLocked) {
  return { allowed: false, reason: 'Cannot split tasks in locked weeks' };
}
```

---

### Execution Safety

| Safety Check | Implementation |
|--------------|----------------|
| No auto-start timers | Split creates tasks with `execution_state: 'pending'` |
| /today logic remains correct | Split tasks inherit same week, appear in /today if active week |
| No AI regeneration | Pure array manipulation in plan_json |
| Order preserved | `splice()` inserts at original position |

---

### Pro Gating

Already configured in `productTiers.ts`:
- `task-split` feature is pro-gated
- Check happens in Plan.tsx before calling `setSplitTaskData`
- Free users see toast upsell

---

### UI/UX Summary

**Desktop:**
- Scissors icon appears on task hover (right side, near drag handle)
- Tooltip shows "Split task" or block reason
- Click opens SplitTaskModal

**Mobile:**
- Scissors icon always visible (subtle opacity)
- Tap opens SplitTaskModal
- Same restrictions apply

**Modal (already implemented):**
- Shows original task details
- Slider for time allocation (10-90%)
- Two title inputs with defaults "(Part 1)" / "(Part 2)"
- Both new tasks inherit original priority
- Both start as pending

---

### Implementation Order

1. Update `useTaskMutations.ts` - Add locked week check to `canSplitTask`
2. Update `DraggableTaskItem.tsx` - Add `onSplit` prop and split button UI
3. Update `Plan.tsx` - Wire up `onSplit` handler in task loop

---

### Testing Checklist

**Visibility:**
- [ ] Split icon visible on task hover (desktop)
- [ ] Split icon visible on tasks (mobile, subtle)
- [ ] Icon hidden/disabled for blocked tasks

**Restrictions:**
- [ ] Cannot split completed tasks (shows reason in tooltip)
- [ ] Cannot split in-progress tasks
- [ ] Cannot split tasks in locked weeks
- [ ] Cannot split if timer is active on task

**Functionality:**
- [ ] Clicking split opens modal with correct task data
- [ ] Slider adjusts time allocation
- [ ] Title inputs work
- [ ] Submit creates two new tasks
- [ ] Original task is removed
- [ ] New tasks appear in same position
- [ ] New tasks have pending state
- [ ] New tasks inherit priority

**Pro Gating:**
- [ ] Free users see upsell toast
- [ ] Pro users can split freely

**Guardrails:**
- [ ] No timer auto-start after split
- [ ] /today still works correctly
- [ ] No AI regeneration triggered
- [ ] Plan persists correctly to database

---

### Summary

This implementation:

1. **Adds split action to each task** via subtle icon button
2. **Uses existing SplitTaskModal** - no new UI needed
3. **Enforces all restrictions** - completed, in-progress, locked weeks blocked
4. **Preserves execution safety** - no timer impact, no AI changes
5. **Respects Pro gating** - free users see calm upsell

The change is minimal and focused: just wiring up the existing infrastructure that was already built.




## Phase 9.6 — Adaptive Execution Control (Reality-First Execution)

### Overview

Add execution-time flexibility features that allow users to defer tasks, track partial progress, and add optional notes — all without breaking plan integrity or triggering AI regeneration.

**Core Principle:** "This plan adapts when my day doesn't go as expected — without judging me."

---

### Current Task Structure

The existing task object in `plan_json`:

```typescript
interface Task {
  title: string;
  priority: 'High' | 'Medium' | 'Low';
  estimated_hours: number;
  completed?: boolean;
  completed_at?: string;
  scheduled_at?: string;
  execution_state?: 'pending' | 'doing' | 'done';
  execution_started_at?: string;
  time_spent_seconds?: number;
  explanation?: { how: string; why: string; expected_outcome: string };
}
```

---

### New Task Fields (Additive, Backward-Compatible)

```typescript
interface Task {
  // ... existing fields

  // Phase 9.6: Adaptive Execution
  deferred_to?: string;           // ISO datetime of new scheduled time
  deferred_from?: string;         // Original scheduled time before defer
  deferred_reason?: string;       // Optional preset reason
  deferred_count?: number;        // How many times deferred (quiet tracking)
  
  partial_progress?: 'some' | 'most' | 'almost';  // Qualitative state
  partial_time_seconds?: number;  // Time spent before partial marking
  
  execution_notes?: string;       // Optional short notes (visible in /review only)
  notes_added_at?: string;        // When note was added
}
```

All new fields are optional and won't affect existing task data.

---

### Feature 1: Task Defer / Reschedule

**Where:** `/today` page (primary interactions)

**UI Flow:**
1. Add "Defer" action to task cards (both `TodayTaskCard` and `PrimaryTaskCard`)
2. On tap, show a bottom sheet/dropdown with preset options:
   - "Later today" (reschedules +3 hours or to evening slot)
   - "Tomorrow" (reschedules to next day, 9 AM)
   - "Next available day" (finds next unscheduled day)
3. Optional: One-tap preset reasons (no typing required):
   - "Interrupted"
   - "No energy"
   - "Higher priority came up"
   - "Need more info"
   - (Skip reason) — default, no selection needed

**Implementation:**

| File | Change |
|------|--------|
| `src/lib/taskDefer.ts` | NEW: Defer logic (calculate new times, update calendar) |
| `src/hooks/useTaskDefer.ts` | NEW: Hook for defer operations with persistence |
| `src/components/TaskDeferSheet.tsx` | NEW: Bottom sheet UI for defer options |
| `src/components/TodayTaskCard.tsx` | Add defer button/action |
| `src/components/PrimaryTaskCard.tsx` | Add defer button/action |
| `src/components/SecondaryTaskCard.tsx` | Add defer button/action |
| `src/pages/Today.tsx` | Wire defer handlers and state |

**Defer Logic:**

```typescript
// taskDefer.ts
interface DeferOption {
  id: 'later-today' | 'tomorrow' | 'next-available';
  label: string;
  calculateNewTime: (currentScheduledAt: string) => Date;
}

const DEFER_OPTIONS: DeferOption[] = [
  {
    id: 'later-today',
    label: 'Later today',
    calculateNewTime: (current) => {
      const now = new Date();
      const later = new Date(now.getTime() + 3 * 60 * 60 * 1000); // +3 hours
      // Cap at 8 PM if too late
      if (later.getHours() >= 20) {
        later.setHours(20, 0, 0, 0);
      }
      return later;
    },
  },
  {
    id: 'tomorrow',
    label: 'Tomorrow',
    calculateNewTime: () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      return tomorrow;
    },
  },
  {
    id: 'next-available',
    label: 'Next available day',
    calculateNewTime: (current, scheduledTasks) => {
      // Find next day without scheduled tasks
      // Implementation finds gap in calendar
    },
  },
];

const DEFER_REASONS = [
  'Interrupted',
  'No energy',
  'Higher priority',
  'Need more info',
];
```

**Persistence:**
- Update `plan_json` immediately with new `deferred_to`, `deferred_from`, `deferred_reason`
- Update calendar status via `useCalendarStatus` to reflect new scheduled time
- Increment `deferred_count` silently (for future pattern analysis)

**Guardrails:**
- Defer does NOT mark task as done or failed
- Defer preserves all original task data
- Deferred tasks remain visible in `/today` if rescheduled to today
- No AI regeneration triggered

---

### Feature 2: Partial Completion Support

**Where:** `/today` page (during or after execution)

**UI Flow:**
1. When user pauses a task (or when actively working), show "Mark partial progress" option
2. Partial progress modal/sheet offers qualitative states:
   - "Some progress" — started but early
   - "Most done" — significant progress
   - "Almost there" — nearly complete
3. Captures time spent so far
4. Task remains in `pending` state (not `done`)
5. Visual indicator shows partial progress on task card

**Implementation:**

| File | Change |
|------|--------|
| `src/components/PartialProgressSheet.tsx` | NEW: UI for marking partial progress |
| `src/hooks/usePartialProgress.ts` | NEW: Hook for partial progress management |
| `src/components/TodayTaskCard.tsx` | Add partial progress indicator and action |
| `src/components/PrimaryTaskCard.tsx` | Add partial progress indicator and action |
| `src/pages/Today.tsx` | Wire partial progress handlers |

**UI Design:**

```text
┌─────────────────────────────────────────┐
│ How much did you get done?              │
│                                         │
│ ○ Some progress   (just getting started)│
│ ○ Most done       (good chunk complete) │
│ ○ Almost there    (minor work left)     │
│                                         │
│ Time logged: 45 min                     │
│                                         │
│ [Save Progress]  [Continue Working]     │
└─────────────────────────────────────────┘
```

**Task Card Indicator:**

```typescript
// Show partial progress badge on task card
{task.partial_progress && (
  <Badge variant="outline" className="text-xs">
    {task.partial_progress === 'some' && '🔵 Started'}
    {task.partial_progress === 'most' && '🟡 Most done'}
    {task.partial_progress === 'almost' && '🟢 Almost there'}
  </Badge>
)}
```

**Guardrails:**
- Partial completion does NOT trigger plan completion
- Task remains actionable (can still be started/resumed)
- Partial progress is reversible until task is fully completed
- No execution scoring based on partial progress

---

### Feature 3: Task Execution Notes

**Where:** 
- Entry: `/today` (via task details panel, NOT during active execution)
- Display: `/review` only

**UI Flow:**
1. In task details panel (desktop) or after pausing/completing (mobile), show "Add note" option
2. Simple text input (max 200 characters) — optional
3. Notes are saved with task
4. Notes are visible ONLY in `/review` page's Progress Proof or Execution Insights sections

**Implementation:**

| File | Change |
|------|--------|
| `src/components/TaskNoteInput.tsx` | NEW: Simple note input component |
| `src/components/TodayTaskDetailsPanel.tsx` | Add note input (post-execution only) |
| `src/components/TaskEffortFeedback.tsx` | Optionally add note prompt after effort feedback |
| `src/pages/Review.tsx` | Display notes in relevant sections |
| `src/components/ProgressProof.tsx` | Show notes alongside completed tasks |

**Note Input:**

```typescript
// Simple, non-intrusive note input
<div className="mt-4 pt-4 border-t border-border/20">
  <p className="text-xs text-muted-foreground mb-2">Optional note</p>
  <Textarea
    placeholder="What happened? (optional)"
    value={note}
    onChange={(e) => setNote(e.target.value)}
    maxLength={200}
    className="resize-none h-16 text-sm"
  />
  <Button 
    size="sm" 
    variant="ghost" 
    onClick={handleSaveNote}
    className="mt-2"
  >
    Save note
  </Button>
</div>
```

**Guardrails:**
- Notes do NOT appear during active execution (no distraction)
- Notes are never required
- Notes are visible only in `/review` (reflection context)
- Notes do not affect execution or planning logic

---

### Architecture Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                      /today page                             │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ PrimaryTask │  │ SecondaryTa │  │ TodayTaskDetailsPanel│ │
│  │   Card      │  │   skCard    │  │                     │ │
│  │             │  │             │  │  [Add Note]         │ │
│  │ [Start]     │  │ [Start]     │  │  (post-execution)   │ │
│  │ [Defer ▼]   │  │ [Defer ▼]   │  │                     │ │
│  │             │  │             │  └─────────────────────┘ │
│  │ 🟡 Most done│  │             │                          │
│  └─────────────┘  └─────────────┘                          │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ TaskDeferSheet (bottom sheet)                         │  │
│  │  ○ Later today  ○ Tomorrow  ○ Next available         │  │
│  │  Optional reason: [Interrupted] [No energy] ...      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ PartialProgressSheet                                  │  │
│  │  ○ Some ○ Most ○ Almost   Time: 45m  [Save]          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

                            │
                            ▼
                      
┌─────────────────────────────────────────────────────────────┐
│                      /review page                            │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Progress Proof                                        │  │
│  │  ✓ Task 1                                            │  │
│  │    Note: "Had to restart after interruption"         │  │
│  │  ✓ Task 2 (deferred once)                            │  │
│  │  ◐ Task 3 (most done)                                │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

### Files to Create

| File | Purpose |
|------|---------|
| `src/lib/taskDefer.ts` | Defer time calculation and options |
| `src/hooks/useTaskDefer.ts` | Hook for defer operations |
| `src/components/TaskDeferSheet.tsx` | Bottom sheet for defer options |
| `src/components/PartialProgressSheet.tsx` | Sheet for partial progress selection |
| `src/hooks/usePartialProgress.ts` | Hook for partial progress management |
| `src/components/TaskNoteInput.tsx` | Simple note input component |

### Files to Modify

| File | Change |
|------|--------|
| `src/components/TodayTaskCard.tsx` | Add defer button, partial indicator |
| `src/components/PrimaryTaskCard.tsx` | Add defer button, partial indicator |
| `src/components/SecondaryTaskCard.tsx` | Add defer button |
| `src/components/TodayTaskDetailsPanel.tsx` | Add note input (post-execution) |
| `src/pages/Today.tsx` | Wire defer and partial handlers |
| `src/components/ProgressProof.tsx` | Display notes, partial, defer info |
| `src/lib/executionTimer.ts` | Add partial progress support |

---

### Tier Gating

These are **free tier** features — available to all users:

| Feature | Tier |
|---------|------|
| Task Defer | Free |
| Partial Progress | Free |
| Execution Notes | Free |

No Pro gating needed. These are execution fundamentals.

---

### Data Integrity Guarantees

| Concern | Mitigation |
|---------|------------|
| Existing timers unaffected | New fields are additive; timer logic unchanged |
| Completion logic unchanged | `done` state only set by explicit completion |
| Insights remain accurate | New fields are informational, not used in calculations (yet) |
| Plan structure preserved | No task reordering, no week modifications |
| Calendar sync works | `deferred_to` updates calendar status automatically |
| Backward compatible | All new fields optional with sensible defaults |

---

### Guardrails (Non-Negotiable)

| Rule | Implementation |
|------|----------------|
| No AI suggestions | No AI calls triggered by defer/partial/notes |
| No plan regeneration | Pure field updates in plan_json |
| No strategy updates | Strategy layer untouched |
| No automatic task movement | User explicitly chooses defer target |
| No execution scoring | Partial progress is qualitative only |
| No notifications | No push/banner for deferred tasks |

---

### Implementation Order

1. **Core defer logic** — `taskDefer.ts` with time calculations
2. **Defer hook** — `useTaskDefer.ts` with persistence
3. **Defer UI** — `TaskDeferSheet.tsx` bottom sheet
4. **Wire defer to task cards** — TodayTaskCard, PrimaryTaskCard, SecondaryTaskCard
5. **Partial progress hook** — `usePartialProgress.ts`
6. **Partial progress UI** — `PartialProgressSheet.tsx`
7. **Wire partial progress** — Today.tsx and task cards
8. **Task note input** — `TaskNoteInput.tsx`
9. **Wire notes** — TodayTaskDetailsPanel, TaskEffortFeedback
10. **Display in Review** — ProgressProof.tsx updates

---

### Testing Checklist

**Defer:**
- [ ] Can defer pending task to later today
- [ ] Can defer pending task to tomorrow
- [ ] Can defer active task (pauses timer, then defers)
- [ ] Deferred task appears at new scheduled time
- [ ] Original scheduled time preserved in deferred_from
- [ ] Optional reason is saved
- [ ] Calendar status updates correctly
- [ ] Deferred task can still be completed normally

**Partial Progress:**
- [ ] Can mark partial progress on paused task
- [ ] Partial progress indicator shows on task card
- [ ] Time spent is preserved
- [ ] Task remains actionable (can resume)
- [ ] Partial task is NOT counted as complete
- [ ] Plan completion does NOT trigger with partial tasks
- [ ] Can upgrade partial to full completion

**Notes:**
- [ ] Can add note after task completion
- [ ] Can add note after pausing task
- [ ] Note does NOT appear during active execution
- [ ] Note visible in /review only
- [ ] Note is optional (can skip)
- [ ] Max 200 characters enforced

**Guardrails:**
- [ ] No AI regeneration triggered
- [ ] No plan structure changes
- [ ] No strategy updates
- [ ] Timer logic unaffected
- [ ] Existing completion flow unchanged
- [ ] Mobile and desktop both work

---

### Summary

This implementation adds three execution-time flexibility features:

1. **Task Defer** — Reschedule with one tap, optional reason
2. **Partial Progress** — Acknowledge progress without completing
3. **Execution Notes** — Optional context for reflection

All features are:
- Free tier (no Pro gating)
- Additive (no breaking changes)
- Non-judgmental (no scoring or pressure)
- Reflection-focused (notes visible only in /review)
- User-controlled (explicit actions only)

**Product Intent:** Users feel their plan adapts to reality without making them feel they've failed.



## Phase 9.7 — Execution Closure & Confidence (End-of-Day Calm)

### Overview

Provide users with a psychologically complete way to end their day with clarity and confidence. This phase focuses on emotional closure and honest reflection — not productivity metrics, streaks, or scoring.

**Core Principle:** "I can close my day honestly and move on without mental residue."

---

### Current State Analysis

**Existing Components:**
- `DayClosureModal`: Already exists but triggers automatically when all tasks are completed
- `TodayReflectionStrip`: Daily reflection prompts (signal-adaptive)
- `TaskEffortFeedback`: Post-completion effort tracking (easy/okay/hard)
- Day closure stores basic data to localStorage (`kaamyab_day_closure`)

**Gaps to Address:**
1. No user-initiated "Close Day" action — modal only triggers on 100% completion
2. No end-of-day summary with deferrals and partial progress
3. No day_closed state in plan_json
4. Reflections stored only locally, not surfaced in `/review`
5. No carry-forward logic for deferred tasks

---

### New Data Fields (Additive)

```typescript
// In plan_json
interface PlanData {
  // ... existing fields
  
  // Phase 9.7: Day Closure
  day_closures?: DayClosure[];
}

interface DayClosure {
  date: string;                    // ISO date (YYYY-MM-DD)
  closed_at: string;               // ISO timestamp
  summary: {
    completed: number;
    partial: number;
    deferred: number;
    total_time_seconds: number;
  };
  reflection?: string;             // Optional user reflection (max 200 chars)
  reflection_prompt?: string;      // Which prompt was shown
}
```

All fields are optional and backward-compatible.

---

### Feature 1: End-of-Day Summary (Read-Only)

**Display a factual summary of the day's execution state:**

| Metric | Source | Display |
|--------|--------|---------|
| Tasks completed | Tasks with `execution_state: 'done'` scheduled today | "3 completed" |
| Tasks partially progressed | Tasks with `partial_progress` field set | "1 in progress" |
| Tasks deferred | Tasks with `deferred_to` set to future | "1 moved" |
| Total time | Sum of `time_spent_seconds` for today's tasks | "2h 15m focused" |

**Language Guidelines:**
- Neutral, factual ("3 done, 1 moved")
- No percentages or scores
- No success/failure framing
- No comparisons to previous days

---

### Feature 2: "Close Day" Action (User-Initiated)

**Where:** `/today` page — visible only when there are uncompleted tasks or when day hasn't been closed

**Button Placement:**
- Desktop: In the context panel (right column) or floating bottom
- Mobile: Fixed button at bottom, above the nav

**Close Day Flow:**
1. User taps "Close Day" button
2. Enhanced `DayClosureModal` opens with:
   - Summary of today's execution (completed, partial, deferred)
   - Effort acknowledgement (based on time + effort data)
   - Optional single reflection prompt
   - Skip / Done buttons
3. On confirmation:
   - Mark day as closed in `plan_json.day_closures[]`
   - Carry forward deferred tasks gracefully (no auto-reschedule, just preserve state)
   - Store reflection if provided
4. Modal closes, user can continue using app normally

**Guardrails:**
- Close Day is never required
- User can still interact with tasks after closing
- Closing day doesn't lock anything
- Day can be "closed" multiple times (latest wins)

---

### Feature 3: Effort Acknowledgement (Non-Comparative)

**Show a brief, calm acknowledgement based on execution data:**

| Condition | Acknowledgement |
|-----------|-----------------|
| High total time (>3h) | "A solid day of focused work." |
| Some tasks deferred | "You adjusted as needed — that's realistic planning." |
| All tasks completed | "Everything on your list, done." |
| Partial progress | "Progress made — completion isn't always the goal." |
| Light day (<1h) | "Sometimes lighter days are what you need." |
| No completions | "Some days are about preparation, not completion." |

**Rules:**
- Never use comparisons ("better than yesterday")
- No motivation clichés ("You crushed it!")
- No praise inflation
- Purely observational and respectful

---

### Feature 4: Optional Reflection Prompt (Single Step)

**Show one reflection prompt after acknowledgement:**

```typescript
const closureReflectionPrompts = [
  "Anything that made today harder than expected?",
  "What helped you stay focused today?",
  "What would you do differently tomorrow?",
  "Any surprise wins worth noting?",
  "What's one thing you learned today?",
];
```

**UX:**
- Text input (max 200 characters)
- Skippable with single tap
- Stored in `day_closures[].reflection`
- Visible only in `/review` page

---

### Feature 5: Display Day Closures in /review

**Add a "Daily Reflections" section to the Review page:**

| Date | Completed | Notes |
|------|-----------|-------|
| Feb 2 | 3 done, 1 moved | "Meeting ran long, pushed design work" |
| Feb 1 | 2 done | — |
| Jan 31 | 4 done | "Finally cracked the API issue" |

**Display Rules:**
- Show last 7 days max
- Only days with closures
- Reflections visible but subtle
- Collapsible section
- No scoring or trends

---

### Architecture Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                      /today page                             │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Task Cards (existing)                                │   │
│  │  - Completed tasks                                   │   │
│  │  - Partial progress tasks                            │   │
│  │  - Deferred tasks                                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [Close Day] button (new)                             │   │
│  │  Visible when: tasks exist and day not yet closed    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ DayClosureModal (enhanced)                           │   │
│  │  - Summary: 3 done, 1 in progress, 1 moved          │   │
│  │  - Time: 2h 15m focused                              │   │
│  │  - Acknowledgement: "A solid day of focused work."   │   │
│  │  - Prompt: "What helped you stay focused today?"     │   │
│  │  - [Skip] [Done]                                     │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

                            │
                            ▼
                      
┌─────────────────────────────────────────────────────────────┐
│                      /review page                            │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Daily Reflections (new section)                      │   │
│  │  Feb 2: 3 done, 1 moved                              │   │
│  │         "Meeting ran long, pushed design work"       │   │
│  │  Feb 1: 2 done                                       │   │
│  │  Jan 31: 4 done                                      │   │
│  │         "Finally cracked the API issue"              │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

### Files to Create

| File | Purpose |
|------|---------|
| `src/lib/dayClosure.ts` | Day closure logic, summary calculations, acknowledgement generation |
| `src/hooks/useDayClosure.ts` | Hook for managing day closure state and persistence |
| `src/components/CloseDayButton.tsx` | User-initiated close day button |
| `src/components/DailyReflectionsSection.tsx` | Review page section for day closures |

### Files to Modify

| File | Change |
|------|--------|
| `src/components/DayClosureModal.tsx` | Enhance with summary, acknowledgement, and single reflection |
| `src/pages/Today.tsx` | Add Close Day button, wire useDayClosure hook |
| `src/pages/Review.tsx` | Add DailyReflectionsSection |

---

### Implementation Order

1. **Day closure logic** — `dayClosure.ts` with summary calculation and acknowledgement generation
2. **Day closure hook** — `useDayClosure.ts` for state management and persistence
3. **Close Day button** — `CloseDayButton.tsx` with proper placement
4. **Enhanced modal** — Update `DayClosureModal.tsx` with new summary/acknowledgement UI
5. **Wire to Today** — Integrate button and hook in `Today.tsx`
6. **Review section** — `DailyReflectionsSection.tsx` for displaying closure history
7. **Wire to Review** — Add section to `Review.tsx`
8. **Memory file** — Document in `.lovable/memory/features/execution-closure-confidence.md`

---

### Guardrails (Non-Negotiable)

| Rule | Implementation |
|------|----------------|
| No streaks or scores | No percentage calculations, no streak displays in closure |
| No comparisons | Never reference "yesterday" or "previous" |
| No AI suggestions | Pure observation, no coaching or advice |
| No notifications | Never push users to close day |
| No monetization | Free tier feature |
| No execution impact | Closing day doesn't lock or modify tasks |

---

### Tier Gating

**All features are Free tier:**

| Feature | Tier |
|---------|------|
| Close Day action | Free |
| End-of-day summary | Free |
| Effort acknowledgement | Free |
| Reflection prompt | Free |
| Review page display | Free |

---

### Data Integrity Guarantees

| Concern | Mitigation |
|---------|------------|
| Timers unaffected | Close Day doesn't stop or reset timers |
| Completion logic unchanged | Day closure is additive metadata only |
| Deferred tasks preserved | No auto-reschedule on close |
| Backward compatible | `day_closures` array is optional |
| No plan mutations | Only appends to `day_closures`, never modifies tasks |

---

### Testing Checklist

**Close Day Flow:**
- [ ] Close Day button visible when tasks exist
- [ ] Button hidden after day is closed (or shows "Day closed ✓")
- [ ] Modal shows correct summary (completed, partial, deferred)
- [ ] Acknowledgement text is factual and non-comparative
- [ ] Reflection prompt is skippable
- [ ] Reflection saves to plan_json.day_closures
- [ ] User can still interact with tasks after closing

**Summary Accuracy:**
- [ ] Completed count matches tasks with execution_state: done
- [ ] Deferred count matches tasks with deferred_to in future
- [ ] Total time sums time_spent_seconds correctly
- [ ] Partial count matches tasks with partial_progress set

**Review Page:**
- [ ] Daily Reflections section appears if closures exist
- [ ] Shows last 7 days only
- [ ] Displays reflection text when available
- [ ] Collapsible and non-intrusive

**Guardrails:**
- [ ] No percentages shown
- [ ] No comparisons to other days
- [ ] No streaks mentioned in closure flow
- [ ] No "you should" language
- [ ] Mobile and desktop both work

---

### Summary

Phase 9.7 adds psychological closure to the execution flow:

1. **End-of-Day Summary** — Factual display of completed, partial, and deferred tasks
2. **Close Day Action** — User-initiated, never required
3. **Effort Acknowledgement** — Respectful, non-comparative observation
4. **Optional Reflection** — Single prompt, stored for review
5. **Review Display** — Daily reflections visible in /review

**Product Intent:** Users can honestly close their day and move on without guilt or mental residue.

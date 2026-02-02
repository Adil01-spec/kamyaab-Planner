

## Phase 9.8 — Retention Without Addiction (Calm Re-Entry)

### Overview

Enable users to return to the app after time away without anxiety, guilt, or pressure. The re-entry experience will be calm, respectful, and show that the app respects the user's pace.

**Core Principle:** "I can come back on my own terms — this app respects my pace."

---

### Current State Analysis

**Existing Components:**
- `DailyNudgeBanner`: Shows once per day if tasks exist but nothing started
- `MissedTaskNotice`: Shows when tasks were rolled forward (5-second auto-dismiss)
- `ResumeFocusCTA`: Shows when timer was left running
- `streakTracker.ts`: Stores `lastCompletionDate` in localStorage
- `dailyContextEngine.ts`: Detects `skippedDaysInRow` and burnout-risk signals

**Gaps to Address:**
1. No calm welcome-back message for returning users
2. No explicit "last progress" date display
3. No clear resume vs review action options
4. MissedTaskNotice focuses on "moved tasks" rather than gentle re-entry

---

### New Data Helpers (Additive)

```typescript
// src/lib/reEntryContext.ts
interface ReEntryContext {
  daysAway: number;             // 0 = active today, 1+ = days since last activity
  lastProgressDate: string | null;  // ISO date of last completion
  planIntact: boolean;          // Always true (context preservation)
  showReEntryBanner: boolean;   // True if daysAway >= 2
}
```

**Data Sources (no new storage):**
- `lastCompletionDate` from streakTracker localStorage
- `completed_at` timestamps from task data
- Falls back to latest day_closure date if available

---

### Feature 1: Gentle Re-Entry Banner

**Trigger Conditions:**
- User has been away 2+ days (no completions)
- User has a plan with pending tasks
- Not dismissed today

**Visual Design:**
- Calm, muted styling (similar to MissedTaskNotice but softer)
- No urgency colors (no red, orange, or bright accents)
- Icon: Subtle hand wave or plant/growth icon

**Copy Examples (neutral, reassuring):**
- "Welcome back. Let's continue when you're ready."
- "Your plan is still here — nothing broke."
- "No rush. Pick up where you left off."

**Dismissal:**
- One-tap dismiss, stored per-session
- Auto-dismiss after 10 seconds of viewing
- Never blocks interaction

---

### Feature 2: Context Preservation (Already Implemented)

Verify existing behavior:
- Plans remain exactly as left
- Deferred tasks stay visible with original dates
- No auto-fixes or corrections applied
- Timer state persisted (ResumeFocusCTA handles this)

This is already the default behavior — Phase 9.8 just confirms and documents it.

---

### Feature 3: Optional Resume Actions

**Where:** Below the re-entry banner (when shown)

**Two Actions (neither pre-selected):**

| Action | Label | Destination |
|--------|-------|-------------|
| Primary | "Resume today" | Navigate to /today |
| Secondary | "Review plan first" | Navigate to /plan |

**UX Rules:**
- User must explicitly tap one
- No default selection
- Both buttons same visual weight (outline style)
- Tapping banner area does nothing (not a CTA itself)

---

### Feature 4: Soft Visibility of Past Effort

**Where:** In the re-entry banner, as subtle secondary text

**Display:**
- "You last made progress on [Month Day]."
- Example: "You last made progress on January 28."

**Rules:**
- Only shown if `lastProgressDate` exists
- No "X days ago" counting (avoids guilt)
- Factual, not accusatory
- If no previous progress, omit this line entirely

---

### Architecture Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                      /home page                              │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ ReEntryBanner (NEW - only if daysAway >= 2)             ││
│  │  "Welcome back. Your plan is still here."               ││
│  │  "You last made progress on January 28."                ││
│  │                                                         ││
│  │  [ Resume today ]   [ Review plan first ]               ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ ResumeFocusCTA (existing - if timer left running)       ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ MotivationalQuoteCard (existing)                        ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ HomeFocusCard (existing)                                ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      /today page                             │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ ReEntryBanner (same component, conditional)             ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ... existing Today content ...                             │
└─────────────────────────────────────────────────────────────┘
```

---

### Files to Create

| File | Purpose |
|------|---------|
| `src/lib/reEntryContext.ts` | Calculate days away and last progress date from existing data |
| `src/components/ReEntryBanner.tsx` | Calm welcome-back banner with optional resume actions |
| `src/hooks/useReEntryContext.ts` | Hook to consume re-entry context in pages |

### Files to Modify

| File | Change |
|------|--------|
| `src/pages/Home.tsx` | Add ReEntryBanner above MotivationalQuoteCard |
| `src/pages/Today.tsx` | Add ReEntryBanner at top (conditional) |

### Files to Create (Documentation)

| File | Purpose |
|------|---------|
| `.lovable/memory/features/calm-re-entry.md` | Phase 9.8 feature documentation |

---

### Implementation Order

1. **Re-entry logic** — `reEntryContext.ts` to calculate days away and last progress
2. **Re-entry hook** — `useReEntryContext.ts` for consuming in pages
3. **Re-entry banner** — `ReEntryBanner.tsx` with calm messaging and actions
4. **Wire to Home** — Add banner to `Home.tsx` (above motivational quote)
5. **Wire to Today** — Add banner to `Today.tsx` (top of page)
6. **Memory file** — Document in `.lovable/memory/features/calm-re-entry.md`
7. **Update plan.md** — Mark Phase 9.8 as implemented

---

### Component Specification: ReEntryBanner

```typescript
interface ReEntryBannerProps {
  daysAway: number;
  lastProgressDate: string | null;
  onDismiss: () => void;
  showActions?: boolean;  // true on /home, false on /today
  className?: string;
}
```

**Visual Styling:**
- Background: `bg-muted/30` (subtle, not attention-grabbing)
- Border: `border-border/20` (barely visible)
- Icon: Leaf/growth icon (`Leaf` from lucide-react)
- Text: `text-foreground/80` for headline, `text-muted-foreground` for subtext
- Buttons: Both `variant="outline"`, same size

---

### Message Variations

Based on context:

| Condition | Message |
|-----------|---------|
| 2-3 days away | "Welcome back. Let's continue when you're ready." |
| 4-7 days away | "Your plan is still here — nothing broke." |
| 7+ days away | "No rush. Pick up where you left off." |
| Plan unfinished | "Your progress is saved. Ready when you are." |

All messages are factual, calm, and non-judgmental.

---

### Guardrails (Non-Negotiable)

| Rule | Implementation |
|------|----------------|
| No streaks mentioned | Re-entry banner never shows streak count |
| No missed-day warnings | Never say "you missed X days" |
| No gamification | No points, badges, or rewards for returning |
| No notifications | Phase 9.8 adds no push notifications |
| No AI suggestions | No "you should" or coaching language |
| No auto-actions | User must explicitly choose resume or review |

---

### Tier Gating

**All features are Free tier:**

| Feature | Tier |
|---------|------|
| Re-entry banner | Free |
| Resume actions | Free |
| Last progress display | Free |

---

### Data Integrity Guarantees

| Concern | Mitigation |
|---------|------------|
| Plans unchanged | Banner is purely UI overlay, no data mutations |
| Tasks unmodified | All task states remain exactly as left |
| Timers preserved | Existing ResumeFocusCTA handles timer recovery |
| Backward compatible | Uses existing localStorage data only |
| No new storage | Only reads from existing sources |

---

### Testing Checklist

**Banner Display:**
- [ ] Banner shows when daysAway >= 2
- [ ] Banner hidden when daysAway < 2
- [ ] Banner dismisses on tap
- [ ] Banner auto-dismisses after 10 seconds
- [ ] Dismissed state persists for session only

**Context Preservation:**
- [ ] Plan data unchanged after time away
- [ ] Deferred tasks visible with original dates
- [ ] No auto-rescheduling occurred
- [ ] Timer state preserved if left running

**Resume Actions:**
- [ ] Both buttons visible and same size
- [ ] Neither pre-selected
- [ ] "Resume today" navigates to /today
- [ ] "Review plan first" navigates to /plan

**Last Progress Display:**
- [ ] Shows correct last completion date
- [ ] Formatted as "Month Day" (not "X days ago")
- [ ] Hidden if no previous completions
- [ ] No guilt language used

**Guardrails:**
- [ ] No streak count shown
- [ ] No "missed days" language
- [ ] No gamification elements
- [ ] No AI suggestions or coaching

---

### Summary

Phase 9.8 adds gentle re-entry for returning users:

1. **Re-Entry Banner** — Calm, dismissible message shown after 2+ days away
2. **Context Preservation** — Confirmed: plans and tasks remain exactly as left
3. **Optional Resume Actions** — Two equal choices: resume today or review plan
4. **Soft Last Progress** — Factual date display without guilt
5. **No Pressure** — No streaks, warnings, or gamification in re-entry flow

**Product Intent:** Users can leave and return without anxiety. The app signals availability, not demand.


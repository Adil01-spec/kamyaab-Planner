# Memory: features/calm-re-entry
Updated: 2026-02-02

## Phase 9.8 — Retention Without Addiction (Calm Re-Entry)

### Overview
Enables users to return to the app after time away without anxiety, guilt, or pressure. The re-entry experience is calm, respectful, and signals that the app respects the user's pace.

**Core Principle:** "I can come back on my own terms — this app respects my pace."

### Components

**ReEntryBanner** (`src/components/ReEntryBanner.tsx`)
- Calm, muted styling (bg-muted/30, border-border/20)
- Leaf icon (subtle growth metaphor)
- Message varies based on days away:
  - 2-3 days: "Welcome back. Let's continue when you're ready."
  - 4-7 days: "Your plan is still here — nothing broke."
  - 7+ days: "No rush. Pick up where you left off."
- Shows last progress date as "Month Day" (e.g., "January 28") — never "X days ago"
- Two equal-weight outline buttons: "Resume today" → /today, "Review plan first" → /plan
- One-tap dismiss, auto-dismisses after 10 seconds
- Session-based dismissal (clears on page refresh)

### Trigger Conditions
- User has been away 2+ days (no task completions)
- User has a plan with pending tasks
- Not dismissed this session

### Data Sources (No New Storage)
- `lastCompletionDate` from streakTracker localStorage
- `completed_at` timestamps from task data
- Falls back to latest `day_closures` date if available

### Files
| File | Purpose |
|------|---------|
| `src/lib/reEntryContext.ts` | Calculate days away, last progress date |
| `src/hooks/useReEntryContext.ts` | Hook for pages to consume context |
| `src/components/ReEntryBanner.tsx` | Banner UI component |

### Integration
- `/home`: Banner appears above MotivationalQuoteCard (with actions)
- `/today`: Banner appears above greeting section (without actions — already on today)

### Guardrails (Non-Negotiable)
- No streaks mentioned in banner
- No "missed X days" language
- No gamification (points, badges, rewards)
- No push notifications
- No AI suggestions or coaching
- No auto-actions — user must explicitly choose

### Tier Gating
All features are Free tier.

### Context Preservation
Plans, tasks, and execution state remain exactly as left:
- No automatic resets or rescheduling
- Deferred tasks stay visible with original dates
- Timer state preserved (ResumeFocusCTA handles recovery)

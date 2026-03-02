
# Collaboration Consolidation + Integrated Calendar System

## Scope Assessment

This is a large architectural initiative with two distinct parts. Given the scope, I recommend implementing in **two phases** within this plan: Part 1 (Collaboration Consolidation) first, then Part 2 (Calendar System).

---

## PART 1 -- COLLABORATION CONSOLIDATION

### 1. Collaboration Mode Abstraction

**New file: `src/lib/collaborationMode.ts`**

Define the centralized type and resolver:

```text
type CollaborationMode = 'public_snapshot' | 'external_session' | 'authenticated'
```

**New hook: `src/hooks/useCollaborationContext.ts`**

Returns a unified context object:
- `mode`: one of the three modes
- `role`: 'owner' | 'commenter' | 'viewer' | null
- `canComment`: boolean
- `canSuggest`: boolean (commenter in external_session mode only)
- `isOwner`: boolean
- `isExternal`: boolean (external_session mode)
- `isPublic`: boolean (public_snapshot mode)

The hook accepts a discriminated input:
- For `authenticated`: wraps `useCollaboratorAccess` internally
- For `external_session`: reads from soft session props (role, sessionToken)
- For `public_snapshot`: always read-only, no commenting

All four review pages (`SharedReview`, `AdvisorView`, `SoftCollabReview`, authenticated `Review`) will import this hook. Existing behavior stays identical -- this only centralizes the permission resolution.

### 2. Unified Presentation Components

Extract shared presentation sub-components used across all review modes:

| Component | Source | Used By |
|-----------|--------|---------|
| `PlanOverviewCard` | From SharedReviewContent + AdvisorViewContent | All 4 views |
| `StrategyInsightsCard` | From SharedReviewContent + AdvisorViewContent | All 4 views |
| `ExecutionMetricsCard` | From AdvisorViewContent | Advisor, Review, SoftCollab |
| `WeeklyBreakdownCard` | From SharedReviewContent + AdvisorViewContent | All 4 views |
| `RealityCheckCard` | From SharedReviewContent + AdvisorViewContent | Advisor, Review, SharedReview |

Each component accepts:
- `plan`: the plan data (snapshot or live)
- `mode`: CollaborationMode (controls what fields are shown)
- Optional `onFeedbackClick` callback (for external_session task-level feedback)

**Pages are refactored to compose these shared components** instead of duplicating layout logic. The components conditionally render based on mode (e.g., print styles only in public_snapshot/advisor, feedback buttons only in external_session).

### 3. Normalize Comment Attribution

**Database migration:** Add two columns to `plan_comments`:
- `is_soft_author` (boolean, default false)
- `soft_author_email` (text, nullable)

**Edge function change:** Update `soft-collab-comment` to set `is_soft_author = true` and `soft_author_email = session.email` on insert.

**Frontend:** Comment rendering checks `is_soft_author`:
- If true: show email-derived display name with an "External" badge
- If false: show normal authenticated user profile
- This logic lives in a shared `CommentAttribution` sub-component used by both `PlanCommentsSection` and `SoftCollabReview`

### 4. Centralize Plan Sanitization

**New file: `src/lib/planSanitization.ts`**

```text
sanitizePlanForMode(plan, mode: CollaborationMode) => SanitizedPlan
```

Rules:
- `public_snapshot`: Return frozen snapshot as-is (already sanitized at share creation time)
- `external_session`: Strip `user_id`, subscription tier, collaborator list, internal execution metadata, auth fields. Keep live task state, weeks, strategy overview, execution insights.
- `authenticated`: Return full plan unchanged.

**Also add server-side version** in `get-plan-for-soft-session`: strip sensitive fields from `plan_json` before returning (defense in depth). Currently the edge function returns the full `plan_json` -- it should strip `owner_id`-like fields.

---

## PART 2 -- INTEGRATED CALENDAR SYSTEM

### 1. Calendar Selection Modal

**New component: `src/components/CalendarSelectionModal.tsx`**

When user clicks "Schedule" on a task, show a dialog with options:
- In-App Calendar (always available)
- Google Calendar (desktop + Android)
- Apple Calendar (iOS only, uses existing .ics flow -- NO changes)
- Device Default (fallback)

Persist preference in `localStorage` key `calendar_preference`. On subsequent uses, skip the modal and use the saved preference (with a "Change" option).

### 2. In-App Calendar System

#### 2a. Database: `calendar_events` table

```text
calendar_events
---------------------------------
id                uuid PK
user_id           uuid NOT NULL
plan_id           uuid nullable
task_ref          text nullable
title             text NOT NULL
description       text
start_time        timestamptz NOT NULL
end_time          timestamptz nullable
reminder_minutes  integer nullable
source            text DEFAULT 'in_app'
external_event_id text nullable
reminder_sent     boolean DEFAULT false
created_at        timestamptz DEFAULT now()
```

RLS: user can only SELECT/INSERT/UPDATE/DELETE where `user_id = auth.uid()`.

#### 2b. Notification Permission Flow

When user selects In-App Calendar and `Notification.permission !== 'granted'`:
- Show explanation: "Allow notifications to receive task reminders?"
- Request `Notification.requestPermission()`
- Store result in localStorage `notification_enabled`
- Handle denial gracefully (still create event, just no reminder)

#### 2c. Reminder Engine (Cron Edge Function)

**New edge function: `calendar-reminders`**
- Runs every minute via pg_cron
- Selects events where `reminder_sent = false` AND `start_time - (reminder_minutes * interval '1 minute') <= now()`
- For each matched event: attempt to send a web push notification (or fallback to storing a "pending reminder" the frontend polls)
- Sets `reminder_sent = true`

**Note:** True push notifications require a service worker + web push subscription. For MVP, the reminder engine will mark events as "reminder_due" and the frontend will poll/check on page load and show an in-app toast notification. This avoids the complexity of VAPID keys and service workers in the initial implementation.

### 3. Google Calendar Integration

**Approach:** Use the existing `calendarService.ts` Google Calendar URL method (opens Google Calendar in a new tab with pre-filled data) as the primary method. This does NOT require OAuth or token storage.

For full two-way sync (create/edit/delete via API): this requires Google Cloud OAuth credentials with `calendar.events` scope, which is separate from the sign-in OAuth. This would need:
- User to configure Google Cloud credentials
- An edge function to handle the OAuth callback and store encrypted refresh tokens
- Sync logic in edge functions

**Recommendation:** Start with the existing URL-based approach (already working) and add a "Connect Google Calendar" option in Profile settings that links to full API sync as a future enhancement. The modal will use the URL-based flow for now.

### 4. Apple Calendar -- NO CHANGES

The existing `.ics` download flow remains exactly as-is. The CalendarSelectionModal will route to the existing `openAppleCalendar` function. No modifications.

### 5. Android Reliability

When platform is Android:
- Default selection in CalendarSelectionModal = "In-App Calendar"
- Show subtle note: "Recommended for reliable reminders"
- Google Calendar option still available (uses URL-based flow)

### 6. Calendar UI -- `/calendar` Route

**New page: `src/pages/Calendar.tsx`**

Features:
- Month view (grid of days with event dots)
- Week view (time-slotted layout)
- Event list view (scrollable list)
- Click event opens detail modal (edit/delete)
- Visual differentiation: task-linked events show a link icon, standalone events show a calendar icon
- Protected route (requires profile)

**New components:**
- `CalendarMonthView.tsx`
- `CalendarWeekView.tsx`
- `CalendarEventList.tsx`
- `CalendarEventModal.tsx` (create/edit)

**Data hook: `src/hooks/useCalendarEvents.ts`**
- CRUD operations on `calendar_events` table
- Filter by date range
- Optimistic updates via TanStack Query

### 7. Task to Calendar Link

On each task row (in Plan page):
- Add a small calendar icon button ("Schedule")
- Opens `CalendarSelectionModal`
- Pre-fills: title = task title, description = task how_to/explanation
- Suggests time based on week structure (uses existing `calculateTaskEventDate`)
- Allows manual date/time override
- On save: creates `calendar_events` row with `task_ref = 'week-{n}-task-{m}'`
- If task marked complete: related calendar event gets a visual "completed" indicator (not auto-deleted)

### 8. Sync Logic

- `source = 'in_app'`: update DB only
- `source = 'google'`: update Google via URL (user manually syncs -- no API sync in v1)
- `source = 'apple_export'`: no sync (one-time export)
- Graceful error handling for all paths

### 9. Profile -- Calendar Settings

**Add new section to `src/pages/Profile.tsx`:**
- Default calendar choice (dropdown: In-App / Google / Apple / Device)
- Default reminder time (select: 5min / 10min / 15min / 30min / 1hr)
- Timezone display (read-only, from browser)
- Toggle notifications on/off
- Stored in localStorage (no DB changes needed for preferences)

---

## Files Summary

### Part 1 -- Collaboration Consolidation

| File | Action |
|------|--------|
| `src/lib/collaborationMode.ts` | **New** -- type + resolver |
| `src/hooks/useCollaborationContext.ts` | **New** -- unified context hook |
| `src/lib/planSanitization.ts` | **New** -- sanitizePlanForMode utility |
| `src/components/review/PlanOverviewCard.tsx` | **New** -- shared component |
| `src/components/review/StrategyInsightsCard.tsx` | **New** -- shared component |
| `src/components/review/ExecutionMetricsCard.tsx` | **New** -- shared component |
| `src/components/review/WeeklyBreakdownCard.tsx` | **New** -- shared component |
| `src/components/review/RealityCheckCard.tsx` | **New** -- shared component |
| `src/components/review/CommentAttribution.tsx` | **New** -- shared comment rendering |
| **Migration SQL** | Add `is_soft_author`, `soft_author_email` to `plan_comments` |
| `supabase/functions/soft-collab-comment/index.ts` | **Modify** -- set soft author fields |
| `supabase/functions/get-plan-for-soft-session/index.ts` | **Modify** -- sanitize plan_json |
| `src/pages/SharedReview.tsx` | **Refactor** -- use shared components |
| `src/pages/AdvisorView.tsx` | **Refactor** -- use shared components |
| `src/pages/SoftCollabReview.tsx` | **Refactor** -- use shared components + context hook |
| `src/pages/Review.tsx` | **Refactor** -- use context hook |
| `src/components/SharedReviewContent.tsx` | **Remove** (replaced by shared components) |
| `src/components/AdvisorViewContent.tsx` | **Remove** (replaced by shared components) |

### Part 2 -- Calendar System

| File | Action |
|------|--------|
| **Migration SQL** | CREATE `calendar_events` with RLS |
| `src/components/CalendarSelectionModal.tsx` | **New** |
| `src/pages/Calendar.tsx` | **New** -- /calendar route |
| `src/components/CalendarMonthView.tsx` | **New** |
| `src/components/CalendarWeekView.tsx` | **New** |
| `src/components/CalendarEventList.tsx` | **New** |
| `src/components/CalendarEventModal.tsx` | **New** |
| `src/hooks/useCalendarEvents.ts` | **New** -- CRUD hook |
| `supabase/functions/calendar-reminders/index.ts` | **New** -- cron reminder check |
| `src/App.tsx` | **Modify** -- add /calendar route |
| `src/pages/Profile.tsx` | **Modify** -- add Calendar Settings section |
| `src/pages/Plan.tsx` | **Modify** -- add Schedule button to task rows |
| `src/components/BottomNav.tsx` | **Modify** -- add Calendar nav item |

---

## What Is NOT Modified

- OTP verification system
- Account-based collaboration (plan_collaborators, useCollaboratorAccess)
- Execution engine (/today, task mutations, completion logic)
- Strategic scoring / quota logic
- Subscription tiers / RLS on plans
- Share system (shared_reviews table)
- Apple .ics flow (completely untouched)
- Existing soft feedback + suggestions tables and edge functions

## Implementation Order

1. Part 1 tasks first (consolidation is lower risk, provides cleaner foundation)
2. Database migration for `calendar_events` + `plan_comments` columns
3. Calendar UI components + /calendar route
4. CalendarSelectionModal + task-to-calendar linking
5. Reminder engine (cron edge function)
6. Profile calendar settings

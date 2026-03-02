
# Build Calendar Reminders Cron Edge Function

## Overview
Create the `calendar-reminders` edge function that runs on a schedule to mark events as reminder-due, and add frontend polling to show in-app toast notifications when reminders are triggered.

## What Gets Built

### 1. Edge Function: `supabase/functions/calendar-reminders/index.ts`

The function will:
- Use the Supabase service role to query `calendar_events` across all users
- Find events where `reminder_sent = false` AND `start_time - (reminder_minutes * interval '1 minute') <= now()`
- Set `reminder_sent = true` for matched events
- Also add a `reminder_due_at` column (via migration) so the frontend knows when to show the toast
- Return a count of processed reminders for logging

Security:
- `verify_jwt = false` in config.toml (called by pg_cron, not by users)
- Validates a shared secret or simply runs as an internal cron-only function

### 2. Database Migration

Add column to `calendar_events`:
- `reminder_due_at` (timestamptz, nullable, default null) -- set by the cron function when a reminder fires

This lets the frontend poll for `reminder_due_at IS NOT NULL AND reminder_sent = true` events that the user hasn't dismissed yet.

### 3. Register in `supabase/config.toml`

```text
[functions.calendar-reminders]
verify_jwt = false
```

### 4. Schedule Cron Job

Use the Supabase insert tool (not migration) to set up pg_cron:
- Enable `pg_cron` and `pg_net` extensions
- Schedule the function to run every minute via `cron.schedule`

### 5. Frontend Reminder Polling

Create a lightweight hook `src/hooks/useReminderCheck.ts`:
- On authenticated pages (Home, Today, Plan, Calendar), poll every 60 seconds
- Query `calendar_events` where `reminder_sent = true` AND `reminder_due_at IS NOT NULL` AND `start_time > now() - 1 hour` (recent only)
- Show a toast notification for each unacknowledged reminder
- After showing, update a localStorage set of "dismissed reminder IDs" to avoid re-toasting
- Optionally request browser Notification permission and show native notifications

### 6. Integration Point

Add `useReminderCheck()` to the App layout or key pages so reminders fire regardless of which page the user is on.

## Files Changed

| File | Action |
|------|--------|
| `supabase/functions/calendar-reminders/index.ts` | **New** -- cron edge function |
| `supabase/config.toml` | **Modify** -- add calendar-reminders entry |
| `src/hooks/useReminderCheck.ts` | **New** -- frontend polling + toast |
| `src/App.tsx` | **Modify** -- mount useReminderCheck |
| **Migration SQL** | Add `reminder_due_at` column to `calendar_events` |
| **Insert SQL** | Enable pg_cron/pg_net + schedule cron job |

## What Is NOT Modified
- Calendar UI (Calendar.tsx, CalendarEventModal.tsx)
- Task scheduling flow (CalendarSelectionModal, Plan.tsx)
- Profile calendar settings
- Execution engine, collaboration, or any other system

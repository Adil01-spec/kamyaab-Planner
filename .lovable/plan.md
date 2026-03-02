

# Add Calendar Deep Linking, Toast Actions, and Missed Events

## Validation Summary (as requested)

**Deep linking to specific date**: The Calendar page will read `?date=YYYY-MM-DD` from `useSearchParams`. On mount, if the param exists, it parses it with `date-fns/parseISO`, sets both `selectedDate` and `currentMonth` to that date, and optionally a `?highlight=EVENT_ID` param triggers a one-time CSS animation. This is safe because invalid dates fall back to today via `isValid()` check.

**Badge count calculation**: The BottomNav already queries Supabase on mount + via realtime subscription. Adding a single count query for missed events (`start_time < now AND status = 'missed'`) piggybacks on the existing pattern -- one lightweight query, no extra polling.

**Highlighting without rerender loops**: The highlight event ID is stored in a `useRef` (not state). On Calendar mount, a `useEffect` reads the query param, finds the DOM element via `data-event-id` attribute, calls `scrollIntoView` + adds a CSS class, then clears the ref. The CSS animation runs once (`animation-iteration-count: 1`). No state changes means no rerender loop.

**Why this improves execution adherence**: Currently reminders are fire-and-forget toasts with no actionable path. Adding "Open Task" and "View Calendar" buttons converts passive awareness into active navigation. The missed events banner creates accountability visibility. Together they close the loop between notification and action.

---

## Database Migration

Add `status` column to `calendar_events`:

```sql
ALTER TABLE calendar_events
  ADD COLUMN status text NOT NULL DEFAULT 'upcoming';
```

Valid values: `'upcoming'`, `'missed'`, `'completed'`. The cron function or frontend will set `status = 'missed'` for past events where the linked task was not completed.

Update the `calendar-reminders` edge function to also mark events as `'missed'` when `start_time + duration < now()` and `status = 'upcoming'`.

---

## 1. Enhanced Reminder Toast (useReminderCheck.ts)

**Changes:**
- Expand the SELECT query to include `task_ref`, `plan_id` fields
- Import `ToastAction` from `@/components/ui/toast`
- Build the `action` prop as a React element containing two buttons:
  - "Open Task" (only if `task_ref` exists): navigates to `/plan` (plan page shows the task)
  - "View Calendar": navigates to `/calendar?date=YYYY-MM-DD&highlight=EVENT_ID`
- For standalone events (no `task_ref`): only show "View Calendar"
- Navigation uses `window.location.href` since the hook runs outside of Router context (ReminderChecker is above BrowserRouter in App.tsx -- this needs fixing by moving it inside BrowserRouter, or using window.location)

**Fix needed**: Move `<ReminderChecker />` inside `<BrowserRouter>` so we can use `useNavigate()` for SPA navigation instead of full page reloads.

---

## 2. Bottom Nav Badge for Missed Events (BottomNav.tsx)

**Changes:**
- Add state `missedCount` (number)
- Query `calendar_events` where `status = 'missed'` and `user_id = auth.uid()`, count rows
- Show a numeric badge (not just a dot) on the Calendar nav item when `missedCount > 0`
- Reuse the existing realtime subscription pattern (subscribe to `calendar_events` changes too, or just re-check on plan changes)

---

## 3. HomeFocusCard "View Calendar" Link (HomeFocusCard.tsx)

**Changes:**
- Add a "View Calendar" text button in the header area (top-right, next to the progress ring)
- Routes to `/calendar` on click
- Small, unobtrusive styling: `text-xs text-primary` with a calendar icon

---

## 4. Calendar Page Deep Linking (Calendar.tsx)

**Changes:**
- Import `useSearchParams` from react-router-dom
- On mount, read `date` and `highlight` query params
- If `date` exists and is valid, set `selectedDate` and `currentMonth` to that date
- If `highlight` exists, after events load, find the event element with `data-event-id={highlight}`, scroll into view, and apply a pulse animation class
- Add `data-event-id={ev.id}` attribute to event elements in all three views (month, week, list)
- Clear the query params after processing to avoid re-triggering on navigation

---

## 5. Missed Events Banner (Calendar.tsx)

**Changes:**
- Query missed events count: `calendar_events` where `status = 'missed'` and `user_id = auth.uid()`
- If count > 0, show a subtle banner at top of calendar content: "You have X missed scheduled tasks."
- Include "Review Missed" button that sets a local filter state
- When filter is active, only show events with `status = 'missed'` in all views
- Add a "Clear Filter" button to reset

---

## 6. Claimed Reminder to Calendar Deep Link

**Approach:**
- When user clicks "View Calendar" in the toast, the event ID is passed as `?highlight=EVENT_ID` query param
- No localStorage or persistent storage needed -- the highlight param is consumed once on Calendar mount
- The pulse animation is a simple CSS keyframe (`@keyframes pulse-highlight`) added to index.css

---

## 7. Edge Function Update (calendar-reminders/index.ts)

**Changes:**
- After marking `reminder_sent = true`, also check for events where `start_time < now()` AND `status = 'upcoming'`
- Update those to `status = 'missed'`
- This runs every minute via the existing cron, so missed status is set within ~1 minute of the event time passing

---

## Files Changed

| File | Action |
|------|--------|
| **Migration SQL** | Add `status` column to `calendar_events` |
| `src/hooks/useReminderCheck.ts` | Add toast actions with Open Task / View Calendar buttons |
| `src/App.tsx` | Move ReminderChecker inside BrowserRouter |
| `src/components/BottomNav.tsx` | Add missed events badge count on Calendar icon |
| `src/components/HomeFocusCard.tsx` | Add "View Calendar" text button in header |
| `src/pages/Calendar.tsx` | Add deep link support (`?date`, `?highlight`), missed events banner with filter |
| `src/index.css` | Add `pulse-highlight` keyframe animation |
| `supabase/functions/calendar-reminders/index.ts` | Mark past events as `'missed'` |
| `src/hooks/useCalendarEvents.ts` | Add `status` to CalendarEvent interface |

## No New Polling

All data comes from the existing `useCalendarEvents` hook queries and the existing `useReminderCheck` poll. The missed count in BottomNav uses a single query on mount + realtime subscription -- no new intervals.


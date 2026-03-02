

# Evolve Soft Collaboration into External Collaboration Layer

## Overview

Five enhancements to the existing soft collaboration system, adding structured feedback, suggestion mode, upgrade path, activity timeline, and session status indicators. All changes are additive -- OTP system, account-based collaboration, and execution engine remain untouched.

---

## 1. Database Changes (Single Migration)

### 1a. `soft_feedback` table
Stores structured ratings and section/task-level feedback from soft collaborators.

```text
soft_feedback
----------------------------------------------
id            uuid PK (gen_random_uuid)
plan_id       uuid NOT NULL (FK plans)
session_id    uuid NOT NULL (FK soft_collab_sessions)
email         text NOT NULL
target_type   text NOT NULL  -- 'plan' | 'week' | 'task'
target_ref    text           -- e.g. 'week-2', 'week-1-task-3'
content       text           -- optional comment text
strategy_score    smallint   -- 1-5, nullable
feasibility_score smallint   -- 1-5, nullable
execution_score   smallint   -- 1-5, nullable
created_at    timestamptz DEFAULT now()
```

RLS enabled, no public policies (all access via service role in edge functions).

### 1b. `plan_suggestions` table
Stores edit/add/deadline suggestions from commenter-role soft collaborators.

```text
plan_suggestions
----------------------------------------------
id            uuid PK (gen_random_uuid)
plan_id       uuid NOT NULL (FK plans)
session_id    uuid NOT NULL (FK soft_collab_sessions)
email         text NOT NULL
suggestion_type  text NOT NULL  -- 'edit_task' | 'new_task' | 'adjust_deadline'
target_ref    text           -- e.g. 'week-2-task-1'
title         text           -- suggested task title (for new_task)
description   text NOT NULL  -- what they suggest
status        text NOT NULL DEFAULT 'pending'  -- 'pending' | 'approved' | 'rejected'
resolved_at   timestamptz
created_at    timestamptz DEFAULT now()
```

RLS enabled, no public policies. Owner reads/manages via authenticated queries with an RLS policy: `SELECT/UPDATE/DELETE WHERE plan_id IN (SELECT id FROM plans WHERE user_id = auth.uid())`.

---

## 2. Edge Function Changes

### 2a. New: `soft-collab-feedback` (verify_jwt = false)
**Input**: `{ session_token, target_type, target_ref, content, strategy_score, feasibility_score, execution_score }`

Logic:
1. Validate session (exists, not expired, role = commenter)
2. Validate scores are 1-5 or null
3. Insert into `soft_feedback` via service role
4. Return success with the created feedback record

### 2b. New: `soft-collab-suggest` (verify_jwt = false)
**Input**: `{ session_token, suggestion_type, target_ref, title, description }`

Logic:
1. Validate session (exists, not expired, role = commenter)
2. Validate suggestion_type is one of the allowed values
3. Insert into `plan_suggestions` via service role
4. Return success with created suggestion

### 2c. Modify: `get-plan-for-soft-session`
Add to the response payload:
- `feedback`: all `soft_feedback` rows for this plan
- `suggestions`: all `plan_suggestions` rows for this plan (so commenter can see their own + others)
- `activity`: recent task completion changes (derived from plan_json diff or from plan_history if available)

### 2d. New: `get-plan-feedback-summary` (verify_jwt = true, for owner)
**Input**: uses auth.uid() from JWT
Logic:
1. Get owner's plan
2. Aggregate `soft_feedback` for that plan: average scores, count by target_type
3. Fetch all `plan_suggestions` with status
4. Return structured summary

---

## 3. Frontend: Structured Feedback (SoftCollabReview)

### 3a. Task-level and Week-level comment targeting
- Each task row and week header gets a small feedback icon button (for commenters)
- Clicking opens an inline feedback form with:
  - Comment text area
  - Three optional star ratings (Strategy 1-5, Feasibility 1-5, Execution 1-5)
  - Submit button
- Comments in the comments section show their `target_ref` as a badge (e.g., "Week 2", "Task: Design wireframes")

### 3b. New component: `SoftFeedbackForm.tsx`
- Compact inline form with rating sliders and text
- Calls `soft-collab-feedback` edge function
- Shows success animation on submit

### 3c. Aggregated metrics display
- At the top of the soft review page (below the overview card), show aggregated feedback scores if any exist:
  - Average Strategy / Feasibility / Execution scores as small gauges
  - Total feedback count

---

## 4. Frontend: Suggestion Mode (SoftCollabReview)

### 4a. New component: `SoftSuggestionForm.tsx`
- Available only for commenter role
- Three suggestion types via tabs/buttons:
  - **Edit Task**: select a task reference, describe the edit
  - **New Task**: provide title + description + target week
  - **Adjust Deadline**: select task, suggest new duration/deadline
- Calls `soft-collab-suggest` edge function

### 4b. Suggestions list on soft review page
- Shows all suggestions for this plan with status badges (Pending/Approved/Rejected)
- Read-only for soft users (they can see status but not change it)

### 4c. Owner's Suggestion Management (Review.tsx)
- New section: "External Suggestions" on the owner's `/review` page
- New component: `PlanSuggestionsSection.tsx`
  - Lists pending suggestions with Approve/Reject buttons
  - Approve: updates status to 'approved', optionally converts into a real task in plan_json
  - Reject: updates status to 'rejected'
  - Uses authenticated Supabase queries (RLS protects owner-only access)

---

## 5. Frontend: Upgrade Path

### 5a. New component: `SoftUpgradeBanner.tsx`
- Rendered at the bottom of `SoftCollabReview` when:
  - User has submitted 2+ feedback entries, OR
  - User has visited the soft review page 3+ times (tracked via localStorage counter)
- Shows: "Create a free account to collaborate across plans"
- CTA button links to `/auth?upgrade_from_soft=true&email={email}`

### 5b. Auth page enhancement
- If `upgrade_from_soft` query param is present:
  - Pre-fill the email field
  - Show a subtle banner: "Welcome! Sign up to unlock full collaboration."
- After signup + verification:
  - Check if `plan_collaborators` has a matching `collaborator_email`
  - If yes, update `collaborator_user_id` to the new user's ID
  - Clear soft session from localStorage

### 5c. New edge function: `convert-soft-to-full` (verify_jwt = true)
- Called after a new user signs up
- Input: none (uses auth.uid() and user email from JWT)
- Logic:
  1. Find any `plan_collaborators` rows matching user's email where `collaborator_user_id` is null
  2. Update `collaborator_user_id` to auth.uid()
  3. Invalidate any `soft_collab_sessions` for that email
  4. Return count of converted collaborations

---

## 6. Frontend: Activity Timeline (SoftCollabReview)

### 6a. New component: `SoftActivityTimeline.tsx`
- Shows last 7 days of plan activity:
  - Tasks completed (from plan_json weeks data -- compare completed flags)
  - Completion consistency mini-chart (7-day bar chart using recharts)
  - Recent comments/feedback
- Data comes from `get-plan-for-soft-session` (extended response)
- Visual quality matches Advisor view presentation

### 6b. Extend `get-plan-for-soft-session` response
- Add `day_closures` from plan_json (already stored there) to the response
- Add `plan_created_at` timestamp
- Frontend derives activity timeline from day_closures + task completion states

---

## 7. Frontend: Soft Session Status Indicator

### 7a. Update SoftCollabReview header
- Replace current role badge with: "External Collaboration Mode" badge (amber/orange variant)
- Keep the existing LogOut button (already present -- clears soft session)
- Add session expiry countdown: "Session expires in X hours"

---

## Files Summary

| File | Action |
|------|--------|
| **Migration SQL** | CREATE `soft_feedback`, CREATE `plan_suggestions` with RLS |
| `supabase/functions/soft-collab-feedback/index.ts` | **New** |
| `supabase/functions/soft-collab-suggest/index.ts` | **New** |
| `supabase/functions/convert-soft-to-full/index.ts` | **New** |
| `supabase/functions/get-plan-for-soft-session/index.ts` | **Modify** -- add feedback, suggestions, day_closures |
| `supabase/functions/get-plan-feedback-summary/index.ts` | **New** -- owner dashboard aggregation |
| `src/pages/SoftCollabReview.tsx` | **Major update** -- add feedback forms, suggestions, timeline, upgrade banner, status indicator |
| `src/components/SoftFeedbackForm.tsx` | **New** |
| `src/components/SoftSuggestionForm.tsx` | **New** |
| `src/components/SoftActivityTimeline.tsx` | **New** |
| `src/components/SoftUpgradeBanner.tsx` | **New** |
| `src/components/PlanSuggestionsSection.tsx` | **New** -- owner's suggestion management |
| `src/components/SoftFeedbackSummary.tsx` | **New** -- aggregated scores display |
| `src/pages/Review.tsx` | **Modify** -- add PlanSuggestionsSection + SoftFeedbackSummary |
| `src/pages/Auth.tsx` | **Modify** -- handle upgrade_from_soft param |
| `src/pages/Onboarding.tsx` or post-signup hook | **Modify** -- call convert-soft-to-full after signup |

---

## What Is NOT Modified
- OTP verification system (verify-soft-invite, InviteAccept)
- Account-based collaboration (plan_collaborators, useCollaboratorAccess)
- Execution engine (/today, /plan, task mutations)
- Strategic mode / quota logic
- Subscription tiers
- Existing RLS policies on plans, plan_comments, plan_collaborators
- shared_reviews system


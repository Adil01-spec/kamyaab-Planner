
# Soft Collaboration Authentication System

## Overview
Replace the current Supabase-account-required invite acceptance flow with a plan-scoped, accountless soft auth system. Collaborators verify identity via email + access key (OTP-style), receive a session token, and access plan review through edge functions -- no platform signup needed.

This runs as a **parallel auth lane** alongside existing Supabase auth. No changes to owner login, execution engine, strategic quotas, RLS, or shared_reviews.

---

## 1. Database Changes

### 1a. Modify `plan_invites` table (migration)

Add columns:
- `access_key_hash` (text, NOT NULL) -- SHA-256 hash of the 5-digit key
- `access_key_attempts` (integer, NOT NULL, DEFAULT 0)
- `locked_until` (timestamptz, nullable)

### 1b. Create `soft_collab_sessions` table (migration)

| Column | Type | Notes |
|--------|------|-------|
| id | uuid, PK | `gen_random_uuid()` |
| plan_id | uuid, NOT NULL | FK to plans |
| invite_id | uuid, NOT NULL | FK to plan_invites |
| email | text, NOT NULL | collaborator email |
| role | collaborator_role, NOT NULL | viewer or commenter |
| session_token | text, NOT NULL, UNIQUE | 128-bit random hex |
| expires_at | timestamptz, NOT NULL | 24 hours from creation |
| created_at | timestamptz | default now() |

**RLS**: Enable RLS but NO public policies. All access via edge functions using service role.

---

## 2. Update Invite Creation (`useCollaborators.addCollaborator`)

When owner invites:
1. Generate a 5-digit numeric access key (10000-99999)
2. Hash it with SHA-256 (done in the edge function, not frontend)
3. Store hashed version in `plan_invites.access_key_hash`
4. Pass the plain key to `send-collaboration-invite` for inclusion in the email

Changes in `useCollaborators.ts`:
- Generate the plain access key in frontend
- Pass it to the edge function alongside the token
- The edge function hashes and stores it

Alternative (more secure): Generate the access key entirely in a new edge function or modify `send-collaboration-invite` to generate + hash the key and update the invite row. This keeps the plain key out of the frontend entirely.

**Recommended approach**: Modify `send-collaboration-invite` to:
1. Accept the invite token (not access key from frontend)
2. Generate the 5-digit key server-side
3. Hash it with SHA-256
4. Update `plan_invites` row with `access_key_hash`
5. Include the plain key in the email

This way the frontend never sees the access key.

---

## 3. Update `send-collaboration-invite` Edge Function

Changes:
- Generate 5-digit access key server-side
- Hash with SHA-256 and update `plan_invites.access_key_hash`
- Include access key prominently in the email body (styled as a code block)
- Fetch plan title from DB (already implemented)
- Fallback: "Execution Plan" (already implemented)
- Never show "Untitled Plan"

Email template additions:
```
Your Access Key: 47291
```
Styled as a prominent, copyable code block.

---

## 4. New Edge Function: `verify-soft-invite`

**Path**: `supabase/functions/verify-soft-invite/index.ts`
**Config**: `verify_jwt = false` (public endpoint, no Supabase auth required)

**Input**: `{ token, email, access_key }`

**Logic**:
1. Fetch invite by token (service role)
2. Validate: exists, not expired, not accepted
3. Check `locked_until` -- if locked, return error with remaining time
4. Compare `lower(email) == lower(collaborator_email)`
5. Hash provided `access_key` with SHA-256, compare to `access_key_hash`
6. On mismatch:
   - Increment `access_key_attempts`
   - If attempts >= 5: set `locked_until = now() + 15 minutes`
   - Return error
7. On success:
   - Generate 128-bit session token
   - Insert into `soft_collab_sessions` (plan_id, invite_id, email, role, session_token, expires_at = now + 24h)
   - Return: `{ plan_id, role, session_token, plan_name, inviter_name }`

---

## 5. New Edge Function: `validate-soft-session`

**Path**: `supabase/functions/validate-soft-session/index.ts`
**Config**: `verify_jwt = false`

**Input**: `{ session_token, plan_id }`

**Logic**:
1. Fetch session by token (service role)
2. Validate: exists, not expired, `plan_id` matches
3. Return: `{ valid: true, email, role, plan_id }`

Used by the frontend to check if a soft session is still valid before rendering plan review content.

---

## 6. New Edge Function: `get-plan-for-soft-session`

**Path**: `supabase/functions/get-plan-for-soft-session/index.ts`
**Config**: `verify_jwt = false`

**Input**: `{ session_token }`

**Logic**:
1. Validate session (same checks as validate-soft-session)
2. Fetch plan data from `plans` table using session's `plan_id`
3. Return plan_json (read-only snapshot for the collaborator)
4. Do NOT return owner profile data, only plan content

This replaces direct Supabase client queries for soft collaborators (since they have no auth and RLS blocks them).

---

## 7. New Edge Function: `soft-collab-comment`

**Path**: `supabase/functions/soft-collab-comment/index.ts`
**Config**: `verify_jwt = false`

**Input**: `{ session_token, target_type, target_ref, content }`

**Logic**:
1. Validate session token
2. Confirm role == 'commenter'
3. Insert into `plan_comments` using service role:
   - `plan_id` from session
   - `author_id` = invite's `owner_id` placeholder (or a system UUID) -- since soft users have no auth.uid
   - `author_name` = email prefix or full email
   - `target_type`, `target_ref`, `content`
4. Return success

**Note**: The existing `plan_comments` RLS requires `can_comment_on_plan(plan_id) AND author_id = auth.uid()`. Since soft users don't have auth.uid(), the edge function inserts via service role, bypassing RLS. This is acceptable since the edge function validates the session.

---

## 8. Rewrite `/invite/:token` Page (`InviteAccept.tsx`)

Complete rewrite of the invite page to remove Supabase auth dependency:

**On mount**:
1. Call `validate-invite` (existing) to get invite metadata
2. If invalid/expired: show error state

**If valid, show**:
- Plan name, inviter name, role badge, expiry notice
- Email input (pre-filled with `collaborator_email`, editable)
- Access key input (5-digit numeric, styled as OTP boxes)
- "Verify & Access Plan" button

**On submit**:
1. Call `verify-soft-invite` with token, email, access_key
2. On success:
   - Store `session_token` and `plan_id` in localStorage (keyed as `soft_collab_session`)
   - Redirect to `/plan/{plan_id}/review`
3. On error:
   - Show appropriate error (wrong key, locked, email mismatch)

**Remove**:
- All references to `useAuth`, `user`, Supabase login
- "Sign In" / "Sign Up" buttons
- `pending_invite_token` localStorage logic

---

## 9. New Route: `/plan/:planId/review` (Soft Collaborator Review Page)

**File**: `src/pages/SoftCollabReview.tsx`

A read-only review page for soft collaborators that:
1. On mount: reads `soft_collab_session` from localStorage
2. Calls `validate-soft-session` to confirm validity
3. If invalid: redirect to `/invite/:token` or show session expired message
4. If valid: calls `get-plan-for-soft-session` to fetch plan data
5. Renders a simplified version of the Review page (plan overview, progress, comments)
6. If role == 'commenter': shows comment form that uses `soft-collab-comment` edge function
7. No navigation to /home, /today, /profile, etc. -- isolated view

**Route in App.tsx**:
```
<Route path="/plan/:planId/review" element={<SoftCollabReview />} />
```

---

## 10. Revert Auth Redirect Overrides

**In `AuthRoute.tsx`**: Remove the `pending_invite_token` localStorage check and redirect logic (lines 33-37).

**In `ProtectedRoute.tsx`**: Remove the `pending_invite_token` check and redirect logic (lines 60-64).

These were added for the account-based invite flow and are no longer needed since soft auth doesn't redirect through `/auth`.

---

## 11. Update `accept-invite` Edge Function

This function is no longer needed for soft collaborators. However, keep it for backward compatibility with any already-accepted invites. No changes needed -- it simply won't be called from the new flow.

Alternatively, mark it as deprecated and remove the route from `config.toml` in a future cleanup.

---

## 12. Soft Session Guard Hook

**File**: `src/hooks/useSoftCollabSession.ts`

A lightweight hook that:
1. Reads `soft_collab_session` from localStorage
2. Returns `{ sessionToken, planId, role, isActive, clearSession }`
3. Used by `SoftCollabReview` page to gate access

---

## 13. Route Restrictions for Soft Users

Soft collaborators don't have Supabase auth, so `ProtectedRoute` already blocks them from `/home`, `/today`, `/profile`, etc. No additional blocking needed -- they simply can't access those routes.

The `SoftCollabReview` page is a public route that self-validates via edge function.

---

## Files Summary

| File | Action |
|------|--------|
| **Migration SQL** | ALTER `plan_invites` add columns; CREATE `soft_collab_sessions` |
| `supabase/functions/verify-soft-invite/index.ts` | **New** -- email + key verification |
| `supabase/functions/validate-soft-session/index.ts` | **New** -- session validation |
| `supabase/functions/get-plan-for-soft-session/index.ts` | **New** -- fetch plan data for soft users |
| `supabase/functions/soft-collab-comment/index.ts` | **New** -- comment insertion for soft users |
| `supabase/functions/send-collaboration-invite/index.ts` | **Modify** -- generate access key, include in email |
| `supabase/config.toml` | **Modify** -- add 4 new function entries |
| `src/pages/InviteAccept.tsx` | **Rewrite** -- remove auth, add email + OTP form |
| `src/pages/SoftCollabReview.tsx` | **New** -- isolated review page for soft collaborators |
| `src/hooks/useSoftCollabSession.ts` | **New** -- soft session state management |
| `src/hooks/useCollaborators.ts` | **Modify** -- pass access key generation to edge function |
| `src/App.tsx` | **Modify** -- add `/plan/:planId/review` route |
| `src/components/AuthRoute.tsx` | **Modify** -- remove pending_invite_token logic |
| `src/components/ProtectedRoute.tsx` | **Modify** -- remove pending_invite_token logic |

---

## What Is NOT Modified
- Supabase auth system (login, signup, sessions)
- Owner login or profile flow
- Plan execution state machine (`/today`, `/plan`)
- Strategic mode / quota logic
- Subscription tier logic
- `shared_reviews` system
- Existing RLS policies on `plans`, `plan_collaborators`, `plan_comments`
- SECURITY DEFINER functions (`can_view_plan`, `can_comment_on_plan`, `get_collaboration_role`)
- Onboarding flow
- Full-account collaboration (still works for users who have accounts)



# Token-Based Invite Acceptance Flow

## Overview
Implement a secure, token-based invitation flow for plan collaboration. Invitees receive an email with a unique link, land on a public invite page, authenticate (or sign up), and are linked as collaborators -- all without touching execution logic, strategic quotas, onboarding, or the existing shared_reviews system.

---

## 1. Database: `plan_invites` Table

Create a new table to track pending invitations separately from accepted collaborators.

**Columns:**
- `id` (uuid, PK, default `gen_random_uuid()`)
- `plan_id` (uuid, NOT NULL, FK to `plans.id`)
- `owner_id` (uuid, NOT NULL)
- `collaborator_email` (text, NOT NULL)
- `role` (collaborator_role, NOT NULL, default `'viewer'`)
- `token` (text, NOT NULL, UNIQUE) -- 128-bit cryptographically random
- `expires_at` (timestamptz, NOT NULL) -- 7 days from creation
- `accepted_at` (timestamptz, nullable)
- `created_at` (timestamptz, default `now()`)

**Constraints:**
- `UNIQUE(plan_id, collaborator_email)` -- one invite per email per plan
- `UNIQUE(token)`

**RLS Policies:**
- Owners can INSERT (where `owner_id = auth.uid()`)
- Owners can SELECT their own invites
- No public SELECT (the `validate-invite` edge function reads via service role)

---

## 2. Modify Invite Flow (`useCollaborators.addCollaborator`)

**Current:** Inserts directly into `plan_collaborators`, then emails.

**New:**
1. Insert into `plan_invites` (with generated token and 7-day expiry) instead of `plan_collaborators`
2. Call `send-collaboration-invite` edge function with the token
3. Do NOT insert into `plan_collaborators` yet -- that happens on acceptance

The `CollaborationModal` UI remains unchanged. The `useCollaborators` hook changes its write target and passes the token to the email function.

Token generation: Use `crypto.randomUUID()` combined with random bytes, or generate a 32-char hex string via `Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b => b.toString(16).padStart(2,'0')).join('')`.

---

## 3. Update `send-collaboration-invite` Edge Function

**Changes:**
- Accept `token` and `plan_id` in the request body
- Fetch the plan title from the database (using service role client) instead of trusting the frontend
- Build the invite link as: `{appUrl}/invite/{token}`
- Fallback plan title: `"Execution Plan"`

---

## 4. New Edge Function: `validate-invite`

**Path:** `supabase/functions/validate-invite/index.ts`

**Input:** `{ token: string }`

**Logic:**
1. Fetch invite from `plan_invites` by token (service role)
2. Validate: exists, not expired (`expires_at > now()`), not accepted (`accepted_at IS NULL`)
3. Fetch plan title from `plans` table
4. Fetch inviter name from `profiles` table using `owner_id`
5. Return: `{ plan_name, inviter_name, role, collaborator_email, expires_at }`
6. Do NOT expose `owner_id` or `plan_id` publicly

**Config:** `verify_jwt = false` (public endpoint)

---

## 5. New Edge Function: `accept-invite`

**Path:** `supabase/functions/accept-invite/index.ts`

**Input:** `{ token: string }` (auth token in header)

**Logic:**
1. Extract user from JWT (`Authorization` header)
2. Fetch invite by token (service role)
3. Validate: exists, not expired, not accepted
4. Verify `user.email == collaborator_email` (case-insensitive) -- reject on mismatch
5. Insert into `plan_collaborators`: `plan_id`, `owner_id`, `collaborator_email`, `collaborator_user_id = auth.uid()`, `role`, `accepted_at = now()`
6. Update `plan_invites` set `accepted_at = now()`
7. Return `{ plan_id }` for redirect

**Config:** `verify_jwt = false` (validates JWT manually for better error handling)

---

## 6. New Route: `/invite/:token` (Frontend Page)

**File:** `src/pages/InviteAccept.tsx`

**On mount:**
1. Call `validate-invite` with the token from URL params
2. If invalid/expired: show "This invitation has expired or is no longer valid"
3. If valid, show invite card:
   - Plan name
   - Inviter name
   - Role badge (Viewer/Commenter)
   - Expiry notice ("Expires in X days")

**Auth-aware behavior:**

- **If user is logged in:**
  - Show "Accept Invitation" button
  - On click: call `accept-invite` edge function
  - On success: redirect to `/review` (the plan's review page)
  - On email mismatch: show clear error "This invitation was sent to {email}. Please log in with that email."

- **If user is NOT logged in:**
  - Show "Continue with email to access this plan"
  - Pre-fill the invited email in the auth form context
  - Store `pending_invite_token` in `localStorage`
  - "Sign In" / "Sign Up" buttons link to `/auth` with query param `?invite={token}`

**Route registration in `App.tsx`:**
```text
<Route path="/invite/:token" element={<InviteAccept />} />
```
This is a PUBLIC route (no ProtectedRoute wrapper).

---

## 7. Post-Auth Redirect for Pending Invites

**In `AuthRoute` component** (handles logged-in users hitting `/auth`):
- Before redirecting to `/today` or `/onboarding`, check `localStorage` for `pending_invite_token`
- If found: redirect to `/invite/{token}` instead, then clear the localStorage key

**In `ProtectedRoute`** (for the `/onboarding` redirect-if-profile logic):
- Same check: if `pending_invite_token` exists in localStorage, redirect to `/invite/{token}` instead of `/home`

This ensures the invite flow overrides normal post-auth routing without modifying the onboarding flow itself.

---

## 8. Pending Invite Prompt on Login (Cleanup/Optional)

After login, in a lightweight hook or within the `/invite/:token` page itself:
- No global polling needed -- the token in localStorage drives the redirect
- If the user navigates away from `/invite/:token` without accepting, the token remains in localStorage until they visit it again or it expires

---

## 9. Update `useCollaborators` to Reflect Pending vs Accepted

The collaborators list in `CollaborationModal` should show:
- Accepted collaborators from `plan_collaborators` (as today)
- Pending invites from `plan_invites` (where `accepted_at IS NULL` and `expires_at > now()`)
- Display pending invites with a "Pending" badge

The owner can remove pending invites (delete from `plan_invites`).

---

## Files Created/Modified

| File | Action |
|------|--------|
| **Migration SQL** | CREATE TABLE `plan_invites` with RLS |
| `supabase/functions/validate-invite/index.ts` | New edge function |
| `supabase/functions/accept-invite/index.ts` | New edge function |
| `supabase/config.toml` | Add entries for new functions |
| `supabase/functions/send-collaboration-invite/index.ts` | Accept token, fetch plan title from DB |
| `src/pages/InviteAccept.tsx` | New invite landing page |
| `src/App.tsx` | Add `/invite/:token` route |
| `src/hooks/useCollaborators.ts` | Write to `plan_invites` instead of `plan_collaborators`; fetch pending invites |
| `src/components/CollaborationModal.tsx` | Show pending invites with badge |
| `src/components/AuthRoute.tsx` | Check `pending_invite_token` before redirect |
| `src/components/ProtectedRoute.tsx` | Check `pending_invite_token` before redirect |

---

## What Is NOT Modified
- Plan execution state machine
- Strategic mode / quota logic
- Subscription tier logic
- `shared_reviews` system
- Existing RLS policies on `plans`, `plan_collaborators`, `plan_comments`
- Existing SECURITY DEFINER functions (`can_view_plan`, `can_comment_on_plan`, `get_collaboration_role`)
- Onboarding flow for normal (non-invite) users



# Add Resend Access Key Email for Pending Invites

## What Changes

Add a "Resend" button next to each pending invite in the CollaborationModal. Clicking it re-triggers the `send-collaboration-invite` edge function with the existing invite token, which generates a fresh 5-digit access key, updates the hash in the database, and sends a new email.

## Technical Details

### 1. Update `PendingInvite` interface (`src/hooks/useCollaborators.ts`)

Add `token` field to the `PendingInvite` interface and map it from the fetched data (the query already selects `*`).

### 2. Add `resendInvite` function (`src/hooks/useCollaborators.ts`)

New callback that:
- Takes a `PendingInvite` (needs token, email, role)
- Calls `send-collaboration-invite` edge function with the existing token, email, role, planId, ownerName, and appUrl
- The edge function already handles generating a new access key, hashing it, and updating the `plan_invites` row
- Shows a success/error toast
- Resets `access_key_attempts` and `locked_until` on the invite row (via a supabase update) so the collaborator gets a fresh start

### 3. Add resend button to CollaborationModal (`src/components/CollaborationModal.tsx`)

- Import `RotateCw` (or `RefreshCw`) icon from lucide-react
- Add a resend button next to the Pending badge on each pending invite row
- Track `resendingId` state to show a loading spinner on the button being resent
- Wire it to the new `resendInvite` function from the hook

### Files Modified

| File | Change |
|------|--------|
| `src/hooks/useCollaborators.ts` | Add `token` to `PendingInvite`, add `resendInvite` callback, expose it in return, reset attempts on resend |
| `src/components/CollaborationModal.tsx` | Add resend button with loading state to pending invite rows |

No database changes, no new edge functions, no config changes needed.

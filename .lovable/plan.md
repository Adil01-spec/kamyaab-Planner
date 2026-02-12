
# Structural Fix: Auth Resolution Gate + Plan Generation Flow

## Problem Summary
Two architectural issues persist because the previous fixes were patches, not structural changes:

1. **Onboarding flash**: `onAuthStateChange` calls `setTimeout(() => fetchProfile())` which creates a micro-gap. React renders between `setUser(user)` and `fetchProfile` completion, so `ProtectedRoute` sees `user` exists + `profile` is null = redirects to `/onboarding`.

2. **Plan generation flicker**: `handleDeletePlan` in `Plan.tsx` (line 583) navigates to `/plan/reset` after deleting. `/plan/reset` is a full multi-step page that checks for existing plans, shows intent selection, etc. This is route-based state management.

---

## Fix 1: Auth Resolution Gate

### What changes

**`src/contexts/AuthContext.tsx`**

Remove the `setTimeout` wrapper entirely. The deadlock concern it was solving (Supabase SDK lock) is handled by structuring the code differently:

- Add a `profileLoaded` state (boolean, default `false`)
- `loading` stays `true` until BOTH auth is resolved AND profile fetch completes (or confirms no user)
- In `onAuthStateChange`: set user/session, then directly call `fetchProfile` (no setTimeout). Only set `loading = false` after `fetchProfile` resolves.
- In `initSession`: same pattern -- `setLoading(false)` only after `fetchProfile` completes.
- Key change: `fetchProfile` itself will call `setLoading(false)` at the end, guaranteeing no gap.

The critical fix is making `loading` a composite gate:
```
loading = true  until  (auth resolved + profile fetched)
```

No route renders until `loading === false`, which means `user` and `profile` are both settled.

**`src/components/ProtectedRoute.tsx`** and **`src/components/AuthRoute.tsx`**

No changes needed -- they already check `loading` and show a spinner. The fix is entirely in AuthContext ensuring `loading` stays `true` long enough.

---

## Fix 2: Inline Plan Generation (Remove Route-Based Loading)

### What changes

**`src/pages/Plan.tsx`**

Replace the current `handleDeletePlan` flow (which navigates to `/plan/reset`) with an inline generation flow:

- Add state: `isRegenerating` (boolean)
- New function `handleRegeneratePlan`:
  1. Set `isRegenerating = true`
  2. Archive current plan (existing logic)
  3. Delete current plan from database
  4. Call `supabase.functions.invoke('generate-plan')` with current profile data
  5. On success: reload plan data in-place, set `isRegenerating = false`
  6. On failure: show error toast, set `isRegenerating = false`
  7. No navigation at all -- the plan data refreshes in the same component

- When `isRegenerating === true`, render a full-page loading overlay (same style as onboarding):
  - "Generating your execution plan..."
  - "This may take a few seconds."
  - Spinner animation

- Update `DeletePlanDialog` `onConfirm` to call `handleRegeneratePlan` instead of `handleDeletePlan`

- Remove the old `handleDeletePlan` function (or keep it but don't navigate)

**`src/pages/PlanNew.tsx`** -- Keep as redirect to `/plan/reset` (backward compat for bookmarks)

**`src/pages/PlanReset.tsx`** -- Keep unchanged (still needed for first-time users who have no plan yet after onboarding edge cases)

The `/plan/reset` route stays for users who genuinely have no plan. But the "Generate New Plan" button on `/plan` no longer navigates away -- it handles everything inline.

---

## Implementation Sequence
1. Fix AuthContext loading gate (eliminates onboarding flash)
2. Add inline plan regeneration to Plan.tsx (eliminates /plan/reset flicker)

## Files Modified
- `src/contexts/AuthContext.tsx` -- Fix loading state to be a proper resolution gate
- `src/pages/Plan.tsx` -- Inline plan regeneration with full-page loading overlay

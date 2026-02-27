

## Root Cause Analysis

### The Problem
**Google Sign-In** uses `supabase.auth.signInWithOAuth()` directly (line 222 of `AuthContext.tsx`) instead of the Lovable Cloud auth bridge (`lovable.auth.signInWithOAuth()`). This bypasses the managed credentials and callback handling that Lovable Cloud provides.

Additionally, `clearPartialSession()` is called **before** OAuth redirect, which wipes Supabase's PKCE code verifier from localStorage. When the user returns from Google, Supabase cannot complete the code exchange because the verifier is gone. Result: no session.

**Apple Sign-In** correctly uses `lovable.auth.signInWithOAuth('apple', ...)` but its `redirect_uri` points to `/onboarding` (a ProtectedRoute), which may cause redirect loops on return.

### Why It Broke
Recent routing and onboarding changes didn't touch the Google auth flow, but the `clearPartialSession()` function strips all `sb-*` keys from localStorage -- including the PKCE `code_verifier` that Supabase stores before redirect. This was always a latent bug, but may have started manifesting after other auth flow changes.

---

## Changes Required

### 1. Fix Google Sign-In to use Lovable Cloud bridge (`src/contexts/AuthContext.tsx`)

Replace `supabase.auth.signInWithOAuth()` with `lovable.auth.signInWithOAuth('google', ...)` -- identical to how Apple is already handled. This ensures:
- Managed Google OAuth credentials are used
- Callback handling works through the Lovable Cloud bridge
- No PKCE code verifier dependency

The `signInWithGoogle` function becomes:
```typescript
const signInWithGoogle = useCallback(async () => {
  try {
    const { error } = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: window.location.origin,
    });
    if (error) {
      return { error: { message: error.message || 'Sign in failed. Please try again.' } };
    }
    return { error: null };
  } catch (err) {
    return { error: { message: 'Sign in failed. Please try again.' } };
  }
}, []);
```

Key changes:
- Use `lovable.auth.signInWithOAuth` instead of `supabase.auth.signInWithOAuth`
- Remove `clearPartialSession()` calls (destructive to PKCE state)
- Set `redirect_uri` to origin root (not `/onboarding`)
- Remove `requiresRedirectAuth` import (no longer needed)

### 2. Fix Apple redirect_uri (`src/pages/Auth.tsx`)

Change Apple's `redirect_uri` from `/onboarding` to `window.location.origin`:
```typescript
const { error } = await lovable.auth.signInWithOAuth('apple', {
  redirect_uri: window.location.origin,
});
```

This prevents landing on a ProtectedRoute before the session is established.

### 3. Remove dangerous `clearPartialSession` from OAuth flows (`src/contexts/AuthContext.tsx`)

Remove all `clearPartialSession()` calls from `signInWithGoogle`. Keep the one in `TOKEN_REFRESHED` handler (that's a legitimate use case for clearing stale state).

### 4. Add `lovable` import to AuthContext

Add: `import { lovable } from '@/integrations/lovable';`
Remove: `import { requiresRedirectAuth, clearPartialSession } from '@/lib/browserDetection';` (keep only `clearPartialSession` for the TOKEN_REFRESHED handler -- actually we still need it there, so just remove `requiresRedirectAuth`).

---

## Files Modified
1. **`src/contexts/AuthContext.tsx`** -- Rewrite `signInWithGoogle` to use lovable bridge, remove destructive `clearPartialSession` calls, add lovable import
2. **`src/pages/Auth.tsx`** -- Fix Apple `redirect_uri` to use origin instead of `/onboarding`

## Post-Fix Auth Flow
1. User clicks "Sign in with Google/Apple"
2. Lovable Cloud bridge redirects to provider
3. Provider redirects back to Lovable's managed callback
4. Lovable bridge processes tokens and redirects to `redirect_uri` (origin `/`)
5. `onAuthStateChange` fires with session
6. `AuthRoute` on `/auth` (or landing page routing) detects user and redirects to `/onboarding` or `/today` based on profile status
7. No flicker, no intermediate routes

## Hardening
- Single auth bridge (`lovable.auth`) for all OAuth providers
- No localStorage manipulation before OAuth redirects
- Redirect URIs point to non-protected routes
- `onAuthStateChange` listener remains global in `AuthProvider`, mounted once

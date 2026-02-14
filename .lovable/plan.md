

# Fix: Infinite Loading Screen (Auth Deadlock)

## Root Cause

In `src/contexts/AuthContext.tsx` (lines 140-176), the `onAuthStateChange` callback is `async` and `await`s `fetchProfile()`. Supabase's JS SDK holds an internal lock during auth state change dispatch. The `await` suspends the callback mid-execution, preventing the lock from releasing. Meanwhile, `initSession()` calls `getSession()` which also needs that lock -- creating a deadlock. Both hang forever, `loading` never becomes `false`.

## Solution

**Do not `await` inside `onAuthStateChange`**. Instead, use the callback only to set `user` and `session`, then trigger profile fetching in a **separate `useEffect`** that watches the `user` state.

## Changes to `src/contexts/AuthContext.tsx`

### 1. Make `onAuthStateChange` synchronous (no await)

Replace the async callback with a synchronous one that only sets `user`, `session`, and handles sign-out/error cases. It should NOT call `fetchProfile` or `setLoading(false)`.

### 2. Remove `initSession` function entirely

The `onAuthStateChange` listener already fires an `INITIAL_SESSION` event which provides the current session. There is no need for a separate `getSession()` call -- that is what causes the deadlock.

### 3. Add a `useEffect` that watches `user` to fetch the profile

```text
useEffect:
  dependency: [user]
  if user is null:
    setProfile(null)
    setLoading(false)   // no user = auth resolved, done
    return
  if user exists:
    fetchProfile(user.id).then(() => setLoading(false))
```

This guarantees:
- The Supabase lock is never held during a network request
- `loading` stays `true` until the profile fetch completes (or confirms no profile)
- No race condition between two parallel code paths

### 4. Handle the initial "no session" case

When `onAuthStateChange` fires with `INITIAL_SESSION` and `session` is `null`, the user state becomes `null`. The `useEffect([user])` sees `user === null` and sets `loading = false`. The landing page renders.

## Resulting Flow

```text
App mounts
  -> onAuthStateChange registered
  -> INITIAL_SESSION fires (sync, no await)
  -> sets user + session (or null)
  -> useEffect([user]) runs
     -> user exists: fetchProfile, then setLoading(false)
     -> user null: setLoading(false) immediately
  -> Routes render with settled state
```

## Files Modified
- `src/contexts/AuthContext.tsx` -- restructure to avoid awaiting inside onAuthStateChange

## What This Fixes
- Infinite loading screen caused by Supabase SDK internal lock deadlock
- No behavioral change to the auth flow -- same end result, just no deadlock

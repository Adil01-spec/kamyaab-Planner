

# Strategic Access Control, Email Verification & Abuse Discouragement

## Overview

This plan implements a trust-preserving access control system for Strategic Planning that discourages abuse, protects AI costs, and maintains a calm, respectful user experience. The system prioritizes continuity over confrontation, making new account abuse inconvenient without being punitive.

---

## High-Level Architecture

```text
+------------------+     +-------------------+     +------------------+
|  Email/Password  |---->|  OTP Verification |---->|  Profile Setup   |
|     Signup       |     |  (Required)       |     |  (Onboarding)    |
+------------------+     +-------------------+     +------------------+
                                                           |
                              +----------------------------+
                              |
                              v
+------------------+     +-------------------+     +------------------+
|  Strategic       |<----|  Access Gate      |<----|  User Profile    |
|  Planning        |     |  (Eligibility)    |     |  + History       |
+------------------+     +-------------------+     +------------------+
```

---

## Part 1: Database Schema Changes

### New Columns on `profiles` Table

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| `email_verified_at` | `timestamp with time zone` | `NULL` | When email was verified via OTP |
| `email_domain_type` | `text` | `'standard'` | `'standard'`, `'disposable'`, or `'enterprise'` |
| `strategic_trial_used` | `boolean` | `false` | Whether preview trial has been consumed |
| `strategic_access_level` | `text` | `'none'` | `'none'`, `'preview'`, or `'full'` |
| `strategic_calls_lifetime` | `integer` | `0` | Total strategic AI calls made |
| `strategic_last_call_at` | `timestamp with time zone` | `NULL` | Last strategic AI call time |
| `last_plan_completed_at` | `timestamp with time zone` | `NULL` | When last plan was completed |

These columns allow deterministic access checks without complex queries.

---

## Part 2: Email Verification Flow (OTP-Based)

### Flow Overview

1. User signs up with email/password
2. Auto-generated 6-digit OTP sent to email
3. User enters OTP on verification screen
4. Once verified, `email_verified_at` is set
5. User proceeds to onboarding

### Implementation Details

**Auth Page Changes:**
- After signup, redirect to `/verify-email` instead of `/onboarding`
- Display OTP input using existing `InputOTP` component
- Calm messaging: "Please verify your email to continue planning."
- Resend button with 60-second cooldown

**New Edge Function: `send-verification-otp`**
- Generate 6-digit code
- Store hashed code with 15-minute expiry in new `email_verifications` table
- Send email via Resend API

**New Edge Function: `verify-email-otp`**
- Validate code against stored hash
- Update `profiles.email_verified_at`
- Delete verification record

**Protected Route Changes:**
- Check `email_verified_at` before allowing onboarding/planning access
- OAuth users (Google/Apple) skip OTP (already verified by provider)

---

## Part 3: Disposable Email Detection (Soft Gating)

### Approach

Server-side detection using a curated list of ~100 most common disposable domains. This is intentionally small to avoid false positives.

**Detection Timing:**
- Check domain during signup edge function
- Store result in `email_domain_type`

**Soft Restrictions for Disposable Emails:**
- `strategic_access_level` capped at `'preview'` until paid subscription
- Strategic preview scope reduced (no regeneration)
- Calm messaging: "Strategic planning works best with a stable account and ongoing history."

**No Hard Blocks:**
- Users can still sign up
- Users can still use Standard planning
- No mention of "disposable" or "temporary" in UI

---

## Part 4: Strategic Planning Access Rules

### Eligibility Logic

A user gains `'full'` Strategic access when ANY of these conditions are true:
1. Has at least 1 completed plan in `plan_history`
2. Has meaningful execution history (3+ tasks completed on current plan)
3. Has an active paid subscription (`subscription_tier` not `'standard'`)

### Strategic Trial (One-Time Preview)

For users without eligibility:
- Allow ONE strategic preview per account
- Preview is high-level only:
  - Shows strategy overview, assumptions, risks
  - Shows milestone structure
  - Does NOT show weekly task breakdown
  - Does NOT allow regeneration
- After preview: "To refine this strategy, Kaamyab needs to learn how you actually work."

### Access Level Resolution Function

```text
FUNCTION resolve_strategic_access(user):
  IF subscription_tier != 'standard':
    RETURN 'full'
  
  IF plan_history_count >= 1:
    RETURN 'full'
  
  IF completed_tasks_current_plan >= 3:
    RETURN 'full'
  
  IF strategic_trial_used = false:
    RETURN 'preview'
  
  RETURN 'none'
```

---

## Part 5: History-Dependent Strategic Quality

### Edge Function Changes: `generate-plan` and `strategic-discovery`

Add user context to AI prompts:

**With Execution History:**
```text
USER CONTEXT:
- Completed plans: 3
- Average task completion rate: 78%
- Common patterns: Tends to front-load high-priority tasks
- Previous risks encountered: Dependency delays
```

**Without History:**
```text
USER CONTEXT:
- New user with no planning history
- Generate generic strategic guidance without personalization
- Do not fabricate behavioral patterns
```

This makes strategic output feel incomplete for new accounts without lying or being preachy.

---

## Part 6: Backend Cost Protection & Throttling

### Server-Side Limits (Edge Functions)

| Limit | Value | Scope |
|-------|-------|-------|
| Strategic AI calls per account (lifetime) | 20 | `strategic_calls_lifetime` |
| Strategic regenerations per plan | 2 | Stored in `plan_json` |
| Rate limit between calls | 30 seconds | `strategic_last_call_at` |
| Cache TTL for strategic outputs | 7 days | Version hash in `plan_json` |

### Implementation

**In `generate-plan` edge function:**
1. Check `strategic_calls_lifetime` before proceeding
2. Check time since `strategic_last_call_at`
3. Increment counters after successful generation
4. Return cached plan if version hash matches

**Silent Failures:**
- When limits exceeded, return cached data if available
- If no cache, return generic error without mentioning limits
- No UI messaging about quotas or limits

---

## Part 7: UI/UX Changes

### New Components

1. **EmailVerificationPage** (`/verify-email`)
   - OTP input (6 digits)
   - "Verify Your Email" heading
   - Calm subtext: "Please verify your email to continue planning."
   - Resend button with countdown

2. **StrategicAccessGate** (wrapper component)
   - Checks eligibility before rendering Strategic toggle
   - Shows appropriate messaging based on access level
   - Never mentions abuse, fraud, or security

### Messaging Guidelines

| Scenario | Message |
|----------|---------|
| Email verification needed | "Please verify your email to continue planning." |
| Disposable email soft gate | "Strategic planning works best with a stable account and ongoing history." |
| No strategic access (new user) | "Complete a plan cycle to unlock Strategic Planning." |
| After strategic preview | "To refine this strategy, Kaamyab needs to learn how you actually work." |
| Strategic limit reached (silent) | Return cached data or generic plan |

### Words to NEVER Use
- Abuse, fraud, cheating, suspicious
- Verify, secure, protect (in context of access control)
- Limit, quota, cap (visible to users)
- Temporary, disposable, throwaway

---

## Part 8: Files to Create/Modify

### New Files

| File | Purpose |
|------|---------|
| `src/pages/VerifyEmail.tsx` | OTP verification page |
| `src/components/StrategicAccessGate.tsx` | Access control wrapper |
| `src/hooks/useStrategicAccess.ts` | Strategic eligibility hook |
| `src/lib/strategicAccessResolver.ts` | Pure function for access level resolution |
| `src/lib/disposableEmailDomains.ts` | List of common disposable domains |
| `supabase/functions/send-verification-otp/index.ts` | Send OTP email |
| `supabase/functions/verify-email-otp/index.ts` | Validate OTP |

### Modified Files

| File | Changes |
|------|---------|
| `src/App.tsx` | Add `/verify-email` route |
| `src/pages/Auth.tsx` | Redirect to verify-email after signup |
| `src/contexts/AuthContext.tsx` | Add email verification state |
| `src/components/ProtectedRoute.tsx` | Check email verification |
| `src/components/StrategicPlanningToggle.tsx` | Wrap in access gate |
| `src/pages/Onboarding.tsx` | Check strategic eligibility |
| `src/pages/PlanReset.tsx` | Check strategic eligibility |
| `supabase/functions/generate-plan/index.ts` | Add throttling, history context |
| `supabase/functions/strategic-discovery/index.ts` | Add throttling |
| `src/hooks/usePlanHistory.ts` | Export plan count check |

### Database Migration

```sql
-- Add email verification and strategic access columns to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS email_domain_type TEXT DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS strategic_trial_used BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS strategic_access_level TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS strategic_calls_lifetime INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS strategic_last_call_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS last_plan_completed_at TIMESTAMP WITH TIME ZONE;

-- Create email verifications table for OTP storage
CREATE TABLE IF NOT EXISTS email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- RLS for email_verifications
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own verifications"
  ON email_verifications FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

---

## Implementation Order

1. **Database Migration** - Add new columns and table
2. **Email Verification Flow** - Edge functions + UI
3. **Strategic Access Resolver** - Pure logic functions
4. **Strategic Access Gate Component** - UI wrapper
5. **Disposable Email Detection** - Server-side check
6. **History-Dependent Quality** - AI prompt enrichment
7. **Throttling & Caching** - Edge function updates
8. **Integration Testing** - End-to-end verification

---

## Technical Notes

### OAuth Users Skip OTP
Users signing in via Google or Apple have verified emails by definition. Set `email_verified_at` automatically on OAuth sign-in.

### Graceful Degradation
If email verification service fails, allow users through with a flag to retry later. Never block users due to infrastructure issues.

### Resend API Setup
Requires `RESEND_API_KEY` secret to be configured. Will prompt user if not already set.


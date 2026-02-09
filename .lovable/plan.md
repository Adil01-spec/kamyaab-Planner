
# Strategic Planning Access Enforcement - Implementation Plan

## Current State Analysis

### What Exists Today
1. **`strategic_trial_used` column** already exists in `profiles` table (boolean, default false)
2. **Client-side access resolver** (`src/lib/strategicAccessResolver.ts`) determines access level as:
   - `full`: Paid tier OR 1+ completed plans OR 3+ completed tasks
   - `preview`: Trial not used yet
   - `none`: Trial used and no qualifying history
3. **UI gating** (`AdaptivePlanningToggle.tsx`) disables strategic selection when access is `none`
4. **Trial marking** (`markStrategicTrialUsed()`) is called client-side when user selects strategic mode
5. **Edge function** (`generate-plan`) has:
   - Rate limiting (30s between calls)
   - Lifetime cap (20 calls for free users) - but this is a soft cap with generic error
   - No hard blocking based on `strategic_trial_used`

### Security Gap Identified
The current system has **no server-side enforcement**:
- Users can bypass UI gating by calling the edge function directly
- The `strategic_trial_used` flag is updated client-side, which is not atomic with plan creation
- The 20-call lifetime cap is a separate mechanism from the one-time trial policy
- Plan history/task count grants access, which violates the requirement that these signals should NOT unlock strategic access

## Implementation Plan

### Phase 1: Data Model Verification (No Migration Needed)
The `strategic_trial_used` column already exists with correct defaults. No schema changes required.

### Phase 2: Server-Side Access Resolution (Edge Function)

Update `supabase/functions/generate-plan/index.ts` to:

1. **Fetch strategic access state** early (before AI call):
   ```text
   - subscription_tier
   - subscription_state
   - strategic_trial_used
   ```

2. **Implement hard access check** for strategic mode requests:
   ```text
   IF subscription_tier != 'standard':
     ALLOW strategic generation
   
   ELSE IF strategic_trial_used == false:
     ALLOW strategic generation (trial)
   
   ELSE:
     BLOCK with 403 error:
     {
       "error": "STRATEGIC_ACCESS_EXHAUSTED",
       "message": "Strategic planning requires a subscription."
     }
   ```

3. **Atomic trial consumption** - only after successful plan save:
   ```text
   - Use conditional update: UPDATE profiles SET strategic_trial_used = true 
     WHERE id = user.id AND strategic_trial_used = false
   - If plan generation fails, trial is preserved
   ```

### Phase 3: Remove Conflicting Logic (Edge Function + Client)

1. **Edge function changes**:
   - Remove the "plan history count grants access" logic (lines ~53-70 in resolver)
   - Remove the "completed tasks count grants access" logic
   - Keep the 20-call lifetime cap as a backup cost control (separate from trial logic)

2. **Client-side resolver update** (`src/lib/strategicAccessResolver.ts`):
   - Remove plan history count condition
   - Remove completed tasks count condition
   - Keep only: paid tier OR trial not used
   - This ensures UI matches server truth

3. **Hook update** (`src/hooks/useStrategicAccess.ts`):
   - Remove plan history count query (no longer affects access)
   - Remove completed tasks count query (no longer affects access)
   - Simplify to only fetch subscription tier and strategic_trial_used

### Phase 4: UI Alignment

Update error handling in `src/pages/PlanReset.tsx` and `src/pages/Onboarding.tsx`:
- If edge function returns `STRATEGIC_ACCESS_EXHAUSTED`, show upgrade explanation
- Ensure no hidden retries for this specific error
- Clear messaging: "Upgrade to Pro for unlimited strategic planning"

### Phase 5: RLS Protection (Database)

Add a Row Level Security policy to prevent direct API bypass:

```text
CREATE POLICY "prevent strategic plan abuse"
ON public.plans
FOR INSERT
WITH CHECK (
  (plan_json->>'is_strategic_plan')::boolean IS NOT TRUE
  OR EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
      AND (
        subscription_tier != 'standard'
        OR strategic_trial_used = false
      )
  )
);
```

This ensures even direct Supabase client calls cannot insert strategic plans without proper access.

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/generate-plan/index.ts` | Add hard access check, atomic trial consumption |
| `src/lib/strategicAccessResolver.ts` | Remove plan history and task count conditions |
| `src/hooks/useStrategicAccess.ts` | Remove unused queries, simplify access logic |
| `src/pages/PlanReset.tsx` | Handle STRATEGIC_ACCESS_EXHAUSTED error |
| `src/pages/Onboarding.tsx` | Handle STRATEGIC_ACCESS_EXHAUSTED error |
| `src/components/StrategicAccessGate.tsx` | Remove progress indicators (no longer relevant) |
| Database migration | Add RLS policy for strategic plan abuse prevention |

## Technical Details

### Edge Function Access Check Logic

```text
// Pseudocode for generate-plan function

const isStrategicModeRequest = planContext?.strategic_mode === true;

if (isStrategicModeRequest) {
  // Fetch current strategic access state
  const { data: profile } = await adminClient
    .from('profiles')
    .select('subscription_tier, subscription_state, strategic_trial_used')
    .eq('id', user.id)
    .single();

  const isPaidUser = profile?.subscription_tier !== 'standard' 
    && profile?.subscription_state === 'active';
  const trialUsed = profile?.strategic_trial_used === true;

  // HARD BLOCK: No access
  if (!isPaidUser && trialUsed) {
    return new Response(JSON.stringify({
      error: "STRATEGIC_ACCESS_EXHAUSTED",
      message: "Strategic planning requires a subscription."
    }), { status: 403, headers: corsHeaders });
  }

  // Track if this is a trial usage (for post-save update)
  const isTrialUsage = !isPaidUser && !trialUsed;
}

// ... AI generation happens ...

// After successful plan save:
if (isStrategicMode && isTrialUsage) {
  // Atomic update - only marks if still false
  await adminClient
    .from('profiles')
    .update({ strategic_trial_used: true })
    .eq('id', user.id)
    .eq('strategic_trial_used', false);
}
```

### Client-Side Resolver Simplification

```text
function resolveStrategicAccess(input) {
  // Paid subscribers always get full access
  if (input.subscriptionTier !== 'standard' && input.subscriptionState === 'active') {
    return { level: 'full', ... };
  }

  // Disposable email users are capped at preview
  if (input.emailDomainType === 'disposable') {
    return { level: input.strategicTrialUsed ? 'none' : 'preview', ... };
  }

  // New users without history can use their one-time preview
  if (!input.strategicTrialUsed) {
    return { level: 'preview', ... };
  }

  // No access - trial used
  return { level: 'none', ... };
}
```

## What This Implementation Achieves

1. **Server-side blocking** - Edge function returns 403 for exhausted trials
2. **Atomic trial consumption** - Trial only marked after successful plan creation
3. **Race condition prevention** - Conditional update prevents double-consumption
4. **RLS protection** - Direct API calls blocked at database level
5. **UI/server parity** - Client resolver matches server logic exactly
6. **No behavioral changes to existing features** - Standard planning unaffected
7. **Cost control maintained** - AI calls blocked before they occur

## What Is NOT Changed (Per Requirements)

- Plan completion does NOT restore access
- Plan deletion does NOT restore access
- Plan reset does NOT restore access
- Onboarding reset does NOT restore access
- Task completion counts do NOT affect access
- Plan history entries do NOT affect access
- Prompts remain unchanged
- Standard planning flow unchanged

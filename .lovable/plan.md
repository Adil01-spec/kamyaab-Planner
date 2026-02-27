

## Strategic Trial Logic: Make It Global and Consistent

### Problem
The frontend prematurely marks `strategic_trial_used = true` the moment a user **toggles** strategic mode ON — before any plan is generated. This happens in two places:
- `Onboarding.tsx` line 107: `handleStrategicToggle` calls `markStrategicTrialUsed(user.id)`
- `PlanReset.tsx` line 192: `handleStrategicToggle` calls `markStrategicTrialUsed(user.id)`

If the user toggles strategic on, then goes back or cancels, the trial is already consumed. This violates the rule that trial should only be consumed on successful plan creation.

The **backend** (`generate-plan` edge function) already handles this correctly — it atomically marks `strategic_trial_used = true` only after the plan is saved successfully (lines 876-902). So the frontend calls are redundant and harmful.

### Changes Required

#### 1. Remove premature `markStrategicTrialUsed` calls from frontend

**`src/pages/Onboarding.tsx`** — In `handleStrategicToggle`, remove the `markStrategicTrialUsed(user.id)` call. The toggle should only update local UI state (`strategicModeChoice`), nothing in the database.

**`src/pages/PlanReset.tsx`** — Same fix in `handleStrategicToggle`. Remove the `markStrategicTrialUsed(user.id)` call.

#### 2. Create a centralized `canUseStrategicMode` helper

**`src/lib/strategicAccessResolver.ts`** — Add a simple helper function:

```text
canUseStrategicMode(input: StrategicAccessInput): boolean
  - If subscription tier is paid and active -> true
  - If strategic_trial_used is false -> true  
  - Otherwise -> false
```

This replaces scattered `level === 'none'` checks.

#### 3. Update both toggles to use centralized logic

Both `Onboarding.tsx` and `PlanReset.tsx` toggle handlers should:
- Check `canUseStrategicMode` (via the existing `useStrategicAccess` hook which already returns `level`)
- Only set local state — never touch the database
- Let the backend handle trial consumption

#### 4. Remove `markStrategicTrialUsed` export from `useStrategicAccess.ts`

Since the frontend should never call this, remove the exported `markStrategicTrialUsed` function to prevent future misuse. The backend handles this exclusively.

### Files Modified
1. **`src/pages/Onboarding.tsx`** — Remove `markStrategicTrialUsed` call from toggle handler, remove import
2. **`src/pages/PlanReset.tsx`** — Remove `markStrategicTrialUsed` call from toggle handler, remove import
3. **`src/hooks/useStrategicAccess.ts`** — Remove `markStrategicTrialUsed` export (or mark deprecated)
4. **`src/lib/strategicAccessResolver.ts`** — Already has `canAccessStrategicPlanning` which does exactly what's needed (no change required)

### What Already Works (No Changes Needed)
- **Backend** (`generate-plan/index.ts`): Already checks trial status server-side, blocks exhausted trials with 403, and atomically marks trial used only after successful save with conditional update (`eq('strategic_trial_used', false)`)
- **`strategicAccessResolver.ts`**: Already has `canAccessStrategicPlanning()` helper
- **`useStrategicAccess` hook**: Already returns correct `level` based on fresh DB data
- **RLS policy** `prevent_strategic_plan_abuse`: Already blocks strategic plan inserts at DB level

### Test Scenarios Covered
- **A**: Toggle on then cancel -> no DB call, trial intact
- **B**: Skip strategic in onboarding, use in reset -> trial available (never consumed prematurely)
- **C/D**: Successful strategic plan from either route -> backend marks trial used
- **E**: Generation fails -> backend never reaches trial update code
- **F**: Refresh mid-generation -> backend only marks after successful save


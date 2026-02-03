# Memory: features/adaptive-onboarding
Updated: 2026-02-03

## Overview
The onboarding and plan reset flows are now adaptive, professional, and context-aware. Key changes include:

## 1. Field of Work Flexibility
- Added 'Other' profession option that prompts for open-ended text description
- For 'Other' users, subsequent questions use textarea inputs instead of dropdowns
- Field descriptions are stored in `professionDetails.fieldDescription` and included in AI plan generation

## 2. Planning Approach Selection for 'Other' Users
- When 'Other' is selected, planning mode uses intent-based language:
  - "Execution-focused" (maps to Standard planning)
  - "Context-aware" (maps to Strategic planning)
- No internal terminology ("Standard" vs "Strategic") exposed to 'Other' users
- Optional and skippable, same as other professions

## 3. Tone Adaptation by Role
- Professional/executive tone applied to: `executive`, `business_owner`
- Casual/friendly tone for all other professions
- Tone is internal and applied consistently across:
  - Onboarding step copy
  - Plan reset flow copy
  - Project title/description prompts
  - Deadline and no-deadline messages
- Implemented via `getToneProfile()` and `getTonedCopy()` utilities in `adaptiveOnboarding.ts`

## 4. Business Owner Question Relevance
- Removed platform-centric questions (Primary Platform, Product Category)
- Replaced with neutral, responsibility-focused prompts:
  - "What type of business do you run?" (text)
  - "What are your main responsibilities?" (textarea)
  - "What is your current focus area?" (text)
- No assumptions about platform-based businesses

## 5. Strategic Questions as Additive
- Strategic Planning steps remain strictly additive
- Standard flow questions unchanged unless 'Other' or role-based tone conditions apply
- Strategic discovery and strategic planning steps only appear when strategic mode is selected

## Technical Implementation
- Core utilities in `src/lib/adaptiveOnboarding.ts`:
  - `professionConfig` - profession definitions with questions
  - `getToneProfile(profession)` - returns 'casual' or 'professional'
  - `getTonedCopy(key, tone)` - returns tone-adapted copy strings
  - `shouldShowPlanningApproachSelector(profession)` - whether to use intent labels
- `AdaptivePlanningToggle` component replaces `StrategicPlanningToggle` with profession/intent awareness
- Both Onboarding and PlanReset pages updated to use adaptive utilities

## Guardrails Maintained
- No changes to core execution logic
- No added friction or required fields
- All steps remain skippable
- Standard planning flow unchanged for existing professions

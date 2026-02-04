
# Add Structured Feedback to Advisor View

## Problem
The Advisor View (`/advisor/:shareId`) is designed for mentors and professional advisors to review plans, but unlike the Standard View (`/shared-review/:token`), it has **no feedback mechanism**. Advisors cannot share their perspective, which defeats part of the purpose of sharing with a mentor.

## Current State
| View | Plan Details | Feedback Form |
|------|-------------|---------------|
| Standard View | Basic task summary | `SharedReviewFeedbackForm` (realism, challenges, notes) |
| Advisor View | Full strategic details | None |

## Solution
Add a professional, advisor-appropriate feedback form to the Advisor View. This form should:
- Match the professional tone of the advisor view
- Use the same underlying `review_feedback` table
- Be print-friendly (hidden during print)
- Include an optional "advisor perspective" field for richer insights

## Implementation

### 1. Create `AdvisorFeedbackForm` Component
**File:** `src/components/AdvisorFeedbackForm.tsx`

A professional version of the feedback form with:
- Same core questions as `SharedReviewFeedbackForm`:
  - "Does this plan feel realistic?" (Yes/Somewhat/No)
  - "What would you challenge?" (Timeline, Scope, Resources, Priorities)
  - "What feels unclear or risky?" (text, 500 chars)
- Additional advisor-specific field:
  - "Strategic observation" (optional, 500 chars) - for deeper mentor insights
- Professional styling matching the advisor view aesthetic
- Hidden on print (`print:hidden`)
- Same localStorage-based one-time submission tracking

### 2. Modify `AdvisorView.tsx`
**File:** `src/pages/AdvisorView.tsx`

Add the `AdvisorFeedbackForm` after `AdvisorViewContent`:
```tsx
<AdvisorViewContent ... />
<AdvisorFeedbackForm sharedReviewId={data.id} />
```

### 3. Database Consideration
The existing `review_feedback` table schema already supports this:
- `unclear_or_risky` (text) - can be used for the strategic observation
- Or we can add a new optional `advisor_notes` column

**Recommended:** Use a new column `advisor_observation` to keep general feedback separate from advisor-specific insights.

### Database Migration
```sql
-- Add optional advisor observation column
ALTER TABLE review_feedback 
ADD COLUMN IF NOT EXISTS advisor_observation text;
```

## Component Design

```text
┌────────────────────────────────────────────────────────┐
│ Advisor Feedback                               [print] │
│ ─────────────────────────────────────────────────────│
│                                                        │
│ Does this plan feel realistic?                         │
│ ○ Yes   ○ Somewhat   ○ No                             │
│                                                        │
│ What would you challenge? (optional)                   │
│ [Timeline] [Scope] [Resources] [Priorities]            │
│                                                        │
│ What feels unclear or risky? (optional)                │
│ ┌────────────────────────────────────────────────┐    │
│ │ Brief observations...                          │    │
│ └────────────────────────────────────────────────┘    │
│                                           0/500        │
│                                                        │
│ Strategic observation (optional)                       │
│ ┌────────────────────────────────────────────────┐    │
│ │ Share deeper insights or recommendations...    │    │
│ └────────────────────────────────────────────────┘    │
│                                           0/500        │
│                                                        │
│ [                 Submit Feedback                 ]    │
└────────────────────────────────────────────────────────┘
```

## Technical Details

### Files to Create
1. `src/components/AdvisorFeedbackForm.tsx`
   - Professional styling with muted colors
   - Print-hidden class
   - Strategic observation textarea
   - Same submission flow as `SharedReviewFeedbackForm`

### Files to Modify
1. `src/pages/AdvisorView.tsx`
   - Import and add `AdvisorFeedbackForm` after content
   - Pass `sharedReviewId={data.id}`

2. Database migration (optional enhancement)
   - Add `advisor_observation` column to `review_feedback` table

### Styling Notes
- Use subtle card styling matching advisor view (less prominent than standard form)
- Professional heading: "Advisor Feedback" instead of "Share Your Perspective"
- Muted helper text
- Print-hidden to maintain clean PDF export

## Implementation Order
1. Create database migration to add `advisor_observation` column
2. Create `AdvisorFeedbackForm.tsx` component
3. Integrate form into `AdvisorView.tsx`
4. Test feedback submission and display

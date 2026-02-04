
# Phase 10.2: Lightweight Collaboration (Observer Model)

## Overview
Implement a calm, optional collaboration layer where plan owners can invite observers (Viewers or Commenters) who can view plans and leave comments without disrupting execution. Collaboration feels like supportive accountability, not team management.

## Architecture Summary

```text
+-------------------+     +---------------------+     +-------------------+
|   Plan Owner      | --> | plan_collaborators  | --> | Invited User      |
|   (Pro/Business)  |     | (email, role, plan) |     | (Viewer/Commenter)|
+-------------------+     +---------------------+     +-------------------+
                                   |
                                   v
+-------------------+     +---------------------+     +-------------------+
|   /plan (subtle   | --> | Collaboration Modal | --> | plan_comments     |
|   invite entry)   |     | (invite + manage)   |     | (async, immutable)|
+-------------------+     +---------------------+     +-------------------+
                                   |
                                   v
                          +---------------------+
                          | Collaborator Views  |
                          | (/plan, /review)    |
                          | Read-only + Comment |
                          +---------------------+
```

## Database Schema

### Table: `plan_collaborators`
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PRIMARY KEY DEFAULT gen_random_uuid() |
| plan_id | uuid | NOT NULL REFERENCES plans(id) ON DELETE CASCADE |
| owner_id | uuid | NOT NULL REFERENCES profiles(id) ON DELETE CASCADE |
| collaborator_email | text | NOT NULL |
| collaborator_user_id | uuid | REFERENCES profiles(id) ON DELETE SET NULL |
| role | text | NOT NULL CHECK (role IN ('viewer', 'commenter')) |
| invited_at | timestamptz | DEFAULT now() |
| accepted_at | timestamptz | NULL (set when user logs in and views) |
| UNIQUE(plan_id, collaborator_email) | | |

### Table: `plan_comments`
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PRIMARY KEY DEFAULT gen_random_uuid() |
| plan_id | uuid | NOT NULL REFERENCES plans(id) ON DELETE CASCADE |
| author_id | uuid | NOT NULL REFERENCES profiles(id) ON DELETE CASCADE |
| author_name | text | NOT NULL (snapshot at creation) |
| target_type | text | NOT NULL CHECK (target_type IN ('plan', 'task', 'insight')) |
| target_ref | text | NULL (e.g., "week-1-task-0" for task comments) |
| content | text | NOT NULL CHECK (char_length(content) <= 500) |
| created_at | timestamptz | DEFAULT now() |
| edited_at | timestamptz | NULL |
| deleted_at | timestamptz | NULL (soft delete for author only) |

### RLS Policies

**plan_collaborators:**
- Owners can SELECT, INSERT, UPDATE, DELETE their own collaborations (`owner_id = auth.uid()`)
- Collaborators can SELECT where `collaborator_user_id = auth.uid()` OR `collaborator_email` matches their verified email

**plan_comments:**
- Plan owners can SELECT all comments for their plans
- Collaborators (viewer/commenter) can SELECT comments for plans they have access to
- Commenters can INSERT comments for plans they have commenter access to
- Authors can UPDATE/DELETE (soft) their own comments only

### Security Definer Functions
```sql
-- Check if user can view a plan (owner OR collaborator)
CREATE OR REPLACE FUNCTION public.can_view_plan(_plan_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM plans WHERE id = _plan_id AND user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM plan_collaborators 
    WHERE plan_id = _plan_id 
      AND (collaborator_user_id = auth.uid() 
           OR collaborator_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  )
$$;

-- Check if user can comment on a plan
CREATE OR REPLACE FUNCTION public.can_comment_on_plan(_plan_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM plans WHERE id = _plan_id AND user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM plan_collaborators 
    WHERE plan_id = _plan_id 
      AND role = 'commenter'
      AND (collaborator_user_id = auth.uid() 
           OR collaborator_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  )
$$;
```

## Tier Gating

| Tier | Max Collaborators |
|------|-------------------|
| Standard | 0 (no UI shown) |
| Student | 0 (no UI shown) |
| Pro | 1 |
| Business | 5 |

## Files to Create

### 1. `src/lib/collaboration.ts`
Core collaboration utilities:
- `COLLABORATION_LIMITS: Record<ProductTier, number>` - tier limits
- `CollaboratorRole = 'viewer' | 'commenter'`
- `Collaborator` interface (id, email, role, accepted, etc.)
- `PlanComment` interface (id, author, content, target, timestamps)
- `getCollaboratorLimit(tier: ProductTier): number`
- `canAddCollaborator(tier: ProductTier, currentCount: number): boolean`
- `formatCommentTime(date: string): string`

### 2. `src/hooks/useCollaborators.ts`
React hook for managing collaborators:
- Fetch collaborators for a plan
- Add collaborator (email + role)
- Remove collaborator
- Update collaborator role
- Loading/error states
- Checks tier limits before operations

### 3. `src/hooks/usePlanComments.ts`
React hook for comments:
- Fetch comments for a plan (grouped by target)
- Add comment (with target_type and target_ref)
- Edit comment (author only)
- Delete comment (soft delete, author only)
- Real-time subscription optional (future)

### 4. `src/hooks/useCollaboratorAccess.ts`
Hook to check if current user is a collaborator on a plan:
- Returns `{ isOwner, isCollaborator, role, canComment }`
- Used by Plan and Review pages to adjust UI

### 5. `src/components/CollaborationButton.tsx`
Subtle entry point on /plan page:
- Small "Share with team" or "Collaborate" button
- Shows collaborator avatars/initials if any exist
- Opens collaboration modal
- Only visible for Pro/Business tiers

### 6. `src/components/CollaborationModal.tsx`
Modal for managing collaborators:
- Invite by email with role selection
- List current collaborators with status
- Remove collaborators
- Shows tier limit info
- Simple, non-overwhelming design

### 7. `src/components/CollaboratorBadge.tsx`
Small badge showing collaborator role:
- "Viewing as Viewer" or "Viewing as Commenter"
- Shown to collaborators on /plan and /review

### 8. `src/components/CommentThread.tsx`
Collapsible comment thread component:
- Shows comments for a specific target (plan, task, insight)
- Add comment input (for commenters)
- Edit/delete for own comments
- Timestamps and author attribution

### 9. `src/components/PlanCommentsSection.tsx`
Section on /review page showing all comments:
- Grouped by target (Plan-level, Tasks, Insights)
- Collapsible by default
- Only visible when comments exist OR user can comment

### 10. `src/components/TaskCommentIndicator.tsx`
Small indicator on task items:
- Shows comment count if any
- Click to expand/view comments
- Only visible on /review, NOT on /today

## Files to Modify

### 1. `src/lib/productTiers.ts`
Add new feature entries:
```typescript
'collaboration': {
  id: 'collaboration',
  name: 'Plan Collaboration',
  tier: 'pro',
  category: 'export',
  description: 'Invite observers to view and comment on your plan',
  valueExplanation: 'Share your plan with trusted advisors for feedback.',
  previewable: false,
},
'collaboration-extended': {
  id: 'collaboration-extended',
  name: 'Extended Collaboration',
  tier: 'business',
  category: 'export',
  description: 'Invite up to 5 collaborators',
  valueExplanation: 'Collaborate with a larger team.',
  previewable: false,
},
```

### 2. `src/pages/Plan.tsx`
- Import `CollaborationButton` and `useCollaboratorAccess`
- Add `CollaborationButton` in header area (subtle placement)
- Add `CollaboratorBadge` if viewing as collaborator
- For collaborators: hide task completion, timer controls, reordering
- Collaborators see read-only plan view

### 3. `src/pages/Review.tsx`
- Import `PlanCommentsSection` and `useCollaboratorAccess`
- Add `CollaboratorBadge` if viewing as collaborator
- Add `PlanCommentsSection` after External Feedback section
- Show comment indicators on insights sections

### 4. `supabase/config.toml`
No new edge functions needed - all operations use client-side Supabase SDK with RLS.

## Component Details

### CollaborationButton (on /plan header)
```text
[Share ▼] - Subtle ghost button
  └── Shows "1 collaborator" badge if any exist
  └── Click opens CollaborationModal
```

### CollaborationModal Layout
```text
┌────────────────────────────────────────┐
│ Collaborate on Your Plan               │
│ ──────────────────────────────────────│
│ Invite by email:                       │
│ ┌──────────────────────────┐ [Viewer ▼]│
│ │ colleague@example.com    │ [Invite]  │
│ └──────────────────────────┘           │
│                                        │
│ Collaborators (1 of 1 on Pro)          │
│ ┌──────────────────────────────────┐   │
│ │ [A] advisor@example.com          │   │
│ │     Commenter • Joined Mar 15    │   │
│ │     [Change Role] [Remove]       │   │
│ └──────────────────────────────────┘   │
│                                        │
│ Note: Collaborators can view your      │
│ plan and review. Commenters can also   │
│ leave feedback. They cannot modify     │
│ your tasks or execution.               │
└────────────────────────────────────────┘
```

### CommentThread Layout
```text
Plan Comments (3)  [▼ collapsed]
├── "Great strategic focus on week 1"
│   └── @advisor • 2 days ago
├── "Consider breaking down task 3"
│   └── @mentor • 1 day ago
└── [Add comment...] (if commenter)
```

## Explicit Restrictions (Enforced)

### What Collaborators CANNOT Do:
- Complete tasks
- Start/stop timers
- Reorder tasks
- Regenerate plan
- Generate insights
- Delete/archive plan
- Access /today page (or see timer state)
- Modify any plan data

### What Viewers CAN Do:
- View /plan (read-only)
- View /review (read-only)
- See strategy overview, insights, progress

### What Commenters CAN Do:
- Everything Viewers can do
- Leave comments on plan-level
- Leave comments on specific tasks (on /review only)
- Leave comments on insights
- Edit/delete their own comments

## UI/UX Guidelines

### Calm, Non-Intrusive Design:
- Collaboration entry is subtle (ghost button, not prominent)
- No notification badges or urgency signals
- Comments visible only on /review, not during execution
- No real-time presence indicators
- No @mentions or notification system
- Collapsible comment sections

### Trust Preservation:
- Owner always has full control
- Collaborators cannot infer private data
- Comments are attributed but non-confrontational
- Easy to remove collaborators at any time

## Implementation Order

1. Create database migration (tables + RLS + functions)
2. Create `src/lib/collaboration.ts` with types and utilities
3. Create `src/hooks/useCollaborators.ts`
4. Create `src/hooks/usePlanComments.ts`
5. Create `src/hooks/useCollaboratorAccess.ts`
6. Add features to `src/lib/productTiers.ts`
7. Create `src/components/CollaboratorBadge.tsx`
8. Create `src/components/CollaborationButton.tsx`
9. Create `src/components/CollaborationModal.tsx`
10. Create `src/components/CommentThread.tsx`
11. Create `src/components/TaskCommentIndicator.tsx`
12. Create `src/components/PlanCommentsSection.tsx`
13. Modify `src/pages/Plan.tsx` for collaboration UI
14. Modify `src/pages/Review.tsx` for comments

## Explicit Exclusions Checklist

- [x] No shared task ownership
- [x] No notifications
- [x] No calendars
- [x] No live presence
- [x] No execution interference
- [x] No real-time chat
- [x] No @mentions
- [x] No urgency signals
- [x] No activity feeds
- [x] No task completion by collaborators
- [x] No timer access for collaborators
- [x] No task reordering by collaborators
- [x] No plan regeneration by collaborators
- [x] No insights generation by collaborators
- [x] No notifications during execution (/today)

## Success Criteria

Users should feel:
- Supported and seen without losing autonomy
- Collaboration is calm accountability, not management
- Their plan remains theirs to execute
- Feedback is available when they seek it, not pushed on them

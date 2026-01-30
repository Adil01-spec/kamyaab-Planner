

## Shareable Review & Manual Event Control

### Overview

This implementation adds two major capabilities:

**Part A — Shareable Review & Feedback Loop**
- Generate secure, read-only shareable links for plan reviews
- Collect structured feedback from external viewers
- Display aggregated feedback to plan owners

**Part B — Manual Event Control**
- Split existing tasks into two
- Add new tasks manually to any week

Both feature sets respect Pro gating (soft), plan integrity, and never auto-modify execution state.

---

### Architecture Overview

```text
+-------------------+     +-------------------+     +-------------------+
|   /plan page      | --> | ShareReviewModal  | --> | shared_reviews    |
|  (Owner controls) |     | (Generate links)  |     | (Supabase table)  |
+-------------------+     +-------------------+     +-------------------+
                                                            |
                                                            v
+-------------------+     +-------------------+     +-------------------+
| /review/:token    | --> | SharedReviewPage  | --> | review_feedback   |
| (Public view)     |     | (Read-only view)  |     | (Supabase table)  |
+-------------------+     +-------------------+     +-------------------+
```

---

## Part A: Shareable Review & Feedback

### Database Schema Changes

**Table: `shared_reviews`**
```sql
CREATE TABLE public.shared_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Snapshot of plan at share time (for stability)
  plan_snapshot JSONB NOT NULL
);

-- RLS: Owners can manage their shares
CREATE POLICY "Owners can manage their shares"
  ON shared_reviews FOR ALL
  USING (auth.uid() = user_id);

-- Allow public select by token (for viewers)
CREATE POLICY "Anyone can view by token"
  ON shared_reviews FOR SELECT
  USING (true);
```

**Table: `review_feedback`**
```sql
CREATE TABLE public.review_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shared_review_id UUID NOT NULL REFERENCES shared_reviews(id) ON DELETE CASCADE,
  
  -- Structured feedback
  feels_realistic TEXT, -- 'yes' | 'somewhat' | 'no'
  challenge_areas TEXT[], -- ['timeline', 'scope', 'resources', 'priorities']
  unclear_or_risky TEXT, -- short text (max 500 chars)
  
  -- Metadata
  submitted_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: Anyone can insert feedback (no auth required)
CREATE POLICY "Anyone can submit feedback"
  ON review_feedback FOR INSERT
  WITH CHECK (true);

-- Owners can read feedback for their reviews
CREATE POLICY "Owners can read their feedback"
  ON review_feedback FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shared_reviews sr
      WHERE sr.id = shared_review_id AND sr.user_id = auth.uid()
    )
  );
```

---

### Files to Create

| File | Description |
|------|-------------|
| `src/components/ShareReviewModal.tsx` | Modal for generating/managing share links |
| `src/components/ShareReviewButton.tsx` | Button to open share modal (with Pro gating) |
| `src/components/ExternalFeedbackSection.tsx` | Collapsible section showing feedback on /plan |
| `src/pages/SharedReview.tsx` | Public read-only view at /review/:token |
| `src/components/SharedReviewContent.tsx` | The actual review content (reusable) |
| `src/components/SharedReviewFeedbackForm.tsx` | Structured feedback form for viewers |
| `src/lib/shareReview.ts` | Utilities for token generation, link management |
| `src/hooks/useSharedReview.ts` | Hook for fetching shared review data |
| `src/hooks/useReviewFeedback.ts` | Hook for fetching/aggregating feedback |

### Files to Modify

| File | Change |
|------|--------|
| `src/lib/productTiers.ts` | Add `share-review` and `external-feedback` features |
| `src/pages/Plan.tsx` | Add ShareReviewButton and ExternalFeedbackSection |
| `src/App.tsx` | Add `/review/:token` route |
| `supabase/config.toml` | No edge functions needed (client-side operations) |

---

### Technical Implementation Details

#### 1. Token Generation

```typescript
// src/lib/shareReview.ts
export function generateShareToken(): string {
  // 16 bytes = 128 bits of entropy, URL-safe base64
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(36)).join('');
}

export function getShareUrl(token: string): string {
  return `${window.location.origin}/review/${token}`;
}

export function getExpiryDate(days: 7 | 14 | 30): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}
```

#### 2. Share Modal Flow

```typescript
// ShareReviewModal.tsx
interface ShareReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planId: string;
  planData: PlanData;
  existingShares?: SharedReview[];
}

// States:
// 1. No active share → Show "Generate Link" with expiry options
// 2. Active share → Show link, copy button, revoke option
// 3. Multiple shares → List with management controls
```

#### 3. Shared Review Page Structure

```typescript
// src/pages/SharedReview.tsx
const SharedReview = () => {
  const { token } = useParams();
  const { data, loading, error } = useSharedReview(token);
  
  if (loading) return <LoadingState />;
  if (error || !data) return <NotFoundState />;
  if (data.revoked) return <RevokedState />;
  if (new Date(data.expires_at) < new Date()) return <ExpiredState />;
  
  return (
    <div className="min-h-screen bg-background">
      <SharedReviewContent planSnapshot={data.plan_snapshot} />
      <SharedReviewFeedbackForm sharedReviewId={data.id} />
    </div>
  );
};
```

#### 4. Shared Review Content (Read-Only)

The shared view includes:
- Plan overview, project title, description
- Strategy section (if strategic plan)
- Task structure grouped by week (completion status visible)
- Execution insights (if generated)
- Reality check summary (if generated)

**Excluded from shared view:**
- Timers
- Start/Done buttons
- Internal effort logs
- Any editable controls
- Owner's name (privacy)

#### 5. Feedback Form Structure

```typescript
interface FeedbackFormData {
  feels_realistic: 'yes' | 'somewhat' | 'no';
  challenge_areas: Array<'timeline' | 'scope' | 'resources' | 'priorities'>;
  unclear_or_risky: string; // max 500 chars
}
```

**UI Components:**
- Radio group for realism question
- Multi-select chips for challenge areas
- Short text input (500 char limit) for unclear/risky notes
- Single submit button, one submission per session (localStorage tracking)

#### 6. Feedback Aggregation (Owner View)

```typescript
// src/hooks/useReviewFeedback.ts
interface AggregatedFeedback {
  totalResponses: number;
  realism: { yes: number; somewhat: number; no: number };
  challengeAreas: Record<string, number>; // counts by area
  unclearNotes: string[]; // raw responses
}

// Displayed in ExternalFeedbackSection on /plan page
```

---

## Part B: Manual Event Control

### Task Structure (Unchanged)

Tasks remain stored in `plan_json.weeks[].tasks[]` with existing fields:
- `title`, `priority`, `estimated_hours`, `completed`, `execution_state`, etc.

### Files to Create

| File | Description |
|------|-------------|
| `src/components/AddTaskModal.tsx` | Modal for adding new tasks |
| `src/components/SplitTaskModal.tsx` | Modal for splitting existing tasks |
| `src/components/TaskQuickActionsMenu.tsx` | Context menu with Split/Edit options |
| `src/hooks/useTaskMutations.ts` | Hook for add/split task operations |

### Files to Modify

| File | Change |
|------|--------|
| `src/lib/productTiers.ts` | Add `manual-task-add` and `task-split` features |
| `src/pages/Plan.tsx` | Add "Add Task" button per week, integrate split action |
| `src/components/DraggableTaskItem.tsx` | Add context menu trigger |

---

### Technical Implementation Details

#### 1. Add Task Flow

```typescript
// AddTaskModal.tsx
interface AddTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  weekIndex: number;
  onAddTask: (task: NewTask) => Promise<void>;
}

interface NewTask {
  title: string;
  description?: string;
  priority: 'High' | 'Medium' | 'Low';
  estimated_hours: number;
}
```

**Behavior:**
- User clicks "Add Task" button (per week or global)
- Modal opens with form: title, priority, estimated hours
- On submit: task added to `plan.weeks[weekIndex].tasks[]`
- New task starts as `execution_state: 'pending'`
- No timer, no AI assumptions

#### 2. Split Task Flow

```typescript
// SplitTaskModal.tsx
interface SplitTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task;
  weekIndex: number;
  taskIndex: number;
  onSplit: (task1: Task, task2: Task) => Promise<void>;
}
```

**Behavior:**
- User selects "Split" from task context menu
- Modal shows original task with split point selector
- Options:
  - Even split (50/50 estimated time)
  - Custom split (user adjusts time allocation)
  - Title editing for both resulting tasks
- On confirm: original task removed, two new tasks inserted at same position
- Both inherit: week, priority, pending state
- Neither inherits: timer data, completion status

**Guards:**
- Cannot split if `execution_state === 'doing'`
- Cannot split if `completed === true`
- Cannot split if task has active timer

#### 3. Task Mutations Hook

```typescript
// src/hooks/useTaskMutations.ts
interface UseTaskMutationsReturn {
  addTask: (weekIndex: number, task: NewTask) => Promise<void>;
  splitTask: (weekIndex: number, taskIndex: number, task1: Task, task2: Task) => Promise<void>;
  canSplitTask: (weekIndex: number, taskIndex: number) => { allowed: boolean; reason?: string };
  isMutating: boolean;
}
```

**Implementation pattern:**
- Follows existing `useCrossWeekTaskMove` pattern
- Optimistic updates with rollback
- Persists to Supabase `plan_json`
- No AI regeneration triggered

#### 4. Integration Points

**Add Task Button (per week):**
```tsx
// In Plan.tsx, inside each week's CardContent
{isActiveWeek && (
  <Button
    variant="ghost"
    size="sm"
    onClick={() => setAddTaskModalWeek(weekIndex)}
    className="w-full border-dashed border-2 border-muted-foreground/20 mt-2"
  >
    <Plus className="w-4 h-4 mr-2" />
    Add Task
  </Button>
)}
```

**Split Action (task context menu):**
```tsx
// In DraggableTaskItem.tsx or via TaskQuickActionsMenu
<DropdownMenu>
  <DropdownMenuItem onClick={() => onSplitTask()}>
    <Scissors className="w-4 h-4 mr-2" />
    Split Task
  </DropdownMenuItem>
</DropdownMenu>
```

---

## Pro Gating Strategy

| Feature | Pro Gate | Behavior |
|---------|----------|----------|
| Share Review | Yes | Free users see upsell toast on click |
| External Feedback | Yes | Same as above |
| Add Task Manually | Yes | Free users see upsell toast |
| Split Task | Yes | Free users see upsell toast |

**No hard paywalls.** All features visible, gated via soft messaging.

```typescript
// Example gating pattern (consistent with existing)
const { hasAccess, trackInterest } = useFeatureAccess('share-review', planData);

const handleShare = () => {
  if (!hasAccess) {
    trackInterest('attempted');
    toast({
      title: 'Pro Feature',
      description: 'Share Review is available with Strategic Planning.',
    });
    return;
  }
  setShareModalOpen(true);
};
```

---

## Routing Changes

**New route in App.tsx:**
```tsx
// Public route (no auth required)
<Route path="/review/:token" element={<SharedReview />} />
```

---

## Guardrails (Enforced)

| Constraint | Implementation |
|------------|----------------|
| Read-only shared views | No mutation endpoints exposed on shared review page |
| No timer/execution modification | Share creates snapshot, mutations use plan_json only |
| No AI regeneration | All operations are pure array manipulations |
| Locked week respect | Add/split only allowed on active week |
| /today integrity | No changes to today task selector logic |
| Execution state preserved | Split creates two `pending` tasks, never `doing` or `done` |

---

## Feedback → Future Planning (Subtle)

When user resets plan or creates new strategic plan, optionally show:

```typescript
// In PlanReset.tsx, after loading existing feedback
{previousFeedback?.length > 0 && (
  <Card className="bg-muted/30 border-muted">
    <CardContent className="py-3 flex items-center gap-2">
      <AlertCircle className="w-4 h-4 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">
        Previous reviewers flagged: {summarizeFeedback(previousFeedback)}
      </span>
      <Button variant="ghost" size="sm" onClick={() => setShowHint(false)}>
        Dismiss
      </Button>
    </CardContent>
  </Card>
)}
```

This is skippable, non-blocking, and purely informational.

---

## Implementation Order

### Phase A: Shareable Review
1. Database migration: Create `shared_reviews` and `review_feedback` tables
2. Register new features in `productTiers.ts`
3. Create `src/lib/shareReview.ts` with token utilities
4. Create `ShareReviewButton.tsx` and `ShareReviewModal.tsx`
5. Create `SharedReview.tsx` page and `SharedReviewContent.tsx`
6. Create `SharedReviewFeedbackForm.tsx`
7. Create `ExternalFeedbackSection.tsx` for /plan page
8. Add route to `App.tsx`
9. Integrate components into `Plan.tsx`

### Phase B: Manual Event Control
10. Register new features in `productTiers.ts`
11. Create `useTaskMutations.ts` hook
12. Create `AddTaskModal.tsx`
13. Create `SplitTaskModal.tsx`
14. Create or extend task context menu
15. Integrate into `Plan.tsx` and `DraggableTaskItem.tsx`

---

## Testing Checklist

**Shareable Review:**
- [ ] Generate share link with 7/14/30 day expiry
- [ ] Access shared review without authentication
- [ ] Shared view shows plan structure, no edit controls
- [ ] Submit feedback as viewer (one per session)
- [ ] Owner sees aggregated feedback in collapsible section
- [ ] Revoke link makes it inaccessible
- [ ] Expired link shows appropriate message
- [ ] Free users see Pro upsell on share attempt

**Manual Event Control:**
- [ ] Add task to active week
- [ ] New task appears in correct position
- [ ] New task participates in reordering/execution
- [ ] Split task into two with time allocation
- [ ] Split disabled for in-progress/completed tasks
- [ ] Both new tasks inherit week/priority
- [ ] Neither new task inherits timer data
- [ ] Free users see Pro upsell on add/split attempt

**Integrity:**
- [ ] /today continues to work correctly
- [ ] Timers unaffected
- [ ] Execution insights not regenerated
- [ ] No data loss on rollback scenarios

---

## Summary

This implementation delivers:

1. **External Validation** — Shareable, professional review links with structured feedback collection
2. **Internal Correction** — Manual task add/split for user control over plan structure
3. **Pro Value** — Features that make Strategic Planning tangibly worth paying for
4. **User Agency** — "The AI helps — but I'm in control"

All operations are read-only for viewers, non-destructive for owners, and maintain full compatibility with existing execution, timer, and insight systems.


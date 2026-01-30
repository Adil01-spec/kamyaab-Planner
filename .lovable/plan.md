
## Plan Review Page - Separation of Doing from Thinking

### Overview

This implementation creates a dedicated `/review` page that consolidates all reflective, analytical, and shareable features from `/plan`, leaving `/plan` focused solely on execution control.

**Core Concept:**
- `/plan` = "What am I doing?" (execution-focused)
- `/review` = "How is this going?" (insight-focused)

---

### Current State Analysis

**Components Currently on /plan to Move:**

| Component | Lines in Plan.tsx | Purpose |
|-----------|------------------|---------|
| Strategy Overview Section | 968-1087 | Strategic context (strategic plans only) |
| ExternalFeedbackSection | 1089-1092 | Aggregated feedback from shared reviews |
| PlanRealityCheck | 1094-1102 | AI-powered feasibility critique |
| ExecutionInsights | 1125-1133 | Post-execution analysis |
| CalibrationInsights | 1135-1141 | Personalized historical patterns |
| ProgressProof | 1143-1151 | Evidence of improvement over time |
| NextCycleGuidance | 1153-1159 | Data-backed suggestions |
| ShareReviewButton | 947-951 | Generate shareable links |
| StrategicReviewExportButton | 952-959 | Export PDF |

**What Remains on /plan:**
- Plan overview (title, description - brief)
- Identity statement editor
- Progress overview card
- Quick stats (project, weeks, deadline)
- Weekly calendar view
- Weekly breakdown with task list (DnD enabled)
- Milestones
- Add Task functionality
- Split Task functionality
- Calendar sync buttons

---

### Architecture

```text
+-------------------+     +-------------------+     +-------------------+
|   /home           | --> |     /plan         | --> |    /review        |
| (Dashboard)       |     | (Execution)       |     | (Reflection)      |
+-------------------+     +-------------------+     +-------------------+
        |                         |                         |
        |                    No insights               All insights
        |                    No export                 Export/Share
        |                    Task controls             Read-only
        v                         v                         v
   "View Plan"              "View Review"            All analytics
   "Plan Review"            (subtle link)            Pro gated
```

---

### Files to Create

| File | Description |
|------|-------------|
| `src/pages/Review.tsx` | New dedicated review page with all insight components |

### Files to Modify

| File | Change |
|------|--------|
| `src/pages/Plan.tsx` | Remove insight components, add "View Review" link |
| `src/pages/Home.tsx` | Add "Plan Review" entry point card |
| `src/App.tsx` | Add `/review` route (protected, requireProfile) |

---

### New Route: /review

**Route Configuration (App.tsx):**
```tsx
<Route 
  path="/review" 
  element={
    <ProtectedRoute requireProfile>
      <Review />
    </ProtectedRoute>
  } 
/>
```

---

### Review Page Structure (Order Matters)

The `/review` page renders sections in this specific order, all collapsible and collapsed by default except the overview:

1. **Plan Overview** (defaultOpen={true})
   - Project title
   - Description
   - Planning mode badge (Standard/Strategic)
   - Creation date
   - Scenario context (if available)
   - Overall progress indicator

2. **Strategy Section** (Strategic Plans Only)
   - Strategy overview (objective, why now, success definition)
   - Key assumptions
   - Risks & mitigations
   - Strategic milestones

3. **Reality Check** (if generated)
   - Feasibility assessment
   - Risk signals with severity badges
   - Focus gaps
   - Strategic blind spots
   - De-prioritization suggestions

4. **Execution Insights** (if generated)
   - Time estimation patterns
   - Effort distribution
   - Productivity patterns
   - Forward suggestions
   - Execution diagnosis

5. **Progress Review**
   - Progress trends
   - Progress timeline
   - Compared to previous plan
   - Why this improved
   - Strategic vs Standard comparison
   - Scenario patterns

6. **Calibration Insights**
   - Personalized historical patterns
   - Based on your history insights

7. **Next Cycle Guidance** (if plan completed)
   - Data-backed suggestions for next plan

8. **External Feedback** (if any)
   - Aggregated responses from shared reviews
   - Realism breakdown
   - Challenge areas
   - Comments

9. **Actions Section** (sticky or at bottom)
   - Export Strategic Review button
   - Share Review button
   - Both Pro-gated with soft upsell

---

### Technical Implementation

#### Step 1: Create Review.tsx Page

The Review page will:
- Fetch plan data and profile (same pattern as Plan.tsx)
- Render all insight components in order
- All sections collapsible, collapsed by default (except overview)
- No execution controls (no timers, no start buttons, no DnD)
- Read-only presentation

**Key Props passed to components:**
- `planData`, `planId`, `userId` for data fetching
- `cachedCritique`, `cachedInsights` from plan_json
- Callbacks for cache updates (same as Plan.tsx)

**Header:**
- "Plan Review" title
- Back to Plan button
- Back to Home button

**Layout:**
- Same max-width as /plan (max-w-5xl)
- Same glass-card styling
- Same animation patterns

#### Step 2: Modify Plan.tsx

Remove these components/sections:
- Strategy Overview collapsible section (lines 968-1087)
- ExternalFeedbackSection (lines 1089-1092)
- PlanRealityCheck (lines 1094-1102)
- ExecutionInsights (lines 1125-1133)
- CalibrationInsights (lines 1135-1141)
- ProgressProof (lines 1143-1151)
- NextCycleGuidance (lines 1153-1159)
- ShareReviewButton from header (lines 947-951)
- StrategicReviewExportButton from header (lines 952-959)

Keep these imports but remove the component usages.

Add "View Review" link near the overview section:
```tsx
<Button
  variant="ghost"
  size="sm"
  onClick={() => navigate('/review')}
  className="text-muted-foreground hover:text-foreground"
>
  View Review
  <ArrowRight className="w-4 h-4 ml-1" />
</Button>
```

#### Step 3: Modify Home.tsx

Add a "Plan Review" entry point card after the main "View Full Plan" CTA:

```tsx
{/* Plan Review Entry */}
<CursorExplosionButton
  variant="outline"
  className="w-full h-10 text-sm font-medium"
  onClick={() => navigate('/review')}
>
  <BarChart3 className="mr-2 w-4 h-4" />
  Plan Review
  <span className="ml-2 text-xs text-muted-foreground">Strategy & insights</span>
</CursorExplosionButton>
```

#### Step 4: Add Route to App.tsx

Add the protected route for `/review`:
```tsx
<Route 
  path="/review" 
  element={
    <ProtectedRoute requireProfile>
      <Review />
    </ProtectedRoute>
  } 
/>
```

---

### Review Page Component Structure

```tsx
// src/pages/Review.tsx
const Review = () => {
  // State management (similar to Plan.tsx)
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [planId, setPlanId] = useState<string | null>(null);
  const [planCreatedAt, setPlanCreatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch plan (identical to Plan.tsx)
  useEffect(() => { ... }, [user]);

  // Handlers for updating cached critiques/insights
  const handleCritiqueGenerated = useCallback(...);
  const handleInsightsGenerated = useCallback(...);

  // Progress calculation
  const progress = calculatePlanProgress(plan);

  return (
    <div className="min-h-screen bg-background pb-20 sm:pb-0">
      {/* Dynamic Background */}
      <DynamicBackground ... />

      {/* Header */}
      <header>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => navigate('/plan')}>
            <ArrowLeft /> Back to Plan
          </Button>
        </div>
        <h1>Plan Review</h1>
        <span>Strategy, insights, and progress</span>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* 1. Plan Overview */}
        <PlanOverviewCard plan={plan} profile={profile} planCreatedAt={planCreatedAt} />

        {/* 2. Strategy Section (Strategic Only) */}
        {plan?.is_strategic_plan && <StrategyOverviewSection plan={plan} />}

        {/* 3. Reality Check */}
        {planId && <PlanRealityCheck ... />}

        {/* 4. Execution Insights */}
        {planId && <ExecutionInsights ... />}

        {/* 5. Progress Proof */}
        {user && <ProgressProof ... />}

        {/* 6. Calibration Insights */}
        {user && <CalibrationInsights ... />}

        {/* 7. Next Cycle Guidance */}
        {user && progress.percent === 100 && <NextCycleGuidance ... />}

        {/* 8. External Feedback */}
        {planId && <ExternalFeedbackSection planId={planId} />}

        {/* 9. Export/Share Actions */}
        <Card className="glass-card">
          <CardContent className="py-6 flex flex-col sm:flex-row gap-3 items-center justify-center">
            <StrategicReviewExportButton ... />
            <ShareReviewButton ... />
          </CardContent>
        </Card>
      </main>

      <BottomNav currentRoute="/review" />
    </div>
  );
};
```

---

### Pro Gating on /review

| Feature | Gating |
|---------|--------|
| Page Access | All users can view |
| Strategy Section | Visible to all (content requires Strategic Plan) |
| Reality Check | Visible to all (generate requires Pro) |
| Execution Insights | Visible to all |
| Progress Proof | Visible to all |
| Export Review | Pro only (soft upsell) |
| Share Review | Pro only (soft upsell) |
| External Feedback | Pro only (soft upsell) |

Free users see all sections but export/share/feedback actions show calm upsell toasts.

---

### Navigation Flow

```text
/home
  ├── "Go to Today's Focus" → /today
  ├── "View Full Plan" → /plan
  └── "Plan Review" → /review (NEW)

/plan
  ├── "View Review" → /review (NEW)
  ├── "Back to Home" → /home
  └── Task execution controls

/review (NEW)
  ├── "Back to Plan" → /plan
  ├── "Back to Home" → /home
  └── Export/Share actions
```

---

### BottomNav Updates

The BottomNav already supports custom routes. The `/review` page should highlight appropriately or show as a sub-page of `/plan`.

---

### Guardrails (Critical)

| Constraint | Implementation |
|------------|----------------|
| No execution modification | /review has no toggleTask, no startTimer, no DnD |
| No /today impact | Review page doesn't touch timer state |
| No plan mutation | All components remain read-only |
| No new AI generation | Uses cached critiques/insights only |
| No collaboration | Single-user view only |

---

### Implementation Order

1. Create `src/pages/Review.tsx` with all insight components
2. Update `src/App.tsx` to add `/review` route
3. Update `src/pages/Plan.tsx` to remove insight sections, add "View Review" link
4. Update `src/pages/Home.tsx` to add "Plan Review" entry point
5. Test navigation flow and component rendering
6. Verify no regressions in /plan, /today, timers

---

### Testing Checklist

**Navigation:**
- [ ] /home shows "Plan Review" entry point
- [ ] /plan shows "View Review" link
- [ ] /review loads with all insight sections
- [ ] Back navigation works correctly

**/plan Execution (No Regressions):**
- [ ] Task toggling still works
- [ ] DnD reordering still works
- [ ] Timer start/stop still works
- [ ] Add Task still works
- [ ] Calendar sync still works
- [ ] No insight sections visible

**/review Content:**
- [ ] Plan overview displays correctly
- [ ] Strategy section shows for strategic plans only
- [ ] Reality Check displays (uses cached data)
- [ ] Execution Insights displays (uses cached data)
- [ ] Progress Proof shows history
- [ ] Calibration Insights shows patterns
- [ ] External Feedback aggregates responses
- [ ] Export/Share buttons visible and Pro-gated

**Pro Gating:**
- [ ] Free users see insight sections
- [ ] Free users see upsell on Export click
- [ ] Free users see upsell on Share click
- [ ] Pro users can export/share successfully

**Mobile:**
- [ ] /review is mobile-responsive
- [ ] Collapsibles work on touch
- [ ] BottomNav navigates correctly

---

### Summary

This implementation:

1. **Creates /review** - A calm, analytical space for reflection
2. **Streamlines /plan** - Pure execution focus, lighter and faster
3. **Adds clear entry points** - From /home and /plan
4. **Preserves all functionality** - Components moved, not removed
5. **Maintains Pro gating** - Export/Share remain premium features
6. **No execution side effects** - Read-only review experience

The separation makes `/plan` feel snappier and more focused while giving insights a proper home where users can reflect without distraction.

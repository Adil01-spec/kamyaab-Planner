
# Streamline Onboarding and Plan Reset for Cognitive Efficiency

---

## PART 1 -- Optimized Onboarding Flow

### Current Flow (Standard Mode): ~9-12 steps
1. Name
2. Profession (7 options)
3. Planning mode toggle (Standard/Strategic)
4. Profession questions (3-6 steps, one per question)
5. Project Title (separate screen)
6. Project Description (separate screen)
7. Deadline (separate screen)

### Current Flow (Strategic Mode): ~15-20 steps
Same as above PLUS:
- AI Discovery (5-8 sub-questions)
- 5 Strategic Planning Steps (Seniority, Scope, Horizon, Constraints, Success)

### Redesigned Onboarding Flow

**Step 1 -- Identity + Profession (merged)**
- Name input and profession selector on ONE screen
- Removes one full screen transition
- Psychological benefit: single "who are you" moment

**Step 2 -- Project Context (merged)**
- Project Title + Description + Deadline on ONE screen
- Title, description textarea, and date picker with "no deadline" checkbox
- This is the core value step -- users define what they're building
- Moved BEFORE profession details (momentum: "tell us what you want to achieve")

**Step 3 -- Generate Plan (Standard) or Continue Setup (Strategic)**
- For Standard mode: show a "Generate Plan" CTA immediately. Done. 3 steps.
- For Strategic mode: show a subtle "Add strategic context" expandable option here
- Planning mode toggle is embedded as a small toggle/link at the bottom of Step 2, not a separate screen
- Default: Standard. Strategic is opt-in via a single tap.

**Step 4 (Strategic only) -- Unified Strategic Context**
- Merge AI Discovery + Strategic Steps into ONE adaptive screen
- Replace 5 fixed steps + 5-8 AI questions with a SINGLE conversational interface
- AI asks 3-5 questions max (down from 10-13), combining seniority/role/scope/constraints into natural questions
- Example: "What's your role and who does this plan affect?" covers seniority + scope
- Example: "Any budget, team, or timeline constraints?" covers all constraints in one question
- Success definition becomes an optional field on this screen, not a separate step

**Step 5 (Strategic only) -- Review and Generate**
- Brief summary of collected strategic context
- "Generate Strategic Plan" CTA

### What Gets Removed
- Planning mode toggle as a separate screen (embedded in Step 2)
- Project Title as a separate screen (merged into Step 2)
- Project Description as a separate screen (merged into Step 2)
- 5 individual Strategic Planning Steps screens (merged into one adaptive screen)
- Scenario Tag Selector from onboarding (defer to plan reset only)

### What Gets Merged
- Name + Profession = 1 screen
- Title + Description + Deadline = 1 screen
- All 5 Strategic Steps + Discovery = 1 adaptive screen

### What Becomes Optional
- All profession-specific questions (defer post-plan, see below)
- Strategic Discovery (opt-in, not a gate)
- Success definition (optional field, not a step)

### What Gets Deferred (Post-Plan)
- Profession-specific questions (technologies, tools, stack, etc.)
- These appear as a gentle "Complete your profile" card on the /home or /plan page
- AI plan quality is preserved because project title + description + profession label provide sufficient context
- Profession details improve FUTURE plans, not the first one

### Step Count Reduction
- Standard: 9-12 steps reduced to 3 steps (67-75% reduction)
- Strategic: 15-20 steps reduced to 5 steps (67-75% reduction)

---

## PART 2 -- Optimized Plan Reset Flow

### Same Field Version (3 steps)
1. **Project Context** -- Title + Description + Deadline (pre-filled from previous plan)
2. **Optional Strategic Toggle** -- Small toggle at bottom of Step 1, not a separate screen
3. **Generate** -- If strategic, show a single adaptive context screen before generating

Step count: 1-2 steps for standard, 2-3 for strategic (down from 4-10)

### New Field Version (4 steps)
1. **Profession Selection** -- Pick new field
2. **Project Context** -- Title + Description + Deadline
3. **Optional Strategic Toggle** -- Embedded, not a screen
4. **Generate**

Step count: 2-3 steps for standard, 3-4 for strategic (down from 7-15)

### Minimal Friction Version (1 step)
- For "Same Field" returning users:
  - Show pre-filled Title + Description + Deadline on ONE screen
  - "Quick Generate" button generates immediately
  - "Customize" link expands strategic options
  - Fastest path: change title, tap generate. Done.

### Strategic Optional Path
- Strategic context is always a SINGLE expandable section, never multiple screens
- If user has `plan_memory` from previous strategic plans, auto-populate strategic context
- "Reuse previous strategy context" one-tap option

### What Gets Removed from Reset
- Intent selection screen ("Same field" / "New field") becomes a toggle on Step 1, not a separate screen
- Operating Style Hint, Next Cycle Guidance, Planning Guidance Hint -- move these to the /plan page as contextual cards instead of blocking the reset flow
- Scenario Tag Selector -- embed as an optional dropdown on the project context screen, not a separate step

---

## PART 3 -- Cognitive Load Strategy

### Where Users Were Overburdened
1. **Decision fatigue at Step 3 (Mode Toggle)**: Asking users to choose Standard vs Strategic before they've even described their project forces a premature decision
2. **Question-per-screen pattern**: Each profession question as a separate screen creates 3-6 transitions that feel like a long form
3. **Strategic mode's 10-13 question gauntlet**: Discovery (5-8) + Steps (5) = users abandon before seeing value
4. **Redundant data collection**: Seniority asked in Strategic Step 1, then role asked again in profession questions for Executive. Constraints asked in Step 4, then again for "Other" profession
5. **Project details split across 3 screens**: Title, Description, and Deadline could be one form

### How the Redesign Reduces Burnout
1. **Value-first ordering**: Users describe their project (Step 2) before any metadata. They feel progress toward their goal.
2. **Merged screens**: 3 project screens become 1. 5 strategic screens become 1. Perceived length drops dramatically.
3. **Progressive disclosure**: Strategic mode is a toggle, not a gate. Profession details are deferred. Users see their plan faster.
4. **Smart defaults**: Standard mode is default. No deadline is normalized. Strategic context reuses previous data.
5. **Immediate reward**: Standard users see "Generate Plan" on Step 3. The fastest path to value is 3 taps.

### How Strategic Intelligence Is Preserved
- The AI Discovery flow still runs, but as an embedded conversational widget on ONE screen instead of multiple
- Strategic context profile data is still collected and passed to `generate-plan`
- Profession + project description provide 80% of the context the AI needs
- Deferred profession details enhance future plans via `plan_memory`
- The `generate-plan` edge function receives the same payload structure -- no backend changes needed

### Where to Use Defaults or Inference
- **Planning mode**: Default to Standard. Infer Strategic suggestion if profession is `executive` or `business_owner`
- **Deadline**: Default to "flexible timeline" rather than forcing a date
- **Seniority**: Infer from profession (executive = senior, student = junior)
- **Planning scope**: Infer from profession (student = personal, executive = team/company)
- **Risk tolerance**: Default to "medium" unless user explicitly changes it

---

## PART 4 -- Advanced Suggestions

### Smart Auto-Fill Improvements
- Pre-fill project description from previous plan's `projectDescription` in reset flow
- Auto-suggest project titles based on profession ("Build my portfolio site" for freelancers)
- If user has completed plans before, suggest "Continue: [previous project name]" as a one-tap option

### Adaptive Questioning Ideas
- If `plan_memory` shows user has completed 3+ plans, skip profession questions entirely
- If user's previous plan was strategic, pre-select strategic mode in reset
- If user has high consistency score (>80%), reduce onboarding to 2 steps (project + generate)
- Dynamically reduce AI Discovery questions based on profession: executives get 2-3 targeted questions, students get 1-2

### Using plan_memory to Skip Questions
- If `plan_memory` contains profession data, skip profession selection in reset
- If `plan_memory.completion_speed` exists, auto-calibrate deadline suggestions
- If previous strategic context exists, offer "Reuse strategy context" one-tap
- If `plan_memory` shows consistent scenario tags, auto-suggest the most common one

### Microcopy Tone Improvements
- Replace "What's your name?" with "Let's get started" (less interrogative)
- Replace "Select your profession" with "I work as a..." (first-person, faster cognitive processing)
- Replace "Project Description" with "What does success look like?" (outcome-oriented)
- Replace "Complete Setup" with "Create My Plan" (action-oriented, ownership language)
- Add progress encouragement: "Almost there" on the last step

### "Fast Mode" vs "Deep Mode" Concept
- On first screen of reset flow, offer two paths:
  - **Quick Plan** (1-2 steps): Title + Description + Generate. For users who know what they want.
  - **Guided Setup** (3-5 steps): Full flow with strategic options. For new projects or complex initiatives.
- Quick Plan is the default for returning users
- Deep Mode (strategic) is the default for executives and business owners on first use
- The mode choice is a visual toggle at the top of the flow, not a separate decision screen

---

## Technical Implementation Summary

### Files to Modify
1. **`src/pages/Onboarding.tsx`** -- Restructure step logic: merge steps 1+2 (name+profession), merge steps 5+6+7 (project context), embed mode toggle, defer profession questions
2. **`src/pages/PlanReset.tsx`** -- Remove intent selection screen, add Quick/Guided toggle, merge project context into one screen, embed scenario selector
3. **`src/components/StrategicPlanningSteps.tsx`** -- Convert from 5 separate step renders to a single unified form with collapsible sections
4. **`src/components/StrategicDiscoveryFlow.tsx`** -- Reduce MAX_QUESTIONS from 8 to 5, embed inline instead of full-screen
5. **`src/lib/adaptiveOnboarding.ts`** -- Add `getDefaultsFromMemory()` utility, add `inferStrategicDefaults()` for auto-fill
6. **New: `src/components/DeferredProfileCard.tsx`** -- Post-plan card for completing profession-specific questions
7. **New: `src/components/UnifiedProjectStep.tsx`** -- Shared component for merged Title+Description+Deadline screen
8. **New: `src/components/UnifiedStrategicContext.tsx`** -- Single-screen strategic context collector replacing 5 steps + discovery

### No Backend Changes Required
- The `generate-plan` edge function payload structure remains identical
- Profile schema unchanged
- Strategic context profile structure unchanged
- All changes are purely frontend flow optimization

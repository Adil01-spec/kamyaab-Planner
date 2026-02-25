

# Landing Page Refactor: Strategic Positioning and Visual Hierarchy

## Overview

Refactor the Kaamyab landing page (`src/pages/Index.tsx`) to implement a sticky navigation header, updated copy emphasizing deterministic execution and adaptive behavioral memory, a refined 3-step visual hierarchy (Generate / Execute / Adapt), micro-interactions on the comparison table, and a dynamic Consistency Score visualization.

---

## Changes

### 1. Sticky Header Navigation

Add a new sticky header component at the top of the landing page with:
- Kaamyab logo/wordmark (left)
- Navigation links: "Features" (scrolls to How It Works), "Pricing" (links to /pricing)
- "Start Free" CTA button (right)
- Glassmorphic blur background (`glass` utility) with `sticky top-0 z-50`
- Show/hide shadow on scroll for polish

**File:** `src/pages/Index.tsx` (inline, or extract to `src/components/LandingHeader.tsx`)

### 2. Hero Section Copy Update

Update the sub-headline from:
> "...adaptive strategy -- so you execute with clarity, not chaos."

To:
> "Define your objective. Kaamyab generates a milestone-driven plan with **deterministic execution speed**, so you proceed with clarity, not chaos."

Use a `<strong>` tag for "deterministic execution speed" for emphasis.

### 3. "Why Most Goals Fail" Section -- Copy Enhancement

Update the three problem cards to directly contrast against Kaamyab's adaptive behavioral memory:

- **No Structure** -- Add contrast: "Kaamyab replaces guesswork with deterministic task sequencing -- each step is computed, not assumed."
- **No Roadmap** -- Add contrast: "Kaamyab's adaptive behavioral memory learns your pace and restructures your path automatically."
- **Inconsistent Action** -- Add contrast: "Kaamyab tracks execution state (idle, doing, paused, done) -- not feelings -- to maintain momentum."

### 4. "How Kaamyab Works" -- Revised 3-Step Hierarchy

Replace the current steps with product-aligned terminology:

| Step | Old Title | New Title | New Description |
|------|-----------|-----------|-----------------|
| 01 | Define Your Goal | Generate | "Describe your objective. AI builds a structured, milestone-driven execution plan with week-by-week pacing." |
| 02 | Get a Structured Plan | Execute | "Track tasks with a 4-state timer (idle, doing, paused, done). Every action is measured, not just listed." |
| 03 | Adaptive Refinement | Adapt | "Behavioral memory learns your patterns. Plans adjust to reality -- not the other way around." |

Icons updated: Target (Generate), Timer/Play (Execute), Brain/RefreshCw (Adapt).

A connecting line/arrow between the 3 cards on desktop (using CSS pseudo-elements or a thin horizontal divider) to reinforce the flow.

### 5. Comparison Table Micro-Interactions

Add hover-expand behavior to comparison table rows:
- Each row expands on hover to show a brief tooltip/description of the feature
- Use framer-motion `AnimatePresence` + `motion.tr` for smooth height animation
- Kaamyab column cells get a subtle green glow pulse on hover

Add a new comparison row: **"Adaptive behavioral memory"** (Kaamyab: checkmark, all others: X).

### 6. Dynamic Consistency Score Visualization

Add a new section between "Strategic Planning" and "Use Cases" showing an animated Consistency Score ring:
- Animated circular progress ring (SVG-based) that fills to ~87% on scroll-into-view
- Label: "Consistency Score" with subtext explaining it measures execution reliability
- Use `IntersectionObserver` to trigger the fill animation when the section enters viewport
- Accompanied by 2-3 small stat cards: "Tasks completed on time", "Avg. execution accuracy", "Streak days"
- All values are illustrative/demo (not real user data -- this is a marketing page)

---

## Technical Details

### Files Modified
- `src/pages/Index.tsx` -- Primary refactor (header, copy, steps, new section, comparison enhancements)

### Files Created (optional extraction)
- `src/components/LandingHeader.tsx` -- Sticky nav header component
- `src/components/ConsistencyScoreRing.tsx` -- Animated SVG ring + stats for the demo visualization

### Dependencies
- `framer-motion` (already installed) -- for comparison row expand animations
- `lucide-react` (already installed) -- icons: `Timer`, `Brain`, `Zap`, `Activity`
- No new packages needed

### Animation Approach
- Consistency Score ring: CSS `stroke-dashoffset` transition triggered by IntersectionObserver
- Comparison rows: framer-motion `layout` + `AnimatePresence` for smooth expand
- Header shadow: `scroll` event listener toggling a shadow class
- All animations respect `prefers-reduced-motion` via Tailwind's `motion-safe:` prefix


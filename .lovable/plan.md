

# Desktop Home Screen Redesign

## Problem Statement

The current Home screen uses a single-column layout (`max-w-xl`) that works well on mobile but feels stretched and empty on desktop. The screen has significant wasted real estate, and the design lacks the "command center" feel appropriate for a productivity dashboard on larger screens.

## Current State Analysis

**Current Layout:**
- Single column, max-width 576px (`max-w-xl`)
- Stacked vertically: Header → Quote → Identity Context → Today's Tasks → Resume CTA → Nudge → Momentum/CTAs
- Dynamic background and parallax effects exist but are underutilized
- Container is centered, leaving large margins on both sides
- All components are full-width within the narrow container

**Key Components:**
- Personal Context header (greeting, avatar, project title)
- MotivationalQuoteCard (dismissible daily quote)
- HomeIdentityContext (identity statement)
- Today's Focus section (task list with checkboxes)
- ResumeFocusCTA (active timer reminder)
- DailyNudgeBanner (once-per-day nudge)
- MomentumIndicator (segmented progress visualization)
- Action buttons (Go to Today, View Plan, Plan Review)

## Design Vision

Transform the desktop Home into a **command center dashboard** that leverages the available screen space while maintaining the calm, intentional aesthetic of Kaamyab.

**Key Principles:**
- Utilize horizontal space with a multi-column layout
- Create visual hierarchy through card elevation and positioning
- Keep mobile layout unchanged (responsive breakpoint at `lg:`)
- Maintain glassmorphism aesthetic
- No new features—just better arrangement of existing elements

## Proposed Desktop Layout

```text
┌────────────────────────────────────────────────────────────────────────────┐
│ HEADER                                                                      │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ [Greeting + Name + Project]                      [Theme] [Avatar ▾]    │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ ┌──────────────────────────────┐  ┌────────────────────────────────────────┐│
│ │                              │  │                                        ││
│ │   TODAY'S FOCUS              │  │   MOMENTUM & PROGRESS                  ││
│ │   ========================   │  │   ========================             ││
│ │                              │  │                                        ││
│ │   ☐ Task 1 title             │  │   [Progress Ring]   Week 2 of 4        ││
│ │     ~2h                      │  │      3/5            ████████░░         ││
│ │                              │  │                                        ││
│ │   ☐ Task 2 title             │  │   Today  ████████████░░░  2/3          ││
│ │     ~1h                      │  │   Week   ██████████░░░░░  4/7          ││
│ │                              │  │   Plan   ██████░░░░░░░░░  2/4          ││
│ │   ☐ Task 3 title             │  │                                        ││
│ │     ~0.5h                    │  │   ─────────────────────                ││
│ │                              │  │   🔥 3-day streak                      ││
│ │   ─────────────────────────  │  │                                        ││
│ │   Week 2 of 4                │  ├────────────────────────────────────────┤│
│ │                              │  │                                        ││
│ │   [       Start Today       ]│  │   QUICK ACTIONS                        ││
│ │                              │  │                                        ││
│ └──────────────────────────────┘  │   [Go to Today's Focus]                ││
│                                    │   [View Full Plan     →]               ││
│ ┌──────────────────────────────┐  │   [Plan Review        ]                ││
│ │                              │  │                                        ││
│ │   💡 DAILY INSIGHT           │  └────────────────────────────────────────┘│
│ │   "Small wins build..."     X│                                            │
│ │                              │  ┌────────────────────────────────────────┐│
│ │   ─────────────────────────  │  │                                        ││
│ │   This week supports your    │  │   IDENTITY CONTEXT                     ││
│ │   goal of becoming more      │  │   "This plan exists to help me..."    ││
│ │   consistent...              │  │                                        ││
│ │                              │  └────────────────────────────────────────┘│
│ └──────────────────────────────┘                                            │
│                                                                              │
└────────────────────────────────────────────────────────────────────────────┘
```

## Technical Implementation

### 1. Container Width & Layout

**Current:**
```tsx
<div className="container max-w-xl mx-auto px-5 py-8">
```

**Proposed:**
```tsx
<div className="container max-w-xl lg:max-w-6xl mx-auto px-5 py-8">
  {/* Mobile: single column */}
  {/* Desktop: two-column grid */}
  <div className="lg:grid lg:grid-cols-[1fr,400px] lg:gap-8">
    {/* Left column: Primary content */}
    <div className="space-y-6">
      {/* Header, Today's Focus, Daily Insight */}
    </div>
    
    {/* Right column: Secondary content (sidebar) */}
    <div className="hidden lg:block space-y-6">
      {/* Momentum, Quick Actions, Identity */}
    </div>
  </div>
</div>
```

### 2. Component Redistribution

| Component | Mobile Position | Desktop Position |
|-----------|-----------------|------------------|
| Header | Top | Top (spans both columns) |
| ReEntryBanner | Below header | Below header (spans both) |
| MotivationalQuoteCard | Below ReEntry | Left column (with identity) |
| HomeIdentityContext | Below Quote | Right column (bottom card) |
| Today's Focus | Main section | Left column (main card) |
| ResumeFocusCTA | Below Focus | Left column (in Focus card) |
| DailyNudgeBanner | Below Resume | Left column (below Focus) |
| MomentumIndicator | Bottom section | Right column (top) |
| StreakBadge | In Momentum | Right column (in Momentum) |
| Action Buttons | Bottom | Right column (Quick Actions) |

### 3. New Desktop-Only Card Component

Create a consistent card wrapper for desktop sections:

```tsx
// src/components/HomeDesktopCard.tsx
interface HomeDesktopCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function HomeDesktopCard({ title, children, className }: HomeDesktopCardProps) {
  return (
    <div 
      className={cn(
        "rounded-2xl p-5 lg:p-6",
        "bg-card/60 backdrop-blur-xl",
        "border border-border/20",
        "shadow-card",
        className
      )}
    >
      {title && (
        <h3 className="text-xs font-medium text-muted-foreground/60 uppercase tracking-widest mb-4">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}
```

### 4. Desktop Header Enhancement

Extend the header to span full width with better spacing:

```tsx
<header className="mb-6 lg:mb-10 animate-fade-in">
  <div className="flex items-center justify-between">
    {/* Left: Greeting */}
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground/80 lg:text-base">{getGreeting()}</p>
      <h2 className="text-base font-medium text-foreground/90 lg:text-xl">{profile?.fullName}</h2>
      {planData?.project_title && (
        <p className="text-xs text-muted-foreground/70 lg:text-sm">{planData.project_title}</p>
      )}
    </div>
    
    {/* Right: Actions */}
    <div className="flex items-center gap-2 lg:gap-3">
      <ThemeToggle />
      <Avatar dropdown />
    </div>
  </div>
</header>
```

### 5. Progress Ring Enhancement for Desktop

Create a larger, more prominent progress visualization for the right sidebar:

```tsx
// Enhanced TodayProgressRing with size prop
<TodayProgressRing 
  completed={completedCount} 
  total={totalCount} 
  size={isMobile ? 88 : 120}
  className="lg:mb-4"
/>
```

### 6. Quick Actions Card

A dedicated desktop card for navigation actions:

```tsx
<HomeDesktopCard title="Quick Actions" className="lg:block hidden">
  <div className="space-y-2">
    <Button className="w-full justify-start" onClick={() => navigate('/today')}>
      <Sun className="mr-2 w-4 h-4" />
      Go to Today's Focus
    </Button>
    <Button variant="ghost" className="w-full justify-between" onClick={() => navigate('/plan')}>
      View Full Plan
      <ArrowRight className="w-4 h-4" />
    </Button>
    <Button variant="outline" className="w-full border-dashed" onClick={() => navigate('/review')}>
      <BarChart3 className="mr-2 w-4 h-4" />
      Plan Review
    </Button>
  </div>
</HomeDesktopCard>
```

### 7. Responsive Breakpoints

```text
Mobile (< 1024px): 
  - Single column
  - max-w-xl
  - Current stacked layout

Desktop (≥ 1024px):
  - Two-column grid
  - max-w-6xl
  - Left: Primary focus (Today's tasks)
  - Right: Progress dashboard + Actions
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Home.tsx` | Major restructure for two-column layout |
| `src/components/HomeDesktopCard.tsx` | **Create** - Reusable card wrapper |
| `src/components/MomentumIndicator.tsx` | Add `size` prop for larger desktop version |
| `src/components/TodayProgressRing.tsx` | Add `size` prop |
| `src/components/HomeFocusCard.tsx` | Update styling for new context |

## Visual Enhancements

### Card Hierarchy
- **Primary card** (Today's Focus): More prominent shadow, subtle accent border
- **Secondary cards** (Momentum, Actions): Standard glass styling
- **Tertiary cards** (Quote, Identity): Minimal styling, lower visual weight

### Spacing
- Desktop gets more generous padding (`p-6` vs `p-5`)
- Larger gaps between cards (`gap-8` vs `gap-6`)
- Header typography scales up (`text-xl` for name)

### Hover States (Desktop Only)
- Cards get subtle lift on hover (`hover:-translate-y-0.5`)
- Task items get more pronounced hover state
- Action buttons show arrow slide on hover

## What This Does NOT Change

- Mobile layout (unchanged below `lg:` breakpoint)
- Core functionality (no logic changes)
- Component props/APIs (backward compatible)
- Authentication/data flow
- Dynamic background behavior

## Summary

This redesign transforms the desktop Home from a stretched mobile view into a purpose-built command center that:

1. Uses available screen space effectively with a two-column layout
2. Creates clear visual hierarchy between primary (tasks) and secondary (progress) content
3. Maintains the calm, glassmorphic aesthetic
4. Keeps mobile experience unchanged
5. Requires no new features—just better arrangement


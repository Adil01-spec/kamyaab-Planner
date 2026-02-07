
# Global Footer Implementation

## Overview

Create a professional, minimal footer component that appears on all public and authenticated pages throughout the Kaamyab app. The footer communicates brand legitimacy and trust without being sales-oriented or visually distracting.

## Current State

- **Existing footers**: Found minimal footers on `SharedReview.tsx` and `AdvisorView.tsx` (just "Powered by Kaamyab" text)
- **No global footer component**: Each page manages its own layout without a shared footer
- **Bottom nav exists**: Mobile devices have `BottomNav.tsx` for navigation (fixed at bottom)
- **Design tokens ready**: The app has consistent color schemes, glassmorphism patterns, and typography

## Implementation

### 1. Create Footer Component

**File**: `src/components/Footer.tsx`

The footer will include:

```text
┌─────────────────────────────────────────────────────────────────────┐
│                           [Divider Line]                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  ┌────────┐  │
│  │ BRAND       │  │ PRODUCT      │  │ COMPANY       │  │ SOCIAL │  │
│  │             │  │              │  │               │  │        │  │
│  │ Kaamyab     │  │ Home         │  │ About         │  │ X      │  │
│  │ "Plan       │  │ Plan         │  │ Privacy       │  │ LI     │  │
│  │  better..." │  │ Review       │  │ Terms         │  │ IG     │  │
│  │             │  │ Pricing      │  │ Contact       │  │ GH     │  │
│  │             │  │ Help Center  │  │               │  │        │  │
│  └─────────────┘  └──────────────┘  └───────────────┘  └────────┘  │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                Made in Pakistan 🇵🇰 with ❤️                         │
│           © 2026 Kaamyab. All rights reserved.                      │
└─────────────────────────────────────────────────────────────────────┘
```

**Mobile Layout** (stacked):
- Brand section full width
- Navigation sections stacked 2x2
- Social icons in a row
- Footer statement centered

### 2. Social Icons

Using Lucide icons where available, with custom SVG for brand icons:
- **X (Twitter)**: Custom SVG (Lucide has `Twitter` but X logo differs)
- **LinkedIn**: Custom SVG (Lucide doesn't have LinkedIn brand icon)
- **Instagram**: Lucide `Instagram` icon
- **GitHub**: Lucide `Github` icon

Icons will be monochrome (`text-muted-foreground`) with `hover:text-foreground` transition.

### 3. Navigation Links

| Section | Links | Route |
|---------|-------|-------|
| Product | Home | `/home` |
| | Plan | `/plan` |
| | Review | `/review` |
| | Pricing | `/pricing` |
| | Help Center | `/help` (placeholder) |
| Company | About Kaamyab | `/about` (placeholder) |
| | Privacy Policy | `/privacy` (placeholder) |
| | Terms of Service | `/terms` |
| | Contact | `/contact` (placeholder) |

**Note**: Non-existent pages will link to placeholder routes that can be implemented later. Links will use React Router's `Link` component for internal navigation.

### 4. Visual Styling

- **Background**: `bg-muted/30` (soft, theme-aware)
- **Divider**: `border-t border-border/50` (subtle, low opacity)
- **Text colors**:
  - Section headers: `text-foreground font-medium`
  - Links: `text-muted-foreground hover:text-foreground`
  - Footer statement: `text-muted-foreground`
  - Copyright: `text-muted-foreground/60 text-xs`
- **No gradients, no animations**
- **Print-friendly**: `print:bg-white print:text-black`

### 5. Page Integration

Add the Footer component to these pages:

| Page | File | Notes |
|------|------|-------|
| Index (loading) | `src/pages/Index.tsx` | Skip (loading screen only) |
| Auth | `src/pages/Auth.tsx` | Add footer at bottom |
| Onboarding | `src/pages/Onboarding.tsx` | Add footer at bottom |
| Home | `src/pages/Home.tsx` | Add footer, account for mobile nav spacing |
| Today | `src/pages/Today.tsx` | Add footer, account for mobile nav |
| Plan | `src/pages/Plan.tsx` | Add footer |
| PlanNew | `src/pages/PlanNew.tsx` | Add footer |
| PlanReset | `src/pages/PlanReset.tsx` | Add footer |
| Review | `src/pages/Review.tsx` | Add footer |
| Pricing | `src/pages/Pricing.tsx` | Add footer |
| Terms | `src/pages/Terms.tsx` | Add footer |
| SharedReview | `src/pages/SharedReview.tsx` | Replace existing footer |
| AdvisorView | `src/pages/AdvisorView.tsx` | Replace existing footer |
| NotFound | `src/pages/NotFound.tsx` | Add footer |

### 6. Mobile Considerations

- **Bottom nav clearance**: On pages with `BottomNav`, add `pb-20` to ensure content isn't hidden behind the fixed nav
- **Stacked layout**: Use `flex-col` on small screens, `flex-row` on `sm:` breakpoint and above
- **Touch targets**: All links have minimum 44px touch target height
- **Safe area**: Include `safe-area-bottom` utility for iOS devices

### 7. Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/Footer.tsx` | **Create** | New global footer component |
| `src/pages/Auth.tsx` | **Modify** | Import and add Footer |
| `src/pages/Onboarding.tsx` | **Modify** | Import and add Footer |
| `src/pages/Home.tsx` | **Modify** | Import and add Footer |
| `src/pages/Today.tsx` | **Modify** | Import and add Footer |
| `src/pages/Plan.tsx` | **Modify** | Import and add Footer |
| `src/pages/PlanNew.tsx` | **Modify** | Import and add Footer |
| `src/pages/PlanReset.tsx` | **Modify** | Import and add Footer |
| `src/pages/Review.tsx` | **Modify** | Import and add Footer |
| `src/pages/Pricing.tsx` | **Modify** | Import and add Footer |
| `src/pages/Terms.tsx` | **Modify** | Import and add Footer |
| `src/pages/SharedReview.tsx` | **Modify** | Replace inline footer with component |
| `src/pages/AdvisorView.tsx` | **Modify** | Replace inline footer with component |
| `src/pages/NotFound.tsx` | **Modify** | Import and add Footer |

## Technical Details

### Footer Component Structure

```tsx
// src/components/Footer.tsx

import { Link } from 'react-router-dom';
import { Instagram, Github } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

// Custom X and LinkedIn SVG icons (monochrome)
const XIcon = () => (/* SVG */);
const LinkedInIcon = () => (/* SVG */);

const productLinks = [
  { label: 'Home', href: '/home' },
  { label: 'Plan', href: '/plan' },
  { label: 'Review', href: '/review' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Help Center', href: '/help' },
];

const companyLinks = [
  { label: 'About Kaamyab', href: '/about' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Contact', href: '/contact' },
];

const socialLinks = [
  { icon: XIcon, href: 'https://x.com/kaamyab', label: 'X' },
  { icon: LinkedInIcon, href: 'https://linkedin.com/company/kaamyab', label: 'LinkedIn' },
  { icon: Instagram, href: 'https://instagram.com/kaamyab', label: 'Instagram' },
  { icon: Github, href: 'https://github.com/kaamyab', label: 'GitHub' },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border/50 bg-muted/30 print:bg-white">
      <div className="container max-w-6xl mx-auto px-4 py-12">
        {/* Grid: Brand + Navigation + Social */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          {/* Product Links */}
          {/* Company Links */}
          {/* Social Icons */}
        </div>
        
        <Separator className="mb-6 bg-border/30" />
        
        {/* Footer Statement */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-1">
            Made in Pakistan 🇵🇰 with ❤️
          </p>
          <p className="text-xs text-muted-foreground/60">
            © 2026 Kaamyab. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
```

### Integration Pattern

Each page will import the footer and place it at the bottom of the content area:

```tsx
import { Footer } from '@/components/Footer';

export default function SomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      
      <main className="flex-1">
        {/* Page content */}
      </main>
      
      <Footer />
      
      {/* BottomNav (if applicable) */}
    </div>
  );
}
```

## What This Does NOT Do

- No logic changes to auth, billing, or features
- No new state management
- No API calls
- No changes to existing navigation behavior
- No marketing language or CTAs

## Verification

After implementation:

1. Footer appears on all listed pages
2. Links navigate correctly (existing routes work, placeholders go to 404)
3. Mobile layout stacks properly
4. Dark mode styling works correctly
5. Print styling is clean (no background colors, readable text)
6. Footer doesn't overlap with BottomNav on mobile
7. Social icons have proper hover states

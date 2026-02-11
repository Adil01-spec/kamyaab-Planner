

# SEO-Optimized Landing Page for Kaamyab

## Overview
Replace the current redirect-only `Index.tsx` with a full landing page, and move the redirect logic to a separate component. Create supporting SEO assets (sitemap.xml, robots.txt, structured data).

## Architecture

The current `/` route immediately redirects authenticated users. We need to preserve that behavior while showing the landing page to unauthenticated visitors.

**Approach**: Update `Index.tsx` to show the landing page for unauthenticated users and redirect authenticated users (preserving current behavior).

## Files to Create / Modify

### 1. `src/pages/Index.tsx` -- Complete Rewrite
Replace the simple redirect with a full landing page component that:
- Checks auth state: if authenticated, redirects as before (to `/today`, `/onboarding`, etc.)
- If not authenticated, renders the landing page

**Landing Page Sections:**

1. **Hero Section**
   - Headline: "Turn Goals Into Structured Action Plans"
   - Subheadline explaining adaptive AI-powered milestone planning
   - Primary CTA: "Start Free" (links to `/auth`)
   - Secondary CTA: "See How It Works" (scrolls to How It Works section)

2. **Problem Section**
   - Title: "Why Most Goals Fail"
   - Three pain points with icons: No structure, no roadmap, inconsistent action
   - Emotional but professional tone

3. **How It Works Section**
   - 3-step visual breakdown:
     - Step 1: Define Your Goal
     - Step 2: Get a Structured Plan
     - Step 3: Adaptive Refinement
   - Each step with icon, title, description

4. **Strategic Planning Highlight**
   - Explains high-level roadmap, risk assumptions, milestone architecture
   - Mentions advanced refinement available with subscription (non-salesy)
   - Uses glass-card styling

5. **Use Cases Section**
   - SEO-rich cards for: Startup roadmap, Learn coding in 90 days, Exam prep, Freelance career, Personal skill development
   - Grid layout with icons

6. **Comparison Section**
   - Table or card grid comparing Kaamyab vs Todo apps, Notion templates, Habit trackers
   - Highlights: structured plans, AI adaptation, execution tracking

7. **Final CTA Section**
   - Strong execution-focused message
   - "Start Free" button
   - Brief trust line ("No credit card required")

8. **Footer** -- Existing `Footer` component

### 2. `index.html` -- Update Meta Tags
- Title: "Kaamyab - AI Goal Planning & Execution App"
- Meta description focused on structured AI planning
- Update Open Graph tags with proper title/description
- Add SoftwareApplication JSON-LD structured data in a script tag

### 3. `public/sitemap.xml` -- New File
XML sitemap listing all public routes:
- `/` (landing)
- `/auth`
- `/pricing`
- `/privacy`
- `/refund-policy`
- `/service-policy`
- `/terms`
- `/contact`
- `/ownership`
- `/help`

### 4. `public/robots.txt` -- Update Existing
Add sitemap reference and keep existing allow rules.

## Technical Details

- **Styling**: Uses existing design tokens (glassmorphism, gradients, animations like `animate-slide-up`, `animate-fade-in`)
- **Icons**: Lucide icons (Target, Zap, Route, Shield, CheckCircle, etc.)
- **Scroll behavior**: "See How It Works" uses `document.getElementById().scrollIntoView({ behavior: 'smooth' })`
- **Responsive**: Mobile-first grid layouts (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`)
- **Semantic HTML**: Proper `section`, `article`, `h1`-`h3` hierarchy, `nav`, `main` tags
- **Structured Data**: SoftwareApplication schema embedded in `index.html` as JSON-LD
- **Auth-aware**: Uses existing `useAuth` hook to determine whether to show landing or redirect
- **No new dependencies required**

## Implementation Sequence
1. Create `public/sitemap.xml`
2. Update `public/robots.txt`
3. Update `index.html` with SEO meta tags and structured data
4. Rewrite `src/pages/Index.tsx` with the full landing page

# Memory: features/advisor-mentor-view

## Overview

Phase 9.5 introduces an **Advisor/Mentor Read-Only View** at `/advisor/:shareId` that provides professional visibility of a user's plan review for external stakeholders (mentors, managers, advisors) without any control or editing capabilities.

## Route & Components

- **Route**: `/advisor/:shareId` (public, no auth required)
- **Page**: `src/pages/AdvisorView.tsx`
- **Content**: `src/components/AdvisorViewContent.tsx`
- **Share Modal**: `src/components/ShareReviewModal.tsx` (enhanced with link type selection)

## Content Displayed

1. **Plan Overview** - Title, duration, progress
2. **Strategy Overview** - Objective, why now, success definition (strategic plans only)
3. **Plan Reality Check** - Feasibility assessment, risk signals, focus gaps
4. **Execution Insights** - Primary/secondary patterns, forward suggestions
5. **Planning Style Profile** - Style dimensions and AI summary (if available in snapshot)
6. **Weekly Structure** - Summary of weeks with completion progress

## Strict Exclusions

- ❌ No timers
- ❌ No execution buttons
- ❌ No editing controls
- ❌ No reordering
- ❌ No comments or feedback form
- ❌ No suggestions or recommendations
- ❌ No AI regeneration triggers
- ❌ No user identifiers (email, name, auth data)

## Share Link Behavior

- Token-based secure links using `generateShareToken()`
- Two link types: **Advisor View** (enhanced) and **Standard View** (basic with feedback)
- Links are revocable - revoking invalidates both link types
- Links can be regenerated (new token invalidates old)
- Configurable expiry: 7, 14, or 30 days
- Not indexed by search engines (`noindex` meta tag)

## Privacy Rules

- No personal identifiers exposed
- No email or auth data visible
- Plan snapshot stored at share time (immutable)
- Expiry date clearly displayed

## Pro Gating

- Feature registered as `advisor-view` in `productTiers.ts`
- Share functionality gated via `share-review` feature
- Free users cannot generate links (see preview/toast)
- Pro users have full link management capabilities

## Print Support

- Print-friendly layout with `print:` Tailwind classes
- Removes interactive elements when printed
- Professional, executive presentation

## Design Principles

- **Calm, professional tone** - No flashy animations or CTAs
- **Read-only visual design** - Clear distinction from editable views
- **Trust preservation** - "I can show my thinking without losing control"
- **No execution impact** - Viewing does not affect plan state

## Storage

Uses existing `shared_reviews` table with `plan_snapshot` JSONB containing:
- Full plan data
- Reality check (if generated)
- Execution insights (if generated)
- Planning style profile (if available)

## Related Features

- `share-review` - Base sharing infrastructure
- `external-feedback` - Feedback collection (standard view only)
- `planning-style-profile` - Displayed in advisor view if available



# Ownership & Operator Information Page

## Overview
Create a new static page at `/ownership` displaying operator transparency information, and add a footer link. Follows the exact layout pattern used by Terms, Privacy, and other legal pages.

## New File

### `src/pages/Ownership.tsx` — Route: `/ownership`
Minimal legal-style page with:
- Sticky header with back button and title "Ownership & Operator Information"
- Last updated date: February 11, 2026
- Content sections (no icons, per request):
  - **Operator Statement**: Kamyaab AI is owned and operated by [FULL LEGAL NAME], independent developer based in Pakistan
  - **Platform Description**: SaaS platform delivering AI-powered planning tools electronically
  - **Contact Information**: Email (support@kamyaab-ai.com) and phone (+92-XXXXXXXXXX)
  - **Intellectual Property**: All content, software, AI systems, branding are exclusive property of the operator
  - **Closing Statement**: Commitment to transparency, integrity, and long-term user value
- Footer component at bottom
- Layout: `min-h-screen bg-background flex flex-col`, `container max-w-4xl`, prose styling — identical to Terms.tsx

## Files to Modify

### `src/App.tsx`
Add public route: `/ownership` pointing to `Ownership` component (alongside existing legal routes).

### `src/components/Footer.tsx`
Add `{ label: 'Ownership', href: '/ownership' }` to the `companyLinks` array.

## Technical Notes
- No icons in content sections (per "no decorative icons" requirement)
- No placeholders — the user must supply their actual legal name and phone number before production
- Uses same imports as other legal pages: `ArrowLeft`, `useNavigate`, `Button`, `Separator`, `Footer`
- Fully responsive, theme-aware, mobile-friendly
- No authentication required




# User Profile Page

## Overview
Make the user info section in the avatar dropdown clickable, navigating to a new `/profile` page where users can view their profile details, current subscription plan, upgrade/downgrade options, and contact information.

---

## Changes

### 1. New Profile Page (`src/pages/Profile.tsx`)

A dedicated page with the following sections:

**Profile Info Card:**
- Avatar with initials
- Full name
- Email address
- Profession and profession details
- Account created date

**Current Plan Card:**
- Current tier name with badge (Standard/Student/Pro/Business)
- Subscription state (active, trial, grace, etc.)
- Expiration date (if applicable)
- Grace period warning (if applicable)
- "View Plans & Pricing" button navigating to `/pricing`

**Contact Info Card:**
- Email address
- Link to `/contact` page for support

**Actions:**
- "Edit Profile" -- placeholder/TODO (profile editing is done during onboarding currently)
- "Log Out" button

### 2. Update Avatar Dropdown (`src/pages/Home.tsx`)

Make the user info `div` (lines 557-560) clickable:
- Wrap in a `DropdownMenuItem` or make the div an `onClick` handler
- Navigate to `/profile` on click
- Add a subtle chevron or "View Profile" hint

### 3. Register Route (`src/App.tsx`)

- Import `Profile` page
- Add protected route: `<Route path="/profile" element={<ProtectedRoute requireProfile><Profile /></ProtectedRoute>} />`

### 4. Back Navigation

- Profile page includes a back button (arrow left) navigating to `/home`

---

## Technical Details

- Uses `useAuth()` for user email, profile data
- Uses `useSubscription()` for tier, state, warning info
- Uses `getTierDisplayName()` and `formatPKRPrice()` from `subscriptionTiers.ts`
- Follows existing page patterns: `DynamicBackground`, `Footer`, consistent header with back button
- No new database changes needed -- all data already available from `profiles` table and auth context


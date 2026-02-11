

# Phase 10.3 -- Legal and Trust Infrastructure

## Overview
Create four new standalone pages (Privacy Policy, Refund Policy, Service Policy, Contact) and update the Footer to link all legal/trust pages. All pages follow the existing Terms page pattern for visual consistency.

## New Files to Create

### 1. `src/pages/Privacy.tsx` -- Route: `/privacy`
Static page following the Terms.tsx layout pattern (sticky header with back button, sectioned content with icons, Footer at bottom). Sections:
- **Information We Collect**: Account info, planning data, task history, subscription status
- **How We Use Your Data**: Plan generation, personalization, AI improvement
- **Data Storage**: Secure cloud infrastructure, encryption at rest and in transit
- **Email Communications**: Verification, account notifications (no marketing spam)
- **Third-Party Services**: Hosting provider, email provider, payment processor (named generically)
- **Your Rights**: Access, correction, deletion of personal data
- **Contact for Privacy**: Support email for privacy concerns
- **Changes to This Policy**: Notification process

### 2. `src/pages/RefundPolicy.tsx` -- Route: `/refund-policy`
Same layout pattern. Sections:
- **Subscription Model**: SaaS billing explanation
- **Refund Eligibility**: 7-day window from initial purchase
- **Partial Billing Cycles**: No refunds for partially used periods
- **Cancellation**: Access continues until billing period ends
- **How to Request**: Email support with account details
- **Processing Timeline**: 5-10 business days

### 3. `src/pages/ServicePolicy.tsx` -- Route: `/service-policy`
Same layout pattern. Sections:
- **What Kaamyab Provides**: AI-powered structured planning tool
- **User Responsibility**: Results depend on user input and execution
- **No Outcome Guarantees**: No guarantee of financial/business outcomes
- **Platform Availability**: Best-effort uptime, maintenance windows
- **Feature Availability**: May vary by subscription tier
- **Abuse Prevention**: Multiple account misuse may lead to restriction

### 4. `src/pages/Contact.tsx` -- Route: `/contact`
Same layout pattern plus a simple contact form. Includes:
- Support email display
- Business phone (placeholder)
- Registered address (placeholder format)
- Contact form: Name, Email, Message fields (client-side validation with zod, toast on submit)
- Response timeframe: "within 48 hours"

## Files to Modify

### 5. `src/App.tsx`
Add four new public routes:
```text
/privacy       -> Privacy
/refund-policy -> RefundPolicy
/service-policy -> ServicePolicy
/contact       -> Contact
```

### 6. `src/components/Footer.tsx`
Update `companyLinks` array to include all five legal/trust links:
- Privacy Policy (`/privacy`)
- Refund Policy (`/refund-policy`)
- Service Policy (`/service-policy`)
- Terms of Service (`/terms`)
- Contact (`/contact`)

Remove "About Kaamyab" (no page exists for it).

## Technical Details

- Each page imports: `ArrowLeft` + relevant lucide icons, `Link`, `useNavigate`, `Button`, `Separator`, `Footer`
- Contact form uses `react-hook-form` + `zod` for validation (name max 100, email validation, message max 1000 chars)
- Contact form submission shows a success toast (no backend needed yet -- just UI)
- All pages are static, publicly accessible, mobile responsive
- No authentication required on any of these routes
- Visual style matches existing Terms page exactly (glassmorphism-aware, theme-aware)

## Implementation Sequence
1. Create all four page files in parallel
2. Update App.tsx with new routes
3. Update Footer.tsx with new links

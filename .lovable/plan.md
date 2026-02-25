

# Scroll Animations for Landing Page

## Overview

Add performant scroll-triggered fade-in animations to all landing page sections using a CSS-first approach with a lightweight `useScrollReveal` hook. Elements will use `IntersectionObserver` to toggle a CSS class, keeping JavaScript minimal and leveraging GPU-accelerated CSS transitions.

---

## Approach: CSS + IntersectionObserver (no framer-motion overhead)

Rather than wrapping every section in `motion.div` (which adds React re-renders per element), we use a single reusable hook that applies a CSS class on intersection. This is the most performant pattern for scroll reveal:

1. Elements start with `opacity: 0; transform: translateY(24px)`
2. When they enter the viewport, a `.revealed` class is added
3. CSS transitions handle the animation on the GPU

---

## Changes

### 1. New Hook: `src/hooks/useScrollReveal.ts`

A lightweight hook that returns a `ref` callback. Uses `IntersectionObserver` with `threshold: 0.15` and `once: true` semantics (unobserves after reveal). Accepts optional config for delay and direction.

```text
useScrollReveal({ threshold?, rootMargin? }) => ref
```

- Creates one observer per hook instance
- Adds `.scroll-revealed` class on intersection
- Disconnects observer after element is revealed (fire-once)
- Respects `prefers-reduced-motion` -- skips animation and shows elements immediately

### 2. CSS Additions: `src/index.css`

Add scroll reveal base styles and the revealed state:

```css
/* Scroll reveal - GPU-accelerated */
.scroll-reveal {
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.6s ease-out, transform 0.6s ease-out;
  will-change: opacity, transform;
}

.scroll-reveal.scroll-revealed {
  opacity: 1;
  transform: translateY(0);
}

/* Staggered children variant */
.scroll-reveal-stagger > .scroll-reveal-child {
  opacity: 0;
  transform: translateY(16px);
  transition: opacity 0.5s ease-out, transform 0.5s ease-out;
}

.scroll-reveal-stagger.scroll-revealed > .scroll-reveal-child {
  opacity: 1;
  transform: translateY(0);
}

/* Stagger delays for grid children */
.scroll-reveal-stagger.scroll-revealed > .scroll-reveal-child:nth-child(1) { transition-delay: 0ms; }
.scroll-reveal-stagger.scroll-revealed > .scroll-reveal-child:nth-child(2) { transition-delay: 100ms; }
.scroll-reveal-stagger.scroll-revealed > .scroll-reveal-child:nth-child(3) { transition-delay: 200ms; }
.scroll-reveal-stagger.scroll-revealed > .scroll-reveal-child:nth-child(4) { transition-delay: 300ms; }
.scroll-reveal-stagger.scroll-revealed > .scroll-reveal-child:nth-child(5) { transition-delay: 400ms; }

/* Reduced motion: show everything immediately */
@media (prefers-reduced-motion: reduce) {
  .scroll-reveal,
  .scroll-reveal-stagger > .scroll-reveal-child {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
```

### 3. Landing Page Updates: `src/pages/Index.tsx`

Apply the hook to each major section. The hook returns a ref that gets attached to the section's content container.

Sections receiving scroll reveal:

| Section | Animation Style |
|---------|----------------|
| "Why Most Goals Fail" heading | Single fade-up |
| Problem cards (3 cards) | Staggered fade-up (100ms intervals) |
| "How Kaamyab Works" heading | Single fade-up |
| Step cards (Generate/Execute/Adapt) | Staggered fade-up |
| Strategic Planning card | Single fade-up |
| "What Can You Plan?" heading | Single fade-up |
| Use case cards (5 cards) | Staggered fade-up |
| "How Kaamyab Compares" heading | Single fade-up |
| Comparison table | Single fade-up |
| Final CTA | Single fade-up |

The Hero section is excluded (it already has `animate-slide-up` on page load).

The ConsistencyScoreRing already has its own IntersectionObserver -- no changes needed there.

Each section will look like:

```text
const problemRef = useScrollReveal();
const stepsRef = useScrollReveal();
// ...

<div ref={problemRef} className="scroll-reveal">
  <h2>Why Most Goals Fail</h2>
</div>
<div ref={problemCardsRef} className="scroll-reveal scroll-reveal-stagger">
  {cards.map(card => (
    <article className="scroll-reveal-child ...">
```

---

## Technical Details

### Performance
- CSS `will-change: opacity, transform` ensures compositor-layer promotion
- `will-change` is only set on the base class (before reveal) -- does not persist after animation
- One `IntersectionObserver` per section (lightweight, native browser API)
- No framer-motion involvement for scroll animations -- zero bundle overhead
- Fire-once pattern: observer disconnects after reveal, no ongoing observation

### Files Created
- `src/hooks/useScrollReveal.ts` -- reusable IntersectionObserver hook

### Files Modified
- `src/index.css` -- scroll reveal CSS classes
- `src/pages/Index.tsx` -- apply refs and CSS classes to sections

### Dependencies
- None new -- uses native `IntersectionObserver` API and CSS transitions

# Fluxberry AI — Design Principles & System

> **Single Source of Truth** for all UI decisions across the Fluxberry AI product.
> Every component, page, and interaction must conform to this document.

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Layout System](#2-layout-system)
3. [Spacing System](#3-spacing-system)
4. [Typography System](#4-typography-system)
5. [Color System](#5-color-system)
6. [Component System](#6-component-system)
7. [Visual Style Guidelines](#7-visual-style-guidelines)
8. [Interaction & Animation](#8-interaction--animation)
9. [Section Design Rules](#9-section-design-rules)
10. [Do's and Don'ts](#10-dos-and-donts)
11. [Inspiration Mapping](#11-inspiration-mapping)
12. [Implementation Rules](#12-implementation-rules)

---

## 1. Design Philosophy

### 1.1 AI-First Experience

Fluxberry AI is not a traditional SaaS tool — it is an **AI Hiring Operating System**. The UI must reflect this positioning at every level:

- **Intelligent** — The interface should feel like it anticipates the user's needs. Avoid showing everything at once; let AI-driven context surface the right information.
- **Dynamic** — Static screenshots and flat dashboards are forbidden in marketing surfaces. Use layered UI compositions, floating AI prompts, and interaction hints to communicate intelligence.
- **Assistive** — Every element should feel like it's guiding the user toward an outcome, not just presenting data.
- **Alive** — Subtle micro-interactions, animated counters, and smooth transitions convey a system that is always working in the background.

### 1.2 Minimalism Rules

Minimalism here is not about "less" — it is about **precision**:

- Every element must earn its place on the page. If it doesn't serve the narrative or guide the user toward action, remove it.
- Whitespace is a design tool, not empty space. Use it to create breathing room, establish hierarchy, and direct the eye.
- Reduce cognitive load: one primary action per section, one clear takeaway per viewport.
- Avoid decoration for decoration's sake. Gradients, glows, and glass effects serve hierarchy — not aesthetics alone.

### 1.3 Outcome-Driven Design

Each section on any page must answer three questions in order:

1. **What problem exists?** — Frame the pain point.
2. **How does Fluxberry solve it?** — Show the mechanism (agent, automation, intelligence).
3. **What outcome does the user get?** — Quantify or visualize the result.

Never show features in isolation. Always tie features to outcomes.

### 1.4 Avoiding Traditional SaaS Clutter

| Avoid | Replace With |
|---|---|
| Generic feature grids (6+ cards) | Focused agent narratives with context |
| Static product screenshots | Layered, annotated UI compositions |
| Walls of text | Short statements + visual hierarchy |
| Feature-first copy ("We have X") | Outcome-first copy ("You get Y") |
| Decorative illustrations | Purposeful UI mockups and data visualizations |
| Multiple competing CTAs | One primary CTA per viewport |

---

## 2. Layout System

### 2.1 Container Widths

| Context | Max Width | CSS Variable |
|---|---|---|
| **Primary content** (landing sections) | `1200px` | `--container-max` |
| **Wide content** (product showcase, full-bleed) | `1400px` | `--container-wide` |
| **Narrow content** (text-heavy, FAQ, blog) | `800px` | `--container-narrow` |
| **Navbar** | `1200px` | `--container-max` |

```css
:root {
  --container-max: 1200px;
  --container-wide: 1400px;
  --container-narrow: 800px;
}
```

### 2.2 Horizontal Padding

Consistent edge padding ensures content never touches viewport edges:

| Breakpoint | Horizontal Padding |
|---|---|
| Mobile (`< 640px`) | `16px` (1rem) |
| Tablet (`640px – 1024px`) | `24px` (1.5rem) |
| Desktop (`> 1024px`) | `32px` (2rem) |

```css
.container {
  width: 100%;
  max-width: var(--container-max);
  margin-inline: auto;
  padding-inline: 1rem;        /* mobile default */
}

@media (min-width: 640px)  { .container { padding-inline: 1.5rem; } }
@media (min-width: 1024px) { .container { padding-inline: 2rem; } }
```

### 2.3 Grid System

Use CSS Grid for layout, not Flexbox (except for single-axis alignment):

| Layout Type | Grid Configuration |
|---|---|
| **2-column feature** | `grid-template-columns: 1fr 1fr` with `gap: 32px` |
| **3-column cards** | `grid-template-columns: repeat(3, 1fr)` with `gap: 24px` |
| **Asymmetric (text + visual)** | `grid-template-columns: 5fr 7fr` or `7fr 5fr` with `gap: 48px` |
| **Single column** (mobile) | `grid-template-columns: 1fr` |

Responsive breakpoints:
- **3 columns → 2 columns** at `< 1024px`
- **2 columns → 1 column** at `< 768px`

### 2.4 Alignment Rules

- All section headings: **center-aligned**
- Section subtext/descriptions: **center-aligned**, max-width `600px`, auto margin
- Content blocks within sections: **left-aligned**
- Section label badges (e.g., "✦ Features"): **center-aligned**, above heading
- CTAs: **center-aligned** when standalone, **left-aligned** when within content blocks

---

## 3. Spacing System

> ⚠️ **CRITICAL**: No arbitrary spacing values. Every spacing decision must use a value from this scale.

### 3.1 Base Unit

The spacing system is built on an **8px base grid**:

```
4px   →  0.25rem  (--space-1)    Micro gaps (icon-to-text, badge padding)
8px   →  0.5rem   (--space-2)    Tight internal spacing
12px  →  0.75rem  (--space-3)    Small component gaps
16px  →  1rem     (--space-4)    Default component padding
20px  →  1.25rem  (--space-5)    Medium internal gaps
24px  →  1.5rem   (--space-6)    Card padding, form field gaps
32px  →  2rem     (--space-8)    Component group spacing
40px  →  2.5rem   (--space-10)   Sub-section spacing
48px  →  3rem     (--space-12)   Between content blocks within a section
64px  →  4rem     (--space-16)   Section internal top/bottom padding (mobile)
80px  →  5rem     (--space-20)   Section internal top/bottom padding (tablet)
96px  →  6rem     (--space-24)   Section internal top/bottom padding (desktop)
120px →  7.5rem   (--space-30)   Hero section padding
160px →  10rem    (--space-40)   Maximum vertical breathing room
```

### 3.2 Section Padding

Consistent vertical padding creates rhythm across the entire landing page:

| Section Type | Mobile | Tablet | Desktop |
|---|---|---|---|
| **Hero** | `80px 0` | `100px 0` | `120px 0` |
| **Standard section** | `64px 0` | `80px 0` | `96px 0` |
| **Compact section** (trust bar, CTA) | `40px 0` | `48px 0` | `64px 0` |
| **Footer** | `48px 0` | `64px 0` | `80px 0` |

```css
.section {
  padding-block: var(--space-16);   /* 64px mobile */
}
@media (min-width: 640px)  { .section { padding-block: var(--space-20); } }   /* 80px */
@media (min-width: 1024px) { .section { padding-block: var(--space-24); } }   /* 96px */
```

### 3.3 Component Spacing

| Relationship | Spacing |
|---|---|
| Section label badge → Section heading | `12px` (--space-3) |
| Section heading → Section description | `16px` (--space-4) |
| Section description → Section content | `48px` (--space-12) |
| Between cards in a grid | `24px` (--space-6) |
| Between content blocks (e.g., product items) | `32px` (--space-8) |
| Button group gap | `12px` (--space-3) |
| Icon → Text (inline) | `8px` (--space-2) |
| List item vertical gap | `16px` (--space-4) |
| Navbar height | `64px` |
| Floating navbar top offset | `16px` |

### 3.4 Vertical Rhythm Rules

1. **Never mix spacing values** — If one card uses `24px` padding, all cards in that context use `24px`.
2. **Section spacing must be symmetric** — Top and bottom padding of any section must be equal.
3. **Content blocks descend** — Spacing between elements decreases as you go deeper into the hierarchy (section → group → component → element).
4. **Scroll offset** — All anchor targets must account for the fixed navbar with `scroll-margin-top: 72px` (navbar height 64px + 8px buffer).

---

## 4. Typography System

### 4.1 Font Stack

| Role | Font | CSS Variable | Fallback |
|---|---|---|---|
| **Primary (headings + body)** | Geist Sans | `--font-sans` | `system-ui, -apple-system, sans-serif` |
| **Display (hero headings)** | Geist Sans | `--font-heading` | Same as primary |
| **Monospace (code, labels)** | Geist Mono | `--font-mono` | `ui-monospace, monospace` |

### 4.2 Type Scale

| Token | Size | Line Height | Weight | Usage |
|---|---|---|---|---|
| `--text-hero` | `56px` / `3.5rem` | `1.08` | `700` (Bold) | Hero heading only |
| `--text-display` | `44px` / `2.75rem` | `1.12` | `600` (Semibold) | Section headings |
| `--text-heading-lg` | `32px` / `2rem` | `1.2` | `600` (Semibold) | Sub-section headings, card titles (large) |
| `--text-heading` | `24px` / `1.5rem` | `1.3` | `600` (Semibold) | Card titles, component headings |
| `--text-heading-sm` | `20px` / `1.25rem` | `1.3` | `600` (Semibold) | Small headings, feature titles |
| `--text-body-lg` | `18px` / `1.125rem` | `1.6` | `400` (Regular) | Hero subtext, section descriptions |
| `--text-body` | `16px` / `1rem` | `1.6` | `400` (Regular) | Default body text |
| `--text-body-sm` | `14px` / `0.875rem` | `1.5` | `400` (Regular) | Card descriptions, secondary text |
| `--text-caption` | `13px` / `0.8125rem` | `1.4` | `500` (Medium) | Badges, labels, metadata |
| `--text-micro` | `12px` / `0.75rem` | `1.3` | `500` (Medium) | Legal text, footnotes |

**Responsive Hero Heading:**

| Breakpoint | Hero Size | Section Heading Size |
|---|---|---|
| Mobile (`< 640px`) | `36px` | `28px` |
| Tablet (`640px – 1024px`) | `44px` | `36px` |
| Desktop (`> 1024px`) | `56px` | `44px` |

### 4.3 Typography Rules

1. **No paragraph exceeds 3 lines** on desktop. If it does, rewrite or restructure.
2. **Heading max-width**: Hero headings cap at `720px`, section headings cap at `600px` — both as `max-width` with `text-balance`.
3. **Letter spacing**: Headings use `-0.02em` (tight tracking). Body text uses `0` (default). Mono/caption uses `0.01em`.
4. **Weight contrast**: Adjacent text elements must differ by at least one weight step (e.g., 600 heading → 400 body).
5. **Keyword highlighting**: Use the primary brand color (`#5561c8`) to highlight one key word or phrase in section headings. This creates visual anchor points.

---

## 5. Color System

### 5.1 Core Palette

| Token | Value | Usage |
|---|---|---|
| **Primary** | `#5561c8` (Indigo) | CTAs, keyword highlights, active states, links |
| **Primary Light** | `#6e79d6` | Hover states, light accents |
| **Primary Dark** | `#434dab` | Pressed states, dark mode primary |
| **Primary Subtle** | `#5561c8` at `8%` opacity | Badges, section labels, soft backgrounds |

### 5.2 Neutral Palette

| Token | Light Mode | Dark Mode | Usage |
|---|---|---|---|
| `--background` | `#ffffff` | `#0a0a0b` | Page background |
| `--foreground` | `#0f172a` (Slate 900) | `#fafafa` | Primary text |
| `--muted` | `#f4f4f5` (Zinc 100) | `#27272a` (Zinc 800) | Muted backgrounds, cards |
| `--muted-foreground` | `#71717a` (Zinc 500) | `#a1a1aa` (Zinc 400) | Secondary text, descriptions |
| `--border` | `#e4e4e7` (Zinc 200) | `#27272a` (Zinc 800) | Borders, dividers |
| `--border-subtle` | `#f4f4f5` (Zinc 100) | `#1c1c1e` | Subtle borders (cards, sections) |

### 5.3 Semantic Colors

| Token | Value | Usage |
|---|---|---|
| `--success` | `#22c55e` | Success states, positive metrics |
| `--warning` | `#f59e0b` | Warning states |
| `--destructive` | `#ef4444` | Error states, negative metrics |
| `--info` | `#3b82f6` | Informational elements |

### 5.4 Gradient System

| Gradient | Definition | Usage |
|---|---|---|
| **Hero gradient** | `linear-gradient(135deg, #5561c8 0%, #6e79d6 50%, #8b93e0 100%)` | Hero accent elements, primary CTA backgrounds |
| **Section fade** | `linear-gradient(180deg, var(--background) 0%, var(--muted) 100%)` | Alternating section backgrounds |
| **Card shine** | `linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%)` | Glassmorphic card highlights |
| **Text gradient** | `linear-gradient(135deg, #5561c8, #8b93e0)` | Highlighted heading keywords |
| **Dark footer** | `linear-gradient(180deg, #1e1e2e 0%, #12121a 100%)` | Footer background |

### 5.5 Color Rules

1. **Maximum 3 colors on screen** at any time: background, foreground, and one accent (primary).
2. **No pure black** (`#000000`) — use `#0f172a` (Slate 900) or darker neutrals.
3. **No pure white on colored backgrounds** — use `rgba(255,255,255,0.95)` for text on dark surfaces.
4. **Gradients are subtle** — Used for depth, not decoration. Avoid multicolor rainbow effects.
5. **Primary color is used sparingly** — Only for: CTA buttons, one highlighted word per heading, active nav items, and interactive element accents.

---

## 6. Component System

### 6.1 Buttons

#### Primary Button
```css
.btn-primary {
  background: var(--primary);             /* #5561c8 */
  color: #ffffff;
  padding: 12px 28px;                     /* --space-3 vertical, 28px horizontal */
  border-radius: 9999px;                  /* Full pill shape */
  font-size: 15px;
  font-weight: 500;
  letter-spacing: 0;
  border: none;
  cursor: pointer;
  transition: all 200ms ease;
}

.btn-primary:hover {
  background: var(--primary-light);       /* #6e79d6 */
  box-shadow: 0 4px 14px rgba(85, 97, 200, 0.4);
  transform: translateY(-1px);
}

.btn-primary:active {
  background: var(--primary-dark);        /* #434dab */
  transform: translateY(0);
  box-shadow: none;
}
```

#### Secondary Button
```css
.btn-secondary {
  background: transparent;
  color: var(--foreground);
  padding: 12px 28px;
  border-radius: 9999px;
  font-size: 15px;
  font-weight: 500;
  border: 1px solid var(--border);
  cursor: pointer;
  transition: all 200ms ease;
}

.btn-secondary:hover {
  background: var(--muted);
  border-color: var(--muted-foreground);
}

.btn-secondary:active {
  background: var(--border);
}
```

#### Ghost Button (text-only)
```css
.btn-ghost {
  background: transparent;
  color: var(--primary);
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: background 200ms ease;
}

.btn-ghost:hover {
  background: var(--primary-subtle);
}
```

### 6.2 Cards

#### When to Use Cards
- ✅ AI Agent showcases (individual agent capabilities)
- ✅ Product feature spotlights (with UI mockup)
- ✅ Pricing tiers
- ✅ Testimonial quotes
- ✅ Metric stat blocks

#### When NOT to Use Cards
- ❌ Simple text content (use typography hierarchy instead)
- ❌ Lists of features (use inline icon+text rows)
- ❌ Navigation elements
- ❌ More than 4 cards in a single row

#### Card Specifications

```css
.card {
  background: var(--card);
  border: 1px solid var(--border-subtle);
  border-radius: 16px;                    /* Consistent across all cards */
  padding: 24px;                          /* --space-6 */
  transition: all 200ms ease;
}

.card:hover {
  border-color: var(--border);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.06);
  transform: translateY(-2px);
}
```

#### Card Variants

| Variant | Border Radius | Shadow | Background |
|---|---|---|---|
| **Default** | `16px` | None → hover: soft shadow | `var(--card)` |
| **Elevated** | `16px` | Always: `0 4px 20px rgba(0,0,0,0.05)` | `var(--card)` |
| **Glass** | `16px` | None | `rgba(255,255,255,0.7)` + `backdrop-filter: blur(12px)` |
| **Featured** (pricing) | `16px` | `0 8px 30px rgba(85,97,200,0.15)` | `var(--card)` with primary border |
| **Product showcase** | `20px` | Soft shadow | `var(--muted)` background with soft gradient |

### 6.3 Inputs

```css
.input {
  background: var(--background);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px 16px;
  font-size: 15px;
  color: var(--foreground);
  transition: all 200ms ease;
}

.input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-subtle);
}

.input::placeholder {
  color: var(--muted-foreground);
}
```

### 6.4 Section Label Badges

The pill-shaped badges above section headings (e.g., "✦ Features", "✦ Pricing"):

```css
.section-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 14px;
  border-radius: 9999px;
  font-size: 13px;
  font-weight: 500;
  color: var(--primary);
  background: var(--primary-subtle);            /* 8% opacity primary */
  border: 1px solid rgba(85, 97, 200, 0.15);
  letter-spacing: 0.01em;
}
```

---

## 7. Visual Style Guidelines

### 7.1 Glassmorphism

Glassmorphism is used **selectively** — only for floating elements that need to feel elevated:

| Element | Blur | Background | Border |
|---|---|---|---|
| **Floating navbar** | `blur(12px)` | `rgba(255,255,255,0.8)` / dark: `rgba(10,10,11,0.8)` | `1px solid rgba(0,0,0,0.06)` |
| **Floating AI prompts (hero)** | `blur(16px)` | `rgba(255,255,255,0.6)` | `1px solid rgba(0,0,0,0.08)` |
| **Tooltip / popover** | `blur(8px)` | `rgba(255,255,255,0.9)` | `1px solid var(--border)` |

**Rules:**
- Never apply glassmorphism to standard cards or content containers.
- Maximum 2 glassmorphic elements visible simultaneously.
- Always ensure text contrast is sufficient on blurred backgrounds (WCAG AA minimum).

### 7.2 Shadows

| Level | Shadow | Usage |
|---|---|---|
| **None** | No shadow | Default state for most elements |
| **Subtle** | `0 1px 3px rgba(0,0,0,0.04)` | Slight lift (input fields) |
| **Soft** | `0 4px 20px rgba(0,0,0,0.06)` | Card hover, elevated surfaces |
| **Medium** | `0 8px 30px rgba(0,0,0,0.08)` | Featured cards, floating elements |
| **Strong** | `0 16px 48px rgba(0,0,0,0.12)` | Modal overlays, hero UI mockup |
| **Glow** | `0 4px 14px rgba(85,97,200,0.4)` | Primary CTA hover |

**Rules:**
- Shadows are always `rgba(0,0,0,...)` — never colored shadows except for the brand glow.
- Dark mode shadows: reduce opacity by 50% and switch to `rgba(0,0,0,0.3–0.5)`.
- No hard drop shadows. Always use blur-heavy, spread-light configurations.

### 7.3 Border System

| Context | Border | Radius |
|---|---|---|
| **Section dividers** | `1px solid var(--border-subtle)` or full-width `<hr>` | N/A |
| **Cards** | `1px solid var(--border-subtle)` | `16px` |
| **Buttons (secondary)** | `1px solid var(--border)` | `9999px` (pill) |
| **Inputs** | `1px solid var(--border)` | `10px` |
| **Navbar** | `1px solid rgba(0,0,0,0.06)` | `16px` (if floating) |
| **Pricing featured card** | `2px solid var(--primary)` | `16px` |
| **Product showcase cards** | `1px solid var(--border-subtle)` | `20px` |

### 7.4 Depth System

Depth is communicated through 3 layers:

| Layer | Z-Index | Technique |
|---|---|---|
| **Base** (page content) | `0` | Standard layout flow |
| **Elevated** (cards, sticky elements) | `10` | Subtle shadow + border |
| **Floating** (navbar, modals, tooltips) | `50` | Glassmorphism + strong shadow |

---

## 8. Interaction & Animation

### 8.1 Transition Defaults

```css
:root {
  --duration-fast: 150ms;
  --duration-normal: 200ms;
  --duration-slow: 300ms;
  --duration-enter: 400ms;
  --easing-default: cubic-bezier(0.4, 0, 0.2, 1);    /* ease-out */
  --easing-spring: cubic-bezier(0.34, 1.56, 0.64, 1);  /* spring-like */
  --easing-smooth: cubic-bezier(0.25, 0.1, 0.25, 1);   /* smooth ease */
}
```

### 8.2 Standard Transitions

| Interaction | Properties | Duration | Easing |
|---|---|---|---|
| **Button hover** | `background, box-shadow, transform` | `200ms` | `ease` |
| **Card hover** | `border-color, box-shadow, transform` | `200ms` | `ease` |
| **Link hover** | `color, opacity` | `150ms` | `ease` |
| **Input focus** | `border-color, box-shadow` | `200ms` | `ease` |
| **Nav item active** | `color, background` | `150ms` | `ease` |
| **Section enter (scroll)** | `opacity, transform` | `400ms` | `ease-out` |
| **Accordion expand** | `height, opacity` | `300ms` | `ease-out` |
| **Modal enter** | `opacity, transform` | `300ms` | `spring` |

### 8.3 Scroll-Triggered Animations

Sections fade in on scroll using Intersection Observer or Framer Motion:

```css
.section-enter {
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 400ms ease-out, transform 400ms ease-out;
}

.section-enter.visible {
  opacity: 1;
  transform: translateY(0);
}
```

**Stagger pattern** for card grids:
- First card: `delay 0ms`
- Second card: `delay 100ms`
- Third card: `delay 200ms`
- Maximum stagger delay: `300ms`

### 8.4 Micro-Interactions

| Element | Interaction | Effect |
|---|---|---|
| **Primary CTA** | Hover | `translateY(-1px)` + glow shadow |
| **Cards** | Hover | `translateY(-2px)` + border darken + soft shadow |
| **Nav links** | Hover | Color shift to primary |
| **FAQ accordion** | Click | Smooth height animation + icon rotation |
| **Metric numbers** | Scroll into view | Animated count-up |
| **Trust bar logos** | Ambient | Infinite horizontal scroll (marquee) |
| **Hero UI mockup** | Load | Subtle float/parallax effect |

### 8.5 Animation Rules

1. **No animation exceeds 400ms** (except page-level transitions).
2. **No bouncing, flashing, or attention-grabbing animations** — everything is smooth and intentional.
3. **Respect `prefers-reduced-motion`**: Disable all non-essential animations when the user has this OS setting enabled.
4. **No layout shift on hover** — Use `transform` exclusively. Never change `width`, `height`, `padding`, or `margin` on hover.
5. **One animation at a time** — Avoid multiple simultaneous animations on a single element.

---

## 9. Section Design Rules

### 9.1 Universal Section Structure

Every section follows this vertical structure:

```
┌─────────────────────────────────────────────┐
│                Section Padding               │  ← 64–96px (responsive)
│  ┌─────────────────────────────────────────┐ │
│  │         [Section Badge]                 │ │  ← Centered, 12px below section top
│  │         Section Heading                 │ │  ← 12px below badge
│  │         Section Description             │ │  ← 16px below heading, max-width 600px
│  │                                         │ │  ← 48px gap
│  │    ┌───────┐  ┌───────┐  ┌───────┐     │ │
│  │    │ Card  │  │ Card  │  │ Card  │     │ │  ← Content area
│  │    └───────┘  └───────┘  └───────┘     │ │
│  └─────────────────────────────────────────┘ │
│                Section Padding               │  ← Same as top
└─────────────────────────────────────────────┘
```

### 9.2 Section-Specific Rules

#### Hero Section
- Full viewport height on desktop, auto on mobile
- Maximum content width: `720px` for text
- Dashboard mockup: layered composition with float/parallax, extends below the fold
- Two CTAs side by side: Primary ("Start free trial") + Secondary ("Book a Demo")
- Subtle gradient background or soft glow behind heading
- No heavy imagery above the fold

#### Trust Bar
- Low opacity logos (`opacity: 0.4`, hover: `opacity: 0.7`)
- Horizontal scroll / marquee on mobile
- Small text above: "Trusted by some of the biggest companies"
- Compact vertical padding (`40px–64px`)

#### Problem → Solution
- Split layout: problem on left (or top), solution on right (or bottom)
- Use visual contrast: muted/gray for "problem" side, vibrant for "solution" side
- Maximum 3 pain points, maximum 1 short paragraph per point

#### AI Agents Section
- Grid of 4 agent cards (2×2 on desktop, 1 column on mobile)
- Each card: Agent name + one-line outcome + subtle visual/icon
- Cards should feel like "characters" — give each agent a distinct personality through its icon or visual treatment
- This is the hero differentiator section — it gets premium visual treatment

#### Product Showcase
- Alternating layout: Text-left + Image-right, then Image-left + Text-right
- Each product item: Title + Short description + 3 bullet features + UI mockup
- Mockups in elevated cards with soft shadow and rounded corners (`20px`)
- Generous whitespace between product items (`32px` gap minimum)

#### Metrics / Impact
- 3 large stat blocks side by side
- Large numbers: `48px` font size, bold
- Animated count-up on scroll
- Brief context below each number (`14px`, muted text)

#### Testimonials
- Single testimonial carousel/slider with navigation arrows
- Large quote text (`20px–24px`), italic or distinct style
- Real photo + Name + Title + Company
- Minimal design — quote speaks for itself

#### Pricing
- 3 columns (Starter, Growth, Business) + optional Enterprise row
- "Popular" badge on Growth plan with primary-colored border
- Clean feature checklist with check icons
- Avoid cramming — generous row spacing (`16px` between features)

#### FAQ
- Split layout: Heading on left, accordion on right
- Smooth expand/collapse with `300ms` animation
- "+" icon rotates to "×" on expand
- Maximum 6–8 questions visible

#### Final CTA
- Full-width dark background section
- Strong headline + single primary CTA
- Subtle gradient or glow effect on the CTA button
- No clutter — just conviction

#### Footer
- Dark background (`#1e1e2e → #12121a` gradient)
- Logo + navigation links + social icons + legal text
- Compact, well-structured — not a sitemap dump
- Large brand mark as a subtle watermark/background element

### 9.3 Content Density Rules

| Content Type | Max Lines (Desktop) | Max Lines (Mobile) |
|---|---|---|
| Hero heading | 2 | 3 |
| Hero subtext | 2 | 3 |
| Section heading | 2 | 2 |
| Section description | 2 | 3 |
| Card title | 1 | 1 |
| Card description | 2 | 3 |
| Feature bullet | 1 | 1 |
| Testimonial quote | 4 | 6 |

If content exceeds these limits, **rewrite the copy, don't adjust the design**.

### 9.4 Visual Hierarchy Per Section

Every section has exactly one **focal point** — the single element the eye goes to first:

| Section | Focal Point |
|---|---|
| Hero | Heading text |
| Trust Bar | Logo row (subtle) |
| Problem/Solution | Solution visual |
| AI Agents | Agent card grid |
| Product Showcase | UI mockup |
| Metrics | Large numbers |
| Testimonials | Quote text |
| Pricing | "Popular" card |
| FAQ | First question |
| CTA | CTA button |

---

## 10. Do's and Don'ts

### ✅ Do

- **Use whitespace intentionally** — Every gap communicates hierarchy. More space = more separation = less relation.
- **Maintain consistency ruthlessly** — If one card has `16px` border-radius, every card has `16px` border-radius. No exceptions.
- **Keep UI minimal** — If you can remove an element and the meaning is preserved, remove it.
- **Use a single accent color** — `#5561c8` is the brand. Don't introduce competing colors.
- **Highlight one keyword per heading** — Use `color: var(--primary)` on the most important word.
- **Test on real devices** — Check at `375px`, `768px`, `1024px`, and `1440px` breakpoints.
- **Use SVG icons exclusively** — Lucide or Heroicons. Never emoji as UI icons.
- **Add `cursor: pointer`** to every clickable element.
- **Use `text-balance`** on all headings to prevent orphaned words.
- **Provide focus states** for keyboard navigation (visible focus rings).

### ❌ Don't

- **Overuse cards** — Cards are for structured, bounded content. Use typography hierarchy for everything else.
- **Add unnecessary decorations** — No floating shapes, random gradients, or decorative patterns unless they serve hierarchy.
- **Break the spacing system** — Never use `margin: 23px` or `padding: 17px`. Use the scale.
- **Use more than 2 font weights** per text block — Pick `400` + `600` or `500` + `700`. That's it.
- **Make text too small** — Minimum body text: `14px`. Minimum interactive element text: `13px`.
- **Use colored shadows** — Except for the brand glow on primary CTAs.
- **Animate layout properties** — Never animate `width`, `height`, `padding`, `margin`. Use `transform` and `opacity`.
- **Place multiple CTAs competing for attention** — One primary action per viewport.
- **Use lorem ipsum or placeholder content** — Always use realistic copy.
- **Nest cards inside cards** — Maximum card nesting depth is 0 (no nesting).

---

## 11. Inspiration Mapping

### 11.1 hero.png — Hero Section

| Replicate | Avoid |
|---|---|
| Center-aligned heading with keyword color highlight ("AI Native" in primary) | N/A (good baseline) |
| Clean dual-CTA layout (ghost + filled) | Using this exact dashboard mockup without AI-layer enhancements |
| Dashboard mockup placed below the fold line with slight overlap | Static feel — add subtle float/parallax to the mockup |
| Trust bar immediately below hero | Keeping logos at full opacity — use muted treatment |
| Generous whitespace between heading and subtext | N/A |

### 11.2 navbar.png — Navigation

| Replicate | Avoid |
|---|---|
| Minimal nav items (Products, Features, Pricing) | Having too few — may need "About" or "Blog" |
| Two-button pattern: ghost ("Book a Demo") + filled ("Start free trial") | Exact border-radius styling if it doesn't match our `9999px` pill |
| Clean separation between logo, nav items, and CTAs | Overly wide navbar — constrain to `1200px` |
| Logo + brand name left-aligned | N/A |

### 11.3 features.png — Feature Grid

| Replicate | Avoid |
|---|---|
| Section badge + heading + description pattern | The "2×3" grid — too many items for AI-first storytelling |
| Visual mockups inside feature cards | Static screenshots — add context and interactivity hints |
| Caption text below cards (title + description) | Direct copy of card layout — adapt to agent-based narrative |
| Clean grid spacing | Feature dumping — reduce to 4 focused items |

### 11.4 products.png — Product Showcase

| Replicate | Avoid |
|---|---|
| Alternating text + image layout (zigzag pattern) | Repetitive product card styling — add variety through layout alternation |
| UI mockups with rounded corners and subtle shadow | Using identical screenshots — show different UI states |
| Bullet features with icon prefixes | Dense text — keep bullets to 3 per product |
| Generous vertical spacing between product items | N/A |

### 11.5 expertise.png — Why Fluxberry Section

| Replicate | Avoid |
|---|---|
| Clean 3-column card layout with illustrations | Using generic clipart illustrations — use purposeful UI visuals |
| Section badge + heading pattern | Exact illustration style — doesn't match AI-first positioning |
| Brief title + single-line description per card | N/A |
| Bordered container for the entire section | Over-boxing — use subtle treatment |

### 11.6 metrics.png — Impact Numbers

| Replicate | Avoid |
|---|---|
| Large bold numbers as focal points | Showing "0%" — always use realistic numbers |
| 3-column stat layout | Leaving metrics static — add animated count-up |
| Brief context paragraph below each number | Too much text — keep to 1-2 short lines |
| Clean, minimal card borders (subtle dividers) | N/A |

### 11.7 testimonial.png — Testimonials

| Replicate | Avoid |
|---|---|
| Large quote text as primary visual | Clipart-style illustrations for photos — use real headshots |
| Name + Title + Company attribution | N/A |
| Navigation arrows for carousel | Too many testimonials — show 1 at a time |
| Section badge + heading pattern | N/A |

### 11.8 pricing.png — Pricing Section

| Replicate | Avoid |
|---|---|
| 3-column tier layout (Starter, Growth, Business) | Cluttered feature lists — keep clean |
| "Popular" badge on middle tier | Exact styling — use our primary color for the badge |
| Annual/Monthly toggle | Hiding the toggle — always offer both options |
| Enterprise section below with icon features | Too much detail in enterprise — keep scannable |
| Large price numbers as focal points | N/A |

### 11.9 faq.png — FAQ Section

| Replicate | Avoid |
|---|---|
| Split layout: heading left, questions right | Full-width accordion — the split feels more premium |
| Clean accordion with "+" toggle | Heavy styling on individual questions |
| Brief, direct question format | Long-winded questions — keep them scannable |
| Minimal sub-text below heading ("Get clarity, instantly") | N/A |

### 11.10 footer.png — Footer

| Replicate | Avoid |
|---|---|
| Dark background footer with CTA band above | Using the "Launcherr" branding — replace with Fluxberry |
| Large brand mark as subtle watermark element | Making the watermark too prominent |
| Clean link row (Pricing, About us, Contact, Careers, Changelog, Blogs) | N/A |
| Social icons row with privacy/terms links | N/A |
| CTA bar: headline + button | N/A |

### 11.11 chanhdai.com-main — Reference Patterns

| Pattern | What to Adapt | What NOT to Copy |
|---|---|---|
| **Spacing system** | `p-4` (16px) internal padding, `gap-2` (8px) tight grids, section dividers via `screen-line-top/bottom` pseudo-elements | The exact line/border treatment — too editorial for SaaS |
| **Typography** | Geist Sans font family, `text-3xl font-semibold tracking-tight` for panel titles, `text-sm text-muted-foreground` for descriptions | The exact type scale — adjust for marketing (need larger hero headings) |
| **Animation** | Scroll-fade effects via CSS `animation-timeline: scroll()`, subtle `transition-[color] ease-out` for links | The duck follower interaction — too playful for enterprise SaaS |
| **Component patterns** | Panel (section) → PanelHeader → PanelTitle → PanelDescription → PanelContent hierarchy | The exact Panel component API — build Fluxberry-specific section components |
| **Color tokens** | oklch color space for precise color control, semantic variable naming (`--foreground`, `--muted`, etc.) | The exact zinc palette — use our indigo-tinted neutrals |
| **Dark mode** | CSS variable swap strategy with `.dark` class override | N/A — this approach is ideal |

---

## 12. Implementation Rules

### 12.1 Reusable Components

Build these as shared, reusable components (in `/components/ui/` or `/components/shared/`):

| Component | File | Props |
|---|---|---|
| `SectionContainer` | `section-container.tsx` | `maxWidth: 'default' \| 'wide' \| 'narrow'`, `className` |
| `SectionHeader` | `section-header.tsx` | `badge`, `title`, `highlightWord`, `description` |
| `SectionBadge` | `section-badge.tsx` | `icon`, `label` |
| `Button` | Already exists (shadcn) | Ensure pill variant exists |
| `Card` / `FeatureCard` | `feature-card.tsx` | `title`, `description`, `image`, `variant` |
| `StatBlock` | `stat-block.tsx` | `number`, `label`, `description`, `animateOnScroll` |
| `TestimonialCard` | `testimonial-card.tsx` | `quote`, `author`, `title`, `company`, `avatar` |
| `PricingCard` | `pricing-card.tsx` | `plan`, `price`, `features`, `cta`, `isFeatured` |
| `FAQAccordion` | `faq-accordion.tsx` | `items: { question, answer }[]` |

### 12.2 Naming Conventions

| Convention | Pattern | Example |
|---|---|---|
| **Component files** | `kebab-case.tsx` | `section-header.tsx` |
| **Component names** | `PascalCase` | `SectionHeader` |
| **CSS custom properties** | `--category-property` | `--space-4`, `--text-body`, `--color-primary` |
| **CSS classes** (utility) | `kebab-case` | `section-enter`, `btn-primary` |
| **Section IDs** | `kebab-case` | `id="ai-agents"`, `id="pricing"` |
| **Data attributes** | `data-slot` | `data-slot="section"`, `data-slot="card"` |

### 12.3 File Structure

```
FluxAI-frontend/src/
├── components/
│   ├── ui/                          # Base UI primitives (shadcn + custom)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── accordion.tsx
│   ├── shared/                      # Shared layout components
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   ├── section-container.tsx
│   │   ├── section-header.tsx
│   │   └── section-badge.tsx
│   └── landing/                     # Landing page specific
│       ├── hero-section.tsx
│       ├── trust-bar.tsx
│       ├── problem-solution.tsx
│       ├── ai-agents-section.tsx
│       ├── product-showcase.tsx
│       ├── metrics-section.tsx
│       ├── testimonials-section.tsx
│       ├── pricing-section.tsx
│       ├── faq-section.tsx
│       └── cta-section.tsx
├── styles/
│   ├── globals.css                  # Design tokens + base styles
│   └── animations.css               # Scroll-triggered animation classes
```

### 12.4 CSS Variable Registry

All design tokens must be defined in `globals.css` under `:root`:

```css
:root {
  /* === Spacing === */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-10: 2.5rem;
  --space-12: 3rem;
  --space-16: 4rem;
  --space-20: 5rem;
  --space-24: 6rem;

  /* === Container === */
  --container-max: 1200px;
  --container-wide: 1400px;
  --container-narrow: 800px;

  /* === Typography === */
  --text-hero: 3.5rem;
  --text-display: 2.75rem;
  --text-heading-lg: 2rem;
  --text-heading: 1.5rem;
  --text-heading-sm: 1.25rem;
  --text-body-lg: 1.125rem;
  --text-body: 1rem;
  --text-body-sm: 0.875rem;
  --text-caption: 0.8125rem;
  --text-micro: 0.75rem;

  /* === Brand Colors === */
  --color-primary: #5561c8;
  --color-primary-light: #6e79d6;
  --color-primary-dark: #434dab;
  --color-primary-subtle: rgba(85, 97, 200, 0.08);

  /* === Animation === */
  --duration-fast: 150ms;
  --duration-normal: 200ms;
  --duration-slow: 300ms;
  --duration-enter: 400ms;
  --easing-default: cubic-bezier(0.4, 0, 0.2, 1);
  --easing-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

### 12.5 Implementation Checklist

Before shipping any section, verify against this checklist:

#### Visual Quality
- [ ] No emoji used as icons (Lucide SVGs only)
- [ ] All spacing values from the defined scale
- [ ] Typography follows the type scale exactly
- [ ] Colors from the defined palette only
- [ ] Border radius consistent (`16px` cards, `9999px` buttons, `10px` inputs)
- [ ] Shadows from the shadow system only

#### Interaction
- [ ] All interactive elements have `cursor: pointer`
- [ ] Hover states use `transform` only (no layout shift)
- [ ] Transitions use `200ms ease` default
- [ ] Focus states visible for keyboard users

#### Responsiveness
- [ ] Tested at `375px`, `768px`, `1024px`, `1440px`
- [ ] No horizontal scroll on any breakpoint
- [ ] Content doesn't overlap fixed navbar
- [ ] Grid collapses appropriately on smaller screens

#### Accessibility
- [ ] All images have descriptive `alt` text
- [ ] Color contrast meets WCAG AA (4.5:1 for normal text, 3:1 for large text)
- [ ] `prefers-reduced-motion` disables animations
- [ ] Form inputs have associated labels
- [ ] Semantic HTML elements used (`<section>`, `<nav>`, `<main>`, `<article>`)

#### Performance
- [ ] Images lazy-loaded below the fold
- [ ] No unnecessary JavaScript on static sections
- [ ] Fonts preloaded
- [ ] No layout shift (CLS) during page load

---

## Appendix: Quick Reference Card

```
┌─────────────────────────────────────────────────────────────────┐
│  FLUXBERRY AI — DESIGN QUICK REFERENCE                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PRIMARY COLOR     #5561c8                                      │
│  FONT              Geist Sans / Geist Mono                      │
│  HERO HEADING      56px / 700 / -0.02em                         │
│  SECTION HEADING   44px / 600 / -0.02em                         │
│  BODY TEXT         16px / 400 / 1.6 line-height                 │
│                                                                 │
│  CONTAINER WIDTH   1200px (default) / 1400px (wide)             │
│  SECTION PADDING   64px (mobile) → 80px (tablet) → 96px (desk) │
│  CARD RADIUS       16px                                         │
│  BUTTON RADIUS     9999px (pill)                                │
│  INPUT RADIUS      10px                                         │
│                                                                 │
│  TRANSITION        200ms ease (default)                         │
│  SCROLL ANIMATION  400ms ease-out                               │
│  MAX STAGGER       300ms                                        │
│                                                                 │
│  SPACING SCALE     4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48   │
│                    / 64 / 80 / 96 / 120 / 160 (px)              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

> **This document is the law.** Every UI decision must trace back to a rule defined here.
> If a rule doesn't exist for your case, propose an addition — don't improvise.

---

END OF DOCUMENT

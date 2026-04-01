# FluxAI Frontend & Reflex-Web Architectural Guidelines

This document outlines the detailed UI principles, design tokens, technology stack, and structural layouts governing the FluxAI ecosystem. It also details the comparative differences between the native frontend (`FluxAI-frontend`) and the Python-based web iteration (`reflex-web`), providing a clear scope of improvements to achieve enterprise visual parity.

---

## 1. Core Design Philosophy: Enterprise Dense SaaS

The UI utilizes tightly padded semantic boxes, distinct 3-level hierarchical elevation, and native floating geometry inspired by modern SaaS architectures (e.g., LlamaIndex). 
- **Atmospheric Visual Rest**: Heavy utilization of backdrop blur overlays, subtle `.bg-brand/20` glow layers, and implicit drop-shadows to define hierarchy instead of hard `.border-line` boundaries.
- **Fluid Micro-interactions**: Smooth component revealing and floating hover states mapped to precise timing tokens.
- **Deprecation of Brutalism**: Legacy brutalist "Chanhdai/Editorial" stylings (using `rounded-none` or heavy `border-line` layouts) are strictly deprecated.

---

## 2. Platform Comparison: `FluxAI-frontend` vs `reflex-web`

While both projects serve the overarching Fluxberry ecosystem, their tech stacks and styling mentalities represent two distinct engineering paradigms.

### A. Technology Stack
* **FluxAI-frontend**:
  * **Framework**: React 19 & Next.js 15.1 (App Router)
  * **Styling**: Tailwind CSS v4 using pure `@theme` css directives (`globals.css`).
  * **Primitives**: Shadcn UI / Radix primitives explicitly customized.
  * **Animations**: Framer Motion and basic `.section-enter` class-based transitions.
* **reflex-web**:
  * **Framework**: Python/Reflex (Compiles Python definitions directly to React layouts).
  * **Styling**: Tailwind CSS v3 orchestrated via a dedicated Python dictionary (`tailwind_config.py`).
  * **Primitives**: Radix mapped implicitly through Reflex component wrappers.
  * **Animations**: Tailwind-animated plugin with custom `@keyframes` (e.g., `blur-in`, `accordion-down`, `border` tracing).

### B. Typography & Theming Differences
* **Typography**:
  * *Frontend*: Driven firmly by the **Archivo** typeface with tight tracking constraints for massive Hero sections.
  * *Reflex*: Prioritizes **Instrument Sans** and **JetBrains Mono** for cleaner technical/documentation readability.
* **Color System**:
  * *Frontend*: Uses manual semantic token mapping (`--primary`, `--muted`, `--card`) with single-variable definitions. Fallback `color-mix()` is used for borders.
  * *Reflex*: Uses an exhaustive import mapping of full Radix color scales (`radix_colors_dict`), applying native `light-dark()` functions aggressively for dynamic shadows.

---

## 3. Global Primitive Mandates

All components (specifically in `FluxAI-frontend`) MUST strictly adhere to this geometry scale.

- **Buttons & Standard Inputs**: `rounded-lg`. Height defined at `h-10` or `h-11`. Primary buttons map to `shadow-sm`. Hover states require soft active-scaling (`active:scale-[0.99]`).
- **Cards & Data Modules**: `rounded-xl` or `rounded-2xl`. Elevated via `shadow-sm`. Inner padding standardizes at `p-6` or `md:p-8`.
- **Dropdowns & Modals**: Floating semantic elements must utilize `rounded-xl`, high-ambient elevation `shadow-xl`, and `bg-popover`.

**Banned Legacy Utility Classes:** `rounded-none`, `border-line`, `shadow-none` (except where strictly necessary for specific 1px dividers).

---

## 4. Typography Scale Reference (FluxAI-frontend)

**Primary Font**: `Archivo` (fallback: `system-ui, sans-serif`)

* **Hero**: `4.5rem` - `5rem` with `.tracking-tight` and `.leading-none`.
* **H1**: Responsive `48px-64px`. Line-height: `1.15`, Tracking: `-0.02em`
* **H2**: Responsive `36px-44px`. Line-height: `1.2`, Tracking: `-0.01em`
* **H3**: Responsive `28px-32px`. Line-height: `1.3`
* **Body Large**: `18px`, Line-height: `1.6`
* **Body Default**: `16px`, Line-height: `1.6`
* **Body Small**: `14px`, Line-height: `1.5`

---

## 5. Layout Engine

### The 3 Permitted Landing Page Patterns
We map structural content via three exact architectural layouts:
1. **Pattern A (Split Layout)**: Left Text Block / Right Visual Layout. Standard for feature breakouts.
2. **Pattern B (Centered Layout)**: Centered Headers transitioning down into a grid structure.
3. **Pattern C (Editorial Split)**: 40-50% width Left Headline acting as a sticky column, pushing flowing context to the right column.

### Dashboards: The 3-Tier Canvas
Enterprise web applications scale through explicit depth separation:
- **Tier 1 (Base Shell)**: Top-bar navigation floats in `backdrop-blur-md` spaces mapping to `shadow-sm`.
- **Tier 2 (Base Canvas)**: Active Workspace background maps natively to `bg-background` or `bg-muted/30`.
- **Tier 3 (Components)**: Internal widgets form defined `rounded-2xl` structural boundaries separated by grid isolations (`gap-6`) and native `.border-border` bindings.

---

## 6. Scope of Improvement for FluxAI-frontend

To unify the visual identity between the native Next.js application and the Reflex-based environment, and to ultimately achieve pristine enterprise polish, the following improvements must be prioritized in `FluxAI-frontend`:

1. **Alignment with Reflex Shadow Dynamics**: 
   * Transition away from flat, single-layer box-shadows. Adopt the multi-layered `light-dark()` shadow definitions seen in Reflex (e.g. `0px 24px 12px 0px rgba(0,0,0,0.02)`) to create smoother, ambient depth.
2. **Unified Animation Keyframes**:
   * Implement standard `@keyframes` directly in Tailwind v4 `@theme` block matching Reflex's dynamic behavior. Priority additions: `blur-in` reveals, `accordion-down/up`, and `border` sweeping animations to replace stale JS-based stagger transitions.
3. **Color Scaling & Radix Palette Migration**:
   * Current manual assignments for `--brand`, `--brand-light`, `--brand-dark` should be converted into a unified 100-900 fractional scale to allow automated component matching (similar to `tailwind_radix_map.py` in Reflex).
   * Refactor the hardcoded `var(--background)` fallbacks to gracefully handle Radix semantic color schemes for dynamic light/dark shifting.
4. **Complete Extirpation of Chanhdai Patterns**:
   * Conduct a final audit for any `.border-line` or `.screen-line-top` artifacts within legacy components (`hero.tsx`, `metrics-section.tsx`). Replace these horizontal 100vw intersecting grid lines with pure depth-spacing or subtle `bg-brand/10` isolations.
5. **Harmonized Typography Directives**:
   * While `FluxAI-frontend` correctly uses `Archivo` for massive landing page impacts, deep dashboard components can feel crushed. Evaluate adopting `Instrument Sans` or `JetBrains Mono` for Tier 3 data components/tables inside the dashboard, mirroring Reflex's high data-density readability.

# Convert Frontend to Light Premium Theme

The goal is to convert the entire IdeaHub frontend from its current dark enterprise theme (Slate/Violet/Amber) to a "Light Premium Theme" based on the user's provided palette:
- Background (60%): Warm Cream `#FDFBF7`
- Primary Text (30%): Deep Charcoal `#1A1A1A`
- Secondary Surface / Card BG: Soft Stone `#F4F1EA`
- Accent / CTA (10%): Muted Gold `#C5A059`
- Highlight / Border: Subtle Taupe `#E2DDD5`

## User Review Required
This is a massive UI overhaul. The current app has over 300 instances of hardcoded Tailwind dark-theme utility classes (e.g., `text-slate-50`, `bg-slate-900`). 
Instead of manually editing hundreds of files, I propose using a highly efficient Node.js migration script to bulk-replace the Tailwind classes across all React components, paired with an `index.css` overhaul.

## Proposed Changes

### 1. Update `index.css`
- Redefine custom CSS properties and `@theme` directives to introduce the new palette natively to Tailwind CSS v4.
- Update global styles (`body`, `.glass`, `.glass-hover`, `.btn-primary`, `.input-base`, `.sidebar-item`) to utilize the light theme colors, removing dark-specific gradients and box-shadows.

### 2. Node.js Migration Script (`client/scripts/theme-migrate.js`)
- Write a one-time migration script that traverses `client/src/**/*.jsx`.
- It will replace dark Tailwind semantics with the new custom light semantics:
  - `bg-[#030712]`, `bg-slate-950` → `bg-theme-bg` (Warm Cream)
  - `bg-slate-900`, `bg-slate-800` → `bg-theme-surface` (Soft Stone)
  - `text-slate-50`, `text-slate-100`, `text-slate-200` → `text-theme-text` (Deep Charcoal)
  - `text-slate-300`, `text-slate-400`, `text-slate-500` → `text-theme-text/80`
  - `border-slate-700`, `border-slate-800` → `border-theme-border` (Subtle Taupe)
  - Accent colors (`amber-400`, `violet-500`, etc.) → `text-theme-accent`, `bg-theme-accent` (Muted Gold)
- Execute this script, verify changes, and then delete the script.

## Verification Plan
1. Ensure the dev server recompiles successfully.
2. Review primary pages (Dashboard, Login, Explore Events) to confirm that the contrast matches the WCAG requirements and aesthetic guidelines of the 60-30-10 rule.

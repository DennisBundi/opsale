# Dark Mode Design — Leeztruestyles.com

**Date:** 2026-03-11
**Status:** Approved

## Overview

Add a light/dark mode toggle for all users (customers and admins). Light mode is the default. Preference is persisted in localStorage. The toggle is an icon-only sun/moon button placed in the customer Header and the Admin top bar.

## Decisions

| Question | Decision |
|---|---|
| Persistence | localStorage only (no DB) |
| Toggle placement | Header (customer) + AdminNav top bar (admin) |
| Toggle style | Icon-only — sun SVG (dark mode active) / moon SVG (light mode active) |
| Implementation | `next-themes` library + Tailwind `darkMode: 'class'` |
| Default theme | Light |

## Architecture

### Dependencies
- Add `next-themes` package
- Enable `darkMode: 'class'` in `tailwind.config.ts`

### Theme Provider
- `next-themes` `ThemeProvider` wraps `<body>` in `src/app/layout.tsx`
- Config: `defaultTheme="light"`, `attribute="class"`, `storageKey="leez-theme"`
- Injects a blocking inline script before paint to read localStorage and apply the class — zero flash on load

### ThemeToggle Component
- Path: `src/components/ui/ThemeToggle.tsx`
- Uses `useTheme()` from `next-themes`
- Renders moon icon when light mode is active (click → dark)
- Renders sun icon when dark mode is active (click → light)
- Renders `null` until `mounted === true` to prevent hydration mismatch

### Placement
- `Header.tsx` — right side, next to the cart icon
- `AdminNav.tsx` — top bar right side, next to "View Store" link

## Dark Color Palette

| Role | Light | Dark |
|---|---|---|
| Page background | `bg-gray-50` / `bg-white` | `dark:bg-gray-900` |
| Surface (nav/cards) | `bg-white` | `dark:bg-gray-800` |
| Hover/input | `bg-gray-100` | `dark:bg-gray-700` |
| Primary text | `text-gray-900` | `dark:text-white` |
| Body text | `text-gray-700` | `dark:text-gray-300` |
| Muted text | `text-gray-500` | `dark:text-gray-400` |
| Borders | `border-gray-200` | `dark:border-gray-700` |

## Files Changed

| File | Change |
|---|---|
| `tailwind.config.ts` | Add `darkMode: 'class'` |
| `src/app/layout.tsx` | Wrap body with `ThemeProvider` |
| `src/app/globals.css` | Dark scrollbar + dark body background |
| `src/components/ui/ThemeToggle.tsx` | New file — sun/moon toggle |
| `src/components/navigation/Header.tsx` | Add ThemeToggle + `dark:` classes |
| `src/components/admin/AdminNav.tsx` | Add ThemeToggle + `dark:` classes |
| `src/app/(admin)/dashboard/layout.tsx` | Add `dark:bg-gray-900` to wrapper |

## Out of Scope

Individual page content (product cards, forms, tables, data grids). These can be darkened in a follow-up pass once the foundation is in place.

## Data Flow

1. User visits → `next-themes` reads `leez-theme` from localStorage
2. If found: applies theme class to `<html>` before paint (no flash)
3. If not found: defaults to `light`
4. User clicks toggle → `setTheme()` updates state, writes localStorage, swaps `dark` class on `<html>` instantly

## Edge Cases

- **SSR hydration:** `ThemeToggle` renders `null` until mounted — prevents server/client mismatch
- **No localStorage (private browsing):** `next-themes` falls back gracefully, works in-memory
- **PWA / offline:** localStorage available offline, no network required

## Testing

No new tests required. Toggle is pure UI with no server logic, API calls, or database interaction. Existing tests unaffected.

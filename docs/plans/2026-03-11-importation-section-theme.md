# Importation Section Theme Reskin Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the navy/indigo colour scheme on the "Direct Importation Service" section of `/about` with the project's brand pink palette.

**Architecture:** Pure Tailwind class swaps in one section of one file. No logic, no data, no tests required — purely visual. Remove the inline `style` override and use Tailwind gradient utilities instead.

**Tech Stack:** Tailwind CSS, Next.js (static JSX)

---

### Task 1: Reskin the importation section

**Files:**
- Modify: `src/app/(marketplace)/about/page.tsx` (lines 206–259)

**Step 1: Read the file**

Read `src/app/(marketplace)/about/page.tsx` to confirm the current state of the importation section before editing.

**Step 2: Apply all colour changes**

Make the following targeted edits to the importation `<section>` element (lines ~206-259):

**2a — Section element** (line ~206)

Find:
```tsx
<section className="mb-16 bg-gradient-to-br from-navy-900 to-indigo-900 rounded-2xl shadow-xl p-8 md:p-12 border border-indigo-700/30 text-white" style={{background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)'}}>
```
Replace with:
```tsx
<section className="mb-16 bg-gradient-to-br from-secondary-dark to-primary-dark rounded-2xl shadow-xl p-8 md:p-12 border border-white/20 text-white">
```
(Remove the `style` prop entirely — the Tailwind gradient replaces it.)

**2b — Icon container** (line ~208)

Find:
```tsx
<div className="flex-shrink-0 w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center">
```
Replace with:
```tsx
<div className="flex-shrink-0 w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
```

**2c — Icon colour** (line ~209)

Find:
```tsx
<svg className="w-8 h-8 text-indigo-300"
```
Replace with:
```tsx
<svg className="w-8 h-8 text-white"
```

**2d — First body paragraph** (line ~217)

Find:
```tsx
<p className="text-indigo-200 text-lg leading-relaxed">
  We're launching a direct importation service
```
Replace with:
```tsx
<p className="text-pink-100 text-lg leading-relaxed">
  We're launching a direct importation service
```

**2e — Second body paragraph** (line ~220)

Find:
```tsx
<p className="text-indigo-200 text-lg leading-relaxed">
  Whether it's fashion, electronics
```
Replace with:
```tsx
<p className="text-pink-100 text-lg leading-relaxed">
  Whether it's fashion, electronics
```

**2f — Primary CTA button** (line ~226)

Find:
```tsx
className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all hover:scale-105"
```
Replace with:
```tsx
className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-secondary hover:bg-pink-50 font-semibold rounded-xl transition-all hover:scale-105"
```

**2g — Sub-label text** (line ~243)

Find:
```tsx
<p className="text-indigo-300 text-sm font-medium uppercase tracking-widest">Nairobi · Guangzhou · Shenzhen</p>
```
Replace with:
```tsx
<p className="text-pink-200 text-sm font-medium uppercase tracking-widest">Nairobi · Guangzhou · Shenzhen</p>
```

**2h — Feature grid items** (line ~251)

Find:
```tsx
<div key={label} className="bg-white/10 rounded-lg p-3 text-center">
```
Replace with:
```tsx
<div key={label} className="bg-white/15 rounded-lg p-3 text-center">
```

**Step 3: Verify no other section was touched**

Confirm only the importation section (lines ~206-259) was changed. All other sections (Our Story, Our Mission, Our Values, Why Choose Us) must be untouched.

**Step 4: Commit**

```bash
git add src/app/(marketplace)/about/page.tsx
git commit -m "feat: reskin importation section to match brand pink theme"
```

**Step 5: Visual check**

Start the dev server (`npm run dev`) and visit `http://localhost:3000/about`. Scroll to the "Direct Importation Service" section. Confirm:
- Background is a pink gradient (secondary-dark → primary-dark)
- Body text is readable (light pink on pink background)
- "Check Waitlist Status" button is white with pink text
- "Join the Waitlist" button is still the translucent white style
- Feature grid tiles are slightly more visible
- No other sections on the page have changed

# 🎨 Admissions Page Transformation Guide

## Current State
The Admissions page currently has a **dark emerald/teal theme** that needs to be transformed to the Analytics Hub design with clean white/gray cards.

## Key Issues Visible in Screenshot
1. ❌ Dark emerald-950 background
2. ❌ Emerald-tinted cards and filters
3. ❌ Hard-to-read teal text
4. ❌ Dark filter sections
5. ❌ Emerald badges and buttons

---

## 🎯 Transformation Steps

### Step 1: Add Imports
Add these imports at the top of the file (after line 38):

```tsx
import { PageHeader } from '../../../components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
```

### Step 2: Transform Main Container (Line ~755)
**Find:**
```tsx
<div className="min-h-screen bg-gradient-to-b from-emerald-950 via-emerald-950 to-emerald-900 text-emerald-50">
  <div className="mx-auto max-w-7xl space-y-10 px-6 py-12">
```

**Replace with:**
```tsx
<div className="space-y-6">
```

### Step 3: Transform Header Section (Line ~757-774)
**Find:**
```tsx
<header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
  <div className="space-y-3">
    <p className="text-sm uppercase tracking-[0.2em] text-emerald-300/80">Admissions</p>
    <div>
      <h1 className="text-4xl font-semibold text-white">Leads overview</h1>
      <p className="mt-2 max-w-2xl text-base text-emerald-100/70">
        Track enquiries across the admissions pipeline, spot momentum, and act on the right leads at the right time.
      </p>
    </div>
  </div>
  <button
    type="button"
    className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 px-5 py-3 text-sm font-semibold text-emerald-950 shadow-emerald-500/40 transition hover:scale-[1.02] hover:shadow-lg"
    onClick={handleOpenCreateDrawer}
  >
    <PlusCircle className="h-4 w-4" aria-hidden /> New lead
  </button>
</header>
```

**Replace with:**
```tsx
<div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
  <PageHeader
    title="Leads overview"
    description="Track enquiries across the admissions pipeline, spot momentum, and act on the right leads at the right time."
  />
  <Button onClick={handleOpenCreateDrawer}>
    <PlusCircle className="h-4 w-4" aria-hidden /> New lead
  </Button>
</div>
```

### Step 4: Transform Stats Cards (Line ~776-810)
**Find:**
```tsx
<div className="rounded-3xl border border-emerald-500/30 bg-emerald-900/50 p-5 shadow-inner shadow-emerald-950/40">
```

**Replace with:**
```tsx
<Card className="border-none shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
  <CardContent className="p-6">
```

### Step 5: Transform Filter Section (Line ~820-860)
**Find:**
```tsx
<div className="rounded-3xl border border-emerald-500/30 bg-emerald-900/50 p-6 shadow-inner shadow-emerald-950/40">
```

**Replace with:**
```tsx
<Card className="border-none shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
  <CardContent className="p-6">
```

**Search input (Line ~847):**
```tsx
className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-3 pl-11 pr-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
```

### Step 6: Transform Filter Sections (Line ~511)
**Find:**
```tsx
<div className="rounded-2xl border border-emerald-700/40 bg-emerald-950/50 shadow-inner shadow-emerald-950/30">
```

**Replace with:**
```tsx
<div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
```

### Step 7: Transform Lead Cards (Line ~671)
**Find:**
```tsx
<li
  key={lead.id}
  className="group relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-emerald-950/70 p-6 shadow-lg shadow-emerald-950/40 transition hover:-translate-y-1 hover:border-emerald-400/60 hover:shadow-emerald-900/60"
>
  <div className="absolute inset-0 -z-10 bg-gradient-to-br from-emerald-500/10 via-emerald-500/0 to-emerald-400/10 opacity-0 transition group-hover:opacity-100" />
```

**Replace with:**
```tsx
<Card className="border-none shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 transition-all duration-300 hover:shadow-xl">
  <CardContent className="p-6">
```

### Step 8: Transform Typography Throughout

**Find and Replace:**
- `text-emerald-50` → `text-gray-900 dark:text-white`
- `text-emerald-100` → `text-gray-600 dark:text-gray-400`
- `text-emerald-100/80` → `text-gray-600 dark:text-gray-400`
- `text-emerald-100/70` → `text-gray-600 dark:text-gray-400`
- `text-emerald-200/80` → `text-gray-500 dark:text-gray-400`
- `text-emerald-300/80` → `text-gray-500 dark:text-gray-400`
- `text-emerald-300/70` → `text-gray-500 dark:text-gray-400`
- `text-white` → `text-gray-900 dark:text-white`

### Step 9: Transform Buttons
**Find:**
```tsx
className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-400/60 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/20"
```

**Replace with:**
```tsx
<Button variant="outline">View details</Button>
```

### Step 10: Transform Badges/Tags (Line ~712)
**Find:**
```tsx
<span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs uppercase tracking-wide text-emerald-100">
```

**Replace with:**
```tsx
<Badge variant="secondary">
```

### Step 11: Transform Contact Cards (Line ~722)
**Find:**
```tsx
<div className="rounded-2xl border border-emerald-500/30 bg-emerald-900/50 p-4">
```

**Replace with:**
```tsx
<div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
```

### Step 12: Transform Bulk Action Cards (Line ~1034, 1076)
**Find:**
```tsx
<div className="rounded-xl border border-emerald-500/40 bg-emerald-950/60 p-4">
```

**Replace with:**
```tsx
<Card className="border-none shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
  <CardContent className="p-4">
```

### Step 13: Transform Form Inputs
**All select/input/textarea elements:**
```tsx
className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
```

---

## 🎨 Color Mapping Reference

### Backgrounds
- `bg-emerald-950` → `bg-white dark:bg-gray-900`
- `bg-emerald-900/50` → `bg-gray-50 dark:bg-gray-800/50`
- `bg-emerald-500/10` → `bg-blue-50 dark:bg-blue-900/20`

### Borders
- `border-emerald-500/30` → `border-gray-200 dark:border-gray-700`
- `border-emerald-700/40` → `border-gray-200 dark:border-gray-700`

### Text
- `text-emerald-50` → `text-gray-900 dark:text-white`
- `text-emerald-100` → `text-gray-600 dark:text-gray-400`
- `text-emerald-300/80` → `text-gray-500 dark:text-gray-400`

---

## ✅ Expected Result

After transformation, the Admissions page will have:
- ✨ Clean white/gray gradient cards
- 📊 Professional stats section
- 🔍 Modern search and filters
- 💎 Shadow-lg on all cards
- 🎯 Blue accent colors for actions
- 📝 Clear typography hierarchy
- ✅ Perfect dark mode support

---

## 🚀 Quick Start

1. Open `apps/next/src/app/app/admissions/page.tsx`
2. Add the imports at the top
3. Use your IDE's find & replace for common patterns
4. Manually update complex sections (header, cards, forms)
5. Test the page
6. Commit: `git commit -m "feat: Transform Admissions page to Analytics Hub design"`

**Good luck!** 🎨✨

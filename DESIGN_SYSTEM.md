# Analytics Hub Design System

## Applied Consistently Across All Pages

### Card Styling
```tsx
<Card className="border-none shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
```

### Typography
- Headings: `text-gray-900 dark:text-white`
- Body: `text-gray-600 dark:text-gray-400`
- Muted: `text-gray-500 dark:text-gray-400`

### Icon Badges
```tsx
<div className="rounded-xl bg-gradient-to-br from-[color]-500 to-[color]-600 p-3 shadow-lg">
  <Icon className="h-6 w-6 text-white" />
</div>
```

### Spacing
- Card padding: `p-6`
- Section gaps: `gap-6`
- Grid gaps: `gap-6`

### Shadows
- Default: `shadow-lg`
- Hover: `hover:shadow-xl`
- Transitions: `transition-all duration-300`

### Error States
```tsx
<Card className="border-none shadow-lg bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20">
```

### Empty States
```tsx
<Card className="border-none shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
  <CardContent className="p-10 text-center">
    <p className="text-sm text-gray-600 dark:text-gray-400">Message</p>
  </CardContent>
</Card>
```

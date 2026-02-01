# Feature: Adaptive Theming

## Overview

Automatic light/dark theme based on system preferences.

## Theme Detection

Uses CSS `prefers-color-scheme` media query:
- Automatically follows system settings
- No manual toggle needed
- Instant switching when system theme changes

## Color Variables

### Dark Mode (Default)

```css
:root {
  --bg-primary: #1a1a1a;
  --bg-secondary: #2a2a2a;
  --bg-tertiary: #3a3a3a;
  --text-primary: #f0f0f0;
  --text-secondary: #ccc;
  --text-muted: #888;
  --accent-primary: #4a6fa5;
  --border-primary: #444;
}
```

### Light Mode

```css
@media (prefers-color-scheme: light) {
  :root {
    --bg-primary: #ffffff;
    --bg-secondary: #f5f5f5;
    --bg-tertiary: #e8e8e8;
    --text-primary: #1a1a1a;
    --text-secondary: #333;
    --text-muted: #666;
    --accent-primary: #3a5f95;
    --border-primary: #ccc;
  }
}
```

## Themed Elements

| Element | Dark | Light |
|---------|------|-------|
| Background | Dark gray | White |
| Text | Light gray | Dark gray |
| Buttons | Dark with light text | Light with dark text |
| Inputs | Dark background | Light background |
| Cards | Semi-transparent dark | Semi-transparent light |
| Dialogs | Dark overlay | Lighter overlay |
| Rarity badges | Adjusted contrast | Adjusted contrast |

## Accent Colors

Consistent across themes:
- Primary accent: Blue (#4a6fa5)
- Danger: Red (#c0392b)
- Stats: Colored icons (cost=blue, strength=red, willpower=green, lore=yellow)

## Testing Themes

### macOS
System Preferences → Appearance → Light/Dark

### Windows
Settings → Personalization → Colors → Choose your color

### Browser Override
Chrome DevTools → Rendering → Emulate CSS media feature prefers-color-scheme

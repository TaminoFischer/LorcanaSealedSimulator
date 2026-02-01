# Feature: Card Preview

## Overview

Hover over any card to see detailed information in the preview zone.

## Preview Display

### Card Image

- **Regular cards**: Portrait orientation (250px wide)
- **Location cards**: Landscape orientation (rotated 90°)

### Card Information

| Field | Display |
|-------|---------|
| Name | Full name with version |
| Type | CHARACTER, ITEM, ACTION, SONG, LOCATION |
| Subtypes | Storyborn • Hero • Princess |
| Stats | Icons with values |
| Rarity | Color-coded badge |
| Color | Card color (Amber, Amethyst, etc.) |
| Inkable | Blue badge if applicable |
| Text | Card abilities and effects |

## Stats Display

| Stat | Icon | Description |
|------|------|-------------|
| Cost | ⬡ | Ink cost to play |
| Strength | ⚔ | Attack value (Characters only) |
| Willpower | 🛡 | Defense value (Characters only) |
| Lore | ◇ | Quest value (Characters only) |

## Rarity Colors

| Rarity | Color |
|--------|-------|
| Common | Gray |
| Uncommon | Green |
| Rare | Blue |
| Super Rare | Purple |
| Legendary | Gold |
| Enchanted | Purple gradient |

## Location Cards

Location cards are detected by type and displayed in landscape:
- Supported type values: Location, Ort, Lieu, Luogo
- Image rotated 90° clockwise
- Adjusted container dimensions

## Responsive Behavior

- **Desktop**: Preview fixed on right side
- **Mobile**: Preview moves to top of screen

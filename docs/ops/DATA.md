# Data Management

## Data Source

Card data is sourced from [LorcanaJSON.org](https://lorcanajson.org/), providing:

- Complete card information
- Multiple languages (EN, DE, FR, IT)
- Regular updates with new sets

## Data Structure

### Set Files

Located in `src/data/sets/{language}/set-{code}.json`:

```
src/data/sets/
├── index.ts          # Set loader and metadata
├── en/
│   ├── set-1.json    # The First Chapter
│   ├── set-2.json    # Rise of the Floodborn
│   └── ...
├── de/
│   └── ...
├── fr/
│   └── ...
└── it/
    └── ...
```

### Card Data Schema

```typescript
interface CardData {
  id: number              // Unique card ID (consistent across languages)
  name: string            // Card name
  version: string         // Card version/subtitle
  fullName: string        // "Name - Version"
  cost: number            // Ink cost
  color: string           // Amber, Amethyst, Emerald, Ruby, Sapphire, Steel
  rarity: string          // Common, Uncommon, Rare, Super Rare, Legendary, Enchanted
  type: string            // Character, Item, Action, Song, Location
  
  // Character-specific
  strength?: number       // Attack value
  willpower?: number      // Defense value
  lore?: number           // Quest value
  
  // Additional
  inkwell: boolean        // Can be used as ink
  subtypes?: string[]     // Classifications
  subtypesText?: string   // Formatted subtypes
  fullText?: string       // Card abilities text
  
  // Images
  images: {
    full: string          // Full card image URL
    thumbnail?: string    // Thumbnail URL
  }
}
```

## Available Sets

| Code | Name | Languages |
|------|------|-----------|
| 1 | The First Chapter | EN, DE, FR, IT |
| 2 | Rise of the Floodborn | EN, DE, FR, IT |
| 3 | Into the Inklands | EN, DE, FR, IT |
| 4 | Ursula's Return | EN, DE, FR, IT |
| 5 | Shimmering Skies | EN, DE, FR, IT |
| 6 | Azurite Sea | EN, DE, FR, IT |
| 7 | Archazia's Island | EN, DE, FR, IT |
| 8 | The Inkquisition | EN, DE, FR |
| 9 | Thornwood Siege | EN, DE, FR |
| 10 | Strata of Legends | EN, DE, FR, IT |
| 11 | Winterspell | EN |
| Q1 | Deep Trouble | EN, DE, FR, IT |
| Q2 | Palace Heist | EN, DE, FR |

## Updating Data

To update card data with new releases:

1. Download new set JSON from LorcanaJSON.org
2. Place in appropriate language folder: `src/data/sets/{lang}/set-{code}.json`
3. Update `src/data/sets/index.ts`:
   - Add set to `availableSets` array
   - Add explicit import in `setLoaders` object

```typescript
// In index.ts
export const availableSets: SetInfo[] = [
  // ... existing sets
  { code: "12", name: "New Set Name", languages: ["en"] },
];

const setLoaders: Record<string, () => Promise<any>> = {
  // ... existing loaders
  'en-12': () => import('./en/set-12.json'),
};
```

## Rarity Localization

Rarity names are localized per language:

| English | German | French | Italian |
|---------|--------|--------|---------|
| Common | Gewöhnlich | Commune | Comune |
| Uncommon | Ungewöhnlich | Inhabituelle | Non comune |
| Rare | Selten | Rare | Rara |
| Super Rare | Episch | Très rare | Super rara |
| Legendary | Legendär | Légendaire | Leggendaria |
| Enchanted | Verzaubert | Enchantée | Incantata |

The application handles this via `rarityMapping` in `App.vue`.

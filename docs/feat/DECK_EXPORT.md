# Feature: Deck Export

## Overview

Export your deck in official tournament format for use in deck builders or registration.

## Export Format

Standard Lorcana deck format:

```
4 Genie - Magical Researcher
2 Merlin - Completing His Research
4 Cheshire Cat - Inexplicable
1 Alice - Well-Read Whisper
```

Format: `{count} {Card Name - Version}`

## Features

### English Names

Export always uses English card names, regardless of selected language. This ensures compatibility with official tournament systems.

### Grouped by Count

Cards are:
1. Grouped by identical cards
2. Sorted by count (highest first)
3. Then alphabetically

### Editable

The export textarea is editable, allowing manual adjustments before copying.

## Usage

1. Build your deck in Deck view
2. Click **📋 Export** button
3. Review deck list in dialog
4. Optionally edit the list
5. Click **📋 Copy to Clipboard**
6. Paste into deck builder or registration form

## Technical Details

When exporting from a non-English set:
1. English set data is loaded asynchronously
2. Cards are matched by ID (consistent across languages)
3. English `fullName` is retrieved
4. Loading indicator shown during data fetch

# Lorcana Sealed Simulator

A web application for simulating the Lorcana Sealed format – open booster packs and build your deck.

## Features

- **Booster Generation** – Configurable pull rates matching official distribution
- **Multi-Language** – Support for English, German, French, Italian
- **Deck Building** – Drag & drop or click to move cards between boosters and deck
- **Deck Export** – Export deck in official tournament format (English names)
- **Card Preview** – Detailed card info with stats, abilities, and full art
- **Auto-Sort** – Automatic sorting by cost and color
- **Adaptive Theme** – Light/dark mode based on system preferences

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Documentation

See the [docs/](docs/) folder for detailed documentation:
- [Build & Run](docs/ops/BUILD.md)
- [Architecture](docs/dev/ARCHITECTURE.md)
- [Features](docs/feat/)

## Tech Stack

- Vue 3 (Composition API)
- TypeScript
- Vite
- Card data from [LorcanaJSON.org](https://lorcanajson.org/)

## Credits

Based on [LorcanaSealedSimulator](https://github.com/drallieiv/LorcanaSealedSimulator) by [drallieiv](https://github.com/drallieiv).

Card data provided by [LorcanaJSON.org](https://lorcanajson.org/) – a community project collecting Disney Lorcana card data for developers.

## Disclaimer

This project is not affiliated with, endorsed by, or sponsored by Ravensburger or Disney. Disney Lorcana is a trademark of Disney. Card images are fetched from official sources and are not stored in this repository.

## License

This project builds upon unlicensed code. Please contact the original author for licensing clarification.

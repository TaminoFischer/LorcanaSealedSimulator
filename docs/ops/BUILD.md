# Build & Run

## Prerequisites

- Node.js 18+
- npm

## Installation

```bash
# Clone repository
git clone https://github.com/your-repo/LorcanaSealedSimulator.git
cd LorcanaSealedSimulator

# Install dependencies
npm install
```

## Development

```bash
# Start dev server with hot reload
npm run dev

# Opens at http://localhost:5173
```

## Production Build

```bash
# Build for production
npm run build

# Output in /dist folder
```

## Preview Production Build

```bash
# Preview built files locally
npm run preview
```

## Type Checking

```bash
# Run TypeScript type check
npm run build
# (includes vue-tsc type checking)
```

## Scripts Overview

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |

## Environment

No environment variables required. All data is bundled with the application.

## Deployment

Automatic deployment via GitHub Actions on push to `master`:

1. Push to `master` branch
2. GitHub Actions runs `npm run build`
3. `/dist` folder deployed to GitHub Pages

See `.github/workflows/buildAndPublishPages.yml` for workflow details.

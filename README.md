# zero-setup-biome

> Zero-config CLI to scaffold React + TypeScript projects with Biome — 22x faster than ESLint

## Quick Start

```bash
npx zero-setup-biome my-app
cd my-app
npm run dev
```

That's it. No ESLint/Prettier conflicts. No configuration hell. Just code.

## What You Get

- ⚡ **Vite** — Lightning-fast dev server and builds
- 🦕 **Biome** — Formatter + Linter in one tool (22x faster than ESLint)
- 📘 **TypeScript** — Strict mode enabled with best practices
- 🎨 **VSCode Integration** — Format on save, auto-organize imports
- 🔒 **Zero Conflicts** — No ESLint vs Prettier wars

## Options

```bash
npx zero-setup-biome <project-name> [options]

Options:
  -t, --template <template>  Template to use (react-ts) [default: react-ts]
  --skip-install            Skip installing dependencies
  --skip-git                Skip git initialization
  --pm <package-manager>    Package manager (npm, pnpm, yarn, bun)
  -v, --version             Output version number
  -h, --help                Display help
```

## Why Biome?

| Tool | Lint Time (medium project) |
|------|----------------------------|
| ESLint + Prettier | ~28s |
| Biome | ~1.3s |

Biome replaces both ESLint and Prettier with a single, blazing-fast tool written in Rust.

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev my-app

# Run tests
npm run test

# Build for production
npm run build
```

## License

MIT

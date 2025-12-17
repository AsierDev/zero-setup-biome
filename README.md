# zero-setup-biome

[![npm version](https://img.shields.io/npm/v/zero-setup-biome.svg?style=flat-square)](https://www.npmjs.com/package/zero-setup-biome)
[![license](https://img.shields.io/npm/l/zero-setup-biome.svg?style=flat-square)](https://github.com/AsierDev/zero-setup-biome/blob/main/LICENSE)
[![downloads](https://img.shields.io/npm/dt/zero-setup-biome.svg?style=flat-square)](https://www.npmjs.com/package/zero-setup-biome)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](https://github.com/AsierDev/zero-setup-biome)

> Zero-config CLI to scaffold React + TypeScript projects with Biome — 22x faster than ESLint

## Quick Start

### Create a New Project

![Create Project Demo](.github/assets/demo.gif)

```bash
npx zero-setup-biome my-app
cd my-app
npm run dev
```

### Migrate Existing Project

![Migrate Project Demo](.github/assets/migrate.gif)

```bash
cd your-existing-project
npx zero-setup-biome migrate
```

That's it. No ESLint/Prettier conflicts. No configuration hell. Just code.

## What You Get

- ⚡ **Vite** — Lightning-fast dev server and builds
- 🦕 **Biome** — Formatter + Linter in one tool (22x faster than ESLint)
- 📘 **TypeScript** — Strict mode enabled with best practices
- 🎨 **VSCode Integration** — Format on save, auto-organize imports
- 🔒 **Zero Conflicts** — No ESLint vs Prettier wars

## Commands

### Create

```bash
npx zero-setup-biome <project-name> [options]

Options:
  -t, --template <template>  Template to use (react-ts) [default: react-ts]
  --skip-install             Skip installing dependencies
  --skip-git                 Skip git initialization
  --pm <package-manager>     Package manager (npm, pnpm, yarn, bun)
  -v, --version              Output version number
  -h, --help                 Display help
```

### Migrate

Migrate existing projects from ESLint/Prettier to Biome:

```bash
npx zero-setup-biome migrate [options]

Options:
  --skip-install   Skip installing Biome
  --skip-cleanup   Keep ESLint/Prettier configs and dependencies
  --skip-git       Skip creating safety git commit
  --dry-run        Show changes without applying them
  -h, --help       Display help
```

**What it does:**
- ✅ Migrates ESLint rules to `biome.json` (uses Biome's official migration)
- ✅ Migrates Prettier config to `biome.json`
- ✅ **Preserves your Prettier settings** (quotes, semicolons, line width, etc.)
- ✅ **Auto-detects Jest/Vitest** and adds global variables
- ✅ **Excludes generated folders** (`gen/`, `dist/`, `build/`, etc.)
- ✅ Removes ESLint/Prettier dependencies and plugins
- ✅ Updates `package.json` scripts
- ✅ **Optional auto-format** to apply Biome formatting in one commit
- ✅ Creates a safety git commit before changes

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

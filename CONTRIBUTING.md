# Contributing to zero-setup-biome

Thank you for your interest in contributing! 🎉

## Development Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/your-username/zero-setup-biome.git
   cd zero-setup-biome
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run in development mode**
   ```bash
   npm run dev my-test-app
   ```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Run CLI in development mode |
| `npm run build` | Build for production |
| `npm run test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage |
| `npm run lint` | Lint with Biome |
| `npm run lint:fix` | Lint and fix issues |
| `npm run typecheck` | TypeScript type checking |

## Project Structure

```
src/
├── cli.ts              # CLI entry point
├── commands/
│   └── create.ts       # Create command
├── generators/
│   ├── copy-template.ts
│   ├── install-deps.ts
│   └── git-init.ts
├── utils/
│   ├── constants.ts
│   ├── detect-pm.ts
│   └── validate-name.ts
└── types/
    └── index.ts
```

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `chore:` Maintenance
- `test:` Tests
- `refactor:` Refactoring

## Pull Request Process

1. Create a feature branch: `git checkout -b feat/my-feature`
2. Make your changes
3. Run tests: `npm run test`
4. Run linting: `npm run lint`
5. Commit with conventional commit message
6. Push and open a PR

## Adding a New Template

1. Create a new folder in `templates/` (e.g., `templates/vue-ts/`)
2. Add template to `TEMPLATES` in `src/utils/constants.ts`
3. Add description to `TEMPLATE_DESCRIPTIONS`
4. Add the `Template` type to `src/types/index.ts`

## Questions?

Open an issue! We're happy to help.

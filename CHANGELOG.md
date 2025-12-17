# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **`migrate` command** — Migrate existing projects from ESLint/Prettier to Biome
  - Automatic ESLint config migration (uses Biome's official `biome migrate eslint`)
  - Automatic Prettier config migration (`biome migrate prettier`)
  - **Preserves Prettier settings** (quotes, semicolons, trailing commas, line width)
  - **Auto-detects and excludes generated folders** (`gen/`, `dist/`, `build/`)
  - **Reads ESLint ignorePatterns** and applies them to Biome
  - **Jest/Vitest globals** automatically configured
  - **Optional auto-format** to apply Biome formatting in one commit
  - Smart dependency cleanup (detects all ESLint/Prettier plugins with regex)
  - Git safety commit before migration
  - Interactive prompts for relaxed rules, script updates, and cleanup
  - `--dry-run` mode for previewing changes
  - Project detection for ESLint, Prettier, and existing Biome configs
  - Biome version validation (requires ≥1.7)


### Added

- Initial release
- `react-ts` template with React 18 + TypeScript + Vite + Biome
- Interactive CLI prompts with @clack/prompts
- Automatic package manager detection (npm, pnpm, yarn, bun)
- Git repository initialization with initial commit
- VSCode settings for format-on-save with Biome
- Security: Path traversal prevention in project name validation
- CI/CD with GitHub Actions (Node 18, 20, 22)
- Automatic npm publish on release

### Security

- Input validation to prevent path traversal attacks
- npm audit in CI pipeline

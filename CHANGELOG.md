# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2024-XX-XX

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

import path from "node:path";
import fs from "fs-extra";
import type { ProjectInfo } from "../types/index.js";
import { detectPackageManager } from "./detect-pm.js";

const ESLINT_CONFIGS = [
  ".eslintrc.js",
  ".eslintrc.cjs",
  ".eslintrc.json",
  ".eslintrc.yaml",
  ".eslintrc.yml",
  ".eslintrc",
  "eslint.config.js",
  "eslint.config.mjs",
  "eslint.config.cjs",
];

const PRETTIER_CONFIGS = [
  ".prettierrc",
  ".prettierrc.json",
  ".prettierrc.yaml",
  ".prettierrc.yml",
  ".prettierrc.js",
  ".prettierrc.cjs",
  ".prettierrc.mjs",
  "prettier.config.js",
  "prettier.config.cjs",
  "prettier.config.mjs",
];

export async function detectProject(cwd: string = process.cwd()): Promise<ProjectInfo> {
  // Detect ESLint config
  const eslintConfig = ESLINT_CONFIGS.find((file) => fs.existsSync(path.join(cwd, file)));

  // Check for ESLint config in package.json
  let hasESLintInPkg = false;
  const pkgPath = path.join(cwd, "package.json");
  if (await fs.pathExists(pkgPath)) {
    const pkg = await fs.readJson(pkgPath);
    hasESLintInPkg = !!pkg.eslintConfig;
  }

  // Detect Prettier config
  const prettierConfig = PRETTIER_CONFIGS.find((file) => fs.existsSync(path.join(cwd, file)));

  // Check for Prettier config in package.json
  let hasPrettierInPkg = false;
  if (await fs.pathExists(pkgPath)) {
    const pkg = await fs.readJson(pkgPath);
    hasPrettierInPkg = !!pkg.prettier;
  }

  // Detect existing Biome config
  const hasBiome = fs.existsSync(path.join(cwd, "biome.json"));

  // Detect package.json
  const hasPackageJson = await fs.pathExists(pkgPath);

  return {
    hasESLint: !!eslintConfig || hasESLintInPkg,
    hasPrettier: !!prettierConfig || hasPrettierInPkg,
    hasPackageJson,
    hasBiome,
    eslintConfig,
    prettierConfig,
    packageManager: detectPackageManager(cwd),
  };
}

export function getESLintConfigs(): string[] {
  return ESLINT_CONFIGS;
}

export function getPrettierConfigs(): string[] {
  return PRETTIER_CONFIGS;
}

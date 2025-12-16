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
  const pkgPath = path.join(cwd, "package.json");

  // Read package.json once
  let pkg: { eslintConfig?: unknown; prettier?: unknown } | null = null;
  if (await fs.pathExists(pkgPath)) {
    try {
      pkg = await fs.readJson(pkgPath);
    } catch {
      pkg = null;
    }
  }

  // Detect ESLint config file (async)
  let eslintConfig: string | undefined;
  for (const file of ESLINT_CONFIGS) {
    if (await fs.pathExists(path.join(cwd, file))) {
      eslintConfig = file;
      break;
    }
  }
  const hasESLintInPkg = !!pkg?.eslintConfig;

  // Detect Prettier config file (async)
  let prettierConfig: string | undefined;
  for (const file of PRETTIER_CONFIGS) {
    if (await fs.pathExists(path.join(cwd, file))) {
      prettierConfig = file;
      break;
    }
  }
  const hasPrettierInPkg = !!pkg?.prettier;

  // Detect existing Biome config (async)
  const hasBiome = await fs.pathExists(path.join(cwd, "biome.json"));

  return {
    hasESLint: !!eslintConfig || hasESLintInPkg,
    hasPrettier: !!prettierConfig || hasPrettierInPkg,
    hasPackageJson: pkg !== null,
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

import path from "node:path";
import { confirm, isCancel, select, spinner } from "@clack/prompts";
import fs from "fs-extra";
import pc from "picocolors";

interface PrettierConfig {
  semi?: boolean;
  singleQuote?: boolean;
  trailingComma?: "none" | "es5" | "all";
  printWidth?: number;
  tabWidth?: number;
  useTabs?: boolean;
  bracketSpacing?: boolean;
  arrowParens?: "always" | "avoid";
  endOfLine?: "lf" | "crlf" | "cr" | "auto";
}

interface BiomeFormatterSettings {
  quoteStyle: "single" | "double";
  trailingCommas: "none" | "all";
  lineWidth: number;
  indentWidth: number;
  indentStyle: "space" | "tab";
  semicolons: "always" | "asNeeded";
  bracketSpacing: boolean;
  arrowParentheses: "always" | "asNeeded";
  lineEnding: "lf" | "crlf" | "cr";
}

const GENERATED_PATTERNS = [
  "!**/gen/**",
  "!**/generated/**",
  "!**/*.generated.*",
  "!**/*.d.ts",
  "!**/dist/**",
  "!**/build/**",
  "!**/node_modules/**",
];

/**
 * Read and parse Prettier configuration from the project
 */
export async function readPrettierConfig(cwd: string): Promise<PrettierConfig | null> {
  const configFiles = [
    ".prettierrc",
    ".prettierrc.json",
    ".prettierrc.js",
    ".prettierrc.cjs",
    ".prettierrc.mjs",
    "prettier.config.js",
    "prettier.config.cjs",
    "prettier.config.mjs",
  ];

  // Try JSON config files first
  for (const file of configFiles) {
    const configPath = path.join(cwd, file);
    if (await fs.pathExists(configPath)) {
      try {
        if (file.endsWith(".json") || file === ".prettierrc") {
          const content = await fs.readFile(configPath, "utf-8");
          return JSON.parse(content);
        }
        // For JS configs, we can't easily parse them, skip
      } catch {
        // Invalid config, continue
      }
    }
  }

  // Check package.json for prettier config
  const pkgPath = path.join(cwd, "package.json");
  if (await fs.pathExists(pkgPath)) {
    try {
      const pkg = await fs.readJson(pkgPath);
      if (pkg.prettier && typeof pkg.prettier === "object") {
        return pkg.prettier;
      }
    } catch {
      // Invalid package.json
    }
  }

  return null;
}

/**
 * Read ESLint ignorePatterns from the project
 * Note: This only works with JSON-based configs, not JS configs
 */
export async function readESLintIgnorePatterns(cwd: string): Promise<string[]> {
  const configFiles = [".eslintrc", ".eslintrc.json"];

  // Try JSON config files
  for (const file of configFiles) {
    const configPath = path.join(cwd, file);
    if (await fs.pathExists(configPath)) {
      try {
        const content = await fs.readFile(configPath, "utf-8");
        const config = JSON.parse(content);
        if (Array.isArray(config.ignorePatterns)) {
          return config.ignorePatterns;
        }
      } catch {
        // Invalid config, continue
      }
    }
  }

  // Check package.json for eslintConfig
  const pkgPath = path.join(cwd, "package.json");
  if (await fs.pathExists(pkgPath)) {
    try {
      const pkg = await fs.readJson(pkgPath);
      if (pkg.eslintConfig?.ignorePatterns && Array.isArray(pkg.eslintConfig.ignorePatterns)) {
        return pkg.eslintConfig.ignorePatterns;
      }
    } catch {
      // Invalid package.json
    }
  }

  // Try reading .eslintignore file
  const ignorePath = path.join(cwd, ".eslintignore");
  if (await fs.pathExists(ignorePath)) {
    try {
      const content = await fs.readFile(ignorePath, "utf-8");
      return content
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#"));
    } catch {
      // Invalid file
    }
  }

  return [];
}

/**
 * Convert Prettier config to Biome formatter settings
 * Note: trailingCommas "es5" is not supported in Biome, caller must resolve it first
 */
export function mapPrettierToBiome(
  prettier: PrettierConfig,
  trailingCommasOverride?: "none" | "all",
): BiomeFormatterSettings {
  // If es5, require override; otherwise map directly
  let trailingCommas: "none" | "all" = "all";
  if (trailingCommasOverride) {
    trailingCommas = trailingCommasOverride;
  } else if (prettier.trailingComma === "none") {
    trailingCommas = "none";
  } else if (prettier.trailingComma === "all") {
    trailingCommas = "all";
  }

  return {
    quoteStyle: prettier.singleQuote ? "single" : "double",
    trailingCommas,
    lineWidth: prettier.printWidth || 80,
    indentWidth: prettier.tabWidth || 2,
    indentStyle: prettier.useTabs ? "tab" : "space",
    semicolons: prettier.semi === false ? "asNeeded" : "always",
    bracketSpacing: prettier.bracketSpacing !== false,
    arrowParentheses: prettier.arrowParens === "avoid" ? "asNeeded" : "always",
    lineEnding: prettier.endOfLine === "crlf" ? "crlf" : prettier.endOfLine === "cr" ? "cr" : "lf",
  };
}

/**
 * Prompt user to choose trailing commas when Prettier has "es5"
 */
export async function promptTrailingCommasForEs5(): Promise<"none" | "all"> {
  const result = await select({
    message:
      'Your Prettier uses "es5" trailing commas. Biome only supports "none" or "all". Choose:',
    options: [
      { value: "none", label: "No trailing commas", hint: "Cleaner, no extra commas" },
      { value: "all", label: "All trailing commas", hint: "Better git diffs" },
    ],
    initialValue: "none",
  });

  // Handle cancellation - default to "none"
  if (isCancel(result)) {
    return "none";
  }

  return result as "none" | "all";
}

/**
 * Detect generated folders in the project
 */
export async function detectGeneratedFolders(cwd: string): Promise<string[]> {
  const detected: string[] = [];
  const foldersToCheck = [
    "src/api/gen",
    "src/generated",
    "generated",
    "gen",
    "src/types/generated",
  ];

  for (const folder of foldersToCheck) {
    if (await fs.pathExists(path.join(cwd, folder))) {
      detected.push(`!**/${folder}/**`);
    }
  }

  return detected;
}

/**
 * Apply Prettier-compatible settings to Biome config
 */
export async function applyPrettierCompatibility(
  cwd: string,
  prettierConfig: PrettierConfig | null,
  relaxedRules: boolean,
): Promise<void> {
  const s = spinner();
  s.start("Customizing Biome configuration...");

  const biomeConfigPath = path.join(cwd, "biome.json");

  if (!(await fs.pathExists(biomeConfigPath))) {
    s.stop(pc.yellow("⚠ biome.json not found, skipping customization"));
    return;
  }

  const config = await fs.readJson(biomeConfigPath);

  // Collect all ignore patterns from various sources
  const generatedFolders = await detectGeneratedFolders(cwd);
  const eslintIgnorePatterns = await readESLintIgnorePatterns(cwd);

  // Convert ESLint ignore patterns to Biome negated includes
  const eslintExcludes = eslintIgnorePatterns
    .filter((p) => p && !p.startsWith("!")) // Skip negations
    .map((p) => {
      // Normalize pattern for Biome
      const normalized = p.replace(/\/$/, ""); // Remove trailing slash
      return normalized.startsWith("!") ? normalized : `!${normalized}`;
    });

  // Combine all exclusion patterns
  const allExcludes = [...new Set([...generatedFolders, ...eslintExcludes, ...GENERATED_PATTERNS])];

  if (allExcludes.length > 0) {
    config.files = config.files || {};
    const existingIncludes = config.files.includes || [];
    const hasWildcard = existingIncludes.some((p: string) => p === "**" || p === "**/*");
    const basePatterns = hasWildcard ? existingIncludes : ["**", ...existingIncludes];
    config.files.includes = [...new Set([...basePatterns, ...allExcludes])];
  }

  // Apply Prettier-compatible formatting settings
  if (prettierConfig) {
    // Handle es5 trailing commas - Biome doesn't support it
    let trailingCommasOverride: "none" | "all" | undefined;
    if (prettierConfig.trailingComma === "es5") {
      s.stop(pc.yellow("⚠ Biome doesn't support 'es5' trailing commas"));
      trailingCommasOverride = await promptTrailingCommasForEs5();
      s.start("Continuing configuration...");
    }

    const biomeSettings = mapPrettierToBiome(prettierConfig, trailingCommasOverride);

    config.formatter = config.formatter || {};
    config.formatter.indentStyle = biomeSettings.indentStyle;
    config.formatter.indentWidth = biomeSettings.indentWidth;
    config.formatter.lineWidth = biomeSettings.lineWidth;
    config.formatter.lineEnding = biomeSettings.lineEnding;
    config.formatter.bracketSpacing = biomeSettings.bracketSpacing;

    config.javascript = config.javascript || {};
    config.javascript.formatter = config.javascript.formatter || {};
    config.javascript.formatter.quoteStyle = biomeSettings.quoteStyle;
    config.javascript.formatter.trailingCommas = biomeSettings.trailingCommas;
    config.javascript.formatter.semicolons = biomeSettings.semicolons;
    config.javascript.formatter.arrowParentheses = biomeSettings.arrowParentheses;
  }

  // Apply relaxed linting rules if requested
  if (relaxedRules) {
    config.linter = config.linter || {};
    config.linter.rules = config.linter.rules || {};

    // Relax suspicious rules
    config.linter.rules.suspicious = config.linter.rules.suspicious || {};
    config.linter.rules.suspicious.noExplicitAny = "off";
    config.linter.rules.suspicious.noConsole = "off";

    // Relax style rules
    config.linter.rules.style = config.linter.rules.style || {};
    config.linter.rules.style.noNonNullAssertion = "off";

    // Relax a11y rules (can be very strict)
    config.linter.rules.a11y = config.linter.rules.a11y || {};
    config.linter.rules.a11y.noRedundantRoles = "off";
    config.linter.rules.a11y.useSemanticElements = "off";
    config.linter.rules.a11y.useAriaPropsSupportedByRole = "off";

    // Relax correctness rules that may be too strict
    config.linter.rules.correctness = config.linter.rules.correctness || {};
    config.linter.rules.correctness.useExhaustiveDependencies = "warn";
  }

  // Add Jest/Vitest globals for test files (merge with existing)
  config.javascript = config.javascript || {};
  const existingGlobals: string[] = config.javascript.globals || [];
  const jestVitestGlobals = [
    "jest",
    "describe",
    "it",
    "test",
    "expect",
    "beforeEach",
    "afterEach",
    "beforeAll",
    "afterAll",
    "vi",
  ];
  config.javascript.globals = [...new Set([...existingGlobals, ...jestVitestGlobals])];

  // Disable organize imports assistant (can be disruptive during migration)
  config.assist = config.assist || {};
  config.assist.actions = config.assist.actions || {};
  config.assist.actions.source = config.assist.actions.source || {};
  config.assist.actions.source.organizeImports = "off";

  await fs.writeJson(biomeConfigPath, config, { spaces: 2 });

  s.stop(pc.green("✓ Biome configuration customized"));
}

/**
 * Prompt for relaxed rules only (the one thing Prettier doesn't configure)
 */
export async function promptRelaxedRules(): Promise<boolean> {
  const result = await confirm({
    message: "Use relaxed lint rules? (disable noExplicitAny, noConsole, strict a11y)",
    initialValue: true,
  });

  return result === true;
}

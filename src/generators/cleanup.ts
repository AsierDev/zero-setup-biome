import path from "node:path";
import { confirm, spinner } from "@clack/prompts";
import { execa } from "execa";
import fs from "fs-extra";
import pc from "picocolors";
import type { PackageManager, ProjectInfo } from "../types/index.js";
import { getESLintConfigs, getPrettierConfigs } from "../utils/detect-project.js";

// Regex patterns to detect ESLint/Prettier related packages
const ESLINT_PACKAGE_PATTERNS = [
  /^eslint$/,
  /^eslint-/,
  /^@eslint\//,
  /^@typescript-eslint\//,
  /eslint-plugin-/,
  /eslint-config-/,
];

const PRETTIER_PACKAGE_PATTERNS = [/^prettier$/, /^prettier-/, /^@prettier\//];

function matchesPatterns(packageName: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(packageName));
}

export function findDepsToRemove(pkg: Record<string, unknown>): string[] {
  const allDeps = [
    ...Object.keys((pkg["dependencies"] as Record<string, string>) || {}),
    ...Object.keys((pkg["devDependencies"] as Record<string, string>) || {}),
  ];

  return allDeps.filter(
    (dep) =>
      matchesPatterns(dep, ESLINT_PACKAGE_PATTERNS) ||
      matchesPatterns(dep, PRETTIER_PACKAGE_PATTERNS),
  );
}

export async function uninstallDeps(
  deps: string[],
  pm: PackageManager,
  cwd: string,
): Promise<void> {
  if (deps.length === 0) return;

  const uninstallCmd = pm === "npm" ? "uninstall" : "remove";
  await execa(pm, [uninstallCmd, ...deps], { cwd });
}

export async function removeConfigFiles(_info: ProjectInfo, cwd: string): Promise<string[]> {
  const filesToRemove: string[] = [];

  // Collect ESLint config files
  for (const file of getESLintConfigs()) {
    const filePath = path.join(cwd, file);
    if (await fs.pathExists(filePath)) {
      filesToRemove.push(file);
    }
  }

  // ESLint ignore file
  if (await fs.pathExists(path.join(cwd, ".eslintignore"))) {
    filesToRemove.push(".eslintignore");
  }

  // Collect Prettier config files
  for (const file of getPrettierConfigs()) {
    const filePath = path.join(cwd, file);
    if (await fs.pathExists(filePath)) {
      filesToRemove.push(file);
    }
  }

  // Prettier ignore file
  if (await fs.pathExists(path.join(cwd, ".prettierignore"))) {
    filesToRemove.push(".prettierignore");
  }

  // Remove files
  for (const file of filesToRemove) {
    await fs.remove(path.join(cwd, file));
  }

  return filesToRemove;
}

export async function updatePackageScripts(
  cwd: string,
): Promise<{ updated: boolean; scripts: Record<string, string> }> {
  const pkgPath = path.join(cwd, "package.json");
  const pkg = await fs.readJson(pkgPath);

  const newScripts: Record<string, string> = {
    lint: "biome check .",
    "lint:fix": "biome check --write .",
    format: "biome format --write .",
  };

  const shouldUpdate = await confirm({
    message: "Update package.json scripts to use Biome?",
    initialValue: true,
  });

  if (shouldUpdate === true) {
    pkg.scripts = { ...pkg.scripts, ...newScripts };
    await fs.writeJson(pkgPath, pkg, { spaces: 2 });
    return { updated: true, scripts: newScripts };
  }

  return { updated: false, scripts: newScripts };
}

export async function cleanupOldDeps(
  info: ProjectInfo,
  cwd: string = process.cwd(),
  dryRun = false,
): Promise<{ depsRemoved: string[]; filesRemoved: string[] }> {
  const s = spinner();
  s.start("Analyzing dependencies to remove...");

  // Read package.json to find deps
  const pkgPath = path.join(cwd, "package.json");
  const pkg = await fs.readJson(pkgPath);
  const depsToRemove = findDepsToRemove(pkg);

  s.stop(`Found ${depsToRemove.length} ESLint/Prettier packages`);

  if (depsToRemove.length > 0) {
    console.log(pc.dim(`  Packages: ${depsToRemove.join(", ")}`));
  }

  if (dryRun) {
    // In dry-run, just return what would be removed
    const configFiles = [...getESLintConfigs(), ...getPrettierConfigs()].filter((f) =>
      fs.existsSync(path.join(cwd, f)),
    );
    return { depsRemoved: depsToRemove, filesRemoved: configFiles };
  }

  // Confirm before removing
  if (depsToRemove.length > 0) {
    const shouldRemove = await confirm({
      message: `Remove ${depsToRemove.length} ESLint/Prettier packages?`,
      initialValue: true,
    });

    if (shouldRemove === true) {
      const s2 = spinner();
      s2.start("Removing packages...");
      await uninstallDeps(depsToRemove, info.packageManager, cwd);
      s2.stop(pc.green(`✓ Removed ${depsToRemove.length} packages`));
    }
  }

  // Remove config files
  const filesRemoved = await removeConfigFiles(info, cwd);
  if (filesRemoved.length > 0) {
    console.log(pc.dim(`  Removed config files: ${filesRemoved.join(", ")}`));
  }

  return { depsRemoved: depsToRemove, filesRemoved };
}

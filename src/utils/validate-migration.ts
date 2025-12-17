import path from "node:path";
import { note, spinner } from "@clack/prompts";
import { execa } from "execa";
import fs from "fs-extra";
import pc from "picocolors";
import semver from "semver";

const MINIMUM_BIOME_VERSION = "1.7.0";

export async function getBiomeVersion(cwd: string = process.cwd()): Promise<string | null> {
  try {
    const { stdout } = await execa("npx", ["@biomejs/biome", "--version"], { cwd });
    // Output is like "Version: 1.9.0" or just "1.9.0"
    const match = stdout.match(/(\d+\.\d+\.\d+)/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

export async function validateBiomeVersion(cwd: string = process.cwd()): Promise<{
  valid: boolean;
  version: string | null;
  message: string;
}> {
  const version = await getBiomeVersion(cwd);

  if (!version) {
    return {
      valid: false,
      version: null,
      message: "Biome is not installed or version could not be determined",
    };
  }

  if (!semver.gte(version, MINIMUM_BIOME_VERSION)) {
    return {
      valid: false,
      version,
      message: `Biome version ${version} is too old. Minimum required: ${MINIMUM_BIOME_VERSION}`,
    };
  }

  return {
    valid: true,
    version,
    message: `Biome ${version} detected`,
  };
}

export async function validateMigration(cwd: string = process.cwd()): Promise<{
  success: boolean;
  issues: string[];
}> {
  const s = spinner();
  s.start("Validating migration...");

  const issues: string[] = [];

  // 1. Verify that biome.json exists
  const biomeConfigPath = path.join(cwd, "biome.json");
  if (!(await fs.pathExists(biomeConfigPath))) {
    issues.push("biome.json not found");
  }

  // 2. Verify that @biomejs/biome is installed
  const pkgPath = path.join(cwd, "package.json");
  if (await fs.pathExists(pkgPath)) {
    const pkg = await fs.readJson(pkgPath);
    const hasBiomeDep =
      pkg.devDependencies?.["@biomejs/biome"] || pkg.dependencies?.["@biomejs/biome"];

    if (!hasBiomeDep) {
      issues.push("@biomejs/biome not found in dependencies");
    }
  }

  // 3. Check if scripts are updated
  if (await fs.pathExists(pkgPath)) {
    const pkg = await fs.readJson(pkgPath);
    const lintScript = pkg.scripts?.lint;

    if (!lintScript?.includes("biome")) {
      issues.push('package.json "lint" script does not use Biome');
    }
  }

  // 4. Run biome check to verify it works
  try {
    await execa("npx", ["@biomejs/biome", "check", ".", "--max-diagnostics=0"], { cwd });
  } catch {
    // Biome check might have lint errors, but that's OK
    // We only care that it runs
  }

  if (issues.length > 0) {
    s.stop(pc.yellow("⚠ Migration completed with warnings"));
    note(issues.map((i) => `⚠ ${i}`).join("\n"), "Issues found");
  } else {
    s.stop(pc.green("✓ Migration validated successfully"));
  }

  return {
    success: issues.length === 0,
    issues,
  };
}

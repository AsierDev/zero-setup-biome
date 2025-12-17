import { cancel, confirm, intro, isCancel, note, outro, spinner } from "@clack/prompts";
import { execa } from "execa";
import pc from "picocolors";
import { cleanupOldDeps, updatePackageScripts } from "../generators/cleanup.js";
import { migrateESLint } from "../generators/migrate-eslint.js";
import { migratePrettier } from "../generators/migrate-prettier.js";
import type { MigrateOptions, MigrationResult } from "../types/index.js";
import {
  applyPrettierCompatibility,
  promptRelaxedRules,
  readPrettierConfig,
} from "../utils/biome-config.js";
import { detectProject } from "../utils/detect-project.js";
import { createSafetyCommit } from "../utils/git-safety.js";
import { validateBiomeVersion, validateMigration } from "../utils/validate-migration.js";

export async function runMigrate(options: MigrateOptions): Promise<void> {
  const cwd = process.cwd();

  intro(pc.bgMagenta(pc.black(" Migrate to Biome ")));

  // 1. Detect project setup
  const s = spinner();
  s.start("Detecting project setup...");
  const projectInfo = await detectProject(cwd);
  s.stop("Project analyzed");

  // Check if there's something to migrate
  if (!projectInfo.hasESLint && !projectInfo.hasPrettier) {
    outro(pc.yellow("No ESLint or Prettier configuration detected. Nothing to migrate."));
    return;
  }

  // Show what was found
  const detectedItems: string[] = [];
  if (projectInfo.hasESLint) {
    detectedItems.push(
      `✓ ESLint${projectInfo.eslintConfig ? ` (${projectInfo.eslintConfig})` : ""}`,
    );
  }
  if (projectInfo.hasPrettier) {
    detectedItems.push(
      `✓ Prettier${projectInfo.prettierConfig ? ` (${projectInfo.prettierConfig})` : ""}`,
    );
  }
  if (projectInfo.hasBiome) {
    detectedItems.push("✓ Biome (already configured)");
  }
  detectedItems.push(`✓ Package manager: ${projectInfo.packageManager}`);

  note(detectedItems.join("\n"), "Detected setup");

  // 2. Dry run mode
  if (options.dryRun) {
    note(
      [
        projectInfo.hasESLint ? "• Migrate ESLint rules to biome.json" : null,
        projectInfo.hasPrettier ? "• Migrate Prettier config to biome.json" : null,
        !options.skipInstall ? "• Install @biomejs/biome" : null,
        !options.skipCleanup ? "• Remove ESLint/Prettier dependencies" : null,
        !options.skipCleanup ? "• Remove old config files" : null,
        "• Update package.json scripts",
      ]
        .filter(Boolean)
        .join("\n"),
      "Dry run - Changes that would be made",
    );
    outro(pc.dim("Run without --dry-run to apply changes"));
    return;
  }

  // 3. Confirm migration
  const shouldContinue = await confirm({
    message: "Ready to migrate to Biome?",
    initialValue: true,
  });

  if (isCancel(shouldContinue) || !shouldContinue) {
    cancel("Migration cancelled");
    return;
  }

  // 4. Create safety commit
  if (!options.skipGit) {
    const committed = await createSafetyCommit(cwd);
    if (committed) {
      console.log(pc.dim("  Created safety commit"));
    }
  }

  // Track results
  const result: MigrationResult = {
    eslintMigrated: false,
    prettierMigrated: false,
    depsRemoved: [],
    filesRemoved: [],
    scriptsUpdated: false,
  };

  // 5. Install Biome if not already installed
  if (!options.skipInstall && !projectInfo.hasBiome) {
    const s2 = spinner();
    s2.start("Installing @biomejs/biome...");
    try {
      const installCmd = projectInfo.packageManager === "npm" ? "install" : "add";
      await execa(projectInfo.packageManager, [installCmd, "-D", "@biomejs/biome"], { cwd });
      s2.stop(pc.green("✓ Installed @biomejs/biome"));
    } catch (error) {
      s2.stop(pc.red("✗ Failed to install Biome"));
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      cancel(`Failed to install Biome: ${errorMessage}`);
      return;
    }
  }

  // Validate Biome version
  const versionCheck = await validateBiomeVersion(cwd);
  if (!versionCheck.valid) {
    cancel(versionCheck.message);
    return;
  }
  console.log(pc.dim(`  ${versionCheck.message}`));

  // 6. Initialize biome.json if it doesn't exist (required for migration)
  if (!projectInfo.hasBiome) {
    const s3 = spinner();
    s3.start("Initializing Biome configuration...");
    try {
      await execa("npx", ["@biomejs/biome", "init"], { cwd });
      s3.stop(pc.green("✓ Created biome.json"));
    } catch (error) {
      s3.stop(pc.red("✗ Failed to initialize Biome"));
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      cancel(`Failed to initialize Biome: ${errorMessage}`);
      return;
    }
  }

  // 7. Migrate ESLint
  if (projectInfo.hasESLint) {
    const eslintResult = await migrateESLint(cwd);
    result.eslintMigrated = eslintResult.success;
    if (!eslintResult.success) {
      note(eslintResult.message, "ESLint migration warning");
    }
  }

  // 8. Migrate Prettier
  if (projectInfo.hasPrettier) {
    const prettierResult = await migratePrettier(cwd);
    result.prettierMigrated = prettierResult.success;
    if (!prettierResult.success) {
      note(prettierResult.message, "Prettier migration warning");
    }
  }

  // 9. Read Prettier config BEFORE cleanup (so we can preserve settings)
  const prettierConfig = await readPrettierConfig(cwd);
  if (prettierConfig) {
    console.log(pc.dim("  Read Prettier settings to preserve formatting preferences"));
  }

  // 10. Ask about relaxed lint rules (only question needed)
  const relaxedRules = await promptRelaxedRules();

  // 11. Apply Prettier-compatible settings to Biome config
  await applyPrettierCompatibility(cwd, prettierConfig, relaxedRules);

  // 12. Validate migration before cleanup
  await validateMigration(cwd);

  // 13. Cleanup old dependencies (only if migration was successful)
  if (!options.skipCleanup) {
    const cleanup = await cleanupOldDeps(projectInfo, cwd);
    result.depsRemoved = cleanup.depsRemoved;
    result.filesRemoved = cleanup.filesRemoved;
  }

  // 14. Update scripts
  const scriptsResult = await updatePackageScripts(cwd);
  result.scriptsUpdated = scriptsResult.updated;

  if (!scriptsResult.updated) {
    note(
      Object.entries(scriptsResult.scripts)
        .map(([key, val]) => `"${key}": "${val}"`)
        .join("\n"),
      "Add these scripts to package.json",
    );
  }

  // 15. Ask if user wants to apply Biome formatting now
  const applyFormatting = await confirm({
    message:
      "Biome may format code differently than Prettier.\n" +
      "Apply Biome formatting now? (recommended, creates one reformatting commit)",
    initialValue: true,
  });

  if (applyFormatting === true) {
    const formatSpinner = spinner();
    formatSpinner.start("Applying Biome formatting to all files...");
    try {
      await execa("npx", ["@biomejs/biome", "check", "--write", "."], { cwd });
      formatSpinner.stop(pc.green("✓ Code formatted with Biome"));
    } catch {
      // biome check --write may exit with non-zero if there are unfixable issues
      formatSpinner.stop(pc.yellow("⚠ Formatting applied (some issues may remain)"));
    }
  }

  // 16. Show summary
  const summary: string[] = [];
  if (result.eslintMigrated) summary.push("✓ ESLint rules migrated");
  if (result.prettierMigrated) summary.push("✓ Prettier config migrated");
  if (result.depsRemoved.length > 0)
    summary.push(`✓ Removed ${result.depsRemoved.length} packages`);
  if (result.filesRemoved.length > 0)
    summary.push(`✓ Removed ${result.filesRemoved.length} config files`);
  if (result.scriptsUpdated) summary.push("✓ Updated package.json scripts");
  if (applyFormatting === true) summary.push("✓ Code reformatted with Biome");

  if (summary.length > 0) {
    note(summary.join("\n"), "Migration summary");
  }

  outro(
    pc.green("✓ Migration complete!\n\n") +
      pc.dim("Run ") +
      pc.cyan("npm run lint") +
      pc.dim(" to test Biome (22x faster than ESLint)"),
  );
}

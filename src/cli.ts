import { Command } from "commander";
import { runCreate } from "./commands/create.js";
import { runMigrate } from "./commands/migrate.js";
import type { PackageManager, Template } from "./types/index.js";
import { TEMPLATES, VERSION } from "./utils/constants.js";

const program = new Command();

program
  .name("zero-setup-biome")
  .description("Zero-config CLI to scaffold React + TypeScript projects with Biome")
  .version(VERSION, "-v, --version");

program
  .argument("[project-name]", "Name of the project")
  .option("-t, --template <template>", `Template to use (${TEMPLATES.join(", ")})`, (value) => {
    if (!TEMPLATES.includes(value as Template)) {
      console.error(`Invalid template: ${value}. Available: ${TEMPLATES.join(", ")}`);
      process.exit(1);
    }
    return value;
  })
  .option("--skip-install", "Skip installing dependencies", false)
  .option("--skip-git", "Skip git initialization", false)
  .option("--pm <package-manager>", "Package manager to use (npm, pnpm, yarn, bun)")
  .action(async (projectName: string | undefined, opts) => {
    await runCreate({
      projectName,
      options: {
        template: opts.template as Template,
        skipInstall: opts.skipInstall,
        skipGit: opts.skipGit,
        packageManager: opts.pm as PackageManager | undefined,
      },
    });
  });

program
  .command("migrate")
  .description("Migrate existing project from ESLint/Prettier to Biome")
  .option("--skip-install", "Skip installing Biome", false)
  .option("--skip-cleanup", "Keep ESLint/Prettier configs and dependencies", false)
  .option("--skip-git", "Skip creating safety git commit", false)
  .option("--dry-run", "Show changes without applying them", false)
  .action(async (opts) => {
    await runMigrate({
      skipInstall: opts.skipInstall,
      skipCleanup: opts.skipCleanup,
      skipGit: opts.skipGit,
      dryRun: opts.dryRun,
    });
  });

program.parse();

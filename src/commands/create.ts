import path from "node:path";
import { cancel, confirm, intro, isCancel, note, outro, select, text } from "@clack/prompts";
import fs from "fs-extra";
import pc from "picocolors";
import { copyTemplate } from "../generators/copy-template.js";
import { initializeGit } from "../generators/git-init.js";
import { installDependencies } from "../generators/install-deps.js";
import type { CreateOptions, ProjectContext, Template } from "../types/index.js";
import { createAuditEvent, logAudit } from "../utils/audit-logger.js";
import { TEMPLATE_DESCRIPTIONS, TEMPLATES } from "../utils/constants.js";
import { detectPackageManager, getRunCommand } from "../utils/detect-pm.js";
import { validateProjectName } from "../utils/validate-name.js";

interface CreateArgs {
  projectName?: string;
  options: Partial<CreateOptions>;
}

export async function runCreate({ projectName, options }: CreateArgs): Promise<void> {
  intro(pc.bgCyan(pc.black(" zero-setup-biome ")));

  // 1. Get project name (interactive if not provided)
  let name = projectName;

  if (!name) {
    const result = await text({
      message: "What is your project named?",
      placeholder: "my-app",
      validate: (value) => {
        const validation = validateProjectName(value);
        if (!validation.valid) return validation.message;
        return undefined;
      },
    });

    if (isCancel(result)) {
      cancel("Operation cancelled");
      process.exit(0);
    }

    name = result;
  } else {
    // Validate CLI-provided name
    const validation = validateProjectName(name);
    if (!validation.valid) {
      cancel(validation.message ?? "Invalid project name");
      process.exit(1);
    }
  }

  // 2. Select template (if not specified)
  let template: Template = options.template ?? "react-ts";

  if (!options.template && TEMPLATES.length > 1) {
    const result = await select({
      message: "Select a template:",
      options: TEMPLATES.map((t) => ({
        value: t,
        label: t,
        hint: TEMPLATE_DESCRIPTIONS[t],
      })),
    });

    if (isCancel(result)) {
      cancel("Operation cancelled");
      process.exit(0);
    }

    template = result as Template;
  }

  // 3. Verify target directory
  const targetDir = path.resolve(process.cwd(), name);

  if (await fs.pathExists(targetDir)) {
    const files = await fs.readdir(targetDir);
    if (files.length > 0) {
      const shouldOverwrite = await confirm({
        message: `Directory "${name}" is not empty. Continue anyway?`,
        initialValue: false,
      });

      if (isCancel(shouldOverwrite) || !shouldOverwrite) {
        cancel("Operation cancelled");
        process.exit(0);
      }
    }
  }

  // 4. Detect package manager
  const packageManager = options.packageManager ?? detectPackageManager();

  // 5. Build context
  const context: ProjectContext = {
    projectName: name,
    targetDir,
    options: {
      template,
      skipInstall: options.skipInstall ?? false,
      skipGit: options.skipGit ?? false,
      packageManager,
    },
    packageManager,
  };

  // 6. Execute generation
  try {
    // Create directory if it doesn't exist
    await fs.ensureDir(targetDir);

    // Copy template
    await copyTemplate(context);

    // Install dependencies (if not skipped)
    if (!context.options.skipInstall) {
      await installDependencies(context);
    }

    // Initialize Git (if not skipped)
    if (!context.options.skipGit) {
      await initializeGit(context);
    }

    // 7. Show next steps
    const runCmd = getRunCommand(packageManager, "dev");
    const lintCmd = getRunCommand(packageManager, "lint");

    const nextSteps = [
      `cd ${name}`,
      ...(context.options.skipInstall ? [`${packageManager} install`] : []),
      runCmd,
    ];

    note(nextSteps.join("\n"), "Next steps");

    outro(
      pc.green("✓ ") +
        `Project created successfully!\n\n` +
        pc.dim(`  Run ${pc.cyan(lintCmd)} to check your code with Biome (22x faster than ESLint)`),
    );

    // Log successful creation
    await logAudit(
      createAuditEvent("project_created", name, true, {
        template: options.template,
        packageManager,
        skipInstall: context.options.skipInstall,
        skipGit: context.options.skipGit,
      }),
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;

    // Log failed creation
    await logAudit(
      createAuditEvent("project_creation_failed", name, false, {
        error: errorMessage,
        template: options.template,
      }),
    );

    cancel(`Failed to create project: ${errorMessage}`);

    // Show stack trace in debug mode
    if (errorStack && process.env["DEBUG"]) {
      console.error("\nStack trace:");
      console.error(errorStack);
    }

    process.exit(1);
  }
}

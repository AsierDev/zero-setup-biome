import { spinner } from "@clack/prompts";
import { execa } from "execa";
import type { ProjectContext } from "../types/index.js";
import { getInstallCommand } from "../utils/detect-pm.js";

export async function installDependencies(context: ProjectContext): Promise<void> {
  const { targetDir, packageManager } = context;
  const installCmd = getInstallCommand(packageManager);
  const cmd = installCmd[0];
  const args = installCmd.slice(1);

  if (!cmd) {
    throw new Error("Invalid install command");
  }

  const s = spinner();
  s.start(`Installing dependencies with ${packageManager}...`);

  try {
    await execa(cmd, args, {
      cwd: targetDir,
      stdio: "pipe", // Capture output, don't show in console
      env: {
        ...process.env,
        // Disable colors in CI for clean logs
        FORCE_COLOR: "0",
      },
    });
    s.stop(`Dependencies installed with ${packageManager}`);
  } catch (error) {
    s.stop("Failed to install dependencies");

    if (error instanceof Error) {
      throw new Error(`Installation failed: ${error.message}`);
    }
    throw error;
  }
}

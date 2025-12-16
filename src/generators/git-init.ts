import { spinner } from "@clack/prompts";
import { execa } from "execa";
import type { ProjectContext } from "../types/index.js";

export async function initializeGit(context: ProjectContext): Promise<void> {
  const { targetDir } = context;
  const s = spinner();

  s.start("Initializing git repository...");

  try {
    // Check if git is available
    await execa("git", ["--version"]);

    // Initialize repository
    await execa("git", ["init"], { cwd: targetDir });

    // Add all files
    await execa("git", ["add", "-A"], { cwd: targetDir });

    // Initial commit
    await execa("git", ["commit", "-m", "Initial commit from zero-setup-biome", "--no-verify"], {
      cwd: targetDir,
    });

    s.stop("Git repository initialized");
  } catch (_error) {
    s.stop("Git initialization skipped");
    // Don't throw error, git is optional
    console.warn("  Git not available or initialization failed, skipping...");
  }
}

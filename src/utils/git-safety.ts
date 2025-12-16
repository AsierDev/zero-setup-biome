import { confirm } from "@clack/prompts";
import { execa } from "execa";

export async function isGitRepo(cwd: string = process.cwd()): Promise<boolean> {
  try {
    await execa("git", ["rev-parse", "--is-inside-work-tree"], { cwd });
    return true;
  } catch {
    return false;
  }
}

export async function hasUncommittedChanges(cwd: string = process.cwd()): Promise<boolean> {
  try {
    const { stdout } = await execa("git", ["status", "--porcelain"], { cwd });
    return stdout.trim().length > 0;
  } catch {
    return false;
  }
}

export async function createSafetyCommit(cwd: string = process.cwd()): Promise<boolean> {
  // Check if it's a git repo
  if (!(await isGitRepo(cwd))) {
    return false;
  }

  // Check for uncommitted changes
  if (!(await hasUncommittedChanges(cwd))) {
    return false;
  }

  const shouldCommit = await confirm({
    message: "You have uncommitted changes. Create safety commit before migrating?",
    initialValue: true,
  });

  if (shouldCommit === true) {
    try {
      await execa("git", ["add", "."], { cwd });
      await execa("git", ["commit", "-m", "chore: backup before Biome migration", "--no-verify"], {
        cwd,
      });
      return true;
    } catch {
      return false;
    }
  }

  return false;
}

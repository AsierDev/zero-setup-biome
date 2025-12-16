import { spinner } from "@clack/prompts";
import { execa } from "execa";
import pc from "picocolors";

export async function migrateESLint(
  cwd: string = process.cwd(),
  dryRun = false,
): Promise<{ success: boolean; message: string }> {
  const s = spinner();
  s.start("Migrating ESLint config to Biome...");

  try {
    const args = ["@biomejs/biome", "migrate", "eslint", "--include-inspired"];

    if (!dryRun) {
      args.push("--write");
    }

    const { stdout, stderr } = await execa("npx", args, { cwd });

    s.stop(pc.green("✓ ESLint config migrated"));

    return {
      success: true,
      message: stdout || stderr || "ESLint configuration migrated successfully",
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    s.stop(pc.red("✗ Failed to migrate ESLint"));

    return {
      success: false,
      message: `ESLint migration failed: ${errorMessage}`,
    };
  }
}

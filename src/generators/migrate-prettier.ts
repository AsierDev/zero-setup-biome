import { spinner } from "@clack/prompts";
import { execa } from "execa";
import pc from "picocolors";

export async function migratePrettier(
  cwd: string = process.cwd(),
  dryRun = false,
): Promise<{ success: boolean; message: string }> {
  const s = spinner();
  s.start("Migrating Prettier config to Biome...");

  try {
    const args = ["@biomejs/biome", "migrate", "prettier"];

    if (!dryRun) {
      args.push("--write");
    }

    const { stdout, stderr } = await execa("npx", args, { cwd });

    s.stop(pc.green("✓ Prettier config migrated"));

    return {
      success: true,
      message: stdout || stderr || "Prettier configuration migrated successfully",
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    s.stop(pc.red("✗ Failed to migrate Prettier"));

    return {
      success: false,
      message: `Prettier migration failed: ${errorMessage}`,
    };
  }
}

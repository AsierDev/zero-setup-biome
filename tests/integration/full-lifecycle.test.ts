import os from "node:os";
import path from "node:path";
import { execa } from "execa";
import fs from "fs-extra";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * Integration tests that simulate real-world usage of the CLI.
 * These tests perform actual installations and verify the generated projects work correctly.
 */
describe("Full project lifecycle (integration)", () => {
  let tempDir: string;
  let projectPath: string;
  const projectName = "test-integration-app";

  beforeAll(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "zsb-integration-"));
    projectPath = path.join(tempDir, projectName);

    // Generate project WITH dependency installation
    await execa("npx", ["tsx", path.resolve("src/cli.ts"), projectName, "--skip-git"], {
      cwd: tempDir,
      timeout: 120000, // 2 minutes for npm install
    });
  }, 150000); // 2.5 min timeout for beforeAll

  afterAll(async () => {
    await fs.remove(tempDir);
  });

  it("can build the generated project", async () => {
    const { stdout } = await execa("npm", ["run", "build"], {
      cwd: projectPath,
      timeout: 60000,
    });

    expect(stdout).toContain("built in");
    expect(await fs.pathExists(path.join(projectPath, "dist"))).toBe(true);
  }, 70000);

  it("passes linting with Biome", async () => {
    const result = await execa("npm", ["run", "lint"], {
      cwd: projectPath,
      timeout: 30000,
    });

    expect(result.exitCode).toBe(0);
  }, 35000);

  it("passes type checking", async () => {
    const result = await execa("npm", ["run", "typecheck"], {
      cwd: projectPath,
      timeout: 30000,
    });

    expect(result.exitCode).toBe(0);
  }, 35000);

  it("has all required configuration files", async () => {
    const requiredFiles = [
      "package.json",
      "tsconfig.json",
      "vite.config.ts",
      "biome.json",
      "index.html",
      ".vscode/settings.json",
      "src/main.tsx",
      "src/App.tsx",
    ];

    for (const file of requiredFiles) {
      const exists = await fs.pathExists(path.join(projectPath, file));
      expect(exists, `Missing file: ${file}`).toBe(true);
    }
  });

  it("has Biome configured as default formatter in VSCode", async () => {
    const vscodeSettings = await fs.readJson(path.join(projectPath, ".vscode/settings.json"));

    expect(vscodeSettings["editor.defaultFormatter"]).toBe("biomejs.biome");
    expect(vscodeSettings["editor.formatOnSave"]).toBe(true);
  });

  it("does not include ESLint or Prettier", async () => {
    const pkg = await fs.readJson(path.join(projectPath, "package.json"));

    expect(pkg.devDependencies?.eslint).toBeUndefined();
    expect(pkg.devDependencies?.prettier).toBeUndefined();
    expect(pkg.devDependencies?.["@biomejs/biome"]).toBeDefined();
  });

  it("can format code with Biome", async () => {
    const result = await execa("npm", ["run", "format"], {
      cwd: projectPath,
      timeout: 10000,
    });

    expect(result.exitCode).toBe(0);
  }, 15000);
});

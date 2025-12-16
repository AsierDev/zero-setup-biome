import os from "node:os";
import path from "node:path";
import { execa } from "execa";
import fs from "fs-extra";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

describe("create command (e2e)", () => {
  let tempDir: string;
  const projectName = "test-e2e-app";
  let projectPath: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "zsb-e2e-"));
    projectPath = path.join(tempDir, projectName);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  it("generates project with correct structure", async () => {
    await execa(
      "npx",
      ["tsx", path.resolve("src/cli.ts"), projectName, "--skip-install", "--skip-git"],
      { cwd: tempDir },
    );

    // Verify essential files
    expect(await fs.pathExists(path.join(projectPath, "package.json"))).toBe(true);
    expect(await fs.pathExists(path.join(projectPath, "biome.json"))).toBe(true);
    expect(await fs.pathExists(path.join(projectPath, "vite.config.ts"))).toBe(true);
    expect(await fs.pathExists(path.join(projectPath, "tsconfig.json"))).toBe(true);
    expect(await fs.pathExists(path.join(projectPath, ".vscode/settings.json"))).toBe(true);
    expect(await fs.pathExists(path.join(projectPath, "src/App.tsx"))).toBe(true);
  });

  it("interpolates project name in package.json", async () => {
    await execa(
      "npx",
      ["tsx", path.resolve("src/cli.ts"), projectName, "--skip-install", "--skip-git"],
      { cwd: tempDir },
    );

    const pkg = await fs.readJson(path.join(projectPath, "package.json"));
    expect(pkg.name).toBe(projectName);
  });

  it("does not include ESLint or Prettier configs", async () => {
    await execa(
      "npx",
      ["tsx", path.resolve("src/cli.ts"), projectName, "--skip-install", "--skip-git"],
      { cwd: tempDir },
    );

    expect(await fs.pathExists(path.join(projectPath, ".eslintrc.js"))).toBe(false);
    expect(await fs.pathExists(path.join(projectPath, ".eslintrc.json"))).toBe(false);
    expect(await fs.pathExists(path.join(projectPath, ".prettierrc"))).toBe(false);
    expect(await fs.pathExists(path.join(projectPath, "prettier.config.js"))).toBe(false);
  });

  it("generated project has valid biome config", async () => {
    await execa(
      "npx",
      ["tsx", path.resolve("src/cli.ts"), projectName, "--skip-install", "--skip-git"],
      { cwd: tempDir },
    );

    const biomeConfig = await fs.readJson(path.join(projectPath, "biome.json"));
    expect(biomeConfig.linter).toBeDefined();
    expect(biomeConfig.formatter).toBeDefined();
    expect(biomeConfig.linter.enabled).toBe(true);
    expect(biomeConfig.formatter.enabled).toBe(true);
  });

  it("includes Biome as dev dependency", async () => {
    await execa(
      "npx",
      ["tsx", path.resolve("src/cli.ts"), projectName, "--skip-install", "--skip-git"],
      { cwd: tempDir },
    );

    const pkg = await fs.readJson(path.join(projectPath, "package.json"));
    expect(pkg.devDependencies["@biomejs/biome"]).toBeDefined();
    expect(pkg.devDependencies.eslint).toBeUndefined();
    expect(pkg.devDependencies.prettier).toBeUndefined();
  });
});

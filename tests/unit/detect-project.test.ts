import os from "node:os";
import path from "node:path";
import fs from "fs-extra";
import { beforeEach, describe, expect, it } from "vitest";
import {
  detectProject,
  getESLintConfigs,
  getPrettierConfigs,
} from "../../src/utils/detect-project.js";

describe("detectProject", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "zsb-detect-"));
    // Create a basic package.json
    await fs.writeJson(path.join(tempDir, "package.json"), {
      name: "test-project",
      version: "1.0.0",
    });
  });

  it("detects ESLint .eslintrc.json config", async () => {
    await fs.writeJson(path.join(tempDir, ".eslintrc.json"), { rules: {} });

    const result = await detectProject(tempDir);

    expect(result.hasESLint).toBe(true);
    expect(result.eslintConfig).toBe(".eslintrc.json");
  });

  it("detects ESLint eslint.config.js (flat config)", async () => {
    await fs.writeFile(path.join(tempDir, "eslint.config.js"), "export default []");

    const result = await detectProject(tempDir);

    expect(result.hasESLint).toBe(true);
    expect(result.eslintConfig).toBe("eslint.config.js");
  });

  it("detects ESLint config in package.json", async () => {
    await fs.writeJson(path.join(tempDir, "package.json"), {
      name: "test-project",
      eslintConfig: { rules: {} },
    });

    const result = await detectProject(tempDir);

    expect(result.hasESLint).toBe(true);
  });

  it("detects Prettier .prettierrc config", async () => {
    await fs.writeJson(path.join(tempDir, ".prettierrc"), { semi: true });

    const result = await detectProject(tempDir);

    expect(result.hasPrettier).toBe(true);
    expect(result.prettierConfig).toBe(".prettierrc");
  });

  it("detects Prettier config in package.json", async () => {
    await fs.writeJson(path.join(tempDir, "package.json"), {
      name: "test-project",
      prettier: { semi: true },
    });

    const result = await detectProject(tempDir);

    expect(result.hasPrettier).toBe(true);
  });

  it("detects existing Biome config", async () => {
    await fs.writeJson(path.join(tempDir, "biome.json"), { linter: { enabled: true } });

    const result = await detectProject(tempDir);

    expect(result.hasBiome).toBe(true);
  });

  it("returns false when no configs exist", async () => {
    const result = await detectProject(tempDir);

    expect(result.hasESLint).toBe(false);
    expect(result.hasPrettier).toBe(false);
    expect(result.hasBiome).toBe(false);
  });

  it("detects package manager from lockfile when no user agent", async () => {
    // Clear user agent to force lockfile detection
    const originalUserAgent = process.env["npm_config_user_agent"];
    delete process.env["npm_config_user_agent"];

    await fs.writeFile(path.join(tempDir, "pnpm-lock.yaml"), "");

    const result = await detectProject(tempDir);

    // Restore user agent
    if (originalUserAgent) {
      process.env["npm_config_user_agent"] = originalUserAgent;
    }

    expect(result.packageManager).toBe("pnpm");
  });
});

describe("getESLintConfigs", () => {
  it("returns all supported ESLint config filenames", () => {
    const configs = getESLintConfigs();

    expect(configs).toContain(".eslintrc.js");
    expect(configs).toContain(".eslintrc.json");
    expect(configs).toContain("eslint.config.js");
    expect(configs).toContain("eslint.config.mjs");
  });
});

describe("getPrettierConfigs", () => {
  it("returns all supported Prettier config filenames", () => {
    const configs = getPrettierConfigs();

    expect(configs).toContain(".prettierrc");
    expect(configs).toContain(".prettierrc.json");
    expect(configs).toContain("prettier.config.js");
  });
});

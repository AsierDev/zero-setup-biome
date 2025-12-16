import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { detectPackageManager } from "../../src/utils/detect-pm.js";

describe("detectPackageManager", () => {
  let tempDir: string;
  const originalEnv = process.env;

  beforeEach(async () => {
    tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "pm-test-"));
    process.env = { ...originalEnv };
    delete process.env.npm_config_user_agent;
  });

  afterEach(async () => {
    await fs.promises.rm(tempDir, { recursive: true, force: true });
    process.env = originalEnv;
  });

  it("detects pnpm from lockfile", async () => {
    await fs.promises.writeFile(path.join(tempDir, "pnpm-lock.yaml"), "");
    expect(detectPackageManager(tempDir)).toBe("pnpm");
  });

  it("detects yarn from lockfile", async () => {
    await fs.promises.writeFile(path.join(tempDir, "yarn.lock"), "");
    expect(detectPackageManager(tempDir)).toBe("yarn");
  });

  it("detects bun from lockfile", async () => {
    await fs.promises.writeFile(path.join(tempDir, "bun.lockb"), "");
    expect(detectPackageManager(tempDir)).toBe("bun");
  });

  it("defaults to npm when no lockfile", () => {
    expect(detectPackageManager(tempDir)).toBe("npm");
  });

  it("detects from user agent env var", () => {
    process.env.npm_config_user_agent = "pnpm/8.0.0";
    expect(detectPackageManager(tempDir)).toBe("pnpm");
  });
});

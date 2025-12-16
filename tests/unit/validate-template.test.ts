import os from "node:os";
import path from "node:path";
import fs from "fs-extra";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { validateTemplate, validateTemplateSize } from "../../src/utils/validate-template.js";

describe("validateTemplate", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "template-test-"));
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  it("throws if template directory does not exist", async () => {
    const nonExistentPath = path.join(tempDir, "non-existent");
    await expect(validateTemplate(nonExistentPath)).rejects.toThrow("Template not found");
  });

  it("validates an existing template successfully", async () => {
    // Create a minimal template
    await fs.writeFile(path.join(tempDir, "package.json"), "{}");
    await expect(validateTemplate(tempDir)).resolves.not.toThrow();
  });
});

describe("validateTemplateSize", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "size-test-"));
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  it("returns correct file count and size", async () => {
    // Create 3 files
    await fs.writeFile(path.join(tempDir, "file1.txt"), "hello");
    await fs.writeFile(path.join(tempDir, "file2.txt"), "world");
    await fs.ensureDir(path.join(tempDir, "subdir"));
    await fs.writeFile(path.join(tempDir, "subdir", "file3.txt"), "test");

    const result = await validateTemplateSize(tempDir);

    expect(result.fileCount).toBe(3);
    expect(result.totalSizeMB).toBeGreaterThan(0);
    expect(result.totalSizeMB).toBeLessThan(1);
  });

  it("skips node_modules directory", async () => {
    await fs.writeFile(path.join(tempDir, "index.js"), "code");
    await fs.ensureDir(path.join(tempDir, "node_modules"));
    await fs.writeFile(path.join(tempDir, "node_modules", "dep.js"), "dependency");

    const result = await validateTemplateSize(tempDir);

    expect(result.fileCount).toBe(1); // Only index.js, not dep.js
  });

  it("handles empty directories", async () => {
    const result = await validateTemplateSize(tempDir);

    expect(result.fileCount).toBe(0);
    expect(result.totalSizeMB).toBe(0);
  });
});

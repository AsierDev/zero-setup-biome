import { describe, expect, it } from "vitest";
import { toValidPackageName, validateProjectName } from "../../src/utils/validate-name.js";

describe("validateProjectName", () => {
  it("accepts valid project names", () => {
    expect(validateProjectName("my-app")).toEqual({ valid: true });
    expect(validateProjectName("MyApp123")).toEqual({ valid: true });
    expect(validateProjectName("app")).toEqual({ valid: true });
  });

  it("rejects empty names", () => {
    const result = validateProjectName("");
    expect(result.valid).toBe(false);
    expect(result.message).toContain("empty");
  });

  it("rejects names starting with . or _", () => {
    expect(validateProjectName(".hidden").valid).toBe(false);
    expect(validateProjectName("_private").valid).toBe(false);
  });

  it("rejects reserved names", () => {
    expect(validateProjectName("node_modules").valid).toBe(false);
  });

  it("rejects names with invalid characters", () => {
    expect(validateProjectName("my<app").valid).toBe(false);
    expect(validateProjectName("my:app").valid).toBe(false);
  });

  it("rejects path traversal attempts", () => {
    expect(validateProjectName("../evil").valid).toBe(false);
    expect(validateProjectName("foo/../bar").valid).toBe(false);
    expect(validateProjectName("/absolute/path").valid).toBe(false);
  });
});

describe("toValidPackageName", () => {
  it("converts to lowercase", () => {
    expect(toValidPackageName("MyApp")).toBe("myapp");
  });

  it("replaces spaces with hyphens", () => {
    expect(toValidPackageName("my app")).toBe("my-app");
  });

  it("removes invalid characters", () => {
    expect(toValidPackageName("my@app!")).toBe("my-app");
  });

  it("removes leading/trailing hyphens", () => {
    expect(toValidPackageName("-my-app-")).toBe("my-app");
  });
});

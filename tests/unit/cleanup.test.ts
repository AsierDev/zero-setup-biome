import { describe, expect, it } from "vitest";
import { findDepsToRemove } from "../../src/generators/cleanup.js";

describe("findDepsToRemove", () => {
  it("finds eslint package", () => {
    const pkg = {
      devDependencies: {
        eslint: "^8.0.0",
        typescript: "^5.0.0",
      },
    };

    const result = findDepsToRemove(pkg);

    expect(result).toContain("eslint");
    expect(result).not.toContain("typescript");
  });

  it("finds prettier package", () => {
    const pkg = {
      devDependencies: {
        prettier: "^3.0.0",
        typescript: "^5.0.0",
      },
    };

    const result = findDepsToRemove(pkg);

    expect(result).toContain("prettier");
  });

  it("finds @typescript-eslint packages", () => {
    const pkg = {
      devDependencies: {
        "@typescript-eslint/parser": "^6.0.0",
        "@typescript-eslint/eslint-plugin": "^6.0.0",
      },
    };

    const result = findDepsToRemove(pkg);

    expect(result).toContain("@typescript-eslint/parser");
    expect(result).toContain("@typescript-eslint/eslint-plugin");
  });

  it("finds eslint-plugin-* packages", () => {
    const pkg = {
      devDependencies: {
        "eslint-plugin-react": "^7.0.0",
        "eslint-plugin-jsx-a11y": "^6.0.0",
      },
    };

    const result = findDepsToRemove(pkg);

    expect(result).toContain("eslint-plugin-react");
    expect(result).toContain("eslint-plugin-jsx-a11y");
  });

  it("finds eslint-config-* packages", () => {
    const pkg = {
      devDependencies: {
        "eslint-config-prettier": "^9.0.0",
        "eslint-config-airbnb": "^19.0.0",
      },
    };

    const result = findDepsToRemove(pkg);

    expect(result).toContain("eslint-config-prettier");
    expect(result).toContain("eslint-config-airbnb");
  });

  it("finds prettier-* packages", () => {
    const pkg = {
      devDependencies: {
        "prettier-plugin-tailwindcss": "^0.5.0",
      },
    };

    const result = findDepsToRemove(pkg);

    expect(result).toContain("prettier-plugin-tailwindcss");
  });

  it("returns empty array when no matching deps", () => {
    const pkg = {
      devDependencies: {
        typescript: "^5.0.0",
        vite: "^5.0.0",
      },
    };

    const result = findDepsToRemove(pkg);

    expect(result).toHaveLength(0);
  });

  it("checks both dependencies and devDependencies", () => {
    const pkg = {
      dependencies: {
        eslint: "^8.0.0",
      },
      devDependencies: {
        prettier: "^3.0.0",
      },
    };

    const result = findDepsToRemove(pkg);

    expect(result).toContain("eslint");
    expect(result).toContain("prettier");
  });
});

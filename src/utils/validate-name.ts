import path from "node:path";

const INVALID_CHARS_REGEX = /[<>:"/\\|?*\x00-\x1F]/;
const NPM_RESERVED = ["node_modules", "favicon.ico"];

export interface ValidationResult {
  valid: boolean;
  message?: string;
}

export function validateProjectName(name: string): ValidationResult {
  if (!name || name.trim().length === 0) {
    return { valid: false, message: "Project name cannot be empty" };
  }

  const trimmed = name.trim();

  // Security: Prevent path traversal
  if (path.isAbsolute(trimmed) || /\.\./.test(trimmed)) {
    return { valid: false, message: "Path traversal not allowed" };
  }

  if (trimmed.startsWith(".") || trimmed.startsWith("_")) {
    return { valid: false, message: "Project name cannot start with . or _" };
  }

  if (INVALID_CHARS_REGEX.test(trimmed)) {
    return { valid: false, message: "Project name contains invalid characters" };
  }

  if (NPM_RESERVED.includes(trimmed.toLowerCase())) {
    return { valid: false, message: `"${trimmed}" is a reserved name` };
  }

  if (trimmed.length > 214) {
    return { valid: false, message: "Project name must be less than 214 characters" };
  }

  return { valid: true };
}

export function toValidPackageName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-~]/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

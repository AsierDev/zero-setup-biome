import fs from "node:fs";
import path from "node:path";
import type { PackageManager } from "../types/index.js";

interface LockfileMap {
  lockfile: string;
  pm: PackageManager;
}

const LOCKFILES: LockfileMap[] = [
  { lockfile: "bun.lockb", pm: "bun" },
  { lockfile: "pnpm-lock.yaml", pm: "pnpm" },
  { lockfile: "yarn.lock", pm: "yarn" },
  { lockfile: "package-lock.json", pm: "npm" },
];

export function detectPackageManager(cwd: string = process.cwd()): PackageManager {
  // 1. Check npm_config_user_agent environment variable
  const userAgent = process.env["npm_config_user_agent"];
  if (userAgent) {
    if (userAgent.includes("bun")) return "bun";
    if (userAgent.includes("pnpm")) return "pnpm";
    if (userAgent.includes("yarn")) return "yarn";
    if (userAgent.includes("npm")) return "npm";
  }

  // 2. Look for lockfiles in current directory
  for (const { lockfile, pm } of LOCKFILES) {
    if (fs.existsSync(path.join(cwd, lockfile))) {
      return pm;
    }
  }

  // 3. Default to npm
  return "npm";
}

export function getInstallCommand(pm: PackageManager): string[] {
  switch (pm) {
    case "bun":
      return ["bun", "install"];
    case "pnpm":
      return ["pnpm", "install"];
    case "yarn":
      return ["yarn"];
    default:
      return ["npm", "install"];
  }
}

export function getRunCommand(pm: PackageManager, script: string): string {
  switch (pm) {
    case "bun":
      return `bun run ${script}`;
    case "pnpm":
      return `pnpm ${script}`;
    case "yarn":
      return `yarn ${script}`;
    default:
      return `npm run ${script}`;
  }
}

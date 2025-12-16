export type PackageManager = "npm" | "pnpm" | "yarn" | "bun";

export type Template = "react-ts";

export interface CreateOptions {
  template: Template;
  skipInstall: boolean;
  skipGit: boolean;
  packageManager?: PackageManager;
}

export interface ProjectContext {
  projectName: string;
  targetDir: string;
  options: CreateOptions;
  packageManager: PackageManager;
}

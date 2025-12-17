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

// Migrate command types
export interface MigrateOptions {
  skipInstall: boolean;
  skipCleanup: boolean;
  skipGit: boolean;
  dryRun: boolean;
}

export interface ProjectInfo {
  hasESLint: boolean;
  hasPrettier: boolean;
  hasPackageJson: boolean;
  hasBiome: boolean;
  eslintConfig?: string;
  prettierConfig?: string;
  packageManager: PackageManager;
}

export interface MigrationResult {
  eslintMigrated: boolean;
  prettierMigrated: boolean;
  depsRemoved: string[];
  filesRemoved: string[];
  scriptsUpdated: boolean;
}

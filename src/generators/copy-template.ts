import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "fs-extra";
import type { ProjectContext } from "../types/index.js";
import { toValidPackageName } from "../utils/validate-name.js";
import { validateTemplate } from "../utils/validate-template.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Files that need interpolation
const DYNAMIC_FILES = ["package.json", "README.md", "index.html"];

export async function copyTemplate(context: ProjectContext): Promise<void> {
  const { projectName, targetDir, options } = context;

  // Detect if we're running from source (dev) or compiled (prod)
  // Check for /dist/ in path OR /dist at the end
  const isCompiledContext = /\/dist(\/|$)/.test(__dirname);
  // In dev: src/generators/ -> need ../../templates
  // In prod: dist/ -> need ../templates (after build, dist is flat)
  const templatesRelativePath = isCompiledContext ? "../templates" : "../../templates";

  // Path to template
  const templateDir = path.resolve(__dirname, templatesRelativePath, options.template);

  // Validate template before copying (security check + existence check)
  await validateTemplate(templateDir);

  // Copy entire template
  await fs.copy(templateDir, targetDir, {
    filter: (src) => {
      const basename = path.basename(src);
      // Exclude node_modules if present in template
      return basename !== "node_modules";
    },
  });

  // Interpolate dynamic files
  await interpolateFiles(targetDir, {
    projectName,
    packageName: toValidPackageName(projectName),
  });

  // Rename _gitignore to .gitignore (npm ignores .gitignore on publish)
  const gitignorePath = path.join(targetDir, "_gitignore");
  if (await fs.pathExists(gitignorePath)) {
    await fs.rename(gitignorePath, path.join(targetDir, ".gitignore"));
  }

  // Rename _biome.json to biome.json (avoid nested config detection during CLI lint)
  const biomePath = path.join(targetDir, "_biome.json");
  if (await fs.pathExists(biomePath)) {
    await fs.rename(biomePath, path.join(targetDir, "biome.json"));
  }
}

interface InterpolationVars {
  projectName: string;
  packageName: string;
}

async function interpolateFiles(dir: string, vars: InterpolationVars): Promise<void> {
  for (const filename of DYNAMIC_FILES) {
    const filepath = path.join(dir, filename);
    if (!(await fs.pathExists(filepath))) continue;

    let content = await fs.readFile(filepath, "utf-8");

    // Replace placeholders
    content = content
      .replace(/{{projectName}}/g, vars.projectName)
      .replace(/{{packageName}}/g, vars.packageName);

    await fs.writeFile(filepath, content, "utf-8");
  }
}

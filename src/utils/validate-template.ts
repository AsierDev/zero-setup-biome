import path from "node:path";
import fs from "fs-extra";

const MAX_TEMPLATE_SIZE_MB = 100;
const MAX_FILE_COUNT = 10000;

interface TemplateSizeInfo {
  totalSizeMB: number;
  fileCount: number;
}

/**
 * Validates that a template directory doesn't exceed reasonable size limits.
 * Prevents DoS attacks via extremely large templates.
 *
 * @param templateDir - Absolute path to template directory
 * @throws Error if template exceeds size or file count limits
 */
export async function validateTemplateSize(templateDir: string): Promise<TemplateSizeInfo> {
  let totalSize = 0;
  let fileCount = 0;

  async function scanDirectory(dir: string): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      // Skip node_modules
      if (entry.name === "node_modules") continue;

      if (entry.isDirectory()) {
        await scanDirectory(fullPath);
      } else if (entry.isFile()) {
        fileCount++;
        const stat = await fs.stat(fullPath);
        totalSize += stat.size;

        // Early exit if limits exceeded
        if (fileCount > MAX_FILE_COUNT) {
          throw new Error(
            `Template contains too many files (>${MAX_FILE_COUNT}). This may indicate a misconfigured template.`,
          );
        }
      }
    }
  }

  await scanDirectory(templateDir);

  const totalSizeMB = totalSize / (1024 * 1024);

  if (totalSizeMB > MAX_TEMPLATE_SIZE_MB) {
    throw new Error(
      `Template size (${totalSizeMB.toFixed(2)}MB) exceeds maximum allowed size of ${MAX_TEMPLATE_SIZE_MB}MB`,
    );
  }

  return { totalSizeMB, fileCount };
}

/**
 * Validates that the template is safe to use.
 * Should be called before copying template files.
 *
 * @param templateDir - Absolute path to template directory
 * @throws Error if template validation fails
 */
export async function validateTemplate(templateDir: string): Promise<void> {
  // Check template exists
  if (!(await fs.pathExists(templateDir))) {
    throw new Error(`Template not found at ${templateDir}`);
  }

  // Validate size constraints
  const sizeInfo = await validateTemplateSize(templateDir);

  // Optional: log template info in verbose mode
  if (process.env["DEBUG"]) {
    console.debug(
      `Template validated: ${sizeInfo.fileCount} files, ${sizeInfo.totalSizeMB.toFixed(2)}MB`,
    );
  }
}

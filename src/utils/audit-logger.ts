import path from "node:path";
import fs from "fs-extra";

export interface AuditEvent {
  timestamp: string;
  event: string;
  projectName: string;
  success: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * Logs audit events to a local log file for security and compliance tracking.
 * Creates a timestamped JSON log entry for each significant event.
 *
 * @param event - Audit event to log
 */
export async function logAudit(event: AuditEvent): Promise<void> {
  // Only log in production or when explicitly enabled
  if (process.env["NODE_ENV"] === "test" && !process.env["AUDIT_LOG_ENABLED"]) {
    return;
  }

  try {
    const logDir = path.join(process.cwd(), ".zero-setup-biome");
    const logFile = path.join(logDir, "audit.log");

    // Ensure log directory exists
    await fs.ensureDir(logDir);

    // Create log entry
    const entry = `${JSON.stringify(event)}\n`;

    // Append to log file
    await fs.appendFile(logFile, entry, "utf-8");
  } catch (error) {
    // Don't fail the main operation if logging fails
    if (process.env["DEBUG"]) {
      console.warn("Failed to write audit log:", error);
    }
  }
}

/**
 * Creates an audit event with current timestamp.
 *
 * @param event - Event type identifier
 * @param projectName - Name of the project being created
 * @param success - Whether the operation succeeded
 * @param metadata - Optional additional information
 * @returns Formatted audit event
 */
export function createAuditEvent(
  event: string,
  projectName: string,
  success: boolean,
  metadata?: Record<string, unknown>,
): AuditEvent {
  return {
    timestamp: new Date().toISOString(),
    event,
    projectName,
    success,
    metadata,
  };
}

/**
 * WriteFileTool - Tool for writing file contents
 *
 * This tool allows agents to write content to files in the workspace.
 * It requires the FS_WRITE permission and includes safety checks.
 */

import * as fs from "fs/promises";
import * as path from "path";
import { AgentType } from "../../agents/core/types.js";
import { FileSystemTool } from "../core/baseTool.js";
import { ToolCategory, ToolPermission } from "../core/types.js";

/**
 * Tool for writing files
 */
export class WriteFileTool extends FileSystemTool {
  name = "write_file";
  description =
    "Write content to a file. Provide the file path relative to the workspace root and the content to write. Creates backup of existing files.";

  constructor(private workspaceRoot: string = process.cwd()) {
    super();

    // Register this tool for developer and coordinator agents
    // Note: This tool needs FS_WRITE permission
    this.register(
      [AgentType.DEVELOPER, AgentType.COORDINATOR],
      ToolCategory.FILESYSTEM,
      [ToolPermission.FS_READ, ToolPermission.FS_WRITE],
      {
        example: 'write_file path/to/file.txt "Content to write"',
        returnFormat: "String indicating success or error message",
      },
    );
  }

  /**
   * Execute the file writing functionality
   * @param input Combined file path and content
   * @returns Success message or error
   */
  protected async execute(input: string): Promise<string> {
    try {
      // Parse input to get file path and content
      const firstQuoteIndex = input.indexOf('"');
      const lastQuoteIndex = input.lastIndexOf('"');

      if (
        firstQuoteIndex === -1 ||
        lastQuoteIndex === -1 ||
        firstQuoteIndex === lastQuoteIndex
      ) {
        return `Error: Invalid input format. Please provide path and content like: path/to/file.txt "Content to write"`;
      }

      const filePath = input.substring(0, firstQuoteIndex).trim();
      const content = input.substring(firstQuoteIndex + 1, lastQuoteIndex);

      // Sanitize and resolve the file path
      const sanitizedPath = filePath.trim();
      const resolvedPath = path.isAbsolute(sanitizedPath)
        ? sanitizedPath
        : path.join(this.workspaceRoot, sanitizedPath);

      // Verify path is within workspace
      const relativePath = path.relative(this.workspaceRoot, resolvedPath);
      if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
        return `Error: Cannot write files outside the workspace. Path: ${filePath}`;
      }

      // Create directory if it doesn't exist
      const dir = path.dirname(resolvedPath);
      await fs.mkdir(dir, { recursive: true });

      // Create backup if file exists
      try {
        const fileStats = await fs.stat(resolvedPath);
        if (fileStats.isFile()) {
          const backupPath = `${resolvedPath}.bak`;
          await fs.copyFile(resolvedPath, backupPath);
        }
      } catch (err) {
        // File doesn't exist, no backup needed
      }

      // Write the file
      await fs.writeFile(resolvedPath, content, "utf-8");
      return `Successfully wrote file: ${filePath}`;
    } catch (error) {
      throw new Error(
        `Failed to write file: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}

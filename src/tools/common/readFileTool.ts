/**
 * ReadFileTool - Tool for reading file contents
 *
 * This tool allows agents to read the contents of files in the workspace.
 */

import * as fs from "fs/promises";
import * as path from "path";
import { AgentType } from "../../agents/core/types.js";
import { FileSystemTool } from "../core/baseTool.js";

/**
 * Tool for reading files
 */
export class ReadFileTool extends FileSystemTool {
  name = "read_file";
  description =
    "Read the contents of a file. Provide the file path relative to the workspace root.";

  constructor(private workspaceRoot: string = process.cwd()) {
    super();

    // Register this tool for all agent types
    this.registerFileSystemTool(
      [
        AgentType.COORDINATOR,
        AgentType.DEVELOPER,
        AgentType.RESEARCH,
        AgentType.SECURITY,
      ],
      true,
      {
        example: "read_file path/to/file.txt",
        returnFormat: "File contents as text or error message",
      },
    );
  }

  /**
   * Execute the file reading functionality
   * @param filePath Path to the file to read
   * @returns Contents of the file
   */
  protected async execute(filePath: string): Promise<string> {
    try {
      // Sanitize and resolve the file path
      const sanitizedPath = filePath.trim();
      const resolvedPath = path.isAbsolute(sanitizedPath)
        ? sanitizedPath
        : path.join(this.workspaceRoot, sanitizedPath);

      // Verify path is within workspace
      const relativePath = path.relative(this.workspaceRoot, resolvedPath);
      if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
        return `Error: Cannot access files outside the workspace. Path: ${filePath}`;
      }

      // Check if file exists
      await fs.access(resolvedPath);

      // Read the file
      const content = await fs.readFile(resolvedPath, "utf-8");
      return content;
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        return `Error: File not found - ${filePath}`;
      }
      throw error;
    }
  }
}

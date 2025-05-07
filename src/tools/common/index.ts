/**
 * Common Tools
 *
 * This file exports all general-purpose tools that can be used by multiple agent types.
 */

export * from "./readFileTool.js";
export * from "./writeFileTool.js";

/**
 * Initialize all common tools
 * @param workspaceRoot The workspace root path
 * @returns Array of initialized common tools
 */
export function initializeCommonTools(workspaceRoot: string = process.cwd()) {
  const { ReadFileTool } = require("./readFileTool.js");
  const { WriteFileTool } = require("./writeFileTool.js");

  return [new ReadFileTool(workspaceRoot), new WriteFileTool(workspaceRoot)];
}

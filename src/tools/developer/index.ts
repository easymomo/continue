/**
 * Developer Tools
 *
 * This file exports all tools specifically designed for the developer agent.
 */

export * from "./codeAnalysisTool.js";

/**
 * Initialize all developer tools
 * @param workspaceRoot The workspace root path
 * @returns Array of initialized developer tools
 */
export function initializeDeveloperTools(
  workspaceRoot: string = process.cwd(),
) {
  const { CodeAnalysisTool } = require("./codeAnalysisTool.js");

  return [new CodeAnalysisTool(workspaceRoot)];
}

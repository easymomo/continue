/**
 * Research Tools
 *
 * This file exports all tools specifically designed for the research agent.
 */

export * from "./documentationTool.js";
export * from "./webSearchTool.js";

/**
 * Initialize all research tools
 * @param workspaceRoot The workspace root path
 * @returns Array of initialized research tools
 */
export function initializeResearchTools(workspaceRoot: string = process.cwd()) {
  const { WebSearchTool } = require("./webSearchTool.js");
  const { DocumentationTool } = require("./documentationTool.js");

  return [new WebSearchTool(), new DocumentationTool()];
}

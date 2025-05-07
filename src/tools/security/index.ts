/**
 * Security Tools
 *
 * This file exports all tools specifically designed for the security agent.
 */

export * from "./dependencyScanTool.js";

/**
 * Initialize all security tools
 * @returns Array of initialized security tools
 */
export function initializeSecurityTools() {
  const { DependencyScanTool } = require("./dependencyScanTool.js");

  return [new DependencyScanTool()];
}

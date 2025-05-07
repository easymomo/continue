/**
 * AIgents Tool System
 *
 * This file exports the complete tool system, including core components,
 * tool categories, and initialization functions.
 */

// Export core components
export * from "./core/index.js";

// Export tool categories
export * from "./common/index.js";
export * from "./developer/index.js";
export * from "./research/index.js";
export * from "./security/index.js";

/**
 * Initialize the complete tool system
 * Registers all available tools with the ToolFactory
 *
 * @param workspaceRoot The workspace root path for filesystem tools
 * @returns The initialized ToolFactory instance
 */
export function initializeToolSystem(workspaceRoot: string = process.cwd()) {
  const { initializeToolFactory } = require("./core/toolFactory.js");

  // Initialize the tool factory
  // This will register all tools from all categories
  const factory = initializeToolFactory();

  return factory;
}

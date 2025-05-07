/**
 * Tool Factory - Central management system for agent tools
 *
 * The ToolFactory provides a centralized way to register, categorize,
 * and retrieve tools for different agent types. It manages tool
 * metadata and supports filtering by agent type, category, and permissions.
 */

import { AgentType } from "../../agents/core/types.js";
import {
  AgentTool,
  ToolCategory,
  ToolDefinition,
  ToolMetadata,
  ToolPermission,
} from "./types.js";

/**
 * Options for filtering tools
 */
export interface ToolFilterOptions {
  // Filter by categories
  categories?: ToolCategory[];

  // Filter by permissions
  permissions?: ToolPermission[];

  // Search in name or description
  searchTerm?: string;
}

/**
 * ToolFactory for managing and providing tools to agents
 */
export class ToolFactory {
  // Registry of all available tools
  private toolRegistry: Map<string, ToolDefinition> = new Map();

  // Singleton instance
  private static instance: ToolFactory;

  /**
   * Get the singleton instance of the ToolFactory
   */
  public static getInstance(): ToolFactory {
    if (!ToolFactory.instance) {
      ToolFactory.instance = new ToolFactory();
    }
    return ToolFactory.instance;
  }

  /**
   * Register a tool with metadata
   * @param tool The tool implementation
   * @param metadata Metadata describing the tool
   */
  public registerTool(tool: AgentTool, metadata: ToolMetadata): void {
    // Ensure the tool has a name
    if (!tool.name) {
      throw new Error("Tool must have a name");
    }

    // Check if a tool with this name already exists
    if (this.toolRegistry.has(tool.name)) {
      throw new Error(`Tool with name ${tool.name} is already registered`);
    }

    // Add the tool to the registry
    this.toolRegistry.set(tool.name, { tool, metadata });
  }

  /**
   * Get a tool by name
   * @param name Tool name
   * @returns The tool or undefined if not found
   */
  public getTool(name: string): AgentTool | undefined {
    const definition = this.toolRegistry.get(name);
    return definition?.tool;
  }

  /**
   * Get all tools for a specific agent type
   * @param agentType The agent type to get tools for
   * @param options Additional filter options
   * @returns Array of tools for the agent
   */
  public getToolsForAgent(
    agentType: AgentType,
    options: ToolFilterOptions = {},
  ): AgentTool[] {
    return Array.from(this.toolRegistry.values())
      .filter((def) => {
        // Filter by agent type
        if (!def.metadata.agentTypes.includes(agentType)) {
          return false;
        }

        // Filter by categories if specified
        if (options.categories && options.categories.length > 0) {
          if (!options.categories.includes(def.metadata.category)) {
            return false;
          }
        }

        // Filter by permissions if specified
        if (options.permissions && options.permissions.length > 0) {
          const hasAllPermissions = options.permissions.every((permission) =>
            def.metadata.permissions.includes(permission),
          );
          if (!hasAllPermissions) {
            return false;
          }
        }

        // Filter by search term if specified
        if (options.searchTerm) {
          const searchTermLower = options.searchTerm.toLowerCase();
          const nameMatch = def.tool.name
            .toLowerCase()
            .includes(searchTermLower);
          const descMatch = def.tool.description
            .toLowerCase()
            .includes(searchTermLower);
          if (!nameMatch && !descMatch) {
            return false;
          }
        }

        return true;
      })
      .map((def) => def.tool);
  }

  /**
   * Get all tools in a specific category
   * @param category The tool category
   * @returns Array of tools in the category
   */
  public getToolsByCategory(category: ToolCategory): AgentTool[] {
    return Array.from(this.toolRegistry.values())
      .filter((def) => def.metadata.category === category)
      .map((def) => def.tool);
  }

  /**
   * Get all registered tools
   * @returns Array of all tools
   */
  public getAllTools(): AgentTool[] {
    return Array.from(this.toolRegistry.values()).map((def) => def.tool);
  }

  /**
   * Clear all registered tools
   */
  public clearTools(): void {
    this.toolRegistry.clear();
  }

  /**
   * Get metadata for a specific tool
   * @param toolName Name of the tool
   * @returns Tool metadata or undefined if tool not found
   */
  public getToolMetadata(toolName: string): ToolMetadata | undefined {
    return this.toolRegistry.get(toolName)?.metadata;
  }

  /**
   * Get all tools that require specific permissions
   * @param permissions Permissions to filter by
   * @returns Array of tools with the specified permissions
   */
  public getToolsByPermission(permissions: ToolPermission[]): AgentTool[] {
    return Array.from(this.toolRegistry.values())
      .filter((def) => {
        return permissions.every((p) => def.metadata.permissions.includes(p));
      })
      .map((def) => def.tool);
  }
}

/**
 * Initialize the tool factory with standard tools
 * @returns Initialized tool factory instance
 */
export function initializeToolFactory(): ToolFactory {
  const factory = ToolFactory.getInstance();

  // Clear any existing tools (useful for testing)
  factory.clearTools();

  // Register common tools
  registerCommonTools(factory);

  // Register developer tools
  registerDeveloperTools(factory);

  // Register research tools
  registerResearchTools(factory);

  // Register security tools
  registerSecurityTools(factory);

  return factory;
}

/**
 * Register common tools available to all agent types
 * @param factory Tool factory to register tools with
 */
function registerCommonTools(factory: ToolFactory): void {
  const { initializeCommonTools } = require("../common/index.js");
  const commonTools = initializeCommonTools();

  // Tools are self-registering via the BaseAgentTool.register method
  // We just need to initialize them
  console.log(`Registered ${commonTools.length} common tools`);
}

/**
 * Register developer-specific tools
 * @param factory Tool factory to register tools with
 */
function registerDeveloperTools(factory: ToolFactory): void {
  const { initializeDeveloperTools } = require("../developer/index.js");
  const developerTools = initializeDeveloperTools();

  console.log(`Registered ${developerTools.length} developer tools`);
}

/**
 * Register research-specific tools
 * @param factory Tool factory to register tools with
 */
function registerResearchTools(factory: ToolFactory): void {
  const { initializeResearchTools } = require("../research/index.js");
  const researchTools = initializeResearchTools();

  console.log(`Registered ${researchTools.length} research tools`);
}

/**
 * Register security-specific tools
 * @param factory Tool factory to register tools with
 */
function registerSecurityTools(factory: ToolFactory): void {
  const { initializeSecurityTools } = require("../security/index.js");
  const securityTools = initializeSecurityTools();

  console.log(`Registered ${securityTools.length} security tools`);
}

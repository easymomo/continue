/**
 * Tool Factory - Central management system for agent tools
 *
 * The ToolFactory provides a centralized way to register, categorize,
 * and retrieve tools for different agent types. It manages tool
 * metadata and supports filtering by agent type, category, and permissions.
 */
import { AgentType } from "../../agents/core/types.js";
import { AgentTool, ToolCategory, ToolMetadata, ToolPermission } from "./types.js";
/**
 * Options for filtering tools
 */
export interface ToolFilterOptions {
    categories?: ToolCategory[];
    permissions?: ToolPermission[];
    searchTerm?: string;
}
/**
 * ToolFactory for managing and providing tools to agents
 */
export declare class ToolFactory {
    private toolRegistry;
    private static instance;
    /**
     * Get the singleton instance of the ToolFactory
     */
    static getInstance(): ToolFactory;
    /**
     * Register a tool with metadata
     * @param tool The tool implementation
     * @param metadata Metadata describing the tool
     */
    registerTool(tool: AgentTool, metadata: ToolMetadata): void;
    /**
     * Get a tool by name
     * @param name Tool name
     * @returns The tool or undefined if not found
     */
    getTool(name: string): AgentTool | undefined;
    /**
     * Get all tools for a specific agent type
     * @param agentType The agent type to get tools for
     * @param options Additional filter options
     * @returns Array of tools for the agent
     */
    getToolsForAgent(agentType: AgentType, options?: ToolFilterOptions): AgentTool[];
    /**
     * Get all tools in a specific category
     * @param category The tool category
     * @returns Array of tools in the category
     */
    getToolsByCategory(category: ToolCategory): AgentTool[];
    /**
     * Get all registered tools
     * @returns Array of all tools
     */
    getAllTools(): AgentTool[];
    /**
     * Clear all registered tools
     */
    clearTools(): void;
    /**
     * Get metadata for a specific tool
     * @param toolName Name of the tool
     * @returns Tool metadata or undefined if tool not found
     */
    getToolMetadata(toolName: string): ToolMetadata | undefined;
    /**
     * Get all tools that require specific permissions
     * @param permissions Permissions to filter by
     * @returns Array of tools with the specified permissions
     */
    getToolsByPermission(permissions: ToolPermission[]): AgentTool[];
}
/**
 * Initialize the tool factory with standard tools
 * @returns Initialized tool factory instance
 */
export declare function initializeToolFactory(): ToolFactory;

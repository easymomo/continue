/**
 * Core type definitions for the agent tool system
 *
 * This file defines the fundamental interfaces and types used throughout
 * the tool system, including metadata, categories, and permissions.
 */
import { Tool as LangChainTool } from "@langchain/core/tools";
import { AgentType } from "../../agents/core/types.js";
/**
 * Categories for agent tools based on functionality
 */
export declare enum ToolCategory {
    FILESYSTEM = "filesystem",
    CODE_ANALYSIS = "code_analysis",
    CODE_GENERATION = "code_generation",
    WEB_SEARCH = "web_search",
    DOCUMENTATION = "documentation",
    SECURITY_SCAN = "security_scan",
    DEPENDENCY_AUDIT = "dependency_audit",
    DATABASE = "database",
    TESTING = "testing",
    VERSION_CONTROL = "version_control",
    UTILITY = "utility"
}
/**
 * Permission levels for tools
 */
export declare enum ToolPermission {
    NONE = "none",
    FS_READ = "filesystem_read",
    FS_WRITE = "filesystem_write",
    NETWORK = "network",
    EXECUTE = "execute",
    DATABASE = "database"
}
/**
 * Metadata for agent tools
 */
export interface ToolMetadata {
    agentTypes: AgentType[];
    category: ToolCategory;
    description: string;
    permissions: ToolPermission[];
    [key: string]: any;
}
/**
 * Tool definition including the tool and its metadata
 */
export interface ToolDefinition {
    tool: LangChainTool;
    metadata: ToolMetadata;
}
/**
 * Type alias for LangChain Tool
 */
export type AgentTool = LangChainTool;

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
export enum ToolCategory {
  // File and filesystem operations
  FILESYSTEM = "filesystem",

  // Code manipulation and analysis
  CODE_ANALYSIS = "code_analysis",
  CODE_GENERATION = "code_generation",

  // Information retrieval
  WEB_SEARCH = "web_search",
  DOCUMENTATION = "documentation",

  // Security tools
  SECURITY_SCAN = "security_scan",
  DEPENDENCY_AUDIT = "dependency_audit",

  // Database operations
  DATABASE = "database",

  // Testing tools
  TESTING = "testing",

  // Version control
  VERSION_CONTROL = "version_control",

  // Utility tools
  UTILITY = "utility",
}

/**
 * Permission levels for tools
 */
export enum ToolPermission {
  // No special permissions required
  NONE = "none",

  // Read-only filesystem access
  FS_READ = "filesystem_read",

  // Write access to filesystem
  FS_WRITE = "filesystem_write",

  // Network access
  NETWORK = "network",

  // Execute commands
  EXECUTE = "execute",

  // Database access
  DATABASE = "database",
}

/**
 * Metadata for agent tools
 */
export interface ToolMetadata {
  // Agent types that can use this tool
  agentTypes: AgentType[];

  // Functional category
  category: ToolCategory;

  // Human-readable description
  description: string;

  // Required permissions
  permissions: ToolPermission[];

  // Additional metadata properties
  [key: string]: any;
}

/**
 * Tool definition including the tool and its metadata
 */
export interface ToolDefinition {
  // The actual tool implementation
  tool: LangChainTool;

  // Metadata about the tool
  metadata: ToolMetadata;
}

/**
 * Type alias for LangChain Tool
 */
export type AgentTool = LangChainTool;

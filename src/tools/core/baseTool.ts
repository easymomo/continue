/**
 * Base Tool Implementation
 *
 * Provides a base class for creating tools with consistent error handling,
 * logging, and integration with the agent system.
 */

import { Tool } from "@langchain/core/tools";
import { AgentType } from "../../agents/core/types.js";
import { ToolFactory } from "./toolFactory.js";
import { ToolCategory, ToolMetadata, ToolPermission } from "./types.js";

/**
 * Abstract base class for all agent tools
 */
export abstract class BaseAgentTool extends Tool {
  /**
   * Register this tool with the tool factory
   * @param agentTypes Agent types that can use this tool
   * @param category Tool category
   * @param permissions Required permissions
   * @param additionalMetadata Additional metadata properties
   */
  public register(
    agentTypes: AgentType[],
    category: ToolCategory,
    permissions: ToolPermission[] = [ToolPermission.NONE],
    additionalMetadata: Record<string, any> = {},
  ): void {
    const metadata: ToolMetadata = {
      agentTypes,
      category,
      description: this.description,
      permissions,
      ...additionalMetadata,
    };

    ToolFactory.getInstance().registerTool(this, metadata);
  }

  /**
   * Run the tool with error handling
   * @param arg Tool argument
   * @returns Tool result
   */
  async _call(arg: string): Promise<string> {
    try {
      return await this.execute(arg);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      console.error(`Error in tool ${this.name}:`, errorMessage);
      return `Error executing tool ${this.name}: ${errorMessage}`;
    }
  }

  /**
   * Execute the tool functionality
   * @param arg Tool argument
   * @returns Tool result
   */
  protected abstract execute(arg: string): Promise<string>;
}

/**
 * Base class for tools that require filesystem access
 */
export abstract class FileSystemTool extends BaseAgentTool {
  /**
   * Register this tool with filesystem permissions
   * @param agentTypes Agent types that can use this tool
   * @param readOnly Whether the tool only reads from the filesystem
   * @param additionalMetadata Additional metadata properties
   */
  public registerFileSystemTool(
    agentTypes: AgentType[],
    readOnly: boolean = true,
    additionalMetadata: Record<string, any> = {},
  ): void {
    const permissions = readOnly
      ? [ToolPermission.FS_READ]
      : [ToolPermission.FS_READ, ToolPermission.FS_WRITE];

    this.register(
      agentTypes,
      ToolCategory.FILESYSTEM,
      permissions,
      additionalMetadata,
    );
  }
}

/**
 * Base class for tools that require network access
 */
export abstract class NetworkTool extends BaseAgentTool {
  /**
   * Register this tool with network permissions
   * @param agentTypes Agent types that can use this tool
   * @param category Tool category
   * @param additionalMetadata Additional metadata properties
   */
  public registerNetworkTool(
    agentTypes: AgentType[],
    category: ToolCategory,
    additionalMetadata: Record<string, any> = {},
  ): void {
    this.register(
      agentTypes,
      category,
      [ToolPermission.NETWORK],
      additionalMetadata,
    );
  }
}

/**
 * Base class for tools that execute commands
 */
export abstract class ExecutionTool extends BaseAgentTool {
  /**
   * Register this tool with execution permissions
   * @param agentTypes Agent types that can use this tool
   * @param category Tool category
   * @param additionalMetadata Additional metadata properties
   */
  public registerExecutionTool(
    agentTypes: AgentType[],
    category: ToolCategory,
    additionalMetadata: Record<string, any> = {},
  ): void {
    this.register(
      agentTypes,
      category,
      [ToolPermission.EXECUTE],
      additionalMetadata,
    );
  }
}

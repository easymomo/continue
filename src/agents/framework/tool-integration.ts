/**
 * Agent Tool Integration
 *
 * This file provides integration between the agent system and the tool system.
 * It allows agents to access tools appropriate for their type and permissions.
 */

import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { Tool } from "@langchain/core/tools";
import type { ToolFilterOptions } from "../../tools/core/toolFactory.js";
import { ToolFactory } from "../../tools/core/toolFactory.js";
import { ToolCategory } from "../../tools/core/types.js";
import { Agent, AgentType } from "../core/types.js";

/**
 * Initialize the tool system and get tools for all agent types
 *
 * @param workspaceRoot The workspace root directory
 * @returns The initialized ToolFactory instance
 */
export function initializeAgentTools(
  workspaceRoot: string = process.cwd(),
): ToolFactory {
  const { initializeToolSystem } = require("../../tools/index.js");
  return initializeToolSystem(workspaceRoot);
}

/**
 * Get tools for a specific agent type
 *
 * @param agentType The type of agent to get tools for
 * @param options Additional filter options
 * @returns Array of tools for the agent
 */
export function getToolsForAgentType(
  agentType: AgentType,
  options: ToolFilterOptions = {},
): Tool[] {
  const factory = ToolFactory.getInstance();
  return factory.getToolsForAgent(agentType, options);
}

/**
 * Attach appropriate tools to an agent
 *
 * @param agent The agent to attach tools to
 * @param model The language model for the agent
 * @param options Additional filter options
 * @returns The updated agent with tools attached
 */
export function attachToolsToAgent(
  agent: Agent,
  model: BaseChatModel,
  options: ToolFilterOptions = {},
): Agent {
  // Get appropriate tools for this agent type
  const tools = getToolsForAgentType(agent.type as AgentType, options);

  // Attach the tools to the agent
  // This is a simple approach - in a real implementation you might want to
  // check if the agent has a setTools method or similar
  (agent as any).tools = tools;

  return agent;
}

/**
 * Get tools by category
 *
 * @param category The tool category to filter by
 * @returns Array of tools in the specified category
 */
export function getToolsByCategory(category: ToolCategory): Tool[] {
  const factory = ToolFactory.getInstance();
  return factory.getToolsByCategory(category);
}

/**
 * Check if the tool system is initialized
 *
 * @returns True if the tool system is initialized
 */
export function isToolSystemInitialized(): boolean {
  try {
    ToolFactory.getInstance();
    return true;
  } catch (error) {
    return false;
  }
}

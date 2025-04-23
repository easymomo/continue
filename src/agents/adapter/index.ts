/**
 * AgentAdapter
 *
 * This adapter integrates our multi-agent system with the existing VS Code extension.
 * It acts as a non-invasive overlay that intercepts the message flow between
 * the Redux workflow and the LLM, routing through our agent coordination system.
 */

import { ContextItem, Message, Tool } from "../../types";
import { AgentCoordinator } from "../coordinator";

export class AgentAdapter {
  private coordinator: AgentCoordinator;
  private enabled: boolean;

  constructor() {
    this.coordinator = new AgentCoordinator();
    this.enabled = true; // Can be toggled through configuration
  }

  /**
   * Intercepts messages before they are sent to the LLM
   *
   * @param messages Array of messages in the conversation
   * @param tools Optional tools available for the LLM
   * @param options Additional options for the LLM request
   * @returns Processed messages to be sent to the LLM
   */
  async interceptMessages(
    messages: Message[],
    tools?: Tool[],
    options?: any,
  ): Promise<Message[]> {
    if (!this.enabled) {
      // Pass through if multi-agent system is disabled
      return messages;
    }

    try {
      // Route the messages through our agent coordination system
      const processedMessages = await this.coordinator.processMessages(
        messages,
        tools,
        options,
      );

      return processedMessages;
    } catch (error) {
      console.error("Error in agent adapter:", error);
      // Fallback to original messages if something goes wrong
      return messages;
    }
  }

  /**
   * Handles tool calls through our specialized agents
   *
   * @param toolCall The tool call from the LLM
   * @param context The context for the tool execution
   * @returns The result of the tool execution
   */
  async handleToolCall(toolCall: any, context: any): Promise<ContextItem[]> {
    if (!this.enabled) {
      // If multi-agent is disabled, return null to let the original handler work
      return null;
    }

    try {
      // Route the tool call through our coordinator
      return await this.coordinator.executeTool(toolCall, context);
    } catch (error) {
      console.error("Error handling tool call in agent adapter:", error);
      // Return null to fall back to the original handler
      return null;
    }
  }

  /**
   * Processes the results after a tool call before they are sent back to the LLM
   *
   * @param toolCallId The ID of the tool call
   * @param toolOutput The output from the tool execution
   * @returns Processed tool output
   */
  async processToolResults(
    toolCallId: string,
    toolOutput: ContextItem[],
  ): Promise<ContextItem[]> {
    if (!this.enabled) {
      return toolOutput;
    }

    try {
      // Allow our coordinator to process and enhance the tool results
      return await this.coordinator.processToolResults(toolCallId, toolOutput);
    } catch (error) {
      console.error("Error processing tool results in agent adapter:", error);
      return toolOutput;
    }
  }
}

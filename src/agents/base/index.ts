/**
 * BaseAgent
 *
 * Foundation class for all agents in our system. Provides common functionality
 * for message handling, state management, and communication.
 */

import { v4 as uuidv4 } from "uuid";
import { AgentTool, AgentToolkit } from "../../mcp/bridge";
import {
  AgentMessage,
  AgentType,
  ContextItem,
  Message,
  Tool,
  ToolCall,
} from "../../types";

export abstract class BaseAgent {
  protected id: string;
  protected type: AgentType;
  protected name: string;
  protected systemPrompt: string;
  protected messageLog: AgentMessage[];
  protected description: string;
  protected toolkit: AgentToolkit;

  constructor(
    type: AgentType,
    name: string,
    description: string,
    toolkit: AgentToolkit,
  ) {
    this.id = uuidv4();
    this.type = type;
    this.name = name;
    this.messageLog = [];
    this.systemPrompt = this.getDefaultSystemPrompt();
    this.description = description;
    this.toolkit = toolkit;
  }

  /**
   * Process a message received by this agent
   */
  abstract processMessage(message: AgentMessage): Promise<AgentMessage | null>;

  /**
   * Default system prompt for this agent type
   */
  protected abstract getDefaultSystemPrompt(): string;

  /**
   * Send a message to another agent
   */
  protected async sendMessage(
    to: AgentType | "all",
    content: string | Record<string, any>,
    type: "request" | "response" | "notification" = "request",
    replyTo?: string,
  ): Promise<AgentMessage> {
    const message: AgentMessage = {
      id: uuidv4(),
      from: this.type,
      to,
      type,
      content,
      replyTo,
      timestamp: Date.now(),
    };

    this.logMessage(message);

    // Will be implemented by the communication system
    // await this.communicationBus.sendMessage(message);

    return message;
  }

  /**
   * Process messages for the LLM
   */
  protected async processLLMMessages(
    messages: Message[],
    tools?: Tool[],
  ): Promise<Message[]> {
    // Base implementation just returns the messages unchanged
    // Specific agents can override to implement specialized processing
    return messages;
  }

  /**
   * Process a tool call
   */
  protected async processToolCall(
    toolCall: ToolCall,
    context: any,
  ): Promise<ContextItem[]> {
    // Base implementation returns empty results
    // Specific agents will override to handle relevant tools
    return [];
  }

  /**
   * Log a message to the agent's message log
   */
  protected logMessage(message: AgentMessage): void {
    this.messageLog.push(message);

    // Limit log size
    if (this.messageLog.length > 100) {
      this.messageLog.shift();
    }
  }

  /**
   * Get the message log for this agent
   */
  public getMessageLog(): AgentMessage[] {
    return [...this.messageLog];
  }

  /**
   * Get agent information
   */
  public getInfo(): { id: string; type: AgentType; name: string } {
    return {
      id: this.id,
      type: this.type,
      name: this.name,
    };
  }

  /**
   * Set the system prompt for this agent
   */
  public setSystemPrompt(prompt: string): void {
    this.systemPrompt = prompt;
  }

  /**
   * Get the current system prompt
   */
  public getSystemPrompt(): string {
    return this.systemPrompt;
  }

  /**
   * Get the agent's name
   */
  getName(): string {
    return this.name;
  }

  /**
   * Get the agent's description
   */
  getDescription(): string {
    return this.description;
  }

  /**
   * Handle a message sent to this agent
   * Each agent type must implement this method
   */
  abstract handleMessage(message: string): Promise<string>;

  /**
   * Execute a tool by name
   */
  async executeTool(toolName: string, args: any): Promise<any> {
    const tool = this.toolkit.getTool(toolName);
    if (!tool) {
      throw new Error(`Tool not found: ${toolName}`);
    }

    console.log(
      `Agent ${this.name} executing tool ${toolName} with args:`,
      args,
    );

    try {
      const result = await tool.execute(args);
      console.log(`Tool ${toolName} execution result:`, result);
      return result;
    } catch (error) {
      console.error(`Error executing tool ${toolName}:`, error);
      throw error;
    }
  }

  /**
   * Get all tools available to this agent
   */
  getAvailableTools(): AgentTool[] {
    return this.toolkit.getAllTools();
  }

  /**
   * Check if a tool is available to this agent
   */
  hasToolAvailable(toolName: string): boolean {
    return !!this.toolkit.getTool(toolName);
  }
}

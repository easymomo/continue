import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { BaseMessage } from "@langchain/core/messages";
import { Tool } from "@langchain/core/tools";
import { Command } from "@langchain/langgraph";

/**
 * Agent type enum
 */
export enum AgentType {
  COORDINATOR = "coordinator",
  DEVELOPER = "developer",
  RESEARCH = "research",
  SECURITY = "security",
  DOCUMENTATION = "documentation",
  TESTING = "testing",
  EVALUATION = "evaluation",
}

/**
 * Agent interface
 */
export interface Agent {
  /**
   * Unique identifier for the agent
   */
  id: string;

  /**
   * The type of agent
   */
  type: string;

  /**
   * The name of the agent
   */
  name: string;

  /**
   * The description of the agent
   */
  description: string;

  /**
   * Process a message and return a response
   */
  process(state: {
    messages: BaseMessage[];
  }): Promise<Command | { messages: BaseMessage[] }>;

  /**
   * Get the LLM model used by this agent
   */
  getModel(): BaseChatModel;

  /**
   * Get the tools available to this agent
   */
  getTools(): Tool[];
}

/**
 * Base class for all agents
 */
export abstract class BaseAgent implements Agent {
  id: string;
  type: string;
  name: string;
  description: string;
  protected model: BaseChatModel;
  protected tools: Tool[];

  constructor(
    id: string,
    type: string,
    name: string,
    description: string,
    model: BaseChatModel,
    tools: Tool[] = [],
  ) {
    this.id = id;
    this.type = type;
    this.name = name;
    this.description = description;
    this.model = model;
    this.tools = tools;
  }

  abstract process(state: {
    messages: BaseMessage[];
  }): Promise<Command | { messages: BaseMessage[] }>;

  getModel(): BaseChatModel {
    return this.model;
  }

  getTools(): Tool[] {
    return this.tools;
  }
}

import { Task } from "../../memory/types.js";
import { BaseAgent } from "../core/types.js";
import { AgentMemory } from "./memory-integration.js";

/**
 * TaskSystemAdapter interface
 *
 * Provides a bridge between agents and the task management system.
 * This allows agents to utilize task management capabilities without
 * modifying the BaseAgent class.
 */
export interface TaskSystemAdapter {
  /**
   * Get the agent ID associated with this adapter
   */
  getAgentId(): string;

  /**
   * Store a message in the agent's context
   * @param source Source of the message (user, agent, system)
   * @param content Content of the message
   * @param metadata Optional metadata for the message
   */
  storeMessage(
    source: string,
    content: string,
    metadata?: Record<string, any>,
  ): Promise<void>;

  /**
   * Store a decision made by the agent
   * @param title Title of the decision
   * @param description Description of the decision
   * @param metadata Optional metadata for the decision
   */
  storeDecision(
    title: string,
    description: string,
    metadata?: Record<string, any>,
  ): Promise<void>;

  /**
   * Store a document or finding in the agent's context
   * @param title Title of the document
   * @param content Content of the document
   * @param type Type of document (e.g., research, code, security)
   * @param metadata Optional metadata for the document
   */
  storeDocument(
    title: string,
    content: string,
    type: string,
    metadata?: Record<string, any>,
  ): Promise<void>;

  /**
   * Find or create a context for the agent
   * @param contextId ID for the context
   * @param description Description of the context
   * @returns The context ID
   */
  findOrCreateAgentContext(
    contextId: string,
    description: string,
  ): Promise<string>;

  /**
   * Get the current task for the agent
   * @returns The current task or null if no task is active
   */
  getCurrentTask(): Promise<Task | null>;

  /**
   * Get the agent memory manager
   * @returns The agent memory manager
   */
  getAgentMemory(): AgentMemory;
}

/**
 * TaskSystemAdapterImpl class
 *
 * Implementation of the TaskSystemAdapter interface using AgentMemory
 */
class TaskSystemAdapterImpl implements TaskSystemAdapter {
  private agentId: string;
  private agentMemory: AgentMemory;
  private activeContextId: string | null = null;

  /**
   * Create a new TaskSystemAdapterImpl
   * @param agent The agent to adapt
   * @param agentMemory The agent memory manager
   */
  constructor(agent: BaseAgent, agentMemory: AgentMemory) {
    this.agentId = agent.id;
    this.agentMemory = agentMemory;
  }

  /**
   * Get the agent ID
   */
  public getAgentId(): string {
    return this.agentId;
  }

  /**
   * Store a message in the agent's context
   */
  public async storeMessage(
    source: string,
    content: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    try {
      if (!this.activeContextId) {
        await this.findOrCreateAgentContext(
          `${this.agentId}_default`,
          "Default agent context",
        );
      }

      await this.agentMemory.storeMemory({
        type: "message",
        source,
        content,
        timestamp: Date.now(),
        contextId: this.activeContextId!,
        metadata,
      });
    } catch (error) {
      console.error(`Error storing message in TaskSystemAdapter: ${error}`);
    }
  }

  /**
   * Store a decision made by the agent
   */
  public async storeDecision(
    title: string,
    description: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    try {
      if (!this.activeContextId) {
        await this.findOrCreateAgentContext(
          `${this.agentId}_default`,
          "Default agent context",
        );
      }

      await this.agentMemory.storeMemory({
        type: "decision",
        title,
        description,
        timestamp: Date.now(),
        contextId: this.activeContextId!,
        metadata,
      });
    } catch (error) {
      console.error(`Error storing decision in TaskSystemAdapter: ${error}`);
    }
  }

  /**
   * Store a document or finding
   */
  public async storeDocument(
    title: string,
    content: string,
    type: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    try {
      if (!this.activeContextId) {
        await this.findOrCreateAgentContext(
          `${this.agentId}_default`,
          "Default agent context",
        );
      }

      await this.agentMemory.storeMemory({
        type: "document",
        title,
        content,
        documentType: type,
        timestamp: Date.now(),
        contextId: this.activeContextId!,
        metadata,
      });
    } catch (error) {
      console.error(`Error storing document in TaskSystemAdapter: ${error}`);
    }
  }

  /**
   * Find or create an agent context
   */
  public async findOrCreateAgentContext(
    contextId: string,
    description: string,
  ): Promise<string> {
    try {
      const fullContextId = `${this.agentId}_${contextId}`;

      // Check if context exists, create if not
      const existingContext = await this.agentMemory.getContext(fullContextId);

      if (!existingContext) {
        await this.agentMemory.createContext(fullContextId, description);
      }

      // Set as active context
      this.activeContextId = fullContextId;
      return fullContextId;
    } catch (error) {
      console.error(
        `Error finding/creating context in TaskSystemAdapter: ${error}`,
      );
      throw error;
    }
  }

  /**
   * Get the current task
   * Not implemented in base adapter - should be implemented by specialized adapters
   */
  public async getCurrentTask(): Promise<Task | null> {
    // This should be implemented by specialized adapters
    // Here we return null as a default implementation
    return null;
  }

  /**
   * Get the agent memory manager
   */
  public getAgentMemory(): AgentMemory {
    return this.agentMemory;
  }
}

/**
 * Create a TaskSystemAdapter for the given agent
 * @param agent The agent to create an adapter for
 * @returns A new TaskSystemAdapter
 */
export async function createTaskSystemAdapter(
  agent: BaseAgent,
): Promise<TaskSystemAdapter> {
  // Initialize agent memory
  const agentMemory = new AgentMemory(agent);
  await agentMemory.initialize();

  // Create and return adapter
  return new TaskSystemAdapterImpl(agent, agentMemory);
}

/**
 * Task-Based Memory System
 *
 * Provides a memory system for agents that leverages the task system for
 * persistent state and context management. This implementation extends the
 * core agent memory capabilities with transaction-based persistence and
 * hierarchical context management.
 */

import { v4 as uuidv4 } from "uuid";
import { SharedMemory } from "../../memory/shared.js";
import { BaseAgent } from "./base-agent.js";
import { AgentMemory } from "./memory-integration.js";
import { TaskSystemAdapter } from "./task-system-adapter.js";

/**
 * Memory types used by TaskMemory
 */
export enum TaskMemoryType {
  MESSAGE = "message",
  DOCUMENT = "document",
  CODE = "code",
  DECISION = "decision",
  RESULT = "result",
  ERROR = "error",
}

/**
 * Context types for TaskMemory
 */
export enum TaskContextType {
  CONVERSATION = "conversation",
  SESSION = "session",
  PROJECT = "project",
  TASK = "task",
  SUBTASK = "subtask",
}

/**
 * TaskMemory extends AgentMemory with task system capabilities
 */
export class TaskMemory extends AgentMemory {
  private taskSystemAdapter: TaskSystemAdapter;
  private sharedMemory: SharedMemory;
  private activeContexts: Set<string> = new Set();
  private taskId?: string;

  /**
   * Create a new TaskMemory instance
   *
   * @param agent The agent this memory belongs to
   * @param taskSystemAdapter The task system adapter
   */
  constructor(
    private agent: BaseAgent,
    taskSystemAdapter: TaskSystemAdapter,
  ) {
    // Initialize the base AgentMemory
    super(agent.id);

    this.taskSystemAdapter = taskSystemAdapter;
    this.sharedMemory = SharedMemory.getInstance();
  }

  /**
   * Initialize the task memory system
   */
  public async initialize(): Promise<void> {
    // Initialize the base memory system
    await super.initialize();

    // Register the agent with the task system
    this.taskId = await this.taskSystemAdapter.registerAgent(this.agent);

    // Create initial contexts
    await this.createDefaultContexts();
  }

  /**
   * Create default contexts for the agent
   */
  private async createDefaultContexts(): Promise<void> {
    // Create a conversation context
    const conversationContext = await this.createContext(
      `${this.agent.id}_conversation`,
      {
        type: TaskContextType.CONVERSATION,
        agentId: this.agent.id,
        agentType: this.agent.type,
        createTime: Date.now(),
      },
    );

    // Create a session context
    const sessionContext = await this.createContext(
      `${this.agent.id}_session`,
      {
        type: TaskContextType.SESSION,
        agentId: this.agent.id,
        agentType: this.agent.type,
        createTime: Date.now(),
      },
    );

    // Add these to active contexts
    this.activeContexts.add(`${this.agent.id}_conversation`);
    this.activeContexts.add(`${this.agent.id}_session`);
  }

  /**
   * Store a message in memory
   *
   * @param role The role (sender) of the message
   * @param content The message content
   * @param metadata Additional metadata
   * @returns ID of the stored memory
   */
  public async storeMessage(
    role: string,
    content: string,
    metadata: Record<string, any> = {},
  ): Promise<string> {
    // Store in local memory system
    const memoryId = await this.storeMemory(
      TaskMemoryType.MESSAGE,
      { role, content },
      { ...metadata, timestamp: Date.now() },
    );

    // Add to conversation context
    if (this.activeContexts.has(`${this.agent.id}_conversation`)) {
      await this.addToContext(
        `${this.agent.id}_conversation`,
        TaskMemoryType.MESSAGE,
        { role, content },
        "conversation",
        metadata,
      );
    }

    // Use the task system adapter to store in the task system
    if (this.taskId) {
      await this.taskSystemAdapter.storeAgentMemory(
        this.agent.id,
        TaskMemoryType.MESSAGE,
        { role, content },
        metadata,
      );
    }

    return memoryId;
  }

  /**
   * Store a document in memory
   *
   * @param title Document title
   * @param content Document content
   * @param source Document source
   * @param metadata Additional metadata
   * @returns ID of the stored memory
   */
  public async storeDocument(
    title: string,
    content: string,
    source: string,
    metadata: Record<string, any> = {},
  ): Promise<string> {
    // Store in local memory system
    const memoryId = await this.storeMemory(
      TaskMemoryType.DOCUMENT,
      { title, content },
      { ...metadata, source, timestamp: Date.now() },
    );

    // Add to session context
    if (this.activeContexts.has(`${this.agent.id}_session`)) {
      await this.addToContext(
        `${this.agent.id}_session`,
        TaskMemoryType.DOCUMENT,
        { title, content },
        source,
        metadata,
      );
    }

    // Use the task system adapter to store in the task system
    if (this.taskId) {
      await this.taskSystemAdapter.storeAgentMemory(
        this.agent.id,
        TaskMemoryType.DOCUMENT,
        { title, content },
        { ...metadata, source },
      );
    }

    return memoryId;
  }

  /**
   * Store code in memory
   *
   * @param filename The filename
   * @param code The code content
   * @param language The programming language
   * @param metadata Additional metadata
   * @returns ID of the stored memory
   */
  public async storeCode(
    filename: string,
    code: string,
    language: string,
    metadata: Record<string, any> = {},
  ): Promise<string> {
    // Store in local memory system
    const memoryId = await this.storeMemory(
      TaskMemoryType.CODE,
      { filename, code, language },
      { ...metadata, timestamp: Date.now() },
    );

    // Add to session context
    if (this.activeContexts.has(`${this.agent.id}_session`)) {
      await this.addToContext(
        `${this.agent.id}_session`,
        TaskMemoryType.CODE,
        { filename, code, language },
        "code_editor",
        metadata,
      );
    }

    // Use the task system adapter to store in the task system
    if (this.taskId) {
      await this.taskSystemAdapter.storeAgentMemory(
        this.agent.id,
        TaskMemoryType.CODE,
        { filename, code, language },
        metadata,
      );
    }

    return memoryId;
  }

  /**
   * Store a decision in memory
   *
   * @param decision The decision
   * @param reasoning The reasoning behind the decision
   * @param metadata Additional metadata
   * @returns ID of the stored memory
   */
  public async storeDecision(
    decision: string,
    reasoning: string,
    metadata: Record<string, any> = {},
  ): Promise<string> {
    // Store in local memory system
    const memoryId = await this.storeMemory(
      TaskMemoryType.DECISION,
      { decision, reasoning },
      { ...metadata, timestamp: Date.now() },
    );

    // Add to session context
    if (this.activeContexts.has(`${this.agent.id}_session`)) {
      await this.addToContext(
        `${this.agent.id}_session`,
        TaskMemoryType.DECISION,
        { decision, reasoning },
        "agent_decision",
        metadata,
      );
    }

    // Use the task system adapter to store in the task system
    if (this.taskId) {
      await this.taskSystemAdapter.storeAgentMemory(
        this.agent.id,
        TaskMemoryType.DECISION,
        { decision, reasoning },
        metadata,
      );
    }

    // Also share important decisions through shared memory
    this.sharedMemory.set(
      `decision_${uuidv4()}`,
      { decision, reasoning, agent: this.agent.id },
      this.agent.type,
      { timestamp: Date.now(), ...metadata },
    );

    return memoryId;
  }

  /**
   * Create a relationship with another agent
   *
   * @param otherAgentId ID of the other agent
   * @param relationship Type of relationship
   * @returns Success status
   */
  public async createAgentRelationship(
    otherAgentId: string,
    relationship: string,
  ): Promise<boolean> {
    if (relationship === "parent") {
      return this.taskSystemAdapter.createAgentRelationship(
        this.agent.id,
        otherAgentId,
      );
    } else if (relationship === "child") {
      return this.taskSystemAdapter.createAgentRelationship(
        otherAgentId,
        this.agent.id,
      );
    } else {
      // For other types of relationships, store in shared memory
      this.sharedMemory.set(
        `relationship_${this.agent.id}_${otherAgentId}`,
        { type: relationship },
        this.agent.type,
        { timestamp: Date.now() },
      );
      return true;
    }
  }

  /**
   * Complete the agent's task when work is finished
   */
  public async completeTask(): Promise<boolean> {
    if (this.taskId) {
      // First transfer all working memory to the task system
      await this.consolidateMemories(
        TaskMemoryType.RESULT,
        TaskMemoryType.RESULT,
      );

      // Then complete the task
      return this.taskSystemAdapter.completeAgentTask(this.agent.id);
    }
    return false;
  }

  /**
   * Get the agent's active task
   */
  public async getActiveTask(): Promise<any> {
    return this.taskSystemAdapter.getAgentActiveTask(this.agent.id);
  }

  /**
   * Visualize the agent's task dependencies
   */
  public async visualizeDependencies(): Promise<any> {
    return this.taskSystemAdapter.visualizeAgentDependencies(this.agent.id);
  }
}

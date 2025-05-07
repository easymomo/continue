/**
 * Base Agent Implementation
 *
 * This serves as the foundation for all specialized agents.
 * It provides common functionality for handling tasks, messaging, and memory.
 */

import { EventEmitter } from "events";
import { v4 as uuidv4 } from "uuid";
import { AgentMemory } from "./memory-integration.js";
import { messageBus } from "./message-bus.js";
import { taskManager } from "./task-manager.js";
import { TaskMemory } from "./task-memory.js";
import { createTaskMemory } from "./task-system-init.js";
import {
  Agent,
  AgentCapabilities,
  AgentStatus,
  Message,
  MessageType,
  Task,
  TaskStatus,
} from "./types.js";

/**
 * Configuration for BaseAgent
 */
export interface BaseAgentConfig {
  id?: string;
  name: string;
  description: string;
  version: string;
  capabilities: AgentCapabilities;
  supportedTaskTypes: string[];
  type: string; // Added type field for agent type identification
  useTaskMemory?: boolean; // Whether to use the task memory system
}

/**
 * Base Agent class that provides common functionality for all agents
 */
export abstract class BaseAgent extends EventEmitter implements Agent {
  public readonly id: string;
  public readonly name: string;
  public readonly description: string;
  public readonly version: string;
  public readonly capabilities: AgentCapabilities;
  public readonly supportedTaskTypes: string[];
  public readonly type: string; // Added type field for agent type

  private initialized: boolean = false;
  private active: boolean = false;
  private memory: AgentMemory | TaskMemory;
  private useTaskMemory: boolean;

  constructor(config: BaseAgentConfig) {
    super();

    this.id = config.id || uuidv4();
    this.name = config.name;
    this.description = config.description;
    this.version = config.version;
    this.capabilities = config.capabilities;
    this.supportedTaskTypes = config.supportedTaskTypes;
    this.type = config.type;
    this.useTaskMemory = config.useTaskMemory || false;

    // Initialize with standard memory (will be updated in initialize() if useTaskMemory is true)
    this.memory = new AgentMemory(this.id);

    // Set maximum number of listeners to avoid memory leak warnings
    this.setMaxListeners(50);
  }

  /**
   * Initialize the agent
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    console.log(`Initializing agent: ${this.name} (${this.id})`);

    // Initialize memory system
    if (this.useTaskMemory) {
      try {
        // Use task-based memory system
        this.memory = await createTaskMemory(this);
        console.log(`Initialized task-based memory for agent: ${this.name}`);
      } catch (error: any) {
        console.warn(
          `Failed to initialize task memory, falling back to standard memory: ${error.message}`,
        );
        this.memory = new AgentMemory(this.id);
        await this.memory.initialize();
      }
    } else {
      // Use standard memory system
      await this.memory.initialize();
    }

    // Initialize agent-specific resources
    await this.onInitialize();

    this.initialized = true;
    console.log(`Agent initialized: ${this.name}`);
  }

  /**
   * Activate the agent to start processing tasks
   */
  public async activate(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (this.active) {
      return;
    }

    console.log(`Activating agent: ${this.name}`);

    // Register for task assignments
    taskManager.on("task:assigned", (data: any) => {
      if (data.agentId === this.id) {
        this.handleTaskAssignment(data.taskId);
      }
    });

    this.active = true;

    // Agent-specific activation
    await this.onActivate();

    console.log(`Agent activated: ${this.name}`);
    this.emit("activated");
  }

  /**
   * Deactivate the agent to stop processing tasks
   */
  public async deactivate(): Promise<void> {
    if (!this.active) {
      return;
    }

    console.log(`Deactivating agent: ${this.name}`);

    // Unregister from task assignments
    taskManager.removeAllListeners("task:assigned");

    this.active = false;

    // Agent-specific deactivation
    await this.onDeactivate();

    console.log(`Agent deactivated: ${this.name}`);
    this.emit("deactivated");
  }

  /**
   * Shutdown the agent
   */
  public async shutdown(): Promise<void> {
    if (this.active) {
      await this.deactivate();
    }

    console.log(`Shutting down agent: ${this.name}`);

    // Clean up resources
    await this.onShutdown();

    // Remove all listeners
    this.removeAllListeners();

    console.log(`Agent shut down: ${this.name}`);
  }

  /**
   * Get agent's public information
   */
  public getInfo(): {
    id: string;
    name: string;
    description: string;
    version: string;
    capabilities: AgentCapabilities;
    supportedTaskTypes: string[];
  } {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      version: this.version,
      capabilities: { ...this.capabilities },
      supportedTaskTypes: [...this.supportedTaskTypes],
    };
  }

  /**
   * Get agent's status
   */
  public getStatus(): AgentStatus {
    return {
      id: this.id,
      name: this.name,
      status: this.active ? "idle" : "offline", // Default to idle if active
      currentTasks: [],
      lastActive: new Date().toISOString(),
    };
  }

  /**
   * Handle a task
   */
  public async handleTask(task: Task): Promise<Task> {
    return this.onHandleTask(task);
  }

  /**
   * Process a message from another agent
   *
   * @param message Message to process
   * @returns Optional response message
   */
  public async handleMessage(message: Message): Promise<void> {
    // Log incoming message
    console.log(`Agent ${this.name} received message: ${message.subject}`);

    try {
      // Handle the message with agent-specific implementation
      await this.onHandleMessage(message);
    } catch (error) {
      console.error(`Error handling message ${message.id}:`, error);
      throw error;
    }
  }

  /**
   * Handle a task assigned to this agent
   *
   * @param taskId ID of assigned task
   */
  private async handleTaskAssignment(taskId: string): Promise<void> {
    console.log(`Agent ${this.name} handling task: ${taskId}`);

    // Get the task
    const task = taskManager.getTask(taskId);

    if (!task) {
      console.error(`Task ${taskId} not found`);
      return;
    }

    try {
      // Update task status
      task.status = TaskStatus.IN_PROGRESS;
      await taskManager.updateTask(task);

      // Handle the task with the agent's implementation
      const updatedTask = await this.onHandleTask(task);

      // Update the task
      await taskManager.updateTask(updatedTask);

      console.log(
        `Agent ${this.name} completed task: ${taskId} with status: ${updatedTask.status}`,
      );
    } catch (error) {
      console.error(`Error handling task ${taskId}:`, error);

      // Update task as failed
      task.status = TaskStatus.FAILED;
      task.error = error instanceof Error ? error.message : String(error);
      await taskManager.updateTask(task);
    }
  }

  /**
   * Cancel a task that this agent is handling
   *
   * @param taskId ID of task to cancel
   */
  public async cancelTask(taskId: string): Promise<boolean> {
    console.log(`Agent ${this.name} canceling task: ${taskId}`);

    // Get the task
    const task = taskManager.getTask(taskId);

    if (!task || task.assignedTo !== this.id) {
      console.error(`Task ${taskId} not found or not assigned to this agent`);
      return false;
    }

    // Let the agent implementation handle task cancellation
    const canceled = await this.onCancelTask(task);

    if (canceled) {
      // Update task status
      task.status = TaskStatus.CANCELLED;
      await taskManager.updateTask(task);

      console.log(`Agent ${this.name} cancelled task: ${taskId}`);
    }

    return canceled;
  }

  /**
   * Send a message to another agent
   *
   * @param recipient Recipient agent ID
   * @param subject Message subject
   * @param content Message content
   * @param type Message type
   * @returns ID of the sent message
   */
  protected async sendMessage(
    from: string,
    to: string,
    subject: string,
    content: any,
    type: MessageType = MessageType.REQUEST,
  ): Promise<string> {
    return messageBus.sendMessage(from, to, subject, content, type);
  }

  /**
   * Broadcast a message to all agents
   *
   * @param subject Message subject
   * @param content Message content
   * @param type Message type
   * @returns ID of the sent message
   */
  protected async broadcastMessage(
    from: string,
    subject: string,
    content: any,
    type: MessageType = MessageType.EVENT,
  ): Promise<string> {
    return messageBus.broadcastMessage(from, subject, content, type);
  }

  /**
   * Get the agent's memory system
   * Returns either standard AgentMemory or TaskMemory based on configuration
   */
  protected getMemory(): AgentMemory | TaskMemory {
    return this.memory;
  }

  /**
   * Check if the agent is using task-based memory
   */
  protected isUsingTaskMemory(): boolean {
    return this.useTaskMemory && this.memory instanceof TaskMemory;
  }

  /**
   * Get the agent's task-based memory system if available
   * @throws Error if task-based memory is not enabled
   */
  protected getTaskMemory(): TaskMemory {
    if (!this.isUsingTaskMemory()) {
      throw new Error("Task-based memory is not enabled for this agent");
    }
    return this.memory as TaskMemory;
  }

  /**
   * Store a message in memory
   *
   * @param role The role (sender) of the message
   * @param content The message content
   * @param metadata Additional metadata
   * @returns ID of the stored memory
   */
  protected async storeMessage(
    role: string,
    content: string,
    metadata: Record<string, any> = {},
  ): Promise<string> {
    if (this.isUsingTaskMemory()) {
      return (this.memory as TaskMemory).storeMessage(role, content, metadata);
    } else {
      // Standard memory storage fallback
      return this.memory.storeMemory(
        "message",
        { role, content },
        { ...metadata, timestamp: Date.now() },
      );
    }
  }

  /**
   * Store document content in memory
   */
  protected async storeDocument(
    title: string,
    content: string,
    source: string,
    metadata: Record<string, any> = {},
  ): Promise<string> {
    if (this.isUsingTaskMemory()) {
      return (this.memory as TaskMemory).storeDocument(
        title,
        content,
        source,
        metadata,
      );
    } else {
      // Standard memory storage fallback
      return this.memory.storeMemory(
        "document",
        { title, content },
        { ...metadata, source, timestamp: Date.now() },
      );
    }
  }

  /**
   * Store code in memory
   */
  protected async storeCode(
    filename: string,
    code: string,
    language: string,
    metadata: Record<string, any> = {},
  ): Promise<string> {
    if (this.isUsingTaskMemory()) {
      return (this.memory as TaskMemory).storeCode(
        filename,
        code,
        language,
        metadata,
      );
    } else {
      // Standard memory storage fallback
      return this.memory.storeMemory(
        "code",
        { filename, code, language },
        { ...metadata, timestamp: Date.now() },
      );
    }
  }

  /**
   * Store a decision in memory
   */
  protected async storeDecision(
    decision: string,
    reasoning: string,
    metadata: Record<string, any> = {},
  ): Promise<string> {
    if (this.isUsingTaskMemory()) {
      return (this.memory as TaskMemory).storeDecision(
        decision,
        reasoning,
        metadata,
      );
    } else {
      // Standard memory storage fallback
      return this.memory.storeMemory(
        "decision",
        { decision, reasoning },
        { ...metadata, timestamp: Date.now() },
      );
    }
  }

  /**
   * Create a relationship with another agent
   */
  protected async createAgentRelationship(
    otherAgentId: string,
    relationship: string,
  ): Promise<boolean> {
    if (this.isUsingTaskMemory()) {
      return (this.memory as TaskMemory).createAgentRelationship(
        otherAgentId,
        relationship,
      );
    } else {
      // Standard memory doesn't support relationships directly
      await this.memory.storeMemory(
        "relationship",
        { otherAgentId, relationship },
        { timestamp: Date.now() },
      );
      return true;
    }
  }

  /**
   * Store memory using the standard memory system (for backward compatibility)
   * Consider using the specialized storeMessage, storeDocument, etc. methods instead
   */
  protected async storeMemory(
    type: string,
    content: any,
    metadata: Record<string, any> = {},
  ): Promise<string> {
    // Simply delegate to the memory system
    return this.memory.storeMemory(type, content, metadata);
  }

  /**
   * Initialize the agent (to be implemented by subclasses)
   */
  protected async onInitialize(): Promise<void> {
    // Default implementation does nothing
  }

  /**
   * Activate the agent (to be implemented by subclasses)
   */
  protected async onActivate(): Promise<void> {
    // Default implementation does nothing
  }

  /**
   * Deactivate the agent (to be implemented by subclasses)
   */
  protected async onDeactivate(): Promise<void> {
    // Default implementation does nothing
  }

  /**
   * Shutdown the agent (to be implemented by subclasses)
   */
  protected async onShutdown(): Promise<void> {
    // Default implementation does nothing
  }

  /**
   * Handle a task assigned to the agent (must be implemented by subclasses)
   *
   * @param task Task to handle
   * @returns The updated task
   */
  protected abstract onHandleTask(task: Task): Promise<Task>;

  /**
   * Handle a message sent to the agent (must be implemented by subclasses)
   *
   * @param message Message to handle
   */
  protected abstract onHandleMessage(message: Message): Promise<void>;

  /**
   * Cancel a task that this agent is handling (to be implemented by subclasses)
   *
   * @param task Task to cancel
   * @returns True if task was successfully canceled, false otherwise
   */
  protected async onCancelTask(task: Task): Promise<boolean> {
    // Default implementation just cancels the task
    return true;
  }
}

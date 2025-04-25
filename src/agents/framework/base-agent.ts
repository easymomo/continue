/**
 * Base Agent Implementation
 *
 * This serves as the foundation for all specialized agents.
 * It provides common functionality for handling tasks, messaging, and memory.
 */

import { EventEmitter } from "events";
import { v4 as uuidv4 } from "uuid";
import { Memory, memorySystem } from "./memory-system.js";
import { messageBus } from "./message-bus.js";
import { taskManager } from "./task-manager.js";
import {
  Agent,
  AgentCapabilities,
  AgentStatus,
  Message,
  MessageType,
  Task,
  TaskPriority,
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

  private initialized: boolean = false;
  private active: boolean = false;

  constructor(config: BaseAgentConfig) {
    super();

    this.id = config.id || uuidv4();
    this.name = config.name;
    this.description = config.description;
    this.version = config.version;
    this.capabilities = config.capabilities;
    this.supportedTaskTypes = config.supportedTaskTypes;

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
   * Store a memory item
   *
   * @param type Type of memory
   * @param content Content to store
   * @param metadata Additional metadata
   * @returns ID of the memory item
   */
  protected async storeMemory(
    type: string,
    content: any,
    metadata: Record<string, any> = {},
  ): Promise<string> {
    return memorySystem.storeMemory({
      id: uuidv4(),
      agentId: this.id,
      type,
      content,
      metadata,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get a memory item by ID
   *
   * @param memoryId ID of memory to retrieve
   * @returns Memory item or undefined if not found
   */
  protected async getMemoryItem(memoryId: string): Promise<any> {
    const memory = await memorySystem.getMemory(memoryId);
    return memory?.content;
  }

  /**
   * Query memory items based on criteria
   *
   * @param criteria Search criteria
   * @returns Array of matching memory items
   */
  protected async queryMemories(criteria: {
    type?: string;
    metadata?: Record<string, any>;
  }): Promise<Memory[]> {
    return memorySystem.queryMemories({
      agentId: this.id,
      ...criteria,
    });
  }

  /**
   * Create a new task
   *
   * @param taskType Type of task to create
   * @param description Description of the task
   * @param data Task data
   * @param priority Task priority
   * @returns Created task
   */
  protected async createTask(
    taskType: string,
    description: string,
    data: any,
    priority: TaskPriority = TaskPriority.MEDIUM,
  ): Promise<Task> {
    const task = await taskManager.createTask({
      type: taskType,
      description,
      data,
      priority,
      status: TaskStatus.PENDING,
    });

    return task;
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

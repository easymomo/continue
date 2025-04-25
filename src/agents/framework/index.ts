/**
 * AIgents Framework
 *
 * Main entry point for the agent framework. This file exports all the components
 * and provides a convenience function to initialize the framework.
 */

import { EventEmitter } from "events";
import { AgentRegistry } from "./agent-registry.js";
import { memorySystem, MemorySystem } from "./memory-system.js";
import { TaskManager } from "./task-manager.js";
import * as Types from "./types.js";

// Export all components
export { AgentRegistry } from "./agent-registry.js";
export { BaseAgent } from "./base-agent.js";
export { memorySystem, MemorySystem } from "./memory-system.js";
export { TaskManager } from "./task-manager.js";
export * from "./types.js";

/**
 * Framework class that brings together all the components
 */
export class Framework extends EventEmitter {
  // Core components
  public readonly agentRegistry: AgentRegistry;
  public readonly taskManager: TaskManager;
  public readonly memorySystem: MemorySystem;

  // Framework state
  private initialized: boolean = false;

  /**
   * Create a new framework instance
   */
  constructor() {
    super();

    // Create the core components
    this.agentRegistry = new AgentRegistry();
    this.taskManager = new TaskManager();
    this.memorySystem = memorySystem;

    // Set a maximum number of listeners to avoid memory leaks
    this.setMaxListeners(100);

    // Forward events from components to the framework
    this.forwardEvents();
  }

  /**
   * Initialize the framework
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Initialize core components
    await this.memorySystem.initialize();
    await this.taskManager.initialize();

    this.initialized = true;
    this.emit("initialized");
  }

  /**
   * Shutdown the framework
   */
  public async shutdown(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    // Get all registered agents
    const agents = this.agentRegistry.getAllAgents();

    // Shutdown all agents
    for (const agent of agents) {
      try {
        await agent.instance.shutdown();
      } catch (error) {
        console.error(`Error shutting down agent ${agent.id}:`, error);
      }
    }

    this.initialized = false;
    this.emit("shutdown");
  }

  /**
   * Create a new task
   *
   * @param taskConfig Task configuration
   * @returns The created task
   */
  public async createTask(
    taskConfig: Partial<Types.Task>,
  ): Promise<Types.Task> {
    if (!this.initialized) {
      throw new Error("Framework not initialized");
    }

    return await this.taskManager.createTask(taskConfig);
  }

  /**
   * Register an agent with the framework
   *
   * @param agent Agent instance to register
   */
  public async registerAgent(agent: Types.Agent): Promise<void> {
    if (!this.initialized) {
      throw new Error("Framework not initialized");
    }

    // Register the agent
    this.agentRegistry.registerAgent({
      id: agent.id,
      name: agent.name,
      description: agent.description,
      version: agent.version,
      capabilities: agent.capabilities,
      supportedTaskTypes: agent.supportedTaskTypes,
      status: agent.getStatus(),
      instance: agent,
    });

    // Initialize the agent if the framework is initialized
    await agent.initialize();
  }

  /**
   * Find agents that can handle a specific task type
   *
   * @param taskType Task type
   * @returns Array of agent registrations
   */
  public findAgentsForTaskType(taskType: string): Types.AgentRegistration[] {
    return this.agentRegistry.findAgentsForTaskType(taskType);
  }

  /**
   * Find agents with a specific capability
   *
   * @param capability Capability name
   * @returns Array of agent registrations
   */
  public findAgentsByCapability(capability: string): Types.AgentRegistration[] {
    return this.agentRegistry.findAgentsByCapability(capability);
  }

  /**
   * Forward events from components to the framework
   */
  private forwardEvents(): void {
    // Forward agent registry events
    this.agentRegistry.on("agent:registered", (data) => {
      this.emit("agent:registered", data);
    });

    this.agentRegistry.on("agent:deregistered", (data) => {
      this.emit("agent:deregistered", data);
    });

    // Forward task manager events
    this.taskManager.on("task:created", (data) => {
      this.emit("task:created", data);
    });

    this.taskManager.on("task:updated", (data) => {
      this.emit("task:updated", data);
    });

    this.taskManager.on("task:assigned", (data) => {
      this.emit("task:assigned", data);
    });

    this.taskManager.on("task:completed", (data) => {
      this.emit("task:completed", data);
    });

    this.taskManager.on("task:failed", (data) => {
      this.emit("task:failed", data);
    });

    // Forward memory system events
    this.memorySystem.on("memory:stored", (data) => {
      this.emit("memory:stored", data);
    });

    this.memorySystem.on("memory:updated", (data) => {
      this.emit("memory:updated", data);
    });

    this.memorySystem.on("memory:deleted", (data) => {
      this.emit("memory:deleted", data);
    });
  }
}

// Create and export a singleton instance
export const framework = new Framework();

/**
 * Task System Initialization
 *
 * Provides initialization for the task system and creates TaskMemory instances
 * for agents. This serves as the main entry point for integrating agents with
 * the task system.
 */

import { getTaskSystemConfig } from "../../config/task-system-config.js";
import { BaseAgent } from "./base-agent.js";
import { TaskMemory } from "./task-memory.js";
import {
  TaskSystemAdapter,
  TaskSystemAdapterConfig,
} from "./task-system-adapter.js";

// Environment setting - can be set via environment variable
const ENV =
  process.env.NODE_ENV === "production" ? "production" : "development";

// Default adapter configuration
const DEFAULT_ADAPTER_CONFIG: TaskSystemAdapterConfig = {
  taskSystemConfig: getTaskSystemConfig(ENV),
  autoCreateTasks: true,
  trackAgentRelationships: true,
};

// Flag to track initialization
let initialized = false;

/**
 * Initialize the task system adapter with configuration
 * This only needs to be called once at application startup
 */
export async function initializeTaskSystem(
  config: Partial<TaskSystemAdapterConfig> = {},
): Promise<TaskSystemAdapter> {
  if (initialized) {
    return TaskSystemAdapter.getInstance();
  }

  const fullConfig: TaskSystemAdapterConfig = {
    ...DEFAULT_ADAPTER_CONFIG,
    ...config,
    taskSystemConfig: {
      ...DEFAULT_ADAPTER_CONFIG.taskSystemConfig,
      ...config.taskSystemConfig,
    },
  };

  const adapter = TaskSystemAdapter.getInstance(fullConfig);
  await adapter.initialize();

  initialized = true;

  console.log("Task system initialized successfully");
  return adapter;
}

/**
 * Create a TaskMemory instance for an agent
 * This provides the agent with task-based memory capabilities
 */
export async function createTaskMemory(agent: BaseAgent): Promise<TaskMemory> {
  if (!initialized) {
    await initializeTaskSystem();
  }

  const adapter = TaskSystemAdapter.getInstance();
  const taskMemory = new TaskMemory(agent, adapter);
  await taskMemory.initialize();

  return taskMemory;
}

/**
 * Get the task system adapter instance
 * Throws an error if the adapter has not been initialized
 */
export function getTaskSystemAdapter(): TaskSystemAdapter {
  if (!initialized) {
    throw new Error(
      "Task system has not been initialized. Call initializeTaskSystem() first.",
    );
  }

  return TaskSystemAdapter.getInstance();
}

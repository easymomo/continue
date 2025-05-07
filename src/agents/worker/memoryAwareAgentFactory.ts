/**
 * Memory-Aware Agent Factory
 *
 * Provides a factory function for creating MemoryAwareAgent instances
 * with proper initialization of the task system.
 */

import { v4 as uuidv4 } from "uuid";
import { getTaskSystemConfig } from "../../config/task-system-config.js";
import { initializeTaskSystem } from "../framework/task-system-init.js";
import {
  MemoryAwareAgent,
  MemoryAwareAgentConfig,
} from "./memoryAwareAgent.js";

/**
 * Default agent configuration
 */
const DEFAULT_CONFIG: Partial<MemoryAwareAgentConfig> = {
  name: "Memory-Aware Agent",
  description:
    "An agent that demonstrates the use of the task-based memory system",
  version: "1.0.0",
  capabilities: {
    messageProcessing: true,
    taskHandling: true,
    memoryManagement: true,
    relationshipTracking: true,
  },
  supportedTaskTypes: ["memory_test", "context_test", "relationship_test"],
  type: "memory_aware",
  useTaskMemory: true,
  maxMemoryItems: 100,
  persistenceLevel: "medium",
};

/**
 * Create a new memory-aware agent with the task system initialized
 *
 * @param config Optional configuration to override defaults
 * @returns Initialized MemoryAwareAgent instance
 */
export async function createMemoryAwareAgent(
  config: Partial<MemoryAwareAgentConfig> = {},
): Promise<MemoryAwareAgent> {
  // Initialize the task system if not already initialized
  try {
    await initializeTaskSystem({
      taskSystemConfig: getTaskSystemConfig(
        process.env.NODE_ENV === "production" ? "production" : "development",
      ),
    });
  } catch (error: any) {
    console.warn(`Warning: Failed to initialize task system: ${error.message}`);
    console.warn(
      "The agent will use standard memory instead of task-based memory",
    );
    // Continue with agent creation even if task system init fails
  }

  // Create agent configuration
  const fullConfig: MemoryAwareAgentConfig = {
    id: uuidv4(),
    ...DEFAULT_CONFIG,
    ...config,
    // Ensure type is set
    type: config.type || DEFAULT_CONFIG.type || "memory_aware",
  } as MemoryAwareAgentConfig;

  // Create and initialize the agent
  const agent = new MemoryAwareAgent(fullConfig);
  await agent.initialize();

  return agent;
}

/**
 * Create multiple memory-aware agents with parent-child relationships
 *
 * @param count Number of agents to create
 * @returns Array of initialized MemoryAwareAgent instances
 */
export async function createMemoryAwareAgentTeam(
  count: number = 3,
): Promise<MemoryAwareAgent[]> {
  // Initialize the task system
  await initializeTaskSystem({
    taskSystemConfig: getTaskSystemConfig(
      process.env.NODE_ENV === "production" ? "production" : "development",
    ),
    // Ensure we track agent relationships
    trackAgentRelationships: true,
  });

  const agents: MemoryAwareAgent[] = [];

  // Create the parent agent
  const parentAgent = await createMemoryAwareAgent({
    name: "Memory Team Leader",
    description: "Leader agent that coordinates memory operations",
  });
  agents.push(parentAgent);

  // Create child agents
  for (let i = 1; i < count; i++) {
    const childAgent = await createMemoryAwareAgent({
      name: `Memory Worker ${i}`,
      description: `Worker agent that performs memory operations under team leader`,
    });
    agents.push(childAgent);

    // Create parent-child relationship
    if (childAgent.isUsingTaskMemory && parentAgent.isUsingTaskMemory) {
      try {
        await childAgent.createAgentRelationship(parentAgent.id, "child");
        console.log(
          `Created parent-child relationship between ${parentAgent.id} and ${childAgent.id}`,
        );
      } catch (error: any) {
        console.warn(`Failed to create agent relationship: ${error.message}`);
      }
    }
  }

  return agents;
}

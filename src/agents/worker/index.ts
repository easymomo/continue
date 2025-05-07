/**
 * Worker Agents Module
 *
 * This file exports all worker agent types and initialization functions.
 * It provides a simple interface for creating and configuring specialized agents.
 */

// Export agent types
export * from "./developerAgent.js";
export * from "./researchAgent.js";
export * from "./securityAgent.js";

// Export agent factories
export { createDeveloperAgent } from "./developer/index.js";
export { createResearchAgent } from "./research/index.js";
export { createSecurityAgent } from "./security/index.js";

/**
 * Worker Agent Factory
 *
 * Provides a unified interface for creating different types of worker agents
 */
export enum WorkerAgentType {
  DEVELOPER = "developer",
  RESEARCH = "research",
  SECURITY = "security",
}

/**
 * Create a worker agent of the specified type
 *
 * @param type The type of agent to create
 * @param model The language model to use
 * @param options Additional options for agent creation
 * @returns The created worker agent
 */
export function createWorkerAgent(
  type: WorkerAgentType,
  model: any,
  options: any = {},
) {
  switch (type) {
    case WorkerAgentType.DEVELOPER:
      const { createDeveloperAgent } = require("./developer/index.js");
      return createDeveloperAgent(
        model,
        options.protocol,
        options.name,
        options.description,
      );

    case WorkerAgentType.RESEARCH:
      const { createResearchAgent } = require("./research/index.js");
      return createResearchAgent(model, options.name, options.description);

    case WorkerAgentType.SECURITY:
      const { createSecurityAgent } = require("./security/index.js");
      return createSecurityAgent(model, options.name, options.description);

    default:
      throw new Error(`Unknown worker agent type: ${type}`);
  }
}

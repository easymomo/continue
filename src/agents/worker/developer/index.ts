/**
 * Developer Agent Module
 *
 * Initializes and configures the developer agent with appropriate tools.
 */

import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { v4 as uuidv4 } from "uuid";
import { AgentCommunicationProtocol } from "../../communication/index.js";
import { DeveloperAgent } from "../developerAgent.js";

/**
 * Create and initialize the developer agent with appropriate tools
 *
 * @param model The language model to use
 * @param protocol Optional communication protocol
 * @param name Optional custom name
 * @param description Optional custom description
 * @returns Initialized developer agent
 */
export function createDeveloperAgent(
  model: BaseChatModel,
  protocol?: AgentCommunicationProtocol,
  name: string = "Development Specialist",
  description: string = "Specialized agent for coding, implementation, and technical development.",
): DeveloperAgent {
  try {
    // Initialize tools for the developer agent
    const { initializeToolSystem } = require("../../../tools/index.js");
    const factory = initializeToolSystem();

    // Get developer tools from the factory
    const tools = factory.getToolsForAgent("developer");

    // Create a unique ID for the agent
    const agentId = `developer-${uuidv4().substring(0, 8)}`;

    // Create and return the developer agent
    return new DeveloperAgent(
      agentId,
      name,
      description,
      model,
      tools,
      protocol,
    );
  } catch (error) {
    console.error("Error initializing developer agent with tools:", error);

    // Create agent without tools as fallback
    const agentId = `developer-${uuidv4().substring(0, 8)}`;
    return new DeveloperAgent(agentId, name, description, model, [], protocol);
  }
}

/**
 * Developer agent module exports
 */

// Export workflow stages and artifacts
export {
  DeveloperArtifact,
  DeveloperArtifactType,
  DeveloperWorkflowStage,
} from "./developerWorkflowStages.js";

// Export task manager
export { DeveloperTaskManager } from "./developerTaskManager.js";

// Export helper functions
export {
  determineNextDevelopmentStage,
  extractFeatureRequest,
  getCoordinationReason,
  isNewDevelopmentRequest,
  shouldReturnToCoordinator,
} from "./developerHelpers.js";

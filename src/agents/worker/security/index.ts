/**
 * Security Agent Module
 *
 * Initializes and configures the security agent with appropriate tools.
 */

import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { v4 as uuidv4 } from "uuid";
import { AgentCommunicationProtocol } from "../../communication/index.js";
import { SecurityAgent, SecurityAgentConfig } from "../securityAgent.js";

/**
 * Create and initialize the security agent with appropriate tools
 *
 * @param model The language model to use
 * @param protocol Optional communication protocol
 * @param name Optional custom name
 * @param description Optional custom description
 * @param useTaskMemory Whether to use task memory system
 * @returns Initialized security agent
 */
export function createSecurityAgent(
  model: BaseChatModel,
  protocol?: AgentCommunicationProtocol,
  name: string = "Security Specialist",
  description: string = "Specialized agent for security analysis, vulnerability assessment, and secure coding practices.",
  useTaskMemory: boolean = true,
): SecurityAgent {
  try {
    // Initialize tools for the security agent
    const { initializeToolSystem } = require("../../../tools/index.js");
    const factory = initializeToolSystem();

    // Get security tools from the factory
    const tools = factory.getToolsForAgent("security");

    // Create a unique ID for the agent
    const agentId = `security-${uuidv4().substring(0, 8)}`;

    // Create agent configuration
    const config: SecurityAgentConfig = {
      id: agentId,
      name,
      description,
      model,
      tools,
      useTaskMemory,
    };

    // Create and return the security agent
    return new SecurityAgent(config);
  } catch (error) {
    console.error("Error initializing security agent with tools:", error);

    // Create agent without tools as fallback
    const agentId = `security-${uuidv4().substring(0, 8)}`;

    // Create agent configuration
    const config: SecurityAgentConfig = {
      id: agentId,
      name,
      description,
      model,
      tools: [],
      useTaskMemory,
    };

    return new SecurityAgent(config);
  }
}

/**
 * Security agent module exports
 */

// Export workflow stages and artifacts
export {
  SECURITY_STAGE_PROMPTS,
  SecurityArtifactType,
  SecurityTaskMetadata,
  SecurityWorkflowStage,
} from "./securityWorkflowStages.js";

// Export task manager
export {
  SecurityArtifact,
  SecurityTaskManager,
} from "./securityTaskManager.js";

// Export helper functions
export {
  detectSecuritySeverity,
  determineNextSecurityStage,
  extractAffectedFiles,
  extractCVEIds,
  extractCVSSScore,
  extractSecurityRequest,
  extractSecurityRequirements,
  isNewSecurityRequest,
} from "./securityHelpers.js";

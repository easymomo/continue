/**
 * Research Agent Module
 *
 * Initializes and configures the research agent with appropriate tools.
 */

import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { v4 as uuidv4 } from "uuid";
import { ResearchAgent } from "../researchAgent.js";

/**
 * Create and initialize the research agent with appropriate tools
 *
 * @param model The language model to use
 * @param name Optional custom name
 * @param description Optional custom description
 * @returns Initialized research agent
 */
export function createResearchAgent(
  model: BaseChatModel,
  name: string = "Research Specialist",
  description: string = "Specialized agent for research, information gathering, and analysis.",
): ResearchAgent {
  try {
    // Initialize tools for the research agent
    const { initializeToolSystem } = require("../../../tools/index.js");
    const factory = initializeToolSystem();

    // Get research tools from the factory
    const tools = factory.getToolsForAgent("research");

    // Create a unique ID for the agent
    const agentId = `research-${uuidv4().substring(0, 8)}`;

    // Create and return the research agent
    return new ResearchAgent(agentId, name, description, model, tools);
  } catch (error) {
    console.error("Error initializing research agent with tools:", error);

    // Create agent without tools as fallback
    const agentId = `research-${uuidv4().substring(0, 8)}`;
    return new ResearchAgent(agentId, name, description, model, []);
  }
}

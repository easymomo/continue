import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { Tool } from "@langchain/core/tools";
import { LLMAdapterFactory } from "../adapters/llm/llmAdapter.js";
import { CoordinatorAgent } from "../agents/coordinator/coordinatorAgent.js";
import { DeveloperAgent } from "../agents/worker/developerAgent.js";
import { ResearchAgent } from "../agents/worker/researchAgent.js";
import { SecurityAgent } from "../agents/worker/securityAgent.js";
import { AgentSystem } from "./agentSystem.js";

/**
 * Agent Factory - creates and initializes all agent types
 */
export class AgentFactory {
  /**
   * Initialize the agent system with all specialized agents
   */
  public static async initializeAgentSystem(): Promise<AgentSystem> {
    const agentSystem = new AgentSystem();
    await agentSystem.initialize();

    // Create and register all agents
    const agents = await this.createAllAgents();

    // Register each agent with the system
    agents.forEach((agent) => {
      agentSystem.registerAgent(agent);
    });

    return agentSystem;
  }

  /**
   * Create all agent instances
   */
  private static async createAllAgents() {
    // Get the LLM adapter/model to be used by all agents
    const llmAdapter = LLMAdapterFactory.createAdapter("default");
    const model = await this.getLangChainModel(llmAdapter);

    // Create the coordinator agent
    const coordinator = new CoordinatorAgent(
      "coordinator",
      "Coordinator Agent",
      "Manages and coordinates specialized agents",
      model,
      [], // No special tools for coordinator yet
    );

    // Create specialized worker agents
    const developerAgent = new DeveloperAgent(
      "developer",
      "Developer Agent",
      "Handles coding tasks and implementation",
      model,
      [], // Will be populated with developer-specific tools
    );

    const securityAgent = new SecurityAgent(
      "security",
      "Security Agent",
      "Handles security review and vulnerability assessment",
      model,
      [], // Will be populated with security-specific tools
    );

    const researchAgent = new ResearchAgent(
      "research",
      "Research Agent",
      "Handles information gathering and analysis",
      model,
      [], // Will be populated with research-specific tools
    );

    // Register worker agents with the coordinator
    coordinator.registerWorker(developerAgent);
    coordinator.registerWorker(securityAgent);
    coordinator.registerWorker(researchAgent);

    // Return all agents
    return [coordinator, developerAgent, securityAgent, researchAgent];
  }

  /**
   * Get a LangChain model from an LLM adapter
   */
  private static async getLangChainModel(
    llmAdapter: any,
  ): Promise<BaseChatModel> {
    if (typeof llmAdapter.getModel === "function") {
      return llmAdapter.getModel();
    }

    // Fallback if the adapter doesn't have a getModel method
    throw new Error("LLM adapter does not provide a LangChain model");
  }

  /**
   * Create agent-specific tools
   */
  private static createAgentTools(agentType: string): Tool[] {
    // Will be implemented to create specialized tools for each agent type
    // For now, return an empty array
    return [];
  }
}

import { LLMAdapterFactory } from "../adapters/llm/llmAdapter";
import { CoordinatorAgent } from "../agents/coordinator/coordinatorAgent";
import { DeveloperAgent } from "../agents/worker/developerAgent";
import { AgentSystem } from "./agentSystem";

/**
 * Factory class for creating the agent system
 */
export class SystemFactory {
  /**
   * Create a default agent system with standard agents
   */
  public static async createDefaultSystem(
    apiKey?: string,
  ): Promise<AgentSystem> {
    // Create the agent system
    const system = new AgentSystem();

    // Create the LLM adapter for OpenAI
    const llmAdapter = LLMAdapterFactory.createAdapter(
      "openai",
      "gpt-4o",
      apiKey,
    );
    const llmModel = llmAdapter.getModel();

    // Create the coordinator agent
    const coordinator = new CoordinatorAgent(
      "coordinator",
      "Coordinator Agent",
      "The central coordinator agent that manages the multi-agent system",
      llmModel,
    );

    // Create specialized worker agents
    const developerAgent = new DeveloperAgent(
      "developer",
      "Developer Agent",
      "Specializes in coding tasks, implementation, and technical details",
      llmModel,
    );

    // Register the agents with the system
    system.registerAgent(coordinator);
    system.registerAgent(developerAgent);

    // Register the specialized agents with the coordinator
    coordinator.registerWorker(developerAgent);

    // Add more specialized agents as needed
    // const researchAgent = new ResearchAgent(...);
    // const securityAgent = new SecurityAgent(...);
    // system.registerAgent(researchAgent);
    // system.registerAgent(securityAgent);
    // coordinator.registerWorker(researchAgent);
    // coordinator.registerWorker(securityAgent);

    // Initialize the system
    await system.initialize();

    return system;
  }

  /**
   * Create a custom agent system with specific configurations
   */
  public static async createCustomSystem(config: any): Promise<AgentSystem> {
    // Create the agent system
    const system = new AgentSystem();

    // Configure the system based on custom configuration
    // ...

    // Initialize the system
    await system.initialize();

    return system;
  }
}

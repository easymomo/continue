import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import {
  AIMessage,
  BaseMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { Tool } from "@langchain/core/tools";
import { Command } from "@langchain/langgraph";
import {
  AgentCommunicationProtocol,
  MessageRouter,
} from "../communication/index.js";
import { AgentType, BaseAgent } from "../core/types.js";

/**
 * Coordinator agent - the master agent that coordinates all other agents
 */
export class CoordinatorAgent extends BaseAgent {
  private workers: Map<string, BaseAgent> = new Map();
  private systemPrompt: string;
  private messageRouter: MessageRouter;
  private communicationProtocol: AgentCommunicationProtocol;

  constructor(
    id: string,
    name: string,
    description: string,
    model: BaseChatModel,
    communicationProtocol: AgentCommunicationProtocol,
    tools: Tool[] = [],
  ) {
    super(id, AgentType.COORDINATOR, name, description, model, tools);

    // Initialize communication components
    this.communicationProtocol = communicationProtocol;
    this.messageRouter = new MessageRouter(communicationProtocol);

    // Register self with the message router
    this.messageRouter.registerAgent(this);
    this.messageRouter.setCoordinatorId(id);

    this.systemPrompt = `You are the Coordinator Agent - the central manager for a multi-agent system.
Your role is to analyze user requests and determine which specialized agent should handle them.
Available worker agents for delegation:
- Developer Agent: For coding tasks, implementation, and technical details
- Research Agent: For searching documentation, finding solutions, and gathering information
- Security Agent: For security audits, vulnerability checks, and secure implementation
- Documentation Agent: For creating and updating documentation
- Testing Agent: For testing code, creating test cases, and validation

Your responsibilities:
1. Analyze user requests to understand their needs
2. Determine which specialized agent is best suited for the task
3. Delegate tasks to appropriate agents
4. Coordinate between agents when tasks require multiple specialists
5. Provide final responses to users based on agent outputs

Always maintain a professional and helpful tone.`;
  }

  /**
   * Register a worker agent
   */
  public registerWorker(worker: BaseAgent): void {
    this.workers.set(worker.id, worker);
    this.messageRouter.registerAgent(worker);
  }

  /**
   * Get the message router
   */
  public getMessageRouter(): MessageRouter {
    return this.messageRouter;
  }

  /**
   * Process a message
   */
  public async process(state: {
    messages: BaseMessage[];
  }): Promise<Command | { messages: BaseMessage[] }> {
    // Get the last message
    const lastMessage = state.messages[state.messages.length - 1];

    // If this is a system message, we can ignore it
    if (lastMessage instanceof SystemMessage) {
      return { messages: state.messages };
    }

    try {
      // Create an agent context for this request
      const context = this.communicationProtocol.createAgentContext(
        state.messages,
      );

      // Get content as string safely
      const contentStr =
        typeof lastMessage.content === "string"
          ? lastMessage.content
          : JSON.stringify(lastMessage.content);

      // Determine which worker agent to delegate to
      const agentToCall = await this.determineResponsibleAgent(contentStr);

      if (agentToCall === "__end__") {
        // If no delegation needed, respond directly
        const response = await this.model.invoke([
          ...state.messages,
          new HumanMessage(
            "Based on this request, please provide a direct response to the user.",
          ),
        ]);

        return {
          messages: [...state.messages, response],
        };
      } else {
        // Delegate to the appropriate worker agent
        // First, check if the agent exists
        if (!this.workers.has(agentToCall)) {
          throw new Error(`Worker agent with ID ${agentToCall} not found`);
        }

        // Create a delegation message
        const delegationMessage = `I'm delegating this to the ${this.workers.get(agentToCall)?.name} to handle this request.`;

        // Return a Command to go to the worker agent
        return new Command({
          goto: agentToCall,
          update: {
            messages: [
              ...state.messages,
              new AIMessage({
                content: delegationMessage,
              }),
            ],
          },
        });
      }
    } catch (error) {
      console.error("Error processing message in CoordinatorAgent:", error);
      return {
        messages: [
          ...state.messages,
          new AIMessage({
            content:
              "I encountered an error while processing your request. Please try again.",
          }),
        ],
      };
    }
  }

  /**
   * Determine which agent should handle a request
   */
  private async determineResponsibleAgent(content: string): Promise<string> {
    // Use structured output to make the LLM identify the appropriate agent
    try {
      const agentSelectionPrompt = `
Given the following user request, determine which specialized agent should handle it.
Available agents: ${Array.from(this.workers.keys()).join(", ")}, or "__end__" if you should handle it directly.

User request: "${content}"

Respond with the agent ID only, no explanation.`;

      const response = await this.model.invoke([
        new HumanMessage(agentSelectionPrompt),
      ]);

      // Extract the agent ID from the response
      const responseContent = response.content;
      const agentId =
        typeof responseContent === "string"
          ? responseContent.trim()
          : JSON.stringify(responseContent).trim();

      // Verify the agent exists or it's the end command
      if (agentId === "__end__" || this.workers.has(agentId)) {
        return agentId;
      } else {
        // Default to handling it directly if the agent ID is invalid
        console.warn(
          `Invalid agent ID returned: ${agentId}. Handling directly.`,
        );
        return "__end__";
      }
    } catch (error) {
      console.error("Error determining responsible agent:", error);
      return "__end__";
    }
  }
}

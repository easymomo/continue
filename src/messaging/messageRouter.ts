import { HumanMessage } from "@langchain/core/messages";
import { v4 as uuidv4 } from "uuid";
import { Agent } from "../agents/core/types";

/**
 * Message types for agent communication
 */
export enum MessageType {
  COMMAND = "command",
  QUERY = "query",
  RESPONSE = "response",
  EVENT = "event",
  ERROR = "error",
}

/**
 * Base message interface for agent communication
 */
export interface AgentMessage {
  id: string;
  type: MessageType;
  sender: string;
  timestamp: number;
  content: any;
}

/**
 * Response from an agent
 */
export interface AgentResponse {
  id: string;
  content: any;
  agentId: string;
}

/**
 * Message router for agent communication
 */
export class MessageRouter {
  private agents: Map<string, Agent> = new Map();
  private messageQueue: AgentMessage[] = [];
  private messageHistory: Map<string, AgentMessage[]> = new Map();

  /**
   * Register an agent with the router
   */
  public registerAgent(agent: Agent): void {
    this.agents.set(agent.id, agent);
    this.messageHistory.set(agent.id, []);
  }

  /**
   * Route a message to the appropriate agent
   */
  public async routeMessage(message: AgentMessage): Promise<AgentResponse> {
    const targetAgent = this.agents.get(message.sender);

    if (!targetAgent) {
      throw new Error(`Agent ${message.sender} not found`);
    }

    // Add message to queue and history
    this.messageQueue.push(message);
    this.addToHistory(message);

    // Convert to LangChain message format
    const lcMessage = new HumanMessage(message.content);

    // Process the message with the target agent
    const response = await targetAgent.process({ messages: [lcMessage] });

    // Create and return the agent response
    const agentResponse: AgentResponse = {
      id: uuidv4(),
      content: response,
      agentId: targetAgent.id,
    };

    return agentResponse;
  }

  /**
   * Add a message to the history
   */
  private addToHistory(message: AgentMessage): void {
    const agentHistory = this.messageHistory.get(message.sender) || [];
    agentHistory.push(message);
    this.messageHistory.set(message.sender, agentHistory);
  }

  /**
   * Get the message history for an agent
   */
  public getAgentHistory(agentId: string): AgentMessage[] {
    return this.messageHistory.get(agentId) || [];
  }

  /**
   * Clear the message queue
   */
  public clearQueue(): void {
    this.messageQueue = [];
  }

  /**
   * Create a new message
   */
  public createMessage(
    type: MessageType,
    sender: string,
    content: any,
  ): AgentMessage {
    return {
      id: uuidv4(),
      type,
      sender,
      timestamp: Date.now(),
      content,
    };
  }
}

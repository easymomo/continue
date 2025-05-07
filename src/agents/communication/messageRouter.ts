/**
 * Message Router
 *
 * Implements routing and delivery of messages between agents in the agent system.
 */

import { BaseMessage } from "@langchain/core/messages";
import { Command } from "@langchain/langgraph";
import { Agent } from "../core/types.js";
import { AgentCommunicationProtocol } from "./protocol.js";
import { AgentMessage, MessagePriority } from "./types.js";

/**
 * Message Router for the agent communication system
 * Routes messages between agents and handles delivery
 */
export class MessageRouter {
  private protocol: AgentCommunicationProtocol;
  private agentMap: Map<string, Agent> = new Map();
  private coordinatorId: string | null = null;

  constructor(protocol: AgentCommunicationProtocol) {
    this.protocol = protocol;
  }

  /**
   * Register an agent with the router
   */
  public registerAgent(agent: Agent): void {
    this.agentMap.set(agent.id, agent);
    this.protocol.registerAgent(agent);

    // If the agent is a coordinator, store its ID for default routing
    if (agent.type === "coordinator") {
      this.coordinatorId = agent.id;
    }
  }

  /**
   * Set the coordinator agent ID
   */
  public setCoordinatorId(coordinatorId: string): void {
    if (!this.agentMap.has(coordinatorId)) {
      throw new Error(
        `Coordinator agent with ID ${coordinatorId} is not registered`,
      );
    }
    this.coordinatorId = coordinatorId;
  }

  /**
   * Route a message to its recipient
   */
  public async routeMessage(message: AgentMessage): Promise<BaseMessage[]> {
    try {
      // Log the message for debugging
      this.protocol.logMessage(message);

      // Get the recipient agent
      const recipientAgent = this.agentMap.get(message.recipientId);

      if (!recipientAgent) {
        throw new Error(
          `Recipient agent with ID ${message.recipientId} not found`,
        );
      }

      // Extract context from the message
      const context = this.protocol.extractContext(message);

      // Process the message with the recipient agent
      const result = await recipientAgent.process({
        messages: context.conversationHistory,
      });

      // Check if the result is a Command (indicating a handoff to another agent)
      if (result instanceof Command) {
        // Access Command properties safely
        // We know from our agent implementations that goto and update.messages should exist
        // Cast the Command to any to bypass type checking for the internal structure
        const commandAny = result as any;
        const targetAgentId = commandAny.goto as string;
        const updatedMessages = commandAny.update?.messages as BaseMessage[];

        if (!targetAgentId || !updatedMessages) {
          throw new Error("Invalid command result: missing goto or messages");
        }

        // Create a handoff message
        const handoffMessage = this.protocol.createHandoffMessage(
          message.recipientId,
          targetAgentId,
          "Automatic handoff based on agent decision",
          updatedMessages,
          context.taskContext,
        );

        // Route the handoff message to the target agent
        return this.routeMessage(handoffMessage);
      }

      // Return the updated messages
      return "messages" in result ? result.messages : [];
    } catch (error) {
      console.error("Error routing message:", error);

      // Create an error message to send back to the sender
      const errorMessage = this.protocol.createErrorMessage(
        message.recipientId,
        message.senderId,
        "ROUTING_ERROR",
        `Error routing message: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
        message.id,
      );

      // Log the error message
      this.protocol.logMessage(errorMessage);

      // If we have a coordinator and this isn't already from the coordinator,
      // route the error to the coordinator
      if (
        this.coordinatorId &&
        message.senderId !== this.coordinatorId &&
        message.recipientId !== this.coordinatorId
      ) {
        const coordinatorErrorMessage = this.protocol.createErrorMessage(
          message.recipientId,
          this.coordinatorId,
          "AGENT_ERROR",
          `Error in communication between ${message.senderId} and ${message.recipientId}: ${error instanceof Error ? error.message : String(error)}`,
          error instanceof Error ? error.stack : undefined,
          message.id,
          MessagePriority.HIGH,
        );

        // Route to coordinator, but with error handling to prevent infinite loops
        try {
          await this.routeMessage(coordinatorErrorMessage);
        } catch (coordinatorError) {
          console.error(
            "Error notifying coordinator of routing error:",
            coordinatorError,
          );
        }
      }

      // Return an empty array in case of error
      return [];
    }
  }

  /**
   * Create and route a message from one agent to another
   */
  public async createAndRouteMessage(
    senderId: string,
    recipientId: string,
    content: string | Record<string, unknown>,
    conversationHistory: BaseMessage[],
  ): Promise<BaseMessage[]> {
    // Create the request message
    const requestMessage = this.protocol.createRequestMessage(
      senderId,
      recipientId,
      content,
      conversationHistory,
    );

    // Route the message
    return this.routeMessage(requestMessage);
  }

  /**
   * Route a message to the coordinator agent
   */
  public async routeToCoordinator(
    senderId: string,
    content: string | Record<string, unknown>,
    conversationHistory: BaseMessage[],
  ): Promise<BaseMessage[]> {
    if (!this.coordinatorId) {
      throw new Error("No coordinator agent registered");
    }

    return this.createAndRouteMessage(
      senderId,
      this.coordinatorId,
      content,
      conversationHistory,
    );
  }

  /**
   * Get a registered agent by ID
   */
  public getAgent(agentId: string): Agent | undefined {
    return this.agentMap.get(agentId);
  }

  /**
   * Get all registered agents
   */
  public getAllAgents(): Agent[] {
    return Array.from(this.agentMap.values());
  }
}

/**
 * Agent Communication Protocol
 *
 * Implements the protocol for communication between agents, including
 * message routing, context passing, and handoff mechanisms.
 */

import { BaseMessage } from "@langchain/core/messages";
import { Command } from "@langchain/langgraph";
import { v4 as uuidv4 } from "uuid";
import { Agent } from "../core/types.js";
import {
  AgentContext,
  AgentMessage,
  AgentMessageType,
  ErrorMessage,
  HandoffMessage,
  MessagePriority,
  MessageTrackingMetadata,
  RequestMessage,
  ResponseMessage,
} from "./types.js";

/**
 * Agent Communication Protocol service
 * Handles message creation, routing, and context management
 */
export class AgentCommunicationProtocol {
  private agents: Map<string, Agent> = new Map();
  private messageTraces: Map<string, MessageTrackingMetadata> = new Map();

  /**
   * Register an agent with the protocol
   */
  public registerAgent(agent: Agent): void {
    this.agents.set(agent.id, agent);
  }

  /**
   * Get an agent by ID
   */
  public getAgent(agentId: string): Agent | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Create a new request message
   */
  public createRequestMessage(
    senderId: string,
    recipientId: string,
    content: string | Record<string, unknown>,
    conversationHistory?: BaseMessage[],
    priority: MessagePriority = MessagePriority.NORMAL,
  ): RequestMessage {
    const messageId = uuidv4();

    // Create tracking metadata
    const trackingMetadata: MessageTrackingMetadata = {
      rootRequestId: messageId,
      agentChain: [senderId],
      traceId: uuidv4(),
      timing: {
        startTime: Date.now(),
      },
    };

    // Store metadata for tracking
    this.messageTraces.set(messageId, trackingMetadata);

    const message: RequestMessage = {
      id: messageId,
      type: AgentMessageType.REQUEST,
      senderId,
      recipientId,
      timestamp: Date.now(),
      priority,
      content,
      context: conversationHistory
        ? {
            conversationHistory,
          }
        : undefined,
      metadata: {
        tracking: trackingMetadata,
      },
    };

    return message;
  }

  /**
   * Create a response message
   */
  public createResponseMessage(
    senderId: string,
    recipientId: string,
    requestId: string,
    content: string | Record<string, unknown>,
    isFinal: boolean = true,
    priority: MessagePriority = MessagePriority.NORMAL,
  ): ResponseMessage {
    const messageId = uuidv4();

    // Get tracking metadata from original request
    const trackingMetadata = this.messageTraces.get(requestId);

    const message: ResponseMessage = {
      id: messageId,
      type: AgentMessageType.RESPONSE,
      senderId,
      recipientId,
      timestamp: Date.now(),
      priority,
      content,
      requestId,
      isFinal,
      metadata: trackingMetadata
        ? {
            tracking: {
              ...trackingMetadata,
              agentChain: [...trackingMetadata.agentChain, senderId],
            },
          }
        : undefined,
    };

    return message;
  }

  /**
   * Create a handoff message to transfer control to another agent
   */
  public createHandoffMessage(
    senderId: string,
    recipientId: string,
    reason: string,
    conversationHistory: BaseMessage[],
    taskInfo?: Record<string, unknown>,
    requestId?: string,
    priority: MessagePriority = MessagePriority.HIGH,
  ): HandoffMessage {
    const messageId = uuidv4();

    // Get tracking metadata from original request if available
    let trackingMetadata: MessageTrackingMetadata | undefined;
    if (requestId) {
      trackingMetadata = this.messageTraces.get(requestId);
      if (trackingMetadata) {
        trackingMetadata = {
          ...trackingMetadata,
          agentChain: [...trackingMetadata.agentChain, senderId],
        };
      }
    }

    // If no tracking metadata is available, create new one
    if (!trackingMetadata) {
      trackingMetadata = {
        rootRequestId: messageId,
        agentChain: [senderId],
        traceId: uuidv4(),
        timing: {
          startTime: Date.now(),
        },
      };
    }

    const message: HandoffMessage = {
      id: messageId,
      type: AgentMessageType.HANDOFF,
      senderId,
      recipientId,
      timestamp: Date.now(),
      priority,
      content: `Handoff from ${senderId} to ${recipientId}: ${reason}`,
      reason,
      context: {
        conversationHistory,
        taskInfo,
      },
      metadata: {
        tracking: trackingMetadata,
      },
    };

    return message;
  }

  /**
   * Create an error message
   */
  public createErrorMessage(
    senderId: string,
    recipientId: string,
    errorCode: string,
    errorMessage: string,
    details?: string,
    sourceMessageId?: string,
    priority: MessagePriority = MessagePriority.HIGH,
  ): ErrorMessage {
    const messageId = uuidv4();

    const message: ErrorMessage = {
      id: messageId,
      type: AgentMessageType.ERROR,
      senderId,
      recipientId,
      timestamp: Date.now(),
      priority,
      content: errorMessage,
      errorCode,
      details,
      sourceMessageId,
    };

    return message;
  }

  /**
   * Convert a handoff message to a LangGraph Command
   * This allows easy integration with the existing agent framework
   */
  public handoffToCommand(handoffMessage: HandoffMessage): Command {
    return new Command({
      goto: handoffMessage.recipientId,
      update: {
        messages: handoffMessage.context.conversationHistory,
      },
    });
  }

  /**
   * Extract agent context from a message
   */
  public extractContext(message: AgentMessage): AgentContext {
    const baseContext: AgentContext = {
      conversationHistory: [],
    };

    if (message.type === AgentMessageType.REQUEST) {
      const requestMessage = message as RequestMessage;
      if (requestMessage.context?.conversationHistory) {
        baseContext.conversationHistory =
          requestMessage.context.conversationHistory;
      }
      if (requestMessage.context?.userContext) {
        baseContext.userContext = requestMessage.context.userContext;
      }
      if (requestMessage.context?.taskContext) {
        baseContext.taskContext = requestMessage.context.taskContext;
      }
    } else if (message.type === AgentMessageType.HANDOFF) {
      const handoffMessage = message as HandoffMessage;
      baseContext.conversationHistory =
        handoffMessage.context.conversationHistory;
      if (handoffMessage.context.taskInfo) {
        baseContext.taskContext = handoffMessage.context.taskInfo;
      }
      if (handoffMessage.context.userContext) {
        baseContext.userContext = handoffMessage.context.userContext;
      }
    }

    // Add processing chain information
    const trackingMetadata = message.metadata
      ?.tracking as MessageTrackingMetadata;
    if (trackingMetadata) {
      baseContext.processingChain = {
        agents: trackingMetadata.agentChain,
        startTime: trackingMetadata.timing?.startTime ?? Date.now(),
      };
      baseContext.trackingMetadata = trackingMetadata;
    }

    return baseContext;
  }

  /**
   * Create context for a new agent from existing BaseMessages
   */
  public createAgentContext(
    messages: BaseMessage[],
    userContext?: Record<string, unknown>,
    taskContext?: Record<string, unknown>,
  ): AgentContext {
    return {
      conversationHistory: messages,
      userContext,
      taskContext,
      processingChain: {
        agents: [],
        startTime: Date.now(),
      },
    };
  }

  /**
   * Update an agent context with new information
   */
  public updateAgentContext(
    context: AgentContext,
    updates: Partial<AgentContext>,
  ): AgentContext {
    return {
      ...context,
      ...updates,
      // Merge nested objects properly
      userContext: {
        ...(context.userContext || {}),
        ...(updates.userContext || {}),
      },
      taskContext: {
        ...(context.taskContext || {}),
        ...(updates.taskContext || {}),
      },
      processingChain: {
        ...(context.processingChain || { agents: [], startTime: Date.now() }),
        ...(updates.processingChain || {}),
      },
    };
  }

  /**
   * Determine if a message should be logged for debugging
   */
  public shouldLogMessage(message: AgentMessage): boolean {
    // Log all high and urgent priority messages
    if (
      message.priority === MessagePriority.HIGH ||
      message.priority === MessagePriority.URGENT
    ) {
      return true;
    }

    // Log all error messages
    if (message.type === AgentMessageType.ERROR) {
      return true;
    }

    // Log handoff messages
    if (message.type === AgentMessageType.HANDOFF) {
      return true;
    }

    return false;
  }

  /**
   * Log a message for debugging purposes
   */
  public logMessage(message: AgentMessage): void {
    if (this.shouldLogMessage(message)) {
      const sender =
        this.agents.get(message.senderId)?.name || message.senderId;
      const recipient =
        this.agents.get(message.recipientId)?.name || message.recipientId;

      console.log(
        `[${new Date(message.timestamp).toISOString()}] ${message.type.toUpperCase()} (${message.priority}) from ${sender} to ${recipient}: ${typeof message.content === "string" ? message.content.substring(0, 100) : "Complex content"}`,
      );

      if (message.type === AgentMessageType.ERROR) {
        const errorMessage = message as ErrorMessage;
        console.error(
          `ERROR ${errorMessage.errorCode}: ${errorMessage.content}`,
        );
        if (errorMessage.details) {
          console.error(`Details: ${errorMessage.details}`);
        }
      }
    }
  }
}

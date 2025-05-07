/**
 * Agent Communication Protocol Types
 * Defines the structured message formats and interfaces for agent communication
 */

import { BaseMessage } from "@langchain/core/messages";

/**
 * Message priority levels for agent communication
 */
export enum MessagePriority {
  LOW = "low",
  NORMAL = "normal",
  HIGH = "high",
  URGENT = "urgent",
}

/**
 * Message type for agent communication
 */
export enum AgentMessageType {
  /**
   * Request from user or another agent
   */
  REQUEST = "request",

  /**
   * Response to a request
   */
  RESPONSE = "response",

  /**
   * Notification about an event or state change
   */
  NOTIFICATION = "notification",

  /**
   * Command to perform an action
   */
  COMMAND = "command",

  /**
   * Error message
   */
  ERROR = "error",

  /**
   * System message (internal to the agent system)
   */
  SYSTEM = "system",

  /**
   * Handoff message to transfer control to another agent
   */
  HANDOFF = "handoff",
}

/**
 * Base interface for all agent messages
 */
export interface AgentMessage {
  /**
   * Unique identifier for the message
   */
  id: string;

  /**
   * Type of message
   */
  type: AgentMessageType;

  /**
   * Identifier of the agent that sent the message
   */
  senderId: string;

  /**
   * Identifier of the agent that should receive the message
   */
  recipientId: string;

  /**
   * Timestamp of when the message was created
   */
  timestamp: number;

  /**
   * Priority of the message
   */
  priority: MessagePriority;

  /**
   * Message content
   */
  content: unknown;

  /**
   * Optional metadata associated with the message
   */
  metadata?: Record<string, unknown>;
}

/**
 * Interface for request messages
 */
export interface RequestMessage extends AgentMessage {
  type: AgentMessageType.REQUEST;

  /**
   * The actual content of the request
   */
  content: string | Record<string, unknown>;

  /**
   * Request context information
   */
  context?: {
    /**
     * List of messages providing conversation history
     */
    conversationHistory?: BaseMessage[];

    /**
     * User-specific context
     */
    userContext?: Record<string, unknown>;

    /**
     * Task-specific context
     */
    taskContext?: Record<string, unknown>;
  };
}

/**
 * Interface for response messages
 */
export interface ResponseMessage extends AgentMessage {
  type: AgentMessageType.RESPONSE;

  /**
   * The response content
   */
  content: string | Record<string, unknown>;

  /**
   * ID of the request this is responding to
   */
  requestId: string;

  /**
   * Whether this is a final response or intermediate
   */
  isFinal: boolean;
}

/**
 * Interface for handoff messages
 */
export interface HandoffMessage extends AgentMessage {
  type: AgentMessageType.HANDOFF;

  /**
   * Reason for the handoff
   */
  reason: string;

  /**
   * Context to pass to the next agent
   */
  context: {
    /**
     * Conversation history
     */
    conversationHistory: BaseMessage[];

    /**
     * Current task information
     */
    taskInfo?: Record<string, unknown>;

    /**
     * User context
     */
    userContext?: Record<string, unknown>;
  };

  /**
   * Information about the current state of processing
   */
  stateInfo?: {
    /**
     * Progress status (0-100)
     */
    progress?: number;

    /**
     * Current stage of processing
     */
    currentStage?: string;

    /**
     * Partial results or findings so far
     */
    partialResults?: Record<string, unknown>;
  };
}

/**
 * Interface for error messages
 */
export interface ErrorMessage extends AgentMessage {
  type: AgentMessageType.ERROR;

  /**
   * Error code
   */
  errorCode: string;

  /**
   * Error message
   */
  content: string;

  /**
   * Stack trace or additional details
   */
  details?: string;

  /**
   * ID of the message that caused the error
   */
  sourceMessageId?: string;
}

/**
 * Interface for command messages
 */
export interface CommandMessage extends AgentMessage {
  type: AgentMessageType.COMMAND;

  /**
   * Command name
   */
  command: string;

  /**
   * Command parameters
   */
  parameters: Record<string, unknown>;

  /**
   * Whether the command requires acknowledgment
   */
  requiresAck: boolean;
}

/**
 * Interface for notification messages
 */
export interface NotificationMessage extends AgentMessage {
  type: AgentMessageType.NOTIFICATION;

  /**
   * Notification category
   */
  category: string;

  /**
   * Notification content
   */
  content: string;

  /**
   * Whether the notification needs to be acknowledged
   */
  requiresAck: boolean;
}

/**
 * Interface for system messages
 */
export interface SystemMessage extends AgentMessage {
  type: AgentMessageType.SYSTEM;

  /**
   * System message content
   */
  content: string;
}

/**
 * Metadata for tracking messages through the system
 */
export interface MessageTrackingMetadata {
  /**
   * Original request ID that started the chain
   */
  rootRequestId: string;

  /**
   * Chain of agent IDs that have processed this request
   */
  agentChain: string[];

  /**
   * Trace ID for distributed tracing
   */
  traceId: string;

  /**
   * Timing information for performance monitoring
   */
  timing?: {
    /**
     * When processing started
     */
    startTime: number;

    /**
     * Processing time in milliseconds
     */
    processingTime?: number;
  };
}

/**
 * Context information passed between agents
 */
export interface AgentContext {
  /**
   * Conversation history
   */
  conversationHistory: BaseMessage[];

  /**
   * User-specific context
   */
  userContext?: Record<string, unknown>;

  /**
   * Task-specific context
   */
  taskContext?: Record<string, unknown>;

  /**
   * Information about the processing chain
   */
  processingChain?: {
    /**
     * Agents that have processed this request
     */
    agents: string[];

    /**
     * Processing start time
     */
    startTime: number;
  };

  /**
   * Metadata for tracking
   */
  trackingMetadata?: MessageTrackingMetadata;
}

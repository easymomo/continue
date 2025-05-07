/**
 * Core types for the AIgents system
 */

/**
 * Agent type definitions
 */
export enum AgentType {
  COORDINATOR = "coordinator",
  DEVELOPER = "developer",
  RESEARCH = "research",
  SECURITY = "security",
  DOCUMENTATION = "documentation",
  TESTING = "testing",
  EVALUATION = "evaluation",
}

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
 * Agent message interface
 */
export interface AgentMessage {
  id: string;
  type: MessageType;
  sender: string;
  recipient?: string;
  timestamp: number;
  content: any;
  metadata?: Record<string, any>;
}

/**
 * Agent response interface
 */
export interface AgentResponse {
  id: string;
  agentId: string;
  content: any;
  metadata?: Record<string, any>;
}

/**
 * LLM provider interface
 */
export interface LLMProvider {
  id: string;
  name: string;
  description: string;
  isAvailable: boolean;
  supportsStreaming: boolean;
  supportsFunctions: boolean;
  contextWindow: number;
  getModel(): any;
}

/**
 * Task state definitions
 */
export enum TaskState {
  PLANNED = "planned",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  FAILED = "failed",
}

/**
 * Task interface
 */
export interface Task {
  id: string;
  parentId?: string;
  name: string;
  description: string;
  state: TaskState;
  priority: "low" | "medium" | "high";
  assignedAgentId?: string;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  metadata?: Record<string, any>;
}

/**
 * System mode enum
 */
export enum SystemMode {
  VAN = "van",
  PLAN = "plan",
  CREATIVE = "creative",
  IMPLEMENT = "implement",
  QA = "qa",
}

/**
 * Task complexity enum
 */
export enum TaskComplexity {
  LEVEL_1 = 1,
  LEVEL_2 = 2,
  LEVEL_3 = 3,
}

/**
 * Tool interface
 */
export interface Tool {
  id: string;
  name: string;
  description: string;
  execute(args: any): Promise<any>;
}

/**
 * Types used throughout the agent system
 */

/**
 * Message in a conversation
 */
export interface Message {
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  name?: string;
  toolCallId?: string;
  toolCalls?: ToolCall[];
}

/**
 * A tool that can be called by the LLM
 */
export interface Tool {
  function: {
    name: string;
    description: string;
    parameters: {
      type: string;
      properties: Record<string, any>;
      required?: string[];
    };
  };
  display?: {
    icon?: string;
    group?: string;
  };
}

/**
 * A tool call from the LLM
 */
export interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

/**
 * Context item (e.g., file content, search result)
 */
export interface ContextItem {
  id: string;
  type: string;
  content: string;
  title?: string;
  metadata?: Record<string, any>;
}

/**
 * Message between agents in our system
 */
export interface AgentMessage {
  from: AgentType;
  to: AgentType | "all";
  type: "request" | "response" | "notification";
  content: string | Record<string, any>;
  id: string;
  replyTo?: string;
  timestamp: number;
}

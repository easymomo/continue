/**
 * Types used throughout the agent system
 */

/**
 * Message in a conversation
 */
export interface Message {
  role: 'user' | 'assistant' | 'system' | 'tool';
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
  type: 'function';
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
 * Agent types in our system
 */
export enum AgentType {
  COORDINATOR = 'coordinator',
  PROJECT_MANAGER = 'project_manager',
  SECURITY = 'security',
  SEARCH = 'search',
  DOCUMENTATION = 'documentation',
  DEVELOPER = 'developer',
}

/**
 * Message between agents in our system
 */
export interface AgentMessage {
  from: AgentType;
  to: AgentType | 'all';
  type: 'request' | 'response' | 'notification';
  content: string | Record<string, any>;
  id: string;
  replyTo?: string;
  timestamp: number;
} 
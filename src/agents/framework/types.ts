/**
 * Framework Types
 *
 * Defines interfaces and types used throughout the agent framework.
 */

import { EventEmitter } from "events";

/**
 * Defines a capability that an agent can provide
 */
export interface AgentCapability {
  name: string;
  description: string;
  taskTypes: string[];
}

/**
 * Configuration for an agent
 */
export interface AgentConfig {
  id?: string;
  name?: string;
  type: string;
  settings?: Record<string, any>;
}

/**
 * Registration information for an agent
 */
export interface AgentRegistration {
  id: string;
  name: string;
  description: string;
  version: string;
  capabilities: AgentCapabilities;
  supportedTaskTypes: string[];
  status: AgentStatus;
  instance: Agent;
}

/**
 * Task priorities
 */
export enum TaskPriority {
  LOW = 0,
  MEDIUM = 50,
  HIGH = 100,
  CRITICAL = 200,
}

/**
 * Task status
 */
export enum TaskStatus {
  PENDING = "pending",
  ASSIGNED = "assigned",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
}

/**
 * A step within a task
 */
export interface TaskStep {
  id: string;
  name: string;
  status: TaskStatus;
  completedAt?: string;
}

/**
 * A task to be executed by an agent
 */
export interface Task {
  id: string;
  type: string;
  priority: TaskPriority;
  status: TaskStatus;
  data: any;
  result?: any;
  error?: any;
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  dependencies?: string[];
  metadata?: Record<string, any>;
  description: string;
  steps: TaskStep[];
  context: Record<string, any>;
}

/**
 * Agent capabilities interface
 */
export interface AgentCapabilities {
  [capability: string]: boolean | number | string;
}

/**
 * Agent interface
 */
export interface Agent extends EventEmitter {
  id: string;
  name: string;
  description: string;
  version: string;
  capabilities: AgentCapabilities;
  supportedTaskTypes: string[];

  initialize(): Promise<void>;
  shutdown(): Promise<void>;

  handleTask(task: Task): Promise<Task>;
  cancelTask(taskId: string): Promise<boolean>;

  handleMessage(message: Message): Promise<void>;

  getStatus(): AgentStatus;
}

/**
 * Agent status
 */
export interface AgentStatus {
  id: string;
  name: string;
  status: "idle" | "busy" | "offline";
  currentTasks: string[];
  lastActive: string;
  metrics?: Record<string, any>;
}

/**
 * Message types for agent communication
 */
export enum MessageType {
  COMMAND = "command",
  REQUEST = "request",
  RESPONSE = "response",
  EVENT = "event",
  ERROR = "error",
}

/**
 * A message sent between agents
 */
export interface Message {
  id: string;
  type: MessageType;
  sender: string;
  recipients: string[] | "broadcast";
  subject: string;
  content: any;
  timestamp: string;
  replyTo?: string;
  metadata?: Record<string, any>;
}

/**
 * An item stored in the memory system
 */
export interface MemoryItem {
  id: string;
  type: string;
  content: any;
  metadata: Record<string, any>;
  timestamp: string;
}

/**
 * Types of storage adapters
 */
export type StorageType = "vector" | "document" | "relational" | "file";

/**
 * Interface for storage adapters
 */
export interface StorageAdapter {
  id: string;
  type: StorageType;
  store(item: any): Promise<string>;
  retrieve(id: string): Promise<any>;
  query(filter: Record<string, any>): Promise<any[]>;
}

/**
 * Context interface for agent interactions
 */
export interface Context {
  id: string;
  type: string;
  data: Record<string, any>;
  relatedTasks?: string[];
  relatedMemories?: string[];
  timestamp: string;
}

/**
 * Plugin interface for extending the framework
 */
export interface Plugin {
  id: string;
  name: string;
  description: string;
  version: string;

  initialize(framework: any): Promise<void>;
  shutdown(): Promise<void>;
}

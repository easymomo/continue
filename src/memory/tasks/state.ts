/**
 * Task State Manager
 *
 * Manages task state, including status, progress, and metadata.
 * Provides history tracking and state transitions for tasks.
 */

import { v4 as uuidv4 } from "uuid";
import { StorageManager } from "../persistence/storage";
import { TransactionManager } from "../persistence/transaction";
import { Task, Transaction } from "../types";

/**
 * Task state update options
 */
export interface TaskStateUpdateOptions {
  incrementProgress?: boolean; // If true, increments progress rather than replacing it
  trackHistory?: boolean; // If true, tracks the state change in history
  updateTimestamp?: boolean; // If true, updates the task's updatedAt timestamp
  notifySubscribers?: boolean; // If true, notifies subscribers of the state change
  metadata?: Record<string, any>; // Additional metadata to record with the state change
}

/**
 * Task state snapshot
 */
export interface TaskStateSnapshot {
  id: string;
  taskId: string;
  timestamp: number;
  status: Task["status"];
  progress: number;
  metadata: Record<string, any>;
}

/**
 * Task state change event
 */
export interface TaskStateChangeEvent {
  id: string;
  taskId: string;
  timestamp: number;
  previousState: Partial<TaskStateSnapshot>;
  newState: Partial<TaskStateSnapshot>;
  changeType: "status" | "progress" | "metadata" | "multiple";
  initiatedBy?: string; // ID of user or system component that initiated the change
  metadata: Record<string, any>;
}

/**
 * Task state subscription options
 */
export interface TaskStateSubscriptionOptions {
  includeStatusChanges?: boolean;
  includeProgressChanges?: boolean;
  includeMetadataChanges?: boolean;
  specificTaskIds?: string[];
  includeChildTasks?: boolean;
}

/**
 * Task state query options
 */
export interface TaskStateQueryOptions {
  status?: Task["status"]; // Filter by status
  minProgress?: number; // Filter by minimum progress
  maxProgress?: number; // Filter by maximum progress
  updatedSince?: number; // Filter by last update time
  metadataFilter?: Record<string, any>; // Filter by metadata key-value pairs
  sortBy?: "updatedAt" | "progress" | "createdAt"; // Sort by field
  sortDirection?: "asc" | "desc"; // Sort direction
  limit?: number; // Max number of results
  offset?: number; // Offset for pagination
}

/**
 * Task state manager
 */
export class TaskStateManager {
  private stateSnapshots: Map<string, TaskStateSnapshot[]> = new Map();
  private stateChangeHistory: Map<string, TaskStateChangeEvent[]> = new Map();
  private stateSubscriptions: Map<string, Function[]> = new Map();
  private initialized: boolean = false;
  private storageManager: StorageManager;

  constructor(private transactionManager: TransactionManager) {
    // We'll get the storage manager from the transaction manager for CRUD operations
    this.storageManager = transactionManager["storageManager"];
  }

  /**
   * Initialize the state manager
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // In a real implementation, we would load state history from storage
    // For now, we'll just initialize empty maps

    this.initialized = true;
  }

  /**
   * Update task status
   */
  public async updateTaskStatus(
    taskId: string,
    status: Task["status"],
    options: TaskStateUpdateOptions = {},
  ): Promise<boolean> {
    return this.transactionManager.executeInTransaction(async (transaction) => {
      // Get the current task
      const task = await this.storageManager.getTask(taskId, transaction);
      if (!task) {
        throw new Error(`Task with ID ${taskId} not found`);
      }

      // Create a state change event
      const stateChangeEvent: TaskStateChangeEvent = {
        id: uuidv4(),
        taskId,
        timestamp: Date.now(),
        previousState: {
          status: task.status,
        },
        newState: {
          status,
        },
        changeType: "status",
        metadata: options.metadata || {},
      };

      // Update task status
      const updateData: Partial<Task> = {
        status,
      };

      // Update completedAt timestamp if completing the task
      if (status === "completed" && task.status !== "completed") {
        updateData.completedAt = Date.now();
        stateChangeEvent.newState.metadata = {
          ...stateChangeEvent.newState.metadata,
          completedAt: updateData.completedAt,
        };
      }

      // Update updatedAt timestamp if requested
      if (options.updateTimestamp !== false) {
        updateData.updatedAt = Date.now();
      }

      // Update the task
      const updatedTask = {
        ...task,
        ...updateData,
      };
      await this.storageManager.updateTask(updatedTask);

      // Track history if requested
      if (options.trackHistory !== false) {
        await this.trackStateChange(stateChangeEvent, transaction);
      }

      // Notify subscribers if requested
      if (options.notifySubscribers !== false) {
        this.notifyStateChangeSubscribers(taskId, stateChangeEvent);
      }

      return true;
    });
  }

  /**
   * Update task progress
   */
  public async updateTaskProgress(
    taskId: string,
    progress: number,
    options: TaskStateUpdateOptions = {},
  ): Promise<boolean> {
    return this.transactionManager.executeInTransaction(async (transaction) => {
      // Get the current task
      const task = await this.storageManager.getTask(taskId, transaction);
      if (!task) {
        throw new Error(`Task with ID ${taskId} not found`);
      }

      // Ensure progress is between 0 and 100
      const normalizedProgress = Math.max(0, Math.min(100, progress));

      // Get current progress from metadata
      const currentProgress = task.metadata?.progress || 0;

      // Calculate new progress
      const newProgress = options.incrementProgress
        ? Math.min(100, currentProgress + normalizedProgress)
        : normalizedProgress;

      // Create a state change event
      const stateChangeEvent: TaskStateChangeEvent = {
        id: uuidv4(),
        taskId,
        timestamp: Date.now(),
        previousState: {
          progress: currentProgress,
        },
        newState: {
          progress: newProgress,
        },
        changeType: "progress",
        metadata: options.metadata || {},
      };

      // Update task metadata
      const metadata = { ...task.metadata, progress: newProgress };

      // Update the task
      const updatedTask = {
        ...task,
        metadata,
        updatedAt:
          options.updateTimestamp !== false ? Date.now() : task.updatedAt,
      };
      await this.storageManager.updateTask(updatedTask);

      // Track history if requested
      if (options.trackHistory !== false) {
        await this.trackStateChange(stateChangeEvent, transaction);
      }

      // Notify subscribers if requested
      if (options.notifySubscribers !== false) {
        this.notifyStateChangeSubscribers(taskId, stateChangeEvent);
      }

      return true;
    });
  }

  /**
   * Update task metadata
   */
  public async updateTaskMetadata(
    taskId: string,
    metadata: Record<string, any>,
    options: TaskStateUpdateOptions = {},
  ): Promise<boolean> {
    return this.transactionManager.executeInTransaction(async (transaction) => {
      // Get the current task
      const task = await this.storageManager.getTask(taskId, transaction);
      if (!task) {
        throw new Error(`Task with ID ${taskId} not found`);
      }

      // Create a state change event
      const stateChangeEvent: TaskStateChangeEvent = {
        id: uuidv4(),
        taskId,
        timestamp: Date.now(),
        previousState: {
          metadata: task.metadata,
        },
        newState: {
          metadata: { ...task.metadata, ...metadata },
        },
        changeType: "metadata",
        metadata: options.metadata || {},
      };

      // Merge new metadata with existing metadata
      const mergedMetadata = { ...task.metadata, ...metadata };

      // Update the task
      const updatedTask = {
        ...task,
        metadata: mergedMetadata,
        updatedAt:
          options.updateTimestamp !== false ? Date.now() : task.updatedAt,
      };
      await this.storageManager.updateTask(updatedTask);

      // Track history if requested
      if (options.trackHistory !== false) {
        await this.trackStateChange(stateChangeEvent, transaction);
      }

      // Notify subscribers if requested
      if (options.notifySubscribers !== false) {
        this.notifyStateChangeSubscribers(taskId, stateChangeEvent);
      }

      return true;
    });
  }

  /**
   * Take a snapshot of the current task state
   */
  public async createTaskStateSnapshot(
    taskId: string,
    metadata: Record<string, any> = {},
  ): Promise<TaskStateSnapshot> {
    return this.transactionManager.executeInTransaction(async (transaction) => {
      // Get the current task
      const task = await this.storageManager.getTask(taskId, transaction);
      if (!task) {
        throw new Error(`Task with ID ${taskId} not found`);
      }

      // Create the snapshot
      const snapshot: TaskStateSnapshot = {
        id: uuidv4(),
        taskId,
        timestamp: Date.now(),
        status: task.status,
        progress: task.metadata?.progress || 0,
        metadata: {
          ...metadata,
          createdAt: Date.now(),
        },
      };

      // Add to snapshots
      if (!this.stateSnapshots.has(taskId)) {
        this.stateSnapshots.set(taskId, []);
      }

      this.stateSnapshots.get(taskId)!.push(snapshot);

      // Save the snapshot
      await this.saveStateSnapshot(snapshot, transaction);

      return snapshot;
    });
  }

  /**
   * Get the most recent state snapshot for a task
   */
  public async getLatestTaskStateSnapshot(
    taskId: string,
  ): Promise<TaskStateSnapshot | undefined> {
    const snapshots = this.stateSnapshots.get(taskId) || [];
    return snapshots.length > 0
      ? snapshots.sort((a, b) => b.timestamp - a.timestamp)[0]
      : undefined;
  }

  /**
   * Get all state snapshots for a task
   */
  public async getTaskStateHistory(
    taskId: string,
  ): Promise<TaskStateSnapshot[]> {
    return (this.stateSnapshots.get(taskId) || []).sort(
      (a, b) => b.timestamp - a.timestamp,
    );
  }

  /**
   * Get all state change events for a task
   */
  public async getTaskStateChangeHistory(
    taskId: string,
  ): Promise<TaskStateChangeEvent[]> {
    return (this.stateChangeHistory.get(taskId) || []).sort(
      (a, b) => b.timestamp - a.timestamp,
    );
  }

  /**
   * Subscribe to task state changes
   */
  public subscribeToTaskStateChanges(
    options: TaskStateSubscriptionOptions,
    callback: (event: TaskStateChangeEvent) => void,
  ): () => void {
    const subscriptionId = uuidv4();
    const subscription = (event: TaskStateChangeEvent) => {
      // Apply filters
      if (
        options.specificTaskIds &&
        !options.specificTaskIds.includes(event.taskId)
      ) {
        return;
      }

      if (
        event.changeType === "status" &&
        options.includeStatusChanges === false
      ) {
        return;
      }

      if (
        event.changeType === "progress" &&
        options.includeProgressChanges === false
      ) {
        return;
      }

      if (
        event.changeType === "metadata" &&
        options.includeMetadataChanges === false
      ) {
        return;
      }

      // Call the callback if the event passes all filters
      callback(event);
    };

    // Store the subscription
    if (!this.stateSubscriptions.has(subscriptionId)) {
      this.stateSubscriptions.set(subscriptionId, []);
    }

    this.stateSubscriptions.get(subscriptionId)!.push(subscription);

    // Return function to unsubscribe
    return () => {
      const subscriptions = this.stateSubscriptions.get(subscriptionId) || [];
      const index = subscriptions.indexOf(subscription);
      if (index !== -1) {
        subscriptions.splice(index, 1);
      }
    };
  }

  /**
   * Get tasks matching specific state criteria
   */
  public async findTasksByState(
    options: TaskStateQueryOptions,
  ): Promise<Task[]> {
    return this.transactionManager.executeInTransaction(async (transaction) => {
      // This is a simplified implementation
      // In a real system, this would use database queries with proper filtering

      // Get all tasks (inefficient but illustrative)
      const allTasks = await this.storageManager.getAllTasks(transaction);

      // Apply filters
      let filteredTasks = allTasks;

      // Filter by status
      if (options.status) {
        filteredTasks = filteredTasks.filter(
          (task) => task.status === options.status,
        );
      }

      // Filter by progress
      if (options.minProgress !== undefined) {
        filteredTasks = filteredTasks.filter(
          (task) => (task.metadata?.progress || 0) >= options.minProgress!,
        );
      }

      if (options.maxProgress !== undefined) {
        filteredTasks = filteredTasks.filter(
          (task) => (task.metadata?.progress || 0) <= options.maxProgress!,
        );
      }

      // Filter by updatedAt
      if (options.updatedSince) {
        filteredTasks = filteredTasks.filter(
          (task) => task.updatedAt >= options.updatedSince!,
        );
      }

      // Filter by metadata
      if (options.metadataFilter) {
        filteredTasks = filteredTasks.filter((task) => {
          for (const [key, value] of Object.entries(options.metadataFilter!)) {
            if (task.metadata?.[key] !== value) {
              return false;
            }
          }
          return true;
        });
      }

      // Sort
      if (options.sortBy) {
        filteredTasks.sort((a, b) => {
          let aValue: any;
          let bValue: any;

          if (options.sortBy === "progress") {
            aValue = a.metadata?.progress || 0;
            bValue = b.metadata?.progress || 0;
          } else {
            aValue = a[options.sortBy!];
            bValue = b[options.sortBy!];
          }

          return options.sortDirection === "desc"
            ? bValue - aValue
            : aValue - bValue;
        });
      }

      // Apply limit and offset
      if (options.offset !== undefined || options.limit !== undefined) {
        const start = options.offset || 0;
        const end =
          options.limit !== undefined
            ? start + options.limit
            : filteredTasks.length;
        filteredTasks = filteredTasks.slice(start, end);
      }

      return filteredTasks;
    });
  }

  /**
   * Track a state change event
   */
  private async trackStateChange(
    event: TaskStateChangeEvent,
    transaction: Transaction,
  ): Promise<void> {
    // Add to state change history
    if (!this.stateChangeHistory.has(event.taskId)) {
      this.stateChangeHistory.set(event.taskId, []);
    }

    this.stateChangeHistory.get(event.taskId)!.push(event);

    // Save the event
    // In a real system, this would persist to storage
    // await this.storageManager.saveTaskStateChangeEvent(event, transaction);
  }

  /**
   * Save a state snapshot
   */
  private async saveStateSnapshot(
    snapshot: TaskStateSnapshot,
    transaction: Transaction,
  ): Promise<void> {
    // In a real system, this would persist to storage
    // await this.storageManager.saveTaskStateSnapshot(snapshot, transaction);
  }

  /**
   * Notify subscribers of a state change
   */
  private notifyStateChangeSubscribers(
    taskId: string,
    event: TaskStateChangeEvent,
  ): void {
    for (const subscriptions of this.stateSubscriptions.values()) {
      for (const subscription of subscriptions) {
        subscription(event);
      }
    }
  }
}

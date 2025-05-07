/**
 * Task Transition Manager
 *
 * Manages task state transitions with verification and relationship integrity.
 * Ensures that task state changes are valid and contextually appropriate.
 */

import { v4 as uuidv4 } from "uuid";
import { StorageManager } from "../persistence/storage";
import { TransactionManager } from "../persistence/transaction";
import { Task } from "../types";
import { TaskContextManager } from "./context";
import { TaskLifecycleManager } from "./lifecycle";
import { TaskRelationshipManager } from "./relationship";
import { TaskStateManager } from "./state";
import {
  TaskVerificationOptions,
  TaskVerificationResult,
  TaskVerifier,
} from "./verification";

/**
 * Transition result object
 */
export interface TaskTransitionResult {
  success: boolean;
  taskId: string;
  previousStatus: Task["status"];
  newStatus: Task["status"];
  verificationResult?: TaskVerificationResult;
  timestamp: number;
  message?: string;
  transitionId?: string; // Unique identifier for tracking transitions
}

/**
 * Task transition options
 */
export interface TaskTransitionOptions {
  verificationOptions?: TaskVerificationOptions;
  force?: boolean; // If true, forces the transition even if verification fails
  cascadeToChildren?: boolean; // If true, applies similar transitions to children
  preserveContext?: boolean; // If true, ensures context is preserved during transition
  trackHistory?: boolean; // If true, records transition in history
  reason?: string; // Reason for the transition
  initiatedBy?: string; // ID of the agent or component that initiated the transition
}

/**
 * Task transition history entry
 */
export interface TaskTransitionHistoryEntry {
  id: string;
  taskId: string;
  fromStatus: Task["status"];
  toStatus: Task["status"];
  timestamp: number;
  success: boolean;
  reason?: string;
  initiatedBy?: string;
  verificationResult?: TaskVerificationResult;
  metadata: Record<string, any>;
}

/**
 * Task transition manager
 */
export class TaskTransitionManager {
  private verifier: TaskVerifier;
  private relationshipManager: TaskRelationshipManager;
  private lifecycleManager: TaskLifecycleManager;
  private contextManager: TaskContextManager;
  private stateManager?: TaskStateManager;
  private transactionManager: TransactionManager;
  private storageManager: StorageManager;
  private transitionHistory: Map<string, TaskTransitionHistoryEntry[]> =
    new Map();
  private activeTransitions: Map<string, string[]> = new Map(); // taskId -> transitionIds[]

  constructor(
    verifier: TaskVerifier,
    relationshipManager: TaskRelationshipManager,
    lifecycleManager: TaskLifecycleManager,
    contextManager: TaskContextManager,
    transactionManager: TransactionManager,
    stateManager?: TaskStateManager,
  ) {
    this.verifier = verifier;
    this.relationshipManager = relationshipManager;
    this.lifecycleManager = lifecycleManager;
    this.contextManager = contextManager;
    this.stateManager = stateManager;
    this.transactionManager = transactionManager;
    this.storageManager = transactionManager["storageManager"];
  }

  /**
   * Transition a task to a new status with verification
   */
  public async transitionTask(
    taskId: string,
    newStatus: Task["status"],
    options: TaskTransitionOptions = {},
  ): Promise<TaskTransitionResult> {
    return this.transactionManager.executeInTransaction(async (transaction) => {
      // Generate transition ID for tracking
      const transitionId = uuidv4();

      // Get the task
      const task = await this.getTask(taskId);
      if (!task) {
        return {
          success: false,
          taskId,
          previousStatus: "unknown" as Task["status"],
          newStatus,
          timestamp: Date.now(),
          message: `Task with ID ${taskId} not found`,
          transitionId,
        };
      }

      const previousStatus = task.status;

      // Record that this task is undergoing a transition
      this.trackActiveTransition(taskId, transitionId);

      try {
        // No transition needed if status is the same
        if (previousStatus === newStatus) {
          return {
            success: true,
            taskId,
            previousStatus,
            newStatus,
            timestamp: Date.now(),
            message: `Task already in ${newStatus} status`,
            transitionId,
          };
        }

        // Verify transition is valid
        if (!options.force) {
          const verificationResult = await this.verifier.verifyTaskTransition(
            task,
            newStatus,
            options.verificationOptions,
          );

          if (!verificationResult.verified) {
            // Record transition history
            if (options.trackHistory !== false) {
              await this.recordTransitionHistory({
                id: transitionId,
                taskId,
                fromStatus: previousStatus,
                toStatus: newStatus,
                timestamp: Date.now(),
                success: false,
                reason: options.reason,
                initiatedBy: options.initiatedBy,
                verificationResult,
                metadata: {},
              });
            }

            return {
              success: false,
              taskId,
              previousStatus,
              newStatus,
              verificationResult,
              timestamp: Date.now(),
              message: `Transition verification failed: ${verificationResult.errors.join(", ")}`,
              transitionId,
            };
          }
        }

        // Trigger appropriate pre-lifecycle hooks
        await this.triggerPreLifecycleHooks(task, newStatus);

        // Update task status
        await this.updateTaskStatus(task, newStatus, transaction);

        // Also update status using state manager if available
        if (this.stateManager) {
          await this.stateManager.updateTaskStatus(taskId, newStatus, {
            metadata: {
              transitionId,
              reason: options.reason,
              initiatedBy: options.initiatedBy,
            },
            trackHistory: options.trackHistory,
          });
        }

        // Handle child tasks if cascading is enabled
        if (options.cascadeToChildren) {
          await this.cascadeTransitionToChildren(task, newStatus, options);
        }

        // Preserve context if requested
        if (options.preserveContext !== false) {
          await this.preserveTaskContext(task);
        }

        // Trigger appropriate post-lifecycle hooks
        await this.triggerPostLifecycleHooks(task, newStatus);

        // Record transition history
        if (options.trackHistory !== false) {
          await this.recordTransitionHistory({
            id: transitionId,
            taskId,
            fromStatus: previousStatus,
            toStatus: newStatus,
            timestamp: Date.now(),
            success: true,
            reason: options.reason,
            initiatedBy: options.initiatedBy,
            metadata: {},
          });
        }

        return {
          success: true,
          taskId,
          previousStatus,
          newStatus,
          timestamp: Date.now(),
          message: `Successfully transitioned task from ${previousStatus} to ${newStatus}`,
          transitionId,
        };
      } finally {
        // Remove from active transitions
        this.removeActiveTransition(taskId, transitionId);
      }
    });
  }

  /**
   * Start a task (transition from planned to in_progress)
   */
  public async startTask(
    taskId: string,
    options: TaskTransitionOptions = {},
  ): Promise<TaskTransitionResult> {
    return this.transitionTask(taskId, "in_progress", {
      ...options,
      reason: options.reason || "Task started",
    });
  }

  /**
   * Complete a task (transition from in_progress to completed)
   */
  public async completeTask(
    taskId: string,
    options: TaskTransitionOptions = {},
  ): Promise<TaskTransitionResult> {
    return this.transitionTask(taskId, "completed", {
      ...options,
      reason: options.reason || "Task completed",
    });
  }

  /**
   * Cancel a task (transition to cancelled from any state)
   */
  public async cancelTask(
    taskId: string,
    options: TaskTransitionOptions = {},
  ): Promise<TaskTransitionResult> {
    return this.transitionTask(taskId, "cancelled", {
      ...options,
      reason: options.reason || "Task cancelled",
    });
  }

  /**
   * Restart a task (transition from completed/cancelled to in_progress)
   */
  public async restartTask(
    taskId: string,
    options: TaskTransitionOptions = {},
  ): Promise<TaskTransitionResult> {
    // Restarting requires force option since it's normally not allowed
    return this.transitionTask(taskId, "in_progress", {
      ...options,
      force: true,
      reason: options.reason || "Task restarted",
    });
  }

  /**
   * Transition between tasks with boundary verification
   */
  public async transitionBetweenTasks(
    currentTaskId: string | null,
    nextTaskId: string,
    options: TaskTransitionOptions = {},
  ): Promise<TaskTransitionResult> {
    return this.transactionManager.executeInTransaction(async (transaction) => {
      // Generate transition ID for tracking
      const transitionId = uuidv4();

      let currentTask: Task | null = null;

      // Get current task if provided
      if (currentTaskId) {
        const taskResult = await this.getTask(currentTaskId);
        if (!taskResult) {
          return {
            success: false,
            taskId: nextTaskId,
            previousStatus: "unknown" as Task["status"],
            newStatus: "unknown" as Task["status"],
            timestamp: Date.now(),
            message: `Current task with ID ${currentTaskId} not found`,
            transitionId,
          };
        }
        currentTask = taskResult;

        // Track active transition for current task
        this.trackActiveTransition(currentTaskId, transitionId);
      }

      try {
        // Get next task
        const nextTask = await this.getTask(nextTaskId);
        if (!nextTask) {
          return {
            success: false,
            taskId: nextTaskId,
            previousStatus: "unknown" as Task["status"],
            newStatus: "unknown" as Task["status"],
            timestamp: Date.now(),
            message: `Next task with ID ${nextTaskId} not found`,
            transitionId,
          };
        }

        // Track active transition for next task
        this.trackActiveTransition(nextTaskId, transitionId);

        // Verify boundary transition
        if (!options.force) {
          const verificationResult = await this.verifier.verifyTaskBoundary(
            currentTask,
            nextTask,
            options.verificationOptions,
          );

          if (!verificationResult.verified) {
            // Record transition history
            if (options.trackHistory !== false && currentTaskId) {
              await this.recordTaskBoundaryTransition(
                currentTaskId,
                nextTaskId,
                false,
                options,
                verificationResult,
                transitionId,
              );
            }

            return {
              success: false,
              taskId: nextTaskId,
              previousStatus:
                currentTask?.status || ("unknown" as Task["status"]),
              newStatus: nextTask.status,
              verificationResult,
              timestamp: Date.now(),
              message: `Task boundary verification failed: ${verificationResult.errors.join(", ")}`,
              transitionId,
            };
          }
        }

        // If current task is in progress, pause it
        if (currentTask && currentTask.status === "in_progress") {
          await this.pauseTask(currentTask.id, transaction);
        }

        // Start next task if it's planned
        if (nextTask.status === "planned") {
          await this.updateTaskStatus(nextTask, "in_progress", transaction);

          // Also update using state manager if available
          if (this.stateManager) {
            await this.stateManager.updateTaskStatus(
              nextTaskId,
              "in_progress",
              {
                metadata: {
                  transitionId,
                  reason:
                    options.reason || "Task started via boundary transition",
                  initiatedBy: options.initiatedBy,
                  previousTaskId: currentTaskId,
                },
                trackHistory: options.trackHistory,
              },
            );
          }
        }

        // Transfer context between tasks if requested
        if (options.preserveContext !== false && currentTask) {
          await this.transferTaskContext(currentTask, nextTask);
        }

        // Record boundary transition
        if (options.trackHistory !== false && currentTaskId) {
          await this.recordTaskBoundaryTransition(
            currentTaskId,
            nextTaskId,
            true,
            options,
            undefined,
            transitionId,
          );
        }

        return {
          success: true,
          taskId: nextTaskId,
          previousStatus: currentTask?.status || ("unknown" as Task["status"]),
          newStatus: nextTask.status,
          timestamp: Date.now(),
          message: `Successfully transitioned from task ${currentTaskId || "none"} to ${nextTaskId}`,
          transitionId,
        };
      } finally {
        // Remove from active transitions
        if (currentTaskId) {
          this.removeActiveTransition(currentTaskId, transitionId);
        }
        this.removeActiveTransition(nextTaskId, transitionId);
      }
    });
  }

  /**
   * Handle batch transitions
   */
  public async batchTransition(
    taskIds: string[],
    newStatus: Task["status"],
    options: TaskTransitionOptions = {},
  ): Promise<TaskTransitionResult[]> {
    const results: TaskTransitionResult[] = [];

    // Process each task
    for (const taskId of taskIds) {
      try {
        const result = await this.transitionTask(taskId, newStatus, options);
        results.push(result);
      } catch (error: any) {
        results.push({
          success: false,
          taskId,
          previousStatus: "unknown" as Task["status"],
          newStatus,
          timestamp: Date.now(),
          message: `Error during transition: ${error.message}`,
        });
      }
    }

    return results;
  }

  /**
   * Get recommendations for next possible transitions
   */
  public async getTransitionRecommendations(
    taskId: string,
  ): Promise<{ nextStates: Task["status"][]; recommendations: string[] }> {
    const task = await this.getTask(taskId);
    if (!task) {
      throw new Error(`Task with ID ${taskId} not found`);
    }

    // Get possible next states
    const nextStates = this.getPossibleNextStates(task.status);

    // Get child tasks
    const childTasks = await this.relationshipManager.getChildTasks(task.id);
    const incompleteChildren = childTasks.filter(
      (childTask) =>
        childTask.status !== "completed" && childTask.status !== "cancelled",
    );

    // Generate recommendations
    const recommendations: string[] = [];

    // For a planned task, can start
    if (task.status === "planned") {
      recommendations.push("Task can be started");
    }

    // For an in-progress task, can complete if children are done
    if (task.status === "in_progress") {
      if (incompleteChildren.length === 0) {
        recommendations.push("Task can be completed");
      } else {
        recommendations.push(
          `Task has ${incompleteChildren.length} incomplete child tasks that should be completed first`,
        );
      }
    }

    // Task can always be cancelled
    if (task.status !== "cancelled") {
      recommendations.push(
        "Task can be cancelled" +
          (incompleteChildren.length > 0
            ? ` (${incompleteChildren.length} child tasks will be affected)`
            : ""),
      );
    }

    // Check parent task
    if (task.parentId) {
      const parentTask = await this.relationshipManager.getParentTask(task.id);
      if (parentTask) {
        if (parentTask.status === "completed" && task.status !== "completed") {
          recommendations.push(
            "Parent task is already completed. Consider completing or cancelling this task.",
          );
        } else if (
          parentTask.status !== "in_progress" &&
          task.status === "in_progress"
        ) {
          recommendations.push(
            "Parent task is not in progress. This may cause context inconsistency.",
          );
        }
      }
    }

    return {
      nextStates,
      recommendations,
    };
  }

  /**
   * Get transition history for a task
   */
  public async getTaskTransitionHistory(
    taskId: string,
  ): Promise<TaskTransitionHistoryEntry[]> {
    return this.transitionHistory.get(taskId) || [];
  }

  /**
   * Get all active transitions
   */
  public getActiveTransitions(): { taskId: string; transitionIds: string[] }[] {
    return Array.from(this.activeTransitions.entries()).map(
      ([taskId, transitionIds]) => ({
        taskId,
        transitionIds,
      }),
    );
  }

  /**
   * Check if a task has active transitions
   */
  public isTaskInTransition(taskId: string): boolean {
    const transitions = this.activeTransitions.get(taskId) || [];
    return transitions.length > 0;
  }

  /**
   * Pause a task (internal method)
   */
  private async pauseTask(taskId: string, transaction?: any): Promise<void> {
    const task = await this.getTask(taskId);
    if (!task) {
      throw new Error(`Task with ID ${taskId} not found`);
    }

    // Only pause if task is in_progress
    if (task.status !== "in_progress") {
      return;
    }

    // Store current context before pausing
    await this.contextManager.captureTaskContext(task);

    // Add metadata to indicate this task is paused
    task.metadata = {
      ...task.metadata,
      paused: true,
      pausedAt: Date.now(),
    };

    // Update the task
    task.updatedAt = Date.now();
    await this.storageManager.updateTask(task, transaction);

    // Update using state manager if available
    if (this.stateManager) {
      await this.stateManager.updateTaskMetadata(taskId, {
        paused: true,
        pausedAt: Date.now(),
      });
    }
  }

  /**
   * Handle pre-lifecycle hooks based on transition
   */
  private async triggerPreLifecycleHooks(
    task: Task,
    newStatus: Task["status"],
  ): Promise<void> {
    if (task.status === "planned" && newStatus === "in_progress") {
      await this.lifecycleManager.triggerPreStartHook(task.id);
    } else if (task.status === "in_progress" && newStatus === "completed") {
      await this.lifecycleManager.triggerPreCompleteHook(task.id);
    } else if (newStatus === "cancelled") {
      await this.lifecycleManager.triggerPreCancelHook(task.id);
    }
  }

  /**
   * Handle post-lifecycle hooks based on transition
   */
  private async triggerPostLifecycleHooks(
    task: Task,
    newStatus: Task["status"],
  ): Promise<void> {
    if (task.status === "planned" && newStatus === "in_progress") {
      // Re-fetch the task with the new status
      const updatedTask = await this.getTask(task.id);
      if (updatedTask) {
        await this.lifecycleManager.triggerPostStartHook(updatedTask);
      }
    } else if (task.status === "in_progress" && newStatus === "completed") {
      // Re-fetch the task with the new status
      const updatedTask = await this.getTask(task.id);
      if (updatedTask) {
        await this.lifecycleManager.triggerPostCompleteHook(updatedTask);
      }
    } else if (newStatus === "cancelled") {
      // Re-fetch the task with the new status
      const updatedTask = await this.getTask(task.id);
      if (updatedTask) {
        await this.lifecycleManager.triggerPostCancelHook(updatedTask);
      }
    }
  }

  /**
   * Update task status and trigger post-hooks
   */
  private async updateTaskStatus(
    task: Task,
    newStatus: Task["status"],
    transaction?: any,
  ): Promise<void> {
    const previousStatus = task.status;

    // Update the task status
    task.status = newStatus;
    task.updatedAt = Date.now();

    // Set completedAt if task is being completed
    if (newStatus === "completed" && !task.completedAt) {
      task.completedAt = Date.now();
    }

    // Persist the updated task to storage
    await this.storageManager.updateTask(task, transaction);
  }

  /**
   * Cascade status change to child tasks
   */
  private async cascadeTransitionToChildren(
    parentTask: Task,
    newStatus: Task["status"],
    options: TaskTransitionOptions,
  ): Promise<void> {
    // Get all child tasks
    const childTasks = await this.relationshipManager.getChildTasks(
      parentTask.id,
    );

    // Apply the same transition to all child tasks
    for (const childTask of childTasks) {
      // Skip if child is already in the target status
      if (childTask.status === newStatus) {
        continue;
      }

      // Apply cascaded options
      const childOptions: TaskTransitionOptions = {
        ...options,
        cascadeToChildren: true, // Continue cascading down the hierarchy
        reason:
          (options.reason || "Cascaded from parent") +
          ` (parent: ${parentTask.id})`,
        initiatedBy: options.initiatedBy,
      };

      await this.transitionTask(childTask.id, newStatus, childOptions);
    }
  }

  /**
   * Preserve task context during status changes
   */
  private async preserveTaskContext(task: Task): Promise<void> {
    // Use the context manager to capture the current task context
    await this.contextManager.captureTaskContext(task, {
      captureEnvironment: true,
      captureCodeState: true,
      captureTaskState: true,
      deepCopy: true, // Create a deep copy to ensure we have a snapshot
    });
  }

  /**
   * Transfer context between tasks
   */
  private async transferTaskContext(
    fromTask: Task,
    toTask: Task,
  ): Promise<void> {
    // Transfer context from one task to another using the context manager
    await this.contextManager.transferContext(fromTask.id, toTask.id, {
      mergeStrategy: "merge",
      preserveHistory: true,
      deepCopy: true,
    });
  }

  /**
   * Get the possible next states for a given task status
   */
  private getPossibleNextStates(
    currentStatus: Task["status"],
  ): Task["status"][] {
    switch (currentStatus) {
      case "planned":
        return ["in_progress", "cancelled"];
      case "in_progress":
        return ["completed", "cancelled"];
      case "completed":
        return ["cancelled"]; // Completed tasks should generally stay completed
      case "cancelled":
        return ["planned"]; // Cancelled tasks can be restarted by going back to planned
      default:
        return [];
    }
  }

  /**
   * Get a task by ID
   * Uses the storage manager to retrieve the task
   */
  private async getTask(taskId: string): Promise<Task | null> {
    return this.transactionManager.executeInTransaction(async (transaction) => {
      return await this.storageManager.getTask(taskId, transaction);
    });
  }

  /**
   * Track an active transition
   */
  private trackActiveTransition(taskId: string, transitionId: string): void {
    if (!this.activeTransitions.has(taskId)) {
      this.activeTransitions.set(taskId, []);
    }
    this.activeTransitions.get(taskId)!.push(transitionId);
  }

  /**
   * Remove an active transition
   */
  private removeActiveTransition(taskId: string, transitionId: string): void {
    const transitions = this.activeTransitions.get(taskId) || [];
    const index = transitions.indexOf(transitionId);
    if (index !== -1) {
      transitions.splice(index, 1);
    }
    if (transitions.length === 0) {
      this.activeTransitions.delete(taskId);
    }
  }

  /**
   * Record a transition in history
   */
  private async recordTransitionHistory(
    entry: TaskTransitionHistoryEntry,
  ): Promise<void> {
    if (!this.transitionHistory.has(entry.taskId)) {
      this.transitionHistory.set(entry.taskId, []);
    }

    this.transitionHistory.get(entry.taskId)!.push(entry);

    // In a real implementation, would persist to storage
    // await this.storageManager.saveTransitionHistoryEntry(entry);
  }

  /**
   * Record a task boundary transition in history
   */
  private async recordTaskBoundaryTransition(
    fromTaskId: string,
    toTaskId: string,
    success: boolean,
    options: TaskTransitionOptions,
    verificationResult?: TaskVerificationResult,
    transitionId?: string,
  ): Promise<void> {
    const fromTask = await this.getTask(fromTaskId);
    const toTask = await this.getTask(toTaskId);

    if (!fromTask || !toTask) {
      return;
    }

    // Record in the from-task history
    await this.recordTransitionHistory({
      id: transitionId || uuidv4(),
      taskId: fromTaskId,
      fromStatus: fromTask.status,
      toStatus: fromTask.status, // Status doesn't change in boundary transition
      timestamp: Date.now(),
      success,
      reason: options.reason || `Switching to task: ${toTaskId}`,
      initiatedBy: options.initiatedBy,
      verificationResult,
      metadata: {
        boundaryTransition: true,
        toTaskId,
      },
    });

    // Record in the to-task history
    await this.recordTransitionHistory({
      id: transitionId || uuidv4(),
      taskId: toTaskId,
      fromStatus: toTask.status,
      toStatus: toTask.status, // Status might not change
      timestamp: Date.now(),
      success,
      reason: options.reason || `Switching from task: ${fromTaskId}`,
      initiatedBy: options.initiatedBy,
      verificationResult,
      metadata: {
        boundaryTransition: true,
        fromTaskId,
      },
    });
  }
}

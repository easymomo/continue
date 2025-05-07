/**
 * Task Management System
 *
 * Provides a comprehensive task management system.
 * Integrates task verification, relationships, transitions, and context management.
 */

import { TransactionManager } from "../persistence/transaction";
import { Task } from "../types";
import {
  ContextTransferOptions,
  TaskContextManager,
  TaskContextOptions,
} from "./context";
import { TaskLifecycleManager } from "./lifecycle";
import { TaskRelationshipManager } from "./relationship";
import { TaskStateManager } from "./state";
import { TaskTransitionManager, TaskTransitionOptions } from "./transition";
import { TaskVerificationOptions, TaskVerifier } from "./verification";

/**
 * Integrated task manager options
 */
export interface TaskManagerOptions {
  verificationOptions?: TaskVerificationOptions;
  transitionOptions?: TaskTransitionOptions;
  contextOptions?: TaskContextOptions;
}

/**
 * Integrated task manager
 */
export class TaskManager {
  private verifier: TaskVerifier;
  private relationshipManager: TaskRelationshipManager;
  private transitionManager: TaskTransitionManager;
  private contextManager: TaskContextManager;
  private stateManager: TaskStateManager;
  private lifecycleManager: TaskLifecycleManager;
  private transactionManager: TransactionManager;

  constructor(transactionManager: TransactionManager) {
    // Store transaction manager
    this.transactionManager = transactionManager;

    // Initialize all components
    this.lifecycleManager = new TaskLifecycleManager();
    this.verifier = new TaskVerifier(this.lifecycleManager);
    this.relationshipManager = new TaskRelationshipManager(transactionManager);
    this.contextManager = new TaskContextManager();
    this.stateManager = new TaskStateManager(transactionManager);
    this.transitionManager = new TaskTransitionManager(
      this.verifier,
      this.relationshipManager,
      this.lifecycleManager,
      this.contextManager,
      this.transactionManager,
      this.stateManager,
    );

    // Register default lifecycle hooks that handle context preservation
    this.registerDefaultLifecycleHooks();
  }

  /**
   * Create a new task
   */
  public async createTask(
    taskData: any,
    options?: TaskManagerOptions,
  ): Promise<string> {
    // Verify task creation
    const verificationResult = await this.verifier.verifyTaskCreation(
      taskData,
      options?.verificationOptions,
    );

    if (!verificationResult.verified) {
      throw new Error(
        `Task creation verification failed: ${verificationResult.errors.join(", ")}`,
      );
    }

    // Use relationship manager to create the task
    const taskId = await this.relationshipManager.createChildTask(
      taskData.parentId || "root",
      taskData,
    );

    // Capture initial context
    await this.contextManager.captureTaskContext(
      await this.getTask(taskId),
      options?.contextOptions,
    );

    // Trigger lifecycle hooks
    await this.lifecycleManager.triggerPostCreateHook(
      await this.getTask(taskId),
    );

    return taskId;
  }

  /**
   * Create a child task
   */
  public async createChildTask(
    parentId: string,
    taskData: any,
    options?: TaskManagerOptions,
  ): Promise<string> {
    // Add parent ID to task data
    const childTaskData = {
      ...taskData,
      parentId,
    };

    return this.createTask(childTaskData, options);
  }

  /**
   * Start a task
   */
  public async startTask(
    taskId: string,
    options?: TaskManagerOptions,
  ): Promise<boolean> {
    const result = await this.transitionManager.startTask(
      taskId,
      options?.transitionOptions,
    );

    if (!result.success) {
      throw new Error(`Failed to start task: ${result.message}`);
    }

    // Capture context when starting
    await this.contextManager.captureTaskContext(
      await this.getTask(taskId),
      options?.contextOptions,
    );

    return true;
  }

  /**
   * Complete a task
   */
  public async completeTask(
    taskId: string,
    options?: TaskManagerOptions,
  ): Promise<boolean> {
    const result = await this.transitionManager.completeTask(
      taskId,
      options?.transitionOptions,
    );

    if (!result.success) {
      throw new Error(`Failed to complete task: ${result.message}`);
    }

    // Capture final context when completing
    await this.contextManager.captureTaskContext(
      await this.getTask(taskId),
      options?.contextOptions,
    );

    return true;
  }

  /**
   * Cancel a task
   */
  public async cancelTask(
    taskId: string,
    options?: TaskManagerOptions,
  ): Promise<boolean> {
    const result = await this.transitionManager.cancelTask(
      taskId,
      options?.transitionOptions,
    );

    if (!result.success) {
      throw new Error(`Failed to cancel task: ${result.message}`);
    }

    return true;
  }

  /**
   * Switch between tasks
   */
  public async switchTasks(
    fromTaskId: string | null,
    toTaskId: string,
    options?: TaskManagerOptions & { transferContext?: boolean },
  ): Promise<boolean> {
    // Transition between tasks
    const result = await this.transitionManager.transitionBetweenTasks(
      fromTaskId,
      toTaskId,
      options?.transitionOptions,
    );

    if (!result.success) {
      throw new Error(`Failed to switch tasks: ${result.message}`);
    }

    // Transfer context if requested
    if (options?.transferContext && fromTaskId) {
      await this.contextManager.transferContext(fromTaskId, toTaskId, {
        mergeStrategy: "merge",
        preserveHistory: true,
        ...options.contextOptions,
      } as ContextTransferOptions);
    }

    return true;
  }

  /**
   * Get a task
   */
  public async getTask(taskId: string): Promise<Task> {
    return this.transactionManager.executeInTransaction(async (transaction) => {
      // Get the task from the storage via relationship manager
      const task = await this.relationshipManager["storageManager"].getTask(
        taskId,
        transaction,
      );

      if (!task) {
        throw new Error(`Task with ID ${taskId} not found`);
      }

      return task;
    });
  }

  /**
   * Get child tasks
   */
  public async getChildTasks(taskId: string): Promise<Task[]> {
    return this.relationshipManager.getChildTasks(taskId);
  }

  /**
   * Get parent task
   */
  public async getParentTask(taskId: string): Promise<Task | undefined> {
    return this.relationshipManager.getParentTask(taskId);
  }

  /**
   * Get task lineage (ancestors)
   */
  public async getTaskLineage(taskId: string): Promise<Task[]> {
    return this.relationshipManager.getTaskLineage(taskId);
  }

  /**
   * Verify if a task operation is valid
   */
  public async verifyTask(
    task: Task,
    operation: "create" | "transition" | "boundary",
    options?: { newStatus?: Task["status"]; nextTask?: Task },
  ): Promise<boolean> {
    if (operation === "create") {
      const result = await this.verifier.verifyTaskCreation(task);
      return result.verified;
    } else if (operation === "transition" && options?.newStatus) {
      const result = await this.verifier.verifyTaskTransition(
        task,
        options.newStatus,
      );
      return result.verified;
    } else if (operation === "boundary" && options?.nextTask) {
      const result = await this.verifier.verifyTaskBoundary(
        task,
        options.nextTask,
      );
      return result.verified;
    }

    return false;
  }

  /**
   * Get task context
   */
  public async getTaskContext(taskId: string): Promise<any> {
    return this.contextManager.getTaskContext(taskId);
  }

  /**
   * Compare task contexts
   */
  public async compareTaskContexts(
    taskId1: string,
    taskId2: string,
  ): Promise<any> {
    return this.contextManager.getContextDiff(taskId1, taskId2);
  }

  /**
   * Update task progress
   */
  public async updateTaskProgress(
    taskId: string,
    progress: number,
    options?: { incrementProgress?: boolean },
  ): Promise<boolean> {
    return this.stateManager.updateTaskProgress(taskId, progress, {
      incrementProgress: options?.incrementProgress,
      notifySubscribers: true,
      trackHistory: true,
    });
  }

  /**
   * Update task metadata
   */
  public async updateTaskMetadata(
    taskId: string,
    metadata: Record<string, any>,
  ): Promise<boolean> {
    return this.stateManager.updateTaskMetadata(taskId, metadata, {
      notifySubscribers: true,
      trackHistory: true,
    });
  }

  /**
   * Get task state history
   */
  public async getTaskStateHistory(taskId: string): Promise<any> {
    return this.stateManager.getTaskStateHistory(taskId);
  }

  /**
   * Find tasks by state
   */
  public async findTasksByState(options: any): Promise<Task[]> {
    return this.stateManager.findTasksByState(options);
  }

  /**
   * Get task transition history
   */
  public async getTaskTransitionHistory(taskId: string): Promise<any> {
    return this.transitionManager.getTaskTransitionHistory(taskId);
  }

  /**
   * Restart a task (returning it to in_progress from completed/cancelled)
   */
  public async restartTask(
    taskId: string,
    options?: TaskManagerOptions,
  ): Promise<boolean> {
    const result = await this.transitionManager.restartTask(
      taskId,
      options?.transitionOptions,
    );

    if (!result.success) {
      throw new Error(`Failed to restart task: ${result.message}`);
    }

    return true;
  }

  /**
   * Get transition recommendations for a task
   */
  public async getTransitionRecommendations(
    taskId: string,
  ): Promise<{ nextStates: Task["status"][]; recommendations: string[] }> {
    return this.transitionManager.getTransitionRecommendations(taskId);
  }

  /**
   * Check if a task is currently in transition
   */
  public isTaskInTransition(taskId: string): boolean {
    return this.transitionManager.isTaskInTransition(taskId);
  }

  /**
   * Register default lifecycle hooks
   */
  private registerDefaultLifecycleHooks(): void {
    // Register a post-start hook for capturing context
    this.lifecycleManager.registerPostStartHook(async (task) => {
      await this.contextManager.captureTaskContext(task);
    });

    // Register a pre-complete hook for validating context
    this.lifecycleManager.registerPreCompleteHook(async (taskId) => {
      await this.contextManager.validateTaskContext(taskId);
    });

    // Register a post-complete hook for preserving context
    this.lifecycleManager.registerPostCompleteHook(async (task) => {
      await this.contextManager.captureTaskContext(task);
    });
  }
}

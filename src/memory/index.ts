/**
 * Enhanced Task System
 *
 * This module provides a complete task system implementation with transaction-based
 * persistence, task tracking, plan-centric architecture, and context preservation.
 * It serves as the foundation for maintaining perfect context across the entire
 * agent system.
 */

import { ContinuityMarkerManager } from "./context/continuity";
import { DependencyGraphManager } from "./context/dependencies";
import { ContextRebuildingProtocol } from "./context/rebuilding";
import { ContextValidator } from "./context/validation";
import { RecoveryManager } from "./persistence/recovery";
import { StorageManager } from "./persistence/storage";
import { TransactionManager } from "./persistence/transaction";
import { PlanConsistencyEnforcer } from "./plan/consistency";
import { PlanTaskManager } from "./plan/model";
import { PlanModificationTracker } from "./plan/modification";
import { SharedMemory } from "./shared";
import { TaskLifecycleManager } from "./tasks/lifecycle";
import { TaskRelationshipManager } from "./tasks/relationship";
import { TaskStack } from "./tasks/stack";
import { TaskBoundaryVerifier } from "./tasks/verification";
import { TaskSystemConfig } from "./types";

/**
 * Main Task System class that serves as the entry point for the memory system
 */
export class TaskSystem {
  private static instance: TaskSystem;
  private initialized: boolean = false;

  // Component references
  private sharedMemory: SharedMemory;
  private transactionManager: TransactionManager;
  private storageManager: StorageManager;
  private recoveryManager: RecoveryManager;
  private planTaskManager: PlanTaskManager;
  private planConsistencyEnforcer: PlanConsistencyEnforcer;
  private planModificationTracker: PlanModificationTracker;
  private taskStack: TaskStack;
  private taskRelationshipManager: TaskRelationshipManager;
  private taskLifecycleManager: TaskLifecycleManager;
  private taskBoundaryVerifier: TaskBoundaryVerifier;
  private contextRebuildingProtocol: ContextRebuildingProtocol;
  private contextValidator: ContextValidator;
  private continuityMarkerManager: ContinuityMarkerManager;
  private dependencyGraphManager: DependencyGraphManager;

  private constructor(private config: TaskSystemConfig) {
    this.sharedMemory = SharedMemory.getInstance();
  }

  /**
   * Get the singleton instance of the task system
   */
  public static getInstance(config?: TaskSystemConfig): TaskSystem {
    if (!TaskSystem.instance) {
      if (!config) {
        throw new Error("TaskSystem requires configuration for initialization");
      }
      TaskSystem.instance = new TaskSystem(config);
    }
    return TaskSystem.instance;
  }

  /**
   * Initialize the task system
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Initialize persistence layer
    this.storageManager = new StorageManager(this.config.storage);
    await this.storageManager.initialize();

    this.transactionManager = new TransactionManager(this.storageManager);

    this.recoveryManager = new RecoveryManager(
      this.storageManager,
      this.config.recovery,
    );
    // Try to recover from any previous interruption
    await this.recoveryManager.autoRecover();

    // Initialize plan management
    this.planTaskManager = new PlanTaskManager(this.transactionManager);
    this.planConsistencyEnforcer = new PlanConsistencyEnforcer(
      this.planTaskManager,
    );
    this.planModificationTracker = new PlanModificationTracker(
      this.transactionManager,
    );

    // Initialize task management
    this.taskStack = new TaskStack(this.transactionManager);
    this.taskRelationshipManager = new TaskRelationshipManager(
      this.transactionManager,
    );
    this.taskLifecycleManager = new TaskLifecycleManager();
    this.taskBoundaryVerifier = new TaskBoundaryVerifier(
      this.contextValidator,
      this.planConsistencyEnforcer,
    );

    // Initialize context management
    this.contextRebuildingProtocol = new ContextRebuildingProtocol(
      this.transactionManager,
      this.config.context,
    );
    this.contextValidator = new ContextValidator();
    this.continuityMarkerManager = new ContinuityMarkerManager(
      this.transactionManager,
    );
    this.dependencyGraphManager = new DependencyGraphManager(
      this.transactionManager,
    );

    // Register cross-component hooks
    this.registerLifecycleHooks();

    this.initialized = true;
  }

  /**
   * Register lifecycle hooks between components
   */
  private registerLifecycleHooks(): void {
    // Register task lifecycle hooks
    this.taskLifecycleManager.registerPreStartHook(async (taskId) => {
      // Verify task can be started according to plan
      const result =
        await this.planConsistencyEnforcer.canTaskBeStarted(taskId);
      if (!result.allowed) {
        throw new Error(`Cannot start task: ${result.reason}`);
      }
    });

    this.taskLifecycleManager.registerPostStartHook(async (task) => {
      // Push task to stack
      await this.taskStack.push(task.id);

      // Build context for task
      await this.contextRebuildingProtocol.rebuildContext(task.id);
    });

    this.taskLifecycleManager.registerPreCompleteHook(async (taskId) => {
      // Verify task boundaries before completion
      const result =
        await this.taskBoundaryVerifier.verifyTaskCompletion(taskId);
      if (!result.valid) {
        throw new Error(`Cannot complete task: ${result.reason}`);
      }
    });

    this.taskLifecycleManager.registerPostCompleteHook(async (task) => {
      // Pop task from stack if it's at the top
      const currentTaskId = await this.taskStack.peek();
      if (currentTaskId === task.id) {
        await this.taskStack.pop();

        // If there's a parent task, rebuild its context
        const parentTask = await this.taskRelationshipManager.getParentTask(
          task.id,
        );
        if (parentTask) {
          await this.contextRebuildingProtocol.rebuildContext(parentTask.id);
        }
      }
    });
  }

  // Public API methods

  /**
   * Get the current active task
   */
  public async getActiveTask() {
    const taskId = await this.taskStack.peek();
    if (!taskId) {
      return null;
    }

    return this.transactionManager.executeInTransaction(async (transaction) => {
      return await this.storageManager.getTask(taskId, transaction);
    });
  }

  /**
   * Create a new task
   */
  public async createTask(taskData, parentTaskId = null) {
    return this.transactionManager.executeInTransaction(async (transaction) => {
      let taskId;

      if (parentTaskId) {
        taskId = await this.taskRelationshipManager.createChildTask(
          parentTaskId,
          taskData,
        );
      } else {
        taskId = await this.storageManager.createTask(taskData, transaction);
      }

      return taskId;
    });
  }

  /**
   * Start a task, making it the active task
   */
  public async startTask(taskId) {
    // First verify the task can be started
    await this.taskLifecycleManager.triggerPreStartHook(taskId);

    return this.transactionManager.executeInTransaction(async (transaction) => {
      const task = await this.storageManager.getTask(taskId, transaction);

      // Update task status
      task.status = "in_progress";
      task.updatedAt = Date.now();
      await this.storageManager.updateTask(task, transaction);

      // Trigger post-start hooks
      await this.taskLifecycleManager.triggerPostStartHook(task);

      return task;
    });
  }

  /**
   * Complete the active task
   */
  public async completeActiveTask() {
    const taskId = await this.taskStack.peek();
    if (!taskId) {
      throw new Error("No active task to complete");
    }

    return this.completeTask(taskId);
  }

  /**
   * Complete a specific task
   */
  public async completeTask(taskId) {
    // Verify task can be completed
    await this.taskLifecycleManager.triggerPreCompleteHook(taskId);

    return this.transactionManager.executeInTransaction(async (transaction) => {
      const task = await this.storageManager.getTask(taskId, transaction);

      // Update task status
      task.status = "completed";
      task.updatedAt = Date.now();
      task.completedAt = Date.now();
      await this.storageManager.updateTask(task, transaction);

      // Trigger post-complete hooks
      await this.taskLifecycleManager.triggerPostCompleteHook(task);

      return task;
    });
  }

  /**
   * Rebuild the context for the current active task
   */
  public async rebuildActiveContext() {
    const taskId = await this.taskStack.peek();
    if (!taskId) {
      throw new Error("No active task for context rebuilding");
    }

    return this.contextRebuildingProtocol.rebuildContext(taskId);
  }

  /**
   * Get a view of the current dependency graph
   */
  public async visualizeDependencies(rootId = null) {
    if (!rootId) {
      const activeTask = await this.getActiveTask();
      if (activeTask) {
        rootId = activeTask.id;
      } else {
        throw new Error("No active task for dependency visualization");
      }
    }

    return this.dependencyGraphManager.visualizeDependencies(rootId);
  }
}

// Export all components
export * from "./context/continuity";
export * from "./context/dependencies";
export * from "./context/rebuilding";
export * from "./context/validation";
export * from "./persistence/recovery";
export * from "./persistence/storage";
export * from "./persistence/transaction";
export * from "./plan/consistency";
export * from "./plan/model";
export * from "./plan/modification";
export * from "./shared";
export * from "./tasks/lifecycle";
export * from "./tasks/relationship";
export * from "./tasks/stack";
export * from "./tasks/transition";
export * from "./tasks/verification";
export * from "./types";

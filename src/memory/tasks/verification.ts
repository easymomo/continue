/**
 * Task Verification System
 *
 * Handles verification of task boundaries and validates task transitions.
 * Ensures proper context preservation during task transitions.
 */

import { ContextValidator } from "../context/validation";
import { PlanConsistencyEnforcer } from "../plan/consistency";
import { Task } from "../types";
import { TaskLifecycleManager } from "./lifecycle";

/**
 * Task verification result
 */
export interface TaskVerificationResult {
  verified: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Task verification options
 */
export interface TaskVerificationOptions {
  strictMode?: boolean; // If true, all errors fail verification
  checkContextAvailability?: boolean; // If true, verifies necessary context is available
  checkParentTask?: boolean; // If true, checks parent task status compatibility
  checkChildTasks?: boolean; // If true, checks child task status compatibility
}

/**
 * Default verification options
 */
const DEFAULT_VERIFICATION_OPTIONS: TaskVerificationOptions = {
  strictMode: false,
  checkContextAvailability: true,
  checkParentTask: true,
  checkChildTasks: true,
};

/**
 * Task verifier class
 */
export class TaskVerifier {
  private lifecycleManager: TaskLifecycleManager;

  constructor(lifecycleManager: TaskLifecycleManager) {
    this.lifecycleManager = lifecycleManager;
  }

  /**
   * Verify if a task can be created
   */
  public async verifyTaskCreation(
    taskData: any,
    options: TaskVerificationOptions = {},
  ): Promise<TaskVerificationResult> {
    const opts = { ...DEFAULT_VERIFICATION_OPTIONS, ...options };
    const result: TaskVerificationResult = {
      verified: true,
      errors: [],
      warnings: [],
    };

    // Verify task has required fields
    if (!taskData.title) {
      result.errors.push("Task must have a title");
    }

    if (!taskData.description) {
      result.warnings.push("Task should have a description for better context");
    }

    // If parent task ID is provided, parent should exist
    if (taskData.parentId && opts.checkParentTask) {
      // This is a placeholder for actual parent check
      // Normally would query storage for parent existence
      const parentExists = await this.mockCheckParentExists(taskData.parentId);
      if (!parentExists) {
        result.errors.push(
          `Parent task with ID ${taskData.parentId} does not exist`,
        );
      }
    }

    // Check result
    if (opts.strictMode && result.errors.length > 0) {
      result.verified = false;
    } else if (!opts.strictMode && result.errors.length > 0) {
      result.verified = false;
    }

    return result;
  }

  /**
   * Verify if a task can transition to a new status
   */
  public async verifyTaskTransition(
    task: Task,
    newStatus: Task["status"],
    options: TaskVerificationOptions = {},
  ): Promise<TaskVerificationResult> {
    const opts = { ...DEFAULT_VERIFICATION_OPTIONS, ...options };
    const result: TaskVerificationResult = {
      verified: true,
      errors: [],
      warnings: [],
    };

    // Check if the transition is valid
    if (!this.lifecycleManager.canTransitionTo(task.status, newStatus)) {
      result.errors.push(
        `Invalid transition from ${task.status} to ${newStatus}`,
      );
    }

    // Check parent task if needed
    if (task.parentId && opts.checkParentTask) {
      const parentStatus = await this.mockGetParentStatus(task.parentId);

      // Parent task should be in_progress for a child to be in_progress
      if (newStatus === "in_progress" && parentStatus !== "in_progress") {
        result.warnings.push(
          `Parent task is not in_progress (current: ${parentStatus}), which may cause context inconsistency`,
        );
      }

      // Parent should not be completed if child is still active
      if (
        parentStatus === "completed" &&
        newStatus !== "completed" &&
        newStatus !== "cancelled"
      ) {
        result.errors.push(
          `Cannot set task to ${newStatus} because parent task is already completed`,
        );
      }
    }

    // Check child tasks if needed
    if (opts.checkChildTasks) {
      const childStatuses = await this.mockGetChildStatuses(task.id);

      // If completing a task, all children should be completed or cancelled
      if (newStatus === "completed") {
        const incompleteChildren = childStatuses.filter(
          (status) => status !== "completed" && status !== "cancelled",
        );

        if (incompleteChildren.length > 0) {
          result.errors.push(
            `Cannot complete task because ${incompleteChildren.length} child tasks are not completed/cancelled`,
          );
        }
      }

      // If cancelling a task, warn about active children
      if (newStatus === "cancelled") {
        const activeChildren = childStatuses.filter(
          (status) => status === "in_progress" || status === "planned",
        );

        if (activeChildren.length > 0) {
          result.warnings.push(
            `Cancelling this task will affect ${activeChildren.length} active child tasks`,
          );
        }
      }
    }

    // Check result
    if (
      opts.strictMode &&
      (result.errors.length > 0 || result.warnings.length > 0)
    ) {
      result.verified = false;
    } else if (!opts.strictMode && result.errors.length > 0) {
      result.verified = false;
    }

    return result;
  }

  /**
   * Verify if a task boundary is valid (for task switching)
   */
  public async verifyTaskBoundary(
    currentTask: Task | null,
    nextTask: Task,
    options: TaskVerificationOptions = {},
  ): Promise<TaskVerificationResult> {
    const opts = { ...DEFAULT_VERIFICATION_OPTIONS, ...options };
    const result: TaskVerificationResult = {
      verified: true,
      errors: [],
      warnings: [],
    };

    // No verification needed if there is no current task
    if (!currentTask) {
      return result;
    }

    // Warn if switching between unrelated tasks
    if (
      currentTask.id !== nextTask.id &&
      currentTask.parentId !== nextTask.id &&
      nextTask.parentId !== currentTask.id
    ) {
      const isRelated = await this.mockCheckTasksRelated(
        currentTask.id,
        nextTask.id,
      );

      if (!isRelated) {
        result.warnings.push(
          "Switching between unrelated tasks may cause context loss",
        );
      }
    }

    // Verify current task status
    if (currentTask.status === "in_progress") {
      result.warnings.push(
        "Switching from an in-progress task without changing its status may cause context inconsistency",
      );
    }

    // Verify necessary context is available
    if (opts.checkContextAvailability) {
      const contextAvailable = await this.mockCheckContextAvailable(
        nextTask.id,
      );

      if (!contextAvailable) {
        result.warnings.push(
          "Necessary context for the next task may not be available",
        );
      }
    }

    // Check result
    if (
      opts.strictMode &&
      (result.errors.length > 0 || result.warnings.length > 0)
    ) {
      result.verified = false;
    } else if (!opts.strictMode && result.errors.length > 0) {
      result.verified = false;
    }

    return result;
  }

  /**
   * Verify if necessary context is available for a task
   */
  public async verifyTaskContext(
    taskId: string,
    options: TaskVerificationOptions = {},
  ): Promise<TaskVerificationResult> {
    const opts = { ...DEFAULT_VERIFICATION_OPTIONS, ...options };
    const result: TaskVerificationResult = {
      verified: true,
      errors: [],
      warnings: [],
    };

    // Verify task exists
    const taskExists = await this.mockCheckTaskExists(taskId);
    if (!taskExists) {
      result.errors.push(`Task with ID ${taskId} does not exist`);
      result.verified = false;
      return result;
    }

    // Verify task context
    const contextAvailable = await this.mockCheckContextAvailable(taskId);
    if (!contextAvailable) {
      result.warnings.push(
        "Necessary context for this task may not be available",
      );

      if (opts.strictMode) {
        result.verified = false;
      }
    }

    return result;
  }

  /**
   * Get task verification recommendations
   */
  public getRecommendations(result: TaskVerificationResult): string[] {
    const recommendations: string[] = [];

    if (!result.verified) {
      if (result.errors.length > 0) {
        recommendations.push("Address all critical errors before proceeding");
      }

      if (result.warnings.length > 0) {
        recommendations.push(
          "Consider addressing warnings to maintain context integrity",
        );
      }
    }

    // Add specific recommendations based on errors and warnings
    if (result.errors.some((e) => e.includes("parent task"))) {
      recommendations.push(
        "Ensure parent tasks are in an appropriate state before modifying child tasks",
      );
    }

    if (result.errors.some((e) => e.includes("child tasks"))) {
      recommendations.push(
        "Complete or cancel all child tasks before completing a parent task",
      );
    }

    if (result.warnings.some((w) => w.includes("unrelated tasks"))) {
      recommendations.push(
        "Consider completing the current task before switching to an unrelated task",
      );
    }

    return recommendations;
  }

  /**
   * Mock method for checking if a parent task exists
   * This would normally query storage
   */
  private async mockCheckParentExists(parentId: string): Promise<boolean> {
    // Simulate async storage query
    return await Promise.resolve(true);
  }

  /**
   * Mock method for getting parent status
   * This would normally query storage
   */
  private async mockGetParentStatus(parentId: string): Promise<Task["status"]> {
    // Simulate async storage query
    return await Promise.resolve("in_progress");
  }

  /**
   * Mock method for getting child statuses
   * This would normally query storage
   */
  private async mockGetChildStatuses(
    taskId: string,
  ): Promise<Task["status"][]> {
    // Simulate async storage query
    return await Promise.resolve(["completed", "completed"]);
  }

  /**
   * Mock method for checking if tasks are related
   * This would normally query storage
   */
  private async mockCheckTasksRelated(
    taskId1: string,
    taskId2: string,
  ): Promise<boolean> {
    // Simulate async storage query
    return await Promise.resolve(false);
  }

  /**
   * Mock method for checking if context is available
   * This would normally query storage
   */
  private async mockCheckContextAvailable(taskId: string): Promise<boolean> {
    // Simulate async storage query
    return await Promise.resolve(true);
  }

  /**
   * Mock method for checking if a task exists
   * This would normally query storage
   */
  private async mockCheckTaskExists(taskId: string): Promise<boolean> {
    // Simulate async storage query
    return await Promise.resolve(true);
  }
}

/**
 * Task boundary verifier class
 *
 * Verifies task boundaries and ensures completion validation
 */
export class TaskBoundaryVerifier {
  constructor(
    private contextValidator: ContextValidator,
    private planConsistencyEnforcer: PlanConsistencyEnforcer,
  ) {}

  /**
   * Verify if a task can be completed
   */
  public async verifyTaskCompletion(
    taskId: string,
  ): Promise<{ valid: boolean; reason?: string }> {
    // In a real implementation, this would check:
    // 1. If the task has completed all required steps
    // 2. If all child tasks are completed or cancelled
    // 3. If the context is valid and complete
    // 4. If the plan consistency allows completion

    return { valid: true };
  }
}

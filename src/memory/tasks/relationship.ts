/**
 * Task Relationship Manager
 *
 * Provides task relationship management for the task system.
 * Handles parent-child relationships between tasks and maintains task hierarchies.
 */

import { v4 as uuidv4 } from "uuid";
import { StorageManager } from "../persistence/storage";
import { TransactionManager } from "../persistence/transaction";
import { Task, TaskRelationship, Transaction } from "../types";

/**
 * Task creation data
 */
export interface TaskCreateData {
  name: string;
  description: string;
  priority?: "low" | "medium" | "high";
  planReference?: { elementId: string; version: number };
  metadata?: Record<string, any>;
  steps?: Array<{
    name: string;
    description?: string;
  }>;
}

/**
 * Task relationship manager
 */
export class TaskRelationshipManager {
  private relationships: Map<string, TaskRelationship[]> = new Map();
  private initialized: boolean = false;
  private storageManager: StorageManager;

  constructor(private transactionManager: TransactionManager) {
    // We'll get the storage manager from the transaction manager for CRUD operations
    this.storageManager = transactionManager["storageManager"];
  }

  /**
   * Initialize the relationship manager
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // In a real implementation, we would load relationships from storage
    // For now, we'll just initialize an empty relationships map

    this.initialized = true;
  }

  /**
   * Create a child task for a parent task
   */
  public async createChildTask(
    parentId: string,
    taskData: TaskCreateData,
  ): Promise<string> {
    return this.transactionManager.executeInTransaction(async (transaction) => {
      // First verify that the parent task exists
      const parentTask = await this.storageManager.getTask(
        parentId,
        transaction,
      );
      if (!parentTask) {
        throw new Error(`Parent task with ID ${parentId} not found`);
      }

      // Create the child task
      const childTaskData: Partial<Task> = {
        name: taskData.name,
        description: taskData.description,
        priority: taskData.priority || "medium",
        parentId: parentId, // Set the parent ID
        planReference: taskData.planReference || parentTask.planReference, // Inherit plan reference if not specified
        metadata: {
          ...taskData.metadata,
          createdFromParent: parentId,
          createdAt: Date.now(),
        },
        steps: taskData.steps
          ? taskData.steps.map((step) => ({
              id: uuidv4(),
              name: step.name,
              description: step.description || "",
              status: "pending",
              createdAt: Date.now(),
              updatedAt: Date.now(),
            }))
          : [],
        contextMarkers: [],
      };

      // Save the child task
      const childTaskId = await this.storageManager.createTask(
        childTaskData,
        transaction,
      );

      // Create the relationship
      const relationship: TaskRelationship = {
        parentId,
        childId: childTaskId,
        type: "subtask",
        metadata: {
          createdAt: Date.now(),
        },
      };

      // Add to relationships map
      if (!this.relationships.has(parentId)) {
        this.relationships.set(parentId, []);
      }

      this.relationships.get(parentId)!.push(relationship);

      // Save the relationship
      await this.saveRelationship(relationship, transaction);

      return childTaskId;
    });
  }

  /**
   * Get all child tasks for a parent task
   */
  public async getChildTasks(taskId: string): Promise<Task[]> {
    return this.transactionManager.executeInTransaction(async (transaction) => {
      // Get relationships for this task
      const relationships = this.relationships.get(taskId) || [];

      // Get all child tasks
      const childTasks: Task[] = [];

      for (const relationship of relationships) {
        const childTask = await this.storageManager.getTask(
          relationship.childId,
          transaction,
        );
        if (childTask) {
          childTasks.push(childTask);
        }
      }

      return childTasks;
    });
  }

  /**
   * Get the parent task for a child task
   */
  public async getParentTask(taskId: string): Promise<Task | undefined> {
    return this.transactionManager.executeInTransaction(async (transaction) => {
      // Get the task to find its parent ID
      const task = await this.storageManager.getTask(taskId, transaction);

      if (!task || !task.parentId) {
        return undefined;
      }

      // Get the parent task
      const parentTask = await this.storageManager.getTask(
        task.parentId,
        transaction,
      );

      return parentTask || undefined;
    });
  }

  /**
   * Get the complete lineage of a task (all ancestors)
   */
  public async getTaskLineage(taskId: string): Promise<Task[]> {
    return this.transactionManager.executeInTransaction(async (transaction) => {
      const lineage: Task[] = [];
      let currentTaskId = taskId;

      // Loop until we reach a task with no parent
      while (currentTaskId) {
        const task = await this.storageManager.getTask(
          currentTaskId,
          transaction,
        );

        if (!task) {
          break;
        }

        // Add the task to the lineage
        lineage.push(task);

        // Move to the parent task, if there is one
        if (task.parentId) {
          currentTaskId = task.parentId;
        } else {
          break;
        }
      }

      // Return the lineage, excluding the original task
      return lineage.slice(1);
    });
  }

  /**
   * Check if a task is a descendant of another task
   */
  public async isDescendantOf(
    taskId: string,
    potentialAncestorId: string,
  ): Promise<boolean> {
    const lineage = await this.getTaskLineage(taskId);
    return lineage.some((task) => task.id === potentialAncestorId);
  }

  /**
   * Get all tasks related to a task (parent, children, siblings)
   */
  public async getRelatedTasks(taskId: string): Promise<Task[]> {
    return this.transactionManager.executeInTransaction(async (transaction) => {
      const related: Task[] = [];

      // Get parent
      const parent = await this.getParentTask(taskId);
      if (parent) {
        related.push(parent);

        // Get siblings (other children of the parent)
        const siblings = await this.getChildTasks(parent.id);
        for (const sibling of siblings) {
          if (sibling.id !== taskId) {
            related.push(sibling);
          }
        }
      }

      // Get children
      const children = await this.getChildTasks(taskId);
      related.push(...children);

      return related;
    });
  }

  /**
   * Update the parent of a task
   */
  public async updateTaskParent(
    taskId: string,
    newParentId: string,
  ): Promise<void> {
    return this.transactionManager.executeInTransaction(async (transaction) => {
      // Get the task
      const task = await this.storageManager.getTask(taskId, transaction);
      if (!task) {
        throw new Error(`Task with ID ${taskId} not found`);
      }

      // Verify the new parent exists
      const newParent = await this.storageManager.getTask(
        newParentId,
        transaction,
      );
      if (!newParent) {
        throw new Error(`New parent task with ID ${newParentId} not found`);
      }

      // Verify this wouldn't create a cycle
      if (await this.isDescendantOf(newParentId, taskId)) {
        throw new Error(
          "Cannot set a descendant as parent (would create a cycle)",
        );
      }

      // Remove from old parent's relationships
      if (task.parentId) {
        const oldParentRelationships =
          this.relationships.get(task.parentId) || [];
        const updatedRelationships = oldParentRelationships.filter(
          (rel) => rel.childId !== taskId,
        );

        if (updatedRelationships.length === 0) {
          this.relationships.delete(task.parentId);
        } else {
          this.relationships.set(task.parentId, updatedRelationships);
        }
      }

      // Update the task's parent ID
      task.parentId = newParentId;
      await this.storageManager.updateTask(task, transaction);

      // Create the new relationship
      const relationship: TaskRelationship = {
        parentId: newParentId,
        childId: taskId,
        type: "subtask",
        metadata: {
          createdAt: Date.now(),
          isReparented: true,
        },
      };

      // Add to relationships map
      if (!this.relationships.has(newParentId)) {
        this.relationships.set(newParentId, []);
      }

      this.relationships.get(newParentId)!.push(relationship);

      // Save the relationship
      await this.saveRelationship(relationship, transaction);
    });
  }

  /**
   * Remove a parent-child relationship
   */
  public async removeRelationship(
    parentId: string,
    childId: string,
  ): Promise<boolean> {
    return this.transactionManager.executeInTransaction(async (transaction) => {
      // Get relationships for the parent
      const parentRelationships = this.relationships.get(parentId) || [];

      // Find the relationship to remove
      const relationshipIndex = parentRelationships.findIndex(
        (rel) => rel.childId === childId,
      );

      if (relationshipIndex === -1) {
        return false;
      }

      // Remove the relationship
      parentRelationships.splice(relationshipIndex, 1);

      if (parentRelationships.length === 0) {
        this.relationships.delete(parentId);
      } else {
        this.relationships.set(parentId, parentRelationships);
      }

      // Update the child task to remove the parent reference
      const childTask = await this.storageManager.getTask(childId, transaction);
      if (childTask && childTask.parentId === parentId) {
        childTask.parentId = undefined;
        await this.storageManager.updateTask(childTask, transaction);
      }

      // Delete the relationship from storage
      await this.deleteRelationship(parentId, childId, transaction);

      return true;
    });
  }

  /**
   * Get all relationships
   */
  public async getAllRelationships(): Promise<TaskRelationship[]> {
    const allRelationships: TaskRelationship[] = [];

    for (const relationships of this.relationships.values()) {
      allRelationships.push(...relationships);
    }

    return allRelationships;
  }

  // Private storage methods

  /**
   * Save a relationship to storage
   */
  private async saveRelationship(
    relationship: TaskRelationship,
    transaction: Transaction,
  ): Promise<void> {
    // In a real implementation, this would persist the relationship to storage
    console.log("Saving relationship:", relationship);
  }

  /**
   * Delete a relationship from storage
   */
  private async deleteRelationship(
    parentId: string,
    childId: string,
    transaction: Transaction,
  ): Promise<void> {
    // In a real implementation, this would delete the relationship from storage
    console.log("Deleting relationship:", { parentId, childId });
  }
}

/**
 * Task Stack Manager
 *
 * Provides task stack management for the task system.
 * Maintains a stack of active tasks and their relationships.
 */

import { v4 as uuidv4 } from "uuid";
import { TransactionManager } from "../persistence/transaction";
import { TaskRelationship, Transaction } from "../types";

/**
 * Task stack data for persistence
 */
interface TaskStackData {
  id: string;
  stack: string[]; // Array of task IDs in stack order (last is top)
  relationships: TaskRelationship[];
  lastUpdated: number;
}

/**
 * Task stack manager
 */
export class TaskStack {
  private stack: string[] = [];
  private stackId: string = uuidv4();
  private relationships: Map<string, TaskRelationship[]> = new Map();
  private initialized: boolean = false;

  constructor(private transactionManager: TransactionManager) {}

  /**
   * Initialize the task stack
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // In a real implementation, this would load the stack from storage
    // For now, we'll just initialize an empty stack

    this.initialized = true;
  }

  /**
   * Push a task onto the stack
   */
  public async push(taskId: string): Promise<void> {
    return this.transactionManager.executeInTransaction(async (transaction) => {
      // Add task to the stack
      this.stack.push(taskId);

      // Save the updated stack
      await this.saveStack(transaction);

      // If there's a task already on the stack, create a relationship
      if (this.stack.length > 1) {
        const parentTaskId = this.stack[this.stack.length - 2];

        // Create a relationship between parent and child
        const relationship: TaskRelationship = {
          parentId: parentTaskId,
          childId: taskId,
          type: "subtask",
          metadata: {
            createdAt: Date.now(),
            stackId: this.stackId,
          },
        };

        // Add to relationships map
        if (!this.relationships.has(parentTaskId)) {
          this.relationships.set(parentTaskId, []);
        }

        this.relationships.get(parentTaskId)!.push(relationship);

        // Save the updated relationships
        await this.saveRelationships(transaction);
      }
    });
  }

  /**
   * Pop a task from the stack
   */
  public async pop(): Promise<string | undefined> {
    return this.transactionManager.executeInTransaction(async (transaction) => {
      // Pop task from the stack
      const taskId = this.stack.pop();

      // Save the updated stack
      await this.saveStack(transaction);

      return taskId;
    });
  }

  /**
   * Peek at the top task in the stack without removing it
   */
  public async peek(): Promise<string | undefined> {
    if (this.stack.length === 0) {
      return undefined;
    }

    return this.stack[this.stack.length - 1];
  }

  /**
   * Get all tasks in the stack
   */
  public async getStack(): Promise<string[]> {
    return [...this.stack];
  }

  /**
   * Get the parent task ID for a given task
   */
  public async getParentTaskId(taskId: string): Promise<string | undefined> {
    const stackIndex = this.stack.indexOf(taskId);

    if (stackIndex <= 0) {
      // Task is not in the stack or is at the bottom
      return undefined;
    }

    return this.stack[stackIndex - 1];
  }

  /**
   * Get all task relationships
   */
  public async getTaskRelationships(): Promise<TaskRelationship[]> {
    const allRelationships: TaskRelationship[] = [];

    for (const relationships of this.relationships.values()) {
      allRelationships.push(...relationships);
    }

    return allRelationships;
  }

  /**
   * Get relationships for a specific task
   */
  public async getRelationshipsForTask(
    taskId: string,
  ): Promise<TaskRelationship[]> {
    return this.relationships.get(taskId) || [];
  }

  /**
   * Get all child tasks for a given task
   */
  public async getChildTaskIds(taskId: string): Promise<string[]> {
    const relationships = this.relationships.get(taskId) || [];
    return relationships.map((rel) => rel.childId);
  }

  /**
   * Check if the stack contains a task
   */
  public async hasTask(taskId: string): Promise<boolean> {
    return this.stack.includes(taskId);
  }

  /**
   * Get the stack size
   */
  public async size(): Promise<number> {
    return this.stack.length;
  }

  /**
   * Clear the stack
   */
  public async clear(): Promise<void> {
    return this.transactionManager.executeInTransaction(async (transaction) => {
      this.stack = [];
      this.relationships.clear();

      await this.saveStack(transaction);
      await this.saveRelationships(transaction);
    });
  }

  /**
   * Save the stack to storage
   */
  private async saveStack(transaction: Transaction): Promise<void> {
    // In a real implementation, this would save the stack to storage
    // using the transaction
    const stackData: TaskStackData = {
      id: this.stackId,
      stack: [...this.stack],
      relationships: await this.getTaskRelationships(),
      lastUpdated: Date.now(),
    };

    // Storage would happen here
    console.log("Saving task stack:", stackData);
  }

  /**
   * Save the relationships to storage
   */
  private async saveRelationships(transaction: Transaction): Promise<void> {
    // In a real implementation, this would save the relationships to storage
    // using the transaction

    // Storage would happen here
    console.log("Saving task relationships");
  }

  /**
   * Load the stack from storage
   */
  private async loadStack(): Promise<void> {
    // In a real implementation, this would load the stack from storage

    // For now, we'll just initialize an empty stack
    this.stack = [];
    this.relationships.clear();
  }
}

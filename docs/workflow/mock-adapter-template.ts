/**
 * Reusable Mock Task System Adapter Template
 *
 * This file provides a generic base class for creating mock task system adapters
 * for testing agent workflows without dependencies on the full memory subsystem.
 */

/**
 * Generic task interface with common properties needed for workflow testing
 */
export interface GenericTask {
  id: string;
  currentStage: string;
  [key: string]: any;
}

/**
 * Base class for creating workflow-specific mock adapters
 */
export class BaseMockTaskAdapter<T extends GenericTask> {
  // Store tasks in memory for fast access
  protected tasks: Map<string, T> = new Map();

  // Track transitions for verification in tests
  protected transitionLog: Array<{
    taskId: string;
    timestamp: Date;
    from: string;
    to: string;
    data: Partial<T>;
  }> = [];

  // Counter for generating sequential task IDs
  protected taskCounter = 0;

  /**
   * Validates if a stage transition is allowed
   * Override this method in derived classes to implement workflow-specific validation
   */
  protected isValidTransition(from: string, to: string): boolean {
    // Base implementation allows all transitions
    // Override in derived classes with workflow-specific validation
    return true;
  }

  /**
   * Creates a new task with the provided data
   */
  async createTask(data: Partial<T>): Promise<string> {
    const taskId = `task-${++this.taskCounter}`;
    const task = {
      id: taskId,
      ...data,
    } as T;

    this.tasks.set(taskId, task);
    return taskId;
  }

  /**
   * Retrieves a task by ID
   */
  async getTask(id: string): Promise<T> {
    const task = this.tasks.get(id);
    if (!task) {
      throw new Error(`Task not found: ${id}`);
    }

    // Return a copy to prevent unintended mutations
    return { ...task };
  }

  /**
   * Updates a task with the provided data
   */
  async updateTask(id: string, updates: Partial<T>): Promise<boolean> {
    const task = this.tasks.get(id);
    if (!task) {
      return false;
    }

    // Check for stage transitions and validate them
    if (updates.currentStage && task.currentStage !== updates.currentStage) {
      // Log the transition
      this.transitionLog.push({
        taskId: id,
        timestamp: new Date(),
        from: task.currentStage,
        to: updates.currentStage,
        data: { ...updates },
      });

      // Validate the transition
      if (!this.isValidTransition(task.currentStage, updates.currentStage)) {
        throw new Error(
          `Invalid stage transition from '${task.currentStage}' to '${updates.currentStage}'`,
        );
      }
    }

    // Update the task
    this.tasks.set(id, {
      ...task,
      ...updates,
    });

    return true;
  }

  /**
   * Deletes a task by ID
   */
  async deleteTask(id: string): Promise<boolean> {
    return this.tasks.delete(id);
  }

  /**
   * Lists all tasks
   */
  async listTasks(): Promise<T[]> {
    return Array.from(this.tasks.values()).map((task) => ({ ...task }));
  }

  /**
   * Gets the transition log for verification in tests
   */
  getTransitionLog() {
    return [...this.transitionLog];
  }

  /**
   * Clears the transition log
   */
  clearTransitionLog() {
    this.transitionLog = [];
  }

  /**
   * Resets the mock adapter state (useful between tests)
   */
  reset() {
    this.tasks.clear();
    this.transitionLog = [];
    this.taskCounter = 0;
  }

  /**
   * Mock implementation for storing memory
   * Override in derived classes if memory-specific behavior is needed
   */
  async storeMemory(memory: any): Promise<void> {
    // This is intentionally a no-op in the base implementation
  }

  /**
   * Mock implementation for querying memories
   * Override in derived classes if memory-specific behavior is needed
   */
  async queryMemories(query: any): Promise<any[]> {
    return [];
  }
}

/**
 * Example usage for a security workflow:
 *
 * ```typescript
 * interface SecurityTask extends GenericTask {
 *   currentStage: SecurityWorkflowStage;
 *   vulnerabilities: Array<{ id: string; severity: string; description: string; }>;
 *   artifacts: Array<{ type: string; content: string; }>;
 * }
 *
 * class MockSecurityTaskAdapter extends BaseMockTaskAdapter<SecurityTask> {
 *   protected isValidTransition(from: SecurityWorkflowStage, to: SecurityWorkflowStage): boolean {
 *     const validTransitions = {
 *       [SecurityWorkflowStage.ASSESSMENT]: [SecurityWorkflowStage.ANALYSIS],
 *       [SecurityWorkflowStage.ANALYSIS]: [SecurityWorkflowStage.VULNERABILITY_SCAN],
 *       // Add other valid transitions...
 *     };
 *
 *     return validTransitions[from]?.includes(to) || false;
 *   }
 *
 *   async createSecurityTask(data: Partial<SecurityTask> = {}): Promise<string> {
 *     return this.createTask({
 *       currentStage: SecurityWorkflowStage.ASSESSMENT,
 *       vulnerabilities: [],
 *       artifacts: [],
 *       ...data
 *     });
 *   }
 * }
 * ```
 */

/**
 * Task Manager
 *
 * Manages the creation, assignment, and execution of tasks in the AIgents framework.
 */

import { EventEmitter } from "events";
import * as fs from "fs";
import * as path from "path";
import { v4 as uuidv4 } from "uuid";
import { agentRegistry } from "./agent-registry.js";
import { Task, TaskPriority, TaskStatus } from "./types.js";

// Type for task queue items
interface TaskQueueItem {
  task: Task;
  priority: number; // Numeric priority for sorting
}

class TaskManager extends EventEmitter {
  // Map of task ID to task object
  private tasks: Map<string, Task> = new Map();

  // Queue of pending tasks
  private taskQueue: TaskQueueItem[] = [];

  // Map of agent ID to array of assigned task IDs
  private agentTasks: Map<string, string[]> = new Map();

  // Maximum number of concurrent tasks per agent
  private maxConcurrentTasksPerAgent = 1;

  // Storage directory for tasks
  private storageDir: string;

  // Flag to indicate if the task manager is running
  private running = false;

  /**
   * Create a new TaskManager
   *
   * @param storageDir Directory to store task data
   */
  constructor(
    storageDir: string = path.join(
      process.cwd(),
      "src",
      "agents",
      "tasks",
      "store",
    ),
  ) {
    super();
    this.storageDir = storageDir;
  }

  /**
   * Initialize the task manager
   */
  public async initialize(): Promise<void> {
    // Create storage directory if it doesn't exist
    await fs.promises.mkdir(this.storageDir, { recursive: true });

    // Load any existing tasks
    await this.loadTasks();

    this.running = true;
    this.emit("initialized");

    // Start processing tasks
    this.processTasks();
  }

  /**
   * Create a new task
   *
   * @param task Partial task object
   * @returns The created task
   */
  public async createTask(task: Partial<Task>): Promise<Task> {
    // Generate a unique ID if not provided
    const taskId = task.id || `task-${uuidv4()}`;

    // Create the task object
    const newTask: Task = {
      id: taskId,
      type: task.type || "generic",
      status: task.status || TaskStatus.PENDING,
      priority: task.priority || TaskPriority.MEDIUM,
      description: task.description || "",
      assignedTo: task.assignedTo || undefined,
      createdAt: task.createdAt || new Date().toISOString(),
      updatedAt: task.updatedAt || new Date().toISOString(),
      steps: task.steps || [],
      context: task.context || {},
      data: task.data || {},
      result: task.result,
      error: task.error,
      dependencies: task.dependencies,
      metadata: task.metadata,
    };

    // Add to task map
    this.tasks.set(newTask.id, newTask);

    // Add to queue if pending
    if (newTask.status === TaskStatus.PENDING) {
      this.addToQueue(newTask);
    } else if (
      newTask.status === TaskStatus.IN_PROGRESS &&
      newTask.assignedTo
    ) {
      // Add to agent tasks if in progress
      this.addToAgentTasks(newTask.assignedTo, newTask.id);
    }

    // Save the task
    await this.saveTask(newTask);

    // Emit task created event
    this.emit("task:created", { taskId: newTask.id });

    return newTask;
  }

  /**
   * Get a task by ID
   *
   * @param taskId Task ID
   * @returns The task or undefined if not found
   */
  public getTask(taskId: string): Task | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * Update a task
   *
   * @param task The updated task
   * @returns True if update was successful, false if task not found
   */
  public async updateTask(task: Task): Promise<boolean> {
    // Check if task exists
    if (!this.tasks.has(task.id)) {
      return false;
    }

    // Get the current task
    const currentTask = this.tasks.get(task.id)!;

    // Check if assigned agent changed
    if (currentTask.assignedTo !== task.assignedTo) {
      // Remove from previous agent's tasks
      if (currentTask.assignedTo) {
        this.removeFromAgentTasks(currentTask.assignedTo, task.id);
      }

      // Add to new agent's tasks
      if (task.assignedTo) {
        this.addToAgentTasks(task.assignedTo, task.id);
      }
    }

    // Update the task
    task.updatedAt = new Date().toISOString();
    this.tasks.set(task.id, task);

    // Save the task
    await this.saveTask(task);

    // Emit task updated event
    this.emit("task:updated", {
      taskId: task.id,
      status: task.status,
      assignedTo: task.assignedTo,
    });

    return true;
  }

  /**
   * Delete a task
   *
   * @param taskId Task ID
   * @returns True if deletion was successful, false if task not found
   */
  public async deleteTask(taskId: string): Promise<boolean> {
    // Check if task exists
    if (!this.tasks.has(taskId)) {
      return false;
    }

    // Get the task
    const task = this.tasks.get(taskId)!;

    // Remove from agent tasks
    if (task.assignedTo) {
      this.removeFromAgentTasks(task.assignedTo, taskId);
    }

    // Remove from task map
    this.tasks.delete(taskId);

    // Remove from queue
    this.taskQueue = this.taskQueue.filter((item) => item.task.id !== taskId);

    // Delete the task file
    try {
      await fs.promises.unlink(this.getTaskFilePath(taskId));
    } catch (error) {
      console.error(`Error deleting task file for ${taskId}:`, error);
    }

    // Emit task deleted event
    this.emit("task:deleted", { taskId });

    return true;
  }

  /**
   * Get all tasks
   *
   * @returns Array of all tasks
   */
  public getAllTasks(): Task[] {
    return Array.from(this.tasks.values());
  }

  /**
   * Get tasks by status
   *
   * @param status Task status
   * @returns Array of tasks with the specified status
   */
  public getTasksByStatus(status: TaskStatus): Task[] {
    return Array.from(this.tasks.values()).filter(
      (task) => task.status === status,
    );
  }

  /**
   * Get tasks assigned to a specific agent
   *
   * @param agentId Agent ID
   * @returns Array of tasks assigned to the agent
   */
  public getTasksByAgent(agentId: string): Task[] {
    const taskIds = this.agentTasks.get(agentId) || [];
    return taskIds
      .map((id) => this.tasks.get(id))
      .filter((task): task is Task => task !== undefined);
  }

  /**
   * Assign a task to an agent
   *
   * @param taskId Task ID
   * @param agentId Agent ID
   * @returns True if assignment was successful, false if task not found or already assigned
   */
  public async assignTask(taskId: string, agentId: string): Promise<boolean> {
    // Check if task exists
    if (!this.tasks.has(taskId)) {
      return false;
    }

    // Get the task
    const task = this.tasks.get(taskId)!;

    // Check if task is already assigned
    if (task.assignedTo === agentId) {
      return true;
    }

    // Remove from previous agent's tasks
    if (task.assignedTo) {
      this.removeFromAgentTasks(task.assignedTo, taskId);
    }

    // Update task
    task.assignedTo = agentId;
    task.updatedAt = new Date().toISOString();

    // Add to agent tasks
    this.addToAgentTasks(agentId, taskId);

    // Save the task
    await this.saveTask(task);

    // Emit task assigned event
    this.emit("task:assigned", { taskId, agentId });

    return true;
  }

  /**
   * Unassign a task from an agent
   *
   * @param taskId Task ID
   * @returns True if unassignment was successful, false if task not found or not assigned
   */
  public async unassignTask(taskId: string): Promise<boolean> {
    // Check if task exists
    if (!this.tasks.has(taskId)) {
      return false;
    }

    // Get the task
    const task = this.tasks.get(taskId)!;

    // Check if task is assigned
    if (!task.assignedTo) {
      return true;
    }

    // Remove from agent tasks
    this.removeFromAgentTasks(task.assignedTo, taskId);

    // Update task
    const agentId = task.assignedTo;
    task.assignedTo = undefined;
    task.updatedAt = new Date().toISOString();

    // Save the task
    await this.saveTask(task);

    // Emit task unassigned event
    this.emit("task:unassigned", { taskId, agentId });

    return true;
  }

  /**
   * Mark a task as completed
   *
   * @param taskId Task ID
   * @param result Task result
   * @returns True if completion was successful, false if task not found
   */
  public async completeTask(
    taskId: string,
    result: any = null,
  ): Promise<boolean> {
    // Check if task exists
    if (!this.tasks.has(taskId)) {
      return false;
    }

    // Get the task
    const task = this.tasks.get(taskId)!;

    // Update task
    task.status = TaskStatus.COMPLETED;
    task.updatedAt = new Date().toISOString();
    task.result = result || task.result;

    // Remove from agent tasks if assigned
    if (task.assignedTo) {
      this.removeFromAgentTasks(task.assignedTo, taskId);
    }

    // Save the task
    await this.saveTask(task);

    // Emit task completed event
    this.emit("task:completed", { taskId, result });

    return true;
  }

  /**
   * Mark a task as failed
   *
   * @param taskId Task ID
   * @param error Error information
   * @returns True if failure was successful, false if task not found
   */
  public async failTask(taskId: string, error: any): Promise<boolean> {
    // Check if task exists
    if (!this.tasks.has(taskId)) {
      return false;
    }

    // Get the task
    const task = this.tasks.get(taskId)!;

    // Update task
    task.status = TaskStatus.FAILED;
    task.updatedAt = new Date().toISOString();
    task.result = { error };

    // Remove from agent tasks if assigned
    if (task.assignedTo) {
      this.removeFromAgentTasks(task.assignedTo, taskId);
    }

    // Save the task
    await this.saveTask(task);

    // Emit task failed event
    this.emit("task:failed", { taskId, error });

    return true;
  }

  /**
   * Add a task to the queue
   *
   * @param task The task to add
   */
  private addToQueue(task: Task): void {
    // Convert priority to numeric value for sorting
    const priorityValue = this.getPriorityValue(task.priority);

    // Add to queue
    this.taskQueue.push({
      task,
      priority: priorityValue,
    });

    // Sort queue by priority (higher values first)
    this.taskQueue.sort((a, b) => b.priority - a.priority);

    // Emit task queued event
    this.emit("task:queued", { taskId: task.id, priority: task.priority });
  }

  /**
   * Add a task to an agent's task list
   *
   * @param agentId Agent ID
   * @param taskId Task ID
   */
  private addToAgentTasks(agentId: string, taskId: string): void {
    // Create agent tasks array if it doesn't exist
    if (!this.agentTasks.has(agentId)) {
      this.agentTasks.set(agentId, []);
    }

    // Add task to agent tasks
    this.agentTasks.get(agentId)?.push(taskId);
  }

  /**
   * Remove a task from an agent's task list
   *
   * @param agentId Agent ID
   * @param taskId Task ID
   */
  private removeFromAgentTasks(agentId: string, taskId: string): void {
    const tasks = this.agentTasks.get(agentId) || [];
    const updatedTasks = tasks.filter((id) => id !== taskId);

    if (updatedTasks.length === 0) {
      this.agentTasks.delete(agentId);
    } else {
      this.agentTasks.set(agentId, updatedTasks);
    }
  }

  /**
   * Process pending tasks
   */
  private async processTasks(): Promise<void> {
    if (!this.running) {
      return;
    }

    // Check for tasks to assign
    while (this.taskQueue.length > 0) {
      const queueItem = this.taskQueue[0];
      const task = queueItem.task;

      // Find agents that can handle this task type
      const eligibleAgents = agentRegistry.findAgentsForTaskType(task.type);

      // Skip if no eligible agents
      if (eligibleAgents.length === 0) {
        console.log(`No agents can handle task type: ${task.type}`);

        // Remove from queue and try next task
        this.taskQueue.shift();
        continue;
      }

      // Find available agent
      let assignedAgent = null;

      for (const agent of eligibleAgents) {
        // Check if agent has capacity
        const agentTaskCount = this.agentTasks.get(agent.id)?.length || 0;

        if (agentTaskCount < this.maxConcurrentTasksPerAgent) {
          assignedAgent = agent;
          break;
        }
      }

      // Skip if all agents are busy
      if (!assignedAgent) {
        break;
      }

      // Remove from queue
      this.taskQueue.shift();

      // Assign task to agent
      await this.assignTask(task.id, assignedAgent.id);

      // Update task status
      task.status = TaskStatus.IN_PROGRESS;
      await this.updateTask(task);

      // Emit task assigned event
      this.emit("task:processing", {
        taskId: task.id,
        agentId: assignedAgent.id,
      });
    }

    // Schedule next processing
    setTimeout(() => this.processTasks(), 1000);
  }

  /**
   * Convert priority to numeric value
   *
   * @param priority Task priority
   * @returns Numeric priority value
   */
  private getPriorityValue(priority: TaskPriority): number {
    switch (priority) {
      case TaskPriority.HIGH:
        return 100;
      case TaskPriority.MEDIUM:
        return 50;
      case TaskPriority.LOW:
        return 10;
      case TaskPriority.CRITICAL:
        return 200;
      default:
        return 0;
    }
  }

  /**
   * Save a task to disk
   *
   * @param task The task to save
   */
  private async saveTask(task: Task): Promise<void> {
    const filePath = this.getTaskFilePath(task.id);

    try {
      await fs.promises.writeFile(filePath, JSON.stringify(task, null, 2));
    } catch (error) {
      console.error(`Error saving task ${task.id}:`, error);
      this.emit("error", {
        type: "task:save",
        taskId: task.id,
        error,
      });
    }
  }

  /**
   * Load all tasks from disk
   */
  private async loadTasks(): Promise<void> {
    try {
      // Read task directory
      const files = await fs.promises.readdir(this.storageDir);

      // Load each task
      for (const file of files) {
        if (file.endsWith(".json")) {
          try {
            const filePath = path.join(this.storageDir, file);
            const data = await fs.promises.readFile(filePath, "utf8");
            const task = JSON.parse(data) as Task;

            // Add to task map
            this.tasks.set(task.id, task);

            // Add to queue if pending
            if (task.status === TaskStatus.PENDING) {
              this.addToQueue(task);
            } else if (
              task.status === TaskStatus.IN_PROGRESS &&
              task.assignedTo
            ) {
              // Add to agent tasks if in progress
              this.addToAgentTasks(task.assignedTo, task.id);
            }
          } catch (error) {
            console.error(`Error loading task from ${file}:`, error);
          }
        }
      }

      console.log(`Loaded ${this.tasks.size} tasks`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        console.error("Error loading tasks:", error);
        this.emit("error", { type: "tasks:load", error });
      }
    }
  }

  /**
   * Get the file path for a task
   *
   * @param taskId Task ID
   * @returns File path
   */
  private getTaskFilePath(taskId: string): string {
    return path.join(this.storageDir, `${taskId}.json`);
  }
}

// Export singleton instance
export const taskManager = new TaskManager();

// Also export the class for testing/mocking
export { TaskManager };

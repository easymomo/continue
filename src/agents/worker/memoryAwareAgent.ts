/**
 * Memory-Aware Agent Implementation
 *
 * Demonstrates the use of the task-based memory system
 * with proper task tracking and context preservation.
 */

import { BaseAgent, BaseAgentConfig } from "../framework/base-agent.js";
import { Message, MessageType, Task, TaskStatus } from "../framework/types.js";

/**
 * Configuration for the MemoryAwareAgent
 */
export interface MemoryAwareAgentConfig extends BaseAgentConfig {
  // Additional configuration specific to MemoryAwareAgent
  maxMemoryItems?: number;
  persistenceLevel?: "low" | "medium" | "high";
}

/**
 * Memory-Aware Agent that demonstrates the use of
 * the task-based memory system
 */
export class MemoryAwareAgent extends BaseAgent {
  private maxMemoryItems: number;
  private persistenceLevel: string;

  constructor(config: MemoryAwareAgentConfig) {
    // Ensure the agent uses task memory
    super({
      ...config,
      type: "memory_aware",
      useTaskMemory: true, // Enable task-based memory
    });

    this.maxMemoryItems = config.maxMemoryItems || 100;
    this.persistenceLevel = config.persistenceLevel || "medium";
  }

  /**
   * Handle a specific task with memory persistence
   */
  protected async onHandleTask(task: Task): Promise<Task> {
    // Store the task in memory
    await this.storeMessage("system", `Starting task: ${task.description}`, {
      taskId: task.id,
      type: task.type,
    });

    try {
      // Process the task based on its type
      switch (task.type) {
        case "memory_test":
          return await this.handleMemoryTestTask(task);
        case "context_test":
          return await this.handleContextTestTask(task);
        case "relationship_test":
          return await this.handleRelationshipTestTask(task);
        default:
          throw new Error(`Unsupported task type: ${task.type}`);
      }
    } catch (error: any) {
      // Record the error in memory
      await this.storeMessage(
        "system",
        `Error processing task: ${error.message}`,
        { taskId: task.id, error: true },
      );

      // Update task with error
      task.status = TaskStatus.FAILED;
      task.result = { error: error.message };
      return task;
    }
  }

  /**
   * Handle a memory test task
   */
  private async handleMemoryTestTask(task: Task): Promise<Task> {
    // Log task start to memory
    await this.storeDecision(
      "Process memory test task",
      "Task requires testing different memory storage methods",
      { taskId: task.id },
    );

    // Store a document in memory
    const documentId = await this.storeDocument(
      "Memory Test Results",
      "This document contains test results from memory operations",
      "memory_test",
      { importance: "high", taskId: task.id },
    );

    // Store code in memory
    const codeId = await this.storeCode(
      "memory_test.ts",
      'function testMemory() {\n  return "Memory test successful";\n}',
      "typescript",
      { purpose: "demonstration", taskId: task.id },
    );

    // If using task memory, access task-specific features
    if (this.isUsingTaskMemory()) {
      const taskMemory = this.getTaskMemory();

      // Get the active task
      const activeTask = await taskMemory.getActiveTask();

      // Store the active task info
      await this.storeMessage(
        "system",
        `Active task: ${activeTask?.id || "None"}`,
        { activeTaskInfo: !!activeTask },
      );
    }

    // Complete the task
    task.status = TaskStatus.COMPLETED;
    task.result = {
      documentId,
      codeId,
      memoryType: this.isUsingTaskMemory() ? "task_memory" : "standard_memory",
      timestamp: Date.now(),
    };

    // Store completion message
    await this.storeMessage(
      "system",
      `Completed memory test task: ${task.id}`,
      { taskId: task.id, completed: true },
    );

    return task;
  }

  /**
   * Handle a context test task
   */
  private async handleContextTestTask(task: Task): Promise<Task> {
    // Store the context test start
    await this.storeMessage(
      "system",
      `Starting context test for task: ${task.id}`,
      { taskId: task.id, operation: "context_test" },
    );

    // Simulate a complex analysis with multiple memory operations
    const analysisResults = [];

    // Store multiple items to test context preservation
    for (let i = 0; i < 5; i++) {
      const result = `Context test result ${i + 1}`;

      // Store each result
      const resultId = await this.storeMessage("system", result, {
        contextTest: true,
        index: i,
        taskId: task.id,
      });

      analysisResults.push(resultId);
    }

    // Make a decision based on context
    await this.storeDecision(
      "Context preservation successful",
      "All test items were properly stored and retrieved with context",
      { taskId: task.id, test: "context_preservation" },
    );

    // Complete the task
    task.status = TaskStatus.COMPLETED;
    task.result = {
      analysisResults,
      contextPreserved: true,
      timestamp: Date.now(),
    };

    return task;
  }

  /**
   * Handle a relationship test task
   */
  private async handleRelationshipTestTask(task: Task): Promise<Task> {
    // Ensure we're using task memory
    if (!this.isUsingTaskMemory()) {
      task.status = TaskStatus.FAILED;
      task.result = {
        error: "Task memory is required for relationship tests",
      };
      return task;
    }

    // Get the other agent ID from task data
    const otherAgentId = task.data?.otherAgentId;
    if (!otherAgentId) {
      task.status = TaskStatus.FAILED;
      task.result = {
        error: "No otherAgentId provided in task data",
      };
      return task;
    }

    // Create a parent-child relationship
    const relationship = task.data?.relationship || "parent";
    const success = await this.createAgentRelationship(
      otherAgentId,
      relationship,
    );

    // Store the relationship result
    await this.storeDecision(
      `Relationship ${success ? "created" : "failed"}`,
      `Attempted to create ${relationship} relationship with agent ${otherAgentId}`,
      { taskId: task.id, relationship, success },
    );

    // If successful, visualize dependencies
    let visualization = null;
    if (success) {
      try {
        visualization = await this.getTaskMemory().visualizeDependencies();
      } catch (error: any) {
        await this.storeMessage(
          "system",
          `Failed to visualize dependencies: ${error.message}`,
          { taskId: task.id, error: true },
        );
      }
    }

    // Complete the task
    task.status = success ? TaskStatus.COMPLETED : TaskStatus.FAILED;
    task.result = {
      relationship,
      otherAgentId,
      success,
      visualization,
      timestamp: Date.now(),
    };

    return task;
  }

  /**
   * Handle a message from another agent
   */
  protected async onHandleMessage(message: Message): Promise<void> {
    // Store incoming messages in memory
    await this.storeMessage(
      message.sender,
      typeof message.content === "string"
        ? message.content
        : JSON.stringify(message.content),
      {
        messageId: message.id,
        messageType: message.type,
        timestamp: message.timestamp,
      },
    );

    // Process different message types
    switch (message.type) {
      case MessageType.REQUEST:
        await this.handleRequestMessage(message);
        break;
      case MessageType.RESPONSE:
        await this.handleResponseMessage(message);
        break;
      default:
        // Just log other message types
        await this.storeMessage(
          "system",
          `Received message of type: ${message.type}`,
          { messageId: message.id },
        );
    }
  }

  /**
   * Handle a request message
   */
  private async handleRequestMessage(message: Message): Promise<void> {
    // Store that we're processing a request
    await this.storeDecision(
      "Process request message",
      `Handling request from ${message.sender}`,
      { messageId: message.id },
    );

    // Send a response
    await this.sendMessage(
      this.id,
      message.sender,
      "Response to request",
      { received: true, processed: true },
      MessageType.RESPONSE,
    );
  }

  /**
   * Handle a response message
   */
  private async handleResponseMessage(message: Message): Promise<void> {
    // Just acknowledge receipt
    await this.storeMessage(
      "system",
      `Received response from ${message.sender}`,
      { messageId: message.id },
    );
  }

  /**
   * Initialize agent-specific resources
   */
  protected async onInitialize(): Promise<void> {
    // Store initialization in memory
    if (this.isUsingTaskMemory()) {
      await this.storeMessage(
        "system",
        "Initializing memory-aware agent with task memory",
        {
          persistenceLevel: this.persistenceLevel,
          maxMemoryItems: this.maxMemoryItems,
        },
      );
    }
  }

  /**
   * Clean up when agent is deactivated
   */
  protected async onDeactivate(): Promise<void> {
    // Complete any active tasks when deactivating
    if (this.isUsingTaskMemory()) {
      try {
        const taskMemory = this.getTaskMemory();
        await taskMemory.completeTask();
      } catch (error: any) {
        console.warn(`Error completing task on deactivation: ${error.message}`);
      }
    }
  }
}

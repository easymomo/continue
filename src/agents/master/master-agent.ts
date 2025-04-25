/**
 * Master Agent
 *
 * The central coordinating agent that maintains overall project context and vision.
 * It orchestrates communication between specialized agents and directs task distribution.
 */

import { agentRegistry } from "../framework/agent-registry.js";
import { BaseAgent } from "../framework/base-agent.js";
import { messageBus } from "../framework/message-bus.js";
import { taskManager } from "../framework/task-manager.js";
import {
  Message,
  MessageType,
  Task,
  TaskPriority,
  TaskStatus,
} from "../framework/types.js";

interface ProjectContext {
  name: string;
  description: string;
  goals: string[];
  currentPhase: string;
  currentTasks: string[];
  completedTasks: string[];
  keyDecisions: Array<{
    topic: string;
    decision: string;
    reasoning: string;
    timestamp: string;
  }>;
  lastUpdated: string;
}

export class MasterAgent extends BaseAgent {
  private projectContext: ProjectContext | null = null;
  private taskDistributionRules: Record<string, string[]> = {};

  constructor() {
    super({
      name: "Master Agent",
      description:
        "Coordinates the overall project and directs other specialized agents",
      version: "1.0.0",
      capabilities: {
        agentCoordination: true,
        taskDistribution: true,
        projectContextManagement: true,
        decisionMaking: true,
      },
      supportedTaskTypes: [
        "agent-coordination",
        "task-distribution",
        "project-context-update",
        "decision-making",
      ],
    });

    // Initialize task distribution rules
    this.initializeTaskDistributionRules();
  }

  /**
   * Initialize the agent
   */
  protected async onInitialize(): Promise<void> {
    // Load project context from memory if available
    await this.loadProjectContext();

    // Subscribe to relevant events
    messageBus.on("message:broadcast", this.handleBroadcastMessage.bind(this));
    taskManager.on("task:created", this.handleTaskCreated.bind(this));
    taskManager.on("task:completed", this.handleTaskCompleted.bind(this));

    // Register for messages about project updates
    const unsubscribe = messageBus.registerMessageHandler(
      this.id,
      this.handleIncomingMessage.bind(this),
    );

    // Store unsubscribe function for shutdown
    await this.storeMemory("message-handler-unsubscribe", unsubscribe);
  }

  /**
   * Shutdown the agent
   */
  protected async onShutdown(): Promise<void> {
    // Unsubscribe from message handler
    const unsubscribe = await this.getMemoryItem("message-handler-unsubscribe");
    if (typeof unsubscribe === "function") {
      unsubscribe();
    }
  }

  /**
   * Handle a task assigned to the agent
   *
   * @param task Task to handle
   * @returns The updated task
   */
  protected async onHandleTask(task: Task): Promise<Task> {
    switch (task.type) {
      case "agent-coordination":
        return await this.handleAgentCoordination(task);

      case "task-distribution":
        return await this.handleTaskDistribution(task);

      case "project-context-update":
        return await this.handleProjectContextUpdate(task);

      case "decision-making":
        return await this.handleDecisionMaking(task);

      default:
        task.status = TaskStatus.FAILED;
        task.error = `Unsupported task type: ${task.type}`;
        return task;
    }
  }

  /**
   * Handle a message sent to the agent
   *
   * @param message Message to handle
   */
  protected async onHandleMessage(message: Message): Promise<void> {
    switch (message.subject) {
      case "project-update":
        await this.handleProjectUpdateMessage(message);
        break;

      case "task-completion":
        await this.handleTaskCompletionMessage(message);
        break;

      case "agent-registration":
        await this.handleAgentRegistrationMessage(message);
        break;

      case "decision-request":
        await this.handleDecisionRequestMessage(message);
        break;

      default:
        // Log unknown message subjects
        console.log(`Unknown message subject: ${message.subject}`);
        break;
    }
  }

  /**
   * Initialize task distribution rules
   * Maps task types to agent capabilities required
   */
  private initializeTaskDistributionRules(): void {
    this.taskDistributionRules = {
      "dependency-check": ["dependencyCheck"],
      "security-audit": ["securityAudit"],
      "dependency-update": ["dependencyUpdate"],
      "documentation-fetch": ["documentationFetching"],
      "code-generation": ["codeGeneration"],
      "test-creation": ["testGeneration"],
      "project-planning": ["projectPlanning"],
      "web-search": ["webSearch"],
    };
  }

  /**
   * Load project context from memory
   */
  private async loadProjectContext(): Promise<void> {
    // Query memories for project context
    const contextMemories = await this.queryMemories({
      type: "project-context",
    });

    if (contextMemories.length > 0) {
      // Get the most recent project context
      const sortedMemories = contextMemories.sort((a, b) => {
        return (
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      });

      this.projectContext = sortedMemories[0].content as ProjectContext;
      console.log("Loaded project context:", this.projectContext.name);
    } else {
      console.log("No project context found in memory");
    }
  }

  /**
   * Save project context to memory
   */
  private async saveProjectContext(): Promise<void> {
    if (this.projectContext) {
      // Update timestamp
      this.projectContext.lastUpdated = new Date().toISOString();

      // Store in memory
      await this.storeMemory("project-context", this.projectContext, {
        projectName: this.projectContext.name,
        timestamp: this.projectContext.lastUpdated,
      });

      console.log("Saved project context:", this.projectContext.name);
    }
  }

  /**
   * Create a new project context
   *
   * @param name Project name
   * @param description Project description
   * @param goals Project goals
   */
  private async createProjectContext(
    name: string,
    description: string,
    goals: string[],
  ): Promise<void> {
    this.projectContext = {
      name,
      description,
      goals,
      currentPhase: "initialization",
      currentTasks: [],
      completedTasks: [],
      keyDecisions: [],
      lastUpdated: new Date().toISOString(),
    };

    // Save to memory
    await this.saveProjectContext();

    // Notify other agents about new project
    await this.broadcastMessage(
      "project-initialized",
      { projectContext: this.projectContext },
      MessageType.EVENT,
    );
  }

  /**
   * Add a decision to the project context
   *
   * @param topic Decision topic
   * @param decision The decision made
   * @param reasoning Reasoning behind the decision
   */
  private async addProjectDecision(
    topic: string,
    decision: string,
    reasoning: string,
  ): Promise<void> {
    if (!this.projectContext) {
      throw new Error("Project context not initialized");
    }

    this.projectContext.keyDecisions.push({
      topic,
      decision,
      reasoning,
      timestamp: new Date().toISOString(),
    });

    // Save updated context
    await this.saveProjectContext();

    // Notify other agents about the decision
    await this.broadcastMessage(
      "project-decision-made",
      {
        topic,
        decision,
        reasoning,
      },
      MessageType.EVENT,
    );
  }

  /**
   * Determine best agent for a task
   *
   * @param taskType Type of task to be assigned
   * @returns Agent ID or undefined if no suitable agent found
   */
  private async findBestAgentForTask(
    taskType: string,
  ): Promise<string | undefined> {
    // Get required capabilities for task type
    const requiredCapabilities = this.taskDistributionRules[taskType] || [];

    if (requiredCapabilities.length === 0) {
      console.log(
        `No capability requirements defined for task type: ${taskType}`,
      );
      return undefined;
    }

    // Find agents with all required capabilities
    let bestAgents: Array<{ id: string; tasksAssigned: number }> = [];

    for (const capability of requiredCapabilities) {
      const agents = agentRegistry.findAgentsByCapability(capability);

      if (agents.length === 0) {
        console.log(`No agents found with capability: ${capability}`);
        return undefined;
      }

      // For first capability, initialize bestAgents
      if (bestAgents.length === 0) {
        bestAgents = agents.map((agent) => ({
          id: agent.id,
          tasksAssigned: taskManager.getTasksByAgent(agent.id).length,
        }));
      } else {
        // Filter bestAgents to those that also have this capability
        const agentIds = agents.map((agent) => agent.id);
        bestAgents = bestAgents.filter((agent) => agentIds.includes(agent.id));

        if (bestAgents.length === 0) {
          console.log(`No agents found with all required capabilities`);
          return undefined;
        }
      }
    }

    // Sort by number of tasks assigned (fewest first)
    bestAgents.sort((a, b) => a.tasksAssigned - b.tasksAssigned);

    return bestAgents.length > 0 ? bestAgents[0].id : undefined;
  }

  /**
   * Handle agent coordination task
   *
   * @param task Task to handle
   * @returns Updated task
   */
  private async handleAgentCoordination(task: Task): Promise<Task> {
    // Extract coordination parameters
    const { taskIds, agentPreferences } = task.data;

    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      task.status = TaskStatus.FAILED;
      task.error = "No task IDs provided for coordination";
      return task;
    }

    // Track results for each task
    const results: Record<
      string,
      { success: boolean; assignedTo?: string; error?: string }
    > = {};

    for (const taskId of taskIds) {
      try {
        // Get the task
        const taskToAssign = taskManager.getTask(taskId);

        if (!taskToAssign) {
          results[taskId] = {
            success: false,
            error: `Task not found: ${taskId}`,
          };
          continue;
        }

        // Check if there's a preferred agent
        let assignTo: string | undefined;

        if (agentPreferences && agentPreferences[taskId]) {
          // Verify agent exists
          const preferredAgentId = agentPreferences[taskId];
          const preferredAgent = agentRegistry.getAgent(preferredAgentId);

          if (preferredAgent) {
            assignTo = preferredAgentId;
          }
        }

        // Find best agent if no preference or preferred agent not found
        if (!assignTo) {
          assignTo = await this.findBestAgentForTask(taskToAssign.type);
        }

        if (!assignTo) {
          results[taskId] = {
            success: false,
            error: `No suitable agent found for task type: ${taskToAssign.type}`,
          };
          continue;
        }

        // Assign the task
        const assigned = await taskManager.assignTask(taskId, assignTo);

        if (assigned) {
          results[taskId] = {
            success: true,
            assignedTo: assignTo,
          };
        } else {
          results[taskId] = {
            success: false,
            error: `Failed to assign task to agent: ${assignTo}`,
          };
        }
      } catch (error) {
        results[taskId] = {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }

    // Update task result
    task.result = {
      message: "Agent coordination completed",
      results,
    };

    // Check if all tasks were successfully assigned
    const allSuccess = Object.values(results).every((r) => r.success);

    task.status = allSuccess
      ? TaskStatus.COMPLETED
      : TaskStatus.COMPLETED_WITH_ERRORS;

    return task;
  }

  /**
   * Handle task distribution task
   *
   * @param task Task to handle
   * @returns Updated task
   */
  private async handleTaskDistribution(task: Task): Promise<Task> {
    // Extract task data
    const { tasks: tasksToCreate } = task.data;

    if (
      !tasksToCreate ||
      !Array.isArray(tasksToCreate) ||
      tasksToCreate.length === 0
    ) {
      task.status = TaskStatus.FAILED;
      task.error = "No tasks provided for distribution";
      return task;
    }

    // Create tasks and track results
    const results: Record<
      string,
      {
        success: boolean;
        taskId?: string;
        assignedTo?: string;
        error?: string;
      }
    > = {};

    for (const taskData of tasksToCreate) {
      try {
        // Create the task
        const newTask = await taskManager.createTask(taskData);

        // Find best agent for task
        const assignTo = await this.findBestAgentForTask(newTask.type);

        if (!assignTo) {
          results[newTask.id] = {
            success: true,
            taskId: newTask.id,
            error: `No suitable agent found for task type: ${newTask.type}`,
          };
          continue;
        }

        // Assign the task
        const assigned = await taskManager.assignTask(newTask.id, assignTo);

        if (assigned) {
          results[newTask.id] = {
            success: true,
            taskId: newTask.id,
            assignedTo: assignTo,
          };

          // Add to project context if it exists
          if (this.projectContext) {
            this.projectContext.currentTasks.push(newTask.id);
            await this.saveProjectContext();
          }
        } else {
          results[newTask.id] = {
            success: true,
            taskId: newTask.id,
            error: `Task created but failed to assign to agent: ${assignTo}`,
          };
        }
      } catch (error) {
        const errorId = `task-${Object.keys(results).length}`;
        results[errorId] = {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }

    // Update task result
    task.result = {
      message: "Task distribution completed",
      results,
    };

    // Check if all tasks were successfully created
    const allSuccess = Object.values(results).every((r) => r.success);

    task.status = allSuccess
      ? TaskStatus.COMPLETED
      : TaskStatus.COMPLETED_WITH_ERRORS;

    return task;
  }

  /**
   * Handle project context update task
   *
   * @param task Task to handle
   * @returns Updated task
   */
  private async handleProjectContextUpdate(task: Task): Promise<Task> {
    // Extract update data
    const { name, description, goals, currentPhase, addDecision } = task.data;

    // If no project context exists and we have name/description/goals, create one
    if (!this.projectContext && name && description && goals) {
      await this.createProjectContext(name, description, goals);

      task.result = {
        message: "Project context created",
        projectName: name,
      };

      task.status = TaskStatus.COMPLETED;
      return task;
    }

    // Check if project context exists
    if (!this.projectContext) {
      task.status = TaskStatus.FAILED;
      task.error = "Project context not initialized";
      return task;
    }

    // Apply updates
    let updated = false;

    if (name) {
      this.projectContext.name = name;
      updated = true;
    }

    if (description) {
      this.projectContext.description = description;
      updated = true;
    }

    if (goals && Array.isArray(goals)) {
      this.projectContext.goals = goals;
      updated = true;
    }

    if (currentPhase) {
      this.projectContext.currentPhase = currentPhase;
      updated = true;
    }

    // Add decision if provided
    if (
      addDecision &&
      typeof addDecision === "object" &&
      addDecision.topic &&
      addDecision.decision
    ) {
      await this.addProjectDecision(
        addDecision.topic,
        addDecision.decision,
        addDecision.reasoning || "No reasoning provided",
      );
      updated = true;
    }

    if (updated) {
      // Save updated context
      await this.saveProjectContext();

      // Notify other agents about update
      await this.broadcastMessage(
        "project-context-updated",
        { projectContext: this.projectContext },
        MessageType.EVENT,
      );
    }

    task.result = {
      message: updated
        ? "Project context updated"
        : "No updates applied to project context",
      projectName: this.projectContext.name,
      currentPhase: this.projectContext.currentPhase,
    };

    task.status = TaskStatus.COMPLETED;
    return task;
  }

  /**
   * Handle decision making task
   *
   * @param task Task to handle
   * @returns Updated task
   */
  private async handleDecisionMaking(task: Task): Promise<Task> {
    // Extract decision data
    const { topic, options, criteria } = task.data;

    if (!topic || !options || !Array.isArray(options) || options.length === 0) {
      task.status = TaskStatus.FAILED;
      task.error = "Missing required decision data: topic and options";
      return task;
    }

    // For now, just pick the first option as a placeholder
    // In a real implementation, this would use an LLM or other decision algorithm
    const decision = options[0];
    const reasoning =
      "Selected the first available option (placeholder implementation)";

    // Add decision to project context
    if (this.projectContext) {
      await this.addProjectDecision(topic, decision, reasoning);
    }

    task.result = {
      message: "Decision made",
      topic,
      decision,
      reasoning,
    };

    task.status = TaskStatus.COMPLETED;
    return task;
  }

  /**
   * Handle broadcast messages
   */
  private async handleBroadcastMessage(data: any): Promise<void> {
    // Get the message
    const messageId = data.messageId;
    const message = messageBus.getMessage(messageId);

    if (!message) {
      return;
    }

    // Process message if needed
    console.log(`Master Agent received broadcast: ${message.subject}`);

    // The actual message handling is done in onHandleMessage
  }

  /**
   * Handle task created event
   */
  private async handleTaskCreated(data: any): Promise<void> {
    const taskId = data.taskId;
    const task = taskManager.getTask(taskId);

    if (!task) {
      return;
    }

    console.log(`Master Agent notified of new task: ${taskId} (${task.type})`);

    // Consider auto-assigning task here if it's unassigned
  }

  /**
   * Handle task completed event
   */
  private async handleTaskCompleted(data: any): Promise<void> {
    const taskId = data.taskId;
    const task = taskManager.getTask(taskId);

    if (!task) {
      return;
    }

    console.log(`Master Agent notified of completed task: ${taskId}`);

    // Update project context if we're tracking this task
    if (
      this.projectContext &&
      this.projectContext.currentTasks.includes(taskId)
    ) {
      // Remove from current tasks
      this.projectContext.currentTasks =
        this.projectContext.currentTasks.filter((id) => id !== taskId);

      // Add to completed tasks
      this.projectContext.completedTasks.push(taskId);

      // Save updated context
      await this.saveProjectContext();
    }
  }

  /**
   * Handle incoming messages from other agents
   */
  private async handleIncomingMessage(message: Message): Promise<void> {
    // Forward to the standard message handler
    await this.onHandleMessage(message);
  }

  /**
   * Handle project update messages
   */
  private async handleProjectUpdateMessage(message: Message): Promise<void> {
    // Extract update data from message content
    const updateData = message.content as any;

    if (!updateData) {
      console.log("Received empty project update message");
      return;
    }

    // Create a task to update the project context
    await taskManager.createTask({
      type: "project-context-update",
      priority: TaskPriority.HIGH,
      description: "Update project context with latest information",
      data: updateData,
      assignedTo: this.id,
      status: TaskStatus.PENDING,
    });
  }

  /**
   * Handle task completion messages
   */
  private async handleTaskCompletionMessage(message: Message): Promise<void> {
    // Extract task data from message
    const { taskId, result } = message.content as any;

    if (!taskId) {
      console.log("Received task completion message without task ID");
      return;
    }

    const task = taskManager.getTask(taskId);

    if (!task) {
      console.log(`Task not found: ${taskId}`);
      return;
    }

    // Check if we need to update our project context
    if (
      this.projectContext &&
      this.projectContext.currentTasks.includes(taskId)
    ) {
      // Remove from current tasks
      this.projectContext.currentTasks =
        this.projectContext.currentTasks.filter((id) => id !== taskId);

      // Add to completed tasks
      this.projectContext.completedTasks.push(taskId);

      // Save updated context
      await this.saveProjectContext();
    }

    // Send acknowledgment
    await this.sendMessage(
      message.sender,
      "task-completion-acknowledged",
      { taskId },
      MessageType.RESPONSE,
      {},
      message.id,
    );
  }

  /**
   * Handle agent registration messages
   */
  private async handleAgentRegistrationMessage(
    message: Message,
  ): Promise<void> {
    // Extract agent data
    const { agentId, capabilities } = message.content as any;

    if (!agentId) {
      console.log("Received agent registration message without agent ID");
      return;
    }

    console.log(
      `Agent registered: ${agentId} with capabilities:`,
      capabilities,
    );

    // Send acknowledgment
    await this.sendMessage(
      message.sender,
      "agent-registration-acknowledged",
      { agentId },
      MessageType.RESPONSE,
      {},
      message.id,
    );
  }

  /**
   * Handle decision request messages
   */
  private async handleDecisionRequestMessage(message: Message): Promise<void> {
    // Extract decision request data
    const { topic, options, criteria } = message.content as any;

    if (!topic || !options || !Array.isArray(options) || options.length === 0) {
      console.log("Received invalid decision request message");

      // Send error response
      await this.sendMessage(
        message.sender,
        "decision-request-error",
        { error: "Invalid decision request data" },
        MessageType.RESPONSE,
        {},
        message.id,
      );

      return;
    }

    // Create a task to make the decision
    const task = await taskManager.createTask({
      type: "decision-making",
      priority: TaskPriority.HIGH,
      description: `Make decision on: ${topic}`,
      data: { topic, options, criteria },
      assignedTo: this.id,
      status: TaskStatus.PENDING,
    });

    // Wait for the task to complete
    // In a real implementation, we would use a callback mechanism instead of polling
    let decisionTask: Task | undefined;
    let attempts = 0;

    while (attempts < 30) {
      decisionTask = taskManager.getTask(task.id);

      if (decisionTask?.status === TaskStatus.COMPLETED) {
        break;
      }

      // Wait for 1 second
      await new Promise((resolve) => setTimeout(resolve, 1000));
      attempts += 1;
    }

    if (decisionTask?.status === TaskStatus.COMPLETED && decisionTask.result) {
      // Send response with decision
      await this.sendMessage(
        message.sender,
        "decision-response",
        decisionTask.result,
        MessageType.RESPONSE,
        {},
        message.id,
      );
    } else {
      // Send error response
      await this.sendMessage(
        message.sender,
        "decision-request-error",
        { error: "Decision timed out or failed" },
        MessageType.RESPONSE,
        {},
        message.id,
      );
    }
  }
}

// Export a singleton instance
export const masterAgent = new MasterAgent();

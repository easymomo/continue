/**
 * ResearchTaskManager
 *
 * Provides specialized task management capabilities for research agents.
 * Manages research tasks through their lifecycle, including stage transitions,
 * metadata tracking, and findings management.
 */

import { TaskManager } from "../../../memory/tasks/index.js";
import { Task } from "../../../memory/types.js";

/**
 * Research workflow stages
 */
export enum ResearchWorkflowStage {
  PLANNING = "planning",
  GATHERING = "gathering",
  ANALYZING = "analyzing",
  SYNTHESIZING = "synthesizing",
  REPORTING = "reporting",
  COMPLETED = "completed",
}

/**
 * Manages research tasks through their lifecycle
 */
export class ResearchTaskManager {
  private taskManager: TaskManager;
  private agentId: string;
  private currentTaskId?: string;

  constructor(taskManager: TaskManager, agentId: string) {
    this.taskManager = taskManager;
    this.agentId = agentId;
  }

  /**
   * Create a new research task
   */
  async createResearchTask(
    topic: string,
    description: string,
    parentId?: string,
  ): Promise<string> {
    const taskData = {
      type: "research",
      name: `Research: ${topic}`,
      description,
      status: "created",
      metadata: {
        topic,
        stage: ResearchWorkflowStage.PLANNING,
        agentId: this.agentId,
        createdAt: Date.now(),
      },
      parentId,
    };

    const taskId = parentId
      ? await this.taskManager.createChildTask(parentId, taskData)
      : await this.taskManager.createTask(taskData);

    this.currentTaskId = taskId;
    return taskId;
  }

  /**
   * Start a research task
   */
  async startResearchTask(taskId: string): Promise<boolean> {
    const result = await this.taskManager.startTask(taskId);
    if (result) {
      this.currentTaskId = taskId;
    }
    return result;
  }

  /**
   * Create a research subtask
   */
  async createResearchSubtask(
    parentId: string,
    subtopic: string,
    description: string,
  ): Promise<string> {
    return this.createResearchTask(subtopic, description, parentId);
  }

  /**
   * Complete a research task
   */
  async completeResearchTask(
    taskId: string,
    summary: string,
  ): Promise<boolean> {
    // Update task metadata with summary
    await this.taskManager.updateTaskMetadata(taskId, {
      summary,
      completedAt: Date.now(),
    });

    const result = await this.taskManager.completeTask(taskId);

    // If we completed the current task, clear it
    if (result && this.currentTaskId === taskId) {
      this.currentTaskId = undefined;
    }

    return result;
  }

  /**
   * Update research task progress
   */
  async updateResearchTaskProgress(
    taskId: string,
    progressNote: string,
    progressPercent?: number,
  ): Promise<boolean> {
    // Add progress note to task
    await this.taskManager.updateTaskMetadata(taskId, {
      progressNotes: progressNote,
      lastUpdated: Date.now(),
    });

    // Update progress percentage if provided
    if (progressPercent !== undefined) {
      await this.taskManager.updateTaskProgress(taskId, progressPercent, {
        incrementProgress: false,
      });
    }

    return true;
  }

  /**
   * Transition research stage
   */
  async transitionResearchStage(
    taskId: string,
    newStage: ResearchWorkflowStage,
  ): Promise<boolean> {
    const task = await this.taskManager.getTask(taskId);

    // Record previous stage
    const previousStage =
      task.metadata?.stage || ResearchWorkflowStage.PLANNING;

    // Update task metadata with new stage
    await this.taskManager.updateTaskMetadata(taskId, {
      stage: newStage,
      stageTransitionAt: Date.now(),
      previousStage,
    });

    // If transitioning to COMPLETED, complete the task
    if (newStage === ResearchWorkflowStage.COMPLETED) {
      return this.taskManager.completeTask(taskId);
    }

    return true;
  }

  /**
   * Get current research task
   */
  async getCurrentTask(): Promise<Task | undefined> {
    if (!this.currentTaskId) {
      return undefined;
    }

    try {
      return await this.taskManager.getTask(this.currentTaskId);
    } catch (error) {
      console.error("Error retrieving current task:", error);
      return undefined;
    }
  }

  /**
   * Get research findings
   */
  async getResearchFindings(taskId: string): Promise<any[]> {
    try {
      // Get task context
      const context = await this.taskManager.getTaskContext(taskId);

      // Extract findings from context
      return context.findings || [];
    } catch (error) {
      console.error("Error retrieving research findings:", error);
      return [];
    }
  }

  /**
   * Add research finding
   */
  async addResearchFinding(taskId: string, finding: any): Promise<boolean> {
    try {
      // Get current task context
      const context = await this.taskManager.getTaskContext(taskId);

      // Add finding to context
      const findings = context.findings || [];
      findings.push({
        ...finding,
        timestamp: Date.now(),
      });

      // Update context with new findings
      await this.taskManager.updateTaskMetadata(taskId, {
        findings,
      });

      return true;
    } catch (error) {
      console.error("Error adding research finding:", error);
      return false;
    }
  }
}
